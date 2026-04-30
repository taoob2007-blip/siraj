export interface AIRankedSupplier {
  email: string
  rank: number
}

export interface AIDecision {
  best_supplier: string
  decision: string
  ranking: AIRankedSupplier[]
  insights: string[]
  warnings: string[]
  tradeoffs?: string[]
}

/**
 * Try to extract an AIDecision from an arbitrary string.
 * Handles raw JSON or JSON embedded inside markdown code fences.
 */
export function parseAIDecision(text: string): AIDecision | null {
  // Strip markdown fences if present
  const stripped = text.replace(/```(?:json)?\s*/g, '').replace(/```/g, '').trim()

  // Try the whole string first, then try to extract the outermost {...} block
  const candidates = [stripped]
  const match = stripped.match(/\{[\s\S]*\}/)
  if (match) candidates.push(match[0])

  for (const candidate of candidates) {
    try {
      const parsed = JSON.parse(candidate)
      if (
        typeof parsed.best_supplier === 'string' &&
        typeof parsed.decision === 'string' &&
        Array.isArray(parsed.ranking) &&
        Array.isArray(parsed.insights) &&
        Array.isArray(parsed.warnings)
      ) {
        return parsed as AIDecision
      }
    } catch {
      // not valid JSON — try next candidate
    }
  }
  return null
}

export const DECISION_TRIGGERS = [
  'best supplier', 'who is best', 'who should i choose', 'compare', 'rank',
  'recommendation', 'recommend', 'which supplier', 'analyze', 'analyse',
  'decision', 'who wins', 'top supplier',
]

export function isDecisionQuery(text: string): boolean {
  const lower = text.toLowerCase()
  return DECISION_TRIGGERS.some((t) => lower.includes(t))
}
