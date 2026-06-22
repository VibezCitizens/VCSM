# Media Engine V2 — Remaining Scopes Recording Manifest

**Timestamp:** 2026-04-30 20:20:00  
**Git Branch:** main

---

## Purpose

Wire `platform.media_assets` recording for the remaining 6 media scopes:
`vibe_post`, `story_24drop`, `vdrop`, `chat_attachment`, `wanders_card`, `vport_creation_avatar`

---

## Backup Location

`zNOTFORPRODUCTION/zcontract/doc/backups/media-v2-remaining-scopes-20260430-202000/`

Files backed up:
- `uploadMedia.js`
- `useUploadSubmit.js`
- `useSendMessageActions.js`
- `publishWandersFromBuilder.controller.js`
- `submitCreateVport.controller.js`

---

## Files Changed

| File | Change |
|---|---|
| `apps/VCSM/src/features/upload/controller/recordPostMedia.controller.js` | **NEW** — records vibe_post / story_24drop / vdrop uploads in platform.media_assets |
| `apps/VCSM/src/features/upload/api/uploadMedia.js` | Add `uploadResults: []` to all return shapes |
| `apps/VCSM/src/features/upload/hooks/useUploadSubmit.js` | Capture `uploadResults`, call `recordPostMediaController` non-blocking after post is created |
| `apps/VCSM/src/features/chat/conversation/hooks/conversation/useSendMessageActions.js` | Import `createMediaAssetController`; fire non-blocking recording after `onSendMessage` succeeds |
| `apps/VCSM/src/features/wanders/core/controllers/publishWandersFromBuilder.controller.js` | Add optional `senderActorId` param; save `wandersUploadResult`; fire non-blocking recording if actor ID provided |
| `apps/VCSM/src/features/vport/controller/submitCreateVport.controller.js` | Save `vportUploadResult`; fire non-blocking recording after `createVport` returns `res.actorId` |

---

## Scope-by-Scope Results

### vibe_post / story_24drop / vdrop

**Upload path found:**  
`features/upload/api/uploadMedia.js` → `uploadMediaController({ scope: scopeForMode(mode) })`

**platform.media_assets row created at:**  
`features/upload/hooks/useUploadSubmit.js` → calls `recordPostMediaController` non-blocking after `createPostController` returns `postId`

**Domain table media_asset_id linked:**  
NO — `vc.post_media` has no `media_asset_id` column.  
**Migration needed** (see below).

**scope_id used:** `postId` (post row ID — `post_media.id` would require an extra DAL read)

---

### chat_attachment

**Upload path found:**  
`features/chat/conversation/hooks/conversation/useSendMessageActions.js` via `useChatAttachmentUpload` → `useMediaUpload({ scope: 'chat_attachment' })`

**platform.media_assets row created at:**  
Same hook, non-blocking after `onSendMessage` returns `{ ok: true, message }`

**Domain table media_asset_id linked:**  
NO — `chat.message_attachments` has no `media_asset_id` column.  
**Migration needed** (see below).

**scope_id used:** `sendResult.message?.id` (message row ID)

---

### wanders_card

**Upload path found:**  
`features/wanders/core/controllers/publishWandersFromBuilder.controller.js` → `uploadMediaController({ scope: 'wanders_card' })`

**platform.media_assets row created at:**  
Same controller, non-blocking after `createWandersCard` returns `card`.  
Recording only fires when caller passes `senderActorId` (authenticated flows).  
Guest/anonymous flows skip recording (no actor ID available for RLS).

**Domain table media_asset_id linked:**  
NO — `wanders.cards` stores URL inside `customization` JSON, no `media_asset_id` column.  
**Migration needed** (see below).

**scope_id used:** `card.id`

---

### vport_creation_avatar

**Upload path found:**  
`features/vport/controller/submitCreateVport.controller.js` → `uploadMediaController({ scope: 'vport_creation_avatar' })`

**platform.media_assets row created at:**  
Same controller, non-blocking after `createVport` returns `res.actorId`

**Domain table media_asset_id linked:**  
NO — `vport.profiles` has no `avatar_media_asset_id` column.  
**Migration needed** (see below).

**scope_id used:** `res.actorId` (the new vport actor ID)

---

## Domain Write-back — Migrations Required

All 6 pending scopes need schema additions before domain write-back can be wired.

```sql
-- vc.post_media: link platform.media_assets to each post media row
ALTER TABLE vc.post_media
  ADD COLUMN media_asset_id uuid REFERENCES platform.media_assets(id);

-- chat.message_attachments: link platform.media_assets to each attachment row
ALTER TABLE chat.message_attachments
  ADD COLUMN media_asset_id uuid REFERENCES platform.media_assets(id);

-- wanders.cards: link platform.media_assets to card image
ALTER TABLE wanders.cards
  ADD COLUMN media_asset_id uuid REFERENCES platform.media_assets(id);

-- vport.profiles: link platform.media_assets to avatar upload
ALTER TABLE vport.profiles
  ADD COLUMN avatar_media_asset_id uuid REFERENCES platform.media_assets(id);
```

---

## Build Result

```
✓ 6623 modules transformed.
✓ built in 5.20s (Vite)
✓ 83 modules transformed. (SW)
✓ built in 62ms
```

---

## Contract Checks

| Check | Result |
|---|---|
| No Supabase import in new/modified files | PASS (comment-only matches in existing hooks; no actual import) |
| No `select('*')` | PASS |
| No relative imports in new files | PASS |
| All files under 300 lines | PASS (max: 202 lines in publishWandersFromBuilder.controller.js) |
| DAL-only DB access | PASS |
| Controllers not importing Supabase | PASS |
| Hooks/screens not importing DAL | PASS |

---

## SQL Verification Queries

```sql
-- Check all scopes recorded
SELECT scope_domain, scope_type, COUNT(*), MAX(created_at) AS last_recorded
FROM platform.media_assets
WHERE scope_type IN ('post_media', 'chat_attachment', 'wanders_card', 'vport_avatar')
GROUP BY scope_domain, scope_type
ORDER BY scope_domain, scope_type;

-- post_media rows — media_asset_id write-back requires migration first
SELECT id, post_id, url, media_asset_id, created_at
FROM vc.post_media
WHERE media_asset_id IS NOT NULL
ORDER BY created_at DESC
LIMIT 10;

-- chat attachments — media_asset_id write-back requires migration first
SELECT id, message_id, public_url, media_asset_id, created_at
FROM chat.message_attachments
WHERE media_asset_id IS NOT NULL
ORDER BY created_at DESC
LIMIT 10;
```

---

## Rules Enforced

- No schema changes (all domain `media_asset_id` columns are missing — migrations reported, not applied)
- Existing upload behavior unchanged (URLs still returned/stored identically)
- All recording is non-blocking (fire-and-forget with `.catch()`)
- DEV-only warnings on recording failure
- No UI changes
- No old media rows migrated
- Engine isolation preserved (chat engine not modified)
