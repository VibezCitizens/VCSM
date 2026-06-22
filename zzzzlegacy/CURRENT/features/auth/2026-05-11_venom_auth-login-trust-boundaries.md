# VENOM SECURITY REPORT
**Date:** 2026-05-11
**Scope:** apps/VCSM — auth feature (login/register/callback/onboarding/reset)
**Trigger:** Post-Wolverine execution security review of the auth/login module
**Reviewer:** VENOM
**Mode:** Read-only analysis. No code modified.

---

## VENOM TARGET

```
Feature / Route / Engine:  auth — login, register, callback, onboarding, password-reset
Application Scope:         VCSM
Reason for review:         SENTRY post-execution advisory + standing security audit of auth module
Primary trust boundary:    Authenticated Citizen ↔ Supabase Auth ↔ VCSM platform
```

---

## SECURITY SURFACE

```
Entry points:
  /login                  → LoginScreen → useLogin → login.controller → login.dal
  /register               → RegisterScreen → useRegister → register.controller → register.dal
  /auth/callback          → AuthCallbackScreen → useAuthCallback → authCallback.controller → authCallback.dal
  /reset-password         → ResetPasswordScreen → useSetNewPassword → setNewPassword.controller → resetPassword.dal
  /onboarding             → Onboarding → useAuthOnboarding → onboarding.controller → onboarding.dal
  AuthProvider            → global session hydration via supabase.auth.getSession + onAuthStateChange

Auth source:              Supabase Auth (primary client), Wanders Supabase client (guest flow)
Authorization layer:      App-layer (controllers), RLS assumed on write paths
Identity surface:         user.id from session (server-authoritative), actor.id from vc.actors RPC
Sensitive objects:        access_token, refresh_token, user.email, user.id, actor_owners entries
```

---

## TRUST BOUNDARY TRACE

```
Client input:             email, password (login/register), password reset link URL params
Validated at:             model layer (password rules), controller layer (field presence)
Identity resolved at:     Supabase auth response (server-authoritative)
Authorization enforced:   Partially in controllers — DAL layer has no internal ownership gates
Data returned to:         AuthContext (session + user), hook state (data.user.id, error messages)
```

---

## FINDINGS OVERVIEW

| # | Severity | Exploitability | Location | Summary |
|---|---|---|---|---|
| 1 | HIGH | MEDIUM | AuthProvider.jsx:162 | Raw session with tokens in React context |
| 2 | HIGH | MEDIUM | actor.model.js:6 | ActorModel leaks `profileId` on public output |
| 3 | MEDIUM | LOW | wandersSupabaseClient.js:153 | Auth client singleton on `globalThis` |
| 4 | MEDIUM | LOW | profile.dal.js:14 | `dalUpdateProfileDiscoverable` — no app-layer ownership check |
| 5 | MEDIUM | LOW | register.dal.js:34, actorOwnerCreate.dal.js:3 | Write DALs trust caller-provided IDs — RLS assumed |
| 6 | MEDIUM | MEDIUM | authCallback.controller.js:32 | Attacker-controlled `error_description` reflected in UI |
| 7 | MEDIUM | MEDIUM | authCallback.controller.js:40 | `#type=recovery` hash forces redirect to `/reset-password` |
| 8 | LOW | LOW | authOps.controller.js | Pass-through controller — second unguarded path to DAL |
| 9 | LOW | LOW | login.dal.js:3, login.controller.js:7 | Full auth response (tokens) propagated to hook layer |
| 10 | LOW | LOW | actorGetByProfile.dal.js | `vc.actors` lookup by `profile_id` — RLS not verified |

---

---

## FINDING 1 — HIGH

```
VENOM SECURITY FINDING
Location:          apps/VCSM/src/app/providers/AuthProvider.jsx line 162
Application Scope: VCSM
```

**Current behavior:**

AuthProvider exposes the full `session` object in React context:

```jsx
<AuthContext.Provider value={{ user, session, loading, logout }}>
```

The `session` object is the raw Supabase `Session` shape and contains:
- `access_token` — a JWT bearing the authenticated user's claims
- `refresh_token` — used to obtain new access tokens
- `expires_at`, `expires_in`, `token_type`
- `user` (duplicated from the `user` context field)

Any component calling `useAuth()` can destructure and read these token values directly.

**Risk:**

The token surface is broader than necessary. Any component in the React tree — including third-party components, plugin components, or future features — can read `access_token` and `refresh_token` by calling `useAuth()`. If any of these components has an XSS vector or an unintended data exposure path, the tokens are immediately available.

**Severity:** HIGH

**Exploitability:** MEDIUM
Attack Preconditions:
- Authenticated session must exist
- Attacker must reach code that calls `useAuth()` and reads `session.access_token`
- Requires XSS, a malicious imported dependency, or a future careless component

**Blast Radius:** Feed-wide — all authenticated components share this context

**Trust Boundary:** Authenticated Citizen
**Boundary Violated:** Session tokens exposed beyond the auth layer into the UI component tree

**RLS Dependency:** NONE — this is an app-layer exposure risk

**Why it matters:**

Refresh tokens are long-lived credentials. If extracted, they allow persistent account access without re-authentication. The `session` object belongs in the auth layer, not the component tree.

**Recommended mitigation:**

Remove `session` from the context value. Consumers that need the access token for direct Supabase calls should use the Supabase client directly (which manages the token internally). Consumers that need auth state need only `user` and `loading`. The `session` field in context is almost certainly unused by UI components — it exists as an artifact of the original implementation.

```jsx
// Only expose what UI actually needs
<AuthContext.Provider value={{ user, loading, logout }}>
```

If server-to-server token forwarding is needed, create a controlled `getAccessToken()` function that retrieves the current token on-demand rather than keeping it in shared state.

**Rationale:** Defense in depth — tokens should not reside in the broadest shared state in the app.

**Follow-up command:** DB (verify RLS on Supabase tables does not depend on front-end token forwarding), LOGAN (update AuthProvider docs)

**CISSP Domain:**
- Primary: Asset Security
- Secondary: Identity and Access Management, Security Architecture and Engineering

---

## FINDING 2 — HIGH

```
VENOM SECURITY FINDING
Location:          apps/VCSM/src/features/auth/model/actor.model.js line 6
Application Scope: VCSM
```

**Current behavior:**

```js
export function ActorModel(row) {
  if (!row) return null
  return {
    id: row.id,
    kind: row.kind,
    profileId: row.profile_id,   // ← explicitly named as profileId
    isVoid: Boolean(row.is_void),
  }
}
```

`ActorModel` returns `profileId` as a named public field. This model is consumed by `createUserActorForProfile`, which returns the model output to `onboarding.controller.js`, which in turn returns it to `useAuthOnboarding`. The actor object — including `profileId` — then reaches hook state and potentially component renders.

**Risk:**

The VCSM identity contract explicitly prohibits exposing `profileId` on public surfaces:

> "Never expose profileId or vportId through useIdentity() or any public hook/controller surface."

`profileId` is the raw Supabase `auth.users.id` UUID. If this value reaches:
- URL construction paths
- Share flows
- API response bodies
- localStorage or state that persists across sessions

...it becomes an identity surface that violates the actor-based model. An actor's `profileId` can be used to query `profiles` directly, bypassing actor-based access control.

**Severity:** HIGH

**Exploitability:** MEDIUM
Attack Preconditions:
- Authenticated session with a completed actor
- Access to the hook or component that reads the actor model output

**Blast Radius:** Single actor — affects the authenticated user's own identity shape, but any feature consuming the actor model gets the profileId

**Trust Boundary:** Authenticated Citizen
**Boundary Violated:** profileId should not leave the controller layer

**RLS Dependency:** NONE — this is an app-layer model design issue

**Why it matters:**

Even if `profileId` is not currently rendered or stored insecurely, its presence in the model output creates a standing violation of the identity contract that will propagate as the codebase grows. Future developers will read the model and treat `profileId` as a legitimate public field.

**Recommended mitigation:**

Strip `profileId` from ActorModel output. The model should expose only `{ id, kind, isVoid }`. Any internal logic that requires `profileId` (e.g., refreshActorFn calls) should handle it before the model is applied — in the controller, using `actor.profile_id` from the raw row before passing through ActorModel.

```js
export function ActorModel(row) {
  if (!row) return null
  return {
    id: row.id,
    kind: row.kind,
    isVoid: Boolean(row.is_void),
    // profileId deliberately omitted — use actorId for all public surfaces
  }
}
```

**Rationale:** Model outputs are the shape that propagates to hooks and components. profileId must not be in that shape per identity contract.

**Follow-up command:** LOGAN (update actor model docs), review-contract (verify no other models expose profileId)

**CISSP Domain:**
- Primary: Asset Security
- Secondary: Identity and Access Management

---

## FINDING 3 — MEDIUM

```
VENOM SECURITY FINDING
Location:          apps/VCSM/src/features/wanders/services/wandersSupabaseClient.js line 153
Application Scope: VCSM
```

**Current behavior:**

```js
const g = globalThis
g.__WANDERS_SB__ = client
```

The Wanders Supabase client — a fully initialized Supabase client with active auth state and token storage — is stored as a named property on `globalThis` (`window` in browser context). This is an HMR-safe singleton pattern.

**Risk:**

In a browser, `window.__WANDERS_SB__` is accessible from any JavaScript execution context on the same origin, including:
- XSS payloads injected into any page
- Malicious browser extensions with `content_scripts` permissions
- Compromised dependencies executing in the page

An attacker who achieves JavaScript execution can call `window.__WANDERS_SB__.auth.getSession()` and retrieve the Wanders session, including `access_token` and `refresh_token`.

**Severity:** MEDIUM

**Exploitability:** LOW
Attack Preconditions:
- XSS vulnerability on the origin, OR a malicious browser extension with content script access
- Wanders flow must have been initiated (client only created when `getWandersSupabase()` is called)

**Blast Radius:** Single actor — Wanders guest session for the current device

**Trust Boundary:** Authenticated Citizen / Wanders Guest
**Boundary Violated:** Token storage accessible via global namespace

**RLS Dependency:** NONE — token exposure is client-layer

**Why it matters:**

Wanders sessions represent guest identity with potentially anonymous auth state. Token theft could allow impersonation of the Wanders guest session or use of the Wanders Supabase client for unauthorized API calls.

**Recommended mitigation:**

Option A (preferred): Use a module-scoped variable instead of `globalThis`. Since the module system handles HMR, a module-level `let cachedClient` with key tracking achieves the same singleton guarantee without global exposure.

Option B: If `globalThis` is required for cross-module HMR sharing, use an opaque key that cannot be guessed from reading the source (`__WS_${hash}__` derived from the storageKey, not a static string).

**Rationale:** Named global properties are part of the attacker's reconnaissance checklist. Remove predictable auth client globals.

**Follow-up command:** DEADPOOL (if wanders auth issues arise), VENOM (follow-up after fix)

**CISSP Domain:**
- Primary: Asset Security
- Secondary: Software Development Security

---

## FINDING 4 — MEDIUM

```
VENOM SECURITY FINDING
Location:          apps/VCSM/src/features/auth/dal/profile.dal.js lines 14-28
Application Scope: VCSM
```

**Current behavior:**

```js
export async function dalUpdateProfileDiscoverable({ profileId, discoverable, updatedAt }) {
  const { error } = await supabase
    .from('profiles')
    .update({ discoverable, updated_at: updatedAt })
    .eq('id', profileId)

  if (error) throw error
}
```

This DAL writes to the `profiles` table using a caller-provided `profileId` with no app-layer ownership verification. The DAL trusts the caller entirely.

**Current call chain (safe today):**

```
useLogin → ensureProfileDiscoverable(data.user.id) → dalUpdateProfileDiscoverable({ profileId: userId })
```

`data.user.id` comes from the Supabase sign-in response — server-authoritative. The current path is safe.

**Risk:**

The DAL itself has no protection. If any future caller passes an arbitrary `profileId`, it will update that profile's discoverable field without any ownership check. The exported function has no signature hint that `profileId` must match the session user.

**Severity:** MEDIUM

**Exploitability:** LOW (currently — call site is safe; future call sites are the risk)
Attack Preconditions:
- A future feature that calls `dalUpdateProfileDiscoverable` with a user-provided `profileId`
- No RLS on `profiles` table for the `discoverable` column, OR RLS using the wrong policy

**Blast Radius:** Single actor — one profile's discoverable status

**Trust Boundary:** Authenticated Citizen
**Boundary Violated:** DAL write without ownership gate

**RLS Dependency:** ASSUMED — behavior depends on Supabase RLS enforcing ownership on the `profiles` table

**Why it matters:**

Discoverable status controls whether a profile appears in search/explore. Setting `discoverable: true` for another user without their consent is a privacy violation. Setting `discoverable: false` could effectively hide another user's profile from discovery (a soft DoS on their presence).

**Recommended mitigation:**

Add an app-layer ownership assertion in the controller before the DAL call, or document the RLS policy and verify it enforces `auth.uid() = id` on the `profiles` table. The DAL should not be callable with arbitrary IDs — the controller should validate `userId === session.user.id`.

**Rationale:** DAL write surfaces should have ownership verified before the write is issued, not just assumed from the call context.

**Follow-up command:** DB (verify RLS policy on profiles.discoverable write path)

**CISSP Domain:**
- Primary: Identity and Access Management
- Secondary: Security Architecture and Engineering

---

## FINDING 5 — MEDIUM

```
VENOM SECURITY FINDING
Location:          apps/VCSM/src/features/auth/dal/register.dal.js:34
                   apps/VCSM/src/features/auth/dal/actorOwnerCreate.dal.js:3
Application Scope: VCSM
```

**Current behavior:**

`dalUpsertRegisterProfile` writes to `profiles` with caller-provided `userId`:
```js
export async function dalUpsertRegisterProfile({ client, userId, email, ... }) {
  const c = resolveClient(client)
  const { error } = await c.from('profiles').upsert({ id: userId, email, ... })
  if (error) throw error
}
```

`dalCreateActorOwner` writes to `vc.actor_owners` with caller-provided `actorId` and `userId`:
```js
export async function dalCreateActorOwner(actorId, userId) {
  const { error } = await supabase.schema('vc').from('actor_owners')
    .upsert({ actor_id: actorId, user_id: userId }, { onConflict: 'actor_id,user_id', ignoreDuplicates: true })
  if (error) throw error
}
```

Both DALs accept externally-provided IDs with no internal ownership validation.

**Risk:**

`actor_owners` is the canonical VCSM ownership table. An unchecked write claiming `{ actor_id: targetActorId, user_id: authenticatedUserId }` would give the authenticated user ownership over any actor. The current call chain is safe — `actorId` comes from the RPC response and `userId` from the session — but the DAL surface itself is unguarded.

Similarly, `dalUpsertRegisterProfile` accepting an arbitrary `userId` would allow a caller to upsert a profile row under any user ID.

**Severity:** MEDIUM

**Exploitability:** LOW (safe today — call chains use server-authoritative IDs)
Attack Preconditions:
- A future call site that provides an attacker-controlled `actorId` or `userId`
- RLS on `vc.actor_owners` not enforcing ownership constraints

**Blast Radius:** Multi-actor — `actor_owners` write would affect ownership across the platform

**Trust Boundary:** Authenticated Citizen → VPORT Owner escalation path
**Boundary Violated:** DAL write with no ownership enforcement; ownership escalation possible if called carelessly

**RLS Dependency:** REQUIRED — these writes must be gated by RLS on `vc.actor_owners` and `profiles`

**Why it matters:**

`actor_owners` is the source of truth for who owns what in VCSM. An unprotected write to this table — even an accidental one — is a critical ownership escalation. The risk today is low, but the DAL's exported shape creates a dangerous future surface.

**Recommended mitigation:**

1. Verify RLS on `vc.actor_owners` enforces that `user_id = auth.uid()` on insert — actors cannot be claimed on behalf of other users.
2. Add a controller-layer assertion that `userId === session.user.id` before calling `dalCreateActorOwner`.
3. Consider renaming `dalUpsertRegisterProfile` to make its trust model explicit (e.g., add a JSDoc comment: "userId must be verified to equal session.user.id before calling").

**Follow-up command:** DB (verify RLS on vc.actor_owners insert policy), Carnage (if policy needs strengthening)

**CISSP Domain:**
- Primary: Identity and Access Management
- Secondary: Security Architecture and Engineering

---

## FINDING 6 — MEDIUM

```
VENOM SECURITY FINDING
Location:          apps/VCSM/src/features/auth/controllers/authCallback.controller.js lines 29-35
Application Scope: VCSM
```

**Current behavior:**

```js
if (error) {
  return {
    ok: false,
    session: null,
    isRecovery: false,
    error: errorDescription || 'Verification failed.',
  }
}
```

`errorDescription` comes from `window.location.search` (`error_description` URL parameter). This value is returned to the hook and rendered in `AuthCallbackScreen.jsx`:

```jsx
<p className="mb-6 text-sm text-[#9ca3af]">{error}</p>
```

React renders this as text (no XSS). However, `errorDescription` is fully attacker-controllable via a crafted URL.

**Risk:**

An attacker can craft a URL:
```
https://app.vibezcitizens.com/auth/callback?error=access_denied&error_description=Your+account+has+been+suspended.+Contact+support%40evil.com
```

The user clicks this link (e.g., from a phishing email that looks like a legitimate Supabase verification email) and sees the attacker's message displayed as official UI text on the real app domain. This is a social engineering / phishing amplification vector — the message appears to come from the platform itself.

**Severity:** MEDIUM

**Exploitability:** MEDIUM
Attack Preconditions:
- No authentication required
- Attacker constructs a URL with controlled `error_description`
- User must follow the crafted link

**Blast Radius:** Single actor — targeted at individual users via phishing links

**Trust Boundary:** Public Visitor
**Boundary Violated:** Attacker-controlled string rendered as platform UI text on authenticated domain

**RLS Dependency:** NONE — purely app-layer

**Why it matters:**

The platform's domain is the trust anchor for users. Displaying attacker-controlled text within the verified UI creates a credible phishing surface without any XSS. Supabase's own error descriptions are safe, but the URL parameter is fully open.

**Recommended mitigation:**

Sanitize or allowlist `error_description` before displaying it. Use a fixed user-facing message for all error states, falling back to the `errorDescription` only in development:

```js
const userFacingError = import.meta.env.DEV
  ? (errorDescription || 'Verification failed.')
  : 'Verification failed. Please try again or request a new link.'
```

Alternatively, map known Supabase error codes to fixed strings and ignore unknown error descriptions entirely.

**Rationale:** User-controlled strings must not be rendered as platform-trusted messages on the auth domain.

**Follow-up command:** LOGAN (document auth callback error handling policy)

**CISSP Domain:**
- Primary: Software Development Security
- Secondary: Communication and Network Security

---

## FINDING 7 — MEDIUM

```
VENOM SECURITY FINDING
Location:          apps/VCSM/src/features/auth/controllers/authCallback.controller.js lines 40-42
Application Scope: VCSM
```

**Current behavior:**

```js
if (hashType === 'recovery') {
  return { ok: true, session: null, isRecovery: true, error: null }
}
```

`hashType` is read from `window.location.hash` via `new URLSearchParams(window.location.hash.slice(1)).get('type')`. A URL with `#type=recovery` in the hash will always trigger this branch — regardless of whether a valid Supabase recovery session exists.

The `useAuthCallback` hook responds:
```js
if (result.isRecovery) {
  navigate('/reset-password', { replace: true })
  return
}
```

**Risk:**

Any link to `/auth/callback#type=recovery` will silently redirect the user to `/reset-password`. This is:

1. A user experience deception vector — an attacker can send a link that appears to be a verification link but silently lands on the password reset screen (which shows "invalid" if there's no real recovery session, but confuses users).
2. Combined with Finding 6, an attacker could send: `/auth/callback?error=access_denied&error_description=Your+session+expired.+Reset+your+password.#type=recovery` — except the `error` branch fires first due to the `if (error)` check at line 29. Still, the `#type=recovery` alone is a silent redirect.

**Severity:** MEDIUM

**Exploitability:** MEDIUM
Attack Preconditions:
- No authentication required
- Craft a URL with `#type=recovery` fragment
- Requires user to follow the link (phishing)

**Blast Radius:** Single actor — targeted deception

**Trust Boundary:** Public Visitor
**Boundary Violated:** Hash parameter controls navigation without session verification

**RLS Dependency:** NONE — purely app-layer navigation

**Why it matters:**

The hash fragment is fully client-controllable and not sent to servers. The controller makes a security decision (navigate to password reset) based entirely on this unverifiable client-provided value.

**Recommended mitigation:**

Before returning `{ isRecovery: true }`, verify that a valid Supabase session with recovery intent actually exists:

```js
if (hashType === 'recovery') {
  const session = await dalGetAuthSession()
  if (session) {
    return { ok: true, session, isRecovery: true, error: null }
  }
  return { ok: false, session: null, isRecovery: false, error: 'Reset link is invalid or expired.' }
}
```

This gates the recovery redirect on an actual verified recovery session rather than a URL parameter.

**Rationale:** Navigation decisions that send users to privileged flows must be gated on server-verified state.

**Follow-up command:** DEADPOOL (if recovery flow issues arise in production)

**CISSP Domain:**
- Primary: Software Development Security
- Secondary: Communication and Network Security

---

## FINDING 8 — LOW

```
VENOM SECURITY FINDING
Location:          apps/VCSM/src/features/auth/controllers/authOps.controller.js
Application Scope: VCSM
```

**Current behavior:**

`authOps.controller.js` is a pass-through controller with no business logic:

```js
export async function readCurrentAuthUser() {
  return readCurrentAuthUserDAL()
}
export async function generateUsername(params) {
  return generateUsernameDAL(params)
}
export async function upsertCompletedOnboardingProfile(params) {
  return upsertCompletedOnboardingProfileDAL(params)
}
```

It re-exports DAL calls with no authorization, validation, or ownership checks added.

**Risk:**

This creates a second, unguarded code path to reach the same DAL methods. Callers that use `authOps.controller` instead of the canonical `onboarding.controller` bypass the business logic and session verification in `onboarding.controller.js`. The `upsertCompletedOnboardingProfileDAL` write, in particular, can be reached without the session ownership check that exists in `completeOnboardingController`.

**Severity:** LOW

**Exploitability:** LOW (app-layer only — requires code path to call this controller)

**Blast Radius:** Single actor — affects the authenticated user's own profile

**Trust Boundary:** Authenticated Citizen
**Boundary Violated:** Secondary controller path bypasses canonical business logic

**RLS Dependency:** ASSUMED — database enforces write restrictions

**Why it matters:**

Every parallel path to a write DAL is a path that future developers may use, potentially bypassing intended business rule enforcement.

**Recommended mitigation:**

If `authOps.controller.js` has no callers (check with LOGAN), delete it. If it has callers, migrate them to the canonical controller and delete the file. Controllers must not be thin DAL wrappers.

**Follow-up command:** LOGAN (check callers, mark for removal if unused)

**CISSP Domain:**
- Primary: Security Architecture and Engineering
- Secondary: Software Development Security

---

## FINDING 9 — LOW

```
VENOM SECURITY FINDING
Location:          apps/VCSM/src/features/auth/dal/login.dal.js lines 3-6
                   apps/VCSM/src/features/auth/controllers/login.controller.js lines 7-11
Application Scope: VCSM
```

**Current behavior:**

`dalSignInWithPassword` returns the raw Supabase promise:
```js
export async function dalSignInWithPassword({ email, password }) {
  return supabase.auth.signInWithPassword({ email, password })
}
```

The controller propagates `{ data, error: null }` where `data` is the full Supabase auth response:
```js
export async function signInWithPassword({ email, password }) {
  const { data, error } = await dalSignInWithPassword({ email, password })
  if (error) throw error
  return { data, error: null }
}
```

`data` contains `session` (with `access_token`, `refresh_token`), `user`, and `weakPassword`. The `useLogin` hook reads `data.user.id` and `data.user.email` but holds a reference to the full response including tokens.

**Risk:**

The full auth response (including tokens) is held in the hook's call stack and potentially in state if the hook expands. The token data is broader than what the login flow needs.

**Severity:** LOW

**Exploitability:** LOW — not directly exploitable; tokens are in local function scope, not state

**Blast Radius:** Single actor

**Trust Boundary:** Authenticated Citizen

**RLS Dependency:** NONE

**Why it matters:**

Minimal exposure principle. The controller and hook should return only what callers need: `{ userId, email }` — not the full session. This reduces the accidental surface area for token exposure.

**Recommended mitigation:**

Shape the controller return to only expose what callers need:
```js
export async function signInWithPassword({ email, password }) {
  const { data, error } = await dalSignInWithPassword({ email, password })
  if (error) throw error
  return {
    userId: data?.user?.id ?? null,
    email: data?.user?.email ?? null,
    // tokens intentionally not returned — AuthProvider manages session via onAuthStateChange
  }
}
```

**Follow-up command:** None — advisory only

**CISSP Domain:**
- Primary: Asset Security

---

## FINDING 10 — LOW

```
VENOM SECURITY FINDING
Location:          apps/VCSM/src/features/auth/dal/actorGetByProfile.dal.js
Application Scope: VCSM
```

**Current behavior:**

```js
export async function dalGetActorByProfile(profileId) {
  const { data, error } = await supabase
    .schema('vc')
    .from('actors')
    .select('id, kind, profile_id, is_void')
    .eq('profile_id', profileId)
    .maybeSingle()
  if (error) throw error
  return data
}
```

Queries `vc.actors` by `profile_id` with no app-layer session verification.

**Risk:**

If RLS on `vc.actors` does not restrict reads by authenticated user, any authenticated caller could look up the actor for any `profileId` in the system. The current call site (`createUserActorForProfile`) passes `user.id` from the session — safe. But the DAL itself is unrestricted.

**Severity:** LOW

**Exploitability:** LOW — DAL not directly callable from UI; call site is safe

**Blast Radius:** Single actor — lookup of one actor row

**Trust Boundary:** Authenticated Citizen

**RLS Dependency:** ASSUMED — RLS on vc.actors not verified

**Why it matters:**

Actor rows may contain `profile_id` which should not be broadly readable. If RLS allows any authenticated user to look up any actor by `profile_id`, this becomes an enumeration surface.

**Recommended mitigation:**

Verify RLS on `vc.actors` restricts reads appropriately. If actors are meant to be public (any authenticated user can look up any actor), document this explicitly. If reads should be restricted, RLS must enforce `auth.uid() = profile_id` or equivalent.

**Follow-up command:** DB (verify vc.actors read policy)

**CISSP Domain:**
- Primary: Security Architecture and Engineering

---

## IDENTITY SURFACE WARNINGS

### ISW-1

```
IDENTITY SURFACE WARNING
Location:          apps/VCSM/src/features/auth/model/actor.model.js
Current identity surface: profileId (returned as named field in model output)
Expected identity surface: id (actorId), kind only
Risk:              profileId propagates to hook state and potentially UI; violates identity contract
Suggested correction: Remove profileId from ActorModel output (see Finding 2)
```

### ISW-2

```
IDENTITY SURFACE WARNING
Location:          apps/VCSM/src/features/auth/dal/actorGetByProfile.dal.js
Current identity surface: profile_id used as lookup key; returned in result row
Expected identity surface: actor.id is the canonical identity anchor
Risk:              profile_id returned in DAL result feeds into ActorModel which then re-exposes it as profileId
Suggested correction: After RLS verification, consider whether profile_id needs to be in the SELECT
```

---

## DEBUG LEAKAGE REVIEW

**`@debuggers/identity` — PRODUCTION SAFE**

In production builds (`mode === 'production'`), `vite.config.js` resolves `@debuggers` to `src/debuggers-stub/identity/index.js` where all functions are no-ops:

```js
export function debugLoginEvent() {}
export function debugLoginError() {}
export function debugLoginSessionSnapshot() {}
```

Email logging in `useLogin.js` (line 22: `payload: { email }`) and auth event logging in `AuthProvider.jsx` do not execute in production. ✅ Confirmed safe.

**`appendIOSProdDebugLog` — PRODUCTION SAFE**

`iosProdDebugger.js` line 222: `if (IS_PROD) return null`. The function is a no-op in production. Auth session state, userId, and event types logged via this function do not persist or emit in production builds. ✅ Confirmed safe.

**Residual concern:**

`appendIOSProdDebugLog` is gated by `IS_PROD` (`import.meta.env.PROD`). In development and staging environments where `PROD=false`, auth events including `userId` and `hasSession` are written to `sessionStorage` under `__vcsm_ios_dbg_logs`. This is acceptable for dev/staging but means any non-production deployment that a QA or demo user accesses will store auth telemetry in sessionStorage, accessible to browser extensions and devtools.

---

## MITIGATION PRIORITY

| Priority | Finding | Action |
|---|---|---|
| P1 | Finding 2 — ActorModel leaks profileId | Remove profileId from ActorModel output |
| P1 | Finding 6 — error_description reflected | Sanitize to fixed string in production |
| P2 | Finding 1 — session in context | Remove `session` from AuthContext value |
| P2 | Finding 7 — hash-based recovery redirect | Gate on verified session before returning isRecovery |
| P3 | Finding 4 — dalUpdateProfileDiscoverable | Verify RLS; add controller ownership assertion |
| P3 | Finding 5 — actor_owners/profiles write DALs | Verify RLS; add controller-layer ID assertion |
| P3 | Finding 3 — globalThis singleton | Move to module-scoped variable |
| P4 | Finding 8 — authOps controller | Audit callers; delete if unused |
| P4 | Finding 9 — full auth response propagated | Shape controller return to minimal fields |
| P4 | Finding 10 — vc.actors RLS | DB verification task |

---

## CISSP DOMAIN COVERAGE SUMMARY

| CISSP Domain | Findings | Notes |
|---|---:|---|
| Security and Risk Management | 0 | No governance/policy findings in this scope |
| Asset Security | 4 | Findings 1, 2, 9, 10 — token and ID over-exposure |
| Security Architecture and Engineering | 5 | Findings 4, 5, 8, 10 — RLS assumptions, DAL ownership, pass-through controller |
| Communication and Network Security | 2 | Findings 6, 7 — URL parameter reflection and hash-based navigation |
| Identity and Access Management | 4 | Findings 1, 2, 4, 5 — session exposure, profileId surface, write path ownership |
| Security Assessment and Testing | 0 | Out of scope for this review — no test coverage gap analysis performed |
| Security Operations | 0 | Debug tooling confirmed dev-only; no production operational risk found |
| Software Development Security | 4 | Findings 3, 6, 7, 8 — global singleton, input reflection, pass-through controller |

**CISSP Completion:**
- Security and Risk Management: Out of scope for this feature-level review
- Security Assessment and Testing: Not performed in this pass — recommend as a follow-up (no test coverage for auth callback error paths)
- Security Operations: Reviewed — debug tooling is production-gated, confirmed safe

---

## VENOM COMPLETION SUMMARY

```
Files inspected:             24
DAL files reviewed:           8
Controller files reviewed:    9
Screens reviewed:             5
Hooks reviewed:               2
Provider/config reviewed:     3

Findings total:              10
  CRITICAL:                   0
  HIGH:                       2
  MEDIUM:                     5
  LOW:                        3

Identity surface warnings:    2
Debug leakage warnings:       0 (both debug systems confirmed production-safe)
RLS assumptions flagged:      4 (Findings 4, 5, 10 + actor read path)
Blocking issues:              0

Recommended follow-ups:
  DB   — verify RLS on profiles, vc.actors, vc.actor_owners
  LOGAN — ActorModel docs, authOps.controller caller audit
  DEADPOOL — if recovery flow phishing attempts materialize in logs
```

VENOM has completed the trust boundary trace, identity surface inspection, authorization path review, and debug leakage audit for the auth/login module. No critical findings. Two high-priority findings require immediate attention: `profileId` in ActorModel output (identity contract violation) and `error_description` URL reflection (phishing surface).
