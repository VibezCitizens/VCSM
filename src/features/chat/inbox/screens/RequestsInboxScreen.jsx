import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'

import { useIdentity } from '@/state/identity/identityContext'
import useInboxActions from '@/features/chat/inbox/hooks/useInboxActions'
import useInboxFolder from '@/features/chat/inbox/hooks/useInboxFolder'
import useVexSettings from '@/features/chat/inbox/hooks/useVexSettings'

import InboxList from '@/features/chat/inbox/components/InboxList'
import InboxEmptyState from '@/features/chat/inbox/components/InboxEmptyState'
import buildInboxPreview from '@/features/chat/inbox/lib/buildInboxPreview'

function isRequestEntry(entry) {
  const folder = entry?.folder || entry?.inboxFolder || entry?.mailboxFolder
  const kind = entry?.kind || entry?.type
  const status =
    entry?.status ||
    entry?.requestStatus ||
    entry?.threadStatus ||
    entry?.membership?.status ||
    entry?.relationship?.status

  return Boolean(
    folder === 'requests' ||
      folder === 'request' ||
      folder === 'message_requests' ||
      folder === 'message-requests' ||
      folder === 'pending' ||
      kind === 'request' ||
      kind === 'message_request' ||
      kind === 'message-request' ||
      entry?.isRequest === true ||
      entry?.request === true ||
      entry?.isMessageRequest === true ||
      entry?.messageRequest === true ||
      status === 'pending' ||
      status === 'requested' ||
      status === 'needs_approval' ||
      status === 'awaiting_approval' ||
      status === 'invited' ||
      status === 'invite_pending' ||
      status === 'unapproved' ||
      status === 'not_accepted' ||
      entry?.relationship?.state === 'requested' ||
      entry?.membership?.state === 'invited' ||
      entry?.invite?.status === 'pending'
  )
}

export default function RequestsInboxScreen() {
  const navigate = useNavigate()
  const { identity, loading: identityLoading } = useIdentity()
  const { settings } = useVexSettings()

  const actorId = identity?.actorId ?? null
  const actorKind = identity?.kind ?? 'citizen'
  const isBlocked = identityLoading || !actorId
  const hideEmptyThreads = settings?.hideEmptyConversations ?? false
  const showThreadPreview = settings?.showThreadPreview ?? true

  const { entries = [], loading: inboxLoading, error, hideConversation } = useInboxFolder({
    actorId,
    folder: 'inbox',
  })

  const inboxActions = useInboxActions({ actorId })

  const requestEntries = useMemo(() => {
    if (isBlocked) return []
    return entries.filter(isRequestEntry)
  }, [entries, isBlocked])

  const filteredEntries = useMemo(() => {
    if (!hideEmptyThreads) return requestEntries
    return requestEntries.filter((entry) => {
      const hasLastMessage = Boolean(entry?.lastMessageId)
      const hasUnread = Number(entry?.unreadCount || 0) > 0
      const hasPreviewText =
        String(entry?.preview || entry?.lastMessageBody || '').trim().length > 0
      return hasLastMessage || hasUnread || hasPreviewText
    })
  }, [requestEntries, hideEmptyThreads])

  const previews = useMemo(() => {
    if (isBlocked) return []
    return filteredEntries
      .map((entry) => buildInboxPreview({ entry, currentActorId: actorId }))
      .filter(Boolean)
  }, [filteredEntries, actorId, isBlocked])

  if (isBlocked) return null
  if (error) return <div className="p-4 text-red-400">Failed to load Vox requests</div>

  return (
    <div className="flex min-h-0 flex-col">
      <header
        className="sticky top-0 z-20 shrink-0 border-b border-white/10 bg-black/90 backdrop-blur"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        <div className="relative flex h-14 items-center px-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="rounded-xl p-2 -ml-1 text-violet-400 transition hover:bg-violet-500/15 active:bg-violet-500/25"
            aria-label="Back"
          >
            <ChevronLeft size={22} />
          </button>
          <h1 className="absolute left-1/2 -translate-x-1/2 text-lg font-semibold text-white">
            {actorKind === 'vport' ? 'Vox Requests (Vport)' : 'Vox Requests'}
          </h1>
          <div className="ml-auto w-10" />
        </div>
      </header>

      <div className="flex-1 overflow-y-auto pb-24">
        {!inboxLoading && previews.length === 0 ? (
          <InboxEmptyState />
        ) : (
          <InboxList
            entries={previews}
            showThreadPreview={showThreadPreview}
            onSelect={(id) => navigate(`/chat/${id}`)}
            onDelete={(conversationId) => {
              hideConversation(conversationId)
              inboxActions.ignoreRequest(conversationId)
            }}
          />
        )}
      </div>
    </div>
  )
}
