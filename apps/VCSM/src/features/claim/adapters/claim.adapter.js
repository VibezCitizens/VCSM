// TICKET-TRAZE-CLAIM-VPORT-003 (T3) — claim feature public surface.
// Adapters expose only screens/components/hooks — never DAL/model/controllers.

export { default as ClaimProfileScreen } from '@/features/claim/screens/ClaimProfileScreen'

// TICKET-TRAZE-CLAIM-RESUME-001 — render-null effect mounted in RootLayout that
// returns a user to their pending claim after auth + onboarding.
export { default as PendingClaimResume } from '@/features/claim/components/PendingClaimResume'
