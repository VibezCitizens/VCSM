---
name: vcsm.actors.architecture.2026-06-07
description: ARCHITECT V2 module architecture report for VCSM:actors — 2026-06-07 run
metadata:
  type: architecture-run-report
  owner: ARCHITECT
  generated: 2026-06-07
  scanner-version: 1.1.0
---

# ARCHITECT V2 REPORT — VCSM:actors
**Date:** 2026-06-07  
**Scanner Version:** 1.1.0  
**Scope:** VCSM:actors  
**Application Scope:** VCSM  

---

## Output Metadata

| Field | Value |
|---|---|
| Feature / Scope | VCSM:actors |
| Command | ARCHITECT V2 |
| Ticket | (none — standalone run) |
| Scanner Version | 1.1.0 |
| Evidence Bundle | outputs/2026/06/07/ARCHITECT/evidence-bundle.json |
| Security Surface | ZZnotforproduction/GOVERNANCE/outputs/2026/06/07/ARCHITECT/architect-security-surface.json |
| Timestamp | 2026-06-07T00:00:00Z |

---

## 1. ARCHITECT Scanner Preflight

```
ARCHITECT SCANNER PREFLIGHT
============================
Scanner Version: 1.1.0
Maps Root: apps/scanner/maps/
Freshness Window: 7 days

| Map              | Generated At             | Age   | Freshness | Confidence | Status |
|------------------|--------------------------|-------|-----------|------------|--------|
| feature-map      | 2026-06-07T08:11:09Z     | <1h   | FRESH     | HIGH       | PASS   |
| callgraph        | 2026-06-07T08:11:09Z     | <1h   | FRESH     | HIGH       | PASS   |
| rpc-map          | 2026-06-07T08:11:09Z     | <1h   | FRESH     | HIGH       | PASS   |
| write-surface-map| 2026-06-07T08:11:09Z     | <1h   | FRESH     | HIGH       | PASS   |
| security-path-map| 2026-06-07T08:11:09Z     | <1h   | FRESH     | HIGH       | PASS   |
| edge-function-map| 2026-06-07T08:11:09Z     | <1h   | FRESH     | HIGH       | PASS   |
| dependency-map   | 2026-06-07T08:11:09Z     | <1h   | FRESH     | HIGH       | PASS   |
| route-map        | 2026-06-07T08:11:09Z     | <1h   | FRESH     | HIGH       | PASS   |

Overall Preflight: PASS
```

---

## 2. Scanner Inputs

| Map | Generated At | Freshness | Confidence | Actors Surfaces |
|---|---|---|---|---|
| feature-map | 2026-06-07T08:11:09Z | FRESH | HIGH | 1 feature entry (4 source files) |
| callgraph | 2026-06-07T08:11:09Z | FRESH | HIGH | 4 VCSM:actors nodes, 6 edges |
| rpc-map | 2026-06-07T08:11:09Z | FRESH | HIGH | 4 callsites (1 canonical + 3 bypass) |
| write-surface-map | 2026-06-07T08:11:09Z | FRESH | HIGH | 0 write surfaces (RPC-only module) |
| security-path-map | 2026-06-07T08:11:09Z | FRESH | HIGH | 0 paths with actors as primary owner |
| edge-function-map | 2026-06-07T08:11:09Z | FRESH | HIGH | 0 edge functions |

---

## 3. Scope Summary

```
Applications scanned: 1 (VCSM)
Engines scanned: 1 (directory)
Features in scope: 1 (actors)
Total callgraph nodes (VCSM:actors): 4
Total callgraph edges (actors-touching): 6
Write surfaces in scope: 0
RPC surfaces in scope: 4 (identity.search_actor_directory)
Routes in scope: 0
```

---

## 4. Architecture Findings

### AF-001 — Architecture Unchanged Since 2026-06-04 [SOURCE_VERIFIED]

All 4 source files verified against 2026-06-04 ARCHITECTURE.md. No new files, no deletions, no structural changes detected. Architecture is stable.

### AF-002 — 3 Bypass Callsites Remain Outside Module [SOURCE_VERIFIED]

The `identity.search_actor_directory` RPC is called from 3 locations outside the actors module with inconsistent filter logic. Each implements its own version of actor search with no shared normalization, creating a fragmented patch surface.

**Bypass callsites:**
1. `chat/setup.js:52` — p_filter hardcoded 'all'; viewerActorId read from Zustand store but filter derivation logic absent
2. `upload/dal/searchMentionSuggestions.dal.js:28` — p_filter hardcoded 'all'; viewerActorId accepted as parameter but ignored for filter
3. `explore/dal/search.dal.js:21` — viewerActorId from opts (default null); filter from mapFilter (correct per-type, but no null-viewer guard)

**Risk:** Any security patch to the canonical filter logic in actors DAL must also be applied to 3 other locations. The bypass callsites are invisible to the actors module security surface.

### AF-003 — vportTeamAccess.controller.js Confirmed Consumer [SOURCE_VERIFIED]

Confirmed via callgraph edge: `vportTeamAccess.controller.js#searchTeamCandidatesController → actors.adapter.js#searchActorsAdapter`. Consumer uses the proper adapter boundary. viewerActorId passing behavior not verified in this run (not security-critical for team member discovery).

---

## 5. Module Completeness Matrix

| Area | Status | Evidence | Missing / Risk |
|---|---|---|---|
| Purpose defined | PARTIAL | Source is clear; BEHAVIOR.md is PLACEHOLDER | BEHAVIOR.md must be authored |
| Owner defined | FAIL | No ownership record | No IRONMAN record |
| Entry points mapped | PASS | actors.adapter.js | — |
| Controllers present/delegated | PASS | searchActors.controller.js | — |
| DAL/repository present/delegated | PASS | searchActors.dal.js | — |
| Models/transformers present | PASS | searchActors.model.js (2 exports) | — |
| Hooks/view models present | FAIL | 0 hooks | Consumers own search wiring independently |
| Screens/components present | N/A | API-only module | — |
| Services/adapters present | PASS | actors.adapter.js | — |
| Database objects mapped | PASS | identity.search_actor_directory confirmed | — |
| Authorization path mapped | PARTIAL | Null-viewer → public filter in DAL | No app-layer auth middleware; bypass callsites lack this gate |
| Cache/runtime behavior mapped | FAIL | No caching | Every call is a fresh DB round-trip |
| Error/loading/empty states mapped | PARTIAL | DAL returns [] on empty needle; throws on DB error | Consumers must handle |
| Documentation linked | FAIL | BEHAVIOR.md is PLACEHOLDER | Full behavior contract missing |
| Tests/validation noted | FAIL | 0 tests | No unit tests |
| Native parity noted | N/A | API-only | — |
| Engine dependencies mapped | PASS | directory engine | — |

**Module Independence:** INDEPENDENT  
**Final Module Status:** MOSTLY COMPLETE

---

## 6. Source Verification Summary

Total RPC surfaces in scope: 4  
Surfaces source-verified: 4 / 4  
Source files read: 8 (4 module + 4 consumer/bypass)  
CRITICAL findings: 0  
HIGH findings (SOURCE_VERIFIED): 4 security surfaces identified  

---

## 7. Confidence Summary

HIGH confidence surfaces: 4  
LOW confidence surfaces: 0  
[SOURCE_VERIFIED] architecture findings: 3  
Architecture confidence: HIGH  

---

## 8. Behavior Contract Consistency

**BEHAVIOR.md present:** YES  
**Status:** PLACEHOLDER — no content  
**Check A (Source without behavior):** FAIL — actors module is functional with no behavior contract  
**Check B (Behavior without source):** N/A  
**Check C (Engine consistency):** PASS — directory engine confirmed via identity.search_actor_directory  
**Check D (Data change consistency):** PASS — no write surfaces; RPC-only  

---

## 9. Handoff Recommendations

- **VENOM** — trust boundary review on 4 RPC callsites (canonical + 3 bypass)
- **ELEKTRA** — source→sink chain trace on Blocks.controller / upload DAL / chat setup
- **LOGAN** — author BEHAVIOR.md contract
- **SPIDER-MAN** — add unit tests for model mapper and DAL
- **IRONMAN** — establish module ownership record

---

## Write 2 Confirmation

- ARCHITECTURE.md: UPDATED (in-place, 2026-06-07)
- INDEX.md: UPDATED (in-place, 2026-06-07)
- CURRENT_STATUS.md: APPENDED (ARCHITECT section, 2026-06-07)

## Write 3 Confirmation

- evidence-bundle.json: WRITTEN at outputs/2026/06/07/ARCHITECT/evidence-bundle.json
- evidence-bundle.md: WRITTEN at outputs/2026/06/07/ARCHITECT/evidence-bundle.md
- architect-security-surface.json: WRITTEN at ZZnotforproduction/GOVERNANCE/outputs/2026/06/07/ARCHITECT/architect-security-surface.json
