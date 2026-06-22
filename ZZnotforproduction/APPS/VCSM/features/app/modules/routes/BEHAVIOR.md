---
title: Routes Module — Behavior
status: STUB
feature: app
module: routes
source: architect-derived
created: 2026-06-05
---

# app / modules / routes — BEHAVIOR

## Status

STUB. Behaviors seeded from ARCHITECT review.

## Confirmed Behaviors

### Route Tree Assembly
- routes/index.jsx assembles all route groups into a single router config
- Lazy imports via lazyApp.jsx (protected) and lazyPublic.jsx (public) for code splitting
- RouteErrorBoundary.jsx catches render errors within any route subtree

### Public Route Access
- /auth/* accessible to unauthenticated users; AuthPublicRoute redirects authed users away
- /about/*, /contact/*, /legal/*, /how-to/*, /join/*, /m/* — fully public, no guard
- /wanders/*, /wanderex/* — public routes for FROZEN features (still active in router)

### Protected Route Access
- All protected routes wrapped in ProtectedRoute (auth gate)
- Profile-required routes additionally wrapped in ProfileGatedOutlet
- /onboarding — protected, no profile gate (profile not yet complete)
- /learning/* — FROZEN feature; protected route still active

### Redirect Rules
- appRoutes.redirects.jsx — handles legacy or renamed route redirects
- AuthPublicRoute — redirects authenticated users from /auth/* to feed (destination UNVERIFIED)

### Error Boundary
- RouteErrorBoundary.jsx — catches route-level errors; renders fallback UI
- Confirm: does not leak stack traces or internal paths in production

## TODO

- [ ] Confirm lazy import boundaries — what is the chunk split between lazyApp and lazyPublic?
- [ ] Confirm AuthPublicRoute redirect destination (to feed? to home? UNVERIFIED)
- [ ] Confirm FROZEN feature routes (wanders, wanderex, learning) — are they visibly broken or silently empty?
- [ ] Confirm RouteErrorBoundary production output (generic error vs stack trace)
