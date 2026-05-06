'use client'

import { useState, useMemo } from 'react'
import {
  ScatterChart, Scatter, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, ReferenceLine,
} from 'recharts'
import { Trophy, DollarSign, Clock, Zap, TrendingDown, GitCompare } from 'lucide-react'
import Link from 'next/link'

interface RFQ { id: string; title: string; status: string }
interface Response {
  id: string; rfq_id: string; supplier_email: string
  price: number | null; delivery_days: number | null
  answers: Record<string, unknown>; created_at: string
}

interface Props { rfqs: RFQ[]; responses: Response[] }

function score(price: number, delivery: number, minP: number, maxP: number, minD: number, maxD: number) {
  const pNorm = maxP !== minP ? (maxP - price) / (maxP - minP) : 1
  const dNorm = maxD !== minD ? (maxD - delivery) / (maxD - minD) : 1
  return Math.round((0.6 * pNorm + 0.4 * dNorm) * 100)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ChartTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="bg-[#1a2233] border border-white/[0.10] rounded-xl px-3 py-2.5 text-xs shadow-2xl space-y-1">
      <p className="text-white font-semibold">{d.name}</p>
      <p className="text-gray-400">Price: <span className="text-white">${Number(d.price).toLocaleString('en-US')}</span></p>
      <p className="text-gray-400">Delivery: <span className="text-white">{d.delivery}d</span></p>
      <p className="text-gray-400">Score: <span className={d.score >= 70 ? 'text-emerald-400' : d.score >= 45 ? 'text-yellow-400' : 'text-red-400'}>{d.score}/100</span></p>
    </div>
  )
}

export function ComparisonClient({ rfqs, responses }: Props) {
  const [selectedId, setSelectedId] = useState<string>(rfqs[0]?.id ?? '')

  const rfqResponses = useMemo(() =>
    responses.filter((r) => r.rfq_id === selectedId && r.price !== null && r.delivery_days !== null),
    [responses, selectedId]
  )

  const scored = useMemo(() => {
    if (rfqResponses.length === 0) return []
    const prices    = rfqResponses.map((r) => Number(r.price))
    const deliveries = rfqResponses.map((r) => Number(r.delivery_days))
    const minP = Math.min(...prices), maxP = Math.max(...prices)
    const minD = Math.min(...deliveries), maxD = Math.max(...deliveries)
    return rfqResponses
      .map((r) => ({
        id: r.id,
        email: r.supplier_email,
        name: (r.supplier_email as string).split('@')[0],
        price: Number(r.price),
        delivery: Number(r.delivery_days),
        score: score(Number(r.price), Number(r.delivery_days), minP, maxP, minD, maxD),
      }))
      .sort((a, b) => b.score - a.score)
  }, [rfqResponses])

  const best = scored[0]
  const avgPrice    = scored.length ? Math.round(scored.reduce((s, r) => s + r.price, 0) / scored.length) : 0
  const avgDelivery = scored.length ? Math.round(scored.reduce((s, r) => s + r.delivery, 0) / scored.length) : 0

  const scatterData = scored.map((s) => ({ ...s, x: s.price, y: s.delivery }))

  const STATUS_CLS: Record<string, string> = {
    active: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    paused: 'bg-yellow-500/15 text-yellow-300 border-yellow-500/30',
    closed: 'bg-gray-600/20 text-gray-400 border-gray-600/30',
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg sm:text-xl font-bold text-white">Comparisons</h1>
        <p className="text-xs text-gray-600 mt-0.5">Compare supplier offers across RFQs</p>
      </div>

      {rfqs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 gap-4 text-center">
          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
            <GitCompare className="h-8 w-8 text-gray-700" />
          </div>
          <p className="text-sm text-gray-500">No RFQs yet.</p>
          <Link href="/rfqs/new"><button className="text-xs text-blue-400 hover:text-blue-300 underline underline-offset-2">Create one</button></Link>
        </div>
      ) : (
        <>
          {/* RFQ selector */}
          <div className="flex flex-wrap gap-2">
            {rfqs.map((rfq) => (
              <button
                key={rfq.id}
                onClick={() => setSelectedId(rfq.id)}
                className={[
                  'px-3 py-1.5 rounded-xl text-sm font-medium border transition-all',
                  selectedId === rfq.id
                    ? 'bg-blue-500/15 border-blue-500/40 text-blue-300'
                    : 'bg-white/[0.03] border-white/[0.08] text-gray-500 hover:text-gray-300 hover:border-white/[0.15]',
                ].join(' ')}
              >
                {rfq.title}
                <span className={`ml-2 text-[10px] px-1.5 py-0.5 rounded-full border capitalize ${STATUS_CLS[rfq.status] ?? STATUS_CLS.closed}`}>
                  {rfq.status}
                </span>
              </button>
            ))}
          </div>

          {scored.length < 2 ? (
            <div className="rounded-2xl border border-white/[0.07] bg-[#0d1220] p-12 text-center space-y-2">
              <p className="text-sm text-gray-400">Not enough data to compare.</p>
              <p className="text-xs text-gray-600">Need at least 2 supplier quotes with price and delivery.</p>
              <Link href={`/rfqs/${selectedId}`}>
                <button className="text-xs text-blue-400 hover:text-blue-300 underline underline-offset-2 mt-2 block">Invite suppliers</button>
              </Link>
            </div>
          ) : (
            <>
              {/* Winner banner */}
              {best && (
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 rounded-2xl border border-amber-500/30 bg-amber-500/5 px-5 py-4">
                  <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                    <Trophy className="h-5 w-5 text-amber-400 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs text-amber-400 font-semibold uppercase tracking-wider mb-0.5">Best Overall Value</p>
                      <p className="text-sm font-bold text-white truncate">{best.email}</p>
                      <p className="text-xs text-gray-500">Score {best.score}/100 · ${best.price.toLocaleString('en-US')} · {best.delivery}d delivery</p>
                    </div>
                  </div>
                  <Link href={`/rfqs/${selectedId}`} className="shrink-0">
                    <button className="text-xs px-3 py-2 sm:py-1.5 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-300 hover:bg-amber-500/25 transition-colors font-medium min-h-[36px]">
                      View RFQ
                    </button>
                  </Link>
                </div>
              )}

              {/* Scatter chart */}
              <div className="rounded-2xl border border-white/[0.07] bg-[#0d1220] p-5">
                <p className="text-sm font-semibold text-gray-200 mb-1">Price vs Delivery</p>
                <p className="text-xs text-gray-600 mb-5">Bottom-left = best (cheap + fast)</p>
                <div className="h-[200px] sm:h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart margin={{ top: 8, right: 24, left: 0, bottom: 0 }}>
                    <CartesianGrid stroke="rgba(255,255,255,0.04)" />
                    <XAxis
                      dataKey="x" name="Price" type="number"
                      tick={{ fill: '#4b5563', fontSize: 11 }} axisLine={false} tickLine={false}
                      tickFormatter={(v) => `$${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
                      label={{ value: 'Price ($)', position: 'insideBottom', offset: -4, fill: '#4b5563', fontSize: 11 }}
                    />
                    <YAxis
                      dataKey="y" name="Delivery" type="number"
                      tick={{ fill: '#4b5563', fontSize: 11 }} axisLine={false} tickLine={false}
                      tickFormatter={(v) => `${v}d`}
                      label={{ value: 'Delivery (days)', angle: -90, position: 'insideLeft', fill: '#4b5563', fontSize: 11 }}
                    />
                    <Tooltip content={<ChartTooltip />} cursor={{ strokeDasharray: '4 4', stroke: 'rgba(255,255,255,0.1)' }} />
                    <ReferenceLine x={avgPrice}    stroke="rgba(255,255,255,0.08)" strokeDasharray="4 4" />
                    <ReferenceLine y={avgDelivery} stroke="rgba(255,255,255,0.08)" strokeDasharray="4 4" />
                    <Scatter
                      data={scatterData}
                      fill="#3b82f6"
                      shape={(props: any) => {
                        const { cx, cy, payload } = props as { cx: number; cy: number; payload: typeof scatterData[0] }
                        const isWinner = payload.email === best?.email
                        return (
                          <g>
                            <circle cx={cx} cy={cy} r={isWinner ? 10 : 7} fill={isWinner ? '#f59e0b' : '#3b82f6'} opacity={0.85} />
                            <text x={cx} y={cy - 14} textAnchor="middle" fill={isWinner ? '#fbbf24' : '#9ca3af'} fontSize={10} fontWeight={isWinner ? 700 : 400}>
                              {payload.name}
                            </text>
                          </g>
                        )
                      }}
                    />
                  </ScatterChart>
                </ResponsiveContainer>
                </div>
              </div>

              {/* ── MOBILE: Ranked cards ───────────────────────────────── */}
              <div className="md:hidden space-y-3">
                {scored.map((s, i) => {
                  const scoreCls = s.score >= 70 ? 'text-emerald-400' : s.score >= 45 ? 'text-yellow-400' : 'text-red-400'
                  return (
                    <div key={s.id} className={`rounded-2xl border bg-[#0d1220] p-4 space-y-3 ${i === 0 ? 'border-amber-500/30 bg-amber-500/[0.03]' : 'border-white/[0.07]'}`}>
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className={`text-xs font-bold shrink-0 ${i === 0 ? 'text-amber-400' : 'text-gray-600'}`}>#{i + 1}</span>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-white truncate">{s.email}</p>
                            <div className="flex gap-1.5 mt-0.5 flex-wrap">
                              {s.price === Math.min(...scored.map((x) => x.price)) && (
                                <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded-full">
                                  <TrendingDown className="h-2.5 w-2.5" />Cheapest
                                </span>
                              )}
                              {s.delivery === Math.min(...scored.map((x) => x.delivery)) && (
                                <span className="inline-flex items-center gap-1 text-[10px] text-blue-400 bg-blue-500/10 border border-blue-500/20 px-1.5 py-0.5 rounded-full">
                                  <Zap className="h-2.5 w-2.5" />Fastest
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <span className={`text-lg font-bold shrink-0 ${scoreCls}`}>{s.score}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/[0.05]">
                        <div className="text-center">
                          <p className="text-[10px] text-gray-600 uppercase tracking-wide mb-0.5">Price</p>
                          <p className="text-sm font-semibold text-gray-300">${s.price.toLocaleString('en-US')}</p>
                        </div>
                        <div className="text-center border-l border-white/[0.05]">
                          <p className="text-[10px] text-gray-600 uppercase tracking-wide mb-0.5">Delivery</p>
                          <p className="text-sm font-semibold text-gray-300">{s.delivery}d</p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* ── DESKTOP: Ranked table ─────────────────────────────── */}
              <div className="hidden md:block rounded-2xl border border-white/[0.07] bg-[#0d1220] overflow-hidden">
                <div className="grid grid-cols-[28px_1fr_90px_90px_80px] gap-4 px-5 py-3 border-b border-white/[0.06] text-[10px] font-semibold text-gray-600 uppercase tracking-wider">
                  <span>#</span><span>Supplier</span><span className="text-right">Price</span><span className="text-right">Delivery</span><span className="text-right">Score</span>
                </div>
                {scored.map((s, i) => {
                  const scoreCls = s.score >= 70 ? 'text-emerald-400' : s.score >= 45 ? 'text-yellow-400' : 'text-red-400'
                  return (
                    <div key={s.id} className={`grid grid-cols-[28px_1fr_90px_90px_80px] gap-4 px-5 py-3.5 items-center ${i !== 0 ? 'border-t border-white/[0.05]' : ''} ${i === 0 ? 'bg-amber-500/5' : ''}`}>
                      <span className={`text-xs font-bold ${i === 0 ? 'text-amber-400' : 'text-gray-600'}`}>#{i + 1}</span>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-white truncate">{s.email}</p>
                        <div className="flex gap-2 mt-1">
                          {s.price === Math.min(...scored.map((x) => x.price)) && (
                            <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded-full">
                              <TrendingDown className="h-2.5 w-2.5" />Cheapest
                            </span>
                          )}
                          {s.delivery === Math.min(...scored.map((x) => x.delivery)) && (
                            <span className="inline-flex items-center gap-1 text-[10px] text-blue-400 bg-blue-500/10 border border-blue-500/20 px-1.5 py-0.5 rounded-full">
                              <Zap className="h-2.5 w-2.5" />Fastest
                            </span>
                          )}
                        </div>
                      </div>
                      <span className="text-sm text-gray-300 text-right font-medium">${s.price.toLocaleString('en-US')}</span>
                      <span className="text-sm text-gray-300 text-right font-medium">{s.delivery}d</span>
                      <span className={`text-sm font-bold text-right ${scoreCls}`}>{s.score}</span>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}
