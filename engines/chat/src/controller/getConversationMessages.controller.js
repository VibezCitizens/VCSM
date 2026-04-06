// src/controller/getConversationMessages.controller.js
// ============================================================
// getConversationMessagesController
// ------------------------------------------------------------
// - Actor-aware message timeline controller
// - Applies ALL visibility rules
// - No UI logic
// - No DB writes
//
// Visibility layers (in order):
// 1) Thread-level delete-for-me      → inbox_entries.history_cutoff_at
// 2) Message-level delete-for-me     → message_receipts.hidden_at
// 3) Message-level delete-for-all    → handled in MessageModel (deleted_at)
//
// ARCHITECTURE RULE:
// Controller = "What should THIS actor see?"
// ============================================================

import {
  getMessagesForConversationForActor,
} from '../dal/messages.timeline.read.dal.js'

import {
  getHiddenMessageIdSetDAL,
} from '../dal/messageVisibility.read.dal.js'

import {
  getConversationHistoryCutoff,
} from '../dal/inbox.read.dal.js'

import { MessageModel } from '../model/Message.model.js'
import { readConversationMembershipDAL } from '../dal/conversationMembership.read.dal.js'

export async function getConversationMessagesController({
  conversationId,
  actorId,
  limit = 50,
  before = null,
}) {
  if (!conversationId || !actorId) {
    throw new Error('[getConversationMessagesController] missing params')
  }

  const membership = await readConversationMembershipDAL({
    conversationId,
    actorId,
  })

  if (!membership || membership.membership_status !== 'active') {
    throw new Error('[getConversationMessagesController] actor may not read this conversation')
  }

  /* ============================================================
     Fetch raw data in parallel
     ============================================================ */
  const [
    rows,
    hiddenIdSet,
    historyCutoffAt,
  ] = await Promise.all([
    getMessagesForConversationForActor({
      conversationId,
      limit,
      before,
    }),
    getHiddenMessageIdSetDAL({ actorId }),
    getConversationHistoryCutoff({
      actorId,
      conversationId,
    }),
  ])

  /* ============================================================
     Apply visibility rules
     ============================================================ */
  return (rows ?? [])
    // THREAD-LEVEL VISIBILITY (delete thread for me)
    .filter((r) =>
      !historyCutoffAt ||
      new Date(r.created_at) >= new Date(historyCutoffAt)
    )

    // Map to domain model (handles deleted_at, edits, etc.)
    .map(MessageModel)
    .filter(Boolean)

    // MESSAGE-LEVEL VISIBILITY (delete message for me)
    .filter((m) => !hiddenIdSet.has(m.id))
}
