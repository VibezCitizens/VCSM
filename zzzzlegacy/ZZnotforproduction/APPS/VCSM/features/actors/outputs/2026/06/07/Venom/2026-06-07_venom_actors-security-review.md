---
name: venom.actors.2026-06-07
description: VENOM V2 trust boundary security review — VCSM:actors — 2026-06-07
metadata:
  type: security-review
  owner: VENOM
  generated: 2026-06-07
  scanner-version: 1.1.0
  prior-run: 2026-06-04
---

# VENOM V2 SECURITY REVIEW — VCSM:actors

## Output Metadata

| Field | Value |
|---|---|
| Feature | actors |
| Command | VENOM V2 |
| Application Scope | VCSM |
| Ticket | (none — standalone run) |
| Scanner Version | 1.1.0 |
| Evidence Bundle | outputs/2026/06/07/ARCHITECT/evidence-bundle.json |
| Output Path | outputs/2026/06/07/Venom/2026-06-07_venom_actors-security-review.md |
| Timestamp | 2026-06-07T00:00:00Z |
| Prior Run | 2026-06-04 |

---

## 1. VENOM ARCHITECT Output Check

```
VENOM ARCHITECT OUTPUT CHECK
==============================
ARCHITECT Output: ZZnotforproduction/APPS/VCSM/features/actors/outputs/2026/06/07/ARCHITECT/evidence-bundle.json
Generated At: 2026-06-07T00:00:00Z
Age: <1h
Freshness: FRESH
Scope: VCSM:actors
Status: PASS

Security Surface Counts (from ARCHITECT output):
Write surfaces: 0
RPC surfaces: 4 (identity.search_actor_directory × 4 callsites)
Edge function surfaces: 0
Security paths: 2 (Blocks controller, vportTeamAccess controller)
Execution paths resolved: 4
```

---

## 2. Scanner Inputs

| Map | Generated At | Age | Freshness | Confidence | Surfaces In Scope | Used For |
|---|---|---|---|---|---|---|
| write-surface-map | 2026-06-07T08:11:09Z | <1h | FRESH | HIGH | 0 | Write surface inventory (none for actors) |
| rpc-map | 2026-06-07T08:11:09Z | <1h | FRESH | HIGH | 4 | RPC surface inventory |
| edge-function-map | 2026-06-07T08:11:09Z | <1h | FRESH | HIGH | 0 | Edge function inventory (none) |
| security-path-map | 2026-06-07T08:11:09Z | <1h | FRESH | HIGH | 2 | Security path inventory |
| callgraph | 2026-06-07T08:11:09Z | <1h | FRESH | HIGH | 4 nodes, 6 edges | Call chain resolution |

Scanner Version: 1.1.0  
Overall Preflight: FRESH  
Preflight Action: PASSED  
Total surfaces in scope: 0 write + 4 RPC + 0 edge  
Total security paths in scope: 2  
HIGH confidence paths (resolved): 4  
LOW confidence paths (unresolved): 0  

---

## 3. Security Surface Inventory

```
VENOM SECURITY SURFACE INVENTORY
==================================
Feature: actors
Scan Date: 2026-06-07

Write Surfaces: 0
  INSERT: 0 | UPDATE: 0 | DELETE: 0 | UPSERT: 0
  Tables affected: none

RPC Calls: 4
  Schema: identity:search_actor_directory (× 4 callsites)
  1. actors/dal/searchActors.dal.js — CANONICAL (filter gate present)
  2. chat/setup.js — BYPASS (p_filter hardcoded 'all')
  3. upload/dal/searchMentionSuggestions.dal.js — BYPASS (p_filter hardcoded 'all')
  4. explore/dal/search.dal.js — BYPASS (viewerActorId defaults null)

Edge Functions: 0

Security Paths: 2
  HIGH confidence (caller chain resolved): 2
  LOW confidence (caller chain unresolved): 0
  Access=protected: 0 (no routes)
  Access=public: 0 (no routes)
  Access=N/A: 2 (API-only module, no route binding)

Execution Paths Resolved: 4 / 4
```

---

## 4. Scanner Signals

| Signal | Source Map | Scanner Confidence | Verified Against Source | Provenance | Finding ID |
|---|---|---|---|---|---|
| RPC search_actor_directory from searchActors.dal.js | rpc-map | HIGH | YES — line 9: `filter = viewerActorId ? 'all' : 'public'` | [SOURCE_VERIFIED] | VEN-ACTORS-001 (context) |
| RPC search_actor_directory from Blocks.controller.js→adapter | callgraph | HIGH | YES — Blocks.controller.js:54: no viewerActorId passed | [SOURCE_VERIFIED] | VEN-ACTORS-001 |
| RPC search_actor_directory from upload/searchMentionSuggestions.dal.js | rpc-map | HIGH | YES — line 28: `p_filter: 'all'` hardcoded | [SOURCE_VERIFIED] | VEN-ACTORS-002 |
| RPC search_actor_directory from chat/setup.js | rpc-map | HIGH | YES — line 55: `p_filter: 'all'` hardcoded; viewerActorId from store at line 48 | [SOURCE_VERIFIED] | VEN-ACTORS-003 |
| 3 bypass callsites outside actors module | callgraph | HIGH | YES — all 3 files read and confirmed | [SOURCE_VERIFIED] | VEN-ACTORS-004 |

---

## 5. Behavior Contract Status

```
BEHAVIOR.md: PRESENT
Status: PLACEHOLDER — zero contract content
§5 Security Rules defined: 0
§9 Must Never Happen invariants: 0
Behavior IDs anchored: 0

Impact: All trust boundary analysis in this review is source-inferred.
No authoritative behavior IDs available. BEHAVIOR.md authoring is HIGH priority.
```

---

## 6. Trust Boundary Findings

---

### VEN-ACTORS-001 (STILL OPEN — Source Verified 2026-06-07) [SOURCE_VERIFIED]

**VENOM SECURITY FINDING**

- **Finding ID:** VEN-ACTORS-001
- **Location:** apps/VCSM/src/features/settings/privacy/controller/Blocks.controller.js:54–58
- **Application Scope:** VCSM
- **Platform Surface:** PWA · Supabase RPC
- **Trust Boundary:** Authenticated Citizen
- **Boundary Violated:** Authenticated Citizen cannot access their own safety feature correctly — private actors excluded from block search
- **Contract Violated:** Actor Ownership Contract (victim-caller identity not passed to search surface)
- **Current behavior:** `ctrlSearchActors({ query })` calls `searchActorsAdapter({ query, limit: 12 })` with no `viewerActorId`. The DAL then evaluates `viewerActorId ? 'all' : 'public'` — because viewerActorId is null, filter becomes `'public'`. Private actors are excluded from results. A victim who is being harassed by a private-profile actor cannot find and block them via the Block Users search.
- **Risk:** Safety bypass — targeted harassment mitigation is impossible when the harasser has a private profile.
- **Severity:** HIGH
- **Exploitability:** HIGH
  - **Attack Preconditions:** Harasser sets profile to private. Victim opens Block Users, searches by username. Harasser does not appear. No technical skill required.
- **Blast Radius:** Single actor (victim cannot block specific harasser)
- **Identity Leak Type:** None
- **Cache Trust Type:** None
- **RLS Dependency:** ASSUMED — DB function controls final filter; app-layer is not passing the correct viewer signal
- **Why it matters:** The block feature is a platform safety primitive. Degrading its search completeness for private profiles defeats the purpose of the feature.
- **Recommended mitigation:** Pass `viewerActorId` from session to `ctrlSearchActors` and through to `searchActorsAdapter`. The DAL already handles the logic correctly when viewerActorId is provided.
  ```js
  // Blocks.controller.js — fix
  export async function ctrlSearchActors({ query, viewerActorId }) {
    return searchActorsAdapter({ query, limit: 12, viewerActorId })
  }
  ```
- **Rationale:** Fix is in the controller signature — the DAL's canonical filter logic (`viewerActorId ? 'all' : 'public'`) is correct and only needs the viewer identity propagated.
- **Follow-up command:** ELEKTRA (source→sink patch advisory)
- **CISSP Domain:**
  - Primary: Identity and Access Management
  - Secondary: Software Development Security

---

### VEN-ACTORS-002 (STILL OPEN — Source Verified 2026-06-07) [SOURCE_VERIFIED]

**VENOM SECURITY FINDING**

- **Finding ID:** VEN-ACTORS-002
- **Location:** apps/VCSM/src/features/upload/dal/searchMentionSuggestions.dal.js:19–33
- **Application Scope:** VCSM
- **Platform Surface:** PWA · Supabase RPC
- **Trust Boundary:** Public Visitor / Authenticated Citizen
- **Boundary Violated:** Public Visitor → Authenticated-only actor data (actors with private visibility should not appear in public mention search)
- **Contract Violated:** Public Identity Surface Contract
- **Current behavior:** `searchMentionSuggestions(prefix, { viewerActorId = null })` accepts viewerActorId as a parameter but passes `p_filter: 'all'` hardcoded at line 28 regardless of whether viewerActorId is null or not. When an unauthenticated caller provides no viewerActorId, the filter should be `'public'`; instead it is `'all'`, meaning the DB function receives: `p_viewer_actor_id=null` + `p_filter='all'`.
- **Risk:** Anonymous callers (or callers without a valid viewer actor) can enumerate non-public actors via the mention search in the upload/post creation flow.
- **Severity:** HIGH
- **Exploitability:** MEDIUM
  - **Attack Preconditions:** Must be able to trigger the mention suggestion flow. Requires access to the post creation UI — any registered or anonymous session with UI access. The DB function's final enforcement is the last line of defense.
- **Blast Radius:** Multi-actor (any private actor can potentially be discovered via upload mention search)
- **Identity Leak Type:** Actor correlation (private actors discoverable via username prefix)
- **Cache Trust Type:** None
- **RLS Dependency:** REQUIRED — DB function SECURITY DEFINER likely enforces final visibility rules, but relying solely on the DB when app-layer sends incorrect parameters is trust layering failure
- **Why it matters:** Private actors should not be discoverable in search surfaces reachable by anonymous or low-trust callers. The canonical protection exists in the actors DAL and is absent here.
- **Recommended mitigation:**
  ```js
  // searchMentionSuggestions.dal.js — fix
  const filter = viewerActorId ? 'all' : 'public';
  // ... replace p_filter: 'all' with p_filter: filter
  ```
- **Rationale:** Identical to the canonical pattern in searchActors.dal.js. One-line fix.
- **Follow-up command:** ELEKTRA
- **CISSP Domain:**
  - Primary: Identity and Access Management
  - Secondary: Software Development Security

---

### VEN-ACTORS-003 (STILL OPEN — Source Verified 2026-06-07) [SOURCE_VERIFIED]

**VENOM SECURITY FINDING**

- **Finding ID:** VEN-ACTORS-003
- **Location:** Multiple — chat/setup.js:52, upload/dal/searchMentionSuggestions.dal.js:25, explore/dal/search.dal.js:21
- **Application Scope:** VCSM
- **Platform Surface:** PWA · Supabase RPC
- **Trust Boundary:** Multiple (varies by callsite)
- **Boundary Violated:** Fragmented patch surface — 3 bypass callsites implement actor search independently with inconsistent filter logic, bypassing the canonical security gateway
- **Contract Violated:** Boundary Isolation Contract (same DB function called from 3 places with no shared normalization)
- **Current behavior:** The `identity.search_actor_directory` RPC is called in 4 places. Only `searchActors.dal.js` implements the canonical `viewerActorId ? 'all' : 'public'` filter gate. The other 3 callsites each implement their own version:
  - `chat/setup.js:55` — `p_filter: 'all'` hardcoded (viewerActorId dynamically read from Zustand but filter logic absent)
  - `upload/searchMentionSuggestions.dal.js:28` — `p_filter: 'all'` hardcoded
  - `explore/dal/search.dal.js:25` — `mapFilter(filter)` from opts (viewerActorId defaults null; no null-viewer guard on filter)
  
  **Note on chat/setup.js (partial improvement since 2026-06-04):** The chat setup now reads `viewerActorId` from `useIdentitySelectionStore.getState().activeActorId ?? null` (line 48). This is an improvement over the prior state but the filter derivation logic (`viewerActorId ? 'all' : 'public'`) has NOT been applied. The fix is half-done.
  
- **Risk:** Any patch to actor search security must be applied in 4 places independently. A fix in the canonical actors DAL does not protect the 3 bypass callsites. The fragmented architecture creates a persistent regression surface.
- **Severity:** MEDIUM
- **Exploitability:** MEDIUM
  - **Attack Preconditions:** Depends on which bypass callsite is targeted. Upload mention search is most accessible.
- **Blast Radius:** Multi-actor (affects any private actor discoverable via non-canonical search paths)
- **Identity Leak Type:** Actor correlation
- **Cache Trust Type:** None
- **RLS Dependency:** REQUIRED — each bypass relies on DB function's final enforcement as sole protection
- **Why it matters:** Architectural fragmentation of a security-sensitive function means patches are incomplete by default. When VENOM found the canonical DAL issue (VEN-ACTORS-001/002), the bypass callsites remained unfixed.
- **Recommended mitigation:** Long-term: consolidate all actor search through the actors module adapter. Near-term: apply the canonical filter gate to all 3 bypass callsites individually as part of the same patch as VEN-ACTORS-001/002.
- **Rationale:** IRONMAN should document all 4 callsites in the actors module ownership record. CARNAGE not needed (no schema change).
- **Follow-up command:** IRONMAN (ownership record), ELEKTRA (patch advisory per callsite)
- **CISSP Domain:**
  - Primary: Software Development Security
  - Secondary: Identity and Access Management

---

### VEN-ACTORS-004 (STILL OPEN — Source Verified 2026-06-07) [SOURCE_VERIFIED]

**VENOM SECURITY FINDING**

- **Finding ID:** VEN-ACTORS-004
- **Location:** ZZnotforproduction/APPS/VCSM/features/actors/BEHAVIOR.md
- **Application Scope:** VCSM
- **Platform Surface:** Documentation
- **Trust Boundary:** N/A
- **Boundary Violated:** Governance contract — no behavior contract means no verifiable security invariants
- **Contract Violated:** None (governance gap, not a runtime contract)
- **Current behavior:** BEHAVIOR.md contains only: `Status: PLACEHOLDER / Feature: actors / Notes: Behavior contract pending source review.` — zero §5 Security Rules, zero §9 Must Never Happen invariants, zero behavior IDs.
- **Risk:** VENOM, BLACKWIDOW, and ELEKTRA cannot anchor findings to authoritative behavior IDs. All security analysis is source-inferred. Future behavior changes will not trigger governance review.
- **Severity:** MEDIUM
- **Exploitability:** LOW
- **Blast Radius:** Governance — affects all downstream security analysis accuracy
- **Identity Leak Type:** None
- **Cache Trust Type:** None
- **RLS Dependency:** NONE
- **Why it matters:** Without a behavior contract, the Must Never Happen invariants that BLACKWIDOW would test against do not exist. Any future refactor of the filter logic or RPC parameters has no documented invariant to protect.
- **Recommended mitigation:** Author BEHAVIOR.md with §5 Security Rules including:
  - Anonymous callers (null viewerActorId) must only receive public-visibility actors
  - p_filter must never be 'all' when viewerActorId is null
  - Private actors must not appear in any unauthenticated search surface
  - §9 Must Never Happen: `search_actor_directory` called with `p_filter='all'` AND `p_viewer_actor_id=NULL`
- **Follow-up command:** LOGAN
- **CISSP Domain:**
  - Primary: Software Development Security
  - Secondary: Security and Risk Management

---

## 7. Source Verification Summary

```
Total surfaces in scope: 4 RPC surfaces
Surfaces source-verified: 4 / 4
Source files read: 8 (4 module + 4 consumer/bypass — via evidence bundle)
CRITICAL findings: 0
HIGH findings: 2 — all [SOURCE_VERIFIED]: YES
MEDIUM findings: 2 — all [SOURCE_VERIFIED]: YES
```

Files verified:
- `apps/VCSM/src/features/actors/dal/searchActors.dal.js` — VEN-ACTORS-001 context, VEN-ACTORS-002 baseline
- `apps/VCSM/src/features/settings/privacy/controller/Blocks.controller.js` — VEN-ACTORS-001
- `apps/VCSM/src/features/upload/dal/searchMentionSuggestions.dal.js` — VEN-ACTORS-002
- `apps/VCSM/src/features/chat/setup.js` — VEN-ACTORS-003
- `apps/VCSM/src/features/explore/dal/search.dal.js` — VEN-ACTORS-003

---

## 8. Confidence Summary

```
HIGH confidence surfaces: 4
LOW confidence surfaces: 0
[SOURCE_VERIFIED] findings: 4
[SCANNER_LEAD] findings: 0
[SCANNER_LOW_CONF] findings: 0
```

---

## 9. THOR Impact

```
THOR Release Blockers:
  VEN-ACTORS-001 — HIGH — safety bypass (block search missing viewerActorId)
  VEN-ACTORS-002 — HIGH — null-viewer bypass in upload mention search

Highest Open Severity: HIGH
THOR Status: BLOCKED (2 HIGH findings open)
```

---

## 10. CISSP Domain Summary Table

| Domain | Findings | Severity |
|---|---|---|
| Identity and Access Management | VEN-ACTORS-001, VEN-ACTORS-002 | HIGH, HIGH |
| Software Development Security | VEN-ACTORS-003, VEN-ACTORS-004 | MEDIUM, MEDIUM |
| Security and Risk Management | VEN-ACTORS-004 | MEDIUM |

Uncovered CISSP domains: Cryptography, Asset Security, Security Architecture, Communication Security, Security Assessment, Security Operations.

---

## 11. Mitigation Plan

| Finding | Risk | Layer to Fix | Priority | Owner | Follow-up Command |
|---|---|---|---|---|---|
| VEN-ACTORS-001 | Safety bypass — private actors excluded from block search | Controller | P0 | App | ELEKTRA |
| VEN-ACTORS-002 | Null-viewer bypass — upload mention shows all actors | DAL | P0 | App | ELEKTRA |
| VEN-ACTORS-003 | 3 bypass callsites with broken filter logic | DAL (×3) | P1 | App | IRONMAN + ELEKTRA |
| VEN-ACTORS-004 | BEHAVIOR.md placeholder — no invariants | Documentation | P1 | Documentation | LOGAN |

---

## 12. SOURCE READ SUMMARY

| Command | Source Files Read | Evidence Bundle Used | Full Rediscovery Performed |
|---|---:|---|---|
| VENOM | 5 (targeted verification) | YES — outputs/2026/06/07/ARCHITECT/evidence-bundle.json | NO |

Files read (targeted verification only):
- `apps/VCSM/src/features/settings/privacy/controller/Blocks.controller.js` — reason: VEN-ACTORS-001 source verification
- `apps/VCSM/src/features/upload/dal/searchMentionSuggestions.dal.js` — reason: VEN-ACTORS-002 source verification
- `apps/VCSM/src/features/chat/setup.js` — reason: VEN-ACTORS-003 chat callsite verification
- `apps/VCSM/src/features/explore/dal/search.dal.js` — reason: VEN-ACTORS-003 explore callsite verification
- `apps/VCSM/src/features/actors/dal/searchActors.dal.js` — reason: canonical filter logic confirmation

---

## 13. Required Follow-Up Commands

- **ELEKTRA** — source→sink chain trace and patch advisory for VEN-ACTORS-001, 002, 003
- **BLACKWIDOW** — adversarial verification of bypass filter escalation paths
- **LOGAN** — author BEHAVIOR.md with security invariants (VEN-ACTORS-004)
- **IRONMAN** — document all 4 search_actor_directory callsites in ownership record
- **SPIDER-MAN** — add regression tests for null-viewer filter gate

---

## Status vs Prior Run (2026-06-04)

| Finding ID | Prior Severity | Current Status | Change |
|---|---|---|---|
| VEN-ACTORS-001 | HIGH | STILL OPEN | No patch applied |
| VEN-ACTORS-002 | HIGH | STILL OPEN | No patch applied |
| VEN-ACTORS-003 | MEDIUM | STILL OPEN — chat/setup.js partially improved (viewerActorId now read from Zustand, but p_filter still broken) | PARTIAL improvement, finding remains open |
| VEN-ACTORS-004 | MEDIUM | STILL OPEN | BEHAVIOR.md still placeholder |
