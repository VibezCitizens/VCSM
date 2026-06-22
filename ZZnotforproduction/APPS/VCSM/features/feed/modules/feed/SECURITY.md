---
title: Feed Module — Security
status: ACTIVE
feature: feed
module: feed
source: venom-bw-derived + module-level-venom
created: 2026-06-05
updated: 2026-06-05
patch-run: 2026-06-05
source-path: apps/VCSM/src/features/feed/
---

# feed / modules / feed — SECURITY

## Status

ACTIVE. This file reflects the module-level VENOM run on 2026-06-05 covering all DALs,
controllers, hooks, pipeline, and models in `apps/VCSM/src/features/feed/`.

---

## Active Security Reviews

| Review | Run Date | Status | Report Path |
|---|---|---|---|
| VENOM (feature-level) | 2026-06-04 | COMPLETE | `features/feed/outputs/2026/06/04/Venom/` |
| BlackWidow | 2026-06-04 | COMPLETE | `features/feed/outputs/2026/06/04/BlackWidow/` |
| VENOM (pipeline module) | 2026-06-05 | COMPLETE | `modules/pipeline/outputs/2026/06/05/VENOM/` |
| VENOM (feed module) | 2026-06-05 | COMPLETE | `modules/feed/outputs/2026/06/05/VENOM/` |
| BlackWidow (feed module) | 2026-06-05 | COMPLETE | `modules/feed/outputs/2026/06/05/BLACKWIDOW/` |
| ELEKTRA | NEVER RUN | — | — |

---

## THOR BLOCKERS — OPEN

| Finding ID | Severity | Status | Surface | Description |
|---|---|---|---|---|
| VEN-PIPE-002 | HIGH | CONFIRMED SAFE (2026-06-05) | `feed.read.posts.dal.js:8-10` | Guard `if (!realmId) return empty` already present. `.eq("realm_id", realmId)` unconditional after guard. Source-verified — was not exploitable. Pending VENOM reverify. |
| VEN-PIPE-003 | HIGH | DEFERRED → DB/CARNAGE | `feed.read.actorsBundle.dal.js:84-89` | vport.profiles owner-only RLS — non-code fix required. Code-level TODO added at `useFeed.js:162`. Workaround: forced SECURITY DEFINER hydration via `hydrateActorsByIds({ force: true })` already in place. |

**Remaining THOR blockers: 1** — VEN-PIPE-003 (DB/CARNAGE required, not code-patchable in this ticket).
VEN-PIPE-002 is no longer a THOR blocker — source verification confirmed the guard was already present.

### BlackWidow Classification (2026-06-05)

| Finding ID | Classification | THOR Blocker |
|---|---|---|
| VEN-MOD-FEED-001 | EXPLOITABLE | NO |
| VEN-MOD-FEED-002 | EXPLOITABLE | NO |
| VEN-MOD-FEED-003 | EXPLOITABLE | NO |
| VEN-MOD-FEED-004 | EXPLOITABLE | NO |
| VEN-MOD-FEED-005 | REACHABLE | NO |
| VEN-MOD-FEED-006 | THEORETICAL | NO |
| VEN-MOD-FEED-007 | THEORETICAL | NO |
| VEN-MOD-FEED-008 | REACHABLE | NO |
| VEN-MOD-FEED-009 | THEORETICAL | NO |
| VEN-MOD-FEED-010 | THEORETICAL | NO |
| VEN-FEED-001 | REACHABLE | NO |
| VEN-PIPE-002 | EXPLOITABLE | YES |
| VEN-PIPE-003 | EXPLOITABLE | YES |
| VEN-FEED-003 | REACHABLE | NO |
| VEN-FEED-004 | REACHABLE | NO |
| VEN-PIPE-004 | EXPLOITABLE | NO |
| VEN-PIPE-005 | THEORETICAL | NO |
| VEN-PIPE-006 | REACHABLE | NO |
| VEN-PIPE-008 | EXPLOITABLE | NO |

EXPLOITABLE: 8 | REACHABLE: 6 | THEORETICAL: 5 | NOT_REACHABLE: 0 | THOR Blockers: 2

---

## Finding Inventory — All Open

### CRITICAL (0)

None.

### HIGH (3 open, 3 resolved)

| ID | Status | Surface | Description |
|---|---|---|---|
| VEN-FEED-001 | OPEN | `BEHAVIOR.md` | BEHAVIOR.md is a PLACEHOLDER — no §5 Security Rules or §9 Must Never Happen |
| VEN-PIPE-002 | CONFIRMED SAFE 2026-06-05 | `feed.read.posts.dal.js:8-10` | Guard already present — source-verified not exploitable. Pending VENOM-REVERIFY. |
| VEN-PIPE-003 | DEFERRED → DB/CARNAGE | `feed.read.actorsBundle.dal.js:84-89` | vport.profiles owner-only RLS — requires DB policy fix. TODO added `useFeed.js:162`. |
| VEN-MOD-FEED-001 | PATCHED 2026-06-05 | `useFeed.js:241` | `console.warn` wrapped in `import.meta.env.DEV` guard |
| VEN-MOD-FEED-002 | PATCHED 2026-06-05 | `useCentralFeedActions.js` | All 5 `console.warn/error` calls wrapped in `import.meta.env.DEV` guard |
| VEN-MOD-FEED-003 | PATCHED 2026-06-05 | `useCentralFeedActions.js:152` | Raw UUID navigation replaced — now resolves slug/username from post.actor; aborts if no safe route |

### MEDIUM (6 open, 3 resolved)

| ID | Status | Surface | Description |
|---|---|---|---|
| VEN-FEED-003 | OPEN | `getDebugPrivacyRows.controller.js:42` | actorId passed as userId to readOwnedActorIdsByUserIdDAL |
| VEN-FEED-004 | OPEN | `listActorPosts.controller.js:33-37` | viewerActorId accepted but discarded — RLS-only, no app-layer check |
| VEN-PIPE-004 | PATCHED 2026-06-05 | `buildMentionMaps.model.js` | `makeActorRoute` raw ID fallbacks removed — routes via slug/username only; falls back to `/feed` |
| VEN-PIPE-005 | CONFIRMED SAFE 2026-06-05 | `feed.read.hiddenPosts.dal.js:7`, `feed.read.viewerReactions.dal.js:15` | `isUuid` guard already present in both DALs — source-verified. Pending VENOM-REVERIFY. |
| VEN-PIPE-006 | CONFIRMED SAFE 2026-06-05 | `useCentralFeedActions.js:10,134,189` | `invalidateFeedBlockCache` and `invalidateFeedFollowCache` already imported and called correctly — source-verified. |
| VEN-PIPE-007 | OPEN | `feed.read.followRows.dal.js:29-34` | Full follow graph cached without size bound — scale risk |
| VEN-PIPE-008 | CONFIRMED SAFE 2026-06-05 | `fetchFeedPage.pipeline.js:129` | `safeMentionActorIds` filters blocked actors before `hydrateAndReturnSummaries` call — source-verified. |
| VEN-MOD-FEED-004 | OPEN | `useCentralFeedActions.js:239` | Raw UUID postId in share URL — deferred (no post slug exists in current source) |
| VEN-MOD-FEED-005 | PATCHED 2026-06-05 | `feed.posts.dal.js:12` | DEV-only guard added at function entry — returns `[]` in production |
| VEN-MOD-FEED-006 | OPEN | `feed.read.viewerContext.dal.js:17-28` | readProfileAdultFlagDAL has no ownership assertion — sensitive is_adult field |

### LOW (4 open)

| ID | Status | Surface | Description |
|---|---|---|---|
| VEN-PIPE-009 | OPEN | `fetchFeedPage.pipeline.js:136-140` | Dead debugPostId parameter — future logging hazard |
| VEN-PIPE-010 | OPEN | `fetchFeedPage.pipeline.js:22-23` | @debuggers/feed unconditional import — unconfirmed production bundle impact |
| VEN-MOD-FEED-007 | OPEN | `useFeedWelcomeCard.js:25-30` | localStorage dismiss state can be tampered — DB authoritative state overrideable |
| VEN-MOD-FEED-008 | OPEN | `feed.read.commentCounts.dal.js:20-25` | Unbounded comment row fetch for count — scale DoS risk on high-comment posts |

### INFO (2 open)

| ID | Status | Surface | Description |
|---|---|---|---|
| VEN-MOD-FEED-009 | OPEN | `useFeed.js`, `useFeed.adapter.js` | Legacy useFeed.js coexists with useCentralFeed.js — no decommission plan |
| VEN-MOD-FEED-010 | OPEN | `feed.read.viewerContext.dal.js:3-15` | vport_id in DAL return shape violates architecture contract |

---

## RLS Validation Status Per Table

| Table | RLS Status | Verified | Notes |
|---|---|---|---|
| vc.posts | ASSUMED (posts_select_actor_based) | PARTIAL — policy existence confirmed, content not audited | Sole auth layer for post fetch — no app-layer check |
| vc.actor_onboarding_steps | VERIFIED SAFE | YES (migration 20260518010000) | actor_owners ownership enforced on upsert |
| moderation.actions | VERIFIED SAFE | YES (migration 20260518020000) | actions_select_own_actor / actions_insert_own_actor confirmed |
| vc.actor_privacy_settings | UNVERIFIED | NO | RLS assumed; no migration audit |
| vc.actors | UNVERIFIED | NO | RLS assumed; no migration audit |
| vc.actor_follows | UNVERIFIED | NO | follower_actor_id filter in DAL; RLS assumed |
| vc.actor_owners | UNVERIFIED | NO | RLS assumed |
| moderation.blocks | UNVERIFIED | NO | RLS assumed |
| vport.profiles | OWNER-ONLY (confirmed by behavior) | YES (source-verified) | Non-owners get empty result — FINDING VEN-PIPE-003 |
| public.profiles | UNVERIFIED | NO | is_adult field sensitivity noted — FINDING VEN-MOD-FEED-006 |
| vc.post_media | UNVERIFIED | NO | Assumed post-public within pipeline scope |
| vc.post_comments | UNVERIFIED | NO | Counts-only; aggregate query |
| vc.post_reactions | UNVERIFIED | NO | Viewer-scoped by actorId filter in DAL |
| vc.post_rose_gifts | UNVERIFIED | NO | Aggregate counts only |
| vc.post_mentions | UNVERIFIED | NO | Post-scoped read |

---

## Write Surface Safety Status

| Surface | Table | Operation | App-Layer Ownership | RLS | Status |
|---|---|---|---|---|---|
| markWelcomeFeedCardSeenDAL | vc.actor_onboarding_steps | UPSERT | NONE — actorId null check only | VERIFIED (migration 20260518010000) | ACCEPTED — RLS verified sufficient |

---

## Ownership Enforcement Gaps

| Controller | Input | App-Layer Check | Gap | Finding |
|---|---|---|---|---|
| ctrlMarkWelcomeCardSeen | actorId | NONE | RLS-only protection | Accepted (RLS verified) |
| ctrlGetWelcomeCardVisible | actorId | NONE | Read-only; low risk | — |
| getFeedViewerIsAdult | viewerActorId | NONE | Caller-trusted; reads viewer's own data | VEN-MOD-FEED-006 (DAL layer) |
| listActorPosts | actorId + viewerActorId | NONE | viewerActorId discarded | VEN-FEED-004 |
| getDebugPrivacyRowsController | actorId | BROKEN (actorId used as userId) | Ownership detection always fails | VEN-FEED-003 |

---

## TODO

- [x] VEN-PIPE-002: CONFIRMED SAFE — guard already present in source (2026-06-05)
- [ ] VEN-PIPE-003: DEFERRED → DB/CARNAGE — replace direct vport.profiles SELECT with SECURITY DEFINER RPC (code TODO added `useFeed.js:162`)
- [x] VEN-MOD-FEED-001: PATCHED — DEV guard added to useFeed.js catch console.warn (2026-06-05)
- [x] VEN-MOD-FEED-002: PATCHED — DEV guards added to all 5 console.* in useCentralFeedActions.js (2026-06-05)
- [x] VEN-MOD-FEED-003: PATCHED — handleOpenActorProfile now resolves slug/username; aborts if unavailable (2026-06-05)
- [x] VEN-PIPE-004: PATCHED — makeActorRoute raw ID fallbacks removed (2026-06-05)
- [x] VEN-PIPE-005: CONFIRMED SAFE — isUuid already in both DALs (2026-06-05)
- [x] VEN-PIPE-006: CONFIRMED SAFE — cache invalidation already wired (2026-06-05)
- [x] VEN-PIPE-008: CONFIRMED SAFE — blocked actor filter already applied before hydrateAndReturnSummaries (2026-06-05)
- [x] VEN-MOD-FEED-005: PATCHED — DEV-only guard added at feed.posts.dal.js entry (2026-06-05)
- [ ] ARCHITECT-REVERIFY after patches
- [ ] VENOM-REVERIFY after patches
- [ ] BLACKWIDOW-REVERIFY after patches
- [ ] ELEKTRA-REVERIFY after patches
- [ ] SPIDER-MAN — add security regression tests
- [ ] DB/CARNAGE — vport.profiles RLS policy fix (VEN-PIPE-003)
- [ ] THOR — re-run after reverify completes
- [ ] Run DB to verify vc.posts RLS realm_id scope
- [ ] Record useFeed.js decommission decision (CAPTAIN)
