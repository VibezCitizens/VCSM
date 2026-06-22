# VCSM — RPC Audit

> Verified against live DB: 2026-04-13
> Method: `supabase gen types --project-id nkdrjlmbtqbywhcthppm --schema <schema>`

---

## Status Legend

| Status | Meaning |
|--------|---------|
| ✅ ALIGNED | RPC exists in DB, called with correct schema |
| ⚠️ SCHEMA MISMATCH | RPC exists in DB but called without the correct schema prefix — runtime will fail if schema is not in PostgREST search_path |
| ❌ MISSING | RPC does not exist in any schema — will always return a DB error |
| 🔄 SUPERSEDED | RPC still works but a newer replacement exists in a migrated schema |

---

## 1. Missing RPCs (❌ — will always error)

These functions do not exist in any schema in the live DB.

| RPC Name | Called In | Impact |
|----------|-----------|--------|
| `delete_my_account` | `apps/VCSM/src/features/settings/account/dal/account.write.dal.js` | Account deletion is broken |
| `delete_my_vport` | `apps/VCSM/src/features/settings/account/dal/account.write.dal.js` | Vport deletion via RPC is broken |

**Resolution required:** Either implement these DB functions or rewrite the DALs to use direct table operations (soft-delete pattern).

---

## 2. Schema Mismatch RPCs (⚠️ — may fail if schema not in search_path)

These RPCs exist in the DB but in a non-`public` schema. The calling code uses `supabase.rpc(...)` without a schema prefix, which targets the PostgREST default schema (`public`). These calls succeed only if Supabase's `search_path` includes the target schema.

| RPC Name | DB Schema | Called In | Fix |
|----------|-----------|-----------|-----|
| `block_actor` | `moderation` | `apps/VCSM/src/features/block/dal/block.write.dal.js`<br>`apps/VCSM/src/features/settings/privacy/dal/blocks.dal.js` | `supabase.schema('moderation').rpc(...)` |
| `unblock_actor` | `moderation` | `apps/VCSM/src/features/block/dal/block.write.dal.js`<br>`apps/VCSM/src/features/settings/privacy/dal/blocks.dal.js` | `supabase.schema('moderation').rpc(...)` |
| `search_actor_directory` | `identity` | `apps/VCSM/src/features/explore/dal/search.data.js` | `supabase.schema('identity').rpc(...)` |
| `provision_vcsm_identity` | `platform` | `apps/VCSM/src/features/identity/dal/provision.rpc.dal.js` | `supabase.schema('platform').rpc(...)` |

**Note on `refresh_actor_directory_row`:** This is called correctly via `supabase.schema('identity').rpc(...)` in `refreshActorDirectory.dal.js`. ✅

---

## 3. Superseded RPCs (🔄 — old version still present but new engine version exists)

These RPCs still work but the canonical version has moved to the new `reviews` engine schema. Old versions in `vc` schema remain as compatibility bridges.

| Old RPC | Old Schema | New RPC | New Schema | Called In |
|---------|------------|---------|------------|-----------|
| `get_vport_official_stats` | `vc` | `get_target_overall_stats` | `reviews` | `vportReviews.read.dal.js` |
| `recalc_vport_review_overall_rating` | `vc` | `recalc_review_overall_rating` | `reviews` | (not called directly in frontend yet) |
| `get_review_author_card` | `vc` | `get_review_author_card` | `reviews` | `vportReviewAuthors.read.dal.js` (uses `vc` version via `vcClient.rpc()`) |

**Resolution:** Not urgent — `vc` versions still exist. Migrate to `reviews.*` versions in a future session once review engine migration is complete.

---

## 4. Aligned RPCs (✅ — correct schema, correct call)

| RPC Name | Schema | Called In |
|----------|--------|-----------|
| `create_vport` | `vport` | `vport.core.dal.js` via `vportSchema.rpc()` |
| `create_actor_for_user` | `vc` | `actorCreate.dal.js` |
| `provision_vcsm_identity` | `platform` | `provision.rpc.dal.js` — ⚠️ see section 2 |
| `refresh_actor_directory_row` | `identity` | `refreshActorDirectory.dal.js` via `supabase.schema('identity').rpc()` |
| `search_actor_directory` | `identity` | `search.data.js` — ⚠️ see section 2 |
| `get_friend_ranks` | `vc` | `friends.read.dal.js`, `friendRanks.reconcile.dal.js` |
| `save_friend_ranks` | `vc` | `friendRanks.write.dal.js`, `friendRanks.reconcile.dal.js` |
| `count_subscribers` | `vc` | `subscribersCount.dal.js` |
| `list_subscribers` | `vc` | `subscribersList.dal.js` |
| `read_actor_profile` | `vc` | `readActorProfile.dal.js` |
| `post_reactors_summary_one` | `public` | `postReactions.read.dal.js` |
| `generate_username` | `public` | `onboarding.dal.js` |
| `get_vport_review_form_config` | `vc` | `vportReviews.read.dal.js` via `vcClient.rpc()` |
| `get_vport_official_stats` | `vc` | `vportReviews.read.dal.js` via `vcClient.rpc()` — 🔄 see section 3 |
| `get_review_author_card` | `vc` | `vportReviewAuthors.read.dal.js` via `vcClient.rpc()` — 🔄 see section 3 |
| `get_vport_public_details` | `vport` | (edge function / external sites) |
| `get_vport_public_menu` | `vport` | (edge function / external sites) |

---

## 5. Priority Order

| Priority | Item | Effort |
|----------|------|--------|
| P0 | `delete_my_account` — implement or replace | Medium |
| P0 | `delete_my_vport` — implement or replace | Medium |
| P1 | `block_actor` / `unblock_actor` — add `moderation` schema prefix | Low |
| P1 | `search_actor_directory` — add `identity` schema prefix | Low |
| P1 | `provision_vcsm_identity` — add `platform` schema prefix | Low |
| P2 | Migrate `get_vport_official_stats` → `reviews.get_target_overall_stats` | Low |
| P2 | Migrate `recalc_vport_review_overall_rating` → `reviews.recalc_review_overall_rating` | Low |

---

## Change Log

### 2026-04-13

Task: Full RPC audit — live DB verification via supabase CLI gen types  
Code Status Before: Unknown — no prior audit existed  
Summary: Audited all 20 RPC calls in VCSM app against live DB. Found 2 missing, 4 schema mismatches, 3 superseded.  
Files Changed: This document created  
Validation: Verified via `supabase gen types` against project `nkdrjlmbtqbywhcthppm`
