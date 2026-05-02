export const dynamic = 'force-dynamic'

import { createClient } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'
import { SupplierSigningClient } from '@/components/SupplierSigningClient'

interface ContractForSigning {
  id: string
  rfq_id: string
  supplier_email: string
  price: number | null
  delivery_days: number | null
  status: string
  buyer_signature: string | null
  supplier_signature: string | null
  signing_token: string
  created_at: string
}

export default async function SupplierSignPage({
  params,
}: {
  params: { token: string }
}) {
  // Service role — this page is public, no user session
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  const { data: contract } = await supabase
    .from('contracts')
    .select('id, rfq_id, supplier_email, price, delivery_days, status, buyer_signature, supplier_signature, signing_token, created_at')
    .eq('signing_token', params.token)
    .maybeSingle()

  if (!contract) notFound()

  const { data: rfq } = await supabase
    .from('rfqs')
    .select('id, title, description')
    .eq('id', (contract as ContractForSigning).rfq_id)
    .maybeSingle()

  return (
    <SupplierSigningClient
      contract={contract as ContractForSigning}
      rfqTitle={rfq?.title ?? 'Request for Quotation'}
      rfqDescription={rfq?.description ?? null}
      token={params.token}
    />
  )
}
