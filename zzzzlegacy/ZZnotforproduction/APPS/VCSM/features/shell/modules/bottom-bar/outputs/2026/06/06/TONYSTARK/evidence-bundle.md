# TONYSTARK Evidence Bundle — bottom-bar

**Run Date:** 2026-06-06
**Scope:** `apps/VCSM/src/features/shell/modules/bottom-bar/`
**Mode:** V1 Manual Scan

---

## Source Files Read

| File | Path |
|---|---|
| Barrel | `features/shell/modules/bottom-bar/index.js` |
| Component | `features/shell/modules/bottom-bar/components/BottomNavBar.jsx` |
| Component | `features/shell/modules/bottom-bar/components/VportLeadsChip.jsx` |
| Hook | `features/shell/modules/bottom-bar/hooks/useBottomNavVisibility.js` |
| Hook | `features/shell/modules/bottom-bar/hooks/useVportLeadsCount.js` |
| Constants | `features/shell/modules/bottom-bar/constants/bottomBar.constants.js` |
| Constants | `features/shell/modules/bottom-bar/constants/bottomBar.events.js` |
| Styles | `features/shell/modules/bottom-bar/styles/bottom-nav-bar.css` |
| Styles | `features/shell/modules/bottom-bar/styles/vport-leads-chip.css` |
| Docs | `features/shell/modules/bottom-bar/docs/ARCHITECTURE.md` |
| Docs | `features/shell/modules/bottom-bar/docs/BEHAVIOR.md` |
| Docs | `features/shell/modules/bottom-bar/docs/SECURITY.md` |
| Consumer | `app/layout/RootLayout.jsx` |
| Dependency | `bootstrap/bootstrap.hydrate.controller.js` |
| Dependency | `bootstrap/bootstrap.selectors.js` |
| Dependency | `features/profiles/controller/buildActorCanonicalSlug.controller.js` |
| Dependency | `features/dashboard/vport/dashboard/cards/leads/controller/vportLeads.controller.js` |
| Prior governance | `ZZnotforproduction/APPS/VCSM/features/shell/modules/bottom-bar/2026-06-06_task-bottombar-relocate_report.md` |

---

## Routes

| Route | Component | Guard |
|---|---|---|
| `/feed` | NavLink | none |
| `/explore` | NavLink | none |
| `/chat` | NavLink | chatUnread badge |
| `/upload` | navigate() | none |
| `/notifications` | NavLink | notiCount badge |
| `/profile/:slug` or `/profile/self` | ProfileNavTab | personaActorId check |
| `/settings` | NavLink | none |
| `/actor/:actorId/dashboard/leads` | VportLeadsChip navigate() | isVport + count > 0 |

---

## Screens

None. This module contains no screen files — components only.

---

## Hooks

| Hook | File | Consumes | DB Read |
|---|---|---|---|
| `useBottomNavVisibility` | `hooks/useBottomNavVisibility.js` | `useLocation()` | NO |
| `useVportLeadsCount` | `hooks/useVportLeadsCount.js` | `identityContext` [VIOLATION], `countNewVportLeadsController`, `fastCountNewVportLeadsController` | YES (via leads controller → DAL) |

---

## Controllers

None owned by this module. Consumers:

| Controller | Called By | Path |
|---|---|---|
| `buildActorCanonicalSlugController` | BottomNavBar → ProfileNavTab | `features/profiles/controller/buildActorCanonicalSlug.controller` [VIOLATION] |
| `countNewVportLeadsController` | useVportLeadsCount | `features/dashboard/.../controller/vportLeads.controller` [cross-feature] |
| `fastCountNewVportLeadsController` | useVportLeadsCount | `features/dashboard/.../controller/vportLeads.controller` [cross-feature] |

---

## DALs

None owned by this module. All DB reads are two hops: hook → external controller → external DAL → DB.

---

## Database Reads

| Table / View | Path | Frequency |
|---|---|---|
| `notification_unread` (via notifications adapter) | BottomNavBar → useNotificationUnread → React Query | Every 60s |
| `chat_unread` (via chat adapter) | BottomNavBar → useChatUnread → React Query | Every 30s |
| `vport.public_actor_seo_v` | BottomNavBar → getCachedActorCanonicalSlug → readActorSeoViewDAL | On profile tab tap (TTL-cached 10 min) |
| `vport.business_card_leads` (count) | useVportLeadsCount → countNewVportLeadsController → DAL | On mount, then every 60s |
| `identity.actor_owners` | useVportLeadsCount → countNewVportLeadsController → assertActorOwnsVportActorController | Every 60s (ownership gate) |

---

## Database Writes

None from this module.

---

## RPCs / Edge Functions

None.

---

## Engine Usage

None. This module does not consume any `engines/` layer.

---

## Dependencies

### Inbound (who imports bottom-bar)

- `app/layout/RootLayout.jsx` — BottomNavBar, VportLeadsChip, useBottomNavVisibility
- `features/dashboard/vport/adapters/vport.adapter.js` — VportLeadsChip re-export

### Outbound (what bottom-bar imports)

| Import | Status |
|---|---|
| `features/identity/adapters/identity.adapter` | CORRECT |
| `state/identity/identityContext` | VIOLATION (VEN-BN-005) |
| `bootstrap/bootstrap.hydrate.controller` | CORRECT |
| `bootstrap/bootstrap.selectors` | CORRECT |
| `shared/hooks/useOneSignalPush` | CORRECT |
| `features/profiles/controller/buildActorCanonicalSlug.controller` | VIOLATION (CONTRACT-CRIT-001) |
| `features/dashboard/vport/dashboard/cards/leads/controller/vportLeads.controller` | VIOLATION (CROSS-CTRL-001) |

---

## Security Sensitive Surfaces

| Surface | Risk | Finding |
|---|---|---|
| `window.OneSignal` reference in useOneSignalPush | XSS amplification → UUID exfil | ELEK-001 |
| `/actor/{actorId}/dashboard/leads` URL construction | Raw UUID in user-visible URL | ELEK-002 |
| `identityContext` direct read | Bypasses adapter authorization layer | VEN-BN-005 |
| `noti:refresh` dispatch on pathname match | XSS-triggered refresh flooding | BW-BN-003 |

---

## Call Chains

```
BottomNavBar
  useBootstrapHydration(personaActorId)
    → bootstrap.store.setHydrated(actorId)
    → window.addEventListener('noti:refresh', onGlobalRefresh)

BottomNavBar
  useNotificationUnread()
    → bootstrap.store.hydratedForActorId
    → React Query: queryKeys.notificationUnread(actorId)
    → getUnreadNotificationCount(actorId)    [notifications.adapter]
    → notifications DAL → DB (every 60s)

BottomNavBar
  useChatUnread()
    → React Query: queryKeys.chatUnread(actorId)
    → getUnreadBadgeCount(actorId)           [chat.adapter]
    → chat DAL → DB (every 30s)

BottomNavBar → ProfileNavTab
  getCachedActorCanonicalSlug(actorId)       [VIOLATION: direct controller]
    → controllerCache.get(actorId) [TTL 10min]
    → readActorSeoViewDAL(actorId) → DB (on miss only)

VportLeadsChip
  useIdentity()                              [VIOLATION: identityContext direct]
  useVportLeadsCount(actorId)
    useIdentity()                            [VIOLATION: identityContext direct]
    countNewVportLeadsController(actorId, callerActorId)
      assertActorOwnsVportActorController()  [correct ownership gate]
      readNewLeadsCountByProfileDAL()        → DB
    setInterval(pollRefresh, 60_000)
    fastCountNewVportLeadsController(actorId, callerActorId, profileId)
      → readNewLeadsCountByProfileDAL()      → DB
```

---

## Provenance

| Artifact | Source |
|---|---|
| Module structure | Direct filesystem scan |
| Consumers | `rg` grep across `apps/VCSM/src` |
| Open findings | Sourced from `docs/SECURITY.md`, `docs/ARCHITECTURE.md`, prior `2026-06-06_task-bottombar-relocate_report.md` |
| Dependency violations | Source file inspection (BottomNavBar.jsx, VportLeadsChip.jsx, useVportLeadsCount.js) |
| DB read paths | Controller source inspection + prior governance history |

---

## Verdict

**BUILD_WITH_CAUTION**

Module is structurally sound post-relocation. Three boundary violations remain open. No THOR gate assessment performed — TONYSTARK does not emit THOR_RELEASE_ELIGIBLE.
