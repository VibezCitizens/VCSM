import { sendCitizenInviteDAL } from '../dal/invite.dal'
import { markActorOnboardingStepCompletedDAL } from '@/features/onboarding/dal/onboardingSteps.dal'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * Validates input and sends a citizen invite via the edge function.
 *
 * @param {{ targetEmail: string, inviterType: 'citizen'|'vport', inviterActorId?: string|null }} params
 * @returns {{ ok: boolean, code?: string }}
 * @throws Error on network/function failure
 */
export async function ctrlSendCitizenInvite({ targetEmail, inviterType, inviterActorId = null }) {
  const email = (targetEmail ?? '').trim()

  if (!email || !EMAIL_RE.test(email)) {
    throw new Error('INVALID_EMAIL')
  }

  if (!inviterType || (inviterType !== 'citizen' && inviterType !== 'vport')) {
    throw new Error('INVALID_INVITER_TYPE')
  }

  return sendCitizenInviteDAL({ targetEmail: email, inviterType, inviterActorId })
}

export async function ctrlMarkInviteStepCompleted({ actorId }) {
  await markActorOnboardingStepCompletedDAL({ actorId, stepKey: 'invite_first_citizen' })
}
