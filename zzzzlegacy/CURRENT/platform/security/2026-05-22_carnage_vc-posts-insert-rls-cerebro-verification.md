# CARNAGE VERIFICATION — `vc.posts` INSERT RLS Ownership Hardening

**Date:** 2026-05-22
**Application Scope:** VCSM
**Verification Type:** CEREBRO-directed secondary review of existing Carnage proposal
**Verified Proposal:** `2026-05-22_10-00_carnage_vc-posts-insert-ownership-rls.md`
**Triggered by:** CEREBRO audit on `vcsm.profiles.architecture.md` — DB command confirmed DR-001 (vc.posts INSERT RLS gap) as release-blocking
**Evidence chain addition:** This session's DB audit (`2026-05-22_db_profiles-rls-coverage-audit.md`) independently re-confirms the gap via profiles module coverage scan

---

## VERIFICATION PURPOSE

The original Carnage proposal was produced against the post feature's DAL audit (`vcsm.dal.post.md`). This CEREBRO session re-surfaced the same gap from a different angle — the profiles module's 8 VPORT write controllers all depend on `createSystemPost` which eventually routes through the weakened `vc.posts` INSERT policy.

This verification confirms:
1. The original proposal is technically complete and correct
2. No new contradicting evidence was found in this session
3. The proposal may proceed to staging verification per its execution strategy
4. One addendum is required (see below)

---

## PROPOSAL REVIEW

### Technical Correctness

| Claim | Verified | Evidence |
|---|---|---|
| `posts_insert_actor_owner` does NOT enforce actor ownership in current form | CONFIRMED | Original VENOM V-1 + DB gap audit |
| `vc.actor_owners` SELECT grant to `authenticated` exists | CONFIRMED | `20260430200000_fix_chat_rls_multi_actor.sql` |
| EXISTS subquery pattern is established in this codebase | CONFIRMED | `platform.media_assets` and `vc.friend_ranks` INSERT policies use identical form |
| Migration is atomic (BEGIN/COMMIT, single policy replace) | CONFIRMED | Standard PostgreSQL RLS policy swap — instantaneous, no table lock |
| Rollback is FULL | CONFIRMED | DROP + re-CREATE restores previous policy; no data affected |
| Service role bypasses RLS | CONFIRMED | Expected PostgreSQL behavior — Edge Functions using service role are unaffected |
| `createPostController` user path is unaffected | CONFIRMED | `identity.actorId` always belongs to the session user |
| 8 vport publish controllers are the blast radius | CONFIRMED | This session's IRONMAN + profiles CEREBRO audit independently mapped the same 8 flows |

### SQL Proposal Review

```sql
BEGIN;

DROP POLICY IF EXISTS "posts_insert_actor_owner" ON vc.posts;

CREATE POLICY "posts_insert_actor_owner"
  ON vc.posts
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND
    EXISTS (
      SELECT 1
      FROM vc.actor_owners ao
      WHERE ao.actor_id = posts.actor_id
        AND ao.user_id  = auth.uid()
    )
  );

COMMIT;
```

**Assessment:** CORRECT. The SQL is idiomatic, follows the established pattern, and closes the gap precisely. No modifications required.

---

## ADDENDUM — PROFILES CEREBRO SESSION FINDINGS

This CEREBRO session adds one relevant observation not present in the original proposal:

### Addendum A-01 — upsertVportServices relies solely on this RLS policy

**Finding:** `upsertVportServices.controller.js` contains the comment `// Ownership enforced by RLS` and has NO application-layer ownership check. This means `upsertVportServices` inserts into VPORT tables but the only write-time actor ownership enforcement is:
1. The current (weak) `posts_insert_actor_owner` policy for any system post side effects
2. The `vport.services` table's own RLS (coverage unverified this session — marked UNKNOWN in DB audit)

**Impact on this migration:** The proposed migration closes the `vc.posts` INSERT gap. However, `upsertVportServices` writes to `vport.services`, not `vc.posts`. The missing controller-layer ownership check on `upsertVportServices` (VENOM VF-002) is a SEPARATE blocking risk that this migration does not address. Both must be resolved before release.

**Action:** This session has separately flagged VF-002 / R-BLOCK-01 for Wolverine implementation. The Carnage migration for `vc.posts` is independent of that fix.

### Addendum A-02 — UPDATE and DELETE policies share the same gap

The original proposal noted (and explicitly deferred) that `vc.posts UPDATE` and `vc.posts DELETE` policies likely have the same auth-only gap. This CEREBRO session's DB audit confirmed this as unverified and non-blocking for this release scope. **A separate Carnage pass should be scheduled post-release to address UPDATE/DELETE gaps.**

---

## STAGING VERIFICATION CHECKLIST (from original proposal — unchanged)

| Check | Method | Status |
|---|---|---|
| Run pre-check SQL on staging | `SELECT policyname, cmd, roles, qual, with_check FROM pg_policies WHERE schemaname='vc' AND tablename='posts' AND cmd='INSERT'` | PENDING |
| Apply migration to staging | Run `20260522010000_vc_posts_insert_ownership_rls.sql` via Supabase migration CLI | PENDING |
| Gas station publish flow | Authenticated vport owner session → publish gas price update | PENDING |
| Menu publish flow | Authenticated vport owner session → publish menu update | PENDING |
| Barbershop publish flows ×2 | Team member posting, owner posting | PENDING |
| Locksmith publish flows ×3 | Service area, portfolio, general | PENDING |
| Exchange publish flow | Rate announcement or similar | PENDING |
| User post creation | Standard citizen vibe post — confirm no regression | PENDING |
| VENOM sign-off | Confirm VF-001 (this session) + V-1 (prior session) are both closed | REQUIRED |
| THOR gate | Production release clearance | REQUIRED |

---

## FINAL CARNAGE VERIFICATION STATUS

**Proposal Status:** ENDORSED — no modifications required
**Migration Safety:** CAUTION (unchanged from original)
**Rollback Survivability:** FULL (unchanged from original)
**Blocking Risk Cleared By This Migration:** DR-001 / R-BLOCK-03

**Remaining blockers after this migration is applied:**
- R-BLOCK-01: `upsertVportServices` ownership gate (Wolverine code task — separate)
- R-BLOCK-02: `/profile/:actorId` raw UUID route (Wolverine code task — separate)
- R-BLOCK-04: `PostModel` layer inversion in `getActorPosts.controller.js` (Wolverine code task — separate)

**Proceed to:** Staging verification → VENOM sign-off → THOR production gate

---

## EVIDENCE CHAIN (this session)

| Source | Path |
|---|---|
| Original Carnage proposal | `_ACTIVE/audits/migrations/2026-05-22_10-00_carnage_vc-posts-insert-ownership-rls.md` |
| DB RLS coverage audit (profiles CEREBRO) | `_HISTORY/db/snapshots/2026-05-22_db_profiles-rls-coverage-audit.md` |
| VENOM trust boundary audit (profiles CEREBRO) | `CURRENT/features/dashboard/evidence/2026-05-22_venom_profiles-trust-boundaries.md` |
| IRONMAN ownership audit (profiles CEREBRO) | `CURRENT/features/dashboard/evidence/2026-05-22_ironman_profiles-feature-ownership.md` |
| Dashboard document | `_CANONICAL/logan/marvel/architect/modules/vcsm.profiles.architecture.md` |
