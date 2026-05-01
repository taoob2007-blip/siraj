export const dynamic = 'force-dynamic'

import { BASE_URL } from '@/lib/constants'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import type { RFQField } from '@/lib/types'
import { DEFAULT_RFQ_FIELDS } from '@/lib/types'
import { RFQResponseSection } from '@/components/RFQResponseSection'
import { SupplierInvitationsAccordion } from '@/components/SupplierInvitationsAccordion'
import { AIChatPanel } from '@/components/AIChatPanel'

type InviteRow = {
  id: string
  supplier_email: string
  token: string
  responded: boolean
  created_at: string
  [key: string]: unknown
}

type ResponseRow = {
  id: string
  supplier_email: string
  price: number | null
  delivery_days: number | null
  answers: Record<string, string | number>
  created_at: string
}

type RFQData = {
  id: string
  user_id: string
  title: string
  description: string | null
  status: string
  form_schema: RFQField[] | null
  created_at: string
  selected_supplier: string | null
  ai_result: {
    scores?: Array<{ email: string; score: number; label: string; explanation: string }>
    best_supplier?: string | null
    reasoning?: string
    tradeoffs?: string
    risks?: string
    negotiation?: string
  } | null
}

const STATUS_STYLES: Record<string, string> = {
  active:   'bg-blue-900/50 text-blue-200 border-blue-700',
  closed:   'bg-gray-700/50 text-gray-300 border-gray-600',
  archived: 'bg-gray-800/50 text-gray-400 border-gray-700',
}

export default async function RFQDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const rfqId = params.id

  console.log('PARAMS:', params)
  console.log('RFQ ID:', rfqId)

  if (!rfqId) {
    console.error('Missing RFQ ID')
    return <div>Invalid ID</div>
  }

  const fetchUrl = `${BASE_URL}/api/rfqs/${rfqId}`

  console.log('FETCH URL:', fetchUrl)

  const res = await fetch(fetchUrl, { cache: 'no-store' })

  console.log('FETCH STATUS:', res.status)

  const text = await res.text()
  console.log('RAW RESPONSE:', text)

  const data = JSON.parse(text) as {
    rfq?: RFQData
    invites?: InviteRow[]
    responses?: ResponseRow[]
    error?: string
  }

  if (!data?.rfq) {
    console.error('NO RFQ IN RESPONSE — data:', data)
    return (
      <div className="flex flex-col items-center justify-center mt-24 text-center">
        <h2 className="text-xl font-semibold text-white">RFQ not found</h2>
        <p className="text-gray-400 mt-2">This RFQ may have been deleted or is unavailable.</p>
        <p className="text-xs text-gray-600 mt-2 font-mono">id: {rfqId} · status: {res.status}</p>
        <a href="/rfqs" className="mt-4 text-blue-400 hover:underline">Back to RFQs</a>
      </div>
    )
  }

  const rfqData   = data.rfq
  const invites   = data.invites   ?? []
  const responses = data.responses ?? []

  // Build cached AI scores from rfq.ai_result
  const cachedAiScores: Record<string, {
    email: string
    score: number
    label: 'Excellent' | 'Good' | 'Fair' | 'Poor'
    explanation: string
  }> = {}
  if (rfqData.ai_result?.scores) {
    for (const s of rfqData.ai_result.scores) {
      cachedAiScores[s.email] = {
        email:       s.email,
        score:       s.score,
        label:       (s.label as 'Excellent' | 'Good' | 'Fair' | 'Poor') ?? 'Fair',
        explanation: s.explanation,
      }
    }
  }

  const cachedAiDecision =
    rfqData.ai_result?.reasoning && rfqData.ai_result?.best_supplier
      ? {
          best_supplier: rfqData.ai_result.best_supplier as string,
          reasoning:     rfqData.ai_result.reasoning     as string,
          tradeoffs:     rfqData.ai_result.tradeoffs     ?? '',
          risks:         rfqData.ai_result.risks         ?? '',
          negotiation:   rfqData.ai_result.negotiation   ?? '',
        }
      : null

  const fields: RFQField[] =
    Array.isArray(rfqData.form_schema) && rfqData.form_schema.length > 0
      ? rfqData.form_schema
      : DEFAULT_RFQ_FIELDS

  const status      = rfqData.status ?? 'active'
  const statusStyle = STATUS_STYLES[status] ?? STATUS_STYLES.active
  const responseRate = invites.length > 0
    ? Math.round((responses.length / invites.length) * 100)
    : 0

  const supplierContext = responses.map((r) => ({
    email:         r.supplier_email,
    price:         (r.price         ?? r.answers?.price         ?? null) as number | null,
    delivery_days: (r.delivery_days ?? r.answers?.delivery_days ?? null) as number | null,
    answers:       (r.answers ?? {}) as Record<string, string | number>,
  }))

  return (
    <div className="flex flex-col gap-6">
      {/* Back nav */}
      <div>
        <Link href="/rfqs">
          <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white -ml-2">
            <ArrowLeft className="h-4 w-4 mr-1" />
            All RFQs
          </Button>
        </Link>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-1">
          <h1 className="text-3xl font-bold">{rfqData.title}</h1>
          {rfqData.description && (
            <p className="text-gray-400">{rfqData.description}</p>
          )}
          <div className="flex gap-4 text-sm text-gray-500 pt-1">
            <span>
              ID: <code className="font-mono text-gray-400 text-xs">{rfqId}</code>
            </span>
            <span>Created: {new Date(rfqData.created_at).toISOString().split('T')[0]}</span>
          </div>
        </div>
        <Badge className={`${statusStyle} capitalize`}>{status}</Badge>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="border-gray-700 bg-gray-900 p-4">
          <div className="text-sm text-gray-400">Invitations</div>
          <div className="text-3xl font-bold mt-1">{invites.length}</div>
        </Card>
        <Card className="border-gray-700 bg-gray-900 p-4">
          <div className="text-sm text-gray-400">Responses</div>
          <div className="text-3xl font-bold mt-1">{responses.length}</div>
        </Card>
        <Card className="border-gray-700 bg-gray-900 p-4">
          <div className="text-sm text-gray-400">Response Rate</div>
          <div className="text-3xl font-bold mt-1">{responseRate}%</div>
        </Card>
      </div>

      {/* 2-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

        {/* Left column — main content */}
        <div className="lg:col-span-2 flex flex-col gap-6">

          {/* Supplier Invitations */}
          <SupplierInvitationsAccordion
            rfqId={rfqId}
            invites={invites}
            baseUrl={BASE_URL}
          />

          {/* AI Assisted Decision banner */}
          <div className="relative rounded-xl border border-blue-500/20 bg-gradient-to-r from-blue-950/40 via-blue-900/20 to-indigo-950/40 p-5 overflow-hidden">
            <div className="absolute -top-6 -left-6 h-24 w-24 rounded-full bg-blue-500/10 blur-2xl pointer-events-none" />
            <div className="absolute -bottom-6 -right-6 h-24 w-24 rounded-full bg-indigo-500/10 blur-2xl pointer-events-none" />

            <div className="relative flex items-start gap-4">
              <div className="shrink-0 p-2.5 rounded-lg bg-blue-500/10 border border-blue-500/20">
                <svg className="h-5 w-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z" />
                </svg>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm font-semibold text-white">AI Assisted Decision</h3>
                  <Badge className="bg-blue-500/15 text-blue-300 border-blue-500/30 hover:bg-blue-500/15 text-xs px-2 py-0">
                    Powered by AI
                  </Badge>
                </div>
                <p className="text-sm text-blue-200/70 mt-1 leading-relaxed">
                  Our AI analyzed supplier responses and helped you identify the best option based on price, delivery, and value.
                </p>
                <p className="text-xs text-blue-400/50 mt-2">
                  Recommendation updates automatically as new quotes arrive.
                </p>
              </div>
            </div>
          </div>

          {/* Supplier Decision Dashboard */}
          {responses.length > 0 ? (
            <RFQResponseSection
              title={rfqData.title}
              description={rfqData.description}
              suppliers={responses}
              fields={[]}
              projectType="General"
              rfqId={rfqId}
              autoScore={true}
              initialAiScores={Object.keys(cachedAiScores).length > 0 ? cachedAiScores : undefined}
              initialAiDecision={cachedAiDecision}
              acceptedSupplier={rfqData.selected_supplier ?? null}
            />
          ) : (
            <Card className="border-gray-700 bg-gray-900 p-8">
              <div className="text-center">
                <p className="text-gray-400">No responses received yet.</p>
                <p className="text-sm text-gray-500 mt-2">
                  Responses will appear here as suppliers submit their quotations.
                </p>
              </div>
            </Card>
          )}
        </div>

        {/* Right column — sticky AI chat */}
        <div className="lg:col-span-1">
          <div className="sticky top-6" style={{ height: 'calc(100vh - 120px)' }}>
            <AIChatPanel
              rfqTitle={rfqData.title}
              rfqDescription={rfqData.description}
              suppliers={supplierContext}
              formFields={fields.map((f) => ({ id: f.id, label: f.label }))}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
