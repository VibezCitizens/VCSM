# Module: Settings — VPORT

**VPORT Kinds:** ALL
**Public/Owner:** OWNER
**Route/Surface:** DASHBOARD — VPORT-specific settings management layer
**Source:** `apps/VCSM/src/features/settings/vports/`
**Governance status:** NOT_STARTED
**Last audit:** —

---

## What This Module Does

The underlying VPORT-specific settings management feature layer. Distinct from the dashboard settings CARD (which is governed under `DASHBOARD/modules/settings/`). This feature provides the controller, DAL, hooks, model, and UI for VPORT configuration writes — visibility, privacy, business configuration.

Subdirectories: `controller/`, `dal/`, `hooks/`, `model/`, `ui/`

## Relationship to DASHBOARD/modules/settings/

`DASHBOARD/modules/settings/` covers the dashboard settings card UI and its ELEKTRA-patched ownership gates (ELEK-001/002). This module (`settings-vports`) covers the underlying feature layer that the card may consume. They may overlap — ARCHITECT should confirm the boundary.

## Why This Folder Exists

Separate feature path at `features/settings/vports/` with its own controller/DAL/model stack. Handles VPORT-specific configuration writes. May have ownership enforcement gaps distinct from what was patched in `DASHBOARD/modules/settings/`. No audit has run on this feature layer.

## Next Command

VENOM
