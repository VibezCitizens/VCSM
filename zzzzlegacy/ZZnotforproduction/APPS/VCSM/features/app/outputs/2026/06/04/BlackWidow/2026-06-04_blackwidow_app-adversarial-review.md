# BLACKWIDOW V2 — Adversarial Runtime Verification Report
# Feature: app | VCSM
# Date: 2026-06-04
# Protocol: BW2.5 V2

---

## 1. Output Metadata

| Field | Value |
|---|---|
| Feature | app |
| App | VCSM |
| Protocol | BW2.5 V2 |
| Run Date | 2026-06-04 |
| Analyst | BLACKWIDOW V2 |
| Scanner Version | 1.1.0 |
| Scanner Maps Timestamp | 2026-06-04T19:48:25.152Z (FRESH) |
| Output File | outputs/2026/06/04/BlackWidow/2026-06-04_blackwidow_app-adversarial-review.md |

---

## 2. Scanner Preflight

- Scanner Version: 1.1.0
- Maps Generated: 2026-06-04T19:48:25.152Z
- Status: FRESH (~7h old at time of analysis)
- Security paths attributed to this feature in scanner: **0**
- Total platform security paths: 598
- Callgraph nodes attributed to app: **239 nodes, 618 edges**
- Callgraph layers: barrel (55), module (175), component (3), hook (6)
- Hook entry points found: useIOSKeyboard (4 entries), useIOSPlatform (1 entry)

---

## 3. Scanner Inputs

| Map | Coverage |
|---|---|
| security-path-map.json | 0 paths attributed to feature `app` |
| callgraph.json | 239 nodes, 618 edges |
| write-execution-map.json | 0 write paths attributed to feature `app` |
| rpc-execution-map.json | 0 RPC paths attributed to feature `app` |

**Scanner confidence level: LOW** — the scanner attributes no security or write paths to this feature. The `app` feature is the application shell (routing, auth context, guards), not a domain feature with DAL writes. Attack surface was derived entirely from source code survey.

---

## 4. Attack Surface Inventory

### 4.1 High-Confidence Surface (Source-Verified)

| Surface | File | Risk Class |
|---|---|---|
| Auth session hydration | AuthProvider.jsx:83-98 | Session establishment — if Supabase returns stale/null session |
| Auth state change subscription | AuthProvider.jsx:103-150 | Session mutation gate |
| PASSWORD_RECOVERY handler + nonce write | AuthProvider.jsx:121-125 | Recovery provenance enforcement |
| Recovery nonce validation | setNewPassword.controller.js:55-71 | Recovery bypass gate |
| Password update execution | setNewPassword.controller.js:166-178 | Credential mutation |
| ProtectedRoute email-verified gate | ProtectedRoute.jsx:41-47 | Authenticated access control |
| OwnerOnlyDashboardGuard | appRoutes.redirects.jsx:23-34 | Dashboard ownership UI gate |
| BlockedVportGuard | appRoutes.redirects.jsx:36-42 | Blocked-actor access control |
| AuthPublicRoute redirect | AuthPublicRoute.jsx:17-18 | Authenticated-user route exclusion |
| /reset-password NOT wrapped in AuthPublicRoute | auth.routes.jsx:47-64 | Intentional auth bypass with documented gate |
| Logout scope: local only | AuthProvider.jsx:198 | Session scope limitation |
| createUserActorForProfile profileId===userId guard | createUserActor.controller.js:26-30 | Actor creation ownership enforcement |
| completeOnboardingController session userId check | onboarding.controller.js:70-77 | Onboarding identity binding |
| bootstrapJoinOnboardingController authedId===userId | onboarding.controller.js:152-155 | Join flow identity binding |
| Identity ownership mismatch rejection | useIdentityResolutionEffect.hook.js:152-160 | Identity commit ownership |
| Wanders session mirror user match | register.controller.js:26-33 | Cross-client session guard |
| iosProdDebugger IS_PROD guard | iosProdDebugger.js:5,123-134 | Debug data production exclusion |
| DEV-only debug route guard | app.routes.jsx:163-174 | Diagnostic route production exclusion |

### 4.2 LOW-Confidence / No Scanner Attribution

The scanner attributes 0 security paths to this feature. The `app` feature functions as a routing shell with no database write DAL of its own. All attack surfaces are auth-layer and access-control layer. Scanner gap is expected, not a scanner failure.

### 4.3 DAL Write Surfaces (in scope)

| DAL | Mutation | Auth Binding |
|---|---|---|
| actorOwnerCreate.dal.js | upsert vc.actor_owners | actorId + userId supplied by controller |
| actorCreate.dal.js | RPC create_actor_for_user | profileId = authenticated user.id (enforced by controller) |
| onboarding.dal.js | upsert profiles | profileId = authenticated user.id |
| register.dal.js | upsert profiles | userId from session, client-validated |
| resetPassword.dal.js | auth.updateUser({ password }) | Supabase JWT required, no server-side recovery provenance |

---

## 5. Scanner Signals

- 0 VENOM/ELEKTRA scanner-attributed paths for feature `app`
- 8 open VENOM findings from prior run (VEN-APP-001 to VEN-APP-008) — cross-referenced below
- ELEKTRA Status: NOT RUN — no prior ELEKTRA scan for this feature
- BEHAVIOR.md: PLACEHOLDER — §9 invariants are UNANCHORED

---

## 6. Adversarial Path Analysis

### A. OWNERSHIP BYPASS

**Attack**: Can an actor submit a mutation with another actor's resource ID to the app shell or auth layer?

**Targets**: createUserActorForProfile, completeOnboardingController, bootstrapJoinOnboardingController

**Source Review**:

- `createUserActor.controller.js:26-30`: Hard guard — `if (profileId !== userId) throw new Error('profileId must match authenticated userId...')`. The caller (onboarding.controller.js:116-119) passes `user.id` for both. This is SOURCE_VERIFIED.
- `onboarding.controller.js:70-77`: Checks `if (userId && userId !== user.id)` where `user` comes from `dalGetAuthSession()` — session is the authority, not client payload. SOURCE_VERIFIED.
- `bootstrapJoinOnboardingController:152-155`: `if (!authedId || authedId !== userId) throw`. SOURCE_VERIFIED.

**Result: BLOCKED** — ownership is enforced at the controller layer for all actor creation and onboarding paths. Cross-actor creation is structurally impossible without a valid session for the target user.

**Finding**: None — BLOCKED across all three mutation paths.

---

### B. SESSION MUTATION

**Attack**: Is viewerActorId taken from session (trusted) or from client payload (untrusted)?

**Source Review**:

- All onboarding controllers derive userId from `dalGetAuthSession()` → `supabase.auth.getSession()`, not from client payload. SOURCE_VERIFIED (authSession.read.dal.js:8-11, onboarding.controller.js:65, bootstrapJoinOnboardingController:149).
- `readCurrentAuthUserDAL()` in `authOps.controller.js` uses `supabase.auth.getUser()` — the server-verified path. SOURCE_VERIFIED (onboarding.dal.js:3-6).
- Recovery nonce is read from sessionStorage (client-side), but this controls only the reset form state — not the actual password update. `dalUpdateUserPassword` uses `supabase.auth.updateUser({ password })` which requires an authenticated JWT. SOURCE_VERIFIED (resetPassword.dal.js:16-18).

**Exception — VEN-APP-001 (OPEN)**: A source-code-aware user with any valid session can produce a structurally conforming nonce (`{nonce: <uuid>, issuedAt: <timestamp>}`) by reading the source, then call `sessionStorage.setItem('vc.auth.recovery', <conforming JSON>)`, causing the recovery controller to return `{ ok: true }`. The result is `dalUpdateUserPassword` executes with their own valid JWT. Impact: **self-exploitation only** (changes own password). No cross-user path.

**BW-APP-001 | HIGH | BYPASSED (self-exploit only)**: Recovery nonce gate is entirely client-side. A user who reads setNewPassword.controller.js:47 learns the key name `vc.auth.recovery` and lines 60-70 reveal the exact JSON schema (`{nonce: string, issuedAt: number}`). Any user with a valid authenticated session (not necessarily a recovery session) can construct this nonce and reach `dalUpdateUserPassword`. Self-exploitation only — confirmed in VEN-APP-001. Aligned finding, new BW classification.

---

### C. RUNTIME ABUSE

**Attack**: Can a non-owner actor type reach owner-only dashboard paths?

**Source Review**:

- `OwnerOnlyDashboardGuard` (appRoutes.redirects.jsx:23-34): Compares URL `:actorId` param against `identity.actorId` from the session. Redirects to `/feed` on mismatch. This is a UI-only guard (documented in PORT-V-006/008 comment at line 16-21). SOURCE_VERIFIED.
- The guard does NOT enforce actor kind. A user actor (kind: 'user') whose actorId matches the URL param would pass the guard and reach VportDashboard screens. However: actor kind validation is performed by individual dashboard card controllers per the PORT-V-006/008 note.

**BW-APP-002 | MEDIUM | PARTIAL**: OwnerOnlyDashboardGuard validates URL actorId === session actorId but does NOT validate that the actor is kind='vport'. A 'user' kind actor whose actorId matches the URL param passes the guard. Authoritative enforcement relies on downstream dashboard controllers per documented PORT-V-006/008 architecture decision. The route-level kind check gap is acknowledged in the codebase comments — but is unverified without reviewing each dashboard card controller. [SCANNER_LOW_CONF — downstream controllers not fully reviewed in this pass]

**Attack**: Can a non-owner bypass OwnerOnlyDashboardGuard by manipulating identity.actorId?

- `identity.actorId` comes from the hydration engine, which fetches from `vc.actor_owners` via RPC. It cannot be set by client payload. SOURCE_VERIFIED (identity.controller.js:111-116, createUserActor.controller.js).

**Result**: BLOCKED for cross-actor bypass. PARTIAL for actor-kind enforcement at route layer.

---

### D. RLS VERIFICATION

**Attack**: Are there DAL write surfaces in the app shell that rely on RLS without an application-level ownership filter?

**Source Review**:

- `actorOwnerCreate.dal.js`: Upserts `vc.actor_owners` with explicit `{ actor_id: actorId, user_id: userId }` pair. The controller enforces `profileId === userId` before calling this. SOURCE_VERIFIED.
- `actorCreate.dal.js`: Uses RPC `create_actor_for_user` — server-side function, RLS is the DB boundary. No client-side ID injection. SOURCE_VERIFIED.
- `onboarding.dal.js → upsertCompletedOnboardingProfileDAL`: Upserts `profiles` with `id: profileId` where `profileId = session.user.id`. No client-supplied ID override possible. SOURCE_VERIFIED.
- `onboarding.dal.js → upsertProfileShellDAL`: Upserts `profiles` with `id` passed from `ensureProfileShell({ userId })` which gets userId from `readCurrentAuthUserDAL()` (server-auth). SOURCE_VERIFIED.

**BW-APP-003 | LOW | UNRESOLVED**: `upsertCompletedOnboardingProfileDAL` upserts `profiles` with fields including `publish: true` and `discoverable: true` (onboarding.dal.js:79-80). These boolean flags affect profile visibility. There is no application-level validation that the user has consented to publication, nor a model-level guard preventing a re-run of `completeOnboardingController` from toggling these flags for an already-published profile. This is a design observation rather than a confirmed bypass — RLS on the `profiles` table is assumed to prevent cross-user writes. [SCANNER_LOW_CONF — RLS policy on `profiles` not independently verified in this run]

---

### E. VIEWER CONTEXT FUZZING

**Attack**: What happens if null/undefined user is passed through the auth layer?

**Source Review**:

- `AuthProvider.jsx:86-90`: `setUser(nextSession?.user ?? null)` — null-safe. If session is null, user is null. SOURCE_VERIFIED.
- `ProtectedRoute.jsx:33-38`: `if (!user) { return <Navigate to="/login" replace /> }` — null user forces redirect. SOURCE_VERIFIED.
- `OwnerOnlyDashboardGuard:28-33`: `if (!identity) return <Navigate to="/feed" replace />` — null identity forces redirect. SOURCE_VERIFIED.
- `useIdentityResolutionEffect.hook.js:44-49`: `if (!user?.id) { commitIdentity(null); setLoading(false); return }` — null user.id → null identity committed. SOURCE_VERIFIED.
- `createUserActorForProfile:16-18`: `if (!profileId || !userId) throw new Error(...)` — null guard. SOURCE_VERIFIED.

**Result: BLOCKED** — null user/identity is handled at every layer. No path allows a null user to reach authenticated or owner-only routes.

**Attack**: Can `identityLoading = true` be exploited to render protected content before identity resolves?

- `RootLayout.jsx:89`: `{(isAuthRoute || !identityLoading) ? <Outlet /> : null}` — content is null-gated while identity loads. SOURCE_VERIFIED.

**Result: BLOCKED**.

---

### F. MUTATION REPLAY

**Attack**: Can a completed password recovery session be replayed?

**Source Review**:

- After successful password update: `dalSignOutRecoverySession()` is called (setNewPassword.controller.js:173). The recovery session JWT is invalidated. SOURCE_VERIFIED.
- `clearRecoveryFlag()` is also called from both the controller and the hook after success (setNewPassword.controller.js:73-75, useSetNewPassword.js:117). SOURCE_VERIFIED.
- `AuthProvider.jsx:129-131`: On `USER_UPDATED` or `SIGNED_OUT` events, `_clearRecoveryFlag()` is called automatically. SOURCE_VERIFIED.

**BW-APP-004 | LOW | PARTIAL**: The 30-minute nonce TTL (setNewPassword.controller.js:48) means a recovery nonce written by a real PASSWORD_RECOVERY event remains valid for 30 minutes. If a user clicks the reset link, receives the nonce in sessionStorage, then does NOT complete the password reset (closes tab, etc.), the nonce persists for up to 30 minutes. A second tab opened within that window to `/reset-password` will also find the nonce valid and allow form access. This is a short window and low-risk given the nonce is sessionStorage-scoped (tab-isolated in most browsers), but the TTL is a replay window. Impact: minor — access to own password-reset form during TTL window. [SOURCE_VERIFIED — setNewPassword.controller.js:48]

**Attack**: Can a completed actor creation be replayed to create duplicate actor rows?

- `createUserActorForProfile` checks `dalGetActorByProfile(profileId)` first (line 33) and returns existing actor if found. SOURCE_VERIFIED.
- `dalCreateActorOwner` uses upsert with `ignoreDuplicates: true` on conflict. SOURCE_VERIFIED.

**Result: BLOCKED** — actor creation is idempotent.

---

### G. HYDRATION POISONING

**Attack**: Can actor summaries be poisoned or served stale via the identity hydration path?

**Source Review**:

- Identity is loaded via `loadDefaultIdentityForUser` → `resolveAuthenticatedContext` (engine) → `readIdentityActorByIdDAL(selectedActorId)` → `hydrateIdentityActor`. SOURCE_VERIFIED (identity.controller.js:60-247).
- `useIdentityResolutionEffect.hook.js:152-160`: After hydration, the identity's `_engineMeta.userId` is compared to `user.id` from the session. If they differ, identity is rejected with `commitIdentity(null)`. SOURCE_VERIFIED.
- In-flight dedup key is `${userId}:${resolveAttempt}` — keyed on server-derived userId. SOURCE_VERIFIED (identity.controller.js:88-98).

**BW-APP-005 | LOW | PARTIAL**: The in-flight dedup map (`_identityInflight`) is module-level mutable state. If a concurrent resolve for a different userId races (e.g., rapid account switching), the dedup key includes userId so cross-user contamination is not possible. However, the map is never bounded — a fast-switching scenario could theoretically cause the map to grow, though each entry is promise-scoped and cleaned up via `.finally()`. No security bypass. [SOURCE_VERIFIED — identity.controller.js:88-98]

**Result: BLOCKED** for poisoning. PARTIAL for theoretical unbounded map growth (no security impact).

---

### H. URL SURFACE

**Attack**: Do any deep links, share links, or notification paths expose raw UUIDs for the app shell?

**Source Review**:

- Reset password redirect URL is constructed as: `${window.location.origin}/reset-password` (sendResetPassword.controller.js:9). This is a clean path — no raw UUIDs. SOURCE_VERIFIED.
- Auth callback URL `/auth/callback` — no UUID in path. SOURCE_VERIFIED.
- Dashboard routes: `/actor/:actorId/dashboard` — actorId IS a raw UUID. This was pre-existing; the actorId in dashboard URLs is a known pattern. The route guard reads it via `useParams()` and compares to session identity. No new exposure.
- Navigation routes in app shell generally use `/profile/self`, `/feed`, `/login` — clean paths.

**BW-APP-006 | INFO | BLOCKED**: Dashboard routes (`/actor/:actorId/dashboard/*`) expose raw UUIDs in the URL as the `:actorId` path parameter. This is a pre-existing architectural pattern, not a new vulnerability introduced by the app shell. The platform vocabulary memory confirms this is an accepted pattern for actor navigation. No remediation expected at the app-shell layer.

---

### I. §9 INVARIANT ATTACK

BEHAVIOR.md is a PLACEHOLDER. No §9 Must Never Happen invariants are formally declared. This entire attack category is UNANCHORED.

**BW-APP-007 | HIGH | UNRESOLVED**: BEHAVIOR.md is a PLACEHOLDER with no §9 invariants declared. This means:
1. No formal invariants to test against — all §9 attack scenarios are inference-based only.
2. The security posture for the app shell cannot be formally contract-verified.
3. Future BW runs cannot distinguish a regression from a design gap without declared invariants.
4. This finding was pre-registered as VEN-APP-008 in VENOM (OPEN). BW re-confirms severity.

**Source-Inferred Invariants Tested (no formal contract)**:

| Inferred Invariant | Attack Attempted | Result |
|---|---|---|
| Unauthenticated user cannot reach protected routes | null user → ProtectedRoute | BLOCKED |
| User cannot access another user's actor resources | cross-actor actorId in createUserActor | BLOCKED |
| Identity from wrong user cannot be committed | userId mismatch in resolution effect | BLOCKED |
| Recovery form cannot be reached without a recovery session (or nonce) | nonce forgery attack | BYPASSED (self-exploit only) |
| Dev debug routes not accessible in production | import.meta.env.DEV guard | BLOCKED |
| IOS prod debugger not active in production | IS_PROD guard in iosProdDebugger | BLOCKED |

---

## 7. Exploitability Assessment

| Finding | Exploitability | Effort | Impact |
|---|---|---|---|
| BW-APP-001 (recovery nonce bypass) | Medium (requires source code knowledge) | Low (single sessionStorage.setItem call) | Self-only (own password change via own valid session) |
| BW-APP-002 (user-kind actor in dashboard) | Low (actor kind not checked at route) | Medium (must have matching actorId) | Depends on card controllers |
| BW-APP-003 (publish flags in onboarding upsert) | Low (requires re-triggering onboarding) | Medium | Profile visibility toggle |
| BW-APP-004 (30-min nonce replay window) | Low (requires same browser/session storage) | Low | Access to own reset form during TTL |
| BW-APP-005 (inflight map unbounded) | Not exploitable | N/A | Performance only |
| BW-APP-006 (UUID in dashboard URLs) | Info only | N/A | Known pattern |
| BW-APP-007 (missing BEHAVIOR.md) | Governance gap, not runtime | N/A | Contract-verification gap |

---

## 8. Source Verification Summary

| Finding | Provenance | File | Line(s) |
|---|---|---|---|
| BW-APP-001 | SOURCE_VERIFIED | setNewPassword.controller.js | 47, 55-70 |
| BW-APP-002 | SOURCE_VERIFIED + SCANNER_LOW_CONF | appRoutes.redirects.jsx | 23-34 |
| BW-APP-003 | SOURCE_VERIFIED | onboarding.dal.js | 61-84 |
| BW-APP-004 | SOURCE_VERIFIED | setNewPassword.controller.js | 48 |
| BW-APP-005 | SOURCE_VERIFIED | identity.controller.js | 88-98 |
| BW-APP-006 | SOURCE_VERIFIED | app.routes.jsx | 205 |
| BW-APP-007 | SOURCE_VERIFIED | BEHAVIOR.md | 1-9 |

All BYPASSED findings are SOURCE_VERIFIED. No bypass claims are made without cited source lines.

---

## 9. Confidence Summary

| Category | Confidence | Notes |
|---|---|---|
| Auth session gate | HIGH | Full source coverage of AuthProvider + guards |
| Recovery nonce bypass | HIGH | VEN-APP-001 alignment, source-confirmed |
| Actor ownership enforcement | HIGH | createUserActor.controller.js fully reviewed |
| Identity resolution ownership | HIGH | useIdentityResolutionEffect fully reviewed |
| Dashboard actor-kind enforcement | MEDIUM | Route layer verified; card controllers not reviewed in this pass |
| Profile upsert flag exposure | LOW | onboarding.dal.js reviewed; RLS on profiles table unverified |
| §9 Invariants | LOW | BEHAVIOR.md is PLACEHOLDER — invariants inferred from source only |
| Scanner coverage | NONE | 0 paths attributed by scanner to feature `app` |

---

## 10. §9 Invariant Attack Map

No formal §9 invariants declared. BEHAVIOR.md is PLACEHOLDER.

**Source-Inferred Invariant Attack Harnesses:**

### I-01: Unauthenticated Access to Protected Routes
- Attack: Navigate to `/feed` with no session
- Gate: ProtectedRoute.jsx:33 `if (!user) return <Navigate to="/login" />`
- Result: BLOCKED [SOURCE_VERIFIED]

### I-02: Cross-Actor Actor Creation
- Attack: Call `createUserActorForProfile({ profileId: 'victim-id', userId: 'attacker-id' })`
- Gate: createUserActor.controller.js:26 `if (profileId !== userId) throw`
- Result: BLOCKED [SOURCE_VERIFIED]

### I-03: Recovery Form Without Recovery Session
- Attack: Navigate to `/reset-password` with a valid auth session but no PASSWORD_RECOVERY event
- Gate: setNewPassword.controller.js:138 `if (!readRecoveryNonce()) return { ok: false }`
- Bypass: User reads source → sets sessionStorage key with valid JSON nonce → gate passes → `dalUpdateUserPassword` executes
- Result: BYPASSED (self-exploit only) [SOURCE_VERIFIED] → BW-APP-001

### I-04: Non-Owner Access to Dashboard
- Attack: Navigate to `/actor/<other-actor-id>/dashboard`
- Gate: OwnerOnlyDashboardGuard:29 `if (String(identity.actorId) !== String(actorId)) return <Navigate to="/feed" />`
- Result: BLOCKED [SOURCE_VERIFIED]

### I-05: Debug Routes in Production
- Attack: Navigate to `/dev/diagnostics` in production build
- Gate: app.routes.jsx:164 `devDiagnosticsEnabled ? ... : <Navigate to="/feed" />` where `devDiagnosticsEnabled = import.meta.env.DEV`
- Result: BLOCKED [SOURCE_VERIFIED]

### I-06: IOS Prod Debugger Data in Production
- Attack: Set localStorage `__vcsm_ios_dbg=1` in production
- Gate: iosProdDebugger.js:123-124 `if (IS_PROD) return false`
- Result: BLOCKED [SOURCE_VERIFIED]

---

## 11. Behavior Contract Attack Summary

BEHAVIOR.md Status: PLACEHOLDER
Declared §9 Invariants: 0
Anchored Attacks: 0

All attacks in Section 10 are based on source-inferred invariants. The absence of a formal BEHAVIOR.md means:
- These findings have no formal contract reference
- Future regression tests cannot be tied to a declared invariant
- THOR eligibility cannot be evaluated against a contract — only against source behavior

**Recommendation**: Formalize the 6 source-inferred invariants above as §9 entries in BEHAVIOR.md to anchor future BW runs. This closes the governance gap registered as VEN-APP-008 / BW-APP-007.

---

## 12. THOR Impact

### THOR Release Blockers

| Finding | Severity | THOR Status |
|---|---|---|
| BW-APP-001 | HIGH | NOT a THOR blocker — self-exploit only, pre-existing, cross-referenced with VEN-APP-001 |
| BW-APP-007 | HIGH | NOT a direct THOR blocker — governance gap; no runtime regression. Recommend resolving before major release |

**THOR Release Blocker: NO** for this BW run.

All HIGH findings in this report are either self-exploitation only (BW-APP-001, same as VEN-APP-001) or governance/documentation gaps (BW-APP-007). No new cross-user attack chains confirmed.

### BLOCKED Findings (Release Safe)
- Session gates: BLOCKED
- Cross-actor creation: BLOCKED
- Identity ownership enforcement: BLOCKED
- Route access controls: BLOCKED
- Dev tool exposure: BLOCKED

---

## 13. SPIDER-MAN Test Requirements

| Test | Priority | Type | Covers |
|---|---|---|---|
| SM-APP-001 | P1 | Unit | `resolveRecoverySessionController`: with valid nonce but non-recovery session → verify form reaches 'ready' state (confirms BW-APP-001 surface) |
| SM-APP-002 | P1 | Unit | `createUserActorForProfile`: profileId !== userId → throws (ownership guard) |
| SM-APP-003 | P1 | Unit | `completeOnboardingController`: userId differs from session user.id → returns action:'login' |
| SM-APP-004 | P1 | Integration | ProtectedRoute: null user → redirects to /login |
| SM-APP-005 | P2 | Integration | OwnerOnlyDashboardGuard: URL actorId !== session actorId → redirects to /feed |
| SM-APP-006 | P2 | Unit | Identity resolution effect: identityUserId !== sessionUserId → commitIdentity(null) |
| SM-APP-007 | P2 | Unit | Recovery nonce TTL: expired nonce (issuedAt > 30min ago) → readRecoveryNonce returns null |
| SM-APP-008 | P3 | Unit | `clearAllIdentityStorage`: all vc.identity.actorId.* keys removed on logout |
| SM-APP-009 | P3 | Integration | /dev/diagnostics in production build → redirects to /feed |
| SM-APP-010 | P3 | Unit | `isIOSProdDebuggerEnabled`: returns false in IS_PROD environment |

---

## Summary Table

| Finding ID | Severity | Description | Result | Status |
|---|---|---|---|---|
| BW-APP-001 | HIGH | Recovery nonce gate is client-side only; source-code-aware user can forge nonce and trigger password update on own account | BYPASSED (self-exploit) | DRAFT/OPEN |
| BW-APP-002 | MEDIUM | OwnerOnlyDashboardGuard validates actorId match but not actor kind; user-kind actors pass if actorId matches URL | PARTIAL | DRAFT/OPEN |
| BW-APP-003 | LOW | upsertCompletedOnboardingProfileDAL sets publish:true/discoverable:true unconditionally; no re-run guard at application layer | PARTIAL | DRAFT/OPEN |
| BW-APP-004 | LOW | 30-minute recovery nonce TTL creates a replay window for the reset form within the same browser session storage | PARTIAL | DRAFT/OPEN |
| BW-APP-005 | LOW | _identityInflight map is module-level and unbounded (no security impact — performance observation) | PARTIAL | DRAFT/OPEN |
| BW-APP-006 | INFO | Dashboard routes expose actorId (UUID) in URL as :actorId param — pre-existing accepted pattern | BLOCKED | DRAFT/INFO |
| BW-APP-007 | HIGH | BEHAVIOR.md is PLACEHOLDER; no §9 invariants declared; security contract unanchored | UNRESOLVED | DRAFT/OPEN |
