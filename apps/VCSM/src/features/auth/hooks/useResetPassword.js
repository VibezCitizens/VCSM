import { useCallback, useMemo, useState } from 'react'

import { ctrlSendResetPasswordEmail } from '@/features/auth/controllers/sendResetPassword.controller'

export function useResetPassword() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(false)

  const canSubmit = useMemo(() => email.trim() !== '' && !loading, [email, loading])

  const handleReset = useCallback(async (event) => {
    event.preventDefault()

    if (!canSubmit) return

    setStatus('')
    setLoading(true)

    try {
      await ctrlSendResetPasswordEmail(email)
      setStatus('Check your email for the reset link.')
    } catch (_error) {
      setStatus('Error sending reset email. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [canSubmit, email])

  return {
    email,
    status,
    loading,
    canSubmit,
    setEmail,
    handleReset,
  }
}
