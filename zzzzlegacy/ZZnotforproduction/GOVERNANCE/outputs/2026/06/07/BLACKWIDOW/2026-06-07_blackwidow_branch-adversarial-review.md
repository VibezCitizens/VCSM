# BLACKWIDOW — Branch Adversarial Review
**Branch:** vport-booking-feed-security-updates
**Date:** 2026-06-07
**Application Scope:** VCSM + Traffic:answers
**VENOM Dependency Gate:** PASS — ZZnotforproduction/GOVERNANCE/outputs/2026/06/07/VENOM/2026-06-07_venom_branch-security-pass.md (0 days old)
**Recommendation:** FAIL — trust-boundary gaps remain; branch patches do not clear THOR gate

---

## Attack Surface Inventory

Branch-targeted surfaces (new or modified on `vport-booking-feed-security-updates`):

| Surface | File | VENOM Finding | BW Attack Focus |
|---|---|---|---|
| createBooking.controller.js management path | booking/controllers/ | VEN-BOOKING-007 PARTIAL | customerActorId injection on management source |
| publish.js session guard | notifications/ | VEN-NOTIFICATIONS-004 | actorId impersonation post-guard |
| vport.core.dal::updateVport | vport/dal/ | VEN-VPORT-002 | cross-actor updateVport via RLS dependence |
| vport.write.profileMedia.dal | vport/dal/ | VEN-VPORT-004 | media asset swap via no session check |
| feedWelcomeCard.dal::markWelcomeCard | feed/dal/ | BW-FEED-001 | onboarding state suppression |
| POST /api/answers/questions | Traffic | VEN-TRAFFIC-001 | question flood |
| moderateAnswer / moderateQuestion | Traffic | VEN-TRAFFIC-004 | moderation state machine replay |

---

## Adversarial Scenarios

---

### BW-BRANCH-001: Booking Management Source customerActorId Injection

```
OWNERSHIP BYPASS ATTEMPT
Target: createBooking.controller.js management path (source="owner"/"admin"/"import"/"sync")
Attack vector: Authenticated VPORT owner calls createBookingController({
  requestActorId: actorA_id,
  source: "owner",
  customerActorId: actorC_id,   ← foreign victim actor
  resourceId: ...,
  serviceId: ...,
  startsAt: ...,
  endsAt: ...
})
Result: BYPASSED
Evidence:
  Line 81-84: assertActorOwnsVportActorController verifies actorA owns the VPORT — PASS (intended check)
  Line 112: customerActorId = requestActorId ONLY when source === "public"
  Management sources: customerActorId flows through from caller param without rebinding
  insertBookingDAL receives customer_actor_id = actorC_id (victim)
  Booking appears in actorC's booking history; actorC receives booking notification
Controller gate: ABSENT for customerActorId (present for VPORT ownership only)
Severity: HIGH
Cross-ref: VEN-BOOKING-007 (PARTIAL), ELEK-2026-06-04-008
```

**Attack chain:** Actor A (VPORT owner) → assertActorOwnsVportActorController (verifies A owns VPORT) → insertBookingDAL(customer_actor_id = actorC) → booking attributed to innocent actorC without consent.

**Impact:** Cross-actor booking attribution. Victim receives an unwanted booking notification. If notification linkPath were not null, victim could also have a UUID exposed. With linkPath=null (patched), UUID exposure is closed, but the booking record itself still corrupts actorC's booking history.

**Note on VEN-BOOKING-007 CLOSED claim in prior SECURITY.md:** Prior session incorrectly marked VEN-BOOKING-007 as CLOSED_SOURCE_VERIFIED. The "management source ownership-asserted" claim was referring to VPORT ownership (assertActorOwnsVportActorController), not customerActorId ownership. VEN-BOOKING-007 must remain PARTIAL or OPEN for management sources.

---

### BW-BRANCH-002: Notifications Session Guard — actorId Impersonation Post-Guard

```
SESSION MUTATION ATTEMPT
Target: notifications/publish.js :: publishVcsmNotification({actorId, recipientActorId, ...})
Attack vector: Authenticated actor A calls with actorId = actorB (impersonating B as notification source)
Result: PARTIAL (app layer BYPASSED; DB trigger provides effective backstop)
Evidence:
  Lines 62-64: getSession() check — confirms session is non-null
  Session guard passes for any authenticated actor regardless of actorId param
  actorId parameter remains caller-supplied; no session.user cross-check exists
  publishEvent({ sourceActorId: actorB, ... }) fires if guard passes
  DB BEFORE INSERT trigger on notification.events enforces
    source_actor_id must match auth.uid() via vc.actor_owners
  → DB trigger blocks impersonation at persistence layer
Session binding: ABSENT at app layer / ENFORCED at DB layer
Severity: MEDIUM
Cross-ref: VEN-NOTIFICATIONS-004, BW-NOTI-005
```

**Assessment:** The new session guard is an authentication check (is anyone logged in?) but not an authorization check (is this person who they claim to be?). The DB trigger is the effective control. Finding VEN-NOTIFICATIONS-004 remains OPEN because the defense-in-depth at the app layer is absent.

---

### BW-BRANCH-003: vport updateVport Cross-Actor Write (RLS Conditional)

```
OWNERSHIP BYPASS ATTEMPT
Target: vport.core.dal::updateVport(vportId, patch)
Attack vector: Authenticated actor A calls updateVport(actorB_vportId, { name: "hijacked" })
Result: CONDITIONAL
Evidence:
  requireUser() call confirms session exists (PASS for any authenticated actor)
  .update(patch).eq("id", actorB_vportId) — no .eq("owner_user_id", user.id)
  RLS on vport.profiles UPDATE path: if policy enforces owner_user_id = auth.uid() → BLOCKED
  RLS absent or misconfigured: BYPASSED — name/slug/bio overwritten
Controller gate: ABSENT (requireUser() only, no ownership check)
Severity: HIGH (conditional — becomes hard THOR blocker if DB confirms RLS absent)
Cross-ref: VEN-VPORT-002, BW-VPORT-001
```

**DB Audit Note:** Confirm: `SELECT policyname, qual FROM pg_policies WHERE tablename='profiles' AND schemaname='vport' AND cmd='UPDATE'`

---

### BW-BRANCH-004: vport profileMedia DAL — Media Asset Swap Without Auth

```
OWNERSHIP BYPASS ATTEMPT
Target: vport.write.profileMedia.dal::updateVportAvatarMediaAssetIdDAL({actorId, mediaAssetId, avatarUrl})
Attack vector: Attacker calls with victim's actorId to replace victim's avatar
Result: CONDITIONAL
Evidence:
  No requireUser() call in DAL (confirmed SOURCE_VERIFIED)
  No session check in controller layer (controller is a thin pass-through)
  vportClient.from('profiles').update({avatar_media_asset_id: maliciousId}).eq('actor_id', victimId)
  RLS required: if vport.profiles UPDATE enforces actor_id ownership via auth.uid() → BLOCKED
  RLS absent: victim's avatar overwritten with attacker-controlled media asset
Controller gate: ABSENT
Session binding: ABSENT
Severity: HIGH (conditional)
Cross-ref: VEN-VPORT-004, BW-VPORT-002
```

---

### BW-BRANCH-005: Feed Welcome Card — Onboarding State Suppression

```
OWNERSHIP BYPASS ATTEMPT
Target: feed/dal::markWelcomeFeedCardSeenDAL({actorId: victimId})
Attack vector: Actor A suppresses actor B's onboarding welcome card
Result: CONDITIONAL
Evidence:
  ctrlMarkWelcomeCardSeen({ actorId }) — no session check, no requireUser()
  DAL uses public supabase client; actorId from caller
  Upsert on (actor_id=victimId, step_key='welcome_feed_card') with status='completed'
  RLS on vc.actor_onboarding_steps UPDATE: if present → BLOCKED; if absent → BYPASSED
  useFeedWelcomeCard hook passes actorId from props — hook doesn't bind to useIdentity() internally
Controller gate: ABSENT
Session binding: ABSENT at app layer
Severity: MEDIUM (limited blast radius — suppresses welcome card UI; no data exfiltration)
Cross-ref: BW-FEED-001, ELEK-2026-06-06-001
```

---

### BW-BRANCH-006: Traffic:answers — Moderation State Machine Bypass

```
MUTATION REPLAY ATTEMPT
Target resource: answers.answers row with moderation_status='approved'
Resource state at time of replay: already published (status='published', is_published=true)
Attack: Bearer token holder calls POST /api/answers/moderation/answers
  with { id: publishedAnswerId, action: "reject", note: "silently unpublishing content" }
Result: APPLIED
Evidence:
  validateModerationRequest: bearer token PASS
  moderateAnswer({ id: publishedAnswerId, action: "reject" })
  valuesByAction["reject"] = { status: "archived", is_published: false, moderation_status: "rejected", ... }
  updateAnswerModerationRow: .update(values).eq("id", id)
  No prior-state check; no .eq("moderation_status", "pending") guard
  Answer silently unpublished; published_at/moderated_at overwritten
State check: ABSENT
Severity: MEDIUM
Cross-ref: VEN-TRAFFIC-004 (NEW from this session)
```

---

### BW-BRANCH-007: Traffic:answers — Question Flood (Confirm from Prior Session)

```
RUNTIME ABUSE ATTEMPT
Target: POST /api/answers/questions
Actor role used: Anonymous (no auth required)
Expected access: Rate-limited
Result: ALLOWED (when TRAZE_ANSWERS_SCHEMA_READY=true)
Evidence:
  Route handler: no middleware, no rate limiting
  buildQuestionSubmission: validates title only (non-empty + sluggable)
  createQuestionRow: unbounded INSERT with any valid body
  answers.questions fills with pending-status spam
  Moderation queue flooded; DB resources exhausted over time
Privilege gate: ABSENT (feature flag is only gate)
Severity: HIGH (when flag=true)
Cross-ref: VEN-TRAFFIC-001, BW-TRAFFIC-001 (confirmed by prior session), BW-TRAFFIC-002
```

---

## Carry-Forward Adversarial Results (Confirmed from Prior Runs)

All prior BLACKWIDOW findings from 2026-06-04 (booking, vport, notifications) and 2026-06-06 (feed) carry forward unchanged. Key blockers:

| Finding ID | Feature | Result | Status |
|---|---|---|---|
| BW-BOOK-009 | booking | BYPASSED — onConflict:id allows cross-actor availability rule hijack | OPEN |
| BW-BOOK-010 | booking | BYPASSED — same vector for availability exceptions | OPEN |
| BW-BOOK-012 | booking | BYPASSED — confirmBookingController no terminal-state gate | OPEN |
| BW-NOTI-001 | notifications | BYPASSED — inbox mutations accept arbitrary recipientId | OPEN |
| BW-VPORT-001 | vport | BYPASSED (app) / CONDITIONAL (DB) | OPEN |
| BW-VPORT-002 | vport | BYPASSED (app) / CONDITIONAL (DB) | OPEN |
| BW-FEED-001 | feed | BYPASSED (app) / CONDITIONAL (DB) | OPEN |

---

## New Findings This Pass

| Finding ID | Feature | Severity | Result | Status |
|---|---|---|---|---|
| BW-BRANCH-001 | booking | HIGH | BYPASSED — management customerActorId injection confirmed | OPEN |
| BW-BRANCH-002 | notifications | MEDIUM | PARTIAL — session guard: auth check only, not actorId binding | OPEN |
| BW-BRANCH-003 | vport | HIGH | CONDITIONAL — updateVport cross-actor (DB-dependent) | OPEN |
| BW-BRANCH-004 | vport | HIGH | CONDITIONAL — profileMedia DAL cross-actor (DB-dependent) | OPEN |
| BW-BRANCH-005 | feed | MEDIUM | CONDITIONAL — welcome card onboarding suppression (DB-dependent) | OPEN |
| BW-BRANCH-006 | Traffic | MEDIUM | APPLIED — moderation state machine bypass confirmed | OPEN |
| BW-BRANCH-007 | Traffic | HIGH | ALLOWED — question flood when flag=true (cross-confirms BW-TRAFFIC-001/002) | OPEN |

---

## THOR Gate Determination

**BLACKWIDOW Recommendation: FAIL**

BLACKWIDOW cannot clear THOR for this branch. Critical and HIGH findings remain unresolved. DB-conditional blockers require DB verification phase before THOR eligibility can be assessed.

Release blockers requiring action before THOR assessment:
1. VEN-BOOKING-001 (CRITICAL): updateBookingStatusDAL no owner filter
2. VEN-BOOKING-002 / VEN-BOOKING-003 (CRITICAL): dead DALs with undefined supabase
3. BW-BRANCH-001 (HIGH): management source customerActorId injection
4. BW-NOTI-001 (CRITICAL): inbox state mutations accept arbitrary recipientId
5. BW-BRANCH-003/004 (HIGH conditional): vport RLS must be DB-verified
6. VEN-TRAFFIC-001 / BW-BRANCH-007 (HIGH): question flood when flag=true

---

## DB Audit Notes

| DB Object | BW Finding | Action Required |
|---|---|---|
| vport.profiles UPDATE RLS | BW-BRANCH-003, BW-BRANCH-004 | Verify UPDATE policy enforces owner_user_id = auth.uid() |
| vc.actor_onboarding_steps UPDATE RLS | BW-BRANCH-005 | Verify UPDATE policy enforces actor_id = auth.uid() |
| notification.inbox_items UPDATE RLS | BW-NOTI-001, BW-NOTI-004 | Verify UPDATE policy enforces recipient_actor_id ownership |
| answers.questions INSERT policy | BW-BRANCH-007 | Verify anon key can only insert with status=draft,is_published=false |
