# Module: VPORT Core

**VPORT Kinds:** ALL
**Public/Owner:** BOTH
**Route/Surface:** Core VPORT identity resolution, public scaffold, actor management (used by all VPORT surfaces)
**Source:** `apps/VCSM/src/features/vport/`
**Governance status:** NOT_STARTED
**Last audit:** —

---

## What This Module Does

The foundational VPORT feature layer — provides adapters, controller, dal, hooks, model, public, screens, and utils that are consumed by dashboard and profile tab features. This is not a dashboard card or a tab-specific feature. It is the platform identity foundation that all VPORT surfaces depend on.

Subdirectories: `adapters/`, `components/`, `controller/`, `dal/`, `hooks/`, `model/`, `public/`, `screens/`, `utils/`

## Why This Folder Exists

The core `features/vport/` feature provides the identity resolution layer for all VPORT surfaces but has no governance coverage. Its `public/` subdirectory serves unauthenticated views. Its `dal/` writes actor and VPORT records. Its `controller/` layer manages VPORT kind-level operations. None of this has been architecturally mapped or security-audited.

## Next Command

ARCHITECT first (to map the data contract and layer dependencies), then VENOM.
