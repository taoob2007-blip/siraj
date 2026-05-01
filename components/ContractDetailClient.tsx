'use client'

import { useState, useCallback } from 'react'
import {
  CheckCircle2, XCircle, Clock, DollarSign, Truck,
  Calendar, Mail, FileText, Printer, AlertTriangle, Loader2,
  ExternalLink,
} from 'lucide-react'
import Link from 'next/link'

// ── Types ──────────────────────────────────────────────────────────────────────

interface Contract {
  id: string
  rfq_id: string
  supplier_email: string
  price: number | null
  delivery_days: number | null
  status: 'pending' | 'signed' | 'cancelled'
  notes: string | null
  created_at: string
}

interface RFQ {
  id: string
  title: string
  description: string | null
}

interface Props { contract: Contract; rfq: RFQ }

// ── Status config ──────────────────────────────────────────────────────────────

const STATUS = {
  pending:   { label: 'Pending Signature', cls: 'bg-yellow-500/15 text-yellow-300 border-yellow-500/30',  icon: Clock        },
  signed:    { label: 'Signed',            cls: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30', icon: CheckCircle2 },
  cancelled: { label: 'Cancelled',         cls: 'bg-red-500/15 text-red-300 border-red-500/30',            icon: XCircle      },
}

// ── Component ──────────────────────────────────────────────────────────────────

export function ContractDetailClient({ contract: initial, rfq }: Props) {
  const [contract, setContract] = useState(initial)
  const [updating, setUpdating] = useState(false)
  const [error, setError]       = useState<string | null>(null)

  const cfg        = STATUS[contract.status]
  const StatusIcon = cfg.icon

  const updateStatus = useCallback(async (status: 'signed' | 'cancelled') => {
    setUpdating(true)
    setError(null)
    try {
      const res = await fetch(`/api/contracts/${contract.id}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ status }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || `Error ${res.status}`)
      }
      setContract((prev) => ({ ...prev, status }))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update')
    } finally {
      setUpdating(false)
    }
  }, [contract.id])

  function handlePrint() {
    window.print()
  }

  const createdDate = new Date(contract.created_at).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  })

  return (
    <>
      {/* ── Print styles injected via a style tag ────────────────────────────── */}
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #contract-printable, #contract-printable * { visibility: visible !important; }
          #contract-printable { position: fixed !important; top: 0; left: 0; width: 100%; padding: 40px !important; background: #fff !important; color: #000 !important; }
          .no-print { display: none !important; }
          * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>

      {/* ── Error banner ─────────────────────────────────────────────────────── */}
      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-red-500/25 bg-red-500/8 px-4 py-3 text-sm text-red-300">
          <AlertTriangle className="h-4 w-4 shrink-0" />{error}
        </div>
      )}

      {/* ── Status + Actions bar ─────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 no-print">
        <span className={`inline-flex items-center gap-1.5 text-sm font-semibold px-3 py-1.5 rounded-full border ${cfg.cls}`}>
          <StatusIcon className="h-3.5 w-3.5" />{cfg.label}
        </span>

        <div className="flex items-center gap-2">
          {contract.status === 'pending' && (
            <>
              <button
                onClick={() => updateStatus('signed')}
                disabled={updating}
                className="inline-flex items-center gap-1.5 text-sm px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition-all disabled:opacity-50 shadow-lg shadow-emerald-900/30"
              >
                {updating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                Sign Contract
              </button>
              <button
                onClick={() => updateStatus('cancelled')}
                disabled={updating}
                className="inline-flex items-center gap-1.5 text-sm px-4 py-2 rounded-xl border border-red-500/30 bg-red-500/8 hover:bg-red-500/15 text-red-300 font-medium transition-all disabled:opacity-50"
              >
                <XCircle className="h-3.5 w-3.5" />Cancel
              </button>
            </>
          )}
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 text-sm px-4 py-2 rounded-xl border border-white/[0.10] bg-white/[0.04] hover:bg-white/[0.08] text-gray-300 font-medium transition-all"
          >
            <Printer className="h-3.5 w-3.5" />Download PDF
          </button>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          CONTRACT DOCUMENT (printable)
          ══════════════════════════════════════════════════════════════════ */}
      <div
        id="contract-printable"
        className="rounded-2xl border border-white/[0.07] bg-[#111827] overflow-hidden"
      >
        {/* Document header */}
        <div className="px-8 py-7 border-b border-white/[0.06] bg-gradient-to-r from-blue-950/40 to-indigo-950/30">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-bold text-blue-400 uppercase tracking-[0.15em] mb-1.5">
                SIRAJ — AI Procurement Platform
              </p>
              <h2 className="text-2xl font-bold text-white">Supplier Agreement</h2>
              <p className="text-sm text-gray-500 mt-1">
                Contract No. <span className="font-mono text-gray-400">{contract.id.split('-')[0].toUpperCase()}</span>
              </p>
            </div>
            <div className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full border ${cfg.cls}`}>
              <StatusIcon className="h-3 w-3" />{cfg.label.toUpperCase()}
            </div>
          </div>
        </div>

        {/* Fields grid */}
        <div className="p-8 grid grid-cols-1 sm:grid-cols-2 gap-6">

          {/* RFQ */}
          <div className="sm:col-span-2">
            <Field
              icon={FileText}
              label="Request for Quotation"
              value={rfq.title}
              sub={rfq.description ?? undefined}
              href={`/rfqs/${rfq.id}`}
            />
          </div>

          {/* Supplier */}
          <Field icon={Mail} label="Supplier" value={contract.supplier_email} />

          {/* Date */}
          <Field icon={Calendar} label="Contract Date" value={createdDate} />

          {/* Price */}
          <Field
            icon={DollarSign}
            label="Agreed Price"
            value={contract.price != null ? `$${Number(contract.price).toLocaleString('en-US')}` : '—'}
            highlight={contract.price != null}
          />

          {/* Delivery */}
          <Field
            icon={Truck}
            label="Delivery Timeline"
            value={contract.delivery_days != null ? `${contract.delivery_days} days` : '—'}
            highlight={contract.delivery_days != null}
          />

        </div>

        {/* Terms section */}
        <div className="px-8 pb-8">
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 space-y-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Standard Terms</p>
            <ul className="space-y-2">
              {[
                'The supplier agrees to deliver the goods/services as specified in the RFQ.',
                'Payment terms are subject to mutual agreement and applicable regulations.',
                'Both parties agree to maintain confidentiality of commercially sensitive information.',
                'Disputes shall be resolved through good-faith negotiation before arbitration.',
                'This contract is generated and managed via the SIRAJ procurement platform.',
              ].map((term, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-400">
                  <span className="mt-2 h-1 w-1 rounded-full bg-gray-600 shrink-0" />
                  {term}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Signature section */}
        <div className="px-8 pb-8 grid grid-cols-1 sm:grid-cols-2 gap-6">
          <SignatureBlock label="Buyer Signature" />
          <SignatureBlock label="Supplier Signature" />
        </div>

        {/* Footer */}
        <div className="px-8 py-4 border-t border-white/[0.05] flex items-center justify-between">
          <p className="text-[11px] text-gray-700">Generated by SIRAJ · usesiraj.com</p>
          <p className="text-[11px] text-gray-700">{createdDate}</p>
        </div>
      </div>

      {/* ── View RFQ link ─────────────────────────────────────────────────────── */}
      <div className="flex justify-end no-print">
        <Link
          href={`/rfqs/${rfq.id}`}
          className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-300 transition-colors"
        >
          <ExternalLink className="h-3.5 w-3.5" />View original RFQ
        </Link>
      </div>
    </>
  )
}

// ── Field subcomponent ─────────────────────────────────────────────────────────

function Field({
  icon: Icon, label, value, sub, href, highlight,
}: {
  icon: React.ElementType
  label: string
  value: string
  sub?: string
  href?: string
  highlight?: boolean
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="p-2 rounded-lg bg-white/[0.04] border border-white/[0.06] shrink-0 mt-0.5">
        <Icon className="h-3.5 w-3.5 text-gray-500" />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold text-gray-600 uppercase tracking-widest">{label}</p>
        {href ? (
          <Link href={href} className="text-base font-semibold text-blue-400 hover:text-blue-300 transition-colors leading-tight mt-0.5 block">
            {value}
          </Link>
        ) : (
          <p className={`text-base font-semibold leading-tight mt-0.5 ${highlight ? 'text-emerald-300' : 'text-white'}`}>
            {value}
          </p>
        )}
        {sub && <p className="text-sm text-gray-500 mt-0.5 leading-relaxed">{sub}</p>}
      </div>
    </div>
  )
}

// ── Signature block ────────────────────────────────────────────────────────────

function SignatureBlock({ label }: { label: string }) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
      <p className="text-[11px] font-semibold text-gray-600 uppercase tracking-widest mb-8">{label}</p>
      <div className="border-t border-white/[0.08] pt-3">
        <p className="text-[11px] text-gray-700">Signature · Date</p>
      </div>
    </div>
  )
}
