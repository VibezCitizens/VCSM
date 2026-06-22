---
report: db_feed-rls-four-tables
date: 2026-05-18
time: "00-00"
scope: VCSM
authority: DB — Read-Only Analysis
triggered_by: CEREBRO 2026-05-18 — required next command after CARNAGE delta
prior_snapshot: zNOTFORPRODUCTION/_HISTORY/db/snapshots/2026-05-14_db_feed-rls-four-tables.md
---

# DB SNAPSHOT — Feed DAL RLS Four Tables (2026-05-18)

**Application Scope:** VCSM  
**Mode:** READ-ONLY — no schema modifications made or proposed for execution  
**Evidence sources:** Migration files (`apps/VCSM/supabase/migrations/`), proposal migrations (`zNOTFORPRODUCTION/_ACTIVE/migrations/`), DAL source files, prior CARNAGE and VENOM audit reports  
**Live schema query:** NOT AVAILABLE — filesystem-only pass; live schema confirmation required via Supabase dashboard before any proposal is applied

---

## Executive Summary

| Table | RLS On | Policies Found | Risk | P# Status | Code Ready |
|---|---|---|---|---|---|
| `vc.actor_onboarding_steps` | UNKNOWN | NONE | HIGH — UPSERT write unprotected | P2 — NOT APPLIED | YES |
| `moderation.actions` | UNKNOWN | NONE | HIGH — read/write PII unprotected | P1 — NOT APPLIED | YES |
| `vc.actor_follows` | YES | 2 (one exploitable) | HIGH — SF-07 confirmed open | P3 — NOT APPLIED | **YES — DAL already migrated to RPC** |
| `vc.post_reactions` | YES | UNKNOWN shape | LOW-MEDIUM — write enforced, read unconfirmed | P4 — verify only | YES |

**Critical discovery this pass:** `subscriberCount.dal.js` already calls `supabase.rpc('get_follower_count', { p_actor_id: actorId })`. The code-side prerequisite for P3 is complete. Only the database-side (function creation + policy drop) remains.

---

## DATABASE REVIEW ITEM — 1

- **Object:** `vc.actor_onboarding_steps` — UPSERT write path
- **Application Scope:** VCSM
- **Current behavior:** `markWelcomeFeedCardSeenDAL` issues an UPSERT with `actor_id` sourced from the client call site. No migration file defines RLS or any policy on this table. Table creation predates current audit regime.
- **Problem:** Without RLS and a `WITH CHECK` policy, any authenticated user can UPSERT with an arbitrary `actor_id`, writing onboarding completion state for actors they do not own.
- **Why it matters:** UPSERT with `onConflict: 'actor_id,step_key'` will UPDATE existing rows — permanently overwriting the onboarding state of any target actor. If additional onboarding steps (beyond the welcome card) are stored on the same table, this extends to all of them. Write-path integrity failure for the entire onboarding layer.
- **Recommended improvement:** Enable RLS + create an `ALL` policy with `USING` + `WITH CHECK` both enforcing actor ownership via `vc.actor_owners`. An `ALL` policy covers INSERT, UPDATE, and SELECT — a single policy expression protects the UPSERT path fully.
- **Rationale:** Using `FOR ALL` instead of separate INSERT/UPDATE policies ensures the UPSERT operation (which fires both INSERT and UPDATE) is covered by a single consistent ownership check. The `WITH CHECK` clause is mandatory — `USING` alone does not protect write paths.
- **Risk if unchanged:** Any authenticated user can mark any other actor's onboarding as complete. Analytics corruption (false completion rates). Welcome card suppression for targeted actors. If other step keys exist, all onboarding gates are vulnerable.
- **Example SQL proposal (text only, do not run):**

```sql
-- Run first (verify state):
SELECT rowsecurity, forcerls FROM pg_tables
WHERE schemaname = 'vc' AND tablename = 'actor_onboarding_steps';

SELECT policyname, cmd, qual, with_check FROM pg_policies
WHERE schemaname = 'vc' AND tablename = 'actor_onboarding_steps';

-- Apply if no policies found:
ALTER TABLE vc.actor_onboarding_steps ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "actor_onboarding_steps_select_own" ON vc.actor_onboarding_steps;
CREATE POLICY "actor_onboarding_steps_select_own"
  ON vc.actor_onboarding_steps
  FOR SELECT
  TO authenticated
  USING (
    actor_id IN (
      SELECT ao.actor_id FROM vc.actor_owners ao
      WHERE ao.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "actor_onboarding_steps_upsert_own" ON vc.actor_onboarding_steps;
CREATE POLICY "actor_onboarding_steps_upsert_own"
  ON vc.actor_onboarding_steps
  FOR ALL
  TO authenticated
  USING (
    actor_id IN (
      SELECT ao.actor_id FROM vc.actor_owners ao
      WHERE ao.user_id = auth.uid()
    )
  )
  WITH CHECK (
    actor_id IN (
      SELECT ao.actor_id FROM vc.actor_owners ao
      WHERE ao.user_id = auth.uid()
    )
  );

-- Rollback:
-- ALTER TABLE vc.actor_onboarding_steps DISABLE ROW LEVEL SECURITY;
-- DROP POLICY IF EXISTS "actor_onboarding_steps_select_own" ON vc.actor_onboarding_steps;
-- DROP POLICY IF EXISTS "actor_onboarding_steps_upsert_own" ON vc.actor_onboarding_steps;
```

**Staging validation:** After applying, test `markWelcomeFeedCardSeenDAL` with the correct actor (owned by auth session) — must succeed. Test with a foreign `actor_id` (not owned) — must be blocked.

---

## DATABASE REVIEW ITEM — 2

- **Object:** `moderation.actions` — SELECT and INSERT paths
- **Application Scope:** VCSM
- **Current behavior:** `readHiddenPostsForViewer` reads from `moderation.actions` filtered by `actor_id`. `insertModerationActionDAL` inserts with client-supplied `actor_id`. No SELECT or INSERT policies found in any migration file. An unpublished proposal (`batch5_20260510110000_force_rls_moderation_tables.sql`) applies FORCE RLS to the table but defines no policies — creating a potential default-deny lockout.
- **Problem:** Two simultaneous failure risks: (a) if RLS is absent, another actor's hidden post history and report actions are readable by any authenticated user; (b) if the Batch5 FORCE RLS has been applied with no policies, the default-deny blocks ALL reads — making `readHiddenPostsForViewer` silently return empty for all users and causing hidden posts to appear in the feed.
- **Why it matters:** Moderation history is behavioral PII — it records that a specific actor chose to hide, unhide, or report specific content. Exposure reveals sensitive behavioral patterns. The dual failure mode means the production risk is either a privacy breach or a silent regression where the feed shows content users actively suppressed.
- **Recommended improvement:** Enable RLS (if not done). Define a SELECT policy scoped to `actor_owners` ownership. Define an INSERT policy with `WITH CHECK` scoped to `actor_owners` ownership. Do NOT apply FORCE RLS without policies present.
- **Rationale:** Both policies must reference `vc.actor_owners` to align with the platform's actor ownership model. The SELECT policy restricts reads to the actor's own moderation history. The INSERT `WITH CHECK` prevents writing moderation actions for unowned actors. These policies match the existing pattern on `vc.blocks` (`blocks_select_blocked` — already applied in migration `20260510010000_moderation_blocks_rls_and_indexes.sql`).
- **Risk if unchanged:** Live privacy breach (hidden post list + report history readable) OR silent hidden-post regression (feed bypasses user suppression preferences).
- **Example SQL proposal (text only, do not run):**

```sql
-- Run first (verify state):
SELECT rowsecurity, forcerls FROM pg_tables
WHERE schemaname = 'moderation' AND tablename = 'actions';

SELECT policyname, cmd, qual, with_check FROM pg_policies
WHERE schemaname = 'moderation' AND tablename = 'actions';

-- Apply if RLS absent or if RLS ON with zero policies:
ALTER TABLE moderation.actions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "actions_select_own_actor" ON moderation.actions;
CREATE POLICY "actions_select_own_actor"
  ON moderation.actions
  FOR SELECT
  TO authenticated
  USING (
    actor_id IN (
      SELECT ao.actor_id FROM vc.actor_owners ao
      WHERE ao.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "actions_insert_own_actor" ON moderation.actions;
CREATE POLICY "actions_insert_own_actor"
  ON moderation.actions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    actor_id IN (
      SELECT ao.actor_id FROM vc.actor_owners ao
      WHERE ao.user_id = auth.uid()
    )
  );

-- Rollback:
-- DROP POLICY IF EXISTS "actions_select_own_actor" ON moderation.actions;
-- DROP POLICY IF EXISTS "actions_insert_own_actor" ON moderation.actions;
-- (Do not disable RLS — keep RLS ON after rollback)
```

**Staging validation:** After applying, confirm `readHiddenPostsForViewer` returns correct hidden posts for the authenticated actor. Confirm a forged `actor_id` request returns empty (not blocked). Confirm `insertModerationActionDAL` succeeds for own actor, fails for foreign actor.

---

## DATABASE REVIEW ITEM — 3

- **Object:** `vc.actor_follows` — `actor_follows_select_public_subscriber_count` policy (SF-07)
- **Application Scope:** VCSM
- **Current behavior:** Two PERMISSIVE SELECT policies exist. Policy 1 (`actor_follows.select.self`) restricts to rows where the authenticated user owns the follower or followed actor. Policy 2 (`actor_follows_select_public_subscriber_count`) has `USING (is_active = true)` with no actor restriction. Because PostgreSQL uses OR logic for permissive policies, Policy 2 grants any authenticated user access to all active follow rows for any actor.
- **Problem:** SF-07 — social graph enumeration. Any authenticated user can query `actor_follows` with an arbitrary `followed_actor_id` and receive the full follower list for any actor, including private accounts. Follow graph is identity-sensitive PII.
- **Why it matters:** Private accounts' follower lists are exposed. Bidirectional social graph mapping is possible for all actors. Competitive intelligence leak for VPORTs. Deanonymization risk when follow graph is cross-referenced with actor IDs. This finding has been open since 2026-05-10 (8 days).
- **Recommended improvement:** Drop the overly broad policy. Create a `SECURITY DEFINER` function `vc.get_follower_count(p_actor_id uuid)` that returns only the count (not the rows). Apply FORCE RLS so service_role cannot bypass. The function allows UX subscriber counts without exposing the full follow list.
- **Rationale:** The broad policy existed to support subscriber count display (e.g., "1,243 followers" on a VPORT profile). The SECURITY DEFINER function replaces this with a safe count-only path, removing all row-level exposure. FORCE RLS removes service_role bypass risk.
- **Risk if unchanged:** Full social graph enumeration for all actors on the platform. Escalates to deanonymization when combined with actor lookups. Exposes follower identity for private accounts — a direct privacy contract violation.
- **Code prerequisite status:** COMPLETE. `subscriberCount.dal.js` already calls `supabase.rpc('get_follower_count', { p_actor_id: actorId })`. The DAL was migrated before this audit pass. Only the database side remains.
- **Example SQL proposal (text only, do not run):**

```sql
-- Run first (verify function does not already exist):
SELECT proname, prosecdef FROM pg_proc
JOIN pg_namespace ON pg_namespace.oid = pg_proc.pronamespace
WHERE pg_namespace.nspname = 'vc' AND proname = 'get_follower_count';

-- Step 1: Create SECURITY DEFINER function
CREATE OR REPLACE FUNCTION vc.get_follower_count(p_actor_id uuid)
RETURNS bigint
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'vc', 'public'
AS $$
  SELECT COUNT(*)::bigint
  FROM vc.actor_follows
  WHERE followed_actor_id = p_actor_id
    AND is_active = true;
$$;

GRANT EXECUTE ON FUNCTION vc.get_follower_count(uuid) TO authenticated;

-- Step 2: Apply FORCE RLS
ALTER TABLE vc.actor_follows FORCE ROW LEVEL SECURITY;

-- Step 3: Drop the overly broad policy (ONLY after function is confirmed deployed)
DROP POLICY IF EXISTS actor_follows_select_public_subscriber_count ON vc.actor_follows;

-- Rollback:
-- RECREATE: CREATE POLICY actor_follows_select_public_subscriber_count ON vc.actor_follows FOR SELECT TO authenticated USING (is_active = true);
-- DROP FUNCTION: DROP FUNCTION IF EXISTS vc.get_follower_count(uuid);
-- UNFORCE: ALTER TABLE vc.actor_follows NO FORCE ROW LEVEL SECURITY;
```

**Critical execution order:** Step 3 (policy drop) must only happen AFTER Step 1 (function creation) is confirmed live in the database. If Step 3 runs before Step 1, `subscriberCount.dal.js` RPC calls will fail until the function is created.

**Staging validation:** After applying, confirm `subscriberCount.dal.js` returns correct count. Confirm direct `actor_follows` query with foreign `followed_actor_id` returns empty (not the follower list). Confirm `readFeedFollowRowsDAL` with own `follower_actor_id` still returns correct results.

---

## DATABASE REVIEW ITEM — 4

- **Object:** `vc.post_reactions` — SELECT policy shape
- **Application Scope:** VCSM
- **Current behavior:** RLS is confirmed enabled. INSERT/UPDATE/DELETE policies enforce `actor_owners` ownership (confirmed in VENOM 2026-05-10 audit). SELECT policy shape is not documented in any migration file. The aggregate read (`fetchReactionSummaryDAL`) already uses an RPC (`post_reactors_summary_one`) — a good pattern.
- **Problem:** SELECT policy shape is unconfirmed. If SELECT is absent, behavior depends on RLS default (deny all, which would break reaction display entirely). If SELECT is `USING (true)` for authenticated (expected), reaction data is public — appropriate for a social feature.
- **Why it matters:** Reactions are public social data. The `readReactionCountsBatch` function reads aggregate counts with no actor filter — this requires a permissive SELECT. The `readViewerReactionsBatch` function reads per-actor reactions for the authenticated viewer — this also requires at minimum authenticated-scoped SELECT. A missing SELECT policy would break both paths silently.
- **Recommended improvement:** Verify the SELECT policy shape via live schema query. If SELECT is `USING (true)` for authenticated — document and close. If SELECT is absent — add it.
- **Rationale:** Reaction counts and individual reactions are intentionally public social data. The correct policy is `USING (true)` scoped to the `authenticated` role — not `anon`. This ensures unauthenticated requests are blocked while authenticated users can read any reaction data.
- **Risk if unchanged:** Uncertain — depends on live schema. Either working correctly (low risk) or silently broken reaction display (medium risk). Live schema inspection required.
- **Example SQL proposal (text only, do not run):**

```sql
-- Verify first:
SELECT policyname, cmd, roles, qual, with_check
FROM pg_policies
WHERE schemaname = 'vc' AND tablename = 'post_reactions'
ORDER BY cmd, policyname;

-- Apply only if SELECT policy is absent:
CREATE POLICY "post_reactions_select_authenticated"
  ON vc.post_reactions
  FOR SELECT
  TO authenticated
  USING (true);

-- Rollback:
-- DROP POLICY IF EXISTS "post_reactions_select_authenticated" ON vc.post_reactions;
```

---

## Schema Design Observation — `vc.actor_onboarding_steps`

**Additional concern beyond RLS:** The table uses `UNIQUE (actor_id, step_key)` as its conflict target for UPSERT. This is correct. However, the `step_key` value `FEED_WELCOME_CARD` is hardcoded in `feedWelcomeCard.dal.js` and exposed in the JavaScript bundle. Any future step keys added to this table will similarly be discoverable from the client bundle.

**Recommendation:** If onboarding step keys are ever used as access gates (e.g., "must complete onboarding before accessing feature X"), they must not be the only enforcement mechanism. RLS + server-side validation should be the enforcement layer. Client-visible step keys are acceptable for UX state but must never be the security boundary.

---

## SF-07 Age Tracking

| Date | Status |
|---|---|
| 2026-05-10 | SF-07 first identified (VENOM audit) |
| 2026-05-14 | CARNAGE P3 proposed; prerequisite (subscriberCount.dal.js audit) flagged |
| 2026-05-18 | `subscriberCount.dal.js` confirmed already on RPC — prerequisite DONE; P3 ready for execution |

**SF-07 has been open 8 days.** Code side is complete. Database execution is the only remaining step.

---

## Deployment Readiness

| Proposal | Code Ready | DB Ready | Staging Required | Apply Order |
|---|---|---|---|---|
| P2 — `actor_onboarding_steps` | YES | SQL in CARNAGE file | YES | 1st |
| P1 — `moderation.actions` | YES | SQL in CARNAGE file | YES | 2nd |
| P3 — `actor_follows` SF-07 | YES — DAL on RPC | SQL in CARNAGE file | YES | 3rd (after P2 + P1 confirmed) |
| P4 — `post_reactions` verify | N/A | Live query only | NO | 4th |

---

## Mandatory Pre-Application Checklist

Before executing any proposal SQL in staging:

- [ ] Run live verification queries for all 4 tables (SELECT from `pg_tables`, `pg_policies`, `pg_proc`)
- [ ] Confirm P3 function does not already exist (`vc.get_follower_count`)
- [ ] Confirm `subscriberCount.dal.js` RPC call returns correct count in current staging environment
- [ ] Apply P2 in staging → test welcome card flow (dismiss + re-open)
- [ ] Apply P1 in staging → test hidden post filtering (hide a post → reload feed → confirm hidden)
- [ ] Apply P3 Step 1 + 2 in staging → confirm subscriber count still works
- [ ] Apply P3 Step 3 in staging → confirm `actor_follows` direct query with foreign actor returns empty
- [ ] All staging tests pass before production application

---

## Handoffs

- **Wolverine** — Execute P2, P1, P3 in staging using SQL proposals from `2026-05-14_carnage_feed-dal-rls-verification.md` and this snapshot
- **VENOM** — Re-verify trust boundaries after P1 + P3 applied
- **SENTRY** — Review `subscriberCount.dal.js` RPC migration for architectural correctness (DAL → RPC pattern)
- **THOR** — Gate production deploy on all staging validations passing
- **CAPTAIN** — If P3 function creation is deferred: flag that `subscriberCount.dal.js` currently calls a function that does not yet exist in the database; any staging environment mismatch will break subscriber count display

---

## DB Command Status

**Status:** ANALYSIS COMPLETE — READ-ONLY  
**No schema modifications made or proposed for execution**  
**All SQL proposals are text-only and must be applied manually by an engineer after live schema verification**
