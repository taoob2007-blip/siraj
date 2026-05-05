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
        transform: vis ? 'translateY(0)' : 'translateY(18px)',
        transition: 'opacity 700ms ease, transform 700ms ease',
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
      <span className="text-[11px] text-gray-400 whitespace-nowrap">{label}</span>
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
    <div className="relative overflow-hidden rounded-3xl border border-white/[0.06] px-6 py-24 md:py-32">

      {/* 🔥 Background */}
      <div className="absolute inset-0">
        <img
          src="/hero-banner.jpg"
          className="w-full h-full object-cover scale-105"
          alt=""
        />
      </div>

      {/* ✨ Gradient (ذكي مو قاتل) */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0A0F1B]/10 via-[#0A0F1B]/30 to-[#0A0F1B]/85" />

      {/* ✨ Light Glow Dynamic */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-[-120px] left-[-120px] w-[500px] h-[500px] bg-cyan-400/10 blur-3xl rounded-full animate-pulse" />
        <div className="absolute bottom-[-120px] right-[-100px] w-[400px] h-[400px] bg-indigo-500/10 blur-3xl rounded-full animate-pulse" />
      </div>

      {/* ✨ Noise subtle (احترافية) */}
      <div className="absolute inset-0 opacity-[0.04] mix-blend-overlay pointer-events-none"
           style={{ backgroundImage: 'url("https://grainy-gradients.vercel.app/noise.svg")' }} />

      {/* CONTENT */}
      <div className="relative z-10 flex flex-col items-center text-center pt-16 md:pt-20" dir="rtl">

        {/* Headline */}
        <FadeUp delay={100}>
          <h1
            className="font-bold text-white"
            style={{
              fontSize: 'clamp(1.6rem, 3.5vw, 2.7rem)',
              lineHeight: 1.35,
              letterSpacing: '-0.01em',
              textShadow: '0 10px 40px rgba(0,0,0,0.6)',
            }}
          >
            اتخذ قرارات الشراء
            <br />
            <span className="text-cyan-400">خلال دقائق بدل أيام</span>
          </h1>
        </FadeUp>

        {/* Subtext */}
        <FadeUp delay={200} className="mt-6">
          <p className="text-[15px] md:text-[16px] text-gray-200 max-w-[42ch]"
             style={{ textShadow: '0 4px 20px rgba(0,0,0,0.5)' }}>
            قارن العروض، اختر الأفضل، ووفّر التكاليف — بدون تعقيد
          </p>
        </FadeUp>

        {/* Buttons */}
        <FadeUp delay={300} className="mt-10">
          <div className="flex items-center justify-center gap-4 flex-wrap">

            <Link href="/rfqs/new">
              <button className="px-8 py-3.5 rounded-xl bg-cyan-400 text-[#0A0F1B] font-semibold 
              shadow-[0_10px_40px_rgba(34,211,238,0.25)] 
              hover:scale-[1.06] hover:bg-cyan-300 transition-all duration-200">
                + إنشاء طلب
              </button>
            </Link>

            <Link href="/rfqs">
              <button className="px-8 py-3.5 rounded-xl border border-white/[0.2] text-white 
              hover:bg-white/[0.08] transition">
                عرض الطلبات ←
              </button>
            </Link>

          </div>
        </FadeUp>

        {/* Stats */}
        <FadeUp delay={400} className="mt-14 w-full max-w-sm">
          <div className="flex items-center justify-center pt-6 border-t border-white/[0.08] backdrop-blur-sm bg-white/[0.02] rounded-xl">
            <div className="flex-1">
              <Stat value={total} label="إجمالي الطلبات" colorCls="text-white" />
            </div>
            <div className="w-px h-10 bg-white/[0.08]" />
            <div className="flex-1">
              <Stat value={active} label="نشطة الآن" colorCls="text-cyan-400" />
            </div>
            <div className="w-px h-10 bg-white/[0.08]" />
            <div className="flex-1">
              <Stat value={resCount} label="عروض مستلمة" colorCls="text-violet-400" />
            </div>
          </div>
        </FadeUp>

      </div>
    </div>
  )
}