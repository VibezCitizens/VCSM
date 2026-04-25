import { useState } from 'react'
import { signInWithPassword } from '@/features/auth/controllers/login.controller'
import { ensureProfileDiscoverable } from '@/features/auth/controllers/profile.controller'
import { hydrateAuthSession } from '@/features/auth/controllers/authSession.controller'
import { debugLoginEvent, debugLoginError, debugLoginSessionSnapshot } from '@debuggers/identity'

function isEmailNotConfirmedError(error) {
  return String(error?.message ?? '').toLowerCase().includes('email not confirmed')
}

export function useLogin(navigate, location) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    debugLoginEvent('LOGIN_SUBMIT', { phase: 'login', message: 'Form submitted', payload: { email } })

    try {
      debugLoginEvent('SUPABASE_SIGNIN_START', { phase: 'auth', message: 'signInWithPassword called' })
      const t0 = performance.now()
      const { data, error: signInError } = await signInWithPassword({ email, password })
      const signinMs = Math.round(performance.now() - t0)

      if (signInError) {
        debugLoginError('SUPABASE_SIGNIN_ERROR', signInError, { phase: 'auth' })
        if (isEmailNotConfirmedError(signInError)) {
          setError('Please verify your email before continuing.')
          return false
        }
        throw signInError
      }

      debugLoginEvent('SUPABASE_SIGNIN_SUCCESS', {
        phase: 'auth',
        status: 'success',
        message: `Signed in (${signinMs}ms)`,
        payload: { userId: data?.user?.id, email: data?.user?.email },
      })

      debugLoginEvent('SESSION_HYDRATE_START', { phase: 'auth', message: 'Hydrating auth session' })
      await hydrateAuthSession()
      debugLoginEvent('SESSION_HYDRATE_DONE', { phase: 'auth', status: 'success' })

      if (data?.user?.id) {
        await ensureProfileDiscoverable(data.user.id)
      }

      debugLoginSessionSnapshot(data)

      const rawFrom = location?.state?.from
      const from =
        typeof rawFrom === 'string'
          ? rawFrom
          : (rawFrom && typeof rawFrom === 'object' && typeof rawFrom.pathname === 'string'
              ? rawFrom.pathname + (rawFrom.search || '')
              : null)

      const dest =
        from && !['/login', '/register', '/reset', '/forgot-password'].includes(from)
          ? from
          : '/feed'

      debugLoginEvent('LOGIN_REDIRECT', { phase: 'nav', status: 'success', message: `Navigating to ${dest}`, payload: { dest } })

      navigate(dest, { replace: true })
      return true
    } catch (err) {
      debugLoginError('LOGIN_FLOW_ERROR', err, { phase: 'login' })
      setError(err?.message || 'Login failed')
      return false
    } finally {
      setLoading(false)
    }
  }

  return { email, setEmail, password, setPassword, loading, error, handleLogin }
}
