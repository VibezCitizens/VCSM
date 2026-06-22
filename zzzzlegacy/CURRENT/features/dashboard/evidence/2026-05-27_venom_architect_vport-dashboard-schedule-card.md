# ARCHITECT + VENOM — VPORT Dashboard Schedule Card

**Date:** 2026-05-27
**Reviewer:** VENOM + ARCHITECT
**Ticket:** TICKET-0003 — VPORT Dashboard Card Logan Inventory (Phase 3, Step 4)
**Trigger:** Combined security and architecture review for newly documented schedule card module
**Findings:** 0 CRITICAL | 0 HIGH | 3 MEDIUM | 2 LOW (security); 3 architecture compliance findings

---

## VENOM TARGET

```
Feature / Route / Engine: VPORT Dashboard — Schedule Card
Application Scope: VCSM
Reason for review: Module documented 2026-05-27; SECURITY_REVIEW_PENDING; dual resource-source merge; customer PII in booking payload
Primary trust boundary: assertActorOwnsVportActorController in loadDayScheduleController (VPD-V-022)
```

---

## SECURITY SURFACE

```
Entry point:        VportDashboardScheduleScreen.jsx (no Final Screen — single component)
Auth source:        useIdentity() → @/state/identity/identityContext → callerActorId
Authorization layer: Controller-only (loadDayScheduleController, booking write controllers)
Identity surface:   actorId + kind (correct); callerActorId from identity.actorId
Sensitive objects:  vport.bookings (customer_name, customer_note, customer_actor_id)
                    vport.resources (staff member identities)
                    vport.availability_rules (working hours)
```

---

## TRUST BOUNDARY TRACE

```
Client input:       actorId from route params or props, dateKey from component state
Validated at:       Controller layer
Identity resolved at: useIdentity() → identity.actorId → callerActorId
Authorization enforced at:
  - loadDayScheduleController: assertActorOwnsVportActorController (BEFORE any DB read)
  - createOwnerBookingController: assertActorOwnsVportActorController (after resource lookup)
  - updateBookingStatusController: assertActorOwnsVportActorController (owner path only)
  - rescheduleBookingController: assertActorOwnsVportActorController
Data returned to:   VportDashboardScheduleScreen (no screen-level gate — see VENOM-SCHED-001)
```

---

## CONFIRMED SECURE

| Path | Status | Evidence |
|---|---|---|
| `loadDayScheduleController` read gate | VERIFIED | `assertActorOwnsVportActorController` fires as FIRST operation, before profileId, resources, or bookings are loaded (VPD-V-022) |
| `createOwnerBookingController` write gate | VERIFIED | Ownership resolved via resource lookup + null guard; `assertActorOwnsVportActorController` called with verified actorId |
| `updateBookingStatusController` write gate | VERIFIED | Dual path (owner vs customer); terminal state guard; null guard on vportActorId; `assertActorOwnsVportActorController` on owner path |
| `rescheduleBookingController` write gate | VERIFIED | Terminal state guard; null guard; `assertActorOwnsVportActorController`; slot conflict check |
| `vport.bookings` RLS | VERIFIED | `bookings_select_owner` policy added in migration `20260515010000` — owner sees all bookings for their profile via `profile_id → owner_user_id = auth.uid()` |
| `vport.resources` RLS | VERIFIED | Full actor-based policy set from migration `20260515020000` (see CARNAGE audit) |
| `vport.availability_rules` RLS | VERIFIED | SELECT public + owner policies in migration `20260515010000` |

---

## VENOM SECURITY FINDING — VENOM-SCHED-001

```
Location: cards/schedule/VportDashboardScheduleScreen.jsx — no screen-level ownership gate
Application Scope: VCSM
```

**Current behavior:** `VportDashboardScheduleScreen` accepts `actorId` as a prop or reads it from route params and immediately calls `useVportOwnerSchedule({ actorId })`. There is no `useVportOwnership(viewerActorId, actorId)` check at the screen level. The hooks fire unconditionally — the ownership gate only activates when `loadDayScheduleController` is called inside the hook, at which point the controller throws if the caller doesn't own the VPORT.

This means:
- The hook is mounted and the async load initiates for any `actorId`
- Non-owner callers receive an error state from the controller (not a silent pass)
- But the hook's component state (loading, modal state, etc.) is initialized before the error is known

**Risk:** Architecture contract non-compliance. The screen mounts hooks for any `actorId` regardless of ownership, relying solely on the controller-layer error to stop data flow. If the controller gate has a bug, no second gate exists at the screen layer. Defense-in-depth is absent at the screen boundary.

**Severity:** MEDIUM

**Exploitability:** LOW (controller gate has held; no known bypass)

**Blast Radius:** Single VPORT — unauthorized schedule read would affect one actor.

**Why it matters:** The architecture contract requires ownership gates at the Final Screen layer. A screen-level gate prevents hooks from initializing, prevents unnecessary DB calls, and provides a visible early failure signal. Without it, a controller regression silently removes all protection.

**Recommended mitigation:**
Add a `VportScheduleFinalScreen` that:
1. Reads `actorId` from route params
2. Resolves `viewerActorId` from identity context
3. Calls `useVportOwnership(viewerActorId, actorId)`
4. Renders loading/access-denied states
5. Only renders `VportDashboardScheduleScreen` when `isOwner === true`

**Follow-up command:** SENTRY (architecture compliance: Final/View screen split for schedule)

**CISSP Domain:**
- Primary: Security Architecture and Engineering
- Secondary: Identity and Access Management

---

## VENOM SECURITY FINDING — VENOM-SCHED-002

```
Location: cards/schedule/hooks/useVportOwnerSchedule.js — load useCallback dependency array
Application Scope: VCSM
```

**Current behavior:**
```javascript
const load = useCallback(async (key) => {
  ...
  const data = await loadDayScheduleController({ actorId, dateKey: key, callerActorId });
  ...
}, [actorId]);  // callerActorId is NOT in the dep array
```

`callerActorId` is captured in the `load` closure but is NOT included in the `useCallback` dep array. This means if `callerActorId` changes (e.g., when the user switches their active actor/identity), the memoized `load` function retains the old `callerActorId` value until `actorId` changes.

**Risk:** Stale identity on actor switch. If a user switches from Actor A (which owns the VPORT) to Actor B (which does not), the `load` callback continues using Actor A's `callerActorId`. The ownership check in `loadDayScheduleController` then evaluates Actor A against the VPORT — which passes — and returns schedule data. From the user's current identity perspective (Actor B), this data should not be accessible. From the controller's perspective, Actor A still owns the VPORT, so no error is thrown.

Practically, the user can only view data for the VPORT they previously owned as Actor A — data they legitimately had access to before the switch. The information exposure is bounded by their own prior access.

**Severity:** MEDIUM (stale identity rather than unauthorized access)

**Exploitability:** LOW (requires deliberate actor-switch timing; no external attacker benefit)

**Blast Radius:** Single actor — affects the switching user only.

**Why it matters:** After an identity switch, the displayed schedule should reflect the current actor's permissions, not a prior actor's. This is a subtle identity consistency bug with security implications.

**Recommended mitigation:**
Add `callerActorId` to the `useCallback` dep array:
```javascript
}, [actorId, callerActorId]);
```
This ensures the `load` function is re-created whenever either the VPORT or the session identity changes.

**Follow-up command:** ELEKTRA (surgical one-line dep array fix)

**CISSP Domain:**
- Primary: Identity and Access Management
- Secondary: Software Development Security

---

## VENOM SECURITY FINDING — VENOM-SCHED-003

```
Location: cards/schedule/index.js — controller exported from module boundary
Application Scope: VCSM
```

**Current behavior:** `index.js` exports `loadDayScheduleController` from the module boundary:
```javascript
export * from "./controller/loadDaySchedule.controller";
```

The controller IS ownership-gated (unlike the settings card's DAL export), so direct calls would still be rejected for non-owners. However, exporting the controller violates the architecture contract: adapters/module boundaries must not export controllers.

**Risk:** Architecture boundary violation. A caller that imports `loadDayScheduleController` directly from the schedule card bypasses the intended entry point (`useVportOwnerSchedule`). While the controller's ownership gate still fires, the hook's error handling, loading state, and UI feedback are bypassed. Additionally, the exported controller becomes a stable contract that future callers may depend on, locking in its signature.

**Severity:** MEDIUM (architecture non-compliance; not a direct exploit path given the controller gate)

**Exploitability:** LOW

**Blast Radius:** Architecture — creates a stable public contract for an internal implementation detail.

**Why it matters:** Exported controllers create tight coupling between modules. The architecture contract exists to prevent this coupling.

**Recommended mitigation:**
Remove `export * from "./controller/loadDaySchedule.controller"` from `index.js`. The schedule card's public API should be only: hooks, components, and the view screen.

**Follow-up command:** SENTRY (architecture compliance: controller export removal)

**CISSP Domain:**
- Primary: Software Development Security
- Secondary: Security Architecture and Engineering

---

## VENOM SECURITY FINDING — VENOM-SCHED-004

```
Location: cards/schedule/dal/listVportBookingsForProfileDay.read.dal.js — customer PII in column select
Application Scope: VCSM
```

**Current behavior:** `listVportBookingsForProfileDayDAL` selects `customer_name` and `customer_note` in the column list alongside operational booking data. Both fields are returned in the `lanes[].bookings` array and rendered in:
- `BookingDetailModal` (detail view — customer name + note visible)
- `ScheduleOperationalView` (summary view — customer name may appear inline)
- `ScheduleLaneElements` (timeline slot — customer name shown on booking block)

The controller gate (`assertActorOwnsVportActorController` in `loadDayScheduleController`) protects this data from non-owners. RLS (`bookings_select_owner`) provides DB-layer protection.

**Risk:** Data handling observation rather than an active exploit. `customer_note` may contain free-text personal information entered by customers when booking. This content is accessible to the VPORT owner (correct and intended) but should be confirmed as not rendered in debug logs, error payloads, or loading skeletons.

**Severity:** LOW (data is correctly scoped; observation only)

**Exploitability:** LOW (no exploit path; access is correctly owner-restricted)

**Blast Radius:** Single VPORT — one owner's customer data.

**Why it matters:** Booking notes may contain medical information, personal requests, or sensitive context. While rendering them to the VPORT owner is correct, any developer tooling, error reporting, or diagnostic views that serialize the full schedule response could inadvertently expose this data.

**Recommended mitigation:**
1. Confirm `customer_note` is NOT logged to console or error tracking services (e.g., Sentry) in the hook's catch block.
2. Confirm loading skeletons and error states do not serialize or render the `scheduleData` object.
3. If `customer_note` is not currently rendered in the schedule UI, consider removing it from the DAL column select.

**Follow-up command:** SPIDER-MAN (verify PII is not logged in catch blocks)

**CISSP Domain:**
- Primary: Asset Security
- Secondary: Security Operations

---

## VENOM SECURITY FINDING — VENOM-SCHED-005

```
Location: cards/bookings/controller/createOwnerBooking.controller.js — legacy DAL fallback
Application Scope: VCSM
```

**Current behavior:**
```javascript
const vportActorId = resource.owner_actor_id
  ?? await getVportActorIdByProfileIdDAL({ profileId: resource.profile_id });

if (!vportActorId) throw new Error("Could not resolve VPORT ownership.");
```

`createOwnerBookingController` uses `getVportActorIdByProfileIdDAL` as a fallback when `resource.owner_actor_id` is null. This is the legacy profile-based identity resolution path — the architecture contract requires ownership resolution through `actor_owners`, not `profile_id → owner_user_id`.

However, the null guard is explicit (`if (!vportActorId) throw...`), which is correct. There is no null-target ownership check risk here (unlike VENOM-TEAM-007).

**Risk:** Architecture contract violation (legacy `profile_id` path) and potential data inconsistency if `profiles.actor_id` → `actor_owners` and `profiles.owner_user_id` → `actor_owners` have diverged for the resource's profile.

**Severity:** LOW (null guard in place; direct exploit not identified)

**Exploitability:** LOW (requires divergence between legacy and actor model data)

**Blast Radius:** Single booking — one booking creation would fail or use wrong actor for ownership check.

**Why it matters:** Using the legacy resolution path is a long-term correctness risk as actor identity replaces profile-based ownership.

**Recommended mitigation:**
Migrate `getVportActorIdByProfileIdDAL` usages to `actor_owners` lookup. Remove the fallback path once all `vport.resources` rows have non-null `owner_actor_id`.

**Follow-up command:** ARCHITECT (confirm actor_owners migration status for vport.resources owner_actor_id)

**CISSP Domain:**
- Primary: Identity and Access Management
- Secondary: Software Development Security

---

## ARCHITECT ANALYSIS

### SCHED-ARCH-001 — No Final/View Screen Split

**Severity:** MEDIUM (architecture compliance)

`VportDashboardScheduleScreen.jsx` is a single component that handles:
- Route param / prop `actorId` resolution
- `useVportOwnerSchedule` hook wiring
- Modal state management (`createModal`, `detailModal`)
- Desktop vs mobile view state (`mobileView`, `mobileBarberIdx`)
- Component composition (ScheduleGrid, ScheduleOperationalView, ScheduleModals)

Per the architecture contract, this should be split:
- **Final Screen:** Route entry + identity/ownership gate only
- **View Screen:** Hook wiring + component composition

The current structure merges all layers into one component.

### SCHED-ARCH-002 — Dual Resource-Source Merge (Legacy + Actor-Based)

**Severity:** MEDIUM (architecture compliance)

`loadDayScheduleController` calls both:
1. `listVportResourcesByProfileIdDAL({ profileId })` — legacy profile-scoped query
2. `listVportResourcesByOwnerActorIdDAL({ ownerActorId: actorId })` — actor-scoped query

Both are scoped to the verified VPORT (same profileId/actorId), so the data returned is correct. However, the legacy path (`profile_id`-based) is the banned identity model. As the actor model becomes the sole canonical path, the `listVportResourcesByProfileIdDAL` call should be removed once resources have been fully migrated to have non-null `owner_actor_id`.

**SCHEDULE-FIND-001 RESOLUTION:** The preliminary finding asked whether the profile-based path could return orphaned resources. Reading the controller: the `profileId` is resolved from `getVportProfileIdByActorDAL({ actorId })` — where `actorId` is the ownership-verified target VPORT actor. So the profile-based resources are scoped to the same VPORT — no orphaned cross-VPORT resources can appear. SCHEDULE-FIND-001 risk is LOW.

**SCHEDULE-FIND-002 RESOLUTION:** Since both resource sources are scoped to the same verified VPORT, the booking read (scoped to `resourceIds`) cannot surface bookings outside the owner's VPORT. SCHEDULE-FIND-002 is NOT A RISK under the current implementation.

### SCHED-ARCH-003 — Controller Exported from Module Boundary

See VENOM-SCHED-003 above. Architecture compliance concern.

---

## MITIGATION PLAN SUMMARY

| Finding | Severity | Type | Layer to Fix | Follow-up |
|---|---|---|---|---|
| VENOM-SCHED-001 | MEDIUM | Security | Screen (add Final Screen) | SENTRY |
| VENOM-SCHED-002 | MEDIUM | Security | Hook (add callerActorId to dep array) | ELEKTRA |
| VENOM-SCHED-003 | MEDIUM | Architecture | Module boundary (remove controller export) | SENTRY |
| VENOM-SCHED-004 | LOW | Security | Operational (log audit) | SPIDER-MAN |
| VENOM-SCHED-005 | LOW | Security | Controller (migrate to actor_owners) | ARCHITECT |
| SCHED-ARCH-001 | MEDIUM | Architecture | Screen (Final/View split) | SENTRY |
| SCHED-ARCH-002 | MEDIUM | Architecture | Controller (remove legacy resource path) | ARCHITECT |

---

## RESOLVED PRELIMINARY FINDINGS

| Preliminary ID | Resolution |
|---|---|
| SCHEDULE-FIND-001 | NOT A RISK — both resource paths are scoped to the same ownership-verified VPORT actor via `profileId = getVportProfileIdByActorDAL(actorId)`. Profile-based resources are the same actor's resources. |
| SCHEDULE-FIND-002 | NOT A RISK — booking read is scoped to the merged resource IDs, all of which belong to the same VPORT. No cross-VPORT PII leakage path exists. |
| SCHEDULE-FIND-003 | CONFIRMED as VENOM-SCHED-001 — architecture non-compliance, MEDIUM. No security incident currently. |

---

## CISSP DOMAIN COVERAGE SUMMARY

| CISSP Domain | Findings | Notes |
|---|---:|---|
| Security and Risk Management | 0 | No governance-level risks; controller gate is in place |
| Asset Security | 1 | VENOM-SCHED-004 — customer PII in booking payload |
| Security Architecture and Engineering | 2 | VENOM-SCHED-001 (primary), VENOM-SCHED-003 (secondary) |
| Communication and Network Security | 0 | No public endpoints or network surfaces in this card |
| Identity and Access Management | 3 | VENOM-SCHED-001 (secondary), VENOM-SCHED-002 (primary), VENOM-SCHED-005 (primary) |
| Security Assessment and Testing | 0 | No test files present; no dedicated test gap finding (SPIDER-MAN to follow up) |
| Security Operations | 1 | VENOM-SCHED-004 (secondary) — PII log risk |
| Software Development Security | 3 | VENOM-SCHED-002 (secondary), VENOM-SCHED-003 (primary), VENOM-SCHED-005 (secondary) |

**Uncovered domains:**
- **Communication and Network Security** — out of scope (no public API or route surfaces)
- **Security Assessment and Testing** — no test files found; SPIDER-MAN follow-up queued

**VENOM/ARCHITECT completion status:** COMPLETE — all security and architecture findings classified, CISSP domains assigned, preliminary findings resolved.
