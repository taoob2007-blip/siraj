import { Resend } from 'resend'
import { BASE_URL } from '@/lib/constants'

const resend = new Resend(process.env.RESEND_API_KEY)

export interface SendRFQEmailParams {
  supplierEmail: string
  supplierName?: string
  rfqId: string
  rfqTitle: string
  token: string
  inviteId: string
}

export async function sendRFQEmail({
  supplierEmail,
  supplierName,
  rfqId,
  rfqTitle,
  token,
  inviteId,
}: SendRFQEmailParams): Promise<{ success: boolean; error?: string }> {
  const formUrl = `${BASE_URL}/form/${rfqId}?token=${token}&invite=${inviteId}`
  const greeting = supplierName ? `Hello ${supplierName},` : 'Hello,'

  const ENABLE_EMAILS = process.env.ENABLE_EMAILS === 'true'

  if (!ENABLE_EMAILS) {
    console.log('[EMAIL DISABLED]', { to: supplierEmail, rfqId })
    return { success: true }
  }

  const html = `
<div style="font-family:Arial,sans-serif;background:#0B0F1A;padding:40px;color:#fff;">
  <div style="max-width:600px;margin:auto;background:#111827;border-radius:12px;padding:32px;">

    <h2 style="margin-bottom:8px;color:#fff;">📩 New Request for Quotation</h2>
    <p style="color:#9CA3AF;margin-top:0;">${greeting}</p>
    <p style="color:#D1D5DB;">You have been invited to submit a quotation.</p>

    <div style="margin:24px 0;padding:16px;background:#1F2937;border-radius:8px;">
      <p style="margin:0;color:#9CA3AF;font-size:13px;">RFQ Title</p>
      <p style="margin:6px 0 0;font-size:18px;font-weight:bold;color:#fff;">${rfqTitle}</p>
    </div>

    <div style="text-align:center;margin-top:32px;">
      <a href="${formUrl}"
         style="background:#3B82F6;color:white;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:15px;display:inline-block;">
        Submit Quotation
      </a>
    </div>

    <p style="margin-top:28px;font-size:12px;color:#6B7280;text-align:center;">
      This link is unique to you. Do not share it with others.<br/>
      Sent via <strong>SIRAJ</strong> – AI Procurement Platform
    </p>

  </div>
</div>
`

  try {
    const res = await resend.emails.send({
      from: 'RFQ <rfq@usesiraj.com>',
      to: supplierEmail,
      subject: 'New Request for Quotation',
      html,
    })

    console.log(`[EMAIL] Sent successfully to ${supplierEmail} | RFQ: ${rfqId} | id: ${res.data?.id}`)
    return { success: true }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error(`[EMAIL] Failed to send to ${supplierEmail} | RFQ: ${rfqId} | reason: ${message}`)
    return { success: false, error: message }
  }
}
