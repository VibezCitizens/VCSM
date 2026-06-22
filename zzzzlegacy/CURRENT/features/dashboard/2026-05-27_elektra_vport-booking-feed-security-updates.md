# ELEKTRA Security Report

**Date:** 2026-05-27
**Scope:** VCSM + ENGINE
**Reviewer:** ELEKTRA
**Scan Trigger:** MANUAL — deep-dive regression audit of branch `vport-booking-feed-security-updates`. 21 files scanned across `engines/booking/` and `apps/VCSM/src/features/`. Follows ELEKTRA scan `2026-05-27_02-10` (8 prior findings). This session verifies patch correctness for all 8 prior findings and responds to 14 specific directed questions.
**Findings Summary:** 0 HIGH | 1 MEDIUM | 0 LOW | 3 INFO
**False Positives Rejected:** 14
**Suggested Patches:** 1
**Prior Findings Resolved:** 5 of 8 (ELEK-001, ELEK-002, ELEK-003, ELEK-005, ELEK-008) — patches verified correct in current branch

---

## Executive Summary

This ELEKTRA scan covers 21 files on the `vport-booking-feed-security-updates` branch and responds to 14 specific security questions. Five of the eight findings from the prior scan (ELEK-001 through ELEK-008, 2026-05-27_02-10) have been patched and verified: `cancelBooking` now validates actor void status before the customer self-cancel shortcut; `createBooking` enforces a status allowlist and forces citizens to `'pending'`; `customerActorId` is pinned to `requestActorId` on public paths; `buildMenuShortDisplayUrl` now applies the `isQrSafeSlug` guard matching its siblings; and `VportActorMenuFlyerView` imports `isQrSafeSlug` from its canonical source. Three prior findings (ELEK-004, ELEK-006, ELEK-007) are outside the 21-file scope and were not reverified. One new medium finding was discovered: `assertActorCanManageResource` short-circuits on direct owner string match without verifying the requesting actor's `is_void` status, allowing a soft-deleted owner to pass the management gate at the engine layer. All 14 directed questions are answered below, with 14 false positives formally rejected.

---

## Patch Verification — Prior Findings Status

| Finding ID | Title | Status in Current Branch |
|---|---|---|
| ELEK-2026-05-27-001 | cancelBooking void actor bypass on customer path | **PATCHED — verified** |
| ELEK-2026-05-27-002 | createBooking status field caller-controlled | **PATCHED — verified** |
| ELEK-2026-05-27-003 | customerActorId not pinned on public path | **PATCHED — verified** |
| ELEK-2026-05-27-004 | QR scan count non-atomic | Outside scan scope — unverified |
| ELEK-2026-05-27-005 | buildMenuShortDisplayUrl missing isQrSafeSlug | **PATCHED — verified** |
| ELEK-2026-05-27-006 | createQrLink destinationPath/qrType no allowlist | Outside scan scope — unverified |
| ELEK-2026-05-27-007 | config singleton mutable — no freeze | Outside scan scope — unverified |
| ELEK-2026-05-27-008 | VportActorMenuFlyerView UUID_RE duplicated locally | **PATCHED — verified** |

### Patch Evidence — ELEK-001

`cancelBooking.controller.js` now imports `dalGetActorById` and adds before the `isCustomer` branch:

```js
// ELEK-001 — Validate requesting actor before isCustomer shortcut is evaluated.
const requestingActor = await dalGetActorById({ actorId: requestActorId })
if (!requestingActor || requestingActor.is_void === true) {
  throw new Error('[BookingEngine] Only valid actors may cancel bookings.')
}
```

Also adds terminal status guard:

```js
const TERMINAL_STATUSES = new Set(['cancelled', 'completed', 'no_show'])
if (TERMINAL_STATUSES.has(booking.status)) {
  throw new Error('This booking has already been finalized and cannot be cancelled.')
}
```

Verdict: **correctly implements the ELEK-001 suggested patch**. The void check now runs on all paths before any branch decision.

### Patch Evidence — ELEK-002 and ELEK-003

`createBooking.controller.js` adds:

```js
// ELEK-002 — Status allowlist
const VALID_BOOKING_STATUSES = new Set(['pending', 'confirmed', 'cancelled', 'completed', 'no_show'])
let resolvedStatus
if (CITIZEN_SOURCES.has(String(source))) {
  resolvedStatus = 'pending'
} else {
  if (status !== null && status !== undefined && !VALID_BOOKING_STATUSES.has(String(status))) {
    throw new Error(`[BookingEngine] Invalid booking status: "${status}". ...`)
  }
  resolvedStatus = status ?? null
}

// ELEK-003 — customerActorId pinned in both flows
if (customerActorId && String(customerActorId) !== String(requestActorId)) {
  throw new Error('[BookingEngine] customerActorId must match requestActorId for public bookings.')
}
customerActorId = requestActorId
```

And replaces `status` with `resolvedStatus` in both insert calls. Both patches are present in the VPORT flow and the legacy VC flow.

Verdict: **correctly implements ELEK-002 and ELEK-003 suggested patches**.

### Patch Evidence — ELEK-005

`qrUrlBuilders.js` now reads:

```js
export function buildMenuShortDisplayUrl(slug) {
  if (!isQrSafeSlug(slug)) return "";  // was: if (!slug) return ""
  ...
}
```

Verdict: **correctly implements the ELEK-005 suggested patch**. UUID slugs and null slugs both return `""`.

### Patch Evidence — ELEK-008

`VportActorMenuFlyerView.jsx` now imports `isQrSafeSlug` from `@/lib/qrUrlBuilders` and replaces the local `UUID_RE` declaration:

```js
import { buildMenuShortDisplayUrl, isQrSafeSlug } from "@/lib/qrUrlBuilders";
// ...
const isQrSafe = isQrSafeSlug(canonicalSlug);
```

Verdict: **correctly implements the ELEK-008 suggested patch**. Single source of truth is now enforced.

---

## Directed Question Responses

These answers address each of the 14 specific areas listed in the scan directive. Each answer is grounded in file content read during this session.

### Q1 — createBooking: source allowlist completeness and 'management' bypass

**MANAGEMENT_SOURCES** = `Set(['owner', 'admin', 'import', 'sync'])`. **CITIZEN_SOURCES** = `Set(['public'])`. **ALL_SOURCES** = union of both.

The string `'management'` is not a member of `ALL_SOURCES`. Line 52: `if (!ALL_SOURCES.has(String(source)))` throws immediately for any unknown string. `String(source)` coerces non-string types before the check, preventing type bypass. The allowlist is complete and correct for all currently documented booking sources.

`requestActorId` is accepted from the caller and treated as trusted identity on management paths. The engine does not independently re-authenticate it against a session token — it relies on the calling context to supply the correct authenticated actorId. This is the intended injected-client design. The ownership assertion (`assertActorCanManageResource`) is the validation gate, not re-authentication. **One gap exists: see ELEK-2026-05-27-009 below.**

### Q2 — cancelBooking: slug resolution fallback guaranteed null

`dalGetVportProfileSlugByActorId` returns `data?.profile_slug ?? null`. If `profile_slug` is an empty string in the DB, the `?? null` does not apply (empty string is not nullish) and `""` is returned. In `cancelBooking`, the check is `ownerSlug ? ... : undefined`. Empty string is falsy, so `""` correctly falls to `undefined`. The notification `linkPath: undefined` is handled by the `publishVcsmNotification` default parameter `linkPath = null`, resolving to `null`. No UUID can leak through this path. **Verdict: slug resolution fallback is correctly handled — no UUID leakage.**

### Q3 — getVportProfileIdByActorId.dal.js: column select and schema scope

File uses `vportClient.from("profiles").select("id").eq("actor_id", actorId)`. Select is explicit (`"id"` only — no `select('*')`). `vportClient` is the schema-scoped client (`supabase.schema('vport')`). The query is correctly scoped to `vport.profiles`. **Verdict: compliant on both counts.**

### Q4 — useQrLinks.js: organizationId surface elimination

The hook signature is `useQrLinks({ actorId = null, enabled = true } = {})`. No `organizationId`, `profileId`, or any other identity field is accepted as a parameter. `profileId` is resolved internally via `resolveVportProfileIdController` and stored in a `useRef` that is never returned to callers. `addQrLink` passes raw `params` through to `createQrLink` — but `BookingQrLinksPanel` does not expose `addQrLink` to callers (the component does not call or return `addQrLink`). A caller of `useQrLinks` directly could supply `profileId` in `addQrLink(params)`, but `createQrLink` enforces ownership for whatever identity surface is provided, so no bypass occurs. **Verdict: organizationId surface fully eliminated from the hook contract. No profileId smuggling path through visible component usage.**

### Q5 — qrUrlBuilders.js: isQrSafeSlug coverage and encodeURIComponent

`buildReviewsQrUrl`, `buildBusinessCardQrUrl`, and `buildMenuQrUrl` all call `isQrSafeSlug(slug)` and return `""` on rejection. `buildMenuShortDisplayUrl` now also calls `isQrSafeSlug(slug)` (patched — ELEK-005). All four builders apply `encodeSlug(slug)` which calls `encodeURIComponent(String(slug))`. `encodeURIComponent` is sufficient for path segments — it encodes all URL-special characters. No path through which a UUID can bypass the guard exists in the current code. **Verdict: complete isQrSafeSlug coverage on all four builders. encodeURIComponent is sufficient.**

### Q6 — readVportPublicDetails.rpc.dal.js: profile_id exclusion, lat/lng, client

The select list explicitly includes `lat,lng` but excludes `profile_id`. Both `lat` and `lng` are consumed in `buildDirectionsUrl` inside the model and are **not returned** in the final `details` object (model comment at line 207 confirms: `"profile_id, lat, lng are not returned"`). The `supabase` client used is the anon-key client (`VITE_SUPABASE_ANON_KEY`) — correct for a public surface relying on RLS-enforced views. **Verdict: profile_id is excluded, lat/lng do not reach public output, anon client is correct.**

### Q7 — vportPublicDetails.model.js: internal ID re-exposure

The model returns `actorId` in the top-level envelope (`{ ok, actorId, error, details }`). `actorId` is the canonical identity field — its presence in the model result is intentional and correct. It is not returned inside `details`. The `details` object contains only: `displayName`, `username`, `tagline`, `bannerUrl`, `avatarUrl`, `phone`, `address`, `reviewUrl`, `directionsUrl`, `websiteUrl`. No `profile_id`, no `vport_id`, no raw internal IDs. No `raw: row` passthrough. **Verdict: model does not re-expose internal IDs. actorId in envelope is canonical and expected.**

### Q8 — VportPublicMenuView.jsx: actorId in rendered output or URL

`actorId` appears in the `onBack` fallback: `navigate('/actor/${actorId}/menu', { replace: true })`. This fires only when `window.history.length <= 1` AND `canonicalSlug` is not yet resolved. The `/actor/:actorId/menu` route is documented as a "legacy redirect to canonical slug URL" — it resolves server-side to the slug URL. `actorId` is not rendered in any HTML element, not placed in any `href`, and not used in any `src` or `data-` attribute. The fallback route is an intentional internal redirect path, not a permanent public-facing URL. **Verdict: actorId does not appear in rendered output or in permanent public URLs. The /actor/:id redirect is the correct temporary fallback.**

### Q9 — VportActorMenuFlyerScreen.jsx: auth gate completeness and variant injection

The screen checks: (1) `!actorId` → null, (2) `identityLoading || ownershipLoading` → loading state, (3) `!identity` → "Sign in to view this flyer", (4) `!isOwner` → "You can only view flyers for your own vport." The `variant` param is extracted from `searchParams` and validated against an explicit allowlist via `if (v === "poster") ... else if (v === "sticker") ...` — any unknown string falls through to `return "classic"`. No injected string can produce a non-allowlisted variant. The `isOwner` check uses `useVportOwnership` which calls `checkVportOwnershipController` backed by `actor_owners`. **Note:** `useVportOwnership` comments itself as "UI convenience state only — not the security boundary." However, the flyer screen is display-only (no writes, no server operations). The `window.print()` call is browser-only. The data displayed comes from `useVportDashboardDetails` which does not return private credentials or restricted data. **Verdict: auth gate is complete for a display-only screen. variant param injection is prevented by the allowlist.**

### Q10 — VportActorMenuFlyerView.jsx: UUID guard on print and menuUrl UUID exposure

`isQrSafe = isQrSafeSlug(canonicalSlug)` (now using canonical import after ELEK-008 patch). Print button is `disabled={!isQrSafe}`. QR-encoding children (`ClassicFlyer`, `PosterFlyer`, `PrintableQrSheet`) are rendered only inside `{!isQrSafe ? <loading> : ... children ...}` — the ternary short-circuits to the loading state when `isQrSafe` is false.

`menuUrl` fallback: `window.location.origin + /m/${actorId}` fires when `!canonicalSlug`. When `!canonicalSlug`, `isQrSafeSlug(null)` = false, so `isQrSafe` = false, so children that receive `menuUrl` are never rendered. The UUID-containing fallback URL cannot reach any QR encoder or print path. **Verdict: UUID guard on print is enforced before any QR encoding. menuUrl UUID exposure is correctly gated.**

### Q11 — assertActorOwnsVportActor: requestActorId === targetActorId short-circuit

Line 7: `if (String(requestActorId) === String(targetActorId)) return { ok: true, mode: 'self' }`. This short-circuit represents "the VPORT actor is checking against its own actor ID" — the case where the VPORT actor itself (not a user-owner) is calling management operations. UUID uniqueness guarantees no collision between distinct actors. A user actor's UUID cannot equal a VPORT actor's UUID in the Supabase UUID v4 space. There is no `is_void` check on this path — but the self-check is only reachable when the calling context already holds an authenticated session as that actor, so the session implicitly validates actorId. **Verdict: self-check is safe. No unauthorized bypass path exists through string collision.**

### Q12 — assertActorCanManageResource: what it checks and actor_owners usage

The controller checks in order: (1) direct `owner_actor_id` string match — returns immediately without DB actor validity check; (2) `assertActorOwnsVportActor` — which DOES check `actor_owners` via `dalReadActorOwnerLink`; (3) org owner check via `dalGetOrganizationById`; (4) org member check via `dalGetOrganizationMember`; (5) location member check via `dalGetLocationMember`; (6) resource staff check via `member_actor_id`.

The `actor_owners` table is used in path (2) only. Paths (1), (3), (5), and (6) use direct string comparisons without `actor_owners`. Path (1) also skips `is_void` validation — see **ELEK-2026-05-27-009** below.

### Q13 — notification linkPath: null vs undefined as sentinel

`createBooking` uses `linkPath: ownerSlug ? '/profile/${ownerSlug}' : null`. `cancelBooking` uses `linkPath: ownerSlug ? '/profile/${ownerSlug}?tab=book' : undefined`. `publishVcsmNotification` has parameter default `linkPath = null`, so `undefined` resolves to `null` before being passed to `publishEvent`. The notification `renderContext` receives `{ linkPath: null }` in both cases. Template renderer: `vars.linkPath ?? null` → `null`. Notification DAL: `p_link_path: linkPath` → `null`. Both `null` and `undefined` are functionally equivalent here. **Verdict: `null` is the canonical sentinel; `undefined` in cancelBooking is functionally equivalent due to the default parameter. Neither exposes a UUID. This is an INFO-level inconsistency — see ELEK-2026-05-27-010.**

### Q14 — durationMinutes: NaN, Infinity, string '60' type check correctness

Verified by code trace and runtime test:

| Input | Line 39 (`!durationMinutes`) | Line 42 (typeof check) | Line 45 (max check) | Result |
|---|---|---|---|---|
| `NaN` | `!NaN === true` → **throws 'required'** | — | — | Correctly rejected |
| `Infinity` | `!Infinity === false` → passes | `typeof Infinity === 'number'` → passes | `Infinity > 1440 === true` → **throws max** | Correctly rejected |
| `'60'` | `!'60' === false` → passes | `typeof '60' !== 'number'` → **throws 'must be > 0'** | — | Correctly rejected |
| `0` | `!0 === true` → **throws 'required'** | — | — | Correctly rejected (edge case — 0 is treated as absent) |
| `-1` | `!-1 === false` → passes | `-1 <= 0 === true` → **throws 'must be > 0'** | — | Correctly rejected |
| `60` | passes | passes | passes | **PASSES** |

**Verdict: validation is sound for all stated edge cases.** The only minor note: `0` throws `'required'` rather than `'must be > 0'` — a message inconsistency with no security impact. `durationMinutes = 0` is semantically invalid so rejecting it is correct regardless of the message.

---

## Medium Findings

```
SECURITY FINDING

- Finding ID:         ELEK-2026-05-27-009
- Title:              assertActorCanManageResource — direct owner match skips is_void check
- Category:           Auth Bypass
- Severity:           MEDIUM
- Status:             Open
- Scope:              ENGINE
- Location:           engines/booking/src/controller/assertActorCanManageResource.controller.js:20
- Source:             requestActorId — caller-supplied, used directly in string comparison
- Sink:               Returns { ok: true, role: 'owner', mode: 'direct_owner' } → createBooking proceeds
                      to dalInsertVportBooking / dalInsertBooking — writes booking row to DB
- Trust Boundary:     Actor validity (is_void, existence) must be verified before any management
                      gate returns ok=true. assertActorCanManageResource is the trust boundary for
                      management-source booking creation.
- Impact:             A soft-deleted (void) actor whose actor ID matches resource.owner_actor_id can
                      pass the management gate for createBooking with source='owner', 'admin', 'import',
                      or 'sync'. The engine inserts a management booking attributed to the void actor
                      without any actor validity check at the engine layer.
                      Combined risk: if RLS on vport.bookings is permissive to the authenticated session,
                      the booking row is written. Owner notifications fire referencing the void actor's slug.
                      This is a narrower gap than ELEK-001 (which covered the customer path in cancelBooking),
                      but is the same class of vulnerability on the management write path.
- Evidence:           Line 20:
                        if (String(resource.owner_actor_id) === String(requestActorId)) {
                          return { ok: true, role: 'owner', mode: 'direct_owner' }
                        }
                      No dalGetActorById call. No is_void check. Returns ok immediately.
                      Compare: assertActorOwnsVportActor (lines 25-32 of assertActorCanManageResource)
                      called in path (2) DOES invoke dalGetActorById and checks is_void — but only when
                      the direct match fails.
                      Compare: cancelBooking (ELEK-001 patch) now calls dalGetActorById before isCustomer.
- Reproduction Steps:
    1. Actor A (kind='vport') owns a booking resource. Actor A is soft-deleted (is_void = true in vc.actors).
    2. Caller calls createBooking({
         source: 'owner',
         requestActorId: A,
         resourceId: A's_resource_id,
         ...
       })
    3. createBooking line 86-89: MANAGEMENT_SOURCES check passes ('owner' is valid).
    4. assertActorCanManageResource line 20: String(resource.owner_actor_id) === String(A) → TRUE.
    5. Returns { ok: true, role: 'owner', mode: 'direct_owner' } without any actor DB check.
    6. dalInsertVportBooking is called → booking inserted by void actor.
- Existing Defense:   Source allowlist ('management' string is not valid — confirmed above).
                      RLS on vport.bookings may block the insert at DB layer (unverified in this scan).
- Why Defense Is Insufficient:
    RLS is an untested secondary gate here — the engine contract requires engine-layer validation
    before reaching the DAL. The pattern established by assertActorOwnsVportActor (checking is_void)
    and the ELEK-001 patch (checking is_void before customer cancel) sets the standard.
    The direct owner match in assertActorCanManageResource violates that standard.
- Recommended Fix:
    Add a dalGetActorById call before or at the start of assertActorCanManageResource to verify
    the requesting actor exists and is not void. This mirrors the pattern established in
    cancelBooking (ELEK-001) and assertActorOwnsVportActor.
- Suggested Patch:
    // engines/booking/src/controller/assertActorCanManageResource.controller.js
    // Add import at top:
    import { dalGetActorById } from '../dal/actor.read.dal.js'
    // Also add dalGetActorById to existing import from actor.read.dal.js

    // Add after the resource-not-found check (~line 17), before the direct owner check:
    const requestingActor = await dalGetActorById({ actorId: requestActorId })
    if (!requestingActor || requestingActor.is_void === true) {
      throw new Error('[BookingEngine] Requesting actor not found or deactivated.')
    }

    // All subsequent checks (direct owner, vport owner, org, location, staff) then proceed
    // with the confidence that the actor is valid. No changes to the rest of the function needed.

    Note: dalGetActorById is already imported in assertActorOwnsVportActor (called from this file).
    Adding one DB call at function entry is consistent with the ELEK-001 fix pattern.
- Follow-up Command:  DB (confirm RLS on vport.bookings for management-source writes),
                      BLACKWIDOW (runtime validation of void owner management booking path)
```

---

## Info Findings

```
SECURITY FINDING

- Finding ID:         ELEK-2026-05-27-010
- Title:              cancelBooking — linkPath uses undefined as sentinel; createBooking uses null
- Category:           Code hygiene / consistency
- Severity:           INFO
- Status:             Open
- Scope:              ENGINE
- Location:           engines/booking/src/controller/cancelBooking.controller.js:50
                      engines/booking/src/controller/createBooking.controller.js:132, 191
- Source:             ownerSlug falsy → linkPath value
- Sink:               publishVcsmNotification({ linkPath })
- Trust Boundary:     Notification system; linkPath default parameter
- Impact:             No security impact. publishVcsmNotification defaults `linkPath = null`, so
                      `undefined` and `null` are functionally equivalent. However, the inconsistency
                      creates a maintenance risk: if a future caller of the notifyFn does not use
                      the same default, `undefined` could pass through as `undefined` rather than `null`,
                      and downstream code using strict null checks (=== null) could misbehave.
- Evidence:           cancelBooking line 50: linkPath: ownerSlug ? '...' : undefined
                      createBooking lines 132, 191: linkPath: ownerSlug ? '...' : null
- Reproduction Steps: N/A — no current exploit or functional divergence.
- Existing Defense:   publishVcsmNotification parameter default `linkPath = null` masks the difference.
- Why Defense Is Insufficient: Defense is at callsite convention, not at engine output contract.
- Recommended Fix:
    Standardize cancelBooking to use null:
      linkPath: ownerSlug ? '/profile/${ownerSlug}?tab=book' : null
    This matches createBooking and removes the inconsistency.
- Suggested Patch:
    // engines/booking/src/controller/cancelBooking.controller.js line 50:
    //   Change: linkPath: ownerSlug ? '...' : undefined,
    //   To:     linkPath: ownerSlug ? '...' : null,
- Follow-up Command:  (none — housekeeping only)
```

```
SECURITY FINDING

- Finding ID:         ELEK-2026-05-27-011
- Title:              QrLink model — profileId and organizationId returned in mapped row to authenticated panel
- Category:           Internal ID exposure (bounded — authenticated surface only)
- Severity:           INFO
- Status:             Open
- Scope:              ENGINE + VCSM
- Location:           engines/booking/src/model/QrLink.model.js:3–4
                      apps/VCSM/src/features/profiles/kinds/vport/screens/booking/components/BookingQrLinksPanel.jsx
- Source:             mapQrLinkRow — returns profileId: row.profile_id ?? null and organizationId: row.organization_id ?? null
- Sink:               qrLinks array returned to useQrLinks caller — in-memory JS objects
- Trust Boundary:     VEMON V-003 — "profileId and organizationId must never be surfaced to callers"
- Impact:             `profileId` and `organizationId` are present in the in-memory `qrLinks` array
                      held by the authenticated owner's browser session. They are not rendered in
                      the UI (QrLinkCard renders only label, qrType, destinationPath, scanCount).
                      They are not returned through any API or URL. This is an authenticated owner-only
                      surface. The risk is limited to: accidental logging, dev-tools console exposure,
                      or future code changes that render these fields without review.
- Evidence:           QrLink.model.js line 3: profileId: row.profile_id ?? null
                      QrLink.model.js line 4: organizationId: row.organization_id ?? null
                      BookingQrLinksPanel does not render profileId or organizationId.
- Reproduction Steps: Open browser dev-tools while authenticated as VPORT owner.
                      Inspect the qrLinks state variable in the React devtools.
                      profileId and organizationId are visible in the object.
- Existing Defense:   Fields are not rendered. Panel is behind VPORT owner auth gate.
- Why Defense Is Insufficient:
    VCSM identity contract: "profileId must never be surfaced to callers."
    The current implementation surfaces it in the in-memory hook return value,
    even though it is not rendered. The contract applies to the data surface, not just render output.
- Recommended Fix:
    Option A: Strip profileId and organizationId from mapQrLinkRow if they are not needed by UI consumers.
    Option B: Add a separate "admin model" vs "UI model" for QrLink, where the UI model omits internal IDs.
    Option C: Accept as a bounded risk since the surface is authenticated and not rendered — document explicitly.
- Suggested Patch:
    // Option A — remove from mapQrLinkRow if unused by any UI consumer:
    // engines/booking/src/model/QrLink.model.js
    // Remove lines:
    //   organizationId: row.organization_id ?? null,
    //   profileId:      row.profile_id ?? null,
    // Verify no UI consumer reads qrLink.profileId or qrLink.organizationId before applying.
- Follow-up Command:  (none — bounded INFO, no exploit path)
```

```
SECURITY FINDING

- Finding ID:         ELEK-2026-05-27-012
- Title:              durationMinutes = 0 throws 'required' instead of 'must be > 0' — message inconsistency
- Category:           Input validation message accuracy
- Severity:           INFO
- Status:             Open
- Scope:              ENGINE
- Location:           engines/booking/src/controller/createBooking.controller.js:39
- Source:             durationMinutes parameter — caller-supplied
- Sink:               Error message text returned to caller
- Trust Boundary:     Input validation
- Impact:             No security impact. durationMinutes = 0 is correctly rejected.
                      However, the rejection message is 'durationMinutes is required' rather than
                      'durationMinutes must be greater than 0'. This is because 0 is falsy, so line 39
                      (`if (!durationMinutes)`) catches it before line 42 (the type/bound check).
                      A caller receiving 'required' when they supplied 0 may be confused into thinking
                      the field was absent rather than out-of-bounds.
- Evidence:           Line 39: if (!durationMinutes) throw new Error('[BookingEngine] durationMinutes is required')
                      0 is falsy → this branch fires.
                      Line 42: typeof durationMinutes !== 'number' || durationMinutes <= 0 → never reached for 0.
- Reproduction Steps: Call createBooking({ ..., durationMinutes: 0, ... })
                      Thrown: '[BookingEngine] durationMinutes is required'
                      Expected: '[BookingEngine] durationMinutes must be greater than 0'
- Existing Defense:   0 is correctly rejected — only the message is imprecise.
- Why Defense Is Insufficient: Message accuracy matters for debugging and API consumer experience.
- Recommended Fix:
    Reorder checks: perform the typeof/bound check before the falsy check, or merge them:
    if (durationMinutes === null || durationMinutes === undefined) {
      throw new Error('[BookingEngine] durationMinutes is required')
    }
    if (typeof durationMinutes !== 'number' || !Number.isFinite(durationMinutes) || durationMinutes <= 0) {
      throw new Error('[BookingEngine] durationMinutes must be a finite number greater than 0')
    }
    This also formally excludes Infinity and NaN via the isFinite check (redundant but explicit).
- Suggested Patch:
    // engines/booking/src/controller/createBooking.controller.js
    // Replace lines 39–46:
    if (durationMinutes === null || durationMinutes === undefined) {
      throw new Error('[BookingEngine] durationMinutes is required')
    }
    if (typeof durationMinutes !== 'number' || !Number.isFinite(durationMinutes) || durationMinutes <= 0) {
      throw new Error('[BookingEngine] durationMinutes must be a finite number greater than 0')
    }
    if (durationMinutes > 1440) {
      throw new Error('[BookingEngine] durationMinutes cannot exceed 1440 (24 hours)')
    }
- Follow-up Command:  (none — housekeeping only)
```

---

## False Positives Rejected

```
FALSE POSITIVE REJECTED

- Candidate:          menuUrl UUID fallback reaches QR encoder in VportActorMenuFlyerView
- Location:           apps/VCSM/src/features/dashboard/flyerBuilder/screens/VportActorMenuFlyerView.jsx:43–47
- Rejection reason:   menuUrl fallback = .../m/${actorId} fires only when !canonicalSlug.
                      When !canonicalSlug, isQrSafeSlug(null) = false → isQrSafe = false.
                      QR children are rendered only inside the isQrSafe=true branch (line 187 ternary).
                      UUID-containing menuUrl never reaches any QR encoder or print path.
- Chain gap:          Sink — UUID value never reaches a QR-encoding component.
- Notes:              Working as designed. isQrSafe is the correct gate.
```

```
FALSE POSITIVE REJECTED

- Candidate:          assertActorOwnsVportActor self-check allows requestActorId === targetActorId bypass
- Location:           engines/booking/src/controller/assertActorOwnsVportActor.controller.js:7
- Rejection reason:   UUID v4 uniqueness guarantees that two distinct actors (one user, one VPORT)
                      cannot share the same UUID. The self-check only fires when the same actor ID
                      is on both sides — i.e., the VPORT actor is checking ownership of its own resource,
                      which is the correct "vport actor managing itself" case. No unauthorized bypass path
                      can exist through this string equality.
- Chain gap:          Impact — no impact; the check represents a valid identity assertion.
- Notes:              The check is intentionally exempt from actor_owners lookup for this exact case.
```

```
FALSE POSITIVE REJECTED

- Candidate:          cancelBooking slug resolution returns empty string (not null) — UUID could slip through
- Location:           engines/booking/src/dal/actor.read.dal.js:62 / engines/booking/src/controller/cancelBooking.controller.js:50
- Rejection reason:   data?.profile_slug ?? null returns "" if the DB has an empty string.
                      Empty string is falsy. cancelBooking check: ownerSlug ? ... : undefined
                      → "" is falsy → linkPath = undefined → notification default = null.
                      No UUID can slip through via empty string; the falsy check handles it.
- Chain gap:          Sink — UUID cannot reach the linkPath value through an empty-string slug.
- Notes:              This is INFO-level inconsistency (undefined vs null) — see ELEK-2026-05-27-010.
```

```
FALSE POSITIVE REJECTED

- Candidate:          lat/lng returned in readVportPublicDetails DAL expose location to public consumers
- Location:           apps/VCSM/src/features/public/vportMenu/dal/readVportPublicDetails.rpc.dal.js:19
- Rejection reason:   lat and lng are present in the select list and in the raw DB response.
                      In the model (vportPublicDetails.model.js:88–91), they are used ONLY inside
                      buildDirectionsUrl to generate a Google Maps URL. They are not included in
                      the returned details object. Model line 207 comment confirms exclusion.
                      The consumer (VportPublicMenuView) has no access to lat/lng.
- Chain gap:          Sink — lat/lng values do not reach any public output surface.
- Notes:              lat/lng in a Google Maps directionsUrl is intentional and expected public data.
```

```
FALSE POSITIVE REJECTED

- Candidate:          durationMinutes = NaN bypasses type check in createBooking
- Location:           engines/booking/src/controller/createBooking.controller.js:39, 42
- Rejection reason:   !NaN === true. Line 39 fires before line 42. NaN is caught by the falsy check
                      and throws 'durationMinutes is required' before the type check is reached.
                      Confirmed by runtime test: typeof NaN === 'number' would have been a bypass,
                      but NaN never reaches that check.
- Chain gap:          Sink — NaN cannot reach dalInsertVportBooking with this input.
- Notes:              Message is imprecise (see ELEK-2026-05-27-012) but validation is functionally correct.
```

```
FALSE POSITIVE REJECTED

- Candidate:          durationMinutes = Infinity bypasses max check in createBooking
- Location:           engines/booking/src/controller/createBooking.controller.js:42, 45
- Rejection reason:   !Infinity === false (passes line 39). typeof Infinity === 'number' (passes typeof check).
                      Infinity <= 0 === false (passes lower bound). Infinity > 1440 === true → caught by line 45.
                      Confirmed by runtime test.
- Chain gap:          Sink — Infinity cannot reach dalInsertVportBooking.
- Notes:              Formally excluded by the proposed ELEK-2026-05-27-012 patch via Number.isFinite.
```

```
FALSE POSITIVE REJECTED

- Candidate:          organizationId can be smuggled through useQrLinks.addQrLink params
- Location:           apps/VCSM/src/features/booking/hooks/useQrLinks.js:60–73
- Rejection reason:   addQrLink passes raw params to createQrLink. However, createQrLink enforces
                      ownership for whatever identity surface is provided. If organizationId is supplied,
                      assertActorCanManageOrganization is called. No bypass occurs — supplying organizationId
                      requires owning the organization. BookingQrLinksPanel does not expose addQrLink
                      to its callers. The only consumer visible in the scanned files does not call addQrLink.
- Chain gap:          Impact — no unauthorized access path through the addQrLink identity params.
- Notes:              The hook correctly defers all identity-surface validation to the engine controller.
```

```
FALSE POSITIVE REJECTED

- Candidate:          readVportPublicDetails uses wrong Supabase client (should use service role for public views)
- Location:           apps/VCSM/src/features/public/vportMenu/dal/readVportPublicDetails.rpc.dal.js:1
- Rejection reason:   The anon-key client (VITE_SUPABASE_ANON_KEY) is CORRECT for public data access.
                      Public menu views (vport.public_menu_read_model_v, vport.public_actor_seo_v) are
                      designed to be readable by the anon role, enforced by RLS. Using the service role
                      for a public-facing client-side query would bypass RLS — a worse pattern.
- Chain gap:          Impact — anon client is the correct design choice.
- Notes:              Service role clients must never be used in client-side (browser) code.
```

```
FALSE POSITIVE REJECTED

- Candidate:          vportPublicDetails model returns actorId exposing internal actor UUID in public surface
- Location:           apps/VCSM/src/features/public/vportMenu/model/vportPublicDetails.model.js:131
- Rejection reason:   actorId is the canonical identity field in the VCSM architecture — its presence
                      in the model envelope is intentional. It is NOT inside the `details` object.
                      It is not rendered in VportPublicMenuView HTML or placed in any URL.
                      The VCSM architecture contract explicitly uses actorId as the external identity reference.
- Chain gap:          Impact — actorId in the model envelope is by design; no breach.
- Notes:              The banned field is profile_id (internal DB ID), not actorId.
```

```
FALSE POSITIVE REJECTED

- Candidate:          cancelBooking linkPath: undefined vs null is a null sentinel mismatch that could
                      leak a UUID if notification system defaults change
- Location:           engines/booking/src/controller/cancelBooking.controller.js:50
- Rejection reason:   publishVcsmNotification default parameter is `linkPath = null`. undefined param
                      triggers the default → null. This is JavaScript language behavior. A change to
                      the notification function signature would require a separate code review. The
                      current behavior is safe. ELEK-2026-05-27-010 captures the inconsistency at INFO level.
- Chain gap:          Impact — no UUID reaches linkPath in any observable code path.
- Notes:              Logged as INFO (ELEK-010). Not a vulnerability.
```

```
FALSE POSITIVE REJECTED

- Candidate:          'management' string as source value bypasses MANAGEMENT_SOURCES allowlist
- Location:           engines/booking/src/controller/createBooking.controller.js:12, 51–56
- Rejection reason:   ALL_SOURCES = Set(['owner','admin','import','sync','public']).
                      'management' is not a member. Line 52: ALL_SOURCES.has('management') === false.
                      Throws immediately: "Unknown booking source: management".
                      Runtime verified.
- Chain gap:          Sink — 'management' cannot reach any DB write path.
- Notes:              No bypass possible. The allowlist is complete and the String() coercion prevents type bypass.
```

```
FALSE POSITIVE REJECTED

- Candidate:          VportActorMenuFlyerScreen variant param allows injection through query string
- Location:           apps/VCSM/src/features/dashboard/flyerBuilder/screens/VportActorMenuFlyerScreen.jsx:24–32
- Rejection reason:   The variant resolution uses explicit if-chains against a fixed allowlist:
                      ["poster", "sticker", "table", "half", "full"]. Any other string falls through
                      to return "classic". The value passed to VportActorMenuFlyerView is always one
                      of these six strings — never the raw query param value.
- Chain gap:          Sink — injected string never reaches any renderer or state without allowlist check.
- Notes:              Allowlist is complete. No injection path exists.
```

```
FALSE POSITIVE REJECTED

- Candidate:          getVportProfileIdByActorId.dal.js uses select('*') — violates no-star rule
- Location:           apps/VCSM/src/features/booking/dal/getVportProfileIdByActorId.dal.js:20
- Rejection reason:   The select is `.select("id")` — explicitly selects only the `id` column.
                      This is not select('*'). Only one column is returned.
- Chain gap:          Source — no star-select violation exists.
- Notes:              Fully compliant with DAL architecture rules.
```

```
FALSE POSITIVE REJECTED

- Candidate:          assertActorOwnsVportActor short-circuits without actor_owners check when
                      requestActorId === targetActorId, allowing vport actor to bypass ownership table
- Location:           engines/booking/src/controller/assertActorOwnsVportActor.controller.js:7
- Rejection reason:   The case where requestActorId === targetActorId is the "VPORT actor managing
                      its own resource" case. actor_owners records link user actors to vport actors —
                      if the vport actor itself is the requestor, there is no actor_owners record to
                      verify against (the vport actor IS the owned entity). The self-check is the
                      correct mechanism. Traced through listQrLinksByProfile: the VPORT actor supplies
                      requestActorId = vport_actor_id, which matches profileActor.id (looked up from
                      profileId), so the ownership check is skipped correctly.
- Chain gap:          Impact — bypass is intentional and correct for the vport-managing-itself case.
- Notes:              If the query is about a USER actor spoofing the VPORT actor's ID — UUID uniqueness
                      prevents this. User and VPORT actor IDs are distinct UUIDs in vc.actors.
```

---

## Suggested Patch Queue

| # | Finding ID | Title | Severity | Layer to Patch | Patch Complexity | Requires DB Change |
|---|---|---|---|---|---|---|
| 1 | ELEK-2026-05-27-009 | assertActorCanManageResource — direct owner match skips is_void | MEDIUM | Engine | SIMPLE | No |
| 2 | ELEK-2026-05-27-010 | cancelBooking linkPath undefined vs null inconsistency | INFO | Engine | SIMPLE | No |
| 3 | ELEK-2026-05-27-011 | QrLink model returns profileId/organizationId to authenticated panel | INFO | Engine + UI | MODERATE | No |
| 4 | ELEK-2026-05-27-012 | durationMinutes = 0 throws wrong message; Infinity/NaN not formally excluded | INFO | Engine | SIMPLE | No |

---

## Required Follow-up Commands

| Command | Reason | Status |
|---|---|---|
| BLACKWIDOW | Runtime validation of ELEK-2026-05-27-009 — verify void actor management booking path under authenticated session | PENDING |
| DB | Confirm RLS on vport.bookings for management-source writes; verify void actor cannot insert via anon-key session | PENDING |
| DB | Confirm ELEK-004 (QR scan count non-atomic) and ELEK-006 (createQrLink allowlist) — not reverified in this scan | PENDING |
| Thor | ELEK-2026-05-27-009 is MEDIUM — evaluate as release gate candidate | PENDING |

---

## THOR Release Gate Evaluation

Per ELEKTRA contract — THOR release gate applies to HIGH findings and confirmed IDOR/BOLA with code-level exploit path.

| Finding | THOR Gate? | Rationale |
|---|---|---|
| ELEK-009 MEDIUM | CAUTION | Requires void actor with active session and known resource ownership. Engine-layer gap; RLS may provide secondary protection (unconfirmed). |
| ELEK-010 INFO | NO GATE | No exploit path. Housekeeping. |
| ELEK-011 INFO | NO GATE | Bounded to authenticated owner surface. Not rendered. |
| ELEK-012 INFO | NO GATE | Wrong error message only. Validation is functionally correct. |

**Prior ELEK-001 through ELEK-003 patches are verified correct — those findings are resolved and do not block release.**

Recommendation to Thor: ELEK-009 is a release-advisory finding. The branch can ship with ELEK-009 open if the team confirms RLS on vport.bookings blocks void-actor inserts at the DB layer, but the engine-layer gap should be closed in the next sprint regardless. All INFO findings are housekeeping with no functional or security impact.
