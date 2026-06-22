---
title: Search Module — Index
status: STUB
feature: actors
module: search
source: architect-derived
created: 2026-06-05
source-path: apps/VCSM/src/features/actors/
scanner-version: 1.1.0
---

# actors / modules / search

Actor search and discovery layer. Exposes a single RPC-backed search surface (`identity.search_actor_directory`) consumed by multiple features. API-only — no screens, no routes. The canonical gateway for all actor search; bypasses by cross-feature callers are confirmed security findings.

## Module Summary

| Field | Value |
|---|---|
| Module | search |
| Feature | actors |
| Source Path | apps/VCSM/src/features/actors/ |
| Screens | 0 — API-only |
| Routes | 0 |
| Write Surfaces | 0 (RPC is a read — returns search results) |
| Controllers | 1 |
| DAL Files | 1 |
| Models | 1 (2 functions) |
| Adapters | 1 |
| THOR Blockers | 2 (VEN-ACTORS-001/ELEK-2026-06-04-002, ELEK-2026-06-04-001) |

## Known Source Files (ARCHITECT-verified)

### Adapters
| File | Role |
|---|---|
| adapters/actors.adapter.js | Public surface — approved import point for all consuming features |

### Controllers
| File | Role | Security Flag |
|---|---|---|
| controllers/searchActors.controller.js | Routes search query to DAL; applies viewerActorId for visibility scoping | THOR BLOCKER: viewerActorId dropped in Blocks caller path (ELEK-2026-06-04-002) |

### DAL
| File | Role | Security Flag |
|---|---|---|
| dal/searchActors.dal.js | searchActorsDAL → identity.search_actor_directory RPC | LOW: truthy-only viewerActorId check; no UUID validation (ELEK-2026-06-04-006) |

### Model
| File | Functions | Role |
|---|---|---|
| model/searchActors.model.js | mapSearchActorRow, mapSearchActorsRows | Maps raw RPC result rows to search actor shape |

## RPC Surface

| RPC | Schema | Direction | Notes |
|---|---|---|---|
| search_actor_directory | identity | READ | p_filter='public' when viewerActorId=null; p_filter='all' when authenticated |

## Security Flags

- THOR BLOCKER: VEN-ACTORS-001 / BW-ACTORS-001 / ELEK-2026-06-04-002 — viewerActorId dropped when Blocks controller calls ctrlSearchActors; private harasser profiles excluded from victim's block search
- THOR BLOCKER: ELEK-2026-06-04-001 — HTML injection in m/[actorId] edge function (CANONICAL URL unescaped in HTML response; CSP report-only) — edge function, not in this module's source files; attributed here as actors domain finding
- HIGH: VEN-ACTORS-002 — searchMentionSuggestions (upload feature) + chat/setup.js hardcode p_filter='all' bypassing null-viewer guard — cross-feature bypass of this module's canonical protection
- MEDIUM: VEN-ACTORS-003 — 3 duplicate identity.search_actor_directory callsites outside actors module bypass canonical gateway; fragmented patch surface
- LOW: ELEK-2026-06-04-005 — assertActorId passes null silently; null guard contract broken
- LOW: ELEK-2026-06-04-006 — searchActorsDAL truthy-only viewerActorId check; no UUID format validation

## Engine Dependencies

| Engine | Usage |
|---|---|
| directory | identity.search_actor_directory RPC execution |

## Cross-Feature Consumers (known bypasses)

| Feature | File | Issue |
|---|---|---|
| upload | searchMentionSuggestions | Hardcodes p_filter='all' — bypasses null-viewer guard |
| chat | chat/setup.js | Hardcodes p_filter='all' — auth race bypass |
| blocks | ctrlSearchActors (Blocks path) | Drops viewerActorId — THOR BLOCKER |

## Governance Files

| File | Status |
|---|---|
| INDEX.md | STUB |
| BEHAVIOR.md | STUB |
| ARCHITECTURE.md | STUB |
| SECURITY.md | STUB |

## TODO

- [ ] Confirm searchActors.controller.js input parameters (query, viewerActorId, filter, limit?)
- [ ] Confirm identity.search_actor_directory RPC parameter names (p_query, p_filter, p_viewer_actor_id?)
- [ ] Document null-viewer guard logic — where does p_filter='public' enforcement live (controller or DAL)?
- [ ] Identify all 3 duplicate callsites noted in VEN-ACTORS-003 for cross-feature remediation
- [ ] Confirm edge function path for ELEK-2026-06-04-001 (m/[actorId] — Cloudflare Worker or Supabase Edge?)
