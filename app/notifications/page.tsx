'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  Bell, CheckCheck, Trash2, Loader2, FileText,
  FileSignature, Info, RefreshCw,
} from 'lucide-react'
import type { NotificationItem, NotificationType } from '@/lib/types'
import { toast } from '@/components/Toast'

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60_000)
  if (m < 1)  return 'Just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  return `${d}d ago`
}

const TYPE_META: Record<NotificationType, { label: string; color: string; Icon: React.ElementType }> = {
  rfq:      { label: 'RFQ',      color: 'text-blue-400   bg-blue-400/10   border-blue-400/20',   Icon: FileText      },
  contract: { label: 'Contract', color: 'text-violet-400 bg-violet-400/10 border-violet-400/20', Icon: FileSignature },
  system:   { label: 'System',   color: 'text-gray-400   bg-gray-400/10   border-gray-400/20',   Icon: Info          },
}

export default function NotificationsPage() {
  const [items, setItems]     = useState<NotificationItem[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter]   = useState<'all' | 'unread'>('all')
  const [markingAll, setMarkingAll] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/notifications')
      if (!res.ok) throw new Error('Failed to load')
      const data = await res.json()
      setItems(data.notifications)
    } catch {
      toast.error('Failed to load notifications')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  async function markRead(id: string) {
    const prev = items
    setItems((all) => all.map((n) => n.id === id ? { ...n, read: true } : n))
    const res = await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    if (!res.ok) { setItems(prev); toast.error('Failed to mark as read') }
  }

  async function markAllRead() {
    setMarkingAll(true)
    const res = await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ all: true }),
    })
    if (res.ok) {
      setItems((all) => all.map((n) => ({ ...n, read: true })))
      toast.success('All marked as read')
    } else {
      toast.error('Failed to mark all as read')
    }
    setMarkingAll(false)
  }

  async function remove(id: string) {
    const prev = items
    setItems((all) => all.filter((n) => n.id !== id))
    const res = await fetch('/api/notifications', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    if (!res.ok) { setItems(prev); toast.error('Failed to delete notification') }
  }

  const displayed = filter === 'unread' ? items.filter((n) => !n.read) : items
  const unreadCount = items.filter((n) => !n.read).length

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
            <Bell className="h-6 w-6 text-blue-400" />
            Notifications
            {unreadCount > 0 && (
              <span className="text-sm font-semibold bg-blue-600 text-white px-2 py-0.5 rounded-full">
                {unreadCount}
              </span>
            )}
          </h1>
          <p className="text-sm text-gray-500 mt-1">Stay updated on RFQs, contracts, and system events</p>
        </div>
        <button
          onClick={load}
          className="p-2 rounded-lg text-gray-500 hover:text-gray-200 hover:bg-white/[0.06] transition-all"
          title="Refresh"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-1 bg-white/[0.04] border border-white/[0.08] rounded-lg p-1">
          {(['all', 'unread'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={[
                'px-3 py-1 rounded-md text-sm font-medium transition-all capitalize',
                filter === f
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-gray-500 hover:text-gray-200',
              ].join(' ')}
            >
              {f}
              {f === 'unread' && unreadCount > 0 && (
                <span className="ml-1.5 text-[11px] bg-blue-500/30 text-blue-300 px-1.5 py-0.5 rounded-full">
                  {unreadCount}
                </span>
              )}
            </button>
          ))}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            disabled={markingAll}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-white/[0.08] text-gray-400 hover:text-white hover:bg-white/[0.06] transition-all disabled:opacity-50"
          >
            {markingAll
              ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
              : <CheckCheck className="h-3.5 w-3.5" />}
            Mark all read
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 text-gray-600 animate-spin" />
        </div>
      ) : displayed.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
          <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
            <Bell className="h-8 w-8 text-gray-700" />
          </div>
          <p className="text-sm text-gray-500">
            {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {displayed.map((n) => {
            const meta = TYPE_META[n.type]
            const Icon = meta.Icon
            return (
              <div
                key={n.id}
                className={[
                  'group flex items-start gap-3.5 rounded-xl border px-4 py-3.5 transition-all',
                  n.read
                    ? 'border-white/[0.06] bg-white/[0.02] hover:border-white/[0.09]'
                    : 'border-blue-500/20 bg-blue-500/[0.04] hover:border-blue-500/30',
                ].join(' ')}
              >
                <div className="mt-1.5 shrink-0">
                  {n.read
                    ? <div className="w-2 h-2 rounded-full bg-transparent" />
                    : <div className="w-2 h-2 rounded-full bg-blue-500 shadow-sm shadow-blue-500/50" />
                  }
                </div>
                <div className={`p-2 rounded-lg border shrink-0 ${meta.color}`}>
                  <Icon className="h-3.5 w-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className={`text-sm font-medium ${n.read ? 'text-gray-300' : 'text-white'}`}>{n.title}</p>
                    <span className={`text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded-md border ${meta.color}`}>
                      {meta.label}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 leading-relaxed">{n.message}</p>
                  <p className="text-[11px] text-gray-700 mt-1.5">{timeAgo(n.created_at)}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  {!n.read && (
                    <button
                      onClick={() => markRead(n.id)}
                      title="Mark as read"
                      className="p-1.5 rounded-lg text-gray-600 hover:text-blue-400 hover:bg-blue-500/[0.08] transition-all"
                    >
                      <CheckCheck className="h-3.5 w-3.5" />
                    </button>
                  )}
                  <button
                    onClick={() => remove(n.id)}
                    title="Delete"
                    className="p-1.5 rounded-lg text-gray-600 hover:text-red-400 hover:bg-red-500/[0.08] transition-all"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
