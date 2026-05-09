// src/features/communication/conversation/hooks/conversation/useConversationMessages.js
// ============================================================
// Orchestrator hook — composes useMessageMerge + useMessageActions
// and wires up initial load + realtime subscription.
// ============================================================

import { useCallback, useEffect, useState, useRef } from 'react'

// controllers
import { getConversationMessagesController }
  from '../../controllers/getConversationMessages.controller'

// realtime
import { subscribeToConversation }
  from '../../realtime/subscribeToConversation'

// model
import { MessageModel } from '../../model/Message.model'

// sub-hooks
import useMessageMerge from './useMessageMerge'
import useMessageActions from './useMessageActions'

export default function useConversationMessages({
  conversationId,
  actorId,
  pageSize = 50,
}) {
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)

  // stable ref so useMessageActions can read current messages without
  // adding `messages` to its dependency array
  const messagesRef = useRef(messages)
  messagesRef.current = messages
  const getMessages = useCallback(() => messagesRef.current, [])

  const {
    mergeMessages,
    deletedForMeIdsRef,
    deletedForMeClientIdsRef,
  } = useMessageMerge(setMessages)

  const {
    onSendMessage,
    onEditMessage,
    onDeleteMessage,
  } = useMessageActions({
    conversationId,
    actorId,
    setMessages,
    mergeMessages,
    deletedForMeIdsRef,
    deletedForMeClientIdsRef,
    getMessages,
  })

  /* ---- Initial load ---- */
  const loadInitial = useCallback(async () => {
    if (!conversationId || !actorId) return

    setLoading(true)

    try {
      const domainMessages =
        await getConversationMessagesController({
          conversationId,
          actorId,
          limit: pageSize,
        })

      mergeMessages(domainMessages)
    } catch (err) {
      console.error('[useConversationMessages] loadInitial failed', err)
    } finally {
      setLoading(false)
    }
  }, [conversationId, actorId, pageSize, mergeMessages])

  /* ---- Realtime: message inserts ONLY ---- */
  useEffect(() => {
    if (!conversationId || !actorId) return

    return subscribeToConversation({
      conversationId,
      actorId,
      onMessageInserted: (raw) => {
        const message = MessageModel(raw)
        if (!message) return

        if (message?.id && deletedForMeIdsRef.current.has(message.id)) return
        if (message?.clientId && deletedForMeClientIdsRef.current.has(message.clientId)) return

        setMessages((prev) => {
          if (message.clientId) {
            const idx = prev.findIndex(
              (m) => m.clientId === message.clientId
            )

            if (idx !== -1) {
              const next = [...prev]
              next[idx] = {
                ...message,
                __optimistic: false,
              }
              return next
            }
          }

          return [...prev, message].sort(
            (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
          )
        })
      },
    })
  }, [conversationId, actorId, deletedForMeIdsRef, deletedForMeClientIdsRef])

  /* ---- Mount / conversation switch ---- */
  useEffect(() => {
    loadInitial()
  }, [loadInitial])

  return {
    messages,
    loading,
    onSendMessage,
    onEditMessage,
    onDeleteMessage,
  }
}
