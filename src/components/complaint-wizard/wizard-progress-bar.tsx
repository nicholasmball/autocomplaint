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

  return (
    <nav aria-label="Complaint form progress" className="w-full">
      <ol className="flex items-center justify-between">
        {STEPS.map((s, i) => {
          const num = i + 1
          const isCompleted = num < step
          const isCurrent = num === step
          const isFuture = num > step

          return (
            <li
              key={num}
              className="flex flex-1 items-center last:flex-none"
            >
              <div className="flex flex-col items-center gap-1.5">
                {isCompleted ? (
                  <button
                    onClick={() => setStep(num)}
                    aria-label={`Step ${num}: ${s.label} (completed) — click to edit`}
                    className="relative flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white text-xs font-bold transition-all hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </button>
                ) : isCurrent ? (
                  <div
                    aria-current="step"
                    aria-label={`Step ${num}: ${s.label} (current)`}
                    className="relative flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white text-xs font-bold ring-4 ring-blue-100 dark:ring-blue-900/40"
                  >
                    {num}
                  </div>
                ) : (
                  <div
                    aria-label={`Step ${num}: ${s.label} (upcoming)`}
                    className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-gray-300 dark:border-gray-600 text-gray-400 dark:text-gray-500 text-xs font-bold"
                  >
                    {num}
                  </div>
                )}
                <span
                  className={`hidden sm:block text-xs font-medium ${
                    isFuture
                      ? 'text-gray-400 dark:text-gray-500'
                      : isCurrent
                        ? 'text-blue-600 dark:text-blue-400'
                        : 'text-gray-600 dark:text-gray-400'
                  }`}
                >
                  {s.label}
                </span>
              </div>

              {/* Connector line */}
              {num < STEPS.length && (
                <div className="mx-2 h-0.5 flex-1 sm:mx-3">
                  <div
                    className={`h-full rounded-full transition-colors ${
                      num < step
                        ? 'bg-blue-600'
                        : 'bg-gray-200 dark:bg-gray-700'
                    }`}
                  />
                </div>
              )}
            </li>
          )
        })}
      </ol>
      {/* Mobile: show current step label */}
      <p className="mt-2 text-center text-xs font-medium text-blue-600 dark:text-blue-400 sm:hidden">
        Step {step}: {STEPS[step - 1]?.label}
      </p>
    </nav>
  )
}
