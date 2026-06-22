---
title: Profile Module — Security
status: STUB
feature: profiles
module: profile
source: venom+bw-derived
created: 2026-06-05
---

# profiles / modules / profile — SECURITY

## THOR Status

**THOR RELEASE BLOCKER — PROF-SEC-001, PROF-SEC-002**

## Findings

### PROF-SEC-001 — Raw UUID in Profile URL on Slug Fallback [THOR BLOCKER]
| Field | Value |
|---|---|
| ID | PROF-SEC-001 |
| Source Findings | BW-PROF-010 (HIGH) |
| Severity | HIGH |
| Surface | controller/buildActorCanonicalSlug.controller.js:89 |
| Description | When slug resolution fails, buildActorCanonicalSlug falls back to bare actorId UUID in the public-facing profile URL. Violates platform no-raw-IDs-in-public-URLs policy. Adversarially confirmed BYPASSED. |
| Status | OPEN |
| THOR | BLOCKS RELEASE |

### PROF-SEC-002 — Raw UUID in Post Share URL [THOR BLOCKER]
| Field | Value |
|---|---|
| ID | PROF-SEC-002 |
| Source Findings | BW-PROF-011 (HIGH) |
| Severity | HIGH |
| Surface | useActorProfileActions.js:31 — /post/{postId} |
| Description | Post share URL constructed from raw UUID postId. Violates platform no-raw-IDs-in-public-URLs policy. Adversarially confirmed BYPASSED. |
| Status | OPEN |
| THOR | BLOCKS RELEASE |

## ELEKTRA Status

ELEKTRA has NOT been run on this feature.
