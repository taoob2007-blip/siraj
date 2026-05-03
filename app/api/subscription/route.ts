import { NextResponse } from 'next/server'
import { getAuthUser, getServerSupabaseClient } from '@/lib/supabase/server'
import { checkAccess } from '@/lib/subscription'

/**
 * GET /api/subscription
 * Returns the current user's live subscription status directly from the DB.
 * Used by the client to poll for activation after a payment is approved.
 */
export async function GET() {
  const user = await getAuthUser()
  if (!user) {
    return NextResponse.json({ allowed: false, status: 'free' }, { status: 401 })
  }

  const supabase = await getServerSupabaseClient()
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('subscription_status, trial_ends_at, subscription_ends_at')
    .eq('id', user.id)
    .single()

  if (error) {
    console.error('[api/subscription] profile fetch error:', error.message)
    return NextResponse.json({ allowed: false, status: 'free' }, { status: 500 })
  }

  const access = checkAccess(profile)

  console.log('[api/subscription] USER:', user.id, '| SUB:', {
    status:    access.status,
    allowed:   access.allowed,
    isActive:  access.isActive,
    isTrial:   access.isTrial,
    daysLeft:  access.daysLeft,
  })

  return NextResponse.json({
    allowed:   access.allowed,
    isActive:  access.isActive,
    isTrial:   access.isTrial,
    status:    access.status,
    expiresAt: access.expiresAt?.toISOString() ?? null,
    daysLeft:  access.daysLeft,
  })
}
