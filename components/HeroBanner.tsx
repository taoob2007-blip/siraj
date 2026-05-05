'use client'

import Link from 'next/link'
import { CountUp } from '@/components/DashboardShell'

function Stat({ value, label, colorCls }: { value: number; label: string; colorCls: string }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <span className={`text-3xl font-bold ${colorCls}`}>
        <CountUp value={value} />
      </span>
      <span className="text-xs text-gray-500">{label}</span>
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
    <div className="relative overflow-hidden rounded-3xl border border-white/[0.05] px-6 py-20">

      {/* 🔥 BACKGROUND */}
      <div className="absolute inset-0 bg-[#050A14]" />

      {/* Glow */}
      <div className="absolute inset-0">
        <div className="absolute top-[-120px] left-1/2 -translate-x-1/2 w-[700px] h-[700px] bg-cyan-500/10 blur-[160px]" />
        <div className="absolute bottom-[-200px] left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-blue-600/10 blur-[140px]" />
      </div>

      {/* CONTENT */}
      <div className="relative flex flex-col items-center text-center" dir="rtl">

        {/* 🔥 LOGO */}
        <img
          src="/logo-clean.png"
          alt="SIRAJ"
          className="w-[380px] md:w-[520px] mb-10 drop-shadow-[0_0_25px_rgba(0,255,255,0.25)]"
        />

        {/* SMALL TAG */}
        <span className="text-cyan-400 text-sm mb-3 tracking-wide">
          منصة إدارة المشتريات الذكية
        </span>

        {/* HEADLINE */}
        <h1 className="text-white font-bold text-4xl md:text-5xl leading-tight">
          قرارات أسرع، نتائج أفضل
          <br />
          <span className="text-cyan-400">بدون تعقيد أو تأخير</span>
        </h1>

        {/* DESC */}
        <p className="text-gray-400 mt-5 max-w-md text-sm leading-relaxed">
          قارن العروض من عدة موردين، اختر الأفضل خلال دقائق، واترك الذكاء الاصطناعي يختصر عليك الوقت والتكاليف.
        </p>

        {/* CTA */}
        <div className="flex gap-3 mt-8 flex-wrap justify-center">

          <Link href="/rfqs/new">
            <button className="px-8 py-3 rounded-xl bg-cyan-400 text-black font-semibold hover:bg-cyan-300 transition">
              + إنشاء طلب
            </button>
          </Link>

          <Link href="/rfqs">
            <button className="px-8 py-3 rounded-xl border border-white/20 text-white hover:bg-white/10 transition">
              عرض الطلبات ←
            </button>
          </Link>

        </div>

        {/* STATS */}
        <div className="mt-12 flex gap-8 border-t border-white/10 pt-6">

          <Stat value={total} label="إجمالي الطلبات" colorCls="text-white" />
          <Stat value={active} label="نشطة الآن" colorCls="text-cyan-400" />
          <Stat value={resCount} label="عروض مستلمة" colorCls="text-violet-400" />

        </div>

      </div>
    </div>
  )
}