export { useSignupConsent } from '@/features/legal/hooks/useSignupConsent'
export { useLegalConsent } from '@/features/legal/hooks/useLegalConsent'
export { default as ConsentGateScreen } from '@/features/legal/screens/ConsentGateScreen'
// Controller function exported for cross-feature callers (e.g. join controller) that
// cannot use React hooks but need to record signup consent at account creation time.
export { recordSignupConsent } from '@/features/legal/controllers/legalConsent.controller'
