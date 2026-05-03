export const dynamic = 'force-dynamic'

import Link from 'next/link'
import {
  Brain, Zap, Shield, TrendingUp,
  FileText, Users, BarChart3, Trophy, CheckCircle,
  Sparkles, Clock, MessageSquare, Activity, Plus, ArrowRight,
  FileSignature, TrendingDown, Target, AlertCircle,
} from 'lucide-react'
import {
  StaggerIn, CountUp, LiveDot, AnimatedBar,
} from '@/components/DashboardShell'
import { HeroBanner } from '@/components/HeroBanner'
import { getServerSupabaseClient } from '@/lib/supabase/server'
import { getUserSubscription } from '@/lib/subscription'
import { ProGate, UpgradeCard } from '@/components/ProGate'

// ── Data ──────────────────────────────────────────────────────────────────────

async function getKPIs(userId: string) {
  try {
    const supabase = await getServerSupabaseClient()
    const { data: userRfqs } = await supabase.from('rfqs').select('id, status').eq('user_id', userId)
    const rfqIds = (userRfqs ?? []).map((r) => r.id)

    const [responsesResult, invitesResult, contractsResult, suppliersResult] = await Promise.all([
      rfqIds.length > 0
        ? supabase.from('responses').select('id', { count: 'exact', head: true }).in('rfq_id', rfqIds)
        : Promise.resolve({ count: 0 }),
      rfqIds.length > 0
        ? supabase.from('rfq_invites').select('id', { count: 'exact', head: true }).in('rfq_id', rfqIds)
        : Promise.resolve({ count: 0 }),
      supabase.from('contracts').select('status').eq('user_id', userId),
      supabase.from('suppliers').select('id', { count: 'exact', head: true }).eq('user_id', userId),
    ])

    const rfqs        = userRfqs ?? []
    const total       = rfqs.length
    const active      = rfqs.filter((r) => r.status === 'active').length
    const resCount    = (responsesResult as { count: number | null }).count ?? 0
    const invCount    = (invitesResult   as { count: number | null }).count ?? 0
    const supplierCount = (suppliersResult as { count: number | null }).count ?? 0
    const avgRate     = invCount > 0 ? Math.round((resCount / invCount) * 100) : 0
    const allContracts = contractsResult.data ?? []
    const contracts   = allContracts.length
    const activeDeals = allContracts.filter((c) => c.status === 'pending').length

    return { total, active, resCount, avgRate, contracts, activeDeals, supplierCount }
  } catch {
    return { total: 0, active: 0, resCount: 0, avgRate: 0, contracts: 0, activeDeals: 0, supplierCount: 0 }
  }
}

async function getRecentActivity(userId: string) {
  try {
    const supabase = await getServerSupabaseClient()
    const [rfqsRes, contractsRes, responsesRes] = await Promise.all([
      supabase.from('rfqs').select('id, title, status, created_at').eq('user_id', userId)
        .order('created_at', { ascending: false }).limit(4),
      supabase.from('contracts').select('id, title, status, created_at').eq('user_id', userId)
        .order('created_at', { ascending: false }).limit(3),
      supabase.from('responses').select('id, supplier_email, price, created_at, rfq_id').order('created_at', { ascending: false }).limit(4),
    ])
    return {
      rfqs:      rfqsRes.data      ?? [],
      contracts: contractsRes.data ?? [],
      responses: responsesRes.data ?? [],
    }
  } catch {
    return { rfqs: [], contracts: [], responses: [] }
  }
}

async function getAIInsights(userId: string) {
  try {
    const supabase = await getServerSupabaseClient()
    const rfqIds = await supabase.from('rfqs').select('id').eq('user_id', userId)
      .then(r => (r.data ?? []).map(x => x.id))

    if (rfqIds.length === 0) return null

    const [responsesRes, invitesRes] = await Promise.all([
      supabase.from('responses').select('supplier_email, price, delivery_days, rfq_id').in('rfq_id', rfqIds),
      supabase.from('rfq_invites').select('rfq_id, responded').in('rfq_id', rfqIds),
    ])

    const responses = responsesRes.data ?? []
    const invites   = invitesRes.data   ?? []

    if (responses.length === 0) return null

    // Top supplier by combined score (low price + fast delivery)
    const bySupplier: Record<string, { prices: number[]; days: number[] }> = {}
    for (const r of responses) {
      if (!bySupplier[r.supplier_email]) bySupplier[r.supplier_email] = { prices: [], days: [] }
      if (r.price)         bySupplier[r.supplier_email].prices.push(Number(r.price))
      if (r.delivery_days) bySupplier[r.supplier_email].days.push(Number(r.delivery_days))
    }
    const prices   = responses.map(r => Number(r.price)).filter(p => p > 0)
    const avgPrice = prices.length ? prices.reduce((a, b) => a + b, 0) / prices.length : 0
    const minPrice = prices.length ? Math.min(...prices) : 0
    const savings  = avgPrice > 0 ? Math.round(((avgPrice - minPrice) / avgPrice) * 100) : 0

    const invitesByRfq: Record<string, number> = {}
    const respondedByRfq: Record<string, number> = {}
    for (const inv of invites) {
      invitesByRfq[inv.rfq_id]   = (invitesByRfq[inv.rfq_id]   ?? 0) + 1
      if (inv.responded) respondedByRfq[inv.rfq_id] = (respondedByRfq[inv.rfq_id] ?? 0) + 1
    }

    // RFQ with lowest response rate
    let bottleneckRfqId = ''
    let lowestRate = Infinity
    for (const [rfqId, total] of Object.entries(invitesByRfq)) {
      const rate = (respondedByRfq[rfqId] ?? 0) / total
      if (rate < lowestRate) { lowestRate = rate; bottleneckRfqId = rfqId }
    }

    const topSupplier = Object.entries(bySupplier).sort((a, b) => {
      const scoreA = (a[1].prices[0] ?? Infinity) + (a[1].days[0] ?? Infinity) * 10
      const scoreB = (b[1].prices[0] ?? Infinity) + (b[1].days[0] ?? Infinity) * 10
      return scoreA - scoreB
    })[0]?.[0] ?? null

    return {
      topSupplier,
      savings,
      avgPrice: Math.round(avgPrice),
      totalQuotes: responses.length,
      bottleneckRate: Math.round(lowestRate * 100),
    }
  } catch {
    return null
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60_000)
  if (m < 1) return 'Just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

const STATUS_STYLES: Record<string, string> = {
  active:  'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
  closed:  'bg-gray-500/10 border-gray-500/20 text-gray-400',
  pending: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
  signed:  'bg-blue-500/10 border-blue-500/20 text-blue-400',
  draft:   'bg-gray-600/10 border-gray-600/20 text-gray-500',
}

// ── Sub-components ────────────────────────────────────────────────────────────

function KPICard({
  icon: Icon, iconCls, glowCls, borderHover,
  label, value, isPercent, sub, trend, barColor, barValue, index,
}: {
  icon: React.ElementType; iconCls: string; glowCls: string; borderHover: string
  label: string; value: number; isPercent?: boolean; sub: string
  trend?: { up: boolean; label: string }; barColor: string; barValue: number; index: number
}) {
  return (
    <StaggerIn index={index} className="h-full">
      <div className={`relative overflow-hidden rounded-2xl border border-white/[0.07] p-5 group h-full cursor-default ${borderHover}`}>
        <div className={`pointer-events-none absolute -top-12 -right-12 h-32 w-32 rounded-full blur-3xl opacity-10 group-hover:opacity-25 transition-opacity duration-500 ${glowCls}`} />
        <div className="pointer-events-none absolute top-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />
        <div className="relative space-y-4">
          <div className="flex items-start justify-between">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">{label}</p>
            <div className={`p-2 rounded-xl border transition-all duration-300 group-hover:scale-110 ${iconCls}`}>
              <Icon className="h-3.5 w-3.5" />
            </div>
          </div>
          <div>
            <p className="text-3xl font-bold text-white leading-none tabular-nums">
              <CountUp value={value} suffix={isPercent ? '%' : ''} />
            </p>
            <p className="text-xs text-gray-400 mt-1.5">{sub}</p>
          </div>
          <AnimatedBar value={barValue} colorCls={barColor} />
          {trend && (
            <div className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full border ${
              trend.up ? 'bg-emerald-500/8 text-emerald-400 border-emerald-500/20' : 'bg-gray-800/60 text-gray-500 border-white/[0.05]'
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

// ── AI Insights Card (real data, shown to pro) ────────────────────────────────

function AIInsightsReal({ data }: { data: NonNullable<Awaited<ReturnType<typeof getAIInsights>>> }) {
  return (
    <div className="rounded-2xl border border-violet-500/20 bg-gradient-to-br from-violet-950/40 to-blue-950/30 p-6 space-y-5 relative overflow-hidden h-full">
      <div className="pointer-events-none absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-violet-400/20 to-transparent" />
      <div className="pointer-events-none absolute -top-16 -right-16 h-40 w-40 rounded-full bg-violet-500/10 blur-3xl" />
      <div className="relative flex items-center gap-2.5">
        <div className="p-2 rounded-xl bg-violet-500/10 border border-violet-500/20">
          <Brain className="h-4 w-4 text-violet-400" />
        </div>
        <div>
          <p className="text-sm font-semibold text-white">AI Insights</p>
          <p className="text-[11px] text-violet-400">Powered by SIRAJ intelligence</p>
        </div>
      </div>
      <div className="relative grid grid-cols-1 gap-3">
        <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06] space-y-1.5">
          <div className="flex items-center gap-2">
            <Target className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
            <p className="text-xs font-semibold text-emerald-400">Cost Savings Opportunity</p>
          </div>
          <p className="text-2xl font-bold text-white">{data.savings}%</p>
          <p className="text-xs text-gray-500">potential savings vs. avg quote · avg ${data.avgPrice.toLocaleString()}</p>
        </div>
        {data.topSupplier && (
          <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06] space-y-1.5">
            <div className="flex items-center gap-2">
              <Trophy className="h-3.5 w-3.5 text-amber-400 shrink-0" />
              <p className="text-xs font-semibold text-amber-400">Top Supplier</p>
            </div>
            <p className="text-sm font-semibold text-white truncate">{data.topSupplier}</p>
            <p className="text-xs text-gray-500">best price/speed combination</p>
          </div>
        )}
        <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06] space-y-1.5">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-3.5 w-3.5 text-blue-400 shrink-0" />
            <p className="text-xs font-semibold text-blue-400">Quote Pipeline</p>
          </div>
          <p className="text-2xl font-bold text-white">{data.totalQuotes}</p>
          <p className="text-xs text-gray-500">total supplier quotes received</p>
        </div>
      </div>
    </div>
  )
}

function AIInsightsMock() {
  return (
    <div className="rounded-2xl border border-violet-500/20 bg-gradient-to-br from-violet-950/40 to-blue-950/30 p-6 space-y-5 relative overflow-hidden h-full">
      <div className="flex items-center gap-2.5">
        <div className="p-2 rounded-xl bg-violet-500/10 border border-violet-500/20">
          <Brain className="h-4 w-4 text-violet-400" />
        </div>
        <div>
          <p className="text-sm font-semibold text-white">AI Insights</p>
          <p className="text-[11px] text-violet-400">Powered by SIRAJ intelligence</p>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-3">
        {[
          { icon: Target, color: 'text-emerald-400', label: 'Cost Savings Opportunity', val: '23%', sub: 'potential savings vs. avg quote' },
          { icon: Trophy, color: 'text-amber-400',   label: 'Top Supplier', val: 'supplier@acme.com', sub: 'best price/speed score' },
          { icon: BarChart3, color: 'text-blue-400', label: 'Quote Pipeline', val: '14', sub: 'total supplier quotes' },
        ].map(({ icon: Icon, color, label, val, sub }) => (
          <div key={label} className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06] space-y-1.5">
            <div className="flex items-center gap-2">
              <Icon className={`h-3.5 w-3.5 ${color} shrink-0`} />
              <p className={`text-xs font-semibold ${color}`}>{label}</p>
            </div>
            <p className="text-2xl font-bold text-white">{val}</p>
            <p className="text-xs text-gray-500">{sub}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Recent Activity ───────────────────────────────────────────────────────────

type ActivityItem = {
  id: string
  label: string
  sub: string
  time: string
  status?: string
  icon: React.ElementType
  iconCls: string
}

function ActivityRow({ item }: { item: ActivityItem }) {
  const Icon = item.icon
  const statusCls = item.status ? (STATUS_STYLES[item.status] ?? STATUS_STYLES.draft) : null
  return (
    <div className="flex items-center gap-3 py-2.5 border-t border-white/[0.04] first:border-0 first:pt-0">
      <div className={`p-1.5 rounded-lg border shrink-0 ${item.iconCls}`}>
        <Icon className="h-3 w-3" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-gray-200 truncate">{item.label}</p>
        <p className="text-[11px] text-gray-600 truncate">{item.sub}</p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {statusCls && (
          <span className={`text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded-md border ${statusCls}`}>
            {item.status}
          </span>
        )}
        <span className="text-[11px] text-gray-700 whitespace-nowrap">{item.time}</span>
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function Home() {
  const supabase = await getServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [kpis, subscription] = await Promise.all([
    getKPIs(user?.id ?? ''),
    getUserSubscription(),
  ])

  const { total, active, resCount, avgRate, contracts, activeDeals, supplierCount } = kpis
  const isPro = subscription === 'pro'

  const [activity, aiInsights] = await Promise.all([
    getRecentActivity(user?.id ?? ''),
    isPro ? getAIInsights(user?.id ?? '') : Promise.resolve(null),
  ])

  // Build activity feed
  const activityItems: ActivityItem[] = [
    ...activity.rfqs.map(r => ({
      id: `rfq-${r.id}`, label: r.title ?? 'Untitled RFQ',
      sub: 'RFQ', time: timeAgo(r.created_at), status: r.status,
      icon: FileText, iconCls: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
    })),
    ...activity.contracts.map(c => ({
      id: `cnt-${c.id}`, label: c.title ?? 'Contract',
      sub: 'Contract', time: timeAgo(c.created_at), status: c.status,
      icon: FileSignature, iconCls: 'bg-violet-500/10 border-violet-500/20 text-violet-400',
    })),
    ...activity.responses.map(r => ({
      id: `res-${r.id}`, label: r.supplier_email,
      sub: `Quote — $${Number(r.price ?? 0).toLocaleString()}`, time: timeAgo(r.created_at),
      icon: MessageSquare, iconCls: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
    })),
  ]
    .sort((a, b) => a.time.localeCompare(b.time))
    .slice(0, 8)

  return (
    <div className="space-y-8 animate-fade-in">


      {/* ════ HERO ════ */}
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
          trend={total > 0 ? { up: true, label: 'Growing' } : undefined} index={1}
        />
        <KPICard
          label="Active RFQs" value={active} sub="accepting quotes now"
          icon={Activity} iconCls="bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
          glowCls="bg-emerald-500" borderHover="hover:border-emerald-500/20"
          barColor="bg-gradient-to-r from-emerald-600 to-emerald-400"
          barValue={total > 0 ? Math.round((active / total) * 100) : 0}
          trend={active > 0 ? { up: true, label: 'Live' } : undefined} index={2}
        />
        <KPICard
          label="Suppliers" value={supplierCount} sub="in your network"
          icon={Users} iconCls="bg-indigo-500/10 border-indigo-500/20 text-indigo-400"
          glowCls="bg-indigo-500" borderHover="hover:border-indigo-500/20"
          barColor="bg-gradient-to-r from-indigo-600 to-indigo-400" barValue={Math.min(supplierCount * 5, 100)}
          index={3}
        />
        <KPICard
          label="Contracts" value={contracts} sub={`${activeDeals} pending signature`}
          icon={FileSignature} iconCls="bg-teal-500/10 border-teal-500/20 text-teal-400"
          glowCls="bg-teal-500" borderHover="hover:border-teal-500/20"
          barColor="bg-gradient-to-r from-teal-600 to-teal-400" barValue={Math.min(contracts * 15, 100)}
          trend={contracts > 0 ? { up: true, label: 'Closed deals' } : undefined} index={4}
        />
      </div>

      {/* ════ AI INSIGHTS + RECENT ACTIVITY ════ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* AI Insights — ProGate */}
        <StaggerIn index={5}>
          <ProGate
            isPro={isPro}
            feature="AI Insights"
            placeholder={<AIInsightsMock />}
          >
            {aiInsights
              ? <AIInsightsReal data={aiInsights} />
              : (
                <div className="rounded-2xl border border-violet-500/20 bg-gradient-to-br from-violet-950/40 to-blue-950/30 p-6 flex flex-col items-center justify-center gap-4 text-center h-full min-h-[280px]">
                  <Brain className="h-8 w-8 text-violet-400" />
                  <div>
                    <p className="text-sm font-semibold text-white">No data yet</p>
                    <p className="text-xs text-gray-500 mt-1">Create RFQs and collect quotes to unlock AI insights.</p>
                  </div>
                  <Link href="/rfqs/new">
                    <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition-all">
                      <Plus className="h-3.5 w-3.5" />
                      Create RFQ
                    </button>
                  </Link>
                </div>
              )
            }
          </ProGate>
        </StaggerIn>

        {/* Recent Activity */}
        <StaggerIn index={6} className="lg:col-span-2">
          <div className="rounded-2xl border border-white/[0.07] bg-[#0d1220] p-5 h-full">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <LiveDot />
                <p className="text-xs font-semibold text-gray-300 uppercase tracking-widest">Recent Activity</p>
              </div>
              <Link href="/rfqs" className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors">
                View all <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            {activityItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 gap-3 text-center">
                <Clock className="h-7 w-7 text-gray-700" />
                <p className="text-xs text-gray-600">No activity yet — create your first RFQ</p>
                <Link href="/rfqs/new">
                  <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-600/80 hover:bg-blue-600 text-white text-xs font-medium transition-all">
                    <Plus className="h-3 w-3" /> Create RFQ
                  </button>
                </Link>
              </div>
            ) : (
              <div>
                {activityItems.map(item => <ActivityRow key={item.id} item={item} />)}
              </div>
            )}
          </div>
        </StaggerIn>
      </div>

      {/* ════ UPGRADE CARD (free users only) ════ */}
      {!isPro && (
        <StaggerIn index={7}>
          <UpgradeCard />
        </StaggerIn>
      )}

      {/* ════ HOW IT WORKS ════ */}
      <StaggerIn index={8}>
        <div className="rounded-2xl border border-white/[0.07] bg-gradient-to-br from-[#0d1220] to-[#090d18] p-8 relative overflow-hidden">
          <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 h-px w-2/3 bg-gradient-to-r from-transparent via-white/[0.07] to-transparent" />
          <div className="mb-8 text-center">
            <p className="text-xs font-semibold text-blue-400 uppercase tracking-widest mb-1.5">Process</p>
            <h2 className="text-xl font-semibold text-white">How SIRAJ Works</h2>
          </div>
          <div className="flex flex-col md:flex-row items-start gap-4 md:gap-0">
            {[
              { num: 1, icon: FileText, title: 'Create RFQ',     desc: 'Create your request and invite suppliers.',   color: 'bg-blue-500/10 border-blue-500/25 text-blue-400' },
              { num: 2, icon: Users,    title: 'Receive Quotes', desc: 'Suppliers submit via a public form.',          color: 'bg-violet-500/10 border-violet-500/25 text-violet-400' },
              { num: 3, icon: Brain,    title: 'AI Analysis',    desc: 'AI ranks suppliers on price, speed, value.',  color: 'bg-indigo-500/10 border-indigo-500/25 text-indigo-400' },
              { num: 4, icon: Trophy,   title: 'Make Decision',  desc: 'Choose the best with AI-backed confidence.', color: 'bg-amber-500/10 border-amber-500/25 text-amber-400' },
            ].map((step, i, arr) => (
              <div key={step.num} className="flex flex-1 items-start">
                <div className="flex flex-col items-center text-center gap-3 flex-1 group">
                  <div className={`relative h-14 w-14 rounded-2xl flex items-center justify-center border transition-all group-hover:scale-110 group-hover:shadow-lg ${step.color}`}>
                    <step.icon className="h-6 w-6" />
                    <span className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-[#080c14] border border-white/[0.08] text-[10px] font-bold text-gray-400 flex items-center justify-center">{step.num}</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{step.title}</p>
                    <p className="text-sm text-gray-400 mt-0.5 leading-relaxed">{step.desc}</p>
                  </div>
                </div>
                {i < arr.length - 1 && <ArrowRight className="hidden md:block h-4 w-4 text-gray-700 mt-7 shrink-0 mx-2" />}
              </div>
            ))}
          </div>
        </div>
      </StaggerIn>

      {/* ════ CTA / ACTIVE BAR ════ */}
      {total > 0 && (
        <StaggerIn index={9}>
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
                <p className="text-xs text-gray-400">Waiting for supplier responses</p>
              </div>
            </div>
            <Link href="/rfqs">
              <button className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.07] text-gray-300 text-sm font-medium transition-all">
                View All <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </Link>
          </div>
        </StaggerIn>
      )}

      {total === 0 && (
        <StaggerIn index={9}>
          <div className="rounded-2xl border border-dashed border-white/[0.08] p-14 flex flex-col items-center gap-5 text-center">
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
              <button className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold shadow-lg shadow-blue-600/25 transition-all">
                <Plus className="h-4 w-4" /> Create First RFQ
              </button>
            </Link>
          </div>
        </StaggerIn>
      )}
    </div>
  )
}
