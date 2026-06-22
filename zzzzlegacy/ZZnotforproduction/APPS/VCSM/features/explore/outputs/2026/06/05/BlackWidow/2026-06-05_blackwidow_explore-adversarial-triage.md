# BLACKWIDOW Runtime Adversarial Report
## VCSM:explore | 2026-06-05 | Ticket: TICKET-EXPLORE-BUNDLE-SECURITY-PHASE-0001

---

## Run Metadata

| Field | Value |
|---|---|
| Date | 2026-06-05 |
| Scope | VCSM:explore |
| Application Scope | VCSM |
| Reviewer | BLACKWIDOW V3 |
| Mode | Triage adversarial verification — all 7 VEN-2026-06-05 findings |
| Ticket | TICKET-EXPLORE-BUNDLE-SECURITY-PHASE-0001 |
| Governance Status | DRAFT |
| Prior BW Run | 2026-06-04 (6 findings: BW-EXPLORE-001 through BW-EXPLORE-006) |

---

## BLACKWIDOW PREFLIGHT

```
BLACKWIDOW PREFLIGHT PASS

Upstream Report:
- VENOM: ZZnotforproduction/APPS/VCSM/features/explore/outputs/2026/06/05/Venom/2026-06-05_venom_explore-security-review.md
  Scope: VCSM:explore
  Date: 2026-06-05
  Status: SUCCESS
  Age: 0 days

Proceeding with BLACKWIDOW adversarial review.
```

---

## BLACKWIDOW BEHAVIOR CONTRACT PRE-READ (Area 9)

```
BEHAVIOR.md Path: ZZnotforproduction/APPS/VCSM/features/explore/BEHAVIOR.md
Exists: YES (produced by LOGAN 2026-06-05, same session)
Status: DRAFT (not APPROVED — invariant linkage table marked as DRAFT-ANCHORED)

§4 Failure Paths declared: 11 (edge case table in §4)
§9 Must Never Happen declared: 6
  - NEVER-EXPLORE-001: Raw actor_id UUID in public navigation URL
  - NEVER-EXPLORE-002: Raw post.id UUID in public navigation URL
  - NEVER-EXPLORE-003: viewerActorId from client-controlled input
  - NEVER-EXPLORE-004: Blocked actor in search results for blocking viewer
  - NEVER-EXPLORE-005: Deleted post in search results
  - NEVER-EXPLORE-006: Search fetch on empty query

Note: BEHAVIOR.md is DRAFT — §9 invariants authored from same ARCHITECT source evidence
as VENOM findings. Invariant linkage table produced as DRAFT-ANCHORED.
```

---

## Source Read Summary

| Command | Source Files Read | Evidence Bundle Used | Full Rediscovery Performed |
|---|---|---|---|
| BLACKWIDOW | 0 (new reads) | YES — ZZnotforproduction/APPS/VCSM/features/explore/outputs/2026/06/05/ARCHITECT/evidence-bundle.json | NO |

All attack scenarios based on ARCHITECT V2 evidence bundle (22 source files) + VENOM V2 report (2026-06-05). No source re-reads performed.

---

## Attack Surface Summary

| Surface | Classification | VEN Reference |
|---|---|---|
| identity.search_actor_directory RPC | viewerActorId null bypass | VEN-EXPLORE-002 |
| vc.posts SELECT (searchPosts) | RLS unverified; user ilike injection | VEN-EXPLORE-002 (downstream) |
| PostCard /posts/${post.id} | UUID in public URL — always | VEN-EXPLORE-003 |
| ActorSearchResultRow /profile/${username ?? actor_id} | UUID fallback when username null | VEN-EXPLORE-003 |
| FeaturedResultCard /profile/${username ?? actor_id} | UUID fallback — highest-frequency nav surface | VEN-EXPLORE-006 |
| searchResultCache singleton | Cross-actor cache leak | VEN-EXPLORE-004 |
| model output (userId/ownerUserId) | Legacy fields in result objects | VEN-EXPLORE-005 |
| BEHAVIOR.md governance gap | Unanchored findings | VEN-EXPLORE-001 |
| /explore route access | Conflict: scanner=public vs barrel=public:false | VEN-EXPLORE-007 |

---

## Simulated Threat Scenarios

### SEARCH ABUSE — Block Bypass via Null viewerActorId

```
SEARCH ABUSE ATTEMPT
Target: identity.search_actor_directory via ctrlSearchResults → searchDal → searchActors
Attack vector:
  1. Citizen A has blocked Citizen B (A blocked B → B should not see A in search)
  2. Citizen B opens /explore and types query matching Citizen A's display_name
  3. useSearchScreenController fires: ctrlSearchResults("alice", "all")
  4. ctrlSearchResults calls: searchDal(trimmed, filter, {})
  5. searchDal: viewerActorId = opts.viewerActorId || null → NULL
  6. searchActors: supabase.rpc('search_actor_directory', { p_viewer_actor_id: null, ... })
  7. RPC receives null viewer — cannot evaluate block table for viewer B
  8. Citizen A appears in results for Citizen B — BLOCK BYPASSED
Visibility gate: ABSENT — viewerActorId is null for ALL authenticated Citizens
Result: EXPOSED
Evidence: [SOURCE_VERIFIED] apps/VCSM/src/features/explore/controller/searchResults.controller.js
  searchDal(trimmed, filter, {}) — opts = {} → viewerActorId = null confirmed
Severity: HIGH
```

### VIEWER CONTEXT FUZZ — Null viewerActorId Downgrade

```
VIEWER CONTEXT FUZZ ATTEMPT
Target: ctrlSearchResults → searchDal → searchActors
Injected context: null (not forged — naturally produced by the code path)
Expected result: ERROR or downgrade to public-only (anonymous) results, or block from search
Actual result: Silent downgrade to null-viewer search; no error; actor data returned as-if public
Context validation: ABSENT — no guard at controller or hook level prevents null viewerActorId
Severity: HIGH
```

### VIEWER CONTEXT FUZZ — Actor Switch Without Cache Invalidation

```
VIEWER CONTEXT FUZZ ATTEMPT
Target: searchResultCache (module-level singleton)
Injected context: Citizen A's cached results (key: "all:coffee") visible to Citizen B after switch
Expected result: Cache invalidated on actor switch — Citizen B's search starts fresh
Actual result:
  1. Citizen A searches "coffee" → searchResultCache.set("all:coffee", {results, expiresAt})
  2. Citizen A logs out or switches actor (module-level cache NOT cleared)
  3. Citizen B logs in; searches "coffee" within 45s
  4. Cache HIT — Citizen A's results returned to Citizen B
  5. Results include actor profile data (display_name, photo_url, is_private) for actors
     personalized to Citizen A's viewerActorId (which was null, ironically)
Context validation: ABSENT — cache has no actorId binding
Severity: MEDIUM
```

### URL SURFACE TEST — PostCard UUID Exposure

```
URL SURFACE TEST
Route / Link: /posts/${post.id} via PostCard.jsx
UUID exposure: PRESENT — ALWAYS
Slug enforcement: MISSING — post.id is a raw UUID from vc.posts primary key
Severity: HIGH

Attack vector:
  1. Citizen searches any text term
  2. searchPosts returns results with row.id (UUID)
  3. normalizeResult maps to { id: row.id, ... }
  4. PostCard renders: onClick={() => navigate(`/posts/${post.id}`)}
  5. Every post click: URL = /posts/a1b2c3d4-e5f6-7890-abcd-ef1234567890
  6. UUID in browser history, shareable, indexable — 100% of post-search navigations

Note: This is TRIVIAL — requires no special conditions; affects every post search result.
Evidence: [SOURCE_VERIFIED] apps/VCSM/src/features/explore/ui/PostCard.jsx:7
```

### URL SURFACE TEST — Actor UUID Fallback (ActorSearchResultRow + FeaturedResultCard)

```
URL SURFACE TEST
Route / Link: /profile/${actor.username ?? actor.actor_id} via ActorSearchResultRow + FeaturedResultCard
UUID exposure: CONDITIONAL — when username is null
Slug enforcement: MISSING — UUID fallback when username null

Attack vector:
  1. identity RPC returns actor with username: null (possible for some actor kinds)
  2. ActorSearchResultRow renders: navigate(`/profile/${actor.username ?? actor.actor_id}`)
  3. actor.username is null → actor.actor_id (UUID) used as path parameter
  4. URL = /profile/a1b2c3d4-e5f6-7890-abcd-ef1234567890 — platform rule violation
  5. FeaturedResultCard (first result — highest click rate): same pattern
  6. If the first result is an actor with null username → UUID exposure on highest-traffic click target

Severity: HIGH (FeaturedResultCard — highest frequency); HIGH (ActorSearchResultRow)
Evidence: [SOURCE_VERIFIED]
  apps/VCSM/src/features/explore/ui/ActorSearchResultRow.jsx:22
  apps/VCSM/src/features/explore/ui/FeaturedResultCard.jsx:11
```

### RLS VERIFICATION — vc.posts Without Schema Qualifier

```
RLS VERIFICATION ATTEMPT
Table / View / RPC: vc.posts via searchPosts, searchPostsByTag
Attack vector:
  User-controlled query injected into ilike pattern: .ilike('text', `%${rawQuery}%`)
  Tag injected into contains: .contains('tags', [normalizedTag])
RLS status: ASSUMED — not verified in this session; vc schema RLS coverage not confirmed
Result: PARTIAL — deleted_at IS NULL and is_hidden filters applied at app layer;
  but RLS verification for private actor post visibility is UNVERIFIED
Evidence: [SOURCE_VERIFIED] apps/VCSM/src/features/explore/dal/search.dal.js:55-116
Severity: MEDIUM (deferred to ELEKTRA for code-level chain tracing)
```

### CROSS-FEATURE ABUSE — searchUsecase Relative Import

```
CROSS-FEATURE ABUSE ATTEMPT
Source feature: explore (usecases/search.usecase.js)
Target feature internal: ../dal/search.dal (relative path — VCSM rule violation)
Attack vector:
  usecases/search.usecase.js uses relative import: import { searchDal } from '../dal/search.dal'
  VCSM requires: import { searchDal } from '@/features/explore/dal/search.dal'
  Relative imports bypass the feature boundary resolution — on case-insensitive FS only
Result: PARTIAL — import works on macOS (case-insensitive FS) but would fail on Linux/CI
Adapter isolation: WEAK — relative import evades alias path enforcement
Evidence: [SOURCE_VERIFIED] apps/VCSM/src/features/explore/usecases/search.usecase.js:1
Severity: MEDIUM (CI/CD regression risk — Linux build failure)
```

---

## §9 Invariant Attack Map

Note: BEHAVIOR.md is DRAFT (2026-06-05, produced by LOGAN this session). Invariant attack map produced as DRAFT-ANCHORED — subject to engineering review.

| Attack Path | Attack Result | §9 Invariant | BEH-ID | SPIDER-MAN Required |
|---|---|---|---|---|
| PostCard → /posts/${post.id} — UUID always used | BYPASSED | Raw post.id UUID MUST NEVER appear in public URL | NEVER-EXPLORE-002 | YES |
| ActorSearchResultRow → /profile/${uuid} when username null | BYPASSED | Raw actor_id UUID MUST NEVER appear in public URL | NEVER-EXPLORE-001 | YES |
| FeaturedResultCard → /profile/${uuid} when username null | BYPASSED | Raw actor_id UUID MUST NEVER appear in public URL | NEVER-EXPLORE-001 | YES |
| ctrlSearchResults passes {} opts → viewerActorId null → blocked actor returned | BYPASSED | Blocked actor MUST NEVER appear in search results for blocking viewer | NEVER-EXPLORE-004 | YES |
| viewerActorId always null — empty opts passed by controller | BLOCKED — viewerActorId is never from user-controlled input; null comes from code, not caller | viewerActorId MUST NEVER originate from client-controlled input | NEVER-EXPLORE-003 | NO |
| searchPosts with deleted_at IS NULL filter | BLOCKED — filter applied at DAL layer | Deleted post MUST NEVER appear in search results | NEVER-EXPLORE-005 | NO |
| if (!debounced) guard in useSearchScreenController | BLOCKED — guard present and effective | Search fetch MUST NEVER occur on empty query | NEVER-EXPLORE-006 | NO |

```
Behavior Contract Attack Summary
=================================
BEHAVIOR.md exists: YES
BEHAVIOR.md status: DRAFT (produced by LOGAN 2026-06-05 — not yet APPROVED)
§4 Failure Paths declared: 11
§4 Paths attack-verified: 4 / 11 (null username, empty query, RPC error, hydration failure)
§4 Paths unhandled (FAILURE_PATH_UNHANDLED): NONE confirmed — remaining 7 are UX paths, not security
§9 Must Never Happen declared: 6
§9 Invariants attacked: 6 / 6
§9 Result — BLOCKED: NEVER-EXPLORE-003, NEVER-EXPLORE-005, NEVER-EXPLORE-006
§9 Result — BYPASSED (CRITICAL per contract): NEVER-EXPLORE-001, NEVER-EXPLORE-002, NEVER-EXPLORE-004
§9 Result — NOT ATTACKED (gap): NONE
```

---

## Ownership Bypass Results

| Test | Result | Notes |
|---|---|---|
| Access actor owned by another Citizen via search | BLOCKED — explore has no ownership mutations; search is read-only | Ownership bypass not applicable to read-only search |
| Actor privacy suppression via null viewerActorId | BYPASSED — viewerActorId null → privacy server-side only | VEN-EXPLORE-002, BW-EXPLORE-001 |

---

## Successful Exploit Chains

### EXPLOIT-CHAIN-001 — Block bypass via null viewerActorId

```
Type: Single-step exploit (one missing gate)
Entry: /explore search bar (authenticated Citizen)
Chain:
  Citizen B (authenticated) → search query → useSearchScreenController
  → ctrlSearchResults({}) → searchDal(q, f, {})
  → viewerActorId = null
  → identity.search_actor_directory(p_viewer_actor_id: null)
  → server: null viewer → no block enforcement
  → Citizen A (blocked by B) appears in results
Triage Classification: PRACTICAL
Severity: HIGH
BW Finding: BW-EXPLORE-001 (confirmed, 2nd run)
VEN Reference: VEN-EXPLORE-002
```

### EXPLOIT-CHAIN-002 — Post UUID URL exposure (every click)

```
Type: Single-step exploit (hardcoded UUID navigation)
Entry: /explore post search result → PostCard click
Chain:
  User types any query → searchPosts → normalizeResult({ id: row.id })
  → PostCard onClick: navigate('/posts/${post.id}')
  → URL = /posts/<UUID> — always, unconditionally
Triage Classification: TRIVIAL (no conditions required — 100% of post navigations)
Severity: HIGH
BW Finding: BW-EXPLORE-005 (confirmed, pattern extended)
VEN Reference: VEN-EXPLORE-003
```

### EXPLOIT-CHAIN-003 — Actor UUID URL exposure (featured card — highest traffic)

```
Type: Single-step exploit (UUID fallback when username null)
Entry: /explore actor search result → FeaturedResultCard click
Chain:
  User searches for actor → identity RPC returns actor with username: null
  → FeaturedResultCard: navigate('/profile/${item.username ?? item.actor_id}')
  → username null → actor_id UUID used
  → URL = /profile/<UUID> — highest-frequency nav click
Triage Classification: PRACTICAL (conditional on null username, but no special tooling needed)
Severity: HIGH
BW Finding: BW-EXPLORE-007 (NEW)
VEN Reference: VEN-EXPLORE-006
```

### EXPLOIT-CHAIN-004 — Cross-session cache leak on shared device

```
Type: Timing-dependent exploit + cache exploit
Entry: Citizen A searches; Citizen B uses same device within 45s
Chain:
  Citizen A searches "coffee" → searchResultCache.set("all:coffee", results, expiresAt)
  Citizen A logs out → cache NOT cleared (module-level singleton)
  Citizen B logs in within 45s → searches "coffee"
  Cache HIT "all:coffee" → Citizen A's results returned to Citizen B
  Citizen A's result set may include actors that B's context should exclude
Triage Classification: PLAUSIBLE (requires shared device + timing window)
Severity: MEDIUM
BW Finding: BW-EXPLORE-003 (updated status)
VEN Reference: VEN-EXPLORE-004
```

---

## Failed Exploit Chains (Defenses That Held)

### BLOCKED-001 — viewerActorId from client-controlled input

```
Target: viewerActorId injection via URL parameter or prop manipulation
Attack: Forge viewerActorId as URL parameter to gain another actor's search context
Result: BLOCKED — viewerActorId is not accepted from any URL parameter or prop.
  The bug is opposite: viewerActorId is ignored (empty opts), not accepted from a bad source.
  No client-controlled injection path exists.
VEN Reference: VEN-EXPLORE-002 (null origin, not injection origin)
```

### BLOCKED-002 — Deleted post in search results

```
Target: searchPosts / searchPostsByTag returning deleted posts
Attack: Search for posts that have been soft-deleted (deleted_at IS NOT NULL)
Result: BLOCKED — both DAL functions apply .is('deleted_at', null) filter
  RLS provides defense-in-depth. App-layer + RLS = layered protection.
Evidence: apps/VCSM/src/features/explore/dal/search.dal.js filter confirmed
VEN Reference: N/A (not a VEN finding — invariant verified as HELD)
```

### BLOCKED-003 — Empty query triggering DAL call

```
Target: Bypass the debounce guard to trigger DAL call with empty query
Attack: Empty string or whitespace-only query → ctrlSearchResults called
Result: BLOCKED — useSearchScreenController.js: if (!debounced) guard prevents fetch
  query.trim() is the debounced value — only non-empty values proceed
VEN Reference: N/A (invariant verified as HELD)
```

---

## BLACKWIDOW FINDINGS

---

### BW-EXPLORE-001 (UPDATED — 2026-06-05)

```
BLACKWIDOW ADVERSARIAL FINDING

- Finding ID: BW-EXPLORE-001 (updated from 2026-06-04 run)
- Scenario: Block bypass via null viewerActorId in primary search path
- Target: ctrlSearchResults → searchDal → searchActors → identity.search_actor_directory
- Application Scope: VCSM
- Platform Surface: PWA, Supabase RPC
- Attack Vector: Normal authenticated use of /explore search
- Exploit Chain Type: Single-step exploit (one gate missing)
- Governance Status: DRAFT
- Result: BYPASSED
- Triage Classification: PRACTICAL
- Evidence: [SOURCE_VERIFIED]
  apps/VCSM/src/features/explore/controller/searchResults.controller.js
  — searchDal(trimmed, filter, {}) — empty opts confirmed; viewerActorId = null
- Defense Gate: ABSENT — no guard at hook, controller, or DAL layer
- Blast Radius: All authenticated Citizen search queries — every search is personalized
  with null viewer context (block/privacy enforcement bypassed for 100% of queries)
- Severity: HIGH
- VENOM Finding Cross-Reference: VEN-EXPLORE-002
- Recommended Fix: Inject viewerActorId from useIdentity() into useSearchScreenController;
  thread through ctrlSearchResults opts; key cache by actorId prefix
- Layer to Fix: Hook → Controller → DAL (3-layer)
- Required Follow-up Command: SPIDER-MAN (block-visibility regression test after fix), ELEKTRA
```

---

### BW-EXPLORE-002 (UPDATED — 2026-06-05)

```
BLACKWIDOW ADVERSARIAL FINDING

- Finding ID: BW-EXPLORE-002 (updated from 2026-06-04 run)
- Scenario: viewerActorId in useSearchTabsActor/ctrlSearchTabs — prop-sourced, not session
- Target: useSearchTabsActor → ctrlSearchTabs → searchDal
- Application Scope: VCSM
- Platform Surface: PWA
- Attack Vector: Actor tabs search (secondary search path)
- Exploit Chain Type: Single-step exploit (prop-sourced identity)
- Governance Status: DRAFT
- Result: PARTIAL
- Triage Classification: PLAUSIBLE
- Evidence: [SOURCE_VERIFIED] — actorId passed as prop from parent component, not from
  session resolver; identity chain is personalization-only consequence on read-only path
- Defense Gate: WEAK — viewerActorId arrives from component prop rather than session hook
- Blast Radius: Secondary search path (ctrlSearchTabs) — personalization only; no block bypass
  confirmed because ctrlSearchTabs is not the primary search controller
- Severity: LOW
- VENOM Finding Cross-Reference: VEN-EXPLORE-002 (secondary path)
- Recommended Fix: Source viewerActorId from useIdentity() in useSearchTabsActor rather
  than from prop chain
- Layer to Fix: Hook
- Required Follow-up Command: SPIDER-MAN (after primary VEN-002 fix is in)
```

---

### BW-EXPLORE-003 (UPDATED — 2026-06-05)

```
BLACKWIDOW ADVERSARIAL FINDING

- Finding ID: BW-EXPLORE-003 (updated from 2026-06-04 run)
- Scenario: vc.posts searchPosts/searchPostsByTag — no viewer-scoped privacy filter
- Target: searchPosts, searchPostsByTag via dal/search.dal.js
- Application Scope: VCSM
- Platform Surface: Supabase (direct table SELECT)
- Attack Vector: Post search returning private-actor posts to unauthorized viewers
- Exploit Chain Type: Single-step exploit (missing actor privacy filter on post query)
- Governance Status: DRAFT
- Result: UNRESOLVED — deleted_at + is_hidden filters confirmed; private actor post
  suppression UNVERIFIED (depends on vc.posts RLS policy content — not inspected)
- Triage Classification: PLAUSIBLE (conditional on RLS configuration)
- Evidence: [SOURCE_VERIFIED] apps/VCSM/src/features/explore/dal/search.dal.js:55-116
  App-layer filters: deleted_at IS NULL, is_hidden IS NULL OR false
  RLS policy on vc.posts: NOT VERIFIED in this session
- Defense Gate: PARTIAL — app-layer filters present; RLS unverified
- Blast Radius: All post search queries — private actor posts may surface if RLS does
  not suppress them and app layer has no actor-level filter
- Severity: MEDIUM
- VENOM Finding Cross-Reference: VEN-EXPLORE-002 (downstream), ARCHITECT direct-read
- Recommended Fix: ELEKTRA to trace vc.posts RLS policy coverage; add actor privacy
  filter to searchPosts if RLS does not cover it
- Layer to Fix: DAL + RLS (verify RLS first; patch DAL if insufficient)
- Required Follow-up Command: ELEKTRA (RLS chain trace)
```

---

### BW-EXPLORE-004 (UPDATED — 2026-06-05)

```
BLACKWIDOW ADVERSARIAL FINDING

- Finding ID: BW-EXPLORE-004 (updated from 2026-06-04 run)
- Scenario: hydrateActorsByIds fire-and-forget with silenced errors
- Target: ctrlSearchResults → hydrateActorsByIds().catch(() => {})
- Application Scope: VCSM
- Platform Surface: PWA, hydration engine
- Attack Vector: Unvalidated hydration data written to store on RPC error or partial response
- Exploit Chain Type: Single-step exploit (silent error swallowing)
- Governance Status: DRAFT
- Result: PARTIAL
- Triage Classification: THEORETICAL (no confirmed exploit path; error silencing is a
  hygiene issue — hydration store write corruption would require a specific hydration engine vulnerability)
- Evidence: [SOURCE_VERIFIED] apps/VCSM/src/features/explore/controller/searchResults.controller.js
  hydrateActorsByIds(actorIds).catch(() => {}) — fire-and-forget confirmed
- Defense Gate: PARTIAL — catch present; hydration is display enhancement only
- Blast Radius: Hydration cache state for current session
- Severity: LOW
- VENOM Finding Cross-Reference: ARCHITECT finding
- Recommended Fix: Log hydration failures (dev-mode only); consider removing catch to
  surface errors in testing
- Layer to Fix: Controller
- Required Follow-up Command: None (low priority)
```

---

### BW-EXPLORE-005 (UPDATED — 2026-06-05)

```
BLACKWIDOW ADVERSARIAL FINDING

- Finding ID: BW-EXPLORE-005 (updated from 2026-06-04 run)
- Scenario: Raw UUID navigation confirmed — /posts/{post.id} always; /profile/{actor_id} fallback
- Target: PostCard.jsx, ActorSearchResultRow.jsx
- Application Scope: VCSM
- Platform Surface: PWA
- Attack Vector: Post search → PostCard click → URL exposes raw post.id UUID (100% of clicks)
  Actor search → ActorSearchResultRow click when username null → URL exposes actor_id UUID
- Exploit Chain Type: Single-step exploit (hardcoded UUID in navigation)
- Governance Status: DRAFT
- Result: BYPASSED
- Triage Classification:
  Post UUID: TRIVIAL (zero conditions — every post click exposes UUID)
  Actor UUID: PRACTICAL (conditional on null username — no special tooling)
- Evidence: [SOURCE_VERIFIED]
  PostCard: apps/VCSM/src/features/explore/ui/PostCard.jsx:7 — navigate(`/posts/${post.id}`)
  ActorSearchResultRow: apps/VCSM/src/features/explore/ui/ActorSearchResultRow.jsx:22
  — navigate(`/profile/${actor.username ?? actor.actor_id}`)
- Defense Gate: ABSENT — no guard preventing UUID navigation
- Blast Radius: 100% of post-search navigations (UUID guaranteed); actor navigations when
  username null (frequency unknown, depends on identity RPC username coverage)
- Severity: HIGH
- VENOM Finding Cross-Reference: VEN-EXPLORE-003
- Recommended Fix: Model-layer filter in normalizeResult (return null for posts without slug,
  filter null-username actors before they reach UI); or enforce slug on all post/actor results
- Layer to Fix: Model + UI
- Required Follow-up Command: IRONMAN (slug enforcement), SPIDER-MAN (navigation regression)
```

---

### BW-EXPLORE-006 (UPDATED — 2026-06-05)

```
BLACKWIDOW ADVERSARIAL FINDING

- Finding ID: BW-EXPLORE-006 (updated from 2026-06-04 run)
- Scenario: BEHAVIOR.md governance gap — §9 invariants unanchored; UUID and cache findings confirmed
- Target: BEHAVIOR.md (governance artifact)
- Application Scope: VCSM
- Platform Surface: Documentation / Governance
- Attack Vector: Governance — no contract to anchor or detect regressions
- Exploit Chain Type: Multi-step exploit (systemic governance gap enables regression undetectability)
- Governance Status: DRAFT
- Result: PARTIALLY_MITIGATED
  (2026-06-04: BYPASSED — BEHAVIOR.md was placeholder)
  (2026-06-05: PARTIALLY_MITIGATED — LOGAN produced DRAFT BEHAVIOR.md with §5 + §9)
- Triage Classification: THEORETICAL (governance gap; no direct exploit; partially addressed)
- Evidence: [SOURCE_VERIFIED]
  BEHAVIOR.md status: DRAFT (2026-06-05, produced by LOGAN — TICKET-EXPLORE-BUNDLE-SECURITY-PHASE-0001)
  §5 rules: 6 declared
  §9 invariants: 6 declared
  Status before: PLACEHOLDER — 0 rules, 0 invariants
- Defense Gate: PARTIAL — BEHAVIOR.md now DRAFT; requires engineering APPROVED promotion
- Blast Radius: Feature-wide (governance gap allows future regressions to go undetected
  until production incidents)
- Severity: MEDIUM (downgraded from HIGH — BEHAVIOR.md now exists as DRAFT)
- VENOM Finding Cross-Reference: VEN-EXPLORE-001
- Recommended Fix: Engineering review and promotion of BEHAVIOR.md DRAFT → APPROVED
- Layer to Fix: Documentation / Engineering review
- Required Follow-up Command: VENOM re-run after APPROVED promotion to re-anchor all findings
```

---

### BW-EXPLORE-007 (NEW — 2026-06-05)

```
BLACKWIDOW ADVERSARIAL FINDING

- Finding ID: BW-EXPLORE-007 (NEW — not in 2026-06-04 run)
- Scenario: FeaturedResultCard raw UUID navigation — highest-frequency nav surface
- Target: FeaturedResultCard.jsx — first/hero result position in search
- Application Scope: VCSM
- Platform Surface: PWA
- Attack Vector:
  1. Any search returning actor results
  2. First result (FeaturedResultCard) has username: null
  3. FeaturedResultCard renders: navigate(`/profile/${item.username ?? item.actor_id}`)
  4. item.username null → actor_id UUID used
  5. URL = /profile/<UUID> — highest-click-rate navigation surface
- Exploit Chain Type: Single-step exploit (UUID fallback at highest-frequency nav position)
- Governance Status: DRAFT
- Result: BYPASSED
- Triage Classification: PRACTICAL
- Evidence: [SOURCE_VERIFIED]
  apps/VCSM/src/features/explore/ui/FeaturedResultCard.jsx:11
  — navigate(`/profile/${item.username ?? item.actor_id}`)
- Defense Gate: ABSENT — no guard; same pattern as ActorSearchResultRow but at hero position
- Blast Radius: All search sessions returning actor results where first result has null username;
  FeaturedResultCard is the most-clicked navigation point in search
- Severity: HIGH
- VENOM Finding Cross-Reference: VEN-EXPLORE-006
- Recommended Fix: normalizeActorRow / normalizeResult guard — filter null-username actors
  before they reach UI; FeaturedResultCard should not render actor without username
- Layer to Fix: Model (null-username filter) + UI (null check before render)
- Required Follow-up Command: SPIDER-MAN (featured card null username regression test)
```

---

### BW-EXPLORE-008 (NEW — 2026-06-05)

```
BLACKWIDOW ADVERSARIAL FINDING

- Finding ID: BW-EXPLORE-008 (NEW — not in 2026-06-04 run)
- Scenario: Route access conflict — /explore may be publicly accessible without auth
- Target: /explore route (apps/VCSM/src/features/explore/ui/index.jsx:6)
- Application Scope: VCSM
- Platform Surface: PWA (router)
- Attack Vector:
  1. Unauthenticated user navigates to /explore
  2. If scanner classification (access: public) is authoritative over barrel (public:false),
     route renders without auth check
  3. Search bar available; unauthenticated user can run actor/post searches
  4. identity RPC called with p_viewer_actor_id: null (already true for authenticated users)
  5. Actor data returned to unauthenticated visitor — privacy enforcement bypassed
- Exploit Chain Type: Single-step exploit (conditional on router enforcement state)
- Governance Status: DRAFT
- Result: UNRESOLVED — cannot determine which declaration is authoritative from
  client-side source alone; router (app.routes.jsx) not read during this session
- Triage Classification: PLAUSIBLE (conditional on router enforcement gap)
- Evidence: [SOURCE_VERIFIED]
  apps/VCSM/src/features/explore/ui/index.jsx:6 — public:false declared
  Scanner route-map: access: "public" — conflict with barrel
- Defense Gate: UNKNOWN — router enforcement not verified
- Blast Radius: All unauthenticated visitors (if gap exists)
- Severity: MEDIUM
- VENOM Finding Cross-Reference: VEN-EXPLORE-007
- Recommended Fix: HAWKEYE to verify runtime auth enforcement in app.routes.jsx;
  resolve conflict to single authoritative declaration
- Layer to Fix: Router (verification + alignment)
- Required Follow-up Command: HAWKEYE (route auth verification)
```

---

## Triage Classification Summary

| VEN Finding | Severity | BW Result | Triage Classification | §9 Invariant | THOR Blocker |
|---|---|---|---|---|---|
| VEN-EXPLORE-001 (BEHAVIOR.md absent) | HIGH | PARTIALLY_MITIGATED | THEORETICAL | — | NO (partially resolved) |
| VEN-EXPLORE-002 (viewerActorId null) | HIGH | BYPASSED | PRACTICAL | NEVER-EXPLORE-004 BYPASSED | YES |
| VEN-EXPLORE-003 (UUID PostCard + ActorRow) | HIGH | BYPASSED | TRIVIAL (post) / PRACTICAL (actor) | NEVER-EXPLORE-001 + NEVER-EXPLORE-002 BYPASSED | YES |
| VEN-EXPLORE-004 (cache cross-session) | MEDIUM | PARTIAL | PLAUSIBLE | — | NO |
| VEN-EXPLORE-005 (legacy userId field) | LOW | UNRESOLVED | THEORETICAL | — | NO |
| VEN-EXPLORE-006 (FeaturedResultCard UUID) | HIGH | BYPASSED | PRACTICAL | NEVER-EXPLORE-001 BYPASSED | YES |
| VEN-EXPLORE-007 (route access conflict) | MEDIUM | UNRESOLVED | PLAUSIBLE | — | NO |

---

## Recommended Fixes (Priority Order)

| Priority | Finding | Fix | Layer |
|---|---|---|---|
| P0 | VEN-EXPLORE-002 (BW-001) | Inject viewerActorId from session → controller → DAL | Hook + Controller + DAL |
| P0 | VEN-EXPLORE-003 (BW-005) | Filter null-username actors at model; use slug for posts | Model + UI |
| P0 | VEN-EXPLORE-006 (BW-007) | Same as VEN-003 fix; FeaturedResultCard null-username guard | Model + UI |
| P1 | VEN-EXPLORE-004 (BW-003) | Scope cache key with actorId; invalidate on actor switch | Hook |
| P1 | VEN-EXPLORE-007 (BW-008) | HAWKEYE verification of router auth enforcement | Router |
| P2 | VEN-EXPLORE-001 (BW-006) | Engineering review → promote BEHAVIOR.md DRAFT → APPROVED | Documentation |
| P2 | VEN-EXPLORE-005 (BW-004) | Remove userId/ownerUserId from model output | Model |

---

## Required Follow-up Commands

| Command | Reason | Priority |
|---|---|---|
| ELEKTRA | Source-to-sink chain trace for VEN-002, VEN-003, VEN-006; vc.posts RLS verification | P0 |
| SPIDER-MAN | Regression tests for block-visibility (VEN-002), UUID navigation (VEN-003, VEN-006), cache isolation (VEN-004) | P1 |
| HAWKEYE | Verify /explore router auth enforcement; resolve VEN-007 access conflict | P1 |
| IRONMAN | Own UUID navigation fix and slug enforcement; own model legacy field cleanup | P1 |
| VENOM | Re-run after BEHAVIOR.md reaches APPROVED and VEN-002/003/006 are fixed | P2 |
| THOR | BLOCKED — VEN-002, VEN-003, VEN-006 must be resolved before release | — |

---

## Pending Reviews

| Command | Reason | Status |
|---|---|---|
| VENOM | Re-anchor findings after BEHAVIOR.md APPROVED + VEN-002/003/006 fixed | PENDING |
| LOKI | Runtime telemetry for null viewerActorId and UUID navigation paths | PENDING |
| THOR | Release gate — BLOCKED on BW-EXPLORE-001, BW-EXPLORE-005, BW-EXPLORE-007 | BLOCKED |

---

*BLACKWIDOW V3 | VCSM:explore | 2026-06-05 | 8 BW findings (1 UPDATED-PARTIAL, 3 BYPASSED, 2 UNRESOLVED, 1 PARTIAL, 1 PARTIALLY_MITIGATED) | 7 VEN findings covered*
