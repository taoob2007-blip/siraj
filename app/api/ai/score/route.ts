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

interface ScoreRequest {
  rfq_title: string
  rfq_description?: string | null
  suppliers: SupplierInput[]
}

export interface SupplierScore {
  email: string
  score: number
  label: 'Excellent' | 'Good' | 'Fair' | 'Poor'
  explanation: string
}

const SYSTEM_PROMPT = `You are a procurement scoring engine. Score each supplier from 0 to 100.

There are NO fixed scoring weights. You must adapt to the RFQ.

Steps:
1. Read the RFQ title and description to understand what matters most.
2. Identify which fields are most relevant for this specific procurement.
3. Infer importance weights from the RFQ context.
4. Score each supplier holistically across ALL their answers.
5. Penalize missing or vague answers.
6. Reward specific, detailed, competitive answers.

Label rules:
- 80–100 → "Excellent"
- 60–79  → "Good"
- 40–59  → "Fair"
- 0–39   → "Poor"

Return ONLY valid JSON. No markdown, no code fences, no explanation outside the JSON.

Required shape:
{
  "scores": [
    {
      "email": "exact supplier email",
      "score": 0-100,
      "label": "Excellent" | "Good" | "Fair" | "Poor",
      "explanation": "one confident sentence referencing specific answer values"
    }
  ]
}`

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as ScoreRequest

    if (!body.rfq_title || !Array.isArray(body.suppliers) || body.suppliers.length === 0) {
      return NextResponse.json({ error: 'rfq_title and suppliers are required' }, { status: 400 })
    }

    const lines = body.suppliers.map((s) => {
      const price = s.price != null && !isNaN(Number(s.price)) ? Number(s.price) : null
      const delivery = s.delivery_days != null && !isNaN(Number(s.delivery_days)) ? Number(s.delivery_days) : null

      // Merge top-level fields into answers map
      const merged: Record<string, string | number> = {}
      if (price !== null) merged['Price'] = `$${price.toLocaleString('en-US')}`
      else merged['Price'] = 'not provided'
      if (delivery !== null) merged['Delivery'] = `${delivery} days`
      else merged['Delivery'] = 'not provided'
      if (s.experience_years != null) merged['Experience'] = `${s.experience_years} years`
      if (s.portfolio?.length) merged['Portfolio'] = s.portfolio.join(', ')
      if (s.notes) merged['Notes'] = s.notes

      // Overlay all dynamic answers
      if (s.answers) {
        for (const [k, v] of Object.entries(s.answers)) {
          if (v !== '' && v !== null && v !== undefined) {
            const label = k.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
            merged[label] = v
          }
        }
      }

      const parts = [`  • ${s.email}`]
      for (const [label, value] of Object.entries(merged)) {
        parts.push(`    ${label}: ${value}`)
      }
      return parts.join('\n')
    }).join('\n')

    const userMessage = `Score these suppliers for the RFQ: ${body.rfq_title}${body.rfq_description ? `\nDescription: ${body.rfq_description}` : ''}

Suppliers:
${lines}`

    const response = await client.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 1024,
      system: [{ type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } }],
      messages: [{ role: 'user', content: userMessage }],
    })

    const block = response.content.find((b) => b.type === 'text')
    if (!block || block.type !== 'text') throw new Error('No text response from AI')

    const text = block.text.trim()
    // strip any accidental markdown fences
    const clean = text.replace(/```(?:json)?\s*/g, '').replace(/```/g, '').trim()
    const parsed = JSON.parse(clean) as { scores: SupplierScore[] }

    return NextResponse.json(parsed)
  } catch (err) {
    console.error('AI score error:', err)
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 })
  }
}
