# BLACKWIDOW — Branch Adversarial Review
**Branch:** vport-booking-feed-security-updates
**Date:** 2026-06-07
**Command:** BLACKWIDOW V3
**Mode:** BRANCH PASS — closure verification + new surface adversarial review
**Application Scope:** VCSM + TRAFFIC

---

## VENOM Dependency Gate

```
BLACKWIDOW PREFLIGHT PASS

Upstream Report:
- VENOM: ZZnotforproduction/APPS/VCSM/features/booking/outputs/2026/06/07/Venom/2026-06-07_venom_v2_branch-security-review.md
  Scope: booking · vport · feed · Traffic:answers
  Date: 2026-06-07
  Status: COMPLETE
  Age: 0 days

Proceeding with BLACKWIDOW adversarial review.
```

---

## ARCHITECT Output Consumption

```
Evidence Bundle Consumed:
- ZZnotforproduction/GOVERNANCE/outputs/2026/06/07/ARCHITECT/evidence-bundle.md
- ZZnotforproduction/GOVERNANCE/outputs/2026/06/07/ARCHITECT/architect-security-surface.json
Full Rediscovery Performed: NO — ARCHITECT evidence bundle consumed before constructing scenarios
```

---

## Attack Surfaces In Scope (from VENOM findings)

| Surface | Feature | Prior Status | Attack Goal |
|---|---|---|---|
| createBooking.controller.js — customerActorId (mgmt) | booking | VEN-BOOKING-007 CLOSED | Verify closure cannot be bypassed via management source |
| createBooking.controller.js — linkPath notification | booking | VEN-BOOKING-009 CLOSED | Verify UUID cannot appear in notification payload |
| createBooking.controller.js — status param | booking | VEN-BOOKING-004 OPEN | Verify status injection exploitability |
| /api/answers/questions POST route | traffic | VEN-TRAFFIC-001 NEW | Adversarially verify no auth bypass needed |
| /api/answers/moderation — static token | traffic | VEN-TRAFFIC-002 NEW | Adversarially verify token escalation |

---

## Source Files Read (Adversarial Pass)

| File | Purpose |
|---|---|
| apps/VCSM/src/features/booking/controllers/createBooking.controller.js | Full read — session binding, management path, notification |

---

## Adversarial Scenarios

---

### SCENARIO BW-BRANCH-001 — Management Source customerActorId Bypass Test

```
OWNERSHIP BYPASS ATTEMPT
Target: createBooking.controller.js — customerActorId injection via management source
Attack vector: Call with source='owner', customerActorId=<foreign_actor_id>
  → MANAGEMENT_SOURCES check (line 76): passes if source='owner'
  → assertActorOwnsVportActorController (line 81): caller must own resource.owner_actor_id
  → customer_actor_id: customerActorId (line 126): passed unmodified — no override
  → INSERT to bookings with foreign customerActorId
Result: PARTIAL
Evidence:
  Line 76-85: Management gate requires verified vport ownership via assertActorOwnsVportActorController
  Line 112: Session binding only applies inside CITIZEN_ONLY_SOURCES block — management is exempt
  Line 126: customer_actor_id passes whatever customerActorId was supplied
Controller gate: PRESENT (ownership assertion) but only for REQUESTOR identity, not for CUSTOMER identity
Severity: LOW — Caller must be a verified VPORT owner. Architectural intent: owner books walk-in customer.
          Can attribute booking to any actorId but cannot bypass ownership requirement.
```

**Assessment:** VEN-BOOKING-007 is correctly closed for public source. Management source attribution to arbitrary customerActorId is by design. A VPORT owner booking a walk-in customer must be able to specify who the customer is. This is not a bypass — it is a trusted operation gated behind ownership verification.

**THOR status:** VEN-BOOKING-007 CLOSED confirmation — design intent confirmed adversarially. Not a regression.

---

### SCENARIO BW-BRANCH-002 — Notification linkPath UUID Bypass Test

```
NOTIFICATION ABUSE ATTEMPT
Notification type: booking_created (public source)
Attack vector: Trigger createBooking public path — inspect notification payload for UUID
  → Lines 164-165: if (source === "public" && resource.owner_actor_id && requestActorId)
  → Line 172: linkPath: null
Authorization at destination: ENFORCED (recipientActorId used for delivery)
Result: BLOCKED
Evidence:
  Line 164: Notification conditional — source === "public" only
  Line 172: linkPath: null — explicitly null, no actor UUID in payload
  Management source (lines 76-85): no notification fired at all for management bookings
  Only one notification path in this controller — no alternate path can carry UUID
Severity: N/A — CLOSED
```

**Assessment:** VEN-BOOKING-009 / BW-BOOK-015 are fully confirmed closed. No alternate linkPath path exists in this controller. Management bookings do not trigger notifications (additional observation: customers are not notified when a management booking is attributed to them — LOW concern, see BW-BRANCH-007).

---

### SCENARIO BW-BRANCH-003 — Status Injection via Management Source (VEN-BOOKING-004 adversarial)

```
RUNTIME ABUSE ATTEMPT
Target: createBooking.controller.js — status parameter for management source
Actor role used: Authenticated VPORT owner (source='owner')
Expected access: DENIED for terminal status values on insert
  → Line 23: status = null (parameter default)
  → Lines 76-85: management gate: requestActorId owns resource → PASS
  → Line 128: status: status — passed to insertBookingDAL unmodified
  → insertBooking.dal.js: pickDefined includes non-null status
  → INSERT bookings: status='completed' inserted
Result: ALLOWED
Evidence:
  Line 128: status field passed to DAL row with no allowlist check
  Line 23: default null; caller can override to any string value
  MANAGEMENT_SOURCES = {"owner", "admin", "import", "sync"} — all can exploit
  DB constraint on status column values: NOT VERIFIED (unknown — DB audit required)
Privilege gate: WEAK — ownership check present but no status validation
Severity: MEDIUM — requires verified VPORT ownership; blast radius is owner's own booking data
```

**DB AUDIT NOTE:**
- DB object: bookings table status column constraint
- Risk: If DB has no CHECK constraint on status values, management callers can insert terminal states
- Why deferred: DB review phase required
- Suggested later SQL review: `SELECT check_clause FROM information_schema.check_constraints WHERE constraint_name LIKE '%bookings%status%';`

**THOR blocker:** NO new blocker added — VEN-BOOKING-004 already OPEN. This adversarial run confirms exploitability.

---

### SCENARIO BW-BRANCH-004 — Traffic Unauthenticated Question Submission Adversarial

```
OWNERSHIP BYPASS ATTEMPT
Target: POST /api/answers/questions
Attack vector: HTTP POST with no Authorization header
  → route.js: no auth middleware, no session check
  → submitQuestion(body): no auth enforcement
  → buildQuestionSubmission(input): validates/sanitizes input only
  → createQuestionRow(payload): if TRAZE_ANSWERS_SCHEMA_READY=true → INSERT answers.questions
Result: BYPASSED (flag=true) / BLOCKED_BY_GATE (flag=false)
Evidence:
  route.js: no auth check before submitQuestion(body) call
  TRAZE_ANSWERS_SCHEMA_READY=false: getAnswersClient() returns null — DB write never occurs
  TRAZE_ANSWERS_SCHEMA_READY=true: INSERT to answers.questions with no identity
Controller gate: ABSENT
Severity: HIGH (when flag=true) — open content injection, no user identity, no rate limit
```

---

### SCENARIO BW-BRANCH-005 — Traffic Question Flood (Rate Limit Absence)

```
RUNTIME ABUSE ATTEMPT
Target: POST /api/answers/questions (no rate limit)
Actor role used: Unauthenticated (none required)
Expected access: THROTTLED after N requests
  → route.js: processes every request regardless of frequency
  → No rate limit header check
  → No IP throttle at application layer
  → No captcha or challenge
  → When flag=true: each request inserts a row into answers.questions
Result: ALLOWED — when flag=true, unlimited inserts possible
Evidence:
  Application layer: no rate limiting in route.js or submitQuestion.controller.js
  Infrastructure layer: Vercel/Next.js platform rate limits (if any) are unverified from source
Privilege gate: ABSENT (application layer)
Severity: MEDIUM — adds to VEN-TRAFFIC-001; moderation queue flooding possible
```

---

### SCENARIO BW-BRANCH-006 — Traffic Moderation Token Privilege Escalation

```
RUNTIME ABUSE ATTEMPT
Target: POST /api/answers/moderation/questions + /api/answers/moderation/answers
Actor role used: Anyone with TRAZE_ANSWERS_MODERATION_TOKEN
Expected access: Per-user authorization
  → validateModerationRequest: static token comparison
  → Token matches: full moderation authority — approve/reject/suppress
  → No user identity bound to token
  → No audit trail per caller
  → No expiry enforcement
Result: PARTIAL — token provides functional auth gate; lacks attribution and rotation enforcement
Evidence:
  moderationAuth.model.js: static string comparison only
  No user identity extracted from token
  No rate limit on moderation calls
  Token leakage = silent full moderation authority
Privilege gate: PRESENT but WEAK
Severity: MEDIUM — confirms VEN-TRAFFIC-002
```

---

### SCENARIO BW-BRANCH-007 — Silent Management Booking Attribution (NEW FINDING)

```
NOTIFICATION ABUSE ATTEMPT
Notification type: booking_created (management source)
Attack vector: Owner creates booking with source='owner', customerActorId=<victim_actorId>
  → Management gate: owner's requestActorId verified against resource
  → customer_actor_id: victim's actorId inserted
  → Notification block (line 164): source !== "public" → notification NOT fired
  → Customer receives no notification of booking created in their name
Result: BYPASSED (by design) — customer is silently attributed a booking without notification
Authorization at destination: N/A — no notification delivered at all
Evidence:
  Lines 164-165: notification conditional requires source === "public"
  Line 126: customer_actor_id set to caller-supplied customerActorId for management source
Severity: LOW — architectural design intent (walk-in booking); not a security exploit
Finding Type: Architectural concern — customer consent/notification gap
```

**Note:** This is an observational finding, not an exploit. The owner booking a walk-in customer is intentional. The absence of customer notification may be intentional or may need product review. Not a THOR blocker.

---

## Summary Table

| Scenario ID | Target | Finding | Result | Severity | THOR Blocker |
|---|---|---|---|---|---|
| BW-BRANCH-001 | customerActorId session binding | VEN-BOOKING-007 closure verify | PARTIAL (design intent) | LOW | NO — closure confirmed |
| BW-BRANCH-002 | linkPath notification UUID | VEN-BOOKING-009 closure verify | BLOCKED | N/A | NO — closure confirmed |
| BW-BRANCH-003 | Status injection management | VEN-BOOKING-004 adversarial | ALLOWED | MEDIUM | YES (pre-existing) |
| BW-BRANCH-004 | Traffic unauthenticated POST | VEN-TRAFFIC-001 adversarial | BYPASSED (flag=true) | HIGH | YES (conditional) |
| BW-BRANCH-005 | Traffic question flood | VEN-TRAFFIC-001 extension | ALLOWED | MEDIUM | YES (conditional) |
| BW-BRANCH-006 | Moderation token escalation | VEN-TRAFFIC-002 adversarial | PARTIAL | MEDIUM | NO |
| BW-BRANCH-007 | Silent management attribution | NEW | PARTIAL (design) | LOW | NO |

**Closures confirmed adversarially:**
- VEN-BOOKING-007: CLOSED_SOURCE_VERIFIED — confirmed not bypassable for public source; management source is by design
- VEN-BOOKING-009 / BW-BOOK-015: CLOSED_SOURCE_VERIFIED — linkPath: null confirmed, no alternate path

**Confirmed exploitable (pre-existing):**
- VEN-BOOKING-004 / BW-BRANCH-003: management status injection — MEDIUM, requires ownership

**New adversarial confirmation of VENOM findings:**
- VEN-TRAFFIC-001 adversarially confirmed — BW-BRANCH-004 (HIGH) + BW-BRANCH-005 (MEDIUM extension)
- VEN-TRAFFIC-002 adversarially confirmed — BW-BRANCH-006 (MEDIUM)

**New finding:**
- BW-BRANCH-007: Silent management booking attribution — LOW, architectural concern

---

## Downstream Handoff

| Command | Findings | Priority |
|---|---|---|
| ELEKTRA | VEN-TRAFFIC-001 (full source→sink chain), VEN-BOOKING-004 (status allowlist patch proposal) | P0 |
| DB (CARNAGE) | BW-BRANCH-003 DB AUDIT NOTE (status column constraint), VEN-TRAFFIC-001 DB AUDIT NOTE (RLS) | P1 |

---

BLACKWIDOW Branch Pass: COMPLETE
Recommendation: CAUTION
2 branch fixes confirmed adversarially closed. 1 pre-existing MEDIUM confirmed exploitable. 2 Traffic findings adversarially confirmed (HIGH + MEDIUM). 1 new LOW architectural concern.
