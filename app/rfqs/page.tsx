'use client'

import { useEffect, useState } from 'react'
import { RFQList } from '@/components/RFQList'
import { Button } from '@/components/ui/button'
import { Plus, FileText, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { consumePendingRFQ, type RFQItem } from '@/lib/rfqStore'
import { supabaseBrowserClient as supabase } from '@/lib/supabase/client'

export default function RFQsPage() {
  const [rfqs, setRfqs]       = useState<RFQItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)

  // Client-side session guard — belt-and-suspenders alongside middleware protection
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        window.location.href = '/login'
      }
    })
  }, [])

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
            <div key={i} className="bg-[#0d1220] border border-white/[0.05] rounded-2xl p-5 space-y-3">
              <div className="flex justify-between">
                <div className="h-3 w-20 bg-white/[0.05] rounded animate-pulse" />
                <div className="h-8 w-8 bg-white/[0.05] rounded-lg animate-pulse" />
              </div>
              <div className="h-8 w-16 bg-white/[0.05] rounded animate-pulse" />
              <div className="h-3 w-28 bg-white/[0.03] rounded animate-pulse" />
            </div>
          ))}
        </div>
        <div className="flex flex-col gap-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-[#0d1220] border border-white/[0.05] rounded-2xl p-5 space-y-4">
              <div className="flex justify-between">
                <div className="space-y-2 flex-1">
                  <div className="h-4 w-48 bg-white/[0.05] rounded animate-pulse" />
                  <div className="h-3 w-72 bg-white/[0.03] rounded animate-pulse" />
                </div>
                <div className="h-4 w-20 bg-white/[0.03] rounded animate-pulse" />
              </div>
              <div className="flex gap-5">
                {[...Array(3)].map((_, j) => (
                  <div key={j} className="h-3 w-20 bg-white/[0.03] rounded animate-pulse" />
                ))}
              </div>
              <div className="h-1 w-full bg-white/[0.05] rounded-full animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error && rfqs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4 text-center">
        <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
          <AlertCircle className="h-8 w-8 text-gray-500" />
        </div>
        <div>
          <p className="text-lg font-medium text-white">Failed to load RFQs</p>
          <p className="text-sm text-gray-500 mt-1 font-mono">{error}</p>
        </div>
      </div>
    )
  }

  if (rfqs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-5 text-center">
        <div className="p-4 rounded-2xl bg-cyan-400/10 border border-cyan-400/20">
          <FileText className="h-8 w-8 text-cyan-400" />
        </div>
        <div>
          <p className="text-lg font-semibold text-white">No RFQs yet</p>
          <p className="text-sm text-gray-500 mt-1">
            Create your first request for quotation to get started.
          </p>
        </div>
        <Link href="/rfqs/new">
          <button className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-black text-sm font-semibold shadow-lg shadow-cyan-400/20 transition-all">
            <Plus className="h-4 w-4" />
            Create RFQ
          </button>
        </Link>
      </div>
    )
  }

  return <RFQList initialRfqs={rfqs} />
}
