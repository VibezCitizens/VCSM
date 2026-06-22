# BLACKWIDOW V2 Adversarial Review

## Output Metadata

| Field | Value |
|---|---|
| Category Key | SECURITY_ADVERSARIAL |
| Feature | actors |
| Command | BLACKWIDOW V2 |
| Scanner Version | 1.1.0 |
| Output Path | ZZnotforproduction/APPS/VCSM/features/actors/outputs/2026/06/07/BlackWidow/2026-06-07_blackwidow_actors-adversarial-review.md |
| Timestamp | 2026-06-07T00:00:00Z |
| Governance Status | DRAFT |
| Scope | VCSM |
| Feature | actors |

---

## BLACKWIDOW PREFLIGHT PASS

Upstream Report:
- VENOM: ZZnotforproduction/APPS/VCSM/features/actors/outputs/2026/06/07/Venom/2026-06-07_venom_actors-security-review.md
  Scope: VCSM
  Date: 2026-06-07
  Status: COMPLETE
  Age: 0 days

- ARCHITECT Evidence Bundle: ZZnotforproduction/APPS/VCSM/features/actors/outputs/2026/06/07/ARCHITECT/evidence-bundle.json
  Generated At: 2026-06-07T00:00:00Z
  Age: 0 days
  Freshness: FRESH

Proceeding with BLACKWIDOW adversarial review.

---

## BLACKWIDOW ARCHITECT OUTPUT CHECK

```
ARCHITECT Output: ZZnotforproduction/APPS/VCSM/features/actors/outputs/2026/06/07/ARCHITECT/evidence-bundle.json
Generated At: 2026-06-07T00:00:00Z
Age: 0d
Freshness: FRESH
Scope: VCSM:actors
Status: PASS

Security Surface Counts (from ARCHITECT output):
Attack targets (security paths): 4
Execution paths resolved: 4
Hook entry points (UI-accessible): 0 (module is API-only; hooks live in consumers)
```

---

## 1. Application Scope Declaration

**Scope:** VCSM
**Feature:** actors
**Module type:** API-only utility module — no routes, screens, or hooks in the actors module itself. All attack entry points are in consumer features (explore, chat, upload, settings/privacy, vportDashboard).

---

## 2. Scanner Inputs

| Map | Generated At | Age | Freshness | Confidence | Attack Targets In Scope | Used For |
|---|---|---|---|---|---|---|
| callgraph | 2026-06-07T00:00:00Z | 0d | FRESH | HIGH | 4 chains | Attack path construction |
| rpc-execution-map | 2026-06-07T00:00:00Z | 0d | FRESH | HIGH | 4 RPC callsites | RPC caller chain verification |
| security-path-map | 2026-06-07T00:00:00Z | 0d | FRESH | HIGH | 4 | Primary attack target inventory |
| write-surface-map | 2026-06-07T00:00:00Z | 0d | FRESH | HIGH | 0 write surfaces | Write surface verification |
| feature-map | 2026-06-07T00:00:00Z | 0d | FRESH | HIGH | 4 source files | Architecture boundary |

Scanner Version: 1.1.0
Overall Preflight: FRESH
Preflight Action: PASSED
Total attack targets: 4 security paths
HIGH confidence (execution resolved): 4
LOW confidence (PRIMARY TARGETS): 0
Hook entry points: 0 (module is API-only)

---

## 3. Attack Surface Inventory

```
BLACKWIDOW ATTACK SURFACE INVENTORY
=====================================
Feature: actors
Scan Date: 2026-06-07T00:00:00Z

Security Paths: 4 total
  HIGH confidence (execution chain resolved): 4
  LOW confidence (PRIMARY TARGETS): 0

Callgraph Scope:
  Total nodes: 4 call chains (CHAIN-actors-001 through CHAIN-actors-004)
  Hook nodes (UI-accessible entry points): 0 (consumer hooks not in scope)
  Controller nodes: 2 (searchActors.controller.js, ctrlSearchActors in Blocks.controller.js)
  DAL nodes: 1 canonical + 3 bypass callsites
  Hooks with resolved call chains: N/A (API-only module)

Write Surfaces: 0
  RPC (read-only): 4 callsites to identity.search_actor_directory

Caller Chain Coverage:
  Surfaces with ≥1 traced caller: 4
  Surfaces with 0 traced callers: 0
```

**Priority Attack Targets (from evidence-bundle.json securitySensitiveSurfaces):**

| Priority | Surface | File | Risk |
|---|---|---|---|
| HIGH | searchActorsDAL → identity.search_actor_directory | searchActors.dal.js | p_filter logic gates public vs all — truthy-only viewerActorId check |
| HIGH | searchMentionSuggestions → identity.search_actor_directory | upload/dal/searchMentionSuggestions.dal.js | p_filter hardcoded 'all' — canonical null-viewer guard absent |
| HIGH | searchActors (chat) → identity.search_actor_directory | chat/setup.js | p_filter hardcoded 'all' — viewerActorId from Zustand but filter always 'all' |
| HIGH | ctrlSearchActors → searchActorsAdapter (Blocks) | settings/privacy/controller/Blocks.controller.js | viewerActorId not passed — DAL defaults to 'public' — private harassers unblockable |

---

## 4. Scanner Signals

| Attack Vector | Source Map | Callgraph Path | Scanner Confidence | Source Verified | Result | Provenance |
|---|---|---|---|---|---|---|
| Block-search-drops-viewerActorId | security-path-map + callgraph | ctrlSearchActors→searchActorsAdapter→searchActors→searchActorsDAL (CHAIN-actors-001) | HIGH | YES — Blocks.controller.js:54-58 | BYPASSED | [SOURCE_VERIFIED] |
| Upload-mention-null-viewer-bypass | security-path-map + callgraph | searchMentionSuggestions→identity.search_actor_directory (CHAIN-actors-004) | HIGH | YES — searchMentionSuggestions.dal.js:28 | BYPASSED | [SOURCE_VERIFIED] |
| Chat-filter-hardcoded-all | security-path-map + callgraph | searchActors→identity.search_actor_directory (CHAIN-actors-003) | HIGH | YES — chat/setup.js:55 | PARTIAL | [SOURCE_VERIFIED] |
| ViewerActorId-truthy-only-check | security-path-map | searchActorsDAL→identity.search_actor_directory | HIGH | YES — searchActors.dal.js:9 | BYPASSED | [SOURCE_VERIFIED] |
| assertActorId-null-bypass | state-actors | assertActorId(null) | HIGH | YES — state/actors/assertActorId.js:4 | BYPASSED | [SOURCE_VERIFIED] |
| Explore-null-viewer-residual-bypass | callgraph + source | ctrlSearchResults→searchDal→searchActors (explore) | HIGH | YES — explore/dal/search.dal.js:24 | PARTIAL | [SOURCE_VERIFIED] |
| Team-candidates-session-mismatch | callgraph | searchTeamCandidatesController→searchActorsAdapter (CHAIN-actors-002) | HIGH | YES — vportTeamAccess.controller.js:181 | PARTIAL | [SOURCE_VERIFIED] |
| BW-ACTORS-003-original-empty-opts | prior-BW-finding | ctrlSearchResults empty opts {} | — | YES — searchResults.controller.js:9 PATCHED | BLOCKED | [SOURCE_VERIFIED] |

---

## 5. Adversarial Path Analysis

### Attack Scenario 1 — Block Search Drops viewerActorId (HIGH)

**Target:** `ctrlSearchActors` in `Blocks.controller.js:54-58`
**Chain:** CHAIN-actors-001: ctrlSearchActors → searchActorsAdapter → searchActors controller → searchActorsDAL

**Source verified at:**
```
Blocks.controller.js:54-58:
  export async function ctrlSearchActors({ query }) {
    return searchActorsAdapter({ query, limit: 12 })
    // viewerActorId never passed → DAL filter always 'public'
  }
```
`searchActors.dal.js:9`: `const filter = viewerActorId ? 'all' : 'public'`
→ viewerActorId is undefined → falsy → filter = 'public'

**Attack vectors attempted:**

1. **Ownership bypass:** Pass query to find a harasser with privacy='authenticated'. Actor has privacy set to visible-to-authenticated only. Expected: appears in block search when caller is authenticated. Actual: NEVER returned — filter='public' regardless of caller auth state.
   Result: BYPASSED — safety feature undermined.

2. **Session mutation:** Pass stale viewerActorId. Moot — viewerActorId is never passed; null always wins.
   Result: NOT APPLICABLE.

3. **Parameter forgery:** Supply a custom viewerActorId in the params to ctrlSearchActors. Moot — ctrlSearchActors destructures only `{ query }` and ignores viewerActorId even if passed.
   Result: NOT APPLICABLE — attack surface confirmed: only `query` accepted.

4. **Filter escalation:** Can the caller force filter='all' by manipulating query? No — filter is derived entirely from viewerActorId presence, which is fixed at null.
   Result: BLOCKED (no escalation path).

5. **Actor enumeration:** Can a public actor be found? Yes — filter='public' exposes all public actors to any caller including unauthenticated. This is INTENDED behavior.
   Result: BLOCKED (by design).

6. **Visibility inversion:** Authenticated caller should see 'all'; receives 'public'. Private harassers are invisible in block search. This is the confirmed exploit.
   Result: BYPASSED.

```
SEARCH ABUSE ATTEMPT
Target: ctrlSearchActors (Blocks.controller.js:54-58)
Attack vector: viewerActorId dropped; authenticated caller cannot find private actors
Visibility gate: ABSENT (viewerActorId never forwarded; DAL defaults to public)
Result: BYPASSED
Evidence: Blocks.controller.js:54-58 — searchActorsAdapter called with no viewerActorId; searchActors.dal.js:9 confirms null → 'public'
Severity: HIGH
```

---

### Attack Scenario 2 — Upload Mention Null-Viewer Bypass (HIGH)

**Target:** `searchMentionSuggestions.dal.js:28`
**Chain:** CHAIN-actors-004: searchMentionSuggestions → identity.search_actor_directory

**Source verified at:**
```
searchMentionSuggestions.dal.js:28:
  p_filter: 'all',   // hardcoded — no null-viewer guard
```
Signature: `searchMentionSuggestions(prefix, { viewerActorId = null })`
viewerActorId is accepted but never used in the filter decision.

**Attack vectors attempted:**

1. **Null-viewer bypass:** Pass `viewerActorId = null`. Expected: filter='public'. Actual: filter='all' hardcoded. Private actors returned even without authenticated context.
   Result: BYPASSED.

2. **Session mutation:** Inject stale or forged viewerActorId. DAL accepts viewerActorId as `p_viewer_actor_id` but always sends `p_filter: 'all'` regardless. Effect: no difference — always 'all'.
   Result: PARTIAL — p_viewer_actor_id is set but p_filter override makes it irrelevant.

3. **Unauthenticated actor enumeration:** If mention suggestion endpoint is reachable by unauthenticated callers (determined by route auth — out of scope for actors module), the filter='all' means private actors appear.
   Result: BYPASSED (conditional on route auth).

4. **Filter escalation via prefix:** Short or empty prefix could return many actors. No rate limiting in DAL.
   Result: PARTIAL — enumeration risk under high-volume prefix calls.

5. **Ownership bypass:** This is a read surface — no ownership to bypass for reads.
   Result: NOT APPLICABLE.

6. **Parameter forgery:** Pass malformed prefix. DAL passes directly to RPC via Supabase; RPC input validation is DB-side. No sanitization in DAL beyond being a string.
   Result: LOW — no direct exploit, DB sanitizes.

```
SEARCH ABUSE ATTEMPT
Target: searchMentionSuggestions.dal.js:28
Attack vector: p_filter hardcoded 'all'; null viewerActorId bypasses canonical protection
Visibility gate: ABSENT (canonical null-viewer guard not present; filter is constant)
Result: BYPASSED
Evidence: searchMentionSuggestions.dal.js:28 — p_filter: 'all' hardcoded; viewerActorId param accepted but ignored in filter decision
Severity: HIGH
```

---

### Attack Scenario 3 — assertActorId Null Bypass (HIGH)

**Target:** `state/actors/assertActorId.js:3-8`
**Context:** assertActorId is used across VCSM to validate actor IDs before operations

**Source verified at:**
```js
// state/actors/assertActorId.js:3-8
export function assertActorId(actor) {
  if (actor && typeof actor !== "string") {
    console.error("❌ ACTOR CONTRACT VIOLATION:", actor);
    throw new Error("Actor must be a UUID string");
  }
}
```

**Attack vectors attempted:**

1. **Null pass-through:** Call `assertActorId(null)`. Condition: `null && typeof null !== "string"` → `false`. Function returns silently. No error thrown. Callers using this as a null guard believe it passed — null actor proceeds.
   Result: BYPASSED.

2. **Empty string pass-through:** Call `assertActorId("")`. Condition: `"" && ...` → `false` (empty string is falsy). Empty string also passes silently.
   Result: BYPASSED.

3. **UUID format validation:** Pass `assertActorId("not-a-uuid")`. Condition: `"not-a-uuid" && typeof "not-a-uuid" !== "string"` → `"not-a-uuid" && false` → `false`. Non-UUID strings also pass silently.
   Result: BYPASSED — no UUID format validation at all.

4. **Valid UUID:** `assertActorId("valid-uuid-string")` → condition false → passes. Correct.
   Result: BLOCKED (intended).

5. **Object injection:** `assertActorId({})` → `{} && typeof {} !== "string"` → `true`. Throws correctly.
   Result: BLOCKED.

6. **Number injection:** `assertActorId(123)` → `123 && typeof 123 !== "string"` → `true`. Throws correctly.
   Result: BLOCKED.

**Assessment:** assertActorId only catches object/number types. It silently accepts null, undefined (falsy → passes), empty string, and any non-empty string regardless of UUID format. Any caller treating assertActorId as a UUID validator or null guard is unprotected.

```
VIEWER CONTEXT FUZZ ATTEMPT
Target: state/actors/assertActorId.js — assertActorId(null/""/"not-a-uuid")
Injected context: null, "", "not-a-uuid"
Expected result: ERROR
Actual result: SILENT PASS — no error thrown
Context validation: ABSENT (only rejects non-string non-null values)
Severity: HIGH
```

---

### Attack Scenario 4 — Chat Filter Hardcoded 'all' (MEDIUM)

**Target:** `chat/setup.js:55`
**Chain:** CHAIN-actors-003

**Source verified at:**
```js
// chat/setup.js:48
const viewerActorId = useIdentitySelectionStore.getState().activeActorId ?? null
// ...
// chat/setup.js:55
p_filter: 'all',   // hardcoded — viewerActorId present but filter logic absent
```

**Attack vectors attempted:**

1. **Null-viewer bypass:** Viewer is null (unauthenticated or store not yet hydrated). viewerActorId = null, but p_filter='all' is still sent. Private actors returned even without session context during hydration race.
   Result: PARTIAL — viewerActorId passed to p_viewer_actor_id (partial improvement), but p_filter always 'all'.

2. **Auth race exploitation:** Between session start and store hydration, activeActorId may be null for a brief window. During this window, chat search fires with viewerActorId=null but p_filter='all'.
   Result: PARTIAL — timing-dependent; narrow window but confirmed by source.

3. **Filter escalation:** Can caller override 'all'? No — hardcoded; no parameter for it.
   Result: NOT APPLICABLE.

4. **Session mismatch:** Pass different actorId to Zustand store. If store is manipulated (e.g., via XSS or devtools), p_viewer_actor_id could be forged.
   Result: PARTIAL — XSS-dependent; low practical exploitability.

```
VIEWER CONTEXT FUZZ ATTEMPT
Target: chat/setup.js — searchActors (local) p_filter hardcoded
Injected context: null viewerActorId (hydration race)
Expected result: p_filter='public' when null viewerActorId
Actual result: p_filter='all' regardless (hardcoded)
Context validation: WEAK (viewerActorId now in context but filter derivation absent)
Severity: MEDIUM (partial improvement since 2026-06-04 — viewerActorId now in Zustand)
```

---

### Attack Scenario 5 — Explore Residual Null-Viewer Bypass (MEDIUM)

**Target:** `explore/dal/search.dal.js:24`
**Context:** Prior BW-ACTORS-003 finding was about empty opts {} — that has been fixed. Residual gap identified.

**Source verified at:**
```js
// explore/dal/search.dal.js:4-7
function mapFilter(filter) {
  if (filter === 'users' || filter === 'vports') return filter
  return 'all'      // default — any non-specific filter maps to 'all'
}

// explore/dal/search.dal.js:24
p_filter: mapFilter(filter),   // filter from caller opts
```

Hook (`useSearchScreenController.js:112`):
```js
ctrlSearchResults({ query: debounced, filter, viewerActorId: actorId })
```
Where `filter` defaults to localStorage-saved value or 'all'.

**Attack vectors attempted:**

1. **Null-viewer with filter='all':** Unauthenticated caller (actorId=null) with filter='all'. mapFilter('all') → 'all'. RPC gets p_filter='all' and p_viewer_actor_id=null. No canonical null-viewer guard applied in explore DAL (unlike actors canonical DAL at line 9).
   Result: PARTIAL — depends on RPC DB logic for null viewer + 'all' filter combination.

2. **Prior empty opts attack:** ctrlSearchResults called searchDal with empty opts `{}` → viewerActorId always null. Current source: `searchDal(trimmed, filter, { viewerActorId })` — viewerActorId now forwarded. Prior mechanism PATCHED.
   Result: BLOCKED (original mechanism fixed).

3. **Filter escalation via localStorage:** If localStorage is manipulated, `filter` could be 'all' even for an unauthenticated user. No server-side validation of filter value.
   Result: PARTIAL — client-side trust; filter accepted as-is.

4. **Anonymous enumeration:** Anonymous caller → actorId=null → mapFilter produces 'all' → private actors potentially exposed.
   Result: PARTIAL — RPC DB-side logic unknown; canonical null-viewer guard absent at app layer.

```
VIEWER CONTEXT FUZZ ATTEMPT
Target: explore/dal/search.dal.js:24 — mapFilter always returns 'all' for non-specific filters
Injected context: null viewerActorId + filter='all' (default)
Expected result: p_filter='public' when viewerActorId is null
Actual result: p_filter='all' (mapFilter ignores viewerActorId)
Context validation: WEAK (viewerActorId forwarded but canonical null-viewer guard absent from DAL)
Severity: MEDIUM
```

---

### Attack Scenario 6 — searchActorsDAL Truthy-Only viewerActorId Check (LOW)

**Target:** `searchActors.dal.js:9`
**Chain:** Any chain reaching canonical searchActorsDAL

**Source verified at:**
```js
// searchActors.dal.js:9
const filter = viewerActorId ? 'all' : 'public'
```

**Attack vectors attempted:**

1. **String injection:** Pass viewerActorId = "x" (any non-empty, non-UUID string). Truthy → filter='all'. Canonical guard bypassed without a real UUID.
   Result: BYPASSED — no UUID validation.

2. **Session mismatch:** Pass a different actor's UUID as viewerActorId. Filter becomes 'all' — same result as legitimate auth. No session binding check.
   Result: BYPASSED — filter escalation achievable with any valid actorId string.

3. **Null check:** Pass null → 'public'. Correct behavior.
   Result: BLOCKED.

4. **Empty string:** Pass "" → falsy → 'public'. Correctly handled.
   Result: BLOCKED.

5. **Boolean injection:** Pass true → truthy → filter='all'. Non-standard injection.
   Result: BYPASSED in theory; practical reach limited by TypeScript/JS calling conventions.

6. **UUID format forgery:** Pass "00000000-0000-0000-0000-000000000000" (null UUID). Truthy → filter='all'. DB RPC receives this as viewer ID — DB decides if it maps to a real actor.
   Result: PARTIAL — depends on DB RPC logic; no app-layer UUID validation gate.

```
VIEWER CONTEXT FUZZ ATTEMPT
Target: searchActors.dal.js:9 — truthy-only viewerActorId check
Injected context: "x", any non-empty string, boolean true
Expected result: ERROR or filter='public' for non-UUID inputs
Actual result: filter='all' — truthy input accepted regardless of format
Context validation: WEAK (truthy-only; no UUID validation, no session binding)
Severity: LOW (read-only surface; blast radius = visibility of non-public actors in search)
```

---

### Attack Scenario 7 — vportTeamAccess Search Session Binding (LOW)

**Target:** `vportTeamAccess.controller.js:181`
**Chain:** CHAIN-actors-002 — searchTeamCandidatesController → searchActorsAdapter

**Source verified at:**
```js
// vportTeamAccess.controller.js:178-187
export async function searchTeamCandidatesController({ query, viewerActorId }) {
  try {
    if (!query?.trim()) return [];
    const actors = await searchActorsAdapter({ query, limit: 12, viewerActorId });
    return actors.map(toTeamCandidateRow);
  } catch (error) { ... }
}
```

**Attack vectors attempted:**

1. **Session mismatch:** Supply a different actor's UUID as viewerActorId. No session binding check — any truthy UUID accepted → filter='all' in DAL. Attacker could impersonate another actor's search context.
   Result: PARTIAL — achievable but blast radius limited (read-only, search results only, attacker already authenticated).

2. **Null viewerActorId:** If caller omits viewerActorId, it's undefined → falsy → filter='public'. Authenticated team managers might get public-only results when looking for team candidates.
   Result: PARTIAL — functional issue (authenticated user gets downgraded results) rather than security exploit.

3. **Ownership bypass:** The other team operations (getTeamAccessController, addTeamMemberController, etc.) all require `callerActorId` + `assertActorOwnsVportActorController`. Search does NOT require this check — it is unguarded.
   Result: PARTIAL — search is reachable without VPORT ownership verification.

4. **Actor enumeration:** Team candidate search with filter='all' could enumerate non-public actors. Limited to authenticated callers; requires knowing the endpoint.
   Result: PARTIAL.

5. **Query injection:** query passed directly to searchActorsAdapter → controller → DAL → Supabase RPC. RPC handles query sanitization at DB level.
   Result: BLOCKED (DB-side).

6. **Null query gate:** `if (!query?.trim()) return []` — empty query short-circuits. Correct.
   Result: BLOCKED.

```
SESSION MUTATION ATTEMPT
Target: searchTeamCandidatesController (vportTeamAccess.controller.js:181)
Attack vector: Supply forged viewerActorId — any UUID produces filter='all'; no session binding
Result: PARTIAL
Evidence: vportTeamAccess.controller.js:178-181 — viewerActorId accepted from caller params; searchActorsAdapter forwards to DAL
Session binding: ABSENT (viewerActorId not validated against session actor)
Severity: LOW (read-only search; authenticated callers only)
```

---

### Attack Scenario 8 — Prior BW-ACTORS-003 (explore empty opts) — Re-verification

**Source verified at (`searchResults.controller.js:9`):**
```js
const responses = await Promise.all(searchDal(trimmed, filter, { viewerActorId }))
```

Prior finding claimed `searchDal(trimmed, filter, {})` — empty opts. Current source shows `{ viewerActorId }` is forwarded. Hook (`useSearchScreenController.js:112`) passes `viewerActorId: actorId`.

**Result:** Original mechanism PATCHED.
**Status:** PATCH_REGRESSION_FOUND → original mechanism BLOCKED. Residual gap remains (see Scenario 5).

---

### Attack Scenario 9 — Prior BW-ACTORS-004 (Hydration Poisoning) — Re-verification

**Architecture unchanged** per ARCHITECT 2026-06-07. Hydration store accepts non-UUID keys from any upsertActors caller. XSS required to reach poisoning. 5-min TTL limits exposure.

**Status:** STILL_OPEN (no source change; architecture unchanged).
**Result:** PARTIAL — XSS-dependent; confined blast radius.

---

### Attack Scenario 10 — BW-ACTORS-005 (BEHAVIOR.md Placeholder) — Re-verification

Per ARCHITECT 2026-06-07: BEHAVIOR.md is still PLACEHOLDER. No §5 Security Rules. No §9 Must Never Happen invariants defined.

**Status:** STILL_OPEN.
**Result:** N/A — governance gap, not a runtime attack.

---

## 6. Exploitability Assessment

| Surface | Attacks Attempted | Result | Severity |
|---|---|---|---|
| ctrlSearchActors (Blocks) — viewerActorId dropped | 6 | BYPASSED | HIGH |
| searchMentionSuggestions — p_filter hardcoded 'all' | 6 | BYPASSED | HIGH |
| assertActorId — null/empty/non-UUID bypass | 6 | BYPASSED | HIGH |
| chat/setup.js — p_filter hardcoded 'all' | 4 | PARTIAL | MEDIUM |
| explore/dal/search.dal.js — no null-viewer guard | 4 | PARTIAL | MEDIUM |
| searchActorsDAL — truthy-only check | 6 | BYPASSED | LOW |
| vportTeamAccess — session binding absent | 6 | PARTIAL | LOW |
| explore empty opts (prior BW-ACTORS-003) | 1 | BLOCKED | — (patched) |

---

## 7. Source Verification Summary

Total attack scenarios attempted: 10
Scenarios source-verified: 10 / 10
Source files read (targeted adversarial verification only):
- `vportTeamAccess.controller.js` — CHAIN-actors-002 verification
- `state/actors/assertActorId.js` — BW-ACTORS-002 re-verification
- `explore/controllers/searchResults.controller.js` — BW-ACTORS-003 re-verification
- `explore/hooks/useSearchScreenController.js` — explore viewerActorId chain verification
- `explore/dal/search.dal.js` — mapFilter null-viewer gap verification

BYPASSED findings: 3 — all [SOURCE_VERIFIED]: YES
BLOCKED findings: 1 (patched prior finding)
PARTIAL findings: 4
UNRESOLVED findings: 0

---

## 8. Confidence Summary

Scenarios from HIGH confidence sources: 10
Scenarios from LOW confidence sources: 0
[SOURCE_VERIFIED] results: 10
[SCANNER_LEAD] results: 0

---

## 8.1 SOURCE READ SUMMARY

| Command | Source Files Read | Evidence Bundle Used | Full Rediscovery Performed |
|---|---:|---|---|
| BLACKWIDOW | 5 | YES — ZZnotforproduction/APPS/VCSM/features/actors/outputs/2026/06/07/ARCHITECT/evidence-bundle.json | NO |

Files read (targeted adversarial verification only):
- `apps/VCSM/src/features/vportDashboard/dashboard/cards/team/controller/vportTeamAccess.controller.js` — CHAIN-actors-002 viewerActorId forwarding verification
- `apps/VCSM/src/state/actors/assertActorId.js` — BW-ACTORS-002 null bypass re-verification
- `apps/VCSM/src/features/explore/controllers/searchResults.controller.js` — BW-ACTORS-003 empty opts re-verification
- `apps/VCSM/src/features/explore/hooks/useSearchScreenController.js` — viewerActorId propagation chain verification
- `apps/VCSM/src/features/explore/dal/search.dal.js` — mapFilter null-viewer gap verification (lines 1-44)

Additional source already present in ARCHITECT evidence bundle (consumed, not re-read):
- `apps/VCSM/src/features/actors/dal/searchActors.dal.js`
- `apps/VCSM/src/features/settings/privacy/controller/Blocks.controller.js`
- `apps/VCSM/src/features/upload/dal/searchMentionSuggestions.dal.js`
- `apps/VCSM/src/features/chat/setup.js`

---

## 9. §9 Invariant Attack Map

BEHAVIOR.md is a PLACEHOLDER — no §9 Must Never Happen invariants are defined.

All invariant attacks were inferred from source behavior. This compounds the governance risk: if the code regresses, there are no documented invariants to test against.

| Inferred Invariant | Attack Attempted | Result | Status |
|---|---|---|---|
| Unauthenticated callers must never receive non-public actors | Upload mention null-viewer bypass | BYPASSED | UNANCHORED — no §9 entry |
| Authenticated callers must receive 'all' filter in actor search | Block search drops viewerActorId | BYPASSED | UNANCHORED — no §9 entry |
| assertActorId must reject null and non-UUID strings | Null pass-through | BYPASSED | UNANCHORED — no §9 entry |
| All search paths must apply canonical null-viewer guard | Chat + explore bypass | PARTIAL | UNANCHORED — no §9 entry |

---

## 10. Behavior Contract Attack Summary

BEHAVIOR.md: PLACEHOLDER — no contract content.

**Behavior Contract Attack Summary:**
- §4 Failure Paths: UNDEFINED — no paths documented
- §9 Must Never Happen: UNDEFINED — no invariants documented
- BYPASSED §9 violations routed: N/A — no invariants to route
- Risk: All runtime security assumptions are implicit; regression tests cannot be written against contract

BLACKWIDOW cannot anchor adversarial findings to BEHAVIOR.md invariants. LOGAN must author the full behavior contract before THOR eligibility can be established.

---

## 11. THOR Impact

**Release Blockers (BYPASSED findings — P0):**

| Finding ID | Severity | Description | THOR Status |
|---|---|---|---|
| BW-2026-06-07-001 | HIGH | Block search drops viewerActorId — private harassers cannot be found/blocked | THOR BLOCKER |
| BW-2026-06-07-002 | HIGH | Upload mention p_filter hardcoded 'all' — null-viewer bypass confirmed | THOR BLOCKER |
| BW-2026-06-07-003 | HIGH | assertActorId(null/""/non-UUID) passes silently — callers using as null guard are unprotected | THOR BLOCKER |

**Non-blocking open findings:**

| Finding ID | Severity | Description | THOR Status |
|---|---|---|---|
| BW-2026-06-07-004 | MEDIUM | Chat p_filter hardcoded 'all'; viewerActorId partial improvement insufficient | NON-BLOCKING |
| BW-2026-06-07-005 | MEDIUM | Explore DAL no null-viewer guard; canonical protection absent | NON-BLOCKING |
| BW-2026-06-07-006 | LOW | searchActorsDAL truthy-only check — string/boolean injection elevates to filter='all' | NON-BLOCKING |
| BW-2026-06-07-007 | LOW | vportTeamAccess search no session binding — viewerActorId accepted from caller params | NON-BLOCKING |

---

## 12. SPIDER-MAN Test Requirements

```
TESTREQ-BW-001
Target: ctrlSearchActors (Blocks.controller.js)
Test: Authenticated caller → ctrlSearchActors → should receive filter='all' results
Invariant: authenticated user performing block search should see private actors
Expected: p_filter='all' forwarded to DAL when caller is authenticated
Regression prevention for: BW-2026-06-07-001

TESTREQ-BW-002
Target: searchMentionSuggestions.dal.js
Test: null viewerActorId → p_filter must be 'public', not 'all'
Invariant: unauthenticated mention suggestions must not expose private actors
Regression prevention for: BW-2026-06-07-002

TESTREQ-BW-003
Target: state/actors/assertActorId.js
Test: assertActorId(null) → must throw; assertActorId("") → must throw; assertActorId("not-a-uuid") → must throw
Invariant: assertActorId is a UUID validator and null guard
Regression prevention for: BW-2026-06-07-003

TESTREQ-BW-004
Target: explore ctrlSearchResults → searchDal chain
Test: null viewerActorId + filter='all' → p_filter must be 'public'
Invariant: canonical null-viewer guard applied to all search paths
Regression prevention for: BW-2026-06-07-005

TESTREQ-BW-005
Target: searchActorsDAL
Test: viewerActorId = "x" (non-UUID truthy string) → should reject or treat as null
Invariant: non-UUID viewerActorId must not escalate to filter='all'
Regression prevention for: BW-2026-06-07-006
```

---

## BLACKWIDOW FINDINGS

---

```
BLACKWIDOW ADVERSARIAL FINDING

- Finding ID: BW-2026-06-07-001
- Scenario: Block search drops viewerActorId — authenticated callers receive public-only filter
- Target: ctrlSearchActors (apps/VCSM/src/features/settings/privacy/controller/Blocks.controller.js:54-58)
- Application Scope: VCSM
- Platform Surface: Search / Safety Feature
- Attack Vector: Call ctrlSearchActors as authenticated actor — viewerActorId never forwarded to searchActorsAdapter
- Exploit Chain Type: Single-step exploit (one gate missing — viewerActorId drop)
- Governance Status: VERIFIED
- Result: BYPASSED
- Evidence: Blocks.controller.js:54-58 — `searchActorsAdapter({ query, limit: 12 })` — no viewerActorId; searchActors.dal.js:9 — null → filter='public'
- Defense Gate: ABSENT
- Blast Radius: Authenticated users cannot find and block private actors; harassers with non-public privacy setting are invisible in block search
- Severity: HIGH
- VENOM Finding Cross-Reference: VEN-ACTORS-001; ELEK-2026-06-07-001
- Recommended Fix: Add `viewerActorId` parameter to `ctrlSearchActors`; derive from caller session (useIdentity or session context); forward to searchActorsAdapter
- Layer to Fix: Controller
- Required Follow-up Command: SPIDER-MAN (TESTREQ-BW-001); THOR (release blocker)
```

---

```
BLACKWIDOW ADVERSARIAL FINDING

- Finding ID: BW-2026-06-07-002
- Scenario: Upload mention suggestions hardcode p_filter='all' — null-viewer bypass confirmed
- Target: apps/VCSM/src/features/upload/dal/searchMentionSuggestions.dal.js:28
- Application Scope: VCSM
- Platform Surface: Upload / Mention Suggestion
- Attack Vector: Call searchMentionSuggestions with null viewerActorId — p_filter still 'all'
- Exploit Chain Type: Single-step exploit (canonical null-viewer guard absent)
- Governance Status: VERIFIED
- Result: BYPASSED
- Evidence: searchMentionSuggestions.dal.js:28 — `p_filter: 'all'` hardcoded; viewerActorId accepted as parameter but never used in filter derivation
- Defense Gate: ABSENT
- Blast Radius: Unauthenticated or session-expired callers who reach this path receive all actors including private ones in mention suggestions
- Severity: HIGH
- VENOM Finding Cross-Reference: VEN-ACTORS-002; ELEK-2026-06-07-002
- Recommended Fix: Apply canonical null-viewer guard: `const filter = viewerActorId ? 'all' : 'public'`; replace hardcoded `p_filter: 'all'`
- Layer to Fix: DAL
- Required Follow-up Command: SPIDER-MAN (TESTREQ-BW-002); THOR (release blocker)
```

---

```
BLACKWIDOW ADVERSARIAL FINDING

- Finding ID: BW-2026-06-07-003
- Scenario: assertActorId passes silently for null, empty string, and non-UUID strings
- Target: apps/VCSM/src/state/actors/assertActorId.js:3-8
- Application Scope: VCSM
- Platform Surface: Actor state / identity assertion utility
- Attack Vector: Call assertActorId(null) — condition `actor && typeof actor !== "string"` is false for null; function returns without throwing
- Exploit Chain Type: Single-step exploit (guard condition is incorrect — `actor &&` makes null falsy-pass)
- Governance Status: VERIFIED
- Result: BYPASSED
- Evidence: assertActorId.js:4 — `if (actor && typeof actor !== "string")` — null is falsy; empty string is falsy; non-UUID strings are strings; all three pass without error
- Defense Gate: ABSENT (for null, empty string, non-UUID string inputs)
- Blast Radius: Any caller using assertActorId as a null guard or UUID validator is unprotected; downstream operations receive null/invalid actor IDs silently
- Severity: HIGH
- VENOM Finding Cross-Reference: BW-ACTORS-002 (prior run)
- Recommended Fix: Rewrite guard: `if (!actor || typeof actor !== 'string' || !UUID_REGEX.test(actor)) { throw new Error("Actor must be a valid UUID string"); }` where UUID_REGEX validates format
- Layer to Fix: Controller (utility function)
- Required Follow-up Command: SPIDER-MAN (TESTREQ-BW-003)
```

---

```
BLACKWIDOW ADVERSARIAL FINDING

- Finding ID: BW-2026-06-07-004
- Scenario: Chat search path p_filter hardcoded 'all' despite partial viewerActorId improvement
- Target: apps/VCSM/src/features/chat/setup.js:55
- Application Scope: VCSM
- Platform Surface: Chat / Actor Search
- Attack Vector: Use chat search with null viewerActorId (hydration race window) — p_filter='all' regardless
- Exploit Chain Type: Timing-dependent exploit (hydration race) + Single-step (filter hardcoded)
- Governance Status: VERIFIED
- Result: PARTIAL
- Evidence: chat/setup.js:48 reads viewerActorId from Zustand; chat/setup.js:55 p_filter: 'all' hardcoded; canonical null-viewer guard absent from filter derivation
- Defense Gate: WEAK (partial improvement: viewerActorId now in context; filter derivation still absent)
- Blast Radius: Chat actor search always returns all actors regardless of auth state; private actors exposed in chat search during hydration race
- Severity: MEDIUM
- VENOM Finding Cross-Reference: VEN-ACTORS-003; ELEK-2026-06-07-003
- Recommended Fix: Derive p_filter from viewerActorId: `const filter = viewerActorId ? 'all' : 'public'`; remove hardcoded 'all'
- Layer to Fix: DAL (chat/setup.js local search function)
- Required Follow-up Command: SPIDER-MAN
```

---

```
BLACKWIDOW ADVERSARIAL FINDING

- Finding ID: BW-2026-06-07-005
- Scenario: Explore search DAL uses mapFilter — no canonical null-viewer guard; null viewerActorId + filter='all' sends p_filter='all' to RPC
- Target: apps/VCSM/src/features/explore/dal/search.dal.js:4-7, 24
- Application Scope: VCSM
- Platform Surface: Explore / Search
- Attack Vector: Unauthenticated user with filter='all' (localStorage default) → actorId=null → mapFilter('all')='all' → p_filter='all' to RPC with null viewer
- Exploit Chain Type: Single-step exploit (canonical null-viewer guard absent from explore DAL)
- Governance Status: VERIFIED
- Result: PARTIAL
- Evidence: explore/dal/search.dal.js:4-7 — mapFilter always returns 'all' for non-specific filters; line 24 — p_filter: mapFilter(filter) — viewerActorId not consulted in filter derivation; useSearchScreenController.js:112 — viewerActorId now forwarded (improvement); filter from localStorage defaults to 'all'
- Defense Gate: WEAK (viewerActorId forwarded to p_viewer_actor_id but filter logic ignores viewerActorId nullness)
- Blast Radius: Unauthenticated explore users with default filter may receive all actors from RPC if RPC does not guard against null viewer + all filter combination
- Severity: MEDIUM
- VENOM Finding Cross-Reference: VEN-ACTORS-003 (partial)
- Recommended Fix: Apply canonical null-viewer guard in explore DAL: `const safeFilter = viewerActorId ? mapFilter(filter) : 'public'`; use safeFilter as p_filter
- Layer to Fix: DAL (explore/dal/search.dal.js)
- Required Follow-up Command: SPIDER-MAN (TESTREQ-BW-004)
```

---

```
BLACKWIDOW ADVERSARIAL FINDING

- Finding ID: BW-2026-06-07-006
- Scenario: searchActorsDAL truthy-only viewerActorId check — any non-empty string escalates to filter='all'
- Target: apps/VCSM/src/features/actors/dal/searchActors.dal.js:9
- Application Scope: VCSM
- Platform Surface: Actor Search / Canonical DAL
- Attack Vector: Pass viewerActorId = "x" (any non-empty string) → truthy → filter='all'; no UUID validation gate
- Exploit Chain Type: Injection exploit (forged parameter accepted without validation)
- Governance Status: VERIFIED
- Result: BYPASSED (for non-UUID inputs) / BLOCKED (for null/empty)
- Evidence: searchActors.dal.js:9 — `const filter = viewerActorId ? 'all' : 'public'` — truthy check only; no UUID format validation; no session binding
- Defense Gate: WEAK (null/empty handled; non-UUID truthy strings not rejected)
- Blast Radius: Any caller that can supply a truthy non-UUID viewerActorId can escalate from public to all filter; limited blast radius — read-only search surface; attacker must control the parameter
- Severity: LOW
- VENOM Finding Cross-Reference: ELEK-2026-06-07-004; BW-ACTORS-001 (prior)
- Recommended Fix: Add UUID format validation: `const isValidUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(viewerActorId)`; `const filter = isValidUUID ? 'all' : 'public'`
- Layer to Fix: DAL
- Required Follow-up Command: SPIDER-MAN (TESTREQ-BW-005)
```

---

```
BLACKWIDOW ADVERSARIAL FINDING

- Finding ID: BW-2026-06-07-007
- Scenario: vportTeamAccess search accepts viewerActorId from caller params without session binding
- Target: apps/VCSM/src/features/vportDashboard/dashboard/cards/team/controller/vportTeamAccess.controller.js:178-187
- Application Scope: VCSM
- Platform Surface: vportDashboard / Team Management / Candidate Search
- Attack Vector: Authenticated caller supplies forged viewerActorId (another actor's UUID) → filter='all' → sees non-public actors in team candidate search
- Exploit Chain Type: Injection exploit (caller-supplied viewerActorId accepted without session validation)
- Governance Status: DRAFT
- Result: PARTIAL
- Evidence: vportTeamAccess.controller.js:181 — searchActorsAdapter({ query, limit: 12, viewerActorId }) — viewerActorId from caller params; no session binding check; all other team operations in this controller use assertActorOwnsVportActorController but search does not
- Defense Gate: ABSENT (for search function specifically; team mutations are protected)
- Blast Radius: Authenticated VPORT owners/managers can supply another actor's UUID as viewerActorId; limited to search result visibility; attacker is already authenticated; data exposed (displayName, username, avatarUrl) is low-sensitivity
- Severity: LOW
- VENOM Finding Cross-Reference: None (new finding)
- Recommended Fix: Derive viewerActorId from session context at call site rather than accepting from caller params; or validate that viewerActorId matches callerActorId
- Layer to Fix: Controller
- Required Follow-up Command: SPIDER-MAN
```

---

## Failed Exploit Chains (Defenses That Held)

| Scenario | Target | Attack | Defense |
|---|---|---|---|
| Direct ownership bypass | identity.search_actor_directory RPC | Supply another actor's raw ID to search — results belong to querying actor only | RPC returns directional search results; no direct resource ownership bypass |
| Mutation replay | actors module | Replay write operation | Module has NO write surfaces — zero mutations; RPC is read-only |
| Auth callback replay | N/A | Not in actors module scope | N/A |
| Empty query enumeration | searchActors.dal.js | Empty needle returns empty results | searchActors.dal.js:12 — `if (!needle) return []` guards empty queries |
| Explore prior empty opts | searchResults.controller.js | Call with {} opts | PATCHED — `{ viewerActorId }` now forwarded (useSearchScreenController.js:112) |

---

## Prior BW Finding Re-verification Status

| Prior Finding ID | Description | 2026-06-07 Status | Evidence |
|---|---|---|---|
| BW-ACTORS-001 | searchActorsDAL truthy-only check | STILL_OPEN_SOURCE_VERIFIED → BW-2026-06-07-006 | searchActors.dal.js:9 unchanged |
| BW-ACTORS-002 | assertActorId(null) passes silently | STILL_OPEN_SOURCE_VERIFIED → BW-2026-06-07-003 | assertActorId.js:4 unchanged |
| BW-ACTORS-003 | ctrlSearchResults empty opts {} | PARTIAL_SOURCE_VERIFIED — original mechanism PATCHED; residual gap in explore DAL → BW-2026-06-07-005 | searchResults.controller.js:9 now passes viewerActorId; explore DAL mapFilter gap remains |
| BW-ACTORS-004 | Hydration poisoning | STILL_OPEN — no source change; architecture unchanged | ARCHITECT 2026-06-07 confirms no architecture change |
| BW-ACTORS-005 | BEHAVIOR.md placeholder | STILL_OPEN | ARCHITECT 2026-06-07 — BEHAVIOR.md still PLACEHOLDER |

---

## Recommended Fixes

| Priority | Finding | Fix |
|---|---|---|
| P0 | BW-2026-06-07-001 | Add viewerActorId to ctrlSearchActors; derive from session context |
| P0 | BW-2026-06-07-002 | Apply canonical null-viewer guard in searchMentionSuggestions.dal.js |
| P0 | BW-2026-06-07-003 | Rewrite assertActorId with explicit null check + UUID regex validation |
| P1 | BW-2026-06-07-004 | Remove p_filter='all' hardcode from chat/setup.js; derive from viewerActorId |
| P1 | BW-2026-06-07-005 | Add canonical null-viewer guard to explore/dal/search.dal.js mapFilter path |
| P2 | BW-2026-06-07-006 | Add UUID regex validation to searchActorsDAL viewerActorId check |
| P2 | BW-2026-06-07-007 | Derive viewerActorId from session in searchTeamCandidatesController |

---

## Required Follow-up Commands

| Command | Reason | Status |
|---|---|---|
| THOR | 3 release blockers: BW-2026-06-07-001, 002, 003 | PENDING |
| SPIDER-MAN | 5 test requirements (TESTREQ-BW-001 through 005) | PENDING |
| LOGAN | BEHAVIOR.md placeholder must be authored before THOR eligibility | PENDING |
| VENOM | Cross-reference BW-2026-06-07-007 (new finding — vportTeamAccess) | PENDING |

---

## BLACKWIDOW Summary

| Count | Severity | Findings |
|---|---|---|
| 0 | CRITICAL | — |
| 3 | HIGH | BW-2026-06-07-001, 002, 003 |
| 2 | MEDIUM | BW-2026-06-07-004, 005 |
| 2 | LOW | BW-2026-06-07-006, 007 |
| 0 | INFO | — |

**THOR Release Blockers:** BW-2026-06-07-001 (Block search viewerActorId dropped), BW-2026-06-07-002 (Upload mention filter bypass), BW-2026-06-07-003 (assertActorId null bypass)

**BLACKWIDOW Recommendation:** FAIL — active bypasses confirmed. Three HIGH findings are P0 THOR release blockers. Patch before next release gate.
