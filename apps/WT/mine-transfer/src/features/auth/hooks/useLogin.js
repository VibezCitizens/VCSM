import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import { signInWithPassword } from '@/auth/controllers/login.controller'
import { ensureProfileDiscoverable } from '@/auth/controllers/profile.controller'
import { hydrateAuthSession } from '@/auth/controllers/authSession.controller'

export function useLogin(onSuccess) {
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e) => {
    e.preventDefault()
    console.log('[useLogin] submit started', {
      email,
      hasPassword: Boolean(password),
      from: location?.state?.from ?? null,
    })
    setError('')
    setLoading(true)

    try {
      const { data, error: signInError } = await signInWithPassword({ email, password })
      if (signInError) throw signInError

      await hydrateAuthSession()

      if (data?.user?.id) {
        try {
          await ensureProfileDiscoverable(data.user.id)
        } catch {
          // Profile mirroring is non-blocking for the LMS login flow.
        }
      }

      const rawFrom = location?.state?.from
      const from =
        typeof rawFrom === 'string'
          ? rawFrom
          : rawFrom && typeof rawFrom === 'object' && typeof rawFrom.pathname === 'string'
            ? rawFrom.pathname + (rawFrom.search || '')
            : null

      const validFrom =
        from && !['/login', '/register', '/reset', '/reset-password', '/forgot-password'].includes(from)
          ? from
          : null

      console.log('[useLogin] login succeeded', {
        userId: data?.user?.id ?? null,
        validFrom,
      })
      await onSuccess?.({ user: data?.user, from: validFrom })
      return true
    } catch (err) {
      console.error('[useLogin] login failed', err)
      setError(err?.message || 'Login failed')
      return false
    } finally {
      setLoading(false)
    }
  }

  return { email, setEmail, password, setPassword, loading, error, handleLogin }
}
