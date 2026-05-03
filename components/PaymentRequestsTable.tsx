'use client'

import { useState, useTransition } from 'react'
import {
  CreditCard, Clock, CheckCircle2, XCircle,
  Loader2, AlertTriangle,
} from 'lucide-react'
import { toast } from '@/components/Toast'
import { approvePaymentRequest, rejectPaymentRequest } from '@/app/admin/actions'
import type { PaymentRequestWithUser } from '@/lib/types'

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const STATUS_STYLE = {
  pending:  { color: 'text-amber-400  bg-amber-400/10  border-amber-400/20',  icon: Clock,        label: 'Pending' },
  approved: { color: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20', icon: CheckCircle2, label: 'Approved' },
  rejected: { color: 'text-red-400    bg-red-400/10    border-red-400/20',    icon: XCircle,      label: 'Rejected' },
} as const

// ── Row ───────────────────────────────────────────────────────────────────────

function RequestRow({
  req,
  onApprove,
  onReject,
}: {
  req: PaymentRequestWithUser
  onApprove: (id: string) => Promise<void>
  onReject:  (id: string) => Promise<void>
}) {
  const [busy, setBusy]   = useState<'approve' | 'reject' | null>(null)
  const [, startTrans]    = useTransition()

  const s    = STATUS_STYLE[req.status as keyof typeof STATUS_STYLE] ?? STATUS_STYLE.pending
  const Icon = s.icon

  async function act(action: 'approve' | 'reject') {
    setBusy(action)
    startTrans(async () => {
      if (action === 'approve') await onApprove(req.id)
      else                      await onReject(req.id)
      setBusy(null)
    })
  }

  return (
    <div className="flex items-center gap-4 py-3.5 border-t border-white/[0.05] first:border-0">
      {/* Status badge */}
      <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-md border shrink-0 ${s.color}`}>
        <Icon className="h-2.5 w-2.5" />
        {s.label}
      </span>

      {/* User info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white truncate">
          {req.full_name || req.email || req.user_id.slice(0, 8)}
        </p>
        <div className="flex items-center gap-3 mt-0.5">
          {req.email && <p className="text-xs text-gray-500 truncate">{req.email}</p>}
          {req.company && <p className="text-xs text-gray-600 truncate">· {req.company}</p>}
        </div>
      </div>

      {/* Date */}
      <p className="text-xs text-gray-600 shrink-0">{fmtDate(req.created_at)}</p>

      {/* Actions — only for pending */}
      {req.status === 'pending' && (
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => act('approve')}
            disabled={busy !== null}
            className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-semibold transition-all disabled:opacity-50"
          >
            {busy === 'approve'
              ? <Loader2 className="h-3 w-3 animate-spin" />
              : <CheckCircle2 className="h-3 w-3" />}
            Approve
          </button>
          <button
            onClick={() => act('reject')}
            disabled={busy !== null}
            className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 active:scale-95 text-red-400 font-semibold transition-all disabled:opacity-50"
          >
            {busy === 'reject'
              ? <Loader2 className="h-3 w-3 animate-spin" />
              : <XCircle className="h-3 w-3" />}
            Reject
          </button>
        </div>
      )}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

interface Props {
  initialRequests: PaymentRequestWithUser[]
  pendingCount:    number
}

export function PaymentRequestsTable({ initialRequests, pendingCount }: Props) {
  const [requests, setRequests] = useState(initialRequests)
  const [filter, setFilter]     = useState<'all' | 'pending'>('pending')

  const displayed = filter === 'pending'
    ? requests.filter((r) => r.status === 'pending')
    : requests

  async function handleApprove(id: string) {
    const result = await approvePaymentRequest(id)
    if (result.ok) {
      setRequests((prev) => prev.map((r) => r.id === id ? { ...r, status: 'approved' } : r))
      toast.success('Payment approved — subscription activated for 30 days.')
    } else {
      toast.error(result.error)
    }
  }

  async function handleReject(id: string) {
    const result = await rejectPaymentRequest(id)
    if (result.ok) {
      setRequests((prev) => prev.map((r) => r.id === id ? { ...r, status: 'rejected' } : r))
      toast.error('Payment request rejected.')
    } else {
      toast.error(result.error)
    }
  }

  return (
    <div className="rounded-2xl border border-white/[0.07] bg-[#0d1220] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <CreditCard className="h-4 w-4 text-amber-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Payment Requests</p>
            <p className="text-xs text-gray-600">{requests.length} total</p>
          </div>
          {pendingCount > 0 && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-400/15 border border-amber-400/20 text-amber-400">
              <AlertTriangle className="h-2.5 w-2.5" />
              {pendingCount} pending
            </span>
          )}
        </div>

        {/* Filter tabs */}
        <div className="flex items-center rounded-lg border border-white/[0.08] overflow-hidden text-xs">
          <button
            onClick={() => setFilter('pending')}
            className={`px-3 py-1.5 font-medium transition-colors ${
              filter === 'pending'
                ? 'bg-white/[0.08] text-white'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            Pending
          </button>
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 font-medium transition-colors border-l border-white/[0.08] ${
              filter === 'all'
                ? 'bg-white/[0.08] text-white'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            All
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="px-5">
        {displayed.length === 0 ? (
          <div className="py-10 text-center">
            <p className="text-sm text-gray-500">
              {filter === 'pending' ? 'No pending payment requests.' : 'No payment requests yet.'}
            </p>
          </div>
        ) : (
          displayed.map((req) => (
            <RequestRow
              key={req.id}
              req={req}
              onApprove={handleApprove}
              onReject={handleReject}
            />
          ))
        )}
      </div>
    </div>
  )
}
