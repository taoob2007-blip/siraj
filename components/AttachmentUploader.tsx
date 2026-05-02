'use client'

import { useRef, useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import {
  UploadCloud, X, FileText, AlertCircle, Loader2,
  CheckCircle2, Image as ImageIcon,
} from 'lucide-react'
import type { Attachment } from '@/lib/types'

// ── Constants ──────────────────────────────────────────────────────────────────

const BUCKET     = 'attachments'
const MAX_BYTES  = 5 * 1024 * 1024   // 5 MB
const ALLOWED_MIME = new Set(['application/pdf', 'image/png', 'image/jpeg', 'image/jpg', 'image/webp'])
const ALLOWED_EXT  = /\.(pdf|png|jpg|jpeg|webp)$/i

// ── Supabase client ────────────────────────────────────────────────────────────
// createBrowserClient from @supabase/ssr is the correct equivalent of
// createClientComponentClient() — it handles cookie-based auth automatically.

function getSupabase() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}

// ── Types ──────────────────────────────────────────────────────────────────────

interface LocalFile {
  id:        string
  name:      string
  size:      number
  type:      string
  objectUrl: string
  status:    'uploading' | 'done' | 'error'
  path?:     string
  error?:    string
}

interface Props {
  onChange:  (attachments: Attachment[]) => void
  disabled?: boolean
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function fmtSize(bytes: number): string {
  if (bytes < 1024)         return `${bytes} B`
  if (bytes < 1024 * 1024)  return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function validate(file: File): string | null {
  if (file.size > MAX_BYTES) {
    return `Too large — max 5 MB (this file is ${fmtSize(file.size)})`
  }
  if (!ALLOWED_MIME.has(file.type) && !ALLOWED_EXT.test(file.name)) {
    return 'Unsupported type — use PDF, PNG, or JPG'
  }
  return null
}

function buildPath(file: File): string {
  const ext      = file.name.split('.').pop() ?? 'bin'
  const random   = Math.random().toString(36).slice(2, 8)
  const sanitized = file.name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 60)
  return `rfq/${Date.now()}-${random}-${sanitized}.${ext}`
}

// ── Component ──────────────────────────────────────────────────────────────────

export function AttachmentUploader({ onChange, disabled }: Props) {
  const inputRef    = useRef<HTMLInputElement>(null)
  const [files, setFiles] = useState<LocalFile[]>([])
  const onChangeRef = useRef(onChange)

  useEffect(() => { onChangeRef.current = onChange }, [onChange])

  // Notify parent when any file becomes done or is removed
  useEffect(() => {
    const done: Attachment[] = files
      .filter((f) => f.status === 'done' && f.path)
      .map((f)    => ({ path: f.path!, name: f.name, size: f.size, type: f.type }))
    onChangeRef.current(done)
  }, [files])

  // Revoke blob URLs on unmount
  useEffect(() => {
    return () => {
      setFiles((prev) => {
        prev.forEach((f) => { if (f.objectUrl) URL.revokeObjectURL(f.objectUrl) })
        return prev
      })
    }
  }, [])

  async function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files?.length) return
    await processFiles(e.target.files)
    e.target.value = ''
  }

  async function processFiles(fileList: FileList) {
    const supabase = getSupabase()

    for (const file of Array.from(fileList)) {
      const id  = crypto.randomUUID()
      const err = validate(file)

      if (err) {
        setFiles((prev) => [...prev, {
          id, name: file.name, size: file.size, type: file.type,
          objectUrl: '', status: 'error', error: err,
        }])
        continue
      }

      const objectUrl = file.type.startsWith('image/') ? URL.createObjectURL(file) : ''
      const path      = buildPath(file)

      setFiles((prev) => [...prev, {
        id, name: file.name, size: file.size, type: file.type,
        objectUrl, status: 'uploading',
      }])

      void supabase.storage
        .from(BUCKET)
        .upload(path, file, { cacheControl: '3600', upsert: false })
        .then(({ data, error: uploadErr }) => {
          if (uploadErr) {
            // Debug: full error object visible in browser console
            console.error('[AttachmentUploader] upload error', {
              bucket: BUCKET,
              path,
              fileName: file.name,
              fileSize: file.size,
              fileType: file.type,
              error: uploadErr,
            })
          } else {
            console.log('[AttachmentUploader] upload success', { path: data.path })
          }

          setFiles((prev) =>
            prev.map((f) =>
              f.id !== id ? f
                : uploadErr
                  ? { ...f, status: 'error' as const, error: uploadErr.message }
                  : { ...f, status: 'done'  as const, path },
            ),
          )
        })
    }
  }

  async function remove(id: string) {
    const file = files.find((f) => f.id === id)
    if (!file) return
    if (file.objectUrl) URL.revokeObjectURL(file.objectUrl)
    if (file.path) {
      const supabase = getSupabase()
      const { error } = await supabase.storage.from(BUCKET).remove([file.path])
      if (error) console.warn('[AttachmentUploader] remove error', error)
    }
    setFiles((prev) => prev.filter((f) => f.id !== id))
  }

  // ── Public URL helper (use only if bucket is public) ──────────────────────────
  // For private buckets, generate signed URLs server-side instead.
  //
  // function getPublicUrl(path: string): string {
  //   const supabase = getSupabase()
  //   const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
  //   return data.publicUrl
  // }

  // ── Drag-and-drop ─────────────────────────────────────────────────────────────

  const [dragging, setDragging] = useState(false)

  function onDragOver(e: React.DragEvent) {
    e.preventDefault()
    if (!disabled) setDragging(true)
  }
  function onDragLeave() { setDragging(false) }
  function onDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
    if (disabled || !e.dataTransfer.files.length) return
    processFiles(e.dataTransfer.files)
  }

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-3">

      {/* Drop zone */}
      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => !disabled && inputRef.current?.click()}
        className={[
          'flex flex-col items-center justify-center gap-2.5 rounded-xl',
          'border-2 border-dashed px-4 py-7 text-center transition-all select-none',
          disabled
            ? 'border-white/[0.05] opacity-50 cursor-not-allowed'
            : dragging
              ? 'border-blue-500/60 bg-blue-500/[0.06] cursor-copy'
              : 'border-white/[0.08] bg-[#0d1220] hover:border-blue-500/40 hover:bg-blue-500/[0.03] cursor-pointer',
        ].join(' ')}
      >
        <div className={`p-2.5 rounded-xl border transition-colors ${dragging ? 'border-blue-500/30 bg-blue-500/10' : 'border-white/[0.06] bg-white/[0.03]'}`}>
          <UploadCloud className={`h-5 w-5 ${dragging ? 'text-blue-400' : 'text-gray-500'}`} />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-400">
            {dragging ? 'Drop files here' : 'Click or drag to upload'}
          </p>
          <p className="text-xs text-gray-600 mt-0.5">PDF, PNG, JPG — max 5 MB per file</p>
        </div>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".pdf,.png,.jpg,.jpeg,image/png,image/jpeg,application/pdf"
          className="hidden"
          disabled={disabled}
          onChange={handleInputChange}
        />
      </div>

      {/* File list */}
      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((f) => (
            <FileRow key={f.id} file={f} disabled={disabled} onRemove={() => remove(f.id)} />
          ))}
        </div>
      )}
    </div>
  )
}

// ── File row ──────────────────────────────────────────────────────────────────

function FileRow({
  file, disabled, onRemove,
}: { file: LocalFile; disabled?: boolean; onRemove: () => void }) {
  const isImage = file.type.startsWith('image/') || /\.(png|jpg|jpeg|webp)$/i.test(file.name)
  const isPDF   = file.type === 'application/pdf' || file.name.endsWith('.pdf')

  return (
    <div className={[
      'flex items-center gap-3 rounded-xl border px-3 py-2.5 transition-colors',
      file.status === 'error'
        ? 'border-red-500/25 bg-red-500/[0.04]'
        : 'border-white/[0.07] bg-[#111827]',
    ].join(' ')}>

      {/* Thumbnail or icon */}
      <div className="shrink-0 w-9 h-9 rounded-lg overflow-hidden border border-white/[0.08] flex items-center justify-center bg-white/[0.03]">
        {isImage && file.objectUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={file.objectUrl} alt={file.name} className="w-full h-full object-cover" />
        ) : isPDF ? (
          <FileText className="h-4 w-4 text-red-400" />
        ) : (
          <ImageIcon className="h-4 w-4 text-blue-400" />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-gray-200 truncate">{file.name}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[11px] text-gray-600">{fmtSize(file.size)}</span>

          {file.status === 'uploading' && (
            <span className="inline-flex items-center gap-1 text-[11px] text-blue-400">
              <Loader2 className="h-2.5 w-2.5 animate-spin" />Uploading…
            </span>
          )}
          {file.status === 'done' && (
            <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400">
              <CheckCircle2 className="h-2.5 w-2.5" />Uploaded
            </span>
          )}
          {file.status === 'error' && (
            <span className="inline-flex items-center gap-1 text-[11px] text-red-400">
              <AlertCircle className="h-2.5 w-2.5" />{file.error}
            </span>
          )}
        </div>
      </div>

      {/* Remove */}
      <button
        type="button"
        onClick={onRemove}
        disabled={disabled || file.status === 'uploading'}
        className="shrink-0 p-1.5 rounded-lg text-gray-600 hover:text-white hover:bg-white/[0.07] transition-all disabled:opacity-30"
        aria-label="Remove file"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}
