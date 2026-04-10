import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/app/providers/AuthProvider'
import {
  resolveLegalGateForSession,
  acceptRequiredConsents,
} from '../controllers/legalConsent.controller'

/**
 * Hook to manage legal consent gate state.
 * Uses the compliance engine to check if the user needs to re-consent.
 * Returns loading, consent status, required actions, and accept handler.
 */
export function useLegalConsent() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [requiresConsent, setRequiresConsent] = useState(false)
  const [requiredActions, setRequiredActions] = useState([])
  const [accepting, setAccepting] = useState(false)
  const [error, setError] = useState(null)

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
        const gate = await resolveLegalGateForSession({ userId: user.id })
        if (!cancelled) {
          const blocked = gate.decision === 'REQUIRE_RECONSENT'
          setRequiresConsent(blocked)
          setRequiredActions(blocked ? gate.requiredActions : [])
        }
      } catch (err) {
        console.error('[LegalConsent] gate check failed:', err)
        if (!cancelled) {
          setError(err.message)
          // On error, don't block — allow app entry
          setRequiresConsent(false)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    check()
    return () => { cancelled = true }
  }, [user?.id])

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
      console.error('[LegalConsent] re-consent failed:', err)
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
  }
}
