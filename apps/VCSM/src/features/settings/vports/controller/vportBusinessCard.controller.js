import { setVportBusinessCardPublishStateDAL } from '@/features/settings/vports/dal/vports.write.dal'
import { checkVportOwnershipController } from '@/features/vportDashboard/adapters/vportDashboard.adapter'

// VPORT-DASHBOARD-OWNERSHIP-CONSISTENCY-001: authorize the active VPORT actor through
// the same vportDashboard ownership surface the gas dashboard uses, with VPORT-safe wording.
const OWNERSHIP_DENIED_MESSAGE = 'Only owners or managers can manage this VPORT.'

export async function ctrlSetVportBusinessCardPublishState({ vportId, published, callerActorId, vportActorId }) {
  if (!callerActorId) throw new Error('ctrlSetVportBusinessCardPublishState: callerActorId required')
  if (!vportActorId) throw new Error('ctrlSetVportBusinessCardPublishState: vportActorId required')
  const isOwner = await checkVportOwnershipController({ callerActorId, targetActorId: vportActorId })
  if (!isOwner) throw new Error(OWNERSHIP_DENIED_MESSAGE)
  return setVportBusinessCardPublishStateDAL(vportId, published)
}
