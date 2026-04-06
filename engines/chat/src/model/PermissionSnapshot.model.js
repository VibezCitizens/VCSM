import { canManageMembers as checkCanManageMembers } from './constants/conversationRoles.js'
import { sameActorRef } from '../utils/actorRefs.js'

export function createPermissionSnapshot({
  actorId,
  actorSource = null,
  conversation,
  members,
}) {
  if (!actorId || !conversation || !Array.isArray(members)) {
    return {
      canViewConversation: false,
      canSendMessage: false,
      canEditOwnMessage: false,
      canHideMessage: false,
      canDeleteOwnMessage: false,
      canDeleteAnyMessage: false,
      canManageMembers: false,
      canLeaveConversation: false,
      canArchiveConversation: false,
      canMarkConversationSpam: false,
      canModerate: false,
    }
  }

  const membership = members.find(
    (m) =>
      sameActorRef(
        { actorId, actorSource },
        { actorId: m.actorId, actorSource: m.actorSource }
      ) && m.isActive
  )

  const isActiveMember = Boolean(membership)
  const role = membership?.role ?? null
  const canSend = Boolean(membership?.canPost)
  const canManage = Boolean(
    membership?.canManage || checkCanManageMembers(role)
  )
  const canModerate = Boolean(
    membership?.canModerate || role === 'owner' || role === 'admin'
  )

  return {
    canViewConversation: isActiveMember,
    canSendMessage: isActiveMember && canSend,
    canEditOwnMessage: isActiveMember,
    canHideMessage: isActiveMember,
    canDeleteOwnMessage: isActiveMember,
    canDeleteAnyMessage: isActiveMember && canModerate,
    canManageMembers: isActiveMember && canManage,
    canLeaveConversation: isActiveMember,
    canArchiveConversation: isActiveMember,
    canMarkConversationSpam: isActiveMember,
    canModerate: isActiveMember && canModerate,
  }
}
