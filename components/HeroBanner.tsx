'use client'

import Image from 'next/image'

export default function HeroBanner() {
  return (
    <section className="relative overflow-hidden">

      {/* Background glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(56,189,248,0.08),transparent_40%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_80%,rgba(99,102,241,0.08),transparent_40%)]" />

      <div className="relative max-w-7xl mx-auto px-6 py-20">

        {/* 🔥 LOGO AREA FIX */}
        <div className="flex justify-center mb-12">
          <div className="
            relative
            px-10 py-8
            rounded-2xl
            border border-white/10
            bg-white/[0.03]
            backdrop-blur-xl
            shadow-[0_0_80px_rgba(56,189,248,0.08)]
          ">

            {/* subtle inner glow */}
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-cyan-500/5 via-transparent to-indigo-500/5" />

            <Image
              src="/logo-hero.png"
              alt="SIRAJ"
              width={420}
              height={140}
              className="relative object-contain"
              priority
            />
          </div>
        </div>

        {/* CONTENT */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

          {/* LEFT */}
          <div className="space-y-6">

            <div className="flex gap-3">
              <button className="px-6 py-3 rounded-xl border border-white/10 text-white/80 hover:bg-white/5 transition">
                عرض الطلبات →
              </button>

              <button className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-400 text-black font-semibold shadow-lg hover:scale-105 transition">
                + إنشاء طلب
              </button>
            </div>

            {/* STATS */}
            <div className="flex gap-6 bg-white/[0.04] border border-white/10 rounded-xl px-6 py-4 w-fit backdrop-blur">

              <div className="text-center">
                <p className="text-2xl font-bold text-white">8</p>
                <p className="text-xs text-gray-400">عروض مستلمة</p>
              </div>

              <div className="text-center">
                <p className="text-2xl font-bold text-cyan-400">0</p>
                <p className="text-xs text-gray-400">نشطة الآن</p>
              </div>

              <div className="text-center">
                <p className="text-2xl font-bold text-white">5</p>
                <p className="text-xs text-gray-400">إجمالي الطلبات</p>
              </div>

            </div>

          </div>

          {/* RIGHT */}
          <div className="space-y-6 text-right">

            <h1 className="text-5xl font-bold leading-tight text-white">
              سيطرة كاملة على <br />
              مشترياتك <br />
              <span className="bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
                بسرعة وذكاء
              </span>
            </h1>

            <p className="text-gray-400 leading-relaxed">
              قارن الموردين، حلل العروض، واتخذ قرارات دقيقة خلال دقائق — بدون تعقيد أو تشتت.
            </p>

          </div>

        </div>

        {/* Divider glow */}
        <div className="mt-12 h-[1px] bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent" />

      </div>
    </section>
  )
}