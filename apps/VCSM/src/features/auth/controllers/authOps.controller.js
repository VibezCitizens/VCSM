import { readCurrentAuthUserDAL } from '@/features/auth/dal/onboarding.dal'

export async function readCurrentAuthUser() {
  return readCurrentAuthUserDAL()
}
