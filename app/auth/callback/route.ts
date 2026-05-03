import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const origin = requestUrl.origin

  // Supabase sends errors as query params when the OAuth flow fails server-side
  // (e.g. database trigger failure during user creation).
  const supabaseError = requestUrl.searchParams.get('error_description')
    || requestUrl.searchParams.get('error')
  if (supabaseError) {
    console.error('[auth/callback] Supabase error:', supabaseError)
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(supabaseError)}`
    )
  }

  const code = requestUrl.searchParams.get('code')
  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=no_code`)
  }

  const response = NextResponse.redirect(`${origin}/rfqs`)

  const isLocalhost =
    origin.includes('localhost') || origin.includes('127.0.0.1')

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
    console.error('Auth error:', error.message)
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(error.message)}`
    )
  }

  return response
}