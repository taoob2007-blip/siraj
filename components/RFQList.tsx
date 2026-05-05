'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Plus, Clock, Pause, Play, XCircle, Trash2, Loader2,
  Users, MessageSquare, TrendingUp, Activity, Search,
  AlertCircle, Zap, ArrowUpDown, Brain,
  Sparkles, BarChart3, Trophy, Eye,
  Target, AlertTriangle, CheckCircle2,
} from 'lucide-react'
import Link from 'next/link'

/* ================= TYPES ================= */

interface RFQ {
  id: string
  title: string
  description: string | null
  status: string
  created_at: string
  invite_count: number
  response_count: number
  _optimistic?: true
}

interface ScoredRFQ extends RFQ {
  priority_score: number
  rank: number
  score_breakdown: {
    response_count: number
    response_speed: number
    price_competitiveness: number
    supplier_quality: number
  }
}

/* ================= HELPERS ================= */

function responseRate(rfq: RFQ) {
  return rfq.invite_count > 0
    ? Math.round((rfq.response_count / rfq.invite_count) * 100)
    : 0
}

function daysSince(dateStr: string) {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000)
}

/* ================= SCORING ================= */

function computePriorityScore(rfq: RFQ, all: RFQ[]) {
  const maxResponses = Math.max(1, ...all.map(r => r.response_count))
  const maxInvites   = Math.max(1, ...all.map(r => r.invite_count))

  const responseScore = (rfq.response_count / maxResponses) * 100
  const inviteScore   = (rfq.invite_count / maxInvites) * 100

  const total = Math.round(
    responseScore * 0.5 +
    inviteScore   * 0.5
  )

  return {
    response_count: responseScore,
    response_speed: responseScore,
    price_competitiveness: inviteScore,
    supplier_quality: inviteScore,
    total
  }
}

function scoreRFQs(rfqs: RFQ[]): ScoredRFQ[] {
  const scored = rfqs.map(r => {
    const s = computePriorityScore(r, rfqs)
    return { ...r, priority_score: s.total, score_breakdown: s, rank: 0 }
  })

  const sorted = [...scored].sort((a, b) => b.priority_score - a.priority_score)

  sorted.forEach((r, i) => r.rank = i + 1)
  return sorted
}

/* ================= COMPONENT ================= */

export function RFQList({ initialRfqs }: { initialRfqs: RFQ[] }) {
  const router = useRouter()

  const [rfqs, setRfqs] = useState(initialRfqs)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortBy, setSortBy] = useState<'score' | 'newest'>('score')

  const scored = useMemo(() => scoreRFQs(rfqs), [rfqs])

  const filtered = useMemo(() => {
    return scored.filter(r =>
      (statusFilter === 'all' || r.status === statusFilter) &&
      r.title.toLowerCase().includes(search.toLowerCase())
    )
  }, [scored, search, statusFilter])

  const totalResponses = rfqs.reduce((s, r) => s + r.response_count, 0)
  const totalInvites   = rfqs.reduce((s, r) => s + r.invite_count, 0)
  const activeCount    = rfqs.filter(r => r.status === 'active').length
  const avgRate        = totalInvites > 0 ? Math.round((totalResponses / totalInvites) * 100) : 0

  /* ================= UI ================= */

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">RFQ Control Center</h1>
          <p className="text-xs text-gray-500">
            {rfqs.length} total · {activeCount} active
          </p>
        </div>

        <Link href="/rfqs/new">
          <button className="px-5 py-2 rounded-xl bg-blue-600 text-white flex items-center gap-2">
            <Plus className="h-4 w-4" /> New RFQ
          </button>
        </Link>
      </div>

      {/* SEARCH */}
      <div className="flex gap-3">
        <Input
          placeholder="Search..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-[#0b1220]"
        />

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40 bg-[#0b1220]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="active">Active</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-[#111827] p-4 rounded-xl">RFQs: {rfqs.length}</div>
        <div className="bg-[#111827] p-4 rounded-xl">Active: {activeCount}</div>
        <div className="bg-[#111827] p-4 rounded-xl">Responses: {totalResponses}</div>
        <div className="bg-[#111827] p-4 rounded-xl">Rate: {avgRate}%</div>
      </div>

      {/* CARDS */}
      <div className="grid grid-cols-2 gap-4">
        {filtered.map(r => (
          <div key={r.id} className="bg-[#111827] p-5 rounded-xl space-y-3">

            <div className="flex justify-between">
              <h2 className="text-white font-semibold">{r.title}</h2>
              <span className="text-xs text-gray-400">#{r.rank}</span>
            </div>

            <div className="text-xs text-gray-500">
              {r.response_count} responses · {r.invite_count} invites
            </div>

            <div className="h-1 bg-gray-800 rounded">
              <div
                className="h-1 bg-blue-500 rounded"
                style={{ width: `${r.priority_score}%` }}
              />
            </div>

            <div className="flex justify-between">
              <Link href={`/rfqs/${r.id}`}>
                <button className="text-blue-400 text-xs">View</button>
              </Link>

              <button
                onClick={() => {
                  setRfqs(prev => prev.filter(x => x.id !== r.id))
                }}
                className="text-red-400 text-xs"
              >
                Delete
              </button>
            </div>

          </div>
        ))}
      </div>

    </div>
  )
}