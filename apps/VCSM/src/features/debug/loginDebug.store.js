// DEPRECATED — re-exports from centralized debuggers/identity
// All consumers should import from '@debuggers/identity' directly.
export {
  isIdentityDebugEnabled as isLoginDebugEnabled,
  addIdentityDebugEvent as addLoginDebugEvent,
  setSessionSnapshot as setLoginDebugSessionSnapshot,
  setIdentitySnapshot as setLoginDebugIdentitySnapshot,
  clearIdentityDebugEvents as clearLoginDebugEvents,
  getIdentityDebugState as getLoginDebugState,
  subscribeIdentityDebug as subscribeLoginDebug,
} from '@debuggers/identity'

export { isIdentityDebugEnabled as setLoginDebugEnabled } from '@debuggers/identity'
