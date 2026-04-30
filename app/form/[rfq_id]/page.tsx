import { getServerSupabaseClient } from '@/lib/supabase/server'
import { SupplierFormPageClient } from '@/components/SupplierFormPageClient'
import { InvalidTokenError } from '@/components/InvalidTokenError'
import type { RFQField } from '@/lib/types'
import { DEFAULT_RFQ_FIELDS } from '@/lib/types'

interface FormPageProps {
  params: { rfq_id: string }
  searchParams: { token?: string; invite?: string }
}

export default async function SupplierFormPage({ params, searchParams }: FormPageProps) {
  const rfqId    = params.rfq_id
  const token    = searchParams.token
  const inviteId = searchParams.invite

  if (!token) {
    return (
      <InvalidTokenError reason="Missing access token. Please use the link provided by the buyer." />
    )
  }

  try {
    const supabase = await getServerSupabaseClient()

    const { data: inviteData, error: inviteError } = await supabase
      .from('rfq_invites')
      .select('id, rfq_id, supplier_email, responded, clicked_at')
      .eq('token', token)
      .eq('rfq_id', rfqId)
      .single()

    if (inviteError || !inviteData) {
      return <InvalidTokenError reason="Invalid or expired access token." />
    }

    if (inviteId && !inviteData.clicked_at) {
      await supabase
        .from('rfq_invites')
        .update({ clicked_at: new Date().toISOString() })
        .eq('id', inviteId)
        .is('clicked_at', null)
      console.log('Invite clicked:', inviteId)
    }

    if (inviteData.responded) {
      return (
        <InvalidTokenError reason="Response already submitted. You cannot submit again." />
      )
    }

    const { data: rfqData, error: rfqError } = await supabase
      .from('rfqs')
      .select('id, title, description, form_schema')
      .eq('id', rfqId)
      .single()

    if (rfqError || !rfqData) {
      return <InvalidTokenError reason="Request for quotation not found." />
    }

    const fields: RFQField[] =
      Array.isArray(rfqData.form_schema) && rfqData.form_schema.length > 0
        ? rfqData.form_schema
        : DEFAULT_RFQ_FIELDS

    return (
      <div className="flex flex-col gap-8">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-wider text-gray-500">Supplier Quotation Form</p>
          <h1 className="text-3xl font-bold">Submit Your Quote</h1>
          <p className="text-gray-400">Please provide your quotation details below.</p>
        </div>

        <div className="max-w-2xl">
          <SupplierFormPageClient
            rfqId={rfqId}
            rfqTitle={rfqData.title}
            rfqDescription={rfqData.description}
            supplierEmail={inviteData.supplier_email}
            token={token}
            fields={fields}
          />
        </div>
      </div>
    )
  } catch (error) {
    console.error('Form page error:', error)
    return <InvalidTokenError reason="An error occurred while loading this form." />
  }
}
