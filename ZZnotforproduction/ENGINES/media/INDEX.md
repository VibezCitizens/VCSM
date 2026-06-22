# INDEX — ENGINES / media

Status: ARCHITECT COMPLETE (2026-06-05)
Ticket: TICKET-ARCHITECT-MISSING-0001

## Source Root

`/Users/vcsm/Desktop/VCSM/engines/media/`

## Governance Files

| File | Status |
|------|--------|
| ARCHITECTURE.md | PRESENT |
| CURRENT_STATUS.md | PRESENT |
| CLAUDE.md (engine root) | MISSING — governance gap |
| BEHAVIOR.md | MISSING |
| SECURITY.md | MISSING |

## Source Inventory (as of 2026-06-05)

```
engines/media/
├── index.js                          — entry point → src/index.js
└── src/
    ├── index.js                      — 9 exported symbols
    ├── config.js                     — DI (uploadFn, publicUrlFn)
    ├── config/
    │   ├── uploadScopes.js           — 13 upload scopes
    │   └── uploadLimits.js           — BYTES, BLOCKED_MIMES
    ├── controller/
    │   └── uploadMedia.controller.js — 8-step upload pipeline
    ├── dal/
    │   └── r2Upload.dal.js           — Cloudflare R2 transport (NOT exported)
    ├── hooks/
    │   └── useMediaUpload.js         — React hook (ANOM-MEDIA-001)
    ├── lib/
    │   ├── buildMediaStorageKey.js
    │   ├── classifyMediaFile.js
    │   ├── compressImage.js
    │   └── validateMediaFile.js
    └── model/
        └── mediaUploadResult.model.js
```

Total: 13 files

## ARCHITECT Output

`outputs/2026/06/05/ARCHITECT/engine.media.architecture.md`
