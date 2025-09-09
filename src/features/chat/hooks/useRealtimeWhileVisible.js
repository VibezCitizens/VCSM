// src/features/chat/hooks/useRealtimeWhileVisible.js
// (actually a polling hook — no Realtime)
// Polls "messages" while the page is visible/online/focused and
// invokes onInsert(row) for each newly seen row.

import { useEffect, useRef, useCallback, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

/**
 * Params (compatible with your existing usages):
 * - channelKey: string (ignored; kept for API compatibility)
 * - filter: e.g. 'conversation_id=eq.<uuid>'  (parsed and applied to query)
 * - onInsert: (row) => void   (called for each new message)
 * - enabled: boolean
 * - pollMs?: number (default 4000)
 * - table?: string (default 'messages')
 * - sinceField?: string (default 'created_at')
 * - selectCols?: string (default '*')
 */
export function useRealtimeWhileVisible({
  channelKey,              // kept for compatibility; not used
  filter,                  // e.g. 'conversation_id=eq.123'
  onInsert,
  enabled = true,
  pollMs = 4000,
  table = 'messages',
  sinceField = 'created_at',
  selectCols = '*',
}) {
  const timerRef = useRef(null)
  const abortRef = useRef(null)
  const runningRef = useRef(false)

  // track the latest seen value of sinceField (ISO string) to only fetch newer rows
  const [since, setSince] = useState(null)

  const stop = useCallback(() => {
    runningRef.current = false
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    if (abortRef.current) {
      try { abortRef.current.abort() } catch {}
      abortRef.current = null
    }
  }, [])

  // Parse a simple postgrest-style filter string like "foo=eq.bar"
  const applyFilter = useCallback((q) => {
    if (!filter) return q
    const m = /^(\w+)=eq\.(.+)$/.exec(filter)
    if (m) {
      const [, col, val] = m
      return q.eq(col, val)
    }
    // If you ever pass more complex filters, adapt here.
    return q
  }, [filter])

  const tick = useCallback(async () => {
    if (!enabled || document.hidden || !navigator.onLine) return
    // prevent overlapping requests
    if (abortRef.current) return

    const controller = new AbortController()
    abortRef.current = controller

    try {
      let q = supabase
        .from(table)
        .select(selectCols)
        .order(sinceField, { ascending: true })
        .limit(200)

      q = applyFilter(q)
      if (since) q = q.gt(sinceField, since)

      const { data, error } = await q
      if (error) throw error

      if (Array.isArray(data) && data.length) {
        // push rows in ascending order (oldest→newest)
        for (const row of data) onInsert?.(row)

        // advance the cursor
        const newest = data[data.length - 1]?.[sinceField]
        if (newest) setSince(newest)
      }
    } catch (e) {
      // Optional: log or backoff. For now, just stop the in-flight marker.
      // console.error('[poll]', e)
    } finally {
      abortRef.current = null
    }
  }, [enabled, table, selectCols, sinceField, since, applyFilter, onInsert])

  const start = useCallback(() => {
    if (!enabled || document.hidden || runningRef.current) return
    runningRef.current = true

    // kick once immediately
    tick()

    // then poll on an interval
    timerRef.current = setInterval(() => {
      // guard again in case we were stopped between intervals
      if (enabled && !document.hidden && navigator.onLine) tick()
    }, pollMs)
  }, [enabled, pollMs, tick])

  useEffect(() => {
    if (!enabled) return

    // start now if visible
    start()

    const onVis = () => (document.hidden ? stop() : start())
    const onFocus = () => start()
    const onBlur = () => stop()
    const onOnline = () => { stop(); start() }
    const onOffline = () => stop()

    document.addEventListener('visibilitychange', onVis)
    window.addEventListener('focus', onFocus)
    window.addEventListener('blur', onBlur)
    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)

    return () => {
      document.removeEventListener('visibilitychange', onVis)
      window.removeEventListener('focus', onFocus)
      window.removeEventListener('blur', onBlur)
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline)
      stop()
    }
  }, [enabled, start, stop])

  // Reset cursor if filter changes (e.g., switching conversations)
  useEffect(() => {
    setSince(null)
  }, [filter])
}
