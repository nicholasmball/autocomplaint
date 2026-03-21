import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { validateRecipient, type ScrapeResult, type RecipientTable } from '@/services/contact-scraper'

const VALID_TABLES: RecipientTable[] = ['companies', 'councils', 'regulators']

// Select fields differ by table — councils/regulators have a website column
function getSelectFields(table: RecipientTable): string {
  if (table === 'companies') return 'id, name, complaint_email'
  return 'id, name, complaint_email, website'
}

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

  const table = (body.table as RecipientTable) || 'companies'
  if (!VALID_TABLES.includes(table)) {
    return NextResponse.json({ error: 'Invalid table. Must be: companies, councils, or regulators' }, { status: 400 })
  }

  const recipientId = (body.recipientId || body.companyId) as string | undefined
  const dryRun = body.dryRun !== false // default true
  const useJsRendering = body.useJsRendering !== false // default true

  // Fetch recipients to validate
  type Recipient = { id: string; name: string; complaint_email: string; website?: string }

  let query = supabase.from(table).select(getSelectFields(table))

  if (recipientId) {
    query = query.eq('id', recipientId)
  }

  const { data, error } = await query.order('name')
  const recipients = data as Recipient[] | null

  if (error) {
    return NextResponse.json({ error: `Failed to fetch ${table}` }, { status: 500 })
  }

  if (!recipients || recipients.length === 0) {
    return NextResponse.json({ error: `No ${table} found` }, { status: 404 })
  }

  // Create scraper run record (skip for dry runs)
  let runId: string | null = null
  if (!dryRun) {
    const { data: run } = await supabase
      .from('scraper_runs')
      .insert({
        trigger: 'manual' as const,
        started_at: new Date().toISOString(),
        target_table: table,
      })
      .select('id')
      .single()
    runId = run?.id ?? null
  }

  const results: ScrapeResult[] = []
  const summary = { total: recipients.length, verified: 0, updated: 0, not_found: 0, errors: 0 }

  for (const recipient of recipients) {
    const result = await validateRecipient(recipient, { useJsRendering, table })
    results.push(result)

    // Update DB if not dry run and email was found with a diff
    if (!dryRun && result.status === 'updated' && result.foundEmail) {
      const { error: updateError } = await supabase
        .from(table)
        .update({ complaint_email: result.foundEmail })
        .eq('id', recipient.id)

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
        total_processed: recipients.length,
        updated_count: summary.updated,
        error_count: summary.errors,
        results: JSON.parse(JSON.stringify(results)),
      })
      .eq('id', runId)
  }

  return NextResponse.json({ results, summary, table, dryRun, runId })
}
