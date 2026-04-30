import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export interface SupplierInput {
  email: string
  price: number
  delivery_days: number
}

export interface AIRecommendationInput {
  title: string
  description?: string
  suppliers: SupplierInput[]
}

export interface AIRankedSupplier {
  email: string
  rank: number
}

export interface AIRecommendationResult {
  best_supplier: string
  decision: string
  ranking: AIRankedSupplier[]
  insights: string[]
  warnings: string[]
  tradeoffs: string[]
}

const SYSTEM_PROMPT = `You are a strict procurement decision engine — NOT a chatbot.

You receive RFQ data and supplier quotations. You return ONE final procurement decision.

Return ONLY valid JSON. No markdown. No code fences. No explanations outside the JSON.

Required JSON shape (ALL fields mandatory):
{
  "best_supplier": "exact supplier email",
  "decision": "short confident sentence (max 15 words)",
  "ranking": [
    { "email": "...", "rank": 1 },
    { "email": "...", "rank": 2 }
  ],
  "insights": [
    "practical insight about price/delivery/balance (one sentence each)"
  ],
  "warnings": [
    "risk or concern if any — empty array if none"
  ],
  "tradeoffs": [
    "what you gain and what you sacrifice by choosing the winner (one sentence each)"
  ]
}

Decision logic:
- Balance price vs delivery time (weight: 60% price, 40% delivery)
- Penalize extremely high price (>30% above average)
- Penalize very slow delivery (>2x the fastest)
- Detect unrealistic offers (price too low to be credible)
- Always pick ONE winner — never say "it depends"

Rules:
- "best_supplier" = exact email of winner
- "decision" = max 15 words, confident tone, no hedging
- "ranking" = ALL suppliers, sorted best to worst
- "insights" = 2–4 short practical bullets
- "warnings" = real risks only; empty array if none
- NEVER be vague
- NEVER output anything outside the JSON object`

export async function getAIRecommendation(
  input: AIRecommendationInput
): Promise<AIRecommendationResult> {
  const supplierList = input.suppliers
    .map((s) => `  • ${s.email}: Price $${s.price}, Delivery ${s.delivery_days} days`)
    .join('\n')

  const userMessage = `Analyze these supplier quotations and return your JSON decision.

RFQ: ${input.title}${input.description ? `\nDescription: ${input.description}` : ''}

Suppliers:
${supplierList}`

  const response = await client.messages.create({
    model: 'claude-haiku-4-5',
    max_tokens: 1024,
    system: [
      {
        type: 'text',
        text: SYSTEM_PROMPT,
        cache_control: { type: 'ephemeral' },
      },
    ],
    messages: [{ role: 'user', content: userMessage }],
  })

  const block = response.content.find((b) => b.type === 'text')
  if (!block || block.type !== 'text') throw new Error('No text response from AI')

  const text = block.text.trim()
  const parsed = JSON.parse(text) as AIRecommendationResult
  return parsed
}
