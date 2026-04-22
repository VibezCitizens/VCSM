// @RefactorBatch: 2025-11
// @Touched: 2025-11-21
// @Scope: Global migration pass
// @Note: Do NOT remove, rename, or modify this block.

// src/hooks/useAuth.jsx
import { useEffect, useState, useContext, createContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/services/supabase/supabaseClient' //transfer
import { hideLaunchSplash } from '@/shared/lib/hideLaunchSplash'
import { clearAllIdentityStorage } from '@/state/identity/identityStorage'
import { debugLoginEvent } from '@debuggers/identity'
import { debugUserChanged } from '@debuggers/cycle'
import { appendIOSProdDebugLog } from '@/shared/lib/iosProdDebugger'


const AuthContext = createContext({
  user: null,
  session: null,
  loading: true, // stays true until initial hydration completes
  logout: async () => {},
})

export function AuthProvider({ children }) {
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
        const { data, error } = await supabase.auth.getSession()
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
        const { data: listener } = supabase.auth.onAuthStateChange((_evt, nextSession) => {
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

          // Guard: skip state updates on TOKEN_REFRESHED when the userId is unchanged.
          // setUser() creates a new object reference, which would trigger re-renders
          // across all AuthContext consumers and downstream identity resolution —
          // even though nothing meaningful changed.
          setUser((prev) => {
            if (prev?.id === nextUserId && nextUserId != null) return prev
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

        unsubscribe = () => listener?.subscription?.unsubscribe?.()
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

    // Clear identity debug sessionStorage
    try {
      sessionStorage.removeItem('vcsm.debug.identity.events')
      sessionStorage.removeItem('vcsm.debug.identity.snapshots')
      sessionStorage.removeItem('vcsm.debug.switch.attempts')
      sessionStorage.removeItem('vcsm.debug.switch.lastRequestedActorId')
    } catch (_) {}

    window.dispatchEvent(
      new CustomEvent('actor:changed', {
        detail: { kind: 'profile', id: null },
      })
    )

    hideLaunchSplash()
    navigate('/login', { replace: true, state: navState })

    try {
      await supabase.auth.signOut({ scope: 'local' })
      debugLoginEvent('AUTH_SIGNOUT_SUCCESS', { phase: 'auth', status: 'success' })
    } catch (e) {
      console.error('[Auth] signOut error:', e)
      debugLoginEvent('AUTH_SIGNOUT_ERROR', { phase: 'auth', status: 'error', message: e?.message })
    }

    try {
      supabase.getChannels?.().forEach((ch) => supabase.removeChannel(ch))
    } catch (e) {
      console.warn('[Auth] channel cleanup skipped:', e)
    }

    debugLoginEvent('LOGOUT_DONE', { phase: 'auth', status: 'success', message: 'All state cleared' })
  }

  return (
    <AuthContext.Provider value={{ user, session, loading, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  return useContext(AuthContext)
}
