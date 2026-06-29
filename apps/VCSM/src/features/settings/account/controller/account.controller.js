import { dalReadVportIdByActorId } from '@/features/settings/profile/dal/actors.read.dal'
import { dalReadActorIdByVportId } from '@/features/settings/account/dal/account.read.dal'
import {
  dalDeleteCitizenAccountFull,
  dalDeleteMyVport,
  dalHardDeleteVport,
  dalRestoreVport,
} from '@/features/settings/account/dal/account.write.dal'
import { assertActorOwnsActorController, assertSessionOwnsActorController } from '@/features/authorization/adapters/authorization.adapter'

export async function ctrlResolveVportIdByActorId(actorId) {
  return dalReadVportIdByActorId(actorId)
}

export async function ctrlDeleteAccount() {
  await dalDeleteCitizenAccountFull()
}

export async function ctrlSoftDeleteVport({ vportId }) {
  if (!vportId) throw new Error('ctrlSoftDeleteVport: vportId is required')

  const vportActorId = await dalReadActorIdByVportId(vportId)
  if (!vportActorId) throw new Error('ctrlSoftDeleteVport: vport actor not found')

  // V12B-M2: canonical VPORT-ONLY session bind. The lifecycle subject is always a
  // vport actor, so assert the authenticated session owns it (via vc.actor_owners)
  // before the soft-delete RPC. Defense-in-depth over the DEFINER RPC (12B-DB-2).
  await assertSessionOwnsActorController({ targetActorId: vportActorId })

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
  if (!vportId) throw new Error('ctrlRestoreVport: vportId is required')

  const vportActorId = await dalReadActorIdByVportId(vportId)
  if (!vportActorId) throw new Error('ctrlRestoreVport: vport actor not found')

  // V12B-M2: same canonical VPORT-ONLY session bind before the restore RPC. The
  // restore subject is a soft-deleted (is_deleted=true) vport whose actor stays
  // non-void and owner-linked (verified: vc.actors has separate is_void/is_deleted
  // flags; the owner reads soft-deleted vports via actor_owners; the gate's
  // readActorByIdDAL rejects only is_void — the identical check already gates
  // hard-delete on the same soft-deleted state), so the gate admits the legitimate
  // owner and rejects everyone else.
  await assertSessionOwnsActorController({ targetActorId: vportActorId })

  await dalRestoreVport(vportId)
}
