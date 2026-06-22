# Module: Flyer Builder

**VPORT Kinds:** ALL
**Public/Owner:** OWNER
**Route/Surface:** DASHBOARD — owner-only flyer and marketing material creation tool
**Source:** `apps/VCSM/src/features/dashboard/flyerBuilder/`
**Governance status:** NOT_STARTED
**Last audit:** —

---

## What This Module Does

A dashboard tool that allows VPORT owners to create printable and shareable marketing materials (flyers, QR cards). Contains a full subsystem: `designStudio/` (canvasStage, sidebarRight, topBar components with their own controller, dal, hooks, model, screens). Has its own DAL and write paths separate from the main dashboard cards.

Subsystem: `designStudio/` with components (canvasStage, sidebarRight, topBar), controller, dal, hooks, model, screens.
Also: `components/printableQr/`, `controller/`, `dal/`, `hooks/`, `model/`, `screens/`, `styles/`

## Why This Folder Exists

Large owner-only tool with a full controller+DAL+upload surface and no security audit. The DAL write paths are unaudited — what does it write and to which tables? Is the ownership gate checked before any save/publish? Does the printable QR component embed raw internal IDs? Does the designStudio DAL bypass ownership?

## Next Command

VENOM
