import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getServerSupabaseClient, getServiceSupabaseClient } from '@/lib/supabase/server'
import { sendWinnerEmail, sendLoserEmail } from '@/lib/email/sendAcceptEmail'
import { logContractEvent } from '@/lib/contracts/audit'

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
      console.error('RFQ fetch error:', rfqError)
      return NextResponse.json({ error: 'Failed to load RFQ' }, { status: 500 })
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
    console.error('GET /api/rfqs/[id] error:', err)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
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
      return NextResponse.json({ error: 'Failed to delete RFQ' }, { status: 500 })
    }

    if (count === 0) {
      return NextResponse.json({ error: 'RFQ not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    console.error('DELETE /api/rfqs/[id] error:', error)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
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

    // Track whether the RFQ was already closed before this request
    let alreadyClosed = false

    if (body.selected_supplier !== undefined) {
      const { data: currentRfq } = await supabase
        .from('rfqs')
        .select('status, selected_supplier')
        .eq('id', params.id)
        .eq('user_id', user.id)
        .maybeSingle()

      if (currentRfq?.status === 'closed') {
        if (currentRfq.selected_supplier !== body.selected_supplier) {
          // Different supplier — genuinely can't change the accepted supplier
          return NextResponse.json({ error: 'RFQ already closed with a different supplier' }, { status: 400 })
        }
        // Same supplier: RFQ is closed but contract may be missing — skip the RFQ update
        // and fall through to the contract + email logic below.
        alreadyClosed = true
      } else {
        update.selected_supplier = body.selected_supplier
        update.status = 'closed'
      }
    }

    if (!alreadyClosed && Object.keys(update).length === 0) {
      return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })
    }

    // Only run the DB update when the RFQ isn't already in the right state
    let data: Record<string, unknown> = {}
    if (!alreadyClosed) {
      const { data: updatedRfq, error } = await supabase
        .from('rfqs')
        .update(update)
        .eq('id', params.id)
        .eq('user_id', user.id)
        .select()
        .single()

      if (error) {
        console.error('RFQ update error:', error)
        return NextResponse.json({ error: 'Failed to update RFQ' }, { status: 500 })
      }
      data = updatedRfq as Record<string, unknown>
    } else {
      // Re-fetch current RFQ data for use in emails below
      const { data: existingRfq } = await supabase
        .from('rfqs')
        .select('title')
        .eq('id', params.id)
        .eq('user_id', user.id)
        .single()
      data = existingRfq as Record<string, unknown> ?? {}
    }

    // Auto-create contract + send emails when a supplier is accepted
    let contractId: string | null = null

    if (body.selected_supplier !== undefined) {
      try {
        // Use service role to bypass RLS — the user was already authenticated above
        const serviceClient = getServiceSupabaseClient()

        // Look up the supplier's response to get price + delivery
        const { data: supplierResponse } = await serviceClient
          .from('responses')
          .select('price, delivery_days')
          .eq('rfq_id', params.id)
          .eq('supplier_email', body.selected_supplier)
          .maybeSingle()

        // Idempotency: skip insert if a contract already exists for this RFQ
        const { data: existing, error: existingError } = await serviceClient
          .from('contracts')
          .select('id')
          .eq('rfq_id', params.id)
          .maybeSingle()

        if (existingError) {
          // Log but do NOT abort — table might have no rows, not an actual error
          console.error('[CONTRACT] check error:', existingError)
        }

        if (existing) {
          contractId = existing.id
          console.log('[CONTRACT] already exists:', existing.id)
        } else {
          const { data: newContract, error: contractError } = await serviceClient
            .from('contracts')
            .insert({
              rfq_id:         params.id,
              user_id:        user.id,
              supplier_email: body.selected_supplier,
              price:          supplierResponse?.price         ?? body.price          ?? null,
              delivery_days:  supplierResponse?.delivery_days ?? body.delivery_days  ?? null,
              status:         'pending',
            })
            .select('id, signing_token')
            .single()

          if (contractError) {
            console.error('[CONTRACT] insert error:', contractError)
            // Return 500 only for the contract step — RFQ is already updated
            return NextResponse.json({ error: 'Failed to create contract', contractId: null }, { status: 500 })
          }

          console.log('[CONTRACT] created:', { id: newContract?.id, rfq_id: params.id, supplier: body.selected_supplier })
          contractId = newContract?.id ?? null

          if (newContract?.id) {
            void logContractEvent({
              supabase: serviceClient,
              contractId: newContract.id,
              event: 'created',
              userId: user.id,
              metadata: { rfq_id: params.id, supplier_email: body.selected_supplier },
            })
          }
        }

        // Fetch all invited suppliers then send winner + loser emails in background
        const { data: invites } = await serviceClient
          .from('rfq_invites')
          .select('supplier_email')
          .eq('rfq_id', params.id)

        const rfqTitle = (data as { title?: string }).title ?? 'Request for Quotation'

        void Promise.allSettled([
          sendWinnerEmail({
            supplierEmail: body.selected_supplier,
            rfqTitle,
            price:         supplierResponse?.price         ?? null,
            deliveryDays:  supplierResponse?.delivery_days ?? null,
          }),
          ...((invites ?? [])
            .filter((inv) => inv.supplier_email !== body.selected_supplier)
            .map((inv) => sendLoserEmail({ supplierEmail: inv.supplier_email, rfqTitle }))
          ),
        ]).then((results) => {
          const failed = results.filter((r) => r.status === 'rejected' || (r.status === 'fulfilled' && !r.value.success))
          if (failed.length > 0) console.warn(`[EMAIL] ${failed.length} notification(s) failed for RFQ ${params.id}`)
          else console.log(`[EMAIL] All notifications sent for RFQ ${params.id}`)
        })
      } catch (contractErr) {
        console.error('[CONTRACT] unexpected error:', contractErr)
        return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
      }
    }

    return NextResponse.json({ ...data, contractId })
  } catch (error: unknown) {
    console.error('PATCH /api/rfqs/[id] error:', error)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
