---
name: architect-coverage-audit
description: ARCHITECT run coverage audit across all VCSM features and modules
type: audit
owner: ARCHITECT
generated: 2026-06-05
scanner-version: 1.1.0
---

# ARCHITECT COVERAGE AUDIT
**Date:** 2026-06-05
**Scope:** ZZnotforproduction/APPS/VCSM/features/
**Mode:** READ-ONLY

---

## Feature Summary

| Feature | Status | Modules | Architect Coverage |
|---|---|---|---|
| actors | ARCHITECT_COMPLETE | — | POPULATED |
| ads | ARCHITECT_COMPLETE | — | POPULATED |
| app | ARCHITECT_COMPLETE | — | POPULATED |
| auth | ARCHITECT_COMPLETE | — | POPULATED |
| block | ARCHITECT_COMPLETE | — | POPULATED |
| booking | ARCHITECT_COMPLETE | — | POPULATED |
| chat | ARCHITECT_COMPLETE | 5 modules | POPULATED (feature-level only) |
| dashboard | ARCHITECT_COMPLETE | 20 modules | POPULATED (feature-level only) |
| debug | ARCHITECT_COMPLETE | — | POPULATED |
| explore | ARCHITECT_COMPLETE | — | POPULATED |
| feed | ARCHITECT_COMPLETE | — | POPULATED |
| hydration | ARCHITECT_COMPLETE | — | POPULATED |
| identity | ARCHITECT_COMPLETE | — | POPULATED |
| invite | ARCHITECT_COMPLETE | — | POPULATED |
| join | ARCHITECT_COMPLETE | — | POPULATED |
| legal | ARCHITECT_COMPLETE | — | POPULATED |
| media | ARCHITECT_COMPLETE | — | POPULATED |
| moderation | ARCHITECT_COMPLETE | — | POPULATED |
| notifications | ARCHITECT_COMPLETE | — | POPULATED |
| onboarding | ARCHITECT_COMPLETE | — | POPULATED |
| portfolio | ARCHITECT_PARTIAL | — | INCOMPLETE (engine shim only) |
| post | ARCHITECT_COMPLETE | — | POPULATED |
| professional | ARCHITECT_COMPLETE | — | POPULATED |
| profiles | ARCHITECT_COMPLETE | — | POPULATED |
| public | ARCHITECT_COMPLETE | — | POPULATED |
| reviews | ARCHITECT_PARTIAL | — | INCOMPLETE (engine shim only) |
| services | ARCHITECT_COMPLETE | — | POPULATED |
| settings | ARCHITECT_COMPLETE | — | POPULATED |
| shared | ARCHITECT_COMPLETE | — | POPULATED |
| social | ARCHITECT_COMPLETE | — | POPULATED |
| state | ARCHITECT_COMPLETE | — | POPULATED |
| styles | ARCHITECT_COMPLETE | — | POPULATED |
| ui | ARCHITECT_COMPLETE | — | POPULATED (limited) |
| upload | ARCHITECT_COMPLETE | — | POPULATED |
| vgrid | ARCHITECT_PENDING | — | FRAGMENTED (scaffold only) |
| void | ARCHITECT_PENDING | — | FRAGMENTED (scaffold only) |
| vport | ARCHITECT_COMPLETE | — | POPULATED |

---

## Module Summary

### Feature: chat

| Module | Status | ARCHITECTURE.md | INDEX.md |
|---|---|---|---|
| chat | MODULE_PARTIAL | STUB | EXISTS |
| conversation | MODULE_PARTIAL | STUB | EXISTS |
| debug | MODULE_PARTIAL | STUB | EXISTS |
| inbox | MODULE_COMPLETE | ACTIVE | EXISTS |
| start | MODULE_PARTIAL | STUB | EXISTS |

**Notes:**
- `inbox` is the only fully traced module with call-graph verification and SOURCE_VERIFIED tags
- `chat`, `conversation`, `debug`, `start` are STUBs — architecture not yet traced

---

### Feature: dashboard

| Module | Status | ARCHITECTURE.md | INDEX.md |
|---|---|---|---|
| bookings | MODULE_PENDING | MISSING | PLACEHOLDER |
| calendar | MODULE_PENDING | MISSING | PLACEHOLDER |
| dashboard (shell) | MODULE_PARTIAL | STUB | EXISTS |
| designStudio | MODULE_PARTIAL | MISSING | REVIEWED (governance files tracked) |
| exchange | MODULE_PENDING | MISSING | PLACEHOLDER |
| flyerBuilder | MODULE_PENDING | MISSING | PLACEHOLDER |
| gasprices | MODULE_PENDING | MISSING | PLACEHOLDER |
| leads | MODULE_COMPLETE | ACTIVE | EXISTS |
| locksmith | MODULE_PENDING | MISSING | PLACEHOLDER |
| portfolio | MODULE_PENDING | MISSING | PLACEHOLDER |
| qrcode | MODULE_PENDING | MISSING | PLACEHOLDER |
| reviews | MODULE_PENDING | MISSING | PLACEHOLDER |
| schedule | MODULE_PENDING | MISSING | PLACEHOLDER |
| services | MODULE_PENDING | MISSING | PLACEHOLDER |
| settings | MODULE_PENDING | MISSING | PLACEHOLDER |
| shared | MODULE_PENDING | MISSING | PLACEHOLDER |
| team | MODULE_PENDING | MISSING | PLACEHOLDER |
| vport | MODULE_PENDING | MISSING | PLACEHOLDER |
| vportOwnerStats | MODULE_PARTIAL | MISSING | REVIEWED (governance files tracked) |

**Notes:**
- `leads` is the only fully traced dashboard module (142-line ACTIVE architecture, stable state)
- `designStudio` and `vportOwnerStats` have INDEX.md governance file tracking and BEHAVIOR.md but no ARCHITECTURE.md
- `dashboard` shell has a 44-line STUB — call graph not yet traced
- 16 modules are PLACEHOLDER stubs created by TICKET-ZZ-SCANNER-MAPPED-FOLDERS-0001
- All PLACEHOLDER modules have no ARCHITECTURE.md — eligible for ARCHITECT runs

---

## Pending Architect Queue

### Priority 1 — Modules with governance structure but ARCHITECTURE.md still STUB

These have INDEX.md and partial governance infrastructure but need architecture tracing:

1. `dashboard/modules/dashboard` (shell) — STUB ARCHITECTURE.md, 44 lines, call graph untraced
2. `chat/modules/chat` — STUB, central chat router module
3. `chat/modules/conversation` — STUB, primary read path
4. `chat/modules/start` — STUB, conversation init flow
5. `chat/modules/debug` — STUB, dev-only trace module
6. `dashboard/modules/designStudio` — ARCHITECTURE.md missing; BEHAVIOR.md and governance files exist
7. `dashboard/modules/vportOwnerStats` — ARCHITECTURE.md missing; governance files exist

---

### Priority 2 — Large dashboard modules without ARCHITECT review

Dashboard modules with meaningful source file counts, no architecture evidence:

1. `dashboard/modules/flyerBuilder` — flyer creation pipeline (multi-step, multi-layer)
2. `dashboard/modules/bookings` — booking state machine surface (security-sensitive)
3. `dashboard/modules/gasprices` — fuel price submission and review flow
4. `dashboard/modules/exchange` — VPORT exchange publish surface
5. `dashboard/modules/vport` — VPORT management shell
6. `dashboard/modules/settings` — citizen control panel module
7. `dashboard/modules/calendar` — scheduling and availability display
8. `dashboard/modules/reviews` — review submission surface
9. `dashboard/modules/schedule` — schedule management
10. `dashboard/modules/services` — service configuration

---

### Priority 3 — Small modules without ARCHITECT review

Smaller footprint modules that are still PLACEHOLDER:

1. `dashboard/modules/locksmith` — locksmith VPORT tools
2. `dashboard/modules/portfolio` — portfolio display within dashboard
3. `dashboard/modules/qrcode` — QR code generation
4. `dashboard/modules/shared` — dashboard-level shared components
5. `dashboard/modules/team` — team management module
6. `dashboard/modules/leads` — *(already MODULE_COMPLETE)*

---

## Dashboard Special Check

### dashboard shell module

**Path:** `ZZnotforproduction/APPS/VCSM/features/dashboard/modules/dashboard/`

| File | Status |
|---|---|
| ARCHITECTURE.md | STUB (44 lines — "Call graph has not been traced for this module") |
| INDEX.md | EXISTS |

**Status: MODULE_PARTIAL**

The dashboard shell module has placeholder ARCHITECTURE.md content. The call graph, component tree, and data flow have not been traced. This is the entry container for all dashboard cards and needs architecture tracing before any dashboard module THOR gate can be cleared.

---

## Chat Special Check

### chat module architecture status

| Module | ARCHITECTURE.md State | Evidence |
|---|---|---|
| chat | STUB | "Architecture has not been traced for this module specifically" |
| conversation | STUB | "Call graph has not been traced" |
| debug | STUB | "Architecture not traced for this module" |
| inbox | ACTIVE | 74 lines, SOURCE_VERIFIED, full layer stack trace |
| start | STUB | "Architecture not traced for this module" |

**Only `inbox` is ACTIVE.** All other chat modules need ARCHITECT runs.

---

## Coverage Metrics

| Metric | Count | Percentage |
|---|---|---|
| Total Features | 38 | 100% |
| ARCHITECT_COMPLETE | 34 | 89% |
| ARCHITECT_PARTIAL | 2 | 5% |
| ARCHITECT_PENDING | 2 | 5% |
| Total Modules | 25 | 100% |
| MODULE_COMPLETE | 2 | 8% |
| MODULE_PARTIAL | 7 | 28% |
| MODULE_PENDING | 16 | 64% |

**Feature-level coverage: 89%**
**Module-level coverage: 8% COMPLETE / 36% some coverage / 64% no coverage**

---

## Recommended Next Architect Runs

Ordered by: governance structure readiness → security exposure → source file count → business importance

```
1.  dashboard/modules/dashboard (shell)      — STUB exists; entry point for all dashboard cards
2.  dashboard/modules/flyerBuilder           — multi-layer pipeline; active in current branch
3.  dashboard/modules/bookings               — security-sensitive; booking state machine
4.  chat/modules/conversation                — primary read path; high traffic
5.  chat/modules/chat                        — central chat router
6.  dashboard/modules/gasprices              — active in current branch (ELEK findings history)
7.  dashboard/modules/exchange               — VPORT exchange; publish surface
8.  chat/modules/start                       — conversation init flow
9.  dashboard/modules/vport                  — VPORT management shell
10. dashboard/modules/settings               — citizen control panel
11. dashboard/modules/designStudio           — governance tracked; ARCHITECTURE.md missing
12. dashboard/modules/vportOwnerStats        — governance tracked; ARCHITECTURE.md missing
13. dashboard/modules/calendar               — scheduling display
14. dashboard/modules/reviews                — review submission
15. dashboard/modules/schedule               — schedule management
16. chat/modules/debug                       — dev-only; lower priority
17. dashboard/modules/services               — service configuration
18. dashboard/modules/locksmith              — locksmith VPORT tools
19. dashboard/modules/portfolio              — portfolio display
20. dashboard/modules/qrcode                 — QR generation
21. dashboard/modules/shared                 — shared dashboard primitives
22. dashboard/modules/team                   — team management
```

---

## Partial / Fragmented Feature Notes

| Feature | Reason | Action |
|---|---|---|
| portfolio | Engine integration shim — no UI layer | No ARCHITECT run needed; INCOMPLETE by design |
| reviews | Engine integration shim — no UI layer | No ARCHITECT run needed; INCOMPLETE by design |
| vgrid | All 10 source files are empty barrel stubs | Hold until implementation begins |
| void | Single placeholder screen, future feature | Hold until implementation begins |

---

## Generation Metadata

- All ARCHITECT feature-level outputs dated: **2026-06-04** or **2026-06-05**
- Scanner version: **1.1.0**
- PLACEHOLDER module stubs created by: **TICKET-ZZ-SCANNER-MAPPED-FOLDERS-0001**
- Governance-tracked partials (designStudio, vportOwnerStats): multi-specialist index present

---

*Audit generated by ARCHITECT COVERAGE AUDIT pass — read-only, no files modified.*
