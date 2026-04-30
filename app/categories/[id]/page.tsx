'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, Plus, Trash2, Mail, Loader2, Users, Layers,
  AlertCircle, FileText, X, DollarSign, Clock, Activity,
  Sparkles, TrendingUp, ShieldAlert, Zap, RefreshCw,
} from 'lucide-react'

// ── Types ──────────────────────────────────────────────────────────────────────

interface CategorySupplier {
  id: string
  supplier_email: string
  supplier_name: string | null
  created_at: string
}

interface Category {
  id: string
  name: string
  created_at: string
  category_suppliers: CategorySupplier[]
}

interface Stats {
  avg_price: number | null
  avg_delivery: number | null
  last_response_at: string | null
}

interface AIInsight {
  best_supplier: string | null
  why: string
  risks: string[]
  action: 'accept' | 'negotiate' | 'wait'
  action_reason: string
}

// ── Stat card ──────────────────────────────────────────────────────────────────

function StatCard({
  icon: Icon, label, value, sub,
}: { icon: React.ElementType; label: string; value: string; sub?: string }) {
  return (
    <div className="flex flex-col gap-1.5 rounded-xl border border-white/[0.07] bg-[#111827] px-4 py-3.5">
      <div className="flex items-center gap-1.5 text-gray-600">
        <Icon className="h-3.5 w-3.5" />
        <span className="text-[10px] font-semibold uppercase tracking-widest">{label}</span>
      </div>
      <p className="text-xl font-semibold text-white tabular-nums">{value}</p>
      {sub && <p className="text-[10px] text-gray-600">{sub}</p>}
    </div>
  )
}

// ── Action badge ───────────────────────────────────────────────────────────────

const ACTION_CONFIG = {
  accept:    { label: 'Accept',    cls: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400', dot: 'bg-emerald-400' },
  negotiate: { label: 'Negotiate', cls: 'bg-amber-500/15 border-amber-500/30 text-amber-400',       dot: 'bg-amber-400'   },
  wait:      { label: 'Wait',      cls: 'bg-gray-500/15 border-gray-500/30 text-gray-400',           dot: 'bg-gray-500'    },
}

function ActionBadge({ action }: { action: 'accept' | 'negotiate' | 'wait' }) {
  const cfg = ACTION_CONFIG[action]
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border ${cfg.cls}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  )
}

// ── Best supplier highlight card ───────────────────────────────────────────────

function BestSupplierCard({
  email, suppliers,
}: { email: string; suppliers: CategorySupplier[] }) {
  const match = suppliers.find((s) => s.supplier_email === email)
  const displayName = match?.supplier_name || email.split('@')[0]
  const domain = email.split('@')[1] ?? ''

  return (
    <div className="flex items-center gap-3 min-w-0">
      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-amber-500/30 to-orange-500/30 border border-amber-500/30 flex items-center justify-center text-sm font-bold text-amber-300 shrink-0 uppercase">
        {displayName[0]}
      </div>
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-white truncate">{displayName}</p>
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-amber-500/15 border border-amber-500/25 text-amber-400">
            BEST VALUE
          </span>
        </div>
        <p className="text-[11px] text-gray-500 flex items-center gap-1 mt-0.5">
          <Mail className="h-3 w-3 shrink-0" />
          <span className="truncate">{email.split('@')[0]}<span className="text-gray-600">@{domain}</span></span>
        </p>
      </div>
    </div>
  )
}

// ── AI Insight panel ───────────────────────────────────────────────────────────

function AIInsightPanel({
  insight, suppliers, loading, onRefresh, categoryId,
}: {
  insight: AIInsight | null
  suppliers: CategorySupplier[]
  loading: boolean
  onRefresh: () => void
  categoryId: string
}) {
  const router = useRouter()

  if (loading) {
    return (
      <div className="rounded-2xl border border-violet-500/20 bg-violet-500/5 px-5 py-6 flex items-center gap-3">
        <Loader2 className="h-4 w-4 text-violet-400 animate-spin shrink-0" />
        <div>
          <p className="text-sm font-medium text-violet-300">Analyzing suppliers…</p>
          <p className="text-xs text-gray-600 mt-0.5">Comparing price, delivery, and quality signals</p>
        </div>
      </div>
    )
  }

  if (!insight) return null

  const hasData = insight.best_supplier !== null

  return (
    <div className="rounded-2xl border border-violet-500/20 bg-gradient-to-br from-violet-500/[0.06] to-blue-500/[0.04] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-violet-400" />
          <span className="text-sm font-semibold text-violet-300">AI Insight</span>
        </div>
        <button
          onClick={onRefresh}
          className="p-1.5 rounded-lg text-gray-600 hover:text-gray-300 hover:bg-white/[0.05] transition-all"
          title="Refresh analysis"
        >
          <RefreshCw className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="px-5 py-4 space-y-4">
        {/* Best supplier + action */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          {hasData ? (
            <BestSupplierCard email={insight.best_supplier!} suppliers={suppliers} />
          ) : (
            <div className="flex items-center gap-2 text-gray-500">
              <Users className="h-4 w-4 shrink-0" />
              <span className="text-sm">No response data yet</span>
            </div>
          )}
          <ActionBadge action={insight.action} />
        </div>

        {/* Why */}
        <p className="text-xs text-gray-300 leading-relaxed">{insight.why}</p>

        {/* Risks */}
        {insight.risks.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {insight.risks.map((risk, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full border border-red-500/20 bg-red-500/8 text-red-400"
              >
                <ShieldAlert className="h-3 w-3 shrink-0" />
                {risk}
              </span>
            ))}
          </div>
        )}

        {/* Action reason */}
        <p className="text-[11px] text-gray-500 leading-relaxed">{insight.action_reason}</p>

        {/* Quick actions */}
        {hasData && (
          <div className="flex flex-wrap gap-2 pt-1">
            <button
              onClick={() => {
                const p = new URLSearchParams({ category_id: categoryId })
                router.push(`/rfqs/new?${p}`)
              }}
              className="inline-flex items-center gap-1.5 text-[11px] px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-all"
            >
              <FileText className="h-3 w-3" />
              Create RFQ
            </button>
            {insight.action === 'negotiate' && (
              <button
                onClick={() => router.push(`/suppliers/${encodeURIComponent(insight.best_supplier!)}`)}
                className="inline-flex items-center gap-1.5 text-[11px] px-3 py-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-400 hover:bg-amber-500/15 font-semibold transition-all"
              >
                <Zap className="h-3 w-3" />
                Negotiate
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────────

export default function CategoryDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router  = useRouter()

  const [category, setCategory]   = useState<Category | null>(null)
  const [stats, setStats]         = useState<Stats | null>(null)
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState<string | null>(null)

  const [insight, setInsight]         = useState<AIInsight | null>(null)
  const [insightLoading, setInsightLoading] = useState(false)

  // Add supplier form state
  const [showAdd, setShowAdd]     = useState(false)
  const [addEmail, setAddEmail]   = useState('')
  const [addName, setAddName]     = useState('')
  const [adding, setAdding]       = useState(false)
  const [addError, setAddError]   = useState<string | null>(null)

  // Remove state
  const [removingEmail, setRemovingEmail] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/categories/${id}`)
      if (!res.ok) throw new Error('Category not found')
      const json = await res.json()
      setCategory(json.category)
      setStats(json.stats ?? null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }, [id])

  const analyze = useCallback(async () => {
    setInsightLoading(true)
    setInsight(null)
    try {
      const res = await fetch(`/api/categories/${id}/analyze`, { method: 'POST' })
      const json = await res.json()
      setInsight(json)
    } catch {
      // silently skip — insight panel just won't show
    } finally {
      setInsightLoading(false)
    }
  }, [id])

  useEffect(() => { load() }, [load])
  useEffect(() => { if (!loading && category) analyze() }, [loading, category, analyze])

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    const email = addEmail.trim().toLowerCase()
    if (!email) return
    if (category?.category_suppliers.some((s) => s.supplier_email === email)) {
      setAddError('Supplier already in this category')
      return
    }
    setAdding(true)
    setAddError(null)
    try {
      const res = await fetch(`/api/categories/${id}/suppliers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ supplier_email: email, supplier_name: addName.trim() || undefined }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      setCategory((prev) =>
        prev ? { ...prev, category_suppliers: [...prev.category_suppliers, json.supplier] } : prev
      )
      setAddEmail('')
      setAddName('')
      setShowAdd(false)
    } catch (err) {
      setAddError(err instanceof Error ? err.message : 'Failed to add supplier')
    } finally {
      setAdding(false)
    }
  }

  async function handleRemove(supplierEmail: string) {
    setRemovingEmail(supplierEmail)
    try {
      const res = await fetch(`/api/categories/${id}/suppliers`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ supplier_email: supplierEmail }),
      })
      if (!res.ok) throw new Error()
      setCategory((prev) =>
        prev
          ? { ...prev, category_suppliers: prev.category_suppliers.filter((s) => s.supplier_email !== supplierEmail) }
          : prev
      )
    } catch {
      setError('Failed to remove supplier')
    } finally {
      setRemovingEmail(null)
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="h-6 w-6 text-gray-600 animate-spin" />
      </div>
    )
  }

  if (error || !category) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <AlertCircle className="h-8 w-8 text-red-500" />
        <p className="text-sm text-gray-400">{error ?? 'Category not found'}</p>
        <Link href="/categories" className="text-xs text-blue-400 hover:underline">← Back to Categories</Link>
      </div>
    )
  }

  const suppliers = category.category_suppliers

  return (
    <div className="space-y-6">

      {/* Back nav */}
      <Link
        href="/categories"
        className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-200 transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        All Categories
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-violet-600/25 to-blue-600/25 border border-violet-500/20 flex items-center justify-center shrink-0">
            <Layers className="h-5 w-5 text-violet-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">{category.name}</h1>
            <p className="text-xs text-gray-600 mt-0.5">
              {suppliers.length} supplier{suppliers.length !== 1 ? 's' : ''} · created{' '}
              {new Date(category.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {suppliers.length > 0 && (
            <button
              onClick={() => {
                const p = new URLSearchParams({ category_id: id, category_name: category.name })
                router.push(`/rfqs/new?${p}`)
              }}
              className="inline-flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-semibold transition-all shadow-lg shadow-blue-600/20"
            >
              <FileText className="h-3.5 w-3.5" />
              Create RFQ
            </button>
          )}
          <button
            onClick={() => { setShowAdd(true); setAddError(null) }}
            className="inline-flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.06] text-gray-300 font-medium transition-all"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Supplier
          </button>
        </div>
      </div>

      {/* ── AI Insight ── */}
      <AIInsightPanel
        insight={insight}
        suppliers={suppliers}
        loading={insightLoading}
        onRefresh={analyze}
        categoryId={id}
      />

      {/* ── Stats row ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard
          icon={Users}
          label="Suppliers"
          value={String(suppliers.length)}
          sub="in this group"
        />
        <StatCard
          icon={DollarSign}
          label="Avg Price"
          value={stats?.avg_price != null ? `$${stats.avg_price.toLocaleString('en-US')}` : '—'}
          sub="across responses"
        />
        <StatCard
          icon={Clock}
          label="Avg Delivery"
          value={stats?.avg_delivery != null ? `${stats.avg_delivery} days` : '—'}
          sub="across responses"
        />
        <StatCard
          icon={Activity}
          label="Last Activity"
          value={
            stats?.last_response_at
              ? new Date(stats.last_response_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
              : '—'
          }
          sub="last response received"
        />
      </div>

      {/* Global error */}
      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-red-500/20 bg-red-500/8 px-4 py-3">
          <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />
          <p className="text-sm text-red-300">{error}</p>
        </div>
      )}

      {/* Add supplier form */}
      {showAdd && (
        <form
          onSubmit={handleAdd}
          className="space-y-3 p-4 rounded-2xl border border-blue-500/20 bg-blue-500/5"
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-blue-300">Add supplier to this category</p>
            <button
              type="button"
              onClick={() => { setShowAdd(false); setAddEmail(''); setAddName(''); setAddError(null) }}
              className="text-gray-600 hover:text-gray-400 transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          {addError && (
            <p className="text-xs text-red-400 flex items-center gap-1.5">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />{addError}
            </p>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <input
              autoFocus
              type="email"
              value={addEmail}
              onChange={(e) => { setAddEmail(e.target.value); setAddError(null) }}
              placeholder="supplier@company.com *"
              className="w-full rounded-xl border border-white/[0.08] bg-[#0d1220] px-4 py-2.5 text-sm text-white placeholder:text-gray-600 outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all"
            />
            <input
              type="text"
              value={addName}
              onChange={(e) => setAddName(e.target.value)}
              placeholder="Display name (optional)"
              className="w-full rounded-xl border border-white/[0.08] bg-[#0d1220] px-4 py-2.5 text-sm text-white placeholder:text-gray-600 outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all"
            />
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={adding || !addEmail.trim()}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-sm text-white font-semibold disabled:opacity-40 transition-all"
            >
              {adding ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
              {adding ? 'Adding…' : 'Add Supplier'}
            </button>
            <button
              type="button"
              onClick={() => { setShowAdd(false); setAddEmail(''); setAddName(''); setAddError(null) }}
              className="px-4 py-2 rounded-xl border border-white/[0.08] text-sm text-gray-400 hover:text-gray-200 transition-all"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* ── Suppliers list ── */}
      {suppliers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-center rounded-2xl border border-white/[0.06] bg-white/[0.01]">
          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.05]">
            <Users className="h-7 w-7 text-gray-700" />
          </div>
          <div>
            <p className="text-sm text-gray-400 font-medium">No suppliers yet</p>
            <p className="text-xs text-gray-600 mt-1">Add suppliers to use this category when creating RFQs.</p>
          </div>
          <button
            onClick={() => setShowAdd(true)}
            className="inline-flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl border border-white/[0.08] bg-white/[0.03] text-gray-300 hover:text-white transition-all"
          >
            <Plus className="h-3.5 w-3.5" />
            Add First Supplier
          </button>
        </div>
      ) : (
        <div className="rounded-2xl border border-white/[0.07] bg-[#111827] overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.06]">
            <span className="text-[10px] font-semibold text-gray-600 uppercase tracking-wider">Suppliers</span>
            <span className="text-[10px] text-gray-600">{suppliers.length} member{suppliers.length !== 1 ? 's' : ''}</span>
          </div>

          {suppliers.map((s, i) => {
            const displayName = s.supplier_name || s.supplier_email.split('@')[0]
            const [, domain]  = s.supplier_email.split('@')
            const isBest = insight?.best_supplier === s.supplier_email
            return (
              <div
                key={s.id}
                className={`group grid grid-cols-[1fr_36px] gap-4 px-5 py-3.5 items-center transition-colors ${
                  i !== 0 ? 'border-t border-white/[0.05]' : ''
                } ${isBest ? 'bg-amber-500/[0.04] hover:bg-amber-500/[0.07]' : 'hover:bg-white/[0.02]'}`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`h-8 w-8 rounded-full border flex items-center justify-center text-xs font-bold shrink-0 uppercase ${
                    isBest
                      ? 'bg-gradient-to-br from-amber-500/30 to-orange-500/30 border-amber-500/30 text-amber-300'
                      : 'bg-gradient-to-br from-blue-600/25 to-violet-600/25 border-blue-500/20 text-blue-300'
                  }`}>
                    {displayName[0]}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-white truncate">{displayName}</p>
                      {isBest && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-amber-500/15 border border-amber-500/25 text-amber-400 shrink-0">
                          BEST
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-gray-600 flex items-center gap-1 mt-0.5">
                      <Mail className="h-3 w-3 shrink-0" />
                      <span className="truncate">{s.supplier_email}</span>
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => handleRemove(s.supplier_email)}
                  disabled={removingEmail === s.supplier_email}
                  className="p-1.5 rounded-lg text-gray-700 hover:text-red-400 hover:bg-red-500/10 transition-all disabled:opacity-40"
                >
                  {removingEmail === s.supplier_email
                    ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    : <Trash2 className="h-3.5 w-3.5" />}
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
