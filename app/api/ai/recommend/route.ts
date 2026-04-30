import { NextRequest, NextResponse } from 'next/server'
import { getAIRecommendation } from '@/lib/ai'
import type { AIRecommendationInput } from '@/lib/ai'

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as AIRecommendationInput

    if (!body.title || !Array.isArray(body.suppliers) || body.suppliers.length === 0) {
      return NextResponse.json({ error: 'title and suppliers are required' }, { status: 400 })
    }

    const result = await getAIRecommendation(body)
    return NextResponse.json(result)
  } catch (error) {
    console.error('AI recommendation error:', error)
    return NextResponse.json({ error: 'Failed to generate recommendation' }, { status: 500 })
  }
}
