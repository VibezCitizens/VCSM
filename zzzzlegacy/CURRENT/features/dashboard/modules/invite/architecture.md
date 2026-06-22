# Invite — Architecture

**ARCHITECT status:** NOT_STARTED

Architecture report will be generated after the ARCHITECT command runs.

---

## Known Source Paths

- `apps/VCSM/src/features/invite/controller/`
- `apps/VCSM/src/features/invite/dal/`
- `apps/VCSM/src/features/invite/hooks/`
- `apps/VCSM/src/features/invite/screens/`

## Known Cross-Feature Dependency

Shares `joinInvite.dal.js` with `features/join/`. ARCHITECT must determine the canonical location for this shared DAL and confirm the boundary between issuance (invite) and acceptance (join).
