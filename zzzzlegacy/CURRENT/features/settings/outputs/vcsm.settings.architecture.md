---
# vcsm.settings.architecture.md
# ARCHITECT Module Architecture Report — VCSM settings
# Generated: 2026-06-02
# Ticket: ARCHITECT-SETTINGS-0001
# Status: IMMUTABLE — dated output

---

## Module Architecture Report — §26.11

**Feature:** settings
**App:** VCSM
**Security Tier:** HIGH
**Feature Status:** ACTIVE
**Source Path:** apps/VCSM/src/features/settings/
**Engine Path:** None — feature-only
**CURRENT Path:** zNOTFORPRODUCTION/CURRENT/features/settings/

---

## Feature Overview

The settings feature is the owner-only configuration surface for VCSM actors and VPORTs. It is organized into four independent controller stacks (account, privacy, profile, vports) under `settings/`, plus a shared adapter layer and a cross-feature dashboard card entry point at `dashboard/vport/dashboard/cards/settings/`. All write paths must be OWNER-gated; the privacy controller stack has two HIGH-severity deferred ownership gaps (ELEK-002/004). The feature manages account lifecycle (create/soft-delete/hard-delete/restore), actor privacy (private/public toggle, block management), profile display (avatar, bio, banner), and VPORT configuration (business card, directory visibility, social settings).

---

## Layer Presence

| Layer | Present | Path |
|---|---|---|
| Controllers | YES | `account/controller/`, `privacy/controller/`, `profile/controller/`, `vports/controller/` |
| DALs | YES | `account/dal/`, `privacy/dal/`, `profile/dal/`, `vports/dal/` |
| Models | YES | `privacy/models/blocks.model.js`, `vports/model/vport.model.js`, `profile/model/profile.model.js`, `profile/model/vportPublicDetails.model.js`, `profile/ui/vportAboutDetails.model.js` (LAYER VIOLATION) |
| Hooks | YES | `account/hooks/`, `privacy/hooks/`, `profile/hooks/`, `vports/hooks/`, `queries/` (dead-code status unconfirmed) |
| Screens | YES | `screen/SettingsScreen.jsx` (hub), `profile/adapter/ProfileTab.jsx`, `profile/adapter/UserProfileTab.jsx`, `profile/adapter/VportProfileTab.jsx` |
| Components | YES | `ui/Card.jsx`, `ui/Row.jsx`, `account/ui/`, `privacy/ui/`, `vports/ui/`, `profile/ui/` |
| Adapters | YES | `adapters/settings.adapter.js`, `adapters/privacy/hooks/useMyBlocks.adapter.js`, `adapters/profile/ui/VportAboutDetails.view.adapter.js`, `adapters/ui/Card.adapter.js` |
| Engine controllers | NO | None |
| Engine DALs | NO | None |

---

## Active Controllers (15 total)

| Controller | Purpose | Auth Gate |
|---|---|---|
| `account/controller/account.controller.js` | Account/VPORT lifecycle | `assertActorOwnsVportActorController` (hard delete); SECURITY DEFINER RPCs (others) |
| `privacy/controller/actorPrivacy.controller.js` | Actor privacy toggle | PARTIAL — ELEK-002 HIGH DEFERRED |
| `privacy/controller/Blocks.controller.js` | Block/unblock/list/search | `callerActorId === actorId` string equality |
| `profile/controller/profile.controller.js` | Profile read/save (user + vport) | DAL-level `owner_user_id = auth.uid()` (VPORT); session RLS (user) |
| `profile/controller/saveProfile.controller.js` | Thin save wrapper (legacy) | DAL-level only — no controller gate |
| `profile/controller/authSession.controller.js` | Auth session utility | Session gate |
| `profile/controller/recordProfileMediaAsset.controller.js` | Media asset recording | Via media adapter |
| `profile/controller/resolveVportIdByActorId.controller.js` | actorId → vportId resolution | Read-only |
| `vports/controller/listMyVports.controller.js` | List caller's VPORTs | DAL actor_owners join |
| `vports/controller/getAuthedUserId.controller.js` | Resolve auth user ID | Session gate |
| `vports/controller/getProfileActorId.controller.js` | Resolve actorId from profile | Read-only |
| `vports/controller/vportBusinessCard.controller.js` | Publish/unpublish business card | `assertActorOwnsVportActorController` |
| `vports/controller/vportBusinessCardSettings.controller.js` | Get/save business card settings | `assertActorOwnsVportActorController` + DAL defense-in-depth |
| `vports/controller/vportDirectoryVisibility.controller.js` | Get/toggle directory visibility | `assertActorOwnsVportActorController` + DAL defense-in-depth |
| `vports/controller/vportSocialSettings.controller.js` | Get/update social settings | `assertActorOwnsVportActorController`; BLOCKED by TICKET-SUB-010-B |

---

## Active DALs (16 total)

| DAL | Tables | Notes |
|---|---|---|
| `account/dal/account.read.dal.js` | `vc.actors` | Explicit columns |
| `account/dal/account.write.dal.js` | `public.profiles` (via RPC), `vport.profiles` (via RPC) | RPCs: `soft_delete_citizen_account`, `delete-citizen-account` Edge Function, `vport.soft_delete_vport`, `vport.restore_vport`, `vport.hard_delete_vport` |
| `privacy/dal/blocks.dal.js` | `moderation.blocks`, `vc.actors` | RPCs: `moderation.block_actor`, `moderation.unblock_actor` |
| `privacy/dal/visibility.dal.js` | `vc.actor_privacy_settings` | UPSERT; no `auth.getUser()` (ELEK-004) |
| `profile/dal/actorIdBySubject.read.dal.js` | `vc.actors` | Actor resolution by profile/vport subject |
| `profile/dal/actors.read.dal.js` | `vc.actors` | `dalReadVportIdByActorId` |
| `profile/dal/auth.read.dal.js` | Auth session | getUser wrapper |
| `profile/dal/profile.read.dal.js` | `public.profiles`, `vport.profiles` | Explicit columns; dual-mode |
| `profile/dal/profile.write.dal.js` | `public.profiles`, `vport.profiles` | `owner_user_id = auth.uid()` WHERE guard on VPORT |
| `profile/dal/profileMediaAsset.write.dal.js` | `platform.media_assets` | Media asset recording |
| `profile/dal/vportPublicDetails.read.dal.js` | `vport.profile_public_details` | Read VPORT public details |
| `profile/dal/vportPublicDetails.write.dal.js` | `vport.profile_public_details` | BW-SETTINGS-005: no optimistic lock |
| `vports/dal/actorOwners.read.dal.js` | `vc.actor_owners` | No `auth.getUser()` binding (ELEK-006 INFO) |
| `vports/dal/auth.read.dal.js` | Auth session | getUser wrapper |
| `vports/dal/vports.read.dal.js` | `vc.actor_owners`, `vc.actors`, `vport.profiles` | Two-hop actor_owners join; legacy `owner_user_id` guard in some sub-functions (VENOM-SETTINGS-004) |
| `vports/dal/vports.write.dal.js` | `vport.profiles`, `vport.profile_public_details` | RPC `set_business_card_publish_state` (SECURITY DEFINER); UPDATE with `owner_user_id` guard; `syncDirectoryVisibleToPublicDetailsDAL` extracted per VPD-V-FIX-002 |

---

## Active Hooks (22 total)

| Hook | What It Calls | Purpose |
|---|---|---|
| `account/hooks/useAccountController.js` | account controller + `useAccountSettings` | Full account lifecycle state |
| `account/hooks/useVportAccountOps.js` | account ops | Account operations |
| `privacy/hooks/useActorPrivacy.js` | `ctrlGetActorPrivacy`, `ctrlSetActorPrivacy` | Privacy toggle |
| `privacy/hooks/useActorLookup.js` | actor lookup | Search for actors |
| `privacy/hooks/useMyBlocks.jsx` | `ctrlListMyBlocks`, `ctrlBlockActor`, `ctrlUnblockActor` | Block list |
| `privacy/hooks/usePendingFollowRequestActions.js` | social adapters | Follow request management |
| `profile/hooks/useProfileController.js` | `loadProfileCore`, `saveProfileCore`, `ctrlResolveVportIdByActorId`; React Query | Profile edit lifecycle |
| `profile/hooks/useProfileUploads.js` | media + vport adapters | Avatar/banner uploads |
| `vports/hooks/useVportsController.js` | `listMyVportsController` | VPORT list |
| `vports/hooks/useVportsList.js` | `listMyVportsDAL` | VPORT list read |
| `vports/hooks/useVportBusinessCardSettings.js` | vportBusinessCardSettings controller | Business card settings |
| `vports/hooks/useVportDirectoryVisibility.js` | vportDirectoryVisibility controller | Directory visibility |
| `vports/hooks/useResolvedVportId.js` | resolution logic | Pre-resolves vportId |
| `vports/hooks/useProfileActor.js` | actor resolution | Actor identity |
| `vports/hooks/useVportSwitcher.js` | identity ops | VPORT switching |
| `vports/hooks/useVportNotificationBadges.js` | notifications adapter | Badge counts |
| `queries/useAccountSettings.js` | account DAL | Dead-code status unconfirmed |
| `queries/useBlockedCitizens.js` | privacy DAL | Dead-code status unconfirmed |
| `queries/usePrivacySettings.js` | privacy DAL | Dead-code status unconfirmed |
| `queries/useProfileSettings.js` | profile DAL | Dead-code status unconfirmed |
| `queries/useUpdateVportVisibility.js` | vports DAL | Dead-code status unconfirmed |
| `queries/useUserVports.js` | vports DAL | Dead-code status unconfirmed |

---

## Engine Dependencies

None identified. No imports from `engines/` in this feature.

---

## Cross-Feature Dependencies

| Feature | What Is Imported | Direction |
|---|---|---|
| `booking` | `assertActorOwnsVportActorController` (adapter + direct controller) | settings → booking |
| `identity` | `useIdentity`, `useIdentityOps` (adapter) | settings → identity |
| `profiles` | `useProfilesOps` (adapter) | settings → profiles |
| `social` | `invalidateActorPrivacyCacheAdapter`, `invalidateActorSocialPublicPolicyCache`, `invalidateActorSocialSettingsCache`, `dalUpdateActorSocialSettings` (DAL DIRECT — boundary violation), `dalGetActorSocialSettings` (DAL DIRECT), `useFollowRequestActions`, `useIncomingFollowRequests` | settings → social |
| `feed` | `invalidateActorBundleEntry` (adapter) | settings → feed |
| `actors` | `searchActorsAdapter` | settings → actors |
| `media` | `createMediaAssetController` (adapter) | settings → media |
| `vport` | `CreateVportForm.jsx.adapter`, `vport.adapter` DAL helpers, `vport.public.adapter` | settings → vport |
| `notifications` | `getUnreadNotificationCount` (adapter) | settings → notifications |
| `dashboard/qrcode` | `QrCode` (adapter) | settings → dashboard/qrcode |
| `ads` | `OnemoredaysAd.adapter` | settings → ads |

---

## Authorization Pattern

VPORT write paths use a two-layer defense:
1. Controller layer: `assertActorOwnsVportActorController` — verifies `actor_owners` membership, kind=vport, not void/deleted.
2. DAL layer: `owner_user_id = auth.uid()` WHERE clause (defense-in-depth; secondary).

Account delete operations: SECURITY DEFINER RPCs + Edge Function (service-role).

Privacy/blocks: `ctrlBlockActor`/`ctrlUnblockActor` use string equality `callerActorId === actorId`. `ctrlSetActorPrivacy` partially gated — caller-supplied `actorId` not anchored to server session (ELEK-002).

User profile writes: session-scoped RLS at DB level; no controller-layer ownership gate.

---

## Module Independence Classification

DEPENDENT — broad imports from booking (ownership gate), social, identity, profiles, feed, actors, media, vport, notifications, ads, and dashboard. Ownership enforcement depends on `booking` feature.

---

## Architecture State

EVOLVING — four controller stacks active; VPORT write paths gated; mid-sprint (TICKET-SUB-010-B pending); two HIGH deferred security gaps; deprecated live DAL; model in UI folder; adapter boundary violation; unconfirmed dead-code in queries/.

---

## Known Structural Risks

1. ELEK-002 (HIGH, DEFERRED) — `ctrlSetActorPrivacy`: no server-side session binding on actorId; actor privacy hijack possible.
2. ELEK-004 (HIGH, DEFERRED) — `dalSetActorPrivacy`: no `auth.getUser()` binding; RLS on `vc.actor_privacy_settings` unconfirmed.
3. ELEK-005 (OPEN) — `dalDeleteOwnedVportById`: deprecated DAL still exported live; legacy `owner_user_id`; omits cascade.
4. VENOM-SETTINGS-004 (P2, DEFERRED) — `listMyVportsDAL` / `readMyVports`: `owner_user_id` identity surface; rewrite to `actor_owners` join pending.
5. Layer violation — `profile/ui/vportAboutDetails.model.js` is a model file in a UI folder.
6. Adapter boundary violation — `vportSocialSettings.controller.js` imports directly from `@/features/social/privacy/dal/actorSocialSettings.dal`.
7. Dead-code risk — `settings/queries/` contains 6 hook files of unconfirmed live usage status.
8. BW-SETTINGS-005 (OPEN) — `upsertVportPublicDetailsDAL`: no optimistic locking.
9. TICKET-SUB-010-B (PENDING) — `actor_social_settings` owner-delegation RLS migration blocks `ctrlUpdateVportSocialSettings`.
10. Ownership gate cross-feature dependency — `assertActorOwnsVportActorController` lives in `booking`; settings cannot enforce VPORT ownership without it.

---

## Module Completeness Matrix

| Area | Status | Evidence | Missing / Risk |
|---|---|---|---|
| Purpose defined | PASS | ARCHITECTURE.md + DR_STRANGE.md | — |
| Owner defined | PARTIAL | IRONMAN 2026-05-26 audit confirmed | OWNERSHIP.md missing |
| Entry points mapped | PASS | SettingsScreen.jsx + 4 tabs + dashboard card | — |
| Controllers present | PASS | 15 controllers across 4 stacks | Privacy stack ELEK-002 gap |
| DAL/repository present | PASS | 16 DAL files | Deprecated DAL live (ELEK-005); legacy owner_user_id in reads |
| Models/transformers | PARTIAL | 5 models present | Model in UI folder (layer violation) |
| Hooks/view models | PARTIAL | 22 hooks | queries/ dead-code status unconfirmed |
| Screens/components | PASS | SettingsScreen.jsx + 4 tab views + components | — |
| Authorization path mapped | PARTIAL | VPORT paths gated; privacy paths partial | ELEK-002/004 deferred; user profile RLS only |
| Engine dependencies mapped | N/A | No engine deps | — |
| Tests/validation noted | FAIL | Zero coverage confirmed SPM-007 | Not re-audited post-TICKET-0009 |

---

## Recommended Handoffs

- SENTRY — post-TICKET-0009 execution review
- VENOM + ELEKTRA — after TICKET-SUB-010-B migration; focus ELEK-002/004 + boundary violation
- IRONMAN — create OWNERSHIP.md; audit queries/ for dead code; audit saveProfile.controller.js for removal
- CARNAGE — track TICKET-SUB-010-B migration
- SPIDER-MAN — SPM-007: test coverage for settings hooks, validation model, controller gates

---

## Final Module Status

MOSTLY_COMPLETE

Core architecture present and active. VPORT write paths gated. Blocked at full completeness by: two HIGH deferred security gaps (ELEK-002/004), pending DB migration (TICKET-SUB-010-B), zero test coverage, deprecated live DAL, model layer violation, adapter boundary violation, and unconfirmed dead-code in queries/.

---

## ARCHITECT Run Record

- Date: 2026-06-02
- Ticket: ARCHITECT-SETTINGS-0001
- Architecture State: EVOLVING
- Controller Count: 15
- DAL Count: 16
- Hook Count: 22
- Engine Deps: None
- Structural Risks: 10 identified
- Module Status: MOSTLY_COMPLETE
