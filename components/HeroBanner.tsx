'use client'

import Link from 'next/link'
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
    <div className="relative overflow-hidden rounded-[32px] border border-white/[0.05] px-8 py-20">

      {/* Background */}
      <div className="absolute inset-0 bg-[#0A0F18]" />

      {/* Glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute right-[-120px] top-[-120px] w-[500px] h-[500px] bg-cyan-400/10 blur-3xl rounded-full" />
        <div className="absolute left-[-120px] bottom-[-120px] w-[400px] h-[400px] bg-indigo-500/10 blur-3xl rounded-full" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col gap-16" dir="rtl">

        {/* ===== LOGO CENTER ===== */}
        <div className="flex justify-center">
          <img
            src="/logo-hero.png"
            className="w-[320px] md:w-[380px] object-contain opacity-95"
          />
        </div>

        {/* ===== MAIN GRID ===== */}
        <div className="grid md:grid-cols-[1fr_auto_1fr] gap-10 items-center">

          {/* ===== RIGHT TEXT ===== */}
          <div className="text-right flex flex-col gap-6">

            <h1
              className="text-white font-semibold leading-[1.25]"
              style={{ fontSize: 'clamp(2rem, 3vw, 2.8rem)' }}
            >
              سيطرة كاملة على مشترياتك
              <br />
              <span className="text-cyan-400">بسرعة وذكاء</span>
            </h1>

            <p className="text-gray-400 max-w-[420px] text-[15px] leading-relaxed">
              قارن الموردين، حلّل العروض، واتخذ قرارات دقيقة خلال دقائق —
              بدون تعقيد أو تشتت.
            </p>

          </div>

          {/* ===== CENTER LINE (الفاصل الفخم) ===== */}
          <div className="hidden md:flex justify-center">
            <div className="w-px h-40 relative">
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-400/60 to-transparent blur-[1px]" />
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-400 to-transparent w-[1px]" />
            </div>
          </div>

          {/* ===== LEFT ACTIONS ===== */}
          <div className="flex flex-col items-start gap-8">

            {/* Buttons */}
            <div className="flex gap-4">

              <Link href="/rfqs/new">
                <button className="
                  px-7 py-3.5 rounded-xl
                  bg-cyan-400 text-black font-semibold
                  hover:bg-cyan-300 hover:scale-[1.05]
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

            {/* Stats */}
            <div className="
              bg-white/[0.03]
              border border-white/[0.06]
              rounded-2xl
              px-6 py-5
              backdrop-blur-xl
              flex gap-10
            ">
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

/* ===== Stat ===== */
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
      <span className={`text-2xl font-semibold ${
        highlight ? 'text-cyan-400' : 'text-white'
      }`}>
        <CountUp value={value} />
      </span>
      <span className="text-[11px] text-gray-500 whitespace-nowrap">
        {label}
      </span>
    </div>
  )
}