---
report: carnage_feed-dal-rls-verification
date: 2026-05-14
time: continuation of CEREBRO verification pass
scope: VCSM — feed DAL trust boundary surfaces
authority: GOVERNANCE_WRITABLE
triggered_by: VENOM feed DAL review — V1, V2, V3, V4 surfaces
---

# CARNAGE MIGRATION REPORT — Feed DAL RLS Verification

**Application Scope:** VCSM  
**Migration reason:** VENOM feed DAL review (2026-05-14) identified four tables where RLS enforcement could not be verified from source code alone. This report inspects available migration history, schema snapshots, and prior VENOM audits to classify actual RLS status and propose corrective migration SQL where gaps are found.  
**Migration type:** RLS policy verification + gap remediation proposals  
**Migration Safety Status:** HIGH RISK (two tables have unknown or confirmed-absent RLS; one has a known exploitable SELECT policy)  
**Confidence:** MEDIUM — migration files and prior audit reports used as evidence; live schema cannot be directly queried in this pass. One table has no evidence at all.

---

## SCHEMA TRUST CLASSIFICATION

| Object | Classification | Reason |
|---|---|---|
| `moderation.actions` | Moderation-sensitive + Ownership-sensitive | Records per-actor hide/unhide/moderation actions — leaking another user's moderation history is a privacy violation |
| `vc.post_reactions` | Public (read) + Ownership-sensitive (write) | Reaction counts are public; per-actor reaction data reveals behavior patterns |
| `vc.actor_follows` | Identity-sensitive + Privacy-sensitive | Follow graph reveals social connections; overly broad SELECT policy is a known leak (SF-07) |
| `vc.actor_onboarding_steps` | Ownership-sensitive | Records actor-specific onboarding completion state; write path with no verified RLS is a data integrity risk |

---

## CURRENT STRUCTURE

### Table 1 — `moderation.actions`

| Property | Value |
|---|---|
| Schema | `moderation` |
| Purpose | Records per-actor moderation actions (hide/unhide posts, reports) |
| Key columns | `actor_id` (who acted), `target_type`, `target_id`, `action_type`, `actor_domain`, `target_domain`, `created_at` |
| RLS enabled | **UNKNOWN — no migration evidence found** |
| FORCE RLS | **UNKNOWN** |
| SELECT policy | **NOT FOUND** in any migration file or prior audit |
| INSERT policy | **NOT FOUND** in any migration file |
| Migration history | Schema migrated from `vc.moderation_actions` → `moderation.actions` on 2026-05-04 (native moderation schema fix). RLS status after migration: not documented. |
| Feed DAL consumer | `readHiddenPostsForViewer` — SELECT `.eq("actor_id", viewerActorId)` |

**Evidence base:** Native transfer module `moderation.md` documents the schema migration but does not record RLS policy state. No SQL file defining policies on `moderation.actions` found in repo. Table may have inherited RLS state from the old `vc.moderation_actions` table if a CREATE TABLE AS / INSERT SELECT pattern was used — or it may have no policies at all.

**Risk if RLS absent:** Any authenticated user can query `moderation.actions` with any `actor_id` and read another actor's hidden post list — revealing which posts they chose to suppress from their feed.

---

### Table 2 — `vc.post_reactions`

| Property | Value |
|---|---|
| Schema | `vc` |
| Purpose | Records per-actor reaction state (like/dislike) on posts |
| Key columns | `actor_id`, `post_id`, `reaction` |
| RLS enabled | **YES** (confirmed by prior VENOM audit 2026-05-10_venom_post-reaction-vport-visibility.md) |
| FORCE RLS | **NOT CONFIRMED** — applies to service_role bypass concern |
| SELECT policy | **UNKNOWN** — prior VENOM audit only confirmed INSERT/UPDATE/DELETE enforcement |
| INSERT policy | CONFIRMED: `post_reactions_insert` — `EXISTS (SELECT 1 FROM vc.actor_owners ao WHERE ao.actor_id = post_reactions.actor_id AND ao.user_id = auth.uid())` |
| UPDATE/DELETE policy | CONFIRMED: enforces actor_owners ownership |
| Feed DAL consumer | `readViewerReactionsBatch` — SELECT `.eq("actor_id", actorId)` |
| Aggregate consumer | `readReactionCountsBatch` — SELECT no actor filter (reads all reactions for post IDs) |

**Evidence base:** VENOM audit `2026-05-10_venom_post-reaction-vport-visibility.md` line 57-60 and line 359.

**Risk analysis:**
- **Write path:** PROTECTED. RLS enforces actor ownership on INSERT/UPDATE/DELETE.
- **Viewer reactions read** (`readViewerReactionsBatch`): If SELECT policy is `USING (true)` or any broad pattern, passing a forged `actorId` would return that actor's reactions. Risk: LOW (reaction data is non-critical).
- **Aggregate counts read** (`readReactionCountsBatch`): No `actor_id` filter — reads all reactions for page post IDs. If SELECT is `USING (true)`, correct and expected (counts are public). If SELECT requires viewer ownership, this would break aggregate counts.

**Most likely policy shape:** SELECT is `USING (true)` for authenticated (reactions are public social data). This is the expected pattern and low risk. Confirmation required.

---

### Table 3 — `vc.actor_follows`

| Property | Value |
|---|---|
| Schema | `vc` |
| Purpose | Follow relationships between actors |
| Key columns | `follower_actor_id`, `followed_actor_id`, `is_active` |
| RLS enabled | **YES** (confirmed — 2026-05-10_venom_friend-subscribe-private-profile-review.md) |
| FORCE RLS | **NO** — service_role can bypass without enforcement |
| SELECT policies | **TWO policies (confirmed):** |
| — Policy 1 | `actor_follows.select.self` — follower OR followed is owned by `auth.uid()` via `actor_owners` |
| — Policy 2 | `actor_follows_select_public_subscriber_count` — `USING (is_active = true)` — **NO actor restriction** |
| INSERT policies | `actor_follows.insert.self` + `actor_follows_insert_by_target_on_accept` |
| UPDATE policies | Correct ownership enforcement |
| Feed DAL consumer | `readFeedFollowRowsDAL` — SELECT `.eq("follower_actor_id", viewerActorId).eq("is_active", true)` |

**Confirmed vulnerability — SF-07 (prior VENOM audit, unresolved):**

The `actor_follows_select_public_subscriber_count` policy `USING (is_active = true)` is a PERMISSIVE policy. Since Supabase uses OR logic for permissive policies, any row matching EITHER policy is returned. This means:
- An authenticated user passing a forged `viewerActorId` to `readFeedFollowRowsDAL` would receive rows matching the public policy (all active follows for that actor)
- The intended scoped policy (`actor_follows.select.self`) is effectively bypassed by the broad public policy
- This is a **known, documented vulnerability** from the 2026-05-10 audit (SF-07) — not a new finding

**CARNAGE classification:** This is an existing open finding from a prior VENOM audit. The corrective migration was proposed in that audit but has not been applied to the migration history files in this repo.

---

### Table 4 — `vc.actor_onboarding_steps`

| Property | Value |
|---|---|
| Schema | `vc` |
| Purpose | Per-actor onboarding step completion state |
| Key columns | `actor_id`, `step_key`, `status`, `progress`, `completed_at`, `last_evaluated_at`, `updated_at`, `meta` |
| Constraint | `UNIQUE (actor_id, step_key)` (implied by UPSERT `onConflict: 'actor_id,step_key'`) |
| RLS enabled | **UNKNOWN — zero evidence found** |
| SELECT policy | **NOT FOUND** |
| INSERT/UPSERT policy | **NOT FOUND** |
| Feed DAL consumer | `readWelcomeFeedCardStateDAL` (SELECT) + `markWelcomeFeedCardSeenDAL` (UPSERT) |

**Evidence base:** Zero references in any migration file, prior VENOM audit, or schema snapshot. Table appears to predate the current audit regime or was created without a corresponding RLS migration.

**Risk if RLS absent (CRITICAL for write path):**
- `markWelcomeFeedCardSeenDAL` issues an UPSERT with `actor_id` supplied by the client (from `useIdentity()`). If there is no WITH CHECK policy, any authenticated user who supplies a different `actorId` (by manipulating the client) could mark another actor's onboarding step as completed, potentially:
  - Hiding the welcome feed card for another user
  - Corrupting onboarding state for actors they do not own

---

## MIGRATION BLAST RADIUS

**Affected systems:** Feed feature (welcome card) + moderation (hidden posts) + social graph (follow reads)  
**Runtime impact:** RLS additions do not break reads for correct callers. Restrictive policies may block malformed requests.  
**Release impact:** Adding correct RLS is a safety improvement, not a breaking change for any properly implemented caller.  
**Rollback impact:** All proposed policies are droppable individually.

---

## RLS IMPACT REVIEW

| Object | RLS Dependency | Risk | Follow-up Required |
|---|---|---|---|
| `moderation.actions` | UNKNOWN — possibly NONE | CRITICAL if absent — hidden post state leakable | Live schema inspection required |
| `vc.post_reactions` | DIRECT — write enforced | LOW for read (public data) | Confirm SELECT policy shape |
| `vc.actor_follows` | DIRECT — SF-07 confirmed | HIGH — overly broad SELECT policy allows follow graph enumeration | Migration required (SF-07 resolution) |
| `vc.actor_onboarding_steps` | UNKNOWN — possibly NONE | HIGH — UPSERT write with client-supplied actor_id, no verified protection | Live schema inspection + policy addition required |

---

## RUNTIME IMPACT ANALYSIS

| Runtime Area | Risk | Expected Impact | Mitigation |
|---|---|---|---|
| Feed hidden posts | HIGH — if `moderation.actions` has no RLS | Another actor's hide list readable | Add RLS scoped to actor_owners |
| Feed follow graph | HIGH — SF-07 open | Broad SELECT lets any user read any actor's follows | Drop broad policy, add follower-count function |
| Welcome card state | HIGH — UPSERT without RLS | Other actor's onboarding state can be overwritten | Add WITH CHECK to actor_owners |
| Feed reaction reads | LOW — public pattern expected | No impact for correct callers | Confirm, document |
| `readFeedFollowRowsDAL` with correct actorId | LOW | Correct behavior; cache mitigates reload cost | None required |

---

## MIGRATION DEPENDENCY GRAPH

| Dependency Type | Affected Area | Risk |
|---|---|---|
| DAL dependency | `readHiddenPostsForViewer` ← `moderation.actions` RLS | SELECT policy must allow actor-scoped reads |
| DAL dependency | `readViewerReactionsBatch` ← `vc.post_reactions` RLS | SELECT must allow per-post reads across actors |
| DAL dependency | `readFeedFollowRowsDAL` ← `vc.actor_follows` SF-07 | Broad SELECT policy must be replaced |
| DAL dependency | `markWelcomeFeedCardSeenDAL` ← `vc.actor_onboarding_steps` | UPSERT must have WITH CHECK |
| Cache dependency | `readFeedFollowRowsDAL` 60s TTL | RLS fix does not affect cache; correct actorId still produces correct results |
| RLS dependency | `vc.current_actor_id()` or `vc.actor_owners` | All proposed policies depend on the actor ownership resolution function pattern |
| Engine dependency | `actor_owners` join pattern | All actor-scoped RLS policies rely on `actor_owners` integrity (already FORCE RLS) |

---

## DATA INTEGRITY REVIEW

| Integrity Area | Risk | Detection Method | Mitigation |
|---|---|---|---|
| Cross-actor welcome card corruption | HIGH — if no WITH CHECK on `actor_onboarding_steps` | Live schema audit + controlled test with non-owner actorId | Add actor_owners WITH CHECK |
| Follow graph enumeration | HIGH — SF-07 confirmed open | Query `actor_follows` with non-owner follower_actor_id | Drop broad SELECT policy |
| Hidden post state leak | HIGH — if no RLS on `moderation.actions` | Query `moderation.actions` with non-owner actor_id | Add actor_owners SELECT policy |
| Reaction read cross-actor | LOW — public data by design | Acceptable for reaction counts; viewer-specific should be self-scoped | Confirm SELECT policy; acceptable if broad |

---

## MIGRATION EXECUTION STRATEGY

| Phase | Strategy | Risk | Notes |
|---|---|---|---|
| 1 | Live schema inspection — confirm RLS state for all 4 tables | NONE | Run in staging/Supabase dashboard. No changes. |
| 2 | `moderation.actions` — add SELECT policy if absent | CAUTION | Must not block existing read path for correct callers |
| 3 | `vc.actor_onboarding_steps` — add RLS + WITH CHECK if absent | CAUTION | Existing callers use correct actorId from session — no breakage expected |
| 4 | `vc.actor_follows` — resolve SF-07 (drop broad SELECT, add count function) | HIGH RISK | May affect any code counting followers; test carefully |
| 5 | `vc.post_reactions` — document existing SELECT policy, no change if USING(true) | NONE | Confirmation only |

---

## ROLLBACK SURVIVABILITY

**Rollback status:** FULL (all proposed changes are DROP POLICY / DROP FUNCTION — reversible)  
**Data recovery risk:** NONE — all changes are policy additions, not data mutations  
**Compatibility rollback risk:** LOW — rollback restores previous (less secure) state; callers continue to work  
**Operational complexity:** LOW — each policy is independently droppable

---

## PROPOSED SQL (TEXT ONLY — DO NOT EXECUTE)

### P1 — `moderation.actions` SELECT Policy (if absent)

```sql
-- Verify first: SELECT policyname FROM pg_policies WHERE schemaname='moderation' AND tablename='actions';

ALTER TABLE moderation.actions ENABLE ROW LEVEL SECURITY;

-- Allow actors to read only their own moderation actions
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

-- Allow actors to insert their own moderation actions
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

-- Rollback: DROP POLICY IF EXISTS "actions_select_own_actor" ON moderation.actions;
--           DROP POLICY IF EXISTS "actions_insert_own_actor" ON moderation.actions;
```

### P2 — `vc.actor_onboarding_steps` RLS (if absent)

```sql
-- Verify first: SELECT policyname FROM pg_policies WHERE schemaname='vc' AND tablename='actor_onboarding_steps';

ALTER TABLE vc.actor_onboarding_steps ENABLE ROW LEVEL SECURITY;

-- Self-read: actor can read their own steps
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

-- Self-write (covers INSERT + UPDATE via UPSERT): enforces WITH CHECK ownership
DROP POLICY IF EXISTS "actor_onboarding_steps_upsert_own" ON vc.actor_onboarding_steps;
CREATE POLICY "actor_onboarding_steps_upsert_own"
  ON vc.actor_onboarding_steps
  FOR ALL  -- covers INSERT + UPDATE (UPSERT fires both)
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

-- Rollback: ALTER TABLE vc.actor_onboarding_steps DISABLE ROW LEVEL SECURITY;
--           DROP POLICY IF EXISTS "actor_onboarding_steps_select_own" ON vc.actor_onboarding_steps;
--           DROP POLICY IF EXISTS "actor_onboarding_steps_upsert_own" ON vc.actor_onboarding_steps;
```

### P3 — `vc.actor_follows` SF-07 Resolution (drop overly broad SELECT)

```sql
-- Drop the overly broad public subscriber count policy
DROP POLICY IF EXISTS actor_follows_select_public_subscriber_count ON vc.actor_follows;

-- Add a SECURITY DEFINER function for follower count that bypasses RLS safely
-- This replaces the broad SELECT with an RPC call that returns only the count
CREATE OR REPLACE FUNCTION vc.get_follower_count(p_actor_id uuid)
RETURNS bigint
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'vc', 'public'
AS $$
  SELECT count(*)
  FROM vc.actor_follows
  WHERE followed_actor_id = p_actor_id
    AND is_active = true;
$$;

GRANT EXECUTE ON FUNCTION vc.get_follower_count(uuid) TO authenticated;

-- Apply FORCE RLS to actor_follows so service_role cannot bypass
ALTER TABLE vc.actor_follows FORCE ROW LEVEL SECURITY;

-- Rollback:
--   RECREATE: CREATE POLICY actor_follows_select_public_subscriber_count ON vc.actor_follows FOR SELECT TO authenticated USING (is_active = true);
--   DROP FUNCTION: DROP FUNCTION IF EXISTS vc.get_follower_count(uuid);
--   UNFORCE: ALTER TABLE vc.actor_follows NO FORCE ROW LEVEL SECURITY;
```

**Note on P3:** The subscriber count function requires any client-side code currently using `actor_follows_select_public_subscriber_count` to migrate to an RPC call (`supabase.rpc('get_follower_count', { p_actor_id: actorId })`). This must be traced before the policy is dropped. `subscriberCount.dal.js` is the primary candidate.

### P4 — `vc.post_reactions` SELECT Confirmation (no change proposed)

If current SELECT policy is `USING (true)` for authenticated (the expected public-data pattern), no change is needed. Aggregate counts (`readReactionCountsBatch`) and viewer reaction reads (`readViewerReactionsBatch`) both rely on this public read access.

```sql
-- Verify only — do not change if USING (true) is confirmed:
SELECT policyname, cmd, qual FROM pg_policies
WHERE schemaname = 'vc' AND tablename = 'post_reactions';
```

---

## VALIDATION CHECKLIST

| Validation Area | Status | Notes |
|---|---|---|
| `moderation.actions` RLS enabled | UNKNOWN | Must confirm via live schema |
| `moderation.actions` SELECT policy present | UNKNOWN | P1 SQL proposal ready |
| `vc.actor_onboarding_steps` RLS enabled | UNKNOWN | Must confirm via live schema |
| `vc.actor_onboarding_steps` WITH CHECK present | UNKNOWN | P2 SQL proposal ready |
| `vc.actor_follows` SF-07 resolved | OPEN — unresolved since 2026-05-10 | P3 requires subscriberCount.dal.js audit first |
| `vc.post_reactions` SELECT policy shape | UNKNOWN — write enforced, read unconfirmed | P4 verify query only |
| `readFeedFollowRowsDAL` correct actorId source | VERIFIED — sourced from `useIdentity()` session | No change needed; RLS is the backstop |
| Rollback plans present | YES | Per-policy DROP statements documented |
| Staging test required | YES | All P1-P3 proposals must be tested in staging first |

---

## IDENTITY / OWNERSHIP MIGRATION WARNING

**Object:** `vc.actor_onboarding_steps`  
**Current behavior:** UPSERT with `actor_id` from client session. If RLS absent, any actor_id can be supplied.  
**Migration risk:** Adding WITH CHECK will block any caller that passes an `actor_id` not owned by the current user. Since all callers go through `useIdentity()` which sources from the authenticated session, this should not break any legitimate caller.  
**Potential impact:** Zero impact on legitimate callers. Blocks malformed requests (security improvement).  
**Recommended safeguards:** Test in staging with the welcome card flow (dismiss → re-open → confirm state persists). Verify `markWelcomeFeedCardSeenDAL` still works after policy is applied.

---

## BOUNDARY MIGRATION REVIEW

| Schema Object | Scope Owner | Cross-Root Risk | Status |
|---|---|---|---|
| `moderation.actions` | VCSM — `moderation` schema | NO — moderation schema is VCSM-only | SAFE scope |
| `vc.post_reactions` | VCSM — `vc` schema | NO — vc schema is VCSM-only | SAFE scope |
| `vc.actor_follows` | VCSM — `vc` schema | NO | SAFE scope |
| `vc.actor_onboarding_steps` | VCSM — `vc` schema | NO | SAFE scope |

No cross-root migration concerns. All four tables are within the VCSM application boundary.

---

## RECOMMENDED HANDOFFS

- **DB** — Run the four verification queries against the live Supabase schema to confirm RLS state before applying any proposal
- **VENOM** — Verify P3 (actor_follows SF-07) after migration and confirm subscriberCount.dal.js call site is updated
- **THOR** — P2 (`actor_onboarding_steps`) and P1 (`moderation.actions`) should be release-gated; apply before next production deploy
- **LOGAN** — Update `vcsm.dal.feed.md` command evidence registry after migration is applied
- **SENTRY** — Review `subscriberCount.dal.js` for direct policy dependency before dropping SF-07 policy

---

## FINAL CARNAGE STATUS

**`moderation.actions`:** HIGH RISK — unknown RLS state; SELECT policy proposal ready (P1)  
**`vc.actor_onboarding_steps`:** HIGH RISK — unknown RLS state; UPSERT write path proposal ready (P2)  
**`vc.actor_follows`:** HIGH RISK — SF-07 confirmed open since 2026-05-10; P3 proposal requires subscriberCount.dal.js audit first  
**`vc.post_reactions`:** CAUTION — write enforced; read unconfirmed but likely SAFE (public data pattern)

**OVERALL: HIGH RISK**

Two tables have no verifiable RLS. One has a known exploitable SELECT policy open since 2026-05-10. P1 and P2 proposals are ready for staging application. P3 requires one additional audit (`subscriberCount.dal.js` caller check) before execution. P4 is verification-only.

**Live schema inspection is the mandatory first step before any SQL is applied.**
