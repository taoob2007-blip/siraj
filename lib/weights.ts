import type { ProjectType } from './projectType'

export interface ScoringWeights {
  price: number
  delivery: number
  quality: number
}

export function getWeights(type: ProjectType): ScoringWeights {
  switch (type) {
    case 'construction':
      return { price: 0.4, delivery: 0.3, quality: 0.3 }
    case 'medical':
      return { price: 0.2, delivery: 0.3, quality: 0.5 }
    case 'tech':
      return { price: 0.3, delivery: 0.4, quality: 0.3 }
    default:
      return { price: 0.5, delivery: 0.3, quality: 0.2 }
  }
}
