---
name: vcsm.settings.architecture
description: ARCHITECT V2 module architecture report for VCSM:settings
metadata:
  type: architecture
  owner: ARCHITECT
  last-run: 2026-06-04
  scanner-version: 1.1.0
  freshness: FRESH
---

# MODULE ARCHITECTURE REPORT

**Module:** settings
**Application Scope:** VCSM
**Module Type:** feature
**Primary Root:** apps/VCSM/src/features/settings
**Independence Status:** MOSTLY INDEPENDENT
**Completeness Status:** MOSTLY COMPLETE

---

## PURPOSE

The settings module is the authenticated citizen's control panel for account management, profile editing, privacy configuration, and VPORT lifecycle management. It surfaces four tabs — Privacy, Profile, Account, and Vports — each backed by dedicated sub-feature layers (DAL, controller, hook, view). It also owns destructive operations such as soft/hard account deletion and VPORT soft-delete/restore/hard-delete, all gated behind ownership assertions from the booking adapter boundary.

## OWNERSHIP

Settings is a first-party VCSM citizen feature. Ownership belongs to the platform core team responsible for citizen identity and account lifecycle. The module spans both `user` and `vport` actor kinds and is the primary write surface for `vc.actor_privacy_settings`, `vport.profiles`, and the `delete-citizen-account` Edge Function.

## ENTRY POINTS

- `/settings` — `SettingsScreen.jsx` (authenticated route, tab-based SPA shell)
  - `?tab=privacy` — `PrivacyTab.view.jsx`
  - `?tab=profile` — `ProfileTab` adapter (user or vport conditional)
  - `?tab=account` — `AccountTab.view.jsx`
  - `?tab=vports` — `VportsTab.view.jsx`
- Public adapter export: `useVportAccountOps` via `adapters/settings.adapter.js`

---

## LAYER MAP

| Layer | Count | Key Files |
|---|---|---|
| DAL | 33 | vports.read.dal.js, vports.write.dal.js, account.write.dal.js, visibility.dal.js, profile.write.dal.js |
| Model | 23 | vport.model.js, profile.model.js, blocks.model.js, vportPublicDetails.model.js |
| Controller | 28 | account.controller.js, vportDirectoryVisibility.controller.js, actorPrivacy.controller.js, saveProfile.controller.js, vportBusinessCard.controller.js |
| Service | N/A | Not present |
| Adapter | 13 | settings.adapter.js, privacy/hooks/useMyBlocks.adapter.js, profile/ui/VportAboutDetails.view.adapter.js, ui/Card.adapter.js |
| Hook | 38 | useVportsController.js, useVportsList.js, useAccountController.js, useActorPrivacy.js, useProfileController.js |
| Component | 38 | BlockedUsersSimple.jsx, VportsBusinessCardSection.jsx, VportsCreateModal.jsx, VportsHardDeleteModal.jsx, PendingFollowRequests.jsx |
| Screen | 14 | SettingsScreen.jsx, PrivacyTab.view.jsx, AccountTab.view.jsx, VportsTab.view.jsx, ProfileTab.view.jsx |
| Barrel | 4 | index.js (root), profile/index.js, vports/index.js, constants.js |

Use counts from scanner callgraph data.

---

## MODULE COMPLETENESS MATRIX

| Area | Status | Evidence | Missing / Risk |
|---|---|---|---|
| Purpose defined | PARTIAL | Source readable; BEHAVIOR.md is a placeholder | BEHAVIOR.md has no spec — full behavior undocumented |
| Owner defined | PARTIAL | Implied by feature team ownership; no formal ownership record | OWNERSHIP.md missing |
| Entry points mapped | PASS | SettingsScreen.jsx with 4 lazy-loaded tab views | Route not captured in scanner route-map (empty) |
| Controllers present/delegated | PASS | 28 controllers across account, privacy, profile, vports subdomains | |
| DAL/repository present/delegated | PASS | 33 DAL files; explicit column selects throughout | |
| Models/transformers present | PASS | 23 model files; vport.model.js, profile.model.js, blocks.model.js | |
| Hooks/view models present | PASS | 38 hooks; useVportsController, useAccountController, useActorPrivacy | |
| Screens/components present | PASS | 14 screens; 38 components | |
| Services/adapters present | PASS | 13 adapters including settings.adapter.js public boundary | Adapter exports only useVportAccountOps — thin boundary |
| Database objects mapped | PASS | 17 write surfaces across profiles, actor_privacy_settings, account RPCs | vport.profile_public_details sync is non-blocking secondary write (drift risk) |
| Authorization path mapped | PASS | assertActorOwnsVportActorController from booking.adapter used in 3 controllers | Cross-feature adapter import from booking is a boundary dependency |
| Cache/runtime behavior mapped | PARTIAL | Privacy controller calls invalidateActorPrivacyCacheAdapter and invalidateActorBundleEntry | No cache documentation; these invalidations are implicit |
| Error/loading/empty states mapped | PARTIAL | Hooks expose busy/error state; SettingsScreen has Suspense loading | Empty state handling varies per tab — not uniformly documented |
| Documentation linked | FAIL | BEHAVIOR.md present but is a stub placeholder | No real behavioral spec exists |
| Tests/validation noted | FAIL | 0 formal test files per scanner | Diagnostics groups exist in /dev/diagnostics (not formal tests) |
| Native parity noted | N/A | PWA-only feature | |
| Engine dependencies mapped | PASS | 8 engines: booking, directory, hydration, identity, media, notification, profile, qr | booking engine is imported for ownership assertion — creates dependency |

---

## MODULE DEPENDENCY GRAPH

| Dependency | Type | Direction | Approved Boundary | Notes |
|---|---|---|---|---|
| engines/booking | Engine | Inbound (adapter) | YES — via booking.adapter | assertActorOwnsVportActorController used in account.controller.js, vportDirectoryVisibility.controller.js, actorPrivacy.controller.js |
| engines/identity | Engine | Inbound | YES | useIdentity() consumed in useVportsController.js |
| engines/hydration | Engine | Inbound | YES | Used across queries |
| engines/profile | Engine | Inbound | YES | Profile reads |
| engines/media | Engine | Inbound | YES | Profile photo/banner uploads |
| engines/notification | Engine | Inbound | YES | Notification badge hooks |
| engines/directory | Engine | Inbound | YES | Actor directory lookups |
| engines/qr | Engine | Inbound | YES | QR modal in Vports tab |
| features/social | Cross-feature | Inbound (adapter) | PARTIAL | invalidateActorPrivacyCacheAdapter imported in actorPrivacy.controller.js — crosses feature boundary via adapter |
| features/feed | Cross-feature | Inbound (adapter) | PARTIAL | invalidateActorBundleEntry imported in actorPrivacy.controller.js — crosses feature boundary via adapter |
| features/booking | Cross-feature | Inbound (adapter) | PARTIAL | assertActorOwnsVportActorController imported via booking.adapter in 3 controllers — cross-feature dependency on booking adapter |
| vport.profiles | DB Table | Write | YES | Primary VPORT profile data |
| vc.actor_privacy_settings | DB Table | Write | YES | Privacy flag per actor |
| vport.profile_public_details | DB Table | Write | YES (secondary) | directory_visible sync — non-blocking, drift risk flagged |
| profiles (null schema) | DB Table | Write | YES | Citizen profile (display_name, bio, photo, banner) |
| delete-citizen-account | Edge Function | Write | YES | Hard account delete via Supabase Edge Function |

---

## MODULE DATA CONTRACT

| Object | Access Type | Owner | Consumer | Risk |
|---|---|---|---|---|
| delete-citizen-account Edge Fn | edge_function | settings/account | ctrlDeleteAccount | Irreversible; no recovery path |
| soft_delete_citizen_account RPC | rpc | settings/account | ctrlSoftDeleteVport | Authenticated-only |
| soft_delete_vport RPC | rpc | settings/vports | ctrlSoftDeleteVport | Owner-gated via DB RPC |
| restore_vport RPC | rpc | settings/vports | ctrlRestoreVport | Owner-gated via DB RPC |
| hard_delete_vport RPC | rpc | settings/vports | ctrlHardDeleteVport | Requires prior soft-delete; actor ownership asserted at controller layer |
| moderation.block_actor RPC | rpc | settings/privacy | dalInsertBlock | Moderation schema |
| moderation.unblock_actor RPC | rpc | settings/privacy | dalDeleteBlockByTarget | Moderation schema |
| vc.actor_privacy_settings | upsert | settings/privacy | dalSetActorPrivacy | Privacy flag — must match social follow request behavior |
| vport.profiles (update) | update | settings/vports | setVportDirectoryVisibleDAL, setVportBusinessCardSettingsDAL | Owner WHERE clause guards |
| profiles (null schema, update) | update | settings/profile | updateProfile, updateUserPhotoMediaAssetIdDAL, updateUserBannerMediaAssetIdDAL | Citizen profile writes |
| vport.profile_public_details | update | settings/vports | syncDirectoryVisibleToPublicDetailsDAL | Secondary sync — non-blocking, drift possible |
| set_business_card_publish_state RPC | rpc | settings/vports | setVportBusinessCardPublishStateDAL | SECURITY DEFINER at DB |

---

## MODULE RUNTIME READINESS

| Runtime Area | Status | Evidence | Risk |
|---|---|---|---|
| Route/screen entry | PASS | SettingsScreen.jsx mounts tab shell; all 4 views lazy-loaded via Suspense | Route not in scanner route-map (must confirm app router registration) |
| Loading state | PASS | Suspense fallback present in SettingsScreen; busy/busyRestore/busyHardDelete states in hooks | |
| Empty state | PARTIAL | VportsList handles empty array; per-tab empty states vary | No uniform empty state component |
| Error state | PARTIAL | Hooks expose errRestore, errHardDelete, errCardPublish; not all views surface errors uniformly | |
| Auth/owner gates | PASS | dalDeleteCitizenAccountFull uses Edge Function with service key; ownership asserted via assertActorOwnsVportActorController at controller layer before destructive DAL calls | |
| Cache behavior | PARTIAL | invalidateActorPrivacyCacheAdapter and invalidateActorBundleEntry called after privacy change | No cache TTL documentation; other settings writes do not invalidate caches |
| Runtime dependencies | PASS | useAuth, useIdentity, useNavigate wired correctly in useVportsController | |

---

## MODULE GOVERNANCE LINKS

| Governance Type | Path | Status |
|---|---|---|
| Logan doc | ZZnotforproduction/APPS/VCSM/features/settings/BEHAVIOR.md | PRESENT (STUB) |
| Ownership record | — | MISSING |
| Security audit | — | MISSING |
| Runtime audit | — | MISSING |
| Performance audit | — | MISSING |
| Migration audit | — | MISSING |
| Native transfer audit | N/A | N/A |
| Engine audit | — | MISSING |

---

## MODULE MISSING PIECES

| Missing Piece | Severity | Why It Matters | Suggested Owner |
|---|---|---|---|
| BEHAVIOR.md is a stub placeholder | HIGH | The entire behavioral contract (happy paths, edge cases, state machine, privacy rules, deletion flows) is undocumented | LOGAN |
| 0 formal test files | HIGH | Destructive paths (account delete, hard delete VPORT) have no regression coverage; diagnostics groups are runtime-only | SPIDER-MAN |
| Route not in scanner route-map | MEDIUM | `/settings` route is not captured by static route scanner — confirms settings route is navigated to programmatically, not statically declared in a route file readable by scanner | HAWKEYE |
| OWNERSHIP.md missing | MEDIUM | No formal ownership record for who maintains this module | IRONMAN |
| Thin public adapter | MEDIUM | settings.adapter.js exports only useVportAccountOps — other hooks/controllers consumed across features without going through the adapter boundary | VENOM |
| No cache invalidation for profile/vport writes | LOW | Profile photo, banner, and VPORT settings writes do not bust actor bundle cache; stale UI state possible | LOKI |
| profile_public_details sync drift risk | LOW | syncDirectoryVisibleToPublicDetailsDAL is non-blocking — if it fails silently, directory_visible diverges between vport.profiles and vport.profile_public_details | SENTRY |

---

## MODULE BOUNDARY WARNINGS

1. **booking adapter cross-dependency**: `assertActorOwnsVportActorController` is imported directly from `@/features/booking/adapters/booking.adapter` in three settings controllers (`account.controller.js`, `vportDirectoryVisibility.controller.js`, `actorPrivacy.controller.js`). This is a cross-feature adapter import — permitted by adapter boundary rules, but the ownership assertion function arguably belongs in the identity or actors engine rather than the booking adapter.

2. **social and feed adapter imports in privacy controller**: `actorPrivacy.controller.js` imports `invalidateActorPrivacyCacheAdapter` from `@/features/social/adapters/privacy/actorPrivacy.adapter` and `invalidateActorBundleEntry` from `@/features/feed/adapters/feedCache.adapter`. These are two separate cross-feature adapter imports from the privacy controller — within adapter rules but creates coupling to two external feature caches.

3. **saveProfile.controller.js passes profileId**: The profile save controller uses `profileId` as a parameter, which conflicts with the VCSM architecture rule that domain entities must be scoped to `actorId`. This is a soft rule violation worth tracking.

---

## SPAGHETTI SCORE

**Module:** settings
**Score:** WATCH
**Reasons:** Three cross-feature adapter imports in controller layer (booking, social, feed); saveProfile.controller.js uses profileId; settings.adapter.js exposes only one hook despite 91 source files; no formal tests for destructive paths; BEHAVIOR.md is empty stub.
**Release risk:** MEDIUM

---

## BEHAVIOR CONTRACT CONSISTENCY CHECK

**BEHAVIOR.md present:** YES
**Status:** PLACEHOLDER — contract not written

**Check A (Source without behavior):** FAIL — source is fully implemented (91 files, 4 tabs, deletion flows, privacy controls) but BEHAVIOR.md contains no behavioral specification.
**Check B (Behavior without source):** N/A — BEHAVIOR.md has no §3 happy paths to check.
**Check C (§13 engine consistency):** CANNOT CHECK — BEHAVIOR.md has no engine declarations. Scanner reports 8 engines: booking, directory, hydration, identity, media, notification, profile, qr. All confirmed present in source imports.
**Check D (§6 data change consistency):** CANNOT CHECK — BEHAVIOR.md has no §6 data change declarations. Scanner reports 17 write surfaces; source confirms all are active (Edge Function, 5 RPCs, direct table writes across profiles, actor_privacy_settings, profile_public_details).

---

## FINAL MODULE STATUS

MOSTLY COMPLETE

## MODULE BUILD PRIORITY

| Priority | Work Needed | Reason | Recommended Command |
|---|---|---|---|
| P1 | Write BEHAVIOR.md — full behavioral contract | Destructive paths (account delete, VPORT hard delete) with no documented spec is the top governance gap | LOGAN |
| P2 | Add regression tests for account deletion and VPORT lifecycle | 0 formal tests on the most destructive write surfaces in the platform | SPIDER-MAN |
| P3 | Expand settings.adapter.js boundary | Only useVportAccountOps is exported; other consumers bypass the adapter | VENOM |
| P4 | Migrate assertActorOwnsVportActorController to identity or actors engine | Ownership assertion should not live in the booking feature adapter | ARCHITECT |

## RECOMMENDED HANDOFFS

- **LOGAN** — Write full BEHAVIOR.md contract (tabs, states, deletion flows, privacy rules)
- **SPIDER-MAN** — Add regression tests for soft/hard delete paths and privacy toggle
- **VENOM** — Audit cross-feature adapter imports in privacy and account controllers
- **SENTRY** — Add observability for profile_public_details sync failures
- **LOKI** — Audit cache invalidation gaps after profile/vport settings writes
- **IRONMAN** — Register module ownership record

---

## Scanner Inputs

| Map | Generated At | Freshness | Confidence |
|---|---|---|---|
| feature-map | 2026-06-04T19:48:25Z | FRESH | HIGH |
| callgraph | 2026-06-04T19:48:25Z | FRESH | HIGH |
| write-surface-map | 2026-06-04T19:48:25Z | FRESH | HIGH |
| route-map | 2026-06-04T19:48:25Z | FRESH | HIGH |
| engine-candidates | 2026-06-04T19:48:25Z | FRESH | MEDIUM |
| dependency-map | 2026-06-04T19:48:25Z | FRESH | HIGH |
