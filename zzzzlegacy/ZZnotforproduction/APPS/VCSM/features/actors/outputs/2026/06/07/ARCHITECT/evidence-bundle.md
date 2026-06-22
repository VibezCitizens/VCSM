---
name: vcsm.actors.evidence-bundle
description: ARCHITECT V2 evidence bundle — VCSM:actors — 2026-06-07
metadata:
  type: evidence-bundle
  owner: ARCHITECT
  generated: 2026-06-07T10:00:00Z
  updated: 2026-06-07T10:00:00Z (multi-module pass — actors re-verified)
  scanner-version: 1.1.0
---

# ARCHITECT Evidence Bundle — VCSM:actors
**Generated:** 2026-06-07  
**Scanner Version:** 1.1.0  
**Scope:** VCSM:actors  
**Confidence:** HIGH  

---

## Source Files Read

| Path | Layer | Lines |
|---|---|---|
| apps/VCSM/src/features/actors/adapters/actors.adapter.js | adapter | 1–9 |
| apps/VCSM/src/features/actors/controllers/searchActors.controller.js | controller | 1–7 |
| apps/VCSM/src/features/actors/dal/searchActors.dal.js | dal | 1–25 |
| apps/VCSM/src/features/actors/model/searchActors.model.js | model | 1–15 |
| apps/VCSM/src/features/settings/privacy/controller/Blocks.controller.js | controller (consumer) | 1–125 |
| apps/VCSM/src/features/chat/setup.js | module (bypass) | 1–139 |
| apps/VCSM/src/features/upload/dal/searchMentionSuggestions.dal.js | dal (bypass) | 1–48 |
| apps/VCSM/src/features/explore/dal/search.dal.js | dal (bypass) | 1–149 |

**Total source files validated:** 8

---

## Layer Counts (VCSM:actors module)

| Layer | Count | Files |
|---|---|---|
| adapter | 1 | actors.adapter.js |
| controller | 1 | searchActors.controller.js |
| dal | 1 | searchActors.dal.js |
| model | 2 exports | searchActors.model.js |
| hook | 0 | — |
| screen | 0 | — |
| component | 0 | — |

---

## RPC Callsites (identity.search_actor_directory)

| File | Caller | Filter Logic | Status |
|---|---|---|---|
| actors/dal/searchActors.dal.js | searchActorsDAL | `viewerActorId ? 'all' : 'public'` | CANONICAL |
| chat/setup.js | searchActors (local) | hardcoded `'all'`; viewerActorId from Zustand | BYPASS — filter broken |
| upload/dal/searchMentionSuggestions.dal.js | searchMentionSuggestions | hardcoded `'all'` | BYPASS — null-viewer unguarded |
| explore/dal/search.dal.js | searchActors (local) | mapFilter(filter) from opts | BYPASS — viewerActorId default null |

---

## Security-Sensitive Surfaces

| Surface | File | Risk | Priority |
|---|---|---|---|
| searchActorsDAL → search_actor_directory | actors/dal/searchActors.dal.js | Truthy-only viewerActorId check — no UUID validation | HIGH |
| searchMentionSuggestions → search_actor_directory | upload/dal/searchMentionSuggestions.dal.js | p_filter hardcoded 'all' — null-viewer bypass | HIGH |
| searchActors (chat) → search_actor_directory | chat/setup.js | p_filter hardcoded 'all' — broken filter logic | HIGH |
| ctrlSearchActors → searchActorsAdapter (Blocks) | settings/privacy/controller/Blocks.controller.js | viewerActorId not passed — safety search bypass | HIGH |

---

## Call Chains Summary

| Chain | Path | Ownership Checked |
|---|---|---|
| CHAIN-actors-001 | ctrlSearchActors → searchActorsAdapter → searchActors → searchActorsDAL | NO |
| CHAIN-actors-002 | searchTeamCandidatesController → searchActorsAdapter → searchActors → searchActorsDAL | NO |
| CHAIN-actors-003 | searchActors (chat) → search_actor_directory (bypass) | NO |
| CHAIN-actors-004 | searchMentionSuggestions → search_actor_directory (bypass) | NO |

---

## Behavior IDs

None — BEHAVIOR.md is PLACEHOLDER. No §9 Must Never Happen invariants anchored.

---

## Architecture State

- Module is API-only (no routes, screens, hooks)
- 4 module source files unchanged since 2026-06-04 ARCHITECT run
- 3 bypass callsites outside the actors module call identity.search_actor_directory directly
- No edge functions in scope
- No write surfaces — RPC-only (read)
- Scanner maps FRESH: generated 2026-06-07T08:11:09Z
