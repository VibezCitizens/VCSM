// TICKET-TRAZE-CLAIM-LANDING-001 — claim landing search hook.
//
// Debounced display-name search over claimable Traze providers. Display only —
// the submit RPC remains the authority on claimability. Used exclusively by the
// no-provider "find your business" landing.

import { useCallback, useEffect, useRef, useState } from 'react'

import { searchProvidersController } from '@/features/claim/controllers/searchProviders.controller'

const MIN_QUERY = 2
const MAX_QUERY = 80
const DEBOUNCE_MS = 280

export function useClaimBusinessSearch() {
  const [query, setQueryState] = useState('')
  const [results, setResults] = useState([])
  // "idle" | "searching" | "loaded" | "error"
  const [status, setStatus] = useState('idle')

  const requestIdRef = useRef(0)
  const timerRef = useRef(null)

  const runSearch = useCallback(async (term) => {
    const trimmed = term.trim()
    if (trimmed.length < MIN_QUERY) {
      requestIdRef.current += 1 // invalidate any in-flight request
      setResults([])
      setStatus('idle')
      return
    }

    const requestId = ++requestIdRef.current
    setStatus('searching')

    try {
      const rows = await searchProvidersController({ query: trimmed })
      if (requestId !== requestIdRef.current) return // stale response
      setResults(rows)
      setStatus('loaded')
    } catch {
      if (requestId !== requestIdRef.current) return
      setResults([])
      setStatus('error')
    }
  }, [])

  const setQuery = useCallback((value) => {
    const next = String(value ?? '').slice(0, MAX_QUERY)
    setQueryState(next)
  }, [])

  // Debounce: re-run the search whenever the query settles.
  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => runSearch(query), DEBOUNCE_MS)
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [query, runSearch])

  const showEmpty =
    status === 'loaded' && results.length === 0 && query.trim().length >= MIN_QUERY

  return { query, setQuery, results, status, showEmpty, minQuery: MIN_QUERY }
}
