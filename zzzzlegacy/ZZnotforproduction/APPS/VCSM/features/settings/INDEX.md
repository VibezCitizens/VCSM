---
name: vcsm.settings.index
description: VCSM settings feature source inventory — rebuilt by ARCHITECT V2 2026-06-04
metadata:
  type: index
  owner: ARCHITECT
  last-rebuilt: 2026-06-04
---

# INDEX — VCSM / features / settings

**Status:** ACTIVE
**Last rebuilt by ARCHITECT:** 2026-06-04
**Scanner version:** 1.1.0

## Source Inventory

| Layer | Count | Notes |
|---|---|---|
| Controllers | 28 | account.controller.js, vportDirectoryVisibility.controller.js, actorPrivacy.controller.js, vportBusinessCard.controller.js, saveProfile.controller.js, resolveVportIdByActorId.controller.js, listMyVports.controller.js, vportSocialSettings.controller.js, vportBusinessCardSettings.controller.js, authSession.controller.js, getAuthedUserId.controller.js, getProfileActorId.controller.js |
| DAL files | 33 | account.read.dal.js, account.write.dal.js, vports.read.dal.js, vports.write.dal.js, visibility.dal.js, blocks.dal.js, profile.read.dal.js, profile.write.dal.js, profileMediaAsset.write.dal.js, actorIdBySubject.read.dal.js, actors.read.dal.js, auth.read.dal.js (profile), auth.read.dal.js (vports), actorOwners.read.dal.js, vportPublicDetails.read.dal.js |
| Hooks | 38 | useVportsController.js, useVportsList.js, useVportSwitcher.js, useVportNotificationBadges.js, useVportBusinessCardSettings.js, useVportDirectoryVisibility.js, useProfileActor.js, useResolvedVportId.js, useAccountController.js, useVportAccountOps.js, useActorPrivacy.js, useActorLookup.js, useMyBlocks.jsx, usePendingFollowRequestActions.js, useProfileController.js, useProfileUploads.js |
| Models | 23 | vport.model.js, profile.model.js, vportPublicDetails.model.js, blocks.model.js, vportAboutDetails.model.js |
| Screens | 14 | SettingsScreen.jsx, PrivacyTab.view.jsx, AccountTab.view.jsx, VportsTab.view.jsx, ProfileTab.view.jsx, VportAboutDetails.view.jsx |
| Components | 38 | BlockedUsersSimple.jsx, PendingFollowRequests.jsx, ProfilePrivacyToggle.jsx, UserLookup.jsx, VportsBusinessCardSection.jsx, VportsCreateModal.jsx, VportsHardDeleteModal.jsx, VportsQrModal.jsx, VportsRecoverModal.jsx, VportsUnpublishModal.jsx, AccountTabSubComponents.jsx, HoursEditor.jsx, ProfessionalAccessButton.jsx, vportAboutDetailsFields.jsx, Card.jsx, Row.jsx, Omd.view.jsx |
| Adapters | 13 | settings.adapter.js, useMyBlocks.adapter.js, VportAboutDetails.view.adapter.js, Card.adapter.js, ProfileTab.jsx, UserProfileTab.jsx, VportProfileTab.jsx |
| Barrels | 4 | index.js (root — auto-generated), profile/index.js, vports/index.js, constants.js |
| Tests | 0 | No formal test files; diagnostics groups in apps/VCSM/src/dev/diagnostics/groups/ cover account and privacy/profile paths at runtime |
| Routes | 0 | No static route declarations captured by scanner; /settings is a navigated route in the app router |
| Total source files | 91 | Per scanner feature-map |

## Write Surface Map

| Operation | Schema | Table | Function |
|---|---|---|---|
| edge_function | — | — | dalDeleteCitizenAccountFull (delete-citizen-account Edge Fn) |
| rpc | — | — | dalSoftDeleteCitizenAccount (soft_delete_citizen_account) |
| rpc | — | — | dalDeleteMyVport (soft_delete_vport) |
| rpc | — | — | dalRestoreVport (restore_vport) |
| rpc | — | — | dalHardDeleteVport (hard_delete_vport) |
| rpc | moderation | — | dalInsertBlock (block_actor) |
| rpc | moderation | — | dalDeleteBlockByTarget (unblock_actor) |
| upsert | vc | actor_privacy_settings | dalSetActorPrivacy |
| update | vport | profiles | updateProfile (vport kind) |
| update | — | profiles | updateProfile (user kind) |
| update | — | profiles | updateUserPhotoMediaAssetIdDAL |
| update | — | profiles | updateUserBannerMediaAssetIdDAL |
| rpc | — | — | setVportBusinessCardPublishStateDAL (set_business_card_publish_state) |
| update | — | profiles | setVportBusinessCardSettingsDAL |
| update | — | profiles | setVportDirectoryVisibleDAL |
| update | — | profile_public_details | syncDirectoryVisibleToPublicDetailsDAL |

## Security-Sensitive Surfaces

- **delete-citizen-account (Edge Function)** — irreversible full account deletion; triggers Supabase Auth user deletion. Highest-risk write surface in the platform. Caller must be authenticated; Edge Function holds service role key.
- **soft_delete_citizen_account / hard_delete_vport RPCs** — destructive lifecycle mutations on actor data. hard_delete_vport requires prior soft-delete and controller-layer ownership assertion via assertActorOwnsVportActorController.
- **moderation.block_actor / unblock_actor RPCs** — moderation schema mutations. Block/unblock affects feed visibility and chat eligibility.
- **vc.actor_privacy_settings upsert** — privacy flag controls follow request flows and content visibility across the platform.

## Engine Dependencies

- booking (ownership assertion gate)
- directory (actor lookup in privacy tab)
- hydration (actor bundle hydration)
- identity (actor context, actor switching)
- media (profile photo/banner upload)
- notification (vport notification badges)
- profile (citizen profile reads/writes)
- qr (QR modal in Vports tab)

## Routes

No routes in route-map for this feature. The `/settings` screen is registered in the app router and navigated to programmatically; it does not appear in the static route scanner output.

## Documentation Links

| Doc | Status |
|---|---|
| BEHAVIOR.md | PRESENT (stub — no behavioral spec written) |
| ARCHITECTURE.md | PRESENT (this run) |
| CURRENT_STATUS.md | PRESENT (this run) |
