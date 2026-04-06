import { useCallback, useMemo, useState } from 'react'
import { ctrlSearchActors } from '@/features/settings/privacy/controller/Blocks.controller'

export function useActorLookup() {
  const [query, setQuery] = useState('')
  const [searching, setSearching] = useState(false)
  const [results, setResults] = useState([])
  const [searchErr, setSearchErr] = useState(null)

  const runSearch = useCallback(async (rawQuery) => {
    const normalized = String(rawQuery || '').trim()
    if (!normalized) {
      setResults([])
      setSearchErr(null)
      return
    }

    setSearching(true)
    setSearchErr(null)
    try {
      const rows = await ctrlSearchActors({ query: normalized })
      setResults(rows)
    } catch (error) {
      setSearchErr(error?.message || String(error))
    } finally {
      setSearching(false)
    }
  }, [])

  const hint = useMemo(() => {
    if (searching) return 'Searching...'
    return 'Search by username or display name'
  }, [searching])

  return {
    query,
    setQuery,
    searching,
    results,
    searchErr,
    hint,
    runSearch,
  }
}
