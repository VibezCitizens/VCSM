# ELEKTRA Security Report

**Date:** 2026-06-05
**Scope:** VCSM + ENGINE
**Reviewer:** ELEKTRA
**Scan Trigger:** MANUAL
**Findings Summary:** 0 HIGH | 2 MEDIUM | 1 LOW | 1 INFO
**False Positives Rejected:** 9
**Suggested Patches:** 4

---

## Executive Summary

The bookings module is well-hardened on its primary write paths. The vport dashboard controller stack
(`updateBookingStatusController`, `rescheduleBookingController`, `createOwnerBookingController`,
`createVportPublicBookingController`) all demonstrate correct ownership patterns: callerActorId
derived from session, `assertActorOwnsVportActorController` called before every write, TERMINAL_STATUSES
guard preventing mutation of closed bookings, and status validated against per-role allowlists.

Two MEDIUM findings exist in the **legacy** booking engine controller (`createBooking.controller.js`):
(1) the `status` field is accepted from the caller without a server-side allowlist for public bookings,
enabling state-machine bypass; (2) VPD-V-020 (slug-based notification linkPath) was applied to
`cancelBooking` and `confirmBooking` but was not applied to `createBooking`, leaving a raw UUID in
the `linkPath` stored per notification row. Both are in the engine booking path, not the vport
dashboard path.

One LOW finding covers the legacy `updateBookingStatusDAL` which has no ownership anchor at the DAL
layer — mitigation is confirmed at the controller level but the defense-in-depth gap warrants
resolution via TICKET-BOOKING-RPC-001.

---

## High Findings

None.

---

## Medium Findings

---

### SECURITY FINDING

- **Finding ID:**         ELEK-2026-06-05-001
- **Title:**              Legacy createBookingController — `status` enum accepted from caller without allowlist (public source path)
- **Category:**           Controller Input Trust
- **Severity:**           MEDIUM
- **Status:**             Open
- **Scope:**              VCSM + ENGINE
- **Location:**           `apps/VCSM/src/features/booking/controller/createBooking.controller.js:15–150`
- **Source:**             Caller-supplied `status` parameter (any value, unconstrained)
- **Sink:**               `insertBookingDAL({ row: { ..., status, ... } })` at line 105–125
- **Trust Boundary:**     `createBookingController` — enum fields must be validated before DAL call
- **Impact:**             A citizen actor using the public source path can pass `status: "confirmed"` or
                          `status: "completed"` to create a pre-approved booking, bypassing the
                          `pending → confirmed` state machine that normally requires explicit VPORT owner action.
                          The VPORT owner loses the approval gate for their own booking calendar.
- **Evidence:**
  ```js
  // createBooking.controller.js:15 — status accepted from caller, default null
  export async function createBookingController({
    ...
    status = null,
    source = "public",
    ...
  } = {}) {
    // CITIZEN_ONLY_SOURCES check runs — kind gate enforced — but status is never validated
    if (CITIZEN_ONLY_SOURCES.has(String(source))) {
      if (!requestActorId) throw new Error("Only citizens can book appointments.");
      const requestActor = await getActorByIdDAL({ actorId: requestActorId });
      // ↑ kind check: only "user" actors pass. No status allowlist.
    }

    const inserted = await insertBookingDAL({
      row: {
        ...
        status,      // ← caller value flows to DB unconstrained
        ...
      },
    });
  ```

  Contrast with the newer controller which hardcodes status:
  ```js
  // vportPublicBooking.controller.js:88 — status hardcoded
  row: {
    ...
    status: "pending",  // ← server-authoritative, not caller-supplied
    ...
  }
  ```
- **Reproduction Steps:**
  1. Authenticate as a citizen actor (kind: "user")
  2. Call `createBookingController` with `source: "public"`, `status: "confirmed"`, valid resourceId and time range
  3. Observe: booking is created with `status: "confirmed"` — owner confirmation step skipped
  4. (No production exploitation. Test in isolated env only.)
- **Existing Defense:**   Source field is validated against `ALL_VALID_SOURCES` allowlist. Kind gate enforced.
                          Duration range-checked. Future timestamp enforced.
- **Why Defense Is Insufficient:** The source allowlist and kind gate do not constrain what status value
  a citizen can inject. Status is passed to `insertBookingDAL` as-is. No DB-level check constraint
  confirmed (TICKET-BOOKING-RPC-001 notes "status overpermission confirmed on live DB").
- **Recommended Fix:**    For `CITIZEN_ONLY_SOURCES` ("public"), force `status = "pending"` server-side
                          regardless of caller input. For `MANAGEMENT_SOURCES`, validate against an
                          explicit set of owner-permitted creation statuses.
- **Suggested Patch:**
  ```js
  // createBooking.controller.js — add after the CITIZEN_ONLY_SOURCES kind check
  const CITIZEN_CREATION_STATUSES = new Set(["pending"]);
  const OWNER_CREATION_STATUSES   = new Set(["pending", "confirmed"]);

  // In CITIZEN_ONLY_SOURCES branch, force status:
  const resolvedStatus = CITIZEN_ONLY_SOURCES.has(String(source))
    ? "pending"
    : (OWNER_CREATION_STATUSES.has(String(status)) ? status : "pending");

  // Then pass resolvedStatus to insertBookingDAL instead of status
  ```
- **Follow-up Command:** DB (verify no check constraint on status col), Carnage (add DB check constraint as part of TICKET-BOOKING-RPC-001 migration), BLACKWIDOW (runtime validation of state-machine bypass via legacy path)

---

### SECURITY FINDING

- **Finding ID:**         ELEK-2026-06-05-002
- **Title:**              Legacy createBookingController — raw `owner_actor_id` UUID in notification `linkPath` (VPD-V-020 gap)
- **Category:**           URL and Redirect
- **Severity:**           MEDIUM
- **Status:**             Open
- **Scope:**              VCSM + ENGINE
- **Location:**           `apps/VCSM/src/features/booking/controller/createBooking.controller.js:138`
- **Source:**             `resource.owner_actor_id` (raw UUID from DB, stored into notification row)
- **Sink:**               `publishVcsmNotification({ linkPath: \`/actor/${resource.owner_actor_id}/dashboard/booking-history\` })`
- **Trust Boundary:**     Notification construction — linkPath must use slug-based routes, not raw UUIDs
- **Impact:**             The raw VPORT owner actor UUID is stored in the `linkPath` column of the
                          notifications table. If notification rows are exposed via any API read path,
                          the stored UUID is available for enumeration. The VPD-V-020 fix was applied
                          to `cancelBooking.controller.js` and `confirmBooking.controller.js` but was
                          missed here — creating an inconsistency where new bookings produce UUID-bearing
                          notifications while cancellations and confirmations do not.
- **Evidence:**
  ```js
  // createBooking.controller.js:132–147
  if (source === "public" && resource.owner_actor_id && requestActorId) {
    if (String(requestActorId) !== String(resource.owner_actor_id)) {
      publishVcsmNotification({
        recipientActorId: resource.owner_actor_id,
        actorId: requestActorId,
        kind: "booking_created",
        objectType: "booking",
        objectId: mapped.id,
        linkPath: `/actor/${resource.owner_actor_id}/dashboard/booking-history`,  // ← raw UUID
        ...
      });
    }
  }
  ```

  Fixed pattern in cancelBooking.controller.js (lines 74–79):
  ```js
  const ownerSlug = await getVportSlugByActorIdDAL({ actorId: resource.owner_actor_id });
  linkPath = ownerSlug ? `/profile/${ownerSlug}?tab=book` : null;
  // Comment: "omit the dashboard path to avoid storing UUIDs in notification rows"
  ```
- **Reproduction Steps:**
  1. Create a public booking via `createBookingController` with a valid citizen requestActorId and resource
  2. Read the resulting notification row from `notifications` table for `recipientActorId = resource.owner_actor_id`
  3. Observe: `link_path` column contains `/actor/{raw-uuid}/dashboard/booking-history`
  4. (No production exploitation; DB read access required.)
- **Existing Defense:**   `objectId` correctly stores `mapped.id` (booking UUID, not actor UUID). The raw
                          UUID is limited to `linkPath` only.
- **Why Defense Is Insufficient:** The platform rule (VPD-V-020, memory `feedback_no_raw_ids_in_urls.md`)
  prohibits raw UUIDs in any stored notification linkPath. cancelBooking and confirmBooking comply;
  createBooking does not.
- **Recommended Fix:**    Mirror the cancelBooking pattern: call `getVportSlugByActorIdDAL` to resolve
                          the owner slug and build a slug-based path. If slug is unavailable, pass
                          `linkPath: null`.
- **Suggested Patch:**
  ```js
  // createBooking.controller.js — replace linkPath construction
  import { getVportSlugByActorIdDAL } from "@/features/booking/dal/getVportSlugByActorId.dal";

  // Replace lines 138 (inside the notification block):
  const ownerSlug = await getVportSlugByActorIdDAL({ actorId: resource.owner_actor_id });
  publishVcsmNotification({
    recipientActorId: resource.owner_actor_id,
    actorId: requestActorId,
    kind: "booking_created",
    objectType: "booking",
    objectId: mapped.id,
    linkPath: ownerSlug ? `/profile/${ownerSlug}?tab=book` : null,  // slug-based or null
    context: { ... },
  });
  ```
- **Follow-up Command:**  BLACKWIDOW (verify notification row inspection path), DB (audit existing notification rows for UUID linkPaths from prior creates)

---

## Low Findings

---

### SECURITY FINDING

- **Finding ID:**         ELEK-2026-06-05-003
- **Title:**              `updateBookingStatusDAL` — no ownership anchor at DAL layer (defense-in-depth)
- **Category:**           IDOR/BOLA
- **Severity:**           LOW
- **Status:**             Open
- **Scope:**              VCSM + ENGINE
- **Location:**           `apps/VCSM/src/features/booking/dal/updateBookingStatus.dal.js:28–56`
- **Source:**             `bookingId` passed from caller (controller-verified)
- **Sink:**               `.update(patch).eq("id", bookingId)` — no secondary ownership column filter
- **Trust Boundary:**     DAL layer — defense-in-depth ownership anchor should exist independent of controller
- **Impact:**             If controller-level ownership check is bypassed (via a future code path, bug,
                          or refactor), the DAL has no fallback ownership anchor. The new `updateVportBookingDAL`
                          adds `.eq("profile_id", profileId)` as defense-in-depth. The legacy DAL does not.
                          Currently no exploit path exists because both `cancelBookingController` and
                          `confirmBookingController` correctly call `assertActorOwnsVportActorController`
                          before this DAL.
- **Evidence:**
  ```js
  // updateBookingStatus.dal.js:48–53 — broad update by bookingId only
  const { data, error } = await vportClient
    .from("bookings")
    .update(patch)
    .eq("id", bookingId)          // ← only anchor
    .select(BOOKING_SELECT)
    .maybeSingle();

  // Compare to updateVportBooking.write.dal.js:25–32 — defense-in-depth pattern
  const { data, error } = await vportSchema
    .from("bookings")
    .update(row)
    .eq("id", bookingId)
    .eq("profile_id", profileId)  // ← ownership anchor added at DAL layer
    .select(SELECT_COLS)
    .single();
  ```
- **Existing Defense:**   Controller-level `assertActorOwnsVportActorController` verified for all callers.
                          RLS assumed to be present (unconfirmed — TICKET-BOOKING-RPC-001).
- **Why Defense Is Insufficient:** Single-layer defense. No DAL-level ownership anchor. Does not follow
  the hardened pattern established in `updateVportBookingDAL`. Makes future callers of this DAL
  responsible for remembering the ownership check — creates a footgun.
- **Recommended Fix:**    Update `updateBookingStatusDAL` to accept an optional `ownerActorId` or
                          `resourceId` parameter and add a secondary ownership filter. Or migrate all
                          callers to the newer `updateVportBookingDAL` pattern (TICKET-BOOKING-RPC-001).
- **Suggested Patch:**
  ```js
  // updateBookingStatus.dal.js — add resource_id anchor as defense-in-depth
  export async function updateBookingStatusDAL({
    bookingId,
    status,
    resourceId = null,   // ← new optional anchor
    cancelledAt,
    completedAt,
    internalNote,
  } = {}) {
    ...
    let query = vportClient.from("bookings").update(patch).eq("id", bookingId);
    if (resourceId) query = query.eq("resource_id", resourceId);  // defense-in-depth scope
    const { data, error } = await query.select(BOOKING_SELECT).maybeSingle();
    ...
  }
  ```
- **Follow-up Command:**  DB (confirm RLS on bookings table and status column constraint), Carnage (include in TICKET-BOOKING-RPC-001 migration scope)

---

## Info Findings

---

### SECURITY FINDING

- **Finding ID:**         ELEK-2026-06-05-004
- **Title:**              Legacy createBookingController — `serviceLabelSnapshot` trusted from caller
- **Category:**           Controller Input Trust
- **Severity:**           INFO
- **Status:**             Open
- **Scope:**              VCSM + ENGINE
- **Location:**           `apps/VCSM/src/features/booking/controller/createBooking.controller.js:47–49`
- **Source:**             `serviceLabelSnapshot` parameter from caller
- **Sink:**               `insertBookingDAL({ row: { service_label_snapshot: serviceLabelSnapshot } })`
- **Trust Boundary:**     Controller — snapshot fields used for display should be server-resolved
- **Impact:**             A caller can inject an arbitrary service label into the booking record (e.g.,
                          "Premium Service" instead of "Basic Haircut"). This does not affect pricing,
                          scheduling, or access control. Impact is limited to visual misrepresentation
                          in the booking history. No financial or authorization risk confirmed.
- **Evidence:**
  ```js
  // createBooking.controller.js:47-49
  if (!serviceLabelSnapshot) {
    throw new Error("createBookingController: serviceLabelSnapshot is required");
  }
  // serviceLabelSnapshot is caller-supplied with no server-side catalog verification
  ```

  Contrast with newer controller which resolves it server-side:
  ```js
  // vportPublicBooking.controller.js:67-74
  let resolvedLabel = "Appointment";
  if (serviceId) {
    const service = await getVportServiceByIdDAL({ serviceId });
    if (service) {
      resolvedLabel = service.label || service.key || "Appointment";
    }
  }
  // resolvedLabel is used — caller value ignored entirely
  ```
- **Existing Defense:**   Field is validated as non-empty. Downstream consumers treat it as display-only.
- **Why Defense Is Insufficient:**  No server-side catalog resolution. Caller can inject any string.
- **Recommended Fix:**    Resolve `serviceLabelSnapshot` server-side from `getVportServiceByIdDAL`
                          when `serviceId` is present, falling back to a sensible default. Accept the
                          caller-supplied value only as a fallback when `serviceId` is absent.
- **Suggested Patch:**
  ```js
  // createBooking.controller.js — resolve label server-side
  let resolvedLabel = serviceLabelSnapshot || "Appointment";
  if (serviceId) {
    const svc = await getVportServiceByIdDAL({ serviceId });
    if (svc) resolvedLabel = svc.label || svc.key || resolvedLabel;
  }
  // Pass resolvedLabel to insertBookingDAL instead of serviceLabelSnapshot
  ```
- **Follow-up Command:**  None required — INFO finding, no release blocker.

---

## False Positives Rejected

---

```
FALSE POSITIVE REJECTED

- Candidate:        useVportBookingActions callerActorId source
- Location:         apps/VCSM/src/features/dashboard/vport/dashboard/cards/bookings/hooks/useVportBookingActions.js:7
- Rejection reason: actorId derived from `useIdentity()` identity context — session-sourced, not prop or URL
- Chain gap:        Source
- Notes:            Identity hook is the canonical session surface in VCSM
```

```
FALSE POSITIVE REJECTED

- Candidate:        createVportPublicBookingController customer_actor_id injection
- Location:         apps/VCSM/src/features/dashboard/vport/dashboard/cards/bookings/controller/vportPublicBooking.controller.js:83
- Rejection reason: customer_actor_id set to requestActorId (session-derived); VPD-V-019 comment confirms intent
- Chain gap:        Source
- Notes:            VPD-V-019 explicitly prevents attribution injection. Regression test covers this.
```

```
FALSE POSITIVE REJECTED

- Candidate:        createOwnerBookingController missing ownership check
- Location:         apps/VCSM/src/features/dashboard/vport/dashboard/cards/bookings/controller/createOwnerBooking.controller.js:35-38
- Rejection reason: assertActorOwnsVportActorController called before insertVportBookingDAL
- Chain gap:        Trust Boundary (defense present and confirmed)
- Notes:            Ownership verified via actor_owners through booking adapter
```

```
FALSE POSITIVE REJECTED

- Candidate:        updateBookingStatusController status enum from caller
- Location:         apps/VCSM/src/features/dashboard/vport/dashboard/cards/bookings/controller/updateVportBooking.controller.js:25-97
- Rejection reason: status validated against OWNER_STATUSES and CUSTOMER_STATUSES allowlists per role
- Chain gap:        Trust Boundary (allowlist present)
- Notes:            TERMINAL_STATUSES guard additionally prevents mutation of closed bookings
```

```
FALSE POSITIVE REJECTED

- Candidate:        rescheduleBookingController missing conflict check
- Location:         apps/VCSM/src/features/dashboard/vport/dashboard/cards/bookings/controller/updateVportBooking.controller.js:99-146
- Rejection reason: listVportBookingsInRangeDAL called to detect slot conflicts; startsAt < endsAt enforced
- Chain gap:        Defense present
- Notes:            Ownership verified via assertActorOwnsVportActorController before conflict check and write
```

```
FALSE POSITIVE REJECTED

- Candidate:        assertActorOwnsVportActorController kind-before-self-shortcut bypass
- Location:         apps/VCSM/src/features/booking/controller/assertActorOwnsVportActor.controller.js:11-60
- Rejection reason: ELEK-004 already patched — kind check is unconditional and precedes self-shortcut
- Chain gap:        Defense present (previously patched)
- Notes:            VPORT-kind requestActorId === targetActorId no longer bypasses kind gate
```

```
FALSE POSITIVE REJECTED

- Candidate:        cancelBookingController UUID in notification linkPath
- Location:         apps/VCSM/src/features/booking/controller/cancelBooking.controller.js:74-79
- Rejection reason: VPD-V-020 correctly applied — slug resolved via getVportSlugByActorIdDAL; linkPath=null fallback
- Chain gap:        Defense present
- Notes:            This is the reference implementation for ELEK-2026-06-05-002's suggested patch
```

```
FALSE POSITIVE REJECTED

- Candidate:        confirmBookingController UUID in notification linkPath
- Location:         apps/VCSM/src/features/booking/controller/confirmBooking.controller.js:55-56
- Rejection reason: VPD-V-020 correctly applied — slug resolved via getVportSlugByActorIdDAL; linkPath=null fallback
- Chain gap:        Defense present
- Notes:            Same pattern as cancelBooking — VPD-V-020 was applied here but not in createBooking
```

```
FALSE POSITIVE REJECTED

- Candidate:        insertVportBookingDAL unrestricted field passthrough
- Location:         apps/VCSM/src/features/dashboard/vport/dashboard/cards/bookings/dal/insertVportBooking.write.dal.js
- Rejection reason: WRITE_COLS Object.freeze allowlist applied via pick() — arbitrary fields cannot be injected
- Chain gap:        Defense present (explicit column allowlist)
- Notes:            status is in WRITE_COLS but is hardcoded by callers in this controller stack
```

---

## Suggested Patch Queue

| # | Finding ID | Title | Severity | Layer to Patch | Patch Complexity | Requires DB Change |
|---|---|---|---|---|---|---|
| 1 | ELEK-2026-06-05-001 | createBookingController: status enum allowlist for public path | MEDIUM | Controller | SIMPLE | NO (additive — but Carnage should add DB check constraint via TICKET-BOOKING-RPC-001) |
| 2 | ELEK-2026-06-05-002 | createBookingController: slug-based linkPath (VPD-V-020) | MEDIUM | Controller | SIMPLE | NO |
| 3 | ELEK-2026-06-05-003 | updateBookingStatusDAL: add resourceId ownership anchor | LOW | DAL | SIMPLE | NO |
| 4 | ELEK-2026-06-05-004 | createBookingController: server-resolve serviceLabelSnapshot | INFO | Controller | SIMPLE | NO |

---

## Required Follow-up Commands

| Command | Reason | Status |
|---|---|---|
| DB | Confirm RLS state on `vport.bookings`; audit `status` check constraint; scan notifications rows for UUID linkPaths from prior creates | PENDING |
| Carnage | Include ELEK-001 + ELEK-003 in TICKET-BOOKING-RPC-001 migration: add DB check constraint on `status` and secondary anchor column on `updateBookingStatusDAL` scope | PENDING |
| BLACKWIDOW | Runtime simulation: (1) state-machine bypass via `createBookingController` with `status: "confirmed"` on public source; (2) notification linkPath UUID exposure via API read of notification rows | PENDING |
| Thor | ELEK-001 and ELEK-002 are MEDIUM open — not release blockers per THOR gate; flag as CAUTION on next release that touches booking creation path | PENDING |

---

## THOR Release Gate Status

- **ELEK-2026-06-05-001** (MEDIUM) — NOT a release blocker. CAUTION flag recommended for any release touching booking creation.
- **ELEK-2026-06-05-002** (MEDIUM) — NOT a release blocker. Patch is a simple two-line change — recommended to resolve before next notification system release.
- **ELEK-2026-06-05-003** (LOW) — NOT a release blocker.
- **ELEK-2026-06-05-004** (INFO) — NOT a release blocker.

No HIGH findings. No IDOR/BOLA findings with confirmed code-level exploit path. No secrets exposure. No Supabase RLS gaps identified at code level (RLS state unconfirmed — delegates to DB command).
