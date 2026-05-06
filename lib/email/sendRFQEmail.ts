import { sendEmail, type SendEmailResult } from './emailService'
import { emailLayout, rfqBox } from './templates'
import { BASE_URL } from '@/lib/constants'

export interface SendRFQEmailParams {
  supplierEmail: string
  supplierName?: string
  rfqId:         string
  rfqTitle:      string
  token:         string
  inviteId:      string
}

export async function sendRFQEmail(params: SendRFQEmailParams): Promise<SendEmailResult> {
  const { supplierEmail, supplierName, rfqId, rfqTitle, token, inviteId } = params

  const formUrl  = `${BASE_URL}/form/${rfqId}?token=${token}&invite=${inviteId}`
  const greeting = supplierName ? `Hello ${supplierName},` : 'Hello,'

  const html = emailLayout(`
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:24px;">
      <div style="background:#1E3A5F;border-radius:50%;width:44px;height:44px;display:flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0;">📩</div>
      <div>
        <h2 style="margin:0;color:#fff;font-size:20px;">New Request for Quotation</h2>
        <p style="margin:4px 0 0;color:#6B7280;font-size:13px;">Supplier Invitation</p>
      </div>
    </div>

    <p style="color:#D1D5DB;line-height:1.6;">${greeting}</p>
    <p style="color:#D1D5DB;line-height:1.6;margin-top:0;">
      You have been invited to submit a quotation for the following request:
    </p>

    ${rfqBox(rfqTitle, '#3B82F6')}

    <div style="text-align:center;margin:32px 0;">
      <a href="${formUrl}"
         style="display:inline-block;background:#3B82F6;color:#fff;text-decoration:none;padding:14px 32px;border-radius:8px;font-size:15px;font-weight:bold;">
        Submit Your Quotation
      </a>
    </div>

    <p style="color:#6B7280;font-size:13px;text-align:center;line-height:1.6;">
      Or copy this link into your browser:<br/>
      <span style="color:#60A5FA;word-break:break-all;">${formUrl}</span>
    </p>

    <div style="margin-top:24px;padding:14px;background:#1F2937;border-radius:8px;">
      <p style="margin:0;color:#9CA3AF;font-size:13px;">
        🔒 This link is unique to you. Do not share it with others.
      </p>
    </div>
  `)

  return sendEmail({
    to:        supplierEmail,
    subject:   `📩 New Request for Quotation — ${rfqTitle}`,
    html,
    emailType: 'rfq_invitation',
    metadata:  { rfqId, supplierEmail },
  })
}
