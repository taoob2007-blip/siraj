import { sendEmail, type SendEmailResult } from './emailService'
import { emailLayout } from './templates'

export async function sendOtpEmail({
  email,
  code,
  contractRef,
}: {
  email:       string
  code:        string
  contractRef: string
}): Promise<SendEmailResult> {
  const html = emailLayout(`
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:28px;">
      <div style="background:#1E3A5F;border-radius:50%;width:44px;height:44px;display:flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0;">🔐</div>
      <div>
        <h2 style="margin:0;color:#fff;font-size:20px;">Contract Signature Verification</h2>
        <p style="margin:4px 0 0;color:#6B7280;font-size:13px;">Contract No. ${contractRef}</p>
      </div>
    </div>

    <p style="color:#D1D5DB;line-height:1.6;margin-bottom:24px;">
      You are about to sign a contract. Enter the verification code below to confirm your identity:
    </p>

    <div style="text-align:center;margin:28px 0;">
      <div style="display:inline-block;background:#1F2937;border:2px solid #3B82F6;border-radius:12px;padding:20px 40px;">
        <p style="margin:0 0 6px;color:#9CA3AF;font-size:11px;text-transform:uppercase;letter-spacing:0.1em;">Verification Code</p>
        <p style="margin:0;font-size:40px;font-weight:900;letter-spacing:0.18em;color:#60A5FA;font-family:monospace;">${code}</p>
      </div>
    </div>

    <div style="background:#1F2937;border-radius:8px;padding:16px;margin-top:20px;space-y:8px;">
      <p style="margin:0;color:#9CA3AF;font-size:13px;">
        ⏱ This code expires in <strong style="color:#fff;">10 minutes</strong>
      </p>
      <p style="margin:10px 0 0;color:#9CA3AF;font-size:13px;">
        🔒 If you did not request this code, you can safely ignore this email.
      </p>
    </div>
  `)

  return sendEmail({
    to:        email,
    subject:   `${code} — Your SIRAJ contract signing code`,
    html,
    emailType: 'otp_verification',
    metadata:  { contractRef },
  })
}
