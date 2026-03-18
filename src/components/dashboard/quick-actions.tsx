'use client'

import { useState } from 'react'

interface QuickActionsProps {
  subject: string
  letter: string
  recipientEmail: string
  compact?: boolean
}

export function QuickActions({ subject, letter, recipientEmail, compact }: QuickActionsProps) {
  const [copied, setCopied] = useState(false)

  async function copyToClipboard(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
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

  function openInEmail(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    const subjectEncoded = encodeURIComponent(subject)
    const bodyEncoded = encodeURIComponent(letter)
    window.open(`mailto:${recipientEmail}?subject=${subjectEncoded}&body=${bodyEncoded}`, '_self')
  }

  if (compact) {
    return (
      <div className="flex items-center gap-1" aria-live="polite">
        <button
          onClick={copyToClipboard}
          className={`w-8 h-8 rounded-md border flex items-center justify-center text-sm transition-colors ${
            copied
              ? 'bg-green-600 text-white border-green-600'
              : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-gray-200'
          }`}
          aria-label={copied ? 'Copied!' : 'Copy letter to clipboard'}
        >
          {copied ? (
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
            </svg>
          )}
        </button>
        <button
          onClick={openInEmail}
          disabled={!recipientEmail}
          className="w-8 h-8 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-gray-200 flex items-center justify-center text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Open in email client"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </button>
      </div>
    )
  }

  return (
    <div className="flex gap-2 flex-wrap" aria-live="polite">
      <button
        onClick={copyToClipboard}
        className={`inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-xs font-medium min-h-[44px] transition-colors ${
          copied
            ? 'bg-green-600 text-white'
            : 'bg-blue-600 text-white hover:bg-blue-700'
        }`}
      >
        {copied ? (
          <>
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            Copied!
          </>
        ) : (
          <>
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
            </svg>
            Copy
          </>
        )}
      </button>
      <button
        onClick={openInEmail}
        disabled={!recipientEmail}
        className="inline-flex items-center gap-1.5 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 min-h-[44px] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
        Email
      </button>
    </div>
  )
}
