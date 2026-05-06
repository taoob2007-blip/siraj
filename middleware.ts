import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import { checkAccess } from '@/lib/subscription'

// Routes that need no session at all.
const PUBLIC_PATHS = ['/login', '/signup', '/pricing', '/auth', '/form']

// Routes that require a valid session but bypass the subscription gate.
// Expired users must be able to reach /billing to pay, and admins must
// always reach /admin regardless of their own subscription status.
const SUBSCRIPTION_FREE_PATHS = ['/billing', '/admin']

function isPublic(pathname: string) {
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'))
}

function isSubscriptionFree(pathname: string) {
  return SUBSCRIPTION_FREE_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'))
}

export async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname

  // Forward the pathname in request headers so server components (e.g.
  // SubscriptionBanner) can know the current route without a client component.
  const requestHeaders = new Headers(req.headers)
  requestHeaders.set('x-pathname', pathname)

  // Locale: read from cookie, forward as header for next-intl server components.
  const rawLocale = req.cookies.get('NEXT_LOCALE')?.value
  requestHeaders.set('x-locale', rawLocale === 'ar' ? 'ar' : 'en')

  // Build the Supabase SSR client.
  // IMPORTANT: must use getAll/setAll — the old get/set/remove API breaks token
  // refresh and causes infinite redirect loops.
  let res = NextResponse.next({ request: { headers: requestHeaders } })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => req.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value }) => req.cookies.set(name, value))
          // Preserve the x-pathname header when the token-refresh rewrites res.
          res = NextResponse.next({ request: { headers: requestHeaders } })
          cookiesToSet.forEach(({ name, value, options }) =>
            res.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // getSession() reads the JWT from the cookie — no network call.
  const { data: { session } } = await supabase.auth.getSession()
  const user = session?.user ?? null

  // ── No session ─────────────────────────────────────────────────────────────
  if (!user) {
    if (isPublic(pathname)) return res
    const url = req.nextUrl.clone()
    url.pathname = '/login'
    url.search   = ''
    url.searchParams.set('next', pathname)
    return NextResponse.redirect(url)
  }

  // ── Logged-in user on login/signup → push to app ───────────────────────────
  if (pathname === '/login' || pathname === '/signup') {
    const url = req.nextUrl.clone()
    url.pathname = '/rfqs'
    url.search   = ''
    return NextResponse.redirect(url)
  }

  // ── Skip subscription gate for public and billing/admin paths ──────────────
  if (isPublic(pathname) || isSubscriptionFree(pathname)) return res

  // ── Subscription gate — one DB read per protected page navigation ──────────
  // Uses the user's cookie-based session so RLS ensures they only read their
  // own profile. We fail *open* on error so a DB outage doesn't lock everyone out.
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_status, trial_ends_at, subscription_ends_at')
      .eq('id', user.id)
      .single()

    console.log('[middleware] PROFILE:', profile)

    // No profile row yet (trigger hasn't run, or race condition on signup).
    // Let the user through — the trigger/SQL fix will create the row shortly.
    if (!profile) {
      console.log('[middleware] No profile found → allowing access temporarily')
      return res
    }

    const { allowed } = checkAccess(profile)

    console.log(`[middleware] ${pathname} | USER: ${user.id} | allowed: ${allowed} | status: ${profile.subscription_status ?? 'none'}`)

    if (!allowed) {
      const url = req.nextUrl.clone()
      url.pathname = '/pricing'
      url.search   = ''
      return NextResponse.redirect(url)
    }
  } catch (err) {
    // Fail open: a subscription-check error should not lock users out.
    console.error('[middleware] subscription check error — allowing through:', err)
  }

  return res
}

export const config = {
  // Exclude Next.js internals, static files, and API routes.
  // API routes handle their own auth; subscription check there would double the DB calls.
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/).*)'],
}
