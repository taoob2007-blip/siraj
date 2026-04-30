import Anthropic from '@anthropic-ai/sdk'
import { NextRequest } from 'next/server'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

interface SupplierOffer {
  email: string
  price: number | null
  delivery_days: number | null
  notes?: string | null
}

interface NegotiateRequest {
  rfq_title: string
  rfq_description?: string | null
  target: SupplierOffer
  competitors: SupplierOffer[]
}

function buildPrompt(body: NegotiateRequest): string {
  const { rfq_title, rfq_description, target, competitors } = body

  const competitorLines = competitors
    .filter((c) => c.price !== null || c.delivery_days !== null)
    .map((c) => `  • ${c.email}: $${c.price ?? 'N/A'}, ${c.delivery_days ?? 'N/A'} days`)
    .join('\n')

  const cheaperComp = competitors.find(
    (c) => c.price !== null && target.price !== null && c.price < target.price,
  )
  const fasterComp = competitors.find(
    (c) => c.delivery_days !== null && target.delivery_days !== null && c.delivery_days < target.delivery_days,
  )

  const priceDiffPct = cheaperComp && target.price && cheaperComp.price !== null
    ? Math.round(((target.price - cheaperComp.price) / target.price) * 100)
    : null

  return `You are a procurement negotiation assistant.

All required data is provided below. Do NOT ask for more information.

---

RFQ: ${rfq_title}${rfq_description ? `\nDescription: ${rfq_description}` : ''}

Target supplier: ${target.email}
- Price: ${target.price !== null ? `$${target.price.toLocaleString('en-US')}` : 'not provided'}
- Delivery: ${target.delivery_days !== null ? `${target.delivery_days} days` : 'not provided'}${target.notes ? `\n- Notes: ${target.notes}` : ''}

${competitors.length > 0 ? `Competing offers:\n${competitorLines}` : 'No competing offers available.'}

${cheaperComp && priceDiffPct && priceDiffPct > 5 ? `Competitor advantage: ${cheaperComp.email} is ${priceDiffPct}% cheaper ($${cheaperComp.price?.toLocaleString('en-US')}).` : ''}
${fasterComp && target.delivery_days && fasterComp.delivery_days !== null && (target.delivery_days - fasterComp.delivery_days) > 3 ? `Competitor advantage: ${fasterComp.email} delivers ${target.delivery_days - fasterComp.delivery_days} days faster.` : ''}

---

TASK: Write a negotiation message to this supplier.

RULES:
- Confident and professional
- Push for better price OR faster delivery — whichever has a clear competitor advantage
- Mention competitor advantage only when the gap is significant (already flagged above)
- 2–3 sentences maximum
- No greeting, no sign-off, no subject line — message body only
- No explanation, no reasoning — just the message

LANGUAGE:
- Detect the language from the RFQ title and description
- If Arabic → reply in professional Saudi-style Arabic
- If English → reply in business English
- Never mix languages

OUTPUT EXAMPLE (Arabic):
"نقدّر عرضكم، لكن السعر أعلى من المنافسين بنسبة X%، هل يمكن تحسين السعر أو تقليل مدة التسليم لنتمكن من المتابعة؟"

OUTPUT EXAMPLE (English):
"We appreciate your offer, however a competing supplier has proposed a lower price. Could you revise your pricing or delivery timeline to remain competitive?"

Return ONLY the message. Nothing else.`
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as NegotiateRequest

    if (!body.rfq_title || !body.target?.email) {
      return new Response(JSON.stringify({ error: 'rfq_title and target are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const prompt = buildPrompt(body)
    const encoder = new TextEncoder()

    const readable = new ReadableStream({
      async start(controller) {
        try {
          const stream = client.messages.stream({
            model: 'claude-haiku-4-5',
            max_tokens: 256,
            messages: [{ role: 'user', content: prompt }],
          })

          for await (const event of stream) {
            if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
              controller.enqueue(encoder.encode(event.delta.text))
            }
          }
        } catch (err) {
          const msg = err instanceof Error ? err.message : 'Stream error'
          controller.enqueue(encoder.encode(`[Error: ${msg}]`))
        } finally {
          controller.close()
        }
      },
    })

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
      },
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
