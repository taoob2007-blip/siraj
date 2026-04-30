'use client'

import { useEffect, useRef, useState } from 'react'

/* ── Staggered card entrance ─────────────────────────────────────────────── */
export function StaggerIn({
  children,
  index = 0,
  className = '',
}: {
  children: React.ReactNode
  index?: number
  className?: string
}) {
  const ref  = useRef<HTMLDivElement>(null)
  const [vis, setVis] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setVis(true), index * 70)
    return () => clearTimeout(t)
  }, [index])

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity:   vis ? 1 : 0,
        transform: vis ? 'translateY(0)' : 'translateY(14px)',
        transition: 'opacity 420ms cubic-bezier(.4,0,.2,1), transform 420ms cubic-bezier(.4,0,.2,1)',
      }}
    >
      {children}
    </div>
  )
}

/* ── Animated count-up number ────────────────────────────────────────────── */
export function CountUp({
  value,
  suffix = '',
  duration = 900,
  className = '',
}: {
  value: number
  suffix?: string
  duration?: number
  className?: string
}) {
  const [display, setDisplay] = useState(0)
  const raf = useRef<number | null>(null)

  useEffect(() => {
    if (value === 0) { setDisplay(0); return }
    const start = performance.now()
    function tick(now: number) {
      const p = Math.min((now - start) / duration, 1)
      // ease-out cubic
      const eased = 1 - Math.pow(1 - p, 3)
      setDisplay(Math.round(eased * value))
      if (p < 1) raf.current = requestAnimationFrame(tick)
    }
    raf.current = requestAnimationFrame(tick)
    return () => { if (raf.current) cancelAnimationFrame(raf.current) }
  }, [value, duration])

  return <span className={className}>{display}{suffix}</span>
}

/* ── Live dot ─────────────────────────────────────────────────────────────── */
export function LiveDot() {
  return (
    <span className="relative flex h-2 w-2">
      <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60 animate-ping" />
      <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
    </span>
  )
}

/* ── Shimmer sweep (once on mount) ───────────────────────────────────────── */
export function ShimmerSweep({ className = '' }: { className?: string }) {
  const [active, setActive] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setActive(true), 300)
    return () => clearTimeout(t)
  }, [])

  return (
    <div
      className={`pointer-events-none absolute inset-0 ${className}`}
      style={{
        background: active
          ? 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.06) 50%, transparent 60%)'
          : 'transparent',
        backgroundSize: '200% 100%',
        backgroundPosition: active ? '200% 0' : '-100% 0',
        transition: active ? 'background-position 900ms ease' : 'none',
      }}
    />
  )
}

/* ── Animated progress bar ───────────────────────────────────────────────── */
export function AnimatedBar({
  value,
  colorCls = 'bg-blue-500',
}: {
  value: number
  colorCls?: string
}) {
  const [width, setWidth] = useState(0)
  useEffect(() => {
    const t = setTimeout(() => setWidth(value), 150)
    return () => clearTimeout(t)
  }, [value])

  return (
    <div className="h-0.5 w-full rounded-full bg-white/[0.06] overflow-hidden">
      <div
        className={`h-full rounded-full ${colorCls}`}
        style={{ width: `${width}%`, transition: 'width 800ms cubic-bezier(.4,0,.2,1)' }}
      />
    </div>
  )
}
