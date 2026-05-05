'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { CountUp } from '@/components/DashboardShell'

function Fade({ children, delay = 0 }: any) {
  const [show, setShow] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setShow(true), delay)
    return () => clearTimeout(t)
  }, [delay])

  return (
    <div
      style={{
        opacity: show ? 1 : 0,
        transform: show ? 'translateY(0)' : 'translateY(25px)',
        transition: 'all 800ms cubic-bezier(0.16,1,0.3,1)',
      }}
    >
      {children}
    </div>
  )
}

function Stat({ value, label }: any) {
  return (
    <div className="flex flex-col items-center px-6">
      <span className="text-3xl font-bold text-white">
        <CountUp value={value} />
      </span>
      <span className="text-xs text-gray-400 mt-1">{label}</span>
    </div>
  )
}

export function HeroBanner({ total, active, resCount }: any) {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/[0.06] py-20 px-6 md:px-10">

      {/* 🔥 خلفية هادئة جداً */}
      <div className="absolute inset-0 bg-[#0a0f1a]" />

      {/* ✨ Glow ناعم */}
      <div className="absolute inset-0">
        <div className="absolute top-[-200px] left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-cyan-400/10 blur-3xl rounded-full" />
      </div>

      {/* ✨ خط ضوء خفيف */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute w-full h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent top-1/2" />
      </div>

      {/* CONTENT */}
      <div className="relative z-10 flex flex-col items-center text-center" dir="rtl">

        {/* 🔥 LOGO */}
        <Fade delay={100}>
          <img
            src="/logo-raw.png"
            className="w-[260px] mb-8 opacity-95"
          />
        </Fade>

        {/* 🔥 TITLE */}
        <Fade delay={200}>
          <h1 className="text-3xl md:text-5xl font-bold text-white leading-[1.4] max-w-3xl">
            قرارات أسرع، نتائج أفضل
            <br />
            <span className="text-cyan-400">
              بدون تعقيد أو تأخير
            </span>
          </h1>
        </Fade>

        {/* 🔥 SUBTEXT */}
        <Fade delay={300}>
          <p className="text-gray-400 mt-6 max-w-xl">
            قارن عروض الموردين خلال دقائق، واختر الأفضل بثقة.
            منصة ذكية تختصر الوقت والتكاليف وتمنحك رؤية أوضح.
          </p>
        </Fade>

        {/* 🔥 CTA */}
        <Fade delay={400}>
          <div className="flex gap-4 mt-10 flex-wrap justify-center">

            <Link href="/rfqs/new">
              <button className="
                px-8 py-3 rounded-xl font-semibold text-black
                bg-gradient-to-r from-cyan-400 to-cyan-300
                shadow-[0_10px_40px_rgba(34,211,238,0.25)]
                hover:scale-105 transition
              ">
                + إنشاء طلب
              </button>
            </Link>

            <Link href="/rfqs">
              <button className="
                px-8 py-3 rounded-xl border border-white/20 text-white
                hover:bg-white/10 transition
              ">
                عرض الطلبات
              </button>
            </Link>

          </div>
        </Fade>

        {/* 🔥 STATS */}
        <Fade delay={500}>
          <div className="
            flex gap-6 mt-14 px-6 py-4 rounded-2xl
            bg-white/[0.03] border border-white/[0.08]
            backdrop-blur-md
          ">

            <Stat value={total} label="إجمالي الطلبات" />
            <div className="w-px bg-white/10" />
            <Stat value={active} label="نشطة الآن" />
            <div className="w-px bg-white/10" />
            <Stat value={resCount} label="عروض مستلمة" />

          </div>
        </Fade>

      </div>
    </div>
  )
}