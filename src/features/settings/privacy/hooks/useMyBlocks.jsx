// src/features/settings/privacy/hooks/useMyBlocks.jsx

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'

import {
  ctrlBlockActor,
  ctrlListMyBlocks,
  ctrlUnblockActor,
} from '@/features/settings/privacy/controller/Blocks.controller'

// 🔥 REQUIRED: hydrate blocked actors into actor store
import { hydrateActorsFromRows } from '@/features/actors/controllers/hydrateActors.controller'

const Ctx = createContext(null)

export function MyBlocksProvider({ children, scope, actorId }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [blocks, setBlocks] = useState([])

  /* ============================================================
     DERIVED — BLOCKED IDS SET
     ============================================================ */
  const blockedIds = useMemo(() => {
    const s = new Set()
    for (const b of blocks) s.add(b.blockedActorId)
    return s
  }, [blocks])

  /* ============================================================
     REFRESH (SSOT)
     ============================================================ */
  const refresh = useCallback(async () => {
    if (!actorId) return

    setLoading(true)
    setError(null)

    try {
      const list = await ctrlListMyBlocks({
        actorId,
        scope,
      })

      // 🔥 CRITICAL FIX:
      // Hydrate blocked actors so avatars / names resolve
      await hydrateActorsFromRows(
        list.map((b) => ({
          actorId: b.blockedActorId,
        }))
      )

      setBlocks(list)
    } catch (e) {
      setError(e?.message || String(e))
    } finally {
      setLoading(false)
    }
  }, [actorId, scope])

  /* ============================================================
     INITIAL LOAD
     ============================================================ */
  useEffect(() => {
    refresh()
  }, [refresh])

  /* ============================================================
     BLOCK
     ============================================================ */
  const block = useCallback(
    async (blockedActorId) => {
      setError(null)

      try {
        await ctrlBlockActor({
          actorId,
          blockedActorId,
          scope,
          existingBlockedIds: blockedIds,
        })

        await refresh()
        return true
      } catch (e) {
        setError(e?.message || String(e))
        return false
      }
    },
    [actorId, scope, blockedIds, refresh]
  )

  /* ============================================================
     UNBLOCK
     ============================================================ */
  const unblock = useCallback(
    async (blockedActorId) => {
      setError(null)

      try {
        await ctrlUnblockActor({
          actorId,
          blockedActorId,
          scope,
          existingBlockedIds: blockedIds,
        })

        await refresh()
        return true
      } catch (e) {
        setError(e?.message || String(e))
        return false
      }
    },
    [actorId, scope, blockedIds, refresh]
  )

  /* ============================================================
     CONTEXT VALUE
     ============================================================ */
  const value = useMemo(
    () => ({
      scope,
      actorId,
      loading,
      error,
      blocks,
      blockedIds,
      refresh,
      block,
      unblock,
    }),
    [scope, actorId, loading, error, blocks, blockedIds, refresh, block, unblock]
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

/* ============================================================
   HOOK
   ============================================================ */
export function useMyBlocks() {
  const v = useContext(Ctx)
  if (!v) {
    throw new Error('useMyBlocks must be used inside <MyBlocksProvider>')
  }
  return v
}