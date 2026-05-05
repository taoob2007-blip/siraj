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

  // Mouse glow
  useEffect(() => {
    const move = (e: MouseEvent) => {
      if (!glowRef.current) return
      const rect = glowRef.current.getBoundingClientRect()

      const x = e.clientX - rect.left
      const y = e.clientY - rect.top

      glowRef.current.style.background = `
        radial-gradient(450px circle at ${x}px ${y}px,
        rgba(34,211,238,0.10),
        transparent 45%)
      `
    }

    window.addEventListener('mousemove', move)
    return () => window.removeEventListener('mousemove', move)
  }, [])

  return (
    <div className="relative overflow-hidden rounded-[34px] border border-white/[0.05] px-8 py-20">

      {/* Base */}
      <div className="absolute inset-0 bg-[#0A0F18]" />

      {/* Mouse Glow */}
      <div ref={glowRef} className="absolute inset-0 pointer-events-none transition duration-200" />

      {/* Breathing Glow */}
      <div className="absolute inset-0 pointer-events-none animate-pulse opacity-30">
        <div className="absolute right-[-120px] top-[-120px] w-[500px] h-[500px] bg-cyan-400/10 blur-3xl rounded-full" />
      </div>

      {/* Grain */}
      <div
        className="absolute inset-0 opacity-[0.03] mix-blend-overlay"
        style={{ backgroundImage: 'url("https://grainy-gradients.vercel.app/noise.svg")' }}
      />

      <div className="relative z-10 flex flex-col gap-16" dir="rtl">

        {/* Logo */}
        <div className="flex justify-center">
          <img
            src="/logo-hero.png"
            className="w-[340px] md:w-[420px] object-contain
            drop-shadow-[0_30px_60px_rgba(34,211,238,0.2)]"
          />
        </div>

        {/* Layout */}
        <div className="grid md:grid-cols-[1fr_auto_1fr] gap-12 items-center">

          {/* RIGHT */}
          <div
            onMouseEnter={() => setHoverSide('right')}
            onMouseLeave={() => setHoverSide(null)}
            className={`text-right flex flex-col gap-6 transition duration-300 ${
              hoverSide === 'left' ? 'opacity-40' : 'opacity-100'
            }`}
          >
            <h1
              className="text-white font-semibold leading-[1.25]"
              style={{ fontSize: 'clamp(2rem, 3vw, 2.9rem)' }}
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

          {/* DIVIDER (Interactive) */}
          <div className="hidden md:flex justify-center">
            <div className="relative w-[2px] h-44">

              <div className={`
                absolute inset-0
                bg-gradient-to-b from-transparent via-cyan-400 to-transparent
                transition-all duration-300
                ${hoverSide ? 'opacity-100 blur-[1px]' : 'opacity-40'}
              `} />

            </div>
          </div>

          {/* LEFT */}
          <div
            onMouseEnter={() => setHoverSide('left')}
            onMouseLeave={() => setHoverSide(null)}
            className={`flex flex-col items-start gap-8 transition duration-300 ${
              hoverSide === 'right' ? 'opacity-40' : 'opacity-100'
            }`}
          >
            {/* Buttons */}
            <div className="flex gap-4">

              <Link href="/rfqs/new">
                <button className="
                  px-7 py-3.5 rounded-xl
                  bg-cyan-400 text-black font-semibold
                  hover:bg-cyan-300
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
                  transition
                ">
                  عرض الطلبات →
                </button>
              </Link>

            </div>

            {/* Stats */}
            <div className="
              bg-white/[0.03]
              border border-white/[0.06]
              rounded-2xl px-6 py-5
              backdrop-blur-xl
              flex gap-10
              transition hover:bg-white/[0.05]
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
      <span className={`text-2xl font-semibold ${
        highlight ? 'text-cyan-400 animate-pulse' : 'text-white'
      }`}>
        <CountUp value={value} />
      </span>
      <span className="text-[11px] text-gray-500 whitespace-nowrap">
        {label}
      </span>
    </div>
  )
}