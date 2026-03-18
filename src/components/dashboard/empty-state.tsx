'use client'

import Link from 'next/link'

interface EmptyStateProps {
  variant: 'no-complaints' | 'no-results'
  onClearFilters?: () => void
}

export function EmptyState({ variant, onClearFilters }: EmptyStateProps) {
  if (variant === 'no-results') {
    return (
      <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-center py-12 px-6">
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">No complaints match your filters.</p>
        <button
          onClick={onClearFilters}
          className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
        >
          Clear filters
        </button>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-center py-12 px-6">
      <div className="text-4xl mb-4 opacity-40" aria-hidden="true">✉</div>
      <h2 className="text-base font-semibold mb-1">No complaints yet</h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-xs mx-auto">
        Draft a professional complaint in minutes. We&apos;ll help you write it, find the right recipient, and send it — saving you hours of effort.
      </p>
      <Link
        href="/dashboard/new-complaint"
        className="inline-flex items-center gap-2 bg-blue-600 text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-blue-700"
      >
        Draft your first complaint
      </Link>
    </div>
  )
}
