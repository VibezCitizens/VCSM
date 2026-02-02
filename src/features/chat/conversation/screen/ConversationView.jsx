// src/features/chat/conversation/screen/ConversationView.jsx
import { useMemo, useRef, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useIdentity } from '@/state/identity/identityContext'
import { ios } from '@/app/platform'

import useConversation from '../hooks/conversation/useConversation'
import useConversationMembers from '../hooks/conversation/useConversationMembers'
import useConversationMessages from '../hooks/conversation/useConversationMessages'
import useTypingChannel from '../hooks/realtime/useTypingChannel'
import useReportFlow from '@/features/moderation/hooks/useReportFlow'
import useMediaViewer from '../hooks/conversation/useMediaViewer'
import useMessageActionsMenu from '../hooks/conversation/useMessageActionsMenu'
import useConversationActionsMenu from '../hooks/conversation/useConversationActionsMenu'
import useConversationCover from '@/features/moderation/hooks/useConversationCover'
import useInboxActions from '@/features/chat/inbox/hooks/useInboxActions'
import useInboxEntryForConversation from '@/features/chat/inbox/hooks/useInboxEntryForConversation'

// ✅ add this import
import useSendMessageActions from '../hooks/conversation/useSendMessageActions'

import ChatHeader from '../components/ChatHeader'
import MessageList from '../components/MessageList'
import MessageActionsMenu from '../components/MessageActionsMenu'
import ConversationActionsMenu from '../components/ConversationActionsMenu'
import ReportModal from '@/features/moderation/components/ReportModal'
import ChatScreenLayout from '../layout/ChatScreenLayout'
import ChatSpamCover from '@/features/moderation/components/ChatSpamCover'
import ChatInput from '../components/ChatInput'

import resolvePartnerActor from '../lib/resolvePartnerActor'
import canReadConversation from '../permissions/canReadConversation'

export default function ConversationView({ conversationId }) {
  const navigate = useNavigate()
  const { identity } = useIdentity()
  const actorId = identity?.actorId ?? null
  const messagesRef = useRef(null)

  ios.useIOSPlatform({ enableKeyboard: true })
  ios.useIOSKeyboard(true)

  const { conversation, loading, error } = useConversation({ conversationId, actorId })
  const { members } = useConversationMembers({ conversationId, actorId })
  const { messages, onEditMessage, onDeleteMessage, onSendMessage } =
    useConversationMessages({ conversationId, actorId })
  const { notifyTyping } = useTypingChannel({ conversationId, actorId })

  const reportFlow = useReportFlow({ reporterActorId: actorId })
  const inboxActions = useInboxActions({ actorId })
  const { entry: inboxEntry } = useInboxEntryForConversation({ actorId, conversationId })
  const isArchived = inboxEntry?.folder === 'archived' || inboxEntry?.archived === true

  const partnerActor = useMemo(
    () => resolvePartnerActor({ actorId, conversation, members }),
    [actorId, conversation, members]
  )

  const { viewer, openViewer, closeViewer } = useMediaViewer()
  const { conversationCovered, setConversationCovered, undoConversationCover } =
    useConversationCover({ actorId, conversationId })

  const { menu, openMenu, closeMenu, handleEdit, handleDeleteForMe, handleUnsend, handleReportMessage } =
    useMessageActionsMenu({
      actorId,
      conversationId,
      messages,
      onEditMessage,
      onDeleteMessage,
      reportFlow,
    })

  const {
    convMenu,
    openConvMenu,
    closeConvMenu,
    handleArchiveConversation,
    handleUnarchiveConversation,
    handleReportConversation,
    handleMarkSpamConversation,
    handleUndoSpam,
  } = useConversationActionsMenu({
    actorId,
    conversationId,
    inboxActions,
    navigate,
    reportFlow,
    setConversationCovered,
    undoConversationCover,
    closeMessageMenu: closeMenu,
  })

  const scrollToBottom = useCallback((behavior = 'auto') => {
    messagesRef.current?.scrollTo({ top: messagesRef.current.scrollHeight, behavior })
  }, [])

  useEffect(() => {
    requestAnimationFrame(() => scrollToBottom('auto'))
  }, [messages?.length, scrollToBottom])

  // ✅ IMPORTANT: declare adapters/hooks BEFORE early returns (hook order rule)

  // ✅ This is your real send+attach pipeline (uploads media -> sends message)
  const { handleSend, handleAttach } = useSendMessageActions({
    conversationId,
    actorId,
    onSendMessage,
  })

  // ✅ Now it’s safe to early-return
  if (error) return <div className="p-4 text-red-400">Failed to load</div>
  if (loading || !conversation || !members?.length) return <div className="p-4">Loading…</div>
  if (!canReadConversation({ actorId, members })) return <div className="p-4 text-neutral-400">Access denied</div>

  const isEditing = menu?.type === 'edit'
  const editingMessage = isEditing ? menu.message : null

  return (
    <div className="chat-screen">
      <ChatScreenLayout
        header={
          <ChatHeader
            conversation={conversation}
            partnerActor={partnerActor}
            onBack={() => navigate(-1)}
            onOpenMenu={conversationCovered ? undefined : openConvMenu}
          />
        }
        messages={
          <div ref={messagesRef} className="chat-messages">
            <MessageList
              messages={messages}
              currentActorId={actorId}
              isGroupChat={conversation.isGroup}
              onOpenActions={conversationCovered ? undefined : openMenu}
              onOpenMedia={conversationCovered ? undefined : openViewer}
            />
          </div>
        }
        footer={null}
      />

      {!conversationCovered && (
        <ChatInput
          onSend={handleSend}          // ✅ text works
          onAttach={handleAttach}      // ✅ photos now upload + send
          onTyping={notifyTyping}
          editing={isEditing}
          initialValue={editingMessage?.body ?? ''}
          onSaveEdit={(text) => {
            handleEdit(editingMessage, text)
            closeMenu()
          }}
          onCancelEdit={closeMenu}
        />
      )}

      <ConversationActionsMenu
        open={!!convMenu}
        anchorRect={convMenu?.anchorRect}
        onClose={closeConvMenu}
        onArchiveConversation={isArchived ? undefined : handleArchiveConversation}
        onUnarchiveConversation={isArchived ? handleUnarchiveConversation : undefined}
        onReportConversation={handleReportConversation}
        onMarkSpam={handleMarkSpamConversation}
      />

      <MessageActionsMenu
        open={!!menu}
        anchorRect={menu?.anchorRect}
        isOwn={menu?.isOwn}
        onClose={closeMenu}
        onEdit={handleEdit}
        onDeleteForMe={handleDeleteForMe}
        onUnsend={handleUnsend}
        onReport={handleReportMessage}
      />

      <ReportModal
        open={reportFlow.open}
        title={reportFlow.context?.title ?? 'Report'}
        loading={reportFlow.loading}
        onClose={reportFlow.close}
        onSubmit={reportFlow.submit}
      />

      {conversationCovered && (
        <ChatSpamCover onPrimary={() => navigate('/chat')} onSecondary={handleUndoSpam} />
      )}

      {viewer && (
        <div
          className="fixed inset-0 z-[9999] bg-black/95 flex items-center justify-center"
          onClick={closeViewer}
        >
          <button className="absolute top-4 right-4 text-white text-2xl">✕</button>
          {viewer.type === 'image' ? (
            <img src={viewer.url} className="max-w-full max-h-full object-contain" />
          ) : (
            <video src={viewer.url} controls className="max-w-full max-h-full object-contain" />
          )}
        </div>
      )}
    </div>
  )
}
