import { NextRequest, NextResponse } from 'next/server'
import { getServerSupabaseClient } from '@/lib/supabase/server'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = (await req.json()) as { status?: string; signature?: string }
    const allowed = ['pending', 'signed', 'cancelled']
    if (!body.status || !allowed.includes(body.status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    // Signature is required when signing
    if (body.status === 'signed' && !body.signature) {
      return NextResponse.json({ error: 'Signature is required to sign a contract' }, { status: 400 })
    }

    const supabase = await getServerSupabaseClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // RLS enforces ownership but we also check explicitly for a clear 404 vs 500
    const { data: existing } = await supabase
      .from('contracts')
      .select('id, status')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .maybeSingle()

    if (!existing) {
      return NextResponse.json({ error: 'Contract not found' }, { status: 404 })
    }

    if (existing.status === 'signed' && body.status === 'signed') {
      return NextResponse.json({ error: 'Contract already signed' }, { status: 400 })
    }

    const updatePayload: Record<string, string> = { status: body.status }
    if (body.status === 'signed' && body.signature) {
      updatePayload.buyer_signature = body.signature
      updatePayload.signed_at = new Date().toISOString()
    }

    const { data, error } = await supabase
      .from('contracts')
      .update(updatePayload)
      .eq('id', params.id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 })
  }
}
