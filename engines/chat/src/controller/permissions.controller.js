import { createPermissionSnapshot } from '../model/PermissionSnapshot.model.js'

export function getPermissionSnapshot({ actorId, conversation, members }) {
  return createPermissionSnapshot({ actorId, conversation, members })
}
