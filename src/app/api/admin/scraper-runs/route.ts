import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/admin/scraper-runs — fetch recent scraper run history
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: runs, error } = await supabase
    .from('scraper_runs')
    .select('id, started_at, completed_at, total_processed, updated_count, error_count, trigger, results')
    .order('started_at', { ascending: false })
    .limit(10)

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch scraper runs' }, { status: 500 })
  }

  return NextResponse.json({ runs: runs ?? [] })
}
