export const dynamic = 'force-dynamic'

import { getServerSupabaseClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, FileSignature } from 'lucide-react'
import { ContractDetailClient } from '@/components/ContractDetailClient'

// ── Types ──────────────────────────────────────────────────────────────────────

interface ContractRow {
  id: string
  rfq_id: string
  user_id: string
  supplier_email: string
  price: number | null
  delivery_days: number | null
  status: 'pending' | 'signed' | 'cancelled'
  notes: string | null
  created_at: string
  buyer_signature: string | null
  signed_at: string | null
}

interface RFQRow {
  id: string
  title: string
  description: string | null
}

// ── Data fetch ─────────────────────────────────────────────────────────────────

async function getData(id: string): Promise<{ contract: ContractRow; rfq: RFQRow } | null> {
  try {
    const supabase = await getServerSupabaseClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data: contract, error } = await supabase
      .from('contracts')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .maybeSingle()

    if (error || !contract) return null

    const { data: rfq } = await supabase
      .from('rfqs')
      .select('id, title, description')
      .eq('id', contract.rfq_id)
      .maybeSingle()

    return { contract: contract as ContractRow, rfq: rfq as RFQRow }
  } catch {
    return null
  }
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default async function ContractDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const result = await getData(params.id)

  if (!result) notFound()

  const { contract, rfq } = result

  return (
    <div className="space-y-6 max-w-3xl mx-auto">

      {/* Back nav */}
      <Link href="/contracts">
        <button className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors -ml-1">
          <ArrowLeft className="h-4 w-4" />
          All Contracts
        </button>
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20">
            <FileSignature className="h-5 w-5 text-blue-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Contract</h1>
            <p className="text-xs text-gray-600 mt-0.5 font-mono">{contract.id}</p>
          </div>
        </div>
      </div>

      {/* Main client component (handles status badge, PDF, actions) */}
      <ContractDetailClient contract={contract} rfq={rfq} />

    </div>
  )
}
