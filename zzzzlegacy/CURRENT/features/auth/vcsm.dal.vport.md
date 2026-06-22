# VCSM DAL — `vport`

_Generated:_ 2026-05-11  
_Updated:_ 2026-05-11 (ARCHITECT live audit — doc scope gap, dead write DAL, auth-in-DAL violation, component-to-DAL violation, migration barrel, duplicate listMyVports; pipeline trace — model/controller/hook/screen per domain)  
_Source:_ ARCHITECT static scan + manual verification · `apps/VCSM/src/features/vport/` + `apps/VCSM/src/features/dashboard/vport/`  
_Confidence:_ STATICALLY\_TRACED + MANUALLY\_VERIFIED

---

## Summary

| Item | Detail |
|---|---|
| DAL files | 4 (static scan scope — `features/vport/dal/` only) |
| **Actual DAL files** | **29 total** — 4 in `features/vport/dal/` + 25 in `features/dashboard/vport/dal/` |
| Exported functions | 13 (scan scope) — full count higher |
| Tables accessed | 2 (scan scope) — full count higher |
| RPCs called | 5 (scan scope, all attributed to all functions — scan artifact) |
| Risk findings | 0 (original) → **5 new from live audit** |
| Release flag | None — always active |
| Feature status | LIVE — vport creation, dashboard, booking, team, calendar, leads, settings |
| Dead code | 1 confirmed dead DAL file (`vportProfileActorAccess.write.dal.js`) |
| Layer violations | 3 confirmed: auth logic in DAL, component importing DAL, migration barrel exposing DAL directly |

## DAL Files

### `readVportServiceCatalogByType.dal.js`

**Path:** `features/vport/dal/readVportServiceCatalogByType.dal.js`  
**Operations:** `read`  

**Exported functions:**

| `readVportServiceCatalogByTypeDAL` | `read` | `service_catalog` |

### `vport.core.dal.js`

**Path:** `features/vport/dal/vport.core.dal.js`  
**Operations:** `read` · `update` · `rpc`  

**Exported functions:**

| `createVport` | `read` · `update` · `rpc` | `profiles`, `hard_delete_vport`, `refresh_actor_directory_row`, `soft_delete_vport`, `restore_vport`, `create_vport` |
| `getVportById` | `read` · `update` · `rpc` | `profiles`, `hard_delete_vport`, `refresh_actor_directory_row`, `soft_delete_vport`, `restore_vport`, `create_vport` |
| `getVportBySlug` | `read` · `update` · `rpc` | `profiles`, `hard_delete_vport`, `refresh_actor_directory_row`, `soft_delete_vport`, `restore_vport`, `create_vport` |
| `getVportsByIds` | `read` · `update` · `rpc` | `profiles`, `hard_delete_vport`, `refresh_actor_directory_row`, `soft_delete_vport`, `restore_vport`, `create_vport` |
| `hardDeleteVport` | `read` · `update` · `rpc` | `profiles`, `hard_delete_vport`, `refresh_actor_directory_row`, `soft_delete_vport`, `restore_vport`, `create_vport` |
| `listMyVports` | `read` · `update` · `rpc` | `profiles`, `hard_delete_vport`, `refresh_actor_directory_row`, `soft_delete_vport`, `restore_vport`, `create_vport` |
| `restoreVport` | `read` · `update` · `rpc` | `profiles`, `hard_delete_vport`, `refresh_actor_directory_row`, `soft_delete_vport`, `restore_vport`, `create_vport` |
| `softDeleteVport` | `read` · `update` · `rpc` | `profiles`, `hard_delete_vport`, `refresh_actor_directory_row`, `soft_delete_vport`, `restore_vport`, `create_vport` |
| `updateVport` | `read` · `update` · `rpc` | `profiles`, `hard_delete_vport`, `refresh_actor_directory_row`, `soft_delete_vport`, `restore_vport`, `create_vport` |

### `vport.read.vportRecords.dal.js`

**Path:** `features/vport/dal/vport.read.vportRecords.dal.js`  
**Operations:** `read`  

**Exported functions:**

| `listMyVports` | `read` | `profiles` |

### `vport.write.profileMedia.dal.js`

**Path:** `features/vport/dal/vport.write.profileMedia.dal.js`  
**Operations:** `update`  

**Exported functions:**

| `updateVportAvatarMediaAssetIdDAL` | `update` | `profiles` |
| `updateVportBannerMediaAssetIdDAL` | `update` | `profiles` |

---

## Tables Accessed

| Table | Operations | Via Functions |
|---|---|---|
| `profiles` | READ, UPDATE | `createVport`, `getVportById`, `getVportBySlug`, `getVportsByIds`, `hardDeleteVport`, `listMyVports`, `restoreVport`, `softDeleteVport`, `updateVportAvatarMediaAssetIdDAL`, `updateVportBannerMediaAssetIdDAL`, `updateVport` |
| `service_catalog` | READ | `readVportServiceCatalogByTypeDAL` |

## RPCs Called

| RPC | Via Functions |
|---|---|
| `create_vport` | `createVport`, `getVportById`, `getVportBySlug`, `getVportsByIds`, `hardDeleteVport`, `listMyVports`, `restoreVport`, `softDeleteVport`, `updateVport` |
| `hard_delete_vport` | `createVport`, `getVportById`, `getVportBySlug`, `getVportsByIds`, `hardDeleteVport`, `listMyVports`, `restoreVport`, `softDeleteVport`, `updateVport` |
| `refresh_actor_directory_row` | `createVport`, `getVportById`, `getVportBySlug`, `getVportsByIds`, `hardDeleteVport`, `listMyVports`, `restoreVport`, `softDeleteVport`, `updateVport` |
| `restore_vport` | `createVport`, `getVportById`, `getVportBySlug`, `getVportsByIds`, `hardDeleteVport`, `listMyVports`, `restoreVport`, `softDeleteVport`, `updateVport` |
| `soft_delete_vport` | `createVport`, `getVportById`, `getVportBySlug`, `getVportsByIds`, `hardDeleteVport`, `listMyVports`, `restoreVport`, `softDeleteVport`, `updateVport` |

---

## Risk Findings

No risk findings for this feature.

---

## Pending Reviews

No pending reviews — feature DAL is clean.

---

## Call Chains

Who calls each DAL file — traced from DAL up to Screen.

### `actorOwners.read.dal.js`

**Direct callers:**

- `probeVportPortfolio.controller.js` _Controller_

**Full call chain to screen:**

```
`actorOwners.read.dal.js` → `probeVportPortfolio.controller.js` → `PortfolioBugsBunnyPanel.jsx`
```
```
`actorOwners.read.dal.js` → `probeVportPortfolio.controller.js` → `PortfolioBugsBunnyPanel.jsx` → `VportDashboardPortfolioScreen.jsx`
```

### `actorVport.read.dal.js`

**Direct callers:**

- `vportPublicBooking.controller.js` _Controller_

**Full call chain to screen:**

```
`actorVport.read.dal.js` → `vportPublicBooking.controller.js` → `useVportOwnerResources.js` → `VportDashboardBookingHistoryScreen.jsx`
```
```
`actorVport.read.dal.js` → `vportPublicBooking.controller.js` → `useVportOwnerResources.js` → `VportDashboardCalendarScreen.jsx`
```
```
`actorVport.read.dal.js` → `vportPublicBooking.controller.js` → `useVportBookingOps.js` → `vport.adapter.js` → `VportActorMenuFlyerView.jsx`
```
```
`actorVport.read.dal.js` → `vportPublicBooking.controller.js` → `useVportBookingOps.js` → `vport.adapter.js` → `VportBarberShopBookingView.jsx`
```

### `listVportBookingsForProfileDay.read.dal.js`

**Direct callers:**

- `loadDaySchedule.controller.js` _Controller_
- `vportOwnerStats.controller.js` _Controller_

**Full call chain to screen:**

```
`listVportBookingsForProfileDay.read.dal.js` → `loadDaySchedule.controller.js` → `useVportOwnerSchedule.js` → `VportDashboardScheduleScreen.jsx`
```
```
`listVportBookingsForProfileDay.read.dal.js` → `vportOwnerStats.controller.js` → `useOwnerQuickStats.js` → `vport.adapter.js` → `VportActorMenuFlyerView.jsx`
```
```
`listVportBookingsForProfileDay.read.dal.js` → `vportOwnerStats.controller.js` → `useOwnerQuickStats.js` → `vport.adapter.js` → `VportBarberShopBookingView.jsx`
```
```
`listVportBookingsForProfileDay.read.dal.js` → `vportOwnerStats.controller.js` → `useOwnerQuickStats.js` → `vport.adapter.js` → `VportBarberShopTeamView.jsx`
```

### `vportAvailabilityRules.read.dal.js`

**Direct callers:**

- `loadDaySchedule.controller.js` _Controller_
- `vportPublicBooking.controller.js` _Controller_

**Full call chain to screen:**

```
`vportAvailabilityRules.read.dal.js` → `loadDaySchedule.controller.js` → `useVportOwnerSchedule.js` → `VportDashboardScheduleScreen.jsx`
```
```
`vportAvailabilityRules.read.dal.js` → `vportPublicBooking.controller.js` → `useVportOwnerResources.js` → `VportDashboardBookingHistoryScreen.jsx`
```
```
`vportAvailabilityRules.read.dal.js` → `vportPublicBooking.controller.js` → `useVportOwnerResources.js` → `VportDashboardCalendarScreen.jsx`
```
```
`vportAvailabilityRules.read.dal.js` → `vportPublicBooking.controller.js` → `useVportBookingOps.js` → `vport.adapter.js` → `VportActorMenuFlyerView.jsx`
```

### `vportBookingById.read.dal.js`

**Direct callers:**

- `updateVportBooking.controller.js` _Controller_

**Full call chain to screen:**

```
`vportBookingById.read.dal.js` → `updateVportBooking.controller.js` → `useVportBookingActions.js` → `VportDashboardBookingHistoryScreen.jsx`
```
```
`vportBookingById.read.dal.js` → `updateVportBooking.controller.js` → `useVportOwnerSchedule.js` → `VportDashboardScheduleScreen.jsx`
```

### `vportBookingHistory.read.dal.js`

**Direct callers:**

- `listVportBookingHistory.controller.js` _Controller_

**Full call chain to screen:**

```
`vportBookingHistory.read.dal.js` → `listVportBookingHistory.controller.js` → `useVportBookingHistory.js` → `VportDashboardBookingHistoryScreen.jsx`
```

### `vportBookingsInRange.read.dal.js`

**Direct callers:**

- `updateVportBooking.controller.js` _Controller_
- `vportPublicBooking.controller.js` _Controller_

**Full call chain to screen:**

```
`vportBookingsInRange.read.dal.js` → `updateVportBooking.controller.js` → `useVportBookingActions.js` → `VportDashboardBookingHistoryScreen.jsx`
```
```
`vportBookingsInRange.read.dal.js` → `updateVportBooking.controller.js` → `useVportOwnerSchedule.js` → `VportDashboardScheduleScreen.jsx`
```
```
`vportBookingsInRange.read.dal.js` → `vportPublicBooking.controller.js` → `useVportOwnerResources.js` → `VportDashboardCalendarScreen.jsx`
```
```
`vportBookingsInRange.read.dal.js` → `vportPublicBooking.controller.js` → `useVportBookingOps.js` → `vport.adapter.js` → `VportActorMenuFlyerView.jsx`
```

### `vportCities.read.dal.js`

**Direct callers:**

- `saveVportPublicDetailsByActorId.controller.js` _Controller_

**Full call chain to screen:**

```
`vportCities.read.dal.js` → `saveVportPublicDetailsByActorId.controller.js` → `useSaveVportPublicDetailsByActorId.js` → `VportSettingsScreen.jsx`
```

### `vportLeads.read.dal.js`

**Direct callers:**

- `vportLeads.controller.js` _Controller_

**Full call chain to screen:**

```
`vportLeads.read.dal.js` → `vportLeads.controller.js` → `useVportLeads.js` → `VportDashboardLeadsScreen.jsx`
```

### `vportProfile.read.dal.js`

**Direct callers:**

- `createOwnerBooking.controller.js` _Controller_
- `ensureVportOwnerResource.controller.js` _Controller_
- `loadDaySchedule.controller.js` _Controller_
- `probeVportPortfolio.controller.js` _Controller_
- `saveVportPublicDetailsByActorId.controller.js` _Controller_
- `updateVportBooking.controller.js` _Controller_
- `vportLeads.controller.js` _Controller_
- `vportOwnerStats.controller.js` _Controller_
- _+4 more_

**Full call chain to screen:**

```
`vportProfile.read.dal.js` → `probeVportPortfolio.controller.js` → `PortfolioBugsBunnyPanel.jsx`
```
```
`vportProfile.read.dal.js` → `createOwnerBooking.controller.js` → `QuickBookingModal.jsx` → `VportDashboardBookingHistoryScreen.jsx`
```
```
`vportProfile.read.dal.js` → `createOwnerBooking.controller.js` → `useVportOwnerSchedule.js` → `VportDashboardScheduleScreen.jsx`
```
```
`vportProfile.read.dal.js` → `ensureVportOwnerResource.controller.js` → `useVportEnsureResource.js` → `VportDashboardCalendarScreen.jsx`
```

### `vportProfileActorAccess.read.dal.js`

**Direct callers:**

- `probeVportPortfolio.controller.js` _Controller_

**Full call chain to screen:**

```
`vportProfileActorAccess.read.dal.js` → `probeVportPortfolio.controller.js` → `PortfolioBugsBunnyPanel.jsx`
```
```
`vportProfileActorAccess.read.dal.js` → `probeVportPortfolio.controller.js` → `PortfolioBugsBunnyPanel.jsx` → `VportDashboardPortfolioScreen.jsx`
```

### `vportResource.read.dal.js`

**Direct callers:**

- `createOwnerBooking.controller.js` _Controller_
- `ensureVportOwnerResource.controller.js` _Controller_
- `loadDaySchedule.controller.js` _Controller_
- `vportPublicBooking.controller.js` _Controller_

**Full call chain to screen:**

```
`vportResource.read.dal.js` → `createOwnerBooking.controller.js` → `QuickBookingModal.jsx` → `VportDashboardBookingHistoryScreen.jsx`
```
```
`vportResource.read.dal.js` → `createOwnerBooking.controller.js` → `useVportOwnerSchedule.js` → `VportDashboardScheduleScreen.jsx`
```
```
`vportResource.read.dal.js` → `ensureVportOwnerResource.controller.js` → `useVportEnsureResource.js` → `VportDashboardCalendarScreen.jsx`
```
```
`vportResource.read.dal.js` → `vportPublicBooking.controller.js` → `useVportBookingOps.js` → `vport.adapter.js` → `VportActorMenuFlyerView.jsx`
```

### `vportServices.read.dal.js`

**Direct callers:**

- `QuickBookingModal.jsx` _Component_
- `loadDaySchedule.controller.js` _Controller_
- `vportPublicBooking.controller.js` _Controller_

**Full call chain to screen:**

```
`vportServices.read.dal.js` → `QuickBookingModal.jsx` → `VportDashboardBookingHistoryScreen.jsx`
```
```
`vportServices.read.dal.js` → `loadDaySchedule.controller.js` → `useVportOwnerSchedule.js` → `VportDashboardScheduleScreen.jsx`
```
```
`vportServices.read.dal.js` → `vportPublicBooking.controller.js` → `useVportOwnerResources.js` → `VportDashboardCalendarScreen.jsx`
```
```
`vportServices.read.dal.js` → `vportPublicBooking.controller.js` → `useVportBookingOps.js` → `vport.adapter.js` → `VportActorMenuFlyerView.jsx`
```

### `vportTeam.read.dal.js`

**Direct callers:**

- `vportOwnerStats.controller.js` _Controller_
- `vportTeam.controller.js` _Controller_
- `vportTeamAccess.controller.js` _Controller_

**Full call chain to screen:**

```
`vportTeam.read.dal.js` → `vportTeamAccess.controller.js` → `useVportTeamAccess.js` → `VportDashboardTeamScreen.jsx`
```
```
`vportTeam.read.dal.js` → `vportOwnerStats.controller.js` → `useOwnerQuickStats.js` → `vport.adapter.js` → `VportActorMenuFlyerView.jsx`
```
```
`vportTeam.read.dal.js` → `vportOwnerStats.controller.js` → `useOwnerQuickStats.js` → `vport.adapter.js` → `VportBarberShopBookingView.jsx`
```
```
`vportTeam.read.dal.js` → `vportOwnerStats.controller.js` → `useOwnerQuickStats.js` → `vport.adapter.js` → `VportBarberShopTeamView.jsx`
```

### `vportTeamInvite.read.dal.js`

**Direct callers:**

- `vportTeam.controller.js` _Controller_
- `vportTeamInvite.controller.js` _Controller_

**Full call chain to screen:**

```
`vportTeamInvite.read.dal.js` → `vportTeamInvite.controller.js` → `useBarberTeamRequests.js` → `BarberTeamRequestsScreen.jsx`
```
```
`vportTeamInvite.read.dal.js` → `vportTeam.controller.js` → `useVportTeam.js` → `vport.adapter.js` → `VportActorMenuFlyerView.jsx`
```
```
`vportTeamInvite.read.dal.js` → `vportTeam.controller.js` → `useVportTeam.js` → `vport.adapter.js` → `VportBarberShopBookingView.jsx`
```
```
`vportTeamInvite.read.dal.js` → `vportTeam.controller.js` → `useVportTeam.js` → `vport.adapter.js` → `VportBarberShopTeamView.jsx`
```

### `insertVportBooking.write.dal.js`

**Direct callers:**

- `createOwnerBooking.controller.js` _Controller_
- `vportPublicBooking.controller.js` _Controller_

**Full call chain to screen:**

```
`insertVportBooking.write.dal.js` → `createOwnerBooking.controller.js` → `QuickBookingModal.jsx` → `VportDashboardBookingHistoryScreen.jsx`
```
```
`insertVportBooking.write.dal.js` → `createOwnerBooking.controller.js` → `useVportOwnerSchedule.js` → `VportDashboardScheduleScreen.jsx`
```
```
`insertVportBooking.write.dal.js` → `vportPublicBooking.controller.js` → `useVportOwnerResources.js` → `VportDashboardCalendarScreen.jsx`
```
```
`insertVportBooking.write.dal.js` → `vportPublicBooking.controller.js` → `useVportBookingOps.js` → `vport.adapter.js` → `VportActorMenuFlyerView.jsx`
```

### `portfolioMediaRecord.write.dal.js`

**Direct callers:**

- `addPortfolioMediaWithRecord.controller.js` _Controller_

**Full call chain to screen:**

```
`portfolioMediaRecord.write.dal.js` → `addPortfolioMediaWithRecord.controller.js` → `usePortfolioItemSubmit.js`
```
```
`portfolioMediaRecord.write.dal.js` → `addPortfolioMediaWithRecord.controller.js` → `usePortfolioItemSubmit.js` → `PortfolioItemForm.jsx`
```
```
`portfolioMediaRecord.write.dal.js` → `addPortfolioMediaWithRecord.controller.js` → `usePortfolioItemSubmit.js` → `PortfolioItemForm.jsx` → `VportDashboardPortfolioScreen.jsx`
```

### `updateVportBooking.write.dal.js`

**Direct callers:**

- `updateVportBooking.controller.js` _Controller_

**Full call chain to screen:**

```
`updateVportBooking.write.dal.js` → `updateVportBooking.controller.js` → `useVportBookingActions.js` → `VportDashboardBookingHistoryScreen.jsx`
```
```
`updateVportBooking.write.dal.js` → `updateVportBooking.controller.js` → `useVportOwnerSchedule.js` → `VportDashboardScheduleScreen.jsx`
```

### `vportAvailabilityRules.write.dal.js`

**Direct callers:**

- `manageVportAvailabilityRule.controller.js` _Controller_

**Full call chain to screen:**

```
`vportAvailabilityRules.write.dal.js` → `manageVportAvailabilityRule.controller.js` → `useVportManageAvailability.js` → `VportDashboardCalendarScreen.jsx`
```

### `vportLeads.write.dal.js`

**Direct callers:**

- `vportLeads.controller.js` _Controller_

**Full call chain to screen:**

```
`vportLeads.write.dal.js` → `vportLeads.controller.js` → `useVportLeads.js` → `VportDashboardLeadsScreen.jsx`
```

### `vportProfileActorAccess.write.dal.js`

> No callers detected — possibly dead code or dynamically invoked.

### `vportPublicDetails.write.dal.js`

**Direct callers:**

- `saveVportPublicDetailsByActorId.controller.js` _Controller_

**Full call chain to screen:**

```
`vportPublicDetails.write.dal.js` → `saveVportPublicDetailsByActorId.controller.js` → `useSaveVportPublicDetailsByActorId.js` → `VportSettingsScreen.jsx`
```

### `vportResource.write.dal.js`

**Direct callers:**

- `ensureVportOwnerResource.controller.js` _Controller_

**Full call chain to screen:**

```
`vportResource.write.dal.js` → `ensureVportOwnerResource.controller.js` → `useVportEnsureResource.js` → `VportDashboardCalendarScreen.jsx`
```

### `vportTeam.write.dal.js`

**Direct callers:**

- `vportTeam.controller.js` _Controller_
- `vportTeamAccess.controller.js` _Controller_

**Full call chain to screen:**

```
`vportTeam.write.dal.js` → `vportTeamAccess.controller.js` → `useVportTeamAccess.js` → `VportDashboardTeamScreen.jsx`
```
```
`vportTeam.write.dal.js` → `vportTeam.controller.js` → `useVportTeam.js` → `vport.adapter.js` → `VportActorMenuFlyerView.jsx`
```
```
`vportTeam.write.dal.js` → `vportTeam.controller.js` → `useVportTeam.js` → `vport.adapter.js` → `VportBarberShopBookingView.jsx`
```
```
`vportTeam.write.dal.js` → `vportTeam.controller.js` → `useVportTeam.js` → `vport.adapter.js` → `VportBarberShopTeamView.jsx`
```

### `vportTeamInvite.write.dal.js`

**Direct callers:**

- `vportTeam.controller.js` _Controller_
- `vportTeamInvite.controller.js` _Controller_

**Full call chain to screen:**

```
`vportTeamInvite.write.dal.js` → `vportTeamInvite.controller.js` → `useBarberTeamRequests.js` → `BarberTeamRequestsScreen.jsx`
```
```
`vportTeamInvite.write.dal.js` → `vportTeam.controller.js` → `useVportTeam.js` → `vport.adapter.js` → `VportActorMenuFlyerView.jsx`
```
```
`vportTeamInvite.write.dal.js` → `vportTeam.controller.js` → `useVportTeam.js` → `vport.adapter.js` → `VportBarberShopBookingView.jsx`
```
```
`vportTeamInvite.write.dal.js` → `vportTeam.controller.js` → `useVportTeam.js` → `vport.adapter.js` → `VportBarberShopTeamView.jsx`
```

### `vportBarbershopPost.read.dal.js`

**Direct callers:**

- `publishBarbershopHoursUpdateAsPost.controller.js` _Controller_
- `publishBarbershopPortfolioUpdateAsPost.controller.js` _Controller_

**Full call chain to screen:**

```
`vportBarbershopPost.read.dal.js` → `publishBarbershopHoursUpdateAsPost.controller.js` → `usePublishBarbershopHoursPost.js` → `VportDashboardCalendarScreen.jsx`
```
```
`vportBarbershopPost.read.dal.js` → `publishBarbershopPortfolioUpdateAsPost.controller.js` → `usePublishBarbershopPortfolioPost.js` → `VportDashboardPortfolioScreen.jsx`
```

### `createVportContentPage.dal.js`

**Direct callers:**

- `createVportContentPage.controller.js` _Controller_

**Full call chain to screen:**

```
`createVportContentPage.dal.js` → `createVportContentPage.controller.js` → `useVportContentPages.js`
```
```
`createVportContentPage.dal.js` → `createVportContentPage.controller.js` → `useVportContentPages.js` → `VportContentManageView.jsx`
```
```
`createVportContentPage.dal.js` → `createVportContentPage.controller.js` → `useVportContentPages.js` → `VportContentManageView.jsx` → `VportContentView.jsx`
```

### `deleteVportContentPage.dal.js`

**Direct callers:**

- `deleteVportContentPage.controller.js` _Controller_

**Full call chain to screen:**

```
`deleteVportContentPage.dal.js` → `deleteVportContentPage.controller.js` → `useVportContentPages.js`
```
```
`deleteVportContentPage.dal.js` → `deleteVportContentPage.controller.js` → `useVportContentPages.js` → `VportContentManageView.jsx`
```
```
`deleteVportContentPage.dal.js` → `deleteVportContentPage.controller.js` → `useVportContentPages.js` → `VportContentManageView.jsx` → `VportContentView.jsx`
```

### `listVportContentPages.dal.js`

**Direct callers:**

- `listVportContentPages.controller.js` _Controller_

**Full call chain to screen:**

```
`listVportContentPages.dal.js` → `listVportContentPages.controller.js` → `useVportContentPages.js`
```
```
`listVportContentPages.dal.js` → `listVportContentPages.controller.js` → `useVportContentPages.js` → `VportContentManageView.jsx`
```
```
`listVportContentPages.dal.js` → `listVportContentPages.controller.js` → `useVportContentPages.js` → `VportContentManageView.jsx` → `VportContentView.jsx`
```

### `listVportPublicContentPages.dal.js`

**Direct callers:**

- `listVportPublicContentPages.controller.js` _Controller_
- `toggleVportContentPagePublish.controller.js` _Controller_

**Full call chain to screen:**

```
`listVportPublicContentPages.dal.js` → `listVportPublicContentPages.controller.js` → `useVportPublicContent.js`
```
```
`listVportPublicContentPages.dal.js` → `toggleVportContentPagePublish.controller.js` → `useVportContentPages.js`
```
```
`listVportPublicContentPages.dal.js` → `listVportPublicContentPages.controller.js` → `useVportPublicContent.js` → `VportContentPublicView.jsx`
```
```
`listVportPublicContentPages.dal.js` → `toggleVportContentPagePublish.controller.js` → `useVportContentPages.js` → `VportContentManageView.jsx`
```

### `readVportContentPage.dal.js`

**Direct callers:**

- `deleteVportContentPage.controller.js` _Controller_
- `toggleVportContentPagePublish.controller.js` _Controller_
- `updateVportContentPage.controller.js` _Controller_

**Full call chain to screen:**

```
`readVportContentPage.dal.js` → `deleteVportContentPage.controller.js` → `useVportContentPages.js`
```
```
`readVportContentPage.dal.js` → `deleteVportContentPage.controller.js` → `useVportContentPages.js` → `VportContentManageView.jsx`
```
```
`readVportContentPage.dal.js` → `deleteVportContentPage.controller.js` → `useVportContentPages.js` → `VportContentManageView.jsx` → `VportContentView.jsx`
```

### `readVportPublicContentPage.dal.js`

**Direct callers:**

- `readVportPublicContentPage.controller.js` _Controller_

**Full call chain to screen:**

```
`readVportPublicContentPage.dal.js` → `readVportPublicContentPage.controller.js` → `useVportPublicContentPage.js` → `VportContentPageViewer.jsx`
```
```
`readVportPublicContentPage.dal.js` → `readVportPublicContentPage.controller.js` → `useVportPublicContentPage.js` → `VportContentPageViewer.jsx` → `VportContentPublicView.jsx`
```

### `toggleVportContentPagePublish.dal.js`

**Direct callers:**

- `toggleVportContentPagePublish.controller.js` _Controller_

**Full call chain to screen:**

```
`toggleVportContentPagePublish.dal.js` → `toggleVportContentPagePublish.controller.js` → `useVportContentPages.js`
```
```
`toggleVportContentPagePublish.dal.js` → `toggleVportContentPagePublish.controller.js` → `useVportContentPages.js` → `VportContentManageView.jsx`
```
```
`toggleVportContentPagePublish.dal.js` → `toggleVportContentPagePublish.controller.js` → `useVportContentPages.js` → `VportContentManageView.jsx` → `VportContentView.jsx`
```

### `updateVportContentPage.dal.js`

**Direct callers:**

- `updateVportContentPage.controller.js` _Controller_

**Full call chain to screen:**

```
`updateVportContentPage.dal.js` → `updateVportContentPage.controller.js` → `useVportContentPages.js`
```
```
`updateVportContentPage.dal.js` → `updateVportContentPage.controller.js` → `useVportContentPages.js` → `VportContentManageView.jsx`
```
```
`updateVportContentPage.dal.js` → `updateVportContentPage.controller.js` → `useVportContentPages.js` → `VportContentManageView.jsx` → `VportContentView.jsx`
```

### `vportExchangeRatePost.read.dal.js`

**Direct callers:**

- `publishExchangeRateUpdateAsPost.controller.js` _Controller_

**Full call chain to screen:**

```
`vportExchangeRatePost.read.dal.js` → `publishExchangeRateUpdateAsPost.controller.js` → `usePublishExchangeRatePost.js` → `VportDashboardExchangeScreen.jsx`
```

### `vportFuelPriceHistory.write.dal.js`

**Direct callers:**

- `reviewFuelPriceSuggestion.controller.js` _Controller_
- `submitFuelPriceSuggestion.controller.js` _Controller_

**Full call chain to screen:**

```
`vportFuelPriceHistory.write.dal.js` → `submitFuelPriceSuggestion.controller.js` → `useSubmitFuelPriceSuggestion.js` → `VportGasPricesView.jsx`
```
```
`vportFuelPriceHistory.write.dal.js` → `reviewFuelPriceSuggestion.controller.js` → `useOwnerPendingSuggestions.js` → `useOwnerPendingSuggestions.adapter.js` → `VportDashboardGasScreen.jsx`
```
```
`vportFuelPriceHistory.write.dal.js` → `submitFuelPriceSuggestion.controller.js` → `useSubmitFuelPriceSuggestion.js` → `VportGasPricesView.jsx` → `VportProfileTabContent.jsx`
```
```
`vportFuelPriceHistory.write.dal.js` → `submitFuelPriceSuggestion.controller.js` → `useSubmitFuelPriceSuggestion.js` → `VportGasPricesView.jsx` → `VportGasPricesScreen.jsx`
```

### `vportFuelPricePost.read.dal.js`

**Direct callers:**

- `publishFuelPriceUpdateAsPost.controller.js` _Controller_

**Full call chain to screen:**

```
`vportFuelPricePost.read.dal.js` → `publishFuelPriceUpdateAsPost.controller.js` → `useSubmitFuelPriceSuggestion.js` → `VportGasPricesView.jsx`
```
```
`vportFuelPricePost.read.dal.js` → `publishFuelPriceUpdateAsPost.controller.js` → `useSubmitFuelPriceSuggestion.js` → `useSubmitFuelPriceSuggestion.adapter.js` → `VportDashboardGasScreen.jsx`
```
```
`vportFuelPricePost.read.dal.js` → `publishFuelPriceUpdateAsPost.controller.js` → `useSubmitFuelPriceSuggestion.js` → `VportGasPricesView.jsx` → `VportProfileTabContent.jsx`
```
```
`vportFuelPricePost.read.dal.js` → `publishFuelPriceUpdateAsPost.controller.js` → `useSubmitFuelPriceSuggestion.js` → `VportGasPricesView.jsx` → `VportGasPricesScreen.jsx`
```

### `vportFuelPriceReviews.write.dal.js`

**Direct callers:**

- `reviewFuelPriceSuggestion.controller.js` _Controller_

**Full call chain to screen:**

```
`vportFuelPriceReviews.write.dal.js` → `reviewFuelPriceSuggestion.controller.js` → `useOwnerPendingSuggestions.js` → `useOwnerPendingSuggestions.adapter.js` → `VportDashboardGasScreen.jsx`
```

### `vportFuelPriceSubmissions.read.dal.js`

**Direct callers:**

- `getVportGasPrices.controller.js` _Controller_
- `reviewFuelPriceSuggestion.controller.js` _Controller_

**Full call chain to screen:**

```
`vportFuelPriceSubmissions.read.dal.js` → `getVportGasPrices.controller.js` → `useVportGasPrices.js` → `VportGasPricesView.jsx`
```
```
`vportFuelPriceSubmissions.read.dal.js` → `getVportGasPrices.controller.js` → `useOwnerPendingSuggestions.js` → `useOwnerPendingSuggestions.adapter.js` → `VportDashboardGasScreen.jsx`
```
```
`vportFuelPriceSubmissions.read.dal.js` → `getVportGasPrices.controller.js` → `useVportGasPrices.js` → `VportGasPricesView.jsx` → `VportProfileTabContent.jsx`
```
```
`vportFuelPriceSubmissions.read.dal.js` → `getVportGasPrices.controller.js` → `useVportGasPrices.js` → `VportGasPricesView.jsx` → `VportGasPricesScreen.jsx`
```

### `vportFuelPriceSubmissions.write.dal.js`

**Direct callers:**

- `submitFuelPriceSuggestion.controller.js` _Controller_

**Full call chain to screen:**

```
`vportFuelPriceSubmissions.write.dal.js` → `submitFuelPriceSuggestion.controller.js` → `useSubmitFuelPriceSuggestion.js` → `VportGasPricesView.jsx`
```
```
`vportFuelPriceSubmissions.write.dal.js` → `submitFuelPriceSuggestion.controller.js` → `useSubmitFuelPriceSuggestion.js` → `useSubmitFuelPriceSuggestion.adapter.js` → `VportDashboardGasScreen.jsx`
```
```
`vportFuelPriceSubmissions.write.dal.js` → `submitFuelPriceSuggestion.controller.js` → `useSubmitFuelPriceSuggestion.js` → `VportGasPricesView.jsx` → `VportProfileTabContent.jsx`
```
```
`vportFuelPriceSubmissions.write.dal.js` → `submitFuelPriceSuggestion.controller.js` → `useSubmitFuelPriceSuggestion.js` → `VportGasPricesView.jsx` → `VportGasPricesScreen.jsx`
```

### `vportFuelPrices.read.dal.js`

**Direct callers:**

- `getVportGasPrices.controller.js` _Controller_
- `submitFuelPriceSuggestion.controller.js` _Controller_
- `updateStationFuelUnit.controller.js` _Controller_

**Full call chain to screen:**

```
`vportFuelPrices.read.dal.js` → `getVportGasPrices.controller.js` → `useVportGasPrices.js` → `VportGasPricesView.jsx`
```
```
`vportFuelPrices.read.dal.js` → `updateStationFuelUnit.controller.js` → `useUpdateStationFuelUnit.js` → `VportDashboardGasScreen.jsx`
```
```
`vportFuelPrices.read.dal.js` → `getVportGasPrices.controller.js` → `useVportGasPrices.js` → `VportGasPricesView.jsx` → `VportProfileTabContent.jsx`
```
```
`vportFuelPrices.read.dal.js` → `getVportGasPrices.controller.js` → `useVportGasPrices.js` → `VportGasPricesView.jsx` → `VportGasPricesScreen.jsx`
```

### `vportFuelPrices.write.dal.js`

**Direct callers:**

- `reviewFuelPriceSuggestion.controller.js` _Controller_
- `submitFuelPriceSuggestion.controller.js` _Controller_
- `updateStationFuelUnit.controller.js` _Controller_

**Full call chain to screen:**

```
`vportFuelPrices.write.dal.js` → `submitFuelPriceSuggestion.controller.js` → `useSubmitFuelPriceSuggestion.js` → `VportGasPricesView.jsx`
```
```
`vportFuelPrices.write.dal.js` → `updateStationFuelUnit.controller.js` → `useUpdateStationFuelUnit.js` → `VportDashboardGasScreen.jsx`
```
```
`vportFuelPrices.write.dal.js` → `submitFuelPriceSuggestion.controller.js` → `useSubmitFuelPriceSuggestion.js` → `VportGasPricesView.jsx` → `VportProfileTabContent.jsx`
```
```
`vportFuelPrices.write.dal.js` → `submitFuelPriceSuggestion.controller.js` → `useSubmitFuelPriceSuggestion.js` → `VportGasPricesView.jsx` → `VportGasPricesScreen.jsx`
```

### `vportStationPriceSettings.read.dal.js`

**Direct callers:**

- `getVportGasPrices.controller.js` _Controller_
- `submitFuelPriceSuggestion.controller.js` _Controller_

**Full call chain to screen:**

```
`vportStationPriceSettings.read.dal.js` → `getVportGasPrices.controller.js` → `useVportGasPrices.js` → `VportGasPricesView.jsx`
```
```
`vportStationPriceSettings.read.dal.js` → `getVportGasPrices.controller.js` → `useOwnerPendingSuggestions.js` → `useOwnerPendingSuggestions.adapter.js` → `VportDashboardGasScreen.jsx`
```
```
`vportStationPriceSettings.read.dal.js` → `getVportGasPrices.controller.js` → `useVportGasPrices.js` → `VportGasPricesView.jsx` → `VportProfileTabContent.jsx`
```
```
`vportStationPriceSettings.read.dal.js` → `getVportGasPrices.controller.js` → `useVportGasPrices.js` → `VportGasPricesView.jsx` → `VportGasPricesScreen.jsx`
```

### `locksmithPortfolioDetails.write.dal.js`

**Direct callers:**

- `locksmithOwner.controller.js` _Controller_

**Full call chain to screen:**

```
`locksmithPortfolioDetails.write.dal.js` → `locksmithOwner.controller.js` → `usePortfolioItemSubmit.js`
```
```
`locksmithPortfolioDetails.write.dal.js` → `locksmithOwner.controller.js` → `usePortfolioItemSubmit.js` → `PortfolioItemForm.jsx`
```
```
`locksmithPortfolioDetails.write.dal.js` → `locksmithOwner.controller.js` → `usePortfolioItemSubmit.js` → `PortfolioItemForm.jsx` → `VportDashboardPortfolioScreen.jsx`
```
```
`locksmithPortfolioDetails.write.dal.js` → `locksmithOwner.controller.js` → `useLocksmithOwner.js` → `profiles.adapter.js` → `VportActorMenuFlyerView.jsx`
```

### `locksmithServiceAreas.read.dal.js`

**Direct callers:**

- `getLocksmithProfile.controller.js` _Controller_

**Full call chain to screen:**

```
`locksmithServiceAreas.read.dal.js` → `getLocksmithProfile.controller.js` → `useLocksmithProfile.js` → `VportServicesView.jsx`
```
```
`locksmithServiceAreas.read.dal.js` → `getLocksmithProfile.controller.js` → `useLocksmithProfile.js` → `VportAboutView.jsx`
```
```
`locksmithServiceAreas.read.dal.js` → `getLocksmithProfile.controller.js` → `useLocksmithProfile.js` → `profiles.adapter.js` → `VportActorMenuFlyerView.jsx`
```
```
`locksmithServiceAreas.read.dal.js` → `getLocksmithProfile.controller.js` → `useLocksmithProfile.js` → `profiles.adapter.js` → `VportDashboardLocksmithScreen.jsx`
```

### `locksmithServiceAreas.write.dal.js`

**Direct callers:**

- `locksmithOwner.controller.js` _Controller_

**Full call chain to screen:**

```
`locksmithServiceAreas.write.dal.js` → `locksmithOwner.controller.js` → `usePortfolioItemSubmit.js`
```
```
`locksmithServiceAreas.write.dal.js` → `locksmithOwner.controller.js` → `usePortfolioItemSubmit.js` → `PortfolioItemForm.jsx`
```
```
`locksmithServiceAreas.write.dal.js` → `locksmithOwner.controller.js` → `usePortfolioItemSubmit.js` → `PortfolioItemForm.jsx` → `VportDashboardPortfolioScreen.jsx`
```
```
`locksmithServiceAreas.write.dal.js` → `locksmithOwner.controller.js` → `useLocksmithOwner.js` → `profiles.adapter.js` → `VportActorMenuFlyerView.jsx`
```

### `locksmithServiceDetails.read.dal.js`

**Direct callers:**

- `getLocksmithProfile.controller.js` _Controller_

**Full call chain to screen:**

```
`locksmithServiceDetails.read.dal.js` → `getLocksmithProfile.controller.js` → `useLocksmithProfile.js` → `VportServicesView.jsx`
```
```
`locksmithServiceDetails.read.dal.js` → `getLocksmithProfile.controller.js` → `useLocksmithProfile.js` → `VportAboutView.jsx`
```
```
`locksmithServiceDetails.read.dal.js` → `getLocksmithProfile.controller.js` → `useLocksmithProfile.js` → `profiles.adapter.js` → `VportActorMenuFlyerView.jsx`
```
```
`locksmithServiceDetails.read.dal.js` → `getLocksmithProfile.controller.js` → `useLocksmithProfile.js` → `profiles.adapter.js` → `VportDashboardLocksmithScreen.jsx`
```

### `locksmithServiceDetails.write.dal.js`

**Direct callers:**

- `locksmithOwner.controller.js` _Controller_
- `upsertVportServices.controller.js` _Controller_

**Full call chain to screen:**

```
`locksmithServiceDetails.write.dal.js` → `locksmithOwner.controller.js` → `usePortfolioItemSubmit.js`
```
```
`locksmithServiceDetails.write.dal.js` → `locksmithOwner.controller.js` → `usePortfolioItemSubmit.js` → `PortfolioItemForm.jsx`
```
```
`locksmithServiceDetails.write.dal.js` → `upsertVportServices.controller.js` → `useUpsertVportServices.js` → `VportServicesView.jsx`
```
```
`locksmithServiceDetails.write.dal.js` → `locksmithOwner.controller.js` → `usePortfolioItemSubmit.js` → `PortfolioItemForm.jsx` → `VportDashboardPortfolioScreen.jsx`
```

### `vportLocksmithPost.read.dal.js`

**Direct callers:**

- `publishLocksmithHoursUpdateAsPost.controller.js` _Controller_
- `publishLocksmithPortfolioUpdateAsPost.controller.js` _Controller_
- `publishLocksmithServiceAreaUpdateAsPost.controller.js` _Controller_

**Full call chain to screen:**

```
`vportLocksmithPost.read.dal.js` → `publishLocksmithPortfolioUpdateAsPost.controller.js` → `usePortfolioItemSubmit.js`
```
```
`vportLocksmithPost.read.dal.js` → `publishLocksmithHoursUpdateAsPost.controller.js` → `usePublishLocksmithPost.js` → `VportDashboardCalendarScreen.jsx`
```
```
`vportLocksmithPost.read.dal.js` → `publishLocksmithHoursUpdateAsPost.controller.js` → `usePublishLocksmithPost.js` → `VportDashboardLocksmithScreen.jsx`
```
```
`vportLocksmithPost.read.dal.js` → `publishLocksmithPortfolioUpdateAsPost.controller.js` → `usePortfolioItemSubmit.js` → `PortfolioItemForm.jsx`
```

### `createVportActorMenuCategory.dal.js`

**Direct callers:**

- `saveVportActorMenuCategory.controller.js` _Controller_

**Full call chain to screen:**

```
`createVportActorMenuCategory.dal.js` → `saveVportActorMenuCategory.controller.js` → `useVportActorMenuCategoriesMutations.js` → `VportActorMenuManagePanel.jsx`
```
```
`createVportActorMenuCategory.dal.js` → `saveVportActorMenuCategory.controller.js` → `useVportActorMenuCategoriesMutations.js` → `VportActorMenuManagePanel.jsx` → `VportMenuManageView.jsx`
```
```
`createVportActorMenuCategory.dal.js` → `saveVportActorMenuCategory.controller.js` → `useVportActorMenuCategoriesMutations.js` → `VportActorMenuManagePanel.jsx` → `VportActorMenuSection.jsx`
```

### `createVportActorMenuItem.dal.js`

**Direct callers:**

- `saveVportActorMenuItem.controller.js` _Controller_

**Full call chain to screen:**

```
`createVportActorMenuItem.dal.js` → `saveVportActorMenuItem.controller.js` → `useVportActorMenuItemsMutations.js` → `VportActorMenuManagePanel.jsx`
```
```
`createVportActorMenuItem.dal.js` → `saveVportActorMenuItem.controller.js` → `useVportActorMenuItemsMutations.js` → `VportActorMenuManagePanel.jsx` → `VportMenuManageView.jsx`
```
```
`createVportActorMenuItem.dal.js` → `saveVportActorMenuItem.controller.js` → `useVportActorMenuItemsMutations.js` → `VportActorMenuManagePanel.jsx` → `VportActorMenuSection.jsx`
```

### `createVportMenuItemMedia.dal.js`

**Direct callers:**

- `saveVportActorMenuItem.controller.js` _Controller_

**Full call chain to screen:**

```
`createVportMenuItemMedia.dal.js` → `saveVportActorMenuItem.controller.js` → `useVportActorMenuItemsMutations.js` → `VportActorMenuManagePanel.jsx`
```
```
`createVportMenuItemMedia.dal.js` → `saveVportActorMenuItem.controller.js` → `useVportActorMenuItemsMutations.js` → `VportActorMenuManagePanel.jsx` → `VportMenuManageView.jsx`
```
```
`createVportMenuItemMedia.dal.js` → `saveVportActorMenuItem.controller.js` → `useVportActorMenuItemsMutations.js` → `VportActorMenuManagePanel.jsx` → `VportActorMenuSection.jsx`
```

### `deleteVportActorMenuCategory.dal.js`

**Direct callers:**

- `deleteVportActorMenuCategory.controller.js` _Controller_

**Full call chain to screen:**

```
`deleteVportActorMenuCategory.dal.js` → `deleteVportActorMenuCategory.controller.js` → `useVportActorMenuCategoriesMutations.js` → `VportActorMenuManagePanel.jsx`
```
```
`deleteVportActorMenuCategory.dal.js` → `deleteVportActorMenuCategory.controller.js` → `useVportActorMenuCategoriesMutations.js` → `VportActorMenuManagePanel.jsx` → `VportMenuManageView.jsx`
```
```
`deleteVportActorMenuCategory.dal.js` → `deleteVportActorMenuCategory.controller.js` → `useVportActorMenuCategoriesMutations.js` → `VportActorMenuManagePanel.jsx` → `VportActorMenuSection.jsx`
```

### `deleteVportActorMenuItem.dal.js`

**Direct callers:**

- `deleteVportActorMenuItem.controller.js` _Controller_

**Full call chain to screen:**

```
`deleteVportActorMenuItem.dal.js` → `deleteVportActorMenuItem.controller.js` → `useVportActorMenuItemsMutations.js` → `VportActorMenuManagePanel.jsx`
```
```
`deleteVportActorMenuItem.dal.js` → `deleteVportActorMenuItem.controller.js` → `useVportActorMenuItemsMutations.js` → `VportActorMenuManagePanel.jsx` → `VportMenuManageView.jsx`
```
```
`deleteVportActorMenuItem.dal.js` → `deleteVportActorMenuItem.controller.js` → `useVportActorMenuItemsMutations.js` → `VportActorMenuManagePanel.jsx` → `VportActorMenuSection.jsx`
```

### `listVportActorMenuCategories.dal.js`

**Direct callers:**

- `getVportActorMenu.controller.js` _Controller_

**Full call chain to screen:**

```
`listVportActorMenuCategories.dal.js` → `getVportActorMenu.controller.js` → `useVportActorMenu.js` → `VportActorMenuManagePanel.jsx`
```
```
`listVportActorMenuCategories.dal.js` → `getVportActorMenu.controller.js` → `useVportActorMenu.js` → `VportActorMenuPublicPanel.jsx`
```
```
`listVportActorMenuCategories.dal.js` → `getVportActorMenu.controller.js` → `useVportActorMenu.js` → `VportActorMenuManagePanel.jsx` → `VportMenuManageView.jsx`
```
```
`listVportActorMenuCategories.dal.js` → `getVportActorMenu.controller.js` → `useVportActorMenu.js` → `VportActorMenuManagePanel.jsx` → `VportActorMenuSection.jsx`
```

### `listVportActorMenuItems.dal.js`

**Direct callers:**

- `getVportActorMenu.controller.js` _Controller_

**Full call chain to screen:**

```
`listVportActorMenuItems.dal.js` → `getVportActorMenu.controller.js` → `useVportActorMenu.js` → `VportActorMenuManagePanel.jsx`
```
```
`listVportActorMenuItems.dal.js` → `getVportActorMenu.controller.js` → `useVportActorMenu.js` → `VportActorMenuPublicPanel.jsx`
```
```
`listVportActorMenuItems.dal.js` → `getVportActorMenu.controller.js` → `useVportActorMenu.js` → `VportActorMenuManagePanel.jsx` → `VportMenuManageView.jsx`
```
```
`listVportActorMenuItems.dal.js` → `getVportActorMenu.controller.js` → `useVportActorMenu.js` → `VportActorMenuManagePanel.jsx` → `VportActorMenuSection.jsx`
```

### `readVportActorMenuCategories.dal.js`

**Direct callers:**

- `saveVportActorMenuCategory.controller.js` _Controller_
- `saveVportActorMenuItem.controller.js` _Controller_

**Full call chain to screen:**

```
`readVportActorMenuCategories.dal.js` → `saveVportActorMenuCategory.controller.js` → `useVportActorMenuCategoriesMutations.js` → `VportActorMenuManagePanel.jsx`
```
```
`readVportActorMenuCategories.dal.js` → `saveVportActorMenuCategory.controller.js` → `useVportActorMenuCategoriesMutations.js` → `VportActorMenuManagePanel.jsx` → `VportMenuManageView.jsx`
```
```
`readVportActorMenuCategories.dal.js` → `saveVportActorMenuCategory.controller.js` → `useVportActorMenuCategoriesMutations.js` → `VportActorMenuManagePanel.jsx` → `VportActorMenuSection.jsx`
```

### `readVportActorMenuItems.dal.js`

**Direct callers:**

- `saveVportActorMenuItem.controller.js` _Controller_

**Full call chain to screen:**

```
`readVportActorMenuItems.dal.js` → `saveVportActorMenuItem.controller.js` → `useVportActorMenuItemsMutations.js` → `VportActorMenuManagePanel.jsx`
```
```
`readVportActorMenuItems.dal.js` → `saveVportActorMenuItem.controller.js` → `useVportActorMenuItemsMutations.js` → `VportActorMenuManagePanel.jsx` → `VportMenuManageView.jsx`
```
```
`readVportActorMenuItems.dal.js` → `saveVportActorMenuItem.controller.js` → `useVportActorMenuItemsMutations.js` → `VportActorMenuManagePanel.jsx` → `VportActorMenuSection.jsx`
```

### `updateVportActorMenuCategory.dal.js`

**Direct callers:**

- `saveVportActorMenuCategory.controller.js` _Controller_

**Full call chain to screen:**

```
`updateVportActorMenuCategory.dal.js` → `saveVportActorMenuCategory.controller.js` → `useVportActorMenuCategoriesMutations.js` → `VportActorMenuManagePanel.jsx`
```
```
`updateVportActorMenuCategory.dal.js` → `saveVportActorMenuCategory.controller.js` → `useVportActorMenuCategoriesMutations.js` → `VportActorMenuManagePanel.jsx` → `VportMenuManageView.jsx`
```
```
`updateVportActorMenuCategory.dal.js` → `saveVportActorMenuCategory.controller.js` → `useVportActorMenuCategoriesMutations.js` → `VportActorMenuManagePanel.jsx` → `VportActorMenuSection.jsx`
```

### `updateVportActorMenuItem.dal.js`

**Direct callers:**

- `saveVportActorMenuItem.controller.js` _Controller_

**Full call chain to screen:**

```
`updateVportActorMenuItem.dal.js` → `saveVportActorMenuItem.controller.js` → `useVportActorMenuItemsMutations.js` → `VportActorMenuManagePanel.jsx`
```
```
`updateVportActorMenuItem.dal.js` → `saveVportActorMenuItem.controller.js` → `useVportActorMenuItemsMutations.js` → `VportActorMenuManagePanel.jsx` → `VportMenuManageView.jsx`
```
```
`updateVportActorMenuItem.dal.js` → `saveVportActorMenuItem.controller.js` → `useVportActorMenuItemsMutations.js` → `VportActorMenuManagePanel.jsx` → `VportActorMenuSection.jsx`
```

### `vportMenuPost.read.dal.js`

**Direct callers:**

- `publishMenuUpdateAsPost.controller.js` _Controller_

**Full call chain to screen:**

```
`vportMenuPost.read.dal.js` → `publishMenuUpdateAsPost.controller.js` → `usePublishMenuPost.js` → `VportActorMenuManagePanel.jsx`
```
```
`vportMenuPost.read.dal.js` → `publishMenuUpdateAsPost.controller.js` → `usePublishMenuPost.js` → `VportActorMenuManagePanel.jsx` → `VportMenuManageView.jsx`
```
```
`vportMenuPost.read.dal.js` → `publishMenuUpdateAsPost.controller.js` → `usePublishMenuPost.js` → `VportActorMenuManagePanel.jsx` → `VportActorMenuSection.jsx`
```

### `actorOwners.read.dal.js`

> No callers detected — possibly dead code or dynamically invoked.

### `readVportRatesByActor.dal.js`

**Direct callers:**

- `getVportRates.controller.js` _Controller_

**Full call chain to screen:**

```
`readVportRatesByActor.dal.js` → `getVportRates.controller.js` → `useVportRates.js` → `VportRatesView.jsx`
```
```
`readVportRatesByActor.dal.js` → `getVportRates.controller.js` → `useVportRates.js` → `VportRatesView.jsx` → `VportRatesView.jsx.adapter.js`
```
```
`readVportRatesByActor.dal.js` → `getVportRates.controller.js` → `useVportRates.js` → `VportRatesView.jsx` → `VportProfileTabContent.jsx`
```

### `upsertVportRate.dal.js`

**Direct callers:**

- `upsertVportRate.controller.js` _Controller_

**Full call chain to screen:**

```
`upsertVportRate.dal.js` → `upsertVportRate.controller.js` → `useUpsertVportRate.js` → `useUpsertVportRate.js.adapter.js` → `VportDashboardExchangeScreen.jsx`
```

### `readVportActorIdByVportId.dal.js`

**Direct callers:**

- `getVportActorIdByVportId.controller.js` _Controller_

**Partial chain (no screen reached):  **

```
`readVportActorIdByVportId.dal.js` → `getVportActorIdByVportId.controller.js`
```
```
`readVportActorIdByVportId.dal.js` → `getVportActorIdByVportId.controller.js` → `useVportActorIdByVportId.js`
```

### `reviewTarget.read.dal.js`

**Direct callers:**

- `VportReviews.controller.js` _Controller_

**Full call chain to screen:**

```
`reviewTarget.read.dal.js` → `VportReviews.controller.js` → `useVportReviews.js` → `VportReviewsView.jsx`
```
```
`reviewTarget.read.dal.js` → `VportReviews.controller.js` → `useVportReviews.js` → `VportReviewsView.jsx` → `VportReviewsView.adapter.js`
```
```
`reviewTarget.read.dal.js` → `VportReviews.controller.js` → `useVportReviews.js` → `VportReviewsView.jsx` → `VportReviewsView.jsx`
```

### `vportReviewAuthors.read.dal.js`

> No callers detected — possibly dead code or dynamically invoked.

### `vportReviews.write.dal.js`

> No callers detected — possibly dead code or dynamically invoked.

### `readVportServiceAddonsByActor.dal.js`

**Direct callers:**

- `getVportServices.controller.js` _Controller_

**Full call chain to screen:**

```
`readVportServiceAddonsByActor.dal.js` → `getVportServices.controller.js` → `useVportServices.js` → `PortfolioTab.jsx`
```
```
`readVportServiceAddonsByActor.dal.js` → `getVportServices.controller.js` → `useVportServices.js` → `VportServicesView.jsx`
```
```
`readVportServiceAddonsByActor.dal.js` → `getVportServices.controller.js` → `useVportServices.js` → `VportServicesView.jsx` → `VportServicesView.adapter.js`
```
```
`readVportServiceAddonsByActor.dal.js` → `getVportServices.controller.js` → `useVportServices.js` → `VportServicesView.jsx` → `VportProfileTabContent.jsx`
```

### `readVportServiceCatalogByType.dal.js`

**Direct callers:**

- `getVportServices.controller.js` _Controller_
- `upsertVportServices.controller.js` _Controller_

**Full call chain to screen:**

```
`readVportServiceCatalogByType.dal.js` → `getVportServices.controller.js` → `useVportServices.js` → `PortfolioTab.jsx`
```
```
`readVportServiceCatalogByType.dal.js` → `getVportServices.controller.js` → `useVportServices.js` → `VportServicesView.jsx`
```
```
`readVportServiceCatalogByType.dal.js` → `getVportServices.controller.js` → `useVportServices.js` → `VportServicesView.jsx` → `VportServicesView.adapter.js`
```
```
`readVportServiceCatalogByType.dal.js` → `getVportServices.controller.js` → `useVportServices.js` → `VportServicesView.jsx` → `VportProfileTabContent.jsx`
```

### `readVportServicesByActor.dal.js`

**Direct callers:**

- `getLocksmithProfile.controller.js` _Controller_
- `VportServiceReviews.controller.js` _Controller_
- `getVportServices.controller.js` _Controller_

**Full call chain to screen:**

```
`readVportServicesByActor.dal.js` → `getLocksmithProfile.controller.js` → `useLocksmithProfile.js` → `VportServicesView.jsx`
```
```
`readVportServicesByActor.dal.js` → `getLocksmithProfile.controller.js` → `useLocksmithProfile.js` → `VportAboutView.jsx`
```
```
`readVportServicesByActor.dal.js` → `VportServiceReviews.controller.js` → `useVportReviews.js` → `VportReviewsView.jsx`
```
```
`readVportServicesByActor.dal.js` → `getVportServices.controller.js` → `useVportServices.js` → `PortfolioTab.jsx`
```

### `readVportTypeByActorId.dal.js`

**Direct callers:**

- `getVportServices.controller.js` _Controller_

**Full call chain to screen:**

```
`readVportTypeByActorId.dal.js` → `getVportServices.controller.js` → `useVportServices.js` → `PortfolioTab.jsx`
```
```
`readVportTypeByActorId.dal.js` → `getVportServices.controller.js` → `useVportServices.js` → `VportServicesView.jsx`
```
```
`readVportTypeByActorId.dal.js` → `getVportServices.controller.js` → `useVportServices.js` → `VportServicesView.jsx` → `VportServicesView.adapter.js`
```
```
`readVportTypeByActorId.dal.js` → `getVportServices.controller.js` → `useVportServices.js` → `VportServicesView.jsx` → `VportProfileTabContent.jsx`
```

### `upsertVportServicesByActor.dal.js`

**Direct callers:**

- `upsertVportServices.controller.js` _Controller_

**Full call chain to screen:**

```
`upsertVportServicesByActor.dal.js` → `upsertVportServices.controller.js` → `useUpsertVportServices.js` → `VportServicesView.jsx`
```
```
`upsertVportServicesByActor.dal.js` → `upsertVportServices.controller.js` → `useUpsertVportServices.js` → `VportServicesView.jsx` → `VportServicesView.adapter.js`
```
```
`upsertVportServicesByActor.dal.js` → `upsertVportServices.controller.js` → `useUpsertVportServices.js` → `VportServicesView.jsx` → `VportProfileTabContent.jsx`
```

### `subscribersCount.dal.js`

**Direct callers:**

- `getSubscribers.controller.js` _Controller_

**Full call chain to screen:**

```
`subscribersCount.dal.js` → `getSubscribers.controller.js` → `useSubscribers.js` → `useVportBookingView.js`
```
```
`subscribersCount.dal.js` → `getSubscribers.controller.js` → `useSubscribers.js` → `VportSubscribersView.jsx`
```
```
`subscribersCount.dal.js` → `getSubscribers.controller.js` → `useSubscribers.js` → `useVportBookingView.js` → `VportBookingView.jsx`
```
```
`subscribersCount.dal.js` → `getSubscribers.controller.js` → `useSubscribers.js` → `VportSubscribersView.jsx` → `VportProfileTabContent.jsx`
```

### `subscribersList.dal.js`

**Direct callers:**

- `getSubscribers.controller.js` _Controller_

**Full call chain to screen:**

```
`subscribersList.dal.js` → `getSubscribers.controller.js` → `useSubscribers.js` → `useVportBookingView.js`
```
```
`subscribersList.dal.js` → `getSubscribers.controller.js` → `useSubscribers.js` → `VportSubscribersView.jsx`
```
```
`subscribersList.dal.js` → `getSubscribers.controller.js` → `useSubscribers.js` → `useVportBookingView.js` → `VportBookingView.jsx`
```
```
`subscribersList.dal.js` → `getSubscribers.controller.js` → `useSubscribers.js` → `VportSubscribersView.jsx` → `VportProfileTabContent.jsx`
```

### `readVportServiceCatalogByType.dal.js`

**Direct callers:**

- `getVportServiceCatalog.controller.js` _Controller_

**Partial chain (no screen reached):  **

```
`readVportServiceCatalogByType.dal.js` → `getVportServiceCatalog.controller.js`
```
```
`readVportServiceCatalogByType.dal.js` → `getVportServiceCatalog.controller.js` → `vportFeature.group.js`
```
```
`readVportServiceCatalogByType.dal.js` → `getVportServiceCatalog.controller.js` → `useVportServiceCatalog.js`
```

### `vport.core.dal.js`

**Direct callers:**

- `submitCreateVport.controller.js` _Controller_
- `vportCoreOps.controller.js` _Controller_
- `vport.public.js` _Other_

**Full call chain to screen:**

```
`vport.core.dal.js` → `vportCoreOps.controller.js` → `useVportCoreOps.js` → `vport.public.adapter.js` → `HowToCreateVportScreen.jsx`
```
```
`vport.core.dal.js` → `vportCoreOps.controller.js` → `useVportCoreOps.js` → `vport.public.adapter.js` → `VportCategoryLandingScreen.jsx`
```
```
`vport.core.dal.js` → `vportCoreOps.controller.js` → `useVportCoreOps.js` → `vport.public.adapter.js` → `VportActorMenuPublicView.jsx`
```

### `vport.read.vportRecords.dal.js`

**Direct callers:**

- `vportFeature.group.js` _Other_
- `submitCreateVport.controller.js` _Controller_

**Full call chain to screen:**

```
`vport.read.vportRecords.dal.js` → `vportFeature.group.js` → `diagnosticsGroups.part2.js` → `runAllDiagnostics.js` → `DevDiagnosticsScreen.jsx`
```

### `vport.write.profileMedia.dal.js`

**Direct callers:**

- `recordProfileMediaAsset.controller.js` _Controller_
- `submitCreateVport.controller.js` _Controller_

**Partial chain (no screen reached):  **

```
`vport.write.profileMedia.dal.js` → `recordProfileMediaAsset.controller.js`
```
```
`vport.write.profileMedia.dal.js` → `submitCreateVport.controller.js`
```
```
`vport.write.profileMedia.dal.js` → `recordProfileMediaAsset.controller.js` → `useProfileUploads.js`
```

---

## Architecture Pipeline

Full build order for this feature — `DAL → Model → Controller → Hook → Components → View Screen → Final Screen`

| Layer | Status | Files |
|---|---|---|
| **DAL** | ✓ PRESENT | _(documented above)_ |
| **Model** | ✓ PRESENT | `createVportForm.model.js`, `vportServiceCatalog.model.js` |
| **Controller** | ✓ PRESENT | `getVportServiceCatalog.controller.js`, `submitCreateVport.controller.js`, `vportCoreOps.controller.js` |
| **Adapter** | ✓ PRESENT | `CreateVportForm.jsx.adapter.js`, `vport.public.adapter.js` |
| **Service** | ✗ MISSING | — |
| **Hook** | ✓ PRESENT | `useCreateVport.js`, `useRestoreVport.js`, `useVportCoreOps.js`, `useVportServiceCatalog.js` |
| **Component** | ✓ PRESENT | `CreateVportDebugPanel.jsx`, `CreateVportProfileTab.jsx`, `CreateVportServicesTab.jsx` |
| **View Screen** | ✗ MISSING | — |
| **Final Screen** | ✓ PRESENT | `RestoreVportScreen.jsx` |

### Model

_Pure transforms — no side effects, no DB access_

- `features/vport/createVportForm.model.js`
- `features/vport/model/vportServiceCatalog.model.js`

### Controller

_Business rules, ownership, permissions — no React_

- `features/vport/controller/getVportServiceCatalog.controller.js`
- `features/vport/controller/submitCreateVport.controller.js`
- `features/vport/controller/vportCoreOps.controller.js`

### Adapter

_Cross-feature boundary — only approved cross-feature access point_

- `features/vport/adapters/CreateVportForm.jsx.adapter.js`
- `features/vport/adapters/vport.public.adapter.js`

### Hook

_Lifecycle / timing / state wiring — no business rules_

- `features/vport/hooks/useCreateVport.js`
- `features/vport/hooks/useRestoreVport.js`
- `features/vport/hooks/useVportCoreOps.js`
- `features/vport/hooks/useVportServiceCatalog.js`

### Component

_Presentational only — no hooks, no data fetching_

- `features/vport/components/CreateVportDebugPanel.jsx`
- `features/vport/components/CreateVportProfileTab.jsx`
- `features/vport/components/CreateVportServicesTab.jsx`

### Final Screen

_Route entry + identity gate only — no computation_

- `features/vport/screens/RestoreVportScreen.jsx`

### Missing Layers

- 🟡 **Service** — not detected in static scan; not a gap, feature is self-contained
- 🟡 **View Screen** — not detected in static scan for `features/vport/`; `features/dashboard/vport/` has full view layers

> Note: The Architecture Pipeline above covers only `features/vport/` (the vport creation feature). The `features/dashboard/vport/` feature has a complete architecture pipeline (controllers, hooks, views, screens) that the static scan grouped into the same doc but did not map separately.

---

## ARCHITECT Live Audit Findings

_Appended:_ 2026-05-11 · ARCHITECT manual verification  
_Scope:_ DAL count correction, dead write DAL, auth-in-DAL violation, component-to-DAL violation, migration barrel, duplicate listMyVports

---

## Doc Corrections from Original Static Scan

| Field | Original (Wrong) | Corrected |
|---|---|---|
| DAL files | 4 | **29 total** — 4 in `features/vport/dal/` + 25 in `features/dashboard/vport/dal/` |
| Risk findings | 0 | 5 new findings |
| RPC attribution | All 5 RPCs attributed to all 9 functions in `vport.core.dal.js` | Scan artifact — each function uses only the RPC relevant to its operation |
| `actorOwners.read.dal.js` "No callers detected" | Listed as dead | FALSE — located at `features/dashboard/vport/dal/read/actorOwners.read.dal.js`, called by `probeVportPortfolio.controller.js` |
| `vport.write.profileMedia.dal.js` "Partial chain (no screen reached)" | Chain incomplete | FALSE — `recordProfileMediaAsset.controller.js` → `useProfileUploads.js` continues to `VportSettingsScreen.jsx`; scan stopped at controller |
| `readVportServiceCatalogByType.dal.js` "Partial chain (no screen reached)" | Listed as incomplete | FALSE — `getVportServiceCatalog.controller.js` → `useVportServiceCatalog.js` is consumed by `CreateVportServicesTab.jsx` in create vport flow; only other consumer is dev diagnostics |

---

## DAL Scope Clarification

The static scan scanned only `features/vport/dal/` (4 files). The Call Chains section of this document also traces 25 DAL files from `features/dashboard/vport/dal/`, which were picked up by following import chains but not counted in the Summary.

**Two separate feature directories contribute to this doc:**

| Directory | DAL files | Purpose |
|---|---|---|
| `features/vport/dal/` | 4 | Vport creation, CRUD, profile media, service catalog |
| `features/dashboard/vport/dal/read/` | 15 | Booking reads, team reads, resource reads, leads, availability |
| `features/dashboard/vport/dal/write/` | 10 | Booking writes, team writes, availability writes, leads, public details |

**Total: 29 DAL files.**

---

## Dead Code Confirmed

### `vportProfileActorAccess.write.dal.js` — CONFIRMED DEAD
**Path:** `features/dashboard/vport/dal/write/vportProfileActorAccess.write.dal.js`  
**Status:** CONFIRMED DEAD — zero callers outside the file itself.

**Exports:**
- `upsertProfileActorAccessDAL`
- `updateProfileActorAccessRoleDAL`
- `updateProfileActorAccessStatusDAL`
- `deleteProfileActorAccessDAL`

None of these are imported anywhere outside the DAL file. The read counterpart (`vportProfileActorAccess.read.dal.js`) IS live — it is called by `probeVportPortfolio.controller.js`.

**Additional flag:** The write DAL uses `profileId` as an identity parameter — the old identity model. All active code has migrated to `actorId`. This DAL was likely written before the actor migration and never wired.

**Recommended action:** Delete `vportProfileActorAccess.write.dal.js`.

---

## Risk Findings (New)

### RISK-1 — `vport.core.dal.js` Contains Auth Logic (DAL Layer Violation)
**Severity:** HIGH  
**Classification:** LAYER VIOLATION  
**Detail:** `vport.core.dal.js` defines a `requireUser()` function that calls `supabase.auth.getUser()` and throws if no user is found. This auth/session check is called inside `createVport`, `listMyVports`, `updateVport`, `softDeleteVport`, `hardDeleteVport`, and `restoreVport`.

DALs must be pure Supabase data access. Auth checks belong in a controller or middleware. A DAL should receive a `userId`/`actorId` as a parameter — it must not interrogate the auth session itself.

**Recommended action:** Move `requireUser()` out of the DAL. Controllers that call these functions should resolve the user session and pass `userId` as a parameter. Refactor the DAL functions to accept identity from above.

---

### RISK-2 — `vport.public.js` Migration Barrel Exposes DAL Functions Directly
**Severity:** MEDIUM  
**Classification:** ACKNOWLEDGED TECH DEBT — UNREMEDIATED  
**Detail:** `features/vport/vport.public.js` is a barrel file that re-exports `createVport`, `getVportById`, `getVportBySlug`, `getVportsByIds`, `listMyVports`, and `updateVport` directly from `vport.core.dal.js`.

The file's own comment acknowledges this: _"MIGRATION BARREL — not a model. This file exists only so consumers can reach vport DAL functions while CreateVportForm is being refactored into a proper hook + controller. Do not add new exports here. Remove once CreateVportForm is split (Phase 2 remediation)."_

**Current consumers of this barrel (production paths):**
- `dev/diagnostics/groups/vportFeature.group.js` — dev only
- `vport.public.adapter.js` re-exports some of these into `useVportCoreOps`

Phase 2 remediation was documented but has not happened. The barrel remains active.

**Recommended action:** Complete Phase 2. Wire the remaining consumers to use the `vportCoreOps.controller.js` + `useVportCoreOps.js` path. Delete `vport.public.js` once no callers remain.

---

### RISK-3 — `QuickBookingModal.jsx` Directly Imports a DAL Function
**Severity:** HIGH  
**Classification:** COMPONENT-TO-DAL LAYER VIOLATION  
**Detail:** `features/dashboard/vport/components/bookingHistory/QuickBookingModal.jsx` imports `listVportServicesByProfileIdDAL` directly from `features/dashboard/vport/dal/read/vportServices.read.dal.js`. A component must never import from the DAL. The access path must go through a hook and controller.

The call chain shown in the doc (`vportServices.read.dal.js → QuickBookingModal.jsx`) is not a false positive — it is a real boundary violation.

**Recommended action:** Move the `listVportServicesByProfileIdDAL` call into the existing `vportPublicBooking.controller.js` or a new dedicated controller function. The component should receive data via a hook.

---

### RISK-4 — `listMyVports` Duplicated Across Two DAL Files
**Severity:** MEDIUM  
**Classification:** DUPLICATE IMPLEMENTATION  
**Detail:** Two DAL files export a function named `listMyVports`:
1. `vport.core.dal.js` — queries `profiles` with `eq("owner_user_id", user.id)` using a `requireUser()` call
2. `vport.read.vportRecords.dal.js` — queries `profiles` with a separate `requireUser()` and different select fields

Both return the user's vports list. The dev diagnostics group (`vportFeature.group.js`) imports both and runs a consistency test called `"vport listMyVports consistency between model files"` — confirming this was a known divergence requiring verification.

`vport.read.vportRecords.dal.js` is only consumed by `submitCreateVport.controller.js` (one production caller) and dev diagnostics. `vport.core.dal.js`'s version is consumed by `vport.public.js`.

**Recommended action:** Consolidate into one `listMyVports` function. Remove `vport.read.vportRecords.dal.js` and update `submitCreateVport.controller.js` to import from `vport.core.dal.js` (or better: from a controller layer).

---

### RISK-5 — `PortfolioBugsBunnyPanel.jsx` Uses Deprecated Command Name
**Severity:** LOW  
**Classification:** NAMING DEBT  
**Detail:** `features/dashboard/vport/screens/components/PortfolioBugsBunnyPanel.jsx` is a live component (called by `probeVportPortfolio.controller.js`, rendered in `VportDashboardPortfolioScreen.jsx`). The component is named after the "BugsBunny" command which was renamed to "Deadpool." The file and component name were not updated.

**Recommended action:** Rename `PortfolioBugsBunnyPanel.jsx` to `PortfolioDeadpoolPanel.jsx` and update `probeVportPortfolio.controller.js` and `VportDashboardPortfolioScreen.jsx` to reference the new name.

---

## Pending Reviews

| Review | Command | Priority |
|---|---|---|
| Delete `vportProfileActorAccess.write.dal.js` — confirmed dead, uses old `profileId` model | SENTRY | HIGH |
| Refactor `vport.core.dal.js` — remove `requireUser()` from DAL, move to controllers | SENTRY | HIGH |
| Fix `QuickBookingModal.jsx` — remove DAL import, route through controller/hook | SENTRY | HIGH |
| Complete Phase 2: wire consumers off `vport.public.js` barrel, then delete it | WOLVERINE | MEDIUM |
| Consolidate `listMyVports` — remove `vport.read.vportRecords.dal.js`, use `vport.core.dal.js` | SENTRY | MEDIUM |
| Rename `PortfolioBugsBunnyPanel.jsx` → `PortfolioDeadpoolPanel.jsx` | SENTRY | LOW |
| Move `mapBooking` application from hook to controller — `listVportBookingHistory.controller.js` | SENTRY | MEDIUM |
| Move `mapAvailabilityRule` application from hook to controller — `loadDaySchedule.controller.js` | SENTRY | MEDIUM |
| Move model calls out of Final Screens — `VportSettingsScreen.jsx` + `VportDashboardScreen.jsx` | SENTRY | HIGH |
| Move `createVportForm.model.js` usage out of components into controller | SENTRY | MEDIUM |
| Move `vportDashboardLeadsScreen.model.js` calls out of Final Screen into hook or controller | SENTRY | LOW |
| Move `mapPayloadToRow` / `safeObj` / `safeArr` inline transforms to a `vportSettings.model.js` | SENTRY | LOW |

---

## ARCHITECT Pipeline Trace

_Appended:_ 2026-05-11 · ARCHITECT live audit  
_Scope:_ Full Model → Controller → Hook → View Screen → Final Screen per domain group  
_Method:_ Direct file inspection of all model files, controller imports, hook imports, screen imports

---

### DAL Scope Clarification — Three Source Directories

This doc spans DALs from three distinct feature directories. Their model/controller/hook/screen pipelines differ by source:

| Source Directory | Domain Coverage | Model Files Location |
|---|---|---|
| `features/vport/dal/` | Vport creation, CRUD, profile media, service catalog | `features/vport/model/`, `features/vport/createVportForm.model.js` |
| `features/dashboard/vport/dal/` | Owner dashboard: booking, team, resources, leads, availability, settings | `features/dashboard/vport/model/`, `features/dashboard/vport/screens/model/` |
| `features/profiles/kinds/vport/dal/` | Gas, locksmith, menu, content pages, services, rates, reviews, subscribers, post guards | `features/profiles/kinds/vport/model/` — **traced in `vcsm.dal.profiles.md`** |

Domains in group 3 (profiles-owned DALs) are cross-referenced here for completeness but their full pipeline maps live in the profiles DAL doc.

---

### Domain 1 — Vport Core (Creation / CRUD)

**Source:** `features/vport/`  
**DALs:** `vport.core.dal.js`, `vport.read.vportRecords.dal.js`, `vport.write.profileMedia.dal.js`, `readVportServiceCatalogByType.dal.js`

| Layer | Files |
|---|---|
| **Model** | `createVportForm.model.js` (utility helpers — consumed by components directly, not controller), `model/vportServiceCatalog.model.js` (`mapVportServiceCatalogRow`, `mapVportServiceCatalogRows`) |
| **Controller** | `controller/getVportServiceCatalog.controller.js` (uses `vportServiceCatalog.model.js` ✓), `controller/submitCreateVport.controller.js` (no model), `controller/vportCoreOps.controller.js` (no model), `recordProfileMediaAsset.controller.js` |
| **Adapter** | `adapters/CreateVportForm.jsx.adapter.js`, `adapters/vport.public.adapter.js` |
| **Hook** | `hooks/useCreateVport.js`, `hooks/useRestoreVport.js`, `hooks/useVportCoreOps.js`, `hooks/useVportServiceCatalog.js` |
| **Component** | `components/CreateVportServicesTab.jsx` (imports `createVportForm.model.js` directly — RISK-15), `components/CreateVportProfileTab.jsx` (same), `components/CreateVportDebugPanel.jsx` |
| **View Screen** | None in `features/vport/` — view composition done in `CreateVportForm.jsx` itself |
| **Final Screen** | `screens/RestoreVportScreen.jsx` · via adapter: `HowToCreateVportScreen.jsx`, `VportCategoryLandingScreen.jsx`, `VportActorMenuPublicView.jsx` |

**Full chain — service catalog:**
```
readVportServiceCatalogByType.dal.js
  → getVportServiceCatalog.controller.js [applies vportServiceCatalog.model.js ✓]
    → useVportServiceCatalog.js [Hook]
      → CreateVportServicesTab.jsx [Component]
        → CreateVportForm.jsx → RestoreVportScreen.jsx [Final Screen]
```

**Full chain — vport CRUD:**
```
vport.core.dal.js
  → vportCoreOps.controller.js [no model applied]
    → useVportCoreOps.js [Hook]
      → vport.public.adapter.js [Adapter]
        → HowToCreateVportScreen.jsx / VportCategoryLandingScreen.jsx / VportActorMenuPublicView.jsx [Final Screens]
```

**Model bypass — createVportForm.model.js:**
```
createVportForm.model.js
  ← CreateVportForm.jsx [component — direct import, bypasses controller layer]
  ← CreateVportServicesTab.jsx [component — direct import]
  ← CreateVportProfileTab.jsx [component — direct import]
```
No controller applies `createVportForm.model.js`. See RISK-15.

---

### Domain 2 — Vport Dashboard Booking

**Source:** `features/dashboard/vport/`  
**DALs:** `actorVport.read.dal.js`, `vportBookingById.read.dal.js`, `vportBookingHistory.read.dal.js`, `vportBookingsInRange.read.dal.js`, `listVportBookingsForProfileDay.read.dal.js`, `insertVportBooking.write.dal.js`, `updateVportBooking.write.dal.js`

| Layer | Files |
|---|---|
| **Model** | `model/vportBooking.model.js` (`mapBooking`) |
| **Controller** | `controller/listVportBookingHistory.controller.js` (returns raw DAL rows — does NOT apply `mapBooking`), `controller/vportPublicBooking.controller.js`, `controller/createOwnerBooking.controller.js`, `controller/updateVportBooking.controller.js`, `controller/vportOwnerStats.controller.js` |
| **Hook** | `hooks/useVportBookingHistory.js` (applies `mapBooking` directly — RISK-16), `hooks/useVportBookingActions.js`, `hooks/useVportOwnerResources.js`, `hooks/useVportBookingOps.js`, `hooks/useOwnerQuickStats.js` |
| **Adapter** | `adapters/vport.adapter.js` (consumed by `useVportOwnerResources.js`, `useOwnerQuickStats.js`) |
| **Component** | `components/bookingHistory/QuickBookingModal.jsx` (imports `vportServices.read.dal.js` directly — RISK-3 from prior audit) |
| **Final Screens** | `VportDashboardBookingHistoryScreen.jsx`, `VportDashboardScheduleScreen.jsx`, `VportDashboardCalendarScreen.jsx` · via adapter: `VportActorMenuFlyerView.jsx`, `VportBarberShopBookingView.jsx` |

**Full chain — booking history:**
```
vportBookingHistory.read.dal.js
  → listVportBookingHistory.controller.js [returns raw rows]
    → useVportBookingHistory.js [Hook — applies mapBooking HERE, not in controller]
      → VportDashboardBookingHistoryScreen.jsx [Final Screen]
```

**Full chain — public booking creation:**
```
insertVportBooking.write.dal.js
  → vportPublicBooking.controller.js
    → useVportBookingOps.js [Hook]
      → vport.adapter.js [Adapter]
        → VportActorMenuFlyerView.jsx / VportBarberShopBookingView.jsx [Final Screens]
```

**Model placement issue (`mapBooking`):**
`listVportBookingHistory.controller.js` passes raw rows through without applying `mapBooking`. The hook applies the model transform. See RISK-16.

---

### Domain 3 — Vport Dashboard Availability / Schedule

**Source:** `features/dashboard/vport/`  
**DALs:** `vportAvailabilityRules.read.dal.js`, `vportAvailabilityRules.write.dal.js`

| Layer | Files |
|---|---|
| **Model** | `model/vportAvailabilityRule.model.js` (`mapAvailabilityRule`) |
| **Controller** | `controller/loadDaySchedule.controller.js` (does NOT apply `mapAvailabilityRule`), `controller/manageVportAvailabilityRule.controller.js` |
| **Hook** | `hooks/useVportResourceAvailability.js` (applies `mapAvailabilityRule` directly — RISK-17), `hooks/useVportManageAvailability.js`, `hooks/useVportOwnerSchedule.js` |
| **Final Screens** | `VportDashboardCalendarScreen.jsx`, `VportDashboardScheduleScreen.jsx` |

**Full chain:**
```
vportAvailabilityRules.read.dal.js
  → loadDaySchedule.controller.js [raw rows, no model applied]
    → useVportOwnerSchedule.js [Hook]
      → VportDashboardScheduleScreen.jsx [Final Screen]

vportAvailabilityRules.read.dal.js
  → loadDaySchedule.controller.js
    → useVportResourceAvailability.js [Hook — applies mapAvailabilityRule HERE]
      → VportDashboardCalendarScreen.jsx [Final Screen]
```

---

### Domain 4 — Vport Dashboard Resources

**Source:** `features/dashboard/vport/`  
**DALs:** `vportResource.read.dal.js`, `vportResource.write.dal.js`

| Layer | Files |
|---|---|
| **Model** | None |
| **Controller** | `controller/ensureVportOwnerResource.controller.js`, `controller/createOwnerBooking.controller.js`, `controller/vportPublicBooking.controller.js`, `controller/loadDaySchedule.controller.js` |
| **Hook** | `hooks/useVportEnsureResource.js`, `hooks/useVportOwnerResources.js` |
| **Final Screen** | `VportDashboardCalendarScreen.jsx` |

---

### Domain 5 — Vport Dashboard Settings / Public Details

**Source:** `features/dashboard/vport/`  
**DALs:** `vportProfile.read.dal.js`, `vportCities.read.dal.js`, `vportPublicDetails.write.dal.js`

| Layer | Files |
|---|---|
| **Model** | `model/dashboardVportDetails.model.js` (`normalizeDashboardVportDetails`), `model/vportSettingsDraft.model.js` (`mapPublicDetailsToDraft` — imports `dashboardVportDetails.model.js`), `screens/model/buildDashboardCards.model.js` (`buildDashboardCards`, `getDashboardCardMetaByKey` — screen-nested), `screens/model/dashboardViewByVportType.model.js` (`getDashboardCardKeysByVportType` — screen-nested) |
| **Controller** | `controller/saveVportPublicDetailsByActorId.controller.js` (inline transforms `mapPayloadToRow`/`safeObj`/`safeArr` — does NOT use `dashboardVportDetails.model.js`, RISK-18), `controller/checkVportOwnership.controller.js` |
| **Hook** | `hooks/useSaveVportPublicDetailsByActorId.js`, `hooks/useVportOwnership.js` |
| **Final Screens** | `VportSettingsScreen.jsx` (imports `normalizeDashboardVportDetails` + `mapPublicDetailsToDraft` + `buildDashboardCards.model.js` + `dashboardViewByVportType.model.js` directly — RISK-18), `VportDashboardScreen.jsx` (imports `normalizeDashboardVportDetails` + `buildDashboardCards.model.js` + `dashboardViewByVportType.model.js` directly — RISK-18) |

**Full chain — settings read:**
```
vportProfile.read.dal.js
  → saveVportPublicDetailsByActorId.controller.js [inline mapPayloadToRow — no model import]
    → useSaveVportPublicDetailsByActorId.js [Hook]
      → VportSettingsScreen.jsx [Final Screen — applies normalizeDashboardVportDetails + mapPublicDetailsToDraft directly]
```

**Model bypass — dashboardVportDetails.model.js:**
```
dashboardVportDetails.model.js
  ← VportSettingsScreen.jsx [Final Screen — direct import, bypasses hook/controller]
  ← VportDashboardScreen.jsx [Final Screen — direct import]
```
See RISK-18 — most severe model violation in this feature.

---

### Domain 6 — Vport Dashboard Team

**Source:** `features/dashboard/vport/`  
**DALs:** `vportTeam.read.dal.js`, `vportTeam.write.dal.js`, `vportTeamInvite.read.dal.js`, `vportTeamInvite.write.dal.js`

| Layer | Files |
|---|---|
| **Model** | None |
| **Controller** | `controller/vportTeam.controller.js`, `controller/vportTeamAccess.controller.js`, `controller/vportTeamInvite.controller.js` |
| **Hook** | `hooks/useVportTeam.js`, `hooks/useVportTeamAccess.js`, `hooks/useBarberTeamRequests.js`, `hooks/useAcceptBarbershopInvite.js` |
| **Adapter** | `adapters/vport.adapter.js` |
| **Final Screens** | `VportDashboardTeamScreen.jsx`, `BarberTeamRequestsScreen.jsx` · via adapter: `VportActorMenuFlyerView.jsx`, `VportBarberShopBookingView.jsx`, `VportBarberShopTeamView.jsx` |

---

### Domain 7 — Vport Dashboard Leads

**Source:** `features/dashboard/vport/`  
**DALs:** `vportLeads.read.dal.js`, `vportLeads.write.dal.js`

| Layer | Files |
|---|---|
| **Model** | `screens/vportDashboardLeadsScreen.model.js` (`formatLeadDate`, `formatSourceLabel`, `toText` — screen-nested) |
| **Controller** | `controller/vportLeads.controller.js` |
| **Hook** | `hooks/useVportLeads.js`, `hooks/useVportNewLeadsCount.js` |
| **Final Screen** | `VportDashboardLeadsScreen.jsx` (imports model functions directly — RISK-19) |

**Full chain:**
```
vportLeads.read.dal.js
  → vportLeads.controller.js
    → useVportLeads.js [Hook]
      → VportDashboardLeadsScreen.jsx [Final Screen — applies formatLeadDate + formatSourceLabel directly]
```

---

### Domain 8 — Vport Dashboard Portfolio / Ownership

**Source:** `features/dashboard/vport/`  
**DALs:** `portfolioMediaRecord.write.dal.js`, `actorOwners.read.dal.js`, `vportProfileActorAccess.read.dal.js`

| Layer | Files |
|---|---|
| **Model** | None |
| **Controller** | `controller/addPortfolioMediaWithRecord.controller.js`, `controller/probeVportPortfolio.controller.js`, `controller/checkVportOwnership.controller.js` |
| **Hook** | `screens/components/portfolio/hooks/usePortfolioItemSubmit.js`, `screens/components/portfolio/hooks/usePortfolioMediaUpload.js` |
| **Component** | `screens/components/portfolio/PortfolioItemForm.jsx`, `screens/components/portfolio/PortfolioManagerCard.jsx`, `screens/components/PortfolioBugsBunnyPanel.jsx` |
| **Final Screen** | `VportDashboardPortfolioScreen.jsx` |

**Full chain:**
```
portfolioMediaRecord.write.dal.js
  → addPortfolioMediaWithRecord.controller.js
    → usePortfolioItemSubmit.js [Hook — in screens/components/portfolio/]
      → PortfolioItemForm.jsx [Component]
        → VportDashboardPortfolioScreen.jsx [Final Screen]
```

---

### Domain 9–13 — Profiles-Owned Domains (Cross-Reference)

The following domains have their DALs in `features/profiles/kinds/vport/dal/` and their full pipeline maps documented in `vcsm.dal.profiles.md`:

| Domain | DAL Source | Model Source |
|---|---|---|
| Gas / Fuel Prices | `profiles/kinds/vport/dal/gas/` | `profiles/kinds/vport/model/gas/` |
| Locksmith | `profiles/kinds/vport/dal/locksmith/` | `profiles/kinds/vport/model/locksmith/` |
| Menu | `profiles/kinds/vport/dal/menu/` | `profiles/kinds/vport/model/menu/` |
| Content Pages | `profiles/kinds/vport/dal/content/` | `profiles/kinds/vport/model/content/` |
| Services / Rates / Reviews | `profiles/kinds/vport/dal/services/`, `dal/rates/`, `dal/review/` | `profiles/kinds/vport/model/services/`, `model/rates/`, `model/review/` |

These are attributed to the vport DAL doc's Call Chains section because the call chains pass through `features/dashboard/vport/` controllers/hooks/screens, but the DALs and models themselves are owned by the profiles feature.

---

## Risk Findings — Additional (Pipeline Trace)

### RISK-15 — `createVportForm.model.js` Consumed Directly by Components (No Controller Layer)
**Severity:** MEDIUM  
**Classification:** LAYER VIOLATION  
**Detail:** `createVportForm.model.js` exports `MAX_IMAGE_BYTES`, `cx`, `setsEqual`, and `groupServicesByCategory`. These are consumed directly by `CreateVportForm.jsx`, `CreateVportServicesTab.jsx`, and `CreateVportProfileTab.jsx` — all components/views. No controller applies this model. The model skips the controller layer entirely and flows directly into the render layer.

`groupServicesByCategory` is a domain grouping function — business logic that belongs in a controller, not called inline in a component.

**Recommended action:** Move `groupServicesByCategory` to `getVportServiceCatalog.controller.js`. Utility helpers (`cx`, `MAX_IMAGE_BYTES`) can stay but should be in `shared/` or a utility file, not a model file.

---

### RISK-16 — `mapBooking` Applied in Hook, Not Controller
**Severity:** MEDIUM  
**Classification:** LAYER VIOLATION  
**Detail:** `listVportBookingHistory.controller.js` calls `listVportBookingHistoryDAL` and returns raw rows without applying `mapBooking`. The hook `useVportBookingHistory.js` imports `mapBooking` from `vportBooking.model.js` and applies it inline during state assignment.

Domain row transforms belong in the controller. The hook should receive already-shaped domain objects.

**Recommended action:** Apply `mapBooking` inside `listVportBookingHistory.controller.js`. Remove the model import from `useVportBookingHistory.js`.

---

### RISK-17 — `mapAvailabilityRule` Applied in Hook, Not Controller
**Severity:** MEDIUM  
**Classification:** LAYER VIOLATION  
**Detail:** `loadDaySchedule.controller.js` returns raw availability rule rows without applying `mapAvailabilityRule`. The hook `useVportResourceAvailability.js` imports `mapAvailabilityRule` from `vportAvailabilityRule.model.js` and applies it on the raw output.

Same pattern as RISK-16 — domain transform belongs in the controller.

**Recommended action:** Apply `mapAvailabilityRule` inside `loadDaySchedule.controller.js` (or `manageVportAvailabilityRule.controller.js` as appropriate). Remove the model import from `useVportResourceAvailability.js`.

---

### RISK-18 — Model Transforms Applied Directly in Final Screens (Settings + Dashboard)
**Severity:** HIGH  
**Classification:** SEVERE LAYER VIOLATION  
**Detail:** Two Final Screens import and apply model functions directly, bypassing the entire hook and controller pipeline:

- `VportSettingsScreen.jsx` imports `normalizeDashboardVportDetails` from `dashboardVportDetails.model.js`, `mapPublicDetailsToDraft` from `vportSettingsDraft.model.js`, `getDashboardCardMetaByKey` from `buildDashboardCards.model.js`, and `getDashboardCardsByPreset` from `dashboardViewByVportType.model.js`.
- `VportDashboardScreen.jsx` imports `normalizeDashboardVportDetails` from `dashboardVportDetails.model.js`, `buildDashboardCards` from `buildDashboardCards.model.js`, and multiple functions from `dashboardViewByVportType.model.js`.

Per contract: Final Screens are route entry + identity gate only — no computation, no model calls. Model transforms must be owned by controllers and surfaced through hooks.

Additionally, `saveVportPublicDetailsByActorId.controller.js` contains inline `mapPayloadToRow`, `safeObj`, and `safeArr` functions that perform the same normalization work as `dashboardVportDetails.model.js` without importing from it — two parallel normalization paths for the same data shape.

**Recommended action:** Move `normalizeDashboardVportDetails` and `mapPublicDetailsToDraft` calls into `saveVportPublicDetailsByActorId.controller.js` (for write) and create a dedicated read controller for dashboard details hydration. Move `buildDashboardCards` and `getDashboardCardKeysByVportType` calls into hooks. Final Screens should receive pre-shaped data via hooks only.

---

### RISK-19 — `vportDashboardLeadsScreen.model.js` Applied Directly in Final Screen
**Severity:** LOW  
**Classification:** LAYER VIOLATION  
**Detail:** `VportDashboardLeadsScreen.jsx` imports `formatLeadDate` and `formatSourceLabel` directly from `screens/vportDashboardLeadsScreen.model.js` and calls them inline during JSX render. A Final Screen must not apply model transforms.

The model file is screen-nested (`screens/`) rather than feature-level — a naming convention issue on top of the layer violation.

**Recommended action:** Move `formatLeadDate` and `formatSourceLabel` calls into `useVportLeads.js`. The hook should return pre-formatted display fields. Move the model file to `features/dashboard/vport/model/vportLeads.model.js`.

---

## Codex Fix Pass — 2026-05-11

### Files Changed
| File | Change |
|---|---|
| `apps/VCSM/src/features/dashboard/vport/controller/listVportBookingHistory.controller.js` | Moved booking row normalization into the controller by applying `mapBooking` before returning booking history results. |
| `apps/VCSM/src/features/dashboard/vport/hooks/useVportBookingHistory.js` | Removed direct `mapBooking` model usage from the hook; the hook now paginates already-normalized controller results. |
| `zNOTFORPRODUCTION/_CANONICAL/logan/vcsm/dal/vcsm.dal.vport.md` | Appended this fix-pass record; prior audit history was preserved. |

### Findings Addressed
| Finding | Status | Notes |
|---|---|---|
| Dead code: `vportProfileActorAccess.write.dal.js` | DEFERRED | Repo search still shows no production callers, but deletion was not performed because the active instruction is append-only/no deletion. Requires SENTRY approval before removal. |
| RISK-1: `vport.core.dal.js` contains auth logic | DEFERRED | Verified `supabase.auth.getUser()` remains in `vport.core.dal.js` and `vport.read.vportRecords.dal.js`. Moving auth identity out of DAL changes function signatures and runtime auth semantics, so this needs a dedicated SENTRY refactor. |
| RISK-2: `vport.public.js` migration barrel | DEFERRED | Current production app paths use `vport.public.adapter.js`; `vport.public.js` remains referenced by dev diagnostics. Barrel deletion/removal was not performed under append-only/no deletion instruction. |
| RISK-3: `QuickBookingModal.jsx` direct DAL import | RESOLVED IN CURRENT TREE | Verified `QuickBookingModal.jsx` imports `useQuickBookingModal`; service loading flows through `useQuickBookingModal.js` to `listVportServicesForProfile.controller.js`. The component no longer imports `vportServices.read.dal.js` directly. |
| RISK-4: duplicate `listMyVports` | DEFERRED | Verified duplicate exports remain in `vport.core.dal.js` and `vport.read.vportRecords.dal.js`. Consolidation would require removing a DAL path and updating dev diagnostics; deferred for SENTRY because deletion was not allowed. |
| RISK-5: deprecated portfolio panel command name | DEFERRED | Rename not performed because it is a broader route/component rename and would create delete/add churn. Requires SENTRY review. |
| RISK-15: `createVportForm.model.js` consumed directly by components | DEFERRED | Verified direct component imports remain. Moving `groupServicesByCategory` requires reshaping the service catalog hook/controller contract and was outside safe DAL-scope surgery. |
| RISK-16: `mapBooking` applied in hook, not controller | FIXED | `listVportBookingHistory.controller.js` now applies `mapBooking`; `useVportBookingHistory.js` no longer imports the model. Pagination behavior is preserved because the hook still slices the controller result after requesting `pageSize + 1`. |
| RISK-17: `mapAvailabilityRule` applied in hook, not controller | DEFERRED | Verified `useVportResourceAvailability.js` still maps availability rules. The same raw controller result is also used through the public vport booking adapter, so changing it would risk double-mapping in public booking paths. |
| RISK-18: model transforms applied directly in final screens | DEFERRED | Verified larger settings/dashboard model placement remains. This needs a dedicated screen/hook/controller refactor and was not safe as a DAL-only pass. |
| RISK-19: leads screen model applied in final screen | DEFERRED | Not changed; this is a final-screen/hook model placement cleanup outside the safe DAL boundary fix performed here. |

### Verification
- Commands/searches run:
  - `sed -n '1341,1700p' zNOTFORPRODUCTION/_CANONICAL/logan/vcsm/dal/vcsm.dal.vport.md`
  - `sed -n '1701,2100p' zNOTFORPRODUCTION/_CANONICAL/logan/vcsm/dal/vcsm.dal.vport.md`
  - `rg -n "RISK-|Risk|Recommended|DEAD|dead|component|QuickBookingModal|auth|barrel|listMyVports|vportProfileActorAccess|violation|PENDING|DELETE|duplicate|console|Finding|finding" zNOTFORPRODUCTION/_CANONICAL/logan/vcsm/dal/vcsm.dal.vport.md`
  - `rg -n "vportProfileActorAccess|QuickBookingModal|listVportServicesByProfileIdDAL|vportServices\\.read\\.dal|listMyVports|supabase\\.auth|getUser\\(|getSession\\(|vport\\.public|PortfolioBugsBunnyPanel|groupServicesByCategory|mapBooking|mapAvailabilityRule" apps/VCSM/src/features/vport apps/VCSM/src/features/dashboard/vport apps/VCSM/src/features/profiles/kinds/vport apps/VCSM/src/dev/diagnostics --glob '*.js' --glob '*.jsx'`
  - `rg -n "from ['\"]@/features/(dashboard/vport|vport).*/dal|from ['\"]\\.\\./.*dal|from ['\"]@/features/vport/vport\\.public|vport\\.public" apps/VCSM/src/features/vport apps/VCSM/src/features/dashboard/vport --glob '*.js' --glob '*.jsx'`
  - `rg -n "listVportBookingHistoryController|mapBooking" apps/VCSM/src/features/dashboard/vport apps/VCSM/src/features/profiles/kinds/vport --glob '*.js' --glob '*.jsx'`
  - `npm run build`
- Production callers checked:
  - `QuickBookingModal.jsx` uses `useQuickBookingModal`, not a DAL import.
  - `useQuickBookingModal.js` calls `listVportServicesForProfile.controller.js`.
  - `listVportBookingHistoryController` is called by `useVportBookingHistory.js`.
  - `mapBooking` is now applied in `listVportBookingHistory.controller.js`.
  - `vport.public.js` and duplicate `listMyVports` remain referenced by dev diagnostics and vport creation code.
- Remaining risks:
  - `vportProfileActorAccess.write.dal.js` deletion requires SENTRY approval.
  - Auth-in-DAL refactor for vport core requires SENTRY because it changes identity/session ownership.
  - Duplicate `listMyVports` consolidation requires SENTRY because it removes a DAL path and alters diagnostics.
  - Availability rule mapping, final-screen model cleanup, and create-vport model placement require dedicated controller/hook refactors.
  - Build passed. Vite still reports the pre-existing `VerifyEmailRequiredScreen.jsx` static/dynamic import warning and existing large chunk warnings.

### Status
PARTIAL
