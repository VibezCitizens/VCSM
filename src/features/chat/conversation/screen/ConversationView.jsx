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

export default function ConversationView({ conversationId }) {
  const navigate = useNavigate()
  const { identity } = useIdentity()
  const actorId = identity?.actorId ?? null

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
   Edit state (ConversationView owns edit session)
   ============================================================ */

const [editing, setEditing] = useState(null)
// shape:
// { messageId: string, initialBody: string } | null

 /* ============================================================
   Message action handlers
   ============================================================ */
/* =======================
   Edit
   ======================= */

const handleEdit = useCallback(() => {
  if (!menu?.messageId) return

  const msg = messages.find(m => m.id === menu.messageId)
  if (!msg) return

  // do not allow editing deleted / system messages (safety)
  if (msg.isDeleted || msg.deletedAt) return

  setEditing({
    messageId: msg.id,
    initialBody: msg.body ?? '',
  })

  closeMenu()
}, [menu, messages, closeMenu])

/* =======================
   Save edit
   ======================= */
const handleSaveEdit = useCallback(
  (newBody) => {
    if (!editing) return

    const trimmed = newBody.trim()

    // ⛔ block empty edits
    if (!trimmed) return

    // ⛔ block no-op edits
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

/* =======================
   Cancel edit
   ======================= */
const handleCancelEdit = useCallback(() => {
  setEditing(null)
}, [])

  // ============================================================ */
  /* =======================
   Delete (me)
   ======================= */

  const handleDeleteForMe = useCallback(() => {
    if (!menu?.messageId) return
    onDeleteMessage({
      messageId: menu.messageId,
      scope: 'me',
    })
    closeMenu()
  }, [menu, onDeleteMessage, closeMenu])


    // ============================================================ */
/* =======================
   Unsend (all)
   ======================= */

  const handleUnsend = useCallback(() => {
    if (!menu?.messageId) return
    onDeleteMessage({
      messageId: menu.messageId,
      scope: 'all',
    })
    closeMenu()
  }, [menu, onDeleteMessage, closeMenu])

    // ============================================================ */
/* =======================
   Send
   ======================= */
  
   const handleSend = useCallback(
    (text) => {
      onSendMessage({ body: text, type: 'text' })
    },
    [onSendMessage]
  )

  /* ============================================================
     Guards (AFTER all hooks — SAFE)
     ============================================================ */

  if (error) {
    return <div className="p-4 text-red-400">Failed to load</div>
  }

  if (loading || !conversation) {
    return <div className="p-4">Loading…</div>
  }

  if (!Array.isArray(members) || members.length === 0) {
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
    <div
      className="flex flex-col bg-black text-white"
      style={{ height: '100dvh' }}
    >

     

      {/* HEADER */}
      <ChatHeader
        conversation={conversation}
        partnerActor={partnerActorUi}
        onBack={() => navigate(-1)}
      />


      {/* MESSAGE LIST */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        <MessageList
          messages={messages}
          currentActorId={actorId}
          isGroupChat={conversation.isGroup}
          onOpenActions={openMenu}
        />
      </div>

      {/* FOOTER */}
      <div
        className="
          flex-shrink-0
          border-t border-white/10
          bg-black
        "
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        {typingActors.length > 0 && (
          <div className="px-3 py-1">
            <TypingIndicator actors={typingActors} />
          </div>
        )}

        <ChatInput
          disabled={!allowSend}
          onSend={handleSend}
          onTyping={notifyTyping}
      /* 🧠 EDIT MODE WIRING */
  editing={!!editing}
  initialValue={editing?.initialBody ?? ''}
  onSaveEdit={handleSaveEdit}
  onCancelEdit={handleCancelEdit}
/>
      </div>

      {/* MESSAGE ACTIONS MENU */}
      <MessageActionsMenu
        open={!!menu}
        anchorRect={menu?.anchorRect}
        isOwn={menu?.isOwn}
        onClose={closeMenu}
        onEdit={handleEdit}
        onDeleteForMe={handleDeleteForMe}
        onUnsend={handleUnsend}
      />
    </div>
  )
}
