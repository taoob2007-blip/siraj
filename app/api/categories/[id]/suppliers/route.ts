import { NextRequest, NextResponse } from 'next/server'
import { getServerSupabaseClient } from '@/lib/supabase/server'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await getServerSupabaseClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body  = await req.json()
    const email = body?.supplier_email?.trim().toLowerCase()
    const name  = body?.supplier_name?.trim() || email?.split('@')[0] || ''

    if (!email) return NextResponse.json({ error: 'supplier_email is required' }, { status: 400 })
    if (!EMAIL_RE.test(email)) return NextResponse.json({ error: 'Invalid email address' }, { status: 400 })

    // Verify the category belongs to this user
    const { data: cat } = await supabase
      .from('categories')
      .select('id')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single()

    if (!cat) return NextResponse.json({ error: 'Category not found' }, { status: 404 })

    // Ensure supplier exists in the suppliers table
    await supabase
      .from('suppliers')
      .upsert(
        { user_id: user.id, email, name },
        { onConflict: 'user_id,email', ignoreDuplicates: true }
      )

    const { data, error } = await supabase
      .from('category_suppliers')
      .upsert(
        { category_id: params.id, supplier_email: email, supplier_name: name },
        { onConflict: 'category_id,supplier_email', ignoreDuplicates: false }
      )
      .select('id, supplier_email, supplier_name, created_at')
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ supplier: data }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await getServerSupabaseClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body  = await req.json()
    const email = body?.supplier_email?.trim().toLowerCase()
    if (!email) return NextResponse.json({ error: 'supplier_email is required' }, { status: 400 })

    // Verify category ownership
    const { data: cat } = await supabase
      .from('categories')
      .select('id')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single()

    if (!cat) return NextResponse.json({ error: 'Category not found' }, { status: 404 })

    const { error } = await supabase
      .from('category_suppliers')
      .delete()
      .eq('category_id', params.id)
      .eq('supplier_email', email)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
