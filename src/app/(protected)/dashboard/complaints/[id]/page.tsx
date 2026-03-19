import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ComplaintActions } from './complaint-actions'
import { ResponseTracker } from './response-tracker'

const CATEGORY_LABELS: Record<string, string> = {
  'billing': 'Billing',
  'poor-service': 'Poor Service',
  'faulty-product': 'Faulty Product',
  'delivery': 'Delivery',
  'contract-dispute': 'Contract Dispute',
  'data-privacy': 'Data Privacy',
  'unfair-treatment': 'Unfair Treatment',
  'accessibility': 'Accessibility',
}

const TONE_LABELS: Record<string, string> = {
  'formal': 'Formal',
  'firm': 'Firm',
  'escalatory': 'Escalatory',
  'conciliatory': 'Conciliatory',
}

const STATUSES = ['draft', 'generated', 'reviewed', 'delivered'] as const

const STATUS_ORDER: Record<string, number> = {
  draft: 0,
  generated: 1,
  reviewed: 2,
  delivered: 3,
}

function getRefCode(id: string): string {
  return `AC-${id.slice(0, 4).toUpperCase()}`
}

export default async function ComplaintDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) notFound()

  const { data: complaint } = await supabase
    .from('complaints')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!complaint) notFound()

  const currentStep = STATUS_ORDER[complaint.status] ?? 0

  return (
    <div>
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1 text-sm text-amber-600 dark:text-amber-400 hover:text-amber-500 dark:hover:text-amber-300 mb-4"
        aria-label="Back to complaint history"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Back to dashboard
      </Link>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="font-serif text-xl">Complaint to {complaint.recipient_name}</h1>
          <p className="text-sm text-slate-400 dark:text-slate-400">
            {CATEGORY_LABELS[complaint.category] || complaint.category}
            {' \u00B7 '}
            {TONE_LABELS[complaint.tone] || complaint.tone} tone
            {' \u00B7 '}
            Ref: {getRefCode(complaint.id)}
          </p>
        </div>
        <span
          className={`inline-block px-3 py-1 rounded-full text-xs font-medium capitalize shrink-0 ${
            complaint.status === 'delivered'
              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
              : complaint.status === 'generated'
                ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                : 'bg-slate-100 text-slate-500 dark:bg-slate-900/50 dark:text-slate-400'
          }`}
        >
          {complaint.status}
          {complaint.delivery_method && ` via ${complaint.delivery_method}`}
        </span>
      </div>

      {/* Status timeline */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/60 p-4 mb-6">
        <p className="text-xs font-semibold text-slate-400 dark:text-slate-400 uppercase tracking-wide mb-3">Status</p>
        <div className="flex items-center">
          {STATUSES.map((status, i) => {
            // Per Design Review note: skip "reviewed" in timeline if complaint didn't go through it
            if (status === 'reviewed' && complaint.status !== 'reviewed' && currentStep !== 2) {
              return null
            }
            const isDone = i <= currentStep
            return (
              <div key={status} className="flex-1 flex items-center">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      isDone
                        ? 'bg-green-600 text-white'
                        : 'bg-white dark:bg-slate-900/50 border-2 border-slate-200 dark:border-slate-700 text-slate-300'
                    }`}
                    aria-label={`${status}: ${isDone ? 'completed' : 'pending'}`}
                  >
                    {isDone ? '\u2713' : i + 1}
                  </div>
                  <span className="text-xs text-slate-400 dark:text-slate-400 mt-1 capitalize hidden sm:block">{status}</span>
                </div>
                {i < STATUSES.length - 1 && !(status === 'reviewed' && complaint.status !== 'reviewed' && currentStep !== 2) && (
                  <div className={`h-0.5 flex-1 ${isDone && i < currentStep ? 'bg-green-600' : 'bg-slate-200 dark:bg-slate-700'}`} />
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Not-yet-delivered banner */}
      {complaint.status !== 'delivered' && complaint.generated_letter && (
        <div className="rounded-2xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-3 mb-6">
          <p className="text-sm text-amber-800 dark:text-amber-300">
            This complaint hasn&apos;t been sent yet &mdash; deliver it using the actions below.
          </p>
        </div>
      )}

      {/* Letter */}
      {complaint.generated_letter ? (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/60 overflow-hidden mb-6">
          <div className="bg-slate-50 dark:bg-white/5 px-4 py-3 border-b border-slate-200 dark:border-slate-700">
            <p className="text-sm">
              <span className="text-slate-400 dark:text-slate-400">Subject: </span>
              <span className="font-medium">{complaint.generated_subject}</span>
            </p>
          </div>
          <div className="p-4 sm:p-6">
            <div className="font-serif text-sm leading-relaxed whitespace-pre-wrap text-slate-800 dark:text-slate-200">
              {complaint.generated_letter}
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/60 text-center py-8 px-6 mb-6">
          <p className="text-sm text-slate-400 dark:text-slate-400">Letter not yet generated.</p>
        </div>
      )}

      {/* Actions */}
      {complaint.generated_letter && (
        <ComplaintActions
          subject={complaint.generated_subject || ''}
          letter={complaint.generated_letter}
          recipientEmail={complaint.recipient_email || ''}
        />
      )}

      {/* Response tracking */}
      {(complaint.status === 'delivered' || complaint.status === 'sent') && (
        <div className="mt-6">
          <ResponseTracker
            complaintId={complaint.id}
            initialStatus={complaint.response_status || 'awaiting'}
            initialDate={complaint.response_date}
            initialSummary={complaint.response_summary}
            initialSatisfactory={complaint.response_satisfactory}
            initialFollowUpDate={complaint.follow_up_date}
            initialEscalatedTo={complaint.escalated_to}
          />
        </div>
      )}

      {/* Original complaint details */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/60 overflow-hidden mt-6">
        <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700">
          <p className="text-xs font-semibold text-slate-400 dark:text-slate-400 uppercase tracking-wide">
            Original complaint details
          </p>
        </div>
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          <DetailRow label="Recipient" value={`${complaint.recipient_name} (${complaint.recipient_type})`} />
          <DetailRow label="Category" value={CATEGORY_LABELS[complaint.category] || complaint.category} />
          <DetailRow label="Description" value={complaint.description} />
          <DetailRow label="Desired outcome" value={complaint.desired_outcome} />
          {complaint.date_of_incident && (
            <DetailRow
              label="Date of incident"
              value={new Date(complaint.date_of_incident).toLocaleDateString('en-GB')}
            />
          )}
          {complaint.reference_numbers && (
            <DetailRow label="Reference" value={complaint.reference_numbers} />
          )}
          <DetailRow
            label="Created"
            value={new Date(complaint.created_at).toLocaleDateString('en-GB', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          />
        </div>
      </div>
    </div>
  )
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col sm:flex-row px-4 py-3">
      <span className="text-sm font-medium text-slate-400 dark:text-slate-400 sm:w-36 shrink-0">{label}</span>
      <span className="text-sm text-slate-900 dark:text-white mt-0.5 sm:mt-0">{value}</span>
    </div>
  )
}
