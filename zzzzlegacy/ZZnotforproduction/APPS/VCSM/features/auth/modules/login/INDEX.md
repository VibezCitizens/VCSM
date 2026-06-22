---
title: Login Module — Index
status: STUB
feature: auth
module: login
source: architect+venom+elektra+bw-derived
created: 2026-06-05
source-path: apps/VCSM/src/features/auth/
scanner-version: 1.1.0
---

# auth / modules / login

Login, logout, and session management. Owns the login screen, welcome screen, session read, auth ops (logout), and the auth adapter public surface.

## Module Summary

| Field | Value |
|---|---|
| Module | login |
| Feature | auth |
| Source Path | apps/VCSM/src/features/auth/ |
| Screens | 2 (LoginScreen, WelcomeScreen) |
| Routes | /login, / (welcome) |
| Write Surfaces | Supabase auth signIn, Supabase auth signOut, localStorage wipe |
| Controllers | 3 (login, authOps, authSession) |
| DAL Files | 3 (login.dal, authSession.read.dal, + logout via authOps) |
| Hooks | 3 (useLogin, useAuthOps, — ) |

## Known Source Files (ARCHITECT-verified)

| File | Layer | Role |
|---|---|---|
| screens/LoginScreen.jsx | Screen | Email/password login form |
| screens/WelcomeScreen.jsx | Screen | Welcome / pre-login landing |
| hooks/useLogin.js | Hook | Login mutation + redirect |
| hooks/useAuthOps.js | Hook | Logout + session ops |
| controllers/login.controller.js | Controller | signInWithPassword → session |
| controllers/authOps.controller.js | Controller | signOut, session invalidation |
| controllers/authSession.controller.js | Controller | Session read, refresh |
| dal/login.dal.js | DAL | supabase.auth.signInWithPassword |
| dal/authSession.read.dal.js | DAL | supabase.auth.getSession (cached JWT) |
| adapters/auth.adapter.js | Adapter | Public auth surface for external features |
| styles/authInputClasses.js | Styles | Shared input class definitions |
| styles/authTheme.js | Styles | Auth theme tokens |

## Write Surface Map

| Operation | Surface | Risk |
|---|---|---|
| signInWithPassword | Supabase auth | Session creation |
| signOut | Supabase auth | Session teardown |
| clearAllIdentityStorage() | localStorage | Identity hint wipe on logout |
| state.from redirect | React Router | OPEN REDIRECT RISK (VEN-AUTH-002) |

## Security Flags

- HIGH: VEN-AUTH-002 / ELEK-2026-06-04-002 / BW-AUTH-006 — open redirect via state.from after login; useLogin.js has blocklist only; useAuthOnboarding.js has no blocklist
- LOW: VEN-AUTH-005 / ELEK-2026-06-04-004 — debug instrumentation in login hook passes userId+email PII through conditionally-live logging; production safety depends on build-time alias
- LOW: ELEK-2026-06-04-005 — authSession.read.dal uses getSession() (cached JWT) not getUser() (server-verified) for session checks

## Governance Files

| File | Status |
|---|---|
| INDEX.md | STUB |
| BEHAVIOR.md | STUB |
| ARCHITECTURE.md | STUB |
| SECURITY.md | STUB |

## TODO

- [ ] Confirm state.from redirect destination — same-origin check present or blocklist only?
- [ ] Confirm debug instrumentation gate — build-time alias confirmed removed in production?
- [ ] Confirm authSession.read.dal — all write-guard calls use getSession() or getUser()?
