# Avengers Assembly Report — 2026-05-14 (Booking + Availability Write Path)

## Run Summary

Date: 2026-05-14  
Triggered by: Cerebro audit pipeline — booking system governance audit following `vport-booking-feed-security-updates` branch  
Application Scope: VCSM + ENGINE  
Release Scope: Booking and availability write path security compliance  
Commands Run: IRONMAN · VENOM · SENTRY · LOKI · KRAVEN · CARNAGE · LOGAN · review-contract · SHIELD  
Note: ARCHITECT (2026-05-10 reports available, not re-run for this scope) · FALCON/WINTER SOLDIER (N/A — no native parity scope for booking admin write path)  

---

## Governance Evidence Registry

| Command | Status | Latest Report | Drift | Blocking |
|---|---|---|---|---|
| ARCHITECT | STALE | `2026-05-10_architect_*` (prior session) | Unknown for this specific scope | LOW — prior architecture maps exist; booking-specific arch map not separately generated |
| IRONMAN | PRESENT | `2026-05-14_ironman_booking-feature-ownership.md` | None | No |
| VENOM | PRESENT | `2026-05-14_venom_booking-availability-write.md` + `booking-dal.md` + `dashboard-dal-branch-delta.md` | YES — security gaps found | YES — 1 CRITICAL, 1 HIGH, 2 MEDIUM |
| SENTRY | PRESENT | `2026-05-14_sentry_booking-dal.md` | YES — architecture gaps | YES — multiple violations |
| LOKI | PRESENT | `2026-05-14_loki_booking-dal-runtime-trace.md` | YES — serial runtime chain | No (performance, not security) |
| KRAVEN | PRESENT | `2026-05-14_kraven_booking-mutation-bottleneck.md` | YES — 3-serial-read bottleneck | No (WATCH status, non-blocking) |
| CARNAGE | PRESENT | `2026-05-14_carnage_booking-rls-policies.md` | YES — RLS policies missing/unverified | YES — RLS migration prerequisite to secure release |
| FALCON | N/A | — | — | No |
| WINTER SOLDIER | N/A | — | — | No |
| LOGAN | PRESENT | `vcsm.dal.booking.md` updated this session | YES — RISK-7/8 corrected, RISK-9 added | No (doc updated) |
| review-contract | PRESENT | `2026-05-14_review-contract_booking-availability-write.md` | YES — 7 violations | YES — 3 CRITICAL release-blocking violations |
| SHIELD | PRESENT | `2026-05-14_shield_booking-availability-write.md` | LOW | No (CAUTION, non-blocking) |

---

## Module Alignment Matrix

| Module | Architecture | Ownership | Security | Runtime | Performance | Native | Docs | Release Status |
|---|---|---|---|---|---|---|---|---|
| Booking (feature layer) | DRIFT | CLEAR | BLOCKED | VERIFIED | WATCH | N/A | UPDATED | BLOCKED |
| Booking (engine layer) | DRIFT | CLEAR | BLOCKED | VERIFIED | WATCH | N/A | UPDATED | BLOCKED |
| Availability Write (dashboard/vport) | DRIFT | CLEAR | BLOCKED | VERIFIED | WATCH | N/A | UPDATED | BLOCKED |
| Quick Booking Modal | DRIFT | CLEAR | HIGH RISK | VERIFIED | OK | N/A | UPDATED | BLOCKED |
| Booking Adapter | DRIFT | CLEAR | HIGH RISK | N/A | OK | N/A | N/A | BLOCKED |

---

## ARCHITECT

Status: STALE (prior session reports — 2026-05-10)  
Findings: No dedicated ARCHITECT run for the booking + availability write path in this session. Prior 2026-05-10 architecture maps cover the broader system structure. Booking-specific module relationships were analyzed as part of IRONMAN and review-contract passes.  
Impact: LOW — the booking path architecture is well understood from code inspection. Stale ARCHITECT status does not introduce additional release risk beyond what other specialists found.

---

## IRONMAN

Status: PRESENT  
Report: `2026-05-14_ironman_booking-feature-ownership.md`  
Findings:
- Ownership is CLEAR for booking feature (apps/VCSM/src/features/booking/) and booking engine (engines/booking/)
- Three-layer architecture confirmed: feature layer + engine layer + dashboard extension
- Data ownership: `vport.bookings`, `vport.availability_rules`, `vport.resources` — clearly owned by booking domain
- Rule ownership: actor ownership enforcement belongs to controller layer — CURRENTLY MISSING in 3 of 3 controllers reviewed
- Engine consumer map: VCSM is the only consumer of booking engine — no cross-app risk
- Boundary risk: MEDIUM — feature-layer listBookingHistory controller is DEAD code (imports exist but engine controller is used)

Key concern: Rule ownership for actor ownership enforcement is clearly assigned to the controller layer, but that rule is not enforced. Ownership is unambiguous — enforcement is missing.

---

## VENOM

Status: PRESENT — CONTRACT VIOLATION  
Reports: Three Venom reports for this scope.  

**Critical Findings:**

- **V-AVAIL-01 (CRITICAL)**: `manageVportAvailabilityRuleController` — no `callerActorId`, no ownership assertion. Any authenticated actor can write to any VPORT's availability rules by supplying a `resourceId`. Exploitability: HIGH. Blast radius: all VPORT availability configurations.
- **V-AVAIL-02 (HIGH)**: `upsertVportAvailabilityRuleDAL` UPDATE path — `.eq("id", ruleId)` only filter. No owner constraint at DB layer. RLS unverified for `availability_rules`. Second enforcement layer absent.
- **V-BOOK-01 (CRITICAL)**: `engines/booking/src/controller/listBookingHistory` — no caller identity, no ownership assertion. Booking history (containing customer PII) returned to any caller with a `resourceId`. Exploitability: HIGH.
- **S-BOOK-02 (HIGH)**: `useQuickBookingModal` accepts `profileId` — violated Identity Surface Rule. profileId can be manipulated to enumerate services by profile.

**Supplemental Findings from booking-dal.md + dashboard-dal-branch-delta.md:**
- `getBookingByIdDAL` overfetches 22 columns including full PII (`customer_phone`, `customer_email`, `internal_note`) — only 7 needed for cancel/confirm decisions
- `listBookingsByCustomerDAL` exposes `member_actor_id` through join — not needed for customer-facing read
- `vportAvailabilityRules.write.dal.js` UPDATE path lacks owner filter — corroborates V-AVAIL-02

VENOM Status: BLOCKED — critical authorization gaps on production write and read paths

---

## SENTRY

Status: PRESENT — VIOLATIONS  
Report: `2026-05-14_sentry_booking-dal.md`  
Findings:
- `listBookingHistory.controller.js` in feature layer is dead code — imports exist but unreachable, no callers
- `booking.adapter.js` exports `useBookingHistory` backed by unprotected engine controller — adapter trust boundary degraded
- `useQuickBookingModal` uses `profileId` parameter — Identity Surface Rule violation at hook surface
- Engine controller `listBookingHistory` violates Engine Controller Contract (no permissions enforcement)
- Controller fan-out acceptable across reviewed controllers
- DAL import direction: COMPLIANT (all app files use @/ aliases)

SENTRY Status: VIOLATIONS FOUND — architecture compliance issues confirmed

---

## LOKI

Status: PRESENT  
Report: `2026-05-14_loki_booking-dal-runtime-trace.md`  
Findings:
- Runtime trace confirms 5-operation serial chain in owner-action path: `getBookingByIdDAL` → `getBookingResourceByIdDAL` → `getActorByIdDAL` → `actor_owners` lookup → `updateBookingStatusDAL`
- Estimated latency: ~310ms on cold path (all sequential)
- Engine path for availability rules: direct DAL call with no ownership gate confirmed at runtime
- No N+1 pattern detected in current booking load path — individual record operations are the bottleneck
- Loki confidence: INFERRED (no live trace tool — static analysis of async execution order)

LOKI Status: VERIFIED (runtime chain understood — no blocking findings, supports KRAVEN analysis)

---

## KRAVEN

Status: PRESENT  
Report: `2026-05-14_kraven_booking-mutation-bottleneck.md`  
Findings:
- **K-BOOK-01 (HIGH ROI)**: Step 3a in ownership chain (`getActorByIdDAL` — resolve profile_id) adds one extra DB round trip every owner action. Cacheable with session-scoped actor profile_id TTL cache (5-minute TTL sufficient). Option A: in-memory cache. Option B: combined booking+resource JOIN.
- **K-BOOK-02 (MODERATE ROI)**: `getBookingByIdDAL` fetches 22 columns; only 7 needed for cancel/confirm. Slim projection eliminates unnecessary PII transmission on every mutation.
- **K-BOOK-03 (LOW ROI)**: `getBookingResourceByIdDAL` round-trip could be folded into combined JOIN with `getBookingByIdDAL`. Minor latency save.

KRAVEN Status: WATCH — 3 non-blocking optimizations identified. K-BOOK-02 (slim projection) recommended alongside P0 security fixes for combined Wolverine pass. No CRITICAL performance findings.

---

## CARNAGE

Status: PRESENT  
Report: `2026-05-14_carnage_booking-rls-policies.md`  
Findings:
- **DB-BOOK-01**: `vport.bookings` SELECT RLS — unknown/unverified. Three-party access model needed (owner, customer, member). Proposed policy designed. Pre-requisite: engine `listBookingHistory` RC-03 fix MUST deploy before this policy, or engine returns 0 rows silently.
- **DB-BOOK-02**: `vport.availability_rules` UPDATE RLS — no owner filter confirmed. UPDATE must be restricted to `auth.uid() → profile_id → actor_owners → resources.owner_actor_id`. Proposed policy designed.
- Migration sequence: VERIFY current RLS state → Index CONCURRENTLY (non-blocking) → App-layer fixes (RC-01, RC-03) → Deploy availability_rules policies → Deploy bookings policy (staging) → Deploy bookings policy (production)
- Rollback: Full rollback SQL provided for both migrations
- Final Carnage status: HIGH RISK (bookings SELECT), CAUTION (availability_rules UPDATE) — staged strategy designed

CARNAGE Status: HIGH RISK — migration plan ready but RC-01/RC-03 app-layer fixes are prerequisites before RLS deployment

---

## FALCON

Status: N/A  
Findings: No native iOS parity scope identified for the booking admin write path reviewed in this audit. Booking availability management is a VPORT owner-only action — iOS parity review would apply if native scheduling screens exist. Not in current audit scope.

---

## WINTER SOLDIER

Status: N/A  
Findings: Same as FALCON — out of scope for this audit pass.

---

## LOGAN

Status: PRESENT — UPDATED  
Document: `zNOTFORPRODUCTION/_CANONICAL/logan/vcsm/dal/vcsm.dal.booking.md`  
Drift corrected this session:
- RISK-7 status corrected from FIXED → PARTIAL FIX (dashboard secured, engine path still open)
- RISK-8 updated to reflect current state (component-layer violations resolved, identity surface violation open)
- RISK-9 ADDED — new risk for availability write path (CRITICAL, OPEN)
- VB-02 header corrected to reflect partial fix status

Documentation truth: ALIGNED for reviewed scope. `vcsm.dal.booking.md` now accurately reflects all open security gaps.

LOGAN Status: ALIGNED (post-update)

---

## review-contract

Status: PRESENT — NON-COMPLIANT (7 violations)  
Report: `2026-05-14_review-contract_booking-availability-write.md`  

| ID | File | Severity | Release Blocking? |
|---|---|---|---|
| RC-01 | `manageVportAvailabilityRule.controller.js` | CRITICAL | YES |
| RC-02 | `listVportServicesForProfile.controller.js` | CRITICAL | YES |
| RC-03 | `engines/.../listBookingHistory.controller.js` | CRITICAL | YES |
| RC-04 | `useQuickBookingModal.js` | HIGH | YES |
| RC-05 | `booking.adapter.js` | HIGH | YES |
| RC-06 | `useVportManageAvailability.js` | HIGH | YES (part of RC-01) |
| RC-07 | `VportDashboardCalendarScreen.jsx:26` | MEDIUM | NO |

review-contract Status: NON-COMPLIANT — 3 CRITICAL violations, all release-blocking

---

## SHIELD

Status: PRESENT  
Report: `2026-05-14_shield_booking-availability-write.md`  
Findings:
- All booking code is original VCSM — no proprietary copying detected
- All dependencies MIT licensed — no copyleft risk
- Internal command system uses Marvel trademark names (SI-TM-01) — internal-only, non-blocking
- Booking workflow is sufficiently differentiated from common industry patterns (SI-PW-01) — non-blocking
- No legal review required

SHIELD Status: CAUTION (non-blocking)

---

## Cross-System Contradictions

| System A | System B | Contradiction | Severity | Resolution |
|---|---|---|---|---|
| LOGAN (RISK-7 corrected) | Prior audit (marked FIXED) | Documentation previously marked booking authorization as FIXED when only dashboard path was fixed | MEDIUM | RESOLVED — Logan updated this session |
| VENOM (V-AVAIL-01 CRITICAL) | SENTRY (RC-01 CRITICAL) | No contradiction — both independently confirmed ownership gate is missing in availability write controller | CONFIRMED | Both align — requires RC-01 fix |
| CARNAGE (RLS prerequisite) | review-contract (RC-03 must fix first) | Carnage migration plan requires RC-03 app-layer fix BEFORE bookings SELECT RLS deploys. Deploying RLS without fixing engine returns silent 0-row result | HIGH | ALIGNED — migration sequence documents RC-03 as prerequisite |
| IRONMAN (ownership clear) | VENOM/review-contract (ownership not enforced) | Ownership is well-defined architecturally but the enforcement rule is missing from 3 controllers | MEDIUM | Expected — ownership clarity ≠ enforcement. Requires Wolverine implementation |

---

## Runtime Alignment Review

| Area | Runtime Evidence | Performance Risk | Migration Risk | Status |
|---|---|---|---|---|
| Owner cancel/confirm path | Serial 5-operation chain (LOKI confirmed) | HIGH — K-BOOK-01 cache opportunity | LOW — no migration needed for optimization | WATCH |
| Availability write path | Direct DAL call, no ownership gate (Loki confirmed) | LOW | MEDIUM — DB-BOOK-02 RLS migration prerequisite to RC-01 | BLOCKED |
| Booking history read (engine) | resourceId-only lookup, no ownership gate | LOW | HIGH — DB-BOOK-01 RLS migration; requires RC-03 first | BLOCKED |
| Booking history read (app DAL) | 22-column PII fetch on mutation path | MEDIUM — K-BOOK-02 slim projection | LOW | WATCH |

---

## Ownership / Boundary Alignment

| Area | Ownership Status | Boundary Status | Contract Status | Risk |
|---|---|---|---|---|
| Booking feature (app) | CLEAR | COMPLIANT | NON-COMPLIANT (RC-01/02/04/05/06) | HIGH |
| Booking engine | CLEAR | COMPLIANT | NON-COMPLIANT (RC-03) | HIGH |
| Dashboard/vport availability | CLEAR | COMPLIANT | NON-COMPLIANT (RC-01/06/07) | HIGH |
| Adapter (booking.adapter.js) | CLEAR | DEGRADED (unsafe export) | NON-COMPLIANT (RC-05) | HIGH |

---

## Native Governance Status

| Module | Falcon | Winter Soldier | Drift | Release Risk |
|---|---|---|---|---|
| Booking + Availability Write | N/A (out of scope) | N/A (out of scope) | N/A | No native parity risk for this audit scope |

---

## Documentation Truth Review

| Doc/System | Truth Status | Drift | Native Notes | Blocking |
|---|---|---|---|---|
| `vcsm.dal.booking.md` | ALIGNED (post-update) | Corrected this session (RISK-7, RISK-8, RISK-9) | N/A | No |
| Architecture contracts | ALIGNED | No contracts modified | N/A | No |
| Security audit trail | ALIGNED | 3 new Venom reports written | N/A | No |
| Engine audit docs | PARTIAL — no dedicated booking engine audit doc | No engine-specific doc beyond CLAUDE.md | N/A | No (low priority) |

---

## IP / Provenance Alignment

| Area | IP Status | License Risk | Provenance Risk | Blocking |
|---|---|---|---|---|
| Booking + availability code | CLEAR | NONE | NONE | No |
| Dependencies | CLEAR | MIT — no copyleft | N/A | No |
| Internal command naming | CAUTION | LOW — Marvel names, internal-only | N/A | No |
| Public product naming | CLEAR | NONE | NONE | No |

---

## Proposed Updates

No `.v2.md` drift copies required for this assembly pass.

Logan documentation was updated directly this session (not a `.v2.md` case — confirmed corrections, not disputed drift).

---

## Release Intelligence Summary

| Area | Status | Blocking Risk | Recommended Command |
|---|---|---|---|
| Architecture | DRIFT | YES — 3 CRITICAL controller violations | Wolverine (P0 implementation) |
| Ownership | CLEAR | NO | — |
| Security | BLOCKED | YES — ownership gates missing on write paths | Wolverine (P0 implementation) |
| Runtime | WATCH | NO | Wolverine (K-BOOK-01/02 alongside P0) |
| Performance | WATCH | NO | Wolverine (K-BOOK-01/02 alongside P0) |
| Migration | HIGH RISK | CONDITIONAL — RLS deployment requires RC-01/03 first | Carnage → DB verification → Wolverine sequence |
| iOS Parity | N/A | N/A | — |
| Android Parity | N/A | N/A | — |
| Documentation | ALIGNED | NO | — |
| IP Safety | CAUTION | NO | — |

---

## Overall Status: BLOCKED

**Reason:** Three CRITICAL contract violations exist that are release-blocking:

1. **RC-01 / V-AVAIL-01**: `manageVportAvailabilityRuleController` — any authenticated actor can write to any VPORT's availability rules. Zero ownership enforcement. Blocked.
2. **RC-03 / V-BOOK-01**: `engines/booking/src/controller/listBookingHistory` — booking history with customer PII returned to any caller supplying a `resourceId`. Zero ownership enforcement. Blocked.
3. **RC-02**: `listVportServicesForProfileController` — `profileId` identity surface violation in a CRITICAL controller, plus zero-logic passthrough. Blocked.

These are not minor deviations. They are structural authorization failures on production write and read paths.

Additionally, HIGH violations RC-04, RC-05, and RC-06 must be resolved as part of the RC-01/02/03 fix implementation.

---

## Recommended Next Command

**THOR** — Final release gate evaluation.

All specialist evidence is now assembled:
- Security: BLOCKED (V-AVAIL-01, V-BOOK-01)
- Architecture: NON-COMPLIANT (RC-01 through RC-06)
- Performance: WATCH (non-blocking)
- Migration: HIGH RISK (conditional on app-layer fixes)
- Documentation: ALIGNED
- IP: CAUTION (non-blocking)

Feed this assembly report to THOR for the formal release gate decision.

After Thor confirms BLOCKED status, hand off P0 fixes to **Wolverine**:
- RC-01 + RC-06: Ownership gate in `manageVportAvailabilityRuleController` + forward `callerActorId` from hook
- RC-02 + RC-04: Replace `profileId` surface in controller and hook  
- RC-03: Engine `listBookingHistory` ownership gate (cross-root — requires explicit approval)
- RC-05: Remove `useBookingHistory` from `booking.adapter.js`
