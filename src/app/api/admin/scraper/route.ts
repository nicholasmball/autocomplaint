import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { validateCompany, type ScrapeResult } from '@/services/contact-scraper'

// POST /api/admin/scraper — trigger contact validation
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
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const companyId = body.companyId as string | undefined
  const dryRun = body.dryRun !== false // default true

  // Fetch companies to validate
  let query = supabase.from('companies').select('id, name, complaint_email')

  if (companyId) {
    query = query.eq('id', companyId)
  }

  const { data: companies, error } = await query.order('name')

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch companies' }, { status: 500 })
  }

  if (!companies || companies.length === 0) {
    return NextResponse.json({ error: 'No companies found' }, { status: 404 })
  }

  // Create scraper run record (skip for dry runs)
  let runId: string | null = null
  if (!dryRun) {
    const { data: run } = await supabase
      .from('scraper_runs')
      .insert({ trigger: 'manual' as const, started_at: new Date().toISOString() })
      .select('id')
      .single()
    runId = run?.id ?? null
  }

  const results: ScrapeResult[] = []
  const summary = { total: companies.length, verified: 0, updated: 0, not_found: 0, errors: 0 }

  for (const company of companies) {
    const result = await validateCompany(company)
    results.push(result)

    // Update DB if not dry run and email was found with a diff
    if (!dryRun && result.status === 'updated' && result.foundEmail) {
      const { error: updateError } = await supabase
        .from('companies')
        .update({ complaint_email: result.foundEmail })
        .eq('id', company.id)

      if (updateError) {
        result.status = 'error'
        result.error = 'DB update failed'
      }
    }

    // Tally summary
    switch (result.status) {
      case 'verified': summary.verified++; break
      case 'updated': summary.updated++; break
      case 'not_found': summary.not_found++; break
      case 'error': summary.errors++; break
    }
  }

  // Finalize scraper run record
  if (!dryRun && runId) {
    await supabase
      .from('scraper_runs')
      .update({
        completed_at: new Date().toISOString(),
        total_processed: companies.length,
        updated_count: summary.updated,
        error_count: summary.errors,
        results: JSON.parse(JSON.stringify(results)),
      })
      .eq('id', runId)
  }

  return NextResponse.json({ results, summary, dryRun, runId })
}
