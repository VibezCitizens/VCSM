// src/features/chat/inbox/lib/buildInboxPreview.js
// ============================================================
// buildInboxPreview
// ------------------------------------------------------------
// - UI adapter
// - Actor-aware
// - Owner-safe
// - No IO
// ============================================================

export default function buildInboxPreview({
  entry,
  currentActorId,
}) {
  if (!entry || !currentActorId) return null

  const {
    conversationId,
    unreadCount,
    pinned,
    muted,
    archived,
    lastMessageAt,
    members = [],
  } = entry

  if (!Array.isArray(members) || members.length === 0) {
    return null
  }

  // Try to resolve "the other actor"
  const partner = members.find(
    (m) => m.actorId && m.actorId !== currentActorId
  )

  // OWNER / FALLBACK SAFE
  const displayActor = partner ?? {
    actorId: currentActorId,
    kind: null,
    displayName: 'Conversation',
    username: null,
    photoUrl: '/avatar.jpg',
  }

  return {
    conversationId,
    unreadCount,
    pinned,
    muted,
    archived,
    lastMessageAt,

    partnerActorId: displayActor.actorId,
    partnerKind: displayActor.kind,
    partnerDisplayName: displayActor.displayName,
    partnerUsername: displayActor.username,
    partnerPhotoUrl: displayActor.photoUrl,

    preview: unreadCount > 0 ? 'New message' : '',
  }
}
