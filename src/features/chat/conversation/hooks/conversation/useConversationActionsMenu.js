// src/features/chat/conversation/hooks/conversation/useConversationActionsMenu.js
import { useCallback, useState } from 'react'
import { markConversationSpam } from '../../controllers/markConversationSpam.controller'

// Backfill (optional)
import { fetchLastMessageForConversationDAL } from '@/features/chat/conversation/dal/read/messages.last.read.dal'
import { updateInboxLastMessage } from '@/features/chat/inbox/dal/inbox.write.dal'

// Folder move (your existing DAL)
import { moveConversationToFolder } from '@/features/chat/inbox/dal/inbox.write.dal'

// (optional) if you want to clear archived_until_new explicitly via existing flags DAL
import { updateInboxFlags } from '@/features/chat/inbox/dal/inbox.write.dal'

export default function useConversationActionsMenu({
  actorId,
  conversationId,
  inboxActions, // can still be passed, but we won't rely on it
  navigate,
  reportFlow,
  setConversationCovered,
  undoConversationCover,
  closeMessageMenu,
}) {
  const [convMenu, setConvMenu] = useState(null)

  const openConvMenu = useCallback((anchorRect) => {
    if (!anchorRect) return
    setConvMenu({ anchorRect })
  }, [])

  const closeConvMenu = useCallback(() => {
    setConvMenu(null)
  }, [])

  const handleReportConversation = useCallback(() => {
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

    closeConvMenu()
  }, [actorId, conversationId, reportFlow, closeConvMenu])

  const handleMarkSpamConversation = useCallback(async () => {
    if (!actorId) return
    if (!conversationId) return

    try {
      await markConversationSpam({
        reporterActorId: actorId,
        conversationId,
        reasonText: null,
      })

      setConversationCovered(true)

      if (typeof closeMessageMenu === 'function') {
        closeMessageMenu()
      }
    } catch (e) {
      console.error('[markConversationSpam] failed', e)
    } finally {
      closeConvMenu()
    }
  }, [actorId, conversationId, setConversationCovered, closeConvMenu, closeMessageMenu])

  /**
   * Optional: backfill last_message pointers ONLY if missing.
   * This does NOT touch archived/folder flags.
   */
  const backfillLastMessagePointerIfNeeded = useCallback(
    async () => {
      if (!actorId || !conversationId) return

      const last = await fetchLastMessageForConversationDAL({ conversationId })
      if (last?.id && last?.created_at) {
        await updateInboxLastMessage({
          actorId,
          conversationId,
          messageId: last.id,
          createdAt: last.created_at,
        })
      }
    },
    [actorId, conversationId]
  )

  const handleArchiveConversation = useCallback(async () => {
    if (!actorId) return
    if (!conversationId) return

    try {
      // Move to archived folder (stays there until user unarchives)
      await moveConversationToFolder({
        actorId,
        conversationId,
        folder: 'archived',
      })

      // Optional backfill if you have legacy null pointers
      // (Safe: does NOT unarchive because we removed auto-unarchive in updateInboxLastMessage)
      // If you didn't remove auto-unarchive yet, DO NOT call this.
      // await backfillLastMessagePointerIfNeeded()

      navigate('/chat/archived')
    } catch (e) {
      console.error('[archiveConversation] failed', e)
    } finally {
      closeConvMenu()
    }
  }, [actorId, conversationId, navigate, closeConvMenu /*, backfillLastMessagePointerIfNeeded */])

  const handleUnarchiveConversation = useCallback(async () => {
    if (!actorId || !conversationId) return

    try {
      // Move back to inbox
      await moveConversationToFolder({
        actorId,
        conversationId,
        folder: 'inbox',
      })

      // Ensure archived_until_new is false (your moveConversationToFolder already does this,
      // but keeping this explicit is fine if other code sets it)
      await updateInboxFlags({
        actorId,
        conversationId,
        flags: { archived_until_new: false },
      })

      // Optional: backfill pointers if legacy nulls
      // await backfillLastMessagePointerIfNeeded()

      navigate('/chat')
    } catch (e) {
      console.error('[unarchiveConversation] failed', e)
    } finally {
      closeConvMenu()
    }
  }, [actorId, conversationId, navigate, closeConvMenu /*, backfillLastMessagePointerIfNeeded */])

  const handleUndoSpam = useCallback(async () => {
    await undoConversationCover()
  }, [undoConversationCover])

  return {
    convMenu,
    openConvMenu,
    closeConvMenu,

    handleArchiveConversation,
    handleUnarchiveConversation,
    handleReportConversation,
    handleMarkSpamConversation,
    handleUndoSpam,
  }
}
