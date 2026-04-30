'use client'

import { useState } from 'react'
import { SupplierResponseForm } from '@/components/SupplierResponseForm'
import type { RFQField } from '@/lib/types'

interface SupplierFormPageClientProps {
  rfqId: string
  rfqTitle: string
  rfqDescription?: string
  supplierEmail: string
  token: string
  fields: RFQField[]
}

export function SupplierFormPageClient({
  rfqId,
  rfqTitle,
  rfqDescription,
  supplierEmail,
  token,
  fields,
}: SupplierFormPageClientProps) {
  const [submitted, setSubmitted] = useState(false)

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center gap-6 py-24 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-900/30 border border-green-700">
          <svg className="h-8 w-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Thank You!</h1>
          <p className="text-gray-400 mt-2">Your quotation has been received and recorded.</p>
        </div>
      </div>
    )
  }

  return (
    <SupplierResponseForm
      rfqId={rfqId}
      rfqTitle={rfqTitle}
      rfqDescription={rfqDescription}
      supplierEmail={supplierEmail}
      token={token}
      fields={fields}
      onSuccess={() => setSubmitted(true)}
    />
  )
}
