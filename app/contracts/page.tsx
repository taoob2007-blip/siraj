export const dynamic = 'force-dynamic'

import { getServerSupabaseClient } from '@/lib/supabase/server'
import { ContractsClient } from '@/components/ContractsClient'

async function getData() {
  try {
    const supabase = await getServerSupabaseClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { contracts: [], rfqs: [], tableExists: false }

    // Attempt to fetch contracts — table may not exist yet
    const [contractsResult, rfqsResult] = await Promise.all([
      supabase.from('contracts').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('rfqs').select('id, title').eq('user_id', user.id),
    ])

    return {
      contracts: contractsResult.data ?? [],
      rfqs: rfqsResult.data ?? [],
      tableExists: !contractsResult.error,
    }
  } catch {
    return { contracts: [], rfqs: [], tableExists: false }
  }
}

export default async function ContractsPage() {
  const { contracts, rfqs, tableExists } = await getData()
  return <ContractsClient contracts={contracts} rfqs={rfqs} tableExists={tableExists} />
}
