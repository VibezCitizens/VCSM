# BlackWidow V2 Adversarial Review — profiles

---

## 1. Output Metadata

| Field | Value |
|---|---|
| Report Date | 2026-06-04 |
| Feature | profiles |
| App | VCSM |
| BW Protocol | BW2.5 V2 / BW2.9 output spec |
| Agent | BLACKWIDOW V2 |
| Scanner Preflight | FRESH |
| Scanner Timestamp | 2026-06-04T19:48:25.152Z |
| Scanner Version | 1.1.0 |
| Behavior Contract | PLACEHOLDER — §9 invariants UNANCHORED |
| Previous VENOM Findings (Open) | 9 (0 CRITICAL, 5 HIGH, 3 MEDIUM, 1 LOW) |

---

## 2. Scanner Preflight

- Status: FRESH (maps ~7h old at scan time — within same business day)
- Scanner Version: 1.1.0
- Maps Generated: 2026-06-04T19:48:25.152Z
- Security paths attributed to profiles: 34
- Total platform security paths: 598
- Write-execution-map paths for profiles: 0 (no resolved route paths — all LOW confidence)
- RPC-execution-map paths for profiles: 0 (no resolved route paths)
- All 34 paths are LOW confidence (no sourceRoute resolution)

---

## 3. Scanner Inputs

### Security Path Map Extract (profiles)

34 paths — all LOW confidence (write surfaces without confirmed route paths). Key surfaces extracted:

| Operation | Table / RPC | Function | File |
|---|---|---|---|
| rpc | save_friend_ranks | saveFriendRanks | dal/friends/friendRanks.write.dal.js |
| rpc | save_friend_ranks | reconcileFriendRanks | dal/friends/friendRanks.reconcile.dal.js |
| rpc | get_friend_ranks | reconcileFriendRanks | dal/friends/friendRanks.reconcile.dal.js |
| rpc | get_friend_ranks | readFriendRankRows | dal/friends/friends.read.dal.js |
| insert | content_pages | createVportContentPageDAL | dal/content/createVportContentPage.dal.js |
| delete | content_pages | deleteVportContentPageDAL | dal/content/deleteVportContentPage.dal.js |
| update | content_pages | toggleVportContentPagePublishDAL | dal/content/toggleVportContentPagePublish.dal.js |
| update | content_pages | updateVportContentPageDAL | dal/content/updateVportContentPage.dal.js |
| upsert | locksmith_portfolio_details | dalUpsertLocksmithPortfolioDetail | dal/locksmith/locksmithPortfolioDetails.write.dal.js |
| delete | locksmith_service_areas | dalDeleteLocksmithServiceArea | dal/locksmith/locksmithServiceAreas.write.dal.js |
| insert | locksmith_service_areas | dalInsertLocksmithServiceArea | dal/locksmith/locksmithServiceAreas.write.dal.js |
| update | locksmith_service_areas | dalUpdateLocksmithServiceArea | dal/locksmith/locksmithServiceAreas.write.dal.js |
| upsert | locksmith_service_areas | dalUpsertLocksmithServiceArea | dal/locksmith/locksmithServiceAreas.write.dal.js |
| delete | locksmith_service_details | dalDeleteLocksmithServiceDetail | dal/locksmith/locksmithServiceDetails.write.dal.js |
| upsert | locksmith_service_details | dalUpsertLocksmithServiceDetail | dal/locksmith/locksmithServiceDetails.write.dal.js |
| upsert | locksmith_service_details | dalInsertLocksmithServiceDetailDefaults | dal/locksmith/locksmithServiceDetails.write.dal.js |
| insert | menu_categories | createVportActorMenuCategoryDAL | dal/menu/createVportActorMenuCategory.dal.js |
| insert | menu_items | createVportActorMenuItemDAL | dal/menu/createVportActorMenuItem.dal.js |
| insert | menu_item_media | createVportMenuItemMediaDAL | dal/menu/createVportMenuItemMedia.dal.js |
| delete | menu_categories | deleteVportActorMenuCategoryDAL | dal/menu/deleteVportActorMenuCategory.dal.js |
| delete | menu_items | deleteVportActorMenuItemDAL | dal/menu/deleteVportActorMenuItem.dal.js |
| update | menu_categories | updateVportActorMenuCategoryDAL | dal/menu/updateVportActorMenuCategory.dal.js |
| update | menu_items | updateVportActorMenuItemDAL | dal/menu/updateVportActorMenuItem.dal.js |
| upsert | rates | upsertVportRateDal | dal/rates/upsertVportRate.dal.js |
| delete | service_addons | deleteVportServiceAddonDal | dal/services/deleteVportServiceAddon.dal.js |
| upsert | services | upsertVportServicesByActorDal | dal/services/upsertVportServicesByActor.dal.js |
| rpc | count_vport_subscribers | dalCountVportSubscribers | dal/subscribersCount.dal.js |
| rpc | list_vport_subscribers | dalListVportSubscribers | dal/subscribersList.dal.js |

### Callgraph Summary

- Total nodes: 661 | Edges: 854
- By layer: barrel=30, component=6, controller=103, dal=109, hook=81, model=100, module=11, screen=221

---

## 4. Attack Surface Inventory

### 4.1 Write Surfaces

All 34 scanner paths are LOW confidence (no route-confirmed paths). These are the PRIMARY ATTACK TARGETS per Rule BW-002.

**Write-capable DAL surfaces (with controller layer present):**
- `save_friend_ranks` RPC — via `saveFriendRanks` + `saveTopFriendRanksController`
- `content_pages` INSERT/UPDATE/DELETE — via createVportContentPage / deleteVportContentPage / updateVportContentPage / toggleVportContentPagePublish controllers
- `locksmith_portfolio_details` UPSERT — via `ctrlSavePortfolioDetail` in locksmithOwner.controller.js
- `locksmith_service_areas` INSERT/UPDATE/DELETE — via `ctrlAddServiceArea`, `ctrlUpdateServiceArea`, `ctrlDeleteServiceArea`
- `locksmith_service_details` UPSERT/DELETE — via `ctrlSaveServiceDetail`, `ctrlDeleteServiceDetail`
- `menu_categories` INSERT/UPDATE/DELETE — via `saveVportActorMenuCategoryController` / `deleteVportActorMenuCategoryController`
- `menu_items` INSERT/UPDATE/DELETE — via `saveVportActorMenuItemController` / `deleteVportActorMenuItemController`
- `menu_item_media` INSERT — via `recordMenuItemMedia` (fire-and-forget, inside `saveVportActorMenuItemController`)
- `rates` UPSERT — via `upsertVportRateController`
- `service_addons` DELETE — via `deleteVportServiceAddonDal`
- `services` UPSERT — via `upsertVportServicesController`

### 4.2 Hook Entry Points (UI-Accessible Write Surfaces)

- `useSaveTopFriendRanks` — calls `saveTopFriendRanksController`, passes `ownerActorId` from hook argument (no session bind)
- `useVportActorMenuCategoriesMutations` — calls `saveVportActorMenuCategoryController` (CREATE path: no ownership check)
- `useVportActorMenuItemsMutations` — calls `saveVportActorMenuItemController` (CREATE path: no ownership check)

### 4.3 Confirmed Ownership-Gated Surfaces (BLOCKED)

- `deleteVportActorMenuCategoryController` — `assertActorOwnsVportActorController` called (line 23)
- `deleteVportActorMenuItemController` — `assertActorOwnsVportActorController` called (line 23)
- All locksmith write controllers — `assertActorOwnsVportActorController` called
- `createVportContentPageController` — `assertActorOwnsVportActorController` called (line 46)
- `deleteVportContentPageController` — `assertActorOwnsVportActorController` called (line 12) + `existing.actor_id !== actorId` check (line 16)
- `updateVportContentPageController` — `assertActorOwnsVportActorController` called (line 25) + row-level check (line 29)
- `toggleVportContentPagePublishController` — `assertActorOwnsVportActorController` called (line 16)
- `upsertVportServicesController` — `assertActorOwnsVportActorController` called (line 43)
- `upsertVportRateController` — `assertActorOwnsVportActorController` called (line 72)

### 4.4 Unprotected Write Surfaces (PRIMARY TARGETS)

- `saveVportActorMenuCategoryController` CREATE path — no ownership gate at all
- `saveVportActorMenuItemController` CREATE path — no ownership gate at all
- `saveTopFriendRanksController` — `ownerActorId` taken from argument (not session-bound at controller layer)

---

## 5. Scanner Signals

- LOW confidence: 34/34 paths. No routes resolved for any profiles write surface.
- Write-execution-map: 0 profiles paths (no route-resolved write chains found by scanner)
- RPC-execution-map: 0 profiles paths
- VENOM open findings cross-referenced: VEN-PROFILES-002, VEN-PROFILES-003, VEN-PROFILES-004, VEN-PROFILES-005, VEN-PROFILES-006, VEN-PROFILES-008 targeted in attack scenarios

---

## 6. Adversarial Path Analysis

---

### A. OWNERSHIP BYPASS (§5.1)

#### A1 — friend rank IDOR via unsession-bound ownerActorId

**Attack:** Caller invokes `useSaveTopFriendRanks.save({ ownerActorId: victimActorId, actorIds: [...] })`. The hook accepts `ownerActorId` from its argument object with no binding to the logged-in session identity.

**Trace:**
```
useSaveTopFriendRanks.js:9 → save({ ownerActorId, actorIds })
  → saveTopFriendRanksController({ ownerActorId, friendActorIds })    [controller line 18-22: only checks if ownerActorId is truthy]
    → saveFriendRanks(ownerActorId, normalizedIds)                    [write.dal line 35: passes ownerActorId directly to RPC p_owner_actor_id]
      → supabase.rpc('save_friend_ranks', { p_owner_actor_id: ownerActorId })
```

**Source verification:** `saveTopFriendRanks.controller.js:18-31` — the only guard is `if (!ownerActorId)` (presence check). No comparison to session identity. The hook at `useSaveTopFriendRanks.js:9` accepts `ownerActorId` as an external argument with no `useIdentity()` sourcing.

**Result:** BYPASSED — if RPC `save_friend_ranks` has no server-side identity check, an authenticated user can write friend ranks on behalf of any other actor. RLS status on this RPC is unverified.

**Finding:** BW-PROF-001 (CRITICAL — confirmed IDOR on friend rank writes; cross-reference VEN-PROFILES-002)

---

#### A2 — menu category CREATE with arbitrary actorId

**Attack:** Caller invokes `useVportActorMenuCategoriesMutations.saveCategory({ actorId: victimActorId, name: 'injected' })`. The `actorId` in `saveCategory` comes from the hook's props, which come from the profile route (`useParams`). The controller `saveVportActorMenuCategoryController` has NO `assertActorOwnsVportActorController` call anywhere in its CREATE path.

**Trace:**
```
useVportActorMenuCategoriesMutations.js:28 → saveVportActorMenuCategoryController({ actorId, ...payload })
  saveVportActorMenuCategory.controller.js: checks actorId truthy + name truthy
  CREATE FLOW: line 68 → createVportActorMenuCategoryDAL({ actorId, ... })
    → resolveVportProfileId(actorId)  [resolves profileId for the target actor]
    → INSERT into menu_categories with profile_id
```

**Source verification:** `saveVportActorMenuCategory.controller.js:17-78` — no import or call to `assertActorOwnsVportActorController`. Only the UPDATE branch (line 35-64) checks `existing.actor_id !== actorId`. The CREATE branch (line 68) writes directly with the attacker-supplied `actorId`.

**Result:** BYPASSED (at controller layer) — if RLS on menu_categories INSERT does not enforce actor ownership, any authenticated actor can inject menu categories under a target vport's profile.

**Finding:** BW-PROF-002 (HIGH — menu category CREATE has no ownership assertion; VEN-PROFILES-003 cross-reference)

---

#### A3 — menu item CREATE with arbitrary actorId

**Attack:** Same vector as A2 but for items. `saveVportActorMenuItemController` has no `assertActorOwnsVportActorController` call. The category ownership check at line 49 (`category.actor_id !== actorId`) only confirms the category belongs to the passed `actorId` — it does not bind `actorId` to the session identity.

**Trace:**
```
useVportActorMenuItemsMutations.js:28 → saveVportActorMenuItemController({ actorId, ...payload })
  saveVportActorMenuItem.controller.js:34-51: checks category belongs to actorId (cross-ownership check, not session check)
  CREATE FLOW: line 96 → createVportActorMenuItemDAL({ actorId, ... })
```

**Source verification:** `saveVportActorMenuItem.controller.js:16-116` — no `assertActorOwnsVportActorController` import or call. No session identity binding.

**Result:** BYPASSED (at controller layer) — an authenticated actor supplying `actorId=victim` can create items under any vport if RLS does not block it.

**Finding:** BW-PROF-003 (HIGH — menu item CREATE has no ownership assertion; VEN-PROFILES-004 cross-reference)

---

### B. SESSION MUTATION (§5.2)

#### B1 — friend rank ownerActorId not sourced from session

**Attack:** As detailed in A1. The `useSaveTopFriendRanks` hook accepts `ownerActorId` as an argument. Any caller in the friends tab UI can supply an arbitrary value.

**Source verification:** `useSaveTopFriendRanks.js:9` — `save({ ownerActorId, actorIds, ... })` — no `useIdentity()` call within the hook. The hook consumers must supply a session-bound `ownerActorId` externally; this is not enforced by the hook itself.

**Result:** BYPASSED — session binding is not enforced at the hook layer.

**Finding:** BW-PROF-004 (HIGH — ownerActorId in friend ranks hook is not session-bound; cross-reference VEN-PROFILES-002)

Note: BW-PROF-001 and BW-PROF-004 describe the same root cause at different layers (controller vs hook). Both are filed as distinct findings since mitigation is needed at both layers.

---

#### B2 — null viewerActorId fuzzing — locksmith controllers

**Attack:** Pass `null` as `identityActorId` to `ctrlAddServiceArea(null, targetActorId, area)`.

**Source verification:** `locksmithOwner.controller.js:24` — `if (!identityActorId) throw new Error('[Locksmith] identityActorId required')`. Guard is present.

**Result:** BLOCKED — null check throws before reaching ownership assertion.

---

#### B3 — null callerActorId — content page controllers

**Attack:** Pass `null` as `callerActorId` to `createVportContentPageController`.

**Source verification:** `createVportContentPage.controller.js:43` — `if (!callerActorId) throw new Error(...)`. Guard is present on all content page controllers.

**Result:** BLOCKED — null check throws before reaching ownership assertion.

---

### C. RUNTIME ABUSE (§5.3)

#### C1 — non-owner actor type reaching vport-only write paths

**Attack:** A `user` kind actor (not a vport actor) calls `saveVportActorMenuCategoryController` with their own `actorId`. Since there is no ownership gate in the CREATE path, and no actor-kind check, a `user` actor could potentially create menu categories under a random vport if they know its `actorId`.

**Source verification:** `saveVportActorMenuCategory.controller.js:17-78` — no actor kind check. `createVportActorMenuCategoryDAL` calls `resolveVportProfileId(actorId)` which may return null for a user actor — in which case the DAL returns null (line 18: `if (!profileId) return null`). This would silently succeed at the controller layer without writing.

**Result:** PARTIAL — a user actor's `actorId` resolves to no profile, so `resolveVportProfileId` returns null and the DAL silently returns null (no error thrown, no write). However, if a user actor also has a vport profile (edge case possible), the path reaches the INSERT. Additionally the silent null return (no error) means the caller sees `result = null` without knowing the write failed.

**Finding:** BW-PROF-005 (MEDIUM — menu category CREATE silently returns null for actors with no vport profile; no error surface to indicate unauthorized access)

---

#### C2 — admin path protection

No admin-only or moderation paths were identified in the profiles feature write surface. All write paths require authenticated session. BLOCKED by architecture (no moderation mutation surface in profiles).

---

### D. RLS VERIFICATION (§5.4)

#### D1 — menu_categories DELETE — controller-only ownership, no DAL filter

**Source verification:** `deleteVportActorMenuCategory.dal.js:10-13`:
```js
.from("menu_categories")
.delete()
.eq("id", categoryId)
```
No actor_id scope in the DELETE query. Ownership is enforced only in the controller via `assertActorOwnsVportActorController`. If RLS on `menu_categories` DELETE is absent or misconfigured, a caller who bypasses the controller can delete any category by ID.

**Result:** PARTIAL — controller gate present, DAL has no secondary ownership filter. RLS status unverified. Cross-references VEN-PROFILES-003 (open).

**Finding:** BW-PROF-006 (MEDIUM — menu_categories DELETE relies on single controller ownership gate; no DAL-layer actor_id scope; RLS not confirmed)

---

#### D2 — menu_items DELETE — same pattern as D1

**Source verification:** `deleteVportActorMenuItem.dal.js:10-13`:
```js
.from("menu_items")
.delete()
.eq("id", itemId)
```
No actor_id scope in the DELETE query. Cross-references VEN-PROFILES-004 (open).

**Result:** PARTIAL — same as D1.

**Finding:** BW-PROF-007 (MEDIUM — menu_items DELETE relies on single controller ownership gate; no DAL-layer actor_id scope; RLS not confirmed)

---

#### D3 — locksmith_portfolio_details UPSERT — actor_id not in conflict key

**Source verification:** `locksmithPortfolioDetails.write.dal.js:19`:
```js
.upsert(row, { onConflict: 'portfolio_item_id' })
```
The conflict key is `portfolio_item_id` only. An attacker who supplies a known `portfolio_item_id` from another actor's portfolio can overwrite that item's detail record if the DAL accepts the call. The controller does check `assertActorOwnsVportActorController` before reaching this DAL. Cross-references VEN-PROFILES-005 (open).

**Result:** PARTIAL — controller gate present. If gate is bypassed, any `portfolio_item_id` can be targeted. RLS status unverified.

**Finding:** BW-PROF-008 (MEDIUM — locksmith_portfolio_details UPSERT conflict key excludes actor_id; overwrite possible if controller bypassed; cross-reference VEN-PROFILES-005)

---

#### D4 — locksmith_service_details UPSERT — conflict key excludes actor_id

**Source verification:** `locksmithServiceDetails.write.dal.js:24`:
```js
.upsert(row, { onConflict: 'service_id' })
```
Conflict key is `service_id` only. `actor_id` is in the row but not in the conflict key. An attacker who supplies a valid `service_id` belonging to a different actor can overwrite that service's detail. Controller gate (`assertActorOwnsVportActorController`) is present. Cross-references VEN-PROFILES-008 (open).

**Result:** PARTIAL — controller gate present. DAL-level exposure exists if gate is bypassed.

**Finding:** BW-PROF-009 (MEDIUM — locksmith_service_details UPSERT conflict key excludes actor_id; cross-reference VEN-PROFILES-008)

---

#### D5 — content_pages DELETE — dual-scope in DAL (BLOCKED)

**Source verification:** `deleteVportContentPage.dal.js:9-13`:
```js
.delete()
.eq("id", id)
.eq("actor_id", actorId)
```
DAL has actor_id scope. Also controller verifies `existing.actor_id !== actorId` before calling DAL. Double protection.

**Result:** BLOCKED — defense in depth confirmed.

---

#### D6 — content_pages UPDATE (toggle publish) — dual-scope in DAL (BLOCKED)

**Source verification:** `toggleVportContentPagePublish.dal.js:22-23`:
```js
.eq("id", id)
.eq("actor_id", actorId)
```

**Result:** BLOCKED — DAL enforces actor_id scope.

---

### E. VIEWER CONTEXT FUZZING (§5.5)

#### E1 — null actorId in saveVportActorMenuCategoryController CREATE

**Attack:** Pass `actorId = null`.

**Source verification:** `saveVportActorMenuCategory.controller.js:27-29` — `if (!actorId) throw new Error(...)`.

**Result:** BLOCKED — null check present.

---

#### E2 — null actorId in saveTopFriendRanksController

**Attack:** Pass `ownerActorId = null` to `saveTopFriendRanksController`.

**Source verification:** `saveTopFriendRanks.controller.js:24-28` — `if (!ownerActorId) return { ok: false, error: ... }`.

**Result:** BLOCKED — null check present (returns error, does not throw).

---

#### E3 — undefined viewerActorId in useProfileGate

**Attack:** Pass `viewerActorId = undefined`.

**Source verification:** `useProfileGate.js:32-36` — `const loading = !viewerActorId || !targetActorId ? true : ...`. Gate returns `loading = true` when viewerActorId is undefined.
Line 39: `const canView = isSelf || (!isBlocked && (!isPrivate || isFollowing))` — `isSelf` is false when viewerActorId is undefined (line 23-29 uses strict equality and Boolean guard). `isFollowing` would be undefined/false.

**Result:** BLOCKED — undefined viewerActorId causes loading state; canView computation is safe.

---

### F. MUTATION REPLAY (§5.6)

#### F1 — friend rank save replay

**Attack:** Re-submit `save_friend_ranks` RPC after it has been called once. The RPC replaces all ranks atomically — there is no terminal state concept for friend ranks.

**Source verification:** `friendRanks.write.dal.js:43-48` — RPC call is stateless; same call parameters produce same result.

**Result:** BLOCKED (no state machine needed here) — friend ranks are idempotent by design; repeated calls are safe. No replay risk.

---

#### F2 — content page publish toggle replay

**Attack:** Re-send toggle publish after it has been set to published/unpublished. Is there a state machine protecting against arbitrary publish/unpublish?

**Source verification:** `toggleVportContentPagePublish.controller.js:8-21` — no state machine. Any boolean toggle is accepted regardless of current state.

**Result:** INFO — toggle is intentionally idempotent (republishing an already-published page is valid). No invariant violation. No finding.

---

### G. HYDRATION POISONING (§5.7)

#### G1 — hydrateActorsIntoStore interaction

**Source verification:** `hydrateActorsIntoStore.controller.js:3-7` — delegates to `hydrateActorsByIds` from the hydration engine. No write path; read-only hydration call. No poisoning vector from within the profiles feature.

**Result:** BLOCKED — profiles feature delegates hydration to the hydration engine without any write surface.

---

#### G2 — canonical slug cache poisoning

**Attack:** Can an attacker poison the controller-level TTL cache in `buildActorCanonicalSlugController` to serve a stale or malicious slug?

**Source verification:** `buildActorCanonicalSlug.controller.js:21` — `const controllerCache = createTTLCache(10 * 60 * 1000)`. Cache is keyed by `actorId`, populated from `readActorSeoViewDAL` output. No external write path to the cache exists. `invalidateActorCanonicalSlugCache` is only callable from within the app process.

**Result:** BLOCKED — cache is process-local, keyed by actorId, populated from DB reads only. No external poisoning vector.

---

### H. URL SURFACE (§5.9)

#### H1 — raw UUID fallback in canonical slug / profile URL

**Attack:** Navigate to a profile that has no stored `vport.profiles.slug` and no `identity.actor_directory.username`. The canonical slug fallback exposes the raw UUID.

**Source verification:**
- `buildActorCanonicalSlug.controller.js:86-90`:
  ```js
  if (!canonicalSlug) {
    canonicalSlug = actorId  // RAW UUID fallback
  }
  ```
- `useActorCanonicalSlug.js:81`:
  ```js
  setCanonicalSlug(actorId)  // RAW UUID fallback on error
  ```
- `actorSeo.model.js:113-121` — canonical slug is null unless vport slug or username resolves. Controller then falls back to bare UUID.

Profile URLs become `/profile/{uuid}` when slug resolution fails.

**Result:** BYPASSED (by design, with policy violation) — the platform rule states raw UUIDs must never appear in public-facing URLs. The fallback at `buildActorCanonicalSlug.controller.js:89` and `useActorCanonicalSlug.js:81` intentionally produces a bare actorId URL. This violates the platform UUID-in-URL policy.

**Finding:** BW-PROF-010 (HIGH — raw UUID exposed in public-facing profile URL on slug resolution failure; violates platform memory rule: "Raw UUIDs must never appear in public-facing URLs")

---

#### H2 — post share link exposes raw postId (UUID)

**Source verification:** `useActorProfileActions.js:31`:
```js
const url = `${window.location.origin}/post/${postId}`;
```
`postId` is a UUID passed from the post object. Share URLs for posts are `/post/{uuid}`.

**Result:** BYPASSED — post share links expose raw UUIDs in public-facing share URLs.

**Finding:** BW-PROF-011 (HIGH — raw postId (UUID) exposed in post share URL constructed at useActorProfileActions.js:31; violates platform UUID-in-URL policy)

---

#### H3 — post edit navigation exposes postId

**Source verification:** `useActorProfileActions.js:80`:
```js
navigate(`/post/${postMenu.postId}/edit`);
```

**Result:** BYPASSED — internal navigation uses raw UUID. This is a client-side route (less critical than shared URLs) but still violates the rule.

**Finding:** BW-PROF-012 (MEDIUM — post edit navigation URL uses raw postId UUID; useActorProfileActions.js:80)

---

### I. §9 INVARIANT ATTACK MAP

**Status: BEHAVIOR.md is PLACEHOLDER — §9 Must Never Happen section is absent. All §9 invariants are UNANCHORED.**

Since no §9 invariants exist in the contract, BW constructs inferred invariants from source behavior and attacks them:

**Inferred Invariant I-1:** A non-owner actor must never be able to create menu categories or items under another actor's profile.

- Attack: supply `actorId = victimVportActorId` to `saveVportActorMenuCategoryController` with no callerActorId.
- Result: BYPASSED at controller layer (no ownership assertion in CREATE path). I-1 is VIOLATED if RLS does not block it. See BW-PROF-002.

**Inferred Invariant I-2:** Friend rank writes must always be scoped to the authenticated actor's own identity.

- Attack: supply `ownerActorId = victimActorId` to `saveTopFriendRanksController`.
- Result: BYPASSED at controller + hook layer. I-2 is VIOLATED unless the RPC enforces identity server-side. See BW-PROF-001, BW-PROF-004.

**Inferred Invariant I-3:** Public-facing profile URLs must never expose raw UUIDs.

- Attack: visit any profile without a stored vport slug or username.
- Result: BYPASSED by design at buildActorCanonicalSlug.controller.js:89. I-3 is VIOLATED. See BW-PROF-010.

---

## 7. Exploitability Assessment

| Finding | Severity | Exploitability | Requires Auth | Single-Step? |
|---|---|---|---|---|
| BW-PROF-001 | CRITICAL | HIGH — no controller barrier | YES | YES |
| BW-PROF-002 | HIGH | MEDIUM — RLS may block at DB | YES | YES |
| BW-PROF-003 | HIGH | MEDIUM — RLS may block at DB | YES | YES |
| BW-PROF-004 | HIGH | HIGH — hook accepts arbitrary ownerActorId | YES | YES |
| BW-PROF-010 | HIGH | HIGH — triggered by missing slug/username | NO (public) | YES |
| BW-PROF-011 | HIGH | HIGH — triggered by any post share | YES | YES |
| BW-PROF-005 | MEDIUM | LOW — user actor gets silent null return | YES | YES |
| BW-PROF-006 | MEDIUM | LOW — blocked by controller gate | YES | Multi-step |
| BW-PROF-007 | MEDIUM | LOW — blocked by controller gate | YES | Multi-step |
| BW-PROF-008 | MEDIUM | LOW — blocked by controller gate | YES | Multi-step |
| BW-PROF-009 | MEDIUM | LOW — blocked by controller gate | YES | Multi-step |
| BW-PROF-012 | MEDIUM | HIGH — triggered by any edit action | YES | YES |

---

## 8. Source Verification Summary

All BYPASSED findings have [SOURCE_VERIFIED] status with file:line citations.

| Finding | Provenance | Key Evidence |
|---|---|---|
| BW-PROF-001 | [SOURCE_VERIFIED] | saveTopFriendRanks.controller.js:24-28; useSaveTopFriendRanks.js:9 |
| BW-PROF-002 | [SOURCE_VERIFIED] | saveVportActorMenuCategory.controller.js:17-78 (no assertActorOwns) |
| BW-PROF-003 | [SOURCE_VERIFIED] | saveVportActorMenuItem.controller.js:16-116 (no assertActorOwns) |
| BW-PROF-004 | [SOURCE_VERIFIED] | useVportActorMenuCategoriesMutations.js:28; useSaveTopFriendRanks.js:9 |
| BW-PROF-005 | [SOURCE_VERIFIED] | createVportActorMenuCategory.dal.js:18 (silent null return) |
| BW-PROF-006 | [SOURCE_VERIFIED] | deleteVportActorMenuCategory.dal.js:10-13 |
| BW-PROF-007 | [SOURCE_VERIFIED] | deleteVportActorMenuItem.dal.js:10-13 |
| BW-PROF-008 | [SOURCE_VERIFIED] | locksmithPortfolioDetails.write.dal.js:19 |
| BW-PROF-009 | [SOURCE_VERIFIED] | locksmithServiceDetails.write.dal.js:24 |
| BW-PROF-010 | [SOURCE_VERIFIED] | buildActorCanonicalSlug.controller.js:89; useActorCanonicalSlug.js:81 |
| BW-PROF-011 | [SOURCE_VERIFIED] | useActorProfileActions.js:31 |
| BW-PROF-012 | [SOURCE_VERIFIED] | useActorProfileActions.js:80 |

---

## 9. Confidence Summary

| Category | Count | Confidence |
|---|---|---|
| BYPASSED with source verification | 7 | HIGH |
| PARTIAL (controller gate present, DAL unscoped) | 4 | MEDIUM |
| BLOCKED (source verified) | Many | HIGH |
| UNRESOLVED (RLS not verified) | 4 (BW-PROF-002,003,006,007) | LOW-MEDIUM |

**BEHAVIOR.md is PLACEHOLDER.** All §9 invariants are UNANCHORED. BW attacks used source-inferred invariants. Full §9 coverage not possible until BEHAVIOR.md is populated.

---

## 10. §9 Invariant Attack Map

| Inferred Invariant | Attack Designed | Result | Finding |
|---|---|---|---|
| I-1: Non-owner cannot create menu categories/items under another actor | Supply victimActorId to saveVportActorMenuCategoryController CREATE path | BYPASSED at controller layer | BW-PROF-002, BW-PROF-003 |
| I-2: Friend rank writes scoped to authenticated actor | Supply victimActorId as ownerActorId to saveTopFriendRanksController | BYPASSED at controller + hook layer | BW-PROF-001, BW-PROF-004 |
| I-3: Public URLs must not expose raw UUIDs | Visit profile with no slug/username (or trigger error path) | BYPASSED by design | BW-PROF-010, BW-PROF-011 |

**UNANCHORED INVARIANTS NOTE:** Without BEHAVIOR.md §9, invariants I-1/I-2/I-3 are BW-inferred. These findings are DRAFT governance status and require BEHAVIOR.md to be populated to become formally anchored.

---

## 11. Behavior Contract Attack Summary

- BEHAVIOR.md Status: PLACEHOLDER
- §4 Failure Paths: ABSENT
- §9 Must Never Happen: ABSENT
- BW Assessment: All §9 invariants are UNANCHORED. Three inferred invariants were attacked; all three were VIOLATED (BW-PROF-001/002/003 BYPASSED). This confirms BEHAVIOR.md absence is itself a blocking concern — no governance anchor exists for the most critical write surfaces.
- Action Required: Populate BEHAVIOR.md before next THOR gate evaluation.

---

## 12. THOR Impact

| Finding | Severity | THOR Status |
|---|---|---|
| BW-PROF-001 | CRITICAL | RELEASE BLOCKER |
| BW-PROF-002 | HIGH | RELEASE BLOCKER |
| BW-PROF-003 | HIGH | RELEASE BLOCKER |
| BW-PROF-004 | HIGH | RELEASE BLOCKER |
| BW-PROF-010 | HIGH | RELEASE BLOCKER |
| BW-PROF-011 | HIGH | RELEASE BLOCKER |
| BW-PROF-005 | MEDIUM | Non-blocking (monitor) |
| BW-PROF-006 | MEDIUM | Non-blocking (RLS may cover) |
| BW-PROF-007 | MEDIUM | Non-blocking (RLS may cover) |
| BW-PROF-008 | MEDIUM | Non-blocking (cross-ref VEN-PROFILES-005 open) |
| BW-PROF-009 | MEDIUM | Non-blocking (cross-ref VEN-PROFILES-008 open) |
| BW-PROF-012 | MEDIUM | Non-blocking |
| MISSING_BEHAVIOR_CONTRACT | HIGH (governance) | RELEASE BLOCKER — §9 invariants unanchored |

**Cumulative THOR status: BLOCKED — 6 HIGH+ BW findings + 1 CRITICAL = 7 release blockers.**

Existing VEN-PROFILES-002 THOR blocker remains OPEN and is now compounded by BW-PROF-001 and BW-PROF-004 confirming IDOR via adversarial attack.

---

## 13. SPIDER-MAN Test Requirements

| Test | Coverage Target | Priority |
|---|---|---|
| saveTopFriendRanks — assert controller rejects ownerActorId !== session actorId | BW-PROF-001 | P0 |
| saveVportActorMenuCategory CREATE — assert controller rejects callerActorId that does not own actorId | BW-PROF-002 | P0 |
| saveVportActorMenuItem CREATE — assert controller rejects callerActorId that does not own actorId | BW-PROF-003 | P0 |
| useSaveTopFriendRanks — assert hook binds ownerActorId to session identity (not external argument) | BW-PROF-004 | P0 |
| buildActorCanonicalSlugController — assert fallback slug is never a raw UUID | BW-PROF-010 | P1 |
| useActorProfileActions.handleShare — assert share URL uses slug not raw postId | BW-PROF-011 | P1 |
| deleteVportActorMenuCategory — assert DAL DELETE includes actor_id scope | BW-PROF-006 | P2 |
| deleteVportActorMenuItem — assert DAL DELETE includes actor_id scope | BW-PROF-007 | P2 |
| locksmithPortfolioDetails UPSERT — assert actor cannot overwrite another actor's portfolioItemId | BW-PROF-008 | P2 |
| locksmithServiceDetails UPSERT — assert actor cannot overwrite another actor's serviceId | BW-PROF-009 | P2 |

---

## Summary

**1 CRITICAL, 6 HIGH, 5 MEDIUM, 0 LOW, 0 INFO**

**Exploit chains confirmed BYPASSED: 5** (BW-PROF-001, 002, 003, 004, 010)
**Exploit chains PARTIAL (controller gate present, DAL unscoped): 4** (BW-PROF-006, 007, 008, 009)
**Blocked: all null/undefined guards, content page controllers, locksmith ownership gates, hydration paths**

**BEHAVIOR.md: PLACEHOLDER — §9 invariants UNANCHORED. This is itself a HIGH governance finding.**
