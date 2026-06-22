# VENOM Security Report — Vport Public Booking Flow
**Date:** 2026-05-10 08:13  
**Application Scope:** VCSM  
**Reviewed by:** VENOM  
**Triggered by:** Barbershop booking debug session — post-fix security audit

---

## Target

```
Feature:          Vport Public Booking Flow
Application Scope: VCSM
Reason for review: Post-bug deep audit of trust boundaries across
                   booking creation, slot generation, and availability read
Primary trust boundary: Authenticated client → vportPublicBooking.controller.js
                        → vport schema (Supabase PostgREST + RLS)
```

---

## Security Surface

```
Entry point:      createVportPublicBookingController
Auth source:      supabase.auth session (JWT)
Authorization:    RLS on vport.bookings, vport.resources, vport.availability_rules
Identity surface: requestActorId supplied by client in booking payload
Sensitive objects: customer_name, customer_note, service_label_snapshot,
                   starts_at / ends_at, customer_actor_id
```

---

## Trust Boundary Trace

```
Client input:     resourceId, serviceId, startsAt, endsAt, timezone,
                  serviceLabelSnapshot, durationMinutes, requestActorId,
                  customerActorId, customerName, customerNote
Validated at:     controller — presence checks only, no domain/range validation
Identity resolved at: readActorVportLinkDAL (DB lookup on requestActorId)
                      ONLY if requestActorId is provided
Authorization enforced at: RLS on vport.bookings INSERT
Data returned to: booking row (contains customer_note, customer_name)
```

---

## Bug Fixed This Session (Not a security finding — data correctness)

**Root cause:** `useVportPublicBooking.js` passed raw snake_case DAL rows to `buildRuleSlotsForDate()` which expects camelCase (`startTime`, `endTime`). The dashboard hook (`useVportResourceAvailability`) correctly applies `mapAvailabilityRule` — the public booking hook did not. Result: `timeToMinutes(undefined) = 0`, `0 <= 0` early return, zero slots for every date regardless of DB state.

**Fix applied:** Added `mapAvailabilityRule` transform in `useVportPublicBooking.js` lines 106-112, matching the pattern in `useVportResourceAvailability.js:16`.

---

## Security Findings

### V-01 — Client-controlled time slot (no server-side slot validation)

- **Location:** `vportPublicBooking.controller.js:64`
- **Severity:** HIGH
- **Current behavior:** Only checks `starts_at > now`. No verification that the requested slot falls within any active `vport.availability_rule` for the resource.
- **Risk:** A caller can book 3 AM Sunday on a shop only open Mon–Fri 9–5. Calendar spam possible outside business hours.
- **Recommended mitigation:** After loading the resource, load its availability rules, verify `starts_at` falls within a matching rule window for the correct weekday. Reject if no active rule covers the requested time.
- **Follow-up:** Wolverine (implementation), DB (verify no constraint exists)
- **CISSP Domain:**
  - Primary: Software Development Security
  - Secondary: Identity and Access Management, Security Architecture and Engineering

---

### V-02 — Anonymous booking bypass (requestActorId optional)

- **Location:** `vportPublicBooking.controller.js:58-61`
- **Severity:** HIGH
- **Current behavior:** Actor kind validation is gated on `if (requestActorId)`. If null/omitted, validation is skipped and booking inserts with null customer identity.
- **Risk:** Anonymous booking creates unfilterable spam with no traceable customer. Unintentional guest booking is likely.
- **Recommended mitigation:** Require `requestActorId` to be non-null before proceeding. Add `if (!requestActorId) throw new Error("Sign in to book.")` at the top of the auth block.
- **Follow-up:** Wolverine, DB (check NOT NULL on customer_actor_id)
- **CISSP Domain:**
  - Primary: Identity and Access Management
  - Secondary: Security and Risk Management

---

### V-03 — Client-controlled service_label_snapshot stored to DB

- **Location:** `insertVportBooking.write.dal.js` + controller
- **Severity:** MEDIUM
- **Current behavior:** `service_label_snapshot` is required but fully client-supplied. Not validated against actual `vport.services` records. Any string is accepted.
- **Risk:** Stored arbitrary string displayed in booking history UI. Stored XSS risk if rendered as innerHTML. Content injection in notifications.
- **Recommended mitigation:** If `serviceId` is non-null, look up the label from `vport.services` server-side and use it as the snapshot. If `serviceId` is null, use `"General appointment"`. Never accept display strings from the client.
- **Follow-up:** Wolverine, LOGAN (notification templates)
- **CISSP Domain:**
  - Primary: Software Development Security
  - Secondary: Asset Security

---

### V-04 — manageVportAvailabilityRuleController drops requestActorId — RLS-only write auth

- **Location:** `useVportManageAvailability.js` + `manageVportAvailabilityRuleController`
- **Severity:** HIGH (conditional on RLS state)
- **Current behavior:** `requestActorId` is received by the hook but not forwarded to the controller. Controller has no ownership check. All write authorization is RLS-only.
- **Risk:** If RLS on `vport.availability_rules` is missing or misconfigured (pattern already seen this session for `fuel_price_submissions`), any authenticated user can modify any resource's schedule.
- **Recommended mitigation:** Forward `requestActorId` to the controller. Add: load resource by `resourceId`, verify `resource.owner_actor_id === requestActorId`. Same pattern used in `createVportPublicBookingController` for booking inserts.
- **Follow-up:** DB (verify RLS on vport.availability_rules), Wolverine
- **CISSP Domain:**
  - Primary: Security Architecture and Engineering
  - Secondary: Identity and Access Management, Software Development Security

---

### V-05 — Unverified GRANT state on vport.availability_rules / vport.resources / vport.bookings

- **Location:** `vportAvailabilityRules.read.dal.js`, `vportResource.read.dal.js`
- **Severity:** HIGH
- **Current behavior:** Both tables queried with no confirmed GRANT for `authenticated` role. This session already found `fuel_price_submissions` had valid RLS but missing GRANT — silently returning empty results.
- **Risk:** Missing GRANT would surface as "no hours set" symptom — now that the snake_case transform is fixed, a missing GRANT would produce the same empty-slot symptom and be very hard to distinguish from data absence.
- **Recommended mitigation:** Run immediately in Supabase SQL editor:
  ```sql
  SELECT grantee, table_name, privilege_type
  FROM information_schema.role_table_grants
  WHERE table_schema = 'vport'
    AND table_name IN ('availability_rules', 'resources', 'bookings')
    AND grantee IN ('authenticated', 'anon')
  ORDER BY table_name, grantee;
  ```
  Expected: `authenticated` has SELECT on all three. `anon` may have SELECT on `availability_rules` and `resources` for public booking preview. Create GRANT migration via Carnage if missing.
- **Follow-up:** DB (immediate — run query above), Carnage (migration)
- **CISSP Domain:**
  - Primary: Identity and Access Management
  - Secondary: Security Assessment and Testing

---

### V-06 — No double-booking guard (race condition)

- **Location:** `vportPublicBooking.controller.js` — no existence check before INSERT
- **Severity:** MEDIUM
- **Current behavior:** No check for existing confirmed bookings in the same window. Two concurrent requests for the same slot both succeed at the controller level.
- **Risk:** Two customers booked into the same appointment slot with the same barber.
- **Recommended mitigation:** Add a DB-level unique constraint:
  ```sql
  CREATE UNIQUE INDEX bookings_resource_slot_unique
    ON vport.bookings (resource_id, starts_at)
    WHERE status NOT IN ('cancelled');
  ```
  The controller catches the unique violation and returns "This slot was just taken. Please choose another time."
- **Follow-up:** Carnage (constraint), Wolverine (error handling)
- **CISSP Domain:**
  - Primary: Software Development Security
  - Secondary: Security Operations

---

### V-07 — Dev console.log in WeeklyAvailabilityGrid (low, DEV-gated)

- **Location:** `WeeklyAvailabilityGrid.jsx:80`
- **Severity:** LOW
- **Current behavior:** `if (import.meta.env.DEV) console.log(...)` — correctly gated.
- **Risk:** None in production. Acceptable pattern.
- **CISSP Domain:**
  - Primary: Security Operations

---

## CISSP Domain Coverage Summary

| CISSP Domain                          | Findings | Notes                                        |
|---------------------------------------|----------|----------------------------------------------|
| Security and Risk Management          | 1        | V-02 (anonymous booking bypass)              |
| Asset Security                        | 1        | V-03 (client label stored in DB)             |
| Security Architecture and Engineering | 2        | V-04 (RLS-only auth), V-06 (no DB mutex)     |
| Communication and Network Security    | 0        | Out of scope — all access via PostgREST/TLS  |
| Identity and Access Management        | 4        | V-01, V-02, V-04, V-05                       |
| Security Assessment and Testing       | 1        | V-05 (unverified GRANT state)                |
| Security Operations                   | 1        | V-07 (dev log, low)                          |
| Software Development Security         | 3        | V-01, V-03, V-06                             |

**Uncovered domains:**
- Communication and Network Security — not applicable; all access is via Supabase PostgREST over TLS with no custom network layer in scope for this review.

---

## Priority Action Order

| Priority | Finding | Action |
|---|---|---|
| **Immediate** | V-05 | Run GRANT verification query in Supabase — same pattern as fuel_price_submissions |
| **High** | V-01 | Add server-side slot validation against availability_rules before INSERT |
| **High** | V-02 | Require requestActorId to be non-null before booking proceeds |
| **High** | V-04 | Forward requestActorId to manageVportAvailabilityRuleController, add ownership check |
| **Medium** | V-03 | Derive service_label_snapshot server-side from vport.services |
| **Medium** | V-06 | Add unique DB constraint on (resource_id, starts_at) WHERE status != cancelled |
| **Low** | V-07 | No action needed |
