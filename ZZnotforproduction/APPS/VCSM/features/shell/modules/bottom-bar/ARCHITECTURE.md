# ARCHITECTURE — bottom-bar

**Module:** `features/shell/modules/bottom-bar`
**Last Updated:** 2026-06-06
**Source:** Extracted from ARCHITECT + governance chain (2026-06-06)

---

## Module Structure

```
features/shell/modules/bottom-bar/
├── components/
│   ├── BottomNavBar.jsx       — Always-mounted navigation rail (RootLayout consumer)
│   └── VportLeadsChip.jsx     — Floating leads badge (Vport owners only)
├── hooks/
│   ├── useBottomNavVisibility.js  — Route-based visibility computation
│   └── useVportLeadsCount.js      — Leads count polling + subscription
├── constants/
│   ├── bottomBar.constants.js     — POLL_MS (60s leads poll interval)
│   └── bottomBar.events.js        — Reserved for bottom-bar-owned DOM events
├── styles/
│   ├── bottom-nav-bar.css         — Placeholder (Tailwind migration target)
│   └── vport-leads-chip.css       — Placeholder (inline styles migration target)
├── docs/
│   ├── BEHAVIOR.md
│   ├── ARCHITECTURE.md            — this file
│   └── SECURITY.md
└── index.js                       — Barrel export
```

---

## Runtime Mount Pattern

`RootLayout` (app/layout/RootLayout.jsx) owns all mounting:
- `BottomNavBar`: always in DOM, wrapped in `<div style={hideBottomNav ? { display: 'none' } : undefined}>`
- `VportLeadsChip`: always in DOM, wrapped in `<div style={hideBottomNav ? { display: 'none' } : undefined}>`

Visibility is determined by `useBottomNavVisibility()` which reads `useLocation()`.

---

## Dependencies (Inbound)

| Consumer | Import Path |
|---|---|
| `app/layout/RootLayout.jsx` | `@/features/shell/modules/bottom-bar` (barrel) |
| `features/dashboard/vport/adapters/vport.adapter.js` | Re-exports `VportLeadsChip` for legacy consumers |

---

## Dependencies (Outbound — from this module)

| Dependency | Used By | Notes |
|---|---|---|
| `features/identity/adapters/identity.adapter` | BottomNavBar, VportLeadsChip, useVportLeadsCount | Correct adapter path — all sites resolved (2026-06-06) |
| `features/profiles/adapters/profiles.adapter` | BottomNavBar, VportLeadsChip | `useActorCanonicalSlug`, `useResolveActorBySlug` — correct adapter path |
| `bootstrap/bootstrap.hydrate.controller` | BottomNavBar | Correct |
| `bootstrap/bootstrap.selectors` | BottomNavBar | Correct |
| `shared/hooks/useOneSignalPush` | BottomNavBar | Correct |
| `features/dashboard/vport/dashboard/cards/leads/controller/vportLeads.controller` | useVportLeadsCount | Cross-feature controller access (TOXIN-BB-ARCH-002 — Pipe 2, deferred) |

---

## Governance Findings

| ID | Severity | Status | Closed By |
|---|---|---|---|
| ELEK-001 / BW-BN-001 | MEDIUM | CLOSED | Batch 1 M-1 — `_frozenSdk` freeze pattern in `onesignalClient.js` |
| ELEK-002 / BW-BN-002 | LOW | CLOSED | TICKET-BOTTOMNAV-SLUG-LEADS-ROUTE-001 — canonical slug nav + redirect resolver |
| VEN-BN-005 | LOW | CLOSED | Batch 1 C-1/C-2/C-3 — identity adapter import corrected at all 3 sites |
| CONTRACT-CRIT-001 | CRITICAL | CLOSED | TICKET-C4-BOTTOMBAR-PROFILE-ADAPTER-001 — `useActorCanonicalSlug` via adapter |
| CONTRACT-HIGH-001 | HIGH | CLOSED | TICKET-H1-BOTTOMBAR-LEADS-CHIP-STYLES-001 — styles extracted to `vport-leads-chip.css` |

Full security record: `apps/VCSM/src/features/shell/modules/bottom-bar/docs/SECURITY.md`
