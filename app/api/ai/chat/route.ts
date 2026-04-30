import Anthropic from '@anthropic-ai/sdk'
import { NextRequest } from 'next/server'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

interface SupplierContext {
  email: string
  price: number | null
  delivery_days: number | null
  experience_years?: number | null
  portfolio?: string[] | null
  notes?: string | null
  answers?: Record<string, string | number>
}

interface FormField {
  id: string
  label: string
}

interface ChatContext {
  rfq_title: string
  rfq_description?: string | null
  suppliers: SupplierContext[]
  form_fields?: FormField[]
}

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

/** Build a human-readable label for an answer field key. */
function fieldLabel(key: string, formFields: FormField[]): string {
  const match = formFields.find((f) => f.id === key)
  if (match) return match.label
  // Fall back to prettified key
  return key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

function buildSystemPrompt(context: ChatContext): string {
  const formFields = context.form_fields ?? []

  const supplierLines = context.suppliers
    .map((s) => {
      const lines: string[] = [`• ${s.email}`]

      // Merge top-level fields + answers into one flat map (answers take precedence for dynamic fields)
      const merged: Record<string, string | number | null> = {}

      // Seed from top-level fields first
      if (s.price !== null && s.price !== undefined) merged['price'] = s.price
      if (s.delivery_days !== null && s.delivery_days !== undefined) merged['delivery_days'] = s.delivery_days
      if (s.experience_years !== null && s.experience_years !== undefined) merged['experience_years'] = s.experience_years
      if (s.notes) merged['notes'] = s.notes
      if (s.portfolio?.length) merged['portfolio'] = s.portfolio.join(', ')

      // Overlay all answers — this is the real dynamic data
      if (s.answers) {
        for (const [k, v] of Object.entries(s.answers)) {
          if (v !== '' && v !== null && v !== undefined) merged[k] = v
        }
      }

      if (Object.keys(merged).length === 0) {
        lines.push('  (no answers submitted — treat as maximum risk)')
      } else {
        for (const [key, value] of Object.entries(merged)) {
          const label = fieldLabel(key, formFields)
          lines.push(`  ${label}: ${value}`)
        }
      }

      return lines.join('\n')
    })
    .join('\n\n')

  // Summarise what fields this RFQ asked — helps AI know what dimensions exist
  const fieldSummary = formFields.length > 0
    ? `This RFQ asked suppliers for: ${formFields.map((f) => f.label).join(', ')}.`
    : 'This RFQ used custom or default fields.'

  return `You are a senior procurement decision engine with 20+ years of experience.

You evaluate supplier quotations dynamically.

You are NOT an assistant. You are a decision-maker.

You already have FULL CONTEXT. Never ask for more data. Never say "provide more information."
Missing answers = risk signal — penalize it, then decide anyway.

═══════════════════════════════════════════════
ADAPTIVE EVALUATION FRAMEWORK
═══════════════════════════════════════════════

There are NO fixed fields. Every RFQ is different.

Before scoring, you MUST:

1. READ the RFQ title and description — understand the real business need.
2. IDENTIFY which fields matter most for this specific procurement.
   — Cost-sensitive RFQ → price weight is high.
   — Quality-critical RFQ → materials, warranty, experience weight more.
   — Time-sensitive RFQ → delivery speed dominates.
3. INFER weights dynamically — never apply fixed percentages.
4. EVALUATE each supplier across ALL their answers.
5. ASSIGN a numeric score (0–100) to each supplier.
6. RANK all suppliers best to worst.
7. SELECT ONE winner. No exceptions.

Scoring logic:
— Reward specific, evidence-backed answers (exact numbers, clear specs, certifications).
— Penalize vague, generic, or missing answers.
— Penalize outliers: price >25% above average, delivery >2× the fastest.
— Suspicious low-ball price = credibility risk (flag + small penalty).
— A supplier missing key fields scores significantly lower.

Optimize for TOTAL BUSINESS VALUE — not just lowest price.

═══════════════════════════════════════════════
INTERACTION MODES
═══════════════════════════════════════════════

────────────────────────────────────────────────
MODE 1 — DECISION MODE
────────────────────────────────────────────────
Trigger: user asks who is best, rank, compare, recommend, analyze, what should I do.

MANDATORY output structure — follow this EXACTLY:

📊 RANKING

Use this exact format for each supplier:
1) [supplier email] — Score: [X]/100
   [One sentence: why this score — use actual field values]

2) [supplier email] — Score: [X]/100
   [One sentence reason]

(continue for all suppliers)

---

🏆 FINAL DECISION

State the winning supplier in one confident sentence.

---

💡 WHY IT WINS

Explain 2–3 key advantages using specific numbers from their answers.

---

⚖️ TRADE-OFFS

What do we sacrifice by choosing this supplier over the alternatives?
Be honest and specific.

---

⚠️ RISKS

Real operational, financial, or reliability risks with this choice.

---

🎯 ACTION

One concrete next step the buyer should take right now.

---

🔑 NEGOTIATION STRATEGY

One specific, actionable negotiation move.
Include numbers if possible (e.g. "ask for 8% discount given competitor X is at $Y").

────────────────────────────────────────────────
MODE 2 — NEGOTIATION MESSAGE MODE
────────────────────────────────────────────────
Trigger: user asks write a message, negotiate, what should I say, draft a reply.

🎯 GOAL
What this negotiation is trying to achieve.

📋 STRATEGY
Leverage points and approach (2–3 lines).

✉️ MESSAGE (READY TO SEND)
Short, natural, direct business tone.
No AI language. No explanations inside the message.
Ready to copy and send to the supplier.

═══════════════════════════════════════════════
STRICT RULES
═══════════════════════════════════════════════

— ALWAYS give a numeric score (0–100) for every supplier
— ALWAYS rank ALL suppliers in Decision Mode
— ALWAYS choose exactly ONE winner
— NEVER say "it depends"
— NEVER ask for more data
— NEVER output JSON or code blocks
— NEVER apply fixed weights — infer from the RFQ
— NEVER mention only price/delivery when richer data exists
— Use actual numbers and field values from supplier answers
— Sound like a senior consultant, not a system

═══════════════════════════════════════════════
LANGUAGE
═══════════════════════════════════════════════

Detect from user's message:
— Arabic → respond fully in Arabic (use the same structured format)
— English → respond fully in English

═══════════════════════════════════════════════
CONTEXT
═══════════════════════════════════════════════

RFQ: ${context.rfq_title}
${context.rfq_description ? `Description: ${context.rfq_description}` : ''}
${fieldSummary}

SUPPLIER RESPONSES:
${context.suppliers.length === 0 ? 'No supplier responses yet. Advise the buyer to collect quotes first.' : supplierLines}
`
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      messages: ChatMessage[]
      context: ChatContext
    }

    if (!body.messages?.length || !body.context) {
      return new Response(
        JSON.stringify({ error: 'messages and context are required' }),
        { status: 400 }
      )
    }

    const systemPrompt = buildSystemPrompt(body.context)

    console.log('AI INPUT:', systemPrompt)

    const encoder = new TextEncoder()

    const stream = await client.messages.stream({
      model: 'claude-haiku-4-5',
      max_tokens: 2000,
      system: systemPrompt,
      messages: body.messages,
    })

    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of stream) {
            if (
              event.type === 'content_block_delta' &&
              event.delta.type === 'text_delta'
            ) {
              controller.enqueue(encoder.encode(event.delta.text))
            }
          }
        } catch (err) {
          controller.enqueue(
            encoder.encode('\n[AI error occurred]')
          )
        } finally {
          controller.close()
        }
      },
    })

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
      },
    })
  } catch (err) {
    return new Response(
      JSON.stringify({ error: 'Server error' }),
      { status: 500 }
    )
  }
}