'use client'

import { useEffect, useRef, useState } from 'react'
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
  const glowRef = useRef<HTMLDivElement>(null)
  const [hoverSide, setHoverSide] = useState<'left' | 'right' | null>(null)

  useEffect(() => {
    const move = (e: MouseEvent) => {
      if (!glowRef.current) return

      const rect = glowRef.current.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top

      glowRef.current.style.background = `
        radial-gradient(900px circle at ${x}px ${y}px,
        rgba(255,255,255,0.02),
        transparent 75%)
      `
    }

    window.addEventListener('mousemove', move)
    return () => window.removeEventListener('mousemove', move)
  }, [])

  return (
    <div className="
      relative overflow-hidden rounded-[36px]
      border border-white/[0.06]
      px-10 py-24
      animate-[fadeUp_0.9s_ease]
    ">

      {/* Base */}
      <div className="absolute inset-0 bg-[#0B0F17]" />

      {/* Depth */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.04),transparent_45%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_80%,rgba(255,255,255,0.03),transparent_45%)]" />
      </div>

      {/* Mouse subtle */}
      <div ref={glowRef} className="absolute inset-0 pointer-events-none" />

      {/* Grain */}
      <div
        className="absolute inset-0 opacity-[0.02] mix-blend-overlay"
        style={{ backgroundImage: 'url("https://grainy-gradients.vercel.app/noise.svg")' }}
      />

      <div className="relative z-10 flex flex-col gap-20" dir="rtl">

        {/* LOGO */}
        <div className="flex justify-center -translate-y-10 md:-translate-y-14">
          <img
            src="/logo-hero.png"
            className="
              w-[520px] md:w-[640px]
              object-contain
              drop-shadow-[0_25px_50px_rgba(0,0,0,0.6)]
            "
          />
        </div>

        {/* CONTENT */}
        <div className="grid md:grid-cols-[1fr_auto_1fr] gap-16 items-center">

          {/* RIGHT */}
          <div
            onMouseEnter={() => setHoverSide('right')}
            onMouseLeave={() => setHoverSide(null)}
            className={`text-right flex flex-col gap-7 transition duration-300 ${
              hoverSide === 'left' ? 'opacity-40' : 'opacity-100'
            }`}
          >
            <h1 className="text-white font-semibold leading-[1.2] text-[clamp(2.3rem,3vw,3.3rem)]">
              سيطرة كاملة على مشترياتك
              <br />
              <span className="text-white/70">بسرعة وذكاء</span>
            </h1>

            <p className="text-gray-400 max-w-[440px] text-[15px] leading-relaxed">
              قارن الموردين، حلّل العروض، واتخذ قرارات دقيقة خلال دقائق —
              بدون تعقيد أو تشتت.
            </p>
          </div>

          {/* DIVIDER */}
          <div className="hidden md:flex justify-center">
            <div className="w-[1px] h-52 bg-white/10" />
          </div>

          {/* LEFT */}
          <div
            onMouseEnter={() => setHoverSide('left')}
            onMouseLeave={() => setHoverSide(null)}
            className={`flex flex-col items-start gap-10 transition duration-300 ${
              hoverSide === 'right' ? 'opacity-40' : 'opacity-100'
            }`}
          >

            {/* Buttons */}
            <div className="flex gap-4">

              <Link href="/rfqs/new">
                <button className="
                  px-8 py-3.5 rounded-xl
                  bg-white text-black font-medium
                  transition-all duration-200
                  hover:scale-[1.03]
                  active:scale-[0.97]
                ">
                  + إنشاء طلب
                </button>
              </Link>

              <Link href="/rfqs">
                <button className="
                  px-8 py-3.5 rounded-xl
                  border border-white/[0.12]
                  text-white
                  transition-all duration-200
                  hover:bg-white/[0.05]
                ">
                  عرض الطلبات ←
                </button>
              </Link>

            </div>

            {/* Stats */}
            <div className="
              bg-white/[0.02]
              border border-white/[0.05]
              rounded-2xl px-8 py-6
              flex gap-12
              backdrop-blur-xl
            ">
              <Stat value={total} label="إجمالي الطلبات" />
              <Stat value={active} label="نشطة الآن" highlight />
              <Stat value={resCount} label="عروض مستلمة" />
            </div>

          </div>
        </div>
      </div>

      {/* animation keyframes */}
      <style jsx>{`
        @keyframes fadeUp {
          0% {
            opacity: 0;
            transform: translateY(20px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  )
}

/* Stat */
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
        className={`text-[22px] font-semibold ${
          highlight ? 'text-white' : 'text-white/70'
        }`}
      >
        <CountUp value={value} />
      </span>
      <span className="text-xs text-gray-500 whitespace-nowrap">
        {label}
      </span>
    </div>
  )
}