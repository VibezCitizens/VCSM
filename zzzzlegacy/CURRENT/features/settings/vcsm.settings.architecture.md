# MODULE ARCHITECTURE REPORT

**Module:** settings
**Application Scope:** apps/VCSM
**Module Type:** Feature Module — User & VPORT Settings
**Primary Root:** `apps/VCSM/src/features/settings/`
**Independence Status:** DEPENDENT
**Completeness Status:** MOSTLY COMPLETE

---

## PURPOSE

Owns all settings screens: profile editing (user and VPORT), privacy settings, block management, account settings, and VPORT management (list, create, publish/unpublish, business card, directory visibility, QR). Organized into four sub-domains: `account/`, `privacy/`, `profile/`, and `vports/`.

---

## ENTRY POINTS

- `/settings` → `SettingsScreen.jsx`
- Settings tabs: Account, Profile, Privacy, Vports (rendered via sub-screen views)

---

## LAYER MAP

**account/ sub-module:**
DAL: `account.read.dal.js`, `account.write.dal.js`
Controller: `account.controller.js`
Hooks: `useAccountController.js`, `useVportAccountOps.js`
UI: `AccountTab.view.jsx`, `AccountTabSubComponents.jsx`

**privacy/ sub-module:**
DAL: `blocks.dal.js`, `visibility.dal.js`
Controllers: `Blocks.controller.js`, `actorPrivacy.controller.js`
Hooks: `useActorLookup.js`, `useActorPrivacy.js`, `useMyBlocks.jsx` (NOTE: .jsx hook), `usePendingFollowRequestActions.js`
Models: `blocks.model.js`
UI: `BlockedUsersSimple.jsx`, `PendingFollowRequests.jsx`, `PrivacyTab.view.jsx`, `ProfilePrivacyToggle.jsx`, `UserLookup.jsx`

**profile/ sub-module:**
DAL: 7 files — actorIdBySubject.read, actors.read, auth.read, profile.read, profile.write, profileMediaAsset.write, vportPublicDetails.read, vportPublicDetails.write
Controllers: 5 — authSession, profile, recordProfileMediaAsset, resolveVportIdByActorId, saveProfile
Hooks: `useProfileController.js`, `useProfileUploads.js`
Models: `profile.model.js`, `vportPublicDetails.model.js`
UI: `HoursEditor.jsx`, `ProfessionalAccessButton.jsx`, `ProfileTab.view.jsx`, `VportAboutDetails.view.jsx`, `vportAboutDetails.model.js` (MODEL IN UI FOLDER — violation), `vportAboutDetailsFields.jsx`
Adapter: `profile/adapter/ProfileTab.jsx`, `UserProfileTab.jsx`, `VportProfileTab.jsx`

**vports/ sub-module:**
DAL: `actorOwners.read.dal.js`, `auth.read.dal.js`, `vports.read.dal.js`, `vports.write.dal.js`
Controllers: 6 — getAuthedUserId, getProfileActorId, listMyVports, vportBusinessCard, vportBusinessCardSettings, vportDirectoryVisibility
Hooks: 7 — useProfileActor, useVportBusinessCardSettings, useVportDirectoryVisibility, useVportNotificationBadges, useVportSwitcher, useVportsController, useVportsList
Model: `vport.model.js`
UI: `VportsBusinessCardSection.jsx`, `VportsCreateModal.jsx`, `VportsHardDeleteModal.jsx`, `VportsQrModal.jsx`, `VportsRecoverModal.jsx`, `VportsTab.view.jsx`, `VportsUnpublishModal.jsx`

**sponsored/ sub-module:**
UI: `Omd.view.jsx` — OneMoreDays advertisement view (isolated)

**queries/ folder (STRUCTURAL CONCERN):**
- `useAccountSettings.js`, `useBlockedCitizens.js`, `usePrivacySettings.js`, `useProfileSettings.js`, `useUpdateVportVisibility.js`, `useUserVports.js`

**STRUCTURAL NOTE:** `queries/` folder contains hooks that appear to duplicate sub-module hooks. This is a legacy or parallel pattern — it's unclear if these are active or superseded by sub-module hooks.

**Adapters:**
- `settings.adapter.js` — main adapter
- `adapters/privacy/hooks/useMyBlocks.adapter.js`
- `adapters/profile/ui/VportAboutDetails.view.adapter.js`
- `adapters/ui/Card.adapter.js`

**UI Primitives:**
- `ui/Card.jsx`, `ui/Row.jsx` — settings-scoped UI primitives

**Store:** None

**Engine Consumers:** None

---

## MODULE COMPLETENESS MATRIX

| Area | Status | Evidence | Missing / Risk |
|---|---|---|---|
| Purpose defined | PASS | Settings domain clear | — |
| Owner defined | PARTIAL | No IRONMAN record | — |
| Entry points mapped | PASS | SettingsScreen + tabs | — |
| Controllers present/delegated | PASS | 14 controllers | — |
| DAL/repository present/delegated | PASS | 14 DAL files | — |
| Models/transformers present | PARTIAL | 4 models — 1 in wrong folder | vportAboutDetails.model.js in ui/ |
| Hooks/view models present | PARTIAL | Hooks in sub-modules + duplicate queries/ folder | queries/ may be dead |
| Screens/components present | PASS | SettingsScreen + 4 tab views + 10+ components | — |
| Services/adapters present | PASS | 4 adapter files | — |
| Database objects mapped | PARTIAL | vc, vport schema tables | — |
| Authorization path mapped | PARTIAL | Auth session checks in profile controllers | — |
| Cache/runtime behavior mapped | FAIL | Not documented | — |
| Error/loading/empty states mapped | PARTIAL | Some loading states | — |
| Documentation linked | FAIL | No Logan doc | — |
| Tests/validation noted | FAIL | No tests | — |
| Native parity noted | N/A | — | — |
| Engine dependencies mapped | PASS | No engine dependencies | — |

---

## MODULE DEPENDENCY GRAPH

| Dependency | Type | Direction | Approved Boundary | Notes |
|---|---|---|---|---|
| `social` feature | feature | settings → social | PARTIAL | Privacy settings overlap |
| `block` feature | feature | settings → block | PARTIAL | Block management duplicated |
| `vport` feature | feature | settings → vport | PARTIAL | VPORT creation in settings |
| `upload` feature | feature | settings → upload | PARTIAL | Profile media upload |
| `vc.profiles` | database | settings reads/writes | YES | Profile editing |
| `vport.vports` | database | settings reads/writes | YES | VPORT management |
| `vc.actor_privacy` | database | settings reads/writes | YES | Privacy tab |
| `moderation.blocks` | database | settings reads | YES | Block management |

---

## MODULE DATA CONTRACT

| Object | Access Type | Owner | Consumer | Risk |
|---|---|---|---|---|
| User profile | read/write | settings | Profile tab | Drift if profile not hydrated after save |
| VPORT public details | read/write | settings (AND profiles reads) | Profile tab, VPORT profile | Dual read path |
| Block list | read/write | settings (AND block feature) | Privacy tab | Overlap with block feature |
| Actor privacy | read/write | settings (AND social/privacy) | Privacy tab | Ownership ambiguity |
| VPORT list | read | settings | Vports tab | — |
| Business card settings | read/write | settings | Vports tab | — |

---

## MODULE RUNTIME READINESS

| Runtime Area | Status | Evidence | Risk |
|---|---|---|---|
| Route/screen entry | PASS | SettingsScreen routed | — |
| Loading state | PARTIAL | Some loading states | — |
| Empty state | PARTIAL | Empty blocks list | — |
| Error state | FAIL | Not confirmed | — |
| Auth/owner gates | PARTIAL | Auth checked in profile controllers | — |
| Cache behavior | FAIL | Not documented | Profile save → stale read risk |
| Runtime dependencies | PASS | Direct Supabase access | — |
| Hot paths | LOW | Settings is not frequently visited | — |

---

## DEAD CODE / SPAGHETTI SIGNALS

| Signal | Evidence | Risk | Recommended Handoff |
|---|---|---|---|
| `queries/` folder | 6 hook files — unclear if active or superseded | HIGH | IRONMAN |
| `vportAboutDetails.model.js` in `profile/ui/` | Model file inside UI folder | HIGH — layer violation | SENTRY |
| `useMyBlocks.jsx` named as .jsx | Hook file with JSX extension | MEDIUM — naming violation | LOGAN |
| Block management duplication | `settings/privacy/` manages blocks AND `block` feature manages blocks | HIGH — dual ownership | IRONMAN |
| Privacy settings duplication | `settings/privacy/` AND `social/privacy/` both touch actor_privacy | HIGH | IRONMAN |

---

## MODULE GOVERNANCE LINKS

| Governance Type | Path | Status |
|---|---|---|
| Logan doc | — | MISSING |
| Ownership record | — | MISSING |
| Security audit | — | MISSING |
| Runtime audit | — | MISSING |
| Performance audit | — | MISSING |
| Migration audit | — | MISSING |
| Native transfer audit | N/A | N/A |
| Engine audit | N/A | N/A |

---

## MODULE MISSING PIECES

| Missing Piece | Severity | Why It Matters | Suggested Owner |
|---|---|---|---|
| Clarify or remove queries/ folder | HIGH | Possible dead code — 6 hook files unclear status | IRONMAN |
| Move vportAboutDetails.model.js out of ui/ | HIGH | Layer violation | SENTRY |
| Resolve block management ownership (settings vs block feature) | HIGH | Dual ownership = inconsistent behavior | IRONMAN |
| Resolve privacy settings ownership (settings vs social/privacy) | HIGH | Dual ownership = drift risk | IRONMAN |
| Logan documentation | HIGH | No canonical settings architecture | LOGAN |
| Fix useMyBlocks.jsx extension | LOW | Should be .js | LOGAN |

---

## FINAL MODULE STATUS: MOSTLY COMPLETE

## RECOMMENDED HANDOFFS:
- IRONMAN (ownership: block vs settings, privacy vs social, queries/ folder status)
- SENTRY (boundary: model in ui/, layer violations)
- LOGAN (documentation, naming fixes)
