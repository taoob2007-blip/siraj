export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { getUserSubscription } from '@/lib/subscription'
import { getServerSupabaseClient } from '@/lib/supabase/server'
import { ComparisonClient } from '@/components/ComparisonClient'

async function getData() {
  try {
    const supabase = await getServerSupabaseClient()
    const [{ data: rfqs }, { data: responses }] = await Promise.all([
      supabase.from('rfqs').select('id, title, status').order('created_at', { ascending: false }),
      supabase.from('responses').select('id, rfq_id, supplier_email, price, delivery_days, answers, created_at'),
    ])
    return { rfqs: rfqs ?? [], responses: responses ?? [] }
  } catch {
    return { rfqs: [], responses: [] }
  }
}

export default async function ComparisonsPage() {
  const subscription = await getUserSubscription()
  if (subscription !== 'pro') redirect('/?upgrade=1')

  const { rfqs, responses } = await getData()
  return <ComparisonClient rfqs={rfqs} responses={responses} />
}
