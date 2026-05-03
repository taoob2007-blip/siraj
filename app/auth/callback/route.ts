import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/rfqs'

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=no_code`)
  }

  const response = NextResponse.redirect(`${origin}${next}`)

  // On localhost (HTTP) browsers silently drop Secure cookies, so we must
  // derive the secure flag from the actual origin rather than hardcoding it.
  const isLocalhost =
    origin.startsWith('http://localhost') ||
    origin.startsWith('http://127.0.0.1')

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, {
              ...options,
              secure: !isLocalhost,
            })
          })
        },
      },
    }
  )

  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    console.error('[auth/callback] exchangeCodeForSession error:', error.message)
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(error.message)}`
    )
  }

  return response
}