export { useSignupConsent } from '@/features/legal/hooks/useSignupConsent'
export { useLegalConsent } from '@/features/legal/hooks/useLegalConsent'
export { default as ConsentGateScreen } from '@/features/legal/screens/ConsentGateScreen'
// Controller functions exported for cross-feature callers that cannot use React hooks.
export { recordSignupConsent } from '@/features/legal/controllers/legalConsent.controller'
// Cache invalidation exported so auth logout can clear stale consent state without
// importing across feature internals directly (adapter boundary contract).
export {
  invalidateLegalDocsCache,
  invalidateConsentCache,
} from '@/features/legal/controllers/legalConsent.controller'
