# Module: Public VPORT Menu

**VPORT Kinds:** RESTAURANT + food-adjacent types (baker, chef, caterer)
**Public/Owner:** PUBLIC (unauthenticated QR scan entry)
**Route/Surface:** Public QR-accessed menu display — no auth required
**Source:** `apps/VCSM/src/features/public/vportMenu/`
**Governance status:** NOT_STARTED
**Last audit:** —

---

## What This Module Does

The unauthenticated QR-scan landing page for restaurant customers to view a VPORT's menu. Has its own full feature stack: adapters, components, controller, dal, hooks, model, screen, view.

This is a DIFFERENT surface from:
- `DASHBOARD/modules/menu/` — covers owner menu management writes
- `TABS/tabs/menu/` — covers the authenticated profile tab menu view

This module covers the unauthenticated QR scan destination for restaurant customers.

Subdirectories: `adapters/`, `components/`, `controller/`, `dal/`, `hooks/`, `model/`, `screen/`, `view/`

## Why This Folder Exists

Full standalone feature with its own DAL serving unauthenticated viewers. No security audit has run. Key questions: does the public DAL expose only published menu items? Are internal IDs (menu_category_id, menu_item_id, actor_id) included in the public response? Can inactive or draft menu items be accessed via QR? Can the QR link expose internal VPORT identifiers?

## Next Command

VENOM
