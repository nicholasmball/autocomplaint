import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { Complaint } from '@/components/dashboard/types'
import { ComplaintsPageClient } from '@/components/complaints/complaints-page-client'

const PAGE_SIZE = 25

interface SearchParams {
  page?: string
  search?: string
  status?: string
  category?: string
  recipientType?: string
  dateFrom?: string
  dateTo?: string
  sort?: string
}

async function ComplaintsContent({ searchParams }: { searchParams: SearchParams }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const page = Math.max(1, parseInt(searchParams.page || '1', 10) || 1)
  const search = searchParams.search || ''
  const status = searchParams.status || ''
  const category = searchParams.category || ''
  const recipientType = searchParams.recipientType || ''
  const dateFrom = searchParams.dateFrom || ''
  const dateTo = searchParams.dateTo || ''
  const sort = searchParams.sort || 'newest'

  let query = supabase
    .from('complaints')
    .select('id, recipient_name, recipient_type, recipient_email, category, status, delivery_method, generated_subject, generated_letter, created_at, response_status, follow_up_date', { count: 'exact' })
    .eq('user_id', user!.id)

  if (search) {
    query = query.or(`recipient_name.ilike.%${search}%,generated_subject.ilike.%${search}%`)
  }
  if (status) {
    query = query.eq('status', status)
  }
  if (category) {
    query = query.eq('category', category)
  }
  if (recipientType) {
    query = query.eq('recipient_type', recipientType)
  }
  if (dateFrom) {
    query = query.gte('created_at', `${dateFrom}T00:00:00`)
  }
  if (dateTo) {
    query = query.lte('created_at', `${dateTo}T23:59:59`)
  }

  switch (sort) {
    case 'oldest':
      query = query.order('created_at', { ascending: true })
      break
    case 'status':
      query = query.order('status', { ascending: true }).order('created_at', { ascending: false })
      break
    case 'recipient':
      query = query.order('recipient_name', { ascending: true })
      break
    case 'newest':
    default:
      query = query.order('created_at', { ascending: false })
  }

  const from = (page - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1
  query = query.range(from, to)

  const { data: complaints, error, count } = await query

  if (error) {
    return (
      <div className="rounded-2xl bg-white dark:bg-slate-900/60 dark:border dark:border-slate-700/50 shadow-sm shadow-slate-900/5 text-center py-12 px-6">
        <div className="text-3xl mb-3">&#9888;</div>
        <h2 className="text-base font-semibold text-red-800 dark:text-red-400 mb-1">Couldn&apos;t load your complaints</h2>
        <p className="text-sm text-slate-400 mb-5">Something went wrong. Please try again.</p>
      </div>
    )
  }

  const typedComplaints = (complaints || []) as Complaint[]
  const totalCount = count || 0
  const totalPages = Math.ceil(totalCount / PAGE_SIZE)

  return (
    <ComplaintsPageClient
      complaints={typedComplaints}
      totalCount={totalCount}
      currentPage={page}
      totalPages={totalPages}
      filters={{ search, status, category, recipientType, dateFrom, dateTo, sort }}
    />
  )
}

function ComplaintsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-8 w-48 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
      <div className="bg-white dark:bg-slate-900/60 rounded-2xl shadow-sm p-5 space-y-4">
        <div className="h-10 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
        <div className="flex gap-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-10 w-32 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
      <div className="bg-white dark:bg-slate-900/60 rounded-2xl shadow-sm overflow-hidden">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="px-6 py-4 border-b border-slate-100 dark:border-slate-800">
            <div className="h-5 w-3/4 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  )
}

export default async function ComplaintsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams
  return (
    <div>
      <div className="mb-8">
        <h1 className="font-serif text-3xl text-slate-900 dark:text-white mb-1">Complaints</h1>
        <p className="text-slate-400">Manage, search, and update all your complaints</p>
      </div>
      <Suspense fallback={<ComplaintsSkeleton />}>
        <ComplaintsContent searchParams={params} />
      </Suspense>
    </div>
  )
}
