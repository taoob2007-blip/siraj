'use client'

import { LogOut } from 'lucide-react'
import { useState } from 'react'

export function LogoutButton() {
  const [loading, setLoading] = useState(false)

  function handleLogout() {
    setLoading(true)
    // Hard navigation to the server-side signout route.
    // The route calls supabase.auth.signOut() which clears the cookie session,
    // then redirects to /login. A full page reload is required so that:
    //   1. The middleware sees empty cookies and allows /login
    //   2. The React tree is completely torn down (no stale auth state)
    window.location.href = '/api/auth/signout'
  }

  return (
    <button
      onClick={handleLogout}
      disabled={loading}
      className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors disabled:opacity-50 w-full px-3 py-2 rounded-lg hover:bg-white/5"
    >
      <LogOut className="h-4 w-4" />
      {loading ? 'Signing out…' : 'Sign out'}
    </button>
  )
}
