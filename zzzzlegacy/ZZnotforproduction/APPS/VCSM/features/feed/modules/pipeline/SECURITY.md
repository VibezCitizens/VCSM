---
title: Pipeline Module — Security
status: ACTIVE
feature: feed
module: pipeline
source: module-level run
last-updated: 2026-06-05
---

# feed / modules / pipeline — SECURITY

Last Updated: 2026-06-05 (RE_VERIFY run)
Highest Open Severity: HIGH
THOR Release Blocker: YES — VEN-PIPE-003 / BW-PIPE-004 (DB change required — DEFERRED-D001; no code patch possible)
RE_VERIFY Status: COMPLETE — 6/6 patchable VENOM findings RESOLVED; 6/6 patchable BW exploit chains CLOSED

---

## VENOM STATUS
VENOM Last Run: 2026-06-05
VENOM Status: COMPLETE

Summary: 0 CRITICAL, 3 HIGH, 5 MEDIUM, 2 LOW (10 total findings)

| Finding ID | Severity | Status | Description |
|---|---|---|---|
| VEN-PIPE-001 | HIGH | OPEN | No app-layer auth in readFeedPostsPage — relies entirely on RLS |
| VEN-PIPE-002 | HIGH | PATCHED 2026-06-05 | null realmId bypasses realm filter — early return guard added; filter unconditional (ELEK-PIPE-002) |
| VEN-PIPE-003 | HIGH | OPEN — DB DEFERRED | vport.profiles owner-only RLS — vport posts invisible to non-owners (DEFERRED-D001) |
| VEN-PIPE-004 | MEDIUM | PATCHED 2026-06-05 | VPORT mention route now uses slug; no UUID fallback for vport kind (ELEK-PIPE-007A) |
| VEN-PIPE-005 | MEDIUM | PATCHED 2026-06-05 | isUuid guard added to hiddenPosts + viewerReactions DALs (ELEK-PIPE-005, ELEK-PIPE-006) |
| VEN-PIPE-006 | MEDIUM | PATCHED 2026-06-05 | Block action: invalidateFeedBlockCache before fetchPosts; unfollow: invalidateFeedFollowCache + fetchPosts (ELEK-PIPE-001, ELEK-PIPE-004) |
| VEN-PIPE-007 | MEDIUM | OPEN — DEFERRED | Full follow graph unbounded fetch — scale concern, no privacy bypass (DEFERRED-PIPE-006) |
| VEN-PIPE-008 | MEDIUM | PATCHED 2026-06-05 | safeMentionActorIds filters blockedActorSet before hydrateAndReturnSummaries (ELEK-PIPE-003) |
| VEN-PIPE-009 | LOW | PATCHED 2026-06-05 | console.log wrapped with import.meta.env.DEV guard (ELEK-PIPE-008) |
| VEN-PIPE-010 | LOW | OPEN — DEFERRED | @debuggers/feed unconditional import — bundle only, no production execution (DEFERRED-PIPE-004) |

Output: ZZnotforproduction/APPS/VCSM/features/feed/modules/pipeline/outputs/2026/06/05/VENOM/2026-06-05_venom_feed-pipeline-security-review.md

Prior feature-level findings (2026-06-04): VEN-FEED-001 through VEN-FEED-006 — see features/feed/SECURITY.md

---

## BLACKWIDOW STATUS
BLACKWIDOW Last Run: 2026-06-05
BLACKWIDOW Status: COMPLETE

Summary: 0 CRITICAL, 4 HIGH, 4 MEDIUM, 1 LOW (8 total findings)

| Finding ID | Severity | Result | VENOM Ref | Description |
|---|---|---|---|---|
| BW-PIPE-001 | HIGH | PATCHED 2026-06-05 | VEN-PIPE-006 | Block → fetchPosts(true) with stale blockCache — fixed: invalidateFeedBlockCache(actorId) now called before fetchPosts(true) |
| BW-PIPE-002 | HIGH | PATCHED 2026-06-05 | VEN-PIPE-008 | Blocked actor in mention hydration — fixed: safeMentionActorIds filters blockedActorSet |
| BW-PIPE-003 | HIGH | PATCHED 2026-06-05 | VEN-PIPE-002 | null realmId all-realm exposure — fixed: early return guard in readFeedPostsPage |
| BW-PIPE-004 | HIGH | OPEN — DB DEFERRED | VEN-PIPE-003 | VPORT posts invisible to non-owners — DB RLS policy change required (DEFERRED-D001) |
| BW-PIPE-005 | MEDIUM | PATCHED 2026-06-05 | VEN-PIPE-004 | VPORT mention UUID fallback — fixed: makeActorRoute uses slug, no actorId for vport kind |
| BW-PIPE-006 | MEDIUM | PATCHED 2026-06-05 | VEN-PIPE-006 | Stale follow cache after unfollow — fixed: invalidateFeedFollowCache + fetchPosts(true) on unfollow |
| BW-PIPE-007 | MEDIUM | PATCHED 2026-06-05 | VEN-PIPE-005 | Missing isUuid in hiddenPosts + viewerReactions — fixed: isUuid guard added to both DALs |
| BW-PIPE-008 | LOW | OPEN — DEFERRED | NEW | viewerActorId not session-bound — internal concern, acceptable risk (DEFERRED-PIPE-ARCH) |

Output: ZZnotforproduction/APPS/VCSM/features/feed/modules/pipeline/outputs/2026/06/05/BLACKWIDOW/2026-06-05_blackwidow_feed-pipeline-adversarial-review.md

Prior feature-level BW run (2026-06-04): see features/feed/SECURITY.md (BW-FEED-001 through BW-FEED-008)

---

## ELEKTRA STATUS
ELEKTRA Last Run: 2026-06-05
ELEKTRA Status: COMPLETE

Patches Proposed: 8 code patches + 1 DB deferral
Patches Applied: 7 code patches (2026-06-05) — ELEK-PIPE-001 through ELEK-PIPE-008 (all except DEFERRED-D001)

| Patch ID | Status | Applied |
|---|---|---|
| ELEK-PIPE-001 | APPLIED | 2026-06-05 — invalidateFeedBlockCache before fetchPosts in handleBlockActor |
| ELEK-PIPE-002 | APPLIED | 2026-06-05 — null realmId early return in readFeedPostsPage |
| ELEK-PIPE-003 | APPLIED | 2026-06-05 — safeMentionActorIds filters blockedActorSet |
| ELEK-PIPE-004 | APPLIED | 2026-06-05 — invalidateFeedFollowCache + fetchPosts on unfollow |
| ELEK-PIPE-005 | APPLIED | 2026-06-05 — isUuid guard in readHiddenPostsForViewer |
| ELEK-PIPE-006 | APPLIED | 2026-06-05 — isUuid guard in readViewerReactionsBatch |
| ELEK-PIPE-007A | APPLIED | 2026-06-05 — makeActorRoute uses slug for vport kind; no UUID fallback |
| ELEK-PIPE-008 | APPLIED | 2026-06-05 — console.log wrapped with import.meta.env.DEV |
| DEFERRED-D001 | DEFERRED | vport.profiles RLS — DB policy change required, not a code fix |

Output: ZZnotforproduction/APPS/VCSM/features/feed/modules/pipeline/outputs/2026/06/05/ELEKTRA/2026-06-05_elektra_feed-pipeline-patch-proposals.md

---

## RE_VERIFY STATUS
RE_VERIFY Last Run: 2026-06-05
RE_VERIFY Status: COMPLETE

VENOM-REVERIFY: 6 RESOLVED, 4 OPEN/DEFERRED
BLACKWIDOW-REVERIFY: 6 EXPLOIT CHAINS CLOSED, 2 OPEN/DEFERRED

Bonus finding confirmed: `handleOpenActorProfile` linter fix closes BW-PIPE-005 at navigation actions layer (beyond ELEK-PIPE-007A scope).

VENOM re-verify output: outputs/2026/06/05/REVERIFY/2026-06-05_venom_reverify_feed-pipeline.md
BLACKWIDOW re-verify output: outputs/2026/06/05/REVERIFY/2026-06-05_blackwidow_reverify_feed-pipeline.md

