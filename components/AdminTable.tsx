'use client'

import { useState, useMemo, useTransition } from 'react'
import {
  Users, CheckCircle2, Clock, XCircle, Loader2,
  Search, RefreshCw, Shield, Zap, Ban,
  ChevronDown, ChevronUp, ChevronsUpDown,
  Crown, Building2, Calendar, MoreHorizontal,
} from 'lucide-react'
import { toast } from '@/components/Toast'
import {
  activateSubscription,
  expireSubscription,
  startTrial,
} from '@/app/admin/actions'
import type { AdminProfile, SubscriptionStatus } from '@/lib/types'

// ── Types ─────────────────────────────────────────────────────────────────────

type Filter = 'all' | SubscriptionStatus
type SortKey = 'name' | 'company' | 'status' | 'updated_at'
type SortDir = 'asc' | 'desc'

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })
}

function isExpired(iso: string | null): boolean {
  if (!iso) return false
  return new Date(iso) < new Date()
}

function planLabel(profile: AdminProfile): SubscriptionStatus {
  const { subscription_status: s, trial_ends_at, subscription_ends_at } = profile
  if (s === 'active'  && subscription_ends_at && isExpired(subscription_ends_at)) return 'expired'
  if (s === 'trial'   && trial_ends_at        && isExpired(trial_ends_at))        return 'expired'
  return s
}

const PLAN_STYLE: Record<SubscriptionStatus, { bg: string; text: string; border: string; icon: React.ElementType; label: string }> = {
  free:    { bg: 'bg-gray-500/10',    text: 'text-gray-400',    border: 'border-gray-500/20',    icon: Shield,       label: 'Free' },
  trial:   { bg: 'bg-amber-500/10',   text: 'text-amber-400',   border: 'border-amber-500/20',   icon: Clock,        label: 'Trial' },
  active:  { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20', icon: CheckCircle2, label: 'Active' },
  expired: { bg: 'bg-red-500/10',     text: 'text-red-400',     border: 'border-red-500/20',     icon: XCircle,      label: 'Expired' },
}

function PlanBadge({ profile }: { profile: AdminProfile }) {
  const status = planLabel(profile)
  const s = PLAN_STYLE[status]
  const Icon = s.icon
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-md border ${s.bg} ${s.text} ${s.border}`}>
      <Icon className="h-2.5 w-2.5" />
      {s.label}
    </span>
  )
}

// ── Stat card ─────────────────────────────────────────────────────────────────

function StatCard({
  label, value, icon: Icon, iconCls, onClick, active,
}: {
  label: string; value: number; icon: React.ElementType
  iconCls: string; onClick: () => void; active: boolean
}) {
  return (
    <button
      onClick={onClick}
      className={[
        'flex items-center gap-3 rounded-xl border p-4 text-left transition-all cursor-pointer',
        active
          ? 'border-blue-500/30 bg-blue-500/[0.06] shadow-sm shadow-blue-500/10'
          : 'border-white/[0.07] bg-white/[0.02] hover:border-white/[0.12] hover:bg-white/[0.04]',
      ].join(' ')}
    >
      <div className={`p-2 rounded-lg border shrink-0 ${iconCls}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <p className="text-2xl font-bold text-white tabular-nums">{value}</p>
        <p className="text-xs text-gray-500">{label}</p>
      </div>
    </button>
  )
}

// ── Sort header ───────────────────────────────────────────────────────────────

function SortHeader({
  label, sortKey, current, dir, onSort,
}: {
  label: string; sortKey: SortKey
  current: SortKey; dir: SortDir
  onSort: (k: SortKey) => void
}) {
  const active = current === sortKey
  const Icon   = active ? (dir === 'asc' ? ChevronUp : ChevronDown) : ChevronsUpDown
  return (
    <button
      onClick={() => onSort(sortKey)}
      className="flex items-center gap-1 text-xs font-semibold text-gray-400 hover:text-white uppercase tracking-wider transition-colors"
    >
      {label}
      <Icon className={`h-3 w-3 ${active ? 'text-blue-400' : 'text-gray-700'}`} />
    </button>
  )
}

// ── Row action button ─────────────────────────────────────────────────────────

function ActionBtn({
  label, icon: Icon, onClick, loading, variant = 'default',
}: {
  label: string; icon: React.ElementType
  onClick: () => void; loading: boolean; variant?: 'default' | 'danger' | 'accent'
}) {
  const cls = {
    default: 'text-gray-400 hover:text-white hover:bg-white/[0.07] border-transparent',
    accent:  'text-emerald-400 hover:text-white hover:bg-emerald-500/[0.12] border-transparent',
    danger:  'text-red-400 hover:text-white hover:bg-red-500/[0.10] border-transparent',
  }[variant]

  return (
    <button
      onClick={onClick}
      disabled={loading}
      title={label}
      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed ${cls}`}
    >
      {loading
        ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
        : <Icon className="h-3.5 w-3.5" />
      }
      {label}
    </button>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

interface Props {
  initialProfiles: AdminProfile[]
}

export function AdminTable({ initialProfiles }: Props) {
  const [profiles, setProfiles] = useState<AdminProfile[]>(initialProfiles)
  const [filter, setFilter]     = useState<Filter>('all')
  const [search, setSearch]     = useState('')
  const [sortKey, setSortKey]   = useState<SortKey>('updated_at')
  const [sortDir, setSortDir]   = useState<SortDir>('desc')
  const [loadingIds, setLoadingIds] = useState<Set<string>>(new Set())
  const [, startTransition] = useTransition()

  // ── Actions ────────────────────────────────────────────────────────────────

  function setLoading(id: string, on: boolean) {
    setLoadingIds((prev) => {
      const next = new Set(prev)
      on ? next.add(id) : next.delete(id)
      return next
    })
  }

  function patchProfile(id: string, patch: Partial<AdminProfile>) {
    setProfiles((prev) => prev.map((p) => p.id === id ? { ...p, ...patch } : p))
  }

  function handleActivate(profile: AdminProfile) {
    setLoading(profile.id, true)
    startTransition(async () => {
      const result = await activateSubscription(profile.id)
      if (result.ok) {
        const endsAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        patchProfile(profile.id, { subscription_status: 'active', subscription_ends_at: endsAt })
        toast.success(`Activated — ${profile.full_name ?? profile.id} has 30 days`)
      } else {
        toast.error(result.error)
      }
      setLoading(profile.id, false)
    })
  }

  function handleExpire(profile: AdminProfile) {
    setLoading(profile.id, true)
    startTransition(async () => {
      const result = await expireSubscription(profile.id)
      if (result.ok) {
        patchProfile(profile.id, { subscription_status: 'expired' })
        toast.success(`Expired — ${profile.full_name ?? profile.id}`)
      } else {
        toast.error(result.error)
      }
      setLoading(profile.id, false)
    })
  }

  function handleTrial(profile: AdminProfile) {
    setLoading(profile.id, true)
    startTransition(async () => {
      const result = await startTrial(profile.id)
      if (result.ok) {
        const endsAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
        patchProfile(profile.id, { subscription_status: 'trial', trial_ends_at: endsAt })
        toast.success(`Trial started — ${profile.full_name ?? profile.id} has 14 days`)
      } else {
        toast.error(result.error)
      }
      setLoading(profile.id, false)
    })
  }

  // ── Sort ───────────────────────────────────────────────────────────────────

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  // ── Derived data ───────────────────────────────────────────────────────────

  const counts = useMemo(() => ({
    all:     profiles.length,
    free:    profiles.filter((p) => planLabel(p) === 'free').length,
    trial:   profiles.filter((p) => planLabel(p) === 'trial').length,
    active:  profiles.filter((p) => planLabel(p) === 'active').length,
    expired: profiles.filter((p) => planLabel(p) === 'expired').length,
  }), [profiles])

  const visible = useMemo(() => {
    let rows = profiles

    // Filter by status
    if (filter !== 'all') rows = rows.filter((p) => planLabel(p) === filter)

    // Search
    if (search.trim()) {
      const q = search.toLowerCase()
      rows = rows.filter(
        (p) =>
          p.full_name?.toLowerCase().includes(q) ||
          p.company?.toLowerCase().includes(q) ||
          p.id.toLowerCase().includes(q)
      )
    }

    // Sort
    rows = [...rows].sort((a, b) => {
      let av: string, bv: string
      if (sortKey === 'name')       { av = a.full_name ?? ''; bv = b.full_name ?? '' }
      else if (sortKey === 'company') { av = a.company ?? ''; bv = b.company ?? '' }
      else if (sortKey === 'status') { av = planLabel(a); bv = planLabel(b) }
      else                          { av = a.updated_at ?? ''; bv = b.updated_at ?? '' }
      const cmp = av.localeCompare(bv)
      return sortDir === 'asc' ? cmp : -cmp
    })

    return rows
  }, [profiles, filter, search, sortKey, sortDir])

  const FILTER_TABS: { key: Filter; label: string }[] = [
    { key: 'all',     label: 'All' },
    { key: 'trial',   label: 'Trial' },
    { key: 'active',  label: 'Active' },
    { key: 'expired', label: 'Expired' },
    { key: 'free',    label: 'Free' },
  ]

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Total Users"  value={counts.all}     icon={Users}       iconCls="bg-blue-500/10 border-blue-500/20 text-blue-400"     onClick={() => setFilter('all')}     active={filter === 'all'} />
        <StatCard label="On Trial"     value={counts.trial}   icon={Clock}       iconCls="bg-amber-500/10 border-amber-500/20 text-amber-400"   onClick={() => setFilter('trial')}   active={filter === 'trial'} />
        <StatCard label="Active"       value={counts.active}  icon={CheckCircle2} iconCls="bg-emerald-500/10 border-emerald-500/20 text-emerald-400" onClick={() => setFilter('active')}  active={filter === 'active'} />
        <StatCard label="Expired"      value={counts.expired} icon={XCircle}     iconCls="bg-red-500/10 border-red-500/20 text-red-400"         onClick={() => setFilter('expired')} active={filter === 'expired'} />
      </div>

      {/* ── Toolbar ── */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">

        {/* Filter tabs */}
        <div className="flex items-center gap-1 bg-white/[0.04] border border-white/[0.08] rounded-lg p-1">
          {FILTER_TABS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={[
                'px-3 py-1 rounded-md text-xs font-semibold transition-all',
                filter === key
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-gray-500 hover:text-gray-200',
              ].join(' ')}
            >
              {label}
              {key !== 'all' && (
                <span className={`ml-1.5 ${filter === key ? 'text-blue-200' : 'text-gray-700'}`}>
                  {counts[key as keyof typeof counts]}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-600 pointer-events-none" />
          <input
            type="text"
            placeholder="Search name or company…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-64 bg-white/[0.03] border border-white/[0.08] rounded-xl pl-9 pr-3 py-2 text-xs text-gray-200 placeholder-gray-700 focus:outline-none focus:border-blue-500/50 transition-all"
          />
        </div>
      </div>

      {/* ── Table ── */}
      <div className="rounded-2xl border border-white/[0.07] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                <th className="px-4 py-3 text-left">
                  <SortHeader label="Name"    sortKey="name"       current={sortKey} dir={sortDir} onSort={handleSort} />
                </th>
                <th className="px-4 py-3 text-left">
                  <SortHeader label="Company" sortKey="company"    current={sortKey} dir={sortDir} onSort={handleSort} />
                </th>
                <th className="px-4 py-3 text-left">
                  <SortHeader label="Plan"    sortKey="status"     current={sortKey} dir={sortDir} onSort={handleSort} />
                </th>
                <th className="px-4 py-3 text-left">
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Trial Ends</span>
                </th>
                <th className="px-4 py-3 text-left">
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Sub. Ends</span>
                </th>
                <th className="px-4 py-3 text-left">
                  <SortHeader label="Updated" sortKey="updated_at" current={sortKey} dir={sortDir} onSort={handleSort} />
                </th>
                <th className="px-4 py-3 text-right">
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {visible.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <Users className="h-8 w-8 text-gray-700" />
                      <p className="text-sm text-gray-500">
                        {search ? 'No users match your search' : 'No users in this filter'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                visible.map((profile) => {
                  const loading = loadingIds.has(profile.id)
                  const plan    = planLabel(profile)
                  const initials = profile.full_name
                    ? profile.full_name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
                    : profile.id.slice(0, 2).toUpperCase()

                  return (
                    <tr
                      key={profile.id}
                      className={`transition-colors hover:bg-white/[0.02] ${loading ? 'opacity-60' : ''}`}
                    >
                      {/* Name */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-[11px] font-bold text-white shrink-0">
                            {initials}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-gray-200 truncate max-w-[140px]">
                              {profile.full_name ?? <span className="text-gray-600 italic">No name</span>}
                            </p>
                            {profile.role === 'admin' && (
                              <span className="text-[9px] font-bold uppercase tracking-widest text-violet-400">
                                Admin
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Company */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 text-xs text-gray-400">
                          {profile.company
                            ? <><Building2 className="h-3 w-3 text-gray-600 shrink-0" />{profile.company}</>
                            : <span className="text-gray-700 italic">—</span>
                          }
                        </div>
                      </td>

                      {/* Plan */}
                      <td className="px-4 py-3">
                        <PlanBadge profile={profile} />
                      </td>

                      {/* Trial Ends */}
                      <td className="px-4 py-3">
                        <div className={`flex items-center gap-1 text-xs ${
                          profile.trial_ends_at && isExpired(profile.trial_ends_at)
                            ? 'text-red-400' : 'text-gray-400'
                        }`}>
                          {profile.trial_ends_at && (
                            <Calendar className="h-3 w-3 shrink-0 text-gray-600" />
                          )}
                          {fmtDate(profile.trial_ends_at)}
                        </div>
                      </td>

                      {/* Sub Ends */}
                      <td className="px-4 py-3">
                        <div className={`flex items-center gap-1 text-xs ${
                          profile.subscription_ends_at && isExpired(profile.subscription_ends_at)
                            ? 'text-red-400' : 'text-gray-400'
                        }`}>
                          {profile.subscription_ends_at && (
                            <Calendar className="h-3 w-3 shrink-0 text-gray-600" />
                          )}
                          {fmtDate(profile.subscription_ends_at)}
                        </div>
                      </td>

                      {/* Updated */}
                      <td className="px-4 py-3">
                        <span className="text-xs text-gray-600">{fmtDate(profile.updated_at)}</span>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 justify-end">
                          <ActionBtn
                            label="Activate (30d)"
                            icon={Zap}
                            onClick={() => handleActivate(profile)}
                            loading={loading}
                            variant="accent"
                          />
                          {plan !== 'trial' && (
                            <ActionBtn
                              label="Trial (14d)"
                              icon={Crown}
                              onClick={() => handleTrial(profile)}
                              loading={loading}
                              variant="default"
                            />
                          )}
                          {plan !== 'expired' && plan !== 'free' && (
                            <ActionBtn
                              label="Expire"
                              icon={Ban}
                              onClick={() => handleExpire(profile)}
                              loading={loading}
                              variant="danger"
                            />
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table footer */}
        {visible.length > 0 && (
          <div className="px-4 py-3 border-t border-white/[0.04] bg-white/[0.01] flex items-center justify-between">
            <p className="text-xs text-gray-600">
              Showing <span className="text-gray-400 font-medium">{visible.length}</span> of{' '}
              <span className="text-gray-400 font-medium">{profiles.length}</span> users
            </p>
            <p className="text-xs text-gray-700">
              Last refreshed: {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
