'use server'

import { getServiceSupabaseClient, getAuthUser } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// ── Guard: current session must belong to an admin profile ────────────────────

async function requireAdmin() {
  const user = await getAuthUser()
  if (!user) throw new Error('Not authenticated')

  const supabase = getServiceSupabaseClient()
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') throw new Error('Forbidden: admin only')
  return supabase
}

// ── Actions ───────────────────────────────────────────────────────────────────

export type ActionResult = { ok: true } | { ok: false; error: string }

/** Set subscription_status = 'active', subscription_ends_at = now + 30 days */
export async function activateSubscription(userId: string): Promise<ActionResult> {
  try {
    const supabase = await requireAdmin()
    const endsAt   = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()

    const { error } = await supabase
      .from('profiles')
      .update({
        subscription_status:  'active',
        subscription_ends_at: endsAt,
        updated_at:           new Date().toISOString(),
      })
      .eq('id', userId)

    if (error) throw new Error(error.message)
    revalidatePath('/admin')
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Unknown error' }
  }
}

/** Set subscription_status = 'expired' */
export async function expireSubscription(userId: string): Promise<ActionResult> {
  try {
    const supabase = await requireAdmin()

    const { error } = await supabase
      .from('profiles')
      .update({
        subscription_status: 'expired',
        updated_at:          new Date().toISOString(),
      })
      .eq('id', userId)

    if (error) throw new Error(error.message)
    revalidatePath('/admin')
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Unknown error' }
  }
}

/** Set subscription_status = 'trial', trial_ends_at = now + N days (default 14) */
export async function startTrial(userId: string, days = 14): Promise<ActionResult> {
  try {
    const supabase = await requireAdmin()
    const endsAt   = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString()

    const { error } = await supabase
      .from('profiles')
      .update({
        subscription_status: 'trial',
        trial_ends_at:       endsAt,
        updated_at:          new Date().toISOString(),
      })
      .eq('id', userId)

    if (error) throw new Error(error.message)
    revalidatePath('/admin')
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Unknown error' }
  }
}
