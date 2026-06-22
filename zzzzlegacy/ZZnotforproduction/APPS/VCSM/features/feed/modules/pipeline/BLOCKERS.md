---
title: Pipeline Module — Blockers
status: ACTIVE
feature: feed
module: pipeline
last-updated: 2026-06-05
---

# feed / modules / pipeline — BLOCKERS

THOR Gate: BLOCKED
Active Blocker Count: 5

---

## BLOCKER-1 — Block Action Reveals Blocked Content (P0)

**Finding:** BW-PIPE-001 / VEN-PIPE-006
**Severity:** HIGH
**Patch:** ELEK-PIPE-001

**Why it blocks:**
After a user blocks another actor via the post menu, the immediate feed refresh re-shows the
blocked actor's content because `invalidateFeedBlockCache` is not called before `fetchPosts(true)`.
The 60s TTL block cache is stale — the pipeline reads the old block list and passes the blocked
actor's posts through visibility checks.

**Impact:** Block safety feature silently reverses after every block action.

**How to unblock:**
1. In `apps/VCSM/src/features/feed/hooks/useCentralFeedActions.js` line 178–179:
   Add `invalidateFeedBlockCache(actorId)` between `blockActor()` and `fetchPosts(true)`
2. Add import: `import { invalidateFeedBlockCache } from '@/features/feed/adapters/feedCache.adapter'`
3. Implement and pass TEST-PIPE-BLOCK-001 and TEST-PIPE-BLOCK-002

---

## BLOCKER-2 — null realmId Bypasses Realm Isolation (P0)

**Finding:** BW-PIPE-003 / VEN-PIPE-002
**Severity:** HIGH
**Patch:** ELEK-PIPE-002

**Why it blocks:**
When realmId is null (partial onboarding or unresolved session), the DAL query fires without a
`WHERE realm_id =` clause, returning posts from ALL realms. With the Void Realm (18+ content)
planned, this is a pre-breach — unverified users would see 18+ content.

**Impact:** Complete realm isolation failure. Future Void Realm content exposed to unverified users.

**How to unblock:**
1. In `apps/VCSM/src/features/feed/dal/feed.read.posts.dal.js` before query construction:
   Add early return `if (!realmId) return { pageRows: [], hasMore: false, nextCursorCreatedAt: null }`
2. Remove conditional filter and make realm filter unconditional
3. Implement and pass TEST-PIPE-REALM-001, -002, -003

---

## BLOCKER-3 — Blocked Actor Identity Leaks via Mention Hydration (P1)

**Finding:** BW-PIPE-002 / VEN-PIPE-008
**Severity:** HIGH
**Patch:** ELEK-PIPE-003

**Why it blocks:**
When a non-blocked user C mentions a blocked user B in a post visible to user A (who blocked B),
user A's feed still includes B's display_name and avatar in the mention map. The block filter
is applied to post AUTHORS but not to MENTIONED actors.

**Impact:** Block relationship not respected for mention presentation. User sees blocked actor's
identity in post mentions.

**How to unblock:**
1. In `apps/VCSM/src/features/feed/pipeline/fetchFeedPage.pipeline.js` line 128:
   After building `mentionedActorIds`, add:
   `const safeMentionActorIds = mentionedActorIds.filter(id => !blockedActorSet.has(id))`
   Use `safeMentionActorIds` for hydrateAndReturnSummaries call
2. Implement and pass TEST-PIPE-MENTION-001, -002

---

## BLOCKER-4 — VPORT Posts Invisible to All Non-Owners (P0 — DB)

**Finding:** BW-PIPE-004 / VEN-PIPE-003
**Severity:** HIGH
**Patch:** DEFERRED-D001

**Why it blocks:**
The `vport.profiles` table has owner-only RLS. Non-owners receive an empty result, causing ALL
VPORT posts to fail visibility checks (`missing_vport_profile` → visible:false) in the central
feed for ALL non-owner viewers. VPORT content publishing is functionally broken.

**Impact:** VPORT operators cannot reach their audience via the central feed. This affects
all VPORT content visibility for all non-owner users.

**How to unblock:**
This requires a DB policy change — cannot be fixed in application code.

Option A (preferred):
  Add SELECT policy on `vport.profiles` allowing authenticated reads of feed-safe columns:
  ```sql
  CREATE POLICY "vport_profiles_feed_read" ON vport.profiles
    FOR SELECT TO authenticated
    USING (is_public = true);  -- or unconditionally if no per-profile privacy setting
  ```

Option B (app workaround if DB change is gated):
  Create SECURITY DEFINER RPC `get_vport_profiles_for_feed(actor_ids uuid[])` returning
  feed-safe columns only, callable by authenticated users.

**Required team:** DB / Carnage for migration authoring.

---

## BLOCKER-5 — Zero Tests Implemented (P0)

**Finding:** SPIDER-MAN — no test files exist for any feed pipeline source files
**Severity:** HIGH (governance)
**Patch:** Implement tests from TESTS.md

**Why it blocks:**
THOR requires P0 regression tests to pass before clearing a module with HIGH security findings.
No test infrastructure exists for the feed pipeline. The patches for BLOCKER-1, -2, -3 require
test coverage before THOR can confirm they are correctly applied.

**How to unblock:**
1. Confirm test runner (Vitest) configured for apps/VCSM/
2. Implement TEST-PIPE-REALM-001, -002, -003 (realm guard)
3. Implement TEST-PIPE-BLOCK-001, -002 (block cache invalidation)
4. All 5 P0 tests must pass

---

## Blocker Summary

| Blocker | Finding | Owner | Blocked On |
|---|---|---|---|
| BLOCKER-1 | BW-PIPE-001 | App team — 2-line fix | ELEK-PIPE-001 review + test |
| BLOCKER-2 | VEN-PIPE-002 | App team — 3-line fix | ELEK-PIPE-002 review + test |
| BLOCKER-3 | BW-PIPE-002 | App team — 1-line fix | ELEK-PIPE-003 review + test |
| BLOCKER-4 | VEN-PIPE-003 | DB team — RLS policy | DEFERRED-D001 DB ticket |
| BLOCKER-5 | SPIDER-MAN | App team | Test infra + implementation |
