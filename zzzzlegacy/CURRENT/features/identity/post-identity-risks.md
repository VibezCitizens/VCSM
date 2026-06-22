# Post Identity and Actor Risks

Last Updated: 2026-05-09

## Actor-Based Identity Contract

The VCSM architecture contract states:
- All operations are actor-based: `actorId` + `kind` (`'user'` | `'vport'`)
- Never scope by `profileId`, `vportId`, or raw `userId`
- Ownership through `actor_owners`

This document reports where the post system honors this contract and where it deviates.

---

## Risk 1: VPORT Visibility Lookup Keying Mismatch

**File:** `apps/VCSM/src/features/feed/model/feedRowVisibility.model.js`

```js
if (actor.vport_id) {
  const isActive = vportMap?.[actor.vport_id]?.is_active !== false
  ...
}
```

**File:** `apps/VCSM/src/features/feed/dal/feed.read.actorsBundle.dal.js`

```js
vportMap[v.actor_id] = v  // keyed by actor_id
```

The `vportMap` is keyed by `actor.id` (actor UUID). The visibility check looks up `vportMap[actor.vport_id]` — the VPORT entity UUID, which is a different value. This lookup will always return `undefined`.

**Result:** The `is_active !== false` check on `undefined` evaluates to `true`. VPORT posts from inactive VPORTs will pass the visibility filter and be shown in the feed. The inactive VPORT suppression does not work.

---

## Risk 2: No Actor Ownership Verification on Post Create

**File:** `apps/VCSM/src/features/upload/controllers/createPost.controller.js`

The controller verifies:
```js
const user = await getCurrentAuthUserDAL();
if (!user) throw new Error("Not authenticated");
```

It does NOT verify that `identity.actorId` is owned by `user.id` via `vc.actor_owners`. A client that supplies an arbitrary `actorId` (not owned by the authenticated user) would pass the auth check and post as that actor, if RLS on `vc.posts` does not enforce ownership.

**Mitigation expected from RLS:** Supabase RLS policies on `vc.posts` should prevent inserting with an `actor_id` not owned by the requesting user. However, this is not confirmed in code — the app layer does not enforce it.

---

## Risk 3: Soft Delete Does Not Verify Ownership via actor_owners

**File:** `apps/VCSM/src/features/post/postcard/dal/post.write.dal.js`

```js
export async function softDeletePostDAL({ actorId, postId }) {
  return supabase
    .schema("vc")
    .from("posts")
    .update({ deleted_at: ..., deleted_by_actor_id: actorId })
    .eq("id", postId)
    .eq("actor_id", actorId)  // owner gate
    .select(...)
    .maybeSingle();
}
```

The owner gate is `.eq("actor_id", actorId)` — this checks that the post's `actor_id` matches the `actorId` parameter. This is correct for simple ownership but does not check `actor_owners` to see if the requesting user actually owns that actor. If a user switches to a different actor identity (e.g., a VPORT actor they do not own), the gate would pass for posts authored by that actor if they supply the matching `actorId`.

App-layer ownership is assumed from `useIdentity()` correctly providing the current user's actor. RLS is the second enforcement line.

---

## Risk 4: Comment Owner Gate — Same Pattern

**File:** `apps/VCSM/src/features/post/commentcard/dal/comments.dal.js`

```js
// owner gate on edit:
.eq("actor_id", actorId)

// owner gate on soft delete:
.eq("actor_id", actorId)
```

Same pattern as posts — gate is `.eq("actor_id", actorId)`. Not verified via `actor_owners`. Relies on RLS + correct `actorId` from identity.

---

## Risk 5: Reaction Toggle Does Not Check Post Existence

**File:** `apps/VCSM/src/features/post/postcard/controller/togglePostReaction.controller.js`

The controller reads the existing reaction, mutates, then reads counts. It does NOT check if the target post exists or if it is deleted. A reaction can be toggled on a soft-deleted post (the `fetchActorReactionDAL` query does not filter `deleted_at`).

The notification routing step calls `fetchPostByIdDAL(postId)` which also does not filter `deleted_at`. So a reaction notification can be sent for a deleted post.

---

## Risk 6: Rose Gifts Are Unbounded Per Actor Per Post

**File:** `apps/VCSM/src/features/post/postcard/dal/roseGifts.actor.dal.js`

`insertRoseGiftDAL` inserts a new row on every call with no uniqueness constraint on `(post_id, actor_id)`. An actor can send infinite rose gifts to the same post. There is no check or cap in the controller beyond `qty > 0`. This differs from the `comment_likes` table which enforces a composite PK.

---

## Risk 7: feed.read.viewerContext.dal.js Exposes profileId and vportId

**File:** `apps/VCSM/src/features/feed/dal/feed.read.viewerContext.dal.js`

```js
export async function readViewerActorIdentityDAL({ actorId }) {
  return supabase.schema("vc").from("actors")
    .select("profile_id, vport_id")  // exposes internal IDs
    .eq("id", actorId)
    .maybeSingle();
}
```

This DAL selects `profile_id` and `vport_id` — internal identifiers explicitly forbidden from the public hook/controller surface per the architecture contract. The data is used only internally within `getFeedViewerContext.controller.js` to resolve the `is_adult` flag, which is acceptable as a DAL-internal pattern. However, `profile_id` and `vport_id` must not be passed up to the view layer.

`readActorsBundle.dal.js` also selects `profile_id, vport_id` from `vc.actors` for the same internal use. These are correctly used only for bundle construction and never exposed to the screen layer.

---

## Risk 8: Actor Identity Collapse in CentralFeedScreen

**File:** `apps/VCSM/src/features/feed/screens/CentralFeedScreen.jsx`

```js
post={{
  ...post,
  actorId:
    post.actor?.actor_id ??
    post.actor?.actorId ??
    post.actorId ??
    post.actor_id ??
    null,
}}
```

The screen applies a defensive actorId resolution with 4 fallback paths. This suggests the actor shape is inconsistent between feed contexts — the post normalized model produces different shapes depending on the code path (pipeline vs legacy). Multiple actorId field names coexist: `actor.actor_id`, `actor.actorId`, `post.actorId`, `post.actor_id`.

This is a sign of data shape drift across the two feed systems (`useFeed` vs `useCentralFeed`) and the two normalization paths (`normalizeFeedRows.model.js` vs `PostModel`).

---

## Risk 9: Mention Resolution Cross-Source Inconsistency

Three mention resolution paths use different DB sources:

| Path | Tables | Missing case |
|---|---|---|
| `findActorsByHandles.dal.js` (create-time) | `public.profiles` + `vport.profiles` | Resolves both users and vports by handle |
| `post.write.dal.js` `resolveMentionActorIds` (edit-time) | `identity.actor_directory` | Single table; may not contain all vports |
| `findPostMentionsByPostIds.dal.js` (read, not used) | `vc.actors` + `public.profiles` + `vport.profiles` | 4-query chain |

Editing a post uses a different resolution strategy than creating one. If a VPORT is in `vport.profiles` but not in `identity.actor_directory`, mentions may be resolved correctly on create but silently dropped on edit.
