---
name: vcsm.professional.index
description: VCSM professional feature source inventory — rebuilt by ARCHITECT V2 2026-06-04
metadata:
  type: index
  owner: ARCHITECT
  last-rebuilt: 2026-06-04
---

# INDEX — VCSM / features / professional

**Status:** ACTIVE
**Last rebuilt by ARCHITECT:** 2026-06-04
**Scanner version:** 1.1.0

## Source Inventory

| Layer | Count | Notes |
|---|---|---|
| Controllers | 5 | listProfessionalBriefings.controller.js (list + mark-seen) — callgraph count |
| DAL files | 2 | professionalBriefings.read.dal.js (read + write mark-seen against vc.notifications) |
| Hooks | 2 | useProfessionalBriefings.js, useEnterpriseWorkspace.js |
| Models | 12 | professionalBriefing.model.js (row + summary), buildEnterpriseView.model.js — callgraph count |
| Screens | 14 | ProfessionalAccessScreen.jsx, ProfessionalBriefingsScreen.jsx, NurseHomeScreen.jsx, NurseHomeScreenView.jsx, tab views — callgraph count |
| Components | 27 | BriefingsList.jsx, BriefingsFilters.jsx, BriefingsSummaryCards.jsx, enterprise panels/rows, nurse housing UI — callgraph count |
| Adapters | 0 | No adapter file present |
| Barrels | 9 | Detected by callgraph — no explicit index barrel files confirmed in static scan |
| Tests | 0 | No test files detected by scanner |
| Routes | 0 | No routes registered in route-map scanner |
| Total source files | 33 | From feature-map sourceFileCount |

## Write Surface Map

| Operation | Schema | Table | Function |
|---|---|---|---|
| update | vc | notifications | dalMarkProfessionalBriefingsSeen |

## Security-Sensitive Surfaces

- `dalMarkProfessionalBriefingsSeen` writes to `vc.notifications` (is_seen = true). The DAL enforces a `recipient_actor_id` equality filter alongside the `id` IN-list, which prevents cross-actor mark-seen. However, the controller does not verify that the caller is a verified professional — any actor with a valid actorId can invoke this mutation. This is a low-severity authorization gap worth auditing.

## Engine Dependencies

- identity
- notification

## Routes

No routes registered in route-map for this feature. Screens are accessed via internal navigation only.

## Documentation Links

| Doc | Status |
|---|---|
| BEHAVIOR.md | PRESENT (PLACEHOLDER — contract not yet authored) |
| ARCHITECTURE.md | PRESENT (this run) |
| CURRENT_STATUS.md | PRESENT (this run) |
