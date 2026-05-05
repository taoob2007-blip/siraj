'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
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
        transform: vis ? 'translateY(0)' : 'translateY(25px)',
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
      <span className={`text-2xl md:text-3xl font-bold ${colorCls}`}>
        <CountUp value={value} />
      </span>
      <span className="text-xs text-gray-400">{label}</span>
    </div>
  )
}

export function HeroBanner({ total, active, resCount }: any) {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/[0.06] bg-[#0A0F1B]">

      {/* 🔥 BACKGROUND (بدون صورة) */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute w-[600px] h-[600px] bg-cyan-500/10 blur-[120px] rounded-full left-1/2 -translate-x-1/2 top-10" />
        <div className="absolute w-[500px] h-[500px] bg-indigo-500/10 blur-[120px] rounded-full right-[-150px] bottom-[-150px]" />
      </div>

      <div className="relative px-6 py-24 flex flex-col items-center text-center" dir="rtl">

        {/* LOGO */}
        <FadeUp>
          <Image
            src="/logo-raw.png"
            alt="SIRAJ"
            width={500}
            height={200}
            priority
            className="
              w-[420px] md:w-[520px]
              object-contain
              mix-blend-screen
              brightness-125
              contrast-110
              drop-shadow-[0_0_25px_rgba(34,211,238,0.25)]
            "
          />
        </FadeUp>

        {/* Tagline */}
        <FadeUp delay={120}>
          <p className="text-cyan-400 text-sm mt-6 tracking-widest">
            منصة إدارة المشتريات الذكية
          </p>
        </FadeUp>

        {/* Headline */}
        <FadeUp delay={200}>
          <h1 className="mt-4 text-white font-extrabold leading-tight text-[clamp(2.2rem,4vw,3rem)]">
            قرارات أسرع، نتائج أفضل
            <br />
            <span className="text-cyan-400">
              بدون تعقيد أو تأخير
            </span>
          </h1>
        </FadeUp>

        {/* Description */}
        <FadeUp delay={300}>
          <p className="mt-5 text-gray-300 max-w-[520px] text-[15px] leading-relaxed">
            قارن العروض من عدة موردين، اختر الأنسب خلال دقائق،
            واترك الذكاء الاصطناعي يختصر عليك الوقت والتكاليف.
          </p>
        </FadeUp>

        {/* Buttons */}
        <FadeUp delay={400}>
          <div className="mt-10 flex gap-4 flex-wrap justify-center">

            <Link href="/rfqs/new">
              <button className="
                px-8 py-3 rounded-xl
                bg-cyan-400 text-[#0A0F1B]
                font-semibold
                hover:scale-[1.05]
                transition
                shadow-lg shadow-cyan-400/20
              ">
                + إنشاء طلب
              </button>
            </Link>

            <Link href="/rfqs">
              <button className="
                px-8 py-3 rounded-xl
                border border-white/20
                text-gray-300
                hover:bg-white/5
                transition
              ">
                عرض الطلبات ←
              </button>
            </Link>

          </div>
        </FadeUp>

        {/* Stats */}
        <FadeUp delay={500}>
          <div className="mt-14 w-full max-w-md flex justify-between border-t border-white/10 pt-6">

            <Stat value={total} label="إجمالي الطلبات" colorCls="text-white" />
            <Stat value={active} label="نشطة الآن" colorCls="text-cyan-400" />
            <Stat value={resCount} label="عروض مستلمة" colorCls="text-violet-400" />

          </div>
        </FadeUp>

      </div>
    </div>
  )
}