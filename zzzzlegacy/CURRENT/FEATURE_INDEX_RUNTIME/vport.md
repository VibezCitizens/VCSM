# Runtime Feature Index: vport

## Metadata

| Field | Value |
|---|---|
| Feature | vport |
| CURRENT Folder | CURRENT/features/vport |
| Source Folder | apps/VCSM/src/features/vport (+ cross-feature vport surfaces in profiles/kinds/vport, dashboard/vport, public/vportMenu, settings/vports) |
| Generated | 2026-06-02 |
| Scope | VCSM |
| Evidence Mode | Source scan + CURRENT governance evidence |
| ARCHITECT Ticket | ARCHITECT-VPORT-0001 |

## Source Inventory

| Layer | Count | Key Files |
|---|---:|---|
| Controllers | 3 | `submitCreateVport.controller.js`, `getVportServiceCatalog.controller.js`, `vportCoreOps.controller.js` |
| DALs | 4 | `vport.core.dal.js`, `vport.read.vportRecords.dal.js`, `vport.write.profileMedia.dal.js`, `readVportServiceCatalogByType.dal.js` |
| Hooks | 4 | `useCreateVport.js`, `useVportServiceCatalog.js`, `useRestoreVport.js`, `useVportCoreOps.js` |
| Models | 3 | `createVportForm.model.js` (root), `model/vportServiceCatalog.model.js`, `public/vportPreviewModel.js` |
| Screens | 1 | `screens/RestoreVportScreen.jsx` |
| Components | 4 | `CreateVportForm.jsx` (root, complex form), `CreateVportProfileTab.jsx`, `CreateVportServicesTab.jsx`, `CreateVportDebugPanel.jsx` |
| Adapters | 3 | `adapters/vport.adapter.js`, `adapters/vport.public.adapter.js`, `adapters/CreateVportForm.jsx.adapter.js` |
| Public / Preview | 4 | `public/VportPreviewShowcase.jsx`, `public/VportPreviewCard.jsx`, `public/VportPhonePreview.jsx`, `public/vportPreviewData.js` |
| Utils | 1 | `utils/openDirections.js` |
| Migration barrel | 1 | `vport.public.js` (TEMPORARY — pending Phase 2 removal) |
| Routes | 2 | `/vport/create`, `/vport/restore/:actorId` |
| Tests | 0 | NONE FOUND |

Extended vport governance spans:
- `profiles/kinds/vport/` — 130+ screens, 40+ controllers, 60+ DALs (VPORT type profiles)
- `dashboard/vport/` — 239 files (owner dashboard hub)
- `features/public/vportMenu/` + `vportBusinessCard/` (public-facing zero-auth surfaces)
- `features/settings/vports/` (owner settings DAL + controllers)
- `engines/booking/` (workspace creation), `engines/hydration/` (actor directory refresh)

## Route / Screen Map

| Route / Screen | Source Path | Public/Auth/Owner | Notes |
|---|---|---|---|
| `/vport/create` | `CreateVportForm.jsx` (via `adapters/CreateVportForm.jsx.adapter.js`) | OWNER | Multi-tab VPORT creation wizard; profile tab + services tab |
| `/vport/restore/:actorId` | `screens/RestoreVportScreen.jsx` | OWNER | Soft-deleted VPORT restoration; redirects to `/feed` on success |
| `/actor/:actorId/dashboard/*` | `features/dashboard/vport/` | OWNER | Full owner management hub (bookings, schedule, settings, team, etc.) |
| `/profile/:actorId` (vport kinds) | `features/profiles/kinds/vport/` | AUTH (viewer) / OWNER (write tabs) | Barbershop, locksmith, restaurant, gas station, exchange type screens |
| `/menu/*` | `features/public/vportMenu/` | PUBLIC_ZERO_AUTH | Public menu QR/slug surface |

## Mutation Surface Map

| Surface | Source Path | Write Type | Ownership Gate Known | Risk |
|---|---|---|---|---|
| `submitCreateVport.controller.js` | `controller/` | INSERT — `create_vport` RPC + `profiles` UPDATE (avatar write-back) | PARTIAL — `requireUser()` in DAL; RPC enforces AUTH server-side | MEDIUM |
| `vport.core.dal.js` — `updateVport` | `dal/` | UPDATE — `vport.profiles` | `requireUser()` present; no ownership assertion before UPDATE | MEDIUM |
| `vport.core.dal.js` — `softDeleteVport` | `dal/` | RPC `soft_delete_vport` | Server-side RPC ownership check (`VPORT_NOT_FOUND_OR_UNAUTHORIZED`) | LOW |
| `vport.core.dal.js` — `hardDeleteVport` | `dal/` | RPC `hard_delete_vport` | Server-side RPC ownership check | LOW — incomplete cascade (VENOM-DELETE-003) |
| `vport.core.dal.js` — `restoreVport` | `dal/` | RPC `restore_vport` | Server-side RPC ownership check | LOW — RPC untracked in migrations (VENOM-DELETE-002) |
| `vport.write.profileMedia.dal.js` | `dal/` | UPDATE — `profiles.avatar_media_asset_id`, `banner_media_asset_id` | NO explicit `requireUser()`; `eq('actor_id', actorId)` filter only | MEDIUM |
| `ctrlUpdateServiceArea` / `ctrlDeleteServiceArea` / `ctrlDeleteServiceDetail` | `profiles/kinds/vport/controller/locksmith/locksmithOwner.controller.js` | UPDATE/DELETE | NO — missing `assertActorOwnsVportActorController` (S-BLK-001 — BEFORE RELEASE BLOCKER) | CRITICAL |
| `deleteVportActorMenuCategoryController` | `profiles/kinds/vport/controller/menu/` | DELETE | NO — ELEK-007 | CRITICAL |
| `deleteVportActorMenuItemController` | `profiles/kinds/vport/controller/menu/` | DELETE | NO — ELEK-008 | CRITICAL |
| `deleteVportServiceAddonController` | `profiles/kinds/vport/controller/` | DELETE | NO — ELEK-009 (missing gate AND missing DAL — runtime broken) | CRITICAL |
| Content pages controllers | `profiles/kinds/vport/controller/content/` | INSERT/UPDATE/DELETE | PARTIAL — legacy RLS OR-merge (VENOM-CONTENT-004) | HIGH |
| VPORT booking update/reschedule | `dashboard/vport/controller/` | STATUS UPDATE | WEAK — TICKET-BOOKING-RPC-001 (DB-BLOCKED) | HIGH |

## Security-Sensitive Surface Map

| Surface | Source Path | Sensitivity | Evidence |
|---|---|---|---|
| `ctrlUpdateServiceArea` / `ctrlDeleteServiceArea` / `ctrlDeleteServiceDetail` | `profiles/kinds/vport/controller/locksmith/` | OWNERSHIP — write paths missing gate | S-BLK-001 — BEFORE RELEASE BLOCKER (HIGH) |
| `deleteVportServiceAddonController` | `profiles/kinds/vport/controller/` | OWNERSHIP + RUNTIME — dual failure | ELEK-009 — missing ownership gate AND referenced DAL does not exist |
| `deleteVportActorMenuCategoryController` | `profiles/kinds/vport/controller/menu/` | OWNERSHIP | ELEK-007 — missing gate |
| `deleteVportActorMenuItemController` | `profiles/kinds/vport/controller/menu/` | OWNERSHIP | ELEK-008 — missing gate |
| `vport.write.profileMedia.dal.js` | `dal/` | AUTH — no session guard | No `requireUser()` at DAL boundary; MEDIUM risk |
| Content pages RLS OR-merge | DB | DB_RLS | VENOM-CONTENT-004/BW-CONTENT-004 — former VPORT owners retain access (DB-BLOCKED) |
| Hardcoded `PUBLIC_REALM_ID` | `profiles/kinds/vport/controller/gas/` + `controller/menu/` | REALM_LEAK | UUID hardcoded — HIGH risk when Void Realm launches; requires `resolvePublicRealmIdDAL()` |
| VPORT delete RPCs | DB | RPC_UNTRACKED | VENOM-DELETE-002 — `soft_delete_vport`, `hard_delete_vport`, `restore_vport` not in tracked migrations |
| `hard_delete_vport` cascade | DB | ORPHAN_DATA | VENOM-DELETE-003 — 5 tables orphaned: `vport.resources`, `portfolio_items`, `availability_exceptions`, `availability_rules`, `push_subscriptions` |
| Subscriber ownership gate tests | `features/social/friend/subscribe/` | OWNERSHIP — 17 CI tests failing | V-SUB-001/002/003 — intentionally failing, pending controller fixes |
| `vport.public.js` migration barrel | `features/vport/` | BOUNDARY_LEAK | Exports DAL functions directly; pending Phase 2 removal |
| `removeTeamMemberController` | `dashboard/vport/controller/` | OWNERSHIP | VD-01 — CRITICAL: no ownership check |
| `acceptTeamRequestController` / `declineTeamRequestController` | `dashboard/vport/controller/` | OWNERSHIP | VD-02 — CRITICAL: no caller identity verification |

## Upload / Media Surface Map

| Surface | Source Path | Upload Type | Gate | Risk |
|---|---|---|---|---|
| Avatar upload (creation) | `controller/submitCreateVport.controller.js` | `uploadMediaController` → `@media` engine | Session inherited from parent; non-fatal async | MEDIUM |
| Avatar media write-back | `dal/vport.write.profileMedia.dal.js` | UPDATE `avatar_media_asset_id` | No explicit `requireUser()` | MEDIUM |
| Banner media write-back | `dal/vport.write.profileMedia.dal.js` | UPDATE `banner_media_asset_id` | No explicit `requireUser()` | MEDIUM |
| Portfolio media | `dashboard/vport/dashboard/cards/portfolio/dal/portfolioMediaRecord.write.dal.js` | MEDIA_WRITE | ELEK-040: adjacent path lacks ownership gate | HIGH |

## Open Findings (from SECURITY.md / DR_STRANGE.md)

| Finding ID | Severity | Status | Summary |
|---|---|---|---|
| S-BLK-001 | HIGH — BEFORE RELEASE BLOCKER | OPEN | Locksmith 3 write paths missing `assertActorOwnsVportActorController` |
| ELEK-007 | HIGH | OPEN | `deleteVportActorMenuCategoryController` missing ownership gate |
| ELEK-008 | HIGH | OPEN | `deleteVportActorMenuItemController` missing ownership gate |
| ELEK-009 | HIGH | OPEN — DUAL FAILURE | `deleteVportServiceAddonController` missing gate AND referenced DAL does not exist |
| VD-01 | CRITICAL | OPEN | `removeTeamMemberController` — no ownership check |
| VD-02 | CRITICAL | OPEN | `acceptTeamRequestController` / `declineTeamRequestController` — no caller identity |
| VENOM-CONTENT-004 | HIGH | OPEN — DB-BLOCKED | Legacy RLS OR-merge — former owners retain content_pages access |
| VENOM-DELETE-002 | HIGH | DEFERRED | Delete RPCs not in tracked migrations |
| VENOM-DELETE-003 | HIGH | DEFERRED | `hard_delete_vport` incomplete cascade (5 tables) |
| TICKET-BOOKING-RPC-001 | HIGH | OPEN — DB-BLOCKED | Booking status overpermission + customer_actor_id injection |
| V-SUB-001/002/003 | HIGH | CI BLOCKED | 17 intentionally failing tests for subscriber ownership gates |
| PUBLIC_REALM_ID hardcoded | HIGH (pre-Void launch) | DEFERRED | 2 controllers hardcode realm UUID |
| TICKET-PLATFORM-RLS-001 | P1 | OPEN | `platform.media_assets` {public} policy cleanup |
| TICKET-FEED-CARDS-002 | LOW | OPEN | Add `payload.vportKind` discriminator for `barbershop_portfolio_update` |

**Total open findings: 27**

## Recommended Next Command

VENOM — Resolve S-BLK-001 (add `assertActorOwnsVportActorController` to 3 locksmith write paths in `locksmithOwner.controller.js`) — smallest, highest-impact action before release. Then ELEK-009 (create missing DAL + ownership gate for `deleteVportServiceAddonController`). Then CARNAGE (VENOM-DELETE-002/003).

## Recommended Next Ticket

S-BLK-001 — add `assertActorOwnsVportActorController` to `ctrlUpdateServiceArea`, `ctrlDeleteServiceArea`, `ctrlDeleteServiceDetail` in `apps/VCSM/src/features/profiles/kinds/vport/controller/locksmith/locksmithOwner.controller.js`. This is the only BEFORE RELEASE BLOCKER that requires no DB migration.
