import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/admin/recipients?table=companies|councils|regulators&q=&page=1
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const table = request.nextUrl.searchParams.get('table') || 'companies'
  const q = request.nextUrl.searchParams.get('q')?.trim() || ''
  const page = Math.max(1, parseInt(request.nextUrl.searchParams.get('page') || '1'))
  const perPage = 25

  if (!['companies', 'councils', 'regulators'].includes(table)) {
    return NextResponse.json({ error: 'Invalid table' }, { status: 400 })
  }

  let query = supabase.from(table).select('*', { count: 'exact' })

  if (q) {
    if (table === 'regulators') {
      query = query.or(`name.ilike.%${q}%,abbreviation.ilike.%${q}%`)
    } else {
      query = query.ilike('name', `%${q}%`)
    }
  }

  const { data, count, error } = await query
    .order('name')
    .range((page - 1) * perPage, page * perPage - 1)

  if (error) {
    console.error('Admin recipients query failed:', error)
    return NextResponse.json({ error: 'Query failed' }, { status: 500 })
  }

  return NextResponse.json({
    data: data || [],
    total: count || 0,
    page,
    perPage,
    totalPages: Math.ceil((count || 0) / perPage),
  })
}

// POST /api/admin/recipients — create a new recipient
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const table = body.table as string
  if (!['companies', 'councils', 'regulators'].includes(table)) {
    return NextResponse.json({ error: 'Invalid table' }, { status: 400 })
  }

  const record = body.record as Record<string, unknown>
  if (!record?.name) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 })
  }

  const { data, error } = await supabase.from(table).insert(record).select().single()

  if (error) {
    console.error('Admin insert failed:', error)
    return NextResponse.json({ error: 'Insert failed' }, { status: 500 })
  }

  return NextResponse.json(data, { status: 201 })
}

// PATCH /api/admin/recipients — update a recipient
export async function PATCH(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const table = body.table as string
  const id = body.id as string
  const updates = body.updates as Record<string, unknown>

  if (!['companies', 'councils', 'regulators'].includes(table)) {
    return NextResponse.json({ error: 'Invalid table' }, { status: 400 })
  }
  if (!id || !updates) {
    return NextResponse.json({ error: 'Missing id or updates' }, { status: 400 })
  }

  const { data, error } = await supabase.from(table).update(updates).eq('id', id).select().single()

  if (error) {
    console.error('Admin update failed:', error)
    return NextResponse.json({ error: 'Update failed' }, { status: 500 })
  }

  return NextResponse.json(data)
}

// DELETE /api/admin/recipients — delete a recipient
export async function DELETE(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const table = body.table as string
  const id = body.id as string

  if (!['companies', 'councils', 'regulators'].includes(table)) {
    return NextResponse.json({ error: 'Invalid table' }, { status: 400 })
  }
  if (!id) {
    return NextResponse.json({ error: 'Missing id' }, { status: 400 })
  }

  const { error } = await supabase.from(table).delete().eq('id', id)

  if (error) {
    console.error('Admin delete failed:', error)
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
