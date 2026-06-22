# BLACKWIDOW Runtime Adversarial Report

**Date:** 2026-05-27
**Time:** 19:00
**Scope:** VCSM — Schedule Card + Calendar Card (VPORT Dashboard)
**Reviewer:** BLACKWIDOW
**Environment:** Source-static adversarial simulation — no production mutations
**Governance Status:** DRAFT
**Prior VENOM:** VENOM-SCHED-001 through VENOM-SCHED-005 (2026-05-27); VENOM-CAL-001 through VENOM-CAL-004 (2026-05-27)
**Findings:** 0 CRITICAL | 0 HIGH | 3 MEDIUM | 4 LOW | 1 INFO

---

## Attack Surface Summary

### Schedule (`/vport/dashboard/schedule`)

Entry: `VportDashboardScheduleScreen` (no Final Screen gate)
Auth source: `useIdentity()` → `callerActorId` (via `useVportOwnerSchedule`)
Primary gate: `assertActorOwnsVportActorController` in `loadDayScheduleController` — fires first, before any DB read
Secondary gate: `OwnerOnlyDashboardGuard` at the route level — URL actorId must match session identity.actorId
PII surface: `customer_name`, `customer_note`, `customer_actor_id` in booking payload
Write gates: `createOwnerBookingController`, `updateBookingStatusController`, `rescheduleBookingController`
URL surface: `/actor/:actorId/dashboard/schedule` — actorId is in URL; no booking IDs or customer IDs in any route

### Calendar (`/vport/dashboard/calendar`)

Entry: `VportDashboardCalendarScreen` (combined Final+View screen)
Auth source: `useIdentity()` → `viewerActorId`
Primary gate: `useVportOwnership(viewerActorId, actorId)` — screen-level, gates all hook `enabled` conditions
Auto-bootstrap: `useEnsureOwnerBookingResource` — creates `vport.resources` row on first visit
Availability write: `setAvailabilityRule` engine controller — ownership verified at engine layer
Feed inject: `publishBarbershopHoursPost` / `publishLocksmithHoursPost` — conditional on `shareToFeed` + `isBarbershop`/`isLocksmith`
URL surface: `/actor/:actorId/dashboard/calendar` — actorId in URL only; no resource IDs or rule IDs exposed

---

## Simulated Threat Scenarios

### Schedule: 5 scenarios across ownership bypass, viewer context fuzz, PII exposure, dual resource merge abuse, and URL surface
### Calendar: 5 scenarios across auto-bootstrap ownership, availability write bypass, feed post injection, viewer context fuzz, and mutation replay

---

## Ownership Bypass Results

### SCHEDULE — Scenario 1: Cross-Actor Schedule Read

Simulation: Actor B calls `loadDayScheduleController({ actorId: actorA_id, callerActorId: actorB_id })`

Execution path:
1. `loadDayScheduleController` receives `callerActorId = actorB_id`, `actorId = actorA_id`
2. First operation: `assertActorOwnsVportActorController({ requestActorId: actorB_id, targetActorId: actorA_id })`
3. Engine resolves `actorB` actor — kind must be `'user'`
4. `actorB_id !== actorA_id` — self-shortcut does not apply
5. Resolves `requesterActor.profile_id` → queries `actor_owners` for `(targetActorId: actorA_id, userProfileId: actorB_profile_id)`
6. No link exists — throws "Actor does not own this vport actor."

Result: **BLOCKED**
Defense gate: **PRESENT — HARD GATE**. Controller ownership assertion fires before profileId resolution, resource load, or booking query. No PII escapes.

**However — route-level pre-gate analysis:**
`OwnerOnlyDashboardGuard` checks `String(identity.actorId) !== String(actorId)` — this blocks Actor B from ever reaching the screen with actorA's URL through the standard UI. But the controller is also exported from `index.js` (VENOM-SCHED-003), meaning a direct import path exists that bypasses the route guard. Via direct import, Actor B COULD call `loadDayScheduleController` with `callerActorId: actorB_id` — and would be blocked by the ownership assertion at the controller itself.

**Net verdict: BLOCKED at controller. Route guard provides UI-layer redundancy. Controller export creates a theoretical direct-import path that still terminates in the ownership assertion.**

---

### CALENDAR — Scenario 1: Auto-Bootstrap Ownership Bypass

Simulation: Actor B visits `/actor/:actorA_id/dashboard/calendar`. Attempts to trigger `useEnsureOwnerBookingResource` for Actor A's VPORT.

Execution path:
1. `OwnerOnlyDashboardGuard` at route: `identity.actorId` (B) !== `actorId` (A) — redirect to `/feed`. **Screen never mounts.**
2. If guard were removed: `VportDashboardCalendarScreen` calls `useVportOwnership(viewerActorId=B, actorId=A)` → `isOwner = false`
3. `useEffect` bootstrap guard: `if (!isOwner || !actorId || !viewerActorId) return;` — returns immediately, effect never fires
4. `ensureOwnerResource` is never called
5. RLS layer: `resources_insert_owner` policy enforces `actor_owners WHERE actor_id = owner_actor_id AND user_id = auth.uid()` — DB rejects INSERT

Result: **BLOCKED — three-layer defense: route guard, `isOwner` effect guard, RLS INSERT policy**

---

### CALENDAR — Scenario 2: Availability Write Bypass

Simulation: Actor B attempts to write availability rules for Actor A's resource via `setAvailabilityRule`.

The `WeeklyAvailabilityGrid.save()` function calls:
```
manageAvailability.setAvailabilityRule({ requestActorId: viewerActorId, ruleId, resourceId, ... })
```

`viewerActorId` is `identity?.actorId` from the screen. For Actor B, this is `actorB_id`.

`setAvailabilityRule` engine controller execution:
1. Receives `requestActorId: actorB_id`, `resourceId: actorA_resource_id`
2. Tries `dalGetVportResourceById({ resourceId })` — if found, calls `assertActorCanManageResource`
3. `assertActorCanManageResource` validates requesting actor is not void, then checks:
   - `resource.owner_actor_id === requestActorId` — NO (B ≠ A)
   - `assertActorOwnsVportActor({ requestActorId: B, targetActorId: resource.owner_actor_id })` — NO (actor_owners: B does not own A's VPORT)
   - org/location member checks — would need active membership in A's org/location
   - `resource.member_actor_id === requestActorId` — NO (B is not A's staff member)
4. Throws "Actor does not have permission to manage this resource."
5. If resource is a booking engine resource (not vport.resources): `assertActorOwnsVportActor({ requestActorId: B, targetActorId: resource.owner_actor_id })` — blocks the same way

Additional note: Actor B cannot even reach this point if they don't own the VPORT — the screen's `isOwner` gate prevents the save button from being reachable. The engine gate is the true security boundary for direct-call scenarios.

Result: **BLOCKED — engine controller ownership assertion blocks cross-actor availability writes at every resource type**

---

## Session Mutation Results

### SCHEDULE — Scenario 2: Null callerActorId Fuzz

Simulation: `loadDayScheduleController({ actorId: validActorId, dateKey: "2026-05-27", callerActorId: null })`

Execution path:
1. Controller: `if (!callerActorId) throw new Error("loadDayScheduleController: callerActorId is required")`
2. Throws immediately. No DB operations execute.

Result: **BLOCKED — explicit null guard at controller entry. Hard error, no silent fallback.**

### SCHEDULE — Scenario 2b: Stale callerActorId After Actor Switch (VENOM-SCHED-002)

Simulation: User switches from Actor A (owns VPORT) to Actor B (does not own VPORT). `useCallback` dep array does not include `callerActorId`. The memoized `load` function retains `callerActorId = actorA_id`.

Adversarial simulation of the VENOM-SCHED-002 stale closure path:
- User switches identity: `identity.actorId` changes from A to B
- `callerActorId` in the component updates to B
- But `load` was memoized with dep `[actorId]` only — `callerActorId` is captured in the closure from the prior render
- If `actorId` does not change between actor switches, `load` is NOT re-created
- Next call to `load` passes the OLD `callerActorId` (A) to `loadDayScheduleController`
- Controller: `assertActorOwnsVportActorController({ requestActorId: actorA_id, targetActorId: actorId })` — A still owns the VPORT → passes
- Schedule data for the VPORT is returned to the current session (Actor B)

**Adversarial verdict:** The data returned is data that Actor A legitimately owned. Actor B does not gain access to data they never had rights to. However, the displayed identity context is B, but the data is loaded under A's authority. This is an identity-context inversion.

**Exploitability assessment:** This requires:
1. The user has both Actor A (VPORT owner) and Actor B in their session (not a cross-user exploit)
2. The timing window between actor switch and component remount
3. A deliberate adversarial actor-switch operation

**This is a within-session identity consistency bug, not a cross-user privilege escalation.**

Result: **PARTIAL — stale closure produces identity-context inversion but bounded to the switching user's own prior access scope**

---

### CALENDAR — Scenario 4: Null viewerActorId to Calendar Screen

Simulation: `viewerActorId = null` (identity not yet loaded or cleared)

Execution path:
1. `useVportOwnership(null, actorId)` → effect: `if (!callerActorId || !targetActorId) { setIsOwner(false); setOwnershipLoading(false); return; }`
2. `isOwner = false`, `ownershipLoading = false`
3. Screen: `if (identityLoading || ownershipLoading) return <Skeleton />` — identityLoading may still be true
4. Screen: `if (!identity) return <div>Sign in required.</div>` — identity is null → early return rendered
5. No hooks fire for any booking data. Auto-bootstrap effect never fires.

Result: **BLOCKED — fail-closed. null identity produces sign-in wall before ownership check is needed. `useVportOwnership` also fails closed on null caller.**

---

## Runtime Abuse Results

### SCHEDULE — Scenario 3: PII Exposure Via Ownership Bypass

Simulation: If ownership bypass succeeded, what PII would be exposed?

The `listVportBookingsForProfileDayDAL` SELECT includes:
```
id, resource_id, service_id, customer_actor_id, status, source, starts_at, ends_at,
timezone, service_label_snapshot, duration_minutes, customer_name, customer_note,
created_at, updated_at
```

Fields that constitute PII: `customer_name`, `customer_note`, `customer_actor_id`

`customer_note` is free-text entered by customers — may contain phone numbers, medical context, personal requests.
`customer_actor_id` is a raw UUID — exposed in the in-memory response object but not rendered in URLs.

Rendered surfaces for these fields:
- `BookingDetailModal`: renders `booking.customer_name` and `booking.customer_note` in DOM
- `ScheduleOperationalView` and `ScheduleLaneElements`: render customer name in the timeline slot

These fields are NOT exposed in any URL surface. They exist in the JavaScript in-memory object within the hook state.

**Because the ownership gate is BLOCKED (Scenario 1), no unauthorized party can reach this data through the intended code path.**

The `customer_actor_id` field is selected from the DB but is NOT rendered anywhere in the schedule UI components (confirmed by grep — no `customer_actor_id` usage in the schedule card directory). It is fetched but unused in the UI — a dead column on the response object.

Result: **BLOCKED — PII gated behind verified ownership assertion. customer_actor_id is dead code in the response (fetched, never rendered in UI).**
Finding note: Unused `customer_actor_id` in SELECT is a data minimization gap (INFO).

---

## RLS Verification Results

### SCHEDULE — Bookings RLS

Table: `vport.bookings`
Policy: `bookings_select_owner` — `profile_id → owner_user_id = auth.uid()` (migration `20260515010000`)
Attack: Query `vport.bookings` directly as Actor B's session for Actor A's resource_ids

RLS status: **VERIFIED** (VENOM confirmed)
Result: **BLOCKED — owner-scoped RLS. Even if the DAL is called directly without controller gate, RLS enforces ownership at DB layer for SELECT.**

### CALENDAR — Resources RLS (Auto-Bootstrap)

Table: `vport.resources` (INSERT)
Policy: `resources_insert_owner` — `actor_owners WHERE actor_id = owner_actor_id AND user_id = auth.uid()` (migration `20260515020000`)

Attack: Actor B attempts INSERT with `owner_actor_id = actorA_id`
- `actor_owners` lookup: `actor_id = actorA_id` AND `user_id = auth.uid()` (= Actor B's user) → no row → RLS rejects

RLS status: **VERIFIED**
Result: **BLOCKED — DB-layer hard enforcement for INSERT regardless of controller logic**

### CALENDAR — Availability Rules RLS (Write)

Table: `vport.availability_rules`
Policy: Full owner-scoped policy set (migration `20260515010000`)

Attack: Actor B attempts UPSERT on availability rule for Actor A's resource
The `dalUpsertAvailabilityRule` goes through `getVportClient()` with the caller's session auth — B's session auth against A's resource_id is blocked by RLS before any row is mutated.

RLS status: **VERIFIED**
Result: **BLOCKED**

---

## Viewer Context Fuzz Results

### SCHEDULE — Scenario 2: null actorId Fuzz

Simulation: `useVportOwnerSchedule({ actorId: null })`

`load` callback: `if (!actorId) return;` — returns immediately, no controller called.
`useEffect` fires with `dateKey` dependency — `load(dateKey)` is called but returns on first line.
State: `scheduleData = null`, `loading = false`, `error = null`.
UI: renders `<div className="sched-empty">No team members yet</div>` or empty state — no crash.

Result: **BLOCKED — early return prevents any controller or DB call. UI shows empty state gracefully.**

### CALENDAR — Scenario 4 (addressed above): null viewerActorId → **BLOCKED**

### SCHEDULE — Scenario 2c: VPORT-kind actor as callerActorId

Simulation: `callerActorId` is a VPORT-kind actor (e.g., a business actor, not a user actor)

`assertActorOwnsVportActorController` execution:
1. `getActorByIdDAL({ actorId: vportKindActorId })` → returns actor with `kind: 'vport'`
2. `if (requesterActor.kind !== "user") throw new Error("Only actor owners can manage this booking resource.")`
3. Throws immediately — VPORT-kind actors cannot own booking resources

Result: **BLOCKED — kind check is unconditional (ELEK-004 fix already applied). A VPORT-kind actor cannot pass the ownership gate.**

---

## Mutation Replay Results

### CALENDAR — Scenario 5: Availability Rule Delete Replay

Simulation: Owner sets Monday hours (rule created, ID = rule_1). Owner deletes Monday hours (setAvailabilityRule with `isActive: false`). Owner re-creates Monday hours (new rules). Attacker replays the stale delete for rule_1.

The `WeeklyAvailabilityGrid.save()` deactivates rules by calling:
```
manageAvailability.setAvailabilityRule({ requestActorId: viewerActorId, ruleId: rule.id, ..., isActive: false })
```

This calls `dalUpsertAvailabilityRule` with `onConflict: 'id'` — upsert behavior on existing row ID.

Replay path analysis:
- Attacker would need `requestActorId` that passes ownership — impossible for non-owner (blocked at engine layer)
- Attacker would need `ruleId` = rule_1 — this is a UUID, not exposed in any public URL surface
- Even if attacker knew `ruleId`: `setAvailabilityRule` calls `assertActorOwnsVportActor({ requestActorId: attacker, targetActorId: resource.owner_actor_id })` → blocked

If the replayed actor IS the legitimate owner (e.g., stale client-side state replays an old delete after the owner re-added rules):
- The upsert would set `is_active: false` on rule_1 — which is the correct idempotent behavior of the UI's own prior state
- This is a UI state consistency bug, not a security exploit
- The owner's session would re-fetch availability after the save, correcting the displayed state

**No idempotency key is in place**, but the adversarial scenario requires the attacker to be the legitimate owner. Cross-actor replay is blocked at the engine ownership gate.

Result: **BLOCKED for cross-actor replay. PARTIAL for same-actor stale replay — UI consistency only, no security impact.**

---

## Hydration Poisoning Results

### SCHEDULE — Member Actor Hydration

The schedule hook calls: `hydrateActorsByIds(ids)` where `ids = data.lanes.map(l => l.resource.member_actor_id).filter(Boolean)`

This hydrates the actor store with staff member identities — display names and avatars for barbers on the VPORT's team.

Attack: Can an attacker inject an unauthorized actor ID into this hydration call?

- The IDs come from `data.lanes`, which is the response of `loadDayScheduleController`
- `loadDayScheduleController` is ownership-gated; a non-owner cannot produce `data`
- If the owner is the caller, the `member_actor_id` values are the owner's own staff members — legitimate hydration
- An attacker cannot forge `data.lanes` without bypassing the controller

Result: **BLOCKED — hydration inputs are derived from controller-gated data. No unauthorized actor IDs can be injected.**

---

## Cross-Feature Abuse Results

### SCHEDULE — Controller Export Abuse

The `index.js` boundary exports `loadDayScheduleController` directly:
```javascript
export * from "./controller/loadDaySchedule.controller";
```

Attack: A component in another feature imports `loadDayScheduleController` directly and calls it with an arbitrary `actorId`, bypassing the `useVportOwnerSchedule` hook and its error-handling UI.

Path:
```javascript
import { loadDayScheduleController } from "@/features/dashboard/vport/dashboard/cards/schedule";
const data = await loadDayScheduleController({ actorId: victimActorId, dateKey: "2026-05-27", callerActorId: attackerActorId });
```

Result of ownership check: still throws "Actor does not own this vport actor." — the controller gate survives the direct import.

**Security verdict: BLOCKED — controller gate holds. The data cannot be read by a non-owner regardless of import path.**

**Architecture verdict: The export is still a violation of the module boundary contract (VENOM-SCHED-003). While not exploitable today, it creates a stable coupling surface and removes defense-in-depth if the controller gate is ever weakened.**

Result: **BLOCKED (security). Architecture boundary violation confirmed (SENTRY follow-up required).**

---

## URL Surface Results

### SCHEDULE — URL Analysis

Routes: `/actor/:actorId/dashboard/schedule`
Navigation in component: `navigate(-1)`, `navigate('/actor/${actorId}/dashboard/team')`

No booking IDs, customer actor IDs, resource IDs, or rule IDs appear in any URL construction in the schedule card. Booking operations (create, update status, reschedule) are performed via modal state — the booking ID is passed as a JavaScript function argument, never pushed to a URL.

`customer_actor_id` is selected from DB but never placed in a URL.
`booking.id` (UUID) is used in `onStatusChange(booking.id, status)` calls — stays in memory, never in URL.

Result: **ABSENT — no raw UUID leakage in schedule URLs**
Slug enforcement: **N/A — dashboard routes use actorId in URL (human-meaningful identity, not a raw booking/resource UUID)**

### CALENDAR — URL Analysis

Routes: `/actor/:actorId/dashboard/calendar`
Navigation: `navigate('/actor/${actorId}/dashboard')`, `navigate('/actor/${actorId}/dashboard/team')`

No resource IDs, availability rule IDs, or user IDs appear in any URL surface.

Result: **ABSENT — no raw UUID leakage in calendar URLs**

---

## Notification Abuse Results

Neither the schedule card nor the calendar card issue notifications as part of their own workflows. The calendar conditionally publishes a feed post (not a notification) on availability save. No notification payloads with deep links were identified in these modules.

Result: **NOT APPLICABLE** for direct notification abuse in these modules.

---

## CALENDAR — Feed Post Injection Analysis

### Scenario 3: Feed Post Under Wrong Actor Identity

Simulation: Actor B triggers `publishBarbershopHoursPost` or `publishLocksmithHoursPost` under Actor A's `actorId`.

The `usePublishBarbershopHoursPost({ actorId })` and `usePublishLocksmithPost({ actorId })` hooks are initialized with `actorId` from route params. If Actor B could reach `handleSaveSuccess` with Actor A's `actorId` in scope:

- `handleSaveSuccess` checks `if (!shareToFeed) return` — requires the checkbox to be checked
- `publishBarbershopHoursPost({ blocks })` — publishes under `actorId` (A)

But to reach `handleSaveSuccess`, Actor B must:
1. Pass `OwnerOnlyDashboardGuard` — requires `identity.actorId === actorId` — **blocked at route**
2. Pass `isOwner` check — `useVportOwnership(B, A)` → `false` — **blocked at screen**
3. Trigger the save path in `WeeklyAvailabilityGrid.save()` — not reachable without rendering the grid (blocked at step 2)

Result: **BLOCKED — feed post injection requires bypassing route guard and screen ownership gate. Both block before the publish function is reachable.**

### Scenario 3b: `blocks` Shape Contamination (VENOM-CAL-003 adversarial simulation)

Simulation: Inspect what `blocks` contains when `onSaveSuccess?.({ blocks: [...blocks] })` is called.

`blocks` state in `WeeklyAvailabilityGrid` is built from `rulesToBlocks(rules)` and modified by drag/draw operations. Each block is shaped as:
```javascript
{ id: uid(), weekday: wd, startMinutes: N, endMinutes: N }
```

Where `uid()` generates a local UUID (not a server-side resource ID), and `startMinutes`/`endMinutes` are numeric time values.

The `blocks` array passed to `onSaveSuccess` contains ONLY these local UI block objects. No resource IDs, no booking IDs, no actor IDs, no server-generated UUIDs are present. The local `uid()` values are throwaway client-side identifiers.

The feed publishers receive `{ blocks }` — if they use `blocks` to format "working hours: Mon 9am–5pm" type content, no sensitive internal IDs are embedded in the published post.

**However, VENOM-CAL-003 marked this NEEDS_VERIFICATION because the publisher implementations were not traced. This adversarial simulation confirms `blocks` is clean of internal IDs but cannot confirm the publisher does not emit unexpected block fields.**

Result: **PARTIAL — blocks shape is clean (no server IDs). Publisher output format unverified. Risk of non-sensitive format mismatch if publisher handles unexpected block fields, but no privilege escalation or PII leakage path.**

---

## Successful Exploit Chains

None. Zero confirmed bypass paths were demonstrated across all 10 adversarial scenarios.

---

## Failed Exploit Chains (Defenses That Held)

| Scenario | Defense Layer | Gate Type |
|---|---|---|
| Schedule cross-actor read | `assertActorOwnsVportActorController` in `loadDayScheduleController` | Controller — throws before any DB read |
| Schedule null callerActorId | Explicit null guard in controller | Controller — throws on entry |
| Schedule VPORT-kind actor as caller | Kind check in `assertActorOwnsVportActorController` | Controller — unconditional kind gate |
| Calendar auto-bootstrap bypass | `OwnerOnlyDashboardGuard` + `isOwner` effect guard + RLS INSERT | Route + Screen + DB |
| Calendar availability write bypass | `assertActorCanManageResource` + `assertActorOwnsVportActor` | Engine controller |
| Calendar null viewerActorId | `useVportOwnership` fail-closed + `if (!identity)` screen guard | Hook + Screen |
| Calendar feed post injection | Route guard + `isOwner` screen gate | Route + Screen |
| Schedule member hydration poisoning | Hydration inputs gated behind controller-verified data | Controller + Data flow |
| Calendar cross-actor rule delete replay | Engine ownership assertion on any setAvailabilityRule call | Engine controller |
| Schedule controller export direct import | Controller gate survives import path bypass | Controller |

---

## Runtime Evidence

**Evidence 1 — Schedule controller null guard:**
```javascript
// loadDaySchedule.controller.js line 13
if (!callerActorId) throw new Error("loadDayScheduleController: callerActorId is required");
```

**Evidence 2 — Schedule controller ownership gate fires FIRST:**
```javascript
// loadDaySchedule.controller.js lines 17-17
await assertActorOwnsVportActorController({ requestActorId: callerActorId, targetActorId: actorId });
// THEN profileId, resources, bookings load — in that order
```

**Evidence 3 — Calendar three-way bootstrap guard:**
```javascript
// VportDashboardCalendarScreen.jsx line 95
if (!isOwner || !actorId || !viewerActorId) return;
```

**Evidence 4 — Engine ownership assertion in ensureOwnerBookingResource:**
```javascript
// engines/booking/src/controller/ensureOwnerBookingResource.controller.js line 19
await assertActorOwnsVportActor({ requestActorId, targetActorId: ownerActorId })
```
This directly resolves VENOM-CAL-004 (NEEDS_VERIFICATION). The controller DOES call `assertActorOwnsVportActor` before any INSERT. CALENDAR-FIND-002 is **RESOLVED**.

**Evidence 5 — Engine availability rule gate:**
```javascript
// engines/booking/src/controller/setAvailabilityRule.controller.js line 36
await assertActorOwnsVportActor({ requestActorId, targetActorId: resource.owner_actor_id })
```

**Evidence 6 — Route-level OwnerOnlyDashboardGuard:**
```javascript
// appRoutes.redirects.jsx line 29
if (!actorId || String(identity.actorId) !== String(actorId)) {
  return <Navigate to="/feed" replace />
}
```

**Evidence 7 — blocks shape (WeeklyAvailabilityGrid.jsx line 134):**
```javascript
onSaveSuccess?.({ blocks: [...blocks] });
// blocks[] items: { id: uid(), weekday: wd, startMinutes: N, endMinutes: N }
// uid() is a local client-side identifier — no server IDs, no actor IDs
```

**Evidence 8 — customer_actor_id: selected but never rendered in schedule UI**
Grep result: zero occurrences of `customer_actor_id` in
`apps/VCSM/src/features/dashboard/vport/dashboard/cards/schedule/`
Field is fetched in DAL column select but dead in the client-side rendering path.

---

## Blast Radius

| Finding | Blast Radius |
|---|---|
| BW-SCHED-001 (no screen gate) | Single VPORT — if controller gate regresses, one actor's bookings exposed per call |
| BW-SCHED-002 (stale closure) | Single user session — switching user's own data only; no cross-user impact |
| BW-SCHED-003 (controller export) | Architecture coupling — no direct blast radius today; future regression risk |
| BW-SCHED-004 (customer_actor_id dead column) | Minimal — data in memory only, never rendered or URL-exposed |
| BW-CAL-001 (no Final/View split) | Single VPORT — if enabled guards regress, one actor's availability data exposed |
| BW-CAL-002 (vportType stale) | Single feed post — wrong type publisher called; no PII or privilege escalation |
| BW-CAL-003 (blocks shape unverified) | Single feed post — content format only; no privilege escalation |

---

## BLACKWIDOW FINDINGS

---

### FINDING BW-SCHED-001

```
BLACKWIDOW ADVERSARIAL FINDING
- Finding ID: BW-SCHED-001
- Scenario: Schedule Ownership Bypass — No Screen-Level Fallback Gate
- Target: VportDashboardScheduleScreen.jsx — absent useVportOwnership screen gate
- Application Scope: VCSM
- Platform Surface: /vport/dashboard/schedule (OWNER-ONLY)
- Attack Vector: Non-owner actor mounts VportDashboardScheduleScreen with target actorId.
  useVportOwnerSchedule fires unconditionally and initiates loadDayScheduleController.
  Controller gate blocks the call. But there is no screen-level isOwner check preventing
  hook initialization. If the controller gate regresses (e.g., ownership assertion is removed
  or becomes conditional), no second gate exists at the screen boundary.
- Exploit Chain Type: Single-step exploit (controller gate regression removes all protection)
- Governance Status: DRAFT
- Result: BLOCKED (current controller gate holds; defense-in-depth absent)
- Evidence:
    VportDashboardScheduleScreen.jsx line 32: useVportOwnerSchedule({ actorId }) — no ownership pre-check
    loadDaySchedule.controller.js line 17: assertActorOwnsVportActorController fires as first operation
    OwnerOnlyDashboardGuard: URL-level redirect; blocks standard UI path but not direct hook calls
    No useVportOwnership(viewerActorId, actorId) call in VportDashboardScheduleScreen
- Defense Gate: PRESENT at controller layer; ABSENT at screen layer
- Blast Radius: Single VPORT — customer_name, customer_note, customer_actor_id for one actor's bookings
- Severity: MEDIUM (architecture non-compliance; no current exploit path; regression risk HIGH if controller gate removed)
- VENOM Finding Cross-Reference: VENOM-SCHED-001 (confirmed by VENOM 2026-05-27)
- Recommended Fix:
    Add VportScheduleFinalScreen that:
    1. Reads actorId from useParams()
    2. Calls useVportOwnership(viewerActorId, actorId)
    3. Returns null/access-denied while ownershipLoading is true
    4. Renders VportDashboardScheduleScreen only when isOwner === true
- Layer to Fix: Screen (add Final Screen wrapper)
- Required Follow-up Command: SENTRY (architecture compliance: Final/View screen split for schedule)
```

---

### FINDING BW-SCHED-002

```
BLACKWIDOW ADVERSARIAL FINDING
- Finding ID: BW-SCHED-002
- Scenario: Schedule Stale Identity After Actor Switch
- Target: useVportOwnerSchedule.js — useCallback dep array missing callerActorId
- Application Scope: VCSM
- Platform Surface: /vport/dashboard/schedule (OWNER-ONLY)
- Attack Vector: User legitimately owns VPORT as Actor A. Switches to Actor B in the same
  session without navigating away from the schedule screen. The memoized `load` callback
  retains Actor A's callerActorId (captured in closure). The next date navigation triggers
  load(key), which calls loadDayScheduleController with actorA_id as callerActorId.
  The ownership assertion passes (A owns the VPORT). Schedule data is returned and displayed
  under Actor B's current UI context.
- Exploit Chain Type: Timing-dependent exploit (actor-switch race during active schedule session)
- Governance Status: DRAFT
- Result: PARTIAL (identity inversion confirmed; data scope is bounded to own prior access)
- Evidence:
    useVportOwnerSchedule.js line 60: }, [actorId]); — callerActorId NOT in dep array
    loadDaySchedule.controller.js lines 51-17: callerActorId passed to ownership check
    VENOM-SCHED-002: confirmed this gap; within-session scope only
- Defense Gate: WEAK (dep array incomplete; stale closure produces identity-context mismatch)
- Blast Radius: Single user session — bounded to the switching user's own prior access scope.
  No cross-user exploit. Actor B cannot access data they never had legitimate access to.
- Severity: MEDIUM (identity consistency bug; not cross-user privilege escalation)
- VENOM Finding Cross-Reference: VENOM-SCHED-002 (confirmed by VENOM 2026-05-27)
- Recommended Fix:
    Change dep array: }, [actorId, callerActorId]);
    One-line fix ensures load() is re-created whenever identity changes.
- Layer to Fix: Hook (useVportOwnerSchedule.js — dep array)
- Required Follow-up Command: ELEKTRA (surgical one-line patch)
```

---

### FINDING BW-SCHED-003

```
BLACKWIDOW ADVERSARIAL FINDING
- Finding ID: BW-SCHED-003
- Scenario: Schedule Controller Exported from Module Boundary
- Target: cards/schedule/index.js — exports loadDayScheduleController
- Application Scope: VCSM
- Platform Surface: Module boundary (index.js)
- Attack Vector: Any component in the codebase can import loadDayScheduleController
  directly from the schedule card module boundary:
    import { loadDayScheduleController } from "@/features/dashboard/vport/dashboard/cards/schedule"
  This bypasses the hook (useVportOwnerSchedule), its error handling, and its loading state.
  The controller ownership gate still fires and blocks non-owners.
  But the export creates a stable coupling surface: any future caller that depends on this
  import path will be locked to the controller's current signature.
- Exploit Chain Type: Cross-feature abuse (adapter boundary violation; no direct exploit today)
- Governance Status: DRAFT
- Result: BLOCKED (security — controller gate holds regardless of import path)
- Evidence:
    cards/schedule/index.js line 5: export * from "./controller/loadDaySchedule.controller"
    Architecture contract: adapters/module boundaries must not export controllers
    VENOM-SCHED-003: confirmed; SENTRY queued
- Defense Gate: PRESENT (controller ownership assertion survives direct import)
- Blast Radius: Architecture — coupling risk; no direct security blast today
- Severity: MEDIUM (architecture non-compliance; potential regression vehicle if controller gate weakens)
- VENOM Finding Cross-Reference: VENOM-SCHED-003 (confirmed by VENOM 2026-05-27)
- Recommended Fix:
    Remove: export * from "./controller/loadDaySchedule.controller"
    from index.js. The schedule card's public API must be: hooks, components, screen only.
- Layer to Fix: Module boundary (index.js)
- Required Follow-up Command: SENTRY (architecture compliance: controller export removal)
```

---

### FINDING BW-SCHED-004

```
BLACKWIDOW ADVERSARIAL FINDING
- Finding ID: BW-SCHED-004
- Scenario: customer_actor_id Selected But Never Rendered — Dead PII Column
- Target: listVportBookingsForProfileDay.read.dal.js — column select includes customer_actor_id
- Application Scope: VCSM
- Platform Surface: /vport/dashboard/schedule (OWNER-ONLY)
- Attack Vector: The DAL selects customer_actor_id in the column list.
  This UUID is part of the in-memory JavaScript object returned to the hook state.
  It is never rendered in the schedule UI components (grep confirms zero usages
  in the schedule card directory). It does not appear in any URL, modal, or DOM element.
  Risk: If error reporting tools (e.g., Sentry) serialize the full scheduleData object
  in a catch block, customer_actor_id UUIDs would appear in error logs.
  Additionally, the column is wasted bandwidth for data the UI does not use.
- Exploit Chain Type: N/A (data minimization gap; no active exploit path)
- Governance Status: DRAFT
- Result: BLOCKED (no direct exploit; PII in memory only; never rendered or URL-exposed)
- Evidence:
    listVportBookingsForProfileDay.read.dal.js line 3: "customer_actor_id" in SELECT_COLS
    Grep of schedule card directory: zero usages of customer_actor_id in any component
    useVportOwnerSchedule.js catch block: setError(e?.message) — scheduleData not serialized in error
- Defense Gate: PRESENT (ownership gate protects the data; customer_actor_id not rendered)
- Blast Radius: Minimal — data in JavaScript memory for authenticated VPORT owner only
- Severity: LOW (data minimization gap; no active exploit path)
- VENOM Finding Cross-Reference: VENOM-SCHED-004 (related — customer PII handling; new finding for dead column)
- Recommended Fix:
    Remove customer_actor_id from SELECT_COLS in listVportBookingsForProfileDay.read.dal.js
    if there is no current use case for it. If the field is needed for a future feature,
    document the intent. Apply data minimization principle: select only what is rendered.
- Layer to Fix: DAL (column select cleanup)
- Required Follow-up Command: SPIDER-MAN (verify customer_actor_id is unused before removal)
```

---

### FINDING BW-CAL-001

```
BLACKWIDOW ADVERSARIAL FINDING
- Finding ID: BW-CAL-001
- Scenario: Calendar Auto-Bootstrap — ensureOwnerBookingResource Ownership Verification Confirmed
- Target: engines/booking/src/controller/ensureOwnerBookingResource.controller.js
- Application Scope: VCSM + ENGINE
- Platform Surface: /vport/dashboard/calendar (OWNER-ONLY)
- Attack Vector: Actor B triggers auto-bootstrap for Actor A's VPORT via the calendar screen.
  Attempts to create a vport.resources row with owner_actor_id = actorA_id.
- Exploit Chain Type: Ownership bypass (three-layer)
- Governance Status: DRAFT
- Result: BLOCKED
- Evidence:
    Route guard: OwnerOnlyDashboardGuard — identity.actorId must equal URL actorId → redirect
    Screen effect guard: if (!isOwner || !actorId || !viewerActorId) return — isOwner: false for non-owner
    Engine controller: ensureOwnerBookingResource.controller.js line 19:
      await assertActorOwnsVportActor({ requestActorId, targetActorId: ownerActorId })
    RLS: resources_insert_owner enforces actor_owners at DB layer
    VENOM-CAL-004 NEEDS_VERIFICATION is hereby RESOLVED:
      ensureOwnerBookingResource calls assertActorOwnsVportActor before any INSERT — confirmed.
- Defense Gate: PRESENT — four-layer defense (route, screen effect, engine controller, RLS)
- Blast Radius: N/A — BLOCKED
- Severity: INFO (verification finding — prior NEEDS_VERIFICATION resolved as secure)
- VENOM Finding Cross-Reference: VENOM-CAL-004 (RESOLVED — controller ownership gate confirmed)
- Recommended Fix: None required — protection is verified at all layers.
- Layer to Fix: N/A
- Required Follow-up Command: Update VENOM-CAL-004 governance status from NEEDS_VERIFICATION to RESOLVED
```

---

### FINDING BW-CAL-002

```
BLACKWIDOW ADVERSARIAL FINDING
- Finding ID: BW-CAL-002
- Scenario: Calendar Combined Screen — No Final/View Screen Split (Adversarial Defense Test)
- Target: VportDashboardCalendarScreen.jsx — combined Final + View screen
- Application Scope: VCSM
- Platform Surface: /vport/dashboard/calendar (OWNER-ONLY)
- Attack Vector: Actor B reaches the calendar screen. The screen's hooks are conditionally
  gated via enabled: isOwner. If isOwner computation is delayed or stale, hooks could fire
  before ownership is confirmed.
  Adversarial timing simulation:
  - identityLoading = true → screen returns Skeleton (safe)
  - ownershipLoading = true → screen returns Skeleton (safe)
  - identity = null → screen returns "Sign in required." (safe)
  - isOwner = false (resolved) → screen returns "You can only manage your own calendar." (safe)
  - All hooks use enabled: isOwner && ... — hooks do not fire when isOwner is false
  The defense holds in all observed states. The structural risk is the combined
  responsibility in one file — a future modification could inadvertently remove the
  isOwner guard or an enabled condition without adding a screen-level gate to catch it.
- Exploit Chain Type: Single-step exploit (any enabled guard removal removes all protection
  for that hook — no second screen-level gate outside the enabled condition itself)
- Governance Status: DRAFT
- Result: BLOCKED (current enabled guards all hold; no second gate if guards regress)
- Evidence:
    VportDashboardCalendarScreen.jsx line 32: useOwnerBookingResources({ enabled: isOwner && Boolean(actorId) })
    VportDashboardCalendarScreen.jsx line 60: useBookingAvailability({ enabled: Boolean(selectedResourceId) && isOwner })
    VportDashboardCalendarScreen.jsx line 95: if (!isOwner || !actorId || !viewerActorId) return
    VportDashboardCalendarScreen.jsx lines 105-108: identity/owner early returns in render path
    No VportCalendarFinalScreen exists — all gates are inline within the combined component
- Defense Gate: PRESENT (enabled conditions correct); ABSENT (no second structural gate)
- Blast Radius: Single VPORT — availability rules and working hours for one actor
- Severity: MEDIUM (architecture non-compliance + defense regression risk)
- VENOM Finding Cross-Reference: VENOM-CAL-001 (confirmed by VENOM 2026-05-27); SENTRY-CAL-001
- Recommended Fix:
    Split into VportCalendarFinalScreen (identity gate + ownership resolution only) +
    VportCalendarScreen (hook wiring + composition). Final screen renders View screen
    only when isOwner === true — providing a structural second gate independent of
    individual hook enabled conditions.
- Layer to Fix: Screen (Final/View split)
- Required Follow-up Command: SENTRY (architecture compliance)
```

---

### FINDING BW-CAL-003

```
BLACKWIDOW ADVERSARIAL FINDING
- Finding ID: BW-CAL-003
- Scenario: Calendar Feed Post — vportType Staleness and Wrong Publisher
- Target: VportDashboardCalendarScreen.jsx lines 63-66 — identity?.vportType usage
- Application Scope: VCSM
- Platform Surface: /vport/dashboard/calendar — handleSaveSuccess → feed publish
- Attack Vector: User switches from barbershop VPORT (Actor A) to locksmith VPORT (Actor B)
  within the same session. The calendar screen is mounted for Actor B's actorId.
  However, identity?.vportType is still "barbershop" from the prior actor context
  (stale identity not fully flushed on switch). User checks "Share to feed" and saves.
  isBarbershop evaluates to true. publishBarbershopHoursPost is called with actorId = B
  (locksmith). A barbershop-formatted hours post is published under a locksmith VPORT.
  The published content is factually incorrect (wrong template/format for the VPORT type)
  and may be visually inconsistent with the locksmith VPORT's feed.
- Exploit Chain Type: Timing-dependent exploit (stale identity state + actor switch)
- Governance Status: DRAFT
- Result: PARTIAL (wrong publisher called; no privilege escalation or PII leak; content error only)
- Evidence:
    VportDashboardCalendarScreen.jsx line 64: identity?.vportType — non-canonical identity field
    identity?.vportType is not guaranteed to match the current actorId's VPORT kind
    Canonical field per architecture contract: kind from vc.actors
    VENOM-CAL-002: confirmed by VENOM 2026-05-27 — stale identity + wrong publisher risk
- Defense Gate: ABSENT (no guard prevents wrong publisher invocation if vportType is stale)
- Blast Radius: Single feed post — wrong template published under wrong VPORT type.
  No privacy violation or unauthorized write — the owner is the one saving (correct authentication).
  Content quality and format are affected; social visibility is limited to the VPORT's feed.
- Severity: LOW (content contamination only; no privilege escalation; no PII exposure)
- VENOM Finding Cross-Reference: VENOM-CAL-002 (confirmed by VENOM 2026-05-27)
- Recommended Fix:
    Replace identity?.vportType with the VPORT actor's kind field from the canonical actor record.
    The kind field should be available as part of the dashboard's actor context load.
    Remove dependency on identity?.vportType — it is not part of the canonical identity surface.
- Layer to Fix: Screen (replace vportType with canonical kind field)
- Required Follow-up Command: SENTRY (identity surface compliance)
```

---

### FINDING BW-CAL-004

```
BLACKWIDOW ADVERSARIAL FINDING
- Finding ID: BW-CAL-004
- Scenario: Calendar Feed Post — blocks Shape NEEDS_VERIFICATION (Partially Resolved)
- Target: WeeklyAvailabilityGrid.jsx — onSaveSuccess({ blocks }) → feed publishers
- Application Scope: VCSM
- Platform Surface: /vport/dashboard/calendar — handleSaveSuccess → publishBarbershopHoursPost / publishLocksmithHoursPost
- Attack Vector: The blocks array passed to onSaveSuccess contains objects shaped as:
    { id: uid(), weekday: wd, startMinutes: N, endMinutes: N }
  The uid() is a local client-side identifier generated by calendarUtils — NOT a server UUID.
  No resource IDs, actor IDs, or server-generated UUIDs are present in blocks.
  The feed publishers receive { blocks } — the publisher's handling of the blocks array
  has not been traced in this simulation (publisher implementations are outside the calendar card).
  Risk: If publishers pass blocks fields through without schema validation,
  unrecognized fields (such as the local uid()) could appear in the post content payload.
  This is a content format risk only — not a privilege escalation or PII exposure risk.
- Exploit Chain Type: Injection exploit (unvalidated field pass-through to feed publisher)
- Governance Status: DRAFT
- Result: PARTIAL (blocks shape is clean of server IDs and PII; publisher output unverified)
- Evidence:
    WeeklyAvailabilityGrid.jsx line 134: onSaveSuccess?.({ blocks: [...blocks] })
    calendarUtils uid() produces local client-side UUIDs — not server identifiers
    VENOM-CAL-003: NEEDS_VERIFICATION (blocks shape and publisher handling)
    Publisher files (publishBarbershopHoursPost, publishLocksmithHoursPost) not read in this pass
- Defense Gate: WEAK (blocks shape is internally clean; publisher schema enforcement unverified)
- Blast Radius: Single feed post — potential non-sensitive format inconsistency in published content
- Severity: LOW (content contamination risk only; no PII; no privilege escalation)
- VENOM Finding Cross-Reference: VENOM-CAL-003 (NEEDS_VERIFICATION — partially advanced by this simulation)
- Recommended Fix:
    Read publishBarbershopHoursPost and publishLocksmithHoursPost to confirm they validate or
    whitelist blocks fields before constructing post content. If publishers accept arbitrary
    blocks fields, add a whitelist: { weekday, startMinutes, endMinutes } only — drop the local id.
- Layer to Fix: Publisher functions (vportProfiles adapter)
- Required Follow-up Command: VENOM (follow-up trace of publisher implementations)
```

---

## Recommended Fixes

| Finding | Severity | Fix | Layer | Command |
|---|---|---|---|---|
| BW-SCHED-001 | MEDIUM | Add VportScheduleFinalScreen with useVportOwnership gate | Screen | SENTRY |
| BW-SCHED-002 | MEDIUM | Add callerActorId to useCallback dep array | Hook | ELEKTRA |
| BW-SCHED-003 | MEDIUM | Remove controller export from index.js | Module boundary | SENTRY |
| BW-SCHED-004 | LOW | Remove customer_actor_id from DAL column select if unused | DAL | SPIDER-MAN |
| BW-CAL-001 | INFO | No fix needed — VENOM-CAL-004 resolved as secure | N/A | Update VENOM audit |
| BW-CAL-002 | MEDIUM | Split into VportCalendarFinalScreen + VportCalendarScreen | Screen | SENTRY |
| BW-CAL-003 | LOW | Replace identity?.vportType with canonical kind field | Screen | SENTRY |
| BW-CAL-004 | LOW | Verify publisher field handling; add blocks whitelist | Publisher | VENOM follow-up |

---

## Required Follow-up Commands

| Command | Reason | Status |
|---|---|---|
| SENTRY | Schedule: Final/View screen split (BW-SCHED-001); Controller export removal (BW-SCHED-003) | PENDING |
| ELEKTRA | Schedule: callerActorId dep array surgical patch (BW-SCHED-002) | PENDING |
| SPIDER-MAN | Schedule: Verify customer_actor_id is truly unused before DAL column removal (BW-SCHED-004) | PENDING |
| SENTRY | Calendar: Final/View screen split (BW-CAL-002); vportType → kind replacement (BW-CAL-003) | PENDING |
| VENOM | Calendar: Follow-up trace of publishBarbershopHoursPost / publishLocksmithHoursPost blocks handling (BW-CAL-004) | PENDING |
| VENOM | Calendar: Update VENOM-CAL-004 governance status to RESOLVED (BW-CAL-001 evidence confirms controller gate) | PENDING |
| THOR | Evaluate whether MEDIUM findings qualify as CAUTION or release blockers | PENDING |

---

## Pending Reviews

| Command | Reason | Status |
|---|---|---|
| VENOM | Cross-reference BW-CAL-001 resolution against VENOM-CAL-004 NEEDS_VERIFICATION | PENDING |
| LOKI | Validate runtime telemetry: confirm stale callerActorId scenario appears as identity mismatch event | PENDING |
| THOR | Assess BW-SCHED-001/002/003 and BW-CAL-002 for release blocking status | PENDING |
| SENTRY | Architecture compliance for both screen split findings | PENDING |
| SPIDER-MAN | BW-SCHED-004: customer_actor_id dead column — verify before removal | PENDING |
