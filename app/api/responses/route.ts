import { NextRequest, NextResponse } from 'next/server'
import { getServerSupabaseClient } from '@/lib/supabase/server'
import type { RFQField } from '@/lib/types'
import { parsePrice, parseDelivery } from '@/lib/parseSupplierInput'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { token, answers } = body

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 })
    }

    if (!answers || typeof answers !== 'object') {
      return NextResponse.json({ error: 'Answers are required' }, { status: 400 })
    }

    const supabase = await getServerSupabaseClient()

    // 1. Validate token and find invite
    const { data: inviteData, error: inviteError } = await supabase
      .from('rfq_invites')
      .select('id, rfq_id, supplier_email, responded')
      .eq('token', token)
      .single()

    if (inviteError || !inviteData) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 })
    }

    if (inviteData.responded) {
      return NextResponse.json(
        { error: 'Response already submitted for this invitation' },
        { status: 400 }
      )
    }

    // 2. Fetch RFQ fields schema
    const { data: rfqData } = await supabase
      .from('rfqs')
      .select('form_schema')
      .eq('id', inviteData.rfq_id)
      .single()

    const fields: RFQField[] = rfqData?.form_schema ?? []

    // 3. Validate required fields
    for (const field of fields.filter((f) => f.required)) {
      const value = answers[field.id]
      if (value === undefined || value === null || value === '') {
        return NextResponse.json(
          { error: `${field.label} is required` },
          { status: 400 }
        )
      }
      if (field.type === 'number') {
        const num = parseFloat(value)
        if (isNaN(num) || num < 0) {
          return NextResponse.json(
            { error: `${field.label} must be a valid positive number` },
            { status: 400 }
          )
        }
      }
    }

    // 4. Extract price and delivery_days for dedicated DB columns (used for sorting/querying)
    // Always try answers.price / answers.delivery_days directly as they are standard fields,
    // then fall back to schema-driven lookup if present.
    const priceField = fields.find((f) => f.id === 'price')
    const deliveryField = fields.find((f) => f.id === 'delivery_days')
    const rawPrice = answers['price'] !== undefined ? answers['price'] : (priceField ? answers[priceField.id] : undefined)
    const rawDelivery = answers['delivery_days'] !== undefined ? answers['delivery_days'] : (deliveryField ? answers[deliveryField.id] : undefined)

    const parsedPrice = parsePrice(rawPrice)
    const parsedDelivery = parseDelivery(rawDelivery)

    if (parsedPrice.error) {
      return NextResponse.json({ error: parsedPrice.error }, { status: 400 })
    }
    if (parsedDelivery.error) {
      return NextResponse.json({ error: parsedDelivery.error }, { status: 400 })
    }

    const price = parsedPrice.value
    const delivery_days = parsedDelivery.value

    // 5. Store response
    const { data: responseData, error: responseError } = await supabase
      .from('responses')
      .insert({
        invite_id: inviteData.id,
        rfq_id: inviteData.rfq_id,
        supplier_email: inviteData.supplier_email,
        price,
        delivery_days,
        answers,
      })
      .select('id')
      .single()

    if (responseError || !responseData) {
      console.error('Response creation error:', responseError)
      return NextResponse.json({ error: 'Failed to submit response' }, { status: 500 })
    }

    // 6. Mark invite as responded
    await supabase
      .from('rfq_invites')
      .update({ responded: true, responded_at: new Date().toISOString() })
      .eq('id', inviteData.id)

    return NextResponse.json(
      { success: true, response_id: responseData.id, message: 'Response submitted successfully' },
      { status: 201 }
    )
  } catch (error) {
    console.error('Response submission error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
