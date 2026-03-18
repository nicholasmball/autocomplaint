'use client'

import { useState } from 'react'
import { useWizard } from '../wizard-context'
import Link from 'next/link'

function getRefCode(id: string | null): string {
  if (!id) return ''
  return `AC-${id.slice(0, 4).toUpperCase()}`
}

export function StepSuccess() {
  const { state, reset } = useWizard()
  const refCode = getRefCode(state.complaintId)
  const [markedSent, setMarkedSent] = useState(false)
  const [promptDismissed, setPromptDismissed] = useState(false)

  function markAsSent() {
    setMarkedSent(true)
    if (state.complaintId) {
      fetch(`/api/complaints/${state.complaintId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'sent' }),
      }).catch(() => {/* non-blocking */})
    }
  }

  const showPrompt = !markedSent && !promptDismissed

  return (
    <div className="text-center py-6 space-y-6">
      <div>
        <div className="mx-auto w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-4">
          <svg className="h-8 w-8 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold mb-1">
          {markedSent ? 'Complaint sent!' : 'Complaint ready to send'}
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Your complaint to <span className="font-medium text-gray-900 dark:text-gray-100">{state.recipientName}</span> is ready to send.
          {refCode && (
            <>
              <br />
              Ref: <span className="font-medium">{refCode}</span>
            </>
          )}
        </p>
        <div className="mt-3">
          {markedSent ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 dark:bg-blue-900/30 px-2.5 py-1 text-xs font-medium text-blue-700 dark:text-blue-400">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-600" aria-hidden="true" />
              Sent
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 dark:bg-gray-800 px-2.5 py-1 text-xs font-medium text-gray-600 dark:text-gray-400">
              <span className="h-1.5 w-1.5 rounded-full bg-gray-400" aria-hidden="true" />
              Drafted
            </span>
          )}
        </div>
      </div>

      {showPrompt && (
        <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-4">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
            Did you send this complaint from your email?
          </p>
          <div className="flex gap-2 justify-center">
            <button
              onClick={markAsSent}
              className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 text-white px-3 py-1.5 text-sm font-medium hover:bg-blue-700"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              Yes, I sent it
            </button>
            <button
              onClick={() => setPromptDismissed(true)}
              className="inline-flex items-center gap-1.5 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Not yet
            </button>
          </div>
        </div>
      )}

      <div className="flex gap-3 justify-center flex-wrap">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 bg-blue-600 text-white rounded-md px-4 py-2.5 text-sm font-medium hover:bg-blue-700"
        >
          View complaint history
        </Link>
        <button
          onClick={reset}
          className="inline-flex items-center gap-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
        >
          Start new complaint
        </button>
      </div>

      <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
        <p className="text-xs text-gray-400 dark:text-gray-500">
          You can view and re-send this complaint from your{' '}
          <Link href="/dashboard" className="text-blue-600 dark:text-blue-400 hover:underline">
            dashboard
          </Link>
          .
        </p>
      </div>
    </div>
  )
}
