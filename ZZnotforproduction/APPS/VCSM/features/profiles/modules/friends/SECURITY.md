---
title: Friends Module — Security
status: STUB
feature: profiles
module: friends
source: venom+bw-derived
created: 2026-06-05
---

# profiles / modules / friends — SECURITY

## THOR Status

**THOR RELEASE BLOCKER — FRIENDS-SEC-001, FRIENDS-SEC-002**

## Findings

### FRIENDS-SEC-001 — IDOR on Friend Rank Writes [THOR BLOCKER]
| Field | Value |
|---|---|
| ID | FRIENDS-SEC-001 |
| Source Findings | VEN-PROFILES-002, BW-PROF-001 (CRITICAL) |
| Severity | CRITICAL |
| Surface | controller/friends/saveTopFriendRanks.controller.js; ownerActorId from useParams() |
| Description | ownerActorId is derived from URL parameters (useParams), not session identity. Any authenticated user can write friend ranks on behalf of any actor by navigating to /profile/:targetSlug and triggering the save flow. No session binding at controller layer. Adversarially confirmed BYPASSED. |
| Status | OPEN |
| THOR | BLOCKS RELEASE |

### FRIENDS-SEC-002 — Hook Accepts ownerActorId as External Argument
| Field | Value |
|---|---|
| ID | FRIENDS-SEC-002 |
| Source Findings | BW-PROF-004 (HIGH) |
| Severity | HIGH |
| Surface | hooks/useSaveTopFriendRanks — ownerActorId parameter |
| Description | useSaveTopFriendRanks hook accepts ownerActorId as an external argument with no useIdentity() binding. Structural weakness that propagates IDOR risk from component layer through to write path. |
| Status | OPEN |
| THOR | BLOCKS RELEASE |

## ELEKTRA Status

ELEKTRA has NOT been run on this feature.
