'use client'

import { useState, useEffect, useCallback } from 'react'

type TableName = 'companies' | 'councils' | 'regulators'

interface Recipient {
  id: string
  name: string
  complaint_email: string
  sector?: string
  council_type?: string
  region?: string
  abbreviation?: string
  website?: string
  description?: string
}

interface ScraperRunResult {
  companyName: string
  status: 'verified' | 'updated' | 'not_found' | 'error'
  foundEmail: string | null
  confidence: 'high' | 'medium' | 'low' | 'none'
  error?: string
}

interface ScraperRun {
  id: string
  started_at: string
  completed_at: string | null
  total_processed: number
  updated_count: number
  error_count: number
  trigger: 'manual' | 'cron'
  results: ScraperRunResult[]
}

const TABS: { value: TableName; label: string }[] = [
  { value: 'companies', label: 'Companies' },
  { value: 'councils', label: 'Councils' },
  { value: 'regulators', label: 'Regulators' },
]

const COUNCIL_TYPES = ['county', 'district', 'unitary', 'metropolitan', 'london_borough']

function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'today'
  if (diffDays === 1) return '1 day ago'
  return `${diffDays} days ago`
}

function getStalenessColor(dateStr: string | null): string {
  if (!dateStr) return 'bg-red-400'
  const diffDays = Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24))
  if (diffDays <= 14) return 'bg-green-400'
  if (diffDays <= 30) return 'bg-amber-400'
  return 'bg-red-400'
}

function getStalenessTextColor(dateStr: string | null): string {
  if (!dateStr) return 'text-red-500'
  const diffDays = Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24))
  if (diffDays <= 14) return 'text-slate-400'
  if (diffDays <= 30) return 'text-amber-500'
  return 'text-red-500'
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const STATUS_COLORS: Record<string, string> = {
  verified: 'text-blue-600 dark:text-blue-400',
  updated: 'text-green-600 dark:text-green-400',
  not_found: 'text-slate-500 dark:text-slate-400',
  error: 'text-red-500 dark:text-red-400',
}

const CONFIDENCE_STYLES: Record<string, string> = {
  high: 'bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300',
  medium: 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
  low: 'bg-orange-50 text-orange-700 dark:bg-orange-950 dark:text-orange-300',
  none: 'bg-slate-50 text-slate-400 dark:bg-slate-800 dark:text-slate-500',
}

export default function RecipientsAdminPage() {
  const [table, setTable] = useState<TableName>('companies')
  const [data, setData] = useState<Recipient[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [editing, setEditing] = useState<string | null>(null)
  const [editValues, setEditValues] = useState<Record<string, string>>({})
  const [adding, setAdding] = useState(false)
  const [newRecord, setNewRecord] = useState<Record<string, string>>({})

  // Scraper history state
  const [scraperRuns, setScraperRuns] = useState<ScraperRun[]>([])
  const [historyOpen, setHistoryOpen] = useState(false)
  const [expandedRun, setExpandedRun] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ table, page: String(page) })
      if (search) params.set('q', search)
      const res = await fetch(`/api/admin/recipients?${params}`)
      if (!res.ok) throw new Error()
      const json = await res.json()
      setData(json.data)
      setTotal(json.total)
      setTotalPages(json.totalPages)
    } catch {
      setData([])
    } finally {
      setLoading(false)
    }
  }, [table, page, search])

  const fetchScraperRuns = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/scraper-runs')
      if (!res.ok) return
      const json = await res.json()
      setScraperRuns(json.runs)
    } catch {
      // silently fail
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])
  useEffect(() => { fetchScraperRuns() }, [fetchScraperRuns])

  function switchTable(t: TableName) {
    setTable(t)
    setPage(1)
    setSearch('')
    setEditing(null)
    setAdding(false)
  }

  async function saveEdit(id: string) {
    const res = await fetch('/api/admin/recipients', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ table, id, updates: editValues }),
    })
    if (res.ok) {
      setEditing(null)
      fetchData()
    }
  }

  async function deleteRecord(id: string, name: string) {
    if (!confirm(`Delete "${name}"?`)) return
    const res = await fetch('/api/admin/recipients', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ table, id }),
    })
    if (res.ok) fetchData()
  }

  async function addRecord() {
    if (!newRecord.name) return
    const record = { ...newRecord }
    if (table === 'companies' && !record.sector) record.sector = 'Other'
    if (table === 'councils' && !record.council_type) record.council_type = 'unitary'
    if (table === 'regulators' && !record.sector) record.sector = 'Other'

    const res = await fetch('/api/admin/recipients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ table, record }),
    })
    if (res.ok) {
      setAdding(false)
      setNewRecord({})
      fetchData()
    }
  }

  function startEdit(r: Recipient) {
    setEditing(r.id)
    setEditValues({
      name: r.name,
      complaint_email: r.complaint_email || '',
      ...(table === 'companies' && { sector: r.sector || '' }),
      ...(table === 'councils' && { council_type: r.council_type || '', region: r.region || '', website: r.website || '' }),
      ...(table === 'regulators' && { abbreviation: r.abbreviation || '', sector: r.sector || '', website: r.website || '', description: r.description || '' }),
    })
  }

  const lastRunDate = scraperRuns.length > 0 ? scraperRuns[0].started_at : null

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-serif text-xl">Recipient Database</h1>
        <div className="flex items-center gap-3">
          <span className={`inline-flex items-center gap-1.5 text-xs ${getStalenessTextColor(lastRunDate)}`}>
            <span className={`w-2 h-2 rounded-full ${getStalenessColor(lastRunDate)}`} />
            {lastRunDate ? `Last scraped ${formatRelativeDate(lastRunDate)}` : 'Never scraped'}
          </span>
          <span className="text-sm text-slate-400 dark:text-slate-400">{total} records</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 border-b border-slate-200 dark:border-slate-700">
        {TABS.map((t) => (
          <button
            key={t.value}
            onClick={() => switchTable(t.value)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              table === t.value
                ? 'border-amber-500 text-amber-600 dark:text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-600 dark:text-slate-400 dark:hover:text-slate-300'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Search + Add */}
      <div className="flex gap-3 mb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          placeholder="Search..."
          className="flex-1 border rounded-xl px-3 py-2 text-sm dark:bg-slate-900/50 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500"
        />
        <button
          onClick={() => { setAdding(!adding); setNewRecord({}) }}
          className="bg-slate-900 dark:bg-amber-500 text-white dark:text-slate-950 rounded-xl px-4 py-2 text-sm font-medium hover:bg-slate-800 dark:hover:bg-amber-400"
        >
          {adding ? 'Cancel' : 'Add new'}
        </button>
      </div>

      {/* Add form */}
      {adding && (
        <div className="rounded-2xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20 p-4 mb-4 space-y-3">
          <input
            type="text"
            placeholder="Name *"
            value={newRecord.name || ''}
            onChange={(e) => setNewRecord(prev => ({ ...prev, name: e.target.value }))}
            className="w-full border rounded-xl px-3 py-2 text-sm dark:bg-slate-900/50 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500"
          />
          <input
            type="email"
            placeholder="Complaint email"
            value={newRecord.complaint_email || ''}
            onChange={(e) => setNewRecord(prev => ({ ...prev, complaint_email: e.target.value }))}
            className="w-full border rounded-xl px-3 py-2 text-sm dark:bg-slate-900/50 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500"
          />
          {table === 'companies' && (
            <input
              type="text"
              placeholder="Sector"
              value={newRecord.sector || ''}
              onChange={(e) => setNewRecord(prev => ({ ...prev, sector: e.target.value }))}
              className="w-full border rounded-xl px-3 py-2 text-sm dark:bg-slate-900/50 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500"
            />
          )}
          {table === 'councils' && (
            <div className="flex gap-3">
              <select
                value={newRecord.council_type || 'unitary'}
                onChange={(e) => setNewRecord(prev => ({ ...prev, council_type: e.target.value }))}
                className="border rounded-xl px-3 py-2 text-sm dark:bg-slate-900/50 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500"
              >
                {COUNCIL_TYPES.map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
              </select>
              <input
                type="text"
                placeholder="Region"
                value={newRecord.region || ''}
                onChange={(e) => setNewRecord(prev => ({ ...prev, region: e.target.value }))}
                className="flex-1 border rounded-xl px-3 py-2 text-sm dark:bg-slate-900/50 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500"
              />
            </div>
          )}
          {table === 'regulators' && (
            <>
              <div className="flex gap-3">
                <input
                  type="text"
                  placeholder="Abbreviation"
                  value={newRecord.abbreviation || ''}
                  onChange={(e) => setNewRecord(prev => ({ ...prev, abbreviation: e.target.value }))}
                  className="w-32 border rounded-xl px-3 py-2 text-sm dark:bg-slate-900/50 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500"
                />
                <input
                  type="text"
                  placeholder="Sector"
                  value={newRecord.sector || ''}
                  onChange={(e) => setNewRecord(prev => ({ ...prev, sector: e.target.value }))}
                  className="flex-1 border rounded-xl px-3 py-2 text-sm dark:bg-slate-900/50 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500"
                />
              </div>
              <input
                type="text"
                placeholder="Description"
                value={newRecord.description || ''}
                onChange={(e) => setNewRecord(prev => ({ ...prev, description: e.target.value }))}
                className="w-full border rounded-xl px-3 py-2 text-sm dark:bg-slate-900/50 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500"
              />
            </>
          )}
          <button
            onClick={addRecord}
            disabled={!newRecord.name}
            className="bg-green-600 text-white rounded-xl px-4 py-2 text-sm font-medium hover:bg-green-700 disabled:opacity-50"
          >
            Save
          </button>
        </div>
      )}

      {/* Table */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 dark:bg-white/5">
            <tr>
              <th className="text-left px-4 py-2 font-medium text-slate-400 dark:text-slate-400">Name</th>
              {table === 'companies' && <th className="text-left px-4 py-2 font-medium text-slate-400 dark:text-slate-400">Sector</th>}
              {table === 'councils' && <th className="text-left px-4 py-2 font-medium text-slate-400 dark:text-slate-400">Type</th>}
              {table === 'regulators' && <th className="text-left px-4 py-2 font-medium text-slate-400 dark:text-slate-400">Abbr</th>}
              <th className="text-left px-4 py-2 font-medium text-slate-400 dark:text-slate-400">Email</th>
              <th className="text-right px-4 py-2 font-medium text-slate-400 dark:text-slate-400 w-28">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {loading ? (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-slate-300">Loading...</td></tr>
            ) : data.length === 0 ? (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-slate-300">No records found</td></tr>
            ) : data.map((r) => (
              <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-white/5">
                {editing === r.id ? (
                  <>
                    <td className="px-4 py-2">
                      <input
                        type="text"
                        value={editValues.name || ''}
                        onChange={(e) => setEditValues(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full border rounded px-2 py-1 text-sm dark:bg-slate-900/50 dark:border-slate-700"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="text"
                        value={editValues.sector || editValues.council_type || editValues.abbreviation || ''}
                        onChange={(e) => {
                          const key = table === 'companies' ? 'sector' : table === 'councils' ? 'council_type' : 'abbreviation'
                          setEditValues(prev => ({ ...prev, [key]: e.target.value }))
                        }}
                        className="w-full border rounded px-2 py-1 text-sm dark:bg-slate-900/50 dark:border-slate-700"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="text"
                        value={editValues.complaint_email || ''}
                        onChange={(e) => setEditValues(prev => ({ ...prev, complaint_email: e.target.value }))}
                        className="w-full border rounded px-2 py-1 text-sm dark:bg-slate-900/50 dark:border-slate-700"
                      />
                    </td>
                    <td className="px-4 py-2 text-right">
                      <button onClick={() => saveEdit(r.id)} className="text-green-600 hover:text-green-700 text-xs font-medium mr-2">Save</button>
                      <button onClick={() => setEditing(null)} className="text-slate-300 hover:text-slate-500 text-xs font-medium">Cancel</button>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="px-4 py-2 font-medium text-slate-900 dark:text-white">{r.name}</td>
                    <td className="px-4 py-2 text-slate-400 dark:text-slate-400">
                      {table === 'companies' && r.sector}
                      {table === 'councils' && r.council_type?.replace('_', ' ')}
                      {table === 'regulators' && r.abbreviation}
                    </td>
                    <td className="px-4 py-2 text-slate-400 dark:text-slate-400 truncate max-w-48">{r.complaint_email || '\u2014'}</td>
                    <td className="px-4 py-2 text-right">
                      <button onClick={() => startEdit(r)} className="text-amber-600 dark:text-amber-400 hover:text-amber-500 text-xs font-medium mr-2">Edit</button>
                      <button onClick={() => deleteRecord(r.id, r.name)} className="text-red-500 hover:text-red-600 text-xs font-medium">Delete</button>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="text-sm text-amber-600 dark:text-amber-400 hover:text-amber-500 disabled:text-slate-300 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span className="text-sm text-slate-400 dark:text-slate-400">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="text-sm text-amber-600 dark:text-amber-400 hover:text-amber-500 disabled:text-slate-300 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}

      {/* Scraper History */}
      <div className="border-t border-slate-200 dark:border-slate-700 mt-6 pt-4">
        <button
          onClick={() => setHistoryOpen(!historyOpen)}
          aria-expanded={historyOpen}
          className="flex items-center justify-between w-full text-left group"
        >
          <div className="flex items-center gap-2">
            <svg
              className={`w-4 h-4 text-slate-400 transition-transform ${historyOpen ? 'rotate-90' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <span className="text-sm font-medium text-slate-700 dark:text-white">Scraper History</span>
            {scraperRuns.length > 0 && (
              <span className="text-xs text-slate-400">{scraperRuns.length} runs</span>
            )}
          </div>
        </button>

        {historyOpen && (
          <div className="mt-4 space-y-2">
            {scraperRuns.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 dark:border-slate-700 p-8 text-center">
                <p className="text-sm text-slate-400 mb-1">No scraper runs yet</p>
                <p className="text-xs text-slate-300 dark:text-slate-500">
                  The scraper runs weekly on Sundays at 02:00 UTC, or manually from the scraper API.
                </p>
              </div>
            ) : (
              scraperRuns.map((run) => (
                <div key={run.id} className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                  <button
                    onClick={() => setExpandedRun(expandedRun === run.id ? null : run.id)}
                    aria-expanded={expandedRun === run.id}
                    className="flex items-center justify-between w-full px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-white/5"
                  >
                    <div className="flex items-center gap-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        run.trigger === 'cron'
                          ? 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                          : 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                      }`}>
                        {run.trigger}
                      </span>
                      <span className="text-sm text-slate-700 dark:text-slate-200 font-medium">
                        {formatDate(run.started_at)}
                      </span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-xs text-slate-500 dark:text-slate-400">{run.total_processed} processed</span>
                      <span className="text-xs text-green-600 dark:text-green-400 font-medium">{run.updated_count} updated</span>
                      {run.error_count > 0 ? (
                        <span className="text-xs text-red-500 dark:text-red-400">{run.error_count} errors</span>
                      ) : (
                        <span className="text-xs text-slate-400 dark:text-slate-500">0 errors</span>
                      )}
                      <svg
                        className={`w-4 h-4 text-slate-300 dark:text-slate-500 transition-transform ${expandedRun === run.id ? 'rotate-90' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </button>

                  {expandedRun === run.id && run.results.length > 0 && (
                    <div className="px-4 py-3 border-t border-slate-100 dark:border-slate-800">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="text-slate-400 dark:text-slate-500">
                            <th className="text-left py-1 font-medium">Company</th>
                            <th className="text-left py-1 font-medium">Status</th>
                            <th className="text-left py-1 font-medium">Email found</th>
                            <th className="text-left py-1 font-medium">Confidence</th>
                          </tr>
                        </thead>
                        <tbody className="text-slate-600 dark:text-slate-300">
                          {run.results.map((result, i) => (
                            <tr key={i} className="border-t border-slate-50 dark:border-slate-800">
                              <td className="py-1.5">{result.companyName}</td>
                              <td className="py-1.5">
                                <span className={`font-medium ${STATUS_COLORS[result.status] || ''}`}>
                                  {result.status}
                                </span>
                              </td>
                              <td className="py-1.5 text-slate-400 dark:text-slate-500">
                                {result.foundEmail || '\u2014'}
                              </td>
                              <td className="py-1.5">
                                <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${CONFIDENCE_STYLES[result.confidence] || ''}`}>
                                  {result.confidence}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}
