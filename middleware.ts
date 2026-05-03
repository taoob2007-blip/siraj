import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name) => req.cookies.get(name)?.value,
        set: (name, value, options) => {
          res.cookies.set(name, value, options)
        },
        remove: (name, options) => {
          res.cookies.set(name, '', { ...options, maxAge: 0 })
        },
      },
    }
  )

  const {
    data: { session },
  } = await supabase.auth.getSession()

  const pathname = req.nextUrl.pathname

  // ✅ صفحات عامة
  if (
    pathname === '/' ||
    pathname.startsWith('/login') ||
    pathname.startsWith('/signup') ||
    pathname.startsWith('/auth') ||
    pathname.startsWith('/pricing')
  ) {
    return res
  }

  // ❌ إذا ما فيه تسجيل دخول
  if (!session) {
    // 🔥 أهم سطر يمنع اللوب
    if (pathname === '/login') return res

    const url = req.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // ✅ إذا مسجل دخول لا يرجع للوقن
  if (pathname === '/login' || pathname === '/signup') {
    const url = req.nextUrl.clone()
    url.pathname = '/rfqs'
    return NextResponse.redirect(url)
  }

  return res
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}