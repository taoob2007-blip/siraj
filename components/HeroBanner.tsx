'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Plus, ArrowRight, Brain, Sparkles } from 'lucide-react'
import { CountUp, ShimmerSweep } from '@/components/DashboardShell'

/* ── Tiny hook: tracks mouse position normalised to [-1, 1] ── */
function useMouseParallax(strength = 8) {
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

/* ── Staggered text element ─────────────────────────────────── */
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
        opacity:   vis ? 1 : 0,
        transform: vis ? 'translateY(0)' : 'translateY(10px)',
        transition: 'opacity 500ms cubic-bezier(.4,0,.2,1), transform 500ms cubic-bezier(.4,0,.2,1)',
      }}
    >
      {children}
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
  const parallax = useMouseParallax(6)

  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/[0.08] p-10 md:p-14 hero-bg-drift">

      {/* ── Animated gradient orbs (parallax layer) ─────────── */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{ transform: `translate(${parallax.x * 0.4}px, ${parallax.y * 0.4}px)`, transition: 'transform 120ms linear' }}
      >
        <div className="absolute -top-28 -left-28 h-80 w-80 rounded-full bg-blue-600/10 blur-3xl hero-orb-drift" />
        <div className="absolute -bottom-28 -right-28 h-80 w-80 rounded-full bg-violet-600/10 blur-3xl hero-orb-drift-reverse" />
        <div className="absolute top-1/3 right-1/4 h-40 w-40 rounded-full bg-indigo-500/5 blur-2xl hero-orb-drift-slow" />
      </div>

      {/* top edge highlight */}
      <div className="pointer-events-none absolute top-0 left-12 right-12 h-px bg-gradient-to-r from-transparent via-blue-400/20 to-transparent" />

      {/* grid texture */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.15) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.15) 1px,transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />

      {/* shimmer sweep — fires once on mount */}
      <ShimmerSweep className="rounded-3xl" />

      <div className="relative flex flex-col lg:flex-row items-center gap-14">

        {/* ── Left ─────────────────────────────────────────── */}
        <div
          className="flex-1 max-w-[600px] space-y-7"
          dir="rtl"
          style={{ fontFamily: 'var(--font-arabic), var(--font-sans)' }}
        >

          {/* badge */}
          <TextIn delay={80}>
            <div className="badge-pulse inline-flex items-center gap-2 px-4 py-2 rounded-full border border-blue-500/25 bg-blue-500/[0.08] text-[13px] text-blue-300 font-medium tracking-wide w-fit">
              <Sparkles className="h-3 w-3 animate-live-pulse flex-shrink-0" />
              منصة ذكية لإدارة المشتريات
            </div>
          </TextIn>

          {/* title */}
          <TextIn delay={160}>
            <h1
              className="font-bold text-white"
              style={{
                fontSize: 'clamp(2.25rem, 5vw, 3.25rem)',
                lineHeight: 1.25,
                letterSpacing: '-0.01em',
              }}
            >
              اتخذ قرارات الشراء
              <br />
              <span className="shimmer-text">خلال دقائق</span>
            </h1>
          </TextIn>

          {/* subtitle */}
          <TextIn delay={240}>
            <p
              className="text-gray-400 leading-[1.8]"
              style={{ fontSize: '1rem', maxWidth: '440px' }}
            >
              قارن العروض، اختر الأفضل، ووفّر التكاليف — بسهولة
            </p>
          </TextIn>

          {/* buttons */}
          <TextIn delay={320}>
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <Link href="/rfqs/new">
                <button className="btn-primary inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white text-[15px] font-semibold shadow-lg shadow-blue-600/25 tracking-wide">
                  <Plus className="h-[15px] w-[15px]" />
                  إنشاء طلب
                </button>
              </Link>
              <Link href="/rfqs">
                <button className="btn-ghost inline-flex items-center gap-2 px-6 py-3 rounded-2xl border border-white/[0.10] bg-white/[0.03] hover:bg-white/[0.07] text-gray-300 text-[15px] font-medium tracking-wide transition-colors">
                  عرض الطلبات
                  <ArrowRight className="h-[15px] w-[15px]" />
                </button>
              </Link>
            </div>
          </TextIn>

          {/* micro stat strip */}
          {total > 0 && (
            <TextIn delay={400}>
              <div className="flex items-center gap-6 pt-3 border-t border-white/[0.06]">
                <div>
                  <p className="text-xl font-bold text-white tabular-nums"><CountUp value={total} /></p>
                  <p className="text-xs text-gray-500 mt-0.5">إجمالي الطلبات</p>
                </div>
                <div className="w-px h-9 bg-white/[0.07]" />
                <div>
                  <p className="text-xl font-bold text-emerald-400 tabular-nums"><CountUp value={active} /></p>
                  <p className="text-xs text-gray-500 mt-0.5">نشطة الآن</p>
                </div>
                <div className="w-px h-9 bg-white/[0.07]" />
                <div>
                  <p className="text-xl font-bold text-violet-400 tabular-nums"><CountUp value={resCount} /></p>
                  <p className="text-xs text-gray-500 mt-0.5">عروض مستلمة</p>
                </div>
              </div>
            </TextIn>
          )}
        </div>

        {/* ── Right — AI orb (parallax) ─────────────────────── */}
        <div
          className="flex-shrink-0 flex items-center justify-center"
          style={{ transform: `translate(${-parallax.x * 1.2}px, ${-parallax.y * 1.2}px)`, transition: 'transform 200ms linear' }}
        >
          <div className="relative h-52 w-52 float">
            {/* outer ring — slow clockwise */}
            <div className="absolute inset-0 rounded-full border border-blue-500/15 animate-spin" style={{ animationDuration: '14s' }} />
            {/* inner ring — counter-clockwise */}
            <div className="absolute inset-5 rounded-full border border-violet-500/15 animate-spin" style={{ animationDuration: '9s', animationDirection: 'reverse' }} />
            {/* core orb with pulse glow */}
            <div className="absolute inset-10 rounded-full bg-gradient-to-br from-blue-600/25 to-violet-600/25 border border-blue-500/25 flex items-center justify-center brain-pulse-glow">
              {/* brain icon: very slow micro-rotation + hover scale */}
              <Brain className="h-16 w-16 text-blue-300 brain-icon-anim" />
            </div>
            {/* orbit dots */}
            {[0, 60, 120, 180, 240, 300].map((deg) => (
              <div
                key={deg}
                className="absolute h-2 w-2 rounded-full bg-blue-400"
                style={{
                  top:  `calc(50% + ${Math.sin((deg * Math.PI) / 180) * 80}px - 4px)`,
                  left: `calc(50% + ${Math.cos((deg * Math.PI) / 180) * 80}px - 4px)`,
                  opacity: 0.3 + (deg % 120) / 300,
                }}
              />
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
