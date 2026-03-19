'use client'

import { useState } from 'react'
import { useWizard } from '../wizard-context'
import { RecipientAutocomplete } from '@/components/recipient-autocomplete'
import type { RecipientType } from '@/services/complaint-generator/types'

const RECIPIENT_TYPES: { value: RecipientType; label: string; desc: string; icon: React.ReactNode }[] = [
  {
    value: 'company', label: 'Company', desc: 'A business or service provider',
    icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>,
  },
  {
    value: 'mp', label: 'Your MP', desc: 'Your member of parliament',
    icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>,
  },
  {
    value: 'regulator', label: 'Regulator', desc: 'An ombudsman or regulator',
    icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" /></svg>,
  },
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
  const [companySector, setCompanySector] = useState<string | null>(null)
  const [regulatorSector, setRegulatorSector] = useState<string | null>(null)

  function selectType(type: RecipientType) {
    if (type === state.recipientType) return
    update({
      recipientType: type,
      recipientName: type === 'mp' && state.mpDetails ? state.mpDetails.name : '',
      recipientEmail: type === 'mp' && state.mpDetails?.email ? state.mpDetails.email : '',
      mpDetails: type === 'mp' ? state.mpDetails : null,
    })
    setMpError('')
    setCompanySector(null)
    setRegulatorSector(null)
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
    <div className="space-y-8">
      <div>
        <h2 className="font-serif text-2xl text-slate-900 dark:text-white mb-2">Who are you complaining to?</h2>
        <p className="text-slate-400 text-lg">Search for a company, council, or your local MP.</p>
      </div>

      {/* Recipient type selector — compact tabs */}
      <div role="radiogroup" aria-label="Recipient type" className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {RECIPIENT_TYPES.map((rt) => {
          const selected = state.recipientType === rt.value
          return (
            <button
              key={rt.value}
              role="radio"
              aria-checked={selected}
              onClick={() => selectType(rt.value)}
              className={`px-4 py-3.5 text-sm font-medium rounded-xl transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-500 ${
                selected
                  ? 'bg-slate-900 dark:bg-amber-500 text-white dark:text-slate-950 shadow-md'
                  : 'bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600'
              }`}
            >
              <div className="flex items-center gap-2 justify-center">
                {rt.icon}
                {rt.label}
              </div>
            </button>
          )
        })}
      </div>

      {/* Conditional fields */}
      {state.recipientType === 'company' && (
        <div className="space-y-5 motion-safe:animate-[fadeSlideIn_200ms_ease-out]">
          {/* Search — hidden when a company is confirmed */}
          {!companySector && (
            <RecipientAutocomplete
              id="company-name"
              type="company"
              value={state.recipientName}
              onChange={(name) => update({ recipientName: name })}
              onSelect={(result) => {
                update({
                  recipientName: result.name,
                  recipientEmail: result.complaint_email || state.recipientEmail,
                })
                setCompanySector(result.sector || '')
              }}
              placeholder="Start typing a company name..."
            />
          )}

          {/* Selected recipient card */}
          {companySector && state.recipientName && (
            <div className="bg-white dark:bg-slate-900/50 rounded-2xl border border-amber-200 dark:border-amber-800/50 p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <span className="text-base font-bold text-amber-600 dark:text-amber-400">
                      {state.recipientName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white">{state.recipientName}</p>
                    <p className="text-sm text-slate-400">
                      {state.recipientEmail && <>{state.recipientEmail} &middot; </>}{companySector}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setCompanySector(null)
                    update({ recipientName: '', recipientEmail: '' })
                  }}
                  className="text-sm text-slate-400 hover:text-red-500 transition-colors"
                >
                  Change
                </button>
              </div>
            </div>
          )}

          {/* Manual email — shown when no autocomplete match or user typed manually */}
          {!companySector && (
            <div>
              <label htmlFor="company-email" className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">
                Complaint email address{' '}
                <span className="font-normal text-slate-400">(optional — you can add this later)</span>
              </label>
              <input
                id="company-email"
                type="email"
                value={state.recipientEmail}
                onChange={(e) => update({ recipientEmail: e.target.value })}
                placeholder="e.g., complaints@britishgas.co.uk"
                className="w-full px-4 py-3.5 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-300 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 transition-all shadow-sm"
              />
            </div>
          )}
        </div>
      )}

      {state.recipientType === 'mp' && (
        <div className="space-y-5 motion-safe:animate-[fadeSlideIn_200ms_ease-out]">
          <div>
            <label htmlFor="postcode" className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">
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
                className="flex-1 px-4 py-3.5 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-300 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 transition-all shadow-sm"
              />
              <button
                onClick={lookupMP}
                disabled={mpLoading || !postcode.trim()}
                className="bg-slate-900 dark:bg-amber-500 text-white dark:text-slate-950 rounded-xl px-5 py-3.5 text-sm font-medium hover:bg-slate-800 dark:hover:bg-amber-400 disabled:opacity-50 whitespace-nowrap transition-all shadow-md"
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
            <div className="flex items-start gap-4 rounded-2xl border border-amber-200 dark:border-amber-800/50 bg-white dark:bg-slate-900/50 p-5 shadow-sm">
              {state.mpDetails.photoUrl && (
                <img
                  src={state.mpDetails.photoUrl}
                  alt={`Photo of ${state.mpDetails.name}`}
                  className="h-16 w-16 rounded-full object-cover border-2 border-white dark:border-slate-700 shadow-sm"
                />
              )}
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-slate-900 dark:text-white">{state.mpDetails.name}</p>
                <p className="text-sm text-slate-400">
                  {state.mpDetails.party} &mdash; {state.mpDetails.constituency}
                </p>
                {state.mpDetails.email && (
                  <p className="text-sm text-slate-400 mt-1 truncate">
                    {state.mpDetails.email}
                  </p>
                )}
              </div>
              <button
                onClick={() => {
                  update({ mpDetails: null, recipientName: '', recipientEmail: '' })
                  setPostcode('')
                }}
                className="text-sm text-slate-400 hover:text-red-500 transition-colors"
              >
                Change
              </button>
            </div>
          )}
        </div>
      )}

      {state.recipientType === 'regulator' && (
        <div className="space-y-5 motion-safe:animate-[fadeSlideIn_200ms_ease-out]">
          {!regulatorSector && (
            <RecipientAutocomplete
              id="regulator-name"
              type="regulator"
              value={state.recipientName}
              onChange={(name) => update({ recipientName: name })}
              onSelect={(result) => {
                update({
                  recipientName: result.name,
                  recipientEmail: result.complaint_email || state.recipientEmail,
                })
                setRegulatorSector(result.sector || '')
              }}
              placeholder="e.g., Ofcom, Financial Ombudsman Service"
            />
          )}

          {regulatorSector && state.recipientName && (
            <div className="bg-white dark:bg-slate-900/50 rounded-2xl border border-amber-200 dark:border-amber-800/50 p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <span className="text-base font-bold text-amber-600 dark:text-amber-400">
                      {state.recipientName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white">{state.recipientName}</p>
                    <p className="text-sm text-slate-400">
                      {state.recipientEmail && <>{state.recipientEmail} &middot; </>}{regulatorSector}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setRegulatorSector(null)
                    update({ recipientName: '', recipientEmail: '' })
                  }}
                  className="text-sm text-slate-400 hover:text-red-500 transition-colors"
                >
                  Change
                </button>
              </div>
            </div>
          )}

          {!regulatorSector && (
            <div>
              <label htmlFor="regulator-email" className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">
                Complaint email address{' '}
                <span className="font-normal text-slate-400">(optional — you can add this later)</span>
              </label>
              <input
                id="regulator-email"
                type="email"
                value={state.recipientEmail}
                onChange={(e) => update({ recipientEmail: e.target.value })}
                placeholder="e.g., complaints@ofcom.org.uk"
                className="w-full px-4 py-3.5 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-300 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 transition-all shadow-sm"
              />
            </div>
          )}
        </div>
      )}
    </div>
  )
}
