import { acceptVibeInviteByCodeDAL } from '@/features/initiation/dal/vibeInvites.dal'

export async function acceptCitizenInviteAttribution({ citizenInviteCode, acceptedActorId }) {
  if (!citizenInviteCode || !acceptedActorId) return null

  return acceptVibeInviteByCodeDAL(citizenInviteCode, acceptedActorId)
}
