---
title: Feed Pipeline Module — VENOM Security Review
status: COMPLETE
feature: feed
module: pipeline
command: VENOM
run-date: 2026-06-05
findings: 0 CRITICAL | 3 HIGH | 5 MEDIUM | 2 LOW
thor-blocker: YES — VEN-PIPE-002, VEN-PIPE-003
---

# VENOM Security Review — Feed Pipeline Module
**Date:** 2026-06-05
**Scope:** `apps/VCSM/src/features/feed/pipeline/` + `dal/` + `model/`
**ARCHITECT Evidence:** `outputs/2026/06/05/ARCHITECT/vcsm.feed.pipeline.architecture.md`
**Prior Feature Run:** 2026-06-04 (VEN-FEED-001 through VEN-FEED-006)
**Finding ID Prefix:** VEN-PIPE- (module-scoped; prior feature findings referenced but not duplicated)

---

## Summary

| Severity | Count |
|---|---|
| CRITICAL | 0 |
| HIGH | 3 |
| MEDIUM | 5 |
| LOW | 2 |
| **TOTAL** | **10** |

**THOR Blocker:** YES — VEN-PIPE-002 (realm bypass), VEN-PIPE-003 (vport visibility failure)

**New findings not in prior 2026-06-04 feature run:**
- VEN-PIPE-004 — raw actorId UUID in mention route fallback
- VEN-PIPE-005 — inconsistent UUID validation in hiddenPosts + viewerReactions DALs
- VEN-PIPE-007 — uncapped full follow graph cache creates over-broad trust surface
- VEN-PIPE-008 — blocked actor presentations leaked via mention hydration fan-out
- VEN-PIPE-009 — 30s React Query staleTime creates second stale moderation window
- VEN-PIPE-010 — @debuggers/feed unconditional import in production pipeline

---

## ARCHITECT MAPPING GATE

ARCHITECT report present and verified: `outputs/2026/06/05/ARCHITECT/vcsm.feed.pipeline.architecture.md`
- 22 source files read and verified
- All 10 DAL files, 8 model files, 4 hooks, 2 adapters, 1 pipeline orchestrator confirmed
- Evidence confidence: HIGH
- Gate: PASS ✓

---

## Ownership Propagation Trace

```
viewerActorId flows as follows through the pipeline:

fetchFeedPagePipeline({ viewerActorId, ... })
  ├── readFeedPostsPage({ realmId, cursorCreatedAt, pageSize })
  │     ← viewerActorId NOT USED — posts fetched by realm+cursor only [HIGH RISK]
  ├── readHiddenPostsForViewer({ viewerActorId, postIds })
  │     ← viewerActorId passed, no UUID validation [MEDIUM RISK]
  ├── readActorsBundle(actorIds)
  │     ← no viewerActorId — fetches actor data for page actors only
  ├── readFeedBlockRowsDAL({ viewerActorId, actorIds })
  │     ← viewerActorId passed, UUID-validated ✓
  ├── readFeedFollowRowsDAL({ viewerActorId, actorIds })
  │     ← viewerActorId passed, UUID-validated ✓ (but full graph cached)
  ├── readCommentCountsBatch(pagePostIds)
  │     ← no viewerActorId — counts for all posts, no per-viewer auth
  ├── readViewerReactionsBatch({ postIds, actorId: viewerActorId })
  │     ← viewerActorId passed, no UUID validation [MEDIUM RISK]
  ├── readReactionCountsBatch(pagePostIds)
  │     ← no viewerActorId — aggregate counts, no per-viewer auth
  └── readPostMediaMap(pagePostIds)
        ← no viewerActorId — media is post-public within pipeline scope

Visibility enforcement: viewerActorId used correctly in normalizeFeedRows + models ✓
Actor upsert (hook layer): viewerActorId derived from caller — caller trust assumed [MEDIUM]
```

---

## Findings

---

### VEN-PIPE-001 — HIGH — No App-Layer Auth in Post Fetch

**VENOM SECURITY FINDING**
- **Finding ID:** VEN-PIPE-001
- **Location:** `apps/VCSM/src/features/feed/dal/feed.read.posts.dal.js` lines 3–53
- **Application Scope:** VCSM
- **Platform Surface:** PWA / Supabase Table/View (vc.posts)
- **Trust Boundary:** Authenticated Citizen
- **Boundary Violated:** Authenticated Citizen → Unauthenticated read of post corpus
- **Contract Violated:** Feed Publishing Contract / Actor Ownership Contract
- **Current behavior:** `readFeedPostsPage` receives `realmId`, `cursorCreatedAt`, and `pageSize` only. `viewerActorId` is not passed. The posts query has no per-viewer authorization check. Any caller with a valid realmId can retrieve any page of posts. Security depends entirely on Supabase RLS on `vc.posts`.
- **Risk:** If RLS on `vc.posts` is misconfigured or weakened (e.g., `{public}` grant added during migration), the entire post corpus for a realm becomes readable by any user — including private posts, posts from blocked accounts, and posts from deactivated actors. App-layer defense does not exist at the fetch stage.
- **Severity:** HIGH
- **Exploitability:** MEDIUM — requires understanding the pipeline call path; cannot be triggered from UI alone without also bypassing the hook layer
- **Attack Preconditions:**
  - Authenticated Citizen account
  - Direct call to `readFeedPostsPage` with any realmId
  - No ownership or session check at DAL layer
- **Blast Radius:** Feed-wide (all posts in a realm)
- **Identity Leak Type:** Actor correlation, ownership inference
- **Cache Trust Type:** None (posts query is uncached)
- **RLS Dependency:** REQUIRED — sole defense layer
- **Why it matters:** Defense-in-depth principle requires app-layer auth at every boundary. VEN-FEED-004 in the prior run identified the `listActorPosts` equivalent — this finding extends the pattern to the central feed path.
- **Recommended mitigation:** Add `eq("actor_id", viewerActorId)` OR a signed JWT claim assert at the DAL entry, OR document RLS policy by name and link it from this DAL as the explicit auth owner. The minimum acceptable state is documented RLS ownership with a VERIFIED policy audit.
- **Rationale:** The pipeline correctly passes `viewerActorId` to all other DALs that need it. The posts DAL is the only one that does not receive it — and it is the primary data source.
- **Follow-up command:** DB (verify `vc.posts` RLS policy), ELEKTRA (trace caller chain)
- **CISSP Domain:**
  - Primary: Access Control
  - Secondary: Security Architecture and Engineering

---

### VEN-PIPE-002 — HIGH — null realmId Bypasses Realm Filter (VEN-FEED-006 Confirmed + Upgraded)

**VENOM SECURITY FINDING**
- **Finding ID:** VEN-PIPE-002
- **Location:** `apps/VCSM/src/features/feed/dal/feed.read.posts.dal.js` lines 30–33
- **Application Scope:** VCSM
- **Platform Surface:** PWA / Supabase Table/View (vc.posts)
- **Trust Boundary:** Authenticated Citizen (partially onboarded)
- **Boundary Violated:** Realm isolation contract — inter-realm post visibility
- **Contract Violated:** Feed Publishing Contract
- **Current behavior:**
  ```js
  if (realmId) {
    q = q.eq("realm_id", realmId);
  }
  ```
  When `realmId` is `null` or `undefined`, the realm filter is skipped entirely. The query returns posts from ALL realms. The pipeline propagates realmId from the hook caller, which derives it from the viewer's identity context. Partially onboarded users who have not yet been assigned a realmId receive an unfiltered cross-realm post page.
- **Risk:** Future Void Realm (planned 18+ anonymous realm, per platform architecture) would be exposed to unverified users during the onboarding gap. Currently, all public realm posts are also visible which breaks realm segmentation. The null path is not documented as a deliberate design decision.
- **Severity:** HIGH (upgraded from prior LOW — Void Realm architecture makes this a pre-emptive CRITICAL guard)
- **Exploitability:** MEDIUM — user must be in the partial-onboarding state; not reproducible by an arbitrary authenticated user
- **Attack Preconditions:**
  - User is authenticated but has not completed onboarding realm assignment
  - OR: any caller that passes `realmId: null` to `fetchFeedPagePipeline`
- **Blast Radius:** Feed-wide — cross-realm post exposure for affected users
- **Identity Leak Type:** Resource enumeration (posts from wrong realm)
- **Cache Trust Type:** None
- **RLS Dependency:** ASSUMED — RLS may or may not segment by realm; unverified
- **Why it matters:** The Void Realm feature (18+ content, planned) depends on realm isolation being reliable. A null realmId bypass now means the segmentation gate will be broken at launch.
- **Recommended mitigation:**
  ```js
  // Require realmId — throw if absent rather than silently exposing all realms
  if (!realmId) throw new Error('[readFeedPostsPage] realmId is required');
  q = q.eq("realm_id", realmId);
  ```
  OR add a fallback default public realm ID constant if null is a valid "public realm" state.
- **Rationale:** Prior run (VEN-FEED-006) classified as LOW because Void Realm is not yet deployed. Platform architecture docs (memory) confirm Void Realm is in planning with realm isolation as a hard requirement. Upgrading to HIGH now prevents a silent breaking change at Void Realm launch.
- **Follow-up command:** ELEKTRA (add guard at pipeline entry), DB (verify vc.posts realm_id RLS)
- **CISSP Domain:**
  - Primary: Access Control
  - Secondary: Security Architecture and Engineering

---

### VEN-PIPE-003 — HIGH — vport.profiles Owner-Only RLS Nulls VPORT Bundle (VEN-FEED-005 Confirmed)

**VENOM SECURITY FINDING**
- **Finding ID:** VEN-PIPE-003
- **Location:** `apps/VCSM/src/features/feed/dal/feed.read.actorsBundle.dal.js` lines 84–89 (vportSchema query)
- **Application Scope:** VCSM
- **Platform Surface:** PWA / Supabase Table/View (vport.profiles) / Feed Engine
- **Trust Boundary:** Authenticated Citizen viewing VPORT-authored post
- **Boundary Violated:** Feed Publishing Contract — VPORT posts silently hidden from non-owners
- **Contract Violated:** Feed Publishing Contract / VPORT Lifecycle Contract
- **Current behavior:**
  ```js
  vportSchema
    .from("profiles")
    .select("actor_id, name, slug, avatar_url, is_active, is_deleted")
    .in("actor_id", actorIdsForVports)
  ```
  `vportSchema` uses a Supabase client bound to the `vport` schema with owner-only RLS on `profiles`. Non-owner viewers receive an empty result set. `vportMap` is empty for non-owned vport actors. In `feedRowVisibility.model.js`, a null `vportEntry` produces `visible:false, reason:'missing_vport_profile'`. VPORT posts are invisible in the central feed for all non-owner viewers.
- **Risk:** All VPORT-authored posts are invisible to other platform Citizens in the central feed. This is a complete visibility failure for the VPORT content publishing use case — VPORTs cannot reach their audience through the feed.
- **Severity:** HIGH — functional platform breakage, not just hardening
- **Exploitability:** HIGH — affects every non-owner viewer by default; reproducible with any authenticated account viewing the central feed
- **Attack Preconditions:** Authenticated Citizen (any account that is not the VPORT owner)
- **Blast Radius:** Feed-wide — all VPORT content invisible to all non-owners
- **Identity Leak Type:** None (opposite: content suppressed, not leaked)
- **Cache Trust Type:** Public-profile-sensitive (actor bundle cache serves stale null entries)
- **RLS Dependency:** REQUIRED — the RLS policy on vport.profiles is the direct cause
- **Why it matters:** VPORT posts are core platform content. If they are invisible in the central feed, the entire VPORT content publishing workflow is broken for the audience.
- **Recommended mitigation (two options):**
  1. **Policy fix (preferred):** Create a separate public-read policy on `vport.profiles` for the fields needed by the feed (`actor_id, name, slug, avatar_url, is_active, is_deleted`). Keep owner-only RLS on sensitive management fields in a separate select policy or view.
  2. **Service-role bypass (acceptable interim):** Use a Supabase service-role or SECURITY DEFINER RPC to fetch vport feed presentation data. The existing `vc.get_actor_summaries` RPC (SECURITY DEFINER) is already used in the hydration path — create an equivalent for feed bundle assembly.
- **Rationale:** Source-confirmed by tracing vportSchema client → vport.profiles → empty result → null vportEntry → feedRowVisibility.model.js → `missing_vport_profile` → `visible:false`.
- **Follow-up command:** DB (audit vport.profiles RLS policies), ELEKTRA (propose patch)
- **CISSP Domain:**
  - Primary: Access Control
  - Secondary: Software Development Security

---

### VEN-PIPE-004 — MEDIUM — Raw actorId UUID in Mention Route Fallback

**VENOM SECURITY FINDING**
- **Finding ID:** VEN-PIPE-004
- **Location:** `apps/VCSM/src/features/feed/model/buildMentionMaps.model.js` lines 3–7 (`makeActorRoute`)
- **Application Scope:** VCSM
- **Platform Surface:** PWA / Feed Engine
- **Trust Boundary:** Authenticated Citizen
- **Boundary Violated:** Public Identity Surface Contract
- **Contract Violated:** Public Identity Surface Contract (memory invariant: no raw UUIDs in public-facing URLs)
- **Current behavior:**
  ```js
  function makeActorRoute({ kind, username, actorId, vportId }) {
    if (kind === "user" && username) return `/u/${username}`;
    if (kind === "vport" && vportId) return `/vport/${vportId}`;
    if (actorId) return `/profile/${actorId}`;  // ← raw UUID fallback
    return "/feed";
  }
  ```
  - For VPORT actors in mentions: `enrichMentionRows.model.js` explicitly sets `vport_id: null` on all enriched rows. In `buildMentionMaps`, `vportId` is therefore always null. The `kind === "vport" && vportId` branch is never taken. VPORT mentions fall through to the `actorId` fallback → `/profile/{actorId}` with raw UUID.
  - For USER actors without a username: same fallback → `/profile/{actorId}` with raw UUID.
  - Note: `/vport/${vportId}` branch is dead code since `vport_id` is always null from enrichMentionRows.
- **Risk:** Internal actor UUIDs exposed in public-facing navigation routes generated by the feed pipeline. Platform invariant (memory: `feedback_no_raw_ids_in_urls`) is violated.
- **Severity:** MEDIUM
- **Exploitability:** MEDIUM — user must interact with a post containing a mention of a VPORT actor or a user without a username
- **Attack Preconditions:** Authenticated Citizen, post with mention of VPORT actor in feed
- **Blast Radius:** Single actor (per mention)
- **Identity Leak Type:** Internal UUID exposure, Actor correlation
- **Cache Trust Type:** None
- **RLS Dependency:** NONE
- **Why it matters:** Raw UUIDs in URLs enable actor enumeration and correlation. Platform contract explicitly bans this pattern.
- **Recommended mitigation:**
  ```js
  function makeActorRoute({ kind, username, actorId, vportId }) {
    if (kind === "user" && username) return `/u/${username}`;
    if (kind === "vport" && username) return `/vport/${username}`;  // use slug, not vportId
    return "/feed";  // no fallback to raw UUID — drop mention route if slug is missing
  }
  ```
  In `enrichMentionRows.model.js`, populate `slug` correctly from `p?.vport_slug`. Remove dead `/vport/${vportId}` branch. Never fall through to raw actorId.
- **Rationale:** Source-confirmed: `enrichMentionRows` sets `vport_id: null` → `buildMentionMaps` always uses actorId fallback for vport mentions. Also aligns with BW-FEED-007 (share URL with raw postId) — same UUID-in-URL pattern across the feed feature.
- **Follow-up command:** ELEKTRA (patch makeActorRoute and enrichMentionRows)
- **CISSP Domain:**
  - Primary: Software Development Security
  - Secondary: Information Security Governance

---

### VEN-PIPE-005 — MEDIUM — Missing UUID Validation in hiddenPosts and viewerReactions DALs

**VENOM SECURITY FINDING**
- **Finding ID:** VEN-PIPE-005
- **Location:**
  - `apps/VCSM/src/features/feed/dal/feed.read.hiddenPosts.dal.js` line 3 (function entry)
  - `apps/VCSM/src/features/feed/dal/feed.read.viewerReactions.dal.js` line 13 (function entry)
- **Application Scope:** VCSM
- **Platform Surface:** PWA / Supabase Table/View (moderation.actions, vc.post_reactions)
- **Trust Boundary:** Authenticated Citizen
- **Boundary Violated:** DAL input validation contract
- **Contract Violated:** Actor Ownership Contract
- **Current behavior:**
  - `readHiddenPostsForViewer({ viewerActorId, postIds })` — passes `viewerActorId` directly to `.eq("actor_id", viewerActorId)` with no UUID format check
  - `readViewerReactionsBatch({ postIds, actorId })` — passes `actorId` directly to `.eq("actor_id", actorId)` with no UUID format check
  - **Contrast:** `readFeedBlockRowsDAL` and `readFeedFollowRowsDAL` both use `isUuid(viewerActorId)` guard at function entry and return early if invalid
- **Risk:** A malformed `viewerActorId` (non-UUID string, empty string, SQL fragment) could produce unexpected DB behavior. The `.eq()` Supabase filter would pass the raw value to the PostgREST query string. While PostgREST parameterizes queries preventing SQL injection, malformed UUIDs could cause query errors, error message leakage, or unexpected null matches.
- **Severity:** MEDIUM
- **Exploitability:** LOW — actorId is derived from authenticated session context at hook layer; requires internal caller misconfiguration or hook bypass
- **Attack Preconditions:** Malformed actorId reaching the DAL (internal misconfiguration or test harness)
- **Blast Radius:** Single actor
- **Identity Leak Type:** None direct; possible error message exposure
- **Cache Trust Type:** None
- **RLS Dependency:** ASSUMED
- **Why it matters:** Inconsistent validation surface — two of four viewer-scoped DALs validate, two do not. Creates a brittle and inconsistent trust boundary that will silently drift over time.
- **Recommended mitigation:**
  ```js
  // In readHiddenPostsForViewer:
  import { isUuid } from "@/services/supabase/postgrestSafe";
  if (!viewerActorId || !isUuid(viewerActorId)) return new Set();

  // In readViewerReactionsBatch:
  if (!actorId || !isUuid(actorId)) return new Map();
  ```
- **Rationale:** Consistent with existing pattern in blockRows and followRows DALs.
- **Follow-up command:** ELEKTRA (add guards, matching existing DAL pattern)
- **CISSP Domain:**
  - Primary: Software Development Security
  - Secondary: Access Control

---

### VEN-PIPE-006 — MEDIUM — 60s Stale Block/Follow Cache Produces Incorrect Visibility (BW-FEED-006 Confirmed)

**VENOM SECURITY FINDING**
- **Finding ID:** VEN-PIPE-006
- **Location:**
  - `apps/VCSM/src/features/feed/dal/feed.read.blockRows.dal.js` line 5 (`createTTLCache(60_000)`)
  - `apps/VCSM/src/features/feed/dal/feed.read.followRows.dal.js` line 6 (`createTTLCache(60_000)`)
  - `apps/VCSM/src/features/feed/hooks/useCentralFeed.js` line 86 (`staleTime: 30_000`)
- **Application Scope:** VCSM
- **Platform Surface:** PWA / Feed Engine
- **Trust Boundary:** Authenticated Citizen
- **Boundary Violated:** Feed Publishing Contract / Moderation contract
- **Contract Violated:** Feed Publishing Contract
- **Current behavior:** Block and follow states are cached per-viewer for 60 seconds. After a viewer blocks an actor, the pipeline continues serving cached block rows for up to 60 additional seconds. The visibility model consumes stale block rows → blocked actor's posts remain visible for the TTL window. Additionally, `useCentralFeed` has a 30s React Query staleTime — this creates a second stale window where even a fresh pipeline call serves cached React Query data. Combined worst case: a viewer who blocks an actor while `useCentralFeed` is in stale window will continue to see blocked content for up to 90 seconds.
- **Risk:** After a moderation action (block, unfollow of private account), platform shows content the user has explicitly requested to suppress. Affects user trust and content moderation expectations.
- **Severity:** MEDIUM
- **Exploitability:** LOW — stale window is bounded; not exploitable by a third party
- **Attack Preconditions:** Viewer performs block/unfollow action; does not hard-refresh within TTL window
- **Blast Radius:** Single actor (per viewer)
- **Identity Leak Type:** None
- **Cache Trust Type:** Moderation-sensitive
- **RLS Dependency:** NONE (app-layer cache issue)
- **Why it matters:** A block action is a user-trust boundary event. Serving cached content after a block degrades platform trust and may expose users to content from actors they are trying to avoid.
- **Recommended mitigation:**
  1. **On block action:** call `invalidateFeedBlockCache(viewerActorId)` AND `queryClient.resetQueries({ queryKey: centralFeedKey })` to force immediate refresh
  2. **On unfollow:** call `invalidateFeedFollowCache(viewerActorId)` AND reset React Query
  3. Reduce block/follow cache TTL to 10–15s for safety, at minimal performance cost
- **Rationale:** Source-confirmed: both caches use 60s TTL. useCentralFeed staleTime is 30s. Cache invalidation functions exist (feedCache.adapter.js) but are not wired to block/follow action controllers.
- **Follow-up command:** WOLVERINE (wire invalidation to action controllers), DEADPOOL (confirm hook action paths)
- **CISSP Domain:**
  - Primary: Access Control
  - Secondary: Security Architecture and Engineering

---

### VEN-PIPE-007 — MEDIUM — Full Follow Graph Cache Creates Over-Broad Trust Surface

**VENOM SECURITY FINDING**
- **Finding ID:** VEN-PIPE-007
- **Location:** `apps/VCSM/src/features/feed/dal/feed.read.followRows.dal.js` lines 29–34
- **Application Scope:** VCSM
- **Platform Surface:** PWA / Supabase Table/View (vc.actor_follows) / Feed Engine
- **Trust Boundary:** Authenticated Citizen
- **Boundary Violated:** Data minimization principle
- **Contract Violated:** Actor Ownership Contract
- **Current behavior:**
  ```js
  // Fetch the full follow graph for this viewer — not scoped to the current page's actorIds.
  // Caching a page-scoped subset caused cache misses on every scroll page.
  const { data, error } = await supabase
    .schema("vc")
    .from("actor_follows")
    .select("follower_actor_id,followed_actor_id,is_active")
    .eq("follower_actor_id", viewerActorId)
    .eq("is_active", true);
  ```
  The entire follow graph for the viewer is fetched in one query, cached as a flat array keyed by viewerActorId, and filtered in-memory on subsequent calls. There is no size limit or pagination on this query.
- **Risk:**
  1. **Scale risk:** A user with 10,000 follows generates a 10,000-row result set on every first-page load. This data is held in memory for 60 seconds.
  2. **Trust surface over-fetch:** The follow cache includes ALL follows, not just those relevant to the current page. If the follow table is ever used for authorization purposes beyond feed visibility, the over-broad cache becomes a wider attack surface.
  3. **Stale on follow/unfollow:** The entire graph must be invalidated on any follow state change, not individual entries.
- **Severity:** MEDIUM
- **Exploitability:** LOW — requires the viewer to have a very large follow count
- **Attack Preconditions:** High-follow-count authenticated user
- **Blast Radius:** Single actor (performance impact), feed-wide (if cache persists stale state)
- **Identity Leak Type:** None
- **Cache Trust Type:** Moderation-sensitive
- **RLS Dependency:** ASSUMED (vc.actor_follows — viewer's own follows only via follower_actor_id filter)
- **Why it matters:** Unbounded cache entry sizes create memory pressure and a hard-to-predict security surface as the feature evolves.
- **Recommended mitigation:** Add a cap query: `SELECT COUNT(*) FROM vc.actor_follows WHERE follower_actor_id = viewer` before the full fetch. If count > threshold (e.g., 500), use a server-side RPC that returns only follows matching the current page's actorIds.
- **Rationale:** Source-confirmed: comment in source explicitly acknowledges this is intentional. Risk classified as medium because it degrades gracefully today but becomes a correctness and performance issue at scale.
- **Follow-up command:** KRAVEN (performance impact analysis at scale)
- **CISSP Domain:**
  - Primary: Software Development Security
  - Secondary: Security Architecture and Engineering

---

### VEN-PIPE-008 — MEDIUM — Blocked Actor Presentations Leaked via Mention Hydration Fan-Out

**VENOM SECURITY FINDING**
- **Finding ID:** VEN-PIPE-008
- **Location:** `apps/VCSM/src/features/feed/pipeline/fetchFeedPage.pipeline.js` lines 127–133
- **Application Scope:** VCSM
- **Platform Surface:** PWA / Feed Engine / Shared Engine (hydration)
- **Trust Boundary:** Authenticated Citizen
- **Boundary Violated:** Feed Publishing Contract
- **Contract Violated:** Feed Publishing Contract / Actor Ownership Contract
- **Current behavior:**
  ```js
  const mentionedActorIds = [...new Set(mentionEdges.map((e) => e.mentioned_actor_id).filter(Boolean))];
  const { rows: presentations, error: presErr } = await hydrateAndReturnSummaries({ actorIds: mentionedActorIds });
  enrichedMentionRows = enrichMentionRows(mentionEdges, presentations ?? []);
  ```
  Mention edges are fetched for all posts in the page. For posts authored by non-blocked actors that MENTION a blocked actor, the blocked actor's actorId appears in `mentionedActorIds`. `hydrateAndReturnSummaries` is called without a block-list filter. The blocked actor's `display_name`, `photo_url`, and `username` are returned and embedded in the post's `mentionMap`. The viewer receives presentation data for a blocked actor via the mention tooltip render path.
- **Risk:** A viewer who has blocked actor B can still see actor B's profile photo and display name if:
  1. Actor B is mentioned in a post authored by unblocked actor C
  2. That post is in the viewer's feed page
  The block filter (applied at the row/author level) does not extend to mentioned actors. Block does not suppress indirect identity exposure via mentions.
- **Severity:** MEDIUM
- **Exploitability:** MEDIUM — requires a blocked actor to be mentioned in a visible post; attacker (actor C) could deliberately mention the blocked actor to expose their presentation data
- **Attack Preconditions:**
  - Viewer has blocked actor B
  - A non-blocked actor mentions actor B in a post
  - That post is visible to the viewer
- **Blast Radius:** Single actor (per blocked actor in a mention)
- **Identity Leak Type:** Actor correlation, public-profile-sensitive
- **Cache Trust Type:** None
- **RLS Dependency:** NONE (hydration uses SECURITY DEFINER RPC — bypasses viewer's block state)
- **Why it matters:** Blocks are a user safety feature. Indirect exposure of blocked actor identity undermines the user's intent to limit contact with that actor.
- **Recommended mitigation:**
  ```js
  // Before hydrateAndReturnSummaries call:
  const mentionedActorIdsSafe = mentionedActorIds.filter(id => !blockedActorSet.has(id));
  const { rows: presentations } = await hydrateAndReturnSummaries({ actorIds: mentionedActorIdsSafe });
  ```
  Filter `mentionedActorIds` against the already-built `blockedActorSet` before calling hydration. This ensures blocked actors are not hydrated or included in the mention map.
- **Rationale:** The `blockedActorSet` is built before this code path runs (Phase 3 of pipeline). Filtering is a one-liner. The hydration engine call is already conditional.
- **Follow-up command:** ELEKTRA (add filter), BLACKWIDOW (adversarial verification)
- **CISSP Domain:**
  - Primary: Access Control
  - Secondary: Information Security Governance

---

### VEN-PIPE-009 — LOW — Unguarded console.log in Pipeline (VEN-FEED-002 Confirmed)

**VENOM SECURITY FINDING**
- **Finding ID:** VEN-PIPE-009
- **Location:** `apps/VCSM/src/features/feed/pipeline/fetchFeedPage.pipeline.js` lines 136–140
- **Application Scope:** VCSM
- **Platform Surface:** PWA / Feed Engine
- **Trust Boundary:** Authenticated Citizen
- **Boundary Violated:** Debug Leakage rule
- **Contract Violated:** None (low impact)
- **Current behavior:**
  ```js
  if (debugPostId && pagePostIds.includes(debugPostId)) {
    console.log("[useFeed][mentions][DBG] debugPostId is on this page", {
      debugPostId,
      pagePostIds,
    });
  }
  ```
  `debugPostId` is a named parameter of `fetchFeedPagePipeline`. It is not passed by any current caller (`useFeed.js`, `fetchCentralFeedPage.js`), so `debugPostId` is always `undefined` in production. The condition is always false. The log never fires.
  HOWEVER: `debugPostId` remains as a named, documented parameter — it is accessible to any future caller or test harness. The log is not wrapped in `import.meta.env.DEV`.
- **Risk:** LOW as-is (log never fires). Elevated to MEDIUM if any caller ever passes `debugPostId`. Logs `pagePostIds` — an array of post UUIDs for the current page.
- **Severity:** LOW
- **Exploitability:** LOW — current callers never pass debugPostId
- **Attack Preconditions:** A future caller passes `debugPostId` to the pipeline
- **Blast Radius:** Single session (browser console only, not network-transmitted)
- **Identity Leak Type:** Resource enumeration (post IDs)
- **Cache Trust Type:** None
- **RLS Dependency:** NONE
- **Why it matters:** The parameter is a maintenance trap. Any developer who adds `debugPostId` to a caller silently enables production logging of post IDs.

**DEBUG LEAKAGE WARNING**
- Location: `fetchFeedPage.pipeline.js:136`
- Current behavior: `console.log` fires when `debugPostId` matches a post ID in the current page
- Leak risk: post ID array logged to browser console
- Severity: LOW
- Recommended mitigation: Remove `debugPostId` parameter from `fetchFeedPagePipeline` signature entirely (no callers use it). If debug tracing is needed, gate behind `import.meta.env.DEV` and use the existing `wrapDAL`/`recordStep` profiler infrastructure.

- **Rationale:** Confirms VEN-FEED-002 from prior run. Source-verified: `debugPostId` is always undefined. Risk is LOW but the dead parameter is a future maintenance hazard.
- **Follow-up command:** ELEKTRA (remove dead parameter)
- **CISSP Domain:**
  - Primary: Software Development Security
  - Secondary: Security Operations

---

### VEN-PIPE-010 — LOW — @debuggers/feed Unconditional Import in Production Pipeline

**VENOM SECURITY FINDING**
- **Finding ID:** VEN-PIPE-010
- **Location:** `apps/VCSM/src/features/feed/pipeline/fetchFeedPage.pipeline.js` lines 22–23
- **Application Scope:** VCSM
- **Platform Surface:** PWA / Feed Engine
- **Trust Boundary:** Authenticated Citizen
- **Boundary Violated:** Debug Leakage rule
- **Contract Violated:** None
- **Current behavior:**
  ```js
  // DEV-ONLY: Wrap DALs with profiler instrumentation
  import { wrapDAL, recordStep } from "@debuggers/feed/feedProfiler";
  ```
  This import statement is unconditional — it runs in both development and production. The DAL wrapper assignments ARE conditionally guarded:
  ```js
  const readFeedPostsPage = import.meta.env.DEV
    ? wrapDAL("readFeedPostsPage", "vc.posts", _readFeedPostsPage)
    : _readFeedPostsPage;
  ```
  The import resolves at module load time regardless of environment. Whether Vite tree-shakes the `wrapDAL` / `recordStep` functions from the production bundle is unconfirmed.
- **Risk:** If tree-shaking does not eliminate the debugger import, the `@debuggers/feed` module is included in the production bundle. This may include:
  - Debug instrumentation code
  - Internal schema/table names (DAL label strings like `"vc.posts"`)
  - Profiling infrastructure
- **Severity:** LOW
- **Exploitability:** LOW — requires bundle inspection; no direct runtime risk
- **Attack Preconditions:** Access to production bundle (public)
- **Blast Radius:** Schema/table name exposure in minified bundle (information disclosure)
- **Identity Leak Type:** None
- **Cache Trust Type:** None
- **RLS Dependency:** NONE
- **Why it matters:** Production bundles should not include debug infrastructure. Even if dead code, label strings like `"vc.posts"` and `"moderation.blocks"` expose internal schema naming to bundle inspection.

**DEBUG LEAKAGE WARNING**
- Location: `fetchFeedPage.pipeline.js:22–23`
- Current behavior: `@debuggers/feed` imported unconditionally at module level
- Leak risk: Debugger module and schema name strings in production bundle (unconfirmed)
- Severity: LOW
- Recommended mitigation: Confirm Vite tree-shaking eliminates unused `wrapDAL`/`recordStep` in production. If not confirmed, move to dynamic import: `const { wrapDAL, recordStep } = import.meta.env.DEV ? await import("@debuggers/feed/feedProfiler") : { wrapDAL: null, recordStep: null }`.

- **Rationale:** The comment in the file says `DEV-ONLY` but the import is not conditional. Production safety depends entirely on Vite's tree-shaker.
- **Follow-up command:** LOKI (bundle audit), ELEKTRA (add DEV guard)
- **CISSP Domain:**
  - Primary: Software Development Security
  - Secondary: Security Operations

---

## Trust Boundary Summary

| Boundary | Status | Notes |
|---|---|---|
| Viewer identity → posts fetch | WEAK — RLS-only | VEN-PIPE-001 |
| Realm isolation | BROKEN for null realmId | VEN-PIPE-002 |
| VPORT content visibility | BROKEN — owner-only RLS | VEN-PIPE-003 |
| Mention actor identity | VIOLATED — raw UUID fallback | VEN-PIPE-004 |
| DAL input validation | INCONSISTENT | VEN-PIPE-005 |
| Block/follow moderation freshness | STALE — 60s + 30s windows | VEN-PIPE-006 |
| Follow graph scope | OVER-BROAD — unbounded fetch | VEN-PIPE-007 |
| Blocked actor mention reveal | BYPASSED — hydration ignores block set | VEN-PIPE-008 |
| Debug parameter safety | DEAD but hazardous | VEN-PIPE-009 |
| Production debugger bundle | UNCONFIRMED | VEN-PIPE-010 |

---

## Visibility Model Trust Verification

The block/follow/private visibility model chain is architecturally correct:

```
feedBlockVisibility.model.js   — bidirectional block check ✓
feedFollowVisibility.model.js  — is_active=true only ✓
feedPrivateVisibility.model.js — owner OR following required ✓
feedRowVisibility.model.js     — composite decision with reason code ✓
normalizeFeedRows.model.js     — filters by visibility.visible ✓
```

**No logic bypass identified in the model chain itself.**
The security risk is upstream (stale cache inputs) and downstream (mention hydration bypass for blocked actors).

---

## Identity Surface Warnings

**IDENTITY SURFACE WARNING**
- Location: `model/buildMentionMaps.model.js:makeActorRoute`
- Current identity surface: raw `actorId` (UUID) in `/profile/${actorId}` route
- Expected identity surface: human-readable slug or username
- Risk: UUID exposure in public-facing navigation targets
- Suggested correction: Use actor slug/username only; drop fallback to raw actorId

---

## RLS Dependency Map

| DAL | Table | RLS Dependency | Classification |
|---|---|---|---|
| feed.read.posts.dal.js | vc.posts | REQUIRED — sole defense | ASSUMED (unverified) |
| feed.read.actorsBundle.dal.js | vport.profiles | REQUIRED — currently owner-only | ASSUMED (unverified) — causing VEN-PIPE-003 |
| feed.read.blockRows.dal.js | moderation.blocks | REQUIRED | ASSUMED |
| feed.read.followRows.dal.js | vc.actor_follows | REQUIRED (follower_actor_id filter) | ASSUMED |
| feed.read.hiddenPosts.dal.js | moderation.actions | REQUIRED | ASSUMED |
| feed.read.media.dal.js | vc.post_media | NONE assumed | UNVERIFIED |
| feed.read.commentCounts.dal.js | vc.post_comments | NONE assumed | UNVERIFIED |
| feed.read.reactionCounts.dal.js | vc.post_reactions, post_rose_gifts | NONE assumed | UNVERIFIED |
| feed.read.viewerReactions.dal.js | vc.post_reactions | NONE assumed | UNVERIFIED |
| feed.mentions.dal.js | vc.post_mentions | NONE assumed | UNVERIFIED |

---

## Mitigation Plan

| Finding | Risk | Layer to Fix | Priority | Owner | Follow-up |
|---|---|---|---|---|---|
| VEN-PIPE-001 | No app-layer auth in post fetch | DAL / Documentation | P1 | DB / App | DB, ELEKTRA |
| VEN-PIPE-002 | null realmId realm bypass | DAL | P0 | App | ELEKTRA |
| VEN-PIPE-003 | vport.profiles RLS null bundle | RLS / DAL | P0 | DB | DB, ELEKTRA |
| VEN-PIPE-004 | Raw actorId UUID in mention route | Model | P1 | App | ELEKTRA |
| VEN-PIPE-005 | Missing UUID validation | DAL | P1 | App | ELEKTRA |
| VEN-PIPE-006 | 60s+30s stale moderation cache | Cache / Controller | P1 | App | WOLVERINE |
| VEN-PIPE-007 | Unbounded follow graph cache | DAL | P2 | App | KRAVEN |
| VEN-PIPE-008 | Blocked actor mention hydration | Pipeline | P1 | App | ELEKTRA, BW |
| VEN-PIPE-009 | Dead debugPostId parameter | Pipeline | P2 | App | ELEKTRA |
| VEN-PIPE-010 | Unconditional debugger import | Pipeline / Build | P2 | App | LOKI |

---

## CISSP Domain Summary

| Domain | Findings |
|---|---|
| Access Control | VEN-PIPE-001, VEN-PIPE-002, VEN-PIPE-003, VEN-PIPE-006, VEN-PIPE-007, VEN-PIPE-008 |
| Software Development Security | VEN-PIPE-001, VEN-PIPE-004, VEN-PIPE-005, VEN-PIPE-007, VEN-PIPE-009, VEN-PIPE-010 |
| Security Architecture and Engineering | VEN-PIPE-001, VEN-PIPE-002, VEN-PIPE-006, VEN-PIPE-007 |
| Information Security Governance | VEN-PIPE-004, VEN-PIPE-008 |
| Security Operations | VEN-PIPE-009, VEN-PIPE-010 |

**Uncovered domains this run:** Communications and Network Security, Cryptography, Physical Security, Identity and Access Management (covered at feature level in prior run).

---

## VENOM Completion Checklist

- [x] Loaded boundary isolation contract (ARCHITECT evidence)
- [x] Stayed read-only
- [x] Identified trust boundaries (10 boundaries mapped)
- [x] Traced auth and authorization (viewerActorId propagation fully traced)
- [x] Inspected identity surfaces (UUID fallback in mentions, actorId in routes)
- [x] Classified exploitability (all 10 findings)
- [x] Classified blast radius (all 10 findings)
- [x] Classified platform surface (all 10 findings)
- [x] Classified RLS dependency (all 10 DALs + 10 findings)
- [x] Mapped contract violations (all 10 findings)
- [x] Mapped CISSP domains (all 10 findings)
- [x] Included mitigation plan
- [x] Included CISSP summary
- [x] Stated uncovered domains
- [x] Persisted report to approved audit path ✓
- [ ] Write 2 — module SECURITY.md update (next step)
