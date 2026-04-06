// src/features/chat/conversation/hooks/conversation/useMessageActionsMenu.js
// ============================================================
// useMessageActionsMenu
// ------------------------------------------------------------
// - View-local state for the message bubble actions menu
// - Owns: menu state + edit state + delete/unsend + report message
// - NO supabase
// - NO routing
// ============================================================

import { useCallback, useState } from 'react'
import { copyToClipboard } from '@/shared/lib/clipboard'

export default function useMessageActionsMenu({
  actorId,
  conversationId,
  messages,
  onEditMessage,
  onDeleteMessage,
  reportFlow,
  onToast, // ✅ add
}) {
  /* ============================================================
     Message action menu state (bubble menu)
     ============================================================ */
  const [menu, setMenu] = useState(null)

  const openMenu = useCallback(
    ({ messageId, senderActorId, anchorRect }) => {
      const msg = messages?.find?.((m) => m.id === messageId)
      const body = msg?.body ?? ''

      setMenu({
        messageId,
        isOwn: senderActorId === actorId,
        senderActorId,
        anchorRect,
        body, // ✅ store body so we can copy without hunting later
      })
    },
    [actorId, messages]
  )

  const closeMenu = useCallback(() => {
    setMenu(null)
  }, [])

  /* ============================================================
     Edit state
     ============================================================ */
  const [editing, setEditing] = useState(null)

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
     Copy handler
     ============================================================ */
  const handleCopy = useCallback(async () => {
    const text = menu?.body ?? ''
    if (!text) {
      closeMenu()
      return
    }

    const res = await copyToClipboard(text)
    if (res?.ok) {
      onToast?.('Copied') // ✅ show toast
      navigator.vibrate?.(15) // ✅ optional haptic (safe if unsupported)
    }

    closeMenu()
  }, [menu, closeMenu, onToast])

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
     Report handler (from message bubble menu)
     ============================================================ */
  const handleReportMessage = useCallback(() => {
    if (!menu?.messageId) return
    if (!menu?.senderActorId) return
    if (!actorId) return

    reportFlow.start({
      objectType: 'message',
      objectId: menu.messageId,
      conversationId,
      messageId: menu.messageId,
      dedupeKey: `report:message:${menu.messageId}`,
      title: 'Report message',
      subtitle: 'Tell us what’s wrong with this message.',
    })

    closeMenu()
  }, [menu, actorId, conversationId, reportFlow, closeMenu])

  return {
    // menu
    menu,
    openMenu,
    closeMenu,

    // editing
    editing,
    setEditing,
    handleEdit,
    handleSaveEdit,
    handleCancelEdit,

    // actions
    handleCopy,
    handleDeleteForMe,
    handleUnsend,
    handleReportMessage,
  }
}
