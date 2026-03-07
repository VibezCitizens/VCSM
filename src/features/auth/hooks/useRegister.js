import { useCallback, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import { ctrlRegisterAccount } from '@/features/auth/controllers/register.controller'

export function useRegister() {
  const navigate = useNavigate()
  const location = useLocation()

  const [form, setForm] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const navState = useMemo(() => {
    const state = location?.state || {}
    return {
      from: typeof state.from === 'string' ? state.from : null,
      card: typeof state.card === 'string' ? state.card : null,
      wandersFlow: Boolean(state.wandersFlow),
    }
  }, [location])

  const isWandersFlow = Boolean(navState.wandersFlow)

  const canSubmit = form.email.trim() !== '' && form.password.trim() !== '' && !loading

  const handleChange = useCallback((event) => {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))

    if (errorMessage) setErrorMessage('')
    if (successMessage) setSuccessMessage('')
  }, [errorMessage, successMessage])

  const goOnboarding = useCallback(() => {
    navigate('/onboarding', {
      replace: true,
      state: {
        from: navState.from,
        card: navState.card,
        wandersFlow: navState.wandersFlow,
      },
    })
  }, [navigate, navState])

  const handleRegister = useCallback(async () => {
    if (!canSubmit) return false

    setLoading(true)
    setErrorMessage('')
    setSuccessMessage('')

    try {
      const result = await ctrlRegisterAccount({
        email: form.email,
        password: form.password,
        isWandersFlow,
      })

      if (result?.requiresEmailConfirm) {
        setSuccessMessage(
          result?.message ||
            'Registration initiated. Please check your email to confirm your account.'
        )
        return true
      }

      goOnboarding()
      return true
    } catch (error) {
      setErrorMessage(String(error?.message || 'Registration failed'))
      return false
    } finally {
      setLoading(false)
    }
  }, [canSubmit, form.email, form.password, goOnboarding, isWandersFlow])

  return {
    form,
    loading,
    errorMessage,
    successMessage,
    navState,
    canSubmit,
    handleChange,
    handleRegister,
  }
}
