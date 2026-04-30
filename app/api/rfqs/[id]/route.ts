import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getServerSupabaseClient } from '@/lib/supabase/server'

interface RouteParams {
  params: { id: string }
}

export async function GET(_req: NextRequest, { params }: RouteParams) {
  try {
    const rfqId = params?.id?.trim()
    if (!rfqId) {
      return NextResponse.json({ error: 'Missing RFQ id' }, { status: 400 })
    }

    // Service-role client bypasses RLS so the page can load without cookies.
    // Access control for this route is enforced at the page/middleware level.
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )

    const { data: rfq, error: rfqError } = await supabase
      .from('rfqs')
      .select('*')
      .eq('id', rfqId)
      .maybeSingle()

    if (rfqError) {
      return NextResponse.json({ error: rfqError.message }, { status: 500 })
    }

    if (!rfq) {
      return NextResponse.json({ error: 'RFQ not found' }, { status: 404 })
    }

    const [{ data: invites }, { data: responses }] = await Promise.all([
      supabase
        .from('rfq_invites')
        .select('*')
        .eq('rfq_id', rfqId)
        .order('created_at', { ascending: false }),
      supabase
        .from('responses')
        .select('*')
        .eq('rfq_id', rfqId)
        .order('created_at', { ascending: true }),
    ])

    return NextResponse.json(
      { rfq, invites: invites ?? [], responses: responses ?? [] },
      { headers: { 'Cache-Control': 'no-store' } },
    )
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  try {
    const supabase = await getServerSupabaseClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { error, count } = await supabase
      .from('rfqs')
      .delete({ count: 'exact' })
      .eq('id', params.id)
      .eq('user_id', user.id)

    if (error) {
      console.error('Supabase delete error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (count === 0) {
      return NextResponse.json({ error: 'RFQ not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const supabase = await getServerSupabaseClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = (await req.json()) as { status?: string; selected_supplier?: string }
    const update: Record<string, string> = {}

    if (body.status !== undefined) {
      const allowed = ['active', 'paused', 'cancelled', 'closed', 'archived']
      if (!allowed.includes(body.status)) {
        return NextResponse.json({ error: 'Invalid status value' }, { status: 400 })
      }
      update.status = body.status
    }

    if (body.selected_supplier !== undefined) {
      update.selected_supplier = body.selected_supplier
    }

    if (Object.keys(update).length === 0) {
      return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('rfqs')
      .update(update)
      .eq('id', params.id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
