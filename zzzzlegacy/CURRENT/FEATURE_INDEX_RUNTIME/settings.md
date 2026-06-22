# Runtime Feature Index: settings

## Metadata

| Field | Value |
|---|---|
| Feature | settings |
| CURRENT Folder | CURRENT/features/settings |
| Source Folder | apps/VCSM/src/features/settings |
| Generated | 2026-06-02 |
| Scope | VCSM |
| Evidence Mode | Source scan + CURRENT evidence |

## Source Inventory

| Layer | Count | Key Files |
|---:|---:|---|
| Controllers | 15 | `account.controller.js`, `actorPrivacy.controller.js`, `Blocks.controller.js`, `profile.controller.js`, `saveProfile.controller.js`, `authSession.controller.js`, `recordProfileMediaAsset.controller.js`, `resolveVportIdByActorId.controller.js`, `listMyVports.controller.js`, `getAuthedUserId.controller.js`, `getProfileActorId.controller.js`, `vportBusinessCard.controller.js`, `vportBusinessCardSettings.controller.js`, `vportDirectoryVisibility.controller.js`, `vportSocialSettings.controller.js` |
| DALs | 16 | `account.read.dal.js`, `account.write.dal.js`, `blocks.dal.js`, `visibility.dal.js`, `actorIdBySubject.read.dal.js`, `actors.read.dal.js`, `auth.read.dal.js` (profile), `profile.read.dal.js`, `profile.write.dal.js`, `profileMediaAsset.write.dal.js`, `vportPublicDetails.read.dal.js`, `vportPublicDetails.write.dal.js`, `actorOwners.read.dal.js`, `auth.read.dal.js` (vports), `vports.read.dal.js`, `vports.write.dal.js` |
| Hooks | 22 | `useAccountController.js`, `useVportAccountOps.js`, `useActorPrivacy.js`, `useActorLookup.js`, `useMyBlocks.jsx`, `usePendingFollowRequestActions.js`, `useProfileController.js`, `useProfileUploads.js`, `useVportsController.js`, `useVportsList.js`, `useVportBusinessCardSettings.js`, `useVportDirectoryVisibility.js`, `useResolvedVportId.js`, `useProfileActor.js`, `useVportSwitcher.js`, `useVportNotificationBadges.js`, `queries/useAccountSettings.js`, `queries/useBlockedCitizens.js`, `queries/usePrivacySettings.js`, `queries/useProfileSettings.js`, `queries/useUpdateVportVisibility.js`, `queries/useUserVports.js` |
| Models | 5 | `blocks.model.js`, `vport.model.js`, `profile.model.js`, `vportPublicDetails.model.js`, `profile/ui/vportAboutDetails.model.js` (LAYER VIOLATION — model in UI folder) |
| Screens | 1 | `screen/SettingsScreen.jsx` |
| Components | 18 | `ui/Card.jsx`, `ui/Row.jsx`, `account/ui/AccountTab.view.jsx`, `account/ui/AccountTabSubComponents.jsx`, `privacy/ui/PrivacyTab.view.jsx`, `privacy/ui/BlockedUsersSimple.jsx`, `privacy/ui/PendingFollowRequests.jsx`, `privacy/ui/ProfilePrivacyToggle.jsx`, `privacy/ui/UserLookup.jsx`, `vports/ui/VportsTab.view.jsx`, `vports/ui/VportsBusinessCardSection.jsx`, `vports/ui/VportsCreateModal.jsx`, `vports/ui/VportsHardDeleteModal.jsx`, `vports/ui/VportsQrModal.jsx`, `vports/ui/VportsRecoverModal.jsx`, `vports/ui/VportsUnpublishModal.jsx`, `profile/ui/ProfileTab.view.jsx`, `profile/ui/HoursEditor.jsx` |
| Routes | 2 | `/settings` (hub, AUTH), `/vport/:actorId/settings` (OWNER — dashboard card) |
| Tests | 0 | NONE FOUND — zero test coverage confirmed SPM-007 |

## Route / Screen Map

| Route / Screen | Source Path | Public/Auth/Owner | Notes |
|---|---|---|---|
| `/settings` | `screen/SettingsScreen.jsx` | AUTH | Tab hub: privacy, profile, account, vports |
| `/settings?tab=privacy` | `privacy/ui/PrivacyTab.view.jsx` | AUTH | Block management, privacy toggle, follow requests |
| `/settings?tab=profile` | `profile/adapter/ProfileTab.jsx` | AUTH | User or VPORT profile editor |
| `/settings?tab=account` | `account/ui/AccountTab.view.jsx` | AUTH | Account delete, VPORT soft/hard delete/restore, logout |
| `/settings?tab=vports` | `vports/ui/VportsTab.view.jsx` | AUTH | VPORT list, business card, directory visibility |
| `/vport/:actorId/settings` | `dashboard/vport/screens/VportSettingsFinalScreen.jsx` | OWNER | Dashboard card entry — VPORT-specific settings, separate entry point |

## Mutation Surface Map

| Surface | Source Path | Write Type | Ownership Gate Known | Risk |
|---|---|---|---|---|
| `ctrlDeleteAccount` (account.controller) | `account/controller/account.controller.js` | DELETE cascade (Edge Function) | YES — SECURITY DEFINER RPC + Edge Function | HIGH |
| `ctrlSoftDeleteVport` (account.controller) | `account/controller/account.controller.js` | SOFT_DELETE VPORT (RPC) | YES — SECURITY DEFINER RPC `soft_delete_vport` | HIGH |
| `ctrlHardDeleteVport` (account.controller) | `account/controller/account.controller.js` | HARD_DELETE VPORT (RPC) | YES — `assertActorOwnsVportActorController` + SECURITY DEFINER RPC | HIGH |
| `ctrlRestoreVport` (account.controller) | `account/controller/account.controller.js` | RESTORE VPORT (RPC) | PARTIAL — no controller gate; relies on RPC | MEDIUM |
| `ctrlSetActorPrivacy` (actorPrivacy.controller) | `privacy/controller/actorPrivacy.controller.js` | UPSERT `vc.actor_privacy_settings` | NO — ELEK-002 HIGH DEFERRED: callerActorId is caller-supplied; no server-side session binding | HIGH |
| `ctrlBlockActor` (Blocks.controller) | `privacy/controller/Blocks.controller.js` | INSERT `moderation.blocks` (via RPC) | YES — string equality `callerActorId === actorId` | MEDIUM |
| `ctrlUnblockActor` (Blocks.controller) | `privacy/controller/Blocks.controller.js` | DELETE `moderation.blocks` (via RPC) | YES — string equality `callerActorId === actorId` | MEDIUM |
| `saveProfileCore` (profile.controller) | `profile/controller/profile.controller.js` | UPDATE `public.profiles` / `vport.profiles` | PARTIAL — VPORT: `owner_user_id = auth.uid()` DAL guard; user: session RLS only; no controller-layer gate | MEDIUM |
| `ctrlSetVportBusinessCardPublishState` (vportBusinessCard.controller) | `vports/controller/vportBusinessCard.controller.js` | RPC `vport.set_business_card_publish_state` | YES — `assertActorOwnsVportActorController` | MEDIUM |
| `ctrlSetVportBusinessCardSettings` (vportBusinessCardSettings.controller) | `vports/controller/vportBusinessCardSettings.controller.js` | UPDATE `vport.profiles`.`business_card_settings` | YES — `assertActorOwnsVportActorController` + DAL `owner_user_id` | MEDIUM |
| `ctrlSetVportDirectoryVisible` (vportDirectoryVisibility.controller) | `vports/controller/vportDirectoryVisibility.controller.js` | UPDATE `vport.profiles`.`directory_visible` + sync `profile_public_details` | YES — `assertActorOwnsVportActorController` + DAL `owner_user_id` | MEDIUM |
| `ctrlUpdateVportSocialSettings` (vportSocialSettings.controller) | `vports/controller/vportSocialSettings.controller.js` | UPDATE `vc.actor_social_settings` | YES — `assertActorOwnsVportActorController`; BLOCKED by TICKET-SUB-010-B RLS migration | HIGH |
| `dalSetActorPrivacy` (visibility.dal) | `privacy/dal/visibility.dal.js` | UPSERT `vc.actor_privacy_settings` | NO — ELEK-004 HIGH DEFERRED: no `auth.getUser()` binding; RLS unconfirmed | HIGH |
| `upsertVportPublicDetailsDAL` (vportPublicDetails.write.dal) | `profile/dal/vportPublicDetails.write.dal.js` | UPSERT `vport.profile_public_details` | PARTIAL — BW-SETTINGS-005: no optimistic lock | MEDIUM |

## Security-Sensitive Surface Map

| Surface | Source Path | Sensitivity | Evidence |
|---|---|---|---|
| `ctrlSetActorPrivacy` | `privacy/controller/actorPrivacy.controller.js` | OWNERSHIP + PRIVACY | ELEK-002 (HIGH, DEFERRED): actor privacy hijack via caller-supplied actorId |
| `dalSetActorPrivacy` | `privacy/dal/visibility.dal.js` | DB_RLS | ELEK-004 (HIGH, DEFERRED): no auth.getUser(); vc.actor_privacy_settings RLS unconfirmed |
| `dalDeleteOwnedVportById` | `account/dal/account.write.dal.js` (inferred — legacy) | OWNERSHIP | ELEK-005 (OPEN): deprecated DAL using legacy owner_user_id; no cascade |
| `listMyVportsDAL` / `readMyVports` | `vports/dal/vports.read.dal.js` | IDENTITY | VENOM-SETTINGS-004 (P2, DEFERRED): owner_user_id query; rewrite to actor_owners pending |
| `ctrlUpdateVportSocialSettings` | `vports/controller/vportSocialSettings.controller.js` | DB_RLS | TICKET-SUB-010-B: actor_social_settings owner-delegation RLS migration not applied |
| `upsertVportPublicDetailsDAL` | `profile/dal/vportPublicDetails.write.dal.js` | REPLAY | BW-SETTINGS-005 (OPEN): no optimistic locking |
| Social DAL direct import | `vports/controller/vportSocialSettings.controller.js` | BOUNDARY_VIOLATION | Imports directly from `@/features/social/privacy/dal/actorSocialSettings.dal` — bypasses adapter boundary |

## Open Findings Summary

| Finding | Severity | Status | Blocking |
|---|---|---|---|
| ELEK-002: ctrlSetActorPrivacy no server-side ownership | HIGH | DEFERRED | No sprint assigned |
| ELEK-004: dalSetActorPrivacy no auth.getUser() binding | HIGH | DEFERRED | No sprint assigned |
| TICKET-SUB-010-B: actor_social_settings RLS migration | BLOCKER | PENDING | Blocks social settings write path |
| ELEK-005: deprecated DAL still live | MEDIUM | OPEN | Technical debt |
| VENOM-SETTINGS-004: owner_user_id in read DALs | P2 | DEFERRED | No sprint assigned |
| BW-SETTINGS-005: no optimistic locking on public details upsert | MEDIUM | OPEN | No sprint assigned |
| Layer violation: model in UI folder | LOW | OPEN | Technical debt |
| Adapter boundary violation: social DAL direct import | MEDIUM | OPEN | Technical debt |
| queries/ folder: 6 hooks dead-code status unconfirmed | LOW | OPEN | Audit required |
| Zero test coverage | CRITICAL | OPEN (SPM-007) | No sprint assigned |

## Recommended Next Command

SENTRY — post-execution review on TICKET-0009 changes. Then apply TICKET-SUB-010-B migration and run scoped VENOM+ELEKTRA on the privacy controller stack (ELEK-002/004).
