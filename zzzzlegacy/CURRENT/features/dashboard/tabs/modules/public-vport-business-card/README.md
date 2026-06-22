# Module: Public VPORT Business Card

**VPORT Kinds:** ALL
**Public/Owner:** PUBLIC (unauthenticated)
**Route/Surface:** Public VPORT business card display — no auth required
**Source:** `apps/VCSM/src/features/public/vportBusinessCard/`
**Governance status:** NOT_STARTED
**Last audit:** —

---

## What This Module Does

Full standalone feature that renders a condensed VPORT identity card for public, unauthenticated viewers. Has its own controller, dal, hooks, model, screen, and view stack — not a tab, but a distinct public-facing surface served without authentication.

Subdirectories: `controller/`, `dal/`, `hooks/`, `model/`, `screen/`, `view/`, `view/components/`

## Why This Module Folder Is Under TABS/modules/ Not DASHBOARD/

This is a public-facing view surface, not an owner management tool. It belongs in the TABS tree because it is a viewer-facing VPORT surface. It is not a tab (has no tab key) so it goes under `modules/` rather than `tabs/`.

## Why This Folder Exists

Full feature stack serving unauthenticated viewers with VPORT identity data. No security audit has run. Key questions: what fields does the DAL expose without auth? Is there data minimization? Can this surface be used to enumerate VPORT identities? Are internal IDs exposed in the response?

## Next Command

VENOM
