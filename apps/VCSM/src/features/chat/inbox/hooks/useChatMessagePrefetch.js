// src/features/chat/inbox/hooks/useChatMessagePrefetch.js
// ============================================================
// useChatMessagePrefetch
// ------------------------------------------------------------
// Fires background prefetch of the latest 20 messages for each
// visible inbox conversation after the inbox has loaded.
//
// Cache: React Query — queryKeys.chatMessages(conversationId)
// staleTime: 90s (matches seed window in useConversationMessages)
//
// Authorization: getConversationMessages performs a membership
// check per conversation — no security bypass.
//
// Concurrency: 3 parallel fetches at a time to avoid flooding
// Supabase. Conversations already in cache are skipped.
// ============================================================

import { useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { getConversationMessages } from '@chat'
import { queryKeys } from '@/queries/queryKeys'

const DEV = import.meta.env?.DEV
const PREFETCH_LIMIT = 20
const CONCURRENCY = 3
const STALE_MS = 90_000

export function useChatMessagePrefetch({ actorId, conversationIds }) {
  const queryClient = useQueryClient()

  // Stable key prevents the effect re-running on reference changes
  // when the conversation list content hasn't actually changed.
  const idsKey = Array.isArray(conversationIds)
    ? conversationIds.slice(0, 10).join(',')
    : ''

  const pendingRef = useRef(new Set())

  useEffect(() => {
    if (!actorId || !idsKey) return

    const ids = idsKey.split(',').filter(Boolean)
    if (!ids.length) return

    // Separate hits (already cached) from misses (need fetching)
    const toFetch = []

    for (const cid of ids) {
      const existing = queryClient.getQueryData(queryKeys.chatMessages(cid))
      if (existing) {
        if (DEV) console.log('[chat:messages:prefetch:hit]', { cid, count: existing.length })
        continue
      }
      if (pendingRef.current.has(cid)) continue
      toFetch.push(cid)
    }

    if (!toFetch.length) return

    let idx = 0

    const runNext = () => {
      if (idx >= toFetch.length) return
      const cid = toFetch[idx++]

      pendingRef.current.add(cid)

      if (DEV) console.log('[chat:messages:prefetch:start]', { cid })

      queryClient
        .prefetchQuery({
          queryKey: queryKeys.chatMessages(cid),
          queryFn: () => getConversationMessages({ conversationId: cid, actorId, limit: PREFETCH_LIMIT }),
          staleTime: STALE_MS,
        })
        .then(() => {
          pendingRef.current.delete(cid)
          const result = queryClient.getQueryData(queryKeys.chatMessages(cid))
          if (DEV) console.log('[chat:messages:prefetch:miss]', { cid, count: result?.length ?? 0 })
          runNext()
        })
        .catch(() => {
          pendingRef.current.delete(cid)
          runNext()
        })
    }

    for (let i = 0; i < CONCURRENCY; i++) runNext()

  }, [actorId, idsKey, queryClient])
}
