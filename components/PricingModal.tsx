'use client'

import { useEffect, useState } from 'react'
import {
  X, Crown, Check, Zap, BarChart3, GitCompare, Brain,
  Shield, Bell, FileSignature, Sparkles, Star,
} from 'lucide-react'
import { toast } from '@/components/Toast'

const FREE_FEATURES = [
  { text: 'Up to 10 RFQs per month' },
  { text: 'Unlimited suppliers' },
  { text: 'Basic contract management' },
  { text: 'Email notifications' },
  { text: 'Standard response collection' },
]

const PRO_FEATURES = [
  { icon: Brain,       text: 'AI-powered supplier insights',      highlight: true },
  { icon: BarChart3,   text: 'Advanced analytics & charts',       highlight: true },
  { icon: GitCompare,  text: 'Side-by-side supplier comparisons', highlight: true },
  { icon: Zap,         text: 'Unlimited RFQs',                   highlight: false },
  { icon: FileSignature, text: 'Priority contract AI scoring',   highlight: false },
  { icon: Bell,        text: 'Real-time notifications',           highlight: false },
  { icon: Shield,      text: 'Priority support',                  highlight: false },
]

interface Props {
  onClose: () => void
  autoOpen?: boolean
}

export function PricingModal({ onClose }: Props) {
  const [billing, setBilling] = useState<'monthly' | 'annual'>('monthly')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  function handleUpgrade() {
    setLoading(true)
    // Simulate async upgrade flow (replace with Stripe/Paddle integration)
    setTimeout(() => {
      setLoading(false)
      toast.success('Upgrade initiated — check your email to complete payment.')
      onClose()
    }, 1200)
  }

  const monthlyPrice = billing === 'monthly' ? 29 : 24
  const annualTotal  = monthlyPrice * 12

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl bg-[#0a0f1a] border border-white/[0.08] rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header gradient */}
        <div className="pointer-events-none absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-violet-500/40 to-transparent" />
        <div className="pointer-events-none absolute -top-20 left-1/2 -translate-x-1/2 h-40 w-60 rounded-full bg-violet-500/10 blur-3xl" />

        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-lg text-gray-500 hover:text-white hover:bg-white/[0.07] transition-all z-10"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="relative p-8">

          {/* Title */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-violet-400 bg-violet-500/10 border border-violet-500/20 px-3 py-1.5 rounded-full mb-3">
              <Sparkles className="h-3 w-3" />
              Upgrade to Pro
            </div>
            <h2 className="text-2xl font-bold text-white">Unlock the Full Power of SIRAJ</h2>
            <p className="text-gray-400 mt-2 text-sm">Everything in Free, plus AI insights and advanced tools</p>

            {/* Billing toggle */}
            <div className="flex items-center justify-center gap-3 mt-5">
              <button
                onClick={() => setBilling('monthly')}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  billing === 'monthly'
                    ? 'bg-white/[0.08] text-white border border-white/[0.12]'
                    : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBilling('annual')}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  billing === 'annual'
                    ? 'bg-white/[0.08] text-white border border-white/[0.12]'
                    : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                Annual
                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded-full">
                  SAVE 17%
                </span>
              </button>
            </div>
          </div>

          {/* Plans grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* Free */}
            <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-6 space-y-4">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Free</p>
                <div className="flex items-baseline gap-1 mt-2">
                  <span className="text-3xl font-bold text-white">$0</span>
                  <span className="text-sm text-gray-500">/month</span>
                </div>
                <p className="text-xs text-gray-600 mt-1">No credit card required</p>
              </div>
              <div className="space-y-2.5">
                {FREE_FEATURES.map(({ text }) => (
                  <div key={text} className="flex items-start gap-2.5">
                    <Check className="h-3.5 w-3.5 text-gray-500 mt-0.5 shrink-0" />
                    <span className="text-sm text-gray-400">{text}</span>
                  </div>
                ))}
              </div>
              <button
                disabled
                className="w-full py-2.5 rounded-xl border border-white/[0.08] text-sm font-medium text-gray-500 cursor-not-allowed"
              >
                Current Plan
              </button>
            </div>

            {/* Pro */}
            <div className="rounded-2xl border border-violet-500/30 bg-gradient-to-br from-violet-950/50 to-blue-950/30 p-6 space-y-4 relative overflow-hidden">
              <div className="pointer-events-none absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-violet-400/30 to-transparent" />

              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-semibold text-violet-400 uppercase tracking-wider">Pro</p>
                    <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest text-amber-400 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded-full">
                      <Star className="h-2 w-2" />
                      Popular
                    </span>
                  </div>
                  <div className="flex items-baseline gap-1 mt-2">
                    <span className="text-3xl font-bold text-white">${monthlyPrice}</span>
                    <span className="text-sm text-gray-400">/month</span>
                  </div>
                  {billing === 'annual' && (
                    <p className="text-xs text-emerald-400 mt-1">Billed ${annualTotal}/year</p>
                  )}
                </div>
                <Crown className="h-5 w-5 text-violet-400 mt-1" />
              </div>

              <div className="space-y-2.5">
                {PRO_FEATURES.map(({ icon: Icon, text, highlight }) => (
                  <div key={text} className="flex items-start gap-2.5">
                    <div className={`mt-0.5 shrink-0 ${highlight ? 'text-violet-400' : 'text-gray-400'}`}>
                      {highlight
                        ? <Icon className="h-3.5 w-3.5" />
                        : <Check className="h-3.5 w-3.5" />
                      }
                    </div>
                    <span className={`text-sm ${highlight ? 'text-gray-200 font-medium' : 'text-gray-400'}`}>
                      {text}
                    </span>
                  </div>
                ))}
              </div>

              <button
                onClick={handleUpgrade}
                disabled={loading}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 text-white text-sm font-semibold shadow-lg shadow-violet-600/30 transition-all active:scale-[0.98] disabled:opacity-70 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                    </svg>
                    Processing...
                  </>
                ) : (
                  <>
                    <Crown className="h-4 w-4" />
                    Upgrade Now
                  </>
                )}
              </button>
            </div>
          </div>

          <p className="text-center text-xs text-gray-600 mt-4">
            Secure payment · Cancel anytime · Instant activation
          </p>
        </div>
      </div>
    </div>
  )
}

// ── UpgradePrompt — auto-opens modal when ?upgrade=1 is in URL ──────────────────

export function UpgradePrompt() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('upgrade') === '1') {
      setOpen(true)
      // Clean URL without reload
      const url = new URL(window.location.href)
      url.searchParams.delete('upgrade')
      window.history.replaceState({}, '', url.toString())
    }
  }, [])

  if (!open) return null
  return <PricingModal onClose={() => setOpen(false)} />
}
