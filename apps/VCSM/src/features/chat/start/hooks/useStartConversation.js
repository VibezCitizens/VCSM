// src/features/chat/start/hooks/useStartConversation.js
// ============================================================
// MIGRATED: Uses shared chat engine for conversation creation.
// Authority: chat.conversations, chat.conversation_members (via engine)
//
// The engine's startDirectConversation controller handles:
//   - resolve target actor
//   - realm resolution (via DI: resolveRealm, resolveActorRealmContext)
//   - block checking (via DI: checkBlockRelation)
//   - get-or-create direct conversation (chat.* RPC)
//   - open conversation + ensure membership
//   - domain event: CONVERSATION_CREATED
// ============================================================

import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

import { useIdentity, useActiveActorState } from '@/features/identity/adapters/identity.adapter'
import { startDirectConversation } from '@chat'
import { resolveRealm } from '@/shared/utils/resolveRealm'

export function useStartConversation() {
  const { identity } = useIdentity()
  const { realmId, isVoid } = useActiveActorState()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)

  const start = useCallback(async (picked) => {
    if (!identity?.actorId) {
      toast.error('You can\u2019t message this user')
      return
    }

    if (!picked) return
    const effectiveRealmId = realmId ?? resolveRealm(Boolean(isVoid))

    try {
      setLoading(true)

      const { conversationId } = await startDirectConversation({
        fromActorId: identity.actorId,
        realmId: effectiveRealmId,
        picked,
      })

      navigate(`/chat/${conversationId}`)
    } catch (err) {
      console.error('[useStartConversation]', err)
      toast.error('Failed to open chat')
    } finally {
      setLoading(false)
    }
  }, [identity, realmId, isVoid, navigate])

  return { start, loading }
}
