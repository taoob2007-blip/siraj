import { sendEmail, type SendEmailResult } from './emailService'
import { emailLayout, rfqBox, priceDeliveryTable } from './templates'

// ── Winner email ───────────────────────────────────────────────────────────────

export interface SendWinnerEmailParams {
  supplierEmail: string
  rfqTitle:      string
  price?:        number | null
  deliveryDays?: number | null
  rfqId?:        string
}

export async function sendWinnerEmail(p: SendWinnerEmailParams): Promise<SendEmailResult> {
  const html = emailLayout(`
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:24px;">
      <div style="background:#065F46;border-radius:50%;width:44px;height:44px;display:flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0;">🏆</div>
      <div>
        <h2 style="margin:0;color:#fff;font-size:20px;">Congratulations — You've Been Selected!</h2>
        <p style="margin:4px 0 0;color:#6B7280;font-size:13px;">Supplier Notification</p>
      </div>
    </div>

    <p style="color:#D1D5DB;line-height:1.6;">
      We are pleased to inform you that your quotation has been reviewed and you have been
      <strong style="color:#34D399;">selected as the preferred supplier</strong> for:
    </p>

    ${rfqBox(p.rfqTitle, '#34D399')}
    ${priceDeliveryTable(p.price, p.deliveryDays)}

    <p style="color:#9CA3AF;line-height:1.6;font-size:14px;">
      Our team will be in touch shortly to finalise the contract details and next steps.
      Please keep this notification for your records.
    </p>

    <div style="margin-top:24px;padding:16px;background:#064E3B;border-radius:8px;border:1px solid #065F46;">
      <p style="margin:0;color:#6EE7B7;font-size:13px;font-weight:bold;">
        ✓ Contract status: Pending signature — you will receive a signing link shortly.
      </p>
    </div>
  `)

  return sendEmail({
    to:        p.supplierEmail,
    subject:   `🏆 You've been selected — ${p.rfqTitle}`,
    html,
    emailType: 'winner_notification',
    metadata:  { rfqId: p.rfqId, supplierEmail: p.supplierEmail },
  })
}

// ── Buyer confirmation ─────────────────────────────────────────────────────────

export interface SendBuyerConfirmationEmailParams {
  buyerEmail:    string
  rfqTitle:      string
  supplierEmail: string
  price?:        number | null
  deliveryDays?: number | null
  rfqId?:        string
}

export async function sendBuyerConfirmationEmail(p: SendBuyerConfirmationEmailParams): Promise<SendEmailResult> {
  const html = emailLayout(`
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:24px;">
      <div style="background:#1E3A5F;border-radius:50%;width:44px;height:44px;display:flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0;">✅</div>
      <div>
        <h2 style="margin:0;color:#fff;font-size:20px;">Offer Accepted Successfully</h2>
        <p style="margin:4px 0 0;color:#6B7280;font-size:13px;">Buyer Confirmation</p>
      </div>
    </div>

    <p style="color:#D1D5DB;line-height:1.6;">
      You have successfully accepted the offer from
      <strong style="color:#60A5FA;">${p.supplierEmail}</strong> for:
    </p>

    ${rfqBox(p.rfqTitle, '#3B82F6')}
    ${priceDeliveryTable(p.price, p.deliveryDays)}

    <p style="color:#9CA3AF;line-height:1.6;font-size:14px;">
      A contract has been created and is awaiting your signature. The selected supplier has also been
      notified. Please log in to SIRAJ to review and sign the contract.
    </p>

    <div style="margin-top:24px;padding:16px;background:#1E3A5F;border-radius:8px;border:1px solid #2563EB;">
      <p style="margin:0;color:#93C5FD;font-size:13px;font-weight:bold;">
        📄 Next step: Sign the contract in your SIRAJ dashboard
      </p>
    </div>
  `)

  return sendEmail({
    to:        p.buyerEmail,
    subject:   `✅ Offer accepted — ${p.rfqTitle}`,
    html,
    emailType: 'buyer_confirmation',
    metadata:  { rfqId: p.rfqId, supplierEmail: p.supplierEmail },
  })
}

// ── Supplier signing-link ──────────────────────────────────────────────────────

export interface SendSupplierSigningLinkEmailParams {
  supplierEmail: string
  rfqTitle:      string
  signingUrl:    string
  price?:        number | null
  deliveryDays?: number | null
  contractId?:   string
}

export async function sendSupplierSigningLinkEmail(p: SendSupplierSigningLinkEmailParams): Promise<SendEmailResult> {
  const html = emailLayout(`
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:24px;">
      <div style="background:#1E3A5F;border-radius:50%;width:44px;height:44px;display:flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0;">✍️</div>
      <div>
        <h2 style="margin:0;color:#fff;font-size:20px;">Contract Ready for Your Signature</h2>
        <p style="margin:4px 0 0;color:#6B7280;font-size:13px;">Supplier Action Required</p>
      </div>
    </div>

    <p style="color:#D1D5DB;line-height:1.6;">
      The buyer has signed the contract for the following request.
      <strong style="color:#fff;">Your signature is now required</strong> to finalise the agreement:
    </p>

    ${rfqBox(p.rfqTitle, '#22D3EE')}
    ${priceDeliveryTable(p.price, p.deliveryDays)}

    <div style="text-align:center;margin:32px 0;">
      <a href="${p.signingUrl}"
         style="display:inline-block;background:#22D3EE;color:#000;text-decoration:none;padding:14px 32px;border-radius:8px;font-size:15px;font-weight:bold;">
        ✍️ Sign the Contract
      </a>
    </div>

    <p style="color:#9CA3AF;line-height:1.6;font-size:13px;text-align:center;">
      Or copy this link into your browser:<br/>
      <span style="color:#67E8F9;word-break:break-all;">${p.signingUrl}</span>
    </p>

    <div style="margin-top:24px;padding:16px;background:#1F2937;border-radius:8px;border:1px solid #374151;">
      <p style="margin:0;color:#9CA3AF;font-size:13px;">
        ⚠️ This link is unique to you. Do not share it with others.
      </p>
    </div>
  `)

  return sendEmail({
    to:        p.supplierEmail,
    subject:   `✍️ Action required — Sign the contract for "${p.rfqTitle}"`,
    html,
    emailType: 'supplier_signing_link',
    metadata:  { contractId: p.contractId, supplierEmail: p.supplierEmail },
  })
}

// ── Loser email ────────────────────────────────────────────────────────────────

export interface SendLoserEmailParams {
  supplierEmail: string
  rfqTitle:      string
  rfqId?:        string
}

export async function sendLoserEmail(p: SendLoserEmailParams): Promise<SendEmailResult> {
  const html = emailLayout(`
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:24px;">
      <div style="background:#1F2937;border-radius:50%;width:44px;height:44px;display:flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0;">📋</div>
      <div>
        <h2 style="margin:0;color:#fff;font-size:20px;">Quotation Update</h2>
        <p style="margin:4px 0 0;color:#6B7280;font-size:13px;">Supplier Notification</p>
      </div>
    </div>

    <p style="color:#D1D5DB;line-height:1.6;">
      Thank you for submitting your quotation. After careful review and comparison of all offers,
      we have selected another supplier for:
    </p>

    ${rfqBox(p.rfqTitle, '#374151')}

    <p style="color:#9CA3AF;line-height:1.6;font-size:14px;">
      We appreciate the time and effort you put into preparing your quotation. We hope to
      collaborate with you on future opportunities and will keep your information on file.
    </p>

    <p style="color:#9CA3AF;line-height:1.6;font-size:14px;">
      Thank you for your interest in partnering with us.
    </p>
  `)

  return sendEmail({
    to:        p.supplierEmail,
    subject:   `Quotation update — ${p.rfqTitle}`,
    html,
    emailType: 'loser_notification',
    metadata:  { rfqId: p.rfqId, supplierEmail: p.supplierEmail },
  })
}
