// ── SQL to run in Supabase SQL Editor ──────────────────────────────────────────
//
// ALTER TABLE public.profiles
//   ADD COLUMN IF NOT EXISTS subscription_status TEXT NOT NULL DEFAULT 'free'
//   CHECK (subscription_status IN ('free', 'pro'));
//
// ─────────────────────────────────────────────────────────────────────────────

import { getServerSupabaseClient } from '@/lib/supabase/server'

export type SubscriptionStatus = 'free' | 'pro'

/** Returns the current user's subscription tier. Falls back to 'free' on any error. */
export async function getUserSubscription(): Promise<SubscriptionStatus> {
  try {
    const supabase = await getServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return 'free'

    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_status')
      .eq('id', user.id)
      .single()

    return profile?.subscription_status === 'pro' ? 'pro' : 'free'
  } catch {
    return 'free'
  }
}

/** Server action — upgrade a user to pro (used in tests / admin). */
export async function setUserSubscription(
  userId: string,
  status: SubscriptionStatus,
): Promise<void> {
  const supabase = await getServerSupabaseClient()
  await supabase
    .from('profiles')
    .upsert({ id: userId, subscription_status: status, updated_at: new Date().toISOString() })
}
