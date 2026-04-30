'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card } from '@/components/ui/card'
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react'
import type { RFQField } from '@/lib/types'

interface SupplierResponseFormProps {
  rfqId: string
  rfqTitle: string
  rfqDescription?: string
  supplierEmail: string
  token: string
  fields: RFQField[]
  onSuccess: () => void
}

export function SupplierResponseForm({
  rfqTitle,
  rfqDescription,
  supplierEmail,
  token,
  fields,
  onSuccess,
}: SupplierResponseFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [answers, setAnswers] = useState<Record<string, string>>(() =>
    Object.fromEntries(fields.map((f) => [f.id, '']))
  )

  const setAnswer = (id: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [id]: value }))
    setError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Client-side validation for required fields
    for (const field of fields.filter((f) => f.required)) {
      if (!answers[field.id]?.trim()) {
        setError(`${field.label} is required`)
        return
      }
      if (field.type === 'number') {
        const num = parseFloat(answers[field.id])
        if (isNaN(num) || num < 0) {
          setError(`${field.label} must be a valid positive number`)
          return
        }
      }
    }

    setIsLoading(true)

    try {
      const res = await fetch('/api/responses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, answers }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to submit response')

      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="flex items-center gap-3 rounded-lg border border-red-900 bg-red-950 px-4 py-3">
          <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0" />
          <p className="text-sm text-red-200">{error}</p>
        </div>
      )}

      {/* RFQ Info */}
      <Card className="border-gray-700 bg-gray-900 p-5">
        <p className="text-xs uppercase tracking-wider text-gray-500 mb-1">Request for Quotation</p>
        <h2 className="text-xl font-semibold text-white">{rfqTitle}</h2>
        {rfqDescription && (
          <p className="text-sm text-gray-400 mt-2">{rfqDescription}</p>
        )}
        <p className="text-xs text-gray-600 mt-3">Submitting as: {supplierEmail}</p>
      </Card>

      {/* Dynamic fields */}
      {fields.map((field) => (
        <Card key={field.id} className="border-gray-700 bg-gray-900 p-5">
          <div className="space-y-2">
            <Label htmlFor={field.id} className="text-base font-semibold text-white">
              {field.label}
              {field.required && <span className="text-red-400 ml-1">*</span>}
            </Label>

            {field.type === 'textarea' && (
              <Textarea
                id={field.id}
                placeholder={`Enter ${field.label.toLowerCase()}...`}
                value={answers[field.id] ?? ''}
                onChange={(e) => setAnswer(field.id, e.target.value)}
                disabled={isLoading}
                rows={3}
                className="border-gray-600 bg-gray-800 text-white placeholder:text-gray-500"
              />
            )}

            {field.type === 'number' && (
              <div className="flex gap-2 items-center">
                {field.unit && field.unit.length <= 3 && (
                  <span className="flex items-center rounded-l-lg border border-r-0 border-gray-600 bg-gray-800 px-3 py-1.5 text-gray-400 text-sm">
                    {field.unit}
                  </span>
                )}
                <Input
                  id={field.id}
                  type="number"
                  step="any"
                  min="0"
                  placeholder="0"
                  value={answers[field.id] ?? ''}
                  onChange={(e) => setAnswer(field.id, e.target.value)}
                  disabled={isLoading}
                  className={`border-gray-600 bg-gray-800 text-white placeholder:text-gray-500 ${
                    field.unit && field.unit.length <= 3 ? 'border-l-0' : ''
                  }`}
                />
                {field.unit && field.unit.length > 3 && (
                  <span className="text-gray-400 text-sm">{field.unit}</span>
                )}
              </div>
            )}

            {field.type === 'text' && (
              <div className="flex gap-2 items-center">
                <Input
                  id={field.id}
                  type="text"
                  placeholder={`Enter ${field.label.toLowerCase()}...`}
                  value={answers[field.id] ?? ''}
                  onChange={(e) => setAnswer(field.id, e.target.value)}
                  disabled={isLoading}
                  className="border-gray-600 bg-gray-800 text-white placeholder:text-gray-500"
                />
                {field.unit && (
                  <span className="text-gray-400 text-sm whitespace-nowrap">{field.unit}</span>
                )}
              </div>
            )}

            {field.type === 'select' && field.options && (
              <select
                id={field.id}
                value={answers[field.id] ?? ''}
                onChange={(e) => setAnswer(field.id, e.target.value)}
                disabled={isLoading}
                className="w-full h-8 rounded-lg border border-gray-600 bg-gray-800 text-white text-sm px-2 outline-none focus:border-blue-500 disabled:opacity-50"
              >
                <option value="">Select {field.label}...</option>
                {field.options.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            )}
          </div>
        </Card>
      ))}

      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={isLoading} size="lg" className="min-w-[180px]">
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              <CheckCircle className="mr-2 h-4 w-4" />
              Submit Quotation
            </>
          )}
        </Button>
      </div>

      <p className="text-xs text-gray-500">
        * Required fields. Your email will not be shared with other suppliers.
      </p>
    </form>
  )
}
