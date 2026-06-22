# Upload Write-back Debug & BugBunny Instrumentation
**Timestamp:** 2026-04-30 22:08:35  
**Scope:** VCSM — media upload pipeline  
**Type:** Bug fix + dev instrumentation

---

## Backup Location

`zNOTFORPRODUCTION/zcontract/backups/upload_writeback_debug_20260430-220835/`

| Backup File | Original |
|---|---|
| `_headers.bak` | `apps/VCSM/public/_headers` |
| `worker.js.bak` | `apps/VCSM/cloudflare-worker-upload/worker.js` |
| `uploadToCloudflare.js.bak` | `apps/VCSM/src/services/cloudflare/uploadToCloudflare.js` |
| `createMediaAsset.controller.js.bak` | `apps/VCSM/src/features/media/controller/createMediaAsset.controller.js` |
| `recordPostMedia.controller.js.bak` | `apps/VCSM/src/features/upload/controller/recordPostMedia.controller.js` |
| `recordChatAttachment.controller.js.bak` | `apps/VCSM/src/features/chat/conversation/controller/recordChatAttachment.controller.js` |
| `submitCreateVport.controller.js.bak` | `apps/VCSM/src/features/vport/controller/submitCreateVport.controller.js` |
| `publishWandersFromBuilder.controller.js.bak` | `apps/VCSM/src/features/wanders/core/controllers/publishWandersFromBuilder.controller.js` |
| `cards.controller.js.bak` | `apps/VCSM/src/features/wanders/core/controllers/cards.controller.js` |
| `useUploadSubmit.js.bak` | `apps/VCSM/src/features/upload/hooks/useUploadSubmit.js` |

---

## C — CSP Fix (`public/_headers`)

**Problem:** `upload.vibezcitizens.com` missing from `connect-src` → CSP violation on every upload.  
`blob:` missing from `img-src` → blob: preview images blocked.

**Fix:**
- Added `https://upload.vibezcitizens.com` to `connect-src`
- Added `blob:` to `img-src`

Still `Content-Security-Policy-Report-Only` — no enforcement until promoted.

---

## D — CORS Fix (`cloudflare-worker-upload/worker.js`)

**Problem:** `Access-Control-Allow-Headers` missing `apikey` and `x-client-info`.  
Supabase JS SDK sends these headers; CORS preflight rejection causes silent fallback to unauthenticated upload → worker returns 401.

**Fix:** Added `apikey, x-client-info` to `CORS_HEADERS['Access-Control-Allow-Headers']`.

---

## E — BugBunny Upload Debugger

**Dev implementation:** `zNOTFORPRODUCTION/debuggers/media/bugBunnyUploadDebugger.js`  
**Production stub:** `apps/VCSM/src/debuggers-stub/media/bugBunnyUploadDebugger.js`  
**Import alias:** `@debuggers/media/bugBunnyUploadDebugger` (resolves via vite.config.js)

Exports:
- `bugBunnyUploadStep(scope, step, payload)` — log a pipeline step
- `bugBunnyUploadError(scope, step, error, payload)` — log an error
- `getBugBunnyUploadEvents()` — return ring buffer copy
- `clearBugBunnyUploadEvents()` — clear ring buffer

Gates: `import.meta.env.DEV || localStorage.DEBUG_UPLOADS === '1' || ?debugUploads=1`  
Ring buffer: 100 events (FIFO)  
Token redaction: strips `authorization`, `token`, `apikey`, `secret` from logged payloads  
Console prefix: `🐰 BugBunny Upload`

Production: all exports are no-ops via the stub. Build verified clean.

---

## F — Instrumented Files

| File | Steps Added |
|---|---|
| `uploadToCloudflare.js` | `upload:preflight`, `upload:cors-fallback`, `upload:http-error`, `upload:success`, `upload:fatal` |
| `createMediaAsset.controller.js` | `media_asset:insert`, `media_asset:insert-failed`, `media_asset:inserted` |
| `recordPostMedia.controller.js` | `writeback:start`, `writeback:post_media`, `writeback:post_media-failed`, `writeback:post_media-skipped`, `writeback:media_asset-failed`, `writeback:done` |
| `recordChatAttachment.controller.js` | `writeback:start`, `writeback:attachment`, `writeback:attachment-failed`, `writeback:attachment-skipped` |
| `submitCreateVport.controller.js` | `writeback:start`, `writeback:profile`, `writeback:profile-skipped`, `writeback:failed` |
| `publishWandersFromBuilder.controller.js` | `writeback:start`, `writeback:card`, `writeback:card-skipped`, `writeback:failed` |
| `cards.controller.js` | `writeback:start`, `writeback:card`, `writeback:failed` |
| `useUploadSubmit.js` | `upload:start`, `upload:done`, `writeback:dispatch`, `writeback:record-failed` |

---

## H — Verification SQL

Run in Supabase dashboard (read-only inspection):

```sql
-- Check write-back columns exist
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE (table_schema, table_name, column_name) IN (
  ('vc',       'post_media',          'media_asset_id'),
  ('chat',     'message_attachments', 'media_asset_id'),
  ('wanders',  'cards',               'media_asset_id'),
  ('vport',    'profiles',            'avatar_media_asset_id')
);

-- Count rows with write-back populated (after at least one upload per domain)
SELECT 'vc.post_media'          AS domain, COUNT(*) FILTER (WHERE media_asset_id IS NOT NULL) AS wired, COUNT(*) AS total FROM vc.post_media
UNION ALL
SELECT 'chat.message_attachments', COUNT(*) FILTER (WHERE media_asset_id IS NOT NULL), COUNT(*) FROM chat.message_attachments
UNION ALL
SELECT 'wanders.cards',            COUNT(*) FILTER (WHERE media_asset_id IS NOT NULL), COUNT(*) FROM wanders.cards
UNION ALL
SELECT 'vport.profiles',           COUNT(*) FILTER (WHERE avatar_media_asset_id IS NOT NULL), COUNT(*) FROM vport.profiles;

-- Latest 10 media_asset rows (confirm inserts are arriving)
SELECT id, scope, media_role, storage_key, created_at
FROM platform.media_assets
ORDER BY created_at DESC
LIMIT 10;

-- Confirm RLS UPDATE policy on chat.message_attachments
SELECT policyname, cmd, qual
FROM pg_policies
WHERE schemaname = 'chat' AND tablename = 'message_attachments' AND cmd = 'UPDATE';
```

---

## I — Build Validation

- `npm run build` → ✓ built in 4.88s, no errors
- No TypeScript files introduced (JS-only project)
- No supabase imports in controller files — confirmed clean
- `cards.controller.js` line count: 297 (under 300 limit)
- Production stub exports match dev implementation exports — confirmed

---

## BUGBUNNY DEBUGGER REGISTRY

BUILDDED BUGBUNNY ON FILE zNOTFORPRODUCTION/debuggers/media/bugBunnyUploadDebugger.js
