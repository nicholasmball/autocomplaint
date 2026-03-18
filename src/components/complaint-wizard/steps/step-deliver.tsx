'use client'

import { useState, useMemo } from 'react'
import { useWizard } from '../wizard-context'

interface StepDeliverProps {
  onRegenerate: () => void
  isRegenerating: boolean
  onDeliver: (method: 'clipboard' | 'mailto') => void
}

export function StepDeliver({ onRegenerate, isRegenerating, onDeliver }: StepDeliverProps) {
  const { state, update, reset } = useWizard()
  const [isEditing, setIsEditing] = useState(false)
  const [editSubject, setEditSubject] = useState(state.generatedSubject)
  const [editLetter, setEditLetter] = useState(state.generatedLetter)
  const [copied, setCopied] = useState(false)
  const [showNewConfirm, setShowNewConfirm] = useState(false)
  const [showRegenConfirm, setShowRegenConfirm] = useState(false)

  const isLongComplaint = useMemo(
    () => encodeURIComponent(state.generatedLetter).length > 1500,
    [state.generatedLetter]
  )

  function saveEdits() {
    update({ generatedSubject: editSubject, generatedLetter: editLetter })
    setIsEditing(false)
    // Persist edits to DB (non-blocking)
    if (state.complaintId) {
      fetch(`/api/complaints/${state.complaintId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          generatedSubject: editSubject,
          generatedLetter: editLetter,
          status: 'reviewed',
        }),
      }).catch(() => {/* non-blocking */})
    }
  }

  function cancelEdits() {
    setEditSubject(state.generatedSubject)
    setEditLetter(state.generatedLetter)
    setIsEditing(false)
  }

  async function copyToClipboard() {
    const text = `Subject: ${state.generatedSubject}\n\n${state.generatedLetter}`
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => {
        setCopied(false)
        onDeliver('clipboard')
      }, 1500)
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement('textarea')
      textarea.value = text
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      setCopied(true)
      setTimeout(() => {
        setCopied(false)
        onDeliver('clipboard')
      }, 1500)
    }
  }

  function openInEmail() {
    const email = state.recipientEmail
    const subject = encodeURIComponent(state.generatedSubject)
    const body = encodeURIComponent(state.generatedLetter)
    window.open(`mailto:${email}?subject=${subject}&body=${body}`, '_self')
    onDeliver('mailto')
  }

  function handleRegenerate() {
    if (!showRegenConfirm) {
      setShowRegenConfirm(true)
      return
    }
    setShowRegenConfirm(false)
    onRegenerate()
  }

  function handleNewComplaint() {
    if (!showNewConfirm) {
      setShowNewConfirm(true)
      return
    }
    reset()
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-1">Your complaint is ready</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Review your letter below, then copy it or open it in your email client.
        </p>
      </div>

      {/* Letter preview */}
      <div className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="bg-gray-50 dark:bg-gray-800/50 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          {isEditing ? (
            <input
              type="text"
              value={editSubject}
              onChange={(e) => setEditSubject(e.target.value)}
              className="w-full border rounded-md px-2 py-1 text-sm font-medium dark:bg-gray-800 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          ) : (
            <p className="text-sm font-medium">
              <span className="text-gray-500 dark:text-gray-400">Subject: </span>
              {state.generatedSubject}
            </p>
          )}
        </div>
        <div className="bg-white dark:bg-gray-900 p-4 sm:p-6">
          {isEditing ? (
            <textarea
              value={editLetter}
              onChange={(e) => setEditLetter(e.target.value)}
              rows={16}
              className="w-full border rounded-md px-3 py-2 text-sm dark:bg-gray-800 dark:border-gray-700 resize-y font-serif leading-relaxed focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          ) : (
            <div className="font-serif text-sm leading-relaxed whitespace-pre-wrap text-gray-800 dark:text-gray-200">
              {state.generatedLetter}
            </div>
          )}
        </div>
        <div className="bg-gray-50 dark:bg-gray-800/50 px-4 py-2 border-t border-gray-200 dark:border-gray-700">
          {isEditing ? (
            <div className="flex gap-2">
              <button
                onClick={saveEdits}
                className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700"
              >
                Save changes
              </button>
              <button
                onClick={cancelEdits}
                className="text-xs font-medium text-gray-500 hover:text-gray-700"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700"
            >
              Edit letter
            </button>
          )}
        </div>
      </div>

      {/* Delivery */}
      <div className="space-y-3">
        <p className="text-sm font-medium">Deliver your complaint</p>

        <div>
          <label htmlFor="recipient-email" className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
            Recipient email
          </label>
          <input
            id="recipient-email"
            type="email"
            value={state.recipientEmail}
            onChange={(e) => update({ recipientEmail: e.target.value })}
            placeholder="Enter the recipient's email address"
            className="w-full border rounded-md px-3 py-2 text-sm dark:bg-gray-800 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
          />
        </div>

        {isLongComplaint && (
          <div
            role="alert"
            className="flex gap-3 items-start rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 p-3 text-sm text-amber-700 dark:text-amber-400"
          >
            <svg className="h-5 w-5 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <p>
              <span className="font-medium">Long complaint detected.</span>{' '}
              Your letter may be truncated when opened in some email clients. We recommend copying to clipboard and pasting into your email instead.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            onClick={copyToClipboard}
            className={`flex items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-medium transition-colors ${
              copied
                ? 'bg-green-600 text-white'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {copied ? (
              <>
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                Copied!
              </>
            ) : (
              <>
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                </svg>
                Copy to clipboard
              </>
            )}
          </button>
          <button
            onClick={openInEmail}
            disabled={!state.recipientEmail}
            title={!state.recipientEmail ? 'Enter a recipient email address above' : isLongComplaint ? 'Warning: letter may be truncated in some email clients' : undefined}
            className="relative flex items-center justify-center gap-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            Open in email client
            {isLongComplaint && (
              <span
                aria-label="Warning: letter may be truncated"
                className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-white text-xs font-bold"
              >
                !
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Secondary actions */}
      <div className="flex flex-wrap gap-3 pt-2 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={handleRegenerate}
          disabled={isRegenerating}
          className="text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 disabled:opacity-50"
        >
          {isRegenerating ? 'Regenerating...' : showRegenConfirm ? 'This will replace your letter. Confirm?' : 'Regenerate'}
        </button>
        <button
          onClick={handleNewComplaint}
          className="text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
        >
          {showNewConfirm ? 'Are you sure? This clears everything.' : 'New complaint'}
        </button>
      </div>
    </div>
  )
}
