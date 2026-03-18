'use client'

import { useWizard } from '../wizard-context'
import type { ComplaintCategory, ComplaintTone } from '@/services/complaint-generator/types'

const OUTCOME_SUGGESTIONS: Record<ComplaintCategory, string[]> = {
  'billing': ['Full refund', 'Partial refund', 'Billing correction', 'Apology'],
  'faulty-product': ['Replacement', 'Full refund', 'Repair', 'Apology'],
  'poor-service': ['Apology', 'Service credit', 'Explanation', 'Compensation'],
  'delivery': ['Redelivery', 'Full refund', 'Compensation', 'Apology'],
  'contract-dispute': ['Contract cancellation', 'Terms honoured', 'Compensation'],
  'data-privacy': ['Data deletion', 'Explanation', 'Compensation', 'Apology'],
  'unfair-treatment': ['Apology', 'Policy change', 'Compensation', 'Investigation'],
  'accessibility': ['Reasonable adjustment', 'Policy change', 'Apology'],
}

const TONES: { value: ComplaintTone; label: string; desc: string; icon: string }[] = [
  { value: 'formal', label: 'Formal', desc: 'Polite and professional', icon: '\u2709\uFE0F' },
  { value: 'firm', label: 'Firm', desc: 'Direct and assertive', icon: '\u{1F4AA}' },
  { value: 'escalatory', label: 'Escalatory', desc: 'Urgent with deadlines', icon: '\u26A1' },
  { value: 'conciliatory', label: 'Conciliatory', desc: 'Solution-focused', icon: '\u{1F91D}' },
]

export function StepOutcome() {
  const { state, update } = useWizard()
  const suggestions = state.category ? OUTCOME_SUGGESTIONS[state.category] : []
  const charCount = state.desiredOutcome.length

  function addSuggestion(text: string) {
    if (!state.desiredOutcome.trim()) {
      update({ desiredOutcome: text })
    } else {
      update({ desiredOutcome: state.desiredOutcome + ', ' + text })
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-1">What outcome do you want?</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Tell us what you&apos;d like to happen and choose the tone for your complaint.
        </p>
      </div>

      {/* Outcome */}
      <div>
        {suggestions.length > 0 && (
          <div className="mb-3">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Quick suggestions</p>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => addSuggestion(s)}
                  className="rounded-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-1 text-xs font-medium text-gray-700 dark:text-gray-300 hover:border-blue-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        <label htmlFor="desired-outcome" className="block text-sm font-medium mb-1">
          Desired outcome
        </label>
        <textarea
          id="desired-outcome"
          value={state.desiredOutcome}
          onChange={(e) => {
            if (e.target.value.length <= 500) {
              update({ desiredOutcome: e.target.value })
            }
          }}
          rows={3}
          placeholder="What would you like to happen? e.g., Full refund, Apology, Policy change"
          className="w-full border rounded-md px-3 py-2 text-sm dark:bg-gray-800 dark:border-gray-700 resize-y focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
        />
        <p className={`text-right text-xs mt-1 ${charCount > 450 ? 'text-red-500' : 'text-gray-400 dark:text-gray-500'}`}>
          {charCount} / 500
        </p>
      </div>

      {/* Tone */}
      <div>
        <p className="text-sm font-medium mb-2">Choose a tone</p>
        <div role="radiogroup" aria-label="Complaint tone" className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {TONES.map((t) => {
            const selected = state.tone === t.value
            return (
              <button
                key={t.value}
                role="radio"
                aria-checked={selected}
                onClick={() => update({ tone: t.value })}
                className={`flex items-start gap-3 rounded-lg border-2 p-4 text-left transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 ${
                  selected
                    ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/30'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-900'
                }`}
              >
                <span className="text-xl mt-0.5" aria-hidden="true">{t.icon}</span>
                <div>
                  <p className="text-sm font-semibold">{t.label}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{t.desc}</p>
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
