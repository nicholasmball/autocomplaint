'use client'

import { useEffect, useRef, useState } from 'react'
import { useWizard } from '../wizard-context'
import type { ComplaintCategory } from '@/services/complaint-generator/types'

const CATEGORIES: { value: ComplaintCategory; label: string; icon: React.ReactNode }[] = [
  { value: 'billing', label: 'Billing', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
  { value: 'poor-service', label: 'Poor Service', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" /></svg> },
  { value: 'faulty-product', label: 'Faulty Product', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg> },
  { value: 'delivery', label: 'Delivery', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg> },
  { value: 'contract-dispute', label: 'Contract Dispute', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg> },
  { value: 'data-privacy', label: 'Data Privacy', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg> },
  { value: 'unfair-treatment', label: 'Unfair Treatment', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a2.828 2.828 0 01-1.414-2.415" /></svg> },
  { value: 'accessibility', label: 'Accessibility', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg> },
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
    <div className="space-y-8">
      <div>
        <h2 className="font-serif text-2xl text-slate-900 dark:text-white mb-2">What&apos;s the problem?</h2>
        <p className="text-slate-400 text-lg">
          Select a category and describe what happened.
        </p>
      </div>

      <div>
        <p className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-3">Select a category</p>
        <div role="radiogroup" aria-label="Complaint category" className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {CATEGORIES.map((cat) => {
            const selected = state.category === cat.value
            return (
              <button
                key={cat.value}
                role="radio"
                aria-checked={selected}
                onClick={() => update({ category: cat.value })}
                className={`flex items-center gap-2 rounded-xl px-3.5 py-3 text-sm font-medium transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-500 ${
                  selected
                    ? 'bg-slate-900 dark:bg-amber-500 text-white dark:text-slate-950 shadow-md'
                    : 'bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600'
                }`}
              >
                {cat.icon}
                <span className="leading-tight">{cat.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label htmlFor="description" className="text-sm font-medium text-slate-600 dark:text-slate-300">
            Describe what happened
          </label>
          {speechSupported && (
            <button
              onClick={toggleVoice}
              aria-label={isListening ? 'Stop voice input' : 'Start voice input'}
              className={`flex items-center gap-1.5 rounded-xl px-2.5 py-1 text-xs font-medium transition-colors ${
                isListening
                  ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 animate-pulse'
                  : 'bg-slate-900/5 text-slate-500 hover:bg-slate-100 dark:bg-slate-800/50 dark:text-slate-400 dark:hover:bg-slate-700'
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
          className="w-full px-4 py-3.5 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-white text-base leading-relaxed placeholder-slate-300 dark:placeholder-slate-500 resize-y min-h-[140px] max-h-[300px] focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 transition-all shadow-sm"
        />
        <p className={`text-right text-xs mt-1 ${charCount > 1900 ? 'text-red-500' : 'text-slate-300 dark:text-slate-500'}`}>
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
