'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Check, Copy } from 'lucide-react'
import { CreateRFQResponse } from '@/lib/types'

interface InviteLinksProps {
  rfqId: string
  invites: CreateRFQResponse['invites']
}

export function InviteLinks({ rfqId, invites }: InviteLinksProps) {
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null)

  const copyToClipboard = (text: string, email: string) => {
    navigator.clipboard.writeText(text)
    setCopiedEmail(email)
    setTimeout(() => setCopiedEmail(null), 2000)
  }

  return (
    <Card className="border-gray-700 bg-gray-900 p-6">
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold">Invitation Links</h3>
          <p className="text-sm text-gray-400">
            Share these links with your suppliers. Each link is unique and secure.
          </p>
        </div>

        <div className="space-y-3">
          {invites.map((invite) => (
            <div
              key={invite.supplier_email}
              className="flex flex-col gap-2 rounded-lg border border-gray-700 bg-gray-800 p-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-200">
                  {invite.supplier_email}
                </span>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={invite.link}
                  readOnly
                  className="flex-1 rounded bg-gray-700 px-3 py-2 text-xs text-gray-300 font-mono"
                />
                <Button
                  onClick={() =>
                    copyToClipboard(invite.link, invite.supplier_email)
                  }
                  variant="outline"
                  size="sm"
                  className="border-gray-600 hover:bg-gray-700"
                >
                  {copiedEmail === invite.supplier_email ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          ))}
        </div>

        <div className="pt-4 border-t border-gray-700">
          <p className="text-xs text-gray-500">
            RFQ ID: <span className="font-mono text-gray-400">{rfqId}</span>
          </p>
        </div>
      </div>
    </Card>
  )
}
