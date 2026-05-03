'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { useRouter } from 'next/navigation'
import { SupplierSelector } from './SupplierSelector'
import { InviteLinks } from './InviteLinks'
import { FieldBuilder } from './FieldBuilder'
import { FileAnalysisPanel } from './FileAnalysisPanel'
import { Supplier, RFQFormData, CreateRFQResponse, DEFAULT_RFQ_FIELDS, Attachment } from '@/lib/types'
import { savePendingRFQ, buildTempRFQ, saveDraft, loadDraft, clearDraft } from '@/lib/rfqStore'
import {
  AlertCircle, Loader2, FileText, AlignLeft, Sliders, Users,
  CheckCircle2, ArrowLeft, Send, Cloud, CloudOff, Dot,
  Layers, ChevronDown, X, Paperclip,
} from 'lucide-react'
import Link from 'next/link'

// ── Category picker ───────────────────────────────────────────────────────────

interface Category {
  id: string
  name: string
  supplier_count: number
}

interface CategorySupplier {
  supplier_email: string
}

function CategoryPicker({
  onImport,
  disabled,
}: {
  onImport: (suppliers: Supplier[]) => void
  disabled?: boolean
}) {
  const [open, setOpen]           = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading]     = useState(false)
  const [importing, setImporting] = useState<string | null>(null)

  async function loadCategories() {
    setLoading(true)
    try {
      const res = await fetch('/api/categories')
      const json = await res.json()
      setCategories(json.categories ?? [])
    } finally {
      setLoading(false)
    }
  }

  async function handleSelect(cat: Category) {
    setImporting(cat.id)
    try {
      const res = await fetch(`/api/categories/${cat.id}`)
      const { category } = await res.json()
      const suppliers: Supplier[] = (category.category_suppliers ?? []).map(
        (s: CategorySupplier) => ({
          name:  s.supplier_email.split('@')[0],
          email: s.supplier_email,
        })
      )
      onImport(suppliers)
      setOpen(false)
    } finally {
      setImporting(null)
    }
  }

  function toggle() {
    if (!open) loadCategories()
    setOpen((v) => !v)
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={toggle}
        disabled={disabled}
        className="inline-flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl border border-violet-500/25 bg-violet-500/8 hover:bg-violet-500/15 text-violet-300 font-medium transition-all disabled:opacity-40"
      >
        <Layers className="h-3.5 w-3.5" />
        Import from Category
        <ChevronDown className={`h-3 w-3 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-2 z-50 w-72 rounded-2xl border border-white/[0.10] bg-[#111827] shadow-2xl shadow-black/60 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
            <span className="text-xs font-semibold text-gray-300">Select a Category</span>
            <button onClick={() => setOpen(false)} className="text-gray-600 hover:text-gray-400">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-4 w-4 text-gray-600 animate-spin" />
            </div>
          ) : categories.length === 0 ? (
            <div className="px-4 py-6 text-center">
              <p className="text-xs text-gray-600">No categories yet.</p>
              <Link href="/categories" className="text-xs text-blue-400 hover:underline mt-1 block">
                Create one →
              </Link>
            </div>
          ) : (
            <div className="max-h-60 overflow-y-auto divide-y divide-white/[0.04]">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => handleSelect(cat)}
                  disabled={importing === cat.id || cat.supplier_count === 0}
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/[0.04] transition-colors disabled:opacity-40 text-left"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="h-7 w-7 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center shrink-0">
                      <Layers className="h-3.5 w-3.5 text-violet-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-white truncate">{cat.name}</p>
                      <p className="text-[10px] text-gray-600">{cat.supplier_count} supplier{cat.supplier_count !== 1 ? 's' : ''}</p>
                    </div>
                  </div>
                  {importing === cat.id
                    ? <Loader2 className="h-3.5 w-3.5 text-violet-400 animate-spin shrink-0" />
                    : <span className="text-[10px] text-violet-400 font-medium shrink-0">Import</span>}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Save status indicator ─────────────────────────────────────────────────────

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

function SaveStatusBadge({ status }: { status: SaveStatus }) {
  if (status === 'idle') return null

  const cfg = {
    saving: { icon: <Loader2 className="h-3 w-3 animate-spin" />, text: 'Saving draft…',  cls: 'text-gray-500' },
    saved:  { icon: <Cloud   className="h-3 w-3" />,              text: 'Draft saved',    cls: 'text-emerald-500' },
    error:  { icon: <CloudOff className="h-3 w-3" />,             text: 'Draft not saved', cls: 'text-red-400' },
  }[status]

  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium transition-all ${cfg.cls}`}>
      {cfg.icon}
      {cfg.text}
    </span>
  )
}

// ── Section card ──────────────────────────────────────────────────────────────

function SectionCard({
  icon: Icon, title, description, children,
}: {
  icon: React.ElementType; title: string; description: string; children: React.ReactNode
}) {
  return (
    <div className="rounded-2xl border border-white/[0.07] bg-[#111827] overflow-hidden">
      <div className="flex items-start gap-3 border-b border-white/[0.05] px-6 py-4">
        <div className="p-1.5 rounded-lg bg-blue-500/10 border border-blue-500/15 shrink-0">
          <Icon className="h-4 w-4 text-blue-400" />
        </div>
        <div>
          <p className="text-sm font-semibold text-white">{title}</p>
          <p className="text-xs text-gray-500 mt-0.5">{description}</p>
        </div>
      </div>
      <div className="px-6 py-5">{children}</div>
    </div>
  )
}

const inputCls =
  'w-full rounded-xl border border-white/[0.08] bg-[#0d1220] px-4 py-2.5 text-sm text-white placeholder:text-gray-600 outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all disabled:opacity-50'

// ── Main component ────────────────────────────────────────────────────────────

export function RFQCreateForm() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [step, setStep]             = useState<'form' | 'success'>('form')
  const [isLoading, setIsLoading]   = useState(false)
  const [error, setError]           = useState<string | null>(null)
  const [response, setResponse]     = useState<CreateRFQResponse | null>(null)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
  const [attachments, setAttachments] = useState<Attachment[]>([])

  // Category pre-fill — when navigated from /categories/[id]
  const prefilledCategoryName = searchParams?.get('category_name') ?? null

  const [formData, setFormData] = useState<RFQFormData>(() => {
    // Restore draft on first render (client only)
    const draft = typeof window !== 'undefined' ? loadDraft() : null
    return {
      title:       draft?.title       ?? '',
      description: draft?.description ?? '',
      fields:      DEFAULT_RFQ_FIELDS,
      suppliers:   [],
    }
  })

  // If navigated from a category page, load its suppliers once
  const categoryLoaded = useRef(false)
  useEffect(() => {
    const catId = searchParams?.get('category_id')
    if (!catId || categoryLoaded.current) return
    categoryLoaded.current = true
    fetch(`/api/categories/${catId}`)
      .then((r) => r.json())
      .then(({ category }) => {
        if (!category?.category_suppliers?.length) return
        const suppliers: Supplier[] = category.category_suppliers.map(
          (s: { supplier_email: string }) => ({
            name:  s.supplier_email.split('@')[0],
            email: s.supplier_email,
          })
        )
        setFormData((prev) => ({ ...prev, suppliers }))
      })
      .catch(() => {})
  }, [searchParams])

  // ── Debounced auto-save draft ───────────────────────────────────────────────
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isFirstRender = useRef(true)

  const scheduleDraftSave = useCallback((title: string, description: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    setSaveStatus('saving')
    debounceRef.current = setTimeout(() => {
      try {
        saveDraft(title, description)
        setSaveStatus('saved')
      } catch {
        setSaveStatus('error')
      }
      // Reset to idle after 2.5 s
      setTimeout(() => setSaveStatus('idle'), 2500)
    }, 800)
  }, [])

  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return }
    // Only auto-save when title or description changes (not fields/suppliers)
    scheduleDraftSave(formData.title, formData.description)
  }, [formData.title, formData.description, scheduleDraftSave])

  // cleanup on unmount
  useEffect(() => () => { if (debounceRef.current) clearTimeout(debounceRef.current) }, [])

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!formData.title.trim())         { setError('Title is required'); return }
    if (formData.fields.length === 0)   { setError('Add at least one field for suppliers to fill in'); return }
    if (formData.suppliers.length === 0) { setError('Add at least one supplier'); return }

    setIsLoading(true)

    // Build and store optimistic RFQ before API call so /rfqs can show it instantly
    const tempRFQ = buildTempRFQ(formData.title, formData.description)
    savePendingRFQ(tempRFQ)

    try {
      const res = await fetch('/api/rfqs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title:       formData.title,
          description: formData.description,
          fields:      formData.fields,
          suppliers:   formData.suppliers,
          attachments: attachments.length > 0 ? attachments : undefined,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to create RFQ')
      }

      const data: CreateRFQResponse = await res.json()
      clearDraft()
      setResponse(data)
      setStep('success')
      // Invalidate the Next.js router cache so the dashboard reflects the new RFQ immediately
      router.refresh()
    } catch (err) {
      // Remove optimistic record if submission failed
      savePendingRFQ({ ...tempRFQ, id: '' }) // sentinel — page will ignore id:''
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  // ── Success ─────────────────────────────────────────────────────────────────

  if (step === 'success' && response) {
    return (
      <div className="space-y-6">
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 px-6 py-5 flex items-start gap-4">
          <div className="p-2 rounded-xl bg-emerald-500/15 border border-emerald-500/20 shrink-0">
            <CheckCircle2 className="h-5 w-5 text-emerald-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-emerald-300">RFQ Created Successfully</p>
            <p className="text-xs text-gray-500 mt-0.5">
              Share the links below with your suppliers to collect quotations.
            </p>
          </div>
        </div>

        <InviteLinks rfqId={response.rfq_id} invites={response.invites} />

        <div className="flex gap-3">
          <button
            onClick={() => {
              setStep('form')
              setFormData({ title: '', description: '', fields: DEFAULT_RFQ_FIELDS, suppliers: [] })
              setResponse(null)
              setAttachments([])
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.06] text-sm text-gray-300 font-medium transition-all"
          >
            Create Another RFQ
          </button>
          <button
            onClick={() => router.push(`/rfqs/${response.rfq_id}`)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-sm text-white font-semibold transition-all shadow-lg shadow-blue-600/20"
          >
            View RFQ Details
          </button>
        </div>
      </div>
    )
  }

  // ── Form ─────────────────────────────────────────────────────────────────────

  return (
    <form onSubmit={handleSubmit} className="space-y-5">

      {/* Save status */}
      <div className="flex items-center justify-between min-h-[20px]">
        <span className="text-xs text-gray-700 flex items-center gap-1">
          <Dot className="h-4 w-4 text-blue-500" />
          Draft auto-saves as you type
        </span>
        <SaveStatusBadge status={saveStatus} />
      </div>

      {/* Error banner */}
      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-red-500/20 bg-red-500/8 px-4 py-3">
          <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />
          <p className="text-sm text-red-300">{error}</p>
        </div>
      )}

      {/* Title */}
      <SectionCard icon={FileText} title="RFQ Title" description="Give your request a clear, descriptive title.">
        <input
          id="title"
          placeholder="e.g., Office Furniture — Q2 2024"
          value={formData.title}
          onChange={(e) => { setFormData({ ...formData, title: e.target.value }); setError(null) }}
          disabled={isLoading}
          className={inputCls}
        />
      </SectionCard>

      {/* Description + Attachments */}
      <SectionCard icon={AlignLeft} title="Description" description="Provide details about your requirements (optional).">
        <div className="space-y-4">
          <textarea
            id="description"
            placeholder="e.g., We need 50 ergonomic office chairs with delivery by March 31st..."
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            disabled={isLoading}
            rows={3}
            className={`${inputCls} resize-none`}
          />

          {/* Attachments */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Paperclip className="h-3.5 w-3.5 text-gray-500" />
              <span className="text-xs font-medium text-gray-400">Attachments</span>
              <span className="text-[11px] text-gray-600">(optional)</span>
            </div>
            <FileAnalysisPanel
              mode="rfq"
              onAttachmentsChange={setAttachments}
              disabled={isLoading}
            />
          </div>
        </div>
      </SectionCard>

      {/* Fields */}
      <SectionCard icon={Sliders} title="Quotation Fields" description='Define what information suppliers must provide. Click "Required" to toggle.'>
        <FieldBuilder
          fields={formData.fields}
          onChange={(fields) => setFormData({ ...formData, fields })}
          disabled={isLoading}
        />
      </SectionCard>

      {/* Suppliers */}
      <SectionCard
        icon={Users}
        title="Add Suppliers"
        description="Invite suppliers to submit quotations, or import a saved category."
      >
        <div className="space-y-4">
          {/* Category pre-fill notice */}
          {prefilledCategoryName && formData.suppliers.length > 0 && (
            <div className="flex items-center gap-2 rounded-xl border border-violet-500/20 bg-violet-500/8 px-3 py-2">
              <Layers className="h-3.5 w-3.5 text-violet-400 shrink-0" />
              <p className="text-xs text-violet-300">
                Suppliers loaded from <span className="font-semibold">{prefilledCategoryName}</span>
              </p>
            </div>
          )}

          {/* Category picker */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">Or import an entire category:</span>
            <CategoryPicker
              disabled={isLoading}
              onImport={(imported) => {
                const merged = [...formData.suppliers]
                for (const s of imported) {
                  if (!merged.some((x) => x.email === s.email)) merged.push(s)
                }
                setFormData({ ...formData, suppliers: merged })
              }}
            />
          </div>

          <SupplierSelector
            suppliers={formData.suppliers}
            onUpdate={(suppliers: Supplier[]) => setFormData({ ...formData, suppliers })}
            isLoading={isLoading}
          />
        </div>
      </SectionCard>

      {/* Submit row */}
      <div className="flex items-center justify-between gap-3 pt-2">
        <Link
          href="/rfqs"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.06] text-sm text-gray-400 font-medium transition-all"
        >
          <ArrowLeft className="h-4 w-4" />
          Cancel
        </Link>
        <button
          type="submit"
          disabled={isLoading}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-95 text-sm text-white font-semibold transition-all shadow-lg shadow-blue-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading
            ? <><Loader2 className="h-4 w-4 animate-spin" />Creating…</>
            : <><Send className="h-4 w-4" />Create RFQ</>
          }
        </button>
      </div>
    </form>
  )
}
