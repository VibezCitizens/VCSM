// src/features/chat/dal/conversations.write.dal.js
// ============================================================
// Conversations — WRITE DAL
// ------------------------------------------------------------
// - Actor-based (NO user_id logic)
// - Low-level writes only
// - Business rules live in controllers
// ============================================================

import { supabase } from '@/services/supabase/supabaseClient'

/* ============================================================
   Create conversation
   ============================================================ */

/**
 * Create a conversation row.
 *
 * @param {Object} params
 * @param {boolean} params.isGroup
 * @param {string} params.createdByActorId
 * @param {string} params.realmId
 * @param {string} [params.title]
 * @param {string} [params.avatarUrl]
 *
 * @returns {Promise<{ id: string }>}
 */
export async function createConversation({
  isGroup = false,
  createdByActorId,
  realmId,
  title = null,
  avatarUrl = null,
}) {
  if (!createdByActorId || !realmId) {
    throw new Error('[createConversation] missing params')
  }

  const { data, error } = await supabase
    .schema('vc')
    .from('conversations')
    .insert({
      is_group: isGroup,
      created_by_actor_id: createdByActorId,
      realm_id: realmId,
      title,
      avatar_url: avatarUrl,
    })
    .select('id')
    .single()

  if (error || !data) {
    console.error(error)
    throw new Error('[createConversation] insert failed')
  }

  return data
}

/* ============================================================
   Add members
   ============================================================ */

/**
 * Add one or more actors as conversation members.
 *
 * @param {Object} params
 * @param {string} params.conversationId
 * @param {Array<{ actorId: string, role?: string }>} params.members
 */
export async function addConversationMembers({
  conversationId,
  members = [],
}) {
  if (!conversationId || members.length === 0) {
    throw new Error('[addConversationMembers] missing params')
  }

  const rows = members.map((m) => ({
    conversation_id: conversationId,
    actor_id: m.actorId,
    role: m.role || 'member',
  }))

  const { error } = await supabase
    .schema('vc')
    .from('conversation_members')
    .insert(rows)

  if (error) {
    console.error(error)
    throw new Error('[addConversationMembers] insert failed')
  }
}

/* ============================================================
   Update conversation metadata
   ============================================================ */

/**
 * Update conversation title / avatar.
 *
 * @param {Object} params
 * @param {string} params.conversationId
 * @param {string} [params.title]
 * @param {string} [params.avatarUrl]
 */
export async function updateConversationMetadata({
  conversationId,
  title,
  avatarUrl,
}) {
  if (!conversationId) {
    throw new Error('[updateConversationMetadata] conversationId required')
  }

  const updates = {}
  if (title !== undefined) updates.title = title
  if (avatarUrl !== undefined) updates.avatar_url = avatarUrl

  if (Object.keys(updates).length === 0) return

  const { error } = await supabase
    .schema('vc')
    .from('conversations')
    .update(updates)
    .eq('id', conversationId)

  if (error) {
    console.error(error)
    throw new Error('[updateConversationMetadata] update failed')
  }
}

/* ============================================================
   Touch last message
   ============================================================ */

/**
 * Update last message pointer on conversation.
 *
 * @param {Object} params
 * @param {string} params.conversationId
 * @param {string} params.messageId
 * @param {string} params.createdAt
 */
export async function updateConversationLastMessage({
  conversationId,
  messageId,
  createdAt,
}) {
  if (!conversationId || !messageId || !createdAt) {
    throw new Error('[updateConversationLastMessage] missing params')
  }

  const { error } = await supabase
    .schema('vc')
    .from('conversations')
    .update({
      last_message_id: messageId,
      last_message_at: createdAt,
    })
    .eq('id', conversationId)

  if (error) {
    console.error(error)
    throw new Error('[updateConversationLastMessage] update failed')
  }
}

/* ============================================================
   Soft-remove member (used by leave flows)
   ============================================================ */

/**
 * Deactivate a member from a conversation.
 *
 * @param {Object} params
 * @param {string} params.conversationId
 * @param {string} params.actorId
 */
export async function deactivateConversationMember({
  conversationId,
  actorId,
}) {
  if (!conversationId || !actorId) {
    throw new Error('[deactivateConversationMember] missing params')
  }

  const { error } = await supabase
    .schema('vc')
    .from('conversation_members')
    .update({
      is_active: false,
    })
    .eq('conversation_id', conversationId)
    .eq('actor_id', actorId)

  if (error) {
    console.error(error)
    throw new Error('[deactivateConversationMember] update failed')
  }
}
