'use client'

import { useState, useRef, useCallback } from 'react'
import {
  MessageSquare, ChevronRight, ChevronDown, Mail,
  DollarSign, Clock, Send, Copy, Check, Loader2, Brain, Sparkles,
} from 'lucide-react'

interface RFQ { id: string; title: string; description: string | null; status: string }
interface Response {
  id: string; rfq_id: string; supplier_email: string
  price: number | null; delivery_days: number | null
  answers: Record<string, unknown>; created_at: string
}
interface Props { rfqs: RFQ[]; responses: Response[] }

const STATUS_CLS: Record<string, string> = {
  active:    'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  paused:    'bg-yellow-500/15 text-yellow-300 border-yellow-500/30',
  cancelled: 'bg-red-500/15 text-red-300 border-red-500/30',
  closed:    'bg-gray-600/20 text-gray-400 border-gray-600/30',
}

function SupplierNegotiateRow({
  response, rfq, competitors,
}: {
  response: Response; rfq: RFQ; competitors: Response[]
}) {
  const [open, setOpen]       = useState(false)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [copied, setCopied]   = useState(false)
  const abortRef              = useRef<AbortController | null>(null)

  const generate = useCallback(async () => {
    abortRef.current?.abort()
    abortRef.current = new AbortController()
    setMessage('')
    setLoading(true)

    try {
      const res = await fetch('/api/ai/negotiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: abortRef.current.signal,
        body: JSON.stringify({
          rfq_title:       rfq.title,
          rfq_description: rfq.description,
          target: {
            email:         response.supplier_email,
            price:         response.price,
            delivery_days: response.delivery_days,
            notes:         (response.answers?.notes as string) ?? null,
          },
          competitors: competitors.map((c) => ({
            email: c.supplier_email, price: c.price, delivery_days: c.delivery_days,
          })),
        }),
      })

      if (!res.ok || !res.body) throw new Error('Failed')
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let full = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        full += decoder.decode(value, { stream: true })
        setMessage(full)
      }
    } catch (err) {
      if ((err as Error).name !== 'AbortError') setMessage('[Error generating message]')
    } finally {
      setLoading(false)
    }
  }, [response, rfq, competitors])

  async function copyMsg() {
    await navigator.clipboard.writeText(message)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const name = response.supplier_email.split('@')[0]

  return (
    <div className="border border-white/[0.06] rounded-xl overflow-hidden">
      {/* Header row */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-3 px-4 py-3.5 bg-white/[0.02] hover:bg-white/[0.04] transition-colors text-left"
      >
        <div className="h-7 w-7 rounded-full bg-gradient-to-br from-blue-600/30 to-violet-600/30 border border-blue-500/20 flex items-center justify-center text-xs font-bold text-blue-300 uppercase shrink-0">
          {name[0]}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white">{response.supplier_email}</p>
          <div className="flex items-center gap-3 text-xs text-gray-600 mt-0.5">
            {response.price !== null && (
              <span className="flex items-center gap-1"><DollarSign className="h-3 w-3" />${Number(response.price).toLocaleString('en-US')}</span>
            )}
            {response.delivery_days !== null && (
              <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{response.delivery_days}d</span>
            )}
            <span className="text-gray-700">{new Date(response.created_at).toISOString().split('T')[0]}</span>
          </div>
        </div>
        {open ? <ChevronDown className="h-4 w-4 text-gray-600 shrink-0" /> : <ChevronRight className="h-4 w-4 text-gray-600 shrink-0" />}
      </button>

      {/* Expanded negotiate panel */}
      {open && (
        <div className="px-4 py-4 bg-[#0d1220] border-t border-white/[0.05] space-y-3">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Brain className="h-3.5 w-3.5 text-violet-400" />
            <span>AI Negotiation Message</span>
            {competitors.length > 0 && (
              <span className="text-gray-700">· {competitors.length} competing offer{competitors.length !== 1 ? 's' : ''} as context</span>
            )}
          </div>

          <div className="min-h-[80px] rounded-xl bg-[#0d1220] border border-white/[0.06] p-3.5 text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">
            {loading && !message && (
              <span className="flex items-center gap-2 text-gray-600 text-xs">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />Generating…
              </span>
            )}
            {message}
            {!loading && !message && <span className="text-gray-700 text-xs">Click Generate to create a negotiation message</span>}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={generate}
              disabled={loading}
              className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 active:scale-95 text-white font-semibold transition-all disabled:opacity-50"
            >
              {loading
                ? <><Loader2 className="h-3 w-3 animate-spin" />Generating…</>
                : <><Sparkles className="h-3 w-3" />{message ? 'Regenerate' : 'Generate'}</>
              }
            </button>
            {message && (
              <button
                onClick={copyMsg}
                className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-white/[0.10] bg-white/[0.04] hover:bg-white/[0.08] text-gray-300 transition-all"
              >
                {copied ? <><Check className="h-3 w-3 text-emerald-400" />Copied!</> : <><Copy className="h-3 w-3" />Copy</>}
              </button>
            )}
            <a
              href={`mailto:${response.supplier_email}${message ? `?body=${encodeURIComponent(message)}` : ''}`}
              className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-blue-500/25 bg-blue-500/8 hover:bg-blue-500/15 text-blue-300 transition-all"
            >
              <Send className="h-3 w-3" />Send via Email
            </a>
          </div>
        </div>
      )}
    </div>
  )
}

export function MessagesClient({ rfqs, responses }: Props) {
  const [expandedRfq, setExpandedRfq] = useState<string | null>(rfqs[0]?.id ?? null)

  const rfqsWithResponses = rfqs.filter((rfq) =>
    responses.some((r) => r.rfq_id === rfq.id)
  )

  const totalSuppliers = new Set(responses.map((r) => r.supplier_email)).size

  if (rfqsWithResponses.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold text-white">Messages</h1>
          <p className="text-xs text-gray-600 mt-0.5">AI-powered negotiation messages per supplier</p>
        </div>
        <div className="flex flex-col items-center justify-center py-32 gap-4 text-center">
          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
            <MessageSquare className="h-8 w-8 text-gray-700" />
          </div>
          <p className="text-sm text-gray-500">No supplier responses yet.</p>
          <p className="text-xs text-gray-600">Messages appear here once suppliers submit quotes.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Messages</h1>
          <p className="text-xs text-gray-600 mt-0.5">AI-powered negotiation messages per supplier</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-white/[0.07] bg-[#0d1220] text-xs text-gray-500">
          <Mail className="h-3.5 w-3.5" />
          {totalSuppliers} suppliers · {responses.length} quotes
        </div>
      </div>

      {/* RFQ groups */}
      <div className="space-y-3">
        {rfqsWithResponses.map((rfq) => {
          const rfqResponses = responses.filter((r) => r.rfq_id === rfq.id)
          const isOpen = expandedRfq === rfq.id

          return (
            <div key={rfq.id} className="rounded-2xl border border-white/[0.07] bg-[#0d1220] overflow-hidden">
              {/* RFQ header */}
              <button
                onClick={() => setExpandedRfq(isOpen ? null : rfq.id)}
                className="w-full flex items-center gap-3 px-5 py-4 hover:bg-white/[0.02] transition-colors"
              >
                <div className={`p-1.5 rounded-lg border ${STATUS_CLS[rfq.status] ?? STATUS_CLS.closed}`}>
                  <MessageSquare className="h-3.5 w-3.5" />
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-sm font-semibold text-white truncate">{rfq.title}</p>
                  <p className="text-xs text-gray-600 mt-0.5">
                    {rfqResponses.length} supplier{rfqResponses.length !== 1 ? 's' : ''} quoted
                  </p>
                </div>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border capitalize ${STATUS_CLS[rfq.status] ?? STATUS_CLS.closed}`}>
                  {rfq.status}
                </span>
                {isOpen
                  ? <ChevronDown className="h-4 w-4 text-gray-600 shrink-0" />
                  : <ChevronRight className="h-4 w-4 text-gray-600 shrink-0" />
                }
              </button>

              {/* Suppliers */}
              {isOpen && (
                <div className="px-5 pb-5 space-y-2 border-t border-white/[0.05] pt-4">
                  {rfqResponses.map((response) => (
                    <SupplierNegotiateRow
                      key={response.id}
                      response={response}
                      rfq={rfq}
                      competitors={rfqResponses.filter((r) => r.id !== response.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
