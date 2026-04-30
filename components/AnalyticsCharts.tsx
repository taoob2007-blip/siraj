'use client'

import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Cell,
} from 'recharts'

interface Props {
  responsesOverTime: { date: string; count: number }[]
  priceDistribution: { range: string; count: number }[]
  deliveryDistribution: { range: string; count: number }[]
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function DarkTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-[#1a2233] border border-white/[0.10] rounded-xl px-3 py-2.5 text-xs shadow-2xl">
      <p className="text-gray-400 mb-1">{label}</p>
      <p className="text-white font-bold">{payload[0].value}</p>
    </div>
  )
}

const AXIS = { tick: { fill: '#4b5563', fontSize: 11 }, axisLine: false as const, tickLine: false as const }

export function AnalyticsCharts({ responsesOverTime, priceDistribution, deliveryDistribution }: Props) {
  const hasTimeData     = responsesOverTime.some((d) => d.count > 0)
  const hasPriceData    = priceDistribution.length > 0
  const hasDeliveryData = deliveryDistribution.length > 0

  return (
    <div className="space-y-4">

      {/* Responses over time */}
      <div className="rounded-2xl border border-white/[0.07] bg-[#111827] p-5">
        <p className="text-sm font-semibold text-gray-200 mb-1">Responses Over Time</p>
        <p className="text-xs text-gray-600 mb-5">Last 30 days</p>
        {hasTimeData ? (
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={responsesOverTime} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="blueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="date" {...AXIS} interval={4} />
              <YAxis {...AXIS} width={28} allowDecimals={false} />
              <Tooltip content={<DarkTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.08)', strokeWidth: 1 }} />
              <Area dataKey="count" stroke="#3b82f6" strokeWidth={2} fill="url(#blueGrad)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[180px] flex items-center justify-center">
            <p className="text-xs text-gray-600">No responses in the last 30 days.</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* Price distribution */}
        <div className="rounded-2xl border border-white/[0.07] bg-[#111827] p-5">
          <p className="text-sm font-semibold text-gray-200 mb-1">Price Distribution</p>
          <p className="text-xs text-gray-600 mb-5">Quote price ranges</p>
          {hasPriceData ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={priceDistribution} barCategoryGap="30%" margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="range" {...AXIS} tick={{ ...AXIS.tick, fontSize: 9 }} />
                <YAxis {...AXIS} width={24} allowDecimals={false} />
                <Tooltip content={<DarkTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                <Bar dataKey="count" radius={[4, 4, 0, 0]} isAnimationActive>
                  {priceDistribution.map((_, i) => (
                    <Cell key={i} fill={i === 0 ? '#22c55e' : i === priceDistribution.length - 1 ? '#ef4444' : '#3b82f6'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[200px] flex items-center justify-center">
              <p className="text-xs text-gray-600">No price data yet.</p>
            </div>
          )}
        </div>

        {/* Delivery distribution */}
        <div className="rounded-2xl border border-white/[0.07] bg-[#111827] p-5">
          <p className="text-sm font-semibold text-gray-200 mb-1">Delivery Distribution</p>
          <p className="text-xs text-gray-600 mb-5">Delivery time ranges (days)</p>
          {hasDeliveryData ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={deliveryDistribution} barCategoryGap="30%" margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="range" {...AXIS} />
                <YAxis {...AXIS} width={24} allowDecimals={false} />
                <Tooltip content={<DarkTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                <Bar dataKey="count" radius={[4, 4, 0, 0]} isAnimationActive>
                  {deliveryDistribution.map((_, i) => (
                    <Cell key={i} fill={i === 0 ? '#22c55e' : i === deliveryDistribution.length - 1 ? '#f97316' : '#8b5cf6'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[200px] flex items-center justify-center">
              <p className="text-xs text-gray-600">No delivery data yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
