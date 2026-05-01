'use client'

import { useEffect, useCallback } from 'react'
import { CheckCircle2, XCircle, AlertTriangle, X } from 'lucide-react'

// ── Types ──────────────────────────────────────────────────────────────────────

export type ToastType = 'success' | 'error' | 'warning'

export interface ToastProps {
  message: string
  type?: ToastType
  duration?: number   // ms, default 3500
  onClose: () => void
}

// ── Config ─────────────────────────────────────────────────────────────────────

const TOAST_CFG: Record<ToastType, {
  icon: React.ElementType
  border: string
  bg: string
  iconCls: string
  text: string
}> = {
  success: {
    icon:    CheckCircle2,
    border:  'border-emerald-500/30',
    bg:      'bg-[#071a0f]',
    iconCls: 'text-emerald-400',
    text:    'text-emerald-100',
  },
  error: {
    icon:    XCircle,
    border:  'border-red-500/30',
    bg:      'bg-[#1a0707]',
    iconCls: 'text-red-400',
    text:    'text-red-100',
  },
  warning: {
    icon:    AlertTriangle,
    border:  'border-yellow-500/30',
    bg:      'bg-[#1a1407]',
    iconCls: 'text-yellow-400',
    text:    'text-yellow-100',
  },
}

// ── Component ──────────────────────────────────────────────────────────────────

export function Toast({
  message,
  type = 'success',
  duration = 3500,
  onClose,
}: ToastProps) {
  const close = useCallback(() => onClose(), [onClose])

  useEffect(() => {
    const t = setTimeout(close, duration)
    return () => clearTimeout(t)
  }, [close, duration])

  const cfg  = TOAST_CFG[type]
  const Icon = cfg.icon

  return (
    <div
      role="status"
      aria-live="polite"
      className={[
        'fixed bottom-6 right-6 z-[9999] flex items-center gap-3',
        'rounded-2xl border shadow-2xl px-4 py-3.5 min-w-[260px] max-w-sm',
        'animate-in slide-in-from-bottom-4 fade-in duration-300',
        cfg.border, cfg.bg,
      ].join(' ')}
    >
      <Icon className={`h-4 w-4 shrink-0 ${cfg.iconCls}`} />
      <p className={`flex-1 text-sm font-medium leading-snug ${cfg.text}`}>{message}</p>
      <button
        onClick={close}
        className="shrink-0 p-1 rounded-lg text-white/30 hover:text-white/70 transition-colors"
        aria-label="Dismiss"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}
