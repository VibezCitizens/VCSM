# TONYSTARK ARCHITECTURE — features/shell/modules/bottom-bar

**Module:** `features/shell/modules/bottom-bar`
**TONYSTARK Version:** V1 (manual scan)
**Application Scope:** VCSM
**Run Date:** 2026-06-06
**Status:** COMPLETE

---

## Output Metadata

| Field | Value |
|---|---|
| Command | TONYSTARK |
| Ticket | TASK-BOTTOMBAR-RELOCATE (complete) |
| Scope | `apps/VCSM/src/features/shell/modules/bottom-bar/` |
| Mode | V1 — Module Architecture (Area 6) + Global Repo Map (Area 1) |
| Run Date | 2026-06-06 |
| Status | BUILD_WITH_CAUTION |

---

## Mission

Map the complete architecture of the newly relocated `bottom-bar` shell module — verifying module structure, layer hierarchy, dependency flows, external consumers, open governance findings, and build readiness after the TASK-BOTTOMBAR-RELOCATE migration.

---

## Source Scope

| File | Type | Read |
|---|---|---|
| `features/shell/modules/bottom-bar/index.js` | Barrel | YES |
| `features/shell/modules/bottom-bar/components/BottomNavBar.jsx` | Component | YES |
| `features/shell/modules/bottom-bar/components/VportLeadsChip.jsx` | Component | YES |
| `features/shell/modules/bottom-bar/hooks/useBottomNavVisibility.js` | Hook | YES |
| `features/shell/modules/bottom-bar/hooks/useVportLeadsCount.js` | Hook | YES |
| `features/shell/modules/bottom-bar/constants/bottomBar.constants.js` | Constants | YES |
| `features/shell/modules/bottom-bar/constants/bottomBar.events.js` | Constants | YES |
| `features/shell/modules/bottom-bar/styles/bottom-nav-bar.css` | Style | YES |
| `features/shell/modules/bottom-bar/styles/vport-leads-chip.css` | Style | YES |
| `features/shell/modules/bottom-bar/docs/ARCHITECTURE.md` | Governance | YES |
| `features/shell/modules/bottom-bar/docs/BEHAVIOR.md` | Governance | YES |
| `features/shell/modules/bottom-bar/docs/SECURITY.md` | Governance | YES |
| `app/layout/RootLayout.jsx` | Consumer | YES |
| `bootstrap/bootstrap.hydrate.controller.js` | Dependency | YES |
| `bootstrap/bootstrap.selectors.js` | Dependency | YES |
| `features/profiles/controller/buildActorCanonicalSlug.controller.js` | Dependency | YES |
| `features/dashboard/vport/dashboard/cards/leads/controller/vportLeads.controller.js` | Dependency | YES |
| `ZZnotforproduction/APPS/VCSM/features/shell/modules/bottom-bar/2026-06-06_task-bottombar-relocate_report.md` | Prior run | YES |

---

## Module Ownership Map

| Layer | File | Responsibility |
|---|---|---|
| **Barrel** | `index.js` | Exports BottomNavBar, VportLeadsChip, useBottomNavVisibility, useVportLeadsCount, POLL_MS |
| **Component** | `components/BottomNavBar.jsx` | Persistent navigation rail — always in DOM |
| **Component** | `components/VportLeadsChip.jsx` | Floating leads badge for Vport owners only |
| **Hook** | `hooks/useBottomNavVisibility.js` | Route-based hide/show logic |
| **Hook** | `hooks/useVportLeadsCount.js` | Leads count poller (60s interval + fast path) |
| **Constants** | `constants/bottomBar.constants.js` | `POLL_MS = 60_000` |
| **Constants** | `constants/bottomBar.events.js` | Reserved (no events owned here yet) |
| **Styles** | `styles/bottom-nav-bar.css` | Placeholder — migration target for Tailwind classes |
| **Styles** | `styles/vport-leads-chip.css` | Placeholder — migration target for inline styles |
| **Docs** | `docs/BEHAVIOR.md` | Behavioral contract |
| **Docs** | `docs/ARCHITECTURE.md` | Architecture spec |
| **Docs** | `docs/SECURITY.md` | Security findings summary |

**File types detected:** `.jsx`, `.js`, `.css`
**No TypeScript detected.** All files are JavaScript / JSX.

---

## Route / Entry Map

| Entry | Owner | Guard | Notes |
|---|---|---|---|
| `RootLayout` mount | `app/layout/RootLayout.jsx` | `useBottomNavVisibility()` | Always in DOM; CSS display:none when hidden |
| VportLeadsChip mount | `app/layout/RootLayout.jsx` | `!hideBottomNav` | Conditionally rendered |
| `/feed` tab | `BottomNavBar` → NavLink | None | Public feed |
| `/explore` tab | `BottomNavBar` → NavLink | None | Public explore |
| `/chat` tab | `BottomNavBar` → NavLink | Badge count | chatUnread from bootstrap |
| `/upload` button | `BottomNavBar` → navigate | None | Gradient upload CTA |
| `/notifications` tab | `BottomNavBar` → NavLink | Badge count | notiCount from bootstrap |
| `/profile/*` tab | `BottomNavBar` → ProfileNavTab | `personaActorId` check | Slug cache → fallback to /profile/self |
| `/settings` tab | `BottomNavBar` → NavLink | None | Settings |
| `/actor/:actorId/dashboard/leads` | `VportLeadsChip` → navigate | `isVport && count > 0` | Raw UUID in URL — OPEN finding ELEK-002 |

---

## Dependency Map

### Inbound (consumers of bottom-bar)

| Consumer | Import Path | What It Takes |
|---|---|---|
| `app/layout/RootLayout.jsx` | `@/features/shell/modules/bottom-bar` (barrel) | BottomNavBar, VportLeadsChip, useBottomNavVisibility |
| `features/dashboard/vport/adapters/vport.adapter.js` | `@/features/shell/modules/bottom-bar` | VportLeadsChip re-export for legacy consumers |

### Outbound (what bottom-bar imports)

| Dependency | Importer | Path | Boundary Status |
|---|---|---|---|
| `identity.adapter` | BottomNavBar | `@/features/identity/adapters/identity.adapter` | CORRECT |
| `identityContext` | VportLeadsChip | `@/state/identity/identityContext` | VIOLATION — VEN-BN-005 |
| `identityContext` | useVportLeadsCount | `@/state/identity/identityContext` | VIOLATION — VEN-BN-005 |
| `bootstrap.hydrate.controller` | BottomNavBar | `@/bootstrap/bootstrap.hydrate.controller` | CORRECT |
| `bootstrap.selectors` | BottomNavBar | `@/bootstrap/bootstrap.selectors` | CORRECT |
| `useOneSignalPush` | BottomNavBar | `@/shared/hooks/useOneSignalPush` | CORRECT |
| `buildActorCanonicalSlug.controller` | BottomNavBar | `@/features/profiles/controller/buildActorCanonicalSlug.controller` | VIOLATION — CONTRACT-CRIT-001 |
| `vportLeads.controller` | useVportLeadsCount | `@/features/dashboard/vport/dashboard/cards/leads/controller/vportLeads.controller` | VIOLATION — cross-feature controller |
| `react-router-dom` | BottomNavBar, VportLeadsChip, useBottomNavVisibility | npm | CORRECT |
| `lucide-react` | BottomNavBar | npm | CORRECT |
| `@i18n` | BottomNavBar | internal alias | CORRECT |

---

## Execution Chain Map

### BottomNavBar — badge state chain

```
RootLayout.jsx
  └── BottomNavBar.jsx
        ├── useIdentity()           ← identity.adapter [correct]
        ├── useBootstrapHydration(actorId)  ← bootstrap.hydrate.controller [correct]
        ├── useOneSignalPush()      ← shared/hooks [correct]
        ├── useNotificationUnread() ← bootstrap.selectors → React Query
        │     └── getUnreadNotificationCount() ← notifications.adapter → notifications DAL → DB
        ├── useChatUnread()         ← bootstrap.selectors → React Query
        │     └── getUnreadBadgeCount() ← chat.adapter → chat DAL → DB
        └── ProfileNavTab → getCachedActorCanonicalSlug(actorId) [VIOLATION — direct controller]
              └── buildActorCanonicalSlugController → readActorSeoViewDAL → DB
```

### VportLeadsChip — leads count chain

```
RootLayout.jsx
  └── VportLeadsChip.jsx
        ├── useIdentity()           ← identityContext directly [VIOLATION — VEN-BN-005]
        └── useVportLeadsCount(actorId)
              ├── useIdentity()     ← identityContext directly [VIOLATION — VEN-BN-005]
              ├── countNewVportLeadsController(actorId, callerActorId)  [cross-feature controller]
              │     └── readNewLeadsCountByProfileDAL → DB
              └── fastCountNewVportLeadsController(actorId, callerActorId, profileId) [cross-feature controller]
                    └── readNewLeadsCountByProfileDAL → DB
```

### useBootstrapHydration — noti:refresh event chain

```
BottomNavBar
  └── useBootstrapHydration(personaActorId)
        └── window.addEventListener('noti:refresh', onGlobalRefresh)
              └── queryClient.invalidateQueries({ notificationUnread, chatUnread })
```

```
BottomNavBar
  └── useEffect [location.pathname]
        └── if (path.startsWith('/notifications') || path.startsWith('/chat'))
              └── window.dispatchEvent(new Event('noti:refresh'))
```

---

## Boundary Review

| Boundary | Status | Notes |
|---|---|---|
| UI / logic separation | PASS | Hooks own all logic; components render only |
| Feature boundary | PARTIAL | 2 of 3 outbound feature deps use correct adapter pattern; 2 bypass |
| Adapter boundary | VIOLATION | VportLeadsChip + useVportLeadsCount import identityContext directly (VEN-BN-005) |
| Controller boundary | VIOLATION | BottomNavBar imports profiles controller directly (CONTRACT-CRIT-001); useVportLeadsCount imports dashboard controller directly |
| DAL boundary | PASS | No direct DAL imports from this module |
| Service boundary | PASS | No direct service imports |
| Monitoring boundary | INFO | OneSignal via shared hook (correct); window.OneSignal not frozen (ELEK-001) |
| Security boundary | CAUTION | Raw actorId in VportLeadsChip URL (ELEK-002); identity bypass (VEN-BN-005) |

---

## Module Completeness Matrix

| Layer | Present | Files | Completeness |
|---|---|---|---|
| Component | YES | 2 | COMPLETE |
| Hook | YES | 2 | COMPLETE |
| Constants | YES | 2 | COMPLETE |
| Styles | YES (placeholder) | 2 | PARTIAL — inline styles not migrated |
| Index/Barrel | YES | 1 | COMPLETE |
| Docs | YES | 3 (ARCHITECTURE, BEHAVIOR, SECURITY) | COMPLETE |
| Controller | NO | 0 | N/A — not needed at this layer |
| DAL | NO | 0 | N/A — not needed at this layer |
| Model | NO | 0 | N/A — not needed at this layer |
| Adapter | NO | 0 | MISSING — no outbound adapter to wrap cross-feature calls |

**Missing:** Module has no adapter wrapping cross-feature controller access. `useVportLeadsCount` imports a dashboard controller directly. An optional `leadsCount.adapter.js` or routing through an existing `dashboard.adapter` would close this.

---

## File Impact Map

| File | Status | Risk |
|---|---|---|
| `components/BottomNavBar.jsx` | ACTIVE — CONTRACT-CRIT-001 open | MEDIUM — direct controller import |
| `components/VportLeadsChip.jsx` | ACTIVE — VEN-BN-005 + ELEK-002 open | LOW-MEDIUM — identity bypass + raw UUID |
| `hooks/useBottomNavVisibility.js` | CLEAN | LOW |
| `hooks/useVportLeadsCount.js` | ACTIVE — VEN-BN-005 open | LOW — identity bypass |
| `constants/bottomBar.constants.js` | CLEAN | LOW |
| `constants/bottomBar.events.js` | RESERVED | LOW |
| `styles/bottom-nav-bar.css` | PLACEHOLDER | LOW — migration pending |
| `styles/vport-leads-chip.css` | PLACEHOLDER | LOW — migration pending |
| `index.js` | CLEAN | LOW |

---

## Open Governance Findings

| ID | Severity | Status | File | Description |
|---|---|---|---|---|
| CONTRACT-CRIT-001 | CRITICAL (arch) | OPEN | BottomNavBar.jsx | Direct import of `getCachedActorCanonicalSlug` from profiles controller — must route through profiles.adapter |
| VEN-BN-005 | LOW | OPEN | VportLeadsChip.jsx, useVportLeadsCount.js | Identity adapter bypass — `identityContext` imported directly instead of via `identity.adapter` |
| ELEK-001 / BW-BN-001 | MEDIUM | OPEN | BottomNavBar.jsx (via onesignalClient) | `window.OneSignal` not frozen — XSS amplification path to auth UUID exfiltration |
| ELEK-002 / BW-BN-002 | LOW | OPEN | VportLeadsChip.jsx | Raw actorId UUID in navigation URL `/actor/{uuid}/dashboard/leads` |
| BW-BN-003 | LOW | OPEN | BottomNavBar.jsx | noti:refresh flooding under XSS — React Query batching limits blast radius |
| STYLE-001 | HIGH (arch) | OPEN | VportLeadsChip.jsx | Inline styles + embedded @keyframes in JSX — z-index 8500 hardcoded, #ef4444 hardcoded |
| STYLE-002 | HIGH (arch) | OPEN | BottomNavBar.jsx | Tailwind migration not complete — CSS placeholder files exist but unused |
| CROSS-CTRL-001 | MEDIUM (arch) | OPEN | useVportLeadsCount.js | Direct import of dashboard feature's internal controller — should route through adapter |

---

## Must Change (for finding closure)

| File | Required Change | Closes |
|---|---|---|
| `BottomNavBar.jsx` | Replace `getCachedActorCanonicalSlug` import with `profiles.adapter` re-export | CONTRACT-CRIT-001 |
| `VportLeadsChip.jsx` | Replace `identityContext` import with `identity.adapter` | VEN-BN-005 |
| `useVportLeadsCount.js` | Replace `identityContext` import with `identity.adapter` | VEN-BN-005 |
| `VportLeadsChip.jsx` | Replace `/actor/{actorId}/dashboard/leads` with slug-based or param-free path | ELEK-002 |
| `VportLeadsChip.jsx` | Move inline styles + @keyframes to `vport-leads-chip.css` | STYLE-001 |
| `features/profiles/adapters/profiles.adapter.js` | Re-export `getCachedActorCanonicalSlug` (or equivalent) | CONTRACT-CRIT-001 |

---

## Must Not Change

| File | Reason |
|---|---|
| `useBottomNavVisibility.js` | Identical logic to prior inline — verified CLEAN |
| `constants/bottomBar.constants.js` | Canonical POLL_MS definition |
| `RootLayout.jsx` mount pattern | CSS display:none wrap is required for subscription preservation |
| `bootstrap.hydrate.controller.js` | noti:refresh listener must stay at bootstrap layer |
| `index.js` barrel exports | Consumed by RootLayout and vport.adapter |

---

## Risks / Blockers

| Risk | Severity | Mitigation |
|---|---|---|
| CONTRACT-CRIT-001 — profiles controller direct import | CRITICAL (arch) | Add `getCachedActorCanonicalSlug` to `profiles.adapter.js` and update BottomNavBar import |
| VEN-BN-005 — identity context bypass | LOW | Switch VportLeadsChip + useVportLeadsCount to `identity.adapter` |
| ELEK-002 — raw UUID in leads URL | LOW | Resolve canonical slug via adapter before navigating |
| ELEK-001 — OneSignal window ref unfrozen | MEDIUM | Freeze `window.OneSignal` in onesignalClient.js (out of scope for this module) |
| STYLE-001 — inline styles in JSX | HIGH (arch) | Migrate to `vport-leads-chip.css` |
| CROSS-CTRL-001 — dashboard controller direct import | MEDIUM (arch) | Expose count functions via `dashboard.adapter` or `leads.adapter` |

---

## Validation Plan

```bash
# Verify no old import paths remain
rg "shared/components/BottomNavBar" apps/VCSM/src
rg "dashboard/vport/components/VportLeadsChip" apps/VCSM/src
rg "useVportNewLeadsCount" apps/VCSM/src

# Verify barrel exports resolve
rg "from.*shell/modules/bottom-bar" apps/VCSM/src

# Verify identity bypass
rg "identityContext" apps/VCSM/src/features/shell/modules/bottom-bar

# Verify controller bypass
rg "buildActorCanonicalSlug.controller" apps/VCSM/src/features/shell/modules/bottom-bar

# Build check
cd apps/VCSM && npx vite build --mode development 2>&1 | tail -20
```

---

## Final Verdict

**BUILD_WITH_CAUTION**

Module is structurally complete and correctly placed. The relocation (TASK-BOTTOMBAR-RELOCATE) is verified clean — all old paths removed, barrel exports correct, RootLayout mount pattern preserved.

Four open governance findings must be tracked before THOR can clear this module:

- **CONTRACT-CRIT-001** (CRITICAL arch): profiles controller direct import in BottomNavBar
- **ELEK-001** (MEDIUM): OneSignal window ref unfrozen
- **VEN-BN-005** (LOW): identity context bypass in VportLeadsChip + useVportLeadsCount
- **ELEK-002** (LOW): raw actorId UUID in VportLeadsChip navigation

None of these are security CRITICAL in isolation but the combination elevates the profile. CAUTION recommended for downstream commands (TOXIN/THANOS).
