---
title: Workspace Module — Architecture
status: STUB
feature: professional
module: workspace
source: venom+bw-derived
created: 2026-06-05
---

# professional / modules / workspace — ARCHITECTURE

## Access Gate (Broken)

```
/professional → ProfessionalAccessScreen
  └── reads profession from localStorage (professionalAccess.storage.js) ← VEN-PROFESSIONAL-006
        └── hardcodes profession="nurse" → NurseHomeScreen ← BW-PROF-002 BYPASSED
              └── any authenticated user reaches nurse workspace
```

## Nurse Workspace

```
NurseHomeScreen → NurseHomeScreenView
  └── tabs: NurseWorkspaceTabs
        ├── HousingTabView → HousingNotesList + AddHousingExperienceForm (NO DAL backend)
        └── FacilityInsightsTabView → AddFacilityInsightForm (NO DAL backend)
```

## Enterprise Workspace

```
useEnterpriseWorkspace → buildEnterpriseView.model (static seed data)
  └── EnterpriseWorkspace → enterprisePanels + enterpriseRows (static display)
```

## TODO

- [ ] Confirm profession gate intended implementation (DB verification vs localStorage)
- [ ] Confirm nurse housing form submission target when DAL is added
