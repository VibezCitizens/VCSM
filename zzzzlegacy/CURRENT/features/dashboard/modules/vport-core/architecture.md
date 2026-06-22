# VPORT Core — Architecture

**ARCHITECT status:** NOT_STARTED

Architecture report will be generated after the ARCHITECT command runs. ARCHITECT is the recommended first command for this module due to the foundational nature of the feature.

---

## Known Source Paths

- `apps/VCSM/src/features/vport/adapters/`
- `apps/VCSM/src/features/vport/components/`
- `apps/VCSM/src/features/vport/controller/`
- `apps/VCSM/src/features/vport/dal/`
- `apps/VCSM/src/features/vport/hooks/`
- `apps/VCSM/src/features/vport/model/`
- `apps/VCSM/src/features/vport/public/`
- `apps/VCSM/src/features/vport/screens/`
- `apps/VCSM/src/features/vport/utils/`

## Open Architecture Questions

- How does `features/vport/` relate to `features/dashboard/vport/`?
- What is the `public/` subdirectory — a public-facing view scaffold or utilities for public access?
- Are the utils shared with other features or private?
