# VENOM V2 SECURITY REVIEW — VCSM:explore

## Output Metadata

| Field | Value |
|---|---|
| Feature | explore |
| Command | VENOM V2 |
| Scanner Version | 1.1.0 |
| Output Path | ZZnotforproduction/APPS/VCSM/features/explore/outputs/2026/06/05/Venom/2026-06-05_venom_explore-security-review.md |
| Timestamp | 2026-06-05T00:00:00Z |
| Evidence Bundle | ZZnotforproduction/APPS/VCSM/features/explore/outputs/2026/06/05/ARCHITECT/evidence-bundle.json |
| Prior Run | 2026-06-04 (5 findings) — finding IDs continued with severity updates |

---

## 1. VENOM ARCHITECT GATE PASS

```
ARCHITECT: ZZnotforproduction/APPS/VCSM/features/explore/ARCHITECTURE.md
Scope: VCSM:explore
Date: 2026-06-05
Status: SUCCESS
Age: 0 days — FRESH
Gate: PASS
```

---

## 2. VENOM ARCHITECT OUTPUT CHECK

```
VENOM ARCHITECT OUTPUT CHECK
==============================
Evidence Bundle: ZZnotforproduction/APPS/VCSM/features/explore/outputs/2026/06/05/ARCHITECT/evidence-bundle.json
Security Surface: ZZnotforproduction/GOVERNANCE/outputs/2026/06/05/ARCHITECT/architect-security-surface-explore.json
Generated At: 2026-06-05T00:00:00Z
Age: <1h
Freshness: FRESH
Scope: VCSM:explore
Status: PASS

Security Surface Counts (from ARCHITECT output):
Write surfaces: 0
RPC surfaces: 1 (identity.search_actor_directory)
Edge function surfaces: 0
Direct table reads: 2 (vc.posts)
Navigation risks (ARCHITECT-flagged): 2
Security paths: 1 (/explore)
Call chains resolved: 6
```

---

## 3. Scanner Inputs

| Map | Generated At | Age | Freshness | Confidence | Surfaces In Scope | Used For |
|---|---|---|---|---|---|---|
| write-surface-map | 2026-06-04T20:29:11Z | ~23h | FRESH | HIGH | 0 | Mutation surface inventory |
| rpc-map | 2026-06-04T20:29:11Z | ~23h | FRESH | HIGH | 1 | RPC surface inventory |
| edge-function-map | 2026-06-04T20:29:11Z | ~23h | FRESH | HIGH | 0 | Edge function inventory |
| security-path-map | 2026-06-04T20:29:11Z | ~23h | FRESH | HIGH | 1 | Security path inventory |
| route-execution-map | 2026-06-04T20:29:11Z | ~23h | FRESH | HIGH | 1 | Route→write chain resolution |
| write-execution-map | 2026-06-04T20:29:11Z | ~23h | FRESH | HIGH | 0 | Write caller chain resolution |
| rpc-execution-map | 2026-06-04T20:29:11Z | ~23h | FRESH | HIGH | 1 | RPC caller chain resolution |
| edge-execution-map | 2026-06-04T20:29:11Z | ~23h | FRESH | HIGH | 0 | Edge caller chain resolution |

Scanner Version: 1.1.0 | Overall Preflight: FRESH | Action: PASSED

---

## 4. VENOM SECURITY SURFACE INVENTORY

```
VENOM SECURITY SURFACE INVENTORY
==================================
Feature: explore
Scope: VCSM:explore
Evidence Bundle Age: <1h — FRESH

Write Surfaces: 0
  INSERT: 0 | UPDATE: 0 | DELETE: 0 | UPSERT: 0
  Tables affected: none

RPC Calls: 1
  identity:search_actor_directory

Direct Table Reads: 2
  vc.posts (searchPosts — ilike text match)
  vc.posts (searchPostsByTag — tags array contains)

Edge Functions: 0

Security Paths: 1
  /explore — access: PUBLIC (scanner) / public:false (barrel) — CONFLICT
  HIGH confidence (caller chain resolved): 1
  LOW confidence (unresolved): 0

Navigation Surfaces with UUID Risk: 2
  PostCard → /posts/${post.id} — UUID exposed
  ActorSearchResultRow + FeaturedResultCard → /profile/${username ?? actor_id} — UUID fallback

Execution Paths Resolved: 6 / 6 (from evidence-bundle callChains)
```

---

## 5. Scanner Signals

| Signal | Source | Scanner Confidence | Verified Against Source | Provenance | Finding ID |
|---|---|---|---|---|---|
| RPC: identity.search_actor_directory from searchActors | rpc-map via evidence bundle | HIGH | YES — search.dal.js:20-27; p_viewer_actor_id always null from ctrlSearchResults path | [SOURCE_VERIFIED] | VEN-EXPLORE-002 |
| Direct read: vc.posts (searchPosts) | write-surface-map / evidence bundle | HIGH | YES — search.dal.js:55-68; actor-level privacy filter absent | [SOURCE_VERIFIED] | VEN-EXPLORE-004 |
| Direct read: vc.posts (searchPostsByTag) | write-surface-map / evidence bundle | HIGH | YES — search.dal.js:88-116; same as above | [SOURCE_VERIFIED] | VEN-EXPLORE-004 |
| Navigation: /posts/${post.id} | ARCHITECT navigation risk | HIGH | YES — PostCard.jsx:7; raw post.id UUID | [SOURCE_VERIFIED] | VEN-EXPLORE-003 |
| Navigation: /profile/${username ?? actor_id} | ARCHITECT navigation risk | HIGH | YES — ActorSearchResultRow.jsx:22; UUID fallback confirmed | [SOURCE_VERIFIED] | VEN-EXPLORE-003 |
| Navigation: /profile/${username ?? actor_id} | ARCHITECT navigation risk | HIGH | YES — FeaturedResultCard.jsx:11; same UUID fallback | [SOURCE_VERIFIED] | VEN-EXPLORE-006 |
| Route: /explore access=public (scanner conflict) | route-map via evidence bundle | HIGH | YES — ui/index.jsx:6; barrel declares public:false | [SOURCE_VERIFIED] | VEN-EXPLORE-007 |
| Cache: 45s TTL in-memory map | evidence bundle | HIGH | YES — useSearchScreenController.js:7-8; module-level singleton | [SOURCE_VERIFIED] | VEN-EXPLORE-005 |
| BEHAVIOR.md placeholder | ARCHITECT behavior check | N/A | YES — BEHAVIOR.md:3; "Status: PLACEHOLDER" | [SOURCE_VERIFIED] | VEN-EXPLORE-001 |

---

## 6. Behavior Contract Status

```
Behavior Contract Status
========================
BEHAVIOR.md path: ZZnotforproduction/APPS/VCSM/features/explore/BEHAVIOR.md
BEHAVIOR.md exists: YES
BEHAVIOR.md status: PLACEHOLDER — "Behavior contract pending source review"
§5 Security Rules declared: 0
§5 Rules verified in source: 0 / 0
§5 Rules unenforced: NONE DECLARED
§9 Must Never Happen declared: 0
§9 Invariants protected in source: 0 / 0
§9 Invariants unprotected: NONE DECLARED

All VENOM findings are UNANCHORED — no behavioral contract to cross-reference.
```

---

## 7. Trust Boundary Findings

---

### VEN-EXPLORE-001 [SOURCE_VERIFIED]

```
VENOM SECURITY FINDING
- Finding ID: VEN-EXPLORE-001
- Location: ZZnotforproduction/APPS/VCSM/features/explore/BEHAVIOR.md
- Application Scope: VCSM:explore
- Platform Surface: PWA
- Trust Boundary: Authenticated Citizen
- Boundary Violated: Cannot determine — §5 and §9 not declared
- Contract Violated: Public Identity Surface Contract (no declared security rules)
- Current behavior: BEHAVIOR.md exists as a one-line placeholder with no §5 Security Rules
  and no §9 Must Never Happen invariants. The explore feature is fully implemented and
  public-entry-point, yet has zero security anchoring.
- Risk: VENOM cannot verify that any existing enforcement matches declared intent,
  because no intent has been declared. BLACKWIDOW cannot adversarially verify invariants
  that do not exist. Security posture for the entire feature is unanchored.
- Severity: HIGH
- Exploitability: MEDIUM
  Attack Preconditions:
  - No exploit required; this is a governance gap
  - Risk: security regressions go undetected because there is no contract to break
- Blast Radius: Feature-wide — all 6 call chains are unanchored
- Identity Leak Type: None (governance gap, not data leak)
- Cache Trust Type: None
- RLS Dependency: UNVERIFIED — no declared RLS requirement to verify
- Why it matters: A public search surface with actor identity data, RPC calls, and
  direct table reads has no declared security contract. Any regression in viewerActorId
  injection, post privacy, or UUID navigation would go unnoticed until a runtime incident.
- Recommended mitigation: LOGAN intake — write real BEHAVIOR.md with §5 security rules
  (actor privacy, viewerActorId requirement, search scope limits) and §9 invariants
  (never expose private actor posts, never expose blocked actor results unfiltered).
- Rationale: Platform requires BEHAVIOR.md before release of implemented features.
- Follow-up command: LOGAN (behavior intake), then VENOM re-run to anchor findings.
- CISSP Domain:
  - Primary: Security and Risk Management
  - Secondary: Security Assessment and Testing
```

---

### VEN-EXPLORE-002 [SOURCE_VERIFIED]

```
VENOM SECURITY FINDING
- Finding ID: VEN-EXPLORE-002
- Location: apps/VCSM/src/features/explore/controller/searchResults.controller.js:9
            apps/VCSM/src/features/explore/dal/search.dal.js:20-27
- Application Scope: VCSM:explore
- Platform Surface: PWA, Supabase RPC
- Trust Boundary: Authenticated Citizen
- Boundary Violated: Authenticated Citizen → Unauthenticated (session context discarded)
- Contract Violated: Public Identity Surface Contract — actor block/privacy not enforced in search
- Current behavior: ctrlSearchResults calls searchDal(trimmed, filter, {}) — passing an
  empty opts object. searchDal dispatches to searchActors, which extracts
  viewerActorId = opts.viewerActorId || null. The result: p_viewer_actor_id is ALWAYS
  null when the primary search path (useSearchScreenController → ctrlSearchResults) is used.
  The identity.search_actor_directory RPC uses p_viewer_actor_id to personalize results —
  specifically to suppress blocked actors and respect privacy settings. With null, the RPC
  treats every viewer as unauthenticated.
- Risk: Authenticated users who have blocked specific actors may still see those actors
  in search results. Private actors may appear to actors who should not see them. The
  search surface functionally operates as unauthenticated for every logged-in Citizen.
- Severity: HIGH
- Exploitability: HIGH
  Attack Preconditions:
  - Normal authenticated Citizen account sufficient
  - Block any actor from the platform
  - Search for them — they appear in results despite the block
  - No special knowledge or tooling required
- Blast Radius: All search queries from all authenticated Citizens — every search result
  is personalized using null context
- Identity Leak Type: Actor correlation (blocked actors visible to blockers)
- Cache Trust Type: Identity-sensitive (cache stores results computed with null viewerActorId)
- RLS Dependency: ASSUMED — server-side RPC logic handles some privacy, but null viewer bypasses the viewer-sensitive path
- Why it matters: Block enforcement is a trust primitive on VCSM. If search ignores it,
  actors can be harassed via search even after being blocked. This is the same category
  of violation as a DM surface that ignores block state.
- Recommended mitigation:
  1. Inject viewerActorId into useSearchScreenController state (from useIdentity() or session hook)
  2. Pass viewerActorId through ctrlSearchResults → searchDal → searchActors opts
  3. Invalidate the in-memory search cache when actor block state changes
  Layer: Hook → Controller → DAL (3-layer fix)
- Rationale: The fix path is clear and surgical — no DB changes needed. RPC already
  accepts the parameter; it just needs to be plumbed through.
- Follow-up command: SPIDER-MAN (test block-visibility regression after fix)
- CISSP Domain:
  - Primary: Identity and Access Management
  - Secondary: Security Architecture and Engineering
```

---

### VEN-EXPLORE-003 [SOURCE_VERIFIED]

```
VENOM SECURITY FINDING
- Finding ID: VEN-EXPLORE-003
- Location: apps/VCSM/src/features/explore/ui/PostCard.jsx:7
            apps/VCSM/src/features/explore/ui/ActorSearchResultRow.jsx:22
- Application Scope: VCSM:explore
- Platform Surface: PWA
- Trust Boundary: Public Visitor, Authenticated Citizen
- Boundary Violated: None (read-only surface) — Platform contract violation
- Contract Violated: Public Identity Surface Contract — no-raw-IDs-in-public-URLs
- Current behavior:
  PostCard: navigate(`/posts/${post.id}`) — post.id is raw UUID from vc.posts.
  ActorSearchResultRow: navigate(`/profile/${actor.username ?? actor.actor_id}`) —
  falls back to actor.actor_id (UUID) when actor.username is null. The identity RPC
  can return null username for some actor kinds.
- Risk: Raw UUIDs in public URLs violate the platform "no raw IDs in public-facing
  URLs" rule. This creates: (1) internal DB structure exposure (UUIDs are primary keys),
  (2) resource enumeration surface — though UUID v4 mitigates sequential scanning,
  correlation with known actor_ids from other surfaces is possible.
- Severity: HIGH (platform rule violation + identity leak)
- Exploitability: LOW (UUID v4 is random — direct enumeration hard, but correlation possible)
  Attack Preconditions:
  - User must obtain post.id or actor_id from another surface (e.g., API response)
  - Then can construct direct URLs bypassing search personalization
- Blast Radius: All search result post navigations and actor navigations from search
- Identity Leak Type: Internal UUID exposure, Actor correlation
- Cache Trust Type: None
- RLS Dependency: NONE (app-layer navigation — DB not involved in URL construction)
- Why it matters: The platform has a stated rule against UUIDs in public URLs. This
  surface violates it in two places. UUID exposure is also the foundation for IDOR
  attacks in write paths — establishing UUID patterns in navigation normalizes their
  use and creates audit debt.
- Recommended mitigation:
  PostCard: Use a slug or human-readable post identifier for navigation. If posts
  don't have slugs, coordinate with the posts feature to add one. Short-term: accept
  but log as known violation and track slug adoption.
  ActorSearchResultRow: The username ?? actor_id pattern must be hardened — if username
  is null, navigate to a placeholder or suppress the card rather than using UUID fallback.
  At minimum, log a warning when the fallback fires.
  Layer: UI (PostCard.jsx, ActorSearchResultRow.jsx)
- Rationale: Slugs are the platform standard for all public navigation. UUID fallbacks
  are an implementation convenience that should not reach production navigation paths.
- Follow-up command: IRONMAN (ownership of slug field for posts), WOLVERINE (ticket for slug adoption)
- CISSP Domain:
  - Primary: Asset Security
  - Secondary: Software Development Security
```

---

### VEN-EXPLORE-004 [SOURCE_VERIFIED]

```
VENOM SECURITY FINDING
- Finding ID: VEN-EXPLORE-004
- Location: apps/VCSM/src/features/explore/hooks/useSearchScreenController.js:11-12
- Application Scope: VCSM:explore
- Platform Surface: PWA
- Trust Boundary: Authenticated Citizen
- Boundary Violated: Cross-session identity boundary (shared device risk)
- Contract Violated: None explicit — VCSM identity switching contract (implicit)
- Current behavior: searchResultCache and searchInflight are declared as module-level
  singletons (Map instances) outside the hook function body. This means the cache
  persists across component unmounts, re-mounts, and — critically — across actor
  switches. If Citizen A searches for "coffee", unmounts the explore screen, and
  Citizen B logs in on the same device, Citizen B's first "coffee" search may return
  Citizen A's cached results (for up to 45 seconds).
- Risk: Actor-switch-sensitive on shared devices (family devices, demo accounts,
  public kiosks). Cached search results include actor profile data (display_name,
  username, photo_url, is_private) which could be exposed to the wrong actor.
- Severity: MEDIUM
- Exploitability: MEDIUM
  Attack Preconditions:
  - Shared physical device required
  - Previous actor must have searched within 45 seconds before switch
  - Attacker must use explore search within 45s window
- Blast Radius: Single actor (cached results from prior actor session)
- Identity Leak Type: Actor correlation (prior searcher's result set exposed)
- Cache Trust Type: Identity-sensitive (contains actor profile data from prior session)
- RLS Dependency: NONE (cache is app-layer only)
- Why it matters: VCSM supports actor switching (personal ↔ VPORT). The cache does not
  invalidate on actor switch. For high-trust actor identities (e.g., VPORT owners) this
  could leak business-relevant search history.
- Recommended mitigation:
  1. Scope the cache inside the hook function body (re-initialized per mount) rather than
     as a module-level singleton — eliminates cross-session leak but loses performance benefit
  2. OR: Key the cache by actorId prefix: `${actorId}:${filter}:${query}` — requires
     injecting actorId into the hook
  3. Clear module-level cache on actor switch event (subscribe to identity change event)
  Layer: Hook
- Rationale: Module-level caching is a common performance pattern but must be scoped
  to the authenticated identity when results are identity-sensitive.
- Follow-up command: SPIDER-MAN (test cache isolation after actor switch)
- CISSP Domain:
  - Primary: Identity and Access Management
  - Secondary: Security Architecture and Engineering
```

---

### VEN-EXPLORE-005 [SOURCE_VERIFIED]

```
VENOM SECURITY FINDING
- Finding ID: VEN-EXPLORE-005
- Location: apps/VCSM/src/features/explore/model/search.model.js:47-48 (mapVportSearchResult)
            apps/VCSM/src/features/explore/model/search.model.js:19-32 (mapActorSearchResult)
- Application Scope: VCSM:explore
- Platform Surface: PWA
- Trust Boundary: Authenticated Citizen
- Boundary Violated: Public Identity Surface Contract
- Contract Violated: Public Identity Surface Contract — userId/ownerUserId are legacy fields
- Current behavior: mapActorSearchResult returns userId: row.user_id ?? null as a field in
  the normalized result object. mapVportSearchResult returns ownerUserId: row.owner_user_id ?? null.
  These fields are passed to UI components and may be consumed by consumers of useSearchActor.
  The VCSM identity contract prohibits exposing userId or vportId through hook or component surfaces.
- Risk: Legacy identity fields (userId, ownerUserId) in search result objects could be
  consumed by UI components or downstream hooks and used for navigation or display in
  ways that bypass the actor-based identity model. This also expands the attack surface
  if userId is exposed in rendered HTML attributes or logging.
- Severity: LOW
- Exploitability: LOW
  Attack Preconditions:
  - Would require a consumer to pick up userId and use it for something security-relevant
  - Current UI components do not appear to use these fields for navigation
- Blast Radius: Single actor (per-result exposure)
- Identity Leak Type: Actor correlation (legacy user_id field present in result object)
- Cache Trust Type: None
- RLS Dependency: NONE
- Why it matters: The VCSM identity contract is explicit: userId is legacy. Including it
  in normalized result objects creates debt and risk that a future consumer picks it up.
- Recommended mitigation:
  Remove userId from mapActorSearchResult output.
  Remove ownerUserId from mapVportSearchResult output.
  Audit consumers of these model functions to confirm no UI uses these fields.
  Layer: Model
- Rationale: Clean identity surfaces reduce the chance of identity-model violations in
  future features consuming the search model.
- Follow-up command: IRONMAN (ownership of search model cleanup)
- CISSP Domain:
  - Primary: Asset Security
  - Secondary: Software Development Security
```

---

### VEN-EXPLORE-006 [SOURCE_VERIFIED]

```
VENOM SECURITY FINDING
- Finding ID: VEN-EXPLORE-006
- Location: apps/VCSM/src/features/explore/ui/FeaturedResultCard.jsx:11
- Application Scope: VCSM:explore
- Platform Surface: PWA
- Trust Boundary: Public Visitor, Authenticated Citizen
- Boundary Violated: None — Platform contract violation
- Contract Violated: Public Identity Surface Contract — no-raw-IDs-in-public-URLs
- Current behavior: FeaturedResultCard renders the first result in the search list as
  a featured/hero card. For actor results, it navigates via:
  navigate(`/profile/${item.username ?? item.actor_id}`)
  The same UUID fallback pattern as ActorSearchResultRow — if item.username is null,
  item.actor_id (a raw UUID) is used in the navigation URL. This component was not
  specifically named in the previous VENOM run (VEN-EXPLORE-003 covered the general
  pattern) but is a distinct navigation entry point.
- Risk: Same as VEN-EXPLORE-003 — raw UUID exposed in public URL. The featured card
  is the most prominent result position (first in list, hero layout), making it the
  most likely navigation target for users. UUID exposure here is the highest-frequency
  path.
- Severity: HIGH
- Exploitability: LOW (UUID v4 random — same as VEN-EXPLORE-003)
  Attack Preconditions:
  - actor.username must be null (possible for some actor kinds)
  - User navigates via featured card
- Blast Radius: All featured-card navigations from search
- Identity Leak Type: Internal UUID exposure, Actor correlation
- Cache Trust Type: None
- RLS Dependency: NONE
- Why it matters: Three separate components (PostCard, ActorSearchResultRow, FeaturedResultCard)
  all have UUID exposure. This is a systematic pattern, not a one-off — it needs a
  platform-level fix (ensure username is never null for navigable actors, or use a
  canonical slug for all actor navigation).
- Recommended mitigation:
  1. Enforce non-null username at the identity RPC layer — actors without usernames
     should not be returned as navigable results
  2. OR: Add a guard in normalizeActorRow/normalizeResult that filters out null-username
     actors before they reach UI components
  3. FeaturedResultCard should not render if actor_id would be the navigation target
  Layer: Model (normalizeActorRow guard), UI (FeaturedResultCard null check)
- Rationale: The featured card is the highest-visibility navigation surface in search —
  UUID exposure here has the most user-facing impact.
- Follow-up command: IRONMAN (identity model), WOLVERINE (ticket to enforce username non-null)
- CISSP Domain:
  - Primary: Asset Security
  - Secondary: Identity and Access Management
```

---

### VEN-EXPLORE-007 [SOURCE_VERIFIED]

```
VENOM SECURITY FINDING
- Finding ID: VEN-EXPLORE-007
- Location: apps/VCSM/src/features/explore/ui/index.jsx:6
            apps/scanner/maps/route-map.json (explore entry)
- Application Scope: VCSM:explore
- Platform Surface: PWA
- Trust Boundary: Public Visitor vs. Authenticated Citizen — CONFLICT
- Boundary Violated: Cannot determine — scanner and barrel disagree on access classification
- Contract Violated: Public Identity Surface Contract (unresolved auth boundary)
- Current behavior: The route barrel (ui/index.jsx line 6) declares:
  { path: '/explore', element: <ExploreScreen />, public: false }
  The scanner (route-map.json) classifies /explore as access: "public".
  The router layer (app.routes.jsx) is the authority on actual runtime enforcement,
  but the conflict means neither the barrel nor the scanner provides ground truth.
- Risk: If the router is not enforcing auth for /explore (trusting the barrel's
  public:false as a comment rather than a runtime gate), then:
  - Unauthenticated visitors can access the search surface
  - The identity RPC is called with null viewerActorId (already true per VEN-EXPLORE-002)
  - Private actor data may be returned to unauthenticated visitors
  If the router IS enforcing auth but the scanner doesn't know it, the classification
  is a documentation/tooling drift problem rather than a runtime risk.
- Severity: MEDIUM
- Exploitability: MEDIUM (conditional on router enforcement)
  Attack Preconditions:
  - Unauthenticated visitor navigates to /explore
  - If no auth gate, search surface is accessible without account
- Blast Radius: All unauthenticated visitors
- Identity Leak Type: Actor correlation (actor profiles visible without auth)
- Cache Trust Type: None
- RLS Dependency: ASSUMED — if unauthenticated access is real, relies on anon RLS on vc.posts
- Why it matters: The access classification conflict means security tooling cannot
  reliably assess this route without inspecting the router. HAWKEYE is required to
  determine ground truth.
- Recommended mitigation:
  1. HAWKEYE: verify runtime auth enforcement for /explore in app.routes.jsx
  2. If route is truly public: update barrel to public: true, document the intent,
     and ensure VEN-EXPLORE-002 (null viewerActorId) is fixed before unauthenticated
     actor data is served
  3. If route is protected: update scanner classification and document the auth gate
  Layer: Router (runtime verification needed)
- Rationale: Conflicting access declarations create audit blind spots. The classification
  must be resolved to ground truth before release.
- Follow-up command: HAWKEYE (route access verification)
- CISSP Domain:
  - Primary: Identity and Access Management
  - Secondary: Communication and Network Security
```

---

## 8. Source Verification Summary

```
Total surfaces in scope: 9 (1 RPC + 2 direct reads + 2 navigation risks + 1 route + 1 cache + 1 behavior gap + 1 featured card)
Surfaces source-verified: 9 / 9

Source files verified (targeted — all already in evidence bundle):
- apps/VCSM/src/features/explore/dal/search.dal.js — VEN-EXPLORE-002, VEN-EXPLORE-004
- apps/VCSM/src/features/explore/controller/searchResults.controller.js — VEN-EXPLORE-002
- apps/VCSM/src/features/explore/hooks/useSearchScreenController.js — VEN-EXPLORE-004, VEN-EXPLORE-005
- apps/VCSM/src/features/explore/model/search.model.js — VEN-EXPLORE-005
- apps/VCSM/src/features/explore/ui/PostCard.jsx — VEN-EXPLORE-003
- apps/VCSM/src/features/explore/ui/ActorSearchResultRow.jsx — VEN-EXPLORE-003
- apps/VCSM/src/features/explore/ui/FeaturedResultCard.jsx — VEN-EXPLORE-006
- apps/VCSM/src/features/explore/ui/index.jsx — VEN-EXPLORE-007
- ZZnotforproduction/APPS/VCSM/features/explore/BEHAVIOR.md — VEN-EXPLORE-001

CRITICAL findings: 0
HIGH findings: 4 — all [SOURCE_VERIFIED]: YES
```

---

## 9. Confidence Summary

```
HIGH confidence surfaces: 9
LOW confidence surfaces: 0
[SOURCE_VERIFIED] findings: 7
[SCANNER_LEAD] findings: 0
[SCANNER_LOW_CONF] findings: 0
[SCANNER_STALE] findings: 0
```

---

## 10. THOR Impact

```
THOR Release Blockers:
- VEN-EXPLORE-002 | HIGH | viewerActorId null — block enforcement bypassed for all searches
- VEN-EXPLORE-003 | HIGH | Raw UUID in /posts/ and /profile/ navigation
- VEN-EXPLORE-006 | HIGH | Raw UUID in FeaturedResultCard (highest-frequency navigation)

Highest Open Severity: HIGH
THOR Gate Status: BLOCKED — 3 HIGH findings unresolved
```

---

## 11. Enhanced Mitigation Plan

| Finding | Risk | Layer to Fix | Priority | Owner | Follow-up Command |
|---|---|---|---|---|---|
| VEN-EXPLORE-001 | No security anchoring — all findings unanchored | Documentation | P1 | Documentation | LOGAN |
| VEN-EXPLORE-002 | Block/privacy enforcement bypassed in search | Hook → Controller → DAL | P0 | App | SPIDER-MAN |
| VEN-EXPLORE-003 | Raw UUID in post/actor navigation URLs | UI | P1 | App | IRONMAN, WOLVERINE |
| VEN-EXPLORE-004 | Cross-session cache leak on actor switch | Hook | P2 | App | SPIDER-MAN |
| VEN-EXPLORE-005 | Legacy userId/ownerUserId in model output | Model | P2 | App | IRONMAN |
| VEN-EXPLORE-006 | Raw UUID fallback in FeaturedResultCard | Model + UI | P1 | App | IRONMAN, WOLVERINE |
| VEN-EXPLORE-007 | Route access conflict — auth boundary unclear | Router | P1 | App | HAWKEYE |

---

## 12. CISSP Domain Coverage Summary

| CISSP Domain | Findings | Notes |
|---|---:|---|
| Security and Risk Management | 1 | VEN-001 (behavior contract gap) |
| Asset Security | 3 | VEN-003, 005, 006 (UUID/identity field exposure) |
| Security Architecture and Engineering | 2 | VEN-002, 004 (trust boundary design, cache isolation) |
| Communication and Network Security | 1 | VEN-007 (route access conflict) |
| Identity and Access Management | 4 | VEN-002, 004, 006, 007 (session binding, actor switch, auth boundary) |
| Security Assessment and Testing | 1 | VEN-001 (no contract to test against) |
| Security Operations | 0 | No debug/logging findings — explore has no debug surfaces |
| Software Development Security | 2 | VEN-003, 005 (UUID in nav, legacy field exposure) |

Uncovered domains:
- Security Operations: explore has no logging, debug panels, or admin surfaces — N/A
- Upload/Media: explore has no upload surfaces — N/A

---

## 13. SOURCE READ SUMMARY

| Command | Source Files Read | Evidence Bundle Used | Full Rediscovery Performed |
|---|---:|---|---|
| VENOM | 0 (new reads) | YES — ZZnotforproduction/APPS/VCSM/features/explore/outputs/2026/06/05/ARCHITECT/evidence-bundle.json | NO |

All 9 source verifications drew from files read during the ARCHITECT phase of this same session. Evidence bundle was produced from those reads and all findings are confirmed against file content already in session context. No new source file reads were required.

---

## 14. Required Follow-Up Commands

| Command | Reason | Priority |
|---|---|---|
| LOGAN | Write real BEHAVIOR.md — §5 and §9 required before next VENOM re-run can anchor findings | P0 |
| SPIDER-MAN | Test block visibility after VEN-EXPLORE-002 fix; test cache isolation after VEN-EXPLORE-004 fix | P1 |
| HAWKEYE | Verify runtime auth enforcement for /explore (resolve VEN-EXPLORE-007 conflict) | P1 |
| IRONMAN | Own UUID navigation fix across PostCard, ActorSearchResultRow, FeaturedResultCard; own model cleanup for legacy userId fields | P1 |
| BLACKWIDOW | Re-run adversarial verification after VEN-EXPLORE-002 fix (viewerActorId injection) | P2 |
| ELEKTRA | First run on explore — code-level scan for input sanitization and DAL trust boundaries | P2 |
| THOR | BLOCKED on VEN-EXPLORE-002, 003, 006 — do not release until cleared | — |

---

*VENOM V2 | VCSM:explore | 2026-06-05 | 7 findings: 0 CRITICAL · 4 HIGH · 2 MEDIUM · 1 LOW*
