import { dalHydrateAuthSession, dalSubscribeAuthStateChange } from '@/features/auth/shared/dal/authSession.read.dal'
import { dalSignOut } from '@/features/auth/login/dal/login.dal'
import { dalRegisterRecoveryPermit } from '@/features/auth/password-recovery/dal/resetPasswordSecure.dal'

// Stable init primitives for AuthProvider.
// These DAL functions are module-level constants — references never change between renders.
// Exposed as a hook so the adapter boundary is respected: AuthProvider must not import
// auth DAL directly. The hook pattern satisfies §5.3 (adapters export hooks only).
export function useAuthInit() {
  return {
    hydrateSession: dalHydrateAuthSession,
    subscribeAuthState: dalSubscribeAuthStateChange,
    signOut: dalSignOut,
    registerRecoveryPermit: dalRegisterRecoveryPermit,
  }
}
