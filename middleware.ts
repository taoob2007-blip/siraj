import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh session — keeps the cookie up-to-date on every request
  const { data: { user } } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  const isAuthPage   = pathname.startsWith('/login') || pathname.startsWith('/signup')
  const isProtected  = pathname.startsWith('/rfqs') ||
                       pathname.startsWith('/dashboard') ||
                       pathname.startsWith('/suppliers') ||
                       pathname.startsWith('/analytics') ||
                       pathname.startsWith('/comparisons') ||
                       pathname.startsWith('/contracts') ||
                       pathname.startsWith('/messages') ||
                       pathname.startsWith('/categories')

  if (!user && isProtected) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/login'
    loginUrl.searchParams.set('next', pathname)
    return NextResponse.redirect(loginUrl)
  }

  if (user && isAuthPage) {
    const rfqsUrl = request.nextUrl.clone()
    rfqsUrl.pathname = '/rfqs'
    return NextResponse.redirect(rfqsUrl)
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|form|api).*)',
  ],
}
