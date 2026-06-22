---
title: Upload Module — Architecture
status: STUB
feature: upload
module: upload
source: venom+bw-derived
created: 2026-06-05
---

# upload / modules / upload — ARCHITECTURE

## Create Post Path

```
[upload screen] → createPostController(identityContext, input)
  ├── actorId from identityContext (session-derived; no actor_owners DB verify) ← VEN-UPLOAD-001 / BW-UPLOAD-001
  ├── input.mode → post_type (no allowlist) ← VEN-UPLOAD-009 BYPASSED
  ├── MAX_VIBES_PHOTOS cap skipped for non-"post" mode ← BW-UPLOAD-003 BYPASSED
  └── vc.posts INSERT
        └── [on error] deletePostByIdDAL (no ownership predicate) ← VEN-UPLOAD-005 BYPASSED
```

## Media Record Path

```
recordPostMediaController(actorId, ...)
  └── actorId may be null ← BW-UPLOAD-002
        └── createMediaAssetController
              └── updatePostMediaAssetIdDAL → vc.post_media UPDATE
                    └── filter: row ID only (no ownership filter) ← VEN-UPLOAD-004 BYPASSED
```

## System Post Path

```
api/ → createSystemPost(actorId, ...)
  └── actorId from caller (no actor_owners verify) ← VEN-UPLOAD-007 BYPASSED
```

## Notification linkPath

```
post notification → '/post/' + postId (raw UUID) ← VEN-UPLOAD-010 BYPASSED
```

## Mention Autocomplete

```
searchMentionSuggestions → filterValidActorIdsDAL
  └── viewerActorId = null (blocked actors visible) ← VEN-UPLOAD-002 / VEN-UPLOAD-006
```

## MIME Validation

```
file.type check (client-controlled) ← VEN-UPLOAD-008
  └── no server-side magic-byte inspection
```

## TODO

- [ ] Confirm actor_owners ownership query location
- [ ] Confirm media URL origin validation
