import { signInWithPassword } from '@/features/auth/controllers/login.controller'
import { readCurrentAuthUser } from '@/features/auth/controllers/authOps.controller'

export function useAuthOps() {
  return {
    signInWithPassword,
    readCurrentAuthUserDAL: readCurrentAuthUser,
  }
}
