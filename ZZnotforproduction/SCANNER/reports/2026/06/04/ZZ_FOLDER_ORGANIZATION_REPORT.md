---
title: ZZ Folder Organization Report
status: COMPLETE
generated: 2026-06-04
scanner: manual audit
source: ZZnotforproduction/
---

# ZZ_FOLDER_ORGANIZATION_REPORT

## Top-Level Structure

| Path | Purpose | Owner | Current Status | Notes |
|---|---|---|---|---|
| ZZnotforproduction/ | Governance root | Platform | CANONICAL | New root as of 2026-06-04 migration |
| ZZnotforproduction/APPS/ | App-scoped governance | Platform | CANONICAL | Contains VCSM, Wentrex, Traffic |
| ZZnotforproduction/ENGINES/ | Engine-scoped governance | Platform | CANONICAL | 9 engine modules |
| ZZnotforproduction/CONTRACTS/ | Cross-cutting contracts | Platform | CANONICAL | Architecture, Security, System, Agent, Platform |
| ZZnotforproduction/SCANNER/ | Scanner infrastructure outputs | Scanner | ACTIVE | Subdirs empty — ready for population |
| ZZnotforproduction/ARCHIVE/ | Legacy/triage holding area | Platform | ACTIVE | All subdirs empty — no content moved yet |
| ZZnotforproduction/GOVERNANCE/ | Feature status tracking | Platform | ACTIVE | FEATURE_STATUS.md present |
| ZZnotforproduction/PROM/ | Promotional docs | Unknown | UNKNOWN | 3 .doc files, non-standard naming |

---

## APPS Directory

### APPS/VCSM/features/ — 39 Feature Folders

| Path | Source Files (Scanner) | Modules (Scanner) | ZZ Module Dirs? | Status |
|---|---|---|---|---|
| features/actors | 4 | actors | NO | ACTIVE — flat OK (single module) |
| features/ads | 18 | ads | NO | ACTIVE — flat OK (single module) |
| features/app | 35 | app | NO | ACTIVE — flat OK (single module) |
| features/auth | 56 | auth | NO | ACTIVE — flat OK (single module) |
| features/block | 18 | block, guards | NO | NEEDS_MODULES — 2 modules unrepresented |
| features/booking | 66 | booking | NO | ACTIVE — flat OK (single module) |
| features/chat | 66 | chat, conversation, debug, inbox, start | NO | NEEDS_MODULES — 5 modules unrepresented |
| features/dashboard | 258 | 19 modules | YES (18/19) | ACTIVE — missing `dashboard` shell module |
| features/debug | 3 | debug | NO | ACTIVE — flat OK (single module) |
| features/explore | 22 | explore | NO | ACTIVE — flat OK (single module) |
| features/feed | 46 | feed, pipeline | NO | NEEDS_MODULES — 2 modules unrepresented |
| features/hydration | 2 | hydration | NO | ACTIVE — flat OK (single module) |
| features/identity | 9 | identity, resolvers | NO | NEEDS_MODULES — 2 modules unrepresented |
| features/invite | 6 | invite | NO | ACTIVE — flat OK (single module) |
| features/join | 12 | join | NO | ACTIVE — flat OK (single module) |
| features/legal | 26 | config, docs, engine, legal | NO | NEEDS_MODULES — 4 modules unrepresented |
| features/media | 9 | media | NO | ACTIVE — flat OK (single module) |
| features/moderation | 35 | moderation, types | NO | NEEDS_MODULES — 2 modules unrepresented |
| features/notifications | 43 | inbox, notifications, runtime, types | NO | NEEDS_MODULES — 4 modules unrepresented |
| features/onboarding | 16 | onboarding | NO | ACTIVE — flat OK (single module) |
| features/portfolio | 2 | portfolio | NO | ACTIVE — flat OK (single module) |
| features/post | 116 | commentcard, post, postcard | NO | NEEDS_MODULES — 3 modules unrepresented |
| features/professional | 33 | briefings, core, enterprise, professional, professional-nurse | NO | NEEDS_MODULES — 5 modules unrepresented |
| features/profiles | 374 | config, debug, kinds, profiles | NO | NEEDS_MODULES — 4 modules unrepresented |
| features/public | 64 | public, vportBusinessCard, vportMenu | NO | NEEDS_MODULES — 3 modules unrepresented |
| features/reviews | 1 | reviews | NO | ACTIVE — flat OK (single module) |
| features/services | 14 | services | NO | ACTIVE — flat OK (single module) |
| features/settings | 91 | account, privacy, profile, settings, sponsored, vports | NO | NEEDS_MODULES — 6 modules unrepresented |
| features/shared | 42 | shared | NO | ACTIVE — flat OK (single module) |
| features/social | 44 | friend, privacy, social | NO | NEEDS_MODULES — 3 modules unrepresented |
| features/state | 23 | state | NO | ACTIVE — flat OK (single module) |
| features/styles | 0 | styles | NO | NEEDS_INDEX — 0 source files, governance may be vestigial |
| features/ui | 1 | modern, ui | NO | NEEDS_MODULES — 2 modules, 1 source file |
| features/upload | 38 | upload | NO | ACTIVE — flat OK (single module) |
| features/vgrid | 10 | vgrid | NO | ACTIVE — FROZEN per governance rules |
| features/void | 11 | void | NO | ACTIVE — flat OK (single module) |
| features/vport | 29 | public, utils, vport | NO | NEEDS_MODULES — 3 modules unrepresented |

### APPS/VCSM/features/dashboard/modules/ — 18 of 19 Module Folders

| Module | ZZ Folder | Scanner Module | Status |
|---|---|---|---|
| bookings | YES | YES | CANONICAL |
| calendar | YES | YES | CANONICAL |
| dashboard (shell) | NO | YES | MISSING |
| designStudio | YES | YES | CANONICAL |
| exchange | YES | YES | CANONICAL |
| flyerBuilder | YES | YES | CANONICAL |
| gasprices | YES | YES | CANONICAL |
| leads | YES | YES | CANONICAL |
| locksmith | YES | YES | CANONICAL |
| portfolio | YES | YES | CANONICAL |
| qrcode | YES | YES | CANONICAL |
| reviews | YES | YES | CANONICAL |
| schedule | YES | YES | CANONICAL |
| services | YES | YES | CANONICAL |
| settings | YES | YES | CANONICAL |
| shared | YES | YES | CANONICAL |
| team | YES | YES | CANONICAL |
| vport | YES | YES | CANONICAL |
| vportOwnerStats | YES | YES | CANONICAL |

---

## ENGINES Directory (9 Engines)

| Path | ZZ Folder | Scanner | Status |
|---|---|---|---|
| ENGINES/booking | YES | YES | CANONICAL |
| ENGINES/chat | YES | YES | CANONICAL |
| ENGINES/hydration | YES | YES | CANONICAL |
| ENGINES/i18n | YES | YES | CANONICAL |
| ENGINES/identity | YES | YES | CANONICAL |
| ENGINES/media | YES | YES | CANONICAL |
| ENGINES/notifications | YES | YES | CANONICAL |
| ENGINES/portfolio | YES | YES | CANONICAL |
| ENGINES/reviews | YES | YES | CANONICAL |

All engine folders are flat (INDEX.md, README.md, outputs/). No module subdirectories. Acceptable given engine-level granularity.

---

## CONTRACTS Directory

| Path | Status | Notes |
|---|---|---|
| CONTRACTS/Architecture/ | CANONICAL | 12 principle docs + planning docs |
| CONTRACTS/Agent/ | CANONICAL | 12 investigation/quality docs |
| CONTRACTS/Platform/ | CANONICAL | 6 platform structure docs |
| CONTRACTS/Security/ | CANONICAL | 6 security principle docs |
| CONTRACTS/System/ | CANONICAL | 6 boundary/actor enforcement docs |
| CONTRACTS/ENGINE/ | CANONICAL | Capability + Engine subdirs |
| CONTRACTS/Plans/ | ACTIVE | 1 planning doc (chat migration) |
| CONTRACTS/OUTPUT_MINIMIZATION_CONTRACT.md | CANONICAL | Root contract for output rules |

---

## SCANNER Directory

| Path | Status | Notes |
|---|---|---|
| SCANNER/contracts/ | NEEDS_INDEX | Empty — no scanner contracts written yet |
| SCANNER/maps/ | NEEDS_INDEX | Empty — scanner map outputs not routed here |
| SCANNER/reports/ | ACTIVE | This audit is being written here |
| SCANNER/snapshots/ | NEEDS_INDEX | Empty |
| SCANNER/validation/ | NEEDS_INDEX | Empty |

Note: Scanner generates maps to `apps/scanner/maps/`. ZZnotforproduction/SCANNER/ is the governance mirror — reports and validated snapshots should be routed here, not the raw JSON maps.

---

## Missing Index Files

| Folder | Missing |
|---|---|
| ZZnotforproduction/SCANNER/contracts/ | INDEX.md |
| ZZnotforproduction/SCANNER/maps/ | INDEX.md |
| ZZnotforproduction/SCANNER/snapshots/ | INDEX.md |
| ZZnotforproduction/SCANNER/validation/ | INDEX.md |
| ZZnotforproduction/ARCHIVE/duplicates/ | INDEX.md |
| ZZnotforproduction/ARCHIVE/frozen/ | INDEX.md |
| ZZnotforproduction/ARCHIVE/needs-triage/ | INDEX.md |
| ZZnotforproduction/ARCHIVE/stale/ | INDEX.md |

---

## Naming Convention Summary

| Convention | Used By | Verdict |
|---|---|---|
| UPPERCASE | Top-level folders (APPS, ENGINES, CONTRACTS) | CANONICAL |
| lowercase | Feature folders (actors, ads, auth...) | CANONICAL |
| camelCase | Module folders (designStudio, flyerBuilder, vportOwnerStats) | CANONICAL |
| kebab-case | Contract docs (01-core-principles.md) | CANONICAL |
| SCREAMING_SNAKE | Report files (ZZ_FOLDER_BUILD_PLAN.md) | CANONICAL for reports |
| UPPERCASE filenames | INDEX.md, README.md, BEHAVIOR.md, SECURITY.md | CANONICAL |
