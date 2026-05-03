'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { MessageCircle, Loader2, ArrowRight, CheckCircle2, Zap } from 'lucide-react'
import { toast } from '@/components/Toast'
import { submitPaymentRequest } from '@/app/billing/actions'

const WA_NUMBER = '966552488556'

function buildWaLink(email: string) {
  const msg = `I have paid. Email: ${email}`
  return `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(msg)}`
}

interface Props {
  email: string | null   // null = not logged in
}

export function PricingCTA({ email }: Props) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone]             = useState(false)

  function handleClick() {
    // Not logged in → send to login, then back to /pricing after auth
    if (!email) {
      router.push('/login?next=/pricing')
      return
    }

    // Open WhatsApp immediately (must be synchronous to avoid popup blockers)
    window.open(buildWaLink(email), '_blank', 'noopener,noreferrer')

    if (done) return   // already submitted — WhatsApp open is enough

    setSubmitting(true)
    startTransition(async () => {
      const result = await submitPaymentRequest()
      if (result.ok) {
        setDone(true)
        toast.success('Payment request sent. Waiting for admin approval.')
      } else if (result.error?.toLowerCase().includes('pending')) {
        // Duplicate — silently mark as done
        setDone(true)
      } else {
        toast.error(result.error)
      }
      setSubmitting(false)
    })
  }

  if (done) {
    return (
      <div className="space-y-4">
        <div className="flex items-start gap-3 rounded-xl border border-emerald-500/25 bg-emerald-500/[0.06] px-4 py-3.5">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-emerald-300">Request submitted!</p>
            <p className="text-xs text-emerald-400/70 mt-0.5">
              Your payment request has been logged. We&apos;ll activate your account after confirming your transfer — usually within 2 hours.
            </p>
          </div>
        </div>

        {/* Let them re-open WhatsApp in case they closed it */}
        <button
          onClick={handleClick}
          className="inline-flex items-center gap-2 text-sm text-emerald-400 hover:text-emerald-300 font-medium transition-colors"
        >
          <MessageCircle className="h-4 w-4" />
          Re-open WhatsApp chat
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <button
        onClick={handleClick}
        disabled={submitting}
        className="w-full inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 active:scale-[0.98] text-white text-sm font-semibold transition-all disabled:opacity-60 shadow-lg shadow-emerald-600/20"
      >
        {submitting
          ? <Loader2 className="h-4 w-4 animate-spin" />
          : <MessageCircle className="h-4 w-4" />}
        {email ? 'I have paid — Contact via WhatsApp' : 'Sign in to subscribe'}
        {!submitting && <ArrowRight className="h-3.5 w-3.5" />}
      </button>

      <div className="flex items-center justify-center gap-1.5 text-xs text-gray-500">
        <Zap className="h-3 w-3 text-amber-400" />
        Fastest approval via WhatsApp — most users activated in under 2 hours
      </div>
    </div>
  )
}
