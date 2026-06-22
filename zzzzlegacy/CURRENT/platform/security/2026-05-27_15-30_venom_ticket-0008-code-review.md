# VENOM SECURITY AUDIT — TICKET-0008 Code Review

**Date:** 2026-05-27
**Time:** 15:30
**Reviewer:** VENOM
**Ticket:** TICKET-0008
**Application Scope:** VCSM
**Mode:** READ-ONLY — code inspection only
**Source:** DAL and controller files in apps/VCSM/src and engines/booking

---

## VENOM TARGET

```
Feature: vport.bookings + vport.profiles — booking mutation and profile write paths
Application Scope: VCSM
Reason: TICKET-0008 {public} → {authenticated} policy review — verify what the code
  actually does against these tables so the RLS posture can be evaluated against
  real call patterns
Primary trust boundary: Authenticated Citizen vs Authenticated VPORT Owner
```

---

## FILES READ

| File | Operation |
|---|---|
| `src/features/booking/dal/updateBookingStatus.dal.js` | UPDATE vport.bookings |
| `src/features/dashboard/vport/dal/write/updateVportBooking.write.dal.js` | UPDATE vport.bookings |
| `src/features/booking/dal/insertBooking.dal.js` | INSERT vport.bookings |
| `src/features/booking/controller/confirmBooking.controller.js` | Controller — confirm path |
| `src/features/booking/controller/cancelBooking.controller.js` | Controller — cancel path |
| `src/features/booking/controller/assertActorOwnsVportActor.controller.js` | Ownership gate |
| `src/features/dashboard/vport/dashboard/cards/bookings/controller/createOwnerBooking.controller.js` | Owner booking creation |
| `src/features/dashboard/vport/dashboard/cards/bookings/controller/vportPublicBooking.controller.js` | Public booking creation |
| `src/features/vport/dal/vport.core.dal.js` | SELECT + UPDATE vport.profiles |
| `src/features/settings/vports/dal/vports.write.dal.js` | UPDATE vport.profiles |

---

## SECURITY SURFACE

```
Entry points:
  1. Supabase client .from("bookings").update() — direct REST, bypasses controllers
  2. cancelBookingController / confirmBookingController — controller-gated update paths
  3. updateVportBookingDAL — dashboard VPORT owner update
  4. insertBookingDAL / insertVportBookingDAL — booking creation
  5. vport.core.dal.js updateVport — VPORT profile update
  6. vports.write.dal.js — settings writes on vport.profiles

Auth source: Supabase JWT (supabase.auth.getUser() in some DALs, implicit in RLS for others)
Authorization layer: RLS on vport.bookings + vport.profiles; app-layer in controllers
Identity surface: requestActorId (caller-supplied), customer_actor_id (booking row),
  owner_user_id (legacy), vc.actor_owners (canonical)
```

---

## FINDINGS

---

### V-CODE-01 — HIGH

```
VENOM SECURITY FINDING
- Finding ID: V-CODE-01
- Location: apps/VCSM/src/features/booking/dal/updateBookingStatus.dal.js:47–52
- Application Scope: VCSM
- Platform Surface: Supabase Table/View — vport.bookings (UPDATE)
- Trust Boundary: Authenticated Citizen → Authenticated VPORT Owner
- Boundary Violated: No ownership filter at DAL layer — ownership enforcement is
  entirely in the controller layer via assertActorOwnsVportActorController
- Contract Violated: Booking Trust Contract, Actor Ownership Contract
```

**Code:**
```js
const { data, error } = await vportClient
  .from("bookings")
  .update(patch)
  .eq("id", bookingId)      // only filter: booking ID
  .select(BOOKING_SELECT)
  .maybeSingle();
```

`patch` can contain: `status`, `cancelled_at`, `completed_at`, `internal_note`.

**The problem:** This DAL has no ownership filter. `assertActorOwnsVportActorController` is called by `confirmBookingController` and `cancelBookingController` before this DAL runs — but that ownership gate lives only in those two controllers. Any code path that calls `updateBookingStatusDAL` without first going through a controller can mutate any booking's status, provided the RLS policy passes.

The RLS policies that govern UPDATE are:
- `bookings_update_customer`: passes if `customer_actor_id = current_actor_id()`
- `bookings_update_resource_neutral`: passes if resource manager or customer
- `bookings_update_vport_owner`: passes if `actor_can_manage_profile(current_actor_id(), profile_id)`

A customer can call `updateBookingStatusDAL` directly (bypassing the controller) and the RLS will allow it if their `customer_actor_id` matches. The controller normally restricts what a customer can do (only cancel via `cancelBookingController`), but the DAL does not enforce this — a customer can set `status: "confirmed"` or `status: "completed"` directly.

```
- Risk: Authenticated customer can self-confirm or self-complete their own bookings by
  calling updateBookingStatusDAL directly (not through the controller). The controller
  correctly restricts status transitions, but the DAL + RLS combination does not.
- Severity: HIGH
- Exploitability: HIGH — requires only an authenticated account and a booking where
  customer_actor_id matches. Direct Supabase client call sufficient.
- Attack Preconditions:
  - Authenticated Citizen with an existing pending booking
  - Direct Supabase client call: supabase.schema('vport').from('bookings')
      .update({ status: 'confirmed' }).eq('id', '<booking_id>')
  - bookings_update_customer RLS passes: customer_actor_id = current_actor_id() ✓
- Blast Radius: Single actor (own bookings only); VPORT scheduling integrity
- Identity Leak Type: None (mutation, not disclosure)
- Cache Trust Type: Booking-sensitive
- RLS Dependency: REQUIRED — but RLS only restricts WHO can update, not WHAT can be set
- Why it matters: Booking status transitions are business-critical. A customer confirming
  their own booking means VPORT owners lose control of acceptance decisions. Slot
  availability logic assumes only 'confirmed' bookings block slots — self-confirmation
  by customers would block time slots without VPORT owner approval.
- Recommended mitigation:
  The correct fix is at the DB layer, not the controller layer. Two options:
  Option A — DB trigger: enforce allowed status transitions per role at the DB level.
    A BEFORE UPDATE trigger on vport.bookings checks old.status → new.status is a
    valid transition for the calling role.
  Option B — Replace raw UPDATE with typed RPCs (strongly preferred):
    vport.customer_cancel_booking(booking_id) — SECURITY DEFINER, sets status='cancelled' only
    vport.owner_confirm_booking(booking_id)   — SECURITY DEFINER, sets status='confirmed' only
    vport.owner_complete_booking(booking_id)  — SECURITY DEFINER, status='completed'
    vport.owner_mark_noshow(booking_id)       — SECURITY DEFINER, status='no_show'
    Each RPC verifies the caller owns the appropriate side of the booking, then mutates
    only the columns relevant to that transition.
  Neither the controller guard nor the DAL ID filter is sufficient alone.
- Follow-up command: Carnage (RPC design) + SPIDER-MAN (status transition regression tests)
- CISSP Domain:
  - Primary: Software Development Security (8)
  - Secondary: Identity and Access Management (5)
```

---

### V-CODE-02 — HIGH

```
VENOM SECURITY FINDING
- Finding ID: V-CODE-02
- Location: apps/VCSM/src/features/dashboard/vport/dal/write/updateVportBooking.write.dal.js:5–33
- Application Scope: VCSM
- Platform Surface: Supabase Table/View — vport.bookings (UPDATE)
- Trust Boundary: Authenticated VPORT Owner
- Boundary Violated: No ownership filter at DAL layer; broad writable column set includes
  timing and identity-adjacent fields with no validation
- Contract Violated: Booking Trust Contract
```

**Code:**
```js
const UPDATABLE_COLS = [
  "status", "resource_id", "starts_at", "ends_at",
  "duration_minutes", "service_id", "service_label_snapshot",
  "customer_name", "customer_note",
  "cancelled_at", "completed_at",
];

const { data, error } = await vportSchema
  .from("bookings")
  .update(row)
  .eq("id", bookingId)   // only filter: booking ID
  .select(SELECT_COLS)
  .single();
```

No ownership filter. No slot-collision check. No notification trigger. No time validation.

`resource_id`, `starts_at`, and `ends_at` are in UPDATABLE_COLS. A VPORT owner (or any actor whose `actor_can_manage_profile` passes via `bookings_update_vport_owner`) can:
1. Change `resource_id` — move a booking from one staff member to another without the customer's knowledge
2. Change `starts_at` / `ends_at` — reschedule a booking unilaterally without checking for slot collisions
3. Set `service_label_snapshot` to anything — rewrite the service the customer thought they booked

The slot-collision index added in migration `20260527010000` prevents two bookings occupying the same `(resource_id, starts_at)` — so a reschedule to an occupied slot would fail at the DB level. But a reschedule to an unoccupied slot succeeds silently with no notification to the customer.

```
- Risk: VPORT owner can move a confirmed booking to a different time, staff member, or
  service description without the customer's knowledge or notification. No controller
  guard appears to wrap this DAL in a notification + validation flow.
- Severity: HIGH
- Exploitability: HIGH — any authenticated VPORT owner can call this DAL directly via
  a Supabase client call. bookings_update_vport_owner RLS passes for profile managers.
- Attack Preconditions:
  - Authenticated VPORT owner
  - Existing booking under their profile
  - Direct client call: supabase.schema('vport').from('bookings')
      .update({ starts_at: '<new_time>', resource_id: '<other_resource>' }).eq('id', bookingId)
- Blast Radius: Single booking; customer trust impact; VPORT scheduling integrity
- Identity Leak Type: None
- Cache Trust Type: Booking-sensitive
- RLS Dependency: REQUIRED — but RLS governs who updates, not what they update
- Why it matters: Customers booked a specific time and possibly a specific staff member.
  Silent rescheduling without notification violates the booking contract. Also, changing
  resource_id without a slot-collision check for the new resource could stack bookings.
- Recommended mitigation:
  Same as V-CODE-01: replace raw UPDATE with typed RPCs.
  vport.owner_reschedule_booking(booking_id, new_resource_id, new_starts_at, new_ends_at):
    - verify caller manages the booking's profile
    - verify new slot is available (no collision on new resource)
    - update only starts_at, ends_at, resource_id, duration_minutes
    - notify customer
  vport.owner_reassign_booking_resource(booking_id, new_resource_id): same pattern
  This removes the raw UPDATE grant from the client path entirely.
- Follow-up command: Carnage + SPIDER-MAN
- CISSP Domain:
  - Primary: Software Development Security (8)
  - Secondary: Asset Security (2)
```

---

### V-CODE-03 — MEDIUM

```
VENOM SECURITY FINDING
- Finding ID: V-CODE-03
- Location: apps/VCSM/src/features/vport/dal/vport.core.dal.js:183–229
- Application Scope: VCSM
- Platform Surface: Supabase Table/View — vport.profiles (UPDATE)
- Trust Boundary: Authenticated VPORT Owner
- Boundary Violated: updateVport has no ownership filter at the DAL level — full reliance
  on RLS. Contrast with setVportBusinessCardSettingsDAL (same file context) which adds
  .eq("owner_user_id", userId) as defense-in-depth.
- Contract Violated: Actor Ownership Contract
```

**Code — updateVport:**
```js
await requireUser();  // confirms auth, does not use userId in query

const { data, error } = await vportSchema
  .from("profiles")
  .update(patch)
  .eq("id", vportId)   // only filter: vportId from caller
  .select(SELECT)
  .single();
```

**Code — setVportBusinessCardSettingsDAL (same table, different DAL):**
```js
const userId = auth?.user?.id;
.update({ business_card_settings: settings })
.eq("id", vportId)
.eq("owner_user_id", userId)   // double defense: DAL + RLS
```

`updateVport` can write: `name`, `slug`, `avatar_url`, `banner_url`, `bio`, `is_active`.

Ownership is enforced solely by the RLS policy `profiles_update_by_actor_owner` (actor_owners join). There is no application-layer ownership check in this DAL. Any code path that supplies a `vportId` and passes the RLS will succeed.

```
- Risk: The DAL layer provides no ownership defense-in-depth. If the RLS policy were
  misconfigured, silent, or bypassed, any authenticated user could update any profile's
  name, slug, or is_active flag by supplying the target vportId.
  Also: is_active can be toggled to false — deactivating any profile that passes the
  RLS. The RLS does not check is_deleted before allowing updates, meaning a soft-deleted
  profile can still be mutated through this path.
- Severity: MEDIUM
- Exploitability: MEDIUM — requires the RLS to have a gap; on the live DB the RLS is
  correct. Risk is defense-in-depth gap.
- Attack Preconditions:
  - Authenticated user with an actor_owners row for the target profile
  - RLS gap: if actor_owners is stale or misconfigured
- Blast Radius: Single VPORT identity (name, slug, activation state)
- Identity Leak Type: None (mutation)
- Cache Trust Type: Public-profile-sensitive
- RLS Dependency: REQUIRED — sole ownership gate
- Why it matters: Inconsistent ownership posture within the same table's write DALs.
  setVportBusinessCardSettingsDAL and setVportDirectoryVisibleDAL both add
  .eq("owner_user_id", userId) as a second gate. updateVport does not. The inconsistency
  makes it unclear which pattern is authoritative and increases future maintenance risk.
- Recommended mitigation:
  Add app-layer ownership verification before the update. Either:
  Option A: Add .eq("owner_user_id", userId) to the WHERE clause (matches the pattern
    in setVportBusinessCardSettingsDAL and setVportDirectoryVisibleDAL).
  Option B: Read the profile first, verify actor_owners, then update.
  Option A is simpler but relies on owner_user_id being the current ownership model.
  If actor_owners is the canonical model (architecture contract §1.4), Option B is correct.
  Explicitly check actor_owners at the DAL or controller level before issuing the update.
- Follow-up command: SPIDER-MAN (regression), Carnage (if DAL change is needed)
- CISSP Domain:
  - Primary: Security Architecture and Engineering (3)
  - Secondary: Identity and Access Management (5)
```

---

### V-CODE-04 — MEDIUM

```
VENOM SECURITY FINDING
- Finding ID: V-CODE-04
- Location: apps/VCSM/src/features/booking/dal/insertBooking.dal.js:28–48
- Application Scope: VCSM
- Platform Surface: Supabase Table/View — vport.bookings (INSERT)
- Trust Boundary: Authenticated VPORT Owner (owner-side INSERT path)
- Boundary Violated: customer_actor_id is in BOOKING_INSERT_COLUMNS — owner inserts
  can attribute a booking to any actor_id without verification
- Contract Violated: Booking Trust Contract
```

**Code:**
```js
const BOOKING_INSERT_COLUMNS = Object.freeze([
  "resource_id", "service_id",
  "customer_actor_id",          // caller-supplied
  "customer_profile_id",
  "status", "source", ...
  "created_by_actor_id",        // caller-supplied
]);

const payload = pickDefined(row, BOOKING_INSERT_COLUMNS);
```

The INSERT accepts `customer_actor_id` from the caller without verifying that the actor exists or belongs to the right kind ('user'). For the **public booking path** (`bookings_insert_public_pending`), the RLS requires `customer_actor_id = vc.current_actor_id()` — the DB blocks misattribution.

For the **owner booking path** (`bookings_insert_actor_owner`), the RLS only checks that the caller owns the resource (`actor_owners` join on `resource.owner_actor_id`). It does not restrict what `customer_actor_id` is set to. An owner-side INSERT can attribute a booking to any actor_id.

`createOwnerBookingController` correctly omits `customer_actor_id` from the row it passes (line 43–58 of createOwnerBooking.controller.js) — so the owner booking flow does not supply a customer. But `insertBookingDAL` itself does not enforce this — any caller that passes a `customer_actor_id` in the row will have it written to the DB.

```
- Risk: An authenticated VPORT owner can insert a booking attributed to any citizen
  (customer_actor_id = arbitrary actor_id) by calling insertBookingDAL with a custom
  customer_actor_id. The booking would appear in the targeted citizen's booking history
  (via bookings_select_customer: customer_actor_id = current_actor_id()). This is a
  booking attribution injection — fake appointment records injected into another user's history.
- Severity: MEDIUM
- Exploitability: MEDIUM — requires a VPORT owner account. Fabricated booking appears
  in the victim's booking history view.
- Attack Preconditions:
  - Authenticated VPORT owner
  - Known target citizen actor_id
  - Direct Supabase client call with source: 'owner' and custom customer_actor_id
- Blast Radius: Single actor (target citizen's booking history)
- Identity Leak Type: Booking identity exposure (actor correlation via injected booking)
- Cache Trust Type: Booking-sensitive
- RLS Dependency: REQUIRED but insufficient — owner INSERT RLS does not restrict customer_actor_id
- Why it matters: Fake bookings in a citizen's history affect trust, notification spam
  (if notifications are sent), and could be used to harass a specific actor.
- Recommended mitigation:
  In the owner-side INSERT path: if customer_actor_id is supplied, verify it via
  getActorByIdDAL that the actor exists, is not void, and is kind='user' before insert.
  The createOwnerBookingController already omits customer_actor_id — add an explicit
  guard: if customer_actor_id is in the input, throw unless it passes actor validation.
  Long-term: typed RPCs (V-CODE-01 recommendation) eliminate this surface entirely.
- Follow-up command: SPIDER-MAN
- CISSP Domain:
  - Primary: Identity and Access Management (5)
  - Secondary: Software Development Security (8)
```

---

### V-CODE-05 — MEDIUM

```
VENOM SECURITY FINDING
- Finding ID: V-CODE-05
- Location: apps/VCSM/src/features/vport/dal/vport.core.dal.js:231–263 (softDeleteVport, hardDeleteVport)
  vs RLS policy profiles_delete_owner (direct REST DELETE path)
- Application Scope: VCSM
- Platform Surface: Supabase Table/View — vport.profiles (DELETE) + RPC
- Trust Boundary: Authenticated VPORT Owner
- Boundary Violated: Two DELETE paths exist with different lifecycle enforcement:
  (1) Application path: softDeleteVport() RPC → hardDeleteVport() RPC — two-step, order enforced
  (2) Direct REST path: DELETE /rest/v1/profiles?id=eq.<id> — one-step, no soft-delete required
- Contract Violated: VPORT Lifecycle Contract, Actor Ownership Contract
```

**Code — application path:**
```js
// Two-step required by application layer:
export async function softDeleteVport(vportId) {
  // calls vport.soft_delete_vport RPC
  // RPC enforces state: profile must be active before soft-delete
}

export async function hardDeleteVport(vportId) {
  // calls vport.hard_delete_vport RPC
  // RPC enforces: msg includes "VPORT_NOT_FOUND_OR_NOT_DELETED"
  // i.e., profile must already be soft-deleted (is_deleted=true)
}
```

**RLS — direct path:**
```sql
-- profiles_delete_owner: no is_deleted check
-- Any actor_owner can hard-delete a live (is_deleted=false) profile directly
CREATE POLICY profiles_delete_owner ON vport.profiles
  FOR DELETE TO authenticated  -- (after TICKET-0008 migration)
  USING (
    EXISTS (SELECT 1 FROM vc.actor_owners ao
      WHERE ao.actor_id = profiles.actor_id
        AND ao.user_id = auth.uid()
        AND COALESCE(ao.is_void, false) = false)
  );
```

An authenticated VPORT owner can bypass the application's two-step deletion lifecycle by issuing a direct REST DELETE call. The `hard_delete_vport` RPC enforces `is_deleted = true` before allowing hard delete. The RLS policy does not.

```
- Risk: An owner can hard-delete an active (is_deleted=false) VPORT profile directly
  via the REST API, bypassing the soft-delete → hard-delete two-step that the application
  enforces. This skips any server-side validation, cascade warnings, or audit logging
  that may be embedded in the hard_delete_vport RPC.
  The cascade impact is significant: deleting a live profile will cascade to resources,
  bookings, portfolio items, availability rules, menu items, etc. (ON DELETE CASCADE).
- Severity: MEDIUM
- Exploitability: HIGH — any VPORT owner can do this with a direct REST call. No
  special knowledge beyond the profile ID (which they own) is required.
- Attack Preconditions:
  - Authenticated VPORT owner (actor_owners row present)
  - Direct DELETE call: supabase.schema('vport').from('profiles').delete().eq('id', profileId)
  - No soft-delete prerequisite — the RLS has no is_deleted guard
- Blast Radius: Single VPORT + all cascade-dependent tables (resources, bookings, portfolio,
  media, availability_rules, menu, qr_links)
- Identity Leak Type: None (self-deletion)
- Cache Trust Type: Public-profile-sensitive, Booking-sensitive
- RLS Dependency: REQUIRED — no app-layer gate on this path
- Why it matters: The hard_delete_vport RPC exists precisely to enforce order and safety.
  The open RLS DELETE path bypasses it. An owner who accidentally hard-deletes a live
  profile loses all associated data with no recovery path.
- Recommended mitigation:
  Add `AND profiles.is_deleted = true` to the profiles_delete_owner USING clause.
  This aligns the RLS policy with the application's intended two-step lifecycle and
  ensures the direct REST path requires the same precondition as the RPC path.
  Proposed USING:
    EXISTS (SELECT 1 FROM vc.actor_owners ao
      WHERE ao.actor_id = profiles.actor_id
        AND ao.user_id = auth.uid()
        AND COALESCE(ao.is_void, false) = false)
    AND profiles.is_deleted = true
- Follow-up command: Carnage (policy body change) + SPIDER-MAN (regression)
- CISSP Domain:
  - Primary: Security Architecture and Engineering (3)
  - Secondary: Asset Security (2)
```

---

### V-CODE-06 — LOW

```
VENOM SECURITY FINDING
- Finding ID: V-CODE-06
- Location: apps/VCSM/src/features/booking/controller/cancelBooking.controller.js:26–28
- Application Scope: VCSM
- Platform Surface: PWA controller (cancelBookingController)
- Trust Boundary: Authenticated Citizen (guest/walk-in booking edge case)
- Boundary Violated: String coercion of null customer_actor_id creates a degenerate
  comparison condition
- Contract Violated: None directly — low-probability edge case
```

**Code:**
```js
const isCustomer =
  booking.customer_actor_id &&
  String(booking.customer_actor_id) === String(requestActorId);
```

For a guest/walk-in booking, `booking.customer_actor_id = null`.

`booking.customer_actor_id && ...` short-circuits to `false` when `customer_actor_id` is null — so `isCustomer` is false, and the code correctly falls through to `assertActorOwnsVportActorController`. This is handled correctly in the current code.

The finding is that `String(null) = "null"` — if there were ever a second caller who had a path to supply `requestActorId = "null"` as a string, the comparison `String(null) === String("null")` → `"null" === "null"` would be true, incorrectly granting isCustomer status on a guest booking. The short-circuit on `booking.customer_actor_id &&` prevents this for null values, but any future refactor that removes or modifies that guard could expose this.

```
- Risk: Low probability. The short-circuit correctly handles null today. Risk is latent —
  if the isCustomer check is ever refactored without understanding the null edge case,
  guest bookings could be cancellable by any authenticated user.
- Severity: LOW
- Exploitability: LOW — requires code change to trigger
- Recommended mitigation: Harden the check explicitly:
  const isCustomer = booking.customer_actor_id != null &&
    booking.customer_actor_id === requestActorId;
  Removes string coercion entirely — strict equality on raw values.
- CISSP Domain:
  - Primary: Software Development Security (8)
  - Secondary: None
```

---

### V-CODE-07 — LOW (positive finding — correct)

```
VENOM SECURITY FINDING (POSITIVE)
- Finding ID: V-CODE-07
- Location: apps/VCSM/.../vportPublicBooking.controller.js:67–74
- Note: This is a correctly implemented control, documented to confirm coverage.
```

**Code:**
```js
// Resolve service label server-side from the catalog — never trust client-supplied snapshot
let resolvedLabel = "Appointment";
if (serviceId) {
  const service = await getVportServiceByIdDAL({ serviceId });
  if (service) {
    resolvedLabel = service.label || service.key || "Appointment";
  }
}
```

`service_label_snapshot` is resolved from the DB by the controller — not from client input. The client cannot inject a service label. This is correct implementation of trust boundary enforcement for the snapshot field.

```
- Risk: NONE — this is working correctly. Documented to confirm the pattern is in place.
- Severity: N/A
- Why it matters: If the client-supplied label were trusted, a customer could book "Free
  Service" or "Premium Package" by manipulating the label field. Server-side resolution
  prevents this.
- CISSP Domain: Software Development Security (8) — correct implementation
```

---

### V-CODE-08 — LOW (positive finding — correct)

```
VENOM SECURITY FINDING (POSITIVE)
- Finding ID: V-CODE-08
- Location: apps/VCSM/.../vportPublicBooking.controller.js:81–86
```

**Code:**
```js
// VPD-V-019: customer_actor_id is always the authenticated requestActor.
// Accepting a caller-supplied customerActorId would allow booking attribution injection.
customer_actor_id: requestActorId ?? null,
```

`customer_actor_id` in the public booking path is always set to `requestActorId` (the authenticated session actor), never from client input. The comment explicitly names the injection risk. Correct.

```
- Risk: NONE — working correctly. The DB-layer RLS (bookings_insert_public_pending)
  provides a second gate: customer_actor_id = current_actor_id() is enforced at the DB.
  Double-gated: controller sets it, RLS verifies it.
- CISSP Domain: Identity and Access Management (5) — correct
```

---

## TRUST BOUNDARY SUMMARY

| Write Path | Ownership at DAL? | Ownership at Controller? | Ownership at RLS? | Gap? |
|---|---|---|---|---|
| `updateBookingStatusDAL` | No | Yes (controller only) | Yes (who can update) | Yes — RLS allows unrestricted column updates if caller matches; controller not always used |
| `updateVportBookingDAL` | No | No (not wrapped) | Yes (who can update) | Yes — no slot collision check; broad column set |
| `insertBookingDAL` (public) | No | Via controller | Yes (customer_actor_id = current_actor_id()) | No — RLS enforces customer attribution |
| `insertBookingDAL` (owner path) | No | Controller omits customer_actor_id | No restriction on customer_actor_id | Yes — owner can attribute booking to any actor |
| `updateVport` in vport.core.dal | No | Via requireUser() only | Yes (actor_owners) | Yes — inconsistent with other write DALs; no DAL-level check |
| `setVportBusinessCardSettingsDAL` | Yes (.eq owner_user_id) | No (DAL is self-contained) | Yes (actor_owners) | No — defense-in-depth present |
| `setVportDirectoryVisibleDAL` | Yes (.eq owner_user_id) | No (DAL is self-contained) | Yes (actor_owners) | No — defense-in-depth present |
| `softDeleteVport` / `hardDeleteVport` | Via RPC | No | N/A (RPC enforces) | No — RPC-gated |
| Direct REST DELETE on profiles | No | N/A (bypasses all) | profiles_delete_owner | Yes — no is_deleted prerequisite |

---

## MITIGATION PLAN

| Finding | Risk | Correct Layer | Priority | Follow-up |
|---|---|---|---|---|
| V-CODE-01 — booking status mutation by customer | HIGH | RLS + DB trigger or typed RPC | P0 | Carnage |
| V-CODE-02 — VPORT owner silent reschedule | HIGH | RLS + typed RPC | P0 | Carnage |
| V-CODE-03 — updateVport no DAL ownership filter | MEDIUM | DAL | P1 | SPIDER-MAN |
| V-CODE-04 — owner INSERT customer_actor_id injection | MEDIUM | Controller | P1 | SPIDER-MAN |
| V-CODE-05 — profiles_delete_owner bypasses two-step | MEDIUM | RLS policy body | P1 | Carnage |
| V-CODE-06 — null coercion in cancelBooking isCustomer | LOW | Controller | P2 | — |

---

## CISSP DOMAIN COVERAGE SUMMARY

| CISSP Domain | Findings | Notes |
|---|---:|---|
| Security and Risk Management (1) | 0 | |
| Asset Security (2) | 1 | V-CODE-02/05 — booking + profile data integrity |
| Security Architecture and Engineering (3) | 2 | V-CODE-03/05 — inconsistent ownership depth, lifecycle bypass |
| Communication and Network Security (4) | 0 | Out of scope |
| Identity and Access Management (5) | 3 | V-CODE-01/04/08 — actor attribution, ownership gate gaps |
| Security Assessment and Testing (6) | 0 | |
| Security Operations (7) | 0 | |
| Software Development Security (8) | 4 | V-CODE-01/02/04/06 — DAL-layer gaps, coercion edge case |

---

*VENOM audit complete — 2026-05-27 15:30*
*Source: code files only. No migration files, no audit documents, no prior VENOM reports consulted.*
*All findings are from direct code inspection.*
*No files were modified.*
