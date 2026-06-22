# Post Engine Consumers

Last Updated: 2026-05-09

## Engine Registry

| Engine | Path | Used by Post System? | How |
|---|---|---|---|
| `media` | `engines/media/` | Yes | Upload orchestration |
| `notifications` | `engines/notifications/` | Yes | Event publishing |
| `hydration` | `engines/hydration/` | Yes | Actor summary resolution |
| `chat` | `engines/chat/` | No | Chat only (messageReactions) |
| `portfolio` | `engines/portfolio/` | No | VPORT portfolio only |
| `i18n` | `engines/i18n/` | No | Translation (not used in post system) |
| `reviews` | `engines/reviews/` (if exists) | NOT FOUND | NOT FOUND |
| `booking` | `engines/booking/` (if exists) | NOT FOUND | NOT FOUND |
| `identity` | `engines/identity/` (if exists) | NOT FOUND | NOT FOUND |

---

## engines/media — Active Consumer

### Import Path

```
apps/VCSM/src/features/upload/api/uploadMedia.js
  import { uploadMediaController } from '@media'
```

### What is Consumed

- `uploadMediaController({ file, scope, ownerActorId, opts })` — full upload pipeline

### What the Engine Provides for Posts

- File validation (MIME whitelist, size limits per scope)
- Image compression (WebP conversion, dimension capping)
- R2 storage key generation (UUID-based, actor-scoped)
- Upload transport via injected `uploadFn`
- Returns `MediaUploadResult` shape: `{ publicUrl, storageKey, mediaKind, mimeType, sizeBytes, width, height, scope, ownerActorId }`

### Dependency Direction

`apps/VCSM/upload → engines/media` — CORRECT direction

### Engine Not Fully Used by Post System

The media engine also provides:
- `useMediaUpload.js` hook — NOT used by the upload feature (the feature has its own `useUploadSubmit.js` orchestration layer)
- `engines/media/src/model/mediaUploadResult.model.js` — used indirectly (the engine controller returns normalized result)

---

## engines/notifications — Active Consumer

### Import Path

```
apps/VCSM/src/features/notifications/publish.js
  import { publishEvent } from '@notifications'

apps/VCSM/src/features/notifications/adapters/notifications.adapter.js
  export { publishVcsmNotification, publishVcsmNotificationBatch } from '@/features/notifications/publish'
```

### What is Consumed

- `publishEvent({ event, recipients, renderContext, skipPreferences })` — full notification pipeline

### What Consumes the Adapter (Post System)

| File | Notification Kind | Trigger |
|---|---|---|
| `createPost.controller.js` | `social.post.mention` | Post with mentions |
| `togglePostReaction.controller.js` | `social.post.like` / `social.post.dislike` | New reaction |
| `sendRose.controller.js` | `social.post.rose` | Rose gift |
| `postComments.controller.js` | `social.post.comment` | New root comment |
| `postComments.controller.js` | `social.post.comment_reply` | New reply |
| `commentReactions.controller.js` | `social.post.comment_like` | New comment like |

### Dependency Direction

`apps/VCSM/features/* → apps/VCSM/features/notifications/adapters → apps/VCSM/features/notifications/publish → engines/notifications` — CORRECT

### Adapter Bridge

`notifications/publish.js` maps the VCSM-specific call shape (legacy `dalInsertNotification` shape) to the engine's `publishEvent` API. This is explicitly documented as a migration bridge.

---

## engines/hydration — Active Consumer

### Import Paths

```
apps/VCSM/src/features/feed/dal/feed.posts.dal.js (legacy)
  import { hydrateAndReturnSummaries } from "@hydration";

apps/VCSM/src/features/post/postcard/dal/post.read.dal.js
  import { hydrateAndReturnSummaries } from "@hydration";

apps/VCSM/src/features/feed/dal/feed.mentions.dal.js
  import { hydrateAndReturnSummaries } from "@hydration";

apps/VCSM/src/features/feed/hooks/useCentralFeed.js
  import { hydrateActorsByIds } from "@hydration";

apps/VCSM/src/features/feed/hooks/useFeed.js
  import { hydrateActorsByIds } from "@hydration";

apps/VCSM/src/features/explore/dal/search.dal.js
  import { hydrateActorsByIds } from "@hydration";
```

### What is Consumed

- `hydrateAndReturnSummaries({ actorIds })` — resolves canonical actor summaries (display_name, username, photo_url, kind, vport_slug, etc.) from the hydration engine RPC/store
- `hydrateActorsByIds(ids, opts?)` — background hydration into the actor store

### Dependency Direction

`apps/VCSM/feed/post/explore → engines/hydration` — CORRECT

### Hydration in the Feed Pipeline

The primary feed pipeline does NOT call `hydrateAndReturnSummaries` per-post. Instead it uses `readActorsBundle` which queries `vc.actors`, `public.profiles`, and `vport.public_traze_profiles_v` directly. After the pipeline completes, `useCentralFeed.js` calls `hydrateActorsByIds` in background for stale/missing actors only.

`hydrateAndReturnSummaries` is used in:
- `post.read.dal.js` (PostDetail actor enrichment)
- `feed.mentions.dal.js` (mention identity resolution)
- `feed.posts.dal.js` (legacy DAL — diagnostics only)

---

## engines/chat — NOT a Consumer

`engines/chat/src/dal/messageReactions.write.dal.js` and `engines/chat/src/services/reactionService.js` exist but are not referenced by any post feature file. The chat reaction system is separate from the post reaction system.

---

## engines/portfolio — NOT a Consumer

`engines/portfolio/` manages VPORT portfolio media (add/remove portfolio items). It is not referenced by any post feature file.

---

## Dependency Direction Violations

### Violation: `post.write.dal.js` Does Business Logic

**File:** `apps/VCSM/src/features/post/postcard/dal/post.write.dal.js`

This DAL file contains:
- `extractMentionHandles(text)` — business logic (text parsing)
- `resolveMentionActorIds(handles)` — a DB query inside a helper function called from within the DAL
- `replacePostMentions(postId, actorIds)` — orchestration (delete old + insert new)

The VCSM architecture contract states: DAL = raw Supabase access only. No business logic in DALs. This file violates the rule by embedding mention extraction, resolution, and replacement orchestration inside the DAL layer.

### Violation: `feed.posts.dal.js` Calls Hydration Engine

**File:** `apps/VCSM/src/features/feed/dal/feed.posts.dal.js`

This DAL calls `hydrateAndReturnSummaries` from `@hydration` — an engine call inside a DAL. DALs should only access the DB directly. Actor hydration should happen at the controller or hook layer.

(This file is marked legacy and diagnostics-only, but the pattern remains a violation of DAL layer rules.)

### Violation: `feed.mentions.dal.js` Calls Hydration Engine

**File:** `apps/VCSM/src/features/feed/dal/feed.mentions.dal.js`

`fetchPostMentionRows` calls `hydrateAndReturnSummaries` after reading `vc.post_mentions`. This is an engine call inside a DAL file, which violates the layer contract.

### Violation: `post.read.dal.js` Calls Hydration Engine

**File:** `apps/VCSM/src/features/post/postcard/dal/post.read.dal.js`

`fetchPostByIdDAL` calls `hydrateAndReturnSummaries` inside the DAL function. Same pattern as above — engine call inside a DAL.

---

## engines Not Found in Scope

The following engines are referenced in CLAUDE.md as existing but were not found to be consumed by the post system:

- `engines/reviews/` — NOT FOUND in searches (may not exist or may be named differently)
- `engines/booking/` — NOT FOUND in this review scope
- `engines/identity/` — NOT FOUND separately (identity appears to be a Supabase schema, not an engine)
