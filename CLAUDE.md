# VCSM Workspace — Global Rules

This workspace contains two completely separate products. They share engines and a contract, but they must never be mixed.

## The Two Apps

| App | Path | Product |
|-----|------|---------|
| **VCSM** | `apps/VCSM/` | Social marketplace hybrid platform (Instagram + Airbnb) |
| **Wentrex** | `apps/wentrex/` | Standalone multi-tenant LMS SaaS |

## Non-Negotiable Rules

- **Never import from one app into the other.** `apps/VCSM` and `apps/wentrex` are fully isolated products.
- **Never assume a pattern from one app applies to the other.** They share contracts and engines, but have different domain models, UI structures, and product logic.
- **Always confirm which app you are working in before making changes.** If the task is ambiguous, ask.
- **Never move features between apps.** If both apps need something similar, it belongs in `engines/` or `shared/`, not copied between apps.
- **Both apps have LMS features — they are not the same LMS.** VCSM has an embedded `/learning` route. Wentrex IS a standalone LMS SaaS. Do not conflate them.

## Shared Infrastructure (Safe to Consume from Both Apps)

- `engines/` — reusable domain engines (chat, notifications, etc.)
- `shared/` — domain-neutral primitives (UI, utils, types)
- `contract/` — locked architecture contracts

## Dependency Direction

```
apps/VCSM     ──┐
                ├──→ engines/ ──→ shared/
apps/wentrex  ──┘
```

Apps never depend on each other. Ever.

## Architecture Contract

All code in this workspace must comply with the contracts in `contract/`. Run `/review-contract <path>` to check any file or folder.

## Wentrex Architecture Review

When the user says "review wentrex", "audit wentrex", or "run deep wentrex review", follow the spec in `apps/wentrex/REVIEW.md`.

## Security Engineering Contract

All backend, auth, database, and infrastructure work must follow `SECURITY_ENGINEERING_CONTRACT.md`.

The system must follow:
- least privilege
- defense in depth
- strict authorization
- RLS enforcement
- secure secrets management
- safe input validation

## Senior Developer Execution Contract

All work must follow `SENIOR_DEVELOPER_CONTRACT.md`.

Default behavior:
- act as a premium advanced senior developer
- verify before claiming
- never make unknown facts up
- preserve frozen systems
- make minimal correct changes
- respect architecture and ownership boundaries
- report confirmed vs likely vs uncertain clearly

## Strategic Reality Debrief Contract

For product analysis, strategic review, architecture evaluation, future direction, or long-term planning, follow `STRATEGIC_REALITY_DEBRIEF_CONTRACT.md`.

Evaluate through:
- real human behavior, not ideal assumptions
- real organizational workflows
- real market and operational constraints
- platform evolution potential
- bias detection (engineering, founder, feature, security, UX)

## Anti-Hallucination Engineering Rule

All technical claims must follow `ANTI_HALLUCINATION_ENGINEERING_CONTRACT.md`.

Every statement must be classified as:
- confirmed
- likely
- uncertain

Claims must be supported by:
- code references
- file paths
- runtime analysis

Never invent architecture or root causes.

## Real-World Engineering Operations Contract

For system operations, deployment, production readiness, and architecture evolution, follow `REAL_WORLD_ENGINEERING_OPS_CONTRACT.md`.

Engineering must consider:
- operational recovery, not just ideal usage
- observability (logging, metrics, tracing, alerting)
- release discipline (reversible migrations, staged rollouts)
- developer experience (consistent patterns, traceable paths)
- domain ownership and platform evolution
