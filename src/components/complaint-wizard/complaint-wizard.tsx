'use client'

import { useCallback, useEffect, useState } from 'react'
import { WizardProvider, useWizard } from './wizard-context'
import { WizardProgressBar } from './wizard-progress-bar'
import { StepRecipient } from './steps/step-recipient'
import { StepCategory } from './steps/step-category'
import { StepDetails } from './steps/step-details'
import { StepOutcome } from './steps/step-outcome'
import { StepReview } from './steps/step-review'
import { StepDeliver } from './steps/step-deliver'
import { StepSuccess } from './steps/step-success'
import Link from 'next/link'

interface ComplaintWizardProps {
  userName: string
  userAddress: string
}

export function ComplaintWizard({ userName, userAddress }: ComplaintWizardProps) {
  return (
    <WizardProvider>
      <WizardInner userName={userName} userAddress={userAddress} />
    </WizardProvider>
  )
}

function WizardInner({ userName, userAddress }: ComplaintWizardProps) {
  const { state, update, step, setStep, savedAt } = useWizard()
  const [isGenerating, setIsGenerating] = useState(false)
  const [generateError, setGenerateError] = useState('')
  const [showSaved, setShowSaved] = useState(false)

  // Show "Draft saved" indicator
  useEffect(() => {
    if (savedAt) {
      setShowSaved(true)
      const timer = setTimeout(() => setShowSaved(false), 2000)
      return () => clearTimeout(timer)
    }
  }, [savedAt])

  const canProceed = useCallback((): boolean => {
    switch (step) {
      case 1:
        return !!state.recipientType && !!state.recipientName.trim()
      case 2:
        return !!state.category && state.description.trim().length >= 20
      case 3:
        return true // all optional
      case 4:
        return state.desiredOutcome.trim().length >= 10 && !!state.tone
      case 5:
        return true
      default:
        return true
    }
  }, [step, state])

  const [validationError, setValidationError] = useState('')

  function handleNext() {
    setValidationError('')

    if (!canProceed()) {
      switch (step) {
        case 1:
          if (!state.recipientType) setValidationError('Please select who you are complaining about')
          else setValidationError('Please enter the recipient name')
          break
        case 2:
          if (!state.category) setValidationError('Please select a category')
          else setValidationError('Please describe your complaint (at least 20 characters)')
          break
        case 4:
          if (state.desiredOutcome.trim().length < 10) setValidationError('Please describe your desired outcome (at least 10 characters)')
          else setValidationError('Please choose a tone')
          break
      }
      return
    }

    if (step < 6) setStep(step + 1)
  }

  function handleBack() {
    setValidationError('')
    if (step > 1) setStep(step - 1)
  }

  async function saveComplaintDraft(): Promise<string | null> {
    // Create or return existing complaint ID
    if (state.complaintId) return state.complaintId

    try {
      const res = await fetch('/api/complaints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientType: state.recipientType,
          recipientName: state.recipientName,
          recipientEmail: state.recipientEmail || '',
          category: state.category,
          tone: state.tone,
          description: state.description,
          desiredOutcome: state.desiredOutcome,
          dateOfIncident: state.dateOfIncident || undefined,
          referenceNumbers: state.referenceNumbers || undefined,
          previousContact: state.previousContact || undefined,
          mpDetails: state.mpDetails || undefined,
        }),
      })

      if (!res.ok) return null
      const data = await res.json()
      update({ complaintId: data.id })
      return data.id
    } catch {
      return null
    }
  }

  async function updateComplaint(complaintId: string, updates: Record<string, unknown>) {
    try {
      await fetch(`/api/complaints/${complaintId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })
    } catch {
      // Non-blocking — delivery still works even if persistence fails
    }
  }

  async function handleGenerate() {
    setIsGenerating(true)
    setGenerateError('')

    try {
      // Save draft to DB first (R3)
      const complaintId = await saveComplaintDraft()

      const res = await fetch('/api/complaints/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: state.category,
          tone: state.tone,
          recipientType: state.recipientType,
          recipientName: state.recipientName,
          description: state.description,
          desiredOutcome: state.desiredOutcome,
          userName: userName || undefined,
          userAddress: userAddress || undefined,
          previousContact: state.previousContact || undefined,
          referenceNumbers: state.referenceNumbers || undefined,
          dateOfIncident: state.dateOfIncident || undefined,
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || `Generation failed (${res.status})`)
      }

      const data = await res.json()
      update({
        generatedLetter: data.letter,
        generatedSubject: data.subject,
      })

      // Update complaint record with generated content (R3)
      if (complaintId) {
        updateComplaint(complaintId, {
          status: 'generated',
          generatedLetter: data.letter,
          generatedSubject: data.subject,
        })
      }

      setStep(6)
    } catch (err) {
      setGenerateError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  async function handleDeliver(method: 'clipboard' | 'mailto') {
    const complaintId = state.complaintId
    if (complaintId) {
      await updateComplaint(complaintId, {
        status: 'delivered',
        deliveryMethod: method,
        recipientEmail: state.recipientEmail,
      })
    }
    // Clear localStorage draft (AC5) before showing success
    try { localStorage.removeItem('autocomplaint-draft-v1') } catch { /* ignore */ }
    setStep(7) // Success step
  }

  const isStep3 = step === 3

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Link
          href="/dashboard"
          className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 flex items-center gap-1"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Dashboard
        </Link>
        <span
          className={`text-xs text-gray-400 dark:text-gray-500 transition-opacity duration-300 ${
            showSaved ? 'opacity-100' : 'opacity-0'
          }`}
        >
          Draft saved &#10003;
        </span>
      </div>

      {/* Progress bar (hidden on success step) */}
      {step <= 6 && (
        <div className="mb-8">
          <WizardProgressBar />
        </div>
      )}

      {/* Step content */}
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow p-6 sm:p-8" aria-live="polite">
        {step === 1 && <StepRecipient />}
        {step === 2 && <StepCategory />}
        {step === 3 && <StepDetails />}
        {step === 4 && <StepOutcome />}
        {step === 5 && (
          <StepReview
            userName={userName}
            userAddress={userAddress}
            onGenerate={handleGenerate}
            isGenerating={isGenerating}
            generateError={generateError}
          />
        )}
        {step === 6 && (
          <StepDeliver
            onRegenerate={handleGenerate}
            isRegenerating={isGenerating}
            onDeliver={handleDeliver}
          />
        )}
        {step === 7 && (
          <StepSuccess />
        )}
      </div>

      {/* Validation error */}
      {validationError && (
        <div className="mt-3 rounded-md bg-red-50 dark:bg-red-900/20 px-4 py-2">
          <p className="text-sm text-red-600 dark:text-red-400">{validationError}</p>
        </div>
      )}

      {/* Footer navigation (steps 1-4 only) */}
      {step <= 4 && (
        <div className="flex items-center justify-between mt-6">
          <div>
            {step > 1 && (
              <button
                onClick={handleBack}
                className="flex items-center gap-1 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
                Back
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            {isStep3 && (
              <button
                onClick={() => setStep(4)}
                className="text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              >
                Skip
              </button>
            )}
            <button
              onClick={handleNext}
              className="bg-blue-600 text-white rounded-md px-5 py-2 text-sm font-medium hover:bg-blue-700 flex items-center gap-1"
            >
              Next
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Step 5 has its own Generate button, Step 6 has delivery actions */}
      {step === 5 && (
        <div className="flex items-center mt-6">
          <button
            onClick={handleBack}
            className="flex items-center gap-1 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
        </div>
      )}
    </div>
  )
}
