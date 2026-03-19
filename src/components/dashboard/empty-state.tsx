'use client'

import Link from 'next/link'

interface EmptyStateProps {
  variant: 'no-complaints' | 'no-results'
  onClearFilters?: () => void
}

export function EmptyState({ variant, onClearFilters }: EmptyStateProps) {
  if (variant === 'no-results') {
    return (
      <div className="rounded-2xl bg-white dark:bg-slate-900/60 dark:border dark:border-slate-700/50 shadow-sm shadow-slate-900/5 text-center py-12 px-6">
        <p className="text-sm text-slate-400 mb-3">No complaints match your filters.</p>
        <button
          onClick={onClearFilters}
          className="inline-flex items-center gap-1 text-sm font-medium text-amber-600 dark:text-amber-400 hover:text-amber-500 dark:hover:text-amber-300 transition-colors"
        >
          Clear filters
        </button>
      </div>
    )
  }

  return (
    <div className="rounded-2xl bg-white dark:bg-slate-900/60 dark:border dark:border-slate-700/50 shadow-sm shadow-slate-900/5 text-center py-12 px-6">
      <div className="mx-auto w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center mb-5">
        <svg className="w-8 h-8 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
      </div>
      <h2 className="font-serif text-xl text-slate-900 dark:text-white mb-2">No complaints yet</h2>
      <p className="text-sm text-slate-400 mb-6 max-w-xs mx-auto">
        Draft a professional complaint in minutes. We&apos;ll help you write it, find the right recipient, and send it.
      </p>
      <Link
        href="/dashboard/new-complaint"
        className="inline-flex items-center gap-2 bg-slate-900 dark:bg-amber-500 text-white dark:text-slate-950 rounded-xl px-5 py-2.5 text-sm font-medium hover:bg-slate-700 dark:hover:bg-amber-400 transition-all hover:-translate-y-0.5 shadow-md hover:shadow-lg"
      >
        Draft your first complaint
      </Link>
    </div>
  )
}
