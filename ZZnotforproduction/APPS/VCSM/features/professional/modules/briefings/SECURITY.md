---
title: Briefings Module — Security
status: STUB
feature: professional
module: briefings
source: venom+bw-derived
created: 2026-06-05
---

# professional / modules / briefings — SECURITY

## THOR Status

**THOR RELEASE BLOCKER — BRIEF-SEC-001, BRIEF-SEC-002**

## Findings

### BRIEF-SEC-001 — Mark-Seen actorId Not Session-Bound [THOR BLOCKER]
| Field | Value |
|---|---|
| ID | BRIEF-SEC-001 |
| Source Findings | VEN-PROFESSIONAL-002, BW-PROF-001 (HIGH) |
| Severity | HIGH |
| Surface | briefings/dal/professionalBriefings.read.dal.js → dalMarkProfessionalBriefingsSeen |
| Description | dalMarkProfessionalBriefingsSeen uses client-supplied actorId as UPDATE filter on vc.notifications. No session binding at controller or DAL layer. RLS unverified. Adversarially PARTIAL. |
| Status | OPEN |
| THOR | BLOCKS RELEASE |

### BRIEF-SEC-002 — vc.notifications RLS Unverified (Compliance Domain) [THOR BLOCKER]
| Field | Value |
|---|---|
| ID | BRIEF-SEC-002 |
| Source Findings | VEN-PROFESSIONAL-003, BW-PROF-003 (HIGH) |
| Severity | HIGH |
| Surface | vc.notifications table — RLS policy status |
| Description | vc.notifications SELECT and UPDATE RLS unverified. Content includes HIPAA/compliance domain. If RLS absent, cross-actor notification content is readable by any authenticated user. Adversarially UNRESOLVED. |
| Status | UNRESOLVED |
| THOR | BLOCKS RELEASE |

### BRIEF-SEC-003 — linkPath Open Redirect
| Field | Value |
|---|---|
| ID | BRIEF-SEC-003 |
| Source Findings | VEN-PROFESSIONAL-004, BW-PROF-006 (MEDIUM) |
| Severity | MEDIUM |
| Surface | briefings/components/BriefingsList.jsx → navigate(item.linkPath) |
| Description | linkPath from vc.notifications passed unsanitized to navigate(). Open-redirect to external origin plausible. javascript: execution blocked by React Router. Adversarially PARTIAL. |
| Status | OPEN |
| THOR | Not blocked |

## ELEKTRA Status

ELEKTRA has NOT been run on this feature.
