// src/features/chat/inbox/hooks/useChatInbox.js
// ============================================================
// useChatInbox
// ------------------------------------------------------------
// React Query owner of chat.inbox_entries data.
//
// Engine's getInboxEntries controller runs the DB fetch + hydration.
// React Query owns caching, deduplication, staleness, and polling.
// Realtime is intentionally disabled for chat inbox/unread for now.
//
// Zustand owns: selectedConversationId, isNewChatModalOpen, etc.
// This hook must NEVER store: inbox rows, messages, participants.
// ============================================================

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getInboxEntries, InboxEntryModel } from '@chat'
import { queryKeys } from '@/queries/queryKeys'
import buildInboxPreview from '@/features/chat/inbox/lib/buildInboxPreview'

const CHAT_INBOX_REFETCH_MS = 30_000

function buildQueryKey(actorId, folder) {
  const base = queryKeys.chatInbox(actorId)
  return folder === 'inbox' ? base : [...base, folder]
}

function modelRow(row, actorId) {
  const entry = InboxEntryModel(
    {
      ...row,
      members: row.conversation?.members ?? [],
    },
    actorId
  )
  if (!entry) return null
  const preview = buildInboxPreview({ entry, currentActorId: actorId })
  if (!preview) return null
  // Merge: keep all InboxEntryModel fields (needed by domain filters like isRequestEntry)
  // then overlay the richer preview shape from buildInboxPreview.
  return { ...entry, ...preview }
}

export function useChatInbox(actorId, { folder = 'inbox', includeArchived = false } = {}) {
  const hiddenRef = useRef(new Set())
  const [hiddenTick, setHiddenTick] = useState(0)

  // Clear tombstones when actor or folder changes.
  useEffect(() => {
    hiddenRef.current.clear()
    setHiddenTick(0)
  }, [actorId, folder])

  const qKey = buildQueryKey(actorId, folder)

  const query = useQuery({
    queryKey: qKey,
    queryFn: () => getInboxEntries({ actorId, folder, includeArchived }),
    enabled: !!actorId,
    staleTime: CHAT_INBOX_REFETCH_MS,
    gcTime: 10 * 60_000,
    refetchInterval: CHAT_INBOX_REFETCH_MS,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: false,
  })

  // Model raw controller output into InboxEntryModel shape.
  const modeledEntries = useMemo(() => {
    const raw = Array.isArray(query.data) ? query.data : []
    return raw.map((row) => modelRow(row, actorId)).filter(Boolean)
  }, [query.data, actorId])

  // Filter out optimistically hidden conversations.
  const entries = useMemo(() => {
    return modeledEntries.filter((e) => !hiddenRef.current.has(e.conversationId))
  }, [modeledEntries, hiddenTick]) // eslint-disable-line react-hooks/exhaustive-deps

  const hideConversation = useCallback((conversationId) => {
    if (!conversationId) return
    hiddenRef.current.add(conversationId)
    setHiddenTick((t) => t + 1)
  }, [])

  return {
    entries,
    loading: query.isLoading,
    error: query.error ?? null,
    refresh: query.refetch,
    hideConversation,
  }
}
