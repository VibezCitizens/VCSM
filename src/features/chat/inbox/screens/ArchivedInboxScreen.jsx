// src/features/chat/inbox/screens/ArchivedInboxScreen.jsx
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

import { useIdentity } from '@/state/identity/identityContext'

import useInboxActions from '@/features/chat/inbox/hooks/useInboxActions'
import useInboxFolder from '@/features/chat/inbox/hooks/useInboxFolder'

import InboxList from '@/features/chat/inbox/components/InboxList'
import InboxEmptyState from '@/features/chat/inbox/components/InboxEmptyState'
import buildInboxPreview from '@/features/chat/inbox/lib/buildInboxPreview'

export default function ArchivedInboxScreen() {
  const navigate = useNavigate()
  const { identity, loading: identityLoading } = useIdentity()

  const actorId = identity?.actorId ?? null
  const actorKind = identity?.kind ?? 'citizen'

  /**
   * NOTE:
   * You do not yet have real "archived" logic.
   * For now this behaves as a placeholder inbox that shows empty state.
   * Later you can add `folder: 'archived'` support to useInboxFolder.
   */
  const {
    entries = [],
    loading: inboxLoading,
    error,
    hideConversation,
  } = useInboxFolder({ actorId, folder: 'inbox' })

  const inboxActions = useInboxActions({ actorId })

  useEffect(() => {
    // optional debug
    // console.log('[ArchivedInboxScreen] entries:', entries)
  }, [entries])

  if (identityLoading || !actorId) return null

  if (error) {
    return <div className="p-4 text-red-400">Failed to load archived</div>
  }

  // Placeholder: no archived conversations yet
  const previews = []

  return (
    <div className="flex flex-col min-h-0">
      {/* HEADER */}
      <div className="px-4 py-3 border-b border-neutral-800 flex items-center justify-between shrink-0">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="rounded-lg px-3 py-1 text-sm text-neutral-200 hover:bg-white/10"
        >
          Back
        </button>

        <h1 className="text-lg font-semibold text-white">
          {actorKind === 'vport' ? 'Archived (Vport)' : 'Archived'}
        </h1>

        <div className="text-xs text-neutral-500" />
      </div>

      {/* CONTENT */}
      <div className="flex-1 overflow-y-auto pb-24">
        {!inboxLoading && previews.length === 0 ? (
          <InboxEmptyState />
        ) : (
          <InboxList
            entries={previews}
            onSelect={(id) => navigate(`/chat/${id}`)}
            onDelete={(conversationId) => {
              hideConversation(conversationId)
              inboxActions.deleteThreadForMe(conversationId)
            }}
          />
        )}
      </div>
    </div>
  )
}
