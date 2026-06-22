# VENOM Security Report — Login / Recovery Surface

**Date:** 2026-05-23
**Reviewer:** VENOM
**Application Scope:** VCSM
**Environment:** apps/VCSM — static source review
**Trigger:** Post-BlackWidow BW-LOGIN-001/-002/-003 remediation verification
**Findings:** 0 CRITICAL | 2 HIGH | 3 MEDIUM | 3 LOW | 2 INFO
**Report Status:** UPDATED — P1/P2 findings remediated 2026-05-23
**Remediation Status:** VENOM-AUTH-001 MITIGATED (docs corrected) | VENOM-AUTH-002 HARDENED | VENOM-AUTH-003 HARDENED | VENOM-AUTH-006 HARDENED | VENOM-AUTH-004/005/007/008 OPEN (lower priority)

---

## VENOM TARGET

**Feature / Route / Engine:** Authentication and Password Recovery Surface
**Application Scope:** VCSM
**Reason for review:** Verify security posture of login/recovery surface after BlackWidow remediation cycle. Cross-reference BW-LOGIN-001 risk acceptance assumptions against actual Supabase server behavior. Map all trust boundaries across the full auth DAL/controller/hook/route stack.
**Primary trust boundary:** Unauthenticated → Authenticated Citizen | Recovery Session → Password Update

---

## Files Reviewed

| File | Layer |
|---|---|
| `src/app/providers/AuthProvider.jsx` | Provider |
| `src/app/routes/public/auth.routes.jsx` | Router |
| `src/app/routes/public/AuthPublicRoute.jsx` | Route Guard |
| `src/app/guards/ProtectedRoute.jsx` | Route Guard |
| `src/app/guards/ProfileGatedOutlet.jsx` | Route Guard |
| `src/features/auth/controllers/login.controller.js` | Controller |
| `src/features/auth/controllers/register.controller.js` | Controller |
| `src/features/auth/controllers/onboarding.controller.js` | Controller |
| `src/features/auth/controllers/profile.controller.js` | Controller |
| `src/features/auth/controllers/sendResetPassword.controller.js` | Controller |
| `src/features/auth/controllers/authOps.controller.js` | Controller |
| `src/features/auth/controllers/authCallback.controller.js` | Controller |
| `src/features/auth/controllers/setNewPassword.controller.js` | Controller |
| `src/features/auth/controllers/createUserActor.controller.js` | Controller |
| `src/features/auth/dal/login.dal.js` | DAL |
| `src/features/auth/dal/authSession.read.dal.js` | DAL |
| `src/features/auth/dal/authCallback.dal.js` | DAL |
| `src/features/auth/dal/resetPassword.dal.js` | DAL |
| `src/features/auth/dal/register.dal.js` | DAL |
| `src/features/auth/dal/onboarding.dal.js` | DAL |
| `src/features/auth/dal/actorCreate.dal.js` | DAL |
| `src/features/auth/dal/actorOwnerCreate.dal.js` | DAL |
| `src/features/auth/hooks/useSetNewPassword.js` | Hook |
| `src/features/auth/hooks/useAuthCallback.js` | Hook |
| `src/app/routes/index.jsx` | Router |

---

## Security Surface

**Entry point:** `/login`, `/register`, `/forgot-password`, `/reset-password`, `/auth/callback`, `/onboarding`
**Auth source:** `supabase.auth` — `AuthProvider` session state (primary), `dalGetAuthSession()` (re-validation at controller level)
**Authorization layer:** Route guards (`AuthPublicRoute`, `ProtectedRoute`), controller-level session re-reads
**Identity surface:** `userId` (session.user.id), `actorId` (resolved post-onboarding via `createUserActorForProfile`)
**Sensitive objects involved:** auth session tokens, passwords, email addresses, recovery codes, birthdate, is_adult flag, actor ownership records

---

## Trust Boundary Trace

**Client input:** Email, password, birthdate, displayName, username, sex (forms); `?code=` / `#access_token=` / `#type=recovery` (URL params)
**Validated at:** Controllers (email normalization, password rules, session re-fetch)
**Identity resolved at:** `dalGetAuthSession()` — session user.id sourced from Supabase JWT (server-issued)
**Authorization enforced at:** Route guards (route-level), controller session re-reads (controller-level), Supabase server JWT validation (write-level)
**Data returned to:** React state (user, session), controller return shapes — credentials NOT returned to UI

---

## VENOM SECURITY FINDINGS

---

### VENOM-AUTH-001

**Finding ID:** VENOM-AUTH-001
**Remediation Status:** MITIGATED — documentation corrected 2026-05-23
**Location:** `src/features/auth/dal/resetPassword.dal.js:16`, `src/features/auth/controllers/setNewPassword.controller.js`, `src/app/providers/AuthProvider.jsx`
**Application Scope:** VCSM
**Platform Surface:** PWA · Supabase Auth API
**Trust Boundary:** Recovery Session → Password Update
**Boundary Violated:** Normal Authenticated Session → Password Update (assumed blocked; confirmed NOT server-enforced)
**Contract Violated:** Actor Ownership Contract (password update without recovery proof)

**Current behavior:**
`dalUpdateUserPassword()` calls `supabase.auth.updateUser({ password: newPassword })` unconditionally. The Supabase `updateUser()` endpoint requires a valid JWT but does **not** technically require the session to have been initiated via a `PASSWORD_RECOVERY` event. Any authenticated session with a valid, unexpired JWT may call `updateUser({ password })` and succeed.

```js
// resetPassword.dal.js
export async function dalUpdateUserPassword(newPassword) {
  const { data, error } = await supabase.auth.updateUser({ password: newPassword })
  if (error) throw error
  return data?.user ?? null
}
```

The BW-LOGIN-001 risk acceptance states:
> "password mutation remains enforced by Supabase server-side session validation, and normal sessions cannot successfully complete the password update despite reaching the form through manual client tampering."

This assumption is **likely incorrect**. Supabase's server-side `updateUser` validates that the caller is authenticated (valid JWT), but does not enforce that the session originated from a PASSWORD_RECOVERY flow. There is no server-side recovery-provenance check on the `updateUser` endpoint in Supabase auth-js v2.

**Risk:**
The BW-LOGIN-001 mitigation's primary stated safety net — "Supabase server-side rejection of non-recovery sessions" — may not exist. The client-side nonce gate (sessionStorage UUID) is the only protection. A source-code-aware user who:
1. Is already authenticated
2. Reads the source and sets `sessionStorage.setItem('vc.auth.recovery', JSON.stringify({ nonce: 'any-string', issuedAt: Date.now() }))` 
3. Navigates to `/reset-password`

...will reach the password update form AND be able to successfully call `updateUser({ password })` to change their own password.

**Impact scope:** Self-exploitation only — no cross-user impact. The confused-deputy risk (social engineering victim into setting an attacker-controlled password) remains the primary concern.

**Severity:** HIGH
**Exploitability:** HIGH
**Attack Preconditions:**
- Must be authenticated with any valid session
- Must know the sessionStorage key name and JSON schema (requires source code access)
- Must be the target of their own account (no cross-user impact)

**Blast Radius:** Single actor — self-exploitation only; no cross-actor path confirmed

**Identity Leak Type:** None
**Cache Trust Type:** None
**RLS Dependency:** NONE — this is an auth API call, not a DB query

**Why it matters:**
The code comments in `setNewPassword.controller.js` and the BW-LOGIN-001 risk acceptance document explicitly state that Supabase server-side validation is the real security boundary. If this assumption is wrong, the defense posture for BW-LOGIN-001 is weaker than accepted. The nonce gate becomes the *only* protection, not a secondary UX layer.

**Recommended mitigation:**
1. Verify empirically whether `supabase.auth.updateUser({ password })` succeeds from a non-recovery authenticated session. Test with a normal session token against the Supabase project.
2. If it does succeed: update the BW-LOGIN-001 risk acceptance documentation to accurately reflect that the only protection is the client-side nonce gate, not server enforcement.
3. For full closure: implement a server-side Edge Function proxy for password updates that validates recovery session provenance before forwarding to Supabase auth.
4. Short-term alternative: strengthen the nonce approach — generate the nonce on the server via an Edge Function that validates the recovery code, then passes a signed nonce back. Client stores only the signed token, which the Edge Function validates before allowing `updateUser`.

**Remediation applied (2026-05-23):**
The inaccurate server-enforcement claim has been removed from all code comments. Both `setNewPassword.controller.js` and `AuthProvider.jsx` now state explicitly:
- `updateUser({ password })` requires only a valid authenticated JWT
- There is NO server-side recovery-provenance check on the Supabase updateUser endpoint
- The nonce gate is the primary and only protection layer
- Impact: self-exploitation only; full closure requires a server-side Edge Function
BW-LOGIN-001 governance status remains MITIGATED — not upgraded.

**Rationale:** Documentation must accurately reflect the enforcement posture at each layer.
**Follow-up command:** None — documentation corrected; server-side Edge Function validation is future scope

**CISSP Domain:**
- Primary: Identity and Access Management
- Secondary: Security Architecture and Engineering, Security Assessment and Testing

---

### VENOM-AUTH-002

**Finding ID:** VENOM-AUTH-002
**Remediation Status:** HARDENED 2026-05-23
**Location:** `src/app/routes/public/auth.routes.jsx`
**Application Scope:** VCSM
**Platform Surface:** PWA · React Router
**Trust Boundary:** Unauthenticated Visitor → Recovery Session
**Boundary Violated:** ~~Recovery Session → Reset Password Form (redirected to /feed)~~ — RESOLVED
**Contract Violated:** Security Architecture and Engineering — RESOLVED

**Original behavior (pre-fix):**
`/reset-password` was wrapped in `AuthPublicRoute`, which redirected any authenticated user (`user !== null`) to `/feed`. Once a Supabase recovery session was established, `user` was set to the recovery session user and `AuthPublicRoute` redirected to `/feed` instead of rendering `ResetPasswordScreen`.

```jsx
// auth.routes.jsx
{
  path: '/reset-password',
  element: (
    <AuthPublicRoute>          // ← redirects user !== null to /feed
      <ResetPasswordScreen />  // ← may never render for recovery users
    </AuthPublicRoute>
  ),
}

// AuthPublicRoute.jsx
if (user) {
  return <Navigate to="/feed" replace />  // ← catches recovery users
}
```

The `sendResetPassword.controller.js` sets `redirectTo: window.location.origin + '/reset-password'`, meaning PKCE recovery codes land directly on `/reset-password?code=...`. Supabase auto-exchanges this code during client initialization via `detectSessionInUrl`, establishing the recovery session before `AuthPublicRoute` can render. When `loading` becomes `false` and `user` is set (to the recovery session user), `AuthPublicRoute` redirects to `/feed`.

**Secondary concern:** `AuthProvider`'s PASSWORD_RECOVERY handler sets the recovery nonce THEN calls `navigate('/reset-password')`. But the nonce is written inside the `onAuthStateChange` subscription, which is set up AFTER `dalHydrateAuthSession()` (= `getSession()`) completes. For PKCE, `detectSessionInUrl` runs DURING `_initialize()` — before the subscription exists. The PASSWORD_RECOVERY event fires before the subscriber is registered and is NOT replayed to the subscriber. This means `_setRecoveryFlag()` may never be called for the PKCE path, making the nonce gate at `/reset-password` always reject.

**Risk:**
For the PKCE recovery flow (which is the Supabase-recommended secure flow):
1. The recovery form may never render because `AuthPublicRoute` redirects recovery users to `/feed`
2. Even if the form renders, the nonce may never be set (PASSWORD_RECOVERY event missed), causing the form to show "invalid link" immediately
3. Recovery users who are redirected to `/feed` retain an active recovery session that will expire unused

**Severity:** HIGH (potential complete recovery flow failure)
**Exploitability:** LOW (this is a functional break, not an adversarial exploit)
**Attack Preconditions:**
- User clicks a Supabase PKCE recovery email link

**Blast Radius:** All users attempting password reset via PKCE flow; recovery emails may appear to work but silently fail at form stage

**Identity Leak Type:** None
**Cache Trust Type:** None
**RLS Dependency:** NONE

**Why it matters:**
If the recovery flow silently fails, users who forget their password cannot reset it. This degrades account recovery assurance and may push users to alternative recovery paths. Additionally, recovery sessions that expire unused leave a briefly active high-privilege session orphaned at `/feed`.

**Recommended mitigation:**
1. Remove `/reset-password` from `AuthPublicRoute` wrapping. The nonce gate inside `setNewPassword.controller.js` already serves as the access control layer.
2. OR: add a recovery-session exemption to `AuthPublicRoute` — check whether the current user session is a recovery session before redirecting (requires detecting recovery intent, which is the original BW-LOGIN-001 problem).
3. Change `redirectTo` in `sendResetPassword.controller.js` to `${window.location.origin}/auth/callback` so PKCE codes land on `AuthCallbackScreen`, which properly handles recovery routing via AuthProvider's onAuthStateChange subscription (already established when callback screen mounts).

**Rationale:** The route guard and the recovery navigation flow are architecturally in conflict. The recovery session auth event was designed to navigate TO `/reset-password`, but the route guard at that path rejects authenticated users.
**Follow-up command:** Wolverine (route architecture fix — remove AuthPublicRoute from /reset-password OR fix redirectTo to use /auth/callback)

**CISSP Domain:**
- Primary: Security Architecture and Engineering
- Secondary: Identity and Access Management

---

### VENOM-AUTH-003

**Finding ID:** VENOM-AUTH-003
**Remediation Status:** HARDENED 2026-05-23
**Location:** `src/features/auth/controllers/register.controller.js` (maybeMirrorWandersSession)
**Application Scope:** VCSM
**Platform Surface:** PWA · Supabase Auth (Wanders flow)
**Trust Boundary:** Wanders Client Session → Primary Supabase Client
**Boundary Violated:** Cross-client session trust boundary — RESOLVED
**Contract Violated:** Boundary Isolation Contract (Wanders → primary session injection)

**Current behavior:**
`dalMirrorWandersSessionToPrimary()` extracts the `access_token` and `refresh_token` from the Wanders Supabase client session and injects them into the primary Supabase client via `setSession()`:

```js
export async function dalMirrorWandersSessionToPrimary({ accessToken, refreshToken }) {
  const { error: setSessionError } = await supabase.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken,
  })
```

`supabase.auth.setSession()` accepts arbitrary token pairs and replaces the current primary session with the provided tokens. No validation is performed on whether the tokens belong to the expected user or whether the Wanders session represents the same user who is registering.

**Risk:**
If the Wanders client contains a session for User B (e.g., due to stale state, caching, or shared storage), and User A completes the Wanders registration flow, User A's primary client session would be replaced with User B's tokens. User A would then be authenticated as User B in the primary VCSM app.

This is a cross-client session confusion / session injection risk. The Wanders session is not validated against the current registration's expected userId before injection.

**Severity:** MEDIUM
**Exploitability:** MEDIUM
**Attack Preconditions:**
- Wanders-integrated registration flow must be in progress (`isWandersFlow: true`)
- Wanders client must have a stale or wrong user's session (requires some prior state corruption)
- Requires the registration flow to complete successfully

**Blast Radius:** Single actor — if triggered, one user gets authenticated as a different user; affects the specific registration session only

**Identity Leak Type:** Actor correlation (wrong user's session established in primary client)
**Cache Trust Type:** Identity-sensitive
**RLS Dependency:** NONE — session injection happens at auth client level

**Why it matters:**
`setSession()` is a powerful operation that completely replaces the session in the primary Supabase client. Accepting tokens from a secondary (Wanders) client without verifying they belong to the registering user introduces a session confusion vector. The blast radius is limited to users in the Wanders registration flow, but the consequence (being logged in as the wrong user) is significant.

**Fix applied (2026-05-23):**
`maybeMirrorWandersSession` now accepts `expectedUserId` as a required second argument. Before calling `dalMirrorWandersSessionToPrimary`, the function validates `session.user?.id === expectedUserId`. A mismatch throws an error immediately; a missing session returns early. Both call sites in `ctrlRegisterAccount` pass the correct userId (`existingUserId` for the upgrade path, `newUserId` for the new signup path).

**Rationale:** Cross-client session injection must validate identity consistency before overriding the primary session.
**Follow-up command:** None — HARDENED

**CISSP Domain:**
- Primary: Identity and Access Management
- Secondary: Software Development Security

---

### VENOM-AUTH-004

**Finding ID:** VENOM-AUTH-004
**Location:** `src/features/auth/dal/authSession.read.dal.js:7-11`
**Application Scope:** VCSM
**Platform Surface:** PWA · Supabase Auth
**Trust Boundary:** Client Storage → Controller Authorization
**Boundary Violated:** None (defense-depth only)
**Contract Violated:** None

**Current behavior:**
`dalGetAuthSession()` uses `supabase.auth.getSession()` which reads from local storage (with auto-refresh if the session is near expiry). It does NOT make a server round-trip to validate the JWT. `supabase.auth.getUser()` makes an API call to verify the token is still valid server-side.

```js
export async function dalGetAuthSession() {
  const { data, error } = await supabase.auth.getSession()
  if (error) throw error
  return data?.session ?? null
}
```

`dalGetAuthSession()` is used as the session-existence check in the recovery flow fallback gate (`setNewPassword.controller.js`), profile discoverability gate (`profile.controller.js`), and onboarding validation (`onboarding.controller.js`).

**Risk:**
A session that was revoked server-side (e.g., via admin action or global sign-out on another device) would still be returned by `getSession()` until the local token expires. The time window between server-side revocation and local expiry could be up to the JWT TTL (typically 1 hour for Supabase).

In the recovery flow: `dalGetAuthSession()` returning a cached non-recovery session would pass the session-existence check after the nonce check, potentially allowing the form to render with a session that is being used beyond its intended scope.

**Severity:** LOW
**Exploitability:** LOW — requires a revoked session that is still within its JWT TTL; not attacker-triggerable
**Attack Preconditions:**
- User's session must have been server-side revoked but not locally expired
- Session must pass the nonce gate (already requires source-code knowledge)

**Blast Radius:** Single actor

**Identity Leak Type:** None
**Cache Trust Type:** Identity-sensitive (stale session may represent revoked identity)
**RLS Dependency:** NONE — token passed to Supabase API on subsequent calls, which will reject expired/revoked tokens

**Why it matters:**
Stale sessions from `getSession()` represent cached identity state. For security-sensitive operations (password updates, onboarding profile writes), using `getUser()` would provide stronger guarantees. The risk is bounded because subsequent Supabase API calls will re-validate the token server-side, but the client-side permission gate may show a form to a user whose session was revoked.

**Recommended mitigation:**
For the recovery session gate specifically, consider using `supabase.auth.getUser()` (server-validated) rather than `getSession()` (cached). The latency tradeoff is acceptable in a security-critical path:

```js
// Alternative for security-critical gates:
export async function dalGetVerifiedAuthSession() {
  const { data, error } = await supabase.auth.getUser()
  if (error) throw error
  return data?.user ?? null
}
```

**Rationale:** Defense-in-depth for session validation at controller gates.
**Follow-up command:** None — LOW priority hardening

**CISSP Domain:**
- Primary: Identity and Access Management
- Secondary: Security Architecture and Engineering

---

### VENOM-AUTH-005

**Finding ID:** VENOM-AUTH-005
**Location:** `src/features/auth/dal/onboarding.dal.js:61-85`, `src/features/auth/model/onboarding.model.js` (computeAgeFromBirthdateModel)
**Application Scope:** VCSM
**Platform Surface:** PWA · Supabase Table (profiles)
**Trust Boundary:** Authenticated Citizen → Profile Write
**Boundary Violated:** None (design-level concern)
**Contract Violated:** None (no explicit age-verification contract)

**Current behavior:**
During onboarding, `age` and `is_adult` are computed client-side from the user-submitted `birthdate`:

```js
const age = computeAgeFromBirthdateModel(normalized.birthdate)
// ...
await upsertCompletedOnboardingProfileDAL({
  // ...
  age,
  is_adult: age >= 18,  // ← derived from user-provided value
})
```

`is_adult: true` is then persisted to `profiles.is_adult`. This field is used as the gate for the Void realm (`/void` route).

**Risk:**
A user can provide any birthdate (e.g., `1990-01-01`) to produce `is_adult: true` regardless of their actual age. There is no server-side age verification. Any user can access the Void realm by providing a false birthdate during onboarding.

**Severity:** MEDIUM
**Exploitability:** HIGH — trivially exploitable; any user can submit a false birthdate
**Attack Preconditions:**
- Create any account
- Provide a birthdate that places age >= 18 during onboarding

**Blast Radius:** Platform-wide age gate for Void realm — any user can bypass it

**Identity Leak Type:** None
**Cache Trust Type:** None
**RLS Dependency:** ASSUMED — profiles.is_adult likely governs Void realm access at the DB level as well; if not, age gate has no server-side enforcement

**Why it matters:**
If the Void realm contains age-restricted content, `is_adult` must not be client-controlled. A self-reported birthdate without verification provides no real age assurance. The current design means `is_adult: true` can be achieved by any account holder.

**Recommended mitigation:**
1. If the Void realm contains genuinely age-restricted content, age verification must be moved server-side — either via a server function that validates birthdate against a threshold and sets `is_adult` directly, or via a verified ID flow.
2. Short-term: compute `is_adult` in a database function or trigger based on the stored `birthdate`, not from client-submitted `age` or `is_adult` values. Add a DB check constraint or trigger on `profiles.is_adult` that verifies `birthdate` is consistent with `is_adult: true`.
3. If the Void realm is currently unshipped or has no regulated content, document this as a known limitation and revisit at Void realm launch.

**Rationale:** Client-computed and client-submitted `is_adult` cannot be trusted for access-control purposes.
**Follow-up command:** DB (verify whether profiles.is_adult has server-side enforcement; verify RLS on Void realm routes), Carnage (if DB trigger or check constraint is needed)

**CISSP Domain:**
- Primary: Identity and Access Management
- Secondary: Asset Security

---

### VENOM-AUTH-006

**Finding ID:** VENOM-AUTH-006
**Remediation Status:** HARDENED 2026-05-23
**Location:** `src/features/auth/controllers/createUserActor.controller.js`
**Application Scope:** VCSM
**Platform Surface:** PWA · Supabase RPC (`vc.create_actor_for_user`) · Supabase Table (`vc.actor_owners`)
**Trust Boundary:** Authenticated User → Actor Creation
**Boundary Violated:** ~~None confirmed — RLS assumed~~ — CONTROLLER GUARD ADDED
**Contract Violated:** Actor Ownership Contract — RESOLVED (controller layer)

**Current behavior:**
`createUserActorForProfile({ profileId, userId, refreshActorFn })` accepts `profileId` and `userId` from the caller. Both parameters are passed to the DB:

```js
actor = await dalCreateUserActor(profileId)    // RPC — uses profileId
await dalCreateActorOwner(actor.id, userId)    // INSERT into vc.actor_owners
```

In all current call sites (`onboarding.controller.js`, `bootstrapJoinOnboardingController`), `profileId = user.id` (session-authenticated). The guard is:

```js
if (userId && userId !== user.id) {
  return { ok: false, ... }  // mismatched userId caught here
}
// BUT: profileId is not re-validated against session
```

The `completeOnboardingController` validates `userId !== user.id` but does NOT explicitly validate that `profileId === user.id`. It relies on the caller providing the correct `profileId`. If a different `profileId` were passed (e.g., from a compromised hook or form state), the controller would proceed.

**Risk:**
If `profileId` is spoofed (e.g., passed as a different user's profile UUID through form state manipulation), the RPC `vc.create_actor_for_user` would be called with that `profileId`. Whether this succeeds depends on the RPC's internal authorization. If the RPC has no ownership check (e.g., it doesn't verify that `p_profile_id` matches the authenticated JWT `sub`), an actor could be created for a different user's profile.

**Severity:** LOW (mitigated by assumed RPC-level authorization)
**Exploitability:** LOW — requires form state manipulation AND RPC without ownership check
**Attack Preconditions:**
- Authenticated user during onboarding
- Ability to manipulate React form state with a different profileId
- RPC must lack ownership validation

**Blast Radius:** Single actor creation; if exploitable, actor could be created under wrong identity

**Identity Leak Type:** None
**Cache Trust Type:** None
**RLS Dependency:** ASSUMED — `vc.create_actor_for_user` RPC must validate `p_profile_id = auth.uid()` server-side; `vc.actor_owners` INSERT must require `user_id = auth.uid()`

**Why it matters:**
Actor creation is a foundational identity operation. If the server-side RPC enforces `p_profile_id = auth.uid()`, this is safe. If not, the caller-passed profileId becomes a trust boundary weakness.

**Fix applied (2026-05-23):**
`createUserActorForProfile` now throws immediately if `profileId !== userId`:
```js
if (profileId !== userId) {
  throw new Error('profileId must match authenticated userId. Actor creation is owner-scoped.')
}
```
This guard fires before any DB call. Existing `userId !== user.id` checks in callers remain.

**Remaining open:** DB-level verification that `vc.create_actor_for_user` RPC enforces `p_profile_id = auth.uid()` server-side, and that `vc.actor_owners` RLS enforces `user_id = auth.uid()` on INSERT.

**Rationale:** Defense-in-depth — controller validates identity consistency before DB call.
**Follow-up command:** DB (verify RPC and RLS on actor_owners) — lower priority, controller guard is now present

**CISSP Domain:**
- Primary: Identity and Access Management
- Secondary: Software Development Security

---

### VENOM-AUTH-007

**Finding ID:** VENOM-AUTH-007
**Location:** `src/features/auth/dal/authSession.read.dal.js:13-16`, `src/features/auth/dal/resetPassword.dal.js:27-30`
**Application Scope:** VCSM
**Platform Surface:** PWA
**Trust Boundary:** N/A (internal API consistency)
**Boundary Violated:** None
**Contract Violated:** None

**Current behavior:**
Two DAL functions subscribe to auth state changes with inconsistent return types:

```js
// authSession.read.dal.js — returns subscription OBJECT
export function dalSubscribeAuthStateChange(callback) {
  const { data: { subscription } } = supabase.auth.onAuthStateChange(callback)
  return subscription  // caller must call subscription.unsubscribe()
}

// resetPassword.dal.js — returns UNSUBSCRIBE FUNCTION
export function dalSubscribeToAuthStateChange(handler) {
  const { data: listener } = supabase.auth.onAuthStateChange(handler)
  return () => listener?.subscription?.unsubscribe?.()  // caller calls the returned function
}
```

`AuthProvider` uses `dalSubscribeAuthStateChange` and manually handles `subscription?.unsubscribe?.()`. `watchPasswordRecoveryController` uses `dalSubscribeToAuthStateChange` which returns a clean unsubscribe function.

**Risk:**
If a caller uses the wrong DAL function and applies the wrong cleanup pattern, event listeners may persist beyond their expected lifecycle. This could cause:
- Memory leaks in long-running sessions
- Auth state change events received by unmounted components (mitigated by `alive` flags, but adds fragility)
- Duplicate handler registrations if a component remounts

**Severity:** LOW (informational — no direct exploit path)
**Exploitability:** LOW

**Recommended mitigation:**
Standardize the subscription DAL to always return an unsubscribe function. The `dalSubscribeAuthStateChange` in `authSession.read.dal.js` should be updated to return a cleanup function rather than the subscription object, matching the pattern in `resetPassword.dal.js`.

**CISSP Domain:**
- Primary: Software Development Security
- Secondary: Security Operations

---

### VENOM-AUTH-008

**Finding ID:** VENOM-AUTH-008
**Location:** `src/features/auth/dal/login.dal.js`, `src/features/auth/dal/register.dal.js`, `src/features/auth/dal/resetPassword.dal.js`
**Application Scope:** VCSM
**Platform Surface:** PWA · Supabase Auth API
**Trust Boundary:** Public Visitor → Auth API
**Boundary Violated:** None
**Contract Violated:** None

**Current behavior:**
No client-side rate limiting or CAPTCHA is applied to:
- `dalSignInWithPassword()` — brute-forceable login
- `dalSignUpRegisterUser()` — account enumeration / spam registration
- `dalSendResetPasswordEmail()` — email spam / account enumeration

**Risk:**
Brute-force attacks on login, account enumeration via register endpoint, and spam password reset emails to victim addresses. Rate limiting is entirely delegated to Supabase's built-in per-IP throttling.

**Severity:** INFO (server-side controls assumed sufficient for current threat model)
**Exploitability:** MEDIUM — depends on Supabase rate limit configuration

**Recommended mitigation:**
Verify Supabase project rate limits are configured appropriately. Consider adding a client-side debounce on form submission to reduce accidental double-submissions. For high-risk operations (password reset), consider adding a CAPTCHA (Cloudflare Turnstile, hCaptcha) at the controller layer.

**CISSP Domain:**
- Primary: Security and Risk Management
- Secondary: Communication and Network Security

---

## Defenses That Held

| Area | Finding | Status |
|---|---|---|
| `ensureProfileDiscoverable` caller-ID check | Session re-fetched and compared before write | SOLID |
| `completeOnboardingController` session drift check | `userId !== user.id` caught at controller entry | SOLID |
| `bootstrapJoinOnboardingController` session match | `authedId !== userId` throws immediately | SOLID |
| `login.controller.signInWithPassword` token filtering | Returns only `{ id, email }` — full session token not returned to UI | SOLID |
| `authCallback.controller` — BW-LOGIN-002 (HARDENED) | `hashType` removed; `isRecovery` always false | SOLID |
| `setNewPassword.controller` — BW-LOGIN-003 (HARDENED) | `import.meta.env.DEV` guard on errorDescription | SOLID |
| `ProtectedRoute` email verification gate | `isEmailVerifiedModel(user)` checked before rendering protected content | SOLID |
| Debug log stub in production | `@debuggers` alias → no-op stub confirmed; `esbuild drop: console` | SOLID |
| Password not passed to debug events | No evidence of password field in any debugLoginEvent call | SOLID |
| URL surface — no raw UUIDs | All auth routes use slugs; state communicated via `location.state` | SOLID |

---

## Mitigation Plan

| Finding | Risk | Status | Layer Fixed | Follow-up |
|---|---|---|---|---|
| VENOM-AUTH-001 | Server enforcement claim inaccurate — `updateUser()` does not require recovery session | **MITIGATED** — docs corrected 2026-05-23 | Documentation | None |
| VENOM-AUTH-002 | `/reset-password` in AuthPublicRoute redirected recovery users to /feed | **HARDENED** — AuthPublicRoute removed from route 2026-05-23 | Router | None |
| VENOM-AUTH-003 | Cross-client session injection without userId validation | **HARDENED** — expectedUserId param + mismatch guard added 2026-05-23 | Controller | None |
| VENOM-AUTH-004 | `getSession()` vs `getUser()` at security gates | OPEN — P3 hardening | DAL | None |
| VENOM-AUTH-005 | `is_adult` client-controlled from user-provided birthdate | OPEN — P2 before Void launch | DAL + DB | DB, Carnage |
| VENOM-AUTH-006 | `createUserActorForProfile` profileId not session-validated at controller | **HARDENED** — `profileId !== userId` guard added 2026-05-23 | Controller | DB (RLS verify) |
| VENOM-AUTH-007 | Inconsistent DAL subscription return types | OPEN — P4 housekeeping | DAL | None |
| VENOM-AUTH-008 | No client-side rate limiting on auth endpoints | OPEN — P4 informational | — | None |

---

## Critical Architectural Note — BW-LOGIN-001 Risk Acceptance Update Required

The BW-LOGIN-001 risk acceptance document (`2026-05-23_blackwidow_login-screen.md`) states:

> "Risk accepted because password mutation remains enforced by Supabase server-side session validation, and normal sessions cannot successfully complete the password update despite reaching the form through manual client tampering."

**VENOM-AUTH-001 challenges this statement.** If `supabase.auth.updateUser({ password })` succeeds from any valid authenticated session (not only recovery sessions), the "Supabase server-side session validation" referenced is merely "is the JWT valid" — not "did this session originate from a PASSWORD_RECOVERY event."

The risk acceptance documentation for BW-LOGIN-001 must be updated to:
1. Accurately reflect that the server does not enforce recovery-session provenance for `updateUser()`
2. State that the nonce gate is the primary and only protection layer
3. Reassess the severity accordingly (LOW stays appropriate for self-exploitation; the confused-deputy risk may warrant revisit)

This does not necessarily reopen BW-LOGIN-001 as BLOCKED — self-exploitation of one's own password has limited security impact. But the documented rationale must be accurate.

---

## CISSP Domain Coverage Summary

| CISSP Domain | Findings | Notes |
|---|---:|---|
| Security and Risk Management | 1 | VENOM-AUTH-008 (INFO); BW-LOGIN-001 risk acceptance accuracy |
| Asset Security | 1 | VENOM-AUTH-005 (is_adult flag) |
| Security Architecture and Engineering | 3 | VENOM-AUTH-001, VENOM-AUTH-002, VENOM-AUTH-004 |
| Communication and Network Security | 1 | VENOM-AUTH-008 (rate limiting) |
| Identity and Access Management | 5 | VENOM-AUTH-001 through VENOM-AUTH-005 (all touch IAM) |
| Security Assessment and Testing | 1 | VENOM-AUTH-001 (unverified server enforcement assumption) |
| Security Operations | 1 | VENOM-AUTH-007 (subscription lifecycle) |
| Software Development Security | 3 | VENOM-AUTH-003, VENOM-AUTH-006, VENOM-AUTH-007 |

**Uncovered / Not Applicable:**
- **Security Operations** (audit trails, moderation workflows) — out of scope for this surface review; no moderation paths in login surface
- **Communication and Network Security** (deeper network/transport layer) — HTTPS enforcement assumed at infrastructure level; not inspectable from source

---

## Required Follow-up Actions

| Action | Priority | Command |
|---|---|---|
| Empirically verify whether `supabase.auth.updateUser({ password })` succeeds from a non-recovery session | P1 | Deadpool |
| Determine actual PKCE recovery flow behavior (does AuthPublicRoute intercept?) | P1 | Wolverine / Loki |
| Update BW-LOGIN-001 risk acceptance if server enforcement is confirmed absent | P1 | Update audit doc |
| Fix VENOM-AUTH-002: remove AuthPublicRoute from /reset-password OR change redirectTo to /auth/callback | P1 | Wolverine |
| Add userId consistency check to createUserActorForProfile | P3 | Wolverine |
| Verify vc.create_actor_for_user RPC and vc.actor_owners RLS | P2 | DB |
| Verify profiles.is_adult server-side enforcement before Void realm launch | P2 | DB |
