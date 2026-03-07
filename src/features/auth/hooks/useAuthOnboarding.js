import { useCallback, useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  completeOnboardingController,
  getOnboardingBootstrapController,
} from '@/features/auth/controllers/onboarding.controller'

const EMPTY_FORM = Object.freeze({
  display_name: '',
  username_base: '',
  birthdate: '',
  sex: '',
})

function getLocalTodayISODate() {
  const now = new Date()
  const year = String(now.getFullYear())
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function useAuthOnboarding() {
  const navigate = useNavigate()
  const location = useLocation()

  const navState = useMemo(() => {
    const state = location?.state || {}
    return {
      redirectTo: typeof state.from === 'string' ? state.from : '/',
      card: state.card ?? null,
      wandersFlow: Boolean(state.wandersFlow),
    }
  }, [location?.state])

  const [userId, setUserId] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const todayISO = useMemo(() => getLocalTodayISODate(), [])

  const bounceToLogin = useCallback(() => {
    navigate('/login', { replace: true })
  }, [navigate])

  const bounceToRegister = useCallback(() => {
    navigate('/register', {
      replace: true,
      state: {
        from: navState.redirectTo,
        card: navState.card,
        wandersFlow: navState.wandersFlow,
      },
    })
  }, [navigate, navState])

  const handleAuthRedirect = useCallback((action) => {
    if (action === 'register') {
      bounceToRegister()
      return true
    }

    if (action === 'login') {
      bounceToLogin()
      return true
    }

    return false
  }, [bounceToLogin, bounceToRegister])

  useEffect(() => {
    let isMounted = true

    ;(async () => {
      try {
        const result = await getOnboardingBootstrapController()
        if (!isMounted) return

        if (!result?.ok) {
          handleAuthRedirect(result?.action)
          return
        }

        setUserId(result?.data?.userId ?? null)
        setForm({
          ...EMPTY_FORM,
          ...(result?.data?.form ?? {}),
        })
      } catch (error) {
        console.error('[useAuthOnboarding] bootstrap failed', error)
        if (!isMounted) return
        setErrorMessage(error?.message || 'Failed to load onboarding.')
      } finally {
        if (isMounted) setLoading(false)
      }
    })()

    return () => { isMounted = false }
  }, [handleAuthRedirect])

  const isValid = useMemo(() => (
    form.display_name.trim() !== '' &&
    form.username_base.trim() !== '' &&
    form.birthdate.trim() !== ''
  ), [form.birthdate, form.display_name, form.username_base])

  const handleChange = useCallback((event) => {
    const { name, value } = event.target

    if (name === 'profile_display_name') {
      setForm((prev) => ({ ...prev, display_name: value }))
      return
    }

    setForm((prev) => ({ ...prev, [name]: value }))
  }, [])

  const handleSave = useCallback(async () => {
    if (!isValid || !userId) return

    setSaving(true)
    setErrorMessage('')

    try {
      const result = await completeOnboardingController({
        userId,
        form,
      })

      if (!result?.ok) {
        if (handleAuthRedirect(result?.action)) return
        setErrorMessage(result?.error?.message || 'Failed to complete onboarding.')
        return
      }

      navigate(navState.redirectTo, { replace: true })
    } catch (error) {
      console.error('[useAuthOnboarding] save failed', error)
      setErrorMessage(error?.message || 'Failed to complete onboarding.')
    } finally {
      setSaving(false)
    }
  }, [form, handleAuthRedirect, isValid, navigate, navState.redirectTo, userId])

  return {
    form,
    loading,
    saving,
    errorMessage,
    isValid,
    todayISO,
    handleChange,
    handleSave,
  }
}
