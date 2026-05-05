'use client'

import type { ElementType } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState, useRef } from 'react'
import {
  LayoutDashboard, FileText, Users, BarChart2,
  GitCompare, FileSignature, MessageSquare, PieChart,
  Bell, Settings, Crown, Layers, ChevronLeft
} from 'lucide-react'
import { LogoutButton } from '@/components/LogoutButton'
import { supabaseBrowserClient as supabase } from '@/lib/supabase/client'

const NAV = [
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
  const [activeIndex, setActiveIndex] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

  const [userName, setUserName] = useState('')
  const [userEmail, setUserEmail] = useState('')
  const [isPro, setIsPro] = useState(false)

  useEffect(() => {
    const index = NAV.findIndex(item =>
      item.href === '/'
        ? pathname === '/'
        : pathname.startsWith(item.href)
    )
    setActiveIndex(index === -1 ? 0 : index)
  }, [pathname])

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) return
      setUserEmail(session.user.email ?? '')

      fetch('/api/profile')
        .then(r => r.json())
        .then(data => {
          setUserName(data?.profile?.full_name ?? '')
          setIsPro(data?.profile?.subscription_status === 'active')
        })
    })
  }, [])

  const displayName = userName || userEmail.split('@')[0] || 'User'

  return (
    <aside className={`
      ${collapsed ? 'w-20' : 'w-64'}
      transition-all duration-300
      min-h-screen bg-[#0a0f1a]
      border-r border-white/[0.05]
      flex flex-col relative
    `}>

      {/* 🔥 HEADER */}
      <div className="px-4 py-5 border-b border-white/[0.05] flex flex-col items-center relative">

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute left-3 top-5 text-gray-500 hover:text-white"
        >
          <ChevronLeft className={`transition ${collapsed ? 'rotate-180' : ''}`} />
        </button>

        <img
          src="/logo-raw.png"
          className={`transition-all duration-300 ${collapsed ? 'w-8' : 'w-[140px]'}`}
        />

        {!collapsed && (
          <div className="w-2 h-2 bg-cyan-400 mt-2 rounded-full shadow-[0_0_20px_rgba(34,211,238,0.8)]" />
        )}

      </div>

      {/* NAV */}
      <div ref={containerRef} className="relative flex-1 px-2 py-4 space-y-1">

        {/* 🎯 Animated Indicator */}
        <div
          className="absolute left-0 w-[3px] bg-cyan-400 rounded-full transition-all duration-300"
          style={{
            top: `${activeIndex * 44 + 12}px`,
            height: '24px'
          }}
        />

        {NAV.map(({ href, label, icon: Icon, proOnly }, i) => {
          const active = i === activeIndex
          const locked = proOnly && !isPro

          return (
            <Link
              key={href}
              href={href}
              className={`
                relative group flex items-center gap-3 px-3 py-2.5 rounded-xl
                transition-all duration-200

                ${active
                  ? 'text-cyan-400'
                  : locked
                  ? 'text-gray-600'
                  : 'text-gray-400 hover:text-white'
                }
              `}
            >

              {/* Glow hover */}
              <div className="
                absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100
                bg-gradient-to-r from-cyan-400/10 to-transparent
                transition
              " />

              <Icon className="relative h-4 w-4" />

              {!collapsed && (
                <span className="relative text-sm flex-1">
                  {label}
                </span>
              )}

              {!collapsed && locked && (
                <Crown className="h-3 w-3 text-violet-500" />
              )}

            </Link>
          )
        })}

      </div>

      {/* USER */}
      {!collapsed && (
        <div className="px-4 py-4 border-t border-white/[0.05]">

          <div className="flex items-center gap-3 mb-3">

            <div className="h-9 w-9 rounded-full bg-cyan-400 flex items-center justify-center text-black font-bold">
              {displayName[0]}
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm text-white truncate">{displayName}</p>
              <p className="text-xs text-gray-500 truncate">{userEmail}</p>
            </div>

          </div>

          <LogoutButton />

        </div>
      )}

    </aside>
  )
}