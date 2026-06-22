# BlackWidow V2 Adversarial Review — auth
**Feature:** auth
**App:** VCSM
**Run Date:** 2026-06-04
**Protocol Version:** BW2.5 V2 / BW2.9 report format
**Analyst:** BLACKWIDOW V2

---

## 1. Output Metadata

| Field | Value |
|---|---|
| Feature | auth |
| App | VCSM |
| Run Date | 2026-06-04 |
| Scanner Preflight | FRESH |
| Scanner Timestamp | 2026-06-04T19:48:25.152Z |
| Scanner Version | 1.1.0 |
| Security Paths Attributed | 9 |
| Total Platform Security Paths | 598 |
| BEHAVIOR.md Status | PLACEHOLDER — all §9 invariants UNANCHORED |
| VENOM Open Findings | VEN-AUTH-001 (HIGH), VEN-AUTH-002 (MEDIUM), VEN-AUTH-004 (MEDIUM), VEN-AUTH-007 (MEDIUM) |
| Report Status | COMPLETE |

---

## 2. Scanner Preflight

- Status: FRESH
- Generated: 2026-06-04T19:48:25.152Z (~7h old)
- Scanner Version: 1.1.0
- Auth security paths: 9 attributed, all confidence: LOW (no route-confirmed paths)
- RPC execution paths for auth: 0 (no confirmed routes in rpc-execution-map)
- Write execution paths for auth: 9 write surfaces found (all LOW confidence, unresolved sourceRoute)

**Preflight Assessment:** All 9 scanner-attributed security paths are LOW confidence (write surfaces discovered without route-confirmed paths). Per BW-002 rule, these are PRIMARY ATTACK TARGETS for this review.

---

## 3. Scanner Inputs Block

### Security Path Map — Auth Paths (9 total, all LOW confidence)

| # | Write DAL | Operation | Table/RPC | Confidence |
|---|---|---|---|---|
| 1 | dalCreateUserActor | rpc | vc.create_actor_for_user | LOW |
| 2 | dalCreateActorOwner | upsert | vc.actor_owners | LOW |
| 3 | generateUsernameDAL | rpc | generate_username | LOW |
| 4 | upsertProfileShellDAL | upsert | profiles | LOW |
| 5 | upsertCompletedOnboardingProfileDAL | upsert | profiles | LOW |
| 6 | dalUpdateProfileDiscoverable | update | profiles | LOW |
| 7 | dalUpsertRegisterProfile | upsert | profiles | LOW |
| 8 | (RPC path) dalCreateUserActor | rpc | vc.create_actor_for_user | LOW |
| 9 | (RPC path) generateUsernameDAL | rpc | generate_username | LOW |

**All paths have `route: null`, `controller: null`, `access: "unknown"` — scanner cannot confirm route-level access control.**

### Callgraph Stats — VCSM Auth
- Nodes: 143 (barrel:7, component:8, controller:35, dal:37, hook:25, model:12, screen:17, style:2)
- Edges: 134
- Hook entry points: 11 VCSM-scoped hooks
- Controller entry points: 30 VCSM-scoped controllers

---

## 4. Attack Surface Inventory

### HIGH Confidence Attack Surfaces (Source-Verified)

| Surface | DAL Write | Ownership Filter | Session Verified |
|---|---|---|---|
| completeOnboardingController | upsertCompletedOnboardingProfileDAL + createUserActorForProfile | YES — user.id === userId check (line 70) | YES — dalGetAuthSession() called first |
| bootstrapJoinOnboardingController | upsertCompletedOnboardingProfileDAL + createUserActorForProfile | YES — authedId !== userId throws (line 152-154) | YES — dalGetAuthSession() called first |
| ensureProfileShell (profileOnboarding.controller) | upsertProfileShellDAL | PARTIAL — userId param accepted from caller, upsert uses it as id; caller (evaluateCompleteProfileGateController) sources from getUser() | YES — getUser() is server-round-trip |
| ensureProfileDiscoverable | dalUpdateProfileDiscoverable | YES — session.user.id !== userId guard (line 12) | YES — dalGetAuthSession() called first |
| createUserActorForProfile | dalCreateUserActor + dalCreateActorOwner | YES — profileId !== userId throws (line 27) | Indirect — session checked by calling controller |
| ctrlRegisterAccount | dalUpsertRegisterProfile + dalSignUpRegisterUser | N/A — self-registration | N/A |
| updatePasswordController | dalUpdateUserPassword | CLIENT-SIDE ONLY — nonce gate | Partial — requires valid authenticated JWT |

### LOW Confidence (Scanner-Only) / Unrouted Surfaces

- dalGetActorByProfile: read-only, no write — not a write attack surface
- dalGenerateUsernameDAL: rpc, no ownership needed (deterministic username generation)
- All 9 scanner paths lack confirmed routes — cannot be directly attributed to authenticated vs unauthenticated access

### Hook Entry Points (UI-Accessible Write Paths)

| Hook | Write Path |
|---|---|
| useAuthOnboarding | completeOnboardingController → upsertCompletedOnboardingProfileDAL, createUserActorForProfile |
| useRegister | ctrlRegisterAccount → dalSignUpRegisterUser, dalUpsertRegisterProfile |
| useSetNewPassword | updatePasswordController → dalUpdateUserPassword |
| useLogin | signInWithPassword, hydrateAuthSession, ensureProfileDiscoverable |
| useAuthCallback | resolveAuthCallbackController (code exchange — no writes) |

---

## 5. Scanner Signals Block

- 9/9 auth security paths: LOW confidence — no route-confirmed source routes
- 0 HIGH confidence security paths for auth (no scanner-confirmed route-to-write chains)
- callgraph shows 134 edges within auth module — dense dependency graph
- No RPC execution map entries for auth (rpc-execution-map returned empty for auth)
- Primary risk area per scanner: unconfirmed write paths to `profiles` table (4 distinct DAL functions) and `vc.actor_owners` (1 upsert) and `vc.create_actor_for_user` (1 RPC)

---

## 6. Adversarial Path Analysis

### A. OWNERSHIP BYPASS (§5.1)

**Attack: Can an actor submit a mutation with another actor's resource ID?**

**Target:** `completeOnboardingController` — attacker sets `userId` param to victim's ID.

**Source Trace:**
- Hook `useAuthOnboarding` line 130: `completeOnboardingController({ userId, ... })` — `userId` comes from hook state set at line 89 from `result?.data?.userId`
- `getOnboardingBootstrapController` (onboarding.controller.js:40-57) sources `userId` from `session?.user ?? null` (live server session)
- `completeOnboardingController` (onboarding.controller.js:65-67): re-calls `dalGetAuthSession()` and checks `userId !== user.id` → returns login redirect if mismatch

**Verdict: BLOCKED**
- The controller independently verifies the live session at execution time (line 65-67), not just at bootstrap time. Even if a stale or tampered `userId` reaches the controller via the hook state, the session re-verification gate catches it.
- File: `apps/VCSM/src/features/auth/controllers/onboarding.controller.js:65-77`

**Target:** `bootstrapJoinOnboardingController` — attacker passes mismatched `userId`.

**Source Trace:**
- File: `apps/VCSM/src/features/auth/controllers/onboarding.controller.js:148-155`
- `const authedId = session?.user?.id ?? null` — live session
- `if (!authedId || authedId !== userId) throw new Error('Session mismatch...')`

**Verdict: BLOCKED**
- Hard throw on session mismatch. No bypass path.
- File: `apps/VCSM/src/features/auth/controllers/onboarding.controller.js:152-154`

**Target:** `createUserActorForProfile` — attacker passes `profileId !== userId`.

**Source Trace:**
- File: `apps/VCSM/src/features/auth/controllers/createUserActor.controller.js:26-29`
- `if (profileId !== userId) throw new Error('profileId must match authenticated userId...')`

**Verdict: BLOCKED**
- Explicit identity guard. Cannot create actor for another user's profile via this path.
- File: `apps/VCSM/src/features/auth/controllers/createUserActor.controller.js:26-29`

**Target:** `ensureProfileShell` — attacker supplies arbitrary `userId`.

**Source Trace:**
- `ensureProfileShell({ userId, email })` — accepts params directly
- Caller: `evaluateCompleteProfileGateController` (completeProfileGate.controller.js:4-15)
- `readCurrentAuthUserDAL()` → `supabase.auth.getUser()` (server-side round-trip)
- `userId = user.id` from authenticated server response
- NOT sourced from client payload

**Verdict: BLOCKED**
- `userId` comes from `supabase.auth.getUser()` at runtime, not from client input.
- File: `apps/VCSM/src/features/auth/controllers/completeProfileGate.controller.js:5-11`

**Target:** `dalUpdateProfileDiscoverable` — attacker passes mismatched `userId`.

**Source Trace:**
- `ensureProfileDiscoverable(userId)` (profile.controller.js:10-26)
- Line 11: `const session = await dalGetAuthSession()` — live session check
- Line 12: `if (!session?.user?.id || session.user.id !== userId) return` — hard abort if mismatch

**Verdict: BLOCKED**
- Session re-verification guard. Mismatched userId causes silent abort, not write.
- File: `apps/VCSM/src/features/auth/controllers/profile.controller.js:11-12`

---

### B. SESSION MUTATION (§5.2)

**Attack: Is viewerActorId taken from session (trusted) or client payload?**

**Analysis:**
Auth feature does not use `viewerActorId` — it operates on `userId` (auth.users.id) exclusively, which maps to `profiles.id`. All write controllers source identity from `supabase.auth.getSession()` or `supabase.auth.getUser()` — both are server-round-trip calls that return the JWT-verified user.

**Attack: Null/stale session bypass.**

**Target:** `completeOnboardingController` with no active session.

**Source Trace:**
- Line 65: `const session = await dalGetAuthSession()`
- Line 66: `const user = session?.user ?? null`
- Line 67: `const authState = buildSessionRedirectResult(user)`
- Line 68: `if (authState) return authState` — returns `{ ok: false, action: 'login' }` when user is null

**Verdict: BLOCKED**
- Null session produces a login redirect, not a write execution.
- File: `apps/VCSM/src/features/auth/controllers/onboarding.controller.js:65-68`

**Attack: Wanders session injection — can a different user's Wanders session be injected into primary client?**

**Source Trace:**
- `maybeMirrorWandersSession` (register.controller.js:20-41)
- Line 24: `const session = await dalReadRegisterSession({ client })` — reads Wanders client session
- Line 28-31: `if (session.user?.id !== expectedUserId) throw new Error(...)` — hard throw on mismatch
- `expectedUserId` = `existingUserId` or `newUserId` — both sourced from the primary Supabase auth response

**Verdict: BLOCKED**
- Cross-user session injection is prevented by the userId equality guard.
- File: `apps/VCSM/src/features/auth/controllers/register.controller.js:28-31`

**Finding: PARTIAL concern — Wanders client identity sourcing**
- `resolveRegisterClient(isWandersFlow)` returns `getWandersSupabase()` when `isWandersFlow` is true
- `isWandersFlow` flows from `navState.wandersFlow` which comes from `location.state.wandersFlow` (client-supplied via React Router navigation state)
- An attacker who can control navigation state (e.g., via in-app navigation) could set `wandersFlow: true` and trigger the Wanders code path
- However: the VENOM-AUTH-003 guard `maybeMirrorWandersSession` still enforces userId equality, so cross-user injection remains blocked
- The guard is the only backstop if `isWandersFlow` is spoofed — if `isWandersFlow` is client-controlled and the Wanders client has a stale session for the same user, the guard passes and a session mirror occurs for a user who did not intend a Wanders registration flow

**Finding ID: BW-AUTH-001**

---

### C. RUNTIME ABUSE (§5.3)

**Attack: Can a non-owner actor type reach owner-only paths?**

**Analysis:**
Auth feature does not have actor-kind-gated paths (no `vport` vs `user` kind branching). Actor creation is hardcoded to `p_kind: 'user'` (actorCreate.dal.js:17). No admin or moderation paths exist in auth.

**Attack: Anonymous user reaching onboarding writes.**

**Source Trace:**
- `isAnonymousUser(user)` checked in both `completeOnboardingController` (via `buildSessionRedirectResult`) and `register.controller.js:43`
- Anonymous users are redirected to `/register` before any write path

**Verdict: BLOCKED**
- Anonymous users cannot reach profile upsert or actor creation writes.
- File: `apps/VCSM/src/features/auth/controllers/onboarding.controller.js:28-35`

---

### D. RLS VERIFICATION (§5.4)

**Write surfaces and RLS dependency:**

| DAL Write | Table | Ownership Filter in Query | RLS Expected |
|---|---|---|---|
| upsertProfileShellDAL | profiles | `id = userId` (upsert on PK) | YES |
| upsertCompletedOnboardingProfileDAL | profiles | `id = user.id` (upsert on PK, sourced from session) | YES |
| dalUpsertRegisterProfile | profiles | `id = userId` (upsert on PK, sourced from auth response) | YES |
| dalUpdateProfileDiscoverable | profiles | `.eq('id', userId)` + session guard in controller | YES |
| dalCreateActorOwner | vc.actor_owners | upsert with `{ actor_id, user_id }` | YES — RLS needed |
| dalCreateUserActor | vc.create_actor_for_user (RPC) | RPC is expected to enforce ownership server-side | YES — DB-level |

**RLS Assessment:**
- `profiles` table upserts operate on PK `id = user.id` where `user.id` is sourced from the authenticated session. RLS policy for `profiles` must enforce `auth.uid() = id` for these to be safe at the DB layer.
- `vc.actor_owners` upsert: the write includes both `actor_id` and `user_id`. There is no query-level filter enforcing that `user_id = auth.uid()`. RLS policy for `vc.actor_owners` must enforce this.
- `vc.create_actor_for_user` RPC: DB-level stored procedure expected to enforce that the actor is created for the calling user's profile. RLS or SECURITY DEFINER ownership must be verified at DB level.

**UNVERIFIED (DB not inspectable in this review):**
- RLS on `profiles` for upsert (INSERT + UPDATE) — assumed present but not verified
- RLS on `vc.actor_owners` — VENOM-AUTH-006 marked VERIFIED SAFE, BW accepts this
- RLS on `vc.actors` via `create_actor_for_user` RPC — VEN-AUTH-006 marked VERIFIED SAFE

**Finding: The DB-level RLS for `profiles` upsert is not confirmed verified in any open VENOM/ELEKTRA finding. This creates a governance gap.**

**Finding ID: BW-AUTH-002**

---

### E. VIEWER CONTEXT FUZZING (§5.5)

**Attack: null/undefined viewerActorId passed to controllers.**

**Note:** Auth feature uses `userId` (auth UID), not `viewerActorId`. The null-session case is covered under §5.2.

**Attack: null `userId` to `ensureProfileShell`.**

**Source Trace:**
- `ensureProfileShell({ userId, email })` (profileOnboarding.controller.js:7-8)
- Line 7: `if (!userId) throw new Error('userId is required')`

**Verdict: BLOCKED** — explicit null guard.
- File: `apps/VCSM/src/features/auth/controllers/profileOnboarding.controller.js:7-8`

**Attack: null `profileId` to `createUserActorForProfile`.**

**Source Trace:**
- `createUserActorForProfile({ profileId, userId, ... })` (createUserActor.controller.js:15-18)
- Line 17: `if (!profileId || !userId) throw new Error('profileId and userId are required')`

**Verdict: BLOCKED** — explicit null guard.
- File: `apps/VCSM/src/features/auth/controllers/createUserActor.controller.js:17-18`

**Attack: null `profileId` to `dalCreateUserActor`.**

**Source Trace:**
- actorCreate.dal.js:8-10: `if (!profileId) throw new Error('profileId is required')`

**Verdict: BLOCKED** — DAL-level null guard.
- File: `apps/VCSM/src/features/auth/dal/actorCreate.dal.js:8-10`

**Attack: null `email` to `resendVerificationEmailController`.**

**Source Trace:**
- resendVerification.controller.js:4: `if (!email) throw new Error('Email is required...')`

**Verdict: BLOCKED** — explicit null guard.

---

### F. MUTATION REPLAY (§5.6)

**Attack: Can a completed password reset be replayed?**

**Source Trace:**
- `updatePasswordController` (setNewPassword.controller.js:166-178)
- Post-update: `dalSignOutRecoverySession()` signs out the session
- `clearRecoveryFlag()` removes the nonce from sessionStorage
- Hook `useSetNewPassword` line 117-118: clears flag and navigates to `/login`

**Verdict: BLOCKED (with caveat)**
- The recovery session is signed out after successful password update, preventing replay of the update operation with the same session.
- HOWEVER: the nonce gate itself is client-side only (acknowledged in VEN-AUTH-001). A user who holds any valid authenticated session and manually crafts the sessionStorage nonce can reach `updatePasswordController`. But since `updatePasswordController` operates on the caller's own authenticated session (self-exploitation only), replay of this path does not provide cross-user impact.
- **Caveat:** If the `dalSignOutRecoverySession()` call fails silently (caught and swallowed at line 172-177), the recovery session token remains valid and a replay of `updatePasswordController` is possible within the token's remaining lifetime.

**Finding ID: BW-AUTH-003**

**Attack: Can actor creation be replayed to create duplicate actors?**

**Source Trace:**
- `createUserActorForProfile` (createUserActor.controller.js:33-36):
  - `let actor = await dalGetActorByProfile(profileId)` — checks for existing actor first
  - `if (!actor) { actor = await dalCreateUserActor(profileId) }` — creates only if missing
  - `dalCreateActorOwner` uses `ignoreDuplicates: true` — idempotent upsert
- `dalCreateUserActor` calls `vc.create_actor_for_user` RPC — server-side idempotency expected

**Verdict: BLOCKED**
- Actor creation is idempotent by design. Duplicate ownership inserts are silently ignored (error code 23505 handling at line 43-46).
- File: `apps/VCSM/src/features/auth/controllers/createUserActor.controller.js:33-47`

---

### G. HYDRATION POISONING (§5.7)

**Attack: Can actor summaries be poisoned via the auth flow?**

**Analysis:**
- `createUserActorForProfile` calls `refreshActorFn?.(actor.id)` (line 49) after actor creation
- `refreshActorFn` is `refreshVcActorDirectory` from `useIdentityOps` (useAuthOnboarding.js:27)
- This is a pull-based refresh — it re-reads the actor directory from the server, not a push/inject
- No direct hydration store write occurs within the auth feature

**Verdict: NOT APPLICABLE / LOW RISK**
- The identity refresh is pull-based (server re-read), not push-based (client-supplied data injection). Hydration poisoning via this path is not viable.

---

### H. URL SURFACE (§5.9)

**Attack: Do notification links, share links, or deep links expose raw UUIDs?**

**Analysis:**
- `ctrlSendResetPasswordEmail` (sendResetPassword.controller.js:8-10):
  - `redirectTo: \`${window.location.origin}/reset-password\`` — no UUID in redirect URL
- `resolveAuthCallbackController` — processes `?code=` param (Supabase PKCE code, not a UUID) and `error_description` — no UUID exposure
- `parseCallbackParams` explicitly comments that `hash.get('type')` is intentionally NOT returned to prevent attacker-controlled recovery type (authCallback.controller.js:15-18)
- No notification linkPaths found within auth feature (auth does not construct notification links)
- `useRegister` preserves `invite_code` from URL params (useRegister.js:37-40) — this is an inbound consumer of invite codes, not a generator; does not expose raw UUIDs

**Verdict: CLEAN**
- No raw UUID exposure in outbound URLs or notification links.
- `error_description` is sanitized in production (fixed message) in both authCallback.controller.js:43-46 and setNewPassword.controller.js:103-108.

**Finding: error_description sanitization only applies in `import.meta.env.DEV` check — correct. BLOCKED in production.**

---

### I. §9 INVARIANT ATTACK (HIGHEST PRIORITY)

**BEHAVIOR.md Status: PLACEHOLDER**
No §9 invariants are formally captured. All §9 invariants are UNANCHORED.

**Source-Inferred Invariants (derived from controller behavior and VENOM findings):**

**Inferred Invariant 1: A user must never be able to update another user's profile during onboarding.**
- Attack harness: Submit `completeOnboardingController({ userId: victimId, form, ... })` where `victimId !== auth session user.id`
- Result: `completeOnboardingController` line 70 returns login redirect. BLOCKED.
- File: `apps/VCSM/src/features/auth/controllers/onboarding.controller.js:70-77`

**Inferred Invariant 2: Actor creation must be owner-scoped — a user cannot create an actor for another user's profile.**
- Attack harness: Call `createUserActorForProfile({ profileId: victimId, userId: attackerId, ... })`
- Result: `profileId !== userId` guard throws at line 26-29. BLOCKED.
- File: `apps/VCSM/src/features/auth/controllers/createUserActor.controller.js:26-29`

**Inferred Invariant 3: Password update must only occur after a legitimate password recovery session.**
- Attack harness: Navigate to `/reset-password` without a recovery link, manually set `sessionStorage['vc.auth.recovery'] = JSON.stringify({ nonce: 'any-uuid', issuedAt: Date.now() })`, submit new password.
- Result: `resolveRecoverySessionController` fallback path (lines 138-149) reads nonce, validates TTL, but THEN calls `dalGetAuthSession()` to confirm an active session exists. If the attacker holds a valid authenticated session (e.g., already logged in), this path succeeds.
- `updatePasswordController` then calls `supabase.auth.updateUser({ password })` — operates on the authenticated session, not the recovery session specifically.
- **Result: BYPASSED (self-exploitation) — matches VEN-AUTH-001 documented finding**
- This is not a NEW bypass — it is the known VEN-AUTH-001 limitation. The bypass is self-exploitation only with no cross-user path.
- File: `apps/VCSM/src/features/auth/controllers/setNewPassword.controller.js:138-149`
- Finding ID: BW-AUTH-004

**Inferred Invariant 4: Profile shell upsert must only write to the authenticated user's own profile.**
- Attack harness: Call `ensureProfileShell({ userId: victimId, email: 'attacker@x.com' })` directly
- Result: The only caller (`evaluateCompleteProfileGateController`) sources `userId` from `supabase.auth.getUser()` — a server-round-trip. The internal function itself has a null guard but no ownership-vs-session cross-check.
- If `ensureProfileShell` were called with an arbitrary `userId` by a future caller (not through the gated path), it would write to `profiles` for that userId without a session ownership check.
- **This is a LATENT attack surface: the controller does not internally verify that `userId === auth.uid()`. It relies entirely on the caller to pass the correct userId from the session.**
- Finding ID: BW-AUTH-005

**Inferred Invariant 5: Login redirect destination must be same-origin (open redirect prevention).**
- Attack harness: Navigate to `/login` with `location.state = { from: 'https://evil.com/steal' }` and log in.
- Source Trace (`useLogin.js:56-67`):
  - `const rawFrom = location?.state?.from` — client-supplied
  - Type check: string, or `{ pathname, search }` object
  - `const dest = from && !['/login', '/register', '/reset', '/forgot-password'].includes(from) ? from : '/feed'`
  - **No same-origin or relative-URL validation is performed on `from`.**
  - If `rawFrom = 'https://evil.com/steal'`, the blocklist check passes (it's not in the exclusion list), and `navigate('https://evil.com/steal', { replace: true })` is called.
  - React Router `navigate()` behavior: for absolute URLs, React Router v6 does NOT perform browser-level navigation — it would attempt to treat it as a relative path, which effectively navigates to `/https://evil.com/steal` or throws an error depending on the router version. This mitigates the open redirect.
  - However, this is an unverified behavioral mitigation dependent on React Router implementation, not an explicit security assertion in the code.
- **Finding ID: BW-AUTH-006 — PARTIAL / React Router implicit mitigation, no explicit same-origin guard**
- This matches VEN-AUTH-002.

---

## 7. Exploitability Assessment

| Finding ID | Severity | Result | Exploitability |
|---|---|---|---|
| BW-AUTH-001 | MEDIUM | PARTIAL | Wanders flow can be triggered by any in-app navigation controller supplying `wandersFlow: true` to registration state. VENOM-AUTH-003 guard is the only backstop. Low direct impact since guard holds, but guard was added reactively, not proactively. |
| BW-AUTH-002 | MEDIUM | UNRESOLVED | RLS on `profiles` table for upsert operations not confirmed verified. Governance gap — DB policy not audited in this review or any VENOM/ELEKTRA finding. |
| BW-AUTH-003 | LOW | PARTIAL | `dalSignOutRecoverySession` failure is silently swallowed, leaving recovery session valid post-update. No cross-user impact, but replay window exists until token expiry. |
| BW-AUTH-004 | HIGH | BYPASSED (self-exploit) | Known VEN-AUTH-001 — sessionStorage nonce gate is client-side only. Any authenticated user can set a conforming nonce and reach `updatePasswordController`. Impact: self-exploitation only. No cross-user path. Already documented, not a new finding. |
| BW-AUTH-005 | MEDIUM | PARTIAL | `ensureProfileShell` accepts arbitrary `userId` without internal session ownership cross-check. Relies entirely on caller to pass session-sourced userId. Latent risk if new callers are added without the same session-gating discipline. |
| BW-AUTH-006 | LOW | PARTIAL | Open redirect via `state.from` (VEN-AUTH-002). React Router implicit mitigation prevents browser-level redirect to absolute URLs, but no explicit guard in code. |

---

## 8. Source Verification Summary

| Finding ID | Source File | Line(s) | Verification Status |
|---|---|---|---|
| BW-AUTH-001 | apps/VCSM/src/features/auth/hooks/useRegister.js | 55 (`isWandersFlow` from navState) | SOURCE_VERIFIED |
| BW-AUTH-001 | apps/VCSM/src/features/auth/controllers/register.controller.js | 28-31 (guard) | SOURCE_VERIFIED |
| BW-AUTH-002 | apps/VCSM/src/features/auth/dal/onboarding.dal.js | 41-48 (upsert profiles) | SOURCE_VERIFIED — no query ownership filter; relies on RLS |
| BW-AUTH-003 | apps/VCSM/src/features/auth/controllers/setNewPassword.controller.js | 172-177 (swallowed signOut) | SOURCE_VERIFIED |
| BW-AUTH-004 | apps/VCSM/src/features/auth/controllers/setNewPassword.controller.js | 138-149 (nonce fallback) | SOURCE_VERIFIED — matches VEN-AUTH-001 |
| BW-AUTH-005 | apps/VCSM/src/features/auth/controllers/profileOnboarding.controller.js | 7-25 (no session cross-check) | SOURCE_VERIFIED |
| BW-AUTH-006 | apps/VCSM/src/features/auth/hooks/useLogin.js | 56-67 (state.from nav) | SOURCE_VERIFIED — matches VEN-AUTH-002 |

**BLOCKED findings (source-verified):**
- Ownership bypass in `completeOnboardingController`: verified at `onboarding.controller.js:65-77`
- Ownership bypass in `bootstrapJoinOnboardingController`: verified at `onboarding.controller.js:152-154`
- Ownership guard in `createUserActorForProfile`: verified at `createUserActor.controller.js:26-29`
- Null session gate in `completeOnboardingController`: verified at `onboarding.controller.js:65-68`
- Wanders session identity guard: verified at `register.controller.js:28-31`
- Null guard in `ensureProfileShell`: verified at `profileOnboarding.controller.js:7-8`
- Null guard in `createUserActorForProfile`: verified at `createUserActor.controller.js:17-18`
- DAL-level null guard: verified at `actorCreate.dal.js:8-10`
- Actor creation idempotency: verified at `createUserActor.controller.js:33-47`
- error_description sanitization: verified at `authCallback.controller.js:43-46` and `setNewPassword.controller.js:103-108`

---

## 9. Confidence Summary

| Area | Confidence | Rationale |
|---|---|---|
| Ownership bypass paths | HIGH | All controller ownership guards source-verified |
| Session mutation paths | HIGH | All write controllers use server-round-trip session reads |
| Null context handling | HIGH | All entry points have explicit null guards |
| Actor creation integrity | HIGH | Idempotency and ownership guard verified at both controller and DAL layers |
| RLS DB-layer coverage | LOW | Not inspectable from source — accepted from prior VENOM-AUTH-006 documentation |
| Recovery session provenance | HIGH | VEN-AUTH-001 is a known documented limitation, not a new bypass |
| Wanders flow isWandersFlow sourcing | MEDIUM | Client-navigation-state-controlled; VENOM-AUTH-003 guard is the only backstop |
| profiles upsert RLS | LOW | Not confirmed verified in any open governance finding |
| Open redirect (state.from) | MEDIUM | React Router implicit mitigation not explicitly guaranteed in code |

---

## 10. §9 Invariant Attack Map

BEHAVIOR.md is PLACEHOLDER — no formal §9 invariants exist. All attacks designed from source-inferred invariants.

| Inferred Invariant | Attack Designed | Result |
|---|---|---|
| Users cannot update another user's profile during onboarding | Session mismatch injection into completeOnboardingController | BLOCKED |
| Actor creation is owner-scoped | profileId !== userId injection into createUserActorForProfile | BLOCKED |
| Password update requires legitimate recovery session | Manually set conforming sessionStorage nonce + valid auth session | BYPASSED (self-exploit, documented VEN-AUTH-001) |
| Profile shell write is owner-scoped | Arbitrary userId injection into ensureProfileShell | PARTIAL — caller-dependent safety |
| Login redirect is same-origin | Absolute URL in state.from | PARTIAL — React Router implicit mitigation only |

**UNANCHORED INVARIANT RISK: Since BEHAVIOR.md is a PLACEHOLDER, there are no formally stated invariants that BW can test against. The absence of a behavior contract means invariant gaps may exist that have not been attacked. This is itself a HIGH governance finding (matches VEN-AUTH-007).**

---

## 11. Behavior Contract Attack Summary

- BEHAVIOR.md: PLACEHOLDER
- §4 Failure Paths: NOT CAPTURED
- §9 Must Never Happen: NOT CAPTURED
- All attacks designed from source-code inference
- VEN-AUTH-007 (MEDIUM) — BEHAVIOR.md is a placeholder — remains OPEN and unresolved
- The absence of formal invariants means regression coverage (SPIDER-MAN) cannot verify invariant preservation

**Governance Implication:** Until BEHAVIOR.md is populated with §4 failure paths and §9 invariants, any future code change to the auth feature may violate security invariants without detection.

---

## 12. THOR Impact

**THOR Release Blockers (NEW from this BW pass):** NONE — no new CRITICAL or HIGH BYPASSED findings that are not already tracked.

**Existing THOR Blockers (carried from VENOM):**
- VEN-AUTH-001 (HIGH) — recovery session provenance — confirmed OPEN, BW-AUTH-004 is the adversarial verification of the same finding

**BW findings and THOR eligibility:**

| Finding ID | Severity | Result | THOR Blocker? |
|---|---|---|---|
| BW-AUTH-001 | MEDIUM | PARTIAL | NO — guard holds, latent risk only |
| BW-AUTH-002 | MEDIUM | UNRESOLVED | NO — DB governance gap, not a confirmed bypass |
| BW-AUTH-003 | LOW | PARTIAL | NO — self-only, no cross-user impact |
| BW-AUTH-004 | HIGH | BYPASSED (self-exploit) | NO NEW BLOCKER — same as VEN-AUTH-001, already a THOR blocker |
| BW-AUTH-005 | MEDIUM | PARTIAL | NO — latent risk, guard holds in current callers |
| BW-AUTH-006 | LOW | PARTIAL | NO — React Router implicit mitigation holds |

---

## 13. SPIDER-MAN Test Requirements

The following test coverage gaps were identified. SPIDER-MAN should be tasked with covering these.

| # | Test Requirement | Priority |
|---|---|---|
| 1 | `completeOnboardingController` — session userId mismatch should return login redirect, not execute write | HIGH |
| 2 | `bootstrapJoinOnboardingController` — session userId mismatch should throw | HIGH |
| 3 | `createUserActorForProfile` — profileId !== userId should throw | HIGH |
| 4 | `ensureProfileShell` — null userId should throw | HIGH |
| 5 | `ensureProfileDiscoverable` — session.user.id !== userId should abort silently | HIGH |
| 6 | `completeOnboardingController` — null session returns login redirect | MEDIUM |
| 7 | `maybeMirrorWandersSession` — mismatched Wanders userId should throw | MEDIUM |
| 8 | `resolveRecoverySessionController` — expired nonce returns ok:false | MEDIUM |
| 9 | `updatePasswordController` — password not meeting rules should throw | MEDIUM |
| 10 | `ctrlSendResetPasswordEmail` — empty email should throw | LOW |
| 11 | `createUserActorForProfile` — existing actor prevents duplicate creation (idempotency) | MEDIUM |
| 12 | `dalCreateActorOwner` — duplicate ownership insert is silently ignored (23505 handling) | LOW |
| 13 | BEHAVIOR.md population — author §4 failure paths and §9 invariants before next BW pass | GOVERNANCE |

---

*Report generated by BLACKWIDOW V2 on 2026-06-04. All findings are DRAFT governance status on first issuance.*
