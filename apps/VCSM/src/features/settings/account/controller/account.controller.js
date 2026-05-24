import { dalReadVportIdByActorId } from '@/features/settings/profile/dal/actors.read.dal'
import {
  dalDeleteCitizenAccountFull,
  dalDeleteMyVport,
  dalHardDeleteVport,
  dalRestoreVport,
} from '@/features/settings/account/dal/account.write.dal'

export async function ctrlResolveVportIdByActorId(actorId) {
  return dalReadVportIdByActorId(actorId)
}

export async function ctrlDeleteAccount() {
  await dalDeleteCitizenAccountFull()
}

export async function ctrlSoftDeleteVport({ vportId }) {
  await dalDeleteMyVport(vportId)
}

export async function ctrlHardDeleteVport({ vportId }) {
  await dalHardDeleteVport(vportId)
}

export async function ctrlRestoreVport({ vportId }) {
  await dalRestoreVport(vportId)
}
