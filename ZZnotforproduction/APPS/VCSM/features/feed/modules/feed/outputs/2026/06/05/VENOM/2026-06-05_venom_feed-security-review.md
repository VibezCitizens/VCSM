---
title: Feed Module — VENOM Security Review
status: COMPLETE
feature: feed
module: feed
command: VENOM
run-date: 2026-06-05
prior-run: 2026-06-04 (feature-level, 6 findings VEN-FEED-001 through VEN-FEED-006)
pipeline-run: 2026-06-05 (pipeline module, 10 findings VEN-PIPE-001 through VEN-PIPE-010)
findings: 0 CRITICAL | 3 HIGH | 4 MEDIUM | 2 LOW | 2 INFO
thor-blocker: NO (existing THOR blockers from prior runs persist — VEN-PIPE-002, VEN-PIPE-003)
---

# VENOM Security Review — Feed Module (feed/modules/feed)
**Date:** 2026-06-05
**Scope:** `apps/VCSM/src/features/feed/` (full module — 15 DALs, 4 controllers, pipeline, 3 hooks, models)
**ARCHITECT Evidence:** `modules/feed/outputs/2026/06/05/ARCHITECT/2026-06-05_architect_feed-module.md`
**Prior Runs:**
- 2026-06-04 feature-level VENOM: `features/feed/outputs/2026/06/04/Venom/2026-06-04_19-48_venom_feed-security-review.md`
- 2026-06-05 pipeline VENOM: `modules/pipeline/outputs/2026/06/05/VENOM/2026-06-05_venom_feed-pipeline-security-review.md`
**Finding ID Prefix:** VEN-MOD-FEED- (module-scoped; prior feature/pipeline findings cross-referenced)

---

## 1. Output Metadata

| Field | Value |
|---|---|
| Feature | feed |
| App | VCSM |
| Module | feed |
| Review Date | 2026-06-05 |
| Reviewer | VENOM V2 |
| Scanner Version | 1.1.0 |
| Output Path | `ZZnotforproduction/APPS/VCSM/features/feed/modules/feed/outputs/2026/06/05/VENOM/` |
| THOR Release Blocker | NO (new findings this run) — existing THOR blockers from prior pipeline run persist |
| Findings Summary | 0 CRITICAL, 3 HIGH, 4 MEDIUM, 2 LOW, 2 INFO |

---

## 2. Delta Summary — New Findings Since Last Run

The following findings are NEW in this run (not in 2026-06-04 feature-level or 2026-06-05 pipeline runs):

| ID | Severity | Title |
|---|---|---|
| VEN-MOD-FEED-001 | HIGH | `useFeed.js` Bare `console.warn` in Production Error Path |
| VEN-MOD-FEED-002 | HIGH | `useCentralFeedActions` — 5 Bare Console Calls in Production (No DEV Guard) |
| VEN-MOD-FEED-003 | HIGH | Raw Actor UUID in Public Profile Navigation Route (`handleOpenActorProfile`) |
| VEN-MOD-FEED-004 | MEDIUM | Share URL Constructed with Raw UUID `postId` (`handleShare`) |
| VEN-MOD-FEED-005 | MEDIUM | `feed.posts.dal.js` Legacy DAL — No Hidden-Post or Realm Filter |
| VEN-MOD-FEED-006 | MEDIUM | `feed.read.viewerContext.dal.js` — `readProfileAdultFlagDAL` Has No Ownership Assertion |
| VEN-MOD-FEED-007 | LOW | `useFeedWelcomeCard` — localStorage Dismiss State Can Be Tampered Per Actor |
| VEN-MOD-FEED-008 | LOW | `readCommentCountsBatch` — Unbounded In-Process Count Aggregation |
| VEN-MOD-FEED-009 | INFO | Legacy `useFeed.js` Hook Still Active — No Decommission Plan |
| VEN-MOD-FEED-010 | INFO | `readViewerActorIdentityDAL` — Exposes `vport_id` in Actor Identity Read |

The following findings from prior runs are **CARRIED FORWARD** (still open):

| Prior ID | Severity | Status | Description |
|---|---|---|---|
| VEN-FEED-001 | HIGH | OPEN | BEHAVIOR.md is PLACEHOLDER — no §5 or §9 |
| VEN-FEED-003 | MEDIUM | OPEN | actorId passed as userId in debug controller |
| VEN-FEED-004 | MEDIUM | OPEN | viewerActorId discarded in `listActorPosts.controller.js` |
| VEN-FEED-005 / VEN-PIPE-003 | HIGH | OPEN (THOR BLOCKER) | vport.profiles RLS nulls vport bundle |
| VEN-FEED-006 / VEN-PIPE-002 | HIGH | OPEN (THOR BLOCKER) | null realmId exposes all realms |
| VEN-PIPE-004 | MEDIUM | OPEN | Raw actorId UUID in mention route fallback |
| VEN-PIPE-005 | MEDIUM | OPEN | Missing UUID validation in hiddenPosts + viewerReactions DALs |
| VEN-PIPE-006 | MEDIUM | OPEN | 60s stale block/follow cache + 30s React Query staleTime |
| VEN-PIPE-008 | MEDIUM | OPEN | Blocked actor presentations leaked via mention hydration fan-out |

The following prior findings are **DOWNGRADED** (conditions confirmed safe):

| Prior ID | Prior Severity | New Status | Reason |
|---|---|---|---|
| VEN-FEED-002 / VEN-PIPE-009 | MEDIUM | DOWNGRADED to LOW | `debugPostId` verified never passed by any current caller; log never fires |

---

## 3. Source Verification Summary

All files in `apps/VCSM/src/features/feed/` read and verified. Source confidence: HIGH.

| Layer | Files Read | Notes |
|---|---|---|
| DALs | 15 files | All confirmed |
| Controllers | 4 files | All confirmed |
| Pipeline | 1 file | Confirmed |
| Query fn | 1 file | Confirmed |
| Hooks | 6 files | All confirmed |
| Models | 8 files | All confirmed |
| Screens | 3 files | All confirmed |
| Adapters | 2 files | All confirmed |

---

## 4. Findings — This Run

---

```
VENOM SECURITY FINDING
- Finding ID: VEN-MOD-FEED-001
- Location: apps/VCSM/src/features/feed/hooks/useFeed.js:241
- Application Scope: VCSM
- Platform Surface: PWA — feed hook (legacy manual-cursor)
- Trust Boundary: Authenticated viewer
- Boundary Violated: Debug leakage rule — no import.meta.env.DEV guard
- Contract Violated: VCSM debug logging rule (no bare console.* in production paths)
- Current behavior:
    catch (e) {
      console.warn("[useFeed] error", e);
      setHasMore(false);
      ...
    }
  This `console.warn` fires unconditionally in all environments (DEV and PROD)
  whenever the feed fetch pipeline throws. The caught error `e` is logged directly —
  this can include Supabase error details, stack traces, or internal server messages
  depending on what the error object contains.
- Risk: Any runtime error in the feed pipeline (including DB errors, network errors,
  RLS errors with message payloads) is logged to the browser console in production.
  Users with DevTools open can see internal error messages. This violates the debug
  logging rule and creates an information disclosure channel.
- Severity: HIGH
- Exploitability: LOW-MEDIUM — requires a feed error to occur AND the user to have
  DevTools open; error content determines actual disclosure severity
- Attack Preconditions: A feed pipeline error occurs in production; user has DevTools
- Blast Radius: Error message leakage (internal error details, schema hints from DB errors)
- Identity Leak Type: Potential server error message exposure
- Cache Trust Type: None
- RLS Dependency: NONE
- Why it matters: Internal error messages from Supabase can include table names, column
  names, and constraint names. Combined with the schema label strings already in the
  pipeline, this provides an information surface for targeted injection attempts.
- Recommended mitigation:
    if (import.meta.env.DEV) console.warn("[useFeed] error", e);
  Add DEV guard to match the pattern used by all other debug output in this file.
- Rationale: The useFeed.js file correctly guards all other debug output behind
  import.meta.env.DEV. This catch block was missed.
- Follow-up command: ELEKTRA (apply guard)
- Provenance: SOURCE_VERIFIED
- CISSP Domain:
  - Primary: Software Development Security
  - Secondary: Information and Asset Security
```

---

```
VENOM SECURITY FINDING
- Finding ID: VEN-MOD-FEED-002
- Location: apps/VCSM/src/features/feed/hooks/useCentralFeedActions.js:68,139,182,197,221
- Application Scope: VCSM
- Platform Surface: PWA — feed actions hook (canonical)
- Trust Boundary: Authenticated viewer performing feed actions
- Boundary Violated: Debug leakage rule — no import.meta.env.DEV guard on 5 console calls
- Contract Violated: VCSM debug logging rule
- Current behavior: Five bare console.* calls exist with no DEV guard:
    L68:  console.warn('[useCentralFeedActions] missing confirmAction; skipping confirm prompt', options)
    L139: console.error('[CentralFeed] subscribe failed:', err)
    L182: console.error('[CentralFeed] block failed:', err)
    L197: console.warn('[CentralFeed] persist hide threw:', error)
    L221: console.error('[CentralFeed] report submit failed:', err)
  These fire unconditionally in production. Lines 139, 182, 221 log raw error objects
  from failed Supabase mutations (subscribe/block/report). Lines 68 and 197 log internal
  state parameters that expose action payloads.
- Risk:
  1. Lines 139, 182, 221: Failed action errors can expose internal DB/RLS error messages,
     constraint names, and network payloads to any user with DevTools.
  2. Line 68: Logs `options` object — includes title, message, confirmLabel (low risk).
  3. Line 197: Logs error from persist-hide mutation — potential RLS error details.
  Collectively these establish a consistent production information disclosure surface
  across all feed mutation actions.
- Severity: HIGH
- Exploitability: MEDIUM — errors on mutation paths are reachable by forcing action
  failures (e.g., network throttle, invalid state); user must have DevTools open
- Attack Preconditions: Trigger a failed feed action (block, follow, report, hide);
  user must have DevTools open
- Blast Radius: Mutation error details (Supabase error messages, RLS constraint names)
- Identity Leak Type: Mutation error details, potential schema/constraint exposure
- Cache Trust Type: None
- RLS Dependency: NONE
- Why it matters: The actions hook is the canonical write surface for the central feed.
  Production error logging from mutation failures gives an adversary insight into
  Supabase table structure and RLS constraint names. This is especially relevant for
  the block action (line 182) — an adversary can provoke a block failure to observe
  the error structure.
- Recommended mitigation: Wrap all 5 console.* calls in import.meta.env.DEV guard.
  Production error UI should use the window.alert path already present in the same
  handlers — only the raw error object logged to console needs guarding.
- Rationale: The ARCHITECT context confirms these were previously identified
  (BW-FEED-008 class). This run confirms source-level presence of all 5 calls.
- Follow-up command: ELEKTRA (add DEV guards to all 5 locations)
- Provenance: SOURCE_VERIFIED
- CISSP Domain:
  - Primary: Software Development Security
  - Secondary: Information and Asset Security
```

---

```
VENOM SECURITY FINDING
- Finding ID: VEN-MOD-FEED-003
- Location: apps/VCSM/src/features/feed/hooks/useCentralFeedActions.js:152
- Application Scope: VCSM
- Platform Surface: PWA — feed actions hook, profile navigation
- Trust Boundary: Authenticated viewer
- Boundary Violated: Public Identity Surface Contract
- Contract Violated: Platform no-raw-IDs-in-URLs invariant (memory: feedback_no_raw_ids_in_urls)
- Current behavior:
    const handleOpenActorProfile = useCallback(() => {
      if (!postMenu?.postActorId) return
      closePostMenu()
      navigate(`/profile/${postMenu.postActorId}`)
    }, [postMenu, closePostMenu, navigate])
  `postMenu.postActorId` is a raw actor UUID (vc.actors.id). The navigation route
  `/profile/{actorId}` exposes the raw UUID in the browser URL bar and browser history.
- Risk: Raw actor UUIDs are exposed in public-facing navigation URLs via the "Open
  profile" action on any feed post menu. UUIDs are visible in the URL bar, browser
  history, and any analytics or logging that captures navigation events. This enables
  actor enumeration and correlation — an adversary who observes multiple profile
  navigations from the feed can build an actor ID map.
- Severity: HIGH
- Exploitability: HIGH — this is a standard user action triggered from any post menu;
  no special conditions required; any authenticated user can use this to extract UUIDs
- Attack Preconditions: Authenticated user; open post menu on any post; tap "Open profile"
- Blast Radius: Actor UUID exposure for any actor whose post appears in the viewer's feed
- Identity Leak Type: Internal UUID exposure, actor enumeration
- Cache Trust Type: None
- RLS Dependency: NONE
- Why it matters: The platform no-raw-IDs-in-URLs invariant exists precisely to prevent
  this class of actor enumeration. Feed post menus are triggered hundreds of times per
  session. This creates a systematic UUID extraction channel.
- Recommended mitigation: Replace navigate(`/profile/${postMenu.postActorId}`) with
  navigate(`/u/${resolvedUsername}`) or `/vport/${resolvedSlug}` depending on actor kind.
  The post object in the feed already carries actor.username and actor.vport_slug from
  normalizeFeedRows. Use those values instead of postActorId:
    const post = posts.find((p) => resolvePostActorId(p) === postMenu.postActorId)
    const route = post?.actor?.username
      ? `/u/${post.actor.username}`
      : post?.actor?.vport_slug
        ? `/vport/${post.actor.vport_slug}`
        : null
    if (!route) return  // no slug available — do not expose UUID
    navigate(route)
- Rationale: Related to BW-FEED-007 (share URL) and VEN-PIPE-004 (mention route).
  Three UUID-in-URL surfaces exist in the feed: share URL, mention route, and profile
  navigation. This finding covers the third surface not addressed by prior runs.
- Follow-up command: ELEKTRA (patch handleOpenActorProfile)
- Provenance: SOURCE_VERIFIED
- CISSP Domain:
  - Primary: Identity and Access Management
  - Secondary: Information and Asset Security
```

---

```
VENOM SECURITY FINDING
- Finding ID: VEN-MOD-FEED-004
- Location: apps/VCSM/src/features/feed/hooks/useCentralFeedActions.js:234-236
- Application Scope: VCSM
- Platform Surface: PWA — feed share action
- Trust Boundary: Authenticated viewer
- Boundary Violated: Public Identity Surface Contract
- Contract Violated: Platform no-raw-IDs-in-URLs invariant (memory: feedback_no_raw_ids_in_urls)
- Current behavior:
    const url = `${window.location.origin}/post/${postId}`
  `postId` is a raw post UUID passed directly from the feed post list. The share URL
  constructed here and exposed via Web Share API or ShareModal contains the raw UUID.
- Risk: The share URL with raw UUID is passed to Web Share API (shareNative) and
  displayed in ShareModal. When a user shares a post, they expose the internal post UUID
  in the shared URL. This violates the platform invariant and enables post enumeration
  by recipients.
- Severity: MEDIUM
- Exploitability: MEDIUM — requires a share action; the URL is then visible to anyone
  who receives the share
- Attack Preconditions: Authenticated user performs share action on any feed post
- Blast Radius: Post UUID exposure per shared post
- Identity Leak Type: Internal UUID exposure (post ID)
- Cache Trust Type: None
- RLS Dependency: NONE
- Why it matters: Post UUIDs in shared URLs enable post enumeration. Previously
  documented as BW-FEED-007. Confirmed in this source read at lines 234-236.
- Recommended mitigation: Replace raw postId with a post slug or short-id in the
  URL. If no slug exists, generate one and store it, or use a redirect service.
  Never expose the raw UUID in a shareable link.
- Rationale: BW-FEED-007 confirmed. This is the same pattern as VEN-MOD-FEED-003
  (profile navigation) and VEN-PIPE-004 (mention route). All three require the same
  fix: use human-readable identifiers in public URLs.
- Follow-up command: ELEKTRA (patch share URL construction)
- Provenance: SOURCE_VERIFIED
- CISSP Domain:
  - Primary: Information and Asset Security
  - Secondary: Software Development Security
```

---

```
VENOM SECURITY FINDING
- Finding ID: VEN-MOD-FEED-005
- Location: apps/VCSM/src/features/feed/dal/feed.posts.dal.js:11-53
- Application Scope: VCSM
- Platform Surface: PWA — legacy diagnostics DAL
- Trust Boundary: Authenticated viewer (diagnostics groups)
- Boundary Violated: Hidden post filter, realm isolation
- Contract Violated: Feed visibility contract
- Current behavior: `listFeedPosts({ limit = 20 } = {})` in feed.posts.dal.js fetches
  vc.posts with:
    - No realm_id filter (returns posts from ALL realms)
    - No deleted_at filter for media (but posts-level is filtered)
    - No hidden post exclusion
    - No block/follow visibility enforcement (no viewerActorId at all)
  The function comment says "used by dev diagnostics only." However, it is imported by
  feedFeature.group.js (confirmed from ARCHITECT context) and exists as an active export
  that can be imported by any caller.
  Additionally, `listFeedPosts` triggers a Supabase embedded select to count post_comments,
  using `.eq("post_comments.parent_id", null)` — this creates a cross-schema filter
  on embedded relations that bypasses the standard comment count batch path and may
  produce inconsistent results depending on RLS context.
- Risk:
  1. No realm filter — if this DAL is called in a context where realmId matters, it
     returns cross-realm posts.
  2. No block/follow/privacy enforcement — returns raw posts without any visibility
     filtering, exposing content that should be hidden from the caller.
  3. The comment count embedded select creates an implicit trust boundary crossing.
  4. This is a production-reachable code path (not gated by DEV) if any diagnostics
     group is enabled in production.
- Severity: MEDIUM
- Exploitability: LOW — diagnostics groups are typically dev-only, but there is no
  enforcement gate preventing production access
- Attack Preconditions: A diagnostics group is enabled that imports this DAL;
  OR this DAL is imported directly by any non-diagnostics caller
- Blast Radius: Cross-realm post exposure; unfiltered post content
- Identity Leak Type: Post content enumeration
- Cache Trust Type: None
- RLS Dependency: ASSUMED (vc.posts RLS applies but realm + block + privacy not enforced in app layer)
- Why it matters: Legacy code paths that bypass the main pipeline are a common source
  of security regressions. This DAL has no visibility enforcement and the diagnostics
  label provides no enforcement guarantee.
- Recommended mitigation:
  1. Add a DEV-only gate at the top of the function:
       if (!import.meta.env.DEV) throw new Error('[listFeedPosts] DEV only');
  2. OR delete the DAL and update the diagnostics group to use the main pipeline.
  3. Do NOT add realm/block/privacy logic to this legacy function — it should either
     be gated to DEV or removed entirely.
- Rationale: The ARCHITECT context confirms this is "legacy — used by dev diagnostics
  only." The code itself has no enforcement of that constraint.
- Follow-up command: ELEKTRA (add DEV gate), DEADPOOL (confirm no production callers)
- Provenance: SOURCE_VERIFIED
- CISSP Domain:
  - Primary: Access Control
  - Secondary: Software Development Security
```

---

```
VENOM SECURITY FINDING
- Finding ID: VEN-MOD-FEED-006
- Location: apps/VCSM/src/features/feed/dal/feed.read.viewerContext.dal.js:17-28
- Application Scope: VCSM
- Platform Surface: PWA — viewer context resolution
- Trust Boundary: Authenticated viewer
- Boundary Violated: Minimal disclosure — reads sensitive profile field for arbitrary profileId
- Contract Violated: Data minimization principle
- Current behavior:
    export async function readProfileAdultFlagDAL({ profileId }) {
      if (!profileId) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("is_adult")
        .eq("id", profileId)
        .maybeSingle();
      ...
    }
  This DAL accepts any profileId and reads the `is_adult` flag from public.profiles.
  The caller (`getFeedViewerIsAdult`) derives profileId from the viewer's own actor
  identity (via readViewerActorIdentityDAL). However, the DAL itself has no guard
  to ensure profileId belongs to the authenticated viewer — it will query any profileId.
  There is no ownership assertion at the DAL layer.
- Risk: The DAL is currently called with the viewer's own profileId (safe). However,
  there is no enforcement preventing a future caller from passing an arbitrary profileId.
  If called with another user's profileId, it returns whether that user is flagged as
  an adult — a sensitive privacy attribute. The `is_adult` field is used for realm
  access (void realm, 18+ content); leaking this flag for another user breaks privacy.
- Severity: MEDIUM
- Exploitability: LOW — current callers are correct; requires a future miscall
- Attack Preconditions: A future caller passes another user's profileId to this DAL
- Blast Radius: Single profile's adult flag exposure (privacy attribute)
- Identity Leak Type: Privacy attribute disclosure (is_adult flag)
- Cache Trust Type: None
- RLS Dependency: ASSUMED (public.profiles has RLS but the specific policy is unverified
  for is_adult field selectability)
- Why it matters: `is_adult` is a sensitive privacy classification. It controls access
  to the planned Void Realm (18+ content). A function that reads it without ownership
  checking is a future-regression risk.
- Recommended mitigation: Add a comment documenting that profileId MUST be the caller's
  own profileId (not an arbitrary one). Ideally, pass userId to the function and resolve
  profileId internally using auth.uid() via RLS, so the constraint is enforced at the
  DB level rather than relying on caller discipline.
- Rationale: Defense-in-depth for a sensitive privacy attribute. The DAL pattern
  (no ownership check, relying on caller discipline) is inconsistent with the platform's
  actor-pure identity contract.
- Follow-up command: DB (verify public.profiles RLS allows is_adult field selection)
- Provenance: SOURCE_VERIFIED
- CISSP Domain:
  - Primary: Identity and Access Management
  - Secondary: Information and Asset Security
```

---

```
VENOM SECURITY FINDING
- Finding ID: VEN-MOD-FEED-007
- Location: apps/VCSM/src/features/feed/hooks/useFeedWelcomeCard.js:7-8,25-30,43-47
- Application Scope: VCSM
- Platform Surface: PWA — welcome card persistence
- Trust Boundary: Browser localStorage (client-controlled storage)
- Boundary Violated: Client storage trust — localStorage is not a trust boundary
- Contract Violated: No explicit contract; represents a design assumption risk
- Current behavior:
    function lsKey(actorId) { return actorId ? `vcsm_wfc_${actorId}` : null }
    // localStorage fast-path avoids a DB round-trip on repeat visits
    if (key && localStorage.getItem(key) === 'dismissed') {
      setShow(false); setLoading(false); return
    }
  The welcome card dismiss state is persisted in localStorage keyed by actorId.
  If localStorage is cleared, the welcome card re-appears (minor UX reset).
  More critically, if two actors use the same browser profile, their dismiss keys
  are both present — dismissing for actor A does not affect actor B's state, which
  is correct. However, a user who manually sets `vcsm_wfc_{anyActorId} = 'dismissed'`
  in localStorage can suppress the welcome card for ANY actorId they can guess.
  The fast-path bypasses the DB check entirely when the localStorage key is present.
- Risk:
  1. A user who guesses another user's actorId can suppress that user's welcome card
     by pre-setting the localStorage key (requires shared browser session — rare).
  2. The localStorage state can persist after an actor is deleted or deactivated,
     causing the card to stay hidden for a reused actorId (unlikely but possible).
  3. The fast-path means the DB state is not read on repeat visits — if the DB
     shows the card should display (e.g., reset by admin), localStorage overrides it.
- Severity: LOW
- Exploitability: LOW — requires shared browser session or manual localStorage manipulation
- Attack Preconditions: Shared browser session OR knowledge of target actorId AND
  ability to set localStorage (same browser)
- Blast Radius: Welcome card display state for a single actor
- Identity Leak Type: None
- Cache Trust Type: None
- RLS Dependency: ASSUMED
- Why it matters: localStorage is not a security boundary. The fast-path design is
  acceptable for UX but should be documented as such. The actorId used as part of
  the localStorage key is not a secret — any information about actor IDs embedded
  in localStorage keys can be enumerated by browser extensions or XSS.
- Recommended mitigation: Document explicitly that localStorage dismiss is a UX
  fast-path only. Consider using a shorter-lived TTL or adding a DB-authoritative
  check on session start (once per day). This is a governance/documentation fix,
  not a critical code change.
- Rationale: Low severity; the pattern is common and the exploit scenario requires
  physical/shared browser access. Documented for completeness and future regression
  awareness when XSS mitigations are reviewed.
- Follow-up command: ELEKTRA (document fast-path trust assumption)
- Provenance: SOURCE_VERIFIED
- CISSP Domain:
  - Primary: Software Development Security
  - Secondary: Security Architecture and Engineering
```

---

```
VENOM SECURITY FINDING
- Finding ID: VEN-MOD-FEED-008
- Location: apps/VCSM/src/features/feed/dal/feed.read.commentCounts.dal.js:13-36
- Application Scope: VCSM
- Platform Surface: PWA — feed pipeline (comment count enrichment)
- Trust Boundary: Authenticated viewer
- Boundary Violated: Data minimization / bounded query surface
- Contract Violated: No explicit pagination contract at this layer
- Current behavior:
    const { data: rows, error } = await supabase
      .schema("vc")
      .from("post_comments")
      .select("post_id")
      .in("post_id", postIds)
      .is("deleted_at", null);
  This query selects post_id from vc.post_comments for all posts in the current page
  (up to PAGE_SIZE = 10 posts). The result set is unbounded — a single post with
  10,000 comments returns 10,000 rows, all of which are fetched and aggregated in JS.
  The aggregation itself is O(n) in JS, but the network transfer is proportional to
  comment count per post.
- Risk: A post with an extremely large number of comments (thousands or more) causes
  excessive data transfer and JS processing in the browser on every feed page load
  that includes that post. This is a denial-of-service vector against individual
  clients via a high-comment post appearing in their feed. It is also a performance
  regression that worsens as the platform scales.
- Severity: LOW
- Exploitability: LOW — requires a high-comment post to appear in the viewer's feed;
  not a direct exploit vector, more of a scale/performance finding
- Attack Preconditions: A post with very high comment count in viewer's feed page
- Blast Radius: Performance degradation for individual viewer; potential browser tab crash
  on very large comment counts (hundreds of thousands)
- Identity Leak Type: None
- Cache Trust Type: None
- RLS Dependency: ASSUMED
- Why it matters: This pattern will cause visible degradation at scale. The correct
  fix is a server-side COUNT aggregation via RPC or a Supabase count query, rather
  than fetching all comment rows and counting in JS.
- Recommended mitigation:
    // Use Supabase count option instead of fetching all rows:
    const { count } = await supabase
      .schema("vc")
      .from("post_comments")
      .select("post_id", { count: 'exact', head: true })
      .in("post_id", postIds)
      .is("deleted_at", null);
  Or use a server-side RPC that returns Map<postId, count> directly.
- Rationale: The ARCHITECT context confirms this is a known batch pattern. The unbounded
  row fetch is a hidden scale risk. Classified as LOW because it requires content
  conditions to trigger.
- Follow-up command: KRAVEN (performance analysis), DB (suggest RPC pattern)
- Provenance: SOURCE_VERIFIED
- CISSP Domain:
  - Primary: Software Development Security
  - Secondary: Security Architecture and Engineering
```

---

```
VENOM SECURITY FINDING
- Finding ID: VEN-MOD-FEED-009
- Location: apps/VCSM/src/features/feed/hooks/useFeed.js (entire file)
             apps/VCSM/src/features/feed/adapters/hooks/useFeed.adapter.js
- Application Scope: VCSM
- Platform Surface: PWA — legacy feed hook
- Trust Boundary: N/A (architecture governance)
- Boundary Violated: N/A
- Contract Violated: No explicit decommission plan
- Current behavior: `useFeed.js` is a manual-cursor infinite scroll hook that predates
  the `useCentralFeed.js` React Query implementation. The adapter re-exports it:
    export * from "@/features/feed/hooks/useFeed";
  `useFeed.js` is actively imported by feedFeature.group.js diagnostics and is not dead
  code. Two parallel feed fetch implementations coexist with no documented migration plan
  and no documented decommission target. Both hooks call `fetchFeedPagePipeline` — the
  same pipeline — so the security surface is the same. However:
  1. `useFeed.js` error handling is less consistent (see VEN-MOD-FEED-001).
  2. `useFeed.js` has no React Query cache — its state is entirely local, so cache
     invalidation patterns from useCentralFeed do not apply.
  3. The adapter re-export means consumers may receive either hook depending on import path.
- Risk: Governance risk — two hooks with the same API but different error handling,
  caching, and invalidation semantics coexist. Security patches applied to one hook
  may not be applied to the other. The adapter re-export conflates them.
- Severity: INFO
- Exploitability: N/A
- Attack Preconditions: N/A
- Blast Radius: Future security patch drift between hooks
- Identity Leak Type: None
- Cache Trust Type: Inconsistent (useFeed has local state, useCentralFeed has React Query)
- RLS Dependency: NONE
- Why it matters: Security patches must be applied to both hooks. The adapter indirection
  makes it easy to forget one. A documented decommission plan would close this governance gap.
- Recommended mitigation: Document explicitly whether useFeed.js is to be kept for
  diagnostics-only or decommissioned. If diagnostics-only, add a DEV guard at the
  top of useFeed.js. If decommissioned, remove the adapter re-export.
- Rationale: Previously flagged in ARCHITECT context. This run confirms the governance
  gap is still open with no decision recorded.
- Follow-up command: CAPTAIN (record decommission decision), Logan (document in BEHAVIOR.md)
- Provenance: SOURCE_VERIFIED
- CISSP Domain:
  - Primary: Security Assessment and Testing
  - Secondary: Software Development Security
```

---

```
VENOM SECURITY FINDING
- Finding ID: VEN-MOD-FEED-010
- Location: apps/VCSM/src/features/feed/dal/feed.read.viewerContext.dal.js:3-15
- Application Scope: VCSM
- Platform Surface: PWA — viewer context
- Trust Boundary: Authenticated viewer
- Boundary Violated: Minimal disclosure
- Contract Violated: No explicit contract
- Current behavior:
    export async function readViewerActorIdentityDAL({ actorId }) {
      if (!actorId) return null;
      const { data, error } = await supabase
        .schema("vc")
        .from("actors")
        .select("profile_id, vport_id")
        .eq("id", actorId)
        ...
    }
  This DAL reads `vport_id` from vc.actors for the viewer's actorId. vport_id is an
  internal foreign key used to identify vport actors. The DAL returns it to the
  controller, which uses it to determine if the viewer is a vport actor
  (if (actor?.vport_id) return true).
  The controller then discards vport_id after the check. However, the raw vport_id
  is accessible to any caller of this DAL.
- Risk: The `vport_id` column is an internal database foreign key (to vport.profiles.id).
  Reading it as part of the viewer identity check means the value is in memory and
  accessible to any code consuming the DAL return value. While the current consumer
  only uses it for a boolean check, the vport_id UUID itself is not a secret —
  it is the same UUID used in vport.profiles. The architecture contract says:
  "Never expose profileId or vportId through useIdentity() or any public hook or
  controller surface." This DAL returns vport_id in its result.
- Risk: The architecture contract prohibits vportId exposure. While this DAL is internal
  (not exposed via an adapter), the pattern establishes a precedent for vportId in
  DAL return shapes that could be copied to an exposed surface.
- Severity: INFO
- Exploitability: LOW — internal DAL, not adapter-exposed
- Attack Preconditions: Internal caller misuses the returned vport_id
- Blast Radius: Governance / precedent risk
- Identity Leak Type: Internal ID in return shape
- Cache Trust Type: None
- RLS Dependency: ASSUMED
- Why it matters: Architecture contract compliance. The current use is technically
  safe, but the return shape carries a prohibited field.
- Recommended mitigation: Rename the DAL result to return a boolean `isVport` instead
  of `vport_id`:
    return { profile_id: data.profile_id, isVport: !!data.vport_id }
  The controller then uses `actor.isVport` instead of `actor?.vport_id`.
- Rationale: Architecture contract compliance. Minor but establishes the correct pattern.
- Follow-up command: ELEKTRA (refactor DAL return shape)
- Provenance: SOURCE_VERIFIED
- CISSP Domain:
  - Primary: Identity and Access Management
  - Secondary: Software Development Security
```

---

## 5. RLS Table Status

| Table | DAL | RLS Dependency | Verified? | Status |
|---|---|---|---|---|
| vc.posts | feed.read.posts.dal.js | REQUIRED — sole auth layer at post fetch | NO | ASSUMED — prior DB run confirmed posts_select_actor_based policy exists |
| vc.actor_onboarding_steps | feedWelcomeCard.dal.js | REQUIRED — write enforcement | YES (migration 20260518010000) | VERIFIED SAFE |
| vc.actor_privacy_settings | feed.read.actorsBundle.dal.js, feed.read.debugPrivacyRows.dal.js | ASSUMED | NO | UNVERIFIED |
| vc.actors | feed.read.actorsBundle.dal.js, feed.read.viewerContext.dal.js, feed.read.debugPrivacyRows.dal.js | ASSUMED | NO | UNVERIFIED |
| vc.actor_follows | feed.read.followRows.dal.js, feed.read.debugPrivacyRows.dal.js | REQUIRED (follower_actor_id filter) | NO | ASSUMED |
| vc.actor_owners | feed.read.debugPrivacyRows.dal.js | ASSUMED | NO | UNVERIFIED |
| moderation.blocks | feed.read.blockRows.dal.js | REQUIRED | NO | ASSUMED |
| moderation.actions | feed.read.hiddenPosts.dal.js | REQUIRED | YES (migration 20260518020000) | VERIFIED SAFE |
| vc.post_media | feed.read.media.dal.js | ASSUMED NONE (post-public in pipeline scope) | NO | UNVERIFIED |
| vc.post_comments | feed.read.commentCounts.dal.js | ASSUMED NONE | NO | UNVERIFIED |
| vc.post_reactions | feed.read.reactionCounts.dal.js, feed.read.viewerReactions.dal.js | ASSUMED NONE | NO | UNVERIFIED |
| vc.post_rose_gifts | feed.read.reactionCounts.dal.js | ASSUMED NONE | NO | UNVERIFIED |
| vc.post_mentions | feed.mentions.dal.js | ASSUMED NONE | NO | UNVERIFIED |
| vport.profiles | feed.read.actorsBundle.dal.js | OWNER-ONLY (confirmed — causing VEN-PIPE-003) | YES (source behavior verified) | FINDING — owner-only breaks non-owner vport post visibility |
| public.profiles | feed.read.actorsBundle.dal.js, feed.read.viewerContext.dal.js | ASSUMED | NO | UNVERIFIED (is_adult field sensitive) |

---

## 6. Write Surface Safety Status

| Write Surface | DAL | Controller | Ownership Assertion | App-Layer Check | Status |
|---|---|---|---|---|---|
| vc.actor_onboarding_steps UPSERT | feedWelcomeCard.dal.js:markWelcomeFeedCardSeenDAL | feedWelcomeCard.controller.js:ctrlMarkWelcomeCardSeen | NONE in app layer | actorId null check only | RLS-only — ACCEPTED with DB verification |

**Key note:** The welcome card write has no app-layer ownership assertion. `ctrlMarkWelcomeCardSeen` accepts any actorId and writes to the DB. RLS on `vc.actor_onboarding_steps` (migration 20260518010000) uses `actor_owners` to verify the caller owns the actorId. This is the sole protection. The caller must pass their own actorId — if they pass another actor's ID, the RLS write will fail, but there is no application-layer guard to prevent the attempt.

---

## 7. Ownership Enforcement Gaps

| Controller | Input | Ownership Check | Gap |
|---|---|---|---|
| ctrlMarkWelcomeCardSeen | actorId from hook | NONE | RLS-only |
| ctrlGetWelcomeCardVisible | actorId from hook | NONE | RLS-only (read-only, low risk) |
| getFeedViewerIsAdult | viewerActorId from hook | NONE | reads viewer's own data (caller-trusted) |
| listActorPosts | actorId + viewerActorId | NONE | viewerActorId discarded — VEN-FEED-004 |
| getDebugPrivacyRowsController | actorId | actorId as userId (BROKEN) | VEN-FEED-003 — wrong field type passed |

---

## 8. Consolidated Finding Inventory

### This Run — New Findings

| ID | Severity | Title | File | Trust Gap |
|---|---|---|---|---|
| VEN-MOD-FEED-001 | HIGH | Bare `console.warn` in production error path | `useFeed.js:241` | Error details leaked to browser console in production |
| VEN-MOD-FEED-002 | HIGH | 5 bare console calls in production feed actions | `useCentralFeedActions.js:68,139,182,197,221` | Mutation error details (DB/RLS messages) leaked to console |
| VEN-MOD-FEED-003 | HIGH | Raw actor UUID in profile navigation route | `useCentralFeedActions.js:152` | Actor UUID exposed in public browser URL |
| VEN-MOD-FEED-004 | MEDIUM | Raw UUID in share URL | `useCentralFeedActions.js:234-236` | Post UUID exposed in shareable links |
| VEN-MOD-FEED-005 | MEDIUM | Legacy DAL has no realm/block/privacy filter | `feed.posts.dal.js:11-53` | Unfiltered post access for any diagnostics caller |
| VEN-MOD-FEED-006 | MEDIUM | `readProfileAdultFlagDAL` has no ownership assertion | `feed.read.viewerContext.dal.js:17-28` | Sensitive `is_adult` field readable for arbitrary profileId |
| VEN-MOD-FEED-007 | LOW | localStorage dismiss bypass | `useFeedWelcomeCard.js:25-30` | DB authoritative state overrideable via browser localStorage |
| VEN-MOD-FEED-008 | LOW | Unbounded comment row fetch for count | `feed.read.commentCounts.dal.js:20-25` | Unbounded data transfer on high-comment posts |
| VEN-MOD-FEED-009 | INFO | Legacy `useFeed.js` with no decommission plan | `useFeed.js`, `useFeed.adapter.js` | Security patch drift risk between hook implementations |
| VEN-MOD-FEED-010 | INFO | `vport_id` in DAL return shape violates architecture contract | `feed.read.viewerContext.dal.js:3-15` | Architecture precedent for prohibited field in return shape |

### Carried Forward — Prior Runs (Open)

| ID | Severity | Status | Description |
|---|---|---|---|
| VEN-FEED-001 | HIGH | OPEN | BEHAVIOR.md is a PLACEHOLDER — no §5 or §9 security rules |
| VEN-FEED-003 | MEDIUM | OPEN | actorId passed as userId in `getDebugPrivacyRows.controller.js:42` |
| VEN-FEED-004 | MEDIUM | OPEN | viewerActorId discarded in `listActorPosts.controller.js:33-37` |
| VEN-PIPE-002 | HIGH | OPEN — THOR BLOCKER | null realmId bypasses realm filter in `feed.read.posts.dal.js:30-33` |
| VEN-PIPE-003 | HIGH | OPEN — THOR BLOCKER | vport.profiles owner-only RLS nulls vport bundle — vport posts invisible to non-owners |
| VEN-PIPE-004 | MEDIUM | OPEN | Raw actorId UUID in mention route fallback (`buildMentionMaps.model.js:6`) |
| VEN-PIPE-005 | MEDIUM | OPEN | Missing UUID validation in `readHiddenPostsForViewer` and `readViewerReactionsBatch` |
| VEN-PIPE-006 | MEDIUM | OPEN | 60s block/follow cache + 30s React Query staleTime — stale moderation state |
| VEN-PIPE-008 | MEDIUM | OPEN | Blocked actor presentations leaked via mention hydration fan-out |

---

## 9. THOR Impact — This Run

| Finding | Severity | THOR Blocker | Rationale |
|---|---|---|---|
| VEN-MOD-FEED-001 | HIGH | NO | Information disclosure from console; no data access bypass |
| VEN-MOD-FEED-002 | HIGH | NO | Information disclosure from console; no data access bypass |
| VEN-MOD-FEED-003 | HIGH | NO | UUID exposure in URL; violates platform invariant; no data access bypass |
| VEN-MOD-FEED-004 | MEDIUM | NO | UUID in share URL; prior-documented; no data access bypass |
| VEN-MOD-FEED-005 | MEDIUM | NO | Legacy diagnostics path; low production exposure |
| VEN-MOD-FEED-006 | MEDIUM | NO | Sensitive field; current callers are correct |
| VEN-MOD-FEED-007 | LOW | NO | UI state only; no security boundary bypass |
| VEN-MOD-FEED-008 | LOW | NO | Performance / scale issue |
| VEN-MOD-FEED-009 | INFO | NO | Governance gap |
| VEN-MOD-FEED-010 | INFO | NO | Architecture precedent |

**Existing THOR Blockers from prior runs remain open:**
- VEN-PIPE-002 — null realmId realm bypass (THOR BLOCKER — P0)
- VEN-PIPE-003 — vport.profiles RLS breaks vport post visibility (THOR BLOCKER — P0)

---

## 10. Severity Counts — This Run

| Severity | Count (This Run) | Count (All Open Including Prior) |
|---|---|---|
| CRITICAL | 0 | 0 |
| HIGH | 3 | 6 (including VEN-FEED-001, VEN-PIPE-002, VEN-PIPE-003) |
| MEDIUM | 4 | 9 (including carried forward findings) |
| LOW | 2 | 4 |
| INFO | 2 | 2 |
| **TOTAL** | **11** | **21** |

---

## 11. CISSP Domain Coverage

| CISSP Domain | Findings This Run |
|---|---|
| Access Control | VEN-MOD-FEED-005, VEN-MOD-FEED-006 |
| Identity and Access Management | VEN-MOD-FEED-003, VEN-MOD-FEED-006, VEN-MOD-FEED-010 |
| Software Development Security | VEN-MOD-FEED-001, VEN-MOD-FEED-002, VEN-MOD-FEED-005, VEN-MOD-FEED-007, VEN-MOD-FEED-008, VEN-MOD-FEED-009, VEN-MOD-FEED-010 |
| Information and Asset Security | VEN-MOD-FEED-001, VEN-MOD-FEED-002, VEN-MOD-FEED-003, VEN-MOD-FEED-004, VEN-MOD-FEED-006 |
| Security Assessment and Testing | VEN-MOD-FEED-009 |
| Security Architecture and Engineering | VEN-MOD-FEED-007, VEN-MOD-FEED-008 |

---

## 12. Mitigation Plan

| ID | Severity | File | Action | Priority |
|---|---|---|---|---|
| VEN-MOD-FEED-001 | HIGH | `useFeed.js:241` | Add `import.meta.env.DEV` guard to catch block console.warn | P1 |
| VEN-MOD-FEED-002 | HIGH | `useCentralFeedActions.js:68,139,182,197,221` | Add `import.meta.env.DEV` guard to all 5 console.* calls | P1 |
| VEN-MOD-FEED-003 | HIGH | `useCentralFeedActions.js:152` | Replace raw actorId in navigate with resolved username/slug from post.actor | P1 |
| VEN-MOD-FEED-004 | MEDIUM | `useCentralFeedActions.js:234-236` | Replace raw postId in share URL with post slug | P2 |
| VEN-MOD-FEED-005 | MEDIUM | `feed.posts.dal.js:11` | Add DEV-only guard at function entry OR delete the DAL | P2 |
| VEN-MOD-FEED-006 | MEDIUM | `feed.read.viewerContext.dal.js:17` | Add documentation; consider ownership-asserting refactor | P2 |
| VEN-MOD-FEED-007 | LOW | `useFeedWelcomeCard.js:25-30` | Document localStorage fast-path trust model | P3 |
| VEN-MOD-FEED-008 | LOW | `feed.read.commentCounts.dal.js:20-25` | Replace row-fetch count with server-side COUNT | P3 |
| VEN-MOD-FEED-009 | INFO | `useFeed.js`, `useFeed.adapter.js` | Record decommission decision; add DEV gate if diagnostics-only | P3 |
| VEN-MOD-FEED-010 | INFO | `feed.read.viewerContext.dal.js:3-15` | Refactor return shape to use `isVport: boolean` instead of raw vport_id | P3 |

---

## 13. Required Follow-Up Commands

| Finding | Command | Priority | Reason |
|---|---|---|---|
| VEN-MOD-FEED-001, 002 | ELEKTRA | P1 | Add DEV guards to all unguarded console.* calls |
| VEN-MOD-FEED-003, 004 | ELEKTRA | P1 | Patch profile navigation and share URL to use slugs/usernames |
| VEN-MOD-FEED-005 | DEADPOOL | P2 | Confirm no production callers for legacy feed.posts.dal.js |
| VEN-MOD-FEED-006 | DB | P2 | Verify public.profiles RLS allows is_adult field selection by any authenticated user |
| VEN-PIPE-002, 003 | ELEKTRA + DB | P0 | THOR blocker remediation (realm bypass, vport visibility) |
| VEN-PIPE-006 | WOLVERINE | P1 | Wire block/follow cache invalidation to action controllers |
| VEN-PIPE-008 | ELEKTRA | P1 | Filter blocked actors from mention hydration fan-out |
| VEN-MOD-FEED-009 | CAPTAIN | P3 | Record useFeed.js decommission decision |
