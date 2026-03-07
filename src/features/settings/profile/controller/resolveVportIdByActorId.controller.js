import { dalReadVportIdByActorId } from '@/features/settings/profile/dal/actors.read.dal'

export async function ctrlResolveVportIdByActorId(actorId) {
  return dalReadVportIdByActorId(actorId)
}
