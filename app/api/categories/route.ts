import { NextRequest, NextResponse } from 'next/server'
import { getServerSupabaseClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await getServerSupabaseClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data, error } = await supabase
      .from('categories')
      .select(`
        id,
        name,
        created_at,
        category_suppliers ( id, supplier_email, supplier_name )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const categories = (data ?? []).map((c) => ({
      id:             c.id,
      name:           c.name,
      created_at:     c.created_at,
      supplier_count: Array.isArray(c.category_suppliers) ? c.category_suppliers.length : 0,
    }))

    return NextResponse.json({ categories })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await getServerSupabaseClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const name = body?.name?.trim()
    if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    if (name.length > 80) return NextResponse.json({ error: 'Name too long (max 80 chars)' }, { status: 400 })

    const { data, error } = await supabase
      .from('categories')
      .insert({ user_id: user.id, name })
      .select('id, name, created_at')
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ category: { ...data, supplier_count: 0 } }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
