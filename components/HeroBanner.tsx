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
        transform: vis ? 'translateY(0)' : 'translateY(16px)',
        transition: 'opacity 600ms ease, transform 600ms ease',
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
      className="relative overflow-hidden rounded-3xl border border-white/[0.06] px-6 py-20 md:py-28"
      style={{ backgroundColor: '#0A0F1B' }}
    >

      {/* 🔥 Background Image (Parallax feel) */}
      <div
        className="absolute inset-0 bg-cover bg-center opacity-80"
        style={{
          backgroundImage: "url('/hero-banner.jpg')",
          transform: 'scale(1.05)',
        }}
      />

      {/* 🔥 Gradient overlay (خفيف جداً عشان اللوقو يبان) */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0A0F1B]/20 via-[#0A0F1B]/40 to-[#0A0F1B]/80" />

      {/* ✨ Moving light (إحساس حياة خفيف) */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute w-[500px] h-[500px] bg-cyan-400/10 blur-3xl rounded-full top-[-100px] left-[-120px] animate-pulse" />
        <div className="absolute w-[400px] h-[400px] bg-indigo-500/10 blur-3xl rounded-full bottom-[-120px] right-[-100px] animate-pulse" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center text-center pt-14 md:pt-20" dir="rtl">

        {/* Headline */}
        <FadeUp delay={100} className="mt-8">
          <h1
            className="font-bold text-white"
            style={{
              fontSize: 'clamp(1.6rem, 3.5vw, 2.6rem)',
              lineHeight: 1.35,
              letterSpacing: '-0.01em',
            }}
          >
            اتخذ قرارات الشراء
            <br />
            <span className="text-cyan-400">خلال دقائق بدل أيام</span>
          </h1>
        </FadeUp>

        {/* Subtext */}
        <FadeUp delay={200} className="mt-5">
          <p className="text-[15px] md:text-[16px] text-gray-300 leading-relaxed max-w-[42ch]">
            قارن العروض، اختر الأفضل، ووفّر التكاليف — بدون تعقيد
          </p>
        </FadeUp>

        {/* Buttons */}
        <FadeUp delay={300} className="mt-9">
          <div className="flex items-center justify-center gap-3 flex-wrap">

            <Link href="/rfqs/new">
              <button className="px-7 py-3 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-[#0A0F1B] font-semibold transition-all duration-200 hover:scale-[1.04] shadow-lg shadow-cyan-400/10">
                + إنشاء طلب
              </button>
            </Link>

            <Link href="/rfqs">
              <button className="px-7 py-3 rounded-xl border border-white/[0.15] text-gray-300 hover:bg-white/[0.06] transition">
                عرض الطلبات ←
              </button>
            </Link>

          </div>
        </FadeUp>

        {/* Stats */}
        <FadeUp delay={400} className="mt-12 w-full max-w-xs">
          <div className="flex items-center justify-center pt-6 border-t border-white/[0.06]">
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