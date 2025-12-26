import { useCallback, useEffect, useRef, useState } from 'react'
import { getUnreadNotificationCount } from '../controller/notificationsCount.controller'

const UUID_RX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

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

  const log = (...a) => debug && console.log('[useNotiCount]', ...a)

  const validActor =
    typeof actorId === 'string' && UUID_RX.test(actorId)

  const fetchCount = useCallback(async () => {
    if (!validActor) {
      log('skip fetch (invalid actorId)', actorId)
      setCount(0)
      return
    }

    log('fetch start', actorId)

    try {
      const c = await getUnreadNotificationCount(actorId)
      log('fetch done →', c)
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
