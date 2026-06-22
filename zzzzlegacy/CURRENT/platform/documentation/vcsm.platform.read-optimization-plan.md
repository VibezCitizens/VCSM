# VCSM Platform — Read Optimization Plan

**Last updated:** April 12, 2026

## 1. Summary

Audit of 220 DAL files, 361 `.from()` reads, and 20+ RPC calls across the VCSM app. The codebase follows good practices (explicit column selection, no SELECT *, some parallelized reads) but has optimization opportunities in sequential reads, duplicate implementations, and missing caching.

## 2. Screens / Pipelines Reviewed

| Feature | DAL Files | Key Tables |
|---|---|---|
| Feed | feed.read.posts, feed.read.actorsBundle, fetchFeedPage.pipeline | posts, actors, profiles, blocks, follows |
| Profiles | readActorProfile, fetchPostsForActor, readActorPosts | actors, profiles, vports, actor_follows |
| VPORT | vport reviews, services, menu, gas prices, portfolio | vport_reviews, vport_services, vport_actor_menu_items |
| Chat | inbox, messages, conversations | chat.inbox_entries, chat.messages |
| Notifications | notifications.read | vc.notifications |
| Booking | bookings, availability, resources | vport.bookings, vport.availability_rules |
| Identity | identity.read, actorGetByProfile | actors, actor_owners, profiles |
| Legal | legalDocuments.read, userConsents.read | platform.legal_documents, platform.user_consents |
| Learning | courses, assignments, submissions, grades | learning.courses, learning.submissions |

## 3. Current Fetch Pattern by Feature

### Feed (GOOD)
- `fetchFeedPage.pipeline.js` uses `Promise.all` for 6 parallel reads
- `readActorsBundle` internally parallelizes profiles + vports + privacy
- Actor store (Zustand) deduplicates actor lookups
- Request versioning prevents stale races

### Profile Detail (NEEDS WORK)
- `fetchPostsForActor.dal.js` reads actor → profile → vport **sequentially** (3 roundtrips)
- Could parallelize profile + vport after initial actor read

### VPORT Reviews (NEEDS WORK)
- RPC calls (`get_vport_review_form_config`, `get_vport_official_stats`) on every detail view
- No caching — same data re-fetched on every tab switch

### Booking (NEEDS WORK)
- Availability rules re-fetched on every calendar render
- No dependency optimization in useEffect

### Learning (NEEDS WORK)
- Course + assignment reads on every screen mount
- No caching or TTL

## 4. Problems Found

### Duplicate Read Implementations

| Pattern | Files | Impact |
|---|---|---|
| "Get posts by actor" | 4 separate DAL files | Inconsistent columns, maintenance burden |
| "Get actor details" | 3+ implementations | Bypasses actor store, extra queries |
| "Actor cards batch" | 2 implementations | Duplicated RLS fallback logic |

### Sequential Reads (Should Be Parallel)

| File | Current | Improvement |
|---|---|---|
| `fetchPostsForActor.dal.js` | actor → profile → vport (3 sequential) | actor, then `Promise.all([profile, vport])` |
| Learning course detail | course → assignments (sequential) | `Promise.all([course, assignments])` |

### Re-fetch on Every Mount

| Feature | What re-fetches | Frequency |
|---|---|---|
| VPORT reviews | RPC stats + config | Every tab switch |
| Booking calendar | Availability rules + exceptions | Every render |
| Learning courses | Course + assignments | Every mount |
| VPORT public details | Full detail row | Every profile visit |

## 5. Quick Wins in App Code

**Priority 1 — Parallelize sequential reads (no DB changes needed):**
1. `fetchPostsForActor.dal.js` — `Promise.all([profileRead, vportRead])` after actor read
2. Learning course detail — `Promise.all([courseRead, assignmentsRead])`

**Priority 2 — Consolidate duplicate DALs:**
1. Merge 3 "posts by actor" DALs into 1 with optional params
2. Create single actor hydrator used by all features

**Priority 3 — Add useEffect dependency guards:**
1. Booking calendar — add proper deps to prevent re-render re-fetch
2. Learning screens — memoize or add dependency arrays

## 6. Query-Level Improvements (For Later)

| Improvement | Table | Benefit | Risk |
|---|---|---|---|
| Add `read_actor_with_details` RPC | actors + profiles + vports | 1 roundtrip instead of 3 | New function needed |
| Add composite index on `posts(actor_id, deleted_at, created_at)` | posts | Faster profile post loads | DB change required |
| Add `get_feed_page` RPC | posts + media + actors | Single query for feed | Complex, high risk |

## 7. DB-Level Improvements (Requires Approval)

These require explicit approval before implementation:

1. **Composite index** on `vc.posts(actor_id, deleted_at DESC, created_at DESC)` — speeds up profile post pagination
2. **Materialized view** for vport stats (review count, avg rating) — avoids per-request aggregation
3. **RPC consolidation** — combine `get_vport_review_form_config` + `get_vport_official_stats` into single call

## 8. Risks / Assumptions

- Parallelizing reads assumes no data dependency between them
- Consolidating DALs risks breaking features that rely on specific column selections
- Actor store cache must handle cache invalidation on actor switch
- Any DB index changes need migration planning

## 9. Recommended Implementation Order

| Phase | Work | Type | Risk |
|---|---|---|---|
| 1 | Parallelize `fetchPostsForActor` | App code | Low |
| 2 | Add useEffect dependency guards | App code | Low |
| 3 | Consolidate "posts by actor" DALs | App code | Medium |
| 4 | Create shared actor hydrator | App code | Medium |
| 5 | Add composite indexes (with approval) | DB | Low |
| 6 | Add consolidated RPCs (with approval) | DB | Medium |

## 10. Change Log

### 2026-04-10 04:45 AM
- Task: Phase 2 — Read-path review and optimization plan
- Summary: Audited 220 DAL files across VCSM. Found 4 duplicate read patterns, 2 sequential chains that should be parallel, 4 features with unnecessary re-fetches. Documented quick wins, query improvements, and DB-level changes.

### 2026-04-10 07:30 AM
- Task: Wire shared hydration store into Notifications, Inbox, Chat, and Profiles
- Code Status Before: MAJOR DRIFT — 3 of 5 surfaces bypassed the shared actor store entirely
- Summary: Connected the existing hydration engine (Zustand store with 5-min TTL) to the surfaces that were bypassing it.
  - `hydrateAndReturnSummaries` (engines/hydration) now checks store for fresh actors before fetching — returns cached data instantly, only fetches stale/missing IDs. Benefits Inbox + Chat automatically via DI.
  - Notifications sender DAL (`listActorSummaryRowsByIdsDAL`) now calls `hydrateAndReturnSummaries` instead of direct RPC — sender resolution goes through shared store.

### 2026-04-12 11:00
- Task: Full cache audit + ARCHITECT scan + feed profiler instrumentation
- Code Status Before: MINOR DRIFT (DAL count 220 → now 235+; new observability tooling not referenced)
- Summary: Three major deliverables produced that extend this optimization plan:

**1. Full Cache Audit** → `logan/architecture/cache-audit.md`
Comprehensive 7-section audit of every caching mechanism in the repo. Found 18 TTL cache instances, 1 Zustand store, 5 service worker buckets, 9+ localStorage keys, 3 hook-level maps. Key finding: feed is the highest-traffic path with ZERO DAL-level caching while profiles have 15+ caches.

**2. ARCHITECT Database Read Map** → `logan/architecture/database-read-map.md`
Mapped all 337 DAL files (engines: 70, VCSM: 187, Wentrex: 80). Indexed every table read, identified 4 duplicate read patterns, 3 N+1 risks. Feed pipeline traced: 7 DALs × ~10 tables per page × up to 3 pages = 30 uncached reads per feed load.

**3. Feed DAL Profiler** → `debuggers/feed/feedProfiler.js` + `FeedProfilerOverlay.jsx`
Instrumented the real feed pipeline with `wrapDAL()` on all 7 feed DALs. Shows per-feed-load: DAL call counts, table frequency, duplicates, N+1 suspects, serial vs parallel, timing waterfall. Visible via floating overlay in dev mode.

**Updated DAL count:** 235+ files with `.from()` calls in VCSM app (was 220 at time of original audit). 337 total DAL files across entire repo.

**Feed optimization priorities confirmed by audit (incoming task):**
1. Eliminate duplicate actor hydration (readActorsBundle + hydrateActorsByIds)
2. Add 30s TTL to readActorsBundle (cross-page dedup)
3. Add 60s TTL to readFeedBlockRowsDAL (session-stable)
4. Add 60s TTL to readFeedFollowRowsDAL (session-stable)
5. Add 60s TTL to readPostMediaMap (if low-risk)
  - Profile controller (`getProfileView`) now upserts actor summary into store after `read_actor_profile` returns — enriches cache for all other surfaces.
- Files Changed:
  - `engines/hydration/src/hydrate.js` — store-first check in hydrateAndReturnSummaries
  - `apps/VCSM/src/features/notifications/inbox/dal/senders.read.dal.js` — switched to hydration engine
  - `apps/VCSM/src/features/profiles/controller/getProfileView.controller.js` — upsert after profile fetch
- Validation:
  - Inbox → Chat: actor summaries reused from store (no re-fetch within 5min)
  - Feed → Notifications: shared actors resolved from store
  - Profile visit → any surface: actor enriched in store for later reuse
  - Null-overwrite safety: store uses safeMerge (never overwrites non-null with null)
  - Fallback tiers in notifications (Tier 2/3) still work for edge cases
- Surfaces now using shared hydration store:
  - Feed (was already wired)
  - Profile posts (was already wired)
  - Inbox (via DI — now store-aware)
  - Chat (via DI — now store-aware)
  - Notifications (newly wired)
  - Profile header (newly wired — write only)
- Surfaces still screen-specific:
  - Notifications Tier 2/3 fallback (actor_presentation + actors/profiles/vports)
  - Block status checks (independent, not actor data)
  - Profile `read_actor_profile` RPC (still primary source of truth)
