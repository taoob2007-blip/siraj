import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'

const PUBLIC_PATHS = ['/login', '/signup', '/pricing', '/auth']

function isPublic(pathname: string) {
  return PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + '/')
  )
}

export async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname

  // Build Supabase SSR client — must use getAll/setAll, NOT get/set/remove.
  // The old API breaks token refresh and causes a login ↔ protected-route loop.
  let res = NextResponse.next({ request: { headers: req.headers } })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => req.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value }) => req.cookies.set(name, value))
          res = NextResponse.next({ request: { headers: req.headers } })
          cookiesToSet.forEach(({ name, value, options }) =>
            res.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { session } } = await supabase.auth.getSession()
  const user = session?.user ?? null

  console.log(`[middleware] ${pathname} — user: ${user?.id ?? 'none'}`)

  // ── No session ─────────────────────────────────────────────────────────────
  if (!user) {
    if (isPublic(pathname)) return res
    const url = req.nextUrl.clone()
    url.pathname = '/login'
    url.search = ''
    url.searchParams.set('next', pathname)
    return NextResponse.redirect(url)
  }

  // ── Session exists ──────────────────────────────────────────────────────────
  if (pathname === '/login' || pathname === '/signup') {
    const url = req.nextUrl.clone()
    url.pathname = '/rfqs'
    url.search = ''
    return NextResponse.redirect(url)
  }

  // Admin role check is intentionally NOT done here.
  // The middleware uses the anon key (RLS-scoped) which may not be able to
  // read profiles, causing valid admins to get redirected. The admin page
  // itself does the role check using the service role key (bypasses RLS).

  return res
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/).*)'],
}
