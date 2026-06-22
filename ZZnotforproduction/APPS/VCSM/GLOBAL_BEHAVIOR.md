---
name: vcsm.global-behavior
description: Global behavior contract status rollup — built from feature BEHAVIOR.md sub-documents
metadata:
  type: global-behavior
  generated-by: DR. STRANGE
  ticket: TICKET-DRSTRANGE-GLOBAL-DOCS-V2-0001
  date: 2026-06-05
  source: Feature BEHAVIOR.md files (all 37 features)
---

# GLOBAL BEHAVIOR — VCSM Platform

**Generated:** 2026-06-05
**Source:** Feature-level BEHAVIOR.md and module-level BEHAVIOR.md files. No source code read directly.
**Command:** DR. STRANGE — TICKET-DRSTRANGE-GLOBAL-DOCS-V2-0001

---

## Summary

| Metric | Count |
|---|---|
| Features with ACTIVE BEHAVIOR.md | 13 / 37 |
| Features with PLACEHOLDER BEHAVIOR.md | 24 / 37 |
| Dashboard modules ACTIVE | 5 / 19 |
| Dashboard modules PARTIAL (DRAFT) | 13 / 19 |
| Dashboard modules UNKNOWN | 1 / 19 |
| Non-dashboard module BEHAVIOR.md present (no Status) | 76 / 79 |
| Non-dashboard module BEHAVIOR.md truly MISSING | 3 / 79 |
| Features SPIDER-MAN eligible | 13 |

---

## Feature-Level Behavior Status

### ACTIVE (13)

| Feature | Status | Authored By | Date |
|---|---|---|---|
| booking | ACTIVE | LOGAN (TICKET-LOGAN-BEHAVIOR-BUILD-WAVE-0001) | 2026-06-05 |
| dashboard | ACTIVE | LOGAN (WOLVERINE Phase 2) | 2026-06-05 |
| identity | ACTIVE | LOGAN (TICKET-LOGAN-BEHAVIOR-BUILD-WAVE-0001) | 2026-06-05 |
| moderation | ACTIVE | LOGAN (TICKET-LOGAN-BEHAVIOR-BUILD-WAVE-0001) | 2026-06-05 |
| notifications | ACTIVE | LOGAN (TICKET-LOGAN-BEHAVIOR-BUILD-WAVE-0001) | 2026-06-05 |
| onboarding | ACTIVE | LOGAN (TICKET-LOGAN-BEHAVIOR-BUILD-WAVE-0001) | 2026-06-05 |
| profiles | ACTIVE | LOGAN (TICKET-LOGAN-BEHAVIOR-BUILD-WAVE-0001) | 2026-06-05 |
| services | ACTIVE | LOGAN (TICKET-LOGAN-BEHAVIOR-BUILD-WAVE-0001) | 2026-06-05 |
| settings | ACTIVE | LOGAN (TICKET-LOGAN-BEHAVIOR-BUILD-WAVE-0001) | 2026-06-05 |
| social | ACTIVE | LOGAN (TICKET-LOGAN-BEHAVIOR-BUILD-WAVE-0001) | 2026-06-05 |
| state | ACTIVE | LOGAN (TICKET-LOGAN-BEHAVIOR-BUILD-WAVE-0001) | 2026-06-05 |
| upload | ACTIVE | LOGAN (TICKET-LOGAN-BEHAVIOR-BUILD-WAVE-0001) | 2026-06-05 |
| vport | ACTIVE | LOGAN (TICKET-LOGAN-BEHAVIOR-BUILD-WAVE-0001) | 2026-06-05 |

### PLACEHOLDER (24)

| Feature | Status | Notes |
|---|---|---|
| actors | PLACEHOLDER | No contract body; no API contract for consumers |
| ads | PLACEHOLDER | No ownership gate documented |
| app | PLACEHOLDER | Auth session flow, consent gate, iOS bootstrap undocumented |
| auth | PLACEHOLDER | Trust-critical; BEHAVIOR.md explicitly flagged as placeholder stub |
| block | PLACEHOLDER | All downstream governance blocked |
| chat | PLACEHOLDER | No inbox semantics, no auth rules |
| debug | PLACEHOLDER | No contract body |
| explore | PLACEHOLDER | Fully-implemented feature with no behavior contract |
| feed | PLACEHOLDER | Visibility rules, pagination, welcome card undocumented |
| hydration | PLACEHOLDER | Entire feature behavior contract absent |
| invite | PLACEHOLDER | Fully functional in source; no contract |
| join | PLACEHOLDER | QR and invite join flows undocumented |
| legal | PLACEHOLDER | Legally sensitive; consent gate completely undocumented |
| media | PLACEHOLDER | Consumed by 6+ features; no integration contract |
| portfolio | PLACEHOLDER | Consuming features have no authoritative reference |
| post | PLACEHOLDER | 15 write surfaces, 18 controllers; stub with no body |
| professional | PLACEHOLDER | Professional role auth gate absent |
| public | PLACEHOLDER | Anonymous lead submission path undocumented |
| reviews | PLACEHOLDER | Engine setup and ownership injection undocumented |
| shared | PLACEHOLDER | Most widely consumed module; no contract |
| styles | PLACEHOLDER | No token naming contract or theming governance |
| ui | PLACEHOLDER | Primitives exported without documentation |
| vgrid | PLACEHOLDER | Scaffold only; no purpose or data model defined |
| void | PLACEHOLDER | 18+ realm gating not designed |

---

## Module-Level Behavior Status — Dashboard

| Module | Status | Classification |
|---|---|---|
| designStudio | REVIEWED | ACTIVE |
| portfolio | APPROVED | ACTIVE |
| qrcode | APPROVED | ACTIVE |
| shared | APPROVED | ACTIVE |
| vportOwnerStats | APPROVED | ACTIVE |
| bookings | DRAFT | PARTIAL |
| calendar | DRAFT | PARTIAL |
| exchange | DRAFT | PARTIAL |
| flyerBuilder | DRAFT | PARTIAL |
| gasprices | DRAFT | PARTIAL |
| leads | DRAFT | PARTIAL |
| locksmith | DRAFT | PARTIAL |
| reviews | DRAFT | PARTIAL |
| schedule | DRAFT | PARTIAL |
| services | DRAFT | PARTIAL |
| settings | DRAFT | PARTIAL |
| team | DRAFT | PARTIAL |
| vport | DRAFT | PARTIAL |
| dashboard (module) | (no Status field) | UNKNOWN |

---

## Module-Level Behavior Status — All Other Features

- **76 modules** have BEHAVIOR.md files with no Status field → classified as PLACEHOLDER
- **3 modules** have no BEHAVIOR.md file → classified as MISSING

Truly MISSING module BEHAVIOR.md:
- `services/service/BEHAVIOR.md`
- `styles/style/BEHAVIOR.md`
- `ui/ui/BEHAVIOR.md`

---

## SPIDER-MAN Eligibility

**Rule:** SPIDER-MAN eligible only when feature BEHAVIOR.md is ACTIVE.

| Feature | BEHAVIOR Status | Spider-Man Eligible |
|---|---|---|
| booking | ACTIVE | YES |
| dashboard | ACTIVE | YES |
| identity | ACTIVE | YES |
| moderation | ACTIVE | YES |
| notifications | ACTIVE | YES |
| onboarding | ACTIVE | YES |
| profiles | ACTIVE | YES |
| services | ACTIVE | YES |
| settings | ACTIVE | YES |
| social | ACTIVE | YES |
| state | ACTIVE | YES |
| upload | ACTIVE | YES |
| vport | ACTIVE | YES |
| All other 24 features | PLACEHOLDER | NO |

> Dashboard SPIDER-MAN has run (2026-06-05). 13 features are now SPIDER-MAN eligible. 24 features remain ineligible until BEHAVIOR.md is authored.

---

## Behavior Coverage Gaps — Priority Order

> Note: booking, identity, moderation, notifications, onboarding, profiles, services, settings, social, state, upload, vport now have ACTIVE BEHAVIOR.md (TICKET-LOGAN-BEHAVIOR-BUILD-WAVE-0001). Remaining gaps below.

| Priority | Feature | Risk |
|---|---|---|
| P0 | auth | Trust-critical; recovery session enforcement gap unanchored |
| P1 | legal | Legally sensitive consent gate undocumented |
| P2 | chat, explore, feed, hydration | Significant feature gaps |
| P3 | actors, ads, app, block, debug, invite, join, media, portfolio, post, professional, public, reviews, shared, styles, ui, vgrid, void | Standard coverage gap |

---

## Behavior Doc Priority Queue

To unlock SPIDER-MAN coverage across the platform:

1. LOGAN must author BEHAVIOR.md for each feature
2. Each feature BEHAVIOR.md must reach ACTIVE status
3. SPIDER-MAN can then run regression coverage per feature

Estimated: 24 LOGAN runs required before platform-wide SPIDER-MAN is possible.
