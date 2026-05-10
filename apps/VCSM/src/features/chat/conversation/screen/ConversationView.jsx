// src/features/chat/conversation/screen/ConversationView.jsx
import { useMemo, useRef, useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useIdentity } from '@/features/identity/adapters/identity.adapter'
import { ios } from '@/app/platform'

import useConversation from '@/features/chat/conversation/hooks/conversation/useConversation'
import useConversationMembers from '@/features/chat/conversation/hooks/conversation/useConversationMembers'
import useConversationMessages from '@/features/chat/conversation/hooks/conversation/useConversationMessages'
import useTypingChannel from '@/features/chat/conversation/hooks/realtime/useTypingChannel'
import useReportFlow from '@/features/moderation/adapters/hooks/useReportFlow.adapter'
import useMediaViewer from '@/features/chat/conversation/hooks/conversation/useMediaViewer'
import useMessageActionsMenu from '@/features/chat/conversation/hooks/conversation/useMessageActionsMenu'
import useConversationActionsMenu from '@/features/chat/conversation/hooks/conversation/useConversationActionsMenu'
import useConversationCover from '@/features/moderation/adapters/hooks/useConversationCover.adapter'
import useInboxActions from '@/features/chat/inbox/hooks/useInboxActions'
import useInboxEntryForConversation from '@/features/chat/inbox/hooks/useInboxEntryForConversation'
import { useMarkChatRead } from '@/features/chat/inbox/hooks/useMarkChatRead'
import useSendMessageActions from '@/features/chat/conversation/hooks/conversation/useSendMessageActions'

import ChatHeader from '@/features/chat/conversation/components/ChatHeader'
import MessageList from '@/features/chat/conversation/components/MessageList'
import MessageActionsMenu from '@/features/chat/conversation/components/MessageActionsMenu'
import ConversationActionsMenu from '@/features/chat/conversation/components/ConversationActionsMenu'
import ReportModal from '@/features/moderation/adapters/components/ReportModal.adapter'
import ChatScreenLayout from '@/features/chat/conversation/layout/ChatScreenLayout'
import ChatSpamCover from '@/features/moderation/adapters/components/ChatSpamCover.adapter'
import ChatInput from '@/features/chat/conversation/components/ChatInput'
import Spinner from '@/shared/components/Spinner'

import { useConversationScroll } from '@/features/chat/conversation/hooks/conversation/useConversationScroll'
import resolvePartnerActor from '@/features/chat/conversation/lib/resolvePartnerActor'
import canReadConversation from '@/features/chat/conversation/permissions/canReadConversation'
import { useBlockStatus } from '@/features/block/adapters/hooks/useBlockStatus.adapter'
import { chatNavDbg } from '@/features/chat/debug/chatNavDebugger'

import Toast from '@/shared/components/components/Toast'
import '@/features/ui/modern/module-modern.css'

const DEV = import.meta.env?.DEV

export default function ConversationView({ conversationId }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { identity } = useIdentity()
  const actorId = identity?.actorId ?? null
  const messagesRef = useRef(null)
  const dbgRunRef = useRef(null)

  // ── Inbox seed (passed from InboxScreen via navigate state) ──────────
  // Gives us enough data to render the shell instantly without waiting
  // for openConversation or readConversationMembers to complete.
  const inboxSeed = location.state?.inboxPreview ?? null

  const seedConversation = useMemo(() => {
    if (!inboxSeed) return null
    return {
      id: inboxSeed.conversationId,
      conversationKind: inboxSeed.conversationKind ?? 'direct',
      isGroup: inboxSeed.conversationKind === 'group',
      title: inboxSeed.partnerDisplayName ?? null,
      accessMode: 'standard',
      visibility: 'members',
      scopeKind: null,
      scopeId: null,
      lastMessageAt: inboxSeed.lastMessageAt ?? null,
    }
  }, [inboxSeed])

  const seedPartnerActor = useMemo(() => {
    if (!inboxSeed || inboxSeed.conversationKind === 'group') return null
    return {
      actorId: inboxSeed.partnerActorId,
      kind: inboxSeed.partnerKind ?? 'user',
      displayName: inboxSeed.partnerDisplayName ?? null,
      username: inboxSeed.partnerUsername ?? null,
      photoUrl: inboxSeed.partnerPhotoUrl ?? '/avatar.jpg',
    }
  }, [inboxSeed])

  // ── Toast ──────────────────────────────────────────────────────────
  const [toast, setToast] = useState('')

  ios.useIOSPlatform({ enableKeyboard: true })
  ios.useIOSKeyboard(true)

  const markRead = useMarkChatRead(actorId)
  useEffect(() => {
    if (!conversationId || !actorId) return
    markRead.mutate(conversationId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId, actorId])

  // ── Server hooks — run in background, reconcile with seed ───────────
  const { conversation, loading, error } = useConversation({ conversationId, actorId })
  const { members } = useConversationMembers({ conversationId, actorId })
  const { messages, loading: messagesLoading, onEditMessage, onDeleteMessage, onSendMessage, addOptimistic, updateOptimistic, markFailed, retryMessage } =
    useConversationMessages({ conversationId, actorId })
  const { notifyTyping } = useTypingChannel({ conversationId, actorId })

  const reportFlow = useReportFlow({ reporterActorId: actorId })
  const inboxActions = useInboxActions({ actorId })
  const { entry: inboxEntry } = useInboxEntryForConversation({ actorId, conversationId })
  const isArchived = inboxEntry?.folder === 'archived' || inboxEntry?.archived === true
  const isSpamThread = inboxEntry?.folder === 'spam'

  // ── Effective values: server truth when available, seed otherwise ────
  const effectiveConversation = conversation ?? seedConversation

  const resolvedPartnerActor = useMemo(
    () => resolvePartnerActor({ actorId, conversation: conversation ?? seedConversation, members }),
    [actorId, conversation, seedConversation, members]
  )
  const effectivePartnerActor = resolvedPartnerActor ?? seedPartnerActor

  // Block check — uses the server-resolved partner (null for groups or before members load).
  // effectiveConversation is available from seed, so isDirectChat is known immediately.
  // useBlockStatus is safe with null IDs: returns { loading: false, isBlocked: false, blockedMe: false }.
  const isDirectChat = effectiveConversation?.conversationKind === 'direct'
  const partnerActorIdForBlock = resolvedPartnerActor?.actorId ?? null
  const {
    loading: blockStatusLoading,
    isBlocked: partnerIsBlocked,
    blockedMe: partnerBlockedMe,
  } = useBlockStatus(actorId, partnerActorIdForBlock)

  const isConversationBlocked =
    Boolean(partnerActorIdForBlock && (partnerIsBlocked || partnerBlockedMe))

  // Gate the composer while block status is pending for direct chats.
  // Covers two flash windows:
  //   1. Before members arrive (partnerActorIdForBlock is null — we know it's direct
  //      from effectiveConversation.conversationKind but haven't resolved the partner yet)
  //   2. After members arrive but while useBlockStatus async is in flight
  //      (initial state is isBlocked: false which would briefly show the composer)
  // Group chats are never gated (isDirectChat = false → blockCheckPending = false).
  const blockCheckPending =
    isDirectChat && (!partnerActorIdForBlock || blockStatusLoading)

  const { viewer, openViewer, closeViewer } = useMediaViewer()
  const { conversationCovered, setConversationCovered, undoConversationCover } =
    useConversationCover({ actorId, conversationId })

  const {
    menu,
    openMenu,
    closeMenu,
    handleCopy,
    editing,
    handleEdit,
    handleSaveEdit,
    handleCancelEdit,
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

  const { showJumpButton, setShowJumpButton, scrollToBottom } = useConversationScroll({
    messagesRef,
    messagesLength: messages?.length,
  })

  const { handleSend, handleAttach } = useSendMessageActions({
    conversationId,
    actorId,
    onSendMessage,
    addOptimistic,
    updateOptimistic,
    markFailed,
  })

  // ── DEV instrumentation ─────────────────────────────────────────────
  useEffect(() => {
    if (!DEV) return
    const id = chatNavDbg.startRun('Inbox → ConversationView', {
      conversationId,
      hasSeed: !!inboxSeed,
    })
    dbgRunRef.current = id
    chatNavDbg.mark(id, 'chat:shell:rendered', { hasSeed: !!inboxSeed })
    return () => {
      if (dbgRunRef.current) {
        chatNavDbg.endRun(dbgRunRef.current, 'chat:unmounted')
        dbgRunRef.current = null
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId])

  useEffect(() => {
    if (!DEV || !conversation || !dbgRunRef.current) return
    chatNavDbg.mark(dbgRunRef.current, 'chat:openConversation:end', { conversationId })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversation])

  useEffect(() => {
    if (!DEV || !members?.length || !dbgRunRef.current) return
    chatNavDbg.mark(dbgRunRef.current, 'chat:participants:end', { count: members.length })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [members?.length])

  useEffect(() => {
    if (!DEV || !messages?.length || !dbgRunRef.current) return
    chatNavDbg.mark(dbgRunRef.current, 'chat:messages:end', { count: messages.length })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages?.length])

  useEffect(() => {
    if (!DEV || !conversation || !members?.length || !messages?.length || !dbgRunRef.current) return
    chatNavDbg.endRun(dbgRunRef.current, 'chat:usable', {
      conversationId,
      messageCount: messages.length,
      memberCount: members.length,
    })
    dbgRunRef.current = null
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversation, members?.length, messages?.length])

  // ── Guards ──────────────────────────────────────────────────────────
  if (error) return <div className="p-4 text-rose-300">Failed to load</div>

  // Full-page spinner only when there is truly no data — no seed, still loading
  if (!effectiveConversation) {
    return (
      <div className="p-6">
        <Spinner label="Loading conversation..." />
      </div>
    )
  }

  // Enforce access control only after server members have arrived
  if (members?.length > 0 && !canReadConversation({ actorId, members })) {
    return <div className="p-4 text-white/50">Access denied</div>
  }

  const isEditing = !!editing
  const editingInitialText = editing?.initialBody ?? ''

  return (
    <div className="chat-screen chat-modern-conversation relative">
      <ChatScreenLayout
        messagesRef={messagesRef}
        header={
          <ChatHeader
            conversation={effectiveConversation}
            partnerActor={effectivePartnerActor}
            onBack={() => navigate(-1)}
            onOpenMenu={conversationCovered ? undefined : openConvMenu}
          />
        }
        messages={
          messagesLoading && messages.length === 0 ? (
            <div className="flex flex-col gap-3 px-4 py-6 animate-pulse">
              <div className="ml-auto h-8 w-44 rounded-2xl bg-white/8" />
              <div className="h-10 w-56 rounded-2xl bg-white/8" />
              <div className="ml-auto h-8 w-36 rounded-2xl bg-white/8" />
              <div className="h-8 w-48 rounded-2xl bg-white/8" />
              <div className="ml-auto h-10 w-52 rounded-2xl bg-white/8" />
            </div>
          ) : (
            <MessageList
              messages={messages}
              currentActorId={actorId}
              isGroupChat={effectiveConversation.isGroup}
              onOpenActions={conversationCovered ? undefined : openMenu}
              onOpenMedia={conversationCovered ? undefined : openViewer}
              retryMessage={retryMessage}
            />
          )
        }
        footer={null}
      />

      {showJumpButton && (
        <div className="absolute bottom-20 left-0 right-0 flex justify-center pointer-events-none z-20">
          <button
            type="button"
            onClick={() => {
              scrollToBottom('smooth')
              setShowJumpButton(false)
            }}
            className="pointer-events-auto rounded-full bg-purple-600/90 px-4 py-1.5 text-xs text-white shadow-lg backdrop-blur-sm active:bg-purple-500"
          >
            Jump to latest ↓
          </button>
        </div>
      )}

      {!conversationCovered && !isConversationBlocked && !blockCheckPending && (
        <ChatInput
          onSend={handleSend}
          onAttach={handleAttach}
          onAttachError={(msg) => setToast(msg || 'Image failed to send.')}
          onTyping={notifyTyping}
          editing={isEditing}
          initialValue={editingInitialText}
          onSaveEdit={(text) => { handleSaveEdit(text) }}
          onCancelEdit={() => { handleCancelEdit() }}
        />
      )}

      {isConversationBlocked && (
        <div className="px-4 py-3 text-center text-sm text-white/50 border-t border-white/8">
          Messaging is unavailable because one of you has blocked the other.
        </div>
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
        <ChatSpamCover
          onPrimary={() => navigate(isSpamThread ? '/chat/spam' : '/chat')}
          onSecondary={handleUndoSpam}
        />
      )}

      {viewer && (
        <div
          className="chat-modern-page fixed inset-0 z-[9999] flex items-center justify-center bg-black/95"
          onClick={closeViewer}
        >
          <button
            type="button"
            aria-label="Close media viewer"
            onClick={(e) => {
              e.stopPropagation()
              closeViewer()
            }}
            className="absolute inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-black/45 text-white text-xl leading-none backdrop-blur hover:bg-black/65"
            style={{
              top: "calc(env(safe-area-inset-top, 0px) + 12px)",
              right: "calc(env(safe-area-inset-right, 0px) + 12px)",
            }}
          >
            X
          </button>
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
