// src/features/chat/conversation/permissions/canReadConversation.js (R)

export default function canReadConversation({
  actorId,
  members,
}) {
  if (!actorId || !Array.isArray(members)) {
    return false
  }

  return members.some(
    (m) => m.actorId === actorId && m.isActive === true
  )
}
