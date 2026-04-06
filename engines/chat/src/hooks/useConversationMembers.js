import { useCallback, useEffect, useState } from 'react'
import { readConversationMembersController } from '../controller/readConversationMembers.controller.js'

export default function useConversationMembers({ conversationId, actorId }) {
  const [members, setMembers] = useState([])
  const [me, setMe] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    if (!conversationId || !actorId) {
      setMembers([]); setMe(null); setLoading(false); return
    }
    setLoading(true); setError(null)
    try {
      const { members, me } = await readConversationMembersController({ conversationId, actorId })
      setMembers(members ?? [])
      setMe(me ?? null)
    } catch (err) {
      setError(err)
    } finally {
      setLoading(false)
    }
  }, [conversationId, actorId])

  useEffect(() => { load() }, [load])

  return { members, me, loading, error, refresh: load }
}
