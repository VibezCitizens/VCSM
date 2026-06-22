import {
  readActorOwnerUserIdDAL,
  readUserActorIdByProfileIdDAL,
} from '@/features/notifications/inbox/dal/resolveVportOwnerActor.read.dal'

export async function resolveVportOwnerActorId(vportActorId) {
  if (!vportActorId) return null

  const ownerUserId = await readActorOwnerUserIdDAL(vportActorId)
  if (!ownerUserId) return null

  return readUserActorIdByProfileIdDAL(ownerUserId)
}
