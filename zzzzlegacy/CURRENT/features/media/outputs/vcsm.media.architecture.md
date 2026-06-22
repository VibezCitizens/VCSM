# MODULE ARCHITECTURE REPORT
# ARCHITECT §26.11 — Dated Immutable Module Report

**Module:** media
**Application Scope:** apps/VCSM
**Module Type:** Feature Module — Media Asset Registry + Engine Bridge
**Primary Root:** apps/VCSM/src/features/media/
**Engine Root:** engines/media/
**Report Generated:** 2026-06-02
**Ticket:** ARCHITECT-MEDIA-0001
**Independence Status:** DEPENDENT (delegates upload transport to @media engine)
**Architecture State:** STABLE
**Completeness Status:** MOSTLY COMPLETE
**Security Tier:** MEDIUM

---

## PURPOSE

Dual role:
1. Wires the `@media` engine (engines/media/) with VCSM-specific Cloudflare R2 upload transport at app startup via `setup.js` (dependency injection pattern).
2. Owns the `platform.media_assets` write path — recording completed upload metadata rows in Supabase after any successful engine upload completes elsewhere in the platform.

The feature is intentionally headless — no routes, screens, hooks, or components. All 10 platform-wide consumer flows call through the feature adapter boundary (`media.adapter.js`) after using the engine's `uploadMediaController` directly.

---

## ENTRY POINTS

- `setup.js` — called once at app startup; configures `@media` engine with Cloudflare transport
- `media.adapter.js` — primary public surface; 10 external callers import from this file
  - Exports: `createMediaAssetController`, `resolveVcsmAppId`, `softDeleteMediaAssetController`
- No routes, screens, or React hooks owned by this feature

---

## LAYER MAP

| Layer | Present | Path | Count |
|---|---|---|---|
| Controllers | YES | apps/VCSM/src/features/media/controller/ | 2 |
| DALs | YES | apps/VCSM/src/features/media/dal/ | 3 |
| Models | YES | apps/VCSM/src/features/media/model/ | 1 |
| Adapters | YES | apps/VCSM/src/features/media/adapters/ | 2 |
| Setup | YES | apps/VCSM/src/features/media/setup.js | 1 |
| Hooks | NO | — | 0 |
| Screens | NO | — | 0 |
| Components | NO | — | 0 |
| Engine controllers | YES | engines/media/src/controller/ | 1 (consumed) |
| Engine DALs | YES | engines/media/src/dal/ | 1 (consumed) |
| Engine hooks | YES | engines/media/src/hooks/ | 1 (consumed) |

---

## CONTROLLERS

| Controller | File | Purpose | Auth Gate |
|---|---|---|---|
| createMediaAssetController | createMediaAsset.controller.js | Records a completed upload as a platform.media_assets row. Resolves app UUID (module-cached), maps scope via SCOPE_MAP, inserts via DAL. | Requires ownerActorId + createdByActorId as caller params. DB RLS (vc.actor_owners) is enforcement layer. No session derivation. |
| softDeleteMediaAssetController | softDeleteMediaAsset.controller.js | Soft-deletes a platform.media_assets row (status = 'deleted'). Validates assetId + actorId, delegates to DAL. | DB RLS WITH CHECK (status='deleted', deleted_by_actor_id IS NOT NULL). Currently DB-blocked — Carnage Plan B not applied. |

**Engine controller (non-owned, consumed by external callers):**

| Controller | File | Purpose |
|---|---|---|
| uploadMediaController | engines/media/src/controller/uploadMedia.controller.js | Full upload pipeline: validate, classify, compress, build storage key, upload to R2 via configured transport, return MediaUploadResult. |

---

## DALs

| DAL | File | Table | Operation | Notes |
|---|---|---|---|---|
| insertMediaAssetDAL | mediaAssets.write.dal.js | platform.media_assets | INSERT | Explicit column projection (22 columns). supabase.schema('platform'). |
| softDeleteMediaAssetDAL | mediaAssets.softDelete.dal.js | platform.media_assets | UPDATE | Fixed payload — 4 columns only. 4-layer defense documented in file. media_assets_vc_owner_update {public} policy coexists (TICKET-PLATFORM-RLS-001). |
| resolveVcsmAppIdDAL | resolveAppId.read.dal.js | platform.apps | SELECT id | Resolves 'vcsm' key to UUID. Module-level cache — one DB call per browser session. |

---

## MODEL

| File | Exports | Purpose |
|---|---|---|
| mediaAsset.model.js | mapUploadResultToMediaAsset, mapMediaAssetRow | Maps MediaUploadResult + caller context to platform.media_assets insert payload via SCOPE_MAP. Maps raw DB row to domain-safe object. Pure functions — no I/O. |

**SCOPE_MAP entries (13 defined):**
`vibe_post`, `story_24drop`, `vdrop`, `user_avatar`, `user_banner`, `vport_avatar`, `vport_banner`, `portfolio_media`, `menu_item_photo`, `chat_attachment`, `design_asset`, `wanders_card`, `vport_creation_avatar`

---

## ADAPTERS

| Adapter | File | Exports | Note |
|---|---|---|---|
| media.adapter.js | media.adapter.js | createMediaAssetController, resolveVcsmAppId, softDeleteMediaAssetController | Primary feature boundary. All 10 external callers import from here. Exports controllers (not hooks/components) — headless utility exception to standard adapter pattern. |
| mediaAppId.adapter.js | mediaAppId.adapter.js | resolveVcsmAppId | Thin wrapper around resolveVcsmAppIdDAL. Re-exported through media.adapter.js. |

---

## ENGINE DEPENDENCIES

| Engine | Import | Used In | Purpose |
|---|---|---|---|
| engines/media (@media alias) | configureMediaEngine | setup.js | Injects Cloudflare R2 transport (uploadToCloudflare, publicUrlForKey) into engine at startup |

Feature does NOT re-export engine internals. Consumers use `@media` alias independently for `uploadMediaController` and `useMediaUpload`.

---

## CONSUMER FLOW MAP (INBOUND CROSS-FEATURE DEPENDENCIES)

| Consumer Feature | File | Scope(s) Used | Import Boundary |
|---|---|---|---|
| settings/profile | useProfileUploads.js | user_avatar, user_banner, vport_avatar, vport_banner | media.adapter.js |
| chat/conversation | recordChatAttachment.controller.js | chat_attachment | media.adapter.js + mediaAppId.adapter.js |
| vport | submitCreateVport.controller.js | vport_creation_avatar | media.adapter.js + mediaAppId.adapter.js |
| dashboard/vport/portfolio | addPortfolioMediaWithRecord.controller.js | portfolio_media | media.adapter.js + mediaAppId.adapter.js |
| dashboard/flyerBuilder | flyerEditor.controller.js | design_asset | media.adapter.js + mediaAppId.adapter.js |
| dashboard/flyerBuilder/designStudio | designStudio.assetsExports.controller.js | design_asset | media.adapter.js + mediaAppId.adapter.js |
| profiles/vport/menu | saveVportActorMenuItem.controller.js | menu_item_photo | media.adapter.js + mediaAppId.adapter.js |
| wanders | publishWandersFromBuilder.controller.js | wanders_card | media.adapter.js + mediaAppId.adapter.js |
| wanders | cards.controller.js | wanders_card | media.adapter.js + mediaAppId.adapter.js |
| upload | recordPostMedia.controller.js | vibe_post | media.adapter.js + mediaAppId.adapter.js |

**Boundary compliance: ENFORCED.** All 10 consumers use adapter boundary exclusively. Zero direct DAL or internal controller imports from outside the feature.

---

## AUTHORIZATION PATTERN

No session-based auth at controller layer. Pattern:

1. **Input validation** — controller rejects missing required params (assetId, actorId, scope, ownerActorId, etc.)
2. **SCOPE_MAP validation (model)** — rejects unknown scope keys before any DB write
3. **DB RLS (database)** — platform.media_assets policies enforce ownership via vc.actor_owners join

**Known gap (VENOM-F2, MITIGATED):** `ownerActorId` is caller-supplied. DB RLS is the sole ownership enforcement. Long-term: derive ownerActorId from authenticated session in controller.

---

## DATABASE SURFACE

| Table / Schema | Operations | Policy Notes |
|---|---|---|
| platform.media_assets | INSERT (createMediaAsset), UPDATE (softDelete) | RLS live (DB audit confirmed 2026-05-19). media_assets_vc_owner_update {public} policy coexists (TICKET-PLATFORM-RLS-001 — Carnage Plan C pending). |
| platform.apps | SELECT id | Read-only app key resolution. Module-level cache. |

---

## KNOWN STRUCTURAL RISKS

| Risk | Severity | Status | Remediation |
|---|---|---|---|
| TICKET-PLATFORM-RLS-001: {public} policy on platform.media_assets | MEDIUM | OPEN | Carnage Plan C — migration not applied |
| Soft-delete DB-blocked (Carnage Plan B) | MEDIUM | DEFERRED | Schema supports soft-delete; DB policy blocks owner UPDATE. Carnage Plan B not applied. |
| SCOPE_MAP governance gap | LOW | OPEN | No documented approver for new SCOPE_MAP entries (IRONMAN finding) |
| ownerActorId caller-supplied | LOW | MITIGATED | DB RLS is enforcement layer; session derivation deferred |
| IIFE swallow pattern (4 callers) | LOW | OPEN | createMediaAssetController called in fire-and-forget IIFEs; write failures silent in production |
| resolveVcsmAppIdDAL cache unobservable | LOW | OPEN | Module-level cache — hit vs miss not distinguishable at runtime (LOKI finding) |

---

## MODULE COMPLETENESS MATRIX

| Area | Status | Evidence | Missing / Risk |
|---|---|---|---|
| Purpose defined | PASS | DR_STRANGE.md, media-system-map.md | None |
| Owner defined | PASS | OWNERSHIP.md, IRONMAN 2026-05-19 | None |
| Entry points mapped | PASS | media.adapter.js — 10 callers confirmed | None |
| Controllers present | PASS | 2 controllers; write + soft-delete | None |
| DAL/repository present | PASS | 3 DALs; INSERT + UPDATE + app-id resolution | None |
| Models/transformers | PASS | mediaAsset.model.js; SCOPE_MAP; 2 pure mappers | SCOPE_MAP approver gap (LOW) |
| Hooks/view models | N/A | Headless utility — intentionally absent | None |
| Screens/components | N/A | Headless utility — intentionally absent | None |
| Authorization path mapped | PARTIAL | DB RLS confirmed; VENOM complete | ownerActorId not session-derived; VENOM-F3/F4 open |
| Engine dependencies mapped | PASS | engines/media documented; setup.js wires transport | None |
| Tests/validation noted | FAIL | 0 test files; SPIDER-MAN not run | Zero coverage — entire controller + model layer untested |

---

## GOVERNANCE EVIDENCE SUMMARY

| Command | Status | Date | Notes |
|---|---|---|---|
| ARCHITECT | NOW COMPLETE | 2026-06-02 | This report |
| VENOM | COMPLETE | 2026-05-19 | F1 RESOLVED, F2 MITIGATED, F3/F4 OPEN |
| ELEKTRA | NOT RUN | — | F3/F4 trace recommended |
| BLACKWIDOW | N/A | — | DAL layer, no native surface |
| SENTRY | COMPLETE | 2026-05-19 | All 7 contract rules PASS |
| IRONMAN | COMPLETE | 2026-05-19 | Ownership CLEAR, SCOPE_MAP gap OPEN |
| SPIDER-MAN | NOT RUN | — | 0 tests |
| KRAVEN | COMPLETE | 2026-05-11 | No performance risk; cache confirmed correct |
| THOR | COMPLETE (RELEASE_READY) | 2026-05-19 | All 8 critical gates PASS |
| CARNAGE | PARTIAL | 2026-05-19 | Plans B/C proposed, NOT applied |
| DB | COMPLETE | 2026-05-19 | RLS live; SCOPE_MAP vs CHECK verified |
| HAWKEYE | NOT RUN | — | — |
| LOGAN | PARTIAL | — | DF-05 filed; vcsm.dal.media.md append pending |

---

## RECOMMENDED HANDOFFS

- **CARNAGE** — Apply Plan B (soft-delete enablement) and Plan C ({public} policy cleanup) for TICKET-PLATFORM-RLS-001. This is the highest-priority remediation.
- **VENOM** — Re-run post-Carnage to verify RLS state after policy cleanup migration.
- **SPIDER-MAN** — Zero test coverage. `mapUploadResultToMediaAsset` and `mapMediaAssetRow` are pure functions — ideal unit test targets. `createMediaAssetController` and `softDeleteMediaAssetController` are well-isolated.
- **ELEKTRA** — Trace VENOM-F3 (recordChatAttachment ownerActorId supply chain) and VENOM-F4 (no controller-layer ownership check) source-to-sink.

---

## FINAL MODULE STATUS

**MOSTLY COMPLETE**

Architecture is sound and release-cleared (THOR RELEASE_READY 2026-05-19). Adapter boundary fully enforced. Write path well-governed. Two deferred DB migrations (Carnage Plans B/C) and zero test coverage are the primary gaps preventing COMPLETE status.

---

## ARCHITECT RUN RECORD
- Date: 2026-06-02
- Ticket: ARCHITECT-MEDIA-0001
- Architecture State: STABLE
- Source Files Scanned: 9 (feature) + 13 (engine)
- Controllers Found: 2 (feature) + 1 (engine, consumed)
- DALs Found: 3 (feature) + 1 (engine, consumed)
- Hooks Found: 0 (feature) + 1 (engine, consumed)
- Engine Dependencies: 1 (engines/media via @media alias)
- External Callers: 10 (all via adapter boundary)
- Open Tickets: TICKET-PLATFORM-RLS-001, Carnage Plan B, SCOPE_MAP governance, DF-05
