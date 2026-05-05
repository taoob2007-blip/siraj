'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Plus, ArrowLeft } from 'lucide-react'
import { CountUp } from '@/components/DashboardShell'

/* ── Fade-up on mount ───────────────────────────────────────── */
function FadeUp({
  children,
  delay = 0,
  className = '',
}: {
  children: React.ReactNode
  delay?: number
  className?: string
}) {
  const [vis, setVis] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setVis(true), delay)
    return () => clearTimeout(t)
  }, [delay])

  return (
    <div
      className={className}
      style={{
        opacity:    vis ? 1 : 0,
        transform:  vis ? 'translateY(0)' : 'translateY(12px)',
        transition: 'opacity 500ms ease, transform 500ms ease',
      }}
    >
      {children}
    </div>
  )
}

/* ── Stat item ──────────────────────────────────────────────── */
function Stat({ value, label, colorCls }: { value: number; label: string; colorCls: string }) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <span className={`text-2xl md:text-3xl font-bold tabular-nums leading-none ${colorCls}`}>
        <CountUp value={value} />
      </span>
      <span className="text-[11px] text-gray-500 whitespace-nowrap">{label}</span>
    </div>
  )
}

/* ── Hero Banner ────────────────────────────────────────────── */
export function HeroBanner({
  total,
  active,
  resCount,
}: {
  total: number
  active: number
  resCount: number
}) {
  return (
    <div
      className="relative overflow-hidden rounded-3xl border border-white/[0.07] px-6 py-16 md:py-24"
      style={{ background: '#0A0F1B' }}
    >

      {/* ── Subtle background glow — barely perceptible ──────── */}
      <div className="pointer-events-none absolute inset-0">
        {/* top-left */}
        <div className="absolute -top-40 -left-40 h-[420px] w-[420px] rounded-full bg-blue-700/[0.06] blur-3xl" />
        {/* bottom-right */}
        <div className="absolute -bottom-40 -right-40 h-[420px] w-[420px] rounded-full bg-indigo-700/[0.06] blur-3xl" />
        {/* center — very faint cyan */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[360px] w-[360px] rounded-full bg-cyan-600/[0.04] blur-3xl" />
      </div>

      {/* ── Top edge line ────────────────────────────────────── */}
      <div className="pointer-events-none absolute top-0 left-16 right-16 h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />

      {/* ── Content ─────────────────────────────────────────── */}
      <div className="relative flex flex-col items-center text-center gap-0" dir="rtl">

        {/* Logo ────────────────────────────────────────────── */}
        <FadeUp delay={0}>
          <Image
            src="/logo.png"
            alt="SIRAJ"
            width={380}
            height={110}
            priority
            draggable={false}
            className="w-[200px] md:w-[270px] lg:w-[320px] h-auto object-contain select-none"
          />
        </FadeUp>

        {/* Headline ───────────────────────────────────────── */}
        <FadeUp delay={120} className="mt-10">
          <h1
            className="font-bold text-white"
            style={{
              fontSize:      'clamp(1.7rem, 4.2vw, 2.9rem)',
              lineHeight:    1.3,
              letterSpacing: '-0.01em',
            }}
          >
            اتخذ قرارات الشراء
            <br />
            <span className="text-cyan-400">خلال دقائق بدل أيام</span>
          </h1>
        </FadeUp>

        {/* Subtext ────────────────────────────────────────── */}
        <FadeUp delay={220} className="mt-5">
          <p
            className="text-[15px] md:text-[16px] text-gray-300 leading-relaxed mx-auto"
            style={{ maxWidth: '40ch' }}
          >
            قارن العروض، اختر الأفضل، ووفّر التكاليف — بدون تعقيد
          </p>
        </FadeUp>

        {/* CTA ────────────────────────────────────────────── */}
        <FadeUp delay={320} className="mt-9">
          <div className="flex items-center justify-center gap-3 flex-wrap">

            {/* Primary — solid cyan, clean hover */}
            <Link href="/rfqs/new">
              <button
                className="
                  inline-flex items-center justify-center gap-2
                  px-7 py-3 rounded-xl
                  bg-cyan-400 hover:bg-cyan-300
                  text-[#0A0F1B] text-[14.5px] font-semibold
                  transition-transform duration-200 hover:scale-[1.03] active:scale-[0.97]
                  w-[148px]
                "
              >
                <Plus className="h-4 w-4 flex-shrink-0" />
                إنشاء طلب
              </button>
            </Link>

            {/* Secondary — ghost border */}
            <Link href="/rfqs">
              <button
                className="
                  inline-flex items-center justify-center gap-2
                  px-7 py-3 rounded-xl
                  border border-white/[0.14] bg-white/[0.03]
                  hover:bg-white/[0.06] hover:border-white/[0.22]
                  text-gray-300 text-[14.5px] font-medium
                  transition-all duration-200 hover:scale-[1.02] active:scale-[0.97]
                  whitespace-nowrap
                "
              >
                عرض الطلبات
                <ArrowLeft className="h-4 w-4 flex-shrink-0" />
              </button>
            </Link>

          </div>
        </FadeUp>

        {/* Stats ──────────────────────────────────────────── */}
        <FadeUp delay={420} className="mt-10 w-full max-w-xs">
          <div className="flex items-center justify-center pt-7 border-t border-white/[0.06]">
            <div className="flex-1">
              <Stat value={total}    label="إجمالي الطلبات" colorCls="text-white" />
            </div>
            <div className="w-px h-9 bg-white/[0.07] flex-shrink-0" />
            <div className="flex-1">
              <Stat value={active}   label="نشطة الآن"      colorCls="text-cyan-400" />
            </div>
            <div className="w-px h-9 bg-white/[0.07] flex-shrink-0" />
            <div className="flex-1">
              <Stat value={resCount} label="عروض مستلمة"    colorCls="text-violet-400" />
            </div>
          </div>
        </FadeUp>

      </div>
    </div>
  )
}
