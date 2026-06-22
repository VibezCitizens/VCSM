# Flyer Builder — Architecture

**ARCHITECT status:** NOT_STARTED

Architecture report will be generated after the ARCHITECT command runs.

---

## Known Source Paths

- `apps/VCSM/src/features/dashboard/flyerBuilder/` (root: controller, dal, hooks, model, screens, styles)
- `apps/VCSM/src/features/dashboard/flyerBuilder/components/printableQr/`
- `apps/VCSM/src/features/dashboard/flyerBuilder/designStudio/` (subsystem)
  - `designStudio/components/canvasStage/`
  - `designStudio/components/sidebarRight/`
  - `designStudio/components/topBar/`
  - `designStudio/controller/`
  - `designStudio/dal/`
  - `designStudio/hooks/`
  - `designStudio/model/`
  - `designStudio/screens/`

## Architecture Note

The designStudio subsystem is a significant nested feature with its own MVC stack. ARCHITECT should determine whether designStudio is correctly isolated from the parent flyerBuilder or whether there are shared DAL paths that create ownership enforcement gaps.