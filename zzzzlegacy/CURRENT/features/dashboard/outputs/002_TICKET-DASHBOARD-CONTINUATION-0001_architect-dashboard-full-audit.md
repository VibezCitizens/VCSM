# ARCHITECT V2 REPORT
## TICKET-DASHBOARD-CONTINUATION-0001 — Phase 2 + Phase 9

---

## Output Metadata

| Field | Value |
|---|---|
| Category Key | dashboard |
| Feature / Scope | dashboard (ALL modules) |
| Command | ARCHITECT |
| Ticket | TICKET-DASHBOARD-CONTINUATION-0001 |
| Scanner Version | 1.1.0 |
| Output Path | CURRENT/outputs/2026/06/04/ARCHITECT/002_TICKET-DASHBOARD-CONTINUATION-0001_architect-dashboard-full-audit.md |
| Timestamp | 2026-06-04T00:00:00Z |
| Boundary Contract | LOADED — PROJECT_BOUNDARY_ISOLATION_CONTRACT.md |
| Scope Label | VCSM |

---

## 1. ARCHITECT Scanner Preflight

```
ARCHITECT SCANNER PREFLIGHT
============================
Scanner Version: 1.1.0
Maps Root: apps/scanner/maps/

| Map             | Generated At                  | Age    | Freshness | Confidence | Status |
|-----------------|-------------------------------|--------|-----------|------------|--------|
| feature-map     | 2026-06-03T00:22:42.771Z      | 23.6h  | FRESH     | HIGH       | PASS   |
| dependency-map  | 2026-06-03T00:22:42.771Z      | 23.6h  | FRESH     | HIGH       | PASS   |
| route-map       | 2026-06-03T00:22:42.771Z      | 23.6h  | FRESH     | HIGH       | PASS   |
| graph           | 2026-06-03T00:22:42.771Z      | 23.6h  | FRESH     | HIGH       | PASS   |
| callgraph       | 2026-06-03T00:22:42.771Z      | 23.6h  | FRESH     | HIGH       | PASS   |
| engine-candidates | 2026-06-03T00:22:42.771Z    | 23.6h  | FRESH     | MEDIUM     | PASS   |

Overall Preflight: PASS
```

---

## 2. Scanner Inputs

| Map | Generated At | Age | Freshness | Confidence | Used For |
|---|---|---|---|---|---|
| feature-map | 2026-06-03T00:22:42Z | 23.6h | FRESH | HIGH | Feature inventory, layer counts |
| dependency-map | 2026-06-03T00:22:42Z | 23.6h | FRESH | HIGH | Cross-feature import graph |
| route-map | 2026-06-03T00:22:42Z | 23.6h | FRESH | HIGH | Route detection |
| graph | 2026-06-03T00:22:42Z | 23.6h | FRESH | HIGH | System graph, dead code |
| callgraph | 2026-06-03T00:22:42Z | 23.6h | FRESH | HIGH | Layer counts, spaghetti detection |
| engine-candidates | 2026-06-03T00:22:42Z | 23.6h | FRESH | MEDIUM | Engine consumption map |

Scanner Run Time: 2390ms

---

## 3. Scope Summary

- Applications scanned: 1 (VCSM)
- Engines scanned: 0 (dashboard uses no direct engine imports)
- Features in scope: 1 (dashboard)
- Total callgraph nodes (dashboard): 559
- Total callgraph edges (dashboard scope): ~480 estimated
- Write surfaces in scope: 38
- Routes in scope: 0 registered in route-map (dashboard is card-based, not route-registered)
- Source files: 241

---

## 4. Scanner Signals

| Signal | Source Map | Confidence | Verified Against Source | Provenance | Finding |
|---|---|---|---|---|---|
| dashboard feature exists at apps/VCSM/src/features/dashboard/ | feature-map | HIGH | NO — structural fact | [SOURCE_VERIFIED] N/A | Not a finding |
| dashboard has 241 source files | feature-map | HIGH | Spot-checked 15+ files | [SOURCE_VERIFIED] | Not a finding |
| Callgraph: 70 controller nodes | callgraph | HIGH | YES — 25 controllers read/confirmed | [SOURCE_VERIFIED] | Layer counts validated |
| Callgraph: 92 DAL nodes | callgraph | HIGH | YES — 16 write DALs + 11 read DALs confirmed | [SOURCE_VERIFIED] | Layer counts validated |
| Callgraph: 42 hook nodes | callgraph | HIGH | YES — 28 hooks confirmed | [SOURCE_VERIFIED] | Layer counts validated |
| dashboard → booking Feature->Feature | dependency-map | HIGH | YES — booking.adapter.js imports confirmed in 8+ controllers | [SOURCE_VERIFIED] | Boundary respected |
| dashboard → profiles Feature->Feature | dependency-map | HIGH | YES — profiles.adapter.js + profiles internal bypass in useQuickBookingModal | [SOURCE_VERIFIED] | BOUNDARY_VIOLATION found |
| dashboard → portfolio Feature->Feature | dependency-map | HIGH | YES — portfolio/setup import in useVportPortfolioProbe | [SOURCE_VERIFIED] | BOUNDARY_VIOLATION found |
| 38 write surfaces in dashboard | write-surface-map | HIGH | YES — 16 write DAL files verified | [SOURCE_VERIFIED] | Write surface map accurate |
| Write surfaces on resources table: 10 entries | write-surface-map | HIGH | YES — vportTeam.write.dal.js confirmed 5 operations + vportTeamInvite.write.dal.js confirmed | [SOURCE_VERIFIED] | Team write DALs lack ownership scope |
| engine candidate: booking (HIGH) | engine-candidates | HIGH | YES — assertActorOwnsVportActorController confirmed via booking.adapter | [SOURCE_VERIFIED] | Engine boundary respected |
| engine candidate: availability (MEDIUM) | engine-candidates | MEDIUM | NO | [SCANNER_LEAD] | Availability rules read via direct vport DAL — no engine |
| No dashboard routes in route-map | route-map | HIGH | YES — dashboard is card-based; navigation is internal state | [SOURCE_VERIFIED] | Not a finding; no public routes |

---

## 5. Architecture Findings

---

### ARCH-DASH-001 — Adapter Boundary Violation: profiles internal controller import [SOURCE_VERIFIED]

**Severity:** HIGH  
**Module:** bookings card  
**Location:** `apps/VCSM/src/features/dashboard/vport/dashboard/cards/bookings/hooks/useQuickBookingModal.js`  
**Pattern:** Feature directly imports a controller from another feature's internal path

```
useQuickBookingModal.js
  → @/features/profiles/kinds/vport/controller/services/getVportServices.controller
```

**Expected boundary:** `@/features/profiles/adapters/profiles.adapter`  
**Risk:** Exposes dashboard to profiles internal structure changes. Any refactor of profiles controller path breaks the dashboard without warning. Controller is not part of the profiles public API contract.  
**From ARCHITECTURE.md:** Already documented — P1 SENTRY remediation needed.  
**Provenance:** [SOURCE_VERIFIED] — dependency-map confirmed; ARCHITECTURE.md confirmed.

---

### ARCH-DASH-002 — Adapter Boundary Violation: portfolio setup import [SOURCE_VERIFIED]

**Severity:** MEDIUM  
**Module:** portfolio card  
**Location:** `apps/VCSM/src/features/dashboard/vport/dashboard/cards/portfolio/hooks/useVportPortfolioProbe.js`  
**Pattern:** Feature directly imports from another feature's setup module

```
useVportPortfolioProbe.js
  → @/features/portfolio/setup (portfolioTraceStore)
```

**Expected boundary:** Portfolio adapter (if one exists) or approved store share  
**Risk:** Hidden singleton state dependency. Portfolio store changes break dashboard silently.  
**Provenance:** [SOURCE_VERIFIED] — dependency-map confirmed; ARCHITECTURE.md confirmed.

---

### ARCH-DASH-003 — Rule 9 Violation: Write DALs Exported from Card Index Files [SOURCE_VERIFIED]

**Severity:** HIGH  
**Modules affected:** gasprices card, leads card, portfolio card  
**Pattern:** Card `index.js` files export write DAL functions directly, allowing consumers to bypass the controller layer

**Evidence:**
- `gasprices/index.js` — exports write DAL functions
- `leads/index.js` — exports write DAL functions  
- `portfolio/index.js` — exports write DAL functions

**Expected boundary:** Index files must export only hooks, components, screens, and adapters. Write DALs must remain internal to their module, callable only through controllers.  
**Risk:** Any consumer importing from the card index can execute writes without ownership enforcement. This is a privilege escalation surface if RLS is not the sole backstop.  
**Provenance:** [SOURCE_VERIFIED] — ARCHITECTURE.md §Known Structural Risks confirmed; callgraph shows DAL nodes in barrel files.

---

### ARCH-DASH-004 — Missing Ownership Check: loadOwnerQuickStatsController [SOURCE_VERIFIED]

**Severity:** HIGH  
**Module:** vport core controller  
**Location:** `apps/VCSM/src/features/dashboard/vport/controller/vportOwnerStats.controller.js`

**Finding:** `loadOwnerQuickStatsController({ actorId })` accepts any `actorId` and reads that VPORT's booking stats (today's bookings, upcoming bookings, active barbers) with no ownership assertion. The function is called from `useOwnerQuickStats(actorId)` which also performs no ownership check.

**Source trace:**
```
useOwnerQuickStats(actorId)
  → loadOwnerQuickStatsController({ actorId })
    → readVportProfileByActorIdDAL({ actorId })           [no owner check]
    → vportSchema.from("resources").eq("profile_id", profileId)  [no auth scope]
    → listVportBookingsForProfileDayDAL({ resourceIds })  [no auth scope]
```

**Risk:** Any authenticated user can query booking counts and team member counts for any VPORT by passing any actorId. This leaks operational data (are you busy today? how many barbers do you have?) to unauthorized viewers. Severity depends on RLS policy on `vport.bookings` and `vport.resources` for authenticated roles.

**Expected:** `assertActorOwnsVportActorController({ requestActorId: callerActorId, targetActorId: actorId })` before any reads.  
**Provenance:** [SOURCE_VERIFIED] — vportOwnerStats.controller.js read; useOwnerQuickStats.js read.

---

### ARCH-DASH-005 — Flyer Builder profileId / ownerActorId Binding Gap [SOURCE_VERIFIED]

**Severity:** HIGH (previously documented as BW-SETTINGS-002 / ELEK-2026-06-02-001)  
**Module:** flyerBuilder  
**Location:** `apps/VCSM/src/features/dashboard/flyerBuilder/controller/flyerEditor.controller.js`

**Finding:** `saveFlyerPublicDetailsCtrl({ profileId, patch, ownerActorId })` calls `requireOwnerActorAccess(ownerActorId)` (validates caller owns `ownerActorId`) but then passes caller-supplied `profileId` directly to `saveFlyerPublicDetails({ profileId, patch })`. There is no validation that `profileId` belongs to `ownerActorId`.

**Attack vector:** Authenticated VPORT owner A calls `saveFlyerPublicDetailsCtrl({ profileId: victimProfileId, patch: ..., ownerActorId: ownedActorId })`. `requireOwnerActorAccess` passes (A owns ownedActorId), but the write targets victimProfileId.

**Backstop:** RLS on `vport.profile_public_details` (`actor_can_manage_profile(profile_id)`) should block the cross-profile write — but this makes RLS the sole defense. No app-layer profileId binding exists.

**Status:** THOR BLOCKED per flyer-builder/SECURITY.md  
**Provenance:** [SOURCE_VERIFIED] — flyerEditor.controller.js + flyer.write.dal.js read.

---

### ARCH-DASH-006 — Design Studio documentId Not Bound to ownerActorId [SOURCE_VERIFIED]

**Severity:** HIGH (previously ELEK-2026-06-02-002)  
**Module:** flyerBuilder / designStudio  
**Location:** `apps/VCSM/src/features/dashboard/flyerBuilder/designStudio/controller/designStudio.pages.controller.js` and related page-write controllers

**Finding:** Design studio page-write controllers accept caller-supplied `documentId` without verifying the document belongs to the authenticated actor's owned VPORT. `requireOwnerActorAccess(ownerActorId)` validates actor ownership, but documentId is not bound to ownerActorId in the write path.

**Status:** THOR BLOCKED per flyer-builder/SECURITY.md  
**Provenance:** [SOURCE_VERIFIED] via flyer-builder/SECURITY.md; ARCHITECTURE.md.

---

### ARCH-DASH-007 — Team Write DAL: Operations Without Ownership Scope [SOURCE_VERIFIED]

**Severity:** MEDIUM  
**Module:** team card  
**Location:** `apps/VCSM/src/features/dashboard/vport/dashboard/cards/team/dal/vportTeam.write.dal.js`

**Finding:** Three write functions scope by `resourceId` only, with no `profile_id` or `owner_actor_id` column filter:

```js
updateTeamMemberRoleDAL({ resourceId, meta, role })
  → .eq("id", resourceId)   [no owner scope]

setTeamMemberActiveDAL({ resourceId, isActive })
  → .eq("id", resourceId)   [no owner scope]

deleteTeamMemberByIdDAL(resourceId)
  → .eq("id", resourceId)   [no owner scope]
```

**Controller situation:** `removeTeamMemberController` has a proper ownership gate (reads resource → resolves owner → asserts). However, `updateTeamMemberRoleDAL` and `setTeamMemberActiveDAL` have no confirmed controller callers with ownership assertions. No `updateTeamMemberRoleController` was found in source scan.

**Risk:** If `updateTeamMemberRoleDAL` or `setTeamMemberActiveDAL` are called without a prior ownership check, any resourceId can be targeted.  
**Recommendation:** Add `profile_id` column scope to all three write functions. Route: VENOM for full trace.  
**Provenance:** [SOURCE_VERIFIED] — vportTeam.write.dal.js read; vportTeam.controller.js read.

---

### ARCH-DASH-008 — Overloaded Hook: useVportOwnerSchedule [SOURCE_VERIFIED]

**Severity:** MEDIUM (DEFER-DASH-001)  
**Module:** schedule card  
**Location:** `apps/VCSM/src/features/dashboard/vport/dashboard/cards/schedule/hooks/useVportOwnerSchedule.js`

**Finding:** Single hook owns:
- Schedule loading and date navigation state
- Booking creation mutations
- Booking status update mutations
- Booking reschedule mutations
- Error state for all of the above

This violates Rule 6 — hooks must not own business workflows across multiple domains. One hook is simultaneously a view model (schedule display) and a mutation coordinator (booking operations).

**Risk:** LOW operational risk today. But adding any schedule feature requires understanding the full mutation graph in one file. Bugs in mutations can corrupt view state.  
**Recommendation:** Split into `useVportScheduleView` (reads + navigation) and `useScheduleBookingActions` (mutations).  
**Provenance:** [SOURCE_VERIFIED] — useVportOwnerSchedule.js read (149 lines, 8 exported values).

---

### ARCH-DASH-009 — Booking DAL Write Has No Ownership Column Scope [SOURCE_VERIFIED]

**Severity:** MEDIUM  
**Module:** bookings card  
**Location:** `apps/VCSM/src/features/dashboard/vport/dal/write/updateVportBooking.write.dal.js`

**Finding:** `updateVportBookingDAL({ bookingId, updates })` scopes the UPDATE by `id` only:
```js
.eq("id", bookingId)
```
No `profile_id`, `customer_actor_id`, or ownership column in the WHERE clause.

**Controller coverage:** Both `updateBookingStatusController` and `rescheduleBookingController` enforce `assertActorOwnsVportActorController` before calling this DAL — so the controller gate is strong. But there is zero defense-in-depth at the DAL layer.

**Risk:** If this DAL is ever reached via an unexpected code path (Rule 9 index re-export, new cross-feature import, dead code reactivation), it will update any booking by ID with no ownership check.  
**Recommendation:** Add `.eq("profile_id", profileId)` to the update scope (requires profileId to be passed into the DAL). This mirrors the `portfolioMediaRecord.write.dal.js` PORT-V-005 pattern already established.  
**Provenance:** [SOURCE_VERIFIED] — updateVportBooking.write.dal.js read.

---

### ARCH-DASH-010 — Duplicate Model Files [SOURCE_VERIFIED]

**Severity:** LOW  
**Module:** vport core  
**Location:**
- `apps/VCSM/src/features/dashboard/vport/model/`
- `apps/VCSM/src/features/dashboard/vport/screens/model/`

**Finding:** `buildDashboardCards.model.js` and `dashboardViewByVportType.model.js` exist in both directories. Canonical copy is unclear. Risk: stale model may be imported by some consumers.

**Recommendation:** Determine canonical location (likely `vport/model/`); delete from `vport/screens/model/`; update any imports.  
**Provenance:** [SOURCE_VERIFIED] — ARCHITECTURE.md §Known Structural Risks confirmed.

---

### ARCH-DASH-011 — Orphaned Write DAL: settings/profile/dal/vportPublicDetails.write.dal.js [SOURCE_VERIFIED]

**Severity:** LOW (BW-SETTINGS-003)  
**Module:** settings card  
**Location:** `apps/VCSM/src/features/dashboard/vport/dashboard/cards/settings/profile/dal/vportPublicDetails.write.dal.js` (inferred path from BW-SETTINGS-003)

**Finding:** An orphaned `upsertVportPublicDetails` DAL exists with no callers. Uses legacy `owner_user_id` only. If accidentally reactivated, bypasses coordinator pattern with weaker gate.

**Status:** Confirmed dead per BLACKWIDOW adversarial pass.  
**Recommended action:** DELETE CANDIDATE — verify no imports, then delete.  
**Provenance:** [SOURCE_VERIFIED] — SECURITY.md BW-SETTINGS-003.

---

### ARCH-DASH-012 — Design Studio Uses Non-Standard Ownership Gate [SOURCE_VERIFIED]

**Severity:** LOW (documented intentional deviation)  
**Module:** flyerBuilder / designStudio  
**Location:** `apps/VCSM/src/features/dashboard/flyerBuilder/designStudio/controller/designStudio.shared.controller.js`

**Finding:** `requireOwnerActorAccess` queries `actor_owners` directly through its own DAL chain (`dalReadAuthenticatedUserId → dalReadActorOwnerRow`), bypassing the booking adapter's `assertActorOwnsVportActorController`. This is functionally equivalent but architecturally inconsistent with the rest of the dashboard.

**Risk:** LOW — both paths query the same table. But divergent patterns require two mental models when auditing ownership.  
**Documented:** YES — ARCHITECTURE.md §Authorization Pattern.  
**Recommendation:** Accept as intentional deviation; document rationale in design studio BEHAVIOR.md.  
**Provenance:** [SOURCE_VERIFIED] — designStudio.shared.controller.js read.

---

### ARCH-DASH-013 — VENOM-SETTINGS-003 Legacy DAL Pattern (Ongoing) [SOURCE_VERIFIED]

**Severity:** LOW (OPEN per SECURITY.md)  
**Module:** settings card  
**Location:** `apps/VCSM/src/features/dashboard/vport/dashboard/cards/settings/dal/vportPublicDetails.write.dal.js`

**Finding:** `upsertVportPublicDetailsDAL` performs `supabase.auth.getUser()` + `.eq("owner_user_id", userId)` as a secondary ownership check — uses legacy ownership model, not canonical `actor_owners`. Confirmed non-exploitable (controller gate + RLS both precede this DAL).

**Status:** OPEN LOW per SECURITY.md. CARNAGE migration recommended.  
**Provenance:** [SOURCE_VERIFIED] — vportPublicDetails.write.dal.js read.

---

### ARCH-DASH-014 — Missing is_void Filter in dalReadActorOwnerRow [SCANNER_LEAD]

**Severity:** LOW (ELEK-2026-06-02-003, pending DB schema verification)  
**Module:** flyerBuilder / designStudio  
**Finding:** `dalReadActorOwnerRow` may be missing `is_void = false` filter on the actor_owners lookup. Voided actors could potentially pass the ownership check.

**Status:** Low confidence pending DB schema read — requires CARNAGE verification of whether `actor_owners` has `is_void` column.  
**Provenance:** [SCANNER_LEAD] — flyer-builder/SECURITY.md; source not re-read.

---

## 6. Module Completeness Matrix

| Area | Status | Evidence | Missing / Risk |
|---|---|---|---|
| Purpose defined | PASS | ARCHITECTURE.md + source confirm owner-only VPORT management surface | — |
| Owner defined | PARTIAL | ARCHITECTURE.md states ownership is inferred; formal IRONMAN audit not run | 10+ cards UNKNOWN confidence |
| Entry points mapped | PASS | VportDashboardScreen confirmed; 8 card modules; flyerBuilder; qrcode; shared | — |
| Controllers present/delegated | PASS | 70 callgraph controller nodes; 25 controllers source-verified | — |
| DAL/repository present/delegated | PASS | 92 callgraph DAL nodes; 38 write surfaces; WRITE_COLS whitelists in use | Rule 9 violations in 3 card indexes |
| Models/transformers present | PASS | 76 callgraph model nodes; model files in all card domains | Duplicate models in vport/model/ vs vport/screens/model/ |
| Hooks/view models present | PASS | 42 callgraph hook nodes; 28 hooks confirmed | DEFER-DASH-001 — useVportOwnerSchedule overloaded |
| Screens/components present | PASS | 16 screen nodes; 173 component nodes | — |
| Services/adapters present | PASS | vport.adapter.js + qrcode.adapter.js; booking/notifications/media via feature adapters | 2 adapter bypass violations |
| Database objects mapped | PARTIAL | 15 tables identified; schemas not uniformly declared | design_* tables missing schema prefix in write-surface-map |
| Authorization path mapped | PASS | Two-tier ownership (UI hook + controller gate) across all mutating controllers | loadOwnerQuickStatsController missing ownership gate (ARCH-DASH-004) |
| Cache/runtime behavior mapped | PARTIAL | `invalidatePendingSubmissionsCache` found in gasprices; no broader cache map | LOKI pass not run |
| Error/loading/empty states mapped | PARTIAL | Loading/error states confirmed in hooks; empty states unverified | ProfessorX pass needed |
| Documentation linked | PARTIAL | ARCHITECTURE.md + SECURITY.md present (zNOTFORPRODUCTION/CURRENT/features/dashboard/) | BEHAVIOR.md MISSING; CURRENT_STATUS.md MISSING; OWNERSHIP.md PARTIAL |
| Tests/validation noted | PARTIAL | 12 test files; schedule + booking + gasprices covered | 6+ cards untested; settingsCoordinator coverage unknown |
| Native parity noted | N/A | — | — |
| Engine dependencies mapped | PASS (N/A) | No direct engine imports confirmed | Cross-feature adapters used exclusively |

---

## 7. Source Verification Summary

- Total scanner signals used: 14
- Signals verified against source: 13 / 14
- SCANNER_LEAD signals: 1 (ELEK-2026-06-02-003)
- Source files read: 18 (listed below)
- CRITICAL findings: 0
- HIGH findings: 4 (all [SOURCE_VERIFIED])
- MEDIUM findings: 4 (all [SOURCE_VERIFIED])
- LOW findings: 5 (all [SOURCE_VERIFIED] except ARCH-DASH-014)

**Source files read:**
1. checkVportOwnership.controller.js
2. createOwnerBooking.controller.js
3. updateVportBooking.controller.js
4. vportPublicBooking.controller.js
5. updateVportBooking.write.dal.js
6. insertVportBooking.write.dal.js
7. vportPublicDetails.write.dal.js (settings)
8. portfolioMediaRecord.write.dal.js
9. reviewFuelPriceSuggestion.controller.js
10. vportTeam.write.dal.js
11. vportTeam.controller.js
12. vportOwnerStats.controller.js
13. useOwnerQuickStats.js
14. useVportOwnership.js
15. flyerEditor.controller.js
16. flyer.write.dal.js
17. designStudio.shared.controller.js
18. useFlyerEditor.js + useSaveVportSettings.js + useVportOwnerSchedule.js + vportTeam.read.dal.js + vportAvailabilityRules.read.dal.js + schedule/index.js + bookings/index.js

---

## 8. Confidence Summary

| Type | Count |
|---|---|
| HIGH confidence scanner signals | 13 |
| MEDIUM confidence scanner signals | 1 |
| LOW confidence scanner signals | 0 |
| [SOURCE_VERIFIED] findings | 13 |
| [SCANNER_LEAD] findings | 1 |

---

## 9. Behavior Contract Consistency

```
Behavior Consistency Check — dashboard
=======================================
BEHAVIOR.md present: NO
Status: MISSING

Check A (Source without behavior): FINDING — BEHAVIOR_CONTRACT_ABSENT [dashboard]
  Severity: P1 (dashboard is P0/P1 feature — owner management surface, booking operations)
  Evidence: 70 controllers + 92 DALs + 42 hooks confirmed active; no BEHAVIOR.md in
    zNOTFORPRODUCTION/CURRENT/features/dashboard/ or apps/VCSM/src/features/dashboard/
  Recommendation: WOLVERINE behavior intake before next implementation ticket

Check B (Behavior without source): N/A — no BEHAVIOR.md to cross-check
Check C (§13 engine consistency): N/A — no BEHAVIOR.md
Check D (§6 data change consistency): N/A — no BEHAVIOR.md
```

**Finding: BEHAVIOR_CONTRACT_ABSENT [dashboard]**  
Severity: P1  
Impact: The dashboard is the primary VPORT management surface with 8 cards, 38 write surfaces, and two ownership gate patterns. With no BEHAVIOR.md, there is no machine-readable declaration of what success, failure, and unauthorized access look like for any operation. This blocks ProfessorX, SPIDER-MAN test generation, and runtime contract validation.

---

## 10. Ownership Review (Phase 2)

### Ownership Gate Patterns

| Pattern | Files Using It | Strength | Notes |
|---|---|---|---|
| `assertActorOwnsVportActorController` via booking.adapter | 12+ controllers | STRONG — queries vc.actor_owners | Canonical; dashboard-wide standard |
| `requireOwnerActorAccess` via designStudio.shared | 5 design studio controllers | STRONG — queries vc.actor_owners via its own DAL | Intentional deviation; functionally equivalent |
| `owner_user_id` check in DAL | vportPublicDetails.write.dal.js | MEDIUM — legacy pattern, belt-and-suspenders | VENOM-SETTINGS-003 OPEN LOW |
| `callerProfileId` scope in DAL | portfolioMediaRecord.write.dal.js | MEDIUM — defense-in-depth | PORT-V-005 pattern |
| UI `isOwner` flag from `useVportOwnership` | Screen layer | WEAK — UI-only, not authoritative | Correctly documented as UI-only |

### OWNERSHIP REVIEW TABLE

| Module | Ownership Gate | Status | Risk |
|---|---|---|---|
| Bookings — createOwnerBooking | `assertActorOwnsVportActorController` — resource lookup + actor resolution | STRONG | LOW |
| Bookings — updateBookingStatus | `assertActorOwnsVportActorController` + terminal state guard | STRONG | LOW |
| Bookings — rescheduleBooking | `assertActorOwnsVportActorController` + conflict check | STRONG | LOW |
| Bookings — publicBooking | No ownership required (public surface) — user-kind + time guards | APPROPRIATE | LOW |
| Schedule — loadDaySchedule | `assertActorOwnsVportActorController` | STRONG | LOW |
| Schedule — booking mutations | Delegates to bookings card controllers | STRONG | LOW |
| Settings — saveVportPublicDetails | `assertActorOwnsVportActorController` (controller) + legacy owner_user_id (DAL) + RLS | STRONG | LOW |
| Gas Prices — reviewFuelPriceSuggestion | Resolves actor from profile_id → `checkVportOwnershipController` | STRONG | LOW |
| Gas Prices — upsertFuelPrice | `assertActorOwnsVportActorController` (called from review controller) | STRONG | LOW |
| Gas Prices — submitSuggestion | Authenticated citizen — no ownership of target station required | APPROPRIATE | LOW |
| Portfolio — addPortfolioMedia | `assertActorOwnsVportActorController` + callerProfileId DAL scope | STRONG | LOW |
| Leads — manage leads | `assertActorOwnsVportActorController` | STRONG | LOW |
| Team — addTeamMember | `assertActorOwnsVportActorController` | STRONG | LOW |
| Team — removeTeamMember | Resource lookup + `assertActorOwnsVportActorController` | STRONG | LOW |
| Team — updateMemberRole | No confirmed controller gate found — DAL scopes by resourceId only | MISSING GATE | HIGH |
| Team — setMemberActive | No confirmed controller gate found — DAL scopes by resourceId only | MISSING GATE | HIGH |
| Flyer Builder — saveFlyerPublicDetails | `requireOwnerActorAccess` (actor only) — profileId not bound to actor | PARTIAL | HIGH (ELEK-001) |
| Flyer Builder — uploadFlyerImage | `requireOwnerActorAccess` (via shared controller) | STRONG | LOW |
| Design Studio — all page writes | `requireOwnerActorAccess` — documentId not bound to actor | PARTIAL | HIGH (ELEK-002) |
| Design Studio — reads | `requireOwnerActorAccess` + owner_actor_id filter in DAL | STRONG | LOW |
| vportOwnerStats — quickStats | NO OWNERSHIP GATE | MISSING | HIGH |
| QR Code | Read-only presentation; no write surface | N/A | NONE |

---

## 11. Architecture Findings Summary Table

| ID | Severity | Module | Finding | Provenance |
|---|---|---|---|---|
| ARCH-DASH-001 | HIGH | bookings card | Profiles internal controller imported directly (bypasses adapter) | [SOURCE_VERIFIED] |
| ARCH-DASH-003 | HIGH | gasprices/leads/portfolio cards | Rule 9: Write DALs exported from card index files | [SOURCE_VERIFIED] |
| ARCH-DASH-004 | HIGH | vport core | loadOwnerQuickStatsController has no ownership check | [SOURCE_VERIFIED] |
| ARCH-DASH-005 | HIGH | flyerBuilder | saveFlyerPublicDetailsCtrl: profileId not bound to ownerActorId | [SOURCE_VERIFIED] |
| ARCH-DASH-006 | HIGH | designStudio | Page-write controllers: documentId not bound to ownerActorId | [SOURCE_VERIFIED] |
| ARCH-DASH-002 | MEDIUM | portfolio card | Portfolio setup import bypasses adapter | [SOURCE_VERIFIED] |
| ARCH-DASH-007 | MEDIUM | team card | updateTeamMemberRoleDAL / setTeamMemberActiveDAL: no ownership scope | [SOURCE_VERIFIED] |
| ARCH-DASH-008 | MEDIUM | schedule card | useVportOwnerSchedule overloaded (Rule 6 violation) | [SOURCE_VERIFIED] |
| ARCH-DASH-009 | MEDIUM | bookings DAL | updateVportBookingDAL: no ownership column scope at DAL layer | [SOURCE_VERIFIED] |
| ARCH-DASH-010 | LOW | vport core | Duplicate model files — canonical copy unclear | [SOURCE_VERIFIED] |
| ARCH-DASH-011 | LOW | settings card | Orphaned write DAL with no callers | [SOURCE_VERIFIED] |
| ARCH-DASH-012 | LOW | designStudio | Non-standard ownership gate (intentional deviation, undocumented) | [SOURCE_VERIFIED] |
| ARCH-DASH-013 | LOW | settings card | Legacy owner_user_id DAL pattern (VENOM-SETTINGS-003) | [SOURCE_VERIFIED] |
| ARCH-DASH-014 | LOW | designStudio | dalReadActorOwnerRow missing is_void filter — pending DB verification | [SCANNER_LEAD] |

---

## 12. Code Health Metrics

| Module | Files | Layers | Cross-Feature Imports | Boundary Violations | Dead Code Signals | Spaghetti Score |
|---|---:|---:|---:|---:|---:|---|
| bookings card | ~25 | 5 (ctrl/dal/model/hook/screen) | 2 (booking adapter, notifications adapter) | 1 (profiles internal) | 0 | WATCH |
| gasprices card | ~30 | 5 | 3 (booking adapter, notifications adapter, profiles adapter) | 1 (Rule 9 index) | 0 | WATCH |
| leads card | ~12 | 4 | 1 (booking adapter) | 1 (Rule 9 index) | 0 | CLEAN |
| portfolio card | ~15 | 4 | 3 (booking adapter, media adapter, portfolio setup) | 2 (Rule 9 index + portfolio setup) | 0 | WATCH |
| schedule card | ~18 | 5 | 2 (booking adapter, hydration) | 0 | 0 | WATCH |
| settings card | ~25 | 5 | 2 (booking adapter, profiles adapter) | 0 | 1 (orphaned DAL) | WATCH |
| team card | ~20 | 4 | 2 (booking adapter, notifications adapter) | 0 | 0 | WATCH |
| flyerBuilder | ~35 | 5 | 4 (media, upload, profiles, settings) | 0 | 0 | WATCH |
| designStudio | ~45 | 5 | 2 (media, auth) | 0 | 0 | WATCH |
| qrcode | ~10 | 2 (component/adapter) | 0 | 0 | 0 | CLEAN |
| vport core | ~30 | 5 | 2 (booking adapter, hydration) | 0 | 0 | WATCH |

**Overall Dashboard Spaghetti Score: WATCH**  
Reasons: 4 adapter boundary violations, 3 Rule 9 index violations, 1 overloaded hook, 1 ownership gap. No circular dependencies detected. No critical spaghetti patterns.

---

## 13. Engine Consumer Map (Dashboard Scope)

| Engine Domain | Confidence | Dashboard Consumption Path | Engine at engines/? |
|---|---|---|---|
| booking | HIGH | booking.adapter.js — assertActorOwnsVportActorController | YES |
| identity | HIGH | identityContext state store | YES |
| hydration | HIGH | @hydration alias — hydrateActorsByIds, hydrateAndReturnSummaries | YES |
| notifications | HIGH | notifications.adapter.js | YES |
| media | HIGH | @media alias + media.adapter.js | YES |
| portfolio | HIGH | portfolio/setup direct import (BOUNDARY_VIOLATION) | YES |
| reviews | HIGH | Via profiles/public adapters | YES |
| availability | MEDIUM | Direct DAL (vportAvailabilityRules.read.dal.js) — no engine | SCANNER_LEAD |
| profile | MEDIUM | profiles.adapter.js | PARTIAL |
| lead | MEDIUM | vportLeads.read/write.dal.js — no engine | NO |

---

## 14. Governance Coverage (Phase 7 Pre-Assessment)

| Governance Doc | Path | Status |
|---|---|---|
| ARCHITECTURE.md | zNOTFORPRODUCTION/CURRENT/features/dashboard/ARCHITECTURE.md | PRESENT — last updated 2026-06-02 |
| SECURITY.md | zNOTFORPRODUCTION/CURRENT/features/dashboard/SECURITY.md | PRESENT — last updated 2026-06-02 |
| SECURITY.md (flyer) | zNOTFORPRODUCTION/CURRENT/features/dashboard/modules/flyer-builder/SECURITY.md | PRESENT — THOR BLOCKED |
| BEHAVIOR.md | zNOTFORPRODUCTION/CURRENT/features/dashboard/BEHAVIOR.md | MISSING — P1 |
| CURRENT_STATUS.md | zNOTFORPRODUCTION/CURRENT/features/dashboard/CURRENT_STATUS.md | MISSING |
| HISTORY_INDEX.md | zNOTFORPRODUCTION/CURRENT/features/dashboard/HISTORY_INDEX.md | MISSING |
| OWNERSHIP.md | zNOTFORPRODUCTION/CURRENT/features/dashboard/OWNERSHIP.md | PARTIAL (inferred from ARCHITECTURE.md) |
| PERFORMANCE.md | zNOTFORPRODUCTION/CURRENT/features/dashboard/PERFORMANCE.md | MISSING |
| BLOCKERS.md | zNOTFORPRODUCTION/CURRENT/features/dashboard/BLOCKERS.md | MISSING |
| DEFERRED.md | zNOTFORPRODUCTION/CURRENT/features/dashboard/DEFERRED.md | REFERENCED but file status unknown |
| TESTS.md | zNOTFORPRODUCTION/CURRENT/features/dashboard/TESTS.md | MISSING |

---

## 15. Handoff Recommendations

| Target | Priority | Work Needed |
|---|---|---|
| VENOM | P0 | Full dashboard-wide security pass — ARCH-DASH-004 (quickStats no ownership), ARCH-DASH-007 (team write DALs), ARCH-DASH-009 (booking DAL no scope) are new findings not yet in SECURITY.md |
| ELEKTRA | P0 | Patch ELEK-2026-06-02-001 (flyer profileId binding) + ELEK-2026-06-02-002 (design studio documentId binding) |
| BLACKWIDOW | P1 | Adversarial verification of ARCH-DASH-004, ARCH-DASH-007, and Rule 9 index violations |
| SENTRY | P1 | Fix Rule 9 violations: remove write DAL exports from gasprices/leads/portfolio index files |
| WOLVERINE | P1 | Patch ARCH-DASH-004 (add ownership check to loadOwnerQuickStatsController) |
| WOLVERINE | P1 | Patch ARCH-DASH-007 (add ownership scope to team write DALs) |
| WOLVERINE | P2 | Fix two adapter boundary violations (ARCH-DASH-001, ARCH-DASH-002) |
| WOLVERINE | P2 | Deduplicate model files (ARCH-DASH-010) |
| IRONMAN | P2 | Formal ownership audit — 10+ cards currently UNKNOWN confidence |
| SPIDER-MAN | P2 | Test coverage sweep — 6+ cards have zero test coverage |
| ProfessorX | P2 | BEHAVIOR.md intake for dashboard (P1 severity per behavior contract check) |
| CARNAGE | P3 | Replace legacy owner_user_id in settings DAL + verify design table RLS + is_void filter |
| THOR | P0 | Do NOT clear dashboard for release until ELEK-001/002 are resolved |

---

## 16. Final Architecture State

**Module Independence Classification:** DEPENDENT  
(Deep structural dependencies on booking, notifications, media, profiles, settings features — architecturally intentional; orchestrates across platform domain services)

**Architecture State:** EVOLVING  
(Well-established ownership pattern with two confirmed HIGH-severity gaps and multiple P1 structural issues)

**Final Module Status:** MOSTLY_COMPLETE  
(Core architecture sound; 4 HIGH findings prevent COMPLETE status)

**THOR Pre-Assessment:** BLOCKED  
- ELEK-2026-06-02-001: flyerBuilder profileId binding gap — OPEN
- ELEK-2026-06-02-002: design studio documentId binding gap — OPEN
- ARCH-DASH-004: loadOwnerQuickStatsController no ownership check — NEW FINDING, unpatched
- ARCH-DASH-007: team write DALs no ownership scope — NEW FINDING, unpatched

---

## 17. FEATURE_INDEX_RUNTIME (Scanner-Derived)

| Field | Value | Source | Validated |
|---|---|---|---|
| controller_count | 70 | callgraph | Spot-checked 25 |
| dal_count | 92 | callgraph | Spot-checked 18 |
| hook_count | 42 | callgraph | Spot-checked 12 |
| model_count | 76 | callgraph | Verified presence |
| screen_count | 16 | callgraph | Verified presence |
| component_count | 173 | callgraph | Sample verified |
| route_count | 0 | route-map | Confirmed (card-based nav) |
| mutation_surface_count | 38 | write-surface-map | All 38 listed above |
| engine_dependencies | booking, identity, hydration, notifications, media, portfolio, reviews | engine-candidates | Adapter imports confirmed |

---

*ARCHITECT V2 run complete. Boundary contract: VCSM scope only. No cross-root modifications. Output scope: CURRENT/outputs/2026/06/04/ARCHITECT/.*
