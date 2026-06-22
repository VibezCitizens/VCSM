# Identity Architecture Ticket Folder

**Feature:** `apps/VCSM/src/features/identity/`
**Date:** 2026-06-06
**Type:** Planning / Architecture Governance
**Status:** Active

---

## Purpose

This folder contains the complete architecture planning system for the `identity` feature and all
features that depend on it. It is ordered from least risky (documentation capture) to heaviest
(source-code change planning). No source file is touched until a Heavy ticket is explicitly
approved by the owner.

Coverage:
- Current state capture from scanner and source
- Boundary clarification between `identity` and `actors`
- Adapter contract definition
- Full 41-consumer inbound audit
- Per-consumer dependency audits (chat, settings, notifications, profiles, auth)
- Engine alias vs feature adapter policy decision
- Shared actor types extraction planning
- actors → identity merge planning

---

## Source Documents Read

| Document | Path |
|---|---|
| Bidirectional Dependency Decision | `ARCHITECTURETICKETING/BIDIR_DEPENDENCY_DECISION.md` |
| Feature Import Map (JSON) | `ARCHITECTURETICKETING/FEATURE_IMPORT_MAP.json` |
| Feature Import Map (Markdown) | `ARCHITECTURETICKETING/FEATURE_IMPORT_MAP.md` |
| Features Architecture Review | `ARCHITECTURETICKETING/FEATURES_ARCHITECTURE_REVIEW.md` |
| Features Ticket Plan | `ARCHITECTURETICKETING/FEATURES_TICKET_PLAN.md` |
| Scanner Architecture Audit | `ARCHITECTURETICKETING/SCANNER_ARCHITECTURE_AUDIT.md` |
| Actor-First Architecture Audit | `Identity/actor-first-architecture-audit.md` |
| Actor Ownership Architecture Audit | `Identity/ACTOR_OWNERSHIP_ARCHITECTURE_AUDIT_2026-06-06.md` |
| Actor Model Audit | `Identity/ACTOR_MODEL_AUDIT_2026-06-06.md` |
| Actor-First Remediation Plan | `Identity/ACTOR_FIRST_REMEDIATION_PLAN_2026-06-06.md` |

---

## Rules for Working Identity Tickets

1. Read this README before opening any ticket.
2. Do not modify app source code in any Light or Medium ticket. Only Heavy tickets
   may authorize source changes, and only after owner approval.
3. Do not invent dependencies. All claimed imports must trace to `FEATURE_IMPORT_MAP.json`,
   `BIDIR_DEPENDENCY_DECISION.md`, or direct source file reads. Mark unknown counts as UNKNOWN.
4. Preserve the layer rule without exception:
   - Controller decides ownership.
   - DAL executes scoped queries.
   - RLS enforces database security.
   - DAL may filter by actorId.
   - DAL must not query ownership tables to decide access.
5. Do not rename, refactor, or restructure source files in planning tickets.
6. No ticket may begin until its listed Blocked By entries are closed.
7. Work tickets in the order defined in IDENTITY_EXECUTION_ORDER.md.
8. The CONTRACTS/ folder is read-only. Do not write to it without explicit per-request
   user authorization.

---

## What Counts as Planning vs Implementation

| Category | Weight | Source Change? |
|---|---|---|
| Current state documentation | Light | No |
| Boundary description | Light | No |
| Dependency listing | Light | No |
| Import consumer audit (read + trace) | Light-Medium | No |
| Adapter contract definition | Light-Medium | No |
| Per-feature dependency audit | Medium | No |
| Engine alias policy decision | Medium | No |
| Shared type schema design | Medium-Heavy | No |
| actors → identity merge plan | Heavy | No (plan only) |
| Source-code change | Heavy | Yes — requires separate impl ticket + owner approval |

---

## Execution Order Principle

Risk order: least risky first, heaviest last.

```
IDENTITY-001  Documentation — current state capture
IDENTITY-002  Boundary clarification — actors vs identity
IDENTITY-003  Adapter contract definition
IDENTITY-004  Import consumers audit (41 inbound)
IDENTITY-005  Chat dependency audit
IDENTITY-006  Settings dependency audit
IDENTITY-007  Notifications dependency audit
IDENTITY-008  Profiles dependency audit
IDENTITY-009  Auth/session boundary
IDENTITY-010  Engine alias policy
IDENTITY-011  Shared actor types planning
IDENTITY-012  actors → identity merge planning
```

Tickets 1–4: zero-risk, documentation and audit only.
Tickets 5–8: per-feature dependency audits, read-only source inspection.
Tickets 9–10: boundary decisions, no source changes.
Tickets 11–12: planning documents for future Heavy implementation tickets.

No implementation ticket may be opened until IDENTITY-012 is reviewed and approved.
