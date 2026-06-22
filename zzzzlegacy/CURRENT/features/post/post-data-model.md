# Post Data Model

Last Updated: 2026-05-09

## vc.posts — Columns (from DAL selects)

| Column | Source DAL | Notes |
|---|---|---|
| `id` | all read DALs | UUID primary key |
| `actor_id` | all read DALs | FK to `vc.actors.id` |
| `text` | all read DALs | Caption/body text |
| `title` | feed.read.posts.dal, post.read.dal | Optional title (currently null on insert) |
| `media_url` | feed.read.posts.dal, post.read.dal | Legacy single media URL (first item, backward compat) |
| `media_type` | feed.read.posts.dal, post.read.dal | `'image'` \| `'video'` \| `'text'` |
| `post_type` | feed.read.posts.dal, post.read.dal | Mode: `'post'` \| `'24drop'` \| `'vdrop'` |
| `tags` | listActorPostsByActor.dal, post.read.dal | Array of hashtag strings |
| `created_at` | all read DALs | Timestamp |
| `realm_id` | feed.read.posts.dal, listActorPostsByActor.dal | Scoping realm |
| `edited_at` | feed.read.posts.dal | Set on edit |
| `deleted_at` | feed.read.posts.dal, post.write.dal | Soft delete timestamp |
| `deleted_by_actor_id` | feed.read.posts.dal | Actor who deleted |
| `location_text` | feed.read.posts.dal, post.read.dal | Text location label |
| `user_id` | insertPost.dal (write only) | Auth user UUID |

**Observed on insert only (not selected on reads):** `user_id` is written at insert time but not included in any read projection.

**Column referenced in search DAL but not confirmed in read DALs:** `is_hidden` — `search.dal.js` filters `.or('is_hidden.is.null,is_hidden.eq.false')`. This column is not selected in any DAL reviewed, suggesting it may exist in the DB schema but is not yet used by the feed pipeline for server-side filtering.

---

## vc.post_media — Columns

| Column | Source | Notes |
|---|---|---|
| `id` | insertPostMedia.dal.js | UUID |
| `post_id` | feed.read.media.dal, insertPostMedia.dal | FK to `vc.posts.id` |
| `url` | feed.read.media.dal | R2 public URL |
| `media_type` | feed.read.media.dal, insertPostMedia.dal | `'image'` \| `'video'` |
| `sort_order` | feed.read.media.dal, insertPostMedia.dal | Integer, 0-indexed |
| `media_asset_id` | updatePostMediaAssetId.write.dal | FK to `platform.media_assets.id` (written non-blocking after upload) |

---

## vc.post_reactions — Columns

| Column | Source | Notes |
|---|---|---|
| `post_id` | postReactions.read.dal, postReactions.write.dal | FK to `vc.posts.id` |
| `actor_id` | postReactions.read.dal, postReactions.write.dal | FK to `vc.actors.id` |
| `reaction` | postReactions.read.dal, postReactions.write.dal | `'like'` \| `'dislike'` |
| `updated_at` | postReactions.write.dal (update only) | Set on reaction switch |

---

## vc.post_rose_gifts — Columns

| Column | Source | Notes |
|---|---|---|
| `post_id` | roseGifts.actor.dal, feed.read.reactionCounts.dal | FK to `vc.posts.id` |
| `actor_id` | roseGifts.actor.dal | FK to `vc.actors.id` |
| `qty` | roseGifts.actor.dal, feed.read.reactionCounts.dal | Integer quantity |

Roses are unbounded: an actor can send multiple rose rows to the same post. There is no uniqueness constraint observed in the DAL.

---

## vc.post_comments — Columns

| Column | Source | Notes |
|---|---|---|
| `id` | comments.dal, postComments.read.dal | UUID |
| `post_id` | comments.dal, postComments.read.dal | FK to `vc.posts.id` |
| `parent_id` | comments.dal, postComments.read.dal | FK to `vc.post_comments.id` (null = root comment) |
| `actor_id` | comments.dal, postComments.read.dal | FK to `vc.actors.id` |
| `content` | comments.dal, postComments.read.dal | Text content |
| `created_at` | comments.dal, postComments.read.dal | Timestamp |
| `deleted_at` | comments.dal, postComments.read.dal | Soft delete |

Note: `comments.dal.js` comment says "Your table does NOT have edited_at" and "Your table does NOT have deleted_by_actor_id" — edit tracking is absent from comments.

---

## vc.comment_likes — Columns

| Column | Source | Notes |
|---|---|---|
| `comment_id` | commentLikes.dal | Composite PK part 1 |
| `actor_id` | commentLikes.dal | Composite PK part 2 |

Composite PK only — no separate `id` column.

---

## vc.post_mentions — Columns

| Column | Source | Notes |
|---|---|---|
| `post_id` | insertPostMentions.dal, feed.mentions.dal | FK to `vc.posts.id` |
| `mentioned_actor_id` | insertPostMentions.dal, feed.mentions.dal | FK to `vc.actors.id` |

---

## platform.media_assets — Columns (from insertMediaAssetDAL projection)

```
id, app_id, owner_source, owner_actor_id, scope_domain, scope_type, scope_id,
media_kind, media_role, mime_type, size_bytes, width, height, duration_ms,
storage_provider, bucket, storage_key, public_url, variants, meta, status,
created_by_actor_id, created_at, updated_at
```

Post-related `scope_type` values: `'post_media'` (vibe_post, story_24drop, vdrop).

---

## Normalized Feed Post Shape (View Model)

This is the shape of each element in the `posts` array returned by `useCentralFeed` / `useFeed`:

```js
{
  id: string,
  text: string,
  title: string,
  created_at: string,
  edited_at: string | null,
  deleted_at: string | null,
  deleted_by_actor_id: string | null,
  post_type: string,
  actor_id: string,
  location_text: string | null,
  is_hidden_for_viewer: boolean,
  actor: {
    id: string,
    kind: 'user' | 'vport',
    displayName: string | null,
    username: string | null,         // slug for vport, username for user
    avatar: string | null,
    vport_name: string | null,
    vport_slug: string | null,
  },
  media: Array<{ type: 'image' | 'video', url: string }>,
  mentionMap: Record<string, { username, slug, kind, ... }>,
  commentCount: number,
  viewerReaction: 'like' | 'dislike' | null,
  reactionCounts: { like: number, dislike: number, rose: number },
}
```

Source: `normalizeFeedRows.model.js`

---

## Post Detail Shape (PostDetail.view.jsx)

Loaded by `fetchPostByIdDAL` + `hydrateAndReturnSummaries`. The detail shape adds:
- `post_media: [{ url, media_type, sort_order }]` (nested join, ordered by sort_order)
- `actor` (hydrated canonical summary from `@hydration`)

---

## post.model.js (PostModel) — Thin Model

```
apps/VCSM/src/features/post/postcard/model/post.model.js
```

`PostModel(row)` only maps `id`, `actor`, `text`, `createdAt`, and `media` from a single `media_url`. It does NOT handle multi-media, mentions, reactions, or counts. This model is minimal and likely not the primary normalization path — `normalizeFeedRows.model.js` owns feed normalization.

---

## RPC Used

| RPC | Schema | Purpose |
|---|---|---|
| `post_reactors_summary_one` | `vc` | Aggregated reaction counts (like/dislike/rose) for a single post — called after toggle/send-rose |
| `search_actor_directory` | `identity` | Actor search for Explore |
