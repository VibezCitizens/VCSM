# HAWKEYE Endpoint Verification Report

**Date:** 2026-06-05
**Application Scope:** VCSM:explore
**Environment:** Source analysis (INFERRED — no live runtime)
**Reviewer:** HAWKEYE
**Verification Summary:** 1 PASS | 2 FAIL | 2 PARTIAL
**Contract Drift:** MAJOR (post navigation slug/id mismatch)
**Auth Issues:** 1 (route:public:false vs effective:public conflict)
**Observability Gaps:** 2

---

## ARCHITECT Gate

```
HAWKEYE ARCHITECT GATE PASS

Upstream Report:
- ARCHITECT: ZZnotforproduction/APPS/VCSM/features/explore/outputs/2026/06/05/ARCHITECT/evidence-bundle.md
  Scope: VCSM:explore
  Date: 2026-06-05
  Status: SUCCESS
  Age: 0 days

Security surface: ZZnotforproduction/GOVERNANCE/outputs/2026/06/05/ARCHITECT/architect-security-surface-explore.json
Architecture: ZZnotforproduction/APPS/VCSM/features/explore/ARCHITECTURE.md
```

---

## ARCHITECT Route Map Loaded

```
ARCHITECT ROUTE MAP LOADED
Source: architect-security-surface-explore.json + ARCHITECTURE.md
Scope: VCSM:explore
Date: 2026-06-05
Endpoints confirmed: 3
  1. /explore (client-side route)
  2. identity.search_actor_directory (Supabase RPC)
  3. vc.posts direct SELECT (searchPosts + searchPostsByTag)

Edge Functions: NONE
Webhooks: NONE
Write surfaces: NONE
```

---

## ARCHITECT Artifact Completeness Check

| Artifact | Required Content | Status | Result |
|---|---|---|---|
| `routes.graph.json` | Route nodes or EXPLICIT_NONE | MISSING (no governance-level routes.graph.json) — security surface JSON present as equivalent | WARN |
| `feature-map.md` | Route inventory or EXPLICIT_NONE | THIN (ARCHITECTURE.md has inventory; no standalone feature-map.md) | WARN |

**Completeness Verdict:** WARN (not BLOCK) — the `architect-security-surface-explore.json` and `ARCHITECTURE.md` together provide a complete, ARCHITECT-authored route and endpoint inventory. No BLOCK condition triggered. Proceeding with full verification.

---

## Endpoint Summary

| Endpoint | Type | Method | Auth Required | HAWKEYE Status |
|---|---|---|---|---|
| `/explore` client route | App route | NAV | Declared: NO (public:false = private metadata only) | PARTIAL |
| `identity.search_actor_directory` | Supabase RPC | INVOKE | NO (null viewer accepted) | PASS |
| `vc.posts` ilike SELECT (searchPosts) | DB direct read | SELECT | NO | PARTIAL |
| `vc.posts` tags contains SELECT (searchPostsByTag) | DB direct read | SELECT | NO | PASS |
| PostCard navigation `/posts/{slug}` | Client nav | NAV | NO | FAIL |

---

## ARCHITECT Endpoint Coverage

| Endpoint | ARCHITECT-Confirmed | Verification Status | Notes |
|---|---|---|---|
| `/explore` client route | YES | VERIFIED | Auth metadata conflict flagged |
| `identity.search_actor_directory` RPC | YES | VERIFIED | PASS |
| `vc.posts` SELECT (searchPosts) | YES | VERIFIED | ilike pattern cost risk |
| `vc.posts` SELECT (searchPostsByTag) | YES | VERIFIED | PASS |
| PostCard `/posts/{slug}` navigation | YES (security surface) | VERIFIED | FAIL — slug never provided |
| ActorSearchResultRow `/profile/{username}` | YES | VERIFIED | PASS — UUID fallback removed |
| FeaturedResultCard `/profile/{username}` | YES | VERIFIED | PASS — same guard pattern |

**Coverage Summary:**
- ARCHITECT-confirmed endpoints for scope: 7
- HAWKEYE-verified this run: 7
- UNVERIFIED (WATCH — verify before release): 0
- NOT_IN_ARCHITECT: 0

---

## API Contract Verification

### HAWKEYE TRACE — identity.search_actor_directory

```
HAWKEYE TRACE
- traceId:        HAWKEYE-2026-06-05-001
- endpoint:       identity.search_actor_directory (RPC)
- method:         INVOKE
- environment:    source (INFERRED)
- auth state:     anon (null viewerActorId allowed)
- actor context:  kind: user | vport (passed server-side from useIdentity)
- timestamp:      2026-06-05T00:00:00Z
```

**Contract trace:** `useSearchScreenController:112` → `ctrlSearchResults:9` → `searchDal:119` → `searchActors:9` → `supabase.schema('identity').rpc('search_actor_directory', {...}):20`

Input validation chain:
- `rawQuery`: trimmed at hook (`debounced = query.trim()`), stripped of `@`/`#` prefix at DAL line 15
- `filter`: validated via `mapFilter()` line 4–7 — only 'users'|'vports' pass through; everything else → 'all'
- `limit`: hardcoded default 25, not user-controlled from hook
- `offset`: hardcoded default 0, not user-controlled from hook
- `viewerActorId`: sourced from `useIdentity()` → `identity?.actorId ?? null` — platform-controlled, not client-injectable

---

```
HAWKEYE VERIFICATION RESULT

- Verification ID:    HAWK-2026-06-05-001
- Endpoint:           identity.search_actor_directory (RPC)
- Method:             INVOKE
- Verification Type:  Auth verification + Payload validation
- Application Scope:  VCSM:explore
- Auth State:         anon (null viewerActorId)
- Payload:            { p_viewer_domain: 'vc', p_viewer_actor_id: null, p_query: trimmed_needle, p_filter: 'all'|'users'|'vports', p_limit: 25, p_offset: 0 }
- Expected Result:    Public actor results for null viewer; private actors suppressed server-side
- Actual Result:      INFERRED correct — null viewerActorId explicitly handled by RPC server-side policy (ARCHITECT confirmed)
- Status:             PASS
- Evidence Type:      INFERRED
- Confidence:         HIGH (code trace confirms parameters; RPC server-side policy confirmed by ARCHITECT security surface)
- Response Status:    200 (data array)
- Response Shape:     Array of actor rows: actor_id, actor_domain, actor_kind, display_name, username, avatar_url, banner_url, bio, is_private, rank
- Auth Enforcement:   ENFORCED (server-side — RPC handles null viewer)
- Contract Drift:     NONE
- Severity:           INFO
- Notes:              viewerActorId is NOT client-injectable — it flows from platform useIdentity() hook. Filter enum validated client-side before RPC call.
- Recommended Handoff: NONE
```

---

### HAWKEYE TRACE — PostCard navigation

```
HAWKEYE TRACE
- traceId:        HAWKEYE-2026-06-05-002
- endpoint:       /posts/{slug} (client navigation)
- method:         NAV
- environment:    source (INFERRED)
- auth state:     anon
- actor context:  none (navigation only)
- timestamp:      2026-06-05T00:00:00Z
```

**Contract trace:** `normalizeResult:184` (post case) → `{ result_type: 'post', id, title, text }` — NO slug field → `PostCard.jsx:14` → `post.slug ? navigate(...) : undefined` — slug is ALWAYS undefined → onClick is ALWAYS undefined

DAL contract: `searchPosts` SELECT selects `id, actor_id, text, title, tags, created_at` (line 59) — NO slug column.

Model contract: `normalizeResult` for 'post' returns `{ id, title, text }` — NO slug field (line 184–191).

---

```
HAWKEYE VERIFICATION RESULT

- Verification ID:    HAWK-2026-06-05-002
- Endpoint:           /posts/{slug} (PostCard client navigation)
- Method:             NAV
- Verification Type:  Contract drift + Response shape
- Application Scope:  VCSM:explore
- Auth State:         anon
- Payload:            N/A
- Expected Result:    Post search results navigate to /posts/{slug} when tapped
- Actual Result:      Navigation is permanently disabled — onClick is always undefined because post.slug is never populated
  Chain: searchPosts DAL selects (id, actor_id, text, title, tags, created_at) — no slug
         normalizeResult 'post' case maps (id, title, text) — no slug
         PostCard checks post.slug → always undefined → onClick = undefined
- Status:             FAIL
- Evidence Type:      INFERRED
- Confidence:         HIGH (full chain traced from DAL to component)
- Response Status:    N/A
- Response Shape:     PostCard receives { result_type: 'post', id, title, text } — slug absent
- Auth Enforcement:   N/A
- Contract Drift:     MAJOR — component contract expects slug; data chain never provides it
- Severity:           HIGH
- Notes:              The ARCHITECT-reported UUID exposure (navigate('/posts/${post.id}')) was removed in the patch.
                      PostCard now guards on post.slug — but slug is never selected from DB or mapped in model.
                      All post search results are non-navigable. This is a functional regression introduced by the fix.
                      No UUID is exposed (security improvement) but no navigation is possible (UX regression).
                      Fix: Either select slug from vc.posts in DAL and thread it through model, or gate the posts tab from the explore search results until slug is available.
- Recommended Handoff: ELEKTRA (confirm no UUID exposure path remains), SPIDER-MAN (add test for post navigation)
```

---

### HAWKEYE TRACE — vc.posts ilike SELECT

```
HAWKEYE TRACE
- traceId:        HAWKEYE-2026-06-05-003
- endpoint:       vc.posts (Supabase direct SELECT — searchPosts)
- method:         SELECT
- environment:    source (INFERRED)
- auth state:     anon (RLS governs)
- actor context:  none (read-only)
- timestamp:      2026-06-05T00:00:00Z
```

**Contract trace:** `useSearchScreenController:112` → `ctrlSearchResults:9` → `searchDal:141` → `searchPosts:46` → `supabase.schema('vc').from('posts').ilike('text', `%${q}%`)`

---

```
HAWKEYE VERIFICATION RESULT

- Verification ID:    HAWK-2026-06-05-003
- Endpoint:           vc.posts ilike SELECT (searchPosts)
- Method:             SELECT
- Verification Type:  Payload validation + Auth verification
- Application Scope:  VCSM:explore
- Auth State:         anon (RLS governs)
- Payload:            ilike pattern: %{rawQuery}%, tags contains: [normalizedTag]
- Expected Result:    Filtered public posts matching query; RLS excludes non-public content
- Actual Result:      INFERRED PARTIAL — Supabase JS SDK parameterizes ilike values (no SQL injection), but pattern wrapping enables full table scan for single-character queries. RLS policy coverage UNVERIFIED.
- Status:             PARTIAL
- Evidence Type:      INFERRED
- Confidence:         MEDIUM (SDK parameterization behavior is framework-guaranteed; RLS unverified)
- Response Status:    200 (data array)
- Response Shape:     Array: { id, actor_id, text, title, tags, created_at }
- Auth Enforcement:   WEAK — depends on RLS; no client-side auth check. deleted_at IS NULL and is_hidden filters applied, but RLS policy for vc.posts not confirmed.
- Contract Drift:     MINOR — schema not explicitly qualified for posts table (ARCHITECT note: no schema qualifier conflict)
- Severity:           MEDIUM
- Notes:              ilike with user-controlled %pattern% is not SQL injectable via Supabase SDK (parameterized), but creates full sequential scan on vc.posts for short queries. No minimum query length enforced before DAL call — q='' guard exists (returns []) but q='a' would scan. RLS coverage for vc.posts needs VENOM/ELEKTRA verification.
- Recommended Handoff: VENOM (RLS coverage for vc.posts), KRAVEN (ilike performance on short queries)
```

---

### HAWKEYE TRACE — /explore route protection

```
HAWKEYE TRACE
- traceId:        HAWKEYE-2026-06-05-004
- endpoint:       /explore (client route)
- method:         NAV
- environment:    source (INFERRED)
- auth state:     anon (no guard enforced)
- actor context:  not asserted at route level
- timestamp:      2026-06-05T00:00:00Z
```

**Contract trace:** `ui/index.jsx:6` → `{ path: '/explore', element: <ExploreScreen />, public: false }` — `public: false` declared BUT `useSearchScreenController` does NOT check auth before search execution.

---

```
HAWKEYE VERIFICATION RESULT

- Verification ID:    HAWK-2026-06-05-004
- Endpoint:           /explore client route
- Method:             NAV
- Verification Type:  Auth verification + Route protection
- Application Scope:  VCSM:explore
- Auth State:         anon (no route guard)
- Payload:            N/A
- Expected Result:    Per barrel declaration (public: false) — route should require auth
- Actual Result:      Route is effectively public — no auth middleware, no guard in screen, hook, or controller. Anon users can access and search. The identity RPC accepts null viewerActorId safely.
- Status:             FAIL
- Evidence Type:      INFERRED
- Confidence:         HIGH (confirmed no auth guard in screen or hook)
- Response Status:    N/A
- Response Shape:     N/A
- Auth Enforcement:   ABSENT (at route level) — feature designed for public use but metadata says private
- Contract Drift:     MINOR — public:false metadata contradicts implemented behavior
- Severity:           MEDIUM
- Notes:              This may be intentional — explore/search is a discovery feature that logically should be public. The barrel metadata (public: false) may be stale or incorrect. No security risk if explore being public is the intended design. Risk is contract documentation only: governance tools reading public:false will exclude this from public surface audits, creating a gap.
                      Recommendation: Change ui/index.jsx route to public: true if the intent is public search, or add an auth guard if explore is intended to be authenticated-only.
- Recommended Handoff: VENOM (confirm intended auth posture for /explore), LOGAN (update BEHAVIOR.md §5 with auth rule)
```

---

### HAWKEYE TRACE — ActorSearchResultRow + FeaturedResultCard navigation

```
HAWKEYE VERIFICATION RESULT

- Verification ID:    HAWK-2026-06-05-005
- Endpoint:           /profile/{username} (ActorSearchResultRow + FeaturedResultCard)
- Method:             NAV
- Verification Type:  Contract drift + UUID exposure check
- Application Scope:  VCSM:explore
- Auth State:         anon
- Payload:            username string
- Expected Result:    Navigation to /profile/{username}; no raw UUID exposure
- Actual Result:      PASS — both components guard on username before navigating.
                      ActorSearchResultRow:22: actor.username && navigate(`/profile/${actor.username}`)
                      FeaturedResultCard:10: item.username && navigate(`/profile/${item.username}`)
                      normalizeActorRow model:99 filters rows with null/empty username before they reach UI.
                      UUID fallback previously reported by ARCHITECT is NOT present in current source.
- Status:             PASS
- Evidence Type:      INFERRED
- Confidence:         HIGH
- Auth Enforcement:   N/A
- Contract Drift:     NONE
- Severity:           INFO
- Notes:              Triple-layered protection: (1) normalizeActorRow filters null-username actors, (2) both components guard before navigating, (3) no UUID fallback in current code. Previous UUID fallback (actor.username ?? actor.actor_id) removed.
- Recommended Handoff: NONE
```

---

## Auth Verification

| Endpoint | Auth Required | Observed Behavior | Auth Enforcement | Status |
|---|---|---|---|---|
| `/explore` route | Declared: YES (public:false) | Anon users can access | ABSENT at route level | FAIL |
| `identity.search_actor_directory` | NO (null viewer safe) | Null actorId → public results | ENFORCED (server-side) | PASS |
| `vc.posts` SELECT | NO declared | Anon access; RLS governs | WEAK (RLS unverified) | PARTIAL |
| PostCard navigation | N/A | Navigation broken (no slug) | N/A | FAIL (functional) |
| ActorSearchResultRow nav | NO | Username guard enforced | ENFORCED (client guard) | PASS |

---

## Payload Validation Review

| Endpoint | Invalid Payload Type | Observed Response | Status |
|---|---|---|---|
| identity RPC — empty query | Empty string / whitespace | Early return: [] at DAL line 13 | PASS |
| identity RPC — malformed filter | Unknown filter value | mapFilter() coerces to 'all' | PASS |
| identity RPC — oversized query | Long string | No max length enforced; passed to RPC | WATCH |
| vc.posts ilike — single char query | q='a' → full table scan | No minimum length enforced | WATCH |
| vc.posts ilike — wildcard chars | q='%' or q='_' | Valid ilike wildcards — expand scan; no injection risk via Supabase SDK parameterization | WATCH |
| PostCard — missing slug | post.slug = undefined | onClick = undefined (no navigation, no error) | FAIL (silent regression) |
| localStorage filter | Arbitrary saved value | Validated against FILTERS array on read | PASS |

---

## Edge Function Verification

No Edge Functions declared for VCSM:explore scope. ARCHITECT security surface confirms: `edgeFunctions: []`

EDGE FUNCTION CHECK: NOT APPLICABLE

---

## Webhook Verification

No webhooks declared for VCSM:explore scope.

WEBHOOK CHECK: NOT APPLICABLE

---

## Runtime Environment Verification

| Area | Status | Evidence | Notes |
|---|---|---|---|
| Supabase client initialization | PASS | Imported from `@/services/supabase/supabaseClient` | Standard platform pattern |
| Schema qualifier (identity) | PASS | `.schema('identity').rpc(...)` — explicit | |
| Schema qualifier (vc.posts) | PASS | `.schema('vc').from('posts')` — explicit | ARCHITECT note about missing qualifier is incorrect; qualifier IS present |
| localStorage availability | WATCH | `localStorage.getItem(LS_KEY)` called during hook init — SSR would throw | Safe in browser-only RN/Expo context |
| In-memory cache isolation | PASS | Module-level Map — isolated to explore hook instances | |

---

## Contract Drift Review

| Endpoint | Drift Type | Severity | Notes |
|---|---|---|---|
| PostCard — post.slug | Field absent in data chain | MAJOR | DAL selects id; model maps id; PostCard expects slug — never provided |
| /explore barrel public:false | Metadata/behavior mismatch | MINOR | Barrel says private; feature is effectively public |
| identity RPC response | No drift detected | NONE | |
| vc.posts SELECT response | Schema qualifier corrected | NONE | .schema('vc') is present; ARCHITECT note was incorrect |

---

## Observability Verification

| Flow | Runtime Visibility | Sentry Visibility | Missing Signals |
|---|---|---|---|
| Search query execution | useSearchScreenController error state | NOT OBSERVED in source | No Sentry.captureException on search error |
| Hydration failure | Swallowed: `.catch(() => {})` line 17 of controller | ABSENT | hydrateActorsByIds failure is silent — no tracking |
| Post search partial failure | byText or byTag can fail independently; `await Promise.all` — one failure throws | Surfaces to error state | PARTIAL — Promise.all fails fast; individual failures not disaggregated |
| ilike full scan | No timing / query telemetry | ABSENT | No performance signal when short-query scan occurs |

---

## HAWKEYE Verification Results (FAIL and PARTIAL)

### FAIL — HAWK-2026-06-05-002: Post navigation broken (slug/id mismatch)

```
──────────────────────────────────────────────────
HAWK-2026-06-05-002 | CONTRACT DRIFT — MAJOR

Endpoint: PostCard → /posts/{slug}
Severity: HIGH

Evidence:
  dal/search.dal.js:59 → SELECT: id, actor_id, text, title, tags, created_at (NO slug)
  model/search.model.js:184–191 → normalizeResult 'post' case: { id, title, text } (NO slug)
  ui/PostCard.jsx:14 → onClick={post.slug ? () => navigate(`/posts/${post.slug}`) : undefined}
  Result: post.slug is ALWAYS undefined → onClick is ALWAYS undefined

Gap: The patch removed UUID navigation (positive) but did not add slug to the DAL SELECT or model map.
     PostCard now guards on a field that never exists in the data chain.

Blast Radius: All post search results are non-navigable. Users tapping post cards get no response.

Required Action:
  Option A: Add 'slug' column to searchPosts DAL SELECT, thread through normalizeResult 'post' case.
  Option B: Gate posts filter from explore results until slug is available in the posts table.
  SPIDER-MAN: Add regression test confirming post navigation works after slug is plumbed.

THOR Block: YES — functional regression introduced by security patch. Post taps are silent no-ops.
──────────────────────────────────────────────────
```

### FAIL — HAWK-2026-06-05-004: /explore route auth metadata conflict

```
──────────────────────────────────────────────────
HAWK-2026-06-05-004 | AUTH ENFORCEMENT — ABSENT

Endpoint: /explore (client route)
Severity: MEDIUM

Evidence:
  ui/index.jsx:6 → { path: '/explore', element: <ExploreScreen />, public: false }
  hooks/useSearchScreenController.js:74 → actorId = identity?.actorId ?? null (not asserted)
  controller/searchResults.controller.js:5 → viewerActorId = null (default)
  No auth guard found at screen, hook, or controller layer.

Gap: Route declares public:false (meaning requires auth) but no enforcement exists.
     Anon users can access /explore and execute searches against the identity RPC and vc.posts.

Blast Radius: Governance tooling reading public:false excludes /explore from public surface audits.
              Actual public access is undetected by governance unless /explore is correctly marked.
              No direct security risk if public explore is the intended design.

Required Action: Confirm intent with platform team.
  - If explore is public: change ui/index.jsx route to public: true. Update BEHAVIOR.md §5.
  - If explore requires auth: add auth guard at screen entry (check session before rendering).
  VENOM: confirm intended auth posture for /explore before THOR.
  LOGAN: update BEHAVIOR.md §5 SEC-EXPLORE rule to clarify auth requirement.

THOR Block: NO — informational; no exploitable vulnerability. Metadata correction required.
──────────────────────────────────────────────────
```

### PARTIAL — HAWK-2026-06-05-003: vc.posts ilike RLS unverified

```
──────────────────────────────────────────────────
HAWK-2026-06-05-003 | AUTH ENFORCEMENT — WEAK (RLS unverified)

Endpoint: vc.posts SELECT (searchPosts, searchPostsByTag)
Severity: MEDIUM

Evidence:
  dal/search.dal.js:55–86 → direct vc.posts SELECT without RLS confirmation
  ARCHITECT security surface: rlsVerified: false for vc.posts
  Filters applied: deleted_at IS NULL, is_hidden IS NULL OR is_hidden = false
  ilike pattern: %${q}% — user-controlled pattern; Supabase SDK parameterizes (no SQL injection risk)

Gap: RLS policy for vc.posts has not been confirmed by VENOM or ELEKTRA for the explore feature.
     Client-side filters (deleted_at, is_hidden) reduce exposure but do not substitute for RLS.

Required Action:
  VENOM: verify vc.posts RLS policy covers anonymous reads appropriately.
  KRAVEN: flag ilike full-scan risk for short queries (no minimum query length).

THOR Block: NO — pending VENOM RLS confirmation. Not independently exploitable.
──────────────────────────────────────────────────
```

---

## Handoff Matrix

| Finding | Recommended Handoff | Reason |
|---|---|---|
| HAWK-2026-06-05-002 (post slug broken) | ELEKTRA → SPIDER-MAN | Confirm no UUID path remains; add regression test |
| HAWK-2026-06-05-003 (vc.posts RLS) | VENOM | Verify RLS policy covers anon reads |
| HAWK-2026-06-05-004 (/explore public:false) | VENOM → LOGAN | Confirm auth posture; update BEHAVIOR.md |
| Hydration silent swallow | LOKI | Add Sentry capture for hydration failures |
| ilike scan risk | KRAVEN | Performance audit for short-query scan |

---

## Final HAWKEYE Status

**DEGRADED**

Two FAIL findings:
1. Post navigation is permanently broken (functional regression from security patch — MAJOR contract drift, THOR Block = YES)
2. /explore route metadata conflicts with actual auth posture (THOR Block = NO, informational)

One PARTIAL: vc.posts RLS coverage unverified.

Release note: HAWK-2026-06-05-002 (post slug regression) must be resolved before explore-touching release. All post search results are currently non-navigable.
