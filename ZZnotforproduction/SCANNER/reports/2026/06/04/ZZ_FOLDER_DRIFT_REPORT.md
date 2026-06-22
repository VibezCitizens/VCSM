---
title: ZZ Folder Drift Report
status: COMPLETE
generated: 2026-06-04
scanner: apps/scanner v1.1.0 (2026-06-05T03:29:11Z)
---

# ZZ_FOLDER_DRIFT_REPORT

Comparison: scanner-discovered source reality vs existing ZZnotforproduction governance folders.

---

## Drift Findings

| # | Drift Type | Source Evidence | Existing Folder | Recommended Action |
|---|---|---|---|---|
| D-001 | Feature exists in source, no governance modules | `apps/VCSM/src/features/block` — 18 files, modules: block, guards | `features/block/` (flat only) | CREATE modules/block/ and modules/guards/ |
| D-002 | Feature exists in source, no governance modules | `apps/VCSM/src/features/chat` — 66 files, modules: chat, conversation, debug, inbox, start | `features/chat/` (flat only) | CREATE modules/ with 5 subdirs |
| D-003 | Dashboard shell module in source, no governance folder | `apps/VCSM/src/features/dashboard/vport/screens/VportDashboardScreen.jsx` | `features/dashboard/modules/` (18 present, dashboard missing) | CREATE modules/dashboard/ |
| D-004 | Feature exists in source, no governance modules | `apps/VCSM/src/features/feed` — 46 files, modules: feed, pipeline | `features/feed/` (flat only) | CREATE modules/feed/ and modules/pipeline/ |
| D-005 | Feature exists in source, no governance modules | `apps/VCSM/src/features/identity` — 9 files, modules: identity, resolvers | `features/identity/` (flat only) | CREATE modules/identity/ and modules/resolvers/ |
| D-006 | Feature exists in source, no governance modules | `apps/VCSM/src/features/legal` — 26 files, modules: config, docs, engine, legal | `features/legal/` (flat only) | CREATE modules/ with 4 subdirs |
| D-007 | Feature exists in source, no governance modules | `apps/VCSM/src/features/moderation` — 35 files, modules: moderation, types | `features/moderation/` (flat only) | CREATE modules/moderation/ and modules/types/ |
| D-008 | Feature exists in source, no governance modules | `apps/VCSM/src/features/notifications` — 43 files, modules: inbox, notifications, runtime, types | `features/notifications/` (flat only) | CREATE modules/ with 4 subdirs |
| D-009 | Feature exists in source, no governance modules | `apps/VCSM/src/features/post` — 116 files, modules: commentcard, post, postcard | `features/post/` (flat only) | CREATE modules/ with 3 subdirs |
| D-010 | Feature exists in source, no governance modules | `apps/VCSM/src/features/professional` — 33 files, modules: briefings, core, enterprise, professional, professional-nurse | `features/professional/` (flat only) | CREATE modules/ with 5 subdirs |
| D-011 | Feature exists in source, no governance modules | `apps/VCSM/src/features/profiles` — 374 files, modules: config, debug, kinds, profiles | `features/profiles/` (flat only) | CREATE modules/ with 4 subdirs |
| D-012 | Feature exists in source, no governance modules | `apps/VCSM/src/features/public` — 64 files, modules: public, vportBusinessCard, vportMenu | `features/public/` (flat only) | CREATE modules/ with 3 subdirs |
| D-013 | Feature exists in source, no governance modules | `apps/VCSM/src/features/settings` — 91 files, modules: account, privacy, profile, settings, sponsored, vports | `features/settings/` (flat only) | CREATE modules/ with 6 subdirs |
| D-014 | Feature exists in source, no governance modules | `apps/VCSM/src/features/social` — 44 files, modules: friend, privacy, social | `features/social/` (flat only) | CREATE modules/ with 3 subdirs |
| D-015 | Feature exists in source, no governance modules | `apps/VCSM/src/features/vport` — 29 files, modules: public, utils, vport | `features/vport/` (flat only) | CREATE modules/ with 3 subdirs |
| D-016 | Source feature exists, governance folder MISSING, FROZEN | `apps/VCSM/src/features/wanders` — 124 files | NONE | DO_NOT_TOUCH (frozen) |
| D-017 | Source feature exists, governance folder MISSING, FROZEN | `apps/VCSM/src/features/wanderex` — 22 files | NONE | DO_NOT_TOUCH (frozen) |
| D-018 | Governance folder exists, zero source files | `features/styles/` | `features/styles/` (0 source files) | NEEDS_REVIEW — may be vestigial or asset-only |
| D-019 | Governance folder exists, minimal source files | `features/ui/` | `features/ui/` (1 source file) | NEEDS_REVIEW — may need module separation (modern, ui) |
| D-020 | Scanner maps not routed to ZZnotforproduction/SCANNER/ | 43 JSON maps in apps/scanner/maps/ | ZZnotforproduction/SCANNER/maps/ (empty) | Consider snapshot strategy for governance history |
| D-021 | ZZnotforproduction/SCANNER/contracts/ empty | Scanner has contracts/ dir with JSON schemas | ZZnotforproduction/SCANNER/contracts/ (empty) | Copy/link scanner contracts for governance reference |

---

## High-Priority Drift Summary

| Priority | Count | Description |
|---|---|---|
| HIGH | 15 | Features with multi-module source structure and NO modules/ in governance |
| HIGH | 1 | Dashboard shell module missing (D-003) |
| MEDIUM | 2 | Frozen features with no governance folder (D-016, D-017) — expected, no action |
| LOW | 2 | Governance folders with zero/minimal source (D-018, D-019) — review needed |
| INFO | 2 | Scanner map/contract mirroring not set up (D-020, D-021) |

---

## No False Positives

The following were checked and found correct — no drift:

| Check | Result |
|---|---|
| All 18 dashboard modules have ZZ folders | PASS |
| All 9 engine modules have ZZ folders | PASS |
| All single-module features have flat ZZ folders | PASS |
| No duplicate feature folder names across apps (VCSM vs Wentrex) | PASS — correctly scoped |
| No uppercase/lowercase casing inconsistencies in module names | PASS — camelCase consistent |
| Feature `vport` has ZZ folder | PASS |
| feature.status all `active` in scanner for covered features | PASS |

---

## Drift Root Cause

The governance folder bootstrap (Wave 1, 2026-06-02) created feature-level folders and the dashboard modules, but did not create module-level subdirectories for non-dashboard features. The scanner behavior-map identifies 95 modules across 40 features, but only the 18 dashboard modules have governance folders. The remaining 77 modules across 14 features are undocumented at the module level.
