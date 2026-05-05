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
  const logoRef = useRef<HTMLDivElement>(null)
  const [hoverSide, setHoverSide] = useState<'left' | 'right' | null>(null)

  useEffect(() => {
    const move = (e: MouseEvent) => {
      if (!glowRef.current || !logoRef.current) return

      const rect = glowRef.current.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top

      glowRef.current.style.background = `
        radial-gradient(600px circle at ${x}px ${y}px,
        rgba(34,211,238,0.15),
        transparent 55%)
      `

      const centerX = rect.width / 2
      const centerY = rect.height / 2

      const moveX = (x - centerX) / 40
      const moveY = (y - centerY) / 40

      logoRef.current.style.transform = `translate(${moveX}px, ${moveY}px)`
    }

    window.addEventListener('mousemove', move)
    return () => window.removeEventListener('mousemove', move)
  }, [])

  return (
    <div className="relative overflow-hidden rounded-[34px] border border-white/[0.05] px-8 py-20">

      <div className="absolute inset-0 bg-[#0A0F18]" />
      <div ref={glowRef} className="absolute inset-0 pointer-events-none" />

      {/* Lights */}
      <div className="absolute inset-0 pointer-events-none opacity-40">
        <div className="absolute -top-32 right-1/3 w-[700px] h-[700px] bg-cyan-400/10 blur-3xl rounded-full" />
        <div className="absolute bottom-[-200px] left-1/4 w-[700px] h-[700px] bg-violet-500/10 blur-3xl rounded-full" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col gap-16" dir="rtl">

        {/* LOGO */}
        <div className="flex justify-center relative">

          <div className="absolute w-[500px] h-[200px] bg-gradient-to-r from-cyan-400/20 via-teal-400/10 to-violet-500/20 blur-[120px] rounded-full" />

          <div className="absolute w-[460px] h-[160px] bg-white/[0.03] border border-white/[0.05] backdrop-blur-2xl rounded-2xl" />

          {/* SVG LOGO بدل الصورة */}
          <div ref={logoRef} className="relative z-10 transition-transform duration-300">

            <svg
              viewBox="0 0 900 240"
              className="w-[360px] md:w-[460px]"
            >
              <defs>
                <linearGradient id="gradMain" x1="0%" y1="0%" x2="100%">
                  <stop offset="0%" stopColor="#e5e7eb" />
                  <stop offset="100%" stopColor="#ffffff" />
                </linearGradient>

                <linearGradient id="gradAccent" x1="0%" y1="0%" x2="100%">
                  <stop offset="0%" stopColor="#7c3aed" />
                  <stop offset="100%" stopColor="#22d3ee" />
                </linearGradient>

                <filter id="glow">
                  <feGaussianBlur stdDeviation="6" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              </defs>

              {/* SIRAJ */}
              <text x="40" y="120" fontSize="90" fill="url(#gradMain)">S</text>
              <text x="180" y="120" fontSize="90" fill="url(#gradMain)">I</text>
              <text x="260" y="120" fontSize="90" fill="url(#gradMain)">R</text>
              <text x="390" y="120" fontSize="90" fill="url(#gradMain)">A</text>

              {/* Animated dot */}
              <circle cx="455" cy="105" r="7" fill="#22d3ee" filter="url(#glow)">
                <animate
                  attributeName="r"
                  values="6;9;6"
                  dur="1.6s"
                  repeatCount="indefinite"
                />
              </circle>

              <text x="520" y="120" fontSize="90" fill="url(#gradMain)">J</text>

              {/* Arabic */}
              <text
                x="450"
                y="185"
                textAnchor="middle"
                fontSize="28"
                fill="#d1d5db"
              >
                إدارة الطلبات و الموردين بذكاء
              </text>

              {/* Lines */}
              <rect x="140" y="175" width="80" height="3" fill="url(#gradAccent)" rx="2" />
              <rect x="680" y="175" width="80" height="3" fill="url(#gradAccent)" rx="2" />
            </svg>

          </div>
        </div>

        {/* Layout */}
        <div className="grid md:grid-cols-[1fr_auto_1fr] gap-12 items-center">

          {/* RIGHT */}
          <div
            onMouseEnter={() => setHoverSide('right')}
            onMouseLeave={() => setHoverSide(null)}
            className={`${hoverSide === 'left' ? 'opacity-40' : 'opacity-100'} text-right flex flex-col gap-6`}
          >
            <h1 className="text-white font-semibold leading-[1.25] text-3xl">
              سيطرة كاملة على مشترياتك
              <br />
              <span className="text-cyan-400">بسرعة وذكاء</span>
            </h1>

            <p className="text-gray-400 max-w-[420px] text-sm">
              قارن الموردين، حلّل العروض، واتخذ قرارات دقيقة خلال دقائق —
              بدون تعقيد أو تشتت.
            </p>
          </div>

          {/* DIVIDER */}
          <div className="hidden md:flex justify-center">
            <div className="w-[2px] h-44 bg-gradient-to-b from-transparent via-cyan-400 to-transparent opacity-60" />
          </div>

          {/* LEFT */}
          <div
            onMouseEnter={() => setHoverSide('left')}
            onMouseLeave={() => setHoverSide(null)}
            className={`${hoverSide === 'right' ? 'opacity-40' : 'opacity-100'} flex flex-col items-start gap-8`}
          >

            <div className="flex gap-4">

              <Link href="/rfqs/new">
                <button className="px-7 py-3 rounded-xl bg-cyan-400 text-black font-semibold hover:bg-cyan-300 transition">
                  + إنشاء طلب
                </button>
              </Link>

              <Link href="/rfqs">
                <button className="px-7 py-3 rounded-xl border border-white/[0.1] text-white hover:bg-white/[0.05]">
                  عرض الطلبات →
                </button>
              </Link>

            </div>

            <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl px-6 py-5 flex gap-10">

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
      <span className={`text-2xl font-semibold ${highlight ? 'text-cyan-400' : 'text-white'}`}>
        <CountUp value={value} />
      </span>
      <span className="text-xs text-gray-500">{label}</span>
    </div>
  )
}