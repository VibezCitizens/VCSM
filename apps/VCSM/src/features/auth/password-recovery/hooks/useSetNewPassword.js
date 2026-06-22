import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  resolveRecoverySessionController,
  updatePasswordController,
  watchPasswordRecoveryController,
  clearRecoveryFlag,
} from '@/features/auth/password-recovery/controllers/setNewPassword.controller'
import {
  evaluateConfirmPasswordState,
  evaluateRegisterPasswordRules,
} from '@/features/auth/shared/model/passwordRules.model'
import { captureFrontendError } from '@/services/monitoring/monitoringClient'

// 'loading' → waiting for recovery session from Supabase
// 'ready'   → session confirmed, show form
// 'invalid' → no session or bad link, show error card
export function useSetNewPassword() {
  const navigate = useNavigate()

  const [status, setStatus] = useState('loading')
  const [form, setForm] = useState({ password: '', confirmPassword: '' })
  const [saving, setSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  useEffect(() => {
    let alive = true
    let resolved = false
    let unsubFn = () => {}

    // Marks this effect done — idempotent, first caller wins.
    const resolve = (ready, msg) => {
      if (!alive || resolved) return
      resolved = true
      if (ready) {
        setStatus('ready')
      } else {
        setErrorMessage(msg || 'Reset link is invalid or has expired. Please request a new one.')
        setStatus('invalid')
      }
    }

    // Path A: listen for PASSWORD_RECOVERY event fired by detectSessionInUrl.
    // This is the primary path for PKCE recovery links (?code=).
    unsubFn = watchPasswordRecoveryController((hasSession) => {
      if (!alive) return
      resolve(hasSession, 'Reset link is invalid or has expired. Please request a new one.')
    })

    // Path B: getSession() fallback — handles cases where detectSessionInUrl already
    // finished before we subscribed (implicit hash tokens, or fast PKCE exchange).
    ;(async () => {
      try {
        const result = await resolveRecoverySessionController()
        if (!alive) return
        if (result.ok) {
          resolve(true)
        } else if (result.error) {
          resolve(false, result.error)
        }
        // If !ok and no error: session not ready yet — wait for PASSWORD_RECOVERY event.
      } catch {
        if (alive) resolve(false)
      }
    })()

    // Timeout: if neither path resolves in 15s, show error (prevents infinite spinner).
    const timeout = setTimeout(() => {
      resolve(false, 'Reset link is invalid or has expired. Please request a new one.')
    }, 15000)

    return () => {
      alive = false
      clearTimeout(timeout)
      unsubFn()
    }
  }, [])

  const passwordValidation = useMemo(
    () => evaluateRegisterPasswordRules(form.password),
    [form.password]
  )

  const confirmPasswordValidation = useMemo(
    () => evaluateConfirmPasswordState({
      password: form.password,
      confirmPassword: form.confirmPassword,
    }),
    [form.password, form.confirmPassword]
  )

  const canSubmit =
    status === 'ready' &&
    passwordValidation.allValid &&
    confirmPasswordValidation.matches &&
    !saving

  const handleChange = useCallback((event) => {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
    if (errorMessage) setErrorMessage('')
  }, [errorMessage])

  const handleSubmit = useCallback(async (event) => {
    event?.preventDefault()
    if (!canSubmit) return

    setSaving(true)
    setErrorMessage('')

    try {
      // updatePasswordController validates, updates, then signs out the recovery session.
      await updatePasswordController({ password: form.password })
      // Explicit clear before navigation — belt-and-suspenders alongside the SIGNED_OUT
      // event that dalSignOutRecoverySession fires, which also clears via AuthProvider.
      clearRecoveryFlag()
      navigate('/login', { replace: true, state: { passwordReset: true } })
    } catch (err) {
      setErrorMessage('Failed to update password. Please try again.')
      captureFrontendError(err, {
        feature:    'auth',
        module:     'useSetNewPassword',
        controller: 'reset_password',
        route:      '/reset-password',
        severity:   'error',
        is_handled: true,
        tags:       { flow: 'reset_password' },
        context: {
          stage:             'securePasswordUpdate',
          hasRecoveryPermit: true,
        },
        breadcrumbs: [{ type: 'auth', message: 'reset_password_submit_failed' }],
      })
    } finally {
      setSaving(false)
    }
  }, [canSubmit, form.password, navigate])

  const togglePasswordVisibility = useCallback(() => setShowPassword((p) => !p), [])
  const toggleConfirmPasswordVisibility = useCallback(() => setShowConfirmPassword((p) => !p), [])

  return {
    status,
    form,
    saving,
    errorMessage,
    passwordValidation,
    confirmPasswordValidation,
    showPassword,
    showConfirmPassword,
    showPasswordRules: form.password.length > 0,
    canSubmit,
    handleChange,
    handleSubmit,
    togglePasswordVisibility,
    toggleConfirmPasswordVisibility,
  }
}
