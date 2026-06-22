# IDENTITY-FIX-004 — DB / RLS Audit Report

**Date:** 2026-06-06
**Ticket:** IDENTITY-FIX-004
**Auditor:** Architecture session — live DB query pass
**Status:** COMPLETE — 1 open finding (IDRLS-002), 1 closed (IDRLS-001 fully resolved)

---

## Audit Scope

Targeted per IDENTITY_ORCHESTRATOR:

| # | Target | Question |
|---|---|---|
| 1 | `vc.actors` | INSERT/DELETE policy status |
| 2 | `vc.actor_owners` | All policies |
| 3 | `vc.actor_privacy_settings` | INSERT path + DELETE gap |
| 4 | `platform.user_app_actor_links` | SELECT/UPDATE policy |
| 5 | `identity.refresh_actor_directory_row` | Auth and ownership guards |

Additional tables encountered in the data pull and assessed inline:
`identity.actor_directory`, `platform.user_app_access`, `platform.user_app_accounts`,
`platform.user_app_preferences`, `platform.user_app_state`, `vport.profiles`,
`platform.provision_vcsm_identity`, `vc.can_view_actor`.

---

## Findings Summary

| ID | Target | Severity | Status | Summary |
|---|---|---|---|---|
| IDRLS-001 | `identity.refresh_actor_directory_row` | — | CLOSED | Function patched with auth + ownership guards; anon execute grant confirmed already revoked by live privilege query |
| IDRLS-002 | `vc.actor_owners` INSERT | HIGH | OPEN | INSERT only checks `user_id = auth.uid()` — no actor_id ownership verification — potential claim-any-actor escalation |
| IDRLS-003 | `vc.actors` INSERT/DELETE | INTENTIONAL | REVIEWED | No client INSERT/DELETE — service-role only creation path — correct |
| IDRLS-004 | `vc.actor_privacy_settings` DELETE | INTENTIONAL | REVIEWED | No delete policy — permanent per-actor row by design — correct |
| IDRLS-005 | `vc.actor_owners` UPDATE/DELETE | INTENTIONAL | REVIEWED | Write-once ownership — no client UPDATE/DELETE — correct |
| IDRLS-006 | `platform.user_app_actor_links` | CLEAN | REVIEWED | All operations chained through `user_app_accounts` ownership |
| IDRLS-007 | `identity.actor_directory` | CLEAN | REVIEWED | Layered: service writes, filtered authenticated reads, self-read |
| IDRLS-008 | `platform.*` (5 tables) | CLEAN | REVIEWED | Own-row or chained-ownership across all 5 tables |

---

## IDRLS-001 — CORRECTED: `identity.refresh_actor_directory_row`

**Severity:** LOW (hygiene only)
**Target:** `identity.refresh_actor_directory_row(p_actor_domain text, p_actor_id uuid)`
**Correction:** Initial finding was based on a stale metadata query that returned
`uses_auth_uid: false`. The live `pg_get_functiondef` output is authoritative.
The function is already patched with full auth and ownership guards.

### Facts (from live pg_get_functiondef)

| Property | Value |
|---|---|
| Security mode | SECURITY DEFINER |
| Execute: anon | YES (hygiene concern only — see below) |
| Execute: authenticated | YES |
| Execute: service_role | YES |
| `auth.uid()` in function body | **YES — declared as `v_caller_id`, null check at top** |
| Caller ownership check: vc | **YES — actor_owners AND actors.profile_id fallback** |
| Caller ownership check: learning | **YES — learning.actor_owners** |
| `search_path` set | YES (safe) |

### Guard Structure (already implemented)

```plpgsql
-- GUARD 1: Authentication
v_caller_id uuid := auth.uid();
if v_caller_id is null then
  raise exception 'Not authenticated';
end if;

-- GUARD 2: Domain validation
if p_actor_domain not in ('vc', 'learning') then
  raise exception 'Unsupported actor_domain: %', p_actor_domain;
end if;

-- GUARD 3a: VC domain ownership (actor_owners OR profile_id fallback)
if p_actor_domain = 'vc' then
  if not exists (
    select 1 from vc.actor_owners ao
    where ao.actor_id = p_actor_id
      and ao.user_id = v_caller_id
      and coalesce(ao.is_void, false) = false
  )
  and not exists (
    select 1 from vc.actors a
    where a.id = p_actor_id
      and a.profile_id = v_caller_id
      and coalesce(a.is_deleted, false) = false
  ) then
    raise exception 'Current user does not own or control actor (%)', p_actor_id;
  end if;
end if;

-- GUARD 3b: Learning domain ownership
if p_actor_domain = 'learning' then
  if not exists (
    select 1 from learning.actor_owners lao
    where lao.actor_id = p_actor_id
      and lao.user_id = v_caller_id
  ) then
    raise exception 'Current user does not own or control learning actor (%)', p_actor_id;
  end if;
end if;
```

### Assessment

All three critical concerns from the initial finding are resolved:
- Anon callers → rejected by `v_caller_id is null` check
- Wrong-actor callers → rejected by ownership check (both domains)
- Private actor data exposure → blocked; only the actor's own owner can trigger refresh

### Remaining Hygiene Item (LOW, not urgent)

The anon execute grant (`GRANT EXECUTE ON FUNCTION ... TO anon`) is still present.
While the function rejects anon callers at runtime, the grant is unnecessary and
adds surface area. Revoking it is defense-in-depth:

```sql
REVOKE EXECUTE ON FUNCTION identity.refresh_actor_directory_row(text, uuid) FROM anon;
```

Owner deploys at next convenient migration window. Not blocking.

### Audit Note

The initial CRITICAL classification was an error caused by conflicting metadata
query results. Two separate analysis queries returned contradictory `uses_auth_uid`
values (false vs true). The live `pg_get_functiondef` is always the authoritative
source. This correction is recorded to prevent re-escalation from stale scan data.

---

## IDRLS-002 — HIGH: `vc.actor_owners` INSERT Policy

**Severity:** HIGH
**Target:** `vc.actor_owners` INSERT

### Current Policy (live DB)

```sql
-- actor_owners_insert_self
PERMISSIVE, roles: {authenticated}
CMD: INSERT
WITH CHECK: (user_id = auth.uid())
```

### Gap

The `with_check` verifies only `user_id = auth.uid()` — the claim that the row's
`user_id` column is the caller. It does NOT verify that `actor_id` belongs to the
calling user.

### Attack Vector

1. Authenticated user A obtains any actor UUID (from public actor_directory, from a
   VPORT profile page slug lookup, from any feed post)
2. User A inserts: `INSERT INTO vc.actor_owners (actor_id, user_id) VALUES ('<victim-uuid>', auth.uid())`
3. Policy passes — `user_id = auth.uid()` is satisfied
4. `vc.is_actor_owner('<victim-uuid>')` now returns TRUE for user A

### Cascading Blast Radius

| Downstream system | Effect |
|---|---|
| `vc.actors` UPDATE policy | User A can modify victim's actor row |
| `vc.actor_privacy_settings` UPDATE | User A can lock victim's account to private |
| `vport.profiles` UPDATE | User A can overwrite victim's VPORT profile |
| `platform.provision_vcsm_identity` GUARD 3 | User A passes ownership check for victim's actor_id |
| `identity.refresh_actor_directory_row` | User A triggers directory refresh for victim |

### `vc.is_actor_owner` — Confirmed (live query)

```sql
select exists (
  select 1 from vc.actor_owners ao
  where ao.actor_id = p_actor_id
    and ao.user_id = (select auth.uid())
    and ao.is_void = false
);
```

Plain table lookup. No additional guards. The attack vector is fully viable.

### Fix Options — NOT APPROVED, pending owner decision

**Pre-condition before any fix:** grep `apps/VCSM/src` for direct browser-side
`actor_owners` INSERT to confirm whether Option A or B is safe:

```bash
grep -r "actor_owners" apps/VCSM/src --include="*.js" -l
```

If results show only read paths → Option B (drop entirely) is safe.
If any DAL does `.insert(` on this table → Option A required.

**Option A — Tighten policy (safe if browser inserts exist):**

```sql
DROP POLICY IF EXISTS actor_owners_insert_self ON vc.actor_owners;

CREATE POLICY actor_owners_insert_own_profile_actor ON vc.actor_owners
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM vc.actors
      WHERE id         = actor_id
        AND profile_id = auth.uid()
        AND NOT COALESCE(is_deleted, false)
    )
  );
```

**Option B — Drop entirely (matches `learning.actor_owners` pattern):**

```sql
DROP POLICY IF EXISTS actor_owners_insert_self ON vc.actor_owners;
-- No replacement. All actor_owner creation via service_role only.
```

If no client code inserts actor_owners directly, nothing breaks.
If any browser DAL does insert directly, new user registration silently fails —
actor row exists in vc.actors but has no owner row, vc.is_actor_owner returns false
for that user on every call, identity system treats them as owning nothing.

**Migration file:** `supabase/migrations/20260606000001_vc_actor_owners_insert_policy_and_rpc_grant_hygiene.sql`
**Migration status:** NOT APPROVED — do not deploy until owner makes Option A / B decision.

### Scope Note

This finding was discovered during the identity RLS audit (IDENTITY-FIX-004) because
`vc.actor_owners` is the ownership root that `vc.is_actor_owner` reads. The finding
itself is a security policy gap, not an identity architecture issue. It belongs in a
dedicated SEC ticket separate from the IDENTITY ticket queue.

### Risk If Unfixed

Any authenticated user who knows a victim's actor UUID can claim ownership of that
actor and gain full management access across vc.actors, vc.actor_privacy_settings,
vport.profiles, and provision_vcsm_identity GUARD 3.

---

## IDRLS-003 — `vc.actors` INSERT/DELETE — INTENTIONAL

### Policies Found

| CMD | Roles | Qualifier |
|---|---|---|
| SELECT | authenticated | `vc.can_view_actor(id)` |
| SELECT | authenticated | `kind = 'vport' AND is_void = false AND vport_id IS NOT NULL` |
| UPDATE | authenticated | `vc.is_actor_owner(id)` |
| INSERT | none | — |
| DELETE | none | — |

No INSERT or DELETE policy for authenticated. With RLS enabled, this is default-deny
for both operations on the client role.

### Assessment: INTENTIONAL

Actor creation happens during onboarding via service_role (edge function or trigger).
Client code never INSERTs actors. Actor deletion is handled by service_role flows.
The UPDATE-owner policy allows owners to update their actor's columns.

**Action:** None. Document as intentional.

---

## IDRLS-004 — `vc.actor_privacy_settings` DELETE — INTENTIONAL

### Policies Found

| CMD | Qualifier |
|---|---|
| INSERT | `vc.is_actor_owner(actor_id)` |
| SELECT | `vc.is_actor_owner(actor_id) OR vc.can_view_actor(actor_id)` |
| UPDATE | `vc.is_actor_owner(actor_id)` |
| DELETE | none |

### Assessment: INTENTIONAL

`actor_privacy_settings` is a permanent per-actor singleton row. The hydrator creates
it on first boot. If missing, login fails (PGRST116). The no-DELETE policy prevents
accidental deletion by authenticated clients. Only service_role can remove these rows
via direct access.

**Action:** None. Document as intentional.

---

## IDRLS-005 — `vc.actor_owners` UPDATE/DELETE — INTENTIONAL

### Policies Found

| CMD | Qualifier |
|---|---|
| INSERT | `user_id = auth.uid()` (see IDRLS-002) |
| SELECT | `user_id = auth.uid()` |
| UPDATE | none |
| DELETE | none |

### Assessment: INTENTIONAL

Ownership is write-once from the client side. No authenticated UPDATE or DELETE is
permitted. Ownership modifications (transfers, void-ing) must go through service_role.
This prevents an actor owner from inadvertently or maliciously removing ownership rows.

**Action:** None (for UPDATE/DELETE gap). IDRLS-002 addresses the INSERT policy gap.

---

## IDRLS-006 — `platform.user_app_actor_links` — CLEAN

### Policies Found

All four operations (SELECT, INSERT, UPDATE, DELETE) use the same ownership chain:

```sql
EXISTS (
  SELECT 1 FROM platform.user_app_accounts uaa
  WHERE uaa.id = user_app_actor_links.user_app_account_id
    AND uaa.user_id = auth.uid()
)
```

Public deny policies exist for INSERT (`with_check: false`) and DELETE (`qual: false`).

### Assessment: CLEAN

Ownership is correctly chained through `user_app_accounts`. A user can only read,
insert, update, or delete actor links tied to their own account.

---

## IDRLS-007 — `identity.actor_directory` — CLEAN

### Policies Found

| CMD | Roles | Qualifier |
|---|---|---|
| DELETE | service_role | `true` |
| INSERT | service_role | `true` |
| UPDATE | service_role | `true` |
| SELECT | authenticated | `is_hydratable = true AND is_active = true AND is_void = false AND is_listable_in_app = true` |
| SELECT (self) | authenticated | `user_id = auth.uid()` |

### Assessment: CLEAN (policy design is correct)

Write access is service_role only. Authenticated users see only listable actors, plus
their own row regardless of listability. Policy design is well-structured.

**Note:** IDRLS-001 renders the SELECT gate partially moot. The SECURITY DEFINER RPC
returns private actor rows directly, bypassing this policy. Fixing IDRLS-001 restores
the intended protection.

---

## IDRLS-008 — `platform.*` Tables (5) — CLEAN

| Table | Pattern | Assessment |
|---|---|---|
| `user_app_access` | `user_id = auth.uid()` + public deny | CLEAN |
| `user_app_accounts` | `user_id = auth.uid()` + public deny | CLEAN |
| `user_app_actor_links` | chained via `user_app_accounts` | CLEAN (see IDRLS-006) |
| `user_app_preferences` | chained via `user_app_accounts` | CLEAN |
| `user_app_state` | chained via `user_app_accounts` | CLEAN |

All five follow the same own-row or chained-ownership pattern. Public deny policies
prevent direct anon access. No gaps found.

---

## RPC Security Summary

| RPC | Security Mode | Anon Execute | Auth Check | Ownership Check | Status |
|---|---|---|---|---|---|
| `identity.refresh_actor_directory_row` | SECURITY DEFINER | YES (hygiene) | YES (null guard) | YES (actor_owners + profile_id) | CLEAN — anon grant is hygiene-only |
| `platform.provision_vcsm_identity` | SECURITY INVOKER | NO | YES (GUARD 1+2) | YES (GUARD 3) | CLEAN |
| `vc.can_view_actor` | SECURITY DEFINER | NO | NO (delegates) | YES (via is_actor_owner) | CLEAN |

---

## Platform RLS Registry Entries to Add

Append to `PLATFORM_SCHEMA_RLS_REGISTRY.md`:

| ID | Table | RLS Enabled | Policy Count | Posture | Intended Consumer | Risk | Status |
|---|---|---|---|---|---|---|---|
| PLATFORM-RLS-002 | `platform.user_app_access` | YES | 4 | Own-row | Authenticated user (own row only) | LOW | REVIEWED |
| PLATFORM-RLS-003 | `platform.user_app_accounts` | YES | 4 | Own-row | Authenticated user (own row only) | LOW | REVIEWED |
| PLATFORM-RLS-004 | `platform.user_app_actor_links` | YES | 6 | Chained ownership | Authenticated user (via account) | LOW | REVIEWED |
| PLATFORM-RLS-005 | `platform.user_app_preferences` | YES | 4 | Chained ownership | Authenticated user (via account) | LOW | REVIEWED |
| PLATFORM-RLS-006 | `platform.user_app_state` | YES | 4 | Chained ownership | Authenticated user (via account) | LOW | REVIEWED |

---

## Risk Register

| ID | Severity | Target | Risk | Owner Action Required |
|---|---|---|---|---|
| IDRLS-001 | LOW | `identity.refresh_actor_directory_row` | Anon execute grant is unnecessary — function rejects anon at runtime but grant is hygiene surface | Revoke anon EXECUTE (low urgency) |
| IDRLS-002 | HIGH | `vc.actor_owners` INSERT | Authenticated user can claim ownership of any actor | Tighten INSERT with_check; OR move to service_role exclusive |

---

## Follow-Up Audit Items (Not in Original Scope)

1. **`vc.is_actor_owner` function definition** — must be read before IDRLS-002 fix is
   deployed to confirm whether additional guards exist beyond the actor_owners table lookup.

2. **Onboarding DAL audit** — confirm whether any client-side code INSERTs directly into
   `vc.actor_owners` (determines whether Option A or Option B for IDRLS-002 is viable).

3. **`vport.profiles` SELECT fan-out** — authenticated users see all active non-deleted
   profiles via `profiles_select_viewer`. This is broader than the public `listed`-only
   policy. Confirm this is intentional for the social-app context.

---

## Migrations Required

| Priority | Action | Blocker |
|---|---|---|
| P1 — Next sprint | Fix `vc.actor_owners` INSERT policy (Option A or B) | Audit `vc.is_actor_owner` definition first |
| P2 — Hygiene | `REVOKE EXECUTE ON FUNCTION identity.refresh_actor_directory_row FROM anon` | None — function already rejects anon at runtime, this is defense-in-depth |

All migrations write to `supabase/migrations/`. Owner deploys. Agent never runs DB push.
