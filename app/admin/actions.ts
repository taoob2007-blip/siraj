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

// ── Payment request actions ───────────────────────────────────────────────────

/** Approve a payment request — sets request to 'approved' and activates subscription for 30 days */
export async function approvePaymentRequest(requestId: string): Promise<ActionResult> {
  try {
    const supabase = await requireAdmin()

    // Get the payment request to find the user_id
    const { data: req, error: fetchErr } = await supabase
      .from('payment_requests')
      .select('id, user_id, status')
      .eq('id', requestId)
      .single()

    if (fetchErr || !req) throw new Error('Payment request not found')
    if (req.status !== 'pending') throw new Error('Request is no longer pending')

    const endsAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()

    // Update request status + activate subscription in parallel
    const [reqUpdate, profileUpdate] = await Promise.all([
      supabase
        .from('payment_requests')
        .update({ status: 'approved' })
        .eq('id', requestId),
      supabase
        .from('profiles')
        .update({
          subscription_status:  'active',
          subscription_ends_at: endsAt,
          updated_at:           new Date().toISOString(),
        })
        .eq('id', req.user_id),
    ])

    if (reqUpdate.error)     throw new Error(reqUpdate.error.message)
    if (profileUpdate.error) throw new Error(profileUpdate.error.message)

    // Bust server-component caches for both the admin view and the user's own pages.
    revalidatePath('/admin')
    revalidatePath('/', 'layout')
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Unknown error' }
  }
}

/** Reject a payment request — sets request to 'rejected' (subscription unchanged) */
export async function rejectPaymentRequest(requestId: string): Promise<ActionResult> {
  try {
    const supabase = await requireAdmin()

    const { error } = await supabase
      .from('payment_requests')
      .update({ status: 'rejected' })
      .eq('id', requestId)

    if (error) throw new Error(error.message)

    revalidatePath('/admin')
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Unknown error' }
  }
}

// ── Actions ───────────────────────────────────────────────────────────────────

export type ActionResult = { ok: true } | { ok: false; error: string }

/** Set subscription_status = 'active', subscription_ends_at = now + 30 days, trial_ends_at = null */
export async function activateSubscription(userId: string): Promise<ActionResult> {
  try {
    const supabase = await requireAdmin()
    const endsAt   = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()

    const { error } = await supabase
      .from('profiles')
      .update({
        subscription_status:  'active',
        subscription_ends_at: endsAt,
        trial_ends_at:        null,
        updated_at:           new Date().toISOString(),
      })
      .eq('id', userId)

    if (error) throw new Error(error.message)
    revalidatePath('/admin')
    revalidatePath('/', 'layout')
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
    revalidatePath('/', 'layout')
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Unknown error' }
  }
}

/** Set subscription_status = 'trial', trial_ends_at = now + 14 days, subscription_ends_at = null */
export async function startTrial(userId: string, days = 14): Promise<ActionResult> {
  try {
    const supabase = await requireAdmin()
    const endsAt   = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString()

    const { error } = await supabase
      .from('profiles')
      .update({
        subscription_status:  'trial',
        trial_ends_at:        endsAt,
        subscription_ends_at: null,
        updated_at:           new Date().toISOString(),
      })
      .eq('id', userId)

    if (error) throw new Error(error.message)
    revalidatePath('/admin')
    revalidatePath('/', 'layout')
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Unknown error' }
  }
}
