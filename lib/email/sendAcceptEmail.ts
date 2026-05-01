import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

const ENABLE_EMAILS = () => process.env.ENABLE_EMAILS === 'true'

// ── Shared layout wrapper ──────────────────────────────────────────────────────

function layout(body: string): string {
  return `
<div style="font-family:Arial,sans-serif;background:#0B0F1A;padding:40px;color:#fff;">
  <div style="max-width:600px;margin:auto;background:#111827;border-radius:12px;padding:32px;border:1px solid #1F2937;">
    ${body}
    <p style="margin-top:32px;font-size:12px;color:#4B5563;text-align:center;border-top:1px solid #1F2937;padding-top:16px;">
      Sent via <strong style="color:#6B7280;">SIRAJ</strong> – AI Procurement Platform
    </p>
  </div>
</div>`
}

// ── Winner email ───────────────────────────────────────────────────────────────

export interface SendWinnerEmailParams {
  supplierEmail: string
  rfqTitle: string
  price?: number | null
  deliveryDays?: number | null
}

export async function sendWinnerEmail({
  supplierEmail,
  rfqTitle,
  price,
  deliveryDays,
}: SendWinnerEmailParams): Promise<{ success: boolean; error?: string }> {
  if (!ENABLE_EMAILS()) {
    console.log('[EMAIL DISABLED] winner email skipped for', supplierEmail)
    return { success: true }
  }

  const priceRow = price != null
    ? `<tr>
         <td style="padding:8px 0;color:#9CA3AF;font-size:13px;">Agreed Price</td>
         <td style="padding:8px 0;color:#fff;font-weight:bold;text-align:right;">$${Number(price).toLocaleString('en-US')}</td>
       </tr>`
    : ''

  const deliveryRow = deliveryDays != null
    ? `<tr>
         <td style="padding:8px 0;color:#9CA3AF;font-size:13px;">Delivery Timeline</td>
         <td style="padding:8px 0;color:#fff;font-weight:bold;text-align:right;">${deliveryDays} days</td>
       </tr>`
    : ''

  const html = layout(`
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:24px;">
      <div style="background:#065F46;border-radius:50%;width:40px;height:40px;display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0;">🏆</div>
      <div>
        <h2 style="margin:0;color:#fff;font-size:20px;">Congratulations — You've Been Selected!</h2>
        <p style="margin:4px 0 0;color:#6B7280;font-size:13px;">Supplier Notification</p>
      </div>
    </div>

    <p style="color:#D1D5DB;line-height:1.6;">
      We are pleased to inform you that your quotation has been reviewed and you have been
      <strong style="color:#34D399;">selected as the preferred supplier</strong> for the following request:
    </p>

    <div style="margin:24px 0;padding:16px;background:#1F2937;border-radius:8px;border-left:3px solid #34D399;">
      <p style="margin:0;color:#9CA3AF;font-size:12px;text-transform:uppercase;letter-spacing:0.05em;">RFQ</p>
      <p style="margin:6px 0 0;font-size:18px;font-weight:bold;color:#fff;">${rfqTitle}</p>
    </div>

    ${(priceRow || deliveryRow) ? `
    <table style="width:100%;border-collapse:collapse;margin:16px 0;background:#1F2937;border-radius:8px;padding:12px;display:table;">
      <tbody>
        ${priceRow}
        ${deliveryRow}
      </tbody>
    </table>` : ''}

    <p style="color:#9CA3AF;line-height:1.6;font-size:14px;">
      Our team will be in touch shortly to finalize the contract details and next steps.
      Please keep this notification for your records.
    </p>

    <div style="margin-top:24px;padding:16px;background:#064E3B;border-radius:8px;border:1px solid #065F46;">
      <p style="margin:0;color:#6EE7B7;font-size:13px;font-weight:bold;">✓ Contract status: Pending signature</p>
    </div>
  `)

  try {
    const res = await resend.emails.send({
      from:    'SIRAJ <rfq@usesiraj.com>',
      to:      supplierEmail,
      subject: `🏆 You've been selected — ${rfqTitle}`,
      html,
    })
    console.log(`[EMAIL] Winner email sent to ${supplierEmail} | id: ${res.data?.id}`)
    return { success: true }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error(`[EMAIL] Winner email failed for ${supplierEmail}:`, message)
    return { success: false, error: message }
  }
}

// ── Loser email ────────────────────────────────────────────────────────────────

export interface SendLoserEmailParams {
  supplierEmail: string
  rfqTitle: string
}

export async function sendLoserEmail({
  supplierEmail,
  rfqTitle,
}: SendLoserEmailParams): Promise<{ success: boolean; error?: string }> {
  if (!ENABLE_EMAILS()) {
    console.log('[EMAIL DISABLED] loser email skipped for', supplierEmail)
    return { success: true }
  }

  const html = layout(`
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:24px;">
      <div style="background:#1F2937;border-radius:50%;width:40px;height:40px;display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0;">📋</div>
      <div>
        <h2 style="margin:0;color:#fff;font-size:20px;">Quotation Update</h2>
        <p style="margin:4px 0 0;color:#6B7280;font-size:13px;">Supplier Notification</p>
      </div>
    </div>

    <p style="color:#D1D5DB;line-height:1.6;">
      Thank you for submitting your quotation. After careful review and comparison of all offers,
      we have selected another supplier for the following request:
    </p>

    <div style="margin:24px 0;padding:16px;background:#1F2937;border-radius:8px;border-left:3px solid #374151;">
      <p style="margin:0;color:#9CA3AF;font-size:12px;text-transform:uppercase;letter-spacing:0.05em;">RFQ</p>
      <p style="margin:6px 0 0;font-size:18px;font-weight:bold;color:#fff;">${rfqTitle}</p>
    </div>

    <p style="color:#9CA3AF;line-height:1.6;font-size:14px;">
      We appreciate the time and effort you put into preparing your quotation. We hope to
      work with you on future opportunities and will keep your information on file.
    </p>

    <p style="color:#9CA3AF;line-height:1.6;font-size:14px;">
      Thank you for your interest in partnering with us.
    </p>
  `)

  try {
    const res = await resend.emails.send({
      from:    'SIRAJ <rfq@usesiraj.com>',
      to:      supplierEmail,
      subject: `Quotation update — ${rfqTitle}`,
      html,
    })
    console.log(`[EMAIL] Loser email sent to ${supplierEmail} | id: ${res.data?.id}`)
    return { success: true }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error(`[EMAIL] Loser email failed for ${supplierEmail}:`, message)
    return { success: false, error: message }
  }
}
