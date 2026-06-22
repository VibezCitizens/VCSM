# profiles — SECURITY.md

**Source audit:** `CURRENT/features/dashboard/evidence/2026-05-22_venom_profiles-trust-boundaries.md`
**Re-verification audit:** `CURRENT/features/dashboard/evidence/2026-05-23_sentry_profiles-block-reverification.md`
**VENOM audit date:** 2026-05-22
**Overall verdict:** 0 CRITICAL | 5 HIGH | 3 MEDIUM | 1 LOW found. 2 HIGH findings closed via sprint fixes. 3 HIGH + 1 MEDIUM remain OPEN.

---

## Trust Boundary

- Primary boundary: Authenticated Citizen to Authenticated VPORT Owner (write paths)
- Auth source: Supabase session → identity adapter → `useIdentity()` hook
- Authorization layer: Mixed — route guards + controller ownership checks + RLS (inconsistent enforcement confirmed)
- Identity surface: `actorId` + `kind` (correct) — VF-001 `actorId` in URL CLOSED
- Sensitive objects: VPORT rates, services, gas prices, actor_owners, post reactions, private profile content

---

## Findings

### VF-001 — Raw UUID in public URL
**Severity:** HIGH | **Status:** CLOSED
**Location:** `apps/VCSM/src/app/routes/index.jsx` — route `/profile/:actorId`
Route accepted raw `actorId` UUID as URL parameter. Internal UUIDs exposed to analytics, referrers, and search crawlers.
**Fix applied:** `UsernameProfileRedirect.jsx` simplified to pass slug directly; UUID-exposing resolution removed.

---

### VF-002 — Missing controller-level ownership gate on VPORT services upsert
**Severity:** HIGH | **Status:** CLOSED
**Location:** `features/profiles/kinds/vport/controller/services/upsertVportServices.controller.js`
Controller relied solely on RLS for ownership enforcement. Any authenticated Citizen could invoke with any `targetActorId`.
**Fix applied:** `assertActorOwnsVportActorController(identityActorId, targetActorId)` added before all writes.

---

### VF-003 — Hollow ownership check controller (business logic in DAL)
**Severity:** HIGH | **Status:** OPEN
**Location:** `apps/VCSM/src/features/profiles/controller/checkActorOwnership.controller.js`
Controller is a pass-through to `checkActorOwnershipDAL`. Ownership check business logic lives in DAL, not controller. If DAL query changes, ownership check may silently break with no controller-layer defense.
**Blast radius:** All callers of `checkActorOwnershipController` — currently `useIsActorOwner.js` hook.
**Recommended mitigation:** Move ownership check logic into controller. DAL should only fetch the `actor_owners` row.

---

### VF-004 — Client-side-only profile privacy gate
**Severity:** HIGH | **Status:** OPEN
**Location:** `apps/VCSM/src/features/profiles/hooks/useProfileGate.js`
Gate logic (`useActorPrivacy`, `useFollowStatus`, `useBlockStatus`) runs entirely in React. Browser devtools manipulation can bypass gate. Server-side RLS on `vc.posts` for privacy/follow enforcement is UNVERIFIED.
**RLS dependency:** REQUIRED — client gate is insufficient alone; UNVERIFIED.
**Recommended mitigation:** Verify RLS on `vc.posts` enforces `actor_privacy` and `actor_follows` server-side. Add server-side controller validation before returning post data.

---

### VF-005 — Debug component imported in production screen
**Severity:** HIGH | **Status:** OPEN
**Location:** `apps/VCSM/src/features/profiles/screens/ActorProfileScreen.jsx`
Screen imports `ActorProfileDevProbe` and `ActorProfileProdDebugPanel`. Both are bundled into production build regardless of render guard. `ActorProfileProdDebugPanel` name explicitly suggests production intent.
**Recommended mitigation:** Move all debug components to `zNOTFORPRODUCTION/debuggers/` per debugger architecture pattern. Verify render guard.

---

### VF-006 — Over-broad cross-schema read in fetchPostsForActor DAL (MEDIUM)
**Severity:** MEDIUM | **Status:** OPEN
**Location:** `apps/VCSM/src/features/profiles/dal/post/fetchPostsForActor.dal.js`
Single DAL method reads 6 tables/schemas (`vc.posts`, `vc.post_media`, `vc.post_mentions`, `vc.actors`, `public.profiles`, `vport.profiles`). Mention resolution reads profile display data for every mentioned actor. No caller identity check in DAL.
**Recommended mitigation:** Separate mention resolution from post fetch. Verify private/deleted actor display data is excluded by RLS.

---

### DR-001 — vc.posts INSERT RLS gap (CRITICAL — pre-existing, DB-blocked)
**Severity:** CRITICAL (pre-existing) | **Status:** OPEN — migration pending staging
**Source:** DB audit 2026-05-22
Any authenticated user can INSERT a post as any actor via direct Supabase API call. Application-layer guards added but DB-level enforcement absent.
**Migration:** `20260522010000_vc_posts_insert_ownership_rls.sql` — endorsed by CARNAGE; PENDING staging.

---

## Security Paths Verified (VENOM 2026-05-22 + SENTRY 2026-05-23)

| Path | Status |
|---|---|
| upsertVportServices ownership gate | CLOSED (VF-002 fix applied) |
| UsernameProfileRedirect UUID exposure | CLOSED (VF-001 fix applied) |
| getActorPosts.controller.js layer inversion | CLOSED (SF-001 fix applied, SENTRY re-verified) |
| upsertVportRate ownership gate | VERIFIED — already correct prior to sprint |
| checkActorOwnership controller hollow pass-through | OPEN — VF-003 |
| useProfileGate client-side-only privacy | OPEN — VF-004 |
| ActorProfileProdDebugPanel in production screen | OPEN — VF-005 |
| fetchPostsForActor cross-schema overfetch | OPEN — VF-006 |
| vc.posts INSERT RLS gap | OPEN — DR-001 (migration pending) |

---

## VENOM STATUS

**VENOM Last Run:** 2026-06-02
**VENOM Status:** PARTIAL (RLS gap requires DB/CARNAGE; prior findings carried forward)
**Highest Open Severity:** CRITICAL
**THOR Release Blocker:** YES — VENOM-2026-06-02-002

---

### VENOM-2026-06-02-001 — Identity Provisioning RPC: Missing DB-Side Session Guard (CRITICAL / PLAUSIBLE_DB_SIDE)
**Category:** VF-01 | **Severity:** CRITICAL | **Feature:** identity
**Caller Surface:** `useIdentityResolutionEffect` (self-heal), `useAuthOnboarding` (onboarding), `useJoinBarbershop` (invite) — all three reach `dalProvisionVcsmIdentity` through `ensureVcsmPlatformBootstrap`
**DAL:** `/apps/VCSM/src/features/identity/dal/provision.rpc.dal.js` — `dalProvisionVcsmIdentity({ userId, actorId })`
**DB Function:** `platform.provision_vcsm_identity` (SECURITY DEFINER)
**Auth guard at JS layer:** YES — all three JS call paths bind `userId` to the authenticated session before passing to provision
**DB guard verifiable from JS:** NO
**Failure mode:** If `platform.provision_vcsm_identity` lacks an `auth.uid() = p_user_id` assertion in its body, any authenticated user can call the RPC directly via PostgREST with an arbitrary `p_user_id` and provision `platform.user_app_access`, `platform.user_app_accounts`, `platform.user_app_preferences`, `platform.user_app_state`, `platform.user_app_actor_links`, and `vc.actors.user_app_account_id` rows for a victim user. This poisons the victim's identity state, hijacks their actor link, or creates a ghost account shadow that intercepts their next login resolution.
**Attack preconditions:** Valid Supabase session (any authenticated user) + known victim `auth.users.id` UUID + known `vc.actors.id` UUID to link + DB function body lacks `auth.uid()` guard
**Exploitability:** HIGH
**Blast radius:** `platform.user_app_access`, `platform.user_app_accounts`, `platform.user_app_actor_links`, `vc.actors.user_app_account_id` — all features consuming actor-scoped ownership inherit the poisoned identity
**RLS Dependency:** REQUIRED
**Confidence:** PLAUSIBLE_DB_SIDE — migration 20260518040000 status unknown; DB body not verifiable from JS
**Recommended fix:** Add as first statement in `platform.provision_vcsm_identity` body: `IF auth.uid() IS NULL OR auth.uid() != p_user_id THEN RAISE EXCEPTION 'permission denied: caller does not own this user identity'; END IF;` — before any INSERT/UPSERT. Additionally REVOKE on the anon role for this function.
**Follow-up:** DB (audit migration 20260518040000)
**THOR Blocker:** YES
**CISSP:** Identity and Access Management / Software Development Security / Access Control

---

### VENOM-2026-06-02-002 — DR-001: vc.posts INSERT RLS Gap (CRITICAL / OPEN)
**Category:** DR-001 | **Severity:** CRITICAL | **Feature:** profiles
Carried finding from ARCHITECT DR-001, now CONFIRMED by VENOM source trace.
- **Write path:** post-creation hook → controller → DAL → `vc.posts` INSERT
- **actor_id passed to INSERT:** YES (caller-controlled `actorId` in DAL params)
- **Ownership check against `vc.actor_owners` before INSERT:** ABSENT at DB layer
- **posts_insert_actor_owner RLS policy:** ABSENT on live DB — migration `20260522010000_vc_posts_insert_ownership_rls.sql` and `20260523010000_backfill_tracked_rls_coverage.sql` define the correct WITH CHECK policy but are PENDING STAGING
- **Write DAL:** `/apps/VCSM/src/features/upload/dal/insertPost.dal.js`
- **actor_id source:** caller-controlled — `actorId` is a prop passed from parent screen; not derived from session at DAL layer
- **Ownership check layer:** controller only (`assertActorOwnsVportActorController`) — entirely absent at DB/RLS layer until migration is applied
- **Attack:** Authenticated user who knows any VPORT actor UUID can INSERT a post attributed to that actor via direct PostgREST request with valid session token, bypassing the JS controller guard entirely. Applies to all 8 system `post_type` values: `exchange_rate_update`, `barbershop_hours_update`, `barbershop_portfolio_update`, `locksmith_hours_update`, `locksmith_portfolio_update`, `locksmith_service_area_update`, `locksmith_service_details_update`, `menu_update`
- **Exploitability:** HIGH — any authenticated Citizen + known target actor UUID; one HTTP request; no special privileges required
- **Blast radius:** Any VPORT actor on the platform — feed contamination, false attribution, actor impersonation, reputation damage
- **RLS Dependency:** REQUIRED AND ABSENT — `posts_insert_actor_owner WITH CHECK EXISTS (SELECT 1 FROM vc.actor_owners ao WHERE ao.actor_id = posts.actor_id AND ao.user_id = auth.uid())` defined but not applied to live DB
- **Required fix:** (1) Apply CARNAGE migration `20260522010000` / `20260523010000` to staging then production immediately; (2) Add ownership verification in `createSystemPost` (posts.adapter.js) by querying `actor_owners` before calling `insertPost`; (3) Add server-side ownership check in `createPostController` for user-authored post path; (4) Run SPIDER-MAN regression across all 8 vport system post types post-migration
- **Follow-up:** CARNAGE (RLS migration), DB (policy verification), SPIDER-MAN (regression test)
- **THOR Blocker:** YES — CRITICAL OPEN — impersonation attack on VPORT feed attribution

---

### VENOM-2026-06-02-003 — Identity Adapter Bypass: 64 Direct Context Imports (HIGH / CONFIRMED)
**Category:** ADAPTER-BYPASS | **Severity:** HIGH | **Feature:** identity
**Bypass via:** Direct import from `@/state/identity/identityContext` bypassing `identity.adapter.js`; consumers of `useIdentityDisplayDeprecated` and `useIdentityDetailsDeprecated` defined in `identityContext.jsx` but never exported on the adapter surface
**Bypass count:** 64 direct context importers vs. 47 adapter consumers
**Failure mode:** Stale identity detail snapshots may show mismatched actor names/avatars after actor switch, creating UI-layer ownership confusion where actions are scoped to the switched actor but display reflects the prior actor. Silent breakage risk if identityContext internals are refactored.
**Exploitability:** MEDIUM | **Confidence:** CONFIRMED
**Blast radius:** settings, post, dashboard/vport (12+ cards), profiles/kinds/vport, upload, chat/inbox, block, notifications, ads, layout, routes, learning/layout
**RLS Dependency:** NONE
**Recommended fix:** (1) Export deprecated hooks through `identity.adapter.js`; (2) Migrate all 64 direct importers to adapter boundary; (3) Seal `identityContext.jsx` as non-importable internal
**Follow-up:** SENTRY | **THOR Blocker:** NO

---

### VENOM-2026-06-02-004 — Actors Feature Documentation Drift: 3 Phantom Files (HIGH / CONFIRMED)
**Category:** ARCH-ACTORS-DRIFT | **Severity:** HIGH | **Feature:** actors
**Missing files:** `actors/controllers/hydrateActors.controller.js`, `actors/dal/getActorSummariesByIds.dal.js`, `actors/model/extractActorIdsForHydration.model.js` — replaced by `engines/hydration/src/` but governance docs still reference deleted paths
**Governance gap:** ARCH-ACTORS-DRIFT-001/002/003 open with no remediation ticket or owner. 6 feature files import hydration via `@/state/actors/hydrateActors` shim instead of `@hydration` directly.
**Failure mode:** Security audits that reference prior documentation will model a hydration trust boundary that no longer exists at the feature layer. Static analysis tools and future auditors cannot trace the real engine path.
**Exploitability:** LOW | **Confidence:** CONFIRMED
**Recommended fix:** Close ARCH-ACTORS-DRIFT items, update feature-map.md + vcsm-engine-consumer-map.md, migrate 6 shim callers to `@hydration`, assign IRONMAN ownership ticket
**Follow-up:** IRONMAN | **THOR Blocker:** NO

---

### VENOM-2026-06-02-005 — assertActorOwnsVportActor: Two Implementations Diverge; Engine Version Pre-ELEK-004 (HIGH / CONFIRMED)
**Category:** CROSS-FEATURE-OWNERSHIP | **Severity:** HIGH | **Feature:** booking/cross-feature
**Two implementations:** `apps/VCSM/src/features/booking/controller/` (post-ELEK-004 fix) vs. `engines/booking/src/controller/` (pre-fix, self-shortcut fires before kind check)
**Direct controller imports in settings:** `vportBusinessCardSettings.controller.js`, `vportSocialSettings.controller.js` — bypass booking adapter
**Failure mode:** Engine version applies `requestActorId === targetActorId` self-shortcut BEFORE kind check — a VPORT-kind actor with matching UUID returns `{ok:true,mode:'self'}` without hitting `actor_owners` DB check. Consumers resolving to engine version receive pre-fix logic.
**Exploitability:** MEDIUM | **Consumer count:** ~45 across settings, profiles, dashboard, join, booking-internal
**Blast radius:** Booking owner actions, schedule operations, settings mutations, profile mutations, join flow operations
**RLS Dependency:** NONE
**Recommended fix:** (1) Port ELEK-004 fix into engine version immediately; (2) Move to single canonical implementation on engine adapter surface; (3) Patch two direct imports in settings controllers to use adapter path
**Follow-up:** IRONMAN | **THOR Blocker:** NO

---

### VENOM-2026-06-02-006 — /void Route Live Without Age Gate or Feature Flag (MEDIUM / CONFIRMED)
**Category:** UNGUARDED-ROUTE | **Severity:** MEDIUM | **Feature:** void
**Route:** `/void` registered at `app.routes.jsx:161` inside `ProtectedRoute` tree — reachable by any authenticated user who has accepted platform ToS; no age gate; no feature flag
**Current exposure:** Scaffold placeholder only — `VoidScreen.jsx` has no business logic or data access
**Failure mode:** No `AgeGate` component exists anywhere in the codebase. When real void content is wired, the absence of an age gate is a P0 violation given that Void is the planned 18+ anonymous realm.
**Exploitability:** LOW now; rises to HIGH when real content ships
**Blast radius:** 18+ content accessible to minors once wired; DB-tracked anonymous identity issued to unverified-age users; platform legal liability
**Recommended fix:** (1) Wrap /void in `releaseFlags.voidRealm` feature flag immediately; (2) Design `AgeGateScreen` before any real void content ships; (3) Add void-specific consent gate separate from platform ToS
**Follow-up:** WOLVERINE | **THOR Blocker:** NO

---

### VENOM-2026-06-02-007 — moderation Shadow DAL Against chat.* Schema (MEDIUM / CONFIRMED)
**Category:** ENGINE-BOUNDARY-VIOLATION | **Severity:** MEDIUM | **Engine:** engines/chat
**Files:** `moderation/dal/conversationCover.read.dal.js`, `moderation/dal/conversationCover.write.dal.js`, `moderation/dal/reports.dal.js`
**Failure mode:** moderation DAL files issue raw `supabase.schema('chat')` queries against `chat.messages` and `chat.inbox_entries` without routing through `engines/chat`. Two independent write paths into the chat schema with no shared ownership gate, no outbox event emission, no idempotency guarantees.
**Exploitability:** LOW | **Confidence:** CONFIRMED
**Recommended fix:** Route all moderation reads/writes against `chat.*` tables through `@chat` adapter functions
**Follow-up:** SENTRY | **THOR Blocker:** NO

---

### VENOM-2026-06-02-008 — feed.posts.dal.js Imports @hydration at DAL Layer (LOW / CONFIRMED)
**Category:** LAYER-CONTRACT-VIOLATION | **Severity:** LOW | **Engine:** engines/hydration
**File:** `apps/VCSM/src/features/feed/dal/feed.posts.dal.js`
**Failure mode:** DAL imports `hydrateAndReturnSummaries` from `@hydration` — DALs must be dumb DB adapters; engine consumption must flow through a controller. Misconfigured-client error (not a clean auth failure) if hydration engine not yet configured at call time.
**Exploitability:** LOW | **Confidence:** CONFIRMED
**Recommended fix:** Delete `feed.posts.dal.js` (legacy per its own comment) or move hydration call to a controller wrapper
**Follow-up:** SPIDER-MAN | **THOR Blocker:** NO

---

### VENOM-2026-06-02-009 — engines/media uploadMediaController: 7+ Direct Engine Barrel Imports (MEDIUM / CONFIRMED)
**Category:** ENGINE-BOUNDARY-VIOLATION | **Severity:** MEDIUM | **Engine:** engines/media
**Files:** `upload/api/uploadMedia.js`, `settings/profile/hooks/useProfileUploads.js`, `vport/controller/submitCreateVport.controller.js`, `dashboard/flyerBuilder/controller/flyerEditor.controller.js`, `dashboard/flyerBuilder/designStudio/controller/designStudio.assetsExports.controller.js`, `wanders/core/controllers/publishWandersFromBuilder.controller.js`, `wanders/core/controllers/cards.controller.js`
**Failure mode:** 7+ files across features bypass the upload feature adapter and import `uploadMediaController` directly from `@media` engine barrel. No single choke point for signature changes or access auditing.
**Exploitability:** LOW | **Confidence:** CONFIRMED
**Recommended fix:** Centralize all `uploadMediaController` calls behind `upload.adapter.js`; all non-media features must use upload adapter
**Follow-up:** HAWKEYE | **THOR Blocker:** NO

---

### VENOM-2026-06-02-010 — engines/portfolio isActorOwner Throws on Unconfigured Singleton (HIGH / CONFIRMED)
**Category:** TRUST-BOUNDARY-WEAKNESS | **Severity:** HIGH | **Engine:** engines/portfolio
**Files:** `engines/portfolio/src/config.js`, `apps/VCSM/src/features/portfolio/setup.js`, portfolio dashboard screen + controllers
**Failure mode:** `isActorOwner()` throws `'[PortfolioEngine] isActorOwner not configured.'` if called before `setupVcsmPortfolioEngine()` completes (hot-module reload, test harness, SSR). A thrown error in an authorization guard is not a safe failure — it breaks the request without producing a structured `{ok:false}` result. Additionally, the injected `isActorOwner` in `setup.js` relies entirely on `actor_owners_read_own` RLS policy; if that policy is absent/misconfigured (TICKET-PLATFORM-RLS-001), the ownership check silently passes.
**Exploitability:** MEDIUM | **Confidence:** CONFIRMED
**Blast radius:** All 5 portfolio write controllers: createItem, updateItem, deleteItem, addMedia, manageTags
**RLS Dependency:** Partially — relies on `actor_owners_read_own` RLS; defense-in-depth `.eq('user_id', session.user.id)` filter absent
**Recommended fix:** (1) Return `false` (not throw) when `isActorOwner` is not configured; (2) Add explicit `.eq('user_id', session.user.id)` filter in `setup.js` lambda; (3) Add startup assertion before React tree renders; (4) Audit all 5 write controllers confirm `isActorOwner()` called before any DAL mutation
**Follow-up:** ELEKTRA | **THOR Blocker:** YES

---

### Carried Forward High-Severity Findings (from 2026-05-22 VENOM pass)
- **VF-003 (HIGH OPEN):** hollow ownership controller — privacy gate enforced client-side only
- **VF-004 (HIGH OPEN):** private profile bypass — privacy gate client-side only
- **VF-005 (HIGH OPEN):** ActorProfileProdDebugPanel bundled in production

See prior VENOM evidence at `CURRENT/features/dashboard/evidence/2026-05-22_venom_profiles-trust-boundaries.md` for full detail.

---

## Updated Security Paths (VENOM 2026-06-02)

| Finding | Status | THOR Blocker |
|---|---|---|
| VENOM-2026-06-02-001 identity provisioning RPC DB guard | OPEN — PLAUSIBLE_DB_SIDE | YES |
| VENOM-2026-06-02-002 vc.posts INSERT RLS gap (DR-001) | OPEN — migration pending staging | YES |
| VENOM-2026-06-02-003 identity adapter bypass (64 consumers) | OPEN | NO |
| VENOM-2026-06-02-004 actors documentation drift (3 phantom files) | OPEN | NO |
| VENOM-2026-06-02-005 assertActorOwnsVportActor dual impl divergence | OPEN | NO |
| VENOM-2026-06-02-006 /void route no age gate or feature flag | OPEN | NO |
| VENOM-2026-06-02-007 moderation shadow DAL against chat.* | OPEN | NO |
| VENOM-2026-06-02-008 feed.posts.dal.js @hydration at DAL layer | OPEN | NO |
| VENOM-2026-06-02-009 engines/media 7+ direct barrel imports | OPEN | NO |
| VENOM-2026-06-02-010 portfolio isActorOwner throws on unconfigured | OPEN | YES |

---

## BLACKWIDOW STATUS
BLACKWIDOW Last Run: 2026-06-02
BLACKWIDOW Status: PARTIAL (RLS verification requires CARNAGE migration; ownership bypass confirmed at JS/DAL layer)

### BW-PROFILES-001 — vc.posts INSERT Ownership Bypass (CRITICAL / VERIFIED)
- Attack scenario: Authenticated attacker knows target VPORT actor UUID; calls insertPost.dal.js (or direct PostgREST POST /rest/v1/posts) with actor_id = victim UUID and a valid barbershop system post payload
- insertPost.dal.js ownership check: ABSENT — no ownership verification in DAL method body
- posts.adapter.js (createSystemPost): routes through assertActorOwnsVportActorController at controller layer ONLY — bypassable via direct PostgREST
- RLS policy posts_insert_actor_owner WITH CHECK: PENDING STAGING (migration 20260522010000) — not applied to live DB
- Exploit chain: Injection exploit — caller-supplied actor_id accepted without DAL-layer ownership check; DB policy unenforced
- Defense gate: ABSENT on DB layer; PRESENT at JS controller layer only (bypassable)
- Result: BYPASSED — ownership protection is documentation-only at DB layer until migration applied
- Governance status: VERIFIED (JS call chain confirmed; DB gap confirmed by ARCHITECT)
- THOR blocker: YES — CRITICAL OPEN — content injection under arbitrary VPORT identity possible on live platform
- Required fix: (1) Apply migration 20260522010000 to production immediately; (2) Add ownership assertion in createSystemPost and createPostController before DAL call
- Follow-up: CARNAGE (migration), SPIDER-MAN (regression)
