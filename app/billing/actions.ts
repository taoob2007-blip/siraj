'use server'

import { getServerSupabaseClient, getAuthUser } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { ActionResult } from '@/app/admin/actions'

/**
 * Insert a payment_request for the current user.
 * Prevents duplicates: if there is already a 'pending' request, returns an error.
 */
export async function submitPaymentRequest(): Promise<ActionResult> {
  try {
    const user = await getAuthUser()
    if (!user) throw new Error('Not authenticated')

    const supabase = await getServerSupabaseClient()

    // Prevent duplicate pending requests
    const { data: existing } = await supabase
      .from('payment_requests')
      .select('id, status')
      .eq('user_id', user.id)
      .eq('status', 'pending')
      .maybeSingle()

    if (existing) throw new Error('You already have a pending payment request. Please wait for admin approval.')

    const { error } = await supabase
      .from('payment_requests')
      .insert({ user_id: user.id, status: 'pending' })

    if (error) throw new Error(error.message)

    revalidatePath('/billing')
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Unknown error' }
  }
}
