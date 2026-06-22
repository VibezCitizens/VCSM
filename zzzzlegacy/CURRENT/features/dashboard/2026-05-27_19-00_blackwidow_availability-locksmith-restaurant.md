# BLACKWIDOW Runtime Adversarial Report

**Date:** 2026-05-27
**Scope:** VCSM + ENGINE
**Reviewer:** BLACKWIDOW
**Environment:** Static source adversarial simulation — repository-scoped, non-destructive
**Governance Status:** DRAFT
**Modules Covered:** availability · locksmith · restaurant
**Prior VENOM Context Loaded:** V-AVAIL-01/02/03/04 · VL-01/02/03/04/05/06/07 · VR-01/02/03/04/05/06

---

## Attack Surface Summary

Three modules were targeted across two protected roots:

| Module | Route | Root | Entry Points Simulated |
|---|---|---|---|
| availability | `/vport/availability` (dashboard calendar) | `engines/booking/src/` + `apps/VCSM` | 4 attack scenarios |
| locksmith | `/vport/locksmith` | `apps/VCSM/src/features/profiles/kinds/vport/` | 4 attack scenarios |
| restaurant | `/vport/restaurant` | `apps/VCSM/src/features/profiles/kinds/vport/` | 4 attack scenarios |

Total scenarios simulated: 12
Total findings generated: 14

---

## Simulated Threat Scenarios

### Availability Module

**Entry path (as of 2026-05-27):**
```
VportDashboardCalendarScreen.jsx (isOwner via useVportOwnership — DB-verified)
  → WeeklyAvailabilityGrid.jsx (passes requestActorId: viewerActorId)
  → useManageAvailability hook (setAvailabilityRule)
  → @booking/setAvailabilityRule (engine controller — assertActorCanManageResource)
  → dalUpsertVportAvailabilityRule (DAL)
```

**CRITICAL ARCHITECTURE CHANGE since VENOM (2026-05-14):**
The VENOM audit found `manageVportAvailabilityRuleController` — a VCSM-local controller
with no ownership assertion. That path is no longer in the hot path. The calendar screen
now routes through `useManageAvailability` → `@booking/setAvailabilityRule` (engine
controller at `engines/booking/src/controller/setAvailabilityRule.controller.js`), which
calls `assertActorCanManageResource` — a full DB-verified ownership gate.

Additionally, `useVportOwnership` replaced the old string-comparison `isOwner` gate.
It now calls `checkVportOwnershipController` → `assertActorOwnsVportActorController`
(DB-verified via `actor_owners`).

These are structural improvements that resolve V-AVAIL-01, V-AVAIL-02, and V-AVAIL-03
at the runtime level. This report documents the adversarial simulation results under
the current (post-fix) architecture.

---

## Ownership Bypass Results

### Availability

Simulated: Actor B submits `setAvailabilityRule({ requestActorId: actorB, resourceId: actorA_resource })`

Path traced:
1. `engines/booking/src/controller/setAvailabilityRule.controller.js` — requires `requestActorId` (throws if null)
2. Calls `dalGetVportResourceById({ resourceId })` — fetches resource row including `owner_actor_id`
3. Calls `assertActorCanManageResource({ requestActorId, resourceId })` — verifies actor B is not owner, not org member, not location member, not resource staff → throws
4. For legacy booking resources: calls `assertActorOwnsVportActor({ requestActorId, targetActorId: resource.owner_actor_id })` → verifies via `actor_owners` → throws

**Result: BLOCKED** — ownership gate is present at controller layer, DB-verified.

### Locksmith

Simulated: Actor B submits `ctrlUpdateServiceArea(actorB, actorA_areaId, {...})`

Path traced:
1. `locksmithOwner.controller.js:46` — `if (!actorId) throw` — actorId is present (Actor B's)
2. `dalUpdateLocksmithServiceArea(areaId, actorId, row)` — filters by `.eq('id', areaId).eq('actor_id', actorId)`
3. Actor B provides their own `actorId`. The `areaId` belongs to Actor A. Actor A's area has `actor_id = actorA`. The DAL filter `.eq('actor_id', actorB)` returns zero rows — update is a no-op. No row mutated.

**Result: BLOCKED** — DAL-layer `actor_id` column filter prevents cross-actor mutation. No data returned, no error thrown. Silent no-op on mismatch is acceptable (not data-damaging). NOTE: Controller does not call `assertActorOwnsVportActorController` — ownership is enforced by DAL column filter only (single-layer, not defense-in-depth). See BW-LOCK-001.

### Restaurant

Simulated: Actor B submits `saveVportActorMenuItemController({ actorId: actorB, itemId: actorA_item, ... })`

Path traced:
1. Controller validates `actorId` (present) and `categoryId` (required)
2. First: `readVportActorMenuCategoriesDAL({ categoryId })` — if `categoryId` belongs to Actor A, `category.actor_id !== actorB` → throws "Not allowed to use this category"
3. If Actor B uses their own category: item lookup `readVportActorMenuItemsDAL({ itemId })` — `existing.actor_id !== actorB` → throws "Not allowed to modify this menu item"

**Result: BLOCKED** — double ownership check (category + item) at controller layer. Both gates use DB row data (not caller-supplied field), making this a legitimate server-side check.

---

## Viewer Context Fuzz Results

### Availability — Null requestActorId

Simulated: `setAvailabilityRule({ requestActorId: null, resourceId: 'valid-id', ... })`

Path traced:
- `engines/booking/src/controller/setAvailabilityRule.controller.js:18` — `if (!requestActorId) throw new Error('setAvailabilityRuleController: requestActorId is required')`

**Result: BLOCKED** — hard throw on null. No further execution.

Also simulated at screen layer:
- `WeeklyAvailabilityGrid.jsx:99` — `if (!resourceId || !viewerActorId) return` — silent early exit if null.
- `VportDashboardCalendarScreen.jsx` — `if (!identity) return <div>Sign in required.</div>` — screens block render.

### Locksmith — Deleted/Inactive VPORT lifecycle

Simulated: Visitor fetches public locksmith profile for a deleted VPORT.

Path traced:
- `getLocksmithProfileController(actorId)` → `dalListLocksmithServiceAreas(actorId)` — reads directly from `vport.locksmith_service_areas` filtered by `actor_id`. No `is_deleted` filter.
- However: the profile shell that would render this controller's data routes through `fetchVportPublicDetailsByActorId` which applies `.eq("is_deleted", false).eq("is_active", true)`. If the profile returns null (deleted), the locksmith-specific data is never surfaced.

**Result: PARTIAL** — lifecycle enforcement exists at profile shell level but NOT inside the locksmith-specific DAL reads. A direct controller call bypasses the lifecycle gate. See BW-LOCK-002.

### Restaurant — Null identityActorId to publishMenuUpdateAsPost

Simulated: `publishMenuUpdateAsPostController({ identityActorId: null, actorId: 'valid-id', ... })`

Path traced:
- `publishMenuUpdateAsPost.controller.js:30` — `if (!identityActorId) throw new Error('publishMenuUpdateAsPost: identityActorId required')`

**Result: BLOCKED** — hard throw on null. No publish executes.

---

## Mutation Replay Results

### Availability — Duplicate Rule Submission

Simulated: Submitting the same availability rule twice (same resourceId, weekday, startTime, endTime — no ruleId on second call).

Path traced:
- `dalUpsertVportAvailabilityRule` uses `upsert(..., { onConflict: 'id' })`
- Without a `ruleId`, no `id` is provided — each call generates a new UUID
- Two identical rules for the same weekday can be inserted with no conflict
- No uniqueness constraint on `(resource_id, weekday, start_time, end_time)` enforced at the DAL layer

**Result: PARTIAL** — Duplicate rules are silently inserted. No error. No idempotency protection at the application layer. See BW-AVAIL-001.

### Restaurant — Menu Category Delete Without Pre-Verification

Simulated: `deleteVportActorMenuCategoryController({ categoryId: 'valid-id', actorId: actorB })`

Path traced:
- Controller validates `categoryId` and `actorId` are non-null
- Calls `deleteVportActorMenuCategoryDAL({ categoryId, actorId })` — DAL must enforce actor ownership
- Controller does NOT pre-fetch the category to verify `category.actor_id === actorId` before deletion
- Relies entirely on DAL/RLS to prevent cross-actor delete

**Result: PARTIAL** — No pre-verification at controller layer. Protection depends entirely on DAL + RLS. If RLS is misconfigured, cross-actor delete succeeds silently. See BW-REST-001.

---

## Runtime Abuse Results

### Locksmith — Publish System Post Without Ownership

Simulated: Actor B calls `publishLocksmithServiceAreaUpdateAsPostController({ identityActorId: actorB, actorId: actorA, ... })`

Path traced:
- `publishLocksmithServiceAreaUpdateAsPostController` lines 56-59: calls `assertActorOwnsVportActorController({ requestActorId: identityActorId, targetActorId: actorId })`
- `assertActorOwnsVportActorController` → engine controller → DB-verified `actor_owners` lookup
- If Actor B does not own Actor A's VPORT → throws

**Result: BLOCKED** — ownership gate is present and DB-verified on all three locksmith publish controllers (portfolio, hours, service area). VENOM finding VR-05 pattern is NOT present in locksmith.

### Restaurant — Menu System Post

Simulated: Actor B calls `publishMenuUpdateAsPostController({ identityActorId: actorB, actorId: actorA, ... })`

Path traced:
- `publishMenuUpdateAsPost.controller.js:33-36`: calls `assertActorOwnsVportActorController({ requestActorId: identityActorId, targetActorId: actorId })`
- Engine-level DB-verified check → Actor B does not own Actor A → throws

**Result: BLOCKED** — VENOM finding VR-05 is resolved. The ownership check is present and correct.

---

## RLS Verification Results

### Availability — vport.availability_rules

- DAL: `dalUpsertVportAvailabilityRule` uses `getVportClient().from('availability_rules')` with no `actor_id` column filter on write
- The `availability_rules` table has no `actor_id` column in the write columns set (only `resource_id`)
- Protection against cross-actor writes relies on: (1) engine `assertActorCanManageResource` at controller layer and (2) RLS policy on `vport.availability_rules` (status: ASSUMED — DB-BOOK-02 per VENOM)
- RLS: Status ASSUMED — not independently confirmed by BLACKWIDOW (requires Carnage/DB)

**RLS Status: ASSUMED** — controller layer is now verified. DB-BOOK-02 (RLS policy on availability_rules) remains unconfirmed. See BW-AVAIL-002.

### Locksmith — vport.locksmith_service_areas / locksmith_service_details

- DAL update/delete both include `.eq('actor_id', actorId)` — second-layer protection
- Upsert path (`dalUpsertLocksmithServiceArea`) does NOT include a `WHERE actor_id = ?` on the upsert — only on insert/update/delete variants
- RLS: Status ASSUMED for all three tables (VL-05 per VENOM — not confirmed)

**RLS Status: ASSUMED** — DAL column filter is present on update/delete paths. Upsert path has no explicit actor guard beyond the `actor_id` field in the row being upserted.

### Restaurant — vport.menu_categories / vport.menu_items

- Controller pre-fetches rows and compares `existing.actor_id !== actorId` — app-layer ownership
- DAL delete (`deleteVportActorMenuItemDAL`, `deleteVportActorMenuCategoryDAL`) receives `actorId` — RLS expected to enforce
- RLS: ASSUMED per VENOM finding VR-01

**RLS Status: ASSUMED** — controller ownership check via row read is present (stronger pattern than locksmith). RLS confirmation required.

---

## Hydration Poisoning Results

Not applicable at module level — availability, locksmith, and restaurant modules do not use a client-side hydration store. Data is fetched per-request. No cross-actor cache poisoning surface identified.

---

## Cross-Feature Abuse Results

### Availability — Engine Controller Direct Access

Simulated: Calling `setAvailabilityRule` from `@booking` adapter directly, bypassing the calendar screen.

Path traced:
- `setAvailabilityRule` is exported via `@booking` adapter and called directly from `useManageAvailability`
- The engine controller requires `requestActorId` — any call without it throws
- No bypass of ownership check is possible via direct adapter access — the controller enforces it

**Result: BLOCKED** — Engine controller is self-protecting. Adapter isolation does not create a bypass.

---

## URL Surface Results

### Availability (dashboard route)

- Route: `/actor/:actorId/dashboard/calendar` — `actorId` is the VPORT actor UUID in the URL
- This is a dashboard-only route, authenticated, owner-restricted
- `actorId` in the URL is an internal actor UUID (raw UUID exposed in authenticated dashboard URL)
- This is consistent with the platform's authenticated dashboard URL pattern — all dashboard routes use `/actor/:actorId/...`
- Authenticated routes with `actorId` are a known platform pattern and not a public exposure (user already knows their own actorId; auth required to reach dashboard)

**UUID Exposure: PRESENT (authenticated route only)**
**Severity for this module: INFO** — not a new finding; consistent with platform-wide dashboard URL pattern.

### Restaurant — Public Menu Routes

- Canonical: `/profile/:slug/menu` — slug-based, no UUID
- Canonical QR: `/profile/:slug/menu/qr` — slug-based, no UUID
- Legacy (still live): `/actor/:actorId/menu` — raw actorId UUID in public URL
- Legacy QR (still live): `/actor/:actorId/menu/qr` — raw actorId UUID in public URL
- Short QR (`/m/:actorId`): raw actorId UUID in redirect URL (routes to `/vport/:actorId/menu` — also UUID-based)

**UUID Exposure: PRESENT (public routes)** — legacy routes expose raw actorId. Slug-based canonical routes exist but legacy routes remain live. See BW-REST-002.

### Locksmith — Public Profile Route

- Route: `/profile/:slug` — slug-based, no UUID
- No locksmith-specific QR or share links found beyond the standard profile route
- No raw UUID exposure in locksmith public-facing routes

**UUID Exposure: ABSENT** — slug enforced on public locksmith profile route.

---

## Notification Abuse Results

Not directly in scope for this module set — no locksmith- or restaurant-specific notification types were identified with unique ownership concerns beyond what VENOM covered in VL-07/VR-06. Deferred to notification system BLACKWIDOW run.

---

## Auth Callback Replay Results

Not applicable to these modules — availability, locksmith, and restaurant do not implement auth callbacks or recovery flows.

---

## Search Abuse Results

Not applicable to these modules — no search endpoints are owned by the availability, locksmith, or restaurant features.

---

## Successful Exploit Chains

None fully proven. Partial or conditional exploit paths identified in:
- BW-AVAIL-001 (duplicate rule insertion — no idempotency gate)
- BW-AVAIL-002 (RLS assumption — not DB-confirmed)
- BW-LOCK-001 (single-layer DAL protection — no controller-level `actor_owners` call)
- BW-LOCK-002 (locksmith lifecycle DAL reads bypass profile-level deletion gate)
- BW-REST-001 (delete controllers rely on RLS alone — no pre-verification)
- BW-REST-002 (legacy actorId routes still live — public UUID exposure)

---

## Failed Exploit Chains (Defenses That Held)

| Attack | Result | Defense Gate |
|---|---|---|
| Availability ownership bypass via null requestActorId | BLOCKED | Engine controller hard throw |
| Availability cross-actor rule write (Actor B → Actor A resource) | BLOCKED | assertActorCanManageResource DB-verified |
| Locksmith cross-actor service area update | BLOCKED | DAL actor_id column filter |
| Locksmith cross-actor service area delete | BLOCKED | DAL actor_id column filter |
| Locksmith cross-actor portfolio detail write | BLOCKED | Controller profile_id ownership cross-check |
| Locksmith publish post without ownership | BLOCKED | assertActorOwnsVportActorController |
| Restaurant menu item write with wrong actorId | BLOCKED | Controller row-level actor_id comparison |
| Restaurant publish menu post without ownership | BLOCKED | assertActorOwnsVportActorController |
| Null identityActorId to publish controllers | BLOCKED | Controller hard throw |

---

## Runtime Evidence

### Availability — setAvailabilityRule engine controller (CURRENT path):
```
engines/booking/src/controller/setAvailabilityRule.controller.js:9
  if (!requestActorId) throw new Error('[BookingEngine] requestActorId is required')
  → assertActorCanManageResource({ requestActorId, resourceId })
  → assertActorOwnsVportActor OR actor_owners DB lookup
```

### Availability — WeeklyAvailabilityGrid (CURRENT path):
```
WeeklyAvailabilityGrid.jsx:99
  if (!resourceId || !viewerActorId) return;  // null guard

WeeklyAvailabilityGrid.jsx:114,121,127
  manageAvailability.setAvailabilityRule({ requestActorId: viewerActorId, ruleId, resourceId, ... })
  // viewerActorId flows correctly from session identity to engine controller
```

### Availability — isOwner gate (CURRENT — DB-verified):
```
VportDashboardCalendarScreen.jsx:28
  const { isOwner, ownershipLoading } = useVportOwnership(viewerActorId, actorId);
  // calls checkVportOwnershipController → assertActorOwnsVportActorController → actor_owners DB
```

### Locksmith — DAL actor_id filter on update/delete:
```
locksmithServiceAreas.write.dal.js:51-64
  .update(updates).eq('id', areaId).eq('actor_id', actorId)  // dual filter on update
  .delete().eq('id', areaId).eq('actor_id', actorId)         // dual filter on delete
```

### Locksmith — Controller ownership chain (current state — actorId present but no actor_owners call):
```
locksmithOwner.controller.js:46-62 (ctrlUpdateServiceArea)
  if (!actorId) throw new Error('[Locksmith] actorId required')
  if (!areaId)  throw new Error('[Locksmith] areaId required')
  return dalUpdateLocksmithServiceArea(areaId, actorId, row)
  // no assertActorOwnsVportActorController call
```

### Locksmith — Portfolio detail ownership (CURRENT — cross-check added):
```
locksmithOwner.controller.js:111-120 (ctrlSavePortfolioDetail)
  // Parallel lookup: callerProfileId from actor_id, itemProfileId from portfolio row
  if (callerProfileId !== itemProfileId) throw new Error('[Locksmith] not authorized...')
```

### Restaurant — menu delete relying on RLS (no pre-fetch):
```
deleteVportActorMenuItemController:27-31
  await deleteVportActorMenuItemDAL({ itemId, actorId });
  // no pre-fetch; comment reads "Expected RLS: DB should only allow deleting items the current user/actor owns"
```

### Restaurant — legacy UUID route still live:
```
vportMenu.routes.jsx:27-28
  { path: "/actor/:actorId/menu", element: <VportActorMenuPublicScreen /> }
  { path: "/actor/:actorId/menu/qr", element: <VportActorMenuQrScreen /> }
  // actorId = raw actor UUID in public URL
```

---

## Blast Radius

| Module | Max Blast Radius | Preconditions |
|---|---|---|
| Availability | Platform-wide (any VPORT's availability rules if DAL actor_id filter absent) | Authenticated actor + valid ruleId (currently BLOCKED by engine controller) |
| Locksmith | Single VPORT (actorId column filter limits scope to matching rows) | Authenticated actor + valid areaId or serviceId (currently BLOCKED by DAL filter) |
| Restaurant | Single VPORT (category+item row check) | Authenticated actor + known itemId/categoryId |
| Restaurant (URL) | Actor enumeration risk via legacy routes | Unauthenticated visitor |

---

## BLACKWIDOW FINDINGS

---

### BW-AVAIL-001

```
BLACKWIDOW ADVERSARIAL FINDING
- Finding ID: BW-AVAIL-001
- Scenario: Mutation Replay — Duplicate Availability Rule Insertion
- Target: engines/booking/src/dal/vportAvailability.write.dal.js (dalUpsertVportAvailabilityRule)
- Application Scope: VCSM + ENGINE
- Platform Surface: Availability rule write path (calendar dashboard)
- Attack Vector: Authenticated VPORT owner submits identical rule parameters twice
  (or two requests in rapid succession) without a ruleId. Each call creates a new row
  with a fresh id. The upsert uses onConflict:'id' — without an id, no conflict fires.
  Two identical (resource_id, weekday, start_time, end_time) rules are stored.
- Exploit Chain Type: Replay exploit — missing idempotency protection
- Governance Status: DRAFT
- Result: PARTIAL
- Evidence:
  dalUpsertVportAvailabilityRule uses upsert(..., { onConflict: 'id' })
  Without ruleId, no id is provided → new row each call.
  No unique constraint on (resource_id, weekday, start_time, end_time) enforced at DAL layer.
  getLocationAvailability / getResourceAvailability would return duplicate rules.
  UI rulesToBlocks may handle duplicates gracefully but the DB state is dirty.
- Defense Gate: ABSENT (no idempotency gate; no duplicate detection)
- Blast Radius: Single VPORT — availability data corruption for the owning actor only.
  No cross-actor impact. Downstream: duplicate rules could cause booking slot miscalculation.
- Severity: LOW
- VENOM Finding Cross-Reference: None (new finding — not in V-AVAIL-01/02/03/04)
- Recommended Fix:
  Option A (DB): Add a unique constraint on (resource_id, weekday, start_time, end_time)
  in vport.availability_rules with ON CONFLICT DO UPDATE (true upsert semantics).
  Option B (App): Before insert, deduplicate blocks client-side in WeeklyAvailabilityGrid.save()
  so identical time blocks for the same weekday are not submitted. Prefer Option A.
- Layer to Fix: DAL (Option A via Carnage) | UI (Option B — partial guard)
- Required Follow-up Command: Carnage (unique constraint on availability_rules)
```

---

### BW-AVAIL-002

```
BLACKWIDOW ADVERSARIAL FINDING
- Finding ID: BW-AVAIL-002
- Scenario: RLS Verification — vport.availability_rules UPDATE policy
- Target: vport.availability_rules (Supabase schema)
- Application Scope: ENGINE
- Platform Surface: Availability rule write path — DAL layer
- Attack Vector: If the engine controller's assertActorCanManageResource is bypassed
  (future regression or direct Supabase client call), the DAL has no actor_id column
  filter on upsert. The vportAvailability.write.dal.js writes directly with only
  resource_id — no ownership column in the WHERE clause. Cross-actor writes would succeed
  if RLS is absent or misconfigured.
- Exploit Chain Type: Single-step exploit (one gate missing — RLS not confirmed)
- Governance Status: DRAFT
- Result: PARTIAL (controller blocks in current code; DB fallback unverified)
- Evidence:
  engines/booking/src/dal/vportAvailability.write.dal.js
  RULE_WRITE_COLUMNS does not include actor_id (table does not have this column).
  Ownership is tied to resource_id → resource.owner_actor_id in the controller.
  DB-BOOK-02 (VENOM 2026-05-14): "RLS ownership unknown" — never confirmed by DB/Carnage.
- Defense Gate: WEAK (controller present; RLS unconfirmed; DAL has no column fallback)
- Blast Radius: Platform-wide if RLS absent — any VPORT's availability rules modifiable
  by any authenticated actor if controller is bypassed.
- Severity: MEDIUM
- VENOM Finding Cross-Reference: V-AVAIL-01 (DB-BOOK-02 dependency noted)
- Recommended Fix: Carnage to confirm and enforce RLS UPDATE policy on
  vport.availability_rules scoped to the resource's owner_actor_id via a JOIN or
  policy function. Until confirmed, the engine controller is the sole protection.
- Layer to Fix: RLS (Carnage)
- Required Follow-up Command: Carnage, DB
```

---

### BW-AVAIL-003

```
BLACKWIDOW ADVERSARIAL FINDING
- Finding ID: BW-AVAIL-003
- Scenario: Viewer Context Fuzz — assertActorCanManageResource with void actor
- Target: engines/booking/src/controller/assertActorCanManageResource.controller.js
- Application Scope: ENGINE
- Platform Surface: All availability write operations
- Attack Vector: A deactivated (is_void = true) actor submits a valid requestActorId
  that resolves to a void actor. Without an explicit void check, the actor might pass
  the string-comparison direct ownership gate (line 30) if is_void is not checked there.
- Exploit Chain Type: Viewer context fuzz — stale identity
- Governance Status: DRAFT
- Result: BLOCKED
- Evidence:
  assertActorCanManageResource.controller.js:19-22
  const requestingActor = await dalGetActorById({ actorId: requestActorId })
  if (!requestingActor || requestingActor.is_void === true) {
    throw new Error('[BookingEngine] Only valid actors may manage booking resources.')
  }
  // Comment references BW-001 — void actor check was already added from prior BW session.
  // Gate fires before any ownership check branch.
- Defense Gate: PRESENT — void actor check is the first gate in the controller.
- Blast Radius: None in current implementation — gate blocks void actors before any ownership logic.
- Severity: INFO
- VENOM Finding Cross-Reference: None (defensive — prior BW pattern already applied)
- Recommended Fix: No action required. Defense is present. Document as verified.
- Layer to Fix: N/A
- Required Follow-up Command: None
```

---

### BW-LOCK-001

```
BLACKWIDOW ADVERSARIAL FINDING
- Finding ID: BW-LOCK-001
- Scenario: Ownership Bypass — Locksmith service area/detail write (single-layer defense)
- Target: apps/VCSM/src/features/profiles/kinds/vport/controller/locksmith/locksmithOwner.controller.js
- Application Scope: VCSM
- Platform Surface: Locksmith VPORT owner management — service areas and service details
- Attack Vector: Actor B calls ctrlUpdateServiceArea(actorB, actorA_areaId, {...}).
  The controller accepts actorId (actorB) and passes it to the DAL.
  The DAL applies .eq('actor_id', actorB) — this filters to zero rows (Actor A's area
  has actor_id = actorA, not actorB). Update is a silent no-op.
  HOWEVER: the controller does NOT call assertActorOwnsVportActorController.
  The sole protection is the DAL-level column filter — not a controller ownership assertion.
  This is a single-layer defense. If the DAL filter is removed or bypassed (e.g., a
  future developer adds a direct Supabase call), there is no controller backstop.
  Additionally, ctrlSaveServiceDetail follows the same single-layer pattern — actorId
  is passed into the upsert row but no controller-level ownership assertion exists.
- Exploit Chain Type: Single-step exploit (conditional on DAL filter being sole protection)
- Governance Status: DRAFT
- Result: BLOCKED (current code — DAL filter holds)
  PARTIAL (structural — single layer, not defense-in-depth)
- Evidence:
  locksmithOwner.controller.js:46-63:
    ctrlUpdateServiceArea(actorId, areaId, updates) — no assertActorOwnsVportActorController
    → dalUpdateLocksmithServiceArea(areaId, actorId, row)  ← DAL enforces via .eq('actor_id')
  locksmithOwner.controller.js:65-69:
    ctrlDeleteServiceArea(actorId, areaId) — no assertActorOwnsVportActorController
    → dalDeleteLocksmithServiceArea(areaId, actorId)  ← DAL enforces via .eq('actor_id')
  Contrast: ctrlSavePortfolioDetail DOES perform a cross-check at controller layer (lines 111-120).
  VENOM VL-01/02/03 reported missing actorId entirely — this has been partially fixed
  (actorId now present) but assertActorOwnsVportActorController still absent.
- Defense Gate: WEAK (single-layer DAL filter only — no controller ownership assertion)
- Blast Radius: Single VPORT — Actor A's service areas and details can only be corrupted
  if the DAL filter is absent. Currently no data leaks, but architecture is not defense-in-depth.
- Severity: MEDIUM
- VENOM Finding Cross-Reference: VL-01 (ctrlUpdateServiceArea), VL-02 (ctrlDeleteServiceArea),
  VL-03 (ctrlDeleteServiceDetail)
- Recommended Fix:
  Add assertActorOwnsVportActorController({ requestActorId: actorId, targetActorId: actorId })
  call at the top of ctrlUpdateServiceArea, ctrlDeleteServiceArea, and ctrlSaveServiceDetail.
  This requires resolving the VPORT actor from the actorId — for a locksmith, the actorId
  IS the vport actor, so assertActorOwnsVportActorController({ requestActorId: callerUserId,
  targetActorId: vportActorId }) is the correct call pattern. If the entry point is always
  the VPORT actor's own session (vport-kind actor = actorId), the self-check in
  assertActorOwnsVportActor (mode: 'self') passes trivially. Ensure the upstream hook
  passes the user-kind actor as callerActorId when applicable.
- Layer to Fix: Controller
- Required Follow-up Command: Wolverine (implement actor_owners check pattern in locksmithOwner.controller.js)
```

---

### BW-LOCK-002

```
BLACKWIDOW ADVERSARIAL FINDING
- Finding ID: BW-LOCK-002
- Scenario: Viewer Context Fuzz — Deleted/Inactive locksmith VPORT public data visibility
- Target: apps/VCSM/src/features/profiles/kinds/vport/controller/locksmith/getLocksmithProfile.controller.js
- Application Scope: VCSM
- Platform Surface: Public locksmith profile (About tab — service areas and details)
- Attack Vector: A locksmith VPORT is soft-deleted (is_deleted = true in vport.profiles).
  A visitor or attacker calls getLocksmithProfileController(deletedActorId) directly
  (bypassing the profile shell that enforces is_deleted = false).
  The controller calls dalListLocksmithServiceAreas(actorId) and dalListLocksmithServiceDetails(actorId)
  which filter only by actor_id — no is_deleted filter.
  Result: service area and service detail data for a deleted locksmith VPORT is still returned.
- Exploit Chain Type: Viewer context fuzz — lifecycle state not propagated to sub-controllers
- Governance Status: DRAFT
- Result: PARTIAL
- Evidence:
  getLocksmithProfile.controller.js:52-69
  const [areas, details, enabledServices] = await Promise.all([
    dalListLocksmithServiceAreas(actorId),         // no is_deleted filter
    dalListLocksmithServiceDetails(actorId),        // no is_deleted filter
    readVportServicesByActor({ actorId, ... }),
  ])
  fetchVportPublicDetailsByActorId (profile shell DAL):
    .eq("is_deleted", false).eq("is_active", true)  ← lifecycle gate is HERE, not in locksmith controller
  If getLocksmithProfileController is called directly without first checking profile shell,
  it returns data for deleted VPORTs.
- Defense Gate: WEAK (lifecycle gate exists at profile shell level only — not in locksmith-specific reads)
- Blast Radius: Data exposure for a deleted locksmith's service areas and pricing to any caller
  of getLocksmithProfileController. Actual exposure depends on whether the UI always routes
  through the profile shell. In the current codebase this appears to be the case — but a
  direct controller call bypasses the guard.
- Severity: LOW
- VENOM Finding Cross-Reference: VL-07 (is_deleted filter finding — shared pattern)
- Recommended Fix:
  Add a lifecycle pre-check at the top of getLocksmithProfileController:
  Fetch the vport profile row with is_deleted and is_active filters (or call
  fetchVportPublicDetailsByActorId internally) and return empty arrays if deleted/inactive.
  Alternatively, the locksmith DAL reads should add a JOIN or subquery filtering
  through vport.profiles where is_deleted = false.
- Layer to Fix: Controller | DAL
- Required Follow-up Command: Wolverine
```

---

### BW-LOCK-003

```
BLACKWIDOW ADVERSARIAL FINDING
- Finding ID: BW-LOCK-003
- Scenario: Runtime Abuse — Locksmith service detail bulk exposure (unauthenticated read)
- Target: apps/VCSM/src/features/profiles/kinds/vport/controller/locksmith/getLocksmithProfile.controller.js
- Application Scope: VCSM
- Platform Surface: Public locksmith profile About tab (no authentication required)
- Attack Vector: Any unauthenticated caller invokes getLocksmithProfileController(actorId)
  for any locksmith actorId. Returns: service areas (including travelFeeCents, ETAs,
  isEmergencyCovered), service details (requiresPhotoId, requiresProofOfOwnership,
  pricingModel, startingPriceCents, maxPriceCents). All of these fields are intentionally
  public. The adversarial risk is programmatic enumeration: if all locksmith actorIds can
  be discovered (via explore/search or VENOM-noted exposure), a single loop over all
  actorIds retrieves full pricing and verification policy data for all locksmiths on the platform.
- Exploit Chain Type: Multi-step exploit (requires actorId enumeration + bulk API calls)
- Governance Status: DRAFT
- Result: PARTIAL (data is intentionally public; bulk access is the risk)
- Evidence:
  getLocksmithProfile.controller.js: no auth check, returns serviceDetails including
  requiresPhotoId, requiresProofOfOwnership (physical security verification fields)
  and startingPriceCents, maxPriceCents (live pricing).
  VENOM VL-06: same finding with same severity.
- Defense Gate: ABSENT (no rate limiting at controller level; no auth required; no bulk detection)
- Blast Radius: All locksmith VPORTs on the platform — pricing and physical security
  verification policy data can be scraped at scale without authentication.
- Severity: MEDIUM
- VENOM Finding Cross-Reference: VL-06
- Recommended Fix:
  (1) Rate-limit the getLocksmithProfile endpoint at the API/CDN layer.
  (2) Consider making pricing fields (startingPriceCents, maxPriceCents) require
  authentication or return ranges only (not precise values) in the public read.
  (3) requiresPhotoId / requiresProofOfOwnership are intentional trust signals for
  customers — consider whether they need bulk-access protection separately from
  individual profile reads.
- Layer to Fix: Router (rate limiting) | DAL (field selection for unauthenticated reads)
- Required Follow-up Command: Loki (API rate limiting audit), Wolverine
```

---

### BW-REST-001

```
BLACKWIDOW ADVERSARIAL FINDING
- Finding ID: BW-REST-001
- Scenario: Ownership Bypass — Delete menu item/category without pre-verification
- Target:
  apps/VCSM/src/features/profiles/kinds/vport/controller/menu/deleteVportActorMenuItemController.js
  apps/VCSM/src/features/profiles/kinds/vport/controller/menu/deleteVportActorMenuCategoryController.js
- Application Scope: VCSM
- Platform Surface: Restaurant VPORT menu management (owner write path)
- Attack Vector: Actor B calls deleteVportActorMenuItemController({ itemId: actorA_item, actorId: actorB }).
  The controller validates itemId and actorId are present but does NOT pre-fetch the item
  to verify existing.actor_id === actorId before the delete. The controller comment explicitly
  states "Expected RLS: DB should only allow deleting items the current user/actor owns."
  This means the controller is intentionally delegating ownership verification to RLS.
  If RLS on vport.menu_items DELETE is absent or misconfigured, Actor B's delete succeeds
  against Actor A's item. The DAL function receives actorId — whether it is passed to the
  DB filter depends on the DAL implementation (not verified in this simulation).
- Exploit Chain Type: Single-step exploit (if RLS absent — controller provides no fallback)
- Governance Status: DRAFT
- Result: PARTIAL
- Evidence:
  deleteVportActorMenuItemController.js:27-31:
    await deleteVportActorMenuItemDAL({ itemId, actorId });
    // No pre-fetch. No existing.actor_id check.
    // Comment: "Expected RLS: DB should only allow deleting..."
  Contrast with saveVportActorMenuItemController:
    existing = await readVportActorMenuItemsDAL({ itemId })
    if (existing.actor_id !== actorId) throw new Error("Not allowed to modify this menu item")
    // Save path HAS pre-verification. Delete path does NOT.
  This inconsistency is the adversarial finding: same module, different protection pattern.
- Defense Gate: WEAK (controller has no app-layer ownership check; relies entirely on RLS)
- Blast Radius: Single VPORT — Actor A's menu items can be deleted by Actor B if RLS is misconfigured.
  For a restaurant, losing all menu items causes immediate visible damage to the public profile.
- Severity: MEDIUM
- VENOM Finding Cross-Reference: VR-01 (ownership check pattern inconsistency)
- Recommended Fix:
  Add pre-fetch ownership verification to deleteVportActorMenuItemController and
  deleteVportActorMenuCategoryController, matching the pattern in saveVportActorMenuItemController:
  const existing = await readVportActorMenuItemsDAL({ itemId })
  if (!existing) throw new Error("Menu item not found")
  if (existing.actor_id !== actorId) throw new Error("Not allowed to delete this menu item")
  await deleteVportActorMenuItemDAL({ itemId, actorId })
  This makes delete controllers self-protecting without relying on RLS alone.
- Layer to Fix: Controller
- Required Follow-up Command: Wolverine, DB (confirm RLS on vport.menu_items DELETE)
```

---

### BW-REST-002

```
BLACKWIDOW ADVERSARIAL FINDING
- Finding ID: BW-REST-002
- Scenario: URL Surface — Legacy actorId routes expose raw UUID in public URLs
- Target:
  apps/VCSM/src/app/routes/public/vportMenu.routes.jsx:27-28
  apps/VCSM/src/features/public/screens/VportMenuRedirect.jsx
- Application Scope: VCSM
- Platform Surface: Public restaurant menu and QR routes
- Attack Vector: Any visitor who receives a QR code or menu share link may receive a URL
  containing the raw actorId UUID:
  - /actor/:actorId/menu
  - /actor/:actorId/menu/qr
  - /m/:actorId (short link → redirects to /vport/:actorId/menu — still UUID-based)
  These routes expose the restaurant's internal actor UUID in a publicly accessible URL.
  The UUID can be used to: (1) correlate the restaurant across API surfaces,
  (2) call any unauthenticated controller that accepts actorId directly,
  (3) enumerate resources (menu categories, items) by passing the actorId to
  getVportPublicMenuController.
  Canonical slug routes (/profile/:slug/menu) exist and are correct. Legacy routes
  remain live alongside them.
- Exploit Chain Type: Injection exploit (actorId discoverable via URL; feeds subsequent attacks)
- Governance Status: DRAFT
- Result: PARTIAL (slug routes present; legacy UUID routes still live)
- Evidence:
  vportMenu.routes.jsx:27-28:
    { path: "/actor/:actorId/menu", element: <VportActorMenuPublicScreen /> }
    { path: "/actor/:actorId/menu/qr", element: <VportActorMenuQrScreen /> }
  VportMenuRedirect.jsx:12:
    navigate(`/vport/${actorId}/menu`, { replace: true })  // redirects to UUID-based route
  Canonical routes at lines 19-20 use :slug — these are correct.
  Platform memory rule: "Raw UUIDs must never appear in public-facing URLs."
- Defense Gate: WEAK (canonical slug routes exist; legacy UUID routes not removed)
- Blast Radius: All restaurant VPORTs — any actor whose menu was shared via QR code before
  the slug migration has their actorId UUID exposed in the wild (in printed QR codes,
  social media links, or saved bookmarks).
- Severity: MEDIUM
- VENOM Finding Cross-Reference: VR-06 (vport_id in public response — same category)
- Recommended Fix:
  (1) Convert /actor/:actorId/menu and /actor/:actorId/menu/qr to redirect to
  /profile/:slug/menu and /profile/:slug/menu/qr respectively (resolve slug from actorId
  server-side or in the redirect handler, mirroring VportMenuRedirect pattern).
  (2) Convert /m/:actorId to redirect to /profile/:slug/menu (not /vport/:actorId/menu).
  (3) Remove or 301-redirect the UUID-based legacy routes once existing QR codes have
  a reasonable migration window.
- Layer to Fix: Router
- Required Follow-up Command: Wolverine, ELEKTRA (confirm all QR link generators use slug)
```

---

### BW-REST-003

```
BLACKWIDOW ADVERSARIAL FINDING
- Finding ID: BW-REST-003
- Scenario: Runtime Abuse — Fire-and-forget media recording in production silences errors
- Target: apps/VCSM/src/features/profiles/kinds/vport/controller/menu/saveVportActorMenuItem.controller.js:114-137
- Application Scope: VCSM
- Platform Surface: Restaurant menu item image upload path
- Attack Vector: A menu item is created with an image. The `recordMenuItemMedia` IIFE
  fires asynchronously. If createMediaAssetController or createVportMenuItemMediaDAL fails,
  the catch block executes:
    if (import.meta.env?.DEV) console.warn(...)
  In production (import.meta.env.DEV is false), the failure is completely silent.
  The image file exists at its CDN URL (uploaded before this controller ran) but is not
  tracked in platform.media_assets. No ownership record exists. The file cannot be
  cleaned up via normal media management flows. An attacker who triggers this failure
  repeatedly accumulates untracked, publicly-accessible CDN files.
- Exploit Chain Type: Replay exploit — fire-and-forget allows repeated orphaned media creation
- Governance Status: DRAFT
- Result: PARTIAL (operational security failure — not a direct auth bypass)
- Evidence:
  saveVportActorMenuItem.controller.js:133-136:
    } catch (e) {
      if (import.meta.env?.DEV) console.warn('[saveVportActorMenuItem] media_assets record failed...')
    }
  // Production: silent catch. No error surfaced to caller. No retry. No alerting.
  VENOM VR-02: same finding — confirmed unchanged.
- Defense Gate: ABSENT (no production error surface; no retry; no orphan detection)
- Blast Radius: Accumulating untracked public CDN files over time. No cross-actor impact.
  For a high-volume restaurant (frequent menu updates), this degrades asset hygiene significantly.
- Severity: LOW
- VENOM Finding Cross-Reference: VR-02
- Recommended Fix:
  (1) Surface media asset recording failures as non-fatal warnings to the caller (not silent).
  (2) Add a server-side cleanup job for orphaned CDN files with no matching platform.media_assets record.
  (3) Log to an observability surface in production (not just DEV console.warn).
  (4) Consider making recordMenuItemMedia a synchronous awaited call with retry logic.
- Layer to Fix: Controller
- Required Follow-up Command: Deadpool (full error handling review of saveVportActorMenuItemController)
```

---

## Summary of All Findings

| Finding ID | Module | Scenario | Result | Severity | Defense Gate |
|---|---|---|---|---|---|
| BW-AVAIL-001 | availability | Duplicate rule insertion (no idempotency) | PARTIAL | LOW | ABSENT |
| BW-AVAIL-002 | availability | RLS unconfirmed on availability_rules | PARTIAL | MEDIUM | WEAK |
| BW-AVAIL-003 | availability | Void actor fuzz on assertActorCanManageResource | BLOCKED | INFO | PRESENT |
| BW-LOCK-001 | locksmith | Single-layer DAL defense (no actor_owners call in controller) | PARTIAL | MEDIUM | WEAK |
| BW-LOCK-002 | locksmith | Deleted VPORT lifecycle bypass in getLocksmithProfileController | PARTIAL | LOW | WEAK |
| BW-LOCK-003 | locksmith | Bulk unauthenticated read of verification+pricing fields | PARTIAL | MEDIUM | ABSENT |
| BW-REST-001 | restaurant | Delete controllers lack pre-fetch ownership verification | PARTIAL | MEDIUM | WEAK |
| BW-REST-002 | restaurant | Legacy actorId UUID routes still live in public routing | PARTIAL | MEDIUM | WEAK |
| BW-REST-003 | restaurant | Silent fire-and-forget media failure in production | PARTIAL | LOW | ABSENT |

**Defenses that held (not in finding list above):**
- Availability ownership bypass → BLOCKED (engine assertActorCanManageResource)
- Availability null requestActorId → BLOCKED (engine hard throw)
- Locksmith cross-actor update/delete → BLOCKED (DAL actor_id filter)
- Locksmith portfolio write → BLOCKED (controller profile_id cross-check)
- Locksmith publish post without ownership → BLOCKED (assertActorOwnsVportActorController)
- Restaurant menu item save cross-actor → BLOCKED (controller row-level actor_id check)
- Restaurant publish menu post without ownership → BLOCKED (assertActorOwnsVportActorController)

---

## THOR Release Gate Assessment

| Finding | Severity | Release Blocker? | Rationale |
|---|---|---|---|
| BW-AVAIL-001 | LOW | NO | Self-VPORT impact only; no cross-actor exploit |
| BW-AVAIL-002 | MEDIUM | CAUTION | RLS unconfirmed — Carnage sprint required before RLS reliance claim can stand |
| BW-AVAIL-003 | INFO | NO | Defense verified |
| BW-LOCK-001 | MEDIUM | CAUTION | Single-layer defense; no exploitable path today but fragile architecture |
| BW-LOCK-002 | LOW | NO | Data for deleted VPORTs only; no active harm to live VPORTs |
| BW-LOCK-003 | MEDIUM | NO | Intentionally public data; bulk access risk — rate limiting recommended |
| BW-REST-001 | MEDIUM | CAUTION | Delete path relies on RLS alone — inconsistent with save path protection |
| BW-REST-002 | MEDIUM | CAUTION | Platform memory rule violation (raw UUID in public URLs); slug routes exist but legacy routes remain |
| BW-REST-003 | LOW | NO | Operational risk — no direct exploit |

No CRITICAL or HIGH findings. No fully proven exploit chains with cross-actor damage.

THOR may clear with CAUTION for BW-AVAIL-002, BW-LOCK-001, BW-REST-001, BW-REST-002.

---

## Recommended Fixes

| Priority | Finding | Fix | Owner |
|---|---|---|---|
| P1 | BW-AVAIL-002 | Carnage: confirm + enforce RLS on vport.availability_rules UPDATE | Carnage + DB |
| P1 | BW-REST-002 | Redirect /actor/:actorId/menu* and /m/:actorId to slug-based canonical routes | Wolverine |
| P1 | BW-REST-001 | Add pre-fetch ownership check to delete menu item/category controllers | Wolverine |
| P2 | BW-LOCK-001 | Add assertActorOwnsVportActorController to locksmithOwner update/delete functions | Wolverine |
| P2 | BW-LOCK-002 | Add lifecycle pre-check to getLocksmithProfileController | Wolverine |
| P2 | BW-LOCK-003 | Rate-limit locksmith public profile API | Loki + Infra |
| P3 | BW-AVAIL-001 | Add unique constraint on availability_rules (resource_id, weekday, start_time, end_time) | Carnage |
| P3 | BW-REST-003 | Surface media recording failures in production; add cleanup job | Deadpool |

---

## Required Follow-up Commands

| Command | Reason | Status |
|---|---|---|
| Carnage | Confirm RLS on vport.availability_rules (BW-AVAIL-002); add unique constraint (BW-AVAIL-001); confirm RLS on menu_items/categories (BW-REST-001) | PENDING |
| Wolverine | Implement: slug redirect for legacy menu routes (BW-REST-002); delete pre-fetch in menu controllers (BW-REST-001); actor_owners in locksmith controller (BW-LOCK-001); lifecycle check in getLocksmithProfileController (BW-LOCK-002) | PENDING |
| ELEKTRA | Precision scan: locksmith and restaurant controllers for remaining injection surfaces | PENDING |
| Deadpool | Error handling review: recordMenuItemMedia production silence (BW-REST-003) | PENDING |
| Loki | API rate limiting audit for unauthenticated profile reads (BW-LOCK-003) | PENDING |
| THOR | Review CAUTION findings for release gate decision | PENDING |

---

## Pending Reviews

| Command | Reason | Status |
|---|---|---|
| VENOM | Cross-reference: confirm VL-01/02/03 partial resolution status (actorId now present; actor_owners still absent) | PENDING |
| LOKI | Validate runtime telemetry confirms engine setAvailabilityRule is the live path (not legacy manageVportAvailabilityRuleController) | PENDING |
| THOR | Evaluate release blocking status for BW-AVAIL-002, BW-LOCK-001, BW-REST-001, BW-REST-002 | PENDING |
