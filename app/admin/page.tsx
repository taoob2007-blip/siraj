export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { Shield, RefreshCw } from 'lucide-react'
import { getAuthUser, getServiceSupabaseClient } from '@/lib/supabase/server'
import { AdminTable } from '@/components/AdminTable'
import { PaymentRequestsTable } from '@/components/PaymentRequestsTable'
import { AdminRevenue, type RevenueStats } from '@/components/AdminRevenue'
import type { AdminProfile, PaymentRequestWithUser } from '@/lib/types'

// ── Helpers ───────────────────────────────────────────────────────────────────

function monthKey(iso: string) {
  const d = new Date(iso)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function monthLabel(key: string) {
  const [y, m] = key.split('-')
  return new Date(Number(y), Number(m) - 1).toLocaleString('en-US', { month: 'short', year: '2-digit' })
}

// ── Data fetching ─────────────────────────────────────────────────────────────

async function getAdminData(): Promise<{
  allowed:         boolean
  profiles:        AdminProfile[]
  paymentRequests: PaymentRequestWithUser[]
  adminEmail:      string
  revenue:         RevenueStats
}> {
  const empty: RevenueStats = {
    totalRevenue:     0,
    monthlyRevenue:   [],
    userCounts:       { active: 0, trial: 0, expired: 0, free: 0, total: 0 },
    thisMonthRevenue: 0,
    lastMonthRevenue: 0,
  }

  const user = await getAuthUser()
  if (!user) return { allowed: false, profiles: [], paymentRequests: [], adminEmail: '', revenue: empty }

  const supabase = getServiceSupabaseClient()

  // Admin check
  const { data: myProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (myProfile?.role !== 'admin') {
    return { allowed: false, profiles: [], paymentRequests: [], adminEmail: '', revenue: empty }
  }

  // Fetch everything in parallel
  const [profilesRes, paymentReqRes, approvedReqRes, emailsRes] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, full_name, company, role, subscription_status, trial_ends_at, subscription_ends_at, updated_at')
      .order('updated_at', { ascending: false, nullsFirst: false }),
    supabase
      .from('payment_requests')
      .select('id, user_id, amount, status, notes, created_at')
      .order('created_at', { ascending: false })
      .limit(200),
    supabase
      .from('payment_requests')
      .select('amount, created_at')
      .eq('status', 'approved'),
    supabase.auth.admin.listUsers({ perPage: 1000 }).catch(() => ({ data: { users: [] } })),
  ])

  const rawProfiles   = (profilesRes.data ?? []) as AdminProfile[]
  const rawRequests   = paymentReqRes.data  ?? []
  const approvedReqs  = approvedReqRes.data ?? []
  const emailMap: Record<string, string> = Object.fromEntries(
    (emailsRes as { data: { users: { id: string; email?: string }[] } }).data.users
      .map((u: { id: string; email?: string }) => [u.id, u.email ?? ''])
  )

  // ── Profiles with email merged ──
  const profiles: AdminProfile[] = rawProfiles.map((p) => ({
    ...p,
    email: emailMap[p.id] ?? null,
  }))

  const profileMap = Object.fromEntries(profiles.map((p) => [p.id, p]))

  // ── Payment requests ──
  const paymentRequests: PaymentRequestWithUser[] = rawRequests.map((r) => ({
    id:         r.id,
    user_id:    r.user_id,
    amount:     r.amount  ?? null,
    status:     r.status,
    notes:      r.notes,
    created_at: r.created_at,
    full_name:  profileMap[r.user_id]?.full_name ?? null,
    company:    profileMap[r.user_id]?.company   ?? null,
    email:      emailMap[r.user_id]              ?? null,
  }))

  // ── Revenue stats ──
  const totalRevenue = approvedReqs.reduce((sum, r) => sum + (Number(r.amount) || 0), 0)

  // Group by month
  const monthMap: Record<string, number> = {}
  for (const r of approvedReqs) {
    const k = monthKey(r.created_at)
    monthMap[k] = (monthMap[k] ?? 0) + (Number(r.amount) || 0)
  }
  const monthlyRevenue = Object.entries(monthMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, amount]) => ({ month, label: monthLabel(month), amount }))

  const currentMonthKey  = monthKey(new Date().toISOString())
  const lastDate         = new Date(); lastDate.setMonth(lastDate.getMonth() - 1)
  const lastMonthKey     = monthKey(lastDate.toISOString())
  const thisMonthRevenue = monthMap[currentMonthKey]  ?? 0
  const lastMonthRevenue = monthMap[lastMonthKey]     ?? 0

  // User counts
  const userCounts = rawProfiles.reduce(
    (acc, p) => {
      const s = p.subscription_status ?? 'free'
      if (s in acc) acc[s as keyof typeof acc]++
      acc.total++
      return acc
    },
    { active: 0, trial: 0, expired: 0, free: 0, total: 0 }
  )

  return {
    allowed: true,
    profiles,
    paymentRequests,
    adminEmail: user.email ?? '',
    revenue: { totalRevenue, monthlyRevenue, userCounts, thisMonthRevenue, lastMonthRevenue },
  }
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function AdminPage() {
  const { allowed, profiles, paymentRequests, adminEmail, revenue } = await getAdminData()

  if (!allowed) redirect('/rfqs')

  const pendingCount = paymentRequests.filter((r) => r.status === 'pending').length

  return (
    <div className="space-y-8">

      {/* ── Header ── */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="p-1.5 rounded-lg bg-violet-500/10 border border-violet-500/20">
              <Shield className="h-4 w-4 text-violet-400" />
            </div>
            <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
          </div>
          <p className="text-sm text-gray-500">
            Manage users and subscriptions ·{' '}
            <span className="text-gray-400">{adminEmail}</span>
          </p>
        </div>

        <form action="/admin" method="GET">
          <button
            type="submit"
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.07] text-gray-400 hover:text-white text-xs font-medium transition-all"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </button>
        </form>
      </div>

      {/* ── Revenue analytics ── */}
      <AdminRevenue stats={revenue} />

      {/* ── Divider ── */}
      <div className="h-px bg-white/[0.05]" />

      {/* ── Payment requests ── */}
      <PaymentRequestsTable initialRequests={paymentRequests} pendingCount={pendingCount} />

      {/* ── Users table ── */}
      <AdminTable initialProfiles={profiles} />

    </div>
  )
}
