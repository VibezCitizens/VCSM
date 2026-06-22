# Module: VPORT Profile Header

**VPORT Kinds:** ALL
**Public/Owner:** BOTH
**Route/Surface:** TAB — rendered above all profile tab views (public + owner)
**Source:** `apps/VCSM/src/features/profiles/kinds/vport/ui/vportprofileheader/`
**Governance status:** NOT_STARTED
**Last audit:** —

---

## What This Module Does

The VPORT profile header component renders at the top of every VPORT profile tab view — for all 15 tabs, all VPORT kinds, all viewer types. It displays identity fields: name, VPORT type, location, hours, cover media. Shared across all public tab views.

## Why This Folder Exists

Shared component rendering identity data for ALL public viewers across ALL 15 tabs. A data exposure in this component affects every tab simultaneously. Field selection, data minimization for public viewers, and visibility controls have never been audited. Any owner-only fields (contact details, internal config) must be confirmed absent from the public-viewer render.

## Note: Photos/Gallery Contradiction

The TABS/tabs/gallery/ naming vs governance matrix "photos" tab row is an unresolved contradiction. This folder does NOT resolve that contradiction. It remains flagged for ARCHITECT investigation. See `VPORT_ARCHITECTURE_FOLDER_GAP_REPORT.md`.

## Next Command

VENOM
