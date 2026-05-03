import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'

// Routes that never require a session.
// Keep this list minimal — anything not here is protected by default.
const PUBLIC_PATHS = [
  '/login',
  '/signup',
  '/pricing',
  '/auth',   // covers /auth/callback and any future /auth/* routes
]

function isPublic(pathname: string) {
  return PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + '/')
  )
}

export async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname

  // ── 0. Canonical domain: www → non-www ──────────────────────────────────
  const host = req.headers.get('host') ?? ''
  if (host.startsWith('www.')) {
    const url = req.nextUrl.clone()
    url.host = host.slice(4)
    url.protocol = 'https:'
    return NextResponse.redirect(url, { status: 301 })
  }

  // ── Build Supabase SSR client ────────────────────────────────────────────
  // IMPORTANT: use getAll/setAll (not get/set/remove).
  // The old API breaks token refresh — refreshed tokens are written to
  // res.cookies but never propagated back into req.cookies, so the very
  // next request sees an expired token and getSession() returns null,
  // causing a login ↔ protected-route redirect loop.
  let res = NextResponse.next({ request: { headers: req.headers } })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => req.cookies.getAll(),
        setAll: (cookiesToSet) => {
          // Write into req so the rest of this middleware invocation can read
          // the refreshed values, then persist into res so the browser gets them.
          cookiesToSet.forEach(({ name, value }) => req.cookies.set(name, value))
          res = NextResponse.next({ request: { headers: req.headers } })
          cookiesToSet.forEach(({ name, value, options }) =>
            res.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // getSession() reads the JWT from the cookie — no network call.
  // If the access token is expired it uses the refresh token automatically.
  const { data: { session } } = await supabase.auth.getSession()
  const user = session?.user ?? null

  console.log(`[middleware] PATH: ${pathname}  USER: ${user?.id ?? 'none'}`)

  // ── 1. No session ────────────────────────────────────────────────────────
  if (!user) {
    // Public routes are always allowed without a session.
    if (isPublic(pathname)) return res

    // Anything else → redirect to /login, preserving the intended destination.
    const loginUrl = req.nextUrl.clone()
    loginUrl.pathname = '/login'
    loginUrl.search = ''
    loginUrl.searchParams.set('next', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // ── 2. Session exists ────────────────────────────────────────────────────

  // Bounce logged-in users away from /login and /signup.
  if (pathname === '/login' || pathname === '/signup') {
    const url = req.nextUrl.clone()
    url.pathname = '/rfqs'
    url.search = ''
    return NextResponse.redirect(url)
  }

  // ── 3. Admin gate ────────────────────────────────────────────────────────
  if (pathname.startsWith('/admin')) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      const url = req.nextUrl.clone()
      url.pathname = '/rfqs'
      url.search = ''
      return NextResponse.redirect(url)
    }
  }

  // ── 4. All checks passed ─────────────────────────────────────────────────
  return res
}

export const config = {
  // Exclude Next.js internals, static assets, and API routes.
  // API routes handle their own auth — putting them through middleware
  // would add latency and could interfere with Supabase webhook handlers.
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/).*)'],
}
