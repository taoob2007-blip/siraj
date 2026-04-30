import { NextRequest, NextResponse } from 'next/server'
import { getServerSupabaseClient } from '@/lib/supabase/server'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const SYSTEM_PROMPT = `You are a procurement decision engine. Analyze a group of suppliers and return a concise decision recommendation.

Return ONLY valid JSON. No markdown, no code fences.

Required shape:
{
  "best_supplier": "supplier email or null if no data",
  "why": "one short confident sentence explaining why this supplier is best",
  "risks": ["short risk phrase", "another risk if any"],
  "action": "accept" | "negotiate" | "wait",
  "action_reason": "one sentence explaining the suggested action"
}

Action rules:
- "accept": clear winner, strong value, low risk
- "negotiate": good candidate but price or delivery has room to improve
- "wait": not enough data, poor quality responses, or no clear winner`

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await getServerSupabaseClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: category } = await supabase
      .from('categories')
      .select('id, name, category_suppliers(supplier_email, supplier_name)')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single()

    if (!category) return NextResponse.json({ error: 'Category not found' }, { status: 404 })

    const emails = (category.category_suppliers as { supplier_email: string; supplier_name: string | null }[])
      .map((s) => s.supplier_email)

    if (emails.length === 0) {
      return NextResponse.json({
        best_supplier: null,
        why: 'No suppliers in this category yet.',
        risks: ['Add suppliers to enable AI analysis'],
        action: 'wait',
        action_reason: 'Category is empty.',
      })
    }

    const { data: responses } = await supabase
      .from('responses')
      .select('supplier_email, price, delivery_days, notes, experience_years, portfolio, rfq_id')
      .in('supplier_email', emails)
      .order('created_at', { ascending: false })

    if (!responses || responses.length === 0) {
      return NextResponse.json({
        best_supplier: null,
        why: 'None of these suppliers have submitted RFQ responses yet.',
        risks: ['No response data available for comparison'],
        action: 'wait',
        action_reason: 'Send an RFQ to this group to collect comparable data.',
      })
    }

    // Keep most recent response per supplier
    const seen   = new Set<string>()
    const latest = responses.filter((r) => {
      if (seen.has(r.supplier_email as string)) return false
      seen.add(r.supplier_email as string)
      return true
    })

    const supplierLines = latest.map((r) => {
      const parts = [`• ${r.supplier_email}`]
      if (r.price != null)            parts.push(`  Price: $${Number(r.price).toLocaleString('en-US')}`)
      if (r.delivery_days != null)    parts.push(`  Delivery: ${r.delivery_days} days`)
      if (r.experience_years != null) parts.push(`  Experience: ${r.experience_years} years`)
      if (Array.isArray(r.portfolio) && r.portfolio.length) parts.push(`  Portfolio: ${(r.portfolio as string[]).join(', ')}`)
      if (r.notes)                    parts.push(`  Notes: ${r.notes}`)
      return parts.join('\n')
    }).join('\n\n')

    const userMessage = `Category: ${category.name}
Supplier responses to compare:

${supplierLines}

Identify the best supplier and provide a procurement recommendation.`

    const aiResponse = await client.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 512,
      system: [{ type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } }],
      messages: [{ role: 'user', content: userMessage }],
    })

    const block = aiResponse.content.find((b) => b.type === 'text')
    if (!block || block.type !== 'text') throw new Error('No AI response')

    const clean  = block.text.trim().replace(/```(?:json)?\s*/g, '').replace(/```/g, '').trim()
    const parsed = JSON.parse(clean)

    return NextResponse.json(parsed)
  } catch (err) {
    console.error('Category analyze error:', err)
    return NextResponse.json({ error: 'Analysis failed' }, { status: 500 })
  }
}
