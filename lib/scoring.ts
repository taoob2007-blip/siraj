import type { ScoringWeights } from './weights'

export interface ScoredResponse {
  id: string
  price: number | null
  delivery_days: number | null
}

export interface ResponseIndicators {
  lowestPrice: boolean
  fastestDelivery: boolean
  bestValue: boolean
  highPrice: boolean
  slow: boolean
}

export function computeIndicators(
  responses: ScoredResponse[]
): Record<string, ResponseIndicators> {
  if (responses.length === 0) return {}

  const validPrices = responses.map((r) => r.price).filter((p): p is number => p !== null)
  const validDeliveries = responses
    .map((r) => r.delivery_days)
    .filter((d): d is number => d !== null)

  const minPrice = validPrices.length > 0 ? Math.min(...validPrices) : null
  const minDelivery = validDeliveries.length > 0 ? Math.min(...validDeliveries) : null
  const avgPrice =
    validPrices.length > 0 ? validPrices.reduce((a, b) => a + b, 0) / validPrices.length : null
  const avgDelivery =
    validDeliveries.length > 0
      ? validDeliveries.reduce((a, b) => a + b, 0) / validDeliveries.length
      : null

  // Rank 1 = best (lowest value)
  const sortedPrices = [...validPrices].sort((a, b) => a - b)
  const sortedDeliveries = [...validDeliveries].sort((a, b) => a - b)

  const priceRank = (p: number | null) =>
    p !== null ? sortedPrices.indexOf(p) + 1 : responses.length + 1
  const deliveryRank = (d: number | null) =>
    d !== null ? sortedDeliveries.indexOf(d) + 1 : responses.length + 1

  // Lower combined rank = better value
  const valueScores = responses
    .map((r) => ({ id: r.id, score: priceRank(r.price) + deliveryRank(r.delivery_days) }))
    .sort((a, b) => a.score - b.score)

  const bestValueIds = new Set(
    valueScores.slice(0, Math.min(2, responses.length)).map((v) => v.id)
  )

  const result: Record<string, ResponseIndicators> = {}
  for (const r of responses) {
    result[r.id] = {
      lowestPrice: minPrice !== null && r.price === minPrice,
      fastestDelivery: minDelivery !== null && r.delivery_days === minDelivery,
      bestValue: bestValueIds.has(r.id),
      highPrice: avgPrice !== null && r.price !== null && r.price > avgPrice,
      slow: avgDelivery !== null && r.delivery_days !== null && r.delivery_days > avgDelivery,
    }
  }
  return result
}

export function computeWeightedRecommendation(
  responses: ScoredResponse[],
  weights: ScoringWeights
): string | null {
  if (responses.length === 0) return null
  if (responses.length === 1) return responses[0].id

  const validPrices = responses.map((r) => r.price).filter((p): p is number => p !== null)
  const validDeliveries = responses
    .map((r) => r.delivery_days)
    .filter((d): d is number => d !== null)

  const minPrice = validPrices.length > 0 ? Math.min(...validPrices) : 0
  const maxPrice = validPrices.length > 0 ? Math.max(...validPrices) : 1
  const minDelivery = validDeliveries.length > 0 ? Math.min(...validDeliveries) : 0
  const maxDelivery = validDeliveries.length > 0 ? Math.max(...validDeliveries) : 1

  // Normalize price + delivery weights (quality has no direct data, so re-scale these two)
  const wTotal = weights.price + weights.delivery
  const wPrice = weights.price / wTotal
  const wDelivery = weights.delivery / wTotal

  const scored = responses.map((r) => {
    const pNorm =
      maxPrice !== minPrice && r.price !== null ? (r.price - minPrice) / (maxPrice - minPrice) : 0
    const dNorm =
      maxDelivery !== minDelivery && r.delivery_days !== null
        ? (r.delivery_days - minDelivery) / (maxDelivery - minDelivery)
        : 0
    return { id: r.id, score: pNorm * wPrice + dNorm * wDelivery }
  })

  scored.sort((a, b) => a.score - b.score)
  return scored[0].id
}
