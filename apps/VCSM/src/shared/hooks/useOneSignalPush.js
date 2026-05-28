// shared/hooks/useOneSignalPush.js
// Wires OneSignal Web Push into the React lifecycle.
//
// Mount this hook ONCE in a persistent component (e.g. BottomNavBar, same
// pattern as useBootstrapHydration). Do not mount it in routed screens.
//
// Responsibilities:
//   - Call initOneSignal() once on app boot
//   - Login with stable auth user ID after identity is hydrated
//   - Logout on sign-out
//   - Expose: isSupported, permission, isSubscribed, requestPermission()
//
// Does NOT:
//   - Fetch server data
//   - Store server rows in Zustand
//   - Spam the permission prompt automatically

import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@/app/providers/AuthProvider'
import { useIdentity } from '@/features/identity/adapters/identity.adapter'
import {
  initOneSignal,
  requestPushPermission,
  getPushPermissionState,
  loginOneSignalExternalUser,
  logoutOneSignalExternalUser,
} from '@/services/onesignal/onesignalClient'

export function useOneSignalPush() {
  const { user } = useAuth()
  const { identity } = useIdentity()

  const isSupported =
    typeof window !== 'undefined' &&
    'Notification' in window &&
    'serviceWorker' in navigator

  const [permission, setPermission] = useState(() =>
    isSupported ? getPushPermissionState() : 'unsupported'
  )

  // Initialize SDK once — safe to call multiple times, guarded internally
  useEffect(() => {
    if (isSupported) initOneSignal()
  }, [isSupported])

  // Refresh the local permission state on window focus.
  // Notification.permission is not observable via an event, so we re-read it
  // when the user returns to the tab after adjusting OS/browser settings.
  useEffect(() => {
    if (!isSupported) return
    const sync = () => setPermission(getPushPermissionState())
    window.addEventListener('focus', sync)
    return () => window.removeEventListener('focus', sync)
  }, [isSupported])

  // Associate the authenticated user's stable ID with the OneSignal subscription
  // once both auth and identity are fully hydrated.
  //
  // Using user.id (Supabase auth layer) rather than identity.actorId because:
  //   - user.id is stable across actor switches (vport ↔ user profile)
  //   - actorId changes when the user switches to a different vport
  //   - VPORT/actor-specific push routing is handled in backend targeting
  useEffect(() => {
    if (user?.id && identity?.actorId) {
      loginOneSignalExternalUser(user.id)
    }
  }, [user?.id, identity?.actorId])

  // Remove external ID association when the user signs out
  useEffect(() => {
    if (!user) {
      logoutOneSignalExternalUser()
    }
  }, [user])

  const requestPermission = useCallback(async () => {
    const next = await requestPushPermission()
    setPermission(next)
    return next
  }, [])

  // isSubscribed: permission granted is the reliable synchronous proxy.
  // For a stricter check, use getOneSignalUserId() !== null (async, requires SDK loaded).
  const isSubscribed = permission === 'granted'

  return {
    isSupported,
    permission,   // 'default' | 'granted' | 'denied' | 'unsupported'
    isSubscribed,
    requestPermission,
  }
}
