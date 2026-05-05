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
        transform: vis ? 'translateY(0)' : 'translateY(20px)',
        transition: 'all 700ms ease',
      }}
    >
      {children}
    </div>
  )
}

function Stat({ value, label, colorCls }: any) {
  return (
    <div className="flex flex-col items-center gap-1">
      <span className={`text-3xl font-bold ${colorCls}`}>
        <CountUp value={value} />
      </span>
      <span className="text-xs text-gray-400">{label}</span>
    </div>
  )
}

export function HeroBanner({ total, active, resCount }: any) {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/[0.06] px-6 py-20">

      {/* BACKGROUND */}
      <div className="absolute inset-0">
        <img src="/hero-banner.jpg" className="w-full h-full object-cover scale-105" />
      </div>

      <div className="absolute inset-0 bg-gradient-to-r from-[#0A0F1B]/80 via-[#0A0F1B]/40 to-transparent" />

      {/* GLOW */}
      <div className="absolute inset-0">
        <div className="absolute left-[-150px] top-1/2 w-[500px] h-[500px] bg-cyan-500/10 blur-3xl rounded-full" />
        <div className="absolute right-[-100px] bottom-[-120px] w-[400px] h-[400px] bg-indigo-500/10 blur-3xl rounded-full" />
      </div>

      {/* CONTENT */}
      <div className="relative z-10 flex flex-col gap-14" dir="rtl">

        {/* 🔥 LOGO */}
        <img
          src="/logo-clean.png"
          className="w-[420px] md:w-[520px] mx-auto mb-6"
        />

        {/* 🔥 GRID */}
        <div className="grid md:grid-cols-2 gap-10 items-center">

          {/* RIGHT (TEXT) */}
          <div className="text-right">

            <FadeUp delay={100}>
              <span className="text-cyan-400 text-sm tracking-wide">
                منصة إدارة المشتريات الذكية
              </span>
            </FadeUp>

            <FadeUp delay={150}>
              <h1 className="text-white font-bold text-4xl md:text-5xl leading-snug mt-3">
                قرارات أسرع، نتائج أفضل
                <br />
                <span className="text-cyan-400">بدون تعقيد أو تأخير</span>
              </h1>
            </FadeUp>

            <FadeUp delay={200}>
              <p className="text-gray-300 mt-5 max-w-md text-[15px] leading-relaxed">
                قارن عروض الموردين خلال دقائق، اختر الأفضل بثقة،
                واترك الذكاء الاصطناعي يختصر عليك الوقت والتكاليف.
              </p>
            </FadeUp>

          </div>

          {/* LEFT (CTA + STATS) */}
          <div className="flex flex-col items-center md:items-start gap-8">

            {/* Buttons */}
            <FadeUp delay={250}>
              <div className="flex gap-4 flex-wrap">

                <Link href="/rfqs/new">
                  <button className="px-8 py-3.5 rounded-xl bg-cyan-400 text-[#0A0F1B] font-semibold 
                  shadow-[0_10px_40px_rgba(34,211,238,0.25)] 
                  hover:scale-[1.06] hover:bg-cyan-300 transition">
                    + إنشاء طلب
                  </button>
                </Link>

                <Link href="/rfqs">
                  <button className="px-8 py-3.5 rounded-xl border border-white/20 text-white hover:bg-white/10">
                    عرض الطلبات ←
                  </button>
                </Link>

              </div>
            </FadeUp>

            {/* Stats */}
            <FadeUp delay={300}>
              <div className="flex gap-8 px-6 py-4 rounded-2xl 
              bg-white/[0.04] backdrop-blur-md border border-white/[0.08]">

                <Stat value={total} label="إجمالي الطلبات" colorCls="text-white" />
                <Stat value={active} label="نشطة الآن" colorCls="text-cyan-400" />
                <Stat value={resCount} label="عروض مستلمة" colorCls="text-violet-400" />

              </div>
            </FadeUp>

          </div>

        </div>

      </div>
    </div>
  )
}