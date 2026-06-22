# DB Governance Review — VCSM Identity DAL
_Date:_ 2026-05-18
_Command:_ DB
_Scope:_ STRICT READ-ONLY — no schema changes, no migrations executed, no grants applied
_Application Scope:_ VCSM (primary) + WENTREX (comparison only)
_Triggered by:_ Session governance audit — identity DAL system review
_Input document:_ `zNOTFORPRODUCTION/_CANONICAL/logan/vcsm/dal/vcsm.dal.identity.md`

---

## Boundary Contract

**Contract loaded:** `zNOTFORPRODUCTION/_CANONICAL/zcontract/PROJECT_BOUNDARY_ISOLATION_CONTRACT.md`

Protected roots enforced:
- `/Users/vcsm/Desktop/VCSM/apps/VCSM` — primary scope
- `/Users/vcsm/Desktop/VCSM/apps/wentrex` — comparison read-only
- `/Users/vcsm/Desktop/VCSM/apps/Traffic` — not in scope
- `/Users/vcsm/Desktop/VCSM/engines` — read-only for engine cache analysis

All analysis remained within approved scope. No schema mutations executed.

---

---

## LIVE DB VERIFICATION — 2026-05-18 (Addendum)

**Status: VERIFIED from live database**
Connection: `psql postgresql://postgres@db.nkdrjlmbtqbywhcthppm.supabase.co:5432/postgres`
Method: Read-only `pg_get_functiondef` + `information_schema.routine_privileges`

### platform.provision_vcsm_identity — Verified Live State

```
Signature:    provision_vcsm_identity(p_user_id uuid, p_actor_id uuid DEFAULT NULL::uuid)
Return type:  RETURNS jsonb    ← NOT uuid as DAL comments claim
SECURITY DEFINER: YES
search_path:  SET search_path TO 'platform', 'vc', 'public', 'auth'
              (missing 'pg_temp' — partially hardened)
auth.uid():   NEVER CALLED — ABSENT from body
GUARD 1:      if p_user_id is null then raise exception  (parameter null check only — not auth check)
GUARD 2:      ABSENT — no auth.uid() == p_user_id check
GUARD 3:      ABSENT — no vc.actor_owners or ownership check
```

**Grants:**

| Grantee | Privilege | Is Grantable |
|---|---|---|
| authenticated | EXECUTE | NO |
| postgres | EXECUTE | YES (owner) |
| service_role | — | NOT GRANTED |

### identity.refresh_actor_directory_row — Verified Live State

```
Signature:    refresh_actor_directory_row(p_actor_domain text, p_actor_id uuid)
Return type:  RETURNS identity.actor_directory
SECURITY DEFINER: YES
search_path:  SET search_path TO 'identity', 'vc', 'learning', 'vport', 'public', 'pg_temp'
              FULLY HARDENED ✓
auth.uid():   Not applicable — no caller identity concern
```

### Confirmed DRI Status Updates

| DRI | Previous Status | Verified Status |
|---|---|---|
| DRI-01 GUARD 2 (MW-01) | UNVERIFIED | **CONFIRMED ABSENT — active vulnerability** |
| DRI-02 search_path | UNVERIFIED | **CONFIRMED PARTIAL** — `pg_temp` missing |
| DRI-06 refresh_actor_directory_row search_path | VERIFIED PASS | **CONFIRMED PASS** ✓ |

### New VERIFIED Findings (from live inspection)

**VLF-01 (HIGH — NEW):** Return type is `RETURNS jsonb`, not `uuid`. The DAL file `provision.rpc.dal.js` comments say `→ uuid` and JSDoc says `@returns {Promise<string>} user_app_account_id`. This is incorrect. The live function returns `jsonb_build_object('ok', true, 'user_app_account_id', v_user_app_account_id, 'actor_id', v_actor_id, ...)`. The DAL does `return data` which currently returns the full jsonb object. The controller stores this in a variable named `userAppAccountId` — but it is actually the full result object. The proposed migration changes this to `RETURNS uuid` which would be correct and would fix this mismatch.

**VLF-02 (MEDIUM — NEW):** `p_actor_id DEFAULT NULL::uuid` — the live function's second parameter is OPTIONAL. When `NULL`, the function falls back to `SELECT a.id FROM vc.actors a WHERE a.kind = 'user' AND a.profile_id = p_user_id LIMIT 1`. The proposed migration removes this default, making `p_actor_id` required. The DAL already requires both parameters (throws if missing), so removing the default is safe in practice.

**VLF-03 (LOW — NEW):** `service_role` has no explicit EXECUTE grant on `provision_vcsm_identity`. Only `authenticated` and `postgres` (owner) have grants. The proposed migration adds `GRANT EXECUTE TO authenticated, service_role`. Current browser callers use `authenticated` JWT — no runtime impact today, but the gap should be closed.

**VLF-04 (LOW — NEW):** Live `user_app_accounts` upsert does NOT update `last_seen_at`. The live `user_app_state` upsert correctly updates `last_login_at`. The proposed migration adds `last_seen_at = now()` to accounts. Minor behavioral addition.

### Migration Reconciliation Analysis

The proposed migration `20260518040000_platform_provision_vcsm_identity.sql` is a **BEHAVIORAL REPLACEMENT**, not a documentation backfill. Key differences from live body:

| Aspect | Live Body | Proposed Migration | Impact |
|---|---|---|---|
| Return type | `RETURNS jsonb` | `RETURNS uuid` | **Safe to apply** — DAL returns `data` directly; uuid makes DAL comments correct |
| `p_actor_id` | `DEFAULT NULL::uuid` | Required — no default | **Safe to apply** — DAL always passes actorId |
| GUARD 2 | ABSENT | Added — `auth.uid() IS DISTINCT FROM p_user_id` | **Security fix** — required |
| GUARD 3 | ABSENT | Added — `vc.actor_owners` check | **Security fix** — required |
| search_path | `'platform', 'vc', 'public', 'auth'` | `'platform', 'vc', 'auth', 'public', 'pg_temp'` | **Hardening** — adds pg_temp |
| service_role grant | Missing | Added | **Gap closure** |
| Actor fallback | Auto-resolve if actorId null | No fallback — GUARD 3 blocks | Behavioral change — acceptable given DAL requires actorId |
| `last_seen_at` | Not tracked | Added to accounts upsert | Minor addition |

**Conclusion:** The migration is safe to apply. It should be classified as a **security fix + hardening deployment**, not a documentation backfill. Applying it will:
1. Close VF-01 (GUARD 2 added)
2. Close VF-02 (pg_temp added to search_path)
3. Close VLF-01 (return type corrected to uuid)
4. Close VLF-02 (DEFAULT NULL removed — acceptable)
5. Close VLF-03 (service_role grant added)
6. Fix DAL documentation mismatch (return type)

---

## DB COMMAND TARGET

```text
DB TARGET
Primary RPCs:      platform.provision_vcsm_identity(p_user_id uuid, p_actor_id uuid)
                   identity.refresh_actor_directory_row(p_actor_domain text, p_actor_id uuid)
Application Scope: VCSM
Trust surface:     SECURITY DEFINER — elevated privilege writes to 6 platform objects
Read mode:         STRICT READ-ONLY — evidence only, no SQL executed
MW-01 priority:    HIGHEST — auth.uid() guard unverified in SECURITY DEFINER RPC
```

---

## Evidence Verification Matrix

Evidence status definitions used in this report:

| Status | Meaning |
|---|---|
| VERIFIED | Directly confirmed from codebase inspection or migration file |
| ASSUMED | Inferred from pattern consistency — not directly confirmed |
| UNVERIFIED | Cannot be confirmed from codebase alone; requires live DB query |
| STALE | Previously documented but may no longer reflect live state |
| GOVERNANCE GAP | No migration, no doc, no tracked history — gap in audit trail |

---

## VCSM vs Wentrex RPC Hardening Comparison

This is a required comparison per command spec. Wentrex's `provision_wentrex_identity` is the secure reference implementation.

| Property | VCSM `provision_vcsm_identity` | Wentrex `provision_wentrex_identity` | Gap |
|---|---|---|---|
| Creation migration | NONE — GOVERNANCE GAP | `20260331020000_platform_grants_and_provision_rpc.sql` | VCSM lacks tracked creation |
| Signature | `(p_user_id uuid, p_actor_id uuid)` — user_id supplied by caller | `(p_actor_id uuid, p_organization_id uuid)` — no user_id param | HIGH RISK: VCSM accepts explicit user_id |
| `auth.uid()` guard | UNVERIFIED — function body not in codebase | VERIFIED: `v_user_id := auth.uid()` — user cannot supply user_id | VCSM guard unverified |
| Caller identity check (GUARD 2) | UNVERIFIED | N/A — user_id never accepted as param | VCSM gap |
| Actor ownership check | UNVERIFIED | VERIFIED: 3 checks (learning.actor_owners, vc.actor_owners, actor.user_id) | VCSM ownership check unverified |
| `SET search_path` | NOT in secdef_a hardening pass — UNVERIFIED | `set search_path = platform, learning, vc, auth, public` — VERIFIED | VCSM not hardened |
| Return type | `uuid` (user_app_account_id) | `jsonb` | Inconsequential difference |
| Grant pattern | Not tracked — GOVERNANCE GAP | `REVOKE ALL FROM public; GRANT EXECUTE TO authenticated, service_role` | VCSM grant history gap |
| In secdef_a hardening | NO — NOT listed | N/A (Wentrex has own migration) | VCSM not hardened by pass |
| Idempotent upserts | ASSUMED — proposed migration has ON CONFLICT DO UPDATE | VERIFIED: ON CONFLICT DO UPDATE for all tables | VCSM assumed only |
| Objects written | 6 (access, accounts, actor_links, preferences, state, vc.actors) | Similar set | Comparable surface |
| Proposed fix migration | `20260518040000_platform_provision_vcsm_identity.sql` — pending DB verification | Complete tracked creation | VCSM fix pending |

**Summary:** Wentrex is the secure reference. VCSM lacks: (1) creation migration, (2) confirmed auth.uid() guard, (3) confirmed search_path hardening, (4) confirmed actor ownership check. All four are resolvable by the proposed migration once the live body is verified.

---

## DATABASE REVIEW ITEMS

---

### DRI-01 — MW-01 (HIGHEST PRIORITY)

```text
DATABASE REVIEW ITEM
Item ID:          DRI-01
Priority:         HIGHEST — MW-01 release blocker
Surface:          platform.provision_vcsm_identity(p_user_id uuid, p_actor_id uuid)
Schema:           platform
Trust level:      SECURITY DEFINER — bypasses all RLS, writes to 6 objects
Evidence Status:  UNVERIFIED

Finding:
  The VCSM platform provisioning RPC takes p_user_id as an explicit caller-supplied
  parameter. The Wentrex equivalent derives user_id entirely from auth.uid() internally
  and never accepts a caller-supplied user_id.

  The live function body for platform.provision_vcsm_identity is NOT present in the
  codebase — no SQL dump, no DB snapshot, no tracked creation migration exists.

  The proposed migration (20260518040000_platform_provision_vcsm_identity.sql) adds
  three security guards, but it has NOT been applied or verified against the live DB.

  The critical question is:
    Does the LIVE function body contain:
    GUARD 1: IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'
    GUARD 2: IF auth.uid() IS DISTINCT FROM p_user_id THEN RAISE EXCEPTION '...'
    GUARD 3: actor ownership check via vc.actor_owners

  If GUARD 2 is absent:
  - Any authenticated user can call provision_vcsm_identity with ANY p_user_id
  - SECURITY DEFINER elevation bypasses all RLS
  - Platform rows (user_app_access, user_app_accounts, user_app_actor_links,
    user_app_preferences, user_app_state) can be created/overwritten for any user
  - The vc.actors.user_app_account_id bridge column can be set for any actor
  - Result: identity injection — attacker provisions victim's platform identity

Attack path (if GUARD 2 absent):
  1. Attacker authenticates as User A
  2. Attacker calls: supabase.schema('platform').rpc('provision_vcsm_identity',
     { p_user_id: victimUserId, p_actor_id: attackerActorId })
  3. Victim's platform rows created/overwritten with attacker's actor
  4. On victim's next login: engine resolves attacker's actor as victim's identity

Severity:         HIGH (SECURITY DEFINER identity injection if guard absent)
Evidence Type:    UNVERIFIED — requires live DB verification

Required action (TEXT ONLY — DO NOT EXECUTE):
  Run this query in the Supabase SQL editor to retrieve the live function body:

  SELECT
    p.proname AS function_name,
    pg_get_functiondef(p.oid) AS definition,
    p.prosecdef AS is_security_definer,
    p.proconfig AS config
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'platform'
    AND p.proname = 'provision_vcsm_identity';

  If GUARD 2 is confirmed present in the live body:
    Apply 20260518040000_platform_provision_vcsm_identity.sql as documentation backfill only.
    Change MW-01 status to VERIFIED.

  If GUARD 2 is absent in the live body:
    Apply 20260518040000_platform_provision_vcsm_identity.sql as a security fix.
    This is a production security deployment — coordinate with DB admin.

Cross-reference:
  VENOM: VF-01 (HIGH) in 2026-05-18_venom_identity-provision-rpc-security.md
  CARNAGE: MW-01 in 2026-05-18_carnage_identity-rpc-migration-ownership.md
  Proposed fix: apps/VCSM/supabase/migrations/20260518040000_platform_provision_vcsm_identity.sql
```

---

### DRI-02

```text
DATABASE REVIEW ITEM
Item ID:          DRI-02
Priority:         MEDIUM
Surface:          platform.provision_vcsm_identity — SET search_path
Schema:           platform
Trust level:      SECURITY DEFINER
Evidence Status:  UNVERIFIED (absence from secdef_a is strong evidence of non-hardening)

Finding:
  The 2026-05-10 search_path hardening pass (secdef_a_search_path_hardening.sql)
  applied SET search_path to all known SECURITY DEFINER functions in the
  identity schema. The platform schema was NOT included in that pass.

  platform.provision_vcsm_identity does NOT appear in secdef_a — this is
  high-confidence evidence that the function's search_path was not hardened
  at that time. The live body must be verified to confirm current state.

  An unhardened search_path in a SECURITY DEFINER function allows
  search_path injection: if a malicious schema appears before the intended
  schemas in the DB-level search_path, table lookups may resolve to attacker
  objects instead of the intended platform/vc tables.

  Risk is reduced (not eliminated) because callers are authenticated browser
  clients, not direct DB shell access.

Severity:         MEDIUM
Evidence Type:    INFERRED — absence from secdef_a + no codebase body confirmation

Required action (TEXT ONLY — DO NOT EXECUTE):
  Verify via pg_proc.proconfig in the DRI-01 DB query (proconfig shows SET
  search_path if applied). If null or missing, the proposed migration
  20260518040000_platform_provision_vcsm_identity.sql adds:
    SET search_path = 'platform', 'vc', 'auth', 'public', 'pg_temp'

Cross-reference:
  VENOM: VF-02 (MEDIUM) in 2026-05-18_venom_identity-provision-rpc-security.md
  Proposed fix: apps/VCSM/supabase/migrations/20260518040000_platform_provision_vcsm_identity.sql
```

---

### DRI-03

```text
DATABASE REVIEW ITEM
Item ID:          DRI-03
Priority:         MEDIUM
Surface:          platform.provision_vcsm_identity — migration ownership
Schema:           platform
Evidence Status:  GOVERNANCE GAP

Finding:
  platform.provision_vcsm_identity has no tracked creation migration in
  apps/VCSM/supabase/migrations/. The Wentrex equivalent has a complete
  tracked creation in 20260331020000_platform_grants_and_provision_rpc.sql.

  Evidence of untracked history:
  - 20260503052543_fix_missing_authenticated_grants.sql explicitly states:
    "pre-CLI archive migrations (20260416140000, 20260419150000) that
    originally issued these GRANTs were applied manually via the SQL editor
    and were never tracked"
  - This confirms the platform schema has a history of manual untracked SQL.
  - provision_vcsm_identity was likely created via the same untracked path.

  The function's signature evolved from 1-param (provision_vcsm_identity(uuid))
  to 2-param (provision_vcsm_identity(p_user_id uuid, p_actor_id uuid)) at an
  unknown point. No migration captures this evolution.

  The proposed migration 20260518040000_platform_provision_vcsm_identity.sql
  is a governance backfill. It captures the intended authoritative implementation
  with security hardening applied. It must not be applied until the live body
  is verified (DRI-01).

Impact:
  - No auditable history of when function was created or modified
  - No way to replay schema from migrations alone
  - Deployment ordering is unknown relative to other schema objects

Severity:         MEDIUM (governance audit trail gap — no active runtime risk today)

Required action (TEXT ONLY — DO NOT EXECUTE):
  After DRI-01 DB verification:
  1. If live body matches proposed migration: apply as documentation backfill only.
  2. If live body differs: reconcile differences, update proposed migration if needed,
     then apply as the authoritative tracked implementation.
  3. Mark CARNAGE MW-01 as RESOLVED after migration is applied.
```

---

### DRI-04

```text
DATABASE REVIEW ITEM
Item ID:          DRI-04
Priority:         LOW
Surface:          platform.provision_vcsm_identity — old 1-param overload
Schema:           platform
Evidence Status:  UNVERIFIED

Finding:
  The VCSM RPC signature evolved from provision_vcsm_identity(uuid) to
  provision_vcsm_identity(p_user_id uuid, p_actor_id uuid). The old 1-param
  overload's fate is unknown — it may still exist in the DB as a separate
  overload if it was never explicitly dropped.

  PostgreSQL allows multiple overloads of the same function name with
  different parameter lists. If the old overload still exists:
  - It may have different (older, less hardened) security properties
  - It may be callable by authenticated clients via the old signature
  - It would not be covered by the current REVOKE/GRANT pattern which
    targets the 2-param signature specifically

  The proposed migration includes:
    DROP FUNCTION IF EXISTS platform.provision_vcsm_identity(uuid);
  This clears the 1-param overload if it exists.

Severity:         LOW — conditional risk (depends on whether old overload exists)

Required action (TEXT ONLY — DO NOT EXECUTE):
  Run this query to check for old overloads:

  SELECT proname, pg_get_function_arguments(oid) AS args, prosecdef, proconfig
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'platform' AND p.proname = 'provision_vcsm_identity';

  If only one row (2-param): old overload does not exist, DROP IF EXISTS is a no-op.
  If two rows: old overload exists and must be dropped before applying proposed migration.
```

---

### DRI-05

```text
DATABASE REVIEW ITEM
Item ID:          DRI-05
Priority:         MEDIUM
Surface:          identity.refresh_actor_directory_row — cross-app coupling without contract
Schema:           identity
Trust level:      SECURITY DEFINER (search_path hardened by secdef_a)
Evidence Status:  GOVERNANCE GAP

Finding:
  identity.refresh_actor_directory_row(p_actor_domain text, p_actor_id uuid) is
  a shared SECURITY DEFINER RPC called by both VCSM and Wentrex applications.

  VCSM caller:    apps/VCSM/src/features/identity/dal/refreshActorDirectory.dal.js
                  → refreshVcActorDirectory(actorId) → domain='vc'
  Wentrex caller: apps/wentrex/src/features/identity/dal/refreshActorDirectory.dal.js
                  → refreshLearningActorDirectory(actorId) → domain='learning'

  Both DAL files are independently maintained in separate app roots. They call
  the same underlying RPC with different domain parameters.

  Risk:
  - A schema change to identity.refresh_actor_directory_row by one app team
    (e.g., adding/removing parameters) would silently break the other app.
  - There is no documented contract governing who owns this RPC, who may
    change it, and what coordination is required.
  - Neither app has a tracked creation migration for this function.

  The search_path was hardened by secdef_a (2026-05-10) — this protects
  both callers from injection. The governance gap is about change coordination,
  not a current runtime security risk.

Severity:         MEDIUM (change-time risk — not a current runtime defect)

Required action (TEXT ONLY — DO NOT EXECUTE):
  Decision required: Is identity.refresh_actor_directory_row:
  Option A: DB-admin-managed — owned by platform, not by either app.
            Both apps call it as a platform utility. Changes coordinated via DB admin.
  Option B: Per-app tracked — each app creates its own tracked creation migration.
            Risk: each app's migration file must stay in sync with the live DB.

  Recommended: Option A with a governance note in the Logan identity DAL docs
  for both VCSM and Wentrex referencing the shared ownership.

Cross-reference: CARNAGE MW-02 in 2026-05-18_carnage_identity-rpc-migration-ownership.md
```

---

### DRI-06

```text
DATABASE REVIEW ITEM
Item ID:          DRI-06
Priority:         LOW
Surface:          identity.refresh_actor_directory_row — search_path status
Schema:           identity
Evidence Status:  VERIFIED (via secdef_a hardening migration)

Finding:
  identity.refresh_actor_directory_row IS listed in
  zNOTFORPRODUCTION/_ACTIVE/migrations/2026-05-10_secdef_a_search_path_hardening.sql.

  The hardening applied:
    ALTER FUNCTION identity.refresh_actor_directory_row(p_actor_domain text, p_actor_id uuid)
    SET search_path = 'identity', 'vc', 'learning', 'vport', 'public', 'pg_temp'

  This function is correctly hardened. No remediation needed.

Severity:         LOW — informational, VERIFIED state
Status:           PASS
```

---

### DRI-07

```text
DATABASE REVIEW ITEM
Item ID:          DRI-07
Priority:         LOW
Surface:          identity.refresh_actor_directory_row — no creation migration
Schema:           identity
Evidence Status:  GOVERNANCE GAP

Finding:
  identity.refresh_actor_directory_row has no tracked creation migration in
  apps/VCSM/supabase/migrations/ OR apps/wentrex/supabase/migrations/.

  The function's search_path was retroactively hardened by secdef_a (2026-05-10).
  The original creation state is unknown.

  This is a lower-severity gap than DRI-03 because:
  - The function has no caller-supplied identity parameters (no user_id risk)
  - The search_path is now confirmed hardened
  - The function is read-mostly (refreshes a materialized directory row)

  A governance creation migration would be needed only if the DB needs to be
  fully reproducible from migrations alone.

Severity:         LOW — governance audit trail gap only
```

---

### DRI-08

```text
DATABASE REVIEW ITEM
Item ID:          DRI-08
Priority:         LOW
Surface:          platform schema grant history
Schema:           platform
Evidence Status:  VERIFIED (via 20260503052543_fix_missing_authenticated_grants.sql)

Finding:
  The comment in 20260503052543_fix_missing_authenticated_grants.sql explicitly states:

    "pre-CLI archive migrations (20260416140000, 20260419150000) that originally
    issued these GRANTs were applied manually via the SQL editor and were never tracked"

  This confirms that:
  1. USAGE ON SCHEMA platform TO authenticated was granted manually (untracked)
  2. SELECT ON platform.v_user_app_context TO authenticated was granted manually
  3. The retroactive fix migration re-applied these grants in a tracked way
  4. The platform schema provisioning surface has an untracked historical grant path

  Runtime impact: NONE — the retroactive migration applied all missing grants.
  Governance impact: confirms that early platform schema SQL was applied outside
  the migration CLI, which means the full schema cannot be reproduced from
  migrations alone for the 2026-04-16 to 2026-05-03 period.

Severity:         LOW — historical governance record only; grants are now applied
Status:           DOCUMENTED (retroactive fix in place)
```

---

### DRI-09

```text
DATABASE REVIEW ITEM
Item ID:          DRI-09
Priority:         LOW
Surface:          Cache co-invalidation — LF-01 (identity engine + React Query)
Application:      VCSM
Evidence Status:  VERIFIED — LF-01 concern resolved for happy path

Finding:
  LF-01 opened a concern about whether both identity caches are co-invalidated
  on actor switch. This item documents the verification result.

  Cache 1: Engine _resultCache (120s TTL)
  Location: engines/identity/src/controller/resolveAuthenticatedContext.controller.js
  Invalidated by: invalidateIdentityResultCache() — called from switchActiveActor.controller.js
  Status: BUSTED on every actor switch ✓

  Cache 2: React Query identityEngineQueryKey (120s staleTime)
  Location: apps/VCSM/src/state/identity/queries/identityEngineQuery.js
  Invalidated by: invalidateIdentityEngineQuery(queryClient, userId) — called from
                  identityContext.jsx:switchActor() line 92 on result.success
  Status: BUSTED on successful actor switch ✓

  Both caches are co-invalidated on a successful switch. LF-01 is RESOLVED.

  Residual edge case (LOW):
  If switchActiveActor succeeds in the engine layer (platform write OK → engine
  cache busted) but domain hydration fails (nextIdentity = null), the React Query
  cache is NOT busted (invalidateIdentityEngineQuery is inside `if result.success`
  conditional). For the duration of the RQ staleTime, the RQ cache may still reflect
  the old active actor. This is a VERY narrow window and requires a partial failure
  in a non-critical code path.

  No remediation required unless this edge case is observed in production.

Severity:         LOW — happy path verified; edge case documented
Status:           LF-01 RESOLVED (happy path); edge case WATCH
```

---

### DRI-10

```text
DATABASE REVIEW ITEM
Item ID:          DRI-10
Priority:         LOW
Surface:          Debug logging contract violations — identity feature files
Application:      VCSM + WENTREX
Evidence Status:  VERIFIED

Finding:
  The project debug logging contract (memory: feedback_debug_logging.md) states:
  "No console.log; debug output must render on screen and be dev-only (never production)"

  The following files contain console.log/console.warn/console.error output that
  violates this contract:

  VCSM files:
  - apps/VCSM/src/features/identity/dal/refreshActorDirectory.dal.js
    Lines: console.warn('[refreshActorDirectory] missing...') — DEV-gated ✓
           console.warn('[refreshActorDirectory] RPC failed...') — DEV-gated ✓
           console.warn('[refreshActorDirectory] unexpected error...') — DEV-gated ✓
  - apps/VCSM/src/features/identity/controller/ensureVcsmPlatformBootstrap.controller.js
    Line: console.warn('[VCSM identity] Platform bootstrap failed...') — DEV-gated ✓
  - apps/VCSM/src/state/identity/controller/switchActor.controller.js
    Line 173: console.error("[Identity] failed to switch actor", error) — NOT DEV-gated ✗
              (production-visible error log)

  Wentrex files (informational — different app scope):
  - apps/wentrex/src/features/identity/dal/refreshActorDirectory.dal.js
    Lines: console.warn — DEV-gated ✓

  The most significant violation is switchActor.controller.js line 173:
    console.error("[Identity] failed to switch actor", error)
  This is NOT gated by import.meta.env.DEV and will emit to production console.
  This is the ONLY production-visible raw console call in the identity feature.
  All others are correctly DEV-gated.

  Note: DEV-gated console.warn/log still violate the debug logging contract
  because they output to browser DevTools instead of the identity debugger panel.
  These should route to debugLoginEvent/debugLoginError. This is RISK-10 (open).

Severity:         LOW (RISK-10 open; production-visible only for the switch catch block)

Required action:
  - switchActor.controller.js line 173: Remove or gate the console.error.
    The dbg.error() call on the preceding line is the correct pattern.
  - All other DEV-gated console.warn calls: route to debugLoginEvent/debugLoginError
    in a follow-up pass (RISK-10).

Cross-reference: RISK-10 (open) in vcsm.dal.identity.md Required Next Commands
```

---

## VCSM Identity DAL — Caller Chain Verification

Verified all callers of `platform.provision_vcsm_identity` pass through approved adapter boundaries.

| Caller | Path | Boundary Status |
|---|---|---|
| `identitySelfHeal.controller.js` | via `identityOps.adapter.js` | COMPLIANT |
| `vport.core.dal.js` | via `identityOps.adapter.js` | COMPLIANT |
| `useAuthOnboarding.js` | via `identity.adapter.js` + `useIdentityOps()` | COMPLIANT |
| `useJoinBarbershop.js` | via `identity.adapter.js` + `useIdentityOps()` | COMPLIANT |
| `onboarding.controller.js` | receives `ensureVcsmPlatformBootstrap` as DI param | COMPLIANT |
| `bootstrapJoinOnboardingController` | receives `ensureVcsmPlatformBootstrap` as DI param | COMPLIANT |
| `useProfileController.js` | via `useIdentityOps()` | COMPLIANT |
| `useUpdateVportVisibility.js` | via `useIdentityOps()` | COMPLIANT |

No direct imports of `provision.rpc.dal.js` outside the feature boundary. Adapter pattern holds.

---

## DB Status Summary

| DRI | Surface | Priority | Evidence Status | Action Required |
|---|---|---|---|---|
| DRI-01 | `provision_vcsm_identity` auth.uid() guard | HIGHEST — MW-01 | UNVERIFIED | Run DB verification query |
| DRI-02 | `provision_vcsm_identity` search_path | MEDIUM | UNVERIFIED | Verify via pg_proc.proconfig |
| DRI-03 | `provision_vcsm_identity` creation migration | MEDIUM | GOVERNANCE GAP | Apply proposed migration after DRI-01 |
| DRI-04 | Old 1-param overload fate | LOW | UNVERIFIED | Check overload count in DB |
| DRI-05 | `refresh_actor_directory_row` cross-app coupling | MEDIUM | GOVERNANCE GAP | Governance decision: DB-admin vs per-app |
| DRI-06 | `refresh_actor_directory_row` search_path | LOW | VERIFIED PASS | No action |
| DRI-07 | `refresh_actor_directory_row` creation migration | LOW | GOVERNANCE GAP | Low priority — address in next schema audit |
| DRI-08 | Platform schema grant history | LOW | VERIFIED (retroactive fix applied) | No action |
| DRI-09 | Cache co-invalidation LF-01 | LOW | VERIFIED RESOLVED | No action; edge case watch only |
| DRI-10 | Debug logging contract violations | LOW | VERIFIED | Fix switchActor console.error; RISK-10 pass |

---

## Handoff Matrix

| Finding | Priority | Recommended Handoff | Reason |
|---|---|---|---|
| DRI-01 (MW-01) | HIGHEST | DB admin + VENOM | Live DB query required to retrieve function body |
| DRI-02 | MEDIUM | DB admin | search_path confirmed via pg_proc.proconfig in same query |
| DRI-03 | MEDIUM | Feature owner + CARNAGE | Apply migration after DB verification |
| DRI-04 | LOW | DB admin | Check overload count in DRI-01 query |
| DRI-05 | MEDIUM | Logan + IRONMAN | Governance decision on cross-app RPC ownership |
| DRI-06 | LOW | — | No action |
| DRI-07 | LOW | CARNAGE (next audit cycle) | Low priority governance tracking |
| DRI-08 | LOW | — | Documented; retroactive fix already applied |
| DRI-09 | LOW | — | LF-01 resolved; edge case watch |
| DRI-10 | LOW | Feature owner (RISK-10) | Fix production console.error; route DEV logs to debugger |

---

## FINAL DB STATUS

**CAUTION**

The VCSM identity provisioning surface has one unresolved HIGH-priority governance gap (DRI-01 / MW-01): the `platform.provision_vcsm_identity` function body has never been verified from the codebase. Until the live DB query confirms the auth.uid() guard, this SECURITY DEFINER RPC is operating in an unverified trust state.

All app-layer callers, adapter boundaries, and cache invalidation patterns are VERIFIED COMPLIANT. The migration (`20260518040000_platform_provision_vcsm_identity.sql`) is ready to apply once DRI-01 verification completes.

No new blocking code defects were found in the app layer during this review.
