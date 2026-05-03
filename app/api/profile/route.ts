import { NextRequest, NextResponse } from 'next/server'
import { getServerSupabaseClient, getAuthUser } from '@/lib/supabase/server'

// GET /api/profile — returns { profile, email }
export async function GET() {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = await getServerSupabaseClient()
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (error && error.code !== 'PGRST116') {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    profile: data ?? { id: user.id, full_name: null, company: null, role: null, updated_at: null },
    email: user.email ?? '',
  })
}

// PATCH /api/profile — upsert profile fields
// Body: { full_name?, company?, role? }
export async function PATCH(req: NextRequest) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const { full_name, company, role } = body

  const supabase = await getServerSupabaseClient()
  const { data, error } = await supabase
    .from('profiles')
    .upsert({
      id: user.id,
      full_name: full_name ?? null,
      company:   company   ?? null,
      role:      role      ?? null,
      updated_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ profile: data })
}
