---
name: vcsm.upload.index
description: VCSM upload feature source inventory — rebuilt by ARCHITECT V2 2026-06-04
metadata:
  type: index
  owner: ARCHITECT
  last-rebuilt: 2026-06-04
---

# INDEX — VCSM / features / upload

**Status:** ACTIVE
**Last rebuilt by ARCHITECT:** 2026-06-04
**Scanner version:** 1.1.0

## Source Inventory

| Layer | Count | Notes |
|---|---|---|
| Controllers | 4 | createPost.controller.js, recordPostMedia.controller.js, searchMentionSuggestions.controller.js, api/uploadMedia.js (orchestrating adapter) |
| DAL files | 10 | insertPost, insertPostMedia, insertPostMentions, postAuthRollback, searchMentionSuggestions, findActorsByHandles, findPostMentionsByPostIds, updatePostMediaAssetId.write |
| Hooks | 9 | useUploadSubmit, useMediaSelection, useMentionAutocomplete, useResolvedActor |
| Models | 1 | uploadTypes.model.js |
| Screens | 7 | UploadScreen.jsx, UploadScreenModern.jsx (cg inflated by re-exports) |
| Components | 29 | UploadCard, CaptionCard, MediaPreview, MentionTypeahead, MentionChips, MentionAutocompleteList, ActorPill, TagChips, SelectedThumbStrip, SegmentedButton, PrimaryActionButton, UploadHeader, LinkifiedMentions + sub-components |
| Adapters | 1 | posts.adapter.js (createSystemPost), adapters/ui/LinkifiedMentions.adapter.js |
| Barrels | 1 | module index barrel |
| Tests | 0 | No tests found by scanner |
| Routes | 0 | No route entries in route-map; routing handled by app router config outside this feature |
| Total source files | 38 | From feature-map sourceFileCount |

## Write Surface Map

| Operation | Schema | Table | Function |
|---|---|---|---|
| INSERT | vc | posts | insertPost |
| INSERT | vc | post_media | insertPostMedia |
| INSERT | vc | post_mentions | insertPostMentions |
| DELETE | vc | posts | deletePostByIdDAL (rollback only) |
| UPDATE | vc | post_media | updatePostMediaAssetIdDAL (async writeback) |
| RPC | identity | — | searchMentionSuggestions → search_actor_directory |

## Security-Sensitive Surfaces

- **vc.posts INSERT** — actorId sourced from client identity context; controller verifies auth session via `getCurrentAuthUserDAL()` but does not cross-check `actor_owners`. If an authenticated user supplies a foreign `actorId`, the row would be created under that actor. This is a medium-severity trust boundary issue.
- **vc.post_mentions INSERT** — client-supplied actorIds are validated against DB via `filterValidActorIdsDAL` before insert. This is the correct pattern.
- **vc.posts DELETE (rollback)** — deletePostByIdDAL uses no ownership gate beyond the implicit Supabase RLS policy. Correct for a server-side rollback but requires RLS to be the final guard.
- **identity.search_actor_directory RPC** — read-only; low risk.

## Engine Dependencies

- directory (identity.search_actor_directory RPC — mention typeahead)
- media (uploadMediaController via @media alias — file upload; createMediaAssetController via media.adapter — asset registration)
- notification (publishVcsmNotificationBatch via notifications.adapter — mention notifications)

## Routes

No routes registered in route-map for this feature. UploadScreen.jsx is the routing boundary but route registration is owned by the app router layer.

## Documentation Links

| Doc | Status |
|---|---|
| BEHAVIOR.md | PRESENT — PLACEHOLDER ONLY (no real spec written) |
| ARCHITECTURE.md | PRESENT (written this run — 2026-06-04) |
| CURRENT_STATUS.md | PRESENT (written this run — 2026-06-04) |
| SCREENS.md | PRESENT |
