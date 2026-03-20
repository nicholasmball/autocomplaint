import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { validateCompany, type ScrapeResult } from '@/services/contact-scraper'

const BATCH_LIMIT = 5
const STALE_DAYS = 30

export async function GET(request: NextRequest) {
  // Verify Vercel Cron secret
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createServiceClient()

  // Calculate staleness cutoff
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - STALE_DAYS)

  // Fetch companies with empty or stale emails, limited to batch size
  const { data: companies, error: fetchError } = await supabase
    .from('companies')
    .select('id, name, complaint_email')
    .or(`complaint_email.eq.,complaint_email.is.null,updated_at.lt.${cutoff.toISOString()}`)
    .order('updated_at', { ascending: true })
    .limit(BATCH_LIMIT)

  if (fetchError) {
    return NextResponse.json({ error: 'Failed to fetch companies' }, { status: 500 })
  }

  if (!companies || companies.length === 0) {
    return NextResponse.json({ message: 'No stale companies to process' })
  }

  // Create scraper run record
  const { data: run, error: runError } = await supabase
    .from('scraper_runs')
    .insert({ trigger: 'cron', started_at: new Date().toISOString() })
    .select('id')
    .single()

  if (runError || !run) {
    return NextResponse.json({ error: 'Failed to create scraper run' }, { status: 500 })
  }

  const results: ScrapeResult[] = []
  let updatedCount = 0
  let errorCount = 0

  for (const company of companies) {
    const result = await validateCompany(company)
    results.push(result)

    // Update DB if email was found with a diff
    if (result.status === 'updated' && result.foundEmail) {
      const { error: updateError } = await supabase
        .from('companies')
        .update({ complaint_email: result.foundEmail })
        .eq('id', company.id)

      if (updateError) {
        result.status = 'error'
        result.error = 'DB update failed'
      }
    }

    if (result.status === 'updated') updatedCount++
    if (result.status === 'error') errorCount++
  }

  // Update the run record with results
  await supabase
    .from('scraper_runs')
    .update({
      completed_at: new Date().toISOString(),
      total_processed: companies.length,
      updated_count: updatedCount,
      error_count: errorCount,
      results: JSON.parse(JSON.stringify(results)),
    })
    .eq('id', run.id)

  return NextResponse.json({
    runId: run.id,
    total: companies.length,
    updated: updatedCount,
    errors: errorCount,
  })
}
