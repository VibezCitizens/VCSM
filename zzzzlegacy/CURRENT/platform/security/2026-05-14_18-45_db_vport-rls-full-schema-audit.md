# DB AUDIT REPORT — vport Schema RLS Full Policy Dump

**Date:** 2026-05-14  
**Time:** 18:45  
**Reviewer:** DB  
**Trigger:** Cerebro governance audit — continuation of Carnage migration plan `2026-05-14_carnage_bookings-insert-owner-legacy-auth.md` (branch: `vport-booking-feed-security-updates`)  
**Application Scope:** VCSM  
**Mode:** READ-ONLY ANALYSIS — no modifications applied  
**Prior audit reference:** `2026-05-14_db_booking-schema.md` (DB-BOOK-01 through DB-BOOK-06)

---

## Section 1 — Policy Pattern Classification

This section classifies every table in the provided dump by its RLS pattern health.

| Table | Classification | Reason |
|---|---|---|
| `availability_exceptions` | OVERLAPPING | Both legacy profile-based (`actor_can_manage_profile(current_actor_id(), r.profile_id)`) and neutral resource-based (`current_actor_can_manage_resource(resource_id)`) policies coexist for the same operation. Neither is legacy-auth, but both cover the same access path. |
| `availability_rules` | OVERLAPPING | Same dual-policy pattern as `availability_exceptions`. Additionally, the SELECT neutral policy has an extra clause `(is_active = true)` that the non-neutral SELECT policy does not, creating inconsistent read access semantics depending on which policy satisfies the check. |
| `barber_portfolio_details` | CLEAN | All four operations (SELECT, INSERT, UPDATE, DELETE) use `actor_can_manage_profile(current_actor_id(), pi.profile_id)` consistently. Public read is gated by `pi.is_deleted = false`. No legacy pattern. No duplicates. |
| `bookings` | LEGACY + BUG | `bookings_insert_owner` uses `profiles.owner_user_id = auth.uid()` — confirmed legacy pattern. `bookings_insert_public_pending` contains a tautology (`r.profile_id = r.profile_id`). All SELECT and UPDATE policies are canonical. |
| `business_card_leads` | CLEAN | INSERT policies (anon + authenticated) have consistent length/null guards. Owner SELECT, UPDATE, DELETE all use the `actor_owners JOIN` chain correctly. No duplicates, no legacy. |
| `content_pages` | DUPLICATE | Has both a full set of legacy policies (`profiles.owner_user_id = auth.uid()`) AND a full set of modern policies (`actor_can_manage_profile`). Both sets are live simultaneously for SELECT, INSERT, UPDATE, DELETE. Also has two overlapping public SELECT policies. This is the most severe structural violation in the dump. |
| `fuel_prices` | CLEAN | All policies use `actor_can_manage_profile`. No duplicates. |
| `fuel_price_history` | CLEAN | All policies use `actor_can_manage_profile`. No duplicates. |
| `fuel_price_submissions` | OVERLAPPING | Two INSERT paths coexist: `citizen_insert_fuel_price_submission` (actor_owners JOIN) and `fuel_price_submissions_insert_own` (`current_actor_id()`). These cover the same insert operation through two different ownership resolution chains. |
| `locksmith_portfolio_details` | OVERLAPPING | Has both named `locksmith_portfolio_details_*` policies (actor_can_manage_profile) and an `owner_all` ALL policy (actor_owners JOIN). Redundant write paths. |
| `locksmith_service_areas` | OVERLAPPING | Has both named `locksmith_service_areas_*` policies (actor_owners chain) and an `owner_all` ALL policy (actor_owners JOIN). Redundant write paths. Different ownership resolution function is not necessarily identical behavior — requires verification. |
| `locksmith_service_details` | CLEAN | Uses `actor_can_manage_profile` consistently. No duplicates. |
| `menu_categories` | CLEAN | Uses `actor_can_manage_profile` consistently. |
| `menu_items` | CLEAN | Uses `actor_can_manage_profile` consistently. |
| `menu_item_media` | CLEAN | Uses `actor_can_manage_profile` consistently. |
| `organization_members` | CLEAN | Uses `current_actor_can_manage_organization` / `current_actor_can_manage_location` consistently. |
| `organization_profiles` | CLEAN | Uses `current_actor_can_manage_organization` / `current_actor_can_manage_location` consistently. |
| `organizations` | CLEAN | Uses `current_actor_can_manage_organization` / `current_actor_can_manage_location` consistently. |
| `categories` | CLEAN | Read-only public table. No write policies needed. |
| `cities` | CLEAN | Read-only public table. |
| `fuel_types` | CLEAN | Read-only public table. |
| `fuel_type_localizations` | CLEAN | Read-only public table. |

---

## Section 2 — Per-Finding Database Review Items (Severity Order)

---

### DB-RLS-01 — CRITICAL

**Object:** `vport.content_pages` — DUPLICATE policies, legacy AND modern both live  
**Classification:** DUPLICATE  

**Finding:**  
`content_pages` has eight owner-access policies simultaneously live: four using `profiles.owner_user_id = auth.uid()` (legacy) and four using `actor_can_manage_profile(current_actor_id(), profile_id)` (modern), covering SELECT, INSERT, UPDATE, and DELETE. Because PostgreSQL RLS evaluates all policies with `PERMISSIVE` mode using OR logic, both sets are active. A caller satisfying either condition passes.

This means the legacy ownership gate (`profiles.owner_user_id = auth.uid()`) is not merely redundant — it is an active security surface. Any user whose `auth.uid()` matches a `profiles.owner_user_id` row passes INSERT, UPDATE, and DELETE on `content_pages`, regardless of whether the canonical actor_owners chain confirms them as the current owner. If VPORT ownership was ever transferred via the actor_owners chain but `profiles.owner_user_id` was not updated, the former owner retains full write access to content pages through the legacy policy.

Additionally, there are two SELECT policies for public read:
- `content_pages_public_read` (anon + authenticated): `is_published = true AND is_indexable = true`
- `content_pages_select_public` (authenticated): `is_published = true AND EXISTS(profiles where is_active=true AND is_deleted=false)`

These differ in their conditions. The second public SELECT does not require `is_indexable = true`, meaning authenticated users can read published-but-non-indexable content pages. Whether this is intentional is unclear from the dump.

**Severity: CRITICAL**  
The legacy INSERT, UPDATE, and DELETE policies create a stale-ownership attack surface for any VPORT whose owner changed after `profiles.owner_user_id` was last written. This is not a theoretical risk — VPORT transfers are a supported operation.

**Proposed action (text only):**  
1. Drop the four legacy owner policies: `content_pages_owner_delete`, `content_pages_owner_insert`, `content_pages_owner_read`, `content_pages_owner_update`.  
2. Retain the four modern policies: `content_pages_delete_owner`, `content_pages_insert_owner`, `content_pages_select_owner`, `content_pages_update_owner`.  
3. Evaluate whether `content_pages_select_public` (authenticated) should also require `is_indexable = true` to match `content_pages_public_read`. If intentional, document the reason.  
4. Delegate to Carnage for migration. Pre-flight: verify no active VPORT owner would lose access through the modern policy chain before dropping legacy policies.

---

### DB-RLS-02 — HIGH

**Object:** `vport.bookings` — `bookings_insert_owner` confirmed legacy  
**Classification:** LEGACY  

**Finding:**  
The full policy dump confirms the exact SQL for `bookings_insert_owner` as documented in the Carnage plan:

```
(auth.uid() IS NOT NULL)
AND (source = ANY (ARRAY['owner','admin','import','sync']))
AND (EXISTS (
  SELECT 1 FROM vport.profiles p
  WHERE p.id = bookings.profile_id
    AND p.owner_user_id = auth.uid()    -- legacy: raw auth UID
    AND p.is_active = true
    AND p.is_deleted = false
))
```

This is a direct `profiles.owner_user_id = auth.uid()` join — confirmed legacy pattern. All other booking policies on this table are canonical actor-based.

**This finding fully confirms the Carnage migration plan.** See Section 4 for the confirmation statement.

**Severity: HIGH**  
The policy is functional but architecturally misaligned. The stale-ownership risk (VPORT transfer without `profiles.owner_user_id` update) applies here exactly as in DB-RLS-01. The risk window is narrower because this is INSERT-only (not DELETE/UPDATE), but a former owner retaining INSERT access to `bookings` with a management source is a meaningful exposure.

**Proposed action (text only):**  
Execute the Carnage migration plan as written: DROP `bookings_insert_owner` and CREATE a replacement using `vport.current_actor_can_manage_resource(resource_id)`. Complete all pre-flight verification queries before apply.

---

### DB-RLS-03 — HIGH

**Object:** `vport.bookings` — `bookings_insert_public_pending` contains a SQL tautology  
**Classification:** BUG  

**Finding:**  
The `bookings_insert_public_pending` policy contains the following condition in its resource validation subquery:

```sql
AND (r.profile_id = r.profile_id)
```

This is a column compared to itself. It is always true. The intended condition is almost certainly:

```sql
AND (r.profile_id = bookings.profile_id)
```

This should validate that the resource being booked belongs to the same VPORT profile as the `profile_id` column being inserted into the `bookings` row — ensuring a customer cannot insert a booking where the `resource_id` belongs to VPORT A but the `profile_id` references VPORT B.

**Current effect of the tautology:**  
The profile/resource cross-check is silently absent. A malicious or misconfigured client could insert a public pending booking with a `profile_id` that does not match the `resource_id`'s actual profile. The booking would pass RLS. The data integrity constraint between `bookings.profile_id` and `bookings.resource_id` would then depend entirely on application-layer enforcement, with no DB-level fallback.

**Severity: HIGH**  
This is a logic error in an active INSERT policy for the public booking path. It silently removes a data integrity gate. The fix is a single column reference correction in the WITH CHECK clause.

**Proposed action (text only):**  
In `bookings_insert_public_pending`, change `r.profile_id = r.profile_id` to `r.profile_id = bookings.profile_id`. This requires a DROP and recreate of the policy since PostgreSQL RLS policies cannot be altered in place. Delegate to Carnage. This fix should be bundled with the `bookings_insert_owner` migration in the same transaction if possible — both touch `vport.bookings` INSERT policies.

---

### DB-RLS-04 — MEDIUM

**Object:** `vport.availability_exceptions` — overlapping dual policies  
**Classification:** OVERLAPPING  

**Finding:**  
`availability_exceptions` has two parallel policy sets for manage (write) and view (read):

**Manage path:**
- `availability_exceptions_delete` / `_insert` / `_update` — use `actor_can_manage_profile(current_actor_id(), r.profile_id)` via a JOIN to `resources r`
- `availability_exceptions_manage_neutral` (ALL) — uses `current_actor_can_manage_resource(resource_id)`

**View path:**
- `availability_exceptions_select` — uses `actor_can_view_profile(current_actor_id(), r.profile_id)` via JOIN
- `availability_exceptions_select_neutral` — uses `current_actor_can_view_resource(resource_id)`

Both policy sets cover the same operations. In PERMISSIVE mode, both are evaluated with OR logic, meaning a caller passing either check succeeds. The practical effect: if `actor_can_manage_profile` and `current_actor_can_manage_resource` ever diverge in their evaluation for the same actor and resource (e.g., a staff actor who manages the resource but is not a profile-level manager), the PERMISSIVE OR means the more permissive of the two wins silently.

**Severity: MEDIUM**  
No active security hole — both chains ultimately validate ownership. However, the redundancy creates maintenance risk: if one policy is tightened or dropped without the other, the effective enforcement changes without an obvious audit trail.

**Proposed action (text only):**  
Determine the canonical ownership resolution function for `availability_exceptions`. Given that `availability_rules` on the same table uses `current_actor_can_manage_resource(resource_id)` as its primary `_manage_neutral` policy, the resource-neutral form is the more precise gate. Propose dropping the profile-JOIN variants (`_delete`, `_insert`, `_update`, `_select`) and retaining the neutral forms (`_manage_neutral`, `_select_neutral`). Delegate to Carnage.

---

### DB-RLS-05 — MEDIUM

**Object:** `vport.availability_rules` — overlapping dual policies + inconsistent SELECT semantics  
**Classification:** OVERLAPPING  

**Finding:**  
`availability_rules` has the same dual-policy structure as `availability_exceptions` (DB-RLS-04). In addition, the neutral SELECT policy has an extra permissive clause not present in the profile-JOIN SELECT:

- `availability_rules_select` (via profile JOIN): allows read if `actor_can_view_profile(current_actor_id(), r.profile_id)`
- `availability_rules_select_neutral`: allows read if `(is_active = true) OR current_actor_can_view_resource(resource_id)`

The `is_active = true` branch of `availability_rules_select_neutral` allows **any authenticated actor** to read any active availability rule for any resource, without any ownership or relationship check. This appears to be intentional to support public scheduling lookups (e.g., showing available time slots to a potential customer), but it is a significant broadening of read access that is not matched by the profile-JOIN SELECT policy.

**Severity: MEDIUM**  
The `is_active = true` clause is probably intentional design — a customer browsing a VPORT's booking page needs to read available time slots. However, the dual-policy structure means this open read path is provided twice, and if the `_select_neutral` policy is ever dropped (during a cleanup of overlapping policies), the public scheduling read breaks without warning.

**Proposed action (text only):**  
1. Confirm that `(is_active = true)` in `availability_rules_select_neutral` is intentional public-read behavior. If yes, document it explicitly.  
2. Once confirmed, drop the profile-JOIN variants (`_delete`, `_insert`, `_update`, `_select`) and retain the neutral forms. The neutral SELECT correctly handles both the public read (is_active) and the owner read (current_actor_can_view_resource) cases.  
3. Delegate to Carnage. Group this with the `availability_exceptions` cleanup in DB-RLS-04.

---

### DB-RLS-06 — MEDIUM

**Object:** `vport.fuel_price_submissions` — redundant INSERT policies  
**Classification:** OVERLAPPING  

**Finding:**  
Two INSERT policies coexist for the same table:
- `citizen_insert_fuel_price_submission` — uses `actor_owners` JOIN chain to validate ownership
- `fuel_price_submissions_insert_own` — uses `current_actor_id()` to identify the inserting actor

These resolve ownership through different paths. In PERMISSIVE mode, a caller passing either is allowed to insert. The `current_actor_id()` form is generally the simpler and more consistent form for actor-scoped inserts; the `actor_owners` JOIN form is more specific about the ownership relationship. Whether they produce identical authorization decisions for all valid callers has not been verified from this dump.

**Severity: MEDIUM**  
Redundant insert policies are a maintenance and audit hazard. If one is ever modified independently, the effective INSERT gate changes unexpectedly.

**Proposed action (text only):**  
Determine which INSERT policy is canonical for fuel price submissions. If the actor is submitting their own fuel price observation (not managing a VPORT-owned submission), `fuel_price_submissions_insert_own` (`current_actor_id()`) is the correct form. Drop the `citizen_insert_fuel_price_submission` redundant policy. Delegate to Carnage.

---

### DB-RLS-07 — MEDIUM

**Object:** `vport.locksmith_portfolio_details` — overlapping ALL + named policies  
**Classification:** OVERLAPPING  

**Finding:**  
Both a specific named set of policies (`locksmith_portfolio_details_*` using `actor_can_manage_profile`) and a catch-all `owner_all` ALL policy (using `actor_owners` JOIN) are live simultaneously. The ALL policy covers every command (SELECT, INSERT, UPDATE, DELETE) via a single rule while the named policies cover them individually. In PERMISSIVE mode, both apply.

**Severity: MEDIUM**  
Same maintenance hazard as DB-RLS-06. The `owner_all` ALL policy was likely a historical catch-all that was not removed when the named policies were added (or vice versa).

**Proposed action (text only):**  
Retain the named `locksmith_portfolio_details_*` policies as they use the canonical `actor_can_manage_profile` pattern. Drop the `owner_all` ALL policy. Delegate to Carnage.

---

### DB-RLS-08 — MEDIUM

**Object:** `vport.locksmith_service_areas` — overlapping ALL + named policies with different ownership chains  
**Classification:** OVERLAPPING  

**Finding:**  
`locksmith_service_areas` has the same dual-policy structure as `locksmith_portfolio_details` (DB-RLS-07). However, unlike `locksmith_portfolio_details` where both policies use compatible ownership functions, the named `locksmith_service_areas_*` policies use `actor_owners` chain directly, while the `owner_all` policy uses an `actor_owners JOIN` variant. Whether these are functionally equivalent requires verification of the exact WHERE clause conditions in both.

**Severity: MEDIUM**  
Same hazard as DB-RLS-07.

**Proposed action (text only):**  
Verify that `locksmith_service_areas_*` policies cover all operations correctly. If they do, drop `owner_all`. If they do not cover all operations, fill the gaps with named policies and then drop `owner_all`. Delegate to Carnage.

---

## Section 3 — Overall Schema Health Summary

| Table | Pattern | Status | Severity | Migration Required |
|---|---|---|---|---|
| `availability_exceptions` | Dual: profile-JOIN + resource-neutral | OVERLAPPING | MEDIUM | Yes — drop profile-JOIN variants |
| `availability_rules` | Dual: profile-JOIN + resource-neutral; neutral SELECT has public `is_active` branch | OVERLAPPING | MEDIUM | Yes — drop profile-JOIN variants; confirm public read intent |
| `barber_portfolio_details` | `actor_can_manage_profile` consistently | CLEAN | — | No |
| `bookings` | Most policies canonical; `bookings_insert_owner` is LEGACY; `bookings_insert_public_pending` has tautology BUG | LEGACY + BUG | HIGH (both) | Yes — Carnage plan confirmed; add tautology fix |
| `business_card_leads` | `actor_owners` chain; consistent anon+auth INSERT guards | CLEAN | — | No |
| `categories` | Read-only public | CLEAN | — | No |
| `cities` | Read-only public | CLEAN | — | No |
| `content_pages` | Both legacy (`owner_user_id`) and modern (`actor_can_manage_profile`) policies live simultaneously; two public SELECT policies with differing conditions | DUPLICATE | CRITICAL | Yes — drop all four legacy policies; audit public SELECT divergence |
| `fuel_price_history` | `actor_can_manage_profile` consistently | CLEAN | — | No |
| `fuel_price_submissions` | Two overlapping INSERT paths | OVERLAPPING | MEDIUM | Yes — drop redundant INSERT policy |
| `fuel_prices` | `actor_can_manage_profile` consistently | CLEAN | — | No |
| `fuel_type_localizations` | Read-only public | CLEAN | — | No |
| `fuel_types` | Read-only public | CLEAN | — | No |
| `locksmith_portfolio_details` | Named policies + `owner_all` ALL policy coexist | OVERLAPPING | MEDIUM | Yes — drop `owner_all` |
| `locksmith_service_areas` | Named policies + `owner_all` ALL policy; different ownership chains | OVERLAPPING | MEDIUM | Yes — verify named coverage, drop `owner_all` |
| `locksmith_service_details` | `actor_can_manage_profile` consistently | CLEAN | — | No |
| `menu_categories` | `actor_can_manage_profile` consistently | CLEAN | — | No |
| `menu_item_media` | `actor_can_manage_profile` consistently | CLEAN | — | No |
| `menu_items` | `actor_can_manage_profile` consistently | CLEAN | — | No |
| `organization_members` | `current_actor_can_manage_organization` / `current_actor_can_manage_location` | CLEAN | — | No |
| `organization_profiles` | `current_actor_can_manage_organization` / `current_actor_can_manage_location` | CLEAN | — | No |
| `organizations` | `current_actor_can_manage_organization` / `current_actor_can_manage_location` | CLEAN | — | No |

**Schema health summary:**

- CLEAN tables: 15 of 22 (68%)
- Requires migration: 7 of 22 (32%)
- CRITICAL findings: 1 (`content_pages`)
- HIGH findings: 2 (`bookings` — legacy INSERT, tautology BUG)
- MEDIUM findings: 5 (availability overlap, locksmith overlap, fuel submissions overlap)

---

## Section 4 — Confirmation of Carnage Migration Plan

**Migration plan:** `2026-05-14_carnage_bookings-insert-owner-legacy-auth.md`  
**Status: CONFIRMED CORRECT — no amendments required**

The full policy dump confirms every factual claim in the Carnage plan:

| Carnage Claim | Confirmation |
|---|---|
| `bookings_insert_owner` uses `profiles.owner_user_id = auth.uid()` | CONFIRMED — exact SQL verified in dump |
| All other booking policies use canonical actor-based helpers | CONFIRMED — `bookings_insert_public_pending`, `bookings_select_customer`, `bookings_select_vport_owner`, `bookings_select_resource_neutral`, `bookings_update_customer`, `bookings_update_vport_owner`, `bookings_update_resource_neutral` all use `current_actor_id()` or `actor_can_manage_profile` or `current_actor_can_manage_resource` |
| `bookings_select_resource_neutral` uses `current_actor_can_manage_resource(resource_id)` | CONFIRMED — dump shows `current_actor_can_manage_resource(resource_id) OR customer_actor_id = current_actor_id() OR created_by_actor_id = current_actor_id()` |
| `availability_rules_manage_neutral` uses `current_actor_can_manage_resource(resource_id)` | CONFIRMED — dump shows `current_actor_can_manage_resource(resource_id)` as the sole condition |
| Proposed replacement `current_actor_can_manage_resource(resource_id)` is consistent with existing policy set | CONFIRMED — the same function is already in production use on two other policies on adjacent tables |

**The Carnage proposed replacement policy is appropriate:**

```
vport.current_actor_can_manage_resource(resource_id)
AND source IN ('owner', 'admin', 'import', 'sync')
```

This produces structural symmetry with `bookings_select_resource_neutral` and `availability_rules_manage_neutral`. A VPORT owner can read bookings for resources they manage (`bookings_select_resource_neutral`) and can write availability rules for resources they manage (`availability_rules_manage_neutral`). The proposed INSERT policy makes create-booking subject to the same gate — a consistent three-way alignment of read, rule-write, and booking-write policies.

**One amendment to note (not a blocker):**  
The `bookings_update_resource_neutral` policy has a broader condition than just `current_actor_can_manage_resource`:

```
current_actor_can_manage_resource(resource_id) OR customer_actor_id = current_actor_id()
```

This means customers can update their own bookings (e.g., cancel). The `bookings_update_customer` policy also covers `customer_actor_id = current_actor_id()` independently. There are two overlapping UPDATE paths for customer self-updates (`bookings_update_customer` + `bookings_update_resource_neutral` customer branch). This is a low-severity overlap — both resolve to the same authorization decision — but it is a minor inconsistency worth noting for future cleanup. It is NOT a blocker for the Carnage migration.

---

## Section 5 — New Findings Not Previously Identified

The prior DB audit (`2026-05-14_db_booking-schema.md`) — items DB-BOOK-01 through DB-BOOK-06 — focused on the booking and availability paths. This full schema dump reveals the following findings that were not previously documented:

### NEW-01 — `content_pages` legacy policies are a stale-ownership attack surface (DB-RLS-01)

Not previously identified. The prior audit did not cover `content_pages`. The live presence of `profiles.owner_user_id = auth.uid()` policies on content pages alongside the modern actor-based policies creates an active security surface for any VPORT whose ownership has transferred without `profiles.owner_user_id` being updated. This is a new CRITICAL finding.

### NEW-02 — `bookings_insert_public_pending` tautology (`r.profile_id = r.profile_id`) (DB-RLS-03)

Not previously identified. The prior DB-BOOK-01 audit noted that the booking SELECT RLS was unknown and recommended verification. This dump provides the full INSERT policy text and reveals a SQL tautology in the public pending INSERT path. The intended cross-check between `resource_id` and `profile_id` is silently absent from the live policy.

### NEW-03 — `availability_exceptions` and `availability_rules` dual-policy overlap (DB-RLS-04, DB-RLS-05)

DB-BOOK-02 in the prior audit identified that `availability_rules` UPDATE was gated only by `ruleId` at the DAL layer. The dump now confirms that the `availability_rules_manage_neutral` policy (`current_actor_can_manage_resource`) provides the correct RLS gate for UPDATE — which means DB-BOOK-02's concern about UPDATE safety is mitigated at the DB layer (RLS is present and correct). However, the dual-policy overlap on both `availability_rules` and `availability_exceptions` is a new MEDIUM finding not previously documented.

**DB-BOOK-02 status update:** The UPDATE safety concern at the DAL layer (no resource_id filter) remains valid at the application layer — the DAL should add a `resource_id` filter. But the DB-layer gate is confirmed present via `availability_rules_manage_neutral`. Severity at the DB level is reduced from unknown to confirmed-present-but-overlapping.

### NEW-04 — `locksmith_portfolio_details` and `locksmith_service_areas` `owner_all` ALL policy overlap (DB-RLS-07, DB-RLS-08)

Not previously identified. These tables were not covered by the prior booking-focused audit. The `owner_all` ALL policies are historical artifacts that should be removed once named policies are confirmed complete.

### NEW-05 — `fuel_price_submissions` redundant INSERT paths (DB-RLS-06)

Not previously identified. Minor but creates maintenance ambiguity.

---

## Section 6 — Prioritized Remediation List (Carnage Migration Order)

Migrations are listed in priority order. All proposals are text only — none are executable as written here.

| Priority | Finding | Table | Type | Description | Blocking? |
|---|---|---|---|---|---|
| 1 | DB-RLS-01 | `content_pages` | DROP 4 legacy policies | Remove `content_pages_owner_delete/insert/read/update`; retain modern set | Yes — stale-ownership attack surface is active now |
| 2 | DB-RLS-02 | `bookings` | DROP + CREATE | Replace `bookings_insert_owner` per existing Carnage plan | Yes — Carnage plan confirms this is the blocking migration for the current branch |
| 3 | DB-RLS-03 | `bookings` | DROP + CREATE | Fix `bookings_insert_public_pending` tautology (`r.profile_id = r.profile_id` → `r.profile_id = bookings.profile_id`) | Yes — bundle with Priority 2 in same transaction |
| 4 | DB-RLS-04 | `availability_exceptions` | DROP profile-JOIN variants | Remove `_delete`, `_insert`, `_update`, `_select` profile-JOIN policies; retain `_manage_neutral`, `_select_neutral` | No — overlap is safe; cleanup only |
| 5 | DB-RLS-05 | `availability_rules` | DROP profile-JOIN variants | Same as availability_exceptions; confirm `is_active = true` public read is intentional before drop | No — confirm intent first |
| 6 | DB-RLS-07 | `locksmith_portfolio_details` | DROP `owner_all` | Remove catch-all ALL policy; named policies cover all operations | No — overlap is safe; cleanup only |
| 7 | DB-RLS-08 | `locksmith_service_areas` | DROP `owner_all` | Verify named policies cover all operations first; then drop | No — verify first |
| 8 | DB-RLS-06 | `fuel_price_submissions` | DROP redundant INSERT | Remove `citizen_insert_fuel_price_submission`; retain `fuel_price_submissions_insert_own` | No — overlap is safe; cleanup only |

**Bundling recommendation:**  
Priorities 2 and 3 must be executed in the same transaction since both touch `vport.bookings` INSERT policies. The transaction must be atomic (BEGIN/COMMIT). See Carnage plan for full transaction safety requirements.

Priority 1 (`content_pages`) should be its own migration, pre-flight verified by confirming all active `content_pages` owners pass the modern `actor_can_manage_profile` check before the legacy policies are dropped.

Priorities 4–8 can be grouped into a single cleanup migration after the critical items are resolved.

---

## Section 7 — Prior Audit Cross-Reference

| Prior Item | Status After This Audit | Notes |
|---|---|---|
| DB-BOOK-01 — bookings SELECT RLS unknown | RESOLVED — SELECT policies confirmed present and canonical | `bookings_select_customer`, `_select_vport_owner`, `_select_resource_neutral` all confirmed in dump |
| DB-BOOK-02 — availability_rules UPDATE safety | PARTIALLY RESOLVED — DB-layer gate confirmed present (`availability_rules_manage_neutral`); DAL-layer filter (`resource_id` missing from UPDATE call) still requires app fix | DB risk reduced; Wolverine action still required |
| DB-BOOK-03 — duplicate actor DAL | UNCHANGED — no DB schema component; app-layer consolidation task | Wolverine action |
| DB-BOOK-04 — profile_id ↔ user_id sync invariant | UNCHANGED — schema verification pending | Pre-flight query provided in Carnage plan |
| DB-BOOK-05 — PII overfetch in updateBookingStatusDAL | UNCHANGED — no DB schema component; DAL projection change | Wolverine action |
| DB-BOOK-06 — member_actor_id in customer read | UNCHANGED — no DB schema component; DAL join change | Wolverine action |

---

## Handoff Summary

| Finding | Action | Command |
|---|---|---|
| DB-RLS-01 — content_pages duplicate policies | Drop 4 legacy policies after pre-flight ownership verification | Carnage |
| DB-RLS-02 — bookings_insert_owner legacy | Apply Carnage plan as written | Carnage (plan already complete) |
| DB-RLS-03 — bookings_insert_public_pending tautology | Bundle tautology fix with Priority 2 migration | Carnage |
| DB-RLS-04 — availability_exceptions overlap | Drop profile-JOIN variants after confirming neutral policies are sufficient | Carnage |
| DB-RLS-05 — availability_rules overlap + public read intent | Confirm `is_active = true` is intentional; then drop profile-JOIN variants | Carnage (after product sign-off) |
| DB-RLS-06 — fuel_price_submissions redundant INSERT | Drop `citizen_insert_fuel_price_submission` | Carnage |
| DB-RLS-07 — locksmith_portfolio_details owner_all | Drop `owner_all` | Carnage |
| DB-RLS-08 — locksmith_service_areas owner_all | Verify named coverage, then drop `owner_all` | Carnage |
| DB-BOOK-02 — availability_rules DAL UPDATE filter | Add `resource_id` filter to `upsertVportAvailabilityRuleDAL` UPDATE call | Wolverine |
| DB-BOOK-03 / 05 / 06 — app-layer consolidation and projection fixes | Code changes only; no schema work | Wolverine |

---

*DB audit complete — 2026-05-14 18:45 — Read-only analysis, no schema modifications applied*
