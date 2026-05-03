// ── SQL: Run this entire block in Supabase SQL Editor ─────────────────────────
//
// -- 1. Ensure profiles has all required columns
// ALTER TABLE public.profiles
//   ADD COLUMN IF NOT EXISTS role                 TEXT DEFAULT 'user',
//   ADD COLUMN IF NOT EXISTS subscription_status  TEXT NOT NULL DEFAULT 'trial',
//   ADD COLUMN IF NOT EXISTS trial_ends_at         TIMESTAMPTZ,
//   ADD COLUMN IF NOT EXISTS subscription_ends_at  TIMESTAMPTZ,
//   ADD COLUMN IF NOT EXISTS created_at            TIMESTAMPTZ DEFAULT NOW();
//
// -- Ensure valid statuses only
// ALTER TABLE public.profiles
//   DROP CONSTRAINT IF EXISTS profiles_subscription_status_check;
// ALTER TABLE public.profiles
//   ADD CONSTRAINT profiles_subscription_status_check
//   CHECK (subscription_status IN ('free', 'trial', 'active', 'expired'));
//
// -- 2. Auto-create profile on signup (30-day trial)
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
//     NOW(), NOW()
//   )
//   ON CONFLICT (id) DO NOTHING;
//   RETURN NEW;
// END;
// $$;
// DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
// CREATE TRIGGER on_auth_user_created
//   AFTER INSERT ON auth.users
//   FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
//
// -- 3. payment_requests table
// CREATE TABLE IF NOT EXISTS public.payment_requests (
//   id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
//   user_id    UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
//   status     TEXT NOT NULL DEFAULT 'pending'
//              CHECK (status IN ('pending', 'approved', 'rejected')),
//   notes      TEXT,
//   created_at TIMESTAMPTZ NOT NULL DEFAULT now()
// );
// CREATE INDEX IF NOT EXISTS pr_user_idx   ON public.payment_requests(user_id);
// CREATE INDEX IF NOT EXISTS pr_status_idx ON public.payment_requests(status);
// ALTER TABLE public.payment_requests ENABLE ROW LEVEL SECURITY;
// CREATE POLICY "Users read own requests"   ON public.payment_requests
//   FOR SELECT USING (auth.uid() = user_id);
// CREATE POLICY "Users insert own requests" ON public.payment_requests
//   FOR INSERT WITH CHECK (auth.uid() = user_id);
//
// -- 4. Promote yourself to admin
// UPDATE public.profiles SET role = 'admin' WHERE id = '<your-user-id>';
//
// ─────────────────────────────────────────────────────────────────────────────

import { getServerSupabaseClient } from '@/lib/supabase/server'
import type { SubscriptionStatus } from '@/lib/types'

export interface SubscriptionAccess {
  allowed:  boolean
  status:   SubscriptionStatus
  daysLeft: number          // negative means expired
}

/** Pure helper — call with raw profile row from any context (middleware, pages). */
export function checkAccess(profile: {
  subscription_status: string | null
  trial_ends_at:       string | null
  subscription_ends_at: string | null
} | null | undefined): SubscriptionAccess {
  if (!profile) return { allowed: false, status: 'free', daysLeft: 0 }

  const now    = new Date()
  const status = (profile.subscription_status ?? 'free') as SubscriptionStatus

  if (status === 'active') {
    if (!profile.subscription_ends_at) return { allowed: true,  status, daysLeft: 999 }
    const end  = new Date(profile.subscription_ends_at)
    const days = Math.ceil((end.getTime() - now.getTime()) / 86_400_000)
    return { allowed: days > 0, status: days > 0 ? 'active' : 'expired', daysLeft: days }
  }

  if (status === 'trial') {
    if (!profile.trial_ends_at) return { allowed: true, status, daysLeft: 999 }
    const end  = new Date(profile.trial_ends_at)
    const days = Math.ceil((end.getTime() - now.getTime()) / 86_400_000)
    return { allowed: days > 0, status: days > 0 ? 'trial' : 'expired', daysLeft: days }
  }

  return { allowed: false, status, daysLeft: 0 }
}

/** Server-side: fetch the current user's subscription access. */
export async function getUserSubscriptionAccess(): Promise<SubscriptionAccess> {
  try {
    const supabase = await getServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { allowed: false, status: 'free', daysLeft: 0 }

    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_status, trial_ends_at, subscription_ends_at')
      .eq('id', user.id)
      .single()

    return checkAccess(profile)
  } catch {
    return { allowed: false, status: 'free', daysLeft: 0 }
  }
}

/** Legacy alias — returns 'pro' when allowed, 'free' otherwise. */
export async function getUserSubscription(): Promise<'free' | 'pro'> {
  const { allowed } = await getUserSubscriptionAccess()
  return allowed ? 'pro' : 'free'
}
