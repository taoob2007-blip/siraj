'use client'

import Link from 'next/link'
import { CountUp } from '@/components/DashboardShell'

function Stat({ value, label, colorCls }: { value: number; label: string; colorCls: string }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <span className={`text-2xl md:text-3xl font-bold ${colorCls}`}>
        <CountUp value={value} />
      </span>
      <span className="text-[11px] text-gray-500">{label}</span>
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
    <div className="relative overflow-hidden rounded-3xl border border-white/[0.06] px-6 py-16 md:py-20">

      {/* 🔥 BACKGROUND BASE */}
      <div className="absolute inset-0 bg-[#060B16]" />

      {/* 🔥 LIGHT CENTER */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-[600px] h-[600px] bg-cyan-400/10 blur-[140px] rounded-full" />
      </div>

      {/* 🔥 SIDE LINES (يمين ويسار زي صورتك) */}
      <div className="absolute left-0 bottom-0 w-[50%] h-full opacity-30 bg-gradient-to-tr from-cyan-500/20 via-transparent to-transparent blur-xl" />
      <div className="absolute right-0 bottom-0 w-[50%] h-full opacity-30 bg-gradient-to-tl from-blue-500/20 via-transparent to-transparent blur-xl" />

      {/* 🔥 CONTENT */}
      <div className="relative flex flex-col items-center text-center" dir="rtl">

        {/* 🔥 LOGO */}
        <img
          src="/logo-clean.png"
          alt="SIRAJ"
          className="w-[420px] md:w-[560px] mb-6 drop-shadow-[0_0_30px_rgba(0,255,255,0.25)]"
        />

        {/* 🔥 HEADLINE */}
        <h1 className="text-white font-bold text-3xl md:text-4xl leading-snug mt-4">
          اتخذ قرارات الشراء
          <br />
          <span className="text-cyan-400">خلال دقائق بدل أيام</span>
        </h1>

        {/* 🔥 SUBTEXT */}
        <p className="text-gray-400 mt-4 text-sm md:text-base max-w-md">
          قارن العروض، اختر الأفضل، ووفّر التكاليف — بدون تعقيد
        </p>

        {/* 🔥 BUTTONS */}
        <div className="flex gap-3 mt-8 flex-wrap justify-center">

          <Link href="/rfqs/new">
            <button className="px-7 py-3 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-[#060B16] font-semibold transition hover:scale-[1.03]">
              + إنشاء طلب
            </button>
          </Link>

          <Link href="/rfqs">
            <button className="px-7 py-3 rounded-xl border border-white/20 text-gray-300 hover:bg-white/10 transition">
              عرض الطلبات ←
            </button>
          </Link>

        </div>

        {/* 🔥 STATS */}
        <div className="mt-10 w-full max-w-xs">
          <div className="flex items-center justify-center pt-6 border-t border-white/10">

            <div className="flex-1">
              <Stat value={total} label="إجمالي الطلبات" colorCls="text-white" />
            </div>

            <div className="w-px h-8 bg-white/10" />

            <div className="flex-1">
              <Stat value={active} label="نشطة الآن" colorCls="text-cyan-400" />
            </div>

            <div className="w-px h-8 bg-white/10" />

            <div className="flex-1">
              <Stat value={resCount} label="عروض مستلمة" colorCls="text-violet-400" />
            </div>

          </div>
        </div>

      </div>
    </div>
  )
}