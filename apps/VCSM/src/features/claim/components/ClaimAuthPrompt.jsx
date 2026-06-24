// TICKET-TRAZE-CLAIM-VPORT-003 (T3) — auth gate for the claim funnel.
// Logged-out claimants register/sign in; logged-in users without a Citizen
// actor finish onboarding. Provider/source are preserved through the round-trip.

import {
  claimPrimaryButtonClass,
  claimSecondaryButtonClass,
} from '@/features/claim/components/claimStyles'

export default function ClaimAuthPrompt({
  mode, // 'needs_auth' | 'needs_onboarding'
  providerLabel,
  onRegister,
  onLogin,
  onOnboarding,
}) {
  const needsOnboarding = mode === 'needs_onboarding'

  return (
    <div className="space-y-5">
      <div className="space-y-1">
        <h1 className="text-[1.5rem] font-semibold tracking-tight text-white">
          Claim {providerLabel}
        </h1>
        <p className="text-sm text-[#9ca3af]">
          {needsOnboarding
            ? 'Finish setting up your Citizen account to continue your claim.'
            : 'Create a free Citizen account or sign in to claim this business.'}
        </p>
      </div>

      <ul className="space-y-1.5 text-xs text-[#9ca3af]">
        <li>Verification required</li>
        <li>Reviewed by Vibez Citizens</li>
        <li>Free to claim</li>
      </ul>

      {needsOnboarding ? (
        <button type="button" className={claimPrimaryButtonClass} onClick={onOnboarding}>
          Finish setting up my account
        </button>
      ) : (
        <div className="space-y-2.5">
          <button type="button" className={claimPrimaryButtonClass} onClick={onRegister}>
            Create a Citizen account
          </button>
          <button type="button" className={claimSecondaryButtonClass} onClick={onLogin}>
            I already have an account
          </button>
        </div>
      )}
    </div>
  )
}
