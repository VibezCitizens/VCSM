# VCSM DAL — `dashboard`

_Generated:_ 2026-05-11  
_Source:_ ARCHITECT static scan · `apps/VCSM/src/features/dashboard/dal/`  
_Confidence:_ STATICALLY\_TRACED  

---

## Summary

| Item | Count |
|---|---|
| DAL files | 30 |
| Exported functions | 71 |
| Tables accessed | 20 |
| RPCs called | 0 |
| Risk findings | 0 |

## DAL Files

### `actorOwners.read.dal.js`

**Path:** `features/dashboard/vport/dal/read/actorOwners.read.dal.js`  
**Operations:** `read`  

**Exported functions:**

| `readActorOwnersByActorIdDAL` | `read` | `actor_owners` |

### `actorVport.read.dal.js`

**Path:** `features/dashboard/vport/dal/read/actorVport.read.dal.js`  
**Operations:** `read`  

**Exported functions:**

| `readActorVportLinkDAL` | `read` | `actors` |

### `designStudio.auth.dal.js`

**Path:** `features/dashboard/flyerBuilder/designStudio/dal/designStudio.auth.dal.js`  
**Operations:** `auth (supabase.auth.getUser)`  

**Exported functions:**

| `dalReadAuthenticatedUserId` | `auth (supabase.auth.getUser)` | — |

### `designStudio.read.dal.js`

**Path:** `features/dashboard/flyerBuilder/designStudio/dal/designStudio.read.dal.js`  
**Operations:** `read`  

**Exported functions:**

| `dalListDesignAssetsByOwner` | `read` | `design_documents`, `design_page_versions`, `design_exports`, `design_render_jobs`, `design_assets`, `actor_owners`, `design_pages` |
| `dalListDesignDocumentsByOwner` | `read` | `design_documents`, `design_page_versions`, `design_exports`, `design_render_jobs`, `design_assets`, `actor_owners`, `design_pages` |
| `dalListDesignExportsByDocument` | `read` | `design_documents`, `design_page_versions`, `design_exports`, `design_render_jobs`, `design_assets`, `actor_owners`, `design_pages` |
| `dalListDesignPagesByDocument` | `read` | `design_documents`, `design_page_versions`, `design_exports`, `design_render_jobs`, `design_assets`, `actor_owners`, `design_pages` |
| `dalListDesignRenderJobsByExportIds` | `read` | `design_documents`, `design_page_versions`, `design_exports`, `design_render_jobs`, `design_assets`, `actor_owners`, `design_pages` |
| `dalReadActorOwnerRow` | `read` | `design_documents`, `design_page_versions`, `design_exports`, `design_render_jobs`, `design_assets`, `actor_owners`, `design_pages` |
| `dalReadDesignDocumentById` | `read` | `design_documents`, `design_page_versions`, `design_exports`, `design_render_jobs`, `design_assets`, `actor_owners`, `design_pages` |
| `dalReadDesignPageById` | `read` | `design_documents`, `design_page_versions`, `design_exports`, `design_render_jobs`, `design_assets`, `actor_owners`, `design_pages` |
| `dalReadDesignPageVersionById` | `read` | `design_documents`, `design_page_versions`, `design_exports`, `design_render_jobs`, `design_assets`, `actor_owners`, `design_pages` |
| `dalReadLatestDesignPageVersion` | `read` | `design_documents`, `design_page_versions`, `design_exports`, `design_render_jobs`, `design_assets`, `actor_owners`, `design_pages` |

### `designStudio.write.dal.js`

**Path:** `features/dashboard/flyerBuilder/designStudio/dal/designStudio.write.dal.js`  
**Operations:** `read` · `insert` · `update` · `delete`  

**Exported functions:**

| `dalClearDesignPageCurrentVersion` | `read` · `insert` · `update` · `delete` | `design_documents`, `design_page_versions`, `design_exports`, `design_render_jobs`, `design_assets`, `design_pages` |
| `dalCreateDesignAsset` | `read` · `insert` · `update` · `delete` | `design_documents`, `design_page_versions`, `design_exports`, `design_render_jobs`, `design_assets`, `design_pages` |
| `dalCreateDesignDocument` | `read` · `insert` · `update` · `delete` | `design_documents`, `design_page_versions`, `design_exports`, `design_render_jobs`, `design_assets`, `design_pages` |
| `dalCreateDesignExport` | `read` · `insert` · `update` · `delete` | `design_documents`, `design_page_versions`, `design_exports`, `design_render_jobs`, `design_assets`, `design_pages` |
| `dalCreateDesignPage` | `read` · `insert` · `update` · `delete` | `design_documents`, `design_page_versions`, `design_exports`, `design_render_jobs`, `design_assets`, `design_pages` |
| `dalCreateDesignPageVersion` | `read` · `insert` · `update` · `delete` | `design_documents`, `design_page_versions`, `design_exports`, `design_render_jobs`, `design_assets`, `design_pages` |
| `dalCreateDesignRenderJob` | `read` · `insert` · `update` · `delete` | `design_documents`, `design_page_versions`, `design_exports`, `design_render_jobs`, `design_assets`, `design_pages` |
| `dalDeleteDesignExportsByPageId` | `read` · `insert` · `update` · `delete` | `design_documents`, `design_page_versions`, `design_exports`, `design_render_jobs`, `design_assets`, `design_pages` |
| `dalDeleteDesignPageById` | `read` · `insert` · `update` · `delete` | `design_documents`, `design_page_versions`, `design_exports`, `design_render_jobs`, `design_assets`, `design_pages` |
| `dalDeleteDesignPageVersionsByPageId` | `read` · `insert` · `update` · `delete` | `design_documents`, `design_page_versions`, `design_exports`, `design_render_jobs`, `design_assets`, `design_pages` |
| `dalDeleteDesignRenderJobsByPageId` | `read` · `insert` · `update` · `delete` | `design_documents`, `design_page_versions`, `design_exports`, `design_render_jobs`, `design_assets`, `design_pages` |
| `dalTouchDesignDocument` | `read` · `insert` · `update` · `delete` | `design_documents`, `design_page_versions`, `design_exports`, `design_render_jobs`, `design_assets`, `design_pages` |
| `dalUpdateDesignPageCurrentVersion` | `read` · `insert` · `update` · `delete` | `design_documents`, `design_page_versions`, `design_exports`, `design_render_jobs`, `design_assets`, `design_pages` |

### `flyer.read.dal.js`

**Path:** `features/dashboard/flyerBuilder/dal/flyer.read.dal.js`  
**Operations:** `read`  

**Exported functions:**

| `fetchFlyerPublicDetailsByActorId` | `read` | `actors` |

### `flyer.write.dal.js`

**Path:** `features/dashboard/flyerBuilder/dal/flyer.write.dal.js`  
**Operations:** `read` · `upsert`  

**Exported functions:**

| `saveFlyerPublicDetails` | `read` · `upsert` | `profile_public_details` |

### `insertVportBooking.write.dal.js`

**Path:** `features/dashboard/vport/dal/write/insertVportBooking.write.dal.js`  
**Operations:** `read` · `insert`  

**Exported functions:**

| `insertVportBookingDAL` | `read` · `insert` | `bookings` |

### `listVportBookingsForProfileDay.read.dal.js`

**Path:** `features/dashboard/vport/dal/read/listVportBookingsForProfileDay.read.dal.js`  
**Operations:** `read`  

**Exported functions:**

| `listVportBookingsForProfileDayDAL` | `read` | `bookings` |

### `portfolioMediaRecord.write.dal.js`

**Path:** `features/dashboard/vport/dal/write/portfolioMediaRecord.write.dal.js`  
**Operations:** `update`  

**Exported functions:**

| `updatePortfolioMediaAssetIdDAL` | `update` | `portfolio_media` |

### `updateVportBooking.write.dal.js`

**Path:** `features/dashboard/vport/dal/write/updateVportBooking.write.dal.js`  
**Operations:** `read` · `update`  

**Exported functions:**

| `updateVportBookingDAL` | `read` · `update` | `bookings` |

### `vportAvailabilityRules.read.dal.js`

**Path:** `features/dashboard/vport/dal/read/vportAvailabilityRules.read.dal.js`  
**Operations:** `read`  

**Exported functions:**

| `listVportAvailabilityRulesByResourceIdDAL` | `read` | `availability_rules` |

### `vportAvailabilityRules.write.dal.js`

**Path:** `features/dashboard/vport/dal/write/vportAvailabilityRules.write.dal.js`  
**Operations:** `read` · `insert` · `update`  

**Exported functions:**

| `upsertVportAvailabilityRuleDAL` | `read` · `insert` · `update` | `availability_rules` |

### `vportBookingById.read.dal.js`

**Path:** `features/dashboard/vport/dal/read/vportBookingById.read.dal.js`  
**Operations:** `read`  

**Exported functions:**

| `getVportBookingByIdDAL` | `read` | `bookings` |

### `vportBookingHistory.read.dal.js`

**Path:** `features/dashboard/vport/dal/read/vportBookingHistory.read.dal.js`  
**Operations:** `read`  

**Exported functions:**

| `listVportBookingHistoryDAL` | `read` | `bookings` |

### `vportBookingsInRange.read.dal.js`

**Path:** `features/dashboard/vport/dal/read/vportBookingsInRange.read.dal.js`  
**Operations:** `read`  

**Exported functions:**

| `listVportBookingsInRangeDAL` | `read` | `bookings` |

### `vportCities.read.dal.js`

**Path:** `features/dashboard/vport/dal/read/vportCities.read.dal.js`  
**Operations:** `read`  

**Exported functions:**

| `resolveVportCity` | `read` | `cities` |

### `vportLeads.read.dal.js`

**Path:** `features/dashboard/vport/dal/read/vportLeads.read.dal.js`  
**Operations:** `read`  

**Exported functions:**

| `readNewLeadsCountByProfileDAL` | `read` | `business_card_leads` |
| `readVportBusinessCardLeadsByProfileDAL` | `read` | `business_card_leads` |

### `vportLeads.write.dal.js`

**Path:** `features/dashboard/vport/dal/write/vportLeads.write.dal.js`  
**Operations:** `read` · `update` · `delete`  

**Exported functions:**

| `deleteVportBusinessCardLeadDAL` | `read` · `update` · `delete` | `business_card_leads` |
| `markVportBusinessCardLeadContactedDAL` | `read` · `update` · `delete` | `business_card_leads` |

### `vportProfile.read.dal.js`

**Path:** `features/dashboard/vport/dal/read/vportProfile.read.dal.js`  
**Operations:** `read`  

**Exported functions:**

| `getVportActorIdByProfileIdDAL` | `read` | `profiles` |
| `getVportProfileIdByActorDAL` | `read` | `profiles` |
| `readVportProfileByActorIdDAL` | `read` | `profiles` |

### `vportProfileActorAccess.read.dal.js`

**Path:** `features/dashboard/vport/dal/read/vportProfileActorAccess.read.dal.js`  
**Operations:** `read`  

**Exported functions:**

| `readVportProfileActorAccessDAL` | `read` | `profile_actor_access` |

### `vportProfileActorAccess.write.dal.js`

**Path:** `features/dashboard/vport/dal/write/vportProfileActorAccess.write.dal.js`  
**Operations:** `read` · `update` · `delete` · `upsert`  

**Exported functions:**

| `deleteProfileActorAccessDAL` | `read` · `update` · `delete` · `upsert` | `profile_actor_access` |
| `updateProfileActorAccessRoleDAL` | `read` · `update` · `delete` · `upsert` | `profile_actor_access` |
| `updateProfileActorAccessStatusDAL` | `read` · `update` · `delete` · `upsert` | `profile_actor_access` |
| `upsertProfileActorAccessDAL` | `read` · `update` · `delete` · `upsert` | `profile_actor_access` |

### `vportPublicDetails.write.dal.js`

**Path:** `features/dashboard/vport/dal/write/vportPublicDetails.write.dal.js`  
**Operations:** `read` · `upsert`  

**Exported functions:**

| `upsertVportPublicDetailsDAL` | `read` · `upsert` | `profile_public_details` |

### `vportResource.read.dal.js`

**Path:** `features/dashboard/vport/dal/read/vportResource.read.dal.js`  
**Operations:** `read`  

**Exported functions:**

| `getVportResourceByIdDAL` | `read` | `resources` |
| `listVportResourcesByProfileIdDAL` | `read` | `resources` |

### `vportResource.write.dal.js`

**Path:** `features/dashboard/vport/dal/write/vportResource.write.dal.js`  
**Operations:** `read` · `insert`  

**Exported functions:**

| `insertVportResourceDAL` | `read` · `insert` | `resources` |

### `vportServices.read.dal.js`

**Path:** `features/dashboard/vport/dal/read/vportServices.read.dal.js`  
**Operations:** `read`  

**Exported functions:**

| `getVportServiceByIdDAL` | `read` | `services` |
| `listVportServicesByProfileIdDAL` | `read` | `services` |

### `vportTeam.read.dal.js`

**Path:** `features/dashboard/vport/dal/read/vportTeam.read.dal.js`  
**Operations:** `read`  

**Exported functions:**

| `fetchTeamMembersByProfileId` | `read` | `actor_follows`, `resources`, `actor_owners`, `actors`, `profile_categories` |
| `findEligibleBarbersDAL` | `read` | `actor_follows`, `resources`, `actor_owners`, `actors`, `profile_categories` |

### `vportTeam.write.dal.js`

**Path:** `features/dashboard/vport/dal/write/vportTeam.write.dal.js`  
**Operations:** `read` · `insert` · `update` · `delete`  

**Exported functions:**

| `deleteTeamMemberByIdDAL` | `read` · `insert` · `update` · `delete` | `resources` |
| `insertLinkedTeamMemberDAL` | `read` · `insert` · `update` · `delete` | `resources` |
| `insertTeamMemberDAL` | `read` · `insert` · `update` · `delete` | `resources` |
| `setTeamMemberActiveDAL` | `read` · `insert` · `update` · `delete` | `resources` |
| `updateTeamMemberRoleDAL` | `read` · `insert` · `update` · `delete` | `resources` |

### `vportTeamInvite.read.dal.js`

**Path:** `features/dashboard/vport/dal/read/vportTeamInvite.read.dal.js`  
**Operations:** `read`  

**Exported functions:**

| `fetchAllTeamRequestsForBarberDAL` | `read` | `resources` |
| `fetchPendingTeamRequestsForBarberDAL` | `read` | `resources` |
| `fetchResourceByIdDAL` | `read` | `resources` |

### `vportTeamInvite.write.dal.js`

**Path:** `features/dashboard/vport/dal/write/vportTeamInvite.write.dal.js`  
**Operations:** `read` · `insert` · `update` · `delete`  

**Exported functions:**

| `acceptTeamInviteByActorDAL` | `read` · `insert` · `update` · `delete` | `resources` |
| `acceptTeamRequestDAL` | `read` · `insert` · `update` · `delete` | `resources` |
| `declineTeamRequestDAL` | `read` · `insert` · `update` · `delete` | `resources` |
| `deleteTeamResourceDAL` | `read` · `insert` · `update` · `delete` | `resources` |
| `insertTeamRequestDAL` | `read` · `insert` · `update` · `delete` | `resources` |

---

## Tables Accessed

| Table | Operations | Via Functions |
|---|---|---|
| `actor_follows` | READ | `fetchTeamMembersByProfileId`, `findEligibleBarbersDAL` |
| `actor_owners` | READ | `dalListDesignAssetsByOwner`, `dalListDesignDocumentsByOwner`, `dalListDesignExportsByDocument`, `dalListDesignPagesByDocument`, `dalListDesignRenderJobsByExportIds`, `dalReadActorOwnerRow`, `dalReadDesignDocumentById`, `dalReadDesignPageById`, `dalReadDesignPageVersionById`, `dalReadLatestDesignPageVersion`, `fetchTeamMembersByProfileId`, `findEligibleBarbersDAL`, `readActorOwnersByActorIdDAL` |
| `actors` | READ | `fetchFlyerPublicDetailsByActorId`, `fetchTeamMembersByProfileId`, `findEligibleBarbersDAL`, `readActorVportLinkDAL` |
| `availability_rules` | READ, UPDATE | `listVportAvailabilityRulesByResourceIdDAL`, `upsertVportAvailabilityRuleDAL` |
| `bookings` | INSERT, READ, UPDATE | `getVportBookingByIdDAL`, `insertVportBookingDAL`, `listVportBookingHistoryDAL`, `listVportBookingsForProfileDayDAL`, `listVportBookingsInRangeDAL`, `updateVportBookingDAL` |
| `business_card_leads` | DELETE, READ | `deleteVportBusinessCardLeadDAL`, `markVportBusinessCardLeadContactedDAL`, `readNewLeadsCountByProfileDAL`, `readVportBusinessCardLeadsByProfileDAL` |
| `cities` | READ | `resolveVportCity` |
| `design_assets` | DELETE, READ | `dalClearDesignPageCurrentVersion`, `dalCreateDesignAsset`, `dalCreateDesignDocument`, `dalCreateDesignExport`, `dalCreateDesignPageVersion`, `dalCreateDesignPage`, `dalCreateDesignRenderJob`, `dalDeleteDesignExportsByPageId`, `dalDeleteDesignPageById`, `dalDeleteDesignPageVersionsByPageId`, `dalDeleteDesignRenderJobsByPageId`, `dalListDesignAssetsByOwner`, `dalListDesignDocumentsByOwner`, `dalListDesignExportsByDocument`, `dalListDesignPagesByDocument`, `dalListDesignRenderJobsByExportIds`, `dalReadActorOwnerRow`, `dalReadDesignDocumentById`, `dalReadDesignPageById`, `dalReadDesignPageVersionById`, `dalReadLatestDesignPageVersion`, `dalTouchDesignDocument`, `dalUpdateDesignPageCurrentVersion` |
| `design_documents` | DELETE, READ | `dalClearDesignPageCurrentVersion`, `dalCreateDesignAsset`, `dalCreateDesignDocument`, `dalCreateDesignExport`, `dalCreateDesignPageVersion`, `dalCreateDesignPage`, `dalCreateDesignRenderJob`, `dalDeleteDesignExportsByPageId`, `dalDeleteDesignPageById`, `dalDeleteDesignPageVersionsByPageId`, `dalDeleteDesignRenderJobsByPageId`, `dalListDesignAssetsByOwner`, `dalListDesignDocumentsByOwner`, `dalListDesignExportsByDocument`, `dalListDesignPagesByDocument`, `dalListDesignRenderJobsByExportIds`, `dalReadActorOwnerRow`, `dalReadDesignDocumentById`, `dalReadDesignPageById`, `dalReadDesignPageVersionById`, `dalReadLatestDesignPageVersion`, `dalTouchDesignDocument`, `dalUpdateDesignPageCurrentVersion` |
| `design_exports` | DELETE, READ | `dalClearDesignPageCurrentVersion`, `dalCreateDesignAsset`, `dalCreateDesignDocument`, `dalCreateDesignExport`, `dalCreateDesignPageVersion`, `dalCreateDesignPage`, `dalCreateDesignRenderJob`, `dalDeleteDesignExportsByPageId`, `dalDeleteDesignPageById`, `dalDeleteDesignPageVersionsByPageId`, `dalDeleteDesignRenderJobsByPageId`, `dalListDesignAssetsByOwner`, `dalListDesignDocumentsByOwner`, `dalListDesignExportsByDocument`, `dalListDesignPagesByDocument`, `dalListDesignRenderJobsByExportIds`, `dalReadActorOwnerRow`, `dalReadDesignDocumentById`, `dalReadDesignPageById`, `dalReadDesignPageVersionById`, `dalReadLatestDesignPageVersion`, `dalTouchDesignDocument`, `dalUpdateDesignPageCurrentVersion` |
| `design_page_versions` | DELETE, READ | `dalClearDesignPageCurrentVersion`, `dalCreateDesignAsset`, `dalCreateDesignDocument`, `dalCreateDesignExport`, `dalCreateDesignPageVersion`, `dalCreateDesignPage`, `dalCreateDesignRenderJob`, `dalDeleteDesignExportsByPageId`, `dalDeleteDesignPageById`, `dalDeleteDesignPageVersionsByPageId`, `dalDeleteDesignRenderJobsByPageId`, `dalListDesignAssetsByOwner`, `dalListDesignDocumentsByOwner`, `dalListDesignExportsByDocument`, `dalListDesignPagesByDocument`, `dalListDesignRenderJobsByExportIds`, `dalReadActorOwnerRow`, `dalReadDesignDocumentById`, `dalReadDesignPageById`, `dalReadDesignPageVersionById`, `dalReadLatestDesignPageVersion`, `dalTouchDesignDocument`, `dalUpdateDesignPageCurrentVersion` |
| `design_pages` | DELETE, READ | `dalClearDesignPageCurrentVersion`, `dalCreateDesignAsset`, `dalCreateDesignDocument`, `dalCreateDesignExport`, `dalCreateDesignPageVersion`, `dalCreateDesignPage`, `dalCreateDesignRenderJob`, `dalDeleteDesignExportsByPageId`, `dalDeleteDesignPageById`, `dalDeleteDesignPageVersionsByPageId`, `dalDeleteDesignRenderJobsByPageId`, `dalListDesignAssetsByOwner`, `dalListDesignDocumentsByOwner`, `dalListDesignExportsByDocument`, `dalListDesignPagesByDocument`, `dalListDesignRenderJobsByExportIds`, `dalReadActorOwnerRow`, `dalReadDesignDocumentById`, `dalReadDesignPageById`, `dalReadDesignPageVersionById`, `dalReadLatestDesignPageVersion`, `dalTouchDesignDocument`, `dalUpdateDesignPageCurrentVersion` |
| `design_render_jobs` | DELETE, READ | `dalClearDesignPageCurrentVersion`, `dalCreateDesignAsset`, `dalCreateDesignDocument`, `dalCreateDesignExport`, `dalCreateDesignPageVersion`, `dalCreateDesignPage`, `dalCreateDesignRenderJob`, `dalDeleteDesignExportsByPageId`, `dalDeleteDesignPageById`, `dalDeleteDesignPageVersionsByPageId`, `dalDeleteDesignRenderJobsByPageId`, `dalListDesignAssetsByOwner`, `dalListDesignDocumentsByOwner`, `dalListDesignExportsByDocument`, `dalListDesignPagesByDocument`, `dalListDesignRenderJobsByExportIds`, `dalReadActorOwnerRow`, `dalReadDesignDocumentById`, `dalReadDesignPageById`, `dalReadDesignPageVersionById`, `dalReadLatestDesignPageVersion`, `dalTouchDesignDocument`, `dalUpdateDesignPageCurrentVersion` |
| `portfolio_media` | UPDATE | `updatePortfolioMediaAssetIdDAL` |
| `profile_actor_access` | DELETE, READ | `deleteProfileActorAccessDAL`, `readVportProfileActorAccessDAL`, `updateProfileActorAccessRoleDAL`, `updateProfileActorAccessStatusDAL`, `upsertProfileActorAccessDAL` |
| `profile_categories` | READ | `fetchTeamMembersByProfileId`, `findEligibleBarbersDAL` |
| `profile_public_details` | UPSERT | `saveFlyerPublicDetails`, `upsertVportPublicDetailsDAL` |
| `profiles` | READ | `getVportActorIdByProfileIdDAL`, `getVportProfileIdByActorDAL`, `readVportProfileByActorIdDAL` |
| `resources` | DELETE, INSERT, READ | `acceptTeamInviteByActorDAL`, `acceptTeamRequestDAL`, `declineTeamRequestDAL`, `deleteTeamMemberByIdDAL`, `deleteTeamResourceDAL`, `fetchAllTeamRequestsForBarberDAL`, `fetchPendingTeamRequestsForBarberDAL`, `fetchResourceByIdDAL`, `fetchTeamMembersByProfileId`, `findEligibleBarbersDAL`, `getVportResourceByIdDAL`, `insertLinkedTeamMemberDAL`, `insertTeamMemberDAL`, `insertTeamRequestDAL`, `insertVportResourceDAL`, `listVportResourcesByProfileIdDAL`, `setTeamMemberActiveDAL`, `updateTeamMemberRoleDAL` |
| `services` | READ | `getVportServiceByIdDAL`, `listVportServicesByProfileIdDAL` |

---

## Risk Findings

| Risk | Severity | Status | Notes |
|---|---|---|---|
| `vportProfileActorAccess.write.dal.js` dead write path scopes by `profileId` if ever wired | HIGH | OPEN | Confirmed zero callers; left pending VENOM/IRONMAN because fixing requires delete or actorId rebuild ownership. |
| `designStudio.auth.dal.js` returns raw auth `userId` into design studio controller path | MEDIUM | OPEN | Requires SENTRY review of `designStudio.shared.controller.js` to confirm the value is not used as the primary actor identity gate. |
| `useAcceptBarbershopInvite.js` has no production callers | LOW | OPEN | Confirmed zero callers; delete candidate pending IRONMAN. |

---

## Pending Reviews

- SENTRY — review `designStudio.shared.controller.js` userId usage against actor identity contract.
- IRONMAN — confirm delete candidacy for `flyer.read.dal.js`, `dal/flyerDraft.model.js`, and `useAcceptBarbershopInvite.js`.
- VENOM / IRONMAN — decide whether `vportProfileActorAccess.write.dal.js` is deleted or rebuilt with actorId scoping before any wiring.

---

## Call Chains

Who calls each DAL file — traced from DAL up to Screen.

### `flyer.read.dal.js`

> No callers detected — possibly dead code or dynamically invoked.

### `flyer.write.dal.js`

**Direct callers:**

- `flyerEditor.controller.js` _Controller_

**Partial chain (no screen reached):  **

```
`flyer.write.dal.js` → `flyerEditor.controller.js`
```
```
`flyer.write.dal.js` → `flyerEditor.controller.js` → `useFlyerEditor.js`
```
```
`flyer.write.dal.js` → `flyerEditor.controller.js` → `useFlyerEditor.js` → `FlyerEditorPanel.jsx`
```

### `flyerDraft.model.js`

> No callers detected — possibly dead code or dynamically invoked.

### `designStudio.auth.dal.js`

**Direct callers:**

- `designStudio.shared.controller.js` _Controller_

**Partial chain (no screen reached):  **

```
`designStudio.auth.dal.js` → `designStudio.shared.controller.js`
```
```
`designStudio.auth.dal.js` → `designStudio.shared.controller.js` → `designStudio.assetsExports.controller.js`
```
```
`designStudio.auth.dal.js` → `designStudio.shared.controller.js` → `designStudio.load.controller.js`
```

### `designStudio.read.dal.js`

**Direct callers:**

- `designStudio.assetsExports.controller.js` _Controller_
- `designStudio.load.controller.js` _Controller_
- `designStudio.pages.controller.js` _Controller_
- `designStudio.shared.controller.js` _Controller_

**Full call chain to screen:**

```
`designStudio.read.dal.js` → `designStudio.assetsExports.controller.js` → `designStudio.controller.js` → `useDesignStudio.js` → `VportDesignStudioViewScreen.jsx`
```

### `designStudio.write.dal.js`

**Direct callers:**

- `designStudio.assetsExports.controller.js` _Controller_
- `designStudio.load.controller.js` _Controller_
- `designStudio.pages.controller.js` _Controller_

**Full call chain to screen:**

```
`designStudio.write.dal.js` → `designStudio.assetsExports.controller.js` → `designStudio.controller.js` → `useDesignStudio.js` → `VportDesignStudioViewScreen.jsx`
```

### `actorOwners.read.dal.js`

**Direct callers:**

- `probeVportPortfolio.controller.js` _Controller_

**Full call chain to screen:**

```
`actorOwners.read.dal.js` → `probeVportPortfolio.controller.js` → `useVportPortfolioProbe.js` → `PortfolioBugsBunnyPanel.jsx`
```
```
`actorOwners.read.dal.js` → `probeVportPortfolio.controller.js` → `useVportPortfolioProbe.js` → `PortfolioBugsBunnyPanel.jsx` → `VportDashboardPortfolioScreen.jsx`
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
`vportProfile.read.dal.js` → `probeVportPortfolio.controller.js` → `useVportPortfolioProbe.js` → `PortfolioBugsBunnyPanel.jsx`
```
```
`vportProfile.read.dal.js` → `createOwnerBooking.controller.js` → `useQuickBookingModal.js` → `QuickBookingModal.jsx` → `VportDashboardBookingHistoryScreen.jsx`
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
`vportProfileActorAccess.read.dal.js` → `probeVportPortfolio.controller.js` → `useVportPortfolioProbe.js` → `PortfolioBugsBunnyPanel.jsx`
```
```
`vportProfileActorAccess.read.dal.js` → `probeVportPortfolio.controller.js` → `useVportPortfolioProbe.js` → `PortfolioBugsBunnyPanel.jsx` → `VportDashboardPortfolioScreen.jsx`
```

### `vportResource.read.dal.js`

**Direct callers:**

- `createOwnerBooking.controller.js` _Controller_
- `ensureVportOwnerResource.controller.js` _Controller_
- `loadDaySchedule.controller.js` _Controller_
- `vportPublicBooking.controller.js` _Controller_

**Full call chain to screen:**

```
`vportResource.read.dal.js` → `createOwnerBooking.controller.js` → `useQuickBookingModal.js` → `QuickBookingModal.jsx` → `VportDashboardBookingHistoryScreen.jsx`
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

- `listVportServicesForProfile.controller.js` _Controller_
- `loadDaySchedule.controller.js` _Controller_
- `vportPublicBooking.controller.js` _Controller_

**Full call chain to screen:**

```
`vportServices.read.dal.js` → `listVportServicesForProfile.controller.js` → `useQuickBookingModal.js` → `QuickBookingModal.jsx` → `VportDashboardBookingHistoryScreen.jsx`
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
`insertVportBooking.write.dal.js` → `createOwnerBooking.controller.js` → `useQuickBookingModal.js` → `QuickBookingModal.jsx` → `VportDashboardBookingHistoryScreen.jsx`
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

---

## Architecture Pipeline

Full build order for this feature — `DAL → Model → Controller → Hook → Components → View Screen → Final Screen`

| Layer | Status | Files |
|---|---|---|
| **DAL** | ✓ PRESENT | _(documented above)_ |
| **Model** | ✓ PRESENT | `flyerDraft.model.js`, `designStudioMapper.model.js`, `designStudioScene.model.js`, `flyerDraft.model.js`, `printableQrSheet.model.js`, `vportActorMenuFlyerView.model.js` +7 more |
| **Controller** | ✓ PRESENT | `flyerEditor.controller.js`, `designStudio.assetsExports.controller.js`, `designStudio.controller.js`, `designStudio.load.controller.js`, `designStudio.pages.controller.js`, `designStudio.shared.controller.js` +17 more |
| **Adapter** | ✓ PRESENT | `VportBackButton.adapter.js`, `useDesktopBreakpoint.adapter.js`, `qrcode.adapter.js`, `vport.adapter.js` |
| **Service** | ✗ MISSING | — |
| **Hook** | ✓ PRESENT | `useCanvasInteraction.js`, `useDesignStudio.js`, `useDesignStudioExports.js`, `useDesignStudioSceneActions.js`, `useFlyerEditor.js`, `useAcceptBarbershopInvite.js` +21 more |
| **Component** | ✓ PRESENT | `FlyerBuilderShell.jsx`, `FlyerEditorPanel.jsx`, `FlyerHoursTable.jsx`, `ImageDropzone.jsx`, `PrintableQrFlyerCard.jsx`, `PrintableQrSheet.jsx` +30 more |
| **View Screen** | ✓ PRESENT | `VportDesignStudioViewScreen.jsx`, `VportActorMenuFlyerView.jsx`, `TodayView.jsx`, `ScheduleOperationalView.jsx` |
| **Final Screen** | ✓ PRESENT | `VportActorMenuFlyerEditorScreen.jsx`, `VportActorMenuFlyerScreen.jsx`, `BarberTeamRequestsScreen.jsx`, `VportDashboardBookingHistoryScreen.jsx`, `VportDashboardCalendarScreen.jsx`, `VportDashboardExchangeScreen.jsx` +11 more |

### Model

_Pure transforms — no side effects, no DB access_

- `features/dashboard/flyerBuilder/dal/flyerDraft.model.js`
- `features/dashboard/flyerBuilder/designStudio/model/designStudioMapper.model.js`
- `features/dashboard/flyerBuilder/designStudio/model/designStudioScene.model.js`
- `features/dashboard/flyerBuilder/model/flyerDraft.model.js`
- `features/dashboard/flyerBuilder/model/printableQrSheet.model.js`
- `features/dashboard/flyerBuilder/model/vportActorMenuFlyerView.model.js`
- `features/dashboard/vport/model/dashboardVportDetails.model.js`
- `features/dashboard/vport/model/vportAvailabilityRule.model.js`
- `features/dashboard/vport/model/vportBooking.model.js`
- `features/dashboard/vport/model/vportSettingsDraft.model.js`
- `features/dashboard/vport/screens/model/buildDashboardCards.model.js`
- `features/dashboard/vport/screens/model/dashboardViewByVportType.model.js`
- `features/dashboard/vport/screens/vportDashboardLeadsScreen.model.js`

### Controller

_Business rules, ownership, permissions — no React_

- `features/dashboard/flyerBuilder/controller/flyerEditor.controller.js`
- `features/dashboard/flyerBuilder/designStudio/controller/designStudio.assetsExports.controller.js`
- `features/dashboard/flyerBuilder/designStudio/controller/designStudio.controller.js`
- `features/dashboard/flyerBuilder/designStudio/controller/designStudio.load.controller.js`
- `features/dashboard/flyerBuilder/designStudio/controller/designStudio.pages.controller.js`
- `features/dashboard/flyerBuilder/designStudio/controller/designStudio.shared.controller.js`
- `features/dashboard/vport/controller/addPortfolioMediaWithRecord.controller.js`
- `features/dashboard/vport/controller/checkVportOwnership.controller.js`
- `features/dashboard/vport/controller/createOwnerBooking.controller.js`
- `features/dashboard/vport/controller/ensureVportOwnerResource.controller.js`
- `features/dashboard/vport/controller/listVportBookingHistory.controller.js`
- `features/dashboard/vport/controller/listVportServicesForProfile.controller.js`
- `features/dashboard/vport/controller/loadDaySchedule.controller.js`
- `features/dashboard/vport/controller/manageVportAvailabilityRule.controller.js`
- `features/dashboard/vport/controller/probeVportPortfolio.controller.js`
- `features/dashboard/vport/controller/saveVportPublicDetailsByActorId.controller.js`
- `features/dashboard/vport/controller/updateVportBooking.controller.js`
- `features/dashboard/vport/controller/vportLeads.controller.js`
- `features/dashboard/vport/controller/vportOwnerStats.controller.js`
- `features/dashboard/vport/controller/vportPublicBooking.controller.js`
- `features/dashboard/vport/controller/vportTeam.controller.js`
- `features/dashboard/vport/controller/vportTeamAccess.controller.js`
- `features/dashboard/vport/controller/vportTeamInvite.controller.js`

### Adapter

_Cross-feature boundary — only approved cross-feature access point_

- `features/dashboard/adapters/vport/screens/components/VportBackButton.adapter.js`
- `features/dashboard/adapters/vport/screens/useDesktopBreakpoint.adapter.js`
- `features/dashboard/qrcode/adapters/qrcode.adapter.js`
- `features/dashboard/vport/adapters/vport.adapter.js`

### Hook

_Lifecycle / timing / state wiring — no business rules_

- `features/dashboard/flyerBuilder/designStudio/components/canvasStage/useCanvasInteraction.js`
- `features/dashboard/flyerBuilder/designStudio/hooks/useDesignStudio.js`
- `features/dashboard/flyerBuilder/designStudio/hooks/useDesignStudioExports.js`
- `features/dashboard/flyerBuilder/designStudio/hooks/useDesignStudioSceneActions.js`
- `features/dashboard/flyerBuilder/hooks/useFlyerEditor.js`
- `features/dashboard/vport/hooks/useAcceptBarbershopInvite.js`
- `features/dashboard/vport/hooks/useBarberTeamRequests.js`
- `features/dashboard/vport/hooks/useOwnerQuickStats.js`
- `features/dashboard/vport/hooks/useQuickBookingModal.js`
- `features/dashboard/vport/hooks/useSaveVportPublicDetailsByActorId.js`
- `features/dashboard/vport/hooks/useVportBookingActions.js`
- `features/dashboard/vport/hooks/useVportBookingHistory.js`
- `features/dashboard/vport/hooks/useVportBookingOps.js`
- `features/dashboard/vport/hooks/useVportEnsureResource.js`
- `features/dashboard/vport/hooks/useVportLeads.js`
- `features/dashboard/vport/hooks/useVportManageAvailability.js`
- `features/dashboard/vport/hooks/useVportNewLeadsCount.js`
- `features/dashboard/vport/hooks/useVportOwnerResources.js`
- `features/dashboard/vport/hooks/useVportOwnerSchedule.js`
- `features/dashboard/vport/hooks/useVportOwnership.js`
- `features/dashboard/vport/hooks/useVportPortfolioProbe.js`
- `features/dashboard/vport/hooks/useVportResourceAvailability.js`
- `features/dashboard/vport/hooks/useVportTeam.js`
- `features/dashboard/vport/hooks/useVportTeamAccess.js`
- `features/dashboard/vport/screens/components/portfolio/hooks/usePortfolioItemSubmit.js`
- `features/dashboard/vport/screens/components/portfolio/hooks/usePortfolioMediaUpload.js`
- `features/dashboard/vport/screens/useDesktopBreakpoint.js`

### Component

_Presentational only — no hooks, no data fetching_

- `features/dashboard/flyerBuilder/components/FlyerBuilderShell.jsx`
- `features/dashboard/flyerBuilder/components/FlyerEditorPanel.jsx`
- `features/dashboard/flyerBuilder/components/FlyerHoursTable.jsx`
- `features/dashboard/flyerBuilder/components/ImageDropzone.jsx`
- `features/dashboard/flyerBuilder/components/printableQr/PrintableQrFlyerCard.jsx`
- `features/dashboard/flyerBuilder/components/printableQr/PrintableQrSheet.jsx`
- `features/dashboard/flyerBuilder/designStudio/components/DesignStudioCanvasStage.jsx`
- `features/dashboard/flyerBuilder/designStudio/components/DesignStudioExportsPanel.jsx`
- `features/dashboard/flyerBuilder/designStudio/components/DesignStudioPagesRail.jsx`
- `features/dashboard/flyerBuilder/designStudio/components/DesignStudioSidebarLeft.jsx`
- `features/dashboard/flyerBuilder/designStudio/components/DesignStudioSidebarRight.jsx`
- `features/dashboard/flyerBuilder/designStudio/components/DesignStudioTopBar.jsx`
- `features/dashboard/flyerBuilder/designStudio/components/canvasStage/CanvasNode.jsx`
- `features/dashboard/flyerBuilder/designStudio/components/canvasStage/CanvasRulers.jsx`
- `features/dashboard/flyerBuilder/designStudio/components/canvasStage/DesignStudioNodeBody.jsx`
- `features/dashboard/flyerBuilder/designStudio/components/sidebarRight/DesignStudioInlineColorPicker.jsx`
- `features/dashboard/flyerBuilder/designStudio/components/sidebarRight/DesignStudioSidebarLayersSection.jsx`
- `features/dashboard/flyerBuilder/designStudio/components/sidebarRight/DesignStudioSidebarPageSection.jsx`
- `features/dashboard/flyerBuilder/designStudio/components/sidebarRight/DesignStudioSidebarSelectionSection.jsx`
- `features/dashboard/flyerBuilder/designStudio/components/topBar/DesignStudioTextColorPicker.jsx`
- `features/dashboard/qrcode/components/QrCard.jsx`
- `features/dashboard/qrcode/components/QrCode.jsx`
- `features/dashboard/qrcode/components/flyer/ClassicFlyer.jsx`
- `features/dashboard/qrcode/components/flyer/PosterFlyer.jsx`
- `features/dashboard/vport/components/VportLeadsChip.jsx`
- `features/dashboard/vport/components/bookingHistory/BookingCard.jsx`
- `features/dashboard/vport/components/bookingHistory/OperationalBookingCard.jsx`
- `features/dashboard/vport/components/bookingHistory/QuickBookingModal.jsx`
- `features/dashboard/vport/components/calendar/DayBody.jsx`
- `features/dashboard/vport/components/calendar/DayHeader.jsx`
- `features/dashboard/vport/components/calendar/RangeToggle.jsx`
- `features/dashboard/vport/components/calendar/ResourceDropdown.jsx`
- `features/dashboard/vport/components/calendar/TimeBlock.jsx`
- `features/dashboard/vport/components/calendar/TimeLabelsColumn.jsx`
- `features/dashboard/vport/components/calendar/WeeklyAvailabilityGrid.jsx`
- `features/dashboard/vport/components/calendar/WorkingHoursDayCard.jsx`

### View Screen

_Hooks + component composition — no business logic_

- `features/dashboard/flyerBuilder/designStudio/screens/VportDesignStudioViewScreen.jsx`
- `features/dashboard/flyerBuilder/screens/VportActorMenuFlyerView.jsx`
- `features/dashboard/vport/components/bookingHistory/TodayView.jsx`
- `features/dashboard/vport/screens/components/schedule/ScheduleOperationalView.jsx`

### Final Screen

_Route entry + identity gate only — no computation_

- `features/dashboard/flyerBuilder/screens/VportActorMenuFlyerEditorScreen.jsx`
- `features/dashboard/flyerBuilder/screens/VportActorMenuFlyerScreen.jsx`
- `features/dashboard/vport/screens/BarberTeamRequestsScreen.jsx`
- `features/dashboard/vport/screens/VportDashboardBookingHistoryScreen.jsx`
- `features/dashboard/vport/screens/VportDashboardCalendarScreen.jsx`
- `features/dashboard/vport/screens/VportDashboardExchangeScreen.jsx`
- `features/dashboard/vport/screens/VportDashboardGasScreen.jsx`
- `features/dashboard/vport/screens/VportDashboardLeadsScreen.jsx`
- `features/dashboard/vport/screens/VportDashboardLocksmithScreen.jsx`
- `features/dashboard/vport/screens/VportDashboardPortfolioScreen.jsx`
- `features/dashboard/vport/screens/VportDashboardReviewScreen.jsx`
- `features/dashboard/vport/screens/VportDashboardScheduleScreen.jsx`
- `features/dashboard/vport/screens/VportDashboardScreen.jsx`
- `features/dashboard/vport/screens/VportDashboardServicesScreen.jsx`
- `features/dashboard/vport/screens/VportDashboardTeamScreen.jsx`
- `features/dashboard/vport/screens/VportSettingsScreen.jsx`
- `features/dashboard/vport/screens/components/locksmithScreenComponents.jsx`

### Missing Layers

- 🟡 **Service** — not detected in static scan

> Missing layers may exist but use naming patterns not detected by static scan, or may be delegated to engines.

---

## Dead Code Audit

_Audited:_ 2026-05-11  
_Method:_ Static import trace — grep across all `.js`/`.jsx` in `apps/VCSM/src/`  
_Auditor:_ ARCHITECT

---

### Dead Code Finding #1 — `flyer.read.dal.js`

**File:** `features/dashboard/flyerBuilder/dal/flyer.read.dal.js`  
**Function:** `fetchFlyerPublicDetailsByActorId`  
**Classification:** CONFIRMED DEAD  

**Evidence:**
- Zero import references found anywhere in `apps/VCSM/src/`
- `flyerEditor.controller.js` only imports from `flyer.write.dal.js` — no read import
- `useFlyerEditor.js` receives `draft` as a prop — no load path exists for this DAL
- Reads `vc.actors` joining `vports` + `vport_public_details` — touches live schema but is never called

**Risk:** LOW — orphaned, no runtime harm. Delete candidate once IRONMAN confirms no planned wiring.  
**Recommended action:** DELETE CANDIDATE  
**Handoffs:** IRONMAN (confirm no planned wiring), LOGAN (correct exported function count)

---

### Dead Code Finding #2 — `dal/flyerDraft.model.js`

**File:** `features/dashboard/flyerBuilder/dal/flyerDraft.model.js`  
**Functions:** `makeFlyerDraftFromPublicDetails`, `mergeDraft`  
**Classification:** CONFIRMED DEAD + LAYER VIOLATION  

**Evidence:**
- Zero import references found anywhere in `apps/VCSM/src/`
- A canonical duplicate exists at `features/dashboard/flyerBuilder/model/flyerDraft.model.js` — also uncalled
- The `dal/` copy is a **layer violation** — model files must not live in `dal/` directories
- The two copies have divergent `hours` logic:
  - `dal/` copy: correctly guards `typeof === 'object' && !Array.isArray`
  - `model/` copy: uses `pd.hours ?? ""` (weaker)

**Risk:** MEDIUM — two divergent copies of the same model, neither wired. Risk of someone wiring the wrong copy when the flyer read path is built.  
**Recommended action:** DELETE `dal/flyerDraft.model.js` (misplaced duplicate). Wire `model/flyerDraft.model.js` when read path is built — but first apply the `hours` guard from the `dal/` copy.  
**Handoffs:** LOGAN (fix model count in doc), IRONMAN (confirm canonical copy and read path plan)

---

### Dead Code Finding #3 — `vportProfileActorAccess.write.dal.js`

**File:** `features/dashboard/vport/dal/write/vportProfileActorAccess.write.dal.js`  
**Functions:** `upsertProfileActorAccessDAL`, `updateProfileActorAccessRoleDAL`, `updateProfileActorAccessStatusDAL`, `deleteProfileActorAccessDAL`  
**Classification:** CONFIRMED DEAD + IDENTITY CONTRACT VIOLATION  

**Evidence:**
- Zero import references found anywhere in `apps/VCSM/src/`
- READ counterpart (`vportProfileActorAccess.read.dal.js`) IS live — called by `probeVportPortfolio.controller.js`
- Imports from `@/services/supabase/vportClient` instead of `supabaseClient`
- All functions scoped by `profileId` — **direct violation of the actor-based identity contract**; write operations on `profile_actor_access` must use `actorId` scoping

**Risk:** HIGH — if wired without fixing identity scoping, bypasses the actor contract. The write path for `profile_actor_access` is currently **missing entirely**.  
**Recommended action:** VERIFY USAGE. If no planned caller, DELETE CANDIDATE. If the write path is needed, rebuild using `actorId` scoping.  
**Handoffs:** VENOM (`profileId` scoping on a write path = identity contract breach), IRONMAN (ownership + plan confirmation)

---

### Additional Finding — Layer Violation (fixed 2026-05-11)

**Location:** `features/dashboard/vport/dal/read/vportServices.read.dal.js` was imported by `QuickBookingModal.jsx`  
**Pattern:** Component calling DAL directly — bypassed controller and hook layers  
**Classification:** HIGH — fixed  
**Resolution:** `QuickBookingModal.jsx` now uses `useQuickBookingModal.js`; service loading is routed through `listVportServicesForProfile.controller.js`.  
**Handoffs:** None for this fixed path.

---

### Deletion Candidate Safety Check

| Candidate | Imports Clear | Routes Clear | Dynamic Refs Clear | Status |
|---|:---:|:---:|:---:|---|
| `flyer.read.dal.js` | YES | YES | YES | DELETE CANDIDATE — pending IRONMAN confirm |
| `dal/flyerDraft.model.js` | YES | YES | YES | DELETE CANDIDATE — misplaced duplicate |
| `vportProfileActorAccess.write.dal.js` | YES | YES | YES | DELETE CANDIDATE — pending VENOM + IRONMAN review |
| `useAcceptBarbershopInvite.js` | YES | YES | YES | DELETE CANDIDATE — pending IRONMAN review |

---

### Audit Summary

| Finding | Classification | Priority |
|---|---|---|
| `flyer.read.dal.js` — unused read DAL, no wired load path | CONFIRMED DEAD | P1 |
| `dal/flyerDraft.model.js` — misplaced model duplicate | CONFIRMED DEAD + LAYER VIOLATION | P1 |
| `vportProfileActorAccess.write.dal.js` — 4 write fns, no callers, `profileId` scoping | CONFIRMED DEAD + IDENTITY VIOLATION | P0 |
| `QuickBookingModal.jsx` importing DAL directly | FIXED | P1 |
| `useAcceptBarbershopInvite.js` — exported hook with zero callers | DELETE CANDIDATE | P2 |

**Confirmed dead exported functions: 6**  
**Doc exported function count requires correction:** was 71, active count is ≤ 65

---

## Layer Consumer Map

_Audited:_ 2026-05-11  
_Method:_ Static import trace — full upward traversal from each DAL file through Controller → Hook → Screen  
_Auditor:_ ARCHITECT

---

### DAL → Controller (direct importers of each DAL file)

| DAL File | Controllers That Import It |
|---|---|
| `designStudio.auth.dal.js` | `designStudio.shared.controller.js` |
| `designStudio.read.dal.js` | `designStudio.assetsExports.controller.js`, `designStudio.load.controller.js`, `designStudio.pages.controller.js`, `designStudio.shared.controller.js` |
| `designStudio.write.dal.js` | `designStudio.assetsExports.controller.js`, `designStudio.load.controller.js`, `designStudio.pages.controller.js` |
| `actorOwners.read.dal.js` | `probeVportPortfolio.controller.js` |
| `actorVport.read.dal.js` | `vportPublicBooking.controller.js` |
| `flyer.read.dal.js` | _(none — DEAD)_ |
| `flyer.write.dal.js` | `flyerEditor.controller.js` |
| `insertVportBooking.write.dal.js` | `createOwnerBooking.controller.js`, `vportPublicBooking.controller.js` |
| `listVportBookingsForProfileDay.read.dal.js` | `loadDaySchedule.controller.js`, `vportOwnerStats.controller.js` |
| `portfolioMediaRecord.write.dal.js` | `addPortfolioMediaWithRecord.controller.js` |
| `updateVportBooking.write.dal.js` | `updateVportBooking.controller.js` |
| `vportAvailabilityRules.read.dal.js` | `loadDaySchedule.controller.js`, `vportPublicBooking.controller.js` |
| `vportAvailabilityRules.write.dal.js` | `manageVportAvailabilityRule.controller.js` |
| `vportBookingById.read.dal.js` | `updateVportBooking.controller.js` |
| `vportBookingHistory.read.dal.js` | `listVportBookingHistory.controller.js` |
| `vportBookingsInRange.read.dal.js` | `updateVportBooking.controller.js`, `vportPublicBooking.controller.js` |
| `vportCities.read.dal.js` | `saveVportPublicDetailsByActorId.controller.js` |
| `vportLeads.read.dal.js` | `vportLeads.controller.js` |
| `vportLeads.write.dal.js` | `vportLeads.controller.js` |
| `vportProfile.read.dal.js` | `createOwnerBooking.controller.js`, `ensureVportOwnerResource.controller.js`, `loadDaySchedule.controller.js`, `probeVportPortfolio.controller.js`, `saveVportPublicDetailsByActorId.controller.js`, `updateVportBooking.controller.js`, `vportLeads.controller.js`, `vportOwnerStats.controller.js`, `vportPublicBooking.controller.js`, `vportTeam.controller.js`, `vportTeamAccess.controller.js`, `vportTeamInvite.controller.js` |
| `vportProfileActorAccess.read.dal.js` | `probeVportPortfolio.controller.js` |
| `vportProfileActorAccess.write.dal.js` | _(none — DEAD)_ |
| `vportPublicDetails.write.dal.js` | `saveVportPublicDetailsByActorId.controller.js` |
| `vportResource.read.dal.js` | `createOwnerBooking.controller.js`, `ensureVportOwnerResource.controller.js`, `loadDaySchedule.controller.js`, `vportPublicBooking.controller.js` |
| `vportResource.write.dal.js` | `ensureVportOwnerResource.controller.js` |
| `vportServices.read.dal.js` | `listVportServicesForProfile.controller.js`, `loadDaySchedule.controller.js`, `vportPublicBooking.controller.js` |
| `vportTeam.read.dal.js` | `vportOwnerStats.controller.js`, `vportTeam.controller.js`, `vportTeamAccess.controller.js` |
| `vportTeam.write.dal.js` | `vportTeam.controller.js`, `vportTeamAccess.controller.js` |
| `vportTeamInvite.read.dal.js` | `vportTeam.controller.js`, `vportTeamInvite.controller.js` |
| `vportTeamInvite.write.dal.js` | `vportTeam.controller.js`, `vportTeamInvite.controller.js` |

---

### Controller → Hook (which hooks call each controller)

| Controller | Hooks That Import It |
|---|---|
| `designStudio.controller.js` | `useDesignStudio.js`, `useDesignStudioExports.js` |
| `designStudio.assetsExports.controller.js` | _(called via `designStudio.controller.js` only)_ |
| `designStudio.load.controller.js` | _(called via `designStudio.controller.js` only)_ |
| `designStudio.pages.controller.js` | _(called via `designStudio.controller.js` only)_ |
| `designStudio.shared.controller.js` | _(called internally by other designStudio controllers)_ |
| `flyerEditor.controller.js` | `useFlyerEditor.js` |
| `addPortfolioMediaWithRecord.controller.js` | `usePortfolioItemSubmit.js` |
| `checkVportOwnership.controller.js` | `useVportOwnership.js` |
| `createOwnerBooking.controller.js` | `useQuickBookingModal.js`, `useVportOwnerSchedule.js` |
| `ensureVportOwnerResource.controller.js` | `useVportEnsureResource.js` |
| `listVportBookingHistory.controller.js` | `useVportBookingHistory.js` |
| `loadDaySchedule.controller.js` | `useVportOwnerSchedule.js` |
| `manageVportAvailabilityRule.controller.js` | `useVportManageAvailability.js` |
| `probeVportPortfolio.controller.js` | `useVportPortfolioProbe.js` |
| `saveVportPublicDetailsByActorId.controller.js` | `useSaveVportPublicDetailsByActorId.js` |
| `updateVportBooking.controller.js` | `useVportBookingActions.js`, `useVportOwnerSchedule.js` |
| `vportLeads.controller.js` | `useVportLeads.js`, `useVportNewLeadsCount.js` |
| `vportOwnerStats.controller.js` | `useOwnerQuickStats.js` |
| `vportPublicBooking.controller.js` | `useVportBookingOps.js`, `useVportOwnerResources.js`, `useVportResourceAvailability.js` |
| `vportTeam.controller.js` | `useVportTeam.js` |
| `vportTeamAccess.controller.js` | `useVportTeamAccess.js` |
| `vportTeamInvite.controller.js` | `useAcceptBarbershopInvite.js`, `useBarberTeamRequests.js` |

---

### Hook → Adapter → Screen

Three hooks are re-exported through `vport.adapter.js` before reaching screens:

| Hook | Path to Screen |
|---|---|
| `useOwnerQuickStats.js` | → `vport.adapter.js` → `VportActorMenuFlyerView.jsx`, `VportBarberShopBookingView.jsx`, `VportBarberShopTeamView.jsx` |
| `useVportBookingOps.js` | → `vport.adapter.js` → `VportActorMenuFlyerView.jsx`, `VportBarberShopBookingView.jsx` |
| `useVportTeam.js` | → `vport.adapter.js` → `VportActorMenuFlyerView.jsx`, `VportBarberShopBookingView.jsx`, `VportBarberShopTeamView.jsx` |

---

### Hook → Screen (direct, no adapter)

| Hook | Screens That Import It |
|---|---|
| `useDesignStudio.js` | `VportDesignStudioViewScreen.jsx` |
| `useDesignStudioExports.js` | _(consumed inside `useDesignStudio.js`)_ |
| `useDesignStudioSceneActions.js` | _(consumed inside `useDesignStudio.js`)_ |
| `useFlyerEditor.js` | `FlyerEditorPanel.jsx` (component) |
| `usePortfolioItemSubmit.js` | `PortfolioItemForm.jsx` (component) → `VportDashboardPortfolioScreen.jsx` |
| `usePortfolioMediaUpload.js` | `PortfolioItemForm.jsx` (component) → `VportDashboardPortfolioScreen.jsx` |
| `useVportOwnership.js` | `VportDashboardScreen.jsx` |
| `useVportBookingHistory.js` | `VportDashboardBookingHistoryScreen.jsx` |
| `useVportBookingActions.js` | `VportDashboardBookingHistoryScreen.jsx` |
| `useVportOwnerResources.js` | `VportDashboardBookingHistoryScreen.jsx`, `VportDashboardCalendarScreen.jsx` |
| `useVportResourceAvailability.js` | `VportDashboardCalendarScreen.jsx` |
| `useVportManageAvailability.js` | `VportDashboardCalendarScreen.jsx` |
| `useVportEnsureResource.js` | `VportDashboardCalendarScreen.jsx` |
| `useVportLeads.js` | `VportDashboardLeadsScreen.jsx` |
| `useVportNewLeadsCount.js` | `VportLeadsChip.jsx` (component) |
| `useVportOwnerSchedule.js` | `VportDashboardScheduleScreen.jsx` |
| `useVportTeamAccess.js` | `VportDashboardTeamScreen.jsx` |
| `useSaveVportPublicDetailsByActorId.js` | `VportSettingsScreen.jsx` |
| `useBarberTeamRequests.js` | `BarberTeamRequestsScreen.jsx` |
| `useAcceptBarbershopInvite.js` | _(no production caller detected — DELETE CANDIDATE pending IRONMAN)_ |
| `useQuickBookingModal.js` | `QuickBookingModal.jsx` (component) → `VportDashboardBookingHistoryScreen.jsx` |
| `useVportPortfolioProbe.js` | `PortfolioBugsBunnyPanel.jsx` (dev-only component) → `VportDashboardPortfolioScreen.jsx` |

---

### Model Consumers

| Model | Consumed By | Layer |
|---|---|---|
| `designStudioMapper.model.js` | `designStudio.assetsExports.controller.js`, `designStudio.load.controller.js`, `designStudio.pages.controller.js` | Controller |
| `designStudioScene.model.js` | `designStudio.load.controller.js`, `designStudio.pages.controller.js`, `designStudioMapper.model.js`, `useDesignStudioSceneActions.js` | Controller + Hook |
| `printableQrSheet.model.js` | `PrintableQrFlyerCard.jsx`, `PrintableQrSheet.jsx` | Component |
| `vportActorMenuFlyerView.model.js` | `VportActorMenuFlyerView.jsx` | View Screen |
| `dashboardVportDetails.model.js` | `VportActorMenuFlyerView.jsx`, `VportDashboardScreen.jsx`, `VportSettingsScreen.jsx`, `vportSettingsDraft.model.js` | View Screen + Final Screen |
| `vportAvailabilityRule.model.js` | `useVportResourceAvailability.js`, `vport.adapter.js` | Hook + Adapter |
| `vportBooking.model.js` | `useVportBookingHistory.js` | Hook |
| `vportSettingsDraft.model.js` | `VportSettingsScreen.jsx` | Final Screen |
| `buildDashboardCards.model.js` | `VportDashboardScreen.jsx` | Final Screen |
| `dashboardViewByVportType.model.js` | `VportDashboardScreen.jsx`, `VportSettingsScreen.jsx`, `buildDashboardCards.model.js` | Final Screen + Model |
| `vportDashboardLeadsScreen.model.js` | `VportDashboardLeadsScreen.jsx` | Final Screen |
| `flyerDraft.model.js` (model/) | _(no import detected — DEAD, see Dead Code Audit above)_ | DEAD |

---

### Cross-Feature Notes

| Finding | File | Risk |
|---|---|---|
| `vportAvailabilityRule.model.js` imported by `features/profiles/kinds/vport/screens/booking/hooks/useVportPublicBooking.js` | FIXED — profiles now imports `mapAvailabilityRule` through `features/dashboard/vport/adapters/vport.adapter.js` | Adapter boundary restored |
| `QuickBookingModal.jsx` imports `vportServices.read.dal.js` directly | FIXED — component now uses `useQuickBookingModal.js`; DAL access is controller-owned | Component → Hook → Controller → DAL |
| `PortfolioBugsBunnyPanel.jsx` imports `probeVportPortfolio.controller.js` directly | FIXED — component now uses `useVportPortfolioProbe.js` | Component → Hook → Controller |

---

### Screen Coverage Summary

| Final Screen | Hooks Consumed | Controllers Behind It | DAL Files Touched |
|---|---|---|---|
| `VportDashboardScreen.jsx` | `useVportOwnership` | `checkVportOwnership.controller` | _(indirect via identity — no direct dashboard DAL)_ |
| `VportDashboardBookingHistoryScreen.jsx` | `useVportOwnerResources`, `useVportBookingHistory`, `useVportBookingActions` | `vportPublicBooking`, `listVportBookingHistory`, `updateVportBooking`, `createOwnerBooking` | `actorVport`, `vportProfile`, `vportResource`, `vportBookingHistory`, `vportBookingById`, `vportBookingsInRange`, `insertVportBooking`, `updateVportBooking`, `listVportBookingsForProfileDay`, `vportAvailabilityRules.read` |
| `VportDashboardCalendarScreen.jsx` | `useVportOwnerResources`, `useVportResourceAvailability`, `useVportManageAvailability`, `useVportEnsureResource` | `vportPublicBooking`, `manageVportAvailabilityRule`, `ensureVportOwnerResource` | `actorVport`, `vportProfile`, `vportResource`, `vportBookingsInRange`, `vportAvailabilityRules.read/write`, `insertVportBooking` |
| `VportDashboardScheduleScreen.jsx` | `useVportOwnerSchedule` | `loadDaySchedule`, `createOwnerBooking`, `updateVportBooking` | `vportProfile`, `vportResource`, `vportAvailabilityRules.read`, `listVportBookingsForProfileDay`, `vportServices.read`, `vportBookingById`, `vportBookingsInRange`, `insertVportBooking`, `updateVportBooking` |
| `VportDashboardLeadsScreen.jsx` | `useVportLeads` | `vportLeads` | `vportProfile`, `vportLeads.read/write` |
| `VportDashboardTeamScreen.jsx` | `useVportTeamAccess` | `vportTeamAccess` | `vportProfile`, `vportTeam.read/write` |
| `VportDashboardPortfolioScreen.jsx` | `usePortfolioItemSubmit` | `addPortfolioMediaWithRecord`, `probeVportPortfolio` | `actorOwners`, `vportProfile`, `vportProfileActorAccess.read`, `portfolioMediaRecord.write` |
| `VportSettingsScreen.jsx` | `useSaveVportPublicDetailsByActorId` | `saveVportPublicDetailsByActorId` | `vportProfile`, `vportCities`, `vportPublicDetails.write` |
| `BarberTeamRequestsScreen.jsx` | `useBarberTeamRequests` | `vportTeamInvite` | `vportTeamInvite.read/write` |
| `VportDesignStudioViewScreen.jsx` | `useDesignStudio` | `designStudio.controller` (aggregates 4 sub-controllers) | `designStudio.auth`, `designStudio.read`, `designStudio.write` |
| `VportActorMenuFlyerView.jsx` (View Screen) | `useOwnerQuickStats`, `useVportBookingOps`, `useVportTeam` (via adapter) | `vportOwnerStats`, `vportPublicBooking`, `vportTeam` | `vportProfile`, `vportTeam.read`, `listVportBookingsForProfileDay`, `actorVport`, `vportResource`, `vportBookingsInRange`, `vportAvailabilityRules.read`, `insertVportBooking`, `vportTeamInvite.read/write` |

---

---

# Avengers Assembly Report — 2026-05-11

**Scope:** `apps/VCSM/src/features/dashboard/` — DAL documentation audit  
**Triggered by:** `/AvengersAssemble vcsm.dal.dashboard.md`  
**Boundary:** VCSM (read-only)  
**Commands run:** ARCHITECT · VENOM · SENTRY (review-contract) · LOGAN

---

## Governance Evidence Registry

| Command | Status | Drift | Blocking |
|---|---|---|---|
| ARCHITECT | PRESENT | MINOR | No |
| VENOM | PRESENT | MODERATE | Conditional |
| SENTRY / review-contract | PRESENT | HIGH | Yes (live violations) |
| LOGAN | PRESENT | MINOR | No |
| IRONMAN | N/A — doc-scope run | — | — |
| LOKI | N/A — doc-scope run | — | — |
| KRAVEN | N/A — doc-scope run | — | — |
| CARNAGE | PENDING — P0 dead code + profileId violations require migration review | — | Yes |
| FALCON | N/A — no native surface | — | — |
| WINTER SOLDIER | N/A — no native surface | — | — |
| SHIELD | N/A — doc-scope run | — | — |

---

## ARCHITECT

**Status: MINOR DRIFT FOUND**

Verified against live filesystem and source code.

**ALIGNED:**
- DAL file count: **30** — exactly matches document summary ✓
- All DAL files listed in document are confirmed present on disk ✓
- No new DAL files exist that are missing from the document ✓
- No `select('*')` violations found across all 30 DAL files ✓
- Dead code findings #1, #2, #3 all confirmed — zero callers verified
- Layer consumer map and controller consumer map confirmed accurate ✓
- All final screens listed are confirmed to exist ✓
- Cross-feature import (`vportAvailabilityRule.model.js` → `profiles` feature) confirmed at `features/profiles/kinds/vport/screens/booking/hooks/useVportPublicBooking.js:18` ✓

**DRIFT:**

1. **`designStudio.auth.dal.js` operation classification** — Corrected 2026-05-11. The DAL calls `supabase.auth.getUser()` — this is an **Auth API call**, not a DB table query. Classification is now `auth (supabase.auth.getUser)`. Tables accessed column remains correctly blank (`—`).

2. **`useAcceptBarbershopInvite` hook has no screen consumer** — Corrected 2026-05-11. Live code search across all of `apps/VCSM/src/` returns zero callers for the hook export. There is no screen, route, or hook that imports `useAcceptBarbershopInvite`. It is now documented as a **DELETE CANDIDATE** pending IRONMAN review.

---

## VENOM

**Status: MODERATE — Identity violation confirmed, no new XSS/injection vectors**

**ALIGNED:**
- No `select('*')` in any DAL — all selects use explicit column lists ✓
- `insertVportBooking.write.dal.js` uses `profile_id` as a required booking field — this is domain-correct; `profile_id` here refers to the VPORT being booked, not the caller's identity. Not an identity contract violation.
- Booking-related DALs consistently use `vportClient`, which is appropriate for VPORT-schema operations ✓

**CONFIRMED VIOLATION — already documented:**
- **`vportProfileActorAccess.write.dal.js`** (Dead Code Finding #3) — confirmed as zero-caller, `profileId`-scoped, and using `vportClient`. All four write functions scope by `profile_id` instead of `actorId`. If wired without fixing, this DAL would grant writes to `profile_actor_access` based on `profileId` — bypassing the actor identity contract. Deletion or rebuild before any wiring is mandatory.

**NEW FINDING — VENOM-1:**
- `designStudio.auth.dal.js` calls `supabase.auth.getUser()` then returns `data?.user?.id`. This raw `userId` is returned from the DAL and used by `designStudio.shared.controller.js`. The operation label is now corrected to `auth (supabase.auth.getUser)`, but the identity concern remains: if `dalReadAuthenticatedUserId()` is used as an authorization gate or ownership check within the design studio, it is checking `userId` identity, not actor identity — inconsistent with VCSM's actor-based contract. Requires SENTRY review of `designStudio.shared.controller.js` to confirm how the returned userId is used.

---

## SENTRY / review-contract

**Status: HIGH — Multiple live layer violations confirmed**

All four violations documented in the existing Dead Code Audit and Layer Consumer Map are confirmed in live code:

| Violation | Location | Status | Severity |
|---|---|---|---|
| Component imports DAL directly | `QuickBookingModal.jsx` → `listVportServicesByProfileIdDAL` | **FIXED 2026-05-11** | HIGH |
| Component imports Controller directly | `QuickBookingModal.jsx` → `createOwnerBookingController` | **FIXED 2026-05-11** | HIGH |
| Component imports Controller directly | `PortfolioBugsBunnyPanel.jsx` → `probeVportPortfolioController` | **FIXED 2026-05-11** | MEDIUM |
| Cross-feature model import without adapter | `profiles` feature → `dashboard/vport/model/vportAvailabilityRule.model.js` | **FIXED 2026-05-11** | MEDIUM |
| Misplaced model in dal/ directory | `flyerBuilder/dal/flyerDraft.model.js` | DEAD (but structurally wrong) | MEDIUM |

**Additional contract check:**
- No TypeScript files found in dashboard ✓
- No cross-feature direct imports through anything other than adapters (except confirmed violations above) ✓
- All confirmed controller files follow single-responsibility (no React, no UI concerns) — spot-checked clean ✓

**Outstanding contract gap:**
- `vportProfile.read.dal.js` exposes `getVportActorIdByProfileIdDAL` — this function converts `profileId → actorId`. While a lookup helper, it surfaces `profileId` as an input parameter, which controllers must not use as a routing or scoping key. The function itself is safe (it's a data lookup), but its usage pattern in controllers deserves a SENTRY pass to confirm callers are using the resolved `actorId` and not continuing to route by `profileId`.

---

## LOGAN

**Status: MINOR DRIFT — One confirmed incorrect classification**

**ALIGNED:**
- All three Dead Code Findings (#1, #2, #3) are correctly classified and confirmed ✓
- Summary table (30 DAL files, 71 exported functions, 20 tables, 0 RPCs) matches live state for file and table counts ✓
- Exported function count note is accurate: doc says "active count is ≤ 65" after removing 6 dead exports ✓
- All call chains traced in the document are confirmed correct in live code ✓
- Architecture Pipeline layer table accurately reflects feature structure ✓

**DRIFT:**

1. **`vportDashboardLeadsScreen.model.js` misclassified as dead** — Corrected 2026-05-11. `VportDashboardLeadsScreen.jsx:14` imports directly from `@/features/dashboard/vport/screens/vportDashboardLeadsScreen.model.js`. The model is live and active — it exports `toText`, `formatLeadDate`, `formatSourceLabel`, and `previewMessage`.

2. **`designStudio.auth.dal.js` operation label** — corrected to `auth (supabase.auth.getUser)`.

3. **`useAcceptBarbershopInvite` consumer status** — upgraded to DELETE CANDIDATE pending IRONMAN.

---

## Cross-System Contradictions

| System A | System B | Contradiction | Severity | Resolution |
|---|---|---|---|---|
| LOGAN (vportDashboardLeadsScreen.model.js marked dead) | ARCHITECT (model confirmed live via screen import) | Model is imported by `VportDashboardLeadsScreen.jsx:14` — dead classification is wrong | LOW | Update Model Consumers table: classify as Final Screen consumer |
| VENOM-1 (userId in design studio auth path) | SENTRY (contract requires actorId scoping) | `dalReadAuthenticatedUserId()` returns raw `userId`; unclear if used as auth gate or logging-only | MODERATE | Review `designStudio.shared.controller.js` to confirm userId is not used as identity gate |
| ARCHITECT (useAcceptBarbershopInvite marked "possible hook-to-hook") | LOGAN (same) | Zero callers found in full codebase search — now documented as DELETE CANDIDATE | LOW | Pending IRONMAN |

---

## Runtime Alignment Review

| Area | Evidence | Risk | Status |
|---|---|---|---|
| `insertVportBookingDAL` required fields | Guards: `profile_id`, `resource_id`, `starts_at`, `ends_at`, `timezone`, `service_label_snapshot` | Low — required fields enforced before insert | ALIGNED |
| `vportServices.read.dal.js` via component | `QuickBookingModal.jsx` now uses `useQuickBookingModal.js` and `listVportServicesForProfile.controller.js` | HIGH — fixed by hook/controller routing | FIXED |
| `designStudio.auth.dal.js` | `supabase.auth.getUser()` — auth API call, not DB query | Low — standard Supabase auth read | DRIFT (classification only) |
| Dead write DAL (`vportProfileActorAccess.write.dal.js`) | Zero callers, `profileId`-scoped, wrong client | HIGH if ever wired | CONFIRMED DEAD — do not wire |

---

## Ownership / Boundary Alignment

| Area | Status | Notes |
|---|---|---|
| DAL → Controller boundary | FIXED | `QuickBookingModal` no longer imports DAL directly; service loading routes through `listVportServicesForProfile.controller.js`. |
| Controller → Hook boundary | FIXED | `QuickBookingModal` and `PortfolioBugsBunnyPanel` now reach controllers through hooks. |
| Cross-feature model access | FIXED | `profiles` feature imports `mapAvailabilityRule` through `dashboard/vport/adapters/vport.adapter.js`. |
| Dead write DAL identity scoping | CRITICAL (if wired) | `vportProfileActorAccess.write.dal.js` must be deleted or rebuilt |
| `vportProfile.read.dal.js` profileId exposure | CAUTION | Lookup function is safe, but callers must not route by resolved profileId |

---

## Documentation Truth Review

| Doc/System | Truth Status | Drift | Blocking |
|---|---|---|---|
| DAL file list (30 files) | ALIGNED | None | No |
| Exported function count | ALIGNED | Note on active ≤65 confirmed | No |
| Tables accessed | ALIGNED | None | No |
| Dead Code Findings #1–#3 | ALIGNED | All confirmed | No |
| Layer violation findings | UPDATED | QuickBookingModal, PortfolioBugsBunnyPanel, and profiles model boundary violations fixed 2026-05-11 | No |
| `vportDashboardLeadsScreen.model.js` status | FIXED | Classified as live via `VportDashboardLeadsScreen.jsx` | No |
| `designStudio.auth.dal.js` operation label | FIXED | `auth (supabase.auth.getUser)` | No |
| `useAcceptBarbershopInvite` consumer status | FIXED | Upgraded to DELETE CANDIDATE pending IRONMAN | No |
| Cross-feature notes | UPDATED | Direct profiles → dashboard model import fixed via adapter | No |
| Call chains | ALIGNED | All traced chains confirmed | No |

---

## Proposed Updates

No `.v2.md` required — all drift is additive (wrong classification, not wrong structure). Inline corrections applied 2026-05-11:

1. **Model Consumers table** — `vportDashboardLeadsScreen.model.js` now maps to `VportDashboardLeadsScreen.jsx — Final Screen`.
2. **DAL file entry for `designStudio.auth.dal.js`** — Operations now read `auth (supabase.auth.getUser)`.
3. **Dead Code Audit Summary** — `useAcceptBarbershopInvite` is listed as a fourth DELETE CANDIDATE with P2 priority.
4. **Risk Findings / Pending Reviews** — VENOM-1 remains listed for SENTRY review.

---

## Overall Status

**PARTIAL — DOCUMENTATION DRIFT FIXED; OWNERSHIP REVIEWS REMAIN**

Documentation accuracy: updated. The `vportDashboardLeadsScreen.model.js` live consumer, `designStudio.auth.dal.js` auth operation label, and `useAcceptBarbershopInvite` delete-candidate status have been corrected.

**The four live layer violations (QuickBookingModal → DAL, QuickBookingModal → Controller, PortfolioBugsBunnyPanel → Controller, cross-feature model import) were fixed 2026-05-11 with hook/controller/adapter routing.**

**P0 delete candidate (`vportProfileActorAccess.write.dal.js`) remains unresolved** — must not be wired under any circumstances without full rebuild using actorId scoping.

## Recommended Next Command

```
SENTRY     — review designStudio.shared.controller.js userId usage vs actorId contract
IRONMAN    — confirm useAcceptBarbershopInvite delete candidacy + flyer.read.dal.js plan
CARNAGE    — vportProfileActorAccess write path: delete or rebuild with actorId scoping
```

## Codex Fix Pass — 2026-05-11

### Files Changed

| File | Change |
|---|---|
| `apps/VCSM/src/features/dashboard/vport/controller/listVportServicesForProfile.controller.js` | Added a controller wrapper for VPORT service list reads used by quick booking. |
| `apps/VCSM/src/features/dashboard/vport/hooks/useQuickBookingModal.js` | Added hook-owned service loading and owner-booking creation for `QuickBookingModal.jsx`. |
| `apps/VCSM/src/features/dashboard/vport/components/bookingHistory/QuickBookingModal.jsx` | Removed direct DAL/controller imports; component now uses `useQuickBookingModal.js`. |
| `apps/VCSM/src/features/dashboard/vport/hooks/useVportPortfolioProbe.js` | Added hook wrapper for the dev-only portfolio probe controller and trace store. |
| `apps/VCSM/src/features/dashboard/vport/screens/components/PortfolioBugsBunnyPanel.jsx` | Removed direct controller/import-store usage; component now uses `useVportPortfolioProbe.js`. |
| `apps/VCSM/src/features/dashboard/vport/adapters/vport.adapter.js` | Exported `mapAvailabilityRule` through the dashboard adapter boundary. |
| `apps/VCSM/src/features/profiles/kinds/vport/screens/booking/hooks/useVportPublicBooking.js` | Replaced direct dashboard model import with the dashboard adapter export. |
| `zNOTFORPRODUCTION/_CANONICAL/logan/vcsm/dal/vcsm.dal.dashboard.md` | Corrected drift, updated fixed findings, and appended this fix-pass record. |

### Findings Addressed

| Finding | Status | Notes |
|---|---|---|
| `designStudio.auth.dal.js` operation marked `unknown` | DONE | Reclassified as `auth (supabase.auth.getUser)` with no table access. |
| `vportDashboardLeadsScreen.model.js` marked possible dead | DONE | Model Consumers now records `VportDashboardLeadsScreen.jsx` as the live Final Screen consumer. |
| `useAcceptBarbershopInvite.js` possible hook-to-hook wiring | DONE | Upgraded to DELETE CANDIDATE pending IRONMAN after full-code grep found no callers. No deletion performed. |
| `QuickBookingModal.jsx` direct DAL import | DONE | Service loading now routes Component → Hook → Controller → DAL. |
| `QuickBookingModal.jsx` direct controller import | DONE | Booking creation now routes Component → Hook → Controller. |
| `PortfolioBugsBunnyPanel.jsx` direct controller import | DONE | Dev-only diagnostic probe now routes Component → Hook → Controller. |
| Profiles direct import of dashboard `vportAvailabilityRule.model.js` | DONE | Profiles now imports `mapAvailabilityRule` through `features/dashboard/vport/adapters/vport.adapter.js`. |
| `flyer.read.dal.js`, `dal/flyerDraft.model.js`, `vportProfileActorAccess.write.dal.js` dead-code candidates | BLOCKED | Left untouched because ownership reviews are still required. |
| VENOM-1 design studio raw `userId` concern | BLOCKED | Requires SENTRY review of `designStudio.shared.controller.js`; no behavior change made. |

### Verification

- Commands/searches run:
  - `grep -rn "listVportServicesByProfileIdDAL\\|createOwnerBookingController\\|probeVportPortfolioController\\|vportAvailabilityRule.model\\|useAcceptBarbershopInvite\\|vportDashboardLeadsScreen.model\\|dalReadAuthenticatedUserId" apps/VCSM/src --include='*.js' --include='*.jsx'`
  - `grep -rn "@/features/dashboard/vport/dal/read/vportServices.read.dal\\|@/features/dashboard/vport/controller/createOwnerBooking.controller\\|@/features/dashboard/vport/controller/probeVportPortfolio.controller\\|@/features/dashboard/vport/model/vportAvailabilityRule.model" apps/VCSM/src --include='*.js' --include='*.jsx'`
  - `find apps/VCSM/src/features/dashboard -maxdepth 5 -type f | sort`
  - Inspected `QuickBookingModal.jsx`, `PortfolioBugsBunnyPanel.jsx`, `vportServices.read.dal.js`, `createOwnerBooking.controller.js`, `useVportPublicBooking.js`, `useVportResourceAvailability.js`, and `vport.adapter.js`.
  - `npm run build`
- Production callers checked:
  - `QuickBookingModal.jsx` → `useQuickBookingModal.js` → `listVportServicesForProfile.controller.js` / `createOwnerBooking.controller.js`.
  - `PortfolioBugsBunnyPanel.jsx` → `useVportPortfolioProbe.js` → `probeVportPortfolio.controller.js`.
  - `features/profiles/kinds/vport/screens/booking/hooks/useVportPublicBooking.js` → `features/dashboard/vport/adapters/vport.adapter.js`.
  - `useAcceptBarbershopInvite.js` full-code caller search.
- Remaining risks:
  - Dead-code deletion candidates remain pending IRONMAN/VENOM.
  - `designStudio.shared.controller.js` raw auth `userId` path remains pending SENTRY.

### Status

PARTIAL

---

---

# CEREBRO Orchestration Run — 2026-05-14

**Triggered by:** User instruction — run CEREBRO on `vcsm.dal.dashboard.md`  
**Branch:** `vport-booking-feed-security-updates`  
**Orchestrator:** CEREBRO v1 (Canonical Command Registry 2026-05-11)  
**Prior audit baseline:** Avengers Assembly 2026-05-11

---

## Step 1 — Full Document Read

Document read in full (1,586 lines). Prior status: **PARTIAL**. Three pending reviews remained unresolved:
- SENTRY — `designStudio.shared.controller.js` userId usage
- IRONMAN — dead code deletion decisions
- CARNAGE — `vportProfileActorAccess.write.dal.js` delete or rebuild

Additionally: 20 dashboard files modified on branch since 2026-05-11 audit — full delta verification required.

---

## Step 2 — CEREBRO Risk Classification

All risk categories evaluated: security, identity, architecture boundary, DB/RLS, runtime, native parity, stale claims, missing ownership.

| Risk ID | Category | Severity | Source | Status |
|---|---|---|---|---|
| RISK-01 | Identity/Security | CRITICAL | `vportProfileActorAccess.write.dal.js` — profileId-scoped writes, zero callers | OPEN — BLOCKING if wired |
| RISK-02 | Auth/Identity | MEDIUM→RESOLVED | `designStudio.shared.controller.js` raw userId concern (VENOM-1) | RESOLVED via SENTRY |
| RISK-03 | Architecture/Layer | MEDIUM | `dal/flyerDraft.model.js` — model file in `dal/` directory, zero callers | OPEN — dead + layer violation |
| RISK-04 | Dead Code | LOW | `flyer.read.dal.js` — zero callers confirmed on branch | OPEN — delete pending IRONMAN |
| RISK-05 | Dead Code | LOW | `useAcceptBarbershopInvite.js` — zero callers confirmed on branch | OPEN — delete pending IRONMAN |
| RISK-06 | DB Security | LOW | `business_card_leads` DELETE ops | VERIFIED — scoped correctly by `vport_profile_id` + `id` |
| RISK-07 | Stale Audit | HIGH | 20 dashboard files modified since 2026-05-11 audit | VERIFIED via ARCHITECT delta |
| RISK-08 | Code Quality | LOW | `vportLeads.write.dal.js` uses `vport` import vs. `vportSchema` pattern | MINOR — cosmetic, functionally equivalent |
| RISK-09 | DAL Change | HIGH | `vportServices.read.dal.js` modified on branch | VERIFIED CLEAN |
| RISK-10 | Security | IMPROVEMENT | `service_label_snapshot` now resolved server-side | VERIFIED — significant security gain |
| RISK-11 | Architecture | LOW | `getVportActorIdByProfileIdDAL` profileId input in controllers | VERIFIED COMPLIANT — internal lookup only |
| RISK-12 | CARNAGE | HIGH | `vportProfileActorAccess.write.dal.js` — no migration plan, write path missing | OPEN — CARNAGE decision: DELETE |
| RISK-13 | Doc Drift | LOW | Exported function count "71" in summary — active count is ≤65 | OPEN — minor doc drift |
| RISK-14 | Security | MEDIUM | `createVportPublicBookingController` — `requestActorId` optional (anonymous booking allowed) | OPEN — product decision required |

---

## Step 3 — Command Order Decision

Based on CEREBRO canonical run order and open risk inventory:

| Phase | Command | Reason |
|---|---|---|
| 1 | ARCHITECT (delta) | 20 files modified on branch — prior audit is stale |
| 2 | VENOM | Branch name signals security focus; booking/team write paths changed |
| 3 | SENTRY | Resolve VENOM-1: designStudio userId vs actor identity contract |
| 4 | IRONMAN | Dead code candidates — confirm zero callers still hold, make deletion decisions |
| 5 | CARNAGE | `vportProfileActorAccess.write.dal.js` — delete vs rebuild decision |
| 6 | review-contract | `getVportActorIdByProfileIdDAL` profileId exposure in controllers |

---

## Step 4 — ARCHITECT Delta (Branch Verification)

**Run date:** 2026-05-14  
**Method:** Direct file read + git status inspection  
**Files inspected:** `vportServices.read.dal.js`, `vportPublicBooking.controller.js`, `createOwnerBooking.controller.js`, `updateVportBooking.controller.js`, `listVportBookingHistory.controller.js`, `vportTeam.controller.js`, `vportProfileActorAccess.write.dal.js`

### Delta Findings

| File | Finding | Status |
|---|---|---|
| `vportServices.read.dal.js` | Explicit SELECT_COLS, no `select('*')`, required param guards | CLEAN |
| `vportPublicBooking.controller.js` | Service label now resolved server-side; actor identity guards consistent; `requestActorId` optional (RISK-14) | IMPROVED + OPEN |
| `createOwnerBooking.controller.js` | Uses `assertActorOwnsVportActorController`; `callerActorId` required | CLEAN |
| `updateVportBooking.controller.js` | Dual-privilege status model (customer vs owner); both paths gate-verified | CLEAN |
| `listVportBookingHistory.controller.js` | `assertActorOwnsVportActorController` gating before any read | CLEAN |
| `vportTeam.controller.js` | All mutations gated by `assertActorOwnsVportActorController` | CLEAN |
| `vportProfileActorAccess.write.dal.js` | Still zero external callers; still `profileId`-scoped | CONFIRMED DEAD |

**ARCHITECT Delta Verdict:** Prior audit structure remains valid. Branch changes are additive improvements. One new open item: `requestActorId` optional in public booking (RISK-14). No new structural violations introduced.

---

## Step 5 — VENOM Security Audit

**Standalone file:** `zNOTFORPRODUCTION/CURRENT/features/dashboard/evidence/2026-05-14_venom_dashboard-dal-branch-delta.md`

### Summary of Findings

| Finding | Severity | Status |
|---|---|---|
| VENOM-BRANCH-01: `service_label_snapshot` server-side resolution | IMPROVEMENT | RESOLVED |
| VENOM-BRANCH-02: Anonymous booking path undocumented (`requestActorId = null`) | MEDIUM | OPEN — product decision |
| VENOM-BRANCH-03: Ownership verification chain (`assertActorOwnsVportActorController`) | VERIFIED SECURE | CLOSED |
| VENOM-BRANCH-04: Booking status privilege boundaries (customer vs owner) | VERIFIED SECURE | CLOSED |
| VENOM-BRANCH-05: Team write actor ownership | VERIFIED SECURE | CLOSED |
| VENOM-BRANCH-06: `vportServices.read.dal.js` change | VERIFIED CLEAN | CLOSED |
| VENOM-BRANCH-07: `vportLeads.write.dal.js` import inconsistency | LOW | OPEN (next touch) |
| VENOM-BRANCH-08: VENOM-1 designStudio userId concern | RESOLVED | CLOSED |

**Blocking:** 0  
**VENOM Verdict:** Branch security changes approved. One product decision required (anonymous booking).

---

## Step 6 — SENTRY Compliance

**Standalone file:** `zNOTFORPRODUCTION/CURRENT/features/dashboard/evidence/2026-05-14_sentry_dashboard-dal-designstudio-userId.md`

### `designStudio.shared.controller.js` — Full Review

File is 18 lines. `requireOwnerActorAccess(ownerActorId)`:
1. Fetches `userId` from Supabase auth session — authentication check only
2. Passes `{ actorId: ownerActorId, userId }` to `dalReadActorOwnerRow` — queries `actor_owners` table
3. The `ownerActorId` is the primary scoping key; `userId` is a credential lookup value only
4. Returns `userId` — callers do not use returned value as an identity gate (verified)

**Contract compliance:** PASS on all checks. No `profileId` or `vportId` exposure. `actor_owners` is the canonical ownership table. `actorId` is the primary gate.

**SENTRY Verdict:** VENOM-1 RESOLVED. `designStudio.shared.controller.js` is **COMPLIANT** with the actor-based identity contract.

---

## Step 7 — IRONMAN Dead Code Decisions

**Method:** Full grep across `apps/VCSM/src/` — all `.js` and `.jsx` files  
**Run date:** 2026-05-14

### Dead Code Verification Results

| Candidate | External Callers | Status | Decision |
|---|---|---|---|
| `flyer.read.dal.js` (`fetchFlyerPublicDetailsByActorId`) | **ZERO** — confirmed | STILL DEAD | DELETE CANDIDATE — flyer read path has no planned load path in current branch |
| `dal/flyerDraft.model.js` (`makeFlyerDraftFromPublicDetails`, `mergeDraft`) | **ZERO** — confirmed | STILL DEAD + LAYER VIOLATION | DELETE CANDIDATE — canonical copy at `model/flyerDraft.model.js`; `dal/` copy is misplaced duplicate |
| `vportProfileActorAccess.write.dal.js` (4 functions) | **ZERO** — confirmed | STILL DEAD + IDENTITY VIOLATION | DELETE CANDIDATE — see CARNAGE below |
| `useAcceptBarbershopInvite.js` | **ZERO** — confirmed | STILL DEAD | DELETE CANDIDATE — hook is exported but `vportTeamInvite.controller.js` only caller is `useBarberTeamRequests.js` |

**IRONMAN Verdict:** All four deletion candidates confirmed zero external callers on branch. No new callers introduced by branch changes. Deletion decisions stand. Source deletions require explicit user approval — not executed here.

---

## Step 8 — CARNAGE: `vportProfileActorAccess.write.dal.js`

**Method:** Full file read + RLS/ownership analysis  
**Run date:** 2026-05-14

### Analysis

**Current state:**
- 4 exported write functions: `upsertProfileActorAccessDAL`, `updateProfileActorAccessRoleDAL`, `updateProfileActorAccessStatusDAL`, `deleteProfileActorAccessDAL`
- All scoped by `profileId` — direct violation of actor-based identity contract
- Zero callers — completely unwired
- Uses `vportSchema` (correct client)
- READ counterpart (`vportProfileActorAccess.read.dal.js`) IS live and used by `probeVportPortfolio.controller.js`

**Missing write path:**
The `profile_actor_access` table (which controls which actors have access to a VPORT profile) has:
- A live read path — used to check access
- A completely dead write path — no way to grant, revoke, or update access via the actor identity system

**CARNAGE Decision:**

| Option | Assessment |
|---|---|
| DELETE the file | Correct action. Zero callers, `profileId` scoping is wrong. The write path needs a rebuild with `actorId` scoping when the feature is ready to wire. Deletion removes risk of accidental wiring. |
| Rebuild now with `actorId` scoping | Out of scope for this audit. Requires new controller, ownership model, and DB-level RLS verification. Should be a dedicated CARNAGE migration when the team access write feature is prioritized. |

**CARNAGE Recommendation:** DELETE `vportProfileActorAccess.write.dal.js`. When the write path is needed, create a new file scoped by `actorId` with full VENOM + SENTRY review before wiring. No DB migration required for the deletion (the table itself is untouched; only the dead DAL file is removed).

**Classification:** CARNAGE_DECISION = DELETE (pending user approval — source deletion requires explicit confirmation)

---

## Step 9 — review-contract: profileId Exposure Audit

**Scope:** `getVportActorIdByProfileIdDAL` usage across all dashboard controllers  
**Method:** File reads of all callers

### Caller Analysis

| Controller | Usage Pattern | Compliant? |
|---|---|---|
| `vportPublicBooking.controller.js` (line 93) | `profileId` from `resource.profile_id` (domain data) → resolves `vportActorId` for notification routing only | COMPLIANT |
| `updateVportBooking.controller.js` (`resolveVportActorFromProfileId`) | `profileId` from `booking.profile_id` (domain data) → resolves `vportActorId` for ownership check | COMPLIANT |
| `vportTeam.controller.js` (line 112) | `profileId` from `resource.profile_id` (domain data) → resolves `vportActorId` for ownership check | COMPLIANT |

**Pattern:** In all three cases, `profileId` is read from domain data (resource or booking rows, not user input), used as an internal lookup value only, and immediately resolved to `actorId`. The resolved `actorId` is then used for all authorization gates. The `profileId` is never exposed to the client or used as a routing/identity key.

**review-contract Verdict:** COMPLIANT. The `getVportActorIdByProfileIdDAL` usage follows the correct resolution pattern — `profileId` as internal domain data, `actorId` as the identity and authorization key. No contract violation.

---

## Final Command Status Table

| Command | Status | Blocking | Standalone File |
|---|---|---|---|
| ARCHITECT (delta) | COMPLETE | No | — |
| VENOM | COMPLETE | No (1 open item) | `2026-05-14_venom_dashboard-dal-branch-delta.md` |
| SENTRY | COMPLETE | No — VENOM-1 RESOLVED | `2026-05-14_sentry_dashboard-dal-designstudio-userId.md` |
| IRONMAN | COMPLETE | No | — |
| CARNAGE | COMPLETE (decision made) | No (deletion pending approval) | — |
| review-contract | COMPLETE | No | — |

---

## Open Risks

| Risk ID | Description | Severity | Action Required |
|---|---|---|---|
| RISK-01 / RISK-12 | `vportProfileActorAccess.write.dal.js` dead, profileId-scoped — must not be wired | CRITICAL | DELETE (pending user approval) |
| RISK-03 | `dal/flyerDraft.model.js` misplaced model duplicate — dead | MEDIUM | DELETE (pending user approval) |
| RISK-04 | `flyer.read.dal.js` dead read DAL | LOW | DELETE (pending user approval) |
| RISK-05 | `useAcceptBarbershopInvite.js` dead hook | LOW | DELETE (pending user approval) |
| RISK-13 | Summary exported function count still shows "71" — active count is ≤65 | LOW | Update doc summary table |
| RISK-14 / VENOM-BRANCH-02 | Anonymous booking path in `createVportPublicBookingController` undocumented | MEDIUM | Product decision + code comment |
| VENOM-BRANCH-07 | `vportLeads.write.dal.js` import inconsistency (`vport` vs `vportSchema`) | LOW | Fix on next touch |

---

## Fixed Risks (This Run)

| Risk | Resolution |
|---|---|
| VENOM-1 (2026-05-11): designStudio userId concern | RESOLVED — SENTRY confirmed compliant |
| RISK-07: 20 dashboard files modified — stale audit | RESOLVED — ARCHITECT delta verified all changes |
| RISK-09: `vportServices.read.dal.js` modified | RESOLVED — VERIFIED CLEAN |
| RISK-10: service_label_snapshot trust concern | RESOLVED — server-side resolution confirmed |
| RISK-11: `getVportActorIdByProfileIdDAL` profileId concern | RESOLVED — review-contract confirmed compliant |
| RISK-06: `business_card_leads` DELETE ownership | RESOLVED — scoped correctly |

---

## Required Next Command

```
USER DECISION REQUIRED:
  Approve deletion of 4 dead code candidates:
  1. apps/VCSM/src/features/dashboard/flyerBuilder/dal/flyer.read.dal.js
  2. apps/VCSM/src/features/dashboard/flyerBuilder/dal/flyerDraft.model.js
  3. apps/VCSM/src/features/dashboard/vport/dal/write/vportProfileActorAccess.write.dal.js
  4. apps/VCSM/src/features/dashboard/vport/hooks/useAcceptBarbershopInvite.js

PRODUCT DECISION REQUIRED:
  Confirm whether anonymous booking (requestActorId = null) in createVportPublicBookingController
  is intentional. If yes — add code comment. If no — add guard.

AFTER USER DECISIONS:
  LOGAN — update document summary (exported function count: 71 → ≤65 active)
  AvengersAssemble → THOR (if deletions approved and anonymous booking decision documented)
```

---

## Document Status

**REVIEW_PENDING**

All command runs complete. Awaiting user decisions on dead code deletion approvals and anonymous booking product intent before this document can advance to VERIFIED or RELEASE_READY.

---

---

# Resolution Pass — 2026-05-14

**Triggered by:** User decisions on CEREBRO open items  
**Authority:** LOGAN (doc update) + Codex (source deletions + comment)

---

## User Decisions Recorded

| Decision | Answer |
|---|---|
| Delete all 4 dead code candidates | APPROVED |
| Anonymous booking (`requestActorId = null`) — intentional? | YES — guest/walk-in booking is a product feature |

---

## Dead Code Deletion — Executed

| File | Status |
|---|---|
| `apps/VCSM/src/features/dashboard/flyerBuilder/dal/flyer.read.dal.js` | DELETED |
| `apps/VCSM/src/features/dashboard/flyerBuilder/dal/flyerDraft.model.js` | DELETED |
| `apps/VCSM/src/features/dashboard/vport/dal/write/vportProfileActorAccess.write.dal.js` | DELETED |
| `apps/VCSM/src/features/dashboard/vport/hooks/useAcceptBarbershopInvite.js` | DELETED |

**Import sweep:** Zero remaining imports of any deleted file confirmed across all `.js` / `.jsx` in `apps/VCSM/src/`.

### Impact on document counts

| Metric | Was | Now |
|---|---|---|
| DAL files | 30 | **28** (2 DAL files deleted) |
| Exported DAL functions | 71 (active: ≤65) | **~63 active** |
| Hook files | 27 | **26** |
| Misplaced model in `dal/` | 1 | **0** |

---

## Anonymous Booking — Design Intent Documented

**File changed:** `apps/VCSM/src/features/dashboard/vport/controller/vportPublicBooking.controller.js`

Comment added before the `requestActorId` guard:

```js
// requestActorId is intentionally optional — guest/walk-in bookings are supported.
// When null, the booking is unattributed (customer_actor_id = null, created_by_actor_id = null).
// customerName + customerNote are still captured for the VPORT owner's records.
```

**VENOM-BRANCH-02:** CLOSED — design intent confirmed and documented in source.

---

## LOGAN Doc Truth Update

### Dead Code Audit — Updated Status

| Finding | Previous | Current |
|---|---|---|
| `flyer.read.dal.js` | DELETE CANDIDATE | **DELETED 2026-05-14** |
| `dal/flyerDraft.model.js` | DELETE CANDIDATE | **DELETED 2026-05-14** |
| `vportProfileActorAccess.write.dal.js` | DELETE CANDIDATE (CRITICAL) | **DELETED 2026-05-14** |
| `useAcceptBarbershopInvite.js` | DELETE CANDIDATE | **DELETED 2026-05-14** |

### Risk Findings — Updated Status

| Risk | Previous | Current |
|---|---|---|
| `vportProfileActorAccess.write.dal.js` dead profileId-scoped write | HIGH / OPEN | **CLOSED — deleted** |
| `designStudio.auth.dal.js` raw userId (VENOM-1) | MEDIUM / OPEN | **CLOSED — SENTRY verified compliant** |
| `useAcceptBarbershopInvite.js` no callers | LOW / OPEN | **CLOSED — deleted** |

### Pending Reviews — Updated Status

| Review | Previous | Current |
|---|---|---|
| SENTRY — `designStudio.shared.controller.js` userId | PENDING | **COMPLETE — COMPLIANT** |
| IRONMAN — dead code decisions | PENDING | **COMPLETE — all 4 deleted** |
| VENOM / IRONMAN — `vportProfileActorAccess.write.dal.js` | PENDING | **COMPLETE — DELETED** |

---

## Remaining Open Items

| Item | Severity | Notes |
|---|---|---|
| `vportLeads.write.dal.js` import inconsistency (`vport` vs `vportSchema`) | LOW | Cosmetic — fix on next touch |
| `profile_actor_access` write path entirely absent from live system | MEDIUM | Rebuild with `actorId` scoping + VENOM review when team access management is prioritized |

---

## Final Command Status Table

| Command | Run Date | Status | Blocking |
|---|---|---|---|
| ARCHITECT (static scan) | 2026-05-11 | COMPLETE | No |
| ARCHITECT (branch delta) | 2026-05-14 | COMPLETE | No |
| VENOM (initial) | 2026-05-11 | COMPLETE | No |
| VENOM (branch delta) | 2026-05-14 | COMPLETE | No |
| SENTRY / review-contract | 2026-05-11 | COMPLETE | No |
| SENTRY (designStudio userId) | 2026-05-14 | COMPLETE — RESOLVED | No |
| LOGAN | 2026-05-11 | COMPLETE | No |
| LOGAN (post-deletion update) | 2026-05-14 | COMPLETE | No |
| IRONMAN | 2026-05-14 | COMPLETE — all 4 deleted | No |
| CARNAGE | 2026-05-14 | COMPLETE — deletion executed | No |
| review-contract (profileId callers) | 2026-05-14 | COMPLETE — compliant | No |

---

## Document Status

**VERIFIED**

All governance commands complete. All blocking findings resolved. All pending reviews closed. Dead code deleted. Anonymous booking design intent documented in source. One low-severity cosmetic item deferred to next touch. Ready for AvengersAssemble → THOR if a release gate is required.

---

---

# CEREBRO Orchestration Run — 2026-05-18

**Triggered by:** User instruction — run CEREBRO on `vcsm.dal.dashboard.md`  
**Branch:** `vport-booking-feed-security-updates`  
**Orchestrator:** CEREBRO v2 (Canonical Command Registry 2026-05-14)  
**Prior audit baseline:** Resolution Pass 2026-05-14 (status: VERIFIED)

---

## Step 1 — Full Document Read

Document read in full (1,966 lines as of 2026-05-14). Prior status: **VERIFIED**. All prior blocking findings were resolved. Four dead code files deleted. Anonymous booking documented in source.

**Trigger for new run:** 4 days of branch activity since VERIFIED status. File system comparison shows 14 new/modified files inside `features/dashboard/` since the last audit timestamp.

---

## Step 2 — CEREBRO Risk Classification

All risk categories evaluated: security, identity, architecture boundary, DB/RLS, runtime, native parity, stale claims, doc drift, missing ownership.

| Risk ID | Category | Severity | Source | Status |
|---|---|---|---|---|
| RISK-2026-01 | Architecture/Cross-Feature | **BLOCKING** | `checkVportOwnership.controller.js` imports `getActorByIdDAL` directly from `@/features/booking/dal/` — bypasses adapter boundary | OPEN |
| RISK-2026-02 | Layer/Architecture | MEDIUM | `BarberPickerModal.jsx` (component) uses `useState` ×4 + `useEffect` ×1 — hooks in component layer | OPEN |
| RISK-2026-03 | Layer/Architecture | MEDIUM | `ConfirmRemoveModal.jsx` (component) calls `useActorSummary` from `@hydration` — hook in component | OPEN |
| RISK-2026-04 | Layer/Architecture | MEDIUM | `VportDashboardBookingHistoryView.jsx` (View Screen) contains `filterBookings` and `groupByDate` business logic inline — must be in model | OPEN |
| RISK-2026-05 | Doc Drift | HIGH | Three undocumented DAL export changes: `findEligibleBarbersDAL` renamed → `findEligibleBarberActorIdsDAL`; new `listVportResourcesByOwnerActorIdDAL`; new `listVportAvailabilityRulesByResourceIdsDAL` | OPEN |
| RISK-2026-06 | Doc Drift/Structural | HIGH | DAL file count wrong: document says 28, disk has 26 — two DALs deleted since VERIFIED: `vportBookingHistory.read.dal.js` + `vportAvailabilityRules.write.dal.js` (migrated to booking engine) | OPEN |
| RISK-2026-07 | Doc Drift | MEDIUM | New files not in document: `VportDashboardBookingHistoryView.jsx`, `BarberPickerModal.jsx`, `ConfirmRemoveModal.jsx`, `WeeklyAvailabilityMobileGrid.jsx`, `ScheduleModals.jsx` | OPEN |
| RISK-2026-08 | Doc Drift | MEDIUM | Two deleted controllers not documented: `listVportBookingHistory.controller.js`, `manageVportAvailabilityRule.controller.js` (migrated to booking engine) | OPEN |
| RISK-2026-09 | Architecture/Improvement | LOW | `vportTeamAccess.controller.js` has new `searchTeamCandidatesController` via `searchActorsAdapter` — compliant but undocumented | OPEN |
| RISK-2026-10 | DAL Signature | HIGH | `listVportBookingsForProfileDay.read.dal.js` breaking signature change: previously `(profileId, date)` → now `({resourceIds, rangeStart, rangeEnd})` — callers updated; doc still shows old signature | OPEN |
| RISK-2026-11 | Security (carryover) | LOW | `vportLeads.write.dal.js` import inconsistency (`vport` vs `vportSchema`) — carried over from VENOM-BRANCH-07 | OPEN |

---

## Step 3 — Command Order Decision

Based on CEREBRO canonical run order and open risk inventory:

| Phase | Command | Reason |
|---|---|---|
| 1 | ARCHITECT (delta) | 2 new DAL deletions, 3 new DAL exports, 1 DAL signature change, 5 new screen/component files — structural delta since VERIFIED |
| 2 | SENTRY | BLOCKING: cross-feature DAL import in `checkVportOwnership.controller.js`; MEDIUM: hooks in component layer (×2), business logic in View Screen |
| 3 | VENOM | DAL signature change trust model for `listVportBookingsForProfileDay`; carryover VENOM-BRANCH-07 |
| 4 | LOGAN | Extensive doc drift: renamed functions, new functions, new/deleted files, DAL count corrections, new screens |

---

## Step 4 — ARCHITECT Delta (2026-05-18)

**Run date:** 2026-05-18  
**Method:** Direct file read + `find -newer` filesystem comparison + grep caller traces  
**Reference timestamp:** `vcsm.dal.dashboard.md` modification time (2026-05-14)

### New Files Detected (not in document)

| File | Classification | Status |
|---|---|---|
| `features/dashboard/vport/screens/VportDashboardBookingHistoryView.jsx` | View Screen | NEW — undocumented |
| `features/dashboard/vport/screens/components/team/BarberPickerModal.jsx` | Component | NEW — undocumented |
| `features/dashboard/vport/screens/components/team/ConfirmRemoveModal.jsx` | Component | NEW — undocumented |
| `features/dashboard/vport/components/calendar/WeeklyAvailabilityMobileGrid.jsx` | Component | NEW — undocumented |
| `features/dashboard/vport/screens/components/schedule/ScheduleModals.jsx` | Component | NEW — undocumented |

### Deleted Files Since VERIFIED (not documented)

| File | Deletion Reason | Status |
|---|---|---|
| `features/dashboard/vport/dal/read/vportBookingHistory.read.dal.js` | Migrated to booking engine (`useBookingHistory` via `booking.adapter.js`) | DELETED — undocumented |
| `features/dashboard/vport/dal/write/vportAvailabilityRules.write.dal.js` | Migrated to booking engine (`useManageAvailability` via `booking.adapter.js`) | DELETED — undocumented |
| `features/dashboard/vport/controller/listVportBookingHistory.controller.js` | Migrated to booking engine | DELETED — undocumented |
| `features/dashboard/vport/controller/manageVportAvailabilityRule.controller.js` | Migrated to booking engine | DELETED — undocumented |

### Modified DAL Exports (not in document)

| DAL File | Change | Impact |
|---|---|---|
| `vportTeam.read.dal.js` | `findEligibleBarbersDAL` renamed → `findEligibleBarberActorIdsDAL`; function now returns actor ID array only; `resources` table no longer accessed in this function | Export name change — doc stale |
| `vportResource.read.dal.js` | New export `listVportResourcesByOwnerActorIdDAL({ ownerActorId })` — queries `resources` by `owner_actor_id` (actor-based) | New actor-scoped lookup — undocumented |
| `vportAvailabilityRules.read.dal.js` | New export `listVportAvailabilityRulesByResourceIdsDAL({ resourceIds })` — batch version of existing function | New batch DAL — undocumented |
| `listVportBookingsForProfileDay.read.dal.js` | **Breaking signature change**: was `(profileId, date)`, now `({resourceIds, rangeStart, rangeEnd})` — queries by `resource_id IN (resourceIds)` with explicit time range | Doc shows wrong signature |

### Modified Controller Behaviour (notable)

| Controller | Change | Status |
|---|---|---|
| `loadDaySchedule.controller.js` | Now merges profile-based resources (`listVportResourcesByProfileIdDAL`) + actor-based resources (`listVportResourcesByOwnerActorIdDAL`) before querying schedule; uses new batch availability + new `listVportBookingsForProfileDay` signature | ARCHITECTURAL IMPROVEMENT — hybrid resolution |
| `vportTeam.controller.js` | Uses renamed `findEligibleBarberActorIdsDAL`; adds `hydrateAndReturnSummaries` for member display; `removeTeamMemberController` now resolves ownership from `resource.owner_actor_id` first | IMPROVEMENT — actor-scoped ownership first |
| `vportTeamAccess.controller.js` | New `searchTeamCandidatesController` using `searchActorsAdapter` (actors adapter boundary — compliant) | COMPLIANT NEW FUNCTION |
| `checkVportOwnership.controller.js` | Imports `getActorByIdDAL` directly from `@/features/booking/dal/getActorById.dal` | **VIOLATION — see SENTRY-2026-01** |

### DAL Count Reconciliation

| Metric | 2026-05-14 VERIFIED | 2026-05-18 Delta | Current |
|---|---|---|---|
| DAL files | 28 | −2 (booking history + availability write deleted) | **26** |
| Exported DAL functions (active) | ~63 | −3 (deleted) +3 (new) +1 rename | **~63 active** |
| Controllers | 23 | −2 (migrated) +0 new in dashboard | **21** |

**ARCHITECT Delta Verdict:** Structural changes are significant — two DALs migrated to booking engine, two controllers retired, three new DAL exports, one breaking DAL signature change, five new screen/component files. Prior VERIFIED count is stale. All migration changes appear architecturally correct (booking engine consuming dashboard DAL responsibilities). One new boundary violation found.

---

## Step 5 — VENOM Security Audit

**Run date:** 2026-05-18  
**Scope:** Modified DAL files and `listVportBookingsForProfileDay` signature change trust model

### VENOM-2026-01: `listVportBookingsForProfileDay` Trust Model Change

**Prior:** Function accepted `profileId` + `date` → internally resolved resource_ids from DB  
**Current:** Function accepts `{resourceIds, rangeStart, rangeEnd}` → trusts caller to provide authorized resource IDs

**Trust chain analysis:**  
The only caller is `loadDaySchedule.controller.js`. The controller:
1. Resolves `profileId` from `actorId` (authenticated) ✓
2. Fetches resources via `listVportResourcesByProfileIdDAL` + `listVportResourcesByOwnerActorIdDAL` — both gated by authenticated actor ✓
3. Passes the resulting resource IDs to `listVportBookingsForProfileDayDAL` ✓

The DAL no longer performs its own authorization — it trusts the controller-provided IDs. This is the standard VCSM controller/DAL split pattern (controller owns authorization, DAL owns query execution). **COMPLIANT.**

**Additional protection:** `listVportBookingsForProfileDayDAL` requires `resourceIds` to be a non-empty array — returns `[]` on empty input. No wildcard reads possible.

**VENOM-2026-01 Verdict:** RESOLVED — signature change is architecturally correct and safe.

### VENOM-2026-02: New `listVportResourcesByOwnerActorIdDAL` — Identity Check

**Function:** Queries `resources` by `owner_actor_id` — actor-based scoping  
**Assessment:** This is the correct pattern for VCSM's actor-based identity contract. Resources scoped to `owner_actor_id` align with the actor model. All callers go through `loadDaySchedule.controller.js` which has authenticated actor resolution. **COMPLIANT.**

### VENOM-2026-03: `vportTeam.write.dal.js` `owner_actor_id` in Inserts

**Change:** `insertTeamMemberDAL` and `insertLinkedTeamMemberDAL` now write `owner_actor_id` to the `resources` table  
**Assessment:** `owner_actor_id` is the VPORT's own `actorId` (not the caller's identity). The controller (`vportTeam.controller.js`) gates with `assertActorOwnsVportActorController` before calling. Storing ownership in `owner_actor_id` is an improvement — enables future actor-based resource lookups. **COMPLIANT.**

### Carryover VENOM-BRANCH-07 (from 2026-05-14)

`vportLeads.write.dal.js` import inconsistency (`vport` vs `vportSchema`) — **still open**. Cosmetic only.

**VENOM Verdict:** No new blocking security findings. VENOM-2026-01 resolved. Carryover VENOM-BRANCH-07 remains LOW/deferred.

---

## Step 6 — SENTRY Compliance

**Standalone file:** `zNOTFORPRODUCTION/CURRENT/features/dashboard/evidence/2026-05-18_sentry_dashboard-dal-layer-boundary-violations.md`

### Summary of SENTRY Findings

| Finding | File | Severity | Status |
|---|---|---|---|
| SENTRY-2026-01 | `checkVportOwnership.controller.js` — direct `@/features/booking/dal/` import | **BLOCKING** | OPEN |
| SENTRY-2026-02 | `BarberPickerModal.jsx` — hooks in component layer | MEDIUM | OPEN |
| SENTRY-2026-03 | `ConfirmRemoveModal.jsx` — `useActorSummary` hook in component | MEDIUM | OPEN |
| SENTRY-2026-04 | `VportDashboardBookingHistoryView.jsx` — `filterBookings`/`groupByDate` business logic in View Screen | MEDIUM | OPEN |
| SENTRY-2026-05 | `vportTeamAccess.controller.js` search via adapter | COMPLIANT | CLOSED |
| SENTRY-2026-06 | `VportDashboardBookingHistoryView.jsx` booking hooks via adapter | COMPLIANT | CLOSED |

**SENTRY Verdict:** PARTIAL — SENTRY-2026-01 is a live architecture boundary violation and is **BLOCKING**. SENTRY-2026-02 through -04 are medium layer violations. Fixes required before this document can return to RELEASE_READY.

### Required Fix for SENTRY-2026-01

`checkVportOwnership.controller.js` must be changed from:
```js
import getActorByIdDAL from "@/features/booking/dal/getActorById.dal";
```
To importing a wrapper exposed through `booking.adapter.js`. Suggested approach:
- Add `export { resolveActorKind } from "@/features/booking/controller/resolveActorKind.controller"` (or equivalent) to `booking.adapter.js`
- The wrapper performs the `kind` + `is_void` check and returns a boolean or typed result
- Controller only imports from the adapter, never from `@/features/booking/dal/`

---

## Step 7 — LOGAN Documentation Truth Update

**Run date:** 2026-05-18  
**Scope:** All drift identified by ARCHITECT delta

### DAL Files Section — Required Updates

| Item | Was | Now |
|---|---|---|
| DAL file count (Summary) | 28 | **26** |
| `vportBookingHistory.read.dal.js` | Listed as active | **DELETED — migrated to booking engine** |
| `vportAvailabilityRules.write.dal.js` | Listed as active | **DELETED — migrated to booking engine** |
| `vportTeam.read.dal.js` export | `findEligibleBarbersDAL` | **`findEligibleBarberActorIdsDAL`** |
| `vportResource.read.dal.js` | 2 exports | **3 exports** (+ `listVportResourcesByOwnerActorIdDAL`) |
| `vportAvailabilityRules.read.dal.js` | 1 export | **2 exports** (+ `listVportAvailabilityRulesByResourceIdsDAL`) |
| `listVportBookingsForProfileDay.read.dal.js` | Signature: `(profileId, date)` | **Signature: `({resourceIds, rangeStart, rangeEnd})`** |

### Tables Accessed — Required Updates

| Table | Change |
|---|---|
| `resources` | `listVportResourcesByOwnerActorIdDAL` adds READ via `owner_actor_id` |
| `availability_rules` | READ now also via `listVportAvailabilityRulesByResourceIdsDAL` (batch) |

### Architecture Pipeline — Required Updates

| Layer | Change |
|---|---|
| **Controller** | Remove `listVportBookingHistory.controller.js`, `manageVportAvailabilityRule.controller.js` (migrated); add `searchTeamCandidatesController` via `vportTeamAccess.controller.js` note |
| **View Screen** | Add `VportDashboardBookingHistoryView.jsx` |
| **Component** | Add `BarberPickerModal.jsx`, `ConfirmRemoveModal.jsx`, `WeeklyAvailabilityMobileGrid.jsx`, `ScheduleModals.jsx` |

### Screen Coverage Summary — Required Updates

| Screen | Change |
|---|---|
| `VportDashboardBookingHistoryScreen.jsx` | Now delegates to `VportDashboardBookingHistoryView.jsx`; booking history via `useBookingHistory` from `booking.adapter` (not `listVportBookingHistory.controller`) |
| `VportDashboardCalendarScreen.jsx` | Availability management via `useManageAvailability` from `booking.adapter` (not `manageVportAvailabilityRule.controller`) |

**LOGAN Verdict:** HIGH drift — doc is stale in DAL count, 4 deleted files not recorded, 3 new exports not recorded, 1 breaking signature change not recorded, 5 new screen/component files not recorded. All corrections catalogued above. No `.v2.md` required — corrections are additive.

---

## Final Command Status Table

| Command | Run Date | Status | Blocking | Standalone File |
|---|---|---|---|---|
| ARCHITECT (static scan) | 2026-05-11 | COMPLETE | No | — |
| ARCHITECT (branch delta) | 2026-05-14 | COMPLETE | No | — |
| ARCHITECT (branch delta v2) | 2026-05-18 | COMPLETE | No | — |
| VENOM (initial) | 2026-05-11 | COMPLETE | No | — |
| VENOM (branch delta) | 2026-05-14 | COMPLETE | No | `2026-05-14_venom_dashboard-dal-branch-delta.md` |
| VENOM (delta v2) | 2026-05-18 | COMPLETE | No | — |
| SENTRY / review-contract | 2026-05-11 | COMPLETE | No | — |
| SENTRY (designStudio userId) | 2026-05-14 | COMPLETE — RESOLVED | No | `2026-05-14_sentry_dashboard-dal-designstudio-userId.md` |
| SENTRY (layer violations) | 2026-05-18 | COMPLETE — 1 BLOCKING | **Yes** | `2026-05-18_sentry_dashboard-dal-layer-boundary-violations.md` |
| IRONMAN | 2026-05-14 | COMPLETE — all 4 deleted | No | — |
| CARNAGE | 2026-05-14 | COMPLETE — deletion executed | No | — |
| review-contract (profileId callers) | 2026-05-14 | COMPLETE — compliant | No | — |
| LOGAN | 2026-05-11 | COMPLETE | No | — |
| LOGAN (post-deletion update) | 2026-05-14 | COMPLETE | No | — |
| LOGAN (drift update) | 2026-05-18 | COMPLETE — corrections catalogued | No | — |

---

## Open Risks

| Risk ID | Description | Severity | Action Required |
|---|---|---|---|
| RISK-2026-01 / SENTRY-2026-01 | `checkVportOwnership.controller.js` — direct booking DAL import, bypasses adapter | **BLOCKING** | Fix: expose resolver through `booking.adapter.js` |
| RISK-2026-02 / SENTRY-2026-02 | `BarberPickerModal.jsx` — hooks in component layer | MEDIUM | Extract to `useBarberPicker.js` hook |
| RISK-2026-03 / SENTRY-2026-03 | `ConfirmRemoveModal.jsx` — `useActorSummary` hook in component | MEDIUM | Pass resolved `displayName` string as prop from parent |
| RISK-2026-04 / SENTRY-2026-04 | `VportDashboardBookingHistoryView.jsx` — business logic inline | MEDIUM | Move `filterBookings`/`groupByDate` to model file |
| RISK-2026-11 / VENOM-BRANCH-07 | `vportLeads.write.dal.js` import inconsistency | LOW | Fix on next touch |

---

## Fixed Risks (This Run)

| Risk | Resolution |
|---|---|
| VENOM-2026-01: `listVportBookingsForProfileDay` signature trust model | RESOLVED — controller-owned authorization chain verified correct |
| VENOM-2026-02: `listVportResourcesByOwnerActorIdDAL` identity | RESOLVED — actor-based scoping confirmed compliant |
| VENOM-2026-03: `vportTeam.write.dal.js` `owner_actor_id` writes | RESOLVED — ownership gated by `assertActorOwnsVportActorController` before call |
| RISK-2026-06 (doc): DAL count mismatch | CATALOGUED — 26 confirmed on disk; `vportBookingHistory.read.dal.js` + `vportAvailabilityRules.write.dal.js` confirmed deleted (migrated to booking engine) |
| RISK-2026-05, -07, -08, -09, -10 (doc drift) | CATALOGUED — all corrections recorded in LOGAN section above |

---

## Required Next Command

```
IRONMAN — confirm fix plan for SENTRY-2026-01 (booking DAL import) and
          the three medium layer violations (BarberPickerModal, ConfirmRemoveModal,
          VportDashboardBookingHistoryView inline model logic)

AFTER FIXES:
  SENTRY re-run — verify SENTRY-2026-01 through -04 resolved
  LOGAN — apply doc corrections catalogued above (DAL count, deleted files, new exports,
           signature change, new screens/components)
  AvengersAssemble → THOR (if fixes complete and doc updated)
```

---

## Document Status

**REVIEW_PENDING**

New branch activity since 2026-05-14 VERIFIED status introduced one blocking architecture boundary violation (`checkVportOwnership.controller.js` cross-feature DAL import) and three medium layer violations. Document truth is also stale on DAL count, deleted files, new exports, and new screen files. Awaiting IRONMAN fix confirmation and LOGAN doc correction before this document can return to VERIFIED or advance to RELEASE_READY.

---

---

# IRONMAN + Fix Execution Pass — 2026-05-18

**Triggered by:** CEREBRO REVIEW_PENDING — SENTRY findings SENTRY-2026-01 through -04  
**Authority:** IRONMAN (ownership mapping) + Codex (fix execution)  
**Standalone file:** `zNOTFORPRODUCTION/CURRENT/features/dashboard/evidence/2026-05-18_ironman_dashboard-team-booking-ownership.md`

---

## IRONMAN Ownership Findings

| Finding | File | Severity | Decision |
|---|---|---|---|
| IRONMAN-FINDING-01 | `checkVportOwnership.controller.js` → booking DAL direct import | **BLOCKING** | Fix: expose via `booking.adapter.js` §5.3 exception |
| IRONMAN-FINDING-02 | `BarberPickerModal.jsx` — dead (0 callers) + hooks in component | MEDIUM | DELETE |
| IRONMAN-FINDING-03 | `ConfirmRemoveModal.jsx` — `useActorSummary` hook in component | MEDIUM | Fix: use `member.name` directly |
| IRONMAN-FINDING-04 | `VportDashboardBookingHistoryView.jsx` — `filterBookings`/`groupByDate` inline | MEDIUM | Fix: extract to model file |

---

## Fix Execution — Completed 2026-05-18

| Fix | Files Changed | Status |
|---|---|---|
| SENTRY-2026-01 | `booking.adapter.js` — added `getActorByIdDAL` export with §5.3 exception comment | DONE |
| SENTRY-2026-01 | `checkVportOwnership.controller.js` — import changed to `booking.adapter.js`; removed direct `booking/dal/` import | DONE |
| SENTRY-2026-02 | `BarberPickerModal.jsx` — DELETED (dead code, layer violation) | DONE |
| SENTRY-2026-03 | `ConfirmRemoveModal.jsx` — removed `useActorSummary` import + call; uses `member.name` directly | DONE |
| SENTRY-2026-04 | `vportBookingHistoryView.model.js` — NEW model file created at `screens/model/` | DONE |
| SENTRY-2026-04 | `VportDashboardBookingHistoryView.jsx` — inline functions removed; model import added | DONE |

---

## SENTRY Re-Verification — All Checks Pass

| Finding | Verification | Result |
|---|---|---|
| SENTRY-2026-01 | `checkVportOwnership.controller.js` imports from `booking.adapter` ✓; `booking/dal/getActorById.dal` no longer imported directly ✓ | **RESOLVED** |
| SENTRY-2026-02 | `BarberPickerModal.jsx` not found on disk ✓ | **RESOLVED** |
| SENTRY-2026-03 | `ConfirmRemoveModal.jsx` — zero hooks (`useActorSummary` / `useState` / `useEffect` / `useMemo`) ✓ | **RESOLVED** |
| SENTRY-2026-04 | No `function filterBookings` / `function groupByDate` in View Screen ✓; model import at line 15 ✓; model file exists ✓ | **RESOLVED** |

---

## LOGAN — Document Truth Corrections (Applied 2026-05-18)

All corrections are catalogued in CEREBRO Step 7 above. Summary of what changed in the live codebase since the 2026-05-14 VERIFIED baseline:

### DAL Summary Table — Corrected

| Metric | 2026-05-14 | 2026-05-18 |
|---|---|---|
| DAL files | 28 | **26** |
| Exported DAL functions (active) | ~63 | **~63** (+3 new, −3 from deleted files, 1 rename) |

### DAL Files — Deleted Since VERIFIED

| File | Reason |
|---|---|
| `vportBookingHistory.read.dal.js` | Migrated to booking engine — `useBookingHistory` via `booking.adapter.js` |
| `vportAvailabilityRules.write.dal.js` | Migrated to booking engine — `useManageAvailability` via `booking.adapter.js` |

### DAL Files — New Exports Since VERIFIED

| DAL File | New Export | Tables |
|---|---|---|
| `vportResource.read.dal.js` | `listVportResourcesByOwnerActorIdDAL({ ownerActorId })` | `resources` READ via `owner_actor_id` |
| `vportAvailabilityRules.read.dal.js` | `listVportAvailabilityRulesByResourceIdsDAL({ resourceIds })` | `availability_rules` READ (batch) |

### DAL Files — Renamed Exports

| DAL File | Was | Now |
|---|---|---|
| `vportTeam.read.dal.js` | `findEligibleBarbersDAL` | `findEligibleBarberActorIdsDAL` |

### DAL Files — Signature Changes

| DAL File | Change |
|---|---|
| `listVportBookingsForProfileDay.read.dal.js` | Was: `(profileId, date)` → Now: `({resourceIds, rangeStart, rangeEnd})` |

### Controllers — Deleted Since VERIFIED

| Controller | Reason |
|---|---|
| `listVportBookingHistory.controller.js` | Migrated to booking engine |
| `manageVportAvailabilityRule.controller.js` | Migrated to booking engine |

### New Files — Architecture Pipeline Additions

| File | Layer | Notes |
|---|---|---|
| `vportBookingHistoryView.model.js` | Model | `filterBookings`, `groupByDate` — booking history view transforms |
| `VportDashboardBookingHistoryView.jsx` | View Screen | Full booking history UI — today/upcoming/history tabs |
| `ConfirmRemoveModal.jsx` | Component | Presentational confirm dialog — fixed (was: hook violation) |
| `WeeklyAvailabilityMobileGrid.jsx` | Component | Mobile availability grid |
| `ScheduleModals.jsx` | Component | Schedule-related modal container |
| `BarberPickerModal.jsx` | — | **DELETED** — dead code |

### Remaining Open Items

| Item | Severity | Notes |
|---|---|---|
| `vportLeads.write.dal.js` import inconsistency (`vport` vs `vportSchema`) | LOW | Cosmetic — fix on next touch |
| `profile_actor_access` write path entirely absent from live system | MEDIUM | Rebuild with `actorId` scoping + VENOM review when team access management is prioritized |
| `AddTeamMemberSheet.jsx` — `CandidateRow` sub-component calls `useActorSummary` | LOW | Sub-component hook usage — acceptable if `CandidateRow` is treated as a View-type component; flag for SENTRY if stricter enforcement needed |

---

## Final Command Status Table (Complete)

| Command | Run Date | Status | Blocking |
|---|---|---|---|
| ARCHITECT (static scan) | 2026-05-11 | COMPLETE | No |
| ARCHITECT (branch delta) | 2026-05-14 | COMPLETE | No |
| ARCHITECT (branch delta v2) | 2026-05-18 | COMPLETE | No |
| VENOM (initial) | 2026-05-11 | COMPLETE | No |
| VENOM (branch delta) | 2026-05-14 | COMPLETE | No |
| VENOM (delta v2) | 2026-05-18 | COMPLETE | No |
| SENTRY / review-contract | 2026-05-11 | COMPLETE | No |
| SENTRY (designStudio userId) | 2026-05-14 | COMPLETE — RESOLVED | No |
| SENTRY (layer violations v2) | 2026-05-18 | COMPLETE — all 4 RESOLVED | No |
| IRONMAN | 2026-05-14 | COMPLETE — 4 dead files deleted | No |
| IRONMAN (team+booking ownership) | 2026-05-18 | COMPLETE — 4 findings fixed | No |
| CARNAGE | 2026-05-14 | COMPLETE — deletion executed | No |
| review-contract (profileId callers) | 2026-05-14 | COMPLETE — compliant | No |
| LOGAN | 2026-05-11 | COMPLETE | No |
| LOGAN (post-deletion update) | 2026-05-14 | COMPLETE | No |
| LOGAN (drift update v2) | 2026-05-18 | COMPLETE — corrections applied | No |

---

## Open Risks

| Risk ID | Description | Severity | Action Required |
|---|---|---|---|
| VENOM-BRANCH-07 | `vportLeads.write.dal.js` import inconsistency (`vport` vs `vportSchema`) | LOW | Fix on next touch |
| — | `profile_actor_access` write path missing from live system | MEDIUM | Rebuild with actorId scoping when team-access management is prioritized |
| — | `AddTeamMemberSheet.jsx` `CandidateRow` calls `useActorSummary` | LOW | Acceptable as View-type sub-component; flag for stricter pass if needed |

---

## Fixed Risks (This Pass)

| Risk | Resolution |
|---|---|
| SENTRY-2026-01: `checkVportOwnership.controller.js` direct booking DAL import | RESOLVED — `getActorByIdDAL` now exported via `booking.adapter.js` §5.3 exception |
| SENTRY-2026-02: `BarberPickerModal.jsx` dead + hooks in component | RESOLVED — deleted |
| SENTRY-2026-03: `ConfirmRemoveModal.jsx` hook in component | RESOLVED — `useActorSummary` removed; uses `member.name` |
| SENTRY-2026-04: `VportDashboardBookingHistoryView.jsx` inline model logic | RESOLVED — `filterBookings`/`groupByDate` moved to `vportBookingHistoryView.model.js` |
| RISK-2026-06: DAL count mismatch | RESOLVED — 26 DAL files confirmed; deletions documented |
| RISK-2026-05/07/08/09/10: Documentation drift | RESOLVED — all corrections applied in LOGAN section |

---

## Required Next Command

```
AvengersAssemble → THOR  (if release gate is required)

No blocking findings remain. All SENTRY violations resolved.
Remaining items are LOW or MEDIUM deferred (not blocking).
```

---

## Document Status

**VERIFIED**

All blocking findings resolved. All SENTRY violations fixed and re-verified. Dead code deleted. Documentation drift corrected. Two low/medium deferred items remain but do not block release. Ready for AvengersAssemble → THOR if a formal release gate is required.
