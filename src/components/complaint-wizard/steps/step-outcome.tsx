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

const TONES: { value: ComplaintTone; label: string; desc: string; icon: React.ReactNode }[] = [
  { value: 'formal', label: 'Formal', desc: 'Polite and professional', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg> },
  { value: 'firm', label: 'Firm', desc: 'Direct and assertive', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg> },
  { value: 'escalatory', label: 'Escalatory', desc: 'Urgent with deadlines', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg> },
  { value: 'conciliatory', label: 'Conciliatory', desc: 'Solution-focused', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg> },
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
    <div className="space-y-8">
      <div>
        <h2 className="font-serif text-2xl text-slate-900 dark:text-white mb-2">What outcome do you want?</h2>
        <p className="text-slate-400 text-lg">
          Tell us what you&apos;d like to happen and choose the tone for your complaint.
        </p>
      </div>

      {/* Outcome */}
      <div>
        {suggestions.length > 0 && (
          <div className="mb-4">
            <p className="text-sm font-medium text-slate-400 mb-2">Quick suggestions</p>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => addSuggestion(s)}
                  className="rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 px-3.5 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-900 hover:text-white hover:border-slate-900 dark:hover:bg-amber-500 dark:hover:text-slate-950 dark:hover:border-amber-500 transition-all"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        <label htmlFor="desired-outcome" className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">
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
          className="w-full px-4 py-3.5 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-white text-base leading-relaxed placeholder-slate-300 dark:placeholder-slate-500 resize-y focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 transition-all shadow-sm"
        />
        <p className={`text-right text-xs mt-1 ${charCount > 450 ? 'text-red-500' : 'text-slate-300 dark:text-slate-500'}`}>
          {charCount} / 500
        </p>
      </div>

      {/* Tone */}
      <div>
        <p className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-3">Choose a tone</p>
        <div role="radiogroup" aria-label="Complaint tone" className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {TONES.map((t) => {
            const selected = state.tone === t.value
            return (
              <button
                key={t.value}
                role="radio"
                aria-checked={selected}
                onClick={() => update({ tone: t.value })}
                className={`flex items-center gap-3 rounded-xl px-4 py-3.5 text-left transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-500 ${
                  selected
                    ? 'bg-slate-900 dark:bg-amber-500 text-white dark:text-slate-950 shadow-md'
                    : 'bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600'
                }`}
              >
                {t.icon}
                <div>
                  <p className={`text-sm font-semibold ${selected ? '' : 'text-slate-900 dark:text-white'}`}>{t.label}</p>
                  <p className={`text-xs ${selected ? 'text-white/70 dark:text-slate-950/70' : 'text-slate-400'}`}>{t.desc}</p>
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
