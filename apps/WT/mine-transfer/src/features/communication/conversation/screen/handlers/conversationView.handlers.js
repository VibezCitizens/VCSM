// src/features/chat/conversation/screen/handlers/conversationView.handlers.js
// ============================================================
// ConversationView Handlers (STATELESS)
// ------------------------------------------------------------
// - Pure functions only (no React, no hooks, no state)
// - Creates handler callbacks from injected dependencies
// - Intended to keep ConversationView.jsx ultra-thin (optional)
// ============================================================

import { markConversationSpam } from '../../controllers/markConversationSpam.controller'

export function createConversationViewHandlers({
  actorId,
  conversationId,

  // messaging
  messages,
  onSendMessage,
  onEditMessage,
  onDeleteMessage,

  // reporting
  reportFlow,

  // cover actions (from useConversationCover)
  setConversationCovered,
  undoConversationCover,

  // menus / local UI
  closeMenu,
  closeConvMenu,

  // archive
  inboxActions,
  navigate,

  // media viewer
  setViewer,

  // attach upload
  uploadToCloudflare,
}) {
  return {
    // ============================
    // Media viewer
    // ============================
    openViewer(media) {
      if (!media?.url) return
      setViewer(media)
    },

    closeViewer() {
      setViewer(null)
    },

    // ============================
    // Conversation header actions
    // ============================
    reportConversation() {
      if (!actorId) return
      if (!conversationId) return

      reportFlow.start({
        objectType: 'conversation',
        objectId: conversationId,
        conversationId,
        dedupeKey: `report:conversation:${conversationId}`,
        title: 'Report conversation',
        subtitle: 'Tell us what’s wrong with this conversation.',
      })

      if (typeof closeConvMenu === 'function') closeConvMenu()
    },

    async markSpamConversation() {
      if (!actorId) return
      if (!conversationId) return

      try {
        await markConversationSpam({
          reporterActorId: actorId,
          conversationId,
          reasonText: null,
        })

        setConversationCovered(true)
        if (typeof closeMenu === 'function') closeMenu()
      } catch (e) {
        console.error('[markConversationSpam] failed', e)
      } finally {
        if (typeof closeConvMenu === 'function') closeConvMenu()
      }
    },

    async archiveConversation() {
      if (!actorId) return
      if (!conversationId) return

      try {
        await inboxActions.archive(conversationId)
        navigate('/chat/archived')
      } catch (e) {
        console.error('[archiveConversation] failed', e)
      } finally {
        if (typeof closeConvMenu === 'function') closeConvMenu()
      }
    },

    async undoSpamConversation() {
      await undoConversationCover()
    },

    // ============================
    // Message bubble actions
    // ============================
    startEdit(menu) {
      if (!menu?.messageId) return null

      const msg = messages.find((m) => m.id === menu.messageId)
      if (!msg || msg.isDeleted || msg.deletedAt) return null

      if (typeof closeMenu === 'function') closeMenu()

      return {
        messageId: msg.id,
        initialBody: msg.body ?? '',
      }
    },

    saveEdit(editing, newBody, setEditing) {
      if (!editing) return

      const trimmed = (newBody ?? '').trim()
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

    cancelEdit(setEditing) {
      setEditing(null)
    },

    deleteForMe(menu) {
      if (!menu?.messageId) return

      onDeleteMessage({
        messageId: menu.messageId,
        scope: 'me',
      })

      if (typeof closeMenu === 'function') closeMenu()
    },

    unsend(menu) {
      if (!menu?.messageId) return

      onDeleteMessage({
        messageId: menu.messageId,
        scope: 'all',
      })

      if (typeof closeMenu === 'function') closeMenu()
    },

    reportMessage(menu) {
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

      if (typeof closeMenu === 'function') closeMenu()
    },

    // ============================
    // Send / attach
    // ============================
    sendText(text) {
      onSendMessage({ body: text, type: 'text' })
    },

    async attachImages(files) {
      if (!files || files.length === 0) return
      const file = files[0]
      if (!file) return

      if (!String(file.type || '').startsWith('image/')) return

      const safeName = String(file.name || 'image').replace(/[^\w.-]+/g, '_')
      const key = `chat/${conversationId}/${actorId}/${Date.now()}-${safeName}`

      const { url, error: upErr } = await uploadToCloudflare(file, key)

      if (upErr || !url) {
        console.error('upload failed:', upErr)
        return
      }

      onSendMessage({
        type: 'image',
        body: '',
        mediaUrl: url,
      })
    },
  }
}
