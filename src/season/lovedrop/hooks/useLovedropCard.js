// src/season/lovedrop/hooks/useLovedropCard.js
// ============================================================================
// LOVE DROP HOOK — USE CARD (load + open tracking)
// ============================================================================

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { openLovedropCard } from '@/season/lovedrop/controllers/openLovedropCard.controller'
import { getLovedropCard } from '@/season/lovedrop/controllers/getLovedropCard.controller'
import { ensureLovedropAnonIdentity } from '@/season/lovedrop/controllers/ensureLovedropAnon.controller'

/**
 * @param {{
 *  publicId: string,
 *  viewerActorId?: string|null,
 *  viewerAnonId?: string|null,
 *  clientKey?: string|null,
 *  trackOpen?: boolean, // default true
 * }} params
 */
export function useLovedropCard(params) {
  const publicId = params.publicId
  const viewerActorId = params.viewerActorId ?? null
  const initialViewerAnonId = params.viewerAnonId ?? null
  const clientKey = params.clientKey ?? null
  const trackOpen = params.trackOpen !== undefined ? !!params.trackOpen : true

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [card, setCard] = useState(null)
  const [didCountOpen, setDidCountOpen] = useState(false)

  const [viewerAnonId, setViewerAnonId] = useState(initialViewerAnonId)

  // Keep anon id stable inside callbacks
  const viewerAnonIdRef = useRef(viewerAnonId)
  useEffect(() => {
    viewerAnonIdRef.current = viewerAnonId
  }, [viewerAnonId])

  // Run at most once per publicId mount
  const didInitialLoadRef = useRef(false)
  const lastPublicIdRef = useRef(null)

  // Prevent concurrent duplicate opens
  const openInFlightRef = useRef(false)

  // "opened already" guard for this tab session
  const sessionKey = useMemo(() => {
    return publicId ? `lovedrop_opened:${publicId}` : null
  }, [publicId])

  const canLoad = useMemo(() => {
    if (!trackOpen) return !!publicId
    return !!publicId && (!!viewerActorId || !!viewerAnonId)
  }, [publicId, trackOpen, viewerActorId, viewerAnonId])

  const ensureAnon = useCallback(async () => {
    const existing = viewerAnonIdRef.current
    if (existing) return existing

    const anon = await ensureLovedropAnonIdentity({ clientKey })
    const id = anon?.id ?? null
    if (id && !viewerAnonIdRef.current) {
      viewerAnonIdRef.current = id
      setViewerAnonId(id)
    }
    return id
  }, [clientKey])

  const safeRead = useCallback(async () => {
    const c = await getLovedropCard({ publicId })
    setCard(c)
    setDidCountOpen(false)
  }, [publicId])

  const loadOnce = useCallback(async () => {
    if (!publicId) return

    setLoading(true)
    setError(null)

    try {
      if (!trackOpen) {
        await safeRead()
        return
      }

      // If we already opened in this tab session, don't count again
      if (sessionKey) {
        try {
          const already = sessionStorage.getItem(sessionKey)
          if (already === '1') {
            await safeRead()
            return
          }
        } catch (e) {
          // ignore storage errors
        }
      }

      // Prevent multiple concurrent opens
      if (openInFlightRef.current) {
        await safeRead()
        return
      }
      openInFlightRef.current = true

      const anonId = viewerActorId ? null : await ensureAnon()

      const res = await openLovedropCard({
        publicId,
        viewerActorId,
        viewerAnonId: anonId,
        meta: { source: 'web' },
      })

      setCard(res.card)
      setDidCountOpen(!!res.didCountOpen)

      // Mark opened for this session (only if it counted)
      if (sessionKey && res?.didCountOpen) {
        try {
          sessionStorage.setItem(sessionKey, '1')
        } catch (e) {
          // ignore
        }
      }
    } catch (e) {
      setError(e)
    } finally {
      openInFlightRef.current = false
      setLoading(false)
    }
  }, [publicId, trackOpen, viewerActorId, ensureAnon, safeRead, sessionKey])

  useEffect(() => {
    if (!publicId) return

    if (lastPublicIdRef.current !== publicId) {
      lastPublicIdRef.current = publicId
      didInitialLoadRef.current = false
    }

    if (didInitialLoadRef.current) return

    // Tracking mode needs identity
    if (trackOpen && !viewerActorId && !viewerAnonIdRef.current) {
      ensureAnon().catch(() => {})
      return
    }

    didInitialLoadRef.current = true
    loadOnce()
  }, [publicId, trackOpen, viewerActorId, ensureAnon, loadOnce])

  // Manual refresh = safe read (no tracking)
  const refresh = useCallback(async () => {
    if (!publicId) return
    setLoading(true)
    setError(null)
    try {
      await safeRead()
    } catch (e) {
      setError(e)
    } finally {
      setLoading(false)
    }
  }, [publicId, safeRead])

  return {
    loading,
    error,
    card,
    didCountOpen,
    refresh,
    viewerAnonId,
    canLoad,
  }
}

export default useLovedropCard
