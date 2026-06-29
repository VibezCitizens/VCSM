// TICKET-TRAZE-CLAIM-VPORT-003 (T3) — public claim funnel route.
// /claim-profile is intentionally NOT wrapped in AuthPublicRoute: it must be
// reachable by both logged-out and logged-in visitors (AuthPublicRoute would
// bounce authenticated users to the feed and break the in-page claim flow).
//
// TICKET-TRAZE-CLAIM-LANDING-001 — /claim-business (EN) and /reclamar-negocio
// (ES) are the friendly entry points for the search-first claim/create landing.
// All three render the same screen: the no-provider state shows the search
// landing, and a `?provider=` reference flows straight into the claim form. The
// localized slug pins the landing language.

export function claimPublicRoutes({ ClaimProfileScreen }) {
  return [
    {
      path: '/claim-profile',
      element: <ClaimProfileScreen />,
    },
    {
      path: '/claim-business',
      element: <ClaimProfileScreen />,
    },
    {
      path: '/reclamar-negocio',
      element: <ClaimProfileScreen />,
    },
  ]
}
