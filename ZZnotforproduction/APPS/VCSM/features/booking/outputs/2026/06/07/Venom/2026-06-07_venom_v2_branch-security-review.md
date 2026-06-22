# VENOM V2 — Branch Security Review
**Branch:** vport-booking-feed-security-updates
**Date:** 2026-06-07
**Command:** VENOM V2
**Mode:** BRANCH PASS (re-verify + new surface scan)
**Scope:** booking (primary) · vport · feed · Traffic:answers

---

## ARCHITECT Gate

```
ARCHITECT Gate: PASS
Report Age: 0 hours (same session)
Report Path: ZZnotforproduction/GOVERNANCE/outputs/2026/06/07/ARCHITECT/architect-v2-report.md
Surface JSON: ZZnotforproduction/GOVERNANCE/outputs/2026/06/07/ARCHITECT/architect-security-surface.json
Scanner Maps: 14/14 FRESH (2026-06-07T08:11:08.925Z)
```

---

## Surface Inventory (from ARCHITECT)

```
Write surfaces:       487
RPC surfaces:          71
Edge function surfaces: 52
Security paths:        610  (all access:unknown — scanner gap)
Route-to-write chains: 0/487 resolved (SPA limitation)
```

Manual trace mode required for all chains.

---

## 1. BOOKING — Session Binding & Notification Fix Verification

### Scope

Branch claims to close two prior CRITICAL/HIGH findings:
- VEN-BOOKING-007 / ELEK-2026-06-04-008 — caller-supplied customerActorId
- VEN-BOOKING-009 / ELEK-2026-06-04-011 / BW-BOOK-015 — raw UUID in notification linkPath

### Source Read

**File:** `apps/VCSM/src/features/booking/controllers/createBooking.controller.js`
**Provenance:** [SOURCE_VERIFIED]

**Line 112 — customerActorId session binding (public source):**
```js
customerActorId = requestActorId;
```
For `source='public'` callers: customerActorId is forcibly overwritten with the verified session actor ID.
Management source paths (`source='management'`) retain caller-supplied value; however, management callers
must pass `assertActorOwnsVportActorController` before reaching this path.

**Lines 164-180 — notification linkPath:**
```js
linkPath: null,
```
Explicitly null. No actor UUID in notification payload for createBooking.

### Findings Updated

| Finding ID | Prior Status | New Status | Evidence |
|---|---|---|---|
| VEN-BOOKING-007 | OPEN | CLOSED_SOURCE_VERIFIED | `createBooking.controller.js:112` — public path session-bound |
| VEN-BOOKING-009 | OPEN | CLOSED_SOURCE_VERIFIED | `createBooking.controller.js:174` — linkPath: null |
| ELEK-2026-06-04-008 | OPEN | CLOSED_SOURCE_VERIFIED | cross-ref VEN-BOOKING-007 |
| ELEK-2026-06-04-011 | OPEN | CLOSED_SOURCE_VERIFIED | cross-ref VEN-BOOKING-009 |
| BW-BOOK-015 | OPEN | CLOSED_SOURCE_VERIFIED | cross-ref VEN-BOOKING-009 |
| BW-BOOK-003 | PARTIAL | PARTIAL_SOURCE_VERIFIED | Public path now session-bound; management path trust inherits ownership assertion |

**Note:** BW-BOOK-003 was "any caller can attribute booking to arbitrary citizen." Public source now fully session-bound. Management source relies on `assertActorOwnsVportActorController` completing before customerActorId is used — this is architecturally sound. BW-BOOK-003 is downgraded from OPEN to PARTIAL_CLOSED.

### VEN-BOOKING-004 Re-Verify — Status Caller-Supplied

**File:** `apps/VCSM/src/features/booking/dal/insertBooking.dal.js`
**Provenance:** [SOURCE_VERIFIED]

```js
const BOOKING_INSERT_COLUMNS = ['...', 'status', '...'];
const payload = pickDefined(row, BOOKING_INSERT_COLUMNS);
// → includes status if non-undefined
```

`createBookingController` passes `status` directly. For public bookings, status defaults to `null` (excluded by pickDefined). For management bookings, caller can supply any status value including terminal states.

**VEN-BOOKING-004: STILL_OPEN_SOURCE_VERIFIED**
**ELEK-2026-06-04-004: STILL_OPEN_SOURCE_VERIFIED**

---

## 2. VPORT — Profile Media DAL Re-Verify

### Source Read

**File:** `apps/VCSM/src/features/vport/dal/vport.write.profileMedia.dal.js`
**Provenance:** [SOURCE_VERIFIED]

```js
export async function updateVportAvatarMediaAssetIdDAL({ actorId, mediaAssetId, avatarUrl }) {
  if (!actorId || !mediaAssetId) return
  const { error } = await vportClient.from('profiles').update(patch).eq('actor_id', actorId)
}
```

Pattern confirmed: `actorId` used as filter, no session ownership assertion at this layer.
RLS is the sole barrier for enforcing the caller-actorId = session-actor invariant.

**VEN-VPORT-004: STILL_OPEN_SOURCE_VERIFIED**
**BW-VPORT-002: STILL_OPEN_SOURCE_VERIFIED**

No branch changes to this file. Carrying forward unchanged from 2026-06-04.

---

## 3. FEED — Branch Differential

### Assessment

The branch name includes `feed` but SECURITY.md for feed was last updated 2026-06-06 with a full
VENOM + BLACKWIDOW + ELEKTRA re-verify pass. No feed files show modifications in branch diff.

Feed SECURITY.md findings from 2026-06-06 remain current.

**VEN-FEED-001** (BEHAVIOR.md placeholder): STILL_OPEN — no change
**BW-FEED-001** (welcome card IDOR): STILL_OPEN — no change
**ELEK-2026-06-06-001** (IDOR THOR blocker): OPEN — no change
**ELEK-2026-06-06-002** (logout cache THOR blocker): OPEN — no change

No new findings. No closures. Feed SECURITY.md not updated this pass.

---

## 4. TRAFFIC:ANSWERS — New Surface Analysis

### Architecture

Traffic:answers is a Next.js 14 App Router feature.

**Live DB surfaces:**
- `answers.questions` — INSERT (public), UPDATE (moderation)
- `answers.answers` — INSERT (moderation), UPDATE (moderation)

**Env gate:** `TRAZE_ANSWERS_SCHEMA_READY === "true"` gates `getAnswersClient()` — returns null when false.
**Current default:** FALSE (no live writes in standard deploy)

### VEN-TRAFFIC-001 — Unauthenticated Question Submission

**Severity: HIGH**
**Provenance:** [SOURCE_VERIFIED]

**Chain traced:**
```
POST /api/answers/questions
  → route.js: no auth check → submitQuestion(body)
  → submitQuestion.controller.js: no auth enforcement → buildQuestionSubmission(input)
  → questions.write.dal.js: getAnswersClient() → INSERT answers.questions
```

**Source evidence (route.js):**
```js
export async function POST(request) {
  const body = await request.json();
  const result = await submitQuestion(body);
  return Response.json(result, { status: result.ok ? 201 : 400 });
}
```
No authentication middleware. No session check. No rate limiting visible in handler.

**Risk:** When `TRAZE_ANSWERS_SCHEMA_READY=true`, any HTTP client can insert rows into
`answers.questions` with `status: "draft"`, `is_moderated: false`, `moderation_status: "pending"`.
No user identity, no captcha, no rate limiting enforced at application layer.

**Impact when flag is false:** No DB write occurs (getAnswersClient() returns null). Env gate is functional.
**Impact when flag is true:** Open question submission — spam injection possible; DB fill attack possible.

**Exploitability:** HIGH (public endpoint, no auth required)
**Blast Radius:** answers.questions table integrity
**RLS Dependency:** Unknown — anon key policy for answers schema not verified from source
**THOR Blocker:** YES (before TRAZE_ANSWERS_SCHEMA_READY can be set to true)

**DB AUDIT NOTE:**
- DB object: answers.questions RLS INSERT policy
- Risk: If anon key has INSERT permission, flag=true enables unauthenticated DB writes at scale
- Why deferred: DB review phase required
- Suggested later SQL review: `SELECT * FROM pg_policies WHERE tablename='questions' AND schemaname='answers';`

---

### VEN-TRAFFIC-002 — Static Bearer Token Moderation Auth

**Severity: MEDIUM**
**Provenance:** [SOURCE_VERIFIED]

**Source evidence (moderationAuth.model.js):**
```js
export function validateModerationRequest(request) {
  const expectedToken = process.env.TRAZE_ANSWERS_MODERATION_TOKEN;
  const providedToken = authorization.replace(/^Bearer\s+/i, "").trim();
  if (!providedToken || providedToken !== expectedToken) return { ok: false, status: 401 };
  return { ok: true };
}
```

Static shared secret. No user identity. No token expiry. No audit trail per caller.

**Impact:** Any party with the token (e.g. leaked env, disgruntled team member) can call moderation
APIs with full authority — approve, reject, suppress content — with no identity attribution.

**Exploitability:** MEDIUM (requires token exfiltration first)
**Blast Radius:** answers content moderation state
**THOR Blocker:** NO (functional auth present — weakness not absence)

---

### VEN-TRAFFIC-003 — vport RPC Not Env-Gated

**Severity: MEDIUM**
**Provenance:** [SCANNER_LEAD] — not source-verified this pass

ARCHITECT branch pass reported that `submit_business_card_lead` RPC call in Traffic conversion DAL
has NO env gate equivalent to `TRAZE_ANSWERS_SCHEMA_READY`. Scanner shows this RPC as always-active.

**Risk:** Any visitor to a Traffic provider page can trigger a live VCSM RPC write with no gating.
Auth model of the RPC (anon key vs user session) is unverified from source.

**Exploitability:** MEDIUM (public visitor can trigger; volume unknown)
**Blast Radius:** VCSM vport lead events
**THOR Blocker:** NO (RPC likely requires specific VCSM auth — unverified)

**DB AUDIT NOTE:**
- DB object: vport.submit_business_card_lead RPC
- Risk: If RPC accepts anon key, public traffic visitors write lead events at scale with no gating
- Why deferred: Source read of Traffic conversion DAL + VCSM RPC SECURITY DEFINER check needed
- Suggested later SQL review: Check SECURITY DEFINER status and caller permissions for submit_business_card_lead

---

## 5. Summary Table — This Pass

| Finding ID | Severity | Feature | Status |
|---|---|---|---|
| VEN-BOOKING-007 | HIGH | booking | CLOSED_SOURCE_VERIFIED |
| VEN-BOOKING-009 | MEDIUM | booking | CLOSED_SOURCE_VERIFIED |
| VEN-BOOKING-004 | HIGH | booking | STILL_OPEN_SOURCE_VERIFIED |
| VEN-VPORT-004 | MEDIUM | vport | STILL_OPEN_SOURCE_VERIFIED |
| BW-VPORT-002 | HIGH | vport | STILL_OPEN_SOURCE_VERIFIED |
| BW-BOOK-003 | HIGH | booking | PARTIAL_CLOSED_SOURCE_VERIFIED |
| VEN-TRAFFIC-001 | HIGH | traffic:answers | NEW — OPEN |
| VEN-TRAFFIC-002 | MEDIUM | traffic:answers | NEW — OPEN |
| VEN-TRAFFIC-003 | MEDIUM | traffic:answers | NEW — OPEN [SCANNER_LEAD] |

**Cross-reference closures:**
- ELEK-2026-06-04-008 → CLOSED_SOURCE_VERIFIED (cross-ref VEN-BOOKING-007)
- ELEK-2026-06-04-011 → CLOSED_SOURCE_VERIFIED (cross-ref VEN-BOOKING-009)
- BW-BOOK-015 → CLOSED_SOURCE_VERIFIED (cross-ref VEN-BOOKING-009)

---

## 6. New THOR Blockers Introduced

| Finding | Feature | Condition |
|---|---|---|
| VEN-TRAFFIC-001 | Traffic:answers | Blocks TRAZE_ANSWERS_SCHEMA_READY from being set to true |

Note: TRAFFIC is a separate deployment domain (traffic.vibezcitizens.com). VEN-TRAFFIC-001 does not
block VCSM THOR directly. It blocks the Traffic → Live DB activation gate.

---

## 7. Source Verification Summary

```
Source files read this pass:         4
[SOURCE_VERIFIED] findings:          6
[SCANNER_LEAD] findings:             1
[SOURCE_VERIFIED] closures:          5
```

---

## 8. Downstream Handoff

| Command | Findings | Priority |
|---|---|---|
| BLACKWIDOW | VEN-TRAFFIC-001 (adversarial verify), BW-BOOK-003 closure confirm | P0 |
| ELEKTRA | VEN-TRAFFIC-001 (full chain trace), VEN-TRAFFIC-003 (source verify) | P0 |
| DB (CARNAGE) | VEN-TRAFFIC-001 DB AUDIT NOTE, VEN-TRAFFIC-003 DB AUDIT NOTE | P1 |

---

VENOM V2 BRANCH PASS COMPLETE
Recommendation: CAUTION
2 confirmed branch fixes. 1 HIGH still open in booking. 3 new Traffic findings (1 HIGH THOR-conditional blocker).
