import { dalReadVportIdByActorId } from '@/features/settings/account/dal/account.read.dal'
import {
  dalDeleteMyAccount,
  dalDeleteMyVport,
  dalDeleteOwnedVportById,
} from '@/features/settings/account/dal/account.write.dal'

export async function ctrlResolveVportIdByActorId(actorId) {
  return dalReadVportIdByActorId(actorId)
}

export async function ctrlDeleteAccount() {
  await dalDeleteMyAccount()
}

export async function ctrlDeleteVport({ vportId, userId }) {
  try {
    await dalDeleteMyVport(vportId)
  } catch (_rpcError) {
    await dalDeleteOwnedVportById({ vportId, userId })
  }
}
