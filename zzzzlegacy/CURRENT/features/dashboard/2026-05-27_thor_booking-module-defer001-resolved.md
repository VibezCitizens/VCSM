# THOR RELEASE REPORT — Booking Module (DEFER-001 Resolved — Re-evaluation)

**Date:** 2026-05-27  
**Reviewer:** THOR  
**Trigger:** Live DB evidence confirms DEFER-001 resolved — re-evaluation of prior BLOCKED verdict  
**Prior report:** `2026-05-27_thor_booking-module-deferred-gate.md` (BLOCKED verdict, superseded by this report)  
**Branch:** vport-booking-feed-security-updates  

---

## LIVE DB EVIDENCE — DEFER-001 RESOLUTION CONFIRMED

The following live DB query results were provided and verified:

```json
{ "has_legacy_bookings_insert_owner": false,
  "has_canonical_bookings_insert_actor_owner": true }
```

**Confirmed:**
- `bookings_insert_owner` (legacy `profiles.owner_user_id = auth.uid()`) — **DOES NOT EXIST**
- `bookings_insert_actor_owner` (canonical `actor_owners` model) — **EXISTS AND ACTIVE**

This definitively resolves DEFER-001. The bookings INSERT path is now on the `actor_owners` identity model consistent with the rest of the platform.

---

## LIVE DB — FULL POLICY SET VERIFIED

| Policy | CMD | Trust Model | Status |
|---|---|---|---|
| `bookings_insert_actor_owner` | INSERT | `actor_owners` JOIN — `ao.user_id = auth.uid()` + `NOT ao.is_void` | CANONICAL ✓ |
| `bookings_insert_public_pending` | INSERT | `vc.current_actor_id()` — customer_actor_id, created_by_actor_id, status='pending', source='public', future time, non-zero duration | CANONICAL ✓ |
| `bookings_select_actor_owner` | SELECT | `actor_owners` JOIN | CANONICAL ✓ |
| `bookings_select_customer` | SELECT | `customer_actor_id = vc.current_actor_id()` | CANONICAL ✓ |
| `bookings_select_resource_neutral` | SELECT | `current_actor_can_manage_resource` OR customer OR created_by | CANONICAL ✓ |
| `bookings_update_actor_owner` | UPDATE | `actor_owners` JOIN | CANONICAL ✓ |
| `bookings_update_customer` | UPDATE | `customer_actor_id = vc.current_actor_id()` | CANONICAL ✓ |
| `bookings_update_resource_neutral` | UPDATE | `current_actor_can_manage_resource` OR customer | CANONICAL ✓ |
| `bookings_update_vport_owner` | UPDATE | `vport.actor_can_manage_profile(vc.current_actor_id(), profile_id)` | CANONICAL ✓ |

**Table grants:** INSERT + SELECT + UPDATE granted to `authenticated`. DELETE restricted to `postgres` (correct — no soft/hard delete by authenticated users via raw table).

---

## DB-LEVEL MITIGATIONS FOR PRIOR ELEKTRA FINDINGS

### ELEK-003 — customerActorId spoofing (was MEDIUM)
`bookings_insert_public_pending` enforces `customer_actor_id = vc.current_actor_id()` AND `created_by_actor_id = vc.current_actor_id()` at the DB layer.

**Result:** Public booking path attribution fraud is DB-blocked. An authenticated caller cannot INSERT a public booking with a `customer_actor_id` that differs from their current actor. The engine-layer fix (ELEK-003 patch) is still recommended as defense-in-depth, but the DB policy eliminates the confirmed exploit path. **Severity downgraded: MEDIUM → LOW (engine hardening only).**

### ELEK-002 — status field no allowlist on public path (was MEDIUM)
`bookings_insert_public_pending` enforces `status = 'pending'` at the DB layer for public INSERTs. An arbitrary status string on the public path will be rejected by the DB policy.

**Remaining gap:** `bookings_insert_actor_owner` (owner/admin path) does NOT constrain `status`. An authorized owner (verified via actor_owners) could INSERT a booking with an arbitrary status on their own VPORT. Self-harm only — actor is authorized and owns the resource. **Severity downgraded: MEDIUM → LOW (owner-only, self-harm, authorized caller).**

### ELEK-001 — cancelBooking customer path: no void/kind check (remains MEDIUM)
The `bookings_update_customer` UPDATE policy uses `customer_actor_id = vc.current_actor_id()`. The void/kind check concern is at the engine controller layer — a void actor whose session is technically still valid could pass `vc.current_actor_id()`. The DB policy doesn't gate on `is_void`. Engine-level fix still recommended.

**Status: Remains MEDIUM — engine layer only.**

---

## THOR RELEASE TARGET

**Application Scope:** VCSM + ENGINE  
**Release reason:** DEFER-001 confirmed resolved via live DB evidence. Re-evaluating booking module gate.  
**Release readiness:** CAUTION  
**Decision rationale:** Hard blocker (DEFER-001) is confirmed resolved. DB-level policies also provide defense-in-depth for ELEK-002 and ELEK-003 on the public booking path, downgrading both from MEDIUM to LOW. Remaining open item is ELEK-001 (MEDIUM — customer cancel path void/kind check at engine layer). No hard blockers remain. CAUTION gate clears.

---

## RELEASE SIGNAL INVENTORY

| Signal | Status | Latest Report | Notes |
|---|---|---|---|
| VENOM | PRESENT | Full chain complete | All P0 findings resolved |
| BLACKWIDOW | PRESENT | Folded into VENOM | Attack chains grounded |
| ELEKTRA | PRESENT | 2026-05-27_02-10_elektra_vport-booking-qr-module.md | 3 MED → 1 MED + 2 LOW after DB evidence; 3 LOW + 2 INFO unchanged |
| CARNAGE | PRESENT | DEFER-001 confirmed deployed (live DB) | Migration tracking to be confirmed in Carnage sprint |
| LOGAN | PRESENT | vcsm.vport.business-pipeline.v2.md | COMPLETE |
| KRAVEN | PRESENT | K-BOOK-01 P2 deferred | Non-blocking |
| ARCHITECT | PRESENT | Booking architecture documented | COMPLETE |
| SENTRY | PRESENT | 2026-05-27 ALIGNED | No violations |
| CONTRACT REVIEW | PRESENT | SENTRY covers this | ALIGNED |

---

## BOUNDARY SCOPE CHECK

| Protected Root | In Scope? | Modified? | Approval Needed? | Status |
|---|---|---|---|---|
| apps/VCSM | YES | YES | NO | Within scope |
| apps/wentrex | NO | NO | NO | Out of scope |
| apps/Traffic | NO | NO | NO | Out of scope |
| engines | YES (ENGINE) | YES | YES — approved | Approved |

---

## CRITICAL RELEASE GATES

| Gate | Status | Evidence | Release Impact |
|---|---|---|---|
| bookings INSERT — actor_owners model | PASS | Live DB: bookings_insert_actor_owner confirmed active; has_legacy = false | DEFER-001 CLOSED |
| Public booking attribution | PASS (DB-enforced) | bookings_insert_public_pending: customer_actor_id = vc.current_actor_id() | ELEK-003 DB-mitigated |
| Public booking status | PASS (DB-enforced) | bookings_insert_public_pending: status = 'pending' enforced | ELEK-002 public path DB-mitigated |
| Public booking time bounds | PASS | bookings_insert_public_pending: starts_at > now(), ends_at > starts_at, duration > 0 | Defense-in-depth |
| Owner status field (engine layer) | PARTIAL | bookings_insert_actor_owner has no status constraint; engine layer unvalidated | LOW — authorized owner only |
| Customer cancel — void/kind check | PARTIAL | No DB policy gates is_void on customer cancel path; engine layer unvalidated | MEDIUM — engine fix pending |
| QR UUID leakage | PASS | isQrSafe guard in place | None |
| Notification link paths | PASS | Slug-resolved linkPaths confirmed | None |

---

## VCSM ACTOR TRUST GATE

| Gate | Status | Evidence | Release Impact |
|---|---|---|---|
| Actor ownership enforced | PASS | INSERT: actor_owners JOIN. UPDATE: actor_owners JOIN + current_actor_can_manage_resource | None |
| Public identity surface clean | PASS | No UUID in QR links, notification paths | None |
| VPORT lifecycle respected | PASS | Profile deleted_at IS NULL check in insert_public_pending policy | None |
| Feed attribution protected | PASS | Booking confirmation attributed via engine ownership | None |
| Booking trust protected | MOSTLY PASS | DB: customer_actor_id + status enforced on public path. Engine: cancelBooking void check pending (ELEK-001) | LOW residual |
| External API surface safe | PASS | Parameterized queries; no custom endpoints | None |
| SEO indexing safe | PASS | Booking confirmation not SEO-indexed | None |

---

## MIGRATION RELEASE GATE

| Migration Area | Status | Rollback | RLS Reviewed | Release Impact |
|---|---|---|---|---|
| DEFER-001 — bookings_insert_actor_owner | DEPLOYED (confirmed live DB) | — | YES — live DB verified | CLOSED |
| Migration file tracking | PENDING VERIFICATION | — | Carnage sprint to confirm | Non-blocking — policy is live and correct |
| ELEK-004 — atomic QR scan increment | NOT SUBMITTED | N/A | N/A | LOW |

**Migration gate: CAUTION.** Policy is live and correct. Migration file provenance should be confirmed in the next CARNAGE sprint but does not block the gate — the DB state is what matters for production safety.

---

## Security Findings (Revised)

| ID | Severity | Title | DB Mitigated? | Engine Fix Needed? | Status |
|---|---|---|---|---|---|
| DEFER-001 | RESOLVED | bookings_insert_owner legacy RLS | YES — policy replaced | N/A | CLOSED |
| ELEK-001 | MEDIUM | cancelBooking customer — no void/kind check | NO | YES | OPEN |
| ELEK-002 | LOW (was MEDIUM) | createBooking status — no allowlist | YES on public path; NO on owner path (self-harm) | YES (owner path hardening) | OPEN — LOW |
| ELEK-003 | LOW (was MEDIUM) | customerActorId not enforced vs requestActorId | YES — DB enforces on public path | YES (engine defense-in-depth) | OPEN — LOW |
| ELEK-004 | LOW | QR scan count non-atomic | NO | YES (Carnage RPC) | OPEN |
| ELEK-005 | LOW | buildMenuShortDisplayUrl missing isQrSafeSlug | NO | YES | OPEN |
| ELEK-006 | LOW | createQrLink destinationPath/qrType no allowlist | NO | YES | OPEN |
| ELEK-007 | INFO | Engine config singleton mutable | NO | YES (hardening) | OPEN |
| ELEK-008 | INFO | UUID_RE local copy in FlyerView | NO | YES (housekeeping) | OPEN |

---

## Risk Acceptance Register

| Risk | Severity | Accepted By | Reason | Expiration / Follow-up |
|---|---|---|---|---|
| ELEK-001 (customer cancel void check) | MEDIUM | Wolverine sprint required | No DB-level mitigation; engine layer unguarded — must patch before customer cancel feature sees volume | Wolverine sprint — P1 |
| ELEK-002 (status on owner INSERT) | LOW | Accepted | DB enforces on public path; owner path is authorized-actor-only self-harm | Wolverine sprint — P2 |
| ELEK-003 (customerActorId) | LOW | Accepted | DB-blocked on public path via insert_public_pending policy | Wolverine sprint — P2 (defense-in-depth) |
| ELEK-004 through ELEK-008 | LOW/INFO | Accepted | No confirmed exploit paths | Next cleanup / Carnage sprint |
| K-BOOK-01 (serial chain) | LOW | Accepted | Performance, non-critical at scale | Cache Optimization Sprint |
| Migration file provenance for DEFER-001 | LOW | Accepted | Policy is live and correct; tracking is governance hygiene | CARNAGE sprint — confirm or backfill migration file |

---

## Recommended Actions

### P1 — Fix Before Booking Sees High Volume

1. **Fix ELEK-001** — `cancelBooking.controller.js`: Add `dalGetActorById` call on customer cancel path; verify `is_void !== true` before allowing cancel. DB `bookings_update_customer` policy doesn't gate `is_void`.

### P2 — Fix in Same Sprint

2. **Fix ELEK-002 (owner path)** — `createBooking.controller.js`: Add `VALID_STATUSES` allowlist for owner-sourced bookings.
3. **Fix ELEK-003 (engine defense-in-depth)** — `createBooking.controller.js`: Assert `resolvedCustomerActorId = requestActorId` on citizen path even though DB enforces it — belt-and-suspenders at engine layer.
4. **Fix ELEK-006** — `createQrLink.controller.js`: QR type allowlist + relative path validation.
5. **Fix ELEK-005** — `qrUrlBuilders.js`: Add isQrSafeSlug to buildMenuShortDisplayUrl.

### P3 — Carnage + Housekeeping

6. **CARNAGE** — Confirm DEFER-001 migration is in tracked migration files. If not, backfill.
7. **CARNAGE** — Atomic QR scan count increment RPC (ELEK-004).
8. **Fix ELEK-007/008** — Engine config freeze + UUID_RE import.

---

## Final Decision

```
╔══════════════════════════════════════════════════════════════════╗
║  THOR RELEASE STATUS: ⚠️  CAUTION                               ║
║                                                                  ║
║  DEFER-001: RESOLVED (confirmed live DB)                         ║
║  bookings_insert_actor_owner — actor_owners model LIVE ✓         ║
║  Legacy bookings_insert_owner — GONE ✓                          ║
║                                                                  ║
║  DB also mitigates ELEK-002 + ELEK-003 on public path           ║
║  Remaining: ELEK-001 (MEDIUM — customer cancel void check)       ║
║  All other open items: LOW / INFO                                ║
║                                                                  ║
║  THOR gate: CLEARED                                              ║
║  Fix ELEK-001 before customer cancel path sees production volume  ║
╚══════════════════════════════════════════════════════════════════╝
```

**FINAL DECISION: CAUTION**

Booking module THOR gate is cleared. DEFER-001 confirmed resolved via live DB evidence — the hard blocker is gone. DB-level policies provide defense-in-depth on the public booking path, downgrading ELEK-002 and ELEK-003. ELEK-001 (customer cancel void check) is the only remaining MEDIUM item and should be patched before the customer cancel path sees production volume. All other findings are LOW/INFO with clear owners.

Supersedes: `2026-05-27_thor_booking-module-deferred-gate.md` (prior BLOCKED verdict).

---

*THOR release report — booking module DEFER-001 re-evaluation — 2026-05-27*  
*Read-only evaluation. No source files modified. No patches applied.*  
*Required follow-up: Wolverine (ELEK-001 P1, ELEK-002/003/005/006 P2), Carnage (migration provenance + ELEK-004 atomic RPC)*
