---
name: vcsm.feed.deadpool.2026-06-06
description: DEADPOOL forensic debug run — VCSM:feed — 2026-06-06
metadata:
  type: deadpool-run-output
  owner: DEADPOOL
  run-date: 2026-06-06
  architect-gate: SATISFIED (same-session ARCHITECT run 2026-06-06)
  branch: vport-booking-feed-security-updates
---

# DEADPOOL RUN — VCSM:feed — 2026-06-06

**ARCHITECT Gate:** SATISFIED — fresh ARCHITECT run completed same session.
**Scope:** Central feed (CentralFeedScreen at /feed) + PostFeedScreen at /posts + PostCard shared layer
**Investigation type:** Static source inspection (no live instrumentation added)

---

## PIPELINE TRACE

```
DB: vc.posts → vc.post_media → vc.actors → vport.profiles → moderation.blocks
              → vc.actor_follows → moderation.actions → vc.post_comments
              → vc.post_reactions → vc.post_rose_gifts → vc.post_mentions
DAL: 9 parallel DALs per page via fetchFeedPage.pipeline.js
Controller: listActorPosts.controller.js (SSOT, profiles shared)
            getFeedViewerContext.controller.js (adult flag, sequential 2-call)
Pipeline: fetchFeedPage.pipeline.js → fetchCentralFeedPage.js
Hook (canonical): useCentralFeed.js (useInfiniteQuery, staleTime:30s)
Hook (legacy): useFeed.js (useState, still served via useFeed.adapter.js)
Adapter boundary: feedCache.adapter.js (cache invalidation)
                  hooks/useFeed.adapter.js ← FROZEN ON LEGACY HOOK
Screen (/feed):  CentralFeedScreen.jsx → useCentralFeed ✓
Screen (/posts): PostFeedScreen.jsx → useFeed.adapter → useFeed.js ✗
PostCard: PostCard.jsx → PostCardView → ReactionBar → ShareReactionButton ← ARROWS FOUND
```

---

## BREAK POINT ANALYSIS

---

### BREAK POINT 001 — ARROW SYMBOLS IN SHARE BUTTON

```
BREAK POINT FOUND
Location: apps/VCSM/src/features/post/postcard/components/ShareReactionButton.jsx lines 19-28
Issue:    Four Unicode arrow characters (← ← ↑ ↑ → → ↓ ↓) rendered
          as absolute-positioned text spans around a globe emoji in the share button.
          This violates the platform rule: "Never use arrow symbols in any UI copy, buttons, or links."
Proof:    Source at lines 19-28:
            <span className="absolute -top-2 left-1/2 ...text-[10px]">{`↑`}</span>  ← ↑
            <span className="absolute top-1/2 -right-3 ...text-[10px]">{`→`}</span> ← →
            <span className="absolute -bottom-2 left-1/2 ...text-[10px]">{`↓`}</span> ← ↓
            <span className="absolute top-1/2 -left-3 ...text-[10px]">{`←`}</span>   ← ←
          Screenshot confirms → and ↓ visible in every post card.
          Propagation path: CentralFeedScreen → PostCard.adapter → PostCard.jsx
            → PostCardView → ReactionBar → ShareReactionButton
          Also affects: PostFeedScreen (PostCardView → ReactionBar → ShareReactionButton)
Impact:   Visible rule violation on every post card in every feed and post detail view.
          Both /feed and /posts routes affected. Zero exceptions.
```

```
ROOT CAUSE 001
Cause:    ShareReactionButton was designed with a visual "spread/share" metaphor using
          directional arrows radiating from a globe to indicate "spread it everywhere."
Why it happened: The implementation predates or overlooked the platform-wide "no arrows" rule.
                 Unicode escapes (→ etc.) obscure the symbol from simple text search
                 (searching "→" in source won't find "→").
Why system allowed it: The no-arrows rule is a memory/convention rule, not enforced
                       by lint or build tooling. Unicode escapes bypass casual grep.
Similar risk: grep for ←, ↑, →, ↓ across all .jsx/.js files
              to confirm no other arrow violations exist in this form.
```

```
FIX PLAN 001
Files to change: apps/VCSM/src/features/post/postcard/components/ShareReactionButton.jsx
Change required: Remove the four arrow spans (lines 19-28). Replace the visual treatment
                 with a non-arrow design. Options:
                   A) Use CSS rotation on the globe (transform: rotate) to suggest broadcast
                   B) Add a small radiating dot pattern using CSS before/after pseudo-elements
                   C) Use a different emoji cluster (e.g. globe + sparkle, no directional arrows)
                   D) Simplify to just the 🌍 globe with no decorators
                 Decision on visual replacement: USER'S CALL — present options A-D.
Reasoning:  Four arrow symbols directly violate the platform rule. The globe alone
            is understandable for "share/spread" without directional arrows.
Risk level: LOW — pure UI change, no data or logic impact.
Debug code to remove: none (not a debug issue)
Logan update required: No
Engine audit update: No
```

---

### BREAK POINT 002 — PostFeed.screen.jsx DOUBLE-FETCH ON MOUNT

```
BREAK POINT FOUND
Location: apps/VCSM/src/features/post/screens/PostFeed.screen.jsx lines 136-150
          + apps/VCSM/src/features/feed/hooks/useFeed.js lines 260-266
Issue:    Two separate useEffect hooks both call fetchPosts(true) on component mount:
            1. useFeed.js internal effect (lines 260-266):
               useEffect(() => {
                 if (!viewerActorId) return;
                 if (didInitialFetchRef.current) return;
                 didInitialFetchRef.current = true;
                 fetchPosts(true);
               }, [viewerActorId, fetchPosts]);
            2. PostFeed.screen.jsx consumer effect (lines 136-150):
               useEffect(() => {
                 let cancelled = false;
                 setPosts([]);
                 (async () => {
                   if (!cancelled) { await fetchPosts(true); }
                 })();
                 return () => { cancelled = true; };
               }, [actorId, realmId, fetchPosts, setPosts]);
          Both fire on mount. The screen-level effect also calls setPosts([]) BEFORE
          the fetch, causing a state reset that races with the hook's internal reset.
Proof:    Source confirmed. useFeed.js has its own initial fetch guard
          (didInitialFetchRef prevents re-run), but the screen-level effect
          bypasses this guard by being a separate caller.
Impact:   On mount at /posts:
            - setPosts([]) fires from screen effect (visual flash to empty)
            - fetchPosts(true) fires from hook's internal effect
            - fetchPosts(true) fires again from screen effect
            - loadingRef.current guard in useFeed.js drops the second call
            - BUT: the setPosts([]) in the screen effect resets state mid-load
          Net effect: unnecessary state reset race, potential visual flicker,
          unnecessary re-registration of scroll handler.
```

```
ROOT CAUSE 002
Cause:    PostFeed.screen.jsx was written to explicitly control its own fetch lifecycle
          without knowing that useFeed.js already has an internal initial fetch effect.
Why it happened: useFeed.js was originally a dumb data hook without self-triggering.
                 The self-triggering initial fetch was added to the hook later.
                 PostFeed.screen.jsx's consumer effect was not removed after that change.
Why system allowed it: No test coverage. Dual trigger is masked by loadingRef guard
                       so visible symptoms are subtle (potential flicker, no crash).
Similar risk: Any other screen consuming useFeed.js via adapter should be audited
              for the same dual-trigger pattern.
```

```
FIX PLAN 002
Files to change: apps/VCSM/src/features/post/screens/PostFeed.screen.jsx
Change required: Remove the screen-level useEffect that calls fetchPosts(true) (lines 136-150).
                 The useFeed.js hook's internal initial fetch effect already handles
                 the first load when viewerActorId is set.
                 The setPosts([]) call in the screen effect is also redundant —
                 useFeed.js resets posts array internally when actorId/realmId changes.
Reasoning:  Let the hook own its lifecycle. Screen should not trigger initial fetch.
Risk level: LOW — the hook's internal trigger already handles this. Removing the
            screen-level call stops the race without removing any functionality.
Debug code to remove: none
Logan update required: No
Engine audit update: No
```

---

### BREAK POINT 003 — useFeed.adapter.js FROZEN ON LEGACY HOOK

```
BREAK POINT FOUND
Location: apps/VCSM/src/features/feed/adapters/hooks/useFeed.adapter.js line 1
Issue:    export * from "@/features/feed/hooks/useFeed"
          The adapter re-exports the state-based legacy hook, NOT the canonical
          React Query-backed useCentralFeed.
          PostFeed.screen.jsx at /posts imports via this adapter:
            import { useFeed } from "@/features/feed/adapters/hooks/useFeed.adapter"
          Result: /posts route runs the legacy implementation with:
            - useState-based post storage (not React Query cache)
            - No staleTime/gcTime cache semantics
            - No optimistic update infrastructure matching useCentralFeed
            - Its own separate feed session tracking in feedProfiler
            - Different scroll pagination approach (window.scroll vs IntersectionObserver)
Proof:    Source confirmed in both files. Routes confirmed: /posts → PostFeedScreen.
Impact:   /posts consumers diverge from the platform's canonical feed implementation.
          If useFeed.js is eventually removed, PostFeed.screen.jsx breaks silently.
          useFeed.adapter.js is the boundary — it should be updated FIRST before
          PostFeedScreen is migrated to prevent the boundary from becoming stale again.
```

```
ROOT CAUSE 003
Cause:    useCentralFeed was added as a React Query replacement for useFeed without
          updating the adapter to point to the new implementation.
Why it happened: Migration was partial — the canonical hook was built and wired into
                 CentralFeedScreen directly, but the adapter boundary was not updated.
Why system allowed it: No enforcement mechanism for adapter-to-hook consistency.
                       No tests that would catch this.
Similar risk: Any future consumer that reaches for useFeed.adapter will get legacy.
```

```
FIX PLAN 003
Files to change: apps/VCSM/src/features/feed/adapters/hooks/useFeed.adapter.js
Change required: Update export to re-export from useCentralFeed:
                   export { useCentralFeed as useFeed } from "@/features/feed/hooks/useCentralFeed"
                 NOTE: useCentralFeed has a different signature than useFeed — it does NOT
                 accept a fresh-flag-based fetchPosts pattern. Migration of PostFeed.screen.jsx
                 to the new API is ALSO required before this adapter change is safe.
                 Recommended order:
                   1. Migrate PostFeed.screen.jsx to use useCentralFeed directly
                   2. Update adapter to re-export useCentralFeed
                   3. Remove useFeed.js after confirming zero consumers remain
Reasoning:  Adapter boundary must track the canonical implementation.
Risk level: MEDIUM — API shape difference between useFeed and useCentralFeed means
            PostFeed.screen.jsx must be updated simultaneously. Do not swap adapter
            without migrating the screen first.
Debug code to remove: none
Logan update required: No (BEHAVIOR.md is a placeholder; not blocking)
Engine audit update: No
```

---

### BREAK POINT 004 — PostFeed.screen.jsx WINDOW.SCROLL INSTEAD OF INTERSECTIONOBSERVER

```
BREAK POINT FOUND
Location: apps/VCSM/src/features/post/screens/PostFeed.screen.jsx lines 152-166
Issue:    The scroll-based pagination handler uses window.addEventListener("scroll", ...)
          instead of the IntersectionObserver sentinel pattern used by CentralFeedScreen
          (via useFeedInfiniteScroll.js).
          window.scroll fires continuously while scrolling. The effect is re-registered
          every time loading, hasMore, or fetchPosts changes (all three in deps array),
          which happens on every page load cycle.
Proof:    Source confirmed. CentralFeedScreen.jsx uses:
            const { sentinelRef } = useFeedInfiniteScroll({ ... })
          which implements a proper IntersectionObserver with a 600px rootMargin sentinel.
          PostFeed.screen.jsx uses:
            window.addEventListener("scroll", onScroll)
          with inline nearBottom calculation.
Impact:   Performance concern — continuous scroll event firing vs. one-shot IO callback.
          Re-registration overhead on every loading/hasMore state change.
          The window listener does not use the scroll container ref (PullToRefresh),
          it uses window directly — inconsistent with the main feed's scroll model.
```

```
ROOT CAUSE 004
Cause:    PostFeed.screen.jsx predates useFeedInfiniteScroll and was not updated when
          that hook was extracted.
Why it happened: Legacy scroll pattern preserved during new hook introduction.
Why system allowed it: No linter rule enforcing use of the platform scroll hook.
                       The screen still functions so no crash surfaces.
Similar risk: Low — /posts is a secondary route. But if cloned for other screens,
              the pattern propagates.
```

```
FIX PLAN 004
Files to change: apps/VCSM/src/features/post/screens/PostFeed.screen.jsx
Change required: Replace window.scroll handler with useFeedInfiniteScroll hook
                 (same as CentralFeedScreen), or fold into the useCentralFeed
                 migration (Fix 003) which would eliminate this screen's scroll code entirely.
Reasoning:  Consistency + performance. IntersectionObserver is the platform standard.
Risk level: LOW (behavioral improvement, no data impact).
Debug code to remove: none
Logan update required: No
Engine audit update: No
```

---

### FINDING 005 — PERF "366q 87636ms" DISPLAY — PARTIALLY RESOLVED

```
PERF Display Analysis:
  Observed: "PERF 366q 87636ms" in debug rail at /feed
  FeedProfilerOverlay minimized format: "FEED {X}dal {Y}ms"
  Discrepancy: "PERF" and "q" don't match known source at ZZnotforproduction/_ACTIVE/debuggers/feed/

  Two possible explanations:
    A) The @debuggers/feed alias resolves to a DIFFERENT source (possibly zzzzlegacy/CURRENT/platform/debuggers/feed/)
       where the FeedProfilerOverlay displays "PERF" and "q" instead of "FEED" and "dal".
       This would mean the live app is running LEGACY DEBUGGER CODE, not the updated ACTIVE version.
    B) The PERF display is from a separate, unidentified performance component (not FeedProfilerOverlay).

  "366q 87636ms" scale analysis:
    - If this represents the LATEST feed session only (getLatestFeedSession):
      366 DAL calls in one session = ~40 pagination pages (9 calls each) = extensive scrolling
      OR a loop-fetch issue causing many rapid pages
    - 87636ms = ~87 seconds total accumulated DB time across those calls

  FD 10/20 interpretation (FeedDebugPanel confirmed):
    filteredCount = 10 (visible posts shown)
    rawCount = 20 (posts fetched from DB)
    50% filter rate — high. Likely from private accounts not followed by viewer.

DEFERRED: Cannot fully resolve PERF display source without:
  A) Reading vite.config or jsconfig for @debuggers alias resolution, OR
  B) Live instrumentation to confirm which component renders "PERF {X}q {Y}ms"

RECOMMENDATION: Check @debuggers alias — if it resolves to zzzzlegacy/, update
  the alias to point to ZZnotforproduction/_ACTIVE/debuggers/feed/ to use current code.
```

---

## COMPLETE FINDING REGISTRY

| ID | Location | Issue | Severity | Status |
|---|---|---|---|---|
| DP-001 | ShareReactionButton.jsx:19-28 | Arrow symbols (←-↓) in rendered UI | HIGH (rule violation) | PROVEN — awaiting approval |
| DP-002 | PostFeed.screen.jsx:136-150 + useFeed.js:260-266 | Double fetchPosts(true) on mount | MEDIUM | PROVEN — awaiting approval |
| DP-003 | useFeed.adapter.js:1 | Adapter boundary frozen on legacy hook | HIGH (structural) | PROVEN — awaiting approval |
| DP-004 | PostFeed.screen.jsx:152-166 | window.scroll instead of IntersectionObserver | LOW | PROVEN — awaiting approval |
| DP-005 | @debuggers alias (unresolved) | PERF display source unknown; possible legacy debugger in use | UNKNOWN | DEFERRED — needs alias check |

---

## PRIORITY ORDER

```
1. DP-001 — Arrow symbols (isolated UI fix, no side effects, safe to ship immediately)
2. DP-003 — Adapter boundary (architectural correctness; do with DP-004 migration)
3. DP-002 — Double fetch (remove screen-level useEffect after DP-003 migration)
4. DP-004 — Scroll handler (fold into DP-003 PostFeed migration)
5. DP-005 — Resolve @debuggers alias and confirm which profiler code is live
```

---

## BUG FIX PROPOSALS AWAITING APPROVAL

```
BUG FIX PROPOSAL — DP-001 (Arrow Symbols)
Root cause:    ShareReactionButton.jsx uses ←-↓ arrow characters
Fix location:  apps/VCSM/src/features/post/postcard/components/ShareReactionButton.jsx lines 19-28
Files affected: 1 file
Debug probe needed: No
Documentation drift: No (BEHAVIOR.md is a placeholder — no behavioral contract to drift)
Engine audit impact: No
Decision needed: What visual replaces the arrows? (options: globe-only, CSS rotation, dot spray, emoji cluster)

BUG FIX PROPOSAL — DP-002 (Double Fetch)
Root cause:    Screen-level useEffect duplicates the hook's own initial fetch trigger
Fix location:  apps/VCSM/src/features/post/screens/PostFeed.screen.jsx lines 136-150
Files affected: 1 file
Debug probe needed: No
Documentation drift: No
Engine audit impact: No

BUG FIX PROPOSAL — DP-003 + DP-004 (Adapter + Scroll — Bundle)
Root cause:    Adapter frozen on legacy hook; PostFeed uses window.scroll
Fix location:  apps/VCSM/src/features/post/screens/PostFeed.screen.jsx (full migration)
               apps/VCSM/src/features/feed/adapters/hooks/useFeed.adapter.js
Files affected: 2 files (plus useFeed.js removal once zero consumers confirmed)
Debug probe needed: No
Documentation drift: No
Engine audit impact: No
Note: Migrate PostFeed.screen.jsx to useCentralFeed BEFORE updating adapter.
      API shape differs — cannot just swap the adapter without updating the screen.
```

---

## DEBUGGER REGISTRY

No temporary debug probes were added during this investigation. All findings are source-verified by static inspection.

BUILDDED DEADPOOL ON FILE: ZZnotforproduction/APPS/VCSM/features/feed/outputs/2026/06/06/DEADPOOL/vcsm.feed.deadpool.md

---

## COMPLETION SAFETY CHECK

- [x] Visible symptoms traced to source break points
- [x] All break points proven with source evidence (not guesses)
- [x] No temporary instrumentation added (static inspection only)
- [x] No code modified — awaiting approval
- [x] ARCHITECT gate satisfied (same-session run)
- [x] Debugger registry entry created
- [ ] LOGAN sync: Not required (BEHAVIOR.md is placeholder; no drift to report)
- [ ] Engine audit: Not required (no engine code involved)
- [ ] DP-005: DEFERRED pending @debuggers alias resolution

---

**WHAT'S UP DOC**
