'use client'

import { useMemo } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  Cell, LabelList, CartesianGrid,
} from 'recharts'
import { TrendingDown, Zap, Trophy, AlertTriangle, Turtle } from 'lucide-react'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface SupplierPoint {
  label: string
  email: string
  price: number | null
  delivery_days: number | null
  isRecommended: boolean
}

interface Props {
  suppliers: SupplierPoint[]
}

// ── Color constants ───────────────────────────────────────────────────────────

const GREEN  = '#22c55e'
const RED    = '#ef4444'
const BLUE   = '#3b82f6'
const ORANGE = '#f97316'
const GOLD   = '#f59e0b'
const DIM    = '#374151'

// ── Scoring ───────────────────────────────────────────────────────────────────

function computeValueScores(suppliers: SupplierPoint[]): Record<string, number> {
  const valid = suppliers.filter((s) => s.price !== null && s.delivery_days !== null)
  if (valid.length === 0) return {}

  const prices    = valid.map((s) => s.price as number)
  const deliveries = valid.map((s) => s.delivery_days as number)
  const minP = Math.min(...prices),   maxP = Math.max(...prices)
  const minD = Math.min(...deliveries), maxD = Math.max(...deliveries)
  const rangeP = maxP - minP || 1
  const rangeD = maxD - minD || 1

  const scores: Record<string, number> = {}
  for (const s of valid) {
    const pScore = (maxP - (s.price as number)) / rangeP
    const dScore = (maxD - (s.delivery_days as number)) / rangeD
    scores[s.email] = Math.round((pScore * 0.6 + dScore * 0.4) * 100)
  }
  return scores
}

// ── Smart bar color pickers ───────────────────────────────────────────────────

function priceColor(value: number, min: number, max: number): string {
  if (value === min) return GREEN
  if (value === max) return RED
  // interpolate from blue toward orange for middle values
  return BLUE
}

function deliveryColor(value: number, min: number, max: number): string {
  if (value === min) return GREEN
  if (value === max) return RED
  return ORANGE
}

// ── Custom glow bar shape (for best value) ────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function GlowBar(props: any) {
  const { x, y, width, height, fill } = props
  if (fill !== GOLD) {
    return <rect x={x} y={y} width={width} height={height} fill={fill} rx={4} />
  }
  return (
    <g>
      <defs>
        <filter id="goldGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <rect x={x} y={y} width={width} height={height} fill={fill} rx={4} filter="url(#goldGlow)" />
    </g>
  )
}

// ── Tooltip ───────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ChartTooltip({ active, payload, label, unit, rankLabel }: any) {
  if (!active || !payload?.length) return null
  const { value, rank } = payload[0].payload
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-xs shadow-2xl">
      <p className="text-gray-300 font-semibold mb-1.5">{label}</p>
      <p className="text-white font-bold text-sm">
        {unit === '$' ? `$${value.toLocaleString('en-US')}` : `${value} ${unit}`}
      </p>
      {rank && (
        <p className="text-gray-500 mt-1">{rankLabel}: #{rank}</p>
      )}
    </div>
  )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ScoreTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-xs shadow-2xl">
      <p className="text-gray-300 font-semibold mb-1">{d.name}</p>
      <p className="text-white font-bold text-sm">Score: {d.score}/100</p>
      <p className="text-gray-500 mt-0.5">60% price · 40% delivery</p>
    </div>
  )
}

// ── Insight badges ────────────────────────────────────────────────────────────

interface InsightBadgeData {
  email: string
  label: string
  badges: { icon: React.ElementType; text: string; cls: string }[]
}

function InsightBadges({ data }: { data: InsightBadgeData[] }) {
  const anyBadges = data.some((d) => d.badges.length > 0)
  if (!anyBadges) return null

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
        Supplier Insights
      </p>
      <div className="flex flex-col gap-2.5">
        {data.map((d) => (
          d.badges.length > 0 && (
            <div key={d.email} className="flex items-center gap-3">
              <span className="text-xs text-gray-500 font-mono w-28 truncate shrink-0">
                {d.label}
              </span>
              <div className="flex flex-wrap gap-1.5">
                {d.badges.map((b, i) => (
                  <span
                    key={i}
                    className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border font-medium ${b.cls}`}
                  >
                    <b.icon className="h-3 w-3" />
                    {b.text}
                  </span>
                ))}
              </div>
            </div>
          )
        ))}
      </div>
    </div>
  )
}

// ── Chart section card ────────────────────────────────────────────────────────

function ChartCard({ title, subtitle, children }: {
  title: string
  subtitle?: string
  children: React.ReactNode
}) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
      <div className="mb-4">
        <p className="text-sm font-semibold text-gray-200">{title}</p>
        {subtitle && <p className="text-xs text-gray-600 mt-0.5">{subtitle}</p>}
      </div>
      {children}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export function SupplierCharts({ suppliers }: Props) {
  const scores = useMemo(() => computeValueScores(suppliers), [suppliers])

  const priceData = useMemo(() => {
    const valid = suppliers.filter((s) => s.price !== null)
    if (valid.length === 0) return []
    const prices = valid.map((s) => s.price as number)
    const min = Math.min(...prices), max = Math.max(...prices)
    const sorted = [...valid].sort((a, b) => (a.price as number) - (b.price as number))
    return valid.map((s) => ({
      name: s.label,
      value: s.price as number,
      rank: sorted.findIndex((x) => x.email === s.email) + 1,
      fill: priceColor(s.price as number, min, max),
    }))
  }, [suppliers])

  const deliveryData = useMemo(() => {
    const valid = suppliers.filter((s) => s.delivery_days !== null)
    if (valid.length === 0) return []
    const days = valid.map((s) => s.delivery_days as number)
    const min = Math.min(...days), max = Math.max(...days)
    const sorted = [...valid].sort((a, b) => (a.delivery_days as number) - (b.delivery_days as number))
    return valid.map((s) => ({
      name: s.label,
      value: s.delivery_days as number,
      rank: sorted.findIndex((x) => x.email === s.email) + 1,
      fill: deliveryColor(s.delivery_days as number, min, max),
    }))
  }, [suppliers])

  const scoreData = useMemo(() => {
    const withScores = suppliers
      .filter((s) => scores[s.email] !== undefined)
      .map((s) => ({ name: s.label, email: s.email, score: scores[s.email] }))
      .sort((a, b) => b.score - a.score)
    if (withScores.length === 0) return []
    const best = withScores[0].email
    return withScores.map((d) => ({ ...d, fill: d.email === best ? GOLD : DIM }))
  }, [suppliers, scores])

  const bestScoreEmail = scoreData[0]?.email

  const insightData = useMemo((): InsightBadgeData[] => {
    const valid = suppliers.filter((s) => s.price !== null && s.delivery_days !== null)
    if (valid.length === 0) return []
    const prices    = valid.map((s) => s.price as number)
    const deliveries = valid.map((s) => s.delivery_days as number)
    const minP = Math.min(...prices),   maxP = Math.max(...prices)
    const minD = Math.min(...deliveries), maxD = Math.max(...deliveries)
    const avgP = prices.reduce((a, b) => a + b, 0) / prices.length
    const avgD = deliveries.reduce((a, b) => a + b, 0) / deliveries.length

    return suppliers.map((s) => {
      const badges: InsightBadgeData['badges'] = []
      if (s.price === minP)        badges.push({ icon: TrendingDown, text: 'Lowest Price',  cls: 'bg-green-500/10 text-green-300 border-green-500/25' })
      if (s.delivery_days === minD) badges.push({ icon: Zap,         text: 'Fastest',        cls: 'bg-blue-500/10 text-blue-300 border-blue-500/25' })
      if (s.email === bestScoreEmail) badges.push({ icon: Trophy,    text: 'Best Value',     cls: 'bg-amber-500/10 text-amber-300 border-amber-500/25' })
      if (s.price !== null && s.price === maxP && valid.length > 1)
        badges.push({ icon: AlertTriangle, text: 'Expensive', cls: 'bg-red-500/10 text-red-300 border-red-500/25' })
      if (s.delivery_days !== null && s.delivery_days === maxD && valid.length > 1)
        badges.push({ icon: Turtle, text: 'Slowest',   cls: 'bg-orange-500/10 text-orange-300 border-orange-500/25' })
      // remove conflicting badges (can't be lowest AND expensive with 2 suppliers)
      return { email: s.email, label: s.label, badges }
    })
  }, [suppliers, bestScoreEmail])

  if (priceData.length === 0 && deliveryData.length === 0) {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 text-center">
        <p className="text-gray-500 text-sm">No supplier data yet.</p>
        <p className="text-gray-600 text-xs mt-1">Charts will appear once quotes are received.</p>
      </div>
    )
  }

  const axisProps = {
    tick: { fill: '#6b7280', fontSize: 11 },
    axisLine: false as const,
    tickLine: false as const,
  }

  return (
    <div className="space-y-4">

      {/* Price + Delivery side by side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {priceData.length > 0 && (
          <ChartCard
            title="Price Comparison"
            subtitle="Lower is better · Green = cheapest"
          >
            <ResponsiveContainer width="100%" height={210}>
              <BarChart data={priceData} barCategoryGap="35%" margin={{ top: 20, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="name" {...axisProps} />
                <YAxis
                  {...axisProps}
                  width={52}
                  tickFormatter={(v) => `$${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
                />
                <Tooltip
                  content={<ChartTooltip unit="$" rankLabel="Price rank" />}
                  cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                />
                <Bar dataKey="value" shape={<GlowBar />} radius={[4, 4, 0, 0]} isAnimationActive>
                  {priceData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                  <LabelList
                    dataKey="value"
                    position="top"
                    style={{ fill: '#9ca3af', fontSize: 10 }}
                    formatter={(v: number) => `$${v.toLocaleString('en-US')}`}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        )}

        {deliveryData.length > 0 && (
          <ChartCard
            title="Delivery Speed"
            subtitle="Lower is better · Green = fastest"
          >
            <ResponsiveContainer width="100%" height={210}>
              <BarChart data={deliveryData} barCategoryGap="35%" margin={{ top: 20, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="name" {...axisProps} />
                <YAxis {...axisProps} width={36} tickFormatter={(v) => `${v}d`} />
                <Tooltip
                  content={<ChartTooltip unit="days" rankLabel="Speed rank" />}
                  cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                />
                <Bar dataKey="value" shape={<GlowBar />} radius={[4, 4, 0, 0]} isAnimationActive>
                  {deliveryData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                  <LabelList
                    dataKey="value"
                    position="top"
                    style={{ fill: '#9ca3af', fontSize: 10 }}
                    formatter={(v: number) => `${v}d`}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        )}
      </div>

      {/* Value Score — horizontal bars */}
      {scoreData.length > 1 && (
        <ChartCard
          title="Overall Value Score"
          subtitle="Composite score: 60% price efficiency · 40% delivery speed · Higher is better"
        >
          <ResponsiveContainer width="100%" height={scoreData.length * 48 + 20}>
            <BarChart
              data={scoreData}
              layout="vertical"
              barCategoryGap="30%"
              margin={{ top: 4, right: 48, left: 8, bottom: 4 }}
            >
              <XAxis
                type="number"
                domain={[0, 100]}
                {...axisProps}
                tickFormatter={(v) => `${v}`}
              />
              <YAxis type="category" dataKey="name" {...axisProps} width={68} />
              <Tooltip content={<ScoreTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
              <Bar dataKey="score" shape={<GlowBar />} radius={[0, 4, 4, 0]} isAnimationActive>
                {scoreData.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
                <LabelList
                  dataKey="score"
                  position="right"
                  style={{ fill: '#9ca3af', fontSize: 11, fontWeight: 600 }}
                  formatter={(v: number) => `${v}`}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>

          {/* Best overall label */}
          {scoreData[0] && (
            <div className="mt-3 pt-3 border-t border-gray-800 flex items-center gap-2">
              <Trophy className="h-4 w-4 text-amber-400 shrink-0" />
              <p className="text-xs text-gray-400">
                <span className="text-amber-300 font-semibold">{scoreData[0].name}</span>
                {' '}scores highest overall with{' '}
                <span className="text-white font-mono">{scoreData[0].score}/100</span>
              </p>
            </div>
          )}
        </ChartCard>
      )}

      {/* Insight badges */}
      <InsightBadges data={insightData} />
    </div>
  )
}
