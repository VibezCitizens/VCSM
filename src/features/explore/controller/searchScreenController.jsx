// src/features/explore/controller/searchScreenController.jsx

import { useState, useEffect, useMemo } from 'react'
import { searchDal } from '@/features/explore/dal/search.dal'

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
  // Local feature injection (UI navigation cards)
  // ------------------------------------------------------------
  function buildFeatureResults(q, activeFilter) {
    const needle = (q || '').trim().toLowerCase()
    if (!needle) return []

    // Only show features in "all" (so it appears under Citizens + Vports)
    if (activeFilter !== 'all') return []

    const wantsWanders =
      needle.includes('wander') ||
      needle.includes('wanders') ||
      needle.startsWith('@wander') ||
      needle === 'w'

    if (!wantsWanders) return []

    return [
      {
        result_type: 'feature',
        id: 'wanders',
        title: 'Wanders',
        subtitle: 'Explore nearby Wanders',
        icon: 'at-bubble', // UI-only hint
        route: '/wanders',
      },
    ]
  }

  // ------------------------------------------------------------
  // Execute search
  // ------------------------------------------------------------
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
        const merged = await loadSearchCached(cacheKey, async () => {
          const calls = searchDal(debounced, filter, {})
          const responses = await Promise.all(calls)

          const flat = responses.flat()
          const normalized = flat
            .map(normalizeResult)
            .filter(Boolean)

          const features = buildFeatureResults(debounced, filter)
            .map(normalizeResult)
            .filter(Boolean)

          // features first
          return dedupeByKindAndId([...features, ...normalized])
        })

        if (cancelled) return
        setResults(merged)
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
//
// Label mapping (UI semantics):
// User -> Citizen
// Vport -> Vport
// Post -> Vibe
// Comment -> Spark
// Message/Conversation -> Vox
// ============================================================

export function normalizeResult(item) {
  if (!item) return null

  const t = item.result_type || item.type || item.kind

  switch (t) {
    case 'actor':
      // 🔒 Actor is primary identity
      if (!item.actor_id) return null

      return {
        result_type: 'actor', // Citizen
        actor_id: item.actor_id,
        display_name: item.display_name ?? '',
        username: item.username ?? '',
        photo_url: item.photo_url ?? '/avatar.jpg',
        private: !!item.private,
      }

    case 'feature':
      if (!item.id) return null
      return {
        result_type: 'feature',
        id: item.id,
        title: item.title ?? '',
        subtitle: item.subtitle ?? '',
        icon: item.icon ?? null,
        route: item.route ?? null,
      }

    case 'vport':
      return {
        result_type: 'vport', // Vport
        id: item.id ?? null,
        name: item.name ?? '',
        description: item.description ?? '',
        avatar_url: item.avatar_url ?? '/avatar.jpg',
        is_active: !!item.is_active,
      }

    case 'post':
      return {
        result_type: 'post', // Vibe
        id: item.id ?? item.post_id ?? null,
        title: item.title ?? '',
        text: item.text ?? '',
      }

    case 'comment':
      return {
        result_type: 'comment', // Spark
        id: item.id ?? item.comment_id ?? null,
        text: item.text ?? item.body ?? '',
        post_id: item.post_id ?? null,
      }

    case 'message':
    case 'conversation':
      return {
        result_type: t, // Vox
        id: item.id ?? item.conversation_id ?? item.message_id ?? null,
        title: item.title ?? '',
        text: item.text ?? item.body ?? '',
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
// - Actors (Citizens) dedupe by actor_id
// - Features dedupe by id
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
