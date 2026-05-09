import { useState } from 'react'
import { ctrlUpdatePassword } from '@/auth/controllers/updatePassword.controller'

export function useUpdatePassword({ onSuccess } = {}) {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const canSubmit = !loading && password.trim() && confirmPassword.trim()

  async function handleSubmit(e) {
    e.preventDefault()
    if (!canSubmit) return

    setError('')
    setLoading(true)

    try {
      await ctrlUpdatePassword({ password, confirmPassword })
      setSuccess(true)
      onSuccess?.()
    } catch (err) {
      setError(err?.message ?? 'Failed to update password. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return {
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    loading,
    error,
    success,
    canSubmit,
    handleSubmit,
  }
}
