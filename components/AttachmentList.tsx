'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabaseBrowserClient as supabase } from '@/lib/supabase/client'
import {
  FileText, Image as ImageIcon, Download, Trash2, Loader2,
  Eye, X, AlertCircle, File,
} from 'lucide-react'
import { fmtSize } from '@/components/AttachmentUploader'
import type { Attachment } from '@/lib/types'

// ── Constants ──────────────────────────────────────────────────────────────────

const BUCKET = 'attachments'
const SIGNED_URL_TTL = 3600  // 1 hour for viewing

// ── Types ──────────────────────────────────────────────────────────────────────

interface AttachmentItem extends Attachment {
  signedUrl:    string | null
  urlLoading:   boolean
  urlError:     boolean
}

interface PreviewState {
  url:  string
  name: string
  type: string
}

interface Props {
  attachments: Attachment[]
  onDelete?:   (path: string) => void
  disabled?:   boolean
  className?:  string
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function isImage(type: string, name: string) {
  return type.startsWith('image/') || /\.(png|jpg|jpeg|webp)$/i.test(name)
}

function isPDF(type: string, name: string) {
  return type === 'application/pdf' || name.endsWith('.pdf')
}

function TypeBadge({ type, name }: { type: string; name: string }) {
  if (isImage(type, name)) {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded-md bg-blue-500/10 border border-blue-500/20 text-blue-400">
        <ImageIcon className="h-2.5 w-2.5" />
        {name.split('.').pop()?.toUpperCase()}
      </span>
    )
  }
  if (isPDF(type, name)) {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded-md bg-red-500/10 border border-red-500/20 text-red-400">
        <FileText className="h-2.5 w-2.5" />
        PDF
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded-md bg-gray-500/10 border border-gray-500/20 text-gray-400">
      <File className="h-2.5 w-2.5" />
      {name.split('.').pop()?.toUpperCase() ?? 'FILE'}
    </span>
  )
}

function Thumbnail({ item }: { item: AttachmentItem }) {
  if (item.urlLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <Loader2 className="h-3.5 w-3.5 text-gray-600 animate-spin" />
      </div>
    )
  }
  if (isImage(item.type, item.name) && item.signedUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={item.signedUrl}
        alt={item.name}
        className="w-full h-full object-cover"
        onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
      />
    )
  }
  if (isPDF(item.type, item.name)) {
    return <FileText className="h-5 w-5 text-red-400" />
  }
  return <ImageIcon className="h-5 w-5 text-gray-500" />
}

// ── Preview modal ─────────────────────────────────────────────────────────────

function PreviewModal({ preview, onClose }: { preview: PreviewState; onClose: () => void }) {
  // Close on Escape
  useEffect(() => {
    function handler(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="relative max-w-4xl w-full max-h-[90vh] bg-[#0d1220] rounded-2xl border border-white/[0.08] overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
          <p className="text-sm font-medium text-white truncate max-w-[80%]">{preview.name}</p>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/[0.07] transition-all"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-auto" style={{ maxHeight: 'calc(90vh - 56px)' }}>
          {isImage(preview.type, preview.name) ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={preview.url}
              alt={preview.name}
              className="w-full h-auto object-contain"
            />
          ) : isPDF(preview.type, preview.name) ? (
            <iframe
              src={preview.url}
              title={preview.name}
              className="w-full border-0"
              style={{ height: 'calc(90vh - 56px)' }}
            />
          ) : (
            <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
              <File className="h-12 w-12 text-gray-600" />
              <div>
                <p className="text-sm text-gray-300 font-medium">No preview available</p>
                <p className="text-xs text-gray-600 mt-1">Download the file to view it</p>
              </div>
              <a
                href={preview.url}
                download={preview.name}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-sm text-white font-medium transition-colors"
              >
                <Download className="h-4 w-4" />
                Download
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────

export function AttachmentList({ attachments, onDelete, disabled, className }: Props) {
  const [items, setItems] = useState<AttachmentItem[]>([])
  const [preview, setPreview] = useState<PreviewState | null>(null)
  const [deleting, setDeleting] = useState<Set<string>>(new Set())

  // Initialise items from props and generate signed URLs
  useEffect(() => {
    if (attachments.length === 0) { setItems([]); return }

    setItems(attachments.map((att) => ({
      ...att,
      signedUrl:  null,
      urlLoading: true,
      urlError:   false,
    })))

    // Generate signed URLs for all attachments in parallel
    attachments.forEach((att) => {
      supabase.storage
        .from(BUCKET)
        .createSignedUrl(att.path, SIGNED_URL_TTL)
        .then(({ data, error }) => {
          setItems((prev) =>
            prev.map((item) =>
              item.path !== att.path ? item : {
                ...item,
                signedUrl:  error ? null : (data?.signedUrl ?? null),
                urlLoading: false,
                urlError:   !!error,
              }
            )
          )
        })
    })
  }, [attachments])

  const handlePreview = useCallback((item: AttachmentItem) => {
    if (!item.signedUrl) return
    setPreview({ url: item.signedUrl, name: item.name, type: item.type })
  }, [])

  const handleDelete = useCallback(async (item: AttachmentItem) => {
    if (disabled || deleting.has(item.path)) return

    setDeleting((prev) => new Set(prev).add(item.path))
    try {
      const { error } = await supabase.storage.from(BUCKET).remove([item.path])
      if (error) {
        console.error('[AttachmentList] delete failed', error)
        return
      }
      setItems((prev) => prev.filter((i) => i.path !== item.path))
      onDelete?.(item.path)
    } finally {
      setDeleting((prev) => {
        const next = new Set(prev)
        next.delete(item.path)
        return next
      })
    }
  }, [disabled, deleting, onDelete])

  if (items.length === 0) return null

  return (
    <>
      <div className={['space-y-2', className].filter(Boolean).join(' ')}>
        {items.map((item) => {
          const canPreview = !!item.signedUrl && !item.urlLoading
          const isDeleting = deleting.has(item.path)

          return (
            <div
              key={item.path}
              className="flex items-center gap-3 rounded-xl border border-white/[0.07] bg-[#0d1220] px-3 py-2.5 transition-colors hover:border-white/[0.12]"
            >
              {/* Thumbnail */}
              <div className="shrink-0 w-10 h-10 rounded-lg overflow-hidden border border-white/[0.08] flex items-center justify-center bg-white/[0.03]">
                <Thumbnail item={item} />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-gray-200 truncate">{item.name}</p>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className="text-[11px] text-gray-600">{fmtSize(item.size)}</span>
                  <TypeBadge type={item.type} name={item.name} />
                  {item.urlError && (
                    <span className="inline-flex items-center gap-1 text-[11px] text-amber-400">
                      <AlertCircle className="h-2.5 w-2.5" />URL expired
                    </span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 shrink-0">

                {/* Preview */}
                <button
                  type="button"
                  onClick={() => handlePreview(item)}
                  disabled={!canPreview}
                  title="Preview"
                  className="p-1.5 rounded-lg text-gray-600 hover:text-blue-400 hover:bg-white/[0.07] transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <Eye className="h-3.5 w-3.5" />
                </button>

                {/* Download */}
                {item.signedUrl ? (
                  <a
                    href={item.signedUrl}
                    download={item.name}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Download"
                    className="p-1.5 rounded-lg text-gray-600 hover:text-emerald-400 hover:bg-white/[0.07] transition-all"
                  >
                    <Download className="h-3.5 w-3.5" />
                  </a>
                ) : (
                  <span className="p-1.5 opacity-30">
                    <Download className="h-3.5 w-3.5 text-gray-600" />
                  </span>
                )}

                {/* Delete */}
                {onDelete && (
                  <button
                    type="button"
                    onClick={() => handleDelete(item)}
                    disabled={disabled || isDeleting}
                    title="Delete"
                    className="p-1.5 rounded-lg text-gray-600 hover:text-red-400 hover:bg-red-500/[0.07] transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    {isDeleting
                      ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      : <Trash2  className="h-3.5 w-3.5" />
                    }
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {preview && (
        <PreviewModal preview={preview} onClose={() => setPreview(null)} />
      )}
    </>
  )
}
