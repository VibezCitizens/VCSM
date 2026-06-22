---
title: Flow Module — Security
status: STUB
feature: onboarding
module: flow
source: venom+bw-derived
created: 2026-06-05
---

# onboarding / modules / flow — SECURITY

## THOR Status

**THOR RELEASE BLOCKER — FLOW-SEC-001, FLOW-SEC-002, FLOW-SEC-003**

## Findings

### FLOW-SEC-001 — Vibe Tag Write Not Session-Bound [THOR BLOCKER]
| Field | Value |
|---|---|
| ID | FLOW-SEC-001 |
| Source Findings | VEN-ONBOARDING-001, BW-ONBOARD-001 (HIGH) |
| Severity | HIGH |
| Surface | vibeTagsOnboarding.controller.js → replaceSelectedVibeTagsDAL → vc.vibe_actor_tags |
| Description | saveVibeTagsOnboardingController accepts actorId from parameter with no session re-verification. Any caller can write vibe tags for any actor. RLS unverified. Adversarially confirmed BYPASSED. |
| Status | OPEN |
| THOR | BLOCKS RELEASE |

### FLOW-SEC-002 — Dead Exported Step Completion Write With No Ownership Guard [THOR BLOCKER]
| Field | Value |
|---|---|
| ID | FLOW-SEC-002 |
| Source Findings | VEN-ONBOARDING-002, BW-ONBOARD-002 (CRITICAL) |
| Severity | CRITICAL |
| Surface | dal/onboardingSteps.dal.js → markActorOnboardingStepCompletedDAL (exported) |
| Description | markActorOnboardingStepCompletedDAL is a dead exported write function — no controller wrapper, no ownership check, no session verification. Any importer can forge onboarding step completion for any actor. Adversarially confirmed BYPASSED. |
| Status | OPEN |
| THOR | BLOCKS RELEASE |

### FLOW-SEC-003 — vc.vibe_actor_tags RLS Unverified [THOR BLOCKER]
| Field | Value |
|---|---|
| ID | FLOW-SEC-003 |
| Source Findings | BW-ONBOARD-004 (HIGH) |
| Severity | HIGH |
| Surface | vc.vibe_actor_tags — RLS policy status |
| Description | RLS on vc.vibe_actor_tags is UNVERIFIED. Query-level actor filter exists but table-level RLS is unconfirmed. If absent, bulk writes for foreign actors are possible at DB level. |
| Status | UNRESOLVED |
| THOR | BLOCKS RELEASE |

### FLOW-SEC-004 — Onboarding Cards Controller No Session Verification
| Field | Value |
|---|---|
| ID | FLOW-SEC-004 |
| Source Findings | VEN-ONBOARDING-006, BW-ONBOARD-003 (MEDIUM) |
| Severity | MEDIUM |
| Surface | controller/onboarding.controller.js → getOnboardingCardsController |
| Description | actorId null-check only — no session verification. Non-null actorId returns profile completion data for any actor (information disclosure). Adversarially PARTIAL. |
| Status | OPEN |
| THOR | Not blocked |

### FLOW-SEC-005 — profileId/vportId Architecture Leak in Controller
| Field | Value |
|---|---|
| ID | FLOW-SEC-005 |
| Source Findings | VEN-ONBOARDING-003 (MEDIUM) |
| Severity | MEDIUM |
| Surface | controller/onboarding.controller.helpers.js → mapActorRow |
| Description | profileId and vportId surfaced into controller layer via mapActorRow — architecture contract violation. These internal IDs should not leak above the DAL/model boundary. |
| Status | OPEN |
| THOR | Not blocked |

### FLOW-SEC-006 — Non-Atomic Void+Upsert Race on Vibe Tags
| Field | Value |
|---|---|
| ID | FLOW-SEC-006 |
| Source Findings | BW-ONBOARD-006 (LOW) |
| Severity | LOW |
| Surface | dal/vibeTags.dal.js → replaceSelectedVibeTagsDAL |
| Description | Non-atomic void-all then upsert sequence. Concurrent double-submit creates race window where all tags are voided before re-insertion, leaving actor with no tags. |
| Status | OPEN |
| THOR | Not blocked |

### FLOW-SEC-007 — PII in Production Console Logs
| Field | Value |
|---|---|
| ID | FLOW-SEC-007 |
| Source Findings | VEN-ONBOARDING-004/005, BW-ONBOARD-007/008 (LOW/INFO) |
| Severity | LOW |
| Surface | vibeInvites.dal.js, useOnboardingCards.js, onboarding.controller.helpers.js |
| Description | Multiple DEV PROBE console.log/error calls emit actorId and raw Supabase error details with no DEV guard. PII leaks to production browser console. |
| Status | OPEN |
| THOR | Not blocked |

## ELEKTRA Status

ELEKTRA has NOT been run on this feature.
