# VCSM Moderation DB Remediation Plan
**Date:** 2026-05-10  
**Agents:** CARNAGE · DB · VENOM  
**Scope:** apps/VCSM — database planning only  
**Mode:** Read-only analysis. SQL proposals only. Nothing executed. Nothing modified.  
**Source:** zNOTFORPRODUCTION/_ACTIVE/audits/moderation/2026-05-10_00-00_moderation-system-review.md

---

## ADDITIONAL FINDING: App-Layer Admin Check Is Also Broken

Before the batches: a critical bug was found during remediation analysis that was not in the original audit report.

**`assertModerationAccess.dal.js` queries with the wrong actor ID type.**

Current code:
```js
const { data, error } = await supabase
  .schema('learning')
  .from('platform_admins')
  .select('actor_id')
  .eq('actor_id', actorId)   // actorId is a vc actor UUID
  .limit(1)
```

`learning.platform_admins.actor_id` is FK'd to `learning.actors(id)` — these are **learning actor UUIDs**, not vc actor UUIDs. A vc actor UUID will never match a learning actor UUID unless by random collision. This means `isModerationAuthorizedDAL` always returns `false`, `assertModerationAccessController` always throws `FORBIDDEN`, and **no moderator action can be performed through the application layer at all**.

Both layers are broken in different ways:
- **DB layer:** `can_manage_domain('vc')` is too permissive — all vc users pass.
- **App layer:** `assertModerationAccess.dal.js` is too restrictive — no vc users pass.

The DB fix and the app code fix must ship together, or the moderator route will remain locked.

App-layer fix is covered in **Section: What App Code Must Change After DB Fixes**.

---

## Deployment Order (Overall)

```
Batch 2  (reporter INSERT policy)      ← zero risk, additive only, safe to deploy first
Batch 1  (fix can_manage_domain)       ← must come before Batch 5
Batch 4  (fix block_actor RPC)         ← independent, deploy any time
Batch 6  (indexes)                     ← independent, zero risk, deploy any time
Batch 3  (create moderators table)     ← after Batch 1
Batch 5  (FORCE RLS)                   ← LAST — after Batch 1 is verified in prod
```

**Never apply Batch 5 before Batch 1.** FORCE RLS does not fix broken policy logic — it just removes the service_role bypass. If can_manage_domain is still wrong when FORCE RLS is applied, no behavior change for users, but it does lock out worker processes that relied on service_role bypass for legitimate moderation reads.

---

## Batch 1 — Fix moderation.can_manage_domain

### Problem

`moderation.can_manage_domain('vc')` currently returns `TRUE` for any authenticated user who has a vc actor. Every VCSM user passes. All moderator-scoped RLS policies (`moderation_reports_select_moderator`, `moderation_actions_insert_moderator`, etc.) are effectively public.

### What Changes

Replace the broken `vc` branch with a `learning.platform_admins` check via `learning.actor_owners`. Use the same pattern already used in the `learning` branch of the same function.

Also collapses `chat` and `system` domains to the platform admin check instead of hardcoded `false`, since a moderator should be able to act on content in any domain.

### Migration Filename

```
20260510070000_fix_moderation_can_manage_domain.sql
```

### SQL Proposal (text only — do not run)

```sql
-- =============================================================
-- Migration: moderation.can_manage_domain — fix vc branch
-- Date: 2026-05-10
-- Scope: CARNAGE/DB remediation — fix broken moderation RLS
-- =============================================================
-- Problem: can_manage_domain('vc') returns TRUE for every vc actor.
--   All moderator SELECT/UPDATE/INSERT policies on moderation.reports,
--   moderation.actions, moderation.block_events are effectively public.
-- Fix: Replace vc branch with platform_admins check via actor_owners.
--   This is identical to the existing 'learning' branch logic.
-- Note: After moderation.moderators table is created (Batch 3), update
--   this function again to check moderators first, platform_admins as fallback.
-- =============================================================

CREATE OR REPLACE FUNCTION moderation.can_manage_domain(p_domain text)
RETURNS boolean
LANGUAGE sql STABLE
AS $$
  SELECT CASE
    WHEN p_domain IN ('vc', 'chat', 'system') THEN (
      -- Check whether the current auth user is a learning platform admin.
      -- Route: auth.uid() → learning.actor_owners → learning.platform_admins.
      -- This is the same check used in the 'learning' branch below
      -- and matches learning.is_current_user_platform_admin() semantics.
      EXISTS (
        SELECT 1
        FROM learning.platform_admins pa
        JOIN learning.actor_owners ao ON ao.actor_id = pa.actor_id
        WHERE ao.user_id = auth.uid()
          AND COALESCE(ao.is_void, false) = false
      )
    )
    WHEN p_domain = 'learning' THEN (
      EXISTS (
        SELECT 1
        FROM learning.platform_admins pa
        JOIN learning.actor_owners ao ON ao.actor_id = pa.actor_id
        WHERE ao.user_id = auth.uid()
          AND COALESCE(ao.is_void, false) = false
      )
    )
    ELSE false
  END;
$$;
```

### Rollback SQL (text only — do not run)

```sql
-- Rollback: restore original broken implementation
CREATE OR REPLACE FUNCTION moderation.can_manage_domain(p_domain text)
RETURNS boolean
LANGUAGE sql STABLE
AS $$
  select case
    when p_domain = 'vc' then exists (
      select 1
      from vc.actor_owners ao
      join vc.actors a on a.id = ao.actor_id
      where ao.user_id = auth.uid()
        and coalesce(ao.is_void, false) = false
    )
    when p_domain = 'learning' then exists (
      select 1
      from learning.platform_admins pa
      join learning.actor_owners ao on ao.actor_id = pa.actor_id
      where ao.user_id = auth.uid()
        and coalesce(ao.is_void, false) = false
    )
    when p_domain = 'chat' then false
    when p_domain = 'system' then false
    else false
  end
$$;
```

### Read-Only Validation Queries (text only — do not run)

```sql
-- 1. Verify function body was updated (inspect definition)
SELECT pg_get_functiondef(oid)
FROM pg_proc
WHERE proname = 'can_manage_domain'
  AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'moderation');

-- 2. Verify a known non-admin user now returns false
-- (Run as the non-admin user's JWT session — expect: false)
SELECT moderation.can_manage_domain('vc');

-- 3. Verify a known platform admin returns true
-- (Run as a known admin user's JWT session — expect: true)
SELECT moderation.can_manage_domain('vc');

-- 4. Count how many users currently have access to moderation.reports via the moderator policy
-- (expect: drops from "all vc actors" to "platform_admins only")
SELECT COUNT(DISTINCT ao.user_id)
FROM learning.platform_admins pa
JOIN learning.actor_owners ao ON ao.actor_id = pa.actor_id
WHERE COALESCE(ao.is_void, false) = false;
```

### Risk Level

**HIGH — behavior-changing function replacement.**  
This function is referenced by 8 RLS policies across `moderation.reports`, `moderation.report_events`, `moderation.actions`, and `moderation.block_events`. After this migration, all those policies immediately become restrictive. Any queries from regular users that currently pass via the broken policy will return empty result sets (not errors — RLS silently filters). This is the desired outcome.

**No data loss.** No DDL on tables. Function replacement only.

---

## Batch 2 — Add Reporter INSERT Policy on moderation.report_events

### Problem

`moderation.report_events` has no INSERT policy for reporters. The only INSERT policy is `moderation_report_events_insert_moderator`, which is itself broken (Batch 1). Reporters get an RLS denial on every report_events insert, which triggers `skipReportEventsInsertForSession = true` in `reports.dal.js`, permanently disabling the audit trail for the user's session. The result: report_events is empty for all user-filed reports.

### What Changes

Add `moderation_report_events_insert_self` — allows the reporter to insert a single `created` event linked to their own report. Scoped to `event_type = 'created'` only, so reporters cannot fake `dismissed`, `action_taken`, or other moderator events.

### Migration Filename

```
20260510080000_report_events_insert_self_policy.sql
```

### SQL Proposal (text only — do not run)

```sql
-- =============================================================
-- Migration: moderation.report_events — add reporter self-insert policy
-- Date: 2026-05-10
-- Scope: CARNAGE/DB remediation — restore report audit trail
-- =============================================================
-- Problem: No reporter INSERT policy on moderation.report_events.
--   Every report_events INSERT by a non-admin user hits RLS denial.
--   The application DAL (reports.dal.js) catches this and sets
--   skipReportEventsInsertForSession=true, permanently silencing the
--   audit trail for that user session.
-- Fix: Add a scoped policy allowing reporters to insert only their own
--   'created' events. Subquery joins to moderation.reports to verify
--   the reporter_actor_id matches the current session actor.
-- =============================================================

DROP POLICY IF EXISTS "moderation_report_events_insert_self"
  ON moderation.report_events;

CREATE POLICY "moderation_report_events_insert_self"
  ON moderation.report_events
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Only 'created' events — reporters cannot fake lifecycle events
    event_type = 'created'

    -- Reporter must own the report being linked
    AND EXISTS (
      SELECT 1
      FROM moderation.reports r
      WHERE r.id = report_events.report_id
        AND moderation.is_self_actor(r.reporter_domain, r.reporter_actor_id)
    )
  );
```

### Rollback SQL (text only — do not run)

```sql
DROP POLICY IF EXISTS "moderation_report_events_insert_self"
  ON moderation.report_events;
```

### Read-Only Validation Queries (text only — do not run)

```sql
-- 1. Confirm policy exists after migration
SELECT policyname, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'moderation'
  AND tablename = 'report_events'
  AND policyname = 'moderation_report_events_insert_self';

-- 2. Count existing reports with zero events (shows scale of audit gap)
SELECT COUNT(*) AS reports_with_no_events
FROM moderation.reports r
WHERE NOT EXISTS (
  SELECT 1 FROM moderation.report_events re WHERE re.report_id = r.id
);

-- 3. Count existing reports with at least one event (shows what did get through)
SELECT COUNT(*) AS reports_with_events
FROM moderation.reports r
WHERE EXISTS (
  SELECT 1 FROM moderation.report_events re WHERE re.report_id = r.id
);
```

### Risk Level

**LOW — purely additive policy.** No existing policy is modified. No data is touched. The new policy only adds an INSERT path that previously did not exist. No rollback risk.

**Deployment note:** Deploy this BEFORE or WITH Batch 1. If Batch 1 deploys first, the `moderation_report_events_insert_moderator` policy briefly allows non-admins to write any event type (because can_manage_domain is still broken). Batch 2 is safer to land first.

---

## Batch 3 — Create moderation.moderators

### Problem

All moderation access is governed by `learning.platform_admins` — a Learning schema table. VCSM content moderators and Learning LMS admins are forced to be the same role. There is no VCSM-specific moderation role table.

### What Changes

Create `moderation.moderators` with role levels (`viewer`, `moderator`, `admin`), FORCE RLS, admin-only management policies.

Then update `moderation.can_manage_domain` to check `moderation.moderators` first and fall back to `learning.platform_admins`. This preserves backward compat (existing LMS admins keep moderation access until explicitly migrated).

### Migration Filename

```
20260510090000_create_moderation_moderators.sql
```

### SQL Proposal (text only — do not run)

```sql
-- =============================================================
-- Migration: moderation.moderators — new role table
-- Date: 2026-05-10
-- Scope: CARNAGE/DB remediation — separate moderation roles from LMS admin
-- =============================================================
-- Prerequisites: Batch 1 must be deployed first.
--   can_manage_domain must correctly check platform_admins before
--   this migration references moderation.moderators.
-- =============================================================

-- ─────────────────────────────────────────────────────────────
-- Table
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS moderation.moderators (
  id            uuid        DEFAULT gen_random_uuid() NOT NULL,
  domain        text        NOT NULL
                            CHECK (domain IN ('vc', 'learning', 'chat', 'system')),
  actor_domain  text        NOT NULL DEFAULT 'vc'
                            CHECK (actor_domain IN ('vc', 'learning')),
  actor_id      uuid        NOT NULL,
  role          text        NOT NULL DEFAULT 'moderator'
                            CHECK (role IN ('viewer', 'moderator', 'admin')),
  granted_by_actor_id   uuid,
  granted_by_domain     text DEFAULT 'vc',
  granted_at    timestamptz NOT NULL DEFAULT now(),
  revoked_at    timestamptz,
  revocation_reason text,
  meta          jsonb       NOT NULL DEFAULT '{}',
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT moderators_pkey PRIMARY KEY (id),
  CONSTRAINT moderators_unique_active UNIQUE (domain, actor_domain, actor_id)
);

COMMENT ON TABLE moderation.moderators IS
  'VCSM moderation role assignments. Separate from learning.platform_admins. '
  'Supports viewer/moderator/admin levels per domain. '
  'revoked_at IS NULL means the grant is active.';

-- ─────────────────────────────────────────────────────────────
-- Trigger: auto-update updated_at
-- ─────────────────────────────────────────────────────────────

CREATE TRIGGER trg_moderation_moderators_updated_at
  BEFORE UPDATE ON moderation.moderators
  FOR EACH ROW EXECUTE FUNCTION moderation.set_updated_at();

-- ─────────────────────────────────────────────────────────────
-- Indexes
-- ─────────────────────────────────────────────────────────────

-- Active moderator lookup by actor
CREATE INDEX IF NOT EXISTS idx_moderation_moderators_actor
  ON moderation.moderators (actor_domain, actor_id)
  WHERE revoked_at IS NULL;

-- Active moderator lookup by domain
CREATE INDEX IF NOT EXISTS idx_moderation_moderators_domain
  ON moderation.moderators (domain)
  WHERE revoked_at IS NULL;

-- ─────────────────────────────────────────────────────────────
-- RLS
-- ─────────────────────────────────────────────────────────────

ALTER TABLE moderation.moderators ENABLE ROW LEVEL SECURITY;
ALTER TABLE moderation.moderators FORCE ROW LEVEL SECURITY;

-- Platform admins can read all moderators
CREATE POLICY "moderators_select_platform_admin"
  ON moderation.moderators
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM learning.platform_admins pa
      JOIN learning.actor_owners ao ON ao.actor_id = pa.actor_id
      WHERE ao.user_id = auth.uid()
        AND COALESCE(ao.is_void, false) = false
    )
  );

-- Platform admins can insert new moderator grants
CREATE POLICY "moderators_insert_platform_admin"
  ON moderation.moderators
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM learning.platform_admins pa
      JOIN learning.actor_owners ao ON ao.actor_id = pa.actor_id
      WHERE ao.user_id = auth.uid()
        AND COALESCE(ao.is_void, false) = false
    )
  );

-- Platform admins can update (revoke) moderator grants
CREATE POLICY "moderators_update_platform_admin"
  ON moderation.moderators
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM learning.platform_admins pa
      JOIN learning.actor_owners ao ON ao.actor_id = pa.actor_id
      WHERE ao.user_id = auth.uid()
        AND COALESCE(ao.is_void, false) = false
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM learning.platform_admins pa
      JOIN learning.actor_owners ao ON ao.actor_id = pa.actor_id
      WHERE ao.user_id = auth.uid()
        AND COALESCE(ao.is_void, false) = false
    )
  );

-- No DELETE — soft revoke via revoked_at only
-- No user-facing SELECT — moderators cannot see each other's grants

-- ─────────────────────────────────────────────────────────────
-- Update can_manage_domain to check moderators first
-- ─────────────────────────────────────────────────────────────
-- This is the second version of can_manage_domain.
-- Checks moderation.moderators first (native role table),
-- falls back to learning.platform_admins (legacy compat).
-- ─────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION moderation.can_manage_domain(p_domain text)
RETURNS boolean
LANGUAGE sql STABLE
AS $$
  SELECT CASE
    WHEN p_domain IN ('vc', 'chat', 'system', 'learning') THEN (
      -- Check moderation.moderators (native role table, role >= 'moderator')
      EXISTS (
        SELECT 1
        FROM moderation.moderators m
        JOIN vc.actor_owners ao ON ao.actor_id = m.actor_id
        WHERE ao.user_id = auth.uid()
          AND COALESCE(ao.is_void, false) = false
          AND m.domain = p_domain
          AND m.actor_domain = 'vc'
          AND m.role IN ('moderator', 'admin')
          AND m.revoked_at IS NULL
      )
      OR
      -- Fallback: learning platform admin (legacy compat — remove after migration)
      EXISTS (
        SELECT 1
        FROM learning.platform_admins pa
        JOIN learning.actor_owners ao ON ao.actor_id = pa.actor_id
        WHERE ao.user_id = auth.uid()
          AND COALESCE(ao.is_void, false) = false
      )
    )
    ELSE false
  END;
$$;
```

### Rollback SQL (text only — do not run)

```sql
-- Step 1: Revert can_manage_domain to Batch 1 version (platform_admins only)
CREATE OR REPLACE FUNCTION moderation.can_manage_domain(p_domain text)
RETURNS boolean
LANGUAGE sql STABLE
AS $$
  SELECT CASE
    WHEN p_domain IN ('vc', 'chat', 'system') THEN (
      EXISTS (
        SELECT 1
        FROM learning.platform_admins pa
        JOIN learning.actor_owners ao ON ao.actor_id = pa.actor_id
        WHERE ao.user_id = auth.uid()
          AND COALESCE(ao.is_void, false) = false
      )
    )
    WHEN p_domain = 'learning' THEN (
      EXISTS (
        SELECT 1
        FROM learning.platform_admins pa
        JOIN learning.actor_owners ao ON ao.actor_id = pa.actor_id
        WHERE ao.user_id = auth.uid()
          AND COALESCE(ao.is_void, false) = false
      )
    )
    ELSE false
  END;
$$;

-- Step 2: Drop the table (only safe if no data has been written to it)
DROP TABLE IF EXISTS moderation.moderators;
```

### Read-Only Validation Queries (text only — do not run)

```sql
-- 1. Confirm table exists
SELECT table_name, table_schema
FROM information_schema.tables
WHERE table_schema = 'moderation' AND table_name = 'moderators';

-- 2. Confirm RLS is enabled AND forced
SELECT relname, relrowsecurity, relforcerowsecurity
FROM pg_class
WHERE relname = 'moderators'
  AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'moderation');

-- 3. Confirm all policies exist
SELECT policyname, cmd
FROM pg_policies
WHERE schemaname = 'moderation' AND tablename = 'moderators';

-- 4. Confirm updated can_manage_domain function body
SELECT pg_get_functiondef(oid)
FROM pg_proc
WHERE proname = 'can_manage_domain'
  AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'moderation');
```

### Risk Level

**MEDIUM — new table with FORCE RLS, function update.**  
Table creation is additive. FORCE RLS on a new empty table is zero-impact. The `can_manage_domain` update changes from platform_admins-only (Batch 1) to moderators-first-then-fallback — the fallback preserves all existing admin access. No access regression for current platform admins.

---

## Batch 4 — Fix block_actor: Bidirectional Follow Cleanup

### Problem

`moderation.block_actor` RPC deactivates `vc.actor_follows` only in the `blocker → blocked` direction. If the blocked actor was also following the blocker, that follow remains active. The blocked actor continues to receive content from someone who has blocked them.

Additionally, `vc.friend_ranks` cleanup is client-side only in `applyBlockSideEffects.js` with a silently swallowed failure path.

### What Changes

Replace `moderation.block_actor` with an updated version that:
1. Deactivates follows in **both directions**
2. Deletes `vc.friend_ranks` rows bidirectionally inside the RPC (server-side, atomic)

The RPC already has `SECURITY DEFINER` with `search_path = moderation, vc, public, auth`, so it can access `vc.friend_ranks` and `vc.actor_follows`.

### Migration Filename

```
20260510100000_fix_block_actor_bidirectional_follows.sql
```

### SQL Proposal (text only — do not run)

```sql
-- =============================================================
-- Migration: moderation.block_actor — bidirectional follow cleanup
-- Date: 2026-05-10
-- Scope: CARNAGE/DB remediation — fix one-directional follow deactivation
-- =============================================================
-- Problem:
--   1. block_actor only deactivates actor_follows WHERE blocker follows blocked.
--      The reverse direction (blocked follows blocker) is not deactivated.
--   2. vc.friend_ranks cleanup is client-side in applyBlockSideEffects.js
--      with a silently swallowed try/catch. If the client call fails, stale
--      friend rank rows persist.
-- Fix:
--   Add a second UPDATE for the reverse follow direction.
--   Add a DELETE on vc.friend_ranks (bidirectional) inside the RPC.
--   Both are safe because the RPC is SECURITY DEFINER with vc in search_path.
-- After deploying:
--   Remove the deleteFriendRankRowsBetweenActors() call from
--   blockActor.controller.js (see: What App Code Must Change).
-- =============================================================

CREATE OR REPLACE FUNCTION moderation.block_actor(
  p_blocker_actor_id uuid,
  p_blocked_actor_id uuid,
  p_reason text DEFAULT NULL
)
RETURNS moderation.blocks
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'moderation', 'vc', 'public', 'auth'
AS $$
DECLARE
  v_row moderation.blocks%ROWTYPE;
BEGIN
  -- Ownership check
  IF NOT moderation.is_current_vc_actor(p_blocker_actor_id) THEN
    RAISE EXCEPTION 'Not allowed to block from this actor'
      USING errcode = '42501';
  END IF;

  -- Self-block guard
  IF p_blocker_actor_id = p_blocked_actor_id THEN
    RAISE EXCEPTION 'Cannot block self'
      USING errcode = '22023';
  END IF;

  -- Upsert block row
  INSERT INTO moderation.blocks (
    blocker_domain,
    blocker_actor_id,
    blocked_domain,
    blocked_actor_id,
    status,
    reason,
    released_at,
    meta
  )
  VALUES (
    'vc', p_blocker_actor_id,
    'vc', p_blocked_actor_id,
    'active',
    p_reason,
    NULL,
    '{}'::jsonb
  )
  ON CONFLICT (blocker_domain, blocker_actor_id, blocked_domain, blocked_actor_id)
  DO UPDATE SET
    status      = 'active',
    reason      = EXCLUDED.reason,
    released_at = NULL,
    updated_at  = NOW()
  RETURNING * INTO v_row;

  -- Audit: block event
  INSERT INTO moderation.block_events (
    blocker_domain, blocker_actor_id,
    blocked_domain, blocked_actor_id,
    event_type, reason,
    actor_domain, actor_id, meta
  )
  VALUES (
    'vc', p_blocker_actor_id,
    'vc', p_blocked_actor_id,
    'blocked', p_reason,
    'vc', p_blocker_actor_id, '{}'::jsonb
  );

  -- Follow cleanup: blocker → blocked direction (existing)
  UPDATE vc.actor_follows
  SET is_active = false
  WHERE follower_actor_id = p_blocker_actor_id
    AND followed_actor_id = p_blocked_actor_id;

  -- Follow cleanup: blocked → blocker direction (NEW — was missing)
  UPDATE vc.actor_follows
  SET is_active = false
  WHERE follower_actor_id = p_blocked_actor_id
    AND followed_actor_id = p_blocker_actor_id;

  -- Friend ranks cleanup: bidirectional (moved from client-side) (NEW)
  DELETE FROM vc.friend_ranks
  WHERE (owner_actor_id = p_blocker_actor_id AND friend_actor_id = p_blocked_actor_id)
     OR (owner_actor_id = p_blocked_actor_id AND friend_actor_id = p_blocker_actor_id);

  RETURN v_row;
END;
$$;
```

### Rollback SQL (text only — do not run)

```sql
-- Restore original block_actor without bidirectional cleanup or friend_ranks
CREATE OR REPLACE FUNCTION moderation.block_actor(
  p_blocker_actor_id uuid,
  p_blocked_actor_id uuid,
  p_reason text DEFAULT NULL
)
RETURNS moderation.blocks
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'moderation', 'vc', 'public', 'auth'
AS $$
DECLARE
  v_row moderation.blocks%ROWTYPE;
BEGIN
  IF NOT moderation.is_current_vc_actor(p_blocker_actor_id) THEN
    RAISE EXCEPTION 'Not allowed to block from this actor'
      USING errcode = '42501';
  END IF;

  IF p_blocker_actor_id = p_blocked_actor_id THEN
    RAISE EXCEPTION 'Cannot block self'
      USING errcode = '22023';
  END IF;

  INSERT INTO moderation.blocks (
    blocker_domain, blocker_actor_id,
    blocked_domain, blocked_actor_id,
    status, reason, released_at, meta
  )
  VALUES (
    'vc', p_blocker_actor_id,
    'vc', p_blocked_actor_id,
    'active', p_reason, NULL, '{}'::jsonb
  )
  ON CONFLICT (blocker_domain, blocker_actor_id, blocked_domain, blocked_actor_id)
  DO UPDATE SET
    status = 'active', reason = EXCLUDED.reason,
    released_at = NULL, updated_at = NOW()
  RETURNING * INTO v_row;

  INSERT INTO moderation.block_events (
    blocker_domain, blocker_actor_id,
    blocked_domain, blocked_actor_id,
    event_type, reason, actor_domain, actor_id, meta
  )
  VALUES (
    'vc', p_blocker_actor_id, 'vc', p_blocked_actor_id,
    'blocked', p_reason, 'vc', p_blocker_actor_id, '{}'::jsonb
  );

  UPDATE vc.actor_follows
  SET is_active = false
  WHERE follower_actor_id = p_blocker_actor_id
    AND followed_actor_id = p_blocked_actor_id;

  RETURN v_row;
END;
$$;
```

### Read-Only Validation Queries (text only — do not run)

```sql
-- 1. Verify function body contains both UPDATE statements
SELECT pg_get_functiondef(oid)
FROM pg_proc
WHERE proname = 'block_actor'
  AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'moderation');

-- 2. Check for existing orphaned follows (blocked party still follows blocker)
-- These are historical stale rows from before the fix
SELECT COUNT(*) AS orphaned_follows
FROM vc.actor_follows af
JOIN moderation.blocks b
  ON b.blocker_actor_id = af.followed_actor_id
  AND b.blocked_actor_id = af.follower_actor_id
  AND b.status = 'active'
  AND b.blocker_domain = 'vc'
  AND b.blocked_domain = 'vc'
WHERE af.is_active = true;

-- 3. Check for existing orphaned friend ranks (blocked actors still in each other's ranks)
SELECT COUNT(*) AS orphaned_friend_ranks
FROM vc.friend_ranks fr
JOIN moderation.blocks b
  ON (
    (b.blocker_actor_id = fr.owner_actor_id AND b.blocked_actor_id = fr.friend_actor_id)
    OR (b.blocker_actor_id = fr.friend_actor_id AND b.blocked_actor_id = fr.owner_actor_id)
  )
WHERE b.status = 'active'
  AND b.blocker_domain = 'vc'
  AND b.blocked_domain = 'vc';
```

### Risk Level

**MEDIUM — replaces a SECURITY DEFINER RPC.**  
The change is append-only logic: two more `UPDATE`/`DELETE` statements at the end of the RPC. The ownership check and upsert logic are identical to the original. The only risk is if `vc.friend_ranks` or `vc.actor_follows` have unexpected constraints that cause the RPC to fail on block — unlikely, since these are plain UPDATEs and DELETEs.

**Migration note:** After deploying, the client-side `deleteFriendRankRowsBetweenActors` call in `blockActor.controller.js` becomes redundant but is non-harmful (it will DELETE 0 rows since the RPC already deleted them). Remove it in the next app code deploy.

---

## Batch 5 — Apply FORCE ROW LEVEL SECURITY

### Problem

Five moderation tables have RLS enabled but not forced. Any `service_role` connection (Edge Functions, background workers, Supabase admin dashboard) bypasses all policies and can read/write raw moderation data without restriction.

### What Changes

Apply `FORCE ROW LEVEL SECURITY` to all five moderation tables. This ensures policies apply to all roles including `postgres` and `service_role` connections.

**MUST deploy after Batch 1.** If applied while `can_manage_domain` is broken, the impact is zero for user-level sessions (behavior unchanged — policies still evaluate). But if service_role workers currently rely on unpoliced moderation reads (e.g., a background job reading reports), they will break after FORCE RLS is applied.

### Migration Filename

```
20260510110000_force_rls_moderation_tables.sql
```

### SQL Proposal (text only — do not run)

```sql
-- =============================================================
-- Migration: FORCE ROW LEVEL SECURITY on moderation tables
-- Date: 2026-05-10
-- Scope: CARNAGE/DB remediation — close service_role bypass
-- =============================================================
-- Prerequisites:
--   Batch 1 (fix can_manage_domain) MUST be deployed first.
--   Batch 2 (reporter INSERT policy) MUST be deployed first.
--   Any service_role background jobs reading moderation tables must
--   be audited before deploying this. If workers need bypassed access,
--   they must switch to explicit caller roles with appropriate grants.
-- =============================================================

ALTER TABLE moderation.blocks        FORCE ROW LEVEL SECURITY;
ALTER TABLE moderation.block_events  FORCE ROW LEVEL SECURITY;
ALTER TABLE moderation.reports       FORCE ROW LEVEL SECURITY;
ALTER TABLE moderation.report_events FORCE ROW LEVEL SECURITY;
ALTER TABLE moderation.actions       FORCE ROW LEVEL SECURITY;
```

### Rollback SQL (text only — do not run)

```sql
ALTER TABLE moderation.blocks        NO FORCE ROW LEVEL SECURITY;
ALTER TABLE moderation.block_events  NO FORCE ROW LEVEL SECURITY;
ALTER TABLE moderation.reports       NO FORCE ROW LEVEL SECURITY;
ALTER TABLE moderation.report_events NO FORCE ROW LEVEL SECURITY;
ALTER TABLE moderation.actions       NO FORCE ROW LEVEL SECURITY;
```

### Read-Only Validation Queries (text only — do not run)

```sql
-- Confirm FORCE RLS is applied to all five tables
SELECT relname, relrowsecurity, relforcerowsecurity
FROM pg_class
WHERE relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'moderation')
  AND relname IN ('blocks', 'block_events', 'reports', 'report_events', 'actions')
ORDER BY relname;
-- Expected: relrowsecurity = true, relforcerowsecurity = true for all five

-- Confirm no background service_role jobs exist that read these tables
-- (Manual check — no SQL can verify this automatically)
-- Review: Supabase Edge Functions, cron jobs, pg_net calls, outbox workers
```

### Risk Level

**LOW — no logic change, only bypass removal.**  
If no service_role connections currently read moderation tables, this is zero-impact. If any do, they will start receiving filtered results (or empty results if no policy grants their role access). Audit service_role consumers before deploying.

---

## Batch 6 — Dashboard Support Indexes

### Problem

Three missing index situations:
1. No composite index on `moderation.reports` optimized for dashboard queue queries (status + priority ordered).
2. No composite index on `moderation.actions` for actor-scoped hide/unhide lookups by actor+type+target.
3. Two duplicate indexes on `moderation.blocks` waste write IO on every block/unblock.

### Migration Filename

```
20260510120000_moderation_dashboard_indexes.sql
```

### SQL Proposal (text only — do not run)

```sql
-- =============================================================
-- Migration: moderation — dashboard support indexes
-- Date: 2026-05-10
-- Scope: CARNAGE/DB remediation — performance + index cleanup
-- =============================================================

-- ─────────────────────────────────────────────────────────────
-- New: Report queue index for dashboard listing
-- Covers: WHERE status IN (...) ORDER BY priority ASC, created_at ASC, id
-- Partial: only active (non-terminal) statuses to keep index small
-- ─────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_moderation_reports_dashboard_queue
  ON moderation.reports (status, priority ASC, created_at ASC, id)
  WHERE status IN ('open', 'triaged', 'in_review', 'needs_more_info');

-- ─────────────────────────────────────────────────────────────
-- New: Actions lookup by actor + target (for post/comment hide reads)
-- Covers: getHiddenPostIdsForActor, getHiddenCommentIdsForActor
-- actor_id = ? AND target_type = ? AND target_id IN (...) ORDER BY created_at DESC
-- ─────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_moderation_actions_actor_target
  ON moderation.actions (actor_id, target_type, target_id, created_at DESC);

-- ─────────────────────────────────────────────────────────────
-- Drop: Duplicate block indexes (confirmed identical to existing)
-- blocks_lookup_idx = moderation_blocks_lookup_idx (exact duplicate)
-- blocks_reverse_lookup_idx = moderation_blocks_reverse_lookup_idx (exact duplicate)
-- ─────────────────────────────────────────────────────────────
DROP INDEX IF EXISTS moderation.moderation_blocks_lookup_idx;
DROP INDEX IF EXISTS moderation.moderation_blocks_reverse_lookup_idx;
```

### Rollback SQL (text only — do not run)

```sql
-- Restore dropped duplicate indexes (only if needed for compatibility)
CREATE INDEX IF NOT EXISTS moderation_blocks_lookup_idx
  ON moderation.blocks USING btree (blocker_domain, blocker_actor_id, blocked_domain, blocked_actor_id, status);

CREATE INDEX IF NOT EXISTS moderation_blocks_reverse_lookup_idx
  ON moderation.blocks USING btree (blocked_domain, blocked_actor_id, blocker_domain, blocker_actor_id, status);

-- Drop the new indexes
DROP INDEX IF EXISTS moderation.idx_moderation_reports_dashboard_queue;
DROP INDEX IF EXISTS moderation.idx_moderation_actions_actor_target;
```

### Read-Only Validation Queries (text only — do not run)

```sql
-- 1. Confirm new indexes exist
SELECT indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'moderation'
  AND indexname IN (
    'idx_moderation_reports_dashboard_queue',
    'idx_moderation_actions_actor_target'
  );

-- 2. Confirm duplicate indexes are gone
SELECT indexname
FROM pg_indexes
WHERE schemaname = 'moderation'
  AND indexname IN (
    'moderation_blocks_lookup_idx',
    'moderation_blocks_reverse_lookup_idx'
  );
-- Expected: 0 rows

-- 3. Verify index usage after some dashboard queries run
-- (Use pg_stat_user_indexes after applying)
SELECT relname, indexrelname, idx_scan, idx_tup_read
FROM pg_stat_user_indexes
WHERE schemaname = 'moderation'
ORDER BY idx_scan DESC;
```

### Risk Level

**LOW — additive indexes + dropping confirmed duplicates.**  
New indexes are created with `IF NOT EXISTS` — safe to re-run. Dropping the duplicate indexes is safe because the covering `blocks_lookup_idx` and `blocks_reverse_lookup_idx` remain. The only risk is if some external tool explicitly references the `moderation_blocks_*` index names — verify no such tools exist before deploying.

---

## What Blocks Dashboard Development

These are the exact blockers. Dashboard implementation must not start until all of these are resolved:

| Blocker | Batch | Why |
|---|---|---|
| `can_manage_domain` is broken | Batch 1 | Without this fix, all moderator SELECT policies are open to everyone. Dashboard queries would expose all reports to all users. |
| App-layer admin check is broken | App code fix | Without this fix, `assertModerationAccessController` always throws FORBIDDEN. Every dashboard action fails at the controller level. |
| Reporter INSERT policy missing | Batch 2 | Without this, `skipReportEventsInsertForSession` silences audit trail for user sessions. The dashboard event timeline is empty for all user-filed reports. |

The dashboard cannot be safely built or deployed until Batch 1 and the app-layer fix are live. Batch 2 is critical for audit trail integrity. Everything else is supportive.

---

## What Can Be Done After Dashboard MVP

These do not block initial dashboard development:

| Item | Batch | Can Wait Because |
|---|---|---|
| `moderation.moderators` table | Batch 3 | Dashboard MVP can use `platform_admins` via updated `can_manage_domain` from Batch 1. Role separation is a v2 feature. |
| Bidirectional follow cleanup | Batch 4 | Does not affect report queue or content moderation. Block side effects are independent. |
| FORCE RLS | Batch 5 | Users cannot bypass policies via browser JS. This only closes the service_role bypass path. |
| Dashboard indexes | Batch 6 | Dashboard will work without them at low data volume. Add before the queue grows. |
| `expires_at` enforcement | Not in batches | Temporary action expiry — can be added as a separate cron job later. |
| `chat.moderation_actions` cleanup | Not in batches | Legacy table with no current consumers. Confirm RLS, then decide if it should be preserved or archived. |

---

## What App Code Must Change After DB Fixes

### After Batch 1 + Batch 2

**File:** [assertModerationAccess.dal.js](apps/VCSM/src/features/moderation/dal/assertModerationAccess.dal.js)

**Current broken implementation:**
```js
const { data, error } = await supabase
  .schema('learning')
  .from('platform_admins')
  .select('actor_id')
  .eq('actor_id', actorId)   // BUG: actorId is a vc UUID, not a learning UUID
  .limit(1)
```

**Why it's broken:** `learning.platform_admins.actor_id` is FK'd to `learning.actors(id)` — these are learning actor UUIDs. A vc actor UUID will never match. `isModerationAuthorizedDAL` always returns `false`. `assertModerationAccessController` always throws FORBIDDEN.

**Proposed fix (app code — text only, do not modify):**
```js
// Use the existing SECURITY DEFINER function that correctly resolves
// auth.uid() → learning.actor_id → platform_admins
export async function isModerationAuthorizedDAL(actorId) {
  if (!actorId) return false

  try {
    const { data, error } = await supabase
      .schema('learning')
      .rpc('is_current_user_platform_admin')

    if (error) {
      if (error.code === '42P01') return false  // function not found
      throw error
    }

    return data === true
  } catch {
    return false
  }
}
```

Note: The `actorId` parameter becomes implicit — the function checks the currently authenticated session via `auth.uid()` server-side. The caller does not need to change (controller still passes actorId for logging purposes, but the actual auth check uses the session).

---

**File:** [reports.dal.js](apps/VCSM/src/features/moderation/dal/reports.dal.js)

**Current workaround (remove after Batch 2 is deployed):**
```js
let skipReportEventsInsertForSession = false
// ... and the flag-setting code in insertReportEventRow
```

**Why it can be removed:** After Batch 2, `moderation_report_events_insert_self` policy exists, so reporters can insert `created` events. The RLS denial that triggered the flag no longer fires. New sessions will write events correctly.

**What to do:** Remove the `skipReportEventsInsertForSession` flag, the `if (skipReportEventsInsertForSession) return` guard, and the `skipReportEventsInsertForSession = true` assignment in `insertReportEventRow`. The `isRlsDenied` helper can be kept or removed — it has no other callers.

---

### After Batch 3

**File:** [assertModerationAccess.dal.js](apps/VCSM/src/features/moderation/dal/assertModerationAccess.dal.js)

Update to check `moderation.moderators` via a new RPC, with fallback to `learning.is_current_user_platform_admin`. Or rely on the DB-level `can_manage_domain` function doing the dual-check (Batch 3 updates it). In this case, no app-level change is needed beyond the Batch 1 fix above — the DB layer handles the moderators table check transparently.

---

### After Batch 4

**File:** [blockActor.controller.js](apps/VCSM/src/features/block/controllers/blockActor.controller.js)

Remove the client-side `deleteFriendRankRowsBetweenActors` call. After Batch 4, the RPC handles this server-side:

```js
// Remove these lines from blockActorController and toggleBlockActorController:
try {
  await deleteFriendRankRowsBetweenActors(blockerActorId, blockedActorId);
} catch {}
```

Also remove the import of `deleteFriendRankRowsBetweenActors` from `@/features/block/helpers/applyBlockSideEffects`.

**File:** [applyBlockSideEffects.js](apps/VCSM/src/features/block/helpers/applyBlockSideEffects.js)

Mark `deleteFriendRankRowsBetweenActors` as deprecated or remove the file if it has no other callers.

---

## Final Go/No-Go for Dashboard Implementation

### Current State (Before Any Fix)

| Gate | Status | Notes |
|---|---|---|
| DB moderator auth (can_manage_domain) | ❌ BROKEN | Every vc user is a moderator at DB level |
| App moderator auth (assertModerationAccess) | ❌ BROKEN | No vc user can perform moderation actions |
| Report audit trail (report_events INSERT) | ❌ BROKEN | Reporter events always fail, trail silenced |
| Report queue readable by admins | ❌ BROKEN | No real admin check |
| Hide/dismiss actions work | ❌ BLOCKED | App-layer always throws FORBIDDEN |

**Go/No-Go: NO-GO.** Both authorization layers are broken in opposite directions. Dashboard cannot safely proceed.

---

### After Batch 1 + App Code Fix for assertModerationAccess.dal.js

| Gate | Status | Notes |
|---|---|---|
| DB moderator auth (can_manage_domain) | ✅ FIXED | Only platform_admins can access moderation data |
| App moderator auth (assertModerationAccess) | ✅ FIXED | Correct session-based check via RPC |
| Report queue readable by admins | ✅ READY | Moderator SELECT policy now correctly scoped |
| Hide/dismiss actions work | ✅ READY | Controller and DB both authorize correctly |
| Report audit trail | ⚠️ PARTIAL | Existing reports have no events (historical gap); new reports work after Batch 2 |

**Go/No-Go: CONDITIONAL GO — Batch 1 + app-layer fix are the minimum viable gate.** Deploy Batch 2 in the same release to avoid partial state.

---

### Recommended Release Sequence

```
Release 1 (unblocks dashboard):
  • Batch 2 — reporter INSERT policy (zero risk, deploy first)
  • Batch 1 — fix can_manage_domain (critical)
  • App code — fix assertModerationAccess.dal.js (must ship same release as Batch 1)
  • App code — remove skipReportEventsInsertForSession flag (safe after Batch 2)

Release 2 (independent, deploy any time):
  • Batch 4 — fix block_actor RPC (bidirectional follow + friend_ranks)
  • App code — remove client-side deleteFriendRankRowsBetweenActors call

Release 3 (dashboard performance, deploy before queue grows):
  • Batch 6 — dashboard indexes + drop duplicate block indexes

Release 4 (after Release 1 is verified stable):
  • Batch 5 — FORCE RLS (verify no service_role consumers first)

Release 5 (moderation v2 — role separation):
  • Batch 3 — create moderation.moderators + update can_manage_domain
  • App code — optional: update assertModerationAccess.dal.js to use moderators
```

---

## Final Read-Only Statement

No DB writes were executed during this planning.  
No schema changes were applied.  
No code was modified.  
No migrations were created or run.  
All SQL in this document is labeled "text only — do not run."  
This document is a proposal only.
