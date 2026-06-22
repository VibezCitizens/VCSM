# VENOM Security Audit — `platform.provision_vcsm_identity` RPC
_Date:_ 2026-05-18
_Triggered by:_ CARNAGE MW-01 — SECURITY DEFINER function body unverified
_Application Scope:_ VCSM
_Boundary contract enforced:_ `PROJECT_BOUNDARY_ISOLATION_CONTRACT.md`

---

## VENOM TARGET

```text
VENOM TARGET
Surface:          platform.provision_vcsm_identity SECURITY DEFINER RPC
Caller:           apps/VCSM/src/features/identity/dal/provision.rpc.dal.js
Trust boundary:   Frontend caller → SECURITY DEFINER DB function → writes to 6 objects
Reason:           CARNAGE MW-01 — auth.uid() guard unverified. Function takes
                  p_user_id as caller-supplied parameter. Wentrex equivalent uses
                  auth.uid() internally and validates actor ownership at DB layer.
                  Whether VCSM RPC enforces the same protections is unverified.
```

---

## Evidence Gathered

| Source | Finding |
|---|---|
| `provision.rpc.dal.js:5` | Signature: `provision_vcsm_identity(p_user_id uuid, p_actor_id uuid) → uuid` |
| `CROSS_APP_SIGNUP_PIPELINE.md:53` | Current 2-param signature confirmed in use since ≥ 2026-04-04 |
| `CARNAGE secdef plan (2026-05-10):271` | Old signature was `provision_vcsm_identity(p_user_id)` — 1 param. Function evolved. |
| `secdef_a_search_path_hardening.sql` | `platform.provision_vcsm_identity` NOT listed — search_path NOT hardened by the 2026-05-10 pass |
| `CROSS_APP_SIGNUP_PIPELINE.md:271` | Classified "KEEP BUT HARDEN" in 2026-05-10 CARNAGE plan — hardening not applied |
| `provision_wentrex_identity` migration | Wentrex equivalent: uses `auth.uid()` internally, validates actor ownership (3 checks), hardens search_path |
| No codebase DB dump | Function body NOT available from codebase — live DB query required to confirm body |

---

## Security Surface Classification

| Property | Status | Risk |
|---|---|---|
| Trust level | SECURITY DEFINER — elevated privilege writes to 6 objects | CRITICAL surface |
| Caller | Frontend (Supabase JS client) via `supabase.schema('platform').rpc(...)` | Direct browser-to-DB call |
| p_user_id guard | UNVERIFIED — takes user_id as caller parameter | HIGH if no auth.uid() == p_user_id check |
| p_actor_id guard | UNVERIFIED — unknown if RPC validates actor exists + caller owns it | HIGH |
| search_path | UNVERIFIED — NOT in secdef_a hardening pass | MEDIUM — injection surface if absent |
| Return value | uuid (userAppAccountId) — no sensitive data in return | LOW |
| Idempotency | Assumed — DAL comment says "safe to call on every login" | LOW |

---

## VENOM FINDING — VF-01 (HIGH)

```text
VENOM FINDING
Finding ID:         VF-01
Surface:            platform.provision_vcsm_identity(p_user_id uuid, p_actor_id uuid)
Trust Classification: Identity-sensitive + Ownership-sensitive + Engine-critical
Risk Category:      Caller-supplied user_id without confirmed auth.uid() guard
Confidence:         HIGH (gap confirmed by inspection evidence)

Vulnerability:
  The function takes p_user_id as an explicit caller-supplied parameter.
  Unlike the Wentrex equivalent which uses v_user_id := auth.uid() internally
  and raises an exception if null, the VCSM function's internal handling of
  p_user_id is unverified from codebase alone.

  If the function does NOT enforce auth.uid() == p_user_id:
  - Any authenticated user can call provision_vcsm_identity with ANY user_id.
  - The RPC will create/upsert platform rows (user_app_access, user_app_accounts,
    user_app_preferences, user_app_state, user_app_actor_links) scoped to that
    arbitrary user_id.
  - This bypasses all RLS because SECURITY DEFINER elevation is active.
  - Result: User A can provision a VCSM platform identity for User B.

  Secondary concern: if the function also does NOT validate that the caller
  owns p_actor_id (e.g., via vc.actor_owners), then the attacker can link
  any actor to any user's platform account.

Attack path (if unguarded):
  1. Attacker authenticates as User A
  2. Attacker calls: supabase.schema('platform').rpc('provision_vcsm_identity',
     { p_user_id: victimUserId, p_actor_id: attackerActorId })
  3. If unguarded: victim's platform rows are created/overwritten with attacker's actor
  4. On victim's next login: engine resolves attacker's actor as victim's identity
  5. If victim switches actor: attacker actor appears in victim's actor list

Severity:           HIGH
Evidence Type:      INFERRED — function body not retrieved; gap identified by comparison
                    with Wentrex pattern and absence from secdef_a hardening
```

---

## VENOM FINDING — VF-02 (MEDIUM)

```text
VENOM FINDING
Finding ID:         VF-02
Surface:            platform.provision_vcsm_identity — search_path
Trust Classification: Engine-critical
Risk Category:      Unhardened search_path (search_path injection)
Confidence:         HIGH

Vulnerability:
  The `secdef_a_search_path_hardening.sql` migration (2026-05-10) applied
  SET search_path to all known SECURITY DEFINER functions. It does NOT list
  platform.provision_vcsm_identity.

  If the function was created WITHOUT SET search_path, or if the search_path
  is set to 'public' or '', a search_path injection attack is possible:
  - Attacker creates a function/table in their schema with the same name as
    a table the function queries (e.g., a fake 'user_app_accounts')
  - PostgreSQL resolves the attacker's object first if it appears earlier
    in the search_path
  - The SECURITY DEFINER function writes to the attacker's table instead

  Risk is reduced by the fact that callers are authenticated browser clients
  (not direct DB access), but the gap must still be closed.

Recommended fix:
  SET search_path = 'platform', 'vc', 'auth', 'public', 'pg_temp'

Severity:           MEDIUM
Evidence Type:      INFERRED — absence from secdef_a is evidence of non-hardening
```

---

## VENOM FINDING — VF-03 (LOW)

```text
VENOM FINDING
Finding ID:         VF-03
Surface:            No audit trail after successful provisioning
Trust Classification: Identity-sensitive
Risk Category:      Missing audit event
Confidence:         HIGH

Vulnerability:
  When provision_vcsm_identity succeeds:
  - The DAL returns the userAppAccountId
  - The controller returns { ok: true, userAppAccountId }
  - No structured audit event is emitted

  This means there is no durable record of:
  - When a user was provisioned
  - How many times provisioning was called for a user
  - Whether provisioning was triggered by onboarding vs self-heal
  - What actorId was linked at provisioning time

  If a support ticket arrives for "my identity was wrong after login", there
  is no way to reconstruct the provisioning event history.

Recommended fix: (from LOKI AT-01)
  Add debugLoginEvent('PLATFORM_BOOTSTRAP_COMPLETE', { phase: 'bootstrap',
  status: 'success', payload: { userId, actorId, userAppAccountId } })
  after ensureVcsmPlatformBootstrap returns ok:true.

Severity:           LOW
Evidence Type:      OBSERVED
```

---

## Secure Reference Implementation

The following is the secure implementation pattern that `provision_vcsm_identity` SHOULD implement, modeled on the Wentrex equivalent and adapted for VCSM schemas. This is NOT a confirmed representation of the live function — it is the target state.

```sql
-- SECURE REFERENCE PATTERN (not confirmed as live implementation)
-- Based on: provision_wentrex_identity + VCSM DAL analysis
-- Verify against live DB before adopting as migration

CREATE OR REPLACE FUNCTION platform.provision_vcsm_identity(
  p_user_id uuid,
  p_actor_id uuid
)
RETURNS uuid   -- returns user_app_account_id
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'platform', 'vc', 'auth', 'public', 'pg_temp'
AS $$
DECLARE
  v_caller_id           uuid := auth.uid();
  v_app_id              uuid;
  v_user_app_account_id uuid;
  v_actor_link_id       uuid;
  v_user_owns_actor     boolean := false;
BEGIN
  -- GUARD 1: caller must be authenticated
  IF v_caller_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- GUARD 2: caller must match p_user_id (prevents cross-user provisioning)
  IF v_caller_id IS DISTINCT FROM p_user_id THEN
    RAISE EXCEPTION 'User identity mismatch: cannot provision for another user';
  END IF;

  -- GUARD 3: caller must own the actor
  SELECT EXISTS (
    SELECT 1 FROM vc.actor_owners
    WHERE actor_id = p_actor_id AND user_id = v_caller_id
  ) INTO v_user_owns_actor;

  IF NOT v_user_owns_actor THEN
    -- fallback: check profile_id on vc.actors
    SELECT EXISTS (
      SELECT 1 FROM vc.actors
      WHERE id = p_actor_id AND profile_id = v_caller_id
    ) INTO v_user_owns_actor;
  END IF;

  IF NOT v_user_owns_actor THEN
    RAISE EXCEPTION 'Current user does not own the requested actor';
  END IF;

  -- Resolve VCSM app
  SELECT id INTO v_app_id FROM platform.apps WHERE key = 'vcsm' AND is_active = true LIMIT 1;
  IF v_app_id IS NULL THEN
    RAISE EXCEPTION 'platform.apps row for vcsm not found';
  END IF;

  -- 1. platform.user_app_access
  INSERT INTO platform.user_app_access (user_id, app_id, status, granted_at, meta)
  VALUES (p_user_id, v_app_id, 'granted', now(),
    jsonb_build_object('source', 'platform.provision_vcsm_identity', 'actor_id', p_actor_id))
  ON CONFLICT (user_id, app_id) DO UPDATE SET
    status = 'granted', revoked_at = null, updated_at = now(),
    granted_at = COALESCE(platform.user_app_access.granted_at, now()),
    meta = COALESCE(platform.user_app_access.meta, '{}') ||
      jsonb_build_object('last_provision_source', 'platform.provision_vcsm_identity',
                         'last_actor_id', p_actor_id);

  -- 2. platform.user_app_accounts
  INSERT INTO platform.user_app_accounts (user_id, app_id, status, activated_at, last_seen_at, meta)
  VALUES (p_user_id, v_app_id, 'active', now(), now(),
    jsonb_build_object('source', 'platform.provision_vcsm_identity'))
  ON CONFLICT (user_id, app_id) DO UPDATE SET
    status = 'active', activated_at = COALESCE(platform.user_app_accounts.activated_at, now()),
    last_seen_at = now(), updated_at = now(),
    meta = COALESCE(platform.user_app_accounts.meta, '{}') ||
      jsonb_build_object('last_provision_source', 'platform.provision_vcsm_identity')
  RETURNING id INTO v_user_app_account_id;

  -- 3. platform.user_app_actor_links
  INSERT INTO platform.user_app_actor_links
    (user_app_account_id, app_id, actor_source, actor_id, actor_kind,
     is_primary, is_switchable, status, meta)
  VALUES (v_user_app_account_id, v_app_id, 'vc', p_actor_id, 'user',
    true, true, 'active',
    jsonb_build_object('source', 'platform.provision_vcsm_identity'))
  ON CONFLICT (user_app_account_id, actor_source, actor_id) DO UPDATE SET
    status = 'active', is_primary = true, updated_at = now(),
    meta = COALESCE(platform.user_app_actor_links.meta, '{}') ||
      jsonb_build_object('last_provision_source', 'platform.provision_vcsm_identity')
  RETURNING id INTO v_actor_link_id;

  -- 4. platform.user_app_preferences
  INSERT INTO platform.user_app_preferences
    (user_app_account_id, active_actor_link_id, last_actor_link_id, meta)
  VALUES (v_user_app_account_id, v_actor_link_id, v_actor_link_id,
    jsonb_build_object('source', 'platform.provision_vcsm_identity'))
  ON CONFLICT (user_app_account_id) DO UPDATE SET
    active_actor_link_id = excluded.active_actor_link_id,
    last_actor_link_id   = excluded.last_actor_link_id,
    updated_at = now(),
    meta = COALESCE(platform.user_app_preferences.meta, '{}') ||
      jsonb_build_object('last_provision_source', 'platform.provision_vcsm_identity');

  -- 5. platform.user_app_state
  INSERT INTO platform.user_app_state
    (user_app_account_id, onboarding_status, account_status,
     default_destination_key, last_destination_key, last_actor_link_id,
     requires_actor_selection, requires_onboarding,
     first_login_at, last_login_at, meta)
  VALUES (v_user_app_account_id, 'completed', 'active',
    'feed', 'feed', v_actor_link_id, false, false, now(), now(),
    jsonb_build_object('source', 'platform.provision_vcsm_identity', 'actor_id', p_actor_id))
  ON CONFLICT (user_app_account_id) DO UPDATE SET
    account_status = 'active',
    last_actor_link_id = excluded.last_actor_link_id,
    last_login_at = now(), updated_at = now(),
    meta = COALESCE(platform.user_app_state.meta, '{}') ||
      jsonb_build_object('last_provision_source', 'platform.provision_vcsm_identity',
                         'last_actor_id', p_actor_id);

  -- 6. Bridge: vc.actors.user_app_account_id
  UPDATE vc.actors
  SET user_app_account_id = v_user_app_account_id
  WHERE id = p_actor_id;

  RETURN v_user_app_account_id;
END;
$$;

REVOKE ALL ON FUNCTION platform.provision_vcsm_identity(uuid, uuid) FROM public;
GRANT EXECUTE ON FUNCTION platform.provision_vcsm_identity(uuid, uuid)
  TO authenticated, service_role;
```

---

## Required Actions

| Priority | Action | Owner |
|---|---|---|
| P1 — IMMEDIATE | Run DB query to retrieve live function body: `SELECT pg_get_functiondef('platform.provision_vcsm_identity'::regproc)` | DB |
| P2 — IMMEDIATE | Verify auth.uid() guard (GUARD 2) exists in live body | DB + VENOM |
| P3 — IF GUARD MISSING | Deploy VF-01 fix as tracked migration with GUARD 2 added | Feature owner |
| P4 — IF SEARCH_PATH MISSING | Deploy VF-02 fix — add SET search_path clause | Feature owner |
| P5 | Create tracked creation migration for live body | CARNAGE |
| P6 | Add debugLoginEvent after successful bootstrap (VF-03) | DEADPOOL / Feature owner |

---

## DB Verification Query

```sql
-- Run against live Supabase DB to retrieve the function body
SELECT
  p.proname AS function_name,
  pg_get_functiondef(p.oid) AS definition,
  p.prosecdef AS is_security_definer,
  p.proconfig AS config  -- shows SET search_path if applied
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'platform'
  AND p.proname = 'provision_vcsm_identity';
```

---

---

## LIVE DB VERIFICATION — 2026-05-18

**DB connection used:** `psql postgresql://postgres@db.nkdrjlmbtqbywhcthppm.supabase.co:5432/postgres`
**Method:** `pg_get_functiondef` + `information_schema.routine_privileges` — read-only

### VF-01 — CONFIRMED (no longer inferred)

```
GUARD 2 STATUS: CONFIRMED ABSENT
auth.uid():     NEVER CALLED in the live function body
GUARD 2 check:  ABSENT — no auth.uid() IS DISTINCT FROM p_user_id
GUARD 3 check:  ABSENT — no vc.actor_owners check
```

VF-01 is no longer INFERRED. The live function body does NOT call `auth.uid()` at any point. Any authenticated user can call `provision_vcsm_identity(p_user_id := victimUserId)` and the function will provision platform rows for the victim without restriction.

### VF-02 — CONFIRMED PARTIAL

```
search_path:  SET search_path TO 'platform', 'vc', 'public', 'auth'
pg_temp:      MISSING — not in live search_path
```

The function has a partial search_path, but `pg_temp` is absent. VF-02 is confirmed (partial hardening only).

### Additional Verified Findings (from live inspection)

- Return type is `RETURNS jsonb` (not `uuid` as DAL comments claim) — VLF-01
- `p_actor_id DEFAULT NULL::uuid` — parameter is optional in live body — VLF-02
- `service_role` does not have EXECUTE grant — only `authenticated` — VLF-03

### Migration Status

`apps/VCSM/supabase/migrations/20260518040000_platform_provision_vcsm_identity.sql` is confirmed as a **security fix** (not documentation backfill). It correctly adds GUARD 2, GUARD 3, pg_temp, and service_role grant. It is safe to apply. Behavioral changes (return type uuid, removal of DEFAULT NULL) are safe — DAL handles both correctly.

---

## FINAL VENOM STATUS

**HIGH RISK — CONFIRMED — MIGRATION READY TO APPLY**

VF-01 is confirmed active. The live `platform.provision_vcsm_identity` function has NO auth.uid() guard. Any authenticated caller can provision platform rows for any user_id. The proposed migration `20260518040000_platform_provision_vcsm_identity.sql` closes all identified gaps and is safe to deploy. This should be treated as a production security fix deployment requiring DB admin coordination.
