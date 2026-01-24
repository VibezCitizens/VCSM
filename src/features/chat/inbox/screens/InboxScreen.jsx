// src/features/chat/inbox/screens/InboxScreen.jsx
// ============================================================
// InboxScreen (DEBUG INSTRUMENTED — FINAL CLEAN UX)
// ============================================================

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

import { useIdentity } from '@/state/identity/identityContext'

// hooks
import useInbox from '@/features/chat/inbox/hooks/useInbox'
import useInboxActions from '@/features/chat/inbox/hooks/useInboxActions'

// ui
import InboxList from '@/features/chat/inbox/components/InboxList'
import InboxEmptyState from '@/features/chat/inbox/components/InboxEmptyState'

// lib
import buildInboxPreview from '@/features/chat/inbox/lib/buildInboxPreview'

// start flow
import StartConversationModal from '@/features/chat/start/screens/StartConversationModal'
import { inboxOnSearch } from '@/features/chat/inbox/constants/inboxSearchAdapter'
import { useStartConversation } from '@/features/chat/start/hooks/useStartConversation'
// 🔥 fire icon (replaces Plus)
import ConversationSignalIcon from '@/shared/components/ConversationSignalIcon'

export default function InboxScreen() {
  console.group('[InboxScreen] render')

  const navigate = useNavigate()
  const { identity, loading: identityLoading } = useIdentity()

  const actorId = identity?.actorId ?? null
  const actorKind = identity?.kind ?? 'citizen'

  console.log('identityLoading:', identityLoading)
  console.log('identity:', identity)
  console.log('actorId:', actorId)
  console.log('actorKind:', actorKind)

  const [startOpen, setStartOpen] = useState(false)
  console.log('startOpen state:', startOpen)
  const { start: startConversation } = useStartConversation()

  // ✅ NEW: header action menu open/close
  const [actionsOpen, setActionsOpen] = useState(false)

  // inbox data (✅ includes optimistic hide)
  const {
    entries = [],
    loading: inboxLoading,
    error,
    hideConversation, // ✅ REQUIRED
  } = useInbox({ actorId })

  console.log('inboxLoading:', inboxLoading)
  console.log('raw inbox entries:', entries)
  console.log('inbox error:', error)

  // inbox actions
  const inboxActions = useInboxActions({ actorId })
  console.log('useInboxActions ready:', inboxActions?.ready)

  useEffect(() => {
    console.log('[InboxScreen] startOpen changed →', startOpen)
  }, [startOpen])

  // guards
  if (identityLoading || !actorId) {
    console.warn('[InboxScreen] blocked by guard', {
      identityLoading,
      actorId,
    })
    console.groupEnd()
    return null
  }

  if (error) {
    console.error('[InboxScreen] inbox error', error)
    console.groupEnd()
    return <div className="p-4 text-red-400">Failed to load inbox</div>
  }

  const previews = entries
    .map((entry) => {
      const preview = buildInboxPreview({
        entry,
        currentActorId: actorId,
      })
      console.log('[InboxScreen] buildInboxPreview result:', preview)
      return preview
    })
    .filter(Boolean)

  console.log('final inbox previews:', previews)

  const handlePick = async (picked) => {
    setStartOpen(false)
    startConversation(picked)
  }

  return (
    <div className="flex flex-col h-full">
      {/* HEADER */}
      <div className="px-4 py-3 border-b border-neutral-800 flex items-center justify-between">
        <h1 className="text-lg font-semibold">
          {actorKind === 'vport'
            ? `${identity?.displayName || 'Vport'} Inbox`
            : actorKind === 'void'
              ? 'Void Inbox'
              : 'Inbox'}
        </h1>

        {/* ✅ RIGHT ACTIONS: fire button triggers menu */}
        <div className="relative">
          <button
            onClick={() => {
              console.log('[InboxScreen] HEADER FIRE button CLICKED (menu)')
              setActionsOpen((v) => !v)
            }}
            className="
              rounded-full p-2
              border border-white
              hover:bg-white/10
              flex items-center justify-center
            "
            aria-label="Inbox actions"
          >
            <ConversationSignalIcon size={20} className="text-white" />
          </button>

          {/* ✅ MENU */}
          {actionsOpen && (
            <>
              {/* backdrop click to close */}
              <button
                type="button"
                aria-label="Close inbox actions"
                onClick={() => setActionsOpen(false)}
                className="fixed inset-0 z-40 cursor-default"
              />

              <div className="absolute right-0 mt-2 w-56 z-50 rounded-2xl border border-white/10 bg-black shadow-xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => {
                    console.log('[InboxScreen] MENU: New conversation')
                    setActionsOpen(false)
                    setStartOpen(true)
                  }}
                  className="w-full px-4 py-3 text-left hover:bg-white/5 flex items-center gap-3"
                >
                  <span className="text-lg">➕</span>
                  <span className="text-white">New conversation</span>
                </button>

                <div className="h-px bg-white/10" />

                <button
                  type="button"
                  onClick={() => {
                    console.log('[InboxScreen] MENU: More actions')
                    setActionsOpen(false)
                    navigate('/chat/settings')
                  }}
                  className="w-full px-4 py-3 text-left hover:bg-white/5 flex items-center gap-3"
                >
                  <span className="text-lg">⚙️</span>
                  <span className="text-white">More actions</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* CONTENT */}
      <div className="flex-1 overflow-y-auto">
        {!inboxLoading && entries.length === 0 ? (
          <InboxEmptyState />
        ) : (
          <InboxList
            entries={previews}
            onSelect={(id) => {
              console.log('[InboxScreen] inbox item selected:', id)
              navigate(`/chat/${id}`)
            }}
            onDelete={(conversationId) => {
              console.log('[InboxScreen] delete thread:', conversationId)

              // ✅ OPTIMISTIC — NO FLASH
              hideConversation(conversationId)

              // ✅ AUTHORITATIVE — persist intent
              inboxActions.deleteThreadForMe(conversationId)
            }}
          />
        )}
      </div>

      {/* START CONVERSATION MODAL */}
      <StartConversationModal
        open={startOpen}
        onClose={() => {
          console.log('[InboxScreen] modal CLOSED')
          setStartOpen(false)
        }}
        onSearch={(q) => {
          console.log('[InboxScreen] onSearch query:', q)
          return inboxOnSearch(q, { kinds: 'both' })
        }}
        onPick={handlePick}
      />
    </div>
  )
}
