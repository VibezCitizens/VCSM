import {
  readProfileShellDAL,
  upsertProfileShellDAL,
} from '@/features/auth/dal/onboarding.dal'
import { isProfileShellIncompleteModel } from '@/features/auth/model/onboarding.model'

export async function ensureProfileShell({ userId, email }) {
  if (!userId) throw new Error('userId is required')

  const row = await readProfileShellDAL(userId)

  if (!row) {
    const now = new Date().toISOString()
    await upsertProfileShellDAL({
      id: userId,
      email: email ?? null,
      createdAt: now,
      updatedAt: now,
    })

    return { needsOnboarding: true }
  }

  return { needsOnboarding: isProfileShellIncompleteModel(row) }
}
