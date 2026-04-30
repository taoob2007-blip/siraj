import { RFQCreateForm } from '@/components/RFQCreateForm'
import { FileText, Sparkles, ArrowRight } from 'lucide-react'

export default function RFQCreatePage() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <div className="border-b border-white/[0.06] bg-gradient-to-b from-blue-500/5 to-transparent px-6 py-10 text-center">
        <div className="mx-auto max-w-3xl">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-500/25 bg-blue-500/10 px-3 py-1 text-xs font-medium text-blue-300">
            <Sparkles className="h-3 w-3" />
            AI-Powered Procurement
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white">
            Create a New RFQ
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            Define your requirements, add suppliers, and let SIRAJ handle the comparison.
          </p>

          {/* Steps */}
          <div className="mt-8 flex items-center justify-center gap-2 text-xs text-gray-600">
            {['Define RFQ', 'Set Fields', 'Add Suppliers', 'Send & Compare'].map((step, i, arr) => (
              <span key={step} className="flex items-center gap-2">
                <span className="flex items-center gap-1.5">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-500/15 border border-blue-500/25 text-[10px] font-bold text-blue-400">
                    {i + 1}
                  </span>
                  <span className="text-gray-500">{step}</span>
                </span>
                {i < arr.length - 1 && <ArrowRight className="h-3 w-3 text-gray-700" />}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="mx-auto max-w-3xl px-6 py-10">
        <RFQCreateForm />
      </div>
    </div>
  )
}
