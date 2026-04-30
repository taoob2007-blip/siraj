'use client'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'

interface InvalidTokenErrorProps {
  reason?: string
}

export function InvalidTokenError({ reason }: InvalidTokenErrorProps) {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <Card className="border-red-900 bg-red-950 p-8 max-w-md">
        <div className="flex flex-col items-center gap-4 text-center">
          <AlertTriangle className="h-12 w-12 text-red-400" />
          <h1 className="text-2xl font-bold text-red-200">Invalid Access</h1>
          <p className="text-red-300">
            {reason || 'This invitation link is invalid, expired, or has already been used.'}
          </p>
          <p className="text-sm text-red-400">
            Please request a new invitation from the buyer.
          </p>
          <Button
            onClick={() => window.location.href = '/'}
            variant="outline"
            className="mt-4 border-red-700 hover:bg-red-900"
          >
            Go to Home
          </Button>
        </div>
      </Card>
    </div>
  )
}
