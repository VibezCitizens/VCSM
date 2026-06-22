---
title: VENOM — Auth-Login Full Security Surface Audit
date: 2026-05-14
reviewer: VENOM
application_scope: VCSM
trigger: Manual — /venom run against auth-login module following ARCHITECT runtime map
findings: 3 HIGH | 5 MEDIUM | 3 LOW
confidence: STATICALLY_TRACED
---

# VENOM SECURITY AUDIT

**Date:** 2026-05-14
**Application Scope:** VCSM
**Trigger:** Full auth-login surface audit following ARCHITECT runtime map and T6→T35 identity gap mapping
**Read-only:** YES — no code modified

---

## VENOM TARGET

```
Feature / Route / Engine: auth-login + booking trust + dev diagnostics surface
Application Scope: VCSM
Reason for review: Auth-login runtime map identified profile.controller identity contract violation, 
  AuthProvider DAL bypass, T6→T35 identity gap, and referenced booking and diagnostics surfaces 
  needing direct security trace.
Primary trust boundary: Authenticated Citizen → VPORT Owner → Booking Resource
```

---

## SECURITY SURFACE

```
Entry point: /login → useLogin → login.controller → login.dal → supabase.auth
Auth source: supabase.auth.signInWithPassword (Supabase-managed JWT)
Authorization layer: AuthProvider (React Context) + ProtectedRoute + ProfileGatedOutlet
Identity surface: actorId (engine-resolved) — login phase uses userId directly
Sensitive objects: auth.users, public.profiles, platform.user_app_*, vc.bookings, vc.actor_follows, vc.friend_ranks
```

---

## TRUST BOUNDARY TRACE

```
Client input: email, password (LoginScreen form)
Validated at: login.controller — passed directly to supabase.auth (Supabase validates)
Identity resolved at: IdentityProvider (post-redirect, async, 200–1500ms gap)
Authorization enforced at: ProtectedRoute (auth gate only) + individual controller guards
Data returned to: AuthContext.user (limited: id, email only) + identityContext (full actor shape)
```

---

# SECURITY RISK FINDINGS

---

## FINDING 1

**VENOM SECURITY FINDING**

- **Finding ID:** VENOM-2026-05-14-001
- **Location:** `apps/VCSM/src/features/booking/controller/createBooking.controller.js:54–77`
- **Application Scope:** VCSM
- **Platform Surface:** PWA, Supabase Table/View (vc.bookings)
- **Trust Boundary:** Authenticated Citizen, Authenticated VPORT Owner
- **Boundary Violated:** Authenticated Citizen → VPORT Owner (authorization layer bypassed)
- **Contract Violated:** Actor Ownership Contract, Booking Trust Contract

**Current behavior:**

`createBookingController` accepts a `source` string parameter and runs authorization checks only for two known sets:
- `MANAGEMENT_SOURCES` = `{ "owner", "admin", "import", "sync" }` → triggers `assertActorOwnsVportActor`
- `CITIZEN_ONLY_SOURCES` = `{ "public" }` → checks actor is a non-void citizen

If `source` is any other string — e.g. `"walk_in"`, `"bypass"`, `""`, any arbitrary value — **neither authorization check runs**. The booking is inserted unconditionally after resource existence is confirmed.

```javascript
// createBooking.controller.js:54–77
if (MANAGEMENT_SOURCES.has(String(source))) {
  await assertActorOwnsVportActorController(...)  // ownership check
}
if (CITIZEN_ONLY_SOURCES.has(String(source))) {
  // citizen check
}
// ← no else / no default → insert proceeds with zero auth for unknown source
const inserted = await insertBookingDAL({ row: { ... } })
```

- **Risk:** Any authenticated user can create a booking against any active resource with `requestActorId` set to any actor ID they control, bypassing both the owner assertion and the citizen-only gate, by passing any unrecognized `source` string.
- **Severity:** HIGH
- **Exploitability:** HIGH
- **Attack Preconditions:**
  - Authenticated VCSM account required
  - Target `resourceId` must be known (public or guessable)
  - Attacker must be able to call `createBookingController` directly (PWA client-side — exploitable from browser devtools or via any hook that passes user-controlled source)
- **Blast Radius:** Booking-wide — any active booking resource on the platform
- **Identity Leak Type:** None directly — but attacker can book as any actorId they supply
- **Cache Trust Type:** Booking-sensitive
- **RLS Dependency:** UNVERIFIED — if RLS on `vc.bookings` enforces ownership independently of app-layer source logic, the blast radius shrinks. If RLS trusts the app layer, this is fully exploitable.
- **Why it matters:** Booking integrity depends on knowing who made a booking and under what authority. An unvalidated source bypasses the entire authorization model for booking creation. VPORT owners receive no legitimate notification for bookings created this way, and audit trails (`created_by_actor_id`) become meaningless.
- **Recommended mitigation:** Validate `source` against an allowed enum before any business logic runs. Throw on unknown source values rather than silently falling through. Add a default `else` that throws `"Invalid booking source"` if neither set matches.
  ```javascript
  const ALL_VALID_SOURCES = new Set([...MANAGEMENT_SOURCES, ...CITIZEN_ONLY_SOURCES])
  if (!ALL_VALID_SOURCES.has(String(source))) {
    throw new Error('createBookingController: invalid source value')
  }
  ```
- **Rationale:** Defense-in-depth — unknown source should fail loudly, not silently authorize.
- **Follow-up command:** DB — verify RLS on `vc.bookings` independently enforces ownership; CARNAGE if schema fix is needed
- **CISSP Domain:**
  - Primary: Identity and Access Management
  - Secondary: Software Development Security, Security Architecture and Engineering

---

## FINDING 2

**VENOM SECURITY FINDING**

- **Finding ID:** VENOM-2026-05-14-002
- **Location:** `apps/VCSM/src/app/routes/lazyApp.jsx:3–4` + `apps/VCSM/src/app/routes/protected/app.routes.jsx:163–165`
- **Application Scope:** VCSM
- **Platform Surface:** PWA (Admin/Moderation adjacent — dev diagnostics)
- **Trust Boundary:** Authenticated Citizen
- **Boundary Violated:** Authenticated Citizen → System Operations (any authed user can run real write operations against live DB)
- **Contract Violated:** Security Architecture and Engineering — privileged tool exposed to unprivileged actors

**Current behavior:**

The dev diagnostics screen at `/dev/diagnostics` is activated by:
```javascript
// lazyApp.jsx:3–4
const devDiagnosticsEnabled =
  import.meta.env.DEV || import.meta.env.VITE_ENABLE_DEV_DIAGNOSTICS === "1"
```

The route is registered inside `ProtectedRoute` (auth + email + consent gate) with **no admin or role check**. Any authenticated VCSM user who knows the path can access it.

When active, the diagnostics suite runs real write operations against live production data:
- `toggleBlockActorController(pair.actorId, pair.targetActorId)` — real block/unblock
- `vc.actor_follows` UPSERT (seed follow edge, then confirm it was removed by block)
- `vc.friend_ranks` UPSERT (seed friend rank, then confirm removal)
- `ctrlGetBlockedActorSet`, `ctrlGetBlockStatus` — real reads

The `finally` block attempts cleanup (`ensureUnblocked`) but cleanup is not guaranteed if the test suite throws mid-run. Data mutations can persist.

**Additionally:** `VITE_ENABLE_DEV_DIAGNOSTICS=1` is a runtime env flag that can activate the full diagnostics screen in any build — including production — if set in the deployment environment.

- **Risk:** Any authenticated user can navigate to `/dev/diagnostics` (in DEV or when flag is set), run block/unblock operations on arbitrary actor pairs visible to their session, and leave side-effect mutations on `vc.actor_follows` and `vc.friend_ranks`. If `VITE_ENABLE_DEV_DIAGNOSTICS=1` is set in a production `.env` file, this surface is live in production.
- **Severity:** HIGH
- **Exploitability:** MEDIUM (requires knowing the path; requires DEV build or env flag)
- **Attack Preconditions:**
  - Authenticated account required
  - Must be in DEV build OR `VITE_ENABLE_DEV_DIAGNOSTICS=1` in the environment
  - Target `actorId` pair must be resolvable from the authenticated session
- **Blast Radius:** Multi-actor — block/follow edges mutated for any actors accessible to the session
- **Identity Leak Type:** Actor correlation (block status between actor pairs exposed)
- **Cache Trust Type:** Moderation-sensitive
- **RLS Dependency:** ASSUMED — block/unblock RPCs have RLS, but the diagnostic DAL functions (`fetchActorsIBlocked`, `fetchBlockGraph`) may read without additional policy
- **Why it matters:** A dev tool that runs real database writes against production data must be gated on an admin/staff role — not just authentication. If shipped to production with the env flag, any authenticated user can manipulate block graphs and friend ranks for actors they can reference.
- **Recommended mitigation:**
  1. Add an explicit staff/admin actor role check before rendering `DevDiagnosticsScreen` — this check belongs in the route, not just the build flag.
  2. Block `VITE_ENABLE_DEV_DIAGNOSTICS` from ever being set to `"1"` in `.env.production` — add a CI check or Vite plugin assertion.
  3. Move the diagnostics suite to a separate non-bundled dev server route entirely, outside the production build.
- **Rationale:** Build flags are an insufficient gate for write-capable operations. A runtime actor role check is the only reliable control.
- **Follow-up command:** IRONMAN (assign ownership), DB (verify diagnostics DAL reads have RLS coverage)
- **CISSP Domain:**
  - Primary: Security Operations
  - Secondary: Identity and Access Management, Software Development Security

---

## FINDING 3

**VENOM SECURITY FINDING**

- **Finding ID:** VENOM-2026-05-14-003
- **Location:** `apps/VCSM/src/features/booking/controller/createBooking.controller.js:84–103`
- **Application Scope:** VCSM
- **Platform Surface:** PWA, Supabase Table/View (vc.bookings)
- **Trust Boundary:** Authenticated Citizen
- **Boundary Violated:** Client input trusted as authoritative booking data
- **Contract Violated:** Booking Trust Contract

**Current behavior:**

`createBookingController` writes `serviceLabelSnapshot`, `durationMinutes`, `customerPhone`, `customerEmail`, and `internalNote` directly from caller-supplied parameters to the booking row — with no server-side lookup against the actual service record to validate correctness:

```javascript
const inserted = await insertBookingDAL({
  row: {
    service_label_snapshot: serviceLabelSnapshot,   // client-supplied string
    duration_minutes: durationMinutes,              // client-supplied integer
    customer_phone: customerPhone,                  // client-supplied
    customer_email: customerEmail,                  // client-supplied
    internal_note: internalNote,                    // client-supplied, visible to VPORT owner/staff
  },
})
```

The actual `serviceId` is passed but the controller does not look up the service record to verify that `durationMinutes` matches the service's configured duration or that `serviceLabelSnapshot` is accurate.

- **Risk:**
  - A customer can submit a booking with `durationMinutes: 5` for a 60-minute service, potentially double-booking the resource.
  - `internalNote` is a client-controlled string written into internal operational data visible to VPORT owners and staff — potential for content injection into owner-facing operational views.
  - `customerPhone` and `customerEmail` are stored without format validation — garbage or adversarial strings accepted.
- **Severity:** HIGH
- **Exploitability:** HIGH (any authenticated citizen who can book can supply arbitrary values)
- **Attack Preconditions:**
  - Authenticated citizen account required
  - Target `resourceId` and `serviceId` must be known
- **Blast Radius:** Booking-wide — affects VPORT owner operational data, calendar availability, and staff scheduling
- **Identity Leak Type:** None — this is data integrity, not identity leak
- **Cache Trust Type:** Booking-sensitive
- **RLS Dependency:** NONE — this is an app-layer data trust issue, not an RLS issue
- **Why it matters:** A booking system that trusts client-supplied duration values undermines resource availability integrity. A 60-minute slot booked as 5 minutes leaves the calendar wrong. VPORT owners making scheduling decisions from the dashboard are operating on attacker-controlled data. `internalNote` rendered in the dashboard without sanitization is a stored XSS surface.
- **Recommended mitigation:**
  1. Look up the service record by `serviceId` inside the controller and use its `duration_minutes` from the DB, ignoring the client-supplied value.
  2. Validate `serviceLabelSnapshot` matches the fetched service record's label.
  3. Strip or validate `internalNote` at the controller boundary — no raw HTML accepted.
  4. Add format validation for `customerPhone` and `customerEmail` at controller entry.
- **Rationale:** Booking integrity requires server-authoritative service data. Client-side snapshots should be treated as display hints, not authoritative booking parameters.
- **Follow-up command:** CARNAGE (schema — add DB constraint on duration_minutes), DB (verify service record lookup), DEADPOOL (trace dashboard rendering of internalNote)
- **CISSP Domain:**
  - Primary: Software Development Security
  - Secondary: Asset Security, Security Architecture and Engineering

---

## FINDING 4

**VENOM SECURITY FINDING**

- **Finding ID:** VENOM-2026-05-14-004
- **Location:** `apps/VCSM/src/features/auth/controllers/profile.controller.js:8–24` + `apps/VCSM/src/features/auth/dal/profile.dal.js:3–28`
- **Application Scope:** VCSM
- **Platform Surface:** PWA, Supabase Table/View (public.profiles)
- **Trust Boundary:** Authenticated Citizen
- **Boundary Violated:** Actor Ownership Contract — identity surface uses `profileId`/`userId` instead of `actorId`
- **Contract Violated:** Public Identity Surface Contract, Actor Ownership Contract

**Current behavior:**

`ensureProfileDiscoverable(userId)` reads and writes `public.profiles` using `userId` as the primary key (`profileId`), bypassing the actor-based identity model entirely:

```javascript
// profile.controller.js
export async function ensureProfileDiscoverable(userId) {
  const session = await dalGetAuthSession()
  if (!session?.user?.id || session.user.id !== userId) return
  const row = await dalGetProfileDiscoverable(userId)          // profileId = userId
  ...
  await dalUpdateProfileDiscoverable({
    profileId: userId,                                          // raw userId as profileId
    discoverable: true,
    ...
  })
}

// profile.dal.js
export async function dalGetProfileDiscoverable(profileId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, discoverable')
    .eq('id', profileId)                                        // raw userId in WHERE clause
  ...
}
```

The VCSM identity contract mandates `actorId` as the sole authority surface. `profileId` is explicitly banned from controller and DAL surfaces.

- **Risk:** Reads and writes to `public.profiles` are authorized by comparing `session.user.id` to `userId` — this is the legacy pre-actor identity model. It bypasses the actor ownership verification chain (`vc.actors` → `actor_owners`). Any caller who passes a `userId` that matches the session user can trigger a profile write without going through actor resolution.
- **Severity:** MEDIUM
- **Exploitability:** LOW (session check prevents cross-user write in this specific path; risk is architectural drift and future misuse of this pattern)
- **Attack Preconditions:**
  - Authenticated session required
  - `userId` must match `session.user.id` (so no cross-user write here)
- **Blast Radius:** Single actor (the authenticated user's own profile)
- **Identity Leak Type:** Internal UUID exposure (profileId = auth userId exposed in DAL boundary)
- **Cache Trust Type:** Public-profile-sensitive
- **RLS Dependency:** ASSUMED — `public.profiles` RLS likely enforces that only the row owner can update, but this is unverified
- **Why it matters:** This is a contract violation that sets a bad precedent. Controllers that use `profileId` as an identity surface are subject to legacy drift. If this pattern is copied into a write path that doesn't include the session check, it becomes a cross-user write vulnerability. It also undermines the actor model — VPORT actors have no `profileId`, so this code path would silently fail for VPORT identity contexts.
- **Recommended mitigation:** Replace `ensureProfileDiscoverable(userId)` with an actor-scoped version. Accept `actorId` as the identity anchor. Resolve the profile via the actor DAL (`vc.actors.profile_id`) rather than treating `userId === profileId` directly.
- **Rationale:** The contract violation today creates the exploit surface of tomorrow. Eliminate it before this pattern propagates.
- **Follow-up command:** CARNAGE (verify public.profiles RLS), ARCHITECT (document which tables are still on legacy identity)
- **CISSP Domain:**
  - Primary: Identity and Access Management
  - Secondary: Software Development Security

---

## FINDING 5

**VENOM SECURITY FINDING**

- **Finding ID:** VENOM-2026-05-14-005
- **Location:** `apps/VCSM/src/features/booking/controller/assertActorOwnsVportActor.controller.js:15–16`
- **Application Scope:** VCSM
- **Platform Surface:** PWA, Booking Engine
- **Trust Boundary:** Authenticated Citizen → VPORT Owner
- **Boundary Violated:** Ownership verification short-circuited on self-match
- **Contract Violated:** Actor Ownership Contract

**Current behavior:**

```javascript
// assertActorOwnsVportActor.controller.js:15–16
if (String(requestActorId) === String(targetActorId)) {
  return { ok: true, mode: "self" }  // no ownership verified
}
```

When `requestActorId` equals `targetActorId`, the controller short-circuits with `mode: "self"` and returns without consulting `actor_owners`. This means: if an attacker's active actor ID happens to match the VPORT's actor ID (the resource's `owner_actor_id`), ownership is assumed without verification.

In practice, `requestActorId` comes from `identity.actorId` (engine-resolved). For a citizen's active actor to be a specific VPORT's actorId, they would need to have that VPORT in their actor links (which requires legitimate ownership). However, the security guarantee here depends entirely on the identity engine's integrity — if `requestActorId` is ever accepted from a client-provided parameter without engine resolution, this becomes a direct ownership bypass.

- **Risk:** The self-check bypasses the `actor_owners` table lookup. Any future refactor that allows `requestActorId` to be caller-supplied (rather than engine-resolved) would make this a direct VPORT ownership bypass.
- **Severity:** MEDIUM
- **Exploitability:** LOW (currently safe because `requestActorId` is engine-resolved; becomes HIGH if client-supplied)
- **Attack Preconditions:**
  - `requestActorId` must be accepted from client input instead of engine resolution
  - Attacker must know the target VPORT's actorId (public or derivable)
- **Blast Radius:** Single VPORT — any VPORT whose actorId matches the caller's supplied requestActorId
- **Identity Leak Type:** Ownership inference
- **Cache Trust Type:** Booking-sensitive
- **RLS Dependency:** UNVERIFIED — if the DB booking table has RLS that independently verifies VPORT ownership, this is defense-in-depth; if it trusts the app-layer check, this is the only gate
- **Why it matters:** The self-check is a latent vulnerability. The current safety depends on a runtime guarantee (identity engine resolution) that is not enforced at the function signature level. Adding a comment to document this dependency would be insufficient; the correct fix is to remove the shortcut entirely.
- **Recommended mitigation:** Remove the `requestActorId === targetActorId` early return. Always perform the full `actor_owners` lookup. The cost is one additional DB read. The benefit is that ownership is always verified by the authoritative table, regardless of how `requestActorId` arrives.
- **Rationale:** Defense-in-depth: ownership gates should not have self-bypass shortcuts. Each layer should enforce its own invariant independently.
- **Follow-up command:** DB (verify `actor_owners` RLS coverage)
- **CISSP Domain:**
  - Primary: Identity and Access Management
  - Secondary: Security Architecture and Engineering

---

## FINDING 6

**VENOM SECURITY FINDING**

- **Finding ID:** VENOM-2026-05-14-006
- **Location:** `apps/VCSM/src/app/providers/AuthProvider.jsx:37` + `apps/VCSM/src/app/providers/AuthProvider.jsx:57`
- **Application Scope:** VCSM
- **Platform Surface:** PWA
- **Trust Boundary:** Authenticated Citizen
- **Boundary Violated:** DAL isolation — provider reads Supabase session directly
- **Contract Violated:** Security Architecture and Engineering — DAL bypass

**Current behavior:**

`AuthProvider` calls Supabase auth APIs directly, bypassing the DAL layer:

```javascript
// AuthProvider.jsx:37
const { data, error } = await supabase.auth.getSession()

// AuthProvider.jsx:57
const { data: listener } = supabase.auth.onAuthStateChange((_evt, nextSession) => {
  ...
})
```

`authSession.read.dal.js` exists and exports `dalHydrateAuthSession()` and `dalGetAuthSession()`, but `AuthProvider` does not use them.

- **Risk:** Session reads in `AuthProvider` are not routed through the DAL. If session read behavior needs to change (e.g., adding token validation, logging, or refresh logic), there is now a split path: DAL and AuthProvider maintain separate Supabase session access patterns. A future security fix applied to the DAL will not automatically cover `AuthProvider`.
- **Severity:** MEDIUM
- **Exploitability:** LOW (current behavior is functionally correct; risk is future drift and maintenance gap)
- **Attack Preconditions:** Not directly exploitable — architectural risk
- **Blast Radius:** App-wide — AuthProvider is the root session provider for all authenticated routes
- **Identity Leak Type:** None currently
- **Cache Trust Type:** Identity-sensitive
- **RLS Dependency:** NONE
- **Why it matters:** Consistent DAL usage ensures a single code path for every Supabase call. Split session paths make it harder to audit, instrument, or harden session handling. When the session read behavior needs to change for security reasons, the developer must remember to update both paths.
- **Recommended mitigation:** Route `AuthProvider`'s `getSession()` call through `dalHydrateAuthSession()` from `authSession.read.dal.js`. For `onAuthStateChange`, consider a DAL wrapper that handles the subscription lifecycle.
- **Rationale:** Single source of truth for auth session reads. Security-relevant audit trails should cover all paths.
- **Follow-up command:** SENTRY (boundary enforcement)
- **CISSP Domain:**
  - Primary: Security Architecture and Engineering
  - Secondary: Software Development Security

---

## FINDING 7

**VENOM SECURITY FINDING**

- **Finding ID:** VENOM-2026-05-14-007
- **Location:** Route chain: `ProtectedRoute` → `ProfileGatedOutlet` → `RootLayout` → `CentralFeedScreen` (see runtime map)
- **Application Scope:** VCSM
- **Platform Surface:** PWA
- **Trust Boundary:** Authenticated Citizen
- **Boundary Violated:** Identity gate missing — screens render with `identity=null`
- **Contract Violated:** Security Architecture and Engineering

**Current behavior:**

The T6→T35 identity gap (200–1500ms, up to 2000ms on self-heal) allows authenticated screens to render with `identity=null` and `identity.loading=true`. No layer in the route chain — `ProtectedRoute`, `ProfileGatedOutlet`, `CompleteProfileGate`, or `RootLayout` — checks `identity.loading` before rendering. `CentralFeedScreen` is implicitly safe only because `useCentralFeed` has `enabled: Boolean(actorId)` which disables the feed query when `actorId=null`.

Full gap analysis: see `restoredMapvcsm.auth-login.runtime-map.md` — T6→T35 Identity Gap section.

- **Risk:** Any screen added to `protectedAppRoutes` that does not include `enabled: Boolean(actorId)` on its primary query, or that renders actor-scoped data without a null identity guard, will expose actor-null state to the authenticated user during the gap window. The gap is also longer on the self-heal path (first-time users, bootstrap required), extending the exposure window significantly.
- **Severity:** MEDIUM
- **Exploitability:** LOW (current screens survive implicitly; risk is future screens missing the guard pattern)
- **Attack Preconditions:** Authenticated session required. No explicit attack — this is a defense-in-depth gap.
- **Blast Radius:** Feed-wide — all screens under `RootLayout` are exposed to the null identity gap
- **Identity Leak Type:** None — risk is unauthorized render with null identity, not leakage
- **Cache Trust Type:** Identity-sensitive
- **RLS Dependency:** NONE — app-layer rendering concern
- **Why it matters:** Implicit safety is fragile. Adding a new screen without the `enabled: Boolean(actorId)` pattern re-exposes the gap. The correct fix is an explicit guard in `RootLayout` so all screens are protected by default.
- **Recommended mitigation:** Add `if (identityLoading) return <AppLoadingScreen />` to `RootLayout` before rendering chrome. Mandate `enabled: Boolean(actorId)` as a documented pattern for all hooks consuming actorId. Add to CLAUDE.md as an explicit rule.
- **Rationale:** Default safe behavior should not require per-screen discipline. A single layout-level guard covers all current and future screens.
- **Follow-up command:** LOKI (runtime trace — verify TopNav and BottomNav handle `identity=null` safely)
- **CISSP Domain:**
  - Primary: Security Architecture and Engineering
  - Secondary: Software Development Security

---

## FINDING 8

**VENOM SECURITY FINDING**

- **Finding ID:** VENOM-2026-05-14-008
- **Location:** `apps/VCSM/src/services/supabase/supabaseClient.js:37–38`
- **Application Scope:** VCSM
- **Platform Surface:** PWA
- **Trust Boundary:** Public Visitor (window object accessible to any browser script)
- **Boundary Violated:** Internal service client exposed to global window scope
- **Contract Violated:** Security Architecture and Engineering

**Current behavior:**

```javascript
// supabaseClient.js:37–38
if (typeof window !== 'undefined' && import.meta.env.DEV && import.meta.env.VITE_EXPOSE_SB_CLIENT === '1') {
  window.__sb = client
}
```

When both `import.meta.env.DEV` and `VITE_EXPOSE_SB_CLIENT=1` are true, the full Supabase JS client instance is attached to `window.__sb`. This exposes:
- The authenticated session (accessible via `window.__sb.auth.getSession()`)
- All query methods (`window.__sb.from('any_table').select('*')`)
- All RPC calls (`window.__sb.rpc('any_function')`)

Access is limited only by server-side RLS and function security, not by client-side controls once the client is on `window`.

- **Risk:** If a staging or pre-prod environment has `VITE_EXPOSE_SB_CLIENT=1` in its `.env` file and is accessible to external users, the full Supabase client is exposed. Any browser extension, injected script, or XSS payload running in the page context can access `window.__sb` and make arbitrary authenticated API calls as the current user.
- **Severity:** MEDIUM (requires DEV build flag — but DEV flag can be present in non-production environments that are still externally accessible)
- **Exploitability:** MEDIUM (requires the environment to have both flags set and be accessible)
- **Attack Preconditions:**
  - `VITE_EXPOSE_SB_CLIENT=1` set in environment
  - Application running in DEV mode
  - XSS payload or malicious browser extension present
- **Blast Radius:** Multi-actor — any Supabase operation available to the authenticated user
- **Identity Leak Type:** Internal UUID exposure, actor correlation
- **Cache Trust Type:** Identity-sensitive
- **RLS Dependency:** REQUIRED — if this surface is live, RLS is the only remaining control
- **Why it matters:** A full Supabase client on `window` is a high-value target for XSS payloads. Even with RLS, the attacker now has an authenticated, typed ORM-like interface to all tables accessible to the user.
- **Recommended mitigation:** Remove `window.__sb` entirely. If debugging requires Supabase access during development, use browser devtools with network inspection or a dedicated test harness. Never expose the client object on `window` — even in DEV.
- **Rationale:** No debugging benefit justifies exposing an authenticated database client on the global window object.
- **Follow-up command:** LOGAN (document removal in security guidelines)
- **CISSP Domain:**
  - Primary: Communication and Network Security
  - Secondary: Security Architecture and Engineering

---

## FINDING 9

**VENOM SECURITY FINDING**

- **Finding ID:** VENOM-2026-05-14-009
- **Location:** `apps/VCSM/src/features/auth/controllers/onboarding.controller.js:104–127`
- **Application Scope:** VCSM
- **Platform Surface:** PWA
- **Trust Boundary:** Authenticated Citizen (during onboarding)
- **Boundary Violated:** Platform bootstrap silently skippable via optional chaining
- **Contract Violated:** Security Architecture and Engineering

**Current behavior:**

```javascript
// onboarding.controller.js:122–125
if (actor?.id) {
  await ensureVcsmPlatformBootstrap?.({    // optional chaining — null/undefined silently skips
    userId: user.id,
    actorId: actor.id,
  }).catch(() => {})                       // errors also silently suppressed
}
```

`ensureVcsmPlatformBootstrap` is an injected function parameter. If the caller passes `undefined`, `null`, or omits it, the platform bootstrap (which provisions `platform.user_app_access`, `user_app_accounts`, `user_app_preferences`, `user_app_state`, `user_app_actor_links`) is silently skipped. The `.catch(() => {})` additionally suppresses all errors from the bootstrap call.

- **Risk:** A user can complete onboarding without platform bootstrap being called, leaving them in a partially provisioned state. The identity engine will fail to resolve their identity on next login (engine finds no `platform.user_app_access` row), triggering the self-heal path. If self-heal also fails, the user is stuck in a null-identity state post-login. More critically, the double `.catch(() => {})` means silent failure is indistinguishable from success — no error is surfaced.
- **Severity:** MEDIUM
- **Exploitability:** LOW (not directly exploitable — results in degraded user state, not privilege escalation)
- **Attack Preconditions:** Caller must omit `ensureVcsmPlatformBootstrap` or pass null
- **Blast Radius:** Single actor — the onboarding user's platform state
- **Identity Leak Type:** None
- **Cache Trust Type:** Identity-sensitive
- **RLS Dependency:** NONE
- **Why it matters:** Silent failure of platform bootstrap leads to broken identity resolution — a user completes onboarding but cannot access the app. More importantly, `.catch(() => {})` on a security-adjacent provisioning call eliminates all error visibility. Security operations cannot detect when provisioning silently fails.
- **Recommended mitigation:**
  1. Remove `.catch(() => {})` — let bootstrap failures surface. Log the error at minimum.
  2. If the join flow legitimately skips bootstrap, make that explicit with a named parameter flag, not via optional chaining on an undefined function.
  3. Make `ensureVcsmPlatformBootstrap` a required parameter with a type check at function entry.
- **Rationale:** Silent failure of security-adjacent provisioning is operationally dangerous. Errors should always be visible.
- **Follow-up command:** LOKI (trace onboarding bootstrap failure path in production), LOGAN (document expected parameter contract)
- **CISSP Domain:**
  - Primary: Security Operations
  - Secondary: Software Development Security

---

## FINDING 10

**VENOM SECURITY FINDING**

- **Finding ID:** VENOM-2026-05-14-010
- **Location:** `apps/VCSM/src/features/auth/controllers/authCallback.controller.js:13–14, 49`
- **Application Scope:** VCSM
- **Platform Surface:** PWA (email verification callback)
- **Trust Boundary:** Public Visitor (unauthenticated — callback link from email)
- **Boundary Violated:** Attacker-controllable URL parameter influences behavior
- **Contract Violated:** None — current handling is correct; this is a documentation/awareness finding

**Current behavior:**

```javascript
// authCallback.controller.js:13–14
hashType: hash.get('type')   // attacker-controllable URL hash param

// line 49 — hashType check
if (hashType === 'recovery') {
  const recoverySession = await dalGetAuthSession()  // verifies session exists before redirect
  if (recoverySession) {
    return { ok: true, session: recoverySession, isRecovery: true, error: null }
  }
  // no session → return error
}
```

`hashType` comes from the URL hash and is attacker-controllable. The code comment explicitly acknowledges this. However, the handling is correct: `hashType === 'recovery'` only redirects to password reset if an actual session exists (`dalGetAuthSession()` returns non-null). Without a valid session, the recovery redirect is blocked.

`errorDescription` from URL params is also sanitized: in production, the fixed string `'Verification failed. Please try again or request a new link.'` is returned regardless of the actual error_description value.

- **Risk:** Currently handled correctly. The risk is future modification — if a developer removes the `recoverySession` check (treating it as unnecessary since the type is in the URL), the `hashType` parameter becomes an open redirect to `/reset-password` for any unauthenticated visitor.
- **Severity:** LOW (currently safe; documented for awareness)
- **Exploitability:** LOW (requires removing an existing check)
- **Attack Preconditions:** Future code change that removes the session verification gate
- **Blast Radius:** Single visitor (open redirect to reset-password page)
- **Identity Leak Type:** None
- **Cache Trust Type:** None
- **RLS Dependency:** NONE
- **Why it matters:** The code comments are good (`// hashType is attacker-controllable`) but the safety depends on the `recoverySession` check remaining in place. This is a fragile safety — a future refactor that "simplifies" the callback flow could remove it.
- **Recommended mitigation:** Preserve the comment and add a test asserting that `hashType=recovery` without a valid session does NOT redirect to `/reset-password`. This test would catch any future regression.
- **Rationale:** Security-critical guards should have regression tests. Comments alone are not sufficient to prevent future removal.
- **Follow-up command:** LOGAN (document the callback flow security contract)
- **CISSP Domain:**
  - Primary: Security Assessment and Testing
  - Secondary: Software Development Security

---

## FINDING 11 (IDENTITY SURFACE WARNING)

**IDENTITY SURFACE WARNING**

- **Location:** `apps/VCSM/src/features/auth/dal/profile.dal.js`, `apps/VCSM/src/features/auth/controllers/profile.controller.js`
- **Current identity surface:** `profileId` (= raw Supabase `auth.users.id`) used as DB primary key in `public.profiles`
- **Expected identity surface:** `actorId` — the canonical VCSM actor identity anchor
- **Risk:** Legacy `profileId` identity surface in a controller/DAL path that is called during every login. Creates a split identity model where some paths use `actorId` and others use `profileId`. Future developers copying this pattern will propagate the violation.
- **Suggested correction:** Resolve profile by actor: `vc.actors.profile_id` → `public.profiles.id`. The controller should accept `actorId`, resolve the associated `profile_id` from `vc.actors`, then operate on `public.profiles`.

---

## FINDING 12 (DEBUG LEAKAGE WARNING)

**DEBUG LEAKAGE WARNING**

- **Location:** `apps/VCSM/src/app/routes/lazyApp.jsx:3–4`, `apps/VCSM/src/app/routes/protected/app.routes.jsx:163`
- **Current behavior:** `DevDiagnosticsScreen` is conditionally loaded via `VITE_ENABLE_DEV_DIAGNOSTICS=1` env flag, and registered as a protected (auth-gated only) route. The diagnostics screen runs real DB write operations (block/unblock, UPSERT to `vc.actor_follows`, `vc.friend_ranks`).
- **Leak risk:** If `VITE_ENABLE_DEV_DIAGNOSTICS=1` is present in a deployed environment, any authenticated user can access `/dev/diagnostics` and run real DB mutations. The diagnostics suite also exposes block status and block graph reads for actor pairs.
- **Severity:** HIGH (see Finding 2 above for full detail)
- **Recommended mitigation:** Require admin/staff actor role before rendering. Block env flag from production deployment config.

---

# MITIGATION PLAN

| Finding | Risk | Layer to Fix | Priority | Owner | Follow-up Command |
|---|---|---|---|---|---|
| F1 — Booking source bypass | No auth for unknown source values | Controller | P0 | App | DB (verify RLS) |
| F2 — Dev diagnostics write access | Any authed user can run real DB writes | Router + Controller | P0 | App + Security | IRONMAN, DB |
| F3 — Client-controlled booking data | Duration/label/note trusted from caller | Controller | P0 | App | CARNAGE, DEADPOOL |
| F4 — Legacy profileId identity | Contract violation in login-critical path | Controller + DAL | P1 | App | CARNAGE |
| F5 — assertActorOwnsVport self-bypass | Ownership check short-circuits | Controller | P1 | App | DB |
| F6 — AuthProvider DAL bypass | Session reads split across DAL and provider | DAL + Provider | P1 | App | SENTRY |
| F7 — T6→T35 identity gap | No explicit identity gate in route chain | Router + RootLayout | P1 | App | LOKI |
| F8 — window.__sb exposure | Full Supabase client on window | Client bootstrap | P1 | App | LOGAN |
| F9 — Bootstrap silent failure | Platform provisioning silently skippable | Controller | P2 | App | LOKI |
| F10 — hashType attacker-controlled | Future regression risk if session check removed | Test Coverage | P2 | App | LOGAN |

---

# CISSP DOMAIN COVERAGE SUMMARY

| CISSP Domain | Findings | Notes |
|---|---:|---|
| Security and Risk Management | 0 | No governance/policy-level findings in this audit |
| Asset Security | 1 | F3 — client-controlled internalNote in booking row |
| Security Architecture and Engineering | 6 | F3, F5, F6, F7, F8, F9 — trust boundary and defense-in-depth gaps |
| Communication and Network Security | 1 | F8 — window.__sb exposure |
| Identity and Access Management | 4 | F1, F4, F5, F7 — authorization bypass and identity surface violations |
| Security Assessment and Testing | 1 | F10 — no regression test for hashType recovery gate |
| Security Operations | 2 | F2, F9 — dev tool write access and silent bootstrap failure |
| Software Development Security | 7 | F1, F2, F3, F4, F6, F9, F10 — coding and boundary pattern issues |

**Uncovered domains:**
- **Security and Risk Management** — No policy-level governance findings identified in this scope. Not applicable to the auth-login surface review.
- **Asset Security** — Partially covered (F3 covers internalNote data). Phone/email PII handling in booking rows not fully traced — recommend follow-up with CARNAGE on data classification.

---

# FINAL STATUS

**3 HIGH | 5 MEDIUM | 3 LOW**

**P0 blockers (should not ship to production in current state):**
- F1 — Booking source bypass (auth gap for unknown source values)
- F2 — Dev diagnostics accessible to all authenticated users with write capability
- F3 — Client-controlled booking duration and internal note

**P1 hardening (should fix before next release cycle):**
- F4 — Legacy profileId identity in login-critical path
- F5 — assertActorOwnsVport self-check bypass
- F6 — AuthProvider DAL bypass
- F7 — T6→T35 identity gap (no explicit gate)
- F8 — window.__sb client on global window

**P2 maintenance:**
- F9 — Silent platform bootstrap failure
- F10 — Missing regression test for auth callback hashType gate
