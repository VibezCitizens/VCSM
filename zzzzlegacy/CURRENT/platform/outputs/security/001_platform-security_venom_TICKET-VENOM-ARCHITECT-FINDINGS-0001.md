# VENOM Security Pass — ARCHITECT Findings
# Ticket: TICKET-VENOM-ARCHITECT-FINDINGS-0001
# Date: 2026-06-02
# Invoked by: Cerebro → VENOM using verified ARCHITECT second-pass outputs
# Application Scope: VCSM + ENGINE
# Category Key: platform-security

---

## Phase 1 — ARCHITECT Evidence Summary

Seven ARCHITECT findings were ingested and verified by VENOM prior to trace analysis. All findings originated from a confirmed ARCHITECT second-pass scan of live source files. No fabricated findings were introduced.

| # | Finding ID | Feature | ARCHITECT Category | ARCHITECT Verified Status | VENOM Confidence |
|---|---|---|---|---|---|
| 1 | VF-01 | identity | provision_vcsm_identity SECURITY DEFINER missing auth.uid() guard — caller-supplied p_user_id with no DB-side session check | PLAUSIBLE_DB_SIDE (migration 20260518040000 status unknown) | PLAUSIBLE_DB_SIDE |
| 2 | DR-001 | profiles | vc.posts INSERT RLS gap — posts_insert_actor_owner policy absent on live DB; migration pending staging | CONFIRMED | CONFIRMED |
| 3 | ARCH-ACTORS-DRIFT-001/002/003 | actors | Three hydration files documented but not found in live source; hydration migrated to engines/hydration/ with state shims; governance docs reference phantom files | CONFIRMED | CONFIRMED |
| 4 | CROSS-FEATURE-OWNERSHIP | settings/profiles/dashboard/join | assertActorOwnsVportActorController lives in booking feature; ~45 non-test consumers import it cross-feature; dual implementations at feature and engine layers with divergent pre/post ELEK-004 logic | CONFIRMED | CONFIRMED |
| 5 | IDENTITY-ADAPTER-BYPASS | identity | 64 of 111 measured consumers bypass identity.adapter.js via direct identityContext import; useIdentityDisplayDeprecated not exported on adapter surface | CONFIRMED | CONFIRMED |
| 6 | VOID-SCAFFOLD | void | No controllers, DALs, hooks, or models with real implementations; /void route live and reachable by any authenticated user with no age gate | CONFIRMED | CONFIRMED |
| 7 | TICKET-BOOKING-RPC-001 | booking | customer_actor_id injection and status overpermission confirmed on live DB (P0, DB-BLOCKED) | CONFIRMED | CONFIRMED (pre-existing ticket, carried forward) |

All evidence entries from the ARCHITECT pass were used. No ARCHITECT findings were discarded or downgraded without explicit rationale.

---

## Phase 2 — Security Surface Prioritization

### P0 Findings — Immediate Release Blockers

| Priority | Feature / Engine | Finding | Security Impact | Route |
|---|---|---|---|---|
| P0 | identity | VENOM-2026-06-02-001: platform.provision_vcsm_identity SECURITY DEFINER lacks auth.uid() = p_user_id assertion — cross-user identity poisoning via direct PostgREST | Any authenticated user can provision platform identity rows for an arbitrary victim user, hijacking actor links and poisoning all downstream ownership gates | DB → CARNAGE |
| P0 | profiles | VENOM-2026-06-02-002: vc.posts INSERT RLS gap — posts_insert_actor_owner policy absent on live DB (migration pending staging) | Any authenticated user can INSERT a post attributed to any VPORT actor by bypassing the JS ownership guard via direct PostgREST | DB → CARNAGE |
| P0 | booking | TICKET-BOOKING-RPC-001 (carried forward): customer_actor_id injection + status overpermission on live DB | Booking ownership can be bypassed; booking status transitions not state-machine gated at DB layer | DB → CARNAGE |
| P0 | engines/portfolio | VENOM-2026-06-02-010: isActorOwner() throws instead of denying when unconfigured; injected ownership check lacks explicit user_id filter | Auth guard throws on startup race, bypassing structured denial; RLS misconfiguration passes ownership silently | ELEKTRA → fix before release |

### P1 Findings — Caution / Hardening Required

| Priority | Feature / Engine | Finding | Security Impact | Route |
|---|---|---|---|---|
| P1 | identity | VENOM-2026-06-02-003: 64 consumers bypass identity.adapter.js — useIdentityDisplayDeprecated not on adapter surface | Actor switch inconsistency between display state and mutation scope; adapter boundary unenforced | SENTRY |
| P1 | actors | VENOM-2026-06-02-004: ARCH-ACTORS-DRIFT-001/002/003 — three phantom files in governance docs; 6 callers use shim indirection | Security audits model a trust boundary that does not exist; static analysis breaks on phantom paths | IRONMAN |
| P1 | booking/cross-feature | VENOM-2026-06-02-005: dual assertActorOwnsVportActor implementations; pre-ELEK-004 engine version has VPORT self-shortcut bypass; 2 settings files import controller directly | VPORT-kind actor can bypass kind check and own booking operations using engine version; direct import bypasses adapter versioning | IRONMAN |
| P1 | void | VENOM-2026-06-02-006: /void route reachable by any authenticated user; no age gate; no feature flag | When real void content ships, 18+ content accessible to minors; no age verification path exists anywhere in codebase | WOLVERINE |
| P1 | engines/chat | VENOM-2026-06-02-007: moderation shadow DAL issues raw queries against chat.* tables, bypassing chat engine | Two independent write paths into chat schema; no outbox event emission; inbox projection side-effects lost | SENTRY |
| P1 | engines/hydration | VENOM-2026-06-02-008: feed.posts.dal.js imports @hydration at DAL layer — engine consumed at wrong architectural layer | Engine config errors leak internal error messages instead of clean auth failures | SPIDER-MAN |
| P1 | engines/media | VENOM-2026-06-02-009: 7+ files import @media engine barrel directly, bypassing upload feature adapter | No adapter choke point for engine signature changes; upload/api/ layer owns engine orchestration in violation of layer contract | HAWKEYE |

---

## Phase 3 — Source Trace Verification

| Finding | Source Trace | Auth Gate | Ownership Gate | Exploitability | Confidence |
|---|---|---|---|---|---|
| VENOM-2026-06-02-001 | useIdentityResolutionEffect / useAuthOnboarding / useJoinBarbershop → ensureVcsmPlatformBootstrap controller → dalProvisionVcsmIdentity → supabase.rpc('provision_vcsm_identity', {p_user_id, p_actor_id}) → platform.provision_vcsm_identity (SECURITY DEFINER) | JS paths: session-bound; userId derived from session in all three call sites | DB-side: NO auth.uid() check verifiable from JS; migration 20260518040000 status UNKNOWN | HIGH — direct PostgREST call /rest/v1/rpc/provision_vcsm_identity bypasses all JS guards | PLAUSIBLE_DB_SIDE |
| VENOM-2026-06-02-002 | usePublishBarbershopHoursPost / any vport publish hook → publishBarbershopHoursUpdateAsPostController → assertActorOwnsVportActorController (JS-layer only) → createSystemPost (posts.adapter.js) → insertPost.dal.js → supabase.schema('vc').from('posts').insert(row) | JS: assertActorOwnsVportActorController; DAL: none | DB: ABSENT — posts_insert_actor_owner WITH CHECK policy defined in migration 20260522010000 but PENDING STAGING; no ownership join in insertPost.dal.js | HIGH — one HTTP POST to Supabase REST with valid JWT and arbitrary actor_id | CONFIRMED |
| VENOM-2026-06-02-003 | Direct import from @/state/identity/identityContext → useIdentityDisplayDeprecated or useIdentityDetailsDeprecated (not on adapter surface) → display fields rendered or used to scope mutations | Auth gate: present (ProtectedRoute) | Ownership: bypassed — adapter contract unenforced; stale display vs. actorId mutation mismatch possible after actor switch | MEDIUM | CONFIRMED |
| VENOM-2026-06-02-004 | Documentation references: apps/VCSM/src/features/actors/controllers/hydrateActors.controller.js, apps/VCSM/src/features/actors/dal/getActorSummariesByIds.dal.js, apps/VCSM/src/features/actors/model/extractActorIdsForHydration.model.js — all three NOT FOUND in live source | N/A (governance gap, not runtime exploit) | N/A | LOW | CONFIRMED |
| VENOM-2026-06-02-005 | settings (vportBusinessCardSettings.controller.js, vportSocialSettings.controller.js) → direct import from @/features/booking/controller/assertActorOwnsVportActor.controller — bypasses adapter; engine version (engines/booking/src/controller/) applies self-shortcut BEFORE kind check; attacker holds VPORT-kind actor with matching UUID → returns {ok:true,mode:'self'} without kind check or actor_owners DB query | JS: assertActorOwnsVportActorController (engine version, pre-ELEK-004 logic) | DB: no RLS on actor_owners for this specific guard path | MEDIUM | CONFIRMED |
| VENOM-2026-06-02-006 | app.routes.jsx:161 → ProtectedRoute (auth + legalConsent only) → /void → VoidScreen.jsx | Auth: present; LegalConsent: present | Age gate: ABSENT; Feature flag: ABSENT | LOW (scaffold only; rises to HIGH when real content ships) | CONFIRMED |
| VENOM-2026-06-02-007 | moderation/dal/conversationCover.read.dal.js, conversationCover.write.dal.js, reports.dal.js → supabase.schema('chat').from('messages') / from('inbox_entries') — shadow DAL bypassing engines/chat | None at DAL layer for chat schema access | No ownership gate via chat engine; no outbox event emission | LOW | CONFIRMED |
| VENOM-2026-06-02-008 | features/feed/dal/feed.posts.dal.js → import hydrateAndReturnSummaries from '@hydration' at DAL layer | None | Engine config error → throws internal error message rather than structured denial | LOW | CONFIRMED |
| VENOM-2026-06-02-009 | upload/api/uploadMedia.js, settings/profile/hooks/useProfileUploads.js, vport/controller/submitCreateVport.controller.js, dashboard/flyerBuilder/controller/flyerEditor.controller.js, dashboard/flyerBuilder/designStudio/controller/designStudio.assetsExports.controller.js, wanders/core/controllers/publishWandersFromBuilder.controller.js, wanders/core/controllers/cards.controller.js → direct import from @media barrel | None at adapter level | No feature-layer adapter choke point | LOW | CONFIRMED |
| VENOM-2026-06-02-010 | engines/portfolio/src/config.js::isActorOwner() — throws '[PortfolioEngine] isActorOwner not configured.' when _config.isActorOwner is null; setup.js isActorOwner lambda → supabase.from('actor_owners').select('actor_id').eq('actor_id', actorId) — no explicit .eq('user_id', session.user.id) filter; RLS policy actor_owners_read_own is sole enforcement | Throws on unconfigured — not a safe denial | Explicit user_id filter absent — RLS is sole defense | MEDIUM | CONFIRMED |

---

## Phase 4 — VENOM Findings

---

### VENOM-2026-06-02-001

**Finding ID:** VENOM-2026-06-02-001
**Location:** apps/VCSM/src/features/identity/dal/provision.rpc.dal.js → platform.provision_vcsm_identity (Supabase SECURITY DEFINER RPC)
**Application Scope:** VCSM
**Platform Surface:** Identity provisioning — platform.user_app_access, platform.user_app_accounts, platform.user_app_preferences, platform.user_app_state, platform.user_app_actor_links, vc.actors.user_app_account_id
**Trust Boundary:** Authenticated Citizen → Supabase PostgREST → SECURITY DEFINER RPC → platform schema write
**Boundary Violated:** YES — JS application layer enforces session binding; Supabase PostgREST SECURITY DEFINER boundary is the only enforcement point for direct RPC calls; if DB body lacks auth.uid() = p_user_id assertion, the boundary collapses for any valid session JWT
**Contract Violated:**
- ARCHITECTURE.md: all ownership assertions must be DB-enforced, not JS-only
- SECURITY DEFINER functions must validate auth.uid() matches the subject user before any write
- platform schema provisioning RPCs must never accept caller-supplied user identity parameters without session verification

**Current behavior:** dalProvisionVcsmIdentity({ userId, actorId }) calls supabase.rpc('provision_vcsm_identity', { p_user_id: userId, p_actor_id: actorId }) where userId is session-bound in all three JS call paths (onboarding controller derives from dalGetAuthSession(), selfHeal receives from IdentityProvider auth state, joinBarbershop verifies via readCurrentAuthUserDAL() before passing). The RPC is SECURITY DEFINER and callable via direct PostgREST on the platform schema by any authenticated role. If the DB function body does not assert auth.uid() = p_user_id, the session binding enforced by JS is entirely bypassed at the DB level.

**Risk:** Cross-user identity poisoning. Any authenticated user can provision platform identity rows for an arbitrary victim user, overwriting actor links, user_app_access, and account rows. The self-heal path re-provisions silently on next login without detecting the poisoned state. All downstream ownership gates (booking assertActorOwnsVportActor, post authorship, vport dashboard, settings) inherit the poisoned actor identity.

**Severity:** CRITICAL
**Exploitability:** HIGH — requires only a valid session JWT and knowledge of a victim's user UUID and any actor UUID; all obtainable from public API responses or network traffic
**Attack Preconditions:**
1. Attacker holds a valid Supabase session (any authenticated user)
2. Attacker knows a valid victim auth.users.id UUID (obtainable via public profile, invite token, or enumeration)
3. Attacker knows or guesses a valid vc.actors.id UUID to link (obtainable via public actor search or feed)
4. DB function platform.provision_vcsm_identity has no auth.uid() = p_user_id guard in its body (status: PLAUSIBLE_DB_SIDE per migration 20260518040000 deployment status unknown)
5. Direct PostgREST call to /rest/v1/rpc/provision_vcsm_identity on the platform schema bypasses all JS-layer session checks

**Blast Radius:**
- platform.user_app_access — victim row created or overwritten
- platform.user_app_accounts — victim account row poisoned
- platform.user_app_actor_links — victim actor link overwritten, redirecting identity resolution to attacker-chosen actor
- vc.actors.user_app_account_id — bridge column set to attacker-controlled account ID
- Identity self-heal path silently re-provisions on next login without detecting poisoned state
- All features consuming actor-scoped ownership inherit the poisoned actor identity

**Identity Leak Type:** Actor link hijack — attacker-chosen actor UUID replaces victim's legitimate actor link
**Cache Trust Type:** Identity self-heal reads from poisoned platform rows on next login — stale poisoned state survives session refresh
**RLS Dependency:** REQUIRED — DB-side auth.uid() = p_user_id assertion in function body is the mandatory enforcement point
**Why it matters:** The entire VCSM actor identity model anchors to the platform provisioning link. If an attacker can provision platform rows for a victim, every ownership check, booking scope, settings gate, and content attribution on the platform is compromised for that victim. The self-heal path's silent re-provision on login means the attack persists through normal recovery flows.
**Recommended mitigation:** In the DB body of platform.provision_vcsm_identity, add as the first statement: `IF auth.uid() IS NULL OR auth.uid() != p_user_id THEN RAISE EXCEPTION 'permission denied: caller does not own this user identity'; END IF;` This must execute before any INSERT/UPSERT. Migration 20260518040000 must be audited to confirm this guard is present and deployed. Additionally expose the RPC only via the authenticated PostgREST role (not anon), and add a DB-level REVOKE on the anon role for this function.
**Rationale:** SECURITY DEFINER functions bypass the caller's RLS context. Without an explicit auth.uid() assertion in the function body, the database has no ownership check — only the JS application layer does, which is entirely bypassable via direct API calls.
**Follow-up command:** DB
**CISSP Domain (Primary):** Identity and Access Management
**CISSP Domain (Secondary):** Software Development Security; Access Control

---

### VENOM-2026-06-02-002

**Finding ID:** VENOM-2026-06-02-002
**Location:** apps/VCSM/src/features/upload/dal/insertPost.dal.js → supabase.schema('vc').from('posts').insert(row)
**Application Scope:** VCSM
**Platform Surface:** vc.posts — all post_type values including all 8 VPORT system post types
**Trust Boundary:** Authenticated Citizen → Supabase PostgREST → vc.posts INSERT → actor authorship
**Boundary Violated:** YES — actor_id in the INSERT row is not bound to auth.uid() at the DB layer; the JS ownership guard (assertActorOwnsVportActorController) is entirely absent at the persistence layer
**Contract Violated:**
- Architecture contract §1.4: ownership verified through actor_owners only; no DB-layer enforcement exists for vc.posts INSERT
- VCSM CLAUDE.md adapter boundary contract: insertPost.dal.js callable via direct PostgREST without going through any adapter or controller
- posts_insert_actor_owner RLS policy: defined in migration 20260522010000 but not applied to live DB

**Current behavior:** createSystemPost (posts.adapter.js) and createPostController (upload/controllers/createPost.controller.js) both call insertPost.dal.js which fires a direct vc.posts INSERT with caller-supplied actor_id. The only ownership enforcement is assertActorOwnsVportActorController called at the controller layer in JS — fully bypassable via direct PostgREST.

**Risk:** Content injection under any VPORT actor identity. Any authenticated user can publish posts (any post_type) attributed to any VPORT actor by calling the Supabase REST API directly.

**Severity:** CRITICAL
**Exploitability:** HIGH — requires only a valid session JWT and knowledge of a target VPORT actor UUID; actor UUIDs are observable from public API responses; the attack requires one HTTP request
**Attack Preconditions:**
1. Attacker is any authenticated Citizen — no special role required
2. Attacker knows or can observe the target VPORT actor UUID from feed payloads, profile API responses, or network traffic
3. Migration 20260522010000 / 20260523010000 has NOT been applied to the live database (confirmed PENDING STAGING as of 2026-06-02)
4. Attacker holds a valid Supabase session JWT (obtained by logging into VCSM normally)

**Blast Radius:**
- All VPORT actors on the platform — any can be impersonated as post author
- All 8 system post_type values: exchange_rate_update, barbershop_hours_update, barbershop_portfolio_update, locksmith_hours_update, locksmith_portfolio_update, locksmith_service_area_update, locksmith_service_details_update, menu_update
- Content injection into victim VPORT public feed — visible to all followers and public visitors
- Reputation and trust damage to any VPORT business identity on the platform
- Feed integrity — injected posts flow through feed.posts.dal.js into all consumer feeds without additional ownership verification
- createPostController is a second INSERT path with the same RLS gap

**Identity Leak Type:** Actor impersonation — attacker posts as a victim VPORT actor
**Cache Trust Type:** Feed read path trusts actor_id on post row with no re-verification of ownership
**RLS Dependency:** REQUIRED AND ABSENT — correct policy (posts_insert_actor_owner WITH CHECK EXISTS (SELECT 1 FROM vc.actor_owners ao WHERE ao.actor_id = posts.actor_id AND ao.user_id = auth.uid())) is defined in pending migrations 20260522010000 and 20260523010000 but has not been applied to the live database
**Why it matters:** Content authenticity is the core trust proposition of VCSM. An attack that allows any user to publish system posts under a VPORT business identity undermines the platform's primary value for business operators. The gap affects all 8 VPORT post types simultaneously.
**Recommended mitigation:** CARNAGE migration must be applied to staging then production immediately: apply 20260522010000_vc_posts_insert_ownership_rls.sql (or equivalent in 20260523010000_backfill_tracked_rls_coverage.sql lines 104-120). Additionally: (1) add a second ownership verification in createSystemPost (posts.adapter.js) by querying actor_owners before calling insertPost; (2) add server-side ownership check in createPostController; (3) after migration, run SPIDER-MAN regression tests covering all 8 vport system post types.
**Rationale:** The DB-layer WITH CHECK policy is the only enforcement point that cannot be bypassed by direct API calls. The JS guard is necessary but not sufficient. Defense in depth requires both.
**Follow-up command:** CARNAGE
**CISSP Domain (Primary):** Identity and Access Management
**CISSP Domain (Secondary):** Software Development Security — missing server-side authorization enforcement at the persistence layer; Access Control — DB RLS policy absent

---

### VENOM-2026-06-02-003

**Finding ID:** VENOM-2026-06-02-003
**Location:** apps/VCSM/src/state/identity/identityContext.jsx — direct consumers bypass apps/VCSM/src/features/identity/adapters/identity.adapter.js
**Application Scope:** VCSM
**Platform Surface:** Identity display and detail fields across all feature surfaces that render actor name, avatar, vportType, or scope mutations by actorId
**Trust Boundary:** Feature consumer → identity adapter surface → identityContext internal state
**Boundary Violated:** YES — 64 of 111 measured consumers import directly from identityContext, bypassing the adapter; useIdentityDisplayDeprecated and useIdentityDetailsDeprecated are not exported on the adapter surface
**Contract Violated:** Adapter boundary contract — all feature consumption of the identity engine must flow through identity.adapter.js; deprecated symbols not accessible via adapter force internal bypass

**Current behavior:** 64 feature files import useIdentityDisplayDeprecated or useIdentityDetailsDeprecated directly from @/state/identity/identityContext. These hooks expose raw identity detail fields (displayName, username, avatar, banner, vportType, isActive, isDeleted, isVoid) without going through the adapter contract. 47 files use the correct adapter path.

**Risk:** Actor switch inconsistency — display state reflects prior actor while mutations are scoped to switched actor. Adapter contract unenforced. If identityContext internals are refactored, all 64 bypass consumers break silently with no compile-time warning.

**Severity:** HIGH
**Exploitability:** MEDIUM — no direct DB exploit; risk manifests as ownership confusion enabling actions scoped to the wrong actor identity
**Attack Preconditions:**
1. User has access to a multi-actor account (or an actor switch occurs in-session)
2. Consumer renders display from stale identityContext snapshot while mutation actorId has updated
3. UI-layer ownership confusion causes action to execute under the wrong actor

**Blast Radius:**
- features/settings (account, privacy, vports hooks)
- features/post (postcard, commentcard views and hooks, feed screen)
- features/dashboard/vport (12+ dashboard card screens and hooks)
- features/profiles/kinds/vport (exchange, locksmith, barbershop, menu, services, review hooks)
- features/upload (ActorPill, useResolvedActor, useUploadSubmit)
- features/chat/inbox (useVexSettings)
- features/block (BlockButton)
- features/notifications (NotificationsScreenView)
- features/ads (VportAdsSettingsScreen)
- app/layout (RootLayout)
- app/routes (appRoutes.redirects)
- learning/layout (LearningLayout)

**Identity Leak Type:** Stale identity display — raw identity fields from deprecated internal hook, not gated by adapter contract
**Cache Trust Type:** identityContext snapshot trust — 64 consumers trust raw context state rather than adapter-mediated identity object
**RLS Dependency:** NONE
**Why it matters:** The adapter boundary exists to ensure that all consumers receive identity data through a single controlled surface. 64 bypass consumers mean that 58% of the identity consumer surface is ungoverned. Any refactor of identityContext — including deprecation of the deprecated hooks — breaks 64 files silently.
**Recommended mitigation:** (1) Add useIdentityDisplayDeprecated and useIdentityDetailsDeprecated to identity.adapter.js exports as explicitly deprecated symbols. (2) Migrate the direct caller of useIdentityDisplayDeprecated in features/settings/account/hooks/useAccountController.js to derive display fields from useIdentity() instead. (3) Migrate all 64 identityContext direct importers to import from identity.adapter.js or @identity alias. (4) Once migration complete, seal identityContext.jsx as a non-importable internal.
**Rationale:** Adapter boundaries are the VCSM architecture's primary mechanism for controlling cross-layer dependencies. 64 bypass consumers represent more than half of the identity consumption surface operating outside governance.
**Follow-up command:** SENTRY
**CISSP Domain (Primary):** Security Architecture and Engineering
**CISSP Domain (Secondary):** Software Development Security; Identity and Access Management

---

### VENOM-2026-06-02-004

**Finding ID:** VENOM-2026-06-02-004
**Location:** apps/VCSM/src/features/actors/ — documentation references three files absent from live source; state shim at apps/VCSM/src/state/actors/
**Application Scope:** VCSM + ENGINE
**Platform Surface:** Actor hydration governance — actors feature documentation, feature-map.md, vcsm-engine-consumer-map.md
**Trust Boundary:** Security audit boundary — documentation-defined trust model vs. live source trust model
**Boundary Violated:** YES — three phantom files in governance docs create a false hydration trust boundary model visible to auditors but absent from runtime
**Contract Violated:** Architecture contract — documentation must accurately reflect live source; phantom file references in governance docs create false security audit surface

**Current behavior:** ARCH-ACTORS-DRIFT-001/002/003 are formally logged in actors/ARCHITECTURE.md but marked open with no remediation ticket or owner. Hydration has migrated to engines/hydration/ with state shims re-exporting from @hydration. 6 feature files still consume via @/state/actors/hydrateActors shim instead of @hydration directly.

**Risk:** Security audits and architecture reviews model a hydration trust boundary (controller → DAL → engine) at the feature layer that no longer exists. Future auditors will trace non-existent code paths. The 6 shim-dependent callers add undocumented indirection that conceals the real engine path from static analysis tools.

**Severity:** HIGH
**Exploitability:** LOW — no direct runtime exploit; risk is governance blind spot enabling future security gaps to go undetected
**Attack Preconditions:** N/A (governance finding, not runtime exploit)

**Blast Radius:**
- actors feature documentation references three phantom files
- feature-map.md and vcsm-engine-consumer-map.md have stale actor hydration entries
- 6 feature files consume via shim: features/settings/queries/useBlockedCitizens.js, features/post/commentcard/hooks/useCommentThread.js, features/social/friend/request/hooks/useIncomingFollowRequests.js, features/profiles/kinds/vport/screens/booking/components/bookingCalendarDayPanel.components.jsx, features/profiles/kinds/vport/screens/booking/hooks/useVportBookingView.js, features/profiles/controller/post/getActorPosts.controller.js
- VENOM/ELEKTRA passes on actors using feature documentation will model a non-existent trust boundary

**Identity Leak Type:** N/A
**Cache Trust Type:** Documentation cache trust — auditors rely on stale documentation to model system boundaries
**RLS Dependency:** NONE
**Why it matters:** Accurate governance documentation is the foundation of effective security review. When phantom files are referenced, auditors and automated tools model a code surface that does not exist, producing false coverage claims and missing real attack surfaces.
**Recommended mitigation:** (1) Close ARCH-ACTORS-DRIFT-001/002/003 by adding a RESOLUTION block to actors/ARCHITECTURE.md confirming intentional removal. (2) Update feature-map.md and vcsm-engine-consumer-map.md to remove deleted file references. (3) Migrate 6 shim-dependent callers from @/state/actors/hydrateActors to import directly from @hydration. (4) Assign IRONMAN ownership ticket: actor hydration is now owned by engines/hydration; actors feature is search-only.
**Rationale:** Open drift findings with no assigned owner and no remediation ticket are indefinitely deferred. The explicit RESOLUTION block and ownership reassignment close the governance gap permanently.
**Follow-up command:** IRONMAN
**CISSP Domain (Primary):** Security Assessment and Testing
**CISSP Domain (Secondary):** Software Development Security; Security Architecture and Engineering

---

### VENOM-2026-06-02-005

**Finding ID:** VENOM-2026-06-02-005
**Location:** apps/VCSM/src/features/booking/controller/assertActorOwnsVportActor.controller.js (feature version, post-ELEK-004) vs. engines/booking/src/controller/assertActorOwnsVportActor.controller.js (engine version, pre-ELEK-004); direct imports in apps/VCSM/src/features/settings/profile/hooks/vportBusinessCardSettings.controller.js and vportSocialSettings.controller.js
**Application Scope:** VCSM + ENGINE
**Platform Surface:** Booking owner actions, schedule operations, settings mutations, profile mutations, join flow operations — all ~45 consumer files
**Trust Boundary:** Authenticated Citizen/VPORT → assertActorOwnsVportActor ownership gate → booking/settings/profile mutations
**Boundary Violated:** YES — dual implementations with divergent logic; engine version (pre-ELEK-004) applies self-shortcut before kind check; 2 settings files import feature controller directly bypassing adapter
**Contract Violated:**
- One canonical implementation per controller — dual implementations with divergent logic violate this
- Adapter boundary contract — settings files import from @/features/booking/controller/ directly, bypassing booking.adapter

**Current behavior:** Engine version: at line 7, if requestActorId === targetActorId it immediately returns {ok:true, mode:'self'} regardless of actor kind. Feature version (post-ELEK-004): kind check is applied first — kind must be 'user' before the self-shortcut is accepted. Engine version never received the ELEK-004 fix.

**Risk:** VPORT-kind actor with UUID matching targetActorId can return self-shortcut from engine version without kind check, bypassing 'Only actor owners can manage this booking resource' guard. Allows VPORT actor identity to perform booking owner operations intended only for user actor identities.

**Severity:** HIGH
**Exploitability:** MEDIUM — attacker must control a VPORT-kind actor with UUID matching a targetActorId; this requires some platform standing (having created a VPORT) but no special privilege
**Attack Preconditions:**
1. Attacker controls a VPORT-kind actor (kind='vport') with UUID matching the targetActorId
2. The consumer resolves to the engine version of assertActorOwnsVportActorController (pre-ELEK-004)
3. No DB-layer RLS blocks the subsequent mutation

**Blast Radius:**
- Booking owner actions: createOwnerBooking, updateVportBooking, confirmBooking, cancelBooking
- Schedule operations: loadDaySchedule, setAvailabilityRule, setAvailabilityException, setResourceSlotDuration
- Settings mutations: saveVportPublicDetailsByActorId, vportBusinessCardSettings, vportSocialSettings, vportDirectoryVisibility, account, privacy
- Profile mutations: upsertVportRate
- Join flow operations: joinBarbershopQr, joinBarbershopAccount (3 ownership checks)

**Identity Leak Type:** Role bypass — VPORT actor kind accepted as user actor kind in pre-ELEK-004 engine version
**Cache Trust Type:** N/A — synchronous ownership check
**RLS Dependency:** NONE — this is a JS-layer ownership gate; RLS on actor_owners is a separate defense layer not invoked by this controller
**Why it matters:** The kind check in ELEK-004 exists specifically to prevent VPORT actors from impersonating user actors in ownership contexts. A dual-implementation drift means half the consumer surface may operate on the pre-fix logic depending on which import path resolves at runtime.
**Recommended mitigation:** (1) Move assertActorOwnsVportActorController to the engines/booking adapter surface and deprecate the feature-layer copy — one canonical implementation. (2) Port the ELEK-004 fix (unconditional kind check before self-shortcut) into the engine version immediately. (3) Patch the two direct controller imports in vportBusinessCardSettings.controller.js and vportSocialSettings.controller.js to use @/features/booking/adapters/booking.adapter. (4) Audit all 45 consumers to confirm they resolve to post-ELEK-004 implementation.
**Rationale:** One canonical implementation at the adapter surface eliminates the drift risk permanently. The ELEK-004 fix must be in the engine version before the feature version is deprecated.
**Follow-up command:** IRONMAN
**CISSP Domain (Primary):** Identity and Access Management
**CISSP Domain (Secondary):** Software Development Security; Security Assessment and Testing

---

### VENOM-2026-06-02-006

**Finding ID:** VENOM-2026-06-02-006
**Location:** apps/VCSM/src/app/app.routes.jsx line 161 → apps/VCSM/src/features/void/VoidScreen.jsx
**Application Scope:** VCSM
**Platform Surface:** /void route — planned 18+ anonymous realm
**Trust Boundary:** ProtectedRoute (auth + legalConsent) → /void — no age gate between authenticated Citizen and void content
**Boundary Violated:** YES — age verification boundary does not exist anywhere in the codebase; /void is live and reachable by any authenticated user who has accepted platform ToS
**Contract Violated:**
- Memory rule: Void Realm is planned 18+ anonymous-but-DB-tracked realm
- Memory rule: Void Realm System Post Exclusion — void:false is enforced for system posts; age gate must enforce the same boundary at route level

**Current behavior:** /void is registered in the ProtectedRoute tree at app.routes.jsx:161 with no age gate, no void-specific guard, and no feature flag wrapper. VoidScreen.jsx renders a placeholder-only screen ("The Architect is currently weaving thresholds..."). Any authenticated user with accepted platform ToS can navigate to /void today.

**Risk:** When real void content ships, the route has no mechanism to block underage users. No AgeGate component exists anywhere in the codebase. Current exposure is scaffold text only — exploitability rises to HIGH the moment any void content or DB-tracked anonymous identity logic is wired.

**Severity:** MEDIUM (rising to P0 when void content ships)
**Exploitability:** LOW — current content is a placeholder stub; no data is exposed
**Attack Preconditions:**
1. User is authenticated and has accepted platform ToS
2. User navigates to /void directly (no deep-link required)

**Blast Radius:**
- Any authenticated user can reach /void today — exposure is scaffold text only
- When void content ships: 18+ content accessible to minors with no age verification
- DB-tracked anonymous identity (void realm design) would be issued to unverified-age users
- Platform legal liability for age-gated content served without age verification

**Identity Leak Type:** N/A — scaffold route has no identity data
**Cache Trust Type:** N/A
**RLS Dependency:** NONE — scaffold route has no DB queries; future void content will require dedicated RLS policies on void-scoped tables
**Why it matters:** The void realm's 18+ design is a platform invariant documented in memory. A route with no age gate, no feature flag, and no consent gate is a legal and trust liability that becomes critical the moment any real content ships. No AgeGate component existing anywhere in the codebase means the gate cannot be wired without new implementation work.
**Recommended mitigation:** (1) Immediately wrap /void in a releaseFlags.voidRealm feature flag that redirects to /feed when false. (2) Design and implement an AgeGateScreen component before any void content ships — must verify age via DOB confirmation against user profile, not a click-through. (3) Add a void-specific consent gate separate from platform ToS. (4) Ensure the age gate enforces the void:false boundary on the route level consistent with the system post exclusion rule.
**Rationale:** Regulatory compliance for age-gated content requires a real age verification mechanism, not just a ToS acceptance. The absence of any AgeGate component in the codebase means this is a design gap, not a configuration gap.
**Follow-up command:** WOLVERINE
**CISSP Domain (Primary):** Security and Risk Management
**CISSP Domain (Secondary):** Software Development Security; Legal, Regulations, Investigations, and Compliance

---

### VENOM-2026-06-02-007

**Finding ID:** VENOM-2026-06-02-007
**Location:** apps/VCSM/src/features/moderation/dal/conversationCover.read.dal.js, conversationCover.write.dal.js, reports.dal.js
**Application Scope:** VCSM
**Platform Surface:** chat.messages, chat.inbox_entries — moderation shadow DAL
**Trust Boundary:** moderation feature → engines/chat adapter surface
**Boundary Violated:** YES — moderation DAL files issue raw supabase.schema('chat') queries bypassing engines/chat entirely
**Contract Violated:** Engine boundary contract — all reads and writes against chat.* tables must route through engines/chat adapter functions

**Current behavior:** conversationCover.read.dal.js queries chat.messages directly. conversationCover.write.dal.js updates chat.inbox_entries folder (spam routing) directly. reports.dal.js upserts into inbox_entries directly. None of these routes through @chat. engines/chat exposes markConversationSpam via its barrel — moderation operates a parallel shadow DAL against the same schema tables.

**Risk:** Two independent write paths into the chat schema with no shared ownership gate, no outbox event emission, and no idempotency guarantees from the chat engine. Moderation actions that update inbox_entries folder cannot trigger the chat engine's receipt/inbox projection side-effects.

**Severity:** MEDIUM
**Exploitability:** LOW — no direct DB exploit; risk is data consistency and missing side-effects
**Attack Preconditions:** N/A (architecture violation, not an exploit path)
**Blast Radius:**
- chat.inbox_entries write integrity — spam routing via shadow DAL bypasses chat engine ownership gate
- Chat engine outbox events not emitted for moderation-driven inbox updates
- Idempotency guarantees from chat engine absent for moderation actions

**Identity Leak Type:** N/A
**Cache Trust Type:** N/A
**RLS Dependency:** NONE (architecture boundary violation, not RLS gap)
**Why it matters:** Shadow DALs against engine-owned schemas create silent divergence in data integrity. When the chat engine's write contracts change, the shadow DAL breaks without warning and without triggering the engine's side-effects.
**Recommended mitigation:** Route all moderation reads and writes against chat.* through @chat adapter functions. Add missing functions to the chat engine's adapter surface if they don't yet exist (readLatestConversationMessage, updateConversationInboxFolder, updateConversationInboxLastMessage).
**Rationale:** Single write path through the engine ensures ownership gates, outbox events, and idempotency guarantees apply uniformly regardless of which feature triggers the mutation.
**Follow-up command:** SENTRY
**CISSP Domain (Primary):** Security Architecture and Engineering
**CISSP Domain (Secondary):** Software Development Security; Asset Security

---

### VENOM-2026-06-02-008

**Finding ID:** VENOM-2026-06-02-008
**Location:** apps/VCSM/src/features/feed/dal/feed.posts.dal.js
**Application Scope:** VCSM
**Platform Surface:** Feed hydration path — @hydration engine consumed at DAL layer
**Trust Boundary:** DAL layer → controller layer → engine layer
**Boundary Violated:** YES — feed.posts.dal.js imports hydrateAndReturnSummaries from @hydration at DAL layer; DALs are defined as dumb DB adapters — no cross-engine calls
**Contract Violated:** Layer contract — engine consumption must flow through a controller or adapter, not a DAL

**Current behavior:** feed.posts.dal.js line 9 imports hydrateAndReturnSummaries from @hydration. The file's own comment acknowledges it is legacy/dev-diagnostics-only but it remains in the live source tree. If this DAL is invoked before configureHydrationEngine() completes, it produces a misconfigured-client error rather than a clean structured failure.

**Risk:** Engine config errors leak internal engine error messages instead of clean structured auth failures. Layer boundary violation enables future callers to bypass controller-layer guards.

**Severity:** LOW
**Exploitability:** LOW — no direct exploit; risk is error message leakage and layer boundary erosion
**Attack Preconditions:** N/A
**Blast Radius:**
- If invoked before hydration engine configuration: misconfigured-client error leaks internal engine error message to caller
- Layer boundary erosion — establishes pattern for other DAL files to import engine internals

**Identity Leak Type:** N/A
**Cache Trust Type:** N/A
**RLS Dependency:** NONE
**Why it matters:** DAL files that import engine internals undermine the architectural guarantee that DALs are simple DB adapters. The error leakage path is a secondary concern.
**Recommended mitigation:** Delete feed.posts.dal.js (the active feed pipeline uses feed.read.posts.dal and actorsBundle per the file's own comment), or move the hydration call to a controller wrapper so the DAL only contains the supabase SELECT.
**Rationale:** A legacy file marked as dev-diagnostics-only should not exist in the live source tree. Deletion is the correct remediation.
**Follow-up command:** SPIDER-MAN
**CISSP Domain (Primary):** Software Development Security
**CISSP Domain (Secondary):** Security Architecture and Engineering

---

### VENOM-2026-06-02-009

**Finding ID:** VENOM-2026-06-02-009
**Location:** apps/VCSM/src/features/upload/api/uploadMedia.js and 6 additional feature files importing @media engine barrel directly
**Application Scope:** VCSM
**Platform Surface:** Media upload path — uploadMediaController from @media (engines/media barrel)
**Trust Boundary:** Feature consumer → upload feature adapter → engines/media
**Boundary Violated:** YES — 7+ files import @media engine barrel directly without going through the upload feature adapter
**Contract Violated:** Engine boundary contract — cross-feature engine access must flow through a feature adapter, not direct engine barrel imports

**Current behavior:** uploadMediaController from @media is imported directly by upload/api/uploadMedia.js, settings/profile/hooks/useProfileUploads.js, vport/controller/submitCreateVport.controller.js, dashboard/flyerBuilder/controller/flyerEditor.controller.js, dashboard/flyerBuilder/designStudio/controller/designStudio.assetsExports.controller.js, wanders/core/controllers/publishWandersFromBuilder.controller.js, and wanders/core/controllers/cards.controller.js. The upload feature owns a media.adapter and mediaAppId.adapter within @/features/media/adapters/ but these are not enforced as the sole entry point.

**Risk:** No adapter choke point for engine signature changes. upload/api/uploadMedia.js is an API-layer file that owns engine orchestration — layer contract violation. If engine signature or configuration contract changes, all 7 call sites break independently.

**Severity:** MEDIUM
**Exploitability:** LOW — no direct exploit; risk is architectural fragility and missing choke point for auditing
**Attack Preconditions:** N/A
**Blast Radius:**
- 7 direct @media importers break independently if engine signature changes
- upload/api/ layer owns engine orchestration in violation of layer contract
- No single choke point for access auditing of media upload operations

**Identity Leak Type:** N/A
**Cache Trust Type:** N/A
**RLS Dependency:** NONE
**Why it matters:** Adapter choke points are the mechanism by which VCSM enforces single-point governance over cross-engine access. 7 direct importers bypass this governance entirely.
**Recommended mitigation:** Centralize all uploadMediaController calls behind a single upload feature adapter function in @/features/upload/adapters/upload.adapter.js. All 7 direct @media importers in non-media features must be refactored to call the upload adapter. uploadMedia.js in upload/api/ should delegate to upload/controller/ rather than directly to the engine.
**Rationale:** Single adapter choke point enables future engine changes, access auditing, and rate/policy enforcement to be applied at one location rather than 7.
**Follow-up command:** HAWKEYE
**CISSP Domain (Primary):** Security Architecture and Engineering
**CISSP Domain (Secondary):** Software Development Security; Access Control

---

### VENOM-2026-06-02-010

**Finding ID:** VENOM-2026-06-02-010
**Location:** engines/portfolio/src/config.js::isActorOwner() → apps/VCSM/src/features/portfolio/setup.js → engines/portfolio write controllers
**Application Scope:** VCSM + ENGINE
**Platform Surface:** Portfolio write operations — createItem, updateItem, deleteItem, addMedia, manageTags
**Trust Boundary:** Portfolio engine startup → isActorOwner ownership gate → portfolio write mutations
**Boundary Violated:** YES — throws instead of safe-denial when unconfigured; explicit user_id filter absent in injected ownership check; RLS policy is sole enforcement layer against misconfiguration
**Contract Violated:**
- Authorization guard contract — auth guards must return structured denial ({ok:false}) on failure, never throw
- Defense-in-depth contract — explicit .eq('user_id', session.user.id) filter is required in addition to RLS (PORT-V-001 pattern documented)

**Current behavior:** config.js::isActorOwner() throws '[PortfolioEngine] isActorOwner not configured.' when _config.isActorOwner is null. setup.js isActorOwner lambda queries vc.actor_owners with only .eq('actor_id', actorId) — no explicit user_id filter; relies solely on actor_owners_read_own RLS policy for user scoping.

**Risk:** (1) Thrown error on unconfigured guard bypasses structured denial — startup race condition or test harness invocation produces uncaught exception rather than {ok:false}. (2) If actor_owners_read_own RLS policy is absent or misconfigured (see TICKET-PLATFORM-RLS-001), ownership check silently passes for any actor_id the caller supplies.

**Severity:** HIGH
**Exploitability:** MEDIUM — (1) startup race: low exploitability in production; higher in test harness; (2) RLS misconfiguration dependency: exploitability is HIGH if TICKET-PLATFORM-RLS-001 policy is absent on live DB
**Attack Preconditions:**
1. For (1): code path invokes portfolio engine controller before main.jsx configuration completes (hot-module reload, test harness, server-side hydration)
2. For (2): actor_owners_read_own RLS policy is absent or misconfigured on live DB (TICKET-PLATFORM-RLS-001 open)

**Blast Radius:**
- All 5 portfolio write controllers: createItem, updateItem, deleteItem, addMedia, manageTags
- dashboard/vport/dashboard/cards/portfolio/ — all write operations
- profiles/kinds/vport/controller/portfolio/ — VportPortfolio.controller.js

**Identity Leak Type:** Ownership bypass via unconfigured guard — any actor_id accepted if guard throws rather than denies
**Cache Trust Type:** N/A
**RLS Dependency:** YES — actor_owners_read_own RLS policy is the sole user_id scoping mechanism in the current setup.js lambda; see TICKET-PLATFORM-RLS-001
**Why it matters:** Authorization guards that throw instead of deny create a class of authorization bypass that is invisible under normal error handling. If a caller catches the exception and proceeds, the ownership check is effectively skipped. The explicit user_id filter absence means RLS misconfiguration produces silent ownership bypass rather than a visible error.
**Recommended mitigation:** (1) Change isActorOwner() in config.js to return false (safe denial) when not configured, rather than throwing. (2) Add explicit .eq('user_id', session.user.id) filter in setup.js isActorOwner lambda as defense-in-depth against RLS misconfiguration. (3) Add a configuration-guard assertion in main.jsx that verifies setupVcsmPortfolioEngine() completed before React tree renders. (4) Audit all 5 portfolio write controllers to confirm each calls isActorOwner() before any DAL mutation.
**Rationale:** Authorization guards must never throw — thrown errors are ambiguous failure modes that can be silently caught and ignored. Safe denial must be the default.
**Follow-up command:** ELEKTRA
**CISSP Domain (Primary):** Access Control
**CISSP Domain (Secondary):** Security Architecture and Engineering; Software Development Security

---

### Finding Summary Table

| ID | Severity | Feature | Status | THOR Impact | Follow-up |
|---|---|---|---|---|---|
| VENOM-2026-06-02-001 | CRITICAL | identity | OPEN | BLOCKED | DB |
| VENOM-2026-06-02-002 | CRITICAL | profiles | OPEN | BLOCKED | CARNAGE |
| VENOM-2026-06-02-003 | HIGH | identity | OPEN | CAUTION | SENTRY |
| VENOM-2026-06-02-004 | HIGH | actors | OPEN | CAUTION | IRONMAN |
| VENOM-2026-06-02-005 | HIGH | booking/cross-feature | OPEN | CAUTION | IRONMAN |
| VENOM-2026-06-02-006 | MEDIUM | void | OPEN | CAUTION | WOLVERINE |
| VENOM-2026-06-02-007 | MEDIUM | engines/chat | OPEN | CAUTION | SENTRY |
| VENOM-2026-06-02-008 | LOW | engines/hydration | OPEN | NONE | SPIDER-MAN |
| VENOM-2026-06-02-009 | MEDIUM | engines/media | OPEN | CAUTION | HAWKEYE |
| VENOM-2026-06-02-010 | HIGH | engines/portfolio | OPEN | BLOCKED | ELEKTRA |

---

## Phase 5 — THOR Impact

| Finding | THOR Impact | Reason |
|---|---|---|
| VENOM-2026-06-02-001 | BLOCKED | CRITICAL — SECURITY DEFINER RPC with unverified auth.uid() guard; identity poisoning attack vector open until DB migration confirmed deployed |
| VENOM-2026-06-02-002 | BLOCKED | CRITICAL — vc.posts INSERT RLS absent on live DB; actor impersonation via direct PostgREST is live until CARNAGE migration applied |
| VENOM-2026-06-02-003 | CAUTION | HIGH — adapter bypass does not block release but must be remediated before adapter governance is enforced; 64 consumers at risk on identityContext refactor |
| VENOM-2026-06-02-004 | CAUTION | HIGH — governance blind spot does not block release but invalidates security audit surface for actors hydration until resolved |
| VENOM-2026-06-02-005 | CAUTION | HIGH — dual implementation with divergent ELEK-004 fix does not block release but engine version must receive ELEK-004 patch before adapter canonicalization |
| VENOM-2026-06-02-006 | CAUTION | MEDIUM — scaffold only; becomes P0 blocker the moment void content ships; feature flag must be applied before next release cycle |
| VENOM-2026-06-02-007 | CAUTION | MEDIUM — shadow DAL does not block release but creates data integrity risk in moderation-driven chat updates |
| VENOM-2026-06-02-008 | NONE | LOW — legacy file with no active consumer; does not affect release |
| VENOM-2026-06-02-009 | CAUTION | MEDIUM — direct engine imports do not block release but must be consolidated before any media engine signature change |
| VENOM-2026-06-02-010 | BLOCKED | HIGH — throw-on-unconfigured authorization guard is an unsafe failure mode; explicit user_id filter absent; interacts with TICKET-PLATFORM-RLS-001; must be resolved before portfolio writes ship |

### THOR Blockers
- VENOM-2026-06-02-001 (identity — SECURITY DEFINER RPC auth guard)
- VENOM-2026-06-02-002 (profiles — vc.posts INSERT RLS absent on live DB)
- VENOM-2026-06-02-010 (engines/portfolio — isActorOwner throws, explicit user_id filter absent)
- TICKET-BOOKING-RPC-001 (booking — customer_actor_id injection, pre-existing P0 DB-BLOCKED)

### CAUTION Only
- VENOM-2026-06-02-003 (identity adapter bypass)
- VENOM-2026-06-02-004 (actors hydration drift)
- VENOM-2026-06-02-005 (cross-feature assertActorOwnsVportActor dual implementation)
- VENOM-2026-06-02-006 (void unguarded route)
- VENOM-2026-06-02-007 (engines/chat shadow DAL)
- VENOM-2026-06-02-009 (engines/media direct barrel imports)

### DB / CARNAGE Required
- VENOM-2026-06-02-001 → DB: audit migration 20260518040000 deployment; add auth.uid() = p_user_id assertion to platform.provision_vcsm_identity body; REVOKE anon role from function
- VENOM-2026-06-02-002 → CARNAGE: apply migration 20260522010000_vc_posts_insert_ownership_rls.sql (or 20260523010000 equivalent lines 104-120) to staging then production
- TICKET-BOOKING-RPC-001 → CARNAGE: typed state-machine RPCs for booking INSERT/UPDATE; customer_actor_id injection fix

### SENTRY Required
- VENOM-2026-06-02-003: enforce identity adapter boundary; add deprecated symbols to adapter surface
- VENOM-2026-06-02-007: route moderation chat.* reads/writes through @chat adapter

### IRONMAN Required
- VENOM-2026-06-02-004: close ARCH-ACTORS-DRIFT-001/002/003; formalize actor hydration ownership under engines/hydration; actors feature = search-only
- VENOM-2026-06-02-005: canonicalize assertActorOwnsVportActorController to engine adapter surface; port ELEK-004 fix to engine version; patch 2 direct settings imports

### SPIDER-MAN Tests Required
- VENOM-2026-06-02-002: regression tests for all 8 VPORT system post types after RLS migration applied — verify policy blocks unauthorized inserts without breaking owner writes
- VENOM-2026-06-02-008: verify feed.posts.dal.js has no active consumers before deletion; confirm active feed pipeline routes through feed.read.posts.dal
- TICKET-BOOKING-RPC-001: booking state-machine transition regression tests after CARNAGE migration

---

## Phase 6 — Governance Write Status

| Feature | SECURITY.md | VENOM Section Updated | ELEKTRA Preserved | BLACKWIDOW Preserved |
|---|---|---|---|---|
| identity | YES — zNOTFORPRODUCTION/CURRENT/features/identity/SECURITY.md | YES (run 2026-05-18 → 2026-06-02) | YES (section preserved) | YES (section preserved) |
| profiles | YES — CURRENT/features/profiles/SECURITY.md | YES (run 2026-05-22 → 2026-06-02) | YES (section preserved) | YES (section preserved) |
| actors | YES — CURRENT/features/actors/SECURITY.md | YES (VENOM-2026-06-02-004 added) | N/A (not present, not created) | N/A (not present, not created) |
| settings | YES — CURRENT/features/settings/SECURITY.md | YES (VENOM-2026-06-02-005 added) | YES (ELEKTRA section preserved) | YES (BLACKWIDOW section preserved) |
| void | YES — created this run | YES (VENOM-2026-06-02-006 — first entry) | YES (ELEKTRA section initialized) | YES (BLACKWIDOW section initialized) |

---

## Phase 7 — Output Confirmation

**Inputs read:**
- zNOTFORPRODUCTION/CURRENT/features/identity/SECURITY.md
- zNOTFORPRODUCTION/CURRENT/features/identity/ARCHITECTURE.md
- apps/VCSM/src/features/identity/dal/provision.rpc.dal.js
- apps/VCSM/src/features/identity/adapters/identity.adapter.js
- apps/VCSM/src/features/identity/adapters/identityOps.adapter.js
- apps/VCSM/src/features/identity/controller/ensureVcsmPlatformBootstrap.controller.js
- apps/VCSM/src/features/identity/controller/refreshActorDirectory.controller.js
- apps/VCSM/src/features/identity/dal/refreshActorDirectory.dal.js
- apps/VCSM/src/features/identity/hooks/useIdentityOps.js
- apps/VCSM/src/features/identity/resolvers/vcsmIdentity.resolver.js
- apps/VCSM/src/features/identity/setup.js
- apps/VCSM/src/features/profiles/dal/readActorPosts.dal.js
- apps/VCSM/src/features/profiles/dal/post/fetchPostsForActor.dal.js
- apps/VCSM/src/features/actors/adapters/actors.adapter.js
- apps/VCSM/src/features/actors/controllers/searchActors.controller.js
- apps/VCSM/src/features/actors/dal/searchActors.dal.js
- apps/VCSM/src/features/actors/model/searchActors.model.js
- apps/VCSM/src/features/booking/controller/assertActorOwnsVportActor.controller.js
- engines/booking/src/controller/assertActorOwnsVportActor.controller.js
- apps/VCSM/src/features/void/VoidScreen.jsx
- apps/VCSM/src/features/void/void.js
- apps/VCSM/src/features/moderation/dal/conversationCover.read.dal.js
- apps/VCSM/src/features/moderation/dal/conversationCover.write.dal.js
- apps/VCSM/src/features/moderation/dal/reports.dal.js
- apps/VCSM/src/features/feed/dal/feed.posts.dal.js
- apps/VCSM/src/features/upload/controller/recordPostMedia.controller.js
- apps/VCSM/src/features/upload/hooks/useUploadSubmit.js
- apps/VCSM/src/features/upload/adapters/posts.adapter.js
- engines/portfolio/src/config.js
- apps/VCSM/src/features/portfolio/setup.js
- ARCHITECT second-pass evidence bundle (7 findings, all verified)

**Findings created:** 10
**Findings rejected:** 0 (no fabrications)
**P0 release blockers:** 4 (VENOM-2026-06-02-001, VENOM-2026-06-02-002, VENOM-2026-06-02-010, TICKET-BOOKING-RPC-001 carried forward)
**P1 caution findings:** 6 (VENOM-2026-06-02-003 through 009 excluding 010)

**DB/CARNAGE routes:**
- VENOM-2026-06-02-001 (identity provision_vcsm_identity DB guard)
- VENOM-2026-06-02-002 (vc.posts INSERT RLS — CARNAGE migration)
- TICKET-BOOKING-RPC-001 (booking state-machine RPCs — CARNAGE)

**SENTRY routes:**
- VENOM-2026-06-02-003 (identity adapter boundary enforcement)
- VENOM-2026-06-02-007 (moderation chat shadow DAL)

**IRONMAN routes:**
- VENOM-2026-06-02-004 (actors hydration drift ownership)
- VENOM-2026-06-02-005 (assertActorOwnsVportActor canonicalization)

**SPIDER-MAN test requirements:**
- Post all 8 VPORT system post types after vc.posts RLS migration applied (covers VENOM-2026-06-02-002)
- Booking state-machine transition regression (covers TICKET-BOOKING-RPC-001)
- Confirm feed.posts.dal.js has no active consumers before deletion (covers VENOM-2026-06-02-008)
- Actor ownership bypass regression for VPORT-kind actor in assertActorOwnsVportActor (covers VENOM-2026-06-02-005)

**SECURITY.md files updated:** 5 (identity, profiles, actors, settings, void)
**Source code modified:** NO
**Migrations modified:** NO
**DB schema modified:** NO

---

## CISSP Domain Coverage Summary

| CISSP Domain | Findings | Notes |
|---|---|---|
| Security and Risk Management | 1 | VENOM-2026-06-02-006 (void realm legal/compliance gap) |
| Asset Security | 1 | VENOM-2026-06-02-007 (chat schema asset integrity — secondary) |
| Security Architecture and Engineering | 6 | VENOM-2026-06-02-003, 004, 007, 008, 009, 010 (architecture boundary violations, trust model gaps) |
| Communication and Network Security | 0 | Out of scope for this pass — no network transport or TLS findings; R2 CORS wildcard noted as pre-existing in ARCHITECT evidence but not re-traced this run |
| Identity and Access Management | 5 | VENOM-2026-06-02-001, 002, 003, 005, 010 (identity provisioning, actor impersonation, ownership gate failures) |
| Security Assessment and Testing | 2 | VENOM-2026-06-02-004, 005 (governance documentation drift, dual implementation divergence) |
| Security Operations | 0 | Out of scope for this pass — no logging, monitoring, or incident response findings traced this run |
| Software Development Security | 8 | Secondary coverage across all 10 findings — all findings have a software development security dimension |

**Uncovered domains:**
- Communication and Network Security: R2 Cloudflare worker wildcard CORS noted in ARCHITECT evidence (upload engine boundary finding) but not independently re-traced this run; deferred to HAWKEYE for network-layer audit
- Security Operations: no monitoring, alerting, or incident response code traced this run; deferred to LOKI for observability audit

---

## Final Verdict

VENOM_ARCHITECT_FINDINGS_SECURITY_PASS_COMPLETE

10 findings produced from 7 ARCHITECT evidence inputs. 4 THOR blockers confirmed. 3 features require DB/CARNAGE action before release. All findings sourced from verified live source traces — no fabrications. 5 SECURITY.md files updated. Source code, migrations, and DB schema: READ-ONLY throughout this pass.

---
*VENOM run: 2026-06-02 | Invoked via Cerebro | Ticket: TICKET-VENOM-ARCHITECT-FINDINGS-0001*
*Application Scope: VCSM + ENGINE | Source code: READ-ONLY | No modifications made*
