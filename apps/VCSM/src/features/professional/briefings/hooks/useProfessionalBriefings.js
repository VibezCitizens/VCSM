import { useCallback, useEffect, useMemo, useState } from 'react'

import {
  ctrlListProfessionalBriefings,
  ctrlMarkProfessionalBriefingsSeen,
} from '@/features/professional/briefings/controller/listProfessionalBriefings.controller'

const DEFAULT_FILTERS = Object.freeze({
  domain: 'all',
  query: '',
  unreadOnly: false,
})

export default function useProfessionalBriefings({ actorId }) {
  const [items, setItems] = useState([])
  const [summary, setSummary] = useState(null)
  const [filters, setFilters] = useState(DEFAULT_FILTERS)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    if (!actorId) return

    setLoading(true)
    setError('')
    try {
      const result = await ctrlListProfessionalBriefings({
        actorId,
        domain: filters.domain,
        query: filters.query,
        unreadOnly: filters.unreadOnly,
      })
      setItems(result.items)
      setSummary(result.summary)
    } catch (e) {
      setError(e?.message || 'Failed to load briefings')
      setItems([])
      setSummary(null)
    } finally {
      setLoading(false)
    }
  }, [actorId, filters.domain, filters.query, filters.unreadOnly])

  useEffect(() => {
    load()
  }, [load])

  const markVisibleSeen = useCallback(async () => {
    if (!actorId) return
    const unseen = items.filter((item) => !item.isSeen).map((item) => item.id)
    if (unseen.length === 0) return
    await ctrlMarkProfessionalBriefingsSeen({
      actorId,
      notificationIds: unseen,
    })
    load()
  }, [actorId, items, load])

  const domainOptions = useMemo(
    () => [
      { key: 'all', label: 'All' },
      { key: 'operations', label: 'Operations' },
      { key: 'compliance', label: 'Compliance' },
      { key: 'marketplace', label: 'Marketplace' },
      { key: 'intelligence', label: 'Intelligence' },
    ],
    []
  )

  return {
    items,
    summary,
    loading,
    error,
    filters,
    setFilters,
    domainOptions,
    reload: load,
    markVisibleSeen,
  }
}
