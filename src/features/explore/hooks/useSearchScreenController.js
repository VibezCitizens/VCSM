import { useEffect, useMemo, useState } from 'react'

import { ctrlSearchResults } from '@/features/explore/controller/searchResults.controller'

const FILTERS = ['all', 'users', 'vports', 'Voxs', 'videos', 'groups']
const LS_KEY = 'search:lastFilter'
const SEARCH_CACHE_TTL_MS = 45_000
const SEARCH_CACHE_MAX_ENTRIES = 120

const searchResultCache = new Map()
const searchInflight = new Map()

function getSearchCacheKey(query, filter) {
  return `${filter}:${String(query || '').trim().toLowerCase()}`
}

function readSearchCache(key) {
  const hit = searchResultCache.get(key)
  if (!hit) return null

  if (Date.now() > hit.expiresAt) {
    searchResultCache.delete(key)
    return null
  }

  return hit.results
}

function writeSearchCache(key, results) {
  searchResultCache.set(key, {
    results,
    expiresAt: Date.now() + SEARCH_CACHE_TTL_MS,
  })

  if (searchResultCache.size <= SEARCH_CACHE_MAX_ENTRIES) return
  const oldestKey = searchResultCache.keys().next().value
  if (oldestKey) searchResultCache.delete(oldestKey)
}

async function loadSearchCached(key, loader) {
  const cached = readSearchCache(key)
  if (cached) return cached

  const inflight = searchInflight.get(key)
  if (inflight) return inflight

  const promise = loader()
    .then((results) => {
      writeSearchCache(key, results)
      return results
    })
    .finally(() => {
      searchInflight.delete(key)
    })

  searchInflight.set(key, promise)
  return promise
}

export function useSearchScreenController() {
  const [query, setQuery] = useState('')
  const [debounced, setDebounced] = useState('')
  const [filter, setFilter] = useState(() => {
    const saved = localStorage.getItem(LS_KEY)
    return FILTERS.includes(saved) ? saved : 'all'
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [results, setResults] = useState([])

  useEffect(() => {
    const id = setTimeout(() => {
      setDebounced(query.trim())
    }, 300)
    return () => clearTimeout(id)
  }, [query])

  useEffect(() => {
    localStorage.setItem(LS_KEY, filter)
  }, [filter])

  useEffect(() => {
    let cancelled = false

    async function run() {
      if (!debounced) {
        setResults([])
        setError(null)
        return
      }

      const cacheKey = getSearchCacheKey(debounced, filter)
      const cached = readSearchCache(cacheKey)

      if (cached) {
        setError(null)
        setLoading(false)
        setResults(cached)
        return
      }

      setLoading(true)
      setError(null)

      try {
        const merged = await loadSearchCached(cacheKey, () =>
          ctrlSearchResults({ query: debounced, filter })
        )

        if (cancelled) return
        setResults(merged)
      } catch (nextError) {
        if (cancelled) return
        setError(nextError)
        setResults([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    run()
    return () => {
      cancelled = true
    }
  }, [debounced, filter])

  const canClear = useMemo(() => query.length > 0, [query])

  return {
    query,
    debounced,
    filter,
    loading,
    error,
    results,
    canClear,
    setQuery,
    setFilter,
  }
}
