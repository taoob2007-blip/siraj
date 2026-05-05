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
        transform: vis ? 'translateY(25px)' : 'translateY(50px)',
        transition: 'all 800ms cubic-bezier(0.22,1,0.36,1)',
      }}
    >
      {children}
    </div>
  )
}

function Stat({ value, label, colorCls }: { value: number; label: string; colorCls: string }) {
  return (
    <div className="flex flex-col items-center gap-1">
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
    <div className="relative overflow-hidden rounded-3xl border border-white/[0.06] px-6 py-32 md:py-40">

      {/* Background */}
      <div className="absolute inset-0">
        <img
          src="/hero-banner.jpg"
          className="w-full h-full object-cover"
          alt=""
        />
      </div>

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-[#0A0F1B]/70" />

      {/* Cinematic Light */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-cyan-400/10 blur-[120px]" />
      </div>

      <div className="relative z-10 flex flex-col items-center text-center" dir="rtl">

        {/* 🔥 LOGO (معدل بالكامل) */}
        <FadeUp delay={0}>
          <div className="relative mb-16">

            {/* Glow خلف اللوقو */}
            <div className="absolute inset-0 blur-[40px] opacity-60 bg-cyan-400/20 rounded-full" />

            {/* اللوقو */}
            <img
              src="/hero-logo.png"
              alt="SIRAJ"
              className="relative w-[380px] md:w-[560px] object-contain 
              drop-shadow-[0_0_25px_rgba(34,211,238,0.35)] 
              brightness-110 contrast-110"
            />
          </div>
        </FadeUp>

        {/* Label */}
        <FadeUp delay={120}>
          <p className="text-cyan-400 text-sm mb-3 tracking-wide">
            منصة إدارة المشتريات الذكية
          </p>
        </FadeUp>

        {/* Headline */}
        <FadeUp delay={220}>
          <h1 className="text-white font-extrabold text-[clamp(2rem,3.5vw,3.2rem)] leading-tight">
            قرارات أسرع، نتائج أفضل
            <br />
            <span className="text-cyan-400">بدون تعقيد أو تأخير</span>
          </h1>
        </FadeUp>

        {/* Description */}
        <FadeUp delay={320} className="mt-6">
          <p className="text-gray-300 max-w-[48ch] text-[16px] leading-relaxed">
            قارن العروض من عدة موردين، اختر الأنسب خلال دقائق،
            واترك الذكاء الاصطناعي يختصر عليك الوقت والتكلفة.
          </p>
        </FadeUp>

        {/* CTA */}
        <FadeUp delay={420} className="mt-10">
          <div className="flex gap-4 flex-wrap justify-center">

            <Link href="/rfqs/new">
              <button className="px-8 py-3.5 rounded-xl bg-cyan-400 text-[#0A0F1B] font-semibold
              hover:scale-[1.05] hover:bg-cyan-300 transition">
                + إنشاء طلب
              </button>
            </Link>

            <Link href="/rfqs">
              <button className="px-8 py-3.5 rounded-xl border border-white/[0.2] text-white 
              hover:bg-white/[0.06] transition">
                عرض الطلبات ←
              </button>
            </Link>

          </div>
        </FadeUp>

        {/* Stats */}
        <FadeUp delay={520} className="mt-16 w-full max-w-md">
          <div className="flex justify-between items-center px-6 py-5 rounded-2xl 
          bg-white/[0.04] backdrop-blur-md border border-white/[0.08]">

            <Stat value={total} label="إجمالي الطلبات" colorCls="text-white" />
            <Stat value={active} label="نشطة الآن" colorCls="text-cyan-400" />
            <Stat value={resCount} label="عروض مستلمة" colorCls="text-violet-400" />

          </div>
        </FadeUp>

      </div>
    </div>
  )
}