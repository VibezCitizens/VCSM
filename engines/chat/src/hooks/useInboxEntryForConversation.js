import { useCallback, useEffect, useState } from 'react'
import { ctrlGetInboxEntryForConversation } from '../controller/getInboxEntryForConversation.controller.js'

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
      const data = await ctrlGetInboxEntryForConversation({
        actorId,
        conversationId,
      })
      setEntry(data)
    } catch (e) {
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
