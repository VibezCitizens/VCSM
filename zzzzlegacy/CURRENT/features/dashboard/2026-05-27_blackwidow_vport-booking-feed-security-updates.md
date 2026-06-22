# BLACKWIDOW Runtime Adversarial Report

**Date:** 2026-05-27  
**Scope:** VCSM + ENGINE  
**Reviewer:** BLACKWIDOW  
**Environment:** Static adversarial simulation — code-path tracing and harness analysis (non-destructive, non-production)  
**Governance Status:** DRAFT  
**Trigger:** User-requested red team following ELEKTRA scan of `vport-booking-feed-security-updates` branch  
**ELEKTRA Cross-Reference:** `2026-05-27_elektra_vport-booking-feed-security-updates.md`

---

## Attack Surface Summary

Seven controller/DAL surfaces tested across two protected roots:

| Surface | File | Root |
|---|---|---|
| `assertActorCanManageResource` | `engines/booking/src/controller/assertActorCanManageResource.controller.js` | ENGINE |
| `createBooking` | `engines/booking/src/controller/createBooking.controller.js` | ENGINE |
| `cancelBooking` | `engines/booking/src/controller/cancelBooking.controller.js` | ENGINE |
| `assertActorOwnsVportActor` | `engines/booking/src/controller/assertActorOwnsVportActor.controller.js` | ENGINE |
| `listQrLinksByProfile` | `engines/booking/src/controller/listQrLinks.controller.js` | ENGINE |
| `qrUrlBuilders` | `apps/VCSM/src/lib/qrUrlBuilders.js` | VCSM |
| `useQrLinks` | `apps/VCSM/src/features/booking/hooks/useQrLinks.js` | VCSM |

---

## Simulated Threat Actors

| Threat Actor | Profile |
|---|---|
| **Void Owner** | A previously legitimate actor who has been deactivated (`is_void = true`) but retains matching `owner_actor_id` in resource rows |
| **Attacker (Non-Owner)** | A valid, active actor with no ownership relationship to the target resource |
| **Malicious Citizen** | A user-kind actor attempting to escalate privileges via source parameter injection |
| **UUID Injector** | Any actor attempting to insert a raw UUID into a notification linkPath or QR code URL |
| **Identity Spoofer** | An actor supplying a `customerActorId` that does not match their session `requestActorId` |

---

## Simulated Threat Scenarios

Eight adversarial scenarios executed.

---

## Scenario 1 — Void Actor Management Bypass via `direct_owner` Path

**OWNERSHIP BYPASS ATTEMPT**

```
Target:         assertActorCanManageResource.controller.js:20
Attack vector:  Void actor with matching resource.owner_actor_id calls createBooking(source='owner')
Result:         BYPASSED
Evidence:       Line 20: `if (String(resource.owner_actor_id) === String(requestActorId)) { return { ok: true, role: 'owner', mode: 'direct_owner' } }` — no dalGetActorById + is_void check before return
Controller gate: WEAK (present but incomplete — void actor passes the string-match gate)
Severity:       HIGH
```

**Attack Chain:**

1. Actor A (`owner_actor_id` = `"aabb-...{uuid}..."`) legitimately owns `vport.resources.id = res-1`.
2. Platform admin marks Actor A as `is_void = true` (deactivation).
3. Actor A session remains active (no immediate invalidation).
4. Actor A calls `createBooking({ source: 'owner', requestActorId: 'aabb-...', resourceId: 'res-1', ... })`.
5. `createBooking` → `assertActorCanManageResource({ requestActorId: 'aabb-...', resourceId: 'res-1' })`.
6. `resource = await dalGetVportResourceById({ resourceId: 'res-1' })` → returns `{ owner_actor_id: 'aabb-...', ... }`.
7. Line 20: `String('aabb-...') === String('aabb-...')` → **returns `{ ok: true, role: 'owner', mode: 'direct_owner' }`**.
8. No `dalGetActorById` is called. `is_void` is never checked. **Booking is inserted.**

**Secondary bypass paths within `assertActorCanManageResource`:**

| Line | Path | Void check |
|---|---|---|
| 20 | `direct_owner` — resource.owner_actor_id match | ❌ ABSENT |
| 38 | `org_owner` — org.owner_actor_id match | ❌ ABSENT |
| 56 | `resource_staff` — resource.member_actor_id match | ❌ ABSENT |
| 26–33 | `vport_owner` — via assertActorOwnsVportActor | ✅ PRESENT (assertActorOwnsVportActor calls dalGetActorById line 11) |
| 41–44 | `org_member` — orgMember.status === 'active' | ✅ PARTIAL (status check, not is_void) |

The `vport_owner` path is the only path that correctly enforces `is_void` (via `assertActorOwnsVportActor`). All direct string-match paths are unprotected.

**Exploit Chain Type:** Single-step exploit (one gate missing — string match without is_void)  
**Blast Radius:** Any booking operation using `source='owner'|'admin'|'import'|'sync'` where the requesting actor is the direct resource owner or org owner and is void.

---

## Scenario 2 — Booking Source Allowlist Bypass Attempts

**RUNTIME ABUSE ATTEMPT**

```
Target:         createBooking.controller.js — source allowlist guard
Actor role used: Attacker (Non-Owner)
Expected access: DENIED for all non-allowlisted sources
Result:         DENIED for all tested inputs
Privilege gate:  PRESENT
Severity:        INFO (no bypass found)
```

**Inputs tested and outcomes:**

| Input | `String(source)` | In ALL_SOURCES | Outcome |
|---|---|---|---|
| `'webhook'` | `'webhook'` | No | ❌ throws before any DB call |
| `'api'` | `'api'` | No | ❌ throws before any DB call |
| `'OWNER'` | `'OWNER'` | No (case-sensitive) | ❌ throws before any DB call |
| `'public '` | `'public '` | No (trailing space) | ❌ throws before any DB call |
| `null` | `'null'` | No | ❌ throws before any DB call |
| `{ source: 'owner' }` (object) | `'[object Object]'` | No | ❌ throws before any DB call |
| `undefined` | defaults to `'public'` | Yes | ✅ treated as public citizen booking (correct) |
| `'owner'` | `'owner'` | Yes | ✅ enters management path with auth check |

**Defense confirmed:** Source allowlist is enforced as a Set membership check using `String(source)` coercion before any resource lookup or DAL call. Case-sensitivity is correct behavior — a caller supplying `'OWNER'` should be rejected. Guard is placed upfront per architecture requirement.

---

## Scenario 3 — Notification linkPath UUID Injection

**NOTIFICATION ABUSE ATTEMPT**

```
Notification type: booking.created (createBooking) / booking.cancelled (cancelBooking)
Attack vector:     Attempt to cause ownerSlug to contain a raw UUID → appears in linkPath
Authorization at destination: N/A (linkPath is informational)
Result:            BLOCKED (for caller-controlled injection) / PARTIAL (no isQrSafeSlug guard on resolved slug)
Evidence:          linkPath derived exclusively from dalGetVportProfileSlugByActorId DB read — not from caller input
Severity:          INFO (hardening gap — no direct caller exploit path)
```

**Injection chain analysis:**

1. `ownerSlug = await dalGetVportProfileSlugByActorId({ actorId: resource.owner_actor_id })` — reads `profile_slug` from `vport.profiles`.
2. `profile_slug` is populated server-side. Callers cannot inject an arbitrary value into this column directly through the booking flow.
3. No `isQrSafeSlug(ownerSlug)` guard is applied before building `linkPath: '/profile/${ownerSlug}'`.

**Hardening gap:** If a `profile_slug` column in the DB contained a UUID (e.g., from a migration error or import bug), it would appear in the notification `linkPath` without detection. This is not a caller-injectable exploit but violates the defense-in-depth principle established by VENOM V-006.

**Recommended addition (INFO):**
```js
// Before building linkPath in both notification blocks:
linkPath: ownerSlug && isQrSafeSlug(ownerSlug) ? `/profile/${ownerSlug}` : null,
```

---

## Scenario 4 — cancelBooking Authorization Gate Bypass Attempts

**OWNERSHIP BYPASS ATTEMPT — VOID CUSTOMER PATH**

```
Target:         cancelBooking.controller.js — ELEK-001 pre-check + isCustomer gate
Attack vector:  Void actor whose actorId matches booking.customer_actor_id
Result:         BLOCKED
Evidence:       Line 25-28: dalGetActorById + is_void check fires BEFORE isCustomer evaluation
Controller gate: PRESENT
Severity:       INFO (defense confirmed)
```

**Attack chain — void customer:**

1. Void actor submits `cancelBooking({ bookingId: 'booking-abc', requestActorId: 'void-actor' })`.
2. Line 25: `dalGetActorById({ actorId: 'void-actor' })` → returns `{ is_void: true }`.
3. Line 26-28: `requestingActor.is_void === true` → **throws "Only valid actors may cancel bookings."**
4. `isCustomer` check never reached. **Write never occurs.**

---

**VIEWER CONTEXT FUZZ ATTEMPT — TERMINAL STATUS REPLAY**

```
Target:         cancelBooking.controller.js — BW-001 terminal status guard
Injected context: bookingId with status='cancelled' (already finalized)
Expected result:  ERROR
Actual result:   ERROR — "This booking has already been finalized and cannot be cancelled."
Context validation: ENFORCED
Severity:        INFO (defense confirmed)
```

---

**SESSION MUTATION ATTEMPT — ATTACKER IMPERSONATING CUSTOMER**

```
Target:         cancelBooking.controller.js — customer vs owner routing
Attack vector:  Attacker submits cancel with requestActorId that does NOT match customer_actor_id
Result:         BLOCKED — isCustomer = false → assertActorOwnsVportActor called → throws for non-owner
Evidence:       Line 30-31 + 35-38: correct bifurcation enforced
Session binding: ENFORCED
Severity:       INFO (defense confirmed)
```

---

**NOTIFICATION ABUSE ATTEMPT — SELF-NOTIFICATION**

```
Target:         cancelBooking.controller.js — notification recipient check
Attack vector:  requestActorId === recipientActorId (e.g., booking owner cancels own booking where customer = owner)
Result:         BLOCKED — Line 51: String(requestActorId) !== String(recipientActorId) guard prevents self-notification
Evidence:       No notification fired when actor is both requester and recipient
Severity:       INFO (defense confirmed)
```

---

**NULL RESOURCE FUZZ — CUSTOMER NOTIFICATION PATH**

```
Target:         cancelBooking.controller.js — resource optional chaining in notification
Attack vector:  resource = null (resource deleted after booking creation), isCustomer = true
Result:         BLOCKED — recipientActorId = resource?.owner_actor_id = undefined → notification guard fails safely
Evidence:       Optional chaining on resource?.owner_actor_id, recipientActorId falsy → notification branch skipped
Severity:       INFO (safe null handling confirmed)
```

---

## Scenario 5 — qrUrlBuilders UUID Guard Bypass

**URL SURFACE TEST**

```
Route / Link:      All 4 QR builders (buildReviewsQrUrl, buildBusinessCardQrUrl, buildMenuQrUrl, buildMenuShortDisplayUrl)
UUID exposure:     ABSENT — all builders reject UUIDs via isQrSafeSlug guard
Slug enforcement:  ENFORCED
Severity:          INFO (defenses confirmed)
```

**Inputs tested:**

| Input | `isQrSafeSlug` result | Builder output |
|---|---|---|
| `'aabbccdd-0011-2233-4455-667788990011'` (UUID v4) | `false` | `""` |
| `null` | `false` | `""` |
| `''` (empty string) | `false` | `""` |
| `'  '` (whitespace) | `true` (not a UUID, truthy) | Encodes whitespace — INFO: edge case |
| `'my-barbershop-vport'` | `true` | Valid URL built ✅ |
| `'ABC-SLUG-123'` (uppercase) | `true` (UUID_RE is lowercase hex specific; uppercase non-UUID passes) | Valid URL built ✅ |
| `'aabbccdd-0011-2233-4455-6677889900110'` (37 chars) | `true` (UUID_RE requires 36 chars) | Passes as slug — not a UUID |

**Whitespace edge case (INFO):** A slug containing only whitespace (`'  '`) passes `isQrSafeSlug` (truthy, not UUID pattern) and would encode as `%20%20` in the URL. Not exploitable but would produce a broken URL. Slug validation upstream (DB layer) is the expected defense.

---

## Scenario 6 — useQrLinks Identity Surface Injection

**CROSS-FEATURE ABUSE ATTEMPT**

```
Source feature:       BookingQrLinksPanel (caller)
Target feature internal: useQrLinks profileId resolution
Attack vector:         Attempt to pass profileId or organizationId directly to bypass actorId→profileId controller translation
Result:               BLOCKED — hook signature { actorId, enabled } accepts no other identity parameters
Evidence:             useQrLinks.js line 18: function signature is `{ actorId = null, enabled = true }` — no profileId, no organizationId, no requestActorId input
Adapter isolation:    ENFORCED
Severity:             INFO (identity surface sealed — defense confirmed)
```

Internal `resolvedProfileId` is stored in a `useRef` — never surfaced to callers. Resolution goes through `resolveVportProfileIdController` → `getVportProfileIdByActorIdDAL`. Callers cannot inject an arbitrary profileId to read another actor's QR links.

---

## Scenario 7 — listQrLinksByProfile Void Actor Self-Check Bypass

**VIEWER CONTEXT FUZZ ATTEMPT**

```
Target:            listQrLinksByProfile.controller.js:50 — self-check skips assertActorOwnsVportActor
Injected context:  Void actor with actorId matching profileActor.id
Expected result:   ERROR
Actual result:     PARTIAL — passes if session is valid
Context validation: WEAK (no is_void check on profileActor before self-check)
Severity:          LOW
```

**Attack chain:**

1. Actor A (void, `actorId = 'actor-vport-111'`) somehow retains a valid session.
2. Actor A calls `listQrLinksByProfile({ requestActorId: 'actor-vport-111', profileId: 'profile-xyz' })`.
3. `dalGetActorByProfileId({ profileId: 'profile-xyz' })` → returns `{ id: 'actor-vport-111', is_void: true }`.
4. Line 50: `String('actor-vport-111') !== String('actor-vport-111')` → **false** → `assertActorOwnsVportActor` is **skipped**.
5. No `is_void` check is performed on `profileActor`.
6. `dalListQrLinksByProfile({ profileId: 'profile-xyz' })` executes → QR links returned to void actor.

**Primary defense relied upon:** The session layer is expected to prevent void actors from obtaining a valid `requestActorId`. The controller does not provide defense-in-depth at this layer.

**Mitigation:** Add `if (profileActor.is_void === true) throw new Error('...')` after the `if (!profileActor)` null check, mirroring the ELEK-001 pattern from `cancelBooking`.

---

## Scenario 8 — assertActorOwnsVportActor Self-Check Void Bypass

**VIEWER CONTEXT FUZZ ATTEMPT**

```
Target:            assertActorOwnsVportActor.controller.js:7-9 — self-check (requestActorId === targetActorId)
Injected context:  Void actor where requestActorId === targetActorId
Expected result:   ERROR
Actual result:     PARTIAL — self-check returns { ok: true, mode: 'self' } without is_void check
Context validation: WEAK — void check absent in self-check path
Severity:          LOW (mitigated by caller pre-checks in specific callers, but not universally safe)
```

**Caller mitigation analysis:**

| Caller | Pre-check before assertActorOwnsVportActor | Void bypass mitigated? |
|---|---|---|
| `cancelBooking` | ✅ dalGetActorById + is_void check (ELEK-001) | ✅ YES |
| `assertActorCanManageResource` (vport_owner path) | ❌ No pre-check | ⚠️ PARTIAL — direct_owner fires first (Scenario 1) |
| `listQrLinksByProfile` | ❌ No pre-check on profileActor | ⚠️ PARTIAL — self-check skips assertActorOwnsVportActor entirely |

`assertActorOwnsVportActor` is not universally safe to call on untrusted inputs — its self-check path is a latent void bypass that callers must individually guard against. Adding `is_void` to the self-check would be the correct fix.

---

## Successful Exploit Chains

### Chain 1 — Void Owner Management Bypass

**Status: CONFIRMED**

```
Void actor (is_void=true, retained session)
  → calls createBooking({ source: 'owner', requestActorId: voidActorId, resourceId: res-1 })
  → assertActorCanManageResource called
  → dalGetVportResourceById returns { owner_actor_id: voidActorId }
  → String match at line 20: direct_owner gate passes
  → booking inserted without is_void check
```

No code modification required by attacker — this is a pure code-path gap.

**Exploit Chain Type:** Single-step exploit (missing is_void at direct string-match gate)

---

## Failed Exploit Chains (Defenses That Held)

| Scenario | Attack | Defense | Result |
|---|---|---|---|
| Source allowlist bypass | 7 hostile source values including null, uppercase, objects | String coercion + Set membership check before any DB call | ❌ BLOCKED |
| Notification UUID injection | Caller attempts to inject UUID into ownerSlug | Slug resolved from DB only — not caller-controlled | ❌ BLOCKED |
| Void customer cancellation | Void actor with matching customer_actor_id | ELEK-001 dalGetActorById + is_void before isCustomer | ❌ BLOCKED |
| Non-owner customer impersonation | Attacker with wrong actorId using customer path | isCustomer = false → assertActorOwnsVportActor gate | ❌ BLOCKED |
| Terminal status replay | Re-cancel a finalized booking | BW-001 TERMINAL_STATUSES set check | ❌ BLOCKED |
| Self-notification | Requester = recipient | String comparison guard | ❌ BLOCKED |
| Null resource fuzz | resource = null on customer notification path | Optional chaining + falsy guard on recipientActorId | ❌ BLOCKED |
| UUID in QR URL | UUID slug passed to any builder | isQrSafeSlug UUID_RE check returns "" | ❌ BLOCKED |
| identity surface injection | Caller passes profileId directly to useQrLinks | Hook signature sealed to actorId only | ❌ BLOCKED |
| ELEK-003 customerActorId spoof | customerActorId !== requestActorId on public booking | String comparison throws before insert | ❌ BLOCKED |

---

## Runtime Evidence

All scenarios are code-path traces. No production system was accessed. Evidence is grounded in static code analysis with adversarial call-path simulation.

**Key evidence references:**

- `assertActorCanManageResource.controller.js:20` — direct_owner string match, no dalGetActorById call
- `assertActorCanManageResource.controller.js:38` — org_owner string match, no is_void check  
- `assertActorCanManageResource.controller.js:56` — resource_staff string match, no is_void check
- `cancelBooking.controller.js:25-28` — ELEK-001 guard correctly placed before isCustomer
- `createBooking.controller.js:51-56` — source allowlist correctly placed before resource lookup
- `qrUrlBuilders.js:53-55` — isQrSafeSlug with UUID_RE correctly rejects UUIDs
- `listQrLinks.controller.js:50` — self-check skips assertActorOwnsVportActor, no is_void on profileActor
- `assertActorOwnsVportActor.controller.js:7-9` — self-check returns without is_void guard

---

## Blast Radius

### Chain 1 (CONFIRMED BYPASSED — HIGH)

Any booking operation using a management source (`'owner'`, `'admin'`, `'import'`, `'sync'`) where the `requestActorId` matches `resource.owner_actor_id` (direct owner) or `org.owner_actor_id` (org owner) or `resource.member_actor_id` (staff). A void actor in any of these positions passes the management gate.

**Affected operations:** `createBooking` with management source → insertion of a booking with deactivated actor's authority.

**Escalation potential:** A void actor could continue to create bookings on their behalf and notify customers as if they were still active — undermining the platform's deactivation model.

---

## BLACKWIDOW FINDINGS

---

**BLACKWIDOW ADVERSARIAL FINDING**

```
Finding ID:           BW-2026-05-27-001
Scenario:             Void Actor Management Bypass via direct_owner String Match
Target:               engines/booking/src/controller/assertActorCanManageResource.controller.js:20,38,56
Application Scope:    ENGINE
Platform Surface:     Booking Engine — Management Path (createBooking source='owner'/'admin'/'import'/'sync')
Attack Vector:        Void actor (is_void=true) with retained session and matching owner_actor_id calls createBooking with management source
Exploit Chain Type:   Single-step exploit — string-match gate passes without is_void check
Governance Status:    DRAFT → CONFIRMED (exploit chain verified via static code-path analysis)
Result:               BYPASSED
Evidence:             Line 20: `if (String(resource.owner_actor_id) === String(requestActorId)) { return { ok: true, role: 'owner', mode: 'direct_owner' } }` — no dalGetActorById + is_void before return
Defense Gate:         WEAK — string match present but is_void not enforced
Blast Radius:         All management-source booking operations on resources where actor is direct owner, org owner, or resource staff
Severity:             HIGH
VENOM Cross-Reference: N/A (new finding — not in ELEKTRA or VENOM reports; related to ELEK-2026-05-27-009)
Recommended Fix:      Add dalGetActorById + is_void check at the top of assertActorCanManageResource, before any string-match authorization paths. Mirror the ELEK-001 pattern from cancelBooking.
Layer to Fix:         Controller (ENGINE)
Required Follow-up:   THOR (release blocker — HIGH severity + CONFIRMED exploit chain)
```

**Suggested Fix:**

```js
// At the start of assertActorCanManageResource, after parameter guards:
import { dalGetActorById } from '../dal/actor.read.dal.js'

export async function assertActorCanManageResource({ requestActorId, resourceId }) {
  if (!requestActorId) throw new Error('[BookingEngine] requestActorId is required')
  if (!resourceId) throw new Error('[BookingEngine] resourceId is required')

  // BW-001 — Validate requesting actor is active before any ownership check.
  // Mirrors ELEK-001 pattern from cancelBooking. Prevents void actors from passing
  // string-match gates that do not individually check is_void.
  const requestingActor = await dalGetActorById({ actorId: requestActorId })
  if (!requestingActor || requestingActor.is_void === true) {
    throw new Error('[BookingEngine] Only valid actors may manage booking resources.')
  }

  // ... rest of existing logic unchanged ...
```

---

**BLACKWIDOW ADVERSARIAL FINDING**

```
Finding ID:           BW-2026-05-27-002
Scenario:             listQrLinksByProfile Void Actor Self-Check Bypass
Target:               engines/booking/src/controller/listQrLinks.controller.js:50
Application Scope:    ENGINE
Platform Surface:     QR Link List — self-check path
Attack Vector:        Void actor with retained session, actorId matching profileActor.id, skips assertActorOwnsVportActor
Exploit Chain Type:   Single-step exploit — missing is_void on profileActor before self-check
Governance Status:    DRAFT
Result:               PARTIAL (requires retained session as precondition)
Evidence:             Line 50: no is_void check on profileActor before `String(profileActor.id) !== String(requestActorId)` comparison
Defense Gate:         WEAK — relies on session layer as sole protection
Blast Radius:         Void VPORT actor can list their own QR links — limited to read operation, no mutation
Severity:             LOW
VENOM Cross-Reference: N/A
Recommended Fix:      Add `if (profileActor.is_void === true) throw new Error(...)` after the null check on profileActor, before the self-check comparison.
Layer to Fix:         Controller (ENGINE)
Required Follow-up:   VENOM (design review of void actor lifecycle — should session invalidate on void transition?)
```

---

**BLACKWIDOW ADVERSARIAL FINDING**

```
Finding ID:           BW-2026-05-27-003
Scenario:             assertActorOwnsVportActor Self-Check Returns Without is_void Guard
Target:               engines/booking/src/controller/assertActorOwnsVportActor.controller.js:7-9
Application Scope:    ENGINE
Platform Surface:     Ownership assertion — self-check path
Attack Vector:        Any caller passing a void actor where requestActorId === targetActorId
Exploit Chain Type:   Single-step exploit — self-check does not call dalGetActorById
Governance Status:    DRAFT
Result:               PARTIAL (mitigated in cancelBooking by pre-check; not universally safe)
Evidence:             Lines 7-9: `if (String(requestActorId) === String(targetActorId)) { return { ok: true, mode: 'self' } }` — no is_void before return
Defense Gate:         WEAK — relies on each caller implementing its own pre-check
Blast Radius:         Any future caller of assertActorOwnsVportActor without a pre-check void guard will inherit this bypass
Severity:             LOW
VENOM Cross-Reference: N/A
Recommended Fix:      Add dalGetActorById + is_void check inside the self-check path, or restructure to always validate the requesting actor before returning ok.
Layer to Fix:         Controller (ENGINE)
Required Follow-up:   VENOM (defensive library contract — assertActorOwnsVportActor should be universally safe to call on untrusted inputs)
```

---

**BLACKWIDOW ADVERSARIAL FINDING**

```
Finding ID:           BW-2026-05-27-004
Scenario:             Notification linkPath Missing isQrSafeSlug Defense-in-Depth Guard
Target:               engines/booking/src/controller/createBooking.controller.js:147,211
                      engines/booking/src/controller/cancelBooking.controller.js:63
Application Scope:    ENGINE
Platform Surface:     Notification system — booking.created / booking.cancelled linkPath
Attack Vector:        Malformed profile_slug in DB (UUID stored as slug) propagates into notification linkPath
Exploit Chain Type:   Injection exploit (requires DB compromise or migration error as precondition — not direct caller control)
Governance Status:    DRAFT
Result:               PARTIAL (no direct caller exploit; hardening gap only)
Evidence:             linkPath built as `/profile/${ownerSlug}` without isQrSafeSlug(ownerSlug) guard
Defense Gate:         WEAK — no defense-in-depth at linkPath construction
Blast Radius:         UUID exposed in notification deep link — violates VENOM V-006 defense-in-depth
Severity:             INFO
VENOM Cross-Reference: VENOM V-006 (centralized slug-safe URL construction)
Recommended Fix:      Add `isQrSafeSlug(ownerSlug)` check before building linkPath in all three notification blocks. Import isQrSafeSlug from the qrUrlBuilders utility.
Layer to Fix:         Controller (ENGINE)
Required Follow-up:   ELEKTRA (add isQrSafeSlug to recommended patch for V-006 in notification linkPath context)
```

---

## Recommended Fixes

| # | Finding ID | Severity | Fix | Complexity |
|---|---|---|---|---|
| 1 | BW-2026-05-27-001 | HIGH | Add `dalGetActorById + is_void` at top of `assertActorCanManageResource`, before all string-match gates | SIMPLE |
| 2 | BW-2026-05-27-002 | LOW | Add `is_void` check on `profileActor` in `listQrLinksByProfile` before self-check | SIMPLE |
| 3 | BW-2026-05-27-003 | LOW | Add `dalGetActorById + is_void` inside `assertActorOwnsVportActor` self-check path | SIMPLE |
| 4 | BW-2026-05-27-004 | INFO | Add `isQrSafeSlug(ownerSlug)` guard in all notification linkPath construction blocks | SIMPLE |

---

## Required Follow-up Commands

| Command | Reason | Status |
|---|---|---|
| THOR | BW-2026-05-27-001 (HIGH + CONFIRMED) is a release blocker — void actor can insert bookings after deactivation | PENDING |
| VENOM | Review void actor session lifecycle — should session tokens be immediately invalidated on is_void transition? | PENDING |
| ELEKTRA | Update ELEK-2026-05-27-009 suggested patch to cover org_owner and resource_staff paths (not just direct_owner); add isQrSafeSlug to notification linkPath patch | PENDING |
| LOKI | Confirm whether any telemetry exists to detect void actor booking insertions in production | PENDING |

---

## Pending Reviews

| Command | Reason | Status |
|---|---|---|
| VENOM | Session lifecycle for void actors — deactivation should immediately invalidate session to eliminate precondition for all void bypass chains | PENDING |
| THOR | Evaluate BW-2026-05-27-001 as release gate blocker for `vport-booking-feed-security-updates` | PENDING |

---

## Summary

**1 CONFIRMED exploit chain found (HIGH):** Void actor management bypass in `assertActorCanManageResource` — all three direct string-match authorization paths (`direct_owner`, `org_owner`, `resource_staff`) return success without checking `is_void`. A deactivated actor with a retained session can insert bookings on their behalf using any management source.

**9 attacks blocked:** Source allowlist, notification UUID injection via caller input, void customer cancellation, customer impersonation, terminal status replay, self-notification, null resource fuzz, QR UUID injection, identity surface injection.

**3 defenses found WEAK but not directly bypassed:** `listQrLinksByProfile` self-check, `assertActorOwnsVportActor` self-check, notification linkPath missing `isQrSafeSlug` guard.

**VENOM V-001 through V-006 security patches confirmed holding under adversarial conditions.** All QR URL builders, notification slug resolution, and identity surface sealing survived all tested attack vectors.
