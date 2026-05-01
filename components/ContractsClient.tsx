'use client'

import { useState } from 'react'
import {
  FileSignature, Plus, CheckCircle2, Clock, XCircle,
  AlertTriangle, Copy, Check, DollarSign, Truck, Loader2, PenTool,
} from 'lucide-react'
import Link from 'next/link'
import { SignatureModal } from '@/components/SignatureModal'

// ── Types ──────────────────────────────────────────────────────────────────────

interface Contract {
  id: string
  rfq_id: string
  user_id: string
  supplier_email: string
  price: number | null
  delivery_days: number | null
  status: 'pending' | 'signed' | 'cancelled'
  created_at: string
  notes?: string | null
  buyer_signature?: string | null
  signed_at?: string | null
}

interface RFQ { id: string; title: string }
interface Props { contracts: Contract[]; rfqs: RFQ[]; tableExists: boolean }

// ── Config ─────────────────────────────────────────────────────────────────────

const STATUS_CFG = {
  pending:   { label: 'Pending',   cls: 'bg-yellow-500/15 text-yellow-300 border-yellow-500/30',  icon: Clock        },
  signed:    { label: 'Signed',    cls: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30', icon: CheckCircle2 },
  cancelled: { label: 'Cancelled', cls: 'bg-red-500/15 text-red-300 border-red-500/30',            icon: XCircle      },
}

const MIGRATION_SQL = `-- Run once in your Supabase SQL Editor
CREATE TABLE IF NOT EXISTS contracts (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rfq_id         UUID REFERENCES rfqs(id) ON DELETE CASCADE,
  user_id        UUID NOT NULL,
  supplier_email TEXT NOT NULL,
  price          NUMERIC,
  delivery_days  INTEGER,
  status         TEXT NOT NULL DEFAULT 'pending'
                   CHECK (status IN ('pending', 'signed', 'cancelled')),
  notes          TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users own contracts"
  ON contracts FOR ALL
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS contracts_rfq_id_idx  ON contracts(rfq_id);
CREATE INDEX IF NOT EXISTS contracts_user_id_idx ON contracts(user_id);`

// ── Component ──────────────────────────────────────────────────────────────────

export function ContractsClient({ contracts, rfqs, tableExists }: Props) {
  const [local, setLocal]         = useState<Contract[]>(contracts)
  const [updating, setUpdating]   = useState<string | null>(null)
  const [updateErr, setUpdateErr] = useState<string | null>(null)
  const [copied, setCopied]       = useState(false)
  const [signingId, setSigningId] = useState<string | null>(null)

  const rfqMap = Object.fromEntries(rfqs.map((r) => [r.id, r.title]))

  async function signContract(id: string, signature: string) {
    setUpdating(id)
    setUpdateErr(null)
    try {
      const res = await fetch(`/api/contracts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'signed', signature }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || `Server error ${res.status}`)
      }
      const updated = await res.json()
      setLocal((prev) => prev.map((c) => c.id === id
        ? { ...c, status: 'signed', buyer_signature: updated.buyer_signature ?? signature, signed_at: updated.signed_at ?? new Date().toISOString() }
        : c
      ))
      setSigningId(null)
    } catch (e) {
      setUpdateErr(e instanceof Error ? e.message : 'Failed to sign')
    } finally {
      setUpdating(null)
    }
  }

  async function cancelContract(id: string) {
    setUpdating(id)
    setUpdateErr(null)
    try {
      const res = await fetch(`/api/contracts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'cancelled' }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || `Server error ${res.status}`)
      }
      setLocal((prev) => prev.map((c) => c.id === id ? { ...c, status: 'cancelled' } : c))
    } catch (e) {
      setUpdateErr(e instanceof Error ? e.message : 'Failed to cancel')
    } finally {
      setUpdating(null)
    }
  }

  async function copySQL() {
    await navigator.clipboard.writeText(MIGRATION_SQL)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const pending   = local.filter((c) => c.status === 'pending').length
  const signed    = local.filter((c) => c.status === 'signed').length
  const cancelled = local.filter((c) => c.status === 'cancelled').length

  return (
    <div className="space-y-6">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Contracts</h1>
          <p className="text-xs text-gray-600 mt-0.5">Supplier agreements created from accepted RFQs</p>
        </div>
        <Link
          href="/rfqs"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-95 text-white text-sm font-semibold transition-all shadow-lg shadow-blue-600/20"
        >
          <Plus className="h-4 w-4" />New Contract
        </Link>
      </div>

      {/* ── Migration notice ────────────────────────────────────────────────── */}
      {!tableExists && (
        <div className="rounded-2xl border border-orange-500/25 bg-orange-500/5 p-5 space-y-3">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-4 w-4 text-orange-400 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-orange-300">Database migration required</p>
              <p className="text-xs text-gray-500 mt-1">
                The <code className="text-orange-300 bg-orange-500/10 px-1 py-0.5 rounded">contracts</code> table
                doesn't exist yet. Run this SQL in your Supabase SQL editor to enable contracts:
              </p>
            </div>
          </div>
          <div className="relative">
            <pre className="text-[11px] text-gray-400 bg-[#080c14] border border-white/[0.06] rounded-xl p-4 overflow-x-auto leading-relaxed">
              {MIGRATION_SQL}
            </pre>
            <button
              onClick={copySQL}
              className="absolute top-3 right-3 inline-flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg bg-white/[0.06] border border-white/[0.10] text-gray-400 hover:text-white transition-colors"
            >
              {copied
                ? <><Check className="h-3 w-3 text-emerald-400" />Copied</>
                : <><Copy className="h-3 w-3" />Copy SQL</>}
            </button>
          </div>
        </div>
      )}

      {tableExists && (
        <>
          {/* ── Stats ────────────────────────────────────────────────────────── */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Pending',   value: pending,   icon: Clock,        cls: 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400' },
              { label: 'Signed',    value: signed,    icon: CheckCircle2, cls: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' },
              { label: 'Cancelled', value: cancelled, icon: XCircle,      cls: 'bg-red-500/10 border-red-500/20 text-red-400' },
            ].map(({ label, value, icon: Icon, cls }) => (
              <div key={label} className="rounded-2xl border border-white/[0.07] bg-[#111827] p-5">
                <div className="flex items-start justify-between mb-3">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{label}</p>
                  <div className={`p-1.5 rounded-lg border ${cls}`}><Icon className="h-3.5 w-3.5" /></div>
                </div>
                <p className="text-2xl font-bold text-white">{value}</p>
              </div>
            ))}
          </div>

          {/* ── Error banner ─────────────────────────────────────────────────── */}
          {updateErr && (
            <div className="flex items-center gap-2 rounded-xl border border-red-500/25 bg-red-500/8 px-4 py-3 text-sm text-red-300">
              <AlertTriangle className="h-4 w-4 shrink-0" />{updateErr}
            </div>
          )}

          {/* ── Empty state ───────────────────────────────────────────────────── */}
          {local.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
                <FileSignature className="h-8 w-8 text-gray-700" />
              </div>
              <div>
                <p className="text-sm text-gray-500">No contracts yet</p>
                <p className="text-xs text-gray-600 mt-1">
                  Contracts are created automatically when you accept a supplier on an RFQ.
                </p>
              </div>
              <Link
                href="/rfqs"
                className="inline-flex items-center gap-2 text-xs px-4 py-2 rounded-xl border border-blue-500/30 bg-blue-500/8 hover:bg-blue-500/15 text-blue-300 font-medium transition-all"
              >
                Go to RFQs
              </Link>
            </div>
          ) : (
            /* ── Contract list ─────────────────────────────────────────────── */
            <div className="rounded-2xl border border-white/[0.07] bg-[#111827] overflow-hidden divide-y divide-white/[0.05]">
              {local.map((c) => {
                const cfg        = STATUS_CFG[c.status] ?? STATUS_CFG.pending
                const StatusIcon = cfg.icon
                const isUpdating = updating === c.id

                return (
                  <div key={c.id} className="px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-3">

                    {/* ── Info ─────────────────────────────────────────────── */}
                    <div className="flex-1 min-w-0 space-y-1">
                      <Link href={`/contracts/${c.id}`} className="text-sm font-semibold text-white hover:text-blue-300 transition-colors truncate block">
                        {rfqMap[c.rfq_id] ?? 'Unknown RFQ'}
                      </Link>
                      <p className="text-xs text-gray-400">{c.supplier_email}</p>

                      {/* Price + Delivery pills */}
                      <div className="flex flex-wrap gap-2 pt-0.5">
                        {c.price !== null && c.price !== undefined && (
                          <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300">
                            <DollarSign className="h-2.5 w-2.5" />
                            {Number(c.price).toLocaleString('en-US')}
                          </span>
                        )}
                        {c.delivery_days !== null && c.delivery_days !== undefined && (
                          <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-300">
                            <Truck className="h-2.5 w-2.5" />
                            {c.delivery_days} days
                          </span>
                        )}
                        <span className="text-[11px] text-gray-700">
                          {new Date(c.created_at).toISOString().split('T')[0]}
                        </span>
                      </div>
                    </div>

                    {/* ── Status badge ─────────────────────────────────────── */}
                    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border shrink-0 ${cfg.cls}`}>
                      <StatusIcon className="h-3 w-3" />{cfg.label}
                    </span>

                    {/* ── Actions ──────────────────────────────────────────── */}
                    {c.status === 'pending' && (
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => setSigningId(c.id)}
                          disabled={isUpdating}
                          className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-300 font-medium transition-all disabled:opacity-50"
                        >
                          {isUpdating
                            ? <Loader2 className="h-3 w-3 animate-spin" />
                            : <PenTool className="h-3 w-3" />
                          }
                          Sign
                        </button>
                        <button
                          onClick={() => cancelContract(c.id)}
                          disabled={isUpdating}
                          className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-red-600/10 hover:bg-red-600/20 border border-red-500/25 text-red-400 font-medium transition-all disabled:opacity-50"
                        >
                          <XCircle className="h-3 w-3" />Cancel
                        </button>
                      </div>
                    )}
                    {/* Signed label with date */}
                    {c.status === 'signed' && c.signed_at && (
                      <span className="text-[11px] text-emerald-400/60 shrink-0">
                        Signed {new Date(c.signed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}

      {/* Signature modal */}
      {signingId && (
        <SignatureModal
          contractRef={signingId.split('-')[0].toUpperCase()}
          onConfirm={(sig) => signContract(signingId, sig)}
          onClose={() => !updating && setSigningId(null)}
          loading={updating === signingId}
        />
      )}
    </div>
  )
}
