// src/services/legacyMappings.service.js
// ============================================================
// Legacy Mappings Service
// ------------------------------------------------------------
// Maps legacy entities (from learning/vc) to chat schema entities.
//
// Real schema: chat.legacy_mappings
//   id, source_system, source_table, source_id,
//   target_table, target_id, created_at
// ============================================================

import { insertLegacyMappingDAL } from '../dal/legacyMappings.dal.js'

export async function syncLegacyConversationMapping({
  sourceSystem = 'learning',
  conversationId,
}) {
  if (!conversationId) return null

  return insertLegacyMappingDAL({
    sourceSystem,
    sourceTable: 'conversations',
    sourceId: conversationId,
    targetTable: 'conversations',
    targetId: conversationId,
  })
}

export async function syncLegacyMessageMapping({
  sourceSystem = 'learning',
  conversationId,
  messageId,
}) {
  if (!conversationId || !messageId) return null

  return insertLegacyMappingDAL({
    sourceSystem,
    sourceTable: 'messages',
    sourceId: messageId,
    targetTable: 'messages',
    targetId: messageId,
  })
}
