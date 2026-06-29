import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { resolveAuthCallbackController } from '@/features/auth/callback/controllers/authCallback.controller'
import { isSafeAuthReturnPath } from '@/features/auth/shared/model/authInputValidation.model'
import { captureFrontendError } from '@/services/monitoring/monitoringClient'

export function useAuthCallback() {
  const navigate = useNavigate()
  const [error, setError] = useState('')

  useEffect(() => {
    let alive = true

    ;(async () => {
      try {
        const result = await resolveAuthCallbackController()
        if (!alive) return

        if (!result.ok) {
          if (result.error) {
            setError(result.error)
            captureFrontendError(new Error(result.error), {
              feature:     'auth',
              module:      'useAuthCallback',
              controller:  'auth_callback',
              route:       window.location.pathname,
              severity:    'error',
              is_handled:  true,
              tags:        { flow: 'auth_callback' },
              context:     { stage: 'callbackResolution' },
              breadcrumbs: [{ type: 'auth', message: 'auth_callback_failed' }],
            })
          } else {
            navigate('/login', { replace: true, state: { emailConfirmed: true } })
          }
          return
        }

        // Email verification: session established.
        // Recovery links are handled exclusively by AuthProvider's PASSWORD_RECOVERY
        // event handler — not from this callback. This path is email confirmation only.
        // TICKET-TRAZE-CLAIM-AUTH-CONTEXT-FIX-001 (BUG-2): honor a whitelist-validated
        // `next` carried by the confirmation link (set via signUp emailRedirectTo) so
        // claimants return to the exact claim flow; everyone else defaults to /explore.
        const nextParam =
          typeof window !== 'undefined'
            ? new URLSearchParams(window.location.search).get('next')
            : null
        const dest = isSafeAuthReturnPath(nextParam) ? nextParam : '/explore'
        navigate(dest, { replace: true })
      } catch (err) {
        if (!alive) return
        setError('Something went wrong. Please try logging in.')
        captureFrontendError(err, {
          feature:     'auth',
          module:      'useAuthCallback',
          controller:  'auth_callback',
          route:       window.location.pathname,
          severity:    'error',
          is_handled:  true,
          tags:        { flow: 'auth_callback' },
          context:     { stage: 'callbackResolution' },
          breadcrumbs: [{ type: 'auth', message: 'auth_callback_failed' }],
        })
      }
    })()

    return () => { alive = false }
  }, [navigate])

  return { error }
}
