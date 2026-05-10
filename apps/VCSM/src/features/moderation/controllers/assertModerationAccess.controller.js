import { isModerationAuthorizedDAL } from '@/features/moderation/dal/assertModerationAccess.dal'

/**
 * Asserts that actorId is authorized to perform moderation actions.
 * Throws a FORBIDDEN error if the check fails.
 * Must be called before any moderation write operation.
 */
export async function assertModerationAccessController(actorId) {
  if (!actorId) {
    const err = new Error('assertModerationAccessController: actorId required')
    err.code = 'FORBIDDEN'
    throw err
  }

  const authorized = await isModerationAuthorizedDAL(actorId)

  if (!authorized) {
    const err = new Error('Forbidden: actor is not authorized to perform moderation actions')
    err.code = 'FORBIDDEN'
    throw err
  }
}
