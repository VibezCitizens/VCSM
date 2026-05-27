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
            navigate('/login', { replace: true, state: { emailConfirmed: true } })
          }
          return
        }

        // Email verification: session established.
        // Recovery links are handled exclusively by AuthProvider's PASSWORD_RECOVERY
        // event handler — not from this callback. This path is email confirmation only.
        navigate('/explore', { replace: true })
      } catch {
        if (!alive) return
        setError('Something went wrong. Please try logging in.')
      }
    })()

    return () => { alive = false }
  }, [navigate])

  return { error }
}
