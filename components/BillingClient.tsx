'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import {
  CreditCard, CheckCircle2, Clock, XCircle, AlertTriangle,
  ArrowRight, Copy, Check, Loader2, Sparkles, Crown,
  Building, Phone, Banknote, Info, RefreshCw,
} from 'lucide-react'
import { toast } from '@/components/Toast'
import { submitPaymentRequest } from '@/app/billing/actions'
import type { PaymentRequest, SubscriptionStatus } from '@/lib/types'
import type { SubscriptionAccess } from '@/lib/subscription'

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function daysLabel(days: number): string {
  if (days <= 0)  return 'Expired'
  if (days === 1) return '1 day left'
  return `${days} days left`
}

const STATUS_COPY: Record<SubscriptionStatus, { label: string; color: string; desc: string }> = {
  trial:   { label: 'Trial',   color: 'text-amber-400  border-amber-400/30  bg-amber-400/10',   desc: 'You are on your free trial period.' },
  active:  { label: 'Active',  color: 'text-emerald-400 border-emerald-400/30 bg-emerald-400/10', desc: 'Your subscription is active.' },
  expired: { label: 'Expired', color: 'text-red-400    border-red-400/30    bg-red-400/10',    desc: 'Your subscription has expired. Please renew to continue.' },
  free:    { label: 'Free',    color: 'text-gray-400   border-gray-400/30   bg-gray-400/10',   desc: 'Upgrade to access all features.' },
}

const REQUEST_STYLE: Record<string, { color: string; icon: React.ElementType; label: string }> = {
  pending:  { color: 'text-amber-400  bg-amber-400/10  border-amber-400/20',  icon: Clock,        label: 'Pending' },
  approved: { color: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20', icon: CheckCircle2, label: 'Approved' },
  rejected: { color: 'text-red-400    bg-red-400/10    border-red-400/20',    icon: XCircle,      label: 'Rejected' },
}

// ── Copy button ───────────────────────────────────────────────────────────────

function CopyBtn({ value }: { value: string }) {
  const [copied, setCopied] = useState(false)
  function copy() {
    navigator.clipboard.writeText(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <button
      onClick={copy}
      className="ml-1.5 p-1 rounded text-gray-600 hover:text-gray-300 transition-colors"
      title="Copy"
    >
      {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
    </button>
  )
}

// ── Payment info row ──────────────────────────────────────────────────────────

function PayRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 py-3 border-t border-white/[0.05] first:border-0">
      <div className="p-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06] shrink-0 mt-0.5">
        <Icon className="h-3.5 w-3.5 text-gray-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] text-gray-500 uppercase tracking-wider font-semibold">{label}</p>
        <div className="flex items-center gap-0.5 mt-0.5">
          <p className="text-sm text-gray-200 font-mono">{value}</p>
          <CopyBtn value={value} />
        </div>
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

interface Props {
  email:       string
  fullName:    string
  access:      SubscriptionAccess
  requests:    PaymentRequest[]
  hasPending:  boolean
  lastRequest: PaymentRequest | null
}

export function BillingClient({ email, fullName, access, requests, hasPending, lastRequest }: Props) {
  const [, startTransition] = useTransition()
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted]   = useState(hasPending)

  const statusMeta = STATUS_COPY[access.status]

  function handleSubmit() {
    setSubmitting(true)
    startTransition(async () => {
      const result = await submitPaymentRequest()
      if (result.ok) {
        setSubmitted(true)
        toast.success('Payment request submitted! Admin will review it shortly.')
      } else {
        toast.error(result.error)
      }
      setSubmitting(false)
    })
  }

  const isExpired  = !access.allowed
  const isActive   = access.allowed && access.status === 'active'
  const isTrial    = access.allowed && access.status === 'trial'

  return (
    <div className="max-w-2xl mx-auto space-y-6">

      {/* ── Header ── */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
          <CreditCard className="h-6 w-6 text-blue-400" />
          Billing &amp; Subscription
        </h1>
        <p className="text-sm text-gray-500 mt-1">Manage your SIRAJ subscription</p>
      </div>

      {/* ── Expiry alert banner ── */}
      {isExpired && (
        <div className="flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-500/[0.06] px-4 py-3.5">
          <AlertTriangle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-red-300">Subscription Expired</p>
            <p className="text-xs text-red-400/80 mt-0.5">
              Your access has expired. Complete the payment below and click &quot;I have paid&quot; to restore access.
            </p>
          </div>
        </div>
      )}

      {/* ── Current plan card ── */}
      <div className="rounded-2xl border border-white/[0.07] bg-[#0d1220] p-6 space-y-4 relative overflow-hidden">
        <div className="pointer-events-none absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-white/[0.07] to-transparent" />

        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Current Plan</p>
            <div className="flex items-center gap-2.5">
              <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-bold uppercase tracking-wide ${statusMeta.color}`}>
                {access.status === 'active'  && <CheckCircle2 className="h-3 w-3" />}
                {access.status === 'trial'   && <Clock        className="h-3 w-3" />}
                {access.status === 'expired' && <XCircle      className="h-3 w-3" />}
                {access.status === 'free'    && <Crown        className="h-3 w-3" />}
                {statusMeta.label}
              </div>
              {access.daysLeft > 0 && access.daysLeft < 999 && (
                <span className="text-xs text-gray-500">{daysLabel(access.daysLeft)}</span>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-2">{statusMeta.desc}</p>
          </div>

          <div className="text-right">
            <p className="text-3xl font-bold text-white">299</p>
            <p className="text-xs text-gray-500">SAR / month</p>
          </div>
        </div>

        <div className="pt-2 border-t border-white/[0.05]">
          <div className="flex items-center gap-2 text-xs text-emerald-400">
            <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
            First month free — no credit card required
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-400 mt-1.5">
            <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-gray-600" />
            Manual payment (STC Pay / bank transfer)
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-400 mt-1.5">
            <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-gray-600" />
            Admin approves within 24 hours
          </div>
        </div>
      </div>

      {/* ── Payment instructions ── */}
      {(isExpired || isTrial) && (
        <div className="rounded-2xl border border-white/[0.07] bg-[#0d1220] p-6 space-y-1 relative overflow-hidden">
          <div className="pointer-events-none absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-blue-500/15 to-transparent" />

          <div className="flex items-center gap-2 mb-4">
            <div className="p-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <Banknote className="h-4 w-4 text-blue-400" />
            </div>
            <p className="text-sm font-semibold text-white">How to Pay</p>
          </div>

          <div className="space-y-0 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 divide-y divide-white/[0.04]">
            <PayRow icon={Phone}    label="STC Pay"      value="0512345678" />
            <PayRow icon={Building} label="IBAN"         value="SA1234567890123456789012" />
            <PayRow icon={Banknote} label="Bank"         value="Al Rajhi Bank" />
            <PayRow icon={Info}     label="Transfer Note" value={email} />
          </div>

          <div className="flex items-start gap-2 mt-3 rounded-xl bg-amber-500/[0.05] border border-amber-500/15 px-3 py-2.5">
            <Info className="h-3.5 w-3.5 text-amber-400 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-300/80 leading-relaxed">
              Include your email address <span className="font-semibold text-amber-300">{email}</span> in the transfer note so we can identify your payment.
            </p>
          </div>
        </div>
      )}

      {/* ── Submit payment request ── */}
      {(isExpired || isTrial) && (
        <div className="rounded-2xl border border-white/[0.07] bg-[#0d1220] p-6 space-y-4">
          <div>
            <p className="text-sm font-semibold text-white">Confirm Payment</p>
            <p className="text-xs text-gray-500 mt-1">
              After completing your bank transfer or STC Pay, click the button below. An admin will verify and activate your account within 24 hours.
            </p>
          </div>

          {submitted ? (
            <div className="flex items-center gap-3 rounded-xl border border-emerald-500/25 bg-emerald-500/[0.06] px-4 py-3.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-emerald-300">Request submitted!</p>
                <p className="text-xs text-emerald-400/70 mt-0.5">
                  We&apos;ll activate your account within 24 hours. You&apos;ll be able to access all features once approved.
                </p>
              </div>
            </div>
          ) : lastRequest?.status === 'rejected' ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3 rounded-xl border border-red-500/25 bg-red-500/[0.06] px-4 py-3.5">
                <XCircle className="h-4 w-4 text-red-400 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-red-300">Previous request rejected</p>
                  <p className="text-xs text-red-400/70 mt-0.5">
                    Your last payment request was rejected. Please verify the payment and try again, or contact support.
                  </p>
                </div>
              </div>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-95 text-white text-sm font-semibold transition-all disabled:opacity-60 shadow-lg shadow-blue-600/20"
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                Submit Again
              </button>
            </div>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 active:scale-95 text-white text-sm font-semibold transition-all disabled:opacity-60 shadow-lg shadow-blue-600/25"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              I have paid — Notify admin
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      )}

      {/* ── Active subscription — success state ── */}
      {isActive && (
        <div className="rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-950/40 to-blue-950/30 p-6 relative overflow-hidden">
          <div className="pointer-events-none absolute -top-10 -right-10 h-32 w-32 rounded-full bg-emerald-500/10 blur-2xl" />
          <div className="relative flex items-start gap-4">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 shrink-0">
              <Sparkles className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-base font-semibold text-white">Subscription Active</p>
              <p className="text-sm text-gray-400 mt-1">
                You have full access to all SIRAJ features.
                {access.daysLeft < 999 && (
                  <> Renews in <span className="text-emerald-400 font-medium">{access.daysLeft} days</span>.</>
                )}
              </p>
              <Link href="/" className="inline-flex items-center gap-1.5 mt-3 text-sm text-emerald-400 hover:text-emerald-300 font-medium transition-colors">
                Go to Dashboard <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ── Payment history ── */}
      {requests.length > 0 && (
        <div className="rounded-2xl border border-white/[0.07] bg-[#0d1220] p-5">
          <p className="text-sm font-semibold text-white mb-4">Payment History</p>
          <div className="space-y-2">
            {requests.map((req) => {
              const s = REQUEST_STYLE[req.status]
              const Icon = s.icon
              return (
                <div key={req.id} className="flex items-center justify-between py-2.5 border-t border-white/[0.04] first:border-0">
                  <div className="flex items-center gap-2.5">
                    <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-md border ${s.color}`}>
                      <Icon className="h-2.5 w-2.5" />
                      {s.label}
                    </span>
                    <span className="text-xs text-gray-500">{fmtDate(req.created_at)}</span>
                  </div>
                  {req.notes && (
                    <span className="text-xs text-gray-600 italic truncate max-w-[200px]">{req.notes}</span>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

    </div>
  )
}
