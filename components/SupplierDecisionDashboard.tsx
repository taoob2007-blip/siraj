'use client'

import { useState } from 'react'
import { AIChatPanel } from '@/components/AIChatPanel'
import { RFQResponseSection } from '@/components/RFQResponseSection'
import type { AIDecision } from '@/lib/aiDecision'

interface SupplierRow {
  id: string
  supplier_email: string
  price: number | null
  delivery_days: number | null
  answers: Record<string, string | number>
  created_at: string
}

interface SupplierDecisionDashboardProps {
  rfqTitle: string
  rfqDescription?: string | null
  suppliers: SupplierRow[]
}

export function SupplierDecisionDashboard({
  rfqTitle,
  rfqDescription,
  suppliers,
}: SupplierDecisionDashboardProps) {
  const [aiDecision, setAIDecision] = useState<AIDecision | null>(null)

  // Derive chat context (price/delivery from columns or answers fallback)
  const supplierContext = suppliers.map((r) => ({
    email: r.supplier_email,
    price: (r.price ?? (r.answers?.price !== undefined ? Number(r.answers.price) : null)) as number | null,
    delivery_days: (r.delivery_days ?? (r.answers?.delivery_days !== undefined ? Number(r.answers.delivery_days) : null)) as number | null,
  }))

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

      {/* Left — main content (2/3) */}
      <div className="lg:col-span-2 flex flex-col gap-6">
        {suppliers.length > 0 ? (
          <RFQResponseSection
            title={rfqTitle}
            description={rfqDescription}
            suppliers={suppliers}
            fields={[]}
            projectType="General"
            aiDecision={aiDecision}
          />
        ) : (
          <div className="rounded-xl border border-gray-800 bg-gray-900 p-8 text-center">
            <p className="text-gray-400">No responses received yet.</p>
            <p className="text-sm text-gray-500 mt-2">
              Responses will appear here as suppliers submit their quotations.
            </p>
          </div>
        )}
      </div>

      {/* Right — sticky AI chat (1/3) */}
      <div className="lg:col-span-1">
        <div className="sticky top-6" style={{ height: 'calc(100vh - 120px)' }}>
          <AIChatPanel
            rfqTitle={rfqTitle}
            rfqDescription={rfqDescription}
            suppliers={supplierContext}
            onDecision={setAIDecision}
          />
        </div>
      </div>
    </div>
  )
}
