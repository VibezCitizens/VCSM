// TICKET-TRAZE-CLAIM-RESUME-001 — auto-resume a pending claim after auth + onboarding.
//
// Mounted high in the authenticated app shell (RootLayout). RootLayout only
// renders for users who passed CompleteProfileGate (onboarding complete), so by
// the time this runs the user is authenticated AND has a Citizen actor — exactly
// the "ready to submit the claim" moment. If a durable pending-claim intent
// exists, send the user back to /claim-profile?provider=… to finish + submit.
//
// Independent of the email redirect / onboarding state.from chain: even when the
// confirmation link drops the user on the feed, this returns them to the claim.

import { useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import { useAuth } from '@/app/providers/AuthProvider'
import { useIdentity } from '@/features/identity/adapters/identity.adapter'
import { resolveCitizenActorId } from '@/features/claim/model/claim.model'
import {
  readPendingClaimIntent,
  buildClaimResumePath,
  clearPendingClaimIntent,
} from '@/features/claim/model/pendingClaimIntent'

// Paths where resuming would be wrong (auth/onboarding in progress) or redundant
// (already on the claim funnel). Defensive: RootLayout does not render these,
// but the guard keeps the hook correct regardless of where it is mounted.
const NO_RESUME_PATHS = new Set([
  '/onboarding',
  '/welcome',
  '/auth/callback',
  '/login',
  '/register',
  '/verify-email',
])

export function usePendingClaimResume() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const { user, loading: authLoading } = useAuth()
  const { identity, identityLoading, availableActors } = useIdentity()

  // One navigation attempt per mount — prevents re-fire from re-renders/identity
  // updates within the same page-load. A real reload remounts and re-attempts
  // (so reload-on-feed still resumes); leaving the claim page remounts RootLayout
  // and intentionally resumes again until the claim is submitted or expires.
  const attemptedRef = useRef(false)

  useEffect(() => {
    if (attemptedRef.current) return
    if (authLoading || identityLoading) return // auth/onboarding state not yet known → wait
    if (!user) return                          // not authenticated → wait

    // Not yet onboarded (no Citizen actor) → not ready to submit → wait.
    const citizenActorId = resolveCitizenActorId({ identity, availableActors })
    if (!citizenActorId) return

    // Never redirect away from auth/onboarding routes.
    if (NO_RESUME_PATHS.has(pathname)) return
    // Already on the claim funnel → nothing to do (prevents a loop).
    if (pathname.startsWith('/claim-profile') || pathname.startsWith('/claim-business') || pathname.startsWith('/reclamar-negocio')) return

    const intent = readPendingClaimIntent() // self-clears when expired/invalid
    if (!intent) return

    const resumePath = buildClaimResumePath(intent)
    if (!resumePath) {
      clearPendingClaimIntent() // unusable intent → discard, no redirect
      return
    }

    attemptedRef.current = true
    // replace: keep history clean (feed → claim, back goes to pre-feed, not a ping-pong).
    navigate(resumePath, { replace: true })
  }, [user, authLoading, identity, identityLoading, availableActors, pathname, navigate])
}
