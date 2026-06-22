import { bootstrapJoinOnboardingController } from '@/features/auth/onboarding/controllers/onboarding.join.controller'

export function useJoinOnboarding() {
  return {
    bootstrapJoinOnboarding: bootstrapJoinOnboardingController,
  }
}
