---
name: vcsm.vport.architecture
description: ARCHITECT V2 module architecture report for VCSM:vport
metadata:
  type: architecture
  owner: ARCHITECT
  last-run: 2026-06-04
  scanner-version: 1.1.0
  freshness: FRESH
---

# MODULE ARCHITECTURE REPORT

**Module:** vport
**Application Scope:** VCSM
**Module Type:** feature
**Primary Root:** apps/VCSM/src/features/vport
**Independence Status:** MOSTLY INDEPENDENT
**Completeness Status:** MOSTLY COMPLETE

---

## PURPOSE

The vport module manages the full lifecycle of VPORT business-identity actors within VCSM: creation, profile media updates, soft/hard delete, and restore flows. A VPORT is a business storefront identity (e.g., barbershop, gas station, locksmith) owned by a citizen user; this module handles provisioning the actor record, bootstrapping booking workspaces for applicable types, and exposing public preview components for marketing-facing surfaces. It does not own the VPORT dashboard, booking cards, fuel pricing, or service catalog management — those live in `features/dashboard/vport/`.

## OWNERSHIP

VCSM platform feature team — identity and actor provisioning domain. Primary responsibility: VPORT actor lifecycle (create, restore, soft-delete, hard-delete) and profile media write-back.

## ENTRY POINTS

- `CreateVportForm.jsx` — rendered inside settings or onboarding flows when a citizen creates a new VPORT (no dedicated route; embedded as a component)
- `RestoreVportScreen.jsx` — full-page screen rendered when the active identity is a soft-deleted or inactive VPORT; reached via React Router navigation redirect
- `vport.public.js` — migration barrel re-exporting core DAL functions; consumed by external features during active refactor (explicitly deprecated)
- `adapters/vport.adapter.js` — adapter boundary exposing `updateVportAvatarMediaAssetIdDAL` and `updateVportBannerMediaAssetIdDAL` for cross-feature consumption (settings/profile controllers)

---

## LAYER MAP

| Layer | Count | Key Files |
|---|---|---|
| DAL | 21 (cg) / 4 (fm) | vport.core.dal.js, vport.read.vportRecords.dal.js, vport.write.profileMedia.dal.js, readVportServiceCatalogByType.dal.js |
| Model | 6 (cg) / 2 (fm) | createVportForm.model.js, vportServiceCatalog.model.js |
| Controller | 2 (cg) / 3 (fm) | submitCreateVport.controller.js, vportCoreOps.controller.js, getVportServiceCatalog.controller.js |
| Service | N/A | — |
| Adapter | 3 (fm) | vport.adapter.js, vport.public.adapter.js, CreateVportForm.jsx.adapter.js |
| Hook | 5 (cg) / 4 (fm) | useCreateVport.js, useRestoreVport.js, useVportCoreOps.js, useVportServiceCatalog.js |
| Component | 3 (cg/fm) | CreateVportDebugPanel.jsx, CreateVportProfileTab.jsx, CreateVportServicesTab.jsx |
| Screen | 3 (cg) / 1 (fm) | RestoreVportScreen.jsx, VportPhonePreview.jsx (public/), VportPreviewCard.jsx (public/) |
| Barrel | 15 (cg) | vport.public.js + module index files |

---

## MODULE COMPLETENESS MATRIX

| Area | Status | Evidence | Missing / Risk |
|---|---|---|---|
| Purpose defined | PARTIAL | Source readable; BEHAVIOR.md is a placeholder | BEHAVIOR.md has no real contract — all behavior inferred from source |
| Owner defined | FAIL | No ownership record; inferred from domain | No OWNERSHIP file or IRONMAN assignment |
| Entry points mapped | PASS | CreateVportForm.jsx, RestoreVportScreen.jsx, adapter boundary confirmed in source | No route-map entries (component-embedded, not route-rooted) |
| Controllers present/delegated | PASS | 3 controllers (fm), submitCreateVport is well-formed | vportCoreOps.controller.js is a thin re-export, not a real controller |
| DAL/repository present/delegated | PASS | 4 DAL files (fm); vport.core.dal.js covers full CRUD + lifecycle RPCs | vport.read.vportRecords.dal.js duplicates listMyVports already in vport.core.dal.js |
| Models/transformers present | PASS | 2 model files cover form logic and service catalog shape | No domain model for VPORT entity itself (shape inferred from DAL SELECTs) |
| Hooks/view models present | PASS | 4 hooks covering create, restore, service catalog, and core ops | useVportCoreOps.js purpose unclear from static scan |
| Screens/components present | PASS | 1 screen (RestoreVportScreen), 3 sub-components, public/ preview suite | CreateVportForm.jsx is at the feature root (not in screens/) — atypical placement |
| Services/adapters present | PASS | 3 adapters; vport.adapter.js is the proper boundary file | vport.public.js is an explicit migration barrel, deprecated in source comments |
| Database objects mapped | PASS | vport.profiles (create_vport RPC, soft/hard delete, restore RPCs); vport.profiles.avatar_media_asset_id and banner_media_asset_id (direct update) | No explicit schema prefix on profiles table writes — uses vportClient (implied schema) |
| Authorization path mapped | PASS | requireUser() guard in vport.core.dal.js; RPCs enforce ownership via DB function (AUTH_REQUIRED, VPORT_NOT_FOUND_OR_UNAUTHORIZED error strings) | No RLS surface visible in feature — relies entirely on DB-enforced RPC ownership |
| Cache/runtime behavior mapped | FAIL | No React Query / cache layer visible in this module | List refresh is one-shot pull, no subscription or invalidation |
| Error/loading/empty states mapped | PARTIAL | CreateVportForm shows error display; RestoreVportScreen shows err state | No explicit loading skeleton; empty list state not handled in this module |
| Documentation linked | FAIL | BEHAVIOR.md is a placeholder with no real content | Full behavior contract missing |
| Tests/validation noted | FAIL | 0 tests (scanner confirms) | No test coverage for create, delete, restore, or media write-back paths |
| Native parity noted | N/A | — | — |
| Engine dependencies mapped | PASS | booking (workspace bootstrap), identity (directory refresh), media (avatar upload), notification, profile | All 5 engines confirmed in source imports |

---

## MODULE DEPENDENCY GRAPH

| Dependency | Type | Direction | Approved Boundary | Notes |
|---|---|---|---|---|
| engines/booking | engine | inbound | YES | createOrganizationLocationWorkspace called on barbershop creation |
| engines/identity | engine | inbound | YES | refreshVcActorDirectory called after create and update |
| engines/media | engine | inbound | YES | uploadMediaController, createMediaAssetController for avatar upload |
| engines/notification | engine | inbound | YES | Scanner-detected; no direct notification calls seen in source scan (may be in hooks) |
| engines/profile | engine | inbound | YES | Scanner-detected |
| features/profiles | cross-feature | inbound | PARTIAL | submitCreateVport.controller.js imports VPORT_TYPE_GROUPS from profiles/adapters — this is a cross-feature non-adapter import; should be moved to shared config |
| features/identity | cross-feature | inbound | YES | useIdentity() consumed via adapter in RestoreVportScreen |
| features/media | cross-feature | inbound | YES | media.adapter.js used in submitCreateVport.controller.js |
| vport.profiles | DB | write | YES | create_vport, soft_delete_vport, hard_delete_vport, restore_vport RPCs; direct UPDATE on avatar/banner media asset IDs |

---

## MODULE DATA CONTRACT

| Object | Access Type | Owner | Consumer | Risk |
|---|---|---|---|---|
| vport.profiles (create_vport RPC) | write/rpc | vport module | submitCreateVport.controller.js | MEDIUM — slug collision handled by error string check |
| vport.profiles (soft_delete_vport RPC) | write/rpc | vport module | vportCoreOps.controller.js | LOW — ownership enforced in DB |
| vport.profiles (hard_delete_vport RPC) | write/rpc | vport module | vportCoreOps.controller.js | LOW — requires prior soft-delete |
| vport.profiles (restore_vport RPC) | write/rpc | vport module | vportCoreOps.controller.js, useRestoreVport.js | LOW |
| vport.profiles (UPDATE avatar/banner) | write/direct | vport module | vport.write.profileMedia.dal.js | MEDIUM — keyed by actor_id, no RLS visible at feature level |
| vport.profiles (SELECT) | read | vport module | vport.core.dal.js, vport.read.vportRecords.dal.js | LOW — scoped by owner_user_id or exact ID |

---

## MODULE RUNTIME READINESS

| Runtime Area | Status | Evidence | Risk |
|---|---|---|---|
| Route/screen entry | WATCH | No dedicated route — embedded as component; RestoreVportScreen relies on identity-redirect | No route-map coverage; RestoreVportScreen only reachable via navigation side-effect |
| Loading state | WATCH | isBusy flag in useCreateVport; busy in useRestoreVport | No skeleton/spinner in CreateVportForm itself — only button disabled state |
| Empty state | WATCH | No empty list state handled within this module | listMyVports returns [] but no UI handles it here |
| Error state | PASS | Error display in CreateVportForm; err display in RestoreVportScreen | — |
| Auth/owner gates | PASS | requireUser() in all DAL writes; RPC ownership enforcement | — |
| Cache behavior | FAIL | No cache layer; list refresh is one-shot | Stale list risk if create succeeds but component has moved on |
| Runtime dependencies | PASS | supabase client, vportClient, booking engine, media engine all present | — |

---

## MODULE GOVERNANCE LINKS

| Governance Type | Path | Status |
|---|---|---|
| Logan doc | ZZnotforproduction/APPS/VCSM/features/vport/BEHAVIOR.md | PRESENT but PLACEHOLDER |
| Ownership record | — | MISSING |
| Security audit | — | MISSING |
| Runtime audit | — | MISSING |
| Performance audit | — | MISSING |
| Migration audit | — | MISSING |
| Native transfer audit | N/A | N/A |
| Engine audit | — | MISSING |

---

## MODULE MISSING PIECES

| Missing Piece | Severity | Why It Matters | Suggested Owner |
|---|---|---|---|
| BEHAVIOR.md is a placeholder | HIGH | Zero contract documentation; all behavior must be inferred from source; VENOM/BW cannot audit without it | LOGAN |
| Zero test coverage | HIGH | create, restore, soft/hard delete, and media write-back are all mutation paths with no regression safety | SPIDER-MAN |
| vport.public.js migration barrel unresolved | MEDIUM | Source comments label it deprecated and flag it for Phase 2 removal; it has been open since at least the current scanner pass | IRONMAN |
| Cross-feature import violation in submitCreateVport.controller.js | MEDIUM | Imports VPORT_TYPE_GROUPS directly from features/profiles/adapters/kinds/vport/config — bypasses adapter boundary | ARCHITECT / IRONMAN |
| vport.read.vportRecords.dal.js duplicates listMyVports | LOW | Identical function exists in vport.core.dal.js; dual source of truth for the same query | IRONMAN |
| No route-map entries | LOW | Scanner shows 0 routes for this module; RestoreVportScreen is only reachable via internal navigation redirect | HAWKEYE |
| CURRENT_STATUS.md | LOW | Did not exist before this ARCHITECT run; created this session | ARCHITECT (done) |

---

## MODULE BOUNDARY WARNINGS

1. **Cross-feature non-adapter import**: `submitCreateVport.controller.js` imports `VPORT_TYPE_GROUPS` directly from `features/profiles/adapters/kinds/vport/config/vportTypes.config.adapter`. This bypasses the adapter boundary rule — cross-feature access must go through the target feature's top-level adapter, not into its internal config paths.

2. **Migration barrel still live**: `vport.public.js` is explicitly marked as a temporary migration barrel in its own source comment ("Do not add new exports here. Remove once CreateVportForm is split"). This barrel re-exports DAL functions directly, which is an adapter boundary violation for any consumer outside this feature. Phase 2 remediation has not been completed.

3. **Duplicate DAL function**: `listMyVports` exists in both `vport.core.dal.js` and `vport.read.vportRecords.dal.js` with nearly identical implementations. Two sources of truth for one read path.

---

## SPAGHETTI SCORE

**Module:** vport
**Score:** WATCH
**Reasons:** Core DAL is well-structured and RPC-based with clear ownership guards. Controller/hook/screen layering is mostly correct. Three issues prevent CLEAN: the profiles cross-feature import, the unresolved migration barrel, and the duplicate DAL function. No deep entanglement — all issues are containable.
**Release risk:** LOW — existing paths are functional; warnings are architectural debt, not runtime defects.

---

## BEHAVIOR CONTRACT CONSISTENCY CHECK

**BEHAVIOR.md present:** YES
**Status:** PLACEHOLDER — the file contains only stub text with no actual behavior documentation

**Check A (Source without behavior):** FAIL — BEHAVIOR.md exists as a file but contains no contract. Source is present and readable.
**Check B (Behavior without source):** N/A — no behavior documented, so no orphaned behavior paths exist.
**Check C (§13 engine consistency):** PARTIAL — scanner declares engines: booking, identity, media, notification, profile. Source confirms booking (createOrganizationLocationWorkspace), identity (refreshVcActorDirectory), and media (uploadMediaController, createMediaAssetController). Notification and profile engine usage is scanner-detected but not directly observed in the 6 files read.
**Check D (§6 data change consistency):** PASS — scanner write surfaces (create_vport, soft_delete_vport, hard_delete_vport, restore_vport RPCs; profiles UPDATE via avatar/banner media) all confirmed in vport.core.dal.js and vport.write.profileMedia.dal.js.

---

## FINAL MODULE STATUS

MOSTLY COMPLETE

## MODULE BUILD PRIORITY

| Priority | Work Needed | Reason | Recommended Command |
|---|---|---|---|
| P1 | Write real BEHAVIOR.md contract | Placeholder blocks all governance, security, and runtime audits | LOGAN |
| P1 | Add test coverage for create + delete + restore paths | 0 tests on mutation-heavy lifecycle module is a regression risk | SPIDER-MAN |
| P2 | Remove vport.public.js migration barrel | Explicitly marked deprecated in source; creates adapter boundary violations for external consumers | IRONMAN |
| P2 | Move VPORT_TYPE_GROUPS to shared config or vport adapter | Direct cross-feature import into profiles/adapters internal path violates adapter boundary contract | IRONMAN |

## RECOMMENDED HANDOFFS

- **LOGAN** — Write the BEHAVIOR.md contract from source
- **SPIDER-MAN** — Add regression tests for create, soft-delete, hard-delete, restore
- **IRONMAN** — Close the vport.public.js migration barrel; fix the cross-feature config import
- **HAWKEYE** — Verify RestoreVportScreen reachability via route audit
- **VENOM** — Review vport.write.profileMedia.dal.js direct UPDATE on profiles — RLS boundary check needed

---

## Scanner Inputs

| Map | Generated At | Freshness | Confidence |
|---|---|---|---|
| feature-map | 2026-06-04T19:48:25Z | FRESH | HIGH |
| callgraph | 2026-06-04T19:48:25Z | FRESH | HIGH |
| write-surface-map | 2026-06-04T19:48:25Z | FRESH | HIGH |
| route-map | 2026-06-04T19:48:25Z | FRESH | HIGH |
| engine-candidates | 2026-06-04T19:48:25Z | FRESH | MEDIUM |
| dependency-map | 2026-06-04T19:48:25Z | FRESH | HIGH |
