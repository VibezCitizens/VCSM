// src/features/chat/hooks/conversation/useTypingChannel.js
// ============================================================
// useTypingChannel
// ------------------------------------------------------------
// - Actor-based (NO user_id logic)
// - Realtime typing indicator using Supabase presence
// - Safe for actor + conversation switching
// - UI consumes returned actors array
// ============================================================

import { useEffect, useRef, useState, useCallback } from 'react'
import { supabase } from '@/services/supabase/supabaseClient'

/**
 * useTypingChannel
 *
 * @param {Object} params
 * @param {string} params.conversationId
 * @param {string} params.actorId
 * @param {Object} params.actorPresentation
 *   {
 *     actor_id,
 *     kind,
 *     display_name?,
 *     username?,
 *     photo_url?
 *   }
 *
 * @param {number} [params.timeoutMs=3000]
 *
 * @returns {{
 *   typingActors: Array,
 *   notifyTyping: () => void
 * }}
 */
export default function useTypingChannel({
  conversationId,
  actorId,
  actorPresentation,
  timeoutMs = 3000,
}) {
  const [typingActors, setTypingActors] = useState([])

  const channelRef = useRef(null)
  const timeoutRef = useRef(null)

  /* ============================================================
     Subscribe to presence channel
     ============================================================ */
  useEffect(() => {
    if (!conversationId || !actorId) return

    // cleanup old channel
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current)
      channelRef.current = null
    }

    const channel = supabase.channel(
      `vc-typing-${conversationId}`,
      {
        config: {
          presence: {
            key: actorId,
          },
        },
      }
    )

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState()

        const actors = Object.values(state)
          .flat()
          .map((p) => p.actor)
          .filter(
            (a) =>
              a &&
              a.actor_id &&
              a.actor_id !== actorId
          )

        setTypingActors(actors)
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            actor: actorPresentation,
            ts: Date.now(),
          })
        }
      })

    channelRef.current = channel

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [conversationId, actorId, actorPresentation])

  /* ============================================================
     Notify typing (debounced)
     ============================================================ */
  const notifyTyping = useCallback(async () => {
    if (!channelRef.current) return

    // reset local debounce
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    await channelRef.current.track({
      actor: actorPresentation,
      ts: Date.now(),
    })

    timeoutRef.current = setTimeout(() => {
      // allow presence entry to expire naturally
      timeoutRef.current = null
    }, timeoutMs)
  }, [actorPresentation, timeoutMs])

  return {
    typingActors,
    notifyTyping,
  }
}
