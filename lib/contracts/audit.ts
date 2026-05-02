import type { SupabaseClient } from '@supabase/supabase-js'

export async function logContractEvent({
  supabase,
  contractId,
  event,
  userId,
  metadata,
}: {
  supabase: SupabaseClient
  contractId: string
  event: string
  userId?: string | null
  metadata?: Record<string, unknown>
}) {
  const { error } = await supabase.from('contract_logs').insert({
    contract_id: contractId,
    event,
    user_id:     userId ?? null,
    metadata:    metadata ?? null,
  })
  if (error) {
    // Audit failures must never break the main flow
    console.error(`[AUDIT] Failed to log "${event}" for contract ${contractId}:`, error.message)
  }
}
