
---

## Layer Architecture Standard

```
DAL → Model → Controller → Hook → Screen
```

DAL: Raw Supabase queries, single responsibility
Model: Pure domain transforms
Controller: Business logic orchestration
Hook: React lifecycle bridge
Screen: Pure composition — no computation, no direct DB

---

## Feature Inventory (31 features)

### FULLY LAYERED

**auth**
- DAL: actorOwnerCreate, actorCreate, login, authSession.read, register, onboarding, profile, actorGetByProfile, resetPassword (9 files)
- Controllers: completeProfileGate, authSession, register, onboarding, profile, login, createUserActor, sendResetPassword, profileOnboarding (9 files)
- Screens: Onboarding, ResetPasswordScreen, LoginScreen, CompleteProfileGate, RegisterScreen

**block**
- DAL: block.check, block.read, block.write (3 files) — all read/write moderation.blocks
- Controllers: blockActor, getBlockStatus, getBlockedActorSet (3 files)
- Hooks: useBlockStatus, useBlockActions, useBlockActorAction (3 files)
- Adapters: useBlockStatus.adapter, useBlockActorAction.adapter, ActorActionsMenu, BlockConfirmModal.adapter (4 files)
- UI: BlockButton, BlockConfirmModal, BlockedState, BlockGate (4 files)
- Dev-only: block.diagnostics.dal (dev/diagnostics/dal — not in feature tree)
- Write path: moderation.block_actor / moderation.unblock_actor RPCs (SECURITY DEFINER)
- Feed cache: readFeedBlockRowsDAL — 60s TTL, invalidated by useBlockActions + useBlockActorAction
- _Verified FULLY LAYERED: 2026-05-14_

**booking**
- DAL: insertBooking, listAvailabilityExceptionsInRange, readActorOwnerLink, listBookingsBy*, upsertBookingResource*, listBookingService*, saveBookingServiceProfile*, listAvailabilityRules, getBookingResourceById, getActorById, getBookingById, updateBookingStatus, upsertAvailabilityRule, upsertAvailabilityException (15 files)
- Controllers: assertActorOwnsVport, getBookingServiceProfiles, setAvailabilityException, ensureOwnerBookingResource, listBookingHistory, setResourceSlotDuration, listOwnerBookingResources, setAvailabilityRule, getResourceAvailability, createBooking, confirmBooking, cancelBooking (12 files)
- Screens: none at top level (.gitkeep)

**feed**
- DAL: feed.read.*, listActorPostsByActor, feed.mentions, feed.posts (10 files)
- Controllers: listActorPosts, getDebugPrivacyRows, getFeedViewerContext (3 files)
- Hooks: useFeed, useFeedPipeline, useFeedFilter
- Screens: CentralFeedScreen, DebugPrivacyPanel, DebugFeedFilterPanel, FeedConfirmModal

**post**
- DAL: postMentions.*, post.read/write, postReactions.*, comments.*, commentLikes.*, listPostComments* (11 files)
- Controllers: editPost, getPostById, deletePost, getPostReactions, getPostMentionMap; commentReactions.hydrator, deleteComment, editComment, postComments.count (4 files)
- Screens: PostDetail.view, PostDetail.screen, PostFeed.screen, EditPost; CommentList

**profiles**
- DAL: readPostMedia*, readPostReactions, readFollowState, readPostRose*, readActorPosts, readActorIdByUsername, friends.read, friendRanks.*, listPost*, readActorVibeTags (15 files)
- Controllers: getActorKind, resolveUsernameToActor, getVportType, getProfileView, getTopFriendsBy*, saveFriendRanks, getFriendLists, getActorVibeTags (6 files)
- Screens: ActorProfileScreen, UsernameProfileRedirect, ActorProfileViewScreen, ActorProfileHeader, ActorProfilePostsView, VportProfileKindScreen, VportProfileViewScreen

**wanders**
- DAL: wandersCardKeys.dal (1 file)
- Controllers: mailbox, publishWandersFromBuilder, authSession, createWandersCard, cardKeys, wandersInboxes, replies, _ensureGuestUser, cards (10+ files)
- Screens: WandersOutbox, WandersCreate, WandersHome, WandersSent, WandersCardPublic, WandersInboxPublic, WandersMailbox, WandersIntegrateActor

**explore**
- DAL: search.data.js, findActorsByHandles (2 files)
- Controllers: searchActors, searchExplore (2 files)
- Hooks: useExplore, useSearch
- Screens: ExploreScreen

**settings**
- DAL: privacy/blocks, privacy/visibility, profile/auth.read, profile/vportPublicDetails.read/write, profile/actors.read, account/account.read, vports/auth.read, vports/actorOwners.read (10 files)
- Controllers: profile, privacy, account, vportDetails, actorOwners, blocks (8 files)
- Adapters: 3 files

**legal**
- DAL: getPublicIp (dead/retained), userConsents.read/write, legalDocuments.read (4 files)
- Engine: legalCompliance.engine.js (pure compliance check — functions as model layer; not detected by *.model.js scanner)
- Controllers: legalConsent (8 exports), legalDocument (1 export) (2 files)
- Hooks: useLegalConsent, useLegalDocument, useSignupConsent (3 files)
- Adapter: legal.adapter.js (4 exports: useSignupConsent, useLegalConsent, ConsentGateScreen, recordSignupConsent)
- Screens: ConsentGateScreen (guard-embedded, not routed), LegalDocumentScreen, AboutScreen, ContactScreen, HowToCreate*, VportCategoryLanding (6 routed + 1 guard)
- Components: legal/docs/ (AgeVerificationContent, PrivacyPolicyContent, TermsOfServiceContent), legal/screens/components/ (ProfilePhonePreview, howToProfileContent)
- _Corrected: 2026-05-18 — LOGAN drift fix (3→4 DAL files; engine, hooks, adapter, components added)_

**moderation**
- DAL: conversationCover.read + multiple
- Controllers: hideReportedObject, dismissReport, getReportStatus, blockFromReport, resolveReportedObject, moderationState (6 files)
- Adapters: 3 files

**upload**
- DAL: multiple (media.read, media.write, mentionSuggestions)
- Controllers: searchMentionSuggestions, createPost (2 files)
- Screens: UploadScreen, UploadScreenModern

### PARTIALLY LAYERED

**ads**
- Layers: DAL, Model, Hooks, Screens, UI, Usecases, Adapters
- Missing: explicit Controllers (logic in hooks)


**chat**
- Layers: Adapters wrapping @chat engine, Hooks, Screens (10+)
- Pattern: Engine wrapper — feature/chat delegates to @chat engine

**dashboard**
- Subfeatures: vport/ (owner dashboard screens), flyerBuilder/ (full DAL/controller/screen)
- flyerBuilder has full layer stack; vport/ is screen-only

**notifications**
- Layers: inbox/ (DAL, Controllers, Screens), publish.js
- Controllers: Notifications, notificationsCount, NotificationsHeader

**onboarding**
- DAL: onboardingSteps
- Controllers: onboardingController, vibeTagsOnboarding
- Screens: OnboardingCardsView, CitizenVibesScreen

**social**
- Subfeatures: friend/subscribe (controllers, dal), friend/request (controllers, dal), privacy
- Cross-feature via adapters pattern

**vport**
- DAL: readVportActorIdByVportId, subscribersList
- Controllers: getVportServiceCatalog
- Missing: screens (renders via profiles/kinds/vport/)

**professional**
- Screens: ProfessionalAccessScreen, NurseHomeScreen
- DAL + Controller minimal

### ENGINE WRAPPER FEATURES

**hydration** — setup.js + vcsmActorHydrator.js wrapping @hydration
**portfolio** — setup.js wrapping @portfolio
**reviews** — setup.js wrapping @reviews
**identity** — setup.js + provision.rpc.dal + refreshActorDirectory.dal + bootstrap controller

### MINIMAL / SUPPORT

**actors** — DAL, Controllers, Model (no screens — used internally)
**debug** — Components only (dev diagnostic routes)
**language** — JSON reports (not active code)
**public** — Public VPort menu screens (3 screens, 2 controllers, 2 DAL)
**ui** — ModernPrimitives.jsx (design system component library)
**vgrid** — Grid layout feature (DAL, Hook, Screen, Model, UI, Adapter)
**void** — Parallel structure to vgrid

---

## State Layer (src/state/)

```
state/
├── actors/
│   ├── actorStore.js          — export from @hydration
│   ├── useActorSummary.js     — export from @hydration
│   ├── hydrateActors.js       — export from @hydration
│   ├── assertActorId.js       — validation helper
│   └── profileGateStore.js    — profile completion gate
├── identity/
│   ├── identityContext.jsx    — context provider
│   ├── identity.controller.js — context business logic
│   ├── identity.read.dal.js   — auth session reads
│   ├── identitySelectors.js   — derived selectors
│   ├── identityStorage.js     — localStorage persistence (cache only)
│   ├── identitySwitcher.jsx   — actor/vport switch UI
│   ├── useIdentitySync.js     — sync hook
│   └── IdentityDebugger.jsx   — dev tool
└── social/
    └── followRequestsStore.js — follow request state
```

---

## Routes (src/app/routes/)

```
routes/
├── index.jsx                  — main router (50+ lazy-loaded screens)
├── protected/
│   └── app.routes.jsx         — authenticated app routes
├── public/
│   ├── auth.routes.jsx        — login, register, reset password
│   ├── legal.routes.jsx       — consent and legal documents
│   ├── vportMenu.routes.jsx   — public vport QR menu
│   └── wanders.routes.jsx     — public wanders card sharing
└── learning/
    └── learning.routes.jsx    — embedded LMS routes
```
