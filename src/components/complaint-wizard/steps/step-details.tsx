'use client'

import { useWizard } from '../wizard-context'

export function StepDetails() {
  const { state, update } = useWizard()

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-serif text-2xl text-slate-900 dark:text-white mb-1">Supporting details</h2>
        <p className="text-sm text-slate-400 dark:text-slate-400">
          These strengthen your complaint but aren&apos;t required. You can skip this step.
        </p>
      </div>

      <div>
        <label htmlFor="date-of-incident" className="block text-sm font-medium mb-1">
          When did this happen?
        </label>
        <input
          id="date-of-incident"
          type="date"
          value={state.dateOfIncident}
          onChange={(e) => update({ dateOfIncident: e.target.value })}
          className="w-full sm:w-auto border rounded-xl px-3 py-2 text-sm dark:bg-slate-900/50 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500"
        />
      </div>

      <div>
        <label htmlFor="reference-numbers" className="block text-sm font-medium mb-1">
          Reference numbers
        </label>
        <input
          id="reference-numbers"
          type="text"
          value={state.referenceNumbers}
          onChange={(e) => update({ referenceNumbers: e.target.value })}
          placeholder="Order, account, or case numbers"
          className="w-full border rounded-xl px-3 py-2 text-sm dark:bg-slate-900/50 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500"
        />
      </div>

      <div>
        <label htmlFor="previous-contact" className="block text-sm font-medium mb-1">
          Previous contact
        </label>
        <textarea
          id="previous-contact"
          value={state.previousContact}
          onChange={(e) => update({ previousContact: e.target.value })}
          rows={3}
          placeholder="Have you already tried to resolve this? What happened?"
          className="w-full border rounded-xl px-3 py-2 text-sm dark:bg-slate-900/50 dark:border-slate-700 resize-y focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500"
        />
      </div>
    </div>
  )
}
