import {
  readCurrentAuthUserDAL,
  generateUsernameDAL,
  upsertCompletedOnboardingProfileDAL,
} from '@/features/auth/dal/onboarding.dal'

export async function readCurrentAuthUser() {
  return readCurrentAuthUserDAL()
}

export async function generateUsername(params) {
  return generateUsernameDAL(params)
}

export async function upsertCompletedOnboardingProfile(params) {
  return upsertCompletedOnboardingProfileDAL(params)
}
