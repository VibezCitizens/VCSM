# VCSM Feature Layer Map
# ARCHITECT Global Scan — 2026-06-02

All 29 features scanned. Entries ordered by tier (CRITICAL → HIGH → MEDIUM → LOW),
then alphabetically within tier.

---

## CRITICAL Tier

---

### Feature: auth
**Tier:** CRITICAL | **Status:** ACTIVE
**Controllers:** 14 | **DALs:** 11 | **Hooks:** 9
**Architecture State:** EVOLVING | **Module Status:** MOSTLY_COMPLETE
**Engine Deps:** None

**Structural Risks:**
- VENOM-AUTH-001: sessionStorage nonce is client-side mitigation only — no server-side recovery-provenance check on password reset
- actorOwnerCreate.dal.js has no app-layer ownership validation — DB RLS on vc.actor_owners unverified
- actorCreate.dal.js caller-controlled — RLS on vc.actors via RPC create_actor_for_user unverified
- AuthContext exposes raw access_token and refresh_token via useAuth() React context (VENOM-2026-05-14-006 OPEN)
- Three HIGH P0 findings open with no dedicated tickets: booking source bypass, dev diagnostics write access, client-controlled booking fields
- usecases/index.js and ui/index.js are unpopulated stub files
- OWNERSHIP.md missing — IRONMAN has not run; no formal owner assigned

**Next Command:** DB — verify RLS on public.profiles, vc.actor_owners, vc.actors, vc.bookings

---

### Feature: booking
**Tier:** CRITICAL | **Status:** ACTIVE
**Controllers:** 42 | **DALs:** 42 | **Hooks:** 16
**Architecture State:** EVOLVING | **Module Status:** MOSTLY_COMPLETE
**Engine Deps:** @booking (engines/booking)

**Structural Risks:**
- TICKET-BOOKING-RPC-001: customer_actor_id injection + status overpermission confirmed on live DB (P0 / DB-BLOCKED)
- ELEK-001: cancelBookingController customer cancel path missing void/kind check (MEDIUM / OPEN)
- Dual assertActorOwnsVportActor implementations at feature and engine layers — drift risk
- BW-SCHED-003: loadDayScheduleController exported from module index.js — boundary violation
- Dead code: 12 dead feature DALs + 8 dead feature controllers awaiting CARNAGE removal
- V-BOOK-02/03/04 (HIGH OPEN): PII overfetch, member_actor_id exposure, linkPath UUID remnants
- BLOCK-BOOK-002: zero regression tests for all booking security fixes — merge unsafe
- N+1 risk on loadDayScheduleController for large teams

**Next Command:** SPIDER-MAN

---

### Feature: identity
**Tier:** CRITICAL | **Status:** ACTIVE
**Controllers:** 2 | **DALs:** 2 | **Hooks:** 1
**Architecture State:** EVOLVING | **Module Status:** MOSTLY_COMPLETE
**Engine Deps:** engines/identity

**Structural Risks:**
- VF-01 CRITICAL OPEN: platform.provision_vcsm_identity has NO auth.uid() guard in live DB — cross-user identity poisoning possible; migration 20260518040000 ready, deployment UNKNOWN
- VF-02 MEDIUM OPEN: pg_temp missing from search_path in live function — covered by same migration
- VLF-02 MEDIUM OPEN: p_actor_id is DEFAULT NULL in live RPC body — provisioning without actor link possible
- Hollow controller: refreshActorDirectory.controller.js is a pass-through re-export with no business logic — IRONMAN RISK-5 open decision
- No model layer: RPC responses consumed raw in feature layer
- Zero test coverage: SPIDER-MAN never run on CRITICAL-tier feature
- Mixed adapter boundaries: ~105 consumer sites, some import directly from state/identity/identityContext
- No tracked creation migrations for either identity RPC — CARNAGE open item
- Non-standard resolvers/ layer: vcsmIdentity.resolver.js undocumented

**Next Command:** DB — confirm deployment status of migration 20260518040000_platform_provision_vcsm_identity.sql

---

### Feature: actors
**Tier:** CRITICAL | **Status:** ACTIVE
**Controllers:** 1 | **DALs:** 1 | **Hooks:** 0
**Architecture State:** EVOLVING | **Module Status:** MOSTLY_COMPLETE
**Engine Deps:** None

**Structural Risks:**
- ARCH-ACTORS-DRIFT-001 (HIGH): hydrateActors.controller.js documented but NOT FOUND in live source
- ARCH-ACTORS-DRIFT-002 (HIGH): getActorSummariesByIds.dal.js documented but NOT FOUND in live source
- ARCH-ACTORS-DRIFT-003 (MEDIUM): extractActorIdsForHydration.model.js documented but NOT FOUND in live source
- SENTRY-2026-01 (BLOCKING): checkVportOwnership.controller.js in booking imports getActorByIdDAL directly bypassing adapter boundary
- IRON-BOOK-WARN3 (HIGH): dual assertActorOwnsVportActor in features/booking/controller and engines/booking/src/controller
- NO_TESTS (HIGH): zero test files exist for any actors source file; branch BLOCKED

**Next Command:** IRONMAN — confirm hydrateActors/hydration removal intent, close drift findings; then SPIDER-MAN

---

## HIGH Tier

---

### Feature: block
**Tier:** HIGH | **Status:** ACTIVE
**Controllers:** 3 | **DALs:** 3 | **Hooks:** 3
**Architecture State:** STABLE | **Module Status:** MOSTLY_COMPLETE
**Engine Deps:** None

**Structural Risks:**
- VF-01 (HIGH OPEN): vc.friend_ranks not cleaned after block — blocked actors may surface in friend suggestions
- LF-01 (MEDIUM OPEN): useBlockStatus uncached on profile load — read amplification 2.0x
- LF-02 (LOW OPEN): invalidateFeedBlockCache absent from useBlockActorAction
- Satellite DAL drift (MEDIUM DEFERRED): settings/privacy, notifications/inbox, feed/pipeline each maintain own block read DALs
- FALCON P0 gaps (BLOCKED): NTB-03, NTB-02, NDF-01 unverified — THOR blocked for iOS native and Android
- Zero test coverage: no feature-owned test files
- BlockButton.jsx imports useIdentity from @/state/identity/identityContext instead of identity.adapter

**Next Command:** SPIDER-MAN

---

### Feature: chat
**Tier:** HIGH | **Status:** ACTIVE
**Controllers:** 30 | **DALs:** 36 | **Hooks:** 22
**Architecture State:** STABLE | **Module Status:** MOSTLY_COMPLETE
**Engine Deps:** @chat (engines/chat), @media (engines/media), @hydration (engines/hydration)

**Structural Risks:**
- SF-01 (SENTRY OPEN): canReadConversation called from ConversationView.jsx — must move to hook layer
- SF-02 (SENTRY OPEN): buildInboxPreview called from 4 Final Screens — must move to hook layer
- SF-06 (SENTRY OPEN): (R) convention undocumented in conversation/permissions/
- KF-01 (KRAVEN OPEN): chat.inbox_entries index for badge query unverified
- Missing SECURITY.md for HIGH-tier feature
- FALCON DRIFT-01: Native iOS does not decode canPost
- FALCON DRIFT-02: Native membership read gate partial vs canReadConversation
- Zero test coverage: SPIDER-MAN never run
- Debug files in feature tree: chatBadgeDebugger.js and chatNavDebugger.js should be in zNOTFORPRODUCTION/debuggers/

**Next Command:** ELEKTRA

---

### Feature: dashboard
**Tier:** HIGH | **Status:** ACTIVE
**Controllers:** 26 | **DALs:** 34 | **Hooks:** 28
**Architecture State:** EVOLVING | **Module Status:** MOSTLY_COMPLETE
**Engine Deps:** None

**Structural Risks:**
- Rule 9 violation: gasprices/index.js exports write DALs at card boundary (P1)
- Rule 9 violation: leads/index.js exports write DALs at card boundary (P1)
- Rule 9 violation: portfolio/index.js exports write DAL at card boundary (P1)
- DEFER-DASH-001: useVportOwnerSchedule.js overloaded (read + mutation coordination violates Rule 6) (P1)
- Duplicate model files: buildDashboardCards.model.js and dashboardViewByVportType.model.js in two locations (P2)
- Adapter boundary violation: useQuickBookingModal.js imports getVportServicesController directly from profiles internal path (P2)
- Adapter boundary violation: useVportPortfolioProbe.js imports portfolioTraceStore from @/features/portfolio/setup (P2)

**Next Command:** SENTRY — remediate Rule 9 violations in gasprices/index.js, leads/index.js, portfolio/index.js

---

### Feature: legal
**Tier:** HIGH | **Status:** ACTIVE
**Controllers:** 2 | **DALs:** 4 | **Hooks:** 3
**Architecture State:** STABLE | **Module Status:** MOSTLY_COMPLETE
**Engine Deps:** None

**Structural Risks:**
- getPublicIp.dal.js is dead code retained as reference stub
- F4 OPEN: locale/userAgent still client-supplied via navigator; server-side IP capture is open CARNAGE task
- NEW-LEGAL-JOIN-001 OPEN: callers may silently swallow signup consent write failures via .catch(() => {})
- F6 DORMANT: VportCategoryLandingScreen barbershop route may not be registered in app router
- ELEKTRA has never run on this HIGH-tier consent gate feature
- Zero test files; SPIDER-MAN has never run; consent gate is session-blocking with no regression coverage

**Next Command:** ELEKTRA

---

### Feature: moderation
**Tier:** HIGH | **Status:** ACTIVE
**Controllers:** 7 | **DALs:** 7 | **Hooks:** 5
**Architecture State:** FLAGGED | **Module Status:** MOSTLY_COMPLETE
**Engine Deps:** engines/chat/src/controller/markConversationSpam.controller.js, engines/chat/src/dal/moderationActions.write.dal.js

**Structural Risks:**
- CRITICAL: assertModerationAccess UUID mismatch — isModerationAuthorizedDAL queries learning.platform_admins with vc actor UUID — always throws FORBIDDEN; no moderator action can succeed
- CRITICAL: report_events audit trail broken — INSERT RLS policy missing on moderation.report_events; session-level flag disables all audit writes (SEC-002)
- CRITICAL: DB migration deployment order — Batch 5 (FORCE RLS) must never apply before Batch 1 (fix can_manage_domain); violation locks out service_role
- Dual-write on conversation cover — feature layer and chat engine both write to moderation.actions; no coordination layer
- Missing moderation.moderators table — planned but never created
- No moderator dashboard — hideReportedObjectController and dismissReportController have no UI surface
- BRIDGE logic in DAL layer: insertReportRow in reports.dal.js contains domain logic (inbox folder upsert)
- No test coverage — zero test files
- Group chat block enforcement partial — block RLS covers direct chats only

**Next Command:** CARNAGE — Batch 1 (fix can_manage_domain vc branch) and app-layer UUID fix must ship together as P0

---

### Feature: profiles
**Tier:** HIGH | **Status:** ACTIVE
**Controllers:** 51 | **DALs:** 63 | **Hooks:** 69
**Architecture State:** EVOLVING | **Module Status:** MOSTLY_COMPLETE
**Engine Deps:** @hydration

**Structural Risks:**
- VF-003 (HIGH OPEN): hollow ownership controller — logic in DAL layer
- VF-004 (HIGH OPEN): privacy gate enforced client-side only — bypassable
- VF-005 (HIGH OPEN): ActorProfileProdDebugPanel bundled in production build
- DR-001 (CRITICAL OPEN): vc.posts INSERT RLS gap — any auth user inserts as any actor
- ELEK-040 (HIGH OPEN): portfolio write path ownership gate unconfirmed
- SF-003 (MEDIUM OPEN): fetchPostsForActor.dal.js is a 262-line multi-schema god method
- BOUNDARY VIOLATION: social/privacy/dal/actorSignalVisibility.dal imported directly — bypasses social adapter
- STRUCTURAL COUPLING: all VPORT write auth depends on assertActorOwnsVportActorController owned by booking feature adapter

**Next Command:** ELEKTRA

---

### Feature: public
**Tier:** HIGH | **Status:** ACTIVE
**Controllers:** 6 | **DALs:** 11 | **Hooks:** 9
**Architecture State:** FLAGGED | **Module Status:** MOSTLY_COMPLETE
**Engine Deps:** None

**Structural Risks:**
- Unexecuted critical security migration VL-001–005 (submit_business_card_lead: GRANT EXECUTE TO PUBLIC, actor_id=NULL, permissive INSERT) — THOR BLOCKED
- Duplicate route conflict: /actor/:actorId/menu owned by features/profiles and public with raw UUID in URL
- No TTL cache on readVportPublicDetailsRpcDAL and readVportPublicMenuRpcDAL — 2–3 DB hits per visitor
- Double hook on useVportPublicReviews — 3 redundant DB reads per Reviews tab open
- 4 files use relative ../ imports instead of @/ aliases
- useAuth() imported inside VportPublicReviewsPanel — auth coupling in wrong layer
- Style objects defined in vportPublicMenuPanel.model.js — layer violation
- VportPublicMenuView.jsx at 301 lines — 1 over 300-line architectural limit
- 5 DB views untracked by CARNAGE migration history
- Wildcard CORS on all 5 edge functions — ELEK-2026-05-27-001 OPEN
- Dead write-review CTA in VportPublicReviewsPanel — no review submission screen wired post-auth

**Next Command:** CARNAGE — Execute VL-001–005 business_card_leads migration; then ELEKTRA scoped to edge functions

---

### Feature: settings
**Tier:** HIGH | **Status:** ACTIVE
**Controllers:** 15 | **DALs:** 16 | **Hooks:** 22
**Architecture State:** EVOLVING | **Module Status:** MOSTLY_COMPLETE
**Engine Deps:** None

**Structural Risks:**
- ELEK-002 (HIGH, DEFERRED): ctrlSetActorPrivacy no server-side session binding on actorId — actor privacy hijack possible
- ELEK-004 (HIGH, DEFERRED): dalSetActorPrivacy no auth.getUser() binding; vc.actor_privacy_settings RLS unconfirmed
- ELEK-005 (OPEN): deprecated dalDeleteOwnedVportById still exported live; legacy owner_user_id; omits cascade
- VENOM-SETTINGS-004 (P2, DEFERRED): listMyVportsDAL / readMyVports use owner_user_id
- Layer violation: profile/ui/vportAboutDetails.model.js is a model file inside a UI folder
- Adapter boundary violation: vportSocialSettings.controller.js imports directly from @/features/social/privacy/dal/actorSocialSettings.dal
- Dead-code risk: settings/queries/ contains 6 hook files of unconfirmed live usage status
- BW-SETTINGS-005 (OPEN): upsertVportPublicDetailsDAL has no optimistic locking — replay attack possible
- TICKET-SUB-010-B (PENDING): actor_social_settings owner-delegation RLS migration not applied
- Cross-feature ownership dependency: assertActorOwnsVportActorController lives in booking feature

**Next Command:** SENTRY

---

### Feature: vport
**Tier:** HIGH | **Status:** ACTIVE
**Controllers:** 3 | **DALs:** 4 | **Hooks:** 4
**Architecture State:** EVOLVING | **Module Status:** MOSTLY_COMPLETE
**Engine Deps:** engines/booking (@booking alias), engines/hydration (via identity ops adapter), engines/media (@media alias)

**Structural Risks:**
- vport.public.js migration barrel leaks DAL functions to external consumers — Phase 2 removal pending (MEDIUM)
- vportCoreOps.controller.js is a thin DAL re-export with no controller logic — migration artifact (LOW)
- listMyVports duplicated across vport.core.dal.js and vport.read.vportRecords.dal.js — dual source of truth (MEDIUM)
- vport.write.profileMedia.dal.js missing requireUser() session guard (MEDIUM)
- updateVport() in vport.core.dal.js missing ownership assertion before UPDATE — relies on RLS as last defense (MEDIUM)
- S-BLK-001: 3 locksmith write paths missing assertActorOwnsVportActorController — BEFORE RELEASE BLOCKER (CRITICAL)
- ELEK-009: deleteVportServiceAddonController dual failure — missing gate AND referenced DAL does not exist (CRITICAL)
- VD-01/VD-02: removeTeamMemberController and accept/declineTeamRequestController missing auth gates (CRITICAL)
- 27 total open security findings across extended governance surface

**Next Command:** VENOM — resolve S-BLK-001 (3 locksmith write paths in locksmithOwner.controller.js)

---

## MEDIUM Tier

---

### Feature: explore
**Tier:** LOW | **Status:** ACTIVE
**Controllers:** 2 | **DALs:** 1 | **Hooks:** 3
**Architecture State:** EVOLVING | **Module Status:** MOSTLY_COMPLETE
**Engine Deps:** engines/hydration (@hydration alias)

**Structural Risks:**
- Dead use case: usecases/search.usecase.js duplicates controller with more resilient Promise.allSettled — never imported
- Duplicate Wanders feature card injection in searchResults.controller.js AND useSearchTabsActor.js — double-render risk
- Broken import in ui/index.jsx: imports from screen/ (singular) but actual directory is screens/ (plural) — hard module resolution error
- No controller-level auth gate — auth fully delegated to route guard and RLS
- ExploreFeed permanently disabled via hardcoded SHOW_EXPLORE_DISCOVERY_BLOCKS = false constant
- useSearchActor is a no-op alias
- Triple normalization paths in model layer

**Next Command:** VENOM

---

### Feature: feed
**Tier:** MEDIUM | **Status:** ACTIVE
**Controllers:** 4 | **DALs:** 16 | **Hooks:** 8
**Architecture State:** EVOLVING | **Module Status:** MOSTLY_COMPLETE
**Engine Deps:** @hydration

**Structural Risks:**
- V3 HIGH: feedWelcomeCard write path with unconfirmed WITH CHECK RLS on vc.actor_onboarding_steps (CARNAGE required)
- V1 MODERATE: readHiddenPostsForViewer client-supplied viewerActorId; moderation.actions RLS unconfirmed (CARNAGE required)
- V2 MODERATE: readViewerReactionsBatch client-supplied actorId; vc.post_reactions RLS unconfirmed (CARNAGE required)
- SA2 HIGH: feed.posts.dal.js legacy DAL imports @hydration engine (layer violation)
- Dual hook migration undeclared: useFeed.js and useCentralFeed.js both active with identical APIs; no deprecation marker
- Zero test files — pipeline normalization, model visibility logic, mention enrichment uncovered
- SA3 MODERATE: FeedConfirmModal.jsx iOS stacking context risk
- Ungated console.log in fetchFeedPage.pipeline.js line 137

**Next Command:** CARNAGE

---

### Feature: invite
**Tier:** MEDIUM | **Status:** ACTIVE
**Controllers:** 1 | **DALs:** 1 | **Hooks:** 1
**Architecture State:** EVOLVING | **Module Status:** MOSTLY_COMPLETE
**Engine Deps:** None

**Structural Risks:**
- ARCH-INVITE-001: No public adapter boundary on features/invite/
- inviterActorId unverified at controller layer — Edge Function is sole server-side enforcement point
- DEV probe (rawDebugError) present in hook and view — cleanup pending
- BLOCK-INVITE-003: O(n) listUsers() email enumeration oracle in Edge Function (DB-BLOCKED)
- BLOCK-INVITE-004: Wildcard CORS on send-citizen-invite Edge Function
- Zero test coverage — SPIDER-MAN never run

**Next Command:** VENOM — scoped to apps/VCSM/src/features/invite/; follow with ELEKTRA for inviterActorId trace

---

### Feature: join
**Tier:** MEDIUM | **Status:** ACTIVE
**Controllers:** 2 | **DALs:** 3 | **Hooks:** 1
**Architecture State:** EVOLVING | **Module Status:** MOSTLY_COMPLETE
**Engine Deps:** None

**Structural Risks:**
- No adapter layer — no join.adapter.js; controllers accessed directly from hook
- No model layer — raw DAL data passed through
- Barbershop-only naming — cannot generalize to other VPORT types without forking
- Shared DAL home unresolved: joinInvite.dal.js shared between features/join/ and features/invite/
- DAL-layer ownership gap: VENOM-FINDING-8 OPEN — acceptJoinResourceDAL has no DAL-level actor ownership check
- QR expiry partial: ELEK-028 OPEN — createBarberVportAndAcceptQr does not recheck join_expires_at before VPORT insert
- Banned identity surface: VENOM-TEAM-005 OPEN — barberVport.read.dal.js uses profiles.owner_user_id

**Next Command:** VENOM — confirm ELEK-024/025/026/027 resolution, audit VENOM-FINDING-8, verify VENOM-TEAM-005

---

### Feature: media
**Tier:** MEDIUM | **Status:** ACTIVE
**Controllers:** 2 | **DALs:** 3 | **Hooks:** 0
**Architecture State:** STABLE | **Module Status:** MOSTLY_COMPLETE
**Engine Deps:** engines/media (@media alias) — configureMediaEngine wired at startup via setup.js

**Structural Risks:**
- TICKET-PLATFORM-RLS-001 (MEDIUM, OPEN): platform.media_assets media_assets_vc_owner_update {public} policy coexists with tighter policy — Carnage Plan C not applied
- Soft-delete DB-blocked (MEDIUM, DEFERRED): softDeleteMediaAsset controller + DAL implemented but DB RLS blocks owner UPDATE
- SCOPE_MAP governance gap (LOW, OPEN): no documented approver process for new SCOPE_MAP entries
- ownerActorId caller-supplied (LOW, MITIGATED): DB RLS is sole ownership enforcement
- IIFE swallow pattern (LOW, OPEN): 4+ callers wrap createMediaAssetController in fire-and-forget IIFEs; write failures silent
- Zero test coverage

**Next Command:** CARNAGE — apply Plan B (soft-delete) and Plan C (platform.media_assets {public} policy cleanup)

---

### Feature: notifications
**Tier:** MEDIUM | **Status:** ACTIVE
**Controllers:** 3 | **DALs:** 3 | **Hooks:** 5
**Architecture State:** EVOLVING | **Module Status:** MOSTLY_COMPLETE
**Engine Deps:** @notifications, @hydration, @booking

**Structural Risks:**
- KF-1: serial publish delivery loop O(N x 3 x RTT) — ELEVATED (KRAVEN 2026-05-19)
- Publish ACL gap: any caller via notifications.adapter.js can publish to any actorId (MEDIUM)
- 6 dead files pending deletion approval — SENTRY REVIEW_PENDING
- RISK-9: mapSummaryRowToSender() domain transform in lib/ not model/
- notificationRuntime.dal.js at 300-line contract limit — split required before new functions
- My Appointments scope mismatch: booking surface co-located in notifications screen
- 5 undocumented notification schema tables — DB_RLS UNKNOWN

**Next Command:** SPIDER-MAN

---

### Feature: onboarding
**Tier:** MEDIUM | **Status:** ACTIVE
**Controllers:** 3 | **DALs:** 4 | **Hooks:** 2
**Architecture State:** STABLE | **Module Status:** MOSTLY_COMPLETE
**Engine Deps:** None

**Structural Risks:**
- Invite card DAL calls execute unconditionally despite SHOW_INVITE_ONBOARDING_CARD=false — wasted DB queries
- markActorOnboardingStepCompletedDAL defined in onboardingSteps.dal.js but not imported by any controller — possibly orphaned
- No session ownership check at controller layer — authorization depends entirely on unconfirmed RLS WITH CHECK
- Stale dev-only console.log probe in readQualifyingVibeInviteCountDAL — guarded but marked for cleanup
- Zero test coverage — 0 test files across 16 source files

**Next Command:** VENOM

---

### Feature: post
**Tier:** MEDIUM | **Status:** ACTIVE
**Controllers:** 13 | **DALs:** 12 | **Hooks:** 15
**Architecture State:** EVOLVING | **Module Status:** MOSTLY_COMPLETE
**Engine Deps:** @hydration

**Structural Risks:**
- V-1 (HIGH): createSystemPost no actor ownership verification in VPORT publish path
- DR-001 (CRITICAL): vc.posts INSERT RLS gap — any authenticated user can INSERT as any actor; migration 20260522010000 pending staging
- S-1 (MEDIUM): replacePostMentions DAL-to-DAL boundary violation in post.write.dal.js
- Dual PostCard adapter paths: adapters/postCard.adapter.js AND postcard/adapters/PostCard.jsx
- PostFeed.screen.jsx reverse-imports useFeed from feed feature — reverse boundary direction
- V-2 (MEDIUM): searchMentionSuggestions viewerActorId always null — blocked actors appear in mention autocomplete
- Duplicate comment insert path: insertPostComment in postComments.read.dal.js AND createComment in comments.dal.js
- screens/utils/detectIOS.js misplaced — belongs in shared/

**Next Command:** ELEKTRA

---

### Feature: professional
**Tier:** MEDIUM | **Status:** ACTIVE
**Controllers:** 1 | **DALs:** 1 | **Hooks:** 2
**Architecture State:** EVOLVING | **Module Status:** MOSTLY_COMPLETE
**Engine Deps:** None

**Structural Risks:**
- ProfessionalAccessScreen has no identity guard — route gated by release flag only
- NurseHomeScreenView holds all note state in React component state — no write DAL, no persistence
- Enterprise sub-domain is 100% seeded/mock data — no live Supabase connection
- No adapter.js file — feature has no published adapter boundary
- linkPath from vc.notifications used directly as navigate() target without sanitisation — open redirect risk

**Next Command:** VENOM

---

### Feature: social
**Tier:** MEDIUM | **Status:** ACTIVE
**Controllers:** 13 | **DALs:** 7 | **Hooks:** 11
**Architecture State:** EVOLVING | **Module Status:** MOSTLY_COMPLETE
**Engine Deps:** None

**Structural Risks:**
- Privacy DAL split (MAJOR DRIFT — SENTRY): actorPrivacy.dal.js is a shim; belongs in dedicated privacy module
- ELEK-2026-05-27-002 HIGH OPEN: ctrlSetActorPrivacy missing — no ownership gate on privacy settings write path
- V-SUB-008 HIGH OPEN: vc.get_follower_count RPC unconfirmed in live DB; follower counts return 0 for all user-kind actors
- ELEK-2026-05-27-003 MEDIUM OPEN: ctrlSubscribe has no actor-kind guard — VPORT can follow Citizen and gain private post read access
- ELEK-2026-05-27-001 HIGH OPEN: count_subscribers/list_subscribers SECURITY DEFINER; Phase 0 migration 20260527060000 ready
- 17 CI tests intentionally failing (V-SUB-001/002/003 ownership gate tests)
- 3 DB unknowns unverified: vc.actor_privacy_settings RLS, vc.social_follow_requests RLS, vc.get_follower_count security context

**Next Command:** CARNAGE

---

### Feature: upload
**Tier:** MEDIUM | **Status:** ACTIVE
**Controllers:** 3 | **DALs:** 8 | **Hooks:** 4
**Architecture State:** FLAGGED | **Module Status:** MOSTLY_COMPLETE
**Engine Deps:** engines/media (@media barrel), engines/media (@/features/media/adapters/media.adapter), engines/media (@/features/media/adapters/mediaAppId.adapter)

**Structural Risks:**
- GAP-039: dual controller folder (controller/ and controllers/) — no canonical designation
- No actor_owners ownership gate in createPostController — actor_id written from caller-supplied identity
- Post-media atomicity gap — vc.posts inserted before R2 upload completes; rollback only covers insertPostMedia failure
- block feature consumed via barrel import (@/features/block) not adapter — boundary violation
- api/uploadMedia.js imports @media engine barrel directly — adapter bypass
- R2 Cloudflare worker wildcard CORS with no JWT verification — CRITICAL
- Zero test coverage — SPIDER-MAN BLOCKED since 2026-05-26
- Legacy UploadScreen.jsx mount status unknown

**Next Command:** VENOM

---

## LOW Tier

---

### Feature: ads
**Tier:** LOW | **Status:** ACTIVE
**Controllers:** 0 | **DALs:** 1 | **Hooks:** 2
**Architecture State:** EVOLVING | **Module Status:** MOSTLY_COMPLETE
**Engine Deps:** None

**Structural Risks:**
- No authorization gate anywhere in the pipeline — actorId trusted from caller context
- localStorage-only persistence — no server-side record, no cross-device access, no RLS
- Cross-feature CSS import: VportAdsSettingsScreen imports @/features/settings/styles/settings-modern.css directly
- useDesktopBreakpoint local re-export adds indirection without value
- No formal controller/ layer — use-case module fills controller role without auth-gate structure
- ad.api.js is a pure pass-through over the DAL with no added logic

**Next Command:** VENOM

---

### Feature: explore
**Tier:** LOW | **Status:** ACTIVE
**Controllers:** 2 | **DALs:** 1 | **Hooks:** 3
**Architecture State:** EVOLVING | **Module Status:** MOSTLY_COMPLETE
**Engine Deps:** engines/hydration (@hydration alias)

(See entry above under MEDIUM Tier — explore is classified LOW by the scan result.)

---

### Feature: hydration
**Tier:** LOW | **Status:** ACTIVE
**Controllers:** 2 | **DALs:** 1 | **Hooks:** 1
**Architecture State:** STABLE | **Module Status:** MOSTLY_COMPLETE
**Engine Deps:** engines/hydration

**Structural Risks:**
- inline-supabase-no-dal: vcsmActorHydrator.js:65 queries vport.profile_actor_access directly without a named DAL function
- no-adapter-boundary: no hydration.adapter.js; state/actors/ proxy files serve as de-facto adapter but not formally governed
- zero-test-coverage: no test files exist in feature or engine layer
- legacy-hydrateActor-path-unused: engines/hydration/src/controller/hydrateActor.controller.js — no app-layer consumers call it directly

**Next Command:** SPIDER-MAN

---

### Feature: portfolio
**Tier:** LOW | **Status:** MOSTLY_COMPLETE
**Controllers:** 11 | **DALs:** 9 | **Hooks:** 4
**Architecture State:** EVOLVING | **Module Status:** MOSTLY_COMPLETE
**Engine Deps:** @portfolio (engines/portfolio/), @media (engines/media/)

**Structural Risks:**
- ELEK-2026-05-28-040: ctrlSavePortfolioDetail missing ownership gate (HIGH, OPEN)
- ELEK-2026-05-28-041: updatePortfolioMediaAssetIdDAL null ownership filter degradation (LOW, mitigated)
- Fragmented module layout across 3 feature paths (features/portfolio, dashboard/vport/cards/portfolio, profiles/kinds/vport)
- setup.js single point of failure for all engine ownership enforcement
- probeVportPortfolio.controller.js imports dashboard/vport internals without adapter boundary
- Zero test coverage on portfolio write path
- Zero governance documentation (SECURITY.md, OWNERSHIP.md, TESTS.md all missing)

**Next Command:** VENOM

---

### Feature: reviews
**Tier:** LOW | **Status:** PLANNED
**Controllers:** 11 | **DALs:** 10 | **Hooks:** 5
**Architecture State:** EVOLVING | **Module Status:** MOSTLY_COMPLETE
**Engine Deps:** engines/reviews

**Structural Risks:**
- Dual VportReviewsView.jsx at two separate screen paths — potential dead-code or dual-implementation
- VportServiceReviews service binding fallback silently returns all reviews when no service FK present
- Feature source path (apps/VCSM/src/features/reviews/) contains only setup.js — logic distributed across 4 integration sites
- ctrlDeleteMyReview dual call-style polymorphism indicates interface drift
- dalInsertReview in write DAL may be superseded by RPC upsert path

**Next Command:** IRONMAN

---

### Feature: void
**Tier:** LOW | **Status:** ACTIVE (scaffold only — pre-implementation)
**Controllers:** 0 | **DALs:** 0 | **Hooks:** 0
**Architecture State:** EVOLVING | **Module Status:** INCOMPLETE
**Engine Deps:** None

**Structural Risks:**
- Premature route registration: /void is live in protected route tree with no age gate or realm-ID isolation guard
- Empty stub files: 9 of 11 source files are zero bytes
- is_void boundary enforced in settings/vports and chat/setup.js but not inside features/void/ itself
- No SECURITY.md: security posture for 18+ anonymous-but-DB-tracked realm is fully unknown — VENOM has never run

**Next Command:** VENOM

---

## Platform Totals

| Layer | Total Count |
|---|---|
| Controllers | 214 |
| DALs | 248 |
| Hooks | 229 |
| Features | 29 |

ARCHITECT Run: 2026-06-02
