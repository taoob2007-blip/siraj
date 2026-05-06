// Shared HTML building blocks for all transactional emails

export function emailLayout(body: string): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="color-scheme" content="dark">
</head>
<body style="margin:0;padding:0;background:#0B0F1A;font-family:Arial,Helvetica,sans-serif;-webkit-font-smoothing:antialiased;">
  <div style="padding:40px 20px;">
    <div style="max-width:600px;margin:0 auto;background:#111827;border-radius:12px;padding:32px;border:1px solid #1F2937;">
      ${body}
      <div style="margin-top:32px;padding-top:16px;border-top:1px solid #1F2937;text-align:center;">
        <p style="margin:0;font-size:12px;color:#4B5563;">
          Sent via <strong style="color:#6B7280;">SIRAJ</strong> &mdash; AI Procurement Platform
        </p>
      </div>
    </div>
  </div>
</body>
</html>`
}

export function rfqBox(title: string, accentColor = '#34D399'): string {
  return `<div style="margin:24px 0;padding:16px;background:#1F2937;border-radius:8px;border-left:3px solid ${accentColor};">
    <p style="margin:0;color:#9CA3AF;font-size:12px;text-transform:uppercase;letter-spacing:0.05em;">RFQ</p>
    <p style="margin:6px 0 0;font-size:18px;font-weight:bold;color:#fff;">${title}</p>
  </div>`
}

export function priceDeliveryTable(
  price?: number | null,
  deliveryDays?: number | null,
): string {
  const rows: string[] = []
  if (price != null) {
    rows.push(`<tr>
      <td style="padding:8px 0;color:#9CA3AF;font-size:13px;">Agreed Price</td>
      <td style="padding:8px 0;color:#fff;font-weight:bold;text-align:right;">$${Number(price).toLocaleString('en-US')}</td>
    </tr>`)
  }
  if (deliveryDays != null) {
    rows.push(`<tr>
      <td style="padding:8px 0;color:#9CA3AF;font-size:13px;">Delivery Timeline</td>
      <td style="padding:8px 0;color:#fff;font-weight:bold;text-align:right;">${deliveryDays} days</td>
    </tr>`)
  }
  if (!rows.length) return ''
  return `<table style="width:100%;border-collapse:collapse;margin:16px 0;background:#1F2937;border-radius:8px;padding:12px;display:table;">
    <tbody>${rows.join('\n')}</tbody>
  </table>`
}
