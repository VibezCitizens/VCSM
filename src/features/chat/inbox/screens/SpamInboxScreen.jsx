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
import { shouldShowInboxEntry } from '@/features/chat/inbox/model/vexSettings.model'
import Spinner from '@/shared/components/Spinner'
import '@/features/ui/modern/module-modern.css'

export default function SpamInboxScreen() {
  const navigate = useNavigate()
  const { identity, loading: identityLoading } = useIdentity()
  const { settings } = useVexSettings()

  const actorId = identity?.actorId ?? null
  const actorKind = identity?.kind ?? 'citizen'
  const hideEmptyThreads = settings?.hideEmptyConversations ?? false
  const showThreadPreview = settings?.showThreadPreview ?? true

  const { entries = [], loading: inboxLoading, error, hideConversation } = useInboxFolder({
    actorId,
    folder: 'spam',
  })

  const inboxActions = useInboxActions({ actorId })

  const filteredEntries = useMemo(() => {
    return entries.filter((entry) =>
      shouldShowInboxEntry(entry, { hideEmptyConversations: hideEmptyThreads })
    )
  }, [entries, hideEmptyThreads])

  const previews = useMemo(() => {
    if (!actorId) return []
    return filteredEntries
      .map((entry) => buildInboxPreview({ entry, currentActorId: actorId }))
      .filter(Boolean)
  }, [filteredEntries, actorId])

  if (identityLoading || !actorId) return null
  if (error) return <div className="p-4 text-red-400">Failed to load spam Vox</div>

  return (
    <div className="module-modern-page flex h-full flex-col">
      <div className="module-modern-shell mx-auto flex h-full w-full max-w-2xl flex-col rounded-2xl">
        <header
          className="sticky top-0 z-20 border-b border-slate-300/10 bg-[#070b16]/75 backdrop-blur"
          style={{ paddingTop: 'env(safe-area-inset-top)' }}
        >
          <div className="relative flex h-14 items-center px-3">
            <button
              type="button"
              onClick={() => navigate('/chat')}
              className="-ml-1 p-2 text-indigo-300 transition hover:text-indigo-200"
              aria-label="Back"
            >
              <ChevronLeft size={22} />
            </button>
            <h1 className="absolute left-1/2 -translate-x-1/2 text-lg font-semibold text-slate-100">
              {actorKind === 'vport' ? 'Spam Vox (Vport)' : 'Spam Vox'}
            </h1>
            <div className="ml-auto w-10">
              {inboxLoading ? <Spinner size={16} className="justify-end" /> : null}
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto pb-24">
          {inboxLoading ? (
            <div className="px-4 py-8">
              <Spinner label="Loading spam Vox..." />
            </div>
          ) : previews.length === 0 ? (
            <InboxEmptyState />
          ) : (
            <InboxList
              entries={previews}
              showThreadPreview={showThreadPreview}
              onSelect={(id) => navigate(`/chat/${id}`)}
              onDelete={(conversationId) => {
                hideConversation(conversationId)
                inboxActions.deleteThreadForMe(conversationId)
              }}
            />
          )}
        </div>
      </div>
    </div>
  )
}
