# INDEX — features/shell/modules/bottom-bar

**Last TONYSTARK Run:** 2026-06-06
**Module Status:** ACTIVE — BUILD_WITH_CAUTION
**Application Scope:** VCSM

---

## Source Inventory

| File | Type | Layer | Status |
|---|---|---|---|
| `components/BottomNavBar.jsx` | JSX | Component | ACTIVE — CONTRACT-CRIT-001 open |
| `components/VportLeadsChip.jsx` | JSX | Component | ACTIVE — VEN-BN-005, ELEK-002 open |
| `hooks/useBottomNavVisibility.js` | JS | Hook | CLEAN |
| `hooks/useVportLeadsCount.js` | JS | Hook | ACTIVE — VEN-BN-005 open |
| `constants/bottomBar.constants.js` | JS | Constants | CLEAN |
| `constants/bottomBar.events.js` | JS | Constants | RESERVED (empty) |
| `styles/bottom-nav-bar.css` | CSS | Style | PLACEHOLDER |
| `styles/vport-leads-chip.css` | CSS | Style | PLACEHOLDER |
| `index.js` | JS | Barrel | CLEAN |
| `docs/ARCHITECTURE.md` | MD | Governance | ACTIVE |
| `docs/BEHAVIOR.md` | MD | Governance | ACTIVE |
| `docs/SECURITY.md` | MD | Governance | ACTIVE |

**Total files:** 12

---

## Module Exports (via index.js)

| Export | Source | Type |
|---|---|---|
| `BottomNavBar` (default) | `components/BottomNavBar.jsx` | React Component |
| `VportLeadsChip` | `components/VportLeadsChip.jsx` | React Component |
| `useBottomNavVisibility` | `hooks/useBottomNavVisibility.js` | Hook |
| `useVportLeadsCount` | `hooks/useVportLeadsCount.js` | Hook |
| `POLL_MS` | `constants/bottomBar.constants.js` | Constant |

---

## Consumers

| Consumer | Import |
|---|---|
| `app/layout/RootLayout.jsx` | `@/features/shell/modules/bottom-bar` (barrel) |
| `features/dashboard/vport/adapters/vport.adapter.js` | `@/features/shell/modules/bottom-bar` (VportLeadsChip re-export) |

---

## Governance Artifacts

| File | Path |
|---|---|
| Architecture | `ZZnotforproduction/APPS/VCSM/features/shell/modules/bottom-bar/TONYSTARK_ARCHITECTURE.md` |
| Index | `ZZnotforproduction/APPS/VCSM/features/shell/modules/bottom-bar/INDEX.md` (this file) |
| Relocation Report | `ZZnotforproduction/APPS/VCSM/features/shell/modules/bottom-bar/2026-06-06_task-bottombar-relocate_report.md` |
| Evidence Bundle | `outputs/2026/06/06/TONYSTARK/evidence-bundle.md` |
| Current Status | `ZZnotforproduction/APPS/VCSM/features/shell/modules/bottom-bar/CURRENT_STATUS.md` |

---

## Open Findings Summary

| ID | Severity | File | Description |
|---|---|---|---|
| CONTRACT-CRIT-001 | CRITICAL (arch) | BottomNavBar.jsx | Direct profiles controller import |
| ELEK-001 / BW-BN-001 | MEDIUM | BottomNavBar.jsx | OneSignal window ref unfrozen |
| VEN-BN-005 | LOW | VportLeadsChip.jsx, useVportLeadsCount.js | Identity context bypass |
| ELEK-002 / BW-BN-002 | LOW | VportLeadsChip.jsx | Raw actorId UUID in navigation URL |
| BW-BN-003 | LOW | BottomNavBar.jsx | noti:refresh XSS amplification |
| STYLE-001 | HIGH (arch) | VportLeadsChip.jsx | Inline styles + @keyframes in JSX |
| CROSS-CTRL-001 | MEDIUM (arch) | useVportLeadsCount.js | Dashboard controller direct import |
