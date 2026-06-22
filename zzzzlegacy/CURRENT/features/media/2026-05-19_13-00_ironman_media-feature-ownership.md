# IRONMAN — Media Feature Ownership Audit

_Date:_ 2026-05-19  
_Application Scope:_ VCSM + ENGINE  
_Triggered by:_ CEREBRO verification pass on `vcsm.dal.media.md`  
_Authority:_ GOVERNANCE_WRITABLE — no source code or schema modified  
_Ownership file created:_ `zNOTFORPRODUCTION/_CANONICAL/logan/marvel/ironman/vcsm.media.owner.md`

---

## IRONMAN TARGET

```
Feature / Engine: VCSM media feature + engines/media engine
Application Scope: VCSM + ENGINE
Reason for ownership review: Ownership was MISSING — no IRONMAN record existed for the media feature.
  The feature is a platform utility layer consumed by 9+ features across the platform.
  Carnage and DB audits require a clear ownership anchor for migration and schema governance decisions.
```

---

## Ownership Clarity Classification

```
Ownership Clarity: CLEAR
Evidence: Single feature directory, single controller, single write path, all layers present.
  Adapter boundary enforced (RISK-1 resolved). No cross-root violations. 7 files, 349 lines total.
Confidence: HIGH
```

---

## RESPONSIBILITY CLASSIFICATION

| Responsibility Type | Owner | Confidence | Notes |
|---|---|---|---|
| Feature ownership | VCSM media feature | HIGH | `apps/VCSM/src/features/media/` |
| Engine ownership | `engines/media` (shared) | HIGH | Sealed engine; VCSM media feature is the consumer/configurator |
| DAL ownership | VCSM media feature | HIGH | Both DAL files owned entirely by this feature |
| Controller ownership | VCSM media feature | HIGH | `createMediaAssetController` is the canonical write path |
| UI ownership | NONE — intentional | HIGH | Feature owns no hooks, components, or screens |
| Runtime ownership | VCSM media feature (write) | HIGH | All 10 consumer flows route through this controller |
| Data ownership | VCSM media feature | HIGH | Owns `platform.media_assets` schema + RLS policies |
| Contract ownership | VCSM Architecture Contract | HIGH | Adapter boundary rule; cross-feature access rules |
| Documentation ownership | VCSM media feature | HIGH | `vcsm.dal.media.md` — governed by this feature |
| Security ownership | DB RLS (owner-scoped) | HIGH | INSERT WITH CHECK via `vc.actor_owners` |
| Migration ownership | VCSM media feature | HIGH | 3 migration files in `supabase/migrations/` |
| Native parity ownership | N/A | HIGH | DAL layer — no native surface |

---

## OWNERSHIP BOUNDARY RISK

| Area | Risk | Reason | Recommended Clarification |
|---|---|---|---|
| `resolveVcsmAppId` cross-feature use | LOW | Adapter boundary enforced — all 9 external callers use adapter | None — resolved |
| `createMediaAssetController` caller trust | LOW | DB RLS enforces `owner_actor_id` ownership; controller-layer gap is defense-in-depth | Optional: add `requireOwnerActorAccess` to controller (Carnage Plan B follow-up) |
| Engine (`@media`) / feature (`media/`) separation | LOW | Clear boundary — feature configures engine in `setup.js` only; no internal engine imports | None |
| SCOPE_MAP governance | MEDIUM | No documented approver for new scope entries; any dev could add a scope that bypasses a missing DB CHECK value | Assign approver in ownership record |
| Soft-delete capability (no UPDATE policy) | MEDIUM | Schema supports soft-delete but DB layer blocks it — owners cannot mark their own assets deleted | Carnage Plan B — assign to media feature owner |

---

## DATA OWNERSHIP REGISTRY

| Object | Primary Owner | Read Consumers | Write Owner | RLS Owner | Migration Owner | Docs Owner |
|---|---|---|---|---|---|---|
| `platform.media_assets` | VCSM media feature | All features with media (chat, upload, vport, dashboard, wanders, profiles) — via SELECT policy | VCSM media feature (via `createMediaAssetController`) | VCSM media feature | VCSM media feature | VCSM media feature (`vcsm.dal.media.md`) |
| `platform.apps` | Platform (service) | VCSM media feature (`resolveVcsmAppIdDAL`) — read-only, cached | N/A — read only from this feature | Not applicable (media feature reads only) | N/A | VCSM media feature (resolver documented in `vcsm.dal.media.md`) |

---

## RULE OWNERSHIP REGISTRY

| Rule | Owner | Enforcement Layer | Docs | Risk |
|---|---|---|---|---|
| All platform media writes go through `createMediaAssetController` | VCSM media feature | Adapter boundary | `vcsm.dal.media.md` | LOW |
| `owner_actor_id` must belong to `auth.uid()` | DB RLS | Database — `vc.actor_owners` join | `2026-05-19_venom_media-dal-trust-boundary.md` | MITIGATED |
| `scope` must be a valid SCOPE_MAP key | VCSM media feature | Model (`mediaAsset.model.js`) | `vcsm.dal.media.md` — SCOPE_MAP section | LOW |
| Cross-feature access via `media.adapter.js` only | Architecture contract | Adapter boundary | `vcsm.dal.media.md` — RISK-1 history | CLEAR |
| Media engine configured once per session | VCSM media feature | `setup.js` — `_configured` guard | `vcsm.dal.media.md` — DF-04 | LOW |
| `storage_key` must be unique | DB constraint | Database — UNIQUE on `storage_key` | Canonical migration | LOW |

---

## RUNTIME OWNERSHIP MAP

| Runtime Flow | Entry Point | Owning Feature | Controllers (chain) | DALs | Pattern |
|---|---|---|---|---|---|
| Post upload | `useUploadSubmit` | upload | `recordPostMedia` → `createMediaAsset` | `resolveVcsmAppIdDAL` (cache), `insertMediaAssetDAL` | Blocking |
| Chat attachment | `useChatAttachmentUpload` | chat | `recordChatAttachment` → `createMediaAsset` | Same | Blocking |
| Vport creation | `useCreateVport` | vport | `submitCreateVport` → `createMediaAsset` | Same | IIFE |
| Portfolio | `usePortfolioItemSubmit` | dashboard/vport | `addPortfolioMediaWithRecord` → `createMediaAsset` | Same | IIFE |
| Design studio | `useDesignStudioExports` | dashboard/flyerBuilder | `designStudio.assetsExports` → `createMediaAsset` | Same | IIFE |
| Vport menu | `useMenuItemPhotoUpload` | profiles | `saveVportActorMenuItem` → `createMediaAsset` | Same | Non-blocking |
| Wanders | `usePublishWandersFromBuilder` | wanders | `publishWandersFromBuilder` / `cards` → `createMediaAsset` | Same | Non-blocking |
| Profile avatar | `useProfileUploads` | media (own) | `createMediaAsset` | Same | Blocking |

_Runtime ownership: INFERRED from import trace (no LOKI prod trace exists)._

---

## CROSS-ROOT OWNERSHIP REVIEW

| Area | Claimed Owner | Actual Root | Boundary Status | Notes |
|---|---|---|---|---|
| `features/media/` | VCSM | `apps/VCSM/src/` | CLEAN | In-scope |
| `engines/media/` | ENGINE (shared) | `engines/` | CLEAN | Engine is sealed; VCSM consumes via `configureMediaEngine` only |
| `platform.media_assets` schema | VCSM | `apps/VCSM/supabase/migrations/` | CLEAN | VCSM-owned schema |
| Cloudflare R2 service (`uploadToCloudflare.js`) | VCSM | `apps/VCSM/src/services/` | CLEAN | App-specific service, not shared |
| No Wentrex or Traffic involvement | — | — | CLEAN | Zero cross-root references |

---

## ENGINE OWNERSHIP REVIEW

| Engine | Owner | Consumers | Public Interfaces | Boundary Risk |
|---|---|---|---|---|
| `engines/media` | ENGINE (shared) | VCSM (9 features import `uploadMediaController` or `useMediaUpload`); VCSM media feature (1 import: `configureMediaEngine` in `setup.js`) | `configureMediaEngine`, `uploadMediaController`, `useMediaUpload`, `validateMediaFile`, `classifyMediaFile`, `UPLOAD_SCOPES`, `BYTES`, `BLOCKED_MIMES` | LOW — engine is sealed; internal R2 DAL not exported |

---

## NATIVE PARITY OWNERSHIP

```
N/A — VCSM media feature is a DAL/controller layer with no direct native surface.
Upload UI behavior lives in `engines/media/src/hooks/useMediaUpload.js` — Falcon governs if native upload differs.
```

---

## VALIDATION CHECKLIST

| Validation Area | Status | Notes |
|---|---|---|
| Code roots identified | COMPLETE | 7 files in `features/media/`; `engines/media/` engine |
| All layers mapped | COMPLETE | DAL, Model, Controller, Adapters, Setup — no Hook/Screen (intentional) |
| Ownership clarity classified | CLEAR | Single owner, no ambiguity |
| Data ownership mapped | COMPLETE | `platform.media_assets` + `platform.apps` |
| Rule ownership mapped | COMPLETE | 6 rules documented |
| Runtime ownership mapped | COMPLETE (inferred) | 8 consumer flows traced |
| Cross-root review | CLEAN | No violations |
| Engine boundary review | CLEAN | Engine correctly sealed |
| Ownership file created | COMPLETE | `vcsm.media.owner.md` |

---

## RECOMMENDED HANDOFFS

| Command | Reason |
|---|---|
| **LOGAN** | Update `vcsm.dal.media.md` to reference new ownership file; apply DF-06 table correction |
| **VENOM** | Sign off on Carnage Plan B (UPDATE policy) — ownership is now clear |
| **THOR** | Ownership is CLEAR — release gate can proceed for media DAL once DF-06 + Plan B resolved |
| **Wolverine** | Assign implementer for Carnage Plan B (soft-delete DAL + controller) and Plan C (bucket NOT NULL) |

---

## FINAL IRONMAN STATUS

```
Ownership Clarity: CLEAR
Boundary Risk: LOW
Release Gate Impact: CLEAR — ownership anchor established; release can proceed pending DF-06 + Plan B
```

---

_IRONMAN completed: 2026-05-19_  
_Files read: 7 source + 1 engine_  
_Ownership file created: vcsm.media.owner.md_  
_Code modified: NONE_
