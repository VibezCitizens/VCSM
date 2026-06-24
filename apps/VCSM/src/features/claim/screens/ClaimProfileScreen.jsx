// TICKET-TRAZE-CLAIM-VPORT-003 (T3) — public /claim-profile screen.
//
// Entry point for the Traffic "Claim This Profile" CTA
// (/claim-profile?provider=<slugOrId>&source=traffic). Reuses Citizen auth +
// onboarding; submits a PENDING claim only. No ownership, VPORT, or approval.

import { useClaimProfile } from '@/features/claim/hooks/useClaimProfile'
import ClaimLayout from '@/features/claim/components/ClaimLayout'
import ClaimProviderSummary from '@/features/claim/components/ClaimProviderSummary'
import ClaimAuthPrompt from '@/features/claim/components/ClaimAuthPrompt'
import ClaimForm from '@/features/claim/components/ClaimForm'
import ClaimMessageCard from '@/features/claim/components/ClaimMessageCard'

export default function ClaimProfileScreen() {
  const {
    status,
    provider,
    providerLabel,
    form,
    fieldErrors,
    submitError,
    submitting,
    setField,
    handleSubmit,
    goRegister,
    goLogin,
    goOnboarding,
  } = useClaimProfile()

  if (status === 'loading') {
    return (
      <ClaimLayout>
        <div className="flex items-center justify-center py-10">
          <div className="h-8 w-8 rounded-full border-2 border-white/20 border-t-white/80 animate-spin" />
        </div>
      </ClaimLayout>
    )
  }

  if (status === 'invalid') {
    return (
      <ClaimLayout>
        <ClaimMessageCard
          tone="error"
          title="Invalid claim link"
          body="This claim link is missing a business reference. Please open it again from the business page."
          showHome
        />
      </ClaimLayout>
    )
  }

  if (status === 'already_claimed') {
    return (
      <ClaimLayout>
        <ClaimProviderSummary provider={provider} providerLabel={providerLabel} />
        <ClaimMessageCard
          title="Already claimed"
          body="This business has already been claimed. If you believe this is a mistake, contact support@vibezcitizens.com."
          showHome
        />
      </ClaimLayout>
    )
  }

  if (status === 'submitted') {
    return (
      <ClaimLayout>
        <ClaimProviderSummary provider={provider} providerLabel={providerLabel} />
        <ClaimMessageCard
          tone="success"
          title="Claim submitted for review"
          body="Thanks — your claim is pending review. A reviewer will verify your details and follow up using the contact method you provided."
          showHome
        />
      </ClaimLayout>
    )
  }

  if (status === 'needs_auth' || status === 'needs_onboarding') {
    return (
      <ClaimLayout>
        <ClaimProviderSummary provider={provider} providerLabel={providerLabel} />
        <ClaimAuthPrompt
          mode={status}
          providerLabel={providerLabel}
          onRegister={goRegister}
          onLogin={goLogin}
          onOnboarding={goOnboarding}
        />
      </ClaimLayout>
    )
  }

  return (
    <ClaimLayout>
      <ClaimProviderSummary provider={provider} providerLabel={providerLabel} />
      <ClaimForm
        providerLabel={providerLabel}
        form={form}
        fieldErrors={fieldErrors}
        submitError={submitError}
        submitting={submitting}
        setField={setField}
        onSubmit={handleSubmit}
      />
    </ClaimLayout>
  )
}
