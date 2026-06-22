---
name: auth-login-ownership
description: Ownership record for VCSM:auth — Login module (LoginScreen and all connected layers)
metadata:
  type: ownership
  feature: auth
  module: login
  ironman-run: 2026-06-06
  ownership-clarity: PARTIAL
  boundary-risk: MEDIUM
---

# auth / login — Ownership Record
**IRONMAN** | Last run: 2026-06-06 | Scope: LoginScreen + all connected layers

---

## 1. Purpose

The login module owns the email+password authentication flow for VCSM citizens.
It is responsible for: accepting credentials, normalizing and validating input,
authenticating against Supabase Auth, post-auth session hydration, profile
discoverability enforcement (login-phase side effect), safe redirect after login,
and displaying nav-state banners from route location state.

---

## 2. Application Scope

VCSM

---

## 3. Code Roots

| Path | Role |
|---|---|
| `apps/VCSM/src/features/auth/screens/LoginScreen.jsx` | View entry |
| `apps/VCSM/src/features/auth/hooks/useLogin.js` | Login state machine |
| `apps/VCSM/src/features/auth/controllers/login.controller.js` | Auth action controller |
| `apps/VCSM/src/features/auth/controllers/profile.controller.js` | Post-auth discoverability |
| `apps/VCSM/src/features/auth/controllers/authSession.controller.js` | Session hydration wrapper |
| `apps/VCSM/src/features/auth/dal/login.dal.js` | Supabase auth DAL |
| `apps/VCSM/src/features/auth/dal/profile.dal.js` | profiles table DAL (login phase) |
| `apps/VCSM/src/features/auth/dal/authSession.read.dal.js` | Session read DAL (shared within auth) |
| `apps/VCSM/src/features/auth/model/authInputValidation.model.js` | Email validation, error mapping, redirect guard |
| `apps/VCSM/src/features/auth/model/profile.model.js` | ProfileModel shape |
| `apps/VCSM/src/features/auth/adapters/auth.adapter.js` | Auth public surface (LoginScreen NOT exported — correct) |
| `apps/VCSM/src/app/routes/public/auth.routes.jsx` | Route factory (shared, auth-owned) |
| `apps/VCSM/src/app/routes/public/AuthPublicRoute.jsx` | Auth-redirect guard (shared, auth-owned) |

---

## 4. Core Layers

| Layer | Files |
|---|---|
| Screen | LoginScreen.jsx |
| Hook | useLogin.js |
| Controller | login.controller.js, profile.controller.js, authSession.controller.js |
| DAL | login.dal.js, profile.dal.js, authSession.read.dal.js |
| Model | authInputValidation.model.js, profile.model.js |
| Adapter | auth.adapter.js (LoginScreen not exported — route-injected) |
| Route | auth.routes.jsx |
| Route guard | AuthPublicRoute.jsx |

---

## 5. Engines Used

NONE — the login module does not consume any engines/ directory engine.

Platform services consumed (not engines):
- `@/services/supabase/supabaseClient` — Supabase singleton (via all DALs)
- `@/services/monitoring/monitoringClient` — captureFrontendError
- `@/app/platform/ios/` — IosInstallPrompt + useIOSInstallVisibility (**direct import — undocumented boundary, see IRM-LOGIN-001**)
- `@/season` — getActiveSeasonTheme
- `@debuggers/identity` — DEV-only debug events

---

## 6. Database / Schema Ownership

| Table | Operation | Owner | Notes |
|---|---|---|---|
| auth.users | READ (signInWithPassword) | Supabase (managed) | via dalSignInWithPassword |
| auth.sessions | WRITE (implicit on signIn) | Supabase (managed) | Supabase creates session row |
| auth.sessions | READ (getSession) | auth/login | via dalGetAuthSession |
| profiles | READ (discoverable) | auth/login (login phase) | via dalGetProfileDiscoverable |
| profiles | WRITE (discoverable, updated_at) | auth/login (login phase) | via dalUpdateProfileDiscoverable — **IRM-LOGIN-002** |

**RLS owner:** Not confirmed for profiles table in this session.
**Migration owner:** Not confirmed for profiles table in this session.
**Conflict flag IRM-LOGIN-002:** profiles.discoverable is written by auth/login (login phase). If a standalone profile or identity engine is created, this write must be migrated. Ownership must be re-confirmed at that point.

---

## 7. Rule Ownership

| Rule | Owner | Enforcement Layer | Risk |
|---|---|---|---|
| Email normalized + validated before auth call | login.controller.js via validateEmail | Controller | LOW |
| Redirect destination must be safe | authInputValidation.model.js (isSafeAuthReturnPath) | Model | LOW |
| Login must timeout at 15s (KRAVEN-LOGIN-H01) | useLogin.js (LOGIN_TIMEOUT_MS) | Hook | LOW |
| Authenticated users must not reach /login | AuthPublicRoute.jsx | Route guard | LOW |
| signInWithPassword projects only user.id + email | login.controller.js | Controller | LOW |
| Post-auth session must be hydrated before redirect | useLogin.js | Hook | MEDIUM — no BEHAVIOR.md entry |
| profiles.discoverable set true on login | profile.controller.js | Controller | MEDIUM — no BEHAVIOR.md entry |
| nav-state banners suppressed when login error present | LoginScreen.jsx | Screen | LOW |
| canSubmit owned by hook, consumed by screen | useLogin.js | Hook | RESOLVED — IRM-LOGIN-003 closed (2026-06-06) |

---

## 8. Contracts Touched

| Contract | Status |
|---|---|
| Architecture Contract (CLAUDE.md) | ACTIVE — app isolation, adapter boundary |
| Boundary Isolation Contract | PARTIAL — IRM-LOGIN-001 (iOS platform direct import undocumented) |
| Actor Ownership Contract | N/A — login is pre-actor phase (uses auth.users.id) |
| Public Identity Surface Contract | ACTIVE — isSafeAuthReturnPath governs redirect |

---

## 9. Documentation Links

| Document | Path | Status |
|---|---|---|
| Module index | modules/login/INDEX.md | EXISTS |
| Architecture | modules/login/ARCHITECTURE.md | EXISTS |
| Behavior | modules/login/BEHAVIOR.md | EXISTS |
| Security | modules/login/SECURITY.md | EXISTS |
| Feature security | features/auth/SECURITY.md | EXISTS |
| VENOM (login scope) | Not yet run | MISSING |
| BLACKWIDOW (login scope) | Not yet run | MISSING |
| ELEKTRA (login scope) | Not yet run | MISSING |
| LOKI (login runtime) | outputs/2026/06/06/Loki/2026-06-06_00-00_loki_auth-login.md | EXISTS |

---

## 10. Runtime Ownership

**Status: SOURCE_VERIFIED** (LOKI run 2026-06-06 — static analysis trace)
**IRM-LOGIN-004:** CLOSED

| Flow | Entry Point | Controllers | DALs | Hotspot |
|---|---|---|---|---|
| Login submit | LoginScreen onSubmit → useLogin.handleLogin | login, profile, authSession | login.dal, profile.dal, authSession.read.dal | supabase.auth.signInWithPassword (external — 300–2000ms; confirmed p99 hotspot) |
| Post-auth hydration | useLogin (after signIn success) | authSession.controller | authSession.read.dal | getSession — NETWORK on first call, cache HIT on second |
| Profile discoverability | useLogin (after hydration) | profile.controller | profile.dal (1× read + 0–1× write) | Non-fatal — errors swallowed; write conditional on discoverable=false |
| Redirect | useLogin → navigate() | N/A | N/A | isSafeAuthReturnPath guard (SYNC) |

**LOKI findings summary:**
- LOKI-LOGIN-001 (LOW): Duplicate getSession() — second call is Supabase client cache HIT; no network round-trip
- LOKI-LOGIN-002 (MEDIUM): Serial post-auth waterfall — signIn → hydrate → discoverability all SERIAL; route to KRAVEN
- LOKI-LOGIN-003 (LOW): signinMs captured but DEV-only; production has no timing signal for login latency
- LOKI-LOGIN-004 (LOW): Cached JWT identity check in profile.controller — pre-existing finding ELEK-2026-06-04-005

**Read Amplification:** LOW — no N+1, no fan-out, 1 duplicate getSession (cache HIT)
**Execution mode:** SERIAL throughout
**LOKI report:** [outputs/2026/06/06/Loki/2026-06-06_00-00_loki_auth-login.md](outputs/2026/06/06/Loki/2026-06-06_00-00_loki_auth-login.md)

---

## 11. Responsibilities

1. Authenticate users via email + password (Supabase signInWithPassword)
2. Normalize and validate email before auth DAL call
3. Map authentication errors to user-safe messages (mapLoginError)
4. Enforce safe redirect after successful login (isSafeAuthReturnPath)
5. Guard against stalled Supabase requests (LOGIN_TIMEOUT_MS = 15s)
6. Ensure post-auth profile discoverability (login-phase side effect)
7. Hydrate auth session after login success
8. Emit monitoring events on login error
9. Display nav-state banners (emailConfirmed, passwordReset, accountDeleted)
10. Manage iOS install prompt visibility on login screen
11. Redirect authenticated users away from /login (AuthPublicRoute)

---

## 12. Boundaries

**Must NOT:**
- Export LoginScreen from auth.adapter.js (correct — route-injected)
- Use actorId at login phase (pre-actor; use auth.users.id only)
- Expose session tokens or raw JWT to callers (login.controller.js projects user.id + email only)
- Silently expand scope to other auth sub-modules (reset, register, callback)

**Resolved boundary decisions:**
- IRM-LOGIN-001: iOS platform direct import — CLOSED (2026-06-06): accepted platform-layer dependency; documented in ARCHITECTURE.md
- IRM-LOGIN-002: profiles.discoverable write — CLOSED (2026-06-06): auth/login owns login-phase write; documented in ARCHITECTURE.md with migration note
- IRM-LOGIN-003: canSubmit — CLOSED (2026-06-06): moved to useLogin.js, consumed from hook in LoginScreen.jsx

---

## 13. Change Impact Rules

If `LoginScreen.jsx` changes:
- Verify nav-state banner logic (accountDeleted, emailConfirmed, passwordReset suppressed on error)
- Verify iOS install prompt still renders correctly
- Verify seasonal theme still applies

If `useLogin.js` changes:
- Verify timeout guard (LOGIN_TIMEOUT_MS) is preserved
- Verify monitoring payload does not include raw email or password
- Verify error state cleared on each new submit attempt

If `login.controller.js` changes:
- Verify email is normalized before DAL call
- Verify response projection (user.id + email only — no token exposure)

If `profile.dal.js` changes:
- Verify session guard in profile.controller.js (session.user.id === userId) still runs before write
- Confirm no other features have been given access to this DAL

If `authInputValidation.model.js` changes:
- Verify isSafeAuthReturnPath logic for redirect safety
- Verify mapLoginError still maps correctly for Supabase error codes
- Verify validateEmail regex change propagates to all consumers (useResetPassword now imports from this model — consolidated after ELEK-FP-004)

If `AuthPublicRoute.jsx` changes:
- All auth public routes affected: /login, /register, /forgot-password, /reset, /auth/callback, /verify-email

---

## 14. Release Gate Notes

THOR eligibility: **CAUTION** — ownership PARTIAL (improved)

Closed this session (2026-06-06):
- IRM-LOGIN-001: iOS boundary documented in ARCHITECTURE.md
- IRM-LOGIN-002: profiles.discoverable ownership documented in ARCHITECTURE.md
- IRM-LOGIN-003: canSubmit moved to useLogin.js
- IRM-LOGIN-004: runtime ownership SOURCE_VERIFIED via LOKI

Remaining before THOR:
- Security chain (VENOM/BW/ELEKTRA) not yet run for login-specific scope
- BEHAVIOR.md still has TODOs (state.from source, blocklist confirmation, useAuthOps surface)

Not a hard THOR blocker unless a login-specific security release is gated on full ownership completion.

---

## 15. Open Ownership Questions

1. Is `profile.dal.js` permanently owned by auth/login, or a temporary home until an identity engine is extracted?
2. Should `app/platform/ios/` expose a public adapter so auth screens import from a stable contract?
3. Should `canSubmit` move to `useLogin` to match the pattern in `useResetPassword`?
4. ~~When will LOKI run on the login flow to confirm runtime ownership?~~ CLOSED — LOKI run 2026-06-06; runtime ownership SOURCE_VERIFIED
5. Who owns the RLS policy on `profiles` table? (Not confirmed in this session.)
