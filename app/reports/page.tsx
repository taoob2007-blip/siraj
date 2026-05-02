export const dynamic = 'force-dynamic'

import { getServerSupabaseClient } from '@/lib/supabase/server'
import { ReportsClient } from '@/components/ReportsClient'

interface ContractRow {
  id: string
  status: string
  price: number | null
  delivery_days: number | null
  supplier_email: string
  created_at: string
  buyer_signature: string | null
  supplier_signature: string | null
}

async function getData() {
  try {
    const supabase = await getServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const [
      { data: contracts },
      { data: rfqs },
    ] = await Promise.all([
      supabase
        .from('contracts')
        .select('id, status, price, delivery_days, supplier_email, created_at, buyer_signature, supplier_signature')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false }),
      supabase.from('rfqs').select('id, status').eq('user_id', user.id),
    ])

    return {
      contracts: (contracts ?? []) as ContractRow[],
      totalRFQs: rfqs?.length ?? 0,
      activeRFQs: rfqs?.filter((r) => r.status === 'active').length ?? 0,
    }
  } catch {
    return null
  }
}

export default async function ReportsPage() {
  const data = await getData()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">Reports</h1>
        <p className="text-xs text-gray-600 mt-0.5">Financial analytics and supplier performance</p>
      </div>
      <ReportsClient
        contracts={data?.contracts ?? []}
        totalRFQs={data?.totalRFQs ?? 0}
        activeRFQs={data?.activeRFQs ?? 0}
      />
    </div>
  )
}
