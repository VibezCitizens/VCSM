import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ctrlSendResetPasswordEmail } from '@/features/auth/password-recovery/controllers/sendResetPassword.controller'
import { isValidEmailFormat } from '@/features/auth/shared/model/authInputValidation.model'
import { captureFrontendError } from '@/services/monitoring/monitoringClient'

const REDIRECT_DELAY_MS = 4000
const COOLDOWN_SECONDS = 60

export function useResetPassword() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(false)
  const [cooldownSeconds, setCooldownSeconds] = useState(0)

  // Auto-redirect to /login after success. Cleans up on unmount.
  useEffect(() => {
    if (!success) return
    const timer = setTimeout(() => {
      navigate('/login', { replace: true })
    }, REDIRECT_DELAY_MS)
    return () => clearTimeout(timer)
  }, [success, navigate])

  // Cooldown countdown — decrements every second until zero.
  useEffect(() => {
    if (cooldownSeconds <= 0) return
    const timer = setTimeout(() => {
      setCooldownSeconds(prev => Math.max(0, prev - 1))
    }, 1000)
    return () => clearTimeout(timer)
  }, [cooldownSeconds])

  const canSubmit = useMemo(
    () => isValidEmailFormat(email) && !loading && !success && cooldownSeconds === 0,
    [email, loading, success, cooldownSeconds]
  )

  const submittingRef = useRef(false)

  const handleReset = useCallback(async (event) => {
    event?.preventDefault()
    if (!canSubmit || submittingRef.current) return
    submittingRef.current = true

    setError(false)
    setLoading(true)

    try {
      await ctrlSendResetPasswordEmail(email)
      setSuccess(true)
    } catch (err) {
      setError(true)
      captureFrontendError(err, {
        feature:  'auth',
        module:   'useResetPassword',
        controller: 'forgot_password',
        route:    '/forgot-password',
        severity: 'error',
        is_handled: true,
        tags: { flow: 'forgot_password' },
        context: {
          stage:           'resetPasswordForEmail',
          hasEmail:        Boolean(email),
          cooldownSeconds: COOLDOWN_SECONDS,
        },
        breadcrumbs: [{ type: 'auth', message: 'forgot_password_submit_failed' }],
      })
    } finally {
      submittingRef.current = false
      setLoading(false)
      setCooldownSeconds(COOLDOWN_SECONDS)
    }
  }, [canSubmit, email])

  const goToLogin = useCallback(() => {
    navigate('/login', { replace: true })
  }, [navigate])

  return {
    email,
    setEmail,
    success,
    error,
    loading,
    canSubmit,
    cooldownSeconds,
    handleReset,
    goToLogin,
  }
}
