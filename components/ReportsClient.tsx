'use client'

import { useState, useMemo } from 'react'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from 'recharts'
import {
  DollarSign, FileSignature, TrendingUp, Truck,
  Download, CheckCircle2, Clock, XCircle, Users,
} from 'lucide-react'

// ── Types ──────────────────────────────────────────────────────────────────────

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

interface Props {
  contracts: ContractRow[]
  totalRFQs: number
  activeRFQs: number
}

type DateFilter = '7d' | '30d' | 'all'

// ── Helpers ────────────────────────────────────────────────────────────────────

function filterByDate(contracts: ContractRow[], f: DateFilter): ContractRow[] {
  if (f === 'all') return contracts
  const cutoff = Date.now() - (f === '7d' ? 7 : 30) * 86_400_000
  return contracts.filter((c) => new Date(c.created_at).getTime() >= cutoff)
}

function fmt(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`
  return `$${n.toLocaleString('en-US')}`
}

// ── Tooltip components ─────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CurrencyTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-[#1a2233] border border-white/[0.10] rounded-xl px-3 py-2.5 text-xs shadow-2xl">
      <p className="text-gray-400 mb-1">{label}</p>
      <p className="text-white font-bold">{fmt(payload[0].value)}</p>
    </div>
  )
}

const AXIS = { tick: { fill: '#4b5563', fontSize: 11 }, axisLine: false as const, tickLine: false as const }

// ── Component ──────────────────────────────────────────────────────────────────

export function ReportsClient({ contracts, totalRFQs, activeRFQs }: Props) {
  const [dateFilter, setDateFilter] = useState<DateFilter>('30d')

  const filtered = useMemo(() => filterByDate(contracts, dateFilter), [contracts, dateFilter])

  const metrics = useMemo(() => {
    const withPrice   = filtered.filter((c) => c.price != null && (c.price as number) > 0)
    const signed      = filtered.filter((c) => c.buyer_signature)
    const fullyExec   = filtered.filter((c) => c.buyer_signature && c.supplier_signature)
    const cancelled   = filtered.filter((c) => c.status === 'cancelled')
    const pending     = filtered.filter((c) => !c.buyer_signature && c.status !== 'cancelled')
    const deliveries  = filtered.filter((c) => c.delivery_days != null && (c.delivery_days as number) > 0)

    const totalSpend  = signed.reduce((s, c) => s + (c.price ?? 0), 0)
    const avgPrice    = withPrice.length
      ? Math.round(withPrice.reduce((s, c) => s + (c.price ?? 0), 0) / withPrice.length)
      : null
    const avgDelivery = deliveries.length
      ? Math.round(deliveries.reduce((s, c) => s + (c.delivery_days ?? 0), 0) / deliveries.length)
      : null

    return {
      total: filtered.length,
      signed: signed.length,
      fullyExec: fullyExec.length,
      cancelled: cancelled.length,
      pending: pending.length,
      totalSpend,
      avgPrice,
      avgDelivery,
    }
  }, [filtered])

  // Spend over time
  const spendOverTime = useMemo(() => {
    if (dateFilter === '7d') {
      const now = Date.now()
      return Array.from({ length: 7 }, (_, i) => {
        const d   = new Date(now - (6 - i) * 86_400_000)
        const key = d.toISOString().split('T')[0]
        const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        const spend = filtered
          .filter((c) => c.created_at.startsWith(key) && c.buyer_signature && c.price)
          .reduce((s, c) => s + (c.price ?? 0), 0)
        return { label, spend }
      })
    }
    if (dateFilter === '30d') {
      const now = Date.now()
      return Array.from({ length: 30 }, (_, i) => {
        const d   = new Date(now - (29 - i) * 86_400_000)
        const key = d.toISOString().split('T')[0]
        const spend = filtered
          .filter((c) => c.created_at.startsWith(key) && c.buyer_signature && c.price)
          .reduce((s, c) => s + (c.price ?? 0), 0)
        return { label: key.slice(5), spend }
      })
    }
    // all time — group by month
    const map = new Map<string, number>()
    filtered
      .filter((c) => c.buyer_signature && c.price)
      .forEach((c) => {
        const m = c.created_at.slice(0, 7)
        map.set(m, (map.get(m) ?? 0) + (c.price ?? 0))
      })
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, spend]) => ({
        label: new Date(month + '-01').toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
        spend,
      }))
  }, [filtered, dateFilter])

  // Supplier aggregates
  const supplierData = useMemo(() => {
    const map = new Map<string, { contracts: number; totalSpend: number; totalDelivery: number; delivCount: number }>()
    filtered.forEach((c) => {
      const e = map.get(c.supplier_email) ?? { contracts: 0, totalSpend: 0, totalDelivery: 0, delivCount: 0 }
      e.contracts++
      if (c.price)         e.totalSpend   += c.price
      if (c.delivery_days) { e.totalDelivery += c.delivery_days; e.delivCount++ }
      map.set(c.supplier_email, e)
    })
    return Array.from(map.entries())
      .map(([email, d]) => ({
        email,
        contracts: d.contracts,
        totalSpend: d.totalSpend,
        avgPrice:    d.contracts > 0 && d.totalSpend > 0 ? Math.round(d.totalSpend / d.contracts) : null,
        avgDelivery: d.delivCount > 0 ? Math.round(d.totalDelivery / d.delivCount) : null,
      }))
      .sort((a, b) => b.totalSpend - a.totalSpend)
  }, [filtered])

  const topSupplierChart = supplierData.slice(0, 8).map((s) => ({
    name: s.email.split('@')[0],
    spend: s.totalSpend,
  }))

  function exportCSV() {
    const header = ['ID', 'Supplier', 'Status', 'Price', 'Delivery Days', 'Created At', 'Signed']
    const rows   = filtered.map((c) => [
      c.id,
      c.supplier_email,
      c.status,
      c.price ?? '',
      c.delivery_days ?? '',
      c.created_at.split('T')[0],
      c.buyer_signature ? 'Yes' : 'No',
    ])
    const csv  = [header, ...rows].map((r) => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `contracts-report-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const hasSpendData    = spendOverTime.some((d) => d.spend > 0)
  const hasSupplierData = topSupplierChart.some((d) => d.spend > 0)

  return (
    <div className="space-y-6">

      {/* Controls */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-1 bg-[#111827] border border-white/[0.07] rounded-xl p-1">
          {(['7d', '30d', 'all'] as DateFilter[]).map((f) => (
            <button
              key={f}
              onClick={() => setDateFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                dateFilter === f
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              {f === '7d' ? 'Last 7 Days' : f === '30d' ? 'Last 30 Days' : 'All Time'}
            </button>
          ))}
        </div>
        <button
          onClick={exportCSV}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-gray-300 hover:text-white hover:bg-white/[0.07] transition-all font-medium"
        >
          <Download className="h-3.5 w-3.5" />
          Export CSV
        </button>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: 'Total Contract Value',
            value: metrics.totalSpend > 0 ? fmt(metrics.totalSpend) : '—',
            sub:   `from ${metrics.signed} signed contracts`,
            icon:  DollarSign,
            cls:   'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
          },
          {
            label: 'Contracts',
            value: metrics.total,
            sub:   `${metrics.fullyExec} fully executed`,
            icon:  FileSignature,
            cls:   'bg-blue-500/10 border-blue-500/20 text-blue-400',
          },
          {
            label: 'Avg Contract Value',
            value: metrics.avgPrice ? fmt(metrics.avgPrice) : '—',
            sub:   'per contract with price',
            icon:  TrendingUp,
            cls:   'bg-violet-500/10 border-violet-500/20 text-violet-400',
          },
          {
            label: 'Avg Delivery',
            value: metrics.avgDelivery ? `${metrics.avgDelivery} days` : '—',
            sub:   'across all contracts',
            icon:  Truck,
            cls:   'bg-orange-500/10 border-orange-500/20 text-orange-400',
          },
        ].map(({ label, value, sub, icon: Icon, cls }) => (
          <div key={label} className="relative overflow-hidden rounded-2xl border border-white/[0.07] bg-[#111827] p-5">
            <div className={`absolute -top-6 -right-6 h-16 w-16 rounded-full blur-2xl opacity-20 ${cls}`} />
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

      {/* Status breakdown */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Signed',    value: metrics.signed,    icon: CheckCircle2, cls: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
          { label: 'Pending',   value: metrics.pending,   icon: Clock,        cls: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20' },
          { label: 'Cancelled', value: metrics.cancelled, icon: XCircle,      cls: 'text-red-400 bg-red-500/10 border-red-500/20' },
        ].map(({ label, value, icon: Icon, cls }) => (
          <div key={label} className="rounded-2xl border border-white/[0.07] bg-[#111827] p-4 flex items-center gap-3">
            <div className={`p-2 rounded-lg border ${cls}`}><Icon className="h-4 w-4" /></div>
            <div>
              <p className="text-xs text-gray-500">{label}</p>
              <p className="text-xl font-bold text-white">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Spend over time */}
        <div className="rounded-2xl border border-white/[0.07] bg-[#111827] p-5">
          <p className="text-sm font-semibold text-gray-200 mb-1">Contract Spend Over Time</p>
          <p className="text-xs text-gray-600 mb-5">Signed contract value by date</p>
          {hasSpendData ? (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={spendOverTime} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="spendGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="label" {...AXIS} interval={dateFilter === '30d' ? 4 : 0} />
                <YAxis
                  {...AXIS}
                  width={44}
                  tickFormatter={(v) => v >= 1000 ? `$${(v / 1000).toFixed(0)}K` : `$${v}`}
                />
                <Tooltip content={<CurrencyTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.08)', strokeWidth: 1 }} />
                <Area dataKey="spend" stroke="#10b981" strokeWidth={2} fill="url(#spendGrad)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[200px] flex items-center justify-center">
              <p className="text-xs text-gray-600">No signed contract value in this period.</p>
            </div>
          )}
        </div>

        {/* Spend by supplier */}
        <div className="rounded-2xl border border-white/[0.07] bg-[#111827] p-5">
          <p className="text-sm font-semibold text-gray-200 mb-1">Spend by Supplier</p>
          <p className="text-xs text-gray-600 mb-5">Top suppliers by total contract value</p>
          {hasSupplierData ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={topSupplierChart} layout="vertical" margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid horizontal={false} stroke="rgba(255,255,255,0.04)" />
                <XAxis
                  type="number"
                  {...AXIS}
                  tickFormatter={(v) => v >= 1000 ? `$${(v / 1000).toFixed(0)}K` : `$${v}`}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  {...AXIS}
                  width={72}
                  tick={{ ...AXIS.tick, fontSize: 10 }}
                />
                <Tooltip content={<CurrencyTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                <Bar dataKey="spend" radius={[0, 4, 4, 0]} fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[200px] flex items-center justify-center">
              <p className="text-xs text-gray-600">No supplier spend data yet.</p>
            </div>
          )}
        </div>
      </div>

      {/* Supplier performance table */}
      <div className="rounded-2xl border border-white/[0.07] bg-[#111827] overflow-hidden">
        <div className="px-5 py-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-gray-500" />
            <p className="text-sm font-semibold text-gray-200">Supplier Performance</p>
          </div>
          <p className="text-xs text-gray-600 mt-0.5">Aggregated metrics per supplier in selected period</p>
        </div>

        {supplierData.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-xs text-gray-600">No contract data in this period.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/[0.05]">
                  {['Supplier', 'Contracts', 'Total Value', 'Avg Price', 'Avg Delivery'].map((h) => (
                    <th key={h} className="px-5 py-3 text-left text-[11px] font-semibold text-gray-600 uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {supplierData.map((s) => (
                  <tr key={s.email} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-3">
                      <p className="text-xs font-semibold text-white truncate max-w-[200px]">{s.email}</p>
                    </td>
                    <td className="px-5 py-3 text-xs text-gray-400">{s.contracts}</td>
                    <td className="px-5 py-3 text-xs font-semibold text-emerald-300">
                      {s.totalSpend > 0 ? fmt(s.totalSpend) : '—'}
                    </td>
                    <td className="px-5 py-3 text-xs text-gray-400">
                      {s.avgPrice ? fmt(s.avgPrice) : '—'}
                    </td>
                    <td className="px-5 py-3 text-xs text-gray-400">
                      {s.avgDelivery ? `${s.avgDelivery} days` : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
