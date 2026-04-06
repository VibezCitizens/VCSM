// src/features/identity/useWentrexIdentity.js
// ============================================================
// Wentrex Identity Feature — Public Exports
// ------------------------------------------------------------
// This is the approved entry point for Wentrex screens/components
// to consume identity. No direct @identity imports allowed
// outside the features/identity boundary.
// ============================================================

export {
  useWentrexIdentity,
  useWentrexActorId,
} from './WentrexIdentityContext.jsx'

export { wentrexCanAccess, wentrexDestinationFromRoleKeys } from './wentrexAccess.js'

// Re-export engine stateless utilities that Wentrex UI needs
export { logoutCleanup } from '@identity'
