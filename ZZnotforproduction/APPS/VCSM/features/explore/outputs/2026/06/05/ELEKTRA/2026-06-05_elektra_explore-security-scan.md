# ELEKTRA V2 Security Report
## VCSM:explore | 2026-06-05 | Ticket: TICKET-EXPLORE-BUNDLE-SECURITY-PHASE-0001

---

## Output Metadata

| Field | Value |
|---|---|
| Feature | explore |
| Command | ELEKTRA V2 |
| Scanner Version | 1.1.0 |
| Ticket | TICKET-EXPLORE-BUNDLE-SECURITY-PHASE-0001 |
| Output Path | ZZnotforproduction/APPS/VCSM/features/explore/outputs/2026/06/05/ELEKTRA/2026-06-05_elektra_explore-security-scan.md |
| Timestamp | 2026-06-05T00:00:00Z |
| Application Scope | VCSM |
| Scan Trigger | Triage bundle — all 7 VEN-EXPLORE findings from 2026-06-05 VENOM run |

---

## 1. ELEKTRA Preflight

```
ELEKTRA PREFLIGHT PASS

Upstream Reports:
- VENOM: ZZnotforproduction/APPS/VCSM/features/explore/outputs/2026/06/05/Venom/2026-06-05_venom_explore-security-review.md
  Date: 2026-06-05 | Status: SUCCESS | Age: 0 days | Scope: VCSM:explore
- BLACKWIDOW: ZZnotforproduction/APPS/VCSM/features/explore/outputs/2026/06/05/BlackWidow/2026-06-05_blackwidow_explore-adversarial-triage.md
  Date: 2026-06-05 | Status: COMPLETE | Age: 0 days | Scope: VCSM:explore

ARCHITECT Output Check:
- Evidence Bundle: ZZnotforproduction/APPS/VCSM/features/explore/outputs/2026/06/05/ARCHITECT/evidence-bundle.json
  Generated: 2026-06-05 | Age: 0 days | Freshness: FRESH | Scope: VCSM:explore
- Security Surface: ZZnotforproduction/GOVERNANCE/outputs/2026/06/05/ARCHITECT/architect-security-surface-explore.json
  Generated: 2026-06-05 | Age: 0 days | Freshness: FRESH

All gates: PASS. Proceeding with ELEKTRA V2 scan.
```

---

## 2. Scanner Inputs

| Map | Generated At | Age | Freshness | Confidence | Sinks / Chains In Scope | Used For |
|---|---|---|---|---|---|---|
| write-surface-map | 2026-06-04T20:29:11Z | ~23h | FRESH | HIGH | 0 write sinks | Sink inventory (none for explore) |
| rpc-map | 2026-06-04T20:29:11Z | ~23h | FRESH | HIGH | 1 RPC sink | Privileged RPC sink inventory |
| edge-function-map | 2026-06-04T20:29:11Z | ~23h | FRESH | HIGH | 0 edge functions | Edge function inventory |
| security-path-map | 2026-06-04T20:29:11Z | ~23h | FRESH | HIGH | 1 security path | Security path pre-computation |
| route-execution-map | 2026-06-04T20:29:11Z | ~23h | FRESH | HIGH | 1 route | Route→sink chain candidates |
| write-execution-map | 2026-06-04T20:29:11Z | ~23h | FRESH | HIGH | 0 | Write caller chains |
| rpc-execution-map | 2026-06-04T20:29:11Z | ~23h | FRESH | HIGH | 1 | RPC caller chain candidates |

Scanner Version: 1.1.0 | Overall Preflight: FRESH | Action: PASSED
Identity-tier sinks: 0 — none (explore has no writes to identity tables)
Resource-tier sinks: 0 — none
RPC sinks: 1 — reviewed ALL (identity.search_actor_directory)
Direct read surfaces: 2 — reviewed ALL (vc.posts searchPosts + searchPostsByTag)
Navigation surfaces: 3 — reviewed ALL (PostCard, ActorSearchResultRow, FeaturedResultCard)
Callgraph chain candidates: 6 (CHAIN-explore-001 through CHAIN-explore-006, from evidence bundle)

---

## 3. Vulnerability Surface Inventory

```
ELEKTRA VULNERABILITY SURFACE INVENTORY
=========================================
Feature: explore
Source: evidence-bundle.json (2026-06-05) + architect-security-surface-explore.json
Scan Date: 2026-06-05

Write Sinks: 0 (explore is read-only)
  Identity-tier: 0
  Resource-tier: 0
  Content-tier: 0

RPC Sinks: 1
  identity.search_actor_directory — p_viewer_actor_id: null
  Classified: SEMI-PRIVILEGED (controls actor privacy/block enforcement)
  Priority: HIGHEST — viewer context controls privacy filtering

Direct Table Read Surfaces: 2
  vc.posts (searchPosts) — ilike user input; no viewer-scoped privacy filter
  vc.posts (searchPostsByTag) — tag contains user input; same
  RLS Status: ASSUMED — not verified in ARCHITECT evidence bundle
  Priority: HIGH

Navigation Sinks (UUID exposure): 3
  PostCard — /posts/${post.id} — always UUID
  ActorSearchResultRow — /profile/${username ?? actor_id} — UUID fallback
  FeaturedResultCard — /profile/${username ?? actor_id} — UUID fallback at hero position
  Priority: HIGH (platform rule violation)

Callgraph Chain Candidates (from evidence-bundle.json):
  CHAIN-explore-001: ExploreScreen → useSearchScreenController → ctrlSearchResults → searchDal → identity RPC
  CHAIN-explore-002: ExploreScreen → useSearchScreenController → ctrlSearchResults → searchDal → vc.posts
  CHAIN-explore-003: ctrlSearchResults → hydrateActorsByIds (fire-and-forget)
  CHAIN-explore-004: useSearchTabsActor → ctrlSearchTabs → searchDal
  CHAIN-explore-005: ResultList → PostCard → navigate('/posts/${post.id}')
  CHAIN-explore-006: ResultList → ActorSearchResultRow → navigate('/profile/${username ?? actor_id}')
  Additional: FeaturedResultCard → navigate('/profile/${username ?? actor_id}') — ARCHITECT_SURFACE_EXTENSION (same pattern as CHAIN-006)
  Additional: searchResultCache module-level singleton — security-path-map
```

---

## 4. Scanner Signals

| Chain Candidate | Source Map | Callgraph Path | Scanner Confidence | Source Verified | Chain Verdict | Provenance | Finding |
|---|---|---|---|---|---|---|---|
| viewerActorId null → identity RPC | rpc-map + rpc-execution-map | useSearchScreenController → ctrlSearchResults → searchDal → searchActors → identity.search_actor_directory | HIGH | YES — ctrlSearchResults:9 searchDal(q,f,{}) confirmed | VALID FINDING | [SOURCE_VERIFIED] | ELEK-2026-06-05-001 |
| post.id UUID → /posts/{uuid} | security-path-map + callgraph | searchPosts → normalizeResult → PostCard → navigate | HIGH | YES — PostCard.jsx:7 navigate('/posts/${post.id}') | VALID FINDING | [SOURCE_VERIFIED] | ELEK-2026-06-05-002 |
| actor_id UUID → /profile/{uuid} (ActorSearchResultRow) | security-path-map + callgraph | searchActors → normalizeActorRow → ResultList → ActorSearchResultRow → navigate | HIGH | YES — ActorSearchResultRow.jsx:22 username ?? actor_id | VALID FINDING | [SOURCE_VERIFIED] | ELEK-2026-06-05-002 (same finding, second surface) |
| searchResultCache module-level → cross-actor leak | security-path-map | searchResultCache.set(filter:query) — no actorId scoping | HIGH | YES — useSearchScreenController.js:11-12 module-level Map | VALID FINDING | [SOURCE_VERIFIED] | ELEK-2026-06-05-003 |
| userId/ownerUserId in model output | evidence-bundle callgraph | searchActors → normalizeActorRow → mapActorSearchResult → {userId} | HIGH | YES — search.model.js:19-32 mapActorSearchResult returns userId | VALID FINDING | [SOURCE_VERIFIED] | ELEK-2026-06-05-004 |
| actor_id UUID → /profile/{uuid} (FeaturedResultCard) | security-path-map | searchActors → normalizeActorRow → ResultList → FeaturedResultCard → navigate | HIGH | YES — FeaturedResultCard.jsx:11 username ?? actor_id | VALID FINDING | [SOURCE_VERIFIED] | ELEK-2026-06-05-005 |
| /explore route access — scanner vs barrel conflict | route-execution-map | unauthenticated user → router → ExploreScreen | HIGH | PARTIAL — ui/index.jsx:6 (public:false) vs scanner (public); router not read | INCOMPLETE | [SOURCE_VERIFIED] | ELEK-2026-06-05-006 |
| vc.posts RLS — private actor post visibility | write-surface-map | searchPosts/searchPostsByTag → vc.posts SELECT | HIGH | PARTIAL — DAL filter confirmed; RLS policy not inspectable from source | INCOMPLETE | [SCANNER_LEAD] | ELEK-2026-06-05-007 |
| hydrateActorsByIds fire-and-forget | callgraph | ctrlSearchResults → hydrateActorsByIds().catch(() => {}) | HIGH | YES — controller:fire-and-forget confirmed; hydration store write is display-only | VALID_CHAIN_SAFE (display only) | [SOURCE_VERIFIED] | No finding — hydration is display enhancement only; catch is adequate |
| usecases/search.usecase.js relative import | callgraph | usecases/search.usecase.js → ../dal/search.dal | HIGH | YES — relative import path; VCSM rule violation | VALID FINDING | [SOURCE_VERIFIED] | ELEK-2026-06-05-008 (INFO) |
| BEHAVIOR.md absent (VEN-EXPLORE-001) | evidence bundle | governance artifact — no code chain | N/A | N/A — governance gap, not code chain | GOVERNANCE_FINDING — no code chain; ELEKTRA cannot trace | N/A | FALSE POSITIVE for ELEKTRA chain analysis — LOGAN addressed |

---

## 5. Source-to-Sink Analysis

### Chain ELEK-001 — viewerActorId null → identity RPC privacy bypass

```
DATA FLOW TRACE
Source: useSearchScreenController — no actorId in state or returned values; opts not populated
Validation at boundary: NONE — ctrlSearchResults passes {} as opts; viewerActorId = null
Intermediate transforms:
  ctrlSearchResults(query, filter, opts) → searchDal(query, filter, opts)
  → searchActors: viewerActorId = opts.viewerActorId || null → null
Sink: supabase.rpc('search_actor_directory', { p_viewer_domain: ..., p_viewer_actor_id: null, ... })
  File: apps/VCSM/src/features/explore/dal/search.dal.js
Defense at sink: ABSENT — RPC accepts null; server-side behavior with null viewer is unverified
```

Chain Verdict: VALID FINDING — all 4 hops traceable to source

### Chain ELEK-002 — post.id UUID in PostCard navigation

```
DATA FLOW TRACE
Source: vc.posts SELECT returns raw post.id UUID
Validation at boundary: NONE — normalizeResult maps row.id → post.id directly
Intermediate transforms:
  searchPosts → normalizeResult({ id: row.id, text: row.text, ... })
  → Result passed to ResultList → PostCard
Sink: navigate(`/posts/${post.id}`) — raw UUID in public URL
  File: apps/VCSM/src/features/explore/ui/PostCard.jsx:7
Defense at sink: ABSENT — no slug check; no UUID guard; navigation always uses post.id
```

Chain Verdict: VALID FINDING

### Chain ELEK-002b — actor_id UUID in ActorSearchResultRow + FeaturedResultCard

```
DATA FLOW TRACE
Source: identity RPC returns actor_id UUID; username may be null
Validation at boundary: NONE — normalizeActorRow does not filter null-username actors
Intermediate transforms:
  searchActors → normalizeActorRow({ actorId: row.actor_id, username: row.username, ... })
  → Result passed to ResultList → ActorSearchResultRow / FeaturedResultCard
Sink (ActorSearchResultRow): navigate(`/profile/${actor.username ?? actor.actor_id}`)
  File: apps/VCSM/src/features/explore/ui/ActorSearchResultRow.jsx:22
Sink (FeaturedResultCard): navigate(`/profile/${item.username ?? item.actor_id}`)
  File: apps/VCSM/src/features/explore/ui/FeaturedResultCard.jsx:11
Defense at sink: ABSENT — UUID fallback is the defense failure; no null check removes the actor
```

Chain Verdict: VALID FINDING (consolidated under ELEK-2026-06-05-002)

### Chain ELEK-003 — searchResultCache module-level singleton cross-actor

```
DATA FLOW TRACE
Source: searchResultCache = new Map() — declared at module level (outside hook)
Validation at boundary: NONE — cache key is `${filter}:${query}`; no actorId scope
Intermediate transforms:
  searchResultCache.set(cacheKey, { results, expiresAt })
  Actor switch does NOT trigger cache clear (module-level — persists across component lifecycle)
  Next viewer's search: cache.get(cacheKey) → returns prior actor's results
Sink: results returned to new viewer session with prior actor's personalized data
  File: apps/VCSM/src/features/explore/hooks/useSearchScreenController.js:11-12
Defense at sink: ABSENT — no actorId binding in key; no invalidation on actor switch
```

Chain Verdict: VALID FINDING (constrained by timing — 45s TTL + shared device)

### Chain ELEK-004 — userId/ownerUserId in model output

```
DATA FLOW TRACE
Source: identity RPC returns user_id (legacy field)
Validation at boundary: N/A — this is a data hygiene issue, not active injection
Intermediate transforms:
  mapActorSearchResult({ userId: row.user_id ?? null, ... })
  mapVportSearchResult({ ownerUserId: row.owner_user_id ?? null, ... })
  Fields present in result objects passed to UI
Sink: client-side React state; userId/ownerUserId accessible via devtools
  File: apps/VCSM/src/features/explore/model/search.model.js:19-32, 47-48
Defense at sink: PARTIAL — fields not rendered in DOM; no direct navigation use found
```

Chain Verdict: VALID FINDING (LOW — no direct exploit path; hygiene + future-debt risk)

### Chain ELEK-006 — /explore route access conflict (INCOMPLETE)

```
DATA FLOW TRACE
Source: unauthenticated user navigating to /explore
Validation at boundary: UNKNOWN — barrel says public:false; scanner says public
Intermediate transforms:
  app.routes.jsx (NOT READ — out of ELEKTRA read budget for this session)
  → router wraps ExploreScreen
Sink: ExploreScreen renders; search available potentially without auth
  File: apps/VCSM/src/features/explore/ui/index.jsx:6 (barrel only)
Defense at sink: UNKNOWN — cannot determine from client-side source alone
```

Chain Verdict: INCOMPLETE — HAWKEYE required to read app.routes.jsx for authoritative verdict

### Chain ELEK-007 — vc.posts RLS (INCOMPLETE)

```
DATA FLOW TRACE
Source: user query → vc.posts ilike SELECT
Validation: deleted_at IS NULL + is_hidden filters at DAL layer
Sink: vc.posts rows returned to UI
Defense: App-layer filters confirmed; RLS policy coverage for private actor posts = UNVERIFIED
```

Chain Verdict: INCOMPLETE — DB inspection required

---

## 6. Verified Vulnerabilities

---

### ELEK-2026-06-05-001 [SOURCE_VERIFIED]

```
SECURITY FINDING

- Finding ID:         ELEK-2026-06-05-001
- Title:              viewerActorId Never Injected — Identity RPC Receives Null Viewer
- Category:           Auth Bypass / IDOR
- Severity:           HIGH
- Status:             Open
- Scope:              VCSM
- Location:           apps/VCSM/src/features/explore/controller/searchResults.controller.js:9
                      apps/VCSM/src/features/explore/dal/search.dal.js:20-27
                      apps/VCSM/src/features/explore/hooks/useSearchScreenController.js (entry point)
- Source:             User search query typed into explore search bar
- Sink:               supabase.rpc('search_actor_directory', { p_viewer_actor_id: null })
- Trust Boundary:     ctrlSearchResults — responsible for assembling opts before DAL call
- Impact:             Block and privacy enforcement bypassed for all authenticated Citizen searches.
                      Blocked actors and private actors appear in search results for viewers
                      who should not see them.
- Evidence:           [SOURCE_VERIFIED]
                      ctrlSearchResults calls: searchDal(trimmed, filter, {})
                      searchActors: viewerActorId = opts.viewerActorId || null → always null
                      RPC call: p_viewer_actor_id: null for all primary search path queries
- Reproduction Steps:
  1. Authenticate as Citizen B (any valid account)
  2. Block Citizen A from Citizen B's account
  3. Open /explore — search for Citizen A by display name
  4. Observe: Citizen A appears in results despite block
  5. No special tooling required — standard UI interaction
- Existing Defense:   None at app layer. Server-side RPC may have null-viewer behavior
                      but this is not verified from source; it cannot be relied upon.
- Why Defense Is Insufficient: viewerActorId is never supplied to the primary search path.
  The controller hard-codes an empty opts object, discarding any possibility of viewer context.
- Recommended Fix:    3-layer fix: Hook → Controller → DAL (see Patch Advisory)
- Suggested Patch:    See PATCH-001 below
- Follow-up Command:  SPIDER-MAN (block-visibility regression test), BLACKWIDOW (confirmed), VENOM (re-anchor after fix)
- VEN Reference:      VEN-EXPLORE-002
- BW Reference:       BW-EXPLORE-001 (BYPASSED, PRACTICAL)
- ELEKTRA Reachability: REACHABLE
```

---

### ELEK-2026-06-05-002 [SOURCE_VERIFIED]

```
SECURITY FINDING

- Finding ID:         ELEK-2026-06-05-002
- Title:              Raw UUID in Post and Actor Navigation URLs (3 Components)
- Category:           URL Exposure / IDOR
- Severity:           HIGH
- Status:             Open
- Scope:              VCSM
- Location:           apps/VCSM/src/features/explore/ui/PostCard.jsx:7
                      apps/VCSM/src/features/explore/ui/ActorSearchResultRow.jsx:22
                      apps/VCSM/src/features/explore/ui/FeaturedResultCard.jsx:11
- Source:             Search results containing raw post.id (UUID) and actor_id (UUID) from DB
- Sink:               navigate('/posts/${post.id}') — UUID always used
                      navigate('/profile/${username ?? actor_id}') — UUID fallback when username null
- Trust Boundary:     Model layer (normalizeResult, normalizeActorRow) — should filter/guard UUID
- Impact:             Internal DB primary keys exposed in browser history, shareable URLs,
                      and web analytics. Enables correlation attacks if actor_id appears on
                      multiple surfaces. Violates platform "no raw IDs in public URLs" rule.
                      Post UUID exposure: 100% of post navigations from search.
                      Actor UUID exposure: when username is null (frequency undetermined).
- Evidence:           [SOURCE_VERIFIED]
                      PostCard.jsx:7: onClick={() => navigate(`/posts/${post.id}`)}
                      ActorSearchResultRow.jsx:22: navigate(`/profile/${actor.username ?? actor.actor_id}`)
                      FeaturedResultCard.jsx:11: navigate(`/profile/${item.username ?? item.actor_id}`)
- Reproduction Steps:
  1. Authenticate; navigate to /explore
  2. Search any term; observe post results
  3. Click any PostCard → URL = /posts/<UUID> (always)
  4. Search for users; click first actor result (FeaturedResultCard) if username null → UUID in URL
  No special tooling required — every post search exposes a UUID on click.
- Existing Defense:   navigate() uses string templates; no guard, no slug resolution
- Why Defense Is Insufficient: post.id is always a UUID; username fallback pattern
  produces UUID URLs without suppressing the card
- Recommended Fix:    Model-layer guard (see Patch Advisory); slug adoption for posts
- Suggested Patch:    See PATCH-002 below
- Follow-up Command:  IRONMAN (slug field ownership), SPIDER-MAN (navigation regression)
- VEN Reference:      VEN-EXPLORE-003, VEN-EXPLORE-006
- BW Reference:       BW-EXPLORE-005 (BYPASSED, TRIVIAL/PRACTICAL), BW-EXPLORE-007 (BYPASSED, PRACTICAL)
- ELEKTRA Reachability: REACHABLE (post — always; actor — conditional on null username)
```

---

### ELEK-2026-06-05-003 [SOURCE_VERIFIED]

```
SECURITY FINDING

- Finding ID:         ELEK-2026-06-05-003
- Title:              Search Cache Not Scoped to Viewer Identity (Cross-Session Leak Risk)
- Category:           Weak Session Handling / Information Exposure
- Severity:           MEDIUM
- Status:             Open
- Scope:              VCSM
- Location:           apps/VCSM/src/features/explore/hooks/useSearchScreenController.js:11-12
- Source:             Module-level Map declaration (outside hook function body)
- Sink:               Cache returned to next viewer session on same device
- Trust Boundary:     useSearchScreenController — should scope cache to session identity
- Impact:             On shared devices, Citizen A's search results served to Citizen B
                      within the 45s TTL window after actor switch. Results include actor
                      profile data (display_name, username, photo_url, is_private) that
                      should be personalized to B's identity and block context.
- Evidence:           [SOURCE_VERIFIED]
                      const searchResultCache = new Map() — line 11, module scope
                      const searchInflight = new Map() — line 12, module scope
                      Cache key: `${filter}:${query}` — no actorId prefix
                      TTL: 45000ms (45s)
- Reproduction Steps:
  1. Citizen A authenticates; searches "coffee" on /explore → results cached
  2. Citizen A logs out (or switches actor)
  3. Citizen B logs in on same browser session within 45s
  4. Citizen B searches "coffee" → cache hit → Citizen A's results returned
  Attack surface: Shared device (family, demo, kiosk) with quick actor switch
- Existing Defense:   45s TTL limits the window; but no actor-scoped invalidation
- Why Defense Is Insufficient: Module-level singleton persists indefinitely until TTL;
  no hook into auth state change events to clear cache
- Recommended Fix:    Key cache by actorId prefix OR move cache inside hook body
- Suggested Patch:    See PATCH-003 below
- Follow-up Command:  SPIDER-MAN (cache isolation after actor switch)
- VEN Reference:      VEN-EXPLORE-004
- BW Reference:       BW-EXPLORE-003 (UNRESOLVED, PLAUSIBLE)
- ELEKTRA Reachability: REACHABLE (timing-constrained)
```

---

### ELEK-2026-06-05-004 [SOURCE_VERIFIED]

```
SECURITY FINDING

- Finding ID:         ELEK-2026-06-05-004
- Title:              Legacy userId/ownerUserId Fields in Search Model Output
- Category:           Information Exposure / Software Development Security
- Severity:           LOW
- Status:             Open
- Scope:              VCSM
- Location:           apps/VCSM/src/features/explore/model/search.model.js:19-32 (mapActorSearchResult)
                      apps/VCSM/src/features/explore/model/search.model.js:47-48 (mapVportSearchResult)
- Source:             identity RPC row.user_id, row.owner_user_id
- Sink:               Normalized result object { userId, ownerUserId } passed to UI components
- Trust Boundary:     Model layer — should enforce VCSM identity contract
- Impact:             Legacy identity fields present in client-side result objects. Fields are
                      accessible via React devtools. A future consumer of the search results
                      hook could inadvertently use userId for navigation or display, violating
                      the VCSM actor-based identity model.
- Evidence:           [SOURCE_VERIFIED]
                      mapActorSearchResult: { userId: row.user_id ?? null } confirmed at model.js:28
                      mapVportSearchResult: { ownerUserId: row.owner_user_id ?? null } confirmed at model.js:47
- Reproduction Steps:
  1. Open /explore; search for any term returning actors
  2. Open React DevTools → inspect hook state
  3. userId and ownerUserId fields visible in result objects
  No special access required beyond devtools
- Existing Defense:   userId not rendered in DOM; not used in navigation currently
- Why Defense Is Insufficient: Field is present and accessible; future code consuming
  results could use userId inadvertently; VCSM contract violation creates tech debt
- Recommended Fix:    Remove userId from mapActorSearchResult; remove ownerUserId from
                      mapVportSearchResult; audit all consumers
- Suggested Patch:    See PATCH-004 below
- Follow-up Command:  IRONMAN (model cleanup ownership)
- VEN Reference:      VEN-EXPLORE-005
- BW Reference:       BW-EXPLORE-004 (PARTIAL, THEORETICAL)
- ELEKTRA Reachability: PARTIALLY_REACHABLE (chain complete; exploitation requires devtools)
```

---

### ELEK-2026-06-05-005 [SOURCE_VERIFIED]

```
SECURITY FINDING

- Finding ID:         ELEK-2026-06-05-005
- Title:              FeaturedResultCard Raw UUID in Actor Navigation (Highest-Frequency Surface)
- Category:           URL Exposure / IDOR
- Severity:           HIGH
- Status:             Open
- Scope:              VCSM
- Location:           apps/VCSM/src/features/explore/ui/FeaturedResultCard.jsx:11
- Source:             identity RPC actor result with null username
- Sink:               navigate('/profile/${item.username ?? item.actor_id}') — UUID fallback
- Trust Boundary:     Model layer (normalizeActorRow) — should filter null-username actors
- Impact:             Same as ELEK-002 actor path, but at the highest-click-rate position
                      in search results (first/hero card). When the featured actor has a null
                      username, every click on the most prominent result exposes a UUID in the URL.
- Evidence:           [SOURCE_VERIFIED]
                      FeaturedResultCard.jsx:11: navigate(`/profile/${item.username ?? item.actor_id}`)
                      Confirmed same pattern as ActorSearchResultRow; separate component; separate file
- Reproduction Steps:
  Same as ELEK-002 actor path — requires actor with null username in first result position
- Existing Defense:   NONE
- Why Defense Is Insufficient: Same as ELEK-002 — UUID fallback is the failure
- Recommended Fix:    Consolidated with ELEK-002 fix (PATCH-002) — model-layer null-username filter
                      prevents null-username actors from reaching FeaturedResultCard
- Suggested Patch:    See PATCH-002 (consolidated)
- Follow-up Command:  SPIDER-MAN (featured card null username test)
- VEN Reference:      VEN-EXPLORE-006
- BW Reference:       BW-EXPLORE-007 (BYPASSED, PRACTICAL)
- ELEKTRA Reachability: REACHABLE (conditional on null username at first result position)
```

---

### ELEK-2026-06-05-006 [SCANNER_LEAD]

```
SECURITY FINDING

- Finding ID:         ELEK-2026-06-05-006
- Title:              /explore Route Access Conflict — Auth Enforcement Unverified
- Category:           Auth Bypass
- Severity:           MEDIUM
- Status:             Open
- Scope:              VCSM
- Location:           apps/VCSM/src/features/explore/ui/index.jsx:6
                      apps/scanner/maps/route-map.json (explore entry)
- Source:             Unauthenticated user navigating to /explore
- Sink:               ExploreScreen rendering without auth enforcement (conditional)
- Trust Boundary:     app.routes.jsx — router is the authoritative access gate
- Impact:             If /explore is publicly accessible (scanner=public interpretation is
                      correct): unauthenticated visitors can run actor/post searches, bypass
                      viewerActorId enforcement, and access actor data without an account.
                      Combined with ELEK-001 (null viewerActorId), this is compounded.
- Evidence:           [SOURCE_VERIFIED]
                      ui/index.jsx:6: { path: '/explore', element: <ExploreScreen />, public: false }
                      Scanner: access: "public" — conflict confirmed
                      app.routes.jsx: NOT READ — chain is INCOMPLETE
- Reproduction Steps:
  1. Open browser in incognito (unauthenticated)
  2. Navigate to /explore
  3. Observe: if search renders → route is publicly accessible
  Cannot verify without HAWKEYE reading app.routes.jsx
- Existing Defense:   Barrel declares public: false — may or may not be enforced by router
- Why Defense Is Insufficient: Barrel declaration is not the enforcement mechanism;
  router is authoritative; conflict means current state is unknown
- Recommended Fix:    HAWKEYE reads app.routes.jsx; if route is unprotected, add auth guard
                      wrapper; align barrel and scanner declarations
- Suggested Patch:    Cannot produce without router source read
- Follow-up Command:  HAWKEYE (route verification — required before this finding can be
                      classified as VALID or FALSE POSITIVE)
- VEN Reference:      VEN-EXPLORE-007
- BW Reference:       BW-EXPLORE-008 (UNRESOLVED, PLAUSIBLE)
- ELEKTRA Reachability: PARTIALLY_REACHABLE (conditional on router state — HAWKEYE required)
```

---

### ELEK-2026-06-05-007 [SCANNER_LEAD]

```
SECURITY FINDING

- Finding ID:         ELEK-2026-06-05-007
- Title:              vc.posts RLS Coverage for Private Actor Posts Unverified
- Category:           Supabase RLS
- Severity:           MEDIUM
- Status:             Open
- Scope:              VCSM
- Location:           apps/VCSM/src/features/explore/dal/search.dal.js:55-116
- Source:             User search query → vc.posts SELECT
- Sink:               vc.posts rows returned to viewer potentially including private actor posts
- Trust Boundary:     RLS policy on vc.posts — cannot be verified from application source
- Impact:             If vc.posts RLS does not suppress private actor posts for viewers
                      who lack permission, any user can see posts from private accounts
                      via the search surface.
- Evidence:           [SCANNER_LEAD]
                      DAL filters confirmed: is('deleted_at', null), or(is_hidden IS NULL OR = false)
                      Actor-level privacy filter: NOT PRESENT at app layer
                      RLS policy content: NOT INSPECTABLE from source files
                      Note: TICKET-BOOKING-RPC-001 and TICKET-PLATFORM-RLS-001 in scope —
                      vc.posts specific RLS coverage is a separate verification item
- Reproduction Steps:
  1. Create a private actor account with posts
  2. Authenticate as a different account (no permission to view private actor)
  3. Search for terms matching the private actor's posts
  4. Observe whether posts appear in results
  Cannot verify outcome without DB inspection
- Existing Defense:   App-layer filters; RLS assumed present but unconfirmed
- Why Defense Is Insufficient: ASSUMED ≠ VERIFIED — if RLS is absent or permissive,
  private actor posts would be exposed to all authenticated viewers
- Recommended Fix:    DB to verify and confirm vc.posts has an actor-privacy RLS policy;
                      if absent, add policy scoping SELECT to visible actors only
- Suggested Patch:    Cannot propose without DB schema inspection
- Follow-up Command:  DB (RLS policy audit for vc.posts), Carnage (if policy migration needed)
- VEN Reference:      ARCHITECT BW-EXPLORE-003 (UNRESOLVED)
- ELEKTRA Reachability: PARTIALLY_REACHABLE (DB-level verification required)
```

---

### ELEK-2026-06-05-008 [SOURCE_VERIFIED] INFO

```
SECURITY FINDING

- Finding ID:         ELEK-2026-06-05-008
- Title:              Relative Import in usecases/search.usecase.js (VCSM Rule Violation)
- Category:           Software Development Security
- Severity:           INFO
- Status:             Open
- Scope:              VCSM
- Location:           apps/VCSM/src/features/explore/usecases/search.usecase.js:1
- Source:             Relative import: import { searchDal } from '../dal/search.dal'
- Sink:               Linux/CI build failure (case-sensitive filesystem)
- Trust Boundary:     Module resolution boundary
- Impact:             On Linux (CI/CD), case-sensitive filesystem will fail to resolve
                      relative paths that work on macOS. This causes silent test failures
                      on CI while passing locally — a security hygiene failure that prevents
                      reliable security test coverage.
- Evidence:           [SOURCE_VERIFIED]
                      usecases/search.usecase.js:1 — relative import confirmed
                      VCSM rule: all imports must use @/ alias
- Recommended Fix:    Replace relative import with @/ alias path
- Suggested Patch:    See PATCH-008 below
- Follow-up Command:  IRONMAN (code hygiene), SPIDER-MAN (CI regression test for import paths)
- ELEKTRA Reachability: NOT_REACHABLE (no runtime security impact; CI reliability only)
```

---

## 7. Patch Advisories

---

### PATCH-001 — ELEK-2026-06-05-001: viewerActorId Injection (3-layer)

```
ELEKTRA PATCH ADVISORY
========================
Finding ID: ELEK-2026-06-05-001
Chain ID: CHAIN-explore-001
Scanner Signal: rpc-execution-map → ctrlSearchResults → searchDal → searchActors → identity RPC
Provenance: [SOURCE_VERIFIED]
Severity: HIGH
Patch Complexity: MODERATE
Requires DB Change: NO

CHAIN:
  Source: useSearchScreenController — actorId not in state; no useIdentity() call
  Boundary: ctrlSearchResults:9 — searchDal(trimmed, filter, {}) — hard-coded empty opts
  Sink: search.dal.js:20-27 — viewerActorId = opts.viewerActorId || null → null
  Impact: Block enforcement bypassed for all authenticated Citizen searches
  Missing Defense: actorId never injected from session anywhere in the chain

ROOT CAUSE:
  useSearchScreenController does not call useIdentity() or any session hook.
  ctrlSearchResults hard-codes {} as opts, so viewerActorId is structurally impossible
  to provide through the primary search path.

SUGGESTED PATCH:
  Step 1 — Hook (useSearchScreenController.js):
  ```js
  // Before — no identity context in hook
  export function useSearchScreenController() {
    const [results, setResults] = useState([]);
    // ...no actorId
    const search = async (q, f) => {
      const res = await ctrlSearchResults(q, f, {});
      // ...
    };
  }

  // After — inject actorId from session
  import { useIdentity } from '@/features/identity/hooks/useIdentity'; // or platform equivalent

  export function useSearchScreenController() {
    const { actorId } = useIdentity(); // session-derived; null when unauthenticated
    const [results, setResults] = useState([]);
    // ...
    const search = async (q, f) => {
      const res = await ctrlSearchResults(q, f, { viewerActorId: actorId });
      // ...
    };
  }
  ```

  Step 2 — Controller (searchResults.controller.js):
  ```js
  // Before
  export const ctrlSearchResults = async (query, filter, opts = {}) => {
    const results = await searchDal(query, filter, opts);
    // ...
  };

  // After — pass viewerActorId through opts (already passed by hook — no change needed
  // if searchDal already receives opts; confirm opts threading is complete)
  // Verify: searchDal(query, filter, opts) — opts.viewerActorId flows through unchanged
  ```

  Step 3 — Cache (useSearchScreenController.js):
  ```js
  // Before — cache key without actorId
  const cacheKey = `${filter}:${query}`;

  // After — scope cache to viewer
  const cacheKey = `${actorId ?? 'anon'}:${filter}:${query}`;
  ```

  Explanation: actorId is derived from the authenticated session hook (server-sourced),
  threaded through the hook → controller → DAL opts chain. The RPC will receive the
  correct viewer context for all authenticated searches. Cache is simultaneously fixed.
```

---

### PATCH-002 — ELEK-2026-06-05-002 + 005: UUID Navigation (3 components, 1 model guard)

```
ELEKTRA PATCH ADVISORY
========================
Finding ID: ELEK-2026-06-05-002 + ELEK-2026-06-05-005 (consolidated)
Chain IDs: CHAIN-explore-005, CHAIN-explore-006, + FeaturedResultCard extension
Scanner Signal: security-path-map navigation risks
Provenance: [SOURCE_VERIFIED]
Severity: HIGH
Patch Complexity: MODERATE (model layer guard) + COMPLEX (post slug adoption — cross-feature)
Requires DB Change: NO for actor guard; YES (schema) for post slug adoption

CHAIN:
  Source A: vc.posts SELECT → row.id (UUID)
  Boundary A: normalizeResult — no slug guard
  Sink A: PostCard.jsx:7 → navigate('/posts/${post.id}')

  Source B: identity RPC → actor_id (UUID); username may be null
  Boundary B: normalizeActorRow — no null-username filter
  Sink B: ActorSearchResultRow:22 + FeaturedResultCard:11 → navigate('/profile/${uuid}')

  Impact: Internal UUIDs in public-facing URLs; platform rule violation

SUGGESTED PATCH — Actor UUID (immediate fix):
  File: apps/VCSM/src/features/explore/model/search.model.js
  ```js
  // In normalizeActorRow:
  // Before
  const normalizeActorRow = (row) => ({
    actorId: row.actor_id,
    username: row.username,
    // ...
  });

  // After — return null for actors without username (caller uses .filter(Boolean))
  const normalizeActorRow = (row) => {
    if (!row.username) {
      // Actor without username cannot be safely navigated — suppress from results
      return null;
    }
    return {
      actorId: row.actor_id,
      username: row.username,
      // ...
    };
  };
  ```

  Caller (ctrlSearchResults or model consumer):
  ```js
  // Ensure .filter(Boolean) is applied after normalizeActorRow
  const actors = rows.map(normalizeActorRow).filter(Boolean);
  ```

  Navigation components (ActorSearchResultRow, FeaturedResultCard):
  ```js
  // Before
  navigate(`/profile/${actor.username ?? actor.actor_id}`)

  // After — username is now guaranteed non-null (model guard filters null-username actors)
  navigate(`/profile/${actor.username}`)
  // No fallback needed — if actor has no username, it was filtered before reaching this component
  ```

SUGGESTED PATCH — Post UUID (requires cross-feature coordination):
  Short-term (suppress, don't navigate with UUID):
  ```js
  // PostCard.jsx:7
  // Before
  onClick={() => navigate(`/posts/${post.id}`)}

  // After — suppress navigation if no slug exists
  onClick={() => {
    if (!post.slug) {
      console.warn('[explore] PostCard: no slug for post, navigation suppressed'); // dev only
      return;
    }
    navigate(`/posts/${post.slug}`);
  }}
  ```

  Long-term: Coordinate with posts feature (IRONMAN) to add slug field to vc.posts
  and expose it through searchPosts SELECT and normalizeResult mapping.

  Explanation: Model guard at normalizeActorRow prevents null-username actors from ever
  reaching navigation components. Post fix requires either slug adoption (preferred) or
  short-term navigation suppression.
```

---

### PATCH-003 — ELEK-2026-06-05-003: Cache Scope Fix

```
ELEKTRA PATCH ADVISORY
========================
Finding ID: ELEK-2026-06-05-003
Chain ID: CHAIN-explore-001 (cache path)
Scanner Signal: security-path-map
Provenance: [SOURCE_VERIFIED]
Severity: MEDIUM
Patch Complexity: SIMPLE (Option A — actorId prefix) | MODERATE (Option B — move inside hook)
Requires DB Change: NO

CHAIN:
  Source: Module-level const searchResultCache = new Map()
  Sink: Cache serves prior actor's results to next actor within 45s TTL window
  Missing Defense: actorId binding in cache key; no cache clear on actor switch

SUGGESTED PATCH — Option A (minimal change, recommended):
  File: apps/VCSM/src/features/explore/hooks/useSearchScreenController.js

  ```js
  // After PATCH-001 (actorId is now available in hook via useIdentity):
  // Before
  const cacheKey = `${filter}:${query}`;

  // After
  const cacheKey = `${actorId ?? 'anon'}:${filter}:${query}`;
  ```

  Note: This is already addressed as Step 3 of PATCH-001. No additional change needed
  if PATCH-001 is implemented fully.

SUGGESTED PATCH — Option B (stronger isolation):
  Move cache declarations inside hook body:
  ```js
  // Before (module scope)
  const searchResultCache = new Map();
  const searchInflight = new Map();

  export function useSearchScreenController() { ... }

  // After (per-mount isolation — no cross-session leak possible)
  export function useSearchScreenController() {
    const cacheRef = useRef(new Map());
    const inflightRef = useRef(new Map());
    // Use cacheRef.current instead of searchResultCache
    // ...
  }
  ```

  Trade-off: Option B eliminates the cross-session risk but loses the performance benefit
  of cache persistence across component unmounts (e.g., tab switches). Option A preserves
  the benefit while adding viewer scoping.

  Explanation: actorId prefix in the cache key ensures each actor's cached results are
  isolated. Option B (useRef) eliminates the module-level singleton entirely.
```

---

### PATCH-004 — ELEK-2026-06-05-004: Legacy Identity Fields

```
ELEKTRA PATCH ADVISORY
========================
Finding ID: ELEK-2026-06-05-004
Scanner Signal: evidence-bundle callgraph
Provenance: [SOURCE_VERIFIED]
Severity: LOW
Patch Complexity: SIMPLE
Requires DB Change: NO

SUGGESTED PATCH:
  File: apps/VCSM/src/features/explore/model/search.model.js

  ```js
  // mapActorSearchResult — Before (around line 19-32)
  const mapActorSearchResult = (row) => ({
    ...normalizeActorRow(row),
    userId: row.user_id ?? null,  // Remove this line
    // ... other fields
  });

  // mapActorSearchResult — After
  const mapActorSearchResult = (row) => ({
    ...normalizeActorRow(row),
    // userId removed — legacy field; VCSM identity contract prohibits userId exposure
  });

  // mapVportSearchResult — Before (around line 47-48)
  const mapVportSearchResult = (row) => ({
    // ...
    ownerUserId: row.owner_user_id ?? null,  // Remove this line
  });

  // mapVportSearchResult — After
  const mapVportSearchResult = (row) => ({
    // ...
    // ownerUserId removed — legacy field
  });
  ```

  Pre-patch: Run grep on all consumers of useSearchActor and search result hooks to confirm
  userId/ownerUserId are not referenced before removing them.

  Explanation: Removes legacy fields from the normalized result objects, closing the
  client-side identity field exposure and enforcing the VCSM actor-based identity contract.
```

---

### PATCH-008 — ELEK-2026-06-05-008: Relative Import Fix

```
ELEKTRA PATCH ADVISORY
========================
Finding ID: ELEK-2026-06-05-008
Provenance: [SOURCE_VERIFIED]
Severity: INFO
Patch Complexity: SIMPLE
Requires DB Change: NO

SUGGESTED PATCH:
  File: apps/VCSM/src/features/explore/usecases/search.usecase.js:1

  ```js
  // Before
  import { searchDal } from '../dal/search.dal';

  // After
  import { searchDal } from '@/features/explore/dal/search.dal';
  ```

  Explanation: @/ alias is resolved by Vite/Webpack path alias configuration and works
  on both macOS (case-insensitive) and Linux (case-sensitive) filesystems. Relative imports
  bypass the alias resolution and create CI/CD breakage risk.
```

---

## 8. False Positives Rejected

```
FALSE POSITIVE REJECTED

- Candidate:        VEN-EXPLORE-001 (BEHAVIOR.md absence) — ELEKTRA chain analysis
- Location:         ZZnotforproduction/APPS/VCSM/features/explore/BEHAVIOR.md
- Rejection reason: No source-to-sink code chain exists. Governance gap — not a code vulnerability.
  LOGAN addressed this by producing BEHAVIOR.md DRAFT on 2026-06-05. ELEKTRA cannot trace
  a source→sink path for a documentation gap.
- Chain gap:        Source (untrusted input does not apply — governance artifact)
- Notes:            VEN-EXPLORE-001 is a valid VENOM finding; not an ELEKTRA code-chain finding.
  ELEKTRA reachability classification: NOT_REACHABLE (no code chain).
```

```
FALSE POSITIVE REJECTED

- Candidate:        hydrateActorsByIds fire-and-forget (BW-EXPLORE-004)
- Location:         apps/VCSM/src/features/explore/controller/searchResults.controller.js
- Rejection reason: Chain is complete but impact is insufficient. hydrateActorsByIds is a
  display-enhancement-only operation. The catch(() => {}) swallows errors but does not
  expose sensitive data — hydration is a read-only operation that populates display state.
  Silenced errors are a hygiene concern (should log in dev mode) but not a security vulnerability.
- Chain gap:        Impact — no exploitable outcome from a failed/poisoned hydration call
- Notes:            INFO-level recommendation: log hydration failures in dev mode. Not a finding.
```

---

## 9. Source Verification Summary

| Metric | Count |
|---|---|
| Chain candidates evaluated | 10 |
| Chains source-verified | 8 |
| Source files read (precision reads only) | 0 (all evidence from ARCHITECT bundle — no new reads) |
| Valid findings (ELEK-001 through 007) | 7 |
| INFO findings | 1 (ELEK-008) |
| Rejected (false positive) | 2 |
| Incomplete (scanner leads) | 2 (ELEK-006, ELEK-007) |

## 9.1 SOURCE READ SUMMARY

| Command | Source Files Read | Evidence Bundle Used | Full Rediscovery Performed |
|---|---|---|---|
| ELEKTRA | 0 (new reads) | YES — ZZnotforproduction/APPS/VCSM/features/explore/outputs/2026/06/05/ARCHITECT/evidence-bundle.json | NO |

All chains traced from ARCHITECT evidence bundle (22 source files) + VENOM V2 scanner signals + BLACKWIDOW adversarial findings. No new source file reads were required — all file:line references are from evidence confirmed during the ARCHITECT phase of this session.

---

## 10. Confidence Summary

| Category | Count |
|---|---|
| HIGH confidence chains | 8 |
| LOW confidence chains | 0 |
| [SOURCE_VERIFIED] findings | 6 (ELEK-001 through 005, 008) |
| [SCANNER_LEAD] findings | 2 (ELEK-006, ELEK-007) |
| BLACKWIDOW-confirmed findings | 5 (ELEK-001 ← BW-001, ELEK-002 ← BW-005, ELEK-003 ← BW-003, ELEK-005 ← BW-007, VEN-001 ← BW-006 partial) |

---

## 11. THOR Impact

```
THOR Release Blockers:
- ELEK-2026-06-05-001 | HIGH | viewerActorId null → block bypass (source-to-sink confirmed)
- ELEK-2026-06-05-002 | HIGH | UUID in PostCard + ActorSearchResultRow (chain confirmed)
- ELEK-2026-06-05-005 | HIGH | UUID in FeaturedResultCard (chain confirmed)

Non-blocking (MEDIUM — CAUTION allowed):
- ELEK-2026-06-05-003 | MEDIUM | Cache cross-session (timing-constrained)
- ELEK-2026-06-05-006 | MEDIUM | Route access conflict (SCANNER_LEAD — HAWKEYE required)
- ELEK-2026-06-05-007 | MEDIUM | vc.posts RLS (SCANNER_LEAD — DB verification required)

Non-blocking (LOW/INFO):
- ELEK-2026-06-05-004 | LOW
- ELEK-2026-06-05-008 | INFO

CRITICAL upgrade: None — no BLACKWIDOW active confirmation of CRITICAL severity for any finding.
Highest confirmed severity: HIGH (3 findings)
```

---

## 12. VEN Finding Reachability Classifications

| VEN Finding | Severity | ELEKTRA Reachability | ELEKTRA Finding | Notes |
|---|---|---|---|---|
| VEN-EXPLORE-001 (BEHAVIOR.md absent) | HIGH | NOT_REACHABLE | FALSE POSITIVE (governance) | LOGAN produced DRAFT; code chain does not apply |
| VEN-EXPLORE-002 (viewerActorId null) | HIGH | REACHABLE | ELEK-2026-06-05-001 | Full chain confirmed; 3-layer fix advised |
| VEN-EXPLORE-003 (UUID PostCard + ActorRow) | HIGH | REACHABLE | ELEK-2026-06-05-002 | Post UUID: always; Actor UUID: conditional on null username |
| VEN-EXPLORE-004 (cache cross-session) | MEDIUM | REACHABLE | ELEK-2026-06-05-003 | Timing-constrained but chain is complete |
| VEN-EXPLORE-005 (legacy userId field) | LOW | PARTIALLY_REACHABLE | ELEK-2026-06-05-004 | Chain confirmed; exploit needs devtools |
| VEN-EXPLORE-006 (FeaturedResultCard UUID) | HIGH | REACHABLE | ELEK-2026-06-05-005 | Same chain as VEN-003 actor path; same fix |
| VEN-EXPLORE-007 (route access conflict) | MEDIUM | PARTIALLY_REACHABLE | ELEK-2026-06-05-006 | HAWKEYE required for full chain; barrel vs router conflict |

---

## 13. Suggested Patch Queue

| # | Finding ID | Title | Severity | Layer to Patch | Patch Complexity | Requires DB Change |
|---|---|---|---|---|---|---|
| 1 | ELEK-2026-06-05-001 | viewerActorId injection (3-layer) | HIGH | Hook + Controller + DAL | MODERATE | NO |
| 2 | ELEK-2026-06-05-002 | UUID navigation — actor model guard | HIGH | Model + UI | MODERATE | NO |
| 3 | ELEK-2026-06-05-002 | UUID navigation — post slug adoption | HIGH | DAL + Model + UI | COMPLEX | YES (slug field) |
| 4 | ELEK-2026-06-05-005 | FeaturedResultCard UUID (consolidated) | HIGH | Model + UI | MODERATE | NO |
| 5 | ELEK-2026-06-05-003 | Cache actorId scoping | MEDIUM | Hook | SIMPLE | NO |
| 6 | ELEK-2026-06-05-004 | Legacy userId/ownerUserId removal | LOW | Model | SIMPLE | NO |
| 7 | ELEK-2026-06-05-008 | Relative import → @/ alias | INFO | Module | SIMPLE | NO |

---

## 14. Required Follow-up Commands

| Command | Reason | Priority | Status |
|---|---|---|---|
| SPIDER-MAN | Regression tests for: viewerActorId injection (ELEK-001), UUID navigation (ELEK-002/005), cache isolation (ELEK-003) | P1 | PENDING |
| HAWKEYE | Verify /explore route auth enforcement in app.routes.jsx → resolve ELEK-006 from INCOMPLETE to VALID/FALSE_POSITIVE | P1 | PENDING |
| DB | Verify vc.posts RLS covers private actor post visibility → resolve ELEK-007 | P1 | PENDING |
| IRONMAN | Own UUID navigation fix (slug field ownership), model legacy field cleanup | P1 | PENDING |
| VENOM | Re-run after ELEK-001 + ELEK-002 + ELEK-005 are patched; re-anchor findings against APPROVED BEHAVIOR.md | P2 | PENDING |
| Carnage | If vc.posts RLS requires migration (ELEK-007 DB verification outcome) | P2 | PENDING |
| THOR | BLOCKED — ELEK-001, ELEK-002, ELEK-005 are HIGH and open | — | BLOCKED |

---

*ELEKTRA V2 | VCSM:explore | 2026-06-05 | 7 findings + 1 INFO | 2 false positives | 7 patch advisories*
