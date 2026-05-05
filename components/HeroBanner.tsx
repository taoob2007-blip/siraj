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
        transform: vis ? 'translateY(0)' : 'translateY(30px)',
        transition: 'all 800ms cubic-bezier(0.16,1,0.3,1)',
      }}
    >
      {children}
    </div>
  )
}

function Stat({ value, label }: any) {
  return (
    <div className="relative flex flex-col items-center group">

      {/* Glow */}
      <div className="absolute inset-0 bg-cyan-400/10 blur-xl opacity-0 group-hover:opacity-100 transition" />

      <span className="text-3xl font-bold text-white tracking-tight">
        <CountUp value={value} />
      </span>

      <span className="text-xs text-gray-400 mt-1">
        {label}
      </span>
    </div>
  )
}

export function HeroBanner({ total, active, resCount }: any) {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/[0.06] p-10 md:p-16">

      {/* 🔥 Base Background */}
      <div className="absolute inset-0 bg-[#0a0f1a]" />

      {/* ✨ Mesh Glow */}
      <div className="absolute inset-0">
        <div className="absolute top-[-200px] right-[-150px] w-[500px] h-[500px] bg-cyan-400/10 blur-3xl rounded-full animate-pulse" />
        <div className="absolute bottom-[-200px] left-[-150px] w-[500px] h-[500px] bg-indigo-500/10 blur-3xl rounded-full animate-pulse" />
      </div>

      {/* ✨ Moving light line */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute w-[200%] h-[2px] bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent top-1/2 animate-[slide_6s_linear_infinite]" />
      </div>

      {/* ✨ Noise texture */}
      <div
        className="absolute inset-0 opacity-[0.03] mix-blend-overlay"
        style={{ backgroundImage: 'url("https://grainy-gradients.vercel.app/noise.svg")' }}
      />

      {/* CONTENT */}
      <div className="relative z-10 grid md:grid-cols-2 gap-14 items-center" dir="rtl">

        {/* RIGHT */}
        <div className="text-right">

          <FadeUp delay={100}>
            <img
              src="/logo-raw.png"
              className="w-[240px] mb-8 drop-shadow-[0_10px_30px_rgba(34,211,238,0.15)]"
            />
          </FadeUp>

          <FadeUp delay={200}>
            <p className="text-xs text-cyan-400 mb-4 tracking-wide">
              منصة إدارة المشتريات الذكية
            </p>
          </FadeUp>

          <FadeUp delay={300}>
            <h1 className="text-4xl md:text-5xl font-bold text-white leading-[1.3] tracking-tight">
              قرارات أسرع
              <br />
              <span className="bg-gradient-to-r from-cyan-400 to-indigo-400 bg-clip-text text-transparent">
                نتائج أدق
              </span>
            </h1>
          </FadeUp>

          <FadeUp delay={400}>
            <p className="text-gray-400 mt-6 max-w-md leading-relaxed">
              قارن الموردين خلال دقائق، واتخذ قرارك بثقة.
              نظام ذكي يوفر عليك الوقت والتكاليف ويمنحك رؤية أوضح.
            </p>
          </FadeUp>

        </div>

        {/* LEFT */}
        <div className="flex flex-col items-start gap-8">

          {/* Buttons */}
          <FadeUp delay={500}>
            <div className="flex gap-4">

              <Link href="/rfqs/new">
                <button className="
                  relative px-8 py-3 rounded-xl font-semibold text-black
                  bg-gradient-to-r from-cyan-400 to-cyan-300
                  shadow-[0_10px_40px_rgba(34,211,238,0.25)]
                  hover:scale-105 hover:shadow-[0_20px_60px_rgba(34,211,238,0.35)]
                  transition-all duration-300
                ">
                  + إنشاء طلب
                </button>
              </Link>

              <Link href="/rfqs">
                <button className="
                  px-8 py-3 rounded-xl border border-white/20 text-white
                  backdrop-blur-sm
                  hover:bg-white/10 hover:border-white/40
                  transition-all
                ">
                  عرض الطلبات
                </button>
              </Link>

            </div>
          </FadeUp>

          {/* Stats Card */}
          <FadeUp delay={650}>
            <div className="
              flex gap-10 px-8 py-6 rounded-2xl
              bg-white/[0.03]
              border border-white/[0.08]
              backdrop-blur-md
            ">

              <Stat value={total} label="إجمالي الطلبات" />
              <Stat value={active} label="نشطة الآن" />
              <Stat value={resCount} label="عروض مستلمة" />

            </div>
          </FadeUp>

        </div>

      </div>

      {/* ✨ Keyframes */}
      <style jsx>{`
        @keyframes slide {
          0% { transform: translateX(-50%); }
          100% { transform: translateX(50%); }
        }
      `}</style>

    </div>
  )
}