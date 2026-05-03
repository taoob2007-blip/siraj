import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import { checkAccess } from '@/lib/subscription'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: { headers: request.headers },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request: { headers: request.headers } })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Always refresh session tokens
  const { data: { session } } = await supabase.auth.getSession()
  const { pathname } = request.nextUrl

  // ── 1. Auth: routes that need a session ────────────────────────────────────
  const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/signup')

  const isAuthRequired =
    pathname === '/' ||
    pathname.startsWith('/rfqs') ||
    pathname.startsWith('/suppliers') ||
    pathname.startsWith('/categories') ||
    pathname.startsWith('/analytics') ||
    pathname.startsWith('/comparisons') ||
    pathname.startsWith('/contracts') ||
    pathname.startsWith('/messages') ||
    pathname.startsWith('/reports') ||
    pathname.startsWith('/notifications') ||
    pathname.startsWith('/settings') ||
    pathname.startsWith('/billing') ||
    pathname.startsWith('/admin')

  if (!session && isAuthRequired) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('next', pathname)
    return NextResponse.redirect(url)
  }

  if (session && isAuthPage) {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  // ── 2. Subscription gate: feature routes need active/trial access ──────────
  // /billing and /settings are always reachable (so expired users can pay/update)
  // /admin is role-gated at page level, not subscription-gated
  const isSubscriptionGated =
    pathname === '/' ||
    pathname.startsWith('/rfqs') ||
    pathname.startsWith('/suppliers') ||
    pathname.startsWith('/categories') ||
    pathname.startsWith('/analytics') ||
    pathname.startsWith('/comparisons') ||
    pathname.startsWith('/contracts') ||
    pathname.startsWith('/messages') ||
    pathname.startsWith('/reports')

  if (session && isSubscriptionGated) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_status, trial_ends_at, subscription_ends_at')
      .eq('id', session.user.id)
      .single()

    const { allowed } = checkAccess(profile)

    if (!allowed) {
      const url = request.nextUrl.clone()
      url.pathname = '/billing'
      // Avoid redirect loop
      if (pathname !== '/billing') return NextResponse.redirect(url)
    }
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|form|api).*)',],
}
