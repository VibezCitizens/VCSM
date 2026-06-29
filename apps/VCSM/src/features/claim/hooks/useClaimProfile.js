// TICKET-TRAZE-CLAIM-VPORT-003 (T3) — /claim-profile orchestration hook.
//
// Drives the claim funnel state machine:
//   loading → invalid | already_claimed | needs_auth | needs_onboarding | ready → submitted
// Logged-out claimants authenticate first (provider/source preserved through the
// auth round-trip via location.state.from). Logged-in Citizens submit a PENDING
// claim. No ownership, VPORT, or approval logic lives here.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import { useAuth } from '@/app/providers/AuthProvider'
import { useIdentity } from '@/features/identity/adapters/identity.adapter'
import { useLocale } from '@/platform/i18n/useLocale.jsx'
import { captureFrontendError } from '@/services/monitoring/monitoringClient'

import { resolveProviderController } from '@/features/claim/controllers/resolveProvider.controller'
import { submitClaimController } from '@/features/claim/controllers/submitClaim.controller'
import {
  parseClaimParams,
  buildClaimReturnPath,
  resolveCitizenActorId,
  EMPTY_CLAIM_FORM,
  TRAZE_DIRECTORY_URL,
} from '@/features/claim/model/claim.model'

export function useClaimProfile() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, loading: authLoading } = useAuth()
  const { identity, identityLoading, availableActors } = useIdentity()
  const { locale } = useLocale()

  // Landing language: the localized /reclamar-negocio · /claim-business slugs
  // pin the language; any other entry (e.g. /claim-profile) follows the app locale.
  const landingLang = useMemo(() => {
    const path = location.pathname || ''
    if (path.includes('reclamar-negocio')) return 'es'
    if (path.includes('claim-business')) return 'en'
    return locale === 'es' ? 'es' : 'en'
  }, [location.pathname, locale])

  const params = useMemo(() => parseClaimParams(location.search), [location.search])
  const hasProviderParam = Boolean(params.providerSlug || params.providerId)
  const returnPath = useMemo(() => buildClaimReturnPath(params), [params])

  const [providerLoading, setProviderLoading] = useState(hasProviderParam)
  const [provider, setProvider] = useState(null)

  const [form, setForm] = useState(EMPTY_CLAIM_FORM)
  const [fieldErrors, setFieldErrors] = useState({})
  const [submitError, setSubmitError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [confirmation, setConfirmation] = useState(null)
  const submittingRef = useRef(false)

  // Best-effort provider display lookup (authority is the RPC on submit).
  useEffect(() => {
    if (!hasProviderParam) {
      setProviderLoading(false)
      return
    }
    let active = true
    setProviderLoading(true)
    ;(async () => {
      const row = await resolveProviderController({
        id: params.providerId,
        slug: params.providerSlug,
      })
      if (!active) return
      setProvider(row)
      setProviderLoading(false)
    })()
    return () => { active = false }
  }, [hasProviderParam, params.providerId, params.providerSlug])

  const citizenActorId = useMemo(
    () => resolveCitizenActorId({ identity, availableActors }),
    [identity, availableActors],
  )

  const alreadyClaimed = Boolean(
    provider && (provider.claim_status === 'claimed' || provider.claimed_by),
  )

  const status = useMemo(() => {
    if (authLoading || identityLoading || providerLoading) return 'loading'
    // No provider reference → public claim/create landing (global TRAZE CTAs).
    // A bad/unknown provider is NOT landing: it keeps the existing best-effort
    // flow and is rejected authoritatively by the submit RPC.
    if (!hasProviderParam) return 'landing'
    if (confirmation) return 'submitted'
    if (alreadyClaimed) return 'already_claimed'
    if (!user) return 'needs_auth'
    if (!citizenActorId) return 'needs_onboarding'
    return 'ready'
  }, [authLoading, identityLoading, providerLoading, hasProviderParam, confirmation, alreadyClaimed, user, citizenActorId])

  const providerLabel =
    provider?.display_name || params.providerSlug || 'this business'

  const setField = useCallback((name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }))
    setFieldErrors((prev) => (prev[name] ? { ...prev, [name]: undefined } : prev))
    if (submitError) setSubmitError('')
  }, [submitError])

  // Send the claimant through standard auth, preserving provider/source so they
  // return to this exact claim. Citizen onboarding is reused — no parallel signup.
  const goRegister = useCallback(() => {
    navigate('/register', { state: { from: returnPath } })
  }, [navigate, returnPath])

  const goLogin = useCallback(() => {
    navigate('/login', { state: { from: returnPath } })
  }, [navigate, returnPath])

  const goOnboarding = useCallback(() => {
    navigate('/onboarding', { state: { from: returnPath } })
  }, [navigate, returnPath])

  // Landing-mode action: send owners into the existing business-creation funnel
  // (/register?intent=vport is the canonical VCSM "create a Vport" entry — see
  // HowToCreateVportScreen). Source attribution is preserved when present.
  const goCreateBusiness = useCallback(() => {
    const suffix = params.source ? `&source=${encodeURIComponent(params.source)}` : ''
    navigate(`/register?intent=vport${suffix}`)
  }, [navigate, params.source])

  // Landing-mode action: the owner picked their existing business from search.
  // Hand off to the referenced claim flow (/claim-profile?provider=…) which owns
  // submission. source attribution is preserved (defaulting to traffic).
  const goSelectProvider = useCallback((selected) => {
    const slug = selected?.slug || null
    const id = slug ? null : selected?.id || null
    if (!slug && !id) return
    const path = buildClaimReturnPath({
      providerSlug: slug,
      providerId: id,
      source: params.source || 'traffic',
    })
    navigate(path)
  }, [navigate, params.source])

  const handleSubmit = useCallback(async () => {
    if (submittingRef.current) return
    submittingRef.current = true
    setSubmitting(true)
    setSubmitError('')
    setFieldErrors({})

    try {
      const result = await submitClaimController({
        form,
        provider: {
          id: provider?.id ?? params.providerId ?? null,
          slug: provider?.slug ?? params.providerSlug ?? null,
        },
        requesterActorId: citizenActorId,
        sourceUrl: typeof window !== 'undefined' ? window.location.href : null,
      })

      if (!result.ok) {
        if (result.fieldErrors) setFieldErrors(result.fieldErrors)
        setSubmitError(result.message)
        return
      }

      setConfirmation({ claimId: result.data.claimId })
    } catch (error) {
      captureFrontendError(error, {
        feature: 'claim',
        module: 'useClaimProfile',
        controller: 'submitClaim',
        route: '/claim-profile',
        severity: 'error',
        is_handled: true,
        tags: { flow: 'traze_claim' },
        context: { stage: 'submitClaim' },
        breadcrumbs: [{ type: 'claim', message: 'claim_submit_failed' }],
      })
      setSubmitError('Something went wrong submitting your claim. Please try again.')
    } finally {
      submittingRef.current = false
      setSubmitting(false)
    }
  }, [form, provider, params.providerId, params.providerSlug, citizenActorId])

  return {
    status,
    provider,
    providerLabel,
    landingLang,
    source: params.source,
    form,
    fieldErrors,
    submitError,
    submitting,
    confirmation,
    setField,
    handleSubmit,
    goRegister,
    goLogin,
    goOnboarding,
    goCreateBusiness,
    goSelectProvider,
    directoryUrl: TRAZE_DIRECTORY_URL,
  }
}
