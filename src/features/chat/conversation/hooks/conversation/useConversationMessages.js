// src/features/chat/conversation/hooks/conversation/useConversationMessages.js
// ============================================================
// useConversationMessages DELLL
// ============================================================

import { useCallback, useEffect, useState, useRef } from 'react'

// controllers
import { getConversationMessagesController }
  from '../../controllers/getConversationMessages.controller'
import { sendMessageController }
  from '../../controllers/sendMessage.controller'
import { editMessageController }
  from '../../controllers/message-actions/editMessage.controller'

// delete / unsend actions
import { deleteMessageForMeController }
  from '../../controllers/message-actions/deleteMessageForMe.controller'
import { unsendMessageController }
  from '../../controllers/message-actions/unsendMessage.controller'

// realtime
import { subscribeToConversation }
  from '../../realtime/subscribeToConversation'

// model
import { MessageModel } from '../../model/Message.model'

// utils
import generateClientId from '../../features/messages/generateClientId'

export default function useConversationMessages({
  conversationId,
  actorId,
  pageSize = 50,
}) {
  /* ============================================================
     State
     ============================================================ */

  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)

  // ✅ intent queues (optimistic -> replay when DB id exists)
  const pendingDeleteForMeRef = useRef(new Set()) // clientId set
  const pendingUnsendRef = useRef(new Set())      // clientId set

  // ✅ local tombstones (prevents resurrection on refetch/realtime)
  const deletedForMeIdsRef = useRef(new Set())    // messageId set
  const deletedForMeClientIdsRef = useRef(new Set()) // clientId set (optimistic)

  /* ============================================================
     Deterministic merge helper (ID-first, tombstone-safe)
     ============================================================ */
  const mergeMessages = useCallback((incoming = []) => {
    setMessages((prev) => {
      const byId = new Map()
      const byClientId = new Map()

      // index existing messages
      for (const msg of prev) {
        // keep existing list, but note: we also block resurrection via tombstones below
        if (msg.id) byId.set(msg.id, msg)
        if (msg.clientId) byClientId.set(msg.clientId, msg)
      }

      for (const msg of incoming) {
        // ⛔ skip anything deleted-for-me locally
        if (msg?.id && deletedForMeIdsRef.current.has(msg.id)) {
          continue
        }
        if (msg?.clientId && deletedForMeClientIdsRef.current.has(msg.clientId)) {
          continue
        }

        const existing = msg.id ? byId.get(msg.id) : null

        // 🪦 TOMBSTONE GUARD — once unsent/deleted-for-all, never resurrect
        if (existing?.isDeleted && !msg.deletedAt) {
          continue
        }

        // ✅ UPDATE / EDIT / UNSEND — replace by DB id
        if (msg.id && byId.has(msg.id)) {
          byId.set(msg.id, { ...existing, ...msg })
          continue
        }

        // 🔁 OPTIMISTIC → SERVER RECONCILIATION
        if (msg.clientId && byClientId.has(msg.clientId)) {
          const optimistic = byClientId.get(msg.clientId)

          // ⛔ if optimistic was deleted-for-me, don't re-add on reconciliation
          if (deletedForMeClientIdsRef.current.has(msg.clientId)) {
            // cleanup optimistic entry from maps
            byClientId.delete(msg.clientId)
            if (optimistic?.id) byId.delete(optimistic.id)
            // also tombstone real id so future fetches won't resurrect it
            if (msg.id) deletedForMeIdsRef.current.add(msg.id)
            continue
          }

          byClientId.delete(msg.clientId)
          if (optimistic.id) byId.delete(optimistic.id)
          byId.set(msg.id, msg)
          continue
        }

        // 🆕 brand-new message
        byId.set(msg.id ?? msg.clientId, msg)
      }

      return Array.from(byId.values()).sort(
        (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
      )
    })
  }, [])

  /* ============================================================
     Initial load (actor-aware)
     ============================================================ */
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

  /* ============================================================
     Optimistic send lifecycle
     ============================================================ */

  const addOptimistic = ({ body, type, mediaUrl }) => {
  const clientId = generateClientId()

  setMessages((prev) => [
    ...prev,
    {
      id: clientId,
      clientId,
      body,
      type,
      mediaUrl, // ✅ add
      senderActorId: actorId,
      createdAt: new Date().toISOString(),
      __optimistic: true,
    },
  ])

  return clientId
}


  const replaceOptimistic = (clientId, message) => {
    const shouldDeleteForMe = pendingDeleteForMeRef.current.has(clientId)
    const shouldUnsend = pendingUnsendRef.current.has(clientId)

    // cleanup intent queues
    pendingDeleteForMeRef.current.delete(clientId)
    pendingUnsendRef.current.delete(clientId)

    // 🔁 replay intents now that DB message.id exists
    if (shouldDeleteForMe) {
      // tombstone so it can’t resurrect
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

    // normal: replace optimistic with real server message
    mergeMessages([
      {
        ...message,
        id: message.id,     // ✅ DB id
        clientId,
        __optimistic: false,
      },
    ])
  }

  const removeOptimistic = (clientId) => {
    setMessages((prev) => prev.filter((m) => m.id !== clientId))
  }

  /* ============================================================
     Intent API
     ============================================================ */

  const onSendMessage = useCallback(
  async ({ body = '', type = 'text', mediaUrl = null }) => {
    const trimmed = String(body || '').trim()

    // ✅ allow media-only messages
    const hasBody = trimmed.length > 0
    const hasMedia = !!mediaUrl

    if (!hasBody && !hasMedia) return

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
        mediaUrl,          // ✅ pass through
        messageType: type,
        clientId,
      })

      replaceOptimistic(clientId, message)
    } catch (err) {
      console.error('[useConversationMessages] send failed', err)
      removeOptimistic(clientId)
    }
  },
  [conversationId, actorId]
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

      const msg = messages.find((m) => m.id === messageId)
      if (!msg) return

      // 🧠 optimistic -> queue + update UI instantly
      if (msg.__optimistic) {
        if (scope === 'me') {
          pendingDeleteForMeRef.current.add(msg.clientId)

          // tombstone optimistic identity
          deletedForMeClientIdsRef.current.add(msg.clientId)

          // hide immediately
          setMessages((prev) => prev.filter((m) => m.id !== messageId))
          return
        }

        if (scope === 'all') {
          pendingUnsendRef.current.add(msg.clientId)

          setMessages((prev) => prev.filter((m) => m.id !== messageId))
          return
        }
      }

      // ✅ real message -> execute now
      if (scope === 'me') {
        // tombstone real id so it can’t resurrect on refetch/realtime
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
    [messages, actorId, conversationId]
  )

  /* ============================================================
     Realtime: message inserts ONLY
     ============================================================ */
  useEffect(() => {
    if (!conversationId || !actorId) return

    return subscribeToConversation({
      conversationId,
      actorId,
      onMessageInserted: (raw) => {
        const message = MessageModel(raw)
        if (!message) return

        // ⛔ ignore messages deleted-for-me locally
        if (message?.id && deletedForMeIdsRef.current.has(message.id)) return
        if (message?.clientId && deletedForMeClientIdsRef.current.has(message.clientId)) return

        setMessages((prev) => {
          // 🔁 Reconcile optimistic message via clientId
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

          // 🆕 Truly new message
          return [...prev, message].sort(
            (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
          )
        })
      },
    })
  }, [conversationId, actorId])

  /* ============================================================
     Mount / conversation switch
     ============================================================ */
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