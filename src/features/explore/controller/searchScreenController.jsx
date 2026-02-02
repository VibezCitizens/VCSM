// src/features/explore/controller/searchScreenController.jsx

import { useState, useEffect, useMemo } from 'react'
import { searchDal } from '@/features/explore/dal/search.dal'

const FILTERS = ['all', 'users', 'vports', 'Voxs', 'videos', 'groups']
const LS_KEY = 'search:lastFilter'

// ============================================================
// Search Screen Controller (ACTOR-FIRST)
// ------------------------------------------------------------
// Responsibilities:
// - Owns search lifecycle timing
// - Delegates data fetching to DAL
// - Normalizes + dedupes results
// - NEVER interprets domain meaning
// ============================================================

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

  // ------------------------------------------------------------
  // Debounce query
  // ------------------------------------------------------------
  useEffect(() => {
    const id = setTimeout(() => {
      setDebounced(query.trim())
    }, 300)

    return () => clearTimeout(id)
  }, [query])

  // ------------------------------------------------------------
  // Persist last filter
  // ------------------------------------------------------------
  useEffect(() => {
    localStorage.setItem(LS_KEY, filter)
  }, [filter])

  // ------------------------------------------------------------
  // Execute search
  // ------------------------------------------------------------
  useEffect(() => {
    let cancelled = false

    async function run() {
      if (!debounced) {
        setResults([])
        return
      }

      setLoading(true)
      setError(null)

      try {
        const calls = searchDal(debounced, filter, {})
        const responses = await Promise.all(calls)

        if (cancelled) return

        const flat = responses.flat()
        const normalized = flat
          .map(normalizeResult)
          .filter(Boolean)

        setResults(dedupeByKindAndId(normalized))
      } catch (e) {
        if (!cancelled) {
          setError(e)
          setResults([])
        }
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

// ============================================================
// Normalization (ACTOR-FIRST)
// ------------------------------------------------------------
// Rules:
// - actor_id is the ONLY navigable identity
// - user_id is legacy / auxiliary
// - non-actor results keep id semantics
// ============================================================

export function normalizeResult(item) {
  if (!item) return null

  const t = item.result_type || item.type || item.kind

  switch (t) {
    case 'actor':
      // 🔒 Actor is primary identity
      if (!item.actor_id) return null

      return {
        result_type: 'actor',
        actor_id: item.actor_id,
        user_id: item.user_id ?? null,
        display_name: item.display_name ?? '',
        username: item.username ?? '',
        photo_url: item.photo_url ?? '/avatar.jpg',
        private: !!item.private,
      }

    case 'vport':
      return {
        result_type: 'vport',
        id: item.id ?? null,
        name: item.name ?? '',
        description: item.description ?? '',
        avatar_url: item.avatar_url ?? '/avatar.jpg',
        is_active: !!item.is_active,
      }

    case 'post':
      return {
        result_type: 'post',
        id: item.id ?? item.post_id ?? null,
        title: item.title ?? '',
        text: item.text ?? '',
      }

    case 'video':
      return {
        result_type: 'video',
        id: item.id ?? item.video_id ?? null,
        title: item.title ?? '',
      }

    case 'group':
      return {
        result_type: 'group',
        id: item.id ?? item.group_id ?? null,
        name: item.name ?? item.group_name ?? '',
        description: item.description ?? '',
      }

    default:
      return null
  }
}

// ============================================================
// Deduplication (ACTOR-SAFE)
// ------------------------------------------------------------
// - Actors dedupe by actor_id
// - Others dedupe by id
// ============================================================

export function dedupeByKindAndId(arr) {
  const map = new Map()

  for (const it of arr) {
    if (!it) continue

    let keyId
    if (it.result_type === 'actor') {
      keyId = it.actor_id
    } else {
      keyId = it.id
    }

    const k = `${it.result_type}:${keyId ?? 'null'}`
    if (!map.has(k)) map.set(k, it)
  }

  return Array.from(map.values())
}
