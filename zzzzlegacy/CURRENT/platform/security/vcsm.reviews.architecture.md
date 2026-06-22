# MODULE ARCHITECTURE REPORT

**Module:** reviews
**Application Scope:** apps/VCSM
**Module Type:** Engine Wrapper Module — Reviews Engine Bridge
**Primary Root:** `apps/VCSM/src/features/reviews/`
**Independence Status:** DEPENDENT (delegates to @reviews engine)
**Completeness Status:** MOSTLY COMPLETE

---

## PURPOSE

Wires the `@reviews` engine into VCSM with app-specific actor ownership checks. All review domain logic (create, list, respond, rate) is owned and executed by the shared `@reviews` engine. VCSM contributes only its ownership resolver.

---

## ENTRY POINTS

- None (no screens/routes) — engine wire-up only
- `setup.js` must be called once before render
- All reviews UI consumed via engine adapters

---

## LAYER MAP

**Engine wrapper:** `setup.js` — configures `@reviews` with:
- `isActorOwner` check (VCSM actor ownership verification)

**No DAL** — engine owns data access
**No models** — engine owns domain shape
**No controllers** — engine owns business logic
**No hooks** — engine owns UI lifecycle hooks
**No components/screens** — engine owns UI
**No adapter** — VCSM consumes engine adapters directly

---

## MODULE COMPLETENESS MATRIX

| Area | Status | Evidence | Missing / Risk |
|---|---|---|---|
| Purpose defined | PASS | Engine bridge clear | — |
| Controllers present | N/A | Delegated to engine | — |
| DAL present | N/A | Delegated to engine | — |
| Models present | N/A | Delegated to engine | — |
| Hooks present | N/A | Delegated to engine | — |
| Screens present | N/A | Delegated to engine | — |
| Adapter present | N/A | Engine exposes its own adapters | — |
| Documentation | FAIL | No Logan doc | — |

---

## DEAD CODE / SPAGHETTI SIGNALS

None detected. Module is intentionally minimal.

---

## MISSING PIECES

| Missing Piece | Severity | Why It Matters | Suggested Owner |
|---|---|---|---|
| Logan documentation | MEDIUM | No canonical reviews engine integration doc | LOGAN |

---

## FINAL MODULE STATUS: MOSTLY COMPLETE

## RECOMMENDED HANDOFFS:
- LOGAN (documentation)

---

---

# CEREBRO VERIFICATION RUN — 2026-05-23

**Triggered by:** User instruction — verify this dashboard DAL document  
**Scope:** `VCSM + ENGINE` (read-only inspection)  
**Boundary Contract:** `PROJECT_BOUNDARY_ISOLATION_CONTRACT.md` — LOADED & ENFORCED

---

## CEREBRO Risk Classification

All risks classified before any command ran.

| Risk ID | Category | Finding | Severity |
|---|---|---|---|
| R-01 | SECURITY | `isActorOwner` in `setup.js` checks `vc.actors` (existence), NOT `vc.actor_owners` (ownership) — any authenticated user can impersonate any actor | **BLOCKING** |
| R-02 | DB/RLS | `reviews.reviews` table grants (INSERT/UPDATE/DELETE) and `vc.is_actor_owner()` function definition not found in any tracked migration | **BLOCKING** |
| R-03 | SECURITY | `dalUpdateReviewBody` and `dalSoftDeleteReview` have no `.eq('author_actor_id')` guard at DAL level | HIGH |
| R-04 | RUNTIME | N+1: `dalGetAuthorCardsForReviews` fires one serial RPC per reviewId (20 calls for limit=20) | HIGH |
| R-05 | SECURITY | SECURITY DEFINER RPCs (`upsert_neutral_review`, `get_review_author_card`, `get_target_overall_stats`) not found in tracked migrations — bodies unaudited | MEDIUM |
| R-06 | STALE CLAIM | Document says "No adapter" — ACCURATE but misleading. VCSM imports `configureReviewsEngine` directly from `@reviews` in `setup.js` without an app-level adapter | LOW |
| R-07 | STALE CLAIM | "setup.js must be called once before render" — VERIFIED CORRECT: `main.jsx:22` before `createRoot:106` | PASS |
| R-08 | STALE CLAIM | "No DAL, No models, No controllers, No hooks, No screens" — VERIFIED CORRECT | PASS |
| R-09 | DOCUMENTATION | No Logan doc for reviews engine integration | MEDIUM |
| R-10 | MISSING OWNERSHIP | No module owner assigned in document or codebase | LOW |
| R-11 | ARCHITECTURE | `isActorOwner` violates ARCHITECTURE.md §1.4: "Owner always means Actor Owner — verified through `actor_owners`" | BLOCKING |
| R-12 | NATIVE PARITY | No offline queue/retry for review writes — iOS users on poor connection could lose submissions | LOW |

---

## Command Order Decision

Based on CEREBRO canonical run order (§11.1) and risk profile:

1. **ARCHITECT** — module structure verification (inline — single file in VCSM)
2. **Venom** — security & trust boundary (R-01, R-02, R-03, R-05)
3. **BlackWidow** — adversarial verification of R-01 attack chains
4. **Loki** — runtime trace (setup order, N+1 confirmation, error surface)
5. **Kraven** — performance (R-04 N+1 fix options)
6. **DB** — schema inspection (R-02 migration provenance gap)
7. **Sentry** — architecture compliance (R-11)
8. **review-contract** — contract clause verification
9. **Logan** — documentation gap (R-09)

---

## Phase 1 — ARCHITECT (Inline)

**Source verified:**
- `apps/VCSM/src/features/reviews/` → single file: `setup.js` (46 lines) ✅
- `engines/reviews/` → full engine: 6 controllers, 6 DAL files, 5 models, 3 services, adapters, config, events, types ✅
- Engine isolated: no imports from `apps/VCSM/`, `shared/`, or other engines ✅
- VCSM wire-up: imports only `configureReviewsEngine` from `@reviews` and `supabase` client ✅
- Setup call: `main.jsx:22` — before render at line 106 ✅

**ARCHITECT Status:** PASS (structure correct, single-file bridge as documented)

---

## Phase 2 — VENOM (Security)

**Standalone output:** `zNOTFORPRODUCTION/CURRENT/features/dashboard/evidence/venom_reviews_module_2026-05-23.md`

### Summary of Findings

**V-01 — isActorOwner Does Not Verify Ownership (BLOCKING)**  
`apps/VCSM/src/features/reviews/setup.js:30-44`

Current implementation:
```js
isActorOwner: async (actorId) => {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.user?.id) return false
  const { data, error } = await supabase
    .schema('vc').from('actors').select('id')
    .eq('id', actorId).eq('is_void', false).limit(1)
  if (error || !data?.[0]) return false
  return true
}
```

This confirms the actor EXISTS — not that the session user OWNS it. The fix must query `vc.actor_owners WHERE actor_id = actorId AND user_id = auth.uid()`.

**V-02 — reviews.reviews Grants & RLS Not in Tracked Migrations (BLOCKING)**  
No tracked migration grants INSERT/UPDATE/DELETE on `reviews.reviews`. `vc.is_actor_owner()` is called by hardening migration but never defined in any tracked file. Schema provenance gap.

**V-03 — DAL Write Operations Have No Author Guard (MEDIUM)**  
`dalUpdateReviewBody` and `dalSoftDeleteReview` have no `.eq('author_actor_id', ...)` predicate. Full reliance on controller-layer check which is broken.

**V-04 — SECURITY DEFINER RPCs: Unreviewed Body (LOW)**  
Three RPCs not in tracked migrations. SQL bodies unauditable from this codebase alone.

**Venom Status: BLOCKED** — V-01 and V-02 are release-blocking.

---

## Phase 3 — BLACKWIDOW (Adversarial)

**Standalone output:** `zNOTFORPRODUCTION/CURRENT/features/dashboard/evidence/blackwidow_reviews_module_2026-05-23.md`

### Confirmed Attack Chains

**BW-01 — Cross-Actor Review Injection (CRITICAL)**  
Any authenticated user can call `submitReview({ authorActorId: anyPublicActor })`. `isActorOwner` returns `true` for any non-void actor. Review is written attributed to an actor the attacker does not own.

**BW-02 — Cross-Actor Review Deletion (CRITICAL)**  
`listReviews` returns `author_actor_id` in every review row. Attacker passes `{ reviewId, authorActorId }` matching a real review. Controller passes both the ID match check AND the broken `isActorOwner` check. Review is deleted. **Any authenticated user can delete any review on the platform.**

**BW-03 — Dimension Rating Orphan Write (MEDIUM)**  
`dalUpsertDimensionRatings` has no ownership check. Exploitable after BW-01.

**BW-04 — Soft-Deleted Review Data Leak (LOW)**  
`dalGetReviewById` returns soft-deleted reviews (no `is_deleted` filter). Author identity data persists in snapshot columns after deletion.

**BlackWidow Status: BLOCKED** — BW-01 and BW-02 confirmed exploitable.

---

## Phase 4 — LOKI (Runtime)

**Standalone output:** `zNOTFORPRODUCTION/CURRENT/features/dashboard/evidence/loki_reviews_module_2026-05-23.md`

### Key Findings

- **L-01 PASS:** Setup call order correct — `main.jsx:22` before render
- **L-02 HIGH:** N+1 confirmed in `dalGetAuthorCardsForReviews` — 20 serial RPCs for limit=20 (1.6–2.4s wall time)
- **L-03 MEDIUM:** `isActorOwner` fires 2 serial async calls per write operation
- **L-04 LOW:** Author card errors silently swallowed — `null` returned per failed card with no surfacing
- **L-05 LOW:** No offline queue or retry for review write operations (iOS risk)

**Loki Status: REVIEW_PENDING**

---

## Phase 5 — KRAVEN (Performance)

**Standalone output:** `zNOTFORPRODUCTION/_ACTIVE/audits/performance/kraven_reviews_module_2026-05-23.md`

### Key Findings

**K-01 HIGH — N+1 in `dalGetAuthorCardsForReviews`:**  
`engines/reviews/src/dal/authors.read.dal.js:29-42` — sequential `for` loop, one RPC per reviewId.  
Fix A (no migration): Replace `for` loop with `Promise.all(reviewIds.map(...))` — drops wall time to 1 concurrent round.  
Fix B (optimal): Create batch RPC `get_review_author_cards(uuid[])` — requires Carnage migration.  
**Recommendation:** Ship Fix A immediately.

**K-02 MEDIUM:** `isActorOwner` adds ~160ms serial latency to every write. Session caching can reduce this.

**K-03 LOW:** `submitReview` makes 4–5 sequential calls post-upsert. Acceptable; DB change needed to reduce.

**Kraven Status: REVIEW_PENDING**

---

## Phase 6 — DB (Schema Inspection)

**No standalone file** (DB is inline evidence, no output path defined).

### Findings from Migration Audit

| Object | Status | Evidence |
|---|---|---|
| `GRANT USAGE ON SCHEMA reviews TO authenticated` | PRESENT | `20260503040334` |
| `GRANT SELECT ON reviews.review_dimensions TO authenticated` | PRESENT | `20260503040334` |
| `GRANT INSERT/UPDATE/DELETE ON reviews.reviews TO authenticated` | **NOT FOUND** | Not in any tracked migration |
| RLS policies on `reviews.reviews` | **NOT FOUND** | Not in any tracked migration |
| `vc.is_actor_owner()` CREATE FUNCTION | **NOT FOUND** | Called by hardening migration but never defined |
| `reviews.upsert_neutral_review` CREATE FUNCTION | **NOT FOUND** | Not in any tracked migration |
| `reviews.get_review_author_card` CREATE FUNCTION | **NOT FOUND** | Not in any tracked migration |
| `reviews.get_target_overall_stats` CREATE FUNCTION | **NOT FOUND** | Not in any tracked migration |

**DB Status: BLOCKED** — Multiple schema objects used by the reviews module are not in tracked migration history. This is a critical schema provenance gap. Requires Carnage to locate and track all untracked baseline SQL.

---

## Phase 7 — SENTRY (Architecture Compliance)

**Standalone output:** `zNOTFORPRODUCTION/CURRENT/features/dashboard/evidence/sentry_reviews_module_2026-05-23.md`

### Summary

All contract clauses PASS except one critical failure:

| Rule | Status |
|---|---|
| Actor-based identity (`actorId` + `kind`) | PASS |
| No `profileId` / `vportId` / raw `userId` on surfaces | PASS |
| Cross-feature access via adapters only | PASS |
| `@/...` imports only | PASS |
| No `select('*')` | PASS |
| Files < 300 lines | PASS |
| No TypeScript | PASS |
| **Owner verified through `actor_owners` (§1.4)** | **FAIL — BLOCKING** |

**Sentry Status: BLOCKED**

---

## Phase 8 — REVIEW-CONTRACT

**Standalone output:** `zNOTFORPRODUCTION/CURRENT/features/dashboard/evidence/review-contract_reviews_module_2026-05-23.md`

Contract §1.4 violated: "Owner always means Actor Owner — verified through `actor_owners`. There is no other ownership model."

`isActorOwner` in `setup.js` uses `vc.actors` — wrong table, wrong check.

All other contract clauses PASS.

**review-contract Status: BLOCKED**

---

## Phase 9 — LOGAN (Documentation)

**New doc created:** `zNOTFORPRODUCTION/_CANONICAL/logan/vcsm.reviews.engine-integration.md`

Documents:
- File map (VCSM + engine)
- Setup call order with line references
- DI contract (what's injected, what's broken, what's optional)
- Public engine surface listing
- Database schema and table operations
- Engine events
- Known issues (with required fix for `isActorOwner`)
- Audit trail with file paths

**Logan Status: COMPLETE** — doc created, marked DRAFT/BLOCKED pending isActorOwner fix.

---

## Final Command Status Table

| Command | Run | Status | Blocking |
|---|---|---|---|
| ARCHITECT | Phase 1 | ✅ PASS | No |
| Venom | Phase 2 | 🔴 BLOCKED | YES |
| BlackWidow | Phase 3 | 🔴 BLOCKED | YES |
| Loki | Phase 4 | 🟡 REVIEW_PENDING | No |
| Kraven | Phase 5 | 🟡 REVIEW_PENDING | No |
| DB | Phase 6 | 🔴 BLOCKED | YES |
| Sentry | Phase 7 | 🔴 BLOCKED | YES |
| review-contract | Phase 8 | 🔴 BLOCKED | YES |
| Logan | Phase 9 | ✅ COMPLETE | No |

---

## Open Risks

| ID | Risk | Severity |
|---|---|---|
| R-01 / V-01 / BW-01+02 | `isActorOwner` does not check `actor_owners` — actor impersonation fully exploitable | **BLOCKING** |
| R-02 / V-02 | `reviews.reviews` write grants, RLS, and all reviews RPCs not in tracked migrations | **BLOCKING** |
| R-03 / V-03 | DAL write calls have no author_actor_id guard | HIGH |
| R-04 / K-01 | N+1 in `dalGetAuthorCardsForReviews` — 20 serial RPCs for one page | HIGH |
| R-05 / V-04 | SECURITY DEFINER RPC bodies unauditable | MEDIUM |
| R-09 | Logan doc was missing (now created — DRAFT) | RESOLVED |
| R-12 | No offline queue for review writes | LOW |

---

## Fixed Risks

| ID | Risk | Resolution |
|---|---|---|
| R-06 | Stale claim: "No adapter" | VERIFIED accurate — intentional design, engine exposes own adapters |
| R-07 | Stale claim: setup call before render | VERIFIED correct — `main.jsx:22` < `createRoot:106` |
| R-08 | Stale claim: No DAL / model / controller / hooks / screens | VERIFIED correct — single `setup.js` only |
| R-09 | No Logan doc | CREATED: `logan/vcsm.reviews.engine-integration.md` |
| R-10 | No module owner | LOW — acknowledged; assign during Ironman pass |

---

## Required Next Command

**Carnage** — ✅ COMPLETE (see Phase 10 below)

**After Carnage migrations land + app code fix:** Re-run Venom → Sentry → review-contract → AvengersAssemble → Thor.

---

## Document Status

**BLOCKED**

This module cannot advance to VERIFIED or RELEASE_READY until:
1. `isActorOwner` in `setup.js` is rewritten to query `vc.actor_owners` (V-01 / R-01) — **Wolverine task**
2. Migrations A + B+C deployed and confirmed on live DB (V-02 / R-02) — **Carnage SQL proposals ready**
3. Live DB `pg_get_functiondef()` extracted for all untracked reviews RPCs (Migration D) — **DB task**
4. Venom, Sentry, and review-contract re-run after all fixes

---

---

# CARNAGE RUN — 2026-05-23

**Triggered by:** CEREBRO verification → Venom V-02 (schema provenance gap) → required next command  
**Scope:** VCSM  
**Output:** `zNOTFORPRODUCTION/_ACTIVE/audits/migrations/2026-05-23_carnage_reviews-schema-provenance-and-rls.md`

---

## Phase 10 — CARNAGE

**Standalone output:** `zNOTFORPRODUCTION/_ACTIVE/audits/migrations/2026-05-23_carnage_reviews-schema-provenance-and-rls.md`  
**SQL Proposals:**  
- `zNOTFORPRODUCTION/_ACTIVE/planning/carnage_migrations/reviews/A_track_vc_is_actor_owner.sql`  
- `zNOTFORPRODUCTION/_ACTIVE/planning/carnage_migrations/reviews/B_track_reviews_write_rls.sql`

### Provenance Gap Inventory (confirmed)

| Object | Tracked | Gap Type |
|---|---|---|
| `GRANT USAGE ON SCHEMA reviews TO authenticated` | ✅ | None |
| `GRANT SELECT ON reviews.reviews TO authenticated` | ✅ `20260503052543:62` | None |
| `GRANT SELECT ON reviews.review_dimension_ratings TO authenticated` | ✅ `20260503052543:63` | None |
| `reviews.review_dimensions` SELECT RLS + grants | ✅ | None |
| `GRANT INSERT/UPDATE ON reviews.reviews TO authenticated` | ❌ | Provenance gap |
| `GRANT INSERT/UPDATE/DELETE ON reviews.review_dimension_ratings` | ❌ | Provenance gap |
| `reviews.reviews` RLS ENABLE + SELECT + UPDATE policies | ❌ | **Security gap** |
| `reviews.review_dimension_ratings` RLS ENABLE + all write policies | ❌ | **Security gap** |
| `vc.is_actor_owner(uuid)` CREATE FUNCTION | ❌ | Provenance gap — live, referenced by 2 tracked functions |
| `reviews.upsert_neutral_review` CREATE FUNCTION | ❌ | Provenance gap — live RPC, body must be extracted from DB |
| `reviews.get_review_author_card` CREATE FUNCTION | ❌ | Provenance gap — live RPC |
| `reviews.get_target_overall_stats` CREATE FUNCTION | ❌ | Provenance gap — live RPC |
| `reviews.public_vport_review_summary_v` CREATE VIEW | ❌ | Provenance gap — referenced in tracked migrations |

### Migration Safety: CAUTION

All migrations are additive and idempotent — same pattern as `20260523010000_backfill_tracked_rls_coverage.sql`. No destructive changes. No data loss risk.

### Migration Plan (3 migrations + 1 code fix)

| Step | Migration | Safety | Status |
|---|---|---|---|
| A | `vc.is_actor_owner()` function tracking | LOW — CREATE OR REPLACE | ⚠️ Body must be confirmed via `pg_get_functiondef()` |
| B | `reviews.reviews` + `reviews.review_dimension_ratings` write grants + RLS | CAUTION — new enforcement | ⚠️ Must confirm live policy state first |
| C | Reviews RPCs tracking (D in CARNAGE report) | LOW — CREATE OR REPLACE | ❌ Bodies must be extracted from live DB — cannot reconstruct from source |
| App | Fix `setup.js` `isActorOwner` to query `actor_owners` | NONE (code change) | ❌ Wolverine task — parallel to DB migrations |

### Key Security Design (Migration B)

**`reviews.reviews` UPDATE policy** (enforces ownership for body-edit + soft-delete):
```sql
CREATE POLICY reviews_update_author ON reviews.reviews
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM vc.actor_owners ao
      WHERE ao.actor_id = reviews.author_actor_id
        AND ao.user_id  = auth.uid()
    )
  )
  WITH CHECK (same);
```

**`reviews.review_dimension_ratings` INSERT/UPDATE/DELETE policies** (indirect ownership via review join):
```sql
EXISTS (
  SELECT 1 FROM reviews.reviews r
  JOIN vc.actor_owners ao ON ao.actor_id = r.author_actor_id
  WHERE r.id = review_dimension_ratings.review_id
    AND ao.user_id = auth.uid()
)
```

These policies enforce what `isActorOwner` was supposed to enforce at the app layer — making them the **second line of defense** once deployed, even before the `setup.js` fix lands.

### Rollback

PARTIAL. GRANTs and policies are reversible via REVOKE + DROP POLICY. `vc.is_actor_owner()` cannot be dropped — it is a live dependency of two tracked functions. Migration B/C rollback would re-expose the write-path vulnerability.

### Required Before Deploy

1. Confirm `vc.is_actor_owner()` body via `SELECT pg_get_functiondef(oid) FROM pg_proc WHERE proname = 'is_actor_owner' AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'vc')`
2. Confirm live `reviews.reviews` policy state via `SELECT tablename, policyname, cmd FROM pg_policies WHERE schemaname = 'reviews'`
3. Extract all three reviews RPC definitions via `pg_get_functiondef()` for Migration C

**Carnage Status: CAUTION — SQL proposals ready, live DB verification required before deploy**

---

## Updated Command Status Table

| Command | Run | Status | Blocking |
|---|---|---|---|
| ARCHITECT | Phase 1 | ✅ PASS | No |
| Venom | Phase 2 | 🔴 BLOCKED | YES |
| BlackWidow | Phase 3 | 🔴 BLOCKED | YES |
| Loki | Phase 4 | 🟡 REVIEW_PENDING | No |
| Kraven | Phase 5 | 🟡 REVIEW_PENDING | No |
| DB | Phase 6 | 🔴 BLOCKED | YES |
| Sentry | Phase 7 | 🔴 BLOCKED | YES |
| review-contract | Phase 8 | 🔴 BLOCKED | YES |
| Logan | Phase 9 | ✅ COMPLETE | No |
| **Carnage** | **Phase 10** | **⚠️ CAUTION — proposals ready, live verification required** | No |

---

## Updated Open Risks

| ID | Risk | Severity | Status |
|---|---|---|---|
| R-01 / V-01 / BW-01+02 | `isActorOwner` does not check `actor_owners` — impersonation exploitable | **BLOCKING** | ⏳ Wolverine code fix required |
| R-02 / V-02 | Write grants + RLS not tracked | **BLOCKING** | ⏳ SQL proposals ready — live DB verify + deploy |
| R-03 / V-03 | DAL writes have no `author_actor_id` guard | HIGH | ⏳ DB RLS (Migration B) adds DB-level guard |
| R-04 / K-01 | N+1 — 20 serial RPCs per review page | HIGH | ⏳ Kraven Fix A (`Promise.all`) — code change only |
| R-05 / V-04 | Reviews RPC SQL bodies unauditable from source | MEDIUM | ⏳ Extract via `pg_get_functiondef()` |
| R-12 | No offline queue for review writes | LOW | Deferred |

## Updated Fixed Risks

| ID | Risk | Resolution |
|---|---|---|
| R-06 | Stale claim: "No adapter" | VERIFIED accurate |
| R-07 | Stale claim: setup call before render | VERIFIED correct |
| R-08 | Stale claim: No DAL/model/hooks/screens | VERIFIED correct |
| R-09 | No Logan doc | CREATED |
| R-10 | No module owner | LOW — deferred to Ironman |

## Required Next Steps (ordered)

1. **DB inspector** — run `pg_get_functiondef()` on live DB for `vc.is_actor_owner()` and all three reviews RPCs; confirm Migration A body accuracy
2. **DB inspector** — run `SELECT ... FROM pg_policies WHERE schemaname = 'reviews'` to confirm live RLS state before deploying Migration B
3. **Wolverine** — fix `setup.js` `isActorOwner` to query `vc.actor_owners` (code change, parallel to DB migrations)
4. **Deploy** — Migrations A → B+C together in one deploy window
5. **Venom re-run** — verify V-01 closed (app code fix) and V-02 closed (migration landed)
6. **Sentry + review-contract re-run** — confirm PASS
7. **AvengersAssemble → Thor** — release gate
