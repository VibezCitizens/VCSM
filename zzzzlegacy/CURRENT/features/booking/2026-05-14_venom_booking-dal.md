# VENOM Security Audit — Booking DAL System

**Date:** 2026-05-14  
**Reviewer:** VENOM  
**Trigger:** Cerebro-routed audit of `vcsm.dal.booking.md` — 8 named risks, two HIGH items flagged for verification  
**Application Scope:** VCSM + ENGINE  
**Status:** COMPLETE  
**Findings:** 1 CRITICAL | 3 HIGH | 3 MEDIUM | 1 LOW

---

## VENOM TARGET

**Feature / Route / Engine:** `features/booking/` DAL system + `engines/booking/` + `features/dashboard/vport/` booking controllers  
**Application Scope:** VCSM + ENGINE  
**Reason for review:** Verify RISK-7 (trust boundary fix) and RISK-8 (layer violations) as flagged by Cerebro. Full trust boundary trace of the booking security surface.  
**Primary trust boundary:** Authenticated VPORT Owner performing booking read/write operations against resources they may or may not own

---

## SECURITY SURFACE

**Entry point:** `useVportBookingHistory` (dashboard) / `useBookingHistory` (adapter) / `useQuickBookingModal` (booking creation) / `useBookingOps` (cancel/confirm)  
**Auth source:** `useIdentity()` → `identity.actorId`  
**Authorization layer:** Controller (`assertActorOwnsVportActorController`) — where present  
**Identity surface:** `actorId` (correct), `profileId` (present in two violation paths)  
**Sensitive objects involved:** `bookings`, `resources`, `actor_owners`, PII fields (`customer_phone`, `customer_email`, `internal_note`)

---

## TRUST BOUNDARY TRACE

**Client input:** `resourceId`, `profileId`, `callerActorId` from session  
**Validated at:** Controller layer (for paths that have it); missing on engine `listBookingHistory` path  
**Identity resolved at:** `useIdentity()` — session-bound; safe  
**Authorization enforced at:** `assertActorOwnsVportActorController` — verifies via `actor_owners` table  
**Data returned to:** PWA screens and notification system

---

## SECURITY RISK FINDINGS

---

### VENOM SECURITY FINDING — V-BOOK-01

**Finding ID:** V-BOOK-01  
**Location:** `engines/booking/src/controller/listBookingHistory.controller.js:4`  
**Application Scope:** VCSM + ENGINE  
**Platform Surface:** PWA · Booking Engine · Supabase Table/View  
**Trust Boundary:** Authenticated VPORT Owner  
**Boundary Violated:** Authenticated Citizen → VPORT Owner (any authenticated actor can query any resource's booking history)  
**Contract Violated:** Booking Architecture Contract · Actor Ownership Contract  

**Current behavior:**  
The engine `listBookingHistory({ resourceId })` accepts only a `resourceId` with zero caller identity or ownership verification. `useBookingHistory.js` (in `features/booking/hooks/`) calls this engine function directly. This hook is exported via `booking.adapter.js`. Although no external consumer is currently confirmed, the adapter export is live and callable.

**Risk:**  
Any authenticated actor who can supply a `resourceId` (which are not secret — they appear in booking flows) can enumerate all bookings for any VPORT resource: customer names, notes, service labels, appointment history.

**Severity:** CRITICAL  
**Exploitability:** HIGH  
**Attack Preconditions:**
- Authenticated Citizen account required
- A valid `resourceId` required (obtainable through normal booking interactions)
- No resource ownership verification required

**Blast Radius:** Booking-wide — all bookings across all VPORT resources  
**Identity Leak Type:** Booking identity exposure · Actor correlation  
**Cache Trust Type:** Booking-sensitive  
**RLS Dependency:** UNVERIFIED — code does not verify RLS coverage on `bookings` table for this read path  

**Why it matters:**  
The DAL doc marks RISK-7 as FIXED. The fix IS present — but only in `listVportBookingHistoryController` (the dashboard path). The engine path (`engines/booking/src/controller/listBookingHistory.controller.js`) used by the feature-level `useBookingHistory` hook is NOT protected. The documentation status is incorrect. This represents an exploitable read surface if the adapter export is ever wired to a live UI.

**Recommended mitigation:**  
1. Add caller identity + ownership assertion to the engine `listBookingHistory` controller. Signature must accept `callerActorId` and `ownerActorId`, call `assertActorOwnsVportActorController` before reading.  
2. Update `useBookingHistory.js` to pass `callerActorId` and `ownerActorId` from session identity.  
3. Remove `useBookingHistory` from `booking.adapter.js` until the ownership gate is in place, or mark it internal-only.  
4. Update `vcsm.dal.booking.md` RISK-7 status to reflect that only the dashboard path is fixed.

**Rationale:** Defense-in-depth requires the engine controller to be self-protecting regardless of whether the adapter export is "dead." Dead exports become live again.  
**Follow-up command:** DB (verify RLS on `bookings` table for resource-based reads), Carnage (if engine controller signature change requires migration)  
**CISSP Domain:**
- Primary: Identity and Access Management
- Secondary: Security Architecture and Engineering, Software Development Security

---

### VENOM SECURITY FINDING — V-BOOK-02

**Finding ID:** V-BOOK-02  
**Location:** `features/booking/dal/updateBookingStatus.dal.js:1–58`  
**Application Scope:** VCSM  
**Platform Surface:** PWA · Supabase Table/View  
**Trust Boundary:** Authenticated VPORT Owner · Authenticated Citizen  
**Boundary Violated:** None (authorization occurs in caller controllers) — but PII overfetch exceeds the principle of least privilege  
**Contract Violated:** Asset Security — data minimization  

**Current behavior:**  
`updateBookingStatusDAL` returns after every status update: `customer_phone`, `customer_email`, `customer_profile_id`, `internal_note`. These are returned to `cancelBookingController` and `confirmBookingController`, which pass the mapped result upstream to hooks/screens. The customer-facing cancel flow receives `customer_phone`, `customer_email`, and `internal_note` in the response object.

**Risk:**  
PII fields (`customer_phone`, `customer_email`) and internal operational data (`internal_note`) propagate into client-side React state after every booking status change. If the mapped result is ever logged, serialized for error reporting, or included in notification context, this data leaks beyond its intended scope.

**Severity:** HIGH  
**Exploitability:** MEDIUM  
**Attack Preconditions:**
- Requires authenticated Citizen or VPORT Owner
- Requires access to the returned state object (client-side React state)
- No active exploit path confirmed — risk is future leakage via logging or error payload

**Blast Radius:** Single actor — limited to the current booking action  
**Identity Leak Type:** Private contact exposure · Booking identity exposure  
**Cache Trust Type:** Booking-sensitive  
**RLS Dependency:** NONE — app-layer issue  

**Why it matters:**  
The cancel and confirm flows don't need `customer_phone`, `customer_email`, or `internal_note` after status update. Returning these fields unnecessarily creates a wider PII surface in client state.

**Recommended mitigation:**  
1. Create a `STATUS_UPDATE_RETURN_SELECT` in `updateBookingStatusDAL` that excludes `customer_phone`, `customer_email`, `customer_profile_id`, `internal_note`.  
2. If callers need these fields post-update, fetch them through a dedicated read DAL scoped by role (owner-only fields for owner paths).  

**Rationale:** Data minimization — return only what the caller needs for the operation result.  
**Follow-up command:** DB (verify RLS restricts these fields appropriately)  
**CISSP Domain:**
- Primary: Asset Security
- Secondary: Software Development Security

---

### VENOM SECURITY FINDING — V-BOOK-03

**Finding ID:** V-BOOK-03  
**Location:** `features/booking/dal/listBookingsByCustomer.dal.js:23` (`resources!resource_id(owner_actor_id,member_actor_id,name)`)  
**Application Scope:** VCSM  
**Platform Surface:** PWA · Supabase Table/View  
**Trust Boundary:** Authenticated Citizen (customer reading their own bookings)  
**Boundary Violated:** Customer → Staff resource identity exposure  
**Contract Violated:** Asset Security — internal actor ID minimization  

**Current behavior:**  
`listBookingsByCustomerDAL` joins `resources` and returns `member_actor_id` to the customer-facing my-bookings view. `member_actor_id` is the staff/team member assigned to the resource, not the VPORT owner. Customers receive internal staff actor IDs in their booking list response.

**Risk:**  
Internal staff actor IDs are exposed to customers. These IDs can be used to correlate staff identity across the platform, enumerate actor profiles, or construct targeted requests against staff members' actors.

**Severity:** HIGH  
**Exploitability:** MEDIUM  
**Attack Preconditions:**
- Authenticated Citizen with at least one booking
- No special access required beyond normal booking customer status

**Blast Radius:** Multi-actor — every customer with a booking sees staff actor IDs  
**Identity Leak Type:** Internal UUID exposure · Actor correlation  
**Cache Trust Type:** None (live read)  
**RLS Dependency:** UNVERIFIED  

**Why it matters:**  
Staff members are an internal VPORT concept. Their `actor_id` values should not be part of the customer-facing booking read. `owner_actor_id` is sufficient for the customer to understand who their booking is with.

**Recommended mitigation:**  
Remove `member_actor_id` from the `BOOKING_SELECT` join in `listBookingsByCustomerDAL`. If callers need the member identity, scope it to owner-facing reads only.

**Rationale:** Identity minimization at the DAL level — return only the minimum identity needed for the consumer's role.  
**Follow-up command:** DB  
**CISSP Domain:**
- Primary: Asset Security
- Secondary: Identity and Access Management

---

### VENOM SECURITY FINDING — V-BOOK-04

**Finding ID:** V-BOOK-04  
**Location:** `features/booking/controller/cancelBooking.controller.js:71` (`/actor/${resource.owner_actor_id}/dashboard/booking-history`)  
**Application Scope:** VCSM  
**Platform Surface:** PWA · Booking Engine  
**Trust Boundary:** Authenticated Citizen  
**Boundary Violated:** Notification link embeds raw `owner_actor_id` UUID  
**Contract Violated:** Public Identity Surface Contract (no raw UUIDs in URLs)  

**Current behavior:**  
When a customer cancels a booking, the notification sent to the VPORT owner includes a `linkPath` of `/actor/${resource.owner_actor_id}/dashboard/booking-history`. This embeds the raw `owner_actor_id` UUID in a notification link.

**Risk:**  
Violates the "no raw UUIDs in public-facing URLs" policy. Notification links may be rendered in the notification UI as clickable paths, exposing internal actor UUIDs. Any actor receiving a booking cancellation notification sees the VPORT owner's raw UUID in the link.

**Severity:** HIGH  
**Exploitability:** LOW  
**Attack Preconditions:**
- Any actor who cancels a booking sees the notification link
- No active exploit — information exposure risk

**Blast Radius:** Single VPORT owner per notification  
**Identity Leak Type:** Internal UUID exposure  
**Cache Trust Type:** None  
**RLS Dependency:** NONE  

**Why it matters:**  
Memory record `feedback_no_raw_ids_in_urls.md` establishes that raw UUIDs must never appear in public-facing URLs. Notification links are public-facing.

**Recommended mitigation:**  
Replace `/actor/${resource.owner_actor_id}/dashboard/booking-history` with the VPORT's slug-based route. Resolve the slug via the resource's profile or actor lookup at notification build time.

**Rationale:** Consistent URL policy — slugs only, no raw UUIDs.  
**Follow-up command:** Logan (update booking cancellation notification pattern in documentation)  
**CISSP Domain:**
- Primary: Asset Security
- Secondary: Communication and Network Security

---

### VENOM SECURITY FINDING — V-BOOK-05

**Finding ID:** V-BOOK-05  
**Location:** `features/dashboard/vport/hooks/useQuickBookingModal.js:6` · `features/dashboard/vport/controller/listVportServicesForProfile.controller.js:3`  
**Application Scope:** VCSM  
**Platform Surface:** PWA  
**Trust Boundary:** Authenticated VPORT Owner  
**Boundary Violated:** `profileId` used as identity/lookup surface in violation of identity surface contract  
**Contract Violated:** Public Identity Surface Contract · Actor Ownership Contract  

**Current behavior:**  
`useQuickBookingModal({ profileId, resourceId })` accepts `profileId` as a parameter. This is passed to `listVportServicesForProfileController({ profileId })` which passes it directly to `listVportServicesByProfileIdDAL`. The `profileId` is used as the lookup key to fetch services for the quick booking modal.

**Risk:**  
`profileId` is a forbidden identity surface per VCSM contract. A caller supplying an arbitrary `profileId` can enumerate services for any VPORT profile regardless of their relationship to it. The controller does not verify that the caller owns or is authorized to access the target profile's services.

**Severity:** MEDIUM  
**Exploitability:** MEDIUM  
**Attack Preconditions:**
- Authenticated VPORT Owner with quick booking modal access
- Any valid `profileId` value

**Blast Radius:** Multi-actor — any profile's services can be enumerated  
**Identity Leak Type:** Actor correlation · Resource enumeration  
**Cache Trust Type:** None  
**RLS Dependency:** ASSUMED  

**Why it matters:**  
Service enumeration via an unauthenticated `profileId` input allows discovery of VPORT service catalogs without going through the public profile screen. If services are intended to be visibility-controlled, this bypasses that gate.

**Recommended mitigation:**  
1. Resolve the VPORT actor from `resourceId` in `createOwnerBookingController` (already done) — use the same actor resolution to fetch services rather than accepting `profileId` as a parameter.  
2. Remove `profileId` from `useQuickBookingModal` props — derive it from the resource via `resourceId`.  
3. Replace `listVportServicesForProfileController({ profileId })` with an actor-scoped service lookup via `actorId`.

**Rationale:** Identity surface must always be `actorId` + `kind` — never `profileId`.  
**Follow-up command:** Sentry (layer compliance)  
**CISSP Domain:**
- Primary: Identity and Access Management
- Secondary: Software Development Security

---

### VENOM SECURITY FINDING — V-BOOK-06

**Finding ID:** V-BOOK-06  
**Location:** `features/booking/controller/assertActorOwnsVportActor.controller.js:28` (`requesterActor.profile_id`)  
**Application Scope:** VCSM  
**Platform Surface:** PWA · Booking Engine  
**Trust Boundary:** Authenticated VPORT Owner  
**Boundary Violated:** Ownership verified through `profile_id` extracted from actor record — not through session identity  
**Contract Violated:** Actor Ownership Contract  

**Current behavior:**  
`assertActorOwnsVportActorController` reads `profile_id` from the actor record (`requesterActor.profile_id`) and uses it as `userProfileId` in the `actor_owners` ownership link query. The ownership check is:  
`actor_owners WHERE actor_id = targetActorId AND user_id = profile_id`.

This is a correct indirect approach — it reads profile_id from the DB (not from the caller), so it cannot be spoofed by input. However, the match is against `user_id` in `actor_owners` using `profile_id` semantics. This creates an implicit dependency on the `profile_id ↔ user_id` mapping remaining stable and accurate.

**Risk:**  
LOW — the `profile_id` is read from the DB record, not caller-supplied. However, if `actor_owners.user_id` and `vc.actors.profile_id` drift (e.g., a user changes their profile), this ownership check could fail for legitimate owners or pass for deactivated accounts.

**Severity:** MEDIUM  
**Exploitability:** LOW  
**Attack Preconditions:**
- Requires DB-level drift between `actor_owners.user_id` and `vc.actors.profile_id`
- Not exploitable through normal UI paths

**Blast Radius:** Single VPORT actor (ownership check failure, not escalation)  
**Identity Leak Type:** None  
**Cache Trust Type:** Identity-sensitive  
**RLS Dependency:** VERIFIED — query hits `vc.actor_owners` with equality filters  

**Why it matters:**  
The ownership assertion is the security cornerstone of the entire booking system. Any fragility in its resolution logic is a systemic risk.

**Recommended mitigation:**  
Have DB or Carnage verify: (1) `vc.actor_owners.user_id` is always the same as `vc.actors.profile_id` for user-kind actors, (2) there are no stale entries where `is_void` should be true but isn't. Consider adding a DB-level constraint or trigger to keep these in sync.

**Rationale:** Trust boundary correctness requires the ownership assertion logic to be provably stable under all user lifecycle events.  
**Follow-up command:** DB  
**CISSP Domain:**
- Primary: Identity and Access Management
- Secondary: Security Assessment and Testing

---

### VENOM SECURITY FINDING — V-BOOK-07

**Finding ID:** V-BOOK-07  
**Location:** `features/dashboard/vport/controller/listVportServicesForProfile.controller.js:3–5`  
**Application Scope:** VCSM  
**Platform Surface:** PWA  
**Trust Boundary:** Authenticated VPORT Owner  
**Boundary Violated:** Controller provides no authorization, no transformation, no protection — pure passthrough  
**Contract Violated:** Architecture Contract (controller layer must not be a no-op passthrough)  

**Current behavior:**  
```js
export async function listVportServicesForProfileController({ profileId, includeDisabled = false } = {}) {
  return listVportServicesByProfileIdDAL({ profileId, includeDisabled });
}
```
No input validation. No caller verification. No ownership check. This controller is a security-neutral shell that adds no protection between the hook and the DAL.

**Risk:**  
If `includeDisabled = true` is passed from a hook (or from a future refactor), disabled/draft services are returned. There is no gate preventing a caller from requesting disabled services for any `profileId`.

**Severity:** MEDIUM  
**Exploitability:** LOW  
**Attack Preconditions:**
- Authenticated actor with access to the quick booking modal
- Can pass `includeDisabled: true` if hook is modified

**Blast Radius:** Single VPORT service catalog  
**Identity Leak Type:** Resource enumeration  
**Cache Trust Type:** None  
**RLS Dependency:** ASSUMED  

**Why it matters:**  
A controller that does nothing is not defense-in-depth — it is defense theater. The layer exists to be the enforcement point, not a relay.

**Recommended mitigation:**  
1. Enforce `includeDisabled: false` unconditionally (or scope it to confirmed owner callers only).  
2. Add ownership or scope check: verify caller has a relationship to the profile before returning services.  
3. Or remove this controller and use an actor-scoped service lookup that doesn't accept `profileId` at all (ties back to V-BOOK-05 mitigation).

**Rationale:** Controllers must enforce, not relay.  
**Follow-up command:** Sentry  
**CISSP Domain:**
- Primary: Software Development Security
- Secondary: Identity and Access Management

---

## MITIGATION PLAN

| Finding | Risk | Layer to Fix | Priority | Owner | Follow-up Command |
|---|---|---|---|---|---|
| V-BOOK-01 — Engine listBookingHistory no ownership gate | CRITICAL — unprotected booking history read | Engine · Controller | P0 | Engine | DB, Carnage |
| V-BOOK-02 — updateBookingStatusDAL PII overfetch | HIGH — PII in client state | DAL | P1 | App | DB |
| V-BOOK-03 — member_actor_id in customer read | HIGH — staff ID exposure to customers | DAL | P1 | App | DB |
| V-BOOK-04 — Raw UUID in notification link | HIGH — URL policy violation | Controller | P1 | App | Logan |
| V-BOOK-05 — profileId identity surface in quick booking | MEDIUM — forbidden surface | Hook · Controller | P2 | App | Sentry |
| V-BOOK-06 — Ownership assertion profile_id drift risk | MEDIUM — ownership logic fragility | DB/RLS | P2 | DB | DB, Carnage |
| V-BOOK-07 — listVportServicesForProfile passthrough controller | MEDIUM — no-op security layer | Controller | P2 | App | Sentry |

---

## CISSP DOMAIN COVERAGE SUMMARY

| CISSP Domain | Findings | Notes |
|---|---:|---|
| Security and Risk Management | 0 | No governance policy gaps found |
| Asset Security | 3 | V-BOOK-02, V-BOOK-03, V-BOOK-04 — PII overfetch, staff ID leak, UUID in links |
| Security Architecture and Engineering | 2 | V-BOOK-01, V-BOOK-06 — engine ownership gap, ownership assertion fragility |
| Communication and Network Security | 1 | V-BOOK-04 — UUID in notification link |
| Identity and Access Management | 4 | V-BOOK-01, V-BOOK-05, V-BOOK-06, V-BOOK-07 — unprotected read, profileId surface, ownership logic |
| Security Assessment and Testing | 1 | V-BOOK-06 — no verified test of ownership sync invariant |
| Security Operations | 0 | No logging/audit trail issues surfaced in this review |
| Software Development Security | 3 | V-BOOK-02, V-BOOK-05, V-BOOK-07 — passthrough controller, profileId in hook, PII in DAL select |

**Uncovered domains:**  
- **Security Operations** — audit trail adequacy for booking confirmations/cancellations not evaluated; recommend a separate Loki review focused on booking mutation logging.  
- **Communication and Network Security** — RPC/edge function exposure not evaluated; this review focused on feature-layer DAL paths only.
