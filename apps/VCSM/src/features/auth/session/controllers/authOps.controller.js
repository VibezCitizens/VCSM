import { readCurrentAuthUserDAL } from '@/features/auth/shared/dal/authSession.read.dal'

export async function readCurrentAuthUser() {
  return readCurrentAuthUserDAL()
}
