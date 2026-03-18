'use client'

import { useState } from 'react'

type ResponseStatus = 'awaiting' | 'responded' | 'no_response' | 'escalated' | 'resolved'

const STATUS_OPTIONS: { value: ResponseStatus; label: string; color: string }[] = [
  { value: 'awaiting', label: 'Awaiting response', color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' },
  { value: 'responded', label: 'Responded', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
  { value: 'no_response', label: 'No response', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' },
  { value: 'escalated', label: 'Escalated', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' },
  { value: 'resolved', label: 'Resolved', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' },
]

interface ResponseTrackerProps {
  complaintId: string
  initialStatus: ResponseStatus
  initialDate: string | null
  initialSummary: string | null
  initialSatisfactory: boolean | null
  initialFollowUpDate: string | null
  initialEscalatedTo: string | null
}

export function ResponseTracker({
  complaintId,
  initialStatus,
  initialDate,
  initialSummary,
  initialSatisfactory,
  initialFollowUpDate,
  initialEscalatedTo,
}: ResponseTrackerProps) {
  const [status, setStatus] = useState<ResponseStatus>(initialStatus)
  const [responseDate, setResponseDate] = useState(initialDate?.split('T')[0] || '')
  const [summary, setSummary] = useState(initialSummary || '')
  const [satisfactory, setSatisfactory] = useState<boolean | null>(initialSatisfactory)
  const [followUpDate, setFollowUpDate] = useState(initialFollowUpDate?.split('T')[0] || '')
  const [escalatedTo, setEscalatedTo] = useState(initialEscalatedTo || '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  async function save() {
    setSaving(true)
    setError('')
    setSaved(false)

    try {
      const res = await fetch(`/api/complaints/${complaintId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          responseStatus: status,
          responseDate: responseDate || null,
          responseSummary: summary || null,
          responseSatisfactory: satisfactory,
          followUpDate: followUpDate || null,
          escalatedTo: escalatedTo || null,
        }),
      })

      if (!res.ok) throw new Error('Failed to save')
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch {
      setError('Failed to save — please try again.')
    } finally {
      setSaving(false)
    }
  }

  const showResponseDate = status === 'responded' || status === 'resolved'
  const showSummary = status !== 'awaiting'
  const showSatisfactory = status === 'responded' || status === 'resolved'
  const showEscalatedTo = status === 'escalated'
  const showFollowUpDate = status === 'no_response' || status === 'escalated'

  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
          Response tracking
        </p>
      </div>

      <div className="p-4 space-y-4">
        <div>
          <p className="text-sm font-medium mb-2">Status</p>
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Response status">
            {STATUS_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                role="radio"
                aria-checked={status === opt.value}
                onClick={() => setStatus(opt.value)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  status === opt.value
                    ? `${opt.color} ring-2 ring-offset-1 ring-blue-500 dark:ring-offset-gray-900`
                    : 'bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {status !== 'awaiting' && (
          <div className="space-y-4 motion-safe:animate-[fadeSlideIn_200ms_ease-out]">
            {showResponseDate && (
              <div>
                <label htmlFor="response-date" className="block text-sm font-medium mb-1">
                  Response date
                </label>
                <input
                  id="response-date"
                  type="date"
                  value={responseDate}
                  onChange={(e) => setResponseDate(e.target.value)}
                  className="border rounded-md px-3 py-2 text-sm dark:bg-gray-800 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
            )}

            {showSummary && (
              <div>
                <label htmlFor="response-summary" className="block text-sm font-medium mb-1">
                  {status === 'escalated' ? 'Reason for escalation' : 'Response summary'}
                </label>
                <textarea
                  id="response-summary"
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  rows={3}
                  placeholder={
                    status === 'escalated'
                      ? 'Why are you escalating this complaint?'
                      : status === 'no_response'
                        ? 'Any notes about follow-up attempts...'
                        : 'What did they say?'
                  }
                  className="w-full border rounded-md px-3 py-2 text-sm dark:bg-gray-800 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
            )}

            {showSatisfactory && (
              <div>
                <p className="text-sm font-medium mb-2">Was the response satisfactory?</p>
                <div className="flex gap-3" role="radiogroup" aria-label="Response satisfactory">
                  {([true, false] as const).map((val) => (
                    <button
                      key={String(val)}
                      role="radio"
                      aria-checked={satisfactory === val}
                      onClick={() => setSatisfactory(val)}
                      className={`px-4 py-1.5 rounded-md text-sm font-medium border transition-colors ${
                        satisfactory === val
                          ? val
                            ? 'border-green-600 bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700'
                            : 'border-red-600 bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700'
                          : 'border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-300'
                      }`}
                    >
                      {val ? 'Yes' : 'No'}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {showEscalatedTo && (
              <div>
                <label htmlFor="escalated-to" className="block text-sm font-medium mb-1">
                  Escalated to
                </label>
                <input
                  id="escalated-to"
                  type="text"
                  value={escalatedTo}
                  onChange={(e) => setEscalatedTo(e.target.value)}
                  placeholder="e.g., Financial Ombudsman, MP, CEO office"
                  className="w-full border rounded-md px-3 py-2 text-sm dark:bg-gray-800 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
            )}

            {showFollowUpDate && (
              <div>
                <label htmlFor="follow-up-date" className="block text-sm font-medium mb-1">
                  Follow-up date
                </label>
                <input
                  id="follow-up-date"
                  type="date"
                  value={followUpDate}
                  onChange={(e) => setFollowUpDate(e.target.value)}
                  className="border rounded-md px-3 py-2 text-sm dark:bg-gray-800 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
            )}
          </div>
        )}

        <div className="flex items-center gap-3 pt-2" aria-live="polite">
          <button
            onClick={save}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-md bg-blue-600 text-white px-4 py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
          {saved && <span className="text-sm text-green-600 dark:text-green-400">Saved</span>}
          {error && <span className="text-sm text-red-600 dark:text-red-400">{error}</span>}
        </div>
      </div>
    </div>
  )
}
