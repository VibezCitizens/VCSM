import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import { ctrlRegisterAccount, ctrlRecordSignupConsent } from '../controllers/register.controller'
import { useSignupConsent } from '@/features/legal/adapters/legal.adapter'
import {
  evaluateConfirmPasswordState,
  evaluateRegisterPasswordRules,
} from '@/features/auth/shared/model/passwordRules.model'
import { isValidInviteCode, isSafeAuthReturnPath } from '@/features/auth/shared/model/authInputValidation.model'
import { captureFrontendError } from '@/services/monitoring/monitoringClient'

const COOLDOWN_SECONDS = 15

export function useRegister() {
  const { recordSignupConsent } = useSignupConsent()
  const navigate = useNavigate()
  const location = useLocation()

  const [form, setForm] = useState({ email: '', password: '', confirmPassword: '' })
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [consentError, setConsentError] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [cooldownSeconds, setCooldownSeconds] = useState(0)

  useEffect(() => {
    if (cooldownSeconds <= 0) return
    const timer = setTimeout(() => setCooldownSeconds(prev => Math.max(0, prev - 1)), 1000)
    return () => clearTimeout(timer)
  }, [cooldownSeconds])

  // Read intent from URL query param (/register?intent=profile|vport)
  // Maps to a post-onboarding destination so the funnel lands the user in the right place.
  const intent = useMemo(() => {
    const params = new URLSearchParams(location.search)
    const raw = params.get('intent') || ''
    if (raw === 'profile' || raw === 'vport') return raw
    return null
  }, [location.search])

  // SYSTEM B — citizen invite attribution handoff.
  // Captures invite_code from /register?invite_code= and passes it to ctrlRegisterAccount,
  // which persists it in user_metadata so it survives email verification across devices.
  // Attribution write fires in completeOnboardingController after actor.id exists.
  const citizenInviteCode = useMemo(() => {
    const params = new URLSearchParams(location.search)
    const raw = params.get('invite_code') || null
    return isValidInviteCode(raw) ? raw : null
  }, [location.search])

  const navState = useMemo(() => {
    const state = location?.state || {}
    const fromState = typeof state.from === 'string' && isSafeAuthReturnPath(state.from) ? state.from : null
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

  // TICKET-TRAZE-CLAIM-AUTH-CONTEXT-FIX-001 (BUG-2): when email confirmation is on,
  // signUp returns no session and the owner must verify before continuing. Carry the
  // validated claim return path through the email link (via emailRedirectTo) so
  // /auth/callback can return to the exact claim instead of /explore. Only the
  // whitelisted /claim-profile return path is forwarded; every other signup keeps
  // Supabase's default redirect untouched.
  const claimReturnPath = useMemo(() => {
    const from = navState.from
    return typeof from === 'string' && from.startsWith('/claim-profile') && isSafeAuthReturnPath(from)
      ? from
      : null
  }, [navState.from])

  const emailRedirectTo = useMemo(() => {
    if (!claimReturnPath || typeof window === 'undefined') return null
    return `${window.location.origin}/auth/callback?next=${encodeURIComponent(claimReturnPath)}`
  }, [claimReturnPath])

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
    !loading &&
    cooldownSeconds === 0

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

  const submittingRef = useRef(false)

  const handleRegister = useCallback(async () => {
    if (!termsAccepted) {
      setConsentError('You must agree to the Terms of Service and Privacy Policy to create an account.')
      return false
    }
    if (!canSubmit || submittingRef.current) return false
    submittingRef.current = true

    setLoading(true)
    setErrorMessage('')
    setSuccessMessage('')
    setConsentError('')

    try {
      const result = await ctrlRegisterAccount({
        email: form.email,
        password: form.password,
        isWandersFlow,
        citizenInviteCode,
        emailRedirectTo,
      })

      // No session yet — user must verify email before continuing.
      // TICKET-TRAZE-CLAIM-AUTH-CONTEXT-FIX-001 (BUG-2): preserve the claim return
      // path so a same-browser manual login after verification still restores it.
      if (result?.requiresEmailConfirm) {
        navigate('/verify-email', { replace: true, state: { email: form.email, from: claimReturnPath } })
        return true
      }

      // Session is active — record legal consent now.
      const userId = result?.userId ?? null
      if (userId) {
        const consentResult = await ctrlRecordSignupConsent({
          recordConsentFn: recordSignupConsent,
          userId,
        })
        if (!consentResult.ok) {
          setConsentError(consentResult.error)
          return false
        }
      }

      goOnboarding()
      return true
    } catch (error) {
      setErrorMessage(String(error?.message || 'Registration failed'))
      setCooldownSeconds(COOLDOWN_SECONDS)
      captureFrontendError(error, {
        feature:    'auth',
        module:     'useRegister',
        controller: 'register',
        route:      '/register',
        severity:   'error',
        is_handled: true,
        tags:       { flow: 'register' },
        context:    { stage: 'registerSubmit' },
        breadcrumbs: [{ type: 'auth', message: 'register_submit_failed' }],
      })
      return false
    } finally {
      submittingRef.current = false
      setLoading(false)
    }
  }, [canSubmit, termsAccepted, form.email, form.password, goOnboarding, isWandersFlow, citizenInviteCode, emailRedirectTo, claimReturnPath])

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
    citizenInviteCode,
    showPassword,
    showConfirmPassword,
    passwordValidation,
    confirmPasswordValidation,
    showPasswordRules: form.password.length > 0,
    canSubmit,
    cooldownSeconds,
    handleChange,
    handleSubmit,
    toggleTermsAccepted,
    togglePasswordVisibility,
    toggleConfirmPasswordVisibility,
  }
}
