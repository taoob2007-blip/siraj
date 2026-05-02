import React from 'react'
import {
  Document, Page, View, Text, StyleSheet,
} from '@react-pdf/renderer'

// ── Types ──────────────────────────────────────────────────────────────────────

export interface ContractRow {
  id: string
  status: string
  price: number | null
  delivery_days: number | null
  supplier_email: string
  created_at: string
  buyer_signature: string | null
  supplier_signature: string | null
}

export interface ReportData {
  contracts: ContractRow[]
  totalRFQs: number
  generatedAt: string
}

// ── Metrics ────────────────────────────────────────────────────────────────────

function computeMetrics(contracts: ContractRow[]) {
  const signed      = contracts.filter((c) => c.buyer_signature)
  const fullyExec   = contracts.filter((c) => c.buyer_signature && c.supplier_signature)
  const cancelled   = contracts.filter((c) => c.status === 'cancelled')
  const pending     = contracts.filter((c) => !c.buyer_signature && c.status !== 'cancelled')

  const withPrice   = contracts.filter((c) => c.price != null && (c.price as number) > 0)
  const totalSpend  = signed.reduce((s, c) => s + (c.price ?? 0), 0)
  const avgPrice    = withPrice.length
    ? Math.round(withPrice.reduce((s, c) => s + (c.price ?? 0), 0) / withPrice.length)
    : 0

  const withDelivery = contracts.filter((c) => c.delivery_days != null && (c.delivery_days as number) > 0)
  const avgDelivery  = withDelivery.length
    ? Math.round(withDelivery.reduce((s, c) => s + (c.delivery_days ?? 0), 0) / withDelivery.length)
    : 0

  // Supplier breakdown
  const supMap = new Map<string, { contracts: number; totalSpend: number; totalDel: number; delCount: number }>()
  contracts.forEach((c) => {
    const e = supMap.get(c.supplier_email) ?? { contracts: 0, totalSpend: 0, totalDel: 0, delCount: 0 }
    e.contracts++
    if (c.price)         e.totalSpend += c.price
    if (c.delivery_days) { e.totalDel += c.delivery_days; e.delCount++ }
    supMap.set(c.supplier_email, e)
  })
  const suppliers = Array.from(supMap.entries())
    .map(([email, d]) => ({
      email,
      contracts: d.contracts,
      totalSpend: d.totalSpend,
      avgPrice:    d.totalSpend > 0 ? Math.round(d.totalSpend / d.contracts) : 0,
      avgDelivery: d.delCount  > 0 ? Math.round(d.totalDel  / d.delCount)  : 0,
    }))
    .sort((a, b) => b.totalSpend - a.totalSpend)

  // Savings: sum of (max_price - contract_price) across signed contracts
  const prices   = withPrice.map((c) => c.price as number)
  const maxPrice = prices.length ? Math.max(...prices) : 0
  const savings  = signed
    .filter((c) => c.price)
    .reduce((s, c) => s + Math.max(0, maxPrice - (c.price ?? 0)), 0)

  return {
    total: contracts.length,
    signed: signed.length,
    fullyExec: fullyExec.length,
    cancelled: cancelled.length,
    pending: pending.length,
    totalSpend,
    avgPrice,
    avgDelivery,
    savings,
    suppliers,
    bestSupplier: suppliers[0] ?? null,
  }
}

// ── Formatters ─────────────────────────────────────────────────────────────────

function fmt(n: number): string {
  if (n >= 1_000_000) return `SAR ${(n / 1_000_000).toFixed(2)}M`
  if (n >= 1_000)     return `SAR ${(n / 1_000).toFixed(1)}K`
  return `SAR ${n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`
}

function deriveStatus(c: ContractRow): string {
  if (c.status === 'cancelled')                      return 'Cancelled'
  if (c.buyer_signature && c.supplier_signature)     return 'Fully Executed'
  if (c.buyer_signature)                             return 'Signed'
  return 'Pending'
}

// ── Insights ───────────────────────────────────────────────────────────────────

function buildInsights(m: ReturnType<typeof computeMetrics>, totalRFQs: number): string[] {
  const out: string[] = []

  if (m.totalSpend > 0) {
    out.push(
      `Total committed procurement value of ${fmt(m.totalSpend)} across ` +
      `${m.signed} signed contract${m.signed !== 1 ? 's' : ''}.`,
    )
  } else {
    out.push(
      `${m.total} contract${m.total !== 1 ? 's' : ''} on record — no signed value committed yet.`,
    )
  }

  if (m.bestSupplier) {
    out.push(
      `Top supplier: ${m.bestSupplier.email.split('@')[0]} — ` +
      `${m.bestSupplier.contracts} contract${m.bestSupplier.contracts !== 1 ? 's' : ''}, ` +
      `${m.bestSupplier.totalSpend > 0 ? fmt(m.bestSupplier.totalSpend) : 'no committed value'}.`,
    )
  }

  if (m.avgDelivery > 0) {
    const rating = m.avgDelivery <= 5 ? 'excellent' : m.avgDelivery <= 14 ? 'strong' : 'extended'
    out.push(
      `Average delivery commitment of ${m.avgDelivery} days — ${rating} supplier responsiveness.`,
    )
  }

  if (m.savings > 0) {
    const pct = m.totalSpend > 0
      ? Math.round((m.savings / (m.totalSpend + m.savings)) * 100)
      : 0
    out.push(
      `Estimated procurement savings of ${fmt(m.savings)} (${pct}%) versus maximum quoted rates.`,
    )
  }

  if (totalRFQs > 0 && m.signed > 0) {
    const rate = Math.round((m.signed / totalRFQs) * 100)
    out.push(
      `Contract conversion rate: ${rate}% — ${m.signed} of ${totalRFQs} RFQs progressed to a signed contract.`,
    )
  }

  if (m.fullyExec > 0) {
    out.push(
      `${m.fullyExec} contract${m.fullyExec !== 1 ? 's are' : ' is'} fully executed ` +
      `with both buyer and supplier signatures confirmed.`,
    )
  }

  return out.slice(0, 5)
}

// ── Palette ────────────────────────────────────────────────────────────────────

const C = {
  navy:     '#0d1421',
  navyMid:  '#1a2540',
  navyCard: '#162035',
  blue:     '#3b82f6',
  emerald:  '#10b981',
  amber:    '#f59e0b',
  violet:   '#8b5cf6',
  red:      '#ef4444',
  white:    '#ffffff',
  gray:     '#94a3b8',
  grayD:    '#475569',
  grayL:    '#cbd5e1',
  border:   '#243050',
}

const BAR_COLORS = [C.emerald, C.blue, C.violet, C.amber, '#f472b6', '#22d3ee']

// ── Styles ─────────────────────────────────────────────────────────────────────

const S = StyleSheet.create({
  page: {
    backgroundColor: C.navy,
    paddingTop: 44,
    paddingBottom: 48,
    paddingHorizontal: 40,
    fontFamily: 'Helvetica',
    color: C.white,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 28,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    borderBottomStyle: 'solid',
  },
  logoBadge: {
    width: 34,
    height: 34,
    backgroundColor: C.blue,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  logoLetter: { fontSize: 16, fontFamily: 'Helvetica-Bold', color: C.white },
  logoName:   { fontSize: 16, fontFamily: 'Helvetica-Bold', color: C.white, letterSpacing: 2 },
  logoSub:    { fontSize: 7,  color: C.gray, letterSpacing: 1.5, marginTop: 1 },
  reportTitle:{ fontSize: 13, fontFamily: 'Helvetica-Bold', color: C.white, textAlign: 'right' },
  reportMeta: { fontSize: 7.5, color: C.gray, marginTop: 3, textAlign: 'right' },
  confBadge: {
    marginTop: 6,
    paddingHorizontal: 6,
    paddingVertical: 3,
    backgroundColor: '#f59e0b1a',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#f59e0b33',
    borderStyle: 'solid',
    alignSelf: 'flex-end',
  },
  confText: { fontSize: 7, fontFamily: 'Helvetica-Bold', color: C.amber, letterSpacing: 1.5 },

  // Section label
  sectionLabel: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: C.gray,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 10,
  },

  // KPI cards
  kpiRow:   { flexDirection: 'row', marginBottom: 20 },
  kpiCard: {
    flex: 1,
    backgroundColor: C.navyCard,
    borderRadius: 10,
    padding: 12,
    marginRight: 7,
    borderWidth: 1,
    borderColor: C.border,
    borderStyle: 'solid',
  },
  kpiCardLast: { marginRight: 0 },
  kpiDot:  { width: 5, height: 5, borderRadius: 3, marginBottom: 8 },
  kpiLbl:  { fontSize: 6.5, color: C.gray, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 5 },
  kpiVal:  { fontSize: 16, fontFamily: 'Helvetica-Bold', color: C.white, marginBottom: 2 },
  kpiSub:  { fontSize: 6.5, color: C.grayD },

  // Status mini cards
  statusRow: { flexDirection: 'row', marginBottom: 22 },
  statusCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: 'solid',
    marginRight: 6,
  },
  statusCardLast: { marginRight: 0 },
  statusDot: { width: 6, height: 6, borderRadius: 3, marginRight: 7 },
  statusLbl: { fontSize: 6.5, letterSpacing: 0.5, marginBottom: 1 },
  statusNum: { fontSize: 14, fontFamily: 'Helvetica-Bold', color: C.white },

  // Insights
  insightBox: {
    backgroundColor: C.navyCard,
    borderRadius: 10,
    padding: 14,
    marginBottom: 22,
    borderWidth: 1,
    borderColor: C.border,
    borderStyle: 'solid',
    borderLeftWidth: 3,
    borderLeftColor: C.blue,
    borderLeftStyle: 'solid',
  },
  insightRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 7 },
  insightBullet: {
    width: 4, height: 4, borderRadius: 2,
    backgroundColor: C.blue,
    marginTop: 4, marginRight: 8,
    flexShrink: 0,
  },
  insightText: { fontSize: 8.5, color: C.grayL, lineHeight: 1.6, flex: 1 },

  // Bar chart
  chartBox: {
    backgroundColor: C.navyCard,
    borderRadius: 10,
    padding: 14,
    marginBottom: 22,
    borderWidth: 1,
    borderColor: C.border,
    borderStyle: 'solid',
  },
  barRow:   { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  barLabel: { fontSize: 7.5, color: C.gray, width: 88 },
  barTrack: { flex: 1, height: 9, backgroundColor: C.navyMid, borderRadius: 5 },
  barFill:  { height: 9, borderRadius: 5 },
  barVal:   { fontSize: 7.5, color: C.white, width: 64, textAlign: 'right' },

  // Tables
  tHead: {
    flexDirection: 'row',
    backgroundColor: C.navyMid,
    paddingVertical: 7,
    paddingHorizontal: 8,
    borderRadius: 6,
    marginBottom: 1,
  },
  tHCell: {
    fontSize: 6.5,
    fontFamily: 'Helvetica-Bold',
    color: C.gray,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  tRow: {
    flexDirection: 'row',
    paddingVertical: 7,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    borderBottomStyle: 'solid',
    alignItems: 'center',
  },
  tRowAlt: { backgroundColor: C.navyMid },
  tCell:   { fontSize: 7.5, color: C.grayL },
  tCellB:  { fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: C.white },
  tCellG:  { fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: C.emerald },

  // Badge
  badge: { paddingHorizontal: 5, paddingVertical: 2, borderRadius: 4 },
  badgeText: { fontSize: 6.5, fontFamily: 'Helvetica-Bold' },

  // Footer
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 40,
    right: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 7,
    borderTopWidth: 1,
    borderTopColor: C.border,
    borderTopStyle: 'solid',
  },
  footerL:    { fontSize: 7, color: C.grayD },
  footerC:    { fontSize: 7, fontFamily: 'Helvetica-Bold', color: C.grayD, letterSpacing: 1.5 },
  footerPage: { fontSize: 7, color: C.grayD },
})

// ── Sub-components ─────────────────────────────────────────────────────────────

function KPICard({
  label, value, sub, dotColor, last = false,
}: { label: string; value: string; sub: string; dotColor: string; last?: boolean }) {
  return (
    <View style={[S.kpiCard, last ? S.kpiCardLast : {}]}>
      <View style={[S.kpiDot, { backgroundColor: dotColor }]} />
      <Text style={S.kpiLbl}>{label}</Text>
      <Text style={S.kpiVal}>{value}</Text>
      <Text style={S.kpiSub}>{sub}</Text>
    </View>
  )
}

function StatusCard({
  label, value, color, last = false,
}: { label: string; value: number; color: string; last?: boolean }) {
  return (
    <View style={[
      S.statusCard,
      last ? S.statusCardLast : {},
      { backgroundColor: color + '18', borderColor: color + '35' },
    ]}>
      <View style={[S.statusDot, { backgroundColor: color }]} />
      <View>
        <Text style={[S.statusLbl, { color }]}>{label}</Text>
        <Text style={S.statusNum}>{value}</Text>
      </View>
    </View>
  )
}

function Badge({ status }: { status: string }) {
  const map: Record<string, { bg: string; color: string }> = {
    'Fully Executed': { bg: C.emerald + '22', color: C.emerald },
    'Signed':         { bg: C.blue    + '22', color: C.blue    },
    'Cancelled':      { bg: C.red     + '22', color: C.red     },
    'Pending':        { bg: C.amber   + '22', color: C.amber   },
  }
  const cfg = map[status] ?? map['Pending']
  return (
    <View style={[S.badge, { backgroundColor: cfg.bg }]}>
      <Text style={[S.badgeText, { color: cfg.color }]}>{status}</Text>
    </View>
  )
}

// ── Main PDF Document ──────────────────────────────────────────────────────────

export function ExecutiveReport({ data }: { data: ReportData }) {
  const { contracts, totalRFQs, generatedAt } = data
  const m        = computeMetrics(contracts)
  const insights = buildInsights(m, totalRFQs)
  const topSups  = m.suppliers.slice(0, 6)
  const maxSpend = topSups.length ? topSups[0].totalSpend : 0

  return (
    <Document title="Executive Procurement Report" author="SIRAJ AI">
      <Page size="A4" style={S.page}>

        {/* ── HEADER ────────────────────────────────────────────────────── */}
        <View style={S.header}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={S.logoBadge}>
              <Text style={S.logoLetter}>S</Text>
            </View>
            <View>
              <Text style={S.logoName}>SIRAJ</Text>
              <Text style={S.logoSub}>AI PROCUREMENT PLATFORM</Text>
            </View>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={S.reportTitle}>Executive Procurement Report</Text>
            <Text style={S.reportMeta}>Generated: {generatedAt}</Text>
            <Text style={S.reportMeta}>{contracts.length} contracts · {totalRFQs} RFQs</Text>
            <View style={S.confBadge}>
              <Text style={S.confText}>CONFIDENTIAL</Text>
            </View>
          </View>
        </View>

        {/* ── KPI CARDS ─────────────────────────────────────────────────── */}
        <Text style={S.sectionLabel}>Executive Summary</Text>
        <View style={S.kpiRow}>
          <KPICard
            label="Total Contract Value"
            value={m.totalSpend > 0 ? fmt(m.totalSpend) : '—'}
            sub={`${m.signed} signed contract${m.signed !== 1 ? 's' : ''}`}
            dotColor={C.emerald}
          />
          <KPICard
            label="Contracts"
            value={String(m.total)}
            sub={`${m.fullyExec} fully executed`}
            dotColor={C.blue}
          />
          <KPICard
            label="Avg Contract Value"
            value={m.avgPrice > 0 ? fmt(m.avgPrice) : '—'}
            sub="per contract"
            dotColor={C.violet}
          />
          <KPICard
            label="Avg Delivery"
            value={m.avgDelivery > 0 ? `${m.avgDelivery} days` : '—'}
            sub="committed timeline"
            dotColor={C.amber}
            last
          />
        </View>

        {/* ── STATUS MINI CARDS ─────────────────────────────────────────── */}
        <View style={S.statusRow}>
          <StatusCard label="Signed"        value={m.signed}    color={C.emerald} />
          <StatusCard label="Pending"       value={m.pending}   color={C.amber}   />
          <StatusCard label="Fully Executed" value={m.fullyExec} color={C.blue}   />
          <StatusCard label="Cancelled"     value={m.cancelled} color={C.red} last />
        </View>

        {/* ── INSIGHTS ──────────────────────────────────────────────────── */}
        {insights.length > 0 && (
          <View>
            <Text style={S.sectionLabel}>AI Procurement Insights</Text>
            <View style={S.insightBox}>
              {insights.map((text, i) => (
                <View key={i} style={[S.insightRow, i === insights.length - 1 ? { marginBottom: 0 } : {}]}>
                  <View style={S.insightBullet} />
                  <Text style={S.insightText}>{text}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ── SPEND BY SUPPLIER (BAR CHART) ─────────────────────────────── */}
        {topSups.length > 0 && (
          <View>
            <Text style={S.sectionLabel}>Supplier Spend Analysis</Text>
            <View style={S.chartBox}>
              {topSups.map((s, i) => {
                const pct  = maxSpend > 0 ? Math.round((s.totalSpend / maxSpend) * 100) : 0
                const name = s.email.split('@')[0].slice(0, 16)
                const color = BAR_COLORS[i % BAR_COLORS.length]
                return (
                  <View key={s.email} style={[S.barRow, i === topSups.length - 1 ? { marginBottom: 0 } : {}]}>
                    <Text style={S.barLabel}>{name}</Text>
                    <View style={S.barTrack}>
                      {pct > 0 && (
                        <View style={[S.barFill, { width: `${pct}%`, backgroundColor: color }]} />
                      )}
                    </View>
                    <Text style={S.barVal}>{s.totalSpend > 0 ? fmt(s.totalSpend) : '—'}</Text>
                  </View>
                )
              })}
            </View>
          </View>
        )}

        {/* ── SUPPLIER RANKING TABLE ────────────────────────────────────── */}
        <View>
          <Text style={S.sectionLabel}>Supplier Performance Ranking</Text>
          <View style={S.tHead}>
            <Text style={[S.tHCell, { flex: 2 }]}>Supplier</Text>
            <Text style={[S.tHCell, { width: 52, textAlign: 'center' }]}>Contracts</Text>
            <Text style={[S.tHCell, { width: 80, textAlign: 'right'  }]}>Total Value</Text>
            <Text style={[S.tHCell, { width: 72, textAlign: 'right'  }]}>Avg Price</Text>
            <Text style={[S.tHCell, { width: 56, textAlign: 'right'  }]}>Avg Delivery</Text>
          </View>
          {m.suppliers.slice(0, 8).map((s, i) => (
            <View key={s.email} style={[S.tRow, i % 2 === 1 ? S.tRowAlt : {}]}>
              <View style={{ flex: 2, flexDirection: 'row', alignItems: 'center' }}>
                <View style={{
                  width: 15, height: 15, borderRadius: 8,
                  backgroundColor: BAR_COLORS[i % BAR_COLORS.length] + '28',
                  alignItems: 'center', justifyContent: 'center', marginRight: 6,
                }}>
                  <Text style={{ fontSize: 6.5, fontFamily: 'Helvetica-Bold', color: BAR_COLORS[i % BAR_COLORS.length] }}>
                    {i + 1}
                  </Text>
                </View>
                <Text style={[S.tCell, { flex: 1 }]}>{s.email}</Text>
              </View>
              <Text style={[S.tCell,  { width: 52, textAlign: 'center' }]}>{s.contracts}</Text>
              <Text style={[S.tCellG, { width: 80, textAlign: 'right'  }]}>
                {s.totalSpend > 0 ? fmt(s.totalSpend) : '—'}
              </Text>
              <Text style={[S.tCell,  { width: 72, textAlign: 'right'  }]}>
                {s.avgPrice > 0 ? fmt(s.avgPrice) : '—'}
              </Text>
              <Text style={[S.tCell,  { width: 56, textAlign: 'right'  }]}>
                {s.avgDelivery > 0 ? `${s.avgDelivery}d` : '—'}
              </Text>
            </View>
          ))}
        </View>

        {/* ── CONTRACT REGISTER ─────────────────────────────────────────── */}
        <View style={{ marginTop: 22 }}>
          <Text style={S.sectionLabel}>Contract Register</Text>
          <View style={S.tHead}>
            <Text style={[S.tHCell, { width: 54 }]}>ID</Text>
            <Text style={[S.tHCell, { flex: 2 }]}>Supplier</Text>
            <Text style={[S.tHCell, { width: 78, textAlign: 'right'  }]}>Price</Text>
            <Text style={[S.tHCell, { width: 46, textAlign: 'center' }]}>Del.</Text>
            <Text style={[S.tHCell, { width: 74, textAlign: 'center' }]}>Status</Text>
            <Text style={[S.tHCell, { width: 54, textAlign: 'right'  }]}>Date</Text>
          </View>
          {contracts.slice(0, 18).map((c, i) => {
            const status = deriveStatus(c)
            return (
              <View key={c.id} style={[S.tRow, i % 2 === 1 ? S.tRowAlt : {}]}>
                <Text style={[S.tCell, { width: 54, color: C.grayD, fontFamily: 'Courier' }]}>
                  {c.id.split('-')[0].toUpperCase()}
                </Text>
                <Text style={[S.tCell, { flex: 2 }]}>{c.supplier_email}</Text>
                <Text style={[S.tCellG, { width: 78, textAlign: 'right' }]}>
                  {c.price ? fmt(c.price) : '—'}
                </Text>
                <Text style={[S.tCell, { width: 46, textAlign: 'center' }]}>
                  {c.delivery_days ? `${c.delivery_days}d` : '—'}
                </Text>
                <View style={{ width: 74, alignItems: 'center' }}>
                  <Badge status={status} />
                </View>
                <Text style={[S.tCell, { width: 54, textAlign: 'right' }]}>
                  {new Date(c.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })}
                </Text>
              </View>
            )
          })}
          {contracts.length > 18 && (
            <Text style={{ fontSize: 7, color: C.grayD, textAlign: 'center', marginTop: 8 }}>
              Showing 18 of {contracts.length} contracts — export Excel for full list.
            </Text>
          )}
        </View>

        {/* ── FOOTER (fixed, appears on every page) ─────────────────────── */}
        <View style={S.footer} fixed>
          <Text style={S.footerL}>SIRAJ AI Procurement Platform</Text>
          <Text style={S.footerC}>CONFIDENTIAL — DO NOT DISTRIBUTE</Text>
          <Text
            style={S.footerPage}
            render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`}
          />
        </View>

      </Page>
    </Document>
  )
}
