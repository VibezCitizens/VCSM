// TICKET-TRAZE-CLAIM-VPORT-003 (T3) — public claim funnel route.
// /claim-profile is intentionally NOT wrapped in AuthPublicRoute: it must be
// reachable by both logged-out and logged-in visitors (AuthPublicRoute would
// bounce authenticated users to the feed and break the in-page claim flow).

export function claimPublicRoutes({ ClaimProfileScreen }) {
  return [
    {
      path: '/claim-profile',
      element: <ClaimProfileScreen />,
    },
  ]
}
