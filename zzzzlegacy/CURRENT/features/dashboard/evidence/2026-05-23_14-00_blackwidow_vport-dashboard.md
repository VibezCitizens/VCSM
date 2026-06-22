# BLACKWIDOW Runtime Adversarial Report

**Date:** 2026-05-23
**Scope:** VCSM
**Reviewer:** BLACKWIDOW
**Environment:** apps/VCSM — repository source simulation (non-destructive)
**Governance Status:** DRAFT

---

## Attack Surface Summary

Target surface: VPORT Dashboard feature cluster

Reviewed files:
- `features/dashboard/vport/controller/` (14 controllers)
- `features/dashboard/vport/dal/read/` and `dal/write/` (18 DAL files)
- `features/dashboard/vport/hooks/useVportOwnership.js`
- `features/booking/controller/cancelBooking.controller.js`
- `features/booking/controller/assertActorOwnsVportActor.controller.js`
- `features/dashboard/vport/controller/updateVportBooking.controller.js`
- `features/dashboard/vport/controller/saveVportPublicDetailsByActorId.controller.js`
- `features/dashboard/vport/controller/vportLeads.controller.js`
- `features/dashboard/vport/controller/vportPublicBooking.controller.js`
- `features/dashboard/vport/controller/createOwnerBooking.controller.js`
- `features/dashboard/vport/controller/vportTeamAccess.controller.js`
- `features/auth/controllers/authCallback.controller.js`
- `features/actors/controllers/searchActors.controller.js`
- `features/actors/dal/searchActors.dal.js`
- `features/notifications/inbox/model/notification.model.js`
- `features/notifications/runtime/notificationRuntime.model.js`
- `app/routes/protected/app.routes.jsx` (via explorer — route shape confirmed)

---

## Simulated Threat Scenarios

| # | Scenario | Target | Result |
|---|---|---|---|
| S1 | Booking ownership replay — cross-actor cancel | cancelBooking.controller.js | BLOCKED |
| S2 | Booking state machine replay — stale state mutation | updateVportBooking.controller.js | BYPASSED (PARTIAL) |
| S3 | Public booking — customer actor attribution injection | createVportPublicBookingController | BYPASSED |
| S4 | Leads controller — ownership assertion bypass | vportLeads.controller.js | PARTIAL |
| S5 | Notification deep link — raw UUID exposure | cancelBooking, createVportPublicBooking | BYPASSED |
| S6 | Notification sender route — raw actor UUID fallback | notification.model.js | BYPASSED |
| S7 | Auth callback — hash type parameter injection | authCallback.controller.js | BLOCKED |
| S8 | Search — null viewerActorId enumeration | searchActors.dal.js | BLOCKED |
| S9 | isOwner hook — UI gate substituted for security gate | useVportOwnership.js | BLOCKED |
| S10 | Team access — cross-actor role manipulation | vportTeamAccess.controller.js | BLOCKED |
| S11 | Public details save — unauthorized mutation | saveVportPublicDetailsByActorId.controller.js | BLOCKED |
| S12 | Owner booking create — forged vportActorId | createOwnerBooking.controller.js | BLOCKED |

---

## Ownership Bypass Results

**S1 — cancelBooking.controller.js — Cross-actor cancel attempt**

Attack: replay a bookingId owned by Actor A while authenticated as Actor B (non-owner, non-customer).

Simulation:
- `requestActorId = B` (different actor, not customer)
- `bookingId` = booking belonging to Actor A's VPORT
- `resource.owner_actor_id` = A's VPORT actorId

Gate path:
```
cancelBookingController:
  isCustomer = false (B ≠ booking.customer_actor_id)
  → assertActorOwnsVportActorController({ requestActorId: B, targetActorId: resource.owner_actor_id })
     → getActorByIdDAL(B) → requesterActor must exist and not be void
     → requesterActor.kind must be 'user'
     → readActorOwnerLinkByActorAndUserProfileDAL({ targetActorId, userProfileId: B.profile_id })
     → THROWS if no owner link exists
```

Result: BLOCKED. Gate is PRESENT and strong.

---

**S10 — vportTeamAccess.controller.js — Cross-actor team manipulation**

Attack: callerActorId = B attempts to add/remove team members from Actor A's VPORT.

Every mutating function (`addTeamMemberController`, `updateTeamMemberRoleController`, `setTeamMemberStatusController`, `removeTeamMemberController`) calls `assertActorOwnsVportActorController` at entry before any profile resolution.

Result: BLOCKED. Gate is PRESENT on all paths.

---

**S11 — saveVportPublicDetailsByActorId — Cross-actor public detail write**

Attack: `requestActorId = B` attempts to overwrite Actor A's public VPORT details.

```
saveVportPublicDetailsByActorIdController(actorId=A, payload, { requestActorId: B })
  → assertActorOwnsVportActorController({ requestActorId: B, targetActorId: A })
  → THROWS (no owner link)
```

Result: BLOCKED. Gate is PRESENT and called before any DB read or write.

---

## Session Mutation Results

**S7 — Auth callback — hash type parameter injection (BW-LOGIN-002)**

Attack: inject `#type=recovery` into magic link hash to trigger recovery flow.

`authCallback.controller.js` explicitly excludes `hash.get('type')`:
```js
// hash.get('type') is intentionally not returned — it is attacker-controllable via
// the URL hash and must not be used as a recovery authority (BW-LOGIN-002).
```

Recovery is handled exclusively by Supabase's `PASSWORD_RECOVERY` auth event in AuthProvider. The callback controller cannot be tricked into recovery mode via URL injection.

Result: BLOCKED. Session binding: ENFORCED.

---

## Runtime Abuse Results

**S10 — Owner booking insert without ownership**

Attack: callerActorId = B calls `createOwnerBookingController` with `resourceId` belonging to Actor A.

```
createOwnerBookingController:
  → getVportResourceByIdDAL(resourceId) → resolves resource.owner_actor_id = A
  → assertActorOwnsVportActorController({ requestActorId: B, targetActorId: A })
  → THROWS — no owner link
```

Critically: vportActorId is resolved **server-side** from the resource — the caller cannot supply a spoofed vportActorId. Result: BLOCKED. Privilege gate: PRESENT.

---

## RLS Verification Results

RLS_VERIFICATION_ATTEMPT
- Table: `bookings` (via vportSchema)
- Attack vector: direct `updateVportBookingDAL({ bookingId, updates })` — no profile_id filter on write
- RLS status: ASSUMED (not verified in this session — Supabase policy not read)
- Result: PARTIAL — controller enforces ownership but DAL has no second-layer filter
- Severity: INFO (DAL-layer redundant RLS would harden; rely on controller today)

RLS_VERIFICATION_ATTEMPT
- Table: `bookings` (read via `getVportBookingByIdDAL`)
- Attack vector: ID enumeration — fetch any booking by integer ID without actor filter
- RLS status: ASSUMED
- Result: PARTIAL — if RLS is absent on read, any authenticated actor can read any booking row by ID
- Severity: MEDIUM (requires VENOM + DB verification to confirm)

---

## Viewer Context Fuzz Results

**S9 — useVportOwnership — null callerActorId injection**

```js
if (!callerActorId || !targetActorId) {
  setIsOwner(false);
  setOwnershipLoading(false);
  return;
}
```

Null callerActorId → `isOwner = false`. Hook fails closed.

The hook's own docblock states: *"isOwner is a UI convenience state only. All privileged mutations MUST independently verify ownership through controller-layer actor_owners checks."*

Result: BLOCKED. Context validation: ENFORCED.

**Deactivated actor → checkVportOwnershipController**

```js
if (callerActorId === targetActorId) {
  const actor = await getActorByIdDAL({ actorId: callerActorId });
  if (actor && actor.kind === "vport" && !actor.is_void) return true;
}
```

Deactivated/void vport actor → `is_void = true` → returns false. Self-ownership path guards against void actors.

For the `assertActorOwnsVportActorController` path:
```js
if (!requesterActor || requesterActor.is_void === true) {
  throw new Error("Requester actor not found.");
}
```

Void actors are rejected at the owner-link resolution step. Result: BLOCKED.

---

## Mutation Replay Results

**S2 — updateVportBooking.controller.js — stale state mutation (FINDING BW-VPD-002)**

Attack: Owner actor replays a status update on a booking already in a terminal state.

Simulation:
- Booking `status = "completed"` in DB
- Owner calls `updateBookingStatusController({ bookingId, status: "cancelled", callerActorId: owner })`
- Controller fetches booking (status = completed), confirms ownership, applies update

```js
const booking = await getVportBookingByIdDAL({ bookingId });
// NO GUARD: if (["completed", "cancelled"].includes(booking.status)) throw new Error(...)
const vportActorId = await resolveVportActorFromProfileId(booking.profile_id);
// ... ownership check passes ...
const updates = { status };
// ... applies mutation unconditionally
```

Terminal states that should be immutable (`completed`, `cancelled`, `no_show`) can all be overwritten. A completed booking can be re-opened as `confirmed`. A cancelled booking can be re-confirmed.

Result: BYPASSED. State check: ABSENT.

Attack: Owner replays `rescheduleBookingController` on a completed booking.

Same result — no `booking.status` guard. A completed booking can be rescheduled (new `starts_at`, `ends_at`, `resource_id` applied).

Result: BYPASSED. State check: ABSENT.

---

## Hydration Poisoning Results

Hydration store not directly accessed by VPORT dashboard controllers in this review scope. No poisoning surface identified at the controller layer. DEFER to VENOM for cache-layer inspection.

---

## Cross-Feature Abuse Results

**searchTeamCandidatesController — viewerActorId threading**

```js
export async function searchTeamCandidatesController({ query, viewerActorId }) {
  if (!query?.trim()) return [];
  const actors = await searchActorsAdapter({ query, limit: 12, viewerActorId });
  return actors.map(toTeamCandidateRow);
}
```

No ownership check required for search (read-only, visibility-gated by search_actor_directory). No team data is returned from this path — only public actor summaries used as candidates. Cross-feature boundary uses adapter correctly. Result: BLOCKED.

---

## URL Surface Results

**S5 — Notification deep links — raw UUID in linkPath (FINDING BW-VPD-001)**

`cancelBookingController` line 71:
```js
linkPath: isCustomer
    ? `/actor/${resource.owner_actor_id}/dashboard/booking-history`
    : `/profile/${resource?.owner_actor_id ?? ""}?tab=book`,
```

`createVportPublicBookingController` line 112:
```js
linkPath: vportActorId ? `/actor/${vportActorId}/dashboard/booking-history` : null,
```

Route definition confirmed: `/actor/:actorId/dashboard/booking-history` — `:actorId` is a raw UUID (Supabase `vc.actors.id`).

These UUIDs appear in:
1. `notification.* linkPath` field stored in DB
2. Deep links delivered to notification recipients
3. In-app notification cards rendered and clickable by recipients

Rule violated: *"Raw UUIDs must never appear in public-facing URLs — always use human-readable slugs."*

Actor A receives a notification from booking and navigates to `/actor/550e8400-e29b-41d4-a716-446655440000/dashboard/booking-history` — UUID is now browser-visible, stored in history, and could be correlated.

UUID exposure: PRESENT. Slug enforcement: MISSING. Result: BYPASSED.

---

**S6 — Notification sender route — UUID fallback (FINDING BW-VPD-005)**

`notification.model.js` line 107:
```js
route: actorId ? `/profile/${actorId}` : '#',
```

When a notification sender has no username, the sender route is `/profile/<uuid>`. This route is rendered as a clickable link in notification cards. For VPORT senders that have no `slug`, the UUID is exposed in the rendered UI navigation path.

UUID exposure: PRESENT (conditional — only when sender has no username/slug).
Slug enforcement: MISSING for anonymous-sender fallback.
Result: BYPASSED.

---

## Notification Abuse Results

**Notification objectId — raw booking ID**

`updateVportBooking.controller.js` line 70:
```js
objectId: String(updated.id),
```

`cancelBookingController` line 69:
```js
objectId: bookingId,
```

Both pass raw `booking.id` as objectId. Integer IDs are sequential and enumerable — exposing them in notification payloads allows actors to infer booking volume and enumerate booking IDs predictably.

Result: PARTIAL. This is below the slug rule threshold (integer IDs, not UUIDs) but still exposes business-sensitive data.

---

## Auth Callback Replay Results

Auth callback confirmed HARDENED:
- PKCE code flow: `dalExchangeCodeForSession(code)` — Supabase enforces single-use; replay returns null/error → blocked
- Hash type injection: excluded at parseCallbackParams — HARDENED
- Error descriptions: sanitized in production (fixed message) — HARDENED
- Recovery flow separation: handled exclusively by AuthProvider's `PASSWORD_RECOVERY` event — HARDENED

Result: BLOCKED on all tested vectors.

---

## Search Abuse Results

`searchActors.dal.js`:
```js
const filter = viewerActorId ? 'all' : 'public';
const { data, error } = await supabase
  .schema('identity')
  .rpc('search_actor_directory', {
    p_viewer_actor_id: viewerActorId,
    p_filter: filter,
    ...
  });
```

Null `viewerActorId` → `filter = 'public'` → only public-realm actors returned by the RPC. Deactivated/blocked actor visibility depends on the DB function's internal logic (not visible in app source — flag for DB audit). Result: BLOCKED at app layer. DEFER DB function to `/DB` review.

---

## Successful Exploit Chains

### Exploit Chain 1 — Booking State Replay (BW-VPD-002)

```
Actor (owner) → updateBookingStatusController(bookingId, "confirmed")
  → getVportBookingByIdDAL → booking (status=completed) fetched
  → NO state guard
  → assertActorOwnsVportActorController → PASSES (owner)
  → updateVportBookingDAL({ status: "confirmed" }) → APPLIED
  → Completed booking is now "confirmed" — state corrupted
```

Exploit Chain Type: Replay exploit (stale resource state)

### Exploit Chain 2 — Booking Attribution Injection (BW-VPD-010)

```
Actor A (authenticated) → createVportPublicBookingController({
  requestActorId: A,
  customerActorId: B,   ← forged / any actorId
  ...
})
  → requestActorId validation: A exists and is user-kind → PASSES
  → NO validation that customerActorId belongs to requestActorId
  → insertVportBookingDAL({ customer_actor_id: B, created_by_actor_id: A })
  → Booking stored attributed to Actor B
  → Actor B now has a booking in their history they did not create
```

Exploit Chain Type: Injection exploit (forged parameter accepted)

### Exploit Chain 3 — Notification UUID Exfiltration (BW-VPD-001)

```
Actor A books appointment at Actor B's VPORT
  → createVportPublicBookingController → publishVcsmNotificationBatch({
      linkPath: `/actor/${vportActorId}/dashboard/booking-history`   ← UUID
    })
  → Notification delivered to VPORT owner (and member)
  → Recipient clicks notification → browser navigates to /actor/UUID/dashboard/booking-history
  → UUID appears in browser URL bar, history, referrer headers
```

Exploit Chain Type: Injection exploit (raw identifier leaked in delivery channel)

---

## Failed Exploit Chains (Defenses That Held)

| Scenario | Attack | Defense |
|---|---|---|
| S1 | Cross-actor booking cancel | assertActorOwnsVportActorController via actor_owners — BLOCKED |
| S7 | Auth callback hash-type injection | Hash type excluded at parse — BLOCKED |
| S8 | Search null-viewer enumeration | filter='public' on null viewerActorId — BLOCKED |
| S9 | UI isOwner gate substitution | Hook documented as UI-only, fails closed — BLOCKED |
| S10 | Cross-actor team role manipulation | assertActorOwnsVportActorController on all team mutations — BLOCKED |
| S11 | Unauthorized public details write | Ownership check before first DB read — BLOCKED |
| S12 | Owner booking with spoofed vportActorId | vportActorId resolved server-side from resource — BLOCKED |

---

## Runtime Evidence

### Evidence BW-E-001
File: `apps/VCSM/src/features/dashboard/vport/controller/updateVportBooking.controller.js`
Lines 26–52: No `booking.status` guard between fetch and mutation. OWNER_STATUSES = ["cancelled", "completed", "no_show", "confirmed"] — all states writable from any prior state.

### Evidence BW-E-002
File: `apps/VCSM/src/features/booking/controller/cancelBooking.controller.js`
Lines 44–54: `updateBookingStatusDAL` called unconditionally after ownership check. No guard against already-cancelled or already-completed state.

### Evidence BW-E-003
File: `apps/VCSM/src/features/dashboard/vport/controller/vportPublicBooking.controller.js`
Lines 82–83:
```js
customer_actor_id: customerActorId ?? requestActorId,
created_by_actor_id: requestActorId,
```
No assertion that `customerActorId === requestActorId` when both are supplied.

### Evidence BW-E-004
File: `apps/VCSM/src/features/booking/controller/cancelBooking.controller.js`
Lines 70–72:
```js
linkPath: isCustomer
    ? `/actor/${resource.owner_actor_id}/dashboard/booking-history`
    : `/profile/${resource?.owner_actor_id ?? ""}?tab=book`,
```
`owner_actor_id` is a UUID from `vc.actors`.

### Evidence BW-E-005
File: `apps/VCSM/src/features/dashboard/vport/controller/vportPublicBooking.controller.js`
Line 112:
```js
linkPath: vportActorId ? `/actor/${vportActorId}/dashboard/booking-history` : null,
```
`vportActorId` is a UUID from `vc.actors`.

### Evidence BW-E-006
File: `apps/VCSM/src/features/notifications/inbox/model/notification.model.js`
Line 107:
```js
route: actorId ? `/profile/${actorId}` : '#',
```
UUID fallback for senders without a username.

### Evidence BW-E-007
File: `apps/VCSM/src/features/dashboard/vport/controller/vportLeads.controller.js`
Lines 11–16:
```js
function assertCallerOwns(callerActorId, ownerActorId, op) {
  if (!callerActorId) throw new Error(`${op}: callerActorId required`);
  if (String(callerActorId) !== String(ownerActorId)) {
    throw new Error(`${op}: caller does not own this vport`);
  }
}
```
Local string comparison only. No `actor_owners` table lookup. No void/deactivation check.

---

## Blast Radius

| Finding | Blast Radius |
|---|---|
| BW-VPD-001 (UUID in notification links) | All authenticated actors who receive booking notifications — every booking notification leaks VPORT owner actorId UUID |
| BW-VPD-002 (Booking state replay) | Any VPORT owner can corrupt booking state records — affects reporting, billing, and dispute resolution integrity |
| BW-VPD-003 (Weak leads assertion) | All VPORT leads operations — if acting-as pattern is bypassed, leads data exposed |
| BW-VPD-005 (Sender UUID in notification UI) | All notification recipients of VPORT-kind senders without slugs |
| BW-VPD-010 (Booking attribution injection) | All public VPORT booking flows — any authenticated actor can pollute any other actor's booking history |
| BW-VPD-006 (Booking ID in objectId) | All notification payloads — sequential integer IDs expose booking volume |

---

## BLACKWIDOW FINDINGS

---

### Finding BW-VPD-001

**Finding ID:** BW-VPD-001
**Scenario:** Notification deep link — raw UUID exposure
**Target:** `cancelBooking.controller.js` (line 71), `vportPublicBooking.controller.js` (line 112)
**Application Scope:** VCSM
**Platform Surface:** Notification delivery — linkPath field
**Attack Vector:** Authenticated actor receives booking notification; clicks deep link; raw VPORT owner UUID appears in browser URL bar, browser history, and referrer headers
**Exploit Chain Type:** Injection exploit (raw identifier leaked in delivery channel)
**Governance Status:** DRAFT
**Result:** BYPASSED
**Evidence:** BW-E-004, BW-E-005
**Defense Gate:** ABSENT
**Blast Radius:** All actors receiving booking notifications — every booking notification event leaks owner_actor_id (UUID)
**Severity:** HIGH
**VENOM Finding Cross-Reference:** None on file — escalate to VENOM for trust-boundary source analysis
**Recommended Fix:** Replace raw `owner_actor_id` / `vportActorId` in linkPaths with the VPORT's human-readable `slug`. Resolve slug server-side from the actor record before publishing the notification. Never embed raw UUIDs in linkPath, objectId, or any URL surface in notification payloads.
**Layer to Fix:** Controller (cancelBooking.controller.js, vportPublicBooking.controller.js)
**Required Follow-up Command:** VENOM (trust-boundary source), DB (confirm slug availability on actor record at notification time)

---

### Finding BW-VPD-002

**Finding ID:** BW-VPD-002
**Scenario:** Booking state machine — stale state mutation replay
**Target:** `updateVportBooking.controller.js` — `updateBookingStatusController`, `rescheduleBookingController`; `cancelBooking.controller.js`
**Application Scope:** VCSM
**Platform Surface:** Booking mutation — status update and reschedule
**Attack Vector:** VPORT owner calls `updateBookingStatusController(bookingId, "confirmed")` on a booking already in `completed` or `cancelled` state. No guard rejects the mutation. Terminal state is overwritten.
**Exploit Chain Type:** Replay exploit (stale resource state accepted without guard)
**Governance Status:** DRAFT
**Result:** BYPASSED
**Evidence:** BW-E-001, BW-E-002
**Defense Gate:** ABSENT — no `booking.status` check at controller entry
**Blast Radius:** All VPORT bookings — owners can reopen, re-cancel, or no-show any booking regardless of current state; corrupts booking history and any downstream billing/reporting
**Severity:** MEDIUM
**VENOM Finding Cross-Reference:** None on file
**Recommended Fix:** Add a terminal-state guard at the top of each mutation function:
```js
const TERMINAL_STATUSES = ["completed", "cancelled", "no_show"];
if (TERMINAL_STATUSES.includes(booking.status)) {
  throw new Error(`Cannot modify a booking in ${booking.status} state.`);
}
```
For `rescheduleBookingController`: additionally guard that `booking.status` is in `["pending", "confirmed"]` before allowing reschedule.
**Layer to Fix:** Controller
**Required Follow-up Command:** VENOM (confirm state machine definition), LOKI (runtime trace to verify state transitions in production)

---

### Finding BW-VPD-003

**Finding ID:** BW-VPD-003
**Scenario:** Leads controller — weak local ownership assertion
**Target:** `vportLeads.controller.js` — `assertCallerOwns` function (lines 11–16)
**Application Scope:** VCSM
**Platform Surface:** Leads read and mutation — all four lead operations
**Attack Vector:** `assertCallerOwns` performs only a string comparison `callerActorId !== ownerActorId`. Does not:
- Query `actor_owners` table for a verified ownership link
- Verify caller actor exists and is not void/deactivated
- Verify caller is user-kind (vs vport-kind)
This is inconsistent with the canonical `assertActorOwnsVportActorController` used by all other dashboard controllers.
**Exploit Chain Type:** Single-step exploit (weaker gate substituted for canonical gate)
**Governance Status:** DRAFT
**Result:** PARTIAL — the string comparison still blocks a non-owner in the acting-as pattern; but a deactivated actor or a vport-kind actor with the correct ID would pass without verification
**Evidence:** BW-E-007
**Defense Gate:** WEAK
**Blast Radius:** All VPORT leads data — list, count, mark-contacted, and delete operations
**Severity:** MEDIUM
**VENOM Finding Cross-Reference:** None on file
**Recommended Fix:** Replace `assertCallerOwns` with `assertActorOwnsVportActorController` (imported from booking adapter) to enforce consistent ownership semantics across all dashboard controllers. Remove the local `assertCallerOwns` function.
**Layer to Fix:** Controller
**Required Follow-up Command:** VENOM (confirm canonical ownership gate), SENTRY (architecture compliance — inconsistent gate pattern)

---

### Finding BW-VPD-005

**Finding ID:** BW-VPD-005
**Scenario:** Notification sender route — raw UUID fallback for unknown senders
**Target:** `notification.model.js` (line 107)
**Application Scope:** VCSM
**Platform Surface:** Notification UI — sender route rendered in notification cards
**Attack Vector:** When a notification sender has no `username` (e.g. VPORT without a slug, or system-sent notification), the sender route falls back to `/profile/${actorId}` — a raw UUID in the rendered URL.
**Exploit Chain Type:** Injection exploit (raw identifier in rendered UI navigation)
**Governance Status:** DRAFT
**Result:** BYPASSED
**Evidence:** BW-E-006
**Defense Gate:** ABSENT — no slug-or-null fallback
**Blast Radius:** All notification recipients where the sender lacks a username — primarily affects VPORT-kind senders that have not yet set a slug
**Severity:** MEDIUM
**VENOM Finding Cross-Reference:** Cross-reference BW-VPD-001 (same root pattern)
**Recommended Fix:** Fall back to `null` route (or a non-ID placeholder route like `'#'`) when no username/slug is available, instead of embedding the raw actorId UUID. Never render raw UUIDs as navigable URLs.
**Layer to Fix:** Model (notification.model.js)
**Required Follow-up Command:** VENOM

---

### Finding BW-VPD-010

**Finding ID:** BW-VPD-010
**Scenario:** Public booking — customer actor attribution injection
**Target:** `vportPublicBooking.controller.js` — `createVportPublicBookingController` (lines 58–83)
**Application Scope:** VCSM
**Platform Surface:** Public booking creation — customer attribution
**Attack Vector:**
```
createVportPublicBookingController({
  requestActorId: A,       ← authenticated actor
  customerActorId: B,      ← any actorId supplied by caller (no validation)
  ...
})
```
No assertion that `customerActorId === requestActorId` when both are provided. The booking is stored with `customer_actor_id = B` and `created_by_actor_id = A`. Actor B has no knowledge of this booking and did not consent to it appearing in their history.
**Exploit Chain Type:** Injection exploit (forged parameter accepted by controller)
**Governance Status:** DRAFT
**Result:** BYPASSED
**Evidence:** BW-E-003
**Defense Gate:** ABSENT — no cross-validation between requestActorId and customerActorId
**Blast Radius:** All public VPORT booking flows — authenticated actors can create bookings attributed to any other actor's actorId, polluting their booking history
**Severity:** HIGH
**VENOM Finding Cross-Reference:** None on file
**Recommended Fix:** If `customerActorId` is a legitimate separate concept (e.g. owner books on behalf of customer), move that override into `createOwnerBookingController` only — not the public flow. In the public booking flow, assert:
```js
if (customerActorId && requestActorId && String(customerActorId) !== String(requestActorId)) {
  throw new Error("Booking can only be created for the authenticated actor.");
}
```
**Layer to Fix:** Controller
**Required Follow-up Command:** VENOM (confirm intended customerActorId semantics), LOKI (verify this path is exercised in production)

---

### Finding BW-VPD-006 (INFO)

**Finding ID:** BW-VPD-006
**Scenario:** Notification objectId — sequential integer booking ID exposure
**Target:** `updateVportBooking.controller.js` (line 70), `cancelBooking.controller.js` (line 69)
**Application Scope:** VCSM
**Platform Surface:** Notification payload — objectId field
**Attack Vector:** Booking IDs stored as objectId are auto-increment integers. Recipients can infer booking volume by comparing objectId values across notifications.
**Exploit Chain Type:** Single-step exploit (enumerable identifier in payload)
**Governance Status:** DRAFT
**Result:** PARTIAL (information disclosure, not direct access breach)
**Evidence:** objectId passed as `String(booking.id)` or `String(updated.id)` — integer IDs
**Defense Gate:** ABSENT
**Blast Radius:** Low — recipients can only infer booking volume, not access booking data directly
**Severity:** LOW
**Recommended Fix:** Consider using UUIDs as booking IDs or encoding the objectId. Low priority relative to HIGH findings.
**Layer to Fix:** DAL (booking insert — switch to UUID primary key) or omit objectId from notification context
**Required Follow-up Command:** DB (schema change evaluation)

---

## Recommended Fixes

| Priority | Finding | Fix |
|---|---|---|
| 1 (CRITICAL path) | BW-VPD-010 | Guard customerActorId against requestActorId in public booking flow |
| 2 (HIGH) | BW-VPD-001 | Replace UUID actorIds in notification linkPaths with human-readable slugs |
| 3 (MEDIUM) | BW-VPD-002 | Add terminal-state guard to all booking mutation controllers |
| 4 (MEDIUM) | BW-VPD-003 | Replace assertCallerOwns() with assertActorOwnsVportActorController in vportLeads.controller.js |
| 5 (MEDIUM) | BW-VPD-005 | Null the route fallback when sender has no username/slug |
| 6 (LOW) | BW-VPD-006 | Evaluate switching booking IDs to UUID or omitting from objectId |

---

## Required Follow-up Commands

| Command | Reason | Status |
|---|---|---|
| VENOM | Cross-reference BW-VPD-001, BW-VPD-002, BW-VPD-003, BW-VPD-010 with trust-boundary source analysis | PENDING |
| LOKI | Validate runtime telemetry — confirm exploit paths are reachable in production traffic | PENDING |
| DB | Audit `search_actor_directory` RPC for deactivated/blocked actor visibility; confirm booking table RLS on read; evaluate UUID primary key for bookings | PENDING |
| THOR | Evaluate BW-VPD-010 (HIGH) and BW-VPD-001 (HIGH) as release blockers | PENDING |
| SENTRY | Architecture compliance check — inconsistent ownership gate pattern (BW-VPD-003) | PENDING |

---

## Pending Reviews

| Command | Reason | Status |
|---|---|---|
| VENOM | Trust-boundary source — HIGH findings need cross-reference | PENDING |
| LOKI | Runtime telemetry for exploit paths | PENDING |
| THOR | Release blocking status for CRITICAL/HIGH findings | PENDING |
| DB | RLS verification on bookings table + search_actor_directory | PENDING |
| SENTRY | Gate pattern consistency audit | PENDING |
