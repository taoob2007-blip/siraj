export const dynamic = 'force-dynamic'

import { getServerSupabaseClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, Mail, DollarSign, Clock, FileText, BarChart3 } from 'lucide-react'

interface Props { params: { email: string } }

export default async function SupplierDetailPage({ params }: Props) {
  const email = decodeURIComponent(params.email)
  const supabase = await getServerSupabaseClient()

  const { data: responses, error } = await supabase
    .from('responses')
    .select('id, rfq_id, price, delivery_days, answers, created_at')
    .eq('supplier_email', email)
    .order('created_at', { ascending: false })

  if (error || !responses) notFound()

  const rfqIds = [...new Set(responses.map((r) => r.rfq_id as string))]
  const { data: rfqs } = await supabase
    .from('rfqs')
    .select('id, title, status')
    .in('id', rfqIds)

  const rfqMap = Object.fromEntries((rfqs ?? []).map((r) => [r.id, r]))

  const prices    = responses.map((r) => r.price).filter((p): p is number => p !== null)
  const deliveries = responses.map((r) => r.delivery_days).filter((d): d is number => d !== null)
  const avgPrice    = prices.length    ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length)       : null
  const avgDelivery = deliveries.length ? Math.round(deliveries.reduce((a, b) => a + b, 0) / deliveries.length) : null
  const name   = email.split('@')[0]
  const domain = email.split('@')[1] ?? ''

  const STATUS_CLS: Record<string, string> = {
    active:    'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    paused:    'bg-yellow-500/15 text-yellow-300 border-yellow-500/30',
    cancelled: 'bg-red-500/15 text-red-300 border-red-500/30',
    closed:    'bg-gray-600/20 text-gray-400 border-gray-600/30',
  }

  return (
    <div className="space-y-6">
      <Link href="/suppliers">
        <button className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-white transition-colors">
          <ArrowLeft className="h-4 w-4" />All Suppliers
        </button>
      </Link>

      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-blue-600/30 to-violet-600/30 border border-blue-500/20 flex items-center justify-center text-xl font-bold text-blue-300 uppercase">
          {name[0]}
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">
            <span>{name}</span><span className="text-gray-500">@{domain}</span>
          </h1>
          <p className="text-xs text-gray-600 mt-0.5 flex items-center gap-1">
            <Mail className="h-3 w-3" />{email}
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'RFQs Participated', value: rfqIds.length, icon: FileText, cls: 'bg-blue-500/10 border-blue-500/20 text-blue-400' },
          { label: 'Avg Price',         value: avgPrice !== null ? `$${avgPrice.toLocaleString('en-US')}` : '—', icon: DollarSign, cls: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' },
          { label: 'Avg Delivery',      value: avgDelivery !== null ? `${avgDelivery}d` : '—',           icon: Clock,      cls: 'bg-violet-500/10 border-violet-500/20 text-violet-400' },
        ].map(({ label, value, icon: Icon, cls }) => (
          <div key={label} className="rounded-2xl border border-white/[0.07] bg-[#111827] p-5">
            <div className="flex items-start justify-between mb-3">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{label}</p>
              <div className={`p-1.5 rounded-lg border ${cls}`}><Icon className="h-3.5 w-3.5" /></div>
            </div>
            <p className="text-2xl font-bold text-white">{value}</p>
          </div>
        ))}
      </div>

      {/* RFQ history */}
      <div>
        <h2 className="text-sm font-semibold text-white mb-3">RFQ History</h2>
        <div className="rounded-2xl border border-white/[0.07] bg-[#111827] overflow-hidden divide-y divide-white/[0.05]">
          {responses.map((r) => {
            const rfq = rfqMap[r.rfq_id as string]
            return (
              <div key={r.id} className="flex items-center justify-between gap-4 px-5 py-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {rfq?.title ?? <span className="text-gray-600">Unknown RFQ</span>}
                  </p>
                  <p className="text-[11px] text-gray-600 mt-0.5">
                    {new Date(r.created_at as string).toISOString().split('T')[0]}
                  </p>
                </div>
                <div className="flex items-center gap-4 shrink-0 text-sm">
                  <span className="text-gray-400">
                    {r.price !== null ? `$${Number(r.price).toLocaleString('en-US')}` : '—'}
                  </span>
                  <span className="text-gray-600">
                    {r.delivery_days !== null ? `${r.delivery_days}d` : '—'}
                  </span>
                  {rfq?.status && (
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border capitalize ${STATUS_CLS[rfq.status] ?? STATUS_CLS.closed}`}>
                      {rfq.status}
                    </span>
                  )}
                  {rfq && (
                    <Link href={`/rfqs/${rfq.id}`}>
                      <button className="text-xs text-blue-400 hover:text-blue-300 transition-colors">View RFQ</button>
                    </Link>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
