'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import {
  Layers, Plus, Trash2, ChevronRight, Loader2, Users, AlertCircle, Check, X,
} from 'lucide-react'

interface Category {
  id: string
  name: string
  supplier_count: number
  created_at: string
}

const inputCls =
  'rounded-xl border border-white/[0.08] bg-[#0d1220] px-4 py-2 text-sm text-white placeholder:text-gray-600 outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all'

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading]       = useState(true)
  const [creating, setCreating]     = useState(false)
  const [newName, setNewName]       = useState('')
  const [showInput, setShowInput]   = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [error, setError]           = useState<string | null>(null)
  const newInputRef                 = useRef<HTMLInputElement>(null)

  async function load() {
    setLoading(true)
    try {
      const res = await fetch('/api/categories')
      const json = await res.json()
      setCategories(json.categories ?? [])
    } catch {
      setError('Failed to load categories')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])
  useEffect(() => {
    if (showInput) setTimeout(() => newInputRef.current?.focus(), 50)
  }, [showInput])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    const name = newName.trim()
    if (!name) return
    setCreating(true)
    setError(null)
    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      const { category } = await res.json()
      setCategories((prev) => [category, ...prev])
      setNewName('')
      setShowInput(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create category')
    } finally {
      setCreating(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this category? Suppliers won\'t be deleted.')) return
    setDeletingId(id)
    try {
      const res = await fetch(`/api/categories/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      setCategories((prev) => prev.filter((c) => c.id !== id))
    } catch {
      setError('Failed to delete category')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white">Categories</h1>
          <p className="text-xs text-gray-600 mt-0.5">
            {categories.length > 0
              ? `${categories.length} group${categories.length !== 1 ? 's' : ''} · organize suppliers for fast RFQ targeting`
              : 'Organize suppliers into reusable groups'}
          </p>
        </div>
        <button
          onClick={() => { setShowInput(true); setError(null) }}
          className="inline-flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-semibold transition-all shadow-lg shadow-blue-600/20"
        >
          <Plus className="h-3.5 w-3.5" />
          New Category
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-red-500/20 bg-red-500/8 px-4 py-3">
          <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />
          <p className="text-sm text-red-300 flex-1">{error}</p>
          <button onClick={() => setError(null)} className="text-gray-600 hover:text-gray-400">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* New category inline form */}
      {showInput && (
        <form
          onSubmit={handleCreate}
          className="flex gap-2 p-4 rounded-2xl border border-blue-500/20 bg-blue-500/5"
        >
          <input
            ref={newInputRef}
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Category name (e.g. Construction Suppliers)"
            maxLength={80}
            className={`flex-1 ${inputCls}`}
          />
          <button
            type="submit"
            disabled={creating || !newName.trim()}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-sm text-white font-semibold disabled:opacity-40 transition-all"
          >
            {creating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
            {creating ? 'Creating…' : 'Create'}
          </button>
          <button
            type="button"
            onClick={() => { setShowInput(false); setNewName('') }}
            className="px-4 py-2 rounded-xl border border-white/[0.08] bg-white/[0.03] text-sm text-gray-400 hover:text-gray-200 transition-all"
          >
            Cancel
          </button>
        </form>
      )}

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-6 w-6 text-gray-600 animate-spin" />
        </div>
      ) : categories.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-28 gap-5 text-center">
          <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
            <Layers className="h-8 w-8 text-gray-700" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-gray-400">No categories yet</p>
            <p className="text-xs text-gray-600 max-w-xs">
              Group suppliers by industry or project type to send RFQs to an entire category at once.
            </p>
          </div>
          <button
            onClick={() => { setShowInput(true) }}
            className="inline-flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-all"
          >
            <Plus className="h-3.5 w-3.5" />
            Create First Category
          </button>
        </div>
      ) : (
        <div className="rounded-2xl border border-white/[0.07] bg-[#111827] overflow-hidden">
          {/* Table header */}
          <div className="grid grid-cols-[1fr_100px_80px] gap-4 px-5 py-3 border-b border-white/[0.06] text-[10px] font-semibold text-gray-600 uppercase tracking-wider">
            <span>Category</span>
            <span className="text-center">Suppliers</span>
            <span />
          </div>

          {categories.map((cat, i) => (
            <div
              key={cat.id}
              className={`group grid grid-cols-[1fr_100px_80px] gap-4 px-5 py-4 items-center hover:bg-white/[0.02] transition-colors ${
                i !== 0 ? 'border-t border-white/[0.05]' : ''
              }`}
            >
              {/* Name */}
              <Link href={`/categories/${cat.id}`} className="flex items-center gap-3 min-w-0">
                <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-violet-600/25 to-blue-600/25 border border-violet-500/20 flex items-center justify-center shrink-0">
                  <Layers className="h-3.5 w-3.5 text-violet-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-white truncate group-hover:text-blue-300 transition-colors">
                    {cat.name}
                  </p>
                  <p className="text-[11px] text-gray-600">
                    {new Date(cat.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>
              </Link>

              {/* Supplier count */}
              <Link href={`/categories/${cat.id}`} className="flex items-center justify-center gap-1.5 text-gray-400">
                <Users className="h-3.5 w-3.5 text-gray-600" />
                <span className="text-sm font-medium">{cat.supplier_count}</span>
              </Link>

              {/* Actions */}
              <div className="flex items-center justify-end gap-1">
                <button
                  onClick={() => handleDelete(cat.id)}
                  disabled={deletingId === cat.id}
                  className="p-1.5 rounded-lg text-gray-700 hover:text-red-400 hover:bg-red-500/10 transition-all disabled:opacity-40"
                  title="Delete category"
                >
                  {deletingId === cat.id
                    ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    : <Trash2 className="h-3.5 w-3.5" />}
                </button>
                <Link href={`/categories/${cat.id}`} className="p-1.5 rounded-lg text-gray-700 group-hover:text-gray-400 transition-colors">
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
