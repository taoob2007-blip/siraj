'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  CreditCard, CheckCircle2, Clock, XCircle, AlertTriangle,
  ArrowRight, Copy, Check, Loader2, Sparkles, Crown,
  Building, MessageCircle, Banknote, Zap, RefreshCw, Users,
} from 'lucide-react'
import { toast } from '@/components/Toast'
import { submitPaymentRequest } from '@/app/billing/actions'
import type { PaymentRequest, SubscriptionStatus } from '@/lib/types'
import type { SubscriptionAccess } from '@/lib/subscription'

// ── Constants ─────────────────────────────────────────────────────────────────

const WA_NUMBER = '966552488556'
const IBAN      = 'SA27 8000 0523 6080 1012 5902'
const BANK      = 'Al Rajhi Bank'
const PRICE_SAR = 299

// ── Helpers ───────────────────────────────────────────────────────────────────

function buildWaLink(email: string) {
  const msg = `I have paid. Email: ${email || 'Not provided'}`
  return `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(msg)}`
}

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

function CopyBtn({ value, label }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false)
  function copy() {
    navigator.clipboard.writeText(value)
    setCopied(true)
    toast.success(label ? `${label} copied` : 'Copied')
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <button
      onClick={copy}
      className="ml-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-md border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.07] text-gray-500 hover:text-gray-200 text-[10px] font-medium transition-all"
      title={`Copy ${label ?? ''}`}
    >
      {copied ? <Check className="h-2.5 w-2.5 text-emerald-400" /> : <Copy className="h-2.5 w-2.5" />}
      {copied ? 'Copied' : 'Copy'}
    </button>
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
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [submitting, setSubmitting]     = useState(false)
  const [submitted, setSubmitted]       = useState(hasPending)
  const [checking, setChecking]         = useState(false)
  const [checkResult, setCheckResult]   = useState<'idle' | 'activated' | 'pending'>('idle')

  const safeEmail = email || 'Not provided'
  const waLink    = buildWaLink(safeEmail)
  const statusMeta = STATUS_COPY[access.status]

  // Open WhatsApp immediately (must be synchronous to avoid popup blockers),
  // then submit the DB record in the background.
  function handleWaSubmit() {
    window.open(waLink, '_blank', 'noopener,noreferrer')

    if (submitted) return   // already have a pending record — no duplicate insert needed

    setSubmitting(true)
    startTransition(async () => {
      const result = await submitPaymentRequest()
      if (result.ok) {
        setSubmitted(true)
        toast.success('Payment request sent. Waiting for admin approval.')
      } else if (!result.error?.toLowerCase().includes('pending')) {
        toast.error(result.error)
      } else {
        setSubmitted(true)
      }
      setSubmitting(false)
    })
  }

  // Polls the live subscription status from the DB.
  // If activated by admin, refresh server components and signal the user.
  async function handleCheckActivation() {
    setChecking(true)
    setCheckResult('idle')
    try {
      const res  = await fetch('/api/subscription', { cache: 'no-store' })
      const data = await res.json()
      console.log('[billing] USER:', email, '| SUB:', data)
      if (data.allowed && data.isActive) {
        setCheckResult('activated')
        toast.success('Subscription activated! Refreshing…')
        // Refresh all server components so the sidebar and pages update immediately.
        router.refresh()
        // Hard reload after a short delay so middleware re-reads the DB and unlocks all routes.
        setTimeout(() => window.location.reload(), 1200)
      } else {
        setCheckResult('pending')
      }
    } catch {
      toast.error('Could not check status. Please try again.')
    } finally {
      setChecking(false)
    }
  }

  const isExpired       = !access.allowed
  const isActive        = access.isActive
  const isTrial         = access.isTrial
  const showPaymentFlow = isExpired || isTrial

  return (
    <div className="max-w-2xl mx-auto space-y-6">

      {/* ── Header ── */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
          <CreditCard className="h-6 w-6 text-cyan-400" />
          Billing &amp; Subscription
        </h1>
        <p className="text-sm text-gray-500 mt-1">Manage your SIRAJ subscription</p>
      </div>

      {/* ── Expiry alert ── */}
      {isExpired && (
        <div className="flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-500/[0.06] px-4 py-3.5">
          <AlertTriangle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-red-300">Subscription Expired</p>
            <p className="text-xs text-red-400/80 mt-0.5">
              Your access has expired. Complete the transfer below and contact us on WhatsApp to restore access.
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
            <p className="text-3xl font-bold text-white">{PRICE_SAR}</p>
            <p className="text-xs text-gray-500">SAR / month</p>
          </div>
        </div>

        <div className="pt-2 border-t border-white/[0.05] space-y-1.5">
          <div className="flex items-center gap-2 text-xs text-emerald-400">
            <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
            First month free — no credit card required
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-gray-600" />
            Manual payment via bank transfer
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-gray-600" />
            Confirm via WhatsApp — admin activates within 24 h
          </div>
        </div>
      </div>

      {/* ── Payment flow ── */}
      {showPaymentFlow && (
        <>
          {/* Step-by-step instructions */}
          <div className="rounded-2xl border border-white/[0.07] bg-[#0d1220] p-6 relative overflow-hidden">
            <div className="pointer-events-none absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-cyan-400/10 to-transparent" />

            <div className="flex items-center gap-2 mb-5">
              <div className="p-1.5 rounded-lg bg-cyan-400/10 border border-cyan-400/20">
                <Banknote className="h-4 w-4 text-cyan-400" />
              </div>
              <p className="text-sm font-semibold text-white">How to Subscribe</p>
            </div>

            <ol className="space-y-3">
              {[
                { n: 1, text: `Transfer ${PRICE_SAR} SAR to the IBAN below` },
                { n: 2, text: `Include your email (${safeEmail}) in the transfer note` },
                { n: 3, text: 'Click the WhatsApp button — we\'ll confirm your payment', highlight: true },
                { n: 4, text: 'Your account will be activated within 24 hours' },
              ].map(({ n, text, highlight }) => (
                <li key={n} className="flex items-start gap-3">
                  <span className={`flex-none h-5 w-5 rounded-full text-[10px] font-bold flex items-center justify-center mt-0.5 ${
                    highlight
                      ? 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-400'
                      : 'bg-white/[0.05] border border-white/[0.08] text-gray-500'
                  }`}>
                    {n}
                  </span>
                  <p className={`text-sm leading-relaxed ${highlight ? 'text-emerald-300 font-medium' : 'text-gray-400'}`}>
                    {text}
                    {highlight && (
                      <span className="ml-2 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-500/20 text-emerald-400">
                        <Zap className="h-2.5 w-2.5" />
                        Fastest
                      </span>
                    )}
                  </p>
                </li>
              ))}
            </ol>
          </div>

          {/* Bank details */}
          <div className="rounded-2xl border border-white/[0.07] bg-[#0d1220] overflow-hidden">

            {/* WhatsApp row — highlighted as primary */}
            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-4 px-5 py-4 bg-emerald-500/[0.06] border-b border-emerald-500/15 hover:bg-emerald-500/10 transition-colors group"
            >
              <div className="p-2 rounded-xl bg-emerald-500/15 border border-emerald-500/25 shrink-0">
                <MessageCircle className="h-4.5 w-4.5 text-emerald-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">WhatsApp Contact</p>
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-500/20 text-emerald-400">
                    <Zap className="h-2.5 w-2.5" />
                    Fastest approval
                  </span>
                </div>
                <p className="text-sm font-mono text-white mt-0.5 group-hover:text-emerald-300 transition-colors">
                  0552488556
                </p>
              </div>
              <div className="shrink-0 flex items-center gap-1.5 text-xs text-emerald-400 font-semibold group-hover:text-emerald-300 transition-colors">
                <MessageCircle className="h-3.5 w-3.5" />
                Open Chat
              </div>
            </a>

            {/* IBAN + Bank rows */}
            <div className="divide-y divide-white/[0.04] px-5">

              <div className="flex items-start gap-3 py-3.5">
                <div className="p-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06] shrink-0 mt-0.5">
                  <Building className="h-3.5 w-3.5 text-gray-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] text-gray-500 uppercase tracking-wider font-semibold">IBAN</p>
                  <div className="flex items-center gap-1 mt-0.5 flex-wrap">
                    <p className="text-sm text-gray-200 font-mono">{IBAN}</p>
                    <CopyBtn value={IBAN} label="IBAN" />
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 py-3.5">
                <div className="p-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06] shrink-0 mt-0.5">
                  <Banknote className="h-3.5 w-3.5 text-gray-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] text-gray-500 uppercase tracking-wider font-semibold">Bank</p>
                  <p className="text-sm text-gray-200 font-mono mt-0.5">{BANK}</p>
                </div>
              </div>

              <div className="flex items-start gap-3 py-3.5">
                <div className="p-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06] shrink-0 mt-0.5">
                  <CreditCard className="h-3.5 w-3.5 text-gray-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] text-gray-500 uppercase tracking-wider font-semibold">Transfer Note</p>
                  <div className="flex items-center gap-1 mt-0.5 flex-wrap">
                    <p className="text-sm text-gray-200 font-mono">{safeEmail}</p>
                    <CopyBtn value={safeEmail} label="Email" />
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Primary action */}
          <div className="rounded-2xl border border-white/[0.07] bg-[#0d1220] p-6 space-y-4">
            <div>
              <p className="text-sm font-semibold text-white">Confirm Your Payment</p>
              <p className="text-xs text-gray-500 mt-1">
                After completing the bank transfer, click the button below to open WhatsApp — your payment request will also be logged automatically.
              </p>
            </div>

            {/* Trust line */}
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Users className="h-3.5 w-3.5 text-gray-600 shrink-0" />
              Most users get activated in less than 2 hours
            </div>

            {submitted ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3 rounded-xl border border-emerald-500/25 bg-emerald-500/[0.06] px-4 py-3.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-emerald-300">Request submitted!</p>
                    <p className="text-xs text-emerald-400/70 mt-0.5">
                      Your payment request has been logged. Once approved by admin, click the button below to activate your access immediately.
                    </p>
                  </div>
                </div>

                {/* Activation check — lets user unlock access the moment admin approves */}
                <button
                  onClick={handleCheckActivation}
                  disabled={checking || checkResult === 'activated'}
                  className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-95 text-white text-sm font-semibold transition-all disabled:opacity-60 shadow-lg shadow-blue-600/20"
                >
                  {checking
                    ? <><Loader2 className="h-4 w-4 animate-spin" />Checking…</>
                    : checkResult === 'activated'
                    ? <><CheckCircle2 className="h-4 w-4" />Activated! Reloading…</>
                    : <><RefreshCw className="h-4 w-4" />Check if my account is activated</>
                  }
                </button>

                {checkResult === 'pending' && (
                  <p className="text-xs text-amber-400/80 text-center">
                    Not yet activated — please wait for admin approval, then check again.
                  </p>
                )}

                <a
                  href={waLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/[0.08] hover:bg-emerald-500/15 active:scale-95 text-emerald-300 text-sm font-semibold transition-all"
                >
                  <MessageCircle className="h-4 w-4" />
                  Open WhatsApp Chat
                </a>
              </div>
            ) : lastRequest?.status === 'rejected' ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3 rounded-xl border border-red-500/25 bg-red-500/[0.06] px-4 py-3.5">
                  <XCircle className="h-4 w-4 text-red-400 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-red-300">Previous request rejected</p>
                    <p className="text-xs text-red-400/70 mt-0.5">
                      Please verify your transfer and contact us on WhatsApp to resolve this.
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleWaSubmit}
                  disabled={submitting}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-sm font-semibold transition-all disabled:opacity-60 shadow-lg shadow-emerald-600/20"
                >
                  {submitting
                    ? <Loader2 className="h-4 w-4 animate-spin" />
                    : <RefreshCw className="h-4 w-4" />}
                  Try Again via WhatsApp
                </button>
              </div>
            ) : (
              <button
                onClick={handleWaSubmit}
                disabled={submitting}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 active:scale-95 text-white text-sm font-semibold transition-all disabled:opacity-60 shadow-lg shadow-emerald-600/25"
              >
                {submitting
                  ? <Loader2 className="h-4 w-4 animate-spin" />
                  : <MessageCircle className="h-4 w-4" />}
                I have paid — Contact via WhatsApp
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </>
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
