import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

import { useIdentity } from '@/state/identity/identityContext'
import { startDirectConversation } from
  '@/features/chat/start/controllers/startDirectConversation.controller'

/**
 * @Contract: HOOK
 * @Role: Unified UI entry into chat
 * @Guarantees:
 * - No DAL
 * - No Supabase
 * - No business rules
 */
export function useStartConversation() {
  const { identity } = useIdentity()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)

  const start = useCallback(async (picked) => {
    if (!identity?.actorId || !identity?.realmId) {
     toast.error('You can’t message this user')
      return
    }

    if (!picked) return

    try {
      setLoading(true)

      const { conversationId } = await startDirectConversation({
        fromActorId: identity.actorId,
        realmId: identity.realmId,
        picked,
      })

      navigate(`/chat/${conversationId}`)
    } catch (err) {
      console.error('[useStartConversation]', err)
      toast.error('Failed to open chat')
    } finally {
      setLoading(false)
    }
  }, [identity, navigate])

  return { start, loading }
}
