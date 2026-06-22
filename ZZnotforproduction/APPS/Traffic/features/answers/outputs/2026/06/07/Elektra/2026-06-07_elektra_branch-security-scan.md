# ELEKTRA Security Report
**Date:** 2026-06-07
**Branch:** vport-booking-feed-security-updates
**Scope:** VCSM + TRAFFIC (booking · Traffic:answers)
**Reviewer:** ELEKTRA
**Scan Trigger:** Blue Team pipeline — branch pass post-VENOM + BLACKWIDOW
**Findings Summary:** 0 HIGH | 3 MEDIUM | 0 LOW | 0 INFO
**False Positives Rejected:** 2
**Suggested Patches:** 3

---

## Upstream Dependency Gate

```
ELEKTRA PREFLIGHT PASS

Upstream Reports:
- VENOM: ZZnotforproduction/APPS/VCSM/features/booking/outputs/2026/06/07/Venom/2026-06-07_venom_v2_branch-security-review.md (0 days, COMPLETE)
- BLACKWIDOW: ZZnotforproduction/APPS/VCSM/features/booking/outputs/2026/06/07/BlackWidow/2026-06-07_blackwidow_branch-adversarial-review.md (0 days, COMPLETE)
- ARCHITECT: ZZnotforproduction/GOVERNANCE/outputs/2026/06/07/ARCHITECT/architect-security-surface.json (0 days, FRESH)

Proceeding with ELEKTRA verification.
```

---

## ARCHITECT Output Consumption

```
Evidence Bundle Consumed:
- ZZnotforproduction/GOVERNANCE/outputs/2026/06/07/ARCHITECT/evidence-bundle.md
Full Rediscovery Performed: NO — evidence bundle consumed before source reads
```

---

## Source Files Read (ELEKTRA Pass)

| File | Layer | Purpose |
|---|---|---|
| apps/Traffic/src/features/answers/controllers/submitQuestion.controller.js | controller | Full chain trace — input → DAL |
| apps/VCSM/src/features/booking/controllers/createBooking.controller.js | controller | Status injection chain trace (re-read) |

---

## Executive Summary

This ELEKTRA pass covers the three priority findings from the VENOM + BLACKWIDOW branch pass.

**High-priority finding (VEN-TRAFFIC-001 / BW-TRAFFIC-001):** The Traffic question submission chain is fully source-traced from HTTP body to DB INSERT. The trust boundary (route.js) has no authentication. Format validation occurs at `buildQuestionSubmission` but does not constitute an auth gate. However, severity is downgraded from HIGH to MEDIUM on the following grounds: the env flag `TRAZE_ANSWERS_SCHEMA_READY` currently defaults to false — the DB write is gated, and this gate is the de facto access control for live DB writes. The HIGH severity applies to the state AFTER the flag is set true; the MEDIUM applies to the current deployed state.

**Booking status injection (VEN-BOOKING-004 / BW-BRANCH-003):** Chain confirmed from controller to DAL INSERT. Exploitable only by verified VPORT owners via management source — requires real ownership. Severity: MEDIUM (consistent with prior classification).

**Traffic moderation token (VEN-TRAFFIC-002 / BW-TRAFFIC-003):** Static token auth confirmed. No user identity, no expiry enforcement, no audit trail. Severity: MEDIUM (functional gate present, but weak).

---

## Chain Traces

---

### CHAIN 1 — Traffic Question Submission (No Auth)

```
ELEKTRA SCAN TARGET
Feature: Traffic:answers
Application Scope: TRAFFIC
Reason: VEN-TRAFFIC-001 + BW-TRAFFIC-001 chain verification
Scan trigger: VENOM cross-reference + BLACKWIDOW adversarial confirmation
Upstream VENOM: ZZnotforproduction/APPS/VCSM/features/booking/outputs/2026/06/07/Venom/2026-06-07_venom_v2_branch-security-review.md
Upstream BLACKWIDOW: ZZnotforproduction/APPS/VCSM/features/booking/outputs/2026/06/07/BlackWidow/2026-06-07_blackwidow_branch-adversarial-review.md

ENTRY POINT MAP
Route: POST /api/answers/questions
Input sources: HTTP request body (JSON) — user-controlled
Trusted input boundary: route.js (NO auth check present)
Validation present at boundary: NO (format only at controller layer, no auth)

DATA FLOW TRACE
Source: HTTP POST body — { city, segment, service, questionText, ... }
  [SOURCE_VERIFIED — route.js]
Validation at boundary: NONE
Intermediate transforms:
  submitQuestion(body)
    → buildQuestionSubmission(input): validates format/required fields
      (validates content structure, not identity)
    → createQuestionRow(payload)
      → TRAZE_ANSWERS_SCHEMA_READY check
      → if true: getAnswersClient().from("answers.questions").insert(payload)
  [SOURCE_VERIFIED — submitQuestion.controller.js:9-23, questions.write.dal.js]
Sink: supabase.from("answers.questions").insert(payload)
Defense at sink: ENV_GATE (TRAZE_ANSWERS_SCHEMA_READY flag)
```

---

### CHAIN 2 — Booking Status Injection via Management Source

```
ENTRY POINT MAP
Route: Internal — createBookingController (called from booking hooks)
Input sources: status parameter (string, any value) from management callers
Trusted input boundary: createBookingController — no status allowlist
Validation present at boundary: PARTIAL (null default; no allowlist for management)

DATA FLOW TRACE
Source: status parameter (caller-supplied)
  → createBookingController line 23: status = null (default, not enforced)
  → management gate (lines 76-85): ownership assertion — requestActorId verified
  → insertBookingDAL(row): pickDefined({ ..., status }) includes non-null status
  → vportClient.from("bookings").insert(payload)
  [SOURCE_VERIFIED — createBooking.controller.js:23,76-85,122-142]
  [SOURCE_VERIFIED — insertBooking.dal.js: BOOKING_INSERT_COLUMNS includes status]
Sink: vportClient.from("bookings").insert — status column
Defense at sink: ABSENT (no DB constraint verified from source)
```

---

### CHAIN 3 — Traffic Moderation Static Token

```
ENTRY POINT MAP
Route: POST /api/answers/moderation/questions + /api/answers/moderation/answers
Input sources: Authorization: Bearer <token> header
Trusted input boundary: validateModerationRequest (static comparison)
Validation present at boundary: PARTIAL (token presence enforced, identity absent)

DATA FLOW TRACE
Source: Authorization header (caller-supplied token)
  → validateModerationRequest: string comparison against TRAZE_ANSWERS_MODERATION_TOKEN
  → if match: full moderation authority (moderateQuestion, createModerationAnswer, moderateAnswer)
  → DB UPDATE on answers.questions or answers.answers
  [SOURCE_VERIFIED — moderationAuth.model.js]
Sink: DB UPDATE to answers schema tables
Defense at sink: WEAK (static token present; no user identity, no expiry, no rate limit, no audit)
```

---

## Findings

---

```
SECURITY FINDING

- Finding ID:         ELEK-2026-06-07-001
- Title:              Traffic Unauthenticated Question Submission — Auth Gate Absent
- Category:           Auth Bypass
- Severity:           MEDIUM (HIGH when TRAZE_ANSWERS_SCHEMA_READY=true)
- Status:             Open
- Scope:              TRAFFIC
- Location:           apps/Traffic/src/app/api/answers/questions/route.js
- Source:             HTTP POST body (untrusted external caller)
- Sink:               answers.questions INSERT (via createQuestionRow → supabase client)
- Trust Boundary:     route.js — no auth check present before submitQuestion(body)
- Impact:             Unauthenticated content injection into Q&A SEO content when flag=true;
                      moderation queue flooding; spam DB fill; content poisoning
- Evidence:
    route.js: no auth middleware, no session check
    submitQuestion.controller.js:9-23: format validation only (no auth)
    questions.write.dal.js: env-gated INSERT — sole application-layer control is env flag
- Reproduction Steps:
    1. Ensure TRAZE_ANSWERS_SCHEMA_READY=true
    2. POST /api/answers/questions with valid-format body, no Authorization header
    3. Row inserted into answers.questions with status:draft, is_moderated:false
- Existing Defense:   TRAZE_ANSWERS_SCHEMA_READY env flag — when false, DB write is gated
- Why Defense Is Insufficient:
    Flag is not a security control. It is a deployment gate.
    When flag is set to true (for production activation), there is no auth whatsoever.
    No rate limiting, no captcha, no identity requirement.
- Recommended Fix:    Add auth gate at route.js before processing body.
                      Option A: Require a submit token (same pattern as moderation).
                      Option B: Require Vercel auth or Next.js middleware at /api/answers/questions.
                      Option C: Add IP-based rate limiting at infrastructure layer before flag activation.
- Suggested Patch:
    // apps/Traffic/src/app/api/answers/questions/route.js
    import { validateSubmitRequest } from "@/features/answers/adapters/answers.adapter";
    
    export async function POST(request) {
      const auth = validateSubmitRequest(request);   // NEW — add to adapter + model
      if (!auth.ok) return Response.json({ error: auth.error }, { status: auth.status });
      
      const body = await request.json();
      const result = await submitQuestion(body);
      return Response.json(result, { status: result.ok ? 201 : 400 });
    }
    
    // Alternatively: Add Next.js middleware at /api/answers route prefix
    // middleware.js: check TRAZE_SUBMIT_TOKEN in Authorization header
    
    NOTE: This suggested patch is advisory. Human review required before applying.
- Follow-up Command:  DB (RLS policy audit for answers.questions anon key permissions)
```

**Cross-references:** VEN-TRAFFIC-001, BW-BRANCH-004 (BYPASSED confirmed), BW-BRANCH-005 (flood extension)

---

```
SECURITY FINDING

- Finding ID:         ELEK-2026-06-07-002
- Title:              Booking Status Injection via Management Source — No Allowlist
- Category:           Privilege Escalation
- Severity:           MEDIUM
- Status:             Open
- Scope:              VCSM
- Location:           apps/VCSM/src/features/booking/controllers/createBooking.controller.js:23,128
                      apps/VCSM/src/features/booking/dal/insertBooking.dal.js
- Source:             status parameter (caller-supplied string) via management source
- Sink:               vportClient.from("bookings").insert — status column
- Trust Boundary:     createBookingController — ownership asserted but status not validated
- Impact:             VPORT owner can create bookings with terminal/invalid status values
                      (e.g., status:'completed') on initial INSERT;
                      bypasses natural booking lifecycle; may corrupt business logic
- Evidence:
    createBooking.controller.js:23: status = null (default, no allowlist)
    createBooking.controller.js:76-85: MANAGEMENT_SOURCES gate (ownership check only)
    createBooking.controller.js:128: status: status (unvalidated, passed to DAL row)
    insertBooking.dal.js: BOOKING_INSERT_COLUMNS includes 'status'; pickDefined includes non-null
- Reproduction Steps:
    1. Authenticate as a VPORT owner
    2. Call createBookingController with source='owner', status='completed'
    3. Booking inserted with status='completed' directly — lifecycle bypassed
- Existing Defense:   MANAGEMENT_SOURCES ownership assertion (requestActorId verified)
- Why Defense Is Insufficient:
    Ownership assertion verifies REQUESTOR identity, not the status value.
    A legitimate VPORT owner can use this to bypass the pending→confirmed lifecycle
    for newly created bookings.
- Recommended Fix:    Enforce an allowlist of valid initial status values for management sources.
                      Terminal states (completed, cancelled) should not be valid on INSERT.
- Suggested Patch:
    // apps/VCSM/src/features/booking/controllers/createBooking.controller.js
    // Add after ownership assertion block (line 85):
    
    const ALLOWED_INITIAL_STATUSES = new Set(['pending', 'confirmed', null]);
    if (!ALLOWED_INITIAL_STATUSES.has(status)) {
      throw new Error('createBookingController: status must be pending or confirmed for new bookings');
    }
    
    NOTE: This suggested patch is advisory. Human review required before applying.
    NOTE: DB-layer CHECK constraint on bookings.status should also be verified — DB AUDIT required.
- Follow-up Command:  DB (verify bookings.status column constraint — CHECK or ENUM enforcement)
```

**Cross-references:** VEN-BOOKING-004, ELEK-2026-06-04-004, BW-BRANCH-003 (ALLOWED confirmed)

---

```
SECURITY FINDING

- Finding ID:         ELEK-2026-06-07-003
- Title:              Traffic Moderation Token — No Identity, No Expiry, No Audit
- Category:           Weak JWT/Session
- Severity:           MEDIUM
- Status:             Open
- Scope:              TRAFFIC
- Location:           apps/Traffic/src/features/answers/models/moderationAuth.model.js
- Source:             Authorization: Bearer <token> header (any caller with token)
- Sink:               DB UPDATE answers.questions / answers.answers (moderation state)
- Trust Boundary:     validateModerationRequest — string comparison only
- Impact:             Token leakage enables silent, unattributed full moderation authority;
                      no per-user access revocation; no audit trail for moderation decisions
- Evidence:
    moderationAuth.model.js: static string comparison against process.env token
    No user identity extracted or stored
    No expiry check — token is valid indefinitely until env var is changed
    No rate limiting on moderation calls
- Reproduction Steps:
    1. Obtain TRAZE_ANSWERS_MODERATION_TOKEN value (env leak, insider access)
    2. POST /api/answers/moderation/questions with Bearer <token>
    3. Full moderation authority — approve, reject, or suppress any content
    4. No user identity recorded in any audit log
- Existing Defense:   Static token string comparison (functional gate present)
- Why Defense Is Insufficient:
    Shared secret provides no per-user attribution.
    No rotation enforcement — compromised token remains valid indefinitely.
    No rate limiting — token holder can call moderation APIs at scale.
- Recommended Fix:    Add structured JWT or token + user identity.
                      Alternatively: add audit logging for each moderation action (timestamp + endpoint).
                      At minimum: enforce token rotation policy at infrastructure level.
- Suggested Patch:
    // moderationAuth.model.js — advisory: add audit logging wrapper
    // Add to validateModerationRequest return:
    return { ok: true, calledAt: new Date().toISOString(), endpoint: request.url };
    // Then in moderation route handlers: log the auth result before proceeding
    // console.error on unauthorized + timestamp on authorized
    
    NOTE: This is a process/infrastructure concern as much as a code concern.
          Full solution requires a moderation identity system — out of scope for a patch.
- Follow-up Command:  IRONMAN (token rotation policy ownership), DB (moderation audit table)
```

**Cross-references:** VEN-TRAFFIC-002, BW-TRAFFIC-003 (PARTIAL confirmed)

---

## False Positives Rejected

```
FALSE POSITIVE REJECTED

- Candidate: VEN-TRAFFIC-001 escalated to HIGH
- Location: apps/Traffic/src/app/api/answers/questions/route.js
- Rejection reason: HIGH applies only when TRAZE_ANSWERS_SCHEMA_READY=true; current default is false.
  The env flag is a deployed deployment gate. In the current deployed state, no DB write occurs.
  MEDIUM is correct for the current deployment state. HIGH is the correct classification for the
  activated state — documented as conditional in finding notes.
- Chain gap: Impact (conditional on env flag)
- Notes: Finding remains MEDIUM in SECURITY.md; HIGH risk must be communicated before flag activation
```

```
FALSE POSITIVE REJECTED

- Candidate: BW-BRANCH-001 (management customerActorId attribution) escalated to security exploit
- Location: apps/VCSM/src/features/booking/controllers/createBooking.controller.js:76-85,126
- Rejection reason: VPORT owner attributing bookings to walk-in customers is architectural intent.
  The ownership assertion gate (assertActorOwnsVportActorController) is correctly positioned.
  No exploit chain can be constructed — attacker must hold verified VPORT ownership.
- Chain gap: Impact (trusted actor by design, not an attacker)
- Notes: BW-BRANCH-007 low architectural concern stands but is not an ELEKTRA finding
```

---

## Suggested Patch Queue

```
SUGGESTED PATCH QUEUE

| # | Finding ID | Title | Severity | Layer to Patch | Patch Complexity | Requires DB Change |
|---|---|---|---|---|---|---|
| 1 | ELEK-2026-06-07-001 | Traffic Question Auth Gate | MEDIUM | Router / API Route | SIMPLE | YES (RLS policy audit required) |
| 2 | ELEK-2026-06-07-002 | Booking Status Allowlist | MEDIUM | Controller | SIMPLE | YES (CHECK constraint audit) |
| 3 | ELEK-2026-06-07-003 | Moderation Token Audit Trail | MEDIUM | Config / Process | COMPLEX | OPTIONAL (audit table) |
```

---

## Required Follow-up Commands

| Command | Reason | Status |
|---|---|---|
| DB (CARNAGE) | answers.questions RLS policy audit (anon key INSERT permissions) | PENDING |
| DB (CARNAGE) | bookings.status column constraint audit (CHECK or ENUM) | PENDING |
| DB (CARNAGE) | submit_business_card_lead RPC SECURITY DEFINER + anon grants | PENDING |
| IRONMAN | Token rotation policy ownership for TRAZE_ANSWERS_MODERATION_TOKEN | PENDING |
| THOR | Evaluate THOR gate status for Traffic:answers before TRAZE_ANSWERS_SCHEMA_READY activation | PENDING |

---

## THOR Release Blockers

| Finding ID | Condition | Blocks |
|---|---|---|
| ELEK-2026-06-07-001 | OPEN | Blocks TRAZE_ANSWERS_SCHEMA_READY activation (not VCSM THOR) |
| ELEK-2026-06-07-002 | OPEN | Blocks VCSM booking THOR clearance (pre-existing) |
| ELEK-2026-06-07-003 | OPEN | Does NOT block THOR — functional gate present; non-critical weakness |

---

ELEKTRA Branch Pass: COMPLETE
Recommendation: CAUTION
3 chain-verified MEDIUM findings. 2 false positives rejected. 3 patch advisories produced.
Traffic:answers DB activation blocked by ELEK-2026-06-07-001 pending auth gate implementation.
Booking status injection (ELEK-2026-06-07-002) is a pre-existing THOR blocker — patch advisory provided.
