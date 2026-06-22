# CARNAGE MIGRATION REPORT — `vc.posts` INSERT RLS Ownership Hardening

**Date:** 2026-05-22
**Application Scope:** VCSM
**Triggered by:** VENOM V-1 finding (`2026-05-19_venom_post-dal-trust-surfaces.md`) → DB confirmation (`2026-05-19_16-00_db_vc-posts-insert-rls-gap.md`) → CEREBRO governance pass on `vcsm.dal.post.md`
**Authority:** GOVERNANCE_WRITABLE — proposals only, no migrations executed
**Migration Safety Status:** CAUTION

---

## Migration Reason

The existing `posts_insert_actor_owner` policy on `vc.posts` verifies that the inserting session is authenticated (`user_id = auth.uid()`) but does NOT verify that the `actor_id` being posted as is owned by that session user via `vc.actor_owners`.

This means any authenticated user who knows another actor's UUID can create posts — including vport system posts (fuel price updates, menu updates, etc.) — in that actor's name via direct PostgREST API calls, bypassing all client-side ownership checks.

This violates:
- ARCHITECTURE.md §1.3 — `actorId` is canonical; ownership must be verified at the DB layer
- ARCHITECTURE.md §1.4 — "Owner always means Actor Owner — verified through `actor_owners`"

Every other actor-scoped write table in the platform enforces this pattern. `vc.posts` is the sole exception.

---

## SCHEMA TRUST CLASSIFICATION

| Object | Classification | Reason |
|---|---|---|
| `vc.posts` | Public + Ownership-sensitive | Every post row is attributed to an `actor_id`; post authorship is visible in the public feed |
| `vc.posts.actor_id` | Identity-sensitive + Ownership-sensitive | Determines whose identity a post is published under; directly tied to vport/user reputation |
| `vc.posts.user_id` | Identity-sensitive | Maps post to a raw Supabase auth user; used for authentication anchor |
| `vc.actor_owners` | Identity-sensitive + Ownership-sensitive | Source of truth for actor ownership; the pattern used across all other write surfaces |
| `posts_insert_actor_owner` (current) | Security-sensitive | Named to imply actor ownership enforcement; implementation does not match the name |

---

## CURRENT STRUCTURE

| Object | Purpose | Dependencies |
|---|---|---|
| `vc.posts` | Stores all platform posts (user vibes, vport system posts) | `vc.actor_owners`, `vc.actors`, `vc.actor_follows`, `vc.actor_privacy_settings`, `moderation.blocks` |
| `posts_insert_actor_owner` (current) | INSERT policy — authenticates inserting user; does NOT verify actor ownership | `auth.uid()` only — no `actor_owners` join |
| `posts_select_actor_based` | SELECT policy — owner OR public/following + bidirectional block exclusion | `vc.actor_owners`, `moderation.blocks`, `vc.actor_privacy_settings`, `vc.actor_follows` |
| `posts_update_actor_owner` | UPDATE policy — scoped by `actor_id` equality in PostgREST WHERE clause | Unconfirmed whether it uses `actor_owners` JOIN; assumed auth-only same as INSERT |
| `posts_delete_actor_owner` | DELETE policy — same pattern concern as UPDATE | Unconfirmed; lower risk (app uses soft-delete via `deleted_at`) |
| `insertPost` DAL | Raw Supabase insert — accepts any well-formed row object | No ownership check; policy is the only DB-level gate |
| `createSystemPost` adapter | Calls `insertPost` with caller-supplied `actorId`; only checks `auth.getUser()` | Trusts actorId from 8 vport publish controllers |
| `createPostController` | User post creation; uses `identity.actorId` from session identity | Identity comes from `useIdentity()` — safe path; actor_id is always the authenticated user's own actor |

**Existing actor_owners SELECT grant:** Confirmed present. `20260430200000_fix_chat_rls_multi_actor.sql` includes `grant select on vc.actor_owners to authenticated` — the subquery in the proposed policy can execute.

**`vc.is_actor_owner()` helper:** Confirmed present (`20260519120000_platform_vc_security_hardening.sql`). However, this is a function (PL/pgSQL call) — the inline EXISTS subquery pattern is preferred in RLS policies for clarity and to avoid function call overhead in row-level evaluation.

**Established pattern (inline EXISTS):** Both `platform.media_assets` INSERT policy and `vc.friend_ranks` INSERT policy use the identical EXISTS subquery form — this is the confirmed pattern for this codebase.

---

## MIGRATION BLAST RADIUS

**Affected systems:**
- `vc.posts` INSERT path — the only table this migration touches
- `createSystemPost` adapter — 8 vport publish controllers (gas, menu, barbershop ×2, locksmith ×3, exchange)
- `createPostController` — user post creation path (no behavior change — `identity.actorId` is always the session user's own actor)
- Any direct PostgREST API calls to `vc.posts INSERT` by external actors (closes the bypass surface)

**Runtime impact:** Low. The policy enforcement occurs at the DB query layer. No index change, no schema change. All legitimate callers (authenticated users posting as their own actors) succeed as before.

**Release impact:** CAUTION. Must verify in staging that all 8 vport publish controllers succeed after this policy is applied. The session user must be in `actor_owners` for the vport actor being posted as. If an operator account is not in `actor_owners` for a vport, their publish calls will fail silently at the DB layer with a policy rejection.

**Rollback impact:** FULL — the rollback is a DROP + re-CREATE of the original policy. No data is destroyed. Policy changes are instantaneous and do not require downtime.

---

## RLS IMPACT REVIEW

| Object | RLS Dependency | Risk | Follow-up Required |
|---|---|---|---|
| `vc.posts` INSERT policy | CRITICAL | This IS the RLS change — replacing the weak policy with an ownership-enforcing one | VENOM sign-off, THOR gate before applying to production |
| `vc.posts` SELECT policy | NONE | `posts_select_actor_based` already uses `actor_owners` JOIN correctly — untouched by this migration | None |
| `vc.posts` UPDATE policy | INDIRECT | `posts_update_actor_owner` likely has the same auth-only gap as INSERT — not in scope here but should be audited separately | DB audit recommended post-this-migration |
| `vc.actor_owners` | DIRECT | Queried by the new WITH CHECK clause — must be SELECTable by `authenticated` role | **CONFIRMED SAFE** — grant exists from `20260430200000` |

---

## RUNTIME IMPACT ANALYSIS

| Runtime Area | Risk | Expected Impact | Mitigation |
|---|---|---|---|
| User post creation (`createPostController`) | LOW | No change — `identity.actorId` is always the session user's own actor; `actor_owners` row always exists | None required |
| Vport system posts (8 controllers) | MEDIUM | Session user must be in `actor_owners` for the vport. If the vport was provisioned correctly via `create_vport` RPC (which inserts into `actor_owners`), all publishes succeed | Verify in staging with real vport owner session |
| Direct PostgREST API bypass | ELIMINATED | Policy rejects inserts where `actor_id ∉ actor_owners` for `auth.uid()` — closes the V-1 surface | This is the intended outcome |
| Feed read performance | NONE | No SELECT policy change; no index change | None |
| `actor_owners` join latency | NEGLIGIBLE | EXISTS subquery on an indexed FK — same pattern used successfully on `media_assets` and `friend_ranks` | None |

---

## MIGRATION DEPENDENCY GRAPH

| Dependency Type | Affected Area | Risk |
|---|---|---|
| RLS dependency | `vc.actor_owners` SELECT grant to `authenticated` | **Resolved** — grant confirmed in `20260430200000` |
| DAL dependency | `insertPost.dal.js` — no change required | DAL is a thin wrapper; policy enforcement is transparent to the DAL |
| Controller dependency | `createSystemPost` adapter — no code change required | If the session user is a vport owner, the insert succeeds; if not, DB rejects — correct behavior |
| Controller dependency | `createPostController` — no change required | Actor identity from `useIdentity()` → `identity.actorId` always matches the session user's own actor |
| Migration ordering | Must run after `20260430200000_fix_chat_rls_multi_actor.sql` | **Already satisfied** — that migration ran 2026-04-30 |
| Migration ordering | No dependency on `20260519120000` (security hardening) | `is_actor_owner()` helper not used in the proposed policy |

---

## DATA INTEGRITY REVIEW

| Integrity Area | Risk | Detection Method | Mitigation |
|---|---|---|---|
| Legitimate vport posts | LOW — if `actor_owners` is correctly populated | Query: `SELECT actor_id FROM vc.actor_owners WHERE user_id = auth.uid()` before insert | Verify vport provisioning flow populates `actor_owners` correctly |
| Existing post rows | NONE | Policy is INSERT-only — no retroactive effect on existing rows | No backfill required |
| Multi-owner vport scenarios | LOW | If multiple users share a vport via `actor_owners`, each can post as that vport | Correct behavior — `actor_owners` supports multi-owner |
| Anonymous / system-generated posts | UNKNOWN | If any background/service-role process inserts posts, it may not have a session user | Service role bypasses RLS by default — not affected unless policy explicitly includes service_role |

**Key integrity guarantee:** The proposed policy uses `TO authenticated` — it applies only to the `authenticated` role. Service role (Supabase background functions, Edge Functions running with service role) bypasses RLS entirely. Any legitimate system process using service role is unaffected.

---

## IDENTITY / OWNERSHIP MIGRATION WARNING

**Object:** `vc.posts` — `actor_id` column

**Current behavior:** Any authenticated user can INSERT a post row with any `actor_id` value. The `posts_insert_actor_owner` policy verifies `user_id = auth.uid()` (the row's user_id must match the session) but does not verify that the session user owns the `actor_id` being used.

**Migration risk:** LOW for legitimate users (they own their own actors). MEDIUM for the transition if any edge case exists where a user's `actor_owners` row is missing for a vport they legitimately own (provisioning gap).

**Potential impact:** A vport operator whose `vc.actor_owners` row is missing or was deleted would lose the ability to publish system posts. This would fail silently at the DB layer (RLS rejection) and surface as a generic PostgREST error.

**Recommended safeguards:**
1. Before applying to production, run the pre-check query below to confirm all active vport publish operations have valid `actor_owners` rows
2. Verify staging with a real vport owner session attempting each of the 8 publish flows
3. Add error handling in `createSystemPost` adapter to surface RLS rejections as a descriptive error (e.g., "Not authorized to post as this vport — actor ownership verification failed")

---

## MIGRATION EXECUTION STRATEGY

| Phase | Strategy | Risk | Notes |
|---|---|---|---|
| 1 — Pre-check | Direct read — confirm current INSERT policy definition via `pg_policies` | None | Run pre-check SQL in Supabase SQL editor; read-only |
| 2 — Staging apply | Direct migration — DROP + CREATE policy in a single transaction | LOW | Apply to staging first; test all 8 vport publish flows |
| 3 — Staging verification | Manual test — each publish controller with an authenticated vport owner session | MEDIUM | Must confirm no RLS rejection on valid publishes |
| 4 — Production gate | THOR release gate before production apply | LOW | Migration is a single policy change; low operational risk |
| 5 — Production apply | Direct migration in BEGIN/COMMIT transaction | LOW | Instantaneous; no table lock; no downtime |

**No staged rollout or shadow column needed.** Policy changes on PostgreSQL are instantaneous and transactional. The `DROP POLICY IF EXISTS` + `CREATE POLICY` in a single transaction is atomic.

---

## ROLLBACK SURVIVABILITY

**Rollback status:** FULL

**Data recovery risk:** NONE — no data is modified by this migration. Policy changes affect only what operations are permitted going forward; existing rows are untouched.

**Compatibility rollback risk:** LOW — rolling back restores the previous (weakened) policy. The V-1 surface reopens but no data is lost.

**Operational complexity:** LOW — rollback is a single SQL statement (see below). No downtime required. Can be applied instantly via Supabase SQL editor.

---

## VALIDATION CHECKLIST

| Validation Area | Status | Notes |
|---|---|---|
| `actor_owners` SELECT grant confirmed | CONFIRMED | `20260430200000_fix_chat_rls_multi_actor.sql` |
| `vc.posts` RLS enabled + FORCE | CONFIRMED | `20260510020000` header; secdef_c confirms not in RLS-disabled list |
| Inline EXISTS pattern established | CONFIRMED | `platform.media_assets` INSERT policy uses identical form |
| `createPostController` identity source | CONFIRMED | `identity.actorId` from `useIdentity()` — always session user's own actor |
| `createSystemPost` actor ownership | PENDING | Confirm all 8 vport controllers' sessions are vport `actor_owners` in staging |
| 8 vport publish flows (staging test) | PENDING | Required before production apply |
| Pre-check query (current policy state) | PENDING | Run in staging SQL editor before migration |
| VENOM sign-off | REQUIRED | V-1 finding owner — confirm migration closes the finding |
| THOR release gate | REQUIRED | Before production apply |

---

## BOUNDARY MIGRATION REVIEW

| Schema Object | Scope Owner | Cross-Root Risk | Status |
|---|---|---|---|
| `vc.posts` | VCSM | None — `vc` schema is VCSM-only | CLEAR |
| `vc.actor_owners` | VCSM | None — read-only in this policy; no modification | CLEAR |
| Migration file location | `apps/VCSM/supabase/migrations/` | None — VCSM-only path | CLEAR |
| No engine schema touched | — | None | CLEAR |

**Boundary contract status: CLEAR.** This migration is entirely within the VCSM protected root. No cross-root impact.

---

## PROPOSED MIGRATION FILE

**Filename:** `20260522010000_vc_posts_insert_ownership_rls.sql`
**Location:** `apps/VCSM/supabase/migrations/`
**Timestamp:** `20260522010000` — next after `20260519200000`

---

## Example SQL Proposal (text only — do not execute automatically)

```sql
-- =============================================================
-- Migration: 20260522010000_vc_posts_insert_ownership_rls.sql
-- Date: 2026-05-22
-- Application Scope: VCSM
-- Governance:
--   VENOM finding: CURRENT/features/dashboard/evidence/2026-05-19_venom_post-dal-trust-surfaces.md (V-1)
--   DB analysis:   _HISTORY/db/snapshots/2026-05-19_16-00_db_vc-posts-insert-rls-gap.md
--   CARNAGE plan:  _ACTIVE/audits/migrations/2026-05-22_10-00_carnage_vc-posts-insert-ownership-rls.md
-- =============================================================
--
-- Problem:
--   posts_insert_actor_owner verifies authentication (user_id = auth.uid())
--   but does NOT verify that the session user owns the actor being posted as.
--   Any authenticated user can INSERT a post for any actor_id they know.
--
-- Fix:
--   Replace the policy with an ownership-enforcing version that requires
--   the actor_id being posted as to exist in vc.actor_owners for auth.uid().
--
-- Pattern:
--   Identical EXISTS subquery used in platform.media_assets INSERT policy
--   (20260519200000_media_assets_soft_delete_policy.sql) and vc.friend_ranks.
--
-- Dependencies:
--   • vc.actor_owners SELECT grant to authenticated:
--     CONFIRMED — 20260430200000_fix_chat_rls_multi_actor.sql
--   • No new grants required
--
-- Rollback:
--   See rollback section at bottom of this file.
--
-- Pre-check (run first to confirm current policy before applying):
--
--   SELECT policyname, cmd, roles, qual, with_check
--   FROM pg_policies
--   WHERE schemaname = 'vc'
--     AND tablename  = 'posts'
--     AND cmd        = 'INSERT';
--
-- =============================================================

BEGIN;

DROP POLICY IF EXISTS "posts_insert_actor_owner" ON vc.posts;

CREATE POLICY "posts_insert_actor_owner"
  ON vc.posts
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- 1. The post's user_id must match the authenticated session
    user_id = auth.uid()

    AND

    -- 2. The actor being posted as must be owned by the authenticated user
    EXISTS (
      SELECT 1
      FROM vc.actor_owners ao
      WHERE ao.actor_id = posts.actor_id
        AND ao.user_id  = auth.uid()
    )
  );

COMMIT;

-- =============================================================
-- ROLLBACK
-- =============================================================
-- To roll back this migration, restore the authentication-only policy.
-- This reopens the V-1 surface but causes no data loss.
--
-- BEGIN;
--
-- DROP POLICY IF EXISTS "posts_insert_actor_owner" ON vc.posts;
--
-- CREATE POLICY "posts_insert_actor_owner"
--   ON vc.posts
--   FOR INSERT
--   TO authenticated
--   WITH CHECK (
--     user_id = auth.uid()
--   );
--
-- COMMIT;
-- =============================================================
```

---

## RECOMMENDED HANDOFFS

| Command | Action | Priority |
|---|---|---|
| **VENOM** | Sign off on V-1 closure — confirm this migration closes the trust boundary gap identified in `2026-05-19_venom_post-dal-trust-surfaces.md` | HIGH — required before THOR |
| **THOR** | Release gate — migration must clear THOR before production apply | HIGH — required before production |
| **DB** | Post-migration verification — run pre-check query to confirm current policy definition in staging; confirm UPDATE and DELETE policy gaps separately | MEDIUM |
| **LOGAN** | Update `vcsm.dal.post.md` — mark V-1 RESOLVED once migration is confirmed applied; record migration reference in change log | MEDIUM — post-apply |
| **Wolverine** | Schedule the remaining V-1 adjacent work: (1) add RLS rejection error handling to `createSystemPost` adapter, (2) V-2 (null viewerActorId), (3) RISK-1/2/3 dead code | MEDIUM |

---

## FINAL CARNAGE STATUS: CAUTION

**Reason:** The migration itself is simple, instantaneous, and fully rollback-safe. CAUTION applies because:
1. Eight vport publish controllers must be verified in staging before production apply — any vport whose `actor_owners` row is missing will fail silently
2. VENOM sign-off and THOR gate are required before production
3. UPDATE and DELETE policy gaps on `vc.posts` remain unaddressed and should be audited separately

**Not BLOCKED.** The migration is technically sound and the rollback is FULL. Once staging verification passes and VENOM/THOR clear it, this is safe to apply.

---

## Upstream Evidence Chain

| Source | Path | Relevance |
|---|---|---|
| VENOM V-1 | `CURRENT/features/dashboard/evidence/2026-05-19_venom_post-dal-trust-surfaces.md` | Original trust boundary finding |
| DB RLS Gap Confirmation | `_HISTORY/db/snapshots/2026-05-19_16-00_db_vc-posts-insert-rls-gap.md` | Confirmed INSERT policy does not enforce actor ownership |
| ARCHITECT Gap 1 | `_ACTIVE/audits/architecture/2026-05-10_architect_feed-engine-vport-menu-gas-posts.md` | Pre-existing documented gap (2026-05-10) |
| Migration: actor_owners grant | `apps/VCSM/supabase/migrations/20260430200000_fix_chat_rls_multi_actor.sql` | Confirms dependency is satisfied |
| Migration: SELECT policy pattern | `apps/VCSM/supabase/migrations/20260510020000_vc_posts_privacy_rls.sql` | Confirms RLS enabled + FORCE on vc.posts |
| Pattern reference | `apps/VCSM/supabase/migrations/20260519200000_media_assets_soft_delete_policy.sql` | Confirms identical EXISTS subquery pattern in production |
| CEREBRO governance | `_CANONICAL/logan/vcsm/dal/vcsm.dal.post.md` | V-1 risk reclassified HIGH; CARNAGE required |
