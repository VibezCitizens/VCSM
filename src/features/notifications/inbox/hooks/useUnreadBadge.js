import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { getInboxUnreadBadgeCount } from '../controller/inboxUnread.controller'

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

async function loadUnread(actorId) {
  const cached = readCachedUnread(actorId)
  if (cached != null) return cached

  const inflight = unreadInflight.get(actorId)
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

export default function useUnreadBadge({ actorId, refreshMs = 20000, debug = false } = {}) {
  const [count, setCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const aliveRef = useRef(true)

  const canQuery = useMemo(
    () => typeof actorId === 'string' && actorId.length >= 32,
    [actorId]
  )

  const load = useCallback(async () => {
    if (!canQuery) {
      setCount(0)
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      const total = await loadUnread(actorId)
      if (aliveRef.current) setCount(total)
      if (debug) console.log('[useUnreadBadge] count ->', total)
    } finally {
      if (aliveRef.current) setLoading(false)
    }
  }, [actorId, canQuery, debug])

  useEffect(() => {
    aliveRef.current = true
    load()

    const onRefresh = () => load()
    window.addEventListener('noti:refresh', onRefresh)

    let timer = null
    if (refreshMs > 0) {
      timer = setInterval(load, refreshMs)
    }

    return () => {
      aliveRef.current = false
      window.removeEventListener('noti:refresh', onRefresh)
      if (timer) clearInterval(timer)
    }
  }, [load, refreshMs])

  return { count, loading }
}
