import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'

import { useIdentity } from '@/state/identity/identityContext'
import useInboxFolder from '@/features/chat/inbox/hooks/useInboxFolder'
import useVexSettings from '@/features/chat/inbox/hooks/useVexSettings'

import InboxList from '@/features/chat/inbox/components/InboxList'
import InboxEmptyState from '@/features/chat/inbox/components/InboxEmptyState'
import buildInboxPreview from '@/features/chat/inbox/lib/buildInboxPreview'

export default function ArchivedInboxScreen() {
  const navigate = useNavigate()
  const { identity, loading: identityLoading } = useIdentity()
  const { settings } = useVexSettings()

  const actorId = identity?.actorId ?? null
  const actorKind = identity?.kind ?? 'citizen'
  const hideEmptyThreads = settings?.hideEmptyConversations ?? false
  const showThreadPreview = settings?.showThreadPreview ?? true

  const { entries = [], loading: inboxLoading, error } = useInboxFolder({
    actorId,
    folder: 'archived',
  })

  const filteredEntries = useMemo(() => {
    if (!hideEmptyThreads) return entries
    return entries.filter((entry) => {
      const hasLastMessage = Boolean(entry?.lastMessageId)
      const hasUnread = Number(entry?.unreadCount || 0) > 0
      const hasPreviewText =
        String(entry?.preview || entry?.lastMessageBody || '').trim().length > 0
      return hasLastMessage || hasUnread || hasPreviewText
    })
  }, [entries, hideEmptyThreads])

  const previews = useMemo(() => {
    if (!filteredEntries?.length || !actorId) return []
    return filteredEntries
      .map((entry) => buildInboxPreview({ entry, currentActorId: actorId }))
      .filter(Boolean)
  }, [filteredEntries, actorId])

  if (identityLoading || !actorId) return null
  if (error) return <div className="p-4 text-red-400">Failed to load archived Vox</div>

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
            {actorKind === 'vport' ? 'Archived Vox (Vport)' : 'Archived Vox'}
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
            onSelect={(conversationId) => navigate(`/chat/${conversationId}`)}
          />
        )}
      </div>
    </div>
  )
}
