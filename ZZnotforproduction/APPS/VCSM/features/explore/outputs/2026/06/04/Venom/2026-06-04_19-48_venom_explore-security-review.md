# VENOM V2 Security Review — explore
**Feature:** explore
**Date:** 2026-06-04
**Reviewer:** VENOM (automated security sheriff)
**App:** VCSM

---

## 1. Output Metadata

| Field | Value |
|---|---|
| Feature | explore |
| Review Date | 2026-06-04 |
| Review Time | 19:48 |
| Scanner Version | 1.1.0 |
| Reviewer | VENOM V2 |
| Output Path | ZZnotforproduction/APPS/VCSM/features/explore/outputs/2026/06/04/Venom/ |
| BEHAVIOR.md Status | PLACEHOLDER — no security rules defined |
| SECURITY.md Status | CREATED (new) |
| Total Findings | 5 |
| Severity Breakdown | 0 CRITICAL / 1 HIGH / 3 MEDIUM / 1 LOW |
| THOR Release Blocker | YES — VEN-EXPLORE-002 |

---

## 2. Scanner Preflight Block

```
VENOM SCANNER PREFLIGHT
========================
Scanner Version: 1.1.0
Maps Root: /Users/vcsm/Desktop/VCSM/apps/scanner/maps
Freshness Window: 3 days

| Map                  | Generated At             | Age  | Freshness | Confidence | Status |
|---|---|---|---|---|---|
| write-surface-map    | 2026-06-04T19:48:25.152Z | <1h  | FRESH     | HIGH       | PASS   |
| rpc-map              | 2026-06-04T19:48:25.152Z | <1h  | FRESH     | HIGH       | PASS   |
| edge-function-map    | 2026-06-04T19:48:25.152Z | <1h  | FRESH     | HIGH       | PASS   |
| security-path-map    | 2026-06-04T19:48:25.152Z | <1h  | FRESH     | HIGH       | PASS   |
| route-execution-map  | 2026-06-04T19:48:25.152Z | <1h  | FRESH     | HIGH       | PASS   |
| write-execution-map  | 2026-06-04T19:48:25.152Z | <1h  | FRESH     | HIGH       | PASS   |
| rpc-execution-map    | 2026-06-04T19:48:25.152Z | <1h  | FRESH     | HIGH       | PASS   |
| edge-execution-map   | 2026-06-04T19:48:25.152Z | <1h  | FRESH     | HIGH       | PASS   |

Overall Preflight: PASS
```

---

## 3. Scanner Inputs Block

| Field | Value |
|---|---|
| Scanner Data File | /tmp/venom_features/explore.json |
| writeSurfaces count | 1 |
| rpcs count | 1 |
| securityPaths count | 2 |
| writeExecutionPaths count | 1 |
| rpcExecutionPaths count | 1 |
| edgeFunctions count | 0 |

**RPC Surface:**
- `identity.search_actor_directory` — caller: `searchActors` — file: `apps/VCSM/src/features/explore/dal/search.dal.js`

**Write Surface:**
- Operation: `rpc` — schema: `identity` — rpc: `search_actor_directory` — confidence: HIGH

**Security Path Confidence:** LOW (write surface discovered without route-confirmed path on both paths; RPC surface also without route execution confirmation)

**Scanner Notes:** The scanner did not resolve a route execution path for `search_actor_directory`. Source verification confirms the route is `/explore` inside `ProtectedRoute` → `ProfileGatedOutlet` → `RootLayout`. The LOW confidence is accurate — the scanner did not walk the React component tree to route resolution.

**Unlisted Surfaces (discovered during source inspection):**
- `vc.posts` table reads via `searchPosts()` and `searchPostsByTag()` — 2 direct `from('posts')` queries not captured in scanner write surface map (read-only, therefore not in write-surface-map, but significant for data exposure analysis)

---

## 4. Security Surface Inventory

| Surface | Type | File | Schema | Auth Enforced By | Scanner Confidence |
|---|---|---|---|---|---|
| `identity.search_actor_directory` | Supabase RPC | `dal/search.dal.js:20` | identity | Supabase JWT session (anon key used, RPC SECURITY DEFINER status unknown) | HIGH |
| `vc.posts` (text ilike search) | Supabase Table Read | `dal/search.dal.js:57-66` | vc | RLS `posts_select_actor_based` (TO authenticated) | N/A (scanner miss) |
| `vc.posts` (tag search) | Supabase Table Read | `dal/search.dal.js:95-102` | vc | RLS `posts_select_actor_based` (TO authenticated) | N/A (scanner miss) |
| `localStorage` (filter preference) | Browser Storage | `hooks/useSearchScreenController.js:64,80` | N/A | None — client-side only | N/A |

---

## 5. Scanner Signals Block

| Signal | Status | Notes |
|---|---|---|
| Route execution path resolved | PARTIAL | ProtectedRoute confirmed by source inspection; scanner did not resolve it |
| viewerActorId always null on primary search path | CONFIRMED | `ctrlSearchResults` passes `{}` to `searchDal` — `viewerActorId` defaults to null |
| BEHAVIOR.md has §5 Security Rules | NO | BEHAVIOR.md is a PLACEHOLDER — no security rules |
| BEHAVIOR.md has §9 Must Never Happen | NO | BEHAVIOR.md is a PLACEHOLDER — no invariants |
| Posts table RLS enforced | CONFIRMED | `posts_select_actor_based` — TO authenticated, block exclusion present |
| Edge functions present | NONE | 0 edge functions for this feature |
| Moderation / admin surface | NONE | No moderation endpoints in explore |

---

## 6. Behavior Contract Status Block

**BEHAVIOR.md Path:** `ZZnotforproduction/APPS/VCSM/features/explore/BEHAVIOR.md`
**Status:** PLACEHOLDER

The BEHAVIOR.md file exists but is entirely a placeholder with no content beyond:
```
Status: PLACEHOLDER
Feature: explore
Notes: Behavior contract pending source review.
```

- §5 Security Rules: NOT DEFINED — 0 rules to verify
- §9 Must Never Happen: NOT DEFINED — 0 invariants to verify

This is itself a finding (see VEN-EXPLORE-001). All security rule verification in this report is derived from source code inspection only, not from a behavior contract.

---

## 7. Trust Boundary Findings

---

### VEN-EXPLORE-001

```
VENOM SECURITY FINDING
- Finding ID: VEN-EXPLORE-001
- Location: ZZnotforproduction/APPS/VCSM/features/explore/BEHAVIOR.md:1-9
- Application Scope: VCSM
- Platform Surface: Documentation / Governance
- Trust Boundary: Engineering governance
- Boundary Violated: No behavioral security contract exists for this feature
- Contract Violated: VCSM contributor contract — behavior contracts required before THOR eligibility
- Current behavior: BEHAVIOR.md is a placeholder with no §5 Security Rules and no §9 Must Never Happen invariants. Security review cannot verify behavioral intent — only actual source.
- Risk: Security reviews and regressions cannot be anchored to behavioral intent. Guards may be removed without a contract to check against. SPIDER-MAN cannot write coverage tied to specified invariants.
- Severity: MEDIUM
- Exploitability: LOW
- Attack Preconditions: N/A — governance finding, not an exploitable surface
- Blast Radius: Feature governance; any future change to explore could silently violate a security invariant with no contract to reference
- Identity Leak Type: None
- Cache Trust Type: None
- RLS Dependency: NONE
- Why it matters: A missing behavior contract means THOR cannot gate this feature, SPIDER-MAN cannot write coverage from spec, and ELEKTRA has no source-of-truth for invariant verification. Every future security audit starts from scratch.
- Recommended mitigation: Write BEHAVIOR.md §5 (Security Rules) and §9 (Must Never Happen) sections. Minimum §5 rules: (1) search requires authenticated session; (2) posts query must not expose private-actor content without follow relationship; (3) viewerActorId must be injected from verified session, not client-supplied. Minimum §9: (1) never expose raw user_id in search results; (2) never return void posts in public search.
- Rationale: Behavior contracts are the foundation of all downstream security commands (ELEKTRA, SPIDER-MAN, THOR). Without one, the feature has no governance anchor.
- Follow-up command: SPIDER-MAN (write coverage from contract once written)
- Provenance: SOURCE_VERIFIED
- CISSP Domain:
  - Primary: Security Assessment and Testing
  - Secondary: Software Development Security
```

---

### VEN-EXPLORE-002

```
VENOM SECURITY FINDING
- Finding ID: VEN-EXPLORE-002
- Location: apps/VCSM/src/features/explore/controller/searchResults.controller.js:9
- Application Scope: VCSM
- Platform Surface: PWA — React hook → controller → DAL → Supabase RPC
- Trust Boundary: Authenticated session viewer identity
- Boundary Violated: viewerActorId is always null when the primary search path is used — the viewer's identity is never injected into the search_actor_directory RPC
- Contract Violated: VCSM identity contract — all actor-scoped operations must resolve actor identity from session, never trust null/client-supplied values
- Current behavior: `ctrlSearchResults` calls `searchDal(trimmed, filter, {})` with an empty opts object. No `viewerActorId` is passed. Inside `searchActors()`, `viewerActorId` defaults to null. The RPC receives `p_viewer_actor_id: null` on every call from the primary search path (useSearchScreenController → ctrlSearchResults). Only `useSearchTabsActor → ctrlSearchTabs` allows a caller-supplied viewerActorId, but even that hook's callers pass `viewerActorId = null` by default (no caller was found supplying a real identity).
- Risk: If `identity.search_actor_directory` uses `p_viewer_actor_id` to personalize results (e.g., exclude blocked actors, hide private accounts from non-followers, rank by social graph), this logic is silently skipped for all primary search traffic. The RPC may also use the viewer identity for audit/logging. With null always passed, the RPC behaves as if the viewer is anonymous — potentially exposing content that should be filtered.
- Severity: HIGH
- Exploitability: MEDIUM
- Attack Preconditions: Authenticated session on VCSM; issue occurs for all users on every search, not just attackers
- Blast Radius: All search results for all authenticated users — every actor search call via the primary path sends null viewer identity to the RPC
- Identity Leak Type: Session identity not injected — viewer anonymized to RPC
- Cache Trust Type: Module-level in-memory cache keyed on query+filter without viewer identity — cached results from one session may be served to another if query+filter match (browser tab sharing same module instance within a session)
- RLS Dependency: ASSUMED — the RPC SECURITY DEFINER status is unverified; if it bypasses RLS it may apply its own access logic based on p_viewer_actor_id
- Why it matters: The `search_actor_directory` RPC was explicitly designed to receive viewer context (`p_viewer_actor_id`). By always sending null, the platform degrades to anonymous search behavior for all users, potentially surfacing content that should be filtered by social graph, blocks, or privacy settings at the RPC layer.
- Recommended mitigation: In `ctrlSearchResults`, resolve the viewer's actorId from the session before calling `searchDal`. Inject it as `opts.viewerActorId`. Pattern: use `useIdentity()` at the hook layer (useSearchScreenController) to get `actorId` and pass it down to the controller as a parameter. Do not trust client-supplied values — always derive from Supabase session via `auth.getUser()` or the platform identity resolver.
- Rationale: The RPC parameter exists for a reason. Sending null disables whatever personalization and access filtering the RPC implements for viewer context.
- Follow-up command: DB (verify what p_viewer_actor_id controls inside search_actor_directory), ELEKTRA (trace the null identity through the RPC's SECURITY context)
- Provenance: SOURCE_VERIFIED
- CISSP Domain:
  - Primary: Access Control
  - Secondary: Identity and Access Management, Software Development Security
```

---

### VEN-EXPLORE-003

```
VENOM SECURITY FINDING
- Finding ID: VEN-EXPLORE-003
- Location: apps/VCSM/src/features/explore/dal/search.dal.js:57-83
- Application Scope: VCSM
- Platform Surface: PWA — Supabase Table Read (vc.posts)
- Trust Boundary: Authenticated user session → PostgREST → vc.posts RLS
- Boundary Violated: Post search queries expose actor_id (UUID) in search result objects that are passed to UI; post navigation uses raw UUID in URL (/posts/{post.id})
- Contract Violated: Platform memory rule — "Raw UUIDs must never appear in public-facing URLs — always use human-readable slugs"
- Current behavior: `searchPosts()` and `searchPostsByTag()` both select `id, actor_id, text, title, tags, created_at` from `vc.posts`. The `id` (post UUID) is returned in search results and used in `PostCard.jsx:14` as `navigate('/posts/${post.id}')`. The `actor_id` (UUID) is also surfaced in the result object passed through the model and rendered context.
- Risk: (1) Raw post UUIDs appear in browser URLs and navigation state — violates platform slug policy. (2) actor_id UUIDs in result objects are accessible to any component that receives the search result, creating an unintentional identity leak path if a component renders or logs this field.
- Severity: MEDIUM
- Exploitability: LOW
- Attack Preconditions: Authenticated user performing a post search; UUID is visible in browser URL bar and browser history
- Blast Radius: All post search results and post navigation from explore; affects any user who clicks a post result
- Identity Leak Type: Raw UUID exposed in browser URL and result objects (post.id, post.actor_id)
- Cache Trust Type: None (navigation-time URL construction)
- RLS Dependency: NONE (URL construction issue, not RLS)
- Why it matters: Raw UUIDs in URLs are a platform policy violation that also leaks implementation details (database record IDs), enables enumeration if posts lack proper RLS per-UUID guards, and conflicts with the platform's human-readable URL contract (QR, share links, copy-link).
- Recommended mitigation: Posts should navigate by a slug or short-code, not the raw UUID. If no slug exists on vc.posts, this is a schema gap that must be tracked (Carnage). In the short term, at minimum, remove actor_id from the search result object returned by searchPosts() — it is not used by PostCard and should not be propagated. The /posts/:postId route pattern itself is an app-wide concern, but the explore feature is an active perpetuator.
- Rationale: Platform memory contract is explicit. The actor_id in post results is also an VCSM identity contract violation (actor_id should not be used as a navigable identifier in URLs without slug wrapping).
- Follow-up command: Carnage (add post slug column if missing), SPIDER-MAN (regression test slug navigation)
- Provenance: SOURCE_VERIFIED
- CISSP Domain:
  - Primary: Software Development Security
  - Secondary: Access Control
```

---

### VEN-EXPLORE-004

```
VENOM SECURITY FINDING
- Finding ID: VEN-EXPLORE-004
- Location: apps/VCSM/src/features/explore/hooks/useSearchScreenController.js:10-11
- Application Scope: VCSM
- Platform Surface: PWA — Module-level in-memory search cache
- Trust Boundary: Browser session isolation
- Boundary Violated: Module-level cache (`searchResultCache`, `searchInflight`) is shared across all React renders within the same JS module instance; cache key is `filter:query` only — does not include viewer identity
- Contract Violated: Platform cache trust contract — viewer-personalized results must be keyed on viewer identity
- Current behavior: `searchResultCache` and `searchInflight` are module-level `Map` instances (lines 10-11). Cache key is `${filter}:${query.trim().toLowerCase()}` (line 13). No viewer identity is included in the key. If two users share the same browser (e.g., public device, family device), the second user can receive cached search results from the first user's session. Additionally, with VEN-EXPLORE-002 in play (viewerActorId always null), the RPC results are viewer-agnostic but cached as if they're generic — if the RPC ever starts using viewer identity (after VEN-EXPLORE-002 is fixed), the cache will serve incorrect cross-viewer results.
- Risk: (1) Cross-session cache poisoning on shared-device scenarios. (2) Cache will silently produce wrong personalized results if VEN-EXPLORE-002 is fixed without also fixing the cache key. (3) 45-second TTL means stale results can persist across identity switches (e.g., actor switching in VCSM).
- Severity: MEDIUM
- Exploitability: LOW
- Attack Preconditions: Two users sharing a browser instance (public device or family device); or a single user switching active actors within the 45-second TTL window
- Blast Radius: Search result leakage across sessions on shared devices; incorrect personalization after actor switch
- Identity Leak Type: Cached results cross session boundaries — one user's search results may be served to another
- Cache Trust Type: MODULE_LEVEL_UNSCOPED — cache not bound to viewer identity or session lifecycle
- RLS Dependency: NONE (cache operates above the DB layer)
- Why it matters: VCSM has actor switching — a user can switch between a personal actor and a Vport actor. The 45-second in-memory cache does not respect this switch. Additionally, shared device scenarios (common in the target demographic) can leak one person's search history to another.
- Recommended mitigation: Include viewer actorId in the cache key: `${actorId}:${filter}:${query}`. Clear the cache on actor switch / session change. Alternatively, move the cache to session-scoped storage or eliminate it in favor of the native Supabase/React Query caching layer which is session-aware.
- Rationale: Search caches that don't scope to viewer identity are a known cross-session information leak pattern in multi-user / actor-switch applications.
- Follow-up command: ELEKTRA (verify actor switch clears all in-memory caches across features)
- Provenance: SOURCE_VERIFIED
- CISSP Domain:
  - Primary: Access Control
  - Secondary: Software Development Security
```

---

### VEN-EXPLORE-005

```
VENOM SECURITY FINDING
- Finding ID: VEN-EXPLORE-005
- Location: apps/VCSM/src/features/explore/model/search.model.js:26,48
- Application Scope: VCSM
- Platform Surface: PWA — search result model
- Trust Boundary: Internal model layer → UI consumer
- Boundary Violated: Legacy identity fields (userId, ownerUserId) are propagated from DB rows into model objects and available to any UI consumer
- Contract Violated: VCSM identity contract — "Never expose profileId or vportId through any public hook or controller surface"; user_id is a legacy auxiliary field and must not be surfaced
- Current behavior: `mapActorSearchResult()` (line 26) returns `userId: row.user_id ?? null` labeled "legacy only". `mapVportSearchResult()` (line 48) returns `ownerUserId: row.owner_user_id ?? null`. These are propagated through the model into search result objects. While the UI components inspected (ActorSearchResultRow, FeaturedResultCard, PostCard) do not render these fields, any future component or caller that receives search results can access these legacy IDs. The `normalizeActorRow()` function does NOT return user_id, showing inconsistency in which model functions enforce this rule.
- Risk: Legacy user_id and owner_user_id fields in result objects represent a persistent identity leak surface. If any current or future UI component logs, renders, or transmits these fields, raw user-level IDs are exposed. This is particularly acute for ownerUserId on VPORT results, which is a relational join to auth.users.
- Severity: LOW
- Exploitability: LOW
- Attack Preconditions: A UI component or logging path that reads the search result object and accesses userId or ownerUserId; no such path was found in current source, but the data is present in the object
- Blast Radius: Limited — current UI does not render these fields; risk is future exposure
- Identity Leak Type: Legacy user_id/owner_user_id present in model objects — not rendered currently but structurally available
- Cache Trust Type: None
- RLS Dependency: NONE
- Why it matters: The VCSM identity contract explicitly bans exposing user_id through public surfaces. Having it in the model object — even if unused by current UI — is a contract violation and a latent leak risk as the feature grows.
- Recommended mitigation: Remove `userId` from `mapActorSearchResult()` and `ownerUserId` from `mapVportSearchResult()`. These functions are the model boundary — they should enforce the contract, not preserve legacy fields for hypothetical future use. If these values are needed for internal logic, they must not be in the public model output.
- Rationale: Defense in depth — the model layer is the last line of defense before UI. Stripping legacy IDs here closes the surface permanently.
- Follow-up command: SPIDER-MAN (regression: verify userId/ownerUserId absent from normalized search result objects in tests)
- Provenance: SOURCE_VERIFIED
- CISSP Domain:
  - Primary: Software Development Security
  - Secondary: Privacy Protection
```

---

## 8. Source Verification Summary

| File | Read | Key Findings |
|---|---|---|
| `dal/search.dal.js` | YES | viewerActorId always null from primary path; ilike is PostgREST-parameterized (not SQL injection); no query length cap; no void/realm filter |
| `controller/searchResults.controller.js` | YES | Passes empty opts to searchDal — viewerActorId gap confirmed |
| `controller/searchTabs.controller.js` | YES | Accepts viewerActorId param but callers default to null |
| `hooks/useSearchScreenController.js` | YES | Module-level cache without viewer scope; localStorage for filter pref; no auth check before searching |
| `hooks/useSearchTabsActor.js` | YES | Caller passes viewerActorId=null default; race-safe cancellation present |
| `hooks/useSearchActor.js` | YES | Thin re-export of useSearchScreenController |
| `model/search.model.js` | YES | userId/ownerUserId in model output; normalizeActorRow correct (no user_id); normalizeResult filters non-actor types correctly |
| `screens/ExploreScreen.jsx` | YES | Delegates to SearchScreen; no auth check (covered by ProtectedRoute) |
| `ui/SearchScreen.view.jsx` | YES | No auth check — correct, relies on route guard |
| `ui/PostCard.jsx` | YES | Raw UUID post.id in navigate URL — VEN-EXPLORE-003 confirmed |
| `ui/ActorSearchResultRow.jsx` | YES | Navigates by username ?? actor_id — fallback to UUID noted but username is preferred |
| `ui/FeaturedResultCard.jsx` | YES | Navigates by username ?? actor_id; safe for feature type |
| `ui/ExploreFeed.jsx` | YES | Disabled via `SHOW_EXPLORE_DISCOVERY_BLOCKS = false` — stub data in CitizensRow/VportsRow is dev-only, not a production concern |
| `ui/CitizensRow.jsx` | YES | Hardcoded stub data — feature-flagged off |
| `ui/VportsRow.jsx` | YES | Hardcoded stub data — feature-flagged off |
| `ui/ResultList.jsx` | YES | No security concerns — pure rendering |
| `ui/features/WanderCardSearch.jsx` | YES | Navigates to /wanders/create with optional realmId/baseUrl via location.state — safe, UI-only |
| `usecases/search.usecase.js` | YES | Thin wrapper around searchDal — no callers found in feature; appears unused |
| `app/guards/ProtectedRoute.jsx` | YES | Enforces Supabase auth session, email verification, legal consent — explore is inside this guard |
| `app/routes/protected/app.routes.jsx` | YES | Confirmed /explore is under ProtectedRoute |
| `supabase/migrations/20260510020000` | YES | posts_select_actor_based — TO authenticated; block exclusion present; no anon policy |

**VERIFIED SAFE:**
- Route access control — ProtectedRoute enforces auth, email verification, legal consent
- posts RLS — `posts_select_actor_based` with TO authenticated enforces ownership + follow + block exclusion at DB layer
- ilike query safety — PostgREST parameterizes all filters; no raw SQL injection risk
- filter parameter — `mapFilter()` in searchActors whitelists to 'users'/'vports'/'all'; searchDal switch is enumerated
- ExploreFeed stub data — disabled via compile-time flag; CitizensRow/VportsRow render hardcoded data only

---

## 9. Confidence Summary

| Finding | Confidence | Basis |
|---|---|---|
| VEN-EXPLORE-001 | HIGH | BEHAVIOR.md content read directly |
| VEN-EXPLORE-002 | HIGH | Full call chain traced: SearchScreen → useSearchScreenController → ctrlSearchResults → searchDal → searchActors (opts={}) |
| VEN-EXPLORE-003 | HIGH | PostCard line 14 read directly; platform slug rule in memory contract |
| VEN-EXPLORE-004 | HIGH | Module-level cache at lines 10-11; cache key function at line 13 read directly |
| VEN-EXPLORE-005 | HIGH | model lines 26, 48 read directly; identity contract in CLAUDE.md |

Overall VENOM confidence: **HIGH** — all findings are SOURCE_VERIFIED with direct file + line citations.

---

## 10. THOR Impact

| Finding | THOR Gate | Rationale |
|---|---|---|
| VEN-EXPLORE-001 | BLOCKER | BEHAVIOR.md is required for THOR eligibility per contributor contract |
| VEN-EXPLORE-002 | BLOCKER | Viewer identity not injected into RPC — personalization and access filtering potentially disabled for all users |
| VEN-EXPLORE-003 | ADVISORY | Platform policy violation (UUID in URL) — pre-existing app-wide pattern, not explore-unique; THOR should track but may not block alone |
| VEN-EXPLORE-004 | ADVISORY | Low exploitability — shared device scenario only; not a production THOR block independently |
| VEN-EXPLORE-005 | ADVISORY | Latent risk — current UI does not render userId; not a production blocker alone |

**THOR Release Blocker:** YES — VEN-EXPLORE-002 (viewer identity gap) and VEN-EXPLORE-001 (no behavior contract)

---

## 11. Required Follow-Up Commands

| Command | Trigger | Finding |
|---|---|---|
| DB | Verify what `p_viewer_actor_id` controls inside `identity.search_actor_directory` — does null cause silent access degradation? | VEN-EXPLORE-002 |
| ELEKTRA | Trace null identity through the RPC's SECURITY DEFINER execution context; verify SECURITY INVOKER vs DEFINER for search_actor_directory | VEN-EXPLORE-002 |
| ELEKTRA | Verify actor switch clears all module-level in-memory caches across features | VEN-EXPLORE-004 |
| Carnage | Assess whether vc.posts has a slug column; if not, plan migration to add post slug for URL routing | VEN-EXPLORE-003 |
| SPIDER-MAN | Write coverage anchored to BEHAVIOR.md once §5 and §9 are populated | VEN-EXPLORE-001 |
| SPIDER-MAN | Regression: verify userId/ownerUserId absent from normalized search result objects | VEN-EXPLORE-005 |

---

## 12. Mitigation Plan

| Finding ID | Severity | Action | Owner | Effort |
|---|---|---|---|---|
| VEN-EXPLORE-001 | MEDIUM | Write BEHAVIOR.md §5 and §9 for explore feature | Engineering | Low (1–2h authoring) |
| VEN-EXPLORE-002 | HIGH | Inject viewerActorId from session into ctrlSearchResults; derive at hook layer via useIdentity | Engineering | Low–Medium (hook layer change + controller param) |
| VEN-EXPLORE-003 | MEDIUM | Remove actor_id from searchPosts result; assess post slug migration with Carnage | Engineering + DB | Medium (schema review needed) |
| VEN-EXPLORE-004 | MEDIUM | Add actorId to cache key; clear cache on actor switch/session change | Engineering | Low (cache key change + clear hook) |
| VEN-EXPLORE-005 | LOW | Remove userId from mapActorSearchResult; remove ownerUserId from mapVportSearchResult | Engineering | Low (model cleanup, 2 lines) |

---

## 13. CISSP Domain Coverage Summary

| CISSP Domain | Findings | Notes |
|---|---|---|
| Access Control | VEN-EXPLORE-002, VEN-EXPLORE-004 | Viewer identity gap + cache session isolation |
| Software Development Security | VEN-EXPLORE-001, VEN-EXPLORE-002, VEN-EXPLORE-003, VEN-EXPLORE-004, VEN-EXPLORE-005 | All findings have a secure coding component |
| Identity and Access Management | VEN-EXPLORE-002 | Session identity not injected to RPC |
| Security Assessment and Testing | VEN-EXPLORE-001 | Missing behavior contract blocks testability |
| Privacy Protection | VEN-EXPLORE-005 | Legacy user_id in model objects |
| Communication and Network Security | None | No edge functions; all requests through Supabase PostgREST |
| Security Operations | None | No operational surface in explore |
| Asset Security | VEN-EXPLORE-003 | Raw UUIDs as asset identifiers in URLs |
