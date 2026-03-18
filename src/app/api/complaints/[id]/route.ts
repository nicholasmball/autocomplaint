import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// PATCH /api/complaints/[id] — update complaint status/content (R2)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  // Validate UUID format
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    return NextResponse.json({ error: 'Invalid complaint ID' }, { status: 400 })
  }

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  // Only allow specific fields to be updated
  const allowedFields: Record<string, string> = {
    status: 'status',
    deliveryMethod: 'delivery_method',
    generatedLetter: 'generated_letter',
    generatedSubject: 'generated_subject',
    recipientEmail: 'recipient_email',
  }

  const updates: Record<string, unknown> = {}
  for (const [key, dbField] of Object.entries(allowedFields)) {
    if (body[key] !== undefined) {
      updates[dbField] = body[key]
    }
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
  }

  // Validate status transitions
  if (updates.status) {
    const validStatuses = ['draft', 'generated', 'reviewed', 'delivered', 'sent']
    if (!validStatuses.includes(updates.status as string)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }
  }

  const { data, error } = await supabase
    .from('complaints')
    .update(updates)
    .eq('id', id)
    .eq('user_id', user.id)
    .select('id, status, delivery_method')
    .single()

  if (error) {
    console.error('Failed to update complaint:', error)
    return NextResponse.json({ error: 'Failed to update complaint' }, { status: 500 })
  }

  if (!data) {
    return NextResponse.json({ error: 'Complaint not found' }, { status: 404 })
  }

  return NextResponse.json(data)
}

// GET /api/complaints/[id] — fetch single complaint
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  const { data, error } = await supabase
    .from('complaints')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (error || !data) {
    return NextResponse.json({ error: 'Complaint not found' }, { status: 404 })
  }

  return NextResponse.json(data)
}
