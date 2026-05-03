export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { getAuthUser, getServerSupabaseClient } from '@/lib/supabase/server'
import { checkAccess } from '@/lib/subscription'
import { BillingClient } from '@/components/BillingClient'
import type { PaymentRequest, Profile } from '@/lib/types'

async function getBillingData() {
  const user = await getAuthUser()
  if (!user) redirect('/login')

  const supabase = await getServerSupabaseClient()

  const [profileRes, requestsRes] = await Promise.all([
    supabase
      .from('profiles')
      .select('subscription_status, trial_ends_at, subscription_ends_at, full_name')
      .eq('id', user.id)
      .single(),
    supabase
      .from('payment_requests')
      .select('id, user_id, status, notes, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5),
  ])

  const profile    = profileRes.data
  const requests   = (requestsRes.data ?? []) as PaymentRequest[]
  const access     = checkAccess(profile)
  const hasPending = requests.some((r) => r.status === 'pending')
  const lastRequest = requests[0] ?? null

  return {
    email:       user.email ?? '',
    fullName:    profile?.full_name ?? '',
    access,
    requests,
    hasPending,
    lastRequest,
  }
}

export default async function BillingPage() {
  const data = await getBillingData()
  return <BillingClient {...data} />
}
