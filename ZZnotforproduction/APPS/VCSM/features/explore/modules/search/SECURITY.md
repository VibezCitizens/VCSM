---
title: Search Module — Security
status: STUB
feature: explore
module: search
source: venom+bw-derived
created: 2026-06-05
---

# explore / modules / search — SECURITY

## THOR Status

**THOR RELEASE BLOCKER — SEARCH-SEC-001**

## Findings

### SEARCH-SEC-001 — viewerActorId Always Null in Primary Search Path [THOR BLOCKER]
| Field | Value |
|---|---|
| ID | SEARCH-SEC-001 |
| Source Findings | VEN-EXPLORE-002, BW-EXPLORE-001 |
| Severity | HIGH — THOR BLOCKER |
| Surface | controller/searchResults.controller.js → search.dal.js → identity.search_actor_directory |
| Description | viewerActorId is never injected from the authenticated session in ctrlSearchResults. The RPC receives p_viewer_actor_id: null on every call. Consequence: blocked actor suppression is never applied in the primary search path. A user who has blocked another actor will see that actor in search results. BW-EXPLORE-001 adversarially confirmed: BYPASSED. |
| Status | OPEN |
| THOR | BLOCKS RELEASE |

### SEARCH-SEC-002 — searchPosts No Viewer-Scoped Filter
| Field | Value |
|---|---|
| ID | SEARCH-SEC-002 |
| Source Findings | BW-EXPLORE-003 |
| Severity | MEDIUM |
| Surface | dal/search.dal.js → searchPosts, searchPostsByTag |
| Description | Post search queries have no viewer-scoped filter. If vc.posts RLS does not restrict private actor content for the query context, private posts from private accounts may appear in search results. RLS coverage unconfirmed for this query path. |
| Status | OPEN — UNVERIFIED (depends on vc.posts RLS) |
| THOR | Not blocked independently |

### SEARCH-SEC-003 — Cache Not Scoped to Viewer Identity
| Field | Value |
|---|---|
| ID | SEARCH-SEC-003 |
| Source Findings | VEN-EXPLORE-004 |
| Severity | MEDIUM |
| Surface | hooks/useSearchScreenController.js — 45s staleTime cache |
| Description | Module-level search cache is not keyed by viewerActorId. On shared devices or after actor switch, the second session briefly sees the first actor's cached results. Blocked actors in cached results are not re-evaluated on actor switch. |
| Status | OPEN |
| THOR | Not blocked independently |

### SEARCH-SEC-004 — Legacy userId/ownerUserId in Model Outputs
| Field | Value |
|---|---|
| ID | SEARCH-SEC-004 |
| Source Findings | VEN-EXPLORE-005 |
| Severity | LOW |
| Surface | model/search.model.js → mapActorSearchResult, mapVportSearchResult |
| Description | mapActorSearchResult includes userId field; mapVportSearchResult includes ownerUserId field. Both are legacy fields violating the VCSM identity contract (raw user IDs must not appear in model outputs). |
| Status | OPEN |
| THOR | Not blocked |

### SEARCH-SEC-005 — Fire-and-Forget Hydration with Silenced Errors
| Field | Value |
|---|---|
| ID | SEARCH-SEC-005 |
| Source Findings | BW-EXPLORE-004 |
| Severity | LOW |
| Surface | controller/searchResults.controller.js → hydrateActorsByIds |
| Description | hydrateActorsByIds is called fire-and-forget with errors silenced. Unvalidated RPC data may be written to the hydration store if the RPC returns partial or unexpected data. Low severity — hydration store is read-only display layer. |
| Status | OPEN — PARTIAL |
| THOR | Not blocked |

## ELEKTRA Status

ELEKTRA has NOT been run on this feature. Run before next release.

## Remediation Priority

1. SEARCH-SEC-001: inject viewerActorId from authenticated session into ctrlSearchResults before every RPC call
2. SEARCH-SEC-002: confirm vc.posts RLS scope; add viewer filter if RLS does not cover
3. SEARCH-SEC-003: key cache by viewerActorId; invalidate on actor switch / logout
