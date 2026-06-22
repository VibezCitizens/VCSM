# BEHAVIOR.md — Canonical Template and Authoring Guide

**Document Type:** Governance Template (Authoritative)
**Ticket:** TICKET-BEHAV-TEMPLATE-001
**Status:** ACTIVE
**Version:** 1.0
**Created:** 2026-06-02
**Owner:** WOLVERINE (intake) / Engineering Team (authoring)
**Category Key:** platform-documentation

---

## What Is BEHAVIOR.md?

BEHAVIOR.md is the **11th canonical governance file** in every CURRENT feature folder.

It is the single authoritative source of truth for **intended feature behavior**.

It answers:
- What should this feature do?
- Who is allowed to use it?
- What is the happy path?
- What failure paths must the system handle?
- What data should change and how?
- What UI or output should appear?
- What must never happen under any conditions?
- What tests prove the behavior is working?

**BEHAVIOR.md is authoritative and human-authored. It is never generated from source code.**
The source code is derived from BEHAVIOR.md, not the reverse.

---

## File Locations

Three valid locations depending on scope:

```
CURRENT/features/[feature]/BEHAVIOR.md
CURRENT/features/dashboard/modules/[module]/BEHAVIOR.md
CURRENT/features/dashboard/tabs/[tab]/BEHAVIOR.md
```

One BEHAVIOR.md per scope level. Dashboard modules and tabs get their own because
their behavioral contracts frequently differ from the parent feature.

---

## Behavior ID Formats

All IDs use the canonical Category Key from CATEGORY_REGISTRY.md.

| ID Type | Format | Example |
|---|---|---|
| Behavior | BEH-[CATEGORY-KEY]-NNN | BEH-BOOKING-001 |
| Acceptance Criterion | AC-[CATEGORY-KEY]-NNN | AC-BOOKING-001 |
| Test Requirement | TESTREQ-[CATEGORY-KEY]-NNN | TESTREQ-BOOKING-001 |
| Open Question | OQ-NNN | OQ-001 |

IDs are assigned sequentially within a feature. Once assigned, never reassigned or reused.

---

## Status Lifecycle

```
DRAFT → REVIEWED → APPROVED → SUPERSEDED
```

| Status | Meaning |
|---|---|
| DRAFT | Created by WOLVERINE intake; not yet reviewed |
| REVIEWED | Engineering team reviewed; awaiting sign-off |
| APPROVED | Signed off; implementation may proceed; THOR gate eligible |
| SUPERSEDED | Replaced by a newer version; replacement must be APPROVED |

WOLVERINE does not produce an implementation plan until BEHAVIOR.md status is APPROVED.
THOR blocks P0/P1 release when BEHAVIOR.md is missing or not APPROVED.

---

## Authoring Rules

1. Write every BEH statement in declarative form: "A Citizen can..." / "The system must..."
2. Write §9 (Must Never Happen) entries as absolute prohibitions: "A Citizen must never..."
3. Every TESTREQ must reference exactly one BEH or AC ID.
4. Every AC must have at least one TESTREQ.
5. §5 Security Rules must name the actor, the ownership check, and the rejection condition.
6. §6 Data Changes must name the table, operation, and the condition that triggers it.
7. §8 Side Effects must list every notification, post, analytics event, and engine call.
8. §14 Open Questions must be resolved before status moves from REVIEWED to APPROVED.

---

## Required Commands Before Authoring

Run DR. STRANGE for the target feature before authoring BEHAVIOR.md.
DR. STRANGE will provide current feature status, security posture, and open blockers.

---

## Template

Copy everything below this line into CURRENT/features/[feature]/BEHAVIOR.md.

─────────────────────────────────────────────────────────────────────────────

```markdown
# Feature Behavior Contract — [Feature Name]

**Behavior ID Prefix:** BEH-[CATEGORY-KEY]
**Status:** DRAFT
**Version:** 1.0
**Ticket:** [ticket-id that created this]
**Last Updated:** YYYY-MM-DD
**Category Key:** [from CATEGORY_REGISTRY.md]
**CURRENT Path:** CURRENT/features/[feature]/BEHAVIOR.md

---

## 1. User Goal

What is the user trying to accomplish with this feature?
One or two sentences. Written from the user's perspective.

---

## 2. Actors / Roles

| Actor | Access Level | Ownership Requirement |
|---|---|---|
| [e.g. Citizen] | [owner / member / public / system / admin] | [e.g. must own the VPort] |

---

## 3. Happy Paths

For each primary success flow:

### HP-1: [Flow Name]

**BEH-[CATEGORY-KEY]-001:** [Behavior statement — declarative, one sentence]

- Precondition:
- Steps:
- Expected outcome:
- Data changes:

---

## 4. Failure Paths

For each failure case:

### FP-1: [Failure Case Name]

**BEH-[CATEGORY-KEY]-NNN:** [Behavior statement]

- Trigger condition:
- Expected system behavior:
- UI message (if any):
- Logging / side effects:

---

## 5. Security Rules

For each access control rule:

**BEH-[CATEGORY-KEY]-NNN:** [Security behavior statement — declarative]

- Who can trigger this flow (actor + ownership check)
- What ownership proof is verified
- What auth or session claims are checked
- What must be rejected even with a valid authenticated session

---

## 6. Data Changes

| Table | Operation | Condition | Notes |
|---|---|---|---|
| [table name] | INSERT / UPDATE / DELETE | [when this occurs] | [constraints or notes] |

---

## 7. UI Outputs

| Trigger | UI Response | Notes |
|---|---|---|
| [user action or system event] | [screen / modal / toast / redirect] | |

---

## 8. Side Effects

Non-data-change effects that occur on the happy path:
- Notifications triggered:
- Posts published to feed:
- Analytics events fired:
- Engine calls made:
- External services called:

---

## 9. Must Never Happen

**BEH-[CATEGORY-KEY]-NNN:** [Prohibited behavior statement — absolute prohibition]

These are hard invariants. Violation of any §9 entry is a P0 production incident.
Every §9 entry must have a corresponding passing test before any release proceeds.

---

## 10. Acceptance Criteria

**AC-[CATEGORY-KEY]-001:** [Verifiable, objective criterion]

Each AC must be deterministically verifiable. No subjective criteria allowed.

---

## 11. Test Requirements

**TESTREQ-[CATEGORY-KEY]-001:** Verify [BEH-ID or AC-ID] by [test method].

Every TESTREQ must reference exactly one BEH or AC ID.
Enforced format: "Verify [ID] by [method]."

---

## 12. Native / Alternate UI Parity

Does this feature need to match a native iOS or Android implementation?

| BEH ID | Web Behavior | Native Expected | Parity Status |
|---|---|---|---|
| | | | MATCH / DIVERGES / NOT APPLICABLE |

---

## 13. Engine Dependencies

| Engine | Used For | Contract File |
|---|---|---|
| [engine name] | [purpose] | [CURRENT path to engine contract] |

---

## 14. Open Questions

| ID | Question | Owner | Status |
|---|---|---|---|
| OQ-001 | [question] | [owner] | OPEN / RESOLVED |
```

─────────────────────────────────────────────────────────────────────────────

---

## Command Integrations At a Glance

| Command | What It Does With BEHAVIOR.md |
|---|---|
| WOLVERINE | Runs intake (Q1–Q10); creates DRAFT; gates implementation on APPROVED |
| PROFESSOR X | Reads all sections; produces Behavior Compliance Report per feature |
| DR. STRANGE | Reports Behavior Contract Coverage column in feature status output |
| SPIDER-MAN | Must anchor all test recommendations to BEH/AC/TESTREQ IDs (Rules S1–S10) |
| THOR | Runs Behavior Release Gate (Gates 1–6); blocks P0/P1 without APPROVED + tested §9 |
| VENOM | Reads §5 Security Rules and §9 Must Never Happen; cross-checks against source |
| BLACKWIDOW | Reads §4 Failure Paths and §9 Must Never Happen as primary attack surface |
| ELEKTRA | Anchors source→sink chains to §5 Security Rules |
| ARCHITECT | Checks source structure supports declared behavior; flags declared-but-unbuilt |
| LOGAN | Adds BEHAVIOR.md to 11/11 feature folder standard and documentation index |
| HAWKEYE | Verifies API endpoints match §3 Happy Path actor and data change contracts |
| IRONMAN | Maps §2 Actors/Roles to ownership responsibility |
| FALCON | Reads §12 Native Parity for iOS transfer audit |
| WINTERSOLDIER | Reads §12 Native Parity for Android parity audit |
| CARNAGE | Cross-references §6 Data Changes against migration proposals |
| DATAENGINEER | Anchors DAL and RPC recommendations to §6 Data Changes |
| VISION | Verifies analytics events in §8 match actual telemetry instrumentation |
| SENTRY | Checks §13 Engine Dependencies against actual imports |

---

*Template Version 1.0 | Created 2026-06-02 | Ticket: TICKET-BEHAV-TEMPLATE-001*
