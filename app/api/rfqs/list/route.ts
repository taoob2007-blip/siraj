import { NextResponse } from 'next/server'
import { getServerSupabaseClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const supabase = await getServerSupabaseClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data, error } = await supabase
    .from('rfqs')
    .select(`
      id,
      title,
      description,
      status,
      created_at,
      rfq_invites(count),
      responses(count)
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const enriched = (data ?? []).map((row: any) => ({
    id:             row.id,
    title:          row.title,
    description:    row.description,
    status:         row.status,
    created_at:     row.created_at,
    invite_count:   Array.isArray(row.rfq_invites)  ? row.rfq_invites[0]?.count  ?? 0 : 0,
    response_count: Array.isArray(row.responses)     ? row.responses[0]?.count    ?? 0 : 0,
  }))

  return NextResponse.json(enriched, {
    headers: { 'Cache-Control': 'no-store' },
  })
}
