---
title: UI Module — Security
status: STUB
feature: explore
module: ui
source: venom+bw-derived
created: 2026-06-05
---

# explore / modules / ui — SECURITY

## THOR Status

**THOR RELEASE BLOCKER — UI-SEC-001**

## Findings

### UI-SEC-001 — Raw UUID in Post and Actor Navigation URLs [THOR BLOCKER]
| Field | Value |
|---|---|
| ID | UI-SEC-001 |
| Source Findings | VEN-EXPLORE-003, BW-EXPLORE-005 |
| Severity | MEDIUM — THOR BLOCKER |
| Surface | ui/PostCard.jsx → /posts/{post.id}; ui/ActorSearchResultRow.jsx → /profile/{actor_id} fallback |
| Description | Post navigation always uses raw UUID post.id. Actor navigation falls back to raw actor_id when username is null. Both confirmed adversarially BYPASSED. Violates platform no-raw-IDs-in-URLs policy. |
| Status | OPEN |
| THOR | BLOCKS RELEASE |

### UI-SEC-002 — /explore Route Access Level Ambiguity
| Field | Value |
|---|---|
| ID | UI-SEC-002 |
| Source Finding | ARCHITECT observation |
| Severity | INFO |
| Surface | ui/index.jsx barrel vs scanner route-map classification |
| Description | ui/index.jsx declares `public: false` but scanner route-map classifies /explore as public. Ambiguity means auth requirements are unverified. Must reconcile before release. |
| Status | OPEN — UNVERIFIED |
| THOR | Not blocked |

## Remediation

1. UI-SEC-001: replace post.id with post.slug in PostCard.jsx navigation
2. UI-SEC-001: replace actor_id fallback in ActorSearchResultRow.jsx with graceful error state (no navigation when username null)
3. UI-SEC-002: confirm /explore route guard; update barrel public flag to match intended access
