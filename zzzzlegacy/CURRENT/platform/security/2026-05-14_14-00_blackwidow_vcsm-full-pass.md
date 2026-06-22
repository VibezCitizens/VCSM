# BLACKWIDOW Runtime Adversarial Report

**Date:** 2026-05-14  
**Scope:** VCSM  
**Reviewer:** BLACKWIDOW  
**Branch:** vport-booking-feed-security-updates  
**Environment:** Source Code Adversarial Simulation (READ-ONLY)  
**Governance Status:** DRAFT  
**Report Type:** Full Pass — Adversarial + Dead Code + Boundary Audit

---

## Executive Summary

This is a full BLACKWIDOW pass across the entire `apps/VCSM/src/` root. The pass covers three parallel tracks:

1. **Adversarial runtime simulation** — 7 attack scenarios executed against ownership, auth, search, hydration, URL surface, notification, and mutation paths
2. **Dead code / orphaned file audit** — 1,995 JS/JSX files inventoried; orphaned models, views, DALs, and adapters identified
3. **Cross-feature boundary violation audit** — 13 import boundary violations found; 1 systemic pattern (media feature missing adapter)

**Overall status: DRIFT FOUND**

No full auth bypass was confirmed. Booking ownership chain is fully hardened. Three HIGH-severity ownership gaps exist in vport mutation paths. Thirteen boundary violations are present but non-exploitable today; they represent latent risk as features grow. Dead code is substantial and concentrated in the `wanders`, `profiles`, and `public` features.

---

## Scope Confirmation

**Application Scope:** VCSM (single root only)  
**Root:** `/Users/vcsm/Desktop/VCSM/apps/VCSM/`  
**Features inventoried:** actors, ads, auth, block, booking, chat, dashboard, debug, explore, feed, hydration, identity, invite, join, legal, media, moderation, notifications, onboarding, portfolio, post, professional, profiles, public, reviews, settings, social, ui, upload, vgrid, void, vport, wanderex, wanders  
**Boundary contract status:** LOADED AND ACTIVE  
**Cross-root modifications:** NONE MADE  

---

## VENOM Cross-Reference Summary

Prior VENOM findings used as baseline:

| VENOM Finding | Status at VENOM time | BlackWidow result |
|---|---|---|
| V-BOOK-01 — `listBookingHistory` no owner gate | CRITICAL — engine path unprotected | Confirmed engine path still exposed (BW-006) |
| V-FEED-01/02 — Client-supplied actorId in feed DALs | MODERATE — RLS-dependent | Not re-tested; RLS unverified |
| V-FEED-03 — `markWelcomeFeedCardSeenDAL` write path | HIGH — client actorId write | Not re-tested in this pass |
| V-AUTH-* — Auth login trust boundaries | Reviewed 2026-05-14 | Auth callback BLOCKED in this pass |
| V-BOOK-DAL — Booking DAL surface | Reviewed 2026-05-14 | Ownership chain confirmed BLOCKED |

---

## Attack Surface Summary

Seven adversarial scenarios were executed. All reads are from source — no assumptions from memory or prior sessions.

| Scenario | Result | Severity |
|---|---|---|
| 1 — Booking Ownership Replay | BLOCKED | INFO |
| 2 — Auth Callback Replay | BLOCKED (LOW partial) | LOW |
| 3 — Explore/Search Abuse | PARTIAL | MEDIUM |
| 4 — Viewer Context Fuzzing | PARTIAL | MEDIUM |
| 5 — URL Surface UUID Exposure | PARTIAL (EXPOSED) | HIGH |
| 6 — Cross-Actor Ownership Gates — VPORT mutations | PARTIAL | HIGH |
| 7 — VPORT Feed Security (branch changes) | BLOCKED | INFO |

---

## Simulated Threat Scenarios

---

### SCENARIO 1 — Booking Ownership Replay

**Files read:**  
`features/booking/controller/cancelBooking.controller.js`  
`features/booking/controller/confirmBooking.controller.js`  
`features/booking/controller/createBooking.controller.js`  
`features/booking/controller/assertActorOwnsVportActor.controller.js`  
`features/booking/dal/updateBookingStatus.dal.js`  
`features/dashboard/vport/controller/updateVportBooking.controller.js`

**Finding:** BLOCKED

**Evidence:**

`cancelBookingController` fetches booking by ID from DB first, resolves `owner_actor_id` from DB, then calls `assertActorOwnsVportActorController` — which queries `vc.actor_owners` to verify requester's `profile_id` is linked to the target actor. No path exists where `actorId` or `ownerActorId` is accepted from client payload as authority.

`confirmBookingController` follows the same pattern unconditionally.

`createBookingController` enforces source-based branching: management sources require ownership assertion; public source requires `kind === "user"` check. `durationMinutes` clamped to 1440-minute ceiling. Slot start time validated against `Date.now()`.

`assertActorOwnsVportActorController` is a two-step live DB read — not a trust-from-cache pattern.

**Severity:** INFO — ownership chain fully enforced.

---

### SCENARIO 2 — Auth Callback Replay

**Files read:**  
`features/auth/controllers/authCallback.controller.js`  
`features/auth/controllers/setNewPassword.controller.js`  
`features/auth/dal/authCallback.dal.js`  
`features/auth/dal/resetPassword.dal.js`

**Finding:** BLOCKED (with LOW partial)

**Evidence:**

PKCE single-use enforcement is handled by Supabase `exchangeCodeForSession`. The code is consumed at the platform level on first use. Recovery type spoofing is blocked by session type verification before redirect.

**Partial (LOW):** `updatePasswordController` calls `dalSignOutRecoverySession()` after password is updated. A transient failure here throws without a compensating handler, leaving the recovery session token potentially active after a password change. Not a replay vector under normal conditions but worth hardening.

**Severity:** LOW  
**Exploit Chain Type:** Replay exploit (partial — sign-out is not fail-safe)

---

### SCENARIO 3 — Search/Explore Abuse

**Files read:**  
`features/actors/controllers/searchActors.controller.js`  
`features/actors/dal/searchActors.dal.js`  
`features/actors/model/searchActors.model.js`

**Finding:** PARTIAL

**Evidence:**

`searchActors` controller accepts `viewerActorId = null` as default and passes it directly to the DB RPC `identity.search_actor_directory`. No application-layer visibility gate exists for the null case. Protection entirely depends on unverified DB function behavior.

If the DB function `identity.search_actor_directory` filters visibility for null viewers (public-only), this is safe. If it does not, null viewers can enumerate all actor records.

**Severity:** MEDIUM  
**Exploit Chain Type:** Injection exploit — null context passed through to DB  
**Blast Radius:** Actor directory — full enumeration risk if DB function is unguarded  
**Required Follow-up:** CARNAGE must verify `identity.search_actor_directory` visibility behavior for null `viewerActorId`

---

### SCENARIO 4 — Viewer Context Fuzzing

**Finding:** PARTIAL

**Evidence:**

Pattern found across multiple controllers: `viewerActorId` is accepted as a caller-supplied parameter. Controllers that have `assertActorOwnsVportActorController` in their path are protected. Controllers that lack it silently accept null or mismatched `viewerActorId`.

The three VPORT mutation controllers identified in Scenario 6 (menu items, rates, locksmith) have no caller identity validation at all — they accept `actorId` as a parameter without binding it to a verified session identity.

**Severity:** MEDIUM (escalates to HIGH in context of Scenario 6)  
**Exploit Chain Type:** Injection exploit — caller-supplied identity not bound to session

---

### SCENARIO 5 — URL Surface UUID Exposure

**Finding:** PARTIAL (EXPOSED)

**Evidence:**

Route definitions use `:actorId`, `:postId`, `:conversationId` as raw UUID path params. Notification system uses deep link paths of the form:

```
/actor/${resource.owner_actor_id}/dashboard/booking-history
```

This exposes raw `owner_actor_id` UUID in notification payloads and deep link paths. Violates platform memory rule: "Raw UUIDs must never appear in public-facing URLs."

**Affected surfaces:**
- Booking notification types (all `linkPath` values with actor UUIDs)
- Route definitions with `:actorId`, `:postId`, `:conversationId` parameters

**Severity:** HIGH  
**Exploit Chain Type:** Information exposure — actor correlation via notification deep links  
**Blast Radius:** All authenticated Citizens who receive notifications containing booking deep links

---

### SCENARIO 6 — Cross-Actor Ownership Gates (VPORT Mutations)

**Finding:** PARTIAL — 3 HIGH findings

**Evidence:**

Three controller paths were found with absent or non-binding ownership checks:

**Path A — Menu Item/Category Delete:**  
`deleteVportActorMenuItemController` and `deleteVportActorMenuCategoryController` accept `actorId` as a parameter but do not read the target record from DB to verify `record.actor_id === actorId` before calling the delete DAL. The DAL includes no actor scope predicate. Ownership protection is entirely delegated to RLS.

**Path B — Rate Upsert:**  
`upsertVportRateController` receives `identityActorId` then immediately discards it with `void _identityActorId`. No ownership assertion runs. An actor can call this with a victim's `actorId` and overwrite their exchange rates if RLS is not enforced on `vport_rates`.

**Path C — Locksmith Area/Detail Mutations:**  
`ctrlUpdateServiceArea(areaId, updates)`, `ctrlDeleteServiceArea(areaId)`, and `ctrlDeleteServiceDetail(serviceId)` in `locksmithOwner.controller.js` accept only a resource ID with no caller actor identity. No ownership assertion is present.

**Severity:** HIGH (×3)  
**Exploit Chain Type:** Injection exploit — forged actorId accepted without live ownership verification  
**Required Follow-up:** CARNAGE must verify RLS on `vport_menu_items`, `vport_menu_categories`, `vport_rates`, `locksmith_service_areas`, `locksmith_service_details`. If RLS is confirmed correct, severity drops to MEDIUM.

---

### SCENARIO 7 — VPORT Feed Security (Branch Changes)

**Files read:**  
`features/feed/` (all files on current branch)

**Finding:** BLOCKED

**Evidence:**

Feed visibility model correctly hides private-account posts from null or non-following viewers. Post mutations use `.eq("actor_id", actorId)` predicate in DAL — cross-actor delete blocked at query level. Moderation endpoints gate on `assertModerationAccessController` before any write. Branch changes did not introduce new ownership gaps in the feed feature.

**Severity:** INFO

---

## Dead Code Audit

### Summary

| Category | Count | Disposition |
|---|---|---|
| Orphaned DAL files (parallel structure) | 4 | SAFE TO DELETE after owner review |
| Orphaned model files | 15 | SAFE TO DELETE (wanders 7, post 3, chat 2, profiles 1, social 1, dashboard 1) |
| Orphaned adapter files | 4 | NEEDS OWNER REVIEW |
| Orphaned components | 6 | NEEDS OWNER REVIEW |
| Dead VPORT view files (replaced) | 5 | SAFE TO DELETE |
| Duplicate controllers (parallel structure) | 4 | NEEDS OWNER REVIEW |

**Total file inventory:** ~1,995 JS/JSX files across `apps/VCSM/src/`

---

### Dead VPORT Views (5 files) — SAFE TO DELETE

These files in `features/profiles/kinds/vport/screens/views/tabs/` have zero imports and have been replaced by newer implementations in sibling directories:

| File | Replaced By |
|---|---|
| `tabs/VportBookingView.jsx` | `booking/view/VportBookingView.jsx` |
| `tabs/VportContentView.jsx` | `content/VportContentView.jsx` |
| `tabs/VportMenuView.jsx` | `menu/VportMenuView.jsx` |
| `tabs/VportPortfolioView.jsx` | `portfolio/view/VportPortfolioView.jsx` |
| `tabs/VportReviewsView.jsx` | `review/VportReviewsView.jsx` |

**Evidence:** 0 imports found anywhere in the codebase. Replacement files exist in sibling directories with active imports.  
**Classification:** SAFE TO DELETE

---

### Orphaned DAL Files in Profile Screen Subdirectory (4 files) — SAFE TO DELETE

These are unused duplicates of main profile DALs that live inside the profiles/screens subdirectory:

| Orphaned File | Active Version | Active Version Import Count |
|---|---|---|
| `profiles/screens/views/tabs/post/dal/fetchPostsForActor.dal.js` | `features/profiles/dal/` version | 2 imports |
| `profiles/screens/views/tabs/friends/dal/friendRanks.reconcile.dal.js` | `features/profiles/dal/` version | 2 imports |
| `profiles/screens/views/tabs/friends/dal/friendRanks.write.dal.js` | `features/profiles/dal/` version | 2 imports |
| `profiles/screens/views/tabs/friends/dal/friends.read.dal.js` | `features/profiles/dal/` version | 4 imports |

**Evidence:** 0 imports for each orphaned file. Active counterparts confirmed in use.  
**Classification:** SAFE TO DELETE

---

### Orphaned Model Files (15 files) — SAFE TO DELETE

No imports anywhere in codebase:

**Wanders feature (7 models — suggests incomplete or abandoned feature)**
- `features/wanders/models/cardPayload.model.js`
- `features/wanders/models/wandersAnon.model.js`
- `features/wanders/models/wandersCard.model.js`
- `features/wanders/models/wandersClaim.model.js`
- `features/wanders/models/wandersEvent.model.js`
- `features/wanders/models/wandersInbox.model.js`
- `features/wanders/models/reply.model.js`

**Post feature (3 models)**
- `features/post/models/Comment.model.js`
- `features/post/models/postcard/post.model.js`
- `features/post/models/commentcard/post.model.js`

**Chat feature (2 models)**
- `features/chat/models/profileSearchResult.model.js`
- `features/chat/models/vportSearchResult.model.js`

**Other (3 models)**
- `features/profiles/models/post.model.js`
- `features/social/models/followRequest.model.js`
- `features/dashboard/models/flyerDraft.model.js`

**Classification:** SAFE TO DELETE (verify wanders feature intent with owner first)

---

### Orphaned Adapter Files (4 files) — NEEDS OWNER REVIEW

These adapters have no confirmed imports but may be used by external consumers or planned routes:

- `features/dashboard/adapters/vport/screens/components/VportBackButton.adapter.js`
- `features/profiles/adapters/photos/photoReactions.adapter.js`
- `features/profiles/adapters/tags/tagsData.adapter.js`
- `features/public/vportMenu/adapters/vportMenu.adapter.js`

**Classification:** NEEDS OWNER REVIEW — adapters may be wired to screens not yet checked

---

### Orphaned Components (6 files) — NEEDS OWNER REVIEW

- `features/profiles/screens/views/tabs/photos/components/CommentComposeModal.jsx`
- `features/explore/ui/PostCard.jsx`
- `features/moderation/components/ReportCoverScreen.jsx`

**Classification:** NEEDS OWNER REVIEW — components may be in-progress or planned

---

### Duplicate Controllers with Inconsistent Usage (4) — NEEDS OWNER REVIEW

These exist in both main feature directory and screens subdirectory with split import counts:

| Controller | Main Version Imports | Screen Version Imports |
|---|---|---|
| `getActorPosts.controller.js` | 2 | 1 |
| `getFriendLists.controller.js` | 2 | 1 |
| `getTopFriendActorIds.controller.js` | 2 | 1 |
| `getActorVibeTags.controller.js` | 2 | 1 |

**Concern:** Screen-version callers should be updated to use the main version, then screen versions deleted.  
**Classification:** NEEDS OWNER REVIEW — consolidate to main version

---

### Suspicious Duplicate Implementations (Worth Auditing)

- `getVportPublicDetails.controller.js`: exists in `public/vportMenu` (2 imports) AND `profiles/kinds/vport` (5 imports) — likely intentional split but confirm no divergence
- `getVportTabsByType.model.js`: exists in 2 locations in vport model directory (2 imports each) — verify both are needed
- `actorOwners.read.dal.js`: exists in 4 different feature domains — likely intentional shared pattern but verify no drift

---

## Cross-Feature Boundary Violations

**Total violations found: 13**

---

### SYSTEMIC: Direct Controller Imports — Media Feature (10 violations — HIGH)

10 files across 7 features import directly from `features/media/controller/createMediaAsset.controller` instead of going through an adapter.

**Root cause:** `features/media/` has no `media.adapter.js`. Only `mediaAppId.adapter.js` exists.

**Affected files:**
| File | Violating Import |
|---|---|
| `features/upload/controller/recordPostMedia.controller.js` | `@/features/media/controller/createMediaAsset.controller` |
| `features/vport/controller/submitCreateVport.controller.js` | `@/features/media/controller/createMediaAsset.controller` |
| `features/dashboard/vport/controller/addPortfolioMediaWithRecord.controller.js` | `@/features/media/controller/createMediaAsset.controller` |
| `features/dashboard/flyerBuilder/controller/flyerEditor.controller.js` | `@/features/media/controller/createMediaAsset.controller` |
| `features/dashboard/flyerBuilder/designStudio/controller/designStudio.assetsExports.controller.js` | `@/features/media/controller/createMediaAsset.controller` |
| `features/chat/conversation/controller/recordChatAttachment.controller.js` | `@/features/media/controller/createMediaAsset.controller` |
| `features/settings/profile/hooks/useProfileUploads.js` | `@/features/media/controller/createMediaAsset.controller` |
| `features/profiles/kinds/vport/controller/menu/saveVportActorMenuItem.controller.js` | `@/features/media/controller/createMediaAsset.controller` |
| `features/wanders/core/controllers/cards.controller.js` | `@/features/media/controller/createMediaAsset.controller` |
| `features/wanders/core/controllers/publishWandersFromBuilder.controller.js` | `@/features/media/controller/createMediaAsset.controller` |

**Fix:** Create `features/media/adapters/media.adapter.js` exporting `createMediaAssetController`, then update all 10 callers.  
**Severity:** HIGH (systemic — 10 callers)  
**Classification:** NEEDS OWNER REVIEW before fix

---

### Direct DAL Import — Settings → Vport (1 violation — HIGH)

| File | Violating Import |
|---|---|
| `features/settings/profile/controller/recordProfileMediaAsset.controller.js` | `@/features/vport/dal/vport.write.profileMedia.dal` |

**Problem:** Settings feature bypasses the vport controller/adapter layer and calls vport's DAL directly.  
**Fix:** Expose the DAL functions through a vport adapter or controller; update settings to call the adapter.  
**Severity:** HIGH  
**Classification:** NEEDS OWNER REVIEW

---

### Direct Hook Import — Profiles → Booking (1 violation — MEDIUM)

| File | Violating Import |
|---|---|
| `features/profiles/kinds/vport/screens/portfolio/PortfolioTab.jsx` | `@/features/booking/hooks/useBookingServiceProfiles` |

**Problem:** Profiles feature imports a booking hook directly, bypassing the booking adapter.  
**Fix:** `booking.adapter.js` should export `useBookingServiceProfiles`; update PortfolioTab.jsx to use adapter.  
**Severity:** MEDIUM  
**Classification:** NEEDS OWNER REVIEW

---

### Component Adapter Bypass — Dashboard → Auth (1 violation — MEDIUM)

| File | Violating Import |
|---|---|
| `features/dashboard/vport/screens/components/portfolio/PortfolioItemForm.jsx` | `@/features/auth/components/ConsentCheckbox` |

**Problem:** Dashboard imports auth component directly. `auth.adapter.js` already exports `ConsentCheckbox`.  
**Fix:** Update import to `@/features/auth/adapters/auth.adapter`.  
**Severity:** MEDIUM  
**Classification:** SAFE TO FIX (auth.adapter already exports it)

---

## Production vs Dev-Only Classification

| Category | Production Risk | Dev-Only Safe |
|---|---|---|
| BW-001/002/003 (VPORT ownership gaps) | YES — production paths | NO |
| BW-004 (UUID in notification deep links) | YES — live notifications | NO |
| BW-005 (search null viewer) | YES — live search | NO |
| BW-006 (recovery session sign-out) | YES — auth flow | NO |
| Orphaned dead view files | NO — no imports | N/A |
| Orphaned DAL duplicates | NO — no imports | N/A |
| Wanders orphaned models | UNKNOWN — wanders feature state unclear | N/A |
| Duplicate controllers (screens vs main) | LOW — both imported, screen version is extra | N/A |
| Boundary violations (media, settings, profiles) | LATENT — production imports but not exploitable today | NO |

---

## BLACKWIDOW FINDINGS

---

### BLACKWIDOW ADVERSARIAL FINDING — BW-001

**Finding ID:** BW-001  
**Scenario:** Scenario 6 — Cross-Actor Ownership Gates  
**Target:** `features/profiles/kinds/vport/controller/menu/deleteVportActorMenuCategory.controller.js` / `deleteVportActorMenuItem.controller.js`  
**Application Scope:** VCSM  
**Platform Surface:** PWA · VPORT Dashboard · Supabase Table  
**Attack Vector:** Call delete controller with a victim's `actorId` and a target resource ID  
**Exploit Chain Type:** Injection exploit — forged actorId accepted without live ownership verification  
**Governance Status:** DRAFT  
**Result:** PARTIAL  
**Evidence:** Controller accepts `actorId` parameter but does not read target record to verify ownership before calling delete DAL. DAL has no actor scope predicate.  
**Defense Gate:** WEAK — delegated entirely to RLS  
**Blast Radius:** Any VPORT's menu items/categories deletable by any authenticated actor if RLS is absent or misconfigured  
**Severity:** HIGH  
**VENOM Finding Cross-Reference:** None — new finding  
**Recommended Fix:** Before calling delete DAL, fetch the target record and assert `record.actor_id === callerActorId`. Or add `actorId` filter to the delete DAL call.  
**Layer to Fix:** Controller + DAL  
**Required Follow-up Command:** CARNAGE — verify RLS on `vport_menu_items`, `vport_menu_categories`

---

### BLACKWIDOW ADVERSARIAL FINDING — BW-002

**Finding ID:** BW-002  
**Scenario:** Scenario 6 — Cross-Actor Ownership Gates  
**Target:** `features/vport/controller/upsertVportRate.controller.js`  
**Application Scope:** VCSM  
**Platform Surface:** PWA · VPORT Dashboard · Supabase Table  
**Attack Vector:** Call upsert with a victim's `actorId`; `identityActorId` is immediately voided  
**Exploit Chain Type:** Injection exploit — identity check explicitly discarded in controller  
**Governance Status:** DRAFT  
**Result:** PARTIAL  
**Evidence:** `void _identityActorId` — the identity parameter is explicitly thrown away without assertion  
**Defense Gate:** ABSENT at controller layer — entirely RLS-dependent  
**Blast Radius:** Any VPORT's exchange rates overwritable by any authenticated actor if RLS absent  
**Severity:** HIGH  
**VENOM Finding Cross-Reference:** None — new finding  
**Recommended Fix:** Remove `void _identityActorId`. Call `assertActorOwnsVportActorController(identityActorId, actorId)` before the DAL write.  
**Layer to Fix:** Controller  
**Required Follow-up Command:** CARNAGE — verify RLS on `vport_rates`

---

### BLACKWIDOW ADVERSARIAL FINDING — BW-003

**Finding ID:** BW-003  
**Scenario:** Scenario 6 — Cross-Actor Ownership Gates  
**Target:** `features/vport/controller/locksmithOwner.controller.js`  
**Application Scope:** VCSM  
**Platform Surface:** PWA · VPORT Dashboard (Locksmith type) · Supabase Tables  
**Attack Vector:** Call `ctrlUpdateServiceArea(areaId, updates)` / `ctrlDeleteServiceArea(areaId)` / `ctrlDeleteServiceDetail(serviceId)` — no caller identity required  
**Exploit Chain Type:** Injection exploit — no caller identity passed at all  
**Governance Status:** DRAFT  
**Result:** PARTIAL  
**Evidence:** Function signatures accept only resource IDs. No actor identity parameter exists in any of the three functions.  
**Defense Gate:** ABSENT at controller layer — no RLS comment even present  
**Blast Radius:** Any locksmith VPORT service area or detail deletable/updatable by any authenticated actor if RLS absent  
**Severity:** HIGH  
**VENOM Finding Cross-Reference:** None — new finding  
**Recommended Fix:** Add `callerActorId` parameter to all three functions. Call ownership assertion before DB operation.  
**Layer to Fix:** Controller  
**Required Follow-up Command:** CARNAGE — verify RLS on `locksmith_service_areas`, `locksmith_service_details`

---

### BLACKWIDOW ADVERSARIAL FINDING — BW-004

**Finding ID:** BW-004  
**Scenario:** Scenario 5 — URL Surface UUID Exposure  
**Target:** Notification system — booking notification `linkPath` values; route definitions  
**Application Scope:** VCSM  
**Platform Surface:** PWA · Notification System · Deep Link URLs  
**Attack Vector:** Observe notification payloads to extract raw `actor_id` UUIDs; correlate actors across notification events  
**Exploit Chain Type:** Information exposure — raw UUIDs in observable notification payloads  
**Governance Status:** DRAFT  
**Result:** BYPASSED  
**Evidence:** Booking notification `linkPath` values embed `/actor/${resource.owner_actor_id}/dashboard/booking-history`. Route params include `:actorId`, `:postId`, `:conversationId` as raw UUIDs.  
**Defense Gate:** ABSENT — no slug enforcement on notification deep links or route params  
**Blast Radius:** All authenticated Citizens receiving booking notifications; actor identity correlatable via URL observation  
**Severity:** HIGH  
**VENOM Finding Cross-Reference:** None — new finding  
**Recommended Fix:** Replace raw UUID path segments in notification deep links with actor slug or opaque token. Update route param names to signal slug expectation.  
**Layer to Fix:** Notification system + Router  
**Required Follow-up Command:** SENTRY — architecture review of notification deep link format

---

### BLACKWIDOW ADVERSARIAL FINDING — BW-005

**Finding ID:** BW-005  
**Scenario:** Scenario 3 — Search/Explore Abuse  
**Target:** `features/actors/controllers/searchActors.controller.js`  
**Application Scope:** VCSM  
**Platform Surface:** PWA · Explore / Actor Search  
**Attack Vector:** Call search with `viewerActorId = null` — no application gate exists  
**Exploit Chain Type:** Injection exploit — null context passed to DB without application-layer guard  
**Governance Status:** DRAFT  
**Result:** PARTIAL  
**Evidence:** Controller default parameter `viewerActorId = null` passes through to DB RPC without application-layer visibility filter for null case.  
**Defense Gate:** WEAK — depends entirely on unverified DB function behavior  
**Blast Radius:** Actor directory enumeration if `identity.search_actor_directory` does not filter for null viewers  
**Severity:** MEDIUM  
**VENOM Finding Cross-Reference:** None — new finding  
**Recommended Fix:** If `viewerActorId` is null, explicitly pass `null` with intent. Verify DB function handles null viewer as public-only. Add application-layer guard if DB function is unguarded.  
**Layer to Fix:** Controller + DB function  
**Required Follow-up Command:** CARNAGE — verify `identity.search_actor_directory` null viewer behavior

---

### BLACKWIDOW ADVERSARIAL FINDING — BW-006

**Finding ID:** BW-006  
**Scenario:** Scenario 2 — Auth Callback Replay (partial)  
**Target:** `features/auth/controllers/setNewPassword.controller.js`  
**Application Scope:** VCSM  
**Platform Surface:** PWA · Password Recovery Flow  
**Attack Vector:** Network transient during sign-out leaves recovery session token active after password change  
**Exploit Chain Type:** Replay exploit — recovery session not invalidated on sign-out failure  
**Governance Status:** DRAFT  
**Result:** PARTIAL  
**Evidence:** `updatePasswordController` calls `dalSignOutRecoverySession()` after password update. No compensating handler exists for sign-out failure.  
**Defense Gate:** WEAK — sign-out is not fail-safe  
**Blast Radius:** Recovery session potentially reusable after password change if sign-out call fails transiently  
**Severity:** LOW  
**VENOM Finding Cross-Reference:** Cross-reference `2026-05-11_venom_auth-login-trust-boundaries.md`  
**Recommended Fix:** Wrap `dalSignOutRecoverySession()` in a try/catch that logs but does not crash. Consider making password update and session invalidation atomic, or using Supabase session revocation via `admin.auth.signOut` as fallback.  
**Layer to Fix:** Controller + Auth  
**Required Follow-up Command:** VENOM — auth sign-out flow hardening review

---

## BLACKWIDOW ARCHITECTURE FINDING — BA-001

**Finding ID:** BA-001  
**Type:** Boundary Violation — Systemic  
**Target:** `features/media/controller/createMediaAsset.controller.js`  
**Scope:** 10 callers across 7 features  
**Violation:** Direct cross-feature controller import — no adapter exists for media feature  
**Severity:** HIGH  
**Risk:** Any refactor of `createMediaAssetController` breaks 10 callsites across 7 features with no adapter contract protecting them  
**Recommended Fix:** Create `features/media/adapters/media.adapter.js`; update all 10 callers  
**Classification:** NEEDS OWNER REVIEW before fix

---

## BLACKWIDOW ARCHITECTURE FINDING — BA-002

**Finding ID:** BA-002  
**Type:** Boundary Violation — DAL bypass  
**Target:** `features/vport/dal/vport.write.profileMedia.dal.js`  
**Caller:** `features/settings/profile/controller/recordProfileMediaAsset.controller.js`  
**Violation:** Settings feature calls vport DAL directly  
**Severity:** HIGH  
**Risk:** Settings can bypass vport business logic; DAL changes in vport silently break settings  
**Recommended Fix:** Expose via vport adapter; settings calls adapter  
**Classification:** NEEDS OWNER REVIEW

---

## Defenses That Held (CONFIRMED BLOCKED)

| Defense | Evidence |
|---|---|
| Booking cancel/confirm ownership | `assertActorOwnsVportActorController` — live `actor_owners` DB query |
| Booking create ownership | Source-based branching + ownership assertion for management sources |
| Auth callback single-use | Supabase PKCE — code consumed at platform level on first use |
| Post/comment mutations cross-actor | `.eq("actor_id", actorId)` predicate in DAL — cross-actor delete blocked at query |
| Moderation endpoints | `assertModerationAccessController` gates all writes |
| Feed visibility (null viewer) | Private-account posts hidden from null and non-following viewers |
| Branch changes (feed feature) | No new ownership gaps introduced on current branch |

---

## Successful Exploit Chains

| ID | Chain | Severity | Status |
|---|---|---|---|
| BW-004 | UUID exposure in notification deep links | HIGH | BYPASSED (confirmed) |
| BW-001 | Menu item delete — no DB ownership check | HIGH | PARTIAL (RLS unverified) |
| BW-002 | Rate upsert — identity explicitly voided | HIGH | PARTIAL (RLS unverified) |
| BW-003 | Locksmith mutations — no identity parameter | HIGH | PARTIAL (RLS unverified) |

## Failed Exploit Chains (Defenses That Held)

Booking ownership chain — fully hardened through `assertActorOwnsVportActorController`.  
Auth callback replay — Supabase PKCE prevents code reuse.  
Feed cross-actor access — DAL predicates enforce actor scope.  
Moderation endpoint abuse — access controller gates all writes.

---

## Blast Radius Summary

| Finding | Affected Surface | Users at Risk |
|---|---|---|
| BW-001 | VPORT menu items and categories | Any VPORT owner's menu data |
| BW-002 | VPORT exchange rates | Any VPORT's rate configuration |
| BW-003 | Locksmith service areas/details | Any locksmith VPORT's service config |
| BW-004 | Notification deep links | All Citizens receiving booking notifications |
| BW-005 | Actor search directory | Actor enumeration risk (severity depends on DB function) |
| BA-001 | Media feature callers | 10 callsites across 7 features — no adapter contract |

---

## Deletion Candidates (DO NOT DELETE — listing only)

### SAFE TO DELETE (after owner sign-off)

| File(s) | Reason |
|---|---|
| 5 dead VPORT view files in `profiles/kinds/vport/screens/views/tabs/` | 0 imports; replaced by sibling directories |
| 4 orphaned DAL files in `profiles/screens/views/tabs/` | 0 imports; active counterparts in main DAL directory |
| 15 orphaned model files (wanders ×7, post ×3, chat ×2, profiles ×1, social ×1, dashboard ×1) | 0 imports anywhere |

### NEEDS OWNER REVIEW

| File(s) | Reason |
|---|---|
| 4 orphaned adapter files | May be planned or used by unlisted routes |
| 6 orphaned component files | May be in-progress features |
| 4 duplicate screen-version controllers | Should consolidate to main version; screen callers need updating first |
| Wanders orphaned models ×7 | Feature may be in-flight; confirm abandonment with owner |

### DO NOT DELETE

| File(s) | Reason |
|---|---|
| All diagnostic/debug files in `features/debug/` | Dev-only; protected by `import.meta.env.DEV` guards |
| `features/wanders/` controllers and hooks | Even if models are orphaned, feature may be partially active |
| All adapter files that are currently wired | Removing them would break cross-feature wiring |

---

## Required Owner-Review Decisions

1. **Wanders feature** — 7 orphaned models suggest incomplete or abandoned development. Owner must confirm whether wanders is in-flight, abandoned, or deprecated before any cleanup.
2. **Media adapter** — Create `features/media/adapters/media.adapter.js`. Owner must confirm the adapter surface before the 10 callers are updated.
3. **Settings → Vport DAL bypass** — Owner must decide whether to expose DAL via vport adapter or vport controller.
4. **VPORT mutation ownership gaps (BW-001/002/003)** — CARNAGE must verify RLS on affected tables before severity is finalized.
5. **Notification UUID exposure (BW-004)** — Owner must decide slug strategy for actor deep links in notifications.
6. **Search null viewer (BW-005)** — CARNAGE must verify `identity.search_actor_directory` DB function behavior for null viewers.

---

## Recommended Next Commands

| Command | Reason | Priority |
|---|---|---|
| CARNAGE | Verify RLS on `vport_menu_items`, `vport_menu_categories`, `vport_rates`, `locksmith_service_areas`, `locksmith_service_details`, `identity.search_actor_directory` | IMMEDIATE — determines if BW-001/002/003/005 are CONFIRMED or MITIGATED |
| VENOM | Cross-reference BW-001/002/003 findings with trust boundary source | HIGH |
| VENOM | Auth sign-out fail-safe review (BW-006) | MEDIUM |
| SENTRY | Architecture review of notification deep link format (BW-004) | HIGH |
| Wolverine | Fix BA-002 (settings → vport DAL bypass) — single file fix | LOW effort |
| Wolverine | Fix BA-004 (dashboard → auth component bypass) — one-line fix, adapter already exports it | TRIVIAL |
| THOR | Receive findings for release gate evaluation | PENDING BW-001/002/003 RLS verification |

---

## Pending Reviews

| Command | Reason | Status |
|---|---|---|
| CARNAGE | RLS verification for BW-001/002/003/005 tables | PENDING |
| VENOM | Cross-reference new findings with trust boundary source | PENDING |
| LOKI | Runtime telemetry validation for BW-001/002/003 exploit paths | PENDING |
| THOR | Release blocking status evaluation | PENDING — blocked on CARNAGE |

---

## Final Status

**DRIFT FOUND**

- 6 adversarial findings (4 HIGH, 1 MEDIUM, 1 LOW)
- 13 boundary violations (1 systemic affecting 10 files)
- ~24+ dead/orphaned files ready for cleanup after owner review
- No confirmed full auth bypass or cross-tenant ownership compromise
- BW-001/002/003 severity is conditional on CARNAGE RLS verification
- BW-004 UUID exposure in notifications is confirmed BYPASSED — no RLS dependency
- Booking ownership chain: FULLY HARDENED
- Feed security (branch changes): CLEAN

---

_BLACKWIDOW does not fix issues. This report converts theoretical protections into verified states or exposes where verification failed._
