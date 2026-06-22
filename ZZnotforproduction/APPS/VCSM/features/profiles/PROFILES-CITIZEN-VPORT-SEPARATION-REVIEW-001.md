# PROFILES-CITIZEN-VPORT-SEPARATION-REVIEW-001
## Architecture Separation Audit — Read-Only Analysis

**Date:** 2026-06-07
**Scope:** `apps/VCSM/src/features/profiles/` — full deep read
**Type:** Architecture classification and migration planning
**Status:** COMPLETE — Read-only. No files modified.

---

## A. Executive Verdict

### Is profiles clean?
**NO — partially mixed, but structured.**

The profiles feature is not cleanly labeled. The root namespace (`features/profiles/`) contains a large shared actor-agnostic layer that serves both Citizen and VPORT profiles, plus two explicit kind trees (`kinds/citizen/` and `kinds/vport/`). This is not chaos — it is a deliberate polymorphic architecture — but the root layer lacks clear documentation of what is "shared" vs "citizen-only" vs "vport-only," which creates confusion and risks accidental cross-kind coupling on any new file added.

### Is profiles mixed?
**YES — in the root shared layer by design, not by accident.**

The root DAL, controllers, hooks, and models serve both Citizen and VPORT profiles with explicit kind-aware branching in a handful of files (`readActorProfile.dal.js`, `resolveActorSlug.dal.js`, `getProfileView.controller.js`, `actorSeo.model.js`). This is intentional and correct polymorphism. The problem is the absence of classification — the root layer looks undifferentiated to a new engineer.

### Should VPORT be extracted as a separate feature?
**NOT URGENT — `kinds/vport/` is already a de-facto separate feature with 250+ files.**

Option B (extract to `features/vportProfile/`) would be the long-term clean state. However, Option A (formalize split inside profiles with explicit `citizen/` and `vport/` subtrees) is already ~80% implemented. The `kinds/vport/` directory has its own DAL, controllers, hooks, models, screens, tabs, components, config, and lib. It only lacks a formal `vportProfile.adapter.js` public surface.

### Recommended split strategy
**Option A+ — Formalize the existing `kinds/` structure.**

Do NOT move files yet. The migration risk is high (250+ vport files, 6 citizen files, 403 total). The correct approach:
1. Formally document what the root shared layer is (not vport, not citizen — shared actor primitives)
2. Move 3 misplaced root files (vport config, vport type model refs) to `kinds/vport/`
3. Delete 1 deprecated file
4. Add one adapter: `vportProfile.adapter.js` to make vport's public boundary explicit
5. The 6 citizen files are already correctly placed in `kinds/citizen/`

Option B extraction can be deferred until VPORT profile has more dedicated adapter consumers or the shared root layer needs splitting.

---

## B. File Classification Table

### Root-Level Files (Shared Actor Primitives)

| File | Current Path | Classification | Proposed New Path | Reason |
|------|-------------|----------------|-------------------|--------|
| `profiles.adapter.js` | `adapters/profiles.adapter.js` | PROFILE_ADAPTER | KEEP — rename to `actor.adapter.js` optionally | Public surface — exports 3 shared hooks |
| `actorProfileScreenDependencies.adapter.js` | `adapters/ui/` | PROFILE_UI_SHARED | KEEP | Cross-feature dependency injection for profile screens |
| `PrivateProfileGate.adapter.js` | `adapters/ui/` | PROFILE_UI_SHARED | KEEP | Gate component adapter |
| `UnavailableProfileGate.adapter.js` | `adapters/ui/` | PROFILE_UI_SHARED | KEEP | Gate component adapter |
| `photoReactions.adapter.js` | `adapters/photos/` | SHARED_PROFILE | KEEP | Photo reactions hook export |
| `tagsData.adapter.js` | `adapters/tags/` | SHARED_PROFILE | KEEP | Tags hook export |
| `profileTabs.config.js` | `config/profileTabs.config.js` | VPORT_PROFILE ⚠️ | Move to `kinds/vport/config/profileTabs.config.js` | Contains exclusively VPORT tab configurations (13 vport tab layouts, 0 citizen tabs) |
| `PrivateProfileGate.jsx` | `components/` | PROFILE_UI_SHARED | KEEP | Shared gate UI |
| `UnavailableProfileGate.jsx` | `components/` | PROFILE_UI_SHARED | KEEP | Shared gate UI |
| `header/MessageButton.jsx` | `components/header/` | PROFILE_UI_SHARED | KEEP | Shared action button |
| `header/SubscribeButton.jsx` | `components/header/` | PROFILE_UI_SHARED | KEEP | Shared action button |
| `useUsernameProfileRedirect.js` | `hooks/` | CITIZEN_PROFILE | Move to `kinds/citizen/hooks/` | Username resolution — user actors only |
| `useActorSeoMeta.js` | `hooks/` | SHARED_PROFILE | KEEP | Sets SEO meta for both kinds |
| `useVportType.js` | `hooks/` | VPORT_PROFILE | Move to `kinds/vport/hooks/` | Fetches vport_type — vport actors only |
| `useActorSlugRedirect.js` | `hooks/` | SHARED_PROFILE | KEEP | Canonical URL enforcement for both kinds |
| `useActorProfileActions.js` | `hooks/` | SHARED_PROFILE | KEEP | Post share/report/delete — both kinds use posts |
| `useResolveActorBySlug.js` | `hooks/` | SHARED_PROFILE | KEEP | Slug → actorId for both kinds |
| `useActorKind.js` | `hooks/` | SHARED_PROFILE | KEEP | Kind detection — by definition shared |
| `useActorCanonicalSlug.js` | `hooks/` | SHARED_PROFILE | KEEP | Canonical slug for both kinds |
| `useProfilesOps.js` | `hooks/` | SHARED_PROFILE | KEEP (note: minor vport mixing — see §C) | Bundles shared + vport cache ops |
| `useProfileGate.js` | `hooks/` | SHARED_PROFILE | KEEP | Privacy gate for both kinds |
| `useProfileView.js` | `hooks/` | SHARED_PROFILE | KEEP | Profile data fetch — kind-aware internally |
| `profile.model.js` | `model/` | CITIZEN_PROFILE | Move to `kinds/citizen/model/` or `model/citizen/` | Explicitly user-only per file comment |
| `vportType.model.js` | `model/` | VPORT_PROFILE | Move to `kinds/vport/model/` | Vport type normalization only |
| `post.model.js` | `model/` | SHARED_PROFILE | KEEP | Post model — both kinds post |
| `postCanonical.model.js` | `model/` | SHARED_PROFILE | KEEP | Canonical post normalization |
| `isDeletedProfileActor.model.js` | `model/` | SHARED_PROFILE | KEEP | Availability check for both kinds |
| `actorSeo.model.js` | `model/` | SHARED_PROFILE | KEEP | SEO slug building — kind-aware, supports both |
| `friends/friendGraph.model.js` | `model/friends/` | CITIZEN_PROFILE | Move to `kinds/citizen/model/` | Friends system = citizen only |
| `photos/enrichPhotoPosts.model.js` | `model/photos/` | SHARED_PROFILE | KEEP | Photo enrichment — both kinds have photos |

### Root DAL Files

| File | Current Path | Classification | Proposed New Path | Reason |
|------|-------------|----------------|-------------------|--------|
| `readActorKind.dal.js` | `dal/` | SHARED_PROFILE | KEEP | Kind lookup — by definition shared |
| `readActorType.dal.js` | `dal/` | SHARED_PROFILE | KEEP | Polymorphic — queries both user and vport tables |
| `readVportType.dal.js` | `dal/` | VPORT_PROFILE ⚠️ | Move to `kinds/vport/dal/` | Delegates entirely to readActorTypeDAL for vport_type only |
| `readActorProfile.dal.js` | `dal/` | SHARED_PROFILE | KEEP | Kind-aware polymorphic read (user vs vport table branch) |
| `readActorSeoData.dal.js` | `dal/` | SHARED_PROFILE (vport-heavy) | KEEP | Required in shared layer for slug building; vport-centric but user fallback present |
| `resolveActorSlug.dal.js` | `dal/` | SHARED_PROFILE | KEEP | Polymorphic slug resolution |
| `readActorIdByUsername.dal.js` | `dal/` | CITIZEN_PROFILE ⚠️ | Move to `kinds/citizen/dal/` | Username lookup — user actors only |
| `readActorPosts.dal.js` | `dal/` | SHARED_PROFILE | KEEP | Both kinds have posts |
| `readFollowState.dal.js` | `dal/` | SHARED_PROFILE | KEEP | Follow state — both kinds can be followed |
| `readPostMediaByPostIds.dal.js` | `dal/` | SHARED_PROFILE | KEEP | Media hydration — both kinds |
| `readPostReactions.dal.js` | `dal/` | SHARED_PROFILE | KEEP | Stub — both kinds |
| `readPostRoseCounts.dal.js` | `dal/` | SHARED_PROFILE | KEEP | Stub — both kinds |
| `friends/friends.read.dal.js` | `dal/friends/` | CITIZEN_PROFILE | Move to `kinds/citizen/dal/` | Friends = citizen only |
| `friends/friendRanks.write.dal.js` | `dal/friends/` | CITIZEN_PROFILE | Move to `kinds/citizen/dal/` | Friend ranks = citizen only |
| `friends/friendRanks.reconcile.dal.js` | `dal/friends/` | CITIZEN_PROFILE | Move to `kinds/citizen/dal/` | Friend ranks = citizen only |
| `photos/listPostReactions.dal.js` | `dal/photos/` | SHARED_PROFILE | KEEP | Both kinds have photo reactions |
| `photos/listPostCommentsCount.dal.js` | `dal/photos/` | SHARED_PROFILE | KEEP | Both kinds have comments |
| `photos/listPostRoseCount.dal.js` | `dal/photos/` | SHARED_PROFILE | KEEP | Both kinds have roses |
| `tags/readActorVibeTags.dal.js` | `dal/tags/` | SHARED_PROFILE | KEEP | Both kinds can have tags |
| `post/fetchPostsForActor.dal.js` | `dal/post/` | SHARED_PROFILE | KEEP | Both kinds post content |

### Root Controller Files

| File | Current Path | Classification | Proposed New Path | Reason |
|------|-------------|----------------|-------------------|--------|
| `buildActorCanonicalSlug.controller.js` | `controller/` | SHARED_PROFILE | KEEP | Both kinds need canonical slugs |
| `getActorKind.controller.js` | `controller/` | SHARED_PROFILE | KEEP | Kind detection — shared |
| `getProfileView.controller.js` | `controller/` | SHARED_PROFILE | KEEP | Kind-aware polymorphic read |
| `profileCache.controller.js` | `controller/` | SHARED_PROFILE | KEEP | Cache invalidation boundary |
| `resolveActorBySlug.controller.js` | `controller/` | SHARED_PROFILE | KEEP | Slug resolution — both kinds |
| `resolveUsernameToActor.controller.js` | `controller/` | CITIZEN_PROFILE ⚠️ | Move to `kinds/citizen/controller/` | Username → actorId — user actors only |
| `friends/getFriendLists.controller.js` | `controller/friends/` | CITIZEN_PROFILE | Move to `kinds/citizen/controller/` | Friends = citizen |
| `friends/getTopFriendActorIds.controller.js` | `controller/friends/` | CITIZEN_PROFILE | Move to `kinds/citizen/controller/` | Friends = citizen |
| `friends/getTopFriendCandidates.controller.js` | `controller/friends/` | CITIZEN_PROFILE | Move to `kinds/citizen/controller/` | Friends = citizen |
| `friends/saveTopFriendRanks.controller.js` | `controller/friends/` | CITIZEN_PROFILE | Move to `kinds/citizen/controller/` | Friends = citizen |
| `friends/hydrateActorsIntoStore.controller.js` | `controller/friends/` | SHARED_PROFILE | KEEP or move to shared — used by friends only | Hydration re-export |
| `post/getActorPosts.controller.js` | `controller/post/` | SHARED_PROFILE | KEEP | Both kinds post |
| `photos/photoReactions.controller.js` | `controller/photos/` | SHARED_PROFILE | KEEP | Both kinds have photo reactions |
| `tags/getActorVibeTags.controller.js` | `controller/tags/` | SHARED_PROFILE | KEEP | Both kinds can have tags |

### Root Screen Files

| File | Current Path | Classification | Proposed New Path | Reason |
|------|-------------|----------------|-------------------|--------|
| `screens/ActorProfileScreen.jsx` | `screens/` | SHARED_PROFILE | KEEP | Route entry point for all profile kinds |
| `screens/UsernameProfileRedirect.jsx` | `screens/` | CITIZEN_PROFILE ⚠️ | Move to `kinds/citizen/screens/` or KEEP | Username redirect — user actors only |
| `screens/views/ActorProfileViewScreen.jsx` | `screens/views/` | CITIZEN_PROFILE | Move to `kinds/citizen/screens/` | Citizen profile view (friends/posts/photos/tags/videos tabs) |
| `screens/views/ActorProfilePostsView.jsx` | `screens/views/` | SHARED_PROFILE | KEEP | Reused by CitizenPostsTab AND VportVibesTab |
| `screens/views/ActorProfilePhotosView.jsx` | `screens/views/` | SHARED_PROFILE | KEEP | Reused by CitizenPhotosTab AND VportPhotosTab |
| `screens/views/ActorProfileFriendsView.jsx` | `screens/views/` | CITIZEN_PROFILE | Move to `kinds/citizen/screens/` | Friends = citizen |
| `screens/views/ActorProfileTagsView.jsx` | `screens/views/` | SHARED_PROFILE | KEEP — both kinds can have tags | |
| `screens/views/ActorProfileHeader.jsx` | `screens/views/` | SHARED_PROFILE | KEEP | Reused by VportProfileHeader (wrapper) |
| `screens/views/profileheader/` | `screens/views/profileheader/` | SHARED_PROFILE | KEEP | Header sub-components shared |
| `screens/views/tabs/post/` | `screens/views/tabs/post/` | SHARED_PROFILE | KEEP | Both kinds |
| `screens/views/tabs/photos/` | `screens/views/tabs/photos/` | SHARED_PROFILE | KEEP | Both kinds |
| `screens/views/tabs/friends/` | `screens/views/tabs/friends/` | CITIZEN_PROFILE | Move to `kinds/citizen/` | Friends = citizen |
| `screens/views/tabs/tags/` | `screens/views/tabs/tags/` | SHARED_PROFILE | KEEP | Both kinds |
| `screens/components/ActorProfileDevProbe.jsx` | `screens/components/` | PROFILE_UI_SHARED | KEEP | Dev tooling |
| `screens/components/ActorProfileProdDebugPanel.jsx` | `screens/components/` | PROFILE_UI_SHARED | KEEP | Dev tooling |
| `screens/hooks/useProfileRouteTelemetry.js` | `screens/hooks/` | SHARED_PROFILE | KEEP | Route telemetry — both kinds |

### kinds/citizen Files (All Small and Correct)

| File | Current Path | Classification | Proposed New Path | Reason |
|------|-------------|----------------|-------------------|--------|
| `CitizenTabRouter.jsx` | `kinds/citizen/tabs/` | CITIZEN_PROFILE | KEEP — already correct | Tab router for citizen profile |
| `CitizenPostsTab.jsx` | `kinds/citizen/tabs/posts/` | CITIZEN_PROFILE | KEEP | Thin wrapper → ActorProfilePostsView |
| `CitizenPhotosTab.jsx` | `kinds/citizen/tabs/photos/` | CITIZEN_PROFILE | KEEP | Thin wrapper → ActorProfilePhotosView |
| `CitizenVideosTab.jsx` | `kinds/citizen/tabs/videos/` | CITIZEN_PROFILE | KEEP | Placeholder — videos forthcoming |
| `CitizenTagsTab.jsx` | `kinds/citizen/tabs/tags/` | CITIZEN_PROFILE | KEEP | Thin wrapper → ActorProfileTagsView |
| `CitizenFriendsTab.jsx` | `kinds/citizen/tabs/friends/` | CITIZEN_PROFILE | KEEP | Thin wrapper → ActorProfileFriendsView |

### kinds/vport Files (250+ — All VPORT_PROFILE)

All files under `kinds/vport/` are correctly classified as VPORT_PROFILE. No misclassified files detected. See §D for proposed tree.

Special notes within vport:
| File | Classification | Note |
|------|----------------|------|
| `vportTypeRegistry.js` | DEAD_OR_ORPHAN | DEPRECATED — diagnostics-only, superceded by `getVportTabsByType.model.js`. DTAB-001 pending deletion. |
| `hooks/useVportPublicDetails.js` | VPORT_PROFILE | Shim/compatibility alias for `useVportDashboardDetails` — remove when in-flight branches are merged |
| `components/tabs/VportProfileTabs.jsx` | PROFILE_UI_SHARED | Reused by all vport tab types — correctly shared within vport scope |
| `components/vportprofileheader/VportProfileHeader.jsx` | PROFILE_UI_SHARED | Thin wrapper around shared `ActorProfileHeader` |

### Adapter Files (kinds/vport)

| File | Current Path | Classification | Proposed New Path | Reason |
|------|-------------|----------------|-------------------|--------|
| `vportProfiles.adapter.js` | `adapters/kinds/vport/` | VPORT_PROFILE | KEEP | Exposes locksmith/barbershop/portfolio hooks |
| `services.adapter.js` | `adapters/kinds/vport/` | VPORT_PROFILE | KEEP | Service catalog adapter |
| `exchange.adapter.js` | `adapters/kinds/vport/` | VPORT_PROFILE | KEEP | Exchange rate adapter |
| `ownership.adapter.js` | `adapters/kinds/vport/` | VPORT_PROFILE | KEEP | Delegates to vportDashboard |
| `locksmith.adapter.js` | `adapters/kinds/vport/` | VPORT_PROFILE | KEEP | Locksmith controllers |
| `config/vportTypes.config.adapter.js` | `adapters/kinds/vport/config/` | VPORT_PROFILE | KEEP | Type config re-export |
| `hooks/` (10+ adapters) | `adapters/kinds/vport/hooks/` | VPORT_PROFILE | KEEP | Vport hook adapters |
| `screens/` (4 adapters) | `adapters/kinds/vport/screens/` | VPORT_PROFILE | KEEP | Vport screen adapters |

### Deprecated/Dead Files

| File | Current Path | Classification | Reason |
|------|-------------|----------------|--------|
| `vportTypeRegistry.js` | `kinds/vport/` | DEAD_OR_ORPHAN | Deprecated, diagnostics-only. DTAB-001 queued. |
| `useVportPublicDetails.js` | `kinds/vport/hooks/` | DEAD_OR_ORPHAN (soon) | Shim — remove after branch merges |

### Styles (All PROFILE_UI_SHARED)

| File | Current Path | Classification | Note |
|------|-------------|----------------|------|
| `profiles-booking-daypanel-modern.css` | `styles/` | PROFILE_UI_SHARED | Vport booking UI |
| `profiles-portfolio-modern.css` | `styles/` | PROFILE_UI_SHARED | Vport portfolio UI |
| `profiles-photos-modern.css` | `styles/` | PROFILE_UI_SHARED | Both kinds — photos tab |
| `profiles-friends-modern.css` | `styles/` | CITIZEN_PROFILE | Friends tab — citizen only |
| `barbershop-owner-mode.css` | `styles/` | VPORT_PROFILE | Barbershop vport only |
| `profiles-booking-modern.css` | `styles/` | VPORT_PROFILE | Booking — vport only |
| `profiles-team-modern.css` | `styles/` | VPORT_PROFILE | Team tab — barbershop vport |

---

## C. Dependency Findings

### Boundary Violations (Actionable)

| Source | Target | Problem | Severity |
|--------|--------|---------|----------|
| `ActorProfileScreen.jsx` | `kinds/vport/hooks/useVportProfileBySlug` | Direct import of vport internal hook without going through `adapters/kinds/vport/` — bypasses adapter boundary | MEDIUM — Screen is route entry point; acceptable pragmatic shortcut but technically violates boundary |
| `useProfilesOps.js` | `kinds/vport/controller/getVportPublicDetails.controller` | Root shared hook imports directly from vport kind controller (invalidateVportPublicDetails) | LOW — Intentional ops bundling, documented |
| `useProfilesOps.js` | `kinds/vport/model/getVportTabsByType.model` | Root shared hook imports from vport kind model | LOW — Same ops bundle |
| `profileTabs.config.js` | (self) | Lives in root `config/` but contains 0 citizen tab definitions — 100% vport tab layouts | LOW — Misclassification, not a runtime issue |
| `profile.model.js` | (self) | Lives in root `model/` with comment "for USER ACTORS ONLY" — citizen-specific but not in citizen namespace | LOW — Naming clarity, not a runtime issue |
| `friends/` (all) | (self) | `dal/friends/`, `controller/friends/`, `model/friends/`, `screens/views/tabs/friends/` all live in shared root layer but are citizen-only | LOW — No vport code uses these; clean grouping just needs relabeling |
| `readVportType.dal.js` | (self) | Lives in root `dal/` but purely delegates to readActorTypeDAL for vport_type extraction — should be in kinds/vport/dal/ | LOW — Wrong namespace |

### Cross-Feature Imports (All Correct — Via Adapters)

| Source (profiles internal) | Target Feature | Via | Status |
|---------------------------|----------------|-----|--------|
| `kinds/vport/controller/barbershop/` | `upload` feature | `posts.adapter` | ✅ Correct |
| `kinds/vport/controller/barbershop/` | `booking` feature | `booking.adapter` | ✅ Correct |
| `kinds/vport/controller/review/` | `notifications` feature | `notifications.adapter` | ✅ Correct |
| `kinds/vport/controller/review/` | `media` feature | `media.adapter` | ✅ Correct |
| `kinds/vport/controller/review/` | `@reviews` engine | Direct engine import | ✅ Correct (engine import) |
| `kinds/vport/controller/subscribers/` | `social` feature | `privacy/actorSignalVisibility.adapter` | ✅ Correct |
| `kinds/vport/hooks/useVportOwnerQuickStats` | `vportDashboard` feature | `vportDashboard.adapter` | ✅ Correct |
| `kinds/vport/hooks/useVportProfileActions` | `moderation` feature | `useReportFlow.adapter` | ✅ Correct |
| `kinds/vport/hooks/useVportProfileActions` | `post` feature | `post.adapter` | ✅ Correct |
| `kinds/vport/screens/VportProfileViewScreen` | `social` feature | `PrivateProfileNotice.adapter` | ✅ Correct |
| `kinds/vport/screens/VportProfileViewScreen` | `post` feature | `post.adapter` | ✅ Correct |
| `kinds/vport/screens/VportProfileViewScreen` | `moderation` feature | `ReportModal.adapter` | ✅ Correct |
| `hooks/useProfileGate` | `social` feature | `social/adapters/...` | ✅ Correct |
| `hooks/useProfileGate` | `block` feature | `@/features/block` | ✅ Correct |
| `adapters/ui/actorProfileScreenDependencies` | Multiple features | All via adapters | ✅ Correct |

### External Consumers of profiles (All Correct — Via Adapters)

| Consumer Feature | Imported Path | Boundary |
|-----------------|---------------|---------|
| `flyerBuilder` | `adapters/profiles.adapter`, `adapters/kinds/vport/hooks/useVportPublicDetails.adapter` | ✅ Adapter |
| `public/vportMenu` | `adapters/profiles.adapter` | ✅ Adapter |
| `settings/profile` | `adapters/profiles.adapter` | ✅ Adapter |
| `shell/bottom-bar` | `adapters/profiles.adapter` | ✅ Adapter |
| `social` | `adapters/ui/PrivateProfileGate.adapter` | ✅ Adapter |
| `vport` | `adapters/kinds/vport/config/vportTypes.config.adapter`, `adapters/kinds/vport/hooks/services/useUpsertVportServices.adapter`, `adapters/profiles.adapter` | ✅ Adapter |
| `vportDashboard` | `adapters/kinds/vport/vportProfiles.adapter`, `adapters/kinds/vport/services.adapter`, `adapters/kinds/vport/exchange.adapter`, `adapters/kinds/vport/locksmith.adapter`, `adapters/kinds/vport/ownership.adapter`, `adapters/kinds/vport/screens/`, `adapters/profiles.adapter` | ✅ Adapter |
| `app/routes` | `adapters/profiles.adapter` | ✅ Adapter |
| `app/routes/lazyApp` | `screens/UsernameProfileRedirect`, `screens/ActorProfileScreen`, `screens/views/tabs/friends/components/TopFriendsRankEditor` | Route entry points — acceptable direct load |

**Critical finding:** NO external feature imports profiles internals directly. All consumers go through adapter boundaries. ✅

### Circular Dependency Check
**None detected.** Verified import direction:
- DAL never imports from controllers or hooks ✅
- Controllers only import from DAL and models ✅
- Hooks only import from controllers and adapters ✅
- Screens only import from hooks, models, and adapters ✅
- No backward imports (screen → DAL, model → hook, etc.) ✅

---

## D. Proposed Final Folder Tree

Option A+ (formalize existing structure — recommended):

```
apps/VCSM/src/features/profiles/
│
├── adapters/
│   ├── profiles.adapter.js               # PUBLIC — shared actor hooks (keep)
│   ├── ui/
│   │   ├── PrivateProfileGate.adapter.js
│   │   ├── UnavailableProfileGate.adapter.js
│   │   └── actorProfileScreenDependencies.adapter.js
│   ├── photos/photoReactions.adapter.js
│   ├── tags/tagsData.adapter.js
│   └── kinds/
│       └── vport/                        # All vport adapters — no change needed
│           ├── vportProfiles.adapter.js
│           ├── services.adapter.js
│           ├── exchange.adapter.js
│           ├── ownership.adapter.js
│           ├── locksmith.adapter.js
│           ├── config/
│           ├── hooks/
│           └── screens/
│
├── components/                           # Shared UI gates — no change
│   ├── PrivateProfileGate.jsx
│   ├── UnavailableProfileGate.jsx
│   └── header/
│
├── shared/                               # NEW LABEL — what was root shared layer
│   ├── dal/
│   │   ├── readActorKind.dal.js
│   │   ├── readActorType.dal.js
│   │   ├── readActorProfile.dal.js
│   │   ├── readActorSeoData.dal.js
│   │   ├── resolveActorSlug.dal.js
│   │   ├── readActorPosts.dal.js
│   │   ├── readFollowState.dal.js
│   │   ├── readPostMediaByPostIds.dal.js
│   │   ├── readPostReactions.dal.js
│   │   ├── readPostRoseCounts.dal.js
│   │   ├── photos/
│   │   ├── tags/
│   │   └── post/
│   ├── controller/
│   │   ├── buildActorCanonicalSlug.controller.js
│   │   ├── getActorKind.controller.js
│   │   ├── getProfileView.controller.js
│   │   ├── profileCache.controller.js
│   │   ├── resolveActorBySlug.controller.js
│   │   ├── post/
│   │   ├── photos/
│   │   └── tags/
│   ├── model/
│   │   ├── post.model.js
│   │   ├── postCanonical.model.js
│   │   ├── isDeletedProfileActor.model.js
│   │   ├── actorSeo.model.js
│   │   └── photos/
│   └── hooks/
│       ├── useActorSeoMeta.js
│       ├── useActorSlugRedirect.js
│       ├── useActorProfileActions.js
│       ├── useResolveActorBySlug.js
│       ├── useActorKind.js
│       ├── useActorCanonicalSlug.js
│       ├── useProfilesOps.js
│       ├── useProfileGate.js
│       └── useProfileView.js
│
├── kinds/
│   ├── profileKindRegistry.js             # No change — routes user→citizen, vport→vport
│   │
│   ├── citizen/                           # 6 files already here + migrate friends/username
│   │   ├── dal/
│   │   │   └── friends/                   # Move from root dal/friends/
│   │   ├── controller/
│   │   │   ├── friends/                   # Move from root controller/friends/
│   │   │   └── resolveUsernameToActor.controller.js  # Move from root
│   │   ├── model/
│   │   │   ├── profile.model.js           # Move from root model/
│   │   │   └── friends/                   # Move from root model/friends/
│   │   ├── hooks/
│   │   │   └── useUsernameProfileRedirect.js  # Move from root hooks/
│   │   ├── screens/
│   │   │   ├── ActorProfileViewScreen.jsx     # Move from root screens/views/
│   │   │   ├── ActorProfileFriendsView.jsx    # Move from root screens/views/
│   │   │   └── tabs/
│   │   │       └── friends/               # Move from root screens/views/tabs/friends/
│   │   └── tabs/                          # Already here — no change
│   │       ├── CitizenTabRouter.jsx
│   │       ├── posts/
│   │       ├── photos/
│   │       ├── videos/
│   │       ├── tags/
│   │       └── friends/
│   │
│   └── vport/                             # 250+ files — no structural change needed
│       ├── config/
│       │   ├── vportTypes.config.js
│       │   └── profileTabs.config.js      # Move from root config/ (currently misplaced)
│       ├── lib/menuCache.js
│       ├── model/                         # + vportType.model.js moved here from root
│       ├── dal/                           # + readVportType.dal.js moved here
│       ├── controller/
│       ├── hooks/
│       ├── components/
│       ├── tabs/
│       └── screens/
│
├── screens/                               # Entry screens only
│   ├── ActorProfileScreen.jsx             # Route entry — KEEP HERE
│   ├── UsernameProfileRedirect.jsx        # Citizen-only but serves route — KEEP or move
│   ├── views/
│   │   ├── ActorProfileHeader.jsx         # Shared — KEEP
│   │   ├── ActorProfilePostsView.jsx      # Shared (citizen + vport vibes) — KEEP
│   │   ├── ActorProfilePhotosView.jsx     # Shared (both kinds) — KEEP
│   │   ├── ActorProfileTagsView.jsx       # Shared — KEEP
│   │   ├── profileheader/
│   │   └── tabs/
│   │       ├── post/
│   │       ├── photos/
│   │       └── tags/
│   ├── components/                        # Dev tools — KEEP
│   └── hooks/                             # Route telemetry — KEEP
│
└── styles/
    ├── profiles-photos-modern.css         # Shared
    ├── profiles-friends-modern.css        # Citizen (minor — low priority)
    ├── barbershop-owner-mode.css          # Vport (minor — low priority)
    ├── profiles-booking-modern.css        # Vport
    ├── profiles-booking-daypanel-modern.css # Vport
    ├── profiles-portfolio-modern.css      # Vport
    └── profiles-team-modern.css          # Vport
```

---

## E. Migration Ticket Queue

### PROFILES-SPLIT-001 — Classify and annotate root shared layer
**Priority:** P2 | **Type:** TASK | **Risk:** ZERO (no file moves)
- Add `// SHARED_ACTOR_PRIMITIVE` header comment to all root dal/controller/model/hook files
- Add `// CITIZEN_ONLY` header to: readActorIdByUsername.dal.js, dal/friends/*, controller/friends/*, model/friends/*, profile.model.js, useUsernameProfileRedirect.js
- Add `// VPORT_ONLY` header to: readVportType.dal.js, vportType.model.js, useVportType.js, profileTabs.config.js
- No moves. No import changes. Documentation only.
- Prerequisite for all subsequent tickets.

### PROFILES-DEAD-001 — Delete deprecated vportTypeRegistry.js
**Priority:** P2 | **Type:** BUG | **Risk:** LOW
- Verify DTAB-001 governance is cleared
- Confirm no non-diagnostics callers with: `grep -r "vportTypeRegistry" apps/VCSM/src/ --include="*.js" --include="*.jsx"`
- Delete `kinds/vport/vportTypeRegistry.js`
- Remove `useVportPublicDetails.js` shim (verify in-flight branches merged first)

### PROFILES-VPORT-CONFIG-001 — Move profileTabs.config to kinds/vport/config
**Priority:** P3 | **Type:** ENG | **Risk:** LOW-MEDIUM
- Move `config/profileTabs.config.js` → `kinds/vport/config/profileTabs.config.js`
- Update all imports (search: `@/features/profiles/config/profileTabs.config`)
- Known consumers: `adapters/kinds/vport/screens/*`, `kinds/vport/model/getVportTabsByType.model.js`, `kinds/vport/vportTypeRegistry.js` (already dead)
- Update `vportTypes.config.adapter.js` if needed

### PROFILES-CITIZEN-CLEANUP-001 — Move citizen-specific files to kinds/citizen
**Priority:** P3 | **Type:** ENG | **Risk:** MEDIUM (many import paths change)
- **DAL moves:** `dal/friends/` → `kinds/citizen/dal/friends/`, `dal/readActorIdByUsername.dal.js` → `kinds/citizen/dal/`
- **Controller moves:** `controller/friends/` → `kinds/citizen/controller/friends/`, `controller/resolveUsernameToActor.controller.js` → `kinds/citizen/controller/`
- **Model moves:** `model/profile.model.js` → `kinds/citizen/model/`, `model/friends/` → `kinds/citizen/model/friends/`
- **Hook moves:** `hooks/useUsernameProfileRedirect.js` → `kinds/citizen/hooks/`
- **Screen moves:** `screens/views/ActorProfileViewScreen.jsx`, `screens/views/ActorProfileFriendsView.jsx`, `screens/views/tabs/friends/` → `kinds/citizen/screens/`
- Update all import paths. Run full type-check after each move.
- **Do not move** `screens/ActorProfileScreen.jsx` — route entry point

### PROFILES-VPORT-EXTRACT-001 — Move vport-only root files to kinds/vport
**Priority:** P3 | **Type:** ENG | **Risk:** LOW
- Move `dal/readVportType.dal.js` → `kinds/vport/dal/`
- Move `model/vportType.model.js` → `kinds/vport/model/`
- Move `hooks/useVportType.js` → `kinds/vport/hooks/`
- Update all imports (grep each before moving)
- Run full type-check after

### PROFILES-ADAPTER-SURFACE-001 — Create explicit vportProfile.adapter.js
**Priority:** P3 | **Type:** ENG | **Risk:** LOW
- Create `adapters/kinds/vport/vportProfile.adapter.js` as the canonical single-file public surface for the vport kind
- Consolidate what is currently split across: `vportProfiles.adapter.js`, `services.adapter.js`, `exchange.adapter.js`, `locksmith.adapter.js`, `ownership.adapter.js`
- OR: Keep granular adapters and create an index adapter that re-exports all of them
- Purpose: makes the "this is the vport boundary" explicit rather than implied

### PROFILES-SHARED-PRIMITIVES-001 — Create shared/ subdirectory
**Priority:** P4 | **Type:** ENG | **Risk:** MEDIUM (many imports)
- Create `shared/` directory under `features/profiles/`
- Physically move all classified SHARED_PROFILE dal/controller/model/hook files into `shared/`
- Update all internal imports
- This is the cleanest long-term state but highest risk and lowest urgency

### PROFILES-SCANNER-001 — Add import scanner enforcement
**Priority:** P4 | **Type:** TASK | **Risk:** ZERO
- Add lint rule: `no-import-from kinds/vport/* except through adapters/kinds/vport/*`
- Add lint rule: `no-import-from kinds/citizen/* except through adapters/citizen/* (if created)`
- Add lint rule: `no-import-from profiles/dal/* from screens or components`
- Enforce via eslint-plugin-import or path-restriction rules

---

## F. Safe Execution Order

```
Phase 1 — ZERO RISK: Classify (this ticket, already done)
  └── PROFILES-SPLIT-001 (annotation only)

Phase 2 — LOW RISK: Delete dead code
  └── PROFILES-DEAD-001 (delete vportTypeRegistry.js, remove shim)

Phase 3 — LOW RISK: Move misplaced vport-only root files
  └── PROFILES-VPORT-EXTRACT-001 (3 files: readVportType, vportType.model, useVportType)

Phase 4 — LOW RISK: Move profileTabs.config
  └── PROFILES-VPORT-CONFIG-001 (1 file, known consumers)

Phase 5 — MEDIUM RISK: Move citizen files
  └── PROFILES-CITIZEN-CLEANUP-001 (friends DAL/controllers/screens — heavy import updates)

Phase 6 — LOW RISK: Formalize vport adapter surface
  └── PROFILES-ADAPTER-SURFACE-001

Phase 7 — MEDIUM RISK: Create shared/ directory (optional — high effort, highest clarity)
  └── PROFILES-SHARED-PRIMITIVES-001

Phase 8 — ZERO RISK: Scanner enforcement
  └── PROFILES-SCANNER-001
```

---

## G. Files That Must NOT Move Yet

These files have tight coupling to routing, critical shared surfaces, or high consumer counts. Freeze until import path updates are explicitly planned.

| File | Reason |
|------|--------|
| `screens/ActorProfileScreen.jsx` | Route entry point — loaded by `lazyApp.jsx`, coupled to kind registry and routing hooks |
| `screens/UsernameProfileRedirect.jsx` | Route entry point — loaded by `lazyApp.jsx` |
| `screens/views/tabs/friends/components/TopFriendsRankEditor.jsx` | Loaded directly by `lazyApp.jsx` as a route |
| `adapters/profiles.adapter.js` | 8+ external consumers depend on this exact path — must not change without coordinated update |
| `adapters/kinds/vport/vportProfiles.adapter.js` | 3+ vportDashboard consumers |
| `adapters/kinds/vport/ownership.adapter.js` | 5+ gasprices controllers depend on this path |
| `adapters/kinds/vport/services.adapter.js` | vportDashboard + vport feature consumers |
| `kinds/profileKindRegistry.js` | Used by ActorProfileScreen directly — move would require screen update |
| All root `dal/` files | Consumers span controllers across features — defer until shared/ migration is fully planned |
| `config/profileTabs.config.js` | Plan PROFILES-VPORT-CONFIG-001 first and grep all consumers before moving |

---

## H. Build / Scanner Validation Commands

Run these before and after any migration phase to confirm no regressions:

```bash
# 1. Find all consumers of profiles adapter (track after any adapter path change)
grep -rn "@/features/profiles" apps/VCSM/src/ --include="*.js" --include="*.jsx" | grep -v "^apps/VCSM/src/features/profiles/" | sort

# 2. Confirm no direct vport internals imported outside adapter boundary
grep -rn "features/profiles/kinds/vport/" apps/VCSM/src/ --include="*.js" --include="*.jsx" | grep -v "^apps/VCSM/src/features/profiles/" | grep -v "adapters/kinds/vport"

# 3. Confirm no direct citizen internals imported outside
grep -rn "features/profiles/kinds/citizen/" apps/VCSM/src/ --include="*.js" --include="*.jsx" | grep -v "^apps/VCSM/src/features/profiles/"

# 4. Check for any remaining vportTypeRegistry references after deletion
grep -rn "vportTypeRegistry" apps/VCSM/src/ --include="*.js" --include="*.jsx"

# 5. Verify profileTabs.config consumer count before move
grep -rn "profileTabs.config" apps/VCSM/src/ --include="*.js" --include="*.jsx" | sort

# 6. Verify readVportType.dal consumer count before move
grep -rn "readVportType.dal" apps/VCSM/src/ --include="*.js" --include="*.jsx"

# 7. Verify useVportType consumer count before move
grep -rn "useVportType" apps/VCSM/src/ --include="*.js" --include="*.jsx"

# 8. Confirm profile.model.js consumer count before move
grep -rn "profile.model" apps/VCSM/src/ --include="*.js" --include="*.jsx"

# 9. Total file count in profiles (baseline before migrations)
find apps/VCSM/src/features/profiles -type f | wc -l
# Baseline: 403

# 10. Detect any import from root DAL inside screens (should be zero)
grep -rn "features/profiles/dal" apps/VCSM/src/features/profiles/screens/ --include="*.js" --include="*.jsx"

# 11. Detect any import from root DAL inside components
grep -rn "features/profiles/dal" apps/VCSM/src/features/profiles/components/ --include="*.js" --include="*.jsx"

# 12. Confirm no cross-kind imports
grep -rn "kinds/citizen" apps/VCSM/src/features/profiles/kinds/vport/ --include="*.js" --include="*.jsx"
grep -rn "kinds/vport" apps/VCSM/src/features/profiles/kinds/citizen/ --include="*.js" --include="*.jsx"
```

---

## Summary Statistics

| Metric | Count |
|--------|-------|
| Total files in profiles | 403 |
| JS files | 254 |
| JSX files | 142 |
| Test files (`__tests__/`) | 9 |
| CSS style files | 7 |
| Citizen-specific files | ~30 (6 in kinds/citizen + ~24 in root friends/username layer) |
| VPORT-specific files | ~250+ (all in kinds/vport + adapters/kinds/vport) |
| Shared actor primitive files | ~100 (root dal, controller, model, hooks, shared screens) |
| Deprecated/dead files | 2 (vportTypeRegistry.js, useVportPublicDetails.js shim) |
| Boundary violations | 1 actionable (ActorProfileScreen direct vport hook import) |
| External consumers | 8 features — all via adapters |
| Circular dependencies | 0 detected |
