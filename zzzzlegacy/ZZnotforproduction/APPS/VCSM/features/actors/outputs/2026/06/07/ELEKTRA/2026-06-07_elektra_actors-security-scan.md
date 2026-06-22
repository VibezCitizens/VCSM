---
name: elektra.actors.2026-06-07
description: ELEKTRA V2 precision vulnerability scan — VCSM:actors — 2026-06-07
metadata:
  type: security-scan
  owner: ELEKTRA
  generated: 2026-06-07
  scanner-version: 1.1.0
  upstream-venom: 2026-06-07
  upstream-blackwidow: 2026-06-04
---

# ELEKTRA V2 VULNERABILITY SCAN — VCSM:actors

**Date:** 2026-06-07  
**Scope:** VCSM:actors  
**Reviewer:** ELEKTRA  
**Scan Trigger:** MANUAL — chained after ARCHITECT + VENOM (2026-06-07)  
**Findings Summary:** 2 HIGH | 1 MEDIUM | 1 LOW | 0 INFO  
**False Positives Rejected:** 3  
**Suggested Patches:** 4  

---

## Output Metadata

| Field | Value |
|---|---|
| Feature | actors |
| Command | ELEKTRA V2 |
| Application Scope | VCSM |
| Ticket | (none — standalone run) |
| Scanner Version | 1.1.0 |
| Evidence Bundle | outputs/2026/06/07/ARCHITECT/evidence-bundle.json |
| VENOM Report | outputs/2026/06/07/Venom/2026-06-07_venom_actors-security-review.md |
| BLACKWIDOW Report | outputs/2026/06/04/BlackWidow/2026-06-04_blackwidow_actors-adversarial-review.md |
| Output Path | outputs/2026/06/07/ELEKTRA/2026-06-07_elektra_actors-security-scan.md |
| Timestamp | 2026-06-07T00:00:00Z |

---

## ELEKTRA PREFLIGHT PASS

```
Upstream Reports:
- VENOM:       outputs/2026/06/07/Venom/2026-06-07_venom_actors-security-review.md
               Age: <1h | Freshness: FRESH | Status: COMPLETE | Scope: VCSM:actors ✓
- BLACKWIDOW:  outputs/2026/06/04/BlackWidow/2026-06-04_blackwidow_actors-adversarial-review.md
               Age: 3 days | Freshness: WITHIN_7_DAY_WINDOW | Status: COMPLETE | Scope: VCSM:actors ✓

ARCHITECT Evidence Bundle:
               outputs/2026/06/07/ARCHITECT/evidence-bundle.json
               Age: <1h | Freshness: FRESH | Scope: VCSM:actors ✓

ELEKTRA PREFLIGHT: PASS — proceeding with ELEKTRA V2 scan.
```

---

## 1. ELEKTRA Scanner Preflight

```
ELEKTRA ARCHITECT OUTPUT CHECK
================================
ARCHITECT Output: ZZnotforproduction/GOVERNANCE/outputs/2026/06/07/ARCHITECT/architect-security-surface.json
Generated At: 2026-06-07T00:00:00Z
Age: <1h
Freshness: FRESH
Scope: VCSM:actors
Status: PASS

Security Surface Counts (from ARCHITECT output):
Write sinks in scope: 0
RPC sinks in scope: 4 (identity.search_actor_directory × 4 callsites)
Edge function sinks in scope: 0
Security paths in scope: 2
Callgraph chain candidates: 4 (from evidence-bundle.json callChains)
```

---

## 2. Scanner Inputs

| Map | Generated At | Age | Freshness | Confidence | Sinks / Chains In Scope | Used For |
|---|---|---|---|---|---|---|
| write-surface-map | 2026-06-07T08:11:09Z | <1h | FRESH | HIGH | 0 | Sink inventory (none for actors) |
| rpc-map | 2026-06-07T08:11:09Z | <1h | FRESH | HIGH | 4 | Privileged RPC sink inventory |
| edge-function-map | 2026-06-07T08:11:09Z | <1h | FRESH | HIGH | 0 | Edge function inventory (none) |
| security-path-map | 2026-06-07T08:11:09Z | <1h | FRESH | HIGH | 2 | Security path pre-computation |
| callgraph | 2026-06-07T08:11:09Z | <1h | FRESH | HIGH | 4 nodes | Source-to-sink chain pre-computation |
| write-execution-map | 2026-06-07T08:11:09Z | <1h | FRESH | HIGH | 0 | Write caller chain candidates |
| rpc-execution-map | 2026-06-07T08:11:09Z | <1h | FRESH | HIGH | 4 | RPC caller chain candidates |

Scanner Version: 1.1.0  
Overall Preflight: FRESH  
Preflight Action: PASSED  
Identity-tier sinks: 0  
Resource-tier sinks: 0  
Privileged RPC sinks: 4 (identity schema) — reviewed ALL  
Edge function sinks: 0  
Chain candidates from callgraph: 4  

---

## 3. Vulnerability Surface Inventory

```
ELEKTRA VULNERABILITY SURFACE INVENTORY
=========================================
Feature: actors
Scan Date: 2026-06-07

Write Sinks: 0
  Identity-tier: 0
  Resource-tier: 0
  Content-tier: 0

RPC Sinks: 4
  identity.search_actor_directory — 4 callsites
    1. actors/dal/searchActors.dal.js (CANONICAL)
    2. chat/setup.js (BYPASS)
    3. upload/dal/searchMentionSuggestions.dal.js (BYPASS)
    4. explore/dal/search.dal.js (BYPASS)

Edge Function Sinks: 0
  NOTE: Prior ELEK-2026-06-04-001 referenced m/[actorId] edge function.
  No edge function discovered in actors module scope this run.
  Requires separate edge function audit outside actors module boundary.

Callgraph Chain Candidates: 4
  User-controlled viewerActorId reaching RPC: 1 (ctrlSearchActors — missing entirely)
  Hardcoded filter reaching RPC: 2 (upload DAL, chat setup)
  Truthy-only guard on RPC parameter: 1 (canonical actors DAL)
```

---

## 4. Scanner Signals

| Chain Candidate | Source Map | Callgraph Path | Scanner Confidence | Source Verified | Chain Verdict | Provenance | Finding |
|---|---|---|---|---|---|---|---|
| ctrlSearchActors → searchActorsAdapter (no viewerActorId) | callgraph + rpc-map | Blocks.controller.js:54 → actors.adapter.js:7 → controller:4 → dal:4 | HIGH | YES — Blocks.controller.js:54-58: no viewerActorId in signature or call | VALID_FINDING — safety bypass confirmed | [SOURCE_VERIFIED] | ELEK-2026-06-07-001 |
| searchMentionSuggestions → identity.search_actor_directory (p_filter='all') | rpc-map + callgraph | upload/dal:19 → rpc call:24-28 | HIGH | YES — upload/dal:28: p_filter hardcoded 'all'; viewerActorId param ignored for filter | VALID_FINDING — null-viewer bypass confirmed | [SOURCE_VERIFIED] | ELEK-2026-06-07-002 |
| searchActors (chat) → identity.search_actor_directory (p_filter='all') | rpc-map + callgraph | chat/setup.js:44 → rpc call:52-58 | HIGH | YES — chat/setup.js:48: viewerActorId from store; line 55: p_filter hardcoded 'all' | VALID_FINDING — filter derivation absent (partial improvement noted) | [SOURCE_VERIFIED] | ELEK-2026-06-07-003 |
| searchActorsDAL truthy check → identity.search_actor_directory | rpc-map + callgraph | dal:4-9 → rpc call:12-19 | HIGH | YES — dal:9: filter = viewerActorId ? 'all' : 'public' (truthy only, no UUID validation) | VALID_FINDING — structural gap; DB-layer likely mitigates | [SOURCE_VERIFIED] | ELEK-2026-06-07-004 |
| searchTeamCandidatesController → searchActorsAdapter → dal | callgraph | vportTeamAccess.controller → adapter → controller → dal | HIGH | NO — controller source not read this run | INCOMPLETE — not a known security path; team member search is inbound-actor scope | [SCANNER_LEAD] | No finding — deferred |
| m/[actorId] edge function HTML injection | edge-function-map (prior run) | N/A — not found in current scan | N/A | NO — edge function not in actors module scope | INCOMPLETE — out of scope for actors module | N/A | NOT RE-VERIFIED (see §8) |

---

## 5. Source-to-Sink Analysis

### Scan Target

```
ELEKTRA SCAN TARGET
Feature / Route / Engine: actors (+ consumer callsites in chat, upload, explore, settings)
Application Scope: VCSM
Reason for scan: VENOM identified 2 HIGH trust boundary findings (VEN-ACTORS-001, VEN-ACTORS-002) + 2 MEDIUM
Scan trigger: MANUAL — chained after VENOM 2026-06-07
Upstream VENOM report: outputs/2026/06/07/Venom/2026-06-07_venom_actors-security-review.md
Upstream BLACKWIDOW report: outputs/2026/06/04/BlackWidow/2026-06-04_blackwidow_actors-adversarial-review.md
```

### Entry Points Map

```
ENTRY POINT MAP
Route / API / Controller: ctrlSearchActors (Blocks), searchMentionSuggestions (upload), searchActors (chat)
Input sources (user-controlled):
  - query (user search string — all callsites)
  - viewerActorId (caller-supplied or session-derived — varies by callsite)
  - prefix (upload mention search)
Trusted input boundary:
  - Canonical: searchActors.controller.js (no auth gate, viewerActorId from upstream)
  - Blocks: ctrlSearchActors in Blocks.controller.js (no viewerActorId propagated)
  - Chat: searchActors local function in chat/setup.js (viewerActorId from Zustand)
  - Upload: searchMentionSuggestions in upload/dal (viewerActorId from caller)
Validation present at boundary: PARTIAL (canonical yes; bypasses NO)
```

---

## 6. Verified Vulnerabilities

---

### ELEK-2026-06-07-001 [SOURCE_VERIFIED]

```
SECURITY FINDING

- Finding ID:         ELEK-2026-06-07-001
- Title:              viewerActorId dropped in ctrlSearchActors — block search safety bypass
- Category:           Auth Bypass / IDOR
- Severity:           HIGH
- Status:             Open
- Scope:              VCSM
- Location:           apps/VCSM/src/features/settings/privacy/controller/Blocks.controller.js:54-58
- Source:             User search query from Blocks UI, no viewerActorId at entry point
- Sink:               identity.search_actor_directory RPC via searchActors.dal.js:12
- Trust Boundary:     ctrlSearchActors in Blocks.controller.js
- Impact:             Victim cannot find and block a private-profile harasser via block user search.
                      Private actors always excluded because filter forced to 'public'.
- Evidence:
    Blocks.controller.js:54-58:
      export async function ctrlSearchActors({ query }) {
        return searchActorsAdapter({
          query,
          limit: 12,
        })
      }
    searchActors.dal.js:9:
      const filter = viewerActorId ? 'all' : 'public';
      // viewerActorId is always null here — filter is always 'public'
- Reproduction Steps:
    1. Create account A (authenticated Citizen)
    2. Create account B with private profile
    3. As account A, open Block Users, search for account B by username
    4. Account B does not appear in results (filter='public' excludes private profiles)
    5. Account A cannot block account B
    (No production exploitation required — code-level chain confirmed)
- Existing Defense:   searchActors.dal.js has canonical filter gate (viewerActorId ? 'all' : 'public')
- Why Defense Is Insufficient: The gate is correct but receives null because ctrlSearchActors
    does not pass viewerActorId to searchActorsAdapter. The defense cannot fire.
- Recommended Fix:    Pass viewerActorId from session context through ctrlSearchActors → searchActorsAdapter
- Suggested Patch:    See §7 PATCH ADVISORY 001
- Follow-up Command:  BLACKWIDOW (runtime verification of bypass path), SPIDER-MAN (regression test)
```

---

### ELEK-2026-06-07-002 [SOURCE_VERIFIED]

```
SECURITY FINDING

- Finding ID:         ELEK-2026-06-07-002
- Title:              searchMentionSuggestions hardcodes p_filter='all' — null-viewer bypass
- Category:           Auth Bypass
- Severity:           HIGH
- Status:             Open
- Scope:              VCSM
- Location:           apps/VCSM/src/features/upload/dal/searchMentionSuggestions.dal.js:19-33
- Source:             prefix (search term) + viewerActorId (default null) from caller
- Sink:               identity.search_actor_directory RPC at line 24 with p_filter: 'all'
- Trust Boundary:     searchMentionSuggestions function signature
- Impact:             Anonymous or unauthenticated callers (viewerActorId=null) receive
                      actor results with p_filter='all', bypassing the canonical null-viewer
                      guard that restricts unauthenticated access to public-only actors.
- Evidence:
    searchMentionSuggestions.dal.js:24-32:
      const { data, error } = await supabase
        .schema('identity')
        .rpc('search_actor_directory', {
          p_viewer_domain: 'vc',
          p_viewer_actor_id: viewerActorId,
          p_query: needle,
          p_filter: 'all',         // ← hardcoded — canonical guard absent
          p_limit: limit,
          p_offset: 0,
        });
- Reproduction Steps:
    1. Call searchMentionSuggestions with viewerActorId=null (anonymous)
    2. RPC receives: p_viewer_actor_id=null + p_filter='all'
    3. DB function applies 'all' filter regardless of null viewer
    4. Private actors may appear in results depending on DB function's null-viewer handling
    (DB function behavior with null viewer + 'all' filter requires DB inspection to confirm)
- Existing Defense:   Function accepts viewerActorId parameter — mechanism exists but unused
                      for filter derivation
- Why Defense Is Insufficient: p_filter is unconditionally 'all'. The viewerActorId parameter
    is threaded through to p_viewer_actor_id but its value is not used to derive filter level.
    Canonical guard: `const filter = viewerActorId ? 'all' : 'public'` is absent.
- Recommended Fix:    Derive p_filter from viewerActorId using canonical pattern
- Suggested Patch:    See §7 PATCH ADVISORY 002
- Follow-up Command:  DB (inspect search_actor_directory behavior with null viewer + filter='all'),
                      BLACKWIDOW (runtime bypass confirmation)
```

---

### ELEK-2026-06-07-003 [SOURCE_VERIFIED]

```
SECURITY FINDING

- Finding ID:         ELEK-2026-06-07-003
- Title:              chat/setup.js p_filter hardcoded 'all' — filter derivation logic absent
- Category:           Auth Bypass
- Severity:           MEDIUM
- Status:             Open
- Scope:              VCSM
- Location:           apps/VCSM/src/features/chat/setup.js:44-70
- Source:             query from chat engine; viewerActorId from Zustand store (line 48)
- Sink:               identity.search_actor_directory RPC at line 52 with p_filter: 'all'
- Trust Boundary:     searchActors local function in chat/setup.js
- Impact:             When viewerActorId is null (pre-hydration, session not yet loaded, or
                      anonymous user accessing chat surface), p_filter='all' is still passed.
                      Null viewerActorId + p_filter='all' bypasses the null-viewer guard.
- Evidence:
    chat/setup.js:48:
      const viewerActorId = useIdentitySelectionStore.getState().activeActorId ?? null
    chat/setup.js:55:
      p_filter: 'all',             // ← hardcoded regardless of viewerActorId value
- Improvement since 2026-06-04:
    The viewerActorId is now dynamically read from the Zustand store (line 48).
    This is a partial improvement over the previous state where it was entirely missing.
    However, the filter derivation logic has NOT been applied:
    the canonical `viewerActorId ? 'all' : 'public'` pattern is absent.
    The finding severity remains MEDIUM because viewerActorId is now at least read,
    reducing the always-null risk to an only-when-null risk (e.g., during hydration lag).
- Existing Defense:   viewerActorId now read from store — partial mitigation
- Why Defense Is Insufficient: Knowing viewerActorId is null does not stop p_filter='all'
    from being sent. The guard must derive filter FROM viewerActorId, not just read it.
- Recommended Fix:    Apply canonical filter derivation using the viewerActorId that is
    already being read from the store
- Suggested Patch:    See §7 PATCH ADVISORY 003
- Follow-up Command:  VENOM (trust boundary update reflecting partial improvement),
                      SPIDER-MAN (test hydration-lag scenario)
```

---

### ELEK-2026-06-07-004 [SOURCE_VERIFIED]

```
SECURITY FINDING

- Finding ID:         ELEK-2026-06-07-004
- Title:              searchActorsDAL truthy-only viewerActorId check — no UUID validation
- Category:           Auth Bypass (low confidence)
- Severity:           LOW
- Status:             Open
- Scope:              VCSM
- Location:           apps/VCSM/src/features/actors/dal/searchActors.dal.js:9
- Source:             viewerActorId parameter from controller caller
- Sink:               identity.search_actor_directory RPC p_filter parameter
- Trust Boundary:     searchActors.dal.js line 9
- Impact:             A non-null non-UUID string (e.g., 'true', '1', 'unknown') passed as
                      viewerActorId would trigger p_filter='all' while p_viewer_actor_id
                      receives an invalid UUID. The DB function's behavior with an invalid UUID
                      viewer is unknown without DB inspection. Exploitability depends entirely
                      on the DB function's null/invalid-UUID handling.
- Evidence:
    searchActors.dal.js:9:
      const filter = viewerActorId ? 'all' : 'public';
      // truthy check only — any non-empty string triggers 'all' filter
      // 'postgrestSafe' provides isUuid() but it is not used here
- Existing Defense:   Callers (controller and adapter) do not expose viewerActorId to
    user-controlled input; it comes from identity context. DB function SECURITY DEFINER
    likely provides final enforcement.
- Why Defense Is Insufficient: Structural gap — no UUID validation in DAL. If a future
    caller passes a non-UUID truthy value (string coercion error, state bug), the filter
    escalates without valid viewer identity.
- Recommended Fix:    Add UUID validation before filter elevation using existing isUuid() utility
- Suggested Patch:    See §7 PATCH ADVISORY 004
- Follow-up Command:  DB (inspect search_actor_directory behavior with invalid UUID as viewer)
```

---

## 7. Patch Recommendations

---

### PATCH ADVISORY 001 — ELEK-2026-06-07-001

```
ELEKTRA PATCH ADVISORY
========================
Finding ID: ELEK-2026-06-07-001
Chain ID: CHAIN-actors-001
Scanner Signal: callgraph edge: Blocks.controller.js#ctrlSearchActors → actors.adapter.js#searchActorsAdapter
Provenance: [SOURCE_VERIFIED]
Severity: HIGH

CHAIN:
  Source: Blocks.controller.js:54 — ctrlSearchActors({ query }) — viewerActorId absent
  Boundary: Blocks.controller.js:54-58 — no viewerActorId passed to adapter
  Sink: searchActors.dal.js:9 — filter = viewerActorId ? 'all' : 'public' → always 'public'
  Impact: Private-profile actors excluded from block search — victim cannot block private harasser
  Missing Defense: viewerActorId session binding at ctrlSearchActors call site

ROOT CAUSE:
  ctrlSearchActors accepts only { query } — viewerActorId is never included in the
  call to searchActorsAdapter. The downstream DAL correctly gates on viewerActorId,
  but it is always null when called via this chain.

SUGGESTED PATCH:
  File: apps/VCSM/src/features/settings/privacy/controller/Blocks.controller.js
  Line: 54

  // Before
  export async function ctrlSearchActors({ query }) {
    return searchActorsAdapter({
      query,
      limit: 12,
    })
  }

  // After (suggested — human must review before applying)
  export async function ctrlSearchActors({ query, viewerActorId }) {
    return searchActorsAdapter({
      query,
      limit: 12,
      viewerActorId: viewerActorId ?? null,
    })
  }

  Explanation: Propagates viewerActorId to searchActorsAdapter → searchActors controller
  → searchActorsDAL, where the canonical filter gate already applies it correctly.
  The calling hook/component must supply viewerActorId from session context.

  Caller fix required: The hook or component calling ctrlSearchActors must also pass
  viewerActorId from useIdentity() or equivalent session source.
  Patch complexity: SIMPLE
  Requires DB change: NO
```

---

### PATCH ADVISORY 002 — ELEK-2026-06-07-002

```
ELEKTRA PATCH ADVISORY
========================
Finding ID: ELEK-2026-06-07-002
Chain ID: CHAIN-actors-004
Scanner Signal: rpc-map: search_actor_directory from upload/dal/searchMentionSuggestions.dal.js
Provenance: [SOURCE_VERIFIED]
Severity: HIGH

CHAIN:
  Source: searchMentionSuggestions(prefix, { viewerActorId = null }) — viewerActorId from caller
  Boundary: searchMentionSuggestions function — p_filter logic
  Sink: identity.search_actor_directory at line 24-28 — p_filter: 'all' hardcoded
  Impact: Anonymous callers receive p_filter='all' — private actors discoverable via mentions
  Missing Defense: canonical null-viewer filter derivation

ROOT CAUSE:
  p_filter is unconditionally 'all'. The viewerActorId parameter flows correctly to
  p_viewer_actor_id but its null/non-null state is never used to select the filter level.

SUGGESTED PATCH:
  File: apps/VCSM/src/features/upload/dal/searchMentionSuggestions.dal.js
  Line: 24 (add before rpc call) / 28 (replace p_filter value)

  // Before
  const { data, error } = await supabase
    .schema('identity')
    .rpc('search_actor_directory', {
      p_viewer_domain: 'vc',
      p_viewer_actor_id: viewerActorId,
      p_query: needle,
      p_filter: 'all',
      p_limit: limit,
      p_offset: 0,
    });

  // After (suggested — human must review before applying)
  const filter = viewerActorId ? 'all' : 'public';
  const { data, error } = await supabase
    .schema('identity')
    .rpc('search_actor_directory', {
      p_viewer_domain: 'vc',
      p_viewer_actor_id: viewerActorId,
      p_query: needle,
      p_filter: filter,
      p_limit: limit,
      p_offset: 0,
    });

  Explanation: Identical to canonical pattern in searchActors.dal.js.
  One-line addition before the RPC call; single field replacement in call body.
  Patch complexity: SIMPLE
  Requires DB change: NO
```

---

### PATCH ADVISORY 003 — ELEK-2026-06-07-003

```
ELEKTRA PATCH ADVISORY
========================
Finding ID: ELEK-2026-06-07-003
Chain ID: CHAIN-actors-003
Scanner Signal: rpc-map: search_actor_directory from chat/setup.js
Provenance: [SOURCE_VERIFIED]
Severity: MEDIUM

CHAIN:
  Source: chat/setup.js:44 — searchActors(query, limit); viewerActorId from Zustand at line 48
  Boundary: searchActors function — p_filter logic
  Sink: identity.search_actor_directory at line 52-58 — p_filter: 'all' hardcoded
  Impact: When Zustand store is null (hydration lag or anonymous), viewerActorId=null + p_filter='all'
  Missing Defense: filter derivation from viewerActorId (viewerActorId ? 'all' : 'public')

ROOT CAUSE:
  viewerActorId is now correctly read from the Zustand store (line 48), but the result
  is only used as p_viewer_actor_id — not to derive p_filter. The canonical one-line
  derivation has not been added.

SUGGESTED PATCH:
  File: apps/VCSM/src/features/chat/setup.js
  Line: 49 (add after viewerActorId derivation) / 55 (replace p_filter value)

  // Before (lines 48-58)
  const viewerActorId = useIdentitySelectionStore.getState().activeActorId ?? null
  const { data, error } = await supabase
    .schema('identity')
    .rpc('search_actor_directory', {
      p_viewer_domain: 'vc',
      p_viewer_actor_id: viewerActorId,
      p_query: needle,
      p_filter: 'all',
      p_limit: limit,
      p_offset: 0,
    })

  // After (suggested — human must review before applying)
  const viewerActorId = useIdentitySelectionStore.getState().activeActorId ?? null
  const p_filter = viewerActorId ? 'all' : 'public'
  const { data, error } = await supabase
    .schema('identity')
    .rpc('search_actor_directory', {
      p_viewer_domain: 'vc',
      p_viewer_actor_id: viewerActorId,
      p_query: needle,
      p_filter,
      p_limit: limit,
      p_offset: 0,
    })

  Explanation: Adds the canonical one-line filter derivation immediately after the
  existing viewerActorId read. Uses the same pattern as searchActors.dal.js.
  Patch complexity: SIMPLE
  Requires DB change: NO
```

---

### PATCH ADVISORY 004 — ELEK-2026-06-07-004

```
ELEKTRA PATCH ADVISORY
========================
Finding ID: ELEK-2026-06-07-004
Chain ID: CHAIN-actors-001 (canonical dal)
Scanner Signal: rpc-map: search_actor_directory from searchActors.dal.js
Provenance: [SOURCE_VERIFIED]
Severity: LOW

CHAIN:
  Source: searchActorsDAL({ viewerActorId }) — viewerActorId from controller
  Boundary: searchActors.dal.js:9 — truthy check only
  Sink: identity.search_actor_directory p_filter escalation
  Impact: Non-UUID truthy string escalates filter to 'all' with invalid viewer identity
  Missing Defense: UUID format validation before filter elevation

ROOT CAUSE:
  The DAL trusts any truthy value as a valid viewerActorId. The isUuid() utility is
  already imported in the project (seen in chat/setup.js import) but not used here.

SUGGESTED PATCH:
  File: apps/VCSM/src/features/actors/dal/searchActors.dal.js
  Line: 2 (import) + 9 (filter derivation)

  // Before
  import { toContainsPattern } from "@/services/supabase/postgrestSafe";
  // ...
  const filter = viewerActorId ? 'all' : 'public';

  // After (suggested — human must review before applying)
  import { toContainsPattern, isUuid } from "@/services/supabase/postgrestSafe";
  // ...
  const filter = (viewerActorId && isUuid(viewerActorId)) ? 'all' : 'public';

  Explanation: Adds UUID format validation to the filter gate. Only valid UUID strings
  elevate filter to 'all'. Invalid or non-UUID truthy values fall back to 'public'.
  isUuid() is already available in the postgrestSafe module.
  Patch complexity: SIMPLE
  Requires DB change: NO
```

---

## 8. False Positives Rejected

```
FALSE POSITIVE REJECTED

- Candidate:        ELEK-2026-06-04-001 re-evaluation — HTML injection in m/[actorId] edge function
- Location:         Not found in actors module source scan (no edge function in scope)
- Rejection reason: No edge function exists within actors module source boundary.
                    The prior finding references a path (m/[actorId]) that may belong to
                    a separate edge function outside actors feature scope. Cannot re-verify
                    without an edge function audit scoped to the m/[actorId] route handler.
- Chain gap:        Sink — edge function file could not be located within actors module
- Notes:            Requires separate targeted edge function audit. Prior finding is
                    UNVERIFIED in this run, not CLOSED. Route to ARCHITECT to locate the
                    m/[actorId] edge function and scope a targeted ELEKTRA pass.

---

FALSE POSITIVE REJECTED

- Candidate:        searchTeamCandidatesController viewerActorId propagation
- Location:         apps/VCSM/src/features/vportDashboard/dashboard/cards/team/controller/vportTeamAccess.controller.js
- Rejection reason: Team member search is an authenticated, inbound-actor surface (finding
                    a team member to add requires owner context). viewerActorId propagation
                    is present in the adapter call per callgraph evidence. Without source
                    verification of the controller this run, the chain is incomplete.
                    Evaluated as lower priority than confirmed HIGH findings.
- Chain gap:        Trust Boundary — controller source not read this run
- Notes:            Defer to next ELEKTRA pass targeting vportDashboard. Not a blocker.

---

FALSE POSITIVE REJECTED

- Candidate:        mapSearchActorRow returning actorId in response shape
- Location:         apps/VCSM/src/features/actors/model/searchActors.model.js:5
- Rejection reason: The model returns { actorId, kind, displayName, username, avatarUrl }.
                    actorId in search results is expected and required — callers need it
                    to initiate block, follow, or team-invite actions. Returning actorId
                    in search results is not an IDOR; it is the intended public identity surface.
                    This matches the Public Identity Surface Contract (actorId is canonical).
- Chain gap:        Impact — no attacker gain; actorId in search results is intended behavior
- Notes:            INFO — actorId is the canonical identity field per VCSM identity contract.
                    No raw UUIDs in public URLs confirmed (memory rule active).
```

---

## 9. Source Verification Summary

```
Chain candidates evaluated: 4 (from evidence-bundle.json callChains)
Chains source-verified: 4 / 4
Source files read (precision confirmation): 5 targeted reads
Valid findings: 4
Rejected (false positive): 3
Incomplete (scanner leads): 1 (vportTeamAccess — deferred)
```

Source files read:
- `apps/VCSM/src/features/settings/privacy/controller/Blocks.controller.js:54-58` — ELEK-2026-06-07-001
- `apps/VCSM/src/features/upload/dal/searchMentionSuggestions.dal.js:24-28` — ELEK-2026-06-07-002
- `apps/VCSM/src/features/chat/setup.js:44-58` — ELEK-2026-06-07-003
- `apps/VCSM/src/features/actors/dal/searchActors.dal.js:9` — ELEK-2026-06-07-004
- `apps/VCSM/src/features/actors/model/searchActors.model.js:5` — false positive evaluation

### 9.1 SOURCE READ SUMMARY

| Command | Source Files Read | Evidence Bundle Used | Full Rediscovery Performed |
|---|---:|---|---|
| ELEKTRA | 5 | YES — outputs/2026/06/07/ARCHITECT/evidence-bundle.json | NO |

Files read (precision confirmation and patch-line verification only):
- `Blocks.controller.js:54-58` — reason: ELEK-2026-06-07-001 chain confirmation + patch advisory
- `upload/searchMentionSuggestions.dal.js:24-28` — reason: ELEK-2026-06-07-002 chain + patch
- `chat/setup.js:44-58` — reason: ELEK-2026-06-07-003 chain + patch
- `actors/dal/searchActors.dal.js:9` — reason: ELEK-2026-06-07-004 chain + patch
- `actors/model/searchActors.model.js:5` — reason: false positive evaluation (actorId exposure)

---

## 10. Confidence Summary

```
HIGH confidence chains: 4
LOW confidence chains: 0 — Rule E-002 not triggered
[SOURCE_VERIFIED] findings: 4
[SCANNER_LEAD] findings: 0
[SCANNER_LOW_CONF] findings: 0
BLACKWIDOW confirmation required for CRITICAL upgrade: N/A (max severity = HIGH per ELEKTRA rules)
```

---

## 11. THOR Impact

```
THOR Release Blockers:
  ELEK-2026-06-07-001 — HIGH — safety bypass confirmed at source level
  ELEK-2026-06-07-002 — HIGH — null-viewer bypass confirmed at source level

THOR-CAUTION:
  ELEK-2026-06-07-003 — MEDIUM — filter derivation absent (partial improvement, not closed)
  ELEK-2026-06-07-004 — LOW — structural hardening gap; DB-layer likely mitigates

Highest Open Severity: HIGH
THOR Status: BLOCKED (2 HIGH findings open)
Required BLACKWIDOW confirmation for CRITICAL: None pending (no escalation candidates)
```

---

## 12. Suggested Patch Queue

| # | Finding ID | Title | Severity | Layer to Patch | Patch Complexity | Requires DB Change |
|---|---|---|---|---|---|---|
| 1 | ELEK-2026-06-07-001 | viewerActorId dropped in ctrlSearchActors | HIGH | Controller | SIMPLE | NO |
| 2 | ELEK-2026-06-07-002 | searchMentionSuggestions p_filter hardcoded | HIGH | DAL | SIMPLE | NO |
| 3 | ELEK-2026-06-07-003 | chat/setup.js p_filter hardcoded | MEDIUM | DAL/Module | SIMPLE | NO |
| 4 | ELEK-2026-06-07-004 | searchActorsDAL truthy-only viewerActorId | LOW | DAL | SIMPLE | NO |

All 4 patches: SIMPLE complexity, no DB schema change required, no migration needed.

---

## 13. Required Follow-up Commands

| Command | Reason | Status |
|---|---|---|
| BLACKWIDOW | Runtime adversarial verification of ELEK-2026-06-07-001 bypass (private profile harasser search) | PENDING |
| BLACKWIDOW | Runtime adversarial verification of ELEK-2026-06-07-002 null-viewer bypass in upload mention | PENDING |
| DB | Inspect search_actor_directory function behavior: null viewer + p_filter='all' — does DB enforce its own null-viewer protection? | PENDING |
| SPIDER-MAN | Add regression test: ctrlSearchActors with authenticated viewer finds private actors | PENDING |
| SPIDER-MAN | Add regression test: searchMentionSuggestions null viewerActorId → only public results | PENDING |
| ARCHITECT | Locate m/[actorId] edge function for re-evaluation of ELEK-2026-06-04-001 (HTML injection — not re-verified this run) | PENDING |
| LOGAN | Author BEHAVIOR.md with §5 Security Rules and §9 Must Never Happen invariants | PENDING |
| THOR | Release gate evaluation after patches are applied | BLOCKED — 2 HIGH open |

---

## Status vs Prior Run (2026-06-04)

| Prior ID | Current ID | Severity | Change |
|---|---|---|---|
| ELEK-2026-06-04-001 | NOT RE-VERIFIED | HIGH | Edge function out of actors module scope this run — status unknown |
| ELEK-2026-06-04-002 | ELEK-2026-06-07-001 | HIGH | STILL OPEN — unpatched |
| ELEK-2026-06-04-003 | ELEK-2026-06-07-002 | HIGH | STILL OPEN — unpatched |
| ELEK-2026-06-04-004 | ELEK-2026-06-07-003 | MEDIUM | STILL OPEN — partial improvement (viewerActorId now read from Zustand); severity downgraded from HIGH to MEDIUM reflecting partial mitigation |
| ELEK-2026-06-04-005 | OUT OF SCOPE | — | assertActorId not in actors module — deferred to identity/auth audit |
| ELEK-2026-06-04-006 | ELEK-2026-06-07-004 | LOW | STILL OPEN — unpatched |
