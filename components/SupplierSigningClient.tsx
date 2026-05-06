'use client'

import { useRef, useState } from 'react'
import SignatureCanvas from 'react-signature-canvas'
import {
  PenTool, RotateCcw, Loader2, CheckCircle2, XCircle,
  DollarSign, Truck, FileText, Calendar, AlertTriangle,
} from 'lucide-react'

// ── Types ──────────────────────────────────────────────────────────────────────

interface Contract {
  id: string
  supplier_email: string
  price: number | null
  delivery_days: number | null
  status: string
  buyer_signature: string | null
  supplier_signature: string | null
  created_at: string
}

interface Props {
  contract: Contract
  rfqTitle: string
  rfqDescription: string | null
  token: string
}

// ── Component ──────────────────────────────────────────────────────────────────

export function SupplierSigningClient({ contract, rfqTitle, rfqDescription, token }: Props) {
  const padRef = useRef<SignatureCanvas>(null)
  const [empty, setEmpty]       = useState(true)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState<string | null>(null)
  const [signed, setSigned]     = useState(!!contract.supplier_signature)

  // Already signed
  if (signed) {
    return (
      <PageShell>
        <div className="flex flex-col items-center gap-5 py-12 text-center">
          <div className="p-4 rounded-full bg-emerald-500/10 border border-emerald-500/20">
            <CheckCircle2 className="h-10 w-10 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Contract Signed</h2>
            <p className="text-sm text-gray-500 mt-2">
              Your signature has been recorded. This contract is now fully executed.
            </p>
          </div>
        </div>
      </PageShell>
    )
  }

  // Cancelled
  if (contract.status === 'cancelled') {
    return (
      <PageShell>
        <div className="flex flex-col items-center gap-5 py-12 text-center">
          <div className="p-4 rounded-full bg-red-500/10 border border-red-500/20">
            <XCircle className="h-10 w-10 text-red-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Contract Cancelled</h2>
            <p className="text-sm text-gray-500 mt-2">This contract has been cancelled and is no longer available for signing.</p>
          </div>
        </div>
      </PageShell>
    )
  }

  async function handleSign() {
    if (!padRef.current || padRef.current.isEmpty()) {
      setError('Please draw your signature before confirming.')
      return
    }
    const signature = padRef.current.toDataURL('image/png')
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/contracts/${contract.id}/sign-supplier`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ token, signature }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || `Error ${res.status}`)
      setSigned(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to sign — please try again')
    } finally {
      setLoading(false)
    }
  }

  const createdDate = new Date(contract.created_at).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  })

  return (
    <PageShell>
      {/* Contract summary */}
      <div className="rounded-2xl border border-white/[0.07] bg-[#0d1220] overflow-hidden mb-6">

        {/* Header */}
        <div className="px-6 py-5 border-b border-white/[0.06] bg-gradient-to-r from-blue-950/40 to-indigo-950/30">
          <p className="text-[11px] font-bold text-blue-400 uppercase tracking-[0.15em] mb-1">
            SIRAJ — AI Procurement Platform
          </p>
          <h2 className="text-xl font-bold text-white">Supplier Agreement</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Contract No. <span className="font-mono text-gray-400">{contract.id.split('-')[0].toUpperCase()}</span>
          </p>
        </div>

        {/* Details */}
        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-5">
          <DetailRow icon={FileText}  label="Request for Quotation" value={rfqTitle} sub={rfqDescription ?? undefined} />
          <DetailRow icon={Calendar}  label="Contract Date"         value={createdDate} />
          <DetailRow
            icon={DollarSign}
            label="Agreed Price"
            value={contract.price != null ? `$${Number(contract.price).toLocaleString('en-US')}` : '—'}
            highlight={contract.price != null}
          />
          <DetailRow
            icon={Truck}
            label="Delivery Timeline"
            value={contract.delivery_days != null ? `${contract.delivery_days} days` : '—'}
            highlight={contract.delivery_days != null}
          />
        </div>

        {/* Buyer signature */}
        {contract.buyer_signature && (
          <div className="px-6 pb-6">
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
              <p className="text-[11px] font-semibold text-emerald-500/70 uppercase tracking-widest mb-2">Buyer Signature</p>
              <div className="rounded-lg bg-white p-2 inline-block">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={contract.buyer_signature} alt="Buyer signature" className="h-14 max-w-[220px] object-contain" />
              </div>
              <div className="flex items-center gap-1.5 mt-2">
                <CheckCircle2 className="h-3 w-3 text-emerald-400 shrink-0" />
                <p className="text-[11px] text-emerald-400/70">Buyer has signed</p>
              </div>
            </div>
          </div>
        )}

        {/* Standard terms */}
        <div className="px-6 pb-6">
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 space-y-2">
            <p className="text-[11px] font-semibold text-gray-600 uppercase tracking-widest">Standard Terms</p>
            {[
              'You agree to deliver the goods/services as specified in the RFQ.',
              'Payment terms are subject to mutual agreement and applicable regulations.',
              'Both parties agree to maintain confidentiality of commercially sensitive information.',
              'This contract is generated and managed via the SIRAJ procurement platform.',
            ].map((term, i) => (
              <p key={i} className="flex items-start gap-2 text-xs text-gray-500">
                <span className="mt-1.5 h-1 w-1 rounded-full bg-gray-600 shrink-0" />
                {term}
              </p>
            ))}
          </div>
        </div>
      </div>

      {/* Signature section */}
      <div className="rounded-2xl border border-white/[0.07] bg-[#0d1220] p-6 space-y-4">
        <div>
          <h3 className="text-base font-semibold text-white">Your Signature</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Draw your signature to confirm acceptance of the terms above.
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-red-500/25 bg-red-500/8 px-3 py-2 text-xs text-red-300">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0" />{error}
          </div>
        )}

        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-600">Sign using mouse or touch:</p>
          <button
            onClick={() => { padRef.current?.clear(); setEmpty(true) }}
            disabled={loading || empty}
            className="inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-md text-gray-600 hover:text-gray-400 hover:bg-white/[0.04] transition-all disabled:opacity-30"
          >
            <RotateCcw className="h-2.5 w-2.5" />Clear
          </button>
        </div>

        <div
          className="rounded-xl border-2 border-dashed border-white/[0.12] bg-white overflow-hidden relative"
          style={{ touchAction: 'none' }}
        >
          <SignatureCanvas
            ref={padRef}
            penColor="#111827"
            minWidth={1.5}
            maxWidth={2.5}
            canvasProps={{ style: { width: '100%', height: '180px', display: 'block' } }}
            onBegin={() => { setEmpty(false); setError(null) }}
          />
          {empty && (
            <div className="absolute inset-0 flex items-end justify-center pb-4 pointer-events-none">
              <p className="text-xs text-gray-400/60 italic">Sign here</p>
            </div>
          )}
        </div>

        <button
          onClick={handleSign}
          disabled={empty || loading}
          className="w-full inline-flex items-center justify-center gap-2 text-sm px-4 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold transition-all active:scale-[0.98] shadow-lg shadow-emerald-900/30"
        >
          {loading
            ? <><Loader2 className="h-4 w-4 animate-spin" />Signing contract…</>
            : <><PenTool className="h-4 w-4" />Sign &amp; Accept Contract</>}
        </button>

        <p className="text-[11px] text-gray-700 text-center">
          By signing you confirm acceptance of the contract terms on behalf of {contract.supplier_email}.
        </p>
      </div>
    </PageShell>
  )
}

// ── Layout shell ───────────────────────────────────────────────────────────────

function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#080c14] py-10 px-4">
      <div className="max-w-xl mx-auto space-y-4">
        <div className="flex items-center gap-2 mb-6">
          <div className="p-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <PenTool className="h-4 w-4 text-blue-400" />
          </div>
          <span className="text-sm font-semibold text-white">SIRAJ</span>
          <span className="text-xs text-gray-600">/ Contract Signing</span>
        </div>
        {children}
      </div>
    </div>
  )
}

// ── Detail row ─────────────────────────────────────────────────────────────────

function DetailRow({
  icon: Icon, label, value, sub, highlight,
}: {
  icon: React.ElementType
  label: string
  value: string
  sub?: string
  highlight?: boolean
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="p-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06] shrink-0 mt-0.5">
        <Icon className="h-3.5 w-3.5 text-gray-500" />
      </div>
      <div>
        <p className="text-[11px] font-semibold text-gray-600 uppercase tracking-widest">{label}</p>
        <p className={`text-sm font-semibold mt-0.5 ${highlight ? 'text-emerald-300' : 'text-white'}`}>{value}</p>
        {sub && <p className="text-xs text-gray-500 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}
