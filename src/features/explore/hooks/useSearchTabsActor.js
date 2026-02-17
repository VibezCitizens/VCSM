// src/features/explore/hooks/useSearchTabsActor.js

import { useEffect, useRef, useState } from 'react'
import { searchDal } from '@/features/explore/dal/search.dal'

// ============================================================
// useSearchTabsActor
// ------------------------------------------------------------
// Responsibilities:
// - Execute search when query / filter changes
// - Handle cancellation & race safety
// - Return actor-first results for Explore tabs
//
// Rules:
// - NEVER interpret identity
// - NEVER fallback to user_id
// - actor_id is the ONLY navigable identity
// ============================================================

export function useSearchTabsActor({
  query,
  filter = 'all',
  limit = 25,
  offset = 0,
}) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const requestIdRef = useRef(0)

  useEffect(() => {
    if (!query || !query.trim()) {
      setItems([])
      setLoading(false)
      setError(null)
      return
    }

    const reqId = ++requestIdRef.current
    let cancelled = false

    async function run() {
      setLoading(true)
      setError(null)

      try {
        const calls = searchDal(query, filter, {
          limit,
          offset,
        })

        const responses = await Promise.all(calls)

        if (cancelled || reqId !== requestIdRef.current) return

        const flat = responses.flat()

        // IMPORTANT:
        // search.data already returns actor-first objects.
        // We only drop invalid (non-navigable) actor results here.
        const cleaned = flat.filter(item => {
          if (!item) return false

          if (item.result_type === 'actor') {
            return !!item.actor_id
          }

          return true
        })

        // ------------------------------------------------------------
        // Local feature injection (UI navigation cards)
        // - Shows ONLY in "all"
        // - Adds "Wanders" card when query matches wander(s)
        // ------------------------------------------------------------
        const needle = query.trim().toLowerCase()
        const wantsWanders =
          filter === 'all' &&
          (needle.includes('wander') ||
            needle.includes('wanders') ||
            needle.startsWith('@wander'))

        const features = wantsWanders
          ? [
              {
                result_type: 'feature',
                id: 'wanders',
                title: 'Wanders',
                subtitle: 'Explore nearby Wanders',
                icon: 'at-bubble', // UI-only hint (used by FeatureSearchResultRow)
                route: '/wanders',
              },
            ]
          : []

        setItems([...features, ...cleaned])
      } catch (e) {
        if (!cancelled) {
          setError(e)
          setItems([])
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    run()

    return () => {
      cancelled = true
    }
  }, [query, filter, limit, offset])

  return {
    items,
    loading,
    error,
  }
}
