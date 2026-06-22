# Dashboard — Ownership

**Feature owner:** VPORT dashboard team  
**Source:** `apps/VCSM/src/features/dashboard/vport/`  
**Architecture doc:** `logan/marvel/architect/modules/vcsm.vport-dashboard.architecture.md`

## Actor Ownership Model

- Dashboard access gated to authenticated VPORT actor owners
- Identity resolved via `actorId` + `kind` — never raw IDs
