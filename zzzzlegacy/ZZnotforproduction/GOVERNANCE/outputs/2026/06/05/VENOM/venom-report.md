# VENOM — Security Review Report
Generated: 2026-06-05
Branch: vport-booking-feed-security-updates
Mode: SECURITY_WARFARE_SIMULATION / BLUE_TEAM / BLIND_REVERIFY_MODE
Application Scope: VCSM
Reviewer: VENOM

---

## BLIND REVERIFY CHECK

| Check | Status |
|---|---|
| Historical reports not loaded during reconstruction | PASS |
| Current ARCHITECT artifacts loaded | PASS |
| Current source files re-read | PASS |
| Chain rebuilt from source | PASS |
| Exploitability assessed before report comparison | PASS |

---

## REVERIFY DISCOVERY CHECK

| Check | Status |
|---|---|
| Original finding re-tested | PASS |
| Adjacent flows reviewed | PASS |
| Alternate exploit paths searched | PASS |
| Patch regressions searched | PASS |
| New findings assessment completed | PASS |

---

## Scope

Features reviewed from current source:
- `dashboard/vport/bookings/controller/vportPublicBooking.controller.js`
- `dashboard/vport/bookings/controller/updateVportBooking.controller.js`
- `dashboard/vport/bookings/controller/createOwnerBooking.controller.js`
- `dashboard/vport/bookings/dal/insertVportBooking.write.dal.js`
- `dashboard/vport/dal/write/updateVportBooking.write.dal.js`
- `dashboard/vport/dal/read/actorVport.read.dal.js`
- `dashboard/vport/dal/read/vportResource.read.dal.js`
- `dashboard/vport/dal/read/vportAvailabilityRules.read.dal.js`
- `dashboard/vport/dal/read/listVportBookingsForProfileDay.read.dal.js`
- `dashboard/vport/controller/vportOwnerStats.controller.js`
- `dashboard/vport/controller/checkVportOwnership.controller.js`
- `booking/controller/assertActorOwnsVportActor.controller.js`
- `booking/adapters/booking.adapter.js`
- `gasprices/controller/reviewFuelPriceSuggestion.controller.js`
- `gasprices/dal/vportFuelPriceSubmissions.write.dal.js`
- `flyerBuilder/designStudio/controller/designStudio.shared.controller.js`
- `services/supabase/vportClient.js` (export shape)

---

## Prior Finding Status — Independently Reconstructed from Source

| Finding ID | Description | Source Status |
|---|---|---|
| VPD-V-019 | customer_actor_id injection | CLOSED_SOURCE_VERIFIED |
| VPD-V-020 | linkPath UUID scrubbing in notifications | CLOSED_SOURCE_VERIFIED |
| VPD-V-021 | Terminal booking state immutability | CLOSED_SOURCE_VERIFIED |
| ELEK-004 | Kind check before self-shortcut (assertActorOwns) | CLOSED_SOURCE_VERIFIED |
| BOOK-001 | 23505 slot collision translation | CLOSED_SOURCE_VERIFIED |
| BOOK-002 | Kind gate for public booking creation | CLOSED_SOURCE_VERIFIED |
| VENOM-GAS-001 | Gas owner ownership check in review | CLOSED_SOURCE_VERIFIED |
| VENOM-GAS-002 | Slug route gas price resolution | CLOSED_SOURCE_VERIFIED |
| ELEK-004-IMPORT | vportAvailabilityRules named import discrepancy | CLOSED_SOURCE_VERIFIED (same instance) |

### Closure Evidence:
- **VPD-V-019**: `createVportPublicBookingController:84` — `customer_actor_id: requestActorId ?? null`. WRITE_COLS frozen allowlist prevents DAL injection. No client-supplied actor ID accepted.
- **VPD-V-020**: `vportPublicBooking.controller.js:116` — `linkPath: null` hardcoded. UUID cannot appear in notification row.
- **VPD-V-021**: `updateVportBooking.controller.js:35-37` — TERMINAL_STATUSES checked before `assertActorOwnsVportActorController`. Terminal check fires before ownership resolution.
- **ELEK-004**: `assertActorOwnsVportActor.controller.js:23-34` — `getActorByIdDAL` + `kind !== "user"` check precedes self-shortcut at line 34. Unconditional.
- **BOOK-001**: `insertVportBookingDAL:39-41` — error.code === "23505" caught and translated to user-facing Error before propagation.
- **BOOK-002**: `vportPublicBooking.controller.js:57-61` — `readActorVportLinkDAL` called unconditionally for non-null requestActorId; `actor.kind !== "user"` throws.
- **VENOM-GAS-001**: `reviewFuelPriceSuggestion.controller.js:48-52` — `checkVportOwnershipController` called with `decidedByActorId` before any write.
- **VENOM-GAS-002**: `vportFuelPriceSubmissions.write.dal.js:29-30` — `resolveVportProfileId(targetActorId)` called; caller never supplies profileId.
- **ELEK-004-IMPORT**: `vportClient.js:5-6` — `export const vport` AND `export default vport` both present. Named import and default import resolve to same Supabase schema client instance. No security divergence.

---

## NEW FINDINGS — Discovered from Current Source

---

### VENOM-WS-001 — Voided Actor Booking Creation

**Severity:** MEDIUM
**Status:** NEW_FINDING_CREATED
**Location:** `apps/VCSM/src/features/dashboard/vport/dal/read/actorVport.read.dal.js:1-15`
**Trigger path:** `createVportPublicBookingController` → `readActorVportLinkDAL`

**Description:**
`readActorVportLinkDAL` reads from `vc.actors` and selects `id,kind,vport_id`. It does NOT filter by `is_void`. A citizen actor whose account has been voided/deactivated retains `kind: "user"` in the actors table. The controller check `actor.kind !== "user"` passes for voided users, allowing them to create bookings.

**Exploit Chain:**
```
Attacker: voided citizen actor (kind:"user", is_void:true)
1. Call createVportPublicBookingController({ resourceId, requestActorId: voided_actor_id, ... })
2. readActorVportLinkDAL returns { id, kind:"user", vport_id:null } — no is_void field selected
3. actor.kind !== "user" → false → kind gate passes
4. insertVportBookingDAL called with voided actor as customer_actor_id
5. Booking created with voided/suspended citizen attributed as customer
```

**Exploitability:** MEDIUM
**Attack Preconditions:**
- Actor must be voided/deactivated
- Must know a valid resourceId
- No additional authentication bypass required

**Blast Radius:** Single VPORT booking system; affects booking records with suspended actor attribution.

**Trust Boundary:** Authenticated Citizen (voided) → Booking system
**Boundary Violated:** Voided actor → Active booking creation

**RLS Dependency:** UNVERIFIED — RLS on bookings table may or may not block voided actors; `vc.actors` RLS not verified for `is_void` filtering.

**Platform Surface:** PWA, Booking Engine, Supabase Table/View

**Identity Leak Type:** Booking identity exposure (voided actor attributed as customer)

**Cache Trust Type:** Booking-sensitive

**Contract Violated:** Booking Trust Contract

**Recommended Mitigation:**
Add `is_void` to `readActorVportLinkDAL` select columns OR check `is_void` in the controller after retrieving the actor:
```js
const actor = await readActorVportLinkDAL({ actorId: requestActorId });
if (!actor || actor.is_void === true) throw new Error("Only citizens can book appointments.");
if (actor.kind !== "user") throw new Error("Switch to your citizen profile to book.");
```

---

### VENOM-WS-002 — VPORT-Kind Actor Mutation via checkVportOwnershipController Self-Shortcut

**Severity:** MEDIUM
**Status:** NEW_FINDING_CREATED
**Location:** `apps/VCSM/src/features/dashboard/vport/controller/checkVportOwnership.controller.js:8-10`
**Trigger path:** `reviewFuelPriceSuggestionController` → `checkVportOwnershipController` → VPORT-kind self-shortcut

**Description:**
`checkVportOwnershipController` contains a self-ownership shortcut that returns `true` when `callerActorId === targetActorId` AND `actor.kind === "vport"`. The function's own inline comment states _"This is a navigation/visibility gate only — mutations require a user-kind actor."_ Despite this, `reviewFuelPriceSuggestionController` uses this function as the authorization gate for approving fuel price submissions — a mutation operation. A VPORT-kind actor can approve their own fuel price submissions by switching to VPORT identity and self-calling.

**Exploit Chain:**
```
Attacker: user who legitimately owns VPORT, switches to VPORT actor identity
1. VPORT actor submits (or observes pending) a fuel price submission for their own station
2. Call reviewFuelPriceSuggestionController({ submissionId, decidedByActorId: VPORT_actor_id, ... })
3. checkVportOwnershipController({ callerActorId: VPORT_actor_id, targetActorId: VPORT_actor_id })
4. callerActorId === targetActorId → true
5. getActorByIdDAL returns VPORT actor with kind:"vport"
6. kind === "vport" && !is_void → checkVportOwnershipController returns true
7. Fuel price approved without user-kind ownership verification via actor_owners
```

**Note:** This is a legitimate user's own VPORT in normal use. The security issue is that VPORT-kind actor identity is accepted for mutation operations. If an attacker obtained access to a VPORT actor token (without the associated user token), they could approve prices. Additionally, the declared intent of the code is violated.

**Exploitability:** MEDIUM
**Attack Preconditions:**
- Attacker must have access to VPORT-kind actor identity
- Target must be the same VPORT as attacker identity
- No cross-station exploitation possible

**Blast Radius:** Single VPORT fuel prices; financial accuracy concern for gas station pricing.

**Trust Boundary:** VPORT Actor (navigation) → VPORT Mutation (fuel price approval)
**Boundary Violated:** Navigation gate used as mutation gate

**RLS Dependency:** ASSUMED — fuel_price_submissions RLS may or may not restrict by actor kind.

**Platform Surface:** PWA, Supabase Table/View

**Identity Leak Type:** None (same-actor operation)

**Cache Trust Type:** Financial-sensitive (fuel pricing)

**Contract Violated:** Actor Ownership Contract

**Recommended Mitigation:**
Either:
1. `reviewFuelPriceSuggestionController` should call `assertActorOwnsVportActorController` directly (user-kind required), OR
2. Add a user-kind guard after `checkVportOwnershipController` returns true:
```js
// After ownership verified, ensure decidedByActorId is user-kind for mutation
const actor = await getActorByIdDAL({ actorId: decidedByActorId });
if (!actor || actor.kind !== "user") return { ok: false, reason: "mutation_requires_user_actor" };
```

---

### VENOM-WS-003 — TOCTOU Race in Fuel Price Submission Review

**Severity:** LOW-MEDIUM
**Status:** NEW_FINDING_CREATED
**Location:** `apps/VCSM/src/features/dashboard/vport/dashboard/cards/gasprices/controller/reviewFuelPriceSuggestion.controller.js:54-56`

**Description:**
The pending-status guard `if (subRow.status !== "pending")` is an app-layer read followed by a write. Two concurrent review requests for the same submission can both read `status === "pending"` before either write completes, resulting in double-approval: two review log entries, two price history entries, two cache invalidations.

**Exploit Chain:**
```
Two concurrent requests for submissionId X:
Request A: fetchFuelPriceSubmissionByIdDAL → status:"pending" → proceed
Request B: fetchFuelPriceSubmissionByIdDAL → status:"pending" → proceed (before A commits)
Request A: updateFuelPriceSubmissionStatusDAL → status:"approved"
Request B: updateFuelPriceSubmissionStatusDAL → status:"approved" (double-write)
Both: upsertVportFuelPriceDAL, createVportFuelPriceHistoryDAL → duplicate entries
```

**Exploitability:** LOW
**Attack Preconditions:**
- Requires double-tap or concurrent network requests
- Attacker must be the VPORT owner
- Timing window is narrow

**Blast Radius:** Single VPORT; duplicate fuel price history entries.

**Trust Boundary:** Authenticated VPORT Owner
**Boundary Violated:** Idempotency guarantee

**RLS Dependency:** ASSUMED — DB-level idempotency not verified.

**Platform Surface:** PWA, Supabase Table/View

**Cache Trust Type:** Financial-sensitive

**Contract Violated:** Booking Trust Contract (submission review idempotency)

**Recommended Mitigation:**
Use a DB-level conditional update: `UPDATE ... SET status='approved' WHERE id=$id AND status='pending'` and check affected rows. Or apply a DB unique constraint on `(submission_id, decision)`.

---

## Closed Findings Summary

| ID | Description | Status |
|---|---|---|
| VPD-V-019 | customer_actor_id injection | CLOSED_SOURCE_VERIFIED |
| VPD-V-020 | linkPath UUID in notification | CLOSED_SOURCE_VERIFIED |
| VPD-V-021 | Terminal booking mutation | CLOSED_SOURCE_VERIFIED |
| ELEK-004 | Kind check before self-shortcut | CLOSED_SOURCE_VERIFIED |
| BOOK-001 | 23505 error translation | CLOSED_SOURCE_VERIFIED |
| BOOK-002 | Kind gate for public booking | CLOSED_SOURCE_VERIFIED |
| VENOM-GAS-001 | Gas owner ownership check | CLOSED_SOURCE_VERIFIED |
| VENOM-GAS-002 | Slug route gas price | CLOSED_SOURCE_VERIFIED |
| ELEK-004-IMPORT | vportClient import discrepancy | CLOSED_SOURCE_VERIFIED |

---

## Finding Count Summary

| Severity | Count |
|---|---|
| CRITICAL | 0 |
| HIGH | 0 |
| MEDIUM | 2 |
| LOW | 1 |
| INFO | 0 |
| CLOSED | 9 |

---

## VENOM Recommendation

**BLUE TEAM STATUS: CAUTION**

Two new MEDIUM findings discovered. No exploits are immediately critical, but:
- VENOM-WS-001: Voided actor booking is a trust boundary gap that should be closed before release.
- VENOM-WS-002: Mutation path using navigation-only gate is an architectural inconsistency with real abuse potential.
- VENOM-WS-003: TOCTOU is low-probability but creates data integrity risk.

All prior patched findings (9 total) verified CLOSED from current source.

VENOM emits: **CAUTION** (new findings discovered — not PASS)

VENOM does NOT emit: THOR_RELEASE_ELIGIBLE
Release authority belongs exclusively to THOR.
