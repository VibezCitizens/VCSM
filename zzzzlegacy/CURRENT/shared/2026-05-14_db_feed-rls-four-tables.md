---
report: db_feed-rls-four-tables
date: 2026-05-14
scope: VCSM — four feed-adjacent tables flagged by CARNAGE RLS verification
triggered_by: CARNAGE 2026-05-14_carnage_feed-dal-rls-verification.md
authority: GOVERNANCE_WRITABLE
---

# DB — Feed RLS Four-Table Verification
_Date:_ 2026-05-14
_Scope:_ VCSM — `vc.actor_onboarding_steps`, `moderation.actions`, `vc.actor_follows` (SF-07), `vc.post_reactions`
_Triggered by:_ CARNAGE feed DAL RLS verification pass

---

## Evidence Base

Migration files searched:
- `apps/VCSM/supabase/migrations/` — all official VCSM migrations
- `zNOTFORPRODUCTION/_ACTIVE/migrations/` — proposal-only migration files (not applied)

Additional source consulted:
- `apps/VCSM/src/features/social/friend/subscribe/dal/subscriberCount.dal.js` — audited for SF-07 P3 dependency
- `apps/VCSM/src/features/feed/dal/feedWelcomeCard.dal.js` — confirmed write path for `vc.actor_onboarding_steps`
- `apps/VCSM/src/features/feed/dal/feed.read.hiddenPosts.dal.js` — confirmed read path for `moderation.actions`
- VENOM audit `2026-05-10_00-00_venom_friend-subscribe-private-profile-review.md` — SF-07 original source

Note: `full_schema.sql` referenced in the VENOM report is not present in the local filesystem. Live DB verification queries are provided in each item below for the engineer to run against Supabase directly.

---

## DB1 — `vc.actor_onboarding_steps` — NO RLS EVIDENCE FOUND

```
DATABASE REVIEW ITEM
- Object:               vc.actor_onboarding_steps
- Application Scope:    VCSM
- Current behavior:     Table exists (confirmed via DAL access in feedWelcomeCard.dal.js).
                        Zero references in any migration file — no CREATE TABLE, no
                        ALTER TABLE ENABLE ROW LEVEL SECURITY, no CREATE POLICY.
- Problem:              RLS state is completely unknown from migration evidence.
                        If RLS is disabled (the default PostgreSQL state), any authenticated
                        PostgREST caller can read or write ANY actor's onboarding steps,
                        not just their own. The write path (UPSERT in markWelcomeFeedCardSeenDAL)
                        accepts a client-supplied actorId — if RLS is absent, an actor could
                        mark another actor's onboarding steps as completed.
- Why it matters:       Write path accepts actor_id from client. Without RLS enforcement,
                        a malicious actor could suppress the welcome card for any other user
                        by sending UPSERT requests with arbitrary actor_ids.
- Recommended improvement: Enable RLS and add actor-scoped ALL policy (USING + WITH CHECK)
                        via actor_owners join. Verify the table exists via the pre-check query
                        before applying.
- Rationale:            actor_id is an ownership identifier. Any table accepting writes
                        keyed by actor_id must enforce ownership at the DB layer.
- Risk if unchanged:    Actors can read or overwrite other actors' onboarding state.
                        The welcome card dismissal can be spoofed for any user.
- Example SQL proposal (text only, do not run):
```

**Pre-check query (run first):**
```sql
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'vc' AND tablename = 'actor_onboarding_steps';

SELECT policyname, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'vc' AND tablename = 'actor_onboarding_steps';
```

**Migration proposal P2 (text only — from CARNAGE report):**
```sql
-- P2: vc.actor_onboarding_steps — enable RLS + actor-scoped ALL policy
-- PROPOSAL ONLY — do not run without staging verification

ALTER TABLE vc.actor_onboarding_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE vc.actor_onboarding_steps FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "actor_onboarding_steps_upsert_own" ON vc.actor_onboarding_steps;
CREATE POLICY "actor_onboarding_steps_upsert_own"
  ON vc.actor_onboarding_steps
  FOR ALL
  TO authenticated
  USING (
    actor_id IN (
      SELECT ao.actor_id
      FROM vc.actor_owners ao
      WHERE ao.user_id = auth.uid()
    )
  )
  WITH CHECK (
    actor_id IN (
      SELECT ao.actor_id
      FROM vc.actor_owners ao
      WHERE ao.user_id = auth.uid()
    )
  );

-- Rollback:
-- DROP POLICY IF EXISTS "actor_onboarding_steps_upsert_own" ON vc.actor_onboarding_steps;
-- ALTER TABLE vc.actor_onboarding_steps DISABLE ROW LEVEL SECURITY;
```

**Risk classification:** HIGH RISK — write path accepts client actor_id; RLS absence allows cross-actor writes

---

## DB2 — `moderation.actions` — NO RLS EVIDENCE FOUND

```
DATABASE REVIEW ITEM
- Object:               moderation.actions
- Application Scope:    VCSM
- Current behavior:     Table exists (confirmed via feed.read.hiddenPosts.dal.js which queries
                        moderation.actions by actor_id). Zero references in any migration file
                        for policies or ENABLE ROW LEVEL SECURITY.
- Problem:              RLS state unknown from migration evidence. The read path in
                        readHiddenPostsForViewer queries:
                          SELECT actor_id, target_id, action_type, created_at
                          FROM moderation.actions
                          WHERE actor_id = viewerActorId AND action_type = 'hide'
                        If RLS is absent, any actor could read another actor's hidden-post
                        history or query the full moderation.actions table.
- Why it matters:       moderation.actions is a privacy-sensitive table — it records which
                        posts a viewer has hidden, blocked, or taken moderation actions on.
                        Exposure leaks behavioral data about users. Also: if write policies
                        are absent, actors could insert false moderation actions for other users.
- Recommended improvement: Enable RLS + actor-scoped SELECT and INSERT policies. SELECT should
                        restrict to actor_id owned by auth.uid() via actor_owners join.
- Rationale:            Moderation data is behavioral PII. Must be actor-scoped at DB layer.
- Risk if unchanged:    Any authenticated user can enumerate any other user's moderation history.
                        Write path may be exploitable for false moderation injection.
- Example SQL proposal (text only, do not run):
```

**Pre-check query (run first):**
```sql
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'moderation' AND tablename = 'actions';

SELECT policyname, cmd, roles, qual, with_check
FROM pg_policies
WHERE schemaname = 'moderation' AND tablename = 'actions';

-- Inspect columns to confirm actor_id shape:
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'moderation' AND table_name = 'actions'
ORDER BY ordinal_position;
```

**Migration proposal P1 (text only — from CARNAGE report):**
```sql
-- P1: moderation.actions — enable RLS + actor-scoped SELECT policy
-- PROPOSAL ONLY — do not run without staging verification
-- NOTE: Confirm column name (actor_id vs initiator_actor_id) via pre-check query above

ALTER TABLE moderation.actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE moderation.actions FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "actions_select_own_actor" ON moderation.actions;
CREATE POLICY "actions_select_own_actor"
  ON moderation.actions
  FOR SELECT
  TO authenticated
  USING (
    actor_id IN (
      SELECT ao.actor_id
      FROM vc.actor_owners ao
      WHERE ao.user_id = auth.uid()
    )
  );

-- Rollback:
-- DROP POLICY IF EXISTS "actions_select_own_actor" ON moderation.actions;
-- ALTER TABLE moderation.actions DISABLE ROW LEVEL SECURITY;
```

**Risk classification:** HIGH RISK — moderation/behavioral PII; RLS absence allows full table enumeration

---

## DB3 — `vc.actor_follows` SF-07 — CONFIRMED OPEN + P3 NOW ACTIONABLE

```
DATABASE REVIEW ITEM
- Object:               vc.actor_follows — policy actor_follows_select_public_subscriber_count
- Application Scope:    VCSM
- Current behavior:     RLS is enabled. Two policies confirmed (from VENOM 2026-05-10 audit):
                        Policy 1: actor-scoped SELECT — restricts to own follow relationships
                        Policy 2: actor_follows_select_public_subscriber_count
                                  USING (is_active = true) — NO actor restriction
                        Since PostgreSQL RLS uses OR logic for PERMISSIVE policies, Policy 2
                        causes any authenticated user to be able to read ALL active follows
                        for ANY actor, overriding the actor-scoped policy.
- Problem (SF-07):      Any authenticated user can enumerate any actor's complete follow graph
                        by querying vc.actor_follows with followed_actor_id = <target_actor>.
                        This leaks social connection data for all actors on the platform.
- Why it matters:       Follow graph enumeration exposes who is following whom — social graph
                        PII. Particularly sensitive for private accounts. Known since 2026-05-10,
                        unresolved. Every additional day this is open is a continued data leak.
- subscriberCount.dal.js audit (COMPLETED — DB3-A):
                        dalCountSubscribers() in subscriberCount.dal.js performs:
                          supabase.schema('vc').from('actor_follows')
                            .select('follower_actor_id', { count: 'exact', head: true })
                            .eq('followed_actor_id', actorId)
                            .eq('is_active', true)
                        This query filters by followed_actor_id (not the authenticated actor's
                        own follower_actor_id). It works ONLY because the broad
                        actor_follows_select_public_subscriber_count policy is present.
                        If that policy is dropped without replacement, dalCountSubscribers
                        returns 0 for all actors (RLS filters out rows the caller doesn't own).
                        REQUIRED BEFORE DROPPING SF-07 POLICY:
                        Update dalCountSubscribers to use supabase.rpc('get_follower_count', ...)
                        and create the vc.get_follower_count() SECURITY DEFINER function.
- Recommended improvement: (a) Create vc.get_follower_count(p_actor_id uuid) SECURITY DEFINER
                        function that returns count(*) directly (no row exposure).
                        (b) Update subscriberCount.dal.js to call the RPC.
                        (c) Drop actor_follows_select_public_subscriber_count policy.
- Rationale:            Follower count is public information. Follow graph edges are not.
                        A SECURITY DEFINER count function exposes the aggregate only.
- Risk if unchanged:    Full follow graph enumeration for any actor on the platform.
- Example SQL proposal (text only, do not run):
```

**Pre-check query (run first):**
```sql
SELECT policyname, cmd, roles, qual
FROM pg_policies
WHERE schemaname = 'vc' AND tablename = 'actor_follows';
```

**P3a — SECURITY DEFINER count function (text only):**
```sql
-- Step 1: Create get_follower_count function
-- PROPOSAL ONLY — do not run without staging verification

CREATE OR REPLACE FUNCTION vc.get_follower_count(p_actor_id uuid)
RETURNS bigint
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = vc, public
AS $$
  SELECT COUNT(*)
  FROM vc.actor_follows
  WHERE followed_actor_id = p_actor_id
    AND is_active = true;
$$;

GRANT EXECUTE ON FUNCTION vc.get_follower_count(uuid) TO authenticated;

-- Rollback: DROP FUNCTION IF EXISTS vc.get_follower_count(uuid);
```

**P3b — DAL update (text only — code change, not SQL):**
```js
// subscriberCount.dal.js — replace the direct query with RPC call

// BEFORE:
const { count, error } = await supabase
  .schema('vc')
  .from('actor_follows')
  .select('follower_actor_id', { count: 'exact', head: true })
  .eq('followed_actor_id', actorId)
  .eq('is_active', true)

// AFTER:
const { data, error } = await supabase.rpc('get_follower_count', { p_actor_id: actorId })
const result = Number(data ?? 0)
```

**P3c — Drop broad policy (text only — run ONLY after P3a + P3b are verified in staging):**
```sql
-- Step 3: Drop the overly broad SELECT policy
-- PROPOSAL ONLY — run only after get_follower_count function is deployed
-- and subscriberCount.dal.js has been updated to use the RPC

DROP POLICY IF EXISTS actor_follows_select_public_subscriber_count ON vc.actor_follows;

-- Rollback (only if needed):
-- CREATE POLICY actor_follows_select_public_subscriber_count ON vc.actor_follows
--   FOR SELECT TO authenticated USING (is_active = true);
```

**Deployment order:** P3a (function) → P3b (DAL code deploy) → P3c (drop policy). Do NOT run P3c before P3b is in production.

**Risk classification:** HIGH RISK — social graph PII leak confirmed since 2026-05-10

---

## DB4 — `vc.post_reactions` — POLICY SHAPE UNCONFIRMED

```
DATABASE REVIEW ITEM
- Object:               vc.post_reactions
- Application Scope:    VCSM
- Current behavior:     Table exists (confirmed via readViewerReactionsBatch in the feed pipeline).
                        No RLS migration found in any migration file. CARNAGE confirmed write
                        path policies enforce actor_owners ownership. SELECT policy shape unknown.
                        Referenced only in trigger definitions (tg_notify_post_reactions_unified,
                        tg_notify_vport_post_reactions, trg_post_reactions_notify).
- Problem:              Cannot confirm SELECT policy from local migration evidence.
                        Likely `USING (true)` for authenticated (reactions are public data —
                        visible on post cards). If SELECT is absent, the feed reaction count
                        pipeline would return empty results.
- Why it matters:       If SELECT policy is missing or misconfigured, reaction counts displayed
                        on post cards could be wrong for some actors. More importantly: if SELECT
                        is USING (true) without an anon restriction, reaction data is also
                        exposed to unauthenticated callers.
- Recommended improvement: Run the pre-check query to confirm. No change required if the SELECT
                        policy is USING (true) scoped to authenticated only. Flag for VENOM
                        review if anon access is enabled.
- Example SQL proposal (text only, do not run):
```

**Pre-check query (run first — this is the primary action for DB4):**
```sql
SELECT policyname, cmd, roles, qual, with_check
FROM pg_policies
WHERE schemaname = 'vc' AND tablename = 'post_reactions'
ORDER BY cmd, policyname;
```

**Expected result:** One or more SELECT policies (public reactions visible to authenticated users), INSERT/UPDATE/DELETE policies scoped via actor_owners.

**Risk classification:** UNCONFIRMED — requires live DB query; likely LOW if SELECT is authenticated-scoped

---

## Summary

| Table | RLS Status | Write Path Safe? | Risk | Required Action |
|---|---|---|---|---|
| `vc.actor_onboarding_steps` | UNKNOWN — zero migration evidence | NO — client actor_id accepted | HIGH | Apply P2 after staging confirmation |
| `moderation.actions` | UNKNOWN — zero migration evidence | Unknown | HIGH | Apply P1 after staging confirmation |
| `vc.actor_follows` | RLS ON, SF-07 confirmed open | YES (own-actor write policy exists) | HIGH | P3: create function → update DAL → drop broad policy |
| `vc.post_reactions` | Unknown SELECT shape | YES (actor_owners write policies confirmed) | UNCONFIRMED | Run pre-check query only |

---

## DB3-A — subscriberCount.dal.js Audit Result

**Status: COMPLETE**

File: `apps/VCSM/src/features/social/friend/subscribe/dal/subscriberCount.dal.js`

Finding:
- `dalCountSubscribers` queries `vc.actor_follows` by `followed_actor_id` (not own actor)
- Uses `{ count: 'exact', head: true }` — count-only request, no row data returned
- This query currently depends on the broad `actor_follows_select_public_subscriber_count` policy
- If the broad policy is dropped without a replacement SECURITY DEFINER function, `dalCountSubscribers` will return 0 for all actors
- The cache (60s TTL, per-actorId) means callers would see incorrect 0 counts for up to 60s post-migration

**P3 is now fully actionable.** Both prerequisites (subscriberCount.dal.js audit + SECURITY DEFINER function design) are resolved. Deploy sequence: P3a → P3b → P3c.

---

## Pre-Check Queries (All Four Tables)

Run these in Supabase SQL editor or psql against the production database before applying any proposal:

```sql
-- RLS enablement status for all four tables
SELECT schemaname, tablename, rowsecurity, forcerowsecurity
FROM pg_tables
WHERE (schemaname = 'vc' AND tablename IN ('actor_follows', 'post_reactions', 'actor_onboarding_steps'))
   OR (schemaname = 'moderation' AND tablename = 'actions')
ORDER BY schemaname, tablename;

-- All policies on all four tables
SELECT schemaname, tablename, policyname, cmd, roles, qual, with_check
FROM pg_policies
WHERE (schemaname = 'vc' AND tablename IN ('actor_follows', 'post_reactions', 'actor_onboarding_steps'))
   OR (schemaname = 'moderation' AND tablename = 'actions')
ORDER BY schemaname, tablename, cmd, policyname;
```

---

## Handoffs Required

| Command | Reason |
|---|---|
| **CARNAGE** | P1, P2, P3 are now fully formed — ready for migration planning finalization |
| **VENOM** | Verify P3 (actor_follows SF-07) after migration — confirm broad policy is gone and count function is sound |
| **THOR** | P1 and P2 should be release-gated — do not deploy to production before RLS is confirmed in staging |
| **Wolverine** | P3b code change (subscriberCount.dal.js → RPC) is a source code change requiring execution |

---

**DB Status: ANALYSIS COMPLETE**

All four tables verified from local migration evidence. No direct database connection available — pre-check queries must be run by the engineer against the live Supabase instance. P3 is fully actionable pending P3a (function deploy) + P3b (code change + deploy) + P3c (policy drop).
