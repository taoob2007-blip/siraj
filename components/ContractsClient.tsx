'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
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
  supplier_signature?: string | null
  supplier_signed_at?: string | null
  signing_token?: string | null
}

interface RFQ { id: string; title: string }
interface Props { contracts: Contract[]; rfqs: RFQ[]; tableExists: boolean }

// ── Config ─────────────────────────────────────────────────────────────────────

const STATUS_CFG = {
  pending:           { label: 'Pending',            cls: 'bg-yellow-500/15 text-yellow-300 border-yellow-500/30',  icon: Clock        },
  awaiting_supplier: { label: 'Awaiting Supplier',  cls: 'bg-blue-500/15 text-blue-300 border-blue-500/30',       icon: Clock        },
  signed:            { label: 'Signed',             cls: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30', icon: CheckCircle2 },
  fully_executed:    { label: 'Fully Executed',     cls: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30', icon: CheckCircle2 },
  cancelled:         { label: 'Cancelled',          cls: 'bg-red-500/15 text-red-300 border-red-500/30',            icon: XCircle      },
}

function deriveContractStatus(c: Contract) {
  if (c.status === 'cancelled') return STATUS_CFG.cancelled
  if (c.buyer_signature && c.supplier_signature) return STATUS_CFG.fully_executed
  if (c.buyer_signature && !c.supplier_signature) return STATUS_CFG.awaiting_supplier
  if (c.status === 'signed') return STATUS_CFG.signed
  return STATUS_CFG.pending
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
  const t = useTranslations('contracts')
  const tCommon = useTranslations('common')
  const [local, setLocal]         = useState<Contract[]>(contracts)
  const [updating, setUpdating]   = useState<string | null>(null)
  const [updateErr, setUpdateErr] = useState<string | null>(null)
  const [copied, setCopied]       = useState(false)
  const [signingId, setSigningId] = useState<string | null>(null)

  const rfqMap = Object.fromEntries(rfqs.map((r) => [r.id, r.title]))

  function handleSigned(id: string, updated: {
    status: 'signed'; buyer_signature: string; signed_at: string
    signature_method: string; signer_ip?: string; signer_user_agent?: string
  }) {
    setLocal((prev) => prev.map((c) => c.id === id ? { ...c, ...updated } : c))
    setSigningId(null)
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
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-white">{t('title')}</h1>
          <p className="text-xs text-gray-600 mt-0.5">Supplier agreements created from accepted RFQs</p>
        </div>
        <Link
          href="/rfqs"
          className="inline-flex items-center gap-2 px-3 sm:px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-95 text-white text-sm font-semibold transition-all shadow-lg shadow-blue-600/20 shrink-0 min-h-[44px]"
        >
          <Plus className="h-4 w-4" /><span className="hidden sm:inline">{t('newContract')}</span>
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
          <div className="grid grid-cols-3 gap-2 sm:gap-4">
            {[
              { label: t('stats.pending'),   value: pending,   icon: Clock,        cls: 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400' },
              { label: t('stats.signed'),    value: signed,    icon: CheckCircle2, cls: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' },
              { label: t('stats.cancelled'), value: cancelled, icon: XCircle,      cls: 'bg-red-500/10 border-red-500/20 text-red-400' },
            ].map(({ label, value, icon: Icon, cls }) => (
              <div key={label} className="rounded-2xl border border-white/[0.07] bg-[#0d1220] p-3 sm:p-5">
                <div className="flex items-start justify-between mb-2 sm:mb-3">
                  <p className="text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider">{label}</p>
                  <div className={`p-1 sm:p-1.5 rounded-lg border ${cls}`}><Icon className="h-3 w-3 sm:h-3.5 sm:w-3.5" /></div>
                </div>
                <p className="text-xl sm:text-2xl font-bold text-white">{value}</p>
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
                <p className="text-sm text-gray-500">{t('noContracts')}</p>
                <p className="text-xs text-gray-600 mt-1">{t('noContractsDesc')}</p>
              </div>
              <Link
                href="/rfqs"
                className="inline-flex items-center gap-2 text-xs px-4 py-2 rounded-xl border border-blue-500/30 bg-blue-500/8 hover:bg-blue-500/15 text-blue-300 font-medium transition-all"
              >
                {t('viewRfqs')}
              </Link>
            </div>
          ) : (
            /* ── Contract list ─────────────────────────────────────────────── */
            <div className="rounded-2xl border border-white/[0.07] bg-[#0d1220] overflow-hidden divide-y divide-white/[0.05]">
              {local.map((c) => {
                const cfg        = deriveContractStatus(c)
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
                          {tCommon('confirm')}
                        </button>
                        <button
                          onClick={() => cancelContract(c.id)}
                          disabled={isUpdating}
                          className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-red-600/10 hover:bg-red-600/20 border border-red-500/25 text-red-400 font-medium transition-all disabled:opacity-50"
                        >
                          <XCircle className="h-3 w-3" />{tCommon('cancel')}
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
          contractId={signingId}
          contractRef={signingId.split('-')[0].toUpperCase()}
          onDone={(updated) => handleSigned(signingId, updated)}
          onClose={() => setSigningId(null)}
        />
      )}
    </div>
  )
}
