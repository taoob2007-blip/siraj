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

  // Mouse glow (خلفية فقط - بدون تحريك اللوقو)
  useEffect(() => {
    const move = (e: MouseEvent) => {
      if (!glowRef.current) return

      const rect = glowRef.current.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top

      glowRef.current.style.background = `
        radial-gradient(600px circle at ${x}px ${y}px,
        rgba(34,211,238,0.15),
        transparent 55%)
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
      <div ref={glowRef} className="absolute inset-0 pointer-events-none" />

      {/* Lights */}
      <div className="absolute inset-0 pointer-events-none opacity-40">
        <div className="absolute -top-32 right-1/3 w-[700px] h-[700px] bg-cyan-400/10 blur-3xl rounded-full" />
        <div className="absolute bottom-[-200px] left-1/4 w-[700px] h-[700px] bg-violet-500/10 blur-3xl rounded-full" />
      </div>

      {/* Grain */}
      <div
        className="absolute inset-0 opacity-[0.03] mix-blend-overlay"
        style={{ backgroundImage: 'url("https://grainy-gradients.vercel.app/noise.svg")' }}
      />

      {/* Content */}
      <div className="relative z-10 flex flex-col gap-16" dir="rtl">

        {/* ===== LOGO (نظيف بدون مستطيل) ===== */}
        <div className="flex justify-center relative">

          {/* Glow خلف اللوقو */}
          <div className="absolute w-[520px] h-[220px] bg-gradient-to-r from-cyan-400/20 via-transparent to-violet-500/20 blur-[120px] rounded-full" />

          {/* Logo */}
          <img
            src="/logo-hero.png"
            className="
              relative z-10
              w-[420px] md:w-[520px]
              object-contain

              brightness-[1.15]
              contrast-[1.2]
              saturate-[1.2]

              drop-shadow-[0_40px_100px_rgba(34,211,238,0.35)]
            "
          />
        </div>

        {/* ===== MAIN LAYOUT ===== */}
        <div className="grid md:grid-cols-[1fr_auto_1fr] gap-12 items-center">

          {/* RIGHT */}
          <div
            onMouseEnter={() => setHoverSide('right')}
            onMouseLeave={() => setHoverSide(null)}
            className={`text-right flex flex-col gap-6 transition ${
              hoverSide === 'left' ? 'opacity-40' : 'opacity-100'
            }`}
          >
            <h1 className="text-white font-semibold leading-[1.25] text-3xl">
              سيطرة كاملة على مشترياتك
              <br />
              <span className="text-cyan-400">بسرعة وذكاء</span>
            </h1>

            <p className="text-gray-400 max-w-[420px] text-sm leading-relaxed">
              قارن الموردين، حلّل العروض، واتخذ قرارات دقيقة خلال دقائق —
              بدون تعقيد أو تشتت.
            </p>
          </div>

          {/* DIVIDER */}
          <div className="hidden md:flex justify-center">
            <div className="relative w-[2px] h-44">
              <div className={`
                absolute inset-0
                bg-gradient-to-b from-transparent via-cyan-400 to-transparent
                ${hoverSide ? 'opacity-100' : 'opacity-40'}
              `} />
            </div>
          </div>

          {/* LEFT */}
          <div
            onMouseEnter={() => setHoverSide('left')}
            onMouseLeave={() => setHoverSide(null)}
            className={`flex flex-col items-start gap-8 transition ${
              hoverSide === 'right' ? 'opacity-40' : 'opacity-100'
            }`}
          >

            {/* Buttons */}
            <div className="flex gap-4">

              <Link href="/rfqs/new">
                <button className="
                  px-7 py-3 rounded-xl
                  bg-cyan-400 text-black font-semibold
                  hover:bg-cyan-300
                  transition
                  shadow-[0_10px_40px_rgba(34,211,238,0.3)]
                ">
                  + إنشاء طلب
                </button>
              </Link>

              <Link href="/rfqs">
                <button className="
                  px-7 py-3 rounded-xl
                  border border-white/[0.1]
                  text-white
                  hover:bg-white/[0.05]
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
              flex gap-10
              backdrop-blur-xl
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
      <span
        className={`text-2xl font-semibold ${
          highlight ? 'text-cyan-400' : 'text-white'
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