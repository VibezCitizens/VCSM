// ============================================================
// VCSM — Vport Portfolio Hook
// ============================================================

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ctrlListPortfolio,
  ctrlGetPortfolioItem,
  invalidatePortfolioCache,
} from '@/features/profiles/kinds/vport/controller/portfolio/VportPortfolio.controller'

const PAGE_SIZE = 24

export function useVportPortfolio(actorId) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [error, setError] = useState(null)
  const [selectedItem, setSelectedItem] = useState(null)
  const [selectedItemDetail, setSelectedItemDetail] = useState(null)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [filterTag, setFilterTag] = useState(null)

  const offsetRef = useRef(0)
  const mountedRef = useRef(false)
  const inFlightRef = useRef(false)
  const itemsRef = useRef([])

  useEffect(() => {
    mountedRef.current = true
    return () => { mountedRef.current = false }
  }, [])

  useEffect(() => { itemsRef.current = items }, [items])

  const loadPortfolio = useCallback(async () => {
    if (!actorId) return
    if (inFlightRef.current) return
    inFlightRef.current = true

    setLoading(true)
    setError(null)
    offsetRef.current = 0

    try {
      const result = await ctrlListPortfolio(actorId, { limit: PAGE_SIZE, offset: 0 })
      if (!mountedRef.current) return

      setItems(result.items ?? [])
      setHasMore(result.hasMore ?? false)
      offsetRef.current = (result.items ?? []).length
    } catch (e) {
      if (mountedRef.current) setError(e)
    } finally {
      if (mountedRef.current) setLoading(false)
      inFlightRef.current = false
    }
  }, [actorId])

  const loadMore = useCallback(async () => {
    if (!actorId || !hasMore || loadingMore) return
    setLoadingMore(true)

    try {
      const result = await ctrlListPortfolio(actorId, { limit: PAGE_SIZE, offset: offsetRef.current })
      if (!mountedRef.current) return

      setItems((prev) => [...prev, ...(result.items ?? [])])
      setHasMore(result.hasMore ?? false)
      offsetRef.current += (result.items ?? []).length
    } catch (_) {
      // silently fail load-more
    } finally {
      if (mountedRef.current) setLoadingMore(false)
    }
  }, [actorId, hasMore, loadingMore])

  const openItem = useCallback(async (item) => {
    if (!item?.id) return
    setSelectedItem(item)
    setLoadingDetail(true)

    try {
      const detail = await ctrlGetPortfolioItem(item.id, { includeBarberDetails: true })
      if (mountedRef.current) setSelectedItemDetail(detail)
    } catch (_) {
      // keep summary view if detail fails
    } finally {
      if (mountedRef.current) setLoadingDetail(false)
    }
  }, [])

  const closeItem = useCallback(() => {
    setSelectedItem(null)
    setSelectedItemDetail(null)
  }, [])

  const optimisticRemove = useCallback((itemId) => {
    const snapshot = itemsRef.current
    setItems((current) => current.filter((i) => i.id !== itemId))
    invalidatePortfolioCache(actorId)
    return () => setItems(snapshot)
  }, [actorId])

  const optimisticAdd = useCallback((item) => {
    if (!item?.id) return
    setItems((prev) => [item, ...prev])
    invalidatePortfolioCache(actorId)
  }, [actorId])

  const optimisticUpdate = useCallback((itemId, updates) => {
    const snapshot = itemsRef.current
    setItems((current) =>
      current.map((i) => (i.id === itemId ? { ...i, ...updates } : i))
    )
    invalidatePortfolioCache(actorId)
    return () => setItems(snapshot)
  }, [actorId])

  useEffect(() => {
    loadPortfolio()
  }, [loadPortfolio])

  const allTags = useMemo(() => {
    const set = new Set()
    for (const item of items) {
      for (const tag of item.tags ?? []) {
        set.add(tag)
      }
    }
    return Array.from(set).sort()
  }, [items])

  const filteredItems = useMemo(() => {
    if (!filterTag) return items
    return items.filter((item) =>
      (item.tags ?? []).includes(filterTag)
    )
  }, [items, filterTag])

  return {
    items: filteredItems,
    allItems: items,
    loading,
    loadingMore,
    hasMore,
    error,
    loadMore,
    reload: loadPortfolio,

    allTags,
    filterTag,
    setFilterTag,

    selectedItem,
    selectedItemDetail,
    loadingDetail,
    openItem,
    closeItem,
    optimisticRemove,
    optimisticAdd,
    optimisticUpdate,
  }
}
