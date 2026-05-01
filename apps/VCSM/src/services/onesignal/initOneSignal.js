// src/services/onesignal/initOneSignal.js
// Initializes the OneSignal Web SDK (v16) once per page lifecycle.
//
// Rules:
//   - SSR / non-browser safe (window guard)
//   - No-op if Notification API unsupported (e.g. iOS PWA without permission)
//   - No-op if VITE_ONESIGNAL_APP_ID is unset
//   - Double-init prevented by module-level flag
//   - notifyButton disabled — permission request is triggered explicitly via
//     requestPushPermission(), not on every load
//   - allowLocalhostAsSecureOrigin: true — required for localhost dev/testing

let _initQueued = false

export function initOneSignal() {
  if (typeof window === 'undefined') return
  if (!('Notification' in window)) return
  if (_initQueued) return
  _initQueued = true

  const appId = import.meta.env.VITE_ONESIGNAL_APP_ID
  if (!appId) {
    if (import.meta.env.DEV) {
      console.warn('[OneSignal] VITE_ONESIGNAL_APP_ID is not set — push notifications disabled')
    }
    return
  }

  window.OneSignalDeferred = window.OneSignalDeferred || []

  window.OneSignalDeferred.push(async function (OneSignal) {
    await OneSignal.init({
      appId,

      // Explicit path so the browser always resolves the SW correctly
      // even when the app is served from a sub-path.
      serviceWorkerPath: 'OneSignalSDKWorker.js',
      serviceWorkerParam: { scope: '/' },

      // Do not show the floating bell — permission is prompted intentionally
      // via requestPushPermission() called from the notifications settings UI.
      notifyButton: { enable: false },

      // Required for http://localhost dev and LAN testing.
      allowLocalhostAsSecureOrigin: true,
    })
  })
}
