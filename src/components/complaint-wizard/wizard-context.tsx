'use client'

import { createContext, useContext, useCallback, useEffect, useRef, useState } from 'react'
import type { ComplaintCategory, ComplaintTone, RecipientType } from '@/services/complaint-generator/types'

const STORAGE_KEY = 'autocomplaint-draft-v1'

export interface MPDetails {
  name: string
  party: string
  constituency: string
  email: string | null
  photoUrl: string | null
}

export interface WizardState {
  recipientType: RecipientType | null
  recipientName: string
  recipientEmail: string
  mpDetails: MPDetails | null
  category: ComplaintCategory | null
  description: string
  dateOfIncident: string
  referenceNumbers: string
  previousContact: string
  desiredOutcome: string
  tone: ComplaintTone | null
  generatedLetter: string
  generatedSubject: string
  complaintId: string | null
}

const initialState: WizardState = {
  recipientType: null,
  recipientName: '',
  recipientEmail: '',
  mpDetails: null,
  category: null,
  description: '',
  dateOfIncident: '',
  referenceNumbers: '',
  previousContact: '',
  desiredOutcome: '',
  tone: null,
  generatedLetter: '',
  generatedSubject: '',
  complaintId: null,
}

interface WizardContextValue {
  state: WizardState
  update: (partial: Partial<WizardState>) => void
  reset: () => void
  step: number
  setStep: (step: number) => void
  savedAt: number | null
}

const WizardContext = createContext<WizardContextValue | null>(null)

export function useWizard() {
  const ctx = useContext(WizardContext)
  if (!ctx) throw new Error('useWizard must be used within WizardProvider')
  return ctx
}

export function WizardProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<WizardState>(initialState)
  const [step, setStep] = useState(1)
  const [savedAt, setSavedAt] = useState<number | null>(null)
  const [hydrated, setHydrated] = useState(false)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Restore draft from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (parsed.state) setState(parsed.state)
        if (parsed.step) setStep(parsed.step)
      }
    } catch {
      // ignore corrupt data
    }
    setHydrated(true)
  }, [])

  // Debounced auto-save to localStorage (skip success step to avoid stale state on reload)
  useEffect(() => {
    if (!hydrated) return
    if (step >= 7) return
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ state, step }))
        setSavedAt(Date.now())
      } catch {
        // storage full, ignore
      }
    }, 500)
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current)
    }
  }, [state, step, hydrated])

  const update = useCallback((partial: Partial<WizardState>) => {
    setState(prev => ({ ...prev, ...partial }))
  }, [])

  const reset = useCallback(() => {
    setState(initialState)
    setStep(1)
    setSavedAt(null)
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {
      // ignore
    }
  }, [])

  return (
    <WizardContext.Provider value={{ state, update, reset, step, setStep, savedAt }}>
      {children}
    </WizardContext.Provider>
  )
}
