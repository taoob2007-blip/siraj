'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Plus, ArrowLeft } from 'lucide-react'
import { CountUp, ShimmerSweep } from '@/components/DashboardShell'

/* ── Mouse parallax ─────────────────────────────────────────── */
function useMouseParallax(strength = 6) {
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  useEffect(() => {
    let frame: number
    const onMove = (e: MouseEvent) => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        const cx = window.innerWidth  / 2
        const cy = window.innerHeight / 2
        setOffset({
          x: ((e.clientX - cx) / cx) * strength,
          y: ((e.clientY - cy) / cy) * strength,
        })
      })
    }
    window.addEventListener('mousemove', onMove, { passive: true })
    return () => { window.removeEventListener('mousemove', onMove); cancelAnimationFrame(frame) }
  }, [strength])
  return offset
}

/* ── Staggered fade-up ──────────────────────────────────────── */
function TextIn({
  children,
  delay = 0,
  className = '',
}: {
  children: React.ReactNode
  delay?: number
  className?: string
}) {
  const [vis, setVis] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setVis(true), delay)
    return () => clearTimeout(t)
  }, [delay])

  return (
    <div
      className={className}
      style={{
        opacity:    vis ? 1 : 0,
        transform:  vis ? 'translateY(0)' : 'translateY(14px)',
        transition: 'opacity 560ms cubic-bezier(.4,0,.2,1), transform 560ms cubic-bezier(.4,0,.2,1)',
      }}
    >
      {children}
    </div>
  )
}

/* ── Stat pill ──────────────────────────────────────────────── */
function StatPill({
  value,
  label,
  colorCls,
}: {
  value: number
  label: string
  colorCls: string
}) {
  return (
    <div className="flex flex-col items-center gap-1">
      <p className={`text-2xl md:text-3xl font-bold tabular-nums leading-none ${colorCls}`}>
        <CountUp value={value} />
      </p>
      <p className="text-[11px] text-gray-500 mt-0.5 whitespace-nowrap">{label}</p>
    </div>
  )
}

/* ── Hero Banner ────────────────────────────────────────────── */
export function HeroBanner({
  total,
  active,
  resCount,
}: {
  total: number
  active: number
  resCount: number
}) {
  const parallax = useMouseParallax(5)

  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/[0.08] px-8 py-14 md:py-20 hero-bg-drift">

      {/* ── Ambient orbs ────────────────────────────────────── */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          transform: `translate(${parallax.x * 0.35}px, ${parallax.y * 0.35}px)`,
          transition: 'transform 140ms linear',
        }}
      >
        {/* top-left blue */}
        <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-blue-600/8 blur-3xl hero-orb-drift" />
        {/* bottom-right violet */}
        <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-violet-600/8 blur-3xl hero-orb-drift-reverse" />
        {/* center cyan pulse — the signature glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[420px] w-[420px] rounded-full bg-cyan-500/5 blur-3xl hero-orb-drift-slow" />
      </div>

      {/* ── Top edge highlight ───────────────────────────────── */}
      <div className="pointer-events-none absolute top-0 left-12 right-12 h-px bg-gradient-to-r from-transparent via-cyan-400/25 to-transparent" />

      {/* ── Grid texture ────────────────────────────────────── */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.018]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.2) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.2) 1px,transparent 1px)',
          backgroundSize: '52px 52px',
        }}
      />

      {/* ── Shimmer sweep (once on mount) ───────────────────── */}
      <ShimmerSweep className="rounded-3xl" />

      {/* ── Content ─────────────────────────────────────────── */}
      <div className="relative flex flex-col items-center text-center gap-6" dir="rtl">

        {/* Logo — dir="ltr" so Latin letters never flip in RTL context */}
        <TextIn delay={0}>
          <div className="flex items-end gap-0 select-none" aria-label="SIRAJ" dir="ltr">
            {['S', 'I', 'R', 'A', 'J'].map((letter) => (
              <div key={letter} className="relative px-[0.12em]">
                <span
                  className="block text-[2.6rem] md:text-[3.4rem] font-black text-white leading-none"
                  style={{
                    letterSpacing: '0.05em',
                    fontFamily: 'var(--font-sans)',
                    fontStretch: 'expanded',
                  }}
                >
                  {letter}
                </span>
                {letter === 'A' && (
                  <span className="absolute left-1/2 -translate-x-1/2 -bottom-2.5 w-[7px] h-[7px] rounded-full bg-cyan-400 shadow-[0_0_10px_3px_rgba(34,211,238,0.5)]" />
                )}
              </div>
            ))}
          </div>
        </TextIn>

        {/* Headline ────────────────────────────────────────── */}
        <TextIn delay={130} className="mt-3">
          <h1
            className="font-bold text-white"
            style={{
              fontSize: 'clamp(1.75rem, 4.5vw, 3rem)',
              lineHeight: 1.25,
              letterSpacing: '-0.01em',
            }}
          >
            اتخذ قرارات الشراء
            <br />
            <span className="text-cyan-400 drop-shadow-[0_0_24px_rgba(34,211,238,0.35)]">
              خلال دقائق بدل أيام
            </span>
          </h1>
        </TextIn>

        {/* Subtext ─────────────────────────────────────────── */}
        <TextIn delay={230} className="mt-1">
          <p
            className="text-[15px] md:text-base text-gray-300 leading-[1.8] mx-auto"
            style={{ maxWidth: '42ch' }}
          >
            قارن العروض، اختر الأفضل، ووفّر التكاليف — بدون تعقيد
          </p>
        </TextIn>

        {/* CTA Buttons ─────────────────────────────────────── */}
        <TextIn delay={330} className="mt-4">
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <Link href="/rfqs/new">
              <button className="btn-cyan inline-flex items-center gap-2 px-7 py-[13px] rounded-xl bg-cyan-400 text-[#0A0F1B] text-[14.5px] font-bold shadow-[0_4px_24px_rgba(34,211,238,0.3)] w-[152px] justify-center">
                <Plus className="h-4 w-4 flex-shrink-0" />
                إنشاء طلب
              </button>
            </Link>
            <Link href="/rfqs">
              <button className="btn-ghost-hero inline-flex items-center gap-2 px-7 py-[13px] rounded-xl border border-white/[0.15] bg-white/[0.03] hover:bg-white/[0.07] text-gray-300 text-[14.5px] font-medium whitespace-nowrap justify-center">
                عرض الطلبات
                <ArrowLeft className="h-4 w-4 flex-shrink-0" />
              </button>
            </Link>
          </div>
        </TextIn>

        {/* Stats ───────────────────────────────────────────── */}
        <TextIn delay={440} className="mt-6 w-full max-w-sm">
          <div className="flex items-center justify-center gap-0 pt-6 border-t border-white/[0.06]">
            <div className="flex-1">
              <StatPill value={total}    label="إجمالي الطلبات" colorCls="text-white" />
            </div>
            <div className="w-px h-10 bg-white/[0.08] flex-shrink-0" />
            <div className="flex-1">
              <StatPill value={active}   label="نشطة الآن"      colorCls="text-cyan-400" />
            </div>
            <div className="w-px h-10 bg-white/[0.08] flex-shrink-0" />
            <div className="flex-1">
              <StatPill value={resCount} label="عروض مستلمة"    colorCls="text-violet-400" />
            </div>
          </div>
        </TextIn>

      </div>
    </div>
  )
}
