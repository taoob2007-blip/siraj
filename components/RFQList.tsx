'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Plus, Clock, Pause, Play, XCircle, Trash2, Loader2,
  Users, MessageSquare, TrendingUp, Activity, Search,
  AlertCircle, Zap, ArrowUpDown, Brain,
  Sparkles, BarChart3, Trophy, Eye, ChevronRight,
  Target, AlertTriangle, CheckCircle2,
} from 'lucide-react'
import Link from 'next/link'

// ── Types ─────────────────────────────────────────────────────────────────────

interface RFQ {
  id: string
  title: string
  description: string | null
  status: string
  created_at: string
  invite_count: number
  response_count: number
  _optimistic?: true
}

interface ScoredRFQ extends RFQ {
  priority_score: number
  rank: number
  score_breakdown: {
    response_count: number
    response_speed: number
    price_competitiveness: number
    supplier_quality: number
  }
}

// ── Scoring engine ────────────────────────────────────────────────────────────

function computePriorityScore(
  rfq: RFQ,
  allRfqs: RFQ[],
): ScoredRFQ['score_breakdown'] & { total: number } {
  const maxResponses = Math.max(...allRfqs.map((r) => r.response_count), 1)
  const maxInvites   = Math.max(...allRfqs.map((r) => r.invite_count), 1)
  const ageDays      = Math.floor((Date.now() - new Date(rfq.created_at).getTime()) / 86_400_000)

  // 1. Response count (30%) — relative to best-performing RFQ
  const responseCountScore = Math.round((rfq.response_count / maxResponses) * 100)

  // 2. Response speed (25%) — responses per day, penalise if age >14 with 0 responses
  const rPerDay = ageDays > 0 ? rfq.response_count / ageDays : rfq.response_count
  const maxRPerDay = Math.max(
    ...allRfqs.map((r) => {
      const d = Math.floor((Date.now() - new Date(r.created_at).getTime()) / 86_400_000)
      return d > 0 ? r.response_count / d : r.response_count
    }),
    0.01,
  )
  let responseSpeedScore = Math.round((rPerDay / maxRPerDay) * 100)
  if (ageDays > 14 && rfq.response_count === 0) responseSpeedScore = Math.max(responseSpeedScore - 30, 0)

  // 3. Price competitiveness (25%) — proxy: invite diversity (more invites = more competition)
  const inviteScore = Math.round((rfq.invite_count / maxInvites) * 100)
  const responseRatio = rfq.invite_count > 0 ? rfq.response_count / rfq.invite_count : 0
  const priceCompetitivenessScore = Math.min(Math.round(inviteScore * 0.6 + responseRatio * 40), 100)

  // 4. Supplier quality (20%) — engagement health: penalise if 0 responses from many invites
  let supplierQualityScore = 50
  if (rfq.invite_count === 0) supplierQualityScore = 20
  else if (rfq.response_count === 0) supplierQualityScore = 10
  else {
    const engagementRate = rfq.response_count / rfq.invite_count
    supplierQualityScore = Math.min(Math.round(engagementRate * 100 + 30), 100)
  }
  if (rfq.status !== 'active') supplierQualityScore = Math.round(supplierQualityScore * 0.5)

  const total = Math.round(
    responseCountScore       * 0.30 +
    responseSpeedScore       * 0.25 +
    priceCompetitivenessScore * 0.25 +
    supplierQualityScore     * 0.20,
  )

  return {
    response_count:        responseCountScore,
    response_speed:        responseSpeedScore,
    price_competitiveness: priceCompetitivenessScore,
    supplier_quality:      supplierQualityScore,
    total,
  }
}

function scoreRFQs(rfqs: RFQ[]): ScoredRFQ[] {
  const scored = rfqs.map((rfq) => {
    const breakdown = computePriorityScore(rfq, rfqs)
    return { ...rfq, priority_score: breakdown.total, score_breakdown: breakdown, rank: 0 }
  })
  const sorted = [...scored].sort((a, b) => b.priority_score - a.priority_score)
  sorted.forEach((r, i) => { r.rank = i + 1 })
  return sorted
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function responseRate(rfq: RFQ) {
  return rfq.invite_count > 0 ? Math.round((rfq.response_count / rfq.invite_count) * 100) : 0
}

function daysSince(dateStr: string) {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86_400_000)
}

function aiInsight(rfq: ScoredRFQ): string {
  const r = responseRate(rfq)
  const age = daysSince(rfq.created_at)
  if (rfq.response_count === 0 && rfq.invite_count === 0) return 'No suppliers invited yet — start by sending invites.'
  if (rfq.response_count === 0 && rfq.invite_count > 0) return `${rfq.invite_count} suppliers invited but no quotes yet — follow up soon.`
  if (r >= 80) return `${rfq.response_count} responses — strong competition, ideal for negotiation.`
  if (r >= 50) return 'Solid response rate — enough quotes for a reliable AI comparison.'
  if (r >= 25) return 'Moderate engagement — consider sending reminder invitations.'
  if (rfq.response_count >= 2) return 'Low response rate — widen your supplier pool for better coverage.'
  if (rfq.response_count === 1) return 'Only 1 quote received — invite more suppliers to enable AI ranking.'
  if (age > 7) return 'Inactive for 7+ days — consider nudging suppliers or refreshing the RFQ.'
  return 'Awaiting responses — AI analysis activates once quotes arrive.'
}

function scoreColor(score: number) {
  if (score >= 80) return { text: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/25', bar: 'from-emerald-500 to-green-400' }
  if (score >= 50) return { text: 'text-yellow-400',  bg: 'bg-yellow-500/10 border-yellow-500/25',   bar: 'from-yellow-500 to-orange-400' }
  return              { text: 'text-red-400',    bg: 'bg-red-500/10 border-red-500/25',         bar: 'from-red-500 to-rose-400' }
}

function engagementLabel(r: number, invites: number) {
  if (invites === 0) return { text: 'No invites sent',    color: 'text-gray-600',   gradient: 'from-gray-700 to-gray-600' }
  if (r === 0)       return { text: 'Awaiting responses', color: 'text-orange-400', gradient: 'from-orange-700 to-orange-500' }
  if (r >= 75)       return { text: 'High competition',   color: 'text-emerald-400',gradient: 'from-emerald-500 to-green-400' }
  if (r >= 50)       return { text: 'Strong engagement',  color: 'text-blue-400',   gradient: 'from-blue-500 to-cyan-400' }
  if (r >= 25)       return { text: 'In progress',        color: 'text-blue-400',   gradient: 'from-blue-600 to-blue-400' }
  return               { text: 'Weak response',          color: 'text-yellow-500', gradient: 'from-yellow-600 to-orange-400' }
}

// ── Constants ─────────────────────────────────────────────────────────────────

const STATUS_CFG: Record<string, { badge: string; dot: string }> = {
  active:    { badge: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30', dot: 'bg-emerald-400' },
  paused:    { badge: 'bg-yellow-500/15 text-yellow-300 border-yellow-500/30',   dot: 'bg-yellow-400' },
  cancelled: { badge: 'bg-red-500/15 text-red-300 border-red-500/30',            dot: 'bg-red-400' },
  closed:    { badge: 'bg-gray-600/20 text-gray-400 border-gray-600/30',         dot: 'bg-gray-500' },
  archived:  { badge: 'bg-gray-700/20 text-gray-500 border-gray-700/30',         dot: 'bg-gray-600' },
}

// ── Sub-components ────────────────────────────────────────────────────────────

function KPICard({ label, value, sub, icon: Icon, cls }: {
  label: string; value: string | number; sub?: string; icon: React.ElementType; cls: string
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/[0.07] bg-[#111827] p-5 group card-hover">
      <div className={`absolute -top-6 -right-6 h-16 w-16 rounded-full blur-2xl opacity-20 group-hover:opacity-30 transition-opacity ${cls}`} />
      <div className="relative">
        <div className="flex items-start justify-between mb-3">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{label}</p>
          <div className={`p-1.5 rounded-lg border ${cls}`}><Icon className="h-3.5 w-3.5" /></div>
        </div>
        <p className="text-2xl font-bold text-white">{value}</p>
        {sub && <p className="text-xs text-gray-600 mt-1">{sub}</p>}
      </div>
    </div>
  )
}

function SmartProgressBar({ value, invites }: { value: number; invites: number }) {
  const { text, color, gradient } = engagementLabel(value, invites)
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className={`text-[11px] font-medium ${color}`}>{text}</span>
        {invites > 0 && <span className="text-[11px] text-gray-600 font-mono">{value}%</span>}
      </div>
      <div className="h-1.5 w-full rounded-full bg-gray-800/80 overflow-hidden">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${gradient} transition-all duration-700 ease-out`}
          style={{ width: `${Math.max(invites > 0 ? Math.min(value, 100) : 0, value > 0 ? 4 : 0)}%` }}
        />
      </div>
    </div>
  )
}

function PriorityScoreBadge({ score }: { score: number }) {
  const { text, bg, bar } = scoreColor(score)
  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${bg}`}>
      <div className="flex-1">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Priority Score</span>
          <span className={`text-sm font-bold ${text}`}>{score}<span className="text-xs text-gray-600 font-normal">/100</span></span>
        </div>
        <div className="h-1 w-full rounded-full bg-gray-800 overflow-hidden">
          <div
            className={`h-full rounded-full bg-gradient-to-r ${bar} transition-all duration-700`}
            style={{ width: `${score}%` }}
          />
        </div>
      </div>
    </div>
  )
}

function ActionBtn({ children, onClick, loading, disabled, cls }: {
  children: React.ReactNode; onClick: () => void; loading: boolean; disabled: boolean; cls: string
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg transition-all disabled:opacity-40 ${cls}`}
    >
      {loading && <Loader2 className="h-3 w-3 animate-spin" />}
      {children}
    </button>
  )
}

// ── AI Decision Guidance Panel ────────────────────────────────────────────────

function DecisionGuidancePanel({ rfqs }: { rfqs: ScoredRFQ[] }) {
  if (rfqs.length === 0) return null

  const active  = rfqs.filter((r) => r.status === 'active')
  const best    = active[0] ?? rfqs[0]
  const weak    = rfqs.filter((r) => r.priority_score < 40 && r.status === 'active')
  const needsAttention = rfqs.filter(
    (r) => r.status === 'active' && r.invite_count > 0 && r.response_count === 0 && daysSince(r.created_at) > 3
  )

  const bestRate = responseRate(best)

  const whyBest: string[] = []
  if (best.score_breakdown.price_competitiveness >= 70) whyBest.push('High supplier competition drives cost advantage')
  if (best.score_breakdown.response_speed >= 70)         whyBest.push('Fast response velocity — suppliers are engaged')
  if (best.score_breakdown.supplier_quality >= 70)       whyBest.push('Strong engagement rate from invited suppliers')
  if (best.response_count >= 2)                          whyBest.push(`${best.response_count} quotes received — ready for AI comparison`)
  if (bestRate >= 50)                                    whyBest.push(`${bestRate}% response rate — above average`)
  if (whyBest.length === 0)                              whyBest.push('Highest priority score among all active RFQs')

  return (
    <div className="relative overflow-hidden rounded-2xl border border-blue-500/20 bg-gradient-to-br from-[#0d1a2e] via-[#0f1629] to-[#0d1220] p-6">
      {/* bg glow */}
      <div className="pointer-events-none absolute -top-12 -left-12 h-40 w-40 rounded-full bg-blue-600/8 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-12 -right-12 h-40 w-40 rounded-full bg-violet-600/8 blur-3xl" />

      <div className="relative">
        {/* Title */}
        <div className="flex items-center gap-2.5 mb-5">
          <div className="p-2 rounded-xl bg-blue-500/15 border border-blue-500/20">
            <Brain className="h-4 w-4 text-blue-400" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white">AI Decision Guidance</h2>
            <p className="text-[11px] text-gray-600">Ranked by priority score · Updates in real-time</p>
          </div>
          <span className="ml-auto inline-flex items-center gap-1 text-[10px] px-2 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 font-semibold">
            <Sparkles className="h-2.5 w-2.5" />
            Live
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

          {/* Focus RFQ */}
          <div className="md:col-span-1 space-y-3">
            <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
              <Target className="h-3 w-3 text-emerald-400" />
              Focus on this RFQ
            </p>
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3.5 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-semibold text-white leading-snug line-clamp-2">{best.title}</p>
                <span className={`text-sm font-bold shrink-0 ${scoreColor(best.priority_score).text}`}>
                  {best.priority_score}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Users className="h-3 w-3" />
                <span>{best.invite_count} invited</span>
                <MessageSquare className="h-3 w-3 ml-1" />
                <span>{best.response_count} quoted</span>
              </div>
              <Link href={`/rfqs/${best.id}`}>
                <button className="w-full mt-1 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-300 text-xs font-semibold transition-all flex items-center justify-center gap-1.5">
                  <Eye className="h-3 w-3" />
                  Open RFQ
                </button>
              </Link>
            </div>
          </div>

          {/* Why */}
          <div className="md:col-span-1 space-y-3">
            <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle2 className="h-3 w-3 text-blue-400" />
              Why it ranks highest
            </p>
            <ul className="space-y-2">
              {whyBest.slice(0, 3).map((w, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-gray-400">
                  <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-blue-400 shrink-0" />
                  {w}
                </li>
              ))}
            </ul>
          </div>

          {/* Risks */}
          <div className="md:col-span-1 space-y-3">
            <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
              <AlertTriangle className="h-3 w-3 text-orange-400" />
              Needs attention
            </p>
            {weak.length === 0 && needsAttention.length === 0 ? (
              <p className="text-xs text-gray-600 flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                All active RFQs are performing well.
              </p>
            ) : (
              <ul className="space-y-2">
                {needsAttention.slice(0, 2).map((r) => (
                  <li key={r.id} className="flex items-start gap-2">
                    <AlertCircle className="h-3 w-3 text-orange-400 mt-0.5 shrink-0" />
                    <span className="text-xs text-gray-500">
                      <span className="text-gray-300 font-medium">{r.title.slice(0, 28)}{r.title.length > 28 ? '…' : ''}</span>
                      {' '}— no responses in {daysSince(r.created_at)}d
                    </span>
                  </li>
                ))}
                {weak.filter((r) => !needsAttention.find((n) => n.id === r.id)).slice(0, 2).map((r) => (
                  <li key={r.id} className="flex items-start gap-2">
                    <Zap className="h-3 w-3 text-yellow-500 mt-0.5 shrink-0" />
                    <span className="text-xs text-gray-500">
                      <span className="text-gray-300 font-medium">{r.title.slice(0, 28)}{r.title.length > 28 ? '…' : ''}</span>
                      {' '}— score {r.priority_score}/100
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── RFQ Card ──────────────────────────────────────────────────────────────────

function RFQCard({ rfq, pending, onUpdateStatus, onDelete }: {
  rfq: ScoredRFQ
  pending: string | undefined
  onUpdateStatus: (id: string, status: string) => void
  onDelete: (id: string) => void
}) {
  const status     = rfq.status ?? 'active'
  const cfg        = STATUS_CFG[status] ?? STATUS_CFG.active
  const insight    = aiInsight(rfq)
  const rate       = responseRate(rfq)
  const busy       = !!pending
  const isTop      = rfq.rank === 1 && rfq.status === 'active' && rfq.response_count > 0
  const { text: scoreText } = scoreColor(rfq.priority_score)

  return (
    <div
      className={[
        'relative group rounded-2xl border transition-all duration-200 bg-[#111827]',
        'hover:-translate-y-0.5 hover:shadow-xl hover:shadow-black/30',
        isTop
          ? 'border-blue-500/40 shadow-lg shadow-blue-500/10'
          : 'border-white/[0.07] hover:border-white/[0.14]',
      ].join(' ')}
    >
      {/* top glow strip */}
      {isTop && (
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent rounded-t-2xl" />
      )}

      {/* Rank badge */}
      <div className="absolute -top-3 left-4 z-10 flex items-center gap-2">
        <span className={`inline-flex items-center justify-center h-6 w-6 rounded-full text-[10px] font-bold border ${
          rfq.rank === 1 ? 'bg-amber-500 border-amber-400 text-black shadow-lg shadow-amber-500/30'
          : rfq.rank === 2 ? 'bg-gray-400 border-gray-300 text-black'
          : rfq.rank === 3 ? 'bg-orange-700 border-orange-600 text-white'
          : 'bg-[#1a2233] border-white/[0.10] text-gray-500'
        }`}>
          #{rfq.rank}
        </span>
        {isTop && (
          <span className="inline-flex items-center gap-1 bg-gradient-to-r from-blue-600 to-violet-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-lg shadow-blue-500/25">
            <Trophy className="h-2.5 w-2.5" />
            AI Recommended
          </span>
        )}
      </div>

      <div className="p-5 pt-6 space-y-4">

        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-white leading-snug truncate">{rfq.title}</h2>
              {rfq._optimistic && (
                <span className="inline-flex items-center gap-1 text-[10px] text-blue-400 bg-blue-500/10 border border-blue-500/20 px-1.5 py-0.5 rounded-full shrink-0">
                  <Loader2 className="h-2.5 w-2.5 animate-spin" />
                  Syncing
                </span>
              )}
            </div>
            {rfq.description && (
              <p className="text-xs text-gray-600 mt-0.5 truncate">{rfq.description}</p>
            )}
          </div>
          <Badge className={`${cfg.badge} capitalize text-[10px] border px-2 py-0.5 font-semibold shrink-0`}>
            <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot} inline-block mr-1`} />
            {status}
          </Badge>
        </div>

        {/* Priority Score */}
        <PriorityScoreBadge score={rfq.priority_score} />

        {/* Metrics */}
        <div className="flex items-center gap-4 text-xs text-gray-500">
          <span className="flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5 text-gray-600" />
            <span className="font-semibold text-gray-300">{rfq.invite_count}</span>
            <span className="text-gray-700">suppliers</span>
          </span>
          <span className="flex items-center gap-1.5">
            <MessageSquare className="h-3.5 w-3.5 text-gray-600" />
            <span className="font-semibold text-gray-300">{rfq.response_count}</span>
            <span className="text-gray-700">quotes</span>
          </span>
          {rfq.invite_count > 0 && (
            <span className="flex items-center gap-1.5">
              <BarChart3 className="h-3.5 w-3.5 text-gray-600" />
              <span className={`font-semibold ${rate >= 50 ? 'text-emerald-400' : rate > 0 ? 'text-blue-400' : 'text-orange-400'}`}>
                {rate}%
              </span>
            </span>
          )}
          <span className="ml-auto flex items-center gap-1 text-gray-700">
            <Clock className="h-3 w-3" />
            {new Date(rfq.created_at).toISOString().split('T')[0]}
          </span>
        </div>

        {/* Score breakdown */}
        <div className="grid grid-cols-4 gap-1.5">
          {([
            { label: 'Responses', value: rfq.score_breakdown.response_count },
            { label: 'Speed',     value: rfq.score_breakdown.response_speed },
            { label: 'Competition', value: rfq.score_breakdown.price_competitiveness },
            { label: 'Quality',   value: rfq.score_breakdown.supplier_quality },
          ] as const).map(({ label, value }) => {
            const { text, bar } = scoreColor(value)
            return (
              <div key={label} className="space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-[9px] text-gray-600 font-medium truncate">{label}</span>
                  <span className={`text-[9px] font-bold ${text}`}>{value}</span>
                </div>
                <div className="h-1 rounded-full bg-gray-800 overflow-hidden">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${bar}`}
                    style={{ width: `${value}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>

        {/* AI Insight */}
        <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-blue-500/[0.07] border border-blue-500/15">
          <Brain className="h-3.5 w-3.5 text-blue-400 mt-0.5 shrink-0" />
          <p className="text-xs text-blue-300/80 leading-relaxed">
            <span className="font-semibold text-blue-300">AI: </span>{insight}
          </p>
        </div>

        {/* Progress */}
        <SmartProgressBar value={rate} invites={rfq.invite_count} />
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between px-5 py-3 border-t border-white/[0.05] bg-white/[0.015] rounded-b-2xl gap-2">
        <div className="flex items-center gap-2">
          <Link href={`/rfqs/${rfq.id}`}>
            <button className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-semibold transition-all">
              <Eye className="h-3.5 w-3.5" />
              View Details
            </button>
          </Link>
          {rfq.response_count >= 2 && (
            <Link href={`/rfqs/${rfq.id}`}>
              <button className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-violet-500/30 bg-violet-500/10 hover:bg-violet-500/20 text-violet-300 font-medium transition-all">
                <Sparkles className="h-3.5 w-3.5" />
                AI Analysis
              </button>
            </Link>
          )}
        </div>
        <div className="flex items-center gap-1">
          {status === 'paused' ? (
            <ActionBtn onClick={() => onUpdateStatus(rfq.id, 'active')} loading={busy && pending === 'active'} disabled={busy} cls="text-blue-400 hover:bg-blue-500/10">
              {!(busy && pending === 'active') && <Play className="h-3 w-3" />}Resume
            </ActionBtn>
          ) : status !== 'cancelled' ? (
            <ActionBtn onClick={() => onUpdateStatus(rfq.id, 'paused')} loading={busy && pending === 'paused'} disabled={busy} cls="text-yellow-500 hover:bg-yellow-500/10">
              {!(busy && pending === 'paused') && <Pause className="h-3 w-3" />}Pause
            </ActionBtn>
          ) : null}
          {status !== 'cancelled' && (
            <ActionBtn onClick={() => onUpdateStatus(rfq.id, 'cancelled')} loading={busy && pending === 'cancelled'} disabled={busy} cls="text-red-500 hover:bg-red-500/10">
              {!(busy && pending === 'cancelled') && <XCircle className="h-3 w-3" />}Cancel
            </ActionBtn>
          )}
          <button
            disabled={busy}
            onClick={() => onDelete(rfq.id)}
            className="p-1.5 rounded-lg text-gray-700 hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-40"
          >
            {busy && pending === 'delete'
              ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
              : <Trash2 className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Insights strip ────────────────────────────────────────────────────────────

function InsightsStrip({ rfqs, onFilter }: { rfqs: RFQ[]; onFilter: (s: string) => void }) {
  const noResp  = rfqs.filter((r) => r.status === 'active' && r.invite_count > 0 && r.response_count === 0)
  const highEng = rfqs.filter((r) => responseRate(r) >= 50)
  const stale   = rfqs.filter((r) => r.status === 'active' && daysSince(r.created_at) > 7 && r.response_count === 0)

  const chips = [
    noResp.length > 0  && { icon: AlertCircle, color: 'text-orange-400 bg-orange-500/8 border-orange-500/20', label: `${noResp.length} active with no responses`, action: () => onFilter('active') },
    highEng.length > 0 && { icon: Zap,         color: 'text-emerald-400 bg-emerald-500/8 border-emerald-500/20', label: `${highEng.length} with 50%+ response rate`, action: () => onFilter('all') },
    stale.length > 0   && { icon: Clock,        color: 'text-yellow-400 bg-yellow-500/8 border-yellow-500/20',   label: `${stale.length} inactive 7+ days`, action: () => onFilter('active') },
  ].filter(Boolean) as { icon: React.ElementType; color: string; label: string; action: () => void }[]

  if (!chips.length) return null
  return (
    <div className="flex flex-wrap gap-2">
      {chips.map((chip, i) => (
        <button key={i} onClick={chip.action} className={`inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border font-medium transition-opacity hover:opacity-75 ${chip.color}`}>
          <chip.icon className="h-3.5 w-3.5" />
          {chip.label}
        </button>
      ))}
    </div>
  )
}

// ── Main export ───────────────────────────────────────────────────────────────

export function RFQList({ initialRfqs }: { initialRfqs: RFQ[] }) {
  const router = useRouter()
  const [rfqs, setRfqs]             = useState<RFQ[]>(initialRfqs)
  const [pending, setPending]       = useState<Record<string, string>>({})
  const [search, setSearch]         = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortBy, setSortBy]         = useState<'score' | 'newest' | 'responses' | 'engagement'>('score')

  const totalResponses = rfqs.reduce((s, r) => s + r.response_count, 0)
  const totalInvites   = rfqs.reduce((s, r) => s + r.invite_count, 0)
  const activeCount    = rfqs.filter((r) => r.status === 'active').length
  const avgRate        = totalInvites > 0 ? Math.round((totalResponses / totalInvites) * 100) : 0

  // Score ALL rfqs (needed for ranking + guidance panel)
  const allScored = useMemo(() => scoreRFQs(rfqs), [rfqs])

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    let list = allScored.filter((r) => {
      const matchSearch = !q || r.title.toLowerCase().includes(q) || (r.description ?? '').toLowerCase().includes(q)
      const matchStatus = statusFilter === 'all' || r.status === statusFilter
      return matchSearch && matchStatus
    })
    if (sortBy === 'score')      list = [...list].sort((a, b) => b.priority_score - a.priority_score)
    if (sortBy === 'responses')  list = [...list].sort((a, b) => b.response_count - a.response_count)
    if (sortBy === 'engagement') list = [...list].sort((a, b) => responseRate(b) - responseRate(a))
    if (sortBy === 'newest')     list = [...list].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    return list
  }, [allScored, search, statusFilter, sortBy])

  async function updateStatus(id: string, status: string) {
    setPending((p) => ({ ...p, [id]: status }))
    try {
      const res = await fetch(`/api/rfqs/${id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (!res.ok) throw new Error()
      setRfqs((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)))
    } catch { /* silent */ } finally {
      setPending((p) => { const n = { ...p }; delete n[id]; return n })
    }
  }

  async function refetchRfqs() {
    const res = await fetch('/api/rfqs/list', { cache: 'no-store' })
    const data = await res.json()
    if (Array.isArray(data)) setRfqs(data)
  }

  async function deleteRFQ(id: string) {
    if (!confirm('Delete this RFQ? This cannot be undone.')) return
    console.log('Deleting RFQ:', id)
    setPending((p) => ({ ...p, [id]: 'delete' }))
    try {
      const res = await fetch(`/api/rfqs/${id}`, { method: 'DELETE' })
      if (res.ok || res.status === 404) {
        await refetchRfqs()
        router.refresh()
      } else {
        const json = await res.json().catch(() => ({}))
        throw new Error(json.error || `Delete failed (${res.status})`)
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete RFQ')
    } finally {
      setPending((p) => { const n = { ...p }; delete n[id]; return n })
    }
  }

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">My RFQs</h1>
          <p className="text-xs text-gray-600 mt-0.5">{rfqs.length} total · {activeCount} active · ranked by AI score</p>
        </div>
        <Link href="/rfqs/new">
          <button className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-95 text-white text-sm font-semibold transition-all shadow-lg shadow-blue-600/20">
            <Plus className="h-4 w-4" />New RFQ
          </button>
        </Link>
      </div>

      {/* AI Decision Guidance */}
      {allScored.length > 0 && <DecisionGuidancePanel rfqs={allScored} />}

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KPICard label="Total RFQs"        value={rfqs.length}    sub={`${activeCount} active`}            icon={Activity}      cls="bg-blue-500/10 border-blue-500/20 text-blue-400" />
        <KPICard label="Active"            value={activeCount}    sub="accepting quotes"                    icon={Zap}           cls="bg-emerald-500/10 border-emerald-500/20 text-emerald-400" />
        <KPICard label="Total Responses"   value={totalResponses} sub={`from ${totalInvites} invitations`} icon={MessageSquare} cls="bg-violet-500/10 border-violet-500/20 text-violet-400" />
        <KPICard label="Avg Response Rate" value={`${avgRate}%`}  sub="across all RFQs"                    icon={TrendingUp}    cls="bg-orange-500/10 border-orange-500/20 text-orange-400" />
      </div>

      {/* Insights */}
      <InsightsStrip rfqs={rfqs} onFilter={setStatusFilter} />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2.5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-600 pointer-events-none" />
          <Input
            placeholder="Search RFQs…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-[#111827] border-white/[0.08] text-white placeholder:text-gray-700 focus:border-blue-500/50 h-9 text-sm rounded-xl"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-36 bg-[#111827] border-white/[0.08] text-gray-400 h-9 text-sm rounded-xl">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent className="bg-[#111827] border-white/[0.08] text-gray-300">
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="paused">Paused</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
          <SelectTrigger className="w-full sm:w-44 bg-[#111827] border-white/[0.08] text-gray-400 h-9 text-sm rounded-xl gap-1.5">
            <ArrowUpDown className="h-3.5 w-3.5 text-gray-600" />
            <SelectValue placeholder="Sort" />
          </SelectTrigger>
          <SelectContent className="bg-[#111827] border-white/[0.08] text-gray-300">
            <SelectItem value="score">AI Score ↓</SelectItem>
            <SelectItem value="newest">Newest first</SelectItem>
            <SelectItem value="responses">Most responses</SelectItem>
            <SelectItem value="engagement">Best engagement</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Cards */}
      {filtered.length === 0 ? (
        <div className="py-24 text-center space-y-3">
          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] w-fit mx-auto">
            <Search className="h-7 w-7 text-gray-700" />
          </div>
          <p className="text-sm text-gray-500">No RFQs match your filters.</p>
          <button onClick={() => { setSearch(''); setStatusFilter('all') }} className="text-xs text-blue-400 hover:text-blue-300 underline underline-offset-2 transition-colors">
            Clear filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.map((rfq) => (
            <RFQCard key={rfq.id} rfq={rfq} pending={pending[rfq.id]} onUpdateStatus={updateStatus} onDelete={deleteRFQ} />
          ))}
        </div>
      )}
    </div>
  )
}
