import { useCallback, useState } from 'react'
import { resendVerificationEmailController } from '@/features/auth/controllers/resendVerification.controller'

export function useResendVerification() {
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const resend = useCallback(async (email) => {
    if (!email || loading) return
    setLoading(true)
    setError('')
    setSent(false)
    try {
      await resendVerificationEmailController({ email })
      setSent(true)
    } catch {
      setError('Could not resend verification email. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [loading])

  return { loading, sent, error, resend }
}
