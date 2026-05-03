// ── SQL to run in Supabase SQL Editor ──────────────────────────────────────────
//
// -- Add new columns
// ALTER TABLE public.profiles
//   ADD COLUMN IF NOT EXISTS trial_ends_at        TIMESTAMPTZ,
//   ADD COLUMN IF NOT EXISTS subscription_ends_at  TIMESTAMPTZ;
//
// -- Drop old constraint and re-add with full status set
// ALTER TABLE public.profiles
//   DROP CONSTRAINT IF EXISTS profiles_subscription_status_check;
// ALTER TABLE public.profiles
//   ADD CONSTRAINT profiles_subscription_status_check
//   CHECK (subscription_status IN ('free', 'trial', 'active', 'expired'));
//
// -- Grant admin role to yourself:
// UPDATE public.profiles SET role = 'admin' WHERE id = '<your-user-id>';
//
// ─────────────────────────────────────────────────────────────────────────────

import { getServerSupabaseClient } from '@/lib/supabase/server'
import type { SubscriptionStatus } from '@/lib/types'

/** Returns 'pro' (access granted) or 'free' (no access).
 *  Treats active + valid trial as pro-equivalent. */
export async function getUserSubscription(): Promise<'free' | 'pro'> {
  try {
    const supabase = await getServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return 'free'

    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_status, trial_ends_at, subscription_ends_at')
      .eq('id', user.id)
      .single()

    if (!profile) return 'free'
    const status = profile.subscription_status as SubscriptionStatus
    const now    = new Date()

    if (status === 'active') {
      // active with a future end date, or no end date = unlimited
      if (!profile.subscription_ends_at) return 'pro'
      return new Date(profile.subscription_ends_at) > now ? 'pro' : 'free'
    }
    if (status === 'trial') {
      if (!profile.trial_ends_at) return 'pro'
      return new Date(profile.trial_ends_at) > now ? 'pro' : 'free'
    }

    return 'free'
  } catch {
    return 'free'
  }
}
