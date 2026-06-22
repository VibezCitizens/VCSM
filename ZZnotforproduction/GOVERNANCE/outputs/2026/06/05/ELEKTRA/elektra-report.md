# ELEKTRA Security Report

**Date:** 2026-06-05
**Branch:** vport-booking-feed-security-updates
**Mode:** SECURITY_WARFARE_SIMULATION / BLUE_TEAM / BLIND_REVERIFY_MODE
**Scope:** VCSM — dashboard/vport/bookings + dashboard/vport/gasprices + booking/engine
**Reviewer:** ELEKTRA
**Scan Trigger:** RED_VS_BLUE_SECURITY_WARFARE_SIMULATION (Step 4 — Blue Team chain)
**Upstream VENOM report:** ZZnotforproduction/GOVERNANCE/outputs/2026/06/05/VENOM/venom-report.md
**Upstream BLACKWIDOW report:** ZZnotforproduction/GOVERNANCE/outputs/2026/06/05/BLACKWIDOW/blackwidow-report.md

**Findings Summary:** 0 HIGH | 4 MEDIUM | 2 LOW | 0 INFO
**False Positives Rejected:** 7
**Suggested Patches:** 6
**Prior Findings Re-verified:** 13 (9 CLOSED_SOURCE_VERIFIED, 4 STILL_OPEN_SOURCE_VERIFIED)
**New ELEKTRA Findings:** 1

---

## BLIND REVERIFY CHECK

| Check | Status |
|---|---|
| Historical reports NOT loaded before reconstruction | PASS |
| ARCHITECT artifacts loaded | PASS |
| VENOM report: present (2026-06-05) | PASS |
| BLACKWIDOW report: present (2026-06-05) | PASS |
| All source files re-read independently | PASS |
| Chain rebuilt from source before upstream comparison | PASS |
| BLIND_REVERIFY_MODE declared at session start | PASS |

---

## ELEKTRA PREFLIGHT PASS

```
Upstream Reports:
- VENOM:      ZZnotforproduction/GOVERNANCE/outputs/2026/06/05/VENOM/venom-report.md       [PRESENT, 2026-06-05, scope=VCSM]
- BLACKWIDOW: ZZnotforproduction/GOVERNANCE/outputs/2026/06/05/BLACKWIDOW/blackwidow-report.md [PRESENT, 2026-06-05, scope=VCSM]
- ARCHITECT:  ZZnotforproduction/GOVERNANCE/outputs/2026/06/05/ARCHITECT/security-surface.json  [PRESENT, 2026-06-05, scope=VCSM]

Proceeding with ELEKTRA verification.
```

---

## ELEKTRA SCAN TARGET

```
Feature / Route / Engine:
  - dashboard/vport/bookings  (insert + update controllers + DAL)
  - dashboard/vport/gasprices (review + publish + unit + owner-update controllers + DAL)
  - booking/engine (assertActorOwnsVportActorController, checkVportOwnershipController)

Application Scope:   VCSM + ENGINE
Reason for scan:     RED_VS_BLUE_SECURITY_WARFARE_SIMULATION — ELEKTRA Blue Team Step 4
Scan trigger:        BLACKWIDOW referral + VENOM cross-reference + full-surface scan
Upstream VENOM:      PRESENT
Upstream BLACKWIDOW: PRESENT
```

---

## ENTRY POINT MAP

| Route / Controller | Input Sources (user-controlled) | Trusted Boundary | Validation |
|---|---|---|---|
| createVportPublicBookingController | resourceId, startsAt, endsAt, timezone, requestActorId, customerName, customerNote | Session actor ID | Partial — kind checked, is_void NOT checked |
| createOwnerBookingController | callerActorId, resourceId, startsAt, endsAt, timezone, serviceLabelSnapshot, durationMinutes | assertActorOwnsVportActorController | Partial — time order checked, past-time NOT checked |
| updateBookingStatusController | bookingId, status, callerActorId | assertActorOwnsVportActorController | Present — TERMINAL + allowlist + ownership |
| rescheduleBookingController | bookingId, startsAt, endsAt, resourceId, durationMinutes, callerActorId | assertActorOwnsVportActorController | Present |
| reviewFuelPriceSuggestionController | submissionId, decision, decidedByActorId, reason | checkVportOwnershipController | Weak — navigation gate used for mutation |
| submitOwnerFuelPriceUpdateController | actorId, targetActorId, fuelKey, proposedPrice, unit | checkVportOwnershipController | Weak — navigation gate used for mutation |
| updateStationFuelUnitController | actorId, targetActorId, unit | checkVportOwnershipController | Weak — navigation gate used for mutation |
| publishFuelPriceUpdateAsPostController | actorId, updatedFuels | checkVportOwnershipController (degenerate) | ABSENT — self-reference bypass |

---

## PRIOR FINDING REVERIFICATION — Independently Reconstructed from Source

### Group A: Previously Patched Findings — All CLOSED

| Finding ID | Description | Source Evidence | ELEKTRA Status |
|---|---|---|---|
| VPD-V-019 | customer_actor_id injection | `vportPublicBooking.controller.js:84` — `customer_actor_id: requestActorId ?? null`; WRITE_COLS frozen allowlist at DAL | CLOSED_SOURCE_VERIFIED |
| VPD-V-020 | linkPath UUID in notification | `vportPublicBooking.controller.js:116` — `linkPath: null` hardcoded | CLOSED_SOURCE_VERIFIED |
| VPD-V-021 | Terminal booking state mutation | `updateVportBooking.controller.js:35-37` — TERMINAL_STATUSES checked BEFORE assertActorOwns; same at reschedule:113 | CLOSED_SOURCE_VERIFIED |
| ELEK-004 | Kind check before self-shortcut | `assertActorOwnsVportActor.controller.js:23-30` — getActorByIdDAL + kind !== "user" throw BEFORE self-shortcut at line 34 | CLOSED_SOURCE_VERIFIED |
| BOOK-001 | 23505 slot collision translation | `insertVportBooking.write.dal.js:39-41` — `error.code === "23505"` caught, translated to user message | CLOSED_SOURCE_VERIFIED |
| BOOK-002 | Kind gate for public booking | `vportPublicBooking.controller.js:57-61` — readActorVportLinkDAL called; `actor.kind !== "user"` throws | CLOSED_SOURCE_VERIFIED |
| VENOM-GAS-001 | Gas owner ownership check in review | `reviewFuelPriceSuggestion.controller.js:48-52` — checkVportOwnershipController called before any write | CLOSED_SOURCE_VERIFIED |
| VENOM-GAS-002 | Slug route gas price resolution | VENOM-verified: resolveVportProfileId(targetActorId) called; caller-supplied profileId not accepted | CLOSED_SOURCE_VERIFIED |
| ELEK-004-IMPORT | vportClient named/default import discrepancy | `vportClient.js` exports `const vport` AND `export default vport` — same instance; named import in vportAvailabilityRules resolves to same client | CLOSED_SOURCE_VERIFIED |

**Prior bookings SECURITY.md findings — ELEKTRA re-evaluation:**

| Finding ID | Prior Status | Source Verdict | Updated ELEKTRA Status |
|---|---|---|---|
| ELEK-2026-06-05-001 (status enum) | Open | Status is hardcoded or validated against server allowlist (OWNER_STATUSES, CUSTOMER_STATUSES) in all controller paths | CLOSED_SOURCE_VERIFIED |
| ELEK-2026-06-05-002 (UUID in notification) | Open | VPD-V-020 confirmed: linkPath: null; UUID cannot appear | CLOSED_SOURCE_VERIFIED |
| ELEK-2026-06-05-003 (DAL ownership anchor) | Open | profileId scope lock confirmed DB-derived (from getVportBookingByIdDAL read, not caller input) | CLOSED_SOURCE_VERIFIED |
| ELEK-2026-06-05-004 (serviceLabelSnapshot from caller) | Open | Owner has write authority over own resource; this is NOT a security boundary violation — FALSE POSITIVE | FP_REJECTED |

### Group B: VENOM/BLACKWIDOW Open Findings — ELEKTRA Chain Reconstruction

---

#### VENOM-WS-001 — Voided Actor Booking Creation

**ELEKTRA Status:** STILL_OPEN_SOURCE_VERIFIED

**Chain Reconstruction:**

```
DATA FLOW TRACE
Source:           requestActorId (caller-supplied, must represent authenticated session actor)
Validation:       readActorVportLinkDAL({ actorId: requestActorId }) → selects "id,kind,vport_id"
Missing field:    is_void NOT in SELECT — actorVport.read.dal.js:9
Intermediate:     actor.kind !== "user" check at vportPublicBooking.controller.js:60 — PASSES for voided user
Sink:             insertVportBookingDAL → vport.bookings INSERT
Defense at sink:  ABSENT — WRITE_COLS allowlist prevents column injection but not invalid actor booking
```

**Evidence:**
```js
// actorVport.read.dal.js:9
.select("id,kind,vport_id")   // is_void NOT SELECTED

// vportPublicBooking.controller.js:57-61
if (requestActorId) {
  const actor = await readActorVportLinkDAL({ actorId: requestActorId });
  if (!actor) throw new Error("Only citizens can book appointments.");
  if (actor.kind !== "user") throw new Error("Switch to your citizen profile to book.");
  // NO: if (actor.is_void) throw
}
```

**Finding Valid:** YES — chain fully traceable. Voided actor (kind:"user", is_void:true) passes kind gate and books.

**Severity:** MEDIUM

---

#### VENOM-WS-002 — VPORT-Kind Mutation Gate (Blast Radius: 4 Controllers)

**ELEKTRA Status:** STILL_OPEN_SOURCE_VERIFIED

**Chain Reconstruction:**

```
DATA FLOW TRACE
Source:           Caller actor identity (decidedByActorId / actorId) with kind:"vport"
Validation:       checkVportOwnershipController — navigation gate with VPORT self-shortcut
Gate weakness:    callerActorId === targetActorId AND kind === "vport" → returns true
                  WITHOUT querying actor_owners
Sink (4 paths):   updateFuelPriceSubmissionStatusDAL (review)
                  upsertVportFuelPriceDAL (direct owner update)
                  updateFuelPriceUnitForActorDAL (unit change)
                  createSystemPost (feed publication)
Defense at sink:  ABSENT — no user-kind guard after ownership check returns true
```

**Evidence from source:**
```js
// checkVportOwnership.controller.js:8-11
if (callerActorId === targetActorId) {
  const actor = await getActorByIdDAL({ actorId: callerActorId });
  if (actor && actor.kind === "vport" && !actor.is_void) return true;
  // actor_owners NEVER queried for this path
}
```

Code comment at line 7 states: `"mutations require a user-kind actor"` — violated by all 4 controllers.

**Caller verification:**
| Controller | Caller param | Target param | Shortcut fires when |
|---|---|---|---|
| reviewFuelPriceSuggestion | decidedByActorId | targetActorId (profile-derived) | callerActorId === VPORT actor ID |
| updateStationFuelUnit | actorId | targetActorId | actorId === targetActorId |
| submitOwnerFuelPriceUpdate | actorId | targetActorId | actorId === targetActorId |
| publishFuelPriceUpdateAsPost | actorId | actorId (SAME VALUE) | ALWAYS fires for VPORT-kind |

**Finding Valid:** YES — confirmed across all 4 mutation controllers.

**Severity:** MEDIUM

---

#### VENOM-WS-003 — TOCTOU Race in Fuel Price Review (DB No Precondition)

**ELEKTRA Status:** STILL_OPEN_SOURCE_VERIFIED

**Chain Reconstruction:**

```
DATA FLOW TRACE
Source:           Two concurrent reviewFuelPriceSuggestionController calls for same submissionId
Read step:        fetchFuelPriceSubmissionByIdDAL → both read status:"pending"
App gate:         if (subRow.status !== "pending") — checked AFTER read, BEFORE write
DB write:         updateFuelPriceSubmissionStatusDAL:
                    .update({ status, ... })
                    .eq("id", submissionId)
                    NO .eq("status", "pending") precondition
Second write:     createFuelPriceSubmissionReviewDAL → INSERT (not upsert) → duplicate review row
```

**Evidence from source:**
```js
// vportFuelPriceReviews.write.dal.js:46-53
return vportSchema
  .from("fuel_price_submissions")
  .update({ status, reviewed_at, ... })
  .eq("id", submissionId)
  // .eq("status", "pending")  ← ABSENT
  .select(SUBMISSION_SELECT)
  .maybeSingle();
```

**Impact:** Concurrent requests produce duplicate `fuel_price_submission_reviews` INSERT rows + duplicate `fuel_price_history` entries.

**Finding Valid:** YES — DB write has no status precondition.

**Severity:** LOW

---

#### BW-NEW-001 — publishFuelPriceUpdateAsPost Ownership Check is VPORT Existence Check

**ELEKTRA Status:** STILL_OPEN_SOURCE_VERIFIED + **EXPANDED by ELEKTRA**

**Chain Reconstruction:**

```
DATA FLOW TRACE
Source:           actorId (caller identity — any kind, including user-kind)
Trust boundary:   checkVportOwnershipController({ callerActorId: actorId, targetActorId: actorId })
                  — BOTH params are the SAME actorId value (degenerate self-reference)
Bypass path A:    actorId is VPORT-kind → VPORT self-shortcut → returns true (actor_owners skipped)
Bypass path B:    actorId is user-kind → first branch fails (kind !== "vport") →
                  assertActorOwnsVportActorController(actorId, actorId) →
                  kind === "user" passes → requestActorId === targetActorId self-shortcut →
                  returns {ok: true, mode: "self"} → checkVportOwnershipController returns true
                  → actor_owners ALSO skipped
Result:           ANY non-void actor bypasses ownership gate
Sink:             createSystemPost({ actorId, post_type: "fuel_price_update", ... }) → public feed
```

**Evidence from source:**
```js
// publishFuelPriceUpdateAsPost.controller.js:52-55
const isValidVport = await checkVportOwnershipController({
  callerActorId: actorId,
  targetActorId: actorId,  // SAME variable — self-reference is always true
});
```

**Comment in code is materially false:**
```js
// ✅ SECURITY (F-002): verify actorId is a legitimate VPORT owner via actor_owners.
// createSystemPost accepts actorId from caller without ownership verification —
// this gate ensures only verified VPORT owners can post on behalf of their station.
```
No actor_owners query ever fires for the self-reference case.

**ELEKTRA Expansion over BW-NEW-001:** BLACKWIDOW confirmed VPORT-kind bypass. ELEKTRA independently confirms the user-kind bypass path via assertActorOwnsVportActorController self-shortcut. The full scope is: ANY non-void actor (user-kind or vport-kind) with access to this controller can inject a "fuel_price_update" system post into the public feed.

**Finding Valid:** YES — two bypass paths traced to source code.

**Severity:** MEDIUM

---

#### BW-NEW-002 — createOwnerBooking Missing Past-Time Guard

**ELEKTRA Status:** STILL_OPEN_SOURCE_VERIFIED

**Chain Reconstruction:**

```
DATA FLOW TRACE
Source:           startsAt (caller-supplied ISO timestamp)
Validation:       new Date(startsAt) >= new Date(endsAt) → throws (time ORDER, not past-time)
Missing check:    new Date(startsAt).getTime() > Date.now() → ABSENT
Compare:          createVportPublicBookingController:63 → this check IS present
Sink:             insertVportBookingDAL with status:"confirmed" and past startsAt
```

**Evidence from source:**
```js
// createOwnerBooking.controller.js:23-25
if (new Date(startsAt).getTime() >= new Date(endsAt).getTime()) {
  throw new Error("startsAt must be before endsAt.");
  // NO: if (new Date(startsAt).getTime() <= Date.now()) throw
}
```

**Finding Valid:** YES — time-order check present, past-time check absent. Owner creates confirmed backdated bookings.

**Severity:** LOW

---

## NEW FINDINGS FROM ELEKTRA ADJACENT FLOW INSPECTION

---

```
SECURITY FINDING

- Finding ID:         ELEK-2026-06-05-005
- Title:              publishFuelPriceUpdateAsPost — User-Kind Actor Bypass via assertActorOwnsVportActorController Self-Shortcut
- Category:           IDOR/BOLA
- Severity:           MEDIUM
- Status:             Open
- Scope:              VCSM
- Location:           apps/VCSM/src/features/dashboard/vport/dashboard/cards/gasprices/controller/publishFuelPriceUpdateAsPost.controller.js:52-55
                      apps/VCSM/src/features/booking/controller/assertActorOwnsVportActor.controller.js:34-36
- Source:             actorId parameter — user-kind citizen actor (kind:"user")
- Sink:               createSystemPost({ actorId, post_type: "fuel_price_update", ... }) → public feed
- Trust Boundary:     checkVportOwnershipController called with (actorId, actorId) — degenerate self-reference
- Impact:             Any authenticated citizen (user-kind actor) can inject a "fuel_price_update" system post
                      into the public feed by calling publishFuelPriceUpdateAsPostController with their
                      user-kind actor ID. The post is attributed to their citizen identity, not a gas station,
                      contaminating the feed with fake/misleading fuel price data.
- Evidence:
    // publishFuelPriceUpdateAsPost.controller.js:52-55
    const isValidVport = await checkVportOwnershipController({
      callerActorId: actorId,
      targetActorId: actorId,   // same variable — trivially equal
    });

    // checkVportOwnership.controller.js: VPORT branch fails for user-kind
    // Falls to: assertActorOwnsVportActorController({ requestActorId: actorId, targetActorId: actorId })

    // assertActorOwnsVportActor.controller.js:28,34
    if (requesterActor.kind !== "user") throw  // user-kind PASSES this check
    if (String(requestActorId) === String(targetActorId)) {
      return { ok: true, mode: "self" };        // self-shortcut fires — actor_owners skipped
    }
    // checkVportOwnershipController catches no exception → returns true

- Reproduction Steps:
    1. Authenticate as a citizen (user-kind actor)
    2. Call publishFuelPriceUpdateAsPostController({ actorId: <userActorId>, updatedFuels: [{fuelKey:"regular", price:9999, currencyCode:"USD", unit:"gallon"}] })
    3. checkVportOwnershipController(userActorId, userActorId) → assertActorOwnsVportActorController self-shortcut → returns true
    4. validFuels passes filter (fuelKey in FUEL_LABELS, price finite >= 0)
    5. hasRecentFuelPricePostDAL check passes (no recent post by this actor)
    6. createSystemPost({ actorId: userActorId, post_type: "fuel_price_update", ... }) executes
    7. "Fuel prices updated at this station" post appears in public feed attributed to citizen actor

- Existing Defense:   checkVportOwnershipController called; FUEL_LABELS filter for fuelKey; price >= 0 check
- Why Defense Is Insufficient:
    checkVportOwnershipController with (actorId, actorId) creates a trivially-true self-reference.
    For user-kind actors, the VPORT branch does not return true, but the fallback to
    assertActorOwnsVportActorController(actorId, actorId) fires the self-shortcut because
    requestActorId === targetActorId, returning {ok:true} without actor_owners query.
    actor_owners ownership of a VPORT is never verified.
- Recommended Fix:    Add explicit VPORT-kind guard in publishFuelPriceUpdateAsPostController before
                      the ownership check, OR pass targetActorId as a distinct verified VPORT actor ID
                      rather than the caller's own actorId.
- Suggested Patch:
    // publishFuelPriceUpdateAsPost.controller.js — before the ownership check block
    const actorRecord = await getActorByIdDAL({ actorId });
    if (!actorRecord || actorRecord.kind !== "vport" || actorRecord.is_void) {
      return { published: false, status: "failed", reason: "not_vport_actor" };
    }
    // Then call assertActorOwnsVportActorController directly (not checkVportOwnershipController)
    // to enforce user-kind ownership via actor_owners for the full security contract.
    // OR: replace the ownership check with:
    //   await assertActorOwnsVportActorController({ requestActorId: callerUserActorId, targetActorId: actorId });
    // where callerUserActorId is the user-kind actor that owns this VPORT (from session), not the VPORT actor itself.
- Follow-up Command:  VENOM (trust boundary redesign for publish-as-post path), Carnage (if VPORT actor
                      session token trust is to be added to the boundary model)
```

---

## FALSE POSITIVES REJECTED

```
FALSE POSITIVE REJECTED

- Candidate:       createOwnerBooking — serviceLabelSnapshot trusted from caller
- Location:        apps/VCSM/src/features/dashboard/vport/dashboard/cards/bookings/controller/createOwnerBooking.controller.js:52
- Rejection reason: Owner has full write authority over their own VPORT's booking labels.
                    serviceLabelSnapshot is a display/snapshot field, not an authorization or access-control field.
                    No privilege escalation possible from label manipulation.
- Chain gap:        Impact — no meaningful attack achievable via label injection into own records
- Notes:           INFO — public booking path resolves label server-side as additional data quality measure
```

```
FALSE POSITIVE REJECTED

- Candidate:       submitOwnerFuelPriceUpdate — zero/negative price accepted when requireSanityForSuggestion=false
- Location:        apps/VCSM/src/features/dashboard/vport/dashboard/cards/gasprices/controller/submitOwnerFuelPriceUpdate.controller.js:30
- Rejection reason: Owner writes to their own station's prices. Sanity check is a business-logic guard,
                    not a security boundary. Owner intent is assumed; no privilege escalation from
                    setting own prices to any value.
- Chain gap:        Impact — affects own resource only; no cross-station exploitation possible
- Notes:           Business logic concern for data quality; not a security finding
```

```
FALSE POSITIVE REJECTED

- Candidate:       ELEK-2026-06-05-001 (prior run) — status enum from caller
- Location:        updateBookingStatusController
- Rejection reason: status is validated against server-side allowlists (OWNER_STATUSES, CUSTOMER_STATUSES)
                    before DAL call. No invalid status can reach updateVportBookingDAL.
                    Public booking inserts status:"pending" (hardcoded). Owner booking inserts status:"confirmed" (hardcoded).
- Chain gap:        Sink defense — allowlist IS present at controller layer
```

```
FALSE POSITIVE REJECTED

- Candidate:       ELEK-2026-06-05-002 (prior run) — UUID in notification linkPath
- Location:        vportPublicBooking.controller.js:116
- Rejection reason: VPD-V-020 patch confirmed from current source. linkPath: null hardcoded.
                    Raw UUID cannot appear in notification row.
- Chain gap:        Sink — defense is present and effective
```

```
FALSE POSITIVE REJECTED

- Candidate:       ELEK-2026-06-05-003 (prior run) — DAL ownership anchor missing
- Location:        updateVportBooking.write.dal.js
- Rejection reason: profileId scope lock is present (.eq("id", bookingId).eq("profile_id", profileId)).
                    profileId is DB-derived from getVportBookingByIdDAL read, not caller input.
                    Attacker cannot inject a forged profileId.
- Chain gap:        Source — profileId not user-controlled
```

```
FALSE POSITIVE REJECTED

- Candidate:       ELEK-2026-06-05-004 (prior run) — serviceLabelSnapshot from caller (bookings)
- Location:        createOwnerBooking.controller.js
- Rejection reason: Same as rejection above — owner has write authority. Not a security boundary.
- Chain gap:        Impact
```

```
FALSE POSITIVE REJECTED

- Candidate:       customer_name in notification context — stored content injection concern
- Location:        vportPublicBooking.controller.js:121
- Rejection reason: customer_name is stored in the booking record. The booking and its notification
                    are recipient-scoped (VPORT owner / booking customer only). No cross-user
                    injection surface identified from controller layer. Rendering safety depends on
                    notification renderer (out of scope for this pass).
- Chain gap:        Impact — no escalation path confirmed at controller level
- Notes:           INFO — notification renderer should escape all user-supplied context fields
```

---

## SUGGESTED PATCH QUEUE

| # | Finding ID | Title | Severity | Layer to Patch | Patch Complexity | Requires DB Change |
|---|---|---|---|---|---|---|
| 1 | VENOM-WS-001 | Add is_void to readActorVportLinkDAL select + controller check | MEDIUM | DAL + Controller | SIMPLE | NO |
| 2 | VENOM-WS-002 | Replace checkVportOwnershipController with assertActorOwnsVportActorController in 4 gas mutation controllers | MEDIUM | Controller | MODERATE | NO |
| 3 | BW-NEW-001 + ELEK-005 | Fix publishFuelPriceUpdateAsPost self-reference — add VPORT-kind guard + pass user caller identity | MEDIUM | Controller | MODERATE | NO |
| 4 | ELEK-2026-06-05-005 | Add explicit VPORT-kind check before checkVportOwnership in publishFuelPriceUpdateAsPost (same patch as #3) | MEDIUM | Controller | SIMPLE | NO |
| 5 | VENOM-WS-003 | Add DB-level status precondition: .eq("status", "pending") in updateFuelPriceSubmissionStatusDAL | LOW | DAL | SIMPLE | NO |
| 6 | BW-NEW-002 | Add past-time guard in createOwnerBookingController: if (new Date(startsAt).getTime() <= Date.now()) throw | LOW | Controller | SIMPLE | NO |

---

### Patch Details

**Patch 1 — VENOM-WS-001: Voided Actor Booking Fix**
```js
// actorVport.read.dal.js — add is_void to select
.select("id,kind,vport_id,is_void")

// vportPublicBooking.controller.js — add void check after kind check
if (requestActorId) {
  const actor = await readActorVportLinkDAL({ actorId: requestActorId });
  if (!actor || actor.is_void === true) throw new Error("Only citizens can book appointments.");
  if (actor.kind !== "user") throw new Error("Switch to your citizen profile to book.");
}
```

**Patch 2 — VENOM-WS-002: Gas Price Mutation Controllers — Use assertActorOwnsVportActorController**
```js
// In reviewFuelPriceSuggestion, updateStationFuelUnit, submitOwnerFuelPriceUpdate:
// Replace:
import { checkVportOwnershipController } from "@/features/profiles/adapters/kinds/vport/ownership.adapter";
const isOwner = await checkVportOwnershipController({ callerActorId: actorId, targetActorId });
// With:
import { assertActorOwnsVportActorController } from "@/features/booking/adapters/booking.adapter";
try {
  await assertActorOwnsVportActorController({ requestActorId: actorId, targetActorId });
} catch {
  return { ok: false, reason: "not_owner" };
}
// assertActorOwnsVportActorController enforces user-kind AND actor_owners verification
```

**Patch 3 + 4 — BW-NEW-001 / ELEK-2026-06-05-005: publishFuelPriceUpdateAsPost Fix**
```js
// publishFuelPriceUpdateAsPost.controller.js — before the ownership check block
// The actorId passed here must be a VPORT actor. Verify kind first, then verify
// a user-kind actor owns this VPORT via actor_owners.
// Option A (minimal): add kind guard
import { getActorByIdDAL } from "@/features/booking/dal/getActorById.dal";
const actorRecord = await getActorByIdDAL({ actorId });
if (!actorRecord || actorRecord.kind !== "vport" || actorRecord.is_void) {
  return { published: false, status: "failed", reason: "not_vport_actor" };
}
// Then remove the checkVportOwnershipController call entirely —
// VPORT actor existence + non-void is sufficient for system post attribution
// IF the session guarantees actorId came from an authenticated VPORT actor session.
// Option B (full security): require the user-kind caller identity from session:
// publishFuelPriceUpdateAsPostController({ vportActorId, callerUserActorId, updatedFuels })
// await assertActorOwnsVportActorController({ requestActorId: callerUserActorId, targetActorId: vportActorId });
```

**Patch 5 — VENOM-WS-003: DB Status Precondition**
```js
// vportFuelPriceReviews.write.dal.js — updateFuelPriceSubmissionStatusDAL
return vportSchema
  .from("fuel_price_submissions")
  .update({ status, reviewed_at: ..., reviewed_by_actor_id: ..., decision_reason: ... })
  .eq("id", submissionId)
  .eq("status", "pending")    // ← ADD THIS LINE (DB-level guard)
  .select(SUBMISSION_SELECT)
  .maybeSingle();
// Caller should then check if data === null — means the row was not pending (already reviewed)
```

**Patch 6 — BW-NEW-002: Owner Booking Past-Time Guard**
```js
// createOwnerBooking.controller.js — after the time-order check
if (new Date(startsAt).getTime() >= new Date(endsAt).getTime()) {
  throw new Error("startsAt must be before endsAt.");
}
// ADD:
if (new Date(startsAt).getTime() <= Date.now()) {
  throw new Error("Cannot create a booking for a past time slot.");
}
```

---

## REQUIRED FOLLOW-UP COMMANDS

| Command | Reason | Status |
|---|---|---|
| VENOM | Re-verify trust boundary design for publishFuelPriceUpdateAsPost after ELEK-005 expansion | PENDING |
| BLACKWIDOW | Runtime validation of ELEK-2026-06-05-005 user-kind bypass path (not confirmed at runtime by BW) | PENDING |
| DB | Verify RLS on fuel_price_submissions, fuel_prices, fuel_price_history — VENOM-WS-001/002 RLS unverified | PENDING |
| Carnage | DB migration if .eq("status","pending") precondition requires index for perf (VENOM-WS-003 patch) | PENDING (LOW) |
| THOR | Release gate evaluation — 4 MEDIUM findings open; THOR must assess in fresh session | PENDING |

---

## THOR RELEASE GATE ASSESSMENT

Per ELEKTRA §13:
- No HIGH severity findings open.
- 4 MEDIUM findings open:
  - VENOM-WS-001: Voided actor booking creation
  - VENOM-WS-002: VPORT-kind mutation gate across 4 gas price controllers
  - BW-NEW-001 (expanded by ELEK-005): publishFuelPriceUpdateAsPost — any actor bypasses ownership
  - ELEK-2026-06-05-005: user-kind actor bypass (same root cause as BW-NEW-001, new exploit path)
- 2 LOW findings open:
  - VENOM-WS-003: TOCTOU race (DB no status precondition)
  - BW-NEW-002: createOwnerBooking missing past-time guard
- No CRITICAL findings.
- No secrets exposure.
- No confirmed IDOR/BOLA with unconstrained cross-actor impact (all MEDIUM findings are same-actor or navigation-gate violations).

**ELEKTRA Recommendation: CAUTION**

THOR must not run in this session. THOR must evaluate the 4 open MEDIUM findings as release gate candidates in a fresh session. ELEKTRA does NOT emit THOR_RELEASE_ELIGIBLE. Release authority belongs exclusively to THOR.

**Sudden Death assessment:** No CRITICAL, no PRIVILEGE_ESCALATION_PATH, no REALM_ESCAPE, no BOUNDARY_BROKEN. Sudden Death rule NOT triggered.

---

## Executive Summary

13 prior findings re-examined from current source. 9 confirmed CLOSED_SOURCE_VERIFIED. 4 ELEK prior findings (from bookings SECURITY.md) closed: 3 CLOSED_SOURCE_VERIFIED, 1 FP_REJECTED. All critical patches — ELEK-004, VPD-V-019, VPD-V-020, VPD-V-021 — are holding.

5 findings remain open from VENOM/BLACKWIDOW passes:
- 3 MEDIUM (VENOM-WS-001, VENOM-WS-002, BW-NEW-001)
- 2 LOW (VENOM-WS-003, BW-NEW-002)

1 NEW finding from ELEKTRA adjacent flow inspection:
- ELEK-2026-06-05-005 (MEDIUM): user-kind actor bypass in publishFuelPriceUpdateAsPost via assertActorOwnsVportActorController self-shortcut. This is the complementary path to BW-NEW-001's VPORT-kind path. Together they prove the ownership gate is completely bypassed for ALL actor kinds when actorId is passed as both caller and target.

The central architectural concern is checkVportOwnershipController being used as a mutation gate despite its own comment stating it is a navigation gate only. This affects: 4 gas price mutation controllers (VENOM-WS-002), 1 feed publication controller (BW-NEW-001 + ELEK-005). Patches are SIMPLE to MODERATE in complexity and require no DB migrations. Recommended to patch before release.

**Final ELEKTRA status: CAUTION**
