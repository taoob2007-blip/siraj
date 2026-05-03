import Link from 'next/link'
import { AlertTriangle, Clock } from 'lucide-react'
import { getAuthUser, getServerSupabaseClient } from '@/lib/supabase/server'
import { checkAccess } from '@/lib/subscription'

export async function SubscriptionBanner() {
  try {
    const user = await getAuthUser()
    if (!user) return null

    const supabase = await getServerSupabaseClient()
    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_status, trial_ends_at, subscription_ends_at')
      .eq('id', user.id)
      .single()

    const { allowed, status, daysLeft } = checkAccess(profile)

    // Show for trial users with ≤ 7 days left
    const nearExpiry = status === 'trial' && allowed && daysLeft <= 7
    // Show for expired users (middleware will redirect them to /billing but show banner just in case)
    const expired = !allowed

    if (!nearExpiry && !expired) return null

    if (expired) {
      return (
        <div className="bg-red-900/30 border-b border-red-500/20 px-6 py-2.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 min-w-0">
            <AlertTriangle className="h-3.5 w-3.5 text-red-400 shrink-0" />
            <p className="text-xs text-red-300 font-medium truncate">
              Your subscription has expired. Some features may be unavailable.
            </p>
          </div>
          <Link
            href="/billing"
            className="shrink-0 text-xs px-3 py-1 rounded-lg bg-red-600 hover:bg-red-500 text-white font-semibold transition-colors"
          >
            Renew Now
          </Link>
        </div>
      )
    }

    return (
      <div className="bg-amber-900/20 border-b border-amber-500/15 px-6 py-2.5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 min-w-0">
          <Clock className="h-3.5 w-3.5 text-amber-400 shrink-0" />
          <p className="text-xs text-amber-300 font-medium truncate">
            Your trial ends in <span className="font-bold">{daysLeft} day{daysLeft !== 1 ? 's' : ''}</span>. Upgrade to keep access.
          </p>
        </div>
        <Link
          href="/billing"
          className="shrink-0 text-xs px-3 py-1 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-semibold transition-colors"
        >
          Upgrade
        </Link>
      </div>
    )
  } catch {
    return null
  }
}
