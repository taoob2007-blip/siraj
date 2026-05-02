import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

const ENABLE_EMAILS = () => process.env.ENABLE_EMAILS === 'true'

function layout(body: string): string {
  return `
<div style="font-family:Arial,sans-serif;background:#0B0F1A;padding:40px;color:#fff;">
  <div style="max-width:520px;margin:auto;background:#111827;border-radius:12px;padding:32px;border:1px solid #1F2937;">
    ${body}
    <p style="margin-top:32px;font-size:12px;color:#4B5563;text-align:center;border-top:1px solid #1F2937;padding-top:16px;">
      Sent via <strong style="color:#6B7280;">SIRAJ</strong> – AI Procurement Platform
    </p>
  </div>
</div>`
}

export async function sendOtpEmail({
  email,
  code,
  contractRef,
}: {
  email: string
  code: string
  contractRef: string
}): Promise<{ success: boolean; error?: string }> {
  if (!ENABLE_EMAILS()) {
    console.log(`[OTP EMAIL DISABLED] code ${code} for ${email}`)
    return { success: true }
  }

  const html = layout(`
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:28px;">
      <div style="background:#1E3A5F;border-radius:50%;width:44px;height:44px;display:flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0;">🔐</div>
      <div>
        <h2 style="margin:0;color:#fff;font-size:20px;">Contract Signature Verification</h2>
        <p style="margin:4px 0 0;color:#6B7280;font-size:13px;">Contract No. ${contractRef}</p>
      </div>
    </div>

    <p style="color:#D1D5DB;line-height:1.6;margin-bottom:24px;">
      You are about to sign a contract. Enter the code below to verify your identity:
    </p>

    <div style="text-align:center;margin:28px 0;">
      <div style="display:inline-block;background:#1F2937;border:2px solid #3B82F6;border-radius:12px;padding:20px 40px;">
        <p style="margin:0 0 4px;color:#9CA3AF;font-size:11px;text-transform:uppercase;letter-spacing:0.1em;">Verification Code</p>
        <p style="margin:0;font-size:36px;font-weight:900;letter-spacing:0.15em;color:#60A5FA;font-family:monospace;">${code}</p>
      </div>
    </div>

    <div style="background:#1F2937;border-radius:8px;padding:16px;margin-top:20px;">
      <p style="margin:0;color:#9CA3AF;font-size:13px;">⏱ This code expires in <strong style="color:#fff;">10 minutes</strong></p>
      <p style="margin:8px 0 0;color:#9CA3AF;font-size:13px;">🔒 If you did not request this, ignore this email — your account is safe.</p>
    </div>
  `)

  try {
    const res = await resend.emails.send({
      from:    'SIRAJ <rfq@usesiraj.com>',
      to:      email,
      subject: `${code} — Your contract signing code`,
      html,
    })
    console.log(`[OTP] Email sent to ${email} | id: ${res.data?.id}`)
    return { success: true }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error(`[OTP] Email failed for ${email}:`, message)
    return { success: false, error: message }
  }
}
