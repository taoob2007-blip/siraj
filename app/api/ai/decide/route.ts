import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

interface SupplierInput {
  email: string
  price: number | null
  delivery_days: number | null
  experience_years?: number | null
  portfolio?: string[] | null
  notes?: string | null
  answers?: Record<string, string | number>
}

export interface DecideRequest {
  rfq_title: string
  rfq_description?: string | null
  suppliers: SupplierInput[]
}

export interface SupplierScoreItem {
  email: string
  score: number
  label: 'Excellent' | 'Good' | 'Fair' | 'Poor'
  explanation: string
}

export interface RankingItem {
  email: string
  rank: number
}

export interface DecideResult {
  scores: SupplierScoreItem[]
  best_supplier: string
  ranking: RankingItem[]
  reasoning: string
  tradeoffs: string
  risks: string
  negotiation: string
}

const SYSTEM_PROMPT = `You are a senior procurement decision engine.

Analyze supplier quotations and return ONE complete decision as JSON.

There are NO fixed fields. Adapt to whatever the RFQ asks for.

Steps:
1. Read the RFQ to understand the business goal.
2. Identify which fields matter most for THIS specific RFQ.
3. Infer adaptive weights (do NOT use fixed percentages).
4. Score each supplier 0–100 holistically across ALL their answers.
5. Rank them. Select one winner. Explain commercially, not technically.

Label rules:
- 80–100 → "Excellent"
- 60–79  → "Good"
- 40–59  → "Fair"
- 0–39   → "Poor"

Return ONLY valid JSON — no markdown, no code fences, nothing outside the object.

Required shape (ALL fields mandatory):
{
  "scores": [
    {
      "email": "exact supplier email",
      "score": 0-100,
      "label": "Excellent" | "Good" | "Fair" | "Poor",
      "explanation": "one confident sentence citing specific values from their answers"
    }
  ],
  "best_supplier": "exact email of the winning supplier",
  "ranking": [
    { "email": "...", "rank": 1 },
    { "email": "...", "rank": 2 }
  ],
  "reasoning": "2–3 sentences: why this supplier wins — reference actual numbers from answers",
  "tradeoffs": "1–2 sentences: what we sacrifice vs the alternatives (be specific)",
  "risks": "1–2 sentences: real operational, financial, or reliability risks with this choice",
  "negotiation": "one specific actionable negotiation move — include numbers or percentages when possible"
}

Rules:
- ranking must include ALL suppliers sorted best to worst
- scores must include ALL suppliers
- reasoning must cite real field values (price, delivery days, etc.)
- tradeoffs must name the alternative supplier and what they offered better
- risks must be specific to this supplier's actual answers
- negotiation must name leverage (competitor price, volume, deadline)
- NEVER be vague
- NEVER say "it depends"
- NEVER output anything outside the JSON`

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as DecideRequest

    if (!body.rfq_title || !Array.isArray(body.suppliers) || body.suppliers.length === 0) {
      return NextResponse.json({ error: 'rfq_title and suppliers are required' }, { status: 400 })
    }

    const lines = body.suppliers.map((s) => {
      const price    = s.price != null && !isNaN(Number(s.price)) ? Number(s.price) : null
      const delivery = s.delivery_days != null && !isNaN(Number(s.delivery_days)) ? Number(s.delivery_days) : null

      const merged: Record<string, string | number> = {}
      if (price !== null)    merged['Price']    = `$${price.toLocaleString('en-US')}`
      else                   merged['Price']    = 'not provided'
      if (delivery !== null) merged['Delivery'] = `${delivery} days`
      else                   merged['Delivery'] = 'not provided'
      if (s.experience_years != null) merged['Experience'] = `${s.experience_years} years`
      if (s.portfolio?.length)        merged['Portfolio']  = s.portfolio.join(', ')
      if (s.notes)                    merged['Notes']      = s.notes

      if (s.answers) {
        for (const [k, v] of Object.entries(s.answers)) {
          if (v !== '' && v !== null && v !== undefined) {
            const label = k.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
            merged[label] = v
          }
        }
      }

      const parts = [`• ${s.email}`]
      for (const [label, value] of Object.entries(merged)) {
        parts.push(`  ${label}: ${value}`)
      }
      return parts.join('\n')
    }).join('\n\n')

    const userMessage = `Make a full procurement decision for this RFQ.

RFQ: ${body.rfq_title}${body.rfq_description ? `\nDescription: ${body.rfq_description}` : ''}

Suppliers:
${lines}`

    const response = await client.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 1500,
      system: [{ type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } }],
      messages: [{ role: 'user', content: userMessage }],
    })

    const block = response.content.find((b) => b.type === 'text')
    if (!block || block.type !== 'text') throw new Error('No text response from AI')

    const clean = block.text.trim()
      .replace(/```(?:json)?\s*/g, '')
      .replace(/```/g, '')
      .trim()

    const parsed = JSON.parse(clean) as DecideResult

    // Normalise scores to integers
    parsed.scores = parsed.scores.map((s) => ({
      ...s,
      score: Math.round(Number(s.score) || 0),
    }))

    return NextResponse.json(parsed)
  } catch (err) {
    console.error('AI decide error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 },
    )
  }
}
