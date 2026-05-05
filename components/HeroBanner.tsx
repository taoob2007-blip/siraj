'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { CountUp } from '@/components/DashboardShell'

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
        opacity: vis ? 1 : 0,
        transform: vis ? 'translateY(0)' : 'translateY(12px)',
        transition: 'opacity 500ms ease, transform 500ms ease',
      }}
    >
      {children}
    </div>
  )
}

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
      className="relative overflow-hidden rounded-3xl border border-white/[0.07] px-6 py-16 md:py-24 bg-cover bg-center"
      style={{
        backgroundImage: "url('/hero-banner.jpg')",
        backgroundColor: '#0A0F1B',
      }}
    >

      {/* Overlay (مهم عشان وضوح النص) */}
      <div className="absolute inset-0 bg-[#0A0F1B]/70 backdrop-blur-[1px]" />

      {/* Glow خفيف */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 -left-40 h-[420px] w-[420px] rounded-full bg-blue-700/[0.05] blur-3xl" />
        <div className="absolute -bottom-40 -right-40 h-[420px] w-[420px] rounded-full bg-indigo-700/[0.05] blur-3xl" />
      </div>

      <div className="pointer-events-none absolute top-0 left-16 right-16 h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />

      {/* CONTENT */}
      <div className="relative z-10 flex flex-col items-center text-center gap-0" dir="rtl">

        {/* HEADLINE */}
        <FadeUp delay={120}>
          <h1
            className="font-bold text-white"
            style={{
              fontSize: 'clamp(1.7rem, 4.2vw, 2.9rem)',
              lineHeight: 1.3,
              letterSpacing: '-0.01em',
            }}
          >
            اتخذ قرارات الشراء
            <br />
            <span className="text-cyan-400">خلال دقائق بدل أيام</span>
          </h1>
        </FadeUp>

        {/* SUBTEXT */}
        <FadeUp delay={220} className="mt-5">
          <p className="text-[15px] md:text-[16px] text-gray-300 leading-relaxed mx-auto max-w-[40ch]">
            قارن العروض، اختر الأفضل، ووفّر التكاليف — بدون تعقيد
          </p>
        </FadeUp>

        {/* BUTTONS */}
        <FadeUp delay={320} className="mt-9">
          <div className="flex items-center justify-center gap-3 flex-wrap">

            <Link href="/rfqs/new">
              <button className="px-7 py-3 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-[#0A0F1B] text-[14.5px] font-semibold transition-transform duration-200 hover:scale-[1.03]">
                + إنشاء طلب
              </button>
            </Link>

            <Link href="/rfqs">
              <button className="px-7 py-3 rounded-xl border border-white/[0.14] text-gray-300 hover:bg-white/[0.06]">
                عرض الطلبات ←
              </button>
            </Link>

          </div>
        </FadeUp>

        {/* STATS */}
        <FadeUp delay={420} className="mt-10 w-full max-w-xs">
          <div className="flex items-center justify-center pt-7 border-t border-white/[0.06]">
            <div className="flex-1">
              <Stat value={total} label="إجمالي الطلبات" colorCls="text-white" />
            </div>
            <div className="w-px h-9 bg-white/[0.07]" />
            <div className="flex-1">
              <Stat value={active} label="نشطة الآن" colorCls="text-cyan-400" />
            </div>
            <div className="w-px h-9 bg-white/[0.07]" />
            <div className="flex-1">
              <Stat value={resCount} label="عروض مستلمة" colorCls="text-violet-400" />
            </div>
          </div>
        </FadeUp>

      </div>
    </div>
  )
}