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

  const filterControls = (
    <>
      <select
        value={status}
        onChange={(e) => updateParam('status', e.target.value)}
        className={`text-sm px-2.5 py-1.5 rounded-md border bg-white dark:bg-gray-800 dark:text-gray-200 appearance-none cursor-pointer focus:outline-2 focus:outline-blue-600 focus:-outline-offset-1 w-full md:w-auto ${
          status ? 'border-blue-500 text-blue-700 dark:border-blue-500 dark:text-blue-400' : 'border-gray-300 dark:border-gray-600 text-gray-700'
        }`}
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
        className={`text-sm px-2.5 py-1.5 rounded-md border bg-white dark:bg-gray-800 dark:text-gray-200 appearance-none cursor-pointer focus:outline-2 focus:outline-blue-600 focus:-outline-offset-1 w-full md:w-auto ${
          category ? 'border-blue-500 text-blue-700 dark:border-blue-500 dark:text-blue-400' : 'border-gray-300 dark:border-gray-600 text-gray-700'
        }`}
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
        className={`text-sm px-2.5 py-1.5 rounded-md border bg-white dark:bg-gray-800 dark:text-gray-200 appearance-none cursor-pointer focus:outline-2 focus:outline-blue-600 focus:-outline-offset-1 w-full md:w-auto ${
          recipientType ? 'border-blue-500 text-blue-700 dark:border-blue-500 dark:text-blue-400' : 'border-gray-300 dark:border-gray-600 text-gray-700'
        }`}
        aria-label="Filter by recipient type"
      >
        <option value="">All recipients</option>
        {RECIPIENT_TYPES.map((t) => (
          <option key={t} value={t}>{t === 'mp' ? 'MP' : t.charAt(0).toUpperCase() + t.slice(1)}</option>
        ))}
      </select>

      <button
        onClick={cycleSort}
        className="inline-flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 border border-gray-300 dark:border-gray-600 rounded-md px-2.5 py-1.5 hover:bg-gray-50 dark:hover:bg-gray-800 md:ml-auto w-full md:w-auto justify-center md:justify-start"
        aria-label={`Sort: ${sortLabels[sort]}`}
      >
        <span>↕</span> {sortLabels[sort]}
      </button>

      {hasActiveFilters && (
        <button
          onClick={clearAll}
          className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 w-full md:w-auto text-center"
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
        className="md:hidden flex items-center justify-between w-full text-sm text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 mb-2"
        aria-expanded={mobileOpen}
      >
        <span>Filters &amp; Sort{activeCount > 0 ? ` · ${activeCount} active` : ''}</span>
        <span className="text-xs">{mobileOpen ? '▲' : '▼'}</span>
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
