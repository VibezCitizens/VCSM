// @adapter-rev: 2.0.0 — auth modularization complete (registration, gates, session, onboarding, password-recovery, callback, shared)
// @blast-radius: HIGH — consumed by AuthProvider, route guards, and auth-adjacent features; any export removal is a breaking change
export { useAuthOps } from '@/features/auth/session/hooks/useAuthOps'
export { useAuthInit } from '@/features/auth/session/hooks/useAuthInit'
export { useEmailVerified } from '@/features/auth/gates/hooks/useEmailVerified'
export { useJoinOnboarding } from '@/features/auth/onboarding/hooks/useJoinOnboarding'
export { authTheme } from '@/features/auth/shared/styles/authTheme'
export { default as CompleteProfileGate } from '@/features/auth/gates/screens/CompleteProfileGateScreen'
export { default as VerifyEmailRequiredScreen } from '@/features/auth/gates/screens/VerifyEmailRequiredScreen'
export { default as ConsentCheckbox } from '@/features/auth/components/ConsentCheckbox'
