'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Send, Bot, Sparkles, RotateCcw, User, Zap, ChevronDown } from 'lucide-react'
import { parseAIDecision, isDecisionQuery, type AIDecision } from '@/lib/aiDecision'

interface SupplierContext {
  email: string
  price: number | null
  delivery_days: number | null
  answers?: Record<string, string | number>
}

interface FormField {
  id: string
  label: string
}

interface AIChatPanelProps {
  rfqTitle: string
  rfqDescription?: string | null
  suppliers: SupplierContext[]
  formFields?: FormField[]
  onDecision?: (decision: AIDecision) => void
}

interface Message {
  role: 'user' | 'assistant'
  content: string
  isDecision?: boolean
}

const SUGGESTED_PROMPTS = [
  'Who is the best supplier?',
  'Rank all suppliers',
  'Compare top 2 suppliers',
  'What should I negotiate first?',
]

// Decision-engine section headers — emoji-prefixed, short, act as titled sections
const SECTION_HEADERS: Record<string, { color: string; bg: string; border: string }> = {
  '🏆': { color: 'text-amber-200',  bg: 'bg-amber-500/10',  border: 'border-amber-500/25' },
  '📊': { color: 'text-blue-200',   bg: 'bg-blue-500/8',    border: 'border-blue-500/20'  },
  '💡': { color: 'text-sky-200',    bg: 'bg-sky-500/8',     border: 'border-sky-500/20'   },
  '⚖️': { color: 'text-violet-200', bg: 'bg-violet-500/8',  border: 'border-violet-500/20'},
  '⚠️': { color: 'text-red-300',    bg: 'bg-red-500/8',     border: 'border-red-500/20'   },
  '🎯': { color: 'text-emerald-200',bg: 'bg-emerald-500/8', border: 'border-emerald-500/20'},
  '🔑': { color: 'text-orange-200', bg: 'bg-orange-500/8',  border: 'border-orange-500/20'},
  '✉️': { color: 'text-indigo-200', bg: 'bg-indigo-500/8',  border: 'border-indigo-500/20'},
  '📋': { color: 'text-gray-200',   bg: 'bg-white/[0.04]',  border: 'border-white/[0.10]' },
}

const WARNING_PREFIXES = ['❌', '🚨', '⛔']
const HIGHLIGHT_PREFIXES = ['✅', '💡', '⭐']

function FormattedAIMessage({ content }: { content: string }) {
  const lines = content.split('\n')

  const elements: React.ReactNode[] = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]
    const trimmed = line.trim()

    // Empty line → spacing
    if (!trimmed) {
      elements.push(<div key={i} className="h-2" />)
      i++
      continue
    }

    // Bullet line (-, •, *)
    if (/^[-•*]\s/.test(trimmed)) {
      const bulletBlock: string[] = []
      while (i < lines.length && /^[-•*]\s/.test(lines[i].trim())) {
        bulletBlock.push(lines[i].trim().replace(/^[-•*]\s/, ''))
        i++
      }
      elements.push(
        <ul key={`bullet-${i}`} className="space-y-1.5 pl-1">
          {bulletBlock.map((b, bi) => (
            <li key={bi} className="flex items-start gap-2 leading-[1.7]" style={{ fontSize: 15 }}>
              <span className="mt-[6px] h-1.5 w-1.5 rounded-full bg-blue-400/70 shrink-0" />
              <span className="text-gray-200 font-[450]">{b}</span>
            </li>
          ))}
        </ul>,
      )
      continue
    }

    // Supplier ranking line: "1) email@domain.com — Score: 87/100"
    const rankMatch = trimmed.match(/^(\d+)\)\s+(.+?)\s+[—–-]+\s+Score:\s*(\d+)\/100(.*)$/i)
    if (rankMatch) {
      const [, pos, email, score, rest] = rankMatch
      const rank = parseInt(pos, 10)
      const sc = parseInt(score, 10)
      const isFirst = rank === 1
      const barColor = sc >= 80 ? 'bg-emerald-500' : sc >= 60 ? 'bg-blue-500' : sc >= 40 ? 'bg-amber-500' : 'bg-red-500'
      const cardBorder = isFirst ? 'border-amber-500/30 bg-amber-500/6' : 'border-white/[0.07] bg-white/[0.02]'
      // Peek at the next line — it's the reason text
      const nextTrimmed = i + 1 < lines.length ? lines[i + 1].trim() : ''
      const reasonLine = (nextTrimmed && !/^\d+/.test(nextTrimmed) && !Object.keys(SECTION_HEADERS).some((e) => nextTrimmed.startsWith(e)))
        ? lines[i + 1].trim()
        : null
      elements.push(
        <div key={i} className={`rounded-xl border ${cardBorder} px-4 py-3 space-y-2`}>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className={`shrink-0 h-6 w-6 rounded-full flex items-center justify-center text-[11px] font-bold ${isFirst ? 'bg-amber-500/20 border border-amber-500/40 text-amber-300' : 'bg-white/[0.06] border border-white/[0.10] text-gray-400'}`}>
                {rank}
              </span>
              <span className={`text-sm font-semibold truncate ${isFirst ? 'text-amber-200' : 'text-gray-200'}`}>
                {email}
              </span>
              {rest?.trim() && <span className="text-xs text-gray-500 truncate">{rest.trim()}</span>}
            </div>
            <span className={`shrink-0 text-sm font-bold tabular-nums ${isFirst ? 'text-amber-300' : sc >= 60 ? 'text-blue-300' : 'text-gray-400'}`}>
              {score}<span className="text-xs font-normal text-gray-600">/100</span>
            </span>
          </div>
          <div className="h-1 w-full rounded-full bg-white/[0.05] overflow-hidden">
            <div className={`h-full rounded-full ${barColor}`} style={{ width: `${sc}%` }} />
          </div>
          {reasonLine && (
            <p className="text-xs text-gray-400 leading-relaxed">{reasonLine}</p>
          )}
        </div>,
      )
      i++ // skip rank line
      if (reasonLine) i++ // skip reason line we already consumed
      continue
    }

    // Numbered list (1. 2. etc.)
    if (/^\d+\.\s/.test(trimmed)) {
      const num = trimmed.match(/^(\d+)\.\s(.*)/)
      if (num) {
        elements.push(
          <div key={i} className="flex items-start gap-2.5" style={{ fontSize: 15, lineHeight: 1.7 }}>
            <span className="shrink-0 h-5 w-5 rounded-full bg-blue-500/20 border border-blue-500/30 text-blue-300 text-[11px] font-bold flex items-center justify-center mt-0.5">
              {num[1]}
            </span>
            <span className="text-gray-200 font-[450]">{num[2]}</span>
          </div>,
        )
        i++
        continue
      }
    }

    // Decision-engine section header (emoji key + title text)
    const sectionEmoji = Object.keys(SECTION_HEADERS).find((e) => trimmed.startsWith(e))
    if (sectionEmoji) {
      const style = SECTION_HEADERS[sectionEmoji]
      elements.push(
        <div
          key={i}
          className={`rounded-lg ${style.bg} border ${style.border} px-3 py-2 ${style.color} font-semibold mt-3`}
          style={{ fontSize: 14, lineHeight: 1.6 }}
        >
          {trimmed}
        </div>,
      )
      i++
      continue
    }

    // Warning line
    if (WARNING_PREFIXES.some((p) => trimmed.startsWith(p))) {
      elements.push(
        <div
          key={i}
          className="rounded-lg bg-red-500/8 border border-red-500/15 px-3 py-2 text-red-300 font-medium"
          style={{ fontSize: 15, lineHeight: 1.7 }}
        >
          {trimmed}
        </div>,
      )
      i++
      continue
    }

    // Highlight line (trophy, check, etc.)
    if (HIGHLIGHT_PREFIXES.some((p) => trimmed.startsWith(p))) {
      elements.push(
        <div
          key={i}
          className="rounded-lg bg-amber-500/8 border border-amber-500/20 px-3 py-2 text-amber-200 font-semibold"
          style={{ fontSize: 15, lineHeight: 1.7 }}
        >
          {trimmed}
        </div>,
      )
      i++
      continue
    }

    // Section header (ends with : and short)
    if (trimmed.endsWith(':') && trimmed.length < 60) {
      elements.push(
        <p key={i} className="text-xs font-semibold text-gray-500 uppercase tracking-wider mt-1">
          {trimmed.slice(0, -1)}
        </p>,
      )
      i++
      continue
    }

    // Normal paragraph line
    elements.push(
      <p key={i} className="text-gray-200 font-[450]" style={{ fontSize: 15, lineHeight: 1.7 }}>
        {trimmed}
      </p>,
    )
    i++
  }

  return <div className="space-y-2">{elements}</div>
}

function TypingDots() {
  return (
    <span className="inline-flex items-center gap-1 px-1">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-bounce"
          style={{ animationDelay: `${i * 150}ms`, animationDuration: '900ms' }}
        />
      ))}
    </span>
  )
}

function DecisionPill() {
  return (
    <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 font-medium ml-2">
      <Zap className="h-3 w-3" />
      UI Updated
    </span>
  )
}

export function AIChatPanel({ rfqTitle, rfqDescription, suppliers, formFields, onDecision }: AIChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isNearBottom, setIsNearBottom] = useState(true)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const isNearBottomRef    = useRef(true)
  const inputRef           = useRef<HTMLTextAreaElement>(null)
  const abortRef           = useRef<AbortController | null>(null)

  const scrollToBottom = useCallback(() => {
    const el = scrollContainerRef.current
    if (!el) return
    el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
  }, [])

  function handleScroll() {
    const el = scrollContainerRef.current
    if (!el) return
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80
    isNearBottomRef.current = nearBottom
    setIsNearBottom(nearBottom)
  }

  // Auto-scroll on new content only when already near bottom
  useEffect(() => {
    if (isNearBottomRef.current) scrollToBottom()
  }, [messages, scrollToBottom])

  // Force-scroll to bottom when user sends a new message (streaming starts)
  useEffect(() => {
    if (isStreaming) {
      isNearBottomRef.current = true
      setIsNearBottom(true)
      scrollToBottom()
    }
  }, [isStreaming, scrollToBottom])

  const send = useCallback(async (text: string) => {
    const trimmed = text.trim()
    if (!trimmed || isStreaming) return

    setError(null)
    const userMsg: Message = { role: 'user', content: trimmed }
    const history = [...messages, userMsg]
    setMessages([...history, { role: 'assistant', content: '' }])
    setInput('')
    setIsStreaming(true)

    abortRef.current = new AbortController()

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: abortRef.current.signal,
        body: JSON.stringify({
          messages: history.map((m) => ({ role: m.role, content: m.content })),
          context: {
            rfq_title: rfqTitle,
            rfq_description: rfqDescription,
            suppliers,
            form_fields: formFields ?? [],
          },
        }),
      })

      if (!res.ok) throw new Error(`Server error ${res.status}`)
      if (!res.body) throw new Error('No response body')

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let fullContent = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        fullContent += chunk
        setMessages((prev) => {
          const copy = [...prev]
          copy[copy.length - 1] = { ...copy[copy.length - 1], content: fullContent }
          return copy
        })
      }

      // After stream completes — try to parse a decision
      const decision = parseAIDecision(fullContent)
      const triggeredDecision = isDecisionQuery(trimmed)

      if (decision && triggeredDecision) {
        onDecision?.(decision)
        // Mark the message as a decision response
        setMessages((prev) => {
          const copy = [...prev]
          copy[copy.length - 1] = { ...copy[copy.length - 1], isDecision: true }
          return copy
        })
      }
    } catch (err) {
      if ((err as Error).name === 'AbortError') return
      const msg = err instanceof Error ? err.message : 'Something went wrong'
      setError(msg)
      setMessages((prev) => prev.slice(0, -1))
    } finally {
      setIsStreaming(false)
      abortRef.current = null
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [isStreaming, messages, rfqTitle, rfqDescription, suppliers, formFields, onDecision])

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send(input)
    }
  }

  function retry() {
    const lastUser = [...messages].reverse().find((m) => m.role === 'user')
    if (lastUser) {
      setMessages(messages.slice(0, -2))
      send(lastUser.content)
    }
  }

  const isEmpty = messages.length === 0

  return (
    <div
      className="flex flex-col h-full rounded-xl overflow-hidden"
      style={{
        background: 'linear-gradient(180deg, #111827 0%, #0f172a 100%)',
        boxShadow: '0 0 0 1px rgba(59,130,246,0.15), 0 4px 24px rgba(0,0,0,0.4)',
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3.5 border-b border-white/5 bg-white/[0.02] shrink-0">
        <div className="p-1.5 rounded-lg bg-blue-500/15 border border-blue-500/20">
          <Bot className="h-4 w-4 text-blue-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white leading-none">AI Decision Engine</p>
          <p className="text-xs text-gray-600 mt-0.5">Drives supplier UI in real-time</p>
        </div>
        <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 font-medium shrink-0">
          <Sparkles className="h-3 w-3" />
          Live
        </span>
      </div>

      {/* Messages */}
      <div className="relative flex-1 min-h-0">
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="h-full overflow-y-auto px-4 py-4 space-y-4 scroll-smooth"
      >

        {isEmpty && (
          <div className="flex flex-col items-center gap-5 py-6">
            <div className="p-3 rounded-2xl bg-blue-500/10 border border-blue-500/15">
              <Bot className="h-7 w-7 text-blue-400" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-gray-300">Ask AI to decide</p>
              <p className="text-xs text-gray-600 mt-1">
                Ranking queries update the supplier list instantly.
              </p>
            </div>
            <div className="flex flex-col gap-2 w-full">
              {SUGGESTED_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => send(prompt)}
                  className="text-left text-xs px-3 py-2.5 rounded-lg border border-gray-800 bg-gray-800/50 text-gray-400 hover:border-blue-500/40 hover:bg-blue-500/5 hover:text-blue-300 transition-all duration-150"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.role === 'assistant' && (
              <div className="shrink-0 mt-0.5 p-1 rounded-full bg-blue-500/10 border border-blue-500/15 h-6 w-6 flex items-center justify-center">
                <Bot className="h-3.5 w-3.5 text-blue-400" />
              </div>
            )}

            <div className="max-w-[85%] flex flex-col gap-1">
              <div
                className={[
                  msg.role === 'user'
                    ? 'rounded-2xl rounded-tr-sm px-3.5 py-2.5 bg-blue-600 text-white text-[15px] leading-[1.7] font-[450]'
                    : 'rounded-2xl rounded-tl-sm px-4 py-3.5 bg-white/[0.04] border border-white/[0.08]',
                ].join(' ')}
              >
                {msg.role === 'assistant' ? (
                  !msg.content && isStreaming ? (
                    <TypingDots />
                  ) : (
                    <FormattedAIMessage content={msg.content} />
                  )
                ) : (
                  <span>{msg.content}</span>
                )}
              </div>
              {msg.isDecision && (
                <div className="pl-1">
                  <DecisionPill />
                </div>
              )}
            </div>

            {msg.role === 'user' && (
              <div className="shrink-0 mt-0.5 p-1 rounded-full bg-gray-700 border border-gray-600 h-6 w-6 flex items-center justify-center">
                <User className="h-3.5 w-3.5 text-gray-300" />
              </div>
            )}
          </div>
        ))}

        {error && (
          <div className="flex items-center gap-2 text-xs text-red-400 bg-red-500/8 border border-red-500/15 rounded-lg px-3 py-2">
            <span className="flex-1">AI analysis unavailable — {error}</span>
            <button
              onClick={retry}
              className="shrink-0 flex items-center gap-1 text-red-300 hover:text-white transition-colors"
            >
              <RotateCcw className="h-3 w-3" />
              Retry
            </button>
          </div>
        )}

      </div>

      {/* Jump to latest button */}
      {!isNearBottom && (
        <button
          onClick={scrollToBottom}
          className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border border-blue-500/40 bg-[#111827]/90 text-blue-300 hover:bg-blue-500/20 hover:text-white transition-all shadow-lg backdrop-blur-sm"
        >
          <ChevronDown className="h-3.5 w-3.5" />
          Jump to latest
        </button>
      )}
      </div>

      {/* Input */}
      <div className="px-4 pb-4 pt-2 border-t border-white/5 shrink-0">
        <div className="flex items-end gap-2 rounded-xl border border-gray-700/80 bg-gray-800/60 px-3 py-2 focus-within:border-blue-500/50 focus-within:bg-gray-800 transition-all">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isStreaming}
            placeholder={isStreaming ? 'Thinking…' : 'Ask AI to rank or compare suppliers…'}
            rows={1}
            className="flex-1 resize-none bg-transparent text-sm text-white placeholder:text-gray-600 outline-none disabled:opacity-50 max-h-28 leading-relaxed py-0.5"
            style={{ fieldSizing: 'content' } as React.CSSProperties}
          />
          <button
            onClick={() => send(input)}
            disabled={!input.trim() || isStreaming}
            className="shrink-0 p-1.5 rounded-lg bg-blue-600 text-white disabled:opacity-30 hover:bg-blue-500 active:scale-95 transition-all"
          >
            <Send className="h-3.5 w-3.5" />
          </button>
        </div>
        <p className="text-xs text-gray-700 text-center mt-2">
          Ranking queries update the dashboard automatically
        </p>
      </div>
    </div>
  )
}
