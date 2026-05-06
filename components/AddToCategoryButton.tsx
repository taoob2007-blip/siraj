'use client'

import { useState, useRef, useEffect } from 'react'
import { Layers, ChevronDown, Check, Loader2, X, Plus } from 'lucide-react'

interface Category {
  id: string
  name: string
  supplier_count: number
}

interface Props {
  email: string
  supplierName?: string
}

export function AddToCategoryButton({ email, supplierName }: Props) {
  const [open, setOpen]               = useState(false)
  const [categories, setCategories]   = useState<Category[]>([])
  const [loadingList, setLoadingList] = useState(false)
  const [adding, setAdding]           = useState<string | null>(null)
  const [added, setAdded]             = useState<Set<string>>(new Set())

  // Inline create state
  const [showCreate, setShowCreate]   = useState(false)
  const [newName, setNewName]         = useState('')
  const [creating, setCreating]       = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)

  const panelRef = useRef<HTMLDivElement>(null)

  // Close on outside click
  useEffect(() => {
    if (!open) return
    function onDown(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false)
        setShowCreate(false)
        setNewName('')
      }
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])

  async function loadCategories() {
    setLoadingList(true)
    try {
      const res  = await fetch('/api/categories')
      const json = await res.json()
      setCategories(json.categories ?? [])
    } finally {
      setLoadingList(false)
    }
  }

  function toggle() {
    if (!open) { loadCategories(); setShowCreate(false); setNewName('') }
    setOpen((v) => !v)
  }

  async function handleAdd(catId: string) {
    if (added.has(catId) || adding) return
    setAdding(catId)
    try {
      await fetch(`/api/categories/${catId}/suppliers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ supplier_email: email, supplier_name: supplierName }),
      })
      setAdded((prev) => new Set(Array.from(prev).concat(catId)))
      // Update count in local list
      setCategories((prev) =>
        prev.map((c) => c.id === catId ? { ...c, supplier_count: c.supplier_count + 1 } : c)
      )
    } finally {
      setAdding(null)
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    const name = newName.trim()
    if (!name) return
    setCreating(true)
    setCreateError(null)
    try {
      const res  = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)

      const newCat: Category = { ...json.category }
      setCategories((prev) => [newCat, ...prev])
      setNewName('')
      setShowCreate(false)

      // Immediately add the supplier to the new category
      await handleAdd(newCat.id)
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Failed to create')
    } finally {
      setCreating(false)
    }
  }

  const totalAdded = added.size

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={toggle}
        className={[
          'inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1.5 rounded-lg border font-medium transition-all',
          totalAdded > 0
            ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
            : 'border-white/[0.07] bg-white/[0.03] hover:bg-white/[0.07] text-gray-400 hover:text-gray-200',
        ].join(' ')}
      >
        <Layers className="h-3 w-3" />
        {totalAdded > 0 ? `In ${totalAdded} categor${totalAdded > 1 ? 'ies' : 'y'}` : 'Category'}
        <ChevronDown className={`h-2.5 w-2.5 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1.5 z-50 w-64 rounded-2xl border border-white/[0.10] bg-[#0d1220] shadow-2xl shadow-black/60 overflow-hidden">

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/[0.06]">
            <span className="text-xs font-semibold text-gray-300">Add to Category</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => { setShowCreate((v) => !v); setCreateError(null) }}
                className="text-[10px] text-blue-400 hover:text-blue-300 font-medium flex items-center gap-0.5 transition-colors"
              >
                <Plus className="h-3 w-3" />New
              </button>
              <button onClick={() => setOpen(false)} className="text-gray-600 hover:text-gray-400 transition-colors">
                <X className="h-3 w-3" />
              </button>
            </div>
          </div>

          {/* Inline create form */}
          {showCreate && (
            <form onSubmit={handleCreate} className="px-4 py-3 border-b border-white/[0.06] space-y-2">
              <input
                autoFocus
                value={newName}
                onChange={(e) => { setNewName(e.target.value); setCreateError(null) }}
                placeholder="Category name…"
                className="w-full rounded-lg border border-white/[0.08] bg-[#0d1220] px-3 py-1.5 text-xs text-white placeholder:text-gray-600 outline-none focus:border-blue-500/40 transition-all"
              />
              {createError && <p className="text-[10px] text-red-400">{createError}</p>}
              <div className="flex gap-1.5">
                <button
                  type="submit"
                  disabled={creating || !newName.trim()}
                  className="flex-1 text-xs py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold disabled:opacity-40 transition-all"
                >
                  {creating ? 'Creating…' : 'Create & Add'}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowCreate(false); setNewName('') }}
                  className="px-3 py-1.5 rounded-lg border border-white/[0.08] text-xs text-gray-500 hover:text-gray-300 transition-all"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {/* Category list */}
          {loadingList ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-4 w-4 text-gray-600 animate-spin" />
            </div>
          ) : categories.length === 0 ? (
            <div className="px-4 py-5 text-center">
              <p className="text-xs text-gray-600 mb-2">No categories yet.</p>
              {!showCreate && (
                <button
                  onClick={() => setShowCreate(true)}
                  className="text-xs text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1 mx-auto transition-colors"
                >
                  <Plus className="h-3 w-3" />Create one
                </button>
              )}
            </div>
          ) : (
            <div className="max-h-52 overflow-y-auto divide-y divide-white/[0.04]">
              {categories.map((cat) => {
                const isDone = added.has(cat.id)
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => handleAdd(cat.id)}
                    disabled={adding === cat.id || isDone}
                    className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-white/[0.04] transition-colors disabled:cursor-default text-left group"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Layers className={`h-3.5 w-3.5 shrink-0 ${isDone ? 'text-emerald-400' : 'text-cyan-400'}`} />
                      <div className="min-w-0">
                        <p className="text-xs text-gray-300 truncate">{cat.name}</p>
                        <p className="text-[10px] text-gray-600">{cat.supplier_count} supplier{cat.supplier_count !== 1 ? 's' : ''}</p>
                      </div>
                    </div>
                    {isDone ? (
                      <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                    ) : adding === cat.id ? (
                      <Loader2 className="h-3.5 w-3.5 text-cyan-400 animate-spin shrink-0" />
                    ) : (
                      <Plus className="h-3.5 w-3.5 text-gray-600 group-hover:text-gray-300 shrink-0 transition-colors" />
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
