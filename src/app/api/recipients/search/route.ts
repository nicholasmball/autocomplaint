import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/recipients/search?q=...&type=company|regulator
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const q = request.nextUrl.searchParams.get('q')?.trim()
  const type = request.nextUrl.searchParams.get('type') || 'company'

  if (!q || q.length < 2) {
    return NextResponse.json({ results: [] })
  }

  const query = q.slice(0, 100)

  try {
    if (type === 'company') {
      const { data, error } = await supabase
        .from('companies')
        .select('id, name, sector, complaint_email')
        .ilike('name', `%${query}%`)
        .order('name')
        .limit(10)

      if (error) throw error
      return NextResponse.json({ results: data || [] })
    }

    if (type === 'regulator') {
      const { data, error } = await supabase
        .from('regulators')
        .select('id, name, abbreviation, sector, complaint_email, website, description')
        .or(`name.ilike.%${query}%,abbreviation.ilike.%${query}%`)
        .order('name')
        .limit(10)

      if (error) throw error
      return NextResponse.json({ results: data || [] })
    }

    return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
  } catch (error) {
    console.error('Recipient search failed:', error)
    return NextResponse.json({ error: 'Search failed' }, { status: 500 })
  }
}
