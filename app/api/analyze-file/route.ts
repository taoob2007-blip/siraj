import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { getServerSupabaseClient } from '@/lib/supabase/server'
import type {
  FileAnalysisMode,
  FileAnalysisResult,
  RFQAnalysis,
  SupplierAnalysis,
} from '@/lib/types'

// ── Constants ──────────────────────────────────────────────────────────────────

const MAX_BYTES   = 5 * 1024 * 1024
const ALLOWED_MIME = new Set(['application/pdf', 'image/png', 'image/jpeg', 'image/webp'])
const IMAGE_TYPES  = new Set(['image/png', 'image/jpeg', 'image/webp'])

const ai = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// ── Prompts ────────────────────────────────────────────────────────────────────

const RFQ_SYSTEM = `\
You are a senior procurement specialist AI.
Analyze the provided RFQ document carefully.

Return ONLY a single valid JSON object — no markdown fences, no commentary, just the raw JSON:
{
  "requirements":  ["..."],
  "quantities":    ["..."],
  "missing_info":  ["..."],
  "improvements":  ["..."],
  "summary":       "..."
}

requirements  — specific items/services/specs the buyer needs
quantities    — units, volumes, counts, weights mentioned
missing_info  — important details absent from the document (e.g. delivery terms, warranty, specs)
improvements  — concrete suggestions to make the RFQ clearer and more competitive
summary       — one-paragraph executive summary`

const SUPPLIER_SYSTEM = `\
You are a procurement risk AI.
Analyze the supplier quotation/offer document with a critical eye.

Detect:
- Suspicious or fake pricing (too low vs. market, rounding tricks)
- Unrealistic delivery promises
- Counterfeit risk signals
- Missing certifications or compliance references
- Vague or evasive language that hides obligations
- Red flags in payment terms or warranty clauses

Return ONLY a single valid JSON object — no markdown fences, no commentary, just the raw JSON:
{
  "risk_score":        <integer 0-100>,
  "risk_level":        "<low|medium|high>",
  "red_flags":         ["..."],
  "pricing_analysis":  "...",
  "delivery_analysis": "...",
  "recommendation":    "<accept|negotiate|reject>",
  "summary":           "..."
}

risk_score   — 0 = zero risk, 100 = extreme risk
risk_level   — low (0–35), medium (36–65), high (66–100)
red_flags    — specific concerning items found
recommendation — accept (trustworthy, proceed), negotiate (potential, fix terms), reject (unreliable or dangerous)`

// ── Helpers ────────────────────────────────────────────────────────────────────

function extractJSON(raw: string): unknown {
  // Strip any markdown code fences the model might add despite instructions
  const stripped = raw.replace(/```(?:json)?|```/g, '').trim()
  const match = stripped.match(/\{[\s\S]*\}/)
  if (!match) throw new Error('No JSON object found in AI response')
  return JSON.parse(match[0])
}

type ImageMediaType = 'image/png' | 'image/jpeg' | 'image/gif' | 'image/webp'

async function analyzeImage(
  base64: string,
  mediaType: string,
  system: string,
): Promise<string> {
  const response = await ai.messages.create({
    model:      'claude-haiku-4-5',
    max_tokens: 1024,
    system,
    messages: [{
      role: 'user',
      content: [
        {
          type: 'image',
          source: {
            type:        'base64',
            media_type:  mediaType as ImageMediaType,
            data:        base64,
          },
        },
        { type: 'text', text: 'Analyze this document image and return the JSON.' },
      ],
    }],
  })
  const block = response.content[0]
  return block.type === 'text' ? block.text : ''
}

async function analyzePDF(base64: string, system: string): Promise<string> {
  // PDF document blocks require the beta header
  const response = await (ai.beta as unknown as {
    messages: {
      create: (params: Record<string, unknown>) => Promise<{ content: Array<{ type: string; text?: string }> }>
    }
  }).messages.create({
    model:      'claude-haiku-4-5',
    max_tokens: 1024,
    system,
    betas:      ['pdfs-2024-09-25'],
    messages: [{
      role: 'user',
      content: [
        {
          type:   'document',
          source: { type: 'base64', media_type: 'application/pdf', data: base64 },
        },
        { type: 'text', text: 'Analyze this document and return the JSON.' },
      ],
    }],
  })
  const block = response.content[0]
  return block.type === 'text' ? (block.text ?? '') : ''
}

// ── Route ──────────────────────────────────────────────────────────────────────

interface RequestBody {
  fileUrl?:  string
  type?:     string
  fileName?: string
  fileType?: string
}

export async function POST(req: NextRequest) {
  try {
    // ── Auth ────────────────────────────────────────────────────────────────────
    const supabase = await getServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // ── Input validation ────────────────────────────────────────────────────────
    const body = (await req.json()) as RequestBody
    const { fileUrl, type, fileName, fileType } = body

    if (!fileUrl || typeof fileUrl !== 'string') {
      return NextResponse.json({ error: 'fileUrl is required' }, { status: 400 })
    }
    if (type !== 'rfq' && type !== 'supplier') {
      return NextResponse.json({ error: 'type must be "rfq" or "supplier"' }, { status: 400 })
    }
    if (!fileType || !ALLOWED_MIME.has(fileType)) {
      return NextResponse.json({ error: 'Unsupported file type' }, { status: 400 })
    }

    // ── Fetch file ──────────────────────────────────────────────────────────────
    let fileRes: Response
    try {
      fileRes = await fetch(fileUrl, { signal: AbortSignal.timeout(15_000) })
    } catch {
      return NextResponse.json({ error: 'Could not fetch file — URL may have expired' }, { status: 400 })
    }

    if (!fileRes.ok) {
      return NextResponse.json({ error: `File fetch failed: ${fileRes.status}` }, { status: 400 })
    }

    const buffer = await fileRes.arrayBuffer()
    if (buffer.byteLength > MAX_BYTES) {
      return NextResponse.json({ error: 'File exceeds 5 MB limit' }, { status: 400 })
    }

    const base64 = Buffer.from(buffer).toString('base64')
    const system = type === 'rfq' ? RFQ_SYSTEM : SUPPLIER_SYSTEM

    // ── Call AI ─────────────────────────────────────────────────────────────────
    let rawText: string
    try {
      if (IMAGE_TYPES.has(fileType)) {
        rawText = await analyzeImage(base64, fileType, system)
      } else {
        rawText = await analyzePDF(base64, system)
      }
    } catch (aiErr) {
      console.error('[analyze-file] AI call failed:', aiErr)
      return NextResponse.json({ error: 'AI analysis failed' }, { status: 502 })
    }

    // ── Parse structured output ─────────────────────────────────────────────────
    let parsed: unknown
    try {
      parsed = extractJSON(rawText)
    } catch {
      console.error('[analyze-file] JSON parse failed. Raw response:', rawText)
      return NextResponse.json({ error: 'AI returned unstructured output' }, { status: 500 })
    }

    // ── Build result ────────────────────────────────────────────────────────────
    const mode = type as FileAnalysisMode
    const result: FileAnalysisResult = {
      mode,
      rfq:         mode === 'rfq'      ? (parsed as RFQAnalysis)      : undefined,
      supplier:    mode === 'supplier'  ? (parsed as SupplierAnalysis)  : undefined,
      analyzed_at: new Date().toISOString(),
      file_name:   fileName ?? 'unknown',
    }

    return NextResponse.json(result)
  } catch (err) {
    console.error('[analyze-file] unexpected error:', err)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
