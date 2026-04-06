import { useCallback, useEffect, useRef, useState } from 'react'
import { openConversationController } from '../controller/openConversation.controller.js'
import { markConversationRead } from '../controller/markConversationRead.controller.js'
import { subscribeToConversation } from '../dal/subscribeToConversation.js'

export default function useConversation({ conversationId, actorId }) {
  const [conversation, setConversation] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const unsubRef = useRef(null)

  const loadInitial = useCallback(async () => {
    if (!conversationId || !actorId) return
    setLoading(true)
    setError(null)
    try {
      const convo = await openConversationController({ conversationId, actorId })
      if (!convo) throw new Error('Conversation not found or access denied')
      setConversation(convo)
      try {
        await markConversationRead({ conversationId, actorId })
      } catch (readErr) {
        // non-fatal — swallow silently
      }
    } catch (err) {
      setError(err)
    } finally {
      setLoading(false)
    }
  }, [conversationId, actorId])

  useEffect(() => {
    if (!conversationId || !actorId) return
    unsubRef.current?.()
    unsubRef.current = subscribeToConversation({
      conversationId,
      actorId,
      onConversationUpdated: (updates) => {
        setConversation((prev) => prev ? { ...prev, ...updates } : prev)
      },
    })
    return () => { unsubRef.current?.(); unsubRef.current = null }
  }, [conversationId, actorId])

  useEffect(() => { loadInitial() }, [loadInitial])

  return { conversation, loading, error, refresh: loadInitial }
}
