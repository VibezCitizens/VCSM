import { useState } from 'react'
import { signInWithPassword } from '@/auth/controllers/login.controller'

export function useLogin(onSuccess) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const { data, error: signInError } = await signInWithPassword({ email, password })
      if (signInError) throw signInError

      // Session is now in memory. Hand off to the caller for engine provisioning + navigation.
      await onSuccess?.()
      return true
    } catch (err) {
      setError(err?.message || 'Login failed')
      return false
    } finally {
      setLoading(false)
    }
  }

  return { email, setEmail, password, setPassword, loading, error, handleLogin }
}
