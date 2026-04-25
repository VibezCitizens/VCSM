import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ctrlSendResetPasswordEmail } from '@/features/auth/controllers/sendResetPassword.controller'

const REDIRECT_DELAY_MS = 4000

function isValidEmailFormat(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value).trim())
}

export function useResetPassword() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [loading, setLoading] = useState(false)

  // Auto-redirect to /login after success. Cleans up on unmount.
  useEffect(() => {
    if (!successMessage || errorMessage) return
    const timer = setTimeout(() => {
      navigate('/login', { replace: true })
    }, REDIRECT_DELAY_MS)
    return () => clearTimeout(timer)
  }, [successMessage, errorMessage, navigate])

  const canSubmit = useMemo(
    () => isValidEmailFormat(email) && !loading && !successMessage,
    [email, loading, successMessage]
  )

  const handleReset = useCallback(async (event) => {
    event?.preventDefault()
    if (!canSubmit) return

    setErrorMessage('')
    setLoading(true)

    try {
      await ctrlSendResetPasswordEmail(email)
      // Neutral message — do not reveal whether the account exists.
      setSuccessMessage('If an account exists for that email, a reset link has been sent.')
    } catch {
      setErrorMessage('Unable to send reset email. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [canSubmit, email])

  const goToLogin = useCallback(() => {
    navigate('/login', { replace: true })
  }, [navigate])

  return {
    email,
    setEmail,
    successMessage,
    errorMessage,
    loading,
    canSubmit,
    handleReset,
    goToLogin,
  }
}
