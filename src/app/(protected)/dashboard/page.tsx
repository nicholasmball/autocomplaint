import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Complaint } from '@/components/dashboard/types'
import { SummaryCards } from '@/components/dashboard/summary-cards'
import { ComplaintFilters } from '@/components/dashboard/complaint-filters'
import { ComplaintList } from '@/components/dashboard/complaint-list'
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

  const { data: complaints, error } = await supabase
    .from('complaints')
    .select('id, recipient_name, recipient_type, recipient_email, category, status, delivery_method, generated_subject, generated_letter, created_at')
    .eq('user_id', user!.id)
    .order('created_at', { ascending: false })

  const displayName = profile?.full_name || user!.email

  if (error) {
    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Welcome, {displayName}</h1>
          <Link
            href="/dashboard/new-complaint"
            className="inline-flex items-center gap-2 bg-blue-600 text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-blue-700"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            New Complaint
          </Link>
        </div>
        <div className="rounded-lg border border-red-200 dark:border-red-800 bg-white dark:bg-gray-900 text-center py-12 px-6">
          <div className="text-3xl mb-3">⚠</div>
          <h2 className="text-base font-semibold text-red-800 dark:text-red-400 mb-1">Couldn&apos;t load your complaints</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">Something went wrong fetching your data. This is usually temporary.</p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1 text-sm font-medium border border-gray-300 dark:border-gray-600 rounded-md px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            ↻ Try again
          </Link>
        </div>
      </div>
    )
  }

  const typedComplaints = (complaints || []) as Complaint[]

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Welcome, {displayName}</h1>
        <Link
          href="/dashboard/new-complaint"
          className="inline-flex items-center gap-2 bg-blue-600 text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-blue-700"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          New Complaint
        </Link>
      </div>

      {typedComplaints.length > 0 ? (
        <>
          <SummaryCards complaints={typedComplaints} />
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Your complaints</h2>
          <ComplaintFilters />
          <ComplaintList complaints={typedComplaints} />
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
