import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'

export async function middleware(request: NextRequest) {
  const response = NextResponse.next()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  // ⚠️ أهم شيء: هذا اللي يحدث session
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
    pathname.startsWith('/categories')

  // ❌ لو ما فيه session → يروح login
  if (!session && isProtected) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/login'
    loginUrl.searchParams.set('next', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // ❌ لو فيه session → لا يرجع login
  if (session && isAuthPage) {
    const url = request.nextUrl.clone()
    url.pathname = '/rfqs'
    return NextResponse.redirect(url)
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|form|api).*)',
  ],
}