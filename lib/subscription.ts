// ── SQL: Run every block in Supabase SQL Editor (safe to re-run) ──────────────
//
// ── STEP 1: Ensure all required columns exist ─────────────────────────────────
// ALTER TABLE public.profiles
//   ADD COLUMN IF NOT EXISTS role                 TEXT        NOT NULL DEFAULT 'user',
//   ADD COLUMN IF NOT EXISTS subscription_status  TEXT        NOT NULL DEFAULT 'trial',
//   ADD COLUMN IF NOT EXISTS trial_ends_at         TIMESTAMPTZ,
//   ADD COLUMN IF NOT EXISTS subscription_ends_at  TIMESTAMPTZ,
//   ADD COLUMN IF NOT EXISTS created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
//   ADD COLUMN IF NOT EXISTS updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW();
//
// ALTER TABLE public.profiles
//   DROP CONSTRAINT IF EXISTS profiles_subscription_status_check;
// ALTER TABLE public.profiles
//   ADD CONSTRAINT profiles_subscription_status_check
//   CHECK (subscription_status IN ('free', 'trial', 'active', 'expired'));
//
// ── STEP 2: Fix existing users — give 30-day trial to free/expired users ──────
// Users who are 'free', 'expired', or stuck as 'trial' with no expiry date
// get a fresh 30-day trial window.
//
// UPDATE public.profiles
// SET
//   subscription_status = 'trial',
//   trial_ends_at       = NOW() + INTERVAL '30 days',
//   updated_at          = NOW()
// WHERE
//   subscription_status IN ('free', 'expired')
//   OR (subscription_status = 'trial' AND trial_ends_at IS NULL)
//   OR (subscription_status = 'trial' AND trial_ends_at < NOW());
//
// ── STEP 3: Fix 'active' users with NULL or already-expired subscription_ends_at
// These users manually had status set to 'active' but no date was provided.
// Give them 30 days from today.
//
// UPDATE public.profiles
// SET
//   subscription_ends_at = NOW() + INTERVAL '30 days',
//   updated_at           = NOW()
// WHERE
//   subscription_status = 'active'
//   AND (subscription_ends_at IS NULL OR subscription_ends_at < NOW());
//
// ── STEP 4: Auto-trial trigger — fires on every new signup ───────────────────
// ON CONFLICT DO UPDATE only overwrites if the profile is still on 'free'
// (so existing trial/active users are never downgraded by the trigger).
//
// CREATE OR REPLACE FUNCTION public.handle_new_user()
// RETURNS TRIGGER LANGUAGE plpgsql
// SECURITY DEFINER SET search_path = public AS $$
// BEGIN
//   INSERT INTO public.profiles (
//     id, full_name, role,
//     subscription_status, trial_ends_at,
//     created_at, updated_at
//   ) VALUES (
//     NEW.id,
//     COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
//     'user',
//     'trial',
//     NOW() + INTERVAL '30 days',
//     NOW(),
//     NOW()
//   )
//   ON CONFLICT (id) DO UPDATE
//     SET subscription_status = 'trial',
//         trial_ends_at       = NOW() + INTERVAL '30 days',
//         updated_at          = NOW()
//   WHERE profiles.subscription_status = 'free';
//   RETURN NEW;
// END;
// $$;
//
// DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
// CREATE TRIGGER on_auth_user_created
//   AFTER INSERT ON auth.users
//   FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
//
// ── STEP 5: payment_requests table (idempotent) ───────────────────────────────
// CREATE TABLE IF NOT EXISTS public.payment_requests (
//   id         UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
//   user_id    UUID        REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
//   amount     NUMERIC(10,2) NOT NULL DEFAULT 299,
//   status     TEXT        NOT NULL DEFAULT 'pending'
//              CHECK (status IN ('pending', 'approved', 'rejected')),
//   notes      TEXT,
//   created_at TIMESTAMPTZ NOT NULL DEFAULT now()
// );
// ALTER TABLE IF EXISTS public.payment_requests
//   ADD COLUMN IF NOT EXISTS amount NUMERIC(10,2) NOT NULL DEFAULT 299;
// CREATE INDEX IF NOT EXISTS pr_user_idx   ON public.payment_requests(user_id);
// CREATE INDEX IF NOT EXISTS pr_status_idx ON public.payment_requests(status);
// ALTER TABLE public.payment_requests ENABLE ROW LEVEL SECURITY;
// DO $$ BEGIN
//   IF NOT EXISTS (
//     SELECT 1 FROM pg_policies
//     WHERE tablename = 'payment_requests' AND policyname = 'Users read own requests'
//   ) THEN
//     CREATE POLICY "Users read own requests" ON public.payment_requests
//       FOR SELECT USING (auth.uid() = user_id);
//   END IF;
//   IF NOT EXISTS (
//     SELECT 1 FROM pg_policies
//     WHERE tablename = 'payment_requests' AND policyname = 'Users insert own requests'
//   ) THEN
//     CREATE POLICY "Users insert own requests" ON public.payment_requests
//       FOR INSERT WITH CHECK (auth.uid() = user_id);
//   END IF;
// END $$;
//
// ── STEP 6: Promote yourself to admin ────────────────────────────────────────
// UPDATE public.profiles SET role = 'admin' WHERE id = '<your-user-id>';
//
// ─────────────────────────────────────────────────────────────────────────────

import { getServerSupabaseClient } from '@/lib/supabase/server'
import type { SubscriptionStatus } from '@/lib/types'

export interface SubscriptionAccess {
  /** True when the user has a valid (non-expired) subscription or trial. */
  allowed:   boolean
  /** True when access comes from an active paid subscription. */
  isActive:  boolean
  /** True when access comes from a free trial. */
  isTrial:   boolean
  /** The exact timestamp when access ends; null for admin grants with no end date. */
  expiresAt: Date | null
  // ── Kept for backward compatibility ──────────────────────────────────────
  /** Effective status after expiry evaluation (may differ from raw DB column). */
  status:    SubscriptionStatus
  /** Days until expiry (9999 for no-expiry admin grants, 0 when expired). */
  daysLeft:  number
}

/**
 * Pure, synchronous access check. Safe to call from middleware, server
 * components, server actions, or client code that already has the profile.
 *
 * Access rules:
 *   active  + subscription_ends_at > now  → allowed  (isActive)
 *   active  + subscription_ends_at = null → allowed  (isActive, admin grant)
 *   trial   + trial_ends_at > now         → allowed  (isTrial)
 *   Everything else                       → denied
 */
export function checkAccess(profile: {
  subscription_status:  string | null
  trial_ends_at:        string | null
  subscription_ends_at: string | null
} | null | undefined): SubscriptionAccess {
  const DENIED = (status: SubscriptionStatus = 'free'): SubscriptionAccess => ({
    allowed: false, isActive: false, isTrial: false,
    expiresAt: null, status, daysLeft: 0,
  })

  if (!profile) return DENIED()

  const now    = new Date()
  const status = (profile.subscription_status ?? 'free') as SubscriptionStatus

  // ── Active subscription ───────────────────────────────────────────────────
  if (status === 'active') {
    const expiresAt = profile.subscription_ends_at
      ? new Date(profile.subscription_ends_at)
      : null

    // null expiry = admin grant with no end date → treat as perpetually allowed
    if (expiresAt !== null && expiresAt <= now) {
      return DENIED('expired')
    }

    const daysLeft = expiresAt
      ? Math.ceil((expiresAt.getTime() - now.getTime()) / 86_400_000)
      : 9999

    return {
      allowed: true, isActive: true, isTrial: false,
      expiresAt, status: 'active', daysLeft,
    }
  }

  // ── Free trial ────────────────────────────────────────────────────────────
  if (status === 'trial') {
    if (!profile.trial_ends_at) {
      // Data inconsistency — trial with no expiry; treat as expired
      return DENIED('expired')
    }

    const expiresAt = new Date(profile.trial_ends_at)
    const daysLeft  = Math.ceil((expiresAt.getTime() - now.getTime()) / 86_400_000)

    if (daysLeft <= 0) return DENIED('expired')

    return {
      allowed: true, isActive: false, isTrial: true,
      expiresAt, status: 'trial', daysLeft,
    }
  }

  // ── Free / expired ────────────────────────────────────────────────────────
  return DENIED(status === 'expired' ? 'expired' : 'free')
}

/** Server-side: fetch the current user's subscription access in one call. */
export async function getUserSubscriptionAccess(): Promise<SubscriptionAccess> {
  try {
    const supabase = await getServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return {
        allowed: false, isActive: false, isTrial: false,
        expiresAt: null, status: 'free', daysLeft: 0,
      }
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_status, trial_ends_at, subscription_ends_at')
      .eq('id', user.id)
      .single()

    return checkAccess(profile)
  } catch {
    return {
      allowed: false, isActive: false, isTrial: false,
      expiresAt: null, status: 'free', daysLeft: 0,
    }
  }
}

/** Legacy alias — returns 'pro' when allowed, 'free' otherwise. */
export async function getUserSubscription(): Promise<'free' | 'pro'> {
  const { allowed } = await getUserSubscriptionAccess()
  return allowed ? 'pro' : 'free'
}
