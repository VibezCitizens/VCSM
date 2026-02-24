import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { useIdentity } from '@/state/identity/identityContext'
import useInbox from '@/features/chat/inbox/hooks/useInbox'
import useInboxActions from '@/features/chat/inbox/hooks/useInboxActions'
import useVexSettings from '@/features/chat/inbox/hooks/useVexSettings'

import InboxList from '@/features/chat/inbox/components/InboxList'
import InboxEmptyState from '@/features/chat/inbox/components/InboxEmptyState'
import buildInboxPreview from '@/features/chat/inbox/lib/buildInboxPreview'

import StartConversationModal from '@/features/chat/start/screens/StartConversationModal'
import { inboxOnSearch } from '@/features/chat/inbox/constants/inboxSearchAdapter'
import { useStartConversation } from '@/features/chat/start/hooks/useStartConversation'
import ConversationSignalIcon from '@/shared/components/ConversationSignalIcon'
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
    if (!hideEmptyThreads) return entries

    return entries.filter((entry) => {
      const hasLastMessage = Boolean(entry?.lastMessageId)
      const hasUnread = Number(entry?.unreadCount || 0) > 0
      const hasPreviewText = String(entry?.preview || entry?.lastMessageBody || '').trim().length > 0
      return hasLastMessage || hasUnread || hasPreviewText
    })
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
    <div className="module-modern-page flex h-full flex-col">
      <div className="module-modern-shell mx-auto flex h-full w-full max-w-2xl flex-col rounded-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-300/10 bg-[#070b16]/75 px-4 py-3 backdrop-blur">
          <h1 className="text-lg font-semibold text-slate-100">
            {actorKind === 'vport' ? 'Vport Vox' : actorKind === 'void' ? 'Void Vox' : 'Vox'}
          </h1>

          <div className="relative">
            <button
              onClick={() => setActionsOpen((v) => !v)}
              className="module-modern-btn module-modern-btn--ghost flex items-center justify-center rounded-full p-2"
              aria-label="Vox actions"
            >
              <ConversationSignalIcon size={20} className="text-white" />
            </button>

            {actionsOpen && (
              <>
                <button
                  type="button"
                  aria-label="Close Vox actions"
                  onClick={() => setActionsOpen(false)}
                  className="fixed inset-0 z-40 cursor-default"
                />

                <div className="module-modern-shell absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-2xl">
                  <button
                    type="button"
                    onClick={() => {
                      setActionsOpen(false)
                      setStartOpen(true)
                    }}
                    className="w-full px-4 py-3 text-left text-slate-100 hover:bg-white/5"
                  >
                    + New Vox
                  </button>

                  <div className="h-px bg-slate-300/10" />

                  <button
                    type="button"
                    onClick={() => {
                      setActionsOpen(false)
                      navigate('/chat/settings')
                    }}
                    className="w-full px-4 py-3 text-left text-slate-100 hover:bg-white/5"
                  >
                    More actions
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {!inboxLoading && previews.length === 0 ? (
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
