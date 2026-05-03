'use client'

import { useEffect, useState, useCallback } from 'react'
import { CheckCircle2, XCircle, AlertCircle, Info, X } from 'lucide-react'

export type ToastVariant = 'success' | 'error' | 'warning' | 'info'

export interface ToastData {
  id:       string
  message:  string
  variant:  ToastVariant
  duration?: number
}

type Listener = (toast: ToastData) => void
const listeners = new Set<Listener>()

export function toast(message: string, variant: ToastVariant = 'info', duration = 4000) {
  const data: ToastData = { id: crypto.randomUUID(), message, variant, duration }
  listeners.forEach((l) => l(data))
}
toast.success = (msg: string, duration?: number) => toast(msg, 'success', duration)
toast.error   = (msg: string, duration?: number) => toast(msg, 'error',   duration)
toast.warning = (msg: string, duration?: number) => toast(msg, 'warning', duration)
toast.info    = (msg: string, duration?: number) => toast(msg, 'info',    duration)

const STYLES: Record<ToastVariant, { bar: string; icon: string; bg: string; border: string }> = {
  success: { bar: 'bg-emerald-500', icon: 'text-emerald-400', bg: 'bg-[#0d1a14]', border: 'border-emerald-500/25' },
  error:   { bar: 'bg-red-500',     icon: 'text-red-400',     bg: 'bg-[#1a0d0d]', border: 'border-red-500/25'     },
  warning: { bar: 'bg-amber-500',   icon: 'text-amber-400',   bg: 'bg-[#1a160d]', border: 'border-amber-500/25'   },
  info:    { bar: 'bg-blue-500',    icon: 'text-blue-400',    bg: 'bg-[#0d1220]', border: 'border-blue-500/25'    },
}

const ICONS: Record<ToastVariant, React.ElementType> = {
  success: CheckCircle2,
  error:   XCircle,
  warning: AlertCircle,
  info:    Info,
}

function ToastItem({ data, onRemove }: { data: ToastData; onRemove: (id: string) => void }) {
  const [visible, setVisible] = useState(false)
  const s = STYLES[data.variant]
  const Icon = ICONS[data.variant]
  const duration = data.duration ?? 4000

  useEffect(() => {
    const frame = requestAnimationFrame(() => setVisible(true))
    const timer = setTimeout(() => {
      setVisible(false)
      setTimeout(() => onRemove(data.id), 300)
    }, duration)
    return () => { cancelAnimationFrame(frame); clearTimeout(timer) }
  }, [data.id, duration, onRemove])

  return (
    <div
      className={[
        'flex items-start gap-3 rounded-xl border px-3.5 py-3 shadow-lg shadow-black/40 min-w-[260px] max-w-sm',
        'transition-all duration-300',
        s.bg, s.border,
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2',
      ].join(' ')}
    >
      <div className={`relative w-0.5 self-stretch rounded-full ${s.bar} shrink-0`} />
      <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${s.icon}`} />
      <p className="text-sm text-gray-200 flex-1 leading-snug">{data.message}</p>
      <button
        onClick={() => { setVisible(false); setTimeout(() => onRemove(data.id), 300) }}
        className="shrink-0 p-0.5 rounded text-gray-600 hover:text-gray-300 transition-colors mt-0.5"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}

// ── Inline Toast component (used by SupplierCard and similar) ─────────────────
// Renders in-place (not portal) with auto-dismiss and onClose callback.

export interface ToastProps {
  message:  string
  type?:    ToastVariant
  duration?: number
  onClose:  () => void
}

export function Toast({ message, type = 'info', duration = 4000, onClose }: ToastProps) {
  const [visible, setVisible] = useState(false)
  const s    = STYLES[type]
  const Icon = ICONS[type]

  useEffect(() => {
    const frame = requestAnimationFrame(() => setVisible(true))
    const timer = setTimeout(() => {
      setVisible(false)
      setTimeout(onClose, 300)
    }, duration)
    return () => { cancelAnimationFrame(frame); clearTimeout(timer) }
  }, [duration, onClose])

  return (
    <div
      className={[
        'flex items-start gap-3 rounded-xl border px-3.5 py-3 shadow-lg shadow-black/40',
        'transition-all duration-300',
        s.bg, s.border,
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2',
      ].join(' ')}
    >
      <div className={`w-0.5 self-stretch rounded-full ${s.bar} shrink-0`} />
      <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${s.icon}`} />
      <p className="text-sm text-gray-200 flex-1 leading-snug">{message}</p>
      <button
        onClick={() => { setVisible(false); setTimeout(onClose, 300) }}
        className="shrink-0 p-0.5 rounded text-gray-600 hover:text-gray-300 transition-colors mt-0.5"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}

// ── ToastContainer — render once in layout ────────────────────────────────────

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastData[]>([])

  const remove = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  useEffect(() => {
    const handler: Listener = (t) => setToasts((prev) => [...prev, t])
    listeners.add(handler)
    return () => { listeners.delete(handler) }
  }, [])

  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2 items-end">
      {toasts.map((t) => (
        <ToastItem key={t.id} data={t} onRemove={remove} />
      ))}
    </div>
  )
}
