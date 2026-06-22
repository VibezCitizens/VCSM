# BLACKWIDOW Runtime Adversarial Report

**Date:** 2026-05-14
**Scope:** VCSM
**Reviewer:** BLACKWIDOW
**Branch:** vport-booking-feed-security-updates
**Environment:** Source Code Adversarial Simulation (READ-ONLY)
**Governance Status:** DRAFT

---

## Attack Surface Summary

Seven adversarial scenarios were executed against the VCSM app at `apps/VCSM/src/features/`. All files were read directly — no assumptions were made from memory or prior sessions. The analysis covers booking ownership, auth callback replay, actor search enumeration, viewer context fuzzing, URL surface UUID exposure, cross-actor ownership gates, and the VPORT feed security changes on the current branch.

---

## Simulated Threat Scenarios

---

### SCENARIO 1 — Booking Ownership Replay

**Files read:**
- `apps/VCSM/src/features/booking/controller/cancelBooking.controller.js`
- `apps/VCSM/src/features/booking/controller/confirmBooking.controller.js`
- `apps/VCSM/src/features/booking/controller/createBooking.controller.js`
- `apps/VCSM/src/features/booking/controller/assertActorOwnsVportActor.controller.js`
- `apps/VCSM/src/features/booking/dal/updateBookingStatus.dal.js`
- `apps/VCSM/src/features/booking/dal/readActorOwnerLinkByActorAndUserProfile.dal.js`
- `apps/VCSM/src/features/dashboard/vport/controller/updateVportBooking.controller.js`

**Finding:** BLOCKED

**Evidence:**

`cancelBookingController` fetches the booking by ID from the DB first, then resolves the resource's `owner_actor_id` from DB, then calls `assertActorOwnsVportActorController` — which in turn queries `vc.actor_owners` to verify the requester's `profile_id` is linked to the target actor. There is no path where `actorId` or `ownerActorId` is accepted from the client payload as authority.

`confirmBookingController` follows the same pattern unconditionally — ownership assertion runs before any status mutation.

`createBookingController` enforces source-based branching: management sources (`owner`, `admin`, `import`, `sync`) require ownership assertion; public source requires `kind === "user"` check. `durationMinutes` is clamped to a hard ceiling of 1440 minutes. Slot start time is validated against `Date.now()` — past slots are rejected.

`updateBookingStatusController` (dashboard): resolves `vportActorId` from `booking.profile_id` (from DB), not from client. Customer-path allows only `cancelled` status. Owner path calls `assertActorOwnsVportActorController` before any mutation.

`assertActorOwnsVportActorController` does a two-step DB read:
1. Fetches requester actor by ID to confirm `kind === "user"` and extract `profile_id`
2. Queries `vc.actor_owners` by `(actor_id = targetActorId, user_id = requesterProfileId)` — if row is missing or `is_void = true`, throws

**Severity:** INFO — ownership chain is fully enforced. No bypass path found at the controller layer.

**Notes:**
- `updateBookingStatusDAL` does not filter by `actor_id` in the `.update()` call — it updates by `bookingId` only. Ownership enforcement lives exclusively in the controller. If the controller gate is bypassed (e.g., via a direct DAL import from outside the feature), the DAL has no secondary gate. This is architectural discipline risk, not an active exploit.

---

### SCENARIO 2 — Auth Callback Replay

**Files read:**
- `apps/VCSM/src/features/auth/controllers/authCallback.controller.js`
- `apps/VCSM/src/features/auth/controllers/setNewPassword.controller.js`
- `apps/VCSM/src/features/auth/dal/authCallback.dal.js`
- `apps/VCSM/src/features/auth/dal/resetPassword.dal.js`
- `apps/VCSM/src/features/auth/dal/authSession.read.dal.js`

**Finding:** BLOCKED (Supabase-enforced single-use) with one PARTIAL concern

**Evidence:**

PKCE code exchange: `dalExchangeCodeForSession(code)` calls `supabase.auth.exchangeCodeForSession(code)`. Supabase PKCE codes are single-use server-side — replaying a consumed code returns an error, which is caught and surfaces as a user-facing "expired or already used" message with no implementation detail leaked.

Recovery flow: `resolveRecoverySessionController` exchanges `?code=` via `dalExchangeRecoveryCode` then falls back to `dalGetAuthSession()` if the exchange fails. The comment explicitly notes `detectSessionInUrl may have consumed the code first` — this is a sound fallback, not a replay vector.

Hash-type validation: `resolveAuthCallbackController` detects `hashType === 'recovery'` from URL hash, but the comment reads: `hashType is attacker-controllable — verify an actual session exists before redirecting`. The code correctly calls `dalGetAuthSession()` before resolving as recovery — it does not trust the hash type value alone. This is properly defended.

Error string isolation: In production (`import.meta.env.DEV` is false), `errorDescription` from URL params is discarded. The fixed string `'Verification failed. Please try again or request a new link.'` is returned — attacker-supplied error text cannot be surfaced.

**PARTIAL concern:** `setNewPassword.controller.js` / `updatePasswordController` calls `dalUpdateUserPassword(password)` then `dalSignOutRecoverySession()`. If `dalSignOutRecoverySession` fails (network error), the recovery session remains active. A replay of the password update would be blocked by Supabase (same password, already changed), but the session token remains live until expiry. This is a low-severity session persistence risk, not an authentication bypass.

**Severity:** LOW — no auth replay bypass path at the controller or DAL layer. Single-use enforcement delegated to Supabase correctly. Recovery session sign-out failure is not fatal but worth making fail-safe.

---

### SCENARIO 3 — Search / Explore Abuse (Actor Enumeration)

**Files read:**
- `apps/VCSM/src/features/actors/controllers/searchActors.controller.js`
- `apps/VCSM/src/features/actors/dal/searchActors.dal.js`
- `apps/VCSM/src/features/actors/model/searchActors.model.js`

**Finding:** PARTIAL

**Evidence:**

`searchActors` controller accepts `viewerActorId = null` silently. It passes `p_viewer_actor_id: viewerActorId` to the Supabase RPC `identity.search_actor_directory`. The null is passed through to the database function.

The controller itself performs zero visibility gating. There is no application-layer check that filters blocked, deactivated, or hidden actors before returning results.

All visibility protection is delegated entirely to the DB function `identity.search_actor_directory`. If the DB function correctly handles `p_viewer_actor_id = null` (returning only public-realm, non-deactivated actors) then this is safe. If it does not enforce null-viewer restrictions or does not filter deactivated actors, actor enumeration is possible.

The mapped model exposes: `actorId`, `kind`, `displayName`, `username`, `avatarUrl`. Username is included in search results — this enables actor enumeration by predictable username substring patterns.

**Risk:** The application layer provides no secondary control. Trust is placed entirely in the DB-side function behavior. Without being able to read the RPC implementation directly (it lives in the DB schema, not in source), the application-side posture is "assumed safe pending DB verification."

**Severity:** MEDIUM — controller-layer visibility gating is absent. Null viewer is accepted without application-level downgrade. All protection depends on unverified DB function behavior.

---

### SCENARIO 4 — Viewer Context Fuzzing

**Files read:**
All controllers across `apps/VCSM/src/features/` — selective deep reads of mutation controllers.

**Finding:** PARTIAL

**Evidence:**

Booking controllers: null `requestActorId` throws immediately. Properly guarded.

Feed pipeline: `fetchFeedPagePipeline` accepts `viewerActorId = null`. When null:
- `readHiddenPostsForViewer({ viewerActorId: null, ... })` — behavior depends on DAL
- `readFeedBlockRowsDAL({ viewerActorId: null, ... })` — `buildBlockedActorSetModel` returns an empty Set when `viewerActorId` is null, meaning no blocked actors are filtered
- Private-account posts: `canViewPrivateFeedActorModel` returns `true` when `!isPrivate` — public actor posts are visible. Private actor posts: `isOwner` will be `false` (null !== actorId), so private posts are blocked correctly

Feed visibility model is correctly resilient to null viewer — private posts are not exposed, blocked actors are not filtered (but that is expected behavior for unauthenticated callers).

`listActorPosts` controller throws `new Error("Missing viewerActorId")` — protected.

`searchActors` controller: passes null through to DB RPC without application-level guard (see Scenario 3).

`getFeedViewerIsAdult({ viewerActorId: null })`: returns `null` early — no crash, no false-positive adult gate bypass.

Moderation controllers: `assertModerationAccessController(null)` throws `FORBIDDEN` immediately.

**Severity:** LOW — feed pipeline handles null viewer gracefully without unauthorized data exposure. One gap is the search controller's silent null pass-through.

---

### SCENARIO 5 — URL Surface (UUID Exposure)

**Files read:**
- `apps/VCSM/src/app/routes/protected/app.routes.jsx`
- `apps/VCSM/src/app/routes/public/vportMenu.routes.jsx`
- `apps/VCSM/src/app/routes/protected/appRoutes.redirects.jsx`
- All notification `linkPath` values across booking, post, social, and dashboard controllers

**Finding:** PARTIAL — UUID exposure present in internal notification linkPaths; public routes use slugs where specified

**Evidence:**

**Public routes:** `vportMenuPublicRoutes` uses `/profile/:slug/menu`, `/profile/:slug/reviews` — slug-based, clean.

**Protected routes exposing raw actorId in path:**
```
/profile/:actorId
/actor/:actorId/gas
/actor/:actorId/dashboard
/actor/:actorId/dashboard/*
/actor/:actorId/settings
/ads/vport/:actorId
/profile/:id/friends/top/edit
/posts/:postId
/post/:postId
/noti/post/:postId
/chat/:conversationId
```

These params are named `:actorId`, `:postId`, `:conversationId` — the actual values passed are raw UUIDs. An authenticated user navigating to `/profile/<uuid>` or `/actor/<uuid>/dashboard` exposes raw internal IDs in the browser URL bar and browser history.

**Notification linkPaths with raw UUIDs:**
- `cancelBooking`: `/actor/${resource.owner_actor_id}/dashboard/booking-history` — raw actorId UUID
- `createBooking`: `/actor/${resource.owner_actor_id}/dashboard/booking-history` — raw actorId UUID
- `confirmBooking`: `/profile/${resource.owner_actor_id}?tab=book` — raw actorId UUID
- `vportPublicBooking`: `/actor/${vportActorId}/dashboard/booking-history` — raw actorId UUID
- `vportTeam`: `/actor/${barberVportActorId}/dashboard/team-requests` — raw actorId UUID
- `VportReviews`: `/actor/${targetActorId}/dashboard/reviews` — raw actorId UUID
- `vportBusinessCard`: `/actor/${recipientActorId}/dashboard/leads` — raw actorId UUID
- Social follow: `/profile/${followerActorId}` and `/profile/${targetActorId}` — raw actorId UUIDs
- Post notifications: `/post/${postId}` — raw postId UUIDs

**Severity:** MEDIUM — raw UUIDs appear in both route paths and notification linkPaths. This violates the Memory rule (`feedback_no_raw_ids_in_urls.md`): "Raw UUIDs must never appear in public-facing URLs — always use human-readable slugs." The dashboard routes are gated (authenticated), but the linkPaths sent through notifications land on routes that expose raw UUIDs in the URL. An actor's internal actorId is exposed through their notification deep links, allowing actor correlation through notification context.

---

### SCENARIO 6 — Cross-Actor Ownership Gates

**Files read:**
All mutation controllers across `apps/VCSM/src/features/`.

**Finding:** PARTIAL — most mutation controllers gated; three categories rely on RLS-only ownership

**Evidence:**

**GATED (BLOCKED) — explicit ownership assertion before mutation:**
- All booking controllers (cancel, confirm, create, setAvailabilityRule, setAvailabilityException, setResourceSlotDuration, ensureOwnerBookingResource)
- All dashboard vport mutation controllers (updateVportBooking, rescheduleBooking, vportTeam, vportTeamAccess, vportTeamInvite, createOwnerBooking, listVportBookingHistory, saveVportPublicDetailsByActorId)
- Post delete/edit: ownership enforced at DAL layer via `.eq("actor_id", actorId)` in the update/delete query — DB-side, not RLS policy but query predicate
- Comment delete/edit: same pattern
- Content page controllers: read-then-verify `existing.actor_id !== actorId` before mutation
- Menu item/category save controllers: read-then-verify `category.actor_id !== actorId` before item mutation
- Moderation: `assertModerationAccessController` runs before any moderation write

**RLS-ONLY (PARTIAL) — no application-layer ownership assertion:**

1. `upsertVportServicesController` — comment: "Ownership enforced by RLS". No `assertActorOwns` call. `targetActorId` is accepted from caller. If RLS policy on the vport services table is misconfigured, any authenticated actor could overwrite another actor's service catalog.

2. `createOrUpdateVportServiceAddonController` — comment: "Ownership enforced by RLS (DB is source of truth)". Controller accepts `targetActorId` from caller.

3. `deleteVportServiceAddonController` — same pattern. Comment: "RLS must allow delete only for owners of targetActorId."

4. `deleteVportActorMenuItemController` — accepts `actorId` param but does NOT read the item first to verify `item.actor_id === actorId`. Calls `deleteVportActorMenuItemDAL({ itemId })` with no actor_id filter in the DAL call. Comment: "DB should only allow deleting items the current user/actor owns." This is entirely RLS-dependent.

5. `deleteVportActorMenuCategoryController` — same pattern. No pre-read ownership check. `deleteVportActorMenuCategoryDAL({ categoryId })` has no actor scope.

6. `upsertVportRateController` — accepts `identityActorId` as a parameter and immediately discards it with `void _identityActorId`. Ownership is not asserted. Calls DAL directly with `actorId`.

7. `locksmithOwner.controller.js` — `ctrlUpdateServiceArea(areaId, updates)` and `ctrlDeleteServiceArea(areaId)` accept only an `areaId` with no caller actor verification. No ownership check of any kind at the controller layer. `ctrlDeleteServiceDetail(serviceId)` takes only a `serviceId`. Entirely RLS-dependent.

**Severity:** HIGH (for the menu delete, locksmith delete, and rate upsert cases) — the controller accepts a mutation instruction with no application-layer ownership verification, and the comment documents that the only protection is unverified RLS policy. If RLS is misconfigured on any of those tables, an authenticated actor can delete another actor's menu items, service areas, service details, or overwrite their rates. The application layer has no backstop.

---

### SCENARIO 7 — VPORT Feed Security (Branch Changes)

**Files read:**
- `apps/VCSM/src/features/feed/controllers/getFeedViewerContext.controller.js`
- `apps/VCSM/src/features/feed/controllers/listActorPosts.controller.js`
- `apps/VCSM/src/features/feed/dal/feed.read.posts.dal.js`
- `apps/VCSM/src/features/feed/dal/listActorPostsByActor.dal.js`
- `apps/VCSM/src/features/feed/pipeline/fetchFeedPage.pipeline.js`
- `apps/VCSM/src/features/feed/model/feedRowVisibility.model.js`
- `apps/VCSM/src/features/feed/model/feedBlockVisibility.model.js`
- `apps/VCSM/src/features/feed/model/feedPrivateVisibility.model.js`

**Finding:** BLOCKED — feed read path has no mutations; visibility model correctly enforces privacy and block rules

**Evidence:**

The feed feature is read-only. There are no mutation controllers in `apps/VCSM/src/features/feed/`. The feed pipeline fetches posts, applies visibility filtering client-side, and returns normalized rows.

`resolveFeedRowVisibilityModel` applies a correct cascade:
1. Block check first — blocked actors' posts are suppressed
2. Missing actor → invisible
3. VPORT actors: check `is_active !== false && is_deleted !== true`
4. User actors: `canViewPrivateFeedActorModel` — private profile + not following + not owner → invisible

`readFeedPostsPage` uses Supabase client with authenticated session — RLS on `vc.posts` governs what rows are returned at the DB layer. Application-layer visibility filtering is a secondary control.

`listActorPosts` controller throws `new Error("Missing viewerActorId")` — null viewer is explicitly rejected.

`readFeedPostsPage` does not have a `viewerActorId` parameter — it queries by `realmId`. Posts outside the viewer's realm are not fetched. Realm-scoping is DB-side.

Feed mutations (delete post, edit post) live in `upload/controllers/createPost.controller.js` and `post/postcard/controller/` — those are gated by actor ownership at the DAL query level.

**Severity:** INFO — feed read path is correctly defended. No mutation surface in the feed feature itself.

---

## Ownership Bypass Results

| Controller | Gate Type | Verdict |
|---|---|---|
| cancelBookingController | DB actor_owners query | BLOCKED |
| confirmBookingController | DB actor_owners query | BLOCKED |
| createBookingController | DB actor_owners query (management) / kind check (public) | BLOCKED |
| updateBookingStatusController (dashboard) | DB actor_owners query | BLOCKED |
| rescheduleBookingController | DB actor_owners query | BLOCKED |
| saveVportPublicDetailsByActorIdController | DB actor_owners query | BLOCKED |
| deleteVportActorMenuItemController | RLS only — no pre-read check | PARTIAL |
| deleteVportActorMenuCategoryController | RLS only — no pre-read check | PARTIAL |
| upsertVportServicesController | RLS only | PARTIAL |
| deleteVportServiceAddonController | RLS only | PARTIAL |
| upsertVportRateController | identityActorId discarded (`void`) | PARTIAL |
| locksmithOwner ctrlDeleteServiceArea | No ownership check whatsoever | PARTIAL |
| locksmithOwner ctrlUpdateServiceArea | No ownership check whatsoever | PARTIAL |
| locksmithOwner ctrlDeleteServiceDetail | No ownership check whatsoever | PARTIAL |

---

## Auth Callback Replay Results

- PKCE code: Single-use enforced by Supabase — BLOCKED
- Hash recovery type spoofing: Session-verified before redirect — BLOCKED
- Error description injection: Fixed production message — BLOCKED
- Recovery session sign-out failure: Session remains live — LOW risk

---

## URL Surface Results

- Public menu/review routes: Slug-based — CLEAN
- Protected dashboard routes: Raw actorId UUID in path — EXPOSED
- Notification linkPaths: Raw actorId/postId UUID in path — EXPOSED
- `/posts/:postId` and `/post/:postId`: Raw UUID — EXPOSED

---

## Successful Exploit Chains

None confirmed as end-to-end exploitable at the controller layer. All PARTIAL findings require unverified RLS misconfiguration to become exploitable.

**Most credible chain (if RLS is misconfigured):**
Actor B calls `deleteVportActorMenuItemController({ itemId: <Actor A's item UUID>, actorId: <Actor B's actorId> })`. Controller does not read the item to verify `item.actor_id === actorId`. It calls `deleteVportActorMenuItemDAL({ itemId })` with no actor scope. If the DB delete policy allows the authenticated user to delete any row (RLS missing or overly permissive), Actor B deletes Actor A's menu item.

---

## Failed Exploit Chains (Defenses That Held)

1. **Booking cancel cross-actor replay** — ownership chain through `actor_owners` table fully blocks this.
2. **Booking confirm cross-actor replay** — same protection.
3. **Auth callback code replay** — Supabase single-use enforcement blocks this.
4. **Recovery type hash injection** — session check before recovery redirect blocks this.
5. **Feed privacy bypass with null viewer** — private-account posts correctly hidden.
6. **Moderation endpoint abuse by non-moderator** — `assertModerationAccessController` blocks immediately.
7. **Post/comment delete cross-actor** — DAL query predicate `.eq("actor_id", actorId)` prevents cross-actor delete.

---

## BLACKWIDOW FINDINGS

---

### BW-001

**Finding ID:** BW-001
**Scenario:** Cross-Actor Ownership Gates — Menu Item / Category Delete
**Target:** `deleteVportActorMenuItemController`, `deleteVportActorMenuCategoryController`
**Application Scope:** VCSM
**Platform Surface:** VPORT Dashboard — Menu Management
**Attack Vector:** Authenticated actor sends `{ itemId: <victim's UUID>, actorId: <own actorId> }` to the delete controller. Controller does not read the item to verify ownership. DAL call has no actor scope.
**Exploit Chain Type:** Injection exploit (forged parameter accepted by controller)
**Governance Status:** DRAFT
**Result:** PARTIAL — exploitable only if DB RLS policy is misconfigured
**Evidence:** `deleteVportActorMenuItemController` line 27-29: `await deleteVportActorMenuItemDAL({ itemId })` — actorId is accepted but not used to scope the delete. No pre-read ownership check.
**Defense Gate:** ABSENT at controller layer — RLS assumed but not verified in source
**Blast Radius:** Any authenticated actor could delete any other actor's menu items or categories if RLS is absent
**Severity:** HIGH
**VENOM Finding Cross-Reference:** None on record
**Recommended Fix:** Add pre-read ownership check: fetch item by `itemId`, assert `item.actor_id === actorId`, throw if mismatch — before calling delete DAL.
**Layer to Fix:** Controller
**Required Follow-up Command:** VENOM (verify RLS on vport menu item/category tables), DB (audit RLS policies)

---

### BW-002

**Finding ID:** BW-002
**Scenario:** Cross-Actor Ownership Gates — Rate Upsert
**Target:** `upsertVportRateController`
**Application Scope:** VCSM
**Platform Surface:** VPORT Dashboard — Exchange Rates
**Attack Vector:** `identityActorId` parameter is received but immediately discarded with `void _identityActorId`. Controller calls DAL with `actorId` only — no ownership assertion.
**Exploit Chain Type:** Injection exploit
**Governance Status:** DRAFT
**Result:** PARTIAL — exploitable only if RLS is absent/misconfigured
**Evidence:** Line 13: `void _identityActorId;` — identity is explicitly abandoned. Line 15: `return upsertVportRateDal({ actorId, ... })` — actorId from caller, no verification.
**Defense Gate:** ABSENT at controller layer
**Blast Radius:** Authenticated actor could overwrite exchange rates for any target actor by providing a victim's actorId
**Severity:** HIGH
**Recommended Fix:** Restore use of `identityActorId` as the ownership guard. Assert `identityActorId === actorId` (same actor) or assert ownership via `actor_owners` if cross-actor delegation is intended.
**Layer to Fix:** Controller
**Required Follow-up Command:** VENOM, DB

---

### BW-003

**Finding ID:** BW-003
**Scenario:** Cross-Actor Ownership Gates — Locksmith Controller
**Target:** `locksmithOwner.controller.js` — `ctrlUpdateServiceArea`, `ctrlDeleteServiceArea`, `ctrlDeleteServiceDetail`
**Application Scope:** VCSM
**Platform Surface:** VPORT Dashboard — Locksmith Profile
**Attack Vector:** `ctrlUpdateServiceArea(areaId, updates)` and `ctrlDeleteServiceArea(areaId)` accept only a resource ID with no caller actor. No ownership assertion of any kind. An authenticated actor with a known victim `areaId` UUID could update or delete that area.
**Exploit Chain Type:** Single-step exploit (gate entirely absent)
**Governance Status:** DRAFT
**Result:** PARTIAL — exploitable if RLS is misconfigured
**Evidence:** `ctrlUpdateServiceArea` line 45-61: parameter is only `areaId`. No actor ownership check. `ctrlDeleteServiceArea` line 63-65: parameter is only `areaId`. `ctrlDeleteServiceDetail(serviceId)` line 94-96: parameter is only `serviceId`.
**Defense Gate:** ABSENT at controller layer — no RLS comment even present
**Blast Radius:** Any authenticated actor could modify or delete locksmith service areas and details for any VPORT if RLS is absent
**Severity:** HIGH
**Recommended Fix:** Add `callerActorId` parameter to all write operations. Fetch the area/detail record first, assert `record.actor_id === callerActorId`, throw on mismatch.
**Layer to Fix:** Controller
**Required Follow-up Command:** VENOM, DB

---

### BW-004

**Finding ID:** BW-004
**Scenario:** URL Surface — Raw UUID Exposure in Notification Deep Links and Routes
**Target:** All booking notification `linkPath` values; `/profile/:actorId`, `/actor/:actorId/*`, `/post/:postId`, `/chat/:conversationId` routes
**Application Scope:** VCSM
**Platform Surface:** Notifications, Routing
**Attack Vector:** A notification recipient sees `/actor/<UUID>/dashboard/booking-history` in their notification. The raw `actorId` UUID is exposed. Combined with multiple notification events (bookings, reviews, team invites, follows), an actor's internal `actorId` UUID can be correlated across notification types.
**Exploit Chain Type:** Replay exploit (stale notification link carries raw ID)
**Governance Status:** DRAFT
**Result:** EXPOSED — raw UUIDs are present in notification linkPaths as built in source code
**Evidence:**
- `cancelBooking.controller.js` line 71: `` `/actor/${resource.owner_actor_id}/dashboard/booking-history` ``
- `confirmBooking.controller.js` line 59: `` `/profile/${resource.owner_actor_id}?tab=book` ``
- `createBooking.controller.js` line 138: `` `/actor/${resource.owner_actor_id}/dashboard/booking-history` ``
- `follow.controller.js` line 93: `` `/profile/${followerActorId}` ``
- `app.routes.jsx`: `/profile/:actorId`, `/actor/:actorId/dashboard`, `/post/:postId`
**Defense Gate:** ABSENT
**Blast Radius:** Actor UUID correlation via notifications. Violates Memory rule `feedback_no_raw_ids_in_urls.md`.
**Severity:** MEDIUM
**Recommended Fix:** Use actor slugs in all notification linkPaths and public-facing routes. The slug system already exists (`resolveActorBySlug`, `/profile/:slug/menu`). Extend it to all notification link generation.
**Layer to Fix:** Controller (linkPath construction), Router (route param naming)
**Required Follow-up Command:** VENOM

---

### BW-005

**Finding ID:** BW-005
**Scenario:** Search / Explore Abuse — Null Viewer Pass-Through
**Target:** `searchActors.controller.js`, `searchActors.dal.js`
**Application Scope:** VCSM
**Platform Surface:** Search / Explore
**Attack Vector:** Call `searchActors({ query: "a", viewerActorId: null })`. Controller passes null to the RPC `p_viewer_actor_id`. No application-layer check enforces visibility rules for unauthenticated callers.
**Exploit Chain Type:** Viewer context fuzz
**Governance Status:** DRAFT
**Result:** PARTIAL — entirely dependent on DB function behavior (not verifiable from source)
**Evidence:** `searchActors.controller.js` line 4: `viewerActorId = null` default accepted silently. `searchActors.dal.js` line 11: `p_viewer_actor_id: viewerActorId` passed to RPC with no guard.
**Defense Gate:** ABSENT at application layer — assumed present in DB function
**Blast Radius:** If DB function does not filter deactivated or hidden actors for null viewer, actor enumeration via username search is possible
**Severity:** MEDIUM
**Recommended Fix:** Add an application-layer check: if `viewerActorId` is null, return only `p_filter: 'public'` results and document the guarantee. Do not rely solely on DB function behavior without verification.
**Layer to Fix:** Controller
**Required Follow-up Command:** DB (audit `identity.search_actor_directory` RPC for null-viewer behavior)

---

### BW-006

**Finding ID:** BW-006
**Scenario:** Auth Callback — Recovery Session Sign-Out Failure
**Target:** `setNewPassword.controller.js` — `updatePasswordController`
**Application Scope:** VCSM
**Platform Surface:** Auth — Password Reset
**Attack Vector:** Password update completes. `dalSignOutRecoverySession()` throws (network timeout, Supabase transient error). Exception propagates to caller. Depending on caller error handling, the password may have already been changed while the recovery session token remains active.
**Exploit Chain Type:** Timing-dependent exploit (non-atomic operation)
**Governance Status:** DRAFT
**Result:** PARTIAL — requires transient infrastructure failure to exploit
**Evidence:** `setNewPassword.controller.js` line 73-74: `await dalUpdateUserPassword(password)` then `await dalSignOutRecoverySession()`. No try/catch around sign-out. If sign-out throws, the recovery session is not revoked.
**Defense Gate:** WEAK — sign-out is not wrapped in a compensating error handler
**Blast Radius:** Attacker with access to the recovery email link who intercepts after password change could retain an active session token briefly
**Severity:** LOW
**Recommended Fix:** Wrap `dalSignOutRecoverySession()` in a try/catch that logs the failure and returns a warning to the caller rather than throwing, ensuring the password update is surfaced as successful even when sign-out has a transient failure.
**Layer to Fix:** Controller
**Required Follow-up Command:** None blocking

---

## Recommended Fixes (Priority Order)

1. **BW-001, BW-003 [HIGH]** — Add pre-read ownership checks in menu delete and locksmith mutation controllers. Never call a delete DAL without first reading the target record and verifying `record.actor_id === callerActorId`.
2. **BW-002 [HIGH]** — Restore `identityActorId` enforcement in `upsertVportRateController`. The parameter being voided signals an incomplete refactor.
3. **BW-005 [MEDIUM]** — Add application-layer guard in `searchActors` for null `viewerActorId`. Document and enforce what visibility level null-viewer should receive.
4. **BW-004 [MEDIUM]** — Migrate notification `linkPath` construction to use actor slugs. Audit and rename route params from `:actorId` to `:actorSlug` where appropriate.
5. **BW-006 [LOW]** — Wrap `dalSignOutRecoverySession()` in a non-throwing error handler.

---

## Required Follow-up Commands

| Command | Reason | Status |
|---|---|---|
| VENOM | Cross-reference BW-001/002/003 with trust-boundary source design; verify RLS policies on vport menu, rates, locksmith, and service tables | PENDING |
| DB | Audit RLS policies on: `vport_menu_items`, `vport_menu_categories`, `vport_rates`, `locksmith_service_areas`, `locksmith_service_details`, `vport_services` | PENDING |
| LOKI | Validate runtime telemetry shows ownership assertion calls in production traces | PENDING |
| THOR | BW-001/002/003 are DRAFT HIGH — evaluate release blocking status against current branch | PENDING |

---

## THOR Release Gate Assessment

- BW-001, BW-002, BW-003: Governance Status DRAFT — not yet CONFIRMED. Release block requires VENOM + DB verification of RLS policies before CONFIRMED status.
- If VENOM confirms RLS is correctly enforced on all affected tables, severity downgrades to MEDIUM.
- If RLS is absent on any affected table, BW-001/002/003 become CONFIRMED HIGH and are THOR release blockers.

---

*Report produced by BLACKWIDOW — 2026-05-14. All files read directly. No code modified. No production systems accessed.*
