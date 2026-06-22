---
title: Feed Pipeline Module — CURRENT_STATUS (ARCHITECT Section)
status: SOURCE_VERIFIED
feature: feed
module: pipeline
command: ARCHITECT
run-date: 2026-06-05
confidence: HIGH
---

# Feed Pipeline Module — CURRENT_STATUS: ARCHITECT Section

---

## Module State

| Field | Value |
|---|---|
| Module | VCSM:feed / pipeline |
| Independence | MOSTLY INDEPENDENT |
| Completeness | MOSTLY COMPLETE |
| ARCHITECT Status | SOURCE_VERIFIED — 2026-06-05 |
| Prior Status | STUB (2026-06-05 seed) |

---

## Layer Inventory (Verified)

| Layer | Count | Status |
|---|---|---|
| DAL files | 10 | ALL READ-ONLY in pipeline core |
| Model files | 8 | Pure functions, verified |
| Pipeline orchestrator | 1 | fetchFeedPage.pipeline.js |
| Query functions | 1 | fetchCentralFeedPage.js |
| Hooks | 4 | useFeed.js (legacy), useCentralFeed.js (RQ), useCentralFeedActions.js, useFeedInfiniteScroll.js |
| Adapters | 2 | feedCache.adapter.js, adapters/hooks/useFeed.adapter.js |
| Controllers | 0 | Pipeline acts as coordinator — no separate controller layer |
| Services | 0 | Engine calls made directly from pipeline |
| Write surfaces | 0 | Pure read pipeline |

---

## Open Security Findings (Attributed to This Module)

| ID | Severity | Status | Surface | Summary |
|---|---|---|---|---|
| VEN-FEED-005 | HIGH | OPEN | dal/feed.read.actorsBundle.dal.js | vport.profiles owner-only RLS → null bundle → vport posts hidden in central feed |
| VEN-FEED-006 | MEDIUM | OPEN | pipeline/fetchFeedPage.pipeline.js (readFeedPostsPage call) | null realmId skips realm filter — all realms exposed |
| VEN-FEED-003 / BW-FEED-004 | MEDIUM | OPEN | dal/feed.read.debugPrivacyRows.dal.js | actorId passed as userId in debug path |
| BOUNDARY-PIPELINE-003 | HIGH | NEW | model/buildMentionMaps.model.js | Raw vportId in /vport/${vportId} mention route — violates platform URL contract |
| BOUNDARY-PIPELINE-004 | MEDIUM | NEW | dal/feed.read.hiddenPosts.dal.js + viewerReactions.dal.js | Missing UUID validation on viewerActorId / actorId |
| VEN-FEED-002 | LOW | OPEN | pipeline/fetchFeedPage.pipeline.js:137 | Unguarded console.log in production path |
| BW-FEED-006 | LOW | OPEN (PARTIAL) | block/follow cache | 60s stale cache window may produce incorrect visibility |

---

## Architecture Corrections vs Prior Stub

| Field | Prior Stub Claim | Corrected |
|---|---|---|
| engines/media usage | "readPostMediaMap from engines/media" | WRONG — readPostMediaMap is feed's own DAL (feed.read.media.dal.js) |
| 11 model files | "Confirm all 11 model file names" | WRONG — 8 model files confirmed |
| Pipeline DAL count | "9 parallel DAL calls" | CORRECT — 9 parallel + 1 conditional (mentions) |
| Cursor field | "created_at?" | CONFIRMED: created_at LT comparison |
| vport.profiles null | Unverified | CONFIRMED: null vportEntry → visible:false via feedRowVisibility model |

---

## Commands Run This Session

| Command | Status | Output |
|---|---|---|
| ARCHITECT | COMPLETE | `outputs/2026/06/05/ARCHITECT/vcsm.feed.pipeline.architecture.md` |
| VENOM | PENDING | — |
| LOGAN | PENDING | — |
| BLACKWIDOW | PENDING | — |
| ELEKTRA | PENDING | — |
| SPIDER-MAN | PENDING | — |
| SENTRY | PENDING | — |
| THOR | PENDING | — |

---

## P0 Blockers (Release-Blocking)

1. **Realm null guard** — VEN-FEED-006 OPEN; readFeedPostsPage has no viewerActorId or realmId guard at app layer
2. **Unguarded console.log** — pipeline line 137 fires in production
3. **Zero test coverage** — no regression suite for pipeline, visibility models, or normalization

---

## THOR Eligibility Forecast

```
THOR GATE FORECAST — feed/pipeline module

Security gate:     FAIL — 2 OPEN HIGH/MEDIUM findings (VEN-FEED-005, VEN-FEED-006) + 2 NEW findings
Test gate:         FAIL — zero tests
Documentation gate:WARN — BEHAVIOR.md STUB pending LOGAN
Architecture gate: WARN — dual hook paths, @debuggers unconditional import
Performance gate:  WARN — full follow graph cache, 9-DAL hot path, no LOKI/KRAVEN audit

Forecast: NOT THOR-ELIGIBLE until P0 blockers resolved
```
