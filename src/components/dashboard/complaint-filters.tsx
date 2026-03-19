'use client'

import { useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { CATEGORIES, CATEGORY_LABELS, RECIPIENT_TYPES, STATUSES, SortOption } from './types'

export function ComplaintFilters() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)

  const status = searchParams.get('status') || ''
  const category = searchParams.get('category') || ''
  const recipientType = searchParams.get('recipientType') || ''
  const sortParam = searchParams.get('sort')
  const sort: SortOption = sortParam && ['newest', 'oldest', 'status', 'recipient'].includes(sortParam)
    ? sortParam as SortOption
    : 'newest'

  const activeCount = [status, category, recipientType].filter(Boolean).length

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    router.replace(`?${params.toString()}`, { scroll: false })
  }

  function clearAll() {
    router.replace('?', { scroll: false })
  }

  const sortLabels: Record<SortOption, string> = {
    newest: 'Newest first',
    oldest: 'Oldest first',
    status: 'By status',
    recipient: 'Recipient A–Z',
  }
  const sortOptions: SortOption[] = ['newest', 'oldest', 'status', 'recipient']

  function cycleSort() {
    const currentIndex = sortOptions.indexOf(sort)
    const next = sortOptions[(currentIndex + 1) % sortOptions.length]
    updateParam('sort', next === 'newest' ? '' : next)
  }

  const hasActiveFilters = status || category || recipientType

  const selectClass = (active: boolean) =>
    `text-sm px-3 py-2 rounded-xl border bg-white dark:bg-slate-900/50 appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-500/40 w-full md:w-auto transition-colors ${
      active
        ? 'border-amber-500 text-amber-700 dark:border-amber-500 dark:text-amber-400'
        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
    }`

  const filterControls = (
    <>
      <select
        value={status}
        onChange={(e) => updateParam('status', e.target.value)}
        className={selectClass(!!status)}
        aria-label="Filter by status"
      >
        <option value="">All statuses</option>
        {STATUSES.map((s) => (
          <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
        ))}
      </select>

      <select
        value={category}
        onChange={(e) => updateParam('category', e.target.value)}
        className={selectClass(!!category)}
        aria-label="Filter by category"
      >
        <option value="">All categories</option>
        {CATEGORIES.map((c) => (
          <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
        ))}
      </select>

      <select
        value={recipientType}
        onChange={(e) => updateParam('recipientType', e.target.value)}
        className={selectClass(!!recipientType)}
        aria-label="Filter by recipient type"
      >
        <option value="">All recipients</option>
        {RECIPIENT_TYPES.map((t) => (
          <option key={t} value={t}>{t === 'mp' ? 'MP' : t.charAt(0).toUpperCase() + t.slice(1)}</option>
        ))}
      </select>

      <button
        onClick={cycleSort}
        className="inline-flex items-center gap-1 text-sm text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-900 md:ml-auto w-full md:w-auto justify-center md:justify-start transition-colors"
        aria-label={`Sort: ${sortLabels[sort]}`}
      >
        <span>&#8597;</span> {sortLabels[sort]}
      </button>

      {hasActiveFilters && (
        <button
          onClick={clearAll}
          className="text-xs text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 w-full md:w-auto text-center transition-colors"
        >
          Clear filters
        </button>
      )}
    </>
  )

  return (
    <div className="mb-4">
      {/* Mobile: toggle button */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="md:hidden flex items-center justify-between w-full text-sm text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 mb-2 transition-colors"
        aria-expanded={mobileOpen}
      >
        <span>Filters &amp; Sort{activeCount > 0 ? ` · ${activeCount} active` : ''}</span>
        <span className="text-xs">{mobileOpen ? '\u25B2' : '\u25BC'}</span>
      </button>

      {/* Mobile: expandable filters */}
      {mobileOpen && (
        <div className="flex flex-col gap-2 mb-3 md:hidden">
          {filterControls}
        </div>
      )}

      {/* Desktop: inline filters */}
      <div className="hidden md:flex items-center gap-3 flex-wrap">
        {filterControls}
      </div>
    </div>
  )
}
