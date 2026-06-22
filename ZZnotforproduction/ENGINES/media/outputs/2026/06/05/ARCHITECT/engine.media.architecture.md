# MODULE ARCHITECTURE REPORT

**Module:** engines/media
**Application Scope:** VCSM + ENGINE
**Module Type:** Shared Domain Engine — Media Upload
**Primary Root:** /Users/vcsm/Desktop/VCSM/engines/media/
**ARCHITECT Run Date:** 2026-06-05
**Ticket:** TICKET-ARCHITECT-MISSING-0001

---

## PURPOSE

The media engine owns the client-side media upload pipeline. It handles validation, compression, storage key generation, and transport to Cloudflare R2. It has NO database access — it is purely a file processing and upload engine.

Upload pipeline:
```
1. Validate file (MIME whitelist, size limit, SVG block)
2. Classify as image or video
3. Compress image if scope has compression config (browser-side canvas compression)
4. Re-validate size after compression (prevents bypass via failed compression)
5. Read image dimensions (best-effort, non-fatal)
6. Build UUID-based collision-proof storage key
7. Upload via injected uploadFn (Cloudflare R2)
8. Return normalized MediaUploadResult
```

---

## OWNERSHIP

**Engine Owner:** Platform team
**App Scope:** VCSM (confirmed: `apps/VCSM/src/features/media/setup.js`, 9+ consumer files)
**Infrastructure:** Cloudflare R2 (NOT Supabase Storage)
**No CLAUDE.md** — engine has no scope rules document. Governance gap.

---

## ENTRY POINTS

**Primary:** `engines/media/index.js` → `src/index.js`
**Alias:** `@media` (used in VCSM setup.js)

**Exported surface (9 symbols):**
- `configureMediaEngine` (DI config)
- `uploadMediaController` (main upload orchestrator)
- `useMediaUpload` (React hook — ANOMALY: framework-specific in engine)
- `validateMediaFile`, `validateMediaFiles` (file validation)
- `classifyMediaFile` (image vs video)
- `UPLOAD_SCOPES`, `getScopeConfig` (scope registry)
- `BYTES`, `BLOCKED_MIMES` (upload limits constants)

**NOT exported (by design):** `dalUploadToR2` — transport DAL is intentionally private.

---

## LAYER MAP

```
engines/media/
├── index.js                  — entry point → src/index.js
└── src/
    ├── index.js              — public API (9 exports)
    ├── config.js             — DI (uploadFn, publicUrlFn; no freeze guard)
    ├── config/
    │   ├── uploadScopes.js   — 13 named scopes (MIME, maxBytes, compression, prefix)
    │   └── uploadLimits.js   — BYTES constants + BLOCKED_MIMES list
    ├── controller/
    │   └── uploadMedia.controller.js — 8-step upload pipeline
    ├── dal/
    │   └── r2Upload.dal.js   — calls injected uploadFn + publicUrlFn (NOT exported)
    ├── hooks/
    │   └── useMediaUpload.js — React hook (ANOMALY: framework-specific in engine)
    ├── lib/
    │   ├── buildMediaStorageKey.js  — UUID-based R2 key builder
    │   ├── classifyMediaFile.js     — MIME-based image/video classifier
    │   ├── compressImage.js         — browser canvas compression + dimension reader
    │   └── validateMediaFile.js     — MIME/size/SVG validation
    └── model/
        └── mediaUploadResult.model.js — normalized upload result shape
```

Total: 13 files

---

## MODULE COMPLETENESS MATRIX

| Area | Status | Evidence | Missing / Risk |
|------|--------|----------|----------------|
| Purpose defined | PARTIAL | Code clear; no CLAUDE.md | CLAUDE.md MISSING |
| Owner defined | PARTIAL | VCSM setup.js | — |
| Entry points mapped | PASS | src/index.js, 9 exports; DAL correctly NOT exported | — |
| Controllers present | PASS | uploadMedia.controller.js with full pipeline | — |
| DAL/repository present | PASS | r2Upload.dal.js delegates to DI injectors | — |
| Models/transformers present | PASS | mediaUploadResult.model.js | — |
| DB access | NONE | No database queries — R2 only | Expected for this engine |
| Hooks/view models present | ANOMALY | useMediaUpload.js (React) in engine | Framework-specific in engine |
| Security controls | PASS | MIME whitelist, size limits, SVG block, post-compression re-validate | — |
| Documentation linked | FAIL | No CLAUDE.md, no BEHAVIOR.md, no SECURITY.md | — |
| Tests | NONE | No test files | Validation + compression logic untested |

---

## DEPENDENCY INJECTION

| Point | Required | VCSM Value | Fail Behavior |
|-------|----------|------------|--------------|
| uploadFn | REQUIRED | uploadToCloudflare (from @/services/cloudflare) | Throws: "uploadFn not configured" |
| publicUrlFn | REQUIRED | publicUrlForKey (from @/services/cloudflare) | Throws: "publicUrlFn not configured" |

**No freeze guard** — configureMediaEngine() merges on every call.

**VCSM setup:** `apps/VCSM/src/features/media/setup.js` — wires `uploadToCloudflare` and `publicUrlForKey` from VCSM's Cloudflare service layer. Clean DI boundary.

---

## UPLOAD SCOPES (13 defined)

| Scope | R2 Prefix | Max Size | Compression | Allowed Kinds |
|-------|-----------|---------|-------------|---------------|
| vibe_post | vibes | 50MB | maxDim 1080, q0.8 | image, video |
| story_24drop | stories | 50MB | maxDim 1080, q0.8 | image, video |
| vdrop | vdrops | 50MB | maxDim 1080, q0.8 | image, video |
| user_avatar | avatar-photos | 5MB | maxDim 600, q0.7 | image |
| user_banner | avatar-banners | 5MB | maxDim 1080, q0.8 | image |
| vport_avatar | vport-avatar-photos | 5MB | NONE | image |
| vport_banner | vport-avatar-banners | 5MB | maxDim 1080, q0.8 | image |
| portfolio_media | portfolio | 50MB | maxDim 1080, q0.8 | image, video |
| menu_item_photo | menu-items | 5MB | maxDim 1080, q0.8 | image |
| chat_attachment | vox | 50MB | maxDim 1600, q0.82 | image, video |
| design_asset | design-assets | 10MB | NONE | image |
| wanders_card | wanders | 5MB | maxDim 1080, q0.8 | image |
| vport_creation_avatar | vport-avatar-photos | 5MB | maxDim 600, q0.8 | image |

**NOTE:** `vport_avatar` and `design_asset` have compression = null — original file uploaded as-is. This means no size reduction before upload for these scopes.

---

## SECURITY SURFACE

| Control | Mechanism | Risk |
|---------|-----------|------|
| MIME whitelist | Explicit allowedMimes per scope — no catch-all | PASS |
| SVG blocked | BLOCKED_MIMES list in uploadLimits.js | PASS |
| Size limit | maxBytes enforced before and after compression | PASS |
| Post-compression re-validate | Controller re-checks size after compressImageForScope (step 4) | PASS — prevents compression failure bypass |
| UUID storage key | buildMediaStorageKey uses UUID for collision prevention | PASS |
| No DB writes | Engine writes only to R2 — no SQL injection surface | N/A |
| ownerActorId in key | Storage key includes ownerActorId — R2 path scoped by owner | PASS |
| uploadFn DI | Transport is injected — engine never hardcodes R2 endpoint | PASS |
| No SECURITY.md | VENOM/ELEKTRA blocked | MISSING |

---

## ARCHITECTURE ANOMALIES

### ANOM-MEDIA-001: React Hook in Engine

**Location:** `engines/media/src/hooks/useMediaUpload.js`
**Exported via:** `src/index.js`
**Finding:** React hook in engine — same scope violation pattern as chat (ANOM-CHAT-001) and hydration (ANOM-HYDRATE-001). Engine cannot be used in non-React apps.
**Risk:** Medium — the engine's core functionality (uploadMediaController) is framework-agnostic. Only the hook is React-specific.

### ANOM-MEDIA-002: No CLAUDE.md

**Finding:** No scope rules document. R2 infrastructure dependency not formally documented.
**Risk:** Medium.

### ANOM-MEDIA-003: vport_avatar Has No Compression

**Scope:** `vport_avatar` — compression: null
**Finding:** Vport avatar uploads are not compressed. A 5MB maximum HEIC image uploads at original quality. Inconsistent with user_avatar (which compresses to maxDim 600).
**Risk:** LOW (functional; may impact storage costs and load times for vport avatars specifically).

### ANOM-MEDIA-004: vport_avatar and vport_creation_avatar Share Same R2 Prefix

**Scopes:** vport_avatar (prefix: 'vport-avatar-photos'), vport_creation_avatar (prefix: 'vport-avatar-photos')
**Finding:** Both scopes write to the same R2 path prefix. They differ in maxDim (600 for creation_avatar, no compression for vport_avatar). The UUID key prevents collision but the shared prefix makes it impossible to distinguish creation-phase uploads from ongoing uploads by path alone.
**Risk:** LOW (no functional issue; operational/cleanup concern).

---

## APP CONSUMERS (VCSM)

| File | Symbols Used |
|------|--------------|
| features/media/setup.js | configureMediaEngine |
| features/upload/api/uploadMedia.js | uploadMediaController, UPLOAD_SCOPES |
| features/settings/profile/hooks/useProfileUploads.js | useMediaUpload |
| features/chat/conversation/hooks/useChatAttachmentUpload.js | useMediaUpload |
| features/profiles/kinds/vport/screens/menu/hooks/useMenuItemPhotoUpload.js | useMediaUpload |
| features/wanders/core/controllers/publishWandersFromBuilder.controller.js | uploadMediaController |
| features/wanders/core/controllers/cards.controller.js | uploadMediaController |
| features/dashboard/flyerBuilder/controller/flyerEditor.controller.js | uploadMediaController, UPLOAD_SCOPES |
| features/dashboard/flyerBuilder/designStudio/controller/designStudio.assetsExports.controller.js | uploadMediaController |

---

## BEHAVIOR CONSISTENCY CHECK — engines/media

```
Behavior Consistency Check — engines/media
===========================================
BEHAVIOR.md present: NO
Status: MISSING

Check A (Source without behavior): FINDING
  → 13 files: 8-step pipeline, 13 scopes, browser compression, R2 upload, no BEHAVIOR.md
  → No CLAUDE.md — scope rules absent
  → Severity: P1 (every media upload in VCSM passes through this engine)

Check B, C, D: SKIPPED — no BEHAVIOR.md
```

---

## MODULE INDEPENDENCE STATUS

```
MODULE INDEPENDENCE STATUS
Module: engines/media
Classification: MOSTLY INDEPENDENT
Reason: No DB queries. DI for all infrastructure (R2 transport). Comprehensive MIME and size validation.
  Post-compression re-validation prevents bypass. Storage key is UUID-based.
  Clean separation between controller logic and transport layer.
Blocking anomalies:
  - React hook in engine (ANOM-MEDIA-001) — framework coupling
  - No CLAUDE.md (ANOM-MEDIA-002) — governance gap
  - No BEHAVIOR.md → Blue Team blocked
  - No SECURITY.md → VENOM blocked
  - No tests — validation logic and compression untested
```

---

## RECOMMENDED HANDOFFS

- **WOLVERINE** — Write CLAUDE.md; React hook scope decision (ANOM-MEDIA-001); vport_avatar compression decision (ANOM-MEDIA-003)
- **LOGAN** — Write BEHAVIOR.md, SECURITY.md, CURRENT_STATUS.md governance artifacts
- **ELEKTRA** — DI freeze guard; MIME bypass resistance verification; post-compression re-validate coverage
- **SPIDER-MAN** — validateMediaFile unit tests (MIME, size, SVG, post-compression); scope config tests; buildMediaStorageKey collision tests
- **IRONMAN** — Confirm VCSM-only scope; R2 prefix governance (vport_avatar shared prefix)
