'use client'

import Link from 'next/link'
import Image from 'next/image'
import { CountUp } from '@/components/DashboardShell'

export function HeroBanner({ total, active, resCount }: any) {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/[0.06] bg-[#0A0F1B]">

      {/* 🔥 GLOW BACKGROUND */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute w-[700px] h-[700px] bg-cyan-500/10 blur-[140px] rounded-full left-1/2 -translate-x-1/2 top-[-200px]" />
        <div className="absolute w-[600px] h-[600px] bg-indigo-500/10 blur-[140px] rounded-full right-[-200px] bottom-[-200px]" />
      </div>

      {/* CONTENT */}
      <div className="relative px-6 py-24 flex flex-col items-center text-center" dir="rtl">

        {/* 🔥 LOGO FULL BANNER */}
        <div className="relative w-full flex justify-center">

          <Image
            src="/logo-raw.png"
            alt="SIRAJ"
            width={1000}
            height={400}
            priority
            className="
              w-[90%] max-w-[900px]
              object-contain

              mix-blend-screen
              brightness-150
              contrast-110

              drop-shadow-[0_0_60px_rgba(34,211,238,0.45)]
            "
          />

        </div>

        {/* TEXT */}
        <div className="mt-10">

          <h1 className="text-white font-extrabold text-[clamp(2rem,4vw,3rem)] leading-tight">
            قرارات أسرع، نتائج أفضل
            <br />
            <span className="text-cyan-400">
              بدون تعقيد أو تأخير
            </span>
          </h1>

          <p className="mt-5 text-gray-300 max-w-[520px] text-[15px] leading-relaxed">
            قارن العروض من عدة موردين، اختر الأفضل خلال دقائق،
            ووفّر وقتك وتكاليفك بسهولة.
          </p>

        </div>

        {/* BUTTONS */}
        <div className="mt-10 flex gap-4 flex-wrap justify-center">

          <Link href="/rfqs/new">
            <button className="
              px-8 py-3 rounded-xl
              bg-cyan-400 text-[#0A0F1B]
              font-semibold
              hover:scale-[1.05]
              transition
              shadow-[0_10px_40px_rgba(34,211,238,0.4)]
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

        {/* STATS */}
        <div className="mt-14 w-full max-w-md flex justify-between border-t border-white/10 pt-6">

          <Stat value={total} label="إجمالي الطلبات" colorCls="text-white" />
          <Stat value={active} label="نشطة الآن" colorCls="text-cyan-400" />
          <Stat value={resCount} label="عروض مستلمة" colorCls="text-violet-400" />

        </div>

      </div>
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