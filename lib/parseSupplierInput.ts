/**
 * Smart parsing for supplier form inputs.
 * Handles human-friendly price and delivery formats in English and Arabic.
 */

// Arabic-Indic digit map
const ARABIC_DIGITS: Record<string, string> = {
  '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4',
  '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9',
}

function normalizeDigits(s: string): string {
  return s.replace(/[٠-٩]/g, (d) => ARABIC_DIGITS[d] ?? d)
}

function stripCommas(s: string): string {
  return s.replace(/,/g, '')
}

function prepare(raw: string): string {
  return stripCommas(normalizeDigits(raw.trim()))
}

// ── Price parsing ─────────────────────────────────────────────────────────────

const PRICE_MULTIPLIERS: [RegExp, number][] = [
  // English: 6M, 6.5m, 6 million, 6 millions
  [/^(\d+(?:\.\d+)?)\s*(?:m|million|millions)$/i, 1_000_000],
  // Arabic: 6 مليون, ٦مليون
  [/^(\d+(?:\.\d+)?)\s*مليون$/i, 1_000_000],
  // English: 500k, 500K, 500 thousand
  [/^(\d+(?:\.\d+)?)\s*(?:k|thousand|thousands)$/i, 1_000],
  // Arabic: 500 ألف, 500الف
  [/^(\d+(?:\.\d+)?)\s*(?:ألف|الف)$/i, 1_000],
  // English: 1B, 1 billion
  [/^(\d+(?:\.\d+)?)\s*(?:b|billion|billions)$/i, 1_000_000_000],
  // Arabic: 1 مليار
  [/^(\d+(?:\.\d+)?)\s*مليار$/i, 1_000_000_000],
]

export interface ParseResult<T> {
  value: T | null
  error: string | null
}

export function parsePrice(raw: unknown): ParseResult<number> {
  if (raw === null || raw === undefined || raw === '') return { value: null, error: null }

  const str = prepare(String(raw))

  // Plain number (integer or decimal)
  if (/^\d+(?:\.\d+)?$/.test(str)) {
    const n = parseFloat(str)
    if (!isFinite(n) || n < 0) return { value: null, error: 'Price must be a positive number' }
    return { value: n, error: null }
  }

  // Multiplier patterns
  for (const [pattern, multiplier] of PRICE_MULTIPLIERS) {
    const match = str.match(pattern)
    if (match) {
      const n = parseFloat(match[1]) * multiplier
      if (!isFinite(n) || n < 0) return { value: null, error: 'Price must be a positive number' }
      return { value: Math.round(n * 100) / 100, error: null }
    }
  }

  return { value: null, error: `Unrecognized price format: "${raw}"` }
}

// ── Delivery parsing ──────────────────────────────────────────────────────────

const DELIVERY_PATTERNS: [RegExp, (n: number) => number][] = [
  // English: 10 days, 10d
  [/^(\d+)\s*(?:days?|d)$/i, (n) => n],
  // English: 2 weeks, 2w
  [/^(\d+)\s*(?:weeks?|w)$/i, (n) => n * 7],
  // English: 1 month, 2 months
  [/^(\d+)\s*(?:months?|mo)$/i, (n) => Math.round(n * 30)],
  // Arabic: 10 يوم, 10 أيام
  [/^(\d+)\s*(?:يوم|أيام|ايام)$/, (n) => n],
  // Arabic: 2 أسبوع, 2 أسابيع
  [/^(\d+)\s*(?:أسبوع|اسبوع|أسابيع|اسابيع)$/, (n) => n * 7],
  // Arabic: 1 شهر, 2 أشهر
  [/^(\d+)\s*(?:شهر|أشهر|اشهر|شهور)$/, (n) => Math.round(n * 30)],
  // Plain integer — assume days
  [/^(\d+)$/, (n) => n],
]

export function parseDelivery(raw: unknown): ParseResult<number> {
  if (raw === null || raw === undefined || raw === '') return { value: null, error: null }

  const str = prepare(String(raw))

  for (const [pattern, convert] of DELIVERY_PATTERNS) {
    const match = str.match(pattern)
    if (match) {
      const n = parseInt(match[1], 10)
      if (!isFinite(n) || n <= 0) return { value: null, error: 'Delivery must be a positive number of days' }
      return { value: convert(n), error: null }
    }
  }

  return { value: null, error: `Unrecognized delivery format: "${raw}"` }
}
