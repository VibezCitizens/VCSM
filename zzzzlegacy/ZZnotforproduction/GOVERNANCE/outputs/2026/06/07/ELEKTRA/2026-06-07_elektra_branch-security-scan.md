# ELEKTRA Security Report — Branch Precision Scan
**Date:** 2026-06-07
**Branch:** vport-booking-feed-security-updates
**Scope:** VCSM + TRAFFIC
**Reviewer:** ELEKTRA
**Scan Trigger:** Blue Team pipeline (ARCHITECT → VENOM → BLACKWIDOW → ELEKTRA)
**VENOM Upstream:** ZZnotforproduction/GOVERNANCE/outputs/2026/06/07/VENOM/2026-06-07_venom_branch-security-pass.md
**BLACKWIDOW Upstream:** ZZnotforproduction/GOVERNANCE/outputs/2026/06/07/BLACKWIDOW/2026-06-07_blackwidow_branch-adversarial-review.md
**Findings Summary:** 1 HIGH | 3 MEDIUM | 0 LOW | 0 INFO
**False Positives Rejected:** 1
**Closures Confirmed:** 2

---

## Executive Summary

Branch `vport-booking-feed-security-updates` introduces session-binding patches to booking (public source) and notifications (publish.js). ELEKTRA confirms those patches are effective for their target paths. The booking management source customerActorId injection vector remains fully open. Traffic:answers introduces a new moderation state machine gap (no terminal-state guard). All prior booking ELEK findings from 2026-06-04 carry forward unchanged.

---

## Closure Verification

### ELEK-2026-06-04-011 — CLOSED [SOURCE_VERIFIED]

**Prior finding:** createBookingController line 138 stores raw UUID in notification linkPath
**Closure evidence:** apps/VCSM/src/features/booking/controllers/createBooking.controller.js — `publishVcsmNotification({…, linkPath: null})` — linkPath is `null` (not a UUID string)
**Chain status:** Sink is now null. Attack vector eliminated.
**Result:** CLOSED_SOURCE_VERIFIED

---

### VEN-BOOKING-007 public-source partial — CONFIRMED PARTIAL

**Prior concern:** customerActorId caller-supplied for all sources
**Branch fix:** `if (source === 'public') { customerActorId = requestActorId }` at line 112
**ELEK chain verification:**
- Source: `customerActorId` parameter → createBookingController(input)
- Public path: customerActorId overwritten with requestActorId (session-derived) → CLOSED for public source ✅
- Management path: customerActorId flows through unchanged → OPEN
**ELEK-2026-06-04-008:** STILL OPEN for management source. Public source: CLOSED.

---

## New Findings

---

### ELEK-2026-06-07-B001 — Booking: Management Source customerActorId Injection

```
SECURITY FINDING

- Finding ID:         ELEK-2026-06-07-B001
- Title:              Booking management source allows arbitrary customer attribution
- Category:           IDOR/BOLA
- Severity:           HIGH
- Status:             Open
- Scope:              VCSM
- Location:           apps/VCSM/src/features/booking/controllers/createBooking.controller.js:23,112-145
- Source:             customerActorId parameter in createBookingController input destructuring
- Sink:               insertBookingDAL({ ..., customer_actor_id: customerActorId }) — vport.bookings INSERT
- Trust Boundary:     createBookingController input validation (lines 80-145)
- Impact:             Authenticated VPORT owner can attribute a booking to any citizen (actorC)
                      without actorC's knowledge or consent. Booking appears in actorC's booking
                      history. actorC receives an unwanted booking notification.
- Evidence:
    Line 23: function createBookingController({ …, customerActorId, source, … })
    Line 96-108: kind gate (requestActor.kind === "user") — verifies CALLER is citizen
    Line 81-84: assertActorOwnsVportActorController — verifies CALLER owns the VPORT
    Line 112: if (source === 'public') { customerActorId = requestActorId } — PUBLIC ONLY
    Management sources ("owner","admin","import","sync"): customerActorId passes through unchanged
    Line ~145: insertBookingDAL({ ..., customer_actor_id: customerActorId })
- Reproduction Steps:
    1. Authenticate as VPORT owner (actorA)
    2. Call createBookingController with:
       source: "owner"
       customerActorId: <any valid citizen actorId (actorC)>
       resourceId/serviceId/startsAt/endsAt: valid booking parameters
    3. Booking is created with customer_actor_id = actorC
    4. actorC's booking list shows an unexpected booking
    5. actorC receives a notification about a booking they never made
- Existing Defense:   assertActorOwnsVportActorController verifies caller owns VPORT (not related to customerActorId)
- Why Defense Is Insufficient:
    assertActorOwnsVportActorController only verifies that the CALLER owns the VPORT being booked with.
    It does not verify that customerActorId is the caller themselves or a consenting party.
    No ownership or consent check on the customer side for management sources.
- Recommended Fix:   For management sources, validate that customerActorId either:
    (a) matches requestActorId (staff self-books), OR
    (b) is a verified active customer of the VPORT (check actor_owners or a customer relationship table)
    At minimum: add a getActorByIdDAL check to confirm customerActorId is a valid, non-void user-kind actor
- Suggested Patch:
    // In createBookingController, management source path:
    if (source !== 'public') {
      if (!customerActorId || customerActorId === requestActorId) {
        // staff self-booking: bind to caller
        customerActorId = requestActorId
      } else {
        // booking on behalf of a specific customer: verify customer is a valid citizen
        const customerActor = await getActorByIdDAL({ actorId: customerActorId })
        if (!customerActor || customerActor.kind !== 'user' || customerActor.void) {
          throw new Error('createBookingController: invalid customerActorId for management source')
        }
      }
    }
- Follow-up Command:  DB (verify actor_owners query for management source), SPIDER-MAN (regression)
```

---

### ELEK-2026-06-07-B002 — Traffic: Moderation State Machine — No Terminal-State Guard

```
SECURITY FINDING

- Finding ID:         ELEK-2026-06-07-B002
- Title:              Traffic moderation allows re-moderation of already-published content
- Category:           Privilege Escalation / Missing State Machine Guard
- Severity:           MEDIUM
- Status:             Open
- Scope:              TRAFFIC
- Location:
    apps/Traffic/src/features/answers/controllers/moderateAnswers.controller.js:77-109
    apps/Traffic/src/features/answers/dal/moderationAnswers.dal.js:66-79
    apps/Traffic/src/features/answers/dal/moderationQuestions.dal.js:40-53
- Source:             { id, action } from POST request body
- Sink:               updateAnswerModerationRow({ id, values }) → .update(values).eq("id", id)
                      updateQuestionModerationRow({ id, values }) → .update(values).eq("id", id)
- Trust Boundary:     validateModerationRequest (bearer token check) + action allowlist in valuesByAction
- Impact:
    Any bearer token holder can:
    1. Re-reject a published answer (content silently removed from public view)
    2. Re-publish a rejected answer (rejected content reactivated without re-review)
    3. Overwrite published_at / moderated_at timestamps (audit trail corruption)
    No content history is preserved; the original moderation decision is overwritten.
- Evidence:
    moderateAnswer controller line 80-97: valuesByAction dict maps action → update values
    Line 103: if (!id || !values) return error  ← action validated, but not prior state
    moderationAnswers.dal.js line 71-76:
      .update(values).eq("id", id)   ← unconditional update, no state pre-check
    No .eq("moderation_status", "pending") guard anywhere in the chain
- Reproduction Steps:
    1. Obtain valid TRAZE_ANSWERS_MODERATION_TOKEN bearer token
    2. Confirm an answer is published: moderation_status="approved", status="published"
    3. POST /api/answers/moderation/answers with { id: answerId, action: "reject" }
    4. Answer is archived: status="archived", is_published=false, moderation_status="rejected"
    5. Answer disappears from public view without any audit record of the change
- Existing Defense:   Bearer token auth (validates requester), action allowlist (prevents SQL injection)
- Why Defense Is Insufficient:
    Auth controls WHO can call the endpoint; action allowlist controls WHAT action is taken.
    Neither controls WHEN (current state of the resource). Terminal state is not enforced.
- Recommended Fix:
    Option A (preferred): Fetch current answer/question status before updating; throw if already in terminal state:
      const current = await getAnswerByIdDAL(id)
      if (current.moderation_status !== 'pending') throw new Error('Already moderated')
    Option B: Add .eq("moderation_status", "pending") to the DAL UPDATE call to make it a conditional update:
      .update(values).eq("id", id).eq("moderation_status", "pending")
    Option C: Separate the "unpublish" and "reject" operations; make "approved" a terminal state.
- Suggested Patch (Option B — minimal change):
    // In moderationAnswers.dal.js updateAnswerModerationRow:
    const { data, error } = await client
      .schema("answers")
      .from("answers")
      .update(values)
      .eq("id", id)
      .eq("moderation_status", "pending")   // ← add this guard
      .select(ANSWER_PROJECTION)
      .single();
    // (and equivalent for moderationQuestions.dal.js updateQuestionModerationRow)
- Follow-up Command:  BLACKWIDOW (confirm guard effectiveness), DB (verify RLS on answers schema)
```

---

### ELEK-2026-06-07-B003 — Notifications: Session Guard Partial Fix — actorId Impersonation Channel Open

```
SECURITY FINDING

- Finding ID:         ELEK-2026-06-07-B003
- Title:              publish.js session guard addresses auth but not actor identity binding
- Category:           Auth Bypass (partial)
- Severity:           MEDIUM
- Status:             Open (DB trigger is effective backstop; app layer gap remains)
- Scope:              VCSM
- Location:           apps/VCSM/src/features/notifications/publish.js:55-75
- Source:             actorId parameter in publishVcsmNotification({ actorId, recipientActorId, ... })
- Sink:               publishEvent({ sourceActorId: actorId, ... }) → notification.events INSERT
- Trust Boundary:     publish.js pre-publish checks
- Impact:
    Authenticated actor A can publish a notification with sourceActorId = actorB.
    The notification appears to originate from actorB. Recipients see actorB as the sender.
    At persistence layer: DB BEFORE INSERT trigger on notification.events enforces source_actor_id
    ownership via vc.actor_owners — so impersonation is blocked at DB if trigger is correct.
    App-layer gap means: if DB trigger ever has a bug, bypass, or is disabled, the app layer
    provides zero protection.
- Evidence:
    publish.js lines 62-64:
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return false  ← auth check only
    actorId at line ~57 (parameter): not cross-checked against session.user.id
    publishEvent called with { sourceActorId: actorId }
- Existing Defense:   DB BEFORE INSERT trigger (TICKET-ARCH-NOTI-SESSION-001)
- Why Defense Is Insufficient:
    Defense-in-depth principle: app layer should independently enforce actorId = session.user.
    Single DB trigger as sole app-identity control violates layered security.
    If trigger is bypassed, disabled, or has a defect, impersonation succeeds silently.
- Recommended Fix:
    Cross-check actorId against session.user at app layer:
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return false
      // Derive actorId from session — don't trust caller-supplied value
      const sessionActorId = session.user.id   // or look up via actor_owners
      if (actorId && actorId !== sessionActorId) {
        // caller is impersonating — reject or use session-derived actorId
        return false
      }
    Alternatively: remove actorId from the publishVcsmNotification parameter surface entirely;
    derive it from session inside publish.js.
- Suggested Patch (surgical):
    // publish.js after getSession():
    const sessionUserId = session.user?.id
    if (!sessionUserId) return false
    // Verify actorId belongs to session user via actor_owners lookup
    // (or: derive actorId from session user directly)
- Follow-up Command:  DB (confirm BEFORE INSERT trigger correctness), SPIDER-MAN (regression test)
```

---

## False Positive Rejected

```
FALSE POSITIVE REJECTED

- Candidate:        vport.core.dal::softDeleteVport no requireUser() — unauthenticated delete
- Location:         apps/VCSM/src/features/vport/dal/vport.core.dal.js:231-246
- Rejection reason: The RPC soft_delete_vport is expected to enforce AUTH_REQUIRED internally.
                    RPC ownership enforcement is the designed control. The finding is not a false
                    positive — it is a CONDITIONAL risk (documented as VEN-VPORT-003 / BW-VPORT).
                    Not elevated to CRITICAL at ELEKTRA because BLACKWIDOW confirmation of bypass
                    requires DB-level verification. Deferred to DB phase.
- Chain gap:        Sink (what RPC does with unauthenticated call) — cannot verify from source
- Notes:            DB phase must inspect soft_delete_vport RPC body for AUTH_REQUIRED enforcement
```

---

## Suggested Patch Queue

| # | Finding ID | Title | Severity | Layer to Patch | Complexity | Requires DB Change |
|---|---|---|---|---|---|---|
| 1 | ELEK-2026-06-07-B001 | Booking management source customerActorId injection | HIGH | Controller | SIMPLE | NO |
| 2 | ELEK-2026-06-07-B002 | Traffic moderation state machine gap | MEDIUM | DAL | SIMPLE | NO |
| 3 | ELEK-2026-06-07-B003 | Notifications actorId binding at publish layer | MEDIUM | Service/Adapter | MODERATE | NO |
| 4 | ELEK-2026-06-04-008 | Management source customerActorId (prior — still open) | HIGH | Controller | SIMPLE | NO |
| 5 | ELEK-2026-06-04-001/002 | Availability rule/exception cross-actor hijack | HIGH | DAL (onConflict scope) | MODERATE | NO |
| 6 | ELEK-2026-06-04-003 | confirmBookingController no terminal-state gate | HIGH | Controller | SIMPLE | NO |

---

## Required Follow-up Commands

| Command | Reason | Status |
|---|---|---|
| DB | Verify vport.profiles RLS UPDATE, notification.inbox_items RLS, soft_delete/restore_vport RPCs | PENDING |
| SPIDER-MAN | Add regression tests for booking management source, moderation state machine, session guard | PENDING |
| THOR | Release gate evaluation — multiple CRITICAL + HIGH open findings block release | PENDING |

---

## THOR Release Gate Assessment

**ELEKTRA Recommendation: FAIL**

CRITICAL blockers: VEN-BOOKING-001, VEN-BOOKING-002, VEN-BOOKING-003, BW-NOTI-001
HIGH blockers: ELEK-2026-06-07-B001, ELEK-2026-06-04-001 through 008 (various booking gaps), VEN-TRAFFIC-001

Branch patches have partially addressed two findings (VEN-BOOKING-009 CLOSED, VEN-BOOKING-007 PARTIAL for public source). Branch is not THOR-ready.
