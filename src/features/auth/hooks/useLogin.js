import { useState } from 'react'
import { signInWithPassword } from '@/features/auth/adapter/auth.adapter'
import { ensureProfileDiscoverable } from '@/features/auth/controllers/profile.controller'
import { supabase } from '@/services/supabase/supabaseClient'

export function useLogin(navigate, location) {
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

      await supabase.auth.getSession()

      if (data?.user?.id) {
        await ensureProfileDiscoverable(data.user.id)
      }

      const from = location.state?.from?.pathname
      const dest =
        from && !['/login', '/register', '/reset', '/forgot-password'].includes(from)
          ? from
          : '/feed'

      navigate(dest, { replace: true })
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
