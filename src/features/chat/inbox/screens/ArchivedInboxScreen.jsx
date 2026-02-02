// src/features/chat/inbox/screens/ArchivedInboxScreen.jsx
import { useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'

import { useIdentity } from '@/state/identity/identityContext'

import useInboxFolder from '@/features/chat/inbox/hooks/useInboxFolder'

import InboxList from '@/features/chat/inbox/components/InboxList'
import InboxEmptyState from '@/features/chat/inbox/components/InboxEmptyState'
import buildInboxPreview from '@/features/chat/inbox/lib/buildInboxPreview'

export default function ArchivedInboxScreen() {
  const navigate = useNavigate()
  const { identity, loading: identityLoading } = useIdentity()

  const actorId = identity?.actorId ?? null
  const actorKind = identity?.kind ?? 'citizen'

  const {
    entries = [],
    loading: inboxLoading,
    error,
  } = useInboxFolder({ actorId, folder: 'archived' })

  useEffect(() => {
    // optional debug
    // console.log('[ArchivedInboxScreen] entries:', entries)
  }, [entries])

  const previews = useMemo(() => {
    if (!entries?.length || !actorId) return []
    return entries
      .map((entry) => buildInboxPreview({ entry, currentActorId: actorId }))
      .filter(Boolean)
  }, [entries, actorId])

  if (identityLoading || !actorId) return null

  if (error) {
    return <div className="p-4 text-red-400">Failed to load archived Vox</div>
  }

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
            {actorKind === 'vport' ? 'Archived Vox (Vport)' : 'Archived Vox'}
          </h1>

          {/* RIGHT: spacer */}
          <div className="ml-auto w-10" />
        </div>
      </header>

      {/* CONTENT */}
      <div className="flex-1 overflow-y-auto pb-24">
        {!inboxLoading && previews.length === 0 ? (
          <InboxEmptyState />
        ) : (
          <InboxList
            entries={previews}
            onSelect={(conversationId) => navigate(`/chat/${conversationId}`)}
            // ✅ NO onDelete here -> no trash icon -> no delete-for-me possible
          />
        )}
      </div>
    </div>
  )
}
