---
title: Workspace Module — Behavior
status: STUB
feature: professional
module: workspace
source: venom+bw-derived
created: 2026-06-05
---

# professional / modules / workspace — BEHAVIOR

## Status

STUB. Parent BEHAVIOR.md is a placeholder.

## Expected Behaviors (UNVERIFIED)

- ProfessionalAccessScreen gates access to professional workspaces
- profession key read from localStorage → determines which workspace to show
- Nurse workspace: NurseHomeScreen with Housing and FacilityInsights tabs
- Enterprise workspace: EnterpriseWorkspace with static/seeded data
- Nurse housing/facility forms: UI-only, no active DAL backend yet

## Known Broken Invariant

- Profession verification gate: ProfessionalAccessScreen passes hardcoded profession="nurse" to NurseHomeScreen — any authenticated user reaches nurse workspace (BW-PROF-002 BYPASSED)

## TODO

- [ ] Confirm how professionCatalog.config.js is used in access gate
- [ ] Confirm enterprise seed data is never inserted to DB (design-time only)
- [ ] Confirm nurse housing/facility forms have no active DAL submission path
