'use client'

import type { ElementType } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import {
  LayoutDashboard, FileText, Users, BarChart2,
  GitCompare, FileSignature, MessageSquare, PieChart,
  Bell, Settings, Crown, Layers
} from 'lucide-react'
import { LogoutButton } from '@/components/LogoutButton'
import { supabaseBrowserClient as supabase } from '@/lib/supabase/client'

const NAV: {
  href: string
  label: string
  icon: ElementType
  notifBadge?: boolean
  proOnly?: boolean
}[] = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/rfqs', label: 'RFQs', icon: FileText },
  { href: '/suppliers', label: 'Suppliers', icon: Users },
  { href: '/categories', label: 'Categories', icon: Layers },
  { href: '/analytics', label: 'Analytics', icon: BarChart2, proOnly: true },
  { href: '/comparisons', label: 'Comparisons', icon: GitCompare, proOnly: true },
  { href: '/contracts', label: 'Contracts', icon: FileSignature },
  { href: '/messages', label: 'Messages', icon: MessageSquare },
  { href: '/reports', label: 'Reports', icon: PieChart },
  { href: '/notifications', label: 'Notifications', icon: Bell, notifBadge: true },
  { href: '/settings', label: 'Settings', icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()
  const [unread, setUnread] = useState(0)
  const [userName, setUserName] = useState('')
  const [userEmail, setUserEmail] = useState('')
  const [userRole, setUserRole] = useState('')
  const [isPro, setIsPro] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)

  const containerRef = useRef<HTMLDivElement>(null)
  const activeRef = useRef<HTMLAnchorElement | null>(null)
  const [pillStyle, setPillStyle] = useState({ top: 0, height: 0 })

  // 🔥 نفس الربط بدون تغيير
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

          const status = data.profile?.subscription_status
          const trialEnd = data.profile?.trial_ends_at
          const subEnd = data.profile?.subscription_ends_at
          const now = Date.now()

          const activePro = status === 'active' && (!subEnd || new Date(subEnd).getTime() > now)
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
    ? userName.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
    : userEmail.charAt(0).toUpperCase() || '?'

  const displayName = userName || userEmail.split('@')[0] || 'My Account'

  // 🔥 حركة المؤشر
  useEffect(() => {
    if (!activeRef.current || !containerRef.current) return

    const el = activeRef.current
    const parent = containerRef.current

    setPillStyle({
      top: el.offsetTop,
      height: el.offsetHeight,
    })
  }, [pathname])

  return (
    <aside className="w-64 flex flex-col min-h-screen bg-[#0B0F19] border-r border-white/[0.05]">

      {/* LOGO */}
      <div className="px-6 py-6 border-b border-white/[0.04]">
        <h1 className="text-white text-lg tracking-[0.25em] font-light">
          S I R A J
        </h1>
        <div className="w-2 h-2 bg-cyan-400 rounded-full mt-2 mx-auto opacity-80" />
      </div>

      {/* NAV */}
      <div
        ref={containerRef}
        className="relative flex-1 px-2 py-4 space-y-1 overflow-y-auto"
      >

        {/* 🔥 Active Glow */}
        <div
          className="absolute left-2 right-2 rounded-xl bg-gradient-to-r from-cyan-400/10 to-indigo-500/10 blur-xl transition-all duration-300"
          style={{
            top: pillStyle.top,
            height: pillStyle.height,
          }}
        />

        {NAV.map(({ href, label, icon: Icon, notifBadge, proOnly }) => {
          const active = href === '/' ? pathname === '/' : pathname.startsWith(href)
          const badge = notifBadge && unread > 0 ? unread : undefined
          const locked = proOnly && !isPro

          return (
            <Link
              key={href}
              href={href}
              ref={active ? activeRef : null}
              className={[
                'relative z-10 flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200',
                active
                  ? 'text-cyan-400'
                  : locked
                  ? 'text-gray-700'
                  : 'text-gray-400 hover:text-white hover:bg-white/[0.04]',
              ].join(' ')}
            >
              <Icon className="h-4 w-4" />
              <span className="text-sm flex-1">{label}</span>

              {badge && (
                <span className="text-[10px] bg-cyan-500 text-black px-1.5 py-0.5 rounded-full font-bold">
                  {badge > 99 ? '99+' : badge}
                </span>
              )}

              {locked && <Crown className="h-3 w-3 text-violet-500" />}
            </Link>
          )
        })}
      </div>

      {/* USER (🔥 ثابت تحت) */}
      <div className="px-4 py-4 border-t border-white/[0.05] mt-auto">
        <div className="flex items-center gap-3 mb-3">
          <div className="h-8 w-8 rounded-full bg-cyan-500 flex items-center justify-center text-xs font-bold text-black">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-white truncate">{displayName}</p>
            <p className="text-[11px] text-gray-500 truncate">{userRole || userEmail}</p>
          </div>
        </div>

        <LogoutButton />
      </div>
    </aside>
  )
}