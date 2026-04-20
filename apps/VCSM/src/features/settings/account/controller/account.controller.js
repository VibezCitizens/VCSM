import { dalReadVportIdByActorId } from '@/features/settings/account/dal/account.read.dal'
import {
  dalSoftDeleteCitizenAccount,
  dalDeleteMyVport,
  dalHardDeleteVport,
} from '@/features/settings/account/dal/account.write.dal'
import { restoreVport } from '@/features/vport/dal/vport.core.dal'

export async function ctrlResolveVportIdByActorId(actorId) {
  return dalReadVportIdByActorId(actorId)
}

export async function ctrlDeleteAccount() {
  await dalSoftDeleteCitizenAccount()
}

export async function ctrlSoftDeleteVport({ vportId }) {
  await dalDeleteMyVport(vportId)
}

export async function ctrlHardDeleteVport({ vportId }) {
  await dalHardDeleteVport(vportId)
}

export async function ctrlRestoreVport({ vportId }) {
  await restoreVport(vportId)
}
