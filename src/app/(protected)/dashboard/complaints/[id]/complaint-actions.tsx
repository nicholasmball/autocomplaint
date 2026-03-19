'use client'

import { useState } from 'react'

interface ComplaintActionsProps {
  subject: string
  letter: string
  recipientEmail: string
}

export function ComplaintActions({ subject, letter, recipientEmail }: ComplaintActionsProps) {
  const [copied, setCopied] = useState(false)

  async function copyToClipboard() {
    const text = `Subject: ${subject}\n\n${letter}`
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      const textarea = document.createElement('textarea')
      textarea.value = text
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 3000)
  }

  function openInEmail() {
    const subjectEncoded = encodeURIComponent(subject)
    const bodyEncoded = encodeURIComponent(letter)
    window.open(`mailto:${recipientEmail}?subject=${subjectEncoded}&body=${bodyEncoded}`, '_self')
  }

  return (
    <div className="flex gap-3 flex-wrap" aria-live="polite">
      <button
        onClick={copyToClipboard}
        className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
          copied
            ? 'bg-green-600 text-white'
            : 'bg-slate-900 dark:bg-amber-500 text-white dark:text-slate-950 hover:bg-slate-800 dark:hover:bg-amber-400'
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
            Copy letter
          </>
        )}
      </button>
      <button
        onClick={openInEmail}
        disabled={!recipientEmail}
        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/50 px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
        Open in email client
      </button>
    </div>
  )
}
