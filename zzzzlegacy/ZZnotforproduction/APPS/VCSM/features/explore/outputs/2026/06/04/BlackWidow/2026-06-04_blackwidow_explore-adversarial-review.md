# BLACKWIDOW V2 — Adversarial Runtime Verification Report
## Feature: explore | App: VCSM | Date: 2026-06-04

---

## 1. Output Metadata

| Field | Value |
|---|---|
| Report Type | BW2.9 Adversarial Runtime Verification |
| Feature | explore |
| App | VCSM |
| Run Date | 2026-06-04 |
| Analyst | BLACKWIDOW V2 |
| BLACKWIDOW Version | BW2.5 V2 |
| Scanner Preflight | FRESH — 2026-06-04T19:48:25.152Z |
| Scanner Version | 1.1.0 |
| Report Path | ZZnotforproduction/APPS/VCSM/features/explore/outputs/2026/06/04/BlackWidow/2026-06-04_blackwidow_explore-adversarial-review.md |

---

## 2. Scanner Preflight

- Status: FRESH
- Maps Generated: 2026-06-04T19:48:25.152Z (~7h old at run time)
- Scanner Version: 1.1.0
- Security Paths Attributed to explore: 2 (both LOW confidence — no route-confirmed path)
- Total Platform Security Paths: 598
- Callgraph Nodes for explore: 41 (component:11, controller:3, dal:6, hook:9, model:9, module:1, screen:2)
- Callgraph Edges for explore: 39
- Write Execution Paths for explore: 0 (no DB write operations detected)
- RPC Execution Paths for explore: 0 (scanner did not resolve route-confirmed RPC paths)

---

## 3. Scanner Inputs Block

| Map | Coverage for explore | Confidence |
|---|---|---|
| security-path-map.json | 2 paths — both LOW confidence | No route-confirmed path |
| callgraph.json | 41 nodes, 39 edges | Full layer coverage |
| write-execution-map.json | 0 paths | No writes detected |
| rpc-execution-map.json | 0 paths | Not resolved |

**Scanner LOW Confidence Signals (PRIMARY ATTACK TARGETS per Rule BW-002):**

Both scanner paths for explore are LOW confidence (`write surface discovered without route-confirmed path`). This means the attack surface is known but the full hook→controller→DAL→RPC chain has not been statically confirmed by the scanner. Source code reading is required for each attack scenario.

---

## 4. Attack Surface Inventory

### 4.1 DAL Write Surfaces

| Surface | Operation | Schema | Target | File:Line |
|---|---|---|---|---|
| searchActors | RPC call | identity | search_actor_directory | search.dal.js:20-27 |
| searchPosts | SELECT (read) | vc | posts | search.dal.js:55-68 |
| searchPostsByTag | SELECT (read) | vc | posts | search.dal.js:94-102 |

**Note:** `searchPosts` and `searchPostsByTag` are pure SELECT operations. `searchActors` is the only RPC surface. There are ZERO mutating writes (INSERT/UPDATE/DELETE) in this feature.

### 4.2 Hook Entry Points (UI-Accessible)

| Hook | File | Calls |
|---|---|---|
| useSearchScreenController | hooks/useSearchScreenController.js | ctrlSearchResults (viewerActorId: never injected) |
| useSearchTabsActor | hooks/useSearchTabsActor.js | ctrlSearchTabs (viewerActorId: passed from caller) |
| useSearchActor | hooks/useSearchActor.js | delegates to useSearchScreenController |

### 4.3 Controller Entry Points

| Controller | File | Takes viewerActorId? |
|---|---|---|
| ctrlSearchResults | controller/searchResults.controller.js | NO — hardcodes `{}` |
| ctrlSearchTabs | controller/searchTabs.controller.js | YES — default null |

### 4.4 Module-Level State (Global Singletons)

| Singleton | File:Line | Scope |
|---|---|---|
| searchResultCache (Map) | useSearchScreenController.js:11 | Module-level — shared across all component instances and actors |
| searchInflight (Map) | useSearchScreenController.js:12 | Module-level — shared across all component instances |

### 4.5 URL Navigation Surfaces

| Component | Navigation Pattern | Raw ID Risk |
|---|---|---|
| ActorSearchResultRow | `/profile/${actor.username ?? actor.actor_id}` | CONDITIONAL — falls back to raw actor_id UUID if username null |
| FeaturedResultCard (actor) | `/profile/${item.username ?? item.actor_id}` | CONDITIONAL — same fallback |
| PostCard | `/posts/${post.id}` | CONFIRMED — raw UUID always used |

---

## 5. Scanner Signals Block

**Confirmed Scanner HIGH-Confidence Signals:**
- `search_actor_directory` RPC call in `searchActors()` — dal/search.dal.js — identity schema
- Callgraph: hook → controller → dal chain fully traced for both entry points

**Scanner LOW-Confidence Signals (no route-confirmed path):**
- Both security paths flagged as LOW confidence
- No `sourceRoute` resolved for either path
- This means the scanner cannot confirm how `ctrlSearchResults` is reached from a named route — it is verified as reachable via `useSearchScreenController` → `SearchScreen.view.jsx` → `ExploreScreen.jsx` (source confirmed)

---

## 6. Adversarial Path Analysis

### A) OWNERSHIP BYPASS (§5.1)

**Attack:** Can an actor submit a mutation with another actor's resource ID?

**Analysis:** The explore feature contains zero mutating operations (no INSERT/UPDATE/DELETE). The only RPC is `search_actor_directory` which is a read operation that takes `p_viewer_actor_id` as an optional hint. There is no resource ownership concept in this feature — searching is stateless and non-mutating.

**Result: NOT APPLICABLE — No ownership resources exist in this feature.**

The only actor-scoped parameter is `p_viewer_actor_id` passed to `search_actor_directory`. In `useSearchTabsActor` this is passed from the calling component (not sourced from session). In `ctrlSearchResults`, it is hardcoded to `{}` (empty options dict), meaning `viewerActorId` defaults to `null` at the DAL.

**Finding: BW-EXPLORE-001** (see §7)

---

### B) SESSION MUTATION (§5.2)

**Attack:** Is viewerActorId taken from session (trusted) or from client payload (untrusted)?

**Source Analysis:**

`ctrlSearchTabs` signature (searchTabs.controller.js:4-9):
```js
export async function ctrlSearchTabs({
  query,
  filter = 'all',
  limit = 25,
  offset = 0,
  viewerActorId = null,    // ← passed from hook caller, NOT injected from session
})
```

`useSearchTabsActor` (useSearchTabsActor.js:15-21):
```js
export function useSearchTabsActor({
  query,
  filter = 'all',
  limit = 25,
  offset = 0,
  viewerActorId = null,    // ← passed from component, NOT from useIdentity()
})
```

The `viewerActorId` in `useSearchTabsActor` and `ctrlSearchTabs` is passed from the calling component's props. There is no enforcement that it comes from the session. However, this is a read-only RPC, and the `p_viewer_actor_id` parameter in `search_actor_directory` is used for result personalization/ranking, not for data access control. A null or spoofed value would only affect result ordering, not expose protected data.

**Result: PARTIAL** — viewerActorId is not session-injected, but the consequence is limited to degraded personalization for read-only results, not an authorization bypass over protected resources. The RLS policy on `identity.search_actor_directory` governs actual data exposure.

**Finding: BW-EXPLORE-002** (see §7)

---

### C) RUNTIME ABUSE (§5.3)

**Attack:** Are privileged endpoints (owner-only, admin, moderation) protected by actor kind check?

**Analysis:** The explore feature has no owner-only, admin, or moderation endpoints. All search paths are public read operations. `ctrlSearchResults` and `ctrlSearchTabs` accept any caller without actor kind verification — this is correct behavior for a public discovery feature.

The `searchPosts` DAL (search.dal.js:60-62) explicitly filters deleted/hidden posts:
```js
.is('deleted_at', null)
.or('is_hidden.is.null,is_hidden.eq.false')
```

This provides adequate visibility filtering for public posts.

**Result: BLOCKED — No privileged endpoints exist. Visibility filters for deleted/hidden posts are present.**

---

### D) RLS VERIFICATION (§5.4)

**Attack:** For each DAL read surface: is there an ownership filter or is RLS the only barrier?

**searchActors (DAL):** Uses `identity.search_actor_directory` RPC. RLS enforcement depends entirely on the database RPC security definer/invoker setting. No application-layer ownership filter exists in the DAL — the feature assumes the RPC is safe for public invocation. This is the correct pattern for a discovery RPC, but the security setting of `search_actor_directory` has not been verified in source.

**searchPosts (DAL):** Queries `vc.posts` with explicit `deleted_at IS NULL` and `is_hidden` filters. No viewer-scoped filter — all matching public posts are returned. Private post protection relies on RLS on `vc.posts` table.

**searchPostsByTag (DAL):** Same as searchPosts — same filters applied (search.dal.js:94-102).

**Critical gap:** Neither `searchPosts` nor `searchPostsByTag` checks whether posts belong to private actors or are otherwise restricted beyond the `is_hidden` column. If the `vc.posts` RLS policy does not restrict private actor content, a user could discover posts from private/blocked actors via text search.

**Finding: BW-EXPLORE-003** (see §7)

---

### E) VIEWER CONTEXT FUZZING (§5.5)

**Attack:** What happens if null/undefined viewerActorId is passed to each controller?

**ctrlSearchResults (searchResults.controller.js:5-8):**
```js
export async function ctrlSearchResults({ query, filter }) {
  const trimmed = String(query || '').trim()
  if (!trimmed) return []
  const responses = await Promise.all(searchDal(trimmed, filter, {}))
```
`viewerActorId` is NEVER accepted as a parameter. It calls `searchDal(trimmed, filter, {})` — empty options object. The DAL's `searchActors` will default `viewerActorId` to `null` (search.dal.js:10). This means the `identity.search_actor_directory` RPC is always called with `p_viewer_actor_id: null` from this path.

**ctrlSearchTabs (searchTabs.controller.js:8-10):**
```js
const calls = searchDal(query, filter, { limit, offset, viewerActorId })
```
If `viewerActorId` is null (default), the RPC receives `p_viewer_actor_id: null`. The RPC must handle null gracefully — this is the VENOM-confirmed issue (VEN-EXPLORE-002: viewerActorId always null in primary search path).

**Null safety for search guards:**
- `ctrlSearchResults` line 6-7: `if (!trimmed) return []` — empty query guard present
- `searchActors` line 13-14: `if (!q) return []` — empty query guard present  
- `searchPosts` line 49-50: `if (!q) return []` — empty query guard present
- `searchPostsByTag` line 91-92: `if (!normalizedTag) return []` — empty tag guard present

**Result: BLOCKED for null query injection.** Empty query inputs are properly guarded at both controller and DAL layers. The null viewerActorId condition is expected behavior for anonymous/unauthenticated searches and is confirmed by VEN-EXPLORE-002.

---

### F) MUTATION REPLAY (§5.6)

**Attack:** Can a completed/cancelled operation be re-triggered?

**Analysis:** The explore feature contains no state-machine operations. There are no bookings, transactions, or stateful resources. All operations are ephemeral read-only searches. Replay is trivially possible (re-searching the same query) but has no security implication in a read-only context.

**Result: NOT APPLICABLE — No stateful mutations exist in this feature.**

---

### G) HYDRATION POISONING (§5.7)

**Attack:** Does this feature interact with the hydration store? Can actor summaries be poisoned or served stale?

**Source Analysis (searchResults.controller.js:13-17):**
```js
const actorIds = allRows
  .filter((r) => r && r.result_type === 'actor')
  .map((r) => r.actorId || r.actor_id)
  .filter(Boolean)
if (actorIds.length) hydrateActorsByIds(actorIds).catch(() => {})
```

`ctrlSearchResults` calls `hydrateActorsByIds` (imported from `@hydration`) as a FIRE-AND-FORGET side effect (`catch(() => {})` silences errors). This writes actor summaries into the hydration store from search result data.

**Attack vector:** If search results return actor data with spoofed or stale fields (via the RPC), those values could poison the hydration store. Any component elsewhere in the app that reads actor summaries from hydration could render incorrect display names, avatars, or other fields.

The fire-and-forget pattern (`catch(() => {})`) also means hydration errors are silently swallowed — a failed hydration is not reported to the user or logged.

**Result: PARTIAL** — Hydration poisoning is possible if the `identity.search_actor_directory` RPC returns malformed or stale data. The hydration write path is not validated before writing. The fire-and-forget error suppression also conceals failures.

**Finding: BW-EXPLORE-004** (see §7)

---

### H) URL SURFACE (§5.9)

**Attack:** Do any navigation paths for this feature expose raw UUIDs?

**ActorSearchResultRow (ActorSearchResultRow.jsx:21):**
```js
onClick={() => navigate(`/profile/${actor.username ?? actor.actor_id}`)}
```
Falls back to `actor.actor_id` (raw UUID) if `actor.username` is null or undefined.

**FeaturedResultCard (FeaturedResultCard.jsx:13):**
```js
onClick={() => navigate(`/profile/${item.username ?? item.actor_id}`)}
```
Same fallback — raw UUID used if username absent.

**PostCard (PostCard.jsx:8):**
```js
onClick={() => navigate(`/posts/${post.id}`)}
```
`post.id` is always a raw UUID — no slug or human-readable identifier used.

**VportsRow.jsx:** Uses hardcoded mock data (IDs 1, 2, 3) — not navigable to real routes. Not in production.

**Result: BYPASSED** — Raw UUID exposure confirmed in two navigation paths:
1. Actor navigation falls back to raw actor_id UUID when username is null
2. Post navigation always uses raw post UUID (no slug)

This confirms VEN-EXPLORE-003 (OPEN: Raw UUID post IDs in /posts/{id}) and extends it to the actor navigation fallback.

**Finding: BW-EXPLORE-005** (see §7)

---

### I) §9 INVARIANT ATTACK (HIGHEST PRIORITY)

**BEHAVIOR.md Status: PLACEHOLDER**

The BEHAVIOR.md file is a placeholder with Status: PLACEHOLDER. No §9 Must Never Happen invariants have been defined. Per the protocol:

> If BEHAVIOR.md status is PLACEHOLDER: note all §9 invariants are UNANCHORED.

This means there are no anchored invariants to attack against. All invariant coverage below is **source-inferred** from the feature's apparent intent (public discovery/search) and platform rules.

**Source-Inferred Invariants and Attack Results:**

| Inferred Invariant | Attack Harness | Result |
|---|---|---|
| Search must never return soft-deleted posts | Query with deleted post's text | BLOCKED — `is('deleted_at', null)` filter at search.dal.js:60 |
| Search must never return hidden posts | Query with hidden post's text | BLOCKED — `or('is_hidden.is.null,is_hidden.eq.false')` at search.dal.js:61 |
| Navigation must never expose raw user UUIDs in URLs | Trigger search with actor having no username | BYPASSED — actor_id UUID used as fallback (ActorSearchResultRow.jsx:21) |
| Post navigation must use slugs not raw IDs | Click any post result | BYPASSED — /posts/{raw_uuid} always used (PostCard.jsx:8) |
| Cache must not leak results between actor sessions | Trigger search as ActorA, switch to ActorB, trigger same search | BYPASSED — module-level cache is not identity-scoped (useSearchScreenController.js:11) |
| Search must not silently corrupt hydration store | Search actor with stale RPC data | PARTIAL — fire-and-forget hydration with no validation |

**Finding: BW-EXPLORE-006** (see §7) — UNANCHORED INVARIANTS (BEHAVIOR.md is PLACEHOLDER)

---

## 7. Exploitability Assessment

### Finding Register

| Finding ID | Severity | Description | Result | Provenance |
|---|---|---|---|---|
| BW-EXPLORE-001 | MEDIUM | ctrlSearchResults never accepts or injects viewerActorId — search_actor_directory RPC always receives p_viewer_actor_id: null from primary search path | BYPASSED | [SOURCE_VERIFIED] searchResults.controller.js:9 |
| BW-EXPLORE-002 | LOW | viewerActorId in useSearchTabsActor/ctrlSearchTabs is not session-injected — passed from component props; consequence limited to degraded personalization on read-only RPC | PARTIAL | [SOURCE_VERIFIED] useSearchTabsActor.js:20 + searchTabs.controller.js:8 |
| BW-EXPLORE-003 | MEDIUM | searchPosts and searchPostsByTag have no viewer-scoped filter — private actor post exposure risk if vc.posts RLS does not restrict private actor content | UNRESOLVED | [SCANNER_LOW_CONF] — RLS policy not verified in source |
| BW-EXPLORE-004 | LOW | hydrateActorsByIds called as fire-and-forget with silenced errors in ctrlSearchResults — hydration store written from unvalidated RPC data; stale/malformed actor data could pollute cross-feature actor summaries | PARTIAL | [SOURCE_VERIFIED] searchResults.controller.js:17 |
| BW-EXPLORE-005 | MEDIUM | Raw UUID navigation: /posts/{post.id} always exposes raw post UUID; /profile/{actor.actor_id} exposed as fallback when username is null — violates platform no-raw-IDs-in-public-URLs rule | BYPASSED | [SOURCE_VERIFIED] PostCard.jsx:8, ActorSearchResultRow.jsx:21, FeaturedResultCard.jsx:13 |
| BW-EXPLORE-006 | HIGH | BEHAVIOR.md is PLACEHOLDER — §9 Must Never Happen invariants are completely unanchored; source-inferred invariant attacks confirm cache cross-session leak (unscoped module-level Map) and UUID URL exposures active | BYPASSED | [SOURCE_VERIFIED] useSearchScreenController.js:11, PostCard.jsx:8, ActorSearchResultRow.jsx:21 |

### Confirmed Exploit Chains

**Chain 1 — Cross-Session Cache Leak (Multi-step)**
1. Actor A searches for a query → results cached in module-level `searchResultCache` Map
2. Actor A logs out; Actor B logs in (same browser, same JS module instance)
3. Actor B types the same query → module-level cache returns Actor A's search results without a new network request
4. Path: useSearchScreenController.js:11 (module-level Map) → readSearchCache() → setResults()
- Exploit Type: Cache / Session leak
- Severity: MEDIUM (confirmed by VEN-EXPLORE-004, now adversarially verified)

**Chain 2 — UUID URL Exposure (Single-step)**
1. Any user clicks a post search result
2. `PostCard` navigates to `/posts/${post.id}` where `post.id` is a raw UUID
3. Raw UUID appears in browser address bar and browser history
- Path: PostCard.jsx:8 → react-router navigate
- Exploit Type: Single-step
- Severity: MEDIUM (platform rule violation, BYPASSED)

**Chain 3 — Actor UUID Fallback (Single-step)**
1. Search returns an actor result with null username (e.g., incomplete profile)
2. `ActorSearchResultRow` navigates to `/profile/${actor.actor_id}` (raw UUID fallback)
3. Raw UUID appears in browser address bar
- Path: ActorSearchResultRow.jsx:21 (fallback to actor_id) and FeaturedResultCard.jsx:13
- Exploit Type: Single-step
- Severity: MEDIUM (platform rule violation, BYPASSED)

**Chain 4 — Null Viewer Identity in Primary Search Path (Single-step)**
1. Authenticated actor uses the main search screen (SearchScreen.view.jsx)
2. `useSearchScreenController` calls `ctrlSearchResults` (no viewerActorId parameter)
3. `ctrlSearchResults` calls `searchDal(trimmed, filter, {})` — empty opts
4. `searchActors` receives `viewerActorId: null` → RPC called with `p_viewer_actor_id: null`
5. Authenticated user is treated as anonymous — personalized ranking unavailable
- Path: SearchScreen → useSearchScreenController → ctrlSearchResults:9 → searchDal({}) → searchActors:10
- Exploit Type: Single-step
- Severity: MEDIUM (functional degradation + confirmed VENOM finding)

---

## 8. Source Verification Summary

| File | Lines Read | Verified Claims |
|---|---|---|
| controller/searchResults.controller.js | 1-53 | viewerActorId never injected; hydrateActorsByIds fire-and-forget; empty opts {} passed to DAL |
| controller/searchTabs.controller.js | 1-13 | viewerActorId accepts null default; no session injection |
| dal/search.dal.js | 1-148 | searchActors: viewerActorId defaults null; searchPosts/searchPostsByTag: deleted_at/is_hidden filters present; no viewer scope on post search |
| hooks/useSearchScreenController.js | 1-141 | Module-level cache Map not identity-scoped; viewerActorId never passed to ctrlSearchResults |
| hooks/useSearchTabsActor.js | 1-99 | viewerActorId passed from props, not session |
| hooks/useSearchActor.js | 1-5 | Delegates to useSearchScreenController |
| model/search.model.js | 1-235 | userId/ownerUserId legacy fields present; normalizeActorRow safe |
| ui/ActorSearchResultRow.jsx | 1-45 | UUID fallback on line 21 confirmed |
| ui/PostCard.jsx | 1-29 | Raw UUID navigation on line 8 confirmed |
| ui/FeaturedResultCard.jsx | 1-68 | UUID fallback on line 13 confirmed |
| ui/SearchScreen.view.jsx | 1-100 | No viewerActorId source in hook call |
| screens/ExploreScreen.jsx | 1-22 | Public route, no auth gate |
| usecases/search.usecase.js | 1-18 | No viewerActorId — opts passed but not enforced |

All BYPASSED findings are backed by source-verified line citations.

---

## 9. Confidence Summary

| Category | Count | Notes |
|---|---|---|
| CRITICAL findings | 0 | No critical exploits found |
| HIGH findings | 1 | BW-EXPLORE-006 (BEHAVIOR.md placeholder — unanchored invariants) |
| MEDIUM findings | 3 | BW-EXPLORE-001, BW-EXPLORE-003, BW-EXPLORE-005 |
| LOW findings | 2 | BW-EXPLORE-002, BW-EXPLORE-004 |
| BYPASSED (source-verified) | 4 | BW-EXPLORE-001, BW-EXPLORE-005, BW-EXPLORE-006 (cache + UUID chains) |
| PARTIAL | 2 | BW-EXPLORE-002, BW-EXPLORE-004 |
| UNRESOLVED | 1 | BW-EXPLORE-003 (RLS not verified) |
| BLOCKED | 3 | Deleted/hidden post filters, empty query guards, no mutation surfaces |
| NOT APPLICABLE | 2 | Ownership bypass, mutation replay (no mutations exist) |

---

## 10. §9 Invariant Attack Map

BEHAVIOR.md is a PLACEHOLDER. No formal §9 invariants exist. All entries below are source-inferred.

| Inferred Invariant | Source Basis | Attack Type | Result | Finding |
|---|---|---|---|---|
| No raw UUIDs in public-facing navigation URLs | Platform memory rule (feedback_no_raw_ids_in_urls.md) | Single-step navigation trigger | BYPASSED | BW-EXPLORE-005 |
| Search cache must be identity-scoped | VEN-EXPLORE-004, cross-session safety | Cache poisoning via actor switch | BYPASSED | BW-EXPLORE-006 (chain 1) |
| Authenticated searches must include viewer identity | VEN-EXPLORE-002, personalization correctness | Null viewer injection | BYPASSED | BW-EXPLORE-001 |
| Deleted posts must not appear in search | Explicit DAL filter | Query deleted post text | BLOCKED | — |
| Hidden posts must not appear in search | Explicit DAL filter | Query hidden post content | BLOCKED | — |
| Hydration writes must come from validated data | Architecture layer separation | Fire-and-forget hydration | PARTIAL | BW-EXPLORE-004 |

Status: **ALL §9 INVARIANTS UNANCHORED** — no formal contract exists. BEHAVIOR.md must be written to anchor these.

---

## 11. Behavior Contract Attack Summary

| Contract Status | Impact |
|---|---|
| BEHAVIOR.md: PLACEHOLDER | All invariants are source-inferred, not formally contracted |
| §4 Failure Paths: NOT DEFINED | No failure path coverage — error handling is ad hoc |
| §5 Security Rules: NOT DEFINED | No formal security rules — all security is implicit |
| §9 Must Never Happen: NOT DEFINED | Zero anchored invariants |

**Recommendation:** BEHAVIOR.md must be authored as a prerequisite for any future THOR eligibility assessment of this feature. Until then, the feature operates without a formal security contract.

---

## 12. THOR Impact

### Release Blockers (BYPASSED findings from this run)

| Finding | Severity | THOR Blocker? | Reason |
|---|---|---|---|
| BW-EXPLORE-001 | MEDIUM | NO — existing VEN finding | Confirmed pre-existing VEN-EXPLORE-002; not new |
| BW-EXPLORE-005 | MEDIUM | YES | Raw UUID URL exposure confirmed — violates platform memory rule |
| BW-EXPLORE-006 | HIGH | YES | BEHAVIOR.md placeholder + unanchored invariants = governance blocker |

**THOR Release Blockers from BW run:**
- BW-EXPLORE-005: Raw UUID navigation in PostCard and actor fallback
- BW-EXPLORE-006: BEHAVIOR.md PLACEHOLDER — feature has no security contract

**Pre-existing THOR Blocker (VENOM):**
- VEN-EXPLORE-002: viewerActorId always null in primary search path (OPEN)

---

## 13. SPIDER-MAN Test Requirements

The following test cases are required to prevent regression of confirmed findings:

| Test ID | Type | Scenario | Expected |
|---|---|---|---|
| SM-EXPLORE-001 | Unit | ctrlSearchResults called — verify searchDal receives {} opts | searchDal 3rd arg must equal {} (no viewerActorId) |
| SM-EXPLORE-002 | Unit | ctrlSearchTabs called with null viewerActorId — verify RPC receives p_viewer_actor_id: null | RPC args validated |
| SM-EXPLORE-003 | Unit | searchPosts — verify deleted_at filter always applied | Query must have .is('deleted_at', null) |
| SM-EXPLORE-004 | Unit | searchPosts — verify is_hidden filter always applied | Query must have .or('is_hidden.is.null,is_hidden.eq.false') |
| SM-EXPLORE-005 | Unit | ActorSearchResultRow navigate with null username — verify actor_id UUID NOT used | Should navigate to /profile/{username} or show error, never /profile/{uuid} |
| SM-EXPLORE-006 | Unit | PostCard navigate — verify /posts/{id} uses slug not raw UUID | When post has slug, slug must be used |
| SM-EXPLORE-007 | Integration | Actor switch scenario — verify module-level searchResultCache cleared on actor change | Cache must be invalidated on actor switch |
| SM-EXPLORE-008 | Unit | hydrateActorsByIds in ctrlSearchResults — verify errors are not silently swallowed | Error callback must log or report, not suppress |
| SM-EXPLORE-009 | Behavior | BEHAVIOR.md authored — all §9 invariants captured as test assertions | Contract must exist before THOR gate |
