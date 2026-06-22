# ELEKTRA Security Report

**Date:** 2026-06-06
**Scope:** VCSM — feature:feed (central feed, profile posts, welcome card, share URL)
**Reviewer:** ELEKTRA
**Scan Trigger:** BLIND_REVERIFY_MODE — re-verify after VENOM + BLACKWIDOW same-session runs (2026-06-06)
**Run Mode:** BLIND_REVERIFY_MODE — source read independently before consulting upstream report summaries
**Findings Summary:** 2 HIGH | 3 MEDIUM | 0 LOW | 1 INFO
**False Positives Rejected:** 3
**Suggested Patches:** 6

---

## PREFLIGHT — UPSTREAM DEPENDENCY GATE

**Status: ELEKTRA PREFLIGHT PASS**

| Upstream | Report | Date | Freshness | Scope Match |
|---|---|---|---|---|
| ARCHITECT | ZZnotforproduction/APPS/VCSM/features/feed/outputs/2026/06/06/ARCHITECT/vcsm.feed.architecture.md | 2026-06-06 | FRESH (0 days) | PASS |
| VENOM | ZZnotforproduction/APPS/VCSM/features/feed/outputs/2026/06/06/VENOM/2026-06-06_venom_feed-security-reverify.md | 2026-06-06 | FRESH (0 days) | PASS |
| BLACKWIDOW | ZZnotforproduction/APPS/VCSM/features/feed/outputs/2026/06/06/BLACKWIDOW/2026-06-06_blackwidow_feed-adversarial-reverify.md | 2026-06-06 | FRESH (0 days) | PASS |

All three gates satisfied. Proceeding with ELEKTRA verification.

---

## SCAN TARGET

```
ELEKTRA SCAN TARGET
Feature / Route / Engine:     VCSM:feed — central feed pipeline, profile posts, welcome card write, share URL
Application Scope:            VCSM
Reason for scan:              Re-verify all open findings from VENOM + BLACKWIDOW same-session runs
Scan trigger:                 BLIND_REVERIFY_MODE re-verify
Upstream VENOM report:        ZZnotforproduction/APPS/VCSM/features/feed/outputs/2026/06/06/VENOM/
Upstream BLACKWIDOW report:   ZZnotforproduction/APPS/VCSM/features/feed/outputs/2026/06/06/BLACKWIDOW/
```

**Sub-files loaded:** Area 1 (Actor Ownership/IDOR), Area 2 (Controller Input Trust), Area 4 (Feed/System Posts), Area 6 (Auth/Session), Area 7 (URL/Redirect)

---

## CHAIN RECONSTRUCTION — SOURCE READ SUMMARY

The following files were independently read and traced before consulting any upstream report conclusions:

| File | Purpose | Lines Verified |
|---|---|---|
| apps/VCSM/src/features/feed/controllers/feedWelcomeCard.controller.js | Write controller — ownership gate | 1-14 |
| apps/VCSM/src/features/feed/dal/feedWelcomeCard.dal.js | Write sink — vc.actor_onboarding_steps upsert | 1-43 |
| apps/VCSM/src/features/feed/pipeline/fetchFeedPage.pipeline.js | includeDebug flag; debugger wraps | 1-177 |
| apps/VCSM/src/features/feed/queries/fetchCentralFeedPage.js | debugRows accumulation; cache shape | 1-108 |
| apps/VCSM/src/features/feed/hooks/useCentralFeed.js | filterDebugRows exposure; gcTime | 1-292 |
| apps/VCSM/src/features/feed/hooks/useCentralFeedActions.js | Share URL construction | 235-259 |
| apps/VCSM/src/features/feed/controllers/listActorPosts.controller.js | viewerActorId discard | 1-37 |
| apps/VCSM/src/features/feed/model/normalizeFeedRows.model.js | includeDebug behavior; debugRow shape | 1-104 |
| apps/VCSM/src/app/providers/AuthProvider.jsx | logout() cache clearing | 167-216 |

---

## EXECUTIVE SUMMARY

ELEKTRA identified **2 HIGH** findings across two distinct attack classes — an IDOR write path with no session binding on the welcome card write surface, and a session residue gap where logout does not clear the React Query in-memory cache. Both are confirmed THOR release blockers.

Three MEDIUM findings cover private profile metadata in the production React Query cache (readable via DevTools), a raw UUID in the public-facing share URL (platform invariant violation), and an illusory `viewerActorId` guard in the profile posts controller. One INFO finding covers unconditional debugger module imports that carry no direct exploit path in a Vite build.

Three false positives were rejected: the unguarded console.log (DEV-guarded confirmed), the debug privacy controller production exposure (three-layer DEV protection confirmed), and the escalation of debugger imports to HIGH severity (downgraded to INFO on Vite tree-shaking analysis).

**CARNAGE gate is required** before THOR eligibility can be assessed on three open items: RLS on `vc.actor_onboarding_steps` (ELEK-001 DB layer), RLS on `vc.posts` for profile posts path (BW-FEED-NEW-002), and ownership policy on `vport.profiles` (VEN-FEED-005). These are unverifiable from source.

---

## HIGH FINDINGS

---

```
SECURITY FINDING

- Finding ID:         ELEK-2026-06-06-001
- Title:              IDOR — ctrlMarkWelcomeCardSeen accepts caller-supplied actorId with no session binding
- Category:           IDOR/BOLA
- Severity:           HIGH
- Status:             Open
- Scope:              VCSM
- Location:           apps/VCSM/src/features/feed/controllers/feedWelcomeCard.controller.js:12-14
                      apps/VCSM/src/features/feed/dal/feedWelcomeCard.dal.js:20-43
- Source:             actorId parameter accepted from hook caller — no session binding in controller
- Sink:               supabase.schema('vc').from('actor_onboarding_steps').upsert(...) [feedWelcomeCard.dal.js:27]
- Trust Boundary:     feedWelcomeCard.controller.js — must assert actorId matches session identity
- Impact:             Any authenticated actor who can invoke this controller with an arbitrary actorId
                      can mark another actor's welcome_feed_card onboarding step as 'completed'. On a
                      shared device or via compromised component, this suppresses the welcome card for
                      any targeted actor permanently.
- Evidence:
    // feedWelcomeCard.controller.js:12-14
    export async function ctrlMarkWelcomeCardSeen({ actorId }) {
      await markWelcomeFeedCardSeenDAL({ actorId })
      // No: if (actorId !== sessionActorId) throw — missing ownership check
    }

    // feedWelcomeCard.dal.js:20-43
    export async function markWelcomeFeedCardSeenDAL({ actorId }) {
      if (!actorId) throw new Error('markWelcomeFeedCardSeenDAL: actorId required')
      // actorId flows directly to upsert — DAL cannot verify session ownership
      await supabase.schema('vc').from('actor_onboarding_steps').upsert({ actor_id: actorId, ... })
    }

- Reproduction Steps:
    1. Obtain any target actor's UUID (visible in feed post data, share URLs, network responses).
    2. Invoke useFeedWelcomeCard hook (or the controller directly in dev) with target actorId.
    3. ctrlMarkWelcomeCardSeen passes actorId to markWelcomeFeedCardSeenDAL.
    4. vc.actor_onboarding_steps is upserted with step_key='welcome_feed_card', status='completed'.
    5. Target actor's welcome card is permanently suppressed.
    [Note: RLS on vc.actor_onboarding_steps is the sole backstop — unverified from source.
    CARNAGE review required to confirm DB-layer defence.]

- Existing Defense:   Non-null actorId guard in DAL (throws if missing). No other defence at
                      controller or hook layer.
- Why Defense Is Insufficient:
    Non-null guard confirms a value is present, not that it belongs to the authenticated session.
    The controller has no identity context binding. The DAL cannot verify session ownership.
    The sole authoritative backstop is Supabase RLS on vc.actor_onboarding_steps, which is
    unverified from source (see VEN-FEED-005/BW-FEED-005 — CARNAGE required).

- Recommended Fix:    Bind actorId to the authenticated session before the controller write.
                      Either: (a) derive actorId from session inside the hook — never accept from
                      component props; or (b) add explicit ownership assertion in the controller
                      that compares caller actorId against session identity.

- Suggested Patch:
    // OPTION A — Session binding at the hook layer (preferred)
    // apps/VCSM/src/features/feed/hooks/useFeedWelcomeCard.js
    // Replace: actorId from props/parent
    // With:
    import { useIdentityContext } from '@/features/identity/hooks/useIdentityContext'
    // const { actorId } = useIdentityContext() — session-derived, never from caller

    // OPTION B — Ownership assertion in the controller (defence-in-depth)
    // apps/VCSM/src/features/feed/controllers/feedWelcomeCard.controller.js
    import { getSessionActorIdDAL } from '@/features/auth/dal/session.dal'

    export async function ctrlMarkWelcomeCardSeen({ actorId }) {
      const sessionActorId = await getSessionActorIdDAL()
      if (!sessionActorId || actorId !== sessionActorId) {
        throw new Error('ctrlMarkWelcomeCardSeen: ownership check failed')
      }
      await markWelcomeFeedCardSeenDAL({ actorId })
    }

    // Note: CARNAGE must verify RLS on vc.actor_onboarding_steps before THOR gate.

- Follow-up Command:  Carnage (RLS verification on vc.actor_onboarding_steps), IRONMAN (implement patch)
```

---

```
SECURITY FINDING

- Finding ID:         ELEK-2026-06-06-002
- Title:              Auth/Session — logout() does not clear React Query cache; private feed data persists gcTime:10min
- Category:           Weak JWT/Session
- Severity:           HIGH
- Status:             Open
- Scope:              VCSM
- Location:           apps/VCSM/src/app/providers/AuthProvider.jsx:167-216
                      apps/VCSM/src/features/feed/hooks/useCentralFeed.js:87
- Source:             User initiates logout — all identity/session storage is cleared; navigate to /login
- Sink:               React Query in-memory cache — holds filterDebugRows (private post visibility
                      metadata for ALL fetched posts including invisible private ones)
- Trust Boundary:     AuthProvider.logout() — must clear all in-memory caches holding user-private data
- Impact:             After logout, React Query retains useCentralFeed cache for gcTime = 10 minutes.
                      filterDebugRows contains: { post_id, actor_id, visible, reason, is_private,
                      is_following, is_owner, actor_kind } for ALL rows including posts the viewer
                      was NOT supposed to see (private accounts, blocked actors). On a shared device,
                      the next user can access this cached data via JS console, DevTools, or a
                      React Query devtools panel before the gcTime window elapses.
- Evidence:
    // AuthProvider.jsx:167-216 — logout() full body
    const logout = async (navState = {}) => {
      setSession(null); setUser(null); setLoading(false)
      localStorage.removeItem('actor_kind')
      // ... clears sessionStorage identity keys ...
      navigate('/login', { replace: true, state: navState })
      await dalSignOut('local')
      dalRemoveAllRealtimeChannels()
      // ← NO queryClient.clear() call anywhere in logout()
    }

    // useCentralFeed.js:87
    gcTime: 10 * 60 * 1000,  // 10 minutes — cache persists after component unmount

    // useCentralFeed.js:111-120
    const filterDebugRows = useMemo(() => {
      // ... builds array of { post_id, actor_id, visible, reason, is_private, ... }
      // from ALL pages' debugRows — includes invisible private posts
    }, [data])

    // normalizeFeedRows.model.js:35-37
    if (includeDebug) {
      debugRows.push(visibility);  // visibility record for EVERY row, visible or not
    }

- Reproduction Steps:
    1. Log in as User A. Load the central feed (populated with filterDebugRows in RQ cache).
    2. Log out — AuthProvider.logout() runs, clears localStorage/sessionStorage, navigates to /login.
    3. React Query cache is NOT cleared. InMemory store retains feed data for up to 10 minutes.
    4. On a shared device, User B opens the app within the 10-minute window.
    5. If User B opens React Query DevTools or runs queryClient.getQueryCache() in console,
       filterDebugRows from User A's session is accessible — including private post metadata.
    [Primary risk: shared devices (family tablet, kiosk, public terminal).]

- Existing Defense:   None. localStorage and sessionStorage are cleared; queryClient is not.
- Why Defense Is Insufficient:
    React Query's in-memory cache is not a sessionStorage mechanism — it is not cleared by
    localStorage.clear() or navigation. The cache is bound to the QueryClient instance lifetime,
    which persists across routes. gcTime of 10 minutes means the data survives route change and
    component unmount.

- Recommended Fix:    Call queryClient.clear() inside logout() before navigate(). This immediately
                      evicts all queries from the in-memory cache. Also apply to logoutAllSessions().

- Suggested Patch:
    // apps/VCSM/src/app/providers/AuthProvider.jsx
    // Step 1: access the query client
    // (If AuthProvider is inside QueryClientProvider tree:)
    import { useQueryClient } from '@tanstack/react-query'

    // Inside the component body:
    const queryClient = useQueryClient()

    // Step 2: add clear() before navigate() in logout():
    const logout = async (navState = {}) => {
      // ... existing state clears ...
      queryClient.clear()                            // ← ADD: evict all RQ cache
      navigate('/login', { replace: true, state: navState })
      await dalSignOut('local')
      dalRemoveAllRealtimeChannels()
    }

    // Step 3: same change in logoutAllSessions() for consistency.

    // Note: If AuthProvider sits ABOVE QueryClientProvider in the tree, pass the
    // queryClient ref from a sibling context or restructure so the clear call is
    // inside a component with access to useQueryClient().

- Follow-up Command:  IRONMAN (implement patch — verify AuthProvider tree position relative
                      to QueryClientProvider before applying)
```

---

## MEDIUM FINDINGS

---

```
SECURITY FINDING

- Finding ID:         ELEK-2026-06-06-003
- Title:              Private post visibility metadata in production React Query cache (filterDebugRows)
- Category:           Secrets Exposure
- Severity:           MEDIUM
- Status:             Open
- Scope:              VCSM
- Location:           apps/VCSM/src/features/feed/pipeline/fetchFeedPage.pipeline.js:162
                      apps/VCSM/src/features/feed/queries/fetchCentralFeedPage.js:77,103
                      apps/VCSM/src/features/feed/hooks/useCentralFeed.js:111-120
- Source:             fetchFeedPagePipeline called with includeDebug: true — unconditional, no DEV gate
- Sink:               useCentralFeed.filterDebugRows — public hook API, persisted in React Query cache
- Trust Boundary:     fetchFeedPage.pipeline.js:162 — includeDebug flag must be DEV-gated
- Impact:             For every feed page load in production, normalizeFeedRows builds debugRows for
                      ALL fetched posts including invisible ones (private accounts, blocked actors).
                      Each debug row contains: { post_id, actor_id, visible, reason, is_private,
                      is_following, is_owner, actor_kind }. These rows are accumulated in the React
                      Query cache and exposed via filterDebugRows on the public useCentralFeed API.
                      Any developer with DevTools access, any React Query devtools panel, or any
                      compromised component consuming useCentralFeed can read visibility metadata
                      for posts the viewer was not supposed to know exist.
- Evidence:
    // pipeline:162 — UNCONDITIONAL (no import.meta.env.DEV guard)
    const { normalized, debugRows } = normalizeFeedRows({
      ...
      includeDebug: true,   // ← fires in both DEV and production
    });

    // fetchCentralFeedPage.js:77 — UNCONDITIONAL accumulation
    if (Array.isArray(debugRows)) allDebugRows.push(...debugRows)

    // fetchCentralFeedPage.js:103 — always in page result
    return { posts: normalizedChunk, debugRows: allDebugRows, ... }

    // useCentralFeed.js:111-120 — in public hook API
    const filterDebugRows = useMemo(() => {
      // builds Map of { post_id, actor_id, visible, reason, is_private, ... }
      // from ALL pages' debugRows
    }, [data])

    // normalizeFeedRows.model.js:35-37
    if (includeDebug) {
      debugRows.push(visibility);   // runs for ALL rows — visible AND invisible
    }

- Reproduction Steps:
    1. Build and deploy production bundle (import.meta.env.DEV = false).
    2. Log in, load the central feed.
    3. Open React Query DevTools or run queryClient.getQueryCache().getAll() in console.
    4. Inspect page results for any central-feed query — debugRows array contains visibility
       metadata for every fetched post including private/blocked posts.
    5. filterDebugRows is also returned from useCentralFeed() and accessible in any
       component that imports the hook.

- Existing Defense:   The debugger panels that display filterDebugRows are DEV-gated at render
                      level (DebugPrivacyPanel: three-layer DEV protection confirmed). However,
                      the DATA is generated and cached unconditionally regardless of DEV mode.
- Why Defense Is Insufficient:
    Gating the UI panel does not prevent the data from being generated and cached in production.
    The filterDebugRows array is in the public useCentralFeed return value — accessible to any
    consumer, not only the debug panel. The fix must gate the data generation, not only the display.

- Recommended Fix:    Gate includeDebug behind import.meta.env.DEV in the pipeline call. In a
                      Vite production build, the DEV constant is replaced with false at compile time,
                      tree-shaking will eliminate the debugRows generation path entirely.

- Suggested Patch:
    // apps/VCSM/src/features/feed/pipeline/fetchFeedPage.pipeline.js:162
    // Replace:
    includeDebug: true,
    // With:
    includeDebug: import.meta.env.DEV,

    // apps/VCSM/src/features/feed/queries/fetchCentralFeedPage.js:77
    // Optional — with the above fix, debugRows will always be [] in production.
    // Defence-in-depth: gate the accumulation too:
    if (import.meta.env.DEV && Array.isArray(debugRows)) allDebugRows.push(...debugRows)

    // Note: useCentralFeed.js does not require changes — filterDebugRows computed
    // from empty array will be [] in production after the pipeline fix.

- Follow-up Command:  IRONMAN (implement patch — simple one-line change + optional defence-in-depth line)
```

---

```
SECURITY FINDING

- Finding ID:         ELEK-2026-06-06-004
- Title:              Raw UUID postId in public-facing share URL — platform invariant violation + enumeration risk
- Category:           IDOR/BOLA (URL exposure)
- Severity:           MEDIUM
- Status:             Open
- Scope:              VCSM
- Location:           apps/VCSM/src/features/feed/hooks/useCentralFeedActions.js:246
- Source:             postId (UUID) from posts array — user-initiated share action
- Sink:               share URL string — copied to clipboard or passed to native share sheet,
                      visible to users and third-party apps receiving the share
- Trust Boundary:     handleShare() — must resolve to slug before URL construction
- Impact:             The generated share URL `${window.location.origin}/post/${postId}` exposes
                      the internal UUID as a public-facing path segment. Any recipient of the share
                      URL sees the raw UUID. Combined with the public-facing origin, this:
                      (1) Violates the platform invariant (no raw UUIDs in public URLs — see memory);
                      (2) Enables sequential enumeration of post UUIDs through share link collection;
                      (3) Exposes internal entity IDs to third-party apps that receive the native share.
                      Note: the /post/:id destination performs live DB visibility re-verification via
                      checkPostVisibilityDAL, so there is no auth bypass — this is an identifier
                      exposure and enumeration concern, not an authorization bypass.
- Evidence:
    // useCentralFeedActions.js:246
    const url = `${window.location.origin}/post/${postId}`
    // postId is the raw UUID from posts.find(p => p.id === postId)

- Reproduction Steps:
    1. Open the central feed. Tap the Share action on any post.
    2. Observe the generated URL in the native share sheet or copied clipboard content.
    3. URL contains raw UUID: e.g. https://app.vibezcitizens.com/post/550e8400-e29b-41d4-a716-446655440000
    4. UUID is visible to all share recipients and any intermediate sharing platform.

- Existing Defense:   Destination route performs live DB re-verification (checkPostVisibilityDAL).
                      No auth bypass at destination.
- Why Defense Is Insufficient:
    The fix required is not at the destination — it is at URL construction. The platform rule
    (no raw UUIDs in public URLs) applies at the point of URL generation, regardless of what
    happens at the destination. UUID exposure enables scraping and enumeration independently
    of whether the destination is protected.

- Recommended Fix:    Resolve post slug before URL construction. If posts carry a slug field
                      (or a stable human-readable identifier), use it. If not, this requires a
                      DAL change to fetch slug for the post, and a router change to accept slug
                      at the /post/:slug destination. IRONMAN should verify the post data shape
                      and existing slug field status before implementing.

- Suggested Patch:
    // apps/VCSM/src/features/feed/hooks/useCentralFeedActions.js:246
    // Replace:
    const url = `${window.location.origin}/post/${postId}`
    // With (if post carries a slug field):
    const post = posts.find((p) => p.id === postId)
    const postSlug = post?.slug ?? null
    if (!postSlug) {
      // fallback: do not construct share URL without a slug — surface error
      setShareState({ open: false, postId: null, url: '' })
      return
    }
    const url = `${window.location.origin}/post/${postSlug}`

    // Note: requires vc.posts to expose slug column, DAL to select it,
    // and router to accept /post/:slug — IRONMAN + CARNAGE scope assessment needed.

- Follow-up Command:  IRONMAN (slug availability assessment + patch implementation)
```

---

```
SECURITY FINDING

- Finding ID:         ELEK-2026-06-06-005
- Title:              Illusory viewerActorId guard in listActorPosts — validated but never used
- Category:           Auth Bypass
- Severity:           MEDIUM
- Status:             Open
- Scope:              VCSM
- Location:           apps/VCSM/src/features/feed/controllers/listActorPosts.controller.js:33-37
- Source:             viewerActorId parameter accepted and validated as non-empty — but discarded
- Sink:               listActorPostsByActorDAL({ actorId }) — no viewerActorId passed, no visibility model
- Trust Boundary:     listActorPosts controller — viewerActorId validation creates false security signal
- Impact:             The controller comment "RLS enforces visibility & privacy" asserts that DB-layer
                      RLS is the sole visibility enforcement for the profile posts path. The app-layer
                      has no visibility model applied (contrast: central feed applies
                      resolveFeedRowVisibilityModel via normalizeFeedRows). This means:
                      (1) The viewerActorId check throws if missing (correct) but passes if any
                          non-empty string is provided — the check confirms presence, not authenticity.
                      (2) viewerActorId is never passed to the DAL, making the guard meaningless for
                          data filtering — RLS at the DB layer is the sole defence.
                      (3) If RLS on vc.posts for the profile posts query is permissive, private posts
                          for private accounts are visible to all authenticated callers.
                      (CARNAGE verification of vc.posts RLS required before severity can be upgraded.)
- Evidence:
    // listActorPosts.controller.js:33-37
    export async function listActorPosts({ actorId, viewerActorId, limit }) {
      if (!actorId) throw new Error("Missing actorId");
      if (!viewerActorId) throw new Error("Missing viewerActorId");
      return listActorPostsByActorDAL({ actorId, ...(limit != null && { limit }) });
      // viewerActorId validated for non-empty but NEVER passed to DAL
    }

    // listActorPostsByActorDAL — only filters:
    // .eq("actor_id", actorId).is("deleted_at", null)
    // NO: block check, follow check, privacy check, viewer scoping

- Reproduction Steps:
    1. Navigate to any actor's profile tab (Posts or Photos).
    2. The component calls listActorPosts({ actorId: targetActor, viewerActorId: authenticatedActor }).
    3. Controller validates viewerActorId !== falsy → throws only if completely absent.
    4. DAL is called with actorId only — viewerActorId discarded.
    5. RLS on vc.posts determines whether private posts of the target actor are visible.
    6. If RLS allows authenticated-user access to all posts (regardless of privacy), private posts
       are returned without app-layer visibility filtering.

- Existing Defense:   viewerActorId non-null guard at controller level. RLS on vc.posts (assumed,
                      unverified from source — CARNAGE required).
- Why Defense Is Insufficient:
    A non-null guard confirms a value is present, not that it belongs to the session. The guard
    creates the appearance of auth-awareness while providing none — the parameter is never used
    in the data access path. There is no app-layer visibility model applied (unlike central feed).

- Recommended Fix:    Either: (a) pass viewerActorId to listActorPostsByActorDAL and apply an
                      app-layer visibility filter equivalent to resolveFeedRowVisibilityModel; or
                      (b) confirm that RLS on vc.posts enforces full privacy/block/follow visibility
                      for all authenticated callers (CARNAGE gate). The controller comment
                      "RLS enforces visibility & privacy" is an assertion — not a verification.

- Suggested Patch:
    // Option A — pass viewerActorId through to DAL for app-layer visibility filtering
    // apps/VCSM/src/features/feed/controllers/listActorPosts.controller.js
    export async function listActorPosts({ actorId, viewerActorId, limit }) {
      if (!actorId) throw new Error("Missing actorId");
      if (!viewerActorId) throw new Error("Missing viewerActorId");
      // Pass viewerActorId — DAL and/or model must use it for filtering
      return listActorPostsByActorDAL({ actorId, viewerActorId, ...(limit != null && { limit }) });
    }

    // Option B — confirm RLS is sufficient via CARNAGE, document verified assertion in controller
    // (CARNAGE outcome determines which option is correct)

- Follow-up Command:  Carnage (verify vc.posts RLS for profile posts path — block/privacy/follow
                      enforcement for authenticated callers), IRONMAN (patch after CARNAGE confirms scope)
```

---

## INFO FINDINGS

---

```
SECURITY FINDING

- Finding ID:         ELEK-2026-06-06-006
- Title:              Unconditional @debuggers module imports in three production-facing files
- Category:           Secrets Exposure (hygiene)
- Severity:           INFO
- Status:             Open
- Scope:              VCSM
- Location:           apps/VCSM/src/features/feed/pipeline/fetchFeedPage.pipeline.js:22
                      apps/VCSM/src/features/feed/hooks/useCentralFeed.js:16
                      apps/VCSM/src/features/feed/screens/CentralFeedScreen.jsx:16-17
- Source:             ES module import statement — executed at module evaluation time
- Sink:               @debuggers/feed/feedProfiler — wrapDAL, recordStep; @debuggers/feed — debugFeedEvent, debugFeedResult
- Trust Boundary:     Module import — must be conditional or tree-shaken
- Impact:             The module imports themselves execute at bundle evaluation time. While Vite's
                      import.meta.env.DEV compile-time constant (replaced with false in production builds)
                      means all USE of debugger functions is tree-shaken in production, the module
                      import statement is still present and the @debuggers module bundle is included
                      in the dependency graph. If @debuggers modules contain any top-level side effects,
                      they execute in production. Confirmed: wrapDAL guards are DEV-gated (lines 24-60
                      of pipeline); debugFeedEvent/debugFeedResult calls in useCentralFeed:199 are
                      DEV-gated. This is a code hygiene / defence-in-depth concern — no active exploit
                      path confirmed in Vite/Rollup build.
- Evidence:
    // pipeline:22 — unconditional import
    import { wrapDAL, recordStep } from "@debuggers/feed/feedProfiler";
    // All usages are DEV-guarded — but import itself is unconditional

    // useCentralFeed.js:16 — unconditional import
    import { debugFeedEvent, debugFeedResult } from '@debuggers/feed'
    // Usage at line 199: if (!import.meta.env.DEV) return — correctly guarded

    // CentralFeedScreen.jsx:16-17 — unconditional imports
    import ... from '@debuggers/feed'
    import ... from '@debuggers/identity'

- Existing Defense:   All call sites are DEV-guarded. Vite tree-shaking eliminates dead branches.
- Why Defense Is Insufficient:
    Module-level imports are not tree-shaken unless the export is provably unused OR the module
    has no side effects (declared in package.json sideEffects: false). If @debuggers modules lack
    sideEffects declaration, the modules are bundled. The actual risk is low in practice — this
    is a hygiene concern, not an active exploit path.

- Recommended Fix:    Convert unconditional imports to dynamic DEV-only imports, or verify that
                      @debuggers modules declare sideEffects: false in their package.json.

- Suggested Patch:
    // Option A — dynamic import pattern (pipeline:22)
    // Remove: import { wrapDAL, recordStep } from "@debuggers/feed/feedProfiler";
    // The wrapDAL assignments (lines 24-60) are already DEV-conditional — no change needed to logic.
    // Move the import inside the DEV conditional block only if bundler analysis confirms inclusion.

    // Option B — verify @debuggers sideEffects declaration
    // Check: apps/VCSM/src/dev/debuggers/package.json or equivalent for:
    // "sideEffects": false
    // If present: tree-shaking already handles this correctly. Mark INFO as RESOLVED_HYGIENE.

- Follow-up Command:  IRONMAN (verify @debuggers sideEffects declaration; implement dynamic import
                      if side effects cannot be ruled out)
```

---

## FALSE POSITIVES REJECTED

---

```
FALSE POSITIVE REJECTED

- Candidate:          Unguarded console.log in fetchFeedPage.pipeline.js:137 fires in production
- Location:           apps/VCSM/src/features/feed/pipeline/fetchFeedPage.pipeline.js:137-141
- Rejection reason:   Source independently confirmed full DEV guard at call site
- Chain gap:          Defense confirmed — does NOT reach production
- Evidence:
    // pipeline:137
    if (import.meta.env.DEV && debugPostId && pagePostIds.includes(debugPostId)) {
      console.log("[useFeed][mentions][DBG] debugPostId is on this page", { ... })
    }
    // Triple-condition guard. In production build: import.meta.env.DEV = false at compile time.
    // Additionally, debugPostId is never passed by fetchCentralFeedPage (the sole caller) —
    // parameter is undefined/absent at runtime even in DEV.
- Notes:              Prior VEN-FEED-002 (2026-06-04) marked this as MEDIUM. CLOSED_SOURCE_VERIFIED
                      by VENOM re-verify 2026-06-06. ELEKTRA confirms: no exploit path.
```

---

```
FALSE POSITIVE REJECTED

- Candidate:          getDebugPrivacyRows controller exposes private post visibility in production
                      via ?debug=all URL parameter
- Location:           apps/VCSM/src/features/feed/screens/DebugPrivacyPanel.jsx
                      apps/VCSM/src/features/feed/controllers/getDebugPrivacyRows.controller.js
- Rejection reason:   Three-layer DEV protection confirmed source-verified
- Chain gap:          Defense confirmed at three independent layers — cannot reach production
- Evidence:
    // Layer 1 — screen-level: const isDev = import.meta.env.DEV (compile-time false in production)
    // Layer 2 — query: enabled: isDev — React Query never fetches in production
    // Layer 3 — render: if (!isDev || !rows.length) return null — component renders nothing
    // All three guards use import.meta.env.DEV — tree-shaken to false in production build.
- Notes:              Prior BW-FEED-008 (2026-06-04) marked as HIGH THOR BLOCKER. CLOSED_SOURCE_VERIFIED
                      by both VENOM and BLACKWIDOW re-verify 2026-06-06. ELEKTRA confirms: THOR blocker RESOLVED.
```

---

```
FALSE POSITIVE REJECTED

- Candidate:          Unconditional @debuggers imports escalated to HIGH severity (bundle code injection risk)
- Location:           pipeline:22, useCentralFeed:16, CentralFeedScreen:16-17
- Rejection reason:   No confirmed exploit path from module imports in Vite production build
- Chain gap:          Impact — cannot trace from unconditional import to user-accessible data exposure
                      or code execution beyond what is tree-shaken
- Notes:              VEN-FEED-008 rated this MEDIUM (bundle risk). ELEKTRA downgrades to INFO.
                      In Vite, import.meta.env.DEV is a compile-time constant. All actual debugger
                      call sites are DEV-guarded. Bundle inclusion of @debuggers modules is a
                      hygiene concern, not an active security exploit. Retain as ELEK-2026-06-06-006 (INFO).
```

---

## SUGGESTED PATCH QUEUE

| # | Finding ID | Title | Severity | Layer to Patch | Patch Complexity | Requires DB Change |
|---|---|---|---|---|---|---|
| 1 | ELEK-2026-06-06-001 | IDOR — ctrlMarkWelcomeCardSeen no session binding | HIGH | Controller + Hook | SIMPLE | YES (CARNAGE verify RLS) |
| 2 | ELEK-2026-06-06-002 | Logout missing queryClient.clear() — cache residue | HIGH | Auth Provider | SIMPLE | NO |
| 3 | ELEK-2026-06-06-003 | includeDebug: true unconditional — debug data in production cache | MEDIUM | Pipeline | SIMPLE | NO |
| 4 | ELEK-2026-06-06-004 | Raw UUID postId in share URL | MEDIUM | Hook + DAL + Router | MODERATE | YES (slug column) |
| 5 | ELEK-2026-06-06-005 | viewerActorId discarded — illusory guard | MEDIUM | Controller + DAL | MODERATE | YES (CARNAGE verify RLS) |
| 6 | ELEK-2026-06-06-006 | Unconditional @debuggers imports | INFO | Pipeline/Hook/Screen | SIMPLE | NO |

---

## REQUIRED FOLLOW-UP COMMANDS

| Command | Reason | Status |
|---|---|---|
| CARNAGE | Verify RLS on vc.actor_onboarding_steps (ELEK-001 DB backstop) | PENDING — CRITICAL PATH |
| CARNAGE | Verify RLS on vc.posts for profile posts path (ELEK-005 / BW-FEED-NEW-002) | PENDING — CRITICAL PATH |
| CARNAGE | Verify RLS on vport.profiles (VEN-FEED-005) | PENDING — CRITICAL PATH |
| IRONMAN | Implement ELEK-001 patch: session binding at hook or controller layer | PENDING |
| IRONMAN | Implement ELEK-002 patch: queryClient.clear() in logout() | PENDING |
| IRONMAN | Implement ELEK-003 patch: gate includeDebug behind import.meta.env.DEV | PENDING |
| IRONMAN | Assess slug availability for ELEK-004 share URL fix | PENDING |
| IRONMAN | Fix useFeed.adapter.js re-export to useCentralFeed (VEN-FEED-009) | PENDING |
| VENOM | Cross-reference VEN-FEED-004 (viewerActorId illusory guard) — confirmed as ELEK-005 | REFERENCE |
| BLACKWIDOW | BW-FEED-NEW-001 confirmed as ELEK-002; BW-FEED-NEW-002 feeding into ELEK-005 | REFERENCE |
| THOR | Release gate — blocked until ELEK-001 + ELEK-002 resolved + CARNAGE gate cleared | BLOCKED |

---

## THOR RELEASE GATE ASSESSMENT

**ELEKTRA Recommendation: CAUTION — BLOCKED**

| Blocker | Severity | Status | Resolution Path |
|---|---|---|---|
| ELEK-2026-06-06-001 — IDOR: welcome card ownership | HIGH | OPEN | IRONMAN patch + CARNAGE RLS verify |
| ELEK-2026-06-06-002 — Auth: logout cache residue | HIGH | OPEN | IRONMAN patch (queryClient.clear) |
| BW-FEED-NEW-002 — Profile posts no app-layer visibility model | HIGH | OPEN | CARNAGE verify + IRONMAN |
| VEN-FEED-005 — vport.profiles RLS unverified | HIGH | NOT_VERIFIABLE | CARNAGE |

**Resolved this run (no longer THOR blockers):**
- BW-FEED-008 (debug privacy controller production exposure): CLOSED_SOURCE_VERIFIED — three-layer DEV protection confirmed

**Cleared from THOR gate (MEDIUM with no direct exploit path):**
- ELEK-2026-06-06-003, 004, 005, 006: CAUTION items — do not individually block THOR but should be patched before release

---

## FINDING STATUS CROSS-REFERENCE

| Prior Finding | Source | ELEKTRA Status | Notes |
|---|---|---|---|
| VEN-FEED-001 (BEHAVIOR.md placeholder) | VENOM | OUT_OF_SCOPE | Documentation gap — LOGAN route; no security exploit path |
| VEN-FEED-003 / BW-FEED-004 (actorId as userId in debug controller) | VENOM/BW | OUT_OF_SCOPE | DEV-only controller — no production path confirmed |
| VEN-FEED-004 (viewerActorId discarded) | VENOM | CONFIRMED → ELEK-2026-06-06-005 | Chain traced — MEDIUM |
| VEN-FEED-005 (vport.profiles RLS unverified) | VENOM | NOT_VERIFIABLE — CARNAGE required | Cannot verify from source |
| VEN-FEED-007 (filterDebugRows in production cache) | VENOM | CONFIRMED → ELEK-2026-06-06-003 | Chain traced — MEDIUM |
| VEN-FEED-008 (unconditional debugger imports) | VENOM | DOWNGRADED → ELEK-2026-06-06-006 (INFO) | Vite tree-shaking analysis |
| VEN-FEED-009 (useFeed.adapter.js frozen) | VENOM | OUT_OF_SCOPE | Architecture integrity gap — IRONMAN route; no exploit chain |
| BW-FEED-001 (ctrlMarkWelcomeCardSeen no ownership) | BW | CONFIRMED → ELEK-2026-06-06-001 | Chain traced — HIGH IDOR |
| BW-FEED-002 (feed hooks delegate actorId) | BW | PARTIAL — absorbed into ELEK-001 context | Session binding gap — same root cause |
| BW-FEED-005 (actor_onboarding_steps RLS unverified) | BW | NOT_VERIFIABLE — CARNAGE required | Cannot verify from source |
| BW-FEED-006 (60s stale block cache) | BW | OUT_OF_SCOPE (this run) | Timing/cache — LOW, no direct chain to exploit |
| BW-FEED-007 (share URL raw UUID) | BW | CONFIRMED → ELEK-2026-06-06-004 | Chain traced — MEDIUM |
| BW-FEED-NEW-001 (logout no queryClient.clear) | BW | CONFIRMED → ELEK-2026-06-06-002 | Chain traced — HIGH |
| BW-FEED-NEW-002 (profile posts no app-layer visibility) | BW | CONFIRMED → ELEK-2026-06-06-005 + CARNAGE | Chain traced — MEDIUM; DB layer unverified |
| BW-FEED-NEW-003 (filterDebugRows in cache) | BW | CONFIRMED → ELEK-2026-06-06-003 | Same chain as VEN-FEED-007 — MEDIUM |

---

*ELEKTRA scan complete. All chains source-verified. Report persisted to disk.*
*SECURITY.md ELEKTRA STATUS section updated (Write 2).*
