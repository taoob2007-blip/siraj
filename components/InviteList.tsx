'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Copy, CheckCircle } from 'lucide-react'
import { useState } from 'react'

interface Invite {
  id: string
  supplier_email: string
  token: string
  responded: boolean
  responded_at?: string
  created_at: string
}

interface InviteListProps {
  rfqId: string
  invites: Invite[]
  baseUrl: string
}

export function InviteList({ rfqId, invites, baseUrl }: InviteListProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const copyLink = (inviteId: string, token: string) => {
    const link = `${baseUrl}/form/${rfqId}?token=${token}`
    navigator.clipboard.writeText(link)
    setCopiedId(inviteId)
    setTimeout(() => setCopiedId(null), 2000)
  }

  if (invites.length === 0) {
    return (
      <Card className="border-gray-700 bg-gray-900 p-6">
        <p className="text-gray-400">No invitations sent yet.</p>
      </Card>
    )
  }

  return (
    <Card className="border-gray-700 bg-gray-900 p-6">
      <div className="space-y-4">
        <h3 className="font-semibold text-lg">Invitations ({invites.length})</h3>
        <div className="space-y-3">
          {invites.map((invite) => (
            <div
              key={invite.id}
              className="flex items-center justify-between rounded-lg border border-gray-700 bg-gray-800 p-4"
            >
              <div className="flex-1">
                <p className="font-medium text-white">{invite.supplier_email}</p>
                <p className="text-xs text-gray-500 mt-1">
                  Sent {new Date(invite.created_at).toISOString().split('T')[0]}
                </p>
              </div>

              <div className="flex items-center gap-3">
                {invite.responded ? (
                  <Badge className="bg-green-900 text-green-200 hover:bg-green-900 flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" />
                    Responded
                  </Badge>
                ) : (
                  <Badge variant="outline" className="border-yellow-700 text-yellow-200">
                    Pending
                  </Badge>
                )}

                <Button
                  onClick={() => copyLink(invite.id, invite.token)}
                  variant="outline"
                  size="sm"
                  className="border-gray-600 hover:bg-gray-700"
                >
                  {copiedId === invite.id ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  )
}
