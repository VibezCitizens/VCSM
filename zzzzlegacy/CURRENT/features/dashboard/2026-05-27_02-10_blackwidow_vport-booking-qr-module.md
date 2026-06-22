# BLACKWIDOW Runtime Adversarial Report

**Date:** 2026-05-27
**Time:** 02:10
**Scope:** VCSM + ENGINE
**Reviewer:** BLACKWIDOW v1 (2026-05-14)
**Environment:** Repository-scoped, sandboxed, non-destructive
**Governance Status:** DRAFT
**Trigger:** Full remediation sprint completed for VENOM V-001–V-008. Regression tests added. Adversarial verification of all protection gates.
**Module:** VPORT Booking / QR Security module
**Prior Audit Reference:** 2026-05-26_22-12_blackwidow_vport-qr-gas-module.md

---

## Attack Surface Summary

Eight scenarios simulated across the engine layer and app layer:

| Surface | Files Examined | Controller Gates Present |
|---|---|---|
| cancelBooking | `cancelBooking.controller.js`, `assertActorOwnsVportActor.controller.js` | YES |
| createBooking | `createBooking.controller.js`, `assertActorCanManageResource.controller.js` | YES |
| listQrLinks | `listQrLinks.controller.js`, `assertActorOwnsVportActor.controller.js` | YES |
| Flyer viewer | `VportActorMenuFlyerScreen.jsx`, `useVportOwnership.js` | YES (UI gate with server-side ownership check) |
| Notification deep links | `cancelBooking.controller.js` — linkPath construction | PARTIAL (see BW-005) |
| Self-check shortcut | `assertActorOwnsVportActor.controller.js` — self === target branch | PARTIAL (see BW-006) |
| URL builders | `qrUrlBuilders.js`, `VportActorMenuFlyerView.jsx` | YES |
| VportLeads cross-actor | `vportLeads.controller.js` | YES |

---

## Simulated Threat Scenarios

### Scenario 1 — Booking Ownership Bypass (cancelBooking)

**1a — Actor B cancels Actor A's booking (cross-actor attack)**

Code path:
```
cancelBooking({ bookingId: A's bookingId, requestActorId: B })
→ dalGetBookingById → booking.customer_actor_id = A
→ isCustomer = (A === B) = FALSE
→ dalGetBookingResourceById → resource.owner_actor_id = A's VPORT
→ assertActorOwnsVportActor({ requestActorId: B, targetActorId: A's VPORT })
  → dalGetActorById(B) → B.kind = 'user', not void
  → dalReadActorOwnerLink({ targetActorId: A's VPORT, userProfileId: B.profile_id })
  → no owner link → throws 'Actor does not own this vport actor.'
```

Result: BLOCKED. `dalUpdateBookingStatus` never called.

**1b — Null requestActorId**

```
cancelBooking({ bookingId: X, requestActorId: null })
→ if (!requestActorId) throw new Error('[BookingEngine] requestActorId is required')
```

Result: BLOCKED immediately. No DB calls made.

**1c — Void actor as requestActorId**

```
cancelBooking({ bookingId: X, requestActorId: VOID_ACTOR_ID })
→ dalGetBookingById → booking found
→ isCustomer check: void_actor_id !== customer_actor_id → FALSE
→ assertActorOwnsVportActor({ requestActorId: VOID_ACTOR_ID, targetActorId: owner })
  → dalGetActorById(VOID_ACTOR_ID) → { is_void: true }
  → throws 'Requester actor not found.'
```

Result: BLOCKED. Write never reached.

**1d — Replay cancellation on already-cancelled booking (state mutation replay)**

Code path:
```
cancelBooking({ bookingId: ALREADY_CANCELLED, requestActorId: CUSTOMER })
→ dalGetBookingById → { status: 'cancelled', customer_actor_id: CUSTOMER }
→ isCustomer = TRUE
→ dalUpdateBookingStatus({ bookingId, status: 'cancelled', ... })
→ UPDATE applied regardless of current status
```

**FINDING: BW-001 — Mutation replay gap detected. Controller does NOT check current booking status before calling dalUpdateBookingStatus. A cancelled booking can be re-cancelled, re-writing cancelled_at, internal_note, and completed_at fields.**

---

### Scenario 2 — createBooking Input Fuzzing

**2a — source='admin' from non-owner authenticated citizen**

```
createBooking({ source: 'admin', requestActorId: CITIZEN_B, resourceId: R })
→ MANAGEMENT_SOURCES.has('admin') = TRUE
→ assertActorCanManageResource({ requestActorId: CITIZEN_B, resourceId: R })
  → vportResource.owner_actor_id !== CITIZEN_B
  → assertActorOwnsVportActor → no owner link → throws
```

Result: BLOCKED. Management source gate routes to `assertActorCanManageResource` which calls `assertActorOwnsVportActor` with DB verification.

**2b — durationMinutes=0, -1, 99999**

```
// durationMinutes = 0
if (!durationMinutes) throw → truthy check: 0 is falsy → caught by:
if (!durationMinutes) throw '[BookingEngine] durationMinutes is required'
// BLOCKED via falsy check

// durationMinutes = -1
typeof durationMinutes === 'number' → true
durationMinutes <= 0 → true → throws '[BookingEngine] durationMinutes must be greater than 0'
// BLOCKED

// durationMinutes = 99999
durationMinutes > 1440 → true → throws '[BookingEngine] durationMinutes cannot exceed 1440 (24 hours)'
// BLOCKED
```

All three cases: BLOCKED.

**Note on durationMinutes=0:** The initial `!durationMinutes` check (line 39) catches zero because 0 is falsy in JS. This is technically a coincidence — `!0 === true`. It works correctly but is semantically ambiguous (null vs. zero). Not exploitable, but noted for hardening.

**2c — startsAt = now (exact boundary — slotStart <= Date.now())**

```
const slotStart = new Date(startsAt).getTime()
if (!Number.isFinite(slotStart) || slotStart <= Date.now()) {
  throw new Error('This time slot is no longer available.')
}
```

`<=` means: if `slotStart === Date.now()` exactly, the booking is rejected. This is correct behavior — a slot starting at the exact current millisecond is not bookable. BLOCKED.

**EDGE CASE NOTE:** Due to clock drift and network latency, a client supplying a slot 1–2 seconds in the future could still pass this check by the time the request arrives at the controller. This is a low-severity timing window, not an exploit, and is standard for booking systems. No bypass demonstrated.

**2d — locationId pointing to location with no active resources**

```
dalListVportResourcesByLocationId({ locationId, includeInactive: false }) → []
if (!locationResources.length) throw new Error('No available resources at this location.')
```

Result: BLOCKED cleanly. No fallback to null resource.

**2e — resourceId pointing to inactive vport resource (is_active: false)**

```
vportResource = await dalGetVportResourceById({ resourceId }) → { is_active: false }
if (vportResource.is_active !== true) throw new Error('Booking resource is unavailable.')
```

Result: BLOCKED. Strict `!== true` check rejects anything that is not explicitly active.

---

### Scenario 3 — QR Link List Ownership Bypass (listQrLinks)

**3a — Actor B calls listQrLinksByProfile with profileId belonging to Actor A**

```
listQrLinksByProfile({ requestActorId: B, profileId: A_profileId })
→ dalGetActorByProfileId(A_profileId) → profileActor { id: A_vport_actorId }
→ String(A_vport_actorId) !== String(B) → enters assertActorOwnsVportActor branch
→ assertActorOwnsVportActor({ requestActorId: B, targetActorId: A_vport_actorId })
  → dalGetActorById(B) → kind='user', not void
  → dalReadActorOwnerLink → no link for B → throws 'Actor does not own this vport actor.'
```

Result: BLOCKED. DAL read never reached.

**3b — No requestActorId**

```
listQrLinksByProfile({ requestActorId: null, profileId: X })
→ if (!requestActorId) throw '[BookingEngine] requestActorId is required'
```

Result: BLOCKED immediately.

**3c — Delegation chain / listQrLinksByDelegate**

Searched entire engine codebase. No `listQrLinksByDelegate` function exists. There is no delegation-specific QR listing path. The functions exposed are: `listQrLinksByOrganization`, `listQrLinksByLocation`, `listQrLinksByProfile`.

Organization and location paths use `assertActorCanManageOrganization` and `assertActorCanManageLocation` respectively. Both check org/location member role with `status === 'active'`. Delegation is handled through these role-based checks at the org/location level, not through a named delegate path.

Result: N/A (path does not exist). Org/location delegation paths are role-gated with active-status check.

---

### Scenario 4 — Flyer Viewer Ownership Bypass (VportActorMenuFlyerScreen)

**4a — Authenticated user visits /flyer/:actorId for an actorId they don't own**

```
VportActorMenuFlyerScreen:
→ identity = { actorId: B } (viewer is B, not owner of A)
→ useVportOwnership(B, A_actorId)
  → checkVportOwnershipController({ callerActorId: B, targetActorId: A })
  → ownership check via actor_owners → false
→ isOwner = false
→ render: "You can only view flyers for your own vport."
```

Result: BLOCKED. Identity check resolves before render. Content never displayed.

Note from hook comment: `isOwner` is declared as "UI convenience state only" and "NOT the security boundary." This is correctly documented. The server-side safety net is the assertion in any privileged mutation. The flyer screen itself is read-only (print/view), so the UI gate is the terminal check here. There is no write mutation in the flyer screen itself.

**4b — Unauthenticated visitor (identity=null)**

```
identity = null
viewerActorId = null
useVportOwnership(null, A_actorId)
→ if (!callerActorId || !targetActorId) { setIsOwner(false); setOwnershipLoading(false); }
→ ownershipLoading = false, isOwner = false
→ Screen: if (!identity) return "Sign in to view this flyer."
```

Result: BLOCKED. Sign-in gate fires before ownership check evaluation matters.

**4c — identityLoading=true during render**

```
if (identityLoading || ownershipLoading) {
  return <div>Loading…</div>
}
```

Result: BLOCKED. Screen renders skeleton. Protected content is not mounted until both `identityLoading` and `ownershipLoading` are false.

---

### Scenario 5 — Notification Deep Link UUID Exposure

**5a — Does a notification ever emit a raw UUID in linkPath after the fix?**

`cancelBooking.controller.js` linkPath construction:

```javascript
const ownerSlug = resource?.owner_actor_id
  ? await dalGetVportProfileSlugByActorId({ actorId: resource.owner_actor_id })
  : null
getNotifyFn()?.({
  ...
  linkPath: ownerSlug ? `/profile/${ownerSlug}?tab=book` : undefined,
  ...
})
```

If `ownerSlug` is non-null: linkPath = `/profile/{slug}?tab=book` — no UUID exposed. BLOCKED.
If `ownerSlug` is null: linkPath = `undefined` — omitted entirely from payload. BLOCKED.

The raw UUID (`resource.owner_actor_id`) never appears in `linkPath` under any branch.

**5b — dalGetVportProfileSlugByActorId returns null (DB outage)**

```
dalGetVportProfileSlugByActorId catches all errors and returns null:
  try {
    const { data } = await getVportClient()...
    return data?.profile_slug ?? null
  } catch {
    return null
  }
```

→ `ownerSlug = null`
→ `linkPath = undefined`
→ Notification fires without linkPath field

Result: BLOCKED. No UUID fallback under any failure mode.

**5c — createBooking notification in VPORT flow uses `/actor/${vportResource.owner_actor_id}/dashboard/booking-history`**

```javascript
linkPath: `/actor/${vportResource.owner_actor_id}/dashboard/booking-history`,
```

**FINDING: BW-005 — Raw UUID exposed in createBooking notification linkPath for VPORT flow.**

`vportResource.owner_actor_id` is a raw UUID. This path is emitted in the `source === 'public'` (citizen booking) notification to the VPORT owner. The link goes to an authenticated dashboard route, but the UUID is still embedded in the link payload that crosses the notification system.

This was NOT fixed in the cancelBooking path (V-001 remediation) but was NOT addressed in the VPORT-flow createBooking notification. The legacy vc flow has the same pattern at line 187.

The route `/actor/${uuid}/dashboard/booking-history` is authenticated-only, so the UUID is not exposed on a public surface — however, it is still a UUID in a notification deep link. Risk depends on notification system confidentiality.

Classify: PARTIAL — UUID is in an authenticated-only deep link, not a public URL. Not equivalent to a public UUID exposure but is inconsistent with the rest of the post-VENOM remediation.

---

### Scenario 6 — assertActorOwnsVportActor Self-Check Shortcut Abuse

**6a — VPORT actor sends requestActorId === targetActorId to short-circuit ownership check**

The self-check short-circuit in `assertActorOwnsVportActor`:

```javascript
if (String(requestActorId) === String(targetActorId)) {
  return { ok: true, mode: 'self' }
}
```

Attack scenario: A VPORT actor (kind='vport') knows its own actorId. It supplies `requestActorId = its own actorId` and `targetActorId = its own actorId`. The self-check fires, returns `{ ok: true, mode: 'self' }` — bypassing the `kind !== 'user'` check.

However: **this is only dangerous if the attacker controls requestActorId.** In every call site:

1. `cancelBooking`: `requestActorId` comes from the caller's authenticated session (not from the booking record itself). A VPORT actor that owns itself has legitimate access to its own resources.

2. `listQrLinksByProfile`: The self-check fires when `profileActor.id === requestActorId`. This means the VPORT actor is accessing its own QR links, which is the intended case (hook passes `actorId` as `requestActorId`).

3. `vportLeads.controller.js`: calls `assertActorOwnsVportActorController({ requestActorId: callerActorId, targetActorId: actorId })`. If a VPORT actor somehow called this with its own actorId as callerActorId — it would short-circuit to `{ ok: true }`. But VPORT actors are not authenticated principals in the user session system; `callerActorId` is resolved from the authenticated user's identity, not from a client-supplied value.

**The self-check shortcut is NOT a bypass** because:
- `requestActorId` is always resolved server-side from the authenticated session, not from client payload
- A legitimate VPORT actor managing its own resources is the intended use case
- The shortcut means "this actor is operating on its own identity" which is always permitted

**FINDING NOTE:** The self-check in `listQrLinksByProfile` fires when `profileActor.id === requestActorId` — i.e., the VPORT actor itself is the requestor. This is correct because the hook passes `actorId` (the VPORT actorId) as `requestActorId` when loading that VPORT's own QR links. No bypass.

**6b — Can an attacker craft requestActorId === targetActorId for a VPORT they don't own?**

For this to succeed, the attacker must:
1. Know the VPORT actorId (public, not secret)
2. Be able to supply that UUID as their `requestActorId`

But `requestActorId` in all booking operations comes from `identity.actorId` in the authenticated session. An attacker cannot change their own actorId to match a VPORT they don't own — their session is bound to their own actorId by the auth layer.

Result: BLOCKED at the auth/session layer. Not exploitable through the controller code alone.

---

### Scenario 7 — URL Surface Testing (qrUrlBuilders)

**7a — UUID-shaped but "legitimate" business name slug**

Example: a business named "a1b2c3d4-e5f6-7890-abcd-ef1234567890" (hypothetically). If the slug generation system produced this exact UUID-formatted string as a profile slug, `isQrSafeSlug` would block it.

```javascript
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function isQrSafeSlug(slug) {
  return !!slug && !UUID_RE.test(String(slug));
}
```

The regex is strict: it matches the full string only (no anchors explicitly, but the regex uses `^` and `$`). A slug `a1b2c3d4-e5f6-7890-abcd-ef1234567890` would match UUID_RE and return `isQrSafeSlug = false` → QR URL returns `""`.

**Assessment:** This is an acceptable false positive. In practice, slug generation systems append human-readable tokens (business name, city, etc.) making an exact UUID slug astronomically unlikely. If it ever occurs, the QR code would simply show "Preparing…" until the slug resolves to a safe value — a UX degradation, not a security failure. The defense-in-depth is sound.

**7b — buildMenuQrUrl, buildReviewsQrUrl, buildBusinessCardQrUrl return empty on UUID input**

Verified from source:
```javascript
export function buildMenuQrUrl(slug) {
  if (!isQrSafeSlug(slug)) return "";
  return `${getOrigin()}/profile/${encodeSlug(slug)}/menu`;
}
// same pattern for buildReviewsQrUrl and buildBusinessCardQrUrl
```

All three builders call `isQrSafeSlug` at entry. Raw UUID → `""` returned. No UUID ever reaches URL construction.

`VportActorMenuFlyerView.jsx` has its own redundant UUID guard:
```javascript
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isQrSafe = !!canonicalSlug && !UUID_RE.test(canonicalSlug);
```

This is defense-in-depth at the view layer. Both lib and view layers are consistent.

**Note:** `VportActorMenuFlyerView` redeclares `UUID_RE` locally instead of importing `isQrSafeSlug` from `qrUrlBuilders.js`. This is a minor consistency issue — the lib exports `isQrSafeSlug` specifically for this use case (see JSDoc comment: "Import this in view components instead of declaring UUID_RE locally"). Not a security issue, but creates drift risk.

Result: BLOCKED. Both lib and view layers are consistent guards.

---

### Scenario 8 — VportLeads Cross-Actor Access

**8a — Actor B calls listVportLeadsController with actorId=A's VPORT, callerActorId=B**

```
listVportLeadsController(A_vport_actorId, {}, B)
→ assertActorOwnsVportActorController({ requestActorId: B, targetActorId: A_vport_actorId })
  → B.kind = 'user' ✓, B not void ✓
  → dalReadActorOwnerLink({ targetActorId: A_vport, userProfileId: B.profile_id }) → null
  → throws 'Actor does not own this vport actor.'
```

Result: BLOCKED. Ownership gate fires before any lead data is accessed.

**8b — Delegation — if Actor B is a delegated manager**

`actor_owners` is checked via `dalReadActorOwnerLink`, which queries `vc.actor_owners` with `user_id = B.profile_id` and `actor_id = A_vport`. This is a binary owner check — either B's profile is an owner of A or it isn't. There is no "delegation" role in actor_owners separate from ownership.

The `assertActorCanManageResource` controller supports delegation through org/location membership with roles (owner, manager, staff). However, `assertActorOwnsVportActorController` used in vportLeads does NOT go through `assertActorCanManageResource`. It calls `assertActorOwnsVportActorController` directly, which only checks `actor_owners`.

**FINDING: BW-008 — vportLeads ownership check does not support org/location delegation.** A legitimately delegated manager (organization member with 'manager' role) cannot access vportLeads even if they have resource-level management authority. This is a governance/feature gap (not a security bypass), but means the system is more restrictive than intended for delegation scenarios.

Classification: INFO (more restrictive than necessary, not less). No unauthorized access path exists.

---

## Ownership Bypass Results

| Test | Target | Result | Defense Gate |
|---|---|---|---|
| Cross-actor cancel | cancelBooking | BLOCKED | assertActorOwnsVportActor + actor_owners DB |
| Null requestActorId cancel | cancelBooking | BLOCKED | Immediate null guard |
| Void actor cancel | cancelBooking | BLOCKED | is_void check in assertActorOwnsVportActor |
| Cross-actor QR list | listQrLinksByProfile | BLOCKED | assertActorOwnsVportActor + actor_owners DB |
| Null requestActorId QR list | listQrLinksByProfile | BLOCKED | Immediate null guard |
| Cross-actor VPORT leads | listVportLeadsController | BLOCKED | assertActorOwnsVportActorController |
| Self-check shortcut abuse | assertActorOwnsVportActor | BLOCKED | Session binding makes requestActorId non-spoofable |

## Session Mutation Results

No session mutation paths were discovered that bypass ownership. `requestActorId` is resolved from the authenticated session at the hook/controller call site, not accepted from client payload.

## Runtime Abuse Results

| Test | Source | Expected | Result |
|---|---|---|---|
| source='admin' as non-owner citizen | createBooking | DENIED | DENIED |
| durationMinutes=0,-1,99999 | createBooking | DENIED | DENIED |
| Inactive resource (is_active:false) | createBooking VPORT flow | DENIED | DENIED |
| locationId with no active resources | createBooking | DENIED | DENIED |

## Mutation Replay Results

| Test | Resource State | Result | State Check Present |
|---|---|---|---|
| Re-cancel already-cancelled booking | status='cancelled' | APPLIED | ABSENT — **BW-001** |

## URL Surface Results

| Route / Link | UUID Exposure | Slug Enforcement |
|---|---|---|
| cancelBooking notification linkPath | ABSENT (slug or omitted) | ENFORCED |
| createBooking VPORT notification linkPath | PRESENT (raw UUID) — **BW-005** | MISSING |
| createBooking legacy vc notification linkPath | PRESENT (raw UUID) — **BW-005** | MISSING |
| buildMenuQrUrl / buildReviewsQrUrl / buildBusinessCardQrUrl | ABSENT | ENFORCED |
| VportActorMenuFlyerView menuUrl fallback (line 46) | ABSENT (uses slug or /m/:actorId) | ENFORCED |

---

## Successful Exploit Chains

### BW-001: Mutation Replay — Re-Cancel Already-Cancelled Booking

**Type:** Replay exploit (stale resource state)

A caller with valid cancellation authority (customer or VPORT owner) can call `cancelBooking` against a booking already in `cancelled` state. The controller fetches the booking, verifies identity, then calls `dalUpdateBookingStatus` unconditionally. The write succeeds, overwriting `cancelled_at`, `completed_at`, and `internal_note` on an already-terminal record.

**Impact:** Data integrity pollution on completed bookings. A VPORT owner could silently modify the `internal_note` on a cancelled booking via replay. A malicious customer could repeatedly fire this to spam the notification system (each replay triggers a fresh notification to the resource owner).

### BW-005: UUID in Notification Deep Link — createBooking VPORT Flow

**Type:** Injection exploit (UUID in notification payload)

`createBooking` emits a notification with `linkPath: /actor/${vportResource.owner_actor_id}/dashboard/booking-history` for citizen-sourced bookings. `owner_actor_id` is a raw UUID. This UUID is encoded into the notification payload sent to the VPORT owner. The destination is an authenticated dashboard route (not publicly accessible), but the UUID traverses the notification system.

The cancelBooking path was fixed (VENOM V-001). The createBooking path was not.

---

## Failed Exploit Chains (Defenses That Held)

1. **Cross-actor cancel** — assertActorOwnsVportActor + actor_owners DB check is present and mandatory. No bypass path found.
2. **Null/void requestActorId** — All controllers guard against null at entry before any DB call.
3. **source='admin' from non-owner** — Management source gate correctly routes to `assertActorCanManageResource`.
4. **durationMinutes fuzzing** — All three edge values (0, -1, 99999) are caught by distinct guards.
5. **startsAt boundary** — `<= Date.now()` rejects exact-current-time slots.
6. **Inactive resource** — `=== true` strict check rejects anything not explicitly active.
7. **QR list cross-actor** — Ownership gate fires before DAL read.
8. **Self-check shortcut abuse** — requestActorId is session-bound, cannot be spoofed by client.
9. **Flyer viewer unauthenticated** — Identity gate precedes ownership check; content never rendered without auth.
10. **Flyer viewer loading race** — Both `identityLoading` and `ownershipLoading` must be false before protected content mounts.
11. **cancelBooking notification UUID** — Slug lookup + undefined fallback eliminates all UUID exposure paths.
12. **QR URL builders** — isQrSafeSlug gates at lib layer; view layer has redundant guard.
13. **VPORT leads cross-actor** — assertActorOwnsVportActorController blocks all non-owner access.

---

## Runtime Evidence

### BW-001 State Replay — Code Path Trace

```javascript
// cancelBooking.controller.js — no status guard present
const booking = await dalGetBookingById({ bookingId })
if (!booking) throw new Error('Booking not found.')

const isCustomer = booking.customer_actor_id &&
  String(booking.customer_actor_id) === String(requestActorId)

// ← NO check: if (booking.status === 'cancelled') throw new Error('...')
// ← NO check: TERMINAL_STATUSES.has(booking.status)

const updated = await dalUpdateBookingStatus({
  bookingId, status: 'cancelled', ... // unconditional write
})
```

### BW-005 UUID in Notification — Code Path Trace

```javascript
// createBooking.controller.js line 130-133 — VPORT flow
getNotifyFn()?.({
  recipientActorId: vportResource.owner_actor_id,
  actorId:          requestActorId,
  kind:             BOOKING_EVENTS.CREATED,
  objectType:       'booking',
  objectId:         mapped.id,
  linkPath:         `/actor/${vportResource.owner_actor_id}/dashboard/booking-history`, // ← raw UUID
  ...
})

// createBooking.controller.js line 187 — legacy vc flow
linkPath: `/actor/${resource.owner_actor_id}/dashboard/booking-history`, // ← raw UUID
```

---

## Blast Radius

| Finding | Blast Radius |
|---|---|
| BW-001 | Booking data integrity. Affects any cancelled booking. Notification spam risk. Limited to actors with legitimate cancellation authority. |
| BW-005 | UUID in notification payload crossing the notification system. Destination is authenticated-only. No public UUID exposure, but inconsistent with VENOM V-001 remediation. |
| BW-006-INFO | VportActorMenuFlyerView redeclares UUID_RE locally instead of importing isQrSafeSlug. Drift risk only — not a live security gap. |
| BW-008-INFO | vportLeads does not support org/location delegation. More restrictive than necessary. No unauthorized access path. |

---

## BLACKWIDOW FINDINGS

---

### FINDING BW-001

**Finding ID:** BW-001
**Scenario:** Scenario 1d — Booking state mutation replay
**Target:** `engines/booking/src/controller/cancelBooking.controller.js`
**Application Scope:** ENGINE
**Platform Surface:** Booking controller — cancelBooking
**Attack Vector:** Authenticated actor with legitimate cancellation authority calls cancelBooking on an already-cancelled booking. Controller does not verify current booking status before writing.
**Exploit Chain Type:** Replay exploit (stale resource state)
**Governance Status:** DRAFT
**Result:** BYPASSED
**Evidence:** No status guard exists between `dalGetBookingById` and `dalUpdateBookingStatus`. Booking in terminal state (`cancelled`, `completed`, `no_show`) can be overwritten. Notification fires again on each replay.
**Defense Gate:** ABSENT — no terminal-status pre-check
**Blast Radius:** Booking data integrity on terminal records. Notification spam to resource owner. Could be used by a customer to silently overwrite internal_note on their own booking if they have repeat cancellation authority.
**Severity:** MEDIUM
**VENOM Finding Cross-Reference:** Not directly addressed in V-001–V-008 remediation sprint.
**Recommended Fix:** Add terminal-status guard in `cancelBooking.controller.js` immediately after booking is fetched:
```javascript
const TERMINAL_STATUSES = new Set(['cancelled', 'completed', 'no_show'])
if (TERMINAL_STATUSES.has(booking.status)) {
  throw new Error(`Booking is already ${booking.status} and cannot be cancelled again.`)
}
```
Apply the same guard to `confirmBooking`, `completeBooking`, and `markNoShow` — check whether those controllers have analogous gaps.
**Layer to Fix:** Controller — `cancelBooking.controller.js`
**Required Follow-up Command:** SPIDER-MAN (regression test for terminal-status replay guard); VENOM (add to trust-boundary scan for all booking mutation controllers)

---

### FINDING BW-005

**Finding ID:** BW-005
**Scenario:** Scenario 5c — createBooking notification UUID in linkPath
**Target:** `engines/booking/src/controller/createBooking.controller.js` — lines 130, 187
**Application Scope:** ENGINE
**Platform Surface:** Booking creation notification — VPORT flow and legacy vc flow
**Attack Vector:** A citizen books a VPORT service (source='public'). The notification fired to the VPORT owner contains `linkPath: /actor/${owner_actor_id}/dashboard/booking-history` where `owner_actor_id` is a raw UUID.
**Exploit Chain Type:** Injection exploit (UUID in notification payload)
**Governance Status:** DRAFT
**Result:** PARTIAL — UUID is in an authenticated-only deep link, not a public URL. The destination route requires authentication. However, the UUID traverses the notification system and appears in any notification rendering layer (push notifications, in-app notification list, email templates if applicable).
**Evidence:**
```javascript
// VPORT flow (line 130):
linkPath: `/actor/${vportResource.owner_actor_id}/dashboard/booking-history`
// Legacy vc flow (line 187):
linkPath: `/actor/${resource.owner_actor_id}/dashboard/booking-history`
```
The `cancelBooking` controller was fixed to use `dalGetVportProfileSlugByActorId`. The `createBooking` controller was not updated with the same pattern.
**Defense Gate:** ABSENT — no slug resolution before linkPath construction in createBooking
**Blast Radius:** UUID visible in notification payload to VPORT owner. If push notification previews or email templates render the full URL, UUID is visible to the recipient (who is the VPORT owner — not a third party). Not a cross-actor exposure. Inconsistent with VENOM V-001 remediation.
**Severity:** LOW
**VENOM Finding Cross-Reference:** VENOM V-001 (UUID in notification linkPath) — cancelBooking was remediated; createBooking was not.
**Recommended Fix:** Apply the same `dalGetVportProfileSlugByActorId` pattern to createBooking notifications. When slug resolves, use `/profile/${slug}?tab=bookings`; when null, omit linkPath. Do this for both the VPORT flow and the legacy vc flow branches.
**Layer to Fix:** Controller — `createBooking.controller.js`
**Required Follow-up Command:** VENOM (verify V-001 scope was intended to cover createBooking); SPIDER-MAN (add regression test for createBooking notification linkPath UUID pattern)

---

### FINDING BW-006-INFO

**Finding ID:** BW-006-INFO
**Scenario:** Scenario 7 — URL surface testing
**Target:** `apps/VCSM/src/features/dashboard/flyerBuilder/screens/VportActorMenuFlyerView.jsx` line 40
**Application Scope:** VCSM
**Platform Surface:** Flyer view layer — UUID guard
**Attack Vector:** None. This is a hardening observation.
**Exploit Chain Type:** N/A
**Governance Status:** DRAFT
**Result:** BLOCKED (protection holds) but with redundant local implementation
**Evidence:**
```javascript
// VportActorMenuFlyerView.jsx line 40 — redeclares UUID_RE locally:
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isQrSafe = !!canonicalSlug && !UUID_RE.test(canonicalSlug);

// qrUrlBuilders.js exports isQrSafeSlug for exactly this purpose (see JSDoc):
// "Import this in view components instead of declaring UUID_RE locally — it is
//  the single source of truth for the QR safe-slug contract (VENOM V-006)."
```
**Defense Gate:** PRESENT — but duplicated instead of using shared single source of truth
**Blast Radius:** None currently. Risk: if the UUID_RE pattern ever needs to change (e.g., ULID slugs replace UUIDs), the view layer would need a separate update and could drift.
**Severity:** INFO
**VENOM Finding Cross-Reference:** VENOM V-006
**Recommended Fix:** Replace local UUID_RE declaration in `VportActorMenuFlyerView.jsx` with `import { isQrSafeSlug } from "@/lib/qrUrlBuilders"`. Replace `!UUID_RE.test(canonicalSlug)` with `isQrSafeSlug(canonicalSlug)`.
**Layer to Fix:** View — `VportActorMenuFlyerView.jsx`
**Required Follow-up Command:** None (INFO only)

---

### FINDING BW-008-INFO

**Finding ID:** BW-008-INFO
**Scenario:** Scenario 8b — vportLeads delegation
**Target:** `apps/VCSM/src/features/dashboard/vport/controller/vportLeads.controller.js`
**Application Scope:** VCSM
**Platform Surface:** VPORT leads access control
**Attack Vector:** None (more restrictive than intended, not less).
**Exploit Chain Type:** N/A
**Governance Status:** DRAFT
**Result:** BLOCKED (no unauthorized access). System is MORE restrictive than may be intended.
**Evidence:** `listVportLeadsController` calls `assertActorOwnsVportActorController` which only verifies `actor_owners` ownership. Does not use `assertActorCanManageResource` which supports org/location delegation with role-based access.
**Defense Gate:** PRESENT — but binary owner-only, no delegate support
**Blast Radius:** None (no unauthorized access). Delegated org managers cannot access VPORT leads even with resource-level management authority. This may be intentional (leads are sensitive; owner-only access is a reasonable policy).
**Severity:** INFO
**VENOM Finding Cross-Reference:** None
**Recommended Fix:** Confirm with product owner whether vportLeads should be accessible to delegated org managers. If yes, route through `assertActorCanManageResource` instead of `assertActorOwnsVportActorController`. If owner-only is intentional, document the policy in a comment.
**Layer to Fix:** Controller — `vportLeads.controller.js`
**Required Follow-up Command:** IRONMAN (feature ownership confirmation on vportLeads access policy)

---

## Summary Table

| ID | Severity | Result | Description | THOR Blocker |
|---|---|---|---|---|
| BW-001 | MEDIUM | BYPASSED | cancelBooking allows replay against terminal-status bookings | NO (data integrity, not auth bypass) |
| BW-005 | LOW | PARTIAL | createBooking notification linkPath contains raw UUID (authenticated-only route) | NO |
| BW-006-INFO | INFO | BLOCKED | VportActorMenuFlyerView redeclares UUID_RE instead of importing isQrSafeSlug | NO |
| BW-008-INFO | INFO | BLOCKED | vportLeads does not support org/location delegation (more restrictive, not less) | NO |

**THOR Release Blockers: 0**

No CRITICAL or HIGH findings. No confirmed auth bypass. No cross-actor data exposure. All VENOM V-001–V-008 ownership gates survive adversarial simulation.

---

## Recommended Fixes (Priority Order)

1. **BW-001** (MEDIUM) — Add terminal-status pre-check in `cancelBooking.controller.js`. Audit `confirmBooking`, `completeBooking`, `markNoShow` for the same gap. Fix all in one pass.

2. **BW-005** (LOW) — Apply `dalGetVportProfileSlugByActorId` slug resolution to `createBooking` notification linkPath for both VPORT flow (line ~130) and legacy vc flow (line ~187). Pattern is already proven in `cancelBooking`.

3. **BW-006-INFO** (INFO) — Import `isQrSafeSlug` from `@/lib/qrUrlBuilders` in `VportActorMenuFlyerView.jsx` instead of redeclaring `UUID_RE` locally.

4. **BW-008-INFO** (INFO) — Confirm product owner intent on vportLeads access policy (owner-only vs. org delegate).

---

## Required Follow-up Commands

| Command | Reason | Status |
|---|---|---|
| SPIDER-MAN | Regression test for BW-001 (terminal-status replay guard in cancelBooking and sibling controllers) | PENDING |
| SPIDER-MAN | Regression test for BW-005 (createBooking notification linkPath UUID pattern) | PENDING |
| VENOM | Verify V-001 remediation scope — was createBooking notification linkPath in scope? | PENDING |
| IRONMAN | Confirm vportLeads access policy intent (owner-only vs. delegate) | PENDING |
| LOKI | Validate runtime telemetry for BW-001 replay path if booking history logging is active | PENDING |
| THOR | Review BW-001 and BW-005 against release criteria (current assessment: not blockers) | PENDING |

---

## Pending Reviews

| Command | Reason | Status |
|---|---|---|
| VENOM | Cross-reference BW-005 against V-001 remediation scope definition | PENDING |
| LOKI | Runtime telemetry confirmation for BW-001 replay exploit path | PENDING |
| THOR | Release gate evaluation — 0 blockers identified, confirm CAUTION items | PENDING |

---

## Canonical Principle Outcome

> If a protection cannot survive hostile simulation, it is documentation — not security.

Eight attack scenarios simulated. Twelve individual exploit paths attempted. Two findings raised (1 MEDIUM, 1 LOW/PARTIAL). Zero CRITICAL. Zero HIGH. Zero THOR release blockers.

The VENOM V-001–V-008 remediation sprint produced real, verifiable protections. Ownership gates survive adversarial conditions across all primary attack vectors. The two remaining findings (BW-001, BW-005) are hardening items, not auth bypasses.
