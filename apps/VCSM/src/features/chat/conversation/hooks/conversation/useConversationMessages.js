// src/features/chat/conversation/hooks/conversation/useConversationMessages.js
// ============================================================
// useConversationMessages — VCSM conversation messages hook
// ------------------------------------------------------------
// MIGRATED (Slice 3): Delegates to shared chat engine.
// Authority: chat.messages (via engine)
//
// Warm-cache layer (added 2026-05-03):
//
//   The engine hook starts with loading=true / messages=[].
//   This wrapper seeds from the React Query cache
//   (queryKeys.chatMessages) so that conversations prefetched
//   by InboxScreen render messages immediately on open.
//
//   React Query = shared cache (prefetch + seed + GC)
//   Engine hook = live state (realtime, optimistic, tombstones)
//
//   Cache lifecycle:
//     seed  — queryClient.getQueryData() read synchronously on mount
//     write — queryClient.setQueryData() when engine resolves (loading→false)
//     TTL   — staleTime 90s set by useChatMessagePrefetch; gcTime default 5 min
//     evict — actor switch / logout should call queryClient.clear() or
//             invalidateQueries({ queryKey: ['chat', 'messages'] })
//
// Return contract is identical to the previous VCSM-local hook:
//   { messages, loading, onSendMessage, onEditMessage, onDeleteMessage,
//     addOptimistic, updateOptimistic, markFailed, retryMessage }
// ============================================================

import { useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useConversationMessages as useEngineMessages } from '@chat'
import { queryKeys } from '@/queries/queryKeys'

const DEV = import.meta.env?.DEV

export default function useConversationMessages({
  conversationId,
  actorId,
  pageSize = 50,
}) {
  const queryClient = useQueryClient()

  // Read from React Query cache synchronously — available immediately on first render.
  // Returns null if no cached data exists (cold open).
  const cached = queryClient.getQueryData(queryKeys.chatMessages(conversationId)) ?? []

  // Track whether this mount is serving from cache so we log it once.
  const servedFromCacheRef = useRef(cached.length > 0)

  // Engine hook owns realtime subscriptions, optimistic send lifecycle,
  // and tombstone guards. It always starts with loading=true / messages=[].
  const engine = useEngineMessages({ conversationId, actorId, pageSize })

  // ── Write-back: keep React Query cache current as engine resolves ──
  // Ensures subsequent opens of the same conversation are warm.
  useEffect(() => {
    if (!engine.loading && engine.messages.length > 0) {
      queryClient.setQueryData(queryKeys.chatMessages(conversationId), engine.messages)
    }
  }, [engine.loading, engine.messages, conversationId, queryClient])

  // ── DEV timing marks ──────────────────────────────────────────────
  useEffect(() => {
    if (!DEV) return
    if (servedFromCacheRef.current) {
      console.log('[chat:messages:cache:rendered]', {
        conversationId,
        count: cached.length,
      })
    }
  // Only log on mount — cached is captured at render time via closure.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const reconciledRef = useRef(false)
  useEffect(() => {
    if (!DEV) return
    if (!engine.loading && engine.messages.length > 0 && !reconciledRef.current) {
      reconciledRef.current = true
      console.log('[chat:messages:server:reconciled]', {
        conversationId,
        count: engine.messages.length,
        wasWarm: servedFromCacheRef.current,
      })
    }
  }, [engine.loading, engine.messages.length, conversationId])

  // ── Effective values ─────────────────────────────────────────────
  // While engine is loading and has no messages yet: serve cache.
  // Once engine delivers messages (or finishes loading empty): use engine.
  const messages =
    engine.loading && engine.messages.length === 0 ? cached : engine.messages

  // Show loading state only when there is truly no data to display.
  const loading = engine.loading && cached.length === 0 && engine.messages.length === 0

  return {
    ...engine,
    messages,
    loading,
  }
}
