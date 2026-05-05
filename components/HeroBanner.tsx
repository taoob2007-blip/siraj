'use client'

import Link from 'next/link'
import Image from 'next/image'
import { CountUp } from '@/components/DashboardShell'

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
    <div className="relative overflow-hidden rounded-[30px] border border-white/[0.06] px-8 py-20">

      {/* 🎯 خلفية هادئة جدًا */}
      <div className="absolute inset-0 bg-[#0A0F18]" />

      {/* ✨ إضاءة ناعمة (Luxury feel) */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute right-[-150px] top-[-150px] w-[500px] h-[500px] bg-cyan-400/10 blur-3xl rounded-full" />
        <div className="absolute left-[-120px] bottom-[-120px] w-[400px] h-[400px] bg-indigo-500/10 blur-3xl rounded-full" />
      </div>

      {/* ✨ Grain خفيف جدًا */}
      <div
        className="absolute inset-0 opacity-[0.03] mix-blend-overlay"
        style={{ backgroundImage: 'url("https://grainy-gradients.vercel.app/noise.svg")' }}
      />

      {/* ===== CONTENT ===== */}
      <div className="relative z-10 grid md:grid-cols-2 gap-14 items-center" dir="rtl">

        {/* ===== RIGHT (LOGO + MESSAGE) ===== */}
        <div className="flex flex-col gap-8 text-right">

          {/* Logo Hero */}
          <div className="flex justify-end">
            <img
              src="/logo.raw"
              alt="SIRAJ"
              className="w-[220px] md:w-[260px] object-contain opacity-95"
            />
          </div>

          {/* Headline */}
          <h1
            className="text-white font-semibold leading-[1.25] tracking-tight"
            style={{ fontSize: 'clamp(2rem, 3vw, 2.8rem)' }}
          >
            إدارة مشترياتك
            <br />
            <span className="text-cyan-400">بذكاء وسرعة</span>
          </h1>

          {/* Subtext */}
          <p className="text-gray-400 max-w-[420px] text-[15px] leading-relaxed">
            قارن الموردين، حلّل العروض، واتخذ القرار المناسب خلال دقائق —
            بدون تعقيد أو تأخير.
          </p>

        </div>

        {/* ===== LEFT (ACTIONS + STATS) ===== */}
        <div className="flex flex-col items-start gap-10">

          {/* Buttons */}
          <div className="flex gap-4 flex-wrap">

            <Link href="/rfqs/new">
              <button className="
                px-7 py-3.5 rounded-xl
                bg-cyan-400 text-black font-semibold
                hover:bg-cyan-300 hover:scale-[1.04]
                active:scale-95
                transition-all duration-200
                shadow-[0_10px_40px_rgba(34,211,238,0.25)]
              ">
                + إنشاء طلب
              </button>
            </Link>

            <Link href="/rfqs">
              <button className="
                px-7 py-3.5 rounded-xl
                border border-white/[0.1]
                text-white
                hover:bg-white/[0.05]
                transition-all duration-200
              ">
                عرض الطلبات →
              </button>
            </Link>

          </div>

          {/* Stats Card */}
          <div className="
            w-full max-w-md
            bg-white/[0.03]
            border border-white/[0.06]
            rounded-2xl
            px-6 py-5
            backdrop-blur-xl
          ">
            <div className="flex justify-between items-center">

              <Stat value={total} label="إجمالي الطلبات" />
              <Stat value={active} label="نشطة الآن" highlight />
              <Stat value={resCount} label="عروض مستلمة" />

            </div>
          </div>

        </div>

      </div>
    </div>
  )
}

/* ===== Components ===== */

function Stat({
  value,
  label,
  highlight,
}: {
  value: number
  label: string
  highlight?: boolean
}) {
  return (
    <div className="flex flex-col items-center gap-1">
      <span
        className={`text-2xl font-semibold tabular-nums ${
          highlight ? 'text-cyan-400' : 'text-white'
        }`}
      >
        <CountUp value={value} />
      </span>

      <span className="text-[11px] text-gray-500 whitespace-nowrap">
        {label}
      </span>
    </div>
  )
}