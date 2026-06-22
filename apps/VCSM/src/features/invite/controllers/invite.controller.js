import { sendCitizenInviteDAL } from '../dal/invite.dal'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const CODE_MESSAGES = {
  USER_ALREADY_REGISTERED: 'This email already has an account.',
  SELF_INVITE:             "You can't invite yourself.",
  INVITE_FAILED:           'Invite could not be sent. Try again.',
  EMAIL_SEND_FAILED:       'Invite saved but the email could not be sent. Try again.',
  INVALID_EMAIL:           'Enter a valid email address.',
  INVALID_INVITER_TYPE:    'Inviter type is missing.',
}

export function codeToInviteMessage(code) {
  return CODE_MESSAGES[code] ?? 'Something went wrong. Please try again.'
}

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
