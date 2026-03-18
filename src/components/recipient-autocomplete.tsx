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
          className="w-full border rounded-md px-3 py-2 text-sm dark:bg-gray-800 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
        />
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <svg className="animate-spin h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24">
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
          className="absolute z-50 mt-1 w-full max-h-60 overflow-auto rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg"
        >
          {results.map((r, i) => (
            <li
              key={r.id}
              id={`${listboxId}-${i}`}
              role="option"
              aria-selected={i === activeIndex}
              onMouseDown={() => handleSelect(r)}
              onMouseEnter={() => setActiveIndex(i)}
              className={`cursor-pointer px-3 py-2 text-sm ${
                i === activeIndex
                  ? 'bg-blue-50 dark:bg-blue-950/30 text-blue-900 dark:text-blue-100'
                  : 'text-gray-900 dark:text-gray-100'
              }`}
            >
              <div className="font-medium">{r.name}</div>
              {subtitle(r) && (
                <div className="text-xs text-gray-500 dark:text-gray-400">{subtitle(r)}</div>
              )}
              {r.complaint_email && (
                <div className="text-xs text-gray-400 dark:text-gray-500">{r.complaint_email}</div>
              )}
            </li>
          ))}
        </ul>
      )}

      {isOpen && results.length === 0 && value.length >= 2 && !loading && (
        <div className="absolute z-50 mt-1 w-full rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
          No matches found — enter details manually
        </div>
      )}
    </div>
  )
}
