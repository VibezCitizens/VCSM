// src/services/reactionService.js
// ============================================================
// Reaction Service
// ------------------------------------------------------------
// Encapsulates domain logic around message reactions:
//   - addReaction    → upsert a reaction, emit outbox event
//   - removeReaction → delete a reaction, emit outbox event
//   - groupReactions → aggregate raw rows into display shape
//
// Schema column is `reaction`, not `emoji`.
//
// Services are called by controllers.
// Services must not call hooks, components, or screens.
// ============================================================

import {
  insertReactionDAL,
  deleteReactionDAL,
  fetchReactionsForMessageDAL,
} from '../dal/messageReactions.write.dal.js'
import { EVENTS } from '../events.js'
import { publishDomainEvent } from './domainEventService.js'

/**
 * Add a reaction from an actor to a message.
 * Returns the raw reaction row.
 *
 * @param {Object} params
 * @param {string} params.messageId
 * @param {string} params.actorId
 * @param {string} params.reaction        - e.g. '👍'
 * @param {string} params.conversationId  - for outbox payload
 * @returns {Promise<Object>} Raw reaction row
 */
export async function addReaction({ messageId, actorId, reaction, conversationId }) {
  const row = await insertReactionDAL({ messageId, actorId, reaction })

  await publishDomainEvent({
    eventName: EVENTS.REACTION_ADDED,
    aggregateType: 'message',
    aggregateId: messageId,
    conversationId,
    messageId,
    payload: {
      messageId,
      actorId,
      reaction,
      conversationId,
      createdAt: row.created_at,
    },
  })

  return row
}

/**
 * Remove a reaction from an actor on a message.
 *
 * @param {Object} params
 * @param {string} params.messageId
 * @param {string} params.actorId
 * @param {string} params.reaction
 * @param {string} params.conversationId  - for outbox payload
 * @returns {Promise<true>}
 */
export async function removeReaction({ messageId, actorId, reaction, conversationId }) {
  await deleteReactionDAL({ messageId, actorId, reaction })

  await publishDomainEvent({
    eventName: EVENTS.REACTION_REMOVED,
    aggregateType: 'message',
    aggregateId: messageId,
    conversationId,
    messageId,
    payload: {
      messageId,
      actorId,
      reaction,
      conversationId,
    },
  })

  return true
}

/**
 * Group raw reaction rows into a display-ready shape.
 *
 * @param {Object} params
 * @param {string} params.messageId
 * @param {string} params.viewerActorId
 * @returns {Promise<Array<{ reaction: string, count: number, viewerReacted: boolean }>>}
 */
export async function groupReactionsForMessage({ messageId, viewerActorId }) {
  const rows = await fetchReactionsForMessageDAL({ messageId })

  const grouped = new Map()

  for (const row of rows) {
    if (!grouped.has(row.reaction)) {
      grouped.set(row.reaction, { reaction: row.reaction, count: 0, viewerReacted: false })
    }
    const entry = grouped.get(row.reaction)
    entry.count += 1
    if (row.actor_id === viewerActorId) {
      entry.viewerReacted = true
    }
  }

  return Array.from(grouped.values()).sort((a, b) => b.count - a.count)
}
