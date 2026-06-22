# Reviews Engine — Contract

## Status

- **Owner:** Platform
- **Consumers:** VCSM (future: Wentrex)
- **Schema:** `reviews.*`

## Purpose

The reviews engine provides app-agnostic review management for actor-to-actor reviews with multi-dimensional ratings, revision history, and aggregate statistics.

## What This Engine Does

- Manages review CRUD (create, update, soft-delete) via neutral review mode
- Resolves review dimensions per target kind/subtype
- Stores per-dimension ratings with weighted overall calculation (DB trigger)
- Provides aggregate stats (avg, p50, p90) for review targets
- Maintains immutable revision history
- Enriches review cards with author/target snapshot data (DB trigger)
- Enforces cooldown rules (24h neutral review create cooldown, DB trigger)

## What This Engine Does NOT Do

- Does NOT render UI components (app responsibility)
- Does NOT manage React hooks or state (app responsibility)
- Does NOT query outside `reviews.*` schema
- Does NOT handle transactional/verified review workflows (reserved for future)
- Does NOT manage review moderation (separate concern)
- Does NOT handle file uploads or media attachments

## Public API

### Configuration

- `configureReviewsEngine({ supabaseClient, isActorOwner, resolveActorCard?, debugReporter? })`

### Controllers

- `getReviewFormConfig({ targetKind, targetSubtype })` — active dimensions for a target type
- `submitReview({ targetActorId, authorActorId, body, ratings? })` — create or update neutral review
- `deleteReview({ reviewId, authorActorId })` — soft-delete author-owned review
- `listReviews({ targetActorId, cursor?, limit? })` — paginated review list with ratings
- `getMyActiveReview({ targetActorId, authorActorId })` — current user's active review
- `getTargetStats({ targetActorId })` — aggregate stats via RPC

### Events

- `REVIEW_CREATED` — after new review insert
- `REVIEW_UPDATED` — after review body/ratings update
- `REVIEW_DELETED` — after soft-delete
- `RATINGS_UPSERTED` — after dimension ratings upsert
- `STATS_REQUESTED` — after stats fetch

### Models

- `ReviewModel`, `DimensionModel`, `DimensionRatingModel`, `AuthorCardModel`, `TargetStatsModel`

## Database Schema

### Owned Tables

- `reviews.review_dimensions`
- `reviews.reviews`
- `reviews.review_dimension_ratings`
- `reviews.review_revisions`

### Owned Functions (RPC)

- `reviews.upsert_neutral_review(uuid, uuid, text)` → uuid
- `reviews.get_review_author_card(uuid)` → table
- `reviews.get_target_overall_stats(uuid)` → table
- `reviews.recalc_review_overall_rating(uuid)` → void

### Schema Boundary

This engine ONLY queries `reviews.*`. Cross-schema resolution (actor validation, snapshot hydration) is handled by DB triggers with `SECURITY DEFINER`.

## Dependency Injection

| Key | Required | Purpose |
|-----|----------|---------|
| `supabaseClient` | Yes | Database client |
| `isActorOwner` | Yes | Verify caller owns the acting actor |
| `resolveActorCard` | No | App-specific actor card enrichment |
| `debugReporter` | No | Debug output sink |

## Forbidden Dependencies

- NEVER import from `apps/VCSM/` or `apps/wentrex/`
- NEVER import from other engines (`engines/identity/`, `engines/chat/`, etc.)
- NEVER query schemas other than `reviews.*`

## Change Policy

- Public API changes require contract update
- New RPC functions require schema documentation
- Breaking changes require consumer migration plan
