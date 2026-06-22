import { signInWithPassword } from '@/features/auth/login/controllers/login.controller'
import { readCurrentAuthUser } from '@/features/auth/session/controllers/authOps.controller'

export function useAuthOps() {
  return {
    signInWithPassword,
    readCurrentAuthUserDAL: readCurrentAuthUser,
  }
}
