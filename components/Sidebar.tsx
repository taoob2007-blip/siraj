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

      fetch('/api/profile')
        .then((r) => r.ok ? r.json() : null)
        .then((data) => {
          if (!data) return
          setUserName(data.profile?.full_name ?? '')
          setUserRole(data.profile?.role ?? '')

          const status  = data.profile?.subscription_status
          const trialEnd = data.profile?.trial_ends_at
          const subEnd   = data.profile?.subscription_ends_at
          const now      = Date.now()

          const activePro   = status === 'active' && (!subEnd || new Date(subEnd).getTime() > now)
          const activeTrial = status === 'trial' && (!!trialEnd && new Date(trialEnd).getTime() > now)

          setIsPro(activePro || activeTrial)
          setIsAdmin(data.profile?.role === 'admin')
        })

      fetch('/api/notifications')
        .then((r) => r.ok ? r.json() : null)
        .then((data) => { if (data) setUnread(data.unread_count) })
    })
  }, [pathname])

  const initials = userName
    ? userName.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase()
    : userEmail.charAt(0).toUpperCase() || '?'

  const displayName = userName || userEmail.split('@')[0] || 'My Account'

  return (
    <aside className="w-56 shrink-0 flex flex-col min-h-screen sticky top-0 h-screen bg-[#0a0f1a] border-r border-white/[0.06] z-30">

      {/* 🔥 LOGO CLEAN */}
      <div className="px-5 py-5 border-b border-white/[0.04] flex items-center justify-center">
        <Image
          src="/logo-clean.png"
          alt="SIRAJ"
          width={140}
          height={40}
          priority
          className="h-10 w-auto object-contain opacity-90 hover:opacity-100 transition"
        />
      </div>

      {/* NAV */}
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
                  ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                  : locked
                  ? 'text-gray-700'
                  : 'text-gray-500 hover:text-gray-200 hover:bg-white/[0.04]',
              ].join(' ')}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="text-sm flex-1">{label}</span>

              {badge && (
                <span className="text-[10px] bg-blue-600 text-white px-1.5 py-0.5 rounded-full font-bold">
                  {badge > 99 ? '99+' : badge}
                </span>
              )}

              {locked && <Crown className="h-3 w-3 text-violet-600" />}
            </Link>
          )
        })}
      </nav>

      {/* USER */}
      <div className="px-3 py-3 border-t border-white/[0.06]">
        <div className="flex items-center gap-2 px-2 py-2">
          <div className="h-7 w-7 rounded-full bg-blue-500 flex items-center justify-center text-xs font-bold text-white">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-200 truncate">{displayName}</p>
            <p className="text-[11px] text-gray-600 truncate">{userRole || userEmail}</p>
          </div>
        </div>

        <LogoutButton />
      </div>

    </aside>
  )
}