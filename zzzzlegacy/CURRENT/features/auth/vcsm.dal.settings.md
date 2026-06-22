# VCSM DAL — `settings`

_Generated:_ 2026-05-11  
_Source:_ ARCHITECT static scan · `apps/VCSM/src/features/settings/dal/`  
_Confidence:_ STATICALLY\_TRACED  

---

## Summary

| Item | Count |
|---|---|
| DAL files | 16 |
| Exported functions | 33 |
| Tables accessed | 5 |
| RPCs called | 10 |
| Risk findings | 2 |

## DAL Files

### `account.read.dal.js`

**Path:** `features/settings/account/dal/account.read.dal.js`  
**Operations:** `read`  

**Exported functions:**

| `dalReadVportIdByActorId` | `read` | `actors` |

### `account.write.dal.js`

**Path:** `features/settings/account/dal/account.write.dal.js`  
**Operations:** `update` · `rpc`  

**Exported functions:**

| `dalDeleteCitizenAccountFull` | `update` · `rpc` | `profiles`, `soft_delete_citizen_account`, `soft_delete_vport`, `restore_vport`, `hard_delete_vport` |
| `dalDeleteMyVport` | `update` · `rpc` | `profiles`, `soft_delete_citizen_account`, `soft_delete_vport`, `restore_vport`, `hard_delete_vport` |
| `dalDeleteOwnedVportById` | `update` · `rpc` | `profiles`, `soft_delete_citizen_account`, `soft_delete_vport`, `restore_vport`, `hard_delete_vport` |
| `dalHardDeleteVport` | `update` · `rpc` | `profiles`, `soft_delete_citizen_account`, `soft_delete_vport`, `restore_vport`, `hard_delete_vport` |
| `dalRestoreVport` | `update` · `rpc` | `profiles`, `soft_delete_citizen_account`, `soft_delete_vport`, `restore_vport`, `hard_delete_vport` |
| `dalSoftDeleteCitizenAccount` | `update` · `rpc` | `profiles`, `soft_delete_citizen_account`, `soft_delete_vport`, `restore_vport`, `hard_delete_vport` |

### `actorIdBySubject.read.dal.js`

**Path:** `features/settings/profile/dal/actorIdBySubject.read.dal.js`  
**Operations:** `read`  

**Exported functions:**

| `dalReadActorIdByProfileId` | `read` | `actors` |
| `dalReadActorIdByVportId` | `read` | `actors` |

### `actorOwners.read.dal.js`

**Path:** `features/settings/vports/dal/actorOwners.read.dal.js`  
**Operations:** `read`  

**Exported functions:**

| `readActorOwnersByUserDAL` | `read` | `actor_owners` |

### `actors.read.dal.js`

**Path:** `features/settings/profile/dal/actors.read.dal.js`  
**Operations:** `read`  

**Exported functions:**

| `dalReadVportIdByActorId` | `read` | `actors` |

### `auth.read.dal.js`

**Path:** `features/settings/profile/dal/auth.read.dal.js`  
**Operations:** `unknown`  

**Exported functions:**

| `dalGetCurrentAuthUserId` | `unknown` | — |

### `auth.read.dal.js`

**Path:** `features/settings/vports/dal/auth.read.dal.js`  
**Operations:** `unknown`  

**Exported functions:**

| `readAuthedUserDAL` | `unknown` | — |

### `blocks.dal.js`

**Path:** `features/settings/privacy/dal/blocks.dal.js`  
**Operations:** `read` · `rpc`  

**Exported functions:**

| `dalDeleteBlockByTarget` | `read` · `rpc` | —`actors`, `blocks`, `block_actor`, `unblock_actor`, `search_actor_directory` |
| `dalInsertBlock` | `read` · `rpc` | —`actors`, `blocks`, `block_actor`, `unblock_actor`, `search_actor_directory` |
| `dalListMyBlocks` | `read` · `rpc` | —`actors`, `blocks`, `block_actor`, `unblock_actor`, `search_actor_directory` |
| `dalReadActorKindAndVportId` | `read` · `rpc` | —`actors`, `blocks`, `block_actor`, `unblock_actor`, `search_actor_directory` |
| `dalSearchActors` | `read` · `rpc` | —`actors`, `blocks`, `block_actor`, `unblock_actor`, `search_actor_directory` |

### `profile.read.dal.js`

**Path:** `features/settings/profile/dal/profile.read.dal.js`  
**Operations:** `read`  

**Exported functions:**

| `fetchProfile` | `read` | `profiles` |

### `profile.write.dal.js`

**Path:** `features/settings/profile/dal/profile.write.dal.js`  
**Operations:** `read` · `update`  

**Exported functions:**

| `updateProfile` | `read` · `update` | `profiles` |

### `profileMediaAsset.write.dal.js`

**Path:** `features/settings/profile/dal/profileMediaAsset.write.dal.js`  
**Operations:** `update`  

**Exported functions:**

| `updateUserBannerMediaAssetIdDAL` | `update` | `profiles` |
| `updateUserPhotoMediaAssetIdDAL` | `update` | `profiles` |

### `visibility.dal.js`

**Path:** `features/settings/privacy/dal/visibility.dal.js`  
**Operations:** `read` · `upsert`  

**Exported functions:**

| `dalGetActorPrivacy` | `read` · `upsert` | `actor_privacy_settings` |
| `dalSetActorPrivacy` | `read` · `upsert` | `actor_privacy_settings` |

### `vportPublicDetails.read.dal.js`

**Path:** `features/settings/profile/dal/vportPublicDetails.read.dal.js`  
**Operations:** `read`  

**Exported functions:**

| `fetchVportPublicDetails` | `read` | `profile_public_details` |

### `vportPublicDetails.write.dal.js`

**Path:** `features/settings/profile/dal/vportPublicDetails.write.dal.js`  
**Operations:** `read` · `upsert`  

**Exported functions:**

| `upsertVportPublicDetails` | `read` · `upsert` | `profile_public_details` |

### `vports.read.dal.js`

**Path:** `features/settings/vports/dal/vports.read.dal.js`  
**Operations:** `read`  

**Exported functions:**

| `listMyVportsDAL` | `read` | `profiles` |
| `readMyVports` | `read` | `profiles` |
| `readVportBusinessCardSettingsDAL` | `read` | `profiles` |
| `readVportDirectoryStateDAL` | `read` | `profiles` |

> **🟠 HIGH** — Contains ownership/role/status checks — business logic should live in a Controller, not a DAL.

### `vports.write.dal.js`

**Path:** `features/settings/vports/dal/vports.write.dal.js`  
**Operations:** `read` · `update` · `rpc`  

**Exported functions:**

| `setVportBusinessCardPublishStateDAL` | `read` · `update` · `rpc` | `profile_public_details`, `profiles`, `set_business_card_publish_state` |
| `setVportBusinessCardSettingsDAL` | `read` · `update` · `rpc` | `profile_public_details`, `profiles`, `set_business_card_publish_state` |
| `setVportDirectoryVisibleDAL` | `read` · `update` · `rpc` | `profile_public_details`, `profiles`, `set_business_card_publish_state` |

> **🟠 HIGH** — Contains ownership/role/status checks — business logic should live in a Controller, not a DAL.

---

## Tables Accessed

| Table | Operations | Via Functions |
|---|---|---|
| `actor_owners` | READ | `readActorOwnersByUserDAL` |
| `actor_privacy_settings` | UPSERT | `dalGetActorPrivacy`, `dalSetActorPrivacy` |
| `actors` | READ | `dalReadActorIdByProfileId`, `dalReadActorIdByVportId`, `dalReadVportIdByActorId` |
| `profile_public_details` | READ, UPDATE, UPSERT | `fetchVportPublicDetails`, `setVportBusinessCardPublishStateDAL`, `setVportBusinessCardSettingsDAL`, `setVportDirectoryVisibleDAL`, `upsertVportPublicDetails` |
| `profiles` | READ, UPDATE | `dalDeleteCitizenAccountFull`, `dalDeleteMyVport`, `dalDeleteOwnedVportById`, `dalHardDeleteVport`, `dalRestoreVport`, `dalSoftDeleteCitizenAccount`, `fetchProfile`, `listMyVportsDAL`, `readMyVports`, `readVportBusinessCardSettingsDAL`, `readVportDirectoryStateDAL`, `setVportBusinessCardPublishStateDAL`, `setVportBusinessCardSettingsDAL`, `setVportDirectoryVisibleDAL`, `updateProfile`, `updateUserBannerMediaAssetIdDAL`, `updateUserPhotoMediaAssetIdDAL` |

## RPCs Called

| RPC | Via Functions |
|---|---|
| `actors` | `dalDeleteBlockByTarget`, `dalInsertBlock`, `dalListMyBlocks`, `dalReadActorKindAndVportId`, `dalSearchActors` |
| `block_actor` | `dalDeleteBlockByTarget`, `dalInsertBlock`, `dalListMyBlocks`, `dalReadActorKindAndVportId`, `dalSearchActors` |
| `blocks` | `dalDeleteBlockByTarget`, `dalInsertBlock`, `dalListMyBlocks`, `dalReadActorKindAndVportId`, `dalSearchActors` |
| `hard_delete_vport` | `dalDeleteCitizenAccountFull`, `dalDeleteMyVport`, `dalDeleteOwnedVportById`, `dalHardDeleteVport`, `dalRestoreVport`, `dalSoftDeleteCitizenAccount` |
| `restore_vport` | `dalDeleteCitizenAccountFull`, `dalDeleteMyVport`, `dalDeleteOwnedVportById`, `dalHardDeleteVport`, `dalRestoreVport`, `dalSoftDeleteCitizenAccount` |
| `search_actor_directory` | `dalDeleteBlockByTarget`, `dalInsertBlock`, `dalListMyBlocks`, `dalReadActorKindAndVportId`, `dalSearchActors` |
| `set_business_card_publish_state` | `setVportBusinessCardPublishStateDAL`, `setVportBusinessCardSettingsDAL`, `setVportDirectoryVisibleDAL` |
| `soft_delete_citizen_account` | `dalDeleteCitizenAccountFull`, `dalDeleteMyVport`, `dalDeleteOwnedVportById`, `dalHardDeleteVport`, `dalRestoreVport`, `dalSoftDeleteCitizenAccount` |
| `soft_delete_vport` | `dalDeleteCitizenAccountFull`, `dalDeleteMyVport`, `dalDeleteOwnedVportById`, `dalHardDeleteVport`, `dalRestoreVport`, `dalSoftDeleteCitizenAccount` |
| `unblock_actor` | `dalDeleteBlockByTarget`, `dalInsertBlock`, `dalListMyBlocks`, `dalReadActorKindAndVportId`, `dalSearchActors` |

---

## Risk Findings

### 🟠 HIGH — `vports.read.dal.js`

**Risk:** `possible_business_logic`  
**File:** `features/settings/vports/dal/vports.read.dal.js`  
**Detail:** Contains ownership/role/status checks — business logic should live in a Controller, not a DAL.

**Recommended action:** Route this logic to the Controller layer. DAL must be pure data access.

### 🟠 HIGH — `vports.write.dal.js`

**Risk:** `possible_business_logic`  
**File:** `features/settings/vports/dal/vports.write.dal.js`  
**Detail:** Contains ownership/role/status checks — business logic should live in a Controller, not a DAL.

**Recommended action:** Route this logic to the Controller layer. DAL must be pure data access.

---

## Pending Reviews

| Command | Reason | Status |
|---|---|---|
| SENTRY | DAL risk findings require architecture boundary review | PENDING |
| VENOM  | Risk findings may affect trust boundaries | PENDING |
| IRONMAN | Confirm ownership of risk-flagged files | PENDING |

---

## Call Chains

Who calls each DAL file — traced from DAL up to Screen.

### `account.read.dal.js`

**Direct callers:**

- `settingsAccountFeature.group.js` _Other_
- `account.controller.js` _Controller_

**Full call chain to screen:**

```
`account.read.dal.js` → `settingsAccountFeature.group.js` → `diagnosticsGroups.part2.js` → `runAllDiagnostics.js` → `DevDiagnosticsScreen.jsx`
```

### `account.write.dal.js`

**Direct callers:**

- `settingsAccountFeature.group.js` _Other_
- `account.controller.js` _Controller_

**Full call chain to screen:**

```
`account.write.dal.js` → `settingsAccountFeature.group.js` → `diagnosticsGroups.part2.js` → `runAllDiagnostics.js` → `DevDiagnosticsScreen.jsx`
```

### `blocks.dal.js`

**Direct callers:**

- `settingsPrivacyFeature.group.js` _Other_
- `Blocks.controller.js` _Controller_

**Full call chain to screen:**

```
`blocks.dal.js` → `settingsPrivacyFeature.group.js` → `diagnosticsGroups.part2.js` → `runAllDiagnostics.js` → `DevDiagnosticsScreen.jsx`
```

### `visibility.dal.js`

**Direct callers:**

- `settingsPrivacyFeature.group.js` _Other_
- `actorPrivacy.controller.js` _Controller_

**Full call chain to screen:**

```
`visibility.dal.js` → `settingsPrivacyFeature.group.js` → `diagnosticsGroups.part2.js` → `runAllDiagnostics.js` → `DevDiagnosticsScreen.jsx`
```

### `actorIdBySubject.read.dal.js`

**Direct callers:**

- `profile.controller.js` _Controller_

**Partial chain (no screen reached):  **

```
`actorIdBySubject.read.dal.js` → `profile.controller.js`
```
```
`actorIdBySubject.read.dal.js` → `profile.controller.js` → `settingsProfileFeature.group.js`
```
```
`actorIdBySubject.read.dal.js` → `profile.controller.js` → `useProfileController.js`
```

### `actors.read.dal.js`

**Direct callers:**

- `settingsProfileFeature.group.js` _Other_
- `resolveVportIdByActorId.controller.js` _Controller_

**Full call chain to screen:**

```
`actors.read.dal.js` → `resolveVportIdByActorId.controller.js` → `useVportBusinessCardSettings.js` → `VportSettingsScreen.jsx`
```
```
`actors.read.dal.js` → `settingsProfileFeature.group.js` → `diagnosticsGroups.part2.js` → `runAllDiagnostics.js` → `DevDiagnosticsScreen.jsx`
```

### `auth.read.dal.js`

**Direct callers:**

- `settingsProfileFeature.group.js` _Other_
- `authSession.controller.js` _Controller_

**Full call chain to screen:**

```
`auth.read.dal.js` → `settingsProfileFeature.group.js` → `diagnosticsGroups.part2.js` → `runAllDiagnostics.js` → `DevDiagnosticsScreen.jsx`
```

### `profile.read.dal.js`

**Direct callers:**

- `settingsProfileFeature.group.js` _Other_
- `profile.controller.js` _Controller_

**Full call chain to screen:**

```
`profile.read.dal.js` → `settingsProfileFeature.group.js` → `diagnosticsGroups.part2.js` → `runAllDiagnostics.js` → `DevDiagnosticsScreen.jsx`
```

### `profile.write.dal.js`

**Direct callers:**

- `settingsProfileFeature.group.js` _Other_
- `profile.controller.js` _Controller_
- `saveProfile.controller.js` _Controller_

**Full call chain to screen:**

```
`profile.write.dal.js` → `settingsProfileFeature.group.js` → `diagnosticsGroups.part2.js` → `runAllDiagnostics.js` → `DevDiagnosticsScreen.jsx`
```

### `profileMediaAsset.write.dal.js`

**Direct callers:**

- `recordProfileMediaAsset.controller.js` _Controller_

**Partial chain (no screen reached):  **

```
`profileMediaAsset.write.dal.js` → `recordProfileMediaAsset.controller.js`
```
```
`profileMediaAsset.write.dal.js` → `recordProfileMediaAsset.controller.js` → `useProfileUploads.js`
```
```
`profileMediaAsset.write.dal.js` → `recordProfileMediaAsset.controller.js` → `useProfileUploads.js` → `settingsProfileFeature.group.js`
```

### `vportPublicDetails.read.dal.js`

**Direct callers:**

- `settingsProfileFeature.group.js` _Other_

**Full call chain to screen:**

```
`vportPublicDetails.read.dal.js` → `settingsProfileFeature.group.js` → `diagnosticsGroups.part2.js` → `runAllDiagnostics.js` → `DevDiagnosticsScreen.jsx`
```

### `vportPublicDetails.write.dal.js`

**Direct callers:**

- `settingsProfileFeature.group.js` _Other_

**Full call chain to screen:**

```
`vportPublicDetails.write.dal.js` → `settingsProfileFeature.group.js` → `diagnosticsGroups.part2.js` → `runAllDiagnostics.js` → `DevDiagnosticsScreen.jsx`
```

### `actorOwners.read.dal.js`

**Direct callers:**

- `settingsFeature.group.js` _Other_
- `getProfileActorId.controller.js` _Controller_

**Full call chain to screen:**

```
`actorOwners.read.dal.js` → `settingsFeature.group.js` → `diagnosticsGroups.part2.js` → `runAllDiagnostics.js` → `DevDiagnosticsScreen.jsx`
```

### `auth.read.dal.js`

**Direct callers:**

- `settingsFeature.group.js` _Other_
- `getAuthedUserId.controller.js` _Controller_

**Full call chain to screen:**

```
`auth.read.dal.js` → `settingsFeature.group.js` → `diagnosticsGroups.part2.js` → `runAllDiagnostics.js` → `DevDiagnosticsScreen.jsx`
```

### `vports.read.dal.js`

**Direct callers:**

- `settingsFeature.group.js` _Other_
- `listMyVports.controller.js` _Controller_
- `vportBusinessCardSettings.controller.js` _Controller_
- `vportDirectoryVisibility.controller.js` _Controller_

**Full call chain to screen:**

```
`vports.read.dal.js` → `vportBusinessCardSettings.controller.js` → `useVportBusinessCardSettings.js` → `VportSettingsScreen.jsx`
```
```
`vports.read.dal.js` → `settingsFeature.group.js` → `diagnosticsGroups.part2.js` → `runAllDiagnostics.js` → `DevDiagnosticsScreen.jsx`
```

### `vports.write.dal.js`

**Direct callers:**

- `vportBusinessCard.controller.js` _Controller_
- `vportBusinessCardSettings.controller.js` _Controller_
- `vportDirectoryVisibility.controller.js` _Controller_

**Full call chain to screen:**

```
`vports.write.dal.js` → `vportBusinessCardSettings.controller.js` → `useVportBusinessCardSettings.js` → `VportSettingsScreen.jsx`
```

---

## Architecture Pipeline

Full build order for this feature — `DAL → Model → Controller → Hook → Components → View Screen → Final Screen`

| Layer | Status | Files |
|---|---|---|
| **DAL** | ✓ PRESENT | _(documented above)_ |
| **Model** | ✓ PRESENT | `blocks.model.js`, `profile.model.js`, `vportPublicDetails.model.js`, `vportAboutDetails.model.js`, `vport.model.js` |
| **Controller** | ✓ PRESENT | `account.controller.js`, `Blocks.controller.js`, `actorPrivacy.controller.js`, `authSession.controller.js`, `profile.controller.js`, `recordProfileMediaAsset.controller.js` +8 more |
| **Adapter** | ✓ PRESENT | `useMyBlocks.adapter.js`, `VportAboutDetails.view.adapter.js`, `settings.adapter.js`, `Card.adapter.js` |
| **Service** | ✗ MISSING | — |
| **Hook** | ✓ PRESENT | `useAccountController.js`, `useVportAccountOps.js`, `useActorLookup.js`, `useActorPrivacy.js`, `useMyBlocks.jsx`, `usePendingFollowRequestActions.js` +15 more |
| **Component** | ✓ PRESENT | `AccountTabSubComponents.jsx` |
| **View Screen** | ✗ MISSING | — |
| **Final Screen** | ✗ MISSING | — |

### Model

_Pure transforms — no side effects, no DB access_

- `features/settings/privacy/models/blocks.model.js`
- `features/settings/profile/model/profile.model.js`
- `features/settings/profile/model/vportPublicDetails.model.js`
- `features/settings/profile/ui/vportAboutDetails.model.js`
- `features/settings/vports/model/vport.model.js`

### Controller

_Business rules, ownership, permissions — no React_

- `features/settings/account/controller/account.controller.js`
- `features/settings/privacy/controller/Blocks.controller.js`
- `features/settings/privacy/controller/actorPrivacy.controller.js`
- `features/settings/profile/controller/authSession.controller.js`
- `features/settings/profile/controller/profile.controller.js`
- `features/settings/profile/controller/recordProfileMediaAsset.controller.js`
- `features/settings/profile/controller/resolveVportIdByActorId.controller.js`
- `features/settings/profile/controller/saveProfile.controller.js`
- `features/settings/vports/controller/getAuthedUserId.controller.js`
- `features/settings/vports/controller/getProfileActorId.controller.js`
- `features/settings/vports/controller/listMyVports.controller.js`
- `features/settings/vports/controller/vportBusinessCard.controller.js`
- `features/settings/vports/controller/vportBusinessCardSettings.controller.js`
- `features/settings/vports/controller/vportDirectoryVisibility.controller.js`

### Adapter

_Cross-feature boundary — only approved cross-feature access point_

- `features/settings/adapters/privacy/hooks/useMyBlocks.adapter.js`
- `features/settings/adapters/profile/ui/VportAboutDetails.view.adapter.js`
- `features/settings/adapters/settings.adapter.js`
- `features/settings/adapters/ui/Card.adapter.js`

### Hook

_Lifecycle / timing / state wiring — no business rules_

- `features/settings/account/hooks/useAccountController.js`
- `features/settings/account/hooks/useVportAccountOps.js`
- `features/settings/privacy/hooks/useActorLookup.js`
- `features/settings/privacy/hooks/useActorPrivacy.js`
- `features/settings/privacy/hooks/useMyBlocks.jsx`
- `features/settings/privacy/hooks/usePendingFollowRequestActions.js`
- `features/settings/profile/hooks/useProfileController.js`
- `features/settings/profile/hooks/useProfileUploads.js`
- `features/settings/queries/useAccountSettings.js`
- `features/settings/queries/useBlockedCitizens.js`
- `features/settings/queries/usePrivacySettings.js`
- `features/settings/queries/useProfileSettings.js`
- `features/settings/queries/useUpdateVportVisibility.js`
- `features/settings/queries/useUserVports.js`
- `features/settings/vports/hooks/useProfileActor.js`
- `features/settings/vports/hooks/useVportBusinessCardSettings.js`
- `features/settings/vports/hooks/useVportDirectoryVisibility.js`
- `features/settings/vports/hooks/useVportNotificationBadges.js`
- `features/settings/vports/hooks/useVportSwitcher.js`
- `features/settings/vports/hooks/useVportsController.js`
- `features/settings/vports/hooks/useVportsList.js`

### Component

_Presentational only — no hooks, no data fetching_

- `features/settings/account/ui/components/AccountTabSubComponents.jsx`

### Missing Layers

- 🟡 **Service** — not detected in static scan
- 🟡 **View Screen** — not detected in static scan
- 🟡 **Final Screen** — not detected in static scan

> Missing layers may exist but use naming patterns not detected by static scan, or may be delegated to engines.

---

## Dead Code Audit

_Audited:_ 2026-05-11  
_Method:_ Static import trace — grep across all `.js`/`.jsx` in `apps/VCSM/src/`, production callers only (diagnostics excluded)  
_Auditor:_ ARCHITECT

---

### Verdict: 5 Diagnostics-Only Functions + 1 Duplicate Implementation

| Function | File | Production Status |
|---|---|---|
| `dalReadVportIdByActorId` | `account.read.dal.js` | LIVE — but identical duplicate of `actors.read.dal.js` version |
| `dalDeleteCitizenAccountFull` | `account.write.dal.js` | LIVE |
| `dalDeleteMyVport` | `account.write.dal.js` | LIVE |
| `dalDeleteOwnedVportById` | `account.write.dal.js` | **DIAGNOSTICS ONLY** |
| `dalHardDeleteVport` | `account.write.dal.js` | LIVE |
| `dalRestoreVport` | `account.write.dal.js` | LIVE |
| `dalSoftDeleteCitizenAccount` | `account.write.dal.js` | **DIAGNOSTICS ONLY** |
| `dalReadActorIdByProfileId` | `actorIdBySubject.read.dal.js` | LIVE |
| `dalReadActorIdByVportId` | `actorIdBySubject.read.dal.js` | LIVE |
| `readActorOwnersByUserDAL` | `actorOwners.read.dal.js` | LIVE |
| `dalReadVportIdByActorId` | `actors.read.dal.js` | LIVE — but identical duplicate of `account.read.dal.js` version |
| `dalGetCurrentAuthUserId` | `auth.read.dal.js` (profile) | LIVE |
| `readAuthedUserDAL` | `auth.read.dal.js` (vports) | LIVE |
| `dalDeleteBlockByTarget` | `blocks.dal.js` | LIVE |
| `dalInsertBlock` | `blocks.dal.js` | LIVE |
| `dalListMyBlocks` | `blocks.dal.js` | LIVE |
| `dalReadActorKindAndVportId` | `blocks.dal.js` | LIVE |
| `dalSearchActors` | `blocks.dal.js` | LIVE |
| `fetchProfile` | `profile.read.dal.js` | LIVE |
| `updateProfile` | `profile.write.dal.js` | LIVE |
| `updateUserBannerMediaAssetIdDAL` | `profileMediaAsset.write.dal.js` | LIVE |
| `updateUserPhotoMediaAssetIdDAL` | `profileMediaAsset.write.dal.js` | LIVE |
| `dalGetActorPrivacy` | `visibility.dal.js` | LIVE |
| `dalSetActorPrivacy` | `visibility.dal.js` | LIVE |
| `fetchVportPublicDetails` | `vportPublicDetails.read.dal.js` | **DIAGNOSTICS ONLY** |
| `upsertVportPublicDetails` | `vportPublicDetails.write.dal.js` | **DIAGNOSTICS ONLY** |
| `listMyVportsDAL` | `vports.read.dal.js` | LIVE |
| `readMyVports` | `vports.read.dal.js` | **DIAGNOSTICS ONLY** |
| `readVportBusinessCardSettingsDAL` | `vports.read.dal.js` | LIVE |
| `readVportDirectoryStateDAL` | `vports.read.dal.js` | LIVE |
| `setVportBusinessCardPublishStateDAL` | `vports.write.dal.js` | LIVE |
| `setVportBusinessCardSettingsDAL` | `vports.write.dal.js` | LIVE |
| `setVportDirectoryVisibleDAL` | `vports.write.dal.js` | LIVE |

---

### Dead Code Finding #1 — `fetchVportPublicDetails` + `upsertVportPublicDetails`

**Files:**
- `features/settings/profile/dal/vportPublicDetails.read.dal.js` → `fetchVportPublicDetails`
- `features/settings/profile/dal/vportPublicDetails.write.dal.js` → `upsertVportPublicDetails`

**Classification:** DIAGNOSTICS ONLY — no production controller caller

**Evidence:**
- Both functions appear only in `dev/diagnostics/groups/settingsProfileFeature.group.js`
- No controller in `features/settings/` imports either function
- Production equivalents exist in other features under different names:
  - `fetchVportPublicDetailsByActorId` in `features/profiles/dal/` — used by profiles feature controller
  - `upsertVportPublicDetailsDAL` in `features/dashboard/vport/dal/write/` — used by dashboard controller
- The settings versions appear to have been superseded by these feature-specific implementations and never wired to a production controller

**Risk:** MEDIUM — two DAL files with no production caller. The superseding functions in `profiles/` and `dashboard/` serve the same data surface with different signatures. Risk of confusion if a developer searches for vport public detail access and finds the settings versions first.  
**Recommended action:** DELETE CANDIDATES — verify no planned settings-specific controller for these, then remove both files. Update the diagnostics group to import from the canonical production versions.  
**Handoffs:** IRONMAN (confirm no planned settings controller), LOGAN (remove from Architecture Pipeline)

---

### Dead Code Finding #2 — `dalSoftDeleteCitizenAccount` + `dalDeleteOwnedVportById`

**File:** `features/settings/account/dal/account.write.dal.js`  
**Classification:** DIAGNOSTICS ONLY — not imported by the production controller

**Evidence:**
- `account.controller.js` imports: `dalDeleteCitizenAccountFull`, `dalDeleteMyVport`, `dalHardDeleteVport`, `dalRestoreVport` — the four production operations
- `dalSoftDeleteCitizenAccount` and `dalDeleteOwnedVportById` are NOT in the controller import list
- Both appear only in `dev/diagnostics/groups/settingsAccountFeature.group.js`
- `dalDeleteCitizenAccountFull` appears to be the atomic production function that supersedes `dalSoftDeleteCitizenAccount`
- `dalDeleteOwnedVportById` has no production caller at any layer

**Risk:** MEDIUM — these are destructive operations (soft delete, targeted vport delete) with no production wiring. If accidentally wired without proper ownership guards, they could be called without authorization checks that the controller layer provides.  
**Recommended action:** `dalSoftDeleteCitizenAccount` — MARK LEGACY (likely internal step superseded by `dalDeleteCitizenAccountFull`). `dalDeleteOwnedVportById` — DELETE CANDIDATE if no admin/targeted delete flow is planned.  
**Handoffs:** IRONMAN (confirm whether targeted vport delete by ID is a planned feature), VENOM (destructive operation with no production authorization path)

---

### Dead Code Finding #3 — `readMyVports`

**File:** `features/settings/vports/dal/vports.read.dal.js`  
**Classification:** DIAGNOSTICS ONLY — no production caller

**Evidence:**
- Zero production caller outside `dev/diagnostics/groups/settingsFeature.group.js`
- The diagnostics entry itself notes: *"readMyVports is intentionally RLS-restricted for this actor context"* — indicating this function hits an access boundary that makes it non-functional in the standard actor context
- Production replacement: `listMyVportsDAL` in the same file IS wired to `listMyVports.controller.js`

**Risk:** LOW — no production impact. The RLS note in diagnostics suggests this function may have been an earlier implementation before `listMyVportsDAL` was correctly scoped.  
**Recommended action:** DELETE CANDIDATE — `listMyVportsDAL` fully covers the production use case.  
**Handoffs:** IRONMAN (confirm `listMyVportsDAL` is the canonical replacement)

---

### Duplicate Implementation Finding — `dalReadVportIdByActorId`

**Files:**
- `features/settings/account/dal/account.read.dal.js`
- `features/settings/profile/dal/actors.read.dal.js`

**Classification:** CONFIRMED DUPLICATE — byte-for-byte identical implementation in two DAL files

**Evidence:**
- Both files export `async function dalReadVportIdByActorId(actorId)` with identical body: same client (`vcClient`), same table (`actors`), same select (`vport_id`), same filter (`.eq('id', actorId)`), same return (`data?.vport_id ?? null`)
- `account.controller.js` imports from `account.read.dal.js`
- `resolveVportIdByActorId.controller.js` imports from `actors.read.dal.js`
- Both are in production, both are live — but they are the same function

**Risk:** MEDIUM — silent divergence risk. If the query ever needs to change (e.g. add a schema prefix, filter by `is_void`, add a join), one copy will be updated and the other will silently lag. Already a maintenance liability.  
**Recommended action:** CONSOLIDATE — move to a single shared DAL location (e.g. `features/settings/profile/dal/actors.read.dal.js` as canonical) and update `account.controller.js` to import from there.  
**Handoffs:** IRONMAN (ownership decision), SENTRY (cross-folder dependency after consolidation)

---

### Structural Finding — `dalGetActorPrivacy` cross-feature duplicate

**Files:**
- `features/settings/privacy/dal/visibility.dal.js` — exports `dalGetActorPrivacy` → called by settings controller
- `features/social/privacy/dal/actorPrivacy.dal` — exports `dalGetActorPrivacy` → called by social controller

Two separate DAL files in different features export the same function name targeting the same table (`actor_privacy_settings`). These are different import paths and serve different controllers, but represent parallel read implementations of the same domain concept.  
**Risk:** LOW-MEDIUM — same divergence risk as the `dalReadVportIdByActorId` duplicate. If privacy settings schema changes, both DALs must be updated.  
**Recommended action:** VERIFY whether both functions read the same columns with the same shape. If identical, consolidate into a shared engine or adapter. If shapes differ, document why.  
**Handoffs:** IRONMAN (confirm intentional split or consolidation candidate)

---

### Audit Summary

| Finding | Classification | Priority |
|---|---|---|
| `fetchVportPublicDetails` — diagnostics only, superseded by profiles feature DAL | DIAGNOSTICS ONLY | P1 — delete candidate |
| `upsertVportPublicDetails` — diagnostics only, superseded by dashboard feature DAL | DIAGNOSTICS ONLY | P1 — delete candidate |
| `dalSoftDeleteCitizenAccount` — diagnostics only, superseded by full-delete atomic fn | DIAGNOSTICS ONLY | P2 — mark legacy |
| `dalDeleteOwnedVportById` — diagnostics only, no production auth path | DIAGNOSTICS ONLY + SECURITY RISK | P1 — VENOM review before any wiring |
| `readMyVports` — diagnostics only, RLS-restricted, superseded by `listMyVportsDAL` | DIAGNOSTICS ONLY | P2 — delete candidate |
| `dalReadVportIdByActorId` — byte-for-byte duplicate across two DAL files | DUPLICATE IMPLEMENTATION | P2 — consolidate |
| `dalGetActorPrivacy` — same function name in settings and social features | CROSS-FEATURE DUPLICATE | P3 — verify + consolidate |

**Confirmed diagnostics-only functions (no production caller):** 5  
**Confirmed duplicate implementations:** 2 pairs  
**Doc function count requires correction:** was 33, production-active count is 28  
**Existing risk findings in doc (HIGH):** `vports.read.dal.js` and `vports.write.dal.js` contain business logic — confirmed still unresolved, SENTRY/VENOM review pending

---

## Consumer Map — Complete Stack Trace

_Generated:_ 2026-05-11  
_Source:_ ARCHITECT static scan · import trace across `apps/VCSM/src/`  
_Method:_ DAL → Controller → Model → Hook (+ Query bridges) → Component → Screen  
_Confidence:_ STATICALLY_TRACED

For each DAL file: every model, controller, hook, and screen that touches it — production callers only (diagnostics excluded where noted).

---

### `account.read.dal.js`

| Layer | File | Role |
|---|---|---|
| DAL | `settings/account/dal/account.read.dal.js` | exports `dalReadVportIdByActorId` |
| Controller | `settings/account/controller/account.controller.js` | `ctrlResolveVportIdByActorId` |
| Model | — | no transform |
| Query | `settings/queries/useAccountSettings.js` | React Query wraps `ctrlResolveVportIdByActorId` |
| Hook | `settings/account/hooks/useAccountController.js` | consumes `useAccountSettings` |
| Hook | `settings/account/hooks/useVportAccountOps.js` | re-exports `ctrlResolveVportIdByActorId` via adapter |
| Adapter | `settings/adapters/settings.adapter.js` | re-exports `useVportAccountOps` |
| Hook | `features/vport/hooks/useRestoreVport.js` | consumes via `settings.adapter` |
| Screen | `settings/screen/SettingsScreen.jsx` | account tab → `AccountTab.view.jsx` |
| Screen | `features/vport/screens/RestoreVportScreen.jsx` | via `useRestoreVport` |

```
account.read.dal.js
 → account.controller.js (ctrlResolveVportIdByActorId)
   → useAccountSettings.js (query)
     → useAccountController.js
       → AccountTab.view.jsx
         → SettingsScreen.jsx [account tab]
   → useVportAccountOps.js
     → settings.adapter.js
       → vport/hooks/useRestoreVport.js
         → RestoreVportScreen.jsx
```

---

### `account.write.dal.js`

| Layer | File | Role |
|---|---|---|
| DAL | `settings/account/dal/account.write.dal.js` | `dalDeleteCitizenAccountFull`, `dalDeleteMyVport`, `dalHardDeleteVport`, `dalRestoreVport` (production) |
| Controller | `settings/account/controller/account.controller.js` | `ctrlDeleteAccount`, `ctrlSoftDeleteVport`, `ctrlHardDeleteVport`, `ctrlRestoreVport` |
| Model | — | no transform |
| Hook | `settings/account/hooks/useAccountController.js` | account delete/vport soft-delete ops |
| Hook | `settings/vports/hooks/useVportsController.js` | calls `ctrlRestoreVport`, `ctrlHardDeleteVport` |
| Screen | `settings/screen/SettingsScreen.jsx` | account tab + vports tab |

```
account.write.dal.js
 → account.controller.js (ctrlDeleteAccount / ctrlSoftDeleteVport / ctrlHardDeleteVport / ctrlRestoreVport)
   → useAccountController.js
     → AccountTab.view.jsx
       → SettingsScreen.jsx [account tab]
   → useVportsController.js
     → VportsTab.view.jsx
       → SettingsScreen.jsx [vports tab]
```

---

### `actorIdBySubject.read.dal.js`

| Layer | File | Role |
|---|---|---|
| DAL | `settings/profile/dal/actorIdBySubject.read.dal.js` | `dalReadActorIdByProfileId`, `dalReadActorIdByVportId` |
| Controller | `settings/profile/controller/profile.controller.js` | `saveProfileCore` — resolves actorId post-save to bust actor store cache |
| Model | — | no transform (returns raw ID for cache invalidation only) |
| Hook | `settings/profile/hooks/useProfileController.js` | orchestrates save + post-save cache bust |
| Adapter | `settings/profile/adapter/ProfileTab.jsx` | mode router (`user` / `vport`) |
| Screen | `settings/screen/SettingsScreen.jsx` | profile tab |

```
actorIdBySubject.read.dal.js
 → profile.controller.js (saveProfileCore — post-save actor refresh)
   → useProfileController.js
     → ProfileTab.jsx (adapter)
       → SettingsScreen.jsx [profile tab]
```

---

### `actorOwners.read.dal.js`

| Layer | File | Role |
|---|---|---|
| DAL | `settings/vports/dal/actorOwners.read.dal.js` | `readActorOwnersByUserDAL` |
| Controller | `settings/vports/controller/getProfileActorId.controller.js` | `ctrlGetProfileActorId` — finds the `user`-kind actor for current session |
| Model | — | inline `find` in controller, no model file |
| Hook | `settings/vports/hooks/useProfileActor.js` | React Query wrapper |
| Hook | `settings/vports/hooks/useVportsController.js` | consumes `useProfileActor` |
| Screen | `settings/screen/SettingsScreen.jsx` | vports tab → `VportsTab.view.jsx` |

```
actorOwners.read.dal.js
 → getProfileActorId.controller.js (ctrlGetProfileActorId)
   → useProfileActor.js
     → useVportsController.js
       → VportsTab.view.jsx
         → SettingsScreen.jsx [vports tab]
```

---

### `actors.read.dal.js`

| Layer | File | Role |
|---|---|---|
| DAL | `settings/profile/dal/actors.read.dal.js` | `dalReadVportIdByActorId` |
| Controller | `settings/profile/controller/resolveVportIdByActorId.controller.js` | `ctrlResolveVportIdByActorId` |
| Model | — | no transform |
| Hook | `settings/vports/hooks/useVportBusinessCardSettings.js` | resolves vportId from actorId before loading card settings |
| Hook | `settings/vports/hooks/useVportDirectoryVisibility.js` | resolves vportId from actorId before loading directory state |
| Hook | `settings/profile/hooks/useProfileController.js` | resolves vportId for vport mode profile load |
| Screen | `features/dashboard/vport/screens/VportSettingsScreen.jsx` | vport dashboard settings |
| Screen | `settings/screen/SettingsScreen.jsx` | profile tab |

```
actors.read.dal.js
 → resolveVportIdByActorId.controller.js (ctrlResolveVportIdByActorId)
   → useVportBusinessCardSettings.js
     → VportSettingsScreen.jsx [dashboard]
   → useVportDirectoryVisibility.js
     → VportSettingsScreen.jsx [dashboard]
   → useProfileController.js
     → ProfileTab.jsx (adapter)
       → SettingsScreen.jsx [profile tab]
```

---

### `auth.read.dal.js` — profile sub-feature

| Layer | File | Role |
|---|---|---|
| DAL | `settings/profile/dal/auth.read.dal.js` | `dalGetCurrentAuthUserId` |
| Controller | `settings/profile/controller/authSession.controller.js` | `ctrlGetCurrentAuthUserId` |
| Model | — | no transform |
| Hook | `settings/profile/hooks/useProfileUploads.js` | snapshots auth user ID at upload action time |
| Hook | `settings/profile/hooks/useProfileController.js` | composes `useProfileUploads` |
| Adapter | `settings/profile/adapter/ProfileTab.jsx` | mode router |
| Screen | `settings/screen/SettingsScreen.jsx` | profile tab |

```
auth.read.dal.js (profile)
 → authSession.controller.js (ctrlGetCurrentAuthUserId)
   → useProfileUploads.js (snapshot auth user before upload)
     → useProfileController.js
       → ProfileTab.jsx (adapter)
         → SettingsScreen.jsx [profile tab]
```

---

### `auth.read.dal.js` — vports sub-feature

| Layer | File | Role |
|---|---|---|
| DAL | `settings/vports/dal/auth.read.dal.js` | `readAuthedUserDAL` |
| Controller | `settings/vports/controller/getAuthedUserId.controller.js` | `ctrlGetAuthedUserId` — resolves user ID before actor switch |
| Model | — | no transform |
| Hook | `settings/vports/hooks/useVportSwitcher.js` | calls `ctrlGetAuthedUserId` during actor switch setup |
| Hook | `settings/vports/hooks/useVportsController.js` | composes `useVportSwitch` |
| Screen | `settings/screen/SettingsScreen.jsx` | vports tab → `VportsTab.view.jsx` |

```
auth.read.dal.js (vports)
 → getAuthedUserId.controller.js (ctrlGetAuthedUserId)
   → useVportSwitcher.js
     → useVportsController.js
       → VportsTab.view.jsx
         → SettingsScreen.jsx [vports tab]
```

---

### `blocks.dal.js`

| Layer | File | Role |
|---|---|---|
| DAL | `settings/privacy/dal/blocks.dal.js` | `dalListMyBlocks`, `dalInsertBlock`, `dalDeleteBlockByTarget`, `dalReadActorKindAndVportId`, `dalSearchActors` |
| Controller | `settings/privacy/controller/Blocks.controller.js` | `ctrlListMyBlocks`, `ctrlBlockActor`, `ctrlUnblockActor`, `ctrlSearchActors` |
| Model | `settings/privacy/models/blocks.model.js` | `modelBlockRows` (shapes block list), `modelActorRows` (shapes actor search results) — called inside `Blocks.controller.js` |
| Query | `settings/queries/useBlockedCitizens.js` | React Query wraps block list + block/unblock mutations |
| Hook | `settings/privacy/hooks/useMyBlocks.jsx` | context provider + delegates to `useBlockedCitizens` |
| Adapter | `settings/adapters/privacy/hooks/useMyBlocks.adapter.js` | re-exports for cross-feature use |
| Hook | `settings/privacy/hooks/useActorLookup.js` | wraps `ctrlSearchActors` for block-target search |
| Component | `settings/privacy/ui/BlockedUsersSimple.jsx` | block list display |
| Component | `settings/privacy/ui/UserLookup.jsx` | actor search + block/unblock actions |
| Screen | `settings/screen/SettingsScreen.jsx` | privacy tab → `PrivacyTab.view.jsx` |
| Screen | `features/chat/inbox/screens/settings/BlockedUsersScreen.jsx` | via `useMyBlocks.adapter.js` |

```
blocks.dal.js
 → Blocks.controller.js (ctrlListMyBlocks / ctrlBlockActor / ctrlUnblockActor)
   → blocks.model.js (modelBlockRows — transforms raw rows)
   → useBlockedCitizens.js (query)
     → useMyBlocks.jsx (provider)
       → BlockedUsersSimple.jsx
       → UserLookup.jsx
         → PrivacyTab.view.jsx
           → SettingsScreen.jsx [privacy tab]
     → useMyBlocks.adapter.js
       → BlockedUsersScreen.jsx [chat feature]
 → Blocks.controller.js (ctrlSearchActors)
   → useActorLookup.js
     → UserLookup.jsx
       → PrivacyTab.view.jsx
         → SettingsScreen.jsx [privacy tab]
```

---

### `profile.read.dal.js`

| Layer | File | Role |
|---|---|---|
| DAL | `settings/profile/dal/profile.read.dal.js` | `fetchProfile` (user + vport modes) |
| Controller | `settings/profile/controller/profile.controller.js` | `loadProfileCore` |
| Model | `settings/profile/model/profile.model.js` | `mapProfileToView` — shapes raw DB row → view-ready object |
| Query | `settings/queries/useProfileSettings.js` | `useProfileSettings` (user) + `useVportProfileSettings` (vport) |
| Hook | `settings/profile/hooks/useProfileController.js` | consumes both query hooks |
| Adapter | `settings/profile/adapter/ProfileTab.jsx` | routes to `UserProfileTab` or `VportProfileTab` |
| Screen | `settings/screen/SettingsScreen.jsx` | profile tab |

```
profile.read.dal.js
 → profile.controller.js (loadProfileCore)
   → profile.model.js (mapProfileToView)
   → useProfileSettings.js / useVportProfileSettings.js (query)
     → useProfileController.js
       → ProfileTab.jsx (adapter)
         → UserProfileTab.jsx / VportProfileTab.jsx
           → SettingsScreen.jsx [profile tab]
```

---

### `profile.write.dal.js`

| Layer | File | Role |
|---|---|---|
| DAL | `settings/profile/dal/profile.write.dal.js` | `updateProfile` (user + vport modes) |
| Controller | `settings/profile/controller/profile.controller.js` | `saveProfileCore` |
| Controller | `settings/profile/controller/saveProfile.controller.js` | `saveProfile` — thin wrapper for user-only saves |
| Model | `settings/profile/model/profile.model.js` | `mapProfileUpdate` — maps UI draft → DB payload |
| Hook | `settings/profile/hooks/useProfileController.js` | mutation via `saveProfileCore` |
| Adapter | `settings/profile/adapter/ProfileTab.jsx` | routes by mode |
| Screen | `settings/screen/SettingsScreen.jsx` | profile tab |

```
profile.write.dal.js
 → profile.controller.js (saveProfileCore)
   → profile.model.js (mapProfileUpdate)
   → useProfileController.js (save mutation)
     → ProfileTab.jsx (adapter)
       → SettingsScreen.jsx [profile tab]
 → saveProfile.controller.js (saveProfile — user-only thin wrapper)
   → useProfileController.js
```

---

### `profileMediaAsset.write.dal.js`

| Layer | File | Role |
|---|---|---|
| DAL | `settings/profile/dal/profileMediaAsset.write.dal.js` | `updateUserPhotoMediaAssetIdDAL`, `updateUserBannerMediaAssetIdDAL` |
| Controller | `settings/profile/controller/recordProfileMediaAsset.controller.js` | `recordProfileMediaAssetController` — routes by scope (`user_avatar`, `user_banner`) |
| Model | — | no transform |
| Hook | `settings/profile/hooks/useProfileUploads.js` | calls controller after upload completes (non-blocking IIFE) |
| Hook | `settings/profile/hooks/useProfileController.js` | composes `useProfileUploads` |
| Adapter | `settings/profile/adapter/ProfileTab.jsx` | routes by mode |
| Screen | `settings/screen/SettingsScreen.jsx` | profile tab |

```
profileMediaAsset.write.dal.js
 → recordProfileMediaAsset.controller.js (user_avatar / user_banner scopes)
   → useProfileUploads.js (non-blocking write-back after upload)
     → useProfileController.js
       → ProfileTab.jsx (adapter)
         → SettingsScreen.jsx [profile tab]
```

---

### `visibility.dal.js`

| Layer | File | Role |
|---|---|---|
| DAL | `settings/privacy/dal/visibility.dal.js` | `dalGetActorPrivacy`, `dalSetActorPrivacy` |
| Controller | `settings/privacy/controller/actorPrivacy.controller.js` | `ctrlGetActorPrivacy`, `ctrlSetActorPrivacy` |
| Model | — | returns primitive `boolean` — no model transform |
| Query | `settings/queries/usePrivacySettings.js` | React Query wraps `ctrlGetActorPrivacy` |
| Query | `settings/queries/useUpdateVportVisibility.js` | mutation wraps `ctrlSetActorPrivacy` |
| Hook | `settings/privacy/hooks/useActorPrivacy.js` | composes both queries |
| Component | `settings/privacy/ui/ProfilePrivacyToggle.jsx` | toggle UI |
| Screen | `settings/screen/SettingsScreen.jsx` | privacy tab → `PrivacyTab.view.jsx` |

```
visibility.dal.js
 → actorPrivacy.controller.js (ctrlGetActorPrivacy / ctrlSetActorPrivacy)
   → usePrivacySettings.js (read query)
   → useUpdateVportVisibility.js (write mutation)
     → useActorPrivacy.js
       → ProfilePrivacyToggle.jsx
         → PrivacyTab.view.jsx
           → SettingsScreen.jsx [privacy tab]
```

---

### `vportPublicDetails.read.dal.js` — DIAGNOSTICS ONLY

| Layer | File | Role |
|---|---|---|
| DAL | `settings/profile/dal/vportPublicDetails.read.dal.js` | `fetchVportPublicDetails` |
| Controller | — | **no production controller** |
| Model | — | no production model |
| Hook | — | no production hook |
| Screen | — | **no production screen** — `settingsProfileFeature.group.js` only |

> **Status:** DIAGNOSTICS ONLY. Superseded by `fetchVportPublicDetailsByActorId` in `features/profiles/dal/`. See Dead Code Finding #1.

---

### `vportPublicDetails.write.dal.js` — DIAGNOSTICS ONLY

| Layer | File | Role |
|---|---|---|
| DAL | `settings/profile/dal/vportPublicDetails.write.dal.js` | `upsertVportPublicDetails` |
| Controller | — | **no production controller** |
| Model | — | no production model |
| Hook | — | no production hook |
| Screen | — | **no production screen** — `settingsProfileFeature.group.js` only |

> **Status:** DIAGNOSTICS ONLY. Superseded by `upsertVportPublicDetailsDAL` in `features/dashboard/vport/dal/write/`. See Dead Code Finding #1.

---

### `vports.read.dal.js`

| Layer | File | Role |
|---|---|---|
| DAL | `settings/vports/dal/vports.read.dal.js` | `listMyVportsDAL`, `readVportBusinessCardSettingsDAL`, `readVportDirectoryStateDAL` |
| Controller | `settings/vports/controller/listMyVports.controller.js` | `listMyVportsController` |
| Controller | `settings/vports/controller/vportBusinessCardSettings.controller.js` | `ctrlGetVportBusinessCardSettings` |
| Controller | `settings/vports/controller/vportDirectoryVisibility.controller.js` | `ctrlGetVportDirectoryState` |
| Model | `settings/vports/model/vport.model.js` | `mapVport`, `mapVports` — **diagnostics only**, not called by any production hook |
| Query | `settings/queries/useUserVports.js` | React Query wraps `listMyVportsController` |
| Hook | `settings/vports/hooks/useVportsList.js` | thin wrapper over `useUserVports` |
| Hook | `settings/vports/hooks/useVportsController.js` | composes `useVportsList` |
| Hook | `settings/vports/hooks/useVportBusinessCardSettings.js` | calls `ctrlGetVportBusinessCardSettings` |
| Hook | `settings/vports/hooks/useVportDirectoryVisibility.js` | calls `ctrlGetVportDirectoryState` |
| Screen | `settings/screen/SettingsScreen.jsx` | vports tab → `VportsTab.view.jsx` |
| Screen | `features/dashboard/vport/screens/VportSettingsScreen.jsx` | business card + directory settings |

```
vports.read.dal.js
 → listMyVports.controller.js (listMyVportsController)
   → useUserVports.js (query)
     → useVportsList.js
       → useVportsController.js
         → VportsTab.view.jsx
           → SettingsScreen.jsx [vports tab]
 → vportBusinessCardSettings.controller.js (ctrlGetVportBusinessCardSettings)
   → useVportBusinessCardSettings.js
     → VportSettingsScreen.jsx [dashboard]
 → vportDirectoryVisibility.controller.js (ctrlGetVportDirectoryState)
   → useVportDirectoryVisibility.js
     → VportSettingsScreen.jsx [dashboard]
```

---

### `vports.write.dal.js`

| Layer | File | Role |
|---|---|---|
| DAL | `settings/vports/dal/vports.write.dal.js` | `setVportBusinessCardPublishStateDAL`, `setVportBusinessCardSettingsDAL`, `setVportDirectoryVisibleDAL` |
| Controller | `settings/vports/controller/vportBusinessCard.controller.js` | `ctrlSetVportBusinessCardPublishState` (publish/unpublish) |
| Controller | `settings/vports/controller/vportBusinessCardSettings.controller.js` | `ctrlSetVportBusinessCardSettings` (save settings JSON) |
| Controller | `settings/vports/controller/vportDirectoryVisibility.controller.js` | `ctrlSetVportDirectoryVisible` |
| Model | — | no transform on write path |
| Hook | `settings/vports/hooks/useVportBusinessCardSettings.js` | calls both card controllers |
| Hook | `settings/vports/hooks/useVportDirectoryVisibility.js` | calls directory controller |
| Hook | `settings/vports/hooks/useVportsController.js` | calls `ctrlSetVportBusinessCardPublishState` |
| Screen | `features/dashboard/vport/screens/VportSettingsScreen.jsx` | primary consumer |
| Screen | `settings/screen/SettingsScreen.jsx` | vports tab (publish/unpublish via `useVportsController`) |

```
vports.write.dal.js
 → vportBusinessCard.controller.js (ctrlSetVportBusinessCardPublishState)
   → useVportsController.js
     → VportsTab.view.jsx
       → SettingsScreen.jsx [vports tab]
 → vportBusinessCardSettings.controller.js (ctrlSetVportBusinessCardSettings)
   → useVportBusinessCardSettings.js
     → VportSettingsScreen.jsx [dashboard]
 → vportDirectoryVisibility.controller.js (ctrlSetVportDirectoryVisible)
   → useVportDirectoryVisibility.js
     → VportSettingsScreen.jsx [dashboard]
```

---

## Consumer Map Summary

| DAL | Controllers | Models (production) | Hooks | Screens |
|---|---|---|---|---|
| `account.read.dal.js` | `account.controller` | — | `useAccountController`, `useVportAccountOps` | `SettingsScreen` (account tab), `RestoreVportScreen` |
| `account.write.dal.js` | `account.controller` | — | `useAccountController`, `useVportsController` | `SettingsScreen` (account + vports tabs) |
| `actorIdBySubject.read.dal.js` | `profile.controller` | — | `useProfileController` | `SettingsScreen` (profile tab) |
| `actorOwners.read.dal.js` | `getProfileActorId.controller` | — | `useProfileActor`, `useVportsController` | `SettingsScreen` (vports tab) |
| `actors.read.dal.js` | `resolveVportIdByActorId.controller` | — | `useVportBusinessCardSettings`, `useVportDirectoryVisibility`, `useProfileController` | `VportSettingsScreen`, `SettingsScreen` (profile tab) |
| `auth.read.dal.js` (profile) | `authSession.controller` | — | `useProfileUploads`, `useProfileController` | `SettingsScreen` (profile tab) |
| `auth.read.dal.js` (vports) | `getAuthedUserId.controller` | — | `useVportSwitcher`, `useVportsController` | `SettingsScreen` (vports tab) |
| `blocks.dal.js` | `Blocks.controller` | `blocks.model` | `useMyBlocks`, `useActorLookup`, `useBlockedCitizens` | `SettingsScreen` (privacy tab), `BlockedUsersScreen` (chat) |
| `profile.read.dal.js` | `profile.controller` | `profile.model` | `useProfileController`, `useProfileSettings` | `SettingsScreen` (profile tab) |
| `profile.write.dal.js` | `profile.controller`, `saveProfile.controller` | `profile.model` | `useProfileController` | `SettingsScreen` (profile tab) |
| `profileMediaAsset.write.dal.js` | `recordProfileMediaAsset.controller` | — | `useProfileUploads`, `useProfileController` | `SettingsScreen` (profile tab) |
| `visibility.dal.js` | `actorPrivacy.controller` | — | `useActorPrivacy`, `usePrivacySettings`, `useUpdateVportVisibility` | `SettingsScreen` (privacy tab) |
| `vportPublicDetails.read.dal.js` | **none (diagnostics only)** | — | **none** | **none** |
| `vportPublicDetails.write.dal.js` | **none (diagnostics only)** | — | **none** | **none** |
| `vports.read.dal.js` | `listMyVports.controller`, `vportBusinessCardSettings.controller`, `vportDirectoryVisibility.controller` | `vport.model` (diagnostics only) | `useVportsList`, `useVportsController`, `useVportBusinessCardSettings`, `useVportDirectoryVisibility` | `SettingsScreen` (vports tab), `VportSettingsScreen` |
| `vports.write.dal.js` | `vportBusinessCard.controller`, `vportBusinessCardSettings.controller`, `vportDirectoryVisibility.controller` | — | `useVportsController`, `useVportBusinessCardSettings`, `useVportDirectoryVisibility` | `SettingsScreen` (vports tab), `VportSettingsScreen` |

### Cross-Feature Screen Consumers

Two DAL chains reach screens **outside** `features/settings/`:

| Screen | Feature | DAL Chain |
|---|---|---|
| `RestoreVportScreen.jsx` | `features/vport/` | `account.read.dal` → `account.controller` → `useVportAccountOps` → `settings.adapter` → `useRestoreVport` |
| `BlockedUsersScreen.jsx` | `features/chat/inbox/` | `blocks.dal` → `Blocks.controller` → `useMyBlocks` → `useMyBlocks.adapter.js` |
| `VportSettingsScreen.jsx` | `features/dashboard/vport/` | `actors.read.dal`, `vports.read.dal`, `vports.write.dal` → business card + directory hooks |

## Codex Fix Pass — 2026-05-11

### Files Changed
| File | Change |
|---|---|
| `apps/VCSM/src/features/settings/account/controller/account.controller.js` | Consolidated production `dalReadVportIdByActorId` usage to the existing settings/profile DAL implementation. |
| `zNOTFORPRODUCTION/_CANONICAL/logan/vcsm/dal/vcsm.dal.settings.md` | Appended this fix-pass record only; no prior audit content was removed. |

### Findings Addressed
| Finding | Status | Notes |
|---|---|---|
| Duplicate implementation: `dalReadVportIdByActorId` | PARTIAL | Production `account.controller.js` now imports the same canonical implementation used by `resolveVportIdByActorId.controller.js`. The old duplicate file remains for diagnostics because this pass is no-delete. |
| `fetchVportPublicDetails` + `upsertVportPublicDetails` diagnostics-only | DEFERRED | Verified only diagnostics callers. Deletion or diagnostics import rewiring was not performed under the no-delete/no-unrelated-churn instruction. |
| `dalSoftDeleteCitizenAccount` + `dalDeleteOwnedVportById` diagnostics-only destructive functions | DEFERRED | Verified diagnostics-only callers. Kept unchanged; disposition requires IRONMAN and VENOM. |
| `readMyVports` diagnostics-only/RLS-restricted | DEFERRED | Verified diagnostics-only caller and live `listMyVportsDAL` production replacement. No deletion performed. |
| `dalGetActorPrivacy` duplicate across settings/social | DEFERRED | Verified both features still have separate implementations. Cross-feature consolidation needs ownership review because social/profiles callers use the social privacy path. |
| `vports.read.dal.js` / `vports.write.dal.js` business-logic scanner findings | DEFERRED | Current production controllers remain wired. Refactoring ownership/status checks out of DAL requires SENTRY/VENOM review; no behavior-changing move was made. |

### Verification
- Commands/searches run:
  - `wc -l zNOTFORPRODUCTION/_CANONICAL/logan/vcsm/dal/vcsm.dal.settings.md`
  - `sed -n '1,280p' zNOTFORPRODUCTION/_CANONICAL/logan/vcsm/dal/vcsm.dal.settings.md`
  - `sed -n '281,620p' zNOTFORPRODUCTION/_CANONICAL/logan/vcsm/dal/vcsm.dal.settings.md`
  - `sed -n '621,980p' zNOTFORPRODUCTION/_CANONICAL/logan/vcsm/dal/vcsm.dal.settings.md`
  - `sed -n '981,1220p' zNOTFORPRODUCTION/_CANONICAL/logan/vcsm/dal/vcsm.dal.settings.md`
  - `sed -n '1,220p' apps/VCSM/src/features/settings/account/controller/account.controller.js`
  - `sed -n '1,80p' apps/VCSM/src/features/settings/account/dal/account.read.dal.js`
  - `sed -n '1,80p' apps/VCSM/src/features/settings/profile/dal/actors.read.dal.js`
  - `rg -n "dalReadVportIdByActorId|dalSoftDeleteCitizenAccount|dalDeleteOwnedVportById|fetchVportPublicDetails|upsertVportPublicDetails|readMyVports|dalGetActorPrivacy|vports\\.read\\.dal|vports\\.write\\.dal" apps/VCSM/src --glob '*.js' --glob '*.jsx'`
  - `rg -n "@/features/settings/account/dal/account.read.dal|dalReadVportIdByActorId" apps/VCSM/src/features/settings apps/VCSM/src/dev/diagnostics --glob '*.js' --glob '*.jsx'`
  - `rg -n "fetchVportPublicDetails|upsertVportPublicDetails|dalSoftDeleteCitizenAccount|dalDeleteOwnedVportById|readMyVports" apps/VCSM/src --glob '*.js' --glob '*.jsx'`
  - `npm run build`
- Production callers checked:
  - `dalReadVportIdByActorId`: production account and profile controllers now import from `features/settings/profile/dal/actors.read.dal.js`; diagnostics still import both copies.
  - `fetchVportPublicDetails` / `upsertVportPublicDetails`: diagnostics-only under `settingsProfileFeature.group.js`.
  - `dalSoftDeleteCitizenAccount` / `dalDeleteOwnedVportById`: diagnostics-only under `settingsAccountFeature.group.js`.
  - `readMyVports`: diagnostics-only under `settingsFeature.group.js`.
  - `dalGetActorPrivacy`: live settings privacy and social privacy implementations remain separate.
- Remaining risks:
  - Duplicate `account.read.dal.js` file remains because deletion was not allowed.
  - Diagnostics-only destructive/account functions remain pending IRONMAN/VENOM.
  - Business-logic scanner findings in vports DALs remain pending SENTRY/VENOM architecture review.
  - Build passed; existing Vite chunk-size warnings and the pre-existing `VerifyEmailRequiredScreen.jsx` mixed static/dynamic import warning remain.

### Status
PARTIAL
