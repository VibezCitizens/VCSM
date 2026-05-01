import { signInWithPassword } from '@/features/auth/controllers/login.controller'
import { createUserActorForProfile } from '@/features/auth/controllers/createUserActor.controller'
import {
  readCurrentAuthUser,
  generateUsername,
  upsertCompletedOnboardingProfile,
} from '@/features/auth/controllers/authOps.controller'

export function useAuthOps() {
  return {
    signInWithPassword,
    createUserActorForProfile,
    readCurrentAuthUserDAL: readCurrentAuthUser,
    generateUsernameDAL: generateUsername,
    upsertCompletedOnboardingProfileDAL: upsertCompletedOnboardingProfile,
  }
}
