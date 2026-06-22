# SPIDER-MAN — Coverage Report
**Scope:** VCSM:explore
**Date:** 2026-06-05
**Ticket:** TICKET-EXPLORE-BUNDLE-SECURITY-PHASE-0001
**Release Safety:** BLOCKED

---

## §0 — Preflight

### ARCHITECT Mapping Gate
| Check | Result |
|---|---|
| Evidence bundle | ZZnotforproduction/GOVERNANCE/outputs/2026/06/05/ARCHITECT/evidence-bundle.md |
| Scope | VCSM:explore |
| Report age | 0 days |
| Status | PASS |

### BEHAVIOR.md Gate
| Check | Result |
|---|---|
| Path | ZZnotforproduction/APPS/VCSM/features/explore/BEHAVIOR.md |
| Status | DRAFT |
| Authored | 2026-06-05 |
| Age | 0 days |
| Sections | 13 |
| BEH IDs | 7 (BEH-EXPLORE-001 through BEH-EXPLORE-007) |
| SEC IDs | 6 (SEC-EXPLORE-001 through SEC-EXPLORE-006) |
| NEVER IDs | 6 (NEVER-EXPLORE-001 through NEVER-EXPLORE-006) |
| Stub check | NOT A STUB — fully populated |
| Gate | PASS |

**Note:** BEHAVIOR.md is DRAFT status — requires engineering review to reach APPROVED. Findings below are anchored to declared behaviors. When BEHAVIOR.md reaches APPROVED, this SPIDER-MAN report must be re-run.

---

## §18 — Scanner Preflight

All scanner maps verified FRESH (generated 2026-06-05T03:29:11.562Z — age 0 days).

| Map | Path | Status | Age |
|---|---|---|---|
| test-map.json | apps/scanner/maps/test-map.json | FRESH | 0 days |
| test-traceability-map.json | apps/scanner/maps/test-traceability-map.json | FRESH | 0 days |
| write-execution-map.json | apps/scanner/maps/write-execution-map.json | FRESH | 0 days |
| rpc-execution-map.json | apps/scanner/maps/rpc-execution-map.json | FRESH | 0 days |
| security-path-map.json | apps/scanner/maps/security-path-map.json | FRESH | 0 days |
| callgraph.json | apps/scanner/maps/callgraph.json | FRESH | 0 days |

Trust rule S-011 satisfied — maps are all FRESH, signals are authoritative.

---

## §24 — Scanner Inputs

Scanner map queries executed against the VCSM:explore scope.

| Map | Explore Signals |
|---|---|
| test-map.json | 0 |
| test-traceability-map.json | 0 |
| security-path-map.json | 0 (out of 598 total security paths) |
| rpc-execution-map.json | 0 |
| callgraph.json | 0 |
| write-execution-map.json | 0 |

**Total scanner coverage for explore scope: 0 signals across all maps.**

---

## §25 — Scanner Signals

No explore signals found in any scanner map. All coverage analysis below is derived from ARCHITECT module inventory cross-referenced against filesystem search (0 test files found in `apps/VCSM/src/features/explore/`).

---

## §19 — ARCHITECT Module Coverage Table

Coverage scope sourced from ARCHITECTURE.md (ARCHITECT V2, 2026-06-05). Every module is UNCOVERED.

### DAL Layer — 6 functions in `dal/search.dal.js`

| Function | Coverage | Test File | Findings |
|---|---|---|---|
| searchActors | UNCOVERED | — | No test for RPC call, null viewerActorId, error propagation |
| searchPosts | UNCOVERED | — | No test for parallel ilike + contains, filter application |
| searchPostsByTag | UNCOVERED | — | No test for tag-only mode activation |
| searchPostsByText | UNCOVERED | — | No test for text-only query path |
| searchDal (dispatcher) | UNCOVERED | — | No test for filter routing, hashtag detection, dispatch logic |
| (6th DAL function) | UNCOVERED | — | No test coverage |

### Model Layer — 9 functions in `model/search.model.js`

| Function | Coverage | Test File | Findings |
|---|---|---|---|
| normalizeActorRow | UNCOVERED | — | No test for null-username filter (security patch path) |
| normalizeResult | UNCOVERED | — | No test for post case; slug field absent from output (HAWK-002 surface) |
| dedupeByKindAndId | UNCOVERED | — | No test for deduplication logic |
| mapActorSearchResult | UNCOVERED | — | No test; legacy userId field still present |
| mapVportSearchResult | UNCOVERED | — | No test; legacy ownerUserId field still present; slug mapping present |
| mapPostSearchResult | UNCOVERED | — | No test; slug field absent from normalizeResult (HAWK-002 root) |
| mapVideoSearchResult | UNCOVERED | — | No test (stub returns empty) |
| mapGroupSearchResult | UNCOVERED | — | No test (stub returns empty) |
| mapSearchResult | UNCOVERED | — | No test for dispatch to type-specific mappers |

### Controller Layer — 3 in `controller/`

| Controller | Coverage | Test File | Active? | Findings |
|---|---|---|---|---|
| ctrlSearchResults | UNCOVERED | — | YES | No regression test for viewerActorId injection (primary security fix); no test for feature injection logic |
| ctrlSearchTabs | UNCOVERED | — | NO (ORPHANED) | Dead code — not imported by active render tree; still requires coverage if activated |
| searchUsecase | UNCOVERED | — | NO (ORPHANED) | Dead code — Promise.allSettled variant; not in active render tree |

### Hook Layer — 9 hooks

| Hook | Coverage | Test File | Active? | Findings |
|---|---|---|---|---|
| useSearchScreenController | UNCOVERED | — | YES | No test for cache key scoping, debounce behavior, inflight dedup, FIFO eviction bug, error state |
| useSearchActor | UNCOVERED | — | YES (adapter shim) | No test for re-export shim |
| useSearchTabsActor | UNCOVERED | — | NO (ORPHANED) | Dead code — not imported by SearchScreen.view.jsx |
| (6 additional hooks) | UNCOVERED | — | VARIES | No coverage |

### Component Layer — 11 components in `ui/`

| Component | Coverage | Test File | Active? | Findings |
|---|---|---|---|---|
| ActorSearchResultRow | UNCOVERED | — | YES | No regression test for UUID fallback removal (security patch); no test for null-username behavior |
| FeaturedResultCard | UNCOVERED | — | YES | No regression test for UUID fallback removal (security patch, highest-frequency surface) |
| PostCard | UNCOVERED | — | YES | No test for slug-gated navigation; HAWK-002 regression undetected (onClick always undefined) |
| ResultList | UNCOVERED | — | YES | No test for actor/post split logic, hashtag-only mode |
| EmptyState | UNCOVERED | — | YES | No test |
| ExploreFeed | UNCOVERED | — | YES | No test |
| FeatureSearchResultRow | UNCOVERED | — | YES | No test |
| FilterTabs | UNCOVERED | — | DEAD | CONFIRMED DEAD — not imported anywhere; delete candidate |
| CitizensRow | UNCOVERED | — | DEAD RUNTIME | Behind hardcoded false flag — unreachable at runtime |
| VportsRow | UNCOVERED | — | DEAD RUNTIME | Behind hardcoded false flag — unreachable at runtime |
| WanderCardSearch | UNCOVERED | — | YES | No test for feature injection rendering |

### Screen Layer — 2 screens

| Screen | Coverage | Test File | Findings |
|---|---|---|---|
| ExploreScreen | UNCOVERED | — | No test for Suspense boundary, CSS import from cross-feature path |
| SearchScreen.view | UNCOVERED | — | No test for idle state, search state transition, onboarding adapter integration |

---

## §8 — Behavior Coverage Summary

All 7 BEH behaviors are UNPROTECTED. Zero test proves any declared behavior.

| BEH ID | Behavior | Coverage | Risk |
|---|---|---|---|
| BEH-EXPLORE-001 | Free-text actor search (full path DAL→Model→Controller→Hook→Component) | UNPROTECTED | HIGH — viewerActorId injection fix has no regression guard |
| BEH-EXPLORE-002 | Free-text post search (parallel ilike + contains, normalizeResult) | UNPROTECTED | CRITICAL — HAWK-002 regression undetected; post slug data broken |
| BEH-EXPLORE-003 | Hashtag search (# prefix detection → searchPostsByTag only) | UNPROTECTED | HIGH — mode switching logic untested |
| BEH-EXPLORE-004 | Filter tab selection (localStorage persistence, cache invalidation) | UNPROTECTED | MEDIUM |
| BEH-EXPLORE-005 | Wanders feature injection (query match, feature item shape) | UNPROTECTED | MEDIUM |
| BEH-EXPLORE-006 | Cache hit (45s TTL, inflight dedup, actorId-scoped key) | UNPROTECTED | HIGH — actorId cache scoping fix has no regression guard |
| BEH-EXPLORE-007 | Empty query guard (no fetch on whitespace) | UNPROTECTED | HIGH — NEVER-EXPLORE-006 invariant; untested |

SEC rules from §5:

| SEC ID | Security Rule | Coverage | Risk |
|---|---|---|---|
| SEC-EXPLORE-001 | viewerActorId MUST come from authenticated session | UNPROTECTED | CRITICAL — primary security fix; zero regression test |
| SEC-EXPLORE-002 | Post visibility filters applied to all vc.posts queries | UNPROTECTED | HIGH |
| SEC-EXPLORE-003 | Actor privacy/block enforcement via server-side RPC | UNPROTECTED | HIGH — depends on SEC-001; if SEC-001 reverts, blocks bypass silently |
| SEC-EXPLORE-004 | Navigation MUST use slugs/usernames, never raw UUIDs | UNPROTECTED | CRITICAL — both fix paths (actor UUID guard, post slug) patched with zero regression test |
| SEC-EXPLORE-005 | Cache MUST be scoped to authenticated viewer | UNPROTECTED | HIGH — actorId prefix added; no regression guard |
| SEC-EXPLORE-006 | Legacy userId/ownerUserId removed from model output | UNPROTECTED | LOW |

---

## §23 — Invariant Coverage Table (Must Never Happen)

S4 rule: NEVER IDs are P0 — untested NEVER invariants are THOR-blocking release blockers.

All 6 NEVER-EXPLORE invariants are UNCOVERED. All are THOR BLOCKED.

| NEVER ID | Invariant | Coverage | THOR Block? |
|---|---|---|---|
| NEVER-EXPLORE-001 | Raw actor_id UUID in public navigation URL | UNCOVERED | YES — P0 |
| NEVER-EXPLORE-002 | Raw post.id UUID in public navigation URL | UNCOVERED | YES — P0 |
| NEVER-EXPLORE-003 | viewerActorId from client-controlled input | UNCOVERED | YES — P0 |
| NEVER-EXPLORE-004 | Blocked actor in search results for blocking viewer | UNCOVERED | YES — P0 |
| NEVER-EXPLORE-005 | Deleted post in search results | UNCOVERED | YES — P0 |
| NEVER-EXPLORE-006 | Search fetch on empty/whitespace query | UNCOVERED | YES — P0 |

---

## §21 — BW/ELEK Coverage Linkage

### BlackWidow Findings — Test Coverage Status

| Finding ID | Severity | Description | Test Required | Coverage |
|---|---|---|---|---|
| BW-EXPLORE-001 | HIGH | ctrlSearchResults never injects viewerActorId — p_viewer_actor_id null for all auth searches; blocks/privacy bypassed | Exploit test: authenticated search must send non-null viewerActorId | UNCOVERED |
| BW-EXPLORE-002 | LOW | useSearchTabsActor viewerActorId prop-sourced (secondary path) | Negative: prop override must not be accepted | UNCOVERED |
| BW-EXPLORE-003 | MEDIUM | searchPosts/searchPostsByTag no viewer-scoped privacy filter | Test: private actor post must not appear in post search results | UNCOVERED |
| BW-EXPLORE-004 | LOW | hydrateActorsByIds fire-and-forget with silenced errors | Test: hydration failure must not crash or corrupt state | UNCOVERED |
| BW-EXPLORE-005 | HIGH | Raw UUID navigation (PostCard + ActorSearchResultRow) | Regression: no UUID in any generated navigation URL | UNCOVERED |
| BW-EXPLORE-006 | MEDIUM | BEHAVIOR.md was PLACEHOLDER — PARTIALLY MITIGATED | Covered by BEHAVIOR.md authoring — N/A for test coverage | N/A |
| BW-EXPLORE-007 | HIGH | FeaturedResultCard UUID fallback — highest-frequency surface | Regression: FeaturedResultCard must never emit UUID URL | UNCOVERED |
| BW-EXPLORE-008 | MEDIUM | /explore route access conflict — auth enforcement unverified | Router test: unauthenticated access attempt to /explore | UNCOVERED |

### ELEKTRA Findings — Regression Test Status

| Finding ID | Severity | Patch Status | Regression Test | Coverage |
|---|---|---|---|---|
| ELEK-001 | HIGH | PARTIAL_SOURCE_VERIFIED — viewerActorId SESSION_BIND present in source | Regression: authenticated search must inject session actorId to RPC | UNCOVERED |
| ELEK-002 | HIGH | PARTIAL_SOURCE_VERIFIED — UUID guard in model + component confirmed | Regression: model must return null for null-username actor; component must not emit UUID URL | UNCOVERED |
| ELEK-003 | MEDIUM | PARTIAL_SOURCE_VERIFIED — actorId cache prefix confirmed in source | Regression: cache key must include actorId; two actors must not share cache entries | UNCOVERED |
| ELEK-004 | LOW | STILL_OPEN — deferred to IRONMAN | Regression: userId/ownerUserId must not appear in normalized output | UNCOVERED |
| ELEK-005 | HIGH | PARTIAL_SOURCE_VERIFIED — FeaturedResultCard UUID guard confirmed | Regression: FeaturedResultCard must not emit UUID URL | UNCOVERED |
| ELEK-006 | MEDIUM | STILL_OPEN — HAWKEYE addressed (metadata-only conflict) | Router test: barrel public flag alignment | UNCOVERED |
| ELEK-007 | MEDIUM | STILL_OPEN — vc.posts RLS unverified | DB test: vc.posts RLS must block deleted/hidden post reads | UNCOVERED |

### HAWKEYE Findings — Test Coverage Status

| Finding ID | Severity | Description | Test Required | Coverage |
|---|---|---|---|---|
| HAWK-2026-06-05-002 | HIGH (THOR Block) | PostCard post.slug always undefined — DAL selects no slug column; model maps no slug field; onClick always undefined — ALL post results non-navigable | Regression: DAL must select slug column; model must map slug field; PostCard onClick must be defined for any post with slug | UNCOVERED |
| HAWK-2026-06-05-003 | MEDIUM | vc.posts RLS coverage for anon reads unverified | DB test: anonymous reader must not see posts from private actors | UNCOVERED |
| HAWK-2026-06-05-004 | MEDIUM | /explore barrel public:false conflicts with effective public access | Router test | UNCOVERED |

---

## §5 — Findings

### SM-EXPLORE-001 | P0 | THOR BLOCKED | Zero test coverage — all §9 invariants unprotected

**Severity:** P0 — Release Blocker
**Layer:** ALL
**ARCHITECT Modules Affected:** All 40 confirmed modules (6 DAL, 9 Model, 3 Controller, 9 Hook, 11 Component, 2 Screen)
**BEH Coverage:** 0/7 BEH-EXPLORE behaviors protected
**SEC Coverage:** 0/6 SEC-EXPLORE rules protected
**NEVER Coverage:** 0/6 NEVER-EXPLORE invariants protected

**Evidence:**
- 0 test files found in `apps/VCSM/src/features/explore/`
- 0 explore entries in test-map.json (scanner FRESH, age 0 days)
- 0 explore entries in test-traceability-map.json
- 0 explore entries in security-path-map.json (598 total paths — none in explore)
- 0 explore entries in callgraph.json
- ARCHITECT ARCHITECTURE.md: "Tests/validation noted: FAIL — 0 tests"

**THOR Block Reason:** All 6 NEVER-EXPLORE invariants are P0 protection requirements (S4 rule). Zero invariant has a test. A patch was applied on 2026-06-05 to close ELEK-001, ELEK-002, ELEK-005 (viewerActorId injection, UUID guard, FeaturedResultCard UUID). All three patches are unprotected — any future edit can silently regress them. HAWK-002 (post slug regression — new finding from HAWKEYE) is also unprotected.

**Owner:** Wolverine (writes tests) — SPIDER-MAN (governs)
**Next Action:** Write P0 regression test suite for NEVER-EXPLORE-001 through NEVER-EXPLORE-006 before THOR run.

---

### SM-EXPLORE-002 | P0 | THOR BLOCKED | Security patch has zero regression coverage (ELEK-001, ELEK-002, ELEK-005)

**Severity:** P0 — Release Blocker
**Layer:** Controller, Model, Component
**Patch Applied:** 2026-06-05 (TICKET-EXPLORE-P0-SECURITY-PATCH-0001)
**BW Cross-Reference:** BW-EXPLORE-001, BW-EXPLORE-005, BW-EXPLORE-007

**Evidence:**
- ELEK-001 (viewerActorId injection): source confirms fix present; 0 regression tests
- ELEK-002 (UUID guard actor/post): source confirms guard present; 0 regression tests
- ELEK-005 (FeaturedResultCard UUID): source confirms fix present; 0 regression tests
- Patch can be silently reverted by any future edit — zero tripwire

**Required Tests:**
1. ctrlSearchResults must pass non-null viewerActorId to searchDal when authenticated
2. normalizeActorRow must return null for rows with null username
3. ActorSearchResultRow must never construct a URL containing a raw UUID
4. FeaturedResultCard must never construct a URL containing a raw UUID
5. Cache key must include actorId prefix for authenticated viewers

**THOR Block Reason:** P0 — security patch with no regression coverage = unprotected regression surface

---

### SM-EXPLORE-003 | P0 | THOR BLOCKED | HAWK-002 regression undetected — post.slug data flow broken (functional regression)

**Severity:** P0 — Release Blocker (HAWK-2026-06-05-002 corroborates)
**Layer:** DAL → Model → Component
**Root Cause Chain:**
- `dal/search.dal.js`: SELECT list does not include `slug` column from `vc.posts`
- `model/search.model.js` `normalizeResult`: post case returns `{result_type, id, title, text}` — no slug field
- `ui/PostCard.jsx`: `post.slug ? () => navigate(...)` — post.slug always undefined → onClick always undefined
- Result: ALL post search results are non-navigable; user cannot tap a post result

**Evidence:**
- DAL select confirmed: `select('id, actor_id, text, title, tags, created_at')` — no slug
- normalizeResult post case confirmed: `{result_type, id, title, text}` — no slug mapped
- PostCard confirmed: onClick gated on `post.slug` which is always falsy
- 0 tests exist to catch this regression

**Required Tests:**
1. `searchPosts` DAL result must include `slug` field
2. `normalizeResult` post case must map `slug` field
3. `PostCard` with a post that has a slug must have a defined onClick

**THOR Block Reason:** Functional regression introduced by security patch — post search unusable; untested

---

### SM-EXPLORE-004 | P1 | WATCH | Orphaned controller paths bypass cache and actorId scoping if activated

**Severity:** P1
**Layer:** Controller, Hook
**Affected Modules:** ctrlSearchTabs, searchUsecase, useSearchTabsActor

**Evidence:**
- ctrlSearchTabs: not imported by SearchScreen.view.jsx; no cache; if wired, bypasses actorId-scoped LRU
- searchUsecase: uses Promise.allSettled; not in active render tree; if activated, bypasses all security fixes in ctrlSearchResults
- useSearchTabsActor: not imported by SearchScreen.view.jsx; calls ctrlSearchTabs directly

**Risk:** If any of these three paths is reactivated (e.g., A/B test, route split), it will bypass the ELEK-001 fix (viewerActorId injection) and ELEK-003 fix (actorId cache scoping). The platform will regress silently.

**Required Tests:**
- Confirm ctrlSearchTabs, searchUsecase, and useSearchTabsActor are not reachable from any active route
- Or: delete them (ARCHITECT flags all three as dead/orphaned)

---

### SM-EXPLORE-005 | P1 | WATCH | BEH-EXPLORE-002 regression (post search) has no behavioral test

**Severity:** P1
**Layer:** DAL, Model, Component
**BEH Reference:** BEH-EXPLORE-002

**Evidence:**
- Post search path (searchPosts → normalizeResult → PostCard) is the only post discovery surface
- HAWK-002 regression renders the entire path non-functional (no slug → no onClick)
- Zero tests for this path exist
- The fix requires: (1) add slug to DAL select, (2) add slug to normalizeResult post case, (3) PostCard onClick functional
- Without a test, any future change to the select list or normalizeResult post case silently breaks post search again

---

### SM-EXPLORE-006 | P2 | UNDERTESTED | NEVER-EXPLORE-005 (deleted post) depends on DAL filter — no DB integration test

**Severity:** P2
**Layer:** DAL
**NEVER Reference:** NEVER-EXPLORE-005

**Evidence:**
- DAL applies `is('deleted_at', null)` filter at query time
- No integration test verifies this filter excludes deleted posts
- RLS on vc.posts unverified (HAWK-003, ELEK-007) — no DB test
- Without a test, a DAL refactor dropping the filter would expose deleted posts

---

## Coverage Summary

| Category | Total | Covered | Partial | Uncovered |
|---|---|---|---|---|
| DAL functions | 6 | 0 | 0 | 6 |
| Model functions | 9 | 0 | 0 | 9 |
| Controllers | 3 | 0 | 0 | 3 |
| Hooks | 9 | 0 | 0 | 9 |
| Components | 11 | 0 | 0 | 11 |
| Screens | 2 | 0 | 0 | 2 |
| **TOTAL** | **40** | **0** | **0** | **40** |
| BEH behaviors | 7 | 0 | 0 | 7 |
| SEC rules | 6 | 0 | 0 | 6 |
| NEVER invariants | 6 | 0 | 0 | 6 |

**Overall coverage: 0%**

---

## Release Safety

**Classification: BLOCKED**

**THOR Block reasons:**
1. SM-EXPLORE-001: All 6 NEVER-EXPLORE invariants UNCOVERED (P0 per S4 rule)
2. SM-EXPLORE-002: Security patch (ELEK-001, ELEK-002, ELEK-005) has zero regression coverage
3. SM-EXPLORE-003: HAWK-002 functional regression (post slug broken) undetected — post search unusable

**SPIDER-MAN recommendation: FAIL**

Release is BLOCKED. Wolverine must write at minimum:
- Regression tests for NEVER-EXPLORE-001 through NEVER-EXPLORE-006
- Regression tests for ELEK-001, ELEK-002, ELEK-005 patches
- Regression test for HAWK-002 (slug data flow: DAL → model → component)

---

## Write 2 — Domain File Updates

- TESTS.md: written/replaced (SPIDER-MAN sole owner — full replacement)
- BLOCKERS.md: created with SM coverage blocker entries
- CURRENT_STATUS.md: THOR-owned — NOT updated by SPIDER-MAN

---

*SPIDER-MAN — Regression Safety Net and Test Coverage Commander*
*Report persisted: ZZnotforproduction/APPS/VCSM/features/explore/outputs/2026/06/05/SPIDER-MAN/2026-06-05_spiderman_explore-coverage.md*
