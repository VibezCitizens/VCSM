// src/dal/conversations.write.dal.js
// ============================================================
// Conversations — WRITE DAL
// ------------------------------------------------------------
// - Actor-based (NO user_id logic)
// - Low-level writes only
// - Business rules live in controllers
// ============================================================

import { getSupabaseClient } from '../config.js'

/* ============================================================
   Create conversation
   ============================================================ */

/**
 * Create a conversation row.
 *
 * @param {Object} params
 * @param {boolean} params.isGroup
 * @param {string} [params.conversationKind]
 * @param {string} [params.accessMode]
 * @param {string} [params.visibility]
 * @param {string|null} [params.scopeKind]
 * @param {string|null} [params.scopeId]
 * @param {string} params.createdByActorId
 * @param {string} params.realmId
 * @param {string} [params.title]
 * @param {string} [params.avatarUrl]
 *
 * @returns {Promise<{ id: string }>}
 */
export async function createConversation({
  isGroup = false,
  conversationKind = null,
  accessMode = 'standard',
  visibility = 'members',
  scopeKind = null,
  scopeId = null,
  createdByActorId,
  realmId,
  title = null,
  avatarUrl = null,
}) {
  if (!createdByActorId || !realmId) {
    throw new Error('[createConversation] missing params')
  }

  const supabase = getSupabaseClient()

  const { data, error } = await supabase
    .schema('chat')
    .from('conversations')
    .insert({
      conversation_kind: conversationKind ?? (isGroup ? 'group' : 'direct'),
      access_mode: accessMode,
      visibility,
      scope_kind: scopeKind,
      scope_id: scopeId,
      created_by_actor_id: createdByActorId,
      realm_id: realmId,
      title,
      avatar_url: avatarUrl,
    })
    .select('id')
    .single()

  if (error || !data) {
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
 * @param {string} [params.accessMode]
 * @param {Array<{ actorId: string, role?: string, membershipStatus?: string, canPost?: boolean, canManage?: boolean, canModerate?: boolean }>} params.members
 */
export async function addConversationMembers({
  conversationId,
  accessMode = 'standard',
  members = [],
}) {
  if (!conversationId || members.length === 0) {
    throw new Error('[addConversationMembers] missing params')
  }

  const rows = members.map((m) => ({
    conversation_id: conversationId,
    actor_id: m.actorId,
    role: m.role || 'member',
    membership_status: m.membershipStatus || 'active',
    can_post: typeof m.canPost === 'boolean'
      ? m.canPost
      : accessMode !== 'announcement',
    can_manage: Boolean(m.canManage),
    can_moderate: Boolean(m.canModerate),
  }))

  const supabase = getSupabaseClient()

  const { error } = await supabase
    .schema('chat')
    .from('conversation_members')
    .insert(rows)

  if (error) {
    throw new Error('[addConversationMembers] insert failed')
  }
}

/* ============================================================
   Update conversation metadata
   ============================================================ */

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

  const supabase = getSupabaseClient()

  const { error } = await supabase
    .schema('chat')
    .from('conversations')
    .update(updates)
    .eq('id', conversationId)

  if (error) {
    throw new Error('[updateConversationMetadata] update failed')
  }
}

/* ============================================================
   Update conversation configuration
   ============================================================ */

export async function updateConversationConfiguration({
  conversationId,
  conversationKind,
  accessMode,
  visibility,
  scopeKind,
  scopeId,
  title,
  avatarUrl,
}) {
  if (!conversationId) {
    throw new Error('[updateConversationConfiguration] conversationId required')
  }

  const updates = {}

  if (conversationKind !== undefined) {
    updates.conversation_kind = conversationKind
  }

  if (accessMode !== undefined) updates.access_mode = accessMode
  if (visibility !== undefined) updates.visibility = visibility
  if (scopeKind !== undefined) updates.scope_kind = scopeKind
  if (scopeId !== undefined) updates.scope_id = scopeId
  if (title !== undefined) updates.title = title
  if (avatarUrl !== undefined) updates.avatar_url = avatarUrl

  if (Object.keys(updates).length === 0) return

  const supabase = getSupabaseClient()

  const { error } = await supabase
    .schema('chat')
    .from('conversations')
    .update(updates)
    .eq('id', conversationId)

  if (error) {
    throw new Error('[updateConversationConfiguration] update failed')
  }
}

/* ============================================================
   Touch last message
   ============================================================ */

export async function updateConversationLastMessage({
  conversationId,
  messageId,
  createdAt,
}) {
  if (!conversationId || !messageId || !createdAt) {
    throw new Error('[updateConversationLastMessage] missing params')
  }

  const supabase = getSupabaseClient()

  const { error } = await supabase
    .schema('chat')
    .from('conversations')
    .update({
      last_message_id: messageId,
      last_message_at: createdAt,
    })
    .eq('id', conversationId)

  if (error) {
    throw new Error('[updateConversationLastMessage] update failed')
  }
}

/* ============================================================
   Soft-remove member (used by leave flows)
   ============================================================ */

export async function deactivateConversationMember({
  conversationId,
  actorId,
}) {
  if (!conversationId || !actorId) {
    throw new Error('[deactivateConversationMember] missing params')
  }

  const supabase = getSupabaseClient()

  const { error } = await supabase
    .schema('chat')
    .from('conversation_members')
    .update({
      membership_status: 'left',
      left_at: new Date().toISOString(),
    })
    .eq('conversation_id', conversationId)
    .eq('actor_id', actorId)

  if (error) {
    throw new Error('[deactivateConversationMember] update failed')
  }
}
