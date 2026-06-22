# VENOM SECURITY AUDIT — TICKET-0008 Remaining Policy Review

**Date:** 2026-05-27  
**Time:** 15:00  
**Reviewer:** VENOM  
**Ticket:** TICKET-0008  
**Application Scope:** VCSM  
**Mode:** READ-ONLY ANALYSIS — no schema modifications  
**Trigger:** TICKET-0008 remaining scope: five {public} → {authenticated} policy hardening + `profiles_insert_service_role` design verdict  

---

## VENOM TARGET

```
Feature / Route / Engine: vport.bookings + vport.profiles RLS policy role hardening
Application Scope: VCSM
Reason for review: TICKET-0008 cleanup wave — five policies on {public} role need
  role elevation; profiles_insert_service_role deferred for architectural design review
Primary trust boundary: Authenticated Citizen → Authenticated VPORT Owner
```

---

## SECURITY SURFACE

```
Entry point: PostgREST REST API (/rest/v1/bookings, /rest/v1/profiles) + direct Supabase client calls
Auth source: Supabase JWT (auth.uid()) / service_role key (BYPASSRLS)
Authorization layer: RLS policies on vport.bookings, vport.profiles
Identity surface: vc.current_actor_id(), auth.uid(), vport.current_actor_can_manage_resource()
Sensitive objects: vport.bookings (PII-sensitive booking records), vport.profiles (VPORT identity, hard-deletable)
```

---

## TRUST BOUNDARY TRACE

```
Client input:    REST PATCH /bookings, PATCH /profiles (Supabase client), DELETE /profiles
Validated at:    PostgREST JWT middleware (role = authenticated / anon / service_role)
Identity resolved at: vc.current_actor_id() — auth.uid() → vc.actor_owners → actor_id
Authorization enforced at: RLS USING / WITH CHECK on each policy
Data returned to: PWA client (bookings: customer, owner, resource manager)
```

---

## SCOPE INVENTORY — LIVE DB STATE (Phase 0 confirmed 2026-05-27)

| Policy | Table | CMD | Current Role | Current USING (summarized) | Migration 20260527100000 |
|---|---|---|---|---|---|
| `bookings_select_resource_neutral` | vport.bookings | SELECT | **{public}** | `current_actor_can_manage_resource(resource_id) OR customer_actor_id = current_actor_id() OR created_by_actor_id = current_actor_id()` | → {authenticated}, body preserved |
| `bookings_update_customer` | vport.bookings | UPDATE | **{public}** | `customer_actor_id = current_actor_id()` | → {authenticated}, body unchanged |
| `bookings_update_resource_neutral` | vport.bookings | UPDATE | **{public}** | `current_actor_can_manage_resource(resource_id) OR customer_actor_id = current_actor_id()` | → {authenticated}, body preserved |
| `bookings_update_vport_owner` | vport.bookings | UPDATE | **{public}** | `actor_can_manage_profile(current_actor_id(), profile_id)` | → {authenticated}, body canonicalized |
| `profiles_delete_owner` | vport.profiles | DELETE | **{public}** | `actor_owners WHERE actor_id = profiles.actor_id AND user_id = auth.uid()` | → {authenticated}, body hardened with is_void guard |
| `profiles_insert_service_role` | vport.profiles | INSERT | **{public}** | n/a (WITH CHECK only): `current_setting('role') = 'service_role'` | **Deferred — design review (this report)** |

**Also bundled in 20260527100000 (outside stated TICKET-0008 scope):**

| Policy | CMD | Current Role | Note |
|---|---|---|---|
| `bookings_insert_public_pending` | INSERT | {public} | Being moved to {authenticated} — same pattern, same cleanup wave |

---

## FINDINGS

---

### V-0008-01 — MEDIUM

```
VENOM SECURITY FINDING
- Finding ID: V-0008-01
- Location: vport.bookings → bookings_select_resource_neutral
- Application Scope: VCSM
- Platform Surface: Supabase Table/View — vport.bookings (SELECT)
- Trust Boundary: Public Visitor → Authenticated Citizen
- Boundary Violated: {public} role allows anon callers to reach RLS evaluation for booking reads
- Contract Violated: Actor Ownership Contract, Booking Trust Contract
- Current behavior: SELECT policy on vport.bookings uses {public} role. Anon callers can issue
  a GET /rest/v1/bookings request; PostgREST forwards the query to PostgreSQL which evaluates
  `current_actor_can_manage_resource(resource_id) OR customer_actor_id = current_actor_id()
  OR created_by_actor_id = current_actor_id()`. For anon: current_actor_id() = NULL, all
  branches evaluate to FALSE → 0 rows returned. No data is exposed, but the query reaches
  the RLS evaluation layer.
- Risk: Single-layer defense. The only barrier for anon access is the SECURITY DEFINER function
  returning NULL. If current_actor_can_manage_resource or current_actor_id() has any NULL
  handling edge case or future change that returns non-NULL for unauthenticated callers, anon
  booking read access becomes possible without any additional gate.
- Severity: MEDIUM
- Exploitability: LOW
- Attack Preconditions:
  - No authenticated account needed for anon path
  - Anon key available (public Supabase config)
  - Requires a bug in current_actor_id() or current_actor_can_manage_resource() returning
    non-NULL for anon to become HIGH
- Blast Radius: Feed-wide (all booking records would be readable if NULL guard fails)
- Identity Leak Type: Booking identity exposure
- Cache Trust Type: Booking-sensitive
- RLS Dependency: ASSUMED — relies entirely on current_actor_id() returning NULL for anon
- Why it matters: Booking records contain customer identity (customer_actor_id), scheduling data,
  and service details — PII-sensitive. Defense-in-depth requires the PostgREST role layer to
  reject anon before query execution, not just rely on DB function NULL returns.
- Recommended mitigation: Apply migration 20260527100000 — changes role to {authenticated}.
  PostgREST then blocks anon at the role enforcement layer before any SQL runs.
- Rationale: Aligned with the pattern established by bookings_select_customer and
  bookings_select_actor_owner (both {authenticated}). Consistent with availability_rules
  cleanup in 20260527080000.
- Follow-up command: Carnage (apply migration)
- CISSP Domain:
  - Primary: Identity and Access Management (5)
  - Secondary: Security Architecture and Engineering (3)
```

**Migration body check — 20260527100000:**
```sql
-- Proposed:
CREATE POLICY bookings_select_resource_neutral ON vport.bookings
  FOR SELECT TO authenticated
  USING (
    vport.current_actor_can_manage_resource(resource_id)
    OR customer_actor_id    = vc.current_actor_id()
    OR created_by_actor_id  = vc.current_actor_id()
  );
```
✅ Body is semantically identical to live DB state. Role change only. **APPROVED.**

---

### V-0008-02 — MEDIUM

```
VENOM SECURITY FINDING
- Finding ID: V-0008-02
- Location: vport.bookings → bookings_update_customer
- Application Scope: VCSM
- Platform Surface: Supabase Table/View — vport.bookings (UPDATE)
- Trust Boundary: Public Visitor → Authenticated Citizen
- Boundary Violated: {public} role allows anon callers to attempt booking UPDATE
- Contract Violated: Booking Trust Contract
- Current behavior: UPDATE policy uses {public} role. Anon callers can issue PATCH to
  /rest/v1/bookings. PostgreSQL evaluates USING: customer_actor_id = current_actor_id()
  → NULL comparison → FALSE → 0 rows matched → 0 rows updated. No mutation occurs.
- Risk: An anon caller can probe the bookings UPDATE surface. The defense is entirely
  the NULL return from current_actor_id(). A booking UPDATE is a mutation path; anon
  access to mutation surfaces should be rejected at the role layer, not after query planning.
- Severity: MEDIUM
- Exploitability: LOW
- Attack Preconditions:
  - No account required for anon probe
  - Requires current_actor_id() NULL guard to fail for active exploitation
- Blast Radius: Single actor (customer's own bookings, bounded by actor_id match)
- Identity Leak Type: None (0 rows returned)
- Cache Trust Type: Booking-sensitive
- RLS Dependency: ASSUMED — current_actor_id() NULL guard is the sole anon barrier
- Why it matters: Mutation surfaces (UPDATE/DELETE/INSERT) carry higher blast radius
  than SELECT if a NULL guard fails. Booking status changes are irreversible in some states.
- Recommended mitigation: Apply migration 20260527100000 — role to {authenticated}.
- Rationale: Body unchanged. Role change is the correct and complete fix.
- Follow-up command: Carnage
- CISSP Domain:
  - Primary: Identity and Access Management (5)
  - Secondary: Software Development Security (8)
```

**Migration body check — 20260527100000:**
```sql
-- Proposed:
CREATE POLICY bookings_update_customer ON vport.bookings
  FOR UPDATE TO authenticated
  USING      (customer_actor_id = vc.current_actor_id())
  WITH CHECK (customer_actor_id = vc.current_actor_id());
```
✅ Body unchanged from live DB. Role change only. **APPROVED.**

---

### V-0008-03 — MEDIUM

```
VENOM SECURITY FINDING
- Finding ID: V-0008-03
- Location: vport.bookings → bookings_update_resource_neutral
- Application Scope: VCSM
- Platform Surface: Supabase Table/View — vport.bookings (UPDATE)
- Trust Boundary: Public Visitor → Authenticated VPORT Owner
- Boundary Violated: {public} role allows anon callers to attempt booking UPDATE
  via the resource-manager (VPORT owner) path
- Contract Violated: Booking Trust Contract, Actor Ownership Contract
- Current behavior: {public} role. UPDATE via USING: current_actor_can_manage_resource(resource_id)
  OR customer_actor_id = current_actor_id(). For anon: both branches NULL → FALSE → 0 rows.
- Risk: Same class as V-0008-02. Mutation surface accessible to anon without role gate.
  current_actor_can_manage_resource traverses resources → actor_owners — if that function
  has any unexpected path that returns TRUE for NULL auth.uid(), resource managers' bookings
  could be mutated without authentication.
- Severity: MEDIUM
- Exploitability: LOW
- Attack Preconditions:
  - No account required for anon probe
  - current_actor_can_manage_resource must return non-NULL for active exploitation
- Blast Radius: Multi-actor (any booking on any resource if function guard fails)
- Identity Leak Type: None (0 rows returned under normal operation)
- Cache Trust Type: Booking-sensitive
- RLS Dependency: ASSUMED — two SECURITY DEFINER function guards; no role gate
- Why it matters: Resource manager UPDATE path governs booking status transitions
  (confirm, cancel, complete, no-show) for VPORT owners. This is a privileged write path.
- Recommended mitigation: Apply migration 20260527100000.
- Rationale: Body preserved correctly.
- Follow-up command: Carnage
- CISSP Domain:
  - Primary: Identity and Access Management (5)
  - Secondary: Security Architecture and Engineering (3)
```

**Migration body check — 20260527100000:**
```sql
-- Proposed:
CREATE POLICY bookings_update_resource_neutral ON vport.bookings
  FOR UPDATE TO authenticated
  USING (
    vport.current_actor_can_manage_resource(resource_id)
    OR customer_actor_id = vc.current_actor_id()
  )
  WITH CHECK (
    vport.current_actor_can_manage_resource(resource_id)
    OR customer_actor_id = vc.current_actor_id()
  );
```
✅ Body semantically identical to live DB (customer branch already present in live). Role change only. **APPROVED.**

---

### V-0008-04 — MEDIUM

```
VENOM SECURITY FINDING
- Finding ID: V-0008-04
- Location: vport.bookings → bookings_update_vport_owner
- Application Scope: VCSM
- Platform Surface: Supabase Table/View — vport.bookings (UPDATE)
- Trust Boundary: Public Visitor → Authenticated VPORT Owner
- Boundary Violated: {public} role allows anon callers to attempt booking UPDATE
  via the VPORT owner (profile-level) path
- Contract Violated: Booking Trust Contract, Actor Ownership Contract
- Current behavior: {public} role. UPDATE via actor_can_manage_profile(current_actor_id(),
  profile_id). For anon: current_actor_id() = NULL → actor_can_manage_profile(NULL, ...)
  checks owner_user_id = auth.uid() (NULL) → FALSE. Also profile_actor_access path requires
  auth.uid() → FALSE. 0 rows affected.
- Risk: VPORT owner booking mutation surface accessible to anon without role gate.
  The actor_can_manage_profile function has TWO ownership paths: (1) owner_user_id = auth.uid()
  and (2) profile_actor_access → actor_owners. Both are NULL-safe only if the function
  correctly handles auth.uid() = NULL without a branch returning true.
- Severity: MEDIUM
- Exploitability: LOW
- Attack Preconditions:
  - actor_can_manage_profile must return TRUE for NULL auth.uid() for active exploitation
- Blast Radius: Multi-actor (any booking for any profile the attacker could impersonate)
- Identity Leak Type: None under correct function behavior
- Cache Trust Type: Booking-sensitive
- RLS Dependency: ASSUMED — actor_can_manage_profile NULL-safety is the sole anon barrier
- Why it matters: VPORT owner UPDATE path governs the most privileged booking transitions.
  actor_can_manage_profile is called on every policy evaluation — any change to its internal
  logic that affects NULL handling would silently widen access.
- Recommended mitigation: Apply migration 20260527100000.
- Rationale: Migration body replaces `actor_can_manage_profile(vc.current_actor_id(), profile_id)`
  with the identical canonical form. Role change is the correct fix.
- Follow-up command: Carnage
- CISSP Domain:
  - Primary: Identity and Access Management (5)
  - Secondary: Security Architecture and Engineering (3)
```

**Migration body check — 20260527100000:**
```sql
-- Proposed:
CREATE POLICY bookings_update_vport_owner ON vport.bookings
  FOR UPDATE TO authenticated
  USING      (vport.actor_can_manage_profile(vc.current_actor_id(), profile_id))
  WITH CHECK (vport.actor_can_manage_profile(vc.current_actor_id(), profile_id));
```
✅ Semantically identical to live DB. Role change only. **APPROVED.**

---

### V-0008-05 — MEDIUM / HIGH

```
VENOM SECURITY FINDING
- Finding ID: V-0008-05
- Location: vport.profiles → profiles_delete_owner
- Application Scope: VCSM
- Platform Surface: Supabase Table/View — vport.profiles (DELETE)
- Trust Boundary: Public Visitor → Authenticated VPORT Owner
- Boundary Violated: {public} role allows anon callers to attempt DELETE on VPORT profiles
- Contract Violated: Actor Ownership Contract, VPORT Lifecycle Contract
- Current behavior: {public} role. DELETE USING: actor_owners WHERE actor_id = profiles.actor_id
  AND user_id = auth.uid(). For anon: auth.uid() = NULL → user_id = NULL → NULL equality
  comparison → FALSE → 0 rows deleted. Deletion blocked by NULL guard.
- Risk: Profile deletion is an irreversible, high-consequence operation (VPORT hard-delete).
  The {public} role means anon can probe the DELETE surface. The auth.uid() NULL guard is the
  sole barrier. Unlike bookings, profile deletion has permanent consequences: cascades to
  resources, bookings, portfolio items, media assets. There is no soft-delete check before
  hard-delete — no IS_ACTIVE = false requirement, no confirmation gate at DB layer.
- Severity: MEDIUM (role gap) + separate MEDIUM concern (hard-delete via RLS, no soft-delete gate)
- Exploitability: LOW (anon probe); HIGH (authenticated actor_owner — see Additional Concern)
- Attack Preconditions:
  - Anon path: auth.uid() must return non-NULL (requires function change) — LOW
  - Authenticated path: actor_owner of the profile → DIRECT exploit without app-layer gate
- Blast Radius: Single VPORT (plus cascade: resources, bookings, portfolio, media)
- Identity Leak Type: None (0 rows returned for anon)
- Cache Trust Type: Public-profile-sensitive, Booking-sensitive
- RLS Dependency: REQUIRED — auth.uid() NULL check is the anon barrier
- Why it matters: VPORT deletion affects all downstream data. An authenticated VPORT owner
  can hard-delete their profile via direct REST API call without going through any
  application-layer confirmation, soft-delete state check, or audit workflow.
- Recommended mitigation:
  1. Apply migration 20260527100000 — role to {authenticated}. Removes anon probe surface.
  2. (Separate, deferred) Consider adding a USING condition: AND profiles.is_deleted = true
     to require soft-delete before hard-delete at the DB layer. This would prevent direct
     hard-delete without prior soft-delete — consistent with the architecture contract's
     lifecycle lifecycle model.
- Rationale for (2): Cascade blast radius from a live (is_deleted=false) VPORT delete is
  enormous. Soft-delete gate at RLS layer enforces lifecycle discipline regardless of
  application-layer state.
- Follow-up command: Carnage (soft-delete gate design) + THOR (release gate if cascades are risky)
- CISSP Domain:
  - Primary: Identity and Access Management (5)
  - Secondary: Asset Security (2), Security Architecture and Engineering (3)
```

**Migration body check — 20260527100000:**
```sql
-- Proposed:
CREATE POLICY profiles_delete_owner ON vport.profiles
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM   vc.actor_owners ao
      WHERE  ao.actor_id             = profiles.actor_id
        AND  ao.user_id              = auth.uid()
        AND  COALESCE(ao.is_void, false) = false
    )
  );
```
✅ Correct and hardened. Converts the implicit `actor_owners` cross-join hint seen in the snapshot into an explicit `EXISTS` subquery. Adds `COALESCE(ao.is_void, false) = false` guard (aligned with canonical pattern). **APPROVED.**

⚠️ Note: `is_void` guard was NOT in the prior policy body per snapshot. The migration adds it. This is a hardening improvement — it prevents a voided actor's ownership record from authorizing deletion. Confirmed correct.

---

### V-0008-06 — profiles_insert_service_role: DESIGN VERDICT

```
VENOM SECURITY FINDING
- Finding ID: V-0008-06
- Location: vport.profiles → profiles_insert_service_role
- Application Scope: VCSM
- Platform Surface: Supabase Table/View — vport.profiles (INSERT), Edge Function caller path
- Trust Boundary: System Service → Authenticated Citizen (blocked), Anon (blocked)
- Boundary Violated: None currently active. {public} role adds unnecessary evaluation overhead.
- Contract Violated: None (design is working correctly — review is architectural)
- Current behavior: TO PUBLIC WITH CHECK (current_setting('role') = 'service_role').
  - Anon caller: current_setting('role') = 'anon' → FALSE → INSERT blocked
  - Authenticated caller: current_setting('role') = 'authenticated' → FALSE → INSERT blocked
  - Service_role caller via Edge Function: Supabase BYPASSRLS + NOT FORCE ROW LEVEL SECURITY
    on vport.profiles → RLS bypassed entirely → INSERT succeeds WITHOUT policy evaluation
- Risk: LOW — the design correctly blocks non-service-role callers. However:
```

**Five observations:**

**OBS-1 — {public} role is unnecessary (LOW)**
The `{public}` role causes the policy to be evaluated for anon callers. Changing to `{authenticated}` is sufficient:
- Anon callers: no INSERT policy matches → default DENY (no policy evaluation cost)
- Authenticated callers: policy evaluates → `current_setting('role') = 'service_role'` → FALSE → DENY
- Net effect is identical; `{authenticated}` is cleaner

**OBS-2 — The GUC check is correct but verify the trigger (LOW)**
`current_setting('role')` correctly returns `'service_role'` when PostgREST executes `SET LOCAL ROLE service_role` at request start (service_role key path). For Supabase Edge Functions using `createClient(url, SUPABASE_SERVICE_ROLE_KEY)`, PostgREST sets this GUC.

Verify: Confirm that all VPORT provisioning paths use the service_role key, not a JWT-based admin token (which would set role to `'authenticated'` and fail the check).

**OBS-3 — The policy is structurally vestigial for service_role callers (ARCHITECTURAL)**
`vport.profiles` has `FORCE ROW LEVEL SECURITY = false`. `service_role` has `BYPASSRLS` granted. Therefore:
- `service_role` callers → RLS is bypassed entirely → `profiles_insert_service_role` is NEVER evaluated
- The policy's `WITH CHECK (current_setting('role') = 'service_role')` is dead code for service_role
- The real INSERT gate for service_role is: PostgreSQL BYPASSRLS grant

The policy's function is: block authenticated callers attempting direct INSERT. It succeeds at that. But it provides no additional gate for service_role callers beyond BYPASSRLS.

**OBS-4 — Can current_setting('role') be spoofed? (LOW)**
For an `authenticated` user to make `current_setting('role')` return `'service_role'`:
1. `SET LOCAL ROLE service_role` → PostgreSQL blocks unless `authenticated` is a member of `service_role`. On Supabase, it is NOT a member → blocked at PostgreSQL level.
2. `SET LOCAL "role" = 'service_role'` (custom GUC, not the role GUC) → Would set a custom GUC named "role" overriding `current_setting('role')`. This IS a theoretical vector.

⚠️ **This is the key concern.** In PostgreSQL, `SET LOCAL "role" = 'some_value'` sets the custom GUC `role` to `'some_value'` for the current transaction. `current_setting('role')` reads this GUC. If an `authenticated` user can execute arbitrary SQL (e.g., via a SECURITY DEFINER function that accepts user input), they could potentially:
```sql
SET LOCAL "role" = 'service_role';
-- now current_setting('role') returns 'service_role'
INSERT INTO vport.profiles ...
```

**This is an authenticated-only path and requires SQL execution capability beyond the REST API.** Direct PostgREST calls cannot issue arbitrary `SET` statements. However, if any writable DB function (SECURITY DEFINER or SECURITY INVOKER) accepts user-controlled input that gets embedded in a SQL string (injection), this becomes exploitable.

**Probability: LOW** — requires a second vulnerability (SQL injectable function). Not present in current codebase from VENOM inspection.

**OBS-5 — Architectural recommendation: explicit SECURITY DEFINER RPC for VPORT provisioning**

The current design relies on:
1. BYPASSRLS for service_role (infrastructure-level gate)
2. GUC-based `current_setting` check for defense-in-depth

A more robust alternative for VPORT provisioning:

```sql
-- Proposed architecture (text only — do not apply):
CREATE OR REPLACE FUNCTION vport.provision_vport_profile(
  p_actor_id    uuid,
  p_display_name text,
  p_kind        text,
  ...
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = vport, vc, auth, pg_temp
AS $$
BEGIN
  -- Explicit gate: only callable from service-role context
  IF current_setting('role', true) != 'service_role' THEN
    RAISE EXCEPTION 'insufficient_privilege: VPORT provisioning requires service_role';
  END IF;
  -- Explicit ownership verification before insert
  IF NOT EXISTS (SELECT 1 FROM vc.actor_owners WHERE actor_id = p_actor_id AND user_id = auth.uid()) THEN
    -- ... or use service_role auth context appropriately
  END IF;
  INSERT INTO vport.profiles (...) VALUES (...) RETURNING id;
END;
$$;
```

Benefits:
- Explicit error message for misconfigured callers
- Audit trail: RPC call is visible in PostgREST logs
- Typed parameters prevent column-injection
- Can enforce pre-provisioning checks (e.g., actor exists, kind is valid) within the DB
- No reliance on GUC spoofing surface

```
- Severity: LOW (current design is correct; this is hardening + architectural evolution)
- Exploitability: LOW (OBS-4 vector requires second vulnerability)
- Attack Preconditions:
  - Active OBS-4 exploit: authenticated user + SQL-injectable SECURITY DEFINER function
  - No such function confirmed in current codebase
- Blast Radius: VPORT identity (new unauthorized VPORT profiles could be created)
- Identity Leak Type: None
- Cache Trust Type: Public-profile-sensitive
- RLS Dependency: BYPASSED (service_role, BYPASSRLS) / ASSUMED (for authenticated, GUC check)
- Why it matters: VPORT profiles are the core identity object. Unauthorized INSERT would
  create a ghost VPORT under an attacker's actor_id. The current design is correct but
  relies on two mechanisms (BYPASSRLS + GUC check) whose interaction is non-obvious.
- Recommended mitigation:
  IMMEDIATE: Change TO PUBLIC → TO authenticated (reduces anon evaluation path, consistent
  with TICKET-0008 cleanup wave).
  SHORT-TERM: Document the BYPASSRLS + GUC chain explicitly in migration comments.
  LONG-TERM (architectural): Move VPORT provisioning to an explicit SECURITY DEFINER RPC
  per OBS-5. Removes GUC dependency, adds audit trail, enforces pre-checks.
  NOT RECOMMENDED: Do not change to TO service_role — service_role bypasses RLS, so a
  TO service_role policy is evaluated under FORCE ROW LEVEL SECURITY only (which is off).
  The result would be a policy that is never evaluated, which is worse than the current state.
- Follow-up command: Carnage (migrate TO authenticated) + Wolverine (RPC design sprint if approved)
- CISSP Domain:
  - Primary: Security Architecture and Engineering (3)
  - Secondary: Identity and Access Management (5), Software Development Security (8)
```

---

### V-0008-07 — HIGH (pre-existing, not introduced by TICKET-0008)

```
VENOM SECURITY FINDING
- Finding ID: V-0008-07
- Location: vport.bookings → bookings_update_customer
- Application Scope: VCSM
- Platform Surface: Supabase Table/View — vport.bookings (UPDATE)
- Trust Boundary: Authenticated Citizen (customer)
- Boundary Violated: Customer can UPDATE all columns on their booking, not just status/cancel
- Contract Violated: Booking Trust Contract
- Current behavior: USING and WITH CHECK both check customer_actor_id = current_actor_id().
  This allows the matching customer to UPDATE ANY column on their booking row. There is no
  column-level restriction at the RLS layer.
  An authenticated customer can issue:
    PATCH /rest/v1/bookings?id=eq.<their_booking_id>
    Body: { "status": "confirmed", "price_snapshot": 0, "resource_id": "<other_resource>",
            "starts_at": "<any_time>", "profile_id": "<other_profile>" }
  The RLS policy passes (customer_actor_id matches in USING; customer_actor_id unchanged
  in WITH CHECK). All column mutations succeed at the DB layer.
  The application layer (booking controllers) may gate specific transitions, but direct
  REST API access bypasses controller logic entirely.
- Risk: Customer can unilaterally:
  1. Change booking status (e.g., set to 'confirmed' without VPORT owner confirmation)
  2. Set price_snapshot to 0 or any value (pricing manipulation)
  3. Change resource_id (reassign to a different resource, breaking VPORT scheduling)
  4. Change profile_id (cross-profile booking re-attribution)
  5. Change starts_at / ends_at (unilateral rescheduling)
  6. Change service_label_snapshot (audit trail manipulation)
- Severity: HIGH
- Exploitability: HIGH
- Attack Preconditions:
  - Authenticated Citizen account required
  - Must have an existing booking (customer_actor_id = attacker's actor)
  - Direct REST API call with Supabase anon key + JWT (standard client config)
  - No additional knowledge required — booking ID is known to the customer
- Blast Radius: Single actor (customer's own bookings only — cannot touch other customers' bookings)
  but VPORT operational integrity is affected (status, pricing, scheduling)
- Identity Leak Type: None (no leak, but mutation)
- Cache Trust Type: Booking-sensitive
- RLS Dependency: REQUIRED — no app-layer gate for direct REST access
- Why it matters: The TICKET-0008 role change ({public} → {authenticated}) does NOT fix this.
  It remains after migration. A customer booking a haircut could confirm their own appointment,
  zero out the price, or reschedule to a time slot that is already taken.
- Recommended mitigation:
  Option A — Column restriction in RLS (PostgreSQL does not support column-level RLS directly,
  but a WITH CHECK can be used to lock specific columns):
    WITH CHECK (
      customer_actor_id  = vc.current_actor_id()
      AND status = 'cancelled'  -- only cancellation allowed for customers
      AND resource_id   = resource_id  -- resource cannot change
      AND profile_id    = profile_id   -- profile cannot change
      AND starts_at     = starts_at    -- time cannot change unilaterally
    )
  Option B — Remove bookings_update_customer entirely. Route all customer booking mutations
  through a SECURITY DEFINER RPC (e.g., vport.customer_cancel_booking(booking_id)) that:
    - Validates status transition (only 'pending' → 'cancelled' allowed for customers)
    - Enforces time constraints (can only cancel before starts_at)
    - Records the cancellation actor and timestamp
  Option B is strongly preferred: it creates an explicit, auditable cancellation flow with
  typed parameters and DB-enforced business rules.
- Rationale: Direct UPDATE access on a booking table is inappropriate for customer-facing
  clients. VPORT owners manage bookings via the dashboard; customers should have exactly
  one allowed mutation: cancellation within a defined window.
- Follow-up command: Carnage (RPC design) + SPIDER-MAN (regression tests for cancel flow)
- CISSP Domain:
  - Primary: Software Development Security (8)
  - Secondary: Identity and Access Management (5), Security Architecture and Engineering (3)
```

---

### V-0008-08 — MEDIUM (pre-existing, surfaced by this review)

```
VENOM SECURITY FINDING
- Finding ID: V-0008-08
- Location: vport.bookings → bookings_update_resource_neutral
- Application Scope: VCSM
- Platform Surface: Supabase Table/View — vport.bookings (UPDATE)
- Trust Boundary: Authenticated VPORT Owner (resource manager)
- Boundary Violated: Resource manager can UPDATE all columns on any booking for their resource
- Contract Violated: Booking Trust Contract
- Current behavior: USING/WITH CHECK: current_actor_can_manage_resource(resource_id). A VPORT
  owner managing a resource can UPDATE any column on bookings for that resource, including
  customer_actor_id (re-attributing the booking to a different customer actor).
  The WITH CHECK only verifies the NEW resource_id is still one they manage — no check on
  customer_actor_id, price_snapshot, or other sensitive fields.
- Risk: A VPORT owner could:
  1. Change customer_actor_id — re-attribute a booking to a different customer (identity fraud)
  2. Inflate price_snapshot after booking confirmation (price manipulation)
  3. Change created_by_actor_id (audit trail manipulation)
  These are unlikely scenarios given VPORT owners are trusted actors, but the DB layer
  should enforce only the columns that business logic requires for owner operations
  (status transitions, no_show, completion flags).
- Severity: MEDIUM
- Exploitability: MEDIUM
- Attack Preconditions:
  - Authenticated VPORT owner account
  - Resource they manage has existing bookings
  - Direct REST API call bypassing controller
- Blast Radius: Single actor (bookings on their resources only)
- Identity Leak Type: Booking identity exposure (customer_actor_id writeable)
- Cache Trust Type: Booking-sensitive
- RLS Dependency: REQUIRED
- Why it matters: The TICKET-0008 role change does not fix this. It remains after migration.
- Recommended mitigation:
  Route all VPORT owner booking mutations through explicit SECURITY DEFINER RPCs with typed
  state transitions:
    vport.owner_confirm_booking(booking_id)
    vport.owner_cancel_booking(booking_id)
    vport.owner_complete_booking(booking_id)
    vport.owner_mark_noshow_booking(booking_id)
  Each RPC: verifies caller owns the resource, enforces valid state transition, sets only
  the relevant columns (status + timestamp). Eliminates unrestricted UPDATE access.
- Rationale: Booking state machines should be encoded in typed RPCs, not reliant on
  application-layer enforcement over a raw UPDATE grant.
- Follow-up command: Carnage (RPC design) + SPIDER-MAN
- CISSP Domain:
  - Primary: Software Development Security (8)
  - Secondary: Identity and Access Management (5)
```

---

### V-0008-09 — LOW (informational)

```
VENOM SECURITY FINDING
- Finding ID: V-0008-09
- Location: vport.bookings — bookings_update_customer + bookings_update_resource_neutral
- Application Scope: VCSM
- Platform Surface: Supabase Table/View — vport.bookings (UPDATE)
- Trust Boundary: Authenticated Citizen (customer)
- Boundary Violated: None — redundant policy overlap, not a security gap
- Contract Violated: None
- Current behavior: bookings_update_customer USING: customer_actor_id = current_actor_id().
  bookings_update_resource_neutral USING: current_actor_can_manage_resource(resource_id) OR
  customer_actor_id = current_actor_id(). The customer branch in bookings_update_resource_neutral
  duplicates bookings_update_customer. In PERMISSIVE mode, either policy passing is sufficient.
  There is no security gap — both grant the same access. Both evaluate on every customer UPDATE.
- Risk: None (functional). Minor audit surface confusion and redundant evaluation overhead.
- Severity: LOW
- Exploitability: LOW
- Recommended mitigation: After V-0008-07 is remediated (bookings_update_customer replaced
  by a typed RPC), reconsider whether the customer branch in bookings_update_resource_neutral
  should also be removed. Do not remove now — sequencing matters.
- Follow-up command: Carnage (after V-0008-07 remediation)
- CISSP Domain:
  - Primary: Security Assessment and Testing (6)
  - Secondary: None
```

---

### V-0008-10 — LOW (informational — bundled policy in 20260527100000)

```
VENOM SECURITY FINDING
- Finding ID: V-0008-10
- Location: vport.bookings → bookings_insert_public_pending (bundled in migration 20260527100000)
- Application Scope: VCSM
- Platform Surface: Supabase Table/View — vport.bookings (INSERT)
- Trust Boundary: Authenticated Citizen (customer booking)
- Boundary Violated: {public} role on INSERT policy (same class as V-0008-01 through V-0008-04)
- Contract Violated: Booking Trust Contract
- Current behavior: TO PUBLIC WITH CHECK (auth.uid() IS NOT NULL AND customer_actor_id =
  current_actor_id() ... full booking validation chain). For anon: auth.uid() = NULL → FALSE.
- Risk: {public} role allows anon probing of INSERT surface. auth.uid() IS NOT NULL guard
  blocks actual INSERT, but PostgREST does not reject before RLS evaluation.
- Note: This policy is bundled into 20260527100000 outside the stated TICKET-0008 scope.
  The bundling is appropriate — same cleanup wave, same risk class.
- Severity: LOW
- After migration: auth.uid() IS NOT NULL check becomes redundant (PostgREST enforces
  authentication before {authenticated} policy evaluation). Harmless to leave in as
  defensive programming.
- Recommended mitigation: Migration 20260527100000 correct and approved for this policy.
- Follow-up command: None additional
- CISSP Domain:
  - Primary: Identity and Access Management (5)
  - Secondary: None
```

---

## TRUST BOUNDARY TRACE — FULL BOOKING LIFECYCLE

```
TRUST BOUNDARY TRACE
Client input:    Booking data (POST /bookings), status mutation (PATCH /bookings)
Validated at:
  - Anon path:           PostgREST role gate (after {authenticated} migration)
  - Authenticated path:  PostgREST JWT validation → controller ownership check →
                         RLS USING/WITH CHECK
  - Service_role path:   BYPASSRLS (no RLS evaluation) → direct DB write
Identity resolved at:    vc.current_actor_id() SECURITY DEFINER function
Authorization enforced at: RLS policy set on vport.bookings
Data returned to:        PWA client (booking records scoped to actor)
```

---

## IDENTITY SURFACE WARNINGS

```
IDENTITY SURFACE WARNING — V-0008-06 (profiles_insert_service_role)
Location: vport.profiles INSERT path
Current identity surface: current_setting('role') GUC comparison (not actor_id)
Expected identity surface: service_role BYPASSRLS (infrastructure) — no actor needed
Risk: GUC can theoretically be SET by any transaction that can issue SET statements.
  Requires second vulnerability for active exploitation.
Suggested correction: Long-term — move to SECURITY DEFINER RPC with explicit parameter
  validation. Short-term — change TO authenticated (reduces anon evaluation path).
```

---

## MIGRATION 20260527100000 — VENOM SIGN-OFF

| Policy | Role Change | Body Change | Verdict |
|---|---|---|---|
| `bookings_insert_public_pending` | {public} → {authenticated} | `auth.uid() IS NOT NULL` retained (harmless), body equivalent | ✅ APPROVED |
| `bookings_select_resource_neutral` | {public} → {authenticated} | Body identical to live DB | ✅ APPROVED |
| `bookings_update_customer` | {public} → {authenticated} | Body unchanged | ✅ APPROVED |
| `bookings_update_resource_neutral` | {public} → {authenticated} | Customer OR branch preserved | ✅ APPROVED |
| `bookings_update_vport_owner` | {public} → {authenticated} | Canonical form confirmed | ✅ APPROVED |
| `profiles_delete_owner` | {public} → {authenticated} | Hardened: explicit EXISTS, added is_void guard | ✅ APPROVED — hardening addition is correct |

**All five TICKET-0008 target policies plus the bundled `bookings_insert_public_pending` change are correct and ready to apply. No rollback risk — all changes are DROP IF EXISTS + CREATE, pure role/body replacements with no structural schema changes.**

---

## profiles_insert_service_role — FINAL VERDICT

| Question | Answer |
|---|---|
| Is the current design broken? | No — it correctly blocks non-service-role callers |
| Is the {public} role appropriate? | No — change to {authenticated} for consistency and reduced evaluation path |
| Is the GUC check spoofable? | Theoretical vector exists (SET LOCAL "role") but requires second vulnerability |
| Should it become TO service_role? | No — service_role bypasses RLS (BYPASSRLS + NOT FORCE ROW LEVEL SECURITY); a TO service_role policy is never evaluated |
| Should VPORT provisioning become a SECURITY DEFINER RPC? | Yes — architectural evolution, not emergency fix |
| Is this a release blocker? | No — current design is correct and functional |

**Immediate action:** Carnage migration — change `TO PUBLIC` → `TO authenticated` on `profiles_insert_service_role`. No body change needed.

**Long-term recommendation:** Introduce `vport.provision_vport_profile(...)` SECURITY DEFINER RPC. Route all server-side VPORT creation through this function. Removes GUC dependency, adds audit trail, enforces pre-creation validation (actor exists, kind valid, no duplicate provisioning).

---

## MITIGATION PLAN

| Finding | Risk | Layer to Fix | Priority | Owner | Follow-up Command |
|---|---|---|---|---|---|
| V-0008-01 | {public} SELECT on bookings | RLS | P1 | DB | Carnage — apply 20260527100000 |
| V-0008-02 | {public} UPDATE (customer) on bookings | RLS | P1 | DB | Carnage — apply 20260527100000 |
| V-0008-03 | {public} UPDATE (resource neutral) on bookings | RLS | P1 | DB | Carnage — apply 20260527100000 |
| V-0008-04 | {public} UPDATE (vport owner) on bookings | RLS | P1 | DB | Carnage — apply 20260527100000 |
| V-0008-05 | {public} DELETE on profiles + hard-delete gate | RLS + Architecture | P1 (role), P2 (soft-delete gate) | DB | Carnage |
| V-0008-06 | profiles_insert_service_role design | RLS + Architecture | P2 (TO authenticated), P3 (RPC) | DB + Security | Carnage + Wolverine |
| V-0008-07 | Customer UPDATE column overpermission | RLS + Controller + DAL | P0 (HIGH) | App + DB | Carnage (RPC design) + SPIDER-MAN |
| V-0008-08 | Resource manager UPDATE column overpermission | RLS + Controller | P1 (MEDIUM) | App + DB | Carnage (RPC design) |
| V-0008-09 | Overlapping customer UPDATE paths | RLS | P3 (LOW, after V-0008-07) | DB | Carnage |
| V-0008-10 | bookings_insert_public_pending {public} | RLS | P1 | DB | Carnage — bundled in 20260527100000 |

---

## CISSP DOMAIN COVERAGE SUMMARY

| CISSP Domain | Findings | Notes |
|---|---|---|
| Security and Risk Management (1) | 0 | No governance/policy framework gaps in scope |
| Asset Security (2) | 1 | V-0008-05 profiles_delete_owner — VPORT identity asset unprotected at hard-delete layer |
| Security Architecture and Engineering (3) | 4 | V-0008-01/03/04/06 — {public} role design gap; GUC-based gate; defense-in-depth gaps |
| Communication and Network Security (4) | 0 | REST surface reviewed implicitly; no network-specific findings |
| Identity and Access Management (5) | 6 | V-0008-01 through V-0008-06 — all are IAM boundary findings at the role layer |
| Security Assessment and Testing (6) | 1 | V-0008-09 — redundant policy overlap creates audit noise |
| Security Operations (7) | 0 | Audit trail gap in V-0008-07/08 noted but not a primary finding |
| Software Development Security (8) | 2 | V-0008-07/08 — column-level overpermission; should be RPC-gated state machines |

**Uncovered domains:**
- Communication and Network Security (4): Out of scope for this review (policy-layer analysis only)
- Security Operations (7): Audit trail gaps were observed (V-0008-07/08 have no logging) but were not the primary concern of this ticket scope

---

## COMPLETION CHECKLIST

- [x] Boundary isolation contract loaded and enforced
- [x] Stayed fully read-only
- [x] Identified trust boundaries for all six target policies
- [x] Traced auth + authorization for each policy
- [x] Inspected identity surfaces (current_actor_id, actor_can_manage_profile, auth.uid())
- [x] Classified exploitability for each finding
- [x] Classified blast radius for each finding
- [x] Classified platform surface (all: Supabase Table/View)
- [x] Classified RLS dependency for each finding
- [x] Mapped contract violations
- [x] Mapped CISSP domains for all findings
- [x] Included mitigation plan with priority, owner, follow-up
- [x] Included CISSP summary
- [x] Stated uncovered CISSP domains with rationale
- [x] Migration 20260527100000 reviewed and signed off — all six changes APPROVED
- [x] profiles_insert_service_role design verdict delivered

---

*VENOM audit complete — 2026-05-27*  
*Application scope: VCSM*  
*No database changes were made. No files were modified. All SQL shown is read-only analysis.*  
*Migration 20260527100000 reviewed and APPROVED for application.*
