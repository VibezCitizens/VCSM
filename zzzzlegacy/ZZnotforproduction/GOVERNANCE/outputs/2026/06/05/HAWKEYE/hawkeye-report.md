# HAWKEYE Endpoint Verification Report

**Date:** 2026-06-05
**Branch:** vport-booking-feed-security-updates
**Mode:** SECURITY_WARFARE_SIMULATION / BLUE_TEAM
**Application Scope:** VCSM + ENGINE
**Environment:** SOURCE_REVIEW (Supabase PWA — no traditional HTTP routes; controllers are the API surface)
**Reviewer:** HAWKEYE
**Verification Summary:** 4 PASS | 1 FAIL | 3 DEGRADED | 3 PARTIAL
**Contract Drift:** NONE
**Auth Issues:** 5
**Observability Gaps:** 1

---

## ARCHITECT Artifact Completeness Check

| Artifact | Required Content | Status | Result |
|---|---|---|---|
| `routes.graph.json` | Route nodes or EXPLICIT_NONE | MISSING | WARN — VCSM is a Supabase PWA; no HTTP route handlers exist for these features |
| `feature-map.md` | Route inventory or EXPLICIT_NONE | MISSING | WARN — security-surface.json consumed as functional equivalent |
| `security-surface.json` | Call chains, trust boundaries, write surfaces | COMPLETE | PASS |
| `system-map.md` | Module map, trust boundary map | COMPLETE | PASS |

**Decision:** Proceeding under `ARCHITECT_EXPLICIT_NONE` exception — VCSM does not use HTTP route handlers for bookings/gasprices. The "endpoints" are Supabase client-side controller functions. `security-surface.json` serves as the authoritative surface inventory. A WATCH item is recorded for ARCHITECT to produce `routes.graph.json` (even if empty with `NO_ROUTES_VERIFIED`) in future passes.

```
ARCHITECT ROUTE MAP LOADED
Source:    ZZnotforproduction/GOVERNANCE/outputs/2026/06/05/ARCHITECT/security-surface.json
           ZZnotforproduction/GOVERNANCE/outputs/2026/06/05/ARCHITECT/system-map.md
Scope:     VCSM + ENGINE (dashboard/vport/bookings + gasprices + booking engine)
Date:      2026-06-05
Endpoints: 8 (controller functions as API surfaces)
```

---

## Endpoint Summary

| Controller / Endpoint | Type | Auth Required | Auth Enforcement | Status |
|---|---|---|---|---|
| createVportPublicBookingController | Booking — Public | Partial (guest OK) | PARTIAL (kind check; is_void absent) | PARTIAL |
| createOwnerBookingController | Booking — Owner | YES | STRONG (assertActorOwnsVportActorController) | PASS (minor gap) |
| updateBookingStatusController | Booking — Mutation | YES | STRONG (dual-path + TERMINAL gate) | PASS |
| rescheduleBookingController | Booking — Mutation | YES | STRONG (assertActorOwnsVportActorController) | PASS |
| reviewFuelPriceSuggestionController | Gas — Mutation | YES | WEAK (checkVportOwnershipController) | DEGRADED |
| submitOwnerFuelPriceUpdateController | Gas — Mutation | YES | WEAK (checkVportOwnershipController) | DEGRADED |
| updateStationFuelUnitController | Gas — Config | YES | WEAK (checkVportOwnershipController) | DEGRADED |
| publishFuelPriceUpdateAsPostController | Feed — System Post | YES | ABSENT (self-reference bypass) | FAIL |

---

## ARCHITECT Endpoint Coverage

| Endpoint | ARCHITECT-Confirmed | Verification Status | Notes |
|---|---|---|---|
| createVportPublicBookingController | YES (security-surface.json callChains.publicBooking) | VERIFIED | PARTIAL — voided actor gap |
| createOwnerBookingController | YES (system-map.md: createOwnerBookingController in scope) | VERIFIED | PASS with LOW gap |
| updateBookingStatusController | YES (callChains.bookingStatusUpdate) | VERIFIED | PASS |
| rescheduleBookingController | YES (callChains.bookingReschedule) | VERIFIED | PASS |
| reviewFuelPriceSuggestionController | YES (callChains.fuelPriceReview) | VERIFIED | DEGRADED |
| submitOwnerFuelPriceUpdateController | YES (securitySensitiveSurfaces mention) | VERIFIED | DEGRADED |
| updateStationFuelUnitController | YES (VENOM-WS-002 blast radius confirmed by BW) | VERIFIED | DEGRADED |
| publishFuelPriceUpdateAsPostController | YES (securitySensitiveSurfaces, BW-NEW-001) | VERIFIED | FAIL |

**Coverage Summary:**
- ARCHITECT-confirmed endpoints: 8
- HAWKEYE-verified this run: 8
- UNVERIFIED (WATCH): 0
- NOT_IN_ARCHITECT (flag for re-run): 0

---

## API Contract Verification

### HAWKEYE TRACE — createVportPublicBookingController

```
HAWKEYE TRACE
- traceId:       HAWKEYE-2026-06-05-001
- endpoint:      createVportPublicBookingController
- method:        Supabase client SDK (INSERT)
- environment:   SOURCE_REVIEW
- auth state:    anonymous | authenticated
- actor context: kind: user (optional) | null (guest)
- timestamp:     2026-06-05
```

**Contract:**
- Input: resourceId (required), startsAt (required), endsAt (required), timezone (required), requestActorId (optional), customerName, customerNote
- Output: booking row (id, profile_id, resource_id, ...) or Error

**Verification Results:**
- Required field enforcement: PASS — explicit throws for all 4 required fields
- Resource active check: PASS — `resource.is_active !== true` throws
- Past-time guard: PASS — `startsAt <= Date.now()` throws
- Service label resolution: PASS — server-side only, no client trust
- customer_actor_id binding: PASS — session-derived (VPD-V-019)
- linkPath scrubbing: PASS — `linkPath: null` (VPD-V-020)
- Voided actor check: FAIL — is_void not selected or checked (VENOM-WS-001)

**Overall: PARTIAL**

---

### HAWKEYE TRACE — createOwnerBookingController

```
HAWKEYE TRACE
- traceId:       HAWKEYE-2026-06-05-002
- endpoint:      createOwnerBookingController
- method:        Supabase client SDK (INSERT)
- environment:   SOURCE_REVIEW
- auth state:    authenticated (owner only)
- actor context: kind: user (owner-kind required)
- timestamp:     2026-06-05
```

**Contract:**
- Input: callerActorId (required), resourceId (required), startsAt (required), endsAt (required), timezone, serviceLabelSnapshot, durationMinutes, customerName, customerNote
- Output: booking row with status "confirmed"

**Verification Results:**
- Required field enforcement: PASS — explicit throws for callerActorId, resourceId, startsAt, endsAt
- Time-order validation: PASS — `startsAt >= endsAt` throws
- Past-time validation: FAIL — no `startsAt <= Date.now()` check (BW-NEW-002)
- Ownership verification: PASS — assertActorOwnsVportActorController (user-kind + actor_owners)
- status field: PASS — hardcoded to "confirmed" (not from caller)
- customer_actor_id: PASS — not set (intentional walk-in semantics)

**Overall: PASS (LOW gap noted: BW-NEW-002)**

---

### HAWKEYE TRACE — updateBookingStatusController

```
HAWKEYE TRACE
- traceId:       HAWKEYE-2026-06-05-003
- endpoint:      updateBookingStatusController
- method:        Supabase client SDK (UPDATE)
- environment:   SOURCE_REVIEW
- auth state:    authenticated (owner or customer)
- actor context: kind: user
- timestamp:     2026-06-05
```

**Contract:**
- Input: bookingId (required), status (required), callerActorId (required)
- Output: updated booking row

**Verification Results:**
- Required field enforcement: PASS — throws for all 3 required fields
- Terminal state gate: PASS — checked BEFORE auth (VPD-V-021)
- Status enum validation: PASS — OWNER_STATUSES / CUSTOMER_STATUSES server-side allowlists
- Ownership: PASS — dual-path (customer ID match OR assertActorOwnsVportActorController)
- profileId scope lock: PASS — DAL uses DB-derived profileId (not caller-supplied)
- Cross-user cancel protection: PASS — isCustomer only true if callerActorId === booking.customer_actor_id

**Overall: PASS**

---

### HAWKEYE TRACE — rescheduleBookingController

```
HAWKEYE TRACE
- traceId:       HAWKEYE-2026-06-05-004
- endpoint:      rescheduleBookingController
- method:        Supabase client SDK (UPDATE)
- environment:   SOURCE_REVIEW
- auth state:    authenticated (owner only)
- actor context: kind: user
- timestamp:     2026-06-05
```

**Contract:**
- Input: bookingId, startsAt, endsAt, resourceId (optional), durationMinutes (optional), callerActorId
- Output: updated booking row

**Verification Results:**
- Required field enforcement: PASS — throws for bookingId, callerActorId, startsAt, endsAt
- Time-order check: PASS — `startsAt >= endsAt` throws
- Terminal state gate: PASS — VPD-V-021 check present
- Ownership: PASS — assertActorOwnsVportActorController (owner-only; customer cannot reschedule)
- Conflict detection: PASS — listVportBookingsInRangeDAL checks overlapping bookings

**Overall: PASS**

---

### HAWKEYE TRACE — reviewFuelPriceSuggestionController

```
HAWKEYE TRACE
- traceId:       HAWKEYE-2026-06-05-005
- endpoint:      reviewFuelPriceSuggestionController
- method:        Supabase client SDK (UPDATE + INSERT)
- environment:   SOURCE_REVIEW
- auth state:    authenticated (station owner)
- actor context: kind: user or vport (gate is kind-agnostic — WEAKNESS)
- timestamp:     2026-06-05
```

**Contract:**
- Input: submissionId, decision ("approved"|"rejected"), decidedByActorId, reason, applyToOfficialOnApprove
- Output: { ok, submission, review, official }

**Verification Results:**
- Required field enforcement: PASS — throws for submissionId, decision, decidedByActorId
- Decision enum validation: PASS — VALID_DECISIONS Set check
- Ownership verification: WEAK — checkVportOwnershipController (navigation gate, not mutation gate; VPORT-kind self-shortcut fires; VENOM-WS-002)
- Pending check: PARTIAL — app-layer only; DB UPDATE has no status precondition (VENOM-WS-003)
- Fuel key allowlist on approve: PASS — ALLOWED_FUEL_KEYS.has() check
- targetActorId resolution: PASS — resolved from subRow.profile_id, not caller-supplied

**Overall: DEGRADED**

---

### HAWKEYE TRACE — submitOwnerFuelPriceUpdateController

```
HAWKEYE TRACE
- traceId:       HAWKEYE-2026-06-05-006
- endpoint:      submitOwnerFuelPriceUpdateController
- method:        Supabase client SDK (UPSERT + INSERT)
- environment:   SOURCE_REVIEW
- auth state:    authenticated (station owner)
- actor context: kind: user or vport (gate is kind-agnostic)
- timestamp:     2026-06-05
```

**Contract:**
- Input: targetActorId, actorId, fuelKey, proposedPrice, currencyCode, unit, isAvailable, source
- Output: { ok, official } or { ok: false, reason }

**Verification Results:**
- Ownership verification: WEAK — checkVportOwnershipController (navigation gate; VENOM-WS-002)
- Price validation: PARTIAL — Number.isFinite check present; no minimum constraint if sanity disabled
- No missing required field throws (returns { ok: false } on ownership fail)

**Overall: DEGRADED**

---

### HAWKEYE TRACE — updateStationFuelUnitController

```
HAWKEYE TRACE
- traceId:       HAWKEYE-2026-06-05-007
- endpoint:      updateStationFuelUnitController
- method:        Supabase client SDK (UPDATE)
- environment:   SOURCE_REVIEW
- auth state:    authenticated (station owner)
- actor context: kind: user or vport (gate is kind-agnostic)
- timestamp:     2026-06-05
```

**Contract:**
- Input: actorId, targetActorId, unit
- Output: { ok, unit } or { ok: false, reason }

**Verification Results:**
- Ownership verification: WEAK — checkVportOwnershipController (VENOM-WS-002)
- Unit allowlist: PASS — ALLOWED_UNITS = ["liter", "gallon"]
- Missing actor guard: PASS — `if (!actorId || !targetActorId) return { ok: false }`

**Overall: DEGRADED**

---

### HAWKEYE TRACE — publishFuelPriceUpdateAsPostController

```
HAWKEYE TRACE
- traceId:       HAWKEYE-2026-06-05-008
- endpoint:      publishFuelPriceUpdateAsPostController
- method:        Feed: createSystemPost → vport.posts INSERT
- environment:   SOURCE_REVIEW
- auth state:    authenticated (any actor kind bypasses gate)
- actor context: kind: user OR vport — BOTH bypass ownership gate
- timestamp:     2026-06-05
```

**Contract:**
- Input: actorId, updatedFuels
- Output: { published, status, postId }

**Verification Results:**
- Ownership verification: ABSENT (effectively) — self-reference `(actorId, actorId)` always short-circuits; actor_owners NEVER queried (BW-NEW-001 + ELEK-2026-06-05-005)
- actorId null guard: PASS — explicit throw
- Fuel key validation: PASS — FUEL_LABELS allowlist filter
- Price validation: PASS — `Number.isFinite(p) && p >= 0`
- Dedup: PASS — hasRecentFuelPricePostDAL throttle window
- post_type: PASS — hardcoded "fuel_price_update" (not from caller)

**Auth gate status:** FAIL — any authenticated actor can post system content attributed to their actor ID.

**Overall: FAIL**

---

## Auth Verification

| Endpoint | Auth Required | Observed Behavior | Auth Enforcement | Status |
|---|---|---|---|---|
| createVportPublicBookingController | Partial | kind check present; is_void not selected | WEAK | PARTIAL |
| createOwnerBookingController | YES | assertActorOwnsVportActorController | STRONG | PASS |
| updateBookingStatusController | YES | TERMINAL + dual-path + assertActorOwnsVportActorController | STRONG | PASS |
| rescheduleBookingController | YES | assertActorOwnsVportActorController | STRONG | PASS |
| reviewFuelPriceSuggestionController | YES | checkVportOwnershipController (navigation gate) | WEAK | DEGRADED |
| submitOwnerFuelPriceUpdateController | YES | checkVportOwnershipController (navigation gate) | WEAK | DEGRADED |
| updateStationFuelUnitController | YES | checkVportOwnershipController (navigation gate) | WEAK | DEGRADED |
| publishFuelPriceUpdateAsPostController | YES | self-reference bypass — actor_owners never queried | ABSENT | FAIL |

**Auth Issues Summary:** 5
- VENOM-WS-001: voided actor booking (createVportPublicBookingController)
- VENOM-WS-002: VPORT-kind navigation gate used for mutation (3 gas price controllers)
- BW-NEW-001 / ELEK-2026-06-05-005: any actor bypasses ownership in publishFuelPriceUpdateAsPost

---

## Payload Validation Review

| Endpoint | Payload Scenario | Observed Response | Status |
|---|---|---|---|
| createVportPublicBookingController | Missing resourceId | throw "resourceId is required" | PASS |
| createVportPublicBookingController | Missing startsAt | throw "startsAt is required" | PASS |
| createVportPublicBookingController | startsAt in past | throw "This time slot is no longer available." | PASS |
| createVportPublicBookingController | VPORT-kind requestActorId | throw "Switch to your citizen profile to book." | PASS |
| createVportPublicBookingController | Voided user-kind requestActorId | Proceeds — voided actor passes kind gate | FAIL (VEMON-WS-001) |
| createOwnerBookingController | Missing callerActorId | throw "callerActorId is required" | PASS |
| createOwnerBookingController | startsAt >= endsAt | throw "startsAt must be before endsAt." | PASS |
| createOwnerBookingController | startsAt in past | Proceeds — no past-time guard | FAIL (BW-NEW-002) |
| updateBookingStatusController | Invalid status | throw "Invalid status: X" | PASS |
| updateBookingStatusController | Customer attempts non-cancel | throw "Customers may only cancel bookings." | PASS |
| updateBookingStatusController | Terminal booking mutation | throw "Booking is already X" | PASS |
| rescheduleBookingController | Conflicting slot | throw "This time slot conflicts with an existing booking." | PASS |
| reviewFuelPriceSuggestionController | Invalid decision enum | return { ok: false, reason: "invalid_decision" } | PASS |
| reviewFuelPriceSuggestionController | Invalid fuel_key on approve | return { ok: false, reason: "invalid_fuel_key" } | PASS |
| reviewFuelPriceSuggestionController | Double-approval (concurrent) | Both proceed — DB has no status precondition | FAIL (VENOM-WS-003) |
| updateStationFuelUnitController | Invalid unit | return { ok: false, reason: "invalid_unit" } | PASS |
| publishFuelPriceUpdateAsPostController | Invalid fuelKey | Filtered out from validFuels | PASS |
| publishFuelPriceUpdateAsPostController | User-kind actorId | Proceeds via assertActorOwns self-shortcut | FAIL (ELEK-005) |

---

## Edge Function Verification

No Supabase Edge Functions identified in scope for this branch (bookings/gasprices use client SDK directly). Supabase RLS is the edge-layer enforcement — not independently verified in this pass (DB command required for RLS audit).

**Watch:** Confirm with DB command whether `vport.bookings`, `vport.fuel_price_submissions`, `vport.fuel_prices` RLS policies enforce actor kind and void status at DB layer. If RLS is strong, the app-layer gaps are defense-in-depth failures rather than full exploits.

---

## Webhook Verification

No webhooks in scope for this feature set.

---

## Runtime Environment Verification

| Check | Result | Notes |
|---|---|---|
| Supabase schema client import (vportClient) | PASS | Named + default export verified same instance (ELEK-004-IMPORT closed) |
| PUBLIC_REALM_ID in publishFuelPriceUpdateAsPost | PASS — null guard present | `if (!realmId) return { published: false }` |
| Date.now() in past-time guards | PASS (where present) | createVportPublicBookingController uses correctly |
| Intl.DateTimeFormat() timezone fallback | INFO | createOwnerBookingController falls back to server locale — acceptable |

---

## Contract Drift Review

| Endpoint | Expected Schema | Observed Schema | Drift | Status |
|---|---|---|---|---|
| insertVportBookingDAL | WRITE_COLS frozen allowlist | pick(row, WRITE_COLS) — confirmed | NONE | PASS |
| updateVportBookingDAL | UPDATABLE_COLS | excludes customer_actor_id, created_by_actor_id | NONE | PASS |
| updateFuelPriceSubmissionStatusDAL | status precondition | .eq("id", submissionId) only — missing .eq("status","pending") | MINOR (idempotency gap) | WATCH |
| Notification context | booking fields | customerName raw (not escaped at controller layer) | MINOR | WATCH |

**Contract Drift: NONE** (no breaking schema changes; MINOR gaps noted as WATCH items)

---

## Observability Verification

| Endpoint | Error Logging Present | Success Logging | Gaps |
|---|---|---|---|
| updateBookingStatusController | PARTIAL — notification failure caught + logged in DEV only: `console.error` | None | Notification failures silently dropped in production |
| createVportPublicBookingController | None | None | No observability on booking creation failure modes |
| reviewFuelPriceSuggestionController | None | None | TOCTOU double-approval produces no log signal |
| publishFuelPriceUpdateAsPostController | None | None | Bypass scenarios produce no log signal |

**Observability Gap:** reviewFuelPriceSuggestionController TOCTOU (VENOM-WS-003) — concurrent double-approval is silent; no log, no alert. This makes the defect invisible in production monitoring.

---

## HAWKEYE Verification Results — FAIL and DEGRADED

### FAIL: publishFuelPriceUpdateAsPostController — Auth Effectively Absent

```
HAWKEYE VERIFICATION RESULT
Finding:          Auth gate bypassed — any non-void actor can create fuel_price_update system posts
Endpoint:         publishFuelPriceUpdateAsPostController
Auth Enforcement: ABSENT (self-reference bypass in checkVportOwnershipController)
Evidence Type:    INFERRED (code trace — BLIND_REVERIFY_MODE; not live-tested)
Confidence:       HIGH — both bypass paths (VPORT-kind and user-kind) confirmed from source
Impact:           Public feed contamination with fake fuel price data; misleading system post attribution
Severity:         MEDIUM
Status:           Open
Cross-refs:       BW-NEW-001, ELEK-2026-06-05-005
Handoff:          VENOM (trust boundary redesign), BLACKWIDOW (runtime confirmation of user-kind path)
```

### DEGRADED: Gas Price Mutation Controllers (3) — Navigation Gate as Mutation Gate

```
HAWKEYE VERIFICATION RESULT
Finding:          checkVportOwnershipController (navigation gate) used as mutation gate for 3 controllers
Endpoints:        reviewFuelPriceSuggestionController, submitOwnerFuelPriceUpdateController, updateStationFuelUnitController
Auth Enforcement: WEAK — VPORT-kind actor with matching ID bypasses actor_owners query
Evidence Type:    INFERRED
Confidence:       HIGH
Impact:           VPORT-kind actor token (without user ownership) can approve/modify prices
Severity:         MEDIUM
Status:           Open
Cross-refs:       VENOM-WS-002, BW-S-007
Handoff:          VENOM (ownership gate redesign), ELEKTRA (patch advisory per ELEK report)
```

### PARTIAL: createVportPublicBookingController — Voided Actor

```
HAWKEYE VERIFICATION RESULT
Finding:          Voided actor passes kind gate and can create bookings
Endpoint:         createVportPublicBookingController
Auth Enforcement: PARTIAL — kind check present, is_void not selected or checked
Evidence Type:    INFERRED
Confidence:       HIGH
Impact:           Booking created with suspended/voided actor as customer
Severity:         MEDIUM
Status:           Open
Cross-refs:       VENOM-WS-001, BW-S-006
Handoff:          ELEKTRA (patch advisory), DB (verify RLS is_void filtering on vport.bookings)
```

---

## Handoff Matrix

| Finding | Recommended Handoff | Reason |
|---|---|---|
| VENOM-WS-001 (voided actor) | DB, VENOM | RLS needs to confirm is_void filtering; VENOM owns trust boundary fix |
| VENOM-WS-002 (3 gas controllers — navigation gate) | VENOM, ELEKTRA | Ownership gate design must be revised; ELEKTRA has patch advisory |
| VENOM-WS-003 (TOCTOU) | DB, Carnage | .eq("status","pending") precondition requires DAL change; Carnage if index needed |
| BW-NEW-001 + ELEK-005 (publishFuelPriceUpdateAsPost bypass) | VENOM, BLACKWIDOW | Trust boundary redesign; BLACKWIDOW should confirm user-kind path at runtime |
| BW-NEW-002 (owner backdated booking) | Controller fix | Simple past-time guard patch (see ELEKTRA patch queue #6) |
| TOCTOU observability gap | LOKI | Silent double-approval in production has no log signal |

---

## Final HAWKEYE Status

**DEGRADED**

Rationale:
- 4 PASS (booking creation-with-ownership, booking update, reschedule, booking status) — booking mutation paths are well-protected
- 1 FAIL (publishFuelPriceUpdateAsPostController) — auth gate effectively absent via dual bypass paths
- 3 DEGRADED (gas price mutation controllers) — navigation gate used for mutation paths
- 3 PARTIAL/WATCH (voided actor booking; owner backdated booking; TOCTOU observability)

Not CRITICAL: No endpoint provides total auth bypass on identity-tier data (actor_owners, profiles). The FAIL endpoint is a content injection surface (feed post), not a financial or identity data breach path. Booking mutation paths (highest-risk surfaces) are all PASS.

Booking engine: STRONG protection overall.
Gas price + feed engine: DEGRADED — 4 controllers require ownership gate replacement before release.

**Sudden Death assessment:** No CRITICAL auth_absent finding on a data-destruction endpoint. HAWKEYE is Blue Team — Sudden Death rule does not apply to Blue Team findings.

HAWKEYE emits: **DEGRADED**

HAWKEYE does NOT emit: THOR_RELEASE_ELIGIBLE
Release authority belongs exclusively to THOR.
