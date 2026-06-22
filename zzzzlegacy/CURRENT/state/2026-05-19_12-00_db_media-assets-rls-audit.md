# DB — `platform.media_assets` RLS Audit

_Date:_ 2026-05-19  
_Application Scope:_ VCSM  
_Triggered by:_ CEREBRO verification pass + VENOM-F1 (RLS policy status unconfirmed)  
_Mode:_ READ-ONLY ANALYSIS ONLY — no database modifications made or proposed for immediate execution  
_Status:_ COMPLETE

---

## Purpose

Verify the actual RLS state of `platform.media_assets` in the migration history. Resolve VENOM-F1 (RLS policy status UNCERTAIN) and VENOM-F2 (`owner_actor_id` session enforcement).

---

## Migration Files Inspected

| File | Status | Contains |
|---|---|---|
| `20260430300000_create_platform_media_assets.sql` | PRESENT — authoritative | Table creation, indexes, RLS ENABLE, grants, INSERT + SELECT policies |
| `20260430400000_media_asset_writeback_columns.sql` | PRESENT | FK columns in `vc.post_media`, `chat.message_attachments`, `wanders.cards`, `vport.profiles` |
| `20260430500000_profile_media_asset_writeback_columns.sql` | PRESENT | FK columns in `public.profiles`, `vport.profiles` banner |
| `2026-05-10_secdef_b_zero_policy_tables.sql` (in `_ACTIVE/migrations/`) | PROPOSAL ONLY — must NOT be applied to `platform.media_assets` | Deny-all policy proposal — fatally flawed, see DB-F1 |

---

## Table Schema (Live — from canonical migration)

```sql
CREATE TABLE IF NOT EXISTS platform.media_assets (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  app_id              uuid        REFERENCES platform.apps(id),          -- nullable (pre-app uploads)
  owner_source        text        NOT NULL CHECK (owner_source = ANY (ARRAY['vc','vport','chat','learning','platform'])),
  owner_actor_id      uuid        NOT NULL,                               -- NO FK to vc.actors — see DB-F3
  scope_domain        text        NOT NULL CHECK (scope_domain = ANY (ARRAY['vc','vport','chat','learning','platform'])),
  scope_type          text        NOT NULL CHECK (scope_type = ANY (ARRAY[
                                    'post_media','profile_avatar','profile_banner',
                                    'vport_avatar','vport_banner','portfolio_media',
                                    'menu_item_photo','chat_attachment','design_asset',
                                    'wanders_card','course_cover','assignment_resource',
                                    'submission_file','generic'
                                  ])),
  scope_id            uuid,
  media_kind          text        NOT NULL CHECK (media_kind = ANY (ARRAY['image','video','audio','file'])),
  media_role          text        CHECK (media_role = ANY (ARRAY[
                                    'original','cover','thumbnail','before','after',
                                    'result','detail','attachment','avatar','banner','design_asset'
                                  ])),
  mime_type           text        NOT NULL,
  size_bytes          bigint,
  width               integer,
  height              integer,
  duration_ms         integer,
  storage_provider    text        NOT NULL DEFAULT 'cloudflare_r2',
  bucket              text,                                               -- nullable — see DB-F4
  storage_key         text        NOT NULL UNIQUE,
  public_url          text        NOT NULL,
  variants            jsonb       NOT NULL DEFAULT '{}',
  meta                jsonb       NOT NULL DEFAULT '{}',
  status              text        NOT NULL DEFAULT 'uploaded' CHECK (status = ANY (ARRAY[
                                    'pending_upload','uploaded','processing','ready','failed','deleted'
                                  ])),
  created_by_actor_id uuid,
  deleted_by_actor_id uuid,                                              -- soft-delete cols present
  deleted_at          timestamptz,                                       -- soft-delete cols present
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);
```

---

## RLS State (from authoritative migration)

```sql
ALTER TABLE platform.media_assets ENABLE ROW LEVEL SECURITY;   -- RLS ON
GRANT INSERT, SELECT ON TABLE platform.media_assets TO authenticated;

-- Policy 1: INSERT — owner must own the actor_id being claimed
CREATE POLICY "actor owner can insert media asset"
  ON platform.media_assets FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM vc.actor_owners
      WHERE actor_owners.actor_id = media_assets.owner_actor_id
        AND actor_owners.user_id  = auth.uid()
    )
  );

-- Policy 2: SELECT — owner can read their own assets
CREATE POLICY "actor owner can select media asset"
  ON platform.media_assets FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM vc.actor_owners
      WHERE actor_owners.actor_id = media_assets.owner_actor_id
        AND actor_owners.user_id  = auth.uid()
    )
  );
```

---

## SCOPE_MAP vs. DB CHECK Constraint Alignment

All 13 `scopeType` values used in `mediaAsset.model.js` SCOPE_MAP verified against the DB `scope_type` CHECK constraint:

| SCOPE_MAP key | scopeType stored in DB | In DB CHECK? |
|---|---|---|
| `vibe_post` | `post_media` | YES ✅ |
| `story_24drop` | `post_media` | YES ✅ |
| `vdrop` | `post_media` | YES ✅ |
| `user_avatar` | `profile_avatar` | YES ✅ |
| `user_banner` | `profile_banner` | YES ✅ |
| `vport_avatar` | `vport_avatar` | YES ✅ |
| `vport_banner` | `vport_banner` | YES ✅ |
| `portfolio_media` | `portfolio_media` | YES ✅ |
| `menu_item_photo` | `menu_item_photo` | YES ✅ |
| `chat_attachment` | `chat_attachment` | YES ✅ |
| `design_asset` | `design_asset` | YES ✅ |
| `wanders_card` | `wanders_card` | YES ✅ |
| `vport_creation_avatar` | `vport_avatar` | YES ✅ |

**VERIFIED — zero mismatches. All model scope types are within the DB constraint.**

---

## DATABASE REVIEW ITEM: DB-F1

```
DATABASE REVIEW ITEM
- Object: `2026-05-10_secdef_b_zero_policy_tables.sql` (lines 310–327)
- Application Scope: VCSM
- Current behavior: Migration proposal adds `media_assets_deny_all` permissive policy (USING false, WITH CHECK false)
  WITHOUT dropping the existing `"actor owner can insert media asset"` and `"actor owner can select media asset"` policies.
- Problem: TWO fatal flaws
  (1) As written, the deny-all policy would be INEFFECTIVE. PostgreSQL RLS with multiple permissive
      policies uses OR logic — if any permissive policy returns true, the operation is allowed.
      The deny-all (false) would be OR'd with the existing INSERT/SELECT policies (true for owners),
      so owners would still have access. The deny-all achieves nothing.
  (2) The comment states "No direct user access needed or appropriate" — this is FACTUALLY INCORRECT.
      The table has owner-scoped INSERT/SELECT policies specifically because authenticated users DO
      need to read and write their own media assets.
- Why it matters: Applying this migration would either: (a) break nothing (if OR logic applies as above)
  or (b) create false confidence that access is blocked when it is not.
  Either way, the proposal must not be applied.
- Recommended improvement: Archive/reject this proposal for `platform.media_assets`.
  The correct security model is the one already in place — owner-scoped INSERT + SELECT via `vc.actor_owners`.
  If a future requirement demands service-role-only access, a separate migration must:
  (1) DROP the existing policies first, THEN create the deny-all as a RESTRICTIVE policy.
- Rationale: Current RLS correctly enforces `owner_actor_id` at the DB level.
- Risk if applied: Proposal is ineffective as written due to OR logic. But applying it creates dead policy
  noise and misleading documentation. Potential confusion in future security audits.
- Example SQL proposal (text only, do not run):
  -- If this proposal is ever revisited, the correct form would be:
  -- DROP POLICY "actor owner can insert media asset" ON platform.media_assets;
  -- DROP POLICY "actor owner can select media asset" ON platform.media_assets;
  -- CREATE POLICY "media_assets_deny_all"
  --   ON platform.media_assets FOR ALL TO authenticated
  --   AS RESTRICTIVE  -- not the default PERMISSIVE
  --   USING (false) WITH CHECK (false);
```

**Action required from Carnage: Document that this migration must NOT be applied to `platform.media_assets` and explain why. No code change needed.**

---

## DATABASE REVIEW ITEM: DB-F2

```
DATABASE REVIEW ITEM
- Object: `platform.media_assets` — UPDATE / DELETE access
- Application Scope: VCSM
- Current behavior: No UPDATE GRANT. No DELETE GRANT. No UPDATE or DELETE RLS policy.
  `deleted_by_actor_id` and `deleted_at` columns exist but cannot be written by authenticated users.
- Problem: Soft-delete is structurally supported by the schema (lifecycle columns) but operationally
  impossible from the authenticated client. There is no path to mark an asset as `status = 'deleted'`
  or set `deleted_at` / `deleted_by_actor_id` without service_role.
- Why it matters: Media files may need to be "deleted" by their owner (avatar replaced, post removed,
  menu item deleted). Without an UPDATE path, assets accumulate indefinitely in the table even when
  the business entity they belong to no longer exists.
- Recommended improvement: Add UPDATE policy scoped to the asset's `owner_actor_id`, limited to
  the lifecycle columns only (`status`, `deleted_at`, `deleted_by_actor_id`, `updated_at`).
- Rationale: Owner can insert — owner should be able to mark their own asset as deleted.
- Risk if unchanged: `status`, `deleted_at`, `deleted_by_actor_id` remain permanently frozen at
  initial insert values. Soft-delete is impossible without a privileged function or service_role bypass.
- Example SQL proposal (text only, do not run):
  GRANT UPDATE ON TABLE platform.media_assets TO authenticated;

  CREATE POLICY "actor owner can soft delete media asset"
    ON platform.media_assets
    FOR UPDATE
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM vc.actor_owners
        WHERE actor_owners.actor_id = media_assets.owner_actor_id
          AND actor_owners.user_id  = auth.uid()
      )
    )
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM vc.actor_owners
        WHERE actor_owners.actor_id = media_assets.owner_actor_id
          AND actor_owners.user_id  = auth.uid()
      )
    );
  -- Note: Column-level security via a SECURITY DEFINER function is preferable
  -- to unrestricted UPDATE — limits which columns can be changed.
```

---

## DATABASE REVIEW ITEM: DB-F3

```
DATABASE REVIEW ITEM
- Object: `platform.media_assets.owner_actor_id` — missing FK to `vc.actors`
- Application Scope: VCSM
- Current behavior: `owner_actor_id uuid NOT NULL` — no REFERENCES constraint to `vc.actors(id)`.
- Problem: No referential integrity between media assets and the actor table.
  If an actor is removed from `vc.actors`, their media rows remain with a dangling `owner_actor_id`.
  The RLS policy still executes — it checks `vc.actor_owners` — but the asset record persists
  indefinitely with an owner that no longer exists.
- Why it matters: Platform cleanup workflows (actor deletion, GDPR right-to-erasure) have no
  cascade path to associated media assets.
- Recommended improvement: Add FK with ON DELETE behavior documented. Two options:
  (1) ON DELETE CASCADE — delete media assets when the actor is deleted (aggressive, may cause data loss)
  (2) ON DELETE SET NULL — set `owner_actor_id = NULL` (violates NOT NULL — not viable without schema change)
  (3) No FK, explicit cleanup job — app-layer or DB trigger handles cascade
- Rationale: Explicit referential behavior is better than implicit orphan accumulation.
- Risk if unchanged: Orphaned media assets accumulate for deleted actors. No automatic cleanup path.
- Example SQL proposal (text only, do not run):
  -- Option: document-only, no FK, rely on cleanup job
  COMMENT ON COLUMN platform.media_assets.owner_actor_id IS
    'Actor UUID owning this asset. No FK — actor deletion does not cascade.
     App-layer cleanup is required when actors are removed.';
```

---

## DATABASE REVIEW ITEM: DB-F4

```
DATABASE REVIEW ITEM
- Object: `platform.media_assets.bucket` — nullable column, always hardcoded 'post-media'
- Application Scope: VCSM
- Current behavior: `bucket text` — no NOT NULL constraint, no default.
  All application inserts hardcode `bucket: 'post-media'` in `mediaAsset.model.js`.
- Problem: Column allows NULL, but application always provides 'post-media'.
  A future insert that omits `bucket` (e.g., from a new caller that doesn't follow the model)
  would store NULL silently — no constraint violation.
- Why it matters: `bucket` is required for Cloudflare R2 retrieval. A NULL bucket row is unretrievable.
- Recommended improvement: Add NOT NULL with DEFAULT 'post-media'.
- Rationale: Aligns schema constraint with application invariant.
- Risk if unchanged: NULL bucket rows can be silently created by any caller that bypasses the model.
- Example SQL proposal (text only, do not run):
  ALTER TABLE platform.media_assets
    ALTER COLUMN bucket SET NOT NULL,
    ALTER COLUMN bucket SET DEFAULT 'post-media';
```

---

## DB-F5 — Documentation Error (not a schema issue)

**Object:** `vcsm.dal.media.md` — "Media Roles Stored in platform.media_assets" table  
**Issue:** The table lists SCOPE_MAP keys (`vibe_post`, `user_avatar`, `chat_attachment`, etc.) as `mediaRole` values. These are the `scope` parameter names passed to the controller — **not** the values stored in the `media_role` DB column. The `media_role` column stores `'original'`, `'avatar'`, `'banner'`, `'attachment'`, `'design_asset'` etc.  
**Action:** Rename the documentation table to "SCOPE_MAP Keys" and add a separate note about the `media_role` DB column CHECK constraint. This is a LOGAN correction (DF-06) — no schema change required.

---

## Resolution of VENOM Findings

| Finding | Status | Evidence |
|---|---|---|
| **VENOM-F1** — RLS policy status uncertain | **RESOLVED** | RLS is enabled in `20260430300000_create_platform_media_assets.sql`. Two owner-scoped policies exist. `media_assets_deny_all` proposal was never applied and must not be. |
| **VENOM-F2** — `owner_actor_id` not session-verified at controller layer | **MITIGATED at DB layer** | INSERT RLS WITH CHECK enforces `owner_actor_id ∈ vc.actor_owners[auth.uid()]`. DB rejects any INSERT with a non-owned `owner_actor_id`. Controller-layer gap remains — but the DB provides the enforcement floor. |
| **VENOM-F3** — Inconsistent app-layer validation | **DOWNGRADED to LOW** | DB RLS is the authoritative gate. App-layer inconsistency is a defense-in-depth gap, not a critical vulnerability. |

---

## Handoffs

| Command | Reason |
|---|---|
| **Carnage** | DB-F1: document secdef rejection; DB-F2: propose soft-delete UPDATE policy migration; DB-F4: propose bucket NOT NULL migration |
| **LOGAN** | DF-06: correct "Media Roles" table in `vcsm.dal.media.md` to distinguish SCOPE_MAP keys from `media_role` DB values |
| **VENOM** (optional follow-up) | VENOM-F2 controller gap — defense-in-depth: add `requireOwnerActorAccess` call to `createMediaAssetController` |

---

_DB analysis completed: 2026-05-19_  
_Migration files read: 4_  
_Source code read: 1 (mediaAsset.model.js — SCOPE_MAP verification)_  
_Database modified: NONE_  
_Schema modified: NONE_
