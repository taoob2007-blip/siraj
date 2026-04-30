'use client'

import {
  useState, useRef, useCallback, useEffect,
} from 'react'
import {
  Trophy, Lightbulb, AlertTriangle, Key, ArrowLeftRight,
  ChevronDown, ChevronUp, Sparkles, Loader2,
  CheckCircle2, MessageSquare, Bot, Send, X, Copy, Check,
} from 'lucide-react'

// ── Types ──────────────────────────────────────────────────────────────────────

export interface AIDecision {
  best_supplier: string
  reasoning: string
  tradeoffs: string
  risks: string
  negotiation: string
}

export interface SupplierCtx {
  email: string
  price: number | null
  delivery_days: number | null
  answers?: Record<string, string | number>
}

interface AIDecisionPanelProps {
  decision: AIDecision | null
  loading: boolean
  rfqId?: string
  rfqTitle?: string
  rfqDescription?: string | null
  suppliers?: SupplierCtx[]
  acceptedSupplier?: string | null
  onAccepted?: (email: string) => void
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function splitEmail(email: string) {
  const idx = email.indexOf('@')
  if (idx === -1) return { user: email, domain: '' }
  return { user: email.slice(0, idx), domain: email.slice(idx) }
}

// ── Info Section card ─────────────────────────────────────────────────────────

function Section({
  icon: Icon, label, text, iconCls, borderCls, bgCls, labelCls,
}: {
  icon: React.ElementType; label: string; text: string
  iconCls: string; borderCls: string; bgCls: string; labelCls: string
}) {
  return (
    <div className={`rounded-xl border ${borderCls} ${bgCls} px-4 py-3.5 space-y-1.5`}>
      <div className="flex items-center gap-2">
        <Icon className={`h-3.5 w-3.5 shrink-0 ${iconCls}`} />
        <p className={`text-[11px] font-semibold uppercase tracking-widest ${labelCls}`}>{label}</p>
      </div>
      <p className="text-sm text-gray-200 leading-relaxed font-[450]">{text}</p>
    </div>
  )
}

// ── Negotiation Modal ─────────────────────────────────────────────────────────

function NegotiationModal({
  text, onClose,
}: {
  text: string; onClose: () => void
}) {
  const [draft, setDraft] = useState(text)
  const [copied, setCopied] = useState(false)

  async function copy() {
    await navigator.clipboard.writeText(draft)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Close on backdrop click
  function onBackdrop(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget) onClose()
  }

  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onBackdrop}
    >
      <div
        className="relative w-full max-w-lg rounded-2xl border border-violet-500/20 overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #0e0a18 0%, #0d0f1e 100%)' }}
      >
        {/* top edge */}
        <div className="absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-violet-400/30 to-transparent" />
        <div className="pointer-events-none absolute -top-12 -right-12 h-36 w-36 rounded-full bg-violet-500/8 blur-3xl" />

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-violet-500/10 border border-violet-500/20">
              <MessageSquare className="h-3.5 w-3.5 text-violet-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white leading-none">Negotiation Message</p>
              <p className="text-xs text-gray-600 mt-0.5">Edit and copy — ready to send</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg border border-white/[0.07] bg-white/[0.03] hover:bg-white/[0.07] text-gray-500 hover:text-gray-300 transition-all"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Draft */}
        <div className="p-5 space-y-4">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={7}
            className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-sm text-gray-200 leading-relaxed resize-none focus:outline-none focus:border-violet-500/40 focus:bg-white/[0.05] transition-all placeholder:text-gray-700"
            placeholder="Negotiation message will appear here…"
          />

          <div className="flex items-center gap-2.5">
            <button
              onClick={copy}
              className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 rounded-xl border border-violet-500/30 bg-violet-500/10 hover:bg-violet-500/15 text-violet-300 text-sm font-medium transition-all active:scale-[0.98]"
            >
              {copied
                ? <><Check className="h-3.5 w-3.5 text-emerald-400" /><span className="text-emerald-300">Copied!</span></>
                : <><Copy className="h-3.5 w-3.5" />Copy message</>
              }
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.06] text-gray-400 text-sm font-medium transition-all"
            >
              Close
            </button>
          </div>

          <p className="text-[11px] text-gray-700 text-center">
            AI-suggested message — review before sending
          </p>
        </div>
      </div>
    </div>
  )
}

// ── Follow-up AI panel ────────────────────────────────────────────────────────

const FOLLOWUP_CHIPS = [
  'What if I prioritize speed?',
  'What if my budget is 20% lower?',
  'Is there a risk I\'m missing?',
  'Should I split across 2 suppliers?',
]

function FollowUpPanel({
  rfqTitle, rfqDescription, suppliers, decision,
}: {
  rfqTitle: string; rfqDescription?: string | null
  suppliers: SupplierCtx[]; decision: AIDecision
}) {
  const [input, setInput]         = useState('')
  const [answer, setAnswer]       = useState('')
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState<string | null>(null)
  const abortRef                  = useRef<AbortController | null>(null)
  const bottomRef                 = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [answer])

  const ask = useCallback(async (question: string) => {
    const q = question.trim()
    if (!q || loading) return
    abortRef.current?.abort()
    abortRef.current = new AbortController()
    setAnswer('')
    setError(null)
    setLoading(true)

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: abortRef.current.signal,
        body: JSON.stringify({
          messages: [
            {
              role: 'user',
              content: `Context: The AI already decided that ${decision.best_supplier} is the best supplier. Reasoning: ${decision.reasoning}\n\nFollow-up question: ${q}`,
            },
          ],
          context: {
            rfq_title: rfqTitle,
            rfq_description: rfqDescription,
            suppliers,
            form_fields: [],
          },
        }),
      })
      if (!res.ok || !res.body) throw new Error(`Server error ${res.status}`)

      const reader  = res.body.getReader()
      const decoder = new TextDecoder()
      let full = ''
      for (;;) {
        const { done, value } = await reader.read()
        if (done) break
        full += decoder.decode(value, { stream: true })
        setAnswer(full)
      }
    } catch (e) {
      if ((e as Error).name !== 'AbortError')
        setError(e instanceof Error ? e.message : 'Failed')
    } finally {
      setLoading(false)
    }
  }, [loading, rfqTitle, rfqDescription, suppliers, decision])

  function handleKey(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); ask(input); setInput('') }
  }

  return (
    <div className="border-t border-white/[0.05] px-6 pb-6 pt-4 space-y-3">
      <div className="flex items-center gap-2 mb-1">
        <Bot className="h-3.5 w-3.5 text-blue-400" />
        <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-widest">Ask AI Follow-up</p>
      </div>

      {/* Chip suggestions */}
      {!answer && !loading && (
        <div className="flex flex-wrap gap-1.5">
          {FOLLOWUP_CHIPS.map((chip) => (
            <button
              key={chip}
              onClick={() => { ask(chip) }}
              className="text-xs px-2.5 py-1 rounded-full border border-gray-700/80 bg-gray-800/50 text-gray-400 hover:border-blue-500/40 hover:bg-blue-500/5 hover:text-blue-300 transition-all duration-150"
            >
              {chip}
            </button>
          ))}
        </div>
      )}

      {/* Answer */}
      {(loading || answer) && (
        <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] px-4 py-3 space-y-2 min-h-[56px]">
          {loading && !answer && (
            <span className="flex items-center gap-2 text-xs text-gray-600">
              <Loader2 className="h-3 w-3 animate-spin" />Thinking…
            </span>
          )}
          {answer && (
            <p className="text-sm text-gray-200 leading-relaxed font-[450] whitespace-pre-wrap">{answer}</p>
          )}
          {error && <p className="text-xs text-red-400">{error}</p>}
          <div ref={bottomRef} />
        </div>
      )}

      {/* Input */}
      <div className="flex items-end gap-2 rounded-xl border border-gray-700/80 bg-gray-800/50 px-3 py-2 focus-within:border-blue-500/40 transition-all">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKey}
          disabled={loading}
          placeholder="Ask a follow-up question…"
          rows={1}
          className="flex-1 resize-none bg-transparent text-sm text-white placeholder:text-gray-600 outline-none disabled:opacity-50 max-h-24 leading-relaxed py-0.5"
          style={{ fieldSizing: 'content' } as React.CSSProperties}
        />
        <button
          onClick={() => { ask(input); setInput('') }}
          disabled={!input.trim() || loading}
          className="shrink-0 p-1.5 rounded-lg bg-blue-600 text-white disabled:opacity-30 hover:bg-blue-500 active:scale-95 transition-all"
        >
          <Send className="h-3 w-3" />
        </button>
      </div>

      {answer && (
        <button
          onClick={() => setAnswer('')}
          className="text-xs text-gray-700 hover:text-gray-500 transition-colors"
        >
          Clear answer
        </button>
      )}
    </div>
  )
}

// ── Skeleton ───────────────────────────────────────────────────────────────────

function Skeleton() {
  return (
    <div className="relative rounded-2xl border border-white/[0.08] overflow-hidden bg-gradient-to-br from-[#0d1220] to-[#0f0d1e] p-6 space-y-4 animate-pulse">
      <div className="absolute top-0 left-12 right-12 h-px bg-gradient-to-r from-transparent via-blue-400/15 to-transparent" />
      <div className="flex items-center gap-3">
        <div className="h-8 w-8 rounded-xl bg-white/[0.05]" />
        <div className="space-y-1.5">
          <div className="h-3.5 w-36 rounded-full bg-white/[0.06]" />
          <div className="h-2.5 w-24 rounded-full bg-white/[0.04]" />
        </div>
        <div className="ml-auto flex items-center gap-1.5 text-xs text-violet-400/60">
          <Loader2 className="h-3 w-3 animate-spin" />
          Analyzing suppliers…
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-xl border border-white/[0.05] bg-white/[0.02] p-3.5 space-y-2">
            <div className="h-2.5 w-16 rounded-full bg-white/[0.06]" />
            <div className="h-3 w-full rounded-full bg-white/[0.04]" />
            <div className="h-3 w-4/5 rounded-full bg-white/[0.03]" />
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Main ───────────────────────────────────────────────────────────────────────

export function AIDecisionPanel({
  decision,
  loading,
  rfqId,
  rfqTitle = '',
  rfqDescription,
  suppliers = [],
  acceptedSupplier,
  onAccepted,
}: AIDecisionPanelProps) {
  const [expanded, setExpanded]         = useState(true)
  const [showFollowUp, setShowFollowUp] = useState(false)
  const [showNegModal, setShowNegModal] = useState(false)

  // Accept state
  const [accepting, setAccepting]       = useState(false)
  const [accepted, setAccepted]         = useState<string | null>(acceptedSupplier ?? null)
  const [acceptError, setAcceptError]   = useState<string | null>(null)

  if (loading && !decision) return <Skeleton />
  if (!decision) return null

  const { user: winnerUser, domain: winnerDomain } = splitEmail(decision.best_supplier)
  const isAccepted = accepted === decision.best_supplier

  async function handleAccept() {
    if (!rfqId || !decision || accepting || isAccepted) return
    setAccepting(true)
    setAcceptError(null)
    try {
      const res = await fetch(`/api/rfqs/${rfqId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ selected_supplier: decision.best_supplier }),
      })
      if (!res.ok) throw new Error(`Server error ${res.status}`)
      setAccepted(decision.best_supplier)
      onAccepted?.(decision.best_supplier)
    } catch (e) {
      setAcceptError(e instanceof Error ? e.message : 'Failed to save')
    } finally {
      setAccepting(false)
    }
  }

  return (
    <>
      <div
        className="relative rounded-2xl border overflow-hidden transition-all duration-300"
        style={{
          borderColor: isAccepted ? 'rgba(34,197,94,0.25)' : 'rgba(245,158,11,0.20)',
          background: isAccepted
            ? 'linear-gradient(135deg, #071209 0%, #0d0f1a 40%, #0c0d1e 100%)'
            : 'linear-gradient(135deg, #110e04 0%, #0d0f1a 40%, #0c0d1e 100%)',
          boxShadow: isAccepted
            ? '0 0 40px -12px rgba(34,197,94,0.10)'
            : '0 0 40px -12px rgba(245,158,11,0.12)',
        }}
      >
        {/* top edge glow */}
        <div
          className="absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-transparent to-transparent"
          style={{ backgroundImage: isAccepted
            ? 'linear-gradient(to right, transparent, rgba(34,197,94,0.30), transparent)'
            : 'linear-gradient(to right, transparent, rgba(245,158,11,0.25), transparent)'
          }}
        />
        <div className="pointer-events-none absolute -top-16 -left-16 h-48 w-48 rounded-full blur-3xl"
          style={{ background: isAccepted ? 'rgba(34,197,94,0.05)' : 'rgba(245,158,11,0.06)' }}
        />
        <div className="pointer-events-none absolute -bottom-12 -right-12 h-40 w-40 rounded-full bg-violet-500/5 blur-3xl" />

        {/* Header */}
        <div className="relative flex items-center justify-between gap-4 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl border shrink-0 ${isAccepted ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-amber-500/10 border-amber-500/20'}`}>
              {isAccepted
                ? <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                : <Sparkles className="h-4 w-4 text-amber-400" />
              }
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-white leading-none">AI Decision</p>
                {isAccepted
                  ? <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400">Supplier Accepted</span>
                  : <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400">Auto-analyzed</span>
                }
              </div>
              <p className="text-xs text-gray-600 mt-0.5">
                {isAccepted ? 'Decision confirmed and saved' : 'Full procurement intelligence — updated automatically'}
              </p>
            </div>
          </div>
          <button
            onClick={() => setExpanded((v) => !v)}
            className="shrink-0 p-1.5 rounded-lg border border-white/[0.07] bg-white/[0.03] hover:bg-white/[0.06] text-gray-500 hover:text-gray-300 transition-all"
          >
            {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>
        </div>

        {/* Winner bar + Accept CTA */}
        <div className={`relative mx-6 mb-4 rounded-xl border px-4 py-3 flex items-center gap-3 ${
          isAccepted ? 'border-emerald-500/25 bg-emerald-500/8' : 'border-amber-500/25 bg-amber-500/8'
        }`}>
          <div className={`p-2 rounded-lg shrink-0 ${isAccepted ? 'bg-emerald-500/15' : 'bg-amber-500/15'}`}>
            {isAccepted
              ? <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              : <Trophy className="h-4 w-4 text-amber-400" />
            }
          </div>
          <div className="min-w-0 flex-1">
            <p className={`text-[11px] font-semibold uppercase tracking-widest leading-none mb-1 ${isAccepted ? 'text-emerald-500/70' : 'text-amber-500/70'}`}>
              {isAccepted ? 'Accepted Supplier' : 'Best Supplier'}
            </p>
            <p className={`text-base font-semibold leading-tight truncate ${isAccepted ? 'text-emerald-200' : 'text-amber-200'}`}>
              {winnerUser}
              <span className={`font-normal text-sm ${isAccepted ? 'text-emerald-400/50' : 'text-amber-400/50'}`}>
                {winnerDomain}
              </span>
            </p>
          </div>

          {/* Accept button */}
          {rfqId && (
            <button
              onClick={handleAccept}
              disabled={accepting || isAccepted}
              className={[
                'shrink-0 inline-flex items-center gap-1.5 text-xs px-3.5 py-2 rounded-lg font-semibold transition-all duration-200 active:scale-[0.97]',
                isAccepted
                  ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 cursor-default'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/30 disabled:opacity-50',
              ].join(' ')}
            >
              {accepting
                ? <><Loader2 className="h-3 w-3 animate-spin" />Saving…</>
                : isAccepted
                  ? <><CheckCircle2 className="h-3 w-3" />Accepted</>
                  : <><CheckCircle2 className="h-3 w-3" />Accept</>
              }
            </button>
          )}
        </div>

        {acceptError && (
          <p className="mx-6 mb-3 text-xs text-red-400 flex items-center gap-1.5">
            <AlertTriangle className="h-3 w-3" />{acceptError}
          </p>
        )}

        {/* Collapsible body */}
        <div
          className="overflow-hidden transition-all duration-300 ease-in-out"
          style={{ maxHeight: expanded ? '1200px' : '0px', opacity: expanded ? 1 : 0 }}
        >
          {/* 4 section cards */}
          <div className="relative grid grid-cols-1 sm:grid-cols-2 gap-3 px-6 pb-5">
            <Section
              icon={Lightbulb} label="Why it wins" text={decision.reasoning}
              iconCls="text-sky-400" borderCls="border-sky-500/15" bgCls="bg-sky-500/5" labelCls="text-sky-500/70"
            />
            <Section
              icon={AlertTriangle} label="Risks" text={decision.risks}
              iconCls="text-red-400" borderCls="border-red-500/15" bgCls="bg-red-500/5" labelCls="text-red-500/70"
            />
            <Section
              icon={ArrowLeftRight} label="Trade-offs" text={decision.tradeoffs}
              iconCls="text-violet-400" borderCls="border-violet-500/15" bgCls="bg-violet-500/5" labelCls="text-violet-500/70"
            />
            <Section
              icon={Key} label="Negotiation strategy" text={decision.negotiation}
              iconCls="text-orange-400" borderCls="border-orange-500/15" bgCls="bg-orange-500/5" labelCls="text-orange-500/70"
            />
          </div>

          {/* Action bar */}
          <div className="flex items-center gap-2 px-6 pb-5 pt-1 border-t border-white/[0.04]">
            <button
              onClick={() => setShowNegModal(true)}
              className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-violet-500/25 bg-violet-500/8 hover:bg-violet-500/14 text-violet-300 font-medium transition-all"
            >
              <MessageSquare className="h-3 w-3" />
              Negotiation message
            </button>
            <button
              onClick={() => setShowFollowUp((v) => !v)}
              className={[
                'inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border font-medium transition-all',
                showFollowUp
                  ? 'border-blue-500/30 bg-blue-500/10 text-blue-300'
                  : 'border-white/[0.07] bg-white/[0.03] hover:bg-white/[0.06] text-gray-500 hover:text-gray-300',
              ].join(' ')}
            >
              <Bot className="h-3 w-3" />
              {showFollowUp ? 'Hide follow-up' : 'Ask AI follow-up'}
            </button>
          </div>

          {/* Follow-up panel */}
          {showFollowUp && rfqTitle && (
            <FollowUpPanel
              rfqTitle={rfqTitle}
              rfqDescription={rfqDescription}
              suppliers={suppliers}
              decision={decision}
            />
          )}
        </div>
      </div>

      {/* Negotiation modal */}
      {showNegModal && (
        <NegotiationModal
          text={decision.negotiation}
          onClose={() => setShowNegModal(false)}
        />
      )}
    </>
  )
}
