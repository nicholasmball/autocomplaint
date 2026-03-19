'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

interface RecipientResult {
  id: string
  name: string
  sector?: string
  complaint_email: string
  abbreviation?: string
}

interface RecipientAutocompleteProps {
  type: 'company' | 'regulator'
  value: string
  onChange: (name: string) => void
  onSelect: (result: RecipientResult) => void
  placeholder?: string
  id?: string
}

export function RecipientAutocomplete({
  type,
  value,
  onChange,
  onSelect,
  placeholder,
  id,
}: RecipientAutocompleteProps) {
  const [results, setResults] = useState<RecipientResult[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLUListElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const search = useCallback(async (query: string) => {
    if (query.length < 2) {
      setResults([])
      setIsOpen(false)
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`/api/recipients/search?q=${encodeURIComponent(query)}&type=${type}`)
      if (!res.ok) throw new Error()
      const data = await res.json()
      setResults(data.results || [])
      setIsOpen(true)
      setActiveIndex(-1)
    } catch {
      setResults([])
      setIsOpen(false)
    } finally {
      setLoading(false)
    }
  }, [type])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => search(value), 300)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [value, search])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function handleSelect(result: RecipientResult) {
    onSelect(result)
    setIsOpen(false)
    setActiveIndex(-1)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!isOpen) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (results.length > 0) {
        setActiveIndex(prev => (prev < results.length - 1 ? prev + 1 : 0))
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (results.length > 0) {
        setActiveIndex(prev => (prev > 0 ? prev - 1 : results.length - 1))
      }
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault()
      handleSelect(results[activeIndex])
    } else if (e.key === 'Escape') {
      setIsOpen(false)
      setActiveIndex(-1)
    }
  }

  useEffect(() => {
    if (activeIndex >= 0 && listRef.current) {
      const item = listRef.current.children[activeIndex] as HTMLElement
      item?.scrollIntoView({ block: 'nearest' })
    }
  }, [activeIndex])

  function subtitle(r: RecipientResult): string {
    if (type === 'regulator' && r.abbreviation) return `${r.abbreviation} — ${r.sector}`
    return r.sector || ''
  }

  const listboxId = `${id || type}-listbox`

  return (
    <div ref={wrapperRef} className="relative">
      <div className="relative">
        <svg className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        <input
          id={id}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => { if (results.length > 0) setIsOpen(true) }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          role="combobox"
          aria-expanded={isOpen}
          aria-controls={listboxId}
          aria-activedescendant={activeIndex >= 0 ? `${listboxId}-${activeIndex}` : undefined}
          aria-autocomplete="list"
          autoComplete="off"
          className="w-full pl-12 pr-4 py-4 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-white text-lg placeholder-slate-300 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 transition-all shadow-sm"
        />
        {loading && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            <svg className="animate-spin h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
        )}
      </div>

      {isOpen && results.length > 0 && (
        <ul
          ref={listRef}
          id={listboxId}
          role="listbox"
          className="absolute z-50 mt-2 w-full max-h-72 overflow-auto rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/60 shadow-lg divide-y divide-slate-100 dark:divide-slate-800"
        >
          {results.map((r, i) => (
            <li
              key={r.id}
              id={`${listboxId}-${i}`}
              role="option"
              aria-selected={i === activeIndex}
              onMouseDown={() => handleSelect(r)}
              onMouseEnter={() => setActiveIndex(i)}
              className={`cursor-pointer px-5 py-4 flex items-center gap-4 transition-colors group ${
                i === activeIndex
                  ? 'bg-amber-500/5 dark:bg-amber-500/10'
                  : 'hover:bg-amber-500/5 dark:hover:bg-amber-500/10'
              }`}
            >
              <div className="w-10 h-10 bg-slate-900/5 dark:bg-white/10 rounded-xl flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold text-slate-600 dark:text-slate-300">
                  {r.abbreviation || r.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">{r.name}</div>
                <div className="text-sm text-slate-400">
                  {subtitle(r)}
                  {r.complaint_email && <> &middot; {r.complaint_email}</>}
                </div>
              </div>
              <svg className="w-5 h-5 text-slate-300 dark:text-slate-600 group-hover:text-amber-500 transition-colors flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </li>
          ))}
        </ul>
      )}

      {isOpen && results.length === 0 && value.length >= 2 && !loading && (
        <div className="absolute z-50 mt-2 w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/60 shadow-lg px-5 py-4 text-sm text-slate-400">
          No matches found — enter details manually
        </div>
      )}
    </div>
  )
}
