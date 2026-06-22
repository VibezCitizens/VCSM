---
name: vcsm.global-command-status
description: Global command run status — tracks last run date, coverage, and output freshness for all governance commands across all 37 VCSM features
metadata:
  type: global-command-status
  generated-by: DR. STRANGE
  ticket: TICKET-DRSTRANGE-GLOBAL-DOCS-V2-0001
  date: 2026-06-05
  source: Feature CURRENT_STATUS.md, SECURITY.md, BEHAVIOR.md, TESTS.md sub-documents
---

# GLOBAL COMMAND STATUS — VCSM Platform

**Generated:** 2026-06-05
**Source:** Feature sub-documents only. No source code read directly.
**Command:** DR. STRANGE — TICKET-DRSTRANGE-GLOBAL-DOCS-V2-0001

> This document tracks command run coverage and freshness across all 37 features. Freshness window: 7 days (commands run on or after 2026-05-29 are FRESH as of 2026-06-05).

---

## Platform Command Coverage Summary

| Command | Features Run | Coverage | Last Global Run | Freshness | Notes |
|---|---|---|---|---|---|
| ARCHITECT | 37 / 37 | 100% | 2026-06-04 | FRESH | All features; v1.1.0 |
| VENOM | 37 / 37 | 100% | 2026-06-05 | FRESH | All features; dashboard re-run 2026-06-05 |
| BLACKWIDOW | 37 / 37 | 100% | 2026-06-05 | FRESH | All features; dashboard re-run 2026-06-05 |
| ELEKTRA | 6 / 37 | 16% | 2026-06-05 | FRESH | actors, app, auth, booking, chat, dashboard only |
| LOGAN | 13 / 37 | 35% | 2026-06-05 | FRESH | 13 features with ACTIVE BEHAVIOR.md |
| IRONMAN | 1 / 37 | 3% | 2026-06-05 | FRESH | dashboard only |
| HAWKEYE | 1 / 37 | 3% | 2026-06-05 | FRESH | dashboard only |
| SPIDER-MAN | 1 / 37 | 3% | 2026-06-05 | FRESH | dashboard only; requires BEHAVIOR.md ACTIVE |
| LOKI | 0 / 37 | 0% | NEVER | — | No runs recorded |
| KRAVEN | 0 / 37 | 0% | NEVER | — | No runs recorded |
| CARNAGE | 0 / 37 | 0% | NEVER | — | No runs recorded |
| SENTRY | 0 / 37 | 0% | NEVER | — | No runs recorded |
| THOR | 0 / 37 | 0% | NEVER | — | Release gate; 0 features ELIGIBLE |
| DR. STRANGE | 1 platform pass | — | 2026-06-05 | FRESH | V2 pass; V1 was also 2026-06-05 |
| WATCHER | 0 | 0% | NEVER | — | No sessions recorded |
| DEADPOOL | 0 / 37 | 0% | NEVER | — | No targeted debug sessions |

---

## Per-Feature Command Coverage Matrix

Legend: ✓ = Run (FRESH) | S = Run (STALE >7d) | — = Never Run

| Feature | ARCHITECT | VENOM | BW | ELEKTRA | LOGAN | IRONMAN | HAWKEYE | SPIDER-MAN |
|---|---|---|---|---|---|---|---|---|
| actors | ✓ | ✓ | ✓ | ✓ | — | — | — | — |
| ads | ✓ | ✓ | ✓ | — | — | — | — | — |
| app | ✓ | ✓ | ✓ | ✓ | — | — | — | — |
| auth | ✓ | ✓ | ✓ | ✓ | — | — | — | — |
| block | ✓ | ✓ | ✓ | — | — | — | — | — |
| booking | ✓ | ✓ | ✓ | ✓ | ✓ | — | — | — |
| chat | ✓ | ✓ | ✓ | ✓ | — | — | — | — |
| dashboard | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| debug | ✓ | ✓ | ✓ | — | — | — | — | — |
| explore | ✓ | ✓ | ✓ | — | — | — | — | — |
| feed | ✓ | ✓ | ✓ | — | — | — | — | — |
| hydration | ✓ | ✓ | ✓ | — | — | — | — | — |
| identity | ✓ | ✓ | ✓ | — | ✓ | — | — | — |
| invite | ✓ | ✓ | ✓ | — | — | — | — | — |
| join | ✓ | ✓ | ✓ | — | — | — | — | — |
| legal | ✓ | ✓ | ✓ | — | — | — | — | — |
| media | ✓ | ✓ | ✓ | — | — | — | — | — |
| moderation | ✓ | ✓ | ✓ | — | ✓ | — | — | — |
| notifications | ✓ | ✓ | ✓ | — | ✓ | — | — | — |
| onboarding | ✓ | ✓ | ✓ | — | ✓ | — | — | — |
| portfolio | ✓ | ✓ | ✓ | — | — | — | — | — |
| post | ✓ | ✓ | ✓ | — | — | — | — | — |
| professional | ✓ | ✓ | ✓ | — | — | — | — | — |
| profiles | ✓ | ✓ | ✓ | — | ✓ | — | — | — |
| public | ✓ | ✓ | ✓ | — | — | — | — | — |
| reviews | ✓ | ✓ | ✓ | — | — | — | — | — |
| services | ✓ | ✓ | ✓ | — | ✓ | — | — | — |
| settings | ✓ | ✓ | ✓ | — | ✓ | — | — | — |
| shared | ✓ | ✓ | ✓ | — | — | — | — | — |
| social | ✓ | ✓ | ✓ | — | ✓ | — | — | — |
| state | ✓ | ✓ | ✓ | — | ✓ | — | — | — |
| styles | ✓ | ✓ | ✓ | — | — | — | — | — |
| ui | ✓ | ✓ | ✓ | — | — | — | — | — |
| upload | ✓ | ✓ | ✓ | — | ✓ | — | — | — |
| vgrid | ✓ | ✓ | ✓ | — | — | — | — | — |
| void | ✓ | ✓ | ✓ | — | — | — | — | — |
| vport | ✓ | ✓ | ✓ | — | ✓ | — | — | — |

---

## Coverage Tiers

| Tier | Criteria | Count | Features |
|---|---|---|---|
| FULL COVERAGE | ARCHITECT + VENOM + BW + ELEKTRA + LOGAN + SPIDER-MAN | 1 | dashboard |
| PARTIAL + BEHAVIOR | ARCHITECT + VENOM + BW + LOGAN (no ELEKTRA) | 8 | identity, moderation, notifications, onboarding, profiles, services, settings, social (no ELEKTRA + no SPIDER-MAN) |
| PARTIAL + ELEKTRA | ARCHITECT + VENOM + BW + ELEKTRA (no LOGAN) | 3 | actors, app (no LOGAN; ELEKTRA run) |
| PARTIAL + BOTH | ARCHITECT + VENOM + BW + ELEKTRA + LOGAN (no SPIDER-MAN) | 2 | auth (no LOGAN), booking (ELEKTRA + LOGAN) |
| SECURITY BASELINE | ARCHITECT + VENOM + BW only | 21 | All other features |
| NO COVERAGE | No commands run | 0 | — |

> Corrected: booking = ARCHITECT + VENOM + BW + ELEKTRA + LOGAN. chat = ARCHITECT + VENOM + BW + ELEKTRA (no LOGAN).

---

## ELEKTRA Priority Queue (Not Yet Run — 31 features)

| Priority | Feature | Rationale |
|---|---|---|
| P0 | moderation | CRITICAL findings; no chain-trace |
| P0 | notifications | CRITICAL; cross-platform; no trace |
| P0 | onboarding | CRITICAL; kind-branching |
| P0 | profiles | CRITICAL; 30 write surfaces |
| P0 | services | CRITICAL; integration gap |
| P1 | identity | HIGH; auth-critical bootstrap |
| P1 | social | HIGH; follow state machine |
| P1 | state | HIGH; boot-time path |
| P1 | settings | HIGH; irreversible writes |
| P1 | upload | HIGH |
| P2+ | remaining 21 features | Standard security coverage |

---

## SPIDER-MAN Queue (13 features now eligible)

| Feature | BEHAVIOR.md | Status |
|---|---|---|
| dashboard | ACTIVE | COMPLETE — TESTS.md created 2026-06-05 |
| booking | ACTIVE | NOT YET RUN |
| identity | ACTIVE | NOT YET RUN |
| moderation | ACTIVE | NOT YET RUN |
| notifications | ACTIVE | NOT YET RUN |
| onboarding | ACTIVE | NOT YET RUN |
| profiles | ACTIVE | NOT YET RUN |
| services | ACTIVE | NOT YET RUN |
| settings | ACTIVE | NOT YET RUN |
| social | ACTIVE | NOT YET RUN |
| state | ACTIVE | NOT YET RUN |
| upload | ACTIVE | NOT YET RUN |
| vport | ACTIVE | NOT YET RUN |

---

## Commands Never Run — Gap Summary

| Command | Gap Significance |
|---|---|
| LOKI | No runtime traces; read amplification and N+1 patterns undetected platform-wide |
| KRAVEN | No performance analysis; DB slow-query surface unknown |
| CARNAGE | No migration blast radius analysis; TICKET-BOOKING-RPC-001 migration unplanned |
| SENTRY | No observability gap detection; runtime failure surfaces unmonitored |
| THOR | No feature has cleared all release gates; platform not release-eligible |
