import { NextRequest, NextResponse } from 'next/server'
import { getServerSupabaseClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = (await req.json()) as { code?: string }
    if (!body.code || !/^\d{6}$/.test(body.code)) {
      return NextResponse.json({ error: 'Invalid code format' }, { status: 400 })
    }

    const supabase = await getServerSupabaseClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: contract } = await supabase
      .from('contracts')
      .select('id, status, verification_code, verification_code_expires_at')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .maybeSingle()

    if (!contract) {
      return NextResponse.json({ error: 'Contract not found' }, { status: 404 })
    }
    if (contract.status === 'signed') {
      return NextResponse.json({ error: 'Contract already signed' }, { status: 400 })
    }
    if (!contract.verification_code) {
      return NextResponse.json({ error: 'No code sent — request a new one' }, { status: 400 })
    }
    if (new Date() > new Date(contract.verification_code_expires_at)) {
      return NextResponse.json({ error: 'Code expired — request a new one' }, { status: 400 })
    }
    if (contract.verification_code !== body.code) {
      return NextResponse.json({ error: 'Incorrect code' }, { status: 400 })
    }

    // Mark verified and clear the code so it cannot be reused
    const { error: updateError } = await supabase
      .from('contracts')
      .update({
        otp_verified:                 true,
        verification_code:            null,
        verification_code_expires_at: null,
      })
      .eq('id', params.id)
      .eq('user_id', user.id)

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 },
    )
  }
}
