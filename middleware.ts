import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import { checkAccess } from '@/lib/subscription'

// ── Route classification ───────────────────────────────────────────────────────

// Public routes (مهم جداً تضمين auth/callback)
function isPublicPath(pathname: string) {
  return (
    pathname === '/' ||
    pathname.startsWith('/login') ||
    pathname.startsWith('/signup') ||
    pathname.startsWith('/auth') || // يشمل /auth/callback
    pathname.startsWith('/pricing')
  )
}

// Subscription protected routes
const SUBSCRIPTION_GATED_PREFIXES = [
  '/rfqs',
  '/suppliers',
  '/categories',
  '/analytics',
  '/comparisons',
  '/contracts',
  '/messages',
  '/reports',
]

function isSubscriptionGated(pathname: string) {
  return SUBSCRIPTION_GATED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(p + '/')
  )
}

// ── Middleware ─────────────────────────────────────────────────────────────────

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // ⚠️ لا تستخدم redirect www هنا (يسبب مشاكل OAuth)

  let response = NextResponse.next({
    request: { headers: request.headers },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          response = NextResponse.next({
            request: { headers: request.headers },
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { session },
  } = await supabase.auth.getSession()

  const user = session?.user ?? null

  console.log(`[middleware] PATH: ${pathname} USER: ${user?.id ?? 'none'}`)

  // ── 1. إذا ما فيه تسجيل دخول ───────────────────────────────────────────────
  if (!user) {
    if (isPublicPath(pathname)) {
      return response
    }

    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/login'
    loginUrl.searchParams.set('next', pathname)

    return NextResponse.redirect(loginUrl)
  }

  // ── 2. إذا مسجل ويحاول يدخل login ─────────────────────────────────────────
  if (pathname.startsWith('/login') || pathname.startsWith('/signup')) {
    const url = request.nextUrl.clone()
    url.pathname = '/rfqs'
    url.search = ''
    return NextResponse.redirect(url)
  }

  // ── 3. حماية admin ─────────────────────────────────────────────────────────
  if (pathname.startsWith('/admin')) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      const url = request.nextUrl.clone()
      url.pathname = '/rfqs'
      return NextResponse.redirect(url)
    }

    return response
  }

  // ── 4. حماية الاشتراك ──────────────────────────────────────────────────────
  if (isSubscriptionGated(pathname)) {
    const { data: profile } = await supabase
      .from('profiles')
      .select(
        'subscription_status, trial_ends_at, subscription_ends_at'
      )
      .eq('id', user.id)
      .single()

    const { allowed } = checkAccess(profile)

    if (!allowed) {
      const url = request.nextUrl.clone()
      url.pathname = '/pricing'
      return NextResponse.redirect(url)
    }
  }

  // ── 5. كل شيء تمام ─────────────────────────────────────────────────────────
  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/).*)'],
}