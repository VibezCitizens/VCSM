# ARCHITECTURE — engines/media

**Last ARCHITECT Run:** 2026-06-05
**Ticket:** TICKET-ARCHITECT-MISSING-0001
**Status:** COMPLETE — anomalies found
**Independence:** MOSTLY INDEPENDENT

---

## Engine Purpose

Media upload pipeline. Handles validation (MIME whitelist, size limits, SVG block), client-side image compression, storage key generation, and transport to Cloudflare R2. No database access.

## Source Root

`/Users/vcsm/Desktop/VCSM/engines/media/`

## No CLAUDE.md

Engine has no scope rules document. Governance gap (ANOM-MEDIA-002).

## Public API Alias

`@media` — consumed by VCSM (9+ consumer files). Setup: `apps/VCSM/src/features/media/setup.js`.

## Layer Structure

```
index.js              — entry point → src/index.js
src/
  index.js            — 9 exported symbols
  config.js           — DI (uploadFn, publicUrlFn; no freeze guard)
  config/uploadScopes.js  — 13 named scopes (MIME, maxBytes, compression, prefix)
  config/uploadLimits.js  — BYTES constants + BLOCKED_MIMES
  controller/uploadMedia.controller.js — 8-step pipeline
  dal/r2Upload.dal.js     — calls injected uploadFn (NOT exported)
  hooks/useMediaUpload.js — React hook (ANOMALY: ANOM-MEDIA-001)
  lib/                    — 4 utility libs (key, classify, compress, validate)
  model/mediaUploadResult.model.js — normalized result shape
```

## Infrastructure

**Cloudflare R2 — NOT Supabase.** No SQL queries anywhere in this engine.

## Security Controls

| Control | Status |
|---------|--------|
| MIME whitelist per scope | PASS |
| SVG blocked (BLOCKED_MIMES) | PASS |
| Size limit before + after compression | PASS |
| UUID storage key (collision-proof) | PASS |
| ownerActorId scoped in R2 key | PASS |

## Architecture Anomalies

| ID | Anomaly | Severity |
|----|---------|----------|
| ANOM-MEDIA-001 | React hook in engine | MEDIUM |
| ANOM-MEDIA-002 | No CLAUDE.md | MEDIUM |
| ANOM-MEDIA-003 | vport_avatar scope has no compression (inconsistent) | LOW |
| ANOM-MEDIA-004 | vport_avatar + vport_creation_avatar share same R2 prefix | LOW |

## Known Gaps

- CLAUDE.md: MISSING
- BEHAVIOR.md: MISSING
- SECURITY.md: MISSING
- Zero tests

## Full Report

`ZZnotforproduction/ENGINES/media/outputs/2026/06/05/ARCHITECT/engine.media.architecture.md`
