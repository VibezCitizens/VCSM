# ELEKTRA Security Report

**Date:** 2026-06-04
**Scope:** VCSM — booking feature (full stack: controller, DAL, dashboard)
**Reviewer:** ELEKTRA
**Scan Trigger:** MANUAL — first ELEKTRA pass; cross-references open VENOM + BLACKWIDOW findings
**Areas Loaded:** 01 Actor Ownership/IDOR · 02 Controller Input Trust · 03 Supabase RLS · 06 Auth and Session
**Findings Summary:** 8 HIGH | 4 MEDIUM | 0 LOW | 0 INFO
**False Positives Rejected:** 3
**Suggested Patches:** 12

---

## ELEKTRA SCAN TARGET

```
Feature / Route / Engine: booking
  - apps/VCSM/src/features/booking/           (core booking engine)
  - apps/VCSM/src/features/dashboard/vport/  (dashboard booking cards)
Application Scope: VCSM
Reason for scan: First ELEKTRA pass; 10 open VENOM/BW findings; THOR blockers unresolved
Scan Trigger: MANUAL
```

---

## ENTRY POINT MAP

| Entry Point | Source (caller) | actorId origin | Validation present |
|---|---|---|---|
| `createBookingController` | React hook → `createBooking` adapter | `requestActorId` from payload (UNBOUND) | PARTIAL — source allowlist; no status allowlist |
| `confirmBookingController` | Owner action | `requestActorId` from payload | YES — assertActorOwnsVport |
| `cancelBookingController` | Owner or customer | `requestActorId` from payload | YES — isCustomer or assertActorOwnsVport |
| `setAvailabilityRuleController` | Owner action | `requestActorId` from payload | YES — assertActorOwnsVport on resourceId |
| `setAvailabilityExceptionController` | Owner action | `requestActorId` from payload | YES — assertActorOwnsVport on resourceId |
| `listOwnerBookingResourcesController` | Any caller | `ownerActorId` from payload | NO — no caller assertion |
| `updateBookingStatusController` (dashboard) | Owner or customer | `callerActorId` from payload | YES — terminal-state + isCustomer + assertActorOwnsVport |
| `createOwnerBookingController` (dashboard) | Owner action | `callerActorId` from payload | YES — assertActorOwnsVport |
| `createVportPublicBookingController` (dashboard) | Public/auth | `requestActorId` from payload | YES — actor kind check |
| `updateBookingStatusDAL` | Controller | `bookingId` only | NO OWNER FILTER at DAL |
| `upsertAvailabilityRuleDAL` | Controller | row.resource_id | onConflict:id — NO RULE OWNERSHIP CHECK |
| `upsertAvailabilityExceptionDAL` | Controller | row.resource_id | onConflict:id — NO EXCEPTION OWNERSHIP CHECK |
| `saveBookingServiceProfileDurationsByServiceIds.dal.js` | Controller | n/a | DEAD — undefined `supabase` |
| `upsertBookingResourceServices.dal.js` | Controller | n/a | DEAD — undefined `supabase` |

---

## Executive Summary

ELEKTRA's first pass on the booking feature confirms and code-grounds 10 existing VENOM/BW findings and surfaces 2 additional code-level gaps. The most critical risks are:

1. **Two dead DALs** (`saveBookingServiceProfileDurations`, `upsertBookingResourceServices`) reference an undefined `supabase` variable — any call throws `ReferenceError` immediately.
2. **Availability hijack** — `upsertAvailabilityRuleDAL` and `upsertAvailabilityExceptionDAL` use `onConflict:"id"` without verifying the existing row's `resource_id`; a caller who knows a foreign rule's UUID can overwrite it via their own resource.
3. **Missing terminal-state gate** — `confirmBookingController` has no guard against re-confirming cancelled or completed bookings. Dashboard `updateBookingStatusController` has this gate (VPD-V-021); core does not.
4. **Status enum not validated** in `createBookingController` for management sources — owner can insert bookings in any status, including `completed`, bypassing the state machine.
5. **Raw UUID** stored in `createBookingController` notification linkPath (line 138) — the cancel/confirm paths were patched; create was not.

All 8 HIGH findings are THOR release blockers.

---

## High Findings

---

```
SECURITY FINDING

- Finding ID:         ELEK-2026-06-04-001
- Title:              Availability Rule Cross-Actor Hijack via onConflict:id
- Category:           IDOR/BOLA
- Severity:           HIGH
- Status:             Open
- Scope:              VCSM
- Location:           apps/VCSM/src/features/booking/dal/upsertAvailabilityRule.dal.js:55-59
- Source:             Caller-supplied `ruleId` (optional, from setAvailabilityRuleController param)
- Sink:               .upsert(payload, { onConflict: "id" }) — UPDATE on row matched by id alone
- Trust Boundary:     setAvailabilityRuleController — verifies caller owns supplied resourceId,
                      does NOT verify the existing row for ruleId belongs to that resource
- Impact:             Attacker owns resource A. Knows rule UUID from victim's resource B.
                      Calls setAvailabilityRuleController(resourceId=A, ruleId=B_uuid).
                      Controller passes ownership check for resource A.
                      upsertAvailabilityRuleDAL performs UPDATE on row id=B_uuid, sets
                      resource_id to A. Victim's rule is removed from their calendar and
                      overwritten with attacker-controlled data.
- Evidence:
    // upsertAvailabilityRule.dal.js:55-59
    const { data, error } = await vportClient
      .from("availability_rules")
      .upsert(payload, { onConflict: "id" })  // <-- scoped to id alone

    // setAvailabilityRule.controller.js:34-42
    const resource = await getBookingResourceByIdDAL({ resourceId });
    await assertActorOwnsVportActorController({     // verifies resource A only
      requestActorId,
      targetActorId: resource.owner_actor_id,
    });
    // ruleId (from caller) is NEVER verified against resource.id
    const saved = await upsertAvailabilityRuleDAL({ row: { id: ruleId ?? undefined, ... } });

- Reproduction Steps:
    1. Attacker enumerates a victim VPORT's availability rules (public calendar endpoint)
       and obtains a rule UUID.
    2. Attacker calls setAvailabilityRule with their own resourceId and the victim's ruleId.
    3. DB upserts on conflict "id" → victim's rule row is overwritten.
    [No production exploitation required — code trace only]

- Existing Defense:   assertActorOwnsVportActorController on resourceId — owner of resource A verified.
- Why Defense Is Insufficient:
    The ownership check is against the supplied resourceId, not against the ruleId's current
    owner. The DAL uses onConflict:"id" which resolves solely on the rule's PK — allowing
    cross-resource rule mutation when a foreign ruleId is supplied.
- Recommended Fix:    Before calling upsertAvailabilityRuleDAL, if ruleId is non-null, fetch the
                      existing rule and verify rule.resource_id === resourceId. Reject if mismatch.
- Suggested Patch:
    // In setAvailabilityRule.controller.js, after assertActorOwnsVportActorController:
    if (ruleId) {
      const existingRule = await getAvailabilityRuleByIdDAL({ ruleId });
      if (!existingRule || String(existingRule.resource_id) !== String(resourceId)) {
        throw new Error("Rule does not belong to this resource.");
      }
    }
- Follow-up Command:  BLACKWIDOW (runtime validation of hijack path), DB (RLS on availability_rules)
```

---

```
SECURITY FINDING

- Finding ID:         ELEK-2026-06-04-002
- Title:              Availability Exception Cross-Actor Hijack via onConflict:id
- Category:           IDOR/BOLA
- Severity:           HIGH
- Status:             Open
- Scope:              VCSM
- Location:           apps/VCSM/src/features/booking/dal/upsertAvailabilityException.dal.js:51-55
- Source:             Caller-supplied `exceptionId` (optional param in setAvailabilityExceptionController)
- Sink:               .upsert(payload, { onConflict: "id" })
- Trust Boundary:     setAvailabilityExceptionController — verifies resourceId ownership,
                      does NOT verify the existing exception row belongs to that resource
- Impact:             Identical to ELEK-2026-06-04-001 but against availability exceptions.
                      Attacker can overwrite victim's closed/open time-off blocks.
- Evidence:
    // upsertAvailabilityException.dal.js:51-55
    const { data, error } = await vportClient
      .from("availability_exceptions")
      .upsert(payload, { onConflict: "id" })  // <-- scoped to id alone

    // setAvailabilityException.controller.js:31-39
    const resource = await getBookingResourceByIdDAL({ resourceId });
    await assertActorOwnsVportActorController({     // verifies resource A only
      requestActorId,
      targetActorId: resource.owner_actor_id,
    });
    // exceptionId is NEVER verified against resource.id
- Existing Defense:   assertActorOwnsVportActorController on resourceId.
- Why Defense Is Insufficient:  Same as ELEK-2026-06-04-001 — conflict resolution by PK only.
- Recommended Fix:    Before upsert, if exceptionId is non-null, fetch and verify
                      exception.resource_id === resourceId. Reject if mismatch.
- Suggested Patch:
    // In setAvailabilityException.controller.js, after assertActorOwnsVportActorController:
    if (exceptionId) {
      const existingExc = await getAvailabilityExceptionByIdDAL({ exceptionId });
      if (!existingExc || String(existingExc.resource_id) !== String(resourceId)) {
        throw new Error("Exception does not belong to this resource.");
      }
    }
- Follow-up Command:  BLACKWIDOW, DB
```

---

```
SECURITY FINDING

- Finding ID:         ELEK-2026-06-04-003
- Title:              confirmBookingController Missing Terminal-State Gate
- Category:           Privilege Escalation
- Severity:           HIGH
- Status:             Open
- Scope:              VCSM
- Location:           apps/VCSM/src/features/booking/controller/confirmBooking.controller.js:21-44
- Source:             bookingId from caller; existing booking status from DB
- Sink:               updateBookingStatusDAL — sets status="confirmed" unconditionally
- Trust Boundary:     confirmBookingController — ownership verified via assertActorOwnsVport;
                      no terminal-state guard
- Impact:             Owner can re-confirm a booking that is already cancelled or completed.
                      This reverts the terminal state, allowing a cancelled booking to appear
                      active again, bypassing cancellation semantics, and potentially
                      re-triggering notifications and calendar conflicts.
- Evidence:
    // confirmBooking.controller.js:21-44
    const booking = await getBookingByIdDAL({ bookingId });
    if (!booking) throw new Error("Booking not found.");
    // ← NO check on booking.status here
    const resource = await getBookingResourceByIdDAL({ resourceId: booking.resource_id });
    await assertActorOwnsVportActorController({ ... });
    const updated = await updateBookingStatusDAL({ bookingId, status: "confirmed", ... });

    // Compare: dashboard updateBookingStatusController.js:35-37 (FIXED):
    if (TERMINAL_STATUSES.includes(booking.status)) {
      throw new Error(`Booking is already ${booking.status} and cannot be modified.`);
    }
- Existing Defense:   None in confirmBookingController. Gate exists only in dashboard controller.
- Why Defense Is Insufficient:  Core booking engine is the authority — dashboard fix does not
                      protect against direct controller calls or future API wrappers.
- Recommended Fix:    Add terminal-state guard to confirmBookingController, mirroring the
                      dashboard implementation.
- Suggested Patch:
    // In confirmBooking.controller.js, after getBookingByIdDAL:
    const TERMINAL_STATUSES = new Set(["confirmed", "cancelled", "completed", "no_show"]);
    if (TERMINAL_STATUSES.has(booking.status)) {
      throw new Error(`Booking is already ${booking.status} and cannot be modified.`);
    }
    // Note: "confirmed" included so duplicate confirms are also rejected.
- Follow-up Command:  BLACKWIDOW (runtime re-confirm path), SPIDER-MAN (regression test)
```

---

```
SECURITY FINDING

- Finding ID:         ELEK-2026-06-04-004
- Title:              createBookingController status Enum Not Validated for Management Sources
- Category:           Privilege Escalation
- Severity:           HIGH
- Status:             Open
- Scope:              VCSM
- Location:           apps/VCSM/src/features/booking/controller/createBooking.controller.js:22, 105-125
- Source:             `status = null` parameter accepted from caller
- Sink:               insertBookingDAL({ row: { ..., status, ... } }) — line 111
- Trust Boundary:     createBookingController — validates source, duration, slot time;
                      does NOT validate status against an allowlist for management sources
- Impact:             An owner (source="owner") can create a booking pre-set to "completed",
                      "no_show", or any arbitrary string. This bypasses the booking state machine
                      (pending → confirmed → completed) and allows fabricating past bookings
                      in terminal states without flowing through business logic.
- Evidence:
    // createBooking.controller.js:22, 105-125
    export async function createBookingController({
      ...
      status = null,    // ← caller-controlled
      source = "public",
      ...
    }) {
      // source is validated (line 53)
      // duration is validated (line 58)
      // slot time is validated (line 101)
      // STATUS IS NEVER VALIDATED ← GAP
      const inserted = await insertBookingDAL({ row: { ..., status, ... } });
- Existing Defense:   `status = null` default for public source (DB likely defaults to "pending").
                      For management sources, no allowlist exists.
- Why Defense Is Insufficient:
    For MANAGEMENT_SOURCES {"owner","admin","import","sync"}, the owner is verified but
    can pass any status value including terminal states.
- Recommended Fix:    Add a status allowlist per source type. Management sources should only
                      be allowed to create bookings in {"pending","confirmed"} — not terminal states.
- Suggested Patch:
    // In createBooking.controller.js, after source validation:
    const MANAGEMENT_CREATE_STATUSES = new Set(["pending", "confirmed"]);
    const effectiveStatus = MANAGEMENT_SOURCES.has(String(source))
      ? (status ?? "confirmed")
      : null;  // public source: DB default
    if (effectiveStatus && !MANAGEMENT_CREATE_STATUSES.has(effectiveStatus)) {
      throw new Error(`createBookingController: invalid status "${effectiveStatus}"`);
    }
    // Pass effectiveStatus to insertBookingDAL instead of raw status.
- Follow-up Command:  VENOM (cross-reference VEN-BOOKING-004), SPIDER-MAN (add test)
```

---

```
SECURITY FINDING

- Finding ID:         ELEK-2026-06-04-005
- Title:              updateBookingStatusDAL Unscoped UPDATE — No Owner Filter at DAL Layer
- Category:           IDOR/BOLA
- Severity:           HIGH
- Status:             Open
- Scope:              VCSM
- Location:           apps/VCSM/src/features/booking/dal/updateBookingStatus.dal.js:47-52
- Source:             bookingId from caller
- Sink:               .update(patch).eq("id", bookingId) — UPDATE filtered only by PK
- Trust Boundary:     Caller controllers (confirmBooking, cancelBooking) — verify ownership
                      via assertActorOwnsVport before calling DAL; DAL itself has no filter.
- Impact:             If a controller path is ever added that skips the ownership assertion,
                      the DAL provides zero defense. RLS on vport.bookings is the sole
                      persistence-layer barrier. If RLS has a gap or service-role client is used,
                      any bookingId can be updated by any caller.
- Evidence:
    // updateBookingStatus.dal.js:47-52
    const { data, error } = await vportClient
      .from("bookings")
      .update(patch)
      .eq("id", bookingId)     // ← only filter is the PK
      .select(BOOKING_SELECT)
      .maybeSingle();
    // Compare: updateVportBookingDAL (dashboard) adds .eq("profile_id", profileId) as
    // a second binding — the core DAL does not.
- Existing Defense:   Controller-layer assertActorOwnsVport before every call.
                      Supabase RLS on vport.bookings (policy content unconfirmed).
- Why Defense Is Insufficient:
    Defense-in-depth requires the DAL to be self-defensive. A single controller bug or
    new caller that skips the ownership check would have no fallback at the DAL layer.
    TICKET-BOOKING-RPC-001 (state-machine RPCs) is the intended fix.
- Recommended Fix:    Either (a) add owner_actor_id or resource_id as a second .eq() filter
                      in the DAL, or (b) implement typed state-machine RPCs per
                      TICKET-BOOKING-RPC-001.
- Suggested Patch:
    // Option A — add scoping filter (requires owner_actor_id passed to DAL):
    export async function updateBookingStatusDAL({
      bookingId, ownerActorId, status, cancelledAt, completedAt, internalNote,
    } = {}) {
      ...
      const { data, error } = await vportClient
        .from("bookings")
        .update(patch)
        .eq("id", bookingId)
        .eq("owner_actor_id", ownerActorId)  // ← scope to owner
        .select(BOOKING_SELECT)
        .maybeSingle();
    }
- Follow-up Command:  DB (confirm RLS policy on vport.bookings), Carnage (RPC migration)
```

---

```
SECURITY FINDING

- Finding ID:         ELEK-2026-06-04-006
- Title:              saveBookingServiceProfileDurationsByServiceIds DAL Uses Undefined supabase
- Category:           Privilege Escalation (runtime crash — DAL completely non-functional)
- Severity:           HIGH
- Status:             Open
- Scope:              VCSM
- Location:           apps/VCSM/src/features/booking/dal/saveBookingServiceProfileDurationsByServiceIds.dal.js:38, 53, 79
- Source:             Any caller triggering service booking profile save
- Sink:               `supabase.schema("vc").from("service_booking_profiles")` — ReferenceError
- Trust Boundary:     Import at line 1 brings in `vportClient`, not `supabase`.
                      `supabase` is never imported or declared.
- Impact:             Every call to this DAL throws `ReferenceError: supabase is not defined`.
                      Slot configuration (duration, pricing) for booking services is completely dead.
                      Any feature depending on this DAL silently fails without writing to DB.
- Evidence:
    // saveBookingServiceProfileDurationsByServiceIds.dal.js:1
    import { vport as vportClient } from "@/services/supabase/vportClient";
    // ...
    // Line 38:
    const { data: existingRows, error: existingError } = await supabase  // ← undefined
      .schema("vc")
      .from("service_booking_profiles")...
    // Line 53:
    const { data, error } = await supabase  // ← undefined
      .schema("vc")...
    // Line 79:
    const { data, error } = await supabase  // ← undefined
- Existing Defense:   None — runtime crash.
- Why Defense Is Insufficient:  The variable is simply not imported.
- Recommended Fix:    Replace all `supabase` references with `vportClient` (the imported client).
                      Confirm `vc.service_booking_profiles` is accessible via vportClient schema.
- Suggested Patch:
    // At every supabase usage, replace:
    await supabase.schema("vc").from(...)
    // With:
    await vportClient.schema("vc").from(...)
    // Or if vc schema requires a separate client, import and use the correct one.
- Follow-up Command:  Deadpool (root cause — was this always broken or a refactor regression?),
                      SPIDER-MAN (add test for this DAL path)
```

---

```
SECURITY FINDING

- Finding ID:         ELEK-2026-06-04-007
- Title:              upsertBookingResourceServices DAL Uses Undefined supabase
- Category:           Privilege Escalation (runtime crash — DAL completely non-functional)
- Severity:           HIGH
- Status:             Open
- Scope:              VCSM
- Location:           apps/VCSM/src/features/booking/dal/upsertBookingResourceServices.dal.js:24
- Source:             Any caller triggering resource-service linkage
- Sink:               `supabase.schema("vc").from("resource_services")` — ReferenceError
- Trust Boundary:     Import at line 1 brings in `vport as vportClient`; `supabase` not imported.
- Impact:             Every call throws `ReferenceError: supabase is not defined`.
                      Service-resource linking is dead; resources cannot be associated with services.
- Evidence:
    // upsertBookingResourceServices.dal.js:1
    import { vport as vportClient } from "@/services/supabase/vportClient";
    // ...
    // Line 24:
    const { data, error } = await supabase  // ← undefined
      .schema("vc")
      .from("resource_services")
      .upsert(payload, { onConflict: "resource_id,service_id" })
- Existing Defense:   None — runtime crash.
- Recommended Fix:    Replace `supabase` with `vportClient` (or correct schema client).
- Suggested Patch:
    await vportClient.schema("vc").from("resource_services")...
    // Note: onConflict: "resource_id,service_id" is correct — keep as-is once variable is fixed.
- Follow-up Command:  Deadpool (same refactor regression as ELEK-006)
```

---

```
SECURITY FINDING

- Finding ID:         ELEK-2026-06-04-008
- Title:              createBookingController customerActorId Injection for Management Sources
- Category:           IDOR/BOLA
- Severity:           HIGH
- Status:             Open
- Scope:              VCSM
- Location:           apps/VCSM/src/features/booking/controller/createBooking.controller.js:18, 109
- Source:             `customerActorId = null` — accepted directly from caller payload
- Sink:               insertBookingDAL({ row: { customer_actor_id: customerActorId, ... } })
- Trust Boundary:     createBookingController — verifies requestActorId owns the VPORT;
                      does NOT verify customerActorId is a valid or consenting citizen
- Impact:             An authenticated VPORT owner (management source) can attribute a booking
                      to any citizen actorId without that citizen's knowledge or consent.
                      This creates fraudulent booking records in the victim's booking history
                      and can trigger notifications sent to that citizen.
- Evidence:
    // createBooking.controller.js:18, 109
    export async function createBookingController({
      ...
      customerActorId = null,  // ← caller-controlled, no validation
      ...
    }) {
      // assertActorOwnsVportActorController runs for requestActorId — NOT customerActorId
      const inserted = await insertBookingDAL({
        row: {
          customer_actor_id: customerActorId,  // ← raw caller value persisted
          ...
        }
      });
- Existing Defense:   None for customerActorId. requestActorId is verified.
- Why Defense Is Insufficient:
    For public source, requestActorId IS the customer (correct). For management sources, the
    intent may be to accept walk-in customers, but there is no validation that customerActorId
    is a real, non-voided actor. An owner could inject any UUID.
- Recommended Fix:    For management sources where customerActorId is provided, validate that
                      it is a real actor (kind="user", not voided). For public source,
                      always derive customerActorId from requestActorId (already done via
                      createVportPublicBookingController). Mark customerActorId as
                      owner-attribution-only with no downstream identity binding.
- Suggested Patch:
    // In createBooking.controller.js, after management source ownership check:
    if (customerActorId) {
      const customerActor = await getActorByIdDAL({ actorId: customerActorId });
      if (!customerActor || customerActor.is_void === true) {
        throw new Error("customerActorId does not refer to a valid citizen.");
      }
    }
- Follow-up Command:  VENOM (VEN-BOOKING-007 cross-reference)
```

---

## Medium Findings

---

```
SECURITY FINDING

- Finding ID:         ELEK-2026-06-04-009
- Title:              cancelBookingController Missing Terminal-State Guard
- Category:           Privilege Escalation
- Severity:           MEDIUM
- Status:             Open
- Scope:              VCSM
- Location:           apps/VCSM/src/features/booking/controller/cancelBooking.controller.js:45-51
- Source:             bookingId from caller; booking.status from DB
- Sink:               updateBookingStatusDAL({ status: "cancelled", cancelledAt: new Date().toISOString() })
- Trust Boundary:     cancelBookingController — ownership verified; no terminal-state guard
- Impact:             A customer can re-cancel an already-cancelled booking, overwriting
                      `cancelled_at` timestamp and `internalNote` on every call.
                      An owner can re-cancel completed or no-show bookings, mutating terminal state.
- Evidence:
    // cancelBooking.controller.js:45-51
    // ← no booking.status check before this call
    const updated = await updateBookingStatusDAL({
      bookingId,
      status: "cancelled",
      cancelledAt: new Date().toISOString(),
      completedAt: null,
      internalNote: cancelNote,
    });
    // Dashboard updateBookingStatusController.js:35-37 has the gate; core controller does not.
- Existing Defense:   None for terminal-state guard in cancelBookingController.
- Recommended Fix:    Add terminal-state guard before the updateBookingStatusDAL call.
- Suggested Patch:
    // In cancelBooking.controller.js, after getBookingByIdDAL:
    const TERMINAL = new Set(["cancelled", "completed", "no_show"]);
    if (TERMINAL.has(booking.status)) {
      throw new Error(`Booking is already ${booking.status} and cannot be cancelled.`);
    }
- Follow-up Command:  SPIDER-MAN (regression test for re-cancel)
```

---

```
SECURITY FINDING

- Finding ID:         ELEK-2026-06-04-010
- Title:              listOwnerBookingResourcesController Missing Caller Auth Assertion
- Category:           IDOR/BOLA
- Severity:           MEDIUM
- Status:             Open
- Scope:              VCSM
- Location:           apps/VCSM/src/features/booking/controller/listOwnerBookingResources.controller.js:4-18
- Source:             `ownerActorId` from caller payload
- Sink:               listBookingResourcesByOwnerActorIdDAL({ ownerActorId }) — returns all
                      booking resources for that actor
- Trust Boundary:     Controller — no assertActorOwnsVport or session check present
- Impact:             Any authenticated actor can enumerate booking resources of any other actor
                      by passing a foreign ownerActorId. This reveals resource names, calendar
                      configuration, and scheduling metadata belonging to other VPORTs.
- Evidence:
    // listOwnerBookingResources.controller.js:4-18
    export async function listOwnerBookingResourcesController({ ownerActorId, includeInactive = false }) {
      if (!ownerActorId) throw new Error(...);
      const rows = await listBookingResourcesByOwnerActorIdDAL({ ownerActorId, includeInactive });
      return mapBookingResourceRows(rows);
      // ← no caller identity check anywhere
    }
- Existing Defense:   None at controller layer. RLS (if configured) is the only barrier.
- Recommended Fix:    Accept a `requestActorId` parameter and call assertActorOwnsVportActorController
                      before the DAL call. Alternatively, if this is intentionally public-readable
                      for the public booking calendar, document the intent and remove
                      `includeInactive` from the exposed path.
- Suggested Patch:
    export async function listOwnerBookingResourcesController({
      requestActorId,
      ownerActorId,
      includeInactive = false,
    } = {}) {
      if (!requestActorId) throw new Error("requestActorId is required");
      if (!ownerActorId) throw new Error("ownerActorId is required");
      await assertActorOwnsVportActorController({ requestActorId, targetActorId: ownerActorId });
      const rows = await listBookingResourcesByOwnerActorIdDAL({ ownerActorId, includeInactive });
      return mapBookingResourceRows(rows);
    }
- Follow-up Command:  VENOM (trust boundary design review for resource enumeration)
```

---

```
SECURITY FINDING

- Finding ID:         ELEK-2026-06-04-011
- Title:              createBookingController Raw UUID in Notification linkPath
- Category:           IDOR/BOLA
- Severity:           MEDIUM
- Status:             Open
- Scope:              VCSM
- Location:           apps/VCSM/src/features/booking/controller/createBooking.controller.js:138
- Source:             resource.owner_actor_id (UUID from DB)
- Sink:               publishVcsmNotification linkPath field — stored in notification row
- Trust Boundary:     createBookingController — constructs notification; does not fetch slug
- Impact:             Raw UUID stored in notification row. Any actor who can read notification
                      rows via DB or API gains access to the VPORT owner's internal UUID,
                      enabling actor enumeration. Cancel/confirm paths were patched (VPD-V-020);
                      create path was not.
- Evidence:
    // createBooking.controller.js:138
    linkPath: `/actor/${resource.owner_actor_id}/dashboard/booking-history`,
    //                   ^^ raw UUID

    // confirmBooking.controller.js:55-62 (PATCHED):
    const ownerSlug = await getVportSlugByActorIdDAL({ actorId: resource.owner_actor_id });
    linkPath: ownerSlug ? `/profile/${ownerSlug}?tab=book` : null,
    // ← slug-based, no UUID
- Existing Defense:   Slug-based linkPath implemented in confirmBookingController and
                      cancelBookingController. createBookingController not updated.
- Recommended Fix:    Apply same slug-lookup pattern as confirmBookingController.
- Suggested Patch:
    // In createBooking.controller.js, before publishVcsmNotification:
    const ownerSlug = await getVportSlugByActorIdDAL({ actorId: resource.owner_actor_id });
    publishVcsmNotification({
      ...
      linkPath: ownerSlug ? `/profile/${ownerSlug}?tab=book` : null,
      ...
    });
- Follow-up Command:  VENOM (VEN-BOOKING-009 cross-reference)
```

---

```
SECURITY FINDING

- Finding ID:         ELEK-2026-06-04-012
- Title:              listBookingsByCustomerDAL Selects and Returns Internal profile_id
- Category:           Supabase RLS / Architecture Contract Violation
- Severity:           MEDIUM
- Status:             Open
- Scope:              VCSM
- Location:           apps/VCSM/src/features/booking/dal/listBookingsByCustomer.dal.js:6-7, 24
- Source:             DB row — `profile_id` selected and returned to caller
- Sink:               Caller receives `profile_id` (internal DB identifier)
                      + `profiles!profile_id(actor_id,name)` join surfaced as `customerProfileId`
- Trust Boundary:     DAL — no filtering; returns internal identifiers to booking.model.js
- Impact:             Internal `profile_id` (non-actor-scoped DB PK) is surfaced through the
                      booking model to UI consumers. Violates architecture contract (no profileId
                      in public surfaces). Secondary: enables enumeration of profile table PKs
                      via the booking history API.
- Evidence:
    // listBookingsByCustomer.dal.js:6-7
    "profile_id",
    ...
    "profiles!profile_id(actor_id,name)",

    // booking.model.js maps this as customerProfileId — surfaced to hooks and UI
- Existing Defense:   None — explicit selection.
- Recommended Fix:    Remove `profile_id` from BOOKING_SELECT in this DAL.
                      Remove the `profiles!profile_id(...)` join — use `resources!resource_id`
                      to get owner info instead.
- Suggested Patch:
    const BOOKING_SELECT = [
      "id", "resource_id", "service_id",
      "customer_actor_id",        // ← keep, this is actor-scoped
      // "profile_id",            // ← REMOVE
      // "profiles!profile_id...", // ← REMOVE
      "status", "source",
      ...
      "resources!resource_id(owner_actor_id,name)",  // ← use this instead
    ].join(",");
- Follow-up Command:  VENOM (VEN-BOOKING-010 cross-reference), DB (confirm no other callers need profile_id)
```

---

## False Positives Rejected

---

```
FALSE POSITIVE REJECTED

- Candidate:         useCreateBooking hook passes raw payload without binding requestActorId
- Location:          apps/VCSM/src/features/booking/hooks/useCreateBooking.js:9-14
- Rejection reason:  Chain gap at Impact link — hook is a thin pass-through that calls
                     createBooking(payload); the actual actorId binding must happen at the
                     component layer. Cannot confirm a full exploit chain without reading
                     all consumer components. BW-BOOK-003 already tracks this as PARTIAL.
- Chain gap:         Impact (cannot confirm UI layer passes arbitrary actorId vs session-derived)
- Notes:             Risk is real but grounding requires component-level trace beyond current scope.
                     BW should drive runtime validation of this path.
```

---

```
FALSE POSITIVE REJECTED

- Candidate:         createOwnerBookingController status hardcoded to "confirmed"
- Location:          apps/VCSM/src/features/dashboard/vport/dashboard/cards/bookings/controller/createOwnerBooking.controller.js:47
- Rejection reason:  status is hardcoded server-side to "confirmed". Service label defaults
                     to "Appointment" if not provided. No client-controlled status injection.
                     Ownership verified via assertActorOwnsVportActorController. No finding.
- Chain gap:         Source (no untrusted status field reaches this sink)
- Notes:             This controller is correctly implemented. Dashboard owner-create path is safe.
```

---

```
FALSE POSITIVE REJECTED

- Candidate:         createVportPublicBookingController serviceLabelSnapshot from client
- Location:          apps/VCSM/src/features/dashboard/vport/dashboard/cards/bookings/controller/vportPublicBooking.controller.js:67-74
- Rejection reason:  Service label is derived server-side from getVportServiceByIdDAL — client
                     snapshot is explicitly NOT trusted (comment at line 67). customer_actor_id
                     is always requestActorId (never caller-injected, comment at line 81-84).
                     No injection vector present.
- Chain gap:         Sink (server-side derivation breaks the chain)
- Notes:             This is the correctly-implemented reference for how the core createBookingController
                     should handle serviceLabelSnapshot and customerActorId.
```

---

## Suggested Patch Queue

| # | Finding ID | Title | Severity | Layer to Patch | Patch Complexity | Requires DB Change |
|---|---|---|---|---|---|---|
| 1 | ELEK-2026-06-04-001 | Availability Rule Cross-Actor Hijack | HIGH | Controller | SIMPLE | NO |
| 2 | ELEK-2026-06-04-002 | Availability Exception Cross-Actor Hijack | HIGH | Controller | SIMPLE | NO |
| 3 | ELEK-2026-06-04-003 | confirmBookingController Terminal-State Gate | HIGH | Controller | SIMPLE | NO |
| 4 | ELEK-2026-06-04-004 | createBookingController status Allowlist | HIGH | Controller | SIMPLE | NO |
| 5 | ELEK-2026-06-04-005 | updateBookingStatusDAL Unscoped UPDATE | HIGH | DAL + RLS | COMPLEX | YES |
| 6 | ELEK-2026-06-04-006 | saveBookingServiceProfile undefined supabase | HIGH | DAL | SIMPLE | NO |
| 7 | ELEK-2026-06-04-007 | upsertBookingResourceServices undefined supabase | HIGH | DAL | SIMPLE | NO |
| 8 | ELEK-2026-06-04-008 | createBookingController customerActorId Injection | HIGH | Controller | SIMPLE | NO |
| 9 | ELEK-2026-06-04-009 | cancelBookingController Terminal-State Guard | MEDIUM | Controller | SIMPLE | NO |
| 10 | ELEK-2026-06-04-010 | listOwnerBookingResources IDOR | MEDIUM | Controller | SIMPLE | NO |
| 11 | ELEK-2026-06-04-011 | createBookingController Raw UUID in linkPath | MEDIUM | Controller | SIMPLE | NO |
| 12 | ELEK-2026-06-04-012 | listBookingsByCustomer profile_id Exposure | MEDIUM | DAL + Model | MODERATE | NO |

---

## THOR Release Blockers

Per ELEKTRA governance contract — all HIGH open findings are THOR blockers:

| Finding ID | Title | Blocker Type |
|---|---|---|
| ELEK-2026-06-04-001 | Availability Rule Cross-Actor Hijack | NEW — IDOR confirmed |
| ELEK-2026-06-04-002 | Availability Exception Cross-Actor Hijack | NEW — IDOR confirmed |
| ELEK-2026-06-04-003 | confirmBookingController Terminal-State Gate | NEW — state machine bypass |
| ELEK-2026-06-04-004 | createBookingController status Allowlist | Confirms VEN-BOOKING-004 |
| ELEK-2026-06-04-005 | updateBookingStatusDAL Unscoped UPDATE | Confirms VEN-BOOKING-001 |
| ELEK-2026-06-04-006 | saveBookingServiceProfile undefined supabase | Confirms VEN-BOOKING-002 |
| ELEK-2026-06-04-007 | upsertBookingResourceServices undefined supabase | Confirms VEN-BOOKING-003 |
| ELEK-2026-06-04-008 | createBookingController customerActorId Injection | Confirms VEN-BOOKING-007 |

---

## Required Follow-up Commands

| Command | Reason | Status |
|---|---|---|
| BLACKWIDOW | Runtime validation of ELEK-001/002 (availability hijack paths) and ELEK-003 (re-confirm terminal bypass) | PENDING |
| DB | Confirm RLS policy on vport.bookings — VEN-BOOKING-001/ELEK-005 defense-in-depth | PENDING |
| DB | Confirm RLS on availability_rules and availability_exceptions | PENDING |
| Carnage | State-machine RPC migration per TICKET-BOOKING-RPC-001 | PENDING |
| SPIDER-MAN | Regression tests for terminal-state gate (ELEK-003, ELEK-009), status enum (ELEK-004), undefined supabase DALs (ELEK-006, ELEK-007) | PENDING |
| Deadpool | Root-cause on undefined supabase in two DALs — was this a refactor regression or always broken? | PENDING |
| Thor | All 8 HIGH findings are release gate candidates | PENDING |

---

## Cross-Reference — VENOM and BLACKWIDOW Open Findings Status

| VENOM/BW ID | ELEKTRA Cross-Ref | Code Confirmed | Notes |
|---|---|---|---|
| VEN-BOOKING-001 | ELEK-2026-06-04-005 | YES | updateBookingStatusDAL:47-52 confirmed |
| VEN-BOOKING-002 | ELEK-2026-06-04-006 | YES | undefined supabase at lines 38,53,79 |
| VEN-BOOKING-003 | ELEK-2026-06-04-007 | YES | undefined supabase at line 24 |
| VEN-BOOKING-004 | ELEK-2026-06-04-004 | YES | status never validated for management sources |
| VEN-BOOKING-005 | N/A | CLOSED | Slug-based paths confirmed in cancel/confirm controllers |
| VEN-BOOKING-006 | N/A | OPEN | BEHAVIOR.md placeholder — not in ELEKTRA scope |
| VEN-BOOKING-007 | ELEK-2026-06-04-008 | YES | customerActorId line 18→109 |
| VEN-BOOKING-008 | N/A | OPEN-LOW | Resource-missing throws correctly |
| VEN-BOOKING-009 | ELEK-2026-06-04-011 | YES | Line 138 raw UUID confirmed |
| VEN-BOOKING-010 | ELEK-2026-06-04-012 | YES | profile_id in BOOKING_SELECT line 6-7 |
| BW-BOOK-007 | ELEK-2026-06-04-010 | YES | No assertActorOwns in listOwnerBookingResources |
| BW-BOOK-009 | ELEK-2026-06-04-001 | YES | onConflict:id confirmed; no ruleId ownership check |
| BW-BOOK-010 | ELEK-2026-06-04-002 | YES | Same vector for exceptions |
| BW-BOOK-012 | ELEK-2026-06-04-003 | YES | No terminal-state guard in confirmBookingController |
| BW-BOOK-013 | ELEK-2026-06-04-009 | YES | No terminal-state guard in cancelBookingController |
| BW-BOOK-015 | ELEK-2026-06-04-011 | YES | Same as VEN-BOOKING-009; cross-confirmed |
