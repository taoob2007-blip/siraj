export const dynamic = 'force-dynamic'

import Link from 'next/link'
import {
  Brain, Zap, Shield, TrendingUp,
  FileText, Users, BarChart3, Trophy, CheckCircle,
  Sparkles, Clock, MessageSquare, Activity, Plus, ArrowRight,
} from 'lucide-react'
import {
  StaggerIn, CountUp, LiveDot, AnimatedBar,
} from '@/components/DashboardShell'
import { HeroBanner } from '@/components/HeroBanner'
import { getServerSupabaseClient } from '@/lib/supabase/server'

// ── Data ─────────────────────────────────────────────────────────────────────

async function getKPIs() {
  try {
    const supabase = await getServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { total: 0, active: 0, resCount: 0, avgRate: 0 }

    const [rfqsResult, responsesResult, invitesResult] = await Promise.all([
      supabase.from('rfqs').select('status').eq('user_id', user.id),
      supabase.from('responses').select('id', { count: 'exact', head: true })
        .in('rfq_id', (await supabase.from('rfqs').select('id').eq('user_id', user.id)).data?.map((r) => r.id) ?? []),
      supabase.from('rfq_invites').select('id', { count: 'exact', head: true })
        .in('rfq_id', (await supabase.from('rfqs').select('id').eq('user_id', user.id)).data?.map((r) => r.id) ?? []),
    ])

    const rfqs     = rfqsResult.data ?? []
    const total    = rfqs.length
    const active   = rfqs.filter((r) => r.status === 'active').length
    const resCount = responsesResult.count ?? 0
    const invCount = invitesResult.count ?? 0
    const avgRate  = invCount > 0 ? Math.round((resCount / invCount) * 100) : 0
    return { total, active, resCount, avgRate }
  } catch {
    return { total: 0, active: 0, resCount: 0, avgRate: 0 }
  }
}

// ── KPI Card ─────────────────────────────────────────────────────────────────

function KPICard({
  icon: Icon,
  iconCls,
  glowCls,
  borderHover,
  label,
  value,
  isPercent,
  sub,
  trend,
  barColor,
  barValue,
  index,
}: {
  icon: React.ElementType
  iconCls: string
  glowCls: string
  borderHover: string
  label: string
  value: number
  isPercent?: boolean
  sub: string
  trend?: { up: boolean; label: string }
  barColor: string
  barValue: number
  index: number
}) {
  return (
    <StaggerIn index={index} className="h-full">
      <div className={`kpi-card ring-glow relative overflow-hidden rounded-2xl border border-white/[0.07] p-5 group h-full cursor-default ${borderHover}`}>
        {/* ambient glow */}
        <div className={`pointer-events-none absolute -top-12 -right-12 h-32 w-32 rounded-full blur-3xl opacity-10 group-hover:opacity-25 transition-opacity duration-500 ${glowCls}`} />
        {/* inner highlight top edge */}
        <div className="pointer-events-none absolute top-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />

        <div className="relative space-y-4">
          {/* label + icon */}
          <div className="flex items-start justify-between">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">{label}</p>
            <div className={`p-2 rounded-xl border transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg ${iconCls}`}>
              <Icon className="h-3.5 w-3.5" />
            </div>
          </div>

          {/* value */}
          <div>
            <p className="text-3xl font-bold text-white leading-none tabular-nums">
              <CountUp value={value} suffix={isPercent ? '%' : ''} />
            </p>
            <p className="text-xs text-gray-400 mt-1.5 leading-relaxed">{sub}</p>
          </div>

          {/* micro progress bar */}
          <AnimatedBar value={barValue} colorCls={barColor} />

          {/* trend */}
          {trend && (
            <div className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full border ${
              trend.up
                ? 'bg-emerald-500/8 text-emerald-400 border-emerald-500/20'
                : 'bg-gray-800/60 text-gray-500 border-white/[0.05]'
            }`}>
              <TrendingUp className={`h-2.5 w-2.5 ${!trend.up ? 'rotate-180' : ''}`} />
              {trend.label}
            </div>
          )}
        </div>
      </div>
    </StaggerIn>
  )
}

// ── Step Card ─────────────────────────────────────────────────────────────────

function StepCard({
  num, icon: Icon, title, desc, color,
}: {
  num: number; icon: React.ElementType; title: string; desc: string; color: string
}) {
  return (
    <div className="flex flex-col items-center text-center gap-3 flex-1 min-w-0 group">
      <div className={`relative h-14 w-14 rounded-2xl flex items-center justify-center border transition-all duration-250 group-hover:scale-110 group-hover:shadow-lg ${color}`}>
        <Icon className="h-6 w-6" />
        <span className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-[#080c14] border border-white/[0.08] text-[10px] font-bold text-gray-400 flex items-center justify-center">
          {num}
        </span>
      </div>
      <div>
        <p className="text-sm font-semibold text-white">{title}</p>
        <p className="text-sm text-gray-400 mt-0.5 leading-relaxed">{desc}</p>
      </div>
    </div>
  )
}

// ── Feature Card ──────────────────────────────────────────────────────────────

function FeatureCard({
  icon: Icon, iconCls, title, desc,
}: {
  icon: React.ElementType; iconCls: string; title: string; desc: string
}) {
  return (
    <div className="feature-card group flex items-start gap-3 p-4 rounded-xl border border-white/[0.06] bg-white/[0.02]">
      <div className={`p-2 rounded-lg border shrink-0 transition-transform duration-250 group-hover:scale-110 ${iconCls}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <p className="text-sm font-semibold text-white">{title}</p>
        <p className="text-sm text-gray-400 mt-0.5 leading-relaxed">{desc}</p>
      </div>
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default async function Home() {
  const { total, active, resCount, avgRate } = await getKPIs()

  return (
    <div className="space-y-10 animate-fade-in">

      {/* ════ HERO — Command Centre ════ */}
      <StaggerIn index={0}>
        <HeroBanner total={total} active={active} resCount={resCount} />
      </StaggerIn>

      {/* ════ KPI CARDS ════ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          label="Total RFQs" value={total} sub={`${active} currently active`}
          icon={FileText} iconCls="bg-blue-500/10 border-blue-500/20 text-blue-400"
          glowCls="bg-blue-500" borderHover="hover:border-blue-500/20"
          barColor="bg-gradient-to-r from-blue-600 to-blue-400" barValue={Math.min(total * 10, 100)}
          trend={total > 0 ? { up: true, label: 'Growing pipeline' } : undefined}
          index={1}
        />
        <KPICard
          label="Active RFQs" value={active} sub="accepting quotes now"
          icon={Activity} iconCls="bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
          glowCls="bg-emerald-500" borderHover="hover:border-emerald-500/20"
          barColor="bg-gradient-to-r from-emerald-600 to-emerald-400" barValue={total > 0 ? Math.round((active / total) * 100) : 0}
          trend={active > 0 ? { up: true, label: 'Live & receiving' } : undefined}
          index={2}
        />
        <KPICard
          label="Total Responses" value={resCount} sub="supplier quotes received"
          icon={MessageSquare} iconCls="bg-violet-500/10 border-violet-500/20 text-violet-400"
          glowCls="bg-violet-500" borderHover="hover:border-violet-500/20"
          barColor="bg-gradient-to-r from-violet-600 to-violet-400" barValue={Math.min(resCount * 5, 100)}
          index={3}
        />
        <KPICard
          label="Avg Response Rate" value={avgRate} isPercent sub="across all RFQs"
          icon={BarChart3} iconCls="bg-orange-500/10 border-orange-500/20 text-orange-400"
          glowCls="bg-orange-500" borderHover="hover:border-orange-500/20"
          barColor="bg-gradient-to-r from-orange-600 to-amber-400" barValue={avgRate}
          trend={avgRate >= 50 ? { up: true, label: 'Strong engagement' } : undefined}
          index={4}
        />
      </div>

      {/* ════ HOW IT WORKS ════ */}
      <StaggerIn index={5}>
        <div className="rounded-2xl border border-white/[0.07] bg-gradient-to-br from-[#0d1220] to-[#090d18] p-8 relative overflow-hidden">
          <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 h-px w-2/3 bg-gradient-to-r from-transparent via-white/[0.07] to-transparent" />
          <div className="mb-8 text-center">
            <p className="text-xs font-semibold text-blue-400 uppercase tracking-widest mb-1.5">Process</p>
            <h2 className="text-xl font-semibold text-white">How SIRAJ Works</h2>
          </div>
          <div className="flex flex-col md:flex-row items-start">
            <StepCard num={1} icon={FileText} title="Create RFQ"      desc="Create your request and invite suppliers to submit quotes." color="bg-blue-500/10 border-blue-500/25 text-blue-400" />
            <div className="hidden md:flex items-center justify-center w-8 mt-7 shrink-0"><ArrowRight className="h-4 w-4 text-gray-700" /></div>
            <StepCard num={2} icon={Users}    title="Receive Quotes"  desc="Suppliers submit their best offers via a public form."      color="bg-violet-500/10 border-violet-500/25 text-violet-400" />
            <div className="hidden md:flex items-center justify-center w-8 mt-7 shrink-0"><ArrowRight className="h-4 w-4 text-gray-700" /></div>
            <StepCard num={3} icon={Brain}    title="AI Analysis"     desc="AI ranks and scores suppliers on price, speed, and value."  color="bg-indigo-500/10 border-indigo-500/25 text-indigo-400" />
            <div className="hidden md:flex items-center justify-center w-8 mt-7 shrink-0"><ArrowRight className="h-4 w-4 text-gray-700" /></div>
            <StepCard num={4} icon={Trophy}   title="Make Decision"   desc="Choose the best supplier with full AI-backed confidence."   color="bg-amber-500/10 border-amber-500/25 text-amber-400" />
          </div>
        </div>
      </StaggerIn>

      {/* ════ FEATURES + CTA ════ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Features */}
        <StaggerIn index={6} className="lg:col-span-2 space-y-4">
          <h2 className="text-sm font-semibold text-white">Why choose SIRAJ?</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FeatureCard icon={TrendingUp} iconCls="bg-emerald-500/10 border-emerald-500/20 text-emerald-400" title="Save up to 30% on costs"      desc="AI finds the best value by analyzing price, delivery, and reliability together." />
            <FeatureCard icon={Zap}        iconCls="bg-blue-500/10 border-blue-500/20 text-blue-400"          title="Reduce sourcing time by 70%"  desc="Automate RFQ creation, supplier comparison, and final recommendations." />
            <FeatureCard icon={Shield}     iconCls="bg-violet-500/10 border-violet-500/20 text-violet-400"    title="Trusted by leading companies" desc="Secure, reliable, and built for enterprise procurement workflows." />
            <FeatureCard icon={BarChart3}  iconCls="bg-orange-500/10 border-orange-500/20 text-orange-400"    title="Data-driven decisions"        desc="Real insights from real data — no gut feeling, just clear AI analysis." />
          </div>
        </StaggerIn>

        {/* Right panel */}
        <StaggerIn index={7} className="flex flex-col gap-4">

          {/* CTA card */}
          <div className="flex-1 rounded-2xl border border-blue-500/20 bg-gradient-to-br from-blue-950/60 via-indigo-950/40 to-violet-950/50 p-6 flex flex-col gap-4 relative overflow-hidden">
            <div className="pointer-events-none absolute -top-16 -right-16 h-40 w-40 rounded-full bg-blue-500/10 blur-2xl" />
            <div className="pointer-events-none absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-blue-400/20 to-transparent" />
            <div className="relative p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 w-fit">
              <Sparkles className="h-5 w-5 text-blue-400" />
            </div>
            <div className="relative">
              <h3 className="text-sm font-semibold text-white leading-snug">Ready to transform your procurement?</h3>
              <p className="text-sm text-gray-400 mt-1.5 leading-relaxed">
                Join 1,000+ teams using SIRAJ to make faster, smarter supplier decisions.
              </p>
            </div>
            <Link href="/rfqs/new" className="mt-auto relative">
              <button className="btn-primary w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold shadow-lg shadow-blue-600/25">
                Get Started Free
              </button>
            </Link>
            <p className="text-xs text-gray-500 text-center flex items-center justify-center gap-1 relative">
              <CheckCircle className="h-3 w-3" />
              No credit card required
            </p>
          </div>

          {/* Live widget */}
          <div className="rounded-2xl border border-white/[0.07] bg-gradient-to-br from-[#111827] to-[#0d1220] p-5 relative overflow-hidden">
            <div className="pointer-events-none absolute -bottom-10 -right-10 h-28 w-28 rounded-full bg-emerald-500/6 blur-2xl" />
            {/* header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <LiveDot />
                <p className="text-xs font-semibold text-gray-300 uppercase tracking-widest">Live Stats</p>
              </div>
              <span className="text-xs text-gray-500">Updated just now</span>
            </div>

            <div className="space-y-0">
              {([
                { label: 'RFQs Created',    value: total,    colorCls: 'bg-gradient-to-r from-blue-600 to-blue-400' },
                { label: 'Active Now',      value: active,   colorCls: 'bg-gradient-to-r from-emerald-600 to-emerald-400' },
                { label: 'Quotes Received', value: resCount, colorCls: 'bg-gradient-to-r from-violet-600 to-violet-400' },
              ] as const).map(({ label, value, colorCls }, i) => (
                <div key={label} className="py-2.5 border-t border-white/[0.04] first:border-0 first:pt-0">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm text-gray-400">{label}</span>
                    <span className="text-sm font-bold text-white tabular-nums">
                      <CountUp value={value} />
                    </span>
                  </div>
                  <AnimatedBar
                    value={value === total ? Math.min(total * 10, 100) : value === active && total > 0 ? Math.round((active / total) * 100) : Math.min(value * 5, 100)}
                    colorCls={colorCls}
                  />
                </div>
              ))}
            </div>
          </div>
        </StaggerIn>
      </div>

      {/* ════ EMPTY STATE ════ */}
      {total === 0 && (
        <StaggerIn index={8}>
          <div className="rounded-2xl border border-dashed border-white/[0.08] bg-white/[0.01] p-14 flex flex-col items-center gap-5 text-center">
            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
              <FileText className="h-8 w-8 text-gray-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-300">No RFQs yet</p>
              <p className="text-sm text-gray-400 mt-1 leading-relaxed max-w-xs mx-auto">
                Create your first request for quotation and let AI do the heavy lifting.
              </p>
            </div>
            <Link href="/rfqs/new">
              <button className="btn-primary inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold shadow-lg shadow-blue-600/25">
                <Plus className="h-4 w-4" />
                Create First RFQ
              </button>
            </Link>
          </div>
        </StaggerIn>
      )}

      {/* ════ ACTIVE BAR ════ */}
      {total > 0 && (
        <StaggerIn index={8}>
          <div className="flex items-center justify-between rounded-2xl border border-white/[0.06] bg-gradient-to-r from-[#0f1827] to-[#0d1220] px-6 py-4 relative overflow-hidden">
            <div className="pointer-events-none absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/15 to-transparent" />
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
                <Clock className="h-4 w-4 text-blue-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">
                  You have <span className="text-blue-400 tabular-nums">{active}</span> active RFQ{active !== 1 ? 's' : ''}
                </p>
                <p className="text-xs text-gray-400 leading-relaxed">Waiting for supplier responses</p>
              </div>
            </div>
            <Link href="/rfqs">
              <button className="btn-ghost inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.07] text-gray-300 text-sm font-medium">
                View All
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </Link>
          </div>
        </StaggerIn>
      )}

    </div>
  )
}
