// src/features/chat/inbox/screens/SpamInboxScreen.jsx
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'

import { useIdentity } from '@/state/identity/identityContext'

import useInboxActions from '@/features/chat/inbox/hooks/useInboxActions'
import useInboxFolder from '@/features/chat/inbox/hooks/useInboxFolder'

import InboxList from '@/features/chat/inbox/components/InboxList'
import InboxEmptyState from '@/features/chat/inbox/components/InboxEmptyState'
import buildInboxPreview from '@/features/chat/inbox/lib/buildInboxPreview'

export default function SpamInboxScreen() {
  const navigate = useNavigate()
  const { identity, loading: identityLoading } = useIdentity()

  const actorId = identity?.actorId ?? null
  const actorKind = identity?.kind ?? 'citizen'

  const {
    entries = [],
    loading: inboxLoading,
    error,
    hideConversation,
    spamLoading,
  } = useInboxFolder({ actorId, folder: 'spam' })

  const inboxActions = useInboxActions({ actorId })

  useEffect(() => {
    // optional debug
    // console.log('[SpamInboxScreen] entries:', entries)
  }, [entries])

  if (identityLoading || !actorId) return null

  if (error) {
    return <div className="p-4 text-red-400">Failed to load spam Vox</div>
  }

  const previews = entries
    .map((entry) =>
      buildInboxPreview({
        entry,
        currentActorId: actorId,
      })
    )
    .filter(Boolean)

  return (
    <div className="flex flex-col min-h-0">
      {/* HEADER (ChatHeader-style, centered title) */}
      <header
        className="
          sticky top-0 z-20
          bg-black/90 backdrop-blur
          border-b border-white/10
          shrink-0
        "
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        <div className="relative h-14 px-3 flex items-center">
          {/* LEFT: Back */}
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="
              p-2 -ml-1 rounded-xl
              text-violet-400
              hover:bg-violet-500/15
              active:bg-violet-500/25
              transition
            "
            aria-label="Back"
          >
            <ChevronLeft size={22} />
          </button>

          {/* CENTER: Title */}
          <h1 className="absolute left-1/2 -translate-x-1/2 text-lg font-semibold text-white">
            {actorKind === 'vport' ? 'Spam Vox (Vport)' : 'Spam Vox'}
          </h1>

          {/* RIGHT: status */}
          <div className="ml-auto w-10 text-right text-xs text-neutral-500">
            {spamLoading ? 'Loading…' : ''}
          </div>
        </div>
      </header>

      {/* CONTENT */}
      <div className="flex-1 overflow-y-auto pb-24">
        {!inboxLoading && previews.length === 0 ? (
          <InboxEmptyState />
        ) : (
          <InboxList
            entries={previews}
            onSelect={(id) => navigate(`/chat/${id}`)}
            onDelete={(conversationId) => {
              // delete locally from this list
              hideConversation(conversationId)
              inboxActions.deleteThreadForMe(conversationId)
            }}
          />
        )}
      </div>
    </div>
  )
}
