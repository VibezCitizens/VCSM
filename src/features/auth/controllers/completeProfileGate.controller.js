import { readCurrentAuthUserDAL } from '@/features/auth/dal/onboarding.dal'
import { ensureProfileShell } from '@/features/auth/controllers/profileOnboarding.controller'

export async function evaluateCompleteProfileGateController() {
  const user = await readCurrentAuthUserDAL()

  if (!user) {
    return { needsOnboarding: false }
  }

  return ensureProfileShell({
    userId: user.id,
    email: user.email ?? null,
  })
}
