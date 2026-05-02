import { NextRequest, NextResponse } from 'next/server'
import { getServerSupabaseClient } from '@/lib/supabase/server'
import { logContractEvent } from '@/lib/contracts/audit'

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

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

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

    return NextResponse.json(data)
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 },
    )
  }
}
