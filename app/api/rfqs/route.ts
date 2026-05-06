import { NextRequest, NextResponse } from 'next/server'
import { getServerSupabaseClient } from '@/lib/supabase/server'
import { CreateRFQRequest, CreateRFQResponse, DEFAULT_RFQ_FIELDS } from '@/lib/types'
import { BASE_URL } from '@/lib/constants'
import { randomUUID } from 'node:crypto'
import { sendRFQEmail } from '@/lib/email/sendRFQEmail'

export async function GET() {
  try {
    const supabase = await getServerSupabaseClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data, error } = await supabase
      .from('rfqs')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ rfqs: data ?? [] })
  } catch (error: unknown) {
    console.error('GET /api/rfqs error:', error)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await getServerSupabaseClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = user.id
    const body: CreateRFQRequest = await req.json()

    if (!body.title?.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    if (!Array.isArray(body.suppliers) || body.suppliers.length === 0) {
      return NextResponse.json({ error: 'At least one supplier is required' }, { status: 400 })
    }

    for (const supplier of body.suppliers) {
      if (!supplier.name?.trim() || !supplier.email?.trim()) {
        return NextResponse.json(
          { error: 'All suppliers must have name and email' },
          { status: 400 }
        )
      }
    }

    const fields = Array.isArray(body.fields) && body.fields.length > 0
      ? body.fields
      : DEFAULT_RFQ_FIELDS

    const { data: rfqData, error: rfqError } = await supabase
      .from('rfqs')
      .insert({
        user_id:     userId,
        title:       body.title.trim(),
        description: body.description?.trim() || null,
        form_schema: fields,
        attachments: body.attachments?.length ? body.attachments : null,
      })
      .select('id, title, description')
      .single()

    if (rfqError || !rfqData) {
      console.error('RFQ creation error:', rfqError)
      return NextResponse.json({ error: 'Failed to create RFQ' }, { status: 500 })
    }

    const rfqId = rfqData.id
    const invites: CreateRFQResponse['invites'] = []
    const emailJobs: Array<() => Promise<void>> = []

    for (const supplier of body.suppliers) {
      const email = supplier.email.trim().toLowerCase()
      const name  = supplier.name.trim()

      const { data: supplierData, error: supplierError } = await supabase
        .from('suppliers')
        .upsert(
          { user_id: userId, email, name },
          { onConflict: 'user_id,email' }
        )
        .select('id')
        .single()

      if (supplierError) {
        console.error(`Supplier upsert error for ${email}:`, supplierError.message)
        continue
      }

      const token = randomUUID()

      const { data: inviteData, error: inviteError } = await supabase
        .from('rfq_invites')
        .insert({ rfq_id: rfqId, supplier_id: supplierData?.id, supplier_email: email, token })
        .select('id')
        .single()

      if (inviteError || !inviteData) {
        console.error(`Invite creation error for ${email}:`, inviteError?.message)
        continue
      }

      const inviteId = inviteData.id

      invites.push({
        supplier_email: email,
        link: `${BASE_URL}/form/${rfqId}?token=${token}&invite=${inviteId}`,
      })

      emailJobs.push(() =>
        sendRFQEmail({
          supplierEmail: email,
          supplierName:  name,
          rfqId,
          rfqTitle: rfqData.title,
          token,
          inviteId,
        })
      )
    }

    // Await all invitation emails before responding.
    // sendRFQEmail has 3-attempt exponential-backoff retry internally —
    // individual failures are logged but do NOT block the success response.
    const emailResults = await Promise.allSettled(emailJobs.map(fn => fn()))
    const failedCount = emailResults.filter(
      r => r.status === 'rejected' || (r.status === 'fulfilled' && !r.value.success)
    ).length
    if (failedCount > 0) {
      console.warn(JSON.stringify({
        level: 'warn',
        event: 'rfq_email_batch_partial_failure',
        rfqId,
        total:  emailJobs.length,
        failed: failedCount,
        ts:     new Date().toISOString(),
      }))
    }

    return NextResponse.json({ success: true, rfq_id: rfqId, invites } satisfies CreateRFQResponse, { status: 201 })
  } catch (error: unknown) {
    console.error('POST /api/rfqs error:', error)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
