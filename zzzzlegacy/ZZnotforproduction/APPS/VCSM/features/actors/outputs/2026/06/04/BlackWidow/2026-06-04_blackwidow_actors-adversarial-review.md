# BLACKWIDOW V2 Adversarial Review — actors
## BW2.5 V2 Full Report

---

## 1. Output Metadata

| Field | Value |
|---|---|
| Report ID | BW-ACTORS-2026-06-04 |
| Feature | actors |
| Application | VCSM |
| Run Date | 2026-06-04 |
| Analyst | BLACKWIDOW V2 |
| Protocol Version | BW2.5 V2 |
| Behavior Contract Status | PLACEHOLDER — all §9 invariants UNANCHORED |
| Scanner Freshness | FRESH — 2026-06-04T19:48:25.152Z (~7h old) |
| Scanner Version | 1.1.0 |

---

## 2. Scanner Preflight

| Field | Value |
|---|---|
| Scanner Version | 1.1.0 |
| Maps Generated | 2026-06-04T19:48:25.152Z |
| Status | FRESH |
| Security Paths Attributed to actors | 2 |
| Total Platform Security Paths | 598 |
| RPC Execution Map Entries (actors) | 0 |
| Write Execution Map Entries (actors) | 0 |

---

## 3. Scanner Inputs

| Map | Status | Notes |
|---|---|---|
| security-path-map.json | READ | 2 paths found for actors feature, both LOW confidence (no resolved route) |
| callgraph.json | READ | 15 nodes, 11 edges; 1 controller entry point, 1 adapter, 6 DAL nodes (4 Wentrex, 2 VCSM) |
| write-execution-map.json | READ | 0 entries for actors — no write mutations attributed |
| rpc-execution-map.json | READ | 0 entries for actors — RPC call not resolved to execution path |

---

## 4. Attack Surface Inventory

### 4.1 Scanner Security Paths

| Path ID | Route | Access | Confidence | Notes |
|---|---|---|---|---|
| SP-ACTORS-01 | null | unknown | LOW | searchActorsDAL write surface discovered without route-confirmed path |
| SP-ACTORS-02 | null | unknown | LOW | search_actor_directory RPC discovered without route-confirmed path |

Both paths are LOW confidence — PRIMARY ATTACK TARGETS per Rule BW-002.

### 4.2 Feature Module Source Files

| File | Layer | Notes |
|---|---|---|
| apps/VCSM/src/features/actors/controllers/searchActors.controller.js | controller | Thin pass-through; no viewerActorId restriction logic |
| apps/VCSM/src/features/actors/dal/searchActors.dal.js | dal | Canonical RPC gateway; filter logic present |
| apps/VCSM/src/features/actors/model/searchActors.model.js | model | Maps rows; no security logic |
| apps/VCSM/src/features/actors/adapters/actors.adapter.js | adapter | Thin re-export; no security logic |
| apps/VCSM/src/state/actors/assertActorId.js | utility | Type-only validator; not a security gate |
| apps/VCSM/src/state/actors/profileGateStore.js | state | Invalidation signal store; no security logic |
| apps/VCSM/src/state/actors/actorStore.js | barrel | Re-exports from @hydration |
| apps/VCSM/src/state/actors/hydrateActors.js | barrel | Re-exports from @hydration |
| apps/VCSM/src/state/actors/useActorSummary.js | barrel | Re-exports from @hydration |
| apps/VCSM/src/features/settings/profile/dal/actors.read.dal.js | dal (external) | vport_id lookup; no viewer check |

### 4.3 Out-of-Module RPC Callsites (VEN-ACTORS-003 surface)

Three callsites outside `features/actors/` call `identity.search_actor_directory` directly,
bypassing the canonical DAL security gateway:

| File | Filter Hardcoded? | Viewer Source |
|---|---|---|
| apps/VCSM/src/features/chat/setup.js:52 | 'all' hardcoded | `useIdentitySelectionStore.getState().activeActorId` — pulled from store |
| apps/VCSM/src/features/upload/dal/searchMentionSuggestions.dal.js:24 | 'all' hardcoded | `viewerActorId = null` default — caller must supply |
| apps/VCSM/src/features/explore/dal/search.dal.js:20 | mapFilter(filter) dynamic | `viewerActorId = null` default — caller must supply |

### 4.4 Callgraph Entry Points

| Node ID | Layer | Callers |
|---|---|---|
| searchActors (controller) | controller | searchActorsAdapter (adapter) → ctrlSearchActors (Blocks.controller.js) + searchTeamCandidatesController (vportTeamAccess.controller.js) |
| searchActorsAdapter (adapter) | adapter | ctrlSearchActors (privacy/controller/Blocks.controller.js); searchTeamCandidatesController (vport/dashboard/cards/team/controller) |

### 4.5 DAL Write Surfaces

No write DAL surfaces identified in the actors feature. The only mutation surface is the
`identity.search_actor_directory` RPC (read-only by design).

---

## 5. Scanner Signals

| Signal | Value |
|---|---|
| HIGH confidence RPC calls | 1 (searchActorsDAL → identity.search_actor_directory) |
| Route resolution | UNRESOLVED — both security paths lack sourceRoute |
| Write mutations | 0 |
| External DAL bypass callsites | 3 (explore/dal, upload/dal, chat/setup.js) |
| Hook-to-controller chains resolved | 2 (useActorLookup → ctrlSearchActors; useSearchTabsActor → ctrlSearchTabs) |

---

## 6. Adversarial Path Analysis

### A. OWNERSHIP BYPASS (§5.1)

**Attack**: Can an attacker submit a search request that returns private actors by manipulating
the viewerActorId parameter?

**Source Trace**:

Path 1 — Blocks search (canonical path):
- `useActorLookup` (privacy/hooks/useActorLookup.js:28) calls `ctrlSearchActors({ query: normalized })`
- `ctrlSearchActors` (Blocks.controller.js:54–58) calls `searchActorsAdapter({ query, limit: 12 })` — **no viewerActorId passed**
- `searchActorsAdapter` calls `searchActors({ query, limit })` — viewerActorId defaults to null
- `searchActorsDAL` (dal/searchActors.dal.js:9) sets `filter = viewerActorId ? 'all' : 'public'`
- Result: `p_filter: 'public'` is sent to `identity.search_actor_directory`
- **Private actors are excluded from block search results** — this is the VEN-ACTORS-001 finding confirmed.

Path 2 — Team candidate search:
- `searchTeamCandidatesController` (vportTeamAccess.controller.js:152–156) **does** accept and forward `viewerActorId`
- It passes it through `searchActorsAdapter({ query, limit: 12, viewerActorId })`
- The canonical DAL correctly sets `filter = viewerActorId ? 'all' : 'public'`
- Result: Team candidate search uses the correct filter when the viewer is authenticated.

**Ownership Bypass of Block Search**: A malicious actor cannot bypass this to see private profiles
via blocks search — but the effect is the reverse: **private users cannot be blocked** through the
search UI because they won't appear in results. This is a safety degradation, not a data exposure.

**Result**: BLOCKED (no ownership bypass for data leakage); BYPASSED for safety feature completeness
(confirmed in VEN-ACTORS-001).

---

### B. SESSION MUTATION (§5.2)

**Attack**: Can an attacker inject a crafted `viewerActorId` from the client payload to bypass
privacy filters, gaining access to `p_filter: 'all'` by supplying any non-null string?

**Source Trace**:

The canonical DAL logic at `searchActors.dal.js:9`:
```javascript
const filter = viewerActorId ? 'all' : 'public';
```

This check is a **truthy check only** — it does not validate that `viewerActorId` is a valid
session-owned actor UUID. Any non-null, non-empty string passes the gate.

**Attack Vector**: If a callsite exposes `viewerActorId` as a client-supplied parameter without
validating against the authenticated session, an attacker can supply any arbitrary string (e.g., `"x"`)
to force `p_filter: 'all'`, potentially seeing actors who set themselves to non-public visibility.

**Callsite Assessment**:

1. `ctrlSearchActors` (Blocks.controller.js:54): Does NOT accept viewerActorId. Hardcodes null.
   Session injection impossible via this path. Result: BLOCKED.

2. `searchTeamCandidatesController` (vportTeamAccess.controller.js:152): Accepts `viewerActorId`
   from caller but this controller is called from a hook (UI layer). No server-side session
   validation of viewerActorId against auth session is performed before passing to DAL.
   The `viewerActorId` must be provided by the caller. If the calling hook pulls from
   `useIdentity()`, the value is session-derived. However, there is no assertion that the
   provided `viewerActorId` matches the authenticated session principal.

3. `searchMentionSuggestions.dal.js:19`: Accepts `viewerActorId = null` as external parameter.
   If any upstream caller allows the client to supply this value, it constitutes a session
   mutation vector. No callers reviewed in this session inject client-controlled values.

**Finding**: The canonical DAL's truthy-only check for `viewerActorId` creates a structural
vulnerability. Any non-null value elevates from 'public' to 'all' filter without session
verification. The current call chains appear to source viewerActorId from authenticated session
state (`useIdentity` or `useIdentitySelectionStore`), but this is a convention, not a contract.

**Result**: PARTIAL — Structurally present; current callers source from session (BLOCKED in practice);
no session validation contract exists (unverified for future callers).

---

### C. RUNTIME ABUSE (§5.3)

**Attack**: Can a non-owner actor type reach owner-only paths in the actors feature?

**Scope**: The actors feature itself (searchActors, searchActorsDAL) has no actor-kind gate.
This is by design — search should work for both 'user' and 'vport' actors.

The adjacent team management controllers (vportTeamAccess.controller.js) DO enforce actor
ownership via `assertActorOwnsVportActorController` on every write mutation:
- `getTeamAccessController` (line 53): callerActorId required + assertActorOwnsVportActorController
- `addTeamMemberController` (line 63): callerActorId required + assertActorOwnsVportActorController
- `updateTeamMemberRoleController` (line 86): callerActorId required + assertActorOwnsVportActorController
- `setTeamMemberStatusController` (line 106): callerActorId required + assertActorOwnsVportActorController
- `removeTeamMemberController` (line 131): callerActorId required + assertActorOwnsVportActorController

**Result**: BLOCKED — Owner-kind gates enforced for all team mutations that leverage the actors
search surface. The search itself is kind-agnostic by design.

---

### D. RLS VERIFICATION (§5.4)

**Attack**: Is there an ownership filter in the query, or is RLS the only barrier?

The actors feature uses an RPC (`identity.search_actor_directory`) rather than a direct table
scan. RLS enforcement is delegated to the DB function. The DAL passes `p_viewer_actor_id` and
`p_filter` to the function, which is responsible for respecting privacy settings at the DB layer.

**Secondary surface**: `settings/profile/dal/actors.read.dal.js` reads from `vc.actors`
(via `vcClient`) using `.eq('id', actorId)` with no viewer ownership check. This is a read of
the actor's own vport_id — used in settings context after the user is authenticated. No
cross-actor exposure vector identified in this specific query.

**Unverified**: The DB-level implementation of `identity.search_actor_directory` has not been
inspected in this review. RLS enforcement depends entirely on the DB function's implementation.
This is flagged as an unverified trust boundary.

**Result**: UNRESOLVED — DB function implementation not verified. Caller correctly passes
viewer context; DB function trust assumed.

---

### E. VIEWER CONTEXT FUZZING (§5.5)

**Attack**: What happens if null/undefined viewerActorId is passed to each controller?

1. `searchActors` controller (searchActors.controller.js:4): `viewerActorId = null` default —
   accepts null gracefully, passes to DAL. DAL returns `'public'` filter. No crash. No bypass.
   Empty needle guard at DAL line 6 prevents empty search exploitation.

2. `ctrlSearchActors` (Blocks.controller.js:54): No viewerActorId parameter at all.
   Always passes null. Graceful degradation confirmed.

3. `searchTeamCandidatesController` (vportTeamAccess.controller.js:152): Accepts
   `{ query, viewerActorId }` — if viewerActorId is undefined, DAL defaults to null.
   No null guard before passing to adapter. Graceful — null flows to public-only filter.

4. `searchMentionSuggestions.dal.js`: `viewerActorId = null` default. Graceful.

5. `explore/dal/search.dal.js`: `viewerActorId = null` default. Graceful.

**assertActorId utility** (state/actors/assertActorId.js:3–8): This utility only throws if
the actor is a **non-null non-string** — it does NOT throw for null. This means passing `null`
bypasses the assertion and proceeds with no validation. This weakens the utility's protective
value as a null guard.

```javascript
// assertActorId.js line 4-6:
export function assertActorId(actor) {
  if (actor && typeof actor !== "string") {  // null passes silently
    ...throw...
  }
}
```

**Result**: PARTIAL — Null flows are graceful throughout the chain; however the assertActorId
utility does not guard against null inputs, reducing its protective value.

---

### F. MUTATION REPLAY (§5.6)

**Attack**: Can a completed search operation be re-triggered against terminal state?

The actors feature contains no state-machine operations. `identity.search_actor_directory` is
a read-only RPC. There are no mutations to replay.

**Adjacent surface (Blocks)**: Block mutations in ctrlBlockActor have an idempotency check
(line 86: `if (existingBlockedIds && existingBlockedIds.has(blockedActorId))`) but this is
supplied by the caller as a Set. If the caller fails to supply `existingBlockedIds`, the check
is skipped and a duplicate block INSERT could succeed or fail at the DB level depending on
uniqueness constraints. This is a MEDIUM concern in the blocks feature, outside actors scope.

**Result**: BLOCKED — No stateful mutations in actors feature.

---

### G. HYDRATION POISONING (§5.7)

**Attack**: Can actor summaries in the hydration store be poisoned to serve stale or forged data?

The hydration engine (`engines/hydration/src/store.js`) uses a `safeMerge` strategy:
- `safeMerge` never overwrites a non-null value with null (lines 20–26)
- Fresher non-null values always win
- A 5-minute staleness TTL triggers re-fetch (STALE_AFTER_MS = 5 * 60 * 1000)

**Poison vector**: `upsertActors` is called on any array of rows including results from
`search_actor_directory`. If a forged search result (e.g., via a MITM or XSS vector) populates
the store with a poisoned `displayName`, it would persist for up to 5 minutes and would be served
from cache to all components rendering that actor.

**Actor ID key**: The store keys actors by `r.actor_id ?? r.actorId ?? r.id`. This is
permissive — any row with an `actorId` field (not necessarily a valid UUID) could write into
the store. However, the downstream `getActorSummariesByIdsDAL` re-fetches from the canonical
RPC using UUIDs, which would overwrite poisoned entries on next hydration cycle.

**Severity**: The attack requires either XSS or a compromised Supabase session. Given the client-side
nature of this store, this is consistent with the broader XSS threat model and is not unique to
the actors feature. It is documented for completeness.

**Result**: PARTIAL — Structurally possible via XSS/session compromise; TTL limits exposure
window; safeMerge partially mitigates; non-UUID actor IDs could write garbage into store.

---

### H. URL SURFACE (§5.9)

**Attack**: Do notification linkPaths, share links, or deep links expose raw UUIDs?

The actors feature contains no notification construction, no share link generation, and no
deep link creation. The search results return `actorId` (UUID) in their model
(`searchActors.model.js:5: actorId: row.actor_id`) but routing to profiles is handled by
consuming features, not the actors module itself.

**Callsite review**: No URL construction found in any actors feature file.

**Result**: BLOCKED — No URL surface in actors feature itself. UUID handling by consuming
features is outside scope of this review.

---

### I. §9 INVARIANT ATTACK MAP

**BEHAVIOR.md Status**: PLACEHOLDER — zero §4 Failure Paths and zero §9 Must Never Happen
invariants are defined.

Since invariants are UNANCHORED, the following invariants are **source-inferred** from the
actors module design intent:

| Inferred Invariant | Attack Designed | Result |
|---|---|---|
| Private actors must not appear in search for unauthenticated or null-viewer requests | Supply null viewerActorId to searchActorsDAL; observe filter='public' applied | BLOCKED — DAL enforces 'public' filter on null viewer |
| Actor search must not allow arbitrary filter bypass via client payload | Supply non-UUID string as viewerActorId to force filter='all' | PARTIAL — truthy check only; no UUID validation; structurally bypassable |
| Block search must use viewerActorId to respect private profile visibility | Call ctrlSearchActors without viewerActorId; observe private profiles excluded | BYPASSED — ctrlSearchActors hardcodes null viewerActorId; private profiles excluded from block search (VEN-ACTORS-001 confirmed) |
| Actor hydration store must not accept non-UUID actor IDs as keys | Supply row with non-UUID actorId to upsertActors | PARTIAL — store accepts any truthy string as key; no UUID validation |

---

## 7. Exploitability Assessment

| BW Finding | Severity | Exploitability | Exploit Type | Notes |
|---|---|---|---|---|
| BW-ACTORS-001 | HIGH | Confirmed | Single-step | viewerActorId truthy-check only — any non-null string elevates filter to 'all'; current callers source from session but no contract enforced |
| BW-ACTORS-002 | HIGH | Confirmed | Single-step | assertActorId(null) passes silently — null actor IDs bypass the utility validator; callers relying on this for null-checking are unprotected |
| BW-ACTORS-003 | MEDIUM | Probable | Single-step | ctrlSearchResults (explore/controller/searchResults.controller.js:9) calls searchDal with empty opts `{}` — passes viewerActorId: null always; authenticated users do not get 'all' filter visibility in explore search results |
| BW-ACTORS-004 | MEDIUM | Theoretical | Multi-step | Hydration store accepts non-UUID keys; poisoning requires XSS but TTL window is 5min |
| BW-ACTORS-005 | LOW | INFO | N/A | BEHAVIOR.md is PLACEHOLDER — all §9 invariants unanchored; governance gap |

---

## 8. Source Verification Summary

| Finding | Source File | Line(s) | Verification Status |
|---|---|---|---|
| BW-ACTORS-001 | apps/VCSM/src/features/actors/dal/searchActors.dal.js | 9 | SOURCE_VERIFIED |
| BW-ACTORS-001 (caller) | apps/VCSM/src/features/settings/privacy/controller/Blocks.controller.js | 54–58 | SOURCE_VERIFIED |
| BW-ACTORS-002 | apps/VCSM/src/state/actors/assertActorId.js | 4–6 | SOURCE_VERIFIED |
| BW-ACTORS-003 | apps/VCSM/src/features/explore/controller/searchResults.controller.js | 9 | SOURCE_VERIFIED |
| BW-ACTORS-004 | engines/hydration/src/store.js | 47–50 | SOURCE_VERIFIED |
| BW-ACTORS-005 | ZZnotforproduction/APPS/VCSM/features/actors/BEHAVIOR.md | — | SOURCE_VERIFIED (file is PLACEHOLDER) |

---

## 9. Confidence Summary

| Finding | Confidence | Provenance |
|---|---|---|
| BW-ACTORS-001 | HIGH | SOURCE_VERIFIED — explicit line trace from hook to DAL |
| BW-ACTORS-002 | HIGH | SOURCE_VERIFIED — code read confirms null passes the guard |
| BW-ACTORS-003 | MEDIUM | SOURCE_VERIFIED — confirmed empty opts in controller |
| BW-ACTORS-004 | MEDIUM | SOURCE_VERIFIED — store logic confirmed; exploit requires XSS |
| BW-ACTORS-005 | HIGH | SOURCE_VERIFIED — BEHAVIOR.md is a stub |

---

## 10. §9 Invariant Attack Map

| Invariant | Status | Attack | Outcome |
|---|---|---|---|
| INFERRED-1: Private actors must not appear to null viewers | HELD | Pass null viewerActorId to DAL | BLOCKED — filter='public' enforced at dal line 9 |
| INFERRED-2: Filter must be viewer-session-bound | UNANCHORED | Pass arbitrary truthy string as viewerActorId | PARTIAL — truthy check only; UUID validation absent |
| INFERRED-3: Block search must include all actor visibility tiers for the viewer | VIOLATED | Call ctrlSearchActors without viewerActorId | BYPASSED — private actors excluded from victim's block search |
| INFERRED-4: assertActorId must reject null | UNANCHORED | Pass null to assertActorId | BYPASSED — null passes silently at line 4 |

**All §9 invariants are UNANCHORED due to BEHAVIOR.md PLACEHOLDER status.**

---

## 11. Behavior Contract Attack Summary

BEHAVIOR.md Status: **PLACEHOLDER**

All attack targets in this section are source-inferred. The absence of a behavior contract means:
- No official §4 Failure Paths exist to test against
- No official §9 Must Never Happen invariants have been declared
- Any bypass found in this review cannot be formally classified as a contract violation

**Source-inferred violations**:
1. BW-ACTORS-001 — The canonical block search path violates the implied invariant that a
   logged-in user should be able to find and block any actor. The ctrlSearchActors function
   drops the viewerActorId, causing private actors to be invisible to the blocker.
2. BW-ACTORS-002 — assertActorId does not protect callers from null actor IDs. Any caller
   treating it as a null guard is silently unprotected.

---

## 12. THOR Impact

| Finding | THOR Blocker | Reason |
|---|---|---|
| BW-ACTORS-001 | YES | Safety-critical: users cannot block private actors; exploitable via block search |
| BW-ACTORS-002 | NO | Engineering quality issue; no immediate exploit chain without caller error |
| BW-ACTORS-003 | NO | Visibility degradation for authenticated explore users; not a data exposure |
| BW-ACTORS-004 | NO | Theoretical; requires XSS prerequisite |
| BW-ACTORS-005 | NO | Governance gap; no runtime impact |

**Pre-existing THOR blockers from VENOM**:
- VEN-ACTORS-001: OPEN — same root as BW-ACTORS-001 (confirms and extends finding)

**BW-ACTORS-001 is additive evidence for the existing THOR blocker VEN-ACTORS-001.**

---

## 13. SPIDER-MAN Test Requirements

The following regression tests should be written to prevent future bypasses:

| Test | Priority | Description |
|---|---|---|
| TEST-ACTORS-BW-001 | HIGH | `ctrlSearchActors` with an authenticated actorId — assert viewerActorId is forwarded to searchActorsAdapter |
| TEST-ACTORS-BW-002 | HIGH | `searchActorsDAL` with null viewerActorId — assert p_filter is 'public' |
| TEST-ACTORS-BW-003 | HIGH | `searchActorsDAL` with valid viewerActorId — assert p_filter is 'all' |
| TEST-ACTORS-BW-004 | MEDIUM | `assertActorId(null)` — assert that null is either silently handled or explicitly documented as intentional |
| TEST-ACTORS-BW-005 | MEDIUM | `ctrlSearchResults` called without viewerActorId — document that authenticated users receive public-filtered results |
| TEST-ACTORS-BW-006 | LOW | Hydration store `upsertActors` — assert non-UUID key strings are rejected or sanitized |
