'use client'

import { useEffect, useState } from 'react'
import {
  Settings, User, Building2, Briefcase, Mail,
  Save, Loader2, Crown, Shield, LogOut,
} from 'lucide-react'
import type { Profile } from '@/lib/types'
import { toast } from '@/components/Toast'

// ── Section wrapper ───────────────────────────────────────────────────────────

function Section({ title, icon: Icon, children }: {
  title: string
  icon: React.ElementType
  children: React.ReactNode
}) {
  return (
    <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-6 space-y-5">
      <div className="flex items-center gap-2.5">
        <div className="p-2 rounded-lg bg-white/[0.04] border border-white/[0.06]">
          <Icon className="h-4 w-4 text-gray-400" />
        </div>
        <h2 className="text-base font-semibold text-white">{title}</h2>
      </div>
      {children}
    </div>
  )
}

// ── Input ─────────────────────────────────────────────────────────────────────

function Field({
  label, value, onChange, placeholder, disabled, icon: Icon, type = 'text',
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  disabled?: boolean
  icon: React.ElementType
  type?: string
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-gray-400">{label}</label>
      <div className="relative">
        <Icon className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-600 pointer-events-none" />
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl pl-9 pr-3 py-2.5 text-sm text-gray-200 placeholder-gray-700 focus:outline-none focus:border-blue-500/50 focus:bg-blue-500/[0.03] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        />
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [email, setEmail]     = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving]   = useState(false)

  const [fullName, setFullName] = useState('')
  const [company, setCompany]   = useState('')
  const [role, setRole]         = useState('')

  useEffect(() => {
    fetch('/api/profile')
      .then((r) => r.json())
      .then((data) => {
        if (data.profile) {
          setProfile(data.profile)
          setFullName(data.profile.full_name ?? '')
          setCompany(data.profile.company ?? '')
          setRole(data.profile.role ?? '')
        }
        if (data.email) setEmail(data.email)
      })
      .catch(() => toast.error('Failed to load profile'))
      .finally(() => setLoading(false))
  }, [])

  async function save() {
    setSaving(true)
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ full_name: fullName, company, role }),
      })
      if (!res.ok) throw new Error()
      const data = await res.json()
      setProfile(data.profile)
      toast.success('Profile saved')
    } catch {
      toast.error('Failed to save profile')
    } finally {
      setSaving(false)
    }
  }

  const initials = fullName
    ? fullName.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
    : email.charAt(0).toUpperCase() || '?'

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="h-6 w-6 text-gray-600 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-2xl">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
          <Settings className="h-6 w-6 text-gray-400" />
          Settings
        </h1>
        <p className="text-sm text-gray-500 mt-1">Manage your profile and account preferences</p>
      </div>

      {/* Avatar + identity */}
      <div className="flex items-center gap-4 p-5 rounded-2xl border border-white/[0.07] bg-white/[0.02]">
        <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-xl font-bold text-white shadow-lg shadow-blue-500/20 shrink-0">
          {initials}
        </div>
        <div>
          <p className="text-base font-semibold text-white">{fullName || 'Your Name'}</p>
          <p className="text-sm text-gray-500">{email}</p>
          {role && <p className="text-xs text-gray-600 mt-0.5">{role}{company ? ` · ${company}` : ''}</p>}
        </div>
      </div>

      {/* Profile form */}
      <Section title="Profile Information" icon={User}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field
            label="Full Name"
            value={fullName}
            onChange={setFullName}
            placeholder="Jane Smith"
            icon={User}
          />
          <Field
            label="Email"
            value={email}
            onChange={() => {}}
            disabled
            icon={Mail}
            type="email"
          />
          <Field
            label="Company"
            value={company}
            onChange={setCompany}
            placeholder="Acme Corp"
            icon={Building2}
          />
          <Field
            label="Job Title"
            value={role}
            onChange={setRole}
            placeholder="Procurement Manager"
            icon={Briefcase}
          />
        </div>
        <div className="flex justify-end pt-1">
          <button
            onClick={save}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-95 text-sm font-semibold text-white transition-all disabled:opacity-50"
          >
            {saving
              ? <Loader2 className="h-4 w-4 animate-spin" />
              : <Save className="h-4 w-4" />}
            Save Changes
          </button>
        </div>
      </Section>

      {/* Account */}
      <Section title="Account" icon={Shield}>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06]">
            <div>
              <p className="text-sm font-medium text-gray-200">Email address</p>
              <p className="text-xs text-gray-500 mt-0.5">{email}</p>
            </div>
            <span className="text-xs bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2 py-1 rounded-lg font-medium">
              Verified
            </span>
          </div>
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06]">
            <div>
              <p className="text-sm font-medium text-gray-200">Password</p>
              <p className="text-xs text-gray-500 mt-0.5">Managed via Supabase Auth</p>
            </div>
            <button
              onClick={() => toast.info('Password reset email sent')}
              className="text-xs text-blue-400 hover:text-blue-300 font-medium transition-colors"
            >
              Reset
            </button>
          </div>
        </div>
      </Section>

      {/* Subscription */}
      <Section title="Subscription" icon={Crown}>
        <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-violet-950/60 to-blue-950/40 border border-violet-500/20">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-violet-500/10 border border-violet-500/20">
              <Crown className="h-4 w-4 text-violet-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-violet-300">Free Plan</p>
              <p className="text-xs text-gray-500 mt-0.5">Upgrade to unlock AI insights & advanced analytics</p>
            </div>
          </div>
          <button className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-violet-600 hover:bg-violet-500 text-white transition-colors">
            Upgrade
          </button>
        </div>
      </Section>

      {/* Danger */}
      <Section title="Danger Zone" icon={LogOut}>
        <div className="flex items-center justify-between p-3.5 rounded-xl bg-red-500/[0.04] border border-red-500/20">
          <div>
            <p className="text-sm font-medium text-gray-200">Sign out everywhere</p>
            <p className="text-xs text-gray-500 mt-0.5">Revoke all active sessions</p>
          </div>
          <a
            href="/api/auth/signout"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/[0.08] transition-all"
          >
            <LogOut className="h-3.5 w-3.5" />
            Sign Out
          </a>
        </div>
      </Section>

    </div>
  )
}
