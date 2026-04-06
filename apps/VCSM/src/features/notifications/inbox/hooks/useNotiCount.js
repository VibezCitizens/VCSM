import { useCallback, useEffect, useRef, useState } from 'react'
import { getUnreadNotificationCount } from '../controller/notificationsCount.controller'
import { subscribeNotificationBadge } from '@/features/notifications/inbox/realtime/badgeSubscriptions'

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
  const unsubscribeRealtimeRef = useRef(null)
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

    if (unsubscribeRealtimeRef.current) {
      unsubscribeRealtimeRef.current()
      unsubscribeRealtimeRef.current = null
    }

    const onRealtime = () => fetchCount(true)
    unsubscribeRealtimeRef.current = subscribeNotificationBadge({
      actorId,
      onChange: onRealtime,
    })

    if (pollRef.current) clearInterval(pollRef.current)
    pollRef.current = setInterval(fetchCount, pollMs)

    return () => {
      window.removeEventListener('noti:refresh', onRefresh)
      if (pollRef.current) clearInterval(pollRef.current)
      if (unsubscribeRealtimeRef.current) {
        unsubscribeRealtimeRef.current()
        unsubscribeRealtimeRef.current = null
      }
    }
  }, [actorId, validActor, pollMs, fetchCount])

  return count
}
