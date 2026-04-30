'use client'

import { useEffect, useState } from 'react'
import { RFQList } from '@/components/RFQList'
import { Button } from '@/components/ui/button'
import { Plus, FileText, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { consumePendingRFQ, type RFQItem } from '@/lib/rfqStore'

export default function RFQsPage() {
  const [rfqs, setRfqs]       = useState<RFQItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)

  useEffect(() => {
    // Step 1 — inject optimistic RFQ immediately (before server responds)
    const pending = consumePendingRFQ()
    if (pending && pending.id) {
      setRfqs([pending])
      setLoading(false) // show list immediately with the optimistic record
    }

    // Step 2 — fetch real data and merge
    fetch('/api/rfqs/list', { cache: 'no-store' })
      .then((res) => res.json())
      .then((data) => {
        if (data.error) throw new Error(data.error)
        const serverRfqs = data as RFQItem[]

        setRfqs((prev) => {
          const optimistics = prev.filter((r) => r._optimistic)
          // Remove optimistic records that now exist in server data (matched by title)
          const serverTitles = new Set(serverRfqs.map((r) => r.title))
          const stillPending = optimistics.filter((r) => !serverTitles.has(r.title))
          // Prepend any still-pending optimistic records ahead of server list
          return [...stillPending, ...serverRfqs]
        })
      })
      .catch((err: Error) => {
        setError(err.message)
      })
      .finally(() => setLoading(false))
  }, [])

  // ── Loading skeleton (only shown when no optimistic record is present) ───────
  if (loading && rfqs.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1.5">
            <div className="h-7 w-32 bg-gray-800 rounded-lg animate-pulse" />
            <div className="h-3 w-24 bg-gray-800/60 rounded animate-pulse" />
          </div>
          <div className="h-9 w-24 bg-gray-800 rounded-lg animate-pulse" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-3">
              <div className="flex justify-between">
                <div className="h-3 w-20 bg-gray-800 rounded animate-pulse" />
                <div className="h-8 w-8 bg-gray-800 rounded-lg animate-pulse" />
              </div>
              <div className="h-8 w-16 bg-gray-800 rounded animate-pulse" />
              <div className="h-3 w-28 bg-gray-800/60 rounded animate-pulse" />
            </div>
          ))}
        </div>
        <div className="flex flex-col gap-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
              <div className="flex justify-between">
                <div className="space-y-2 flex-1">
                  <div className="h-4 w-48 bg-gray-800 rounded animate-pulse" />
                  <div className="h-3 w-72 bg-gray-800/60 rounded animate-pulse" />
                </div>
                <div className="h-4 w-20 bg-gray-800/60 rounded animate-pulse" />
              </div>
              <div className="flex gap-5">
                {[...Array(3)].map((_, j) => (
                  <div key={j} className="h-3 w-20 bg-gray-800/60 rounded animate-pulse" />
                ))}
              </div>
              <div className="h-1 w-full bg-gray-800 rounded-full animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error && rfqs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4 text-center">
        <div className="p-4 rounded-full bg-red-900/30">
          <AlertCircle className="h-8 w-8 text-red-400" />
        </div>
        <div>
          <p className="text-lg font-medium text-red-300">Failed to load RFQs</p>
          <p className="text-sm text-gray-500 mt-1 font-mono">{error}</p>
        </div>
      </div>
    )
  }

  if (rfqs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-5 text-center">
        <div className="p-4 rounded-full bg-gray-800/60">
          <FileText className="h-8 w-8 text-gray-500" />
        </div>
        <div>
          <p className="text-lg font-medium text-gray-200">No RFQs yet</p>
          <p className="text-sm text-gray-500 mt-1">
            Create your first request for quotation to get started.
          </p>
        </div>
        <Link href="/rfqs/new">
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Plus className="h-4 w-4 mr-2" />
            Create RFQ
          </Button>
        </Link>
      </div>
    )
  }

  return <RFQList initialRfqs={rfqs} />
}
