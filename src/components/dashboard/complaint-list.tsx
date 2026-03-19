'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import {
  Complaint,
  CATEGORY_ICONS,
  CATEGORY_LABELS,
  STATUS_STYLES,
  RESPONSE_STATUS_BADGES,
  SortOption,
  relativeDate,
} from './types'
import { QuickActions } from './quick-actions'
import { EmptyState } from './empty-state'
import { ComplaintFilters } from './complaint-filters'

interface ComplaintListProps {
  complaints: Complaint[]
}

const STATUS_ORDER: Record<string, number> = {
  draft: 0,
  generated: 1,
  reviewed: 2,
  delivered: 3,
}

export function ComplaintList({ complaints }: ComplaintListProps) {
  const searchParams = useSearchParams()
  const router = useRouter()

  const status = searchParams.get('status') || ''
  const category = searchParams.get('category') || ''
  const recipientType = searchParams.get('recipientType') || ''
  const sort = (searchParams.get('sort') as SortOption) || 'newest'

  const filtered = useMemo(() => {
    let result = complaints

    if (status) {
      result = result.filter((c) => c.status === status)
    }
    if (category) {
      result = result.filter((c) => c.category === category)
    }
    if (recipientType) {
      result = result.filter((c) => c.recipient_type === recipientType)
    }

    result = [...result].sort((a, b) => {
      switch (sort) {
        case 'oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        case 'status':
          return (STATUS_ORDER[a.status] ?? 0) - (STATUS_ORDER[b.status] ?? 0)
        case 'recipient':
          return a.recipient_name.localeCompare(b.recipient_name)
        case 'newest':
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      }
    })

    return result
  }, [complaints, status, category, recipientType, sort])

  const hasActiveFilters = status || category || recipientType

  if (filtered.length === 0 && hasActiveFilters) {
    return (
      <div className="bg-white dark:bg-slate-900/60 rounded-2xl shadow-sm shadow-slate-900/5 dark:border dark:border-slate-700/50 overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-700">
          <h2 className="font-serif text-xl text-slate-900 dark:text-white mb-4">Recent Complaints</h2>
          <ComplaintFilters />
        </div>
        <div className="py-12 px-6 text-center">
          <p className="text-sm text-slate-400 mb-3">No complaints match your filters.</p>
          <button
            onClick={() => router.replace('?', { scroll: false })}
            className="inline-flex items-center gap-1 text-sm font-medium text-amber-600 dark:text-amber-400 hover:text-amber-500 dark:hover:text-amber-300 transition-colors"
          >
            Clear filters
          </button>
        </div>
      </div>
    )
  }

  if (filtered.length === 0) {
    return <EmptyState variant="no-complaints" />
  }

  const hasLetter = (c: Complaint) => c.status !== 'draft' && c.generated_letter != null && c.generated_letter.trim().length > 0

  return (
    <>
      {/* Desktop: row list */}
      <div className="hidden md:block rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-700">
          <h2 className="font-serif text-xl text-slate-900 dark:text-white mb-4">Recent Complaints</h2>
          <ComplaintFilters />
        </div>
        {filtered.map((complaint) => (
          <div
            key={complaint.id}
            className="flex items-center border-b border-gray-100 dark:border-gray-800 last:border-b-0 group hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
          >
            <Link
              href={`/dashboard/complaints/${complaint.id}`}
              className="flex items-center flex-1 min-w-0 px-4 py-3"
              aria-label={`View complaint to ${complaint.recipient_name}`}
            >
              <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-base mr-3 shrink-0" aria-hidden="true">
                {CATEGORY_ICONS[complaint.category] || '?'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                  {complaint.recipient_name}
                  <span className="text-xs text-gray-400 dark:text-gray-500 font-normal ml-1">
                    · {complaint.recipient_type === 'mp' ? 'MP' : complaint.recipient_type.charAt(0).toUpperCase() + complaint.recipient_type.slice(1)}
                  </span>
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {CATEGORY_LABELS[complaint.category] || complaint.category}
                  {' · '}
                  {relativeDate(complaint.created_at)}
                  {complaint.delivery_method && (
                    <span className="text-indigo-400 dark:text-indigo-300 ml-1" aria-label={`Delivery method: ${complaint.delivery_method}`}>
                      · {complaint.delivery_method === 'mailto' ? '✉ mailto' : complaint.delivery_method === 'clipboard' ? '📋 clipboard' : '📧 direct'}
                    </span>
                  )}
                </p>
                {complaint.generated_subject ? (
                  <p className="text-xs text-gray-400 dark:text-gray-500 truncate mt-0.5 max-w-md">
                    {complaint.generated_subject}
                  </p>
                ) : (
                  <p className="text-xs text-gray-300 dark:text-gray-600 italic mt-0.5">
                    Letter not yet generated
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0 ml-3">
                <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_STYLES[complaint.status] || STATUS_STYLES.draft}`}>
                  {complaint.status}
                </span>
                {(complaint.status === 'delivered' || complaint.status === 'sent') && complaint.response_status && RESPONSE_STATUS_BADGES[complaint.response_status] && (
                  <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${RESPONSE_STATUS_BADGES[complaint.response_status].style}`}>
                    {RESPONSE_STATUS_BADGES[complaint.response_status].label}
                  </span>
                )}
                {(complaint.status === 'delivered' || complaint.status === 'sent') && complaint.follow_up_date && new Date(complaint.follow_up_date) < new Date() && complaint.response_status !== 'resolved' && (
                  <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-600 border border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800">
                    overdue
                  </span>
                )}
              </div>
              <svg className="h-4 w-4 text-gray-300 dark:text-gray-600 shrink-0 ml-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </Link>
            {hasLetter(complaint) && (
              <div className="shrink-0 pr-4">
                <QuickActions
                  compact
                  subject={complaint.generated_subject || ''}
                  letter={complaint.generated_letter || ''}
                  recipientEmail={complaint.recipient_email}
                />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Mobile: card list */}
      <div className="md:hidden mb-4">
        <h2 className="font-serif text-xl text-slate-900 dark:text-white mb-4">Recent Complaints</h2>
        <ComplaintFilters />
      </div>
      <div className="flex flex-col gap-3 md:hidden">
        {filtered.map((complaint) => (
          <div
            key={complaint.id}
            className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                  {complaint.recipient_name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {CATEGORY_LABELS[complaint.category] || complaint.category}
                  {' · '}
                  {complaint.recipient_type === 'mp' ? 'MP' : complaint.recipient_type.charAt(0).toUpperCase() + complaint.recipient_type.slice(1)}
                  {' · '}
                  {relativeDate(complaint.created_at)}
                </p>
              </div>
              <div className="flex items-center gap-1 shrink-0 ml-2">
                <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_STYLES[complaint.status] || STATUS_STYLES.draft}`}>
                  {complaint.status}
                </span>
                {(complaint.status === 'delivered' || complaint.status === 'sent') && complaint.response_status && RESPONSE_STATUS_BADGES[complaint.response_status] && (
                  <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${RESPONSE_STATUS_BADGES[complaint.response_status].style}`}>
                    {RESPONSE_STATUS_BADGES[complaint.response_status].label}
                  </span>
                )}
                {(complaint.status === 'delivered' || complaint.status === 'sent') && complaint.follow_up_date && new Date(complaint.follow_up_date) < new Date() && complaint.response_status !== 'resolved' && (
                  <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-600 border border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800">
                    overdue
                  </span>
                )}
              </div>
            </div>

            {complaint.generated_subject ? (
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 line-clamp-2">
                {complaint.generated_subject}
              </p>
            ) : (
              <p className="text-xs text-gray-300 dark:text-gray-600 italic mb-3">
                Letter not yet generated
              </p>
            )}

            <div className="flex items-center gap-2">
              {hasLetter(complaint) && (
                <QuickActions
                  subject={complaint.generated_subject || ''}
                  letter={complaint.generated_letter || ''}
                  recipientEmail={complaint.recipient_email}
                />
              )}
              <Link
                href={`/dashboard/complaints/${complaint.id}`}
                className="inline-flex items-center gap-1 text-xs font-medium text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 rounded-md px-3 py-2 min-h-[44px] hover:bg-gray-50 dark:hover:bg-gray-800 ml-auto"
                aria-label={`View complaint to ${complaint.recipient_name}`}
              >
                View →
              </Link>
            </div>
          </div>
        ))}
      </div>
    </>
  )
}
