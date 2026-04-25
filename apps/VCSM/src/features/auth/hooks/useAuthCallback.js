import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { resolveAuthCallbackController } from '@/features/auth/controllers/authCallback.controller'

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
          } else {
            navigate('/login', { replace: true })
          }
          return
        }

        // Password recovery link landed on /auth/callback — redirect to the correct screen.
        if (result.isRecovery) {
          navigate('/reset-password', { replace: true })
          return
        }

        // Email verification: session established.
        // ProtectedRoute and CompleteProfileGate take over from here.
        navigate('/feed', { replace: true })
      } catch {
        if (!alive) return
        setError('Something went wrong. Please try logging in.')
      }
    })()

    return () => { alive = false }
  }, [navigate])

  return { error }
}
