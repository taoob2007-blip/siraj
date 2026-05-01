'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { X } from 'lucide-react'
import { Supplier } from '@/lib/types'

interface SupplierSelectorProps {
  suppliers: Supplier[]
  onUpdate: (suppliers: Supplier[]) => void
  isLoading?: boolean
}

export function SupplierSelector({
  suppliers,
  onUpdate,
  isLoading = false,
}: SupplierSelectorProps) {
  const [tempName, setTempName] = useState('')
  const [tempEmail, setTempEmail] = useState('')

  const addSupplier = () => {
    if (!tempName.trim() || !tempEmail.trim()) return

    const newSupplier: Supplier = {
      name: tempName.trim(),
      email: tempEmail.trim().toLowerCase(),
    }

    // Check if supplier email already exists
    if (suppliers.some((s) => s.email === newSupplier.email)) {
      alert('This supplier is already added')
      return
    }

    onUpdate([...suppliers, newSupplier])
    setTempName('')
    setTempEmail('')
  }

  const removeSupplier = (email: string) => {
    onUpdate(suppliers.filter((s) => s.email !== email))
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addSupplier()
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="supplier-name">Supplier Name</Label>
        <Input
          id="supplier-name"
          placeholder="e.g., Acme Inc"
          value={tempName}
          onChange={(e) => setTempName(e.target.value)}
          disabled={isLoading}
          className="bg-[#0d1220] border-white/[0.08] text-white placeholder:text-gray-600 focus-visible:border-blue-500/50 focus-visible:ring-1 focus-visible:ring-blue-500/20 hover:border-white/20 transition-all disabled:opacity-50"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="supplier-email">Email Address</Label>
        <Input
          id="supplier-email"
          type="email"
          placeholder="contact@acme.com"
          value={tempEmail}
          onChange={(e) => setTempEmail(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={isLoading}
          className="bg-[#0d1220] border-white/[0.08] text-white placeholder:text-gray-600 focus-visible:border-blue-500/50 focus-visible:ring-1 focus-visible:ring-blue-500/20 hover:border-white/20 transition-all disabled:opacity-50"
        />
      </div>

      <Button
        onClick={addSupplier}
        variant="outline"
        disabled={!tempName.trim() || !tempEmail.trim() || isLoading}
        className="w-full"
      >
        Add Supplier
      </Button>

      {suppliers.length > 0 && (
        <div className="space-y-2 pt-4 border-t">
          <Label className="text-sm text-gray-400">
            Added Suppliers ({suppliers.length})
          </Label>
          <div className="space-y-2">
            {suppliers.map((supplier) => (
              <div
                key={supplier.email}
                className="flex items-center justify-between rounded-lg border border-gray-700 bg-gray-900 px-3 py-2"
              >
                <div>
                  <p className="text-sm font-medium">{supplier.name}</p>
                  <p className="text-xs text-gray-400">{supplier.email}</p>
                </div>
                <button
                  onClick={() => removeSupplier(supplier.email)}
                  disabled={isLoading}
                  className="rounded p-1 hover:bg-gray-800 disabled:opacity-50"
                >
                  <X className="h-4 w-4 text-gray-400" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
