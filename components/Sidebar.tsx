'use client'

import type { ElementType } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import {
  LayoutDashboard, FileText, Users, BarChart2,
  GitCompare, FileSignature, MessageSquare, PieChart,
  Bell, Settings, Crown, Layers, Shield,
} from 'lucide-react'
import { LogoutButton } from '@/components/LogoutButton'
import { supabaseBrowserClient as supabase } from '@/lib/supabase/client'

const NAV: { href: string; label: string; icon: ElementType; notifBadge?: boolean; proOnly?: boolean }[] = [
  { href: '/',              label: 'Dashboard',    icon: LayoutDashboard },
  { href: '/rfqs',          label: 'RFQs',         icon: FileText },
  { href: '/suppliers',     label: 'Suppliers',    icon: Users },
  { href: '/categories',    label: 'Categories',   icon: Layers },
  { href: '/analytics',     label: 'Analytics',    icon: BarChart2,     proOnly: true },
  { href: '/comparisons',   label: 'Comparisons',  icon: GitCompare,    proOnly: true },
  { href: '/contracts',     label: 'Contracts',    icon: FileSignature },
  { href: '/messages',      label: 'Messages',     icon: MessageSquare },
  { href: '/reports',       label: 'Reports',      icon: PieChart },
  { href: '/notifications', label: 'Notifications',icon: Bell,          notifBadge: true },
  { href: '/settings',      label: 'Settings',     icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()
  const [unread, setUnread]       = useState(0)
  const [userName, setUserName]   = useState('')
  const [userEmail, setUserEmail] = useState('')
  const [userRole, setUserRole]   = useState('')
  const [isPro, setIsPro]         = useState(false)
  const [isAdmin, setIsAdmin]     = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) return
      setUserEmail(session.user.email ?? '')

      // load profile for display name, role, and subscription
      fetch('/api/profile')
        .then((r) => r.ok ? r.json() : null)
        .then((data) => {
          if (!data) return
          setUserName(data.profile?.full_name ?? '')
          setUserRole(data.profile?.role ?? '')
          // Evaluate expiry to avoid showing Pro badge for expired statuses
          const status  = data.profile?.subscription_status
          const trialEnd = data.profile?.trial_ends_at
          const subEnd   = data.profile?.subscription_ends_at
          const now      = Date.now()
          const activePro   = status === 'active'  && (!subEnd   || new Date(subEnd).getTime()   > now)
          const activeTrial = status === 'trial'   && (!!trialEnd && new Date(trialEnd).getTime() > now)
          setIsPro(activePro || activeTrial)
          setIsAdmin(data.profile?.role === 'admin')
        })
        .catch(() => {})

      // load unread count
      fetch('/api/notifications')
        .then((r) => r.ok ? r.json() : null)
        .then((data) => { if (data) setUnread(data.unread_count) })
        .catch(() => {})
    })
  }, [pathname])

  const initials = userName
    ? userName.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase()
    : userEmail.charAt(0).toUpperCase() || '?'

  const displayName = userName || userEmail.split('@')[0] || 'My Account'

  return (
    <aside className="w-56 shrink-0 flex flex-col min-h-screen sticky top-0 h-screen bg-[#0a0f1a] border-r border-white/[0.06] z-30">

      {/* Logo */}
      <div className="px-5 py-4 border-b border-white/[0.06]">
        <Image
          src="/logo.png"
          alt="SIRAJ"
          width={120}
          height={32}
          priority
          className="h-7 w-auto object-contain object-left"
        />
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {NAV.map(({ href, label, icon: Icon, notifBadge, proOnly }) => {
          const active    = href === '/' ? pathname === '/' : pathname.startsWith(href)
          const badge     = notifBadge && unread > 0 ? unread : undefined
          const locked    = proOnly && !isPro
          return (
            <Link
              key={href}
              href={href}
              className={[
                'flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-150 group',
                active
                  ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20 shadow-sm shadow-blue-500/10'
                  : locked
                  ? 'text-gray-700 hover:text-gray-500 hover:bg-white/[0.02]'
                  : 'text-gray-500 hover:text-gray-200 hover:bg-white/[0.04]',
              ].join(' ')}
            >
              <Icon className={`h-4 w-4 shrink-0 ${active ? 'text-blue-400' : locked ? 'text-gray-700' : 'text-gray-600 group-hover:text-gray-300'} transition-colors`} />
              <span className="text-sm flex-1">{label}</span>
              {badge && (
                <span className="text-[10px] bg-blue-600 text-white px-1.5 py-0.5 rounded-full font-bold min-w-[18px] text-center leading-4">
                  {badge > 99 ? '99+' : badge}
                </span>
              )}
              {locked && (
                <Crown className="h-3 w-3 text-violet-600 shrink-0" />
              )}
            </Link>
          )
        })}

        {/* Admin link — only visible to admin users */}
        {isAdmin && (
          <>
            <div className="mx-1 my-1 h-px bg-white/[0.05]" />
            <Link
              href="/admin"
              className={[
                'flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-150 group',
                pathname.startsWith('/admin')
                  ? 'bg-violet-500/10 text-violet-400 border border-violet-500/20'
                  : 'text-gray-500 hover:text-violet-300 hover:bg-violet-500/[0.06]',
              ].join(' ')}
            >
              <Shield className={`h-4 w-4 shrink-0 ${pathname.startsWith('/admin') ? 'text-violet-400' : 'text-gray-600 group-hover:text-violet-400'} transition-colors`} />
              <span className="text-sm flex-1">Admin</span>
              <span className="text-[9px] font-bold uppercase tracking-widest text-violet-500 bg-violet-500/10 border border-violet-500/20 px-1.5 py-0.5 rounded-full">
                Staff
              </span>
            </Link>
          </>
        )}
      </nav>

      {/* Upgrade CTA (free) / Pro badge (pro) */}
      {isPro ? (
        <div className="mx-3 mb-3 p-3 rounded-xl bg-gradient-to-br from-violet-950/60 to-blue-950/40 border border-violet-500/20 flex items-center gap-2">
          <Crown className="h-3.5 w-3.5 text-violet-400 shrink-0" />
          <span className="text-xs font-semibold text-violet-300">Pro Plan Active</span>
        </div>
      ) : (
        <div className="mx-3 mb-3 p-3.5 rounded-xl bg-gradient-to-br from-violet-950/80 to-blue-950/60 border border-violet-500/20">
          <div className="flex items-center gap-1.5 mb-1">
            <Crown className="h-3.5 w-3.5 text-violet-400" />
            <span className="text-xs font-semibold text-violet-300">Upgrade to Pro</span>
          </div>
          <p className="text-[11px] text-gray-500 mb-2.5 leading-relaxed">
            Unlock AI insights, analytics &amp; more.
          </p>
          <Link href="/pricing">
            <button className="w-full text-xs bg-violet-600 hover:bg-violet-500 active:scale-95 text-white py-1.5 rounded-lg transition-all font-semibold">
              اشترك الآن
            </button>
          </Link>
        </div>
      )}

      {/* User + logout */}
      <div className="px-3 py-3 border-t border-white/[0.06] space-y-1">
        <div className="flex items-center gap-2.5 px-2 py-2">
          <div className="relative h-7 w-7 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-xs font-bold text-white shrink-0">
            {initials}
            {isPro && (
              <span className="absolute -top-1 -right-1 h-3.5 w-3.5 rounded-full bg-violet-600 border border-[#0a0f1a] flex items-center justify-center">
                <Crown className="h-2 w-2 text-white" />
              </span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-gray-200 truncate">{displayName}</p>
            <p className="text-[11px] text-gray-600 truncate">{userRole || userEmail}</p>
          </div>
        </div>
        <LogoutButton />
      </div>
    </aside>
  )
}
