# THOR RELEASE REPORT — Booking Module (Deferred Gate Evaluation)

**Date:** 2026-05-27  
**Reviewer:** THOR  
**Trigger:** Deferred gate closure attempt — booking module THOR was DEFERRED pending DEFER-001 CARNAGE migration  
**Branch:** vport-booking-feed-security-updates  

---

## THOR RELEASE TARGET

**Application Scope:** VCSM + ENGINE  
**Release reason:** Deferred gate evaluation — booking module THOR gate deferred since 2026-05-14 pending DEFER-001 (bookings_insert_owner RLS migration to actor_owners model).  
**Areas changed:** Booking engine + VCSM booking layer — QR URLs, ownership gates, notification link paths, actor validation  
**Release readiness:** BLOCKED  
**Decision rationale:** DEFER-001 is a hard THOR blocker per Section 13.2 — the `bookings_insert_owner` INSERT policy on `vport.bookings` still uses `profiles.owner_user_id = auth.uid()` (legacy identity model). The platform has migrated to `actor_owners` everywhere else. Until this RLS migration is completed and reviewed by CARNAGE, the bookings write path is operating under a different trust model than the rest of the platform. Additionally, new ELEKTRA findings (2026-05-27) add 3 MEDIUM open findings including a combined-risk chain (ELEK-003 + ELEK-001: customerActorId spoofing enabling void-actor self-cancel).

---

## RELEASE SIGNAL INVENTORY

| Signal | Status | Latest Report | Notes |
|---|---|---|---|
| VENOM | PRESENT | 2026-05-27_elektra_vport-booking-feed-security-updates.md + 2026-05-10..2026-05-14 chain | P0 findings (RC-01..06 + V-BOOK-01/02) all resolved |
| BLACKWIDOW | PRESENT | Folded into VENOM column per governance | Prior chain confirmed findings resolved; ELEK-001/003 need runtime verification |
| ELEKTRA | PRESENT | 2026-05-27_02-10_elektra_vport-booking-qr-module.md | 0 HIGH, 3 MED, 3 LOW, 2 INFO — 8 patches proposed, NONE applied yet |
| CARNAGE | PRESENT (incomplete) | 2026-05-14 booking security audit | DEFER-001 (bookings_insert_owner) explicitly NOT resolved — migration not yet done |
| LOGAN | PRESENT | logan/vports/vcsm.vport.business-pipeline.v2.md | COMPLETE |
| KRAVEN | PRESENT | Implicit in booking security audit | K-BOOK-01 (serial chain, ~310ms, P2) deferred, non-blocking |
| LOKI | MISSING | — | Not run; no runtime observability gap identified |
| ARCHITECT | PRESENT | vcsm.vport-availability.architecture.md + booking controllers | COMPLETE |
| IRONMAN | MISSING | — | Ownership clear: booking engine owned by engines/booking/ |
| CONTRACT REVIEW | PRESENT | SENTRY 2026-05-27 — ALIGNED | No contract violations introduced in recent session |

---

## BOUNDARY SCOPE CHECK

| Protected Root | In Scope? | Modified? | Approval Needed? | Status |
|---|---|---|---|---|
| apps/VCSM | YES | YES | NO | Within declared scope |
| apps/wentrex | NO | NO | NO | Out of scope |
| apps/Traffic | NO | NO | NO | Out of scope |
| engines | YES (ENGINE) | YES | YES — approved (scope: VCSM + ENGINE) | Approved cross-root |

**Boundary contract:** RESPECTED. Engine scope was declared explicitly in the booking security sprint. `engines/booking/` changes are within the approved VCSM + ENGINE scope boundary.

---

## CRITICAL RELEASE GATES

| Gate | Status | Evidence | Release Impact |
|---|---|---|---|
| Actor ownership on cancel path (owner) | PASS | assertActorOwnsVportActor gates owner cancel path | None |
| Actor void/kind check on cancel (customer) | FAIL | ELEK-001 — customer self-cancel path skips is_void + kind check on requestActorId | MEDIUM — void actor can cancel booking |
| Booking attribution (customerActorId) | FAIL | ELEK-003 — customerActorId not verified against requestActorId on public path | MEDIUM — attribution fraud + combined risk with ELEK-001 |
| Booking status field validation | FAIL | ELEK-002 — status field caller-controlled, no allowlist | MEDIUM — arbitrary status string bypasses state machine |
| RLS on bookings INSERT path | FAIL — DEFER-001 | bookings_insert_owner uses legacy owner_user_id = auth.uid(); not migrated to actor_owners | HARD BLOCKER |
| QR UUID leakage | PASS | isQrSafe guard in place; all QR builders use isQrSafeSlug | None |
| Notification link paths | PASS | ownerSlug resolved via dalGetVportProfileSlugByActorId; no UUID in linkPath | None |
| Public booking surface | PASS | Booking confirmation public route — no private data exposed | None |

---

## VCSM ACTOR TRUST GATE

| Gate | Status | Evidence | Release Impact |
|---|---|---|---|
| Actor ownership enforced | PARTIAL | Owner path: assertActorOwnsVportActor ✓. Customer cancel path: string match only, no is_void check (ELEK-001) | MEDIUM — see ELEK-001 |
| Public identity surface clean | PASS | No UUID in QR links, notification paths, or public booking surface | None |
| VPORT lifecycle respected | PASS | Owner dashboard guarded; public booking route does not reveal lifecycle state | None |
| Feed attribution protected | PASS | Booking confirmation post attributed to VPORT actor via engine ownership | None |
| Booking trust protected | PARTIAL | Source allowlist ✓. Status allowlist MISSING (ELEK-002). customerActorId not enforced against requestActorId (ELEK-003) | MEDIUM — see ELEK-002, ELEK-003 |
| External API surface safe | PASS | No custom endpoints; Supabase parameterized queries throughout | None |
| SEO indexing safe | PASS | Booking confirmation not SEO-indexed | None |

---

## NATIVE PARITY RELEASE GATE

Not applicable to this gate evaluation scope. Native booking parity pending FALCON sprint.

---

## MIGRATION RELEASE GATE

| Migration Area | Status | Rollback | RLS Reviewed | Release Impact |
|---|---|---|---|---|
| DEFER-001 — bookings_insert_owner → actor_owners | NOT DONE | N/A | NOT YET — awaiting CARNAGE | **HARD BLOCKER** |
| Prior booking RLS (RC-01..RC-06) | DEPLOYED | Confirmed | YES — 2026-05-14 | None |
| ELEK-004 — atomic QR scan increment | NOT SUBMITTED | N/A | N/A | LOW — non-critical metric |
| ELEK-002/003 engine fixes | NOT SUBMITTED | N/A | DB check pending | MEDIUM — advisory |

**Migration gate: BLOCKED.** DEFER-001 is an unresolved migration that changes the RLS trust model on the bookings INSERT path. Per THOR Section 13.2, this is a hard release blocker: "RLS is required but unverified for a release-critical write path." The bookings table uses `profiles.owner_user_id = auth.uid()` — a different identity contract from `actor_owners` used everywhere else on the platform. This creates a trust model inconsistency on the most critical write path in the booking lifecycle.

---

## DOCUMENTATION RELEASE GATE

| Documentation Area | Status | Drift | Release Impact |
|---|---|---|---|
| Logan docs | COMPLETE | None — vcsm.vport.business-pipeline.v2.md current | None |
| Architecture contracts | COMPLETE | Booking controllers and engine boundary documented | None |
| Security audits | COMPLETE | VENOM + ELEKTRA reports persisted; SENTRY ALIGNED | None |
| Engine docs | COMPLETE | engines/booking/ architecture documented | None |
| Native transfer docs | NOT RUN | DEFER-005 — FALCON iOS clipboard audit pending | Non-blocking |

---

## Architecture Findings

No contract violations or boundary breaches. SENTRY ALIGNED (2026-05-27). The booking engine correctly exports through its approved interface; VCSM app layer consumes via adapter. Booking feature boundary is clean.

---

## Performance Findings

**K-BOOK-01 (P2 — non-blocking):** 5-operation serial chain in owner availability mutation (~310ms estimated latency). Deferred to cache optimization sprint. Not a release blocker.

---

## Security Findings

| ID | Severity | Title | Affects | Status |
|---|---|---|---|---|
| DEFER-001 | HIGH (RLS) | bookings_insert_owner uses legacy owner_user_id identity model | Bookings INSERT path | OPEN — HARD BLOCKER |
| ELEK-2026-05-27-001 | MEDIUM | cancelBooking customer path — no actor void/kind check | Customer self-cancel path in engine | OPEN |
| ELEK-2026-05-27-002 | MEDIUM | createBooking status field caller-controlled, no allowlist | Booking creation in engine | OPEN |
| ELEK-2026-05-27-003 | MEDIUM | customerActorId not verified against requestActorId | Public/citizen booking path in engine | OPEN |
| ELEK-2026-05-27-004 | LOW | QR scan count non-atomic race condition | QR scan counter | OPEN |
| ELEK-2026-05-27-005 | LOW | buildMenuShortDisplayUrl missing isQrSafeSlug guard | QR URL builder | OPEN |
| ELEK-2026-05-27-006 | LOW | createQrLink — destinationPath/qrType accept arbitrary strings | QR link creation | OPEN |
| ELEK-2026-05-27-007 | INFO | Engine config singleton mutable — no freeze guard | Engine config | OPEN |
| ELEK-2026-05-27-008 | INFO | VportActorMenuFlyerView re-declares UUID_RE locally | Flyer builder | OPEN |

**Combined chain risk — ELEK-003 + ELEK-001:**  
A caller authenticates as actor A, books with `customerActorId=B` (ELEK-003). Actor B is now recorded as customer. If actor B is void (soft-deleted), the `isCustomer` string match in `cancelBooking` still passes (ELEK-001). Combined: a spoofed booking can be cancelled by a void actor. This is a MEDIUM × MEDIUM compounded chain, not a confirmed CRITICAL, but it is the most significant open security vector in this module.

---

## Migration Findings

**DEFER-001 is a HARD BLOCKER.** The `bookings_insert_owner` policy allows INSERT when `profiles.owner_user_id = auth.uid()`. This is the legacy pre-actor_owners identity model. Every other write path on the platform now uses `actor_owners` for ownership verification. This divergence means:
- The bookings INSERT path operates under different trust assumptions than all other platform write paths
- A user who directly owns a legacy profile (not via actor_owners) can INSERT bookings under the old model
- The risk is partially mitigated by controller-layer ownership checks, but DB-level enforcement is misaligned

CARNAGE migration must: revoke the legacy policy, add an actor_owners-based INSERT policy aligned with the platform contract. This migration touches an auth-sensitive table and requires full CARNAGE review with rollback plan before THOR can approve.

---

## Documentation Findings

None blocking. FALCON iOS clipboard audit (DEFER-005) is pending but non-blocking.

---

## Ownership Findings

Clear. Booking engine owned by `engines/booking/`. VCSM booking layer owned by `apps/VCSM/src/features/booking/`. Boundaries enforced.

---

## Risk Acceptance Register

CRITICAL risks cannot be accepted. DEFER-001 is classified as HIGH (RLS on release-critical write path) and cannot be accepted for a full THOR clearance. The module is already in production under prior consent, but THOR cannot issue READY or CAUTION for future booking-related releases until DEFER-001 is resolved.

| Risk | Severity | Accepted By | Reason | Expiration / Follow-up |
|---|---|---|---|---|
| K-BOOK-01 (serial chain) | LOW | Wolverine (deferred) | Performance non-critical at current scale | Cache Optimization Sprint |
| ELEK-004 (non-atomic QR scan) | LOW | Wolverine (deferred) | Non-critical metric; no integrity impact | Carnage sprint (atomic RPC) |
| ELEK-005 (buildMenuShortDisplayUrl) | LOW | Wolverine (deferred) | Current callsite guarded; function-level defense consistent | Next cleanup sprint |
| ELEK-007 (engine config mutable) | INFO | Wolverine (deferred) | No production exploit path; hardening only | Next cleanup sprint |
| ELEK-008 (UUID_RE local copy) | INFO | Wolverine (deferred) | Functionally equivalent; drift risk only | Next cleanup sprint |
| DEFER-001 | HIGH | NOT ACCEPTED | Blocks THOR gate — RLS trust model misalignment on release-critical write path | CARNAGE Migration Sprint (P1) |
| ELEK-001 + ELEK-002 + ELEK-003 | MEDIUM | NOT ACCEPTED | Combined chain risk; must be patched before full THOR approval | Wolverine patch sprint |

---

## Recommended Actions Before Release

### P0 — Hard Blockers (THOR gate cannot clear without these)

1. **DEFER-001** — CARNAGE migration: Replace `bookings_insert_owner` RLS INSERT policy with `actor_owners`-based policy. Migration must include rollback plan, CARNAGE review, and post-migration VENOM re-scan of bookings write path.

### P1 — Fix in Same Sprint as DEFER-001

2. **Fix ELEK-001** — `cancelBooking.controller.js`: Add `dalGetActorById` call on customer cancel path before `isCustomer` string match; verify `exists`, `is_void !== true`, `kind === 'user'`.
3. **Fix ELEK-002** — `createBooking.controller.js`: Add `VALID_STATUSES` allowlist after `ALL_SOURCES` check; force `status = 'pending'` for citizen sources.
4. **Fix ELEK-003** — `createBooking.controller.js`: On CITIZEN_SOURCES path, assert `customerActorId === requestActorId`; set `customer_actor_id = requestActorId` unconditionally.

### P2 — Fix Before Activating Features

5. **Fix ELEK-006** — `createQrLink.controller.js`: Add `ALLOWED_QR_TYPES` allowlist and relative-path-only validation for `destinationPath`.
6. **Fix ELEK-005** — `qrUrlBuilders.js`: Add `isQrSafeSlug` guard to `buildMenuShortDisplayUrl`.

### P3 — Housekeeping

7. **Fix ELEK-004** — CARNAGE: DB atomic increment RPC for QR scan count.
8. **Fix ELEK-007** — `config.js`: One-time-write guard + `Object.freeze` on booking engine config.
9. **Fix ELEK-008** — `VportActorMenuFlyerView.jsx`: Import `isQrSafeSlug` instead of re-declaring `UUID_RE`.

---

## Final Decision

```
╔══════════════════════════════════════════════════════════════════╗
║  THOR RELEASE STATUS: 🚫 BLOCKED                                ║
║                                                                  ║
║  PRIMARY BLOCKER: DEFER-001                                      ║
║  bookings_insert_owner RLS policy uses legacy owner_user_id      ║
║  identity model — not migrated to actor_owners.                  ║
║  This is a trust model misalignment on the bookings INSERT path. ║
║                                                                  ║
║  SECONDARY: ELEK-001 + ELEK-002 + ELEK-003 (MEDIUM ×3)         ║
║  Combined chain: customerActorId spoofing + void-actor cancel    ║
║  Must be patched in the same CARNAGE/Wolverine sprint.           ║
║                                                                  ║
║  Required to unblock:                                            ║
║  1. CARNAGE migration for DEFER-001 (with rollback plan)         ║
║  2. Wolverine patches for ELEK-001, ELEK-002, ELEK-003           ║
║  3. VENOM re-scan of bookings write path post-migration          ║
║  4. THOR re-evaluation after above complete                      ║
╚══════════════════════════════════════════════════════════════════╝
```

**FINAL DECISION: BLOCKED**

Booking module THOR gate cannot be cleared. DEFER-001 (bookings_insert_owner RLS migration) is a hard blocker per THOR Section 13.2. All other work in the booking module is clean — prior P0 findings resolved, QR gates solid, SENTRY ALIGNED. This is a single targeted migration that unblocks everything. Assign CARNAGE sprint P1.

---

*THOR release report — booking module deferred gate — 2026-05-27*  
*Read-only evaluation. No source files modified. No patches applied.*  
*Required follow-up: Carnage (DEFER-001 + ELEK-004 atomic QR RPC), Wolverine (ELEK-001/002/003/005/006/007/008 patches), VENOM re-scan post-migration*
