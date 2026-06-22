---
type: migration-manifest
date: 2026-04-30T22:29:44
author: Claude Code
status: completed
---

# Migration: Legal Documents DAL → public_legal_documents_v

## File Changed

```
apps/VCSM/src/features/legal/dal/legalDocuments.read.dal.js
```

## Backup

```
zNOTFORPRODUCTION/zcontract/doc/backups/legal-public-documents-view-20260430-222944/legalDocuments.read.dal.js
```

## Raw Reads Removed

| Schema | Table | Removed from |
|---|---|---|
| `platform` | `apps` | `dalGetActiveLegalDocuments`, `dalGetLegalDocument` |
| `platform` | `legal_documents` | `dalGetActiveLegalDocuments`, `dalGetLegalDocument` |

## New View Used

| Schema | View |
|---|---|
| `platform` | `public_legal_documents_v` |

## Exported Functions — Unchanged

| Function | Signature | Return shape |
|---|---|---|
| `dalGetActiveLegalDocuments` | `({ appKey })` | Array of document rows |
| `dalGetLegalDocument` | `({ appKey, documentType, version })` | Single document row or null |

## Column Changes

| Column | Before | After |
|---|---|---|
| `id` | ✅ | ✅ |
| `app_id` | ✅ | ✅ |
| `document_type` | ✅ | ✅ |
| `version` | ✅ | ✅ |
| `title` | ✅ | ✅ |
| `content_url` | ✅ | ✅ |
| `is_active` | ✅ | ✅ |
| `published_at` | ✅ | ✅ |
| `app_key` | ❌ (not returned) | ✅ additive — no callers read it |

## Accepted Behavior Change

Version-specific lookup (`dalGetLegalDocument` with `version` argument) previously
bypassed the `is_active` filter and could return superseded document versions.
The view pre-filters `is_active = true` on both `apps` and `legal_documents`, so
version-specific lookup now only returns currently active versions.

This is correct for the public legal screen. Inactive/superseded document versions
have no business being served publicly.

## Query Simplification

Old: two-step query (apps → resolve app_id → legal_documents)
New: single query against the view using `app_key` directly

## Callers Verified Unaffected

| File | Uses |
|---|---|
| `legalDocument.controller.js` | `dalGetLegalDocument` — shape unchanged |
| `legalConsent.controller.js` | `dalGetActiveLegalDocuments` — accesses `app_id`, `id`, `document_type`, `version` — all present |

## Build Result

```
✓ built in 5.43s
PWA v1.2.0 — 255 entries precached
No errors. No warnings related to this change.
```

## Grep Confirmation

- `platform.apps` raw reads in legal DAL path: **0**
- `platform.legal_documents` raw reads in legal DAL path: **0**
- `platform.public_legal_documents_v` confirmed in DAL: **yes**
