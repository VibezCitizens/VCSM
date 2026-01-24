// src/features/chat/inbox/hooks/useSpamConversationIds.js
import { useEffect, useMemo, useState } from 'react'

/**
 * useSpamConversationIds
 * - Returns a Set of conversationIds in spam folder for this actor
 * - Source of truth: vc.inbox_entries.folder = 'spam'
 */
export default function useSpamConversationIds({ actorId, enabled = true }) {
  const [loading, setLoading] = useState(false)
  const [ids, setIds] = useState([])

  useEffect(() => {
    let cancelled = false

    async function run() {
      if (!enabled) return
      if (!actorId) return

      setLoading(true)
      try {
        // ✅ Query inbox state, not moderation reports
        const res = await fetch(
          `/api/chat/inbox?actor_id=${encodeURIComponent(actorId)}&folder=spam`,
          { method: 'GET' }
        )

        if (!res.ok) {
          throw new Error(`spam inbox fetch failed: ${res.status}`)
        }

        const data = await res.json()

        if (cancelled) return

        const conversationIds = (Array.isArray(data) ? data : [])
          .map((row) => row.conversation_id)
          .filter(Boolean)

        setIds(conversationIds)
      } catch {
        if (!cancelled) setIds([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    run()
    return () => {
      cancelled = true
    }
  }, [actorId, enabled])

  const set = useMemo(() => new Set(ids), [ids])

  return {
    loading,
    ids,
    set,
  }
}
