import { NextRequest, NextResponse } from 'next/server'
import { getServerSupabaseClient } from '@/lib/supabase/server'

interface RouteParams {
  params: { id: string }
}

export interface AIResultPayload {
  scores: Array<{
    email: string
    score: number
    label: string
    explanation: string
  }>
  best_supplier: string | null
  ranking?: Array<{ email: string; rank: number }>
  reasoning?: string
  tradeoffs?: string
  risks?: string
  negotiation?: string
  scored_at: string
}

export async function GET(_req: NextRequest, { params }: RouteParams) {
  try {
    const supabase = await getServerSupabaseClient()
    const { data, error } = await supabase
      .from('rfqs')
      .select('ai_result')
      .eq('id', params.id)
      .single()

    if (error) return NextResponse.json({ ai_result: null })
    return NextResponse.json({ ai_result: data?.ai_result ?? null })
  } catch {
    return NextResponse.json({ ai_result: null })
  }
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const body = (await req.json()) as AIResultPayload
    const supabase = await getServerSupabaseClient()

    const { error } = await supabase
      .from('rfqs')
      .update({ ai_result: body })
      .eq('id', params.id)

    if (error) {
      // Column may not exist yet — fail silently so UI still works
      console.warn('ai_result persist failed (column may not exist):', error.message)
      return NextResponse.json({ saved: false, reason: error.message })
    }

    return NextResponse.json({ saved: true })
  } catch (err) {
    return NextResponse.json({ saved: false, reason: String(err) })
  }
}
