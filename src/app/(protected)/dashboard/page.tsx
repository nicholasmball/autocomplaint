import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Complaint, CATEGORY_ICONS, STATUS_STYLES, RESPONSE_STATUS_BADGES, relativeDate } from '@/components/dashboard/types'
import { SummaryCards } from '@/components/dashboard/summary-cards'
import { EmptyState } from '@/components/dashboard/empty-state'
import { DashboardSkeleton } from '@/components/dashboard/dashboard-skeleton'

async function DashboardContent() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user!.id)
    .single()

  // Two separate queries for performance:
  // 1. Lightweight query for summary card stats (status only)
  // 2. Limited query for the 5 most recent complaints to display
  const [statsResult, recentResult] = await Promise.all([
    supabase
      .from('complaints')
      .select('status', { count: 'exact' })
      .eq('user_id', user!.id),
    supabase
      .from('complaints')
      .select('id, recipient_name, recipient_type, recipient_email, category, status, delivery_method, generated_subject, generated_letter, created_at, response_status, follow_up_date')
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false })
      .limit(5),
  ])

  const displayName = profile?.full_name || user!.email

  if (statsResult.error || recentResult.error) {
    return (
      <div>
        <div className="mb-8">
          <h1 className="font-serif text-3xl text-slate-900 dark:text-white mb-1">Welcome, {displayName}</h1>
          <p className="text-slate-400">Track and manage your complaints</p>
        </div>
        <div className="rounded-2xl bg-white dark:bg-slate-900/60 dark:border dark:border-slate-700/50 shadow-sm shadow-slate-900/5 text-center py-12 px-6">
          <div className="text-3xl mb-3">&#9888;</div>
          <h2 className="text-base font-semibold text-red-800 dark:text-red-400 mb-1">Couldn&apos;t load your complaints</h2>
          <p className="text-sm text-slate-400 mb-5">Something went wrong fetching your data. This is usually temporary.</p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1 text-sm font-medium border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
          >
            &#8635; Try again
          </Link>
        </div>
      </div>
    )
  }

  const statsComplaints = (statsResult.data || []) as { status: string }[]
  const recentComplaints = (recentResult.data || []) as Complaint[]
  const totalCount = statsResult.count || 0

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-serif text-3xl text-slate-900 dark:text-white mb-1">Welcome, {displayName}</h1>
        <p className="text-slate-400">Track and manage your complaints</p>
      </div>

      {totalCount > 0 ? (
        <>
          <SummaryCards complaints={statsComplaints} />

          {/* Recent Complaints — simplified, no filters */}
          <div className="bg-white dark:bg-slate-900/60 rounded-2xl shadow-sm shadow-slate-900/5 dark:border dark:border-slate-700/50 overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <h2 className="font-serif text-xl text-slate-900 dark:text-white">Recent Complaints</h2>
              <Link
                href="/dashboard/complaints"
                className="text-sm font-medium text-amber-600 dark:text-amber-400 hover:text-amber-500 dark:hover:text-amber-300 transition-colors"
              >
                View all complaints &rarr;
              </Link>
            </div>

            {recentComplaints.map((complaint, i) => (
              <Link
                key={complaint.id}
                href={`/dashboard/complaints/${complaint.id}`}
                className={`flex items-center px-6 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${
                  i < recentComplaints.length - 1 ? 'border-b border-slate-100 dark:border-slate-800' : ''
                }`}
              >
                <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-base mr-3 shrink-0" aria-hidden="true">
                  {CATEGORY_ICONS[complaint.category] || '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                    {complaint.recipient_name}
                    <span className="text-xs text-slate-400 dark:text-slate-500 font-normal ml-1">
                      &middot; {complaint.recipient_type === 'mp' ? 'MP' : complaint.recipient_type.charAt(0).toUpperCase() + complaint.recipient_type.slice(1)}
                    </span>
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {complaint.category.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                    {' · '}
                    {relativeDate(complaint.created_at)}
                  </p>
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
                </div>
                <svg className="h-4 w-4 text-slate-300 dark:text-slate-600 shrink-0 ml-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            ))}

            {totalCount > 5 && (
              <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30 text-center">
                <Link
                  href="/dashboard/complaints"
                  className="text-sm font-medium text-amber-600 dark:text-amber-400 hover:text-amber-500 dark:hover:text-amber-300 transition-colors"
                >
                  View all {totalCount} complaints &rarr;
                </Link>
              </div>
            )}
          </div>
        </>
      ) : (
        <EmptyState variant="no-complaints" />
      )}
    </div>
  )
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardContent />
    </Suspense>
  )
}
