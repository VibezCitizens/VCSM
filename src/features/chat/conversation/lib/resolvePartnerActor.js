// src/features/chat/conversation/lib/resolvePartnerActor.js
// ============================================================
// resolvePartnerActor
// ------------------------------------------------------------
// - Pure function
// - MODEL-SAFE
// - Actor-kind aware (user | vport | void)
// ============================================================

export default function resolvePartnerActor({
  actorId,
  conversation,
  members,
}) {
  if (!actorId || !conversation || !Array.isArray(members)) {
    return null
  }

  // Group chats do not have a single partner
  if (conversation.isGroup) {
    return null
  }

  // Find the other ACTIVE member
  const partner = members.find(
    (m) => m.actorId !== actorId && m.isActive === true
  )

  if (!partner) {
    return null
  }

 // --------------------------------------------
// VPORT
// --------------------------------------------
if (partner.kind === 'vport') {
  return {
    actorId: partner.actorId,
    kind: 'vport',
    displayName: partner.vportName ?? 'Unknown business',
    username: partner.vportSlug ?? null,
    photoUrl: partner.vportAvatarUrl ?? '/avatar.jpg',
    _member: partner,
  }
}


  // --------------------------------------------
  // USER / VOID
  // --------------------------------------------
  return {
    actorId: partner.actorId,
    kind: partner.kind,

    displayName:
      partner.displayName ||
      partner.username ||
      'Unknown',

    username: partner.username ?? null,
    photoUrl: partner.photoUrl ?? '/avatar.jpg',

    _member: partner,
  }
}
