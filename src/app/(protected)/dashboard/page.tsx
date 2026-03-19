import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Complaint } from '@/components/dashboard/types'
import { SummaryCards } from '@/components/dashboard/summary-cards'
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
    .select('id, recipient_name, recipient_type, recipient_email, category, status, delivery_method, generated_subject, generated_letter, created_at, response_status, follow_up_date')
    .eq('user_id', user!.id)
    .order('created_at', { ascending: false })

  const displayName = profile?.full_name || user!.email

  if (error) {
    return (
      <div>
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between mb-8">
          <div>
            <h1 className="font-serif text-3xl text-slate-900 dark:text-white mb-1">Welcome, {displayName}</h1>
            <p className="text-slate-400">Track and manage your complaints</p>
          </div>
          <Link
            href="/dashboard/new-complaint"
            className="mt-4 sm:mt-0 inline-flex items-center gap-2 bg-amber-500 text-slate-950 rounded-xl px-5 py-2.5 text-sm font-medium hover:bg-amber-400 transition-all hover:-translate-y-0.5 shadow-sm hover:shadow-md"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            New Complaint
          </Link>
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

  const typedComplaints = (complaints || []) as Complaint[]

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between mb-8">
        <div>
          <h1 className="font-serif text-3xl text-slate-900 dark:text-white mb-1">Welcome, {displayName}</h1>
          <p className="text-slate-400">Track and manage your complaints</p>
        </div>
        <Link
          href="/dashboard/new-complaint"
          className="mt-4 sm:mt-0 inline-flex items-center gap-2 bg-amber-500 text-slate-950 rounded-xl px-5 py-2.5 text-sm font-medium hover:bg-amber-400 transition-all hover:-translate-y-0.5 shadow-sm hover:shadow-md"
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
