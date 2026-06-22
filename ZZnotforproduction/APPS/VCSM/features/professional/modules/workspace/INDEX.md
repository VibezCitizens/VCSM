---
title: Workspace Module — Index
status: STUB
feature: professional
module: workspace
source: venom+bw-derived
created: 2026-06-05
---

# professional / modules / workspace

Profession-specific workspaces — enterprise dashboard and nurse workspace. Also includes core config and access gate. All UI-only at present (no active DB DAL for nurse-specific data).

## Source Files

| File | Layer |
|---|---|
| core/config/professionCatalog.config.js | config |
| core/storage/professionalAccess.storage.js | localStorage |
| enterprise/data/enterpriseSeed.data.js | seed data |
| enterprise/hooks/useEnterpriseWorkspace.js | hook |
| enterprise/model/buildEnterpriseView.model.js | model |
| enterprise/ui/EnterpriseWorkspace.jsx | UI |
| enterprise/ui/enterprisePanels.jsx | UI |
| enterprise/ui/enterpriseRows.jsx | UI |
| professional-nurse/facility/ui/AddFacilityInsightForm.jsx | UI |
| professional-nurse/housing/config/housingCategories.config.js | config |
| professional-nurse/housing/ui/AddForm.jsx | UI |
| professional-nurse/housing/ui/AddHousingExperienceForm.jsx | UI |
| professional-nurse/housing/ui/CitySelector.jsx | UI |
| professional-nurse/housing/ui/HousingCategoryBadge.jsx | UI |
| professional-nurse/housing/ui/HousingEmptyState.jsx | UI |
| professional-nurse/housing/ui/HousingNoteCard.jsx | UI |
| professional-nurse/housing/ui/HousingNotesList.jsx | UI |
| professional-nurse/screens/NurseHomeScreen.jsx | screen |
| professional-nurse/screens/NurseHomeScreenView.jsx | view |
| professional-nurse/screens/views/* | views (4 files) |
| screens/ProfessionalAccessScreen.jsx | access gate |

## Governance Files

| File | Status |
|---|---|
| INDEX.md | STUB |
| BEHAVIOR.md | STUB |
| ARCHITECTURE.md | STUB |
| SECURITY.md | STUB |

## THOR Status

**THOR RELEASE BLOCKER** — WORK-SEC-001 (HIGH): profession verification gate non-functional.
