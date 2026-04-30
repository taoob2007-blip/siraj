'use client'

import { Suspense } from 'react'
import { RFQCreateForm } from '@/components/RFQCreateForm'

export function RFQNewClient() {
  return (
    <Suspense fallback={null}>
      <RFQCreateForm />
    </Suspense>
  )
}
