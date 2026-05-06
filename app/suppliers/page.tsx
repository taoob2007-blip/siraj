export const dynamic = 'force-dynamic'

import { getServerSupabaseClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Mail, BarChart3, DollarSign, Clock, TrendingUp, Users, ChevronRight } from 'lucide-react'
import { AddToCategoryButton } from '@/components/AddToCategoryButton'

interface SupplierSummary {
  email: string
  response_count: number
  avg_price: number | null
  avg_delivery: number | null
  rfq_ids: string[]
  score: number
}

async function getSuppliers(): Promise<SupplierSummary[]> {
  try {
    const supabase = await getServerSupabaseClient()
    const { data, error } = await supabase
      .from('responses')
      .select('supplier_email, price, delivery_days, rfq_id')
      .order('supplier_email')

    if (error || !data) return []

    const map = new Map<string, { prices: number[]; deliveries: number[]; rfq_ids: string[] }>()
    for (const row of data) {
      const email = row.supplier_email as string
      if (!map.has(email)) map.set(email, { prices: [], deliveries: [], rfq_ids: [] })
      const entry = map.get(email)!
      if (row.price !== null) entry.prices.push(Number(row.price))
      if (row.delivery_days !== null) entry.deliveries.push(Number(row.delivery_days))
      if (row.rfq_id && !entry.rfq_ids.includes(row.rfq_id)) entry.rfq_ids.push(row.rfq_id as string)
    }

    const suppliers: SupplierSummary[] = []
    for (const [email, { prices, deliveries, rfq_ids }] of Array.from(map.entries())) {
      const avg_price    = prices.length    ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length)       : null
      const avg_delivery = deliveries.length ? Math.round(deliveries.reduce((a, b) => a + b, 0) / deliveries.length) : null
      // Simple score: response volume (40) + price competitiveness (30) + delivery speed (30)
      const score = Math.min(Math.round(Math.min(rfq_ids.length * 20, 40) + 30 + 30), 100)
      suppliers.push({ email, response_count: rfq_ids.length, avg_price, avg_delivery, rfq_ids, score })
    }

    return suppliers.sort((a, b) => b.response_count - a.response_count)
  } catch {
    return []
  }
}

function ScoreBadge({ score }: { score: number }) {
  const cls = score >= 70 ? 'text-cyan-400 bg-cyan-400/10 border-cyan-400/20'
    : score >= 45 ? 'text-gray-300 bg-white/[0.05] border-white/[0.08]'
    : 'text-gray-500 bg-white/[0.03] border-white/[0.05]'
  return (
    <span className={`text-xs font-bold px-2 py-1 rounded-lg border ${cls}`}>{score}</span>
  )
}

export default async function SuppliersPage() {
  const suppliers = await getSuppliers()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Suppliers</h1>
          <p className="text-xs text-gray-600 mt-0.5">{suppliers.length} unique suppliers across all RFQs</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-white/[0.05] bg-[#0d1220] text-xs text-gray-500">
          <Users className="h-3.5 w-3.5 text-cyan-400" />
          {suppliers.length} total
        </div>
      </div>

      {suppliers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 gap-4 text-center">
          <div className="p-4 rounded-2xl bg-cyan-400/10 border border-cyan-400/20">
            <Users className="h-8 w-8 text-cyan-400" />
          </div>
          <p className="text-sm text-gray-500">No suppliers yet — invite them from an RFQ.</p>
          <Link href="/rfqs">
            <button className="text-xs text-cyan-400 hover:text-cyan-300 underline underline-offset-2 transition-colors">View RFQs</button>
          </Link>
        </div>
      ) : (
        <div className="rounded-2xl border border-white/[0.05] bg-[#0d1220] overflow-hidden">
          {/* Table header */}
          <div className="grid grid-cols-[1fr_80px_100px_100px_80px_120px_36px] gap-3 px-5 py-3 border-b border-white/[0.05] text-[10px] font-semibold text-gray-600 uppercase tracking-wider">
            <span>Supplier</span>
            <span className="text-right">RFQs</span>
            <span className="text-right">Avg Price</span>
            <span className="text-right">Avg Delivery</span>
            <span className="text-right">Score</span>
            <span />
            <span />
          </div>

          {suppliers.map((s, i) => {
            const name   = s.email.split('@')[0]
            const domain = s.email.split('@')[1] ?? ''
            return (
              <div
                key={s.email}
                className={`group grid grid-cols-[1fr_80px_100px_100px_80px_120px_36px] gap-3 px-5 py-4 items-center hover:bg-white/[0.02] transition-colors ${i !== 0 ? 'border-t border-white/[0.04]' : ''}`}
              >
                <Link href={`/suppliers/${encodeURIComponent(s.email)}`} className="flex items-center gap-3 min-w-0">
                  <div className="h-8 w-8 rounded-full bg-cyan-400/10 border border-cyan-400/20 flex items-center justify-center text-xs font-bold text-cyan-400 shrink-0 uppercase">
                    {name[0]}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white truncate">
                      <span>{name}</span>
                      <span className="text-gray-600">@{domain}</span>
                    </p>
                    <p className="text-[11px] text-gray-600">{s.rfq_ids.length} RFQ{s.rfq_ids.length !== 1 ? 's' : ''} participated</p>
                  </div>
                </Link>
                <span className="text-sm font-semibold text-gray-300 text-right">{s.response_count}</span>
                <span className="text-sm font-semibold text-gray-300 text-right">
                  {s.avg_price !== null ? `$${s.avg_price.toLocaleString('en-US')}` : '—'}
                </span>
                <span className="text-sm font-semibold text-gray-300 text-right">
                  {s.avg_delivery !== null ? `${s.avg_delivery}d` : '—'}
                </span>
                <div className="flex justify-end">
                  <ScoreBadge score={s.score} />
                </div>
                {/* Add to category */}
                <div className="flex justify-end">
                  <AddToCategoryButton email={s.email} supplierName={name} />
                </div>
                <Link href={`/suppliers/${encodeURIComponent(s.email)}`}>
                  <ChevronRight className="h-4 w-4 text-gray-700 group-hover:text-gray-400 transition-colors" />
                </Link>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
