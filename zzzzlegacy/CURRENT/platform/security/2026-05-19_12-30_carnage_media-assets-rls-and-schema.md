# CARNAGE MIGRATION REPORT — `platform.media_assets`

_Date:_ 2026-05-19  
_Application Scope:_ VCSM  
_Triggered by:_ DB audit `2026-05-19_12-00_db_media-assets-rls-audit.md`  
_Upstream context:_ CEREBRO verification pass → VENOM trust boundary audit → DB RLS inspection  
_Authority:_ GOVERNANCE_WRITABLE — no migrations executed; proposals only

---

## Migration Reason

Three issues surfaced from the DB audit:

1. **DB-F1 — Secdef deny-all proposal** in `2026-05-10_secdef_b_zero_policy_tables.sql` must be explicitly blocked from being applied to `platform.media_assets`. The existing owner-scoped RLS is correct and sufficient.
2. **DB-F2 — No UPDATE policy** — soft-delete columns (`deleted_by_actor_id`, `deleted_at`, `status`) exist on the table but owners cannot write them.
3. **DB-F4 — `bucket` is nullable** — always hardcoded to `'post-media'` in the model; schema does not enforce this invariant.

---

## SCHEMA TRUST CLASSIFICATION

| Object | Classification | Reason |
|---|---|---|
| `platform.media_assets` | Ownership-sensitive + Identity-sensitive | Rows are keyed by `owner_actor_id` verified against `vc.actor_owners`; stores all platform media |
| `platform.media_assets.owner_actor_id` | Identity-sensitive | Maps every media row to an actor identity |
| `platform.media_assets` RLS policies | Identity-sensitive + Ownership-sensitive | INSERT/SELECT gated on `vc.actor_owners` join — any policy change directly affects actor identity boundaries |
| `2026-05-10_secdef_b_zero_policy_tables.sql` (deny-all block) | Security-sensitive | If applied, would add a dead policy alongside live ones — creates false confidence |
| `bucket` column | Runtime-critical | Required for Cloudflare R2 retrieval; NULL = unresolvable asset |

---

## CURRENT STRUCTURE

| Object | Purpose | Dependencies |
|---|---|---|
| `platform.media_assets` | Platform-wide media registry — all uploads across all features | `vc.post_media`, `chat.message_attachments`, `wanders.cards`, `vport.profiles`, `public.profiles` FK references |
| `owner_actor_id` NOT NULL | Ownership claim — validated at DB by RLS | `vc.actor_owners` in RLS WITH CHECK |
| `bucket text` (nullable) | Cloudflare R2 bucket name | `mediaAsset.model.js` hardcodes `'post-media'`; `insertMediaAssetDAL` writes it |
| `deleted_by_actor_id`, `deleted_at`, `status` | Lifecycle soft-delete support | No UPDATE policy or GRANT exists — currently write-only from service_role |
| INSERT policy `"actor owner can insert media asset"` | RLS gate — owner must own the actor_id | `vc.actor_owners` |
| SELECT policy `"actor owner can select media asset"` | RLS gate — owner reads own assets | `vc.actor_owners` |
| No UPDATE/DELETE policy | Gap — soft-delete columns unreachable from authenticated client | — |

---

---

# PLAN A — Reject Secdef Deny-All for `platform.media_assets`

## CARNAGE MIGRATION REPORT — Plan A

```
Application Scope: VCSM
Migration reason: Block application of `media_assets_deny_all` policy from secdef file
Migration type: Policy governance decision — no migration SQL to apply
Migration Safety Status: BLOCKED (if applied as-is)
Confidence: HIGH
```

### What the proposal does

```sql
-- From 2026-05-10_secdef_b_zero_policy_tables.sql
DROP POLICY IF EXISTS "media_assets_deny_all" ON platform.media_assets;
CREATE POLICY "media_assets_deny_all"
  ON platform.media_assets
  FOR ALL
  TO authenticated
  USING (false)
  WITH CHECK (false);
```

### Why it must not be applied

**Flaw 1 — Ineffective as written.**  
PostgreSQL RLS with multiple permissive policies uses OR logic. The proposal does NOT drop the existing `"actor owner can insert media asset"` or `"actor owner can select media asset"` policies. When all three coexist:

```
INSERT evaluation:
  "actor owner can insert media asset" WITH CHECK → true (for owner)
  "media_assets_deny_all" WITH CHECK → false
  OR result → true → INSERT allowed

SELECT evaluation:
  "actor owner can select media asset" USING → true (for owner)
  "media_assets_deny_all" USING → false
  OR result → true → SELECT allowed
```

The deny-all would be dead code — it achieves nothing.

**Flaw 2 — Factually incorrect comment.**  
The secdef file states: *"No direct user access needed or appropriate."* This is wrong. Authenticated users explicitly need INSERT and SELECT access to write their own media assets and retrieve them for display. The existing RLS policies reflect the correct intended behavior.

**Flaw 3 — Contradicts the security model.**  
The current policies correctly enforce: `owner_actor_id ∈ vc.actor_owners[auth.uid()]`. This is the standard actor-ownership gate used throughout VCSM. Replacing it with a blanket deny-all would require migrating all media writes to service_role functions — a large scope change that has not been designed, tested, or approved.

### Decision

**DO NOT APPLY the `media_assets_deny_all` proposal to `platform.media_assets`.**

The secdef file should be annotated with an explicit exclusion for this table. The correct action is for the next engineer who reviews `2026-05-10_secdef_b_zero_policy_tables.sql` to see a clear comment explaining why `platform.media_assets` was excluded.

```
Migration Safety Status: BLOCKED
Blocking Risks: Ineffective (OR logic), contradicts correct security model, comment is factually wrong
Required action: None (do not apply). Annotate secdef file with exclusion note (documentation only).
```

### ROLLBACK SURVIVABILITY — Plan A

```
Rollback status: FULL (no migration to roll back — nothing was applied)
Data recovery risk: NONE
Compatibility rollback risk: NONE
Operational complexity: NONE
```

### VALIDATION CHECKLIST — Plan A

| Validation Area | Status | Notes |
|---|---|---|
| Schema compatibility | N/A — no change | — |
| RLS correctness | VERIFIED | Existing INSERT + SELECT policies are correct |
| Secdef file annotation | PENDING | Add comment to secdef file marking `media_assets` as excluded |

---

---

# PLAN B — Add Owner-Scoped UPDATE Policy (Soft-Delete)

## CARNAGE MIGRATION REPORT — Plan B

```
Application Scope: VCSM
Migration reason: Enable owners to soft-delete their own media assets (DB-F2)
Migration type: RLS policy addition + GRANT
Migration Safety Status: CAUTION
Confidence: HIGH
```

### MIGRATION BLAST RADIUS — Plan B

```
Affected systems: platform.media_assets — UPDATE path (new capability, zero existing callers)
Runtime impact: LOW — new GRANT + policy; no existing queries change
Release impact: LOW — additive only; no code change required for existing inserts/selects
Rollback impact: FULL — DROP POLICY + REVOKE GRANT is safe and instant
```

### RLS IMPACT REVIEW — Plan B

| Object | RLS Dependency | Risk | Follow-up Required |
|---|---|---|---|
| `platform.media_assets` | DIRECT — new UPDATE policy joins `vc.actor_owners` | LOW — same pattern as existing policies | VENOM sign-off recommended |
| `vc.actor_owners` | INDIRECT — queried by UPDATE policy | LOW — same table already in INSERT/SELECT policies | None |

### RUNTIME IMPACT ANALYSIS — Plan B

| Runtime Area | Risk | Expected Impact | Mitigation |
|---|---|---|---|
| INSERT (existing) | NONE | Unchanged | — |
| SELECT (existing) | NONE | Unchanged | — |
| UPDATE (new) | LOW | New capability; no current callers | Soft-delete DAL must be built before this policy is useful |
| Index on `owner_actor_id` | NONE | `media_assets_owner_actor_id_idx` already covers the RLS JOIN | — |

### MIGRATION DEPENDENCY GRAPH — Plan B

| Dependency Type | Affected Area | Risk |
|---|---|---|
| RLS dependency | `vc.actor_owners` JOIN in UPDATE policy | LOW — same join used in existing policies |
| DAL dependency | No UPDATE DAL exists yet — policy is a prerequisite, not the full solution | LOW — additive |
| Controller dependency | No soft-delete controller exists — must be built separately | LOW — no existing caller breaks |
| Engine dependency | Media engine (`@media`) — no impact | NONE |

### DATA INTEGRITY REVIEW — Plan B

| Integrity Area | Risk | Detection Method | Mitigation |
|---|---|---|---|
| Owners marking other actors' assets deleted | LOW | RLS WITH CHECK enforces `owner_actor_id ∈ actor_owners[auth.uid()]` | Built into policy |
| Concurrent insert + soft-delete race | LOW | UPDATE sets `deleted_at = now()` — no cascade on FK refs | FK references use `ON DELETE SET NULL` — no cascade risk |
| `status` column drift | LOW | `status = 'deleted'` is a valid enum value | CHECK constraint allows it |

### MIGRATION EXECUTION STRATEGY — Plan B

| Phase | Strategy | Risk | Notes |
|---|---|---|---|
| Phase 1 | Add GRANT UPDATE to authenticated | SAFE | Additive — no existing code breaks |
| Phase 2 | Add UPDATE RLS policy | SAFE | Additive — same pattern as INSERT/SELECT |
| Phase 3 | Build soft-delete DAL + controller | Separate code task | Not part of this migration |

**Important:** The GRANT + policy should be applied before or alongside the app-layer soft-delete DAL. There is no risk to applying it first — the policy is inert until a DAL calls UPDATE.

### ROLLBACK SURVIVABILITY — Plan B

```
Rollback status: FULL
Data recovery risk: NONE — additive change only; no data modified
Compatibility rollback risk: NONE — existing INSERT/SELECT unaffected; soft-delete DAL would need to be removed
Operational complexity: LOW — DROP POLICY + REVOKE GRANT, both instant
```

### IDENTITY / OWNERSHIP MIGRATION WARNING — Plan B

```
Object: UPDATE policy on platform.media_assets
Current behavior: No UPDATE capability for authenticated users
Migration risk: LOW — UPDATE policy strictly scoped to owner via vc.actor_owners
Potential impact: Owners can update their own rows; non-owners cannot
Recommended safeguards:
  - Column-level restriction: use a SECURITY DEFINER function rather than broad UPDATE
    to limit which columns can be changed (only lifecycle cols: status, deleted_at, deleted_by_actor_id, updated_at)
  - This prevents an owner from changing owner_actor_id, scope, or storage_key on an existing row
```

### Example SQL Proposal — Plan B (text only, do not run)

```sql
-- Step 1: Grant UPDATE to authenticated (if using broad UPDATE; skip if using SECURITY DEFINER function)
GRANT UPDATE ON TABLE platform.media_assets TO authenticated;

-- Step 2: Add UPDATE RLS policy
CREATE POLICY "actor owner can soft delete media asset"
  ON platform.media_assets
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM vc.actor_owners
      WHERE actor_owners.actor_id = media_assets.owner_actor_id
        AND actor_owners.user_id  = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM vc.actor_owners
      WHERE actor_owners.actor_id = media_assets.owner_actor_id
        AND actor_owners.user_id  = auth.uid()
    )
  );

-- Rollback:
-- REVOKE UPDATE ON TABLE platform.media_assets FROM authenticated;
-- DROP POLICY IF EXISTS "actor owner can soft delete media asset" ON platform.media_assets;
```

**Preferred alternative — column-restricted SECURITY DEFINER function (text only, do not run):**

```sql
-- Safer: restrict which columns can be changed at the function layer
CREATE OR REPLACE FUNCTION platform.soft_delete_media_asset(
  p_asset_id uuid,
  p_deleted_by_actor_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = platform, vc
AS $$
BEGIN
  -- Verify caller owns the asset's owner_actor_id
  IF NOT EXISTS (
    SELECT 1 FROM vc.actor_owners
    WHERE actor_id = (SELECT owner_actor_id FROM platform.media_assets WHERE id = p_asset_id)
      AND user_id  = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Not authorized to delete this media asset';
  END IF;

  UPDATE platform.media_assets
  SET
    status              = 'deleted',
    deleted_at          = now(),
    deleted_by_actor_id = p_deleted_by_actor_id,
    updated_at          = now()
  WHERE id = p_asset_id;
END;
$$;

REVOKE ALL ON FUNCTION platform.soft_delete_media_asset FROM PUBLIC;
GRANT EXECUTE ON FUNCTION platform.soft_delete_media_asset TO authenticated;

-- Rollback:
-- DROP FUNCTION IF EXISTS platform.soft_delete_media_asset(uuid, uuid);
```

### VALIDATION CHECKLIST — Plan B

| Validation Area | Status | Notes |
|---|---|---|
| Schema compatibility | SAFE | Additive only; no existing columns or policies changed |
| DAL compatibility | PENDING | Soft-delete DAL must be built to consume this policy |
| Controller compatibility | PENDING | Soft-delete controller is future work |
| RLS validation | REQUIRES VENOM SIGN-OFF | Same join pattern as existing policies — expected safe |
| Runtime performance | SAFE | Index on `owner_actor_id` covers the RLS join |
| Rollback validation | FULL | DROP POLICY + REVOKE GRANT is instant |

```
Migration Safety Status: CAUTION (new capability; VENOM sign-off recommended before shipping)
Confidence: HIGH
```

---

---

# PLAN C — `bucket` NOT NULL + DEFAULT Constraint

## CARNAGE MIGRATION REPORT — Plan C

```
Application Scope: VCSM
Migration reason: Enforce schema invariant — bucket is always 'post-media' (DB-F4)
Migration type: Column constraint change (NOT NULL + DEFAULT)
Migration Safety Status: CAUTION
Confidence: MEDIUM — requires pre-migration NULL check on production
```

### MIGRATION BLAST RADIUS — Plan C

```
Affected systems: platform.media_assets.bucket — column constraint only
Runtime impact: LOW if no NULL rows exist; BLOCKED if any NULL rows exist
Release impact: LOW — no DAL or controller change required (model already provides value)
Rollback impact: FULL — ALTER COLUMN DROP NOT NULL + DROP DEFAULT is instant
```

### Pre-Migration Validation (REQUIRED — run before applying)

```sql
-- Must return 0 rows before proceeding:
SELECT COUNT(*) FROM platform.media_assets WHERE bucket IS NULL;
```

If result > 0: backfill required before constraint can be added.

```sql
-- Backfill (text only, do not run without verifying count above):
UPDATE platform.media_assets SET bucket = 'post-media' WHERE bucket IS NULL;
```

### RUNTIME IMPACT ANALYSIS — Plan C

| Runtime Area | Risk | Expected Impact | Mitigation |
|---|---|---|---|
| ALTER COLUMN SET NOT NULL | LOW if no NULLs exist | Table lock for metadata change only (no rewrite needed if no NULLs) | Run NULL check first |
| ALTER COLUMN SET DEFAULT | NONE | Metadata change only | — |
| Existing INSERT path | NONE | Model already provides 'post-media' | — |
| Future INSERT without model | LOW | New callers that omit `bucket` now get default | Desired behavior |

### ROLLBACK SURVIVABILITY — Plan C

```
Rollback status: FULL
Data recovery risk: NONE
Compatibility rollback risk: NONE — DROP DEFAULT + DROP NOT NULL is instant
Operational complexity: LOW
```

### Example SQL Proposal — Plan C (text only, do not run)

```sql
-- Pre-migration: run on production and confirm returns 0
-- SELECT COUNT(*) FROM platform.media_assets WHERE bucket IS NULL;

-- If 0 NULLs confirmed, apply:
ALTER TABLE platform.media_assets
  ALTER COLUMN bucket SET DEFAULT 'post-media',
  ALTER COLUMN bucket SET NOT NULL;

-- Rollback:
-- ALTER TABLE platform.media_assets
--   ALTER COLUMN bucket DROP NOT NULL,
--   ALTER COLUMN bucket DROP DEFAULT;
```

### VALIDATION CHECKLIST — Plan C

| Validation Area | Status | Notes |
|---|---|---|
| Pre-migration NULL count | REQUIRED | Must be 0 before applying |
| DAL compatibility | SAFE | `insertMediaAssetDAL` always provides bucket |
| Engine compatibility | SAFE | `mediaAsset.model.js` hardcodes 'post-media' |
| Rollback validation | FULL | DROP DEFAULT + DROP NOT NULL is instant |

```
Migration Safety Status: CAUTION (pre-migration NULL check is blocking gate)
Confidence: MEDIUM
```

---

---

## BOUNDARY MIGRATION REVIEW

| Schema Object | Scope Owner | Cross-Root Risk | Status |
|---|---|---|---|
| `platform.media_assets` | VCSM | NONE — no engine schema, no Wentrex, no Traffic | CLEAN |
| `vc.actor_owners` (in RLS) | VCSM | NONE — VCSM internal | CLEAN |
| Secdef file | VCSM | NONE — VCSM migration proposal only | CLEAN |

---

## RECOMMENDED HANDOFFS

| Command | Reason |
|---|---|
| **VENOM** | Sign off on Plan B (UPDATE policy) — confirm `vc.actor_owners` join is sufficient ownership gate for UPDATE |
| **DB** | Confirm pre-migration NULL count for Plan C before applying |
| **LOGAN** | DF-06: correct "Media Roles Stored" table in `vcsm.dal.media.md` to distinguish SCOPE_MAP keys from DB `media_role` column values; document Plan A rejection of secdef deny-all |
| **THOR** | Release gate when Plan B or Plan C is ready to ship — both require migration files in `supabase/migrations/` |
| **Wolverine** | Implementation task: build soft-delete DAL + controller to consume Plan B's UPDATE policy |

---

## FINAL CARNAGE STATUS SUMMARY

| Plan | Description | Safety Status | Ready |
|---|---|---|---|
| **Plan A** | Reject secdef deny-all for `platform.media_assets` | BLOCKED (if applied) | Documentation only — no migration needed |
| **Plan B** | Add owner-scoped UPDATE policy for soft-delete | CAUTION | Awaiting VENOM sign-off |
| **Plan C** | `bucket` NOT NULL + DEFAULT | CAUTION | Awaiting pre-migration NULL check on production |

**No migrations execute automatically from this report. All SQL above is proposals only.**

---

_Carnage completed: 2026-05-19_  
_DB upstream report: `2026-05-19_12-00_db_media-assets-rls-audit.md`_  
_Migrations executed: NONE_  
_Files modified: NONE (source code or schema)_
