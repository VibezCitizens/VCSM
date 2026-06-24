import { dalReadVportIdByActorId } from '@/features/settings/profile/dal/actors.read.dal'
import { dalReadActorIdByVportId } from '@/features/settings/account/dal/account.read.dal'
import {
  dalDeleteCitizenAccountFull,
  dalDeleteMyVport,
  dalHardDeleteVport,
  dalRestoreVport,
} from '@/features/settings/account/dal/account.write.dal'
import { assertActorOwnsActorController } from '@/features/authorization/adapters/authorization.adapter'

export async function ctrlResolveVportIdByActorId(actorId) {
  return dalReadVportIdByActorId(actorId)
}

export async function ctrlDeleteAccount() {
  await dalDeleteCitizenAccountFull()
}

export async function ctrlSoftDeleteVport({ vportId }) {
  await dalDeleteMyVport(vportId)
}

export async function ctrlHardDeleteVport({ vportId, callerActorId }) {
  if (!vportId) throw new Error('ctrlHardDeleteVport: vportId is required')
  if (!callerActorId) throw new Error('ctrlHardDeleteVport: callerActorId is required')

  const vportActorId = await dalReadActorIdByVportId(vportId)
  if (!vportActorId) throw new Error('ctrlHardDeleteVport: vport actor not found')

  await assertActorOwnsActorController({ requestActorId: callerActorId, targetActorId: vportActorId })
  await dalHardDeleteVport(vportId)
}

export async function ctrlRestoreVport({ vportId }) {
  await dalRestoreVport(vportId)
}
