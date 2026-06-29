// TICKET-TRAZE-CLAIM-RESUME-001 — render-null effect host for the claim resume.
// Mounted in RootLayout so the resume runs once auth + onboarding are known.

import { usePendingClaimResume } from '@/features/claim/hooks/usePendingClaimResume'

export default function PendingClaimResume() {
  usePendingClaimResume()
  return null
}
