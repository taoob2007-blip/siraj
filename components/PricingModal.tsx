'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  X, Crown, Check, Zap, BarChart3, GitCompare, Brain,
  Shield, Bell, FileSignature, Sparkles, Star, MessageCircle,
} from 'lucide-react'

// ── Plan data ─────────────────────────────────────────────────────────────────

const FREE_FEATURES = [
  'حتى 10 طلبات عروض شهرياً',
  'موردون غير محدودين',
  'إدارة عقود أساسية',
  'إشعارات بالبريد الإلكتروني',
  'جمع العروض القياسي',
]

const PRO_FEATURES = [
  { icon: Brain,         text: 'تحليل الموردين بالذكاء الاصطناعي', highlight: true },
  { icon: BarChart3,     text: 'تقارير وتحليلات متقدمة',           highlight: true },
  { icon: GitCompare,    text: 'مقارنة الموردين جنبًا إلى جنب',    highlight: true },
  { icon: Zap,           text: 'طلبات عروض غير محدودة',            highlight: false },
  { icon: FileSignature, text: 'تسجيل عقود بالذكاء الاصطناعي',    highlight: false },
  { icon: Bell,          text: 'إشعارات فورية',                    highlight: false },
  { icon: Shield,        text: 'دعم أولوية',                       highlight: false },
]

// ── Modal ─────────────────────────────────────────────────────────────────────

interface Props { onClose: () => void }

export function PricingModal({ onClose }: Props) {
  const router  = useRouter()
  const [billing, setBilling] = useState<'monthly' | 'annual'>('monthly')

  // SAR prices
  const monthlyPrice = 299
  const annualPrice  = Math.round(monthlyPrice * 12 * 0.83)  // 17% off
  const displayPrice = billing === 'monthly' ? monthlyPrice : Math.round(annualPrice / 12)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  function handleSubscribe() {
    onClose()
    router.push('/pricing')
  }

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl bg-[#0a0f1a] border border-white/[0.08] rounded-2xl shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Decorative top line */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-violet-500/50 to-transparent" />
        <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 h-48 w-72 rounded-full bg-violet-500/10 blur-3xl" />

        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-lg text-gray-500 hover:text-white hover:bg-white/[0.07] transition-all z-10"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="relative p-6 sm:p-8">

          {/* Title */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-violet-400 bg-violet-500/10 border border-violet-500/20 px-3 py-1.5 rounded-full mb-3">
              <Sparkles className="h-3 w-3" />
              ترقية إلى Pro
            </div>
            <h2 className="text-2xl font-bold text-white">اكتشف كامل قدرات SIRAJ</h2>
            <p className="text-gray-400 mt-1.5 text-sm">كل ما في الخطة المجانية، بالإضافة إلى الذكاء الاصطناعي وأدوات متقدمة</p>

            {/* Billing toggle */}
            <div className="flex items-center justify-center gap-2 mt-4">
              <button
                onClick={() => setBilling('monthly')}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  billing === 'monthly'
                    ? 'bg-white/[0.08] text-white border border-white/[0.12]'
                    : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                شهري
              </button>
              <button
                onClick={() => setBilling('annual')}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  billing === 'annual'
                    ? 'bg-white/[0.08] text-white border border-white/[0.12]'
                    : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                سنوي
                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded-full">
                  وفّر 17%
                </span>
              </button>
            </div>
          </div>

          {/* Plans */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

            {/* Free */}
            <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5 space-y-4">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">مجاني</p>
                <div className="flex items-baseline gap-1 mt-2">
                  <span className="text-3xl font-bold text-white">0</span>
                  <span className="text-sm text-gray-400">ر.س / شهر</span>
                </div>
                <p className="text-xs text-gray-600 mt-1">بدون بطاقة ائتمانية</p>
              </div>
              <div className="space-y-2">
                {FREE_FEATURES.map(text => (
                  <div key={text} className="flex items-start gap-2">
                    <Check className="h-3.5 w-3.5 text-gray-600 mt-0.5 shrink-0" />
                    <span className="text-xs text-gray-500">{text}</span>
                  </div>
                ))}
              </div>
              <button
                disabled
                className="w-full py-2.5 rounded-xl border border-white/[0.07] text-xs font-medium text-gray-600 cursor-not-allowed"
              >
                الخطة الحالية
              </button>
            </div>

            {/* Pro */}
            <div className="rounded-2xl border border-violet-500/30 bg-gradient-to-br from-violet-950/60 to-blue-950/30 p-5 space-y-4 relative overflow-hidden">
              <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-violet-400/30 to-transparent" />

              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-semibold text-violet-400 uppercase tracking-wider">Pro</p>
                    <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest text-amber-400 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded-full">
                      <Star className="h-2 w-2" />
                      الأكثر شيوعاً
                    </span>
                  </div>
                  <div className="flex items-baseline gap-1.5 mt-2">
                    <span className="text-3xl font-bold text-white">{displayPrice}</span>
                    <span className="text-sm text-gray-400">ر.س / شهر</span>
                  </div>
                  {billing === 'annual'
                    ? <p className="text-xs text-emerald-400 mt-1">يُفوتر {annualPrice} ر.س / سنة</p>
                    : <p className="text-xs text-emerald-400 mt-1">الشهر الأول مجاناً ✓</p>
                  }
                </div>
                <Crown className="h-5 w-5 text-violet-400 mt-1 shrink-0" />
              </div>

              <div className="space-y-2">
                {PRO_FEATURES.map(({ icon: Icon, text, highlight }) => (
                  <div key={text} className="flex items-start gap-2">
                    <div className={`mt-0.5 shrink-0 ${highlight ? 'text-violet-400' : 'text-gray-500'}`}>
                      {highlight ? <Icon className="h-3.5 w-3.5" /> : <Check className="h-3.5 w-3.5" />}
                    </div>
                    <span className={`text-xs ${highlight ? 'text-gray-200 font-medium' : 'text-gray-400'}`}>
                      {text}
                    </span>
                  </div>
                ))}
              </div>

              <button
                onClick={handleSubscribe}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 text-white text-sm font-bold shadow-lg shadow-violet-600/30 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
              >
                <MessageCircle className="h-4 w-4" />
                اشترك الآن
              </button>
            </div>
          </div>

          <p className="text-center text-xs text-gray-600 mt-4">
            دفع آمن عبر تحويل بنكي · إلغاء في أي وقت · تفعيل فوري
          </p>
        </div>
      </div>
    </div>
  )
}

// UpgradePrompt — kept for backward compat but no longer auto-opens.
// All upgrade CTAs now navigate directly to /pricing.
export function UpgradePrompt() { return null }
