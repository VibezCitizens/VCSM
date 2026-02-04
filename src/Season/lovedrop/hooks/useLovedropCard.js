// C:\Users\trest\OneDrive\Desktop\VCSM\src\season\lovedrop\hooks\useLovedropCard.js
// ============================================================================
// LOVE DROP HOOK — USE CARD (load + open tracking)
// Contract: timing + UI state only. Calls controller, no DAL.
// ============================================================================

import { useCallback, useEffect, useMemo, useState } from 'react'
import { openLovedropCard } from '@/season/lovedrop/controllers/openLovedropCard.controller'
import { ensureLovedropAnonIdentity } from '@/season/lovedrop/controllers/ensureLovedropAnon.controller'

/**
 * CONTRACT-CORRECT HOOK:
 * - ensures anon identity exists if viewerAnonId not provided
 * - calls controller to open + returns domain card
 *
 * @param {{
 *  publicId: string,
 *  viewerActorId?: string|null,
 *  viewerAnonId?: string|null,
 *  clientKey?: string|null
 * }} params
 */
export function useLovedropCard(params) {
  const publicId = params.publicId
  const viewerActorId = params.viewerActorId ?? null

  // If caller already has anon id, use it; otherwise we'll ensure it.
  const initialViewerAnonId = params.viewerAnonId ?? null
  const clientKey = params.clientKey ?? null

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [card, setCard] = useState(null)
  const [didCountOpen, setDidCountOpen] = useState(false)

  const [viewerAnonId, setViewerAnonId] = useState(initialViewerAnonId)

  const canOpen = useMemo(() => {
    return !!publicId && (!!viewerActorId || !!viewerAnonId)
  }, [publicId, viewerActorId, viewerAnonId])

  const ensureAnon = useCallback(async () => {
    if (viewerAnonId) return viewerAnonId
    const anon = await ensureLovedropAnonIdentity({ clientKey })
    const id = anon?.id ?? null
    if (id) setViewerAnonId(id)
    return id
  }, [viewerAnonId, clientKey])

  const refresh = useCallback(async () => {
    if (!publicId) return
    setLoading(true)
    setError(null)

    try {
      const anonId = await ensureAnon()

      const res = await openLovedropCard({
        publicId,
        viewerActorId,
        viewerAnonId: anonId,
        meta: { source: 'web' },
      })

      setCard(res.card)
      setDidCountOpen(!!res.didCountOpen)
    } catch (e) {
      setError(e)
    } finally {
      setLoading(false)
    }
  }, [publicId, viewerActorId, ensureAnon])

  useEffect(() => {
    refresh()
  }, [refresh])

  return {
    loading,
    error,
    card,
    didCountOpen,
    refresh,
    viewerAnonId,
  }
}
