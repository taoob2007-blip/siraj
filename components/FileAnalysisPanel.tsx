'use client'

import { useState, useRef, useCallback } from 'react'
import { supabaseBrowserClient as supabase } from '@/lib/supabase/client'
import {
  Sparkles, Loader2, AlertTriangle, CheckCircle2, AlertCircle,
  TrendingDown, TrendingUp, Minus, ChevronDown, ChevronUp,
  ShieldAlert, ShieldCheck, ShieldQuestion,
  FileSearch, ListChecks, Lightbulb, Info,
} from 'lucide-react'
import { AttachmentUploader } from '@/components/AttachmentUploader'
import type {
  Attachment,
  FileAnalysisMode,
  FileAnalysisResult,
  RFQAnalysis,
  SupplierAnalysis,
} from '@/lib/types'

// ── Types ──────────────────────────────────────────────────────────────────────

interface Props {
  mode:                  FileAnalysisMode
  onResults?:            (results: FileAnalysisResult[]) => void
  onAttachmentsChange?:  (attachments: Attachment[]) => void
  disabled?:             boolean
}

// Discriminated union — status field narrows the whole type
type AnalysisState =
  | { status: 'idle' }
  | { status: 'signing' }
  | { status: 'analyzing' }
  | { status: 'done';  result: FileAnalysisResult }
  | { status: 'error'; message: string }

// Plain object keyed by Supabase storage path.
// Record<string, T> works with Object.entries/values/keys — no iterator issues.
type StateMap = Record<string, AnalysisState>

// ── Sub-components ─────────────────────────────────────────────────────────────

function RiskBadge({ level }: { level: SupplierAnalysis['risk_level'] }) {
  const cfg: Record<SupplierAnalysis['risk_level'], {
    icon: React.ComponentType<{ className?: string }>
    cls: string
    label: string
  }> = {
    low:    { icon: ShieldCheck,    cls: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300', label: 'Low Risk'    },
    medium: { icon: ShieldQuestion, cls: 'bg-amber-500/15  border-amber-500/30  text-amber-300',    label: 'Medium Risk' },
    high:   { icon: ShieldAlert,    cls: 'bg-red-500/15    border-red-500/30    text-red-300',      label: 'High Risk'   },
  }
  const { icon: Icon, cls, label } = cfg[level]
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold ${cls}`}>
      <Icon className="h-3.5 w-3.5" />
      {label}
    </span>
  )
}

function RecommendationBadge({ rec }: { rec: SupplierAnalysis['recommendation'] }) {
  const cfg: Record<SupplierAnalysis['recommendation'], {
    icon: React.ComponentType<{ className?: string }>
    cls: string
    label: string
  }> = {
    accept:    { icon: TrendingUp,   cls: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300', label: 'Accept'    },
    negotiate: { icon: Minus,        cls: 'bg-amber-500/15  border-amber-500/30  text-amber-300',    label: 'Negotiate' },
    reject:    { icon: TrendingDown, cls: 'bg-red-500/15    border-red-500/30    text-red-300',      label: 'Reject'    },
  }
  const { icon: Icon, cls, label } = cfg[rec]
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold ${cls}`}>
      <Icon className="h-3.5 w-3.5" />
      {label}
    </span>
  )
}

function RiskGauge({ score }: { score: number }) {
  const clamped   = Math.min(100, Math.max(0, score))
  const barColor  = clamped <= 35 ? 'bg-emerald-500' : clamped <= 65 ? 'bg-amber-500' : 'bg-red-500'
  const textColor = clamped <= 35 ? 'text-emerald-300' : clamped <= 65 ? 'text-amber-300' : 'text-red-300'
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-[11px] text-gray-500 font-medium uppercase tracking-wide">Risk Score</span>
        <span className={`text-sm font-bold tabular-nums ${textColor}`}>
          {clamped}<span className="text-[11px] font-normal text-gray-600">/100</span>
        </span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-white/[0.06] overflow-hidden">
        <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${clamped}%` }} />
      </div>
    </div>
  )
}

type AccentColor = 'blue' | 'amber' | 'emerald' | 'red'

function Section({ icon: Icon, title, children, accent = 'blue' }: {
  icon:      React.ComponentType<{ className?: string }>
  title:     string
  children:  React.ReactNode
  accent?:   AccentColor
}) {
  const colors: Record<AccentColor, string> = {
    blue:    'text-blue-400    bg-blue-500/10    border-blue-500/20',
    amber:   'text-amber-400   bg-amber-500/10   border-amber-500/20',
    emerald: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    red:     'text-red-400     bg-red-500/10     border-red-500/20',
  }
  return (
    <div className="space-y-2">
      <div className={`flex items-center gap-2 text-xs font-semibold uppercase tracking-wide px-2 py-1.5 rounded-lg border ${colors[accent]}`}>
        <Icon className="h-3.5 w-3.5" />
        {title}
      </div>
      {children}
    </div>
  )
}

type BulletVariant = 'neutral' | 'warning' | 'positive'

function BulletList({ items, variant = 'neutral' }: { items: string[]; variant?: BulletVariant }) {
  if (!items.length) return <p className="text-xs text-gray-600 italic pl-1">None identified</p>
  const dotColor: Record<BulletVariant, string> = {
    neutral:  'bg-blue-400/60',
    warning:  'bg-red-400/70',
    positive: 'bg-emerald-400/60',
  }
  return (
    <ul className="space-y-1.5 pl-1">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2 text-xs text-gray-300 leading-relaxed">
          <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${dotColor[variant]}`} />
          {item}
        </li>
      ))}
    </ul>
  )
}

function RFQResultCard({ result }: { result: RFQAnalysis }) {
  return (
    <div className="space-y-4">
      {result.summary && (
        <p className="text-xs text-gray-300 leading-relaxed border-l-2 border-blue-500/40 pl-3 italic">
          {result.summary}
        </p>
      )}
      <Section icon={ListChecks} title="Requirements">
        <BulletList items={result.requirements} variant="neutral" />
      </Section>
      {result.quantities.length > 0 && (
        <Section icon={Info} title="Quantities Mentioned" accent="emerald">
          <BulletList items={result.quantities} variant="positive" />
        </Section>
      )}
      {result.missing_info.length > 0 && (
        <Section icon={AlertCircle} title="Missing Information" accent="amber">
          <BulletList items={result.missing_info} variant="warning" />
        </Section>
      )}
      {result.improvements.length > 0 && (
        <Section icon={Lightbulb} title="Suggested Improvements" accent="blue">
          <BulletList items={result.improvements} variant="neutral" />
        </Section>
      )}
    </div>
  )
}

function SupplierResultCard({ result }: { result: SupplierAnalysis }) {
  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <RiskGauge score={result.risk_score} />
        <div className="flex flex-wrap items-center gap-2">
          <RiskBadge level={result.risk_level} />
          <RecommendationBadge rec={result.recommendation} />
        </div>
      </div>
      {result.summary && (
        <p className="text-xs text-gray-300 leading-relaxed border-l-2 border-blue-500/40 pl-3 italic">
          {result.summary}
        </p>
      )}
      {result.red_flags.length > 0 && (
        <Section icon={AlertTriangle} title="Red Flags" accent="red">
          <BulletList items={result.red_flags} variant="warning" />
        </Section>
      )}
      <Section icon={TrendingDown} title="Pricing Analysis" accent="amber">
        <p className="text-xs text-gray-300 leading-relaxed pl-1">{result.pricing_analysis}</p>
      </Section>
      <Section icon={Info} title="Delivery Analysis" accent="blue">
        <p className="text-xs text-gray-300 leading-relaxed pl-1">{result.delivery_analysis}</p>
      </Section>
    </div>
  )
}

function AnalysisResultCard({ state, fileName, mode }: {
  state:    AnalysisState
  fileName: string
  mode:     FileAnalysisMode
}) {
  const [expanded, setExpanded] = useState(true)

  if (state.status === 'idle') return null

  const isLoading = state.status === 'signing' || state.status === 'analyzing'

  return (
    <div className="rounded-xl border border-white/[0.07] bg-[#0d1220] overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded((p) => !p)}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/[0.02] transition-colors"
      >
        <div className="p-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 shrink-0">
          <Sparkles className="h-3.5 w-3.5 text-blue-400" />
        </div>
        <div className="flex-1 min-w-0 text-left">
          <p className="text-xs font-semibold text-white truncate">AI Analysis — {fileName}</p>
          <p className="text-[11px] text-gray-600 mt-0.5">
            {mode === 'rfq' ? 'RFQ document analysis' : 'Supplier risk analysis'}
          </p>
        </div>
        {isLoading && <Loader2 className="h-4 w-4 text-blue-400 animate-spin shrink-0" />}
        {state.status === 'error' && <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />}
        {state.status === 'done' && (
          expanded
            ? <ChevronUp   className="h-4 w-4 text-gray-600 shrink-0" />
            : <ChevronDown className="h-4 w-4 text-gray-600 shrink-0" />
        )}
      </button>

      {expanded && (
        <div className="px-4 pb-4 border-t border-white/[0.05]">
          {isLoading && (
            <div className="flex items-center gap-2.5 pt-3">
              <Loader2 className="h-4 w-4 text-blue-400 animate-spin shrink-0" />
              <p className="text-xs text-gray-400">
                {state.status === 'signing' ? 'Preparing file…' : 'Analyzing with AI…'}
              </p>
            </div>
          )}

          {state.status === 'error' && (
            <div className="flex items-start gap-2.5 mt-3 rounded-lg bg-red-500/[0.06] border border-red-500/20 px-3 py-2.5">
              <AlertTriangle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-red-300">Analysis failed</p>
                <p className="text-[11px] text-red-400/70 mt-0.5">{state.message}</p>
              </div>
            </div>
          )}

          {state.status === 'done' && (
            <div className="pt-4 space-y-4">
              {mode === 'rfq'      && state.result.rfq      && <RFQResultCard      result={state.result.rfq}      />}
              {mode === 'supplier' && state.result.supplier  && <SupplierResultCard result={state.result.supplier}  />}
              <p className="text-[10px] text-gray-700 text-right">
                Analyzed {new Date(state.result.analyzed_at).toLocaleTimeString()}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────

export function FileAnalysisPanel({ mode, onResults, onAttachmentsChange, disabled }: Props) {
  // Record<path, AnalysisState> — plain object avoids all MapIterator issues.
  // Object.entries / Object.values / Object.keys are always safe to use.
  const [states, setStates] = useState<StateMap>({})

  // Refs hold mutable data that must not trigger re-renders
  const analyzedPaths = useRef<Set<string>>(new Set())
  const fileNames     = useRef<Record<string, string>>({})
  const allResults    = useRef<FileAnalysisResult[]>([])

  // ── Update a single file's state without touching the others ────────────────
  const setFileState = useCallback((path: string, state: AnalysisState) => {
    setStates((prev) => ({ ...prev, [path]: state }))
  }, [])

  // ── Analyze one file ─────────────────────────────────────────────────────────
  const analyzeFile = useCallback(async (attachment: Attachment) => {
    const { path, name, type: fileType } = attachment

    setFileState(path, { status: 'signing' })

    try {
      const { data: signed, error: signErr } = await supabase.storage
        .from('attachments')
        .createSignedUrl(path, 300)

      if (signErr || !signed?.signedUrl) {
        console.error('[FileAnalysisPanel] signed URL error:', signErr)
        setFileState(path, { status: 'error', message: 'Could not prepare file for analysis' })
        return
      }

      setFileState(path, { status: 'analyzing' })

      const res = await fetch('/api/analyze-file', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ fileUrl: signed.signedUrl, type: mode, fileName: name, fileType }),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as { error?: string }
        setFileState(path, { status: 'error', message: body.error ?? 'Analysis failed' })
        return
      }

      const result = (await res.json()) as FileAnalysisResult
      setFileState(path, { status: 'done', result })

      allResults.current = allResults.current
        .filter((r) => r.file_name !== name)
        .concat(result)
      onResults?.(allResults.current)
    } catch (err) {
      console.error('[FileAnalysisPanel] analysis error:', err)
      setFileState(path, { status: 'error', message: 'Unexpected error during analysis' })
    }
  }, [mode, setFileState, onResults])

  // ── Handle uploader onChange ─────────────────────────────────────────────────
  const handleAttachmentsChange = useCallback((attachments: Attachment[]) => {
    onAttachmentsChange?.(attachments)

    // Register file names
    for (const att of attachments) {
      fileNames.current[att.path] = att.name
    }

    // Trigger analysis for new files
    for (const att of attachments) {
      if (!analyzedPaths.current.has(att.path)) {
        analyzedPaths.current.add(att.path)
        void analyzeFile(att)
      }
    }

    // Remove state for deleted files
    const currentPaths = new Set(attachments.map((a) => a.path))

    setStates((prev) => {
      // Use Object.keys — no iterator, fully compatible
      const removedKeys = Object.keys(prev).filter((key) => !currentPaths.has(key))
      if (removedKeys.length === 0) return prev   // bail out early, no re-render needed

      const next = { ...prev }
      for (const key of removedKeys) {
        delete next[key]
        analyzedPaths.current.delete(key)
        delete fileNames.current[key]
      }
      return next
    })
  }, [analyzeFile])

  // ── Derived values — Object.values, never Map iterators ─────────────────────
  const stateValues  = Object.values(states)
  const anyAnalyzing = stateValues.some((s) => s.status === 'signing' || s.status === 'analyzing')
  const doneCount    = stateValues.filter((s) => s.status === 'done').length
  const hasAny       = Object.keys(states).length > 0

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      <AttachmentUploader onChange={handleAttachmentsChange} disabled={disabled} />

      {hasAny && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.02] border border-white/[0.05]">
          {anyAnalyzing ? (
            <>
              <Loader2 className="h-3.5 w-3.5 text-blue-400 animate-spin" />
              <span className="text-xs text-blue-300 font-medium">Analyzing with AI…</span>
            </>
          ) : (
            <>
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
              <span className="text-xs text-emerald-300 font-medium">
                {doneCount} file{doneCount !== 1 ? 's' : ''} analyzed
              </span>
            </>
          )}
          <div className="ml-auto flex items-center gap-1 text-[11px] text-gray-600">
            <FileSearch className="h-3 w-3" />
            <span>{mode === 'rfq' ? 'RFQ document mode' : 'Supplier quotation mode'}</span>
          </div>
        </div>
      )}

      {/* Object.entries — no MapIterator, works at any TS target ──────────── */}
      {Object.entries(states).map(([path, state]) => (
        <AnalysisResultCard
          key={path}
          state={state}
          fileName={fileNames.current[path] ?? path.split('/').pop() ?? 'file'}
          mode={mode}
        />
      ))}
    </div>
  )
}
