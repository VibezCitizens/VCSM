---
title: Pipeline Module — Ownership
status: ACTIVE
feature: feed
module: pipeline
last-updated: 2026-06-05
---

# feed / modules / pipeline — OWNERSHIP

---

## Module Owner

**App:** VCSM
**Feature:** feed
**Module:** pipeline
**Type:** Infrastructure — Pure Read Pipeline
**Owned by:** VCSM platform team

---

## Layer Ownership

| Layer | Files | Owner Notes |
|---|---|---|
| Pipeline Orchestrator | `pipeline/fetchFeedPage.pipeline.js` | Central coordination — changes require full VENOM + BLACKWIDOW review |
| Query Wrapper | `queries/fetchCentralFeedPage.js` | Drain loop + timeout — changes affect React Query behavior |
| DAL (10 files) | `dal/feed.read.*.dal.js`, `dal/feed.mentions.dal.js` | DB read surface — changes require VENOM review + RLS audit |
| Model (8 files) | `model/feedRowVisibility.model.js` (critical) | Visibility rules — changes require BLACKWIDOW verification |
| Hooks (4 files) | `hooks/useFeed.js`, `hooks/useCentralFeed.js` (primary), `hooks/useCentralFeedActions.js`, `hooks/useFeed.utils.js` | UI-facing contract — changes affect all feed consumers |
| Adapter | `adapters/feedCache.adapter.js` | Public cache invalidation surface — used by block/follow features |

---

## Engine Dependencies

| Engine | Usage | Ownership Model |
|---|---|---|
| engines/hydration | `hydrateAndReturnSummaries`, `hydrateActorsByIds` — mention enrichment + background actor hydration | Engine owned by hydration team; feed pipeline consumes via `@hydration` alias |

---

## External Service Dependencies

| Service | Schema | Table/View | Used By |
|---|---|---|---|
| Supabase (main) | `vc` | posts, actors, profiles, actor_follows, post_media, post_mentions, post_comments, post_reactions, post_rose_gifts | 9/10 DAL files |
| Supabase (main) | `moderation` | blocks, actions | blockRows DAL, hiddenPosts DAL |
| Supabase (vport client) | `vport` | profiles | actorsBundle DAL only |
| Zustand | — | actorStore | useFeed.js (actor store upsert) |
| React Query | — | QueryClient | useCentralFeed.js |

---

## Cross-Feature Adapter Consumers

The following features consume the feed pipeline's public adapter:

| Feature | Import | Usage |
|---|---|---|
| block | `@/features/feed/adapters/feedCache.adapter` | `invalidateFeedBlockCache` — should call after block DB write (ELEK-PIPE-001 open) |
| social/follow | `@/features/feed/adapters/feedCache.adapter` | `invalidateFeedFollowCache` — should call after unfollow (ELEK-PIPE-004 open) |
| Any feed consumer | `@/features/feed/adapters/feedCache.adapter` | `invalidateActorBundleEntry` — for actor profile updates |

---

## Command Ownership (SECURITY.md sections)

| Command | Section | Scope |
|---|---|---|
| VENOM | `## VENOM STATUS` | VEN-PIPE-001 through VEN-PIPE-010 |
| BLACKWIDOW | `## BLACKWIDOW STATUS` | BW-PIPE-001 through BW-PIPE-008 |
| ELEKTRA | `## ELEKTRA STATUS` | ELEK-PIPE-001 through ELEK-PIPE-008, DEFERRED-D001 |

No command may overwrite another command's section in SECURITY.md.
