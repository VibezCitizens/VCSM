import { useCallback, useEffect, useState } from 'react'
import { resendVerificationEmailController } from '@/features/auth/gates/controllers/resendVerification.controller'
import { captureFrontendError } from '@/services/monitoring/monitoringClient'

const COOLDOWN_SECONDS = 60

export function useResendVerification() {
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [cooldownSeconds, setCooldownSeconds] = useState(0)

  useEffect(() => {
    if (cooldownSeconds <= 0) return
    const timer = setTimeout(() => setCooldownSeconds(prev => Math.max(0, prev - 1)), 1000)
    return () => clearTimeout(timer)
  }, [cooldownSeconds])

  const resend = useCallback(async (email) => {
    if (!email || loading || cooldownSeconds > 0) return
    setLoading(true)
    setError('')
    setSent(false)
    try {
      await resendVerificationEmailController({ email })
      setSent(true)
    } catch (err) {
      setError('Could not resend verification email. Please try again.')
      captureFrontendError(err, {
        feature:     'auth',
        module:      'useResendVerification',
        controller:  'resend_verification',
        route:       '/verify-email',
        severity:    'error',
        is_handled:  true,
        tags:        { flow: 'verify_email' },
        context:     { stage: 'resendVerificationEmail', hasEmail: Boolean(email) },
        breadcrumbs: [{ type: 'auth', message: 'resend_verification_failed' }],
      })
    } finally {
      setLoading(false)
      setCooldownSeconds(COOLDOWN_SECONDS)
    }
  }, [loading, cooldownSeconds])

  return { loading, sent, error, cooldownSeconds, resend }
}
