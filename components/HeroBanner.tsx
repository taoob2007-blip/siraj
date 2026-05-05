'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { CountUp } from '@/components/DashboardShell'

function FadeUp({ children, delay = 0 }: any) {
  const [vis, setVis] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setVis(true), delay)
    return () => clearTimeout(t)
  }, [delay])

  return (
    <div
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
      <span className={`text-2xl font-bold ${colorCls}`}>
        <CountUp value={value} />
      </span>
      <span className="text-[11px] text-gray-400">{label}</span>
    </div>
  )
}

export function HeroBanner({ total, active, resCount }: any) {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/[0.06] px-6 py-24">

      {/* الخلفية */}
      <div className="absolute inset-0">
        <img
          src="/hero-banner.jpg"
          className="w-full h-full object-cover"
        />
      </div>

      {/* تغميق احترافي */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0A0F1B]/20 via-[#0A0F1B]/40 to-[#0A0F1B]/90" />

      {/* المحتوى */}
      <div className="relative z-10 flex flex-col items-center text-center" dir="rtl">

        {/* 🔥 LOGO */}
        <img
          src="/logo-clean.png"
          className="w-[480px] md:w-[560px] mb-10 drop-shadow-[0_20px_60px_rgba(0,0,0,0.6)]"
        />

        {/* النص */}
        <FadeUp delay={100}>
          <h1 className="text-white font-bold text-3xl md:text-5xl leading-snug">
            قرارات أسرع، نتائج أفضل
            <br />
            <span className="text-cyan-400">بدون تعقيد أو تأخير</span>
          </h1>
        </FadeUp>

        <FadeUp delay={200}>
          <p className="text-gray-300 mt-6 max-w-xl text-[15px] leading-relaxed">
            قارن عروض الموردين خلال دقائق، اختر الأفضل بثقة،
            واترك الذكاء الاصطناعي يختصر عليك الوقت والتكاليف.
          </p>
        </FadeUp>

        {/* الأزرار */}
        <FadeUp delay={300}>
          <div className="flex gap-4 mt-10 flex-wrap justify-center">

            <Link href="/rfqs/new">
              <button className="px-8 py-3.5 rounded-xl bg-cyan-400 text-[#0A0F1B] font-semibold 
              shadow-[0_10px_40px_rgba(34,211,238,0.25)] 
              hover:scale-[1.05] hover:bg-cyan-300 transition">
                + إنشاء طلب
              </button>
            </Link>

            <Link href="/rfqs">
              <button className="px-8 py-3.5 rounded-xl border border-white/20 text-white hover:bg-white/10 transition">
                عرض الطلبات ←
              </button>
            </Link>

          </div>
        </FadeUp>

        {/* الإحصائيات */}
        <FadeUp delay={400}>
          <div className="flex gap-10 mt-14 px-8 py-4 rounded-2xl 
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