// src/features/explore/hooks/useSearchTabsActor.js

import { useEffect, useRef, useState } from 'react'
import { ctrlSearchTabs } from '@/features/explore/controller/searchTabs.controller'

// ============================================================
// useSearchTabsActor
// ------------------------------------------------------------
// Responsibilities:
// - Execute search when query / filter changes
// - Handle cancellation & race safety
// - Return actor-first results for Explore tabs
// ============================================================

export function useSearchTabsActor({
  query,
  filter = 'all',
  limit = 25,
  offset = 0,
  viewerActorId = null,
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
        const flat = await ctrlSearchTabs({
          query,
          filter,
          limit,
          offset,
          viewerActorId,
        })

        if (cancelled || reqId !== requestIdRef.current) return

        // Drop non-navigable actor results (no actor_id)
        const cleaned = flat.filter(item => {
          if (!item) return false
          if (item.result_type === 'actor') return !!item.actor_id
          return true
        })

        // Feature injection — "Wanders" card when query matches
        const needle = query.trim().toLowerCase()
        const wantsWanders =
          filter === 'all' &&
          (needle.includes('wander') ||
            needle.includes('wanders') ||
            needle.startsWith('@wander'))

        const features = wantsWanders
          ? [{
              result_type: 'feature',
              id: 'wanders',
              title: 'Wanders',
              subtitle: 'Explore nearby Wanders',
              icon: 'at-bubble',
              route: '/wanders',
            }]
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

    return () => { cancelled = true }
  }, [query, filter, limit, offset, viewerActorId])

  return { items, loading, error }
}
