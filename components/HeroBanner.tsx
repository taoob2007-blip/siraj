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
        transform: vis ? 'translateY(20px)' : 'translateY(40px)',
        transition: 'all 700ms ease',
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
    <div className="relative overflow-hidden rounded-3xl border border-white/[0.06] px-6 py-28 md:py-36">

      {/* Background */}
      <div className="absolute inset-0">
        <img
          src="/hero-banner.jpg"
          className="w-full h-full object-cover scale-105"
          alt=""
        />
      </div>

      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0A0F1B]/20 via-[#0A0F1B]/50 to-[#0A0F1B]/90" />

      {/* Glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-150px] left-[-150px] w-[500px] h-[500px] bg-cyan-500/10 blur-3xl rounded-full" />
        <div className="absolute bottom-[-120px] right-[-100px] w-[400px] h-[400px] bg-indigo-500/10 blur-3xl rounded-full" />
      </div>

      <div className="relative z-10 flex flex-col items-center text-center" dir="rtl">

        {/* LOGO */}
        <FadeUp delay={0}>
          <img
            src="/hero-logo.png"
            alt="SIRAJ"
            className="w-[360px] md:w-[520px] object-contain mb-14"
          />
        </FadeUp>

        {/* 🔥 MICRO TEXT (احترافي جداً) */}
        <FadeUp delay={100}>
          <p className="text-cyan-400 text-sm tracking-wide mb-3">
            منصة إدارة المشتريات الذكية
          </p>
        </FadeUp>

        {/* 🔥 HEADLINE */}
        <FadeUp delay={200}>
          <h1
            className="text-white font-bold"
            style={{
              fontSize: 'clamp(1.8rem, 3.5vw, 3rem)',
              lineHeight: 1.3,
            }}
          >
            قرارات أسرع، نتائج أفضل
            <br />
            <span className="text-cyan-400">بدون تعقيد أو تأخير</span>
          </h1>
        </FadeUp>

        {/* 🔥 VALUE PROPOSITION */}
        <FadeUp delay={300} className="mt-6">
          <p className="text-gray-300 max-w-[48ch] leading-relaxed text-[15px] md:text-[16px]">
            قارن العروض من عدة موردين، اختر الأنسب خلال دقائق،
            وخل الذكاء الاصطناعي يساعدك توفّر وقتك وتكاليفك.
          </p>
        </FadeUp>

        {/* 🔥 CTA ZONE */}
        <FadeUp delay={400} className="mt-10">
          <div className="flex gap-4 flex-wrap justify-center">

            <Link href="/rfqs/new">
              <button className="px-8 py-3.5 rounded-xl bg-cyan-400 text-[#0A0F1B] font-semibold 
              shadow-[0_10px_40px_rgba(34,211,238,0.3)] 
              hover:scale-[1.07] hover:bg-cyan-300 transition">
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

        {/* 🔥 STATS (صارت بلوك مستقل فخم) */}
        <FadeUp delay={500} className="mt-16 w-full max-w-md">
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