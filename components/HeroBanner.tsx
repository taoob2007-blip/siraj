'use client'

import Link from 'next/link'
import { CountUp } from '@/components/DashboardShell'

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div className="text-right">
      <div className="text-2xl font-bold text-white">
        <CountUp value={value} />
      </div>
      <div className="text-xs text-gray-400">{label}</div>
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
    <div className="relative overflow-hidden rounded-3xl border border-white/[0.06] px-10 py-20">

      {/* 🔥 خلفية هادئة فخمة */}
      <div className="absolute inset-0 bg-[#0A0F1B]" />

      {/* Glow خفيف */}
      <div className="absolute top-[-100px] left-[-100px] w-[400px] h-[400px] bg-cyan-400/10 blur-3xl rounded-full" />
      <div className="absolute bottom-[-120px] right-[-80px] w-[350px] h-[350px] bg-blue-500/10 blur-3xl rounded-full" />

      {/* المحتوى */}
      <div className="relative z-10 grid md:grid-cols-2 gap-10 items-center" dir="rtl">

        {/* 🟢 يمين = النص */}
        <div className="text-right space-y-6">

          {/* الشعار */}
          <img
            src="/logo-raw.png"
            alt="SIRAJ"
            className="w-[280px] opacity-95"
          />

          {/* الوصف */}
          <p className="text-sm text-gray-400 tracking-wide">
            إدارة الطلبات والموردين بذكاء
          </p>

          {/* العنوان */}
          <h1 className="text-4xl md:text-5xl font-bold leading-tight text-white">
            قرارات أسرع،
            <br />
            <span className="text-cyan-400">نتائج أدق</span>
          </h1>

          {/* وصف بسيط */}
          <p className="text-gray-400 max-w-md">
            قارن عروض الموردين، اختر الأفضل بثقة، واترك الذكاء الاصطناعي يوفر عليك الوقت والتكاليف.
          </p>

        </div>

        {/* 🔵 يسار = أزرار + إحصائيات */}
        <div className="flex flex-col items-start gap-8">

          {/* الأزرار */}
          <div className="flex gap-4">

            <Link href="/rfqs/new">
              <button className="px-6 py-3 rounded-xl bg-cyan-400 text-[#0A0F1B] font-semibold 
              hover:scale-105 transition shadow-lg">
                + إنشاء طلب
              </button>
            </Link>

            <Link href="/rfqs">
              <button className="px-6 py-3 rounded-xl border border-white/20 text-white hover:bg-white/10 transition">
                عرض الطلبات
              </button>
            </Link>

          </div>

          {/* الإحصائيات */}
          <div className="flex gap-10 border-t border-white/10 pt-6">

            <Stat value={total} label="إجمالي الطلبات" />
            <Stat value={active} label="نشطة الآن" />
            <Stat value={resCount} label="عروض مستلمة" />

          </div>

        </div>

      </div>
    </div>
  )
}