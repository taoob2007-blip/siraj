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
    <div className="relative overflow-hidden rounded-3xl border border-white/[0.06] px-8 py-16 md:py-20">

      {/* ✨ Background هادي */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0B0F19] via-[#0E1322] to-[#0B0F19]" />

      {/* ✨ Glow خفيف جدًا */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute right-[-120px] top-[-120px] w-[400px] h-[400px] bg-cyan-400/10 blur-3xl rounded-full" />
        <div className="absolute left-[-120px] bottom-[-120px] w-[400px] h-[400px] bg-indigo-500/10 blur-3xl rounded-full" />
      </div>

      {/* CONTENT */}
      <div className="relative z-10 grid md:grid-cols-2 gap-10 items-center" dir="rtl">

        {/* RIGHT (TEXT) */}
        <div className="flex flex-col gap-6 text-right">

          {/* Logo */}
          <div className="flex justify-end">
            <Image
              src="/logo-clean1.png"
              alt="SIRAJ"
              width={180}
              height={60}
              className="opacity-90"
            />
          </div>

          {/* Headline */}
          <h1 className="font-bold text-white leading-snug"
              style={{ fontSize: 'clamp(1.8rem, 3vw, 2.6rem)' }}>
            قرارات أسرع، نتائج أدق
            <br />
            <span className="text-cyan-400">بدون تعقيد أو تأخير</span>
          </h1>

          {/* Subtext */}
          <p className="text-gray-400 max-w-[38ch] text-sm md:text-base">
            قارن عروض الموردين خلال دقائق، اختر الأفضل بثقة،
            واترك الذكاء الاصطناعي يوفر عليك الوقت والتكاليف.
          </p>

        </div>

        {/* LEFT (CTA + STATS) */}
        <div className="flex flex-col items-start gap-8">

          {/* Buttons */}
          <div className="flex gap-4 flex-wrap">

            <Link href="/rfqs/new">
              <button className="px-7 py-3 rounded-xl bg-cyan-400 text-black font-semibold
              hover:bg-cyan-300 hover:scale-[1.05]
              transition-all duration-200 shadow-lg shadow-cyan-400/20">
                + إنشاء طلب
              </button>
            </Link>

            <Link href="/rfqs">
              <button className="px-7 py-3 rounded-xl border border-white/10 text-white
              hover:bg-white/[0.06] transition">
                عرض الطلبات ←
              </button>
            </Link>

          </div>

          {/* Stats */}
          <div className="flex items-center gap-8 bg-white/[0.03] border border-white/[0.05] rounded-2xl px-6 py-4 backdrop-blur-sm">

            <Stat value={total} label="إجمالي الطلبات" />
            <Divider />
            <Stat value={active} label="نشطة الآن" highlight />
            <Divider />
            <Stat value={resCount} label="عروض مستلمة" />

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
    <div className="flex flex-col items-center">
      <span className={`text-2xl font-bold tabular-nums
        ${highlight ? 'text-cyan-400' : 'text-white'}`}>
        <CountUp value={value} />
      </span>
      <span className="text-xs text-gray-500 mt-1">{label}</span>
    </div>
  )
}

function Divider() {
  return <div className="w-px h-8 bg-white/[0.08]" />
}