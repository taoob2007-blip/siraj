'use client'

import { useMemo, useState, useCallback, useEffect, useRef } from 'react'
import { SupplierCharts } from '@/components/SupplierCharts'
import { Badge } from '@/components/ui/badge'
import {
  Bot, TrendingDown, Zap, Star,
  AlertTriangle, Info, CheckCircle2,
  Loader2, Sparkles, ArrowLeftRight,
} from 'lucide-react'
import type { AIDecision } from '@/lib/aiDecision'
import type { SupplierScore } from '@/app/api/ai/score/route'
import type { RFQField } from '@/lib/types'
import type { DecideResult } from '@/app/api/ai/decide/route'
import { SupplierCard } from '@/components/SupplierCard'
import { AIDecisionPanel } from '@/components/AIDecisionPanel'
import type { AIDecision as PanelDecision } from '@/components/AIDecisionPanel'

// ── Types ─────────────────────────────────────────────────────────────────────

interface Supplier {
  id: string
  supplier_email: string
  price: number | null
  delivery_days: number | null
  answers: Record<string, string | number>
  created_at: string
}

export interface RFQResponseSectionProps {
  title: string
  description?: string | null
  suppliers: Supplier[]
  fields: RFQField[]
  projectType: string
  aiDecision?: AIDecision | null
  rfqId?: string
  autoScore?: boolean
  initialAiScores?: Record<string, SupplierScore>
  initialAiDecision?: PanelDecision | null
  acceptedSupplier?: string | null
  onAccepted?: (email: string) => void
  rfqStatus?: string
}

// ── Data normalisation ────────────────────────────────────────────────────────

function resolvePrice(s: Supplier): number | null {
  if (s.price !== null && s.price !== undefined) return Number(s.price)
  const v = s.answers?.price
  if (v !== undefined && v !== '' && !isNaN(Number(v))) return Number(v)
  return null
}

function resolveDelivery(s: Supplier): number | null {
  if (s.delivery_days !== null && s.delivery_days !== undefined) return Number(s.delivery_days)
  const v = s.answers?.delivery_days
  if (v !== undefined && v !== '' && !isNaN(Number(v))) return Number(v)
  return null
}

function normalise(suppliers: Supplier[]): Supplier[] {
  return suppliers.map((s) => ({ ...s, price: resolvePrice(s), delivery_days: resolveDelivery(s) }))
}

// ── Static scoring (price 40%, delivery 30%, experience 10%, quality 10%, completeness 10%) ──

function computeScores(suppliers: Supplier[]): Record<string, number> {
  const valid = suppliers.filter((s) => s.price !== null && s.delivery_days !== null)
  if (valid.length === 0) return {}
  const prices     = valid.map((s) => s.price as number)
  const deliveries = valid.map((s) => s.delivery_days as number)
  const minP = Math.min(...prices),     maxP = Math.max(...prices)
  const minD = Math.min(...deliveries), maxD = Math.max(...deliveries)

  // Max experience across suppliers for normalisation
  const expValues = valid.map((s) => {
    const v = s.answers?.experience_years ?? s.answers?.experience
    return v !== undefined && !isNaN(Number(v)) ? Number(v) : 0
  })
  const maxExp = Math.max(...expValues, 1)

  const scores: Record<string, number> = {}
  for (const s of valid) {
    const pNorm = maxP !== minP ? (maxP - (s.price as number)) / (maxP - minP) : 1
    const dNorm = maxD !== minD ? (maxD - (s.delivery_days as number)) / (maxD - minD) : 1

    // Experience: 0–1 normalised
    const expRaw = s.answers?.experience_years ?? s.answers?.experience
    const expNorm = expRaw !== undefined && !isNaN(Number(expRaw)) ? Math.min(Number(expRaw) / maxExp, 1) : 0.5

    // Quality: if a 1–5 or 0–10 rating exists, normalise; otherwise neutral
    const qRaw = s.answers?.quality ?? s.answers?.quality_rating
    const qNorm = qRaw !== undefined && !isNaN(Number(qRaw)) ? Math.min(Number(qRaw) / 10, 1) : 0.5

    // Completeness: fraction of non-empty answer fields
    const allFields = Object.values(s.answers ?? {})
    const filled = allFields.filter((v) => v !== '' && v !== null && v !== undefined).length
    const completeness = allFields.length > 0 ? filled / allFields.length : 0.5

    scores[s.id] = Math.round(
      (0.40 * pNorm + 0.30 * dNorm + 0.10 * expNorm + 0.10 * qNorm + 0.10 * completeness) * 100
    )
  }
  return scores
}

// ── Insights panel ────────────────────────────────────────────────────────────

function InsightsPanel({ insights, warnings, tradeoffs, winner }: {
  insights: string[]
  warnings: string[]
  tradeoffs?: string[]
  winner: string
}) {
  return (
    <div className="space-y-3 animate-in fade-in duration-500">
      {/* Decision summary */}
      <div className="flex items-center gap-3 rounded-xl border border-amber-500/25 bg-amber-500/8 px-4 py-3">
        <Bot className="h-4 w-4 text-amber-400 shrink-0" />
        <div className="flex-1 min-w-0">
          <span className="text-xs text-amber-400 font-semibold uppercase tracking-wider">AI Decision · </span>
          <span className="text-sm text-amber-200/90 font-medium">{winner}</span>
        </div>
        <CheckCircle2 className="h-4 w-4 text-amber-400 shrink-0" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Insights */}
        {insights.length > 0 && (
          <div className="rounded-xl border border-blue-500/15 bg-blue-500/5 px-4 py-3 space-y-2">
            <p className="text-xs font-semibold text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
              <Info className="h-3.5 w-3.5" />Key Insights
            </p>
            <ul className="space-y-1.5">
              {insights.map((insight, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                  <span className="mt-2 h-1.5 w-1.5 rounded-full bg-blue-400 shrink-0" />
                  {insight}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Tradeoffs */}
        {tradeoffs && tradeoffs.length > 0 && (
          <div className="rounded-xl border border-violet-500/15 bg-violet-500/5 px-4 py-3 space-y-2">
            <p className="text-xs font-semibold text-violet-400 uppercase tracking-wider flex items-center gap-1.5">
              <ArrowLeftRight className="h-3.5 w-3.5" />Trade-offs
            </p>
            <ul className="space-y-1.5">
              {tradeoffs.map((t, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                  <span className="mt-2 h-1.5 w-1.5 rounded-full bg-violet-400 shrink-0" />
                  {t}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Warnings */}
        {warnings.length > 0 && (
          <div className="rounded-xl border border-red-500/20 bg-red-500/8 px-4 py-3 space-y-2">
            <p className="text-xs font-semibold text-red-400 uppercase tracking-wider flex items-center gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5" />Risk Flags
            </p>
            <ul className="space-y-1.5">
              {warnings.map((w, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-red-300">
                  <span className="mt-2 h-1.5 w-1.5 rounded-full bg-red-400 shrink-0" />
                  {w}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export function RFQResponseSection({
  title: _title,
  description: _description,
  suppliers: suppliersRaw,
  fields,
  aiDecision,
  rfqId,
  autoScore = false,
  initialAiScores,
  initialAiDecision,
  acceptedSupplier,
  onAccepted,
  rfqStatus,
}: RFQResponseSectionProps) {
  const suppliers = useMemo(() => normalise(suppliersRaw), [suppliersRaw])
  const scores = useMemo(() => computeScores(suppliers), [suppliers])

  // AI scoring state — seed from server-loaded cache if available
  const [aiScores, setAiScores]         = useState<Record<string, SupplierScore>>(initialAiScores ?? {})
  const [scoring, setScoring]           = useState(false)
  const [scoreError, setScoreError]     = useState<string | null>(null)
  const [autoRan, setAutoRan]           = useState(!!initialAiScores && Object.keys(initialAiScores).length > 0)
  const autoTriggered                   = useRef(false)

  // Full decision state — seed from server-loaded cache
  const [panelDecision, setPanelDecision] = useState<PanelDecision | null>(initialAiDecision ?? null)
  const [deciding, setDeciding]           = useState(false)

  /** Persist AI result (scores + optional decision) to DB */
  const persistResult = useCallback(async (
    map: Record<string, SupplierScore>,
    decision?: DecideResult,
  ) => {
    if (!rfqId) return
    const best = decision?.best_supplier ?? Object.entries(map).reduce(
      (top, [email, s]) => (!top || s.score > map[top].score ? email : top),
      null as string | null,
    )
    try {
      await fetch(`/api/rfqs/${rfqId}/ai-result`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scores:      Object.values(map),
          best_supplier: best,
          ranking:     decision?.ranking,
          reasoning:   decision?.reasoning,
          tradeoffs:   decision?.tradeoffs,
          risks:       decision?.risks,
          negotiation: decision?.negotiation,
          scored_at:   new Date().toISOString(),
        }),
      })
    } catch {
      // persist is best-effort
    }
  }, [rfqId])

  /** Full decision call — scores + reasoning + risks + negotiation in one shot */
  const decideWithAI = useCallback(async () => {
    if (suppliers.length === 0) return
    setDeciding(true)
    setScoring(true)
    setScoreError(null)
    try {
      const res = await fetch('/api/ai/decide', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rfq_title:       _title,
          rfq_description: _description,
          suppliers: suppliers.map((s) => ({
            email:            s.supplier_email,
            price:            s.price,
            delivery_days:    s.delivery_days,
            experience_years: s.answers?.experience_years ?? s.answers?.experience ?? null,
            portfolio:        typeof s.answers?.portfolio === 'string'
              ? s.answers.portfolio.split(/[,\n]+/).map((v: string) => v.trim()).filter(Boolean)
              : null,
            notes:            (s.answers?.notes as string) ?? null,
            answers:          s.answers ?? {},
          })),
        }),
      })
      if (!res.ok) throw new Error(`Server error ${res.status}`)
      const data = (await res.json()) as DecideResult

      // Update scores map
      const map: Record<string, SupplierScore> = {}
      data.scores.forEach((s) => {
        map[s.email] = { ...s, score: Math.round(Number(s.score) || 0) }
      })
      setAiScores(map)
      setAutoRan(true)

      // Update decision panel
      setPanelDecision({
        best_supplier: data.best_supplier,
        reasoning:     data.reasoning,
        tradeoffs:     data.tradeoffs,
        risks:         data.risks,
        negotiation:   data.negotiation,
      })

      await persistResult(map, data)
    } catch (err) {
      setScoreError(err instanceof Error ? err.message : 'Failed to analyze suppliers')
    } finally {
      setDeciding(false)
      setScoring(false)
    }
  }, [_title, _description, suppliers, persistResult])

  const scoreWithAI = useCallback(async () => {
    if (suppliers.length === 0) return
    setScoring(true)
    setScoreError(null)
    try {
      const res = await fetch('/api/ai/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rfq_title:       _title,
          rfq_description: _description,
          suppliers: suppliers.map((s) => ({
            email:            s.supplier_email,
            price:            s.price,
            delivery_days:    s.delivery_days,
            experience_years: s.answers?.experience_years ?? s.answers?.experience ?? null,
            portfolio:        typeof s.answers?.portfolio === 'string'
              ? s.answers.portfolio.split(/[,\n]+/).map((v: string) => v.trim()).filter(Boolean)
              : null,
            notes:            (s.answers?.notes as string) ?? null,
            answers:          s.answers ?? {},
          })),
        }),
      })
      if (!res.ok) throw new Error(`Server error ${res.status}`)
      const data = (await res.json()) as { scores: SupplierScore[] }
      const map: Record<string, SupplierScore> = {}
      data.scores.forEach((s) => {
        map[s.email] = { ...s, score: Math.round(Number(s.score) || 0) }
      })
      setAiScores(map)
      setAutoRan(true)
      await persistResult(map)
    } catch (err) {
      setScoreError(err instanceof Error ? err.message : 'Failed to score suppliers')
    } finally {
      setScoring(false)
    }
  }, [_title, _description, suppliers, persistResult])

  // Auto-trigger full decision once on mount when there are supplier responses
  useEffect(() => {
    if (!autoScore || autoTriggered.current || suppliers.length === 0) return
    // Skip if we already have both cached scores AND a cached decision
    if (Object.keys(aiScores).length > 0 && panelDecision) return
    autoTriggered.current = true
    decideWithAI()
  }, [autoScore, suppliers.length, aiScores, panelDecision, decideWithAI])

  const valid = suppliers.filter((s) => s.price !== null && s.delivery_days !== null)
  const prices = valid.map((s) => s.price as number)
  const deliveries = valid.map((s) => s.delivery_days as number)
  const minPrice = prices.length ? Math.min(...prices) : null
  const minDelivery = deliveries.length ? Math.min(...deliveries) : null

  // Winner from chat decision, or derived from highest AI score when no chat decision exists
  const aiChoiceEmail = useMemo(() => {
    if (aiDecision?.best_supplier) return aiDecision.best_supplier
    if (Object.keys(aiScores).length === 0) return null
    return Object.entries(aiScores).reduce(
      (top, [email, s]) => (!top || s.score > aiScores[top].score ? email : top),
      null as string | null,
    )
  }, [aiDecision, aiScores])

  // rankMap: prefer chat aiDecision ranking, fall back to decide API ranking derived from scores
  const rankMap = useMemo(() => {
    const m: Record<string, number> = {}
    if (aiDecision?.ranking?.length) {
      aiDecision.ranking.forEach((r) => { m[r.email] = r.rank })
    } else if (Object.keys(aiScores).length > 0) {
      // Derive rank from score ordering
      const sorted = Object.entries(aiScores)
        .sort(([, a], [, b]) => b.score - a.score)
      sorted.forEach(([email], idx) => { m[email] = idx + 1 })
    }
    return m
  }, [aiDecision, aiScores])

  const sorted = useMemo(() => {
    return [...suppliers].sort((a, b) => {
      const ra = rankMap[a.supplier_email]
      const rb = rankMap[b.supplier_email]
      if (ra !== undefined && rb !== undefined) return ra - rb
      if (ra !== undefined) return -1
      if (rb !== undefined) return 1
      // fall back to AI score if available, else static score
      const aScore = Number(aiScores[a.supplier_email]?.score ?? scores[a.id] ?? 0)
      const bScore = Number(aiScores[b.supplier_email]?.score ?? scores[b.id] ?? 0)
      return (isNaN(bScore) ? 0 : bScore) - (isNaN(aScore) ? 0 : aScore)
    })
  }, [suppliers, rankMap, scores, aiScores])

  const bestValueId = useMemo(() => {
    return valid.length > 0
      ? valid.reduce((best, s) => (scores[s.id] ?? 0) > (scores[best.id] ?? 0) ? s : best, valid[0]).id
      : null
  }, [valid, scores])

  function tagsFor(s: Supplier) {
    const tags: { icon: React.ElementType; label: string; color: string }[] = []
    if (minPrice !== null && s.price === minPrice)
      tags.push({ icon: TrendingDown, label: 'Cheapest', color: 'bg-green-900/40 text-green-300 border-green-700/50' })
    if (minDelivery !== null && s.delivery_days === minDelivery)
      tags.push({ icon: Zap, label: 'Fastest', color: 'bg-blue-900/40 text-blue-300 border-blue-700/50' })
    if (s.id === bestValueId && s.supplier_email !== aiChoiceEmail)
      tags.push({ icon: Star, label: 'Best Value', color: 'bg-purple-900/40 text-purple-300 border-purple-700/50' })
    return tags
  }

  const colsClass =
    sorted.length === 1 ? 'grid-cols-1 max-w-sm' :
    sorted.length === 2 ? 'grid-cols-1 sm:grid-cols-2' :
    'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'

  const chartSuppliers = sorted.map((s) => ({
    label: s.supplier_email.split('@')[0],
    email: s.supplier_email,
    price: s.price,
    delivery_days: s.delivery_days,
    isRecommended: s.supplier_email === aiChoiceEmail,
  }))

  const hasAiScores = Object.keys(aiScores).length > 0

  return (
    <div className="space-y-6">

      {/* ── AI Decision Panel — full intelligence above cards ──────────────── */}
      {(deciding || panelDecision) && (
        <AIDecisionPanel
          decision={panelDecision}
          loading={deciding}
          rfqId={rfqId}
          rfqTitle={_title}
          rfqDescription={_description}
          suppliers={suppliers.map((s) => ({
            email: s.supplier_email,
            price: s.price,
            delivery_days: s.delivery_days,
            answers: s.answers,
          }))}
          acceptedSupplier={acceptedSupplier}
          onAccepted={onAccepted}
        />
      )}

      {/* AI insights panel (from chat decision — kept for compatibility) */}
      {aiDecision && !panelDecision && (
        <InsightsPanel
          insights={aiDecision.insights}
          warnings={aiDecision.warnings}
          tradeoffs={aiDecision.tradeoffs}
          winner={`${aiDecision.best_supplier} — ${aiDecision.decision}`}
        />
      )}

      {/* Supplier Cards */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-white">Supplier Comparison</h2>
            {aiDecision && (
              <span className="text-xs text-amber-400 flex items-center gap-1">
                <Bot className="h-3 w-3" />AI ranked
              </span>
            )}
            <span className="text-xs text-gray-500">{sorted.length} supplier{sorted.length !== 1 ? 's' : ''}</span>
          </div>

          {/* AI scoring status + re-score button */}
          {suppliers.length > 0 && (
            <div className="flex items-center gap-2">
              {scoring && (
                <span className="inline-flex items-center gap-1.5 text-xs text-violet-400/70">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  AI scoring…
                </span>
              )}
              {!scoring && autoRan && !scoreError && (
                <span className="inline-flex items-center gap-1 text-[11px] text-emerald-500/70 font-medium">
                  <Sparkles className="h-2.5 w-2.5" />
                  AI scored
                </span>
              )}
              <button
                onClick={scoreWithAI}
                disabled={scoring}
                className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-violet-500/30 bg-violet-500/8 hover:bg-violet-500/15 text-violet-300 font-medium transition-all disabled:opacity-50"
              >
                <Sparkles className="h-3 w-3" />
                {hasAiScores ? 'Re-score' : 'Score with AI'}
              </button>
            </div>
          )}
        </div>

        {scoreError && (
          <p className="text-xs text-red-400 flex items-center gap-1.5">
            <AlertTriangle className="h-3.5 w-3.5" />{scoreError}
          </p>
        )}

        <div className={`grid ${colsClass} gap-5`}>
          {sorted.map((s) => (
            <SupplierCard
              key={s.id}
              supplier={s}
              tags={tagsFor(s)}
              score={scores[s.id] ?? 0}
              isAIChoice={s.supplier_email === aiChoiceEmail}
              aiRank={rankMap[s.supplier_email]}
              rfqTitle={_title}
              rfqDescription={_description}
              competitors={sorted.filter((c) => c.id !== s.id)}
              aiScore={aiScores[s.supplier_email] ?? null}
              minPrice={minPrice}
              maxPrice={prices.length ? Math.max(...prices) : null}
              minDelivery={minDelivery}
              maxDelivery={deliveries.length ? Math.max(...deliveries) : null}
              formSchema={fields.length > 0 ? fields : undefined}
              rfqId={rfqId}
              acceptedSupplier={acceptedSupplier}
              onAccepted={onAccepted}
              rfqStatus={rfqStatus}
            />
          ))}
        </div>
      </div>

      {/* Charts */}
      {valid.length > 1 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-white">Visual Comparison</h2>
            <Badge className="bg-gray-800 text-gray-400 border-gray-700 text-xs">
              {aiDecision ? 'Gold = AI Choice' : 'Gold = Best value'}
            </Badge>
          </div>
          <SupplierCharts suppliers={chartSuppliers} />
        </div>
      )}

      {/* Score breakdown */}
      {valid.length > 1 && (() => {
        const LABEL_CLS: Record<string, string> = {
          Excellent: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
          Good:      'bg-blue-500/15 text-blue-300 border-blue-500/30',
          Fair:      'bg-yellow-500/15 text-yellow-300 border-yellow-500/30',
          Poor:      'bg-red-500/15 text-red-300 border-red-500/30',
        }
        return (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 className="h-4 w-4 text-gray-400" />
            <p className="text-sm font-medium text-gray-300">Scoring Breakdown</p>
            <span className="text-xs text-gray-600 ml-auto">
              {hasAiScores ? 'AI-powered scores' : 'price 40% · delivery 30% · experience 10% · quality 10% · completeness 10%'}
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {sorted.map((s) => {
              const aiSc = aiScores[s.supplier_email]
              const displayScore = aiSc ? Math.round(Number(aiSc.score) || 0) : (scores[s.id] ?? null)
              const isTop = s.supplier_email === aiChoiceEmail
              return (
                <div
                  key={s.id}
                  className={`rounded-lg p-3 transition-all duration-500 ${isTop ? 'bg-amber-900/20 border border-amber-700/30' : 'bg-gray-800/60'}`}
                >
                  <p className="text-xs text-gray-400 truncate mb-1">
                    {s.supplier_email.split('@')[0]}
                  </p>
                  <div className="flex items-end gap-1">
                    <span className={`text-2xl font-bold transition-colors duration-500 ${isTop ? 'text-amber-300' : 'text-white'}`}>
                      {displayScore ?? '—'}
                    </span>
                    <span className="text-xs text-gray-500 mb-0.5">/100</span>
                    {aiSc && (
                      <span className={`text-[10px] font-semibold ml-1 mb-0.5 px-1.5 py-0.5 rounded border ${LABEL_CLS[aiSc.label] ?? LABEL_CLS.Fair}`}>
                        {aiSc.label}
                      </span>
                    )}
                  </div>
                  <div className="mt-2 h-1.5 rounded-full bg-gray-700 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${
                        aiSc
                          ? 'bg-gradient-to-r from-violet-500 to-blue-500'
                          : isTop ? 'bg-amber-500' : 'bg-gray-500'
                      }`}
                      style={{ width: `${displayScore ?? 0}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
        )
      })()}
    </div>
  )
}
