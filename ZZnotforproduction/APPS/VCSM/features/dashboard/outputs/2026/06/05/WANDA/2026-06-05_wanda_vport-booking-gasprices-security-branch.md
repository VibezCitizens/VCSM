# WANDA — Independent Red Team Discovery Report

**Date:** 2026-06-05
**Branch:** vport-booking-feed-security-updates
**Mode:** SECURITY_WARFARE_SIMULATION / RED_TEAM / WANDA_BLIND_MODE
**Application Scope:** VCSM
**Session Isolation:** WANDA_BLIND_MODE — CONFIRMED
**Reviewer:** WANDA

---

## WANDA DISCOVERY CHECK

| Check | Status |
|---|---|
| WANDA_BLIND_MODE enforced throughout | PASS |
| Full chain dependency gate passed (all 7 upstream) | PASS |
| Area A: Attack Surface Discovery executed | PASS |
| Area B: Replacement Vulnerability Discovery executed | PASS |
| Area C: Assumption Failure Discovery executed | PASS |
| Area D: Chain Combination Discovery executed | PASS |
| Area E: Release Risk Discovery executed | PASS |

---

## Preflight Summary

All 7 upstream reports verified present, fresh (0 days), scope-matching VCSM, post-patch 2026-06-05.

Patch commit date: 2026-06-05 (inferred from current branch state)
Source tree read: INDEPENDENT — no Blue Team finding narratives loaded before discovery

---

## Area A — Attack Surface Discovery

**Method:** Read controller/DAL/hook source directly. Mapped call chains from entry to mutation.

### Surface Examined: `vportOwnerStats.controller.js`

Surface: `apps/VCSM/src/features/dashboard/vport/controller/vportOwnerStats.controller.js`
Discovery Area: A
Coverage: Not in Blue Team declared scope
Ownership gate: `assertActorOwnsVportActorController({ requestActorId: callerActorId, targetActorId: actorId })` — line 31
Conclusion: CLEAN — properly ownership-gated; not a gap

---

### Surface Examined: `submitCitizenFuelPriceSuggestionController` — actorId trust assumption

Surface: `apps/VCSM/src/features/dashboard/vport/dashboard/cards/gasprices/controller/submitCitizenFuelPriceSuggestion.controller.js`
Discovery Area: A
The controller accepts `actorId` as a parameter and stores it as `submitted_by_actor_id` without verifying it matches the authenticated session.
In the Supabase PWA model, hooks provide `actorId` from `useIdentity()`. This is correct architecture — no direct exploit path from outside the app.
Conclusion: CLEAN — trust model consistent with PWA architecture; undocumented assumption noted in C findings

---

### Surface Examined: Calendar screen feed publish path

──────────────────────────────────────────────────
WANDA-A-001 | ATTACK_SURFACE_GAP_FOUND

Discovery Area: A: Attack Surface Discovery
Risk: MEDIUM

Surface / Path:
  `apps/VCSM/src/features/dashboard/vport/dashboard/cards/calendar/VportDashboardCalendarScreen.jsx`
  → `usePublishBarbershopHoursPost({ actorId })` (line 74)
  → `usePublishLocksmithHoursPost({ actorId })` (line 75)
  → `publishBarbershopHoursPost({ blocks })` called in `handleSaveSuccess` (line 82)
  → `publishLocksmithHoursPost({ blocks })` called in `handleSaveSuccess` (line 87)

Evidence:
  `VportDashboardCalendarScreen.jsx:18` — `from "@/features/profiles/adapters/kinds/vport/vportProfiles.adapter"`
  `VportDashboardCalendarScreen.jsx:74-75` — hook initialization with `actorId` from route params
  `VportDashboardCalendarScreen.jsx:77-92` — `handleSaveSuccess` publishes to feed without re-verifying ownership
  `VportDashboardCalendarScreen.jsx:114` — UI-level `isOwner` guard: renders "You can only manage your own calendar"

Gap Description:
  The calendar screen was modified on this branch to add a "Share these hours to my feed" feature. This invokes `publishBarbershopHoursPost` and `publishLocksmithHoursPost` from the vportProfiles adapter. The screen checks `isOwner` at the UI level, but the controller-level ownership enforcement of these publish hooks was NOT reviewed by any Blue Team command. The Blue Team scope was bookings and gasprices — the calendar's feed publish path falls outside all 7 upstream scopes.

Blast Radius:
  If `publishBarbershopHoursPost` / `publishLocksmithHoursPost` lack controller-level ownership assertions, any actor could publish "hours" system posts on behalf of a VPORT they do not own (by manipulating the UI or calling the hook directly).

Required Action Before THOR Release:
  HAWKEYE or ELEKTRA must review the ownership enforcement in the publish controllers behind `usePublishBarbershopHoursPost` and `usePublishLocksmithHoursPost` before THOR release.

THOR Block: YES
──────────────────────────────────────────────────

---

## Area B — Replacement Vulnerability Discovery

**Method:** Traced the `submitOwnerFuelPriceUpdateController` call chain end-to-end from entry point to DAL.

### Displacement Examined: `ALLOWED_FUEL_KEYS` defense location

──────────────────────────────────────────────────
WANDA-B-001 | TRUST_BOUNDARY_SHIFT_FOUND

Discovery Area: B: Replacement Vulnerability Discovery
Risk: MEDIUM

Surface / Path:
  `apps/VCSM/src/features/dashboard/vport/dashboard/cards/gasprices/controller/submitFuelPriceSuggestion.controller.js` (lines 35-37) — contains ALLOWED_FUEL_KEYS check
  → routes to `submitOwnerFuelPriceUpdate.controller.js` — NO fuelKey validation
  → routes to `upsertVportFuelPriceDAL` — NO fuelKey validation
  → writes `fuel_key` to `fuel_prices` table directly

Evidence:
  `submitFuelPriceSuggestion.controller.js:2` — `import { ALLOWED_FUEL_KEYS } from "@/features/.../gasPrices.model"`
  `submitFuelPriceSuggestion.controller.js:35-37` — `if (!ALLOWED_FUEL_KEYS.has(String(fuelKey).toLowerCase())) return { ok: false, reason: "invalid_fuel_key" }`
  `submitOwnerFuelPriceUpdate.controller.js` — no ALLOWED_FUEL_KEYS import, no fuelKey validation
  `vportFuelPrices.write.dal.js:43` — `if (!fuelKey) throw new Error("fuelKey required")` — only checks for presence, not allowed-list membership
  Caller count: `grep` confirms only ONE caller of `submitOwnerFuelPriceUpdateController` — `submitFuelPriceSuggestionController`

Gap Description:
  The `ALLOWED_FUEL_KEYS` validation exists at the routing controller layer (`submitFuelPriceSuggestionController`), not at the mutation controller layer (`submitOwnerFuelPriceUpdateController`). The mutation controller is a directly-importable module that can be called by any future code without passing through the validation gate.

  Defense location: routing layer
  Required location: mutation controller (at minimum) or DAL-level constraint

Blast Radius:
  Arbitrary `fuelKey` string values can be written to the `fuel_prices` table if `submitOwnerFuelPriceUpdateController` is called directly. Current blast radius: LOW (single caller today). Fragility risk: HIGH (any new caller bypasses validation).

Required Action Before THOR Release:
  ELEKTRA must evaluate whether `ALLOWED_FUEL_KEYS` validation should be moved to `submitOwnerFuelPriceUpdateController` itself. This prevents future callers from bypassing the defense.

THOR Block: YES
──────────────────────────────────────────────────

---

### Clean surface: Booking ownership enforcement on insert vs update

Original concern: is `assertActorOwnsVportActorController` enforced on BOTH booking insert and booking update paths?

Examined:
- `createOwnerBookingController:35-38` — `assertActorOwnsVportActorController` PRESENT
- `createVportPublicBookingController` — kind check present (line 60); customer ownership check via `readActorVportLinkDAL`
- `updateVportBooking.controller.js:1-6` — `assertActorOwnsVportActorController` via adapter PRESENT

Conclusion: CLEAN — ownership assertion present on all booking write paths

---

## Area C — Assumption Failure Discovery

**Method:** Read each controller's implicit trust assumptions against current source.

### Assumption Examined: `publishFuelPriceUpdateAsPostController` ownership gate

──────────────────────────────────────────────────
WANDA-C-001 | NEW_FINDING_CREATED

Discovery Area: C: Assumption Failure Discovery
Risk: HIGH

Surface / Path:
  `apps/VCSM/src/features/dashboard/vport/dashboard/cards/gasprices/controller/publishFuelPriceUpdateAsPost.controller.js`
  Lines 49-56

Evidence:
  ```js
  // Line 49-50 (comment):
  // ✅ SECURITY (F-002): verify actorId is a legitimate VPORT owner via actor_owners.
  // createSystemPost accepts actorId from caller without ownership verification —
  // this gate ensures only verified VPORT owners can post on behalf of their station.
  
  // Line 52-55 (actual code):
  const isValidVport = await checkVportOwnershipController({
    callerActorId: actorId,
    targetActorId: actorId,  // ← SAME VALUE BOTH PARAMS
  });
  if (!isValidVport) return { published: false, status: "failed", reason: "not_owner" };
  ```
  
  `checkVportOwnershipController` source (read independently):
  - If `callerActorId === targetActorId` AND `actor.kind === "vport"` AND `!actor.is_void` → returns `true` (actor_owners query SKIPPED)
  - If user-kind: falls to `assertActorOwnsVportActorController(actorId, actorId)` → user-kind self-shortcut fires → returns `{ok: true}`
  
  Result: for ANY non-void actor (user-kind OR vport-kind), passing `actorId` for both params returns true.

Gap Description:
  The security comment at line 49 states this gate "ensures only verified VPORT owners can post on behalf of their station." The actual behavior: ANY non-void actor (user-kind or vport-kind) passes this gate because the degenerate self-reference (`actorId === actorId`) triggers self-shortcuts in both `checkVportOwnershipController` and `assertActorOwnsVportActorController`.

  The ownership check does NOT query `actor_owners`. It does NOT verify the actor owns a gas station. The comment is materially false.

Blast Radius:
  ANY non-void authenticated actor can call `publishFuelPriceUpdateAsPostController` with their own actorId and successfully publish "fuel_price_update" system posts to the public feed, regardless of whether they own a gas station. The 1-hour throttle (DEDUP_WINDOW_MS) limits frequency to 1 post/hour/actor. The fuelKey filter inside the function (FUEL_LABELS check) prevents arbitrary fuelKey strings in the post payload.

  Impact: feed pollution with fake "fuel_price_update" posts attributed to actors who are not gas station owners. Potential user deception.

Required Action Before THOR Release:
  ELEKTRA: Fix the degenerate self-reference. The gate must pass `targetActorId` as the gas station's actorId (which must be resolved from a legitimate VPORT identity), and `callerActorId` as the authenticated user-kind actor performing the action. The gate must query `actor_owners`.

THOR Block: YES
──────────────────────────────────────────────────

---

### Assumption Examined: Staff member self-authorization in `createOwnerBookingController`

──────────────────────────────────────────────────
WANDA-C-002 | NEW_FINDING_CREATED

Discovery Area: C: Assumption Failure Discovery
Risk: MEDIUM

Surface / Path:
  `apps/VCSM/src/features/dashboard/vport/dashboard/cards/bookings/controller/createOwnerBooking.controller.js`
  Lines 27-38

Evidence:
  ```js
  // Line 30-32:
  const vportActorId = resource.owner_actor_id
    ?? await getVportActorIdByProfileIdDAL({ profileId: resource.profile_id });
  
  // Line 35-38:
  await assertActorOwnsVportActorController({
    requestActorId: callerActorId,
    targetActorId: vportActorId,  // ← derived from resource.owner_actor_id
  });
  ```
  
  In `assertActorOwnsVportActorController`:
  - If `requestActorId === targetActorId` AND actor is `user-kind` → user-kind self-shortcut fires → `{ok: true, mode: "self"}` — `actor_owners` NOT queried

Gap Description:
  Assumption: `vportActorId` resolved from `resource.owner_actor_id` is always a VPORT-kind actor.
  Reality: `resource.owner_actor_id` can be a staff member's user-kind actor ID (e.g., a barber assigned to a chair). When a staff member calls `createOwnerBookingController` with their own `callerActorId`, and `resource.owner_actor_id` is their own actor ID, the authorization call becomes `assertActorOwnsVportActorController(staffId, staffId)` — the user-kind self-shortcut fires, and `actor_owners` is never consulted.

  The staff member "self-authorizes" to create owner-sourced confirmed bookings for their own resource without the VPORT owner being involved in the authorization check.

Blast Radius:
  Staff members with assigned resources can create "source: owner, status: confirmed" bookings for their own resource slots. This may be intended behavior (barbers should be able to create walk-in bookings). However, the authorization assumption is undocumented and the behavior depends on the self-shortcut, which was designed for user identity checks — not for resource ownership authorization.

Required Action Before THOR Release:
  VENOM: Assess whether staff self-authorization for owner bookings is intended business behavior. If yes: document the invariant. If no: `createOwnerBookingController` must explicitly verify the caller is the VPORT owner via `actor_owners`, not just the resource's `owner_actor_id`.

THOR Block: NO (documentation gap — requires business decision before classification upgrades)
──────────────────────────────────────────────────

---

### Assumption Examined: `submitOwnerFuelPriceUpdateController` single-caller defense

Assumption: `ALLOWED_FUEL_KEYS` is enforced because `submitOwnerFuelPriceUpdateController` only has one caller.
Enforcement mechanism: Currently valid — grep confirms single caller.
Failure condition: Any future module that imports `submitOwnerFuelPriceUpdateController` directly.
Current code state: ASSUMPTION_VALID but fragile.
Finding: see WANDA-B-001 (already classified)

---

## Area D — Chain Combination Discovery

**Method:** Composed attack chains from individually-valid operations.

### Chain Examined: Staff self-authorization + owner booking creation

Chain Type: STATE_MANIPULATION
Steps:
  1. VPORT owner assigns staff member by setting `resource.owner_actor_id = staffActorId` (DB state)
  2. Staff calls `createOwnerBookingController({ callerActorId: staffActorId, resourceId })`
  3. Controller resolves `vportActorId = resource.owner_actor_id = staffActorId` (line 30)
  4. `assertActorOwnsVportActorController({ requestActorId: staffActorId, targetActorId: staffActorId })` — auth: BYPASSED VIA SELF-SHORTCUT
  5. Owner booking created with `status: "confirmed", source: "owner"` — auth: ABSENT at DB level

Authorization check per step: Step 2 — present (self-shortcut fires). Step 5 — absent (DB has no constraint preventing this).
Final impact: Staff member creates confirmed owner bookings without VPORT owner direct authorization.
Chain verdict: CHAIN_CONFIRMED — see WANDA-C-002

---

### Chain Examined: Any-actor fuel price post feed injection

Chain Type: WORKFLOW_ABUSE
Steps:
  1. Attacker (any non-void actor) calls `publishFuelPriceUpdateAsPostController({ actorId: self, updatedFuels: [...] })`
  2. `checkVportOwnershipController({ actorId: self, actorId: self })` — auth: BYPASSED VIA SELF-SHORTCUT → returns true
  3. `hasRecentFuelPricePostDAL` dedup check passes if no post in last 60 minutes
  4. `createSystemPost` publishes "fuel_price_update" post to public feed — auth: ABSENT for gas station ownership
  5. Post appears on feed attributed to attacker's actorId as a legitimate fuel price update

Authorization check per step: Step 2 — present but non-functional. Step 4 — absent for gas station ownership.
Final impact: Feed polluted with fake "fuel_price_update" posts from non-gas-station actors.
Chain verdict: CHAIN_CONFIRMED — see WANDA-C-001

---

### Chain Examined: Booking → Notification cross-feature

Chain Type: CROSS_FEATURE
Path: `updateVportBooking.controller.js` → `publishVcsmNotification`
Examined: `customer_actor_id` in notification is resolved from DB record (line 98 area of updateVportBooking.controller.js), not from client payload.
Chain verdict: CLEAN — notification recipients are server-resolved

---

### Chain Examined: Gas prices → Exchange rate (cross-feature)

Chain Type: CROSS_FEATURE
Examined: `submitFuelPriceSuggestion.controller.js` and `reviewFuelPriceSuggestion.controller.js` — both write to `fuel_prices` table only. No imports from exchange rate feature. No cross-feature write surface found.
Chain verdict: CLEAN — no exchange rate contamination path

---

## Area E — Release Risk Discovery

**Method:** Checked changed files against test coverage and Blue Team scope.

### Release Risk: `createOwnerBooking.controller.js` — modified, no test file

──────────────────────────────────────────────────
WANDA-E-001 | REVIEW_SCOPE_GAP_FOUND

Discovery Area: E: Release Risk Discovery
Risk: HIGH

Surface / Path:
  `apps/VCSM/src/features/dashboard/vport/dashboard/cards/bookings/controller/createOwnerBooking.controller.js`

Security Sensitivity: SECURITY_SENSITIVE (ownership assertion, booking creation, actor authorization)
Blue Team Coverage: ARCHITECTURE — ownership chain traced; no dedicated controller test file
Test Coverage: NO — `__tests__/createOwnerBooking.controller.test.js` does not exist

Evidence:
  `ls apps/VCSM/src/features/dashboard/vport/dashboard/cards/bookings/controller/__tests__/` — no test for `createOwnerBooking`
  `createOwnerBooking.controller.js:35-38` — contains the authorization assertion modified on this branch
  `createOwnerBooking.controller.js:23-25` — time-order validation present; past-time validation ABSENT

Gap Description:
  `createOwnerBooking.controller.js` is a security-sensitive controller that was modified on this branch. It contains an ownership assertion (`assertActorOwnsVportActorController`) and a time-order guard. No test file exists for this controller. The modified authorization chain is untested.

Blast Radius:
  If regression is introduced in the authorization path, unvalidated bookings could be created with `source: "owner"` and `status: "confirmed"` without ownership verification.

Required Action Before THOR Release:
  SPIDER-MAN: `__tests__/createOwnerBooking.controller.test.js` must be created with at minimum: ownership enforcement test, non-owner rejection test, past-time guard behavior test.

THOR Block: YES
──────────────────────────────────────────────────

---

### Release Risk: `getVportGasPricesController` — pending submissions exposed to all callers

──────────────────────────────────────────────────
WANDA-E-002 | REVIEW_SCOPE_GAP_FOUND

Discovery Area: E: Release Risk Discovery
Risk: MEDIUM

Surface / Path:
  `apps/VCSM/src/features/dashboard/vport/dashboard/cards/gasprices/controller/getVportGasPrices.controller.js`
  Lines 32 and 66-68

Security Sensitivity: MUTATION_ONLY — no write, but sensitive read exposure

Evidence:
  `getVportGasPrices.controller.js:32` — `fetchPendingFuelPriceSubmissionsDAL({ targetActorId: actorId, fuelKey, limit: 50 })`
  `getVportGasPrices.controller.js:66-68` — `pendingSubmissions: pending` returned unconditionally
  No caller identity parameter in function signature

Gap Description:
  `getVportGasPricesController` returns ALL pending fuel price submissions unconditionally — without checking if the caller is the VPORT owner. The comment in the controller notes this distinction: "Owner review panel: always receives the full list via pendingSubmissions." However, the controller does not restrict the full list to owner-only callers. Non-owner callers receive the same `pendingSubmissions` array.

  In the UI, the owner review panel is conditionally rendered via `isOwner`. However, the controller-level separation is absent. Any caller to this controller gets all pending submissions.

Blast Radius:
  Citizens who call `getVportGasPricesController` receive the full pending submissions list, including other citizens' pending submissions for the same station. No actor identity exposure (actor IDs in submissions are not private), but the full submission list is meant for owner consumption only.

Required Action Before THOR Release:
  VENOM: Assess whether returning the full `pendingSubmissions` to non-owner callers is intended. If not: `getVportGasPricesController` must check caller identity and restrict `pendingSubmissions` to owner-only views.

THOR Block: NO — informational; UI guards exist; data exposure is low-sensitivity
──────────────────────────────────────────────────

---

### Release Risk: `updateVportBooking.write.dal.js` modified — no direct test

Risk Type: UNTESTED_PATH
Path: `apps/VCSM/src/features/dashboard/vport/dal/write/updateVportBooking.write.dal.js`
Security Sensitivity: MUTATION_ONLY — scoped by `profile_id`
Blue Team Coverage: ARCHITECTURE (column projection reviewed)
Test Coverage: PARTIAL — covered indirectly through `updateVportBooking.controller.test.js`, no DAL unit test

Finding: CLEAN — the DAL scopes writes by both `bookingId` and `profileId` at lines 26-29; no scope breach possible

---

## WANDA COVERAGE NOTE

Paths examined: 18 controllers/DALs/hooks
Paths not examined: flyerBuilder controllers (scope expansion would require Blue Team review); booking engine internals in `engines/booking/`

Excluded from WANDA scope:
- `apps/VCSM/src/features/dashboard/flyerBuilder/` — modified on branch but not in bookings/gasprices scope; separate review required
- Frozen features (wanders, wanderex, vgrid, learning) — excluded per governance contract
- `engines/booking/` internal implementation — adapter boundary only reviewed

---

## WANDA DISCOVERY SUMMARY

Scope: VCSM
Discovery Areas Executed: A | B | C | D | E (all 5 mandatory)

Surfaces Examined: 18
Chains Examined: 4
Assumptions Examined: 5

NEW_FINDING_CREATED:        2 (WANDA-C-001, WANDA-C-002)
PATCH_BYPASS_FOUND:         0
PATCH_REGRESSION_FOUND:     0
TRUST_BOUNDARY_SHIFT_FOUND: 1 (WANDA-B-001)
ATTACK_SURFACE_GAP_FOUND:   1 (WANDA-A-001)
REVIEW_SCOPE_GAP_FOUND:     2 (WANDA-E-001, WANDA-E-002)

THOR Block Count: 4 (WANDA-A-001, WANDA-B-001, WANDA-C-001, WANDA-E-001)

Sudden Death Check: NO SUDDEN_DEATH triggered — no CRITICAL/PRIVILEGE_ESCALATION_PATH/REALM_ESCAPE/BOUNDARY_BROKEN confirmed. Highest severity finding is HIGH (WANDA-C-001, WANDA-E-001). Simulation continues to HULK and MAGNETO.

WANDA_BLIND_MODE: MAINTAINED throughout. All findings derived from independent source reads. No Blue Team report content loaded before discovery.

---

## WANDA STATUS — Updated for SECURITY.md

WANDA Last Run: 2026-06-05
Status: COMPLETE_WITH_FINDINGS
WANDA_BLIND_MODE: CONFIRMED

Open WANDA Findings:
  CRITICAL: 0
  HIGH: 2
  MEDIUM: 4 (WANDA-B-001 MEDIUM, WANDA-C-002 MEDIUM, WANDA-A-001 MEDIUM, WANDA-E-002 MEDIUM)
  LOW: 0
  THOR Block Count: 4

Findings:
  WANDA-A-001 | ATTACK_SURFACE_GAP_FOUND | MEDIUM | Calendar feed publish path not reviewed by any Blue Team
  WANDA-B-001 | TRUST_BOUNDARY_SHIFT_FOUND | MEDIUM | ALLOWED_FUEL_KEYS defense displaced to routing layer
  WANDA-C-001 | NEW_FINDING_CREATED | HIGH | publishFuelPriceUpdateAsPost — any actor publishes system posts
  WANDA-C-002 | NEW_FINDING_CREATED | MEDIUM | createOwnerBooking — staff self-authorization via resource.owner_actor_id
  WANDA-E-001 | REVIEW_SCOPE_GAP_FOUND | HIGH | createOwnerBooking controller modified, no test
  WANDA-E-002 | REVIEW_SCOPE_GAP_FOUND | MEDIUM | getVportGasPrices returns all pending submissions without owner filter

Coverage Note: flyerBuilder scope and booking engine internals excluded; see WANDA COVERAGE NOTE
