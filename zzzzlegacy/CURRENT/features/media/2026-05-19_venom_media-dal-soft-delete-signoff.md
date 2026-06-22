# VENOM — Media DAL Soft-Delete Security Sign-Off

_Date:_ 2026-05-19  
_Application Scope:_ VCSM  
_Triggered by:_ Carnage Plan B implementation — soft-delete UPDATE policy + DAL + controller  
_Authority:_ GOVERNANCE_WRITABLE — no source code or schema modified  
_Prior VENOM audit:_ `2026-05-19_venom_media-dal-trust-boundary.md`

---

## VENOM TARGET

```
Feature: VCSM media feature — soft-delete write path
Files reviewed:
  apps/VCSM/supabase/migrations/20260519200000_media_assets_soft_delete_policy.sql
  apps/VCSM/src/features/media/dal/mediaAssets.softDelete.dal.js
  apps/VCSM/src/features/media/controller/softDeleteMediaAsset.controller.js
  apps/VCSM/src/features/media/adapters/media.adapter.js (updated)
Reason: CARNAGE Plan B required VENOM sign-off before THOR release gate
```

---

## TRUST BOUNDARY ANALYSIS

### Migration — `20260519200000_media_assets_soft_delete_policy.sql`

| Check | Result | Notes |
|---|---|---|
| Column-level GRANT restricts UPDATE surface | PASS | Only `status, deleted_at, deleted_by_actor_id, updated_at` are grantable — all other columns are protected |
| USING clause enforces actor ownership | PASS | `vc.actor_owners` join with `auth.uid()` — identical to INSERT/SELECT policy pattern |
| WITH CHECK enforces `status = 'deleted'` | PASS | Arbitrary status values (e.g., `'ready'`, `'processing'`) cannot be set via this grant |
| WITH CHECK enforces `deleted_by_actor_id IS NOT NULL` | PASS | Null-actor soft-deletes are rejected at DB layer |
| Rollback path documented | PASS | `DROP POLICY` + `REVOKE UPDATE` in migration comments |
| No schema change to protected columns | PASS | Migration adds no columns — only grant + policy on existing structure |

### DAL — `mediaAssets.softDelete.dal.js`

| Check | Result | Notes |
|---|---|---|
| Explicit column update (no `update({})` wildcard) | PASS | Only `status`, `deleted_at`, `deleted_by_actor_id`, `updated_at` in the UPDATE call |
| `status` hardcoded to `'deleted'` | PASS | DAL does not accept `status` as a parameter — caller cannot set arbitrary values |
| `deleted_by_actor_id` provided from caller param | PASS | Matches actor identity from calling controller |
| No `select('*')` — explicit projection | PASS | `SOFT_DELETE_PROJECTION` — 5 columns only |
| DEV-only logging | PASS | Both log calls are behind `import.meta.env?.DEV` |
| No secret or sensitive data logged | PASS | Log includes `assetId`, `deletedByActorId`, `id`, `status`, `error.code` — no tokens, keys, URLs |
| `.single()` used — 0-row update surfaces as error | PASS | If actor does not own the row, RLS causes 0 rows updated → `.single()` throws PGRST116 — caller sees error, not silent no-op |

### Controller — `softDeleteMediaAsset.controller.js`

| Check | Result | Notes |
|---|---|---|
| Required params validated | PASS | `assetId` and `actorId` both checked before DAL call |
| No profileId/vportId exposed | PASS | Controller accepts `actorId` (actor-scoped) only |
| No direct DAL import bypass possible | PASS | Controller is the single entry point; adapter exports it |
| DB is authoritative ownership gate | PASS | RLS WITH CHECK rejects non-owned updates regardless of `actorId` value passed |

### Adapter — `media.adapter.js`

| Check | Result | Notes |
|---|---|---|
| `softDeleteMediaAssetController` exported from barrel | PASS | Cross-feature callers must go through `media.adapter.js` |
| No DAL exported directly | PASS | `softDeleteMediaAssetDAL` is not in the adapter surface |
| Adapter boundary intact | PASS | 3 exports total — controller, resolveVcsmAppId, softDeleteMediaAssetController |

---

## VENOM FINDINGS

### V2-F1 — PASS — Controller does not pre-flight actor identity (LOW — ACCEPTED)

**Finding:** `softDeleteMediaAssetController` does not verify that `actorId` belongs to the session calling user before making the DB call. An authenticated caller could pass any `actorId` value.

**Assessment:** Identical pattern to `createMediaAssetController` (VENOM-F2, accepted 2026-05-19). The DB UPDATE RLS USING clause enforces `vc.actor_owners` with `auth.uid()`. If the `actorId` passed does not match an actor owned by the session, the RLS rejects the update — `.single()` throws a PGRST116 error (0 rows returned). The error propagates to the caller as a thrown exception. Ownership cannot be bypassed.

**Severity:** LOW — DB is the authoritative gate; no bypass exists.

**Decision:** ACCEPTED — same as VENOM-F2. If a controller-layer ownership check is added later (e.g., `requireOwnerActorAccess`), it applies to both `createMediaAssetController` and `softDeleteMediaAssetController` in the same pass.

---

### V2-F2 — PASS — 0-row update is an error, not a silent no-op (INFORMATIONAL)

**Finding:** If a caller passes an `assetId` that doesn't exist or is already deleted, the UPDATE affects 0 rows and `.single()` throws. The error is a DB error (PGRST116), not a domain-specific error message.

**Assessment:** Correct behavior — callers should check that the asset exists and is not already deleted before calling the controller if they need clean error messages. For current use cases (user-initiated soft-delete from their own media library), the DB error is acceptable. Error propagates correctly — no silent failure.

**Severity:** INFORMATIONAL — no action required.

---

## OVERALL SECURITY STATUS

```
Soft-delete implementation: SECURE
DB enforcement: STRONG — column-level GRANT + USING + WITH CHECK
App-layer enforcement: CORRECT — params validated, DEV logging only, DB error surfaces
Bypass risk: NONE — DB rejects non-owned and non-conforming updates regardless of app-layer input
```

---

## VENOM SIGN-OFF

**SIGNED OFF — Carnage Plan B (soft-delete) is cleared for THOR release gate.**

No critical or high findings. The security model for soft-delete mirrors the established INSERT/SELECT pattern with additional column-level restriction and WITH CHECK constraint enforcement.

Accepted risks:
- V2-F1: Controller-layer actor identity check absent (LOW — DB-enforced; accepted per VENOM-F2 precedent)

---

_VENOM soft-delete sign-off completed: 2026-05-19_  
_Files reviewed: 4 (migration, DAL, controller, adapter)_  
_Critical findings: 0_  
_High findings: 0_  
_Low findings: 1 (accepted)_  
_SIGN-OFF STATUS: APPROVED_
