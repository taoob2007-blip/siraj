import { NextRequest, NextResponse } from 'next/server'
import { getServerSupabaseClient, getAuthUser } from '@/lib/supabase/server'

// GET /api/notifications — returns { notifications, unread_count }
export async function GET() {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = await getServerSupabaseClient()
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const unread_count = (data ?? []).filter((n) => !n.read).length
  return NextResponse.json({ notifications: data ?? [], unread_count })
}

// PATCH /api/notifications — mark as read
// Body: { id: string }  → mark single
// Body: { all: true }   → mark all
export async function PATCH(req: NextRequest) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const supabase = await getServerSupabaseClient()

  if (body.all) {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', user.id)
      .eq('read', false)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  }

  if (!body.id) return NextResponse.json({ error: 'id or all required' }, { status: 400 })

  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('id', body.id)
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

// DELETE /api/notifications — delete a single notification
// Body: { id: string }
export async function DELETE(req: NextRequest) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  if (!body.id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const supabase = await getServerSupabaseClient()
  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('id', body.id)
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
