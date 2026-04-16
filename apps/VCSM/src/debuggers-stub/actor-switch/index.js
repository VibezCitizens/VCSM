// Production stub — all debugger functions are no-ops in production builds
export function ActorSwitchDebugPanel() { return null }
export function createSwitchDebugSession() {
  return {
    event() {},
    finish() {},
  }
}
export function getSwitchDebugState() { return { attempts: [], resolutions: [] } }
export function clearSwitchDebugState() {}
export function subscribeSwitchDebug() { return () => {} }
export function isSwitchDebugEnabled() { return false }
export function checkRefreshRestore() {}
export function clearLastSwitchTarget() {}
export function recordVportResolution() {}
export function getVportResolutions() { return [] }
