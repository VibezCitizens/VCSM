# IRONMAN — Ownership Report
**Scope:** VCSM:auth — Login Module (LoginScreen + all connected layers)
**Date:** 2026-06-06
**Command:** IRONMAN v1
**ARCHITECT Gate:** INLINE PASS — evidence built from source reads this session (0 days old)

---

## Preflight Gate

| Gate | Source | Age | Status |
|---|---|---|---|
| ARCHITECT | Inline source reads — LoginScreen, useLogin, login.controller, login.dal, profile.controller, profile.dal, authSession.controller, authSession.read.dal, authInputValidation.model, profile.model, auth.adapter, auth.routes, AuthPublicRoute | 0 days | PASS |
| VENOM | Not required for IRONMAN | — | N/A |
| BLACKWIDOW | Not required for IRONMAN | — | N/A |

---

## Step 1 — Target

```
IRONMAN TARGET
Feature / Engine:   VCSM:auth — Login sub-module
Application Scope:  VCSM
Reason:             Ownership audit — first IRONMAN run for this module
```

---

## Step 2 — Code Roots

```
CODE ROOTS
Source:       Inline ARCHITECT evidence (2026-06-06)
Primary path: apps/VCSM/src/features/auth/
Module path:  apps/VCSM/src/features/auth/screens/LoginScreen.jsx
Entry files:  LoginScreen.jsx (view entry)
              useLogin.js (state machine entry)
              login.controller.js (auth action entry)
Route:        /login  (canonical)
              /       (welcome — not in scope)
```

---

## Step 3 — Layer Map

```
LAYER MAP
Source: Inline ARCHITECT evidence (2026-06-06)

Screen:
  LoginScreen.jsx
    apps/VCSM/src/features/auth/screens/LoginScreen.jsx
    Owns: UI layout, form field rendering, nav-state banners, iOS install prompt,
          seasonal theme, submit gate UI (canSubmit computed inline)

Hook:
  useLogin.js
    apps/VCSM/src/features/auth/hooks/useLogin.js
    Owns: email/password state, loading state, error state, LOGIN_TIMEOUT_MS guard,
          handleLogin async flow, post-auth redirect logic, monitoring emit

Controller:
  login.controller.js
    apps/VCSM/src/features/auth/controllers/login.controller.js
    Owns: email normalization (validateEmail), signInWithPassword DAL call,
          response projection (user.id + user.email only)

  profile.controller.js
    apps/VCSM/src/features/auth/controllers/profile.controller.js
    Owns: post-auth profile discoverability ensure (login phase only)
          session guard (session.user.id === userId check before profile write)

  authSession.controller.js
    apps/VCSM/src/features/auth/controllers/authSession.controller.js
    Owns: thin hydration wrapper (delegates to dalHydrateAuthSession)

DAL:
  login.dal.js
    apps/VCSM/src/features/auth/dal/login.dal.js
    Owns: supabase.auth.signInWithPassword, supabase.auth.getUser, supabase.auth.signOut

  profile.dal.js
    apps/VCSM/src/features/auth/dal/profile.dal.js
    Owns: profiles table — reads (discoverable), writes (discoverable, updated_at)
    ⚠ Boundary risk: auth-feature-owned DAL writing profiles table

  authSession.read.dal.js
    apps/VCSM/src/features/auth/dal/authSession.read.dal.js
    Owns: supabase.auth.getSession (dalHydrateAuthSession, dalGetAuthSession),
          supabase.auth.onAuthStateChange (dalSubscribeAuthStateChange)
    Note: shared across login module and reset-password module (auth-internal)

Model:
  authInputValidation.model.js
    apps/VCSM/src/features/auth/model/authInputValidation.model.js
    Owns: validateEmail (normalize + length + format), isValidEmailFormat,
          isSafeAuthReturnPath (redirect guard), mapLoginError (error classification)

  profile.model.js
    apps/VCSM/src/features/auth/model/profile.model.js
    Owns: ProfileModel shape factory (id, isDiscoverable)

Adapter:
  auth.adapter.js
    apps/VCSM/src/features/auth/adapters/auth.adapter.js
    LoginScreen is NOT exported from the adapter — correct.
    Exported: useAuthOps, useJoinOnboarding, authTheme, isEmailVerifiedModel,
              CompleteProfileGate, VerifyEmailRequiredScreen, ConsentCheckbox

Route guard:
  AuthPublicRoute.jsx
    apps/VCSM/src/app/routes/public/AuthPublicRoute.jsx
    Redirects authenticated users (user !== null) to /feed

Route factory:
  auth.routes.jsx
    apps/VCSM/src/app/routes/public/auth.routes.jsx
    /login wrapped in AuthPublicRoute — LoginScreen injected as prop

Platform (cross-layer):
  IosInstallPrompt
    apps/VCSM/src/app/platform/ios/components/IosInstallPrompt.jsx
    Imported directly into LoginScreen — not through adapter

  useIOSInstallVisibility
    apps/VCSM/src/app/platform/ios/useIOSInstallVisibility.js
    Imported directly into LoginScreen — not through adapter
```

---

## Step 4 — Dependency Ownership

```
DEPENDENCY OWNERSHIP
Source: Inline ARCHITECT evidence (2026-06-06)

Engines used:
  NONE — Login module does not consume engines/ directory

Shared modules:
  @/services/monitoring/monitoringClient  — captureFrontendError
  @/services/supabase/supabaseClient      — Supabase singleton (via all DALs)
  @/season                                — getActiveSeasonTheme (seasonal UI)
  @i18n                                   — useTranslation
  @/app/platform/ios/                     — IosInstallPrompt, useIOSInstallVisibility
                                            (direct import — not adapted)
  @debuggers/identity                     — debugLoginEvent, debugLoginError,
                                            debugLoginSessionSnapshot (DEV only)

External services:
  Supabase Auth — supabase.auth.signInWithPassword, getUser, getSession, signOut
```

---

## Step 5 — Data Ownership

```
DATA OWNERSHIP
Source: Inline ARCHITECT evidence (2026-06-06)

Tables read:
  auth.users   — via supabase.auth.signInWithPassword + getUser (Supabase-managed)
  auth.users   — via supabase.auth.getSession (Supabase-managed)
  profiles     — dal: dalGetProfileDiscoverable → profiles.id, profiles.discoverable

Tables written:
  auth.sessions — via supabase.auth.signInWithPassword (Supabase-managed, implicit)
  profiles      — dal: dalUpdateProfileDiscoverable → profiles.discoverable, profiles.updated_at

Identity surfaces:
  auth.users.id — used as userId in profile.controller.js (pre-actor resolution)
  data.user.id  — projected from signInWithPassword response (never stored client-side)
  session.user  — from getSession, used to guard profile write

Caches:
  NONE — no client-side cache writes

IRONMAN_OWNERSHIP_CONFLICT:
  profiles.discoverable is written by profile.dal.js inside the auth feature.
  If a standalone profile or identity feature/engine exists or is created,
  this write would need to be migrated. Flag as IRM-LOGIN-002.
```

---

## Step 6 — Governance Ownership

```
GOVERNANCE OWNERSHIP

Contracts touched:
  Architecture Contract (CLAUDE.md) — app isolation, adapter boundary rules
  Boundary Isolation Contract       — cross-feature imports must go via adapter
  Actor Ownership Contract          — N/A (login is pre-actor, uses auth.users.id)
  Public Identity Surface Contract  — isSafeAuthReturnPath governs redirect safety

Logan docs:
  ZZnotforproduction/APPS/VCSM/features/auth/modules/login/ARCHITECTURE.md  (exists)
  ZZnotforproduction/APPS/VCSM/features/auth/modules/login/BEHAVIOR.md      (exists)
  ZZnotforproduction/APPS/VCSM/features/auth/modules/login/SECURITY.md      (exists)
  ZZnotforproduction/APPS/VCSM/features/auth/modules/login/INDEX.md         (exists)
  ZZnotforproduction/APPS/VCSM/features/auth/SECURITY.md                    (feature-level)

Security audits:
  VENOM: not yet run for login-specific scope
  BLACKWIDOW: not yet run for login-specific scope
  ELEKTRA: not yet run for login-specific scope

Engine audits: N/A (no engine dependency)
Runtime audits: LOKI not run for login scope
Migration audits: N/A (no migration authored for login module this session)
```

---

## Step 7 — Ownership Record

```
IRONMAN OWNERSHIP RECORD
Feature:          VCSM:auth — Login Module
Application Scope: VCSM
Primary files:
  apps/VCSM/src/features/auth/screens/LoginScreen.jsx
  apps/VCSM/src/features/auth/hooks/useLogin.js
  apps/VCSM/src/features/auth/controllers/login.controller.js
  apps/VCSM/src/features/auth/controllers/profile.controller.js
  apps/VCSM/src/features/auth/controllers/authSession.controller.js
  apps/VCSM/src/features/auth/dal/login.dal.js
  apps/VCSM/src/features/auth/dal/profile.dal.js
  apps/VCSM/src/features/auth/dal/authSession.read.dal.js
  apps/VCSM/src/features/auth/model/authInputValidation.model.js
  apps/VCSM/src/features/auth/model/profile.model.js
  apps/VCSM/src/features/auth/adapters/auth.adapter.js
  apps/VCSM/src/app/routes/public/auth.routes.jsx          (shared: auth routes)
  apps/VCSM/src/app/routes/public/AuthPublicRoute.jsx      (shared: route guard)

Engines used: NONE
Tables touched: auth.users (read, Supabase-managed), profiles (read + write)
Contracts touched: Architecture Contract, Boundary Isolation Contract,
                   Public Identity Surface Contract
Docs touched: modules/login/ARCHITECTURE.md, BEHAVIOR.md, SECURITY.md, INDEX.md

Responsibilities:
  1. Authenticate users via email + password (Supabase signInWithPassword)
  2. Normalize and validate email before auth DAL call
  3. Map authentication errors to user-safe messages
  4. Enforce safe redirect after successful login (isSafeAuthReturnPath)
  5. Guard against stalled Supabase requests (LOGIN_TIMEOUT_MS = 15s)
  6. Ensure post-auth profile discoverability (login-phase side effect)
  7. Hydrate auth session after login success
  8. Emit monitoring events on login error
  9. Display nav-state banners (emailConfirmed, passwordReset, accountDeleted)
  10. Manage iOS install prompt visibility on login screen
  11. Redirect authenticated users away from /login (AuthPublicRoute)

Boundary rules:
  - LoginScreen must NOT be exported from auth.adapter.js (correct — injected via route factory)
  - Cross-feature imports must go via adapter — IosInstallPrompt is imported directly (see IRM-LOGIN-001)
  - actorId must NOT be used at login phase — userId (auth.users.id) is the correct identity here
  - login.controller.js must project only user.id + user.email (no token exposure)
  - profile.dal.js writes are pre-actor-resolution — must remain guarded by session.user.id check
```

---

## Findings

### IRM-LOGIN-001 — Platform Layer Imported Directly Into Auth Screen

```
IRONMAN OWNERSHIP FINDING
Finding ID:           IRM-LOGIN-001
Feature / Engine:     VCSM:auth — Login Module
Application Scope:    VCSM
Responsibility Type:  Boundary Isolation / UI Ownership
Ownership Clarity:    PARTIAL
Boundary Risk:        MEDIUM
Severity:             MEDIUM

Primary code roots:
  apps/VCSM/src/features/auth/screens/LoginScreen.jsx (lines 16-17)

Core layers:
  Screen → Platform (direct import, bypassing adapter)

Imports in question:
  import IosInstallPrompt from '@/app/platform/ios/components/IosInstallPrompt'
  import { useIOSInstallVisibility } from '@/app/platform/ios/useIOSInstallVisibility'

Current ambiguity:
  The auth feature screen imports directly from app/platform/ios/ without an
  adapter boundary. If the iOS platform layer changes its API surface, LoginScreen
  breaks. The auth feature has no declared dependency contract with the iOS layer.

Risk:
  Medium — coupling is functional today. If platform/ios/ is refactored or moved,
  LoginScreen is a silent casualty with no ownership contract protecting the boundary.

Recommended ownership clarification:
  Option A: Expose IosInstallPrompt and useIOSInstallVisibility from an
            app/platform/ios/index.js adapter that is imported as a single alias.
  Option B: Accept as platform-layer coupling with a documented boundary decision
            (record in login ARCHITECTURE.md).

Recommended handoff: LOGAN to document boundary decision.
Rationale: CLAUDE.md states all cross-folder access goes through the feature's adapter.
           app/platform/ios/ is a cross-folder dependency without an adapter gate.
```

---

### IRM-LOGIN-002 — profiles Table Written by auth Feature DAL

```
IRONMAN OWNERSHIP FINDING
Finding ID:           IRM-LOGIN-002
Feature / Engine:     VCSM:auth — Login Module
Application Scope:    VCSM
Responsibility Type:  Data Ownership / DAL Ownership
Ownership Clarity:    PARTIAL
Boundary Risk:        MEDIUM
Severity:             MEDIUM

Primary code roots:
  apps/VCSM/src/features/auth/dal/profile.dal.js
  apps/VCSM/src/features/auth/controllers/profile.controller.js

Tables touched:
  profiles — discoverable (read + write)

Current ambiguity:
  profile.dal.js lives inside the auth feature directory but owns writes to the
  profiles table. The profiles table is a platform-wide identity table, not
  exclusive to the auth login flow. If a dedicated profile or identity feature
  is created, this DAL would need migration to avoid dual ownership.

  The operation is login-phase only (ensure discoverable = true on sign-in) and
  is guarded by session.user.id === userId verification before writing. The
  coupling is intentional but undocumented as an ownership decision.

Risk:
  Latent — no conflict today, but the auth feature claiming write ownership of
  profiles.discoverable creates tension if the profile surface expands.

Recommended ownership clarification:
  Document in ARCHITECTURE.md that auth/login owns the post-login discoverability
  side effect and the profile.dal.js write is login-phase-only.
  Tag: LOGIN_PHASE_PROFILES_WRITE_OWNER = auth/login (until identity engine extracts it).

Recommended handoff: LOGAN to update module ARCHITECTURE.md with ownership note.
Rationale: Without documentation, a future engineer might move profiles writes
           to a profile engine without knowing auth/login depends on the current path.
```

---

### IRM-LOGIN-003 — canSubmit Rule Owned by Screen, Not Hook

```
IRONMAN OWNERSHIP FINDING
Finding ID:           IRM-LOGIN-003
Feature / Engine:     VCSM:auth — Login Module
Application Scope:    VCSM
Responsibility Type:  Controller Ownership / Rule Ownership
Ownership Clarity:    PARTIAL
Boundary Risk:        LOW
Severity:             LOW

Primary code roots:
  apps/VCSM/src/features/auth/screens/LoginScreen.jsx (line 36)

Current ambiguity:
  const canSubmit = !loading && email.trim() && password.trim()

  The submit gate is computed in the screen directly, not in the hook.
  The hook (useLogin) owns email, password, loading state but does not
  expose or compute canSubmit. This creates a split: the rule is owned
  at the view layer, not at the domain layer where state lives.

  Contrast: useResetPassword owns canSubmit internally (useMemo), making
  the hook the single authority for submit readiness in that flow.

Risk:
  Low — no security impact. UX only. If a duplicate login surface is built
  (e.g., modal, drawer), the submit rule would need to be duplicated rather
  than shared from the hook.

Recommended ownership clarification:
  Move canSubmit logic into useLogin, expose it in the return value.
  This matches the pattern established by useResetPassword.
  Low priority — MEDIUM effort, no security gain.

Recommended handoff: SPIDER-MAN for regression coverage if moved.
Rationale: Ownership consistency across auth hooks.
```

---

### IRM-LOGIN-004 — Runtime Ownership Inferred (No LOKI Evidence)

```
IRONMAN OWNERSHIP FINDING
Finding ID:           IRM-LOGIN-004
Feature / Engine:     VCSM:auth — Login Module
Application Scope:    VCSM
Responsibility Type:  Runtime Ownership
Ownership Clarity:    PARTIAL
Boundary Risk:        LOW
Severity:             LOW (informational)

Current ambiguity:
  No LOKI report exists for the login flow. Runtime ownership below is inferred
  from source reads.

Risk:
  Low — KRAVEN-LOGIN-H01 (15s timeout guard) is already implemented. Runtime
  risks are partially mitigated. LOKI would confirm actual hot paths and latency
  distribution under real traffic.

Recommended handoff: LOKI → KRAVEN for login flow performance audit.
```

---

## Governance Classification

### Ownership Clarity

```
Ownership Clarity:  PARTIAL
Evidence:
  - Feature ownership is clear: auth feature owns the login module
  - Code root is clear: apps/VCSM/src/features/auth/
  - DAL ownership is clear for auth DALs; PARTIAL for profile.dal.js (data conflict latent)
  - Platform dependency (iOS layer) is undocumented — missing boundary decision
  - canSubmit rule is split between screen and hook
Confidence: HIGH
```

### Responsibility Classification

| Responsibility Type | Owner | Confidence | Notes |
|---|---|---|---|
| Feature ownership | VCSM:auth — login module | HIGH | Clear feature boundary |
| Screen ownership | LoginScreen.jsx | HIGH | Single screen |
| Hook ownership | useLogin.js | HIGH | Single hook, complete login state machine |
| Controller ownership | login.controller.js | HIGH | Email normalization + signInWithPassword |
| Post-auth side effect ownership | profile.controller.js | MEDIUM | Pre-actor login phase — profile write in auth |
| DAL ownership (auth) | login.dal.js | HIGH | Supabase auth calls only |
| DAL ownership (profiles) | profile.dal.js | MEDIUM | Write in auth feature for profiles table |
| Data ownership (profiles) | auth/login (login phase) | MEDIUM | Undocumented; latent conflict risk |
| Validation rule ownership | authInputValidation.model.js | HIGH | Single canonical model |
| Error mapping ownership | authInputValidation.model.js (mapLoginError) | HIGH | Clear owner |
| Redirect safety ownership | authInputValidation.model.js (isSafeAuthReturnPath) | HIGH | Clear owner |
| Submit gate ownership | LoginScreen.jsx (screen) | MEDIUM | Should move to hook |
| Route guard ownership | AuthPublicRoute.jsx | HIGH | Shared across all auth routes |
| Runtime ownership | Inferred (no LOKI) | LOW | Needs LOKI confirmation |
| iOS platform coupling | Undocumented | MEDIUM | Direct import, no adapter |
| Monitoring ownership | monitoringClient (platform service) | HIGH | Platform-level, not auth-owned |
| Documentation ownership | auth/login module docs | HIGH | modules/login/ present |

### Ownership Boundary Risk

| Area | Risk | Reason | Recommended Clarification |
|---|---|---|---|
| iOS platform direct import | MEDIUM | auth screen imports platform layer without adapter | Document or adapt via platform/ios/index.js |
| profiles write in auth DAL | MEDIUM | latent dual-ownership if profile engine created | Document as login-phase owner in ARCHITECTURE.md |
| canSubmit in screen | LOW | rule split from state owner | Move to useLogin hook |
| authSession.read.dal.js shared | LOW | shared within auth feature only | Acceptable — auth-internal |
| No LOKI evidence | LOW | runtime ownership inferred | Run LOKI on login flow |

### Cross-Root Ownership Review

| Area | Claimed Owner | Actual Root | Boundary Status | Notes |
|---|---|---|---|---|
| IosInstallPrompt import | auth/login screen | app/platform/ios/ | UNDOCUMENTED | Direct import, no adapter |
| supabaseClient | auth DALs | services/supabase/ | CLEAN | Platform service — acceptable pattern |
| monitoringClient | auth hook | services/monitoring/ | CLEAN | Platform service — acceptable pattern |
| @debuggers/identity | auth hook | debuggers/ | CLEAN | Dev-only, not shipping to production |

---

## Runtime Ownership Map

| Runtime Flow | Entry Point | Owning Feature | Controllers | DALs | Hotspots |
|---|---|---|---|---|---|
| Login submit | LoginScreen onSubmit → useLogin.handleLogin | auth/login | login.controller, profile.controller, authSession.controller | login.dal, profile.dal, authSession.read.dal | supabase.auth.signInWithPassword (external call — inferred as p99 hotspot) |
| Post-auth hydration | useLogin (after signIn success) | auth/login | authSession.controller | authSession.read.dal | getSession call (sequential, blocking) |
| Profile discoverability | useLogin (after hydration) | auth/login | profile.controller | profile.dal | Non-fatal — errors swallowed by try/catch |
| Redirect | useLogin → navigate() | auth/login | N/A | N/A | isSafeAuthReturnPath guard |

Runtime ownership: **INFERRED** (no LOKI evidence).

---

## Data Ownership Registry

| Object | Primary Owner | Read Consumers | Write Owner | RLS Owner | Migration Owner | Docs Owner |
|---|---|---|---|---|---|---|
| auth.users | Supabase (managed) | auth/login (via signInWithPassword) | Supabase | Supabase | Supabase | — |
| auth.sessions | Supabase (managed) | auth/login (via getSession) | Supabase (on signIn) | Supabase | Supabase | — |
| profiles.discoverable | auth/login (login phase) | auth/login (profile.controller) | auth/login (profile.dal) | Not confirmed | Not confirmed | modules/login ARCHITECTURE.md (pending) |

---

## Rule Ownership Registry

| Rule | Owner | Enforcement Layer | Docs | Risk |
|---|---|---|---|---|
| Email must be normalized + validated before auth call | login.controller.js via validateEmail | Controller | authInputValidation.model.js | LOW — clear owner |
| Redirect destination must be safe (isSafeAuthReturnPath) | authInputValidation.model.js | Model | authInputValidation.model.js | LOW — clear owner |
| Login must timeout at 15s (KRAVEN-LOGIN-H01) | useLogin.js (LOGIN_TIMEOUT_MS) | Hook | BEHAVIOR.md (pending entry) | LOW — implemented |
| Authenticated users must not reach /login | AuthPublicRoute.jsx | Route guard | auth.routes.jsx | LOW — implemented |
| signInWithPassword must project only user.id + email | login.controller.js | Controller | — | LOW — implemented |
| Post-auth session must be hydrated before redirect | useLogin.js | Hook | — | MEDIUM — no LOKI coverage |
| profiles.discoverable must be set true on login | profile.controller.js | Controller | — | MEDIUM — no BEHAVIOR.md entry |

---

## THOR Release Gate Notes

| Check | Status | Notes |
|---|---|---|
| Feature ownership clear | PASS | auth/login owns the flow end-to-end |
| Code roots confirmed | PASS | apps/VCSM/src/features/auth/ |
| Critical rule ownership documented | PARTIAL | isSafeAuthReturnPath and timeout documented in code; BEHAVIOR.md entries pending |
| Data write ownership documented | PARTIAL | profiles.discoverable write not in ARCHITECTURE.md |
| Cross-root boundary documented | WARN | iOS platform direct import undocumented |
| Runtime ownership confirmed | WARN | LOKI not run; runtime is inferred |
| VENOM / BLACKWIDOW / ELEKTRA for login scope | NOT RUN | Security chain not started for login-specific scope |

**THOR eligibility:** CAUTION — ownership is PARTIAL. Not a hard blocker for a release, but three documentation gaps should be addressed before a security audit gate (VENOM/BW/ELEKTRA) is opened for the login flow.

---

## Open Ownership Questions

1. Is `profile.dal.js` permanently owned by auth/login, or is it a temporary home until an identity engine is extracted?
2. Should `app/platform/ios/` expose a public adapter so auth screens import from it via a stable contract?
3. Should `canSubmit` move to `useLogin` to match the pattern in `useResetPassword`?
4. When will LOKI run on the login flow to confirm runtime ownership?

---

## Provenance

| Source File | Layer | Lines Read |
|---|---|---|
| LoginScreen.jsx | screen | 1-277 |
| useLogin.js | hook | 1-115 |
| login.controller.js | controller | 1-33 |
| profile.controller.js | controller | 1-26 |
| authSession.controller.js | controller | 1-5 |
| login.dal.js | dal | 1-13 |
| profile.dal.js | dal | 1-31 |
| authSession.read.dal.js | dal | 1-17 |
| authInputValidation.model.js | model | 1-79 |
| profile.model.js | model | 1-8 |
| auth.adapter.js | adapter | 1-8 |
| auth.routes.jsx | route | 1-30 |
| AuthPublicRoute.jsx | route-guard | 1-32 |
