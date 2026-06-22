---
title: Pipeline Module — Deferred Items
status: ACTIVE
feature: feed
module: pipeline
last-updated: 2026-06-05
---

# feed / modules / pipeline — DEFERRED

These items are tracked but deferred from the current release gate.
They do not block THOR once the 5 active blockers are resolved.

---

## DEFERRED-PIPE-001 — UUID Validation in hiddenPosts + viewerReactions DALs

**Finding:** VEN-PIPE-005 / BW-PIPE-007
**Severity:** MEDIUM (hiddenPosts) / MEDIUM (viewerReactions)
**Patch:** ELEK-PIPE-005 + ELEK-PIPE-006
**Priority:** P1

**Summary:**
`readHiddenPostsForViewer` and `readViewerReactionsBatch` both lack `isUuid()` validation
on their `viewerActorId` / `actorId` parameters. Contrast: `readFeedBlockRowsDAL` and
`readFeedFollowRowsDAL` already have `isUuid()` guards.

- hiddenPosts: non-UUID passes falsy check → DB error → silently returns empty Set → hidden posts unsuppressed
- viewerReactions: non-UUID passes falsy check → DB error → throws → pipeline may crash

**Patch complexity:** 1 import + 1 guard per file — 4 lines total across 2 files.

**Why deferred:** Not externally exploitable through normal UI flow. Internal misconfiguration risk only.

---

## DEFERRED-PIPE-002 — Stale Follow Cache After Unfollow

**Finding:** BW-PIPE-006 / VEN-PIPE-006 (unfollow path)
**Severity:** MEDIUM
**Patch:** ELEK-PIPE-004
**Priority:** P1

**Summary:**
`handleFollowActor` does not call `invalidateFeedFollowCache` or `fetchPosts` after an unfollow.
After unfollowing a private user, their posts remain visible until the 60s TTL expires.

**Patch complexity:** 1 import + 2 lines in `useCentralFeedActions.handleFollowActor`

**Why deferred:** Duration-bounded (60s max), no persistent exploit, no cross-user leakage.

---

## DEFERRED-PIPE-003 — Raw Actor UUID in VPORT Mention Routes

**Finding:** VEN-PIPE-004 / BW-PIPE-005
**Severity:** MEDIUM
**Patch:** ELEK-PIPE-007A + (future) ELEK-PIPE-007B
**Priority:** P2

**Summary:**
All VPORT actor mentions generate `/profile/{actorId}` routes (UUID) because:
1. `enrichMentionRows.model.js` explicitly sets `vport_id: null`
2. The `/vport/${vportId}` branch in `makeActorRoute` is dead code (vportId always null)
3. VPORT actor mentions fall to the actorId UUID fallback

Additionally: `handleOpenActorProfile` navigates to `/profile/${postActorId}` (raw UUID).
And: `handleShare` constructs share URLs with raw postId UUID.

**Patch complexity:** 4-line model fix (ELEK-PIPE-007A) + multi-file hook change for full fix.

**Why deferred:** No content leakage — actor enumeration risk only. Slug-based routing is a
platform-wide concern, not pipeline-specific. Recommend as a separate "slug enforcement" ticket.

---

## DEFERRED-PIPE-004 — @debuggers/feed Unconditional Production Import

**Finding:** VEN-PIPE-010 / SENTRY-PIPE-001
**Severity:** LOW
**Patch:** ELEK-PIPE-008 (partial fix — DEV guard on console.log)
**Priority:** P2

**Summary:**
`fetchFeedPage.pipeline.js:22` imports `@debuggers/feed/feedProfiler` unconditionally.
The import fires in production even though `wrapDAL` usage is gated to `import.meta.env.DEV`.
The debugger module is bundled in production but not called.

**Full fix:** Convert to dynamic import or extract DEV wrapper to separate file.
**Partial fix (ELEK-PIPE-008):** Adds DEV guard to console.log at line 136.

**Why deferred:** No production execution side effects. Bundle size impact only.

---

## DEFERRED-PIPE-005 — Dual Hook Architecture (useFeed + useCentralFeed)

**Finding:** SENTRY-PIPE-003
**Severity:** LOW (architecture concern)
**Priority:** P3

**Summary:**
Two hooks implement the same feed loading behavior:
- `useFeed.js`: manual state management, drain cap MAX_EMPTY_PAGES=3
- `useCentralFeed.js`: React Query, drain cap MAX_EMPTY_PAGES=2

Both are active with no deprecation signal. Security fixes applied to one must be mirrored
in the other. The DRAIN_CAP constants differ (3 vs 2).

**Recommendation:** Deprecate `useFeed.js` in favor of `useCentralFeed.js`.
Requires screen-by-screen migration audit first.

**Why deferred:** Architecture cleanup — does not affect security posture directly.
Recommend as a separate "legacy hook deprecation" ticket.

---

## DEFERRED-PIPE-006 — Full Follow Graph Unbounded Fetch

**Finding:** VEN-PIPE-007 / BW-PIPE-006 partial
**Severity:** MEDIUM
**Priority:** P1

**Summary:**
`readFeedFollowRowsDAL` fetches the viewer's ENTIRE follow graph on every cache miss,
not scoped to the current page's actor IDs. At scale (viewers following thousands of actors),
this query could be large.

**Risk:** DoS at scale (large follow count → large DB response). Not a privacy bypass.

**Why deferred:** No current scale concern; would require architectural change (page-scoped
follow lookup vs. full graph cache). Recommend as a separate performance ticket (KRAVEN scope).

---

## DEFERRED-PIPE-007 — Windows Path Comment in buildMentionMaps.model.js

**Finding:** SENTRY-PIPE-004
**Severity:** LOW (cosmetic)
**Priority:** P3

**File:** `apps/VCSM/src/features/feed/model/buildMentionMaps.model.js:1`
**Fix:** Remove line 1 (`// C:\Users\trest\OneDrive\Desktop\...`)

**Why deferred:** Cosmetic — no functional or security impact.

---

## Deferred Summary

| Item | Finding | Severity | Priority | Estimated Fix Size |
|---|---|---|---|---|
| DEFERRED-PIPE-001 | VEN-PIPE-005 | MEDIUM | P1 | 4 lines (2 files) |
| DEFERRED-PIPE-002 | BW-PIPE-006 | MEDIUM | P1 | 3 lines (1 file) |
| DEFERRED-PIPE-003 | VEN-PIPE-004 | MEDIUM | P2 | 4–20 lines (multi-file) |
| DEFERRED-PIPE-004 | VEN-PIPE-010 | LOW | P2 | Dynamic import refactor |
| DEFERRED-PIPE-005 | SENTRY-PIPE-003 | LOW | P3 | Multi-screen migration |
| DEFERRED-PIPE-006 | VEN-PIPE-007 | MEDIUM | P1 | Architecture change |
| DEFERRED-PIPE-007 | SENTRY-PIPE-004 | LOW | P3 | 1-line delete |
