import { NextRequest, NextResponse } from 'next/server'
import { getServerSupabaseClient, getServiceSupabaseClient } from '@/lib/supabase/server'
import { logContractEvent } from '@/lib/contracts/audit'
import { sendSupplierSigningLinkEmail } from '@/lib/email/sendAcceptEmail'
import { BASE_URL } from '@/lib/constants'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = (await req.json()) as { status?: string; signature?: string }
    const allowed = ['pending', 'signed', 'cancelled']
    if (!body.status || !allowed.includes(body.status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    if (body.status === 'signed' && !body.signature) {
      return NextResponse.json({ error: 'Signature is required to sign a contract' }, { status: 400 })
    }

    const supabase = await getServerSupabaseClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: existing } = await supabase
      .from('contracts')
      .select('id, status, otp_verified')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .maybeSingle()

    if (!existing) {
      return NextResponse.json({ error: 'Contract not found' }, { status: 404 })
    }
    if (existing.status === 'signed' && body.status === 'signed') {
      return NextResponse.json({ error: 'Contract already signed' }, { status: 400 })
    }

    // Signing requires OTP to have been verified in this session
    if (body.status === 'signed' && !existing.otp_verified) {
      return NextResponse.json({ error: 'Identity verification required before signing' }, { status: 403 })
    }

    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
            ?? req.headers.get('x-real-ip')
            ?? 'unknown'
    const userAgent = req.headers.get('user-agent') ?? 'unknown'

    const updatePayload: Record<string, string | boolean | null> = { status: body.status }

    if (body.status === 'signed' && body.signature) {
      updatePayload.buyer_signature    = body.signature
      updatePayload.signed_at          = new Date().toISOString()
      updatePayload.signer_ip          = ip
      updatePayload.signer_user_agent  = userAgent
      updatePayload.signature_method   = 'OTP_VERIFIED'
      // Clear OTP verification flag — one-time use
      updatePayload.otp_verified       = false
    }

    const { data, error } = await supabase
      .from('contracts')
      .update(updatePayload)
      .eq('id', params.id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      console.error('Contract update error:', error)
      return NextResponse.json({ error: 'Failed to update contract' }, { status: 500 })
    }

    // Audit log — fire-and-forget
    const auditEvent = body.status === 'signed' ? 'buyer_signed'
      : body.status === 'cancelled' ? 'cancelled'
      : `status_changed_to_${body.status}`

    void logContractEvent({
      supabase,
      contractId: params.id,
      event: auditEvent,
      userId: user.id,
      metadata: { ip, user_agent: userAgent },
    })

    // After buyer signs: send supplier the contract signing link
    if (body.status === 'signed') {
      const serviceClient = getServiceSupabaseClient()
      const { data: contractDetails } = await serviceClient
        .from('contracts')
        .select('supplier_email, signing_token, price, delivery_days, rfq_id')
        .eq('id', params.id)
        .maybeSingle()

      if (contractDetails) {
        const { data: rfqDetails } = await serviceClient
          .from('rfqs')
          .select('title')
          .eq('id', contractDetails.rfq_id)
          .maybeSingle()

        const signingUrl = `${BASE_URL}/contracts/sign/${contractDetails.signing_token}`

        void sendSupplierSigningLinkEmail({
          supplierEmail: contractDetails.supplier_email,
          rfqTitle:      rfqDetails?.title ?? 'Request for Quotation',
          signingUrl,
          price:         contractDetails.price,
          deliveryDays:  contractDetails.delivery_days,
        })
      }
    }

    return NextResponse.json(data)
  } catch (err) {
    console.error('PATCH /api/contracts/[id] error:', err)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
