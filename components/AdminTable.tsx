'use client'

import { useState, useTransition } from 'react'
import {
  Users, CheckCircle2, Clock, XCircle,
  Loader2, Search, Zap, Crown, Ban, Shield,
} from 'lucide-react'
import { toast } from '@/components/Toast'
import {
  activateSubscription,
  expireSubscription,
  startTrial,
} from '@/app/admin/actions'
import type { AdminProfile, SubscriptionStatus } from '@/lib/types'

// ── Helpers ───────────────────────────────────────────────────────────────────

function planLabel(p: AdminProfile): SubscriptionStatus {
  const s = p.subscription_status
  const now = new Date()
  if (s === 'active' && p.subscription_ends_at && new Date(p.subscription_ends_at) < now) return 'expired'
  if (s === 'trial'  && p.trial_ends_at        && new Date(p.trial_ends_at)        < now) return 'expired'
  return s
}

const BADGE: Record<SubscriptionStatus, { bg: string; text: string; border: string; icon: React.ElementType; label: string }> = {
  free:    { bg: 'bg-gray-500/10',    text: 'text-gray-400',    border: 'border-gray-500/20',    icon: Shield,       label: 'Free' },
  trial:   { bg: 'bg-amber-500/10',   text: 'text-amber-400',   border: 'border-amber-500/20',   icon: Clock,        label: 'Trial' },
  active:  { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20', icon: CheckCircle2, label: 'Active' },
  expired: { bg: 'bg-red-500/10',     text: 'text-red-400',     border: 'border-red-500/20',     icon: XCircle,      label: 'Expired' },
}

function StatusBadge({ profile }: { profile: AdminProfile }) {
  const status = planLabel(profile)
  const b = BADGE[status]
  const Icon = b.icon
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-md border ${b.bg} ${b.text} ${b.border}`}>
      <Icon className="h-2.5 w-2.5" />
      {b.label}
    </span>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────

interface Props { initialProfiles: AdminProfile[] }

export function AdminTable({ initialProfiles }: Props) {
  const [profiles, setProfiles]     = useState<AdminProfile[]>(initialProfiles)
  const [search, setSearch]         = useState('')
  const [loadingIds, setLoadingIds] = useState<Set<string>>(new Set())
  const [, startTrans]              = useTransition()

  function setLoading(id: string, on: boolean) {
    setLoadingIds(prev => { const s = new Set(prev); on ? s.add(id) : s.delete(id); return s })
  }

  function patch(id: string, update: Partial<AdminProfile>) {
    setProfiles(prev => prev.map(p => p.id === id ? { ...p, ...update } : p))
  }

  function handleActivate(profile: AdminProfile) {
    setLoading(profile.id, true)
    startTrans(async () => {
      const res = await activateSubscription(profile.id)
      if (res.ok) {
        patch(profile.id, {
          subscription_status:  'active',
          subscription_ends_at: new Date(Date.now() + 30 * 86_400_000).toISOString(),
          trial_ends_at:        null,
          updated_at:           new Date().toISOString(),
        })
        toast.success('Subscription activated — 30 days.')
      } else {
        toast.error(res.error ?? 'Failed to activate')
      }
      setLoading(profile.id, false)
    })
  }

  function handleTrial(profile: AdminProfile) {
    setLoading(profile.id, true)
    startTrans(async () => {
      const res = await startTrial(profile.id)
      if (res.ok) {
        patch(profile.id, {
          subscription_status:  'trial',
          trial_ends_at:        new Date(Date.now() + 14 * 86_400_000).toISOString(),
          subscription_ends_at: null,
          updated_at:           new Date().toISOString(),
        })
        toast.success('Trial started — 14 days.')
      } else {
        toast.error(res.error ?? 'Failed to start trial')
      }
      setLoading(profile.id, false)
    })
  }

  function handleExpire(profile: AdminProfile) {
    setLoading(profile.id, true)
    startTrans(async () => {
      const res = await expireSubscription(profile.id)
      if (res.ok) {
        patch(profile.id, {
          subscription_status: 'expired',
          updated_at:          new Date().toISOString(),
        })
        toast.success('User expired.')
      } else {
        toast.error(res.error ?? 'Failed to expire')
      }
      setLoading(profile.id, false)
    })
  }

  const filtered = profiles.filter(p => {
    const q = search.toLowerCase()
    return !q
      || p.email?.toLowerCase().includes(q)
      || p.full_name?.toLowerCase().includes(q)
      || p.company?.toLowerCase().includes(q)
  })

  const counts = {
    total:   profiles.length,
    active:  profiles.filter(p => planLabel(p) === 'active').length,
    trial:   profiles.filter(p => planLabel(p) === 'trial').length,
    expired: profiles.filter(p => planLabel(p) === 'expired').length,
  }

  return (
    <div className="space-y-4">

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Total',   value: counts.total,   icon: Users,       cls: 'text-blue-400    bg-blue-500/10    border-blue-500/20' },
          { label: 'Active',  value: counts.active,  icon: CheckCircle2, cls: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
          { label: 'Trial',   value: counts.trial,   icon: Clock,       cls: 'text-amber-400   bg-amber-500/10   border-amber-500/20' },
          { label: 'Expired', value: counts.expired, icon: XCircle,     cls: 'text-red-400     bg-red-500/10     border-red-500/20' },
        ].map(({ label, value, icon: Icon, cls }) => (
          <div key={label} className="flex items-center gap-3 rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
            <div className={`p-2 rounded-lg border shrink-0 ${cls}`}>
              <Icon className="h-4 w-4" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white tabular-nums">{value}</p>
              <p className="text-xs text-gray-500">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-600 pointer-events-none" />
        <input
          type="text"
          placeholder="Search by email, name, or company…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full sm:w-80 bg-white/[0.03] border border-white/[0.08] rounded-xl pl-9 pr-3 py-2 text-xs text-gray-200 placeholder-gray-600 focus:outline-none focus:border-blue-500/50 transition-all"
        />
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-white/[0.07] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">User</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-4 py-16 text-center text-sm text-gray-600">
                    {search ? 'No users match your search.' : 'No users found.'}
                  </td>
                </tr>
              ) : (
                filtered.map(profile => {
                  const busy    = loadingIds.has(profile.id)
                  const status  = planLabel(profile)
                  const initials = (profile.full_name ?? profile.email ?? 'U')
                    .split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()

                  return (
                    <tr key={profile.id} className={`transition-colors hover:bg-white/[0.02] ${busy ? 'opacity-60' : ''}`}>

                      {/* User */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-[11px] font-bold text-white shrink-0">
                            {initials}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-gray-200 truncate">
                              {profile.full_name ?? <span className="text-gray-600 italic">No name</span>}
                            </p>
                            <p className="text-[11px] text-gray-500 truncate">
                              {profile.email ?? profile.id.slice(0, 16) + '…'}
                            </p>
                            {profile.company && (
                              <p className="text-[10px] text-gray-600 truncate">{profile.company}</p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3">
                        <StatusBadge profile={profile} />
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 justify-end">

                          {/* Activate — always available */}
                          <button
                            onClick={() => handleActivate(profile)}
                            disabled={busy}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white"
                          >
                            {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <Zap className="h-3 w-3" />}
                            Activate 30d
                          </button>

                          {/* Trial — hide if already on trial */}
                          {status !== 'trial' && (
                            <button
                              onClick={() => handleTrial(profile)}
                              disabled={busy}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed bg-amber-500 hover:bg-amber-400 active:scale-95 text-white"
                            >
                              {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <Crown className="h-3 w-3" />}
                              Trial 14d
                            </button>
                          )}

                          {/* Expire — only for active or trial */}
                          {(status === 'active' || status === 'trial') && (
                            <button
                              onClick={() => handleExpire(profile)}
                              disabled={busy}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 active:scale-95 text-red-400"
                            >
                              {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <Ban className="h-3 w-3" />}
                              Expire
                            </button>
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

        {/* Footer */}
        {filtered.length > 0 && (
          <div className="px-4 py-3 border-t border-white/[0.04] bg-white/[0.01]">
            <p className="text-xs text-gray-600">
              Showing <span className="text-gray-400 font-medium">{filtered.length}</span> of{' '}
              <span className="text-gray-400 font-medium">{profiles.length}</span> users
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
