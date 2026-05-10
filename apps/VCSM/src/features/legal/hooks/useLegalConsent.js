import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/app/providers/AuthProvider'
import {
  resolveLegalGateForSession,
  acceptRequiredConsents,
} from '../controllers/legalConsent.controller'

export function useLegalConsent() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [requiresConsent, setRequiresConsent] = useState(false)
  const [requiredActions, setRequiredActions] = useState([])
  const [accepting, setAccepting] = useState(false)
  const [error, setError] = useState(null)
  const [gateError, setGateError] = useState(null)
  const [retryCount, setRetryCount] = useState(0)

  useEffect(() => {
    if (!user?.id) {
      setLoading(false)
      setRequiresConsent(false)
      return
    }

    let cancelled = false

    async function check() {
      try {
        setLoading(true)
        setGateError(null)
        const gate = await resolveLegalGateForSession({ userId: user.id })
        if (!cancelled) {
          const blocked = gate.decision === 'REQUIRE_RECONSENT'
          setRequiresConsent(blocked)
          setRequiredActions(blocked ? gate.requiredActions : [])
        }
      } catch (err) {
        if (import.meta.env.DEV) {
          console.error('[LegalConsent] gate check failed:', err)
        }
        if (!cancelled) {
          // Fail closed: block gate on any error until a successful check completes
          setGateError(err.message ?? 'Consent check failed')
          setRequiresConsent(true)
          setRequiredActions([])
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    check()
    return () => { cancelled = true }
  }, [user?.id, retryCount])

  const retryConsent = useCallback(() => {
    setRetryCount((c) => c + 1)
  }, [])

  const acceptAll = useCallback(async () => {
    if (!user?.id || requiredActions.length === 0) return

    try {
      setAccepting(true)
      setError(null)
      await acceptRequiredConsents({
        userId: user.id,
        userAppAccountId: null,
        requiredActions,
      })
      setRequiresConsent(false)
      setRequiredActions([])
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error('[LegalConsent] re-consent failed:', err)
      }
      setError(err.message)
    } finally {
      setAccepting(false)
    }
  }, [user?.id, requiredActions])

  return {
    loading,
    requiresConsent,
    requiredActions,
    accepting,
    error,
    acceptAll,
    gateError,
    retryConsent,
  }
}
