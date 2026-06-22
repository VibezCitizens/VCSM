# BLACKWIDOW Runtime Adversarial Report

**Date:** 2026-05-27
**Scope:** VCSM
**Reviewer:** BLACKWIDOW
**Environment:** Source-code adversarial simulation (no production data, no external services)
**Governance Status:** DRAFT

---

## Attack Surface Summary

**Module:** Barber / Barbershop VPORT — team join flows, publish controllers, team invite/request lifecycle
**Entry Points Tested:**
- `joinBarbershopQr.controller.js` — QR join acceptance
- `joinBarbershopAccount.controller.js` — invite-based join, existing VPORT acceptance
- `vportTeam.controller.js` — team member add/remove/send-request
- `vportTeamInvite.controller.js` — accept/decline team requests, accept barbershop invite
- `publishBarbershopPortfolioUpdateAsPost.controller.js` — system post publish
- `publishBarbershopHoursUpdateAsPost.controller.js` — system post publish
- `useBarberTeamRequests.js` hook surface
- `BarberTeamRequestsScreen.jsx` screen surface
- `VportBarberShopTeamView.jsx` public profile team surface
- `vportBarbershopPost.read.dal.js` — throttle/dedup DAL
- `barberVport.read.dal.js` — join flow VPORT lookup
- `joinInvite.dal.js` — join resource acceptance DAL

**Venom Reports Cross-Referenced:**
- `2026-05-10_venom-robin_barber-vport.md` (VBR-01 through VBR-05)
- `2026-05-10_venom-robin_barbershop-vport.md` (VB-01 through VB-05)

---

## Simulated Threat Scenarios

| Scenario | Target | Result |
|---|---|---|
| 5.1 Ownership Bypass | publishBarbershopPortfolio/Hours controllers | **BYPASSED** |
| 5.1 Ownership Bypass | acceptQrJoin controller | **BYPASSED** |
| 5.1 Ownership Bypass | acceptTeamRequestController | **BYPASSED** |
| 5.2 Session Mutation | acceptTeamRequestController caller identity | **BYPASSED** |
| 5.3 Runtime Abuse | getBarberTeamRequestsController | **PARTIAL** |
| 5.4 RLS Verification | vport.resources write path | **ASSUMED** |
| 5.5 Viewer Context Fuzz | Null callerActorId to controllers | **BLOCKED** |
| 5.6 Mutation Replay | acceptJoinResourceDAL token replay | **PARTIAL** |
| 5.7 Hydration Poisoning | VportBarberShopTeamView hydration path | **BLOCKED** |
| 5.8 Cross-Feature Abuse | insertTeamRequestDAL adapter isolation | **BLOCKED** |
| 5.9 URL Surface | team-requests notification linkPath | **BYPASSED** |
| 5.10 Notification Abuse | sendTeamRequestController context payload | **BYPASSED** |
| 5.11 Auth Callback Replay | Join QR token single-use enforcement | **PARTIAL** |
| 5.12 Search Abuse | getBarberTeamRequestsController enumeration | **BYPASSED** |

---

## Ownership Bypass Results

### Attack 1 — Portfolio System Post Injection

**Target:** `publishBarbershopPortfolioUpdateAsPostController`

**Attack vector:**
Attacker (Actor C, authenticated) knows Barbershop B's `actorId` (obtainable from public profile URL or hydration store). Attacker constructs and calls:

```js
publishBarbershopPortfolioUpdateAsPostController({
  actorId: "victim_barbershop_actor_id",
  portfolioTitle: "Malicious content",
  mediaUrl: "https://attacker.controlled/image.jpg"
})
```

**Controller response:**
1. `!actorId` → passes (actorId is truthy)
2. `hasRecentBarbershopPortfolioPostDAL({ actorId })` → passes if no post in past hour
3. `resolveVportBarbershopNameDAL(actorId)` → returns victim barbershop name
4. `createSystemPost({ actorId: "victim_barbershop_actor_id", ... })` → system post published to public feed **under victim's identity**

**No step in this chain verifies the caller owns the target actorId.**

Result: **BYPASSED**
Defense Gate: **ABSENT**
Severity: **HIGH**

---

### Attack 2 — Hours System Post Injection

**Target:** `publishBarbershopHoursUpdateAsPostController`

Identical attack vector as Attack 1. Attacker can publish fake hours updates to the feed attributed to any barbershop actor.

Result: **BYPASSED**
Defense Gate: **ABSENT**
Severity: **HIGH**

---

### Attack 3 — QR Join Identity Injection

**Target:** `acceptQrJoin` in `joinBarbershopQr.controller.js`

**Attack vector:**
1. Attacker physically visits Barbershop B and scans the QR join code — obtains `token` (the `vport.resources` UUID for a pending `pending_onboarding` slot).
2. Attacker identifies `victim_barber_vport_actor_id` — obtainable from the barber's public profile, hydration store, or from `VportBarberShopTeamView` member listings.
3. Attacker, authenticated as their own session, calls:

```js
acceptQrJoin(token, "victim_barber_vport_actor_id")
// → acceptJoinResourceDAL(token, "victim_barber_vport_actor_id", { join_token_used_at: ... })
```

4. DAL executes:
```sql
UPDATE vport.resources
SET member_actor_id = 'victim_barber_vport_actor_id',
    is_active = true,
    meta = { status: 'linked', accepted_at: '...' }
WHERE id = token;
```

5. Victim barber VPORT is now linked as a staff member at Barbershop B — **without their consent or authentication**.

**Controller has no ownership check on barberVportActorId.**
**DAL has no ownership check on barberVportActorId.**
**The only protection is DB-level RLS — status: ASSUMED, not verified.**

Result: **BYPASSED** (pending RLS verification)
Defense Gate: **ABSENT at controller layer** / **ASSUMED at DB layer**
Severity: **CRITICAL**
Exploit Chain Type: **Injection Exploit (forged parameter accepted by controller)**

---

### Attack 4 — Forced Team Request Acceptance

**Target:** `acceptTeamRequestController` in `vportTeamInvite.controller.js`

**Attack vector:**
1. Barbershop A sends a team request to Barber VPORT B. A `vport.resources` row is created with `member_actor_id = barber_vport_actor_id_B`, `meta.status = 'pending_acceptance'`.
2. Attacker (Actor C) intercepts or harvests the `resourceId` (from: notification context payload — `context.resourceId` is sent in the `team_invite` notification; the notification linkPath also provides `barberVportActorId` which is the `member_actor_id`).
3. Attacker calls:

```js
acceptTeamRequestController(
  "barber_vport_actor_id_B",  // callerActorId — the victim's actorId
  "resource_uuid"              // resourceId
)
```

4. Controller check: `String("barber_vport_actor_id_B") !== String(resource.member_actor_id)` → **PASSES** (values are equal).
5. `acceptTeamRequestDAL(resourceId, resource.meta)` is called from **attacker's session**.
6. Resource is updated to `status: 'linked'` — Barber B is force-accepted into Barbershop A.

**The controller verifies the caller knows the member_actor_id, but does NOT verify the calling session owns that VPORT actor.**
**No call to `assertActorOwnsVportActorController`.**

Result: **BYPASSED** (pending RLS verification)
Defense Gate: **WEAK** (string equality ≠ session ownership)
Severity: **HIGH**
Exploit Chain Type: **Injection Exploit (caller-supplied identity accepted as authority)**

---

## Session Mutation Results

### Attack 5 — Caller Identity Impersonation via String Equality

**Target:** `acceptTeamRequestController`

String equality check `String(callerActorId) !== String(resource.member_actor_id)` provides zero session binding. Any authenticated actor who supplies the correct `callerActorId` string passes the check regardless of whether they own that VPORT. This is the VBR-01 pattern identified by Venom, now confirmed exploitable.

Session binding: **ABSENT**
Result: **BYPASSED**

---

### Attack 6 — Existing VPORT Accept with owner_user_id (Non-Canonical Ownership)

**Target:** `useExistingBarberVportAndAccept` in `joinBarbershopAccount.controller.js`

```js
const existingVport = await readBarberVportByOwnerUserIdDAL(user.id);
if (!existingVport || String(existingVport.actor_id) !== String(vportActorId)) {
  throw new Error("Caller does not own this barber vport.");
}
```

This check uses `vport.profiles.owner_user_id` to verify ownership. This is not the canonical ownership model (`actor_owners`). If ownership is ever transferred (VPORT changes hands via `actor_owners` update without updating `owner_user_id`), the check produces incorrect results:
- A legitimate new owner (present in `actor_owners`) would be **denied**
- The original owner (present in `owner_user_id` but removed from `actor_owners`) would be **allowed**

Session binding: **PRESENT but non-canonical**
Exploit chain type: **Timing-dependent (only exploitable if ownership transfer diverges)**
Severity: **MEDIUM**

---

## Runtime Abuse Results

### Attack 7 — Team Request Enumeration (Unauthenticated VPORT Actor)

**Target:** `getBarberTeamRequestsController`

```js
export async function getBarberTeamRequestsController(barberVportActorId) {
  if (!barberVportActorId) return [];
  return fetchPendingTeamRequestsForBarberDAL(barberVportActorId);
}
```

No ownership check. Any caller who supplies a valid `barberVportActorId` receives all pending team requests for that VPORT — including `resourceId`, barbershop name, and `barbershop.actor_id`. These fields fuel downstream attacks (Attack 4 above).

At the hook level, `useBarberTeamRequests(isOwner ? actorId : null)` provides UI-level protection by passing `null` for non-owners. But the controller itself has no gate, making it callable from outside the UI.

Actor role used: Any authenticated actor
Expected access: DENIED for non-owners
Result: **PARTIAL** (UI-gated, controller unguarded)
Privilege Gate: **WEAK** (hook-level only, not controller-level)
Severity: **LOW**

---

## RLS Verification Results

### RLS-01 — vport.resources Write Gate

**Table:** `vport.resources`
**Attack vectors:** Attack 3 (acceptQrJoin), Attack 4 (acceptTeamRequestController)
**RLS status:** ASSUMED — not verified in this engagement
**Result:** ASSUMED
**Required follow-up:** DB command must verify:
- UPDATE policy on `vport.resources` for `member_actor_id` column
- Whether anonymous/non-owner sessions can write `member_actor_id`
- Whether `pending_onboarding` resource rows are writable by any authenticated actor

### RLS-02 — vc.posts System Post Write Gate

**Table:** `vc.posts`
**Attack vectors:** Attack 1, Attack 2
**RLS status:** ASSUMED — Venom finding VB-01 requested DB verification; not yet confirmed
**Result:** ASSUMED
**Required follow-up:** DB command must verify INSERT RLS on `vc.posts` for `post_type IN ('barbershop_portfolio_update', 'barbershop_hours_update')` requires caller = actor owner.

---

## Viewer Context Fuzz Results

### Fuzz-01 — Null callerActorId to write controllers

All barber team write controllers (`addTeamMemberController`, `sendTeamRequestController`, `removeTeamMemberController`, `acceptBarbershopInviteController`) check `if (!callerActorId) throw new Error(...)` at entry.

`publishBarbershopPortfolioUpdateAsPostController` and `publishBarbershopHoursUpdateAsPostController` check `if (!actorId) throw new Error(...)`.

`acceptTeamRequestController` and `declineTeamRequestController` check `if (!callerActorId) throw new Error(...)`.

Result: **BLOCKED** for null inputs.

### Fuzz-02 — Malformed actorId (empty string, "null", non-UUID)

Checked: `String(callerActorId) !== String(resource.member_actor_id)` with `callerActorId = ""` → `"" !== "some-uuid"` → throws error. Safe.

Checked: `callerActorId = "null"` → truthy, passes null check. DB query would find no actor → resource not found → safe.

Context validation: **ENFORCED** (null/empty)
Severity: **INFO**

---

## Mutation Replay Results

### Replay-01 — QR Token Replay After Use

**Target:** `acceptQrJoin` / `loadQrJoin`

`loadQrJoin` checks `resource.meta?.status !== "pending_onboarding"` to detect already-used tokens. However, `acceptJoinResourceDAL` sets `meta.status = "linked"` on acceptance. The hook checks `meta.join_token_used_at` and `resource.member_actor_id` before allowing acceptance.

If `acceptJoinResourceDAL` is called **directly** (bypassing the hook's pre-flight checks), the token can be replayed until the DB record is updated.

In the hook flow, if two concurrent callers both pass the pre-flight check before either write completes, both could accept the same token with different `barberVportActorId` values. The last writer wins — the earlier acceptance is silently overwritten.

State check: **PARTIAL** (hook-level only, no atomic DB-level guard)
Result: **PARTIAL**
Severity: **MEDIUM**

### Replay-02 — Team Request Double-Accept

**Target:** `acceptTeamRequestController`

Controller checks `resource.meta?.status !== "pending_acceptance"` before proceeding. A second accept attempt returns error "This request is no longer pending." State check is present.

State check: **PRESENT**
Result: **BLOCKED**

---

## Hydration Poisoning Results

**Target:** `useActorSummary` in `VportBarberShopTeamView`

The team view calls `useActorSummary(member.member_actor_id)`. These actor IDs come from the `vport.resources` DB fetch, not from client-supplied parameters. The hydration store cannot be poisoned through the team view surface.

Cache invalidation: **PRESENT** (store reads authoritative actorIds from DB)
Result: **BLOCKED**

---

## Cross-Feature Abuse Results

**Target:** `insertTeamRequestDAL` (in `vportTeamInvite.write.dal.js`)

Called only via `sendTeamRequestController`, which is wrapped behind `assertActorOwnsVportActorController`. No direct external import path found.

**Target:** `acceptJoinResourceDAL` (in `joinInvite.dal.js`)

Called via `joinBarbershopAccount.controller.js` and `joinBarbershopQr.controller.js`. The QR path (`acceptQrJoin`) does NOT add an ownership gate before calling this DAL — confirmed in Attack 3.

Adapter isolation: **WEAK** for QR path (DAL callable with arbitrary actor ID)
Result: **PARTIAL**

---

## URL Surface Results

### URL-01 — Notification LinkPath Raw UUID

**Route:** `/actor/${barberVportActorId}/dashboard/team-requests`
(generated in `sendTeamRequestController` at `publishVcsmNotification` call)

This path is stored as `linkPath` in the notification record and rendered as a navigation target in `TeamInviteNotificationItem.view.jsx`.

The `barberVportActorId` in this URL is a raw `vc.actors.id` UUID. This violates the platform rule: "Raw UUIDs must never appear in public-facing URLs."

UUID exposure: **PRESENT**
Slug enforcement: **MISSING**
Severity: **MEDIUM**

### URL-02 — VportBarberShopTeamView Public Tab

`VportBarberShopTeamView` renders barber staff with buttons that navigate to `/profile/${shopSlug}?tab=booking`. The `shopSlug` is a human-readable slug — correct.

Owner management buttons navigate to `/actor/${shopActorId}/dashboard/...` — contains raw actorId UUID.

UUID exposure: **PRESENT** (owner management routes)
Slug enforcement: **MISSING** (dashboard routes use actorId not slug)
Severity: **LOW** (dashboard routes are owner-authenticated, lower risk than public)

---

## Notification Abuse Results

### Attack 8 — Notification Context Payload Harvesting

**Target:** `sendTeamRequestController` → `publishVcsmNotification`

```js
await publishVcsmNotification({
  recipientActorId: barberVportActorId,
  actorId,
  kind: "team_invite",
  objectType: "team_request",
  objectId: resource?.id ? String(resource.id) : null,
  linkPath: `/actor/${barberVportActorId}/dashboard/team-requests`,
  context: {
    barbershopActorId: actorId,      // ← raw UUID
    resourceId: resource?.id ?? null, // ← raw internal vport.resources UUID
  },
});
```

The notification `context` payload exposes:
- `barbershopActorId` (raw `vc.actors.id` UUID) — usable to call system post controllers
- `resourceId` (raw `vport.resources.id` UUID) — directly usable in Attack 4

A recipient who reads their raw notification payload (via Supabase Realtime, DevTools, or any notification API) obtains all parameters needed to execute the forced team request acceptance (Attack 4).

Authorization at destination: **ENFORCED** (BarberTeamRequestsScreen checks isOwner)
Notification payload raw IDs: **EXPOSED**
Result: **PARTIAL** (destination re-validates; payload still seeds Attack 4)
Severity: **MEDIUM**

---

## Auth Callback Replay Results

Not applicable to barber module specifically. No auth callback paths in scope.

---

## Search Abuse Results

### Attack 9 — Team Request Enumeration via Unguarded Controller

**Target:** `getBarberTeamRequestsController`

Detailed in Attack 7 above. Any caller with knowledge of a `barberVportActorId` can retrieve all pending team requests for that VPORT. Response includes barbershop profile IDs, actor IDs, and resource UUIDs.

Visibility gate: **WEAK** (no controller-level ownership check)
Result: **PARTIAL**

---

## Successful Exploit Chains

### Chain A — Public Feed Contamination via System Post Injection

```
Attacker knows barbershop actorId (public profile / hydration store)
  → calls publishBarbershopPortfolioUpdateAsPostController({ actorId: victim })
  → no actor_owners check
  → createSystemPost publishes to public feed under victim's identity
  → victim's followers see forged content
```
Type: Single-step exploit
Severity: HIGH
VENOM cross-reference: VB-01, VB-05

### Chain B — Forced VPORT Team Enrollment via QR Code

```
Attacker scans barbershop QR code → obtains join token
Attacker identifies target barber VPORT actorId (public profile)
  → calls acceptQrJoin(token, victim_vport_actor_id)
  → acceptJoinResourceDAL writes member_actor_id = victim without ownership check
  → victim barber VPORT is enrolled as staff at barbershop without consent
  → pending RLS verification at DB layer
```
Type: Injection exploit (forged parameter)
Severity: CRITICAL

### Chain C — Forced Team Request Acceptance via Notification Payload Harvest

```
Attacker receives or intercepts team_invite notification
  → reads context.resourceId and notification.linkPath (contains member_actor_id)
  → calls acceptTeamRequestController(member_actor_id, resourceId) from own session
  → string equality check passes (callerActorId == member_actor_id)
  → DAL force-accepts request, barber VPORT is linked to barbershop
```
Type: Multi-step exploit (notification harvest → injection → forced mutation)
Severity: HIGH

---

## Failed Exploit Chains (Defenses That Held)

| Scenario | Target | Defense |
|---|---|---|
| Null callerActorId injection | All write controllers | Explicit null guards at controller entry |
| Hydration poisoning via team view | useActorSummary | actorIds are read from DB, not client-supplied |
| Cross-feature DAL bypass via adapters | insertTeamRequestDAL | Only reachable via controller with ownership gate |
| Accept already-declined request | acceptTeamRequestController | Status check blocks non-pending resources |
| Remove team member without ownership | removeTeamMemberController | assertActorOwnsVportActorController present |
| Send team request without ownership | sendTeamRequestController | assertActorOwnsVportActorController present |
| Add team member without ownership | addTeamMemberController | assertActorOwnsVportActorController present |
| Accept barbershop invite without ownership | acceptBarbershopInviteController | assertActorOwnsVportActorController present |

---

## Runtime Evidence

**Source paths examined:**
- `apps/VCSM/src/features/join/controllers/joinBarbershopQr.controller.js` — `acceptQrJoin` has zero ownership check (lines 18–21)
- `apps/VCSM/src/features/join/controllers/joinBarbershopAccount.controller.js` — `useExistingBarberVportAndAccept` uses `owner_user_id` check (lines 122–133)
- `apps/VCSM/src/features/dashboard/vport/controller/vportTeamInvite.controller.js` — `acceptTeamRequestController` string equality check (lines 23–25), no `assertActorOwnsVportActorController`
- `apps/VCSM/src/features/profiles/kinds/vport/controller/barbershop/publishBarbershopPortfolioUpdateAsPost.controller.js` — no actor_owners check at any point (full file)
- `apps/VCSM/src/features/profiles/kinds/vport/controller/barbershop/publishBarbershopHoursUpdateAsPost.controller.js` — no actor_owners check at any point (full file)
- `apps/VCSM/src/features/dashboard/vport/controller/vportTeam.controller.js` — `getBarberTeamRequestsController` has no ownership guard (lines 60–63)
- `apps/VCSM/src/features/dashboard/vport/controller/vportTeam.controller.js` — `sendTeamRequestController` correctly uses `assertActorOwnsVportActorController` (lines 81–84)
- `apps/VCSM/src/features/join/dal/joinInvite.dal.js` — `acceptJoinResourceDAL` accepts caller-supplied `barberVportActorId` with no validation (lines 18–49)

---

## Blast Radius

| Finding | Blast Radius |
|---|---|
| BW-BAR-01 (QR injection) | Every barber VPORT that has NOT already enrolled at a barbershop — attacker can force-enroll any of them into any barbershop with a live QR token |
| BW-BAR-02 (acceptTeamRequest bypass) | Every barber VPORT with a pending team request — attacker can force-accept any pending invitation |
| BW-BAR-03 (portfolio post injection) | Every barbershop VPORT — attacker can post 1 forged portfolio update per hour per target to the public feed |
| BW-BAR-04 (hours post injection) | Every barbershop VPORT — attacker can post 1 forged hours update per hour per target |
| BW-BAR-05 (owner_user_id check) | Affects VPORT ownership transfer scenarios only — blast radius contingent on operational event |
| BW-BAR-06 (notification payload) | Seeds Attack 4 — blast radius matches BW-BAR-02 |

---

## BLACKWIDOW FINDINGS

---

### BLACKWIDOW ADVERSARIAL FINDING — BW-BAR-01

- **Finding ID:** BW-BAR-01
- **Scenario:** 5.1 Ownership Bypass + 5.6 Mutation Replay (forced write)
- **Target:** `apps/VCSM/src/features/join/controllers/joinBarbershopQr.controller.js` — `acceptQrJoin`
- **Application Scope:** VCSM
- **Platform Surface:** Barber join QR flow — team enrollment write path
- **Attack Vector:** Authenticated attacker supplies victim barber VPORT's `actorId` as the `barberVportActorId` parameter to `acceptQrJoin`. No ownership verification exists at any layer before the DAL write.
- **Exploit Chain Type:** Injection Exploit (forged parameter accepted by controller)
- **Governance Status:** DRAFT
- **Result:** BYPASSED
- **Evidence:** `joinBarbershopQr.controller.js` lines 18–21 — `acceptQrJoin(token, barberVportActorId)` calls `acceptJoinResourceDAL` directly. No call to `assertActorOwnsVportActorController` or any ownership check on `barberVportActorId`. The hook in `useJoinBarbershop.js` correctly scopes the `barberVportActorId` to the current user's VPORT — but this protection is UI-only and does not survive direct controller invocation.
- **Defense Gate:** ABSENT
- **Blast Radius:** Any barber VPORT can be force-enrolled into any barbershop by an authenticated attacker who possesses a valid pending QR join token.
- **Severity:** CRITICAL
- **VENOM Finding Cross-Reference:** None — new surface not identified by Venom
- **Recommended Fix:** Add ownership verification before `acceptJoinResourceDAL`. Verify the calling session's actor owns the `barberVportActorId` being enrolled via `assertActorOwnsVportActorController`. Pattern: `await assertActorOwnsVportActorController({ requestActorId: callerActorId, targetActorId: barberVportActorId })`.
- **Layer to Fix:** Controller (`joinBarbershopQr.controller.js`) — add `callerActorId` parameter and ownership gate
- **Required Follow-up Command:** DB (verify `vport.resources` UPDATE RLS for `pending_onboarding` rows)

---

### BLACKWIDOW ADVERSARIAL FINDING — BW-BAR-02

- **Finding ID:** BW-BAR-02
- **Scenario:** 5.2 Session Mutation + 5.1 Ownership Bypass
- **Target:** `apps/VCSM/src/features/dashboard/vport/controller/vportTeamInvite.controller.js` — `acceptTeamRequestController`
- **Application Scope:** VCSM
- **Platform Surface:** Barber team request acceptance — owner-action write path
- **Attack Vector:** Attacker harvests `member_actor_id` (from notification linkPath) and `resourceId` (from notification context payload). Attacker calls `acceptTeamRequestController(member_actor_id_of_victim, resourceId)`. The controller's only guard is string equality between the supplied `callerActorId` and the stored `member_actor_id` — no session ownership check. The attacker supplies the correct string and passes.
- **Exploit Chain Type:** Multi-step Exploit (notification harvest → parameter injection → forced mutation)
- **Governance Status:** DRAFT
- **Result:** BYPASSED
- **Evidence:** `vportTeamInvite.controller.js` lines 23–25: `String(callerActorId) !== String(resource.member_actor_id)` — this is string equality, not session ownership. `acceptTeamRequestController` has no call to `assertActorOwnsVportActorController`. Compare to `declineTeamRequestController` (same file, lines 44–55) which correctly calls `assertActorOwnsVportActorController` for the barbershop owner path, and `acceptBarbershopInviteController` (lines 70–86) which also correctly calls `assertActorOwnsVportActorController`.
- **Defense Gate:** WEAK (string equality ≠ session ownership)
- **Blast Radius:** Any pending team request can be force-accepted by an attacker who knows the resource ID and target `member_actor_id`.
- **Severity:** HIGH
- **VENOM Finding Cross-Reference:** VBR-01 (string equality ownership pattern) — BlackWidow confirms this pattern is actively exploitable in `acceptTeamRequestController`
- **Recommended Fix:** Add `assertActorOwnsVportActorController({ requestActorId: callerActorId, targetActorId: callerActorId })` OR replace the string equality check with a verified ownership assertion that binds the calling session to the `member_actor_id` VPORT. Since the barber accepting is a VPORT, the call should verify the session user owns that VPORT: `await assertActorOwnsVportActorController({ requestActorId: callerActorId, targetActorId: resource.member_actor_id })`.
- **Layer to Fix:** Controller (`vportTeamInvite.controller.js`) — replace string equality check with `assertActorOwnsVportActorController`
- **Required Follow-up Command:** DB (verify `vport.resources` UPDATE RLS)

---

### BLACKWIDOW ADVERSARIAL FINDING — BW-BAR-03

- **Finding ID:** BW-BAR-03
- **Scenario:** 5.1 Ownership Bypass
- **Target:** `apps/VCSM/src/features/profiles/kinds/vport/controller/barbershop/publishBarbershopPortfolioUpdateAsPost.controller.js`
- **Application Scope:** VCSM
- **Platform Surface:** Barbershop public feed — system post publish
- **Attack Vector:** Authenticated attacker calls `publishBarbershopPortfolioUpdateAsPostController({ actorId: victim_barbershop_actor_id, portfolioTitle: "...", mediaUrl: "..." })`. No ownership check exists. Controller proceeds to publish a system post attributed to the victim barbershop.
- **Exploit Chain Type:** Single-step Exploit (no gate missing — gate was never present)
- **Governance Status:** DRAFT
- **Result:** BYPASSED
- **Evidence:** `publishBarbershopPortfolioUpdateAsPost.controller.js` — full controller reviewed. Only check: `if (!actorId) throw ...`. No `assertActorOwnsVportActorController` or equivalent. Throttle check (`hasRecentBarbershopPortfolioPostDAL`) is per `actorId` — only throttles repeat attacks on the same victim, does not block initial attack.
- **Defense Gate:** ABSENT
- **Blast Radius:** Every barbershop VPORT — 1 forged portfolio system post per hour per target barbershop.
- **Severity:** HIGH
- **VENOM Finding Cross-Reference:** VB-01 — BlackWidow confirms BYPASSED
- **Recommended Fix:** Add caller identity parameter and ownership gate: `publishBarbershopPortfolioUpdateAsPostController({ callerActorId, actorId, ... })` → `await assertActorOwnsVportActorController({ requestActorId: callerActorId, targetActorId: actorId })` before proceeding.
- **Layer to Fix:** Controller
- **Required Follow-up Command:** DB (verify `vc.posts` INSERT RLS for `post_type = 'barbershop_portfolio_update'`)

---

### BLACKWIDOW ADVERSARIAL FINDING — BW-BAR-04

- **Finding ID:** BW-BAR-04
- **Scenario:** 5.1 Ownership Bypass
- **Target:** `apps/VCSM/src/features/profiles/kinds/vport/controller/barbershop/publishBarbershopHoursUpdateAsPost.controller.js`
- **Application Scope:** VCSM
- **Platform Surface:** Barbershop public feed — system post publish
- **Attack Vector:** Same as BW-BAR-03 — attacker calls `publishBarbershopHoursUpdateAsPostController({ actorId: victim, blocks: [...] })` with forged hours data.
- **Exploit Chain Type:** Single-step Exploit
- **Governance Status:** DRAFT
- **Result:** BYPASSED
- **Evidence:** `publishBarbershopHoursUpdateAsPost.controller.js` — identical pattern to BW-BAR-03. No ownership check.
- **Defense Gate:** ABSENT
- **Blast Radius:** Every barbershop VPORT — 1 forged hours update per hour per target.
- **Severity:** HIGH
- **VENOM Finding Cross-Reference:** VB-05 — BlackWidow confirms BYPASSED
- **Recommended Fix:** Same as BW-BAR-03 — add `callerActorId` and ownership gate.
- **Layer to Fix:** Controller
- **Required Follow-up Command:** DB (verify `vc.posts` INSERT RLS for `post_type = 'barbershop_hours_update'`)

---

### BLACKWIDOW ADVERSARIAL FINDING — BW-BAR-05

- **Finding ID:** BW-BAR-05
- **Scenario:** 5.2 Session Mutation — Non-Canonical Ownership Check
- **Target:** `apps/VCSM/src/features/join/controllers/joinBarbershopAccount.controller.js` — `useExistingBarberVportAndAccept`
- **Application Scope:** VCSM
- **Platform Surface:** Barber invite join flow — existing VPORT acceptance path
- **Attack Vector:** If a barber VPORT's ownership is transferred (new owner added via `actor_owners`, original owner remains in `vport.profiles.owner_user_id`), the original owner can still call `useExistingBarberVportAndAccept` and accept an invite on behalf of the VPORT — because the check reads `owner_user_id`, not `actor_owners`.
- **Exploit Chain Type:** Timing-dependent Exploit (only active during ownership divergence)
- **Governance Status:** DRAFT
- **Result:** PARTIAL (requires ownership transfer event to trigger)
- **Evidence:** `joinBarbershopAccount.controller.js` lines 122–133: `readBarberVportByOwnerUserIdDAL(user.id)` scopes by `owner_user_id`, then `String(existingVport.actor_id) !== String(vportActorId)` — both non-canonical. VBR-01 from Venom identified this pattern systemically.
- **Defense Gate:** WEAK (non-canonical check)
- **Blast Radius:** Low — only affects VPORTs that have undergone ownership transfer.
- **Severity:** MEDIUM
- **VENOM Finding Cross-Reference:** VBR-01
- **Recommended Fix:** Replace `readBarberVportByOwnerUserIdDAL` with an actor_owners-based lookup. Verify the calling session's `actorId` is an owner of the target VPORT via `assertActorOwnsVportActorController`.
- **Layer to Fix:** Controller
- **Required Follow-up Command:** ARCHITECT (audit all controllers using `owner_user_id` for ownership)

---

### BLACKWIDOW ADVERSARIAL FINDING — BW-BAR-06

- **Finding ID:** BW-BAR-06
- **Scenario:** 5.10 Notification Abuse + 5.9 URL Surface
- **Target:** `apps/VCSM/src/features/dashboard/vport/controller/vportTeam.controller.js` — `sendTeamRequestController` → `publishVcsmNotification`
- **Application Scope:** VCSM
- **Platform Surface:** Team invite notification — payload and deep link
- **Attack Vector:** `sendTeamRequestController` stores `resourceId` and `barbershopActorId` as raw UUIDs in the notification context. The `linkPath` contains `barberVportActorId` as a raw UUID path segment. A recipient who reads the raw notification payload (via realtime subscription, network inspector, or notification API) obtains all parameters needed for Attack Chain C (BW-BAR-02).
- **Exploit Chain Type:** Multi-step (notification harvest → forced accept)
- **Governance Status:** DRAFT
- **Result:** PARTIAL (destination re-validates ownership; payload still seeds other attacks)
- **Evidence:** `vportTeam.controller.js` lines 102–113: `linkPath: '/actor/${barberVportActorId}/dashboard/team-requests'` (raw UUID). `context: { barbershopActorId: actorId, resourceId: resource?.id }` (both raw UUIDs). `TeamInviteNotificationItem.view.jsx` renders `notification.linkPath` directly.
- **Defense Gate:** PRESENT at destination (BarberTeamRequestsScreen checks `isOwner`), ABSENT at payload level
- **Blast Radius:** Notification recipients — `resourceId` is directly usable in BW-BAR-02
- **Severity:** MEDIUM
- **VENOM Finding Cross-Reference:** VBR-02 (ID surface exposure), VBR-01 (ownership check gap)
- **Recommended Fix:** (1) Remove `resourceId` from notification context — destination screen should retrieve resource IDs from its own data fetch, not from notification payload. (2) Replace `linkPath` raw UUID with a slug-based route. (3) Keep `barbershopActorId` internal — destination screen resolves from its own data.
- **Layer to Fix:** Controller (notification payload construction)
- **Required Follow-up Command:** HAWKEYE (audit all notification payloads for raw UUID exposure)

---

### BLACKWIDOW ADVERSARIAL FINDING — BW-BAR-07

- **Finding ID:** BW-BAR-07
- **Scenario:** 5.9 URL Surface + 5.12 Search Abuse
- **Target:** `apps/VCSM/src/features/dashboard/vport/controller/vportTeam.controller.js` — `getBarberTeamRequestsController`
- **Application Scope:** VCSM
- **Platform Surface:** Barber dashboard — team request list
- **Attack Vector:** Controller accepts `barberVportActorId` with no ownership verification. Any caller (authenticated) can enumerate pending team requests for any barber VPORT — obtaining barbershop profile IDs, actor IDs, resource UUIDs, and request timestamps.
- **Exploit Chain Type:** Single-step (unguarded read → enumeration)
- **Governance Status:** DRAFT
- **Result:** PARTIAL (UI-level gate present in hook; controller unguarded)
- **Evidence:** `vportTeam.controller.js` lines 60–63: `getBarberTeamRequestsController(barberVportActorId)` — no ownership check. Compare to `addTeamMemberController` (lines 29–41) which correctly calls `assertActorOwnsVportActorController`.
- **Defense Gate:** WEAK (hook-level only)
- **Blast Radius:** Read-only enumeration of pending team requests — feeds Attack Chain C.
- **Severity:** LOW
- **VENOM Finding Cross-Reference:** VBR-01 (ownership verification gap)
- **Recommended Fix:** Add `callerActorId` parameter and ownership gate: `await assertActorOwnsVportActorController({ requestActorId: callerActorId, targetActorId: barberVportActorId })` before DB fetch. Alternatively, gate via RLS using the authenticated session's actor context.
- **Layer to Fix:** Controller
- **Required Follow-up Command:** None required — LOW severity

---

### BLACKWIDOW ADVERSARIAL FINDING — BW-BAR-08

- **Finding ID:** BW-BAR-08
- **Scenario:** 5.5 Viewer Context Fuzz — Deleted resource state
- **Target:** `apps/VCSM/src/features/profiles/kinds/vport/dal/barbershop/vportBarbershopPost.read.dal.js` — `resolveVportBarbershopNameDAL`
- **Application Scope:** VCSM
- **Platform Surface:** System post text generation
- **Attack Vector:** `resolveVportBarbershopNameDAL` has no `is_deleted = false` or `is_active = true` filter. A deleted barbershop VPORT's name is returned and used in system post text, producing posts from/for deleted actors.
- **Exploit Chain Type:** State confusion (stale resource resolved as valid)
- **Governance Status:** DRAFT
- **Result:** PARTIAL
- **Evidence:** `vportBarbershopPost.read.dal.js` lines 6–14: `.from("profiles").select("name").eq("actor_id", actorId).maybeSingle()` — no lifecycle filter.
- **Defense Gate:** ABSENT
- **Blast Radius:** Low — only produces incorrect post text, does not enable data access.
- **Severity:** LOW
- **VENOM Finding Cross-Reference:** VBR-04 (is_deleted not filtered) — BlackWidow confirms same gap in this DAL
- **Recommended Fix:** Add `.eq("is_deleted", false).eq("is_active", true)` to the query.
- **Layer to Fix:** DAL
- **Required Follow-up Command:** None required — LOW severity

---

## Recommended Fixes

| Finding | Fix | Layer | Priority |
|---|---|---|---|
| BW-BAR-01 | Add `callerActorId` + `assertActorOwnsVportActorController` to `acceptQrJoin` | Controller | **CRITICAL — block release** |
| BW-BAR-02 | Replace string equality with `assertActorOwnsVportActorController` in `acceptTeamRequestController` | Controller | **HIGH — block release** |
| BW-BAR-03 | Add `callerActorId` + ownership gate to `publishBarbershopPortfolioUpdateAsPostController` | Controller | **HIGH — block release** |
| BW-BAR-04 | Add `callerActorId` + ownership gate to `publishBarbershopHoursUpdateAsPostController` | Controller | **HIGH — block release** |
| BW-BAR-05 | Replace `owner_user_id` lookup with actor_owners-based check | Controller | **MEDIUM** |
| BW-BAR-06 | Remove `resourceId` from notification context; remove raw UUID from `linkPath` | Controller | **MEDIUM** |
| BW-BAR-07 | Add `callerActorId` + ownership gate to `getBarberTeamRequestsController` | Controller | **LOW** |
| BW-BAR-08 | Add `is_deleted = false` filter to `resolveVportBarbershopNameDAL` | DAL | **LOW** |

---

## Required Follow-up Commands

| Command | Reason | Priority |
|---|---|---|
| **DB** | Verify `vport.resources` UPDATE RLS for `pending_onboarding` and `pending_acceptance` rows — BW-BAR-01, BW-BAR-02 | CRITICAL |
| **DB** | Verify `vc.posts` INSERT RLS for barbershop system post types — BW-BAR-03, BW-BAR-04 | HIGH |
| **ELEKTRA** | Trace source→sink chains for all confirmed BYPASSED findings and propose surgical patches | HIGH |
| **LOKI** | Validate runtime request telemetry for system post write and QR join paths to confirm exploit paths produce observable signals | MEDIUM |
| **HAWKEYE** | Audit all notification payloads for raw UUID exposure across the full notification system | MEDIUM |
| **ARCHITECT** | Audit all write-path controllers using string equality ownership checks (`actorId === targetActorId`) — VBR-01 systemic pattern | MEDIUM |
| **THOR** | Evaluate CRITICAL and HIGH findings as release blockers for current branch | HIGH |

---

## Pending Reviews

| Command | Reason | Status |
|---|---|---|
| DB | Verify vport.resources RLS — CRITICAL dependency for BW-BAR-01/02 | PENDING |
| DB | Verify vc.posts INSERT RLS — HIGH dependency for BW-BAR-03/04 | PENDING |
| ELEKTRA | Patch proposals for all BYPASSED findings | PENDING |
| LOKI | Runtime trace for confirmed exploit paths | PENDING |
| HAWKEYE | Notification payload UUID audit | PENDING |
| THOR | Release block evaluation | PENDING |

---

*BLACKWIDOW is read-only. No production code was modified. All findings are adversarial simulation results.*
*Harnesses produced separately in `zNOTFORPRODUCTION/_ACTIVE/redteam-harnesses/`.*
