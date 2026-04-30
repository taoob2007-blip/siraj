'use client'

import { useState } from 'react'
import { FileSignature, Plus, CheckCircle2, Clock, XCircle, AlertTriangle, Copy, Check } from 'lucide-react'

interface Contract {
  id: string
  rfq_id: string
  supplier_email: string
  status: 'pending' | 'signed' | 'cancelled'
  created_at: string
  notes?: string
}

interface RFQ { id: string; title: string }
interface Props { contracts: Contract[]; rfqs: RFQ[]; tableExists: boolean }

const STATUS_CFG = {
  pending:   { label: 'Pending',   cls: 'bg-yellow-500/15 text-yellow-300 border-yellow-500/30', icon: Clock },
  signed:    { label: 'Signed',    cls: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30', icon: CheckCircle2 },
  cancelled: { label: 'Cancelled', cls: 'bg-red-500/15 text-red-300 border-red-500/30', icon: XCircle },
}

const MIGRATION_SQL = `-- Run this in your Supabase SQL editor
CREATE TABLE IF NOT EXISTS contracts (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rfq_id       UUID REFERENCES rfqs(id) ON DELETE CASCADE,
  supplier_email TEXT NOT NULL,
  status       TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'signed', 'cancelled')),
  notes        TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS contracts_rfq_id_idx ON contracts(rfq_id);
CREATE INDEX IF NOT EXISTS contracts_status_idx ON contracts(status);`

export function ContractsClient({ contracts, rfqs, tableExists }: Props) {
  const [localContracts, setLocalContracts] = useState<Contract[]>(contracts)
  const [updating, setUpdating]             = useState<string | null>(null)
  const [copied, setCopied]                 = useState(false)

  const rfqMap = Object.fromEntries(rfqs.map((r) => [r.id, r.title]))

  async function markSigned(id: string) {
    setUpdating(id)
    try {
      const res = await fetch(`/api/contracts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'signed' }),
      })
      if (res.ok) {
        setLocalContracts((prev) => prev.map((c) => c.id === id ? { ...c, status: 'signed' } : c))
      }
    } finally {
      setUpdating(null)
    }
  }

  async function copySQL() {
    await navigator.clipboard.writeText(MIGRATION_SQL)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const pending   = localContracts.filter((c) => c.status === 'pending').length
  const signed    = localContracts.filter((c) => c.status === 'signed').length
  const cancelled = localContracts.filter((c) => c.status === 'cancelled').length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Contracts</h1>
          <p className="text-xs text-gray-600 mt-0.5">Manage supplier agreements and contract status</p>
        </div>
        <button className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-95 text-white text-sm font-semibold transition-all shadow-lg shadow-blue-600/20 opacity-50 cursor-not-allowed" disabled>
          <Plus className="h-4 w-4" />New Contract
        </button>
      </div>

      {/* Migration notice */}
      {!tableExists && (
        <div className="rounded-2xl border border-orange-500/25 bg-orange-500/5 p-5 space-y-3">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-4 w-4 text-orange-400 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-orange-300">Database table required</p>
              <p className="text-xs text-gray-500 mt-1">
                The <code className="text-orange-300 bg-orange-500/10 px-1 py-0.5 rounded">contracts</code> table doesn't exist yet.
                Run this migration in your Supabase SQL editor:
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
              {copied ? <><Check className="h-3 w-3 text-emerald-400" />Copied</> : <><Copy className="h-3 w-3" />Copy SQL</>}
            </button>
          </div>
        </div>
      )}

      {tableExists && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Pending',   value: pending,   icon: Clock,         cls: 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400' },
              { label: 'Signed',    value: signed,    icon: CheckCircle2,  cls: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' },
              { label: 'Cancelled', value: cancelled, icon: XCircle,       cls: 'bg-red-500/10 border-red-500/20 text-red-400' },
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

          {/* List */}
          {localContracts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
                <FileSignature className="h-8 w-8 text-gray-700" />
              </div>
              <p className="text-sm text-gray-500">No contracts yet.</p>
              <p className="text-xs text-gray-600">Contracts will appear here once created from an RFQ.</p>
            </div>
          ) : (
            <div className="rounded-2xl border border-white/[0.07] bg-[#111827] overflow-hidden divide-y divide-white/[0.05]">
              {localContracts.map((c) => {
                const cfg = STATUS_CFG[c.status] ?? STATUS_CFG.pending
                const StatusIcon = cfg.icon
                return (
                  <div key={c.id} className="flex items-center gap-4 px-5 py-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white truncate">
                        {rfqMap[c.rfq_id] ?? 'Unknown RFQ'}
                      </p>
                      <p className="text-xs text-gray-600 mt-0.5">{c.supplier_email}</p>
                      <p className="text-[11px] text-gray-700 mt-0.5">
                        {new Date(c.created_at).toISOString().split('T')[0]}
                      </p>
                    </div>
                    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${cfg.cls}`}>
                      <StatusIcon className="h-3 w-3" />{cfg.label}
                    </span>
                    {c.status === 'pending' && (
                      <button
                        onClick={() => markSigned(c.id)}
                        disabled={updating === c.id}
                        className="text-xs px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-300 font-medium transition-all disabled:opacity-50"
                      >
                        {updating === c.id ? 'Saving…' : 'Mark Signed'}
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}
    </div>
  )
}
