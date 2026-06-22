# [TASK-BOTTOMBAR-RELOCATE] — Relocation Report

**Date:** 2026-06-06
**Status:** COMPLETE
**Executor:** Claude Code

---

## Tree Diff

### Files MOVED

| Source | Destination |
|---|---|
| `apps/VCSM/src/shared/components/BottomNavBar.jsx` | `apps/VCSM/src/features/shell/modules/bottom-bar/components/BottomNavBar.jsx` |
| `apps/VCSM/src/features/dashboard/vport/components/VportLeadsChip.jsx` | `apps/VCSM/src/features/shell/modules/bottom-bar/components/VportLeadsChip.jsx` |
| `apps/VCSM/src/features/dashboard/vport/dashboard/cards/leads/hooks/useVportNewLeadsCount.js` | `apps/VCSM/src/features/shell/modules/bottom-bar/hooks/useVportLeadsCount.js` (renamed) |

### Files CREATED

| File | Purpose |
|---|---|
| `hooks/useBottomNavVisibility.js` | Route-based visibility hook extracted from RootLayout |
| `constants/bottomBar.constants.js` | `POLL_MS = 60_000` (was inline in useVportNewLeadsCount) |
| `constants/bottomBar.events.js` | Reserved; `noti:refresh` excluded (see note below) |
| `styles/bottom-nav-bar.css` | Placeholder — migration target for Tailwind classes |
| `styles/vport-leads-chip.css` | Placeholder — migration target for inline styles |
| `index.js` | Barrel: BottomNavBar, VportLeadsChip, useBottomNavVisibility, useVportLeadsCount, POLL_MS |
| `docs/BEHAVIOR.md` | §5 Security Rules + §9 Must Never Happen — populated |
| `docs/ARCHITECTURE.md` | Module structure, dependencies, open governance findings |
| `docs/SECURITY.md` | Security summary stub pointing to full SECURITY.md |

### Files EDITED

| File | Change |
|---|---|
| `apps/VCSM/src/app/layout/RootLayout.jsx` | Replaced BottomNavBar + VportLeadsChip imports; added `useBottomNavVisibility`; removed local `hideBottomNav` computation |
| `apps/VCSM/src/features/dashboard/vport/adapters/vport.adapter.js` | Updated VportLeadsChip re-export source to shell module path |
| `apps/VCSM/src/features/dashboard/vport/dashboard/cards/leads/index.js` | Removed `useVportNewLeadsCount` barrel re-export (hook moved+renamed) |

### Files DELETED (old source locations)

- `apps/VCSM/src/shared/components/BottomNavBar.jsx`
- `apps/VCSM/src/features/dashboard/vport/components/VportLeadsChip.jsx`
- `apps/VCSM/src/features/dashboard/vport/dashboard/cards/leads/hooks/useVportNewLeadsCount.js`

---

## Import Changes Detail

### RootLayout.jsx

**Removed:**
```js
import BottomNavBar from "@/shared/components/BottomNavBar";
import { VportLeadsChip } from "@/features/dashboard/vport/adapters/vport.adapter";
```

**Added:**
```js
import { BottomNavBar, VportLeadsChip, useBottomNavVisibility } from "@/features/shell/modules/bottom-bar";
```

**Body change:**
- Added: `const { hideBottomNav } = useBottomNavVisibility();` (after `identityLoading` destructure)
- Removed: `const hideBottomNav = isChatSubScreen || isAuthRoute || isLearningRoute || isDevPerfRoute;`
- `hideTopNav` and all other route state kept — still needed for mainClass, rootClassName, and debug logging

### VportLeadsChip.jsx (in new location)

- Changed: `import { useVportNewLeadsCount } from "@/features/dashboard/vport/dashboard/cards/leads/hooks/useVportNewLeadsCount"` → `import { useVportLeadsCount } from "@/features/shell/modules/bottom-bar/hooks/useVportLeadsCount"`
- Changed: `useVportNewLeadsCount(actorId)` → `useVportLeadsCount(actorId)`

### useVportLeadsCount.js (in new location)

- Renamed export: `useVportNewLeadsCount` → `useVportLeadsCount`
- Added: `import { POLL_MS } from "@/features/shell/modules/bottom-bar/constants/bottomBar.constants"`
- Removed: `const POLL_MS = 60_000;` (now from constants)
- All other logic identical

---

## noti:refresh — Exclusion Note

`bottomBar.events.js` was created as a placeholder but `noti:refresh` was NOT moved there.

**Reason:** `noti:refresh` is a platform-wide event dispatched from 5 features:
1. `features/settings/privacy/hooks/usePendingFollowRequestActions.js` (dispatch)
2. `features/social/friend/request/hooks/useFollowRequestActions.js` (dispatch)
3. `features/notifications/types/follow/FollowRequestItem.view.jsx` (dispatch)
4. `features/notifications/inbox/controller/NotificationsHeader.controller.js` (dispatch)
5. `features/shell/modules/bottom-bar/components/BottomNavBar.jsx` (dispatch)

And listened to by:
1. `bootstrap/bootstrap.hydrate.controller.js` (listener — lower layer than features)
2. `features/notifications/inbox/hooks/useNotificationInbox.js` (listener)

Centralizing the constant in `bottomBar.events.js` would require notifications, social, and settings features to import from the shell module — incorrect direction. The canonical home for this constant is `bootstrap.hydrate.controller.js` (ELEK-004 patch queue item).

---

## Behavior Preserved

| Behavior | Status |
|---|---|
| BottomNavBar always-mounted via CSS display:none | PRESERVED — RootLayout wrapper unchanged |
| VportLeadsChip conditionally mounted | PRESERVED — `{!hideBottomNav && <VportLeadsChip />}` unchanged |
| hideBottomNav logic identical to before | PRESERVED — same routes, same regex patterns |
| Leads count polling at 60s interval | PRESERVED — POLL_MS = 60_000 moved to constants, same value |
| noti:refresh dispatch guard (pathname check) | PRESERVED — identical useEffect in BottomNavBar |
| VportLeadsChip guard (null return for non-vport) | PRESERVED — identical condition |
| Profile nav slug cache + fallback behavior | PRESERVED — getCachedActorCanonicalSlug import path unchanged |

---

## Verification Results

| Check | Result |
|---|---|
| Old `BottomNavBar` import path references | CLEAN — 0 remaining |
| Old `VportLeadsChip` component path references | CLEAN — 0 remaining |
| Old `useVportNewLeadsCount` references | CLEAN — 0 remaining |
| New shell module import references | 4 files confirmed |
| Old source files removed | Confirmed — all 3 deleted |
| New module directory tree | 12 files in place |

---

## Risk Assessment

| Risk | Likelihood | Mitigation |
|---|---|---|
| Vite `@/` alias resolves new path | LOW | Path alias points to `src/` — `features/shell/...` resolves correctly |
| useBottomNavVisibility produces different result than old inline logic | NONE | Identical regex patterns and route arrays |
| Double useLocation() call (RootLayout + hook) | INFO | React Router memoizes location per render — no extra network call |
| vport.adapter.js re-export of VportLeadsChip | LOW | Updated to new path; backward compat preserved for any adapter consumers |

---

## Open TODOs (deferred per task scope)

These were identified during governance but are outside [TASK-BOTTOMBAR-RELOCATE] scope:

1. **ELEK-001** — Freeze `window.OneSignal` reference in `onesignalClient.js`
2. **ELEK-002** — Replace raw `actorId` UUID in VportLeadsChip nav URL with canonical slug
3. **VEN-BN-005** — Fix identity adapter bypass in `VportLeadsChip.jsx` and `useVportLeadsCount.js` (use `identity.adapter` instead of `identityContext` directly)
4. **CONTRACT-CRIT-001** — Fix `BottomNavBar` profiles controller direct import → route through `profiles.adapter`
5. **ELEK-004** — Extract `noti:refresh` constant to `bootstrap.hydrate.controller.js`
