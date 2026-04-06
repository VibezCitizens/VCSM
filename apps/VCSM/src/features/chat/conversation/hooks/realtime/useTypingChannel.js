// src/features/chat/conversation/hooks/realtime/useTypingChannel.js
// ============================================================
// MIGRATED: Delegates to shared chat engine.
// Authority: engine typing presence (Supabase channels via engine config)
// Return contract identical: { typingActors, notifyTyping }
// ============================================================

import { useTypingChannel as useEngineTyping } from '@chat'

export default function useTypingChannel({
  conversationId,
  actorId,
  actorPresentation,
  timeoutMs = 3000,
}) {
  return useEngineTyping({ conversationId, actorId, actorPresentation, timeoutMs })
}
