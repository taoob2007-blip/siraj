export const dynamic = 'force-dynamic'

import { renderToBuffer } from '@react-pdf/renderer'
import { getServerSupabaseClient } from '@/lib/supabase/server'
import { ExecutiveReport } from '@/lib/reports/generateExecutiveReport'

export async function GET() {
  try {
    const supabase = await getServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return new Response('Unauthorized', { status: 401 })

    const [{ data: contracts }, { data: rfqs }] = await Promise.all([
      supabase
        .from('contracts')
        .select('id, status, price, delivery_days, supplier_email, created_at, buyer_signature, supplier_signature')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false }),
      supabase.from('rfqs').select('id').eq('user_id', user.id),
    ])

    const generatedAt = new Date().toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })

    const buffer = await renderToBuffer(
      <ExecutiveReport
        data={{
          contracts: contracts ?? [],
          totalRFQs: rfqs?.length ?? 0,
          generatedAt,
        }}
      />,
    )

    const filename = `SIRAJ-Executive-Report-${new Date().toISOString().split('T')[0]}.pdf`

    return new Response(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    })
  } catch (err) {
    console.error('[PDF] generation failed:', err)
    return new Response('Failed to generate report', { status: 500 })
  }
}
