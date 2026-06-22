import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { getOnboardingBootstrapController } from '@/features/auth/onboarding/controllers/onboarding.bootstrap.controller'
import { completeOnboardingController } from '@/features/auth/onboarding/controllers/onboarding.complete.controller'
import { useIdentityOps } from '@/features/identity/adapters/identity.adapter'
import { isSafeAuthReturnPath } from '@/features/auth/shared/model/authInputValidation.model'
import { captureFrontendError } from '@/services/monitoring/monitoringClient'
import { useAuth } from '@/app/providers/AuthProvider'

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
  const { refreshVcActorDirectory, ensureVcsmPlatformBootstrap } = useIdentityOps()
  const { logout } = useAuth()

  const navState = useMemo(() => {
    const state = location?.state || {}
    return {
      redirectTo: typeof state.from === 'string' && isSafeAuthReturnPath(state.from) ? state.from : '/',
      card: state.card ?? null,
      wandersFlow: Boolean(state.wandersFlow),
    }
  }, [location?.state])

  const [userId, setUserId] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const savingRef = useRef(false)

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
    if (action === 'already_complete') {
      navigate('/', { replace: true })
      return true
    }

    if (action === 'register') {
      bounceToRegister()
      return true
    }

    if (action === 'login') {
      bounceToLogin()
      return true
    }

    return false
  }, [bounceToLogin, bounceToRegister, navigate])

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
        captureFrontendError(error, {
          feature:     'auth',
          module:      'useAuthOnboarding',
          controller:  'onboarding',
          route:       '/onboarding',
          severity:    'error',
          is_handled:  true,
          tags:        { flow: 'onboarding' },
          context:     { stage: 'onboardingBootstrap' },
          breadcrumbs: [{ type: 'auth', message: 'onboarding_bootstrap_failed' }],
        })
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
    form.birthdate.trim() !== '' &&
    form.sex.trim() !== ''
  ), [form.birthdate, form.display_name, form.sex, form.username_base])

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
    if (savingRef.current) return

    savingRef.current = true
    setSaving(true)
    setErrorMessage('')

    try {
      const result = await completeOnboardingController({
        userId,
        form,
        ensureVcsmPlatformBootstrap,
        refreshActorFn: refreshVcActorDirectory,
      })

      if (!result?.ok) {
        if (handleAuthRedirect(result?.action)) return
        setErrorMessage(result?.error?.message || 'Failed to complete onboarding.')
        return
      }

      navigate(navState.redirectTo, { replace: true })
    } catch (error) {
      captureFrontendError(error, {
        feature:     'auth',
        module:      'useAuthOnboarding',
        controller:  'onboarding',
        route:       '/onboarding',
        severity:    'error',
        is_handled:  true,
        tags:        { flow: 'onboarding' },
        context:     { stage: 'onboardingSave' },
        breadcrumbs: [{ type: 'auth', message: 'onboarding_save_failed' }],
      })
      setErrorMessage(error?.message || 'Failed to complete onboarding.')
    } finally {
      savingRef.current = false
      setSaving(false)
    }
  }, [form, handleAuthRedirect, isValid, navigate, navState.redirectTo, userId])

  const handleSignOut = useCallback(async () => {
    await logout()
  }, [logout])

  return {
    form,
    loading,
    saving,
    errorMessage,
    isValid,
    todayISO,
    handleChange,
    handleSave,
    handleSignOut,
  }
}
