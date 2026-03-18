import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// POST /api/complaints — create a complaint draft (R2)
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { recipientType, recipientName, recipientEmail, category, tone, description, desiredOutcome } = body as Record<string, string>

  // Validate required fields
  const missing = []
  if (!recipientType) missing.push('recipientType')
  if (!recipientName) missing.push('recipientName')
  if (!category) missing.push('category')
  if (!tone) missing.push('tone')
  if (!description) missing.push('description')
  if (!desiredOutcome) missing.push('desiredOutcome')

  if (missing.length > 0) {
    return NextResponse.json(
      { error: `Missing required fields: ${missing.join(', ')}` },
      { status: 400 }
    )
  }

  const { data, error } = await supabase
    .from('complaints')
    .insert({
      user_id: user.id,
      recipient_type: recipientType,
      recipient_name: recipientName,
      recipient_email: recipientEmail || '',
      category,
      tone,
      description,
      desired_outcome: desiredOutcome,
      date_of_incident: (body.dateOfIncident as string) || null,
      reference_numbers: (body.referenceNumbers as string) || null,
      previous_contact: (body.previousContact as string) || null,
      mp_details: body.mpDetails ? JSON.parse(JSON.stringify(body.mpDetails)) : null,
      status: 'draft',
    })
    .select('id')
    .single()

  if (error) {
    console.error('Failed to create complaint:', error)
    return NextResponse.json({ error: 'Failed to save complaint' }, { status: 500 })
  }

  return NextResponse.json({ id: data.id }, { status: 201 })
}
