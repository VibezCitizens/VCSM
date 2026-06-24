// TICKET-TRAZE-CLAIM-VPORT-007 (T7) — claim onboarding public surface.
// Adapters expose only screens/components/hooks — never DAL/model/controllers.

export { default as ClaimApprovedScreen } from '@/features/claimOnboarding/screens/ClaimApprovedScreen'
export { default as ClaimOnboardingBanner } from '@/features/claimOnboarding/components/ClaimOnboardingBanner'
export { useClaimApprovalDiscovery } from '@/features/claimOnboarding/hooks/useClaimApprovalDiscovery'
