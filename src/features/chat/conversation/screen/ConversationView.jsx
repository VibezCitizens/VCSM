// src/features/chat/conversation/screen/ConversationView.jsx (R)
// ============================================================
// ConversationView
// ------------------------------------------------------------
// - Composition / orchestration layer
// - Owns hooks, permissions, UI composition
// - NO routing
// - NO redirects
// ============================================================

import { useMemo, useCallback, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

import { useIdentity } from '@/state/identity/identityContext'

// ✅ iOS platform (chat-only)
import { ios } from '@/app/platform'

import { uploadToCloudflare } from '@/services/cloudflare/uploadToCloudflare'

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
  const { conversation, loading, error } = useConversation({ conversationId, actorId })

  const { members } = useConversationMembers({ conversationId, actorId })

  const { messages, onSendMessage, onEditMessage, onDeleteMessage } =
    useConversationMessages({ conversationId, actorId })

  const { typingActors, notifyTyping } = useTypingChannel({ conversationId, actorId })

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

  const partnerActorUi = useMemo(() => partnerActor ?? null, [partnerActor])

  /* ============================================================
     Media viewer state (FULLSCREEN)
     ============================================================ */
  const [viewer, setViewer] = useState(null)
  // viewer = { url, type } | null

  const openViewer = useCallback((media) => {
    if (!media?.url) return
    setViewer(media)
  }, [])

  const closeViewer = useCallback(() => {
    setViewer(null)
  }, [])

  // lock background scroll while viewer is open (iOS friendly)
  useEffect(() => {
    if (!viewer) return

    const html = document.documentElement
    const prevOverflow = html.style.overflow
    html.style.overflow = 'hidden'

    return () => {
      html.style.overflow = prevOverflow
    }
  }, [viewer])

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

    const msg = messages.find((m) => m.id === menu.messageId)
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

  const handleAttach = useCallback(
    async (files) => {
      if (!files || files.length === 0) return
      const file = files[0]
      if (!file) return

      if (!String(file.type || '').startsWith('image/')) return

      const safeName = String(file.name || 'image').replace(/[^\w.\-]+/g, '_')
      const key = `chat/${conversationId}/${actorId}/${Date.now()}-${safeName}`

      const { url, error } = await uploadToCloudflare(file, key)

      if (error || !url) {
        console.error('upload failed:', error)
        return
      }

      onSendMessage({
        type: 'image',
        body: '',
        mediaUrl: url,
      })
    },
    [conversationId, actorId, onSendMessage]
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

  const allowSend = canSendMessage({ actorId, conversation, members })

  /* ============================================================
     Render
     ============================================================ */
  return (
    <>
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
            onOpenMedia={openViewer} // ✅ FULLSCREEN MEDIA
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
              onAttach={handleAttach}
              onTyping={notifyTyping}
              editing={!!editing}
              initialValue={editing?.initialBody ?? ''}
              onSaveEdit={handleSaveEdit}
              onCancelEdit={handleCancelEdit}
            />
          </>
        }
      />

      {/* ✅ MESSAGE ACTIONS MENU (FIX) */}
      <MessageActionsMenu
        open={!!menu}
        anchorRect={menu?.anchorRect}
        isOwn={menu?.isOwn}
        onClose={closeMenu}
        onEdit={handleEdit}
        onDeleteForMe={handleDeleteForMe}
        onUnsend={handleUnsend}
      />

      {/* ✅ FULLSCREEN MEDIA VIEWER */}
      {viewer && (
        <div
          className="fixed inset-0 z-[9999] bg-black/95 flex items-center justify-center"
          onClick={closeViewer}
        >
          <button
            type="button"
            onClick={closeViewer}
            className="absolute top-4 right-4 text-white text-2xl"
            aria-label="Close"
          >
            ✕
          </button>

          {viewer.type === 'image' && (
            <img
              src={viewer.url}
              alt=""
              className="max-w-[100vw] max-h-[100vh] object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          )}

          {viewer.type === 'video' && (
            <video
              src={viewer.url}
              controls
              className="max-w-[100vw] max-h-[100vh] object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          )}
        </div>
      )}
    </>
  )
}
