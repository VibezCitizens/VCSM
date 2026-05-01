import { useCallback, useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/queries/queryKeys'
import { useIdentity } from '@/features/identity/adapters/identity.adapter'
import { ctrlSearchActors } from '@/features/settings/privacy/controller/Blocks.controller'

const DEBOUNCE_MS = 300
const MIN_CHARS = 2

export function useActorLookup() {
  const { identity } = useIdentity()
  const actorId = identity?.actorId ?? null

  const [rawQuery, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')

  // Debounce raw input → debouncedQuery
  useEffect(() => {
    const id = setTimeout(() => setDebouncedQuery(rawQuery.trim()), DEBOUNCE_MS)
    return () => clearTimeout(id)
  }, [rawQuery])

  const normalized = debouncedQuery
  const enabled = normalized.length >= MIN_CHARS

  const { data: results = [], isFetching: searching, error } = useQuery({
    queryKey: queryKeys.settingsCitizenSearch(actorId, normalized),
    queryFn: () => ctrlSearchActors({ query: normalized }),
    enabled: !!actorId && enabled,
    staleTime: 60 * 1000,
    placeholderData: (prev) => prev ?? [],
  })

  // Manual trigger: immediately flush debounce for button/Enter press
  const runSearch = useCallback((q) => {
    const trimmed = String(q || '').trim()
    setQuery(trimmed)
    setDebouncedQuery(trimmed)
  }, [])

  const hint = useMemo(() => {
    if (searching) return 'Searching...'
    if (rawQuery.length > 0 && rawQuery.length < MIN_CHARS) return 'Keep typing (2+ characters)...'
    return 'Search by username or display name'
  }, [searching, rawQuery.length])

  return {
    query: rawQuery,
    setQuery,
    searching,
    results,
    searchErr: error?.message ?? null,
    hint,
    runSearch,
  }
}
