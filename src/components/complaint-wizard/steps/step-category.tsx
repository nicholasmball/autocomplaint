'use client'

import { useEffect, useRef, useState } from 'react'
import { useWizard } from '../wizard-context'
import type { ComplaintCategory } from '@/services/complaint-generator/types'

const CATEGORIES: { value: ComplaintCategory; label: string; icon: string }[] = [
  { value: 'billing', label: 'Billing', icon: '\u{1F4B0}' },
  { value: 'poor-service', label: 'Poor Service', icon: '\u{1F4C9}' },
  { value: 'faulty-product', label: 'Faulty Product', icon: '\u{1F527}' },
  { value: 'delivery', label: 'Delivery', icon: '\u{1F4E6}' },
  { value: 'contract-dispute', label: 'Contract Dispute', icon: '\u{1F4DD}' },
  { value: 'data-privacy', label: 'Data Privacy', icon: '\u{1F512}' },
  { value: 'unfair-treatment', label: 'Unfair Treatment', icon: '\u26A0\uFE0F' },
  { value: 'accessibility', label: 'Accessibility', icon: '\u267F' },
]

export function StepCategory() {
  const { state, update } = useWizard()
  const [speechSupported, setSpeechSupported] = useState(false)
  const [isListening, setIsListening] = useState(false)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null)

  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (SR) setSpeechSupported(true)
  }, [])

  function toggleVoice() {
    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop()
      setIsListening(false)
      return
    }

    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) return

    const recognition = new SR()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'en-GB'
    recognitionRef.current = recognition

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
      let finalTranscript = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript
        }
      }
      if (finalTranscript) {
        update({ description: state.description + finalTranscript })
      }
    }

    recognition.onerror = () => {
      setIsListening(false)
    }

    recognition.onend = () => {
      setIsListening(false)
    }

    recognition.start()
    setIsListening(true)
  }

  const charCount = state.description.length

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-1">What&apos;s the problem?</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Select a category and describe what happened.
        </p>
      </div>

      <div>
        <p className="text-sm font-medium mb-2">Select a category</p>
        <div role="radiogroup" aria-label="Complaint category" className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {CATEGORIES.map((cat) => {
            const selected = state.category === cat.value
            return (
              <button
                key={cat.value}
                role="radio"
                aria-checked={selected}
                onClick={() => update({ category: cat.value })}
                className={`flex flex-col items-center gap-1.5 rounded-lg border-2 p-3 text-center transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 ${
                  selected
                    ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/30'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-900'
                }`}
              >
                <span className="text-xl" aria-hidden="true">{cat.icon}</span>
                <span className="text-xs font-medium leading-tight">{cat.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-1">
          <label htmlFor="description" className="text-sm font-medium">
            Describe what happened
          </label>
          {speechSupported && (
            <button
              onClick={toggleVoice}
              aria-label={isListening ? 'Stop voice input' : 'Start voice input'}
              className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                isListening
                  ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 animate-pulse'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700'
              }`}
            >
              <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm-1-9c0-.55.45-1 1-1s1 .45 1 1v6c0 .55-.45 1-1 1s-1-.45-1-1V5z" />
                <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
              </svg>
              {isListening ? 'Listening...' : 'Voice'}
            </button>
          )}
        </div>
        <textarea
          id="description"
          value={state.description}
          onChange={(e) => {
            if (e.target.value.length <= 2000) {
              update({ description: e.target.value })
            }
          }}
          rows={5}
          placeholder="Describe what happened in your own words — when, what, and how it affected you."
          className="w-full border rounded-md px-3 py-2 text-sm dark:bg-gray-800 dark:border-gray-700 resize-y min-h-[120px] max-h-[300px] focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
        />
        <p className={`text-right text-xs mt-1 ${charCount > 1900 ? 'text-red-500' : 'text-gray-400 dark:text-gray-500'}`}>
          {charCount} / 2,000
        </p>
      </div>
    </div>
  )
}

// Extend Window for Speech Recognition
declare global {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  interface Window {
    SpeechRecognition: any
    webkitSpeechRecognition: any
  }
}
