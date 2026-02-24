import { useCallback, useEffect, useRef, useState } from 'react'
import { getUnreadNotificationCount } from '../controller/notificationsCount.controller'

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

async function loadNotiCount(actorId) {
  const cached = getCachedNotiCount(actorId)
  if (cached != null) return cached

  const inflight = notiCountInflight.get(actorId)
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
  debug = false,
} = {}) {
  const [count, setCount] = useState(0)

  const pollRef = useRef(null)
  const lastActorRef = useRef(null)

  const validActor =
    typeof actorId === 'string' && UUID_RX.test(actorId)

  const fetchCount = useCallback(async () => {
    if (!validActor) {
      if (debug) console.log('[useNotiCount] skip fetch (invalid actorId)', actorId)
      setCount(0)
      return
    }

    if (debug) console.log('[useNotiCount] fetch start', actorId)

    try {
      const c = await loadNotiCount(actorId)
      if (debug) console.log('[useNotiCount] fetch done ->', c)
      setCount(c)
    } catch (e) {
      console.error('[useNotiCount] fetch error', e)
      setCount(0)
    }
  }, [actorId, validActor, debug])

  useEffect(() => {
    if (!validActor) {
      if (pollRef.current) clearInterval(pollRef.current)
      setCount(0)
      return
    }

    const changed = lastActorRef.current !== actorId
    lastActorRef.current = actorId

    if (changed) fetchCount()

    const onRefresh = () => fetchCount()
    window.addEventListener('noti:refresh', onRefresh)

    if (pollRef.current) clearInterval(pollRef.current)
    pollRef.current = setInterval(fetchCount, pollMs)

    return () => {
      window.removeEventListener('noti:refresh', onRefresh)
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [actorId, validActor, pollMs, fetchCount])

  return count
}
