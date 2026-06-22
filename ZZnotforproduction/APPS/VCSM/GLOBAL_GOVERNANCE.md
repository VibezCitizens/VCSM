---
name: vcsm.global-governance
description: Global governance coverage matrix — documentation completeness, command coverage, security coverage, and ownership coverage across all 37 VCSM features
metadata:
  type: global-governance
  generated-by: DR. STRANGE
  ticket: TICKET-DRSTRANGE-GLOBAL-DOCS-V2-0001
  date: 2026-06-05
  source: All feature sub-documents (ARCHITECTURE.md, BEHAVIOR.md, SECURITY.md, TESTS.md, CURRENT_STATUS.md, INDEX.md)
---

# GLOBAL GOVERNANCE — VCSM Platform

**Generated:** 2026-06-05
**Source:** Feature sub-documents only. No source code read directly.
**Command:** DR. STRANGE — TICKET-DRSTRANGE-GLOBAL-DOCS-V2-0001

> Governance is the set of documented contracts, audit trails, and quality gates that allow the platform to be safely maintained and released. This document is the single-source governance health map.

---

## Governance Health Summary

| Category | Coverage | Score | Notes |
|---|---|---|---|
| Documentation — ARCHITECTURE.md | 37 / 37 | 100% | All features; FRESH 2026-06-04 |
| Documentation — SECURITY.md | 37 / 37 | 100% | All features; VENOM + BW coverage |
| Documentation — CURRENT_STATUS.md | 37 / 37 | 100% | All features; ARCHITECT 2026-06-04 |
| Documentation — INDEX.md | 37 / 37 | 100% | All features |
| Documentation — BEHAVIOR.md ACTIVE | 13 / 37 | 35% | 12 new via TICKET-LOGAN-BEHAVIOR-BUILD-WAVE-0001 |
| Documentation — TESTS.md | 1 / 37 | 3% | Dashboard only; SPIDER-MAN 2026-06-05 |
| Documentation — OWNERSHIP.md | 1 / 37 | 3% | Dashboard only; IRONMAN 2026-06-05 |
| Security — VENOM run | 37 / 37 | 100% | All features |
| Security — BLACKWIDOW run | 37 / 37 | 100% | All features |
| Security — ELEKTRA run | 6 / 37 | 16% | actors, app, auth, booking, chat, dashboard |
| Architecture — ARCHITECT run | 37 / 37 | 100% | All features; v1.1.0; 2026-06-04 |
| Ownership — IRONMAN run | 1 / 37 | 3% | Dashboard only |
| Performance — KRAVEN/LOKI run | 0 / 37 | 0% | No runs |
| Endpoint — HAWKEYE run | 1 / 37 | 3% | Dashboard only |
| Test coverage — SPIDER-MAN run | 1 / 37 | 3% | Dashboard only |
| Release eligibility — THOR clear | 0 / 37 | 0% | 32 BLOCKED; 5 PARTIAL |

**Overall platform governance score: PARTIAL** — Documentation baseline complete; behavior, test, and ownership governance lagging.

---

## Documentation Coverage Per Feature

| Feature | ARCHITECTURE.md | BEHAVIOR.md | SECURITY.md | TESTS.md | OWNERSHIP.md | INDEX.md | Doc Score |
|---|---|---|---|---|---|---|---|
| actors | ACTIVE | PLACEHOLDER | ACTIVE | MISSING | MISSING | ACTIVE | 3/6 |
| ads | ACTIVE | PLACEHOLDER | ACTIVE | MISSING | MISSING | ACTIVE | 3/6 |
| app | ACTIVE | PLACEHOLDER | ACTIVE | MISSING | MISSING | ACTIVE | 3/6 |
| auth | ACTIVE | PLACEHOLDER | ACTIVE | MISSING | MISSING | ACTIVE | 3/6 |
| block | ACTIVE | PLACEHOLDER | ACTIVE | MISSING | MISSING | ACTIVE | 3/6 |
| booking | ACTIVE | ACTIVE | ACTIVE | MISSING | MISSING | ACTIVE | 4/6 |
| chat | ACTIVE | PLACEHOLDER | ACTIVE | MISSING | MISSING | ACTIVE | 3/6 |
| dashboard | ACTIVE | ACTIVE | ACTIVE | ACTIVE | ACTIVE | ACTIVE | 6/6 |
| debug | ACTIVE | PLACEHOLDER | ACTIVE | MISSING | MISSING | ACTIVE | 3/6 |
| explore | ACTIVE | PLACEHOLDER | ACTIVE | MISSING | MISSING | ACTIVE | 3/6 |
| feed | ACTIVE | PLACEHOLDER | ACTIVE | MISSING | MISSING | ACTIVE | 3/6 |
| hydration | ACTIVE | PLACEHOLDER | ACTIVE | MISSING | MISSING | ACTIVE | 3/6 |
| identity | ACTIVE | ACTIVE | ACTIVE | MISSING | MISSING | ACTIVE | 4/6 |
| invite | ACTIVE | PLACEHOLDER | ACTIVE | MISSING | MISSING | ACTIVE | 3/6 |
| join | ACTIVE | PLACEHOLDER | ACTIVE | MISSING | MISSING | ACTIVE | 3/6 |
| legal | ACTIVE | PLACEHOLDER | ACTIVE | MISSING | MISSING | ACTIVE | 3/6 |
| media | ACTIVE | PLACEHOLDER | ACTIVE | MISSING | MISSING | ACTIVE | 3/6 |
| moderation | ACTIVE | ACTIVE | ACTIVE | MISSING | MISSING | ACTIVE | 4/6 |
| notifications | ACTIVE | ACTIVE | ACTIVE | MISSING | MISSING | ACTIVE | 4/6 |
| onboarding | ACTIVE | ACTIVE | ACTIVE | MISSING | MISSING | ACTIVE | 4/6 |
| portfolio | ACTIVE | PLACEHOLDER | ACTIVE | MISSING | MISSING | ACTIVE | 3/6 |
| post | ACTIVE | PLACEHOLDER | ACTIVE | MISSING | MISSING | ACTIVE | 3/6 |
| professional | ACTIVE | PLACEHOLDER | ACTIVE | MISSING | MISSING | ACTIVE | 3/6 |
| profiles | ACTIVE | ACTIVE | ACTIVE | MISSING | MISSING | ACTIVE | 4/6 |
| public | ACTIVE | PLACEHOLDER | ACTIVE | MISSING | MISSING | ACTIVE | 3/6 |
| reviews | ACTIVE | PLACEHOLDER | ACTIVE | MISSING | MISSING | ACTIVE | 3/6 |
| services | ACTIVE | ACTIVE | ACTIVE | MISSING | MISSING | ACTIVE | 4/6 |
| settings | ACTIVE | ACTIVE | ACTIVE | MISSING | MISSING | ACTIVE | 4/6 |
| shared | ACTIVE | PLACEHOLDER | ACTIVE | MISSING | MISSING | ACTIVE | 3/6 |
| social | ACTIVE | ACTIVE | ACTIVE | MISSING | MISSING | ACTIVE | 4/6 |
| state | ACTIVE | ACTIVE | ACTIVE | MISSING | MISSING | ACTIVE | 4/6 |
| styles | ACTIVE | PLACEHOLDER | ACTIVE | MISSING | MISSING | ACTIVE | 3/6 |
| ui | ACTIVE | PLACEHOLDER | ACTIVE | MISSING | MISSING | ACTIVE | 3/6 |
| upload | ACTIVE | ACTIVE | ACTIVE | MISSING | MISSING | ACTIVE | 4/6 |
| vgrid | ACTIVE | PLACEHOLDER | ACTIVE | MISSING | MISSING | ACTIVE | 3/6 |
| void | ACTIVE | PLACEHOLDER | ACTIVE | MISSING | MISSING | ACTIVE | 3/6 |
| vport | ACTIVE | ACTIVE | ACTIVE | MISSING | MISSING | ACTIVE | 4/6 |

Doc Score key: 6/6 = FULL | 4/6 = HIGH | 3/6 = PARTIAL | 2/6 = MINIMAL | 1/6 = STUB

**Platform doc score distribution:** 1 FULL, 12 HIGH, 24 PARTIAL, 0 MINIMAL, 0 STUB

---

## Security Governance Coverage

| Tier | Features | Count |
|---|---|---|
| FULL (VENOM + BW + ELEKTRA) | actors, app, auth, booking, chat, dashboard | 6 |
| PARTIAL (VENOM + BW, no ELEKTRA) | All other 31 features | 31 |
| MINIMAL (VENOM only) | 0 | 0 |
| NONE | 0 | 0 |

**Platform security governance score: PARTIAL** — ELEKTRA chain-trace coverage is the critical gap (31 features missing, including 5 CRITICAL-severity features).

---

## Architecture Governance Coverage

| Category | Count | Notes |
|---|---|---|
| Features with ARCHITECT run | 37 / 37 | All FRESH |
| Features STABLE | 26 | No architecture concerns |
| Features EVOLVING | 8 | In active development; may need re-run post-patch |
| Features FLAGGED | 3 | ui, vgrid, void — architectural problems identified |
| Features SPAGHETTI: WATCH | 20 | Dependency complexity risk |
| Features DEPENDENT (high coupling) | 3 | chat, hydration, profiles |
| Features with module completeness gaps | 5 | portfolio, reviews (INCOMPLETE); ui, vgrid, void (FRAGMENTED) |

---

## Ownership Governance Coverage

| Coverage | Count | Features |
|---|---|---|
| IRONMAN run (OWNERSHIP.md present) | 1 | dashboard |
| IRONMAN NOT run | 36 | All other features |

**Critical ownership gaps:**
- identity — Auth-critical bootstrap; no IRONMAN audit
- hydration — inline DB query; no ownership analysis
- profiles — 374 files, 12 engines; no ownership map
- ui — FLAGGED architecture; no adapter boundary
- vgrid — FRAGMENTED; no ownership defined

---

## Governance Gap Priority Queue

### P0 — Must address before any THOR gate can clear

| Gap | Action | Feature |
|---|---|---|
| TESTS.md MISSING (12 features BEHAVIOR.md now ACTIVE) | SPIDER-MAN — run coverage | booking, identity, moderation, notifications, onboarding, profiles, services, settings, social, state, upload, vport |
| ELEKTRA MISSING on CRITICAL features | ELEKTRA — chain-trace | moderation, notifications, onboarding, profiles, services |
| BEHAVIOR.md PLACEHOLDER (auth, trust-critical) | LOGAN | auth |
| VEN-CARD-001 unresolved (dashboard only THOR path) | Patch + regression | dashboard |

### P1 — Required for governance completeness

| Gap | Action | Feature |
|---|---|---|
| TESTS.md MISSING (0 features post-SPIDER-MAN) | SPIDER-MAN — run as BEHAVIOR.md becomes ACTIVE | All 24 remaining PLACEHOLDER features |
| ELEKTRA MISSING (HIGH features) | ELEKTRA — chain-trace | identity, social, state, settings, upload |
| OWNERSHIP.md MISSING | IRONMAN | identity, hydration, profiles, ui, social |
| BEHAVIOR.md PLACEHOLDER | LOGAN | remaining 24 features |

### P2 — Governance maturity

| Gap | Action |
|---|---|
| LOKI: 0 features traced | Platform-wide runtime trace pass |
| KRAVEN: 0 features analyzed | Performance audit of WATCH-score features |
| CARNAGE: TICKET-BOOKING-RPC-001 unaddressed | Migration design for booking RPC |

---

## Three-Level Authority Model (DR. STRANGE V2)

This document is a Level 3 (Global) authority. Consumption must flow upward only:

```
MODULE (Level 1)
  → FEATURE (Level 2)
    → GLOBAL (Level 3, this document)
```

- Global documents CONSUME feature documents
- Feature documents CONSUME module documents
- Module documents NEVER consume feature or global documents
- Global documents NEVER consume each other (no cross-global consumption)
- No circular authority allowed

Sub-documents (Level 2 sources):
`ZZnotforproduction/APPS/VCSM/features/[feature]/ARCHITECTURE.md`
`ZZnotforproduction/APPS/VCSM/features/[feature]/BEHAVIOR.md`
`ZZnotforproduction/APPS/VCSM/features/[feature]/SECURITY.md`
`ZZnotforproduction/APPS/VCSM/features/[feature]/TESTS.md`
`ZZnotforproduction/APPS/VCSM/features/[feature]/OWNERSHIP.md`
`ZZnotforproduction/APPS/VCSM/features/[feature]/CURRENT_STATUS.md`
