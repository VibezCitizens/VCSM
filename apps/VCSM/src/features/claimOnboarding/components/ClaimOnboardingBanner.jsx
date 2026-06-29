// TICKET-TRAZE-CLAIM-VPORT-007 (T7) — app-wide entry point for approved-claim
// onboarding. Self-gating: renders nothing unless the owner has an approved,
// connected claim they have not acknowledged. Mounted in RootLayout.

import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useClaimApprovalDiscovery } from '@/features/claimOnboarding/hooks/useClaimApprovalDiscovery'
import { CLAIM_ONBOARDING_PATH } from '@/features/claimOnboarding/model/claimOnboardingRoute'

export default function ClaimOnboardingBanner() {
  const { pending } = useClaimApprovalDiscovery()
  const { pathname } = useLocation()
  const navigate = useNavigate()

  // Show only on the route where the banner first appeared; once the owner
  // navigates anywhere else, hide it for the rest of the session. The banner is
  // mounted once in RootLayout, so this ref/state survives route changes.
  const initialPathRef = useRef(pathname)
  const [navigatedAway, setNavigatedAway] = useState(false)

  useEffect(() => {
    if (pathname !== initialPathRef.current) setNavigatedAway(true)
  }, [pathname])

  if (navigatedAway) return null
  if (!pending.length) return null
  if (pathname === CLAIM_ONBOARDING_PATH) return null

  const first = pending[0]
  const extra = pending.length - 1

  return (
    <button
      type="button"
      onClick={() => navigate(CLAIM_ONBOARDING_PATH)}
      className="mb-3 flex w-full items-center justify-between gap-3 rounded-2xl border border-[#6C4DF6]/40 bg-[#6C4DF6]/15 px-4 py-3 text-left transition hover:bg-[#6C4DF6]/25"
    >
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-white">
          Your business claim was approved
        </span>
        <span className="block truncate text-xs text-white/70">
          Finish setting up {first.vportName}
          {extra > 0 ? ` and ${extra} more` : ''}
        </span>
      </span>
      <span className="shrink-0 rounded-lg bg-white/10 px-3 py-1.5 text-xs font-semibold text-white">
        Set up
      </span>
    </button>
  )
}
