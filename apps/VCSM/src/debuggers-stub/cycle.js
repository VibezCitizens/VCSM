// Production stub — all debugger functions are no-ops in production builds
export function debugUserChanged() {}
export function debugCycleId() { return 0 }
export function onCycleChange() { return () => {} }
export function getCurrentCycleId() { return 0 }
export function getCurrentUserId() { return null }
