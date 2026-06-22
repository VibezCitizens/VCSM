# ELEKTRA Security Report

**Date:** 2026-05-27
**Scope:** VCSM + ENGINE
**Reviewer:** ELEKTRA
**Scan Trigger:** MANUAL — post-remediation regression audit of VPORT Booking / QR Security module; follow-on to VENOM 8-finding sprint (all resolved). Regression tests added in last session.
**Findings Summary:** 0 HIGH | 3 MEDIUM | 3 LOW | 2 INFO
**False Positives Rejected:** 5
**Suggested Patches:** 8

---

## Executive Summary

This ELEKTRA scan reviewed 22 files spanning the booking engine (controllers, DAL, config, adapters) and the VCSM app layer (QR URL builders, hooks, controllers, view screens) following a full VENOM remediation sprint that resolved 8 prior findings and a same-day bug fix session. The remediated surfaces are sound: ownership gates are in place, UUID leakage into public QR/print paths is blocked by `isQrSafe`, public details no longer return `profile_id` or raw rows, and notification link paths now resolve slugs. Three medium findings remain: the engine-level `cancelBooking` does not validate the requesting customer actor's void/kind status (leaving a minor trust gap on the customer self-cancel path), the `status` field in `createBooking` is accepted from the caller without an allowlist (allowing arbitrary status strings into the DB), and `customerActorId` in `createBooking` is not verified to match `requestActorId` in the public/citizen booking path (enabling a caller to record a booking attributed to a different actor). Three low findings address the non-atomic QR scan counter, the missing UUID guard in `buildMenuShortDisplayUrl`, and the `destinationPath` / `qrType` fields in `createQrLink` that accept arbitrary strings without allowlist or path prefix validation.

---

## Medium Findings

```
SECURITY FINDING

- Finding ID:         ELEK-2026-05-27-001
- Title:              cancelBooking engine — customer self-cancel path skips actor void/kind check
- Category:           Auth Bypass
- Severity:           MEDIUM
- Status:             Open
- Scope:              ENGINE
- Location:           engines/booking/src/controller/cancelBooking.controller.js:17–25
- Source:             requestActorId supplied by caller; bookingId supplied by caller
- Sink:               dalUpdateBookingStatus — writes status='cancelled' to booking row
- Trust Boundary:     Actor identity verification should occur before any write is allowed,
                      regardless of whether the actor is a customer or an owner
- Impact:             A void actor (soft-deleted account) or an actor of wrong kind can cancel
                      a booking it was previously recorded as customer on, because the engine
                      only checks the actor string ID, not whether the actor is still active
                      and non-void. This is a bypassed identity gate on the write path.
- Evidence:           Lines 17–25:
                        const isCustomer = booking.customer_actor_id &&
                          String(booking.customer_actor_id) === String(requestActorId)
                        // isCustomer === true → proceeds directly to dalUpdateBookingStatus
                        // NO dalGetActorById call, NO is_void check, NO kind check on this path.
                      Compare: the non-customer path (line 22–25) calls
                        assertActorOwnsVportActor → dalGetActorById → checks is_void and kind='user'
                      The customer path has no equivalent check.
- Reproduction Steps:
    1. An actor is soft-deleted (is_void = true) but has a booking row with customer_actor_id set.
    2. Caller supplies requestActorId = that deleted actorId + the bookingId.
    3. isCustomer resolves true (string match), no DB check is performed.
    4. dalUpdateBookingStatus fires → booking is cancelled by a void actor.
- Existing Defense:   requestActorId presence check (line 12). String-match against DB value.
- Why Defense Is Insufficient:
    The string match proves the caller knows the actor ID, not that the actor is valid.
    A void actor remains a valid string in actor_owners and past booking rows.
    The owner path correctly performs dalGetActorById + is_void check; the customer path does not.
- Recommended Fix:
    Before the isCustomer check resolves to true as a cancellation grant, call dalGetActorById
    on requestActorId and verify: exists, is_void !== true, kind === 'user'.
    Reject if any check fails.
- Suggested Patch:
    // engines/booking/src/controller/cancelBooking.controller.js
    // After line 15 (booking found), add actor validation before isCustomer branch:

    import { dalGetActorById } from '../dal/actor.read.dal.js'  // already in scope via assertActorOwnsVportActor

    const requestingActor = await dalGetActorById({ actorId: requestActorId })
    if (!requestingActor || requestingActor.is_void === true) {
      throw new Error('Requesting actor not found or deactivated.')
    }

    const isCustomer = booking.customer_actor_id &&
      String(booking.customer_actor_id) === String(requestActorId)
    // ... rest unchanged

    NOTE: dalGetActorById is already imported transitively from assertActorOwnsVportActor.controller.js
    Import it directly at the top of cancelBooking.controller.js.
- Follow-up Command:  BLACKWIDOW (runtime validation), DB (RLS policy for cancelled status write)
```

```
SECURITY FINDING

- Finding ID:         ELEK-2026-05-27-002
- Title:              createBooking engine — status field is caller-controlled with no allowlist
- Category:           Input Trust
- Severity:           MEDIUM
- Status:             Open
- Scope:              ENGINE
- Location:           engines/booking/src/controller/createBooking.controller.js:22 (param), 104, 163 (sinks)
- Source:             status parameter — caller-supplied string, default null
- Sink:               dalInsertVportBooking / dalInsertBooking — status written directly to DB row
- Trust Boundary:     Controller must validate enum-type fields before DB write
- Impact:             Caller can set an arbitrary status string on a new booking row
                      (e.g., 'confirmed', 'completed', 'no_show', 'deleted', or any custom value)
                      bypassing the domain state machine. Owner could create a booking pre-marked
                      as 'confirmed' without going through the confirm flow, or inject unknown
                      status values that break downstream reporting and filtering logic.
- Evidence:           Line 22:  status = null,   (no validation)
                      Line 104: status,           (passed through to vport insert)
                      Line 163: status,           (passed through to legacy insert)
                      No VALID_STATUSES set or allowlist check exists anywhere in the controller
                      or in dalInsertBooking / dalInsertVportBooking.
                      Compare: source field has an explicit allowlist (ALL_SOURCES Set, line 51).
- Reproduction Steps:
    1. Caller invokes createBooking({ ..., source: 'owner', status: 'completed', ... })
    2. The source allowlist check passes ('owner' is valid).
    3. No status check fires.
    4. dalInsertVportBooking receives status='completed' and writes it to the DB.
    5. The booking appears as already-completed in all downstream reads.
- Existing Defense:   source field has an allowlist. status has none.
- Why Defense Is Insufficient:
    The status field is an enum domain value that controls the booking lifecycle.
    Arbitrary strings corrupt state machine assumptions in all reads, notification triggers,
    and calendar rendering logic that filters by status.
- Recommended Fix:
    Add a VALID_STATUSES allowlist constant and validate status before the DB insert.
    Null / undefined status should be allowed (DB default applies).
    For citizen source, status should be forced to 'pending' regardless of caller input.
- Suggested Patch:
    // engines/booking/src/controller/createBooking.controller.js
    // After ALL_SOURCES validation block (~line 56), add:

    const VALID_STATUSES = new Set(['pending', 'confirmed', 'cancelled', 'completed', 'no_show', 'dismissed'])
    if (status !== null && status !== undefined && !VALID_STATUSES.has(String(status))) {
      throw new Error(
        `[BookingEngine] Unknown booking status: "${status}". Allowed: ${[...VALID_STATUSES].join(', ')}`
      )
    }

    // Additionally, for citizen source, force status to 'pending':
    // if (CITIZEN_SOURCES.has(String(source))) {
    //   resolvedStatus = 'pending'
    // }
    // Pass resolvedStatus to the insert instead of the raw status parameter.

    NOTE: Requires DB column check to confirm which status values the enum/check constraint allows.
    Align VALID_STATUSES with the DB-level constraint. Assign to Carnage if a migration is needed.
- Follow-up Command:  DB (confirm DB-level status constraint), Carnage (if migration needed)
```

```
SECURITY FINDING

- Finding ID:         ELEK-2026-05-27-003
- Title:              createBooking engine — customerActorId not verified against requestActorId on public/citizen path
- Category:           IDOR/BOLA
- Severity:           MEDIUM
- Status:             Open
- Scope:              ENGINE
- Location:           engines/booking/src/controller/createBooking.controller.js:20, 103, 161
- Source:             customerActorId parameter — caller-supplied, not validated
- Sink:               dalInsertVportBooking / dalInsertBooking — customer_actor_id written to DB
- Trust Boundary:     On the public/citizen path, the booking must be attributed to the authenticated
                      actor (requestActorId). The engine must enforce this — it cannot trust the caller
                      to self-report their identity in a separate field.
- Impact:             A citizen can book an appointment and attribute it to a different actorId in the
                      customer_actor_id field. This falsifies booking ownership records, allowing:
                      (a) attribution fraud — booking appears to belong to another user in owner dashboards
                      (b) notification misdirection — notifications go to the wrong actor
                      (c) cancelBooking bypass — any actor whose ID appears in customer_actor_id
                      can cancel that booking using the isCustomer shortcut (ELEK-001 combined effect)
- Evidence:           Line 20:  customerActorId = null,  (no validation)
                      Lines 91–96 (citizen path): validates requestActorId (kind='user', not void)
                      Line 103: customer_actor_id: customerActorId  — written as-is, no check that
                               customerActorId === requestActorId
                      buildBookingPayload.model.js line 70 sets customerActorId = requestActorId
                      at the UI layer — but this is not enforced at the engine layer.
- Reproduction Steps:
    1. Attacker authenticates as Actor A (requestActorId=A).
    2. Calls createBooking({ source: 'public', requestActorId: A, customerActorId: B, ... })
    3. Engine validates A (kind='user', not void). customerActorId=B is not checked.
    4. Booking is inserted with customer_actor_id=B.
    5. Actor B appears as the customer in the owner's dashboard.
    6. Actor B can now cancel this booking via the isCustomer path.
- Existing Defense:   UI model sets customerActorId = requestActorId (buildBookingPayload.model.js:70).
                      This is a UI-layer convention, not an engine-layer enforcement.
- Why Defense Is Insufficient:
    The engine is framework-agnostic and callable from any context. The UI convention
    provides no protection to engine callers that do not use buildBookingPayload.model.js.
- Recommended Fix:
    On the citizen/public path, after validating requestActorId, assert:
      if (customerActorId && String(customerActorId) !== String(requestActorId)) {
        throw new Error('[BookingEngine] customerActorId must match requestActorId for public bookings.')
      }
    Then set customer_actor_id = requestActorId unconditionally on the public path.
    Management sources may supply a different customerActorId legitimately (booking on behalf of a client).
- Suggested Patch:
    // engines/booking/src/controller/createBooking.controller.js
    // Inside the CITIZEN_SOURCES.has(source) block, after actor validation, add:

    // VPORT flow (around line 95–96 after actor check):
    const resolvedCustomerActorId = requestActorId  // citizen path: customer is always the requester
    // Replace customerActorId with resolvedCustomerActorId in the insert call

    // LEGACY flow (around line 152–154 after actor check):
    const resolvedCustomerActorId = requestActorId
    // Same replacement for legacy path insert

    NOTE: For MANAGEMENT_SOURCES, keep customerActorId as-is — owner may supply it for walk-in bookings.
- Follow-up Command:  BLACKWIDOW, DB (RLS on customer_actor_id column)
```

---

## Low Findings

```
SECURITY FINDING

- Finding ID:         ELEK-2026-05-27-004
- Title:              QR scan count increment is non-atomic — race condition allows count inflation
- Category:           Input Trust
- Severity:           LOW
- Status:             Open
- Scope:              ENGINE
- Location:           engines/booking/src/dal/qrLink.write.dal.js:32–40
                      engines/booking/src/controller/resolveQrScan.controller.js:18
- Source:             Concurrent QR scan requests to resolveQrScan
- Sink:               dalIncrementQrScanCountRaw — DB update using (currentCount + 1)
- Trust Boundary:     Write operation must be atomic — read-then-write pattern must use a DB-level increment
- Impact:             Under concurrent scan load, two simultaneous reads of scan_count=N will both
                      compute N+1 and write N+1, losing one increment. Count is not an integrity value
                      but is surfaced to owners as a business metric. Non-atomic increments cause
                      systematic undercount proportional to concurrent scan rate.
- Evidence:           Line 36:  .update({ scan_count: (currentCount ?? 0) + 1 })
                      This is a read-modify-write in application code, not an atomic DB increment.
                      No optimistic locking, no RPC, no DB-side increment is used.
- Reproduction Steps:
    1. 10 simultaneous GET /qr/:slug requests arrive.
    2. All 10 read scan_count=5 from dalGetQrLinkBySlug (fire before any write completes).
    3. All 10 compute 5+1=6 and fire update.
    4. Final scan_count=6 instead of 15.
- Existing Defense:   Fire-and-forget pattern (.catch(() => {})). Count failure does not block redirect.
- Why Defense Is Insufficient:
    The fire-and-forget only prevents count errors from breaking the user experience.
    It does not address the accuracy of the count metric itself.
- Recommended Fix:
    Replace the application-level increment with a DB-side atomic increment.
    Option A: Use a Postgres RPC that runs `UPDATE qr_links SET scan_count = scan_count + 1`.
    Option B: Use Supabase rpc() call with a `increment_qr_scan(qr_link_id uuid)` function.
    Option C: Accept as a known limitation for a non-critical metric — document explicitly.
- Suggested Patch:
    // Option A — DB-side atomic increment via raw SQL RPC:
    // Create Supabase function: increment_qr_scan_count(p_id uuid)
    //   BEGIN UPDATE vport.qr_links SET scan_count = scan_count + 1 WHERE id = p_id; END;
    //
    // Replace dalIncrementQrScanCountRaw:
    export async function dalIncrementQrScanCount({ qrLinkId }) {
      if (!qrLinkId) throw new Error('[BookingEngine] qrLinkId is required')
      const { error } = await getVportClient()
        .rpc('increment_qr_scan_count', { p_id: qrLinkId })
      if (error) throw error
    }
    // Requires DB migration — assign to Carnage.
- Follow-up Command:  Carnage (DB-side atomic increment RPC), DB (confirm atomic pattern)
```

```
SECURITY FINDING

- Finding ID:         ELEK-2026-05-27-005
- Title:              buildMenuShortDisplayUrl in qrUrlBuilders.js lacks the isQrSafeSlug guard
- Category:           URL/deep-link UUID leakage
- Severity:           LOW
- Status:             Open
- Scope:              VCSM
- Location:           apps/VCSM/src/lib/qrUrlBuilders.js:103–114
- Source:             slug parameter — caller-supplied string
- Sink:               URL string returned: `${host}${port}/profile/${encodeSlug(slug)}/menu`
- Trust Boundary:     All QR URL builders must reject raw UUIDs before encoding into URLs
- Impact:             If called with a raw UUID slug, the function returns a URL with a UUID in
                      the /profile/ path segment. Current call sites guard this at the callsite
                      level, but the function itself is exported and callable without a guard.
                      A future callsite could call buildMenuShortDisplayUrl(actorId) and produce
                      a UUID-containing display URL that appears on a printed flyer.
- Evidence:           Lines 63–66 (buildReviewsQrUrl): if (!isQrSafeSlug(slug)) return "";
                      Lines 73–76 (buildBusinessCardQrUrl): if (!isQrSafeSlug(slug)) return "";
                      Lines 84–87 (buildMenuQrUrl): if (!isQrSafeSlug(slug)) return "";
                      Lines 103–114 (buildMenuShortDisplayUrl): only `if (!slug) return ""`
                      → missing isQrSafeSlug check; UUID slug would pass through.
- Reproduction Steps:
    1. Caller invokes buildMenuShortDisplayUrl('550e8400-e29b-41d4-a716-446655440000')
    2. Function returns: "hostname.com/profile/550e8400-e29b-41d4-a716-446655440000/menu"
    3. This UUID-containing URL could appear in a printed flyer display URL field.
- Existing Defense:   VportActorMenuFlyerView calls buildMenuShortDisplayUrl(dashboardDetails.slug)
                      where slug is only truthy when it has been resolved. Current callsite is guarded.
- Why Defense Is Insufficient:
    Defense is at the callsite only. The function contract (docstring: "canonical slug") is not
    enforced by the function itself. All other builders in this file enforce the contract inline.
    Consistency requires the same guard here.
- Recommended Fix:
    Add isQrSafeSlug check at the top of buildMenuShortDisplayUrl, matching all sibling builders.
- Suggested Patch:
    // apps/VCSM/src/lib/qrUrlBuilders.js — buildMenuShortDisplayUrl
    export function buildMenuShortDisplayUrl(slug) {
      if (!isQrSafeSlug(slug)) return "";  // <-- add this line; replaces `if (!slug) return ""`
      const host = ...
      // rest unchanged
    }
- Follow-up Command:  (none — self-contained fix)
```

```
SECURITY FINDING

- Finding ID:         ELEK-2026-05-27-006
- Title:              createQrLink — destinationPath and qrType accept arbitrary strings without allowlist or path validation
- Category:           Input Trust
- Severity:           LOW
- Status:             Open
- Scope:              ENGINE
- Location:           engines/booking/src/controller/createQrLink.controller.js:16–24
                      engines/booking/src/dal/qrLink.write.dal.js:7–10
- Source:             qrType and destinationPath — caller-supplied strings
- Sink:               dalInsertQrLink — written directly to vport.qr_links DB table
- Trust Boundary:     Controller must validate enum fields and path-type fields before DB write
- Impact:             (a) qrType: unknown type strings written to DB corrupt type-based filtering
                          and display logic in the QR panel. E.g., qrType='admin' or 'void' could
                          trigger unintended behavior in any future code that branches on qrType.
                      (b) destinationPath: an absolute URL (https://...) or a path that reaches
                          an unintended route could be stored and served as a QR redirect target.
                          When resolveQrScan returns destinationPath to callers, they may navigate
                          directly to it. A path like '/admin' or an external URL 'https://evil.com'
                          stored in destination_path would be returned as the redirect target.
- Evidence:           createQrLink line 22: if (!qrType) — presence check only, no allowlist
                      createQrLink line 24: if (!destinationPath) — presence check only, no allowlist
                      resolveQrScan line 21: destinationPath: row.destination_path — returned as-is
                      resolveQrScan controller does not validate the returned destinationPath.
                      buildQrDestinationPath in QrLink.model.js generates safe paths, but createQrLink
                      does not require callers to use buildQrDestinationPath.
- Reproduction Steps:
    (a) Caller creates QR link with destinationPath='https://malicious.com/phish'
        resolveQrScan returns destinationPath='https://malicious.com/phish'
        App navigates to this path — open redirect if absolute URLs are trusted.
    (b) Caller creates QR link with qrType='super_admin' — stored in DB, displayed in panel.
- Existing Defense:   Ownership check gates createQrLink — only authorized actors can create.
                      buildQrDestinationPath generates valid paths — but use is not enforced.
- Why Defense Is Insufficient:
    Authorization gates ensure only owners can create QR links, but do not constrain what they
    can write. An owner could inject an external URL or unknown qrType for any reason.
    resolveQrScan returns destinationPath to the caller unconditionally — if the app uses it
    for navigation (navigate(destinationPath)), an absolute URL causes an open redirect.
- Recommended Fix:
    (a) Add a QR_TYPES allowlist in the engine and validate qrType.
    (b) Validate destinationPath: must be a relative path (starts with '/'), not an absolute URL.
        Reject any value matching /^https?:\/\//i or not starting with '/'.
- Suggested Patch:
    // engines/booking/src/controller/createQrLink.controller.js
    const ALLOWED_QR_TYPES = new Set(['profile', 'profile_book', 'location_book', 'resource_book', 'service', 'menu', 'reviews', 'card'])

    if (!ALLOWED_QR_TYPES.has(String(qrType))) {
      throw new Error(`[BookingEngine] Unknown qrType: "${qrType}". Allowed: ${[...ALLOWED_QR_TYPES].join(', ')}`)
    }

    if (!destinationPath.startsWith('/')) {
      throw new Error('[BookingEngine] destinationPath must be a relative path starting with "/"')
    }
    // Optionally also reject paths with '..' traversal:
    if (destinationPath.includes('..')) {
      throw new Error('[BookingEngine] destinationPath must not contain ".."')
    }
- Follow-up Command:  DB (confirm qr_type column enum or check constraint exists)
```

---

## Info Findings

```
SECURITY FINDING

- Finding ID:         ELEK-2026-05-27-007
- Title:              Engine config.js uses a mutable module-level singleton — no freeze or validation
- Category:           Config/secrets exposure
- Severity:           INFO
- Status:             Open
- Scope:              ENGINE
- Location:           engines/booking/src/config.js:5–17
- Source:             configureBookingEngine() called at app startup
- Sink:               _config object — readable via getSupabaseClient(), getVportClient()
- Trust Boundary:     The config injection is framework-agnostic; no protection against re-configuration
- Impact:             Any module that imports configureBookingEngine() can overwrite the active
                      Supabase clients at runtime. In a dev or test environment this is useful;
                      in production it could allow a rogue module to swap the DB client.
                      No freeze, no "already configured" guard after first call.
- Evidence:           Line 5:  let _config = {}
                      Line 16: _config = { ..._config, ...config }  — spread merge allows partial overwrite
                      No Object.freeze, no single-call enforcement.
- Reproduction Steps:
    1. Module A calls configureBookingEngine({ supabaseClient: legitClient })
    2. Module B (loaded later) calls configureBookingEngine({ supabaseClient: rogueClient })
    3. All subsequent DB calls use rogueClient.
- Existing Defense:   setup.js uses a _configured flag to prevent re-call from that entrypoint.
                      This is an app-layer guard, not an engine-layer guard.
- Why Defense Is Insufficient:
    _configured is in setup.js, not in config.js. Any other import of configureBookingEngine
    (e.g., from a test file or another setup module) bypasses the _configured guard.
- Recommended Fix:
    Add a one-time-write guard inside config.js:
    let _frozen = false
    export function configureBookingEngine(config) {
      if (_frozen) throw new Error('[BookingEngine] already configured — configureBookingEngine may only be called once')
      _config = Object.freeze({ ..._config, ...config })
      _frozen = true
    }
    Or use Object.freeze after first config to prevent mutation.
- Follow-up Command:  (none — hardening only, no exploit path in production)
```

```
SECURITY FINDING

- Finding ID:         ELEK-2026-05-27-008
- Title:              VportActorMenuFlyerView re-declares UUID_RE locally instead of importing isQrSafeSlug
- Category:           URL/deep-link UUID leakage
- Severity:           INFO
- Status:             Open
- Scope:              VCSM
- Location:           apps/VCSM/src/features/dashboard/flyerBuilder/screens/VportActorMenuFlyerView.jsx:40–41
- Source:             UUID_RE local regex declaration
- Sink:               isQrSafe boolean — controls QR/print gate
- Trust Boundary:     Single source of truth for UUID guard is qrUrlBuilders.isQrSafeSlug (VENOM V-006 fix)
- Impact:             The local UUID_RE regex is functionally equivalent to the one in qrUrlBuilders.js
                      but is a separate copy. If the canonical pattern is ever changed (e.g., to add
                      UUID v5 or ULID exclusion patterns), this local copy will not receive the update
                      and will silently diverge. No current exploit path — both regexes match identically.
- Evidence:           Line 40: const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
                      Line 41: const isQrSafe = !!canonicalSlug && !UUID_RE.test(canonicalSlug);
                      qrUrlBuilders.js line 53: export function isQrSafeSlug(slug) { ... }
                      isQrSafeSlug is not imported here.
- Reproduction Steps: N/A — no current exploit. Future drift risk only.
- Existing Defense:   The local regex is currently correct and equivalent.
- Why Defense Is Insufficient: Code duplication creates drift risk. VENOM V-006 established isQrSafeSlug as canonical.
- Recommended Fix:
    Import isQrSafeSlug from @/lib/qrUrlBuilders and replace the local UUID_RE + isQrSafe logic:
    import { isQrSafeSlug } from "@/lib/qrUrlBuilders";
    const isQrSafe = isQrSafeSlug(canonicalSlug);
- Follow-up Command:  (none — housekeeping)
```

---

## False Positives Rejected

```
FALSE POSITIVE REJECTED

- Candidate:          createBooking notification linkPath — UUID in /actor/:id/dashboard/booking-history
- Location:           engines/booking/src/controller/createBooking.controller.js
- Rejection reason:   Initial reading of the FIRST read output at line 130 appeared to show a UUID linkPath.
                      Full re-read of the file confirmed the code was already fixed: both VPORT flow
                      (line 132) and legacy flow (line 191) use:
                        const ownerSlug = await dalGetVportProfileSlugByActorId(...)
                        linkPath: ownerSlug ? `/profile/${ownerSlug}` : null
                      No UUID appears in the notification linkPath.
- Chain gap:          Sink — the sink does not exist; slug resolution is present.
- Notes:              The comment at line 124 ("raw owner_actor_id UUID must never appear") confirms
                      this was an intentional fix in the remediation sprint.
```

```
FALSE POSITIVE REJECTED

- Candidate:          VportActorMenuFlyerView — menuUrl UUID fallback (/m/${actorId}) reaches QR children
- Location:           apps/VCSM/src/features/dashboard/flyerBuilder/screens/VportActorMenuFlyerView.jsx:43–47
- Rejection reason:   The fallback `menuUrl = .../m/${actorId}` is computed when slug is not yet resolved,
                      but it is ONLY passed to child components (ClassicFlyer, PosterFlyer, PrintableQrSheet)
                      inside the `isQrSafe ? ...` branch (line 187). When isQrSafe is false, these children
                      are never rendered; a "Preparing flyer…" placeholder is shown instead.
                      The UUID-containing menuUrl never reaches the QR encoder.
- Chain gap:          Sink — the UUID value never reaches a QR-encoding or display component.
- Notes:              The fallback path is a temporary UX value computed in useMemo. The isQrSafe gate
                      is the correct defense. This is working as designed.
```

```
FALSE POSITIVE REJECTED

- Candidate:          dalReadActorOwnerLink passes userProfileId (profile_id) to actor_owners query — profileId exposure
- Location:           engines/booking/src/dal/actor.read.dal.js:33–47
- Rejection reason:   profileId here is the internal vc.profiles.id used as user_id in actor_owners.
                      It is not exposed to any public surface — it is used only as a DB filter parameter
                      inside the engine DAL. The engine correctly resolves it from the actor row
                      (requester.profile_id) after a DB fetch, not from caller-supplied input.
                      This is the correct implementation of the actor_owners ownership model.
- Chain gap:          Source — the value is not attacker-controlled; it is DB-derived from a verified actor row.
- Notes:              No remediation needed. This is the intended ownership check pattern.
```

```
FALSE POSITIVE REJECTED

- Candidate:          getVportProfileIdByActorIdDAL in VCSM app — profileId surfaced to hook caller
- Location:           apps/VCSM/src/features/booking/dal/getVportProfileIdByActorId.dal.js
                      apps/VCSM/src/features/booking/hooks/useQrLinks.js
- Rejection reason:   The resolvedProfileId is stored in a useRef (resolvedProfileId.current) and is
                      used only to call listQrLinksByProfile — it is never returned to the caller of
                      useQrLinks, never stored in state, and never surfaced in the component tree.
                      The VENOM V-003 fix is correct: actorId is the only input surface; profileId
                      is an internal translation used only as a DB filter.
- Chain gap:          Sink — profileId does not reach any public output surface.
- Notes:              The resolvedProfileId.current ref is correctly scoped inside the hook closure.
```

```
FALSE POSITIVE REJECTED

- Candidate:          BookingQrLinksPanel — destinationPath displayed in UI (possible sensitive data)
- Location:           apps/VCSM/src/features/profiles/kinds/vport/screens/booking/components/BookingQrLinksPanel.jsx:36
- Rejection reason:   The destinationPath displayed is from the owner's own QR links, shown only in
                      their authenticated dashboard. This is not a public surface. The panel is rendered
                      only when actorId is truthy and behind the VPORT ownership gate (V-008 fix).
                      Displaying the destinationPath to the owner of the QR link is the correct behavior.
- Chain gap:          Impact — no breach; owner viewing their own resource paths is expected.
- Notes:              ELEK-006 addresses the risk that destinationPath could contain external URLs stored
                      in the DB. That is a separate finding about what is stored, not about what is displayed.
```

---

## Suggested Patch Queue

| # | Finding ID | Title | Severity | Layer to Patch | Patch Complexity | Requires DB Change |
|---|---|---|---|---|---|---|
| 1 | ELEK-2026-05-27-001 | cancelBooking engine — customer path skips actor void/kind check | MEDIUM | Engine | SIMPLE | No |
| 2 | ELEK-2026-05-27-002 | createBooking engine — status field caller-controlled no allowlist | MEDIUM | Engine | SIMPLE | No (unless DB enum missing) |
| 3 | ELEK-2026-05-27-003 | createBooking engine — customerActorId not verified against requestActorId | MEDIUM | Engine | MODERATE | No |
| 4 | ELEK-2026-05-27-004 | QR scan count increment non-atomic race condition | LOW | Engine + DAL | COMPLEX | YES (DB atomic RPC) |
| 5 | ELEK-2026-05-27-005 | buildMenuShortDisplayUrl missing isQrSafeSlug guard | LOW | UI | SIMPLE | No |
| 6 | ELEK-2026-05-27-006 | createQrLink — destinationPath/qrType accept arbitrary strings | LOW | Engine | SIMPLE | No (unless DB enum missing) |
| 7 | ELEK-2026-05-27-007 | Engine config singleton mutable — no freeze or one-call guard | INFO | Engine | SIMPLE | No |
| 8 | ELEK-2026-05-27-008 | VportActorMenuFlyerView re-declares UUID_RE locally — drift risk | INFO | UI | SIMPLE | No |

---

## Required Follow-up Commands

| Command | Reason | Status |
|---|---|---|
| BLACKWIDOW | Runtime validation of ELEK-001, ELEK-002, ELEK-003 — verify exploit paths under authenticated session | PENDING |
| DB | Confirm vport.bookings status column has a check constraint; confirm qr_type enum; confirm actor_owners RLS on customer cancel path | PENDING |
| Carnage | DB migration for atomic QR scan count increment RPC (ELEK-004) | PENDING |
| Thor | ELEK-001, ELEK-002, ELEK-003 are MEDIUM — review as release gate candidates for current branch | PENDING |

---

## THOR Release Gate Evaluation

Per ELEKTRA contract — THOR release gate applies to HIGH findings and confirmed IDOR/BOLA with code-level exploit path.

| Finding | THOR Gate? | Rationale |
|---|---|---|
| ELEK-001 MEDIUM | CAUTION | No confirmed active exploit path — void actor self-cancel requires prior auth session and historic booking row |
| ELEK-002 MEDIUM | CAUTION | Engine-level — status corruption requires authorized caller (owner/management source) |
| ELEK-003 MEDIUM | CAUTION | CustomerActorId spoofing requires authenticated actor; UI model prevents it in normal flow |
| ELEK-004–008 LOW/INFO | NO GATE | No direct exploit path |

Recommendation to Thor: ELEK-001, ELEK-002, ELEK-003 are release-advisory findings. The branch can ship with these open if the team accepts the risk, but all three should be tracked and addressed before the booking feature reaches high-traffic production. ELEK-003 in particular has a combinatorial risk with ELEK-001 (spoofed customer can then cancel via isCustomer shortcut).
