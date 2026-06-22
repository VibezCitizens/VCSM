---
title: Search Module — Security
status: STUB
feature: actors
module: search
source: venom-elektra-bw-derived
created: 2026-06-05
---

# actors / modules / search — SECURITY

## Status

STUB. Findings extracted from VENOM, ELEKTRA, and BlackWidow reviews (2026-06-04). Most comprehensive security review of any feature in the queue — all three scanners ran and produced findings.

## Active Security Reviews

| Review | Status | Report |
|---|---|---|
| VENOM | COMPLETE (2026-06-04) | `features/actors/outputs/2026/06/04/Venom/` |
| ELEKTRA | COMPLETE (2026-06-04) | `features/actors/outputs/2026/06/04/ELEKTRA/` |
| BlackWidow | COMPLETE (2026-06-04) | `features/actors/outputs/2026/06/04/BlackWidow/` |

## THOR BLOCKERS

### SEARCH-SEC-001 — VEN-ACTORS-001 / BW-ACTORS-001 / ELEK-2026-06-04-002

| Field | Value |
|---|---|
| Finding IDs | VEN-ACTORS-001, BW-ACTORS-001, ELEK-2026-06-04-002 |
| Severity | HIGH — THOR BLOCKER |
| Status | OPEN |
| Surface | controllers/searchActors.controller.js (Blocks caller path) |
| Description | viewerActorId is dropped when the Blocks feature calls ctrlSearchActors. Private harasser profiles are excluded from the victim's block search — victim cannot find and block a private account that is harassing them. Safety feature is broken for private actors. |
| Risk | Harassment safety bypass — private actors invisible to block search |

### SEARCH-SEC-002 — ELEK-2026-06-04-001

| Field | Value |
|---|---|
| Finding ID | ELEK-2026-06-04-001 |
| Severity | HIGH — THOR BLOCKER |
| Status | OPEN |
| Surface | m/[actorId] edge function (Cloudflare Worker or Supabase Edge — not in actors/ source) |
| Description | CANONICAL URL for actor is unescaped in HTML response from edge function. CSP is report-only only. HTML injection risk if actorId or constructed URL contains injectable characters. |
| Note | Edge function, not in actors feature source. Attributed to actors domain. |

## Other Open Findings

### SEARCH-SEC-003 — VEN-ACTORS-002 / ELEK-2026-06-04-003 / ELEK-2026-06-04-004

| Field | Value |
|---|---|
| Finding IDs | VEN-ACTORS-002, ELEK-2026-06-04-003, ELEK-2026-06-04-004 |
| Severity | HIGH |
| Status | OPEN |
| Surface | upload/searchMentionSuggestions + chat/setup.js (cross-feature callers — NOT in actors module) |
| Description | Both callsites hardcode p_filter='all' with no null-viewer guard, bypassing the canonical protection in the actors module. Upload path: unauthenticated viewer can receive non-public actors. Chat path: Zustand store may be null during hydration — auth race bypass. |

### SEARCH-SEC-004 — VEN-ACTORS-003

| Field | Value |
|---|---|
| Finding ID | VEN-ACTORS-003 |
| Severity | MEDIUM |
| Status | OPEN |
| Surface | 3 cross-feature callsites (outside actors module) calling identity.search_actor_directory directly |
| Description | Direct RPC callers bypass the canonical actors.adapter.js gateway — fragmented patch surface. Any security fix to the RPC call must be applied to all 3 locations independently. |

### SEARCH-SEC-005 — ELEK-2026-06-04-005

| Field | Value |
|---|---|
| Finding ID | ELEK-2026-06-04-005 |
| Severity | LOW |
| Status | OPEN |
| Surface | controllers/searchActors.controller.js (assertActorId) |
| Description | assertActorId passes null silently — null guard contract broken; null actorId propagates rather than failing fast |

### SEARCH-SEC-006 — ELEK-2026-06-04-006

| Field | Value |
|---|---|
| Finding ID | ELEK-2026-06-04-006 |
| Severity | LOW |
| Status | OPEN |
| Surface | dal/searchActors.dal.js |
| Description | Truthy-only viewerActorId check — no UUID format validation. A non-UUID truthy value (e.g. empty string "x") would pass the guard and be sent to the RPC as p_viewer_actor_id. |

## TODO

- [ ] Fix: pass viewerActorId in Blocks → ctrlSearchActors call (THOR BLOCKER)
- [ ] Locate and remediate m/[actorId] edge function HTML injection (THOR BLOCKER)
- [ ] Remediate upload/searchMentionSuggestions and chat/setup.js p_filter='all' hardcodes
- [ ] Add UUID format validation to searchActorsDAL viewerActorId check
- [ ] Add explicit null rejection in assertActorId (fail fast, not silent pass)
- [ ] Enumerate all 3 direct RPC callsites (VEN-ACTORS-003) for consolidation into adapter
