export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { Shield, Users, RefreshCw } from 'lucide-react'
import { getAuthUser, getServiceSupabaseClient } from '@/lib/supabase/server'
import { AdminTable } from '@/components/AdminTable'
import type { AdminProfile } from '@/lib/types'

// ── Data fetching ─────────────────────────────────────────────────────────────

async function getAdminData(): Promise<{
  allowed: boolean
  profiles: AdminProfile[]
  adminEmail: string
}> {
  const user = await getAuthUser()
  if (!user) return { allowed: false, profiles: [], adminEmail: '' }

  // Use service role to bypass RLS — admin can read all profiles
  const supabase = getServiceSupabaseClient()

  // Check if the current user is an admin
  const { data: myProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (myProfile?.role !== 'admin') return { allowed: false, profiles: [], adminEmail: '' }

  // Fetch all profiles
  const { data: profiles } = await supabase
    .from('profiles')
    .select(`
      id,
      full_name,
      company,
      role,
      subscription_status,
      trial_ends_at,
      subscription_ends_at,
      updated_at
    `)
    .order('updated_at', { ascending: false, nullsFirst: false })

  return {
    allowed: true,
    profiles: (profiles ?? []) as AdminProfile[],
    adminEmail: user.email ?? '',
  }
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function AdminPage() {
  const { allowed, profiles, adminEmail } = await getAdminData()

  if (!allowed) redirect('/')

  return (
    <div className="space-y-6">

      {/* Header */}
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

        {/* Refresh (client-side via page reload) */}
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

      {/* Admin notice banner */}
      <div className="flex items-center gap-3 rounded-xl border border-violet-500/20 bg-violet-500/[0.04] px-4 py-3">
        <Shield className="h-4 w-4 text-violet-400 shrink-0" />
        <p className="text-xs text-violet-300">
          All actions use the service role and bypass RLS. Changes take effect immediately.
        </p>
      </div>

      {/* Table */}
      <AdminTable initialProfiles={profiles} />
    </div>
  )
}
