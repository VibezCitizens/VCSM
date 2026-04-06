// src/services/typingService.js
// ============================================================
// Typing Service
// ------------------------------------------------------------
// Encapsulates domain logic for typing presence state:
//   - startTyping  → upsert a typing_states row with TTL
//   - stopTyping   → delete the typing_states row
//   - pruneStale   → remove expired typing states (housekeeping)
//
// Typing state is ephemeral — no outbox events are emitted.
// Real-time delivery is handled by Supabase Realtime subscriptions
// in the hooks layer, not here.
//
// Services are called by controllers.
// Services must not call hooks, components, or screens.
// ============================================================

import {
  deleteExpiredTypingStatesDAL,
  deleteTypingStateDAL,
  upsertTypingStateDAL,
} from '../dal/typingStates.write.dal.js'

/**
 * Default TTL in seconds for a typing_states row.
 * If the actor stops sending heartbeats, state auto-expires.
 */
const TYPING_TTL_SECONDS = 8

/**
 * Upsert a typing_states row for an actor in a conversation.
 *
 * @param {Object} params
 * @param {string} params.conversationId
 * @param {string} params.actorId
 * @returns {Promise<true>}
 */
export async function startTyping({ conversationId, actorId }) {
  const now = new Date()
  const expiresAt = new Date(now.getTime() + TYPING_TTL_SECONDS * 1000).toISOString()
  return upsertTypingStateDAL({
    conversationId,
    actorId,
    startedAt: now.toISOString(),
    expiresAt,
  })
}

/**
 * Delete the typing_states row for an actor in a conversation.
 *
 * @param {Object} params
 * @param {string} params.conversationId
 * @param {string} params.actorId
 * @returns {Promise<true>}
 */
export async function stopTyping({ conversationId, actorId }) {
  return deleteTypingStateDAL({ conversationId, actorId })
}

/**
 * Remove all expired typing_states rows.
 * Should be called periodically by a background worker or cron.
 *
 * @returns {Promise<true>}
 */
export async function pruneStaleTypingStates() {
  return deleteExpiredTypingStatesDAL({
    before: new Date().toISOString(),
  })
}
