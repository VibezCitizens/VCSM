// src/features/chat/lib/normalizeConversation.js
// ============================================================
// normalizeConversation
// ------------------------------------------------------------
// - Pure function
// - Actor-based conversation normalization
// - Safe for UI, hooks, and caching
// ============================================================

export default function normalizeConversation(raw) {
  if (!raw) return null

  return {
    id: raw.id,

    // structure
    isGroup: Boolean(raw.is_group),
    isStealth: Boolean(raw.is_stealth),

    // creator
    createdByActorId: raw.created_by_actor_id,

    // display
    title: raw.title || null,
    avatarUrl: raw.avatar_url || null,

    // last message
    lastMessageId: raw.last_message_id || null,
    lastMessageAt: raw.last_message_at || null,

    // realm
    realmId: raw.realm_id,

    // timestamps
    createdAt: raw.created_at,

    // raw passthrough (debug / escape hatch)
    _raw: raw,
  }
}
