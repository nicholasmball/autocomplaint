'use client'

import { useState } from 'react'
import { useWizard } from '../wizard-context'

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

const RECIPIENT_LABELS: Record<string, string> = {
  'company': 'Company',
  'mp': 'MP',
  'regulator': 'Regulator',
}

interface StepReviewProps {
  userName: string
  userAddress: string
  onGenerate: () => void
  isGenerating: boolean
  generateError: string
}

export function StepReview({ userName, userAddress, onGenerate, isGenerating, generateError }: StepReviewProps) {
  const { state, setStep } = useWizard()

  const sections = [
    {
      title: 'Recipient',
      step: 1,
      content: `${RECIPIENT_LABELS[state.recipientType || ''] || ''}: ${state.recipientName}`,
    },
    {
      title: 'Problem',
      step: 2,
      content: `${CATEGORY_LABELS[state.category || ''] || ''} \u00B7 "${state.description.slice(0, 80)}${state.description.length > 80 ? '...' : ''}"`,
    },
    {
      title: 'Details',
      step: 3,
      content: [
        state.dateOfIncident && `Date: ${new Date(state.dateOfIncident).toLocaleDateString('en-GB')}`,
        state.referenceNumbers && `Ref: ${state.referenceNumbers}`,
        state.previousContact && 'Previous contact noted',
        !state.dateOfIncident && !state.referenceNumbers && !state.previousContact && 'None provided',
      ].filter(Boolean).join(' \u00B7 '),
    },
    {
      title: 'Outcome & Tone',
      step: 4,
      content: `"${state.desiredOutcome.slice(0, 60)}${state.desiredOutcome.length > 60 ? '...' : ''}" \u00B7 ${TONE_LABELS[state.tone || ''] || ''} tone`,
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-serif text-2xl text-slate-900 dark:text-white mb-1">Review your complaint</h2>
        <p className="text-sm text-slate-400 dark:text-slate-400">
          Check everything looks right before generating your complaint letter.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 divide-y divide-slate-200 dark:divide-slate-700 overflow-hidden">
        {sections.map((s) => (
          <div key={s.step} className="flex items-start justify-between p-4 bg-white dark:bg-slate-900/60">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-slate-400 dark:text-slate-400 uppercase tracking-wide mb-1">
                {s.title}
              </p>
              <p className="text-sm text-slate-900 dark:text-white">{s.content}</p>
            </div>
            <button
              onClick={() => setStep(s.step)}
              className="ml-4 text-xs font-medium text-amber-600 dark:text-amber-400 hover:text-amber-500 dark:hover:text-amber-300 shrink-0"
            >
              Edit
            </button>
          </div>
        ))}
      </div>

      {/* User profile info */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-stone-50 dark:bg-slate-900/50 p-4">
        <p className="text-xs font-medium text-slate-400 dark:text-slate-400 uppercase tracking-wide mb-2">
          Your details
        </p>
        {userName ? (
          <p className="text-sm">{userName}</p>
        ) : (
          <p className="text-sm text-slate-300 italic">Name not set</p>
        )}
        {userAddress ? (
          <p className="text-sm text-slate-600 dark:text-slate-400">{userAddress}</p>
        ) : (
          <p className="text-sm text-slate-300 italic">Address not set</p>
        )}
        <a
          href="/profile"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block mt-2 text-xs font-medium text-amber-600 dark:text-amber-400 hover:text-amber-500"
        >
          Update profile &rarr;
        </a>
      </div>

      {generateError && (
        <div className="rounded-xl bg-red-50 dark:bg-red-900/20 p-3">
          <p className="text-sm text-red-600 dark:text-red-400">{generateError}</p>
        </div>
      )}

      {/* Generate button */}
      <div className="relative">
        <button
          onClick={onGenerate}
          disabled={isGenerating}
          className="w-full bg-slate-900 dark:bg-amber-500 text-white rounded-xl px-4 py-3 text-sm font-semibold hover:bg-slate-700 dark:hover:bg-amber-400 disabled:opacity-50 transition-colors"
        >
          {isGenerating ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Generating your complaint...
            </span>
          ) : (
            'Generate Complaint'
          )}
        </button>
        {isGenerating && (
          <p className="text-center text-xs text-slate-400 dark:text-slate-400 mt-2">
            This usually takes about 5 seconds
          </p>
        )}
      </div>
    </div>
  )
}
