import { useCallback, useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import { useAuth } from '@/app/providers/AuthProvider'
import { ctrlRegisterAccount } from '@/features/auth/controllers/register.controller'
import { recordSignupConsent } from '@/features/legal/controllers/legalConsent.controller'
import {
  evaluateConfirmPasswordState,
  evaluateRegisterPasswordRules,
} from '@/features/auth/model/registerPasswordRules.model'

export function useRegister() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()

  const [form, setForm] = useState({ email: '', password: '', confirmPassword: '' })
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [consentError, setConsentError] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [waitingForEmailConfirm, setWaitingForEmailConfirm] = useState(false)

  // When the user verifies their email in another tab, Supabase fires onAuthStateChange
  // which updates the AuthContext user. Navigate to /feed as soon as we see email_confirmed_at.
  useEffect(() => {
    if (!waitingForEmailConfirm) return
    if (user?.email_confirmed_at) {
      navigate('/feed', { replace: true })
    }
  }, [waitingForEmailConfirm, user?.email_confirmed_at, navigate])

  // Read intent from URL query param (/register?intent=profile|vport)
  // Maps to a post-onboarding destination so the funnel lands the user in the right place.
  const intent = useMemo(() => {
    const params = new URLSearchParams(location.search)
    const raw = params.get('intent') || ''
    if (raw === 'profile' || raw === 'vport') return raw
    return null
  }, [location.search])

  // Preserve invite_code from /register?invite_code=... so it survives navigation.
  // TODO: after signup, look up vc.vibe_invites by invite_code and mark it accepted
  //       to attribute the new user back to the inviter actor.
  const inviteCode = useMemo(() => {
    const params = new URLSearchParams(location.search)
    return params.get('invite_code') || null
  }, [location.search])

  const navState = useMemo(() => {
    const state = location?.state || {}
    const fromState = typeof state.from === 'string' ? state.from : null
    // state.from takes priority (preserves Wanders flow + direct nav).
    // Falls back to intent-based destination, then /welcome for all other signups.
    const intentDest = intent ? `/welcome?intent=${intent}` : '/welcome'
    return {
      from: fromState ?? intentDest,
      card: typeof state.card === 'string' ? state.card : null,
      wandersFlow: Boolean(state.wandersFlow),
    }
  }, [location, intent])

  const isWandersFlow = Boolean(navState.wandersFlow)

  const passwordValidation = useMemo(
    () => evaluateRegisterPasswordRules(form.password),
    [form.password]
  )

  const confirmPasswordValidation = useMemo(
    () =>
      evaluateConfirmPasswordState({
        password: form.password,
        confirmPassword: form.confirmPassword,
      }),
    [form.password, form.confirmPassword]
  )

  const canSubmit =
    form.email.trim() !== '' &&
    passwordValidation.allValid &&
    confirmPasswordValidation.matches &&
    termsAccepted &&
    !loading

  const handleChange = useCallback((event) => {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))

    if (errorMessage) setErrorMessage('')
    if (successMessage) setSuccessMessage('')
    if (consentError) setConsentError('')
  }, [errorMessage, successMessage, consentError])

  const toggleTermsAccepted = useCallback(() => {
    setTermsAccepted((prev) => !prev)
    if (consentError) setConsentError('')
  }, [consentError])

  const togglePasswordVisibility = useCallback(() => {
    setShowPassword((prev) => !prev)
  }, [])

  const toggleConfirmPasswordVisibility = useCallback(() => {
    setShowConfirmPassword((prev) => !prev)
  }, [])

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
    if (!termsAccepted) {
      setConsentError('You must agree to the Terms of Service and Privacy Policy to create an account.')
      return false
    }
    if (!canSubmit) return false

    setLoading(true)
    setErrorMessage('')
    setSuccessMessage('')
    setConsentError('')

    try {
      const result = await ctrlRegisterAccount({
        email: form.email,
        password: form.password,
        isWandersFlow,
      })

      // No session yet — user must verify email before continuing.
      if (result?.requiresEmailConfirm) {
        setSuccessMessage('Check your email to verify your account before continuing.')
        setWaitingForEmailConfirm(true)
        return true
      }

      // Session is active — record legal consent now.
      const userId = result?.userId ?? null
      if (userId) {
        try {
          await recordSignupConsent({ userId })
        } catch (consentErr) {
          console.error('[Register] Failed to record legal consent:', consentErr)
          setConsentError(
            'Your account was created but we could not record your legal consent. Please try logging in — you will be asked to accept again.'
          )
          return false
        }
      }

      goOnboarding()
      return true
    } catch (error) {
      setErrorMessage(String(error?.message || 'Registration failed'))
      return false
    } finally {
      setLoading(false)
    }
  }, [canSubmit, termsAccepted, form.email, form.password, goOnboarding, isWandersFlow])

  const handleSubmit = useCallback(async (event) => {
    if (event?.preventDefault) event.preventDefault()
    return handleRegister()
  }, [handleRegister])

  return {
    form,
    termsAccepted,
    consentError,
    loading,
    errorMessage,
    successMessage,
    navState,
    inviteCode,
    showPassword,
    showConfirmPassword,
    passwordValidation,
    confirmPasswordValidation,
    showPasswordRules: form.password.length > 0,
    canSubmit,
    handleChange,
    handleSubmit,
    handleRegister,
    toggleTermsAccepted,
    togglePasswordVisibility,
    toggleConfirmPasswordVisibility,
  }
}
