'use client'

import type { ElementType } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import {
  LayoutDashboard, FileText, Users, BarChart2,
  GitCompare, FileSignature, MessageSquare, PieChart,
  Bell, Settings, Crown, Layers, ChevronLeft, Plus
} from 'lucide-react'
import { LogoutButton } from '@/components/LogoutButton'
import { supabaseBrowserClient as supabase } from '@/lib/supabase/client'

const NAV: {
  href: string
  label: string
  icon: ElementType
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
  { href: '/notifications', label: 'Notifications', icon: Bell },
  { href: '/settings', label: 'Settings', icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()

  const [collapsed, setCollapsed] = useState(false)
  const [userName, setUserName] = useState('')
  const [userEmail, setUserEmail] = useState('')
  const [userRole, setUserRole] = useState('')
  const [isPro, setIsPro] = useState(false)
  const [openUser, setOpenUser] = useState(false)

  const activeRef = useRef<HTMLAnchorElement | null>(null)
  const [pill, setPill] = useState({ top: 0, height: 0 })

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) return
      setUserEmail(session.user.email ?? '')

      fetch('/api/profile')
        .then(r => r.ok ? r.json() : null)
        .then(data => {
          if (!data) return
          setUserName(data.profile?.full_name ?? '')
          setUserRole(data.profile?.role ?? '')
          const status = data.profile?.subscription_status
          setIsPro(status === 'active' || status === 'trial')
        })
    })
  }, [])

  useEffect(() => {
    if (!activeRef.current) return
    setPill({
      top: activeRef.current.offsetTop,
      height: activeRef.current.offsetHeight,
    })
  }, [pathname])

  const initials = userName
    ? userName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : (userEmail?.charAt(0).toUpperCase() || '?')

  const displayName = userName || userEmail.split('@')[0] || 'My Account'

  return (
    <aside
      className={`relative flex flex-col h-screen bg-[#0B0F19] border-r border-white/[0.05]
      transition-all duration-300 ease-in-out
      ${collapsed ? 'w-[78px]' : 'w-64'}`}
    >

      {/* Collapse Button */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-6 z-50 bg-[#0B0F19] border border-white/10 rounded-full p-1 hover:bg-white/10 transition"
      >
        <ChevronLeft className={`w-4 h-4 text-white transition ${collapsed ? 'rotate-180' : ''}`} />
      </button>

      {/* ===== LOGO (v20) ===== */}
      <div className="px-4 py-6 border-b border-white/[0.05] flex justify-center">

        <div className="relative group flex items-center justify-center">

          {/* subtle hover aura */}
          <div className="
            absolute w-[140px] h-[60px]
            bg-cyan-400/5 blur-2xl rounded-full
            opacity-0 group-hover:opacity-100
            transition duration-300
          " />

          {/* Full Logo */}
          <Image
            src="/logo-bar.png"
            alt="logo"
            width={140}
            height={40}
            priority
            className={`
              object-contain
              transition-all duration-300
              brightness-110 contrast-125 saturate-110
              mix-blend-lighten
              ${collapsed ? 'scale-0 opacity-0 absolute' : 'scale-100 opacity-90'}
            `}
          />

          {/* Icon version (collapsed) */}
          <Image
            src="/logo-bar.png"
            alt="logo-mini"
            width={34}
            height={34}
            priority
            className={`
              object-contain
              transition-all duration-300
              brightness-110 contrast-125
              mix-blend-lighten
              ${collapsed ? 'scale-100 opacity-90' : 'scale-0 opacity-0 absolute'}
            `}
          />

        </div>
      </div>

      {/* Quick Action */}
      <div className="px-3 mt-4">
        <Link href="/rfqs/new">
          <button className="w-full flex items-center justify-center gap-2
            bg-cyan-400 text-black px-3 py-2.5 rounded-xl
            hover:bg-cyan-300 hover:scale-[1.02]
            active:scale-95 transition-all duration-200 shadow-lg shadow-cyan-400/20">
            <Plus className="w-4 h-4" />
            {!collapsed && 'طلب جديد'}
          </button>
        </Link>
      </div>

      {/* NAV */}
      <div className="flex-1 overflow-y-auto px-2 py-4 relative">

        <div
          className="absolute left-2 right-2 rounded-xl bg-cyan-400/10 blur-xl transition-all duration-300"
          style={{ top: pill.top, height: pill.height }}
        />

        {NAV.map(({ href, label, icon: Icon, proOnly }) => {
          const active = href === '/' ? pathname === '/' : pathname.startsWith(href)
          const locked = proOnly && !isPro

          return (
            <Link
              key={href}
              href={href}
              ref={active ? activeRef : null}
              className={`group relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200
              ${active
                ? 'text-cyan-400'
                : locked
                ? 'text-gray-600'
                : 'text-gray-400 hover:text-white hover:bg-white/[0.05]'}`}
            >
              {active && (
                <span className="absolute left-0 w-[3px] h-6 bg-cyan-400 rounded-r-full" />
              )}

              <Icon className="w-4 h-4 shrink-0" />

              {!collapsed && (
                <span className="text-sm flex-1">{label}</span>
              )}

              {locked && !collapsed && (
                <Crown className="w-3 h-3 text-violet-500" />
              )}
            </Link>
          )
        })}
      </div>

      {/* USER */}
      <div className="px-3 py-3 border-t border-white/[0.05] sticky bottom-0 bg-[#0B0F19]">
        <div
          onClick={() => setOpenUser(!openUser)}
          className="flex items-center gap-3 cursor-pointer hover:bg-white/5 p-2 rounded-xl transition"
        >
          <div className="w-9 h-9 rounded-full bg-cyan-400 flex items-center justify-center text-black font-bold">
            {initials}
          </div>

          {!collapsed && (
            <div className="flex-1">
              <p className="text-sm text-white">{displayName}</p>
              <p className="text-xs text-gray-400">{userRole || 'User'}</p>
            </div>
          )}
        </div>

        {openUser && !collapsed && (
          <div className="mt-3 bg-[#111827] border border-white/10 rounded-xl p-2 animate-in fade-in">
            <Link href="/settings" className="block px-3 py-2 text-sm text-gray-300 hover:bg-white/5 rounded">
              الإعدادات
            </Link>

            <div className="border-t border-white/10 my-2" />

            <LogoutButton />
          </div>
        )}
      </div>

    </aside>
  )
}