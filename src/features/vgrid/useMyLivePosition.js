// src/features/vgrid/useMyLivePosition.js
import { useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

/**
 * useMyLivePosition
 * Tracks the user's live GPS and upserts to Supabase (driver_positions) with RLS.
 *
 * Options:
 * - minDistanceMeters: number (default 15)   -> minimum movement to trigger an upsert
 * - minIntervalMs:     number (default 5000) -> minimum time between upserts
 * - maxAccuracyMeters: number (default 50)   -> ignore fixes worse than this accuracy
 * - enableVisibilityPause: boolean (default true) -> pause upserts when tab hidden
 */
export default function useMyLivePosition(options = {}) {
  const {
    minDistanceMeters = 15,
    minIntervalMs = 5000,
    maxAccuracyMeters = 50,
    enableVisibilityPause = true,
  } = options

  const [pos, setPos] = useState(null)          // { lat, lng, heading?, speed?, accuracy? }
  const [error, setError] = useState(null)
  const watchIdRef = useRef(null)
  const lastSentRef = useRef({ t: 0, lat: null, lng: null })
  const pausedRef = useRef(false)
  const userIdRef = useRef(null)

  // distance in meters using haversine
  const movedEnough = (a, b) => {
    if (!a || !b) return true
    const toRad = (x) => (x * Math.PI) / 180
    const R = 6371000 // m
    const dLat = toRad(b.lat - a.lat)
    const dLng = toRad(b.lng - a.lng)
    const lat1 = toRad(a.lat)
    const lat2 = toRad(b.lat)
    const s =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
    const d = 2 * R * Math.asin(Math.sqrt(s))
    return d >= minDistanceMeters
  }

  // visibility pause
  useEffect(() => {
    if (!enableVisibilityPause) return
    const onVis = () => {
      pausedRef.current = document.hidden
    }
    document.addEventListener('visibilitychange', onVis)
    pausedRef.current = document.hidden
    return () => document.removeEventListener('visibilitychange', onVis)
  }, [enableVisibilityPause])

  useEffect(() => {
    let cancelled = false

    ;(async () => {
      const { data: { user }, error: authErr } = await supabase.auth.getUser()
      if (authErr) {
        setError(authErr)
        return
      }
      if (!user) return
      userIdRef.current = user.id

      if (!('geolocation' in navigator)) {
        setError(new Error('Geolocation not supported'))
        return
      }

      // Helper to upsert throttled
      const maybeUpsert = async (point) => {
        const now = Date.now()
        const { t, lat, lng } = lastSentRef.current

        // Throttle by time
        if (now - t < minIntervalMs) return

        // Throttle by distance
        if (!movedEnough({ lat, lng }, point)) return

        // Pause when tab hidden
        if (pausedRef.current) return

        lastSentRef.current = { t: now, lat: point.lat, lng: point.lng }

        try {
          await supabase
            .from('driver_positions')
            .upsert(
              {
                user_id: userIdRef.current,
                lat: point.lat,
                lng: point.lng,
                heading: point.heading ?? null,
                updated_at: new Date().toISOString(),
              },
              { onConflict: 'user_id' }
            )
        } catch (e) {
          // swallow network blips; keep UI responsive
          // optionally setError(e)
        }
      }

      // Seed with a quick one-time position so UI has something immediately
      navigator.geolocation.getCurrentPosition(
        async ({ coords }) => {
          if (cancelled) return
          const seed = {
            lat: coords.latitude,
            lng: coords.longitude,
            heading: Number.isFinite(coords.heading) ? coords.heading : null,
            speed: Number.isFinite(coords.speed) ? coords.speed : null,
            accuracy: Number.isFinite(coords.accuracy) ? coords.accuracy : null,
          }
          setPos(seed)
          // Only upsert if accuracy is reasonable
          if (seed.accuracy == null || seed.accuracy <= maxAccuracyMeters) {
            await maybeUpsert(seed)
          }
        },
        (err) => {
          if (!cancelled) setError(err)
        },
        { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 }
      )

      // Continuous updates
      watchIdRef.current = navigator.geolocation.watchPosition(
        async ({ coords }) => {
          if (cancelled) return
          const next = {
            lat: coords.latitude,
            lng: coords.longitude,
            heading: Number.isFinite(coords.heading) ? coords.heading : null,
            speed: Number.isFinite(coords.speed) ? coords.speed : null,
            accuracy: Number.isFinite(coords.accuracy) ? coords.accuracy : null,
          }

          setPos(next)

          // Ignore super noisy fixes
          if (next.accuracy != null && next.accuracy > maxAccuracyMeters) {
            return
          }

          await maybeUpsert(next)
        },
        (err) => {
          if (!cancelled) setError(err)
        },
        { enableHighAccuracy: true, maximumAge: 1000, timeout: 20000 }
      )
    })()

    return () => {
      cancelled = true
      if (watchIdRef.current != null) {
        navigator.geolocation.clearWatch(watchIdRef.current)
      }
    }
  }, [minDistanceMeters, minIntervalMs, maxAccuracyMeters])

  return { pos, error }
}
