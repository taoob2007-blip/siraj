import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { logContractEvent } from '@/lib/contracts/audit'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = (await req.json()) as { token?: string; signature?: string }

    if (!body.token || !body.signature) {
      return NextResponse.json({ error: 'token and signature are required' }, { status: 400 })
    }

    // Service-role bypasses RLS — supplier has no auth session
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )

    const { data: contract } = await supabase
      .from('contracts')
      .select('id, status, signing_token, buyer_signature, supplier_signature')
      .eq('id', params.id)
      .maybeSingle()

    if (!contract) {
      return NextResponse.json({ error: 'Contract not found' }, { status: 404 })
    }
    if (contract.signing_token !== body.token) {
      return NextResponse.json({ error: 'Invalid signing link' }, { status: 403 })
    }
    if (contract.status === 'cancelled') {
      return NextResponse.json({ error: 'Contract has been cancelled' }, { status: 400 })
    }
    if (contract.supplier_signature) {
      return NextResponse.json({ error: 'Supplier has already signed this contract' }, { status: 400 })
    }

    const ip        = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
    const userAgent = req.headers.get('user-agent') ?? 'unknown'
    const now       = new Date().toISOString()

    const { data: updated, error: updateError } = await supabase
      .from('contracts')
      .update({
        supplier_signature: body.signature,
        supplier_signed_at: now,
      })
      .eq('id', params.id)
      .select('id, status, buyer_signature, supplier_signature')
      .single()

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    // Fire-and-forget audit — never block the response
    void logContractEvent({
      supabase,
      contractId: params.id,
      event: 'supplier_signed',
      metadata: { ip, user_agent: userAgent },
    })

    if (updated.buyer_signature && updated.supplier_signature) {
      void logContractEvent({
        supabase,
        contractId: params.id,
        event: 'fully_executed',
        metadata: { ip, user_agent: userAgent },
      })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 },
    )
  }
}
