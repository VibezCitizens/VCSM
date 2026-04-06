export function ConversationMemberModel(raw) {
  if (!raw) return null

  const actor = raw.actor || {}
  const role = raw.role ?? 'member'
  const membershipStatus =
    raw.membership_status ??
    (raw.is_active === false ? 'inactive' : 'active')
  const isActive = membershipStatus === 'active'

  return {
    actorId:        raw.actor_id,
    kind:           actor.kind ?? null,
    displayName:    actor.display_name ?? null,
    username:       actor.username ?? null,
    photoUrl:       actor.photo_url ?? null,
    vportName:      actor.vport_name ?? null,
    vportSlug:      actor.vport_slug ?? null,
    vportAvatarUrl: actor.vport_avatar_url ?? null,
    role,
    isActive,
    membershipStatus,
    canPost:        typeof raw.can_post === 'boolean' ? raw.can_post : isActive,
    canManage:      typeof raw.can_manage === 'boolean'
      ? raw.can_manage
      : role === 'owner' || role === 'admin',
    canModerate:    typeof raw.can_moderate === 'boolean'
      ? raw.can_moderate
      : role === 'owner' || role === 'admin',
  }
}
