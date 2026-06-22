# VCSM Reviews — API Exposure Map

Scope: VCSM + ENGINE (reviews)
Scan Date: 2026-05-24
ARCHITECT Version: 26.14

---

## Summary

The reviews module has NO dedicated server-side API routes. All data access flows through:
1. Direct Supabase client calls (authenticated or anon, depending on path)
2. SECURITY DEFINER RPCs at the Supabase layer
3. Lazy-loaded React components (no SSR)

There are no Express routes, Next.js API routes, server actions, or Edge Functions
owned specifically by the reviews feature.

---

## Client-Side Data Access (Not REST APIs — Supabase Direct)

### Access Surface 1: Authenticated Read (Dashboard + Profile Tab)

```
Type: Direct Supabase client call (reviews schema)
Auth Requirement: Authenticated session (supabase.auth session)
Data Returned: Reviews list, dimension ratings, author cards, stats
Controllers: VportReviews.controller → engines/reviews
DAL: engines/reviews/src/dal/ (all DALs)
Tables: reviews.reviews, review_dimension_ratings, review_dimensions
RPCs: get_review_author_card (SECURITY DEFINER), get_target_overall_stats
External Services: NONE
Notes:
  - No app-layer auth middleware — relies on Supabase RLS
  - Protected by RLS on reviews.* tables
  - SECURITY DEFINER RPCs bypass RLS for private actor enrichment
```

### Access Surface 2: Authenticated Write (Submit / Delete)

```
Type: Direct Supabase client call via SECURITY DEFINER RPC
Auth Requirement: Authenticated session
Data Written: Review upsert (body + dimension ratings)
Controllers: VportReviews.controller → engines/reviews → submitReview / deleteReview
DAL: reviews.rpc.dal.js, dimensionRatings.write.dal.js, reviews.write.dal.js
RPCs: upsert_neutral_review (SECURITY DEFINER), reviews table soft-delete UPDATE
External Services: notifications engine (fire-and-forget after write)
Ownership Enforcement: DB-level via SECURITY DEFINER RPC (app-layer check is weak — see VENOM)
Notes:
  - No dedicated API route — all writes are direct Supabase client → RPC
  - Notification dispatch is async: publishVcsmNotification after review saved
  - No rate limiting visible at app layer — DB/Supabase infra must enforce
```

### Access Surface 3: Public Unauthenticated Read (Slug-based routes)

```
Type: Direct Supabase client call (anon or authenticated client)
Auth Requirement: NONE — public routes, unauthenticated access
Routes: /profile/:slug/reviews, /profile/:slug/reviews/qr
Data Returned: Public review summary + review list from public views
Controllers: getVportPublicReviewsController, getVportPublicReviewsPageController
DAL: readPublicVportReviewsDAL, readPublicVportReviewSummaryDAL, readPublicVportReviewDimensionsDAL
Views: reviews.public_vport_reviews_v, reviews.public_vport_review_summary_v
External Services: NONE
Notes:
  - Cache: 60s TTL on summary DAL; review list not cached
  - author_actor_id is exposed in public view (UUID — not human-readable)
  - No pagination rate limiting at app layer
```

---

## Supabase RPC Exposure

| RPC | Schema | SECURITY DEFINER | Caller | Auth Required | Data Returned |
|---|---|---|---|---|---|
| get_review_author_card | reviews | YES | dalGetAuthorCardsForReviews (engine) | Session (authenticated client) | actor_id, display_name, username, avatar_url |
| get_target_overall_stats | reviews | Unconfirmed | dalRpcGetTargetOverallStats (engine) | Session or anon — unconfirmed | review_count, overall_avg, p50, p90 |
| upsert_neutral_review | reviews | YES | dalRpcUpsertNeutralReview (engine) | Session required | review_id |

**VENOM Audit Required:**
- Confirm `get_review_author_card` only returns safe public display fields, no raw auth UUIDs
- Confirm `upsert_neutral_review` enforces `auth.uid()` → `actor_owners` before writing
- Confirm `get_target_overall_stats` RLS intent (open or restricted)
- Confirm all SECURITY DEFINER RPCs have correct SEARCH_PATH set to prevent injection

---

## Third-Party / External Services

| Service | Triggered By | Timing | Direction |
|---|---|---|---|
| Notifications engine | ctrlSubmitReview → publishVcsmNotification | After review saved | Fire-and-forget (async) |
| Supabase Realtime | Not wired in reviews module | — | Not connected |
| AWS S3 / media | Not used | — | Not applicable |

---

## Rate Limiting & Abuse Surface

| Surface | Rate Limit (app layer) | Rate Limit (DB/Supabase layer) | Risk |
|---|---|---|---|
| Review submission | NONE at app layer | Unconfirmed at DB layer | MEDIUM — one review per author/target enforced by upsert, but rapid attempts could stress DB |
| Review list reads | NONE | Supabase infra only | LOW — read-only |
| Author card RPC (N+1) | NONE | Per-call RPC overhead | HIGH — 25 RPCs per list load |
| Public review reads (anon) | NONE | Supabase infra only | LOW — views are read-only |
| Public summary reads | 60s TTL cache (app layer) | N/A | CLEAN — cache reduces DB load |

**Key risk:** The N+1 author card RPC pattern means a single user loading a vport's review
tab generates 25 DB round trips. Under concurrent load this amplifies significantly.
At 100 concurrent users loading the reviews tab = 2,500 RPC calls per batch cycle.

---

## Hidden Internal APIs

None detected. All data access is direct Supabase client.

---

## Over-Broad Payload Findings

| DAL | Returns | Over-Broad Risk |
|---|---|---|
| dalListReviewsByTarget | All 14 columns in REVIEW_COLUMNS | MEDIUM — includes snapshot columns for all actors even when author card RPC is also called. Redundant data. |
| readPublicVportReviewsDAL | 11 columns including author_actor_id | LOW — intentional for public display |

---

## Notification Emission on Write

```
Trigger: ctrlSubmitReview — after engineSubmitReview succeeds
Recipient: targetActorId (vport owner)
Kind: 'review_created'
Object: objectType='review', objectId=reviewId
Link: /actor/{targetActorId}/dashboard/reviews
Context: { overallRating, body preview (120 chars max) }
Fire-and-forget: publishVcsmNotification — no await in main submit path
Risk: LOW — if notification fails, review is already saved. No retry logic.
```
