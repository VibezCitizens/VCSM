// src/features/chat/inbox/lib/buildInboxPreview.js
// ============================================================
// buildInboxPreview
// ------------------------------------------------------------
// - UI adapter
// - Actor-aware
// - Owner-safe
// - No IO
// ============================================================

export default function buildInboxPreview({ entry, currentActorId }) {
  if (!entry || !currentActorId) return null

  const {
    conversationId,
    unreadCount = 0,
    pinned = false,
    muted = false,
    archived = false,

    lastMessageAt = null,
    lastMessageId = null,

    // some inbox models already provide a preview string
    preview: modeledPreview = null,

    // sometimes you have lastMessageBody, sometimes you don’t
    lastMessageBody = null,

    // ✅ already present from InboxEntryModel
    partnerActorId: modeledPartnerActorId = null,
    partnerKind: modeledPartnerKind = null,
    partnerDisplayName: modeledPartnerDisplayName = null,
    partnerUsername: modeledPartnerUsername = null,
    partnerPhotoUrl: modeledPartnerPhotoUrl = null,

    members = [],
  } = entry

  if (!conversationId) return null

  // Prefer members (if present), otherwise fallback to modeled partner fields
  const partnerFromMembers =
    Array.isArray(members) && members.length > 0
      ? members.find((m) => m?.actorId && m.actorId !== currentActorId) ?? null
      : null

  const displayActor = partnerFromMembers ?? {
    actorId: modeledPartnerActorId ?? currentActorId,
    kind: modeledPartnerKind ?? null,
    displayName: modeledPartnerDisplayName ?? 'Conversation',
    username: modeledPartnerUsername ?? null,
    photoUrl: modeledPartnerPhotoUrl ?? '/avatar.jpg',
  }

  const bodyText = (lastMessageBody ?? '').toString().trim()
  const modeledText = (modeledPreview ?? '').toString().trim()

  // ✅ Preview priority:
  // 1) actual message body (if available)
  // 2) modeled preview (if your query/model already provided it)
  // 3) fallback label if we *know* there is a last message
  // 4) unread fallback
  const previewText =
    bodyText.length > 0
      ? bodyText
      : modeledText.length > 0
        ? modeledText
        : lastMessageId
          ? 'Message'
          : unreadCount > 0
            ? 'New message'
            : ''

  return {
    conversationId,
    unreadCount,
    pinned,
    muted,
    archived,
    lastMessageAt,
    lastMessageId,

    partnerActorId: displayActor.actorId,
    partnerKind: displayActor.kind,
    partnerDisplayName: displayActor.displayName,
    partnerUsername: displayActor.username,
    partnerPhotoUrl: displayActor.photoUrl,

    preview: previewText,
  }
}
