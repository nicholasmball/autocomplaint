'use client'

import { useWizard } from './wizard-context'

const STEPS = [
  { label: 'Recipient', short: '1' },
  { label: 'Problem', short: '2' },
  { label: 'Details', short: '3' },
  { label: 'Outcome', short: '4' },
  { label: 'Review', short: '5' },
  { label: 'Send', short: '6' },
]

export function WizardProgressBar() {
  const { step, setStep } = useWizard()

  // Progress percentage for the line
  const progressPercent = Math.max(0, ((step - 1) / (STEPS.length - 1)) * 100)

  return (
    <nav aria-label="Complaint form progress" className="w-full">
      <div className="relative">
        {/* Background line */}
        <div className="absolute top-3 left-0 right-0 h-0.5 bg-slate-100 dark:bg-slate-700" />
        {/* Progress line */}
        <div
          className="absolute top-3 left-0 h-0.5 bg-amber-500 transition-all duration-500"
          style={{ width: `${progressPercent}%` }}
        />

        <ol className="relative flex items-start justify-between">
          {STEPS.map((s, i) => {
            const num = i + 1
            const isCompleted = num < step
            const isCurrent = num === step
            const isFuture = num > step

            return (
              <li key={num} className="flex flex-col items-center z-10">
                {isCompleted ? (
                  <button
                    onClick={() => setStep(num)}
                    aria-label={`Step ${num}: ${s.label} (completed) — click to edit`}
                    className="relative flex h-6 w-6 items-center justify-center rounded-full bg-amber-500 transition-all hover:bg-amber-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-500"
                  >
                    <svg className="h-3.5 w-3.5 text-slate-950" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </button>
                ) : isCurrent ? (
                  <div
                    aria-current="step"
                    aria-label={`Step ${num}: ${s.label} (current)`}
                    className="relative flex h-6 w-6 items-center justify-center rounded-full bg-amber-500 border-4 border-amber-500"
                  >
                    <div className="w-2 h-2 bg-white dark:bg-slate-950 rounded-full" />
                  </div>
                ) : (
                  <div
                    aria-label={`Step ${num}: ${s.label} (upcoming)`}
                    className="flex h-6 w-6 items-center justify-center rounded-full bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-600"
                  />
                )}
                <span
                  className={`hidden sm:block text-xs font-medium mt-2 ${
                    isFuture
                      ? 'text-slate-400 dark:text-slate-500'
                      : isCurrent
                        ? 'text-amber-600 dark:text-amber-400'
                        : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {s.label}
                </span>
              </li>
            )
          })}
        </ol>
      </div>
      {/* Mobile: show current step label */}
      <p className="mt-3 text-center text-xs font-medium text-amber-600 dark:text-amber-400 sm:hidden">
        Step {step}: {STEPS[step - 1]?.label}
      </p>
    </nav>
  )
}
