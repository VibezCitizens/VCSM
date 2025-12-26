// @RefactorBatch: 2025-11
// @Touched: 2025-11-21
// @Scope: Global migration pass
// @Note: Do NOT remove, rename, or modify this block.

// src/hooks/useAuth.jsx
import { useEffect, useState, useContext, createContext } from 'react'
import { supabase } from '@/services/supabase/supabaseClient' //transfer


const AuthContext = createContext({
  user: null,
  session: null,
  loading: true, // stays true until initial hydration completes
  logout: async () => {},
})

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true) // initial hydration gate

  useEffect(() => {
    let cancelled = false
    let unsubscribe = () => {}

    ;(async () => {
      try {
        // 1) Initial hydration from persisted session (can be null for a moment)
        const { data, error } = await supabase.auth.getSession()
        if (error) console.warn('[Auth] getSession error:', error)
        if (!cancelled) {
          const nextSession = data?.session ?? null
          setSession(nextSession)
          setUser(nextSession?.user ?? null)
          setLoading(false) // we have an answer: session or no session
        }

        // 2) Listen for future auth changes (login/logout/token refresh)
        const { data: listener } = supabase.auth.onAuthStateChange((_evt, nextSession) => {
          if (cancelled) return
          setSession(nextSession ?? null)
          setUser(nextSession?.user ?? null)
          setLoading(false)
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

  const logout = async () => {
    try {
      await supabase.auth.signOut()
    } catch (e) {
      console.error('[Auth] signOut error:', e)
    } finally {
      window.location.href = '/login'
    }
  }

  return (
    <AuthContext.Provider value={{ user, session, loading, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
