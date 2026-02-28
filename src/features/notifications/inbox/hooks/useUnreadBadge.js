import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { getInboxUnreadBadgeCount } from '../controller/inboxUnread.controller'
import { supabase } from '@/services/supabase/supabaseClient'

const UNREAD_CACHE_TTL_MS = 10_000
const unreadCache = new Map()
const unreadInflight = new Map()

function readCachedUnread(actorId) {
  const hit = unreadCache.get(actorId)
  if (!hit) return null
  if (Date.now() > hit.expiresAt) {
    unreadCache.delete(actorId)
    return null
  }
  return hit.count
}

function writeCachedUnread(actorId, count) {
  unreadCache.set(actorId, {
    count,
    expiresAt: Date.now() + UNREAD_CACHE_TTL_MS,
  })
}

function invalidateUnread(actorId) {
  unreadCache.delete(actorId)
}

async function loadUnread(actorId, { force = false } = {}) {
  if (force) invalidateUnread(actorId)

  const cached = force ? null : readCachedUnread(actorId)
  if (cached != null) return cached

  const inflight = force ? null : unreadInflight.get(actorId)
  if (inflight) return inflight

  const pending = getInboxUnreadBadgeCount(actorId)
    .then((count) => {
      writeCachedUnread(actorId, count)
      return count
    })
    .finally(() => {
      unreadInflight.delete(actorId)
    })

  unreadInflight.set(actorId, pending)
  return pending
}

export default function useUnreadBadge({ actorId, refreshMs = 20000 } = {}) {
  const [count, setCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const aliveRef = useRef(true)
  const realtimeRef = useRef(null)

  const canQuery = useMemo(
    () => typeof actorId === 'string' && actorId.length >= 32,
    [actorId]
  )

  const load = useCallback(async (force = false) => {
    if (!canQuery) {
      setCount(0)
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      const total = await loadUnread(actorId, { force })
      if (aliveRef.current) setCount(total)
    } finally {
      if (aliveRef.current) setLoading(false)
    }
  }, [actorId, canQuery])

  useEffect(() => {
    aliveRef.current = true
    load(true)

    const onRefresh = () => load(true)
    window.addEventListener('noti:refresh', onRefresh)

    if (realtimeRef.current) {
      supabase.removeChannel(realtimeRef.current)
      realtimeRef.current = null
    }

    if (canQuery) {
      const channel = supabase.channel(`chat-badge-${actorId}`)
      const onRealtime = () => load(true)

      channel.on(
        'postgres_changes',
        { event: 'INSERT', schema: 'vc', table: 'inbox_entries', filter: `actor_id=eq.${actorId}` },
        onRealtime
      )
      channel.on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'vc', table: 'inbox_entries', filter: `actor_id=eq.${actorId}` },
        onRealtime
      )
      channel.on(
        'postgres_changes',
        { event: 'DELETE', schema: 'vc', table: 'inbox_entries', filter: `actor_id=eq.${actorId}` },
        onRealtime
      )

      channel.subscribe()
      realtimeRef.current = channel
    }

    let timer = null
    if (refreshMs > 0) {
      timer = setInterval(load, refreshMs)
    }

    return () => {
      aliveRef.current = false
      window.removeEventListener('noti:refresh', onRefresh)
      if (timer) clearInterval(timer)
      if (realtimeRef.current) {
        supabase.removeChannel(realtimeRef.current)
        realtimeRef.current = null
      }
    }
  }, [actorId, canQuery, load, refreshMs])

  return { count, loading }
}
