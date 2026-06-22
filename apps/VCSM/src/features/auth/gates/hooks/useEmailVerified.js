import { isEmailVerifiedModel } from '@/features/auth/gates/model/emailVerification.model'

export function useEmailVerified(user) {
  return isEmailVerifiedModel(user)
}
