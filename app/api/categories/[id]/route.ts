import { NextRequest, NextResponse } from 'next/server'
import { getServerSupabaseClient } from '@/lib/supabase/server'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await getServerSupabaseClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data, error } = await supabase
      .from('categories')
      .select(`
        id, name, created_at,
        category_suppliers ( id, supplier_email, supplier_name, created_at )
      `)
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single()

    if (error || !data) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const emails = (data.category_suppliers ?? []).map((s) => s.supplier_email)

    let stats = {
      avg_price:       null as number | null,
      avg_delivery:    null as number | null,
      last_response_at: null as string | null,
    }

    if (emails.length > 0) {
      const { data: responses } = await supabase
        .from('responses')
        .select('price, delivery_days, created_at')
        .in('supplier_email', emails)

      if (responses && responses.length > 0) {
        const prices     = responses.map((r) => Number(r.price)).filter((n) => !isNaN(n) && n > 0)
        const deliveries = responses.map((r) => Number(r.delivery_days)).filter((n) => !isNaN(n) && n > 0)
        const dates      = responses.map((r) => r.created_at as string).filter(Boolean).sort().reverse()

        stats = {
          avg_price:        prices.length     ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length)         : null,
          avg_delivery:     deliveries.length ? Math.round(deliveries.reduce((a, b) => a + b, 0) / deliveries.length) : null,
          last_response_at: dates[0] ?? null,
        }
      }
    }

    return NextResponse.json({ category: data, stats })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await getServerSupabaseClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: cat } = await supabase
      .from('categories')
      .select('id')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single()

    if (!cat) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', params.id)
      .eq('user_id', user.id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
