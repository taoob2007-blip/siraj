import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: { headers: request.headers },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          // Write refreshed tokens back to the request so that getSession()
          // and any subsequent reads within the same request see updated values.
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          // Rebuild response so the Set-Cookie headers reach the browser.
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

  // Always call getSession() — this refreshes expired access tokens and
  // writes the refreshed cookies via setAll above.
  const { data: { session } } = await supabase.auth.getSession()

  const { pathname } = request.nextUrl

  const isAuthPage =
    pathname.startsWith('/login') ||
    pathname.startsWith('/signup')

  const isProtected =
    pathname.startsWith('/rfqs') ||
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/suppliers') ||
    pathname.startsWith('/analytics') ||
    pathname.startsWith('/comparisons') ||
    pathname.startsWith('/contracts') ||
    pathname.startsWith('/messages') ||
    pathname.startsWith('/categories') ||
    pathname === '/'

  if (!session && isProtected) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/login'
    loginUrl.searchParams.set('next', pathname)
    return NextResponse.redirect(loginUrl)
  }

  if (session && isAuthPage) {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|form|api).*)',
  ],
}
