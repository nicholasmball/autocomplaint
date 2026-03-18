'use client'

import { useState } from 'react'
import { useWizard } from '../wizard-context'
import type { RecipientType } from '@/services/complaint-generator/types'

const RECIPIENT_TYPES: { value: RecipientType; label: string; icon: string; desc: string }[] = [
  { value: 'company', label: 'Company', icon: '\u{1F3E2}', desc: 'A business or service provider' },
  { value: 'mp', label: 'My MP', icon: '\u{1F3DB}\uFE0F', desc: 'Your member of parliament' },
  { value: 'regulator', label: 'Regulator', icon: '\u2696\uFE0F', desc: 'An ombudsman or regulator' },
]

interface MPInfo {
  name: string
  party: string
  constituency: string
  email: string | null
  photoUrl: string | null
}

export function StepRecipient() {
  const { state, update } = useWizard()
  const [postcode, setPostcode] = useState(state.mpDetails ? '' : '')
  const [mpLoading, setMpLoading] = useState(false)
  const [mpError, setMpError] = useState('')

  function selectType(type: RecipientType) {
    if (type === state.recipientType) return
    update({
      recipientType: type,
      recipientName: type === 'mp' && state.mpDetails ? state.mpDetails.name : '',
      recipientEmail: type === 'mp' && state.mpDetails?.email ? state.mpDetails.email : '',
      mpDetails: type === 'mp' ? state.mpDetails : null,
    })
    setMpError('')
  }

  async function lookupMP() {
    const cleaned = postcode.trim().toUpperCase()
    if (!cleaned) return
    if (!/^[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}$/i.test(cleaned)) {
      setMpError('Please enter a valid UK postcode (e.g., SW1A 1AA)')
      return
    }

    setMpLoading(true)
    setMpError('')

    try {
      const res = await fetch(`/api/mp?postcode=${encodeURIComponent(cleaned)}`)
      if (!res.ok) throw new Error('Lookup failed')
      const data = await res.json()

      if (!data.mp) {
        setMpError(data.message || 'Could not find an MP for that postcode')
        setMpLoading(false)
        return
      }

      const mp: MPInfo = {
        name: data.mp.name,
        party: data.mp.party,
        constituency: data.mp.constituency || data.constituency,
        email: data.mp.email,
        photoUrl: data.mp.photoUrl,
      }

      update({
        mpDetails: mp,
        recipientName: mp.name,
        recipientEmail: mp.email || '',
      })
    } catch {
      setMpError('Something went wrong. Please try again.')
    } finally {
      setMpLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-1">Who are you complaining about?</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Select who should receive your complaint.
        </p>
      </div>

      <div role="radiogroup" aria-label="Recipient type" className="grid grid-cols-3 gap-3">
        {RECIPIENT_TYPES.map((rt) => {
          const selected = state.recipientType === rt.value
          return (
            <button
              key={rt.value}
              role="radio"
              aria-checked={selected}
              onClick={() => selectType(rt.value)}
              className={`relative flex flex-col items-center gap-2 rounded-lg border-2 p-4 text-center transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 ${
                selected
                  ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/30'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-900'
              }`}
            >
              <span className="text-2xl" aria-hidden="true">{rt.icon}</span>
              <span className="text-sm font-semibold">{rt.label}</span>
              <span className="hidden sm:block text-xs text-gray-500 dark:text-gray-400">{rt.desc}</span>
              {selected && (
                <div className="absolute top-2 right-2">
                  <svg className="h-4 w-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </button>
          )
        })}
      </div>

      {/* Conditional fields */}
      {state.recipientType === 'company' && (
        <div className="space-y-4 motion-safe:animate-[fadeSlideIn_200ms_ease-out]">
          <div>
            <label htmlFor="company-name" className="block text-sm font-medium mb-1">
              Company name
            </label>
            <input
              id="company-name"
              type="text"
              value={state.recipientName}
              onChange={(e) => update({ recipientName: e.target.value })}
              placeholder="e.g., British Gas, Sky, BT"
              className="w-full border rounded-md px-3 py-2 text-sm dark:bg-gray-800 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
            />
          </div>
          <div>
            <label htmlFor="company-email" className="block text-sm font-medium mb-1">
              Complaint email address{' '}
              <span className="font-normal text-gray-400 dark:text-gray-500">(optional — you can add this later)</span>
            </label>
            <input
              id="company-email"
              type="email"
              value={state.recipientEmail}
              onChange={(e) => update({ recipientEmail: e.target.value })}
              placeholder="e.g., complaints@britishgas.co.uk"
              className="w-full border rounded-md px-3 py-2 text-sm dark:bg-gray-800 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
            />
          </div>
        </div>
      )}

      {state.recipientType === 'mp' && (
        <div className="space-y-4 motion-safe:animate-[fadeSlideIn_200ms_ease-out]">
          <div>
            <label htmlFor="postcode" className="block text-sm font-medium mb-1">
              Your postcode
            </label>
            <div className="flex gap-2">
              <input
                id="postcode"
                type="text"
                value={postcode}
                onChange={(e) => setPostcode(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && lookupMP()}
                placeholder="e.g., SW1A 1AA"
                aria-describedby={mpError ? 'mp-error' : undefined}
                className="flex-1 border rounded-md px-3 py-2 text-sm dark:bg-gray-800 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
              />
              <button
                onClick={lookupMP}
                disabled={mpLoading || !postcode.trim()}
                className="bg-blue-600 text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50 whitespace-nowrap"
              >
                {mpLoading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Looking up...
                  </span>
                ) : (
                  'Look up'
                )}
              </button>
            </div>
            {mpError && (
              <p id="mp-error" className="mt-1.5 text-sm text-red-600 dark:text-red-400">{mpError}</p>
            )}
          </div>

          {state.mpDetails && (
            <div className="flex items-start gap-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-4">
              {state.mpDetails.photoUrl && (
                <img
                  src={state.mpDetails.photoUrl}
                  alt={`Photo of ${state.mpDetails.name}`}
                  className="h-16 w-16 rounded-full object-cover border-2 border-white dark:border-gray-700 shadow-sm"
                />
              )}
              <div className="min-w-0">
                <p className="font-semibold text-sm">{state.mpDetails.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {state.mpDetails.party} &mdash; {state.mpDetails.constituency}
                </p>
                {state.mpDetails.email && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">
                    {state.mpDetails.email}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {state.recipientType === 'regulator' && (
        <div className="space-y-4 motion-safe:animate-[fadeSlideIn_200ms_ease-out]">
          <div>
            <label htmlFor="regulator-name" className="block text-sm font-medium mb-1">
              Regulator or ombudsman name
            </label>
            <input
              id="regulator-name"
              type="text"
              value={state.recipientName}
              onChange={(e) => update({ recipientName: e.target.value })}
              placeholder="e.g., Ofcom, Financial Ombudsman Service"
              className="w-full border rounded-md px-3 py-2 text-sm dark:bg-gray-800 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
            />
          </div>
          <div>
            <label htmlFor="regulator-email" className="block text-sm font-medium mb-1">
              Complaint email address{' '}
              <span className="font-normal text-gray-400 dark:text-gray-500">(optional — you can add this later)</span>
            </label>
            <input
              id="regulator-email"
              type="email"
              value={state.recipientEmail}
              onChange={(e) => update({ recipientEmail: e.target.value })}
              placeholder="e.g., complaints@ofcom.org.uk"
              className="w-full border rounded-md px-3 py-2 text-sm dark:bg-gray-800 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
            />
          </div>
        </div>
      )}
    </div>
  )
}
