// @RefactorBatch: 2025-11
// @Touched: 2025-11-21
// @Status: FULLY MIGRATED
// @Scope: Architecture rewrite
// @Note: Do NOT remove, rename, or modify this block.

import { useState } from 'react'
import { signInWithPassword } from '@/features/auth/adapter/auth.adapter'
import { ensureProfileDiscoverable } from '@/features/auth/controllers/profile.controller'
import { supabase } from '@/services/supabase/supabaseClient'

/**
 * useLogin
 *
 * Hook Contract:
 * - Owns UI state (email, password, loading, error)
 * - Orchestrates timing of login flow
 * - Delegates meaning to controllers
 * - Performs navigation as a UI side-effect
 */
export function useLogin(navigate, location) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // 1) Authenticate (adapter)
      const { data, error: signInError } = await signInWithPassword({
        email,
        password,
      })
      if (signInError) throw signInError

      // 2) Force session sync (RLS safety)
      await supabase.auth.getSession()

      // 3) Domain meaning (controller)
      if (data?.user?.id) {
        await ensureProfileDiscoverable(data.user.id)
      }

      // 4) Navigate
      const from = location.state?.from?.pathname
      const dest =
        from && !['/login', '/register', '/reset', '/forgot-password'].includes(from)
          ? from
          : '/feed'

      navigate(dest, { replace: true })
    } catch (err) {
      setError(err?.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return {
    email,
    setEmail,
    password,
    setPassword,
    loading,
    error,
    handleLogin,
  }
}
