'use client'

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from 'recharts'
import {
  TrendingUp, Users, Clock, XCircle, DollarSign, BarChart2,
} from 'lucide-react'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface RevenueStats {
  totalRevenue:   number
  monthlyRevenue: { month: string; label: string; amount: number }[]
  userCounts:     { active: number; trial: number; expired: number; free: number; total: number }
  thisMonthRevenue: number
  lastMonthRevenue: number
}

// ── Custom tooltip ─────────────────────────────────────────────────────────────

function CustomTooltip({ active, payload, label }: {
  active?: boolean
  payload?: { value: number }[]
  label?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border border-white/[0.10] bg-[#0d1220] px-3 py-2 shadow-xl">
      <p className="text-xs text-gray-400 mb-1">{label}</p>
      <p className="text-sm font-bold text-emerald-400">
        {payload[0].value.toLocaleString()} SAR
      </p>
    </div>
  )
}

// ── Stat card ─────────────────────────────────────────────────────────────────

function StatCard({
  label, value, sub, icon: Icon, iconCls, valuePrefix = '', valueSuffix = '',
}: {
  label: string
  value: string | number
  sub?: string
  icon: React.ElementType
  iconCls: string
  valuePrefix?: string
  valueSuffix?: string
}) {
  return (
    <div className="rounded-2xl border border-white/[0.07] bg-[#0d1220] p-5 relative overflow-hidden group">
      <div className="pointer-events-none absolute -top-8 -right-8 h-24 w-24 rounded-full blur-2xl opacity-10 group-hover:opacity-20 transition-opacity duration-500 bg-current" />
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest">{label}</p>
        <div className={`p-2 rounded-xl border shrink-0 ${iconCls}`}>
          <Icon className="h-3.5 w-3.5" />
        </div>
      </div>
      <p className="text-3xl font-bold text-white tabular-nums leading-none">
        {valuePrefix}{typeof value === 'number' ? value.toLocaleString() : value}{valueSuffix}
      </p>
      {sub && <p className="text-xs text-gray-600 mt-1.5">{sub}</p>}
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────

interface Props { stats: RevenueStats }

export function AdminRevenue({ stats }: Props) {
  const { totalRevenue, monthlyRevenue, userCounts, thisMonthRevenue, lastMonthRevenue } = stats

  const momDelta  = lastMonthRevenue > 0
    ? Math.round(((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100)
    : thisMonthRevenue > 0 ? 100 : 0
  const momUp     = momDelta >= 0
  const maxAmount = Math.max(...monthlyRevenue.map(m => m.amount), 1)

  return (
    <div className="space-y-6">

      {/* ── Section header ── */}
      <div className="flex items-center gap-2.5">
        <div className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
          <BarChart2 className="h-4 w-4 text-emerald-400" />
        </div>
        <h2 className="text-sm font-semibold text-white">Revenue & Subscriptions</h2>
      </div>

      {/* ── Revenue cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Revenue"
          value={totalRevenue}
          valueSuffix=" SAR"
          sub="All approved payments"
          icon={DollarSign}
          iconCls="bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
        />
        <StatCard
          label="This Month"
          value={thisMonthRevenue}
          valueSuffix=" SAR"
          sub={momUp
            ? `+${momDelta}% vs last month`
            : `${momDelta}% vs last month`}
          icon={TrendingUp}
          iconCls="bg-blue-500/10 border-blue-500/20 text-blue-400"
        />
        <StatCard
          label="Active Users"
          value={userCounts.active}
          sub={`${userCounts.total} total users`}
          icon={Users}
          iconCls="bg-violet-500/10 border-violet-500/20 text-violet-400"
        />
        <StatCard
          label="Trial / Expired"
          value={`${userCounts.trial} / ${userCounts.expired}`}
          sub={`${userCounts.free} free`}
          icon={Clock}
          iconCls="bg-amber-500/10 border-amber-500/20 text-amber-400"
        />
      </div>

      {/* ── Monthly revenue chart ── */}
      {monthlyRevenue.length > 0 && (
        <div className="rounded-2xl border border-white/[0.07] bg-[#0d1220] p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-sm font-semibold text-white">Monthly Revenue</p>
              <p className="text-xs text-gray-600 mt-0.5">Approved payments grouped by month</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-600">Peak month</p>
              <p className="text-sm font-bold text-emerald-400">
                {monthlyRevenue.reduce((a, b) => a.amount > b.amount ? a : b).label}
              </p>
            </div>
          </div>

          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={monthlyRevenue} margin={{ top: 0, right: 0, left: -10, bottom: 0 }}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255,255,255,0.04)"
                vertical={false}
              />
              <XAxis
                dataKey="label"
                tick={{ fill: '#6b7280', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: '#6b7280', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
              <Bar dataKey="amount" radius={[6, 6, 0, 0]} maxBarSize={48}>
                {monthlyRevenue.map((entry) => (
                  <Cell
                    key={entry.month}
                    fill={entry.amount === maxAmount
                      ? '#10b981'  // emerald peak
                      : '#1d4ed8'  // blue others
                    }
                    fillOpacity={entry.amount === maxAmount ? 1 : 0.6}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>

          {/* Monthly breakdown list (below chart) */}
          <div className="mt-4 grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2">
            {[...monthlyRevenue].reverse().slice(0, 6).map((m) => (
              <div key={m.month} className="text-center rounded-lg bg-white/[0.02] border border-white/[0.05] px-2 py-2">
                <p className="text-[10px] text-gray-600">{m.label}</p>
                <p className="text-xs font-bold text-white tabular-nums mt-0.5">
                  {m.amount.toLocaleString()}
                </p>
                <p className="text-[9px] text-gray-700">SAR</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── User breakdown bar ── */}
      {userCounts.total > 0 && (
        <div className="rounded-2xl border border-white/[0.07] bg-[#0d1220] p-5 space-y-3">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">User Breakdown</p>
          <div className="flex h-3 rounded-full overflow-hidden gap-px">
            {userCounts.active  > 0 && <div style={{ flex: userCounts.active  }} className="bg-emerald-500" title={`Active: ${userCounts.active}`} />}
            {userCounts.trial   > 0 && <div style={{ flex: userCounts.trial   }} className="bg-amber-500"   title={`Trial: ${userCounts.trial}`} />}
            {userCounts.expired > 0 && <div style={{ flex: userCounts.expired }} className="bg-red-500"     title={`Expired: ${userCounts.expired}`} />}
            {userCounts.free    > 0 && <div style={{ flex: userCounts.free    }} className="bg-gray-700"    title={`Free: ${userCounts.free}`} />}
          </div>
          <div className="flex flex-wrap gap-4">
            {[
              { label: 'Active',  value: userCounts.active,  color: 'bg-emerald-500', text: 'text-emerald-400' },
              { label: 'Trial',   value: userCounts.trial,   color: 'bg-amber-500',   text: 'text-amber-400' },
              { label: 'Expired', value: userCounts.expired, color: 'bg-red-500',     text: 'text-red-400' },
              { label: 'Free',    value: userCounts.free,    color: 'bg-gray-700',    text: 'text-gray-500' },
            ].map(({ label, value, color, text }) => (
              <div key={label} className="flex items-center gap-2">
                <div className={`h-2 w-2 rounded-full shrink-0 ${color}`} />
                <span className={`text-xs font-semibold tabular-nums ${text}`}>{value}</span>
                <span className="text-xs text-gray-600">{label}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
