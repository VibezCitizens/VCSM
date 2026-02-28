// src/features/chat/conversation/screen/ConversationView.jsx
import { useMemo, useRef, useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useIdentity } from '@/state/identity/identityContext'
import { ios } from '@/app/platform'

import useConversation from '@/features/chat/conversation/hooks/conversation/useConversation'
import useConversationMembers from '@/features/chat/conversation/hooks/conversation/useConversationMembers'
import useConversationMessages from '@/features/chat/conversation/hooks/conversation/useConversationMessages'
import useTypingChannel from '@/features/chat/conversation/hooks/realtime/useTypingChannel'
import useReportFlow from '@/features/moderation/hooks/useReportFlow'
import useMediaViewer from '@/features/chat/conversation/hooks/conversation/useMediaViewer'
import useMessageActionsMenu from '@/features/chat/conversation/hooks/conversation/useMessageActionsMenu'
import useConversationActionsMenu from '@/features/chat/conversation/hooks/conversation/useConversationActionsMenu'
import useConversationCover from '@/features/moderation/hooks/useConversationCover'
import useInboxActions from '@/features/chat/inbox/hooks/useInboxActions'
import useInboxEntryForConversation from '@/features/chat/inbox/hooks/useInboxEntryForConversation'

// ✅ add this import
import useSendMessageActions from '@/features/chat/conversation/hooks/conversation/useSendMessageActions'

import ChatHeader from '@/features/chat/conversation/components/ChatHeader'
import MessageList from '@/features/chat/conversation/components/MessageList'
import MessageActionsMenu from '@/features/chat/conversation/components/MessageActionsMenu'
import ConversationActionsMenu from '@/features/chat/conversation/components/ConversationActionsMenu'
import ReportModal from '@/features/moderation/components/ReportModal'
import ChatScreenLayout from '@/features/chat/conversation/layout/ChatScreenLayout'
import ChatSpamCover from '@/features/moderation/components/ChatSpamCover'
import ChatInput from '@/features/chat/conversation/components/ChatInput'
import Spinner from '@/shared/components/Spinner'

import resolvePartnerActor from '@/features/chat/conversation/lib/resolvePartnerActor'
import canReadConversation from '@/features/chat/conversation/permissions/canReadConversation'

// ✅ Toast
import Toast from '@/shared/components/components/Toast'
import '@/features/ui/modern/module-modern.css'

export default function ConversationView({ conversationId }) {
  const navigate = useNavigate()
  const { identity } = useIdentity()
  const actorId = identity?.actorId ?? null
  const messagesRef = useRef(null)

  // ✅ toast state
  const [toast, setToast] = useState('')

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
  const isSpamThread = inboxEntry?.folder === 'spam'

  const partnerActor = useMemo(
    () => resolvePartnerActor({ actorId, conversation, members }),
    [actorId, conversation, members]
  )

  const { viewer, openViewer, closeViewer } = useMediaViewer()
  const { conversationCovered, setConversationCovered, undoConversationCover } =
    useConversationCover({ actorId, conversationId })

  const {
    menu,
    openMenu,
    closeMenu,

    // ✅ copy
    handleCopy,

    // ✅ editing state + handlers
    editing,
    handleEdit,
    handleSaveEdit,
    handleCancelEdit,

    // actions
    handleDeleteForMe,
    handleUnsend,
    handleReportMessage,
  } = useMessageActionsMenu({
    actorId,
    conversationId,
    messages,
    onEditMessage,
    onDeleteMessage,
    reportFlow,
    onToast: (msg) => setToast(msg),
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

  // ✅ This is your real send+attach pipeline (uploads media -> sends message)
  const { handleSend, handleAttach } = useSendMessageActions({
    conversationId,
    actorId,
    onSendMessage,
  })

  // ✅ Now it’s safe to early-return
  if (error) return <div className="p-4 text-red-400">Failed to load</div>
  if (loading || !conversation || !members?.length) {
    return (
      <div className="p-6">
        <Spinner label="Loading conversation..." />
      </div>
    )
  }
  if (!canReadConversation({ actorId, members })) return <div className="p-4 text-neutral-400">Access denied</div>

  // ✅ EDITING IS DRIVEN BY `editing` (not `menu`)
  const isEditing = !!editing
  const editingInitialText = editing?.initialBody ?? ''

  return (
    <div className="chat-screen">
      <ChatScreenLayout
        messagesRef={messagesRef}
        header={
          <ChatHeader
            conversation={conversation}
            partnerActor={partnerActor}
            onBack={() => navigate(-1)}
            onOpenMenu={conversationCovered ? undefined : openConvMenu}
          />
        }
        messages={
          <MessageList
            messages={messages}
            currentActorId={actorId}
            isGroupChat={conversation.isGroup}
            onOpenActions={conversationCovered ? undefined : openMenu}
            onOpenMedia={conversationCovered ? undefined : openViewer}
          />
        }
        footer={null}
      />

      {!conversationCovered && (
        <ChatInput
          onSend={handleSend}
          onAttach={handleAttach}
          onTyping={notifyTyping}

          // ✅ edit wiring
          editing={isEditing}
          initialValue={editingInitialText}
          onSaveEdit={(text) => {
            handleSaveEdit(text)
          }}
          onCancelEdit={() => {
            handleCancelEdit()
          }}
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
        onCopy={handleCopy}
        onEdit={handleEdit} // ✅ starts edit (sets `editing`)
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
        <ChatSpamCover
          onPrimary={() => navigate(isSpamThread ? '/chat/spam' : '/chat')}
          onSecondary={handleUndoSpam}
        />
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

      <Toast open={!!toast} message={toast} onClose={() => setToast('')} />
    </div>
  )
}
