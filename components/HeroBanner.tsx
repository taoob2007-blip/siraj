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
      <span className={`text-2xl md:text-3xl font-bold ${colorCls}`}>
        <CountUp value={value} />
      </span>
      <span className="text-[11px] text-gray-400">{label}</span>
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
    <div className="relative overflow-hidden rounded-3xl border border-white/[0.06] px-6 py-24 md:py-28">

      {/* BACKGROUND */}
      <div className="absolute inset-0">
        <img
          src="/hero-banner.jpg"
          className="w-full h-full object-cover scale-105"
          alt=""
        />
      </div>

      <div className="absolute inset-0 bg-gradient-to-b from-[#0A0F1B]/10 via-[#0A0F1B]/30 to-[#0A0F1B]/85" />

      {/* Glow */}
      <div className="absolute inset-0">
        <div className="absolute top-[-120px] left-[-120px] w-[500px] h-[500px] bg-cyan-400/10 blur-3xl rounded-full animate-pulse" />
        <div className="absolute bottom-[-120px] right-[-100px] w-[400px] h-[400px] bg-indigo-500/10 blur-3xl rounded-full animate-pulse" />
      </div>

      {/* CONTENT */}
      <div className="relative z-10 max-w-4xl mx-auto flex flex-col items-center text-center" dir="rtl">

        {/* 🔥 TAG (جديد) */}
        <FadeUp delay={80}>
          <span className="text-cyan-400 text-sm tracking-wide mb-3">
            منصة إدارة المشتريات الذكية
          </span>
        </FadeUp>

        {/* 🔥 HEADLINE (أقوى) */}
        <FadeUp delay={120}>
          <h1
            className="font-bold text-white"
            style={{
              fontSize: 'clamp(1.8rem, 3.5vw, 2.8rem)',
              lineHeight: 1.4,
              letterSpacing: '-0.01em',
            }}
          >
            قرارات أسرع، نتائج أفضل
            <br />
            <span className="text-cyan-400">بدون تعقيد أو تأخير</span>
          </h1>
        </FadeUp>

        {/* 🔥 DESCRIPTION (معدلة) */}
        <FadeUp delay={200} className="mt-5">
          <p className="text-gray-300 max-w-[44ch] text-[15px] leading-relaxed">
            قارن عروض الموردين خلال دقائق، اختر الأفضل بثقة، واترك الذكاء الاصطناعي يختصر عليك الوقت والتكاليف.
          </p>
        </FadeUp>

        {/* 🔥 CTA + STATS (دمج احترافي) */}
        <FadeUp delay={300} className="mt-10 w-full">

          <div className="flex flex-col items-center gap-8">

            {/* Buttons */}
            <div className="flex gap-4 flex-wrap justify-center">

              <Link href="/rfqs/new">
                <button className="px-8 py-3.5 rounded-xl bg-cyan-400 text-[#0A0F1B] font-semibold 
                shadow-[0_10px_40px_rgba(34,211,238,0.25)] 
                hover:scale-[1.06] hover:bg-cyan-300 transition-all">
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

            {/* Stats Card */}
            <div className="flex items-center justify-center gap-6 px-6 py-4 rounded-2xl 
            bg-white/[0.03] backdrop-blur-md border border-white/[0.08]">

              <Stat value={total} label="إجمالي الطلبات" colorCls="text-white" />
              <div className="w-px h-10 bg-white/[0.1]" />
              <Stat value={active} label="نشطة الآن" colorCls="text-cyan-400" />
              <div className="w-px h-10 bg-white/[0.1]" />
              <Stat value={resCount} label="عروض مستلمة" colorCls="text-violet-400" />

            </div>

          </div>

        </FadeUp>

      </div>
    </div>
  )
}