# VENOM + ROBIN — VPORT Dashboard Audit

**Date:** 2026-05-10
**Application Scope:** VCSM
**Feature:** VPORT Dashboard (`/actor/:actorId/dashboard/*` + `/actor/:actorId/settings`)
**Dashboard Routes:** 13 routes (analytics, booking, team, leads, services, menu, rates, settings, media, flyer, feed, content, reviews)
**Supabase Schema:** `vport.*`, `vc.*`, `vc.actor_owners`, `reviews.*`, `platform.media_assets`, `notification.*`
**Native Module:** `dashboard-routes` | Status: **Partial**

---

## VENOM TARGET

```
Feature / Route / Engine: VPORT Dashboard — all owner-only routes
Application Scope: VCSM
Reason for review: Dashboard write paths with incorrect ownership checks; booking mutation with no ownership verification; team management with zero guards
Primary trust boundary: Actor ownership via actor_owners — violated in most write controllers
```

---

## SECURITY SURFACE

```
Entry point: /actor/:actorId/dashboard/* (owner-only), /actor/:actorId/settings (owner-only)
Auth source: Supabase session → useIdentity() → actorId + kind
Authorization layer: String equality in screen + assertCallerOwns in most controllers (WRONG PATTERN)
                     assertActorOwnsVportActorController used in only one controller (CORRECT PATTERN)
Identity surface: actorId (correct), kind = 'vport'
Sensitive objects: vport.bookings, vport.resources, vport.availability_rules, vport.resource_services,
                   vc.actor_owners, vport.leads, vport.service_catalog, vport.menu, vport.rates
```

---

## TRUST BOUNDARY TRACE

```
Client input: actorId (from route param), identity.actorId (from session)
Validated at: VportDashboardScreen.jsx — String equality only
Identity resolved at: useIdentity() hook → identity.actorId
Authorization enforced at: Screen-level string equality gate (wrong); assertCallerOwns in some controllers (string equality — wrong)
                           assertActorOwnsVportActorController in ONE controller (saveVportPublicDetails — correct)
Data returned to: Dashboard sub-screens → booking/team/leads/rates management surfaces (owner-only)
```

---

## SECURITY RISK FINDINGS

---

### VENOM SECURITY FINDING — VD-01 ⚠️ CRITICAL

- **Location:** `apps/VCSM/src/features/dashboard/vport/controller/vportTeam.controller.js` — `removeTeamMemberController(resourceId)`
- **Application Scope:** VCSM
- **Current behavior:**
  ```js
  export async function removeTeamMemberController(resourceId) {
    if (!resourceId) throw new Error("removeTeamMember: resourceId required");
    return removeTeamMemberDAL({ resourceId });
  }
  ```
  No `actorId` parameter. No caller identity. No ownership check. Any actor who knows a `resourceId` can remove a team member from any barbershop by calling this controller directly.
- **Risk:** Authenticated attackers who obtain or enumerate a `resourceId` from `vport.resources` can remove barbers from any barbershop's team, disrupting active booking lanes and causing the business operational harm.
- **Severity:** CRITICAL
- **Exploitability:** HIGH
- **Attack Preconditions:**
  - Authenticated Citizen account required
  - Target `resourceId` from `vport.resources` (predictable via sequential scan or prior API response)
  - No actor_owners verification required
- **Blast Radius:** Multi-actor (any barbershop's team composition; booking lane disruption)
- **Trust Boundary:** Authenticated Citizen → VPORT Owner
- **Boundary Violated:** Authenticated Citizen acting as VPORT Owner without ownership check
- **RLS Dependency:** ASSUMED — if `vport.resources` DELETE RLS enforces profile ownership via `auth.uid()` → `actor_owners`, this is partially mitigated; unverified
- **Platform Surface:** VCSM Web PWA (Dashboard — Team Management)
- **Identity Leak Type:** None (no sensitive data returned — but unauthorized write)
- **Cache Trust Type:** N/A
- **Contract Violation:** Architecture contract §2.1 — "Owner means Actor Owner verified through actor_owners." No ownership verification present.
- **Why it matters:** Team removal is an operational action with real business impact. Removing a barber removes their availability lanes, cancels or orphans pending bookings, and damages the barbershop's booking capacity. This can be triggered by any authenticated user with a resource ID.
- **Recommended mitigation:**
  1. Add `callerActorId` parameter to `removeTeamMemberController`.
  2. Resolve the `actor_id` from `resourceId` via the resource's linked `profile_id` → `vport.profiles.actor_id`.
  3. Call `assertActorOwnsVportActorController({ requestActorId: callerActorId, targetActorId: vportActorId })`.
  4. Only then call `removeTeamMemberDAL`.
- **Rationale:** Every destructive write path must verify caller ownership via `actor_owners` before executing. A zero-guard delete is the highest-risk write pattern.
- **Follow-up command:** DB (audit `vport.resources` DELETE RLS policy — confirm whether it enforces profile_id/actor_id ownership)
- **CISSP Domain:**
  - Primary: Identity and Access Management
  - Secondary: Software Development Security, Security Architecture and Engineering

---

### VENOM SECURITY FINDING — VD-02 ⚠️ CRITICAL

- **Location:** `apps/VCSM/src/features/dashboard/vport/controller/vportTeamInvite.controller.js` — `acceptTeamRequestController(resourceId)` and `declineTeamRequestController(resourceId)`
- **Application Scope:** VCSM
- **Current behavior:**
  ```js
  export async function acceptTeamRequestController(resourceId) {
    if (!resourceId) throw new Error("acceptTeamRequest: resourceId required");
    const resource = await getVportResourceByIdDAL({ resourceId });
    if (!resource) throw new Error("acceptTeamRequest: resource not found");
    if (resource.status !== "pending_acceptance") throw new Error("acceptTeamRequest: resource is not pending acceptance");
    return updateVportResourceStatusDAL({ resourceId, status: "linked" });
  }
  ```
  No caller identity. No verification that the caller is the barber being invited or the barbershop owner. Any authenticated actor who knows a `resourceId` with `status = 'pending_acceptance'` can accept or decline any team invite.
- **Risk:** An attacker can accept invites for barbers who have not consented (adding them to a barbershop they did not join) or decline pending invites to prevent legitimate team formation.
- **Severity:** CRITICAL
- **Exploitability:** HIGH
- **Attack Preconditions:**
  - Authenticated Citizen account required
  - `resourceId` with `status = 'pending_acceptance'` (obtainable via API scan or social engineering)
  - No caller verification required
- **Blast Radius:** Multi-actor (barbershop team composition; individual barber's affiliation without consent)
- **Trust Boundary:** Authenticated Citizen → Staff Resource / VPORT Owner
- **Boundary Violated:** Any actor acting as the invite recipient or barbershop owner
- **RLS Dependency:** ASSUMED — if `vport.resources` UPDATE RLS enforces row-level ownership, partially mitigated; unverified
- **Platform Surface:** VCSM Web PWA (Dashboard — Team Invites)
- **Identity Leak Type:** None (write-only unauthorized mutation)
- **Cache Trust Type:** N/A
- **Contract Violation:** Architecture contract §2.1 — no actor_owners verification; identity surface not enforced
- **Why it matters:** Accepting an invite on behalf of a barber without their consent creates an unauthorized actor affiliation. Declining an invite on behalf of a barbershop owner without ownership blocks legitimate team building.
- **Recommended mitigation:**
  1. For `acceptTeamRequestController`: add `callerActorId`. Verify the caller is the barber VPORT actor being invited (the resource's `actor_id` matches `callerActorId`) OR verify the caller is an owner of the barbershop via `actor_owners`.
  2. For `declineTeamRequestController`: same dual verification — caller must be the invited barber or the barbershop owner.
  3. Add session identity to both controllers.
- **Rationale:** Invite accept/decline is a consent action — it must verify the consenting party's identity.
- **Follow-up command:** DB (audit `vport.resources` UPDATE RLS — confirm whether invite status updates enforce actor_id or profile_id ownership)
- **CISSP Domain:**
  - Primary: Identity and Access Management
  - Secondary: Security Architecture and Engineering, Software Development Security

---

### VENOM SECURITY FINDING — VD-03 — HIGH

- **Location:** `apps/VCSM/src/features/dashboard/vport/controller/updateVportBooking.controller.js` — `updateBookingStatusController`
- **Application Scope:** VCSM
- **Current behavior:**
  ```js
  export async function updateBookingStatusController({ bookingId, status, actorId = null }) {
    if (!bookingId) throw new Error(...);
    if (!["cancelled", "completed", "no_show"].includes(status)) throw new Error(...);
    return updateVportBookingStatusDAL({ bookingId, status, updatedBy: actorId });
  }
  ```
  `actorId` is **optional** (defaults to `null`). No ownership verification that `actorId` owns the VPORT associated with the booking. Any authenticated actor who knows a `bookingId` can set a booking to `cancelled`, `completed`, or `no_show`.
- **Risk:** An attacker can cancel any VPORT's bookings, mark them as completed (to trigger premature payment flows), or mark legitimate bookings as `no_show`, harming both barbers and customers.
- **Severity:** HIGH
- **Exploitability:** HIGH
- **Attack Preconditions:**
  - Authenticated account required
  - `bookingId` from `vport.bookings` (obtainable via booking confirmation screens or ID guessing)
  - `actorId` is optional — the call succeeds even without it
- **Blast Radius:** Multi-actor (any VPORT's booking history; customer trust; payment trigger impact)
- **Trust Boundary:** Authenticated Citizen → VPORT Owner / Booking Participant
- **Boundary Violated:** Any actor mutating booking status without proving relationship to the booking
- **RLS Dependency:** ASSUMED — if `vport.bookings` UPDATE RLS enforces `profile_id` ownership or `customer_actor_id` match, partially mitigated; unverified
- **Platform Surface:** VCSM Web PWA (Dashboard — Booking Management)
- **Identity Leak Type:** N/A (write mutation)
- **Cache Trust Type:** N/A
- **Contract Violation:** Architecture contract §2.1 — write controller with optional identity and no ownership gate
- **Why it matters:** Booking status is a financial and operational surface. Unauthorized cancellations directly harm VPORT revenue and customer experience. Making `actorId` optional means the controller was shipped without enforcement as a design choice, not an oversight.
- **Recommended mitigation:**
  1. Make `actorId` required (remove default `null`).
  2. Fetch the booking via `bookingId` and resolve the VPORT actor from `profile_id → vport.profiles.actor_id`.
  3. Call `assertActorOwnsVportActorController({ requestActorId: actorId, targetActorId: vportActorId })`.
  4. Allow cancellation also if `actorId === booking.customer_actor_id` (customer-side cancel).
- **Rationale:** Booking status mutations must be gated to the VPORT owner or the booking participant. Optional `actorId` makes ownership enforcement impossible at the controller layer.
- **Follow-up command:** DB (audit `vport.bookings` UPDATE RLS — confirm whether it enforces actor_id or profile_id scope)
- **CISSP Domain:**
  - Primary: Identity and Access Management
  - Secondary: Security and Risk Management, Software Development Security

---

### VENOM SECURITY FINDING — VD-04 — HIGH

- **Location:** `apps/VCSM/src/features/dashboard/vport/controller/updateVportBooking.controller.js` — `rescheduleBookingController`
- **Application Scope:** VCSM
- **Current behavior:**
  ```js
  export async function rescheduleBookingController({ bookingId, startsAt, endsAt, resourceId }) {
    if (!bookingId || !startsAt || !endsAt || !resourceId) throw new Error(...);
    // validates time range
    return updateVportBookingTimesDAL({ bookingId, startsAt, endsAt, resourceId });
  }
  ```
  No `actorId` parameter. No ownership. No caller identity. Any actor who knows a `bookingId` can reschedule any booking to any time slot on any resource.
- **Risk:** An attacker can reschedule any booking, disrupting confirmed appointments, overwriting time slots, and potentially injecting bookings into resource calendars at arbitrary times.
- **Severity:** HIGH
- **Exploitability:** HIGH
- **Attack Preconditions:**
  - Authenticated account required
  - `bookingId` and `resourceId` from `vport.bookings`/`vport.resources`
  - No ownership check at all
- **Blast Radius:** Multi-actor (any VPORT's calendar; customer confirmed bookings; resource availability)
- **Trust Boundary:** Authenticated Citizen → VPORT Owner
- **Boundary Violated:** Any actor rescheduling bookings without VPORT ownership
- **RLS Dependency:** ASSUMED
- **Platform Surface:** VCSM Web PWA (Dashboard — Booking Management)
- **Identity Leak Type:** N/A
- **Cache Trust Type:** N/A
- **Contract Violation:** Architecture contract §2.1
- **Why it matters:** Reschedule mutates `starts_at`, `ends_at`, and `resource_id` — directly affects customer appointment time and which staff member/lane handles the booking. Zero ownership gate.
- **Recommended mitigation:**
  1. Add `callerActorId` to `rescheduleBookingController`.
  2. Resolve VPORT actor from booking's `profile_id`.
  3. Call `assertActorOwnsVportActorController`.
  4. Add double-booking check on the target `resourceId`/`startsAt`/`endsAt` window before updating.
- **Rationale:** Calendar mutations require ownership proof at minimum. Missing `actorId` entirely means this path was never designed with authorization.
- **Follow-up command:** DB
- **CISSP Domain:**
  - Primary: Identity and Access Management
  - Secondary: Software Development Security

---

### VENOM SECURITY FINDING — VD-05 — HIGH

- **Location:** `apps/VCSM/src/features/dashboard/vport/controller/createOwnerBooking.controller.js`
- **Application Scope:** VCSM
- **Current behavior:**
  ```js
  export async function createOwnerBookingController({ actorId, resourceId, ... }) {
    const resource = await getVportResourceByIdDAL({ resourceId });
    if (!resource?.profile_id) throw new Error("Resource has no associated profile.");
    return insertVportBookingDAL({
      row: { ..., status: "confirmed", source: "owner", created_by_actor_id: actorId }
    });
  }
  ```
  Fetches the resource and verifies it has a `profile_id` — but never verifies that `actorId` is an owner of the VPORT whose resource this belongs to. The booking is created with `status: "confirmed"` and `source: "owner"` without proving the caller is the owner.
- **Risk:** An authenticated actor who knows a `resourceId` can create an owner-confirmed booking on any VPORT's calendar, injecting `source: "owner"` bookings that may trigger payment flows, suppress slot availability, or corrupt a VPORT's calendar.
- **Severity:** HIGH
- **Exploitability:** HIGH
- **Attack Preconditions:**
  - Authenticated account required
  - `resourceId` from `vport.resources` (any VPORT)
  - No ownership proof required
- **Blast Radius:** Multi-actor (any VPORT's calendar; booking audit trail; `source: "owner"` trust)
- **Trust Boundary:** Authenticated Citizen → VPORT Owner
- **Boundary Violated:** Any actor injecting owner-authorized bookings
- **RLS Dependency:** ASSUMED — `vport.bookings` INSERT RLS must enforce `profile_id` ownership; unverified
- **Platform Surface:** VCSM Web PWA (Dashboard — Owner Booking Creation)
- **Identity Leak Type:** N/A
- **Cache Trust Type:** N/A
- **Contract Violation:** Architecture contract §2.1
- **Why it matters:** `source: "owner"` and `status: "confirmed"` are privileged booking attributes. Allowing any actor to inject these corrupts the trust model of the booking system and may bypass customer consent flows.
- **Recommended mitigation:**
  1. Resolve VPORT actor from `resource.profile_id → vport.profiles.actor_id`.
  2. Call `assertActorOwnsVportActorController({ requestActorId: actorId, targetActorId: vportActorId })`.
  3. Only then proceed with `insertVportBookingDAL`.
- **Rationale:** Owner-privileged bookings (`source: "owner"`, `status: "confirmed"`) must prove ownership before granting those privileges.
- **Follow-up command:** DB (audit `vport.bookings` INSERT RLS — does it enforce profile_id ownership?)
- **CISSP Domain:**
  - Primary: Identity and Access Management
  - Secondary: Security and Risk Management, Software Development Security

---

### VENOM SECURITY FINDING — VD-06 — HIGH

- **Location:** `apps/VCSM/src/features/dashboard/vport/screens/VportDashboardScreen.jsx:~line 40`
- **Application Scope:** VCSM
- **Current behavior:**
  ```js
  const isOwner = Boolean(actorId) &&
                  Boolean(identity?.actorId) &&
                  String(identity.actorId) === String(actorId);
  ```
  The dashboard's ownership gate is string equality between the session actor (`identity.actorId`) and the route actor (`actorId`). A user-actor who owns a VPORT-actor has `identity.actorId = userActorId` and `actorId = vportActorId`. These are different IDs. The equality check **always fails for legitimate user-actor owners of VPORT-actors**, blocking them with "You can only access the dashboard for your own vport."
- **Risk:** Legitimate owners of VPORT actors (users who own a business VPORT) cannot access the dashboard unless they switch identity to the VPORT actor itself. This is a functional denial-of-service for the multi-actor ownership model. If identity-switching is not available or fails, legitimate owners are permanently locked out.
- **Severity:** HIGH (functional — ownership denial for legitimate actors)
- **Exploitability:** N/A (this is a denial, not an escalation)
- **Blast Radius:** All user-actors who own VPORT-actors via `actor_owners` (the intended multi-actor ownership pattern)
- **Trust Boundary:** Authenticated Citizen (user-actor) → their owned VPORT-actor
- **Boundary Violated:** Legitimate owner rejected as unauthorized
- **RLS Dependency:** NONE (screen-level check, not DB-dependent)
- **Platform Surface:** VCSM Web PWA (Dashboard Entry Screen)
- **Identity Leak Type:** N/A
- **Cache Trust Type:** N/A
- **Contract Violation:** Architecture contract §1.2 — "Owner always means Actor Owner verified through actor_owners." String equality is not the correct ownership model.
- **Why it matters:** The entire VPORT actor model is built on the premise that user-actors own VPORT-actors. A screen gate that rejects this exact pattern is architecturally misaligned with the platform's identity model. The correct check uses `actor_owners` — as demonstrated in `saveVportPublicDetailsByActorId.controller.js`, which does this correctly.
- **Recommended mitigation:**
  1. Replace the string equality `isOwner` check with an async ownership verification call.
  2. The pattern is already implemented in `assertActorOwnsVportActorController` (in the booking engine) — use it or create a `useVportOwnership(actorId)` hook that wraps the same `actor_owners` lookup.
  3. Show a loading state during the async check; gate the dashboard on the verified result.
  4. Reference: `saveVportPublicDetailsByActorId.controller.js` uses `assertActorOwnsVportActorController` correctly.
- **Rationale:** `actor_owners` is the sole ownership authority. String equality of two different actor IDs is not a valid ownership check.
- **Follow-up command:** ARCHITECT (audit all dashboard screens for `String(identity.actorId) === String(actorId)` pattern)
- **CISSP Domain:**
  - Primary: Identity and Access Management
  - Secondary: Security Architecture and Engineering

---

### VENOM SECURITY FINDING — VD-07 — MEDIUM

- **Location:** `apps/VCSM/src/features/dashboard/vport/controller/vportTeamAccess.controller.js` — `assertCallerOwns` function; used throughout `vportLeads.controller.js` and `vportTeamAccess.controller.js`
- **Application Scope:** VCSM
- **Current behavior:**
  ```js
  function assertCallerOwns(callerActorId, ownerActorId, op) {
    if (!callerActorId) throw new Error(`${op}: callerActorId required`);
    if (String(callerActorId) !== String(ownerActorId)) {
      throw new Error(`${op}: caller does not own this vport`);
    }
  }
  ```
  String equality used as the ownership check pattern across leads and team access controllers. While these controllers at least pass `callerActorId`, the ownership model is incorrect for multi-actor ownership (user-actor owning VPORT-actor).
- **Risk:** Legitimate user-actors who own VPORT-actors are denied leads and team access. VPORT-actor identity switchers can perform these operations, but native clients or flows where the user acts as their user-actor are blocked.
- **Severity:** MEDIUM (partial functional denial; attacker who has VPORT-actor credentials is not blocked)
- **Exploitability:** LOW (primarily functional denial for legitimate owners, not privilege escalation)
- **Blast Radius:** Multi-actor (all legitimate user-actor → VPORT-actor ownership pairs using these controllers)
- **Trust Boundary:** Authenticated Citizen (user-actor) → owned VPORT-actor
- **Boundary Violated:** Legitimate owner rejected; non-owner VPORT actors not rejected
- **RLS Dependency:** ASSUMED — RLS must be the backstop if string equality passes incorrectly
- **Platform Surface:** VCSM Web PWA (Dashboard — Leads, Team Access)
- **Identity Leak Type:** N/A
- **Cache Trust Type:** N/A
- **Contract Violation:** Architecture contract §1.2 — string equality is not `actor_owners` verification
- **Why it matters:** `assertCallerOwns` is a helper function that looks like a safe ownership check but is not. It is applied consistently, meaning the incorrect pattern is repeated across all controllers that import it.
- **Recommended mitigation:**
  1. Replace `assertCallerOwns` with `assertActorOwnsVportActorController` (async).
  2. All callers (`vportLeads.controller.js`, `vportTeamAccess.controller.js`) must become async if they are not already.
  3. The reference implementation already exists — adopt it everywhere.
- **Rationale:** Systemic helper functions that embed incorrect security checks propagate the vulnerability everywhere they are imported.
- **Follow-up command:** ARCHITECT (inventory all callers of `assertCallerOwns`)
- **CISSP Domain:**
  - Primary: Identity and Access Management
  - Secondary: Software Development Security

---

### VENOM SECURITY FINDING — VD-08 — MEDIUM

- **Location:** `apps/VCSM/src/features/dashboard/vport/controller/vportPublicBooking.controller.js` — `serviceLabelSnapshot`
- **Application Scope:** VCSM
- **Current behavior:**
  ```js
  // serviceLabelSnapshot accepted directly from client input and stored in vport.bookings
  return insertVportBookingDAL({
    row: {
      ...
      service_label_snapshot: serviceLabelSnapshot,
      ...
    }
  });
  ```
  `serviceLabelSnapshot` is a fully client-supplied string that is stored in `vport.bookings` and likely rendered in booking confirmation views and the dashboard booking list. There is no server-side resolution of the actual service label from the catalog.
- **Risk:** A client can store an arbitrary string (including XSS payloads, false service descriptions, or injected content) as the service label in the booking record. If rendered as raw HTML in any booking view, this is an XSS vector in the dashboard.
- **Severity:** MEDIUM
- **Exploitability:** MEDIUM (requires a customer-side booking flow; payload sits in DB until a dashboard renders it)
- **Blast Radius:** Single VPORT (owner's dashboard booking view) + customer-facing confirmation
- **Trust Boundary:** Authenticated Citizen (booking customer) → VPORT Owner's dashboard
- **Boundary Violated:** Customer-supplied data presented as service metadata in an owner-trusted context
- **RLS Dependency:** NONE (application-level data trust issue)
- **Platform Surface:** VCSM Web PWA (Public Booking Flow → Dashboard Booking View)
- **Identity Leak Type:** N/A (data trust, not identity)
- **Cache Trust Type:** STALE (if booking list is cached, stale rendered payload persists)
- **Contract Violation:** Architecture contract — all client-supplied enumerable fields must be validated against allowed sets before storage
- **Why it matters:** Booking snapshots are rendered in dashboard views that VPORT owners trust as factual records. Client-controlled snapshot content breaks that trust model.
- **Recommended mitigation:**
  1. Resolve `serviceLabelSnapshot` server-side: fetch the service record from `vport.service_catalog` by `serviceId` and use the catalog's `label` field.
  2. Do not accept `serviceLabelSnapshot` from the client at all — derive it from the catalog entry at booking creation time.
  3. Sanitize all rendered booking labels on the display layer as a defense-in-depth measure.
- **Rationale:** Snapshot fields that exist for display purposes must be server-resolved from trusted sources, not client-supplied.
- **Follow-up command:** Wolverine
- **CISSP Domain:**
  - Primary: Software Development Security
  - Secondary: Communication and Network Security

---

### VENOM SECURITY FINDING — VD-09 — MEDIUM

- **Location:** `apps/VCSM/src/features/dashboard/vport/controller/vportTeam.controller.js` — `sendTeamRequestController(actorId, barberVportActorId, barberVportName)`
- **Application Scope:** VCSM
- **Current behavior:**
  ```js
  export async function sendTeamRequestController(actorId, barberVportActorId, barberVportName) {
    if (!actorId || !barberVportActorId) throw new Error(...);
    return createTeamRequestResourceDAL({ actorId, barberVportActorId, barberVportName });
  }
  ```
  No `callerActorId`. The `actorId` parameter is the barbershop VPORT actor ID — treated as both the target and implicitly the caller identity. No verification that the caller is an owner of `actorId`. Any authenticated user who knows a barbershop's `actorId` can send team invites as that barbershop.
- **Risk:** An attacker can send unsolicited team join requests to any barber VPORT in the name of any barbershop, spamming barbers with false invites and harassing them.
- **Severity:** MEDIUM
- **Exploitability:** HIGH (actorId is a public identifier; no ownership check required)
- **Blast Radius:** Multi-actor (any barbershop's invite outbox; any barber receiving unsolicited invites)
- **Trust Boundary:** Authenticated Citizen → VPORT Owner (barbershop)
- **Boundary Violated:** Any actor sending invites as a barbershop they do not own
- **RLS Dependency:** ASSUMED — if `vport.resources` INSERT RLS enforces `actor_id` ownership, partially mitigated
- **Platform Surface:** VCSM Web PWA (Dashboard — Team Invite Send)
- **Identity Leak Type:** N/A
- **Cache Trust Type:** N/A
- **Contract Violation:** Architecture contract §2.1
- **Why it matters:** Invite spam from any actor's barbershop identity degrades trust in the team invite system and could be used for targeted harassment of competing barbers.
- **Recommended mitigation:**
  1. Add `callerActorId` (session actor) to `sendTeamRequestController`.
  2. Call `assertActorOwnsVportActorController({ requestActorId: callerActorId, targetActorId: actorId })`.
  3. Proceed with invite creation only after ownership is verified.
- **Rationale:** All actions taken in a VPORT's name must verify the caller is an owner of that VPORT.
- **Follow-up command:** DB (verify `vport.resources` INSERT RLS)
- **CISSP Domain:**
  - Primary: Identity and Access Management
  - Secondary: Software Development Security

---

### VENOM SECURITY FINDING — VD-10 — LOW

- **Location:** `apps/VCSM/src/features/dashboard/vport/controller/getVportPublicDetails.controller.js` — cache invalidation
- **Application Scope:** VCSM
- **Current behavior:** `invalidateVportPublicDetails(actorId)` is exported from the cache module but is not called from VPORT deactivation or deletion write paths. Dashboard write operations (hours update, services update) call it where appropriate. However, deactivation/deletion events — which originate outside the dashboard — do not trigger cache invalidation.
- **Risk:** A deactivated or blocked VPORT continues serving cached public details for up to 60 seconds to public visitors. Dashboard operators may see stale state after deactivation.
- **Severity:** LOW
- **Exploitability:** LOW
- **Blast Radius:** Single VPORT (public profile cache)
- **Trust Boundary:** Public Visitor (receives stale cached state)
- **Boundary Violated:** Operational expectation violated (deactivated ≠ serving cache)
- **RLS Dependency:** NONE (cache is app-layer)
- **Platform Surface:** VCSM Web PWA (Public Profile + Dashboard)
- **Identity Leak Type:** STALE STATE (deactivated VPORT appears active)
- **Cache Trust Type:** STALE
- **Contract Violation:** None (this is a hardening recommendation)
- **Why it matters:** Same risk as VB-04 in the barbershop audit — shared cache with no deactivation invalidation hook. For booking-active VPORTs, stale hours/availability data could mislead visitors.
- **Recommended mitigation:** Wire `invalidateVportPublicDetails(actorId)` into the VPORT deactivation and deletion write paths. Reduce TTL to 30 seconds for booking-active VPORTs.
- **Rationale:** Deactivation should be immediately reflected to public visitors.
- **Follow-up command:** BUGSBUNNY
- **CISSP Domain:**
  - Primary: Security Operations
  - Secondary: Security Architecture and Engineering

---

## REFERENCE — CORRECT OWNERSHIP PATTERN

The following controller demonstrates the correct ownership pattern that all dashboard write controllers should follow:

**File:** `apps/VCSM/src/features/dashboard/vport/controller/saveVportPublicDetailsByActorId.controller.js`

```js
await assertActorOwnsVportActorController({
  requestActorId,
  targetActorId: actorId
});
```

**Implementation:** `assertActorOwnsVportActorController` in the booking engine:
1. Short-circuits if `requestActorId === targetActorId` (VPORT acting as itself)
2. Requires `requestActorId` actor to have `kind = 'user'`
3. Fetches `actor_owners` link via `readActorOwnerLinkByActorAndUserProfileDAL`
4. Rejects if link is missing or `is_void = true`

All dashboard write controllers should adopt this pattern, replacing `assertCallerOwns` (string equality) and all zero-ownership-check write paths.

---

## MITIGATION PLAN

| Risk | Location | Layer to Fix | Priority |
|---|---|---|---|
| VD-01: `removeTeamMemberController` — zero guards | `vportTeam.controller.js` | Controller (URGENT) | CRITICAL |
| VD-02: Accept/decline invite — no caller verification | `vportTeamInvite.controller.js` | Controller (URGENT) | CRITICAL |
| VD-03: `updateBookingStatusController` — optional actorId | `updateVportBooking.controller.js` | Controller | HIGH |
| VD-04: `rescheduleBookingController` — no actorId | `updateVportBooking.controller.js` | Controller | HIGH |
| VD-05: `createOwnerBookingController` — no actor_owners check | `createOwnerBooking.controller.js` | Controller | HIGH |
| VD-06: Dashboard `isOwner` string equality | `VportDashboardScreen.jsx` | Screen + Hook | HIGH |
| VD-07: `assertCallerOwns` systemic string equality | `vportTeamAccess.controller.js` | Controller (systemic) | MEDIUM |
| VD-08: `serviceLabelSnapshot` client-controlled | `vportPublicBooking.controller.js` | Controller | MEDIUM |
| VD-09: `sendTeamRequestController` no caller check | `vportTeam.controller.js` | Controller | MEDIUM |
| VD-10: Cache not invalidated on deactivation | `getVportPublicDetails.controller.js` | Controller | LOW |

---

## CISSP DOMAIN COVERAGE SUMMARY

| CISSP Domain | Findings | Notes |
|---|---:|---|
| Security and Risk Management | 2 | VD-03, VD-05 (booking status/owner booking — operational financial risk) |
| Asset Security | 0 | No data exposure findings in scope |
| Security Architecture and Engineering | 3 | VD-06 (screen gate), VD-07 (systemic helper), VD-10 (cache staleness) |
| Communication and Network Security | 1 | VD-08 (client-supplied snapshot rendered in dashboard) |
| Identity and Access Management | 7 | VD-01, VD-02, VD-03, VD-04, VD-05, VD-06, VD-09 (ownership failures throughout) |
| Security Assessment and Testing | 0 | Out of scope |
| Security Operations | 1 | VD-10 (deactivation cache invalidation) |
| Software Development Security | 6 | VD-01, VD-02, VD-03, VD-04, VD-07, VD-08, VD-09 (unsafe patterns, missing guards) |

**Uncovered domains:**
- Security Assessment and Testing: out of scope for this audit
- Asset Security: no sensitive data over-exposure findings within dashboard scope; systemic `vport_id` exposure is documented in profile-level audits (VB-02, VBR-02, VE-06, VR-02, VL-02)

---

## ROBIN — NATIVE TRANSFER ANALYSIS

### Module Reference
`native-transfer/modules/dashboard-routes.md` | Status: **Partial**

### Dashboard Route Map (PWA → Native)

| Route | PWA | Native | Status |
|---|---|---|---|
| `/actor/:actorId/dashboard/booking` | ✓ | ✓ `BookingDashboardScreen.swift` | **Verify owner guard** |
| `/actor/:actorId/dashboard/team` | ✓ | ✓ `TeamDashboardScreen.swift` | **Verify invite flow** |
| `/actor/:actorId/dashboard/leads` | ✓ | ✓ `LeadsDashboardScreen.swift` | **Verify owner guard** |
| `/actor/:actorId/dashboard/services` | ✓ | ✓ `VPortServicesEditorScreen.swift` | **Verify ownership gate** |
| `/actor/:actorId/dashboard/menu` | ✓ | ✓ `VPortMenuEditorScreen.swift` | Parity (restaurant type) |
| `/actor/:actorId/dashboard/rates` | ✓ | ✓ `VPortRatesEditorScreen.swift` | **Verify — VE-01 CRITICAL blocker** |
| `/actor/:actorId/dashboard/analytics` | ✓ | ✓ `AnalyticsDashboardScreen.swift` | Parity |
| `/actor/:actorId/dashboard/media` | ✓ | ✓ `MediaDashboardScreen.swift` | Parity |
| `/actor/:actorId/dashboard/feed` | ✓ | Partial | **Verify P2** |
| `/actor/:actorId/dashboard/content` | ✓ | Partial | **Verify P2** |
| `/actor/:actorId/dashboard/reviews` | ✓ | ✓ | Parity |
| `/actor/:actorId/settings` | ✓ | ✓ `SettingsScreen.swift` | Parity |
| `/actor/:actorId/dashboard/flyer` | ✓ | Not confirmed | **P2 — confirm or gate** |

### Native Dashboard Guard — Status: STRONGER THAN PWA

Native `DashboardAccess.controller.swift` does NOT use string equality. It uses:
```swift
try await supabaseClient.dashboardFetchOwnedActorDAL(
  actorID: actorID,
  userID: session.userID,
  accessToken: session.accessToken
)
```
This is a proper DB-level ownership check using the session `userID` — querying `actor_owners` or equivalent. Native guard is architecturally correct while the PWA guard (VD-06) is not. The PWA must be brought up to native's standard, not the reverse.

### Native Gaps — Dashboard

1. **P0 — PWA dashboard `isOwner` is broken for user-actor owners (VD-06).** If native is already correct, native clients work. PWA clients do not. Before shipping the PWA dashboard to user-actor owners, VD-06 must be fixed.

2. **P1 — Booking write path security (VD-03, VD-04, VD-05).** If native booking management calls the same `updateVportBooking.controller.js` and `createOwnerBooking.controller.js` endpoints, native inherits these authorization gaps. Confirm whether native calls these controllers directly via API or has its own Supabase write path. If native has its own booking mutation layer, audit it separately.

3. **P1 — Team invite accept/decline (VD-02).** If native `TeamDashboardScreen.swift` allows accepting or declining invites via the same controller path, the zero-caller-verification gap is inherited. Confirm native invite actions pass caller identity.

4. **P1 — Team member removal (VD-01).** Confirm `TeamDashboardScreen.swift` passes the caller's `actorID` when triggering remove-team-member. If the native call maps to `removeTeamMemberController(resourceId)` without actorId, the gap is native-inherited.

5. **P1 — Rates write gate (VE-01 from exchange audit).** `VPortRatesEditorScreen.swift` must not call `upsertVportRateController` until VE-01 is resolved in the PWA controller. The CRITICAL void-identity-parameter gap is a blocking risk for native rates writes.

6. **P2 — "Add barber" invite flow missing from native team screen.** PWA team dashboard includes a flow to send a join request to a barber VPORT. No confirmed equivalent in `TeamDashboardScreen.swift`. Not a security gap but a feature parity gap.

7. **P2 — Flyer route.** `/actor/:actorId/dashboard/flyer` exists in PWA navigation. No confirmed native equivalent. Gate or stub before launch.

8. **P2 — Feed and content dashboard routes.** Present in PWA, partially confirmed in native. Not blocking but should be gated or stubbed.

### RLS/Schema Watch — Dashboard

- `vport.resources`: DELETE and UPDATE RLS must enforce `profile_id` ownership — **URGENT** (VD-01, VD-02 depend on this as backstop)
- `vport.bookings`: INSERT, UPDATE RLS must enforce `profile_id` ownership — **URGENT** (VD-03, VD-04, VD-05 depend on this)
- `vc.actor_owners`: Confirm `dashboardFetchOwnedActorDAL` in native queries this table correctly with `userID` + `actorID` match
- `vport.bookings.service_label_snapshot`: Confirm column does not render raw HTML in any view layer

### Priority Classification

| Gap | Priority | Blocking? |
|---|---|---|
| PWA `isOwner` string equality (VD-06) | P0 | YES — user-actor owners locked out of PWA dashboard |
| Booking status/reschedule ownership (VD-03, VD-04) | P0 | YES — financial write with no gate |
| Owner booking creation ownership (VD-05) | P0 | YES |
| Remove team member zero guard (VD-01) | P0 | YES — any actor can disrupt any team |
| Accept/decline invite no caller (VD-02) | P0 | YES — consent violation |
| Rates write inherits VE-01 (native) | P1 | YES — critical blocker for native rates |
| Send team invite no caller (VD-09) | P1 | No — invite spam risk, not data destruction |
| Service label snapshot client-controlled (VD-08) | P1 | No — XSS potential but not blocking |
| `assertCallerOwns` systemic replacement (VD-07) | P1 | No — functional denial for legitimate owners |
| Add barber invite native parity | P2 | No |
| Flyer route native parity | P2 | No |
| Feed/content dashboard route parity | P2 | No |

---

*VENOM is read-only. No code was modified. All findings are recommendations only.*
*Robin analysis is planning-only. No native code was changed.*
*VD-01 and VD-02 are zero-guard destructive writes — they require immediate controller remediation before any further team management deployment.*
*The correct ownership pattern already exists in the codebase: `assertActorOwnsVportActorController` in `saveVportPublicDetailsByActorId.controller.js`. Use it as the reference implementation for all remediation work in this audit.*
