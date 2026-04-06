// src/features/chat/conversation/hooks/conversation/useConversationMessages.js
// ============================================================
// useConversationMessages — VCSM conversation messages hook
// ------------------------------------------------------------
// MIGRATED (Slice 3): Delegates to shared chat engine.
// Authority: chat.messages (via engine)
//
// The engine hook handles:
//   - initial message load from chat.* schema
//   - realtime subscription (chat.messages INSERT/UPDATE)
//   - deterministic merge with tombstone guards
//   - optimistic send lifecycle (clientId dedup)
//   - send via atomic RPC (chat.send_message_atomic)
//   - edit, unsend, delete-for-me
//
// NOTE: Write callbacks (onSendMessage, onEditMessage, onDeleteMessage)
// now also go through the engine (chat.* schema). This is required
// because reads + realtime subscribe to chat.messages — if writes
// went to vc.messages, sent messages would never appear in the view.
//
// Return contract is identical to the previous VCSM-local hook:
//   { messages, loading, onSendMessage, onEditMessage, onDeleteMessage }
// ============================================================

import { useConversationMessages as useEngineMessages } from '@chat'

export default function useConversationMessages({
  conversationId,
  actorId,
  pageSize = 50,
}) {
  return useEngineMessages({
    conversationId,
    actorId,
    pageSize,
  })
}
