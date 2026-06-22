# BLACKWIDOW Runtime Adversarial Report

**Date:** 2026-05-27
**Scope:** VCSM
**Reviewer:** BLACKWIDOW
**Environment:** Repository source — adversarial simulation (non-destructive)
**Governance Status:** DRAFT
**VENOM Cross-Reference:** `2026-05-10_venom-robin_barbershop-vport.md`

---

## Attack Surface Summary

| Surface | Files Reviewed | Attack Scenarios Run |
|---|---|---|
| Publish controllers (portfolio/hours) | 2 | Ownership bypass, null injection, self-shortcut |
| Join/QR join controllers | 2 | Token replay, race condition, DAL state guard |
| Team controllers (invite/request) | 2 | Ownership confusion, decline path bypass |
| Leads controller | 1 | PII ownership enforcement |
| Ownership assertion primitive | 1 | Self-shortcut, kind bypass |
| Join invite DAL | 1 | Mutation replay, state machine gaps |
| Notification linkPath | 1 | Raw ID exposure, trust escalation |
| QR URL builders | 1 | UUID leakage enforcement |
| Flyer view | 1 | UUID in printed QR guard |
| Public details DAL | 1 | Internal ID leakage (VB-02/VB-03 re-test) |

---

## Simulated Threat Scenarios

1. **Publish system post as unauthorized actor** (targets VB-01/VB-05) 
2. **Self-shortcut bypass in assertActorOwnsVportActorController** (new)
3. **QR token replay / mutation replay in acceptJoinResourceDAL** (new)
4. **Decline team request without session ownership** (new)
5. **vport_id / is_deleted exposure re-verification** (VB-02/VB-03 retests)
6. **Notification link raw actorId exposure** (new)
7. **UUID in printed QR code** (VB-004 retest)

---

## Ownership Bypass Results

### SCENARIO 1 — Publish Barbershop System Post as Unauthorized Actor

**VENOM cross-reference:** VB-01, VB-05

**Attack simulation:**
```
Attacker is authenticated as Actor A (user-kind, valid session).
Target: Actor B = a barbershop VPORT the attacker does NOT own.
Attack: call publishBarbershopPortfolioUpdateAsPostController({
  actorId: ActorB.actorId,
  callerActorId: ActorA.actorId,
  portfolioTitle: "fake post",
  mediaUrl: "http://attacker.com/img.jpg"
})
Expected: throw — "Actor does not own this vport actor"
```

**Result: BLOCKED ✓**

`assertActorOwnsVportActorController` is now present at line 25-28 of the portfolio controller and line 50-53 of the hours controller. The controller throws before `createSystemPost` is reached. VB-01 and VB-05 are **HARDENED**.

OWNERSHIP BYPASS ATTEMPT
- Target: `publishBarbershopPortfolioUpdateAsPostController`, `publishBarbershopHoursUpdateAsPostController`
- Attack vector: pass a barbershop actorId the caller does not own as `actorId`, provide own `callerActorId`
- Result: **BLOCKED**
- Evidence: `assertActorOwnsVportActorController` present before `createSystemPost`; DB query to `actor_owners` via `readActorOwnerLinkByActorAndUserProfileDAL` — ownership not found → throws
- Controller gate: **PRESENT**
- Severity: N/A — HARDENED

---

### SCENARIO 2 — Self-Shortcut Bypass in Ownership Gate

**Attack simulation:**
```
Attacker supplies requestActorId === targetActorId.
assertActorOwnsVportActorController line 15:
  if (String(requestActorId) === String(targetActorId)) {
    return { ok: true, mode: "self" };
  }
This skips the DB actor_owners query entirely.
Attack: call any controller using assertActorOwnsVportActorController with
  callerActorId = targetActorId (both equal to the VPORT actorId)
```

**Result: PARTIAL**

The self-shortcut is intended for an actor managing their own resource (e.g., a VPORT accepting its own join). However, the shortcut skips:
- the `requesterActor.kind === "user"` check
- the `actor_owners` DB query

If any call site accidentally passes `targetActorId` as both parameters (e.g., during VPORT-to-VPORT operations), a non-owner VPORT actor receives owner-level access without DB verification.

**Current call sites reviewed:** All 9 call sites pass `callerActorId` sourced from `identity?.actorId ?? null` (user-kind actor from session). This prevents the shortcut from being exploited under normal conditions. However, the gate design is structurally weak — a future call site that passes the wrong actorId would bypass DB verification silently.

OWNERSHIP BYPASS ATTEMPT
- Target: `assertActorOwnsVportActorController` line 15
- Attack vector: requestActorId === targetActorId to bypass actor_owners DB check
- Result: **PARTIAL** — not directly exploitable at current call sites, but no structural guard exists
- Evidence: Line 15 skips both kind check and DB query on self-match; kind check at line 24 is only reached after self-shortcut fails
- Controller gate: **WEAK** — self-shortcut precedes kind validation
- Severity: MEDIUM

---

## Session Mutation Results

No direct session mutation scenarios exploited in this review. Session binding is enforced via `identity?.actorId` from `useIdentity()` at all hook call sites. `callerActorId` is never accepted from client-supplied URL parameters alone — it is always resolved from the Supabase session identity.

SESSION MUTATION ATTEMPT
- Target: All barbershop controller call sites
- Attack vector: inject stale or spoofed callerActorId via URL params
- Result: **BLOCKED**
- Evidence: All hooks source `viewerActorId = identity?.actorId ?? null` from session; null callerActorId throws at controller entry
- Session binding: **ENFORCED**
- Severity: N/A

---

## Runtime Abuse Results

### SCENARIO 3 — Decline Team Request Without Session Ownership

**Attack simulation:**
```
Attacker knows:
  - barberVportActorId (VPORT UUID — visible in notification linkPath)
  - resourceId (UUID of the pending team request)
Attacker calls:
  declineTeamRequestController(barberVportActorId, resourceId)
Controller checks:
  isInvitedBarber = String(barberVportActorId) === String(resource.member_actor_id)
  → TRUE if attacker supplies correct barber VPORT ID
  → proceeds to declineTeamRequestDAL with no further session ownership check
```

**Result: PARTIAL**

The `isInvitedBarber` path in `declineTeamRequestController` skips all session ownership verification. The controller only verifies that the supplied `callerActorId` matches `resource.member_actor_id`. No assertion is made that the authenticated session user actually owns the barber VPORT being used as the caller identity.

**Evidence:**
```js
// vportTeamInvite.controller.js lines 41-43
const isInvitedBarber =
  resource.member_actor_id && String(callerActorId) === String(resource.member_actor_id);
if (!isInvitedBarber) {
  // ownership check — only reached if NOT the invited barber
  await assertActorOwnsVportActorController({ requestActorId: callerActorId, targetActorId: vportActorId });
}
return declineTeamRequestDAL(resourceId, resource.meta);
```

The `decline` callback in `useBarberTeamRequests` passes `barberVportActorId` (from URL params) as `callerActorId`, not `viewerActorId`. The controller never receives the session user's actorId for the decline path, so it cannot verify the chain: `session user → owns → barber VPORT`.

**Residual mitigation:** `fetchPendingTeamRequestsForBarberDAL` is called inside `getBarberTeamRequestsController`, which does enforce ownership. An attacker must first successfully enumerate the resourceId — which requires owning the barber VPORT. However, resourceIds are also embedded in notification payloads (`objectId` field), which may surface them without ownership.

RUNTIME ABUSE ATTEMPT
- Target: `declineTeamRequestController` — `isInvitedBarber` path
- Actor role used: barber VPORT actor (VPORT-kind, non-user)
- Expected access: DENIED without session ownership verification
- Result: **PARTIAL** — proceeds if caller supplies matching barberVportActorId and resourceId; no session check
- Evidence: `callerActorId` in decline path is the VPORT actorId, not the viewer's user actorId; no `assertActorOwnsVportActorController` on the `isInvitedBarber=true` branch
- Privilege gate: **WEAK** — hook-layer isOwner gate is the only protection; controller does not enforce
- Severity: MEDIUM

---

### SCENARIO 4 — Accept Path vs Decline Path Asymmetry

The `accept` path in `useBarberTeamRequests` passes `viewerActorId` (user-kind) to `acceptTeamRequestController`. The `decline` path passes `barberVportActorId` (VPORT-kind) to `declineTeamRequestController`. These are structurally inconsistent.

For accept: controller calls `assertActorOwnsVportActorController({ requestActorId: viewerActorId, targetActorId: resource.member_actor_id })` — full DB verification ✓
For decline: controller relies on string comparison `callerActorId === resource.member_actor_id` — no DB verification ✗

RUNTIME ABUSE ATTEMPT
- Target: `useBarberTeamRequests.decline` → `declineTeamRequestController`
- Actor role used: viewerActorId (user) passed for accept; barberVportActorId (VPORT) passed for decline
- Expected access: symmetric ownership verification on both paths
- Result: **PARTIAL** — asymmetric — accept has full DB verification, decline does not
- Evidence: Hook line 43: `acceptTeamRequestController(viewerActorId, ...)` vs line 57: `declineTeamRequestController(barberVportActorId, ...)`
- Privilege gate: **WEAK on decline path**
- Severity: MEDIUM

---

## RLS Verification Results

### VB-03 Retest — is_deleted / is_active Exposure

**Result: BYPASSED (still present)**

`fetchVportPublicDetailsByActorId` at `apps/VCSM/src/features/profiles/dal/vportPublicDetails.read.dal.js` still selects `is_active` and `is_deleted` and includes both in the response object (line 58 returns `is_active: newData.is_active ?? null`). The VENOM recommendation to add `.eq('is_deleted', false)` filter was not applied. A deleted VPORT with `is_deleted: true` is still returned to the public read surface.

**Simulation:** Query a soft-deleted barbershop VPORT's actorId via the public profile route. The DAL returns `is_deleted: true` in the response, exposing moderation state to any client reading the network response.

RLS VERIFICATION ATTEMPT
- Table / View: `vport.profiles` via `fetchVportPublicDetailsByActorId`
- Attack vector: query a deleted VPORT; inspect response for `is_deleted` field
- RLS status: **ASSUMED** — no code-level filter on `is_deleted`; RLS may or may not hide deleted records
- Result: **EXPOSED** — `is_deleted` is selected and returned at line 18 of the DAL and at line 58 of the response object
- Evidence: DAL select includes `is_deleted` explicitly; response returns `is_active: newData.is_active ?? null`; no `.eq('is_deleted', false)` filter present
- Severity: LOW

---

## Viewer Context Fuzz Results

### Null callerActorId injection

**Attack:** Pass `callerActorId: null` to any publish controller.
**Result: BLOCKED** — both publish controllers throw `"publishBarbershopPortfolioUpdateAsPost: callerActorId required"` at line 23 / `"publishBarbershopHoursUpdateAsPost: callerActorId required"` at line 48 before reaching the ownership assertion.

### Non-existent actorId injection

**Attack:** Pass a fabricated UUID as `callerActorId` to `assertActorOwnsVportActorController`.
**Result: BLOCKED** — `getActorByIdDAL` returns null → throws `"Requester actor not found."` at line 20-22.

### VPORT-kind actor as caller

**Attack:** Pass a VPORT-kind actorId as `callerActorId` to `assertActorOwnsVportActorController`.
**Result: BLOCKED (conditionally)** — After kind check at line 24: `if (requesterActor.kind !== "user") throw "Only actor owners can manage this booking resource."` This blocks VPORT-kind callers on the main path. EXCEPTION: the self-shortcut at line 15 fires first — if `requestActorId === targetActorId`, VPORT-kind actors bypass the kind check.

VIEWER CONTEXT FUZZ ATTEMPT
- Target: `assertActorOwnsVportActorController`
- Injected context: null, non-existent UUID, VPORT-kind actorId
- Expected result: ERROR / DENY
- Actual result: null → throw ✓ | non-existent → throw ✓ | VPORT-kind → throw ✓ EXCEPT when self-shortcut fires
- Context validation: **ENFORCED** on main path, **WEAK** on self-shortcut path
- Severity: LOW (self-shortcut not currently exploitable; documented as hardening gap)

---

## Mutation Replay Results

### SCENARIO 5 — QR Token Replay via acceptJoinResourceDAL

**Attack simulation:**
```
Step 1: Actor A scans a barbershop QR, completes join flow.
  → acceptJoinResourceDAL(token, actorAVportId, { join_token_used_at: now })
  → resource.meta.status = "linked", resource.member_actor_id = actorAVportId

Step 2: Attacker replays the same token immediately (race condition or after linked):
  → Token is no longer "pending_onboarding" per UI check in loadQrJoin
  → loadQrJoin returns null for non-pending_onboarding status → hook shows error ✓

BUT: acceptJoinResourceDAL itself has NO state check:
  → If called directly, it will overwrite member_actor_id with a new actorId
  → The DAL reads current meta but does not assert status === "pending_onboarding"
```

**Result: PARTIAL**

The UI/hook layer blocks replay via `loadQrJoin` status check and the hook's `join_token_used_at` / `member_actor_id` guards. However, the controller layer (`acceptQrJoin`) and DAL (`acceptJoinResourceDAL`) do not enforce the state machine. RLS policies at the DB level are the only remaining guard.

Additionally, a race condition is possible: two simultaneous requests both read the resource before either writes `join_token_used_at`, both pass the hook-layer check, and both call `acceptJoinResourceDAL`. The last write wins — potentially overwriting a legitimate acceptance with an attacker's `barberVportActorId`.

**Evidence:**
```js
// joinInvite.dal.js — acceptJoinResourceDAL
// No status assertion before update:
const { data, error } = await vportSchema
  .from("resources")
  .update({ member_actor_id: barberVportActorId, is_active: true, meta: { ...status: "linked" } })
  .eq("id", resourceId)  // ← no .eq("meta->status", "pending_onboarding") guard
  .select(RESOURCE_COLS)
  .single();
```

MUTATION REPLAY ATTEMPT
- Target resource: `vport.resources` — QR join resource
- Resource state at time of replay: "linked" (already accepted)
- Result: **PARTIAL** — hook layer blocks; controller and DAL do not; race window exists
- Evidence: `acceptJoinResourceDAL` at `joinInvite.dal.js` has no state machine guard; `.update()` fires unconditionally on resourceId match
- State check: **ABSENT** at controller and DAL layers
- Severity: HIGH

---

### SCENARIO 6 — Duplicate Invite Accept (Invite Flow)

`autoResumeInviteOnboarding` calls `acceptJoinResourceDAL(token, vportResult.actorId)` without a state check. Same vulnerability as Scenario 5 — a timing window exists during onboarding where the invite can be accepted twice if the user restarts the flow.

MUTATION REPLAY ATTEMPT
- Target: `autoResumeInviteOnboarding` → `acceptJoinResourceDAL`
- Result: **PARTIAL** — same structural gap as Scenario 5
- State check: **ABSENT**
- Severity: MEDIUM

---

## Hydration Poisoning Results

No specific barbershop hydration poisoning scenarios identified. The hydration store is used in `findEligibleBarbersController` (for barber discovery) and `BarberTeamRequestsScreen` (for shop avatar). Both use `hydrateAndReturnSummaries` / `hydrateActorsByIds`, which key summaries by actorId. No client-provided actor summary injection paths observed in the barbershop surface.

HYDRATION POISONING ATTEMPT
- Target: hydration store, `useActorSummary`
- Injected state: N/A — no client-side injection path found in barbershop module
- Result: **BLOCKED** (no injection path present)
- Severity: INFO

---

## Cross-Feature Abuse Results

The barbershop module uses cross-feature imports correctly:
- `assertActorOwnsVportActorController` is imported via the approved `booking.adapter.js` (§5.3 approved exception, documented at line 17-18 of the adapter)
- DAL imports are internal to the feature
- Notification publishing goes through `notifications.adapter`

No unauthorized cross-feature internal DAL access observed.

CROSS-FEATURE ABUSE ATTEMPT
- Source feature: join, profiles/kinds/vport, dashboard/vport
- Target feature internals: booking controller, hydration engine
- Attack vector: bypass adapter isolation
- Result: **BLOCKED** — all cross-feature access goes through adapters
- Adapter isolation: **ENFORCED**
- Severity: N/A

---

## URL Surface Results

### QR URL Builders

**isQrSafeSlug enforcement:** `qrUrlBuilders.js` exports `isQrSafeSlug(slug)` which blocks null, empty, and UUID values. All builders (`buildMenuQrUrl`, `buildReviewsQrUrl`, `buildBusinessCardQrUrl`, `buildMenuShortDisplayUrl`) gate on `isQrSafeSlug` before constructing URLs.

**VportActorMenuFlyerView:** Correctly gates:
- Print button disabled until `isQrSafe` is true
- Flyer body replaced with "Preparing flyer…" until `isQrSafe`
- `isQrSafe = isQrSafeSlug(canonicalSlug)` — uses library function, single source of truth

URL SURFACE TEST
- Route / Link: QR flyer print flow, menu URL builders
- UUID exposure: **ABSENT** — all QR surfaces gated on `isQrSafeSlug`
- Slug enforcement: **ENFORCED**
- Severity: N/A — defense holds

---

## Notification Abuse Results

### SCENARIO 7 — Team Invite Notification linkPath

**Evidence:**
```js
// vportTeam.controller.js line 107-108
await publishVcsmNotification({
  recipientActorId: barberVportActorId,
  actorId,
  kind: "team_invite",
  objectType: "team_request",
  objectId: resource?.id ? String(resource.id) : null,
  linkPath: `/actor/${barberVportActorId}/dashboard/team-requests`,
  ...
});
```

The `linkPath` contains the raw `barberVportActorId` UUID. This is an internal authenticated dashboard path, not a public-facing profile URL. The convention `/actor/:actorId/dashboard/*` is an authenticated internal route.

However: `objectId` is the `resource.id` UUID of the pending team request. If this `objectId` is surfaced in a notification payload accessible to the recipient, it leaks the resourceId. An attacker who receives a legitimate team invite notification now has both the barberVportActorId (from linkPath) and the resourceId (from objectId), which are the two values needed to simulate Scenario 3 (decline without session ownership).

NOTIFICATION ABUSE ATTEMPT
- Notification type: `team_invite`
- Attack vector: extract `objectId` (resourceId) and `linkPath` actorId from received notification payload
- Authorization at destination: **WEAK** — decline path does not re-verify session ownership
- Result: **PARTIAL** — notification exposes both IDs needed for the decline path bypass (Scenario 3)
- Evidence: `objectId: resource.id` and `linkPath: /actor/${barberVportActorId}/...` both in notification payload; these satisfy the inputs for `declineTeamRequestController(barberVportActorId, resourceId)` without session re-verification
- Severity: MEDIUM (amplifies BW-BAR-004)

---

## Auth Callback Replay Results

Auth callback flows are not specific to the barbershop module. Barbershop-specific: the invite sign-up at `signUpForBarbershopInvite` uses `emailRedirectTo: /join/barbershop/${token}`. The token in the redirect URL is the resourceId UUID. If the email confirmation link is replayed after completion, the hook-layer guard (`meta.invite_status !== "pending"`) blocks re-entry. Controller-layer guard: absent (same pattern as Scenario 5/6).

AUTH CALLBACK REPLAY ATTEMPT
- Target: invite email confirmation redirect
- Attack vector: replay email confirmation link after invite accepted
- Code single-use: **ABSENT** at controller/DAL layer — hook-layer only
- Result: **PARTIAL** — hook blocks; DAL does not
- Severity: LOW

---

## Search Abuse Results

Not directly applicable to the barbershop-specific module surface. The barbershop barber discovery (`findEligibleBarbersController`) uses `findEligibleBarberActorIdsDAL(actorId)` which operates server-side with authenticated context. No public unauthenticated enumeration surface observed for barbershop-specific actor discovery.

---

## Successful Exploit Chains

### CHAIN 1 — Notification-Assisted Decline Bypass

1. Attacker is a barber (has a barber VPORT) invited by Barbershop B
2. Attacker receives team invite notification → extracts `objectId` (resourceId) + `linkPath` actorId
3. Attacker calls `declineTeamRequestController(barberVportActorId, resourceId)` with the barbershop's ID as callerActorId
4. `isInvitedBarber` check passes if `callerActorId === resource.member_actor_id` — attacker supplies their own barber VPORT ID as callerActorId
5. Wait — this actually maps to the BARBER declining their own invite. The attacker would need to supply THEIR OWN barber VPORT actorId as callerActorId, and the resource must have `member_actor_id = attacker's VPORT`. This is a legitimate action. The decline bypass only becomes meaningful if the attacker supplies SOMEONE ELSE's barberVportActorId that matches the resource's member_actor_id — which requires knowing another barber's VPORT actorId. This is possible via notification leakage.

**Revised: CHAIN 1 is a legitimate actor declining their own invite. Not an exploit chain.**

### CHAIN 2 — QR Token Race Condition

1. Two simultaneous users scan the same barbershop QR code (e.g., a leaked or shared QR)
2. Both load the resource → both see `status: pending_onboarding` before either writes
3. Both pass hook-layer `join_token_used_at` check (not yet written)
4. Both call `acceptJoinResourceDAL` with different `barberVportActorId` values
5. Database executes both updates → last write wins → resource links to incorrect barber

**Severity:** HIGH — two concurrent valid sessions can race to claim a QR slot

---

## Failed Exploit Chains (Defenses That Held)

1. **Unauthorized system post (VB-01/VB-05)** — ownership gate now present; HARDENED ✓
2. **Null callerActorId injection** — all controllers throw before ownership check ✓  
3. **Non-existent actorId injection** — `getActorByIdDAL` returns null → throws ✓
4. **VPORT-kind actor as owner** — kind check at line 24 of ownership controller ✓
5. **QR with UUID** — `isQrSafeSlug` gate blocks UUID-based QR generation ✓
6. **Cross-feature DAL bypass** — adapter isolation enforced; no direct DAL imports across features ✓
7. **Session actor spoofing** — `callerActorId` always sourced from `identity?.actorId` (session) ✓

---

## Runtime Evidence

| File | Line(s) | Finding |
|---|---|---|
| `publishBarbershopPortfolioUpdateAsPost.controller.js` | 25-28 | assertActorOwnsVportActorController — present (VB-01 HARDENED) |
| `publishBarbershopHoursUpdateAsPost.controller.js` | 50-53 | assertActorOwnsVportActorController — present (VB-05 HARDENED) |
| `assertActorOwnsVportActor.controller.js` | 15 | Self-shortcut — skips kind check and DB query |
| `vportPublicDetails.read.dal.js` | 50 | `vport_id: newData.id` — still exposed (VB-02 UNMITIGATED) |
| `vportPublicDetails.read.dal.js` | 18 | `is_deleted` in select — still present (VB-03 UNMITIGATED) |
| `joinInvite.dal.js` | 32-43 | No status guard before `.update()` — mutation replay window |
| `vportTeamInvite.controller.js` | 41-43 | isInvitedBarber path — no session ownership verification |
| `vportTeam.controller.js` | 107-108 | Notification linkPath with raw barberVportActorId + objectId = resourceId UUID |
| `useBarberTeamRequests.js` | 43 | accept: passes viewerActorId; line 57: decline passes barberVportActorId — asymmetric |

---

## Blast Radius

| Finding | Blast Radius |
|---|---|
| BW-BAR-001 (self-shortcut) | All 9 ownership-gated call sites — future call sites at risk |
| BW-BAR-002 (DAL mutation replay) | QR join + invite join flows — any barbershop with a pending resource |
| BW-BAR-003 (race condition) | Any shared or leaked QR code — one slot can be claimed by wrong barber |
| BW-BAR-004 (decline path) | Any pending team request — a barber who receives a notification can confirm context |
| VB-02 (vport_id exposure) | All public VPORT profile reads — any barbershop profile viewer |
| VB-03 (is_deleted exposure) | All public VPORT profile reads including deleted VPORTs |

---

## BLACKWIDOW FINDINGS

---

### BLACKWIDOW ADVERSARIAL FINDING — BW-BAR-001

- **Finding ID:** BW-BAR-001
- **Scenario:** Self-shortcut bypass in ownership assertion primitive
- **Target:** `apps/VCSM/src/features/booking/controller/assertActorOwnsVportActor.controller.js` line 15
- **Application Scope:** VCSM
- **Platform Surface:** All controllers using `assertActorOwnsVportActorController` (9 call sites)
- **Attack Vector:** Supply `requestActorId === targetActorId` to bypass kind check and DB `actor_owners` query
- **Exploit Chain Type:** Injection exploit (forged parameter accepted by controller — self-match shortcut)
- **Governance Status:** DRAFT
- **Result:** PARTIAL — not exploitable at current call sites, structural weakness present
- **Evidence:** Line 15: `if (String(requestActorId) === String(targetActorId)) { return { ok: true, mode: "self" }; }` — precedes kind check at line 24 and DB check at line 33
- **Defense Gate:** WEAK — self-shortcut skips all validation
- **Blast Radius:** All 9 call sites; any future call site that mistakenly passes same actorId for both params bypasses ownership DB verification
- **Severity:** MEDIUM
- **VENOM Finding Cross-Reference:** None (new finding)
- **Recommended Fix:** Add kind check inside the self-shortcut: verify `requestActorId` resolves to a user-kind actor before returning `{ ok: true, mode: "self" }`. The self-shortcut should only apply when the requesting actor IS a user-kind owner, not a VPORT actor.
- **Layer to Fix:** Controller — `assertActorOwnsVportActor.controller.js`
- **Required Follow-up Command:** VENOM (validate trust boundary design of the self shortcut)

---

### BLACKWIDOW ADVERSARIAL FINDING — BW-BAR-002

- **Finding ID:** BW-BAR-002
- **Scenario:** QR/Invite token mutation replay via DAL state machine gap
- **Target:** `apps/VCSM/src/features/join/dal/joinInvite.dal.js` — `acceptJoinResourceDAL`
- **Application Scope:** VCSM
- **Platform Surface:** QR join flow, invite join flow, barbershop onboarding
- **Attack Vector:** Call `acceptJoinResourceDAL` with an already-accepted `resourceId` — DAL does not check `meta.status` before overwriting `member_actor_id`
- **Exploit Chain Type:** Replay exploit (stale resource state can be mutated)
- **Governance Status:** DRAFT
- **Result:** PARTIAL — hook layer blocks replay, controller and DAL do not
- **Evidence:** `acceptJoinResourceDAL` reads `current.meta` for merge but applies no `.eq("meta->status", "pending_onboarding")` guard; the `.update()` fires unconditionally on resourceId match
- **Defense Gate:** ABSENT at DAL and controller layers; PRESENT at hook/UI layer only
- **Blast Radius:** Any barbershop with a pending resource slot — a race condition or direct DAL call could link the slot to a wrong barber VPORT
- **Severity:** HIGH
- **VENOM Finding Cross-Reference:** None (new finding)
- **Recommended Fix:** Add a state machine guard inside `acceptJoinResourceDAL`: assert `current?.meta?.status === "pending_onboarding"` and `!current?.meta?.join_token_used_at` before proceeding with the update. Alternatively, add the guard in `acceptQrJoin` controller before calling the DAL.
- **Layer to Fix:** DAL (`joinInvite.dal.js`) or Controller (`joinBarbershopQr.controller.js` — `acceptQrJoin`)
- **Required Follow-up Command:** DB (verify RLS on `vport.resources` for update — does policy enforce status transitions?)

---

### BLACKWIDOW ADVERSARIAL FINDING — BW-BAR-003

- **Finding ID:** BW-BAR-003
- **Scenario:** QR token race condition — concurrent acceptance with different barber VPORTs
- **Target:** `acceptJoinResourceDAL` + `loadQrJoin` status check in `useJoinBarbershop.js`
- **Application Scope:** VCSM
- **Platform Surface:** Barbershop QR join onboarding
- **Attack Vector:** Two concurrent sessions scan the same QR code before either writes `join_token_used_at`; both pass the hook-layer status check; both call `acceptJoinResourceDAL` with different `barberVportActorId` values; last write wins
- **Exploit Chain Type:** Timing-dependent exploit (race condition)
- **Governance Status:** DRAFT
- **Result:** PARTIAL — sequential use is blocked by hook layer; concurrent use has a race window
- **Evidence:** `useJoinBarbershop.js` line 96: `meta.join_token_used_at` check is at hook layer; `acceptJoinResourceDAL` has no atomic `WHERE status = pending_onboarding AND join_token_used_at IS NULL` constraint
- **Defense Gate:** ABSENT (no atomic DB-level single-use enforcement)
- **Blast Radius:** Any shared or leaked QR code — wrong barber could claim the slot
- **Severity:** MEDIUM
- **VENOM Finding Cross-Reference:** None (new finding)
- **Recommended Fix:** Make `acceptJoinResourceDAL` atomic: use a Supabase/Postgres conditional update `.eq("meta->status", "pending_onboarding")` with a `match` that also checks `join_token_used_at IS NULL`. If RLS policies can enforce this, verify via DB command.
- **Layer to Fix:** DAL (`joinInvite.dal.js`) — add atomic conditional update
- **Required Follow-up Command:** DB (verify whether RLS or trigger enforces single-use on `vport.resources`)

---

### BLACKWIDOW ADVERSARIAL FINDING — BW-BAR-004

- **Finding ID:** BW-BAR-004
- **Scenario:** Team request decline path — no session ownership verification on isInvitedBarber branch
- **Target:** `apps/VCSM/src/features/dashboard/vport/controller/vportTeamInvite.controller.js` lines 41-58
- **Application Scope:** VCSM
- **Platform Surface:** Barber team request management (barber-side dashboard)
- **Attack Vector:** Call `declineTeamRequestController(targetBarberVportActorId, resourceId)` where `targetBarberVportActorId === resource.member_actor_id`; controller proceeds to `declineTeamRequestDAL` without verifying the authenticated session owns the supplied barber VPORT
- **Exploit Chain Type:** Injection exploit (callerActorId is VPORT-kind with no session binding verification on decline path)
- **Governance Status:** DRAFT
- **Result:** PARTIAL — hook-layer `isOwner` guard partially mitigates; controller does not enforce
- **Evidence:** `declineTeamRequestController` line 41-43: `isInvitedBarber` path skips `assertActorOwnsVportActorController`; hook `useBarberTeamRequests.decline` passes `barberVportActorId` (VPORT actorId) not `viewerActorId` (user actorId) as `callerActorId`
- **Defense Gate:** WEAK — rely on hook-layer UI gate only; controller does not independently verify
- **Blast Radius:** Any pending team request where the barber's VPORT actorId and resourceId are known; notification payloads may surface both (see BW-BAR-005)
- **Severity:** MEDIUM
- **VENOM Finding Cross-Reference:** None (new finding)
- **Recommended Fix:** Pass both `viewerActorId` and `barberVportActorId` to `declineTeamRequestController`. On the `isInvitedBarber` path, call `assertActorOwnsVportActorController({ requestActorId: viewerActorId, targetActorId: callerActorId })` to verify the session user owns the barber VPORT before allowing decline.
- **Layer to Fix:** Controller (`vportTeamInvite.controller.js`) + Hook (`useBarberTeamRequests.js`)
- **Required Follow-up Command:** VENOM (review full trust boundary of the team request lifecycle)

---

### BLACKWIDOW ADVERSARIAL FINDING — BW-BAR-005

- **Finding ID:** BW-BAR-005
- **Scenario:** Notification payload exposes resourceId + actorId — amplifies BW-BAR-004
- **Target:** `apps/VCSM/src/features/dashboard/vport/controller/vportTeam.controller.js` lines 102-112
- **Application Scope:** VCSM
- **Platform Surface:** Team invite notification
- **Attack Vector:** Recipient of a `team_invite` notification receives `objectId` (resourceId UUID) and `linkPath` containing `barberVportActorId`; these two values are the exact inputs required to call `declineTeamRequestController` on the isInvitedBarber path without session re-verification
- **Exploit Chain Type:** Multi-step exploit (notification payload → controller parameter extraction → decline path bypass)
- **Governance Status:** DRAFT
- **Result:** PARTIAL — notification exposure does not directly cause harm; only amplifies BW-BAR-004
- **Evidence:** `sendTeamRequestController` line 107-108: `objectId: resource?.id`, `linkPath: /actor/${barberVportActorId}/dashboard/team-requests` — both values in notification payload
- **Defense Gate:** WEAK — no mitigation independent of BW-BAR-004 fix
- **Blast Radius:** Any barber who receives a team invite notification has the inputs for BW-BAR-004
- **Severity:** LOW (amplifier — dependent on BW-BAR-004 exploitability)
- **VENOM Finding Cross-Reference:** None (new finding)
- **Recommended Fix:** Fix BW-BAR-004 first (adds session ownership verification on decline path). Then consider whether `objectId` should be a token reference rather than raw resourceId UUID in notification payloads.
- **Layer to Fix:** Controller (`vportTeamInvite.controller.js`) — fix BW-BAR-004 first
- **Required Follow-up Command:** VENOM (notification payload trust boundary review)

---

### BLACKWIDOW ADVERSARIAL FINDING — BW-BAR-006 (VENOM VB-02 Retest)

- **Finding ID:** BW-BAR-006
- **Scenario:** `vport_id` internal UUID still exposed on public read surface — VENOM VB-02 unmitigated
- **Target:** `apps/VCSM/src/features/profiles/dal/vportPublicDetails.read.dal.js` line 50
- **Application Scope:** VCSM
- **Platform Surface:** Public VPORT profile read surface
- **Attack Vector:** Inspect network response for any public barbershop profile read; extract `vport_id` field
- **Exploit Chain Type:** Single-step exploit (data exposure in response object)
- **Governance Status:** DRAFT
- **Result:** BYPASSED — `vport_id: newData.id` present in response at line 50; VENOM recommendation not applied
- **Evidence:** `fetchVportPublicDetailsByActorId` returns `vport_id: newData.id` (the `vport.profiles.id` UUID) in the response object; downstream consumers receive this field
- **Defense Gate:** ABSENT
- **Blast Radius:** All public VPORT profile reads — all barbershop profile visitors
- **Severity:** MEDIUM
- **VENOM Finding Cross-Reference:** VB-02
- **Recommended Fix:** Remove `vport_id` from the response shape at line 50. If the internal profile ID is required for write operations, keep it internal to the DAL/controller and never surface it to view layer.
- **Layer to Fix:** DAL (`vportPublicDetails.read.dal.js`)
- **Required Follow-up Command:** review-contract

---

### BLACKWIDOW ADVERSARIAL FINDING — BW-BAR-007 (VENOM VB-03 Retest)

- **Finding ID:** BW-BAR-007
- **Scenario:** `is_deleted` internal lifecycle flag still exposed on public read surface — VENOM VB-03 unmitigated
- **Target:** `apps/VCSM/src/features/profiles/dal/vportPublicDetails.read.dal.js` lines 18, 58
- **Application Scope:** VCSM
- **Platform Surface:** Public VPORT profile read
- **Attack Vector:** Query a soft-deleted barbershop VPORT's actorId via the public profile route; observe `is_deleted: true` (or presence of the field) in the response; enumerate moderation state
- **Exploit Chain Type:** Single-step exploit (internal flag in public response)
- **Governance Status:** DRAFT
- **Result:** BYPASSED — `is_deleted` still in `SELECT` list at line 18; `is_active` returned in response at line 58; no `.eq('is_deleted', false)` filter applied
- **Evidence:** DAL `SELECT` block includes `is_deleted` on line 18; response at line 58 includes `is_active: newData.is_active ?? null`; deleted VPORTs will be returned by this query
- **Defense Gate:** ABSENT
- **Blast Radius:** All public VPORT profile reads; clients can identify deleted or deactivated VPORTs
- **Severity:** LOW
- **VENOM Finding Cross-Reference:** VB-03
- **Recommended Fix:** Add `.eq('is_deleted', false)` filter to the query; remove `is_deleted` from SELECT; gate `is_active` to owner-only visibility
- **Layer to Fix:** DAL (`vportPublicDetails.read.dal.js`)
- **Required Follow-up Command:** DB

---

## Recommended Fixes

| Priority | Finding | File | Fix |
|---|---|---|---|
| HIGH | BW-BAR-002 — DAL mutation replay | `joinInvite.dal.js` | Add atomic state guard in `acceptJoinResourceDAL` — assert `status === "pending_onboarding"` before update |
| HIGH | BW-BAR-006 (VB-02) — vport_id exposure | `vportPublicDetails.read.dal.js` | Remove `vport_id: newData.id` from response at line 50 |
| MEDIUM | BW-BAR-001 — self-shortcut kind bypass | `assertActorOwnsVportActor.controller.js` | Add kind check inside self-shortcut branch before returning `{ ok: true, mode: "self" }` |
| MEDIUM | BW-BAR-003 — QR race condition | `joinInvite.dal.js` | Atomic conditional update — only proceeds if `status = pending_onboarding AND join_token_used_at IS NULL` |
| MEDIUM | BW-BAR-004 — decline path ownership gap | `vportTeamInvite.controller.js` + `useBarberTeamRequests.js` | Pass `viewerActorId` to `declineTeamRequestController`; call `assertActorOwnsVportActorController` on `isInvitedBarber=true` path |
| LOW | BW-BAR-005 — notification payload IDs | `vportTeam.controller.js` | Fix BW-BAR-004 first; then review `objectId` exposure in notification payloads |
| LOW | BW-BAR-007 (VB-03) — is_deleted exposure | `vportPublicDetails.read.dal.js` | Add `.eq('is_deleted', false)` filter; remove `is_deleted` from SELECT; gate `is_active` to owner mode |

---

## Required Follow-up Commands

| Command | Reason | Priority |
|---|---|---|
| DB | Verify RLS on `vport.resources` — does policy enforce `pending_onboarding` status transitions? (BW-BAR-002, BW-BAR-003) | HIGH |
| VENOM | Cross-reference BW-BAR-001 (self-shortcut design), BW-BAR-004 (decline trust boundary), BW-BAR-005 (notification payload) | HIGH |
| DB | Verify RLS on `vc.posts` for `post_type = barbershop_*` — does policy enforce actor ownership? | MEDIUM |
| review-contract | Confirm `vport_id` removal at DAL surface is contract-compliant (VB-02 / BW-BAR-006) | MEDIUM |
| THOR | Evaluate release blocking status for BW-BAR-002 (HIGH) and BW-BAR-006 (MEDIUM — VB-02 unmitigated) | MEDIUM |

---

## Pending Reviews

| Command | Reason | Status |
|---|---|---|
| VENOM | Cross-reference findings with trust-boundary source | PENDING |
| DB | Validate RLS on vport.resources and vc.posts for state machine enforcement | PENDING |
| THOR | Evaluate release blocking — BW-BAR-002 (HIGH), BW-BAR-006 (MEDIUM) | PENDING |
| LOKI | Validate runtime telemetry for exploit paths | PENDING |

---

*BLACKWIDOW is non-destructive. No source code was modified. No production data was accessed. All findings are adversarial simulations based on repository source review.*
