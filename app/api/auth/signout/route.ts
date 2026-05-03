import { type NextRequest, NextResponse } from 'next/server'
import { getServerSupabaseClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const supabase = await getServerSupabaseClient()
  await supabase.auth.signOut()

  console.log('SESSION AFTER LOGOUT', await supabase.auth.getSession())

  const origin = req.nextUrl.origin
  return NextResponse.redirect(`${origin}/login`)
}
