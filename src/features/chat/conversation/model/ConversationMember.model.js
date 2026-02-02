// src/features/chat/conversation/model/ConversationMember.model.js

export function ConversationMemberModel(raw) {
  if (!raw) return null

  const actor = raw.actor || {}

  return {
    actorId: raw.actor_id,

    // actor core
    kind: actor.kind ?? null,

    // USER
    displayName: actor.display_name ?? null,
    username: actor.username ?? null,
    photoUrl: actor.photo_url ?? null,

    // VPORT
    vportName: actor.vport_name ?? null,
    vportSlug: actor.vport_slug ?? null,
    vportAvatarUrl: actor.vport_avatar_url ?? null,

    // membership
    role: raw.role ?? 'member',
    isActive: Boolean(raw.is_active),

    _raw: raw,
  }
}