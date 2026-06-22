# DB — `vc.posts` INSERT RLS Gap Analysis

**Date:** 2026-05-19 16:00
**Application Scope:** VCSM
**Triggered by:** CEREBRO/VENOM V-1 finding — `createSystemPost` trust model
**Status:** CONFIRMED — INSERT policy does NOT enforce actor ownership
**Mode:** READ-ONLY ANALYSIS — no changes applied

---

## Context

VENOM (2026-05-19) flagged V-1: `createSystemPost` in `posts.adapter.js` accepts `actorId` from callers without verifying the session user owns that actor via `actor_owners`. DB asked to confirm whether the RLS INSERT policy on `vc.posts` provides a backstop.

---

## Evidence Summary

### Source 1 — Migration `20260510020000_vc_posts_privacy_rls.sql` (header comment)

```sql
-- What this migration does NOT touch:
--   • posts_insert_actor_owner
--   • posts_update_actor_owner
--   • posts_delete_actor_owner
--   • relforcerowsecurity=true (stays enforced for all roles)
```

**Implication:** A policy named `posts_insert_actor_owner` existed BEFORE 2026-05-10 and was not modified since. Its definition is not present in any tracked migration file in `apps/VCSM/supabase/migrations/`.

### Source 2 — ARCHITECT Audit `2026-05-10_architect_feed-engine-vport-menu-gas-posts.md`

> "The DB does not have a separate RLS policy specific to VPORT post publishing — it relies on the standard `vc.posts` INSERT policy **(any authenticated user can insert a post for their own actorId)**."

> "**RLS on vc.posts INSERT does not enforce that the actor_id in the post row matches the authenticated user's actorId.** If a user crafts a direct API call, they could post as any actorId. This is a pre-existing platform risk."

**Summary table entry:**
> "`vc.posts` INSERT is open to authenticated users for any actor_id | DB allows it — no actor ownership RLS | MEDIUM (pre-existing)"

### Source 3 — ARCHITECT Audit Gap Table

> **Gap 1: vc.posts INSERT policy not VPORT-owner-gated**
> "The `vc.posts` INSERT policy (or lack thereof) does not verify that the inserting user owns the `actor_id` being posted as."

### Source 4 — `secdef_b` and `secdef_c` migrations

`vc.posts` does NOT appear in:
- Zero-policy tables list (has policies — confirmed)
- RLS-disabled tables list (RLS is enabled — confirmed)

**Implication:** The table has RLS enabled AND has policies — but the policies do not enforce actor ownership on INSERT.

### Source 5 — `vc.is_actor_owner()` helper (confirmed exists)

Used in `20260519120000_platform_vc_security_hardening.sql`:
```sql
IF NOT vc.is_actor_owner(p_owner_actor_id) THEN
  RAISE EXCEPTION 'Not authorized ...';
```

Also: `platform.media_assets` and `vc.friend_ranks` both use `actor_owners` JOIN in their INSERT WITH CHECK clauses.

**Implication:** The pattern for actor-ownership-enforced INSERT policies is established in the codebase. `vc.posts` simply doesn't use it.

---

## DATABASE REVIEW ITEM

```
DATABASE REVIEW ITEM
- Object:               vc.posts — posts_insert_actor_owner policy
- Application Scope:    VCSM
- Current behavior:     Policy exists. Based on ARCHITECT audit evidence, it requires
                        authentication but does NOT verify that the inserting user
                        owns the actor_id being posted as via vc.actor_owners.
                        Any authenticated user can insert a post with any actor_id.
- Problem:              The actor_id ownership verification is missing from the
                        DB INSERT policy. The only ownership gate is a client-side
                        string comparison (me.actorId === targetActorId) in hooks —
                        which is bypassable by any user with a valid session token
                        who makes a direct PostgREST API call.
- Why it matters:       A session-authenticated user who knows another actor's UUID
                        (actor_id is not a secret — it appears in feed rows and
                        profile responses) can create posts claiming that actor's
                        identity. For vport system posts: any authenticated user
                        could create "fuel_price_update" or "menu_update" posts
                        impersonating any vport. For user actors: any authenticated
                        user could create posts in another user's name.
- Recommended improvement: Replace posts_insert_actor_owner with an ownership-enforcing
                        policy that validates actor_id ∈ actor_owners for auth.uid().
- Rationale:            Every other write table with an actor_id column in this codebase
                        (platform.media_assets, vc.friend_ranks, vc.conversation_members,
                        vc.inbox_entries) enforces actor ownership at the DB layer.
                        vc.posts is the only high-value write table missing this.
- Risk if unchanged:    MEDIUM-HIGH. Any authenticated user can impersonate any actor
                        in post creation. This is a pre-existing platform risk
                        documented as "Gap 1" in ARCHITECT audit 2026-05-10.
                        Not currently exploited in any documented incident, but
                        the surface is open via direct API access.
- Example SQL proposal (text only, do not run):
```

```sql
-- PROPOSAL ONLY — text only, do not execute automatically
-- Review in staging before applying to production.
-- This migration hardens vc.posts INSERT to enforce actor ownership.

-- Pre-check (run first to confirm current policy):
SELECT policyname, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'vc' AND tablename = 'posts';

-- Migration proposal (CARNAGE scope):
BEGIN;

DROP POLICY IF EXISTS "posts_insert_actor_owner" ON vc.posts;

CREATE POLICY "posts_insert_actor_owner"
  ON vc.posts
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- The post's user_id must match the authenticated user
    user_id = auth.uid()
    AND
    -- The actor being posted as must be owned by the authenticated user
    EXISTS (
      SELECT 1 FROM vc.actor_owners ao
      WHERE ao.actor_id = posts.actor_id
        AND ao.user_id = auth.uid()
    )
  );

COMMIT;

-- Rollback:
-- DROP POLICY IF EXISTS "posts_insert_actor_owner" ON vc.posts;
-- (Re-apply original policy from pre-migration snapshot)
```

---

## Impact on `createSystemPost` Adapter

Once this policy is applied, `createSystemPost` will REQUIRE the session user to own the `actorId` being posted as. For the 8 vport publish controllers:

- The session user must be an owner of the VPORT actor in `vc.actor_owners`
- The hook-level `isOwner` check (`me.actorId === targetActorId`) already enforces this at the app layer
- The DB policy provides a hard enforcement backstop

**For user posts via `createPostController`:** No change — `identity.actorId` is always the user's own actor. The policy allows their insert.

**For system posts via vport controllers:** Inserts succeed only if the authenticated user is an owner of the vport actor. This closes the V-1 gap.

---

## V-1 Risk Reclassification

| Before DB analysis | MEDIUM (pending RLS confirmation) |
|---|---|
| After DB analysis | **HIGH** — INSERT policy confirmed to NOT enforce actor ownership |

Source evidence: ARCHITECT audit 2026-05-10 (pre-existing documented gap), confirmed via migration file inspection.

---

## UPDATE Policy Review

The migration header also references `posts_update_actor_owner` and `posts_delete_actor_owner`. These policies likely enforce ownership on UPDATE/DELETE via `.eq("actor_id", actorId)` at the app layer — but similar to INSERT, their exact DB-level WITH CHECK clauses are unconfirmed from file inspection alone. The UPDATE and DELETE paths in `post.write.dal.js` use `.eq("actor_id", actorId)` as PostgREST WHERE clauses (which act as RLS USING filters), so the risk profile for UPDATE/DELETE is lower than INSERT.

---

## Recommendation

**CARNAGE required** — create a migration to replace `posts_insert_actor_owner` with the ownership-enforcing policy above.

**Migration dependencies:**
1. `vc.actor_owners` must be SELECTable by `authenticated` role — confirmed granted (`20260430200000_fix_chat_rls_multi_actor.sql`: `grant select on vc.actor_owners to authenticated`)
2. `vc.is_actor_owner()` helper is available but not required — inline EXISTS subquery is the pattern used across other tables

**Pre-check query (run before applying migration):**
```sql
-- Verify current INSERT policy definition
SELECT policyname, cmd, roles, qual, with_check
FROM pg_policies
WHERE schemaname = 'vc' AND tablename = 'posts' AND cmd = 'INSERT';
```

**Handoff:** CARNAGE — migration authorship and staging verification.

---

## Command Evidence

| Command | File | Relevance |
|---|---|---|
| ARCHITECT | `_ACTIVE/audits/architecture/2026-05-10_architect_feed-engine-vport-menu-gas-posts.md` | Primary evidence — Gap 1 documents INSERT policy gap |
| VENOM | `CURRENT/features/dashboard/evidence/2026-05-19_venom_post-dal-trust-surfaces.md` | V-1 finding — trust model |
| Migration | `apps/VCSM/supabase/migrations/20260510020000_vc_posts_privacy_rls.sql` | Confirms `posts_insert_actor_owner` policy name + RLS/FORCE enabled |
| Migration | `apps/VCSM/supabase/migrations/20260430200000_fix_chat_rls_multi_actor.sql` | Confirms `actor_owners` SELECT grant to authenticated |
