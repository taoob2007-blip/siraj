import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import { checkAccess } from '@/lib/subscription'

// ── Route classification ───────────────────────────────────────────────────────
// Public: no session required, never redirect away from these.
const PUBLIC_PATHS = ['/login', '/signup', '/auth', '/pricing']

// Subscription-gated: session required AND active/trial plan required.
const SUBSCRIPTION_GATED_PREFIXES = [
  '/rfqs', '/suppliers', '/categories', '/analytics',
  '/comparisons', '/contracts', '/messages', '/reports',
]

function isPublicPath(pathname: string) {
  return PUBLIC_PATHS.some(p => pathname === p || pathname.startsWith(p + '/') || pathname.startsWith(p + '?'))
    || pathname === '/'   // landing page — public
}

function isSubscriptionGated(pathname: string) {
  return SUBSCRIPTION_GATED_PREFIXES.some(p => pathname === p || pathname.startsWith(p + '/'))
}

// ── Middleware ─────────────────────────────────────────────────────────────────
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // ── 0. Canonical domain: www → non-www (production only) ──────────────────
  const host = request.headers.get('host') ?? ''
  if (host.startsWith('www.')) {
    const url = request.nextUrl.clone()
    url.host = host.slice(4)
    url.protocol = 'https:'
    return NextResponse.redirect(url, { status: 301 })
  }

  // ── Build Supabase SSR client ──────────────────────────────────────────────
  // `response` may be replaced inside setAll when Supabase refreshes tokens.
  // Always return the local `response` at the end, never a freshly constructed
  // NextResponse.next(), so that Set-Cookie headers are preserved.
  let response = NextResponse.next({ request: { headers: request.headers } })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          // Write into the request so the rest of this middleware invocation
          // can read the refreshed values, then persist into the response.
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request: { headers: request.headers } })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // getSession() is safe in middleware because it reads the JWT from the cookie
  // without a network call. getUser() would verify with the Supabase server on
  // every request — too slow for middleware on every route.
  const { data: { session } } = await supabase.auth.getSession()
  const user = session?.user ?? null

  console.log(`[middleware] PATH: ${pathname}  USER: ${user?.id ?? 'none'}`)

  // ── 1. No session ──────────────────────────────────────────────────────────
  if (!user) {
    // Public routes are always allowed without a session.
    if (isPublicPath(pathname)) return response

    // Everything else requires a login. Preserve the intended destination so
    // AuthForm / the callback can redirect back after successful sign-in.
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/login'
    loginUrl.searchParams.set('next', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // ── 2. Session exists ──────────────────────────────────────────────────────

  // Never let a logged-in user land on /login or /signup — send to dashboard.
  if (pathname === '/login' || pathname === '/signup') {
    const url = request.nextUrl.clone()
    url.pathname = '/rfqs'
    url.search = ''
    return NextResponse.redirect(url)
  }

  // ── 3. Admin gate ──────────────────────────────────────────────────────────
  if (pathname.startsWith('/admin')) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      const url = request.nextUrl.clone()
      url.pathname = '/rfqs'
      url.search = ''
      return NextResponse.redirect(url)
    }

    // Admins bypass subscription checks — fall through to response.
    return response
  }

  // ── 4. Subscription gate ───────────────────────────────────────────────────
  // Only applies to feature routes; billing/settings/pricing/admin stay open.
  if (isSubscriptionGated(pathname)) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_status, trial_ends_at, subscription_ends_at')
      .eq('id', user.id)
      .single()

    const { allowed } = checkAccess(profile)

    if (!allowed) {
      const url = request.nextUrl.clone()
      url.pathname = '/pricing'
      url.search = ''
      return NextResponse.redirect(url)
    }
  }

  // ── 5. All checks passed ───────────────────────────────────────────────────
  return response
}

export const config = {
  // Skip Next.js internals, static assets, and API routes.
  // API routes handle their own auth; static files don't need session checks.
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/).*)'],
}
