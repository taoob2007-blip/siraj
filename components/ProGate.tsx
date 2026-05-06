'use client'

import { useRouter } from 'next/navigation'
import { Crown, Sparkles, Check, Zap, BarChart3, GitCompare, Brain } from 'lucide-react'

// ── Paywall overlay ───────────────────────────────────────────────────────────
// Blurs content and shows upgrade prompt. Clicking navigates to /pricing —
// no local modal state so multiple ProGate components can't stack modals.

function PaywallOverlay({ feature }: { feature?: string }) {
  const router = useRouter()

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-[#080c14]/75 backdrop-blur-[2px] z-10 rounded-2xl">
      <div className="flex flex-col items-center gap-3 text-center px-6">
        <div className="p-3 rounded-2xl bg-cyan-400/10 border border-cyan-400/20">
          <Crown className="h-6 w-6 text-cyan-400" />
        </div>
        <div>
          <div className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-cyan-400 bg-cyan-400/10 border border-cyan-400/20 px-2.5 py-1 rounded-full mb-2">
            <Sparkles className="h-2.5 w-2.5" />
            ميزة Pro
          </div>
          <p className="text-sm font-semibold text-white">
            {feature ?? 'هذه الميزة'} تتطلب اشتراكاً Pro
          </p>
          <p className="text-xs text-gray-400 mt-1 leading-relaxed max-w-[200px] mx-auto">
            قم بالترقية لفتح تحليلات الذكاء الاصطناعي والتقارير المتقدمة والمزيد.
          </p>
        </div>
        <button
          onClick={() => router.push('/pricing')}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-black text-sm font-semibold shadow-lg shadow-cyan-400/20 transition-all active:scale-95"
        >
          <Crown className="h-3.5 w-3.5" />
          اشترك الآن — 299 ر.س/شهر
        </button>
      </div>
    </div>
  )
}

// ── ProGate ───────────────────────────────────────────────────────────────────

interface ProGateProps {
  isPro:        boolean
  children:     React.ReactNode
  feature?:     string
  placeholder?: React.ReactNode
  className?:   string
}

export function ProGate({ isPro, children, feature, placeholder, className }: ProGateProps) {
  if (isPro) return <>{children}</>

  return (
    <div className={['relative rounded-2xl overflow-hidden', className].filter(Boolean).join(' ')}>
      <div className="blur-sm opacity-50 pointer-events-none select-none" aria-hidden>
        {placeholder ?? children}
      </div>
      <PaywallOverlay feature={feature} />
    </div>
  )
}

// ── UpgradeCard ───────────────────────────────────────────────────────────────

interface UpgradeCardProps {
  title?:       string
  description?: string
  compact?:     boolean
}

export function UpgradeCard({
  title       = 'افتح ميزات Pro',
  description = 'احصل على تحليلات الذكاء الاصطناعي والتقارير المتقدمة ومقارنة الموردين والمزيد.',
  compact     = false,
}: UpgradeCardProps) {
  const router = useRouter()

  const FEATURES = [
    { icon: Brain,      label: 'تحليلات AI وتوصيات ذكية' },
    { icon: BarChart3,  label: 'تقارير وتحليلات متقدمة' },
    { icon: GitCompare, label: 'مقارنة الموردين' },
    { icon: Zap,        label: 'تسجيل عقود بالأولوية' },
  ]

  return (
    <div className={`rounded-2xl border border-white/[0.06] bg-gradient-to-br from-[#0d1220] to-[#0a0f18] ${compact ? 'p-4' : 'p-6'} relative overflow-hidden`}>
      <div className="pointer-events-none absolute -top-12 -right-12 h-32 w-32 rounded-full bg-cyan-400/5 blur-3xl" />
      <div className="pointer-events-none absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-cyan-400/10 to-transparent" />

      <div className="relative flex items-start gap-4">
        <div className={`shrink-0 ${compact ? 'p-2' : 'p-2.5'} rounded-xl bg-cyan-400/10 border border-cyan-400/20`}>
          <Crown className={`${compact ? 'h-4 w-4' : 'h-5 w-5'} text-cyan-400`} />
        </div>
        <div className="flex-1 min-w-0">
          <p className={`font-semibold text-white ${compact ? 'text-sm' : 'text-base'}`}>{title}</p>
          <p className={`text-gray-400 mt-0.5 leading-relaxed ${compact ? 'text-xs' : 'text-sm'}`}>{description}</p>

          {!compact && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 mt-3">
              {FEATURES.map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-1.5 text-xs text-gray-400">
                  <Check className="h-3 w-3 text-cyan-400 shrink-0" />
                  {label}
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center gap-3 mt-3">
            <button
              onClick={() => router.push('/pricing')}
              className={`flex items-center gap-2 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-black font-semibold shadow-lg shadow-cyan-400/20 transition-all active:scale-95 ${compact ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-sm'}`}
            >
              <Crown className="h-3.5 w-3.5" />
              اشترك الآن
            </button>
            {!compact && (
              <span className="text-xs text-gray-600">299 ر.س / شهر · الشهر الأول مجاناً</span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── ProBadge ──────────────────────────────────────────────────────────────────

export function ProBadge() {
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-cyan-400 bg-cyan-400/10 border border-cyan-400/20 px-2 py-0.5 rounded-full">
      <Crown className="h-2.5 w-2.5" />
      Pro
    </span>
  )
}
