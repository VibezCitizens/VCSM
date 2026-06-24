// TICKET-TRAZE-CLAIM-VPORT-007 (T7) — /business/welcome first-run screen.
// Shows the next unacknowledged approved-claim VPORT, lets the owner activate it
// (switch to the VPORT actor) and land on its dashboard.

import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useIdentity } from '@/features/identity/adapters/identity.adapter'
import { useClaimApprovalDiscovery } from '@/features/claimOnboarding/hooks/useClaimApprovalDiscovery'
import ClaimApprovedWelcome from '@/features/claimOnboarding/components/ClaimApprovedWelcome'

function Shell({ children }) {
  return (
    <div className="mx-auto w-full max-w-[460px] px-4 py-8">
      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">{children}</div>
    </div>
  )
}

export default function ClaimApprovedScreen() {
  const navigate = useNavigate()
  const { switchActor, refreshAvailableActors } = useIdentity()
  const { pending, loading, acknowledge } = useClaimApprovalDiscovery()
  const [busy, setBusy] = useState(false)

  if (loading) {
    return (
      <Shell>
        <div className="flex items-center justify-center py-10">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white/80" />
        </div>
      </Shell>
    )
  }

  const item = pending[0]

  if (!item) {
    return (
      <Shell>
        <div className="space-y-3 text-center">
          <h1 className="text-[1.4rem] font-semibold text-white">You are all set</h1>
          <p className="text-sm text-white/60">There are no new approved claims to set up.</p>
          <Link
            to="/CentralFeed"
            className="inline-block rounded-xl border border-white/12 bg-white/[0.03] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-white/[0.06]"
          >
            Go to your feed
          </Link>
        </div>
      </Shell>
    )
  }

  async function goToDashboard() {
    setBusy(true)
    try {
      acknowledge(item.vportActorId)
      try { await refreshAvailableActors?.() } catch { /* non-fatal */ }
      const res = await switchActor(item.vportActorId, 'claim_onboarding')
      if (res?.success) {
        navigate(`/actor/${item.vportActorId}/dashboard`, { replace: true })
      } else {
        // Could not switch (e.g., link not yet hydrated) — land on the feed;
        // the actor is in the switcher and the banner is now acknowledged.
        navigate('/CentralFeed', { replace: true })
      }
    } finally {
      setBusy(false)
    }
  }

  function dismiss() {
    acknowledge(item.vportActorId)
    navigate('/CentralFeed', { replace: true })
  }

  return (
    <Shell>
      <ClaimApprovedWelcome
        item={item}
        busy={busy}
        onGoToDashboard={goToDashboard}
        onDismiss={dismiss}
      />
    </Shell>
  )
}
