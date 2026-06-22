# VENOM SECURITY REPORT — VCSM Full Deep Scan
**Date:** 2026-05-10
**Scope:** apps/VCSM — full surface scan
**Analyst:** VENOM (read-only)
**Status:** COMPLETE

---

## VENOM TARGET

| Field | Value |
|---|---|
| Feature / Route / Engine | VCSM — all features |
| Application Scope | VCSM |
| Reason for review | Full deep security scan requested by owner |
| Primary trust boundary | Auth session → actor identity → ownership gates → RLS |

---

## SECURITY SURFACE

| Field | Value |
|---|---|
| Entry points | ProtectedRoute → ProfileGatedOutlet → RootLayout + feature routes |
| Auth source | Supabase Auth via `useAuth()` + `AuthProvider` |
| Authorization layer | Controller-level ownership checks (client-side); database-level via RLS |
| Identity surface | `identity.actorId` + `identity.kind` via `useIdentity()` |
| Sensitive objects | Leads, bookings, team members, moderation reports, user profiles, private posts |

---

## TRUST BOUNDARY TRACE

```
Client URL  →  React Router  →  ProtectedRoute (auth + consent gate)
                             →  ProfileGatedOutlet (profile completion gate)
                             →  BlockedVportGuard (blocked-vport redirect only)
                             →  Feature Screen (isOwner = client-side identity comparison)
                             →  Hook (conditionally fetches based on isOwner)
                             →  Controller (business logic; no caller session binding)
                             →  DAL (raw Supabase queries; RLS is final DB authority)
```

**Key trust gap:** Owner verification at route and controller layers is entirely client-side.  
**DB layer** (RLS) is the final security backstop per architecture contract §8.

---

## FINDINGS INDEX

| # | Severity | Title | CISSP Primary |
|---|---|---|---|
| F-01 | CRITICAL | Authorization logic in DAL layer | Security Architecture and Engineering |
| F-02 | HIGH | Cross-domain privilege escalation path: moderation ← learning.platform_admins | Identity and Access Management |
| F-03 | HIGH | Inconsistent block controller patterns — settings block has no session assertion | Identity and Access Management |
| F-04 | HIGH | Dashboard route guard does not enforce ownership at route level | Identity and Access Management |
| F-05 | HIGH | Dashboard controllers accept callerActorId without session binding | Security Architecture and Engineering |
| F-06 | HIGH | Invite acceptance writes member_actor_id without caller ownership verification | Identity and Access Management |
| F-07 | MEDIUM | profileId exposed in identity debug event payload | Asset Security |
| F-08 | MEDIUM | getDebugPrivacyRowsController — profile_id compared to actorId (type mismatch) | Software Development Security |
| F-09 | MEDIUM | DebugPrivacyPanel renders profile_id and vport_id in browser table | Asset Security |
| F-10 | MEDIUM | Wanders creates fully isolated guest auth context — trust boundary gap | Security Architecture and Engineering |
| F-11 | MEDIUM | Multiple unguarded console.error/warn in production code | Security Operations |
| F-12 | MEDIUM | joinInvite RESOURCE_COLS returns profile_id in public read path | Asset Security |
| F-13 | LOW | useBlockActorAction — blockerActorId supplied by caller; protected only at controller | Software Development Security |
| F-14 | LOW | appendIOSProdDebugLog logs userId in ProtectedRoute | Security Operations |

---

## DETAILED FINDINGS

---

### F-01 — CRITICAL — Authorization Logic in DAL Layer

**VENOM SECURITY FINDING**

- **Location:** `apps/VCSM/src/features/moderation/dal/assertModerationAccess.dal.js`
- **Application Scope:** VCSM
- **CISSP Domain:**
  - Primary: Security Architecture and Engineering
  - Secondary: Identity and Access Management, Software Development Security

**Current behavior:**  
`assertModerationAccessDAL(actorId)` performs an authorization check inside a DAL file. It reads `learning.platform_admins` to verify whether the caller holds a moderation role, then throws a `FORBIDDEN` error if not authorized. This function is imported and called from `moderationActions.controller.js` at the top of every moderation write path.

**Risk:**  
The architecture contract (§2.1) explicitly prohibits DAL files from applying authorization logic:  
> *"DAL files must not apply authorization logic"*  
> *"DAL files must not infer actor intent, ownership, or permissions"*

Placing authorization in a DAL file:
1. Creates a mislearned pattern that future engineers may copy, placing security checks in the wrong layer.
2. Makes the check bypassable if any other code path calls the underlying moderation write DALs directly without going through `moderationActions.controller.js`.
3. Silently fails-open if the `42P01` (table does not exist) error path is hit — it returns `false` (denial), but the error path is fragile.
4. Makes authorization logic invisible from the controller layer, where it belongs per the contract.

**Severity:** CRITICAL  
**Why it matters:** Any direct call to moderation write DALs from outside `moderationActions.controller.js` bypasses the authorization check entirely. The architecture contract violation undermines defense-in-depth.

**Recommended mitigation:**  
Move `assertModerationAccessDAL` logic into a new `assertModerationAccess.controller.js` or inline into the `moderationActions.controller.js`. The controller is the correct layer for authorization decisions. DALs must remain dumb.

```
// Correct placement:
// moderationActions.controller.js
import { isModerationAuthorizedController } from './assertModerationAccess.controller'

export async function hideReportedObjectController({ moderatorActorId, reportId }) {
  await isModerationAuthorizedController(moderatorActorId)  // ← in controller
  ...
}
```

**Rationale:** Controllers own meaning, ownership, and permissions. DALs answer only "what does the database say?" — not "is this actor allowed?"

**Follow-up command:** CONTRACT REVIEWER, ARCHITECT

---

### F-02 — HIGH — Cross-Domain Privilege Escalation Path

**VENOM SECURITY FINDING**

- **Location:**  
  - `apps/VCSM/src/features/moderation/dal/assertModerationAccess.dal.js:27`  
  - `apps/VCSM/src/learning/controller/administration/adminAccess.controller.js:41`
- **Application Scope:** VCSM
- **CISSP Domain:**
  - Primary: Identity and Access Management
  - Secondary: Security Architecture and Engineering, Security and Risk Management

**Current behavior:**  
Both VCSM moderation access (`assertModerationAccess.dal.js`) and LMS admin access (`adminAccess.controller.js`) check the same database table: `learning.platform_admins`. An actor present in that table is considered a VCSM moderation operator AND a learning platform admin simultaneously.

**Risk:**  
If any code path allows a learning organization owner or admin to write to `learning.platform_admins`, they can self-escalate to VCSM platform moderator. The two privilege domains share a single gate with no documented separation of duties.

Additionally, moderation access for VCSM is gated on a table owned by the `learning` schema — a cross-schema dependency that is undocumented and architecturally fragile. A migration that changes `learning.platform_admins` could inadvertently break VCSM moderation access.

**Severity:** HIGH  
**Why it matters:** This is a latent privilege escalation path. If the learning admin assignment flow does not enforce strict RLS on who can INSERT into `learning.platform_admins`, a learning org owner could become a VCSM moderator without explicit authorization.

**Recommended mitigation:**  
1. Audit RLS on `learning.platform_admins` — confirm only a super-admin role can INSERT.
2. Create a dedicated `moderation.moderators` table (already noted as a TODO in the file comment at line 9-10) and decouple VCSM moderation access from the learning schema.
3. Document the shared gate explicitly if it must remain.

**Follow-up command:** DB, Carnage

---

### F-03 — HIGH — Inconsistent Block Controller Patterns — Settings Block Has No Session Assertion

**VENOM SECURITY FINDING**

- **Location:**  
  - `apps/VCSM/src/features/settings/privacy/controller/Blocks.controller.js`  
  - `apps/VCSM/src/features/block/controllers/blockActor.controller.js`
- **Application Scope:** VCSM
- **CISSP Domain:**
  - Primary: Identity and Access Management
  - Secondary: Software Development Security

**Current behavior:**  
There are two separate block controller surfaces in the codebase:

1. **`blockActor.controller.js`** (`blockActorController`, `unblockActorController`, `toggleBlockActorController`): Accepts a third `assertingActorId` parameter and enforces `assertingActorId === blockerActorId`. The session actor is explicitly verified to match the claimed blocker before any DB write.

2. **`Blocks.controller.js`** (`ctrlBlockActor`, `ctrlUnblockActor`): Does NOT accept or verify an `assertingActorId`. The `actorId` parameter is accepted without session binding. The entire security posture relies on the calling hook passing the session's actorId correctly.

**Risk:**  
The `ctrlBlockActor` / `ctrlUnblockActor` functions (used by the Settings privacy tab) accept any `actorId` as the blocker without verifying the caller session owns that actorId. If a component calls these controllers with a different actorId than the session identity, the block would be written under the wrong actor — with no controller-level rejection.

The inconsistency also creates a pattern confusion risk: future engineers may follow the weaker pattern.

**Severity:** HIGH  
**Why it matters:** Any future caller of `ctrlBlockActor` must independently ensure it passes the session actorId. There is no controller-level safety net.

**Recommended mitigation:**  
Add a `callerActorId` assertion parameter to `ctrlBlockActor` / `ctrlUnblockActor` matching the pattern established in `blockActorController`:

```js
if (!callerActorId || callerActorId !== actorId) {
  throw new Error('ctrlBlockActor: session actor does not match blocker')
}
```

**Follow-up command:** BUGSBUNNY, CONTRACT REVIEWER

---

### F-04 — HIGH — Dashboard Route Guard Does Not Enforce Ownership

**VENOM SECURITY FINDING**

- **Location:**  
  - `apps/VCSM/src/app/routes/protected/appRoutes.redirects.jsx` — `BlockedVportGuard`  
  - `apps/VCSM/src/app/routes/protected/app.routes.jsx:199-216`
- **Application Scope:** VCSM
- **CISSP Domain:**
  - Primary: Identity and Access Management
  - Secondary: Security Architecture and Engineering

**Current behavior:**  
All Vport dashboard routes (`/actor/:actorId/dashboard`, `/actor/:actorId/dashboard/leads`, `/actor/:actorId/dashboard/team`, etc.) are wrapped in `BlockedVportGuard`. This guard:
- Redirects if `loading` is true
- Redirects if `!identity`
- Redirects if `blockedVport` is true

It does **NOT** verify that the `actorId` in the URL matches `identity.actorId`.

Ownership enforcement happens **inside each individual screen** as a client-side `isOwner` check. Each sub-dashboard screen independently computes `isOwner = String(viewerActorId) === String(actorId)`.

**Risk:**  
The route guard layer provides no ownership gate. Any authenticated user can navigate to `/actor/{anyActorId}/dashboard/leads` and reach the screen rendering logic. While each screen's `isOwner` check prevents data from loading (hooks receive null/isOwner=false), the screens still render and the identity loading state is evaluated. More critically, this creates a defense-in-depth gap: if any one screen forgets its `isOwner` check, or if the isOwner computation has a bug, the data is exposed with no upstream gate catching it.

**Severity:** HIGH  
**Why it matters:** Security defense-in-depth requires multiple independent layers. Currently the route layer provides no ownership protection for ~15 sensitive dashboard routes. A single screen-level bug would directly expose business-sensitive data (leads, team, bookings, services, schedules).

**Recommended mitigation:**  
Add URL-to-identity ownership verification in `BlockedVportGuard` or create a dedicated `OwnerOnlyDashboardGuard`:

```js
export function OwnerOnlyDashboardGuard() {
  const { actorId } = useParams()
  const { identity, loading } = useIdentity()
  if (loading) return null
  if (!identity) return <Navigate to="/feed" replace />
  if (identity.actorId !== actorId) return <Navigate to="/feed" replace />
  return <Outlet />
}
```

**Follow-up command:** Wolverine

---

### F-05 — HIGH — Dashboard Controllers Accept callerActorId Without Session Binding

**VENOM SECURITY FINDING**

- **Location:**  
  - `apps/VCSM/src/features/dashboard/vport/controller/vportTeamAccess.controller.js`  
  - `apps/VCSM/src/features/dashboard/vport/hooks/useVportTeamAccess.js:35`
- **Application Scope:** VCSM
- **CISSP Domain:**
  - Primary: Security Architecture and Engineering
  - Secondary: Identity and Access Management

**Current behavior:**  
`getTeamAccessController(actorId)`, `addTeamMemberController(actorId, ...)`, `updateTeamMemberRoleController(actorId, ...)`, etc., accept only an `actorId` parameter with no accompanying `callerActorId` / `assertingActorId` to verify the caller session. Authorization is enforced by the hook (`useVportTeamAccess`):

```js
if (!actorId || !isOwner) { setMembers([]); return; }
```

If `isOwner` is false, the hook returns early and never calls the controller. But the controller itself has no awareness of the caller's session identity.

**Risk:**  
The security boundary is entirely at the hook/screen layer. Any code that calls `getTeamAccessController(anyActorId)` directly — bypassing the hook — will succeed at the controller level (assuming RLS allows the read). This violates defense-in-depth for a privileged operation (managing a business's team roster, which includes member actor IDs and roles).

**Severity:** HIGH  
**Why it matters:** The architecture contract states "Controllers must enforce ownership." Currently the team access controller does not receive the caller's identity, so it cannot enforce this.

**Recommended mitigation:**  
Introduce a `callerActorId` parameter to privileged dashboard controllers and assert before DB access:

```js
export async function addTeamMemberController(ownerActorId, { memberActorId, role, displayName }, callerActorId) {
  if (!callerActorId || callerActorId !== ownerActorId) {
    throw new Error('addTeamMemberController: session actor does not match owner')
  }
  ...
}
```

**Rationale:** Controllers are the sole layer that enforces meaning + permissions. The session actor identity must reach the controller.

**Follow-up command:** Wolverine, CONTRACT REVIEWER

---

### F-06 — HIGH — Invite Token Acceptance Writes member_actor_id Without Ownership Verification

**VENOM SECURITY FINDING**

- **Location:**  
  - `apps/VCSM/src/features/join/dal/joinInvite.dal.js:18-49`  
  - `apps/VCSM/src/features/join/controllers/joinBarbershopAccount.controller.js:161-163`
- **Application Scope:** VCSM
- **CISSP Domain:**
  - Primary: Identity and Access Management
  - Secondary: Software Development Security

**Current behavior:**  
`acceptJoinResourceDAL(resourceId, barberVportActorId)` updates a join resource row with any provided `barberVportActorId` as `member_actor_id`. Neither the DAL nor the calling controller (`useExistingBarberVportAndAccept`) verifies that the currently authenticated user owns `barberVportActorId`:

```js
export async function useExistingBarberVportAndAccept(token, vportActorId) {
  await acceptJoinResourceDAL(token, vportActorId);  // ← vportActorId unchecked
  return { barberVportActorId: vportActorId };
}
```

**Risk:**  
If an authenticated user can supply an arbitrary `vportActorId` to this flow, they could link an invite resource to a vport they do not own. The only defense is RLS on the `resources` table. If RLS enforces ownership at write time, this is mitigated; if not, any authenticated user can hijack a join invite to link it to another actor's vport.

Additionally, `fetchJoinResourceByIdDAL` returns the full resource row including `profile_id` and the related barbershop `actor_id` on any valid token lookup — no authentication required (the DAL uses the anon client).

**Severity:** HIGH  
**Why it matters:** Invite flows are classic targets for token misuse. A user who obtains a valid token could potentially link a resource to an actor they don't own.

**Recommended mitigation:**  
1. In `useExistingBarberVportAndAccept`, verify the user owns `vportActorId` via `actor_owners` before calling `acceptJoinResourceDAL`.
2. Add RLS on the `resources` table to enforce that `member_actor_id` can only be set to an actor the calling user owns.
3. Confirm via DB audit whether `fetchJoinResourceByIdDAL` requires authentication.

**Follow-up command:** DB, Carnage

---

### F-07 — MEDIUM — profileId Exposed in Identity Debug Event Payload

**VENOM SECURITY FINDING**

- **Location:** `apps/VCSM/src/state/identity/identity.controller.js:223`
- **Application Scope:** VCSM
- **CISSP Domain:**
  - Primary: Asset Security
  - Secondary: Security Operations

**Current behavior:**  
The `debugLoginEvent('HYDRATION_ACTOR_READ_SUCCESS', ...)` call includes:

```js
payload: { actorId: actorRow.id, kind: actorRow.kind, profileId: actorRow.profile_id }
```

`profileId` is a banned identity surface per the architecture contract (§1.3):  
> *"It must never expose: profileId, vportId"*

**Risk:**  
`profileId` propagates through the debug event system into whatever diagnostic tooling consumes `debugLoginEvent`. If that system persists or renders these events (e.g., `IdentityDebugger.jsx`), `profileId` is exposed in the browser's debug interface, violating the identity surface contract.

**Severity:** MEDIUM  
**Why it matters:** Even in dev tooling, propagating banned identity surfaces teaches incorrect patterns and risks accidental inclusion in error reporting or analytics pipelines.

**Recommended mitigation:**  
Remove `profileId` from the debug event payload. The `actorId` and `kind` are sufficient for diagnostic purposes:

```js
payload: { actorId: actorRow.id, kind: actorRow.kind }
```

**Follow-up command:** LOGAN

---

### F-08 — MEDIUM — getDebugPrivacyRowsController — profile_id Compared to actorId (Type Mismatch)

**VENOM SECURITY FINDING**

- **Location:** `apps/VCSM/src/features/feed/controllers/getDebugPrivacyRows.controller.js:58`
- **Application Scope:** VCSM
- **CISSP Domain:**
  - Primary: Software Development Security
  - Secondary: Asset Security

**Current behavior:**

```js
const isOwner = !isVport && actor?.profile_id === actorId;
```

This compares `actor.profile_id` (a profile UUID) against `actorId` (an actor UUID). These are different identity surfaces — the comparison is semantically incorrect. A `profile_id` is never equal to an `actorId` unless there is a coincidental UUID collision (essentially impossible in practice).

**Risk:**  
The `isOwner` flag in the debug panel will always be `false` for user actors, meaning the debug panel's ownership column is permanently inaccurate. While this is DEV-only, it:
1. Violates the identity surface contract (using `profile_id` in domain logic)
2. Produces misleading debug output that may cause engineers to draw incorrect conclusions about feed visibility

**Severity:** MEDIUM  
**Why it matters:** Incorrect ownership logic in debug tooling misleads engineers. The identity surface violation also creates a pattern that could be copied into production code.

**Recommended mitigation:**  
Replace the comparison with an actor-based ownership check:

```js
const isOwner = myActorIds.includes(postActor.actor_id)
```

**Follow-up command:** BUGSBUNNY

---

### F-09 — MEDIUM — DebugPrivacyPanel Renders profile_id and vport_id in Browser

**DEBUG LEAKAGE WARNING**

- **Location:** `apps/VCSM/src/features/feed/screens/DebugPrivacyPanel.jsx:48-49`
- **Application Scope:** VCSM
- **CISSP Domain:**
  - Primary: Asset Security
  - Secondary: Security Operations

**Current behavior:**  
The debug panel renders `profile_id` and `vport_id` as visible columns in a browser-rendered HTML table:

```jsx
<th>profile_id</th>
<th>vport_id</th>
...
<td>{r.profile_id ?? "—"}</td>
<td>{r.vport_id ?? "—"}</td>
```

These are banned identity surfaces per the architecture contract.

The panel IS correctly gated: `const isDev = import.meta.env.DEV` and `if (!isDev || !rows.length) return null`. It will not render in production builds.

**Leak risk:** DEV-only. No production exposure from the gate. However, the raw internal IDs are displayed and logged to the browser console for any developer working on feed visibility.

**Severity:** MEDIUM  
**Why it matters:** While gated, the panel actively trains developers to work with `profile_id` and `vport_id` as visible values. This erodes the contract discipline and increases the risk of these IDs appearing in production code or error reporting.

**Recommended mitigation:**  
Remove `profile_id` and `vport_id` columns from the debug panel. Replace with the actor-derived `kind` field if disambiguation is needed.

**Follow-up command:** LOGAN

---

### F-10 — MEDIUM — Wanders Creates Fully Isolated Guest Auth Context

**VENOM SECURITY FINDING**

- **Location:**  
  - `apps/VCSM/src/features/wanders/services/wandersSupabaseClient.js`  
  - `apps/VCSM/src/features/wanders/core/controllers/ensureGuestUser.controller.js`
- **Application Scope:** VCSM
- **CISSP Domain:**
  - Primary: Security Architecture and Engineering
  - Secondary: Communication and Network Security

**Current behavior:**  
Wanders uses a completely separate Supabase client with its own isolated auth storage (`sb-auth-wanders-${clientKey}`). The `clientKey` is derived from a device fingerprint (`getOrCreateWandersClientKey()`). This means:

1. Wanders can operate with an unauthenticated (guest) Supabase session, separate from the main VCSM auth session.
2. Wanders actions (creating cards, sending mailbox messages, writing events) may be attributed to an anonymous device identity rather than a VCSM actor identity.
3. The `ensureGuestUser.controller.js` manages guest user creation — these are real Supabase auth users with no VCSM actor link.

**Risk:**  
The trust boundary between VCSM authenticated sessions and Wanders anonymous sessions is not enforced at the controller level with a clear policy:
- Who can write to `wanders.cards`? Any guest device?
- Are guest-created Wanders actions associated with an authenticated user after login?
- Can an authenticated VCSM user's Wanders data be accessed via another device's guest key?

**Severity:** MEDIUM  
**Why it matters:** A separate auth context with device-keyed persistence creates an implicit anonymous write surface. If the Wanders RLS policies are not strictly written to scope writes to the device's guest session, cross-user data contamination or unauthorized write access is possible.

**Recommended mitigation:**  
1. Audit Wanders RLS policies to confirm they scope reads/writes to the correct session's guest user or actor.
2. Document the guest-to-actor handoff flow explicitly.
3. Confirm whether `WandersIntegrateActor` correctly migrates guest data to authenticated actor ownership upon login.

**Follow-up command:** DB, ARCHITECT

---

### F-11 — MEDIUM — Multiple Unguarded console.error/warn in Production Code

**DEBUG LEAKAGE WARNING**

- **Location (sample):**  
  - `apps/VCSM/src/features/settings/privacy/controller/Blocks.controller.js:30`  
  - `apps/VCSM/src/features/settings/profile/dal/profile.write.dal.js:53`  
  - `apps/VCSM/src/features/settings/privacy/hooks/usePendingFollowRequestActions.js:28,48`  
  - `apps/VCSM/src/features/post/postcard/controller/getPostMentionMap.controller.js:62`  
  - Multiple post hooks: `useCommentThread.js`, `usePostReactions.js`, `usePostDetailPost.js`
- **Application Scope:** VCSM
- **CISSP Domain:**
  - Primary: Security Operations
  - Secondary: Asset Security

**Current behavior:**  
Multiple production-accessible files contain `console.error` and `console.warn` calls without `import.meta.env.DEV` guards. Notable examples:

- `profile.write.dal.js:53`: `console.error('[updateProfile:user] DB ERROR', error)` — Supabase error objects may include SQL state codes, table names, constraint names
- `Blocks.controller.js:30`: `console.error('[Blocks.controller] resolveVportIdFromActor failed', error)` — error details including internal actor/vport resolution state
- Post hooks: multiple `console.error` on failed reactions, comments, roses — includes error payloads

**Leak risk:** Browser console is readable by users via DevTools. Supabase error objects often include `code`, `message`, `hint`, `details` fields with internal schema information.

**Severity:** MEDIUM  
**Why it matters:** Error details in the console can reveal internal schema structure (table names, column names, constraint names) useful for reconnaissance. Supabase error objects are more verbose than generic HTTP errors.

**Recommended mitigation:**  
Audit all `console.error`/`console.warn` calls in production code. Wrap with `if (import.meta.env.DEV)` or replace with structured error reporting. The memory system feedback rule already states: "No console.log; debug output must render on screen and be dev-only (never production)."

**Follow-up command:** LOGAN

---

### F-12 — MEDIUM — joinInvite RESOURCE_COLS Returns profile_id in Read Path

**VENOM SECURITY FINDING**

- **Location:** `apps/VCSM/src/features/join/dal/joinInvite.dal.js:3`
- **Application Scope:** VCSM
- **CISSP Domain:**
  - Primary: Asset Security
  - Secondary: Communication and Network Security

**Current behavior:**

```js
const RESOURCE_COLS = "id, name, resource_type, is_active, member_actor_id, meta, profile_id, barbershop:profiles!profile_id(id, name, actor_id)";
```

`fetchJoinResourceByIdDAL(resourceId)` returns `profile_id` and the joined barbershop profile row (including `actor_id`) for any valid token/resourceId lookup.

**Risk:**  
This is a public-accessible read path using the Supabase anon client (via `vportSchema`). Any caller with a valid join token receives the `profile_id` of the barbershop owner. `profile_id` is a banned identity surface per contract §1.3. The join token may be distributed broadly (QR codes, SMS, etc.), making this effectively a semi-public endpoint that exposes internal identifiers.

**Severity:** MEDIUM  
**Why it matters:** `profile_id` is an internal identifier that should never be exposed at public API surfaces. Token distribution means this data reaches beyond the immediate invite recipient.

**Recommended mitigation:**  
Remove `profile_id` from `RESOURCE_COLS`. The join flow only needs the barbershop name, `resource_type`, `is_active`, and `member_actor_id`. The `actor_id` from the barbershop join is sufficient for actor-based resolution without exposing the raw `profile_id`.

**Follow-up command:** DB

---

### F-13 — LOW — useBlockActorAction — blockerActorId Caller-Supplied

**VENOM SECURITY FINDING**

- **Location:** `apps/VCSM/src/features/block/hooks/useBlockActorAction.js:9-18`
- **Application Scope:** VCSM
- **CISSP Domain:**
  - Primary: Software Development Security

**Current behavior:**  
`useBlockActorAction` returns a callback that accepts `{ blockerActorId, blockedActorId }` as caller-supplied parameters. The session's `sessionActorId` is then passed as the third parameter to `blockActorController(blockerActorId, blockedActorId, sessionActorId)`.

The controller does verify `assertingActorId !== blockerActorId` throws. So the protection IS in place at the controller level — a component that passes a different `blockerActorId` than the session actor will receive a thrown error.

**Risk:**  
Low. The controller-level assertion is the correct defense. However, the hook's API design allows callers to supply `blockerActorId` rather than deriving it internally from the session identity. This is a weaker API contract than necessary.

**Severity:** LOW  
**Why it matters:** The hook's signature suggests `blockerActorId` is configurable by callers. A safer API would derive it from the session internally:

```js
const block = useCallback(async ({ blockedActorId }) => {
  return blockActorController(sessionActorId, blockedActorId, sessionActorId)
}, [sessionActorId])
```

**Recommended mitigation:**  
Redesign the hook to derive `blockerActorId` from the session identity internally rather than accepting it as a parameter. This removes the need for callers to reason about identity at the call site.

**Follow-up command:** None required (low risk, controller-protected)

---

### F-14 — LOW — appendIOSProdDebugLog Logs userId in ProtectedRoute

**DEBUG LEAKAGE WARNING**

- **Location:** `apps/VCSM/src/app/guards/ProtectedRoute.jsx:17-29`
- **Application Scope:** VCSM
- **CISSP Domain:**
  - Primary: Security Operations

**Current behavior:**  
`ProtectedRoute` calls `appendIOSProdDebugLog('protected_route_state', { userId: user?.id ?? null, ... })` on every auth state change.

`appendIOSProdDebugLog` is correctly production-gated:

```js
export function appendIOSProdDebugLog(event, payload = null) {
  if (IS_PROD) return null  // ← safe production guard
  ...
}
```

**Leak risk:** None in production. `IS_PROD` check prevents all execution.

**Severity:** LOW  
**Why it matters:** The `userId` is a Supabase auth user ID. While the production gate is correct, logging auth user IDs — even in dev — should be noted as a future risk if the gate is ever conditionally disabled.

**Recommended mitigation:**  
No immediate action needed. Monitor if `IS_PROD` condition is ever parameterized or made conditional. Consider replacing `userId` with a redacted prefix in debug logs.

**Follow-up command:** None

---

## SECURITY RISK SUMMARY

| Area | Finding |
|---|---|
| Missing authorization | Controllers do not bind callerActorId to session identity (F-03, F-05, F-06) |
| Identity misuse | profileId exposed in debug events and debug panel (F-07, F-08, F-09) |
| Sensitive data exposure | RESOURCE_COLS returns profile_id on semi-public token read (F-12) |
| Unsafe debug leakage | Unguarded console.error in production code with DB error payloads (F-11) |
| Policy assumption risks | Moderation access relies on RLS of learning.platform_admins without documented separation (F-02) |
| Dependency boundary risks | Authorization logic in DAL layer (F-01); Wanders isolated guest auth context (F-10) |

---

## MITIGATION PLAN SUMMARY

| Finding | Layer to Fix | Priority |
|---|---|---|
| F-01 | Move auth check from DAL → Controller | Immediate |
| F-02 | DB audit of learning.platform_admins RLS; create moderation.moderators table | Sprint |
| F-03 | Add assertingActorId to ctrlBlockActor/ctrlUnblockActor | Sprint |
| F-04 | Add OwnerOnlyDashboardGuard route wrapper | Sprint |
| F-05 | Add callerActorId assertion to dashboard controllers | Sprint |
| F-06 | Verify ownership before acceptJoinResourceDAL; audit resources RLS | Sprint |
| F-07 | Remove profileId from debug event payload | Low effort |
| F-08 | Fix isOwner comparison to use actorId instead of profile_id | Low effort |
| F-09 | Remove profile_id/vport_id columns from DebugPrivacyPanel | Low effort |
| F-10 | Audit Wanders RLS; document guest-to-actor handoff | Sprint |
| F-11 | Guard all console.error/warn with import.meta.env.DEV | Low effort sweep |
| F-12 | Remove profile_id from RESOURCE_COLS | Low effort |
| F-13 | Redesign useBlockActorAction to derive blockerActorId from session | Backlog |
| F-14 | No action required | — |

---

## CISSP DOMAIN COVERAGE SUMMARY

| CISSP Domain | Findings | Notes |
|---|---:|---|
| Security and Risk Management | 1 | F-02 (cross-domain privilege risk, undocumented dependency) |
| Asset Security | 4 | F-07, F-09, F-11, F-12 (profileId/vportId/DB error exposure) |
| Security Architecture and Engineering | 4 | F-01, F-05, F-10, F-04 (defense-in-depth gaps, DAL auth, guest context) |
| Communication and Network Security | 1 | F-10, F-12 (guest client isolation, semi-public token endpoint) |
| Identity and Access Management | 5 | F-02, F-03, F-04, F-05, F-06 (ownership gates, session binding) |
| Security Assessment and Testing | 0 | Not directly assessed — recommend RLS audit via DB command |
| Security Operations | 2 | F-11, F-14 (console logging, debug persistence) |
| Software Development Security | 3 | F-03, F-08, F-13 (unsafe patterns, type mismatches, API contracts) |

### CISSP Coverage Notes

- **Security Assessment and Testing** was not directly covered because VENOM cannot execute tests or audit RLS policies from client-side code. A dedicated `/DB` session should audit RLS on: `moderation.*`, `resources`, `learning.platform_admins`, and Wanders tables.
- All other domains received meaningful coverage.
- Highest concentration of findings: **Identity and Access Management (5)** — consistent with an actor-based system where client-side identity binding is the primary trust boundary.

---

## VENOM COMPLETION STATEMENT

VENOM has:
- Identified trust boundaries across auth, identity, routing, controller, and DAL layers
- Traced authorization enforcement from session → screen → hook → controller → DAL
- Inspected identity surfaces for contract compliance
- Surfaced 14 concrete risks across 4 severity levels
- Classified all findings against CISSP domains
- Remained fully read-only throughout
- Produced a complete, actionable, prioritized report

VENOM does not fix issues. VENOM reveals risk.

**Recommended next commands:**
- `/DB` — audit RLS on moderation, resources, learning.platform_admins, wanders tables
- `/Wolverine` — plan remediation for F-01, F-03, F-04, F-05 in a coordinated sprint
- `/Carnage` — plan migration to create `moderation.moderators` table (F-02)
