// src/services/onesignal/onesignalClient.js
// Safe wrapper over the OneSignal v16 Web SDK.
//
// All functions guard against:
//   - SDK not yet loaded (window.OneSignal missing)
//   - Notification API unsupported
//   - Errors from the SDK itself
//
// Do NOT import this before the page SDK script has had a chance to run.
// initOneSignal() must be called first (queues the init callback).

export { initOneSignal } from './initOneSignal'

let _frozenSdk = null
function os() {
  if (_frozenSdk) return _frozenSdk
  if (typeof window === 'undefined') return null
  const sdk = window.OneSignal ?? null
  if (sdk) _frozenSdk = sdk
  return sdk
}

/**
 * Trigger the browser's native push permission prompt.
 * Returns the native permission state: 'granted' | 'denied' | 'default' | 'unsupported'
 *
 * Call this only in response to a deliberate user action (button click).
 * Browsers may silently ignore prompts that are not user-gesture triggered.
 */
export async function requestPushPermission() {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported'
  const sdk = os()
  if (!sdk) return Notification.permission
  try {
    await sdk.Notifications.requestPermission()
    return Notification.permission
  } catch {
    return Notification.permission
  }
}

/**
 * Returns the OneSignal subscription ID (their internal user/device ID).
 * Null if the SDK is not yet loaded or the user has no active subscription.
 */
export function getOneSignalUserId() {
  return os()?.User?.PushSubscription?.id ?? null
}

/**
 * Associate a stable external ID with the OneSignal subscription.
 * Use the authenticated user's auth ID (not actorId) for cross-actor stability.
 *
 * VPORT / actor-specific push targeting will be handled via backend
 * notification targeting rules (segment filters, tags) rather than
 * per-actor external IDs — implement in the send-push-notification edge fn.
 */
export async function loginOneSignalExternalUser(externalId) {
  if (!externalId) return
  const sdk = os()
  if (!sdk) return
  try {
    await sdk.login(String(externalId))
  } catch (e) {
    if (import.meta.env.DEV) console.warn('[OneSignal] login failed', e)
  }
}

/**
 * Remove the external ID association (call on user sign-out).
 */
export async function logoutOneSignalExternalUser() {
  const sdk = os()
  if (!sdk) return
  try {
    await sdk.logout()
  } catch (e) {
    if (import.meta.env.DEV) console.warn('[OneSignal] logout failed', e)
  }
}

/**
 * Returns the native browser Notification.permission value.
 * 'granted' | 'denied' | 'default' | 'unsupported'
 *
 * Does not require the SDK to be loaded.
 */
export function getPushPermissionState() {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported'
  return Notification.permission
}
