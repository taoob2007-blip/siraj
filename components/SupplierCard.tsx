'use client'

import { useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Toast } from '@/components/Toast'
import {
  Mail, DollarSign, Clock, ChevronDown, ChevronUp,
  MessageSquare, Copy, Check, Loader2, X, Trophy,
  Sparkles, Briefcase, FileText, Star, Package,
  TrendingDown, Zap, AlertTriangle, ShieldCheck, Info, CheckCircle2, XCircle,
} from 'lucide-react'
import type { SupplierScore } from '@/app/api/ai/score/route'
import type { RFQField } from '@/lib/types'

// ── Types ──────────────────────────────────────────────────────────────────────

export interface Supplier {
  id: string
  supplier_email: string
  price: number | null
  delivery_days: number | null
  answers: Record<string, string | number>
  created_at: string
}

export interface SupplierTag {
  icon: React.ElementType
  label: string
  color: string
}

export interface SupplierCardProps {
  supplier: Supplier
  tags: SupplierTag[]
  score: number
  isAIChoice: boolean
  aiRank?: number
  rfqTitle: string
  rfqDescription?: string | null
  competitors: Supplier[]
  aiScore?: SupplierScore | null
  minPrice?: number | null
  maxPrice?: number | null
  minDelivery?: number | null
  maxDelivery?: number | null
  formSchema?: RFQField[]
  rfqId?: string
  rfqStatus?: string
  acceptedSupplier?: string | null
  onAccepted?: (email: string) => void
}

// ── Insight types ──────────────────────────────────────────────────────────────

interface Insight {
  emoji: string
  label: string
  tone: 'positive' | 'warning' | 'neutral'
}

// ── Insights engine ────────────────────────────────────────────────────────────
//
// Rules:
//   1. Max 3 insights shown
//   2. Merge multiple warnings into one if both are "missing data"
//   3. Priority: warnings → strongest positive → one neutral
//   4. Never show redundant signals

function deriveInsights(
  supplier: Supplier,
  minPrice: number | null,
  maxPrice: number | null,
  minDelivery: number | null,
  maxDelivery: number | null,
): Insight[] {
  const a = supplier.answers ?? {}
  const warnings: Insight[]  = []
  const positives: Insight[] = []
  const neutrals: Insight[]  = []

  // ── Missing-data warnings (merged) ────────────────────────────────────────
  const missingExp      = a.experience_years === undefined && a.experience === undefined && a.years_experience === undefined
  const missingPortfolio = (a.portfolio === undefined || a.portfolio === '') &&
                           (a.past_projects === undefined || a.past_projects === '')

  if (missingExp && missingPortfolio) {
    warnings.push({ emoji: '⚠️', label: 'Limited supplier information', tone: 'warning' })
  } else {
    if (missingExp) warnings.push({ emoji: '⚠️', label: 'Experience not stated', tone: 'warning' })
    if (missingPortfolio) warnings.push({ emoji: '⚠️', label: 'No portfolio provided', tone: 'warning' })
  }

  // ── Response completeness warning ─────────────────────────────────────────
  const allVals = Object.values(a)
  const filled  = allVals.filter((v) => v !== '' && v !== null && v !== undefined).length
  if (allVals.length > 2 && filled / allVals.length < 0.5) {
    warnings.push({ emoji: '⚠️', label: 'Incomplete response', tone: 'warning' })
  }

  // ── Price signal ──────────────────────────────────────────────────────────
  if (supplier.price !== null && minPrice !== null && maxPrice !== null) {
    if (supplier.price === minPrice) {
      positives.push({ emoji: '💰', label: 'Most cost-effective', tone: 'positive' })
    } else if (supplier.price === maxPrice && maxPrice > minPrice) {
      warnings.push({ emoji: '⚠️', label: 'Highest priced offer', tone: 'warning' })
    }
  }

  // ── Delivery signal ───────────────────────────────────────────────────────
  if (supplier.delivery_days !== null && minDelivery !== null && maxDelivery !== null) {
    if (supplier.delivery_days === minDelivery) {
      positives.push({ emoji: '⚡', label: 'Fastest delivery', tone: 'positive' })
    } else if (
      maxDelivery > minDelivery &&
      (supplier.delivery_days - minDelivery) / (maxDelivery - minDelivery) >= 0.67
    ) {
      warnings.push({ emoji: '🐢', label: 'Slower delivery', tone: 'warning' })
    }
  }

  // ── Experience signal ─────────────────────────────────────────────────────
  const expRaw = a.experience_years ?? a.experience ?? a.years_experience
  if (expRaw !== undefined && expRaw !== '') {
    const n = Number(expRaw)
    if (!isNaN(n)) {
      if (n >= 10) positives.push({ emoji: '🏆', label: '10+ years experience', tone: 'positive' })
      else if (n >= 5) positives.push({ emoji: '🧠', label: '5+ years experience', tone: 'positive' })
      else if (n < 2) warnings.push({ emoji: '⚠️', label: 'Limited experience', tone: 'warning' })
      else neutrals.push({ emoji: '🔧', label: 'Moderate experience', tone: 'neutral' })
    }
  }

  // ── Portfolio signal ──────────────────────────────────────────────────────
  const portRaw = a.portfolio ?? a.past_projects ?? a.projects
  if (portRaw !== undefined && portRaw !== '') {
    const items = String(portRaw).split(/[,\n]+/).filter((s) => s.trim())
    if (items.length >= 3) positives.push({ emoji: '📁', label: 'Strong track record', tone: 'positive' })
    else if (items.length > 0) positives.push({ emoji: '📁', label: 'Past projects listed', tone: 'positive' })
  }

  // ── Quality signal ────────────────────────────────────────────────────────
  const qRaw = a.quality ?? a.quality_rating ?? a.quality_score
  if (qRaw !== undefined && qRaw !== '') {
    const qStr = String(qRaw).toLowerCase()
    const qNum = Number(qRaw)
    if (['excellent', 'outstanding', 'premium', 'high'].some((w) => qStr.includes(w)) || qNum >= 8) {
      positives.push({ emoji: '⭐', label: 'Excellent quality', tone: 'positive' })
    } else if (['poor', 'low', 'bad'].some((w) => qStr.includes(w)) || (!isNaN(qNum) && qNum < 4)) {
      warnings.push({ emoji: '⚠️', label: 'Quality concerns noted', tone: 'warning' })
    }
  }

  // ── Notes bonus ───────────────────────────────────────────────────────────
  const notes = a.notes ?? a.comments ?? a.remarks
  if (notes && String(notes).trim().length > 30) {
    neutrals.push({ emoji: '📝', label: 'Detailed notes provided', tone: 'neutral' })
  }

  // ── Assemble: max 3, priority order ──────────────────────────────────────
  // Deduplicate by label, then: 1 warning max + 1 positive + 1 neutral (or 2 positives if no warning)
  const seen = new Set<string>()
  const dedup = (arr: Insight[]) => arr.filter((i) => {
    if (seen.has(i.label)) return false
    seen.add(i.label)
    return true
  })

  const w = dedup(warnings).slice(0, 1)
  const p = dedup(positives).slice(0, warnings.length > 0 ? 1 : 2)
  const n = dedup(neutrals).slice(0, 3 - w.length - p.length)

  return [...w, ...p, ...n].slice(0, 3)
}

// ── Summary builder ────────────────────────────────────────────────────────────

function buildSummary(
  supplier: Supplier,
  isAIChoice: boolean,
  minPrice: number | null,
  minDelivery: number | null,
  aiExplanation?: string,
): string {
  if (aiExplanation) return aiExplanation

  const a = supplier.answers ?? {}
  const parts: string[] = []

  if (isAIChoice) parts.push('Top-ranked overall')
  else if (supplier.price !== null && minPrice !== null && supplier.price === minPrice)
    parts.push('Most cost-effective option')
  else if (supplier.delivery_days !== null && minDelivery !== null && supplier.delivery_days === minDelivery)
    parts.push('Fastest delivery available')
  else parts.push('Competitive offer')

  const expRaw  = a.experience_years ?? a.experience
  const hasPort = !!(a.portfolio ?? a.past_projects)
  const qRaw    = a.quality ?? a.quality_rating

  if (expRaw && Number(expRaw) >= 5) parts.push('with solid experience')
  else if (hasPort) parts.push('with a proven portfolio')
  else if (qRaw && ['excellent', 'good'].some((w) => String(qRaw).toLowerCase().includes(w)))
    parts.push('with a strong quality rating')

  if (supplier.delivery_days !== null && minDelivery !== null && supplier.delivery_days > minDelivery * 1.5)
    parts.push('— delivery is slower than alternatives')
  else if (supplier.price !== null && minPrice !== null && supplier.price > minPrice * 1.3)
    parts.push('— priced above market average')

  return parts.join(' ') + '.'
}

// ── Helpers ────────────────────────────────────────────────────────────────────

const HIDDEN_KEYS = new Set(['price', 'delivery_days', 'delivery'])

function prettyKey(k: string) {
  return k.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

function fieldIcon(k: string): React.ElementType {
  if (k.includes('experience') || k.includes('year')) return Briefcase
  if (k.includes('portfolio') || k.includes('project')) return Package
  if (k.includes('quality') || k.includes('rating')) return Star
  if (k.includes('note') || k.includes('comment') || k.includes('remark')) return FileText
  if (k.includes('warranty') || k.includes('guarantee')) return ShieldCheck
  return Info
}

const SCORE_GRADE: Record<string, { label: string; cls: string; bar: string }> = {
  Excellent: {
    label: 'Excellent',
    cls:   'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    bar:   'from-emerald-500 to-teal-400',
  },
  Good: {
    label: 'Good',
    cls:   'text-blue-400 bg-blue-500/10 border-blue-500/20',
    bar:   'from-blue-500 to-indigo-400',
  },
  Fair: {
    label: 'Fair',
    cls:   'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
    bar:   'from-yellow-500 to-amber-400',
  },
  Poor: {
    label: 'Poor',
    cls:   'text-red-400 bg-red-500/10 border-red-500/20',
    bar:   'from-red-500 to-rose-400',
  },
}

function gradeFor(score: number, label?: string) {
  const key = label ?? (score >= 80 ? 'Excellent' : score >= 60 ? 'Good' : score >= 40 ? 'Fair' : 'Poor')
  return SCORE_GRADE[key] ?? SCORE_GRADE.Fair
}

const INSIGHT_CLS: Record<Insight['tone'], string> = {
  positive: 'bg-emerald-500/8 border-emerald-500/15 text-emerald-400',
  warning:  'bg-amber-500/8  border-amber-500/15  text-amber-400',
  neutral:  'bg-gray-800/60  border-white/[0.06]  text-gray-500',
}

// ── Negotiate ──────────────────────────────────────────────────────────────────

interface NegotiateCtx {
  rfqTitle: string; rfqDescription?: string | null
  target: Supplier; competitors: Supplier[]
}

function useNegotiate() {
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<string | null>(null)
  const [copied, setCopied]   = useState(false)
  const abort                 = useRef<AbortController | null>(null)

  const generate = useCallback(async (ctx: NegotiateCtx) => {
    abort.current?.abort()
    abort.current = new AbortController()
    setMessage(''); setError(null); setLoading(true)
    try {
      const res = await fetch('/api/ai/negotiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: abort.current.signal,
        body: JSON.stringify({
          rfq_title:       ctx.rfqTitle,
          rfq_description: ctx.rfqDescription,
          target: {
            email:         ctx.target.supplier_email,
            price:         ctx.target.price,
            delivery_days: ctx.target.delivery_days,
            notes:         (ctx.target.answers?.notes as string) ?? null,
          },
          competitors: ctx.competitors.map((c) => ({
            email: c.supplier_email, price: c.price, delivery_days: c.delivery_days,
          })),
        }),
      })
      if (!res.ok || !res.body) throw new Error(`Server error ${res.status}`)
      const reader = res.body.getReader(); const dec = new TextDecoder(); let full = ''
      for (;;) {
        const { done, value } = await reader.read()
        if (done) break
        full += dec.decode(value, { stream: true })
        setMessage(full)
      }
    } catch (e) {
      if ((e as Error).name !== 'AbortError')
        setError(e instanceof Error ? e.message : 'Failed')
    } finally { setLoading(false) }
  }, [])

  const copy = useCallback(async () => {
    if (!message) return
    await navigator.clipboard.writeText(message)
    setCopied(true); setTimeout(() => setCopied(false), 2000)
  }, [message])

  const reset = useCallback(() => {
    abort.current?.abort(); setMessage(''); setError(null); setLoading(false)
  }, [])

  return { message, loading, error, copied, generate, copy, reset }
}

// ── Negotiate panel ────────────────────────────────────────────────────────────

function NegotiatePanel({ open, loading, message, error, copied, onGenerate, onCopy, onClose }: {
  open: boolean; loading: boolean; message: string; error: string | null
  copied: boolean; onGenerate: () => void; onCopy: () => void; onClose: () => void
}) {
  if (!open) return null
  return (
    <div className="mt-3 rounded-xl border border-violet-500/20 bg-violet-500/5">
      <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-violet-500/10">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-3 w-3 text-violet-400" />
          <span className="text-xs font-medium text-violet-300">Negotiation Draft</span>
        </div>
        <button onClick={onClose} className="text-gray-600 hover:text-gray-400 transition-colors">
          <X className="h-3 w-3" />
        </button>
      </div>
      <div className="p-3.5 space-y-3">
        <div className="min-h-[76px] rounded-lg bg-black/30 border border-white/[0.05] p-3 text-xs text-gray-300 leading-relaxed whitespace-pre-wrap">
          {loading && !message && (
            <span className="flex items-center gap-2 text-gray-600">
              <Loader2 className="h-3 w-3 animate-spin" />Generating…
            </span>
          )}
          {message}
          {!loading && !message && !error && <span className="text-gray-700">Message will appear here</span>}
          {error && <span className="text-red-400">{error}</span>}
        </div>
        <div className="flex gap-2">
          <button
            onClick={onGenerate} disabled={loading}
            className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white font-medium transition-all disabled:opacity-40 active:scale-95"
          >
            {loading
              ? <><Loader2 className="h-3 w-3 animate-spin" />Generating…</>
              : <><MessageSquare className="h-3 w-3" />{message ? 'Regenerate' : 'Generate'}</>}
          </button>
          {message && (
            <button
              onClick={onCopy}
              className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.07] text-gray-400 font-medium transition-all"
            >
              {copied ? <><Check className="h-3 w-3 text-emerald-400" />Copied</> : <><Copy className="h-3 w-3" />Copy</>}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Main SupplierCard ──────────────────────────────────────────────────────────

export function SupplierCard({
  supplier, tags, score, isAIChoice, aiRank,
  rfqTitle, rfqDescription, competitors, aiScore,
  minPrice = null, maxPrice = null, minDelivery = null, maxDelivery = null,
  formSchema, rfqId, rfqStatus, acceptedSupplier, onAccepted,
}: SupplierCardProps) {
  const router                                     = useRouter()
  const [detailsOpen, setDetailsOpen]     = useState(false)
  const [negotiateOpen, setNegotiateOpen] = useState(false)
  const [accepting, setAccepting]         = useState(false)
  const [acceptError, setAcceptError]     = useState<string | null>(null)
  const [toast, setToast]                 = useState<string | null>(null)
  const { message, loading, error, copied, generate, copy, reset } = useNegotiate()

  const isThisAccepted = acceptedSupplier === supplier.supplier_email
  const isClosed       = rfqStatus === 'closed'
  const anyAccepted    = !!acceptedSupplier

  async function handleAccept() {
    if (!rfqId || accepting || isThisAccepted || isClosed) return
    setAccepting(true)
    setAcceptError(null)
    try {
      const res = await fetch(`/api/rfqs/${rfqId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ selected_supplier: supplier.supplier_email }),
      })
      const responseData = await res.json()
      if (!res.ok) {
        throw new Error(responseData.error || `Server error ${res.status}`)
      }
      onAccepted?.(supplier.supplier_email)
      setToast('Deal closed successfully!')
      const destination = responseData.contractId
        ? `/contracts/${responseData.contractId}`
        : '/contracts'
      setTimeout(() => { router.refresh(); router.push(destination) }, 1800)
    } catch (e) {
      setAcceptError(e instanceof Error ? e.message : 'Failed to accept')
    } finally {
      setAccepting(false)
    }
  }

  const [emailUser, emailDomain] = supplier.supplier_email.split('@')
  const displayScore = aiScore ? Math.round(Number(aiScore.score) || 0) : score
  const grade        = gradeFor(displayScore, aiScore?.label)
  const summary      = buildSummary(supplier, isAIChoice, minPrice, minDelivery, aiScore?.explanation)
  const insights     = deriveInsights(supplier, minPrice, maxPrice, minDelivery, maxDelivery)
  const rawFields    = Object.entries(supplier.answers ?? {}).filter(([k]) => !HIDDEN_KEYS.has(k.toLowerCase()))

  // Schema-driven display fields — answers are keyed by field.id in the DB
  const HIDDEN_IDS = new Set(['price', 'delivery_days', 'delivery'])
  const schemaFields = formSchema
    ? formSchema
        .filter((f) => !HIDDEN_IDS.has(f.id.toLowerCase()))
        .map((f) => ({ label: f.label, value: supplier.answers?.[f.id] ?? '', type: f.type }))
    : null

  // Use schema fields when available, fall back to raw key-value pairs
  const displayCount = schemaFields ? schemaFields.length : rawFields.length

  function toggleNegotiate() {
    if (negotiateOpen) { reset(); setNegotiateOpen(false) } else setNegotiateOpen(true)
  }

  return (
    <>
    <div className={[
      'relative flex flex-col rounded-2xl border transition-all duration-300 overflow-hidden',
      isThisAccepted
        ? 'border-emerald-500/40 bg-gradient-to-br from-emerald-500/10 to-transparent shadow-lg shadow-emerald-500/10'
        : isAIChoice
          ? 'border-yellow-500/40 bg-gradient-to-br from-yellow-500/10 to-transparent shadow-lg shadow-yellow-500/10'
          : 'border-white/[0.07] bg-[#0d0f14] hover:border-white/[0.12] hover:shadow-xl hover:shadow-black/40',
    ].join(' ')}>

      {/* Selected Supplier crown */}
      {isThisAccepted && (
        <div className="flex items-center gap-1.5 justify-center py-2 bg-emerald-500/10 border-b border-emerald-500/20">
          <CheckCircle2 className="h-3 w-3 text-emerald-400" />
          <span className="text-[11px] font-semibold text-emerald-400 tracking-wide uppercase">Selected Supplier</span>
        </div>
      )}

      {/* AI Choice crown */}
      {isAIChoice && !isThisAccepted && (
        <div className="flex items-center gap-1.5 justify-center py-2 bg-amber-500/10 border-b border-amber-500/20">
          <Trophy className="h-3 w-3 text-amber-400" />
          <span className="text-[11px] font-semibold text-amber-400 tracking-wide uppercase">AI Recommended</span>
        </div>
      )}

      <div className="flex flex-col gap-5 p-5">

        {/* ── HEADER: email + rank + score ───────────────────────────────────── */}
        <div className="flex items-start justify-between gap-3">
          {/* Email */}
          <div className="flex items-center gap-2.5 min-w-0">
            {!isAIChoice && aiRank && (
              <span className="text-[10px] font-semibold w-5 h-5 rounded-full bg-gray-800 border border-gray-700/80 text-gray-500 flex items-center justify-center shrink-0">
                {aiRank}
              </span>
            )}
            <div className={`p-1.5 rounded-lg shrink-0 ${isAIChoice ? 'bg-amber-500/10' : 'bg-white/[0.04]'}`}>
              <Mail className={`h-3.5 w-3.5 ${isAIChoice ? 'text-amber-400/80' : 'text-gray-500'}`} />
            </div>
            <div className="min-w-0">
              <p className={`text-sm font-semibold truncate leading-tight ${isAIChoice ? 'text-blue-400' : 'text-white/90'}`}>{emailUser}</p>
              <p className="text-[11px] text-gray-600 truncate">@{emailDomain}</p>
            </div>
          </div>

          {/* AI Score */}
          <div className="flex flex-col items-end gap-1 shrink-0">
            <div className="flex items-baseline gap-0.5">
              <Sparkles className={`h-2.5 w-2.5 mr-0.5 ${isAIChoice ? 'text-amber-400' : 'text-violet-500'}`} />
              <span className={`text-lg font-semibold tabular-nums ${isAIChoice ? 'text-amber-300' : 'text-white/80'}`}>
                {displayScore}
              </span>
              <span className="text-[10px] text-gray-700 font-normal">/100</span>
            </div>
            <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full border ${grade.cls}`}>
              {grade.label}
            </span>
          </div>
        </div>

        {/* Thin divider */}
        <div className="h-px bg-white/[0.05]" />

        {/* ── PRICE (level 1) ────────────────────────────────────────────────── */}
        <div className={`rounded-xl px-4 py-3.5 ${
          isAIChoice
            ? 'bg-amber-500/8 border border-amber-500/15'
            : 'bg-white/[0.03] border border-white/[0.05]'
        }`}>
          <div className="flex items-center gap-1.5 mb-1">
            <DollarSign className={`h-3 w-3 ${isAIChoice ? 'text-amber-500' : 'text-gray-600'}`} />
            <span className={`text-[10px] font-semibold uppercase tracking-widest ${isAIChoice ? 'text-amber-500/70' : 'text-gray-600'}`}>
              Price
            </span>
          </div>
          <p className={`text-2xl font-semibold tracking-tight ${isAIChoice ? 'text-amber-200' : 'text-white/90'}`}>
            {supplier.price !== null
              ? `$${Number(supplier.price).toLocaleString('en-US')}`
              : <span className="text-gray-700 text-xl font-normal">—</span>}
          </p>
          <p className="text-[10px] text-gray-700 mt-1">total offer</p>
        </div>

        {/* ── DELIVERY (level 2) ─────────────────────────────────────────────── */}
        <div className={`flex items-center justify-between px-4 py-2.5 rounded-lg ${
          isAIChoice
            ? 'bg-amber-500/5 border border-amber-500/10'
            : 'bg-white/[0.02] border border-white/[0.04]'
        }`}>
          <div className="flex items-center gap-1.5">
            <Clock className={`h-3 w-3 ${isAIChoice ? 'text-amber-500' : 'text-gray-600'}`} />
            <span className={`text-xs ${isAIChoice ? 'text-amber-500/60' : 'text-gray-600'}`}>Delivery</span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className={`text-base font-semibold tabular-nums ${isAIChoice ? 'text-emerald-400' : 'text-white/90'}`}>
              {supplier.delivery_days !== null ? supplier.delivery_days : '—'}
            </span>
            {supplier.delivery_days !== null && (
              <span className={`text-[10px] ${isAIChoice ? 'text-emerald-400/60' : 'text-gray-600'}`}>days</span>
            )}
          </div>
        </div>

        {/* ── TAGS: Cheapest / Fastest / Best Value ──────────────────────────── */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {tags.map((t) => (
              <span
                key={t.label}
                className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border font-medium ${t.color}`}
              >
                <t.icon className="h-2.5 w-2.5" />
                {t.label}
              </span>
            ))}
          </div>
        )}

        {/* ── SUMMARY (level 4) ──────────────────────────────────────────────── */}
        <p className={`text-xs leading-relaxed line-clamp-2 ${isAIChoice ? 'text-amber-100/50' : 'text-white/40'}`}>
          {summary}
        </p>

        {/* ── INSIGHTS: max 3 small pills (level 5) ──────────────────────────── */}
        {insights.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {insights.map((ins, i) => (
              <span
                key={i}
                className={`inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-full border font-normal ${INSIGHT_CLS[ins.tone]}`}
              >
                <span className="text-xs leading-none">{ins.emoji}</span>
                {ins.label}
              </span>
            ))}
          </div>
        )}

        {/* ── VIEW DETAILS toggle ────────────────────────────────────────────── */}
        {displayCount > 0 && (
          <button
            onClick={() => setDetailsOpen((v) => !v)}
            className={[
              'w-full flex items-center justify-between text-xs py-2 px-3 rounded-lg border transition-all duration-200',
              detailsOpen
                ? 'border-white/[0.10] bg-white/[0.05] text-gray-400'
                : isAIChoice
                  ? 'border-amber-500/15 bg-transparent text-amber-500/50 hover:text-amber-400 hover:border-amber-500/25'
                  : 'border-white/[0.05] bg-transparent text-gray-600 hover:text-gray-400 hover:border-white/[0.10]',
            ].join(' ')}
          >
            <span className="flex items-center gap-1.5">
              {detailsOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              {detailsOpen ? 'Hide details' : 'View full details'}
            </span>
            <span className="opacity-40 font-normal text-[10px]">
              {displayCount} field{displayCount !== 1 ? 's' : ''}
            </span>
          </button>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          COLLAPSIBLE RAW DETAILS DRAWER
          ══════════════════════════════════════════════════════════════════ */}
      <div
        className={[
          'overflow-hidden transition-all duration-300 ease-in-out',
          detailsOpen ? 'max-h-[700px] opacity-100' : 'max-h-0 opacity-0 pointer-events-none',
        ].join(' ')}
        aria-hidden={!detailsOpen}
      >
        <div className="mx-5 mb-5">
          {/* Divider label */}
          <div className="flex items-center gap-2 mb-3">
            <div className="flex-1 h-px bg-white/[0.05]" />
            <span className="text-[9px] font-semibold uppercase tracking-widest text-gray-700">Full submission</span>
            <div className="flex-1 h-px bg-white/[0.05]" />
          </div>

          <div className="grid gap-2">
            {schemaFields
              ? schemaFields.map((field) => {
                  const isEmpty = field.value === '' || field.value === null || field.value === undefined
                  return (
                    <div
                      key={field.label}
                      className="flex flex-col gap-1 p-3 rounded-lg bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] transition-all duration-200"
                    >
                      <span className="text-[10px] text-white/40 uppercase tracking-widest">{field.label}</span>
                      <span className="text-sm text-white font-medium">
                        {isEmpty ? <span className="text-white/40 font-normal italic">No response</span> : String(field.value)}
                      </span>
                    </div>
                  )
                })
              : rawFields.map(([key, value]) => {
                  const Icon = fieldIcon(key)
                  const isEmpty     = value === '' || value === null || value === undefined
                  const isPortfolio = key.toLowerCase().includes('portfolio') || key.toLowerCase().includes('project')
                  const listItems   = isPortfolio && typeof value === 'string'
                    ? value.split(/[,\n]+/).map((s) => s.trim()).filter(Boolean)
                    : null

                  return (
                    <div key={key} className="flex items-start gap-3 px-4 py-3 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                      <div className="p-1 rounded-md mt-0.5 shrink-0 bg-white/[0.04]">
                        <Icon className="h-3 w-3 text-gray-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-700 mb-1">
                          {prettyKey(key)}
                        </p>
                        {isEmpty ? (
                          <p className="text-[11px] text-gray-700 italic">Not provided</p>
                        ) : listItems ? (
                          <ul className="space-y-1">
                            {listItems.map((item, i) => (
                              <li key={i} className="flex items-start gap-1.5 text-xs text-gray-400">
                                <span className="mt-1.5 h-1 w-1 rounded-full bg-gray-600 shrink-0" />
                                {item}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-xs text-gray-300 leading-relaxed break-words">{String(value)}</p>
                        )}
                      </div>
                    </div>
                  )
                })
            }
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          ACCEPT
          ══════════════════════════════════════════════════════════════════ */}
      {/* ── Active: show Accept button for all suppliers ─────────────────── */}
      {rfqId && !isClosed && !anyAccepted && (
        <div className="px-5 pb-3">
          <button
            onClick={handleAccept}
            disabled={accepting}
            className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-sm font-semibold py-2.5 transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-2"
          >
            {accepting
              ? <><Loader2 className="h-3.5 w-3.5 animate-spin" />Closing deal…</>
              : <><CheckCircle2 className="h-3.5 w-3.5" />Accept Offer</>
            }
          </button>
          {acceptError && (
            <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />{acceptError}
            </p>
          )}
        </div>
      )}

      {/* ── Winner badge ──────────────────────────────────────────────────── */}
      {rfqId && isThisAccepted && (
        <div className="px-5 pb-3">
          <div className="w-full rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-sm font-semibold py-2.5 flex items-center justify-center gap-2">
            <CheckCircle2 className="h-3.5 w-3.5" />Selected Supplier
          </div>
        </div>
      )}

      {/* ── Locked: RFQ closed, this supplier was NOT selected ───────────── */}
      {rfqId && isClosed && !isThisAccepted && (
        <div className="px-5 pb-3">
          <div className="w-full rounded-xl border border-white/[0.06] bg-white/[0.02] text-gray-600 text-sm font-medium py-2.5 flex items-center justify-center gap-2 cursor-default">
            <XCircle className="h-3.5 w-3.5" />Deal Closed
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          NEGOTIATE
          ══════════════════════════════════════════════════════════════════ */}
      <div className="px-5 pb-5">
        <button
          onClick={toggleNegotiate}
          className={[
            'w-full flex items-center justify-center gap-1.5 text-xs py-2 rounded-lg border transition-all duration-200',
            negotiateOpen
              ? 'border-violet-500/30 bg-violet-500/10 text-violet-300'
              : 'border-white/[0.05] bg-transparent text-gray-600 hover:border-violet-500/20 hover:text-violet-400',
          ].join(' ')}
        >
          <MessageSquare className="h-3 w-3" />
          {negotiateOpen ? 'Close' : 'Generate negotiation message'}
          {negotiateOpen
            ? <ChevronUp className="h-3 w-3 ml-auto" />
            : <ChevronDown className="h-3 w-3 ml-auto" />}
        </button>

        <NegotiatePanel
          open={negotiateOpen}
          loading={loading}
          message={message}
          error={error}
          copied={copied}
          onGenerate={() => generate({ rfqTitle, rfqDescription, target: supplier, competitors })}
          onCopy={copy}
          onClose={() => { reset(); setNegotiateOpen(false) }}
        />
      </div>
    </div>

    {/* Toast notification */}
    {toast && (
      <Toast
        message={toast}
        type="success"
        duration={2000}
        onClose={() => setToast(null)}
      />
    )}
    </>
  )
}

// Re-export for RFQResponseSection
export { TrendingDown, Zap, Star }
