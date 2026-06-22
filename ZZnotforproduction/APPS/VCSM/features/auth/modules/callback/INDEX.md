---
title: Callback Module — Index
status: STUB
feature: auth
module: callback
source: architect+venom-derived
created: 2026-06-05
source-path: apps/VCSM/src/features/auth/
scanner-version: 1.1.0
---

# auth / modules / callback

OAuth and magic link auth callback handler. Processes the Supabase auth redirect, exchanges the code/token for a session, and routes the user to the appropriate post-auth destination.

## Module Summary

| Field | Value |
|---|---|
| Module | callback |
| Feature | auth |
| Source Path | apps/VCSM/src/features/auth/ |
| Screens | 1 (AuthCallbackScreen) |
| Routes | /auth/callback |
| Write Surfaces | Supabase auth session exchange (via callback URL) |
| Controllers | 1 (authCallback.controller) |
| DAL Files | 1 (authCallback.dal) |
| Hooks | 1 (useAuthCallback) |
| Tests | 1 (controllers/__tests__/authCallback.controller.test.js) |

## Known Source Files (ARCHITECT-verified)

| File | Layer | Role |
|---|---|---|
| screens/AuthCallbackScreen.jsx | Screen | Callback processing screen (loading state) |
| hooks/useAuthCallback.js | Hook | Callback exchange + redirect |
| controllers/authCallback.controller.js | Controller | Session exchange orchestration |
| dal/authCallback.dal.js | DAL | supabase.auth.exchangeCodeForSession |
| controllers/__tests__/authCallback.controller.test.js | Test | Callback controller unit test |

## Write Surface Map

| Operation | Surface | Guard |
|---|---|---|
| exchangeCodeForSession | Supabase auth | Code from URL query param — PKCE code verifier from sessionStorage |

## Security Flags

- MEDIUM: ELEK-2026-06-04-005 — getSession() (cached JWT) used in post-callback session check; getUser() is stronger for verifying fresh session after exchange
- INFO: PKCE flow — confirm code verifier is validated server-side by Supabase; local code verifier must not be user-controllable
- INFO: Post-callback redirect target — confirm destination is hardcoded or validated (no open redirect via callback URL params)

## Governance Files

| File | Status |
|---|---|
| INDEX.md | STUB |
| BEHAVIOR.md | STUB |
| ARCHITECTURE.md | STUB |
| SECURITY.md | STUB |

## TODO

- [ ] Confirm authCallback.dal.js — does it pass the full URL or extract the code param?
- [ ] Confirm post-callback redirect destination — hardcoded to /onboarding or state-driven?
- [ ] Confirm authCallback.controller.test.js coverage scope
- [ ] Confirm PKCE is enabled for this Supabase project
