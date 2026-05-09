// src/features/communication/conversation/hooks/conversation/useMessageActions.js
// ============================================================
// Optimistic send, edit, and delete actions for conversation
// messages.
// ============================================================

import { useCallback, useRef } from 'react'

// controllers
import { sendMessageController }
  from '../../controllers/sendMessage.controller'
import { editMessageController }
  from '../../controllers/message-actions/editMessage.controller'
import { deleteMessageForMeController }
  from '../../controllers/message-actions/deleteMessageForMe.controller'
import { unsendMessageController }
  from '../../controllers/message-actions/unsendMessage.controller'

// utils
import generateClientId from '../../features/messages/generateClientId'

/**
 * Returns send / edit / delete action callbacks.
 *
 * @param {Object} deps
 * @param {string} deps.conversationId
 * @param {string} deps.actorId
 * @param {Function} deps.setMessages
 * @param {Function} deps.mergeMessages
 * @param {{ current: Set }} deps.deletedForMeIdsRef
 * @param {{ current: Set }} deps.deletedForMeClientIdsRef
 * @param {Function} deps.getMessages - Returns current messages array.
 */
export default function useMessageActions({
  conversationId,
  actorId,
  setMessages,
  mergeMessages,
  deletedForMeIdsRef,
  deletedForMeClientIdsRef,
  getMessages,
}) {
  // intent queues (optimistic -> replay when DB id exists)
  const pendingDeleteForMeRef = useRef(new Set())
  const pendingUnsendRef = useRef(new Set())

  /* ---- Optimistic helpers ---- */

  const addOptimistic = useCallback(({ body, type, mediaUrl }) => {
    const clientId = generateClientId()

    setMessages((prev) => [
      ...prev,
      {
        id: clientId,
        clientId,
        body,
        type,
        mediaUrl,
        senderActorId: actorId,
        createdAt: new Date().toISOString(),
        __optimistic: true,
      },
    ])

    return clientId
  }, [actorId, setMessages])

  const replaceOptimistic = useCallback((clientId, message) => {
    const shouldDeleteForMe = pendingDeleteForMeRef.current.has(clientId)
    const shouldUnsend = pendingUnsendRef.current.has(clientId)

    pendingDeleteForMeRef.current.delete(clientId)
    pendingUnsendRef.current.delete(clientId)

    if (shouldDeleteForMe) {
      deletedForMeClientIdsRef.current.add(clientId)
      if (message?.id) deletedForMeIdsRef.current.add(message.id)

      deleteMessageForMeController({
        actorId,
        messageId: message.id,
        conversationId,
      })
      return
    }

    if (shouldUnsend) {
      unsendMessageController({
        actorId,
        messageId: message.id,
      })
      return
    }

    mergeMessages([
      {
        ...message,
        id: message.id,
        clientId,
        __optimistic: false,
      },
    ])
  }, [actorId, conversationId, mergeMessages, deletedForMeIdsRef, deletedForMeClientIdsRef])

  const removeOptimistic = useCallback((clientId) => {
    setMessages((prev) => prev.filter((m) => m.id !== clientId))
  }, [setMessages])

  /* ---- Public actions ---- */

  const onSendMessage = useCallback(
    async ({ body = '', type = 'text', mediaUrl = null }) => {
      const trimmed = String(body || '').trim()
      const hasBody = trimmed.length > 0
      const hasMedia = !!mediaUrl

      if (!hasBody && !hasMedia) {
        return { ok: false, error: 'Message is empty.' }
      }

      const clientId = addOptimistic({
        body: hasBody ? trimmed : '',
        type,
        mediaUrl,
      })

      try {
        const { message } = await sendMessageController({
          conversationId,
          actorId,
          body: hasBody ? trimmed : '',
          mediaUrl,
          messageType: type,
          clientId,
        })

        replaceOptimistic(clientId, message)
        return { ok: true, message }
      } catch (err) {
        console.error('[useMessageActions] send failed', err)
        removeOptimistic(clientId)
        return { ok: false, error: err?.message || 'Failed to send message.' }
      }
    },
    [conversationId, actorId, addOptimistic, replaceOptimistic, removeOptimistic]
  )

  const onEditMessage = useCallback(
    async ({ messageId, body }) => {
      const { message } = await editMessageController({
        messageId,
        actorId,
        body,
      })

      mergeMessages([message])
    },
    [actorId, mergeMessages]
  )

  const onDeleteMessage = useCallback(
    async ({ messageId, scope }) => {
      if (!messageId || !scope) return

      const messages = getMessages()
      const msg = messages.find((m) => m.id === messageId)
      if (!msg) return

      // optimistic -> queue + update UI instantly
      if (msg.__optimistic) {
        if (scope === 'me') {
          pendingDeleteForMeRef.current.add(msg.clientId)
          deletedForMeClientIdsRef.current.add(msg.clientId)
          setMessages((prev) => prev.filter((m) => m.id !== messageId))
          return
        }

        if (scope === 'all') {
          pendingUnsendRef.current.add(msg.clientId)
          setMessages((prev) => prev.filter((m) => m.id !== messageId))
          return
        }
      }

      // real message -> execute now
      if (scope === 'me') {
        deletedForMeIdsRef.current.add(msg.id)

        await deleteMessageForMeController({
          actorId,
          messageId: msg.id,
          conversationId,
        })

        setMessages((prev) => prev.filter((m) => m.id !== msg.id))
        return
      }

      if (scope === 'all') {
        await unsendMessageController({
          actorId,
          messageId: msg.id,
        })

        setMessages((prev) =>
          prev.map((m) =>
            m.id === msg.id ? { ...m, isDeleted: true } : m
          )
        )
      }
    },
    [actorId, conversationId, getMessages, setMessages, deletedForMeIdsRef, deletedForMeClientIdsRef]
  )

  return { onSendMessage, onEditMessage, onDeleteMessage }
}
