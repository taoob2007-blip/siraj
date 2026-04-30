import { NextRequest, NextResponse } from 'next/server'

/**
 * PDF Parsing Interface — ready for future integration.
 *
 * Expected integration path:
 *   1. Receive PDF as multipart/form-data or base64 string
 *   2. Extract text via a PDF library (e.g. pdf-parse, pdfjs-dist)
 *   3. Send extracted text to Claude to pull structured fields
 *   4. Return { price, delivery_days, notes, raw_text }
 *
 * Claude prompt template (for step 3):
 *   "Extract from this supplier quotation document:
 *    - total price (number only, no currency symbol)
 *    - delivery time in days (number only)
 *    - any notes or conditions
 *    Return ONLY JSON: { price, delivery_days, notes }"
 */

export interface ParsedQuotation {
  price: number | null
  delivery_days: number | null
  notes: string | null
  raw_text: string
  confidence: 'high' | 'medium' | 'low'
}

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get('content-type') ?? ''

    if (!contentType.includes('multipart/form-data') && !contentType.includes('application/json')) {
      return NextResponse.json(
        { error: 'Send PDF as multipart/form-data (field: "file") or base64 JSON ({ base64: "..." })' },
        { status: 415 },
      )
    }

    // ── Placeholder response ──────────────────────────────────────────────────
    // Replace this block with actual PDF extraction + Claude call when ready.
    return NextResponse.json(
      {
        error: 'PDF parsing not yet implemented. Interface is ready.',
        interface: {
          endpoint: 'POST /api/ai/parse-pdf',
          accepts: [
            'multipart/form-data with field "file" (PDF binary)',
            'application/json with field "base64" (base64-encoded PDF)',
          ],
          returns: {
            price: 'number | null',
            delivery_days: 'number | null',
            notes: 'string | null',
            raw_text: 'string',
            confidence: '"high" | "medium" | "low"',
          },
        },
      },
      { status: 501 },
    )
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 },
    )
  }
}
