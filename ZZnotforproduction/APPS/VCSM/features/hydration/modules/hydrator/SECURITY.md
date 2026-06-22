---
title: Hydrator Module — Security
status: STUB
feature: hydration
module: hydrator
source: venom+bw-derived
created: 2026-06-05
---

# hydration / modules / hydrator — SECURITY

## THOR Status

**THOR RELEASE BLOCKER — HYDR-SEC-001, HYDR-SEC-002, HYDR-SEC-003, HYDR-SEC-004**

## Findings

### HYDR-SEC-001 — PII Fields in Actor Identity Object [THOR BLOCKER]
| Field | Value |
|---|---|
| ID | HYDR-SEC-001 |
| Source Findings | VEN-HYDRATION-003, BW-HYDR-002 |
| Severity | HIGH — THOR BLOCKER |
| Surface | vcsmActorHydrator.js → mapProfileActor |
| Description | PII fields (email, birthdate, age, sex, is_adult, last_seen) fetched from profile table and mapped into the actor identity hydration object. These fields propagate into the Zustand hydration store and are accessible to any component consuming useActorSummary or the hydration store. Adversarially confirmed BYPASSED (BW-HYDR-002). |
| Status | OPEN |
| THOR | BLOCKS RELEASE |

### HYDR-SEC-002 — upsertActors Publicly Exported [THOR BLOCKER]
| Field | Value |
|---|---|
| ID | HYDR-SEC-002 |
| Source Findings | BW-HYDR-001 |
| Severity | HIGH — THOR BLOCKER |
| Surface | engines/hydration/src/store.js → upsertActors export |
| Description | upsertActors is publicly exported from the hydration engine store. Any caller can write arbitrary actor data into the hydration store, poisoning display names, avatars, and route paths for any actor. Adversarially confirmed PARTIAL (export exists, exploitation depends on access to import). |
| Status | OPEN |
| THOR | BLOCKS RELEASE |

### HYDR-SEC-003 — Mixed Shape Return (camelCase vs snake_case) [THOR BLOCKER]
| Field | Value |
|---|---|
| ID | HYDR-SEC-003 |
| Source Findings | BW-HYDR-003 |
| Severity | HIGH — THOR BLOCKER |
| Surface | engines/hydration/src/hydrate.js → hydrateAndReturnSummaries |
| Description | Fresh hydration returns camelCase-normalized actor summary. Stale cache path returns snake_case shape from the store without normalization. Consumers accessing fields like displayName get undefined on stale results (snake_case has display_name). Silent failures — no error thrown. Adversarially confirmed BYPASSED. |
| Status | OPEN |
| THOR | BLOCKS RELEASE |

### HYDR-SEC-004 — Raw UUID in useActorSummary.route Fallback [THOR BLOCKER]
| Field | Value |
|---|---|
| ID | HYDR-SEC-004 |
| Source Findings | BW-HYDR-004 |
| Severity | HIGH — THOR BLOCKER |
| Surface | engines/hydration/src/useActorSummary.js → route field |
| Description | useActorSummary.route returns `/profile/${actorId}` when username is null. This exposes raw actor UUID in navigation routes, violating the platform no-raw-IDs-in-URLs policy. Any component using useActorSummary.route as a navigation target may render UUID URLs. Adversarially confirmed BYPASSED. |
| Status | OPEN |
| THOR | BLOCKS RELEASE |

### HYDR-SEC-005 — Inline DB Query Without DAL Wrapper
| Field | Value |
|---|---|
| ID | HYDR-SEC-005 |
| Source Findings | VEN-HYDRATION-002 |
| Severity | MEDIUM |
| Surface | vcsmActorHydrator.js lines 65–70 |
| Description | Direct .schema("vport").from("profile_actor_access").select("actor_id") query inline in the hydrator. No DAL abstraction. No app-layer auth gate. RLS assumed at DB layer. Bypasses architectural DAL boundary. |
| Status | OPEN |
| THOR | Not blocked independently |

### HYDR-SEC-006 — No App-Layer Auth Gate on RPC
| Field | Value |
|---|---|
| ID | HYDR-SEC-006 |
| Source Findings | VEN-HYDRATION-001 |
| Severity | MEDIUM |
| Surface | engines/hydration/src/dal.js → vc.get_actor_summaries RPC |
| Description | vc.get_actor_summaries RPC called with no app-layer authentication check. Safety relies entirely on Supabase RLS. If RLS is misconfigured, any actorId resolves. |
| Status | OPEN — RLS assumed |
| THOR | Not blocked |

### HYDR-SEC-007 — ownerActorId in Public Identity Surface
| Field | Value |
|---|---|
| ID | HYDR-SEC-007 |
| Source Findings | VEN-HYDRATION-004 |
| Severity | MEDIUM |
| Surface | engines/hydration → toPublicIdentity() → ownerActorId field |
| Description | ownerActorId exposed through the public useIdentity() surface via toPublicIdentity(). Internal ownership relationship surfaced to any consuming component. |
| Status | OPEN |
| THOR | Not blocked |

### HYDR-SEC-008 — No Session Gate on Hydration Controllers
| Field | Value |
|---|---|
| ID | HYDR-SEC-008 |
| Source Findings | BW-HYDR-005 |
| Severity | MEDIUM |
| Surface | engines/hydration/src/controller/hydrateActor.controller.js |
| Description | Hydration controllers have no session gate. Any arbitrary actorId submission triggers owner resolution queries. Low exploitability (read-only) but no auth boundary. |
| Status | OPEN — PARTIAL |
| THOR | Not blocked |

### HYDR-SEC-009 — Debug Events Without Call-Site DEV Guard
| Field | Value |
|---|---|
| ID | HYDR-SEC-009 |
| Source Findings | VEN-HYDRATION-005, BW-HYDR-008 |
| Severity | LOW |
| Surface | ENGINE_RESOLVE_START and HYDRATION_START events |
| Description | Debug window events emit userId and allActorIds. Production safety relies on @debuggers stub substitution at build time. No IS_DEV guard at event emission call site. |
| Status | OPEN — PARTIAL (production-safe via stub) |
| THOR | Not blocked |

### HYDR-SEC-010 — No Actor Eviction for Deleted/Blocked Actors
| Field | Value |
|---|---|
| ID | HYDR-SEC-010 |
| Source Findings | VEN-HYDRATION-006, BW-HYDR-007 |
| Severity | LOW |
| Surface | engines/hydration/src/store.js — 5-min TTL, no eviction |
| Description | Deleted, blocked, or deactivated actors remain in the hydration store for up to 5 minutes. A deleted actor's display name and avatar continue rendering in UI during the stale window. |
| Status | OPEN — PARTIAL |
| THOR | Not blocked |

## ELEKTRA Status

ELEKTRA has NOT been run on this feature. Run before next release.

## Remediation Priority

1. HYDR-SEC-001: remove PII columns from vcsmActorHydrator.js SELECT
2. HYDR-SEC-002: make upsertActors internal to engine (remove export)
3. HYDR-SEC-003: normalize stale path to camelCase before returning
4. HYDR-SEC-004: return null/undefined for route when username is null; let callers handle gracefully
5. HYDR-SEC-005: wrap inline query in named DAL function
