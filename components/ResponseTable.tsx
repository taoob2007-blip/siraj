'use client'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { TrendingDown, Zap, Star, AlertTriangle, Clock, Sparkles, Bot } from 'lucide-react'
import type { RFQField } from '@/lib/types'
import { DEFAULT_RFQ_FIELDS } from '@/lib/types'
import { computeIndicators } from '@/lib/scoring'

interface Response {
  id: string
  supplier_email: string
  price: number | null
  delivery_days: number | null
  answers: Record<string, string | number>
  created_at: string
}

interface ResponseTableProps {
  responses: Response[]
  fields?: RFQField[]
  projectType?: string
  aiRecommendedId?: string | null
  notesMap?: Record<string, string>
}

function getAnswerValue(response: Response, field: RFQField): string {
  const raw = response.answers?.[field.id]
  if (raw !== undefined && raw !== null && raw !== '') return String(raw)
  if (field.id === 'price' && response.price !== null) return String(response.price)
  if (field.id === 'delivery_days' && response.delivery_days !== null)
    return String(response.delivery_days)
  return '—'
}

export function ResponseTable({
  responses,
  fields = DEFAULT_RFQ_FIELDS,
  projectType,
  aiRecommendedId,
  notesMap = {},
}: ResponseTableProps) {
  if (responses.length === 0) {
    return (
      <Card className="border-gray-700 bg-gray-900 p-8">
        <div className="text-center">
          <p className="text-gray-400">No responses received yet.</p>
          <p className="text-sm text-gray-500 mt-2">
            Responses will appear here as suppliers submit their quotations.
          </p>
        </div>
      </Card>
    )
  }

  const indicators = computeIndicators(responses)

  // Per-field minimums for cell-level color hints
  const numberFieldMins: Record<string, number> = {}
  for (const field of fields) {
    if (field.type !== 'number') continue
    const values = responses
      .map((r) => parseFloat(getAnswerValue(r, field)))
      .filter((v) => !isNaN(v))
    if (values.length > 0) numberFieldMins[field.id] = Math.min(...values)
  }

  const isMin = (response: Response, field: RFQField): boolean => {
    if (field.type !== 'number') return false
    const val = parseFloat(getAnswerValue(response, field))
    return !isNaN(val) && val === numberFieldMins[field.id]
  }

  const hasNotes = Object.keys(notesMap).length > 0

  return (
    <Card className="border-gray-700 bg-gray-900 overflow-hidden">
      {/* Header + legend */}
      <div className="p-5 border-b border-gray-700 space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h3 className="font-semibold text-lg">Responses ({responses.length})</h3>
          <div className="flex items-center gap-3 flex-wrap text-xs text-gray-500">
            {aiRecommendedId && (
              <span className="flex items-center gap-1 text-blue-400">
                <Bot className="h-3 w-3" /> AI Recommended
              </span>
            )}
            <span className="flex items-center gap-1">
              <TrendingDown className="h-3 w-3 text-green-400" /> Lowest Price
            </span>
            <span className="flex items-center gap-1">
              <Zap className="h-3 w-3 text-blue-400" /> Fastest Delivery
            </span>
            <span className="flex items-center gap-1">
              <Star className="h-3 w-3 text-purple-400" /> Best Value
            </span>
            <span className="flex items-center gap-1">
              <AlertTriangle className="h-3 w-3 text-yellow-400" /> High Price
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3 text-red-400" /> Slow
            </span>
          </div>
        </div>
        {aiRecommendedId && projectType && (
          <p className="text-xs text-blue-400 flex items-center gap-1">
            <Bot className="h-3 w-3" />
            AI recommendation based on {projectType} project analysis
          </p>
        )}
      </div>

      <Table>
        <TableHeader>
          <TableRow className="border-gray-700 hover:bg-transparent">
            <TableHead className="text-gray-400">Supplier</TableHead>
            {fields.map((field) => (
              <TableHead key={field.id} className="text-gray-400">
                {field.label}
                {field.unit ? ` (${field.unit})` : ''}
              </TableHead>
            ))}
            <TableHead className="text-gray-400">Insights</TableHead>
            {hasNotes && (
              <TableHead className="text-gray-400">
                <span className="flex items-center gap-1">
                  <Bot className="h-3 w-3" />
                  AI Insight
                </span>
              </TableHead>
            )}
            <TableHead className="text-gray-400 text-right">Submitted</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {[...responses].sort((a, b) => {
            if (a.id === aiRecommendedId) return -1
            if (b.id === aiRecommendedId) return 1
            return 0
          }).map((response) => {
            const ind = indicators[response.id]
            const isAIRecommended = aiRecommendedId != null && response.id === aiRecommendedId

            const rowClass = isAIRecommended
              ? 'border-gray-700 border-l-2 border-l-purple-500 bg-purple-500/10 transition-colors hover:bg-purple-500/20'
              : 'border-gray-700 opacity-70 hover:opacity-100 transition-opacity hover:bg-gray-800/40'

            return (
              <TableRow key={response.id} className={rowClass}>
                {/* Supplier */}
                <TableCell className="font-medium text-white align-top">
                  <div className="flex items-center gap-2 flex-wrap">
                    {response.supplier_email}
                    {isAIRecommended && (
                      <Badge className="bg-blue-900/60 text-blue-300 border-blue-600 hover:bg-blue-900/60 flex items-center gap-1 text-xs">
                        <Bot className="h-3 w-3" />
                        AI Recommended
                      </Badge>
                    )}
                  </div>
                </TableCell>

                {/* Dynamic field cells */}
                {fields.map((field) => {
                  const value = getAnswerValue(response, field)
                  const min = isMin(response, field)
                  const isPrice = field.id === 'price'
                  const isDelivery = field.id === 'delivery_days'

                  const textColor = min
                    ? isPrice
                      ? 'text-green-300 font-semibold'
                      : isDelivery
                      ? 'text-blue-300 font-semibold'
                      : 'text-white font-semibold'
                    : 'text-gray-300'

                  return (
                    <TableCell key={field.id} className="align-top">
                      <span className={textColor}>{value}</span>
                    </TableCell>
                  )
                })}

                {/* Insights badges */}
                <TableCell className="align-top">
                  <div className="flex flex-wrap gap-1.5">
                    {ind?.lowestPrice && (
                      <Badge className="bg-green-900/60 text-green-300 border-green-700 hover:bg-green-900/60 flex items-center gap-1 text-xs">
                        <TrendingDown className="h-3 w-3" />
                        Lowest
                      </Badge>
                    )}
                    {ind?.fastestDelivery && (
                      <Badge className="bg-blue-900/60 text-blue-300 border-blue-700 hover:bg-blue-900/60 flex items-center gap-1 text-xs">
                        <Zap className="h-3 w-3" />
                        Fastest
                      </Badge>
                    )}
                    {ind?.bestValue && (
                      <Badge className="bg-purple-900/60 text-purple-300 border-purple-600 hover:bg-purple-900/60 flex items-center gap-1 text-xs">
                        <Star className="h-3 w-3" />
                        Best Value
                      </Badge>
                    )}
                    {ind?.highPrice && (
                      <Badge className="bg-yellow-900/60 text-yellow-300 border-yellow-700 hover:bg-yellow-900/60 flex items-center gap-1 text-xs">
                        <AlertTriangle className="h-3 w-3" />
                        High Price
                      </Badge>
                    )}
                    {ind?.slow && (
                      <Badge className="bg-red-900/60 text-red-300 border-red-800 hover:bg-red-900/60 flex items-center gap-1 text-xs">
                        <Clock className="h-3 w-3" />
                        Slow
                      </Badge>
                    )}
                  </div>
                </TableCell>

                {/* AI Insight */}
                {hasNotes && (
                  <TableCell className="align-top max-w-xs">
                    <span className="text-sm text-gray-400 leading-relaxed">
                      {notesMap[response.supplier_email] ?? '—'}
                    </span>
                  </TableCell>
                )}

                {/* Date */}
                <TableCell className="text-right text-xs text-gray-500 whitespace-nowrap align-top">
                  {new Date(response.created_at).toISOString().split('T')[0]}
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </Card>
  )
}
