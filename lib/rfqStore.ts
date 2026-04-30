/**
 * Cross-page RFQ state bridge via localStorage.
 * Used to make a newly created RFQ appear instantly on /rfqs
 * before the server response is fetched.
 */

export interface RFQItem {
  id: string
  title: string
  description: string | null
  status: string
  created_at: string
  invite_count: number
  response_count: number
  _optimistic?: true   // marks temp records
}

const PENDING_KEY = 'siraj_pending_rfq'
const DRAFT_KEY   = 'siraj_rfq_draft'

// ── Optimistic record ─────────────────────────────────────────────────────────

export function buildTempRFQ(title: string, description: string): RFQItem {
  return {
    id:             `temp-${Date.now()}`,
    title,
    description:    description || null,
    status:         'active',
    created_at:     new Date().toISOString(),
    invite_count:   0,
    response_count: 0,
    _optimistic:    true,
  }
}

// ── Pending RFQ (written before redirect, read on list page) ──────────────────

export function savePendingRFQ(rfq: RFQItem): void {
  try { localStorage.setItem(PENDING_KEY, JSON.stringify(rfq)) } catch { /* SSR / private mode */ }
}

export function consumePendingRFQ(): RFQItem | null {
  try {
    const raw = localStorage.getItem(PENDING_KEY)
    if (!raw) return null
    localStorage.removeItem(PENDING_KEY)
    return JSON.parse(raw) as RFQItem
  } catch {
    return null
  }
}

// ── Draft persistence (auto-save while typing) ────────────────────────────────

export interface RFQDraft {
  title: string
  description: string
  savedAt: string
}

export function saveDraft(title: string, description: string): void {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify({ title, description, savedAt: new Date().toISOString() }))
  } catch { /* ignore */ }
}

export function loadDraft(): RFQDraft | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY)
    return raw ? (JSON.parse(raw) as RFQDraft) : null
  } catch {
    return null
  }
}

export function clearDraft(): void {
  try { localStorage.removeItem(DRAFT_KEY) } catch { /* ignore */ }
}
