---
name: vcsm.styles.index
description: VCSM styles feature source inventory — rebuilt by ARCHITECT V2 2026-06-04
metadata:
  type: index
  owner: ARCHITECT
  last-rebuilt: 2026-06-04
---

# INDEX — VCSM / features / styles

**Status:** ACTIVE
**Last rebuilt by ARCHITECT:** 2026-06-04
**Scanner version:** 1.1.0

## Source Inventory

| Layer | Count | Notes |
|---|---|---|
| Controllers | 0 | CSS module — no controllers |
| DAL files | 0 | CSS module — no data access layer |
| Hooks | 0 | CSS module — no hooks |
| Models | 0 | CSS module — no models |
| Screens | 0 | CSS module — no screens |
| Components | 0 | CSS module — no components |
| Adapters | 0 | CSS module — no adapters |
| Barrels | 0 | CSS module — no barrel exports |
| Tests | 0 | No unit tests (CSS module; visual regression not yet configured) |
| Routes | 0 | No routes — loaded at boot via static import |
| CSS source files | 2 | global.css, citizens-theme.css |
| Total source files | 2 | Scanner reports 0 (JS-only count); filesystem confirms 2 CSS files |

## Write Surface Map

No write surfaces detected by scanner. This is correct — this module is pure CSS with no database operations, RPC calls, or edge function calls.

## Security-Sensitive Surfaces

No high-sensitivity write surfaces in static scan. This module contains no auth, moderation, identity, notification, or financial operations.

## Engine Dependencies

None detected. The styles module has no engine dependencies. It is a platform primitive consumed by engines and features, not the reverse.

## Routes

No routes in route-map for this feature. Both CSS files are loaded unconditionally at application boot:

- `apps/VCSM/src/main.jsx` imports `@/styles/global.css` (line 6) and `@/styles/citizens-theme.css` (line 7)
- `apps/VCSM/src/App.jsx` applies `className="citizens-theme"` to the root div

## Source File Details

| File | Purpose |
|---|---|
| `apps/VCSM/src/styles/citizens-theme.css` | Design token source of truth — all `--vc-*` CSS custom properties (backgrounds, surfaces, borders, text, accents, shadows, gradients, legacy `--cit-*` aliases) |
| `apps/VCSM/src/styles/global.css` | App-wide reset, root/body layout, input/button resets, scrollbar suppression, safe-area utilities, typography, keyframe animations (slideUp, fogSlow, fogFast, fade-in, menu-in) |

## Known Consumers

| Consumer File | What It Consumes |
|---|---|
| `apps/VCSM/src/main.jsx` | Imports both CSS files at boot |
| `apps/VCSM/src/App.jsx` | Applies `citizens-theme` className |
| `apps/VCSM/src/features/auth/styles/authTheme.js` | Imports from src/styles — verify read-only |
| All feature components | Reference `--vc-*` tokens via `var()` |

## Documentation Links

| Doc | Status |
|---|---|
| BEHAVIOR.md | PRESENT — placeholder only; real contract needed |
| ARCHITECTURE.md | PRESENT (this run — 2026-06-04) |
| CURRENT_STATUS.md | PRESENT (this run — 2026-06-04) |
