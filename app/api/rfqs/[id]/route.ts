import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getServerSupabaseClient } from '@/lib/supabase/server'
import { sendWinnerEmail, sendLoserEmail } from '@/lib/email/sendAcceptEmail'

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

    const body = (await req.json()) as {
      status?: string
      selected_supplier?: string
      price?: number | null
      delivery_days?: number | null
    }
    const update: Record<string, string> = {}

    if (body.status !== undefined) {
      const allowed = ['active', 'paused', 'cancelled', 'closed', 'archived']
      if (!allowed.includes(body.status)) {
        return NextResponse.json({ error: 'Invalid status value' }, { status: 400 })
      }
      update.status = body.status
    }

    if (body.selected_supplier !== undefined) {
      // Guard: reject if RFQ is already closed (prevents double-accept)
      const { data: currentRfq } = await supabase
        .from('rfqs')
        .select('status')
        .eq('id', params.id)
        .eq('user_id', user.id)
        .maybeSingle()

      if (currentRfq?.status === 'closed') {
        return NextResponse.json({ error: 'RFQ already closed' }, { status: 400 })
      }

      update.selected_supplier = body.selected_supplier
      update.status = 'closed'
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

    // Auto-create contract when a supplier is accepted (idempotent)
    let contractId: string | null = null

    if (body.selected_supplier !== undefined) {
      try {
        // Look up the supplier's response to get price + delivery
        const { data: supplierResponse } = await supabase
          .from('responses')
          .select('price, delivery_days')
          .eq('rfq_id', params.id)
          .eq('supplier_email', body.selected_supplier)
          .maybeSingle()

        // Only insert if no contract exists for this RFQ yet
        const { data: existing, error: existingError } = await supabase
          .from('contracts')
          .select('id')
          .eq('rfq_id', params.id)
          .maybeSingle()

        if (existingError) {
          // Most likely cause: contracts table doesn't exist yet
          console.error('[CONTRACT] check error (table may be missing):', existingError)
          return NextResponse.json(
            { error: `Contracts table error: ${existingError.message}. Run the migration SQL from the Contracts page.` },
            { status: 500 },
          )
        }

        if (existing) {
          contractId = existing.id
          console.log('[CONTRACT] already exists:', existing.id)
        } else {
          const { data: newContract, error: contractError } = await supabase
            .from('contracts')
            .insert({
              rfq_id:         params.id,
              user_id:        user.id,
              supplier_email: body.selected_supplier,
              price:          supplierResponse?.price         ?? body.price          ?? null,
              delivery_days:  supplierResponse?.delivery_days ?? body.delivery_days  ?? null,
              status:         'pending',
            })
            .select('id')
            .single()

          if (contractError) {
            console.error('[CONTRACT] insert error:', contractError)
            return NextResponse.json(
              { error: `Contract creation failed: ${contractError.message}` },
              { status: 500 },
            )
          }

          console.log('[CONTRACT] created:', { id: newContract?.id, rfq_id: params.id, user_id: user.id, supplier: body.selected_supplier })
          contractId = newContract?.id ?? null
        }

        // Fetch all invited suppliers to notify everyone
        const { data: invites } = await supabase
          .from('rfq_invites')
          .select('supplier_email')
          .eq('rfq_id', params.id)

        const rfqTitle = (data as { title?: string }).title ?? 'Request for Quotation'

        // Fire notification emails in the background — never block the response
        void Promise.allSettled([
          sendWinnerEmail({
            supplierEmail: body.selected_supplier,
            rfqTitle,
            price:         supplierResponse?.price         ?? null,
            deliveryDays:  supplierResponse?.delivery_days ?? null,
          }),
          ...((invites ?? [])
            .filter((inv) => inv.supplier_email !== body.selected_supplier)
            .map((inv) =>
              sendLoserEmail({ supplierEmail: inv.supplier_email, rfqTitle })
            )),
        ]).then((results) => {
          const failed = results.filter((r) => r.status === 'rejected' || (r.status === 'fulfilled' && !r.value.success))
          if (failed.length > 0) console.warn(`[EMAIL] ${failed.length} notification(s) failed for RFQ ${params.id}`)
        })
      } catch (contractErr) {
        console.error('[CONTRACT] unexpected error:', contractErr)
        return NextResponse.json(
          { error: `Unexpected contract error: ${contractErr instanceof Error ? contractErr.message : String(contractErr)}` },
          { status: 500 },
        )
      }
    }

    return NextResponse.json({ ...data, contractId })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
