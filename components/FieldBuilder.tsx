'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { X, Plus, GripVertical } from 'lucide-react'
import type { RFQField } from '@/lib/types'

interface FieldBuilderProps {
  fields: RFQField[]
  onChange: (fields: RFQField[]) => void
  disabled?: boolean
}

const FIELD_TYPES: { value: RFQField['type']; label: string }[] = [
  { value: 'number', label: 'Number' },
  { value: 'text', label: 'Text' },
  { value: 'textarea', label: 'Long Text' },
  { value: 'select', label: 'Dropdown' },
]

export function FieldBuilder({ fields, onChange, disabled = false }: FieldBuilderProps) {
  const [adding, setAdding] = useState(false)
  const [newLabel, setNewLabel] = useState('')
  const [newType, setNewType] = useState<RFQField['type']>('text')
  const [newUnit, setNewUnit] = useState('')

  const addField = () => {
    if (!newLabel.trim()) return
    const baseId = newLabel.trim().toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')
    const uniqueId = fields.some((f) => f.id === baseId) ? `${baseId}_${Date.now()}` : baseId
    onChange([
      ...fields,
      {
        id: uniqueId,
        label: newLabel.trim(),
        type: newType,
        required: false,
        unit: newUnit.trim() || undefined,
      },
    ])
    setNewLabel('')
    setNewType('text')
    setNewUnit('')
    setAdding(false)
  }

  const removeField = (id: string) => onChange(fields.filter((f) => f.id !== id))

  const toggleRequired = (id: string) =>
    onChange(fields.map((f) => (f.id === id ? { ...f, required: !f.required } : f)))

  return (
    <div className="space-y-2">
      {fields.map((field) => (
        <div
          key={field.id}
          className="flex items-center gap-3 rounded-lg border border-gray-700 bg-gray-800 px-3 py-3"
        >
          <GripVertical className="h-4 w-4 text-gray-600 flex-shrink-0" />

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium text-white text-sm">{field.label}</span>
              {field.unit && (
                <span className="text-xs text-gray-500">({field.unit})</span>
              )}
              <Badge variant="outline" className="text-xs border-gray-600 text-gray-400 capitalize">
                {field.type === 'textarea' ? 'long text' : field.type}
              </Badge>
            </div>
          </div>

          <button
            type="button"
            onClick={() => toggleRequired(field.id)}
            disabled={disabled}
            className={`text-xs px-2 py-0.5 rounded border transition-colors disabled:opacity-50 ${
              field.required
                ? 'border-blue-600 text-blue-300 bg-blue-900/30'
                : 'border-gray-600 text-gray-500 hover:border-gray-500'
            }`}
          >
            {field.required ? 'Required' : 'Optional'}
          </button>

          <button
            type="button"
            onClick={() => removeField(field.id)}
            disabled={disabled}
            className="rounded p-1 hover:bg-gray-700 text-gray-500 hover:text-gray-300 disabled:opacity-50"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}

      {adding ? (
        <div className="rounded-lg border border-blue-800/50 bg-gray-800/50 p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs text-gray-400">Field Name</Label>
              <Input
                autoFocus
                placeholder="e.g., Warranty Period"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') { e.preventDefault(); addField() }
                  if (e.key === 'Escape') setAdding(false)
                }}
                className="border-gray-600 bg-gray-700 text-white placeholder:text-gray-500 h-8"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-gray-400">Type</Label>
              <select
                value={newType}
                onChange={(e) => setNewType(e.target.value as RFQField['type'])}
                className="w-full h-8 rounded-lg border border-gray-600 bg-gray-700 text-white text-sm px-2 outline-none focus:border-blue-500"
              >
                {FIELD_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
          </div>

          {(newType === 'number' || newType === 'text') && (
            <div className="space-y-1">
              <Label className="text-xs text-gray-400">Unit / Suffix (optional)</Label>
              <Input
                placeholder="e.g., $, days, %, months"
                value={newUnit}
                onChange={(e) => setNewUnit(e.target.value)}
                className="border-gray-600 bg-gray-700 text-white placeholder:text-gray-500 h-8 max-w-[220px]"
              />
            </div>
          )}

          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              onClick={addField}
              disabled={!newLabel.trim()}
              className="h-7"
            >
              Add Field
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => { setAdding(false); setNewLabel(''); setNewType('text'); setNewUnit('') }}
              className="h-7"
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setAdding(true)}
          disabled={disabled}
          className="border-gray-600 hover:bg-gray-800 text-gray-400 hover:text-white"
        >
          <Plus className="h-4 w-4 mr-1" />
          Add Field
        </Button>
      )}
    </div>
  )
}
