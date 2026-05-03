export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { getAuthUser, getServerSupabaseClient } from '@/lib/supabase/server'
import { checkAccess } from '@/lib/subscription'
import { PricingCTA } from '@/components/PricingCTA'
import {
  CheckCircle2, Zap, FileText, Users, BarChart2,
  GitCompare, FileSignature, MessageSquare, PieChart,
  Crown, ArrowRight,
} from 'lucide-react'

// ── Features list ─────────────────────────────────────────────────────────────

const FEATURES = [
  { icon: FileText,      label: 'Unlimited RFQs' },
  { icon: Users,         label: 'Unlimited suppliers' },
  { icon: Zap,           label: 'AI supplier scoring' },
  { icon: BarChart2,     label: 'Advanced analytics' },
  { icon: GitCompare,    label: 'Response comparisons' },
  { icon: FileSignature, label: 'Contract management' },
  { icon: MessageSquare, label: 'Supplier messaging' },
  { icon: PieChart,      label: 'Procurement reports' },
]

// ── Data fetching ─────────────────────────────────────────────────────────────

async function getUserContext() {
  try {
    const user = await getAuthUser()
    if (!user) return { email: null, isActive: false }

    const supabase = await getServerSupabaseClient()
    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_status, trial_ends_at, subscription_ends_at')
      .eq('id', user.id)
      .single()

    const { allowed } = checkAccess(profile)
    return { email: user.email ?? null, isActive: allowed }
  } catch {
    return { email: null, isActive: false }
  }
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function PricingPage() {
  const { email, isActive } = await getUserContext()

  // Already subscribed — show a confirmation banner instead of upgrade CTA
  if (isActive) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center space-y-6">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-semibold">
          <CheckCircle2 className="h-4 w-4" />
          Subscription Active
        </div>
        <h1 className="text-3xl font-bold text-white">You&apos;re all set!</h1>
        <p className="text-gray-400">Your subscription is active. Head to the dashboard to get started.</p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-semibold transition-all shadow-lg shadow-blue-600/20"
        >
          Go to Dashboard <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto py-10 space-y-8">

      {/* ── Header ── */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/15 text-violet-300 text-xs font-semibold uppercase tracking-wider">
          <Crown className="h-3 w-3" />
          SIRAJ Pro
        </div>
        <h1 className="text-4xl font-bold text-white">
          Simple, transparent pricing
        </h1>
        <p className="text-gray-400 text-base max-w-md mx-auto leading-relaxed">
          Everything you need to run smarter procurement — one flat monthly price.
        </p>
      </div>

      {/* ── Plan card ── */}
      <div className="rounded-2xl border border-white/[0.10] bg-[#0d1220] overflow-hidden relative">
        {/* Top gradient line */}
        <div className="h-px bg-gradient-to-r from-transparent via-blue-500/40 to-transparent" />

        {/* Glow */}
        <div className="pointer-events-none absolute -top-12 left-1/2 -translate-x-1/2 h-32 w-64 rounded-full bg-blue-500/10 blur-3xl" />

        <div className="relative p-8 space-y-8">

          {/* Price */}
          <div className="flex items-end justify-between">
            <div>
              <div className="flex items-baseline gap-1">
                <span className="text-5xl font-bold text-white">299</span>
                <span className="text-xl text-gray-400 font-medium">SAR</span>
                <span className="text-sm text-gray-500 ml-1">/ month</span>
              </div>
              <p className="text-sm text-emerald-400 font-medium mt-1.5 flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                First month free — start your trial today
              </p>
            </div>
            <div className="text-right hidden sm:block">
              <p className="text-xs text-gray-600 uppercase tracking-wider font-semibold">Billed monthly</p>
              <p className="text-xs text-gray-600 mt-0.5">Cancel anytime</p>
            </div>
          </div>

          {/* Features grid */}
          <div className="grid grid-cols-2 gap-x-6 gap-y-3">
            {FEATURES.map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-2.5">
                <div className="shrink-0 h-5 w-5 rounded-md bg-blue-500/10 border border-blue-500/15 flex items-center justify-center">
                  <Icon className="h-3 w-3 text-blue-400" />
                </div>
                <span className="text-sm text-gray-300">{label}</span>
              </div>
            ))}
          </div>

          {/* Divider */}
          <div className="h-px bg-white/[0.06]" />

          {/* CTA — client component handles auth state + DB insert + WhatsApp */}
          <PricingCTA email={email} />

          {/* Trust signals */}
          <div className="grid grid-cols-3 gap-4 pt-2">
            {[
              { value: '< 2 hrs', label: 'Avg. activation time' },
              { value: 'Manual', label: 'Bank transfer payment' },
              { value: '24/7', label: 'WhatsApp support' },
            ].map(({ value, label }) => (
              <div key={label} className="text-center">
                <p className="text-sm font-bold text-white">{value}</p>
                <p className="text-[11px] text-gray-600 mt-0.5">{label}</p>
              </div>
            ))}
          </div>

        </div>
      </div>

      {/* ── How to pay ── */}
      <div className="rounded-2xl border border-white/[0.07] bg-[#0d1220] p-6 space-y-4">
        <h2 className="text-sm font-semibold text-white">How payment works</h2>
        <ol className="space-y-3">
          {[
            'Transfer 299 SAR to IBAN: SA27 8000 0523 6080 1012 5902 (Al Rajhi Bank)',
            'Include your email address in the transfer note',
            'Click the button above — WhatsApp opens with a prefilled message',
            'Admin confirms your payment and activates your account within 24 hours',
          ].map((step, i) => (
            <li key={i} className="flex items-start gap-3">
              <span className="flex-none h-5 w-5 rounded-full bg-white/[0.05] border border-white/[0.08] text-[10px] font-bold text-gray-500 flex items-center justify-center mt-0.5">
                {i + 1}
              </span>
              <p className="text-sm text-gray-400 leading-relaxed">{step}</p>
            </li>
          ))}
        </ol>
      </div>

      {/* ── Footer links ── */}
      <p className="text-center text-xs text-gray-600">
        {email ? (
          <>
            Signed in as <span className="text-gray-400">{email}</span> ·{' '}
            <Link href="/billing" className="text-blue-400 hover:underline">View payment history</Link>
          </>
        ) : (
          <>
            Already have an account?{' '}
            <Link href="/login" className="text-blue-400 hover:underline">Sign in</Link>
          </>
        )}
      </p>

    </div>
  )
}
