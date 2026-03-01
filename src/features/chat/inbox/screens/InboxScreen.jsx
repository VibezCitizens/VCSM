import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'

import { useIdentity } from '@/state/identity/identityContext'
import useInbox from '@/features/chat/inbox/hooks/useInbox'
import useInboxActions from '@/features/chat/inbox/hooks/useInboxActions'
import useVexSettings from '@/features/chat/inbox/hooks/useVexSettings'

import InboxList from '@/features/chat/inbox/components/InboxList'
import InboxEmptyState from '@/features/chat/inbox/components/InboxEmptyState'
import buildInboxPreview from '@/features/chat/inbox/lib/buildInboxPreview'
import { shouldShowInboxEntry } from '@/features/chat/inbox/model/vexSettings.model'
import Spinner from '@/shared/components/Spinner'

import StartConversationModal from '@/features/chat/start/screens/StartConversationModal'
import { inboxOnSearch } from '@/features/chat/inbox/constants/inboxSearchAdapter'
import { useStartConversation } from '@/features/chat/start/hooks/useStartConversation'
import '@/features/ui/modern/module-modern.css'

export default function InboxScreen() {
  const navigate = useNavigate()
  const { identity, loading: identityLoading } = useIdentity()

  const actorId = identity?.actorId ?? null
  const actorKind = identity?.kind ?? 'citizen'

  const [startOpen, setStartOpen] = useState(false)
  const [actionsOpen, setActionsOpen] = useState(false)

  const { start: startConversation } = useStartConversation()
  const { settings } = useVexSettings()
  const hideEmptyThreads = settings?.hideEmptyConversations ?? false
  const showThreadPreview = settings?.showThreadPreview ?? true

  const { entries = [], loading: inboxLoading, error, hideConversation } = useInbox({ actorId })
  const inboxActions = useInboxActions({ actorId })

  const visibleEntries = useMemo(() => {
    return entries.filter((entry) =>
      shouldShowInboxEntry(entry, { hideEmptyConversations: hideEmptyThreads })
    )
  }, [entries, hideEmptyThreads])

  const previews = visibleEntries
    .map((entry) => buildInboxPreview({ entry, currentActorId: actorId }))
    .filter(Boolean)

  if (identityLoading || !actorId) return null
  if (error) return <div className="p-4 text-rose-300">Failed to load Vox</div>

  const handlePick = async (picked) => {
    setStartOpen(false)
    startConversation(picked)
  }

  return (
    <div className="module-modern-page flex h-full min-h-0 flex-col">
      <div className="mx-auto flex h-full min-h-0 w-full max-w-2xl flex-col">
        <div
          className="sticky top-0 z-10 flex items-center justify-between px-4 py-3 backdrop-blur-sm"
          style={{
            background:
              'linear-gradient(180deg, rgba(4,6,14,0.6) 0%, rgba(4,6,14,0.22) 68%, rgba(4,6,14,0) 100%)',
          }}
        >
          <h1 className="text-lg font-semibold text-slate-100">
            {actorKind === 'vport' ? 'Vport Vox' : actorKind === 'void' ? 'Void Vox' : 'Vox'}
          </h1>

          <div className="relative">
            <button
              onClick={() => setActionsOpen((v) => !v)}
              className="flex items-center justify-center p-1 text-slate-100 transition hover:text-white"
              aria-label="Vox actions"
            >
              <Plus size={22} strokeWidth={2.25} />
            </button>

            {actionsOpen && (
              <>
                <button
                  type="button"
                  aria-label="Close Vox actions"
                  onClick={() => setActionsOpen(false)}
                  className="fixed inset-0 z-40 cursor-default"
                />

                <div className="absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-2xl border border-white/10 bg-neutral-900/96 shadow-2xl">
                  <button
                    type="button"
                    onClick={() => {
                      setActionsOpen(false)
                      setStartOpen(true)
                    }}
                    className="w-full px-4 py-3 text-left text-slate-100 hover:bg-white/10"
                  >
                    New Vox
                  </button>

                  <div className="h-px bg-white/10" />

                  <button
                    type="button"
                    onClick={() => {
                      setActionsOpen(false)
                      navigate('/chat/settings')
                    }}
                    className="w-full px-4 py-3 text-left text-slate-100 hover:bg-white/10"
                  >
                    More actions
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        <div
          className="flex-1 min-h-0 overflow-y-auto touch-pan-y pb-24"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {inboxLoading ? (
            <div className="px-4 py-8">
              <Spinner label="Loading Vox..." />
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

      <StartConversationModal
        open={startOpen}
        onClose={() => setStartOpen(false)}
        onSearch={(q) => inboxOnSearch(q, { kinds: 'both' })}
        onPick={handlePick}
      />
    </div>
  )
}
