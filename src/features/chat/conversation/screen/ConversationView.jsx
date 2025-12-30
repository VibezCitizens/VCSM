// src/features/chat/conversation/screen/ConversationView.jsx (R)
// ============================================================
// ConversationView
// ------------------------------------------------------------
// - Composition / orchestration layer
// - Owns hooks, permissions, UI composition
// - NO routing
// - NO redirects
// ============================================================

import { useMemo, useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { useIdentity } from '@/state/identity/identityContext'

// ✅ iOS platform (chat-only)
import { ios } from '@/app/platform'

// hooks
import useConversation from '../hooks/conversation/useConversation'
import useConversationMembers from '../hooks/conversation/useConversationMembers'
import useConversationMessages from '../hooks/conversation/useConversationMessages'
import useTypingChannel from '../hooks/realtime/useTypingChannel'

// ui
import ChatHeader from '../components/ChatHeader'
import MessageList from '../components/MessageList'
import ChatInput from '../components/ChatInput'
import TypingIndicator from '../components/TypingIndicator'
import MessageActionsMenu from '../components/MessageActionsMenu'

// domain helpers
import resolvePartnerActor from '../lib/resolvePartnerActor'
import canReadConversation from '../permissions/canReadConversation'
import canSendMessage from '../permissions/canSendMessage'
import ChatScreenLayout from '../layout/ChatScreenLayout'
export default function ConversationView({ conversationId }) {
  const navigate = useNavigate()
  const { identity } = useIdentity()
  const actorId = identity?.actorId ?? null




  /* ============================================================
     iOS PLATFORM (CHAT ONLY)
     ============================================================ */

  ios.useIOSPlatform({ enableKeyboard: true })
  ios.useIOSKeyboard(true)

  /* ============================================================
     Core hooks (ALL hooks must run unconditionally)
     ============================================================ */

  const {
    conversation,
    loading,
    error,
  } = useConversation({ conversationId, actorId })

  const {
    members,
  } = useConversationMembers({ conversationId, actorId })

  const {
    messages,
    onSendMessage,
    onEditMessage,
    onDeleteMessage,
  } = useConversationMessages({ conversationId, actorId })

  const {
    typingActors,
    notifyTyping,
  } = useTypingChannel({ conversationId, actorId })

  /* ============================================================
     Derived data
     ============================================================ */

  const partnerActor = useMemo(
    () =>
      resolvePartnerActor({
        actorId,
        conversation,
        members,
      }),
    [actorId, conversation, members]
  )

  const partnerActorUi = useMemo(
    () => partnerActor ?? null,
    [partnerActor]
  )

  /* ============================================================
     Message action menu state
     ============================================================ */

  const [menu, setMenu] = useState(null)

  const openMenu = useCallback(
    ({ messageId, senderActorId, anchorRect }) => {
      setMenu({
        messageId,
        isOwn: senderActorId === actorId,
        anchorRect,
      })
    },
    [actorId]
  )

  const closeMenu = useCallback(() => {
    setMenu(null)
  }, [])

  /* ============================================================
     Edit state
     ============================================================ */

  const [editing, setEditing] = useState(null)
  // { messageId, initialBody } | null

  const handleEdit = useCallback(() => {
    if (!menu?.messageId) return

    const msg = messages.find(m => m.id === menu.messageId)
    if (!msg || msg.isDeleted || msg.deletedAt) return

    setEditing({
      messageId: msg.id,
      initialBody: msg.body ?? '',
    })

    closeMenu()
  }, [menu, messages, closeMenu])

  const handleSaveEdit = useCallback(
    (newBody) => {
      if (!editing) return

      const trimmed = newBody.trim()
      if (!trimmed) return

      if (trimmed === editing.initialBody) {
        setEditing(null)
        return
      }

      onEditMessage({
        messageId: editing.messageId,
        body: trimmed,
      })

      setEditing(null)
    },
    [editing, onEditMessage]
  )

  const handleCancelEdit = useCallback(() => {
    setEditing(null)
  }, [])

  /* ============================================================
     Delete handlers
     ============================================================ */

  const handleDeleteForMe = useCallback(() => {
    if (!menu?.messageId) return

    onDeleteMessage({
      messageId: menu.messageId,
      scope: 'me',
    })

    closeMenu()
  }, [menu, onDeleteMessage, closeMenu])

  const handleUnsend = useCallback(() => {
    if (!menu?.messageId) return

    onDeleteMessage({
      messageId: menu.messageId,
      scope: 'all',
    })

    closeMenu()
  }, [menu, onDeleteMessage, closeMenu])

  /* ============================================================
     Send
     ============================================================ */

  const handleSend = useCallback(
    (text) => {
      onSendMessage({ body: text, type: 'text' })
    },
    [onSendMessage]
  )

  /* ============================================================
     Guards
     ============================================================ */

  if (error) {
    return <div className="p-4 text-red-400">Failed to load</div>
  }

  if (loading || !conversation || !members?.length) {
    return <div className="p-4">Loading…</div>
  }

  if (!canReadConversation({ actorId, members })) {
    return <div className="p-4 text-neutral-400">Access denied</div>
  }

  const allowSend =
    canSendMessage({ actorId, conversation, members })

  /* ============================================================
     Render
     ============================================================ */
return (
  <ChatScreenLayout
    header={
      <ChatHeader
        conversation={conversation}
        partnerActor={partnerActorUi}
        onBack={() => navigate(-1)}
      />
    }
    messages={
      <MessageList
        messages={messages}
        currentActorId={actorId}
        isGroupChat={conversation.isGroup}
        onOpenActions={openMenu}
      />
    }
    footer={
      <>
        {typingActors.length > 0 && (
          <div className="px-3 py-1">
            <TypingIndicator actors={typingActors} />
          </div>
        )}

        <ChatInput
          disabled={!allowSend}
          onSend={handleSend}
          onTyping={notifyTyping}
          editing={!!editing}
          initialValue={editing?.initialBody ?? ''}
          onSaveEdit={handleSaveEdit}
          onCancelEdit={handleCancelEdit}
        />
      </>
    }
  />
)


}
