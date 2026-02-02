// src/features/chat/inbox/hooks/useInboxEntryForConversation.js
import { useCallback, useEffect, useState } from 'react'
import { getInboxEntryDAL } from '@/features/chat/inbox/dal/inbox.entry.read.dal'

export default function useInboxEntryForConversation({
  actorId,
  conversationId,
}) {
  const [entry, setEntry] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const refresh = useCallback(async () => {
    if (!actorId || !conversationId) return
    setLoading(true)
    setError(null)
    try {
      const data = await getInboxEntryDAL({ actorId, conversationId })
      setEntry(data)
    } catch (e) {
      console.error('[useInboxEntryForConversation] failed', e)
      setError(e)
    } finally {
      setLoading(false)
    }
  }, [actorId, conversationId])

  useEffect(() => {
    refresh()
  }, [refresh])

  return { entry, loading, error, refresh, setEntry }
}
