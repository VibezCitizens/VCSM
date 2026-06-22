---
title: Briefings Module — Index
status: STUB
feature: professional
module: briefings
source: venom+bw-derived
created: 2026-06-05
---

# professional / modules / briefings

Professional briefings list — reads and marks-seen vc.notifications scoped to professional content (compliance domain). Primary DB write surface for this feature.

## Source Files

| File | Layer |
|---|---|
| briefings/controller/listProfessionalBriefings.controller.js | controller |
| briefings/dal/professionalBriefings.read.dal.js | read + write DAL |
| briefings/hooks/useProfessionalBriefings.js | hook |
| briefings/model/professionalBriefing.model.js | model |
| briefings/components/BriefingsFilters.jsx | UI |
| briefings/components/BriefingsList.jsx | UI |
| briefings/components/BriefingsSummaryCards.jsx | UI |
| briefings/screen/ProfessionalBriefingsScreen.jsx | screen |
| briefings/view/ProfessionalBriefingsScreenView.jsx | view |

## Governance Files

| File | Status |
|---|---|
| INDEX.md | STUB |
| BEHAVIOR.md | STUB |
| ARCHITECTURE.md | STUB |
| SECURITY.md | STUB |

## THOR Status

**THOR RELEASE BLOCKER** — BRIEF-SEC-001 (HIGH), BRIEF-SEC-002 (HIGH)
