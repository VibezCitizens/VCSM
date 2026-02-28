import { useCallback, useEffect, useRef, useState } from 'react'
import { getUnreadNotificationCount } from '../controller/notificationsCount.controller'
import { supabase } from '@/services/supabase/supabaseClient'

const UUID_RX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

const NOTI_CACHE_TTL_MS = 15_000
const notiCountCache = new Map()
const notiCountInflight = new Map()

function getCachedNotiCount(actorId) {
  const hit = notiCountCache.get(actorId)
  if (!hit) return null
  if (Date.now() > hit.expiresAt) {
    notiCountCache.delete(actorId)
    return null
  }
  return hit.count
}

function setCachedNotiCount(actorId, count) {
  notiCountCache.set(actorId, {
    count,
    expiresAt: Date.now() + NOTI_CACHE_TTL_MS,
  })
}

function invalidateNotiCount(actorId) {
  notiCountCache.delete(actorId)
}

async function loadNotiCount(actorId, { force = false } = {}) {
  if (force) invalidateNotiCount(actorId)

  const cached = force ? null : getCachedNotiCount(actorId)
  if (cached != null) return cached

  const inflight = force ? null : notiCountInflight.get(actorId)
  if (inflight) return inflight

  const pending = getUnreadNotificationCount(actorId)
    .then((count) => {
      setCachedNotiCount(actorId, count)
      return count
    })
    .finally(() => {
      notiCountInflight.delete(actorId)
    })

  notiCountInflight.set(actorId, pending)
  return pending
}

/**
 * useNotiCount
 *
 * Actor-based unread notification counter
 * (hook = timing only)
 */
export default function useNotiCount({
  actorId,
  pollMs = 60_000,
} = {}) {
  const [count, setCount] = useState(0)

  const pollRef = useRef(null)
  const realtimeRef = useRef(null)
  const lastActorRef = useRef(null)

  const validActor =
    typeof actorId === 'string' && UUID_RX.test(actorId)

  const fetchCount = useCallback(async (force = false) => {
    if (!validActor) {
      setCount(0)
      return
    }

    try {
      const c = await loadNotiCount(actorId, { force })
      setCount(c)
    } catch {
      setCount(0)
    }
  }, [actorId, validActor])

  useEffect(() => {
    if (!validActor) {
      if (pollRef.current) clearInterval(pollRef.current)
      setCount(0)
      return
    }

    const changed = lastActorRef.current !== actorId
    lastActorRef.current = actorId

    if (changed) fetchCount(true)

    const onRefresh = () => fetchCount(true)
    window.addEventListener('noti:refresh', onRefresh)

    if (realtimeRef.current) {
      supabase.removeChannel(realtimeRef.current)
      realtimeRef.current = null
    }

    const channel = supabase.channel(`noti-badge-${actorId}`)

    const onRealtime = () => fetchCount(true)
    channel.on(
      'postgres_changes',
      { event: 'INSERT', schema: 'vc', table: 'notifications', filter: `recipient_actor_id=eq.${actorId}` },
      onRealtime
    )
    channel.on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'vc', table: 'notifications', filter: `recipient_actor_id=eq.${actorId}` },
      onRealtime
    )
    channel.on(
      'postgres_changes',
      { event: 'DELETE', schema: 'vc', table: 'notifications', filter: `recipient_actor_id=eq.${actorId}` },
      onRealtime
    )

    channel.subscribe()
    realtimeRef.current = channel

    if (pollRef.current) clearInterval(pollRef.current)
    pollRef.current = setInterval(fetchCount, pollMs)

    return () => {
      window.removeEventListener('noti:refresh', onRefresh)
      if (pollRef.current) clearInterval(pollRef.current)
      if (realtimeRef.current) {
        supabase.removeChannel(realtimeRef.current)
        realtimeRef.current = null
      }
    }
  }, [actorId, validActor, pollMs, fetchCount])

  return count
}
