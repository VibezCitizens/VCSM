# ARCHITECT — Feature Map
Generated: 2026-05-09

---

## VCSM Features

### actors
DAL: getActorSummariesByIds.dal.js, searchActors.dal.js
CONTROLLERS: hydrateActors.controller.js, searchActors.controller.js
File types: .js

### ads
DAL: ad.storage.dal.js
HOOKS: useVportAds.js, useDesktopBreakpoint.js
ADAPTERS: useVportAds.adapter.js
SCREENS: VportAdsSettingsScreen.jsx
File types: .js, .jsx

### auth
DAL: actorCreate, actorGetByProfile, actorOwnerCreate, authCallback, authSession.read, emailVerification, login, onboarding, profile, register, resetPassword
CONTROLLERS: authCallback, authOps, authSession, completeProfileGate, createUserActor, login, onboarding, profile, profileOnboarding, register, resendVerification, sendResetPassword, setNewPassword
HOOKS: useAuthCallback, useAuthOnboarding, useAuthOps, useCompleteProfileGate, useLogin, useRegister, useResendVerification, useResetPassword, useSetNewPassword
SCREENS: AuthCallbackScreen, ForgotPasswordScreen, LoginScreen, RegisterScreen, ResetPasswordScreen, VerifyEmailRequiredScreen, WelcomeScreen
File types: .js, .jsx

### block
DAL: block.check.dal.js, block.read.dal.js, block.write.dal.js
CONTROLLERS: blockActor, getBlockStatus, getBlockedActorSet
HOOKS: useBlockActions, useBlockActorAction, useBlockStatus
ADAPTERS: useBlockActorAction.adapter.js, useBlockStatus.adapter.js
File types: .js

### booking
DAL: getActorById, getBookingById, getBookingResourceById, insertBooking, insertBookingResource, listAvailabilityExceptions, listAvailabilityRules, listBookingResourceServices, listBookingResourcesByOwner, listBookingServiceProfiles, listBookingsByCustomer, listBookingsByResource, listBookingsInRange, readActorOwnerLink, readVportServicesByActor, saveBookingServiceProfileDurations, updateBookingStatus, upsertAvailabilityException, upsertAvailabilityRule, upsertBookingResourceServices
CONTROLLERS: assertActorOwnsVportActor, bookingServices, cancelBooking, confirmBooking, createBooking, ensureOwnerBookingResource, getBookingServiceProfiles, getResourceAvailability, listBookingHistory, listMyBookings, listOwnerBookingResources, setAvailabilityException, setAvailabilityRule, setResourceSlotDuration
HOOKS: useAddStaffResource, useBookingAvailability, useBookingContextResolver, useBookingHistory, useBookingOps, useBookingServiceProfiles, useBookingServices, useCreateBooking, useEnsureOwnerBookingResource, useLocationResources, useManageAvailability, useOrganizationLocations, useOrganizationWorkspace, useOwnerBookingResources, useQrLinks, useResourceServiceOverrides
NOTE: App-level feature wraps engines/booking/ — dual implementation risk
File types: .js

### chat
DAL: conversation/updateAttachmentMediaAsset.write.dal.js, inbox/inboxUnread.read.dal.js
CONTROLLERS: chat/conversation/recordChatAttachment, chat/inbox/chatUnread
HOOKS: useChatAttachmentUpload, useConversation, useConversationActionsMenu, useConversationMembers, useConversationMessages, useConversationScroll, useMediaViewer, useMessageActionsMenu, useSendMessageActions, useTypingChannel, useArchiveChat, useChatInbox, useChatMessagePrefetch, useChatUnreadOps, useDeleteChat, useInbox, useInboxActions, useInboxEntryForConversation, useInboxFolder, useMarkChatRead, useMessagePrivacySettings, useVexSettings, useStartConversation
SCREENS: ConversationScreen, ArchivedInboxScreen, InboxChatSettingsScreen, InboxScreen, InboxSettingsScreen, RequestsInboxScreen, SpamInboxScreen, BlockedUsersScreen, MessagePrivacyScreen
NOTE: App wraps engines/chat/ — adapters bridge engine controllers to UI
File types: .js, .jsx

### dashboard
Sub-features: flyerBuilder (+ designStudio), vport
DAL: flyer.read/write, designStudio.auth/read/write, actorOwners, actorVport, listVportBookingsForProfileDay, vportAvailabilityRules, vportBookingHistory, vportBookingsInRange, vportCities, vportLeads, vportProfile, vportProfileActorAccess, vportResource, vportServices, vportTeam, vportTeamInvite, insertVportBooking, portfolioMediaRecord, updateVportBooking, vportAvailabilityRules.write, vportLeads.write, vportPublicDetails.write, vportResource.write, vportTeam.write, vportTeamInvite.write
CONTROLLERS: flyerEditor, designStudio (assetsExports, load, pages, shared), addPortfolioMediaWithRecord, createOwnerBooking, ensureVportOwnerResource, listVportBookingHistory, loadDaySchedule, manageVportAvailabilityRule, probeVportPortfolio, saveVportPublicDetailsByActorId, updateVportBooking, vportLeads, vportOwnerStats, vportPublicBooking, vportTeam, vportTeamInvite
SCREENS: BarberTeamRequestsScreen, VportDashboardBookingHistoryScreen, VportDashboardCalendarScreen, VportDashboardExchangeScreen, VportDashboardGasScreen, VportDashboardLeadsScreen, VportDashboardLocksmithScreen, VportDashboardPortfolioScreen, VportDashboardReviewScreen, VportDashboardScheduleScreen, VportDashboardScreen, VportDashboardServicesScreen, VportDashboardTeamScreen, VportSettingsScreen, VportActorMenuFlyerEditorScreen, VportActorMenuFlyerScreen, VportDesignStudioViewScreen
File types: .js, .jsx

### explore
DAL: search.dal.js
CONTROLLERS: searchResults.controller.js, searchTabs.controller.js
SCREENS: ExploreScreen.jsx, SearchScreen.view.jsx
File types: .js, .jsx

### feed
DAL: feed.mentions, feed.posts, feed.read.actorsBundle, feed.read.blockRows, feed.read.commentCounts, feed.read.debugPrivacyRows, feed.read.followRows, feed.read.hiddenPosts, feed.read.media, feed.read.posts, feed.read.reactionCounts, feed.read.viewerContext, feed.read.viewerReactions, feedWelcomeCard, listActorPostsByActor
CONTROLLERS: feedWelcomeCard, getDebugPrivacyRows, getFeedViewerContext, listActorPosts
SCREENS: CentralFeedScreen.jsx
File types: .js, .jsx
NOTE: Large DAL surface — 14 DAL files for a single feed feature

### identity
DAL: provision.rpc.dal.js, refreshActorDirectory.dal.js
CONTROLLERS: ensureVcsmPlatformBootstrap, refreshActorDirectory
File types: .js

### invite
DAL: invite.dal.js
CONTROLLERS: invite.controller.js
SCREENS: InviteScreen.jsx
File types: .js, .jsx

### join
DAL: barberVport.read.dal.js, joinAuth.dal.js, joinInvite.dal.js
CONTROLLERS: joinBarbershopAccount, joinBarbershopQr
SCREENS: JoinBarbershopScreen.jsx
File types: .js, .jsx

### legal
DAL: getPublicIp.dal.js, legalDocuments.read.dal.js, userConsents.read.dal.js, userConsents.write.dal.js
CONTROLLERS: legalConsent, legalDocument
SCREENS: AboutScreen, ConsentGateScreen, ContactScreen, HowToCreateProfileScreen, HowToCreateVportScreen, LegalDocumentScreen, VportCategoryLandingScreen
File types: .js, .jsx

### media
DAL: mediaAssets.write.dal.js, resolveAppId.read.dal.js
CONTROLLERS: createMediaAsset
NOTE: Wraps engines/media/ uploadMedia
File types: .js

### moderation
DAL: assertModerationAccess, conversationCover.read/write, moderationActions, reports, reports.read
CONTROLLERS: commentVisibility, getConversationCoverStatus, moderationActions, postVisibility, report, undoConversationCover
COMPONENTS: ReportCoverScreen.jsx
File types: .js, .jsx

### notifications
DAL: inbox/blocks.read, inbox/senders.read, runtime/notificationRuntime.dal.js
CONTROLLERS: Notifications, NotificationsHeader, inboxUnread, notificationsCount
SCREENS: NotificationsScreen, NotiViewPostScreen
NOTE: Wraps engines/notifications/
File types: .js, .jsx

### onboarding
DAL: onboardingSteps, profileCompletion, vibeInvites, vibeTags
CONTROLLERS: onboarding, vibeTagsOnboarding
SCREENS: CitizenVibesScreen
File types: .js, .jsx

### post
Sub-features: commentcard, postcard
DAL: commentLikes, comments, postComments.count, postComments.read, post.read, post.write, postMentions.read/write, postReactions.read/write, roseGifts.actor
CONTROLLERS: commentReactions, commentReactions.hydrator, deleteComment, editComment, postComments, postComments.count, deletePost, editPost, getPostById, getPostMentionMap, getPostReactions, sendRose, togglePostReaction
File types: .js

### professional
DAL: professionalBriefings.read.dal.js
CONTROLLERS: listProfessionalBriefings
SCREENS: ProfessionalBriefingsScreen
File types: .js, .jsx

### profiles
DAL: checkActorOwnership, friends (blockedActorSet, friendRanks.reconcile/write, friends.read), photos (listPostCommentsCount, listPostReactions, listPostRoseCount), post/fetchPostsForActor, readActorIdByUsername, readActorKind, readActorPosts, readActorProfile, readActorSeoData, readActorType, readFollowState, readPostMediaByPostIds, readPostReactions, readPostRoseCounts, readVportType, resolveActorSlug, tags/readActorVibeTags, vportPublicDetails.read
kinds/vport DAL: content (CRUD + publish toggle), gas (fuel prices, reviews, submissions, settings), locksmith (portfolio, service areas, service details), menu (CRUD for categories + items), rates, review, services, subscribersCount/List
CONTROLLERS: (large suite — see scan output) buildActorCanonicalSlug, checkActorOwnership, friends (getFriendLists, getTopFriendActorIds/Candidates, hydrateActorsIntoStore, saveTopFriendRanks), getActorKind, getProfileView, getVportType, photos/photoReactions, post/getActorPosts, profileCache, resolveActorBySlug, resolveUsernameToActor, tags/getActorVibeTags
kinds/vport controllers: content CRUD + publish, gas, locksmith, menu CRUD, portfolio, rates, review, services, subscribers, getVportPublicDetails, getVportActorIdByVportId
NOTE: Largest feature — deeply nested, many sub-domains
DUPLICATE DAL WARNING: dal/friends/* mirrors screens/views/tabs/friends/dal/* — same methods duplicated

### public
Sub-features: vportBusinessCard, vportMenu
DAL: businessCardSections.read, sendLeadConfirmationEmail.edge, vportBusinessCard.read, vportBusinessCardLead.write, readPublicVportReviewDimensions, readPublicVportReviewSummary, readPublicVportReviews, readVportPublicDetails.rpc, readVportPublicMenu.rpc, resolveMenuSlug, resolveVportSlug
CONTROLLERS: vportBusinessCard, getVportPublicDetails, getVportPublicMenu, getVportPublicReviews, resolveMenuSlug, resolveVportSlug
File types: .js

### settings
Sub-features: account, privacy, profile, vports
DAL: account.read/write, blocks, visibility, actorIdBySubject, actors.read, auth.read, profile.read/write, profileMediaAsset.write, vportPublicDetails.read/write, actorOwners.read, auth.read, vports.read/write
CONTROLLERS: account, Blocks, actorPrivacy, authSession, profile, recordProfileMediaAsset, resolveVportIdByActorId, saveProfile, getAuthedUserId, getProfileActorId, listMyVports, vportBusinessCard, vportBusinessCardSettings, vportDirectoryVisibility
File types: .js

### social
Sub-features: friend/request, friend/subscribe, privacy
DAL: actorFollows, followRequests, subscriberCount, actorPrivacy
CONTROLLERS: followRequests, follow, getFollowRelationshipState, getFollowStatus, getFollowerCount, unsubscribe, getActorPrivacy
File types: .js

### upload
DAL: findActorsByHandles, findPostMentionsByPostIds, insertPost, insertPostMedia, insertPostMentions, postAuthRollback, searchMentionSuggestions, updatePostMediaAssetId.write
CONTROLLERS: recordPostMedia, searchMentionSuggestions, createPost
File types: .js

### vport
DAL: readVportServiceCatalogByType, vport.core, vport.read.vportRecords, vport.write.profileMedia
CONTROLLERS: getVportServiceCatalog, submitCreateVport, vportCoreOps
File types: .js

### wanderex
DAL: wanderexPublic.read, wanderexPublicHelpers.read
File types: .js

### wanders
DAL: core/read (actorOwners, cardKeys, cards, droplinks, events, inboxes, mailbox, replies, userFingerprints), core/rpc (mailbox), core/write (all of the above)
CONTROLLERS: wandersCardKeys, core (authSession, cardKeys, cards, createWandersCard, ensureGuestUser, mailbox, publishWandersFromBuilder, replies, wandersInboxes)
File types: .js

---

## VCSM State Layer

STORES (Zustand):
- bootstrap.store.js — bootstrap hydration state
- actorStore.js — actor directory store
- profileGateStore.js — profile gate state
- identitySelection.store.js — active actor identity
- followRequestsStore.js — follow request state
- vportProfileUiStore.js — vport profile UI state
- chatUiStore.js — chat UI state
- loginDebug.store.js — debug only (must not reach production)

---

## VCSM Learning Module (embedded)

Path: apps/VCSM/src/learning/
Role: Embedded LMS route — NOT the same as Wentrex
Controllers: administration (adminAccess, assignObserver/Student/Teacher/Member, getAdminDashboard, getCourseRoster, linkParentToStudent, listOrganizationCourses/Members), parents (getObservedStudentAssignments/Progress, getParentDashboard, listObservedStudents), shared (getAssignmentSubmission, getCourseContent, getCourseHome, getLearningHome, getLessonView, listCourseAssignments, markLessonComplete, saveSubmissionDraft, submitAssignment), students (getStudentCourseHome, getStudentDashboard, getStudentProgressSummary, listStudentCourses), teachers (getTeacherCourseHome, getTeacherDashboard, gradeSubmission, listCourseSubmissions, listTeacherAssignments, listTeacherCourses)

---

## WENTREX Features

### auth
DAL: own auth dal
CONTROLLERS: own auth controllers
ADAPTERS: adapter/
HOOKS: hooks/
SCREENS: screens/
USECASES: usecases/
MODEL: model/
UI: ui/ (modern/)

### communication
Sub-features: conversation, inbox, adapters, policy
HOOKS: own hooks
NOTE: Wraps engines/chat/ via adapters

### identity
DAL: features/identity/dal/
CONTROLLER: features/identity/controller/
RESOLVERS: features/identity/resolvers/

### learning (Wentrex LMS — standalone)
Domains: administration, student, staff, parent
Each domain has: dal, model, controller, components, screens

---

## TRAFFIC Data Layer

### Connectors (data sources)
- supabase.client.js — anon Supabase client
- unifiedDataset.js — unified provider dataset
- vportDataset.js — provider index from public view
- taxonomyDataset.js — category/service taxonomy
- vportHomepage.connector.js — homepage providers
- publicContent.connector.js — public guide/article content
- providerReviews.connector.js — provider review data
- publicReviewSummary.connector.js — review summaries

### DAL
- vportDataset.read.dal.js — reads public_traze_provider_index_v
- vportHomepage.read.dal.js — reads public_traze_provider_index_v
- providerProfile.read.dal.js — reads public_traze_portfolio_v
- trazeCategories.read.dal.js — reads public_traze_provider_index_v
- priceAggregate.read.dal.js — reads price aggregates
- publicContent.read.dal.js — reads public content/guides

### Repositories
aggregate.repo.js, category.repo.js, city.repo.js, content.repo.js,
geo.repo.js, geoCoverage.repo.js, homepage.repo.js, pageCandidate.repo.js,
provider.repo.js, reviewSummary.repo.js, service.repo.js,
staticParams.repo.js, taxonomyParams.repo.js

### Mappers
pageModel.model.js, providerIndex.model.js

### Controllers
vportDataset.controller.js
