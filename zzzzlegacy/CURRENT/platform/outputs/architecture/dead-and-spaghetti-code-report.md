# VCSM Dead Code and Structural Risk Report
# ARCHITECT Global Scan — 2026-06-02

---

## Structural Risk Summary

All risks extracted from feature scan structural_risks fields. Severity assigned from scan data or inferred.

| Feature | Risk | Severity | Recommended Handoff |
|---|---|---|---|
| auth | VENOM-AUTH-001: sessionStorage nonce — no server-side recovery-provenance check | HIGH | VENOM |
| auth | actorOwnerCreate.dal.js — no app-layer ownership validation; vc.actor_owners RLS unverified | HIGH | DB |
| auth | actorCreate.dal.js caller-controlled — vc.actors RPC create_actor_for_user RLS unverified | HIGH | DB |
| auth | AuthContext exposes raw access_token and refresh_token via useAuth() (VENOM-2026-05-14-006 OPEN) | HIGH | VENOM |
| auth | Three P0 findings open with no dedicated tickets: booking source bypass, dev diagnostics write, client-controlled booking fields | HIGH | TICKET |
| auth | usecases/index.js and ui/index.js are unpopulated stub files | LOW | IRONMAN |
| auth | OWNERSHIP.md missing — IRONMAN has not run | LOW | IRONMAN |
| booking | TICKET-BOOKING-RPC-001: customer_actor_id injection + status overpermission on live DB (P0 / DB-BLOCKED) | CRITICAL | DB |
| booking | ELEK-001: cancelBookingController customer cancel path missing void/kind check | MEDIUM | ELEKTRA |
| booking | Dual assertActorOwnsVportActor at feature and engine layers — drift risk | HIGH | IRONMAN |
| booking | BW-SCHED-003: loadDayScheduleController exported from module index.js — boundary violation | MEDIUM | SENTRY |
| booking | Dead code: 12 dead feature DALs + 8 dead feature controllers awaiting CARNAGE removal | MEDIUM | CARNAGE |
| booking | V-BOOK-02/03/04 (HIGH OPEN): PII overfetch, member_actor_id exposure, linkPath UUID remnants | HIGH | VENOM |
| booking | BLOCK-BOOK-002: zero regression tests for all booking security fixes — merge unsafe | HIGH | SPIDER-MAN |
| booking | N+1 risk on loadDayScheduleController for large teams | MEDIUM | KRAVEN |
| identity | VF-01 CRITICAL OPEN: platform.provision_vcsm_identity has NO auth.uid() guard — cross-user identity poisoning possible | CRITICAL | DB |
| identity | VF-02 MEDIUM OPEN: pg_temp missing from search_path in live function | MEDIUM | DB |
| identity | VLF-02 MEDIUM OPEN: p_actor_id is DEFAULT NULL in live RPC body — provisioning without actor link possible | MEDIUM | DB |
| identity | Hollow controller: refreshActorDirectory.controller.js is a pass-through re-export | LOW | IRONMAN |
| identity | No model layer: RPC responses consumed raw in feature layer | MEDIUM | IRONMAN |
| identity | Zero test coverage on CRITICAL-tier feature | HIGH | SPIDER-MAN |
| identity | Mixed adapter boundaries: ~105 consumer sites bypass identity.adapter | HIGH | SENTRY |
| identity | No tracked creation migrations for either identity RPC | MEDIUM | CARNAGE |
| identity | Non-standard resolvers/ layer: vcsmIdentity.resolver.js undocumented | LOW | IRONMAN |
| actors | ARCH-ACTORS-DRIFT-001: hydrateActors.controller.js documented but NOT FOUND in live source | HIGH | IRONMAN |
| actors | ARCH-ACTORS-DRIFT-002: getActorSummariesByIds.dal.js documented but NOT FOUND in live source | HIGH | IRONMAN |
| actors | ARCH-ACTORS-DRIFT-003: extractActorIdsForHydration.model.js documented but NOT FOUND in live source | MEDIUM | IRONMAN |
| actors | SENTRY-2026-01 (BLOCKING): checkVportOwnership.controller.js imports getActorByIdDAL bypassing adapter | HIGH | SENTRY |
| actors | IRON-BOOK-WARN3: dual assertActorOwnsVportActor at feature and engine layers | HIGH | IRONMAN |
| actors | Zero test files — branch BLOCKED | HIGH | SPIDER-MAN |
| profiles | VF-003 (HIGH OPEN): hollow ownership controller — logic in DAL layer | HIGH | VENOM |
| profiles | VF-004 (HIGH OPEN): privacy gate enforced client-side only — bypassable | HIGH | VENOM |
| profiles | VF-005 (HIGH OPEN): ActorProfileProdDebugPanel bundled in production build | HIGH | VENOM |
| profiles | DR-001 (CRITICAL OPEN): vc.posts INSERT RLS gap — any auth user inserts as any actor | CRITICAL | CARNAGE |
| profiles | ELEK-040 (HIGH OPEN): portfolio write path ownership gate unconfirmed | HIGH | ELEKTRA |
| profiles | SF-003 (MEDIUM OPEN): fetchPostsForActor.dal.js is a 262-line multi-schema god method | MEDIUM | SENTRY |
| profiles | BOUNDARY VIOLATION: actorSignalVisibility.dal imported directly — bypasses social adapter | MEDIUM | SENTRY |
| profiles | STRUCTURAL COUPLING: all VPORT write auth depends on assertActorOwnsVportActorController in booking feature | HIGH | IRONMAN |
| dashboard | Rule 9 violation: gasprices/index.js exports write DALs at card boundary | HIGH | SENTRY |
| dashboard | Rule 9 violation: leads/index.js exports write DALs at card boundary | HIGH | SENTRY |
| dashboard | Rule 9 violation: portfolio/index.js exports write DAL at card boundary | HIGH | SENTRY |
| dashboard | DEFER-DASH-001: useVportOwnerSchedule.js overloaded (read + mutation coordination) | MEDIUM | IRONMAN |
| dashboard | Duplicate model files in two locations: buildDashboardCards.model.js and dashboardViewByVportType.model.js | LOW | WOLVERINE |
| dashboard | Adapter boundary violation: useQuickBookingModal.js imports getVportServicesController from profiles internal path | MEDIUM | SENTRY |
| dashboard | Adapter boundary violation: useVportPortfolioProbe.js imports portfolioTraceStore from @/features/portfolio/setup | MEDIUM | SENTRY |
| chat | SF-01 (SENTRY OPEN): canReadConversation called from ConversationView.jsx View Screen | MEDIUM | SENTRY |
| chat | SF-02 (SENTRY OPEN): buildInboxPreview called from 4 Final Screens | MEDIUM | SENTRY |
| chat | SF-06 (SENTRY OPEN): (R) convention undocumented in conversation/permissions/ | LOW | SENTRY |
| chat | KF-01 (KRAVEN OPEN): chat.inbox_entries index for badge query unverified | MEDIUM | CARNAGE |
| chat | Missing SECURITY.md for HIGH-tier feature | MEDIUM | VENOM |
| chat | FALCON DRIFT-01: Native iOS does not decode canPost | MEDIUM | FALCON |
| chat | FALCON DRIFT-02: Native membership read gate partial vs canReadConversation | MEDIUM | FALCON |
| chat | Zero test coverage for HIGH-tier real-time messaging feature | HIGH | SPIDER-MAN |
| chat | Debug files in feature tree: chatBadgeDebugger.js and chatNavDebugger.js | LOW | WOLVERINE |
| settings | ELEK-002 (HIGH, DEFERRED): ctrlSetActorPrivacy no server-side session binding — actor privacy hijack possible | HIGH | ELEKTRA |
| settings | ELEK-004 (HIGH, DEFERRED): dalSetActorPrivacy no auth.getUser() binding; RLS unconfirmed | HIGH | ELEKTRA |
| settings | ELEK-005 (OPEN): deprecated dalDeleteOwnedVportById still exported live; legacy owner_user_id | HIGH | ELEKTRA |
| settings | VENOM-SETTINGS-004 (P2, DEFERRED): listMyVportsDAL / readMyVports use owner_user_id | MEDIUM | VENOM |
| settings | Layer violation: profile/ui/vportAboutDetails.model.js is a model file inside a UI folder | LOW | SENTRY |
| settings | Adapter boundary violation: vportSocialSettings.controller.js imports from @/features/social/privacy/dal directly | MEDIUM | SENTRY |
| settings | Dead-code risk: settings/queries/ contains 6 hook files of unconfirmed live usage | MEDIUM | IRONMAN |
| settings | BW-SETTINGS-005 (OPEN): upsertVportPublicDetailsDAL has no optimistic locking — replay attack possible | HIGH | BLACKWIDOW |
| settings | TICKET-SUB-010-B (PENDING): actor_social_settings RLS migration not applied | HIGH | CARNAGE |
| settings | Cross-feature ownership dependency: assertActorOwnsVportActorController lives in booking feature | HIGH | IRONMAN |
| block | VF-01 (HIGH OPEN): vc.friend_ranks not cleaned after block — blocked actors may surface in friend suggestions | HIGH | CARNAGE |
| block | LF-01 (MEDIUM OPEN): useBlockStatus uncached on profile load — read amplification 2.0x | MEDIUM | KRAVEN |
| block | LF-02 (LOW OPEN): invalidateFeedBlockCache absent from useBlockActorAction | LOW | WOLVERINE |
| block | Satellite DAL drift: settings/privacy, notifications/inbox, feed/pipeline each maintain own block read DALs | MEDIUM | SENTRY |
| block | FALCON P0 gaps (BLOCKED): NTB-03, NTB-02, NDF-01 unverified | HIGH | FALCON |
| block | Zero test coverage | HIGH | SPIDER-MAN |
| block | BlockButton.jsx imports useIdentity from identityContext instead of identity.adapter | MEDIUM | SENTRY |
| moderation | CRITICAL: assertModerationAccess UUID mismatch — no moderator action can succeed | CRITICAL | CARNAGE |
| moderation | CRITICAL: report_events audit trail broken — INSERT RLS policy missing (SEC-002) | CRITICAL | CARNAGE |
| moderation | CRITICAL: DB migration deployment order — Batch 5 must never apply before Batch 1 | CRITICAL | CARNAGE |
| moderation | Dual-write on conversation cover — feature layer and chat engine; no coordination | HIGH | IRONMAN |
| moderation | Missing moderation.moderators table — root of UUID mismatch bug | CRITICAL | CARNAGE |
| moderation | No moderator dashboard — dismissReportController and hideReportedObjectController have no UI surface | MEDIUM | WOLVERINE |
| moderation | BRIDGE logic in DAL layer: insertReportRow contains domain logic (inbox folder upsert) | MEDIUM | SENTRY |
| moderation | No test coverage | HIGH | SPIDER-MAN |
| moderation | Group chat block enforcement partial | MEDIUM | VENOM |
| legal | getPublicIp.dal.js is dead code retained as reference stub | LOW | CARNAGE |
| legal | F4 OPEN: locale/userAgent still client-supplied; server-side IP capture open | MEDIUM | CARNAGE |
| legal | NEW-LEGAL-JOIN-001 OPEN: signup consent write failures swallowed via .catch(() => {}) | HIGH | VENOM |
| legal | F6 DORMANT: VportCategoryLandingScreen barbershop route may not be registered in app router | MEDIUM | LOKI |
| legal | ELEKTRA has never run on HIGH-tier consent gate feature | HIGH | ELEKTRA |
| legal | Zero test files; consent gate is session-blocking with no regression coverage | HIGH | SPIDER-MAN |
| public | Unexecuted critical security migration VL-001–005 (submit_business_card_lead) — THOR BLOCKED | CRITICAL | CARNAGE |
| public | Duplicate route conflict: /actor/:actorId/menu owned by two features with raw UUID | HIGH | WOLVERINE |
| public | No TTL cache on readVportPublicDetailsRpcDAL and readVportPublicMenuRpcDAL | MEDIUM | KRAVEN |
| public | Double hook on useVportPublicReviews — 3 redundant DB reads per Reviews tab open | MEDIUM | KRAVEN |
| public | 4 files use relative ../ imports instead of @/ aliases | LOW | WOLVERINE |
| public | useAuth() imported inside VportPublicReviewsPanel — auth coupling in wrong layer | MEDIUM | SENTRY |
| public | Style objects defined in vportPublicMenuPanel.model.js — layer violation | LOW | SENTRY |
| public | VportPublicMenuView.jsx at 301 lines — 1 over 300-line architectural limit | LOW | SENTRY |
| public | 5 DB views untracked by CARNAGE migration history | MEDIUM | CARNAGE |
| public | Wildcard CORS on all 5 edge functions — ELEK-2026-05-27-001 OPEN | HIGH | ELEKTRA |
| public | Dead write-review CTA in VportPublicReviewsPanel — no review submission screen wired | LOW | WOLVERINE |
| vport | vport.public.js migration barrel leaks DAL functions to external consumers | MEDIUM | SENTRY |
| vport | vportCoreOps.controller.js is a thin DAL re-export — migration artifact | LOW | IRONMAN |
| vport | listMyVports duplicated across two DAL files — dual source of truth | MEDIUM | WOLVERINE |
| vport | vport.write.profileMedia.dal.js missing requireUser() session guard | MEDIUM | VENOM |
| vport | updateVport() missing ownership assertion before UPDATE — relies on RLS as last defense | MEDIUM | VENOM |
| vport | S-BLK-001: 3 locksmith write paths missing assertActorOwnsVportActorController — BEFORE RELEASE BLOCKER | CRITICAL | VENOM |
| vport | ELEK-009: deleteVportServiceAddonController dual failure — missing gate AND referenced DAL does not exist | CRITICAL | ELEKTRA |
| vport | VD-01/VD-02: removeTeamMemberController and accept/declineTeamRequestController missing auth gates | CRITICAL | VENOM |
| post | V-1 (HIGH): createSystemPost no actor ownership verification in VPORT publish path | HIGH | VENOM |
| post | DR-001 (CRITICAL): vc.posts INSERT RLS gap — any auth user can INSERT as any actor | CRITICAL | CARNAGE |
| post | S-1 (MEDIUM): replacePostMentions DAL-to-DAL boundary violation in post.write.dal.js | MEDIUM | SENTRY |
| post | Dual PostCard adapter paths: adapters/postCard.adapter.js AND postcard/adapters/PostCard.jsx | MEDIUM | WOLVERINE |
| post | PostFeed.screen.jsx reverse-imports useFeed from feed feature — reverse boundary direction | HIGH | SENTRY |
| post | V-2 (MEDIUM): searchMentionSuggestions viewerActorId always null — blocked actors in mention autocomplete | MEDIUM | VENOM |
| post | Duplicate comment insert path: insertPostComment AND createComment | MEDIUM | WOLVERINE |
| post | screens/utils/detectIOS.js misplaced — belongs in shared/ | LOW | WOLVERINE |
| feed | V3 HIGH: feedWelcomeCard write path with unconfirmed WITH CHECK RLS | HIGH | CARNAGE |
| feed | V1 MODERATE: readHiddenPostsForViewer client-supplied viewerActorId; RLS unconfirmed | MEDIUM | CARNAGE |
| feed | V2 MODERATE: readViewerReactionsBatch client-supplied actorId; RLS unconfirmed | MEDIUM | CARNAGE |
| feed | SA2 HIGH: feed.posts.dal.js imports @hydration engine from DAL layer — layer violation | HIGH | IRONMAN |
| feed | Dual hook migration undeclared: useFeed.js and useCentralFeed.js both active with identical APIs | HIGH | WOLVERINE |
| feed | Zero test files — pipeline normalization, visibility logic, mention enrichment uncovered | HIGH | SPIDER-MAN |
| feed | SA3 MODERATE: FeedConfirmModal.jsx iOS stacking context risk | MEDIUM | FALCON |
| feed | Ungated console.log in fetchFeedPage.pipeline.js line 137 | LOW | WOLVERINE |
| social | Privacy DAL split (MAJOR DRIFT — SENTRY): actorPrivacy.dal.js is a shim | HIGH | SENTRY |
| social | ELEK-2026-05-27-002 HIGH OPEN: ctrlSetActorPrivacy missing — no ownership gate on privacy write path | HIGH | ELEKTRA |
| social | V-SUB-008 HIGH OPEN: vc.get_follower_count RPC unconfirmed; follower counts return 0 | HIGH | CARNAGE |
| social | ELEK-2026-05-27-003 MEDIUM OPEN: ctrlSubscribe has no actor-kind guard | MEDIUM | ELEKTRA |
| social | ELEK-2026-05-27-001 HIGH OPEN: count_subscribers/list_subscribers SECURITY DEFINER; migration ready | HIGH | CARNAGE |
| social | 17 CI tests intentionally failing (V-SUB-001/002/003 ownership gate tests) | HIGH | SPIDER-MAN |
| social | 3 DB unknowns unverified: RLS on 3 tables | MEDIUM | DB |
| notifications | KF-1: serial publish delivery loop O(N x 3 x RTT) — ELEVATED | HIGH | KRAVEN |
| notifications | Publish ACL gap: any caller via notifications.adapter.js can publish to any actorId | MEDIUM | IRONMAN |
| notifications | 6 dead files pending deletion approval | MEDIUM | SENTRY |
| notifications | RISK-9: mapSummaryRowToSender() domain transform in lib/ not model/ | LOW | SENTRY |
| notifications | notificationRuntime.dal.js at 300-line contract limit — split required | MEDIUM | SENTRY |
| notifications | My Appointments scope mismatch: booking surface co-located in notifications screen | MEDIUM | IRONMAN |
| notifications | 5 undocumented notification schema tables — DB_RLS UNKNOWN | MEDIUM | DB |
| upload | GAP-039: dual controller folder (controller/ and controllers/) — no canonical designation | MEDIUM | WOLVERINE |
| upload | No actor_owners ownership gate in createPostController — actor_id from caller identity | HIGH | VENOM |
| upload | Post-media atomicity gap — vc.posts inserted before R2 upload completes | HIGH | VENOM |
| upload | block feature consumed via barrel import not adapter — boundary violation | MEDIUM | SENTRY |
| upload | api/uploadMedia.js imports @media engine barrel directly — adapter bypass | MEDIUM | SENTRY |
| upload | R2 Cloudflare worker wildcard CORS with no JWT verification | CRITICAL | VENOM |
| upload | Zero test coverage — SPIDER-MAN BLOCKED since 2026-05-26 | HIGH | SPIDER-MAN |
| upload | Legacy UploadScreen.jsx mount status unknown | MEDIUM | LOKI |
| invite | ARCH-INVITE-001: No public adapter boundary on features/invite/ | MEDIUM | SENTRY |
| invite | inviterActorId unverified at controller layer | HIGH | VENOM |
| invite | DEV probe (rawDebugError) present in hook and view | LOW | WOLVERINE |
| invite | BLOCK-INVITE-003: O(n) listUsers() email enumeration oracle in Edge Function (DB-BLOCKED) | HIGH | DB |
| invite | BLOCK-INVITE-004: Wildcard CORS on send-citizen-invite Edge Function | HIGH | ELEKTRA |
| invite | Zero test coverage | MEDIUM | SPIDER-MAN |
| join | No adapter layer — no join.adapter.js | MEDIUM | SENTRY |
| join | No model layer — raw DAL data passed through | MEDIUM | IRONMAN |
| join | Barbershop-only naming — cannot generalize without forking | LOW | IRONMAN |
| join | Shared DAL home unresolved: joinInvite.dal.js shared between two features | MEDIUM | IRONMAN |
| join | VENOM-FINDING-8 OPEN: acceptJoinResourceDAL has no DAL-level actor ownership check | HIGH | VENOM |
| join | ELEK-028 OPEN: createBarberVportAndAcceptQr does not recheck join_expires_at before VPORT insert | HIGH | ELEKTRA |
| join | VENOM-TEAM-005 OPEN: barberVport.read.dal.js uses profiles.owner_user_id | HIGH | VENOM |
| onboarding | Invite card DAL calls execute unconditionally despite SHOW_INVITE_ONBOARDING_CARD=false | LOW | WOLVERINE |
| onboarding | markActorOnboardingStepCompletedDAL defined but not imported by any controller — possibly orphaned | MEDIUM | IRONMAN |
| onboarding | No session ownership check at controller layer — authorization depends entirely on unconfirmed RLS | HIGH | VENOM |
| onboarding | Stale dev-only console.log probe in readQualifyingVibeInviteCountDAL | LOW | WOLVERINE |
| onboarding | Zero test coverage across 16 source files | MEDIUM | SPIDER-MAN |
| explore | Dead use case: usecases/search.usecase.js never imported | LOW | CARNAGE |
| explore | Duplicate Wanders feature card injection — double-render risk | MEDIUM | WOLVERINE |
| explore | Broken import in ui/index.jsx: screen/ vs screens/ — hard module resolution error | HIGH | WOLVERINE |
| explore | No controller-level auth gate | MEDIUM | VENOM |
| explore | ExploreFeed permanently disabled via hardcoded constant | LOW | WOLVERINE |
| explore | useSearchActor is a no-op alias | LOW | WOLVERINE |
| explore | Triple normalization paths in model layer | MEDIUM | WOLVERINE |
| media | TICKET-PLATFORM-RLS-001 (MEDIUM, OPEN): platform.media_assets {public} policy coexists with tighter policy | MEDIUM | CARNAGE |
| media | Soft-delete DB-blocked: controller + DAL implemented but DB RLS blocks UPDATE | MEDIUM | CARNAGE |
| media | SCOPE_MAP governance gap: no documented approver process for new entries | LOW | IRONMAN |
| media | ownerActorId caller-supplied: DB RLS is sole ownership enforcement | MEDIUM | VENOM |
| media | IIFE swallow pattern: 4+ callers wrap createMediaAssetController in fire-and-forget IIFEs | MEDIUM | WOLVERINE |
| media | Zero test coverage | MEDIUM | SPIDER-MAN |
| professional | ProfessionalAccessScreen has no identity guard | HIGH | VENOM |
| professional | NurseHomeScreenView holds note state in React component state — no persistence | HIGH | WOLVERINE |
| professional | Enterprise sub-domain is 100% seeded/mock data | MEDIUM | WOLVERINE |
| professional | No adapter.js file — no published adapter boundary | MEDIUM | SENTRY |
| professional | linkPath from vc.notifications used directly as navigate() target — open redirect risk | HIGH | VENOM |
| ads | No authorization gate anywhere in the pipeline | HIGH | VENOM |
| ads | localStorage-only persistence — no server-side record, no RLS | HIGH | CARNAGE |
| ads | Cross-feature CSS import: VportAdsSettingsScreen imports settings CSS directly | LOW | WOLVERINE |
| ads | useDesktopBreakpoint local re-export adds indirection without value | LOW | WOLVERINE |
| ads | No formal controller/ layer | MEDIUM | IRONMAN |
| ads | ad.api.js is a pure pass-through over the DAL | LOW | WOLVERINE |
| void | Premature route registration: /void is live with no age gate or realm-ID isolation | HIGH | VENOM |
| void | Empty stub files: 9 of 11 source files are zero bytes | LOW | WOLVERINE |
| void | is_void boundary not enforced inside features/void/ itself | HIGH | VENOM |
| void | No SECURITY.md: security posture for 18+ anonymous-but-DB-tracked realm unknown | HIGH | VENOM |
| hydration | inline-supabase-no-dal: vcsmActorHydrator.js queries DB directly without named DAL | MEDIUM | SENTRY |
| hydration | no-adapter-boundary: no hydration.adapter.js; state/actors/ is de-facto adapter | MEDIUM | SENTRY |
| hydration | zero-test-coverage: platform-critical hydration pipeline has no regression net | HIGH | SPIDER-MAN |
| hydration | legacy-hydrateActor-path-unused: no app-layer consumers call hydrateActor directly | LOW | IRONMAN |
| portfolio | ELEK-2026-05-28-040: ctrlSavePortfolioDetail missing ownership gate | HIGH | ELEKTRA |
| portfolio | ELEK-2026-05-28-041: updatePortfolioMediaAssetIdDAL null ownership filter degradation | LOW | ELEKTRA |
| portfolio | Fragmented module layout across 3 feature paths | MEDIUM | IRONMAN |
| portfolio | setup.js single point of failure for all engine ownership enforcement | HIGH | IRONMAN |
| portfolio | probeVportPortfolio.controller.js imports dashboard/vport internals without adapter boundary | MEDIUM | SENTRY |
| portfolio | Zero test coverage on portfolio write path | HIGH | SPIDER-MAN |
| portfolio | Zero governance documentation | MEDIUM | IRONMAN |
| reviews | Dual VportReviewsView.jsx at two separate screen paths | MEDIUM | WOLVERINE |
| reviews | VportServiceReviews fallback silently returns all reviews when no service FK present | MEDIUM | VENOM |
| reviews | Feature source path contains only setup.js — logic across 4 integration sites | MEDIUM | IRONMAN |
| reviews | ctrlDeleteMyReview dual call-style polymorphism — interface drift | MEDIUM | IRONMAN |
| reviews | dalInsertReview may be superseded by RPC upsert path — unclear if called in production | MEDIUM | DB |

---

## Platform Code Health

Spaghetti Score: 0 = clean, 1 = minor drift, 2 = moderate coupling, 3 = high coupling / boundary violations, 4 = critical — multiple boundary violations, dead code, duplicates, 5 = severely degraded

| Feature | Module Status | Architecture State | Spaghetti Score |
|---|---|---|---|
| auth | MOSTLY_COMPLETE | EVOLVING | 2 |
| booking | MOSTLY_COMPLETE | EVOLVING | 4 |
| identity | MOSTLY_COMPLETE | EVOLVING | 3 |
| actors | MOSTLY_COMPLETE | EVOLVING | 3 |
| profiles | MOSTLY_COMPLETE | EVOLVING | 4 |
| dashboard | MOSTLY_COMPLETE | EVOLVING | 3 |
| chat | MOSTLY_COMPLETE | STABLE | 2 |
| settings | MOSTLY_COMPLETE | EVOLVING | 3 |
| block | MOSTLY_COMPLETE | STABLE | 2 |
| moderation | MOSTLY_COMPLETE | FLAGGED | 5 |
| legal | MOSTLY_COMPLETE | STABLE | 2 |
| public | MOSTLY_COMPLETE | FLAGGED | 4 |
| vport | MOSTLY_COMPLETE | EVOLVING | 4 |
| post | MOSTLY_COMPLETE | EVOLVING | 3 |
| feed | MOSTLY_COMPLETE | EVOLVING | 3 |
| social | MOSTLY_COMPLETE | EVOLVING | 3 |
| notifications | MOSTLY_COMPLETE | EVOLVING | 2 |
| upload | MOSTLY_COMPLETE | FLAGGED | 4 |
| invite | MOSTLY_COMPLETE | EVOLVING | 3 |
| join | MOSTLY_COMPLETE | EVOLVING | 3 |
| onboarding | MOSTLY_COMPLETE | STABLE | 2 |
| explore | MOSTLY_COMPLETE | EVOLVING | 3 |
| media | MOSTLY_COMPLETE | STABLE | 2 |
| professional | MOSTLY_COMPLETE | EVOLVING | 3 |
| ads | MOSTLY_COMPLETE | EVOLVING | 2 |
| void | INCOMPLETE | EVOLVING | 1 |
| hydration | MOSTLY_COMPLETE | STABLE | 2 |
| portfolio | MOSTLY_COMPLETE | EVOLVING | 3 |
| reviews | MOSTLY_COMPLETE | EVOLVING | 2 |

---

## Top 10 Structural Concerns

Ranked by impact scope and severity:

### 1. CRITICAL — moderation feature is completely non-functional (moderation)
assertModerationAccess UUID mismatch means no moderator action can ever succeed. isModerationAuthorizedDAL queries learning.platform_admins with a vc actor UUID (different namespace). Every moderation call throws FORBIDDEN. Additionally, the report_events audit trail INSERT RLS is missing, silently discarding all audit writes. The moderation.moderators table was planned but never created. Batch 5 DB migration must never run before Batch 1 or service_role is locked out. This is a fully broken feature with no safe path to report, hide, or dismiss content.
Handoff: CARNAGE (Batch 1 migration + app-layer UUID fix together as P0)

### 2. CRITICAL — vc.posts INSERT RLS gap allows any authenticated user to post as any actor (post, profiles)
DR-001 OPEN: migration 20260522010000 is pending staging. Any authenticated user can INSERT into vc.posts using any actor_id — no ownership check exists at the DB layer. This affects post creation, system post publishing, and feed integrity.
Handoff: CARNAGE (deploy migration 20260522010000 immediately)

### 3. CRITICAL — platform.provision_vcsm_identity has no auth.uid() guard (identity)
VF-01 OPEN: cross-user identity poisoning is possible on live DB if migration 20260518040000 is undeployed. Any user can call the RPC and provision an identity for another user. Deployment status is UNKNOWN as of scan date.
Handoff: DB (confirm deployment status; if undeployed escalate to P0 and deploy immediately)

### 4. CRITICAL — 3 locksmith write paths missing ownership gate — BEFORE RELEASE BLOCKER (vport)
S-BLK-001: locksmithOwner.controller.js has 3 write paths that call DALs without assertActorOwnsVportActorController. Any authenticated user can write to a locksmith VPORT they do not own. This is the only BEFORE RELEASE BLOCKER requiring no DB migration — it is a code-only fix.
Handoff: VENOM (resolve S-BLK-001)

### 5. CRITICAL — R2 Cloudflare worker wildcard CORS with no JWT verification (upload)
Any origin can trigger uploads to R2. No JWT is verified at the Cloudflare Worker layer. Storage can be filled by unauthenticated actors at zero cost to attacker.
Handoff: VENOM (scope to upload feature; fix worker CORS and add JWT gate)

### 6. CRITICAL — TICKET-BOOKING-RPC-001 customer_actor_id injection confirmed live (booking)
P0 DB-BLOCKED: customer_actor_id is caller-supplied on live DB. Any authenticated user can inject another user's actor ID as the booking customer. Status overpermission also confirmed. Blocked pending typed state-machine RPC migration.
Handoff: CARNAGE (state-machine RPC migration for booking INSERT/UPDATE)

### 7. HIGH — Dual assertActorOwnsVportActor with drift risk (booking, actors)
Two independent implementations of the core VPORT ownership check — one in features/booking/controller and one in engines/booking/src/controller. If they diverge, ownership checks silently fail on one path. All VPORT write auth across profiles, settings, and vport features depends on this single controller in the booking adapter.
Handoff: IRONMAN (confirm canonical owner and deprecate duplicate)

### 8. HIGH — 17 CI tests intentionally failing on social ownership gates (social)
V-SUB-001/002/003 ownership gate tests are intentionally failing. vc.get_follower_count RPC is unconfirmed in live DB; follower counts return 0 for all user-kind actors. ctrlSubscribe has no actor-kind guard — VPORT can follow Citizen and gain private post read access.
Handoff: CARNAGE (deploy Phase 0 migration 20260527060000; re-enable failing tests)

### 9. HIGH — Zero test coverage across nearly all features with no regression net
SPIDER-MAN has never run on: identity (CRITICAL), actors (CRITICAL, branch BLOCKED), booking (CRITICAL), chat (HIGH), block (HIGH), legal (HIGH), post (MEDIUM), feed (MEDIUM), upload (MEDIUM, BLOCKED), invite (MEDIUM), onboarding (MEDIUM), hydration (LOW, platform-critical pipeline). No security fix has regression coverage.
Handoff: SPIDER-MAN (prioritize CRITICAL tier first; then blocked features)

### 10. HIGH — booking dead code: 12 dead DALs + 8 dead controllers in largest feature (booking)
The booking feature is the largest on the platform (42 controllers, 42 DALs) and has confirmed dead code: 12 dead feature DALs and 8 dead feature controllers awaiting CARNAGE removal. This compounds the dual assertActorOwnsVportActor drift risk and makes security audits unreliable.
Handoff: CARNAGE (dead code removal pass in booking; validate with SPIDER-MAN before deletion)

---

## Dead Code Inventory (from scan structural_risks)

| Feature | Dead Code Item | Status |
|---|---|---|
| booking | 12 dead feature DALs | Awaiting CARNAGE removal |
| booking | 8 dead feature controllers | Awaiting CARNAGE removal |
| legal | getPublicIp.dal.js dead code retained as reference stub | Retained — confusing to auditors |
| actors | hydrateActors.controller.js — documented but NOT FOUND in source | ARCH-ACTORS-DRIFT-001 |
| actors | getActorSummariesByIds.dal.js — documented but NOT FOUND in source | ARCH-ACTORS-DRIFT-002 |
| actors | extractActorIdsForHydration.model.js — documented but NOT FOUND in source | ARCH-ACTORS-DRIFT-003 |
| hydration | hydrateActor.controller.js in engine — no app-layer consumers | Legacy unused path |
| explore | usecases/search.usecase.js — never imported by any hook or screen | Dead use case |
| ads | ad.api.js — pure pass-through, no added logic | Effectively dead |
| void | 9 of 11 source files are zero bytes — stub only | Pre-implementation scaffold |
| settings | 6 hook files in settings/queries/ of unconfirmed live usage | Dead-code risk |
| notifications | 6 dead files pending deletion approval | SENTRY REVIEW_PENDING |
| onboarding | markActorOnboardingStepCompletedDAL defined but not imported | Possibly orphaned export |
| vport | vportCoreOps.controller.js is a thin DAL re-export — migration artifact | Low-value dead layer |

---

ARCHITECT Run: 2026-06-02
Features scanned: 29
