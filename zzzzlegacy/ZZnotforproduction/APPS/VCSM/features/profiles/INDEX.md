---
name: vcsm.profiles.index
description: VCSM profiles feature source inventory — rebuilt by ARCHITECT V2 2026-06-04
metadata:
  type: index
  owner: ARCHITECT
  last-rebuilt: 2026-06-04
---

# INDEX — VCSM / features / profiles

**Status:** ACTIVE
**Last rebuilt by ARCHITECT:** 2026-06-04
**Scanner version:** 1.1.0

## Source Inventory

| Layer | Count | Notes |
|---|---|---|
| Controllers | 103 | Includes vport kind sub-controllers: barbershop, exchange, locksmith, menu, content, rates, services, review, subscribers, portfolio |
| DAL files | 107 | Base profile DALs + vport kind DALs: barbershop, exchange, locksmith, content, menu, rates, services, subscribers |
| Hooks | 81 | useProfileView, useProfileGate, useActorCanonicalSlug, useVportType, useResolveActorBySlug, and vport kind hooks |
| Models | 100 | profile.model.js, getVportTabsByType.model.js, vportOwnership.model.js, mapVportPublicDetails.model.js, and others |
| Screens | 221 | ActorProfileScreen, VportProfileKindScreen, VportProfileViewScreen, and all tab/view screens for user and vport kinds |
| Components | 6 | ActorProfileDevProbe, ActorProfileProdDebugPanel, and minimal inline components (most UI lives in screens) |
| Adapters | 23 | profiles.adapter.js, vportProfiles.adapter.js, ownership.adapter.js, exchange.adapter.js, vport sub-adapters for gas/rates/services/reviews |
| Barrels | 30 | Barrel/index files throughout kinds/vport sub-directories |
| Tests | 12 | vportPublicDetails.read.dal.test.js, publishBarbershopHoursUpdateAsPost.controller.test.js, publishBarbershopPortfolioUpdateAsPost.controller.test.js, publishExchangeRateUpdateAsPost.controller.test.js, publishLocksmithUpdatesAsPost.controller.test.js, publishMenuUpdateAsPost.controller.test.js, upsertVportRate.controller.test.js, getSubscribers.controller.test.js, vportBarbershopPost.read.dal.test.js, useLocksmithProfile.cache.test.js, mapVportPublicDetails.model.test.js, vportOwnership.model.test.js |
| Routes | 0 | No routes registered in route-map scanner (route is registered in app/router, not inside this feature) |
| Total source files | 374 | All .js and .jsx under apps/VCSM/src/features/profiles |

## Write Surface Map

| Operation | Schema | Table | Function |
|---|---|---|---|
| rpc | vc | — | reconcileFriendRanks → get_friend_ranks |
| rpc | vc | — | reconcileFriendRanks → save_friend_ranks |
| rpc | vc | — | saveFriendRanks → save_friend_ranks |
| rpc | vc | — | readFriendRankRows → get_friend_ranks |
| insert | (default) | content_pages | createVportContentPageDAL |
| delete | (default) | content_pages | deleteVportContentPageDAL |
| update | (default) | content_pages | toggleVportContentPagePublishDAL |
| update | (default) | content_pages | updateVportContentPageDAL |
| upsert | (default) | locksmith_portfolio_details | dalUpsertLocksmithPortfolioDetail |
| delete | (default) | locksmith_service_areas | dalDeleteLocksmithServiceArea |
| insert | (default) | locksmith_service_areas | dalInsertLocksmithServiceArea |
| update | (default) | locksmith_service_areas | dalUpdateLocksmithServiceArea |
| upsert | (default) | locksmith_service_areas | dalUpsertLocksmithServiceArea |
| delete | (default) | locksmith_service_details | dalDeleteLocksmithServiceDetail |
| upsert | (default) | locksmith_service_details | dalUpsertLocksmithServiceDetail |
| upsert | (default) | locksmith_service_details | dalInsertLocksmithServiceDetailDefaults |
| insert | (default) | menu_categories | createVportActorMenuCategoryDAL |
| insert | (default) | menu_items | createVportActorMenuItemDAL |
| insert | (default) | menu_item_media | createVportMenuItemMediaDAL |
| delete | (default) | menu_categories | deleteVportActorMenuCategoryDAL |
| delete | (default) | menu_items | deleteVportActorMenuItemDAL |
| update | (default) | menu_categories | updateVportActorMenuCategoryDAL |
| update | (default) | menu_items | updateVportActorMenuItemDAL |
| upsert | (default) | rates | upsertVportRateDal |
| delete | (default) | service_addons | deleteVportServiceAddonDal |
| upsert | (default) | services | upsertVportServicesByActorDal |
| rpc | vc | — | dalCountVportSubscribers → count_vport_subscribers |
| rpc | vc | — | dalListVportSubscribers → list_vport_subscribers |

## Security-Sensitive Surfaces

- **Friend rank RPCs (vc.get_friend_ranks / vc.save_friend_ranks):** RPC surfaces that read and write actor social graph data. Ownership of the calling actor must be confirmed before save. Confirm RLS on these RPCs.
- **content_pages mutations:** Owner gate must be enforced before insert/update/delete. No content-injection risk surface has been audited.
- **locksmith_service_areas / locksmith_service_details:** Mutation surfaces for a professional service profile — unauthorized writes would corrupt vport public listing data.
- **menu_* mutations:** Public-facing data (menus render on public VPORT page via QR) — unauthorized mutation is a content-integrity risk.
- **rates / services / service_addons:** Directly affect customer-facing booking/service data. Unauthorized upsert/delete is a business-data integrity risk.

All above surfaces require VENOM + ELEKTRA audit for RLS and ownership gate verification.

## Engine Dependencies

- booking
- chat
- content
- hydration
- identity
- media
- menu
- notification
- portfolio
- profile
- qr
- review

## Routes

No routes registered in route-map scanner for this feature. The `/profile/:actorId` route is registered in the app-level router and resolves to `ActorProfileScreen.jsx` as the universal entry point. All internal navigation is managed inside this feature.

## Documentation Links

| Doc | Status |
|---|---|
| BEHAVIOR.md | PRESENT (PLACEHOLDER — no actual contract content) |
| ARCHITECTURE.md | PRESENT (this run — 2026-06-04) |
| CURRENT_STATUS.md | PRESENT (this run — 2026-06-04) |
| SCREENS.md | PRESENT (pre-existing) |
