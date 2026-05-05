'use client'

import { useEffect, useRef } from 'react'
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

  // 🎯 Mouse glow effect
  useEffect(() => {
    const move = (e: MouseEvent) => {
      if (!glowRef.current) return
      const rect = glowRef.current.getBoundingClientRect()

      const x = e.clientX - rect.left
      const y = e.clientY - rect.top

      glowRef.current.style.background = `
        radial-gradient(
          400px circle at ${x}px ${y}px,
          rgba(34,211,238,0.12),
          transparent 40%
        )
      `
    }

    window.addEventListener('mousemove', move)
    return () => window.removeEventListener('mousemove', move)
  }, [])

  return (
    <div className="relative overflow-hidden rounded-[32px] border border-white/[0.05] px-8 py-20">

      {/* 🔥 Base Background */}
      <div className="absolute inset-0 bg-[#0A0F18]" />

      {/* ✨ Mouse Glow */}
      <div
        ref={glowRef}
        className="absolute inset-0 transition duration-200 pointer-events-none"
      />

      {/* ✨ Static Glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute right-[-120px] top-[-120px] w-[500px] h-[500px] bg-cyan-400/10 blur-3xl rounded-full" />
        <div className="absolute left-[-120px] bottom-[-120px] w-[400px] h-[400px] bg-indigo-500/10 blur-3xl rounded-full" />
      </div>

      {/* ✨ Noise */}
      <div
        className="absolute inset-0 opacity-[0.03] mix-blend-overlay"
        style={{ backgroundImage: 'url("https://grainy-gradients.vercel.app/noise.svg")' }}
      />

      {/* ===== CONTENT ===== */}
      <div className="relative z-10 grid md:grid-cols-2 gap-14 items-center" dir="rtl">

        {/* ===== RIGHT ===== */}
        <div className="flex flex-col gap-8 text-right animate-fade-in">

          {/* Logo */}
          <div className="flex justify-end">
            <img
              src="/logo-hero.png"
              className="w-[260px] object-contain drop-shadow-[0_20px_40px_rgba(34,211,238,0.15)]"
            />
          </div>

          {/* Headline */}
          <h1
            className="text-white font-semibold leading-[1.25] tracking-tight"
            style={{ fontSize: 'clamp(2.1rem, 3vw, 3rem)' }}
          >
            سيطرة كاملة على مشترياتك
            <br />
            <span className="text-cyan-400">بسرعة وذكاء</span>
          </h1>

          {/* Sub */}
          <p className="text-gray-400 max-w-[420px] text-[15px] leading-relaxed">
            قارن الموردين، حلّل العروض، واتخذ قرارات دقيقة خلال دقائق —
            بدون تعقيد أو تشتت.
          </p>

        </div>

        {/* ===== LEFT ===== */}
        <div className="flex flex-col items-start gap-10">

          {/* Buttons */}
          <div className="flex gap-4">

            <Link href="/rfqs/new">
              <button className="
                px-7 py-3.5 rounded-xl
                bg-cyan-400 text-black font-semibold
                hover:bg-cyan-300 hover:scale-[1.05]
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
                transition-all duration-200
              ">
                عرض الطلبات →
              </button>
            </Link>

          </div>

          {/* Stats */}
          <div className="
            w-full max-w-md
            bg-white/[0.03]
            border border-white/[0.06]
            rounded-2xl
            px-6 py-5
            backdrop-blur-xl
            shadow-[0_10px_40px_rgba(0,0,0,0.3)]
          ">
            <div className="flex justify-between items-center">

              <Stat value={total} label="إجمالي الطلبات" />
              <Stat value={active} label="نشطة الآن" highlight />
              <Stat value={resCount} label="عروض مستلمة" />

            </div>
          </div>

        </div>

      </div>

      {/* Animation */}
      <style jsx>{`
        .animate-fade-in {
          animation: fadeIn 0.8s ease;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
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
      <span className={`text-2xl font-semibold tabular-nums ${
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