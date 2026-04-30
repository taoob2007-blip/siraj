'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Copy, CheckCircle2, ChevronDown, Clock, Users } from 'lucide-react'

interface Invite {
  id: string
  supplier_email: string
  token: string
  responded: boolean
  responded_at?: string
  created_at: string
}

interface Props {
  rfqId: string
  invites: Invite[]
  baseUrl: string
}

export function SupplierInvitationsAccordion({ rfqId, invites, baseUrl }: Props) {
  const [open, setOpen] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const respondedCount = invites.filter((i) => i.responded).length
  const pendingCount = invites.length - respondedCount
  const allResponded = invites.length > 0 && pendingCount === 0

  function copyLink(inviteId: string, token: string) {
    navigator.clipboard.writeText(`${baseUrl}/form/${rfqId}?token=${token}`)
    setCopiedId(inviteId)
    setTimeout(() => setCopiedId(null), 2000)
  }

  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900 overflow-hidden">

      {/* ── Header / toggle ───────────────────────────────────────── */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-800/60 transition-colors group"
      >
        <div className="flex items-center gap-3">
          <div className="p-1.5 rounded-lg bg-gray-800 group-hover:bg-gray-700 transition-colors">
            <Users className="h-3.5 w-3.5 text-gray-400" />
          </div>
          <span className="text-sm font-semibold text-white">
            Supplier Invitations
          </span>
          <span className="text-xs text-gray-600 font-mono">({invites.length})</span>

          {invites.length > 0 && (
            allResponded ? (
              <Badge className="bg-green-500/10 text-green-300 border-green-500/25 text-xs flex items-center gap-1 px-2 py-0">
                <CheckCircle2 className="h-3 w-3" />
                All responded
              </Badge>
            ) : (
              <Badge className="bg-yellow-500/10 text-yellow-300 border-yellow-500/25 text-xs flex items-center gap-1 px-2 py-0">
                <Clock className="h-3 w-3" />
                {pendingCount} waiting
              </Badge>
            )
          )}
        </div>

        <ChevronDown
          className={`h-4 w-4 text-gray-500 transition-transform duration-300 ease-in-out ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* ── Collapsible content ───────────────────────────────────── */}
      <div
        className="overflow-hidden transition-[max-height] duration-350 ease-in-out"
        style={{
          maxHeight: open ? `${Math.max(invites.length * 72 + 32, 120)}px` : '0px',
        }}
      >
        <div className="border-t border-gray-800 px-5 py-4 space-y-2">
          {invites.length === 0 ? (
            <p className="text-sm text-gray-600 text-center py-2">
              No invitations sent yet.
            </p>
          ) : (
            invites.map((invite, idx) => (
              <div
                key={invite.id}
                className="flex items-center justify-between rounded-lg border border-gray-800 bg-gray-800/40 px-4 py-3 hover:border-gray-700 hover:bg-gray-800/80 transition-all duration-150"
                style={{
                  opacity: open ? 1 : 0,
                  transform: open ? 'translateY(0)' : 'translateY(-4px)',
                  transition: `opacity 200ms ease ${idx * 35}ms, transform 200ms ease ${idx * 35}ms, background-color 150ms, border-color 150ms`,
                }}
              >
                {/* Email + date */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {invite.supplier_email}
                  </p>
                  <p className="text-xs text-gray-600 mt-0.5">
                    Invited {new Date(invite.created_at).toISOString().split('T')[0]}
                    {invite.responded && invite.responded_at && (
                      <span className="text-green-600 ml-2">
                        · Replied {new Date(invite.responded_at).toISOString().split('T')[0]}
                      </span>
                    )}
                  </p>
                </div>

                {/* Status + copy */}
                <div className="flex items-center gap-2 shrink-0 ml-3">
                  {invite.responded ? (
                    <Badge className="bg-green-500/10 text-green-300 border-green-500/25 text-xs flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      Responded
                    </Badge>
                  ) : (
                    <Badge className="bg-yellow-500/10 text-yellow-300 border-yellow-500/25 text-xs">
                      Pending
                    </Badge>
                  )}

                  <button
                    onClick={() => copyLink(invite.id, invite.token)}
                    title="Copy invite link"
                    className="p-1.5 rounded-md text-gray-600 hover:text-white hover:bg-gray-700 transition-colors"
                  >
                    {copiedId === invite.id ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-green-400" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
