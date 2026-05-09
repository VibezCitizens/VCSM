// src/features/communication/conversation/hooks/conversation/useMessageMerge.js
// ============================================================
// Deterministic merge helper for conversation messages.
// Handles ID-first dedup, tombstone safety, and optimistic
// reconciliation.
// ============================================================

import { useCallback, useRef } from 'react'

/**
 * Returns merge utilities for conversation message state.
 *
 * @param {Function} setMessages - The state setter for the messages array.
 * @returns {{ mergeMessages, deletedForMeIdsRef, deletedForMeClientIdsRef }}
 */
export default function useMessageMerge(setMessages) {
  // local tombstones (prevents resurrection on refetch/realtime)
  const deletedForMeIdsRef = useRef(new Set())       // messageId set
  const deletedForMeClientIdsRef = useRef(new Set())  // clientId set (optimistic)

  const mergeMessages = useCallback((incoming = []) => {
    setMessages((prev) => {
      const byId = new Map()
      const byClientId = new Map()

      // index existing messages
      for (const msg of prev) {
        if (msg.id) byId.set(msg.id, msg)
        if (msg.clientId) byClientId.set(msg.clientId, msg)
      }

      for (const msg of incoming) {
        // skip anything deleted-for-me locally
        if (msg?.id && deletedForMeIdsRef.current.has(msg.id)) {
          continue
        }
        if (msg?.clientId && deletedForMeClientIdsRef.current.has(msg.clientId)) {
          continue
        }

        const existing = msg.id ? byId.get(msg.id) : null

        // TOMBSTONE GUARD - once unsent/deleted-for-all, never resurrect
        if (existing?.isDeleted && !msg.deletedAt) {
          continue
        }

        // UPDATE / EDIT / UNSEND - replace by DB id
        if (msg.id && byId.has(msg.id)) {
          byId.set(msg.id, { ...existing, ...msg })
          continue
        }

        // OPTIMISTIC -> SERVER RECONCILIATION
        if (msg.clientId && byClientId.has(msg.clientId)) {
          const optimistic = byClientId.get(msg.clientId)

          // if optimistic was deleted-for-me, don't re-add on reconciliation
          if (deletedForMeClientIdsRef.current.has(msg.clientId)) {
            byClientId.delete(msg.clientId)
            if (optimistic?.id) byId.delete(optimistic.id)
            if (msg.id) deletedForMeIdsRef.current.add(msg.id)
            continue
          }

          byClientId.delete(msg.clientId)
          if (optimistic.id) byId.delete(optimistic.id)
          byId.set(msg.id, msg)
          continue
        }

        // brand-new message
        byId.set(msg.id ?? msg.clientId, msg)
      }

      return Array.from(byId.values()).sort(
        (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
      )
    })
  }, [setMessages])

  return { mergeMessages, deletedForMeIdsRef, deletedForMeClientIdsRef }
}
