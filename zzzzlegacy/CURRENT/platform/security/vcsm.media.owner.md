# VCSM Media Feature — Ownership Record

_Created:_ 2026-05-19  
_IRONMAN pass triggered by:_ CEREBRO verification → DB/Carnage audit on `vcsm.dal.media.md`  
_Ownership Clarity:_ **CLEAR** — single owner, all layers accounted for, no cross-root violations  
_Application Scope:_ VCSM + ENGINE

---

## 1. Purpose

The media feature is a **platform utility layer**. It owns no screens, hooks, or UI components. Its sole responsibility is recording completed media uploads into `platform.media_assets` and resolving the VCSM app UUID from `platform.apps`.

All UI-facing upload behavior (file selection, validation, compression, upload progress) lives in the shared `engines/media` engine. The VCSM media feature is the platform-specific binding between that engine's upload results and the VCSM database.

---

## 2. Application Scope

VCSM + ENGINE

- VCSM app feature: `apps/VCSM/src/features/media/`
- Shared engine consumed: `engines/media/`
- No Wentrex scope. No Traffic scope.

---

## 3. Code Roots

| Root | Purpose |
|---|---|
| `apps/VCSM/src/features/media/` | VCSM-specific media binding — DAL, model, controller, adapters |
| `apps/VCSM/src/features/media/setup.js` | Engine configuration entry point — injects Cloudflare R2 transport |
| `engines/media/` | Shared upload engine — provides `uploadMediaController`, `useMediaUpload`, validation, classification |
| `apps/VCSM/src/services/cloudflare/uploadToCloudflare.js` | Cloudflare R2 upload service — injected via `setup.js` |
| `apps/VCSM/supabase/migrations/20260430300000_create_platform_media_assets.sql` | Schema definition and RLS policies — owned by this feature |

---

## 4. Core Layers

| Layer | File | Status |
|---|---|---|
| **DAL — write** | `dal/mediaAssets.write.dal.js` | PRESENT — `insertMediaAssetDAL` |
| **DAL — read** | `dal/resolveAppId.read.dal.js` | PRESENT — `resolveVcsmAppIdDAL` (module-level cached) |
| **Model** | `model/mediaAsset.model.js` | PRESENT — `mapUploadResultToMediaAsset`, `mapMediaAssetRow`, `SCOPE_MAP` |
| **Controller** | `controller/createMediaAsset.controller.js` | PRESENT — `createMediaAssetController` |
| **Adapter — app-id** | `adapters/mediaAppId.adapter.js` | PRESENT — `resolveVcsmAppId` (wraps DAL for cross-feature use) |
| **Adapter — barrel** | `adapters/media.adapter.js` | PRESENT — re-exports `createMediaAssetController` + `resolveVcsmAppId` |
| **Setup** | `setup.js` | PRESENT — `setupVcsmMediaEngine()` — injects R2 transport into engine |
| **Hook** | — | ABSENT — intentional; no React lifecycle in this feature |
| **Component** | — | ABSENT — intentional; pure infrastructure layer |
| **Screen** | — | ABSENT — intentional; no routes owned |

---

## 5. Engines Used

| Engine | Path | What this feature uses |
|---|---|---|
| `@media` | `engines/media/` | `configureMediaEngine` (in setup.js only) |

External features that need upload behavior import `uploadMediaController` or `useMediaUpload` directly from `@media`. The media feature itself does not import these — it only configures the engine and records the result.

---

## 6. Database / Schema Ownership

| Object | Operation | Owner | Notes |
|---|---|---|---|
| `platform.media_assets` | INSERT | VCSM media feature | Via `insertMediaAssetDAL` — all writes must go through `createMediaAssetController` |
| `platform.media_assets` | SELECT | VCSM media feature (+ all consumers indirectly) | Via RLS — owner reads own assets |
| `platform.apps` | SELECT | VCSM media feature | Via `resolveVcsmAppIdDAL` — cached UUID lookup |

**RLS policies:**
- `"actor owner can insert media asset"` — owned by this feature; WITH CHECK via `vc.actor_owners`
- `"actor owner can select media asset"` — owned by this feature; USING via `vc.actor_owners`
- No UPDATE or DELETE policy exists — soft-delete is pending (Carnage Plan B)

**Migration owner:** VCSM media feature  
Files: `20260430300000_create_platform_media_assets.sql`, `20260430400000_media_asset_writeback_columns.sql`, `20260430500000_profile_media_asset_writeback_columns.sql`

**Schema invariants owned:**
- `storage_key` is UNIQUE — no duplicate uploads
- `scope_type` CHECK constraint — 14 allowed values; all SCOPE_MAP entries are within it
- `owner_actor_id` NOT NULL — every asset has an owner
- `variants` and `meta` are NOT NULL with `{}` default — no null JSONB

---

## 7. Rule Ownership

| Rule | Owner | Enforcement Layer | Risk |
|---|---|---|---|
| All media writes must go through `createMediaAssetController` | VCSM media feature | Adapter boundary (`media.adapter.js`) | LOW — adapter enforced; no external DAL imports remain |
| `owner_actor_id` must be an actor owned by the authenticated user | DB RLS — `"actor owner can insert media asset"` | Database | MITIGATED — DB enforces; controller gap is defense-in-depth only |
| `scope` parameter must be a valid SCOPE_MAP key | `mediaAsset.model.js` | Model (throws on unknown scope) | LOW — validated at model layer |
| `appId` must be a UUID (not the app key string) | `mediaAsset.model.js` | Model (throws if null) | LOW — validated at model layer |
| Cross-feature access must go through `media.adapter.js` | VCSM Architecture Contract | Adapter boundary | CLEAR — RISK-1 resolved |
| `resolveVcsmAppIdDAL` must not be imported directly from other features | VCSM Architecture Contract | Adapter — `mediaAppId.adapter.js` | CLEAR — all 9 external callers migrated |
| `bucket` is always `'post-media'` | `mediaAsset.model.js` | Model (hardcoded) | LOW — schema does not enforce yet (Carnage Plan C pending) |

---

## 8. Contracts Touched

| Contract | Relevance |
|---|---|
| `ARCHITECTURE.md` | Cross-feature access via adapters only — RISK-1 enforces this |
| `PROJECT_BOUNDARY_ISOLATION_CONTRACT.md` | VCSM feature may not import from Wentrex/Traffic |
| `SECURITY_ENGINEERING_CONTRACT.md` | `owner_actor_id` trust boundary — enforced at DB via RLS |

---

## 9. Documentation Links

| Document | Path | Status |
|---|---|---|
| Media DAL governance doc | `logan/vcsm/dal/vcsm.dal.media.md` | CURRENT — 1485 lines, full governance history |
| VENOM trust boundary audit | `CURRENT/features/dashboard/evidence/2026-05-19_venom_media-dal-trust-boundary.md` | CURRENT |
| SENTRY compliance audit | `CURRENT/features/dashboard/evidence/sentry_2026-05-19_media-dal-post-fix-compliance.md` | CURRENT |
| LOKI runtime trace | `CURRENT/features/dashboard/evidence/2026-05-19_loki_media-dal-runtime-trace.md` | CURRENT |
| DB RLS audit | `_HISTORY/db/snapshots/2026-05-19_12-00_db_media-assets-rls-audit.md` | CURRENT |
| Carnage migration plans | `_ACTIVE/audits/migrations/2026-05-19_12-30_carnage_media-assets-rls-and-schema.md` | CURRENT |

---

## 10. Runtime Ownership

| Runtime Flow | Entry Point | Controller | DALs Hit | Pattern |
|---|---|---|---|---|
| Post/vibe upload | `useUploadSubmit` hook | `recordPostMedia.controller` → `createMediaAssetController` | `resolveVcsmAppIdDAL` (cached), `insertMediaAssetDAL` | Blocking await |
| Chat attachment | `useChatAttachmentUpload` hook | `recordChatAttachment.controller` → `createMediaAssetController` | Same DALs | Blocking await |
| Vport creation | `useCreateVport` hook | `submitCreateVport.controller` → `createMediaAssetController` | Same DALs | Non-blocking IIFE |
| Portfolio media | `usePortfolioItemSubmit` hook | `addPortfolioMediaWithRecord.controller` → `createMediaAssetController` | Same DALs | Non-blocking IIFE |
| Design studio | `useDesignStudio` / `useDesignStudioExports` | `designStudio.assetsExports.controller` → `createMediaAssetController` | Same DALs | Non-blocking IIFE |
| Vport menu photo | `useMenuItemPhotoUpload` / `useVportActorMenuItemsMutations` | `saveVportActorMenuItem.controller` → `createMediaAssetController` | Same DALs | Non-blocking |
| Wanders card | `usePublishWandersFromBuilder` / `useWandersCards` | `publishWandersFromBuilder.controller` / `cards.controller` → `createMediaAssetController` | Same DALs | Non-blocking |
| Profile avatar/banner | `useProfileUploads` | `createMediaAsset.controller` (own feature) | Same DALs | Blocking await |

**Hot path note:** `resolveVcsmAppIdDAL` is called by all 10 consumers but only queries DB once per session (module-level cache). All subsequent calls return the cached UUID.

---

## 11. Responsibilities

The VCSM media feature owns:

1. **The canonical write path** to `platform.media_assets` — all media writes across the platform must go through `createMediaAssetController`
2. **The SCOPE_MAP** — defining how engine scope keys map to DB `scope_type`, `scope_domain`, and `owner_source` values
3. **The app UUID resolver** — `resolveVcsmAppIdDAL` and its adapter `resolveVcsmAppId`
4. **The engine transport wire-up** — `setupVcsmMediaEngine()` injects Cloudflare R2 into `engines/media`
5. **The schema** — `platform.media_assets` table definition, indexes, RLS policies, migration files
6. **The public adapter boundary** — `media.adapter.js` is the only approved cross-feature import surface

---

## 12. Boundaries

The VCSM media feature must NOT:

- Own any React hook, component, or screen — UI behavior belongs to the consuming feature or to `engines/media`
- Import from other features' internals — all cross-feature work happens through adapters
- Be imported by other features except through `@/features/media/adapters/media.adapter`
- Import from `engines/media` except in `setup.js` (`configureMediaEngine` only)
- Import from `apps/wentrex` or `apps/Traffic`
- Expose raw DAL functions (`insertMediaAssetDAL`, `resolveVcsmAppIdDAL`) to any external feature

---

## 13. Change Impact Rules

| Change | Must Update |
|---|---|
| SCOPE_MAP entry added | `vcsm.dal.media.md` — media roles table; DB CHECK constraint if new `scope_type` value |
| New external caller added | Caller must import from `media.adapter.js`, not DAL; update Layer Consumer Map in `vcsm.dal.media.md` |
| `platform.media_assets` schema change | Carnage migration plan; DB RLS audit; `vcsm.dal.media.md`; migration file in `supabase/migrations/` |
| Storage provider changed from Cloudflare R2 | `setup.js`; `mediaAsset.model.js` (`storage_provider` hardcode); DB `storage_provider` CHECK constraint may need update |
| Engine `@media` public API changes | `setup.js` may need update; consuming hooks/controllers |

---

## 14. Release Gate Notes

- RISK-1 (cross-feature boundary violation) — RESOLVED (2026-05-11 Codex Fix Pass, verified 2026-05-19)
- Carnage Plan B (soft-delete UPDATE policy) — PENDING VENOM sign-off; non-blocking for current release
- Carnage Plan C (`bucket` NOT NULL) — PENDING production NULL check; non-blocking for current release
- DF-06 (documentation table naming) — PENDING LOGAN correction; non-blocking

---

## 15. Open Ownership Questions

| # | Question | Status |
|---|---|---|
| 1 | Who approves changes to `SCOPE_MAP` when a new media scope is added? | Assign to media feature owner when IRONMAN is accepted |
| 2 | Who owns the decision to add UPDATE/DELETE policy (Carnage Plan B/C)? | Assign to media feature owner |
| 3 | Who owns the soft-delete DAL + controller build (Plan B prerequisite)? | Assign via Wolverine when Plan B is approved |
