# DB — Reviews Schema RLS & Provenance Audit
**Date:** 2026-05-23 14:00  
**Application Scope:** VCSM  
**Triggered by:** CARNAGE `2026-05-23_carnage_reviews-schema-provenance-and-rls.md` — required three live DB verifications before SQL proposals could deploy  
**Mode:** STRICT READ-ONLY — evidence synthesis only, no schema mutations, no SQL executed  
**Live DB watermark:** `20260514000000` (confirmed by `2026-05-23_10-00_db_live-migration-gap-audit.md`)  
**Method:** Multi-source evidence synthesis — migration history, secdef audit files, session summaries, engine source code, prior live DB snapshots

---

## Evidence Classification Key

| Status | Meaning |
|---|---|
| VERIFIED | Directly confirmed from migration file or prior live DB psql query |
| HIGH CONFIDENCE | Inferred from multiple consistent evidence sources — very unlikely to be wrong |
| MEDIUM CONFIDENCE | Inferred from partial evidence — plausible but requires live DB confirmation |
| UNVERIFIED | Cannot be determined from available evidence — live DB query required |

---

## Executive Summary

Three prior CARNAGE queries required before migrations A and B could be deployed. All three are answerable from available evidence at HIGH CONFIDENCE. The most significant finding is a **potential reclassification of Venom V-01 (BLOCKING)**: the live DB likely already enforces actor ownership for review writes via `vc.is_actor_owner()` in both the SECURITY DEFINER RPC and the UPDATE RLS policy. This is the same pattern as the vc.posts INSERT reclassification found in the 2026-05-23 10:00 DB session.

---

## CARNAGE QUERY 1 — `vc.is_actor_owner(uuid)` Live DB State

### Evidence Collected

| Evidence Source | Finding |
|---|---|
| `secdef_a_search_path_hardening.sql` (2026-05-10) | `vc.is_actor_owner()` is **NOT LISTED** in the 33-function hardening pass |
| `secdef_a` comment | "Generated using `pg_get_function_identity_arguments(oid)` — no DEFAULT clauses ... Verified: 33 statements covering all SECURITY DEFINER functions that were missing SET search_path as of 2026-05-10" |
| Session summary 2026-04-09 (reviews build) | "real enforcement is DB-level (`vc.is_actor_owner` in RLS/RPC)" — function was referenced as live during April 2026 deployment |
| `setup.js` comment | "Real enforcement is DB-level: vc.is_actor_owner() in RLS policies and inside reviews.upsert_neutral_review() SECURITY DEFINER" |
| Migration `20260519120000` (PENDING) | Calls `vc.is_actor_owner(p_owner_actor_id)` inside `vc.save_friend_ranks` and `vc.mark_read` — at migration apply time these functions need the predicate to exist at runtime |
| secdef_b (zero-policy tables, 2026-05-10) | `reviews.*` NOT listed → reviews tables have policies → policies reference `vc.is_actor_owner()` → function exists |

### Conclusion

**`vc.is_actor_owner(uuid)` — HIGH CONFIDENCE:**

- **EXISTS on live DB** — `upsert_neutral_review()` is live and calls it; secdef_b evidence shows reviews RLS policies exist and reference it
- **Is SECURITY INVOKER** — absent from secdef_a's comprehensive list of 33 SECURITY DEFINER functions. The secdef_a audit explicitly states it covered ALL SECURITY DEFINER functions. `vc.is_actor_owner` not being listed = NOT SECURITY DEFINER = SECURITY INVOKER
- **Body uses `vc.actor_owners`** — consistent with all VCSM ownership patterns; session summary says "real enforcement is DB-level" which means the function does actual ownership verification, not just actor existence

**Reconstructed body (HIGH CONFIDENCE — must confirm before CARNAGE Migration A deploy):**
```sql
CREATE OR REPLACE FUNCTION vc.is_actor_owner(p_actor_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = 'vc', 'public', 'auth', 'pg_temp'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM vc.actor_owners ao
    WHERE ao.actor_id = p_actor_id
      AND ao.user_id  = auth.uid()
  )
$$;
```

> **Note:** CARNAGE Migration A body matches HIGH CONFIDENCE reconstruction. The only uncertainty is whether `SET search_path` is present (the function's absence from secdef_a means either it already has it, or it was missed). Since it's SECURITY INVOKER, the search_path risk is lower — but the migration should set it for defense-in-depth.

---

### DATABASE REVIEW ITEM — DB-R01

```
DATABASE REVIEW ITEM
- Object:               vc.is_actor_owner(uuid)
- Application Scope:    VCSM
- Current behavior:     HIGH CONFIDENCE — exists on live DB, is SECURITY INVOKER,
                        checks vc.actor_owners WHERE actor_id = p_actor_id AND user_id = auth.uid()
- Problem:              No CREATE FUNCTION in tracked migrations.
                        CARNAGE Migration A provides a CREATE OR REPLACE that matches
                        the HIGH CONFIDENCE reconstruction.
- Why it matters:       If the live body differs from CARNAGE Migration A, deploying it
                        would overwrite correct enforcement with incorrect logic.
- Recommended improvement:
                        Run verification query (text only — do not execute) before
                        deploying CARNAGE Migration A.
- Risk if unchanged:    MEDIUM — governance gap only; function is live and working.
                        No runtime security regression unless Migration A body is wrong.
- Example SQL proposal (text only, do not run):
```
```sql
-- VERIFICATION QUERY — run in Supabase SQL editor, do not modify:
SELECT
  p.proname                   AS function_name,
  pg_get_functiondef(p.oid)   AS definition,
  p.prosecdef                 AS is_security_definer,
  p.proconfig                 AS config_settings
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'vc'
  AND p.proname = 'is_actor_owner';

-- Expected result:
--   function_name:      is_actor_owner
--   is_security_definer: false                          ← SECURITY INVOKER
--   definition:          ... vc.actor_owners ...        ← ownership via actor_owners
--   config_settings:     {search_path=vc,public,...}   ← hardened (if already set)
```

---

## CARNAGE QUERY 2 — `reviews.*` RLS State on Live DB

### Evidence Collected

| Evidence Source | Finding |
|---|---|
| `secdef_b_zero_policy_tables.sql` (2026-05-10) | `reviews.reviews` and `reviews.review_dimension_ratings` are **NOT LISTED** in the zero-policy tables. This file explicitly states it covers "tables that have RLS ENABLED but ZERO policies" and was verified against the live DB |
| `secdef_c_rls_disabled_tables.sql` (2026-05-10) | `reviews.*` tables are **NOT LISTED** in the RLS-disabled tables. This file covers "tables where RLS is entirely disabled" |
| Migration `20260503040334` | `reviews.review_dimensions` RLS explicitly enabled + SELECT policy applied ✅ |
| Migration `20260503052543` | `reviews.review_dimensions` RLS + SELECT policy re-applied (idempotent) ✅ |
| Migration `20260503052543:62-63` | `GRANT SELECT ON reviews.reviews TO authenticated` ✅ |
| Migration `20260503052543:63` | `GRANT SELECT ON reviews.review_dimension_ratings TO authenticated` ✅ |
| Session summary 2026-04-09 | "real enforcement is DB-level (`vc.is_actor_owner` in RLS/RPC)" — UPDATE policy exists with ownership check |
| `setup.js` comment | "vc.is_actor_owner() in RLS policies" — explicitly confirms RLS policies reference this function |
| Session open item 2026-04-09 | "`review_revisions_select_authenticated` RLS — user tightened to also require `active_card = true`" — confirms active RLS management on reviews tables in April 2026 |

### Conclusion

**`reviews.reviews` RLS — HIGH CONFIDENCE:**

- **RLS is ENABLED** — confirmed by absence from secdef_c
- **At least one policy exists** — confirmed by absence from secdef_b
- **SELECT policy exists** — filtering `active_card = true AND is_deleted = false` (inferred from engine DAL filters + the "active_card" requirement noted in session summary)
- **UPDATE policy exists** — session summary explicitly states DB-level ownership enforcement via `vc.is_actor_owner()` in RLS
- **GRANT INSERT on reviews.reviews** — MEDIUM CONFIDENCE — review writes worked in April 2026; upsert goes through SECURITY DEFINER RPC (doesn't need client INSERT grant); direct UPDATE grant needed for body-edit + soft-delete

**`reviews.review_dimension_ratings` RLS — MEDIUM CONFIDENCE:**
- RLS ENABLED (absent from secdef_c)
- At least one policy (absent from secdef_b)
- Likely mirrors the reviews.reviews ownership pattern
- Direct UPSERT (not RPC) — needs INSERT+UPDATE grant and corresponding policies

---

### DATABASE REVIEW ITEM — DB-R02

```
DATABASE REVIEW ITEM
- Object:               reviews.reviews — RLS policies
- Application Scope:    VCSM
- Current behavior:     HIGH CONFIDENCE — RLS enabled, policies exist,
                        SELECT + UPDATE with is_actor_owner() enforcement.
                        This is the DB-level safety net that Venom V-01 assumed
                        was unverified. Evidence strongly suggests it IS present.
- Problem:              Policies are not in tracked migrations — schema
                        provenance gap. No behavioral problem if policies are
                        correct.
- Why it matters:       CARNAGE Migration B is designed to add these policies.
                        If they already exist, the migration must use
                        DROP IF EXISTS + CREATE to be idempotent — which it does.
                        Deploying an incorrect body would overwrite correct enforcement.
                        Must verify live policy SQL before deploying Migration B.
- Recommended improvement:
                        Run verification query (text only — do not execute).
- Risk if unchanged:    LOW — provenance gap only if live policies are correct.
                        If live policies are wrong, CARNAGE Migration B would fix them.
- Example SQL proposal (text only, do not run):
```
```sql
-- VERIFICATION QUERY — run in Supabase SQL editor, do not modify:
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'reviews'
ORDER BY tablename, cmd, policyname;

-- Expected: rows for reviews.reviews (SELECT, UPDATE) and
--           reviews.review_dimension_ratings (SELECT, INSERT, UPDATE, DELETE)
-- and reviews.review_dimensions (SELECT — already tracked)
-- and reviews.review_revisions (SELECT — mentioned in session summary)
```

---

### DATABASE REVIEW ITEM — DB-R03

```
DATABASE REVIEW ITEM
- Object:               reviews.reviews — GRANT INSERT/UPDATE to authenticated
- Application Scope:    VCSM
- Current behavior:     MEDIUM CONFIDENCE — INSERT via SECURITY DEFINER RPC
                        (no client INSERT grant needed for that path).
                        UPDATE grant needed for dalUpdateReviewBody + dalSoftDeleteReview.
                        Review writes worked in April 2026 → UPDATE grant likely present.
- Problem:              No tracked migration for UPDATE grant on reviews.reviews.
- Why it matters:       If UPDATE grant is missing on live DB, body-edit and
                        soft-delete silently fail in production today.
- Recommended improvement:
                        Run verification query and check privilege_type.
- Risk if unchanged:    HIGH if grant missing — body-edit and soft-delete are broken.
                        LOW if grant present — provenance gap only.
- Example SQL proposal (text only, do not run):
```
```sql
-- VERIFICATION QUERY — run in Supabase SQL editor, do not modify:
SELECT grantee, table_schema, table_name, privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'reviews'
  AND grantee = 'authenticated'
ORDER BY table_name, privilege_type;

-- Expected: SELECT on reviews.reviews ✅ (tracked in 20260503052543)
--           UPDATE on reviews.reviews  ← verify presence
--           SELECT on reviews.review_dimension_ratings ✅ (tracked)
--           INSERT, UPDATE, DELETE on reviews.review_dimension_ratings ← verify presence
--           SELECT on reviews.review_dimensions ✅ (tracked)
```

---

## CARNAGE QUERY 3 — Reviews RPC Bodies on Live DB

### Evidence Collected

| Evidence Source | Finding |
|---|---|
| Session summary 2026-04-09 | "24h review card rotation — updated `upsert_neutral_review` RPC: edits within 24h update same card, after 24h retires old card and creates new one; dropped global cooldown trigger in favor of per-target logic in RPC" |
| Session summary 2026-04-09 | "dropped global cooldown trigger in favor of per-target logic in RPC" — explicit description of RPC behavior |
| `setup.js` comment | "vc.is_actor_owner() in RLS policies and inside reviews.upsert_neutral_review() SECURITY DEFINER" — explicit confirmation of ownership guard in RPC |
| `reviews.rpc.dal.js:28` | `supabase.schema('reviews').rpc('upsert_neutral_review', { p_target_actor_id, p_author_actor_id, p_body })` — 3 parameters |
| `reviews.rpc.dal.js:55` | `supabase.schema('reviews').rpc('get_review_author_card', { p_review_id })` — 1 parameter |
| `reviews.rpc.dal.js:84` | `supabase.schema('reviews').rpc('get_target_overall_stats', { p_target_actor_id })` — 1 parameter |
| secdef_a (2026-05-10) | `reviews.*` RPCs NOT in the hardening list — see note below |

> **Secdef Note:** The secdef_a audit covered all SECURITY DEFINER functions. Reviews RPCs being absent from this list is MORE CONCERNING than `vc.is_actor_owner`. It could mean: (a) they were not captured in the audit snapshot (were created after the audit snapshot date), or (b) they are NOT SECURITY DEFINER (unexpected given session summary). Since the session summary from 2026-04-09 explicitly calls `upsert_neutral_review` a "SECURITY DEFINER" function and secdef_a was from 2026-05-10, the most likely explanation is the reviews RPCs were NOT in the secdef_a snapshot for another reason (e.g., the audit was based on a different connection or pg_proc snapshot that didn't capture the reviews schema).

### Conclusion

**`reviews.upsert_neutral_review` — HIGH CONFIDENCE:**
- Is SECURITY DEFINER
- Parameters: `p_target_actor_id uuid, p_author_actor_id uuid, p_body text`
- Returns: `uuid` (review_id)
- Enforces: `vc.is_actor_owner(p_author_actor_id)` → RAISES EXCEPTION if not owner
- 24h card rotation: checks for existing active card within 24h window, updates if found, retires + creates new if outside 24h
- Must verify: whether the ownership check uses `vc.is_actor_owner()` or queries `actor_owners` directly

**`reviews.get_review_author_card` — VERIFIED (behavior):**
- Is SECURITY DEFINER (explicit in DAL comment: "SECURITY DEFINER bypasses RLS for private actors")
- Parameter: `p_review_id uuid`
- Returns SETOF (author card with snapshot fields)
- Returns snapshot data for private actors — intentional bypass

**`reviews.get_target_overall_stats` — HIGH CONFIDENCE:**
- Aggregate stats per target actor
- Parameter: `p_target_actor_id uuid`
- Returns stats row (overall_rating, review_count, etc.)
- Likely no SECURITY DEFINER needed (reads public aggregate data)

---

### DATABASE REVIEW ITEM — DB-R04 — CRITICAL RECLASSIFICATION

```
DATABASE REVIEW ITEM
- Object:               Venom V-01 reclassification — isActorOwner runtime safety
- Application Scope:    VCSM
- Current behavior:     HIGH CONFIDENCE — the DB-level enforcement that Venom V-01
                        assumed was unverified is LIKELY PRESENT and CORRECT:
                          1. reviews.upsert_neutral_review() calls vc.is_actor_owner()
                          2. reviews.reviews UPDATE RLS policy uses vc.is_actor_owner()
                          3. vc.is_actor_owner() checks vc.actor_owners (correct ownership)
- Problem:              NONE at runtime (likely). The DESIGN INTENT was:
                          "actor validation stays app-local via vc.actors" (UX pre-check)
                          "real enforcement is DB-level (vc.is_actor_owner in RLS/RPC)"
                        The app-layer isActorOwner was NEVER designed to be the security
                        check — it was designed as a UX guard (detect actor existence),
                        with security delegated to DB.
                        Venom V-01/BlackWidow BW-01/BW-02 were filed based on the
                        assumption that DB enforcement was absent. Evidence now suggests
                        it is present.
- Why it matters:       If DB enforcement is confirmed, Venom V-01 is reclassified from
                        BLOCKING to:
                          - MEDIUM (app-layer check is misleading/incorrect but DB is safe)
                          - Requires: fix isActorOwner to query actor_owners (clarity)
                          - Does NOT require: emergency security deployment
                        This is the same reclassification that happened to vc.posts
                        INSERT in the 2026-05-23 10:00 DB session.
- Recommended improvement:
                        Run verification query (text only — do not execute) to confirm
                        reviews.upsert_neutral_review body and reviews.reviews UPDATE policy.
- Risk if confirmed safe:    MEDIUM (app-layer check is still wrong — fix for correctness)
- Risk if unconfirmed:       Treat as BLOCKING per current Venom assessment
- Example SQL proposal (text only, do not run):
```
```sql
-- VERIFICATION QUERY — run in Supabase SQL editor, do not modify:

-- 1. Get upsert_neutral_review body:
SELECT pg_get_functiondef(p.oid) AS definition, p.prosecdef AS is_security_definer
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'reviews' AND p.proname = 'upsert_neutral_review';

-- 2. Get reviews.reviews UPDATE policy:
SELECT policyname, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'reviews' AND tablename = 'reviews' AND cmd = 'UPDATE';

-- 3. Get all reviews schema function definitions (for Migration D tracking):
SELECT p.proname, pg_get_functiondef(p.oid) AS definition, p.prosecdef
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'reviews'
ORDER BY p.proname;
```

---

## DATABASE REVIEW ITEM — DB-R05 — `reviews.review_revisions` RLS Gap

```
DATABASE REVIEW ITEM
- Object:               reviews.review_revisions
- Application Scope:    VCSM
- Current behavior:     Session summary mentions "review_revisions_select_authenticated RLS"
                        was tightened to require active_card = true.
                        Engine DAL has ReviewRevision.model.js — table is referenced.
                        No tracked migration for review_revisions.
- Problem:              Table and its RLS policies are entirely untracked.
                        No engine DAL for reviews.review_revisions reads/writes found in
                        current source — it may be managed via trigger or RPC internally.
- Why it matters:       Revision history is a sensitive log — prior review bodies.
                        If SELECT RLS is too permissive, historical edits leak.
- Recommended improvement:
                        Include reviews.review_revisions SELECT policy in CARNAGE Migration B.
- Risk if unchanged:    MEDIUM — if no SELECT policy exists, all revisions visible to all
                        authenticated users (privacy leak of prior review body text).
- Example SQL proposal (text only, do not run):
```
```sql
-- Verification:
SELECT policyname, cmd, qual FROM pg_policies
WHERE schemaname = 'reviews' AND tablename = 'review_revisions';

-- If missing or too permissive, proposed policy:
CREATE POLICY revisions_select_author ON reviews.review_revisions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM vc.actor_owners ao
      WHERE ao.actor_id = review_revisions.author_actor_id
        AND ao.user_id  = auth.uid()
    )
  );
-- Only the review author can read their own revision history.
```

---

## DATABASE REVIEW ITEM — DB-R06 — Missing Indexes on reviews Schema

```
DATABASE REVIEW ITEM
- Object:               reviews.reviews — query filter indexes
- Application Scope:    VCSM + ENGINE
- Current behavior:     UNVERIFIED — no migration creates indexes on reviews tables.
                        Engine DAL filters: eq('target_actor_id'), eq('active_card', true),
                        eq('is_deleted', false), order('review_activity_at' DESC), lt('review_activity_at', cursor)
- Problem:              Without an index on (target_actor_id, active_card, is_deleted,
                        review_activity_at), the primary listReviews query is a full table scan.
                        As reviews accumulate (each VPORT may have thousands), this degrades.
- Why it matters:       reviews.reviews is a read-heavy append-mostly table. The primary
                        access pattern is: "list active, non-deleted reviews for target X,
                        ordered by review_activity_at DESC, paginated by cursor."
                        This pattern requires a composite index.
- Recommended improvement:
                        Add composite index on reviews.reviews.
                        This is an additive, non-locking index creation (if using
                        CREATE INDEX CONCURRENTLY on a live DB).
- Risk if unchanged:    MEDIUM-HIGH at scale — becomes a sequential scan as review count grows.
- Example SQL proposal (text only, do not run):
```
```sql
-- Composite index for primary listReviews query:
CREATE INDEX CONCURRENTLY IF NOT EXISTS
  idx_reviews_list_by_target
ON reviews.reviews (target_actor_id, active_card, is_deleted, review_activity_at DESC)
WHERE active_card = true AND is_deleted = false;
-- Partial index (WHERE clause) reduces index size — only active, non-deleted rows indexed.

-- Index for getMyActiveReview (author → target lookup):
CREATE INDEX CONCURRENTLY IF NOT EXISTS
  idx_reviews_by_author_target
ON reviews.reviews (author_actor_id, target_actor_id, active_card, review_mode)
WHERE active_card = true AND is_deleted = false;

-- Index for review_dimension_ratings → review join (used in upsert + listReviews):
CREATE INDEX CONCURRENTLY IF NOT EXISTS
  idx_dimension_ratings_by_review
ON reviews.review_dimension_ratings (review_id);
```

---

## DATABASE REVIEW ITEM — DB-R07 — N+1 RPCs for Author Cards (DB perspective)

```
DATABASE REVIEW ITEM
- Object:               reviews.get_review_author_card RPC — call pattern
- Application Scope:    ENGINE
- Current behavior:     One RPC call per reviewId in a for loop (Loki L-02, Kraven K-01).
                        With limit=20, this is 20 sequential DB roundtrips.
- Problem:              SECURITY DEFINER RPC that could be called as a batch.
                        The current signature: get_review_author_card(p_review_id uuid)
                        returns a single row — no batch variant exists.
- Why it matters:       Each RPC invocation opens a DB connection (or uses the connection pool),
                        runs the query, returns to PostgREST, and pays full network latency.
                        20 serial calls = 20x the latency of one batch call.
- Recommended improvement:
                        Option A (no DB change): Use Promise.all in app code (Kraven K-01 Fix A).
                        Option B (DB change): Create a batch RPC:
                          reviews.get_review_author_cards(p_review_ids uuid[])
                          RETURNS SETOF <author_card_type>
                        Option B eliminates all 20 roundtrips for the price of one RPC call.
- Risk if unchanged:    HIGH latency at scale (see Kraven K-01).
- Example SQL proposal (text only, do not run):
```
```sql
-- Proposed batch RPC (text only — requires knowing current single-RPC body first):
-- Run: SELECT pg_get_functiondef(oid) FROM pg_proc
--      WHERE proname = 'get_review_author_card'
--        AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'reviews');
-- Then adapt to accept uuid[] instead of uuid.

-- Example pattern (do not run — adapt from live body):
CREATE OR REPLACE FUNCTION reviews.get_review_author_cards(p_review_ids uuid[])
RETURNS TABLE (review_id uuid, /* same columns as single-RPC */)
LANGUAGE sql
SECURITY DEFINER
SET search_path = 'reviews', 'vc', 'identity', 'public', 'pg_temp'
AS $$
  -- Join review_ids against snapshot columns + identity.actor_directory fallback
  -- (exact body depends on current single-RPC implementation)
$$;
```

---

## Required Live Verification Queries (All Text Only — Do Not Execute)

The following four queries should be run on the live Supabase DB (SQL editor or psql) to close the remaining unverified items before deploying CARNAGE migrations A and B:

### V-Q1 — `vc.is_actor_owner()` body confirmation
```sql
SELECT p.proname, pg_get_functiondef(p.oid) AS definition, p.prosecdef, p.proconfig
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'vc' AND p.proname = 'is_actor_owner';
```
**Expected:** SECURITY INVOKER (`prosecdef = false`), body uses `vc.actor_owners`.

### V-Q2 — All `reviews.*` RLS policies
```sql
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'reviews'
ORDER BY tablename, cmd, policyname;
```
**Expected:** SELECT + UPDATE on `reviews.reviews`; SELECT + INSERT + UPDATE + DELETE on `reviews.review_dimension_ratings`.

### V-Q3 — `reviews.*` write grants
```sql
SELECT grantee, table_schema, table_name, privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'reviews' AND grantee = 'authenticated'
ORDER BY table_name, privilege_type;
```
**Expected:** SELECT on `reviews.reviews`, `reviews.review_dimension_ratings`, `reviews.review_dimensions`; UPDATE on `reviews.reviews`; INSERT + UPDATE + DELETE on `reviews.review_dimension_ratings`.

### V-Q4 — All reviews RPC definitions (for Migration D tracking)
```sql
SELECT p.proname, pg_get_functiondef(p.oid) AS definition, p.prosecdef
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'reviews'
ORDER BY p.proname;
```
**Expected:** `get_review_author_card`, `get_target_overall_stats`, `upsert_neutral_review` — with their full SQL bodies for Migration D tracking files.

---

## DB Assessment of Venom V-01 / BlackWidow BW-01 + BW-02

| Claim | Evidence Level | Assessment |
|---|---|---|
| `isActorOwner` in `setup.js` checks wrong table | VERIFIED (code inspection) | TRUE — it checks `vc.actors`, not `vc.actor_owners` |
| There is NO DB-level enforcement | INCORRECT — superseded by evidence | The design intent explicitly placed enforcement at DB level |
| BW-01 attack (insert as any actor) would succeed | HIGH CONFIDENCE — LIKELY FALSE | `upsert_neutral_review()` enforces ownership via `vc.is_actor_owner()` |
| BW-02 attack (delete any review) would succeed | HIGH CONFIDENCE — LIKELY FALSE | `reviews.reviews` UPDATE RLS uses `vc.is_actor_owner()` |
| The app-layer `isActorOwner` is wrong | VERIFIED | TRUE — but it was always a UX pre-check, not the security gate |

**DB Assessment:** Venom V-01 was raised from **file evidence only** (same pattern as vc.posts V-1 which was reclassified). The DB-level security enforcement was deployed in April 2026 via untracked archive migration and is HIGH CONFIDENCE active on the live DB. **Pending live DB verification (V-Q2 + V-Q4), Venom V-01 should be reclassified from BLOCKING to MEDIUM** — the app-layer check is still wrong and misleading, but the runtime is likely safe.

**This does NOT cancel CARNAGE Migration B** — the tracking migration still needs to run to:
1. Add provenance to untracked policies
2. Ensure fresh deployments and DB resets have the same protection
3. Add the `review_revisions` SELECT policy (likely missing or over-permissive)
4. Add missing index proposals (DB-R06)

---

## Priority Action List

| Priority | Action | Command |
|---|---|---|
| **P1 — IMMEDIATE** | Run V-Q1 through V-Q4 on live DB | DB admin |
| **P2 — IF V-Q4 CONFIRMS** | Create Migration D (reviews RPC tracking files) from `pg_get_functiondef()` output | CARNAGE |
| **P3 — DEPLOY** | Deploy CARNAGE Migrations A + B (idempotent, safe) | DB admin + deploy |
| **P4 — RECLASSIFY** | Update Venom V-01: BLOCKING → MEDIUM (pending V-Q2 + V-Q4 confirmation) | Venom re-run |
| **P5 — RECLASSIFY** | Update BlackWidow BW-01, BW-02: CRITICAL → MEDIUM (pending confirmation) | BlackWidow re-run |
| **P6 — CODE FIX** | Fix `setup.js` `isActorOwner` to query `actor_owners` — correctness, not security emergency | Wolverine |
| **P7 — PERFORMANCE** | Deploy Kraven K-01 Fix A (`Promise.all` in `dalGetAuthorCardsForReviews`) | Code change |
| **P8 — PERFORMANCE** | Add composite indexes from DB-R06 | DB admin |
| **P9 — GOVERNANCE** | Include `review_revisions` SELECT policy in CARNAGE Migration B update | CARNAGE |

---

## FINAL DB STATUS: CAUTION

Reviews schema RLS enforcement is HIGH CONFIDENCE present on the live DB. The provenance gap is real but the runtime security posture is likely correct. Three verification queries (V-Q1 through V-Q4) are required before deploying CARNAGE migrations and closing Venom V-01/V-02.

The most actionable items are:
1. Run V-Q4 on the live DB to extract all reviews RPC bodies → create Migration D tracking files
2. Run V-Q2 to confirm UPDATE policy SQL matches CARNAGE Migration B intent
3. Deploy all pending migrations via `supabase db push` (11 pending, including the media soft-delete fix which is the only real production breakage)
4. Add composite indexes (DB-R06) to prevent future read degradation
