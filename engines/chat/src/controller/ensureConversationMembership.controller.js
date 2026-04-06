import {
  readConversationMembershipDAL,
} from '../dal/conversationMembership.read.dal.js'
import {
  setConversationMembershipStatusDAL,
} from '../dal/conversationMembership.write.dal.js'

export async function ensureConversationMembership({ conversationId, actorId }) {
  if (!conversationId || !actorId) return

  const membership = await readConversationMembershipDAL({ conversationId, actorId })

  // Already active — nothing to do
  if (membership?.membership_status === 'active') return

  // Row exists but inactive — re-activate
  if (membership && membership.membership_status !== 'active') {
    await setConversationMembershipStatusDAL({
      conversationId,
      actorId,
      membershipStatus: 'active',
    })
    return
  }

  throw new Error('[ensureConversationMembership] actor is not a member of this conversation')
}
