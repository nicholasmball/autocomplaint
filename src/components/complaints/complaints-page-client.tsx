'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useState, useTransition } from 'react'
import Link from 'next/link'
import {
  Complaint,
  CATEGORY_ICONS,
  CATEGORY_LABELS,
  CATEGORIES,
  STATUS_STYLES,
  STATUSES,
  RECIPIENT_TYPES,
  RESPONSE_STATUS_BADGES,
  SortOption,
  relativeDate,
} from '@/components/dashboard/types'

interface ComplaintsPageClientProps {
  complaints: Complaint[]
  totalCount: number
  currentPage: number
  totalPages: number
  filters: {
    search: string
    status: string
    category: string
    recipientType: string
    dateFrom: string
    dateTo: string
    sort: string
  }
}

const sortLabels: Record<SortOption, string> = {
  newest: 'Newest first',
  oldest: 'Oldest first',
  status: 'By status',
  recipient: 'Recipient A\u2013Z',
}
const sortOptions: SortOption[] = ['newest', 'oldest', 'status', 'recipient']

export function ComplaintsPageClient({
  complaints,
  totalCount,
  currentPage,
  totalPages,
  filters,
}: ComplaintsPageClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const [searchInput, setSearchInput] = useState(filters.search)
  const [searchTimeout, setSearchTimeout] = useState<ReturnType<typeof setTimeout> | null>(null)

  const updateParams = useCallback(
    (updates: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString())
      for (const [key, value] of Object.entries(updates)) {
        if (value) {
          params.set(key, value)
        } else {
          params.delete(key)
        }
      }
      // Reset to page 1 when filters change (unless explicitly setting page)
      if (!('page' in updates)) {
        params.delete('page')
      }
      startTransition(() => {
        router.replace(`?${params.toString()}`, { scroll: false })
      })
    },
    [searchParams, router]
  )

  function handleSearchChange(value: string) {
    setSearchInput(value)
    if (searchTimeout) clearTimeout(searchTimeout)
    setSearchTimeout(
      setTimeout(() => {
        updateParams({ search: value })
      }, 300)
    )
  }

  function cycleSort() {
    const currentIndex = sortOptions.indexOf(filters.sort as SortOption)
    const next = sortOptions[(currentIndex + 1) % sortOptions.length]
    updateParams({ sort: next === 'newest' ? '' : next })
  }

  function clearFilters() {
    setSearchInput('')
    startTransition(() => {
      router.replace('/dashboard/complaints', { scroll: false })
    })
  }

  const hasActiveFilters = filters.search || filters.status || filters.category || filters.recipientType || filters.dateFrom || filters.dateTo

  async function updateComplaint(id: string, field: string, value: string) {
    const res = await fetch(`/api/complaints/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [field]: value }),
    })
    if (res.ok) {
      router.refresh()
    }
  }

  const selectClass = (active: boolean) =>
    `text-sm px-3 py-2 rounded-xl border bg-white dark:bg-slate-900/50 appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-500/40 transition-colors ${
      active
        ? 'border-amber-500 text-amber-700 dark:border-amber-500 dark:text-amber-400'
        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
    }`

  const from = (currentPage - 1) * 25 + 1
  const to = Math.min(currentPage * 25, totalCount)
  const hasLetter = (c: Complaint) => c.status !== 'draft' && c.generated_letter != null && c.generated_letter.trim().length > 0
  const isSent = (c: Complaint) => c.status === 'delivered' || c.status === 'sent'

  return (
    <div className={isPending ? 'opacity-60 pointer-events-none transition-opacity' : ''}>
      {/* Search + Filters */}
      <div className="bg-white dark:bg-slate-900/60 rounded-2xl shadow-sm shadow-slate-900/5 dark:border dark:border-slate-700/50 p-5 mb-6">
        {/* Search bar */}
        <div className="relative mb-4">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 dark:text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={searchInput}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search by recipient name or subject..."
            className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-900/50 placeholder-slate-300 dark:placeholder-slate-500"
          />
        </div>

        {/* Filter row */}
        <div className="flex items-center gap-3 flex-wrap">
          <select
            value={filters.status}
            onChange={(e) => updateParams({ status: e.target.value })}
            className={selectClass(!!filters.status)}
            aria-label="Filter by status"
          >
            <option value="">All statuses</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
            ))}
            <option value="sent">Sent</option>
          </select>

          <select
            value={filters.category}
            onChange={(e) => updateParams({ category: e.target.value })}
            className={selectClass(!!filters.category)}
            aria-label="Filter by category"
          >
            <option value="">All categories</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
            ))}
          </select>

          <select
            value={filters.recipientType}
            onChange={(e) => updateParams({ recipientType: e.target.value })}
            className={selectClass(!!filters.recipientType)}
            aria-label="Filter by recipient type"
          >
            <option value="">All recipients</option>
            {RECIPIENT_TYPES.map((t) => (
              <option key={t} value={t}>{t === 'mp' ? 'MP' : t.charAt(0).toUpperCase() + t.slice(1)}</option>
            ))}
          </select>

          <div className="flex items-center gap-2">
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => updateParams({ dateFrom: e.target.value })}
              className="text-sm px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/50 focus:outline-none focus:ring-2 focus:ring-amber-500/40 text-slate-600 dark:text-slate-300"
              aria-label="From date"
            />
            <span className="text-slate-300 dark:text-slate-500 text-xs">to</span>
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) => updateParams({ dateTo: e.target.value })}
              className="text-sm px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/50 focus:outline-none focus:ring-2 focus:ring-amber-500/40 text-slate-600 dark:text-slate-300"
              aria-label="To date"
            />
          </div>

          <button
            onClick={cycleSort}
            className="inline-flex items-center gap-1 text-sm text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-900 ml-auto transition-colors"
            aria-label={`Sort: ${sortLabels[(filters.sort || 'newest') as SortOption]}`}
          >
            <span>&#8597;</span> {sortLabels[(filters.sort || 'newest') as SortOption]}
          </button>

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-xs text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 transition-colors"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Results */}
      {complaints.length === 0 ? (
        <div className="bg-white dark:bg-slate-900/60 rounded-2xl shadow-sm shadow-slate-900/5 dark:border dark:border-slate-700/50 text-center py-12 px-6">
          {hasActiveFilters ? (
            <>
              <p className="text-sm text-slate-400 mb-3">No complaints match your search or filters.</p>
              <button
                onClick={clearFilters}
                className="inline-flex items-center gap-1 text-sm font-medium text-amber-600 dark:text-amber-400 hover:text-amber-500 dark:hover:text-amber-300 transition-colors"
              >
                Clear filters
              </button>
            </>
          ) : (
            <>
              <p className="text-sm text-slate-400 mb-3">You haven&apos;t created any complaints yet.</p>
              <Link
                href="/dashboard/new-complaint"
                className="inline-flex items-center gap-2 bg-amber-500 text-slate-950 rounded-xl px-5 py-2.5 text-sm font-medium hover:bg-amber-400 transition-all"
              >
                Create your first complaint
              </Link>
            </>
          )}
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900/60 rounded-2xl shadow-sm shadow-slate-900/5 dark:border dark:border-slate-700/50 overflow-hidden">
          {/* Table header (desktop) */}
          <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 border-b border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wide">
            <div className="col-span-4">Recipient</div>
            <div className="col-span-2">Category</div>
            <div className="col-span-1">Date</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-2">Response</div>
            <div className="col-span-1"></div>
          </div>

          {/* Desktop rows */}
          <div className="hidden md:block">
            {complaints.map((complaint, i) => (
              <div
                key={complaint.id}
                className={`grid grid-cols-12 gap-4 items-center px-6 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${
                  i < complaints.length - 1 ? 'border-b border-slate-100 dark:border-slate-800' : ''
                }`}
              >
                <div className="col-span-4 flex items-center min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-base mr-3 shrink-0" aria-hidden="true">
                    {CATEGORY_ICONS[complaint.category] || '?'}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">{complaint.recipient_name}</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500">
                      {complaint.recipient_type === 'mp' ? 'MP' : complaint.recipient_type.charAt(0).toUpperCase() + complaint.recipient_type.slice(1)}
                    </p>
                  </div>
                </div>
                <div className="col-span-2 text-sm text-slate-600 dark:text-slate-300">
                  {CATEGORY_LABELS[complaint.category] || complaint.category}
                </div>
                <div className="col-span-1 text-xs text-slate-400 dark:text-slate-500">
                  {relativeDate(complaint.created_at)}
                </div>
                <div className="col-span-2">
                  <select
                    value={complaint.status}
                    onChange={(e) => updateComplaint(complaint.id, 'status', e.target.value)}
                    className={`text-xs px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 font-medium appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-500/40 ${STATUS_STYLES[complaint.status] || STATUS_STYLES.draft}`}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <option value="draft">Draft</option>
                    <option value="generated">Generated</option>
                    <option value="reviewed">Reviewed</option>
                    <option value="sent">Sent</option>
                    <option value="delivered">Delivered</option>
                  </select>
                </div>
                <div className="col-span-2">
                  {isSent(complaint) ? (
                    <div className="flex items-center gap-1">
                      <select
                        value={complaint.response_status || 'awaiting'}
                        onChange={(e) => updateComplaint(complaint.id, 'responseStatus', e.target.value)}
                        className={`text-xs px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 font-medium appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-500/40 ${
                          RESPONSE_STATUS_BADGES[complaint.response_status || 'awaiting']?.style || ''
                        }`}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <option value="awaiting">Awaiting</option>
                        <option value="responded">Responded</option>
                        <option value="no_response">No response</option>
                        <option value="escalated">Escalated</option>
                        <option value="resolved">Resolved</option>
                      </select>
                      {complaint.follow_up_date && new Date(complaint.follow_up_date) < new Date() && complaint.response_status !== 'resolved' && (
                        <span className="px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-red-50 text-red-600 border border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800 shrink-0">
                          overdue
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-xs text-slate-300 dark:text-slate-600">&mdash;</span>
                  )}
                </div>
                <div className="col-span-1 flex justify-end">
                  <Link
                    href={`/dashboard/complaints/${complaint.id}`}
                    className="text-xs text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
                  >
                    View &rarr;
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {/* Mobile cards */}
          <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800">
            {complaints.map((complaint) => (
              <div key={complaint.id} className="px-4 py-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">{complaint.recipient_name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {CATEGORY_LABELS[complaint.category] || complaint.category}
                      {' · '}
                      {complaint.recipient_type === 'mp' ? 'MP' : complaint.recipient_type.charAt(0).toUpperCase() + complaint.recipient_type.slice(1)}
                      {' · '}
                      {relativeDate(complaint.created_at)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <select
                    value={complaint.status}
                    onChange={(e) => updateComplaint(complaint.id, 'status', e.target.value)}
                    className={`text-xs px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 font-medium appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-500/40 ${STATUS_STYLES[complaint.status] || STATUS_STYLES.draft}`}
                  >
                    <option value="draft">Draft</option>
                    <option value="generated">Generated</option>
                    <option value="reviewed">Reviewed</option>
                    <option value="sent">Sent</option>
                    <option value="delivered">Delivered</option>
                  </select>
                  {isSent(complaint) && (
                    <select
                      value={complaint.response_status || 'awaiting'}
                      onChange={(e) => updateComplaint(complaint.id, 'responseStatus', e.target.value)}
                      className={`text-xs px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 font-medium appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-500/40 ${
                        RESPONSE_STATUS_BADGES[complaint.response_status || 'awaiting']?.style || ''
                      }`}
                    >
                      <option value="awaiting">Awaiting</option>
                      <option value="responded">Responded</option>
                      <option value="no_response">No response</option>
                      <option value="escalated">Escalated</option>
                      <option value="resolved">Resolved</option>
                    </select>
                  )}
                  <Link
                    href={`/dashboard/complaints/${complaint.id}`}
                    className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1 hover:bg-slate-50 dark:hover:bg-slate-800 ml-auto transition-colors"
                  >
                    View &rarr;
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between">
              <p className="text-xs text-slate-400 dark:text-slate-500">
                Showing {from}&ndash;{to} of {totalCount} complaints
              </p>
              <div className="flex items-center gap-2">
                <button
                  disabled={currentPage <= 1}
                  onClick={() => updateParams({ page: String(currentPage - 1) })}
                  className="px-3 py-1.5 text-xs font-medium border border-slate-200 dark:border-slate-700 rounded-lg transition-colors disabled:text-slate-300 disabled:dark:text-slate-600 disabled:cursor-not-allowed text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900"
                >
                  &larr; Previous
                </button>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  disabled={currentPage >= totalPages}
                  onClick={() => updateParams({ page: String(currentPage + 1) })}
                  className="px-3 py-1.5 text-xs font-medium border border-slate-200 dark:border-slate-700 rounded-lg transition-colors disabled:text-slate-300 disabled:dark:text-slate-600 disabled:cursor-not-allowed text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900"
                >
                  Next &rarr;
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
