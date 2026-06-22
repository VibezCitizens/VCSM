import { readCurrentAuthUserDAL } from '@/features/auth/shared/dal/authSession.read.dal'
import { ensureProfileShell } from '@/features/auth/gates/controllers/profileShell.controller'

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
