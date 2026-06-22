# Post Visibility and Moderation

Last Updated: 2026-05-10

## Overview

Post visibility is enforced at two layers:
1. **App-layer model** — applied after batch DB reads in the feed pipeline
2. **DB-level soft delete** — `deleted_at IS NULL` filter on all post reads

RLS is confirmed active on both `vc.posts` (force enabled) and `moderation.blocks`. As of 2026-05-10 the `vc.posts` SELECT policy (`posts_select_actor_based`) enforces owner / public / following AND block exclusion (bidirectional). `moderation.blocks` SELECT policy (`blocks_select_blocked`) allows blocked actors to see rows where they are the target, enabling the bidirectional block check.

---

## Feed Visibility Model (App Layer)

```
apps/VCSM/src/features/feed/model/feedRowVisibility.model.js
```

Function: `resolveFeedRowVisibilityModel({ row, actorMap, profileMap, vportMap, blockedActorSet, followedActorSet, viewerActorId })`

Returns: `{ post_id, actor_id, visible: boolean, reason: string, is_private, is_following, is_owner, actor_kind }`

Visibility logic (in order):

| Check | Condition | Result |
|---|---|---|
| Block check | Actor is in viewer's blocked set (bidirectional) | `visible: false, reason: 'blocked_actor'` |
| Missing actor | Actor not found in `actorMap` (deleted or non-existent) | `visible: false, reason: 'missing_actor'` |
| Missing vport profile | VPORT actor has no row in `vportMap` (no `vport.profiles` row) | `visible: false, reason: 'missing_vport_profile'` |
| VPORT active | `vportMap[actor.id]` present: visible unless `is_active = false` OR `is_deleted = true` | `visible: true/false, reason: 'visible_vport'/'inactive_vport'` |
| Missing profile | User actor with no matching profile in `profileMap` | `visible: false, reason: 'missing_profile'` |
| Private + not following | Profile is private AND viewer is not owner AND viewer is not following | `visible: false, reason: 'private_not_following'` |
| Pass | All checks pass | `visible: true, reason: 'visible_user'` |

**Key: This filtering runs client-side, in JS, after posts are fetched from the DB.** The DB query in `readFeedPostsPage` does NOT filter by privacy, block, or follow status. All posts in the realm are fetched and filtered post-query. This creates an overfetch risk — the DB returns rows that are subsequently filtered out by the model.

This is by design (the pipeline documentation in `useFeed.js` explains that sparse pages trigger up to 3 serial DB page reads to fill the visible target). However, it means private users' posts travel over the wire before being dropped by the model.

---

## Block Enforcement

```
apps/VCSM/src/features/feed/dal/feed.read.blockRows.dal.js
```

Table: `moderation.blocks` — `schema: 'moderation'`

Query: bidirectional OR clause — viewer blocked by, OR viewer blocks the post actor.

Cache: 60s TTL per `viewerActorId`.

Model: `buildBlockedActorSetModel` builds a `Set<actorId>` of all blocked actors from the viewer's perspective.

**Fixed (2026-05-10):** `invalidateFeedBlockCache(viewerActorId)` is now called on every block, unblock, and toggle operation in `blockActor.controller.js`. Block controller also requires `assertingActorId === blockerActorId` (session binding) — hooks supply this from `useIdentity()`.

---

## Follow Enforcement (for Private Accounts)

```
apps/VCSM/src/features/feed/dal/feed.read.followRows.dal.js
```

Table: `vc.actor_follows` — filtered `is_active = true`

Cache: 60s TTL per `viewerActorId`.

**Fixed (2026-05-10):** Cache now stores the FULL viewer follow graph (not just the current page's actor subset). The DB query no longer uses `.in("followed_actor_id", uniqueActorIds)` — it fetches all active follows for the viewer, caches the full set, and filters in-memory per page. This eliminates cache misses on every subsequent feed scroll page. `invalidateFeedFollowCache(viewerActorId)` is now called on follow, unfollow, and accept-follow-request write paths.

Model: `buildFollowedActorSetModel` builds a `Set<actorId>` of followed actors.

Combined with `canViewPrivateFeedActorModel`: if `is_private = true`, only the owner or followers can see posts.

**Note:** The `is_private` flag comes from `vc.actor_privacy_settings`, fetched in `readActorsBundle`. It is cached as part of the actor bundle (30s TTL).

---

## Hidden Posts (User-Reported / Hidden)

```
apps/VCSM/src/features/feed/dal/feed.read.hiddenPosts.dal.js
```

Table: `moderation.actions` — `schema: 'moderation'`

Selects: `target_id, action_type, created_at` filtered by `actor_id = viewerActorId`, `target_type = 'post'`, `action_type IN ('hide', 'unhide')`.

Logic: latest action per post wins. If latest is `'hide'`, post is in `hiddenByMeSet`. If latest is `'unhide'`, post is not hidden.

The `normalizeFeedRows` model stamps `is_hidden_for_viewer: true` on hidden posts. The feed screen shows them with a `ReportedPostCover` overlay rather than removing them from the DOM.

**The post is NOT removed from the feed — it is covered.** The `covered` prop shows the overlay. Navigation to the post detail is blocked (`if (covered) return`).

---

## Soft Delete

All post read queries filter `is("deleted_at", null)`:
- `readFeedPostsPage` — `vc.posts`
- `listActorPostsByActorDAL` — `vc.posts`
- `listPostComments` — `vc.post_comments`
- `searchPosts` / `searchPostsByTag` — `vc.posts`
- `fetchPostByIdDAL` — now filters `deleted_at IS NULL` (fixed 2026-05-10)

**Pre-write guards added (2026-05-10):** `togglePostReactionController`, `sendRoseController`, `createRootComment`, and `createReplyComment` all call `checkPostExistsDAL(postId)` before any write. This uses a minimal `select("id")` + `.is("deleted_at", null)` + `.maybeSingle()` and returns a Boolean. Mutations on soft-deleted posts are rejected at the controller before any DB write or notification.

**Remaining gap (DB layer):** The RLS INSERT policies on `post_comments`, `post_reactions`, and `post_rose_gifts` do not include a `deleted_at IS NULL` guard on the posts join. A direct PostgREST call with a valid JWT can bypass the JS controller guard and write to a deleted post. This requires a DB migration fix (Carnage scope) — see VENOM report `2026-05-10_venom_post-reaction-vport-visibility.md`.

---

## PostDetail Visibility Gate (2026-05-10)

**VENOM CRITICAL — 2026-05-10**

Before this fix, `/post/:postId` fetched any post by ID with no viewer context — no block check, no privacy check, no follow check. A blocked actor or non-follower of a private account could see any post by navigating directly to its URL.

### New DAL

```
apps/VCSM/src/features/post/postcard/dal/postVisibility.dal.js
```

Function: `checkPostVisibilityDAL({ postActorId, viewerActorId })`

Logic (in order):

1. If either ID is missing → `{ canView: true, reason: "no_context" }` (fail-open, no context to enforce)
2. If same actor → `{ canView: true, reason: "owner" }`
3. Parallel queries: block check (bidirectional, `blocker_domain='vc'`, `blocked_domain='vc'`) + privacy settings
4. If block row found → `{ canView: false, reason: "blocked" }`
5. If not private → `{ canView: true, reason: "public" }`
6. Follow check (serial, only when private): if `is_active = true` → `{ canView: true, reason: "following" }`, else `{ canView: false, reason: "private_not_following" }`

**Block check column note:** Uses `blocker_actor_id` (not `id` — `moderation.blocks` has no `id` column). Filters `blocker_domain='vc'` and `blocked_domain='vc'`.

### Files Updated to Wire the Gate

| File | Change |
|---|---|
| `getPostById.controller.js` | Accepts `viewerActorId` as second param; calls `checkPostVisibilityDAL`; returns `null` if `!canView` |
| `usePostDetailPost.js` | Accepts `viewerActorId`; passes to controller; included in `useEffect` deps |
| `PostDetail.view.jsx` | Passes `actorId` from `useIdentity()` to `usePostDetailPost` |

### Profile Posts Prefetch Gate

**VENOM HIGH — 2026-05-10**

Before this fix, `useActorPosts` had `enabled: !!actorId` — it fired even when `gate.canView` was false for a private account. React Query cached private posts in the client even if they were never displayed.

Fix: `enabled: !!actorId && canViewContent !== false`

| File | Change |
|---|---|
| `useActorPosts.js` | Accepts `canViewContent` second param; added to `enabled` guard |
| `ActorProfilePostsView.jsx` | Accepts and forwards `canViewContent` prop |
| `ActorProfileViewScreen.jsx` | Passes `canViewContent={gate.canView}` to `ActorProfilePostsView` |

---

## Moderation Report Flow

```
apps/VCSM/src/features/moderation/adapters/hooks/useReportFlow.adapter.js
```

The report flow is composed from adapters in the moderation feature. After a report is submitted via `CentralFeedScreen.jsx`:
1. `reportFlow.submit(payload)` — writes to moderation tables (NOT FULLY TRACED — moderation feature not in scope of this review)
2. `persistHideForMe(postId)` — writes a `hide` action to `moderation.actions` via `useHidePostForActor`
3. `fetchPosts(true)` — refreshes the feed (post will be covered on next load)

---

## VPORT Visibility

**Source change (2026-05-10):** `readActorsBundle` previously queried `vport.public_traze_profiles_v` — a TRAZE directory-listing view — to determine VPORT feed visibility. That view requires `directory_visible = true AND directory_status = 'listed'`, which excluded valid active VPORT actors who are not directory-listed. The query now targets `vport.profiles` directly (grants: `SELECT TO anon, authenticated`).

**vportMap** is now built from `vport.profiles` rows, keyed by `v.actor_id` (which equals `vc.actors.id` for that actor). Selected columns: `actor_id, name, slug, avatar_url, is_active, is_deleted`.

**Visibility logic in `feedRowVisibility.model.js` (updated 2026-05-10):**
```js
const vportEntry = vportMap?.[rowActorId] ?? null;
if (vportEntry === null) {
  return { visible: false, reason: "missing_vport_profile", ... };
}
const isActive = vportEntry.is_active !== false && vportEntry.is_deleted !== true;
return { visible: isActive, reason: isActive ? "visible_vport" : "inactive_vport", ... };
```

| State | Result |
|---|---|
| No `vport.profiles` row | `visible: false, reason: 'missing_vport_profile'` — feed hides these posts |
| `is_active = true, is_deleted = false` | visible |
| `is_active = false` | hidden (`reason: 'inactive_vport'`) |
| `is_deleted = true` | hidden (`reason: 'inactive_vport'`) |

**Behavior change (2026-05-10):** Previously, a VPORT actor with no `vport.profiles` row was fail-open (visible). It is now fail-closed (`missing_vport_profile` → `visible: false`). Orphaned or incomplete VPORT actors no longer appear in the feed.

**Open finding (VENOM FINDING-03):** The `profiles_update_by_actor_owner` RLS policy grants UPDATE on all `vport.profiles` columns. A VPORT owner can directly PATCH `is_deleted: true` or `is_active: false` via REST (self-ghosting). If these are administrative flags they should be restricted to `service_role` only. Requires Carnage migration.

---

## Deleted Account Suppression (2026-05-10)

`readActorsBundle` now filters out soft-deleted actors and profiles at the DAL level:

```js
// vc.actors
.eq("is_deleted", false)

// public.profiles
.eq("is_deleted", false)
```

When `soft_delete_citizen_account()` fires, both `vc.actors.is_deleted` and `public.profiles.is_deleted` are set to `true`. The actors query excludes those rows, so posts from deleted accounts have `actorMap[rowActorId] = null` → `reason: "missing_actor"` → `visible: false`.

**Cache lag:** The actor bundle cache has a 30s TTL. A freshly deleted account may appear in the feed for up to 30 seconds until the cache expires. This is acceptable for soft delete.

---

## UnavailableProfileGate — Deleted/Inactive Account UI (2026-05-10)

When a viewer navigates directly to a VPORT profile route (`/v/:slug`) and the account is deleted or inactive, the profile page now renders `UnavailableProfileGate` instead of a blank screen.

**Files:**
- `apps/VCSM/src/features/profiles/ui/UnavailableProfileGate.jsx` — presentational gate component
- `apps/VCSM/src/features/profiles/adapters/ui/UnavailableProfileGate.adapter.js` — cross-feature export
- `apps/VCSM/src/features/profiles/kinds/vport/screens/VportProfileViewScreen.jsx` — gate integration

**Detection logic:**
```js
const isVportUnavailable =
  !publicDetailsLoading &&
  (
    publicDetails === null ||
    isDeletedProfileActor({ isDeleted: publicDetails?.isDeleted, isActive: publicDetails?.isActive })
  );
```

**`isDeletedProfileActor` helper:**
```
apps/VCSM/src/features/profiles/model/isDeletedProfileActor.model.js
```
Pure model function — no side effects. Returns `true` when:
- `isDeleted === true` (explicit soft-delete flag)
- `isActive === false` (Vport-only deactivation flag)

**i18n keys added:**
- `profile.unavailableGate.badge` — "Account Unavailable" / "Cuenta no disponible"
- `profile.unavailableGate.title` — "This account is no longer available" / "Esta cuenta ya no está disponible"
- `profile.unavailableGate.subtitle` — "This profile has been removed or deactivated..." / "Este perfil ha sido eliminado o desactivado..."

**Visual style:** Rose-toned card with blur decorations — parallel structure to `PrivateProfileGate`.

**Two triggers for gate display:**
1. `publicDetails === null` — no `vport.profiles` row exists for this slug (account hard-deleted or slug never created)
2. `isDeleted: true` or `isActive: false` — explicit deletion/deactivation flags present in the fetched profile data

---

## is_hidden Column on vc.posts

The `search.dal.js` queries `vc.posts` with:
```js
.or('is_hidden.is.null,is_hidden.eq.false')
```

This suggests a `vc.posts.is_hidden` column exists, but it is NOT selected or referenced in any of the feed pipeline DALs. The main feed does not use this column for server-side filtering. Only the explore search uses it.
