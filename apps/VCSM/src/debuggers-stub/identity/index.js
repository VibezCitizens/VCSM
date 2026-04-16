// Production stub — all debugger functions are no-ops in production builds
export function IdentityDebugPanel() { return null }
export function debugLoginEvent() {}
export function debugLoginError() {}
export function debugLoginTiming() {}
export function debugLoginSessionSnapshot() {}
export function debugLoginIdentitySnapshot() {}
export function getIdentityDebugState() { return { events: [], snapshots: [] } }
export function clearIdentityDebugEvents() {}
export function subscribeIdentityDebug() { return () => {} }
export function isIdentityDebugEnabled() { return false }
