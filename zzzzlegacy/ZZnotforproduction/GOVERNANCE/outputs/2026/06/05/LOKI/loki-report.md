# LOKI Runtime Observability Report

**Date:** 2026-06-05
**Branch:** vport-booking-feed-security-updates
**Mode:** SECURITY_WARFARE_SIMULATION / BLUE_TEAM
**Application Scope:** VCSM + ENGINE
**Evidence Type:** INFERRED (source-level analysis — no live runtime available)
**Reviewer:** LOKI
**Observation Summary:** 2 HIGH | 3 MEDIUM | 3 LOW | 2 INFO
**Observability Maturity:** MINIMAL (gas prices + feed) / BASIC (bookings)
**Audit Trail Gaps:** 3
**Correlation IDs Present:** 0

---

## ARCHITECT Mapping Gate

ARCHITECT artifacts loaded:
- `system-map.md` (2026-06-05) — module inventory, call chains
- `security-surface.json` (2026-06-05) — trust boundaries, write surfaces
- `rls-assumption-map.md` (2026-06-05) — DAL method/table map

Scope confirmed: `dashboard/vport/bookings`, `dashboard/vport/gasprices`, `booking/engine`

---

## Execution Flow Analysis

### Call Chain: createVportPublicBookingController

```
EXECUTION FLOW
Controller: createVportPublicBookingController
Execution Order: SERIAL (all steps sequential)

Step 1:  getVportResourceByIdDAL         — DB read (vport.resources)
Step 2:  readActorVportLinkDAL           — DB read (vc.actors) [conditional: requestActorId only]
Step 3:  getVportServiceByIdDAL          — DB read (vport.services) [conditional: serviceId only]
Step 4:  insertVportBookingDAL           — DB write (vport.bookings)
Step 5:  getVportActorIdByProfileIdDAL  — DB read (vport.profiles → actor)
Step 6:  publishVcsmNotificationBatch   — async (fire-and-forget)

Serial/Parallel: SERIAL
Parallelizable:  Steps 1+2+3 are independent — could be Promise.all() [KRAVEN opportunity]
Blocking writes: Step 4 blocks notification dispatch (intentional)
Notification:    Fire-and-forget (non-blocking after booking insert)
```

### Call Chain: reviewFuelPriceSuggestionController

```
EXECUTION FLOW
Controller: reviewFuelPriceSuggestionController
Execution Order: SERIAL (all steps sequential)

Step 1:  fetchFuelPriceSubmissionByIdDAL       — DB read (vport.fuel_price_submissions)
Step 2:  resolveActorIdFromProfileId           — DB read (vport.profiles → actor)
Step 3a: checkVportOwnershipController         — getActorByIdDAL (vc.actors) [VPORT self-shortcut path]
Step 3b:   OR: assertActorOwnsVportActorController
              → getActorByIdDAL (requester)
              → readActorOwnerLinkByActorAndUserProfileDAL (vc.actor_owners)
              → getActorByIdDAL (target VPORT)
Step 4:  updateFuelPriceSubmissionStatusDAL    — DB write (vport.fuel_price_submissions)
Step 5:  upsertVportFuelPriceDAL               — DB write (vport.fuel_prices)
Step 6:  createVportFuelPriceHistoryDAL        — DB write (vport.fuel_price_history)
Step 7:  FuelPriceCacheService.invalidate x2  — cache invalidation
Step 8:  createFuelPriceSubmissionReviewDAL    — DB write (vport.fuel_price_submission_reviews)

Serial/Parallel: SERIAL
Parallelizable:  Steps 5+6 (upsert + history) are independent — could be Promise.all()
DB Reads (auth path B): 3 reads before any write — potential N+1 if called in bulk
TOCTOU window:   Between Step 1 (read status) and Step 4 (write status) — no DB precondition
```

### Call Chain: updateBookingStatusController

```
EXECUTION FLOW
Controller: updateBookingStatusController
Execution Order: SERIAL (all steps sequential)

Step 1:  getVportBookingByIdDAL             — DB read (vport.bookings)
Step 2:  resolveVportActorFromProfileId     — DB read (vport.profiles → actor)
Step 3:  assertActorOwnsVportActorController (owner path)
           → getActorByIdDAL
           → readActorOwnerLinkByActorAndUserProfileDAL
           → getActorByIdDAL
Step 4:  updateVportBookingDAL              — DB write (vport.bookings)
Step 5:  publishVcsmNotification            — async (fire-and-forget with catch)

Serial/Parallel: SERIAL
Notification catch: PRESENT — but .catch() error only logged in DEV mode
```

---

## Booking State Machine Analysis

```
STATE MACHINE: vport.bookings.status
┌─────────────────────────────────────────────────────────────┐
│ PENDING  ──owner──→  CONFIRMED                              │
│ PENDING  ──owner──→  CANCELLED   (terminal)                 │
│ PENDING  ──owner──→  NO_SHOW     (terminal)  [LOKI-NOTE-1]  │
│ PENDING  ──customer→ CANCELLED   (terminal)                 │
│ CONFIRMED ──owner──→ CANCELLED   (terminal)                 │
│ CONFIRMED ──owner──→ COMPLETED   (terminal)                 │
│ CONFIRMED ──owner──→ NO_SHOW     (terminal)                 │
│ CONFIRMED ──customer→ CANCELLED  (terminal)                 │
│ [terminal] ─────────→ IMMUTABLE  (VPD-V-021 enforced)       │
└─────────────────────────────────────────────────────────────┘
```

**LOKI-NOTE-1:** `pending → no_show` transition is allowed by OWNER_STATUSES allowlist. This is semantically unusual (a booking was never confirmed, yet is marked as no_show). No enforcement prevents this at the controller layer. Not a security exploit, but could contaminate booking analytics.

**State Machine Enforcement:** STRONG — TERMINAL_STATUSES gate fires before auth, preventing mutation replay. All transitions enforced at controller layer.

---

## Business Logic Abuse Analysis

### LOKI-BL-001 — Fuel Price Self-Submission and Self-Review

```
LOKI RUNTIME FINDING
- Finding ID:        LOKI-BL-001
- Location:          reviewFuelPriceSuggestionController + submitFuelPriceSuggestionController
- Application Scope: VCSM
- Runtime Risk:      Business Logic Abuse
- Evidence Type:     INFERRED
- Confidence:        HIGH
- Current behavior:  A user who owns a VPORT can submit a fuel price suggestion as a citizen
                     actor, then switch to VPORT owner identity and approve their own submission.
                     decidedByActorId is not checked against submitted_by_actor_id.
- Runtime impact:    Intended review workflow (citizen suggests, owner reviews) becomes trivially
                     self-reviewable by the VPORT owner. Approval process provides no independent
                     validation if owner controls both sides.
- Severity:          LOW — this is the intended design for a sole-proprietor VPORT; no cross-actor
                     exploitation possible; blast radius is owner's own station only
- Recommended handoff: VENOM (confirm design intent — is self-review acceptable for this workflow?)
- Rationale:         Design intent question, not a security exploit. LOKI flags for VENOM trust
                     boundary design review.
```

### LOKI-BL-002 — Backdated Owner Booking + Immediate Cancellation

```
LOKI RUNTIME FINDING
- Finding ID:        LOKI-BL-002
- Location:          createOwnerBookingController → updateBookingStatusController
- Application Scope: VCSM
- Runtime Risk:      Record Integrity / History Manipulation
- Evidence Type:     INFERRED
- Confidence:        HIGH
- Current behavior:  Owner creates a confirmed booking with startsAt in the past (BW-NEW-002).
                     Owner then cancels the booking. Booking appears in history as:
                     "confirmed booking was cancelled" with a past start time.
                     Potentially contaminates analytics, reporting, and no-show statistics.
- Runtime impact:    Booking history records can be manufactured with arbitrary past timestamps.
                     No reconciliation mechanism exists at the controller layer.
- Severity:          LOW — affects single VPORT's history records; no cross-actor impact
- Recommended handoff: ELEKTRA (patch advisory already exists — Patch 6)
- Rationale:         LOKI confirms the business logic abuse vector for BW-NEW-002. The fix
                     (past-time guard in createOwnerBookingController) also closes this chain.
```

### LOKI-BL-003 — publishFuelPriceUpdateAsPost Called After Bypass: Silent Feed Contamination

```
LOKI RUNTIME FINDING
- Finding ID:        LOKI-BL-003
- Location:          publishFuelPriceUpdateAsPostController → createSystemPost
- Application Scope: VCSM
- Runtime Risk:      Feed Integrity / Silent System Post Injection
- Evidence Type:     INFERRED
- Confidence:        HIGH
- Current behavior:  Any authenticated actor (ELEK-2026-06-05-005) can call
                     publishFuelPriceUpdateAsPostController and create a "fuel_price_update"
                     system post. No audit log is produced. The post appears in the public feed
                     with no signal that an unauthorized actor created it.
- Runtime impact:    Misleading fuel price system posts in public feed. No alert, no log, no
                     way to distinguish a legitimate VPORT owner post from an injected post at
                     the controller/observability layer.
- Read Amplification: None (single write path)
- Cache status:      hasRecentFuelPricePostDAL throttle window is the only guard — attackers
                     with fresh actor IDs bypass the throttle
- Severity:          MEDIUM — feed contamination with no runtime signal
- Recommended handoff: VENOM, BLACKWIDOW (confirm user-kind path at runtime)
- Rationale:         The combination of ELEK-2026-06-05-005 (auth bypass) + zero observability
                     makes this a silent attack vector. An incident could only be discovered by
                     DB inspection — not runtime monitoring.
```

---

## Observability Governance Status

| Area | Coverage | Missing Visibility | Risk |
|---|---|---|---|
| Booking creation | DB record only | No creation log, no actor attribution audit | MEDIUM |
| Booking mutation (status update) | DB record | Notification failure silently swallowed in production | LOW |
| Booking ownership verification failure | None | Failed assertActorOwnsVportActorController throws are uncaught at app log layer | HIGH |
| Fuel price approval | DB review record (createFuelPriceSubmissionReviewDAL) | TOCTOU produces duplicate records with no alert signal | HIGH |
| Fuel price history | DB history record (createVportFuelPriceHistoryDAL) | No flag if duplicate history entries exist (TOCTOU) | MEDIUM |
| Feed system post publication | None | No publication audit trail; bypass is completely silent | MEDIUM |
| Actor ownership verification | None | No audit log for any checkVportOwnershipController call | MEDIUM |

---

## Observability Gap Review

| Flow | Current Visibility | Missing Signals | Severity | Recommended Instrumentation |
|---|---|---|---|---|
| reviewFuelPriceSuggestionController — concurrent double-approval | None | Duplicate review detection signal | HIGH | Add affected-rows check after updateFuelPriceSubmissionStatusDAL; log WARNING if data===null (already reviewed) |
| assertActorOwnsVportActorController — ownership verification failure | Exception throw only | Security audit log for failed ownership checks | HIGH | Catch + log at controller boundary: { actorId, targetActorId, kind, result:"denied", controller } |
| publishFuelPriceUpdateAsPostController — system post creation | None | Publication audit event | MEDIUM | Log at creation: { actorId, actorKind, postType, fuelCount, realmId } |
| createVportPublicBookingController — booking creation | DB record | Runtime booking creation event | MEDIUM | Log at insert: { actorId, resourceId, status, source, startsAt } |
| updateBookingStatusController — notification failure | DEV-only console.error | Production-visible error signal | LOW | Move catch to production-safe error reporting (Sentry or structured log) |
| publishFuelPriceUpdateAsPostController — dedup throttle bypass | None | Actor-level post rate signal | LOW | Log when throttled: { actorId, windowMs } |
| checkVportOwnershipController — VPORT-kind self-shortcut used for mutation | None | Flag when self-shortcut fires in mutation context | MEDIUM | Log: { callerActorId, targetActorId, kind:"vport", path:"self-shortcut", context:"mutation" } |

---

## Audit Trail Warnings

```
AUDIT TRAIL WARNING
Flow:             Booking creation (createVportPublicBookingController, createOwnerBookingController)
Missing audit:    No security audit log of booking creation events. Only DB record exists.
Operational risk: If a booking is disputed or if voided-actor bookings (VENOM-WS-001) are created,
                  there is no runtime audit trail to reconstruct who initiated the request, from
                  what actor identity, and at what time — beyond the DB row itself.
Recommended:      Security audit log event at controller level: { actorId, actorKind, resourceId,
                  startsAt, source, timestamp } — no PII, no tokens
```

```
AUDIT TRAIL WARNING
Flow:             Actor ownership verification failure (assertActorOwnsVportActorController)
Missing audit:    Ownership check failures throw exceptions that are swallowed at the caller.
                  No structured log records: which actor tried to access which resource, which
                  controller was the entry point, or how many times it failed.
Operational risk: Brute-force VPORT ownership probing (trying random VPORT IDs) produces zero
                  observable signal. An attacker could probe ownership relationships without
                  leaving any trace beyond the DB query logs (not app-layer visible).
Recommended:      Structured security log at throw site: { requestActorId, targetActorId,
                  reason:"ownership_denied", controller:"assertActorOwnsVportActorController" }
```

```
AUDIT TRAIL WARNING
Flow:             Gas price system post publication (publishFuelPriceUpdateAsPostController)
Missing audit:    No publication event is logged when a system post is created. Given the
                  ownership bypass (BW-NEW-001 + ELEK-005), a malicious publication is
                  indistinguishable from a legitimate one at the runtime layer.
Operational risk: Feed contamination incident cannot be detected or attributed without DB inspection.
                  Incident response time is degraded — no alert triggers on unauthorized system posts.
Recommended:      Security audit log: { actorId, actorKind, postType, realmId, bypass_detected: bool }
                  where bypass_detected = actorKind !== "vport" — flags suspicious publications
```

---

## Correlation ID Review

| Flow | Correlation Present | Risk | Recommendation |
|---|---|---|---|
| Booking creation flow | ABSENT | Cannot correlate booking row with the HTTP request that created it | Add booking traceId: correlation between create call + DB row + notification batch |
| Fuel price review flow | ABSENT | Double-approval incident cannot be correlated to the two HTTP requests | Add reviewTraceId passed to updateFuelPriceSubmissionStatusDAL + createFuelPriceSubmissionReviewDAL |
| System post publication | ABSENT | Published post cannot be correlated to the controller invocation | Pass correlationId to createSystemPost for audit |
| Ownership verification chain | ABSENT | Multiple getActorByIdDAL calls in assertActorOwnsVportActorController have no shared trace | Add requestTraceId to ownership assertion context |

---

## Instrumentation Recommendations

```
INSTRUMENTATION RECOMMENDATION
Location:       assertActorOwnsVportActorController — catch/throw site
Purpose:        Security audit log for ownership verification failures
Suggested signal: { eventType: "OWNERSHIP_DENIED", requestActorId, targetActorId, controller, timestamp }
Log level:      WARN
Production-safe: YES (actorIds are safe to log; no PII, no tokens)
Dev-only:       NO — this should be production-visible
Recommended owner: VENOM (trust boundary governance)
```

```
INSTRUMENTATION RECOMMENDATION
Location:       updateFuelPriceSubmissionStatusDAL — after .maybeSingle() return
Purpose:        Detect TOCTOU double-approval — if data===null, row was already reviewed
Suggested signal: { eventType: "FUEL_REVIEW_CONFLICT", submissionId, decidedByActorId, timestamp }
Log level:      WARN
Production-safe: YES
Dev-only:       NO — production-critical for data integrity
Recommended owner: VENOM (idempotency contract), Carnage (DB-layer fix)
```

```
INSTRUMENTATION RECOMMENDATION
Location:       publishFuelPriceUpdateAsPostController — after createSystemPost call
Purpose:        Publication audit trail with actor kind signal
Suggested signal: { eventType: "FUEL_PRICE_POST_PUBLISHED", actorId, actorKind, postId, realmId, fuelCount }
Log level:      INFO
Production-safe: YES
Dev-only:       NO — required for feed integrity monitoring
Recommended owner: VENOM (feed trust boundary)
```

```
INSTRUMENTATION RECOMMENDATION
Location:       updateBookingStatusController — notification .catch() block
Purpose:        Move notification failure from DEV-only to production-visible signal
Suggested signal: { eventType: "NOTIFICATION_FAILED", bookingId, eventKey, recipientActorId, error.message }
Log level:      ERROR (Sentry)
Production-safe: YES (no message content logged)
Dev-only:       NO — currently DEV-only; should be production-visible
Recommended owner: LOKI, Deadpool (incident debugging)
```

---

## Observability Maturity Classification

**Bookings:** BASIC
- DB records exist (implicit audit trail through vport.bookings table)
- Terminal state enforcement is strong
- No runtime instrumentation (no structured logs, no correlation IDs, no auth event logs)
- Notification failure is development-only visible

**Gas Prices / Fuel Price Review:** MINIMAL
- DB history records exist (fuel_price_history provides implicit audit trail for price changes)
- TOCTOU failure is silent — no duplicate-detection signal
- Ownership verification failure produces no log
- Feed publication has no audit trail

**Feed Publication:** MINIMAL
- No publication audit event
- Auth bypass (ELEK-005) produces no signal
- Only DB record (the post itself) is evidence

---

## Runtime Query Profile

| Controller | DB Reads | DB Writes | Parallel Reads | N+1 Risk |
|---|---|---|---|---|
| createVportPublicBookingController | 3 (resource, actor, service) | 1 (booking) | NO — all serial | LOW (steps 1-3 independent but serial) |
| createOwnerBookingController | 2 (resource, VPORT actor) | 1 (booking) | NO | LOW |
| updateBookingStatusController | 3 (booking, VPORT actor, actor_owners x2) | 1 (booking) | NO | LOW |
| rescheduleBookingController | 3 (booking, VPORT actor, bookings-in-range) | 1 (booking) | NO | LOW |
| reviewFuelPriceSuggestionController | 4 (submission, actor, getActorByIdDAL x2) | 3 (status, price, history) | NO — fully serial | MEDIUM (3 writes serial; 5+6 could be parallel) |
| submitOwnerFuelPriceUpdateController | 2 (settings, getActorByIdDAL via check) | 2 (price, history) | NO | LOW |

**No N+1 patterns identified** within individual controller calls. Serial execution in gas price controllers is a KRAVEN concern (performance) rather than a security concern.

---

## Handoff Matrix

| Finding | Recommended Handoff | Reason |
|---|---|---|
| LOKI-BL-001 (fuel self-review) | VENOM | Design intent question — confirm self-review is acceptable |
| LOKI-BL-002 (backdated booking chain) | ELEKTRA (patch), SPIDER-MAN (regression test) | Patch exists (Patch 6); add past-time test to createOwnerBooking coverage |
| LOKI-BL-003 (silent feed contamination) | VENOM, BLACKWIDOW | Auth bypass + no observability = undetectable attack |
| Ownership failure audit gap | VENOM | Security audit requirement for ownership denial events |
| TOCTOU observability gap | Carnage (DB fix), VENOM (contract) | DB status precondition closes functional gap; log signal for production |
| Notification failure production-silent | Deadpool, SENTRY | Move from DEV-only to Sentry production error |
| Correlation ID absence | LOKI (instrumentation advisory), THOR gate | Required for incident response capability |

---

## Final LOKI Status

**CAUTION**

Booking flows are functionally observable (DB records provide basic audit trail). Gas price and feed publication flows are MINIMAL maturity — silent auth bypass (ELEK-005 + BW-NEW-001), silent TOCTOU double-approval (VENOM-WS-003), and no audit trail for system post publication create incident response gaps.

3 audit trail gaps identified. 0 correlation IDs present for any critical flow. Production notification failures are silently swallowed.

No CRITICAL runtime risks (no runaway loops, no query storms, no production-visible sensitive data).

**Sudden Death assessment:** No CRITICAL findings. Sudden Death rule NOT triggered (Blue Team).

LOKI emits: **CAUTION**
LOKI does NOT emit: THOR_RELEASE_ELIGIBLE
Release authority belongs exclusively to THOR.
