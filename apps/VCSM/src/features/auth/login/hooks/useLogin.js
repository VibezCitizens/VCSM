import { useState, useEffect, useRef } from 'react'
import { signInWithPassword } from '@/features/auth/login/controllers/login.controller'
import { ensureProfileDiscoverable } from '@/features/auth/login/controllers/profile.controller'
import { hydrateAuthSession } from '@/features/auth/session/controllers/authSession.controller'
import { isSafeAuthReturnPath, deriveClaimReturnPathFromSearch } from '@/features/auth/shared/model/authInputValidation.model'
import { debugLoginEvent, debugLoginError } from '@debuggers/identity'
import { captureFrontendError } from '@/services/monitoring/monitoringClient'

// KRAVEN-LOGIN-H01: a stalled Supabase request must never leave loading=true permanently.
const LOGIN_TIMEOUT_MS = 15_000

// TICKET-AUTH-LOGIN-SECURITY-001: tiered client-side cooldown after failed attempts.
// Attempts 1–2: no cooldown. Attempts 3–4: 5s. Attempts 5+: 15s.
export function resolveCooldown(attempts) {
  if (attempts >= 5) return 15
  if (attempts >= 3) return 5
  return 0
}

// TICKET-AUTH-LOGIN-SECURITY-001: unified safe error — never distinguishes unverified
// accounts from invalid credentials (F-02 enumeration fix).
export const LOGIN_SAFE_ERROR = 'Invalid credentials or email not verified.'

export function useLogin(navigate, location) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [cooldownSeconds, setCooldownSeconds] = useState(0)
  const submittingRef = useRef(false)
  const failedAttemptsRef = useRef(0)

  useEffect(() => {
    if (cooldownSeconds <= 0) return
    const timer = setTimeout(() => setCooldownSeconds(prev => Math.max(0, prev - 1)), 1000)
    return () => clearTimeout(timer)
  }, [cooldownSeconds])

  const canSubmit = !loading && email.trim() && password.trim() && cooldownSeconds === 0

  const handleLogin = async (e) => {
    e.preventDefault()
    if (!canSubmit || submittingRef.current) return false
    submittingRef.current = true
    setError('')
    setLoading(true)

    debugLoginEvent('LOGIN_SUBMIT', { phase: 'login', message: 'Form submitted' })

    try {
      debugLoginEvent('SUPABASE_SIGNIN_START', { phase: 'auth', message: 'signInWithPassword called' })
      const t0 = performance.now()

      // KRAVEN-LOGIN-H01: race against a timeout so a stalled request cannot
      // leave the button permanently disabled and loading=true forever.
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(
          () => reject(new Error('Login request timed out. Please try again.')),
          LOGIN_TIMEOUT_MS,
        )
      )
      const { data } = await Promise.race([signInWithPassword({ email, password }), timeoutPromise])

      const signinMs = Math.round(performance.now() - t0)
      debugLoginEvent('SUPABASE_SIGNIN_SUCCESS', {
        phase: 'auth',
        status: 'success',
        message: `Signed in (${signinMs}ms)`,
      })

      // KRAVEN-LOGIN-H02: post-auth failures (hydration/discoverability) must not trap
      // an authenticated user on /login. Authentication success is authoritative.
      debugLoginEvent('SESSION_HYDRATE_START', { phase: 'auth', message: 'Hydrating auth session' })
      try {
        await hydrateAuthSession()
        debugLoginEvent('SESSION_HYDRATE_DONE', { phase: 'auth', status: 'success' })
      } catch (hydrateErr) {
        debugLoginError('SESSION_HYDRATE_ERROR', hydrateErr, { phase: 'auth' })
      }

      if (data?.user?.id) {
        try {
          await ensureProfileDiscoverable(data.user.id)
        } catch (discoverableErr) {
          debugLoginError('ENSURE_DISCOVERABLE_ERROR', discoverableErr, { phase: 'auth' })
        }
      }

      // TICKET-AUTH-LOGIN-SECURITY-001: reset failure tracking on successful login.
      failedAttemptsRef.current = 0
      setCooldownSeconds(0)

      const rawFrom = location?.state?.from
      const stateFrom =
        typeof rawFrom === 'string'
          ? rawFrom
          : (rawFrom && typeof rawFrom === 'object' && typeof rawFrom.pathname === 'string'
              ? rawFrom.pathname + (rawFrom.search || '')
              : null)

      // TICKET-TRAZE-CLAIM-AUTH-CONTEXT-FIX-001 (BUG-1): restoration priority —
      // (1) validated router state.from, (2) claim context reconstructed from the
      // URL query for cross-app sign-in, (3) default feed. Both candidates are
      // whitelist-validated, so no untrusted redirect target can reach navigate().
      const safeStateFrom = isSafeAuthReturnPath(stateFrom) ? stateFrom : null
      const dest =
        safeStateFrom || deriveClaimReturnPathFromSearch(location?.search) || '/CentralFeed'

      debugLoginEvent('LOGIN_REDIRECT', { phase: 'nav', status: 'success', message: `Navigating to ${dest}` })

      navigate(dest, { replace: true })
      return true
    } catch (err) {
      debugLoginError('LOGIN_FLOW_ERROR', err, { phase: 'login' })

      // TICKET-AUTH-LOGIN-SECURITY-001: unified error — F-02 enumeration fix.
      // Never distinguish "email not confirmed" from invalid credentials in the UI.
      setError(LOGIN_SAFE_ERROR)

      // TICKET-AUTH-LOGIN-SECURITY-001: increment attempt counter and apply tiered cooldown.
      failedAttemptsRef.current += 1
      setCooldownSeconds(resolveCooldown(failedAttemptsRef.current))

      captureFrontendError(err, {
        feature:    'auth',
        module:     'useLogin',
        controller: 'login',
        route:      '/login',
        tags:       { flow: 'login' },
        context: {
          stage:    'signInWithPassword',
          hasEmail: Boolean(email),
        },
        breadcrumbs: [
          { type: 'auth', message: 'login_submit_failed' },
        ],
      })
      return false
    } finally {
      submittingRef.current = false
      setLoading(false)
    }
  }

  return { email, setEmail, password, setPassword, loading, error, canSubmit, cooldownSeconds, handleLogin }
}
