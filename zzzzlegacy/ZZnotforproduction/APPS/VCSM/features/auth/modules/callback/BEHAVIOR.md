---
title: Callback Module — Behavior
status: STUB
feature: auth
module: callback
source: architect-derived
created: 2026-06-05
---

# auth / modules / callback — BEHAVIOR

## Status

STUB. Behaviors seeded from ARCHITECT review.

## Confirmed Behaviors

### Auth Callback Processing
- User arrives at /auth/callback after OAuth or magic link redirect
- AuthCallbackScreen renders loading state immediately
- useAuthCallback → authCallback.controller → authCallback.dal → supabase.auth.exchangeCodeForSession
- On success: session established; redirect to post-auth destination
- On failure: redirect to /auth/login with error (UNVERIFIED)

### Post-Callback Routing
- Destination after successful callback UNVERIFIED — likely /onboarding (new user) or feed (returning user)
- If destination is state-driven, open redirect risk must be assessed

## TODO

- [ ] Confirm exchangeCodeForSession extracts code from URL params or full URL
- [ ] Confirm post-callback routing logic — new vs returning user discrimination
- [ ] Confirm error handling — what does AuthCallbackScreen show on exchange failure?
