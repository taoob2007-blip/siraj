'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Menu, Bell, Plus, X } from 'lucide-react'

const ROUTE_LABELS: Record<string, string> = {
  '/':             'Dashboard',
  '/rfqs':         'RFQs',
  '/rfqs/new':     'New RFQ',
  '/suppliers':    'Suppliers',
  '/categories':   'Categories',
  '/analytics':    'Analytics',
  '/comparisons':  'Comparisons',
  '/contracts':    'Contracts',
  '/messages':     'Messages',
  '/reports':      'Reports',
  '/notifications':'Notifications',
  '/settings':     'Settings',
  '/billing':      'Billing',
  '/pricing':      'Pricing',
}

function getRouteLabel(pathname: string) {
  if (ROUTE_LABELS[pathname]) return ROUTE_LABELS[pathname]
  if (pathname.startsWith('/rfqs/')) return 'RFQ Details'
  if (pathname.startsWith('/suppliers/')) return 'Supplier'
  if (pathname.startsWith('/contracts/')) return 'Contract'
  if (pathname.startsWith('/comparisons/')) return 'Comparison'
  if (pathname.startsWith('/categories/')) return 'Category'
  return 'SIRAJ'
}

export function MobileHeader() {
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const pageLabel = getRouteLabel(pathname)

  function toggleSidebar() {
    const next = !sidebarOpen
    setSidebarOpen(next)
    window.dispatchEvent(new CustomEvent('mobile-sidebar', { detail: { open: next } }))
  }

  // Sync with sidebar close events (e.g., backdrop click)
  useEffect(() => {
    function handleSidebarState(e: CustomEvent) {
      setSidebarOpen(e.detail.open)
    }
    window.addEventListener('mobile-sidebar' as any, handleSidebarState)
    return () => window.removeEventListener('mobile-sidebar' as any, handleSidebarState)
  }, [])

  // Close sidebar on route change
  useEffect(() => {
    setSidebarOpen(false)
    window.dispatchEvent(new CustomEvent('mobile-sidebar', { detail: { open: false } }))
  }, [pathname])

  return (
    <header className="
      md:hidden fixed top-0 left-0 right-0 z-40
      h-14 flex items-center justify-between
      bg-[#0B0F19]/95 backdrop-blur-xl
      border-b border-white/[0.06]
      px-4
      safe-area-top
    ">
      {/* Left: hamburger */}
      <button
        onClick={toggleSidebar}
        aria-label="Toggle menu"
        className="
          flex items-center justify-center
          w-10 h-10 -ml-1
          rounded-xl
          text-gray-400 hover:text-white
          hover:bg-white/[0.06]
          active:bg-white/[0.10]
          active:scale-95
          transition-all duration-150
        "
      >
        {sidebarOpen
          ? <X className="w-5 h-5" />
          : <Menu className="w-5 h-5" />
        }
      </button>

      {/* Center: logo or page label */}
      <div className="absolute left-1/2 -translate-x-1/2 flex items-center">
        <Image
          src="/logo-bar.png"
          alt="SIRAJ"
          width={72}
          height={22}
          priority
          className="object-contain brightness-110 contrast-125 mix-blend-lighten opacity-90"
        />
      </div>

      {/* Right: quick actions */}
      <div className="flex items-center gap-1">
        <Link href="/notifications">
          <button
            aria-label="Notifications"
            className="
              flex items-center justify-center
              w-10 h-10
              rounded-xl
              text-gray-400 hover:text-white
              hover:bg-white/[0.06]
              active:bg-white/[0.10]
              active:scale-95
              transition-all duration-150
            "
          >
            <Bell className="w-4.5 h-4.5" />
          </button>
        </Link>

        <Link href="/rfqs/new">
          <button
            aria-label="New RFQ"
            className="
              flex items-center justify-center
              w-9 h-9
              rounded-xl
              bg-cyan-400 hover:bg-cyan-300
              active:scale-95
              transition-all duration-150
              shadow-lg shadow-cyan-400/20
            "
          >
            <Plus className="w-4 h-4 text-black" />
          </button>
        </Link>
      </div>
    </header>
  )
}
