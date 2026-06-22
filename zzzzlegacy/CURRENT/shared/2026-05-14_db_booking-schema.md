# DB Review — Booking Schema and Data Access Analysis

**Date:** 2026-05-14  
**Reviewer:** DB  
**Trigger:** Cerebro audit of `vcsm.dal.booking.md` — verify RLS on `bookings`, verify `actor_owners.user_id ↔ actors.profile_id` sync invariant, verify column parity between feature and engine actor DALs, review PII overfetch, review `upsertVportAvailabilityRuleDAL` UPDATE path  
**Application Scope:** VCSM + ENGINE  
**Mode:** READ-ONLY ANALYSIS ONLY — no schema modifications applied

---

## Client Architecture Context

Before schema review, the Supabase client chain must be understood:

| Client Alias | Source | Key Type | RLS Active? |
|---|---|---|---|
| `supabase` | `supabaseClient.js` | ANON key + user JWT session | YES |
| `vport` / `vportClient` | `vportClient.js` (= `supabase.schema('vport')`) | Same as `supabase` — schema alias only | YES |
| Engine `getSupabaseClient()` | Injected via `configureBookingEngine()` — same `supabase` client | ANON key + user JWT session | YES |

**Critical conclusion:** All booking reads and writes go through the auth client with the user's active JWT. RLS IS active for all these paths. Security of booking operations depends on the correctness of RLS policies on `bookings` and `availability_rules` tables.

---

## DATABASE REVIEW ITEM — DB-BOOK-01

**Object:** `vport.bookings` — SELECT policy (RLS)  
**Application Scope:** VCSM + ENGINE  

**Current behavior:**  
The engine `listBookingHistory` controller reads `bookings` filtered only by `resource_id`:
```js
// engines/booking/src/dal/booking.read.dal.js (dalListBookingsByResource)
.from('bookings')
.select(...)
.eq('resource_id', resourceId)
.order('starts_at', { ascending: false })
```
No app-layer ownership check. The dashboard path (`listVportBookingHistoryDAL`) has the same pattern:
```js
.from("bookings")
.select(SELECT_COLS)
.eq("resource_id", resourceId)
.order("starts_at", { ascending: false })
```
Dashboard controller protects this via `assertActorOwnsVportActorController`. Engine controller does not.

**Problem:**  
If the `bookings` SELECT RLS policy is permissive (e.g., allows any authenticated user to read any booking), then the engine `listBookingHistory` path is fully unprotected. Any authenticated actor who knows a `resourceId` can enumerate all bookings for that resource.

**Why it matters:**  
`bookings` contains `customer_name`, `customer_note`, `starts_at`, `ends_at`, `service_label_snapshot`. Even without PII fields, booking patterns reveal customer behavior and VPORT business volume.

**Recommended improvement:**  
Verify the SELECT policy on `vport.bookings`. The minimum safe policy should restrict reads to:
1. The booking's `customer_actor_id` (customer reads their own bookings)
2. The resource's `owner_actor_id` (VPORT owner reads bookings for their resources)

**Rationale:**  
RLS must be the defense-in-depth layer when app-layer ownership checks are missing. Without RLS enforcing this, the engine `listBookingHistory` gap (V-BOOK-01) is fully exploitable.

**Risk if unchanged:**  
Any authenticated Citizen can read all bookings for any VPORT resource by supplying a known `resourceId`. Booking volume, customer names, notes, and schedules are exposed.

**Example SQL proposal (text only — do not run):**
```sql
-- Proposal: restrict bookings SELECT to parties involved
CREATE POLICY "bookings_select_party_only"
  ON vport.bookings
  FOR SELECT
  USING (
    -- Customer can see their own bookings
    customer_actor_id = (
      SELECT id FROM vc.actors
      WHERE profile_id = auth.uid()
      AND kind = 'user'
      LIMIT 1
    )
    OR
    -- Resource owner can see bookings for their resources
    resource_id IN (
      SELECT r.id FROM vport.resources r
      WHERE r.owner_actor_id IN (
        SELECT ao.actor_id FROM vc.actor_owners ao
        WHERE ao.user_id = auth.uid()
        AND ao.is_void = false
      )
    )
    OR
    -- Staff/member assigned to resource can see its bookings
    resource_id IN (
      SELECT r.id FROM vport.resources r
      WHERE r.member_actor_id IN (
        SELECT id FROM vc.actors
        WHERE profile_id = auth.uid()
        AND kind = 'user'
        LIMIT 1
      )
    )
  );
```
**This is a proposal only. Verify existing policy before creating. Delegate to Carnage for migration.**

---

## DATABASE REVIEW ITEM — DB-BOOK-02

**Object:** `vport.availability_rules` — UPDATE path in `upsertVportAvailabilityRuleDAL`  
**Application Scope:** VCSM  

**Current behavior:**  
When `ruleId` is provided, `upsertVportAvailabilityRuleDAL` runs:
```js
await vportSchema
  .from("availability_rules")
  .update({ rule_type, weekday, start_time, end_time, is_active })
  .eq("id", ruleId)          // ← ONLY filter is ruleId
  .select(SELECT_COLS)
  .single();
```
There is no `resource_id` filter. There is no `owner_actor_id` filter. Any caller with a valid `ruleId` UUID can update any availability rule for any resource, provided RLS allows it.

The controller calling this (`manageVportAvailabilityRuleController`) has no ownership assertion either — confirmed by Loki (L-BOOK-01). The only gate is the UI `isOwner` string check in `VportDashboardCalendarScreen`.

**Problem:**  
The UPDATE is a single-filter operation on a primary key only. If RLS on `availability_rules` allows any authenticated user to update any row, this is exploitable: any actor who can obtain a valid `ruleId` (which appears in the availability management UI response) can overwrite another VPORT's availability rules.

**Why it matters:**  
Availability rules determine when a VPORT accepts bookings. Corrupting another VPORT's rules could block all their bookings by setting `is_active: false` on all rules, or create false availability windows that cause booking conflicts.

**Recommended improvement:**  
1. Add `resource_id` filter to the UPDATE path to constrain scope:
   ```js
   .eq("id", ruleId)
   .eq("resource_id", resourceId)  // add this
   ```
2. Verify RLS policy on `availability_rules` enforces that only the resource owner can UPDATE.
3. Add ownership assertion in `manageVportAvailabilityRuleController` before the DAL call.

**Rationale:**  
A write that only filters by primary key is only safe when the caller's authority has been verified at another layer. Currently no layer verifies it for this path.

**Risk if unchanged:**  
Any authenticated Citizen who discovers a valid `ruleId` can modify availability rules for any VPORT resource, disrupting their booking schedule.

**Example SQL proposal (text only — do not run):**
```sql
-- Proposal: RLS policy ensuring availability_rules updates are resource-owner only
CREATE POLICY "availability_rules_update_owner_only"
  ON vport.availability_rules
  FOR UPDATE
  USING (
    resource_id IN (
      SELECT r.id FROM vport.resources r
      WHERE r.owner_actor_id IN (
        SELECT ao.actor_id FROM vc.actor_owners ao
        WHERE ao.user_id = auth.uid()
        AND ao.is_void = false
      )
    )
  )
  WITH CHECK (
    resource_id IN (
      SELECT r.id FROM vport.resources r
      WHERE r.owner_actor_id IN (
        SELECT ao.actor_id FROM vc.actor_owners ao
        WHERE ao.user_id = auth.uid()
        AND ao.is_void = false
      )
    )
  );
```
**This is a proposal only. Delegate to Carnage for migration.**

---

## DATABASE REVIEW ITEM — DB-BOOK-03

**Object:** `vc.actors` — Column parity between feature DAL and engine DAL (RISK-3 / RISK-2 verification)  
**Application Scope:** VCSM + ENGINE  

**Current behavior:**

Feature `getActorById.dal.js` selects:
```
id, kind, profile_id, vport_id, is_void
```

Engine `actor.read.dal.js` (`dalGetActorById`) selects:
```
id, kind, profile_id, vport_id, is_void
```

**Finding: IDENTICAL — RISK-3 confirmed exact duplicate.**

Both use the same 5 columns. Both use the auth client (supabase). Both hit `vc.actors`. The only difference is the function name and whether they use `supabase` directly or via `getSupabaseClient()`.

**Problem:**  
Two identical actor read functions coexist. If columns are ever added to one but not the other, the `assertActorOwnsVportActor` ownership assertion will silently use stale data in whichever version is called.

**Engine `assertActorOwnsVportActor`** calls `dalGetActorById` (engine).  
**Feature `assertActorOwnsVportActorController`** calls `getActorByIdDAL` (feature).  
Both callers use the same logic but different implementations.

**Recommended improvement:**  
Once the engine migration is complete, remove `features/booking/dal/getActorById.dal.js` and update `assertActorOwnsVportActorController` (feature) to use the engine's `dalGetActorById` or route entirely through the engine controller.

**Risk if unchanged:**  
Silent schema drift between two identical DAL functions. Low immediate risk; high long-term maintenance risk.

**Example SQL proposal:** N/A — this is an app-layer code consolidation, not a schema change.

---

## DATABASE REVIEW ITEM — DB-BOOK-04

**Object:** `vc.actors.profile_id ↔ vc.actor_owners.user_id` sync invariant (V-BOOK-06 verification)  
**Application Scope:** VCSM  

**Current behavior:**  
`assertActorOwnsVportActorController` resolves ownership by:
1. Reading `vc.actors` by `requestActorId` → gets `profile_id`
2. Using `profile_id` as `user_id` in `vc.actor_owners WHERE actor_id = targetActorId AND user_id = profile_id`

This works only if `vc.actors.profile_id` always equals the `user_id` value stored in `vc.actor_owners`. The `actor_owners` table uses `user_id` (which appears to be the Supabase auth `user.id` / profile UUID), and `actors.profile_id` stores the same value for user-kind actors.

**Problem:**  
This is an implicit invariant. If any user lifecycle event (e.g., account merge, profile recreation, auth provider change) causes `actors.profile_id` to differ from `actor_owners.user_id`, the ownership check will silently fail for legitimate owners — or worse, silently pass for accounts that should no longer have ownership.

**Why it matters:**  
Ownership assertion is the security backbone of the entire booking system. Cancel, confirm, create-owner, and booking history reads all depend on this passing correctly.

**Recommended improvement:**  
1. Verify there is a foreign key or trigger ensuring `vc.actors.profile_id` = `vc.actor_owners.user_id` for all user-kind actors.
2. If no FK exists, consider adding a DB-level check or a periodic reconciliation job.
3. Verify that `actor_owners.is_void` is set correctly when an owner relationship ends.

**Risk if unchanged:**  
Low probability but high impact. If the invariant breaks, legitimate VPORT owners may be locked out of their booking management, or former owners may retain access.

**Example SQL proposal (text only — do not run):**
```sql
-- Verification query: find actors where profile_id is NOT in actor_owners for their owned vports
-- (Run read-only to validate the invariant)
SELECT
  a.id AS actor_id,
  a.profile_id,
  ao.actor_id AS owned_vport_actor_id,
  ao.user_id AS owner_user_id
FROM vc.actors a
JOIN vc.actor_owners ao ON ao.actor_id = a.id
WHERE a.kind = 'vport'
  AND ao.is_void = false
  AND ao.user_id NOT IN (
    SELECT profile_id FROM vc.actors
    WHERE kind = 'user' AND profile_id IS NOT NULL
  )
LIMIT 20;
-- This query is analysis-only. Do not run as a migration.
```

---

## DATABASE REVIEW ITEM — DB-BOOK-05

**Object:** `vport.bookings` — PII field overfetch in `updateBookingStatusDAL`  
**Application Scope:** VCSM  

**Current behavior:**  
`updateBookingStatusDAL` SELECT after UPDATE includes:
```
customer_phone, customer_email, customer_profile_id, internal_note
```
These are returned to every caller: `cancelBookingController`, `confirmBookingController`. The mapped result propagates up to hooks and potentially into React state and notification context.

**Problem:**  
PII fields (phone, email) and internal operational notes are fetched on every booking status mutation — cancel or confirm. These fields are not needed for the status mutation result.

**Recommended improvement:**  
Split the return projection: status mutations should return only the fields needed to confirm the write succeeded and to build the notification:

```
id, resource_id, customer_actor_id, status, service_label_snapshot, starts_at, ends_at, created_by_actor_id, updated_at
```

Remove: `customer_phone`, `customer_email`, `customer_profile_id`, `internal_note` from the default status-update return.

**Rationale:**  
Data minimization — return only what the operation result requires. PII should only be fetched by flows that explicitly need it (e.g., owner viewing a specific booking detail).

**Risk if unchanged:**  
PII in client state is available to any code that accesses the booking result. Future logging, error reporting, or serialization could inadvertently expose phone/email.

**Example SQL proposal:** N/A — this is a DAL `select()` projection change, not a schema change.

---

## DATABASE REVIEW ITEM — DB-BOOK-06

**Object:** `vport.bookings` + `vport.resources` JOIN — `member_actor_id` in customer read  
**Application Scope:** VCSM  

**Current behavior:**  
`listBookingsByCustomerDAL` joins:
```js
"resources!resource_id(owner_actor_id,member_actor_id,name)"
```
`member_actor_id` is returned to the customer-facing my-bookings view.

**Problem:**  
`member_actor_id` is the staff/team member assigned to the resource. Customers have no legitimate need for this internal identity. It exposes internal actor IDs that can be used to correlate staff across the platform.

**Recommended improvement:**  
Remove `member_actor_id` from the join clause. Change to:
```js
"resources!resource_id(owner_actor_id,name)"
```

**Risk if unchanged:**  
Staff actor IDs are enumerable by any customer with a booking.

---

## SUMMARY TABLE

| Item | Object | Severity | Finding | Action Required |
|---|---|---|---|---|
| DB-BOOK-01 | `vport.bookings` SELECT RLS | CRITICAL | Unknown — must be verified | Verify policy; propose Carnage migration if missing |
| DB-BOOK-02 | `vport.availability_rules` UPDATE safety | HIGH | UPDATE by ruleId only — no owner filter | Add `resource_id` filter; verify/add RLS UPDATE policy |
| DB-BOOK-03 | `vc.actors` duplicate read DAL | MEDIUM | Feature + engine implementations identical | Remove feature copy post-migration |
| DB-BOOK-04 | `profile_id ↔ user_id` sync invariant | MEDIUM | No verified FK or trigger enforcement | Run verification query; add constraint if missing |
| DB-BOOK-05 | `vport.bookings` PII overfetch | MEDIUM | customer_phone/email/internal_note returned on every status mutation | Slim select projection in updateBookingStatusDAL |
| DB-BOOK-06 | `vport.resources` member_actor_id exposure | MEDIUM | Staff actor ID returned to customer-facing read | Remove from join clause |

---

## FOLLOW-UP COMMAND RECOMMENDATIONS

| Finding | Recommended Command | Reason |
|---|---|---|
| DB-BOOK-01 — bookings SELECT RLS unknown | Carnage | If RLS is missing or insufficient, migration required |
| DB-BOOK-02 — availability_rules UPDATE safety | Carnage | RLS policy + DAL filter change required |
| DB-BOOK-04 — profile_id invariant | Carnage | Consider FK or trigger if invariant not enforced |
| DB-BOOK-03 — duplicate actor DAL | Wolverine | App-layer consolidation — delete feature copy |
| DB-BOOK-05 — PII overfetch | Wolverine | DAL projection change |
| DB-BOOK-06 — member_actor_id | Wolverine | DAL join clause change |
