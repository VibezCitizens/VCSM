// @RefactorBatch: 2025-11
// @Touched: 2025-11-21
// @Scope: Global migration pass
// @Note: Do NOT remove, rename, or modify this block.

// src/hooks/useAuth.jsx
import { useEffect, useState, useContext, createContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthInit } from '@/features/auth/adapters/auth.adapter'
import { dalRemoveAllRealtimeChannels } from '@/services/supabase/channels.dal'
import { hideLaunchSplash } from '@/shared/lib/hideLaunchSplash'
import { clearAllIdentityStorage } from '@/features/identity/identityStorage'
import { debugLoginEvent } from '@debuggers/identity'
import { debugUserChanged } from '@debuggers/cycle'
import { appendIOSProdDebugLog } from '@/shared/lib/iosProdDebugger'


// ─── Recovery permit ─────────────────────────────────────────────────────────
// TICKET-AUTH-RESET-SECURITY-001
//
// Written ONLY inside the PASSWORD_RECOVERY event handler below, AFTER
// auth-register-recovery (Edge Function) validates the session and issues a
// server-side permit row in platform.auth_recovery_permits.
//
// The value stored is { permitId: <server-issued-uuid>, issuedAt: <ms> }.
// The permitId is validated server-side by auth-reset-password-secure before
// any password update is allowed. A forged permitId that does not exist in
// the DB for the caller's verified user_id is rejected with 403.
//
// ⚠ sessionStorage is user-writable. A user who forges a UUID-shaped value here
// still cannot pass the server-side permit check — the DB row must exist.
// This entry is a UX hint, not the security boundary.
//
// Key must stay in sync with RECOVERY_PERMIT_KEY in setNewPassword.controller.js.
const RECOVERY_FLAG_KEY = 'vc.auth.recovery'
function _setRecoveryFlag(permitId) {
  try {
    sessionStorage.setItem(
      RECOVERY_FLAG_KEY,
      JSON.stringify({ permitId, issuedAt: Date.now() }),
    )
  } catch (_) {}
}
function _clearRecoveryFlag() {
  try { sessionStorage.removeItem(RECOVERY_FLAG_KEY) } catch (_) {}
}
// ─────────────────────────────────────────────────────────────────────────────

const AuthContext = createContext({
  user: null,
  loading: true, // stays true until initial hydration completes
  logout: async () => {},
  logoutAllSessions: async () => {},
})

export function AuthProvider({ children }) {
  const {
    hydrateSession: dalHydrateAuthSession,
    subscribeAuthState: dalSubscribeAuthStateChange,
    signOut: dalSignOut,
    registerRecoveryPermit: dalRegisterRecoveryPermit,
  } = useAuthInit()
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true) // initial hydration gate

  useEffect(() => {
    let cancelled = false
    let unsubscribe = () => {}

    ;(async () => {
      try {
        // 1) Initial hydration from persisted session (can be null for a moment)
        debugLoginEvent('SESSION_HYDRATE_START', { phase: 'session', status: 'start' })
        const { data, error } = await dalHydrateAuthSession()
        if (error) console.warn('[Auth] getSession error:', error)
        if (!cancelled) {
          const nextSession = data?.session ?? null
          setSession(nextSession)
          setUser(nextSession?.user ?? null)
          setLoading(false)
          appendIOSProdDebugLog('auth_session_hydrated', {
            hasSession: !!nextSession,
            userId: nextSession?.user?.id ?? null,
          })
          debugUserChanged(nextSession?.user?.id ?? null)
          debugLoginEvent(nextSession ? 'SESSION_HYDRATE_DONE' : 'SESSION_HYDRATE_EMPTY', {
            phase: 'session',
            status: nextSession ? 'success' : 'info',
            payload: { userId: nextSession?.user?.id ?? null, email: nextSession?.user?.email ?? null },
          })
        }

        // 2) Listen for future auth changes (login/logout/token refresh)
        const subscription = dalSubscribeAuthStateChange((_evt, nextSession) => {
          if (cancelled) return
          const nextUserId = nextSession?.user?.id ?? null
          appendIOSProdDebugLog('auth_state_change', {
            event: _evt,
            userId: nextUserId,
            hasSession: !!nextSession,
          })
          debugLoginEvent('AUTH_STATE_CHANGE', {
            phase: 'auth',
            status: 'info',
            message: _evt,
            payload: { event: _evt, userId: nextUserId },
          })

          // PASSWORD_RECOVERY: the user clicked a password reset link.
          // Register a server-side permit via auth-register-recovery Edge Function,
          // then store the permitId and navigate. Navigation is deferred until the
          // permit registration resolves (success or failure) so that
          // resolveRecoverySessionController finds the permit already in storage.
          // Falls through — setUser/setSession run synchronously below.
          if (_evt === 'PASSWORD_RECOVERY') {
            ;(async () => {
              try {
                const permitId = await dalRegisterRecoveryPermit()
                _setRecoveryFlag(permitId)
              } catch (_err) {
                // Edge Function call failed. Navigate without a stored permit —
                // /reset-password will resolve to invalid state after its timeout.
              } finally {
                appendIOSProdDebugLog('auth_password_recovery', { userId: nextUserId })
                if (!cancelled) navigate('/reset-password', { replace: true })
              }
            })()
          }

          // Clear the recovery flag on any non-recovery auth transition so a stale flag
          // cannot open the reset form after logout, re-login, or password update.
          if (_evt === 'SIGNED_IN' || _evt === 'SIGNED_OUT' || _evt === 'USER_UPDATED') {
            _clearRecoveryFlag()
          }

          // KRAVEN-LOGIN-M02: guard must only short-circuit on TOKEN_REFRESHED, not
          // on USER_UPDATED. For USER_UPDATED the user object carries new email/metadata
          // and must always be applied — otherwise AuthContext holds a stale user.
          // For TOKEN_REFRESHED the userId is unchanged and nothing meaningful changed,
          // so skipping the update prevents unnecessary re-renders across all consumers.
          setUser((prev) => {
            if (_evt === 'TOKEN_REFRESHED' && prev?.id === nextUserId && nextUserId != null) return prev
            return nextSession?.user ?? null
          })
          setSession((prev) => {
            if (prev?.access_token === nextSession?.access_token) return prev
            return nextSession ?? null
          })
          setLoading(false)
          debugUserChanged(nextUserId)
          if (!nextSession) {
            debugLoginEvent('SESSION_CLEARED', { phase: 'session', status: 'warn', message: 'Session became null' })
          }
        })

        unsubscribe = () => subscription?.unsubscribe?.()
      } catch (e) {
        console.error('[Auth] init error:', e)
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
      unsubscribe()
    }
  }, [])

  const logout = async (navState = {}) => {
    appendIOSProdDebugLog('auth_logout_start', { userId: user?.id ?? null })
    debugLoginEvent('AUTH_SIGNOUT_START', { phase: 'auth', status: 'start', payload: { userId: user?.id ?? null } })

    // Optimistic local transition: show /login immediately.
    setSession(null)
    setUser(null)
    setLoading(false)

    localStorage.removeItem('actor_kind')
    localStorage.removeItem('actor_vport_id')
    localStorage.setItem('actor_touch', String(Date.now()))
    clearAllIdentityStorage()

    // Clear identity debug sessionStorage and the recovery flow flag
    try {
      sessionStorage.removeItem('vcsm.debug.identity.events')
      sessionStorage.removeItem('vcsm.debug.identity.snapshots')
      sessionStorage.removeItem('vcsm.debug.switch.attempts')
      sessionStorage.removeItem('vcsm.debug.switch.lastRequestedActorId')
      sessionStorage.removeItem(RECOVERY_FLAG_KEY)
    } catch (_) {}

    window.dispatchEvent(
      new CustomEvent('actor:changed', {
        detail: { kind: 'profile', id: null },
      })
    )

    hideLaunchSplash()
    navigate('/login', { replace: true, state: navState })

    try {
      // LOKI AD-01/AD-02: scope:'local' is intentional — other active sessions remain valid.
      // This is expected multi-device behavior for a social platform. If full session
      // revocation is ever required by policy, change scope to 'global'.
      await dalSignOut('local')
      debugLoginEvent('AUTH_SIGNOUT_SUCCESS', { phase: 'auth', status: 'success' })
    } catch (e) {
      console.error('[Auth] signOut error:', e)
      debugLoginEvent('AUTH_SIGNOUT_ERROR', { phase: 'auth', status: 'error', message: e?.message })
      // TICKET-AUTH-ARCH-001: if signOut() fails, manually evict the persisted session so
      // autoRefreshToken cannot re-hydrate it on the next page load or tab open.
      try { localStorage.removeItem('sb-auth-main') } catch (_) {}
    }

    dalRemoveAllRealtimeChannels()

    debugLoginEvent('LOGOUT_DONE', { phase: 'auth', status: 'success', message: 'All state cleared' })
  }

  const logoutAllSessions = async (navState = {}) => {
    appendIOSProdDebugLog('auth_logout_all_start', { userId: user?.id ?? null })
    debugLoginEvent('AUTH_SIGNOUT_ALL_START', { phase: 'auth', status: 'start', payload: { userId: user?.id ?? null } })

    setSession(null)
    setUser(null)
    setLoading(false)

    localStorage.removeItem('actor_kind')
    localStorage.removeItem('actor_vport_id')
    localStorage.setItem('actor_touch', String(Date.now()))
    clearAllIdentityStorage()

    try {
      sessionStorage.removeItem('vcsm.debug.identity.events')
      sessionStorage.removeItem('vcsm.debug.identity.snapshots')
      sessionStorage.removeItem('vcsm.debug.switch.attempts')
      sessionStorage.removeItem('vcsm.debug.switch.lastRequestedActorId')
      sessionStorage.removeItem(RECOVERY_FLAG_KEY)
    } catch (_) {}

    window.dispatchEvent(new CustomEvent('actor:changed', { detail: { kind: 'profile', id: null } }))
    hideLaunchSplash()
    navigate('/login', { replace: true, state: navState })

    try {
      // TICKET-AUTH-LOGOUT-ALL-001: scope:'global' revokes all sessions across all devices.
      await dalSignOut('global')
      debugLoginEvent('AUTH_SIGNOUT_ALL_SUCCESS', { phase: 'auth', status: 'success' })
    } catch (e) {
      console.error('[Auth] signOut(global) error:', e)
      debugLoginEvent('AUTH_SIGNOUT_ALL_ERROR', { phase: 'auth', status: 'error', message: e?.message })
      try { localStorage.removeItem('sb-auth-main') } catch (_) {}
    }

    dalRemoveAllRealtimeChannels()

    debugLoginEvent('LOGOUT_ALL_DONE', { phase: 'auth', status: 'success', message: 'All sessions revoked' })
  }

  return (
    <AuthContext.Provider value={{ user, loading, logout, logoutAllSessions }}>
      {children}
    </AuthContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  return useContext(AuthContext)
}
