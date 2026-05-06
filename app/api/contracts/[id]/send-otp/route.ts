import { NextRequest, NextResponse } from 'next/server'
import { getServerSupabaseClient } from '@/lib/supabase/server'
import { sendOtpEmail } from '@/lib/email/sendOtpEmail'

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await getServerSupabaseClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (!user.email) {
      return NextResponse.json({ error: 'No email on account' }, { status: 400 })
    }

    // Verify contract belongs to user and is signable
    const { data: contract } = await supabase
      .from('contracts')
      .select('id, status')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .maybeSingle()

    if (!contract) {
      return NextResponse.json({ error: 'Contract not found' }, { status: 404 })
    }
    if (contract.status === 'signed') {
      return NextResponse.json({ error: 'Contract already signed' }, { status: 400 })
    }
    if (contract.status === 'cancelled') {
      return NextResponse.json({ error: 'Contract is cancelled' }, { status: 400 })
    }

    // Generate 6-digit OTP
    const code    = String(Math.floor(100000 + Math.random() * 900000))
    const expires = new Date(Date.now() + 10 * 60 * 1000).toISOString()

    const { error: updateError } = await supabase
      .from('contracts')
      .update({
        verification_code:            code,
        verification_code_expires_at: expires,
        otp_verified:                 false,
      })
      .eq('id', params.id)
      .eq('user_id', user.id)

    if (updateError) {
      console.error('OTP update error:', updateError)
      return NextResponse.json({ error: 'Failed to generate verification code' }, { status: 500 })
    }

    const contractRef = params.id.split('-')[0].toUpperCase()

    const emailResult = await sendOtpEmail({ email: user.email, code, contractRef })

    if (!emailResult.success) {
      // Clear the OTP we just stored so a stale code can't be used later
      await supabase
        .from('contracts')
        .update({ verification_code: null, verification_code_expires_at: null })
        .eq('id', params.id)
        .eq('user_id', user.id)

      console.error(JSON.stringify({
        level:      'error',
        event:      'otp_email_failed',
        contractId: params.id,
        error:      emailResult.error,
        ts:         new Date().toISOString(),
      }))

      return NextResponse.json(
        { error: 'Failed to send verification code. Please try again in a moment.' },
        { status: 503 },
      )
    }

    // Mask email for the response (e.g. u****@example.com)
    const [local, domain] = user.email.split('@')
    const maskedEmail = `${local[0]}${'*'.repeat(Math.max(local.length - 1, 3))}@${domain}`

    return NextResponse.json({ success: true, sentTo: maskedEmail })
  } catch (err) {
    console.error('POST /api/contracts/[id]/send-otp error:', err)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
