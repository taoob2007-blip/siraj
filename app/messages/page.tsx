export const dynamic = 'force-dynamic'

import { getServerSupabaseClient } from '@/lib/supabase/server'
import { MessagesClient } from '@/components/MessagesClient'

async function getData() {
  try {
    const supabase = await getServerSupabaseClient()
    const [{ data: rfqs }, { data: responses }] = await Promise.all([
      supabase.from('rfqs').select('id, title, description, status').order('created_at', { ascending: false }),
      supabase.from('responses').select('id, rfq_id, supplier_email, price, delivery_days, answers, created_at').order('created_at', { ascending: false }),
    ])
    return { rfqs: rfqs ?? [], responses: responses ?? [] }
  } catch {
    return { rfqs: [], responses: [] }
  }
}

export default async function MessagesPage() {
  const { rfqs, responses } = await getData()
  return <MessagesClient rfqs={rfqs} responses={responses} />
}
