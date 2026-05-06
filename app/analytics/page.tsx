export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { getUserSubscription } from '@/lib/subscription'
import { getServerSupabaseClient } from '@/lib/supabase/server'
import { AnalyticsCharts } from '@/components/AnalyticsCharts'
import { Activity, MessageSquare, TrendingUp, BarChart3, FileSignature, CheckCircle2 } from 'lucide-react'

async function getAnalyticsData() {
  try {
    const supabase = await getServerSupabaseClient()
    const [
      { data: rfqs },
      { data: responses },
      { data: invites },
      { data: contracts },
    ] = await Promise.all([
      supabase.from('rfqs').select('id, status, created_at'),
      supabase.from('responses').select('id, price, delivery_days, created_at, rfq_id'),
      supabase.from('rfq_invites').select('id'),
      supabase.from('contracts').select('id, status, price').order('created_at', { ascending: false }),
    ])

    const totalRFQs       = rfqs?.length ?? 0
    const activeRFQs      = rfqs?.filter((r) => r.status === 'active').length ?? 0
    const totalResponses  = responses?.length ?? 0
    const totalInvites    = invites?.length ?? 0
    const responseRate    = totalInvites > 0 ? Math.round((totalResponses / totalInvites) * 100) : 0

    const totalContracts  = contracts?.length ?? 0
    const signedContracts = contracts?.filter((c) => c.status === 'signed').length ?? 0
    const conversionRate  = totalRFQs > 0 ? Math.round((signedContracts / totalRFQs) * 100) : 0

    // Responses over time (last 30 days)
    const now = Date.now()
    const responsesOverTime: { date: string; count: number }[] = []
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now - i * 86_400_000)
      const dateStr = d.toISOString().split('T')[0]
      const count = (responses ?? []).filter((r) =>
        (r.created_at as string).startsWith(dateStr)
      ).length
      responsesOverTime.push({ date: dateStr.slice(5), count })
    }

    // Price distribution buckets
    const prices = (responses ?? []).map((r) => Number(r.price)).filter((p) => !isNaN(p) && p > 0)
    const priceDistribution = buildDistribution(prices, 6, '$')

    // Delivery distribution
    const deliveries = (responses ?? []).map((r) => Number(r.delivery_days)).filter((d) => !isNaN(d) && d > 0)
    const deliveryDistribution = buildDistribution(deliveries, 5, 'd')

    return {
      totalRFQs, activeRFQs, totalResponses, totalInvites, responseRate,
      totalContracts, signedContracts, conversionRate,
      responsesOverTime, priceDistribution, deliveryDistribution,
      avgPrice: prices.length ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length) : null,
      avgDelivery: deliveries.length ? Math.round(deliveries.reduce((a, b) => a + b, 0) / deliveries.length) : null,
    }
  } catch {
    return null
  }
}

function buildDistribution(values: number[], buckets: number, unit: string) {
  if (values.length === 0) return []
  const min = Math.min(...values)
  const max = Math.max(...values)
  const step = Math.ceil((max - min + 1) / buckets) || 1
  const result: { range: string; count: number }[] = []
  for (let i = 0; i < buckets; i++) {
    const lo = min + i * step
    const hi = lo + step - 1
    result.push({
      range: unit === '$' ? `$${lo.toLocaleString('en-US')}–$${hi.toLocaleString('en-US')}` : `${lo}–${hi}${unit}`,
      count: values.filter((v) => v >= lo && v <= hi).length,
    })
  }
  return result.filter((b) => b.count > 0)
}

export default async function AnalyticsPage() {
  const subscription = await getUserSubscription()
  if (subscription !== 'pro') redirect('/pricing')

  const data = await getAnalyticsData()

  const kpis = [
    { label: 'Total RFQs',       value: data?.totalRFQs ?? 0,        sub: `${data?.activeRFQs ?? 0} active`,         icon: Activity,       cls: 'bg-cyan-400/10 border-cyan-400/20 text-cyan-400' },
    { label: 'Total Responses',  value: data?.totalResponses ?? 0,    sub: `from ${data?.totalInvites ?? 0} invited`, icon: MessageSquare,  cls: 'bg-cyan-400/10 border-cyan-400/20 text-cyan-400' },
    { label: 'Response Rate',    value: `${data?.responseRate ?? 0}%`, sub: 'invitations responded',                  icon: TrendingUp,     cls: 'bg-cyan-400/10 border-cyan-400/20 text-cyan-400' },
    { label: 'Avg Price',        value: data?.avgPrice ? `$${data.avgPrice.toLocaleString('en-US')}` : '—', sub: 'across all quotes', icon: BarChart3, cls: 'bg-cyan-400/10 border-cyan-400/20 text-cyan-400' },
    { label: 'Contracts',        value: data?.totalContracts ?? 0,    sub: `${data?.signedContracts ?? 0} signed`,    icon: FileSignature,  cls: 'bg-cyan-400/10 border-cyan-400/20 text-cyan-400' },
    { label: 'Conversion Rate',  value: `${data?.conversionRate ?? 0}%`, sub: 'RFQs → signed contracts',             icon: CheckCircle2,   cls: 'bg-cyan-400/10 border-cyan-400/20 text-cyan-400' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg sm:text-xl font-bold text-white">Analytics</h1>
        <p className="text-xs text-gray-600 mt-0.5">Platform-wide procurement insights</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {kpis.map(({ label, value, sub, icon: Icon, cls }) => (
          <div key={label} className="relative overflow-hidden rounded-2xl border border-white/[0.05] bg-[#0d1220] p-5 group hover:border-cyan-400/20 transition-all duration-300">
            <div className="absolute -top-6 -right-6 h-16 w-16 rounded-full blur-2xl opacity-10 group-hover:opacity-20 transition-opacity bg-cyan-400" />
            <div className="relative">
              <div className="flex items-start justify-between mb-3">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{label}</p>
                <div className={`p-1.5 rounded-lg border ${cls}`}><Icon className="h-3.5 w-3.5" /></div>
              </div>
              <p className="text-2xl font-bold text-white">{value}</p>
              <p className="text-xs text-gray-600 mt-1">{sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      {data ? (
        <AnalyticsCharts
          responsesOverTime={data.responsesOverTime}
          priceDistribution={data.priceDistribution}
          deliveryDistribution={data.deliveryDistribution}
        />
      ) : (
        <div className="rounded-2xl border border-white/[0.05] bg-[#0d1220] p-12 text-center">
          <p className="text-gray-600 text-sm">Could not load chart data.</p>
        </div>
      )}
    </div>
  )
}
